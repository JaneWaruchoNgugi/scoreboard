import "../shared/GlobalStyles.css";
import { ScoreboardDisplay } from "../shared/ScoreboardDisplay";
// import { CountdownDisplay } from "../shared/CountdownDisplay";
import { useFirebaseState } from "../../hooks/useFirebaseState";

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

export function ViewerView({ onBack }: Props) {
    const { state, status } = useFirebaseState();
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

            {/* Top bar */}
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
                <div />
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

            {/* Content */}
            <div
                className="fade-up"
                style={{
                    width: "100%", maxWidth: 1200,
                    padding: "0 24px 40px",
                    display: "flex", flexDirection: "column", gap: 16,
                }}
            >
                <ScoreboardDisplay state={state} />
                {/*<CountdownDisplay state={state} />*/}
            </div>
        </div>
    );
}
