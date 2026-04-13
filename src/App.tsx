import { useState } from "react";
import { RoleSelect }           from "./components/RoleSelect";
import { ViewerView }           from "./components/viewer/ViewerView";
import { QuestionsEditorView }  from "./components/editor/QuestionsEditorView";
import { AdminView }            from "./components/admin/AdminView";
import "./styles/globals.css";

const PINS: Record<string, string> = {
    "admin": "2527",
    "Questions-Entry": "2526",
};

function PinInput({ correctPin, onSuccess, onBack }: { correctPin: string; onSuccess: () => void; onBack: () => void }) {
    const [pin, setPin] = useState("");
    const [error, setError] = useState(false);
    return (
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)" }}>
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 20, padding: "40px 32px", display: "flex", flexDirection: "column", gap: 20, minWidth: 280, alignItems: "center" }}>
                <span style={{ fontSize: 32 }}>🔒</span>
                <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 24, letterSpacing: "0.1em", color: "var(--cyan)" }}>Enter PIN</span>
                <input
                    type="password"
                    inputMode="numeric"
                    maxLength={6}
                    value={pin}
                    onChange={e => { setPin(e.target.value); setError(false); }}
                    style={{ width: "100%", padding: "12px 16px", borderRadius: 10, border: `1px solid ${error ? "#ff4d4d" : "var(--border)"}`, background: "var(--surface2)", color: "var(--text)", fontSize: 20, textAlign: "center", letterSpacing: "0.3em", outline: "none", boxSizing: "border-box" }}
                    autoFocus
                />
                {error && <span style={{ color: "#ff4d4d", fontSize: 13 }}>Incorrect PIN</span>}
                <div style={{ display: "flex", gap: 12, width: "100%" }}>
                    <button onClick={onBack} style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: "1px solid var(--border)", background: "transparent", color: "var(--text2)", cursor: "pointer" }}>Back</button>
                    <button onClick={() => { if (pin === correctPin) onSuccess(); else { setError(true); setPin(""); } }} style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: "none", background: "var(--cyan)", color: "#000", fontWeight: 700, cursor: "pointer" }}>Enter</button>
                </div>
            </div>
        </div>
    );
}

function App() {
    const [role, setRole] = useState("");
    const [confirmed, setConfirmed] = useState(false);

    const handleBack = () => { setRole(""); setConfirmed(false); };

    if (!role) return <RoleSelect onSelect={r => { setRole(r); setConfirmed(false); }} />;

    if (PINS[role] && !confirmed)
        return <PinInput correctPin={PINS[role]} onSuccess={() => setConfirmed(true)} onBack={handleBack} />;

    if (role === "viewer")          return <ViewerView          onBack={handleBack} />;
    if (role === "Questions-Entry") return <QuestionsEditorView onBack={handleBack} />;
    if (role === "admin")           return <AdminView           onBack={handleBack} />;
}

export default App;
