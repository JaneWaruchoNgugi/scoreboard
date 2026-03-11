import type { ReactNode } from "react";
import "../shared/GlobalStyles.css"
interface Props {
    children: ReactNode;
    accent: string;
    title: string;
    className?: string; // Add optional className for additional styling
}

export function ControlCard({ children, accent, title, className }: Props) {
    return (
        <div
            className={className}
            style={{
                display: "flex",
                flexDirection: "column",
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: 20,
                padding: 24,
                width: "100%", // This ensures the card takes full width of its container
                maxWidth: "100%", // Prevent overflow
                boxSizing: "border-box", // Include padding in width calculation
                transition: "border-color 0.2s, box-shadow 0.2s",
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = accent;
                e.currentTarget.style.boxShadow = `0 0 20px ${accent}20`;
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--border)";
                e.currentTarget.style.boxShadow = "none";
            }}
        >
            <div style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 20,
                width: "100%",
            }}>
                <div
                    style={{
                        width: 7,
                        height: 7,
                        borderRadius: "50%",
                        background: accent,
                        boxShadow: `0 0 10px ${accent}`,
                    }}
                />
                <span
                    style={{
                        fontFamily: "'DM Mono', monospace",
                        fontSize: 11,
                        letterSpacing: "0.2em",
                        color: accent,
                    }}
                >
                    {title}
                </span>
            </div>
            <div style={{ width: "100%" }}>
                {children}
            </div>
        </div>
    );
}