import {useState, useRef, useEffect} from "react";
import "../shared/GlobalStyles.css";
import {ScoreboardDisplay} from "../shared/ScoreboardDisplay";
import {useFirebaseState} from "../../hooks/useFirebaseState";
import {QuestionsPanel} from "./QuestionsPanel.tsx";
import { saveVoiceStats } from "../../firebase";
import type { VoiceStats } from "../../firebase";

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

type Tab = "scores" | "questions" | "voice";

export function ViewerView({onBack}: Props) {
    const {state, status} = useFirebaseState();
    const [activeTab, setActiveTab] = useState<Tab>("scores");
    const color = STATUS_COLOR[status];

    // Voice tracker state (lives on Bella's phone) — kept outside tabs so it survives tab switches
    const [listening, setListening] = useState(false);
    const [stats, setStats] = useState<VoiceStats>({ correct: 0, wrong: 0, pass: 0 });
    const [lastHeard, setLastHeard] = useState("");
    const [supported] = useState(() => "webkitSpeechRecognition" in window || "SpeechRecognition" in window);
    const [diagMsg, setDiagMsg] = useState("");
    const recogRef = useRef<any>(null);
    const statsRef = useRef(stats);
    useEffect(() => { statsRef.current = stats; }, [stats]);

    const startListening = async () => {
        const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SR) { setDiagMsg("SpeechRecognition not found in this browser."); return; }

        // Explicitly request mic permission first — this triggers the dialog on mobile
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            stream.getTracks().forEach(t => t.stop());
        } catch (err: any) {
            const isAndroid = /android/i.test(navigator.userAgent);
            const isIOS = /iphone|ipad/i.test(navigator.userAgent);
            if (isAndroid) {
                setDiagMsg("❌ Tap the 🔒 lock icon in the address bar → Permissions → Microphone → Allow. Then tap START again.");
            } else if (isIOS) {
                setDiagMsg("❌ Go to iPhone Settings → Safari → Microphone → Allow. Then reload the page and tap START.");
            } else {
                setDiagMsg(`❌ Mic denied (${err?.name}). Click the camera/mic icon in the browser address bar and allow microphone.`);
            }
            return;
        }

        const r = new SR();
        r.continuous = false;
        r.interimResults = false;
        r.lang = "en-US";
        r.onstart = () => setDiagMsg("Mic started ✓");
        r.onresult = async (e: any) => {
            const transcript = Array.from(e.results).map((res: any) => res[0].transcript).join(" ").toLowerCase();
            setLastHeard(transcript);
            setDiagMsg(`Heard: "${transcript}"`);
            const s = { ...statsRef.current };
            if (/\bcorrect\b/.test(transcript)) s.correct++;
            else if (/\bwrong\b|\bincorrect\b/.test(transcript)) s.wrong++;
            else if (/\bpass\b|\bpause\b/.test(transcript)) s.pass++;
            if (s.correct !== statsRef.current.correct || s.wrong !== statsRef.current.wrong || s.pass !== statsRef.current.pass) {
                setStats(s);
                await saveVoiceStats(s);
            }
        };
        r.onerror = (e: any) => {
            setDiagMsg(`Error: ${e.error}`);
            if (e.error === "not-allowed") {
                setDiagMsg("❌ Mic blocked — go to browser Settings → Site Settings → Microphone → allow this site. Also ensure the URL is HTTPS.");
                setListening(false);
                recogRef.current = null;
                return;
            }
            if (e.error === "no-speech" || e.error === "network") return;
            setListening(false);
            recogRef.current = null;
        };
        r.onend = () => {
            if (recogRef.current) {
                setTimeout(() => { try { recogRef.current?.start(); } catch (err: any) { setDiagMsg(`Restart failed: ${err?.message}`); } }, 300);
            }
        };
        recogRef.current = r;
        try { r.start(); } catch (err: any) { setDiagMsg(`Start failed: ${err?.message}`); return; }
        setListening(true);
    };

    const stopListening = () => {
        const r = recogRef.current;
        recogRef.current = null;
        try { r?.stop(); } catch (_) {}
        setListening(false);
    };

    const resetStats = async () => {
        const s = { correct: 0, wrong: 0, pass: 0 };
        setStats(s);
        setLastHeard("");
        await saveVoiceStats(s);
    };

    useEffect(() => () => { recogRef.current = null; }, []);

    return (
        <div
            style={{
                minHeight: "100vh",
                background:
                    "radial-gradient(ellipse 100% 50% at 50% 0%, rgba(0,212,255,0.04), transparent), var(--bg)",
                display: "flex", flexDirection: "column", alignItems: "center",
            }}
        >
            {/* ── Top bar ── */}
            <div
                style={{
                    width: "100%",
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

                {/* Status pill */}
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
                {/* Persistent mic indicator — visible on all tabs when listening */}
                {listening && (
                    <div style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(0,229,160,0.1)", border: "1px solid var(--cyan)", borderRadius: 100, padding: "6px 14px", fontFamily: "'DM Mono', monospace", fontSize: 11, color: "var(--cyan)" }}>
                        <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--cyan)", display: "inline-block", animation: "pulse 1s infinite" }} />
                        MIC ON
                    </div>
                )}
            </div>

            {/* ── Main content ── */}
            <div
                className="fade-up"
                style={{
                    width: "100%", maxWidth: 1800,
                    padding: "0 24px 40px",
                    display: "flex", flexDirection: "column", gap: 16,
                }}
            >
                <div
                    className="viewer-tab-switcher"
                    style={{
                        display: "flex",
                        background: "var(--surface2)",
                        border: "1px solid var(--border)",
                        borderRadius: 12,
                        padding: 4,
                        gap: 4,
                        alignSelf: "center",
                        width: "100%",
                        maxWidth: 500,
                        position: "sticky",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                    }}
                >
                    {(["scores", "questions", "voice"] as Tab[]).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            style={{
                                flex: 1,
                                background: activeTab === tab ? "rgba(0,229,160,0.08)" : "transparent",
                                color: activeTab === tab ? "#00e5a0" : "var(--text2)",
                                border: "none",
                                borderBottom: `2px solid ${activeTab === tab ? "#00e5a0" : "transparent"}`,
                                padding: "12px 0",
                                fontFamily: "'DM Mono', monospace",
                                fontSize: 12,
                                letterSpacing: "0.12em",
                                fontWeight: activeTab === tab ? 600 : 500,
                                cursor: "pointer",
                                transition: "all 0.2s ease",
                            }}
                        >
                            {tab === "scores" ? "🏆 SCORES" : tab === "questions" ? "🎯 QUESTIONS" : "🎙️ VOICE"}
                        </button>
                    ))}
                </div>

                {activeTab === "scores" && <ScoreboardDisplay state={state} showScores={true}/>}
                {activeTab === "questions" && (
                    <div style={{height: "calc(100vh - 160px)", overflowY: "auto", borderRadius: 16}}>
                        <QuestionsPanel round={state.timerRound} showAnswers={true}/>
                    </div>
                )}
                {/* Voice tab — always mounted, hidden when not active so mic keeps running */}
                <div style={{ display: activeTab === "voice" ? "flex" : "none", flexDirection: "column", gap: 16, maxWidth: 480, width: "100%", margin: "0 auto" }}>
                        <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 20, letterSpacing: "0.1em", color: "var(--text)" }}>🎙️ VOICE TRACKER</div>
                        {!supported && <div style={{ color: "var(--red)", fontSize: 13 }}>⚠ Not supported. Use Chrome or Safari on iOS.</div>}
                        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "var(--text3)", wordBreak: "break-all" }}>
                            Browser: {navigator.userAgent.slice(0, 80)}
                        </div>

                        <div style={{ display: "flex", gap: 10 }}>
                            {[
                                { label: "CORRECT", val: stats.correct, color: "var(--cyan)" },
                                { label: "WRONG", val: stats.wrong, color: "var(--red)" },
                                { label: "PASS", val: stats.pass, color: "var(--amber)" },
                            ].map(({ label, val, color: c }) => (
                                <div key={label} style={{ flex: 1, background: "var(--surface)", border: `1px solid ${c}33`, borderRadius: 12, padding: "20px 8px", textAlign: "center" }}>
                                    <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 40, color: c }}>{val}</div>
                                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "var(--text3)", marginTop: 4 }}>{label}</div>
                                </div>
                            ))}
                        </div>

                        {lastHeard && (
                            <div style={{ padding: "8px 14px", background: "var(--surface2)", borderRadius: 8, fontFamily: "'DM Mono', monospace", fontSize: 12, color: "var(--text3)" }}>
                                Heard: <span style={{ color: "var(--text)" }}>"{lastHeard}"</span>
                            </div>
                        )}

                        <div style={{ display: "flex", gap: 10 }}>
                            <button className="btn" onClick={listening ? stopListening : startListening} disabled={!supported}
                                style={{ flex: 1, padding: "14px", fontSize: 15, fontWeight: 700, fontFamily: "'Bebas Neue', sans-serif",
                                    background: listening ? "rgba(255,64,96,0.15)" : "rgba(0,229,160,0.15)",
                                    border: `1px solid ${listening ? "var(--red)" : "var(--cyan)"}`,
                                    color: listening ? "var(--red)" : "var(--cyan)" }}>
                                {listening ? "⏹ STOP" : "🎙 START"}
                            </button>
                            <button className="btn" onClick={resetStats}
                                style={{ padding: "14px 20px", fontSize: 13, background: "var(--surface2)", border: "1px solid rgba(255,255,255,0.08)", color: "var(--text3)" }}>
                                ↺ Reset
                            </button>
                        </div>

                        {listening && (
                            <div style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: "'DM Mono', monospace", fontSize: 11, color: "var(--cyan)" }}>
                                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--cyan)", display: "inline-block", animation: "pulse 1s infinite" }} />
                                LISTENING — say "correct", "wrong" or "pass"
                            </div>
                        )}
                        {diagMsg && <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "var(--amber)", padding: "6px 10px", background: "rgba(255,180,0,0.08)", borderRadius: 6 }}>{diagMsg}</div>}
                    </div>
            </div>
        </div>
    );
}