import { useState, useEffect, useRef } from "react";
import { RoleSelect }           from "./components/RoleSelect";
import { ViewerView }           from "./components/viewer/ViewerView";
import { QuestionsEditorView }  from "./components/editor/QuestionsEditorView";
import { AdminView }            from "./components/admin/AdminView";
import "./styles/globals.css";

const PINS: Record<string, string> = {
    "admin": "2027",
    "Questions-Entry": "2026",
    "viewer": "1234",
};

function PinInput({ correctPin, onSuccess, onBack }: { correctPin: string; onSuccess: (username: string) => void; onBack: () => void }) {
    const [username, setUsername] = useState("");
    const [digits, setDigits] = useState(["", "", "", ""]);
    const [error, setError] = useState(false);
    const [ok, setOk] = useState(false);
    const refs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)];

    const attempt = (d = digits) => {
        const pin = d.join("");
        if (pin.length < correctPin.length) return;
        if (!username.trim()) { setError(true); return; }
        if (pin === correctPin) { setOk(true); setTimeout(() => onSuccess(username.trim()), 600); }
        else { setError(true); setDigits(["", "", "", ""]); setTimeout(() => refs[0].current?.focus(), 0); }
    };

    const onDigit = (i: number, val: string) => {
        const v = val.replace(/\D/, "").slice(-1);
        const next = digits.map((d, idx) => idx === i ? v : d);
        setDigits(next);
        setError(false);
        if (v && i < 3) refs[i + 1].current?.focus();
        if (v && i === correctPin.length - 1) attempt(next);
    };

    const onKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Backspace" && !digits[i] && i > 0) refs[i - 1].current?.focus();
        if (e.key === "Enter") attempt();
    };

    const boxStyle = (i: number): React.CSSProperties => ({
        width: 52, height: 60, textAlign: "center", fontSize: 28, fontWeight: 700,
        borderRadius: 12, border: `2px solid ${error ? "#ff4d4d" : digits[i] ? "var(--cyan)" : "var(--border)"}`,
        background: "var(--surface2)", color: "var(--text)", outline: "none",
        caretColor: "transparent", transition: "border-color 0.15s",
        boxShadow: digits[i] ? "0 0 0 3px rgba(0,212,255,0.15)" : "none",
    });

    return (
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)" }}>
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 20, padding: "40px 32px", display: "flex", flexDirection: "column", gap: 20, minWidth: 300, alignItems: "center" }}>
                <span style={{ fontSize: 32 }}>{ok ? "✅" : "🔒"}</span>
                <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 24, letterSpacing: "0.1em", color: ok ? "var(--green, #00e5a0)" : "var(--cyan)" }}>
                    {ok ? "Access Granted" : "Enter PIN"}
                </span>
                <input
                    type="text" placeholder="Your name" value={username} disabled={ok}
                    onChange={e => { setUsername(e.target.value); setError(false); }}
                    onKeyDown={e => e.key === "Enter" && refs[0].current?.focus()}
                    style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: `1px solid ${error && !username.trim() ? "#ff4d4d" : "var(--border)"}`, background: "var(--surface2)", color: "var(--text)", fontSize: 15, outline: "none", boxSizing: "border-box" }}
                    autoFocus
                />
                <div style={{ display: "flex", gap: 10 }}>
                    {digits.map((d, i) => (
                        <input
                            key={i} ref={refs[i]} type="password" inputMode="numeric"
                            maxLength={1} value={d} disabled={ok}
                            onChange={e => onDigit(i, e.target.value)}
                            onKeyDown={e => onKeyDown(i, e)}
                            onFocus={e => e.target.select()}
                            style={boxStyle(i)}
                        />
                    ))}
                </div>
                {error && <span style={{ color: "#ff4d4d", fontSize: 13 }}>{!username.trim() ? "Enter your name first" : "Incorrect PIN"}</span>}
                {!ok && (
                    <div style={{ display: "flex", gap: 12, width: "100%" }}>
                        <button onClick={onBack} style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: "1px solid var(--border)", background: "transparent", color: "var(--text2)", cursor: "pointer" }}>Back</button>
                        <button onClick={() => attempt()} style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: "none", background: "var(--cyan)", color: "#000", fontWeight: 700, cursor: "pointer" }}>Enter</button>
                    </div>
                )}
            </div>
        </div>
    );
}

function App() {
    const [role, setRole] = useState(() => sessionStorage.getItem("role") || "");
    const [confirmed, setConfirmed] = useState(() => sessionStorage.getItem("confirmed") === "1");
    const [username, setUsername] = useState(() => sessionStorage.getItem("username") || "");

    useEffect(() => { sessionStorage.setItem("role", role); }, [role]);
    useEffect(() => { sessionStorage.setItem("confirmed", confirmed ? "1" : ""); }, [confirmed]);
    useEffect(() => { sessionStorage.setItem("username", username); }, [username]);

    const handleBack = () => { setRole(""); setConfirmed(false); setUsername(""); };

    if (!role) return <RoleSelect onSelect={r => { setRole(r); setConfirmed(false); }} />;

    if (PINS[role] && !confirmed)
        return <PinInput correctPin={PINS[role]} onSuccess={(u) => { setUsername(u); setConfirmed(true); }} onBack={handleBack} />;

    if (role === "viewer")          return <ViewerView          onBack={handleBack} />;
    if (role === "Questions-Entry") return <QuestionsEditorView onBack={handleBack} username={username} />;
    if (role === "admin")           return <AdminView           onBack={handleBack} username={username} />;
}

export default App;
