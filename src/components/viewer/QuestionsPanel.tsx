// shared/QuestionsPanel.tsx
import { useState } from "react";
import { useQuestions } from "../../hooks/useQuestions.ts";
import { useFirebaseState } from "../../hooks/useFirebaseState";
import { CountdownDisplay } from "../shared/CountdownDisplay.tsx";

interface Props {
    round: number;
    showAnswers?: boolean;
}

export function QuestionsPanel({ round, showAnswers = false }: Props) {
    const { round1, round2, round3 } = useQuestions();
    const { state } = useFirebaseState();
    const [activeCategory, setActiveCategory] = useState<number>(1);

    const categories = round2.map((c) => ({ id: c.id, name: c.name, emoji: c.emoji }));

    const selectedCat = round2.find((c) => c.id === activeCategory);

    const countLabel = () => {
        if (round === 1) return `${round1.length} QUESTIONS`;
        if (round === 2) return `${round2.length} CATEGORIES · ${round2.reduce((s, c) => s + c.questions.length, 0)} QUESTIONS`;
        return `${round3.length} QUESTIONS`;
    };

    return (
        <div
            style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: 16,
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
            }}
        >
            {/* Header */}
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "16px 20px",
                    borderBottom: "1px solid var(--border)",
                    background: "var(--surface2)",
                    flexWrap: "wrap",
                    gap: 12,
                }}
            >
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: "0.15em", color: "var(--text3)" }}>
                    QUESTIONS
                </span>

                <div style={{ display: "flex", background: "var(--bg)", borderRadius: 8, padding: 3, border: "1px solid var(--border)", gap: 2 }}>
                    {([1, 2] as const).map((r) => (
                        <div
                            key={r}
                            style={{
                                background: round === r ? "var(--primary)" : "transparent",
                                color: round === r ? "white" : "var(--text3)",
                                borderRadius: 6,
                                padding: "6px 16px",
                                fontFamily: "'DM Mono', monospace",
                                fontSize: 11,
                                letterSpacing: "0.12em",
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

            {/* Sticky timer */}
            <div
                style={{
                    position: "sticky",
                    top: 0,
                    zIndex: 10,
                    background: "var(--bg)",
                    padding: "12px 20px",
                    borderBottom: "1px solid var(--border)",
                }}
            >
                <CountdownDisplay state={state} muted={false} />
            </div>

            {/* Round 2 category filter bar */}
            {round === 2 && (
                <div
                    style={{
                        display: "flex",
                        gap: 8,
                        padding: "12px 16px",
                        borderBottom: "1px solid var(--border)",
                        background: "var(--bg)",
                        overflowX: "auto",
                        scrollbarWidth: "none",
                    }}
                >
                    {categories.map((cat, i) => {
                        const isActive = activeCategory === cat.id;
                        const neonColors = [
                            "#ff2d78", "#00e5ff", "#aaff00", "#ff9100",
                            "#d500f9", "#00e676", "#ffea00", "#2979ff",
                            "#ff6d00", "#1de9b6",
                        ];
                        const neon = neonColors[i % neonColors.length];
                        return (
                            <button
                                key={String(cat.id)}
                                onClick={() => setActiveCategory(cat.id)}
                                style={{
                                    flexShrink: 0,
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 6,
                                    padding: "7px 14px",
                                    borderRadius: 20,
                                    border: isActive
                                        ? `2px solid ${neon}`
                                        : `1px solid ${neon}22`,
                                    background: isActive ? `${neon}18` : "var(--surface)",
                                    color: isActive ? neon : "var(--text3)",
                                    boxShadow: isActive ? `0 0 8px ${neon}66` : "none",
                                    fontFamily: "'DM Mono', monospace",
                                    fontSize: 14,
                                    fontWeight:600,
                                    letterSpacing: "0.08em",
                                    cursor: "pointer",
                                    transition: "all 0.18s ease",
                                    whiteSpace: "nowrap",
                                }}
                            >
                                <span>{cat.emoji}</span>
                                {cat.name}
                            </button>
                        );
                    })}
                </div>
            )}

            {/* Round 1 questions */}
            {round === 1 && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 1, background: "var(--border)" }}>
                    {round1.map((q) => (
                        <QuestionRow key={q.id} q={q} showAnswers={showAnswers} />
                    ))}
                </div>
            )}

            {/* Round 2 — specific category */}
            {round === 2 && selectedCat && (
                <div style={{ padding: "8px 0" }}>
                    {selectedCat.questions.map((q) => (
                        <div
                            key={q.id}
                            style={{
                                padding: "12px 20px",
                                display: "flex",
                                gap: 12,
                                alignItems: "flex-start",
                                borderBottom: "1px solid var(--border)",
                            }}
                        >
                            <span style={{ flexShrink: 0, fontFamily: "'DM Mono', monospace", fontSize: 10, color: "var(--primary)", marginTop: 2, minWidth: 20 }}>
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
            )}

            {/* Round 3 questions */}
            {round === 3 && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 1, background: "var(--border)" }}>
                    {round3.map((q) => (
                        <QuestionRow key={q.id} q={q} showAnswers={showAnswers} />
                    ))}
                </div>
            )}
        </div>
    );
}

function QuestionRow({ q, showAnswers }: { q: { id: number; question: string; answer: string }; showAnswers: boolean }) {
    return (
        <div style={{ background: "var(--surface)", padding: "14px 18px", display: "flex", gap: 12, alignItems: "flex-start" }}>
            <span
                style={{
                    flexShrink: 0, width: 28, height: 28, borderRadius: "50%",
                    background: "var(--surface2)", border: "1px solid var(--border)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontFamily: "'DM Mono', monospace", fontSize: 10, color: "var(--text3)", marginTop: 1,
                }}
            >
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
