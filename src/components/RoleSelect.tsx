import "./shared/GlobalStyles.css";

interface Props {
    onSelect: (role: string) => void;
}

const ROLES = [
    {
        role: "viewer",
        icon: "◉",
        label: "Bella",
        desc: "Watch scores live",
        accent: "var(--cyan)",
        dimAccent: "var(--cyan-dim)",
    },
    {
        role: "timer-only",
        icon: "⏱",
        label: "CATEGORIES",
        desc: "Edit questions for all rounds",
        accent: "var(--green)",
        dimAccent: "rgba(0,229,160,0.15)",
    },
    {
        role: "admin",
        icon: "⚡",
        label: "Rania",
        desc: "Control the board",
        accent: "var(--amber)",
        dimAccent: "var(--amber-dim)",
    },
];

export function RoleSelect({ onSelect }: Props) {
    return (
        <div
            style={{
                minHeight: "100vh",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexDirection: "column", gap: 48, padding: 24,
                background:
                    "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(0,212,255,0.08), transparent), var(--bg)",
                position: "relative", overflow: "hidden",
            }}
        >

            {/* Grid bg */}
            <div
                style={{
                    position: "absolute", inset: 0, pointerEvents: "none",
                    backgroundImage:
                        "linear-gradient(rgba(0,212,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.03) 1px, transparent 1px)",
                    backgroundSize: "60px 60px",
                }}
            />

            {/* Title */}
            <div className="fade-up" style={{ textAlign: "center", position: "relative" }}>
                <div
                    style={{
                        fontFamily: "'Bebas Neue', sans-serif",
                        fontSize: "clamp(56px,14vw,96px)",
                        letterSpacing: "0.08em", color: "var(--text)", lineHeight: 1,
                        textShadow: "0 0 60px rgba(0,212,255,0.2)",
                    }}
                >
                    BONGOQUIZ
                </div>
                {/*<div*/}
                {/*    style={{*/}
                {/*        fontFamily: "'DM Mono', monospace", fontSize: 11,*/}
                {/*        letterSpacing: "0.4em", color: "var(--cyan)",*/}
                {/*        textTransform: "uppercase", marginTop: 10, opacity: 0.8,*/}
                {/*    }}*/}
                {/*>*/}
                {/*    LIVE · CROSS-DEVICE · REAL-TIME*/}
                {/*</div>*/}
            </div>

            {/* Role cards */}
            <div
                className="fade-up role-cards"
                style={{
                    display: "flex", gap: 20, flexWrap: "wrap",
                    justifyContent: "center", width: "100%", maxWidth: 820,
                    animationDelay: "0.1s",
                }}
            >
                {ROLES.map(({ role, icon, label, desc, accent, dimAccent }) => (
                    <button
                        key={role}
                        onClick={() => onSelect(role)}
                        style={{
                            flex: "1 1 200px", minWidth: 200,
                            padding: "32px 24px",
                            background: "var(--surface)",
                            border: "1px solid var(--border)",
                            borderRadius: 20, cursor: "pointer",
                            display: "flex", flexDirection: "column",
                            alignItems: "center", gap: 14,
                            transition: "all 0.25s ease",
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = accent;
                            e.currentTarget.style.background = "var(--surface2)";
                            e.currentTarget.style.boxShadow = `0 0 40px ${dimAccent}, 0 20px 40px rgba(0,0,0,0.4)`;
                            e.currentTarget.style.transform = "translateY(-3px)";
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = "var(--border)";
                            e.currentTarget.style.background = "var(--surface)";
                            e.currentTarget.style.boxShadow = "none";
                            e.currentTarget.style.transform = "translateY(0)";
                        }}
                    >
                        <span style={{ fontSize: 36, color: accent, filter: `drop-shadow(0 0 12px ${accent})` }}>
                            {icon}
                        </span>
                        <span
                            style={{
                                fontFamily: "'Bebas Neue', sans-serif",
                                fontSize: 28, letterSpacing: "0.1em", color: accent,
                            }}
                        >
                            {label}
                        </span>
                        <span style={{ fontSize: 13, color: "var(--text2)", textAlign: "center", lineHeight: 1.5 }}>
                            {desc}
                        </span>
                    </button>
                ))}
            </div>

            <div
                className="fade-up"
                style={{
                    fontSize: 12, color: "var(--text3)",
                    fontFamily: "'DM Mono', monospace", animationDelay: "0.2s",
                }}
            >
                {/*Powered by Firebase — syncs instantly across all devices*/}
            </div>
        </div>
    );
}
