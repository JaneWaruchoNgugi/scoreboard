import { useState, useEffect, useRef, useCallback } from "react";
import { DEFAULT_STATE, DEFAULT_CATEGORIES } from "../../data/categories";
import { saveState, saveTimerState, saveTeams, fetchState, mergeCategories, subscribeToState, serverNow, appendScoreRecord, subscribeToVoiceStats } from "../../firebase";
import type { VoiceStats } from "../../firebase";
import { useAudioControl } from "../../hooks/useAudioControl";
import type { ScoreboardState, TeamSide } from "../../types";
import { AdminTopBar, AdminTabs, PreviewColumn } from "./AdminChrome";
import { AdminTimerView } from "./AdminTimerView";
import { CategoriesCard } from "./CategoriesPanel";
import { ScoreHistoryPanel, ActivityLogPanel, VoiceTrackerPanel } from "./HistoryPanels";
import { QuestionBankCard } from "./QuestionBankCard";
import { TeamsSubTabs } from "./TeamsPanel";
import "../shared/GlobalStyles.css";
import "../../styles/admin.css";

interface Props {
    onBack: () => void;
    username: string;
}

// const QUICK_AMOUNTS = [50,100,150,250, 500, 600, 750,1000, 2000,2500];
// const NEG_AMOUNTS = [-50,-100,-150,-250, -500,-600,-750,-1000,-2000,-2500];
export function AdminView({ onBack, username: _username }: Props) {
    const [state, setState] = useState<ScoreboardState>(DEFAULT_STATE);
    const [scoreHistory, setScoreHistory] = useState<{ a: number; b: number } | null>(null); // undo
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isMuted, setIsMuted] = useState(true);
    const [previewRemaining, setPreviewRemaining] = useState(DEFAULT_STATE.timerDuration);
    const [drafts, setDrafts] = useState({
        teamAName: DEFAULT_STATE.teamA.name,
        teamBName: DEFAULT_STATE.teamB.name,
    });
    const [activeTab, setActiveTab] = useState<"timer" | "categories"|"preview" | "teams" | "bank" | "history" | "activity" | "voice">("teams");

    // Round 1 voice tracking stats — subscribed from Firebase (Bella's phone pushes updates)
    const [voiceStats, setVoiceStats] = useState<VoiceStats>({ correct: 0, wrong: 0, pass: 0 });
    const voiceStatsRef = useRef(voiceStats);

    useEffect(() => { voiceStatsRef.current = voiceStats; }, [voiceStats]);
    useEffect(() => subscribeToVoiceStats(setVoiceStats), []);

    // Lifted scoring selections so keyboard shortcuts stay in sync
    const defaultCorrect = (r: number) => r === 1 ? 100 : r === 2 ? 500 : 0;
    const defaultPenalty = (r: number) => r === 1 ? -50 : r === 2 ? -250 : 0;
    const [aCorrect, setACorrect] = useState(() => defaultCorrect(DEFAULT_STATE.timerRound));
    const [aWrong,   setAWrong]   = useState(() => defaultPenalty(DEFAULT_STATE.timerRound));
    const [aPass,    setAPass]    = useState(() => defaultPenalty(DEFAULT_STATE.timerRound));
    const [bCorrect, setBCorrect] = useState(() => defaultCorrect(DEFAULT_STATE.timerRound));
    const [bWrong,   setBWrong]   = useState(() => defaultPenalty(DEFAULT_STATE.timerRound));
    const [bPass,    setBPass]    = useState(() => defaultPenalty(DEFAULT_STATE.timerRound));

    // Reset point values whenever the round changes, including when the
    // round is picked from the timer-control screen or on first load.
    const lastRoundRef = useRef(DEFAULT_STATE.timerRound);
    useEffect(() => {
        if (state.timerRound === lastRoundRef.current) return;
        lastRoundRef.current = state.timerRound;
        const r = state.timerRound;
        setACorrect(defaultCorrect(r)); setAWrong(defaultPenalty(r)); setAPass(defaultPenalty(r));
        setBCorrect(defaultCorrect(r)); setBWrong(defaultPenalty(r)); setBPass(defaultPenalty(r));
    }, [state.timerRound]);

    const {  pauseAllSounds } = useAudioControl(isMuted);
    const teamANameRef = useRef<HTMLInputElement | null>(null);
    const teamAScoreRef = useRef<HTMLInputElement | null>(null);
    const [pendingQuestion, setPendingQuestion] = useState<{
        categoryId: string;
        question: string;
        answer: string;
    } | null>(null);

    // Handle delayed timer start when question is clicked
    useEffect(() => {
        if (!pendingQuestion) return;

        const timer = setTimeout(async () => {
            await handleTimerStart();
            setPendingQuestion(null);
        }, 4000);

        return () => clearTimeout(timer);
    }, [ pendingQuestion]); // ✅ Only fires when a new question is picked

    // Keyboard shortcuts: A=Team A correct, Z=Team A wrong, K=Team B correct, M=Team B wrong
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if ((e.target as HTMLElement).tagName === "INPUT" || (e.target as HTMLElement).tagName === "TEXTAREA") return;
            if (e.key === "a") adjustScore(aCorrect, "A");
            if (e.key === "z") adjustScore(aWrong, "A");
            if (e.key === "x") adjustScore(aPass, "A");
            if (e.key === "k") adjustScore(bCorrect, "B");
            if (e.key === "m") adjustScore(bWrong, "B");
            if (e.key === ",") adjustScore(bPass, "B");
            if ((e.ctrlKey || e.metaKey) && e.key === "z") handleUndo();
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [aCorrect, aWrong, aPass, bCorrect, bWrong, bPass, state]);

    // Load initial state
    useEffect(() => {
        const load = async () => {
            try {
                const raw = await fetchState();
                if (raw) {
                    const roundDefaults: Record<number, number> = { 1: 150, 2: 30, 3: 60 };
                    const loaded: ScoreboardState = {
                        ...DEFAULT_STATE,
                        ...raw,
                        timerDuration: raw.timerDuration ?? roundDefaults[raw.timerRound ?? 1] ?? 150,
                        categories: raw.categories
                            ? mergeCategories(raw.categories)
                            : DEFAULT_CATEGORIES,
                    };
                    setState(loaded);
                    setDrafts({
                        teamAName: loaded.teamA.name,
                        teamBName: loaded.teamB.name,
                    });
                }
            } catch (err) {
                console.error("Failed to load:", err);
                setError("Failed to load initial state");
            } finally {
                setIsLoading(false);
            }
        };
        load();
    }, []);

    // Keep timer controls in sync with the Rania timer view without replacing local score edits.
    useEffect(() => {
        return subscribeToState((data) => {
            if (!data) return;
            setState((current) => ({
                ...current,
                timerDuration: data.timerDuration,
                timerStartedAt: data.timerStartedAt,
                timerRunning: data.timerRunning,
                timerRound: data.timerRound,
                timerElapsed: data.timerElapsed || 0,
                // Rania's round change also clears the active question/answer;
                // pick that up so our next save doesn't bring them back.
                activeCategory: data.activeCategory,
                showAnswer: data.showAnswer,
                lastUpdated: data.lastUpdated,
            }));
        });
    }, []);

    // Preview timer countdown
    useEffect(() => {
        setIsMuted(!state.timerRunning);
    }, [state.timerRunning]);

    useEffect(() => {
        if (!state.timerRunning || state.timerStartedAt === null) {
            setPreviewRemaining(
                state.timerStartedAt !== null && !state.timerRunning
                    ? Math.max(0, state.timerDuration - (state.timerElapsed || 0))
                    : state.timerDuration
            );
            return;
        }

        const tick = () => {
            const elapsed = (serverNow() - state.timerStartedAt!) / 1000;
            setPreviewRemaining(Math.max(0, state.timerDuration - elapsed));
        };

        tick();
        const id = setInterval(tick, 250);
        return () => clearInterval(id);
    }, [state.timerRunning, state.timerStartedAt, state.timerDuration, state.timerElapsed]);

    // State management
    const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const pushState = async (next: ScoreboardState) => {
        setState(next);
        setSaved(false);
        try {
            await saveState(next);
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to save");
        }
    };

    // Debounced save — used for rapid score adjustments to avoid a Firebase write per click
    const debouncedSave = useCallback((next: ScoreboardState) => {
        setState(next);
        setSaved(false);
        if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
        saveTimerRef.current = setTimeout(async () => {
            try {
                // Only write teams: this save fires 600 ms later, and a full
                // write would undo a timer start/stop made in the meantime.
                await saveTeams(next);
                setSaved(true);
                setTimeout(() => setSaved(false), 2000);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to save");
            }
        }, 600);
    }, []);

    const handleFocus = (e: React.FocusEvent<HTMLInputElement | null>) => e.target.select();

    // Team management
    const commitTeamName = (side: TeamSide) => {
        const name = side === "A" ? drafts.teamAName : drafts.teamBName;
        setState((p) => {
            const next = side === "A"
                ? { ...p, teamA: { ...p.teamA, name } }
                : { ...p, teamB: { ...p.teamB, name } };
            debouncedSave(next);
            return next;
        });
    };

    const handleScoreChange = (side: TeamSide, val: string) => {
        const v = val === "" ? 0 : parseInt(val, 10);
        if (isNaN(v)) return;
        const clamped = Math.max(-999999, Math.min(999999, v));
        setState((p) => {
            const next = side === "A"
                ? { ...p, teamA: { ...p.teamA, score: clamped } }
                : { ...p, teamB: { ...p.teamB, score: clamped } };
            debouncedSave(next);
            return next;
        });
    };

    const adjustScore = (amount: number, side: TeamSide) => {
        setState((p) => {
            setScoreHistory({ a: p.teamA.score, b: p.teamB.score }); // save for undo
            const next = side === "A"
                ? { ...p, teamA: { ...p.teamA, score: Math.max(-999999, Math.min(999999, p.teamA.score + amount)) } }
                : { ...p, teamB: { ...p.teamB, score: Math.max(-999999, Math.min(999999, p.teamB.score + amount)) } };
            debouncedSave(next);
            return next;
        });
    };

    const handleUndo = () => {
        if (!scoreHistory) return;
        setState((p) => {
            const next = { ...p, teamA: { ...p.teamA, score: scoreHistory.a }, teamB: { ...p.teamB, score: scoreHistory.b } };
            debouncedSave(next);
            return next;
        });
        setScoreHistory(null);
    };

    // Write only timer fields so a timer action never overwrites scores
    // being changed at the same moment.
    const pushTimer = async (next: ScoreboardState) => {
        setState(next);
        setSaved(false);
        try {
            await saveTimerState({
                timerDuration: next.timerDuration,
                timerStartedAt: next.timerStartedAt,
                timerRunning: next.timerRunning,
                timerRound: next.timerRound,
                timerElapsed: next.timerElapsed,
                lastUpdated: next.lastUpdated,
            });
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to save");
        }
    };

    // Timer management
    const handleSelectRound = async (round: number) => {
        pauseAllSounds();
        await pushState({
            ...state,
            timerRound: round,
            timerDuration: round === 1 ? 150 : round === 2 ? 30 : 60,
            timerStartedAt: null,
            timerRunning: false,
            timerElapsed: 0,
            activeCategory: null,
            showAnswer: false,
            lastUpdated: Date.now(),
        });
        setACorrect(defaultCorrect(round)); setAWrong(defaultPenalty(round)); setAPass(defaultPenalty(round));
        setBCorrect(defaultCorrect(round)); setBWrong(defaultPenalty(round)); setBPass(defaultPenalty(round));
    };

    const handleSelectDuration = async (duration: number) => {
        pauseAllSounds();
        await pushTimer({
            ...state,
            timerDuration: duration,
            timerStartedAt: null,
            timerRunning: false,
            timerElapsed: 0,
            lastUpdated: Date.now(),
        });
    };

    const handleTimerStart = async () => {
        setIsMuted(false);

        const ns: ScoreboardState = state.timerStartedAt && !state.timerRunning
            ? { // Resuming from pause
                ...state,
                timerStartedAt: serverNow() - (state.timerElapsed || 0) * 1000,
                timerRunning: true,
                timerElapsed: 0,
                lastUpdated: Date.now()
            }
            : { // Fresh start
                ...state,
                timerStartedAt: serverNow(),
                timerRunning: true,
                timerElapsed: 0,
                lastUpdated: Date.now()
            };

        await pushTimer(ns);
    };

    const handleTimerStop = async () => {
        pauseAllSounds();
        setIsMuted(true);
        // Already paused: keep the stored elapsed time instead of recomputing it.
        if (!state.timerRunning) return;
        const elapsed = state.timerStartedAt ? (serverNow() - state.timerStartedAt) / 1000 : 0;

        await pushTimer({
            ...state,
            timerRunning: false,
            timerElapsed: elapsed,
            lastUpdated: Date.now(),
        });
    };

    const handleTimerReset = async () => {
        if (!confirm("Reset the timer?")) return;
        pauseAllSounds();
        setIsMuted(true);
        await pushTimer({
            ...state,
            timerStartedAt: null,
            timerRunning: false,
            timerElapsed: 0,
            lastUpdated: Date.now()
        });
    };

    const handleClearScores = async () => {
        if (!confirm("⚠️ Clear both team scores to 0? This cannot be undone.")) return;
        await pushState({
            ...state,
            teamA: { ...state.teamA, score: 0 },
            teamB: { ...state.teamB, score: 0 },
            lastUpdated: Date.now(),
        });
    };

    const handlePublish = async () => {
        setSaving(true);
        setError(null);
        try {
            const updated = { ...state, lastUpdated: Date.now() };
            await saveState(updated);
            await appendScoreRecord({
                timestamp: Date.now(),
                teamAName: state.teamA.name,
                teamBName: state.teamB.name,
                teamAScore: state.teamA.score,
                teamBScore: state.teamB.score,
                period: state.period,
            });
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to save");
        } finally {
            setSaving(false);
        }
    };

    const previewSecs = Math.ceil(previewRemaining);
    const timerIsWarn = previewSecs <= 10 && previewSecs > 0 && state.timerRunning;
    const timerIsEnd = previewSecs <= 0;
    const countdownCls = timerIsWarn
        ? "timer-preview__countdown timer-preview__countdown--warning"
        : timerIsEnd
            ? "timer-preview__countdown timer-preview__countdown--end"
            : "timer-preview__countdown timer-preview__countdown--normal";

    if (isLoading) {
        return (
            <div className="admin-loading">
                <div className="admin-loading__text">Loading…</div>
            </div>
        );
    }

    return (
        <div className="admin-page">
            <AdminTopBar
                onBack={onBack}
                // isMuted={isMuted}
                // audioEnabled={audioEnabled}
                // onTestSound={() => { playSound("tenSecTingSnd"); setAudioEnabled(true); }}
            />

            <AdminTabs activeTab={activeTab} onTabChange={setActiveTab} />

            <div className="admin-content-main">

                {activeTab === "preview" && (
                    <PreviewColumn state={state} />
                )}
                {activeTab === "timer" && (
                    <AdminTimerView
                        state={state}
                        onSelectRound={handleSelectRound}
                        onSelectDuration={handleSelectDuration}
                        onTimerStart={handleTimerStart}
                        onTimerStop={handleTimerStop}
                        onTimerReset={handleTimerReset}
                        previewRemaining={previewRemaining}
                        timerIsEnd={timerIsEnd}
                        countdownCls={countdownCls}
                        onFocus={handleFocus}
                    />
                )}
                {activeTab === "teams" && (
                <div className="admin-right-col">
                    <div className="timer-categories-container">
                        <AdminTimerView
                            state={state}
                            onSelectRound={handleSelectRound}
                            onSelectDuration={handleSelectDuration}
                            onTimerStart={handleTimerStart}
                            onTimerStop={handleTimerStop}
                            onTimerReset={handleTimerReset}
                            previewRemaining={previewRemaining}
                            timerIsEnd={timerIsEnd}
                            countdownCls={countdownCls}
                            onFocus={handleFocus}
                        />
                        <TeamsSubTabs
                            state={state}
                            drafts={drafts}
                            setDrafts={setDrafts}
                            onCommitTeamName={commitTeamName}
                            onScoreChange={handleScoreChange}
                            onAdjustScore={adjustScore}
                            onFocus={handleFocus}
                            teamANameRef={teamANameRef}
                            teamAScoreRef={teamAScoreRef}
                            onClearScores={handleClearScores}
                            onAddSpinsToMain={async (a, b) => {
                                await pushState({
                                    ...state,
                                    teamA: { ...state.teamA, score: state.teamA.score + a },
                                    teamB: { ...state.teamB, score: state.teamB.score + b },
                                    lastUpdated: Date.now(),
                                });
                            }}
                            error={error}
                            saved={saved}
                            saving={saving}
                            onPublish={handlePublish}
                            onReset={handleTimerReset}
                            onUndo={handleUndo}
                            canUndo={!!scoreHistory}
                            scoringA={{ correct: aCorrect, wrong: aWrong, pass: aPass, setCorrect: setACorrect, setWrong: setAWrong, setPass: setAPass }}
                            scoringB={{ correct: bCorrect, wrong: bWrong, pass: bPass, setCorrect: setBCorrect, setWrong: setBWrong, setPass: setBPass }}
                        />
                    </div>
                </div>
                )}
                {activeTab === "categories" && (
                    <CategoriesCard
                        state={state}
                        categories={state.categories || DEFAULT_CATEGORIES}
                        onPushState={pushState}
                        pendingQuestion={pendingQuestion}
                        setPendingQuestion={setPendingQuestion}
                        // onTimerStop={handleTimerStop}
                    />
                )}
                {activeTab === "bank" && (
                    <QuestionBankCard
                        state={state}
                        onSave={async (nc) => pushState({ ...state, categories: nc, lastUpdated: Date.now() })}
                    />
                )}
                {activeTab === "history" && (
                    <ScoreHistoryPanel />
                )}
                {activeTab === "activity" && (
                    <ActivityLogPanel />
                )}
                {activeTab === "voice" && (
                    <VoiceTrackerPanel stats={voiceStats} />
                )}

            </div>
        </div>
    );
}
