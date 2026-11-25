import { useCallback, useEffect, useState } from "react";
import type { User } from "firebase/auth";
import "../shared/GlobalStyles.css";
import {
    waitForAuth,
    superAdminSignIn,
    superAdminSignOut,
    isSuperAdmin,
    setLoginPin,
    fetchLoginLog,
    clearLoginLog,
    fetchActiveSessions,
    revokeSession,
} from "../../firebase/auth";
import type { LoginRecord } from "../../firebase/auth";

type Phase = "checking" | "signed-out" | "not-allowed" | "ready";

const card: React.CSSProperties = {
    background: "var(--surface)", border: "1px solid var(--surface3)",
    borderRadius: 16, padding: 20, display: "flex", flexDirection: "column", gap: 14,
};
const field: React.CSSProperties = {
    width: "100%", padding: "11px 14px", borderRadius: 10,
    border: "1px solid var(--surface3)", background: "var(--surface2)",
    color: "var(--text)", fontSize: 15, outline: "none",
};
const primaryBtn: React.CSSProperties = {
    padding: "11px 18px", borderRadius: 10, border: "none",
    background: "var(--amber)", color: "#000", fontWeight: 700, fontSize: 14, cursor: "pointer",
};
const ghostBtn: React.CSSProperties = {
    padding: "8px 14px", borderRadius: 10, border: "1px solid var(--surface3)",
    background: "transparent", color: "var(--text2)", fontSize: 13, cursor: "pointer",
};
const h2: React.CSSProperties = { fontFamily: "'Bebas Neue', sans-serif", fontSize: 24, letterSpacing: "0.08em", color: "var(--text)" };

function fmt(ts: number) {
    return typeof ts === "number" ? new Date(ts).toLocaleString() : "—";
}

/** Separate page at /super-admin. Sets the login PIN and shows who logged in. */
export function SuperAdminView() {
    const [phase, setPhase] = useState<Phase>("checking");
    const [user, setUser] = useState<User | null>(null);

    const check = useCallback(async (u: User | null) => {
        setUser(u);
        if (!u || u.isAnonymous) return setPhase("signed-out");
        setPhase((await isSuperAdmin(u.uid)) ? "ready" : "not-allowed");
    }, []);

    useEffect(() => {
        document.documentElement.setAttribute("data-theme", localStorage.getItem("theme") || "dark");
        waitForAuth().then(check);
    }, [check]);

    const signOut = async () => { await superAdminSignOut(); setUser(null); setPhase("signed-out"); };

    return (
        <div style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--text)", padding: "24px 16px" }}>
            <div style={{ maxWidth: 860, margin: "0 auto", display: "flex", flexDirection: "column", gap: 20 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                    <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 34, letterSpacing: "0.1em", color: "var(--amber)" }}>
                        Bongo Quiz · Super admin
                    </div>
                    {user && !user.isAnonymous && <button style={ghostBtn} onClick={signOut}>Sign out</button>}
                </div>

                {phase === "checking" && <div style={{ color: "var(--text2)" }}>Loading…</div>}
                {phase === "signed-out" && <SignIn onSignedIn={check} />}
                {phase === "not-allowed" && user && (
                    <div style={card}>
                        <div style={h2}>Not a super admin</div>
                        <p style={{ color: "var(--text2)", fontSize: 14, lineHeight: 1.6 }}>
                            You're signed in as {user.email}, but this account isn't on the super admin list yet.
                            In the Firebase console, open Realtime Database and add <code>auth/superAdmins/{user.uid}</code> with the value <code>true</code>, then reload this page.
                        </p>
                    </div>
                )}
                {phase === "ready" && <Dashboard />}
            </div>
        </div>
    );
}

function SignIn({ onSignedIn }: { onSignedIn: (u: User) => void }) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setBusy(true);
        setError(null);
        try {
            onSignedIn(await superAdminSignIn(email, password));
        } catch {
            setError("Wrong email or password.");
        } finally {
            setBusy(false);
        }
    };

    return (
        <form onSubmit={submit} style={{ ...card, maxWidth: 380 }}>
            <div style={h2}>Sign in</div>
            <input style={field} type="email" placeholder="Email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
            <input style={field} type="password" placeholder="Password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            {error && <div role="alert" style={{ color: "#ff4d4d", fontSize: 13 }}>{error}</div>}
            <button style={{ ...primaryBtn, opacity: busy ? 0.6 : 1 }} disabled={busy}>{busy ? "Signing in…" : "Sign in"}</button>
        </form>
    );
}

function Dashboard() {
    const [sessions, setSessions] = useState<LoginRecord[]>([]);
    const [log, setLog] = useState<LoginRecord[]>([]);
    const [loadError, setLoadError] = useState<string | null>(null);

    const reload = useCallback(
        () => Promise.all([fetchActiveSessions(), fetchLoginLog()]).then(
            ([s, l]) => { setSessions(s); setLog(l); setLoadError(null); },
            (err) => setLoadError(err instanceof Error ? err.message : "Couldn't load data."),
        ),
        [],
    );

    useEffect(() => { reload(); }, [reload]);

    return (
        <>
            <PinCard onChanged={reload} />
            {loadError && <div role="alert" style={{ color: "#ff4d4d", fontSize: 13 }}>{loadError}</div>}

            <div style={card}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                    <div style={h2}>Logged-in devices ({sessions.length})</div>
                    <button style={ghostBtn} onClick={reload}>Refresh</button>
                </div>
                {sessions.length === 0 && <div style={{ color: "var(--text3)", fontSize: 14 }}>No devices are logged in.</div>}
                {sessions.map((s) => (
                    <div key={s.uid} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, padding: "10px 0", borderTop: "1px solid var(--surface3)", flexWrap: "wrap" }}>
                        <div style={{ minWidth: 0 }}>
                            <div style={{ fontWeight: 600 }}>{s.name}</div>
                            <div style={{ fontSize: 13, color: "var(--text2)" }}>{s.device} · since {fmt(s.at)}</div>
                        </div>
                        <button style={ghostBtn} onClick={async () => {
                            if (!confirm(`Log out ${s.name} (${s.device})?`)) return;
                            await revokeSession(s.uid);
                            reload();
                        }}>Log out</button>
                    </div>
                ))}
            </div>

            <div style={card}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                    <div style={h2}>Login history ({log.length})</div>
                    {log.length > 0 && (
                        <button style={ghostBtn} onClick={async () => {
                            if (!confirm("Delete the whole login history?")) return;
                            await clearLoginLog();
                            reload();
                        }}>Clear</button>
                    )}
                </div>
                {log.length === 0 && <div style={{ color: "var(--text3)", fontSize: 14 }}>No logins yet.</div>}
                <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                        {log.length > 0 && (
                            <thead>
                                <tr style={{ textAlign: "left", color: "var(--text2)" }}>
                                    <th style={{ padding: "6px 8px" }}>When</th>
                                    <th style={{ padding: "6px 8px" }}>Name</th>
                                    <th style={{ padding: "6px 8px" }}>Device</th>
                                </tr>
                            </thead>
                        )}
                        <tbody>
                            {log.map((r, i) => (
                                <tr key={`${r.uid}-${r.at}-${i}`} style={{ borderTop: "1px solid var(--surface3)" }}>
                                    <td style={{ padding: "8px", whiteSpace: "nowrap" }}>{fmt(r.at)}</td>
                                    <td style={{ padding: "8px" }}>{r.name}</td>
                                    <td style={{ padding: "8px", color: "var(--text2)" }}>{r.device}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
}

function PinCard({ onChanged }: { onChanged: () => void }) {
    const [pin, setPin] = useState("");
    const [confirmPin, setConfirmPin] = useState("");
    const [busy, setBusy] = useState(false);
    const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!/^\d{4,12}$/.test(pin)) return setMsg({ ok: false, text: "Use 4 to 12 digits." });
        if (pin !== confirmPin) return setMsg({ ok: false, text: "The two PINs don't match." });
        if (!confirm("Change the PIN? Every device that's logged in will be logged out.")) return;
        setBusy(true);
        try {
            await setLoginPin(pin);
            setPin(""); setConfirmPin("");
            setMsg({ ok: true, text: "PIN changed. Everyone needs the new PIN to log in." });
            onChanged();
        } catch (err) {
            setMsg({ ok: false, text: err instanceof Error ? err.message : "Couldn't save the PIN." });
        } finally {
            setBusy(false);
        }
    };

    const digits = (v: string) => v.replace(/\D/g, "").slice(0, 12);

    return (
        <form onSubmit={submit} style={card}>
            <div style={h2}>Login PIN</div>
            <p style={{ color: "var(--text2)", fontSize: 14, lineHeight: 1.5 }}>
                Everyone uses this PIN to log in to Bongo Quiz. The current PIN is never shown. Use at least 6 digits so it's hard to guess.
            </p>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <input style={{ ...field, flex: "1 1 180px", width: "auto" }} type="password" inputMode="numeric" autoComplete="new-password" placeholder="New PIN" value={pin} onChange={(e) => { setPin(digits(e.target.value)); setMsg(null); }} />
                <input style={{ ...field, flex: "1 1 180px", width: "auto" }} type="password" inputMode="numeric" autoComplete="new-password" placeholder="Repeat new PIN" value={confirmPin} onChange={(e) => { setConfirmPin(digits(e.target.value)); setMsg(null); }} />
                <button style={{ ...primaryBtn, opacity: busy ? 0.6 : 1 }} disabled={busy}>{busy ? "Saving…" : "Set PIN"}</button>
            </div>
            {msg && <div role="status" style={{ color: msg.ok ? "var(--green)" : "#ff4d4d", fontSize: 13 }}>{msg.text}</div>}
        </form>
    );
}
