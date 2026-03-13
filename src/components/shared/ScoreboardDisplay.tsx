import { useState, useEffect } from "react";
import type { ScoreboardState } from "../../types";
import { ScoreCard } from "./ScoreCard";

interface Props {
    state: ScoreboardState;
    showScores?: boolean; // Add this prop
}

export function ScoreboardDisplay({ state, showScores = false }: Props) { // Accept the prop
    const [tick, setTick] = useState(true);
    useEffect(() => {
        const t = setInterval(() => setTick((b) => !b), 900);
        return () => clearInterval(t);
    }, []);

    return (
        <div
            style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: 24,
                overflow: "hidden",
            }}
        >
            {/* Header (unchanged) */}
            <div
                style={{
                    background: "var(--surface2)",
                    borderBottom: "1px solid var(--border)",
                    padding: "14px 24px",
                    display: "flex", alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap", gap: 12,
                }}
            >
                {/* ... header content remains the same ... */}
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div
                        style={{
                            width: 8, height: 8, borderRadius: "50%",
                            background: "var(--red)", boxShadow: "0 0 12px var(--red)",
                            animation: "pulse 1.5s infinite",
                        }}
                    />
                    <span
                        style={{
                            fontFamily: "'DM Mono', monospace",
                            fontSize: 11, letterSpacing: "0.2em",
                            color: "var(--red)", fontWeight: 500,
                        }}
                    >
                        LIVE
                    </span>
                </div>

                <div
                    style={{
                        display: "flex", alignItems: "center", gap: 10,
                        background: "var(--surface3)", padding: "8px 18px",
                        borderRadius: 100, border: "1px solid var(--border2)",
                    }}
                >
                    <span
                        style={{
                            fontFamily: "'Bebas Neue', sans-serif",
                            fontSize: 18, letterSpacing: "0.1em", color: "var(--text)",
                        }}
                    >
                        {state.period}
                    </span>
                    <span style={{ color: "var(--text3)", fontSize: 14 }}>·</span>
                    <span
                        style={{
                            fontFamily: "'DM Mono', monospace", fontSize: 16, fontWeight: 500,
                            color: tick ? "var(--cyan)" : "var(--text3)", transition: "color 0.1s",
                        }}
                    >
                        Round
                    </span>
                </div>

                <div
                    style={{
                        fontFamily: "'DM Mono', monospace",
                        fontSize: 11, color: "var(--text3)", letterSpacing: "0.05em",
                    }}
                >
                    {state.lastUpdated
                        ? new Date(state.lastUpdated).toLocaleTimeString([], {
                            hour: "2-digit", minute: "2-digit", second: "2-digit",
                        })
                        : "—"}
                </div>
            </div>

            {/* Scores - Pass showScores prop to ScoreCard */}
            <div style={{ display: "flex", alignItems: "center" }}>
                <ScoreCard team={state.teamA} isHome={true} showScore={showScores} />
                <div
                    style={{
                        display: "flex", flexDirection: "column", alignItems: "center",
                        gap: 10, padding: "0 16px", flexShrink: 0,
                    }}
                >
                    <div style={{ width: 1, height: 60, background: "linear-gradient(to bottom, transparent, var(--border2), transparent)" }} />
                    <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, letterSpacing: "0.1em", color: "var(--text3)" }}>VS</span>
                    <div style={{ width: 1, height: 60, background: "linear-gradient(to bottom, transparent, var(--border2), transparent)" }} />
                </div>
                <ScoreCard team={state.teamB} isHome={false} showScore={showScores} />
            </div>

            {/* Optional: Add a subtle indicator when scores are hidden */}
            {!showScores && (
                <div
                    style={{
                        padding: "8px 16px",
                        textAlign: "center",
                        borderTop: "1px solid var(--border2)",
                        fontFamily: "'DM Mono', monospace",
                        fontSize: 10,
                        color: "var(--text3)",
                        letterSpacing: "0.1em",
                        background: "rgba(0,0,0,0.2)",
                    }}
                >
                    🔒 SCORES HIDDEN
                </div>
            )}
        </div>
    );
}