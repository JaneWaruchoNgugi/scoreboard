import type { ScoreboardState } from "../../types";
import { useCountdown } from "../../hooks/useCountdown";

interface Props {
    state: ScoreboardState;
}

export function CountdownDisplay({ state }: Props) {
    const { secs, isWarning, isEnd, progress } = useCountdown(state);

    const circumference = 2 * Math.PI * 54;
    const timerColor = isEnd ? "var(--text3)" : isWarning ? "var(--red)" : "var(--green)";
    const ringColor  = isEnd ? "#333"          : isWarning ? "var(--red)" : "var(--green)";

    return (
        <div
            style={{
                background: "var(--surface)",
                border: `1px solid ${isWarning ? "rgba(255,64,96,0.4)" : "var(--border)"}`,
                borderRadius: 24, padding: "28px 24px",
                display: "flex", flexDirection: "column", alignItems: "center", gap: 16,
                transition: "border-color 0.3s",
                boxShadow: isWarning ? "0 0 40px rgba(255,64,96,0.15)" : "none",
            }}
        >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div
                    style={{
                        fontFamily: "'DM Mono', monospace",
                        fontSize: 11, letterSpacing: "0.25em", color: "var(--text3)",
                    }}
                >
                    ROUND {state.timerRound} TIMER
                </div>
                {state.timerRunning && !isEnd && (
                    <div
                        style={{
                            width: 7, height: 7, borderRadius: "50%",
                            background: "var(--green)", boxShadow: "0 0 10px var(--green)",
                            animation: "pulse 1s infinite",
                        }}
                    />
                )}
            </div>

            {/* Ring */}
            <div style={{ position: "relative", width: 140, height: 140 }}>
                <svg width="140" height="140" style={{ transform: "rotate(-90deg)" }}>
                    <circle cx="70" cy="70" r="54" fill="none" stroke="var(--surface3)" strokeWidth="8" />
                    <circle
                        cx="70" cy="70" r="54" fill="none" stroke={ringColor}
                        strokeWidth="8" strokeDasharray={circumference}
                        strokeDashoffset={circumference * (1 - progress)}
                        strokeLinecap="round"
                        style={{ transition: "stroke-dashoffset 0.25s linear, stroke 0.3s ease" }}
                    />
                </svg>
                <div
                    style={{
                        position: "absolute", inset: 0,
                        display: "flex", flexDirection: "column",
                        alignItems: "center", justifyContent: "center",
                    }}
                >
                    <div
                        className={isWarning ? "timer-warning" : ""}
                        style={{
                            fontFamily: "'Bebas Neue', sans-serif",
                            fontSize: isEnd ? 36 : 52,
                            letterSpacing: "-0.02em",
                            color: timerColor, lineHeight: 1,
                        }}
                    >
                        {isEnd ? "END" : secs}
                    </div>
                    {!isEnd && (
                        <div
                            style={{
                                fontFamily: "'DM Mono', monospace",
                                fontSize: 10, color: "var(--text3)", letterSpacing: "0.1em",
                            }}
                        >
                            SEC
                        </div>
                    )}
                </div>
            </div>

            <div
                style={{
                    display: "flex", gap: 12, alignItems: "center",
                    fontFamily: "'DM Mono', monospace",
                    fontSize: 11, color: "var(--text3)", letterSpacing: "0.1em",
                }}
            >
                <span>DURATION: {state.timerDuration}s</span>
                <span style={{ color: "var(--surface3)" }}>|</span>
                <span style={{ color: state.timerRunning && !isEnd ? "var(--green)" : "var(--text3)" }}>
                    {isEnd ? "FINISHED" : state.timerRunning ? "RUNNING" : "READY"}
                </span>
            </div>
        </div>
    );
}
