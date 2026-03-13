import { useState, useEffect, useRef } from "react";
import type { Team } from "../../types";

interface Props {
    team: Team;
    isHome: boolean;
    showScore?: boolean; // Add this prop
}

export function ScoreCard({ team, isHome, showScore = false }: Props) {
    const prevScore = useRef(team.score);
    const [popping, setPopping] = useState(false);

    useEffect(() => {
        if (team.score !== prevScore.current) {
            setPopping(true);
            prevScore.current = team.score;
            const t = setTimeout(() => setPopping(false), 400);
            return () => clearTimeout(t);
        }
    }, [team.score]);

    const accent = isHome ? "var(--cyan)" : "var(--amber)";
    const dimAccent = isHome ? "var(--cyan-dim)" : "var(--amber-dim)";

    return (
        <div
            style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: isHome ? "flex-start" : "flex-end",
                padding: "clamp(20px,4vw,44px) clamp(16px,3vw,40px)",
            }}
        >
            <div
                style={{
                    fontFamily: "'DM Mono', monospace",
                    fontSize: 11, letterSpacing: "0.25em",
                    color: accent, marginBottom: 8, opacity: 0.8,
                }}
            >
                {isHome ? "HOME" : "AWAY"}
            </div>
            <div
                style={{
                    fontFamily: "'Bebas Neue', sans-serif",
                    fontSize: "clamp(22px,4.5vw,38px)",
                    letterSpacing: "0.06em", color: "var(--text)",
                    marginBottom: 16,
                    textAlign: isHome ? "left" : "right",
                    maxWidth: "100%", wordBreak: "break-word",
                }}
            >
                {team.name}
            </div>

            {/* Score with hiding functionality */}
            <div
                className={popping && showScore ? "score-pop" : ""}
                style={{
                    fontFamily: "'Bebas Neue', sans-serif",
                    fontSize: "clamp(72px,16vw,148px)",
                    letterSpacing: "-0.02em",
                    color: showScore ? accent : "transparent",
                    lineHeight: 1,
                    textShadow: showScore ? `0 0 60px ${dimAccent}` : "none",
                    position: "relative",
                    background: !showScore
                        ? "repeating-linear-gradient(45deg, rgba(255,255,255,0.1) 0px, rgba(255,255,255,0.1) 8px, rgba(255,255,255,0.05) 8px, rgba(255,255,255,0.05) 16px)"
                        : "none",
                    WebkitBackgroundClip: !showScore ? "text" : "none",
                    backgroundClip: !showScore ? "text" : "none",
                }}
            >
                {showScore ? String(team.score).padStart(2, "0") : "??"}
            </div>

            {/* Optional small indicator */}
            {!showScore && (
                <div
                    style={{
                        fontFamily: "'DM Mono', monospace",
                        fontSize: 9,
                        color: "var(--text3)",
                        marginTop: 4,
                        opacity: 0.5,
                        letterSpacing: "0.1em",
                    }}
                >
                    HIDDEN
                </div>
            )}
        </div>
    );
}