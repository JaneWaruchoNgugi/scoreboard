import { useEffect, useState } from "react";
import { loginWithPin } from "../../firebase/auth";
import { getDeviceName } from "../../firebase";

interface Props {
    onLoggedIn: (name: string) => void;
}

const MAX_ATTEMPTS = 3;
const LOCKOUT_MS = 60_000;

/** Shown when the page loads, before anything else. */
export function LoginScreen({ onLoggedIn }: Props) {
    const [name, setName] = useState(() => localStorage.getItem("lastLoginName") ?? "");
    const [pin, setPin] = useState("");
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [attempts, setAttempts] = useState(0);
    const [lockedUntil, setLockedUntil] = useState<number | null>(null);
    const [now, setNow] = useState(() => Date.now());

    useEffect(() => {
        if (!lockedUntil) return;
        const id = setInterval(() => {
            const t = Date.now();
            setNow(t);
            if (t >= lockedUntil) {
                setLockedUntil(null);
                setAttempts(0);
            }
        }, 500);
        return () => clearInterval(id);
    }, [lockedUntil]);

    const locked = lockedUntil !== null && now < lockedUntil;
    const secondsLeft = lockedUntil ? Math.max(0, Math.ceil((lockedUntil - now) / 1000)) : 0;

    const submit = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (busy || locked) return;
        if (!name.trim()) { setError("Enter your name first."); return; }
        if (!/^\d{4,12}$/.test(pin)) { setError("The PIN is 4 to 12 digits."); return; }
        setBusy(true);
        setError(null);
        const res = await loginWithPin(name, pin);
        setBusy(false);
        if (res.ok) {
            try { localStorage.setItem("lastLoginName", res.name); } catch { /* storage unavailable */ }
            onLoggedIn(res.name);
            return;
        }
        setPin("");
        if (res.reason === "wrong-pin") {
            const next = attempts + 1;
            setAttempts(next);
            if (next >= MAX_ATTEMPTS) {
                const until = Date.now() + LOCKOUT_MS;
                setNow(Date.now());
                setLockedUntil(until);
                setError("Too many wrong PINs. Wait a minute and try again.");
            } else {
                setError(`Wrong PIN. ${MAX_ATTEMPTS - next} attempt${MAX_ATTEMPTS - next === 1 ? "" : "s"} left.`);
            }
        } else {
            setError("Couldn't reach the server. Check your connection and try again.");
            console.error("Login failed:", res.message);
        }
    };

    const field: React.CSSProperties = {
        width: "100%", padding: "12px 14px", borderRadius: 10,
        border: "1px solid var(--surface3)", background: "var(--surface2)",
        color: "var(--text)", fontSize: 16, outline: "none",
    };

    return (
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)", padding: 16 }}>
            <form onSubmit={submit} style={{ background: "var(--surface)", border: "1px solid var(--surface3)", borderRadius: 20, padding: "36px 28px", display: "flex", flexDirection: "column", gap: 16, width: "100%", maxWidth: 360 }}>
                <div style={{ textAlign: "center", fontFamily: "'Bebas Neue', sans-serif", fontSize: 40, letterSpacing: "0.12em", color: "var(--cyan)" }}>
                    BONGO QUIZ
                </div>
                <div style={{ textAlign: "center", color: "var(--text2)", fontSize: 14, marginTop: -8 }}>
                    Log in to continue
                </div>
                <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13, color: "var(--text2)" }}>
                    Your name
                    <input value={name} onChange={(e) => { setName(e.target.value); setError(null); }} maxLength={60} autoComplete="name" autoFocus={!name} style={field} disabled={busy || locked} />
                </label>
                <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13, color: "var(--text2)" }}>
                    PIN
                    <input value={pin} onChange={(e) => { setPin(e.target.value.replace(/\D/g, "").slice(0, 12)); setError(null); }} type="password" inputMode="numeric" autoComplete="current-password" autoFocus={!!name} style={{ ...field, letterSpacing: "0.3em", fontSize: 20 }} disabled={busy || locked} />
                </label>
                <div style={{ fontSize: 12, color: "var(--text3)" }}>Device: {getDeviceName()}</div>
                {error && <div role="alert" style={{ color: "#ff4d4d", fontSize: 13 }}>{locked ? `Too many wrong PINs. Try again in ${secondsLeft}s.` : error}</div>}
                <button type="submit" disabled={busy || locked} style={{ padding: "12px 0", borderRadius: 10, border: "none", background: "var(--cyan)", color: "#000", fontWeight: 700, fontSize: 15, cursor: busy || locked ? "default" : "pointer", opacity: busy || locked ? 0.6 : 1 }}>
                    {busy ? "Checking…" : "Log in"}
                </button>
            </form>
        </div>
    );
}
