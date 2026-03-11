import stageBg from "../../assets/stage-bg.jpg";
import categoryFrame from "../../assets/category-frame.png";
import type { ScoreboardState } from "../../types";
import { TILE } from "../../data/categories";
import { DEFAULT_CATEGORIES } from "../../data/categories";

interface Props {
    state: ScoreboardState;
}

// ─── Padlock SVG ──────────────────────────────────────────────────────────
function Padlock() {
    return (
        <div
            style={{
                position: "absolute", inset: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                background: "rgba(0,0,0,0.55)", borderRadius: "inherit",
            }}
        >
            <svg width="clamp(28px,4vw,44px)" height="clamp(32px,4.8vw,52px)" viewBox="0 0 44 52" fill="none">
                <rect x="4" y="22" width="36" height="26" rx="6" fill="#555" stroke="#666" strokeWidth="1.5" />
                <path d="M12 22V16a10 10 0 0120 0v6" stroke="#666" strokeWidth="4.5" strokeLinecap="round" fill="none" />
                <circle cx="22" cy="33" r="4.5" fill="#333" />
                <rect x="19.5" y="33" width="5" height="7" rx="2.5" fill="#333" />
            </svg>
        </div>
    );
}

export function StageCategoryBoard({ state }: Props) {
    const cats = state.categories || DEFAULT_CATEGORIES;
    const active = cats.find((c) => c.id === state.activeCategory);
    const showQuestion = !!active && !active.used;

    return (
        <div style={{
            position: "fixed",
            inset: "20px", // Reduced from 0 to create a small margin
            zIndex: 0,
            borderRadius: "24px", // Add rounded corners for the container
            overflow: "hidden", // Keep the rounded corners effect
            boxShadow: "0 20px 40px rgba(0,0,0,0.6)", // Add depth with shadow
        }}>
            {/* Stage background */}
            <img
                src={stageBg}
                alt=""
                style={{
                    position: "absolute", inset: 0,
                    width: "100%", height: "100%",
                    objectFit: "fill", objectPosition: "center",
                }}
            />
            {/* Dark overlay - slightly darker for better contrast */}
            <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.2)" }} />

            {/* ── QUESTION FULLSCREEN ─────────────────────────────────────── */}
            {showQuestion && active && (
                <div
                    key={active.id}
                    className="fade-in"
                    style={{
                        position: "absolute", inset: 0, zIndex: 20,
                        display: "flex", flexDirection: "column",
                        alignItems: "center", justifyContent: "center",
                        padding: "80px clamp(48px,10vw,160px)", // Increased padding
                        background: `radial-gradient(ellipse 90% 80% at 50% 40%, ${
                            TILE[active.id]?.glow ?? "#fff"
                        }1a, rgba(0,0,0,0.92))`,
                    }}
                >
                    {/* Category badge */}
                    <div
                        style={{
                            fontFamily: "'DM Mono', monospace",
                            fontSize: "clamp(16px,2.5vw,28px)", // Increased font size
                            letterSpacing: "0.45em",
                            color: TILE[active.id]?.border ?? "#fff",
                            textTransform: "uppercase",
                            marginBottom: 48, // Increased margin
                            padding: "12px 40px", // Increased padding
                            textAlign:"center",
                            border: `4px solid ${TILE[active.id]?.border ?? "#fff"}60`,
                            borderRadius: 70,
                            background: `${TILE[active.id]?.glow ?? "#fff"}18`,
                            backdropFilter: "blur(8px)",
                        }}
                    >
                        {active.name}
                    </div>

                    {/* Question */}
                    <div
                        className="reveal-slide"
                        style={{
                            fontFamily: "'Bebas Neue', sans-serif",
                            fontSize: "72px", // Increased max size
                            letterSpacing: "0.04em",
                            color: "white",
                            textAlign: "center",
                            lineHeight: 1.1,
                            maxWidth: 1400, // Increased max width
                            textShadow: `0 0 80px ${TILE[active.id]?.glow ?? "#fff"}55, 0 4px 20px rgba(0,0,0,0.8)`,
                        }}
                    >
                        {active.question || (
                            <span style={{ opacity: 0.3 }}>Waiting for question…</span>
                        )}
                    </div>

                    {/* Answer */}
                    {state.showAnswer && active.answer && (
                        <div
                            className="reveal-slide"
                            style={{
                                marginTop: 64, // Increased margin
                                paddingTop: 52, // Increased padding
                                borderTop: `2px solid ${TILE[active.id]?.border ?? "#fff"}40`,
                                width: "100%", maxWidth: 1300, // Increased max width
                                display: "flex", flexDirection: "column",
                                alignItems: "center", gap: 20, // Increased gap
                                animationDelay: "0.05s",
                            }}
                        >
                            <div
                                style={{
                                    fontFamily: "'DM Mono', monospace",
                                    fontSize: "14px", // Increased font size
                                    letterSpacing: "0.6em",
                                    color: TILE[active.id]?.border ?? "#fff",
                                    opacity: 0.6,
                                }}
                            >
                                ANSWER
                            </div>
                            <div
                                style={{
                                    fontFamily: "'Bebas Neue', sans-serif",
                                    fontSize: "clamp(42px,7vw,96px)", // Increased max size
                                    letterSpacing: "0.06em",
                                    color: TILE[active.id]?.border ?? "#fff",
                                    textAlign: "center",
                                    textShadow: `0 0 60px ${TILE[active.id]?.glow ?? "#fff"}, 0 0 120px ${TILE[active.id]?.glow ?? "#fff"}66`,
                                    lineHeight: 1.05,
                                }}
                            >
                                {active.answer}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ── CATEGORY BOARD ──────────────────────────────────────────── */}
            {!showQuestion && (
                <div
                    className="fade-in"
                    style={{
                        position: "absolute", inset: 0, zIndex: 10,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        padding: "40px", // Add padding around the board
                    }}
                >
                    <div style={{ position: "relative", width: "100%", maxWidth: "1400px" }}> {/* Increased max width */}
                        {/* Neon frame */}
                        <img
                            src={categoryFrame}
                            alt=""
                            style={{
                                position: "absolute", inset: "-5% -3%",
                                width: "106%", height: "110%",
                                borderRadius: 40, // Increased border radius
                                objectFit: "fill", pointerEvents: "none", zIndex: 0,
                            }}
                        />

                        {/* Inner board */}
                        <div
                            style={{
                                position: "relative", zIndex: 1,
                                borderRadius: 24, // Increased border radius
                                padding: "40px", // Increased padding
                            }}
                        >
                            <div
                                style={{
                                    display: "grid",
                                    gridTemplateColumns: "repeat(4,1fr)",
                                    gap: "clamp(16px,2vw,24px)", // Increased gap
                                }}
                            >
                                {cats.map((cat) => {
                                    const ts = TILE[cat.id] ?? {
                                        fill: cat.color,
                                        glow: cat.borderColor,
                                        border: cat.borderColor,
                                    };

                                    return (
                                        <div
                                            key={cat.id}
                                            style={{
                                                position: "relative",
                                                background: cat.used
                                                    ? ts.fill
                                                    : ts.fill,
                                                border: cat.used
                                                    ? "2px solid #2a2a2a"
                                                    : `2px solid ${ts.border}99`,
                                                borderRadius: "clamp(14px,1.5vw,20px)", // Increased border radius
                                                minHeight: "clamp(100px,14vw,160px)", // Increased min height
                                                display: "flex", alignItems: "center", justifyContent: "center",
                                                boxShadow: cat.used
                                                    ? "none"
                                                    : `0 0 32px ${ts.glow}55, inset 0 0 24px rgba(255,255,255,0.05)`,
                                                transition: "all 0.4s ease",
                                                opacity: cat.used ? 0.5 : 1,
                                                overflow: "hidden",
                                            }}
                                        >
                                            {/* Shine overlay */}
                                            {!cat.used && (
                                                <div
                                                    style={{
                                                        position: "absolute", inset: 0,
                                                        background: "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0.15) 50%, transparent 80%)",
                                                        borderRadius: "inherit",
                                                        pointerEvents: "none",
                                                        mixBlendMode: "overlay",
                                                    }}
                                                />
                                            )}
                                            {/* Inner border ring */}
                                            {!cat.used && (
                                                <div
                                                    style={{
                                                        position: "absolute",
                                                        inset: 3, // Slightly larger inset
                                                        border: `1px solid ${ts.border}55`,
                                                        borderRadius: "clamp(10px,1vw,15px)", // Adjusted for larger tiles
                                                        pointerEvents: "none",
                                                        boxShadow: "inset 0 0 16px rgba(0,0,0,0.7)"
                                                    }}
                                                />
                                            )}

                                            <span
                                                className="category-name"
                                                style={{

                                                    color: cat.used ? "#bebbbb" : "white",
                                                    textAlign: "center", lineHeight: 1.2,
                                                    padding: "0 12px", // Increased padding
                                                    textShadow: cat.used ? "none" : `0 0 28px ${ts.glow}cc, 0 2px 10px rgba(0,0,0,0.9)`,
                                                    position: "relative", zIndex: 1,
                                                }}
                                            >
                                                {cat.name}
                                            </span>

                                            {cat.used && <Padlock />}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}