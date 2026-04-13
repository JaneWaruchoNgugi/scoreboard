import { useState, useEffect, useRef, useCallback } from "react";
import "../shared/GlobalStyles.css";
import { ScoreboardDisplay } from "../shared/ScoreboardDisplay";
import { ControlCard } from "../shared/ControlCard";
import { QuestionBankCard } from "./QuestionBankCard";
import { useAudioControl } from "../../hooks/useAudioControl";
import { saveState, fetchState, mergeCategories, appendScoreRecord, fetchScoreHistory, clearScoreHistory, saveScoreHistory, fetchActivityLog, clearActivityLog } from "../../firebase";
import type { ScoreRecord, ActivityEntry } from "../../firebase";
import { DEFAULT_STATE, DEFAULT_CATEGORIES } from "../../data/categories";
import type { ScoreboardState, Category, TeamSide, QuestionEntry } from "../../types";

import "../../styles/admin.css";

interface Props {
    onBack: () => void;
    username: string;
}

// const QUICK_AMOUNTS = [50,100,150,250, 500, 600, 750,1000, 2000,2500];
// const NEG_AMOUNTS = [-50,-100,-150,-250, -500,-600,-750,-1000,-2000,-2500];
const R1_DURATIONS = [150];
const R2_DURATIONS = [20,25,30,35,40];
const R3_DURATIONS = [60];

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
    const [activeTab, setActiveTab] = useState<"timer" | "categories"|"preview" | "teams" | "bank" | "history" | "activity">("teams");

    // Lifted scoring selections so keyboard shortcuts stay in sync
    const defaultCorrect = (r: number) => r === 1 ? 100 : r === 2 ? 500 : 0;
    const defaultPenalty = (r: number) => r === 1 ? -50 : r === 2 ? -250 : 0;
    const [aCorrect, setACorrect] = useState(() => defaultCorrect(DEFAULT_STATE.timerRound));
    const [aWrong,   setAWrong]   = useState(() => defaultPenalty(DEFAULT_STATE.timerRound));
    const [aPass,    setAPass]    = useState(() => defaultPenalty(DEFAULT_STATE.timerRound));
    const [bCorrect, setBCorrect] = useState(() => defaultCorrect(DEFAULT_STATE.timerRound));
    const [bWrong,   setBWrong]   = useState(() => defaultPenalty(DEFAULT_STATE.timerRound));
    const [bPass,    setBPass]    = useState(() => defaultPenalty(DEFAULT_STATE.timerRound));

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
                        timerDuration: roundDefaults[raw.timerRound ?? 1] ?? 150,
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
            const e = (Date.now() - (state.timerStartedAt as number)) / 1000;
            setPreviewRemaining(Math.max(0, state.timerDuration - e));
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
                await saveState(next);
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

    // Timer management
    const handleSelectRound = (round: number) => {
        pauseAllSounds();
        setState((p) => ({
            ...p,
            timerRound: round,
            timerDuration: round === 1 ? 150 : (round === 2 ? 30 : 60),
            timerStartedAt: null,
            timerRunning: false,
            timerElapsed: 0,
            activeCategory: null,
            showAnswer: false,
        }));
        setACorrect(defaultCorrect(round)); setAWrong(defaultPenalty(round)); setAPass(defaultPenalty(round));
        setBCorrect(defaultCorrect(round)); setBWrong(defaultPenalty(round)); setBPass(defaultPenalty(round));
        setSaved(false);
    };

    const handleSelectDuration = (d: number) => {
        pauseAllSounds();
        setState((p) => ({ ...p, timerDuration: d, timerStartedAt: null, timerRunning: false }));
        setSaved(false);
    };

    const handleTimerStart = async () => {
        setIsMuted(false);

        const ns: ScoreboardState = state.timerStartedAt && !state.timerRunning
            ? { // Resuming from pause
                ...state,
                timerStartedAt: Date.now() - (state.timerElapsed || 0) * 1000,
                timerRunning: true,
                timerElapsed: 0,
                lastUpdated: Date.now()
            }
            : { // Fresh start
                ...state,
                timerStartedAt: Date.now(),
                timerRunning: true,
                timerElapsed: 0,
                lastUpdated: Date.now()
            };

        await pushState(ns);
    };

    const handleTimerStop = async () => {
        pauseAllSounds();
        setIsMuted(true);

        const elapsed = state.timerStartedAt ? (Date.now() - state.timerStartedAt) / 1000 : 0;
        await pushState({
            ...state,
            timerRunning: false,
            timerElapsed: elapsed,
            lastUpdated: Date.now()
        });
    };

    const handleTimerReset = async () => {
        pauseAllSounds();
        setIsMuted(true);
        await pushState({
            ...state,
            timerStartedAt: null,
            timerRunning: false,
            timerElapsed: 0,
            lastUpdated: Date.now()
        });
    };

    const handleClearScores = async () => {
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
                {activeTab === "teams" && (
                <div className="admin-right-col">
                    <div className="timer-categories-container">
                            <TimerCard
                                state={state}
                                categories={state.categories || DEFAULT_CATEGORIES}
                                onPushState={pushState}
                                onSelectRound={handleSelectRound}
                                onSelectDuration={handleSelectDuration}
                                onTimerStart={handleTimerStart}
                                onTimerStop={handleTimerStop}
                                onTimerReset={handleTimerReset}
                                previewRemaining={previewRemaining}
                                timerIsEnd={timerIsEnd}
                                countdownCls={countdownCls}
                                onFocus={handleFocus}
                                pendingQuestion={pendingQuestion}
                                setPendingQuestion={setPendingQuestion}
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

            </div>
        </div>
    );
}

// Extracted Components with proper interfaces
interface TopBarProps {
    onBack: () => void;
    // isMuted: boolean;
    // audioEnabled: boolean;
    // onTestSound: () => void;
}

function AdminTopBar({ onBack }: TopBarProps) {
    return (
        <div className="admin-topbar">
            <button className="btn admin-topbar__back" onClick={onBack}>← Back</button>
            <div className="admin-topbar__title">OPERATOR Charles</div>
            <div className="admin-topbar__actions">
                {/*<button*/}
                {/*    onClick={onTestSound}*/}
                {/*    className={`sound-btn ${audioEnabled ? "sound-btn--enabled" : "sound-btn--disabled"}`}*/}
                {/*>*/}
                {/*    <span className={`sound-btn__dot ${audioEnabled ? "sound-btn__dot--active" : "sound-btn__dot--inactive"}`} />*/}
                {/*    {audioEnabled ? "SOUND ON" : "CLICK TO TEST SOUND"}*/}
                {/*</button>*/}
                {/*<div className={`status-pill ${isMuted ? "status-pill--muted" : "status-pill--active"}`}>*/}
                {/*    <span className={`status-pill__dot ${isMuted ? "status-pill__dot--muted" : "status-pill__dot--live"}`} />*/}
                {/*    {isMuted ? "SOUND MUTED" : "SOUND ACTIVE"}*/}
                {/*</div>*/}
                <div className="status-pill status-pill--active"> FIREBASE SYNC ACTIVE</div>
            </div>
        </div>
    );
}

interface TabsProps {
    activeTab: "timer" | "categories" | "teams" | "bank" | "preview" | "history" | "activity";
    onTabChange: (tab: "timer" | "categories" | "teams" | "bank" | "preview" | "history" | "activity") => void;
}

function AdminTabs({ activeTab, onTabChange }: TabsProps) {
    const tabs = [
        { id: "preview" as const, icon: "👥", label: "Preview Scores" },
        { id: "teams" as const, icon: "⏱️", label: "TEAMS" },
        { id: "history" as const, icon: "📊", label: "SCORE HISTORY" },
        { id: "activity" as const, icon: "📋", label: "ACTIVITY LOG" },
    ];

    return (
        <div className="admin-tabs">
            {tabs.map((tab) => (
                <button
                    key={tab.id}
                    onClick={() => onTabChange(tab.id)}
                    className={`admin-tab ${activeTab === tab.id ? "admin-tab--active" : ""}`}
                >
                    {tab.icon} {tab.label}
                </button>
            ))}
        </div>
    );
}

interface PreviewColumnProps {
    state: ScoreboardState;
}

function PreviewColumn({ state }: PreviewColumnProps) {
    return (
        <div className="preview-col">
            <div className="preview-col__label">LIVE PREVIEW</div>
            <ScoreboardDisplay state={state} showScores={true}/>
            <div className="preview-col__hint">Click PUBLISH to push scores to all viewers instantly</div>
        </div>
    );
}

interface TimerCardProps {
    state: ScoreboardState;
    categories: Category[];
    onPushState: (state: ScoreboardState) => Promise<void>;
    onSelectRound: (round: number) => void;
    onSelectDuration: (duration: number) => void;
    onTimerStart: () => Promise<void>;
    onTimerStop: () => Promise<void>;
    onTimerReset: () => Promise<void>;
    previewRemaining: number;
    timerIsEnd: boolean;
    countdownCls: string;
    onFocus: (e: React.FocusEvent<HTMLInputElement | null>) => void;
    pendingQuestion: {
        categoryId: string;
        question: string;
        answer: string;
    } | null;
    setPendingQuestion: React.Dispatch<React.SetStateAction<{
        categoryId: string;
        question: string;
        answer: string;
    } | null>>;
}

function TimerCard({
                       state,
                       // categories,
                       // onPushState,
                       onSelectRound,
                       onSelectDuration,
                       onTimerStart,
                       onTimerStop,
                       onTimerReset,
                       previewRemaining,
                       timerIsEnd,
                       countdownCls,
                       onFocus,
                       // pendingQuestion,
                       // setPendingQuestion
                   }: TimerCardProps) {
    const previewSecs = Math.ceil(previewRemaining);
    const formatTime = (seconds: number) => seconds <= 0 ? "0" : seconds.toString();

    return (
        <ControlCard accent="var(--green)" title="ROUND TIMER">
            <div className="timer-card__content">
                <RoundSelector
                    currentRound={state.timerRound}
                    onSelectRound={onSelectRound}
                />

                <DurationSelector
                    round={state.timerRound}
                    currentDuration={state.timerDuration}
                    onSelectDuration={onSelectDuration}
                    onFocus={onFocus}
                    isRunning={state.timerRunning}
                />

                <TimerDisplay
                    isRunning={state.timerRunning}
                    hasStarted={state.timerStartedAt !== null}
                    round={state.timerRound}
                    duration={state.timerDuration}
                    remaining={previewSecs}
                    isEnd={timerIsEnd}
                    countdownClass={countdownCls}
                    pausedAt={state.timerStartedAt && !state.timerRunning ? previewSecs : null}
                    formatTime={formatTime}
                />
                <TimerControls
                    isRunning={state.timerRunning}
                    hasStarted={state.timerStartedAt !== null}
                    isEnd={timerIsEnd}
                    onStart={onTimerStart}
                    onStop={onTimerStop}
                    onReset={onTimerReset}
                />

                {state.timerRound === 2 && (
                    <RoundTwoPanel
                        // state={state}
                        // categories={categories}
                        // onPushState={onPushState}
                        // pendingQuestion={pendingQuestion}
                        // setPendingQuestion={setPendingQuestion}
                        // onTimerStop={onTimerStop}
                    />
                )}
            </div>
        </ControlCard>
    );
}

interface RoundSelectorProps {
    currentRound: number;
    onSelectRound: (round: number) => void;
}

function RoundSelector({ currentRound, onSelectRound }: RoundSelectorProps) {
    return (
        <div>
            <label className="field-label">SELECT ROUND</label>
            <div className="round-selector">
                {[1, 2,3].map((r) => (
                    <button
                        key={r}
                        className={`btn round-btn ${currentRound === r ? "round-btn--active" : "round-btn--idle"}`}
                        onClick={() => onSelectRound(r)}
                    >
                        ROUND {r}
                    </button>
                ))}
            </div>
        </div>
    );
}

interface DurationSelectorProps {
    round: number;
    currentDuration: number;
    onSelectDuration: (duration: number) => void;
    onFocus: (e: React.FocusEvent<HTMLInputElement | null>) => void;
    isRunning: boolean;
}

function DurationSelector({ round, currentDuration, onSelectDuration, onFocus, isRunning }: DurationSelectorProps) {
    const durations = round === 1 ? R1_DURATIONS :( round===2 ? R2_DURATIONS: R3_DURATIONS);
    const [draft, setDraft] = useState(currentDuration.toString());

    // sync when a preset button changes the duration externally
    useEffect(() => { setDraft(currentDuration.toString()); }, [currentDuration]);

    return (
        <>
            <div>
                <label className="field-label">DURATION — ROUND {round} OPTIONS</label>
                <div className="duration-grid">
                    {durations.map((d: number) => (
                        <button
                            key={d}
                            className={`btn duration-btn ${currentDuration === d ? "duration-btn--active" : "duration-btn--idle"}`}
                            onClick={() => onSelectDuration(d)}
                        >
                            {d}s
                        </button>
                    ))}
                </div>
            </div>

            <div>
                <label className="field-label">CUSTOM DURATION (SECONDS)</label>
                <input
                    type="number"
                    className="duration-input"
                    value={draft}
                    onChange={(e) => {
                        setDraft(e.target.value);
                        const v = parseInt(e.target.value, 10);
                        if (!isNaN(v) && v > 0) onSelectDuration(v);
                    }}
                    onFocus={onFocus}
                    disabled={isRunning}
                />
            </div>
        </>
    );
}

interface TimerDisplayProps {
    isRunning: boolean;
    hasStarted: boolean;
    round: number;
    duration: number;
    remaining: number;
    isEnd: boolean;
    countdownClass: string;
    pausedAt: number | null;
    formatTime: (seconds: number) => string;
}

function TimerDisplay({ isRunning, hasStarted, round, duration, remaining, isEnd, countdownClass, pausedAt, formatTime }: TimerDisplayProps) {
    return (
        <div className="timer-preview">
            <div>
                <div className="timer-preview__info" style={{ marginBottom: 4, letterSpacing: "0.15em" }}>
                    {isRunning ? "RUNNING" : hasStarted ? "PAUSED" : "READY"}
                </div>
                <div className={countdownClass}>
                    {isEnd ? "0" : formatTime(remaining)}
                    <span className="timer-preview__unit">SEC</span>
                </div>
            </div>
            <div className="timer-preview__meta">
                <div className={`timer-preview__status ${isRunning && !isEnd ? "timer-preview__status--running" : "timer-preview__status--idle"}`}>
                    {isEnd ? "⏹ FINISHED" : isRunning ? "▶ RUNNING" : hasStarted ? "⏸ PAUSED" : "⏸ READY"}
                </div>
                <div className="timer-preview__info">
                    RND {round} · {duration}s
                    {pausedAt !== null && (
                        <span style={{ color: "var(--amber)", marginLeft: 8 }}>
                            (Paused at {formatTime(pausedAt)}s)
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}

interface TimerControlsProps {
    isRunning: boolean;
    hasStarted: boolean;
    isEnd: boolean;
    onStart: () => Promise<void>;
    onStop: () => Promise<void>;
    onReset: () => Promise<void>;
}

function TimerControls({ isRunning, hasStarted, isEnd, onStart, onStop, onReset }: TimerControlsProps) {
    return (
        <>
            <div className="timer-controls">
                {!isRunning && hasStarted ? (
                    <button className="btn timer-btn timer-btn--start" onClick={onStart}>
                        ▶ RESUME
                    </button>
                ) : (
                    <button
                        className={`btn timer-btn ${isRunning ? "timer-btn--stop" : "timer-btn--start"}`}
                        onClick={isRunning ? onStop : onStart}
                        disabled={isEnd}
                    >
                        {isRunning ? "⏸ PAUSE" : "▶ START"}
                    </button>
                )}

                <button className="btn timer-btn timer-btn--reset" onClick={onReset}>
                    ↺ RESET
                </button>
            </div>

            <div className="timer-hint">
                {isRunning
                    ? "Timer running - PAUSE to stop"
                    : hasStarted
                        ? "Timer paused at current time - RESET to clear"
                        : "START to begin countdown"}
            </div>
        </>
    );
}

// interface RoundTwoPanelProps {
//     state: ScoreboardState;
//     categories: Category[];
//     onPushState: (state: ScoreboardState) => Promise<void>;
//     pendingQuestion: {
//         categoryId: string;
//         question: string;
//         answer: string;
//     } | null;
//     setPendingQuestion: React.Dispatch<React.SetStateAction<{
//         categoryId: string;
//         question: string;
//         answer: string;
//     } | null>>;
//     // onTimerStop: () => Promise<void>;
// }

function RoundTwoPanel(
    // {
                           // state,
                           // categories,
                           // onPushState,
                           // pendingQuestion,
                           // setPendingQuestion,
                           // onTimerStop
                       // }: RoundTwoPanelProps
) {
    return (
        <div className="round-two-panel">
            <div className="round-two-panel__divider" />
            {/*<label className="field-label" style={{ color: "var(--green)" }}>ROUND 2 — CATEGORY BOARD</label>*/}

            {/*<CategoryGrid*/}
            {/*    categories={categories}*/}
            {/*    activeCategory={state.activeCategory}*/}
            {/*    onSelectCategory={async (catId: string) => {*/}
            {/*        await onPushState({*/}
            {/*            ...state,*/}
            {/*            activeCategory: catId === state.activeCategory ? null : catId,*/}
            {/*            showAnswer: false,*/}
            {/*            lastUpdated: Date.now()*/}
            {/*        });*/}
            {/*    }}*/}
            {/*/>*/}

            {/*{state.activeCategory && (*/}
            {/*    <ActiveCategoryPanel*/}
            {/*        state={state}*/}
            {/*        categories={categories}*/}
            {/*        onPushState={onPushState}*/}
            {/*        pendingQuestion={pendingQuestion}*/}
            {/*        setPendingQuestion={setPendingQuestion}*/}
            {/*        // onTimerStop={onTimerStop}*/}
            {/*    />*/}
            {/*)}*/}

            {/*<button*/}
            {/*    className="btn round-two-panel__reset"*/}
            {/*    onClick={async () => {*/}
            {/*        await onPushState({*/}
            {/*            ...state,*/}
            {/*            categories: DEFAULT_CATEGORIES,*/}
            {/*            activeCategory: null,*/}
            {/*            showAnswer: false,*/}
            {/*            lastUpdated: Date.now()*/}
            {/*        });*/}
            {/*        setPendingQuestion(null);*/}
            {/*    }}*/}
            {/*>*/}
            {/*    RESET ALL CATEGORIES*/}
            {/*</button>*/}
        </div>
    );
}

interface CategoryGridProps {
    categories: Category[];
    activeCategory: string | null;
    onSelectCategory: (catId: string) => Promise<void>;
}

function CategoryGrid({ categories, activeCategory, onSelectCategory }: CategoryGridProps) {
    return (
        <div className="category-grid">
            {categories.map((cat: Category) => {
                const isActive = activeCategory === cat.id;
                return (
                    <button
                        key={cat.id}
                        disabled={cat.used}
                        onClick={() => onSelectCategory(cat.id)}
                        className={`category-grid__item ${cat.used ? 'used' : ''} ${isActive ? 'active' : ''}`}
                        style={{
                            background: cat.used ? "var(--surface3)" : isActive ? cat.color : `${cat.color}44`,
                            borderColor: cat.used ? "#333" : isActive ? cat.borderColor : `${cat.borderColor}66`,
                            color: cat.used ? "var(--text3)" : isActive ? "white" : cat.borderColor,
                            boxShadow: isActive && !cat.used ? `0 0 16px ${cat.color}66` : "none",
                        }}
                    >
                        {cat.used ? "🔒 " : isActive ? "▶ " : ""}
                        {cat.name}
                    </button>
                );
            })}
        </div>
    );
}

interface ActiveCategoryPanelProps {
    state: ScoreboardState;
    categories: Category[];
    onPushState: (state: ScoreboardState) => Promise<void>;
    pendingQuestion: {
        categoryId: string;
        question: string;
        answer: string;
    } | null;
    setPendingQuestion: React.Dispatch<React.SetStateAction<{
        categoryId: string;
        question: string;
        answer: string;
    } | null>>;
    // onTimerStop: () => Promise<void>;
}


function ActiveCategoryPanel({
                                 state,
                                 categories,
                                 onPushState,
                                 pendingQuestion,
                                 setPendingQuestion,
                                 // onTimerStop
                             }: ActiveCategoryPanelProps) {
    const activeIdx = categories.findIndex((c: Category) => c.id === state.activeCategory);
    const active = categories[activeIdx];
    const [isMuted, setIsMuted] = useState(true);

    const {  pauseAllSounds } = useAudioControl(isMuted);

    if (!active) return null;

    const updateCat = async (patch: Partial<Category>) => {
        const nc = categories.map((c: Category, i: number) => i === activeIdx ? { ...c, ...patch } : c);
        await onPushState({ ...state, categories: nc, lastUpdated: Date.now() });
    };

    // Add this function to handle question selection with delay
    const handleQuestionSelect = async (question: string, answer: string) => {
        // First, clear any existing pending question to prevent auto-start
        setPendingQuestion(null);


        // Update the question and answer
        await updateCat({ question, answer });

        // Clear any existing answer visibility
        if (state.showAnswer) {
            await onPushState({ ...state, showAnswer: false, lastUpdated: Date.now() });
        }

        // Set pending question for delayed start
        setPendingQuestion({
            categoryId: active.id,
            question,
            answer
        });
    };
    const handleAnswerReveal = async () => {
        setPendingQuestion(null);

        const elapsed = state.timerStartedAt
            ? (Date.now() - state.timerStartedAt) / 1000
            : state.timerElapsed || 0;

        await onPushState({
            ...state,
            timerRunning: false,                     // ✅ stop timer atomically
            timerElapsed: state.timerRunning ? elapsed : state.timerElapsed,
            showAnswer: !state.showAnswer,
            lastUpdated: Date.now(),
        });

        if (state.timerRunning) {
            pauseAllSounds();                        // ✅ mute after save
            setIsMuted(true);
        }
    };

    return (
        <div className="active-category-panel" style={{ background: `${active.color}18`, borderColor: `${active.borderColor}55` }}>
            <div className="active-category-panel__title" style={{ color: active.borderColor }}>
                ▸ {active.name}
            </div>

            {/* Show countdown indicator if question is pending */}
            {pendingQuestion && pendingQuestion.categoryId === active.id && (
                <div className="pending-question-indicator" style={{
                    background: `${active.color}22`,
                    borderColor: active.borderColor,
                    padding: "8px 12px",
                    borderRadius: 6,
                    marginBottom: 12,
                    fontSize: 14,
                    color: active.borderColor,
                    display: "flex",
                    alignItems: "center",
                    gap: 8
                }}>
                    <span className="spinner" style={{
                        width: 16,
                        height: 16,
                        border: `2px solid ${active.borderColor}`,
                        borderTopColor: "transparent",
                        borderRadius: "50%",
                        animation: "spin 1s linear infinite"
                    }} />
                    Question selected — timer starting in 4 seconds...
                </div>
            )}

            {(active.questionBank || []).length > 0 && (
                <QuestionBankList
                    questions={active.questionBank}
                    activeCategory={active}
                    onSelect={handleQuestionSelect}
                    selectedQuestion={active.question}
                    pendingQuestion={pendingQuestion}
                />
            )}

            {(active.questionBank || []).length === 0 && (
                <div className="active-category-panel__empty">
                    No questions in bank — add them in the Question Bank panel.
                </div>
            )}

            <div className="active-category-panel__actions">
                <button
                    className="btn active-category-panel__answer-btn"
                    onClick={handleAnswerReveal}

                    style={{
                        background: state.showAnswer ? `${active.color}55` : "var(--surface3)",
                        borderColor: state.showAnswer ? active.borderColor : "var(--border2)",
                        color: state.showAnswer ? active.borderColor : "var(--text2)",
                    }}
                >
                    {state.showAnswer ? "✓ ANSWER SHOWN" : "REVEAL ANSWER"}
                </button>

                <button
                    className="btn active-category-panel__lock-btn"
                    onClick={async () => {
                        const nc = categories.map((c: Category, i: number) =>
                            i === activeIdx ? { ...c, used: !c.used } : c
                        );
                        await onPushState({
                            ...state,
                            categories: nc,
                            activeCategory: !active.used ? null : state.activeCategory,
                            showAnswer: false,
                            lastUpdated: Date.now()
                        });
                        setPendingQuestion(null);
                    }}
                    style={{
                        background: active.used ? "rgba(0,229,160,0.1)" : "rgba(255,64,96,0.1)",
                        borderColor: active.used ? "var(--green)" : "var(--red)",
                        color: active.used ? "var(--green)" : "var(--red)",
                    }}
                >
                    {active.used ? "🔓 UNLOCK" : "🔒 LOCK USED"}
                </button>
            </div>

            <button
                className="btn active-category-panel__clear"
                onClick={async () => {
                    await onPushState({ ...state, activeCategory: null, showAnswer: false, lastUpdated: Date.now() });
                    setPendingQuestion(null);
                }}
            >
                ✕ CLEAR SELECTION
            </button>
        </div>
    );
}
interface QuestionBankListProps {
    questions: QuestionEntry[];
    activeCategory: Category;
    onSelect: (q: string, a: string) => void;
    selectedQuestion?: string;
    pendingQuestion: {
        categoryId: string;
        question: string;
        answer: string;
    } | null;
}

function QuestionBankList({ questions, activeCategory, onSelect, selectedQuestion, pendingQuestion }: QuestionBankListProps) {
    return (
        <div className="question-bank-list">
            <div className="question-bank-list__label">
                PICK FROM BANK ({questions.length})
            </div>
            <div className="question-bank-list__items">
                {questions.map((entry: QuestionEntry, idx: number) => {
                    const isSel = selectedQuestion === entry.q;
                    const isPending = pendingQuestion?.question === entry.q;
                    return (
                        <button
                            key={entry.id}
                            onClick={() => onSelect(entry.q, entry.a)}
                            className={`question-bank-list__item ${isSel ? 'selected' : ''} ${isPending ? 'pending' : ''}`}
                            style={{
                                background: isSel ? `${activeCategory.color}55` : "var(--surface3)",
                                borderColor: isSel ? activeCategory.borderColor : "transparent",
                                opacity: isPending ? 0.7 : 1,
                                cursor: isPending ? "wait" : "pointer"
                            }}
                            disabled={isPending}
                        >
                            <div className="question-bank-list__item-index" style={{ background: isSel ? activeCategory.borderColor : activeCategory.color }}>
                                {isSel ? "✓" : idx + 1}
                            </div>
                            <div className="question-bank-list__item-content">
                                <div className="question-bank-list__item-question">{entry.q}</div>
                                {entry.a && (
                                    <div className="question-bank-list__item-answer" style={{ color: activeCategory.borderColor }}>
                                        → {entry.a}
                                    </div>
                                )}
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

interface CategoriesCardProps {
    state: ScoreboardState;
    categories: Category[];
    onPushState: (state: ScoreboardState) => Promise<void>;
    pendingQuestion: {
        categoryId: string;
        question: string;
        answer: string;
    } | null;
    setPendingQuestion: React.Dispatch<React.SetStateAction<{
        categoryId: string;
        question: string;
        answer: string;
    } | null>>;
    // onTimerStop: () => Promise<void>;
}

function CategoriesCard({
                            state,
                            categories,
                            onPushState,
                            pendingQuestion,
                            setPendingQuestion,
                            // onTimerStop
                        }: CategoriesCardProps) {
    return (
        <ControlCard accent="var(--cyan)" title="CATEGORIES">
            <div className="categories-card__content">
                <CategoryGrid
                    categories={categories}
                    activeCategory={state.activeCategory}
                    onSelectCategory={async (catId: string) => {
                        await onPushState({
                            ...state,
                            activeCategory: catId === state.activeCategory ? null : catId,
                            showAnswer: false,
                            lastUpdated: Date.now()
                        });
                    }}
                />

                {state.activeCategory && (
                    <ActiveCategoryPanel
                        state={state}
                        categories={categories}
                        onPushState={onPushState}
                        pendingQuestion={pendingQuestion}
                        setPendingQuestion={setPendingQuestion}
                        // onTimerStop={onTimerStop}
                    />
                )}
            </div>
        </ControlCard>
    );
}

interface ScoringState {
    correct: number; wrong: number; pass: number;
    setCorrect: (v: number) => void; setWrong: (v: number) => void; setPass: (v: number) => void;
}

interface TeamsCardProps {
    state: ScoreboardState;
    drafts: { teamAName: string; teamBName: string; };
    setDrafts: React.Dispatch<React.SetStateAction<{ teamAName: string; teamBName: string; }>>;
    onCommitTeamName: (side: TeamSide) => void;
    onScoreChange: (side: TeamSide, val: string) => void;
    onAdjustScore: (amount: number, side: TeamSide) => void;
    onFocus: (e: React.FocusEvent<HTMLInputElement | null>) => void;
    teamANameRef: React.RefObject<HTMLInputElement | null>;
    teamAScoreRef: React.RefObject<HTMLInputElement | null>;
    onClearScores: () => Promise<void>;
    scoringA: ScoringState;
    scoringB: ScoringState;
}

function TeamsCard({ state, drafts, setDrafts, onCommitTeamName, onScoreChange, onAdjustScore, onFocus, teamANameRef, teamAScoreRef, onClearScores, scoringA, scoringB }: TeamsCardProps) {
    return (
        <div className="teams-row">
            <TeamCard
                side="A"
                team={state.teamA}
                draftName={drafts.teamAName}
                onNameChange={(val: string) => setDrafts((d) => ({ ...d, teamAName: val }))}
                onCommitName={() => onCommitTeamName("A")}
                onScoreChange={(val: string) => onScoreChange("A", val)}
                onAdjustScore={(amount: number) => onAdjustScore(amount, "A")}
                onFocus={onFocus}
                nameRef={teamANameRef}
                scoreRef={teamAScoreRef}
                accent="var(--cyan)"
                round={state.timerRound}
                scoring={scoringA}
            />
            <TeamCard
                side="B"
                team={state.teamB}
                draftName={drafts.teamBName}
                onNameChange={(val: string) => setDrafts((d) => ({ ...d, teamBName: val }))}
                onCommitName={() => onCommitTeamName("B")}
                onScoreChange={(val: string) => onScoreChange("B", val)}
                onAdjustScore={(amount: number) => onAdjustScore(amount, "B")}
                onFocus={onFocus}
                nameRef={null}
                scoreRef={null}
                accent="var(--amber)"
                round={state.timerRound}
                scoring={scoringB}
            />
            <button className="btn" onClick={onClearScores}
                style={{ gridColumn: "1 / -1", background: "rgba(255,64,96,0.12)", border: "1px solid var(--red)", color: "var(--red)", padding: "10px", fontSize: 13, fontWeight: 700, marginTop: 8, width: "100%" }}>
                ✕ CLEAR BOTH SCORES
            </button>
        </div>
    );
}

interface TeamCardProps {
    side: TeamSide;
    team: { name: string; score: number; };
    draftName: string;
    onNameChange: (val: string) => void;
    onCommitName: () => void;
    onScoreChange: (val: string) => void;
    onAdjustScore: (amount: number) => void;
    onFocus: (e: React.FocusEvent<HTMLInputElement | null>) => void;
    nameRef: React.RefObject<HTMLInputElement | null> | null;
    scoreRef: React.RefObject<HTMLInputElement | null> | null;
    accent: string;
    round: number;
    scoring: ScoringState;
}

function TeamCard({ side, team, draftName, onNameChange, onCommitName, onScoreChange, onAdjustScore, onFocus, nameRef, scoreRef, accent, round, scoring }: TeamCardProps) {
    const isHome = side === "A";

    const R1_CORRECT = [100, 150, 200];
    const R1_PENALTY = [0, -50, -100];
    const R2_CORRECT = [500, 1000, 1500];
    const R2_PENALTY = [0, -250, -500, -1000];

    const defaultCorrect = round === 1 ? 100 : round === 2 ? 500 : 0;
    const defaultPenalty = round === 1 ? -50 : round === 2 ? -250 : 0;
    // use lifted scoring state (kept in sync with keyboard shortcuts)
    const { correct: correctVal, wrong: wrongVal, pass: passVal,
            setCorrect: setCorrectVal, setWrong: setWrongVal, setPass: setPassVal } = scoring;
    void defaultCorrect; void defaultPenalty; // used by parent

    const chip = (val: number, active: boolean, onClick: () => void, color: string) => (
        <button key={val} className="btn" onClick={onClick} style={{
            padding: "3px 8px", fontSize: 11, borderRadius: 6, border: `1px solid ${active ? color : "rgba(255,255,255,0.08)"}`,
            background: active ? `${color}22` : "var(--surface3)", color: active ? color : "var(--text3)", fontWeight: active ? 700 : 400,
        }}>{val > 0 ? `+${val}` : val}</button>
    );

    const actionBtn = (label: string, amt: number, color: string, bg: string) => (
        <button className="btn" onClick={() => onAdjustScore(amt)}
            style={{ flex: 1, padding: "10px 4px", fontSize: 13, fontWeight: 700, background: bg, border: `1px solid ${color}`, color }}>
            {label}<br /><span style={{ fontSize: 11, opacity: 0.8 }}>{amt > 0 ? `+${amt}` : amt}</span>
        </button>
    );

    const correctOptions = round === 1 ? R1_CORRECT : R2_CORRECT;
    const penaltyOptions = round === 1 ? R1_PENALTY : R2_PENALTY;

    return (
        <ControlCard accent={accent} title={isHome ? "TEAM A" : "TEAM B"}>
            <div className="team-card__content">
                <div>
                    <label className="field-label">TEAM NAME</label>
                    <input
                        ref={nameRef}
                        type="text"
                        value={draftName}
                        onChange={(e) => onNameChange(e.target.value.toUpperCase())}
                        onKeyDown={(e) => e.key === "Enter" && onCommitName()}
                        onFocus={onFocus}
                        placeholder="Enter team name..."
                        className={`field-input${isHome ? "" : " amber"}`}
                    />
                </div>

                <div>
                    <label className="field-label">SCORE</label>
                    <div className="score-row">
                        <button className="btn score-adj-btn score-adj-btn--minus" onClick={() => onAdjustScore(-100)}>−</button>
                        <input
                            ref={scoreRef}
                            type="number"
                            inputMode="numeric"
                            value={team.score === 0 ? "" : team.score.toString()}
                            onChange={(e) => onScoreChange(e.target.value)}
                            onFocus={onFocus}
                            className={`score-input ${isHome ? "cyan" : "amber"}`}
                        />
                        <button className={`btn score-adj-btn score-adj-btn--plus-${isHome ? "cyan" : "amber"}`} onClick={() => onAdjustScore(100)}>+</button>
                    </div>

                    {round !== 3 && (
                        <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 8 }}>
                            {/* CORRECT row */}
                            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                                <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                                    <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "var(--cyan)", alignSelf: "center", minWidth: 52 }}>CORRECT</span>
                                    {correctOptions.map(v => chip(v, correctVal === v, () => setCorrectVal(v), "var(--cyan)"))}
                                </div>
                                {actionBtn("✓ CORRECT", correctVal, "var(--cyan)", "rgba(0,229,160,0.12)")}
                            </div>
                            {/* WRONG row */}
                            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                                <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                                    <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "var(--red)", alignSelf: "center", minWidth: 52 }}>WRONG</span>
                                    {penaltyOptions.map(v => chip(v, wrongVal === v, () => setWrongVal(v), "var(--red)"))}
                                </div>
                                {actionBtn("✗ WRONG", wrongVal, "var(--red)", "rgba(255,64,96,0.12)")}
                            </div>
                            {/* PASS row */}
                            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                                <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                                    <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "var(--amber)", alignSelf: "center", minWidth: 52 }}>PASS</span>
                                    {penaltyOptions.map(v => chip(v, passVal === v, () => setPassVal(v), "var(--amber)"))}
                                </div>
                                {actionBtn("→ PASS", passVal, "var(--amber)", "rgba(255,180,0,0.12)")}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </ControlCard>
    );
}

// interface QuickButtonsProps {
//     amounts: number[];
//     label: string;
//     onAdjust: (amount: number) => void;
//     variant: string;
// }

// function QuickButtons({ amounts, label, onAdjust, variant }: QuickButtonsProps) {
//     return (
//         <>
//             <div style={{ marginBottom: 12 }}>
//                 <span className="quick-label">{label}</span>
//                 <div className="quick-buttons">
//                     {amounts.map((amount: number) => (
//                         <button
//                             key={amount}
//                             className={`btn quick-btn quick-btn--${variant}`}
//                             onClick={() => onAdjust(amount)}
//                         >
//                             {amount > 0 ? `+${amount}` : amount}
//                         </button>
//                     ))}
//                 </div>
//             </div>
//         </>
//     );
// }

interface PublishFooterProps {
    error: string | null;
    saved: boolean;
    saving: boolean;
    onPublish: () => Promise<void>;
    onReset: () => Promise<void>;
}

function PublishFooter({ error, saved, saving, onPublish, onReset }: PublishFooterProps) {
    return (
        <div className="publish-row">
            {error && (
                <div className="error-banner">
                    ⚠ FIREBASE ERROR<br />{error}<br /><br />
                    Fix: Firebase Console → Realtime Database → Rules → set "read" and "write" to <strong>true</strong>
                </div>
            )}
            <button
                className={`btn publish-btn ${saved ? "publish-btn--saved" : "publish-btn--unsaved"}`}
                onClick={onPublish}
                disabled={saving}
            >
                {saving ? "PUBLISHING…" : saved ? "✓ PUSHED TO ALL DEVICES" : "PUBLISH SCORES"}
            </button>
            <button className="btn reset-btn" onClick={onReset}>
                Reset All
            </button>
        </div>
    );
}

function TeamsSubTabs({
    state, drafts, setDrafts, onCommitTeamName, onScoreChange, onAdjustScore,
    onFocus, teamANameRef, teamAScoreRef, onClearScores, onAddSpinsToMain,
    error, saved, saving, onPublish, onReset, onUndo, canUndo, scoringA, scoringB,
}: TeamsCardProps & {
    onAddSpinsToMain: (a: number, b: number) => Promise<void>;
    error: string | null; saved: boolean; saving: boolean;
    onPublish: () => Promise<void>; onReset: () => Promise<void>;
    onUndo: () => void; canUndo: boolean;
    scoringA: ScoringState; scoringB: ScoringState;
}) {
    const [sub, setSub] = useState<"scores" | "spins">("scores");

    const [spinsStateA, setSpinsStateA] = useState<SpinTeamState>({ spins: [null, null, null], banked: 0, forfeited: false, bonusUsed: false });
    const [spinsStateB, setSpinsStateB] = useState<SpinTeamState>({ spins: [null, null, null], banked: 0, forfeited: false, bonusUsed: false });

    return (
        <div className="bottom-section">
            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                {(["scores", "spins"] as const).map((t) => (
                    <button key={t} className={`btn admin-tab ${sub === t ? "admin-tab--active" : ""}`} onClick={() => setSub(t)}>
                        {t === "scores" ? "📊 SCORES UPDATE" : "🎰 3 SPINS SCORES"}
                    </button>
                ))}
            </div>
            {sub === "scores" && (
                <>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, flexWrap: "wrap", gap: 8 }}>
                        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "var(--text3)", letterSpacing: "0.1em" }}>
                            SHORTCUTS — A correct · Z wrong · X pass (Team A) &nbsp;|&nbsp; K correct · M wrong · , pass (Team B)
                        </span>
                        <button className="btn" onClick={onUndo} disabled={!canUndo}
                            style={{ fontSize: 11, padding: "5px 12px", background: canUndo ? "rgba(255,180,0,0.15)" : "var(--surface3)", border: `1px solid ${canUndo ? "var(--amber)" : "rgba(255,255,255,0.08)"}`, color: canUndo ? "var(--amber)" : "var(--text3)" }}>
                            ↩ Undo (Ctrl+Z)
                        </button>
                    </div>
                    <TeamsCard
                        state={state} drafts={drafts} setDrafts={setDrafts}
                        onCommitTeamName={onCommitTeamName} onScoreChange={onScoreChange}
                        onAdjustScore={onAdjustScore} onFocus={onFocus}
                        teamANameRef={teamANameRef} teamAScoreRef={teamAScoreRef}
                        onClearScores={onClearScores}
                        scoringA={scoringA} scoringB={scoringB}
                    />
                    <PublishFooter error={error} saved={saved} saving={saving} onPublish={onPublish} onReset={onReset} />
                </>
            )}
            {sub === "spins" && (
                <SpinsPanel
                    teamAName={state.teamA.name}
                    teamBName={state.teamB.name}
                    stateA={spinsStateA} stateB={spinsStateB}
                    onChangeA={setSpinsStateA} onChangeB={setSpinsStateB}
                    onAddToMain={async () => {
                        await onAddSpinsToMain(spinsStateA.banked, spinsStateB.banked);
                        setSpinsStateA({ spins: [null, null, null], banked: 0, forfeited: false, bonusUsed: false });
                        setSpinsStateB({ spins: [null, null, null], banked: 0, forfeited: false, bonusUsed: false });
                    }}
                />
            )}
        </div>
    );
}

// ── Round Scoring Panel ──────────────────────────────────────────────────────
// Shows correct/wrong/pass buttons with the right points for the current round
// function RoundScoringPanel({ round, teamAName, teamBName, onAdjustScore }: {
//     round: number; teamAName: string; teamBName: string;
//     onAdjustScore: (amount: number, side: TeamSide) => void;
// }) {
//     const correct = round === 1 ? 100 : round === 2 ? 500 : 0;
//     const penalty = round === 1 ? -50 : round === 2 ? -250 : 0;
//     if (round === 3) return null; // Round 3 handled by spins tab
//
//     const btn = (label: string, amt: number, side: TeamSide, color: string, bg: string) => (
//         <button className="btn" onClick={() => onAdjustScore(amt, side)}
//             style={{ flex: 1, padding: "10px 4px", fontSize: 13, fontWeight: 700, background: bg, border: `1px solid ${color}`, color }}>
//             {label}<br /><span style={{ fontSize: 11, opacity: 0.8 }}>{amt > 0 ? `+${amt}` : amt}</span>
//         </button>
//     );
//
//     return (
//         <div style={{ background: "var(--surface)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: 16, marginBottom: 12 }}>
//             <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 14, letterSpacing: "0.1em", color: "var(--text3)", marginBottom: 10 }}>
//                 ROUND {round} SCORING — CORRECT +{correct} · WRONG/PASS {penalty}
//             </div>
//             <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
//                 {/* Team A */}
//                 <div>
//                     <div style={{ fontSize: 11, color: "var(--cyan)", fontFamily: "'Bebas Neue', sans-serif", marginBottom: 6 }}>{teamAName || "TEAM A"}</div>
//                     <div style={{ display: "flex", gap: 6 }}>
//                         {btn("✓ CORRECT", correct, "A", "var(--cyan)", "rgba(0,229,160,0.12)")}
//                         {btn("✗ WRONG", penalty, "A", "var(--red)", "rgba(255,64,96,0.12)")}
//                         {btn("→ PASS", penalty, "A", "var(--amber)", "rgba(255,180,0,0.12)")}
//                     </div>
//                 </div>
//                 {/* Team B */}
//                 <div>
//                     <div style={{ fontSize: 11, color: "var(--amber)", fontFamily: "'Bebas Neue', sans-serif", marginBottom: 6 }}>{teamBName || "TEAM B"}</div>
//                     <div style={{ display: "flex", gap: 6 }}>
//                         {btn("✓ CORRECT", correct, "B", "var(--cyan)", "rgba(0,229,160,0.12)")}
//                         {btn("✗ WRONG", penalty, "B", "var(--red)", "rgba(255,64,96,0.12)")}
//                         {btn("→ PASS", penalty, "B", "var(--amber)", "rgba(255,180,0,0.12)")}
//                     </div>
//                 </div>
//             </div>
//         </div>
//     );
// }

// ── 3 Spins Panel ────────────────────────────────────────────────────────────
const SPIN_PRESETS = [50, 100, 150, 250, 500, 750, 1000, 1500, 2000, 2500];

interface SpinTeamState {
    spins: [number | null, number | null, number | null];
    banked: number;
    forfeited: boolean;
    bonusUsed: boolean;
}

function SpinTeamCard({ name, accent, st, onChange }: {
    name: string; accent: string;
    st: SpinTeamState;
    onChange: (s: SpinTeamState) => void;
}) {
    const [spinInput, setSpinInput] = useState<[string, string, string]>(["", "", ""]);

    const setSpinVal = (i: 0|1|2, val: string) => {
        const next: [string, string, string] = [...spinInput] as [string, string, string];
        next[i] = val;
        setSpinInput(next);
    };

    const spinResult = (i: 0|1|2) => parseInt(spinInput[i]) || 0;
    const activeSpinIdx = st.spins.findIndex(s => s === null) as 0|1|2|3;
    const runningTotal = st.spins.reduce<number>((acc, s) => acc + (s ?? 0), 0);

    const handleCorrect = (i: 0|1|2) => {
        const pts = spinResult(i);
        const newSpins: [number|null,number|null,number|null] = [...st.spins] as any;
        newSpins[i] = pts;
        onChange({ ...st, spins: newSpins, banked: newSpins.reduce<number>((a, s) => a + (s ?? 0), 0), forfeited: false });
    };

    const handleWrong = (i: 0|1|2) => {
        const newSpins: [number|null,number|null,number|null] = [...st.spins] as any;
        newSpins[i] = spinResult(i);
        onChange({ ...st, spins: newSpins, banked: 0, forfeited: true });
    };

    const handleStop = () => onChange({ ...st, banked: runningTotal, forfeited: false });

    const handleBonus = (correct: boolean) => {
        if (correct) {
            const recovered = st.spins.reduce<number>((a, s) => a + (s ?? 0), 0);
            onChange({ ...st, banked: recovered, forfeited: false, bonusUsed: true });
        } else {
            onChange({ ...st, bonusUsed: true });
        }
    };

    const handleReset = () => {
        setSpinInput(["", "", ""]);
        onChange({ spins: [null, null, null], banked: 0, forfeited: false, bonusUsed: false });
    };

    // Progress indicator
    const spinsCompleted = st.spins.filter(s => s !== null).length;

    const s = (i: 0|1|2) => {
        const isActive = activeSpinIdx === i && !st.forfeited;
        const isDone = st.spins[i] !== null;
        const isLocked = !isDone && !isActive;
        return (
            <div key={i} style={{
                background: isDone ? (st.forfeited ? "rgba(255,64,96,0.08)" : "rgba(0,229,160,0.08)") : "var(--surface2)",
                border: `1px solid ${isActive ? accent : isDone ? (st.forfeited ? "var(--red)" : accent) : "rgba(255,255,255,0.08)"}`,
                borderRadius: 10, padding: 12, opacity: isLocked ? 0.4 : 1,
                boxShadow: isActive ? `0 0 12px ${accent}33` : "none",
            }}>
                <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 13, color: isActive ? accent : "var(--text3)", marginBottom: 8 }}>
                    SPIN {i + 1} {isDone ? (st.forfeited ? "❌ FORFEITED" : `✓ ${st.spins[i]}pts`) : isActive ? "▶ ACTIVE" : ""}
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 8 }}>
                    {SPIN_PRESETS.map(p => (
                        <button key={p} className="btn" disabled={!isActive}
                            onClick={() => setSpinVal(i, p.toString())}
                            style={{ padding: "3px 7px", fontSize: 11, background: spinInput[i] === p.toString() ? accent : "var(--surface3)", color: spinInput[i] === p.toString() ? "var(--bg)" : "var(--text3)", border: "none", borderRadius: 5 }}>
                            {p}
                        </button>
                    ))}
                </div>
                <input type="number" disabled={!isActive} value={spinInput[i]}
                    onChange={(e) => setSpinVal(i, e.target.value)}
                    placeholder="or type spin result..."
                    style={{ width: "100%", background: "var(--surface3)", border: `1px solid ${accent}44`, borderRadius: 6, color: accent, padding: "6px 10px", fontSize: 16, fontFamily: "'Bebas Neue', sans-serif", textAlign: "center", marginBottom: 8, boxSizing: "border-box" }} />
                {isActive && (
                    <div style={{ display: "flex", gap: 6 }}>
                        <button className="btn" onClick={() => handleCorrect(i)} disabled={!spinResult(i)}
                            style={{ flex: 1, padding: "8px", fontSize: 12, fontWeight: 700, background: "rgba(0,229,160,0.15)", border: "1px solid var(--cyan)", color: "var(--cyan)" }}>
                            ✓ CORRECT<br /><span style={{ fontSize: 10 }}>+{spinResult(i)}pts</span>
                        </button>
                        <button className="btn" onClick={() => handleWrong(i)} disabled={!spinResult(i)}
                            style={{ flex: 1, padding: "8px", fontSize: 12, fontWeight: 700, background: "rgba(255,64,96,0.15)", border: "1px solid var(--red)", color: "var(--red)" }}>
                            ✗ WRONG<br /><span style={{ fontSize: 10 }}>forfeit all</span>
                        </button>
                        {/* STOP available from spin 1 onwards (i >= 0 means always when active and has a value) */}
                        <button className="btn" onClick={handleStop} disabled={runningTotal === 0}
                            style={{ flex: 1, padding: "8px", fontSize: 12, fontWeight: 700, background: "rgba(255,180,0,0.15)", border: "1px solid var(--amber)", color: "var(--amber)" }}>
                            🛑 STOP<br /><span style={{ fontSize: 10 }}>bank {runningTotal}pts</span>
                        </button>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div style={{ flex: 1, background: "var(--surface)", border: `1px solid ${accent}33`, borderRadius: 12, padding: 16, minWidth: 280 }}>
            {/* Header with progress */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 18, color: accent }}>{name || (accent === "var(--cyan)" ? "TEAM A" : "TEAM B")}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {/* Spin progress dots */}
                    <div style={{ display: "flex", gap: 4 }}>
                        {([0,1,2] as const).map(i => (
                            <div key={i} style={{
                                width: 10, height: 10, borderRadius: "50%",
                                background: st.spins[i] !== null ? (st.forfeited ? "var(--red)" : accent) : activeSpinIdx === i ? accent : "rgba(255,255,255,0.15)",
                                border: activeSpinIdx === i && st.spins[i] === null ? `2px solid ${accent}` : "none",
                                boxShadow: activeSpinIdx === i && st.spins[i] === null ? `0 0 6px ${accent}` : "none",
                            }} />
                        ))}
                    </div>
                    <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "var(--text3)" }}>{spinsCompleted}/3</span>
                    <button className="btn" onClick={handleReset} style={{ fontSize: 11, padding: "4px 10px", background: "var(--surface3)", color: "var(--text3)", border: "1px solid rgba(255,255,255,0.08)" }}>↺</button>
                </div>
            </div>

            {/* Running total while spinning */}
            {!st.forfeited && spinsCompleted > 0 && spinsCompleted < 3 && (
                <div style={{ marginBottom: 10, padding: "6px 12px", background: `${accent}11`, border: `1px solid ${accent}33`, borderRadius: 8, fontFamily: "'Bebas Neue', sans-serif", fontSize: 14, color: accent, textAlign: "center" }}>
                    RUNNING TOTAL: {runningTotal} pts
                </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {([0,1,2] as (0|1|2)[]).map(i => s(i))}
            </div>

            {/* Bonus question — shown after forfeit, with skip option */}
            {st.forfeited && !st.bonusUsed && (
                <div style={{ marginTop: 12, background: "rgba(255,180,0,0.08)", border: "1px solid var(--amber)", borderRadius: 10, padding: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                        <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 13, color: "var(--amber)" }}>
                            🎁 BONUS — recover {st.spins.reduce<number>((a,s)=>a+(s??0),0)}pts
                        </span>
                        <button className="btn" onClick={() => onChange({ ...st, bonusUsed: true })}
                            style={{ fontSize: 10, padding: "3px 8px", background: "transparent", color: "var(--text3)", border: "1px solid rgba(255,255,255,0.1)" }}>
                            skip
                        </button>
                    </div>
                    <div style={{ display: "flex", gap: 6 }}>
                        <button className="btn" onClick={() => handleBonus(true)}
                            style={{ flex: 1, padding: "8px", fontSize: 12, fontWeight: 700, background: "rgba(0,229,160,0.15)", border: "1px solid var(--cyan)", color: "var(--cyan)" }}>
                            ✓ CORRECT — RECOVER
                        </button>
                        <button className="btn" onClick={() => handleBonus(false)}
                            style={{ flex: 1, padding: "8px", fontSize: 12, fontWeight: 700, background: "rgba(255,64,96,0.15)", border: "1px solid var(--red)", color: "var(--red)" }}>
                            ✗ WRONG — FORFEIT
                        </button>
                    </div>
                </div>
            )}

            {/* Banked summary */}
            <div style={{ marginTop: 12, textAlign: "center", fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, color: st.forfeited ? "var(--red)" : accent }}>
                {st.forfeited ? "FORFEITED — 0 pts" : `BANKED: ${st.banked} pts`}
            </div>
        </div>
    );
}

function SpinsPanel({ teamAName, teamBName, stateA, stateB, onChangeA, onChangeB, onAddToMain }: {
    teamAName: string; teamBName: string;
    stateA: SpinTeamState; stateB: SpinTeamState;
    onChangeA: (s: SpinTeamState) => void;
    onChangeB: (s: SpinTeamState) => void;
    onAddToMain: () => Promise<void>;
}) {
    const [confirming, setConfirming] = useState(false);

    return (
        <div style={{ padding: "0 0 24px" }}>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 18, letterSpacing: "0.1em", marginBottom: 12, color: "var(--text2)" }}>
                🎰 ROUND 3 — 3 SPINS
            </div>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <SpinTeamCard name={teamAName} accent="var(--cyan)" st={stateA} onChange={onChangeA} />
                <SpinTeamCard name={teamBName} accent="var(--amber)" st={stateB} onChange={onChangeB} />
            </div>

            {!confirming ? (
                <button className="btn" onClick={() => setConfirming(true)}
                    style={{ marginTop: 16, width: "100%", padding: "14px", fontSize: 15, fontWeight: 700,
                        fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "0.1em",
                        background: "rgba(0,229,160,0.15)", border: "1px solid var(--cyan)", color: "var(--cyan)" }}>
                    ➕ ADD BANKED SPINS TO MAIN SCORES ({teamAName}: {stateA.banked}pts · {teamBName}: {stateB.banked}pts)
                </button>
            ) : (
                <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
                    <button className="btn" onClick={async () => { await onAddToMain(); setConfirming(false); }}
                        style={{ flex: 1, padding: "14px", fontSize: 14, fontWeight: 700, fontFamily: "'Bebas Neue', sans-serif",
                            background: "rgba(0,229,160,0.25)", border: "2px solid var(--cyan)", color: "var(--cyan)" }}>
                        ✓ CONFIRM — Add {stateA.banked + stateB.banked} pts total
                    </button>
                    <button className="btn" onClick={() => setConfirming(false)}
                        style={{ padding: "14px 20px", fontSize: 14, background: "var(--surface2)", border: "1px solid var(--border)", color: "var(--text2)" }}>
                        Cancel
                    </button>
                </div>
            )}
        </div>
    );
}

function ScoreHistoryPanel() {
    const [history, setHistory] = useState<ScoreRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [editIdx, setEditIdx] = useState<number | null>(null);
    const [editDraft, setEditDraft] = useState<ScoreRecord | null>(null);
    const [saving, setSaving] = useState(false);
    const [addingNew, setAddingNew] = useState(false);
    const [newDraft, setNewDraft] = useState<ScoreRecord>({
        timestamp: Date.now(), teamAName: "", teamBName: "", teamAScore: 0, teamBScore: 0, period: "",
    });

    useEffect(() => {
        fetchScoreHistory().then((h) => { setHistory([...h].reverse()); setLoading(false); });
    }, []);

    // history is displayed reversed; we need to map display index → original index
    const originalIdx = (displayIdx: number) => history.length - 1 - displayIdx;

    async function persist(updated: ScoreRecord[]) {
        setSaving(true);
        // store in chronological order (reversed from display)
        await saveScoreHistory([...updated].reverse());
        setSaving(false);
    }

    async function handleDelete(displayIdx: number) {
        const next = history.filter((_, i) => i !== displayIdx);
        setHistory(next);
        await persist(next);
    }

    function startEdit(displayIdx: number) {
        setEditIdx(displayIdx);
        setEditDraft({ ...history[displayIdx] });
    }

    async function commitEdit() {
        if (editIdx === null || !editDraft) return;
        const next = history.map((r, i) => i === editIdx ? editDraft : r);
        setHistory(next);
        setEditIdx(null);
        setEditDraft(null);
        await persist(next);
    }

    async function handleAdd() {
        const next = [{ ...newDraft, timestamp: Date.now() }, ...history];
        setHistory(next);
        setAddingNew(false);
        setNewDraft({ timestamp: Date.now(), teamAName: "", teamBName: "", teamAScore: 0, teamBScore: 0, period: "" });
        await persist(next);
    }

    const handleClear = async () => {
        if (!confirm("Clear all score history?")) return;
        await clearScoreHistory();
        setHistory([]);
    };

    const handleExportCSV = () => {
        const rows = [["Time", "Period", "Team A", "Score A", "Team B", "Score B"]];
        [...history].reverse().forEach((r) => rows.push([
            new Date(r.timestamp).toLocaleString(), r.period,
            r.teamAName, String(r.teamAScore), r.teamBName, String(r.teamBScore),
        ]));
        const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
        const a = document.createElement("a");
        a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
        a.download = `score-history-${Date.now()}.csv`;
        a.click();
    };

    const cell: React.CSSProperties = {
        padding: "12px 16px", fontFamily: "'DM Sans', sans-serif", fontSize: 14,
        borderBottom: "1px solid rgba(255,255,255,0.05)",
    };
    const inp: React.CSSProperties = {
        background: "var(--surface3)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 6,
        color: "var(--text)", padding: "5px 8px", fontSize: 13, width: "100%", fontFamily: "'DM Sans', sans-serif",
    };

    return (
        <div style={{ padding: 24, maxWidth: 1200, width: "100%", margin: "0 auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, gap: 12, flexWrap: "wrap" }}>
                <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, letterSpacing: "0.1em" }}>SCORE HISTORY</span>
                <div style={{ display: "flex", gap: 8 }}>
                    <button className="btn" onClick={() => setAddingNew(true)} disabled={addingNew}
                        style={{ background: "rgba(0,200,150,0.15)", color: "var(--cyan)", border: "1px solid var(--cyan)", padding: "8px 16px", fontSize: 12 }}>
                        + Add Entry
                    </button>
                    <button className="btn" onClick={handleExportCSV} disabled={history.length === 0}
                        style={{ background: "rgba(0,180,255,0.12)", color: "var(--cyan)", border: "1px solid var(--cyan)", padding: "8px 16px", fontSize: 12 }}>
                        ↓ Export CSV
                    </button>
                    <button className="btn" onClick={handleClear}
                        style={{ background: "rgba(255,64,96,0.15)", color: "var(--red)", border: "1px solid var(--red)", padding: "8px 16px", fontSize: 12 }}>
                        Clear All
                    </button>
                </div>
            </div>

            {/* Add new row form */}
            {addingNew && (
                <div style={{ background: "var(--surface)", border: "1px solid var(--cyan)", borderRadius: 12, padding: 16, marginBottom: 16, display: "grid", gridTemplateColumns: "1fr 1fr 80px 80px 1fr auto auto", gap: 8, alignItems: "center" }}>
                    <input style={inp} placeholder="Team A name" value={newDraft.teamAName} onChange={(e) => setNewDraft({ ...newDraft, teamAName: e.target.value })} />
                    <input style={inp} placeholder="Team B name" value={newDraft.teamBName} onChange={(e) => setNewDraft({ ...newDraft, teamBName: e.target.value })} />
                    <input style={inp} type="number" placeholder="A score" value={newDraft.teamAScore} onChange={(e) => setNewDraft({ ...newDraft, teamAScore: +e.target.value })} />
                    <input style={inp} type="number" placeholder="B score" value={newDraft.teamBScore} onChange={(e) => setNewDraft({ ...newDraft, teamBScore: +e.target.value })} />
                    <input style={inp} placeholder="Period" value={newDraft.period} onChange={(e) => setNewDraft({ ...newDraft, period: e.target.value })} />
                    <button className="btn" onClick={handleAdd} disabled={saving}
                        style={{ background: "var(--cyan)", color: "var(--bg)", padding: "7px 14px", fontSize: 12, fontWeight: 700 }}>Save</button>
                    <button className="btn" onClick={() => setAddingNew(false)}
                        style={{ background: "var(--surface2)", color: "var(--text2)", padding: "7px 12px", fontSize: 12 }}>✕</button>
                </div>
            )}

            {loading && <div style={{ color: "var(--text3)", fontFamily: "'DM Mono', monospace", fontSize: 12 }}>Loading…</div>}
            {!loading && history.length === 0 && (
                <div style={{ color: "var(--text3)", fontFamily: "'DM Mono', monospace", fontSize: 12 }}>
                    No records yet. Scores are recorded each time you hit Publish.
                </div>
            )}
            {!loading && history.length > 0 && (
                <div style={{ background: "var(--surface)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, overflow: "hidden" }}>
                    {/* Header */}
                    <div style={{ display: "grid", gridTemplateColumns: "1.4fr 0.8fr 1fr 1.2fr 1fr 80px", background: "var(--surface2)" }}>
                        {["TIME", "PERIOD", "TEAM A", "SCORE", "TEAM B", ""].map((h, i) => (
                            <div key={i} style={{ ...cell, color: "var(--text3)", fontSize: 11, letterSpacing: "0.15em", fontFamily: "'DM Mono', monospace", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>{h}</div>
                        ))}
                    </div>
                    {history.map((r, i) => {
                        const aWin = r.teamAScore > r.teamBScore;
                        const bWin = r.teamBScore > r.teamAScore;
                        const isEditing = editIdx === i;
                        return (
                            <div key={originalIdx(i)} style={{ display: "grid", gridTemplateColumns: "1.4fr 0.8fr 1fr 1.2fr 1fr 80px", background: isEditing ? "rgba(0,200,150,0.05)" : undefined }}>
                                {isEditing && editDraft ? (<>
                                    <div style={cell}><input style={inp} type="datetime-local" value={new Date(editDraft.timestamp - new Date(editDraft.timestamp).getTimezoneOffset() * 60000).toISOString().slice(0, 16)} onChange={(e) => setEditDraft({ ...editDraft, timestamp: new Date(e.target.value).getTime() })} /></div>
                                    <div style={cell}><input style={inp} value={editDraft.period} onChange={(e) => setEditDraft({ ...editDraft, period: e.target.value })} /></div>
                                    <div style={cell}><input style={inp} value={editDraft.teamAName} onChange={(e) => setEditDraft({ ...editDraft, teamAName: e.target.value })} /></div>
                                    <div style={{ ...cell, display: "flex", gap: 4, alignItems: "center" }}>
                                        <input style={{ ...inp, width: 60 }} type="number" value={editDraft.teamAScore} onChange={(e) => setEditDraft({ ...editDraft, teamAScore: +e.target.value })} />
                                        <span style={{ color: "var(--text3)" }}>–</span>
                                        <input style={{ ...inp, width: 60 }} type="number" value={editDraft.teamBScore} onChange={(e) => setEditDraft({ ...editDraft, teamBScore: +e.target.value })} />
                                    </div>
                                    <div style={cell}><input style={inp} value={editDraft.teamBName} onChange={(e) => setEditDraft({ ...editDraft, teamBName: e.target.value })} /></div>
                                    <div style={{ ...cell, display: "flex", gap: 4 }}>
                                        <button className="btn" onClick={commitEdit} disabled={saving} style={{ background: "var(--cyan)", color: "var(--bg)", padding: "5px 10px", fontSize: 11, fontWeight: 700 }}>✓</button>
                                        <button className="btn" onClick={() => { setEditIdx(null); setEditDraft(null); }} style={{ background: "var(--surface2)", color: "var(--text2)", padding: "5px 8px", fontSize: 11 }}>✕</button>
                                    </div>
                                </>) : (<>
                                    <div style={{ ...cell, color: "var(--text3)", fontSize: 12, fontFamily: "'DM Mono', monospace" }}>
                                        {new Date(r.timestamp).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                                    </div>
                                    <div style={{ ...cell, color: "var(--text2)" }}>{r.period}</div>
                                    <div style={{ ...cell, color: aWin ? "var(--cyan)" : "var(--text2)", fontWeight: aWin ? 700 : 400 }}>{r.teamAName}</div>
                                    <div style={{ ...cell, textAlign: "center" }}>
                                        <span style={{ color: "var(--cyan)", fontSize: 18, fontFamily: "'Bebas Neue', sans-serif" }}>{r.teamAScore}</span>
                                        <span style={{ color: "var(--text3)", margin: "0 6px" }}>–</span>
                                        <span style={{ color: "var(--amber)", fontSize: 18, fontFamily: "'Bebas Neue', sans-serif" }}>{r.teamBScore}</span>
                                    </div>
                                    <div style={{ ...cell, color: bWin ? "var(--amber)" : "var(--text2)", fontWeight: bWin ? 700 : 400 }}>{r.teamBName}</div>
                                    <div style={{ ...cell, display: "flex", gap: 4 }}>
                                        <button className="btn" onClick={() => startEdit(i)} style={{ background: "rgba(255,255,255,0.06)", color: "var(--text2)", padding: "5px 8px", fontSize: 11, border: "1px solid rgba(255,255,255,0.08)" }}>✏️</button>
                                        <button className="btn" onClick={() => handleDelete(i)} style={{ background: "rgba(255,64,96,0.12)", color: "var(--red)", padding: "5px 8px", fontSize: 11, border: "1px solid var(--red)" }}>✕</button>
                                    </div>
                                </>)}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

function ActivityLogPanel() {
    const [log, setLog] = useState<ActivityEntry[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchActivityLog().then((entries) => {
            setLog([...entries].reverse());
            setLoading(false);
        });
    }, []);

    const roleColor = (role: string) => role === "admin" ? "var(--amber)" : "var(--green, #00e5a0)";

    return (
        <div style={{ padding: 24, maxWidth: 900, width: "100%", margin: "0 auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, letterSpacing: "0.1em" }}>ACTIVITY LOG</span>
                <button className="btn" onClick={async () => { if (!confirm("Clear activity log?")) return; await clearActivityLog(); setLog([]); }}
                    style={{ background: "rgba(255,64,96,0.15)", color: "var(--red)", border: "1px solid var(--red)", padding: "8px 16px", fontSize: 12 }}>
                    Clear All
                </button>
            </div>
            {loading && <div style={{ color: "var(--text3)", fontFamily: "'DM Mono', monospace", fontSize: 12 }}>Loading…</div>}
            {!loading && log.length === 0 && <div style={{ color: "var(--text3)", fontFamily: "'DM Mono', monospace", fontSize: 12 }}>No activity yet.</div>}
            {!loading && log.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {log.map((entry, i) => (
                        <div key={i} style={{ background: "var(--surface)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: "12px 16px", display: "grid", gridTemplateColumns: "160px 100px 1fr", gap: 12, alignItems: "start" }}>
                            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "var(--text3)" }}>
                                {new Date(entry.timestamp).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                            </span>
                            <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 13, color: roleColor(entry.role), letterSpacing: "0.05em" }}>
                                {entry.username}
                            </span>
                            <div>
                                <div style={{ fontSize: 13, color: "var(--text)", marginBottom: entry.detail ? 4 : 0 }}>{entry.action}</div>
                                {entry.detail && <div style={{ fontSize: 11, color: "var(--text3)", fontFamily: "'DM Mono', monospace" }}>{entry.detail}</div>}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
