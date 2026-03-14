// shared/QuestionsPanel.tsx
import { useQuestions } from "../../hooks/useQuestions.ts";

interface Props {
    /** Controlled by parent (Firebase state.timerRound) — no internal state. */
    round: 1 | 2 | 3;
    showAnswers?: boolean;
}

export function QuestionsPanel({ round, showAnswers = false }: Props) {
    const { round1, round2, round3 } = useQuestions();

    const countLabel = () => {
        if (round === 1) return `${round1.length} QUESTIONS`;
        if (round === 2) return `${round2.length} CATEGORIES · ${round2.reduce((s, c) => s + c.questions.length, 0)} QUESTIONS`;
        return `${round3.length} QUESTIONS`;
    };

    return (
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, overflow: "hidden" }}>

            {/* ── Panel header ── */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid var(--border)", background: "var(--surface2)", flexWrap: "wrap", gap: 12 }}>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: "0.15em", color: "var(--text3)" }}>
                    QUESTIONS
                </span>

                {/* Round badge — read-only, driven by admin */}
                <div style={{ display: "flex", background: "var(--bg)", borderRadius: 8, padding: 3, border: "1px solid var(--border)", gap: 2 }}>
                    {([1, 2, 3] as const).map((r) => (
                        <div
                            key={r}
                            style={{
                                background: round === r ? "var(--primary)" : "transparent",
                                color: round === r ? "white" : "var(--text3)",
                                borderRadius: 6, padding: "6px 16px",
                                fontFamily: "'DM Mono', monospace", fontSize: 11,
                                letterSpacing: "0.12em",
                                // Not a button — display only
                            }}
                        >
                            ROUND {r}
                        </div>
                    ))}
                </div>

                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "var(--text3)" }}>
                    {countLabel()}
                </span>
            </div>

            {/* ── Round 1: 20 questions ── */}
            {round === 1 && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 1, background: "var(--border)" }}>
                    {round1.map((q) => <QuestionRow key={q.id} q={q} showAnswers={showAnswers} />)}
                </div>
            )}

            {/* ── Round 2: category cards ── */}
            {round === 2 && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16, padding: 16 }}>
                    {round2.map((cat) => (
                        <div key={cat.id} style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden" }}>
                            <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 8, background: "var(--bg)" }}>
                                <span style={{ fontSize: 18 }}>{cat.emoji}</span>
                                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: "0.12em", color: "var(--text2)", fontWeight: 600 }}>
                                    {cat.name.toUpperCase()}
                                </span>
                            </div>
                            <div style={{ padding: "8px 0" }}>
                                {cat.questions.map((q) => (
                                    <div key={q.id} style={{ padding: "10px 16px", display: "flex", gap: 10, alignItems: "flex-start", borderBottom: q.id < cat.questions.length ? "1px solid var(--border)" : "none" }}>
                                        <span style={{ flexShrink: 0, fontFamily: "'DM Mono', monospace", fontSize: 10, color: "var(--primary)", marginTop: 2, minWidth: 16 }}>
                                            Q{q.id}
                                        </span>
                                        <div style={{ flex: 1 }}>
                                            <p style={{ margin: 0, fontSize: 13, color: "var(--text1)", lineHeight: 1.5 }}>{q.question}</p>
                                            {showAnswers && (
                                                <p style={{ margin: "3px 0 0", fontSize: 11, color: "var(--green)", fontFamily: "'DM Mono', monospace" }}>
                                                    ✓ {q.answer}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ── Round 3: 6 general questions ── */}
            {round === 3 && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 1, background: "var(--border)" }}>
                    {round3.map((q) => <QuestionRow key={q.id} q={q} showAnswers={showAnswers} />)}
                </div>
            )}
        </div>
    );
}

// ── Shared row for Round 1 and Round 3 ────────────────────────────────────
function QuestionRow({ q, showAnswers }: { q: { id: number; question: string; answer: string }; showAnswers: boolean }) {
    return (
        <div style={{ background: "var(--surface)", padding: "14px 18px", display: "flex", gap: 12, alignItems: "flex-start" }}>
            <span style={{ flexShrink: 0, width: 28, height: 28, borderRadius: "50%", background: "var(--surface2)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Mono', monospace", fontSize: 10, color: "var(--text3)", marginTop: 1 }}>
                {q.id}
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: 13, color: "var(--text1)", lineHeight: 1.5 }}>{q.question}</p>
                {showAnswers && (
                    <p style={{ margin: "4px 0 0", fontSize: 12, color: "var(--green)", fontFamily: "'DM Mono', monospace" }}>
                        ✓ {q.answer}
                    </p>
                )}
            </div>
        </div>
    );
}