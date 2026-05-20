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
        role: "Questions-Entry",
        icon: "⏱",
        label: "Questions Entry",
        desc: "Edit questions for all rounds",
        accent: "var(--green)",
        dimAccent: "rgba(0,229,160,0.15)",
    },
    {
        role: "admin",
        icon: "⚡",
        label: "Jane",
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
                {/* Glow backdrop */}
                <div style={{
                    position: "absolute", inset: "-40px -60px",
                    background: "radial-gradient(ellipse 70% 60% at 50% 50%, rgba(0,212,255,0.12), transparent)",
                    pointerEvents: "none",
                }} />


                {/* Main wordmark */}
                <div style={{
                    fontFamily: "'Bebas Neue', sans-serif",
                    fontSize: "clamp(64px,15vw,112px)",
                    letterSpacing: "0.12em",
                    lineHeight: 1,
                    background: "linear-gradient(160deg, #ffffff 30%, var(--cyan) 70%, #0090cc 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                    filter: "drop-shadow(0 0 32px rgba(0,212,255,0.35))",
                }}>
                    BONGO QUIZ
                </div>
                {/* Underline accent */}
                <div style={{
                    margin: "14px auto 0",
                    width: "clamp(80px,20vw,160px)",
                    height: 2,
                    background: "linear-gradient(to right, transparent, var(--cyan), transparent)",
                    borderRadius: 2,
                }} />
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

        </div>
    );
}
