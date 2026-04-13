import { useState, useRef, useEffect } from "react";
import "../shared/GlobalStyles.css";
import { ScoreboardDisplay } from "../shared/ScoreboardDisplay";
import { useFirebaseState } from "../../hooks/useFirebaseState";
import { QuestionsPanel } from "./QuestionsPanel.tsx";
import { saveVoiceStats } from "../../firebase";
import type { VoiceStats } from "../../firebase";

interface Props { onBack: () => void; }

const STATUS_COLOR: Record<string, string> = { connecting: "var(--text3)", live: "var(--green)", offline: "var(--red)" };
const STATUS_LABEL: Record<string, string> = { connecting: "CONNECTING", live: "LIVE", offline: "OFFLINE" };

type Tab = "scores" | "questions";

export function ViewerView({ onBack }: Props) {
    const { state, status } = useFirebaseState();
    const [activeTab, setActiveTab] = useState<Tab>("scores");
    const color = STATUS_COLOR[status];

    // Voice tracker — invisible to Bella, auto-starts on questions tab
    const [listening, setListening] = useState(false);
    const supported = "webkitSpeechRecognition" in window || "SpeechRecognition" in window;
    const recogRef = useRef<any>(null);
    const statsRef = useRef<VoiceStats>({ correct: 0, wrong: 0, pass: 0 });

    const startListening = async () => {
        const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SR) return;
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            stream.getTracks().forEach(t => t.stop());
        } catch { return; }
        const r = new SR();
        r.continuous = false;
        r.interimResults = false;
        r.lang = "en-US";
        r.onresult = async (e: any) => {
            const transcript = Array.from(e.results).map((res: any) => res[0].transcript).join(" ").toLowerCase();
            const s = { ...statsRef.current };
            if (/\bcorrect\b/.test(transcript)) s.correct++;
            else if (/\bwrong\b|\bincorrect\b/.test(transcript)) s.wrong++;
            else if (/\bpass\b|\bpause\b/.test(transcript)) s.pass++;
            else return;
            statsRef.current = s;
            await saveVoiceStats(s);
        };
        r.onerror = (e: any) => {
            if (e.error === "no-speech" || e.error === "network") return;
            setListening(false); recogRef.current = null;
        };
        r.onend = () => { if (recogRef.current) setTimeout(() => { try { recogRef.current?.start(); } catch (_) {} }, 300); };
        recogRef.current = r;
        try { r.start(); setListening(true); } catch (_) {}
    };

    const stopListening = () => {
        const r = recogRef.current;
        recogRef.current = null;
        try { r?.stop(); } catch (_) {}
        setListening(false);
    };

    // Auto-start when questions tab active, auto-stop otherwise
    useEffect(() => {
        if (activeTab === "questions" && supported && !recogRef.current) startListening();
        if (activeTab !== "questions") stopListening();
    }, [activeTab]);

    useEffect(() => () => { recogRef.current = null; }, []);

    return (
        <div style={{ minHeight: "100vh", background: "radial-gradient(ellipse 100% 50% at 50% 0%, rgba(0,212,255,0.04), transparent), var(--bg)", display: "flex", flexDirection: "column", alignItems: "center" }}>
            {/* Top bar */}
            <div style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px", flexWrap: "wrap", gap: 12 }}>
                <button className="btn" onClick={onBack} style={{ background: "var(--surface2)", color: "var(--text2)", padding: "10px 20px", fontSize: 13, border: "1px solid var(--border)" }}>
                    ← Back
                </button>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {/* Mic indicator — subtle, only visible when listening */}
                    {listening && (
                        <div style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(0,229,160,0.1)", border: "1px solid var(--cyan)", borderRadius: 100, padding: "6px 12px", fontFamily: "'DM Mono', monospace", fontSize: 10, color: "var(--cyan)" }}>
                            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--cyan)", display: "inline-block", animation: "pulse 1s infinite" }} />
                            MIC
                        </div>
                    )}
                    <div style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--surface2)", padding: "8px 16px", borderRadius: 100, border: "1px solid var(--border)", fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: "0.15em", color }}>
                        <div style={{ width: 7, height: 7, borderRadius: "50%", background: color, boxShadow: status === "live" ? `0 0 10px ${color}` : "none", animation: status === "live" ? "pulse 2s infinite" : "none" }} />
                        {STATUS_LABEL[status]}
                    </div>
                </div>
            </div>

            {/* Main content */}
            <div className="fade-up" style={{ width: "100%", maxWidth: 1800, padding: "0 24px 40px", display: "flex", flexDirection: "column", gap: 16 }}>
                {/* Tab switcher */}
                <div style={{ display: "flex", background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 12, padding: 4, gap: 4, alignSelf: "center", width: "100%", maxWidth: 400 }}>
                    {(["scores", "questions"] as Tab[]).map((tab) => (
                        <button key={tab} onClick={() => setActiveTab(tab)} style={{
                            flex: 1, background: activeTab === tab ? "rgba(0,229,160,0.08)" : "transparent",
                            color: activeTab === tab ? "#00e5a0" : "var(--text2)", border: "none",
                            borderBottom: `2px solid ${activeTab === tab ? "#00e5a0" : "transparent"}`,
                            padding: "12px 0", fontFamily: "'DM Mono', monospace", fontSize: 12,
                            letterSpacing: "0.12em", fontWeight: activeTab === tab ? 600 : 500, cursor: "pointer", transition: "all 0.2s ease",
                        }}>
                            {tab === "scores" ? "🏆 SCORES" : "🎯 QUESTIONS"}
                        </button>
                    ))}
                </div>

                {activeTab === "scores" && <ScoreboardDisplay state={state} showScores={true} />}
                {activeTab === "questions" && (
                    <div style={{ height: "calc(100vh - 160px)", overflowY: "auto", borderRadius: 16 }}>
                        <QuestionsPanel round={state.timerRound} showAnswers={true} />
                    </div>
                )}
            </div>
        </div>
    );
}
