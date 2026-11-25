import { useState, useEffect } from "react";
import { ref, onValue } from "firebase/database";
import { RoleSelect }           from "./components/RoleSelect";
import { ViewerView }           from "./components/viewer/ViewerView";
import { QuestionsEditorView }  from "./components/editor/QuestionsEditorView";
import { AdminView }            from "./components/admin/AdminView";
import { RaniaTimerView }       from "./components/timer/RaniaTimerView";
import { LoginScreen }          from "./components/auth/LoginScreen";
import { SuperAdminView }       from "./components/superadmin/SuperAdminView";
import { db, SCORE_REF }        from "./firebase";
import { hasValidSession, logout } from "./firebase/auth";
import "./styles/globals.css";

type Phase = "checking" | "out" | "in";

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

function LogoutButton({ onLogout }: { onLogout: () => void }) {
    return (
        <button onClick={onLogout} style={{
            position: "fixed", top: 16, right: 16, zIndex: 9999,
            background: "var(--surface2)", border: "1px solid var(--surface3)",
            borderRadius: 10, padding: "8px 14px", fontSize: 13,
            color: "var(--text2)", cursor: "pointer",
        }}>
            Log out
        </button>
    );
}

function ScoreboardApp() {
    const [phase, setPhase] = useState<Phase>("checking");
    const [role, setRole] = useState(() => sessionStorage.getItem("role") || "");
    const [username, setUsername] = useState(() => localStorage.getItem("lastLoginName") || "");

    // Apply saved theme on mount
    useEffect(() => {
        const saved = localStorage.getItem("theme") || "dark";
        document.documentElement.setAttribute("data-theme", saved);
    }, []);

    // On page load, check whether this device is already logged in.
    useEffect(() => {
        let cancelled = false;
        hasValidSession()
            .then((ok) => { if (!cancelled) setPhase(ok ? "in" : "out"); })
            .catch(() => { if (!cancelled) setPhase("out"); });
        return () => { cancelled = true; };
    }, []);

    // If the PIN is changed or this device is logged out by the super admin,
    // the database stops letting us read. Send the user back to the login.
    useEffect(() => {
        if (phase !== "in") return;
        return onValue(ref(db, SCORE_REF), () => {}, () => setPhase("out"));
    }, [phase]);

    useEffect(() => { sessionStorage.setItem("role", role); }, [role]);

    const handleBack = () => setRole("");
    const handleLogout = async () => {
        setRole("");
        await logout();
        setPhase("out");
    };

    if (phase === "checking") {
        return <div style={{ minHeight: "100vh", background: "var(--bg)" }} />;
    }
    if (phase === "out") {
        return <><LoginScreen onLoggedIn={(name) => { setUsername(name); setPhase("in"); }} /><ThemeToggle /></>;
    }

    if (!role) return <><RoleSelect onSelect={setRole} /><LogoutButton onLogout={handleLogout} /><ThemeToggle /></>;

    if (role === "viewer")          return <><ViewerView          onBack={handleBack} /><ThemeToggle /></>;
    if (role === "Questions-Entry") return <><QuestionsEditorView onBack={handleBack} username={username} /><ThemeToggle /></>;
    if (role === "timer-control")   return <><RaniaTimerView       onBack={handleBack} /><ThemeToggle /></>;
    if (role === "admin")           return <><AdminView           onBack={handleBack} username={username} /><ThemeToggle /></>;
    return <><RoleSelect onSelect={setRole} /><LogoutButton onLogout={handleLogout} /><ThemeToggle /></>;
}

function App() {
    // The super admin panel is a separate page: /super-admin
    if (window.location.pathname.replace(/\/+$/, "") === "/super-admin") {
        return <SuperAdminView />;
    }
    return <ScoreboardApp />;
}

export default App;
