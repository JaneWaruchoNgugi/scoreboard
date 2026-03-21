import { useState } from "react";
import "../shared/GlobalStyles.css";
import { ScoreboardDisplay } from "../shared/ScoreboardDisplay";
// import { CountdownDisplay } from "../shared/CountdownDisplay";
import { useFirebaseState } from "../../hooks/useFirebaseState";
import { QuestionsPanel } from "./QuestionsPanel.tsx";

interface Props {
    onBack: () => void;
}

const STATUS_COLOR: Record<string, string> = {
    connecting: "var(--text3)",
    live: "var(--green)",
    offline: "var(--red)",
};
const STATUS_LABEL: Record<string, string> = {
    connecting: "CONNECTING",
    live: "LIVE",
    offline: "OFFLINE",
};

type Tab = "scores" | "questions";

export function ViewerView({ onBack }: Props) {
    const { state, status } = useFirebaseState();
    const [activeTab, setActiveTab] = useState<Tab>("scores");
    const color = STATUS_COLOR[status];

    return (
        <div
            style={{
                minHeight: "100vh",
                background:
                    "radial-gradient(ellipse 100% 50% at 50% 0%, rgba(0,212,255,0.04), transparent), var(--bg)",
                display: "flex", flexDirection: "column", alignItems: "center",
            }}
        >
            {/* ── Top bar ── */}
            <div
                style={{
                    width: "100%", maxWidth: 1200,
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "20px 24px", flexWrap: "wrap", gap: 12,
                }}
            >
                <button
                    className="btn"
                    onClick={onBack}
                    style={{
                        background: "var(--surface2)", color: "var(--text2)",
                        padding: "10px 20px", fontSize: 13, border: "1px solid var(--border)",
                    }}
                >
                    ← Back
                </button>

                {/* Status pill */}
                <div
                    style={{
                        display: "flex", alignItems: "center", gap: 8,
                        background: "var(--surface2)", padding: "8px 16px",
                        borderRadius: 100, border: "1px solid var(--border)",
                        fontFamily: "'DM Mono', monospace",
                        fontSize: 11, letterSpacing: "0.15em", color,
                    }}
                >
                    <div
                        style={{
                            width: 7, height: 7, borderRadius: "50%", background: color,
                            boxShadow: status === "live" ? `0 0 10px ${color}` : "none",
                            animation: status === "live" ? "pulse 2s infinite" : "none",
                        }}
                    />
                    {STATUS_LABEL[status]}
                </div>
            </div>

            {/* ── Main content ── */}
            <div
                className="fade-up"
                style={{
                    width: "100%", maxWidth: 1800,
                    padding: "0 24px 40px",
                    display: "flex", flexDirection: "column", gap: 16,
                }}
            >
                {/* ── Tab switcher (improved styling) ── */}
                <div
                    style={{
                        display: "flex",
                        background: "var(--surface2)",
                        border: "1px solid var(--border)",
                        borderRadius: 12,
                        padding: 4,
                        gap: 4,
                        alignSelf: "center",
                        width: "100%",
                        maxWidth: 400,
                        position: "sticky",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                    }}
                >
                    {(["scores", "questions"] as Tab[]).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            style={{
                                flex: 1,
                                background: activeTab === tab
                                    ? "var(--primary)"
                                    : "transparent",
                                color: activeTab === tab
                                    ? "#00e5a0"
                                    : "var(--text2)",
                                border:`2px solid ${activeTab === tab
                                    ? "#00e5a0"
                                    : "transparent"
                                }`  ,
                                borderRadius: 8,
                                padding: "12px 0",
                                fontFamily: "'DM Mono', monospace",
                                fontSize: 12,
                                letterSpacing: "0.12em",
                                fontWeight: activeTab === tab ? 600 : 500,
                                cursor: "pointer",
                                transition: "all 0.2s ease",
                                // Hover effect for inactive tabs
                                ...(activeTab !== tab && {
                                    ":hover": {
                                        background: "var(--surface3)",
                                        color: "var(--text1)",
                                    },
                                }),
                                // Active tab shadow
                                ...(activeTab === tab && {
                                    boxShadow: "0 2px 8px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.1)",
                                }),
                            }}
                            // To make hover work with inline styles, we'd need to add a class or use CSS modules.
                            // Since we're using inline styles, we'll add a className instead for hover effects.
                            // Let's add a className to handle hover properly.
                        >
                            {tab === "scores" ? "📊 SCORES" : "📋 QUESTIONS"}
                        </button>
                    ))}
                </div>

                {/* ── Tab content ── */}
                {activeTab === "scores" && (
                    <ScoreboardDisplay state={state} showScores={true} />
                )}
                {activeTab === "questions" && (
                    <QuestionsPanel round={state.timerRound} showAnswers={true} />
                )}
            </div>
        </div>
    );
}