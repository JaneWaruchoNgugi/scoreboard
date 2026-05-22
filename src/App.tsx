import { useState, useEffect, useRef } from "react";
import { RoleSelect }           from "./components/RoleSelect";
import { ViewerView }           from "./components/viewer/ViewerView";
import { QuestionsEditorView }  from "./components/editor/QuestionsEditorView";
import { AdminView }            from "./components/admin/AdminView";
import { RaniaTimerView }       from "./components/timer/RaniaTimerView";
import "./styles/globals.css";

const PINS: Record<string, string> = {
    "admin": "2027",
    "timer-control": "2027",
    "Questions-Entry": "2026",
    "viewer": "1234",
};

const MAX_ATTEMPTS = 3;
const LOCKOUT_MS = 60_000; // 1 minute

function PinInput({ correctPin, onSuccess, onBack }: { correctPin: string; onSuccess: (username: string) => void; onBack: () => void }) {
    const [username, setUsername] = useState("");
    const [digits, setDigits] = useState(["", "", "", ""]);
    const [error, setError] = useState(false);
    const [ok, setOk] = useState(false);
    const [attempts, setAttempts] = useState(0);
    const [lockedUntil, setLockedUntil] = useState<number | null>(null);
    const [remaining, setRemaining] = useState(0);
    const refs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)];

    // Countdown ticker for lockout
    useEffect(() => {
        if (!lockedUntil) return;
        const id = setInterval(() => {
            const left = Math.ceil((lockedUntil - Date.now()) / 1000);
            if (left <= 0) { setLockedUntil(null); setAttempts(0); setRemaining(0); }
            else setRemaining(left);
        }, 500);
        return () => clearInterval(id);
    }, [lockedUntil]);

    const isLocked = lockedUntil !== null && Date.now() < lockedUntil;

    const attempt = (d = digits) => {
        if (isLocked) return;
        const pin = d.join("");
        if (pin.length < correctPin.length) return;
        if (!username.trim()) { setError(true); return; }
        if (pin === correctPin) {
            setOk(true);
            setTimeout(() => onSuccess(username.trim()), 600);
        } else {
            const next = attempts + 1;
            setAttempts(next);
            setError(true);
            setDigits(["", "", "", ""]);
            setTimeout(() => refs[0].current?.focus(), 0);
            if (next >= MAX_ATTEMPTS) {
                setLockedUntil(Date.now() + LOCKOUT_MS);
                setRemaining(Math.ceil(LOCKOUT_MS / 1000));
            }
        }
    };

    const onDigit = (i: number, val: string) => {
        if (isLocked) return;
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
        opacity: isLocked ? 0.5 : 1,
    });

    return (
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)" }}>
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 20, padding: "40px 32px", display: "flex", flexDirection: "column", gap: 20, minWidth: 300, alignItems: "center" }}>
                <span style={{ fontSize: 32 }}>{ok ? "✅" : isLocked ? "🔐" : "🔒"}</span>
                <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 24, letterSpacing: "0.1em", color: ok ? "var(--green, #00e5a0)" : isLocked ? "var(--red, #ff4060)" : "var(--cyan)" }}>
                    {ok ? "Access Granted" : isLocked ? `Locked — ${remaining}s` : "Enter PIN"}
                </span>
                {isLocked && (
                    <span style={{ color: "#ff4d4d", fontSize: 13, textAlign: "center" }}>
                        Too many failed attempts. Try again in {remaining} seconds.
                    </span>
                )}
                {!isLocked && (
                    <>
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
                                    maxLength={1} value={d} disabled={ok || isLocked}
                                    onChange={e => onDigit(i, e.target.value)}
                                    onKeyDown={e => onKeyDown(i, e)}
                                    onFocus={e => e.target.select()}
                                    style={boxStyle(i)}
                                />
                            ))}
                        </div>
                        {attempts > 0 && attempts < MAX_ATTEMPTS && (
                            <span style={{ color: "#ff4d4d", fontSize: 12 }}>
                                {MAX_ATTEMPTS - attempts} attempt{MAX_ATTEMPTS - attempts !== 1 ? "s" : ""} remaining
                            </span>
                        )}
                        {error && !isLocked && <span style={{ color: "#ff4d4d", fontSize: 13 }}>{!username.trim() ? "Enter your name first" : "Incorrect PIN"}</span>}
                    </>
                )}
                {!ok && (
                    <div style={{ display: "flex", gap: 12, width: "100%" }}>
                        <button onClick={onBack} style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: "1px solid var(--border)", background: "transparent", color: "var(--text2)", cursor: "pointer" }}>Back</button>
                        {!isLocked && (
                            <button onClick={() => attempt()} style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: "none", background: "var(--cyan)", color: "#000", fontWeight: 700, cursor: "pointer" }}>Enter</button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

function ThemeToggle() {
    const [dark, setDark] = useState(() => document.documentElement.getAttribute("data-theme") !== "light");
    const toggle = () => {
        const next = !dark;
        setDark(next);
        document.documentElement.setAttribute("data-theme", next ? "dark" : "light");
        localStorage.setItem("theme", next ? "dark" : "light");
    };
    return (
        <button onClick={toggle} style={{
            position: "fixed", bottom: 20, right: 20, zIndex: 9999,
            background: "var(--surface2)", border: "1px solid var(--border)",
            borderRadius: 50, width: 44, height: 44, fontSize: 20,
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
        }} title={dark ? "Switch to light mode" : "Switch to dark mode"}>
            {dark ? "☀️" : "🌙"}
        </button>
    );
}

function App() {
    const [role, setRole] = useState(() => sessionStorage.getItem("role") || "");
    const [confirmed, setConfirmed] = useState(() => sessionStorage.getItem("confirmed") === "1");
    const [username, setUsername] = useState(() => sessionStorage.getItem("username") || "");

    // Apply saved theme on mount
    useEffect(() => {
        const saved = localStorage.getItem("theme") || "dark";
        document.documentElement.setAttribute("data-theme", saved);
    }, []);

    useEffect(() => { sessionStorage.setItem("role", role); }, [role]);
    useEffect(() => { sessionStorage.setItem("confirmed", confirmed ? "1" : ""); }, [confirmed]);
    useEffect(() => { sessionStorage.setItem("username", username); }, [username]);

    const handleBack = () => { setRole(""); setConfirmed(false); setUsername(""); };

    if (!role) return <><RoleSelect onSelect={r => { setRole(r); setConfirmed(false); }} /><ThemeToggle /></>;

    if (PINS[role] && !confirmed)
        return <><PinInput correctPin={PINS[role]} onSuccess={(u) => { setUsername(u); setConfirmed(true); }} onBack={handleBack} /><ThemeToggle /></>;

    if (role === "viewer")          return <><ViewerView          onBack={handleBack} /><ThemeToggle /></>;
    if (role === "Questions-Entry") return <><QuestionsEditorView onBack={handleBack} username={username} /><ThemeToggle /></>;
    if (role === "timer-control")   return <><RaniaTimerView       onBack={handleBack} /><ThemeToggle /></>;
    if (role === "admin")           return <><AdminView           onBack={handleBack} username={username} /><ThemeToggle /></>;
}

export default App;
