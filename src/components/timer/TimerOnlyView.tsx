import stageBg from "../../assets/stage-bg.jpg";
import bongoQuiz from "../../assets/bongoQuiz.png";
import "../shared/GlobalStyles.css";
// import {StageCategoryBoard} from "../shared/StageCategoryBoard";
import {useFirebaseState} from "../../hooks/useFirebaseState";
import {useCountdown} from "../../hooks/useCountdown";
import { useState } from "react";

interface Props {
    onBack: () => void;
}

const STATUS_COLOR: Record<string, string> = {
    connecting: "var(--text3)",
    live: "var(--green)",
    offline: "var(--red)",
};

export function TimerOnlyView({onBack}: Props) {
    const {state, status} = useFirebaseState();
    const {secs, isWarning, isEnd, progress} = useCountdown(state);
    const [imageLoaded, setImageLoaded] = useState(false);

    const R = 200;
    const circumference = 2 * Math.PI * R;

    const timerColor = isEnd ? "var(--text3)" : isWarning ? "var(--red)" : "var(--green)";
    const ringColor = isEnd ? "#222" : isWarning ? "var(--red)" : "var(--green)";
    const glowColor = isEnd ? "transparent" : isWarning ? "rgba(255,64,96,0.35)" : "rgba(0,229,160,0.25)";
    const sc = STATUS_COLOR[status];

    // ── ROUND 2: full stage board + floating mini-timer ─────────────────────
    if (state.timerRound === 2) {
        return (
            <div style={{position: "fixed", inset: 0, overflow: "hidden"}}>
                {/*<StageCategoryBoard state={state}/>*/}

                {/* Floating HUD */}
                <div
                    style={{
                        position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 50,
                        display: "flex", flexDirection: "column", alignItems: "center",
                        padding: "22px",
                        pointerEvents: "none",
                    }}
                >
                    {/* Back button - repositioned to top-left */}
                    <div style={{
                        position: "absolute", top: 22, left: 22,
                        pointerEvents: "all"
                    }}>
                        <button
                            className="btn"
                            onClick={onBack}
                            style={{
                                background: "rgba(0,0,0,0.75)", color: "rgba(255,255,255,0.7)",
                                padding: "9px 18px", fontSize: 12,
                                border: "1px solid rgba(255,255,255,0.12)", backdropFilter: "blur(10px)",
                            }}
                        >
                            ← Back
                        </button>
                    </div>

                    {/* Status pill - repositioned to top-right */}
                    <div style={{
                        position: "absolute", top: 22, right: 22,
                        pointerEvents: "none"
                    }}>
                        <div
                            style={{
                                display: "flex", alignItems: "center", gap: 7,
                                background: "rgba(0,0,0,0.75)", padding: "6px 14px",
                                borderRadius: 100, border: "1px solid rgba(255,255,255,0.1)",
                                backdropFilter: "blur(10px)",
                                fontFamily: "'DM Mono', monospace",
                                fontSize: 10, letterSpacing: "0.15em", color: sc,
                            }}
                        >
                            <div
                                style={{
                                    width: 6, height: 6, borderRadius: "50%", background: sc,
                                    boxShadow: status === "live" ? `0 0 8px ${sc}` : "none",
                                    animation: status === "live" ? "pulse 2s infinite" : "none",
                                }}
                            />
                            {status.toUpperCase()}
                        </div>
                    </div>

                    {/* Top-centered BIG timer */}
                    <div
                        style={{
                            display: "flex", flexDirection: "column", alignItems: "center",
                            marginTop: "0",
                            transform: "scale(0.8)",
                            pointerEvents: "none",
                        }}
                    >
                        <div style={{position: "relative", width: 200, height: 200}}>
                            <svg width="200" height="200" style={{transform: "rotate(-90deg)"}}>
                                <circle cx="100" cy="100" r="80" fill="none" stroke="rgba(255,255,255,0.07)"
                                        strokeWidth="10"/>
                                <circle
                                    cx="100" cy="100" r="80" fill="none" stroke={ringColor} strokeWidth="10"
                                    strokeDasharray={2 * Math.PI * 80}
                                    strokeDashoffset={2 * Math.PI * 80 * (1 - progress)}
                                    strokeLinecap="round"
                                    style={{
                                        transition: "stroke-dashoffset 0.15s linear, stroke 0.4s ease",
                                        filter: `drop-shadow(0 0 12px ${glowColor})`,
                                    }}
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
                                        fontSize: isEnd ? 48 : 92,
                                        color: timerColor, lineHeight: 1,
                                        textShadow: isWarning
                                            ? "0 0 30px rgba(255,64,96,0.8)"
                                            : "0 0 30px rgba(0,229,160,0.6)",
                                    }}
                                >
                                    {isEnd ? "END" : secs}
                                </div>
                                {!isEnd && (
                                    <div style={{
                                        fontFamily: "'DM Mono', monospace",
                                        fontSize: 14,
                                        color: "rgba(255,255,255,0.4)",
                                        letterSpacing: "0.2em",
                                        marginTop: 4
                                    }}>
                                        SECONDS
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ── ROUND 1: stage background + big ring ────────────────────────────────
    return (
        <div
            style={{
                minHeight: "100vh", width: "100%", position: "relative",
                overflow: "hidden", display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center",
            }}
        >
            {/* Shimmering loader - shown while image is loading */}
            {!imageLoaded && (
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        width: "100%",
                        height: "100%",
                        background: "linear-gradient(90deg, #1a1a1a 0%, #2a2a2a 50%, #1a1a1a 100%)",
                        backgroundSize: "200% 100%",
                        animation: "shimmer 1.5s infinite",
                        zIndex: 1,
                    }}
                />
            )}

            {/* Stage bg with loading handler */}
            <img
                src={stageBg}
                alt=""
                onLoad={() => setImageLoaded(true)}
                style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    opacity: imageLoaded ? 1 : 0,
                    transition: "opacity 0.5s ease-in-out",
                    zIndex: 2,
                }}
            />

            {/* Top bar */}
            <div style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "20px 28px",
                zIndex: 10
            }}>
                <button className="btn" onClick={onBack} style={{
                    background: "rgba(0,0,0,0.65)",
                    color: "rgba(255,255,255,0.7)",
                    padding: "10px 20px",
                    fontSize: 13,
                    border: "1px solid rgba(255,255,255,0.12)",
                    backdropFilter: "blur(8px)"
                }}>← Back
                </button>
                <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    background: "rgba(0,0,0,0.65)",
                    padding: "8px 16px",
                    borderRadius: 100,
                    border: "1px solid rgba(255,255,255,0.1)",
                    backdropFilter: "blur(8px)",
                    fontFamily: "'DM Mono', monospace",
                    fontSize: 11,
                    letterSpacing: "0.15em",
                    color: sc
                }}>
                    <div style={{
                        width: 7,
                        height: 7,
                        borderRadius: "50%",
                        background: sc,
                        boxShadow: status === "live" ? `0 0 10px ${sc}` : "none",
                        animation: status === "live" ? "pulse 2s infinite" : "none"
                    }}/>
                    {status.toUpperCase()}
                </div>
            </div>
            {state.timerRunning ? (
                // Big ring
                <div style={{
                    position: "relative",
                    zIndex: 5,
                    width: 480,
                    height: 480,
                    maxWidth: "min(480px,78vw)",
                    maxHeight: "min(480px,78vw)"
                }}>
                    <svg width="100%" height="100%" viewBox="0 0 480 480"
                         style={{transform: "rotate(-90deg)", filter: `drop-shadow(0 0 40px ${glowColor})`}}>
                        <circle cx="240" cy="240" r={R} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="14"/>
                        <circle cx="240" cy="240" r={R} fill="none" stroke={ringColor} strokeWidth="14"
                                strokeDasharray={circumference} strokeDashoffset={circumference * (1 - progress)}
                                strokeLinecap="round"
                                style={{transition: "stroke-dashoffset 0.15s linear, stroke 0.4s ease"}}/>
                    </svg>
                    <div style={{
                        position: "absolute",
                        inset: 0,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 4
                    }}>
                        {isEnd ? (
                            <div style={{
                                fontFamily: "'Bebas Neue', sans-serif",
                                fontSize: "clamp(60px,14vw,110px)",
                                letterSpacing: "0.08em",
                                color: "rgba(255,255,255,0.3)",
                                lineHeight: 1
                            }}>TIME</div>
                        ) : (
                            <>
                                <div className={isWarning ? "timer-warning" : ""} style={{
                                    fontFamily: "'Bebas Neue', sans-serif",
                                    fontSize: "clamp(90px,20vw,160px)",
                                    letterSpacing: "-0.03em",
                                    color: timerColor,
                                    lineHeight: 1,
                                    textShadow: isWarning ? "0 0 60px rgba(255,64,96,0.7)" : "0 0 40px rgba(0,229,160,0.4)"
                                }}>
                                    {secs}
                                </div>
                                <div style={{
                                    fontFamily: "'DM Mono', monospace",
                                    fontSize: "clamp(12px,2vw,18px)",
                                    letterSpacing: "0.3em",
                                    color: isWarning ? "rgba(255,64,96,0.6)" : "rgba(255,255,255,0.35)"
                                }}>
                                    SECONDS
                                </div>
                            </>
                        )}
                    </div>
                </div>
            ):(
                <img
                    src={bongoQuiz}
                    alt=""
                    style={{
                        position: "absolute",
                        inset: 0,
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        zIndex: 3,
                    }}
                />
            )}
            <div style={{
                position: "relative",
                zIndex: 5,
                marginTop: 48,
                display: "flex",
                alignItems: "center",
                gap: 16,
                fontFamily: "'DM Mono', monospace",
                fontSize: 12,
                letterSpacing: "0.2em",
                color: "rgba(255,255,255,0.4)"
            }}>
                {state.timerRunning && !isEnd && <div style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: "var(--green)",
                    boxShadow: "0 0 12px var(--green)",
                    animation: "pulse 1s infinite"
                }}/>}
                <span
                    style={{color: isEnd ? "rgba(255,255,255,0.25)" : state.timerRunning ? "var(--green)" : "rgba(255,255,255,0.5)"}}>
                    {isEnd ? "FINISHED" : state.timerRunning ? "RUNNING" : ""}
                </span>
            </div>
        </div>
    );
}