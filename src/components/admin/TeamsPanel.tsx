import { useState } from "react";
import type { ScoreboardState, TeamSide } from "../../types";
import { ControlCard } from "../shared/ControlCard";
export interface ScoringState {
    correct: number; wrong: number; pass: number;
    setCorrect: (v: number) => void; setWrong: (v: number) => void; setPass: (v: number) => void;
}

export interface TeamsCardProps {
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

export function TeamsCard({ state, drafts, setDrafts, onCommitTeamName, onScoreChange, onAdjustScore, onFocus, teamANameRef, teamAScoreRef, onClearScores, scoringA, scoringB }: TeamsCardProps) {
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

export interface TeamCardProps {
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

export function TeamCard({ side, team, draftName, onNameChange, onCommitName, onScoreChange, onAdjustScore, onFocus, nameRef, scoreRef, accent, round, scoring }: TeamCardProps) {
    const isHome = side === "A";

    const R1_CORRECT = [100, 150, 200,250];
    const R1_PENALTY = [0, -50, -100,-150];
    const R2_CORRECT = [500,750, 1000, 1500];
    const R2_PENALTY = [0, -250,-350, -500, -1000];

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

export interface PublishFooterProps {
    error: string | null;
    saved: boolean;
    saving: boolean;
    onPublish: () => Promise<void>;
    onReset: () => Promise<void>;
}

export function PublishFooter({ error, saved, saving, onPublish, onReset }: PublishFooterProps) {
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

export function TeamsSubTabs({
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

    const [spinsStateA, setSpinsStateA] = useState<SpinTeamState>({ spins: [null, null, null], banked: 0, forfeited: false, bonusUsed: false, stopped: false });
    const [spinsStateB, setSpinsStateB] = useState<SpinTeamState>({ spins: [null, null, null], banked: 0, forfeited: false, bonusUsed: false, stopped: false });

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
                        setSpinsStateA({ spins: [null, null, null], banked: 0, forfeited: false, bonusUsed: false, stopped: false });
                        setSpinsStateB({ spins: [null, null, null], banked: 0, forfeited: false, bonusUsed: false, stopped: false });
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

export interface SpinTeamState {
    spins: [number | null, number | null, number | null];
    banked: number;
    forfeited: boolean;
    bonusUsed: boolean;
    stopped: boolean;
}

export function SpinTeamCard({ name, accent, st, onChange }: {
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

    const handleStop = (i: 0|1|2) => {
        const total = runningTotal + spinResult(i);
        onChange({ ...st, banked: total, stopped: true });
    };

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
        onChange({ spins: [null, null, null], banked: 0, forfeited: false, bonusUsed: false, stopped: false });
    };

    // Progress indicator
    const spinsCompleted = st.spins.filter(s => s !== null).length;

    const s = (i: 0|1|2) => {
        const isActive = activeSpinIdx === i && !st.forfeited && !st.stopped;
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
                        <button className="btn" onClick={() => handleStop(i)} disabled={!spinResult(i)}
                            style={{ flex: 1, padding: "8px", fontSize: 12, fontWeight: 700, background: "rgba(255,180,0,0.15)", border: "1px solid var(--amber)", color: "var(--amber)" }}>
                            🛑 STOP<br /><span style={{ fontSize: 10 }}>bank {runningTotal + spinResult(i)}pts</span>
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
            <div style={{ marginTop: 12, textAlign: "center", fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, color: st.forfeited ? "var(--red)" : st.stopped ? "var(--amber)" : accent }}>
            {st.forfeited ? "FORFEITED — 0 pts" : st.stopped ? `🛑 STOPPED & BANKED: ${st.banked} pts` : `BANKED: ${st.banked} pts`}
            </div>
        </div>
    );
}

export function SpinsPanel({ teamAName, teamBName, stateA, stateB, onChangeA, onChangeB, onAddToMain }: {
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
