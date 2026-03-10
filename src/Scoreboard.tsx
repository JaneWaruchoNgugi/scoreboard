import {useState, useEffect, useRef} from "react";
// import countdownSound from "./assets/countdownSound.mp3";
// import TenSeconds from "./assets/ting_sound.mp3";
import {initializeApp} from "firebase/app";
import type {FirebaseApp} from "firebase/app";
import {getDatabase, ref, set, onValue, get} from "firebase/database";
import type {Database} from "firebase/database";

const firebaseConfig = {
    apiKey: "AIzaSyABmnlQj4dew4cVMCOpGrUyQk2Tdw4KRyI",
    authDomain: "scoreboard-9571d.firebaseapp.com",
    databaseURL: "https://scoreboard-9571d-default-rtdb.firebaseio.com",
    projectId: "scoreboard-9571d",
    storageBucket: "scoreboard-9571d.firebasestorage.app",
    messagingSenderId: "374688575278",
    appId: "1:374688575278:web:11061ad820664e300a94bf",
    measurementId: "G-B4BFNW02XG"
};

const app: FirebaseApp = initializeApp(firebaseConfig);
const db: Database = getDatabase(app);
const SCORE_REF = "scoreboard/state";

// ─── Types ─────────────────────────────────────────────────────────────────
interface Team {
    name: string;
    score: number;
}

interface ScoreboardState {
    teamA: Team;
    teamB: Team;
    period: string;
    clock: string;
    lastUpdated: number | null;
    timerDuration: number;
    timerStartedAt: number | null;
    timerRunning: boolean;
    timerRound: number;
}

const DEFAULT_STATE: ScoreboardState = {
    teamA: {name: "TEAM A", score: 0},
    teamB: {name: "TEAM B", score: 0},
    period: "1ST",
    clock: "00:00",
    lastUpdated: null,
    timerDuration: 90,
    timerStartedAt: null,
    timerRunning: false,
    timerRound: 1,
};

// ─── Firebase helpers ──────────────────────────────────────────────────────
async function saveState(state: ScoreboardState): Promise<void> {
    await set(ref(db, SCORE_REF), state);
}

function subscribeToState(callback: (state: ScoreboardState | null) => void): () => void {
    const scoreRef = ref(db, SCORE_REF);
    const unsubscribe = onValue(scoreRef, (snapshot) => {
        callback(snapshot.exists() ? (snapshot.val() as ScoreboardState) : null);
    });
    return unsubscribe;
}

// ─── Sound helpers ─────────────────────────────────────────────────────────
// function playSound() {
//   try {
//     const audio = new Audio(countdownSound);
//     audio.volume = 1.0;
//     audio.play().catch(e => console.warn("Audio play failed:", e));
//   } catch (e) {
//     console.warn("Audio not available", e);
//   }
// }
//
// // add pause to sound when the game is paused
// // the reset button is not working
//add increment value for all inputs 
// function PlayTenSeconds() {
//   try {
//     const audio = new Audio(TenSeconds);
//     audio.volume = 1.0;
//     audio.play().catch(e => console.warn("Audio play failed:", e));
//   } catch (e) {
//     console.warn("Audio not available", e);
//   }
// }

// At 10 seconds: plays the sound (two beeps)
// function playWarningBeep() { PlayTenSeconds(); }

// At 0 seconds: plays the sound (final beep)
// function playEndBuzzer() { playSound(); }

// ─── Styles ────────────────────────────────────────────────────────────────
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg: #080b10;
    --surface: #0e1219;
    --surface2: #151b24;
    --surface3: #1c2534;
    --border: rgba(255, 255, 255, 0.01);
    --border2:  rgba(255, 255, 255, 0.01);
    --text: #f0f4ff;
    --text2: #8892a4;
    --text3: #505a6a;
    --cyan: #00d4ff;
    --cyan-dim: rgba(0,212,255,0.15);
    --amber: #ffb800;
    --amber-dim: rgba(255,184,0,0.15);
    --green: #00e5a0;
    --red: #ff4060;
  }

  body { background: var(--bg); font-family: 'DM Sans', sans-serif; color: var(--text); }

  @keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
  @keyframes scorePop { 0%{transform:scale(1)} 40%{transform:scale(1.12)} 100%{transform:scale(1)} }
  @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.6;transform:scale(0.9)} }
  @keyframes timerPulse { 0%,100%{opacity:1;} 50%{opacity:0.4;} }
  @keyframes timerWarning { 0%,100%{color:var(--red);text-shadow:0 0 30px rgba(255,64,96,0.6);} 50%{color:#ff8080;text-shadow:0 0 60px rgba(255,64,96,0.9);} }

  .fade-up { animation: fadeUp 0.4s ease both; }
  .score-pop { animation: scorePop 0.35s cubic-bezier(0.34,1.56,0.64,1); }
  .timer-warning { animation: timerWarning 0.6s ease infinite; }

  input[type=number]::-webkit-inner-spin-button,
  input[type=number]::-webkit-outer-spin-button { -webkit-appearance:none; }
  input[type=number] { -moz-appearance:textfield; }

  .btn {
    font-family: 'DM Sans', sans-serif;
    font-weight: 600;
    border: none;
    cursor: pointer;
    transition: all 0.15s ease;
    border-radius: 10px;
  }
  .btn:hover { filter: brightness(1.15); transform: translateY(-1px); }
  .btn:active { transform: scale(0.97); filter: brightness(0.95); }
  .btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

  input, select { font-family: 'DM Sans', sans-serif; color: var(--text); transition: border-color 0.2s; }
  input:focus, select:focus { outline: none; }

  /* ── Clean editable input style ── */
  .field-input {
    width: 100%;
    background: transparent;
    border: none;
    border-bottom: 2px solid rgba(255,255,255,0.15);
    border-radius: 0;
    padding: 10px 4px;
    color: var(--text);
    font-family: 'DM Sans', sans-serif;
    font-size: 16px;
    font-weight: 600;
    transition: border-color 0.2s;
    display: block;
  }
  .field-input:focus { outline: none; border-bottom-color: var(--cyan); }
  .field-input::placeholder { color: var(--text3); font-weight: 400; }

  .field-input.amber:focus { border-bottom-color: var(--amber); }

  .score-input {
    background: transparent;
    border: 2px solid rgba(255,255,255,0.1);
    border-radius: 12px;
    padding: 10px 8px;
    color: var(--text);
    font-family: 'Bebas Neue', sans-serif;
    font-size: 28px;
    text-align: center;
    width: 100%;
    transition: border-color 0.2s, background 0.2s;
  }
  .score-input:focus { outline: none; background: rgba(255,255,255,0.04); }
  .score-input.cyan:focus { border-color: var(--cyan); }
  .score-input.amber:focus { border-color: var(--amber); }
`;

function GlobalStyles() {
    return <style>{styles}</style>;
}

// ─── Role Select ───────────────────────────────────────────────────────────
export function RoleSelect({onSelect}: { onSelect: (role: string) => void }) {
    return (
        <div style={{
            minHeight: "100vh",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexDirection: "column", gap: 48, padding: 24,
            background: "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(0,212,255,0.08), transparent), var(--bg)",
            position: "relative", overflow: "hidden",
        }}>
            <GlobalStyles/>
            <div style={{
                position: "absolute", inset: 0, pointerEvents: "none",
                backgroundImage: "linear-gradient(rgba(0,212,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.03) 1px, transparent 1px)",
                backgroundSize: "60px 60px",
            }}/>

            <div className="fade-up" style={{textAlign: "center", position: "relative"}}>
                <div style={{
                    fontFamily: "'Bebas Neue', sans-serif",
                    fontSize: "clamp(56px, 14vw, 96px)",
                    letterSpacing: "0.08em", color: "var(--text)", lineHeight: 1,
                    textShadow: "0 0 60px rgba(0,212,255,0.2)",
                }}>
                    SCOREBOARD
                </div>
                <div style={{
                    fontFamily: "'DM Mono', monospace", fontSize: 11,
                    letterSpacing: "0.4em", color: "var(--cyan)",
                    textTransform: "uppercase", marginTop: 10, opacity: 0.8,
                }}>
                    LIVE · CROSS-DEVICE · REAL-TIME
                </div>
            </div>

            <div className="fade-up" style={{
                display: "flex", gap: 20, flexWrap: "wrap",
                justifyContent: "center", width: "100%", maxWidth: 820,
                animationDelay: "0.1s",
            }}>
                {[
                    {
                        role: "viewer",
                        icon: "◉",
                        label: "SPECTATOR",
                        desc: "Watch scores live",
                        accent: "var(--cyan)",
                        dimAccent: "var(--cyan-dim)"
                    },
                    {
                        role: "timer-only",
                        icon: "⏱",
                        label: "TIMER VIEW",
                        desc: "Full-screen countdown only",
                        accent: "var(--green)",
                        dimAccent: "rgba(0,229,160,0.15)"
                    },
                    {
                        role: "admin",
                        icon: "⚡",
                        label: "OPERATOR",
                        desc: "Control the board",
                        accent: "var(--amber)",
                        dimAccent: "var(--amber-dim)"
                    },
                ].map(({role, icon, label, desc, accent, dimAccent}) => (
                    <button
                        key={role}
                        onClick={() => onSelect(role)}
                        style={{
                            flex: "1 1 200px", minWidth: 200, padding: "32px 24px",
                            background: "var(--surface)", border: "1px solid var(--border)",
                            borderRadius: 20, cursor: "pointer",
                            display: "flex", flexDirection: "column", alignItems: "center",
                            gap: 14, transition: "all 0.25s ease",
                        }}
                        onMouseEnter={e => {
                            e.currentTarget.style.borderColor = accent;
                            e.currentTarget.style.background = "var(--surface2)";
                            e.currentTarget.style.boxShadow = `0 0 40px ${dimAccent}, 0 20px 40px rgba(0,0,0,0.4)`;
                            e.currentTarget.style.transform = "translateY(-3px)";
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.borderColor = "var(--border)";
                            e.currentTarget.style.background = "var(--surface)";
                            e.currentTarget.style.boxShadow = "none";
                            e.currentTarget.style.transform = "translateY(0)";
                        }}
                    >
                        <span style={{
                            fontSize: 36,
                            color: accent,
                            filter: `drop-shadow(0 0 12px ${accent})`
                        }}>{icon}</span>
                        <span style={{
                            fontFamily: "'Bebas Neue', sans-serif",
                            fontSize: 28,
                            letterSpacing: "0.1em",
                            color: accent
                        }}>{label}</span>
                        <span style={{
                            fontSize: 13,
                            color: "var(--text2)",
                            textAlign: "center",
                            lineHeight: 1.5
                        }}>{desc}</span>
                    </button>
                ))}
            </div>

            <div className="fade-up" style={{
                fontSize: 12, color: "var(--text3)", fontFamily: "'DM Mono', monospace",
                animationDelay: "0.2s",
            }}>
                Powered by Firebase — syncs instantly across all devices
            </div>
        </div>
    );
}

// ─── Score Card ────────────────────────────────────────────────────────────
export function ScoreCard({team, isHome}: { team: Team; isHome: boolean }) {
    const prevScore = useRef(team.score);
    const [popping, setPopping] = useState(false);

    useEffect(() => {
        if (team.score !== prevScore.current) {
            setPopping(true);
            prevScore.current = team.score;
            const t = setTimeout(() => setPopping(false), 400);
            return () => clearTimeout(t);
        }
    }, [team.score]);

    const accent = isHome ? "var(--cyan)" : "var(--amber)";
    const dimAccent = isHome ? "var(--cyan-dim)" : "var(--amber-dim)";

    return (
        <div style={{
            flex: 1, display: "flex", flexDirection: "column",
            alignItems: isHome ? "flex-start" : "flex-end",
            padding: "clamp(20px,4vw,44px) clamp(16px,3vw,40px)",
        }}>
            <div style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: 11,
                letterSpacing: "0.25em",
                color: accent,
                marginBottom: 8,
                opacity: 0.8
            }}>
                {isHome ? "HOME" : "AWAY"}
            </div>
            <div style={{
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: "clamp(22px,4.5vw,38px)", letterSpacing: "0.06em",
                color: "var(--text)", marginBottom: 16,
                textAlign: isHome ? "left" : "right",
                maxWidth: "100%", wordBreak: "break-word",
            }}>
                {team.name}
            </div>
            <div
                className={popping ? "score-pop" : ""}
                style={{
                    fontFamily: "'Bebas Neue', sans-serif",
                    fontSize: "clamp(72px,16vw,148px)", letterSpacing: "-0.02em",
                    color: accent, lineHeight: 1,
                    textShadow: `0 0 60px ${dimAccent}`,
                }}
            >
                {String(team.score).padStart(2, "0")}
            </div>
        </div>
    );
}

// ─── Scoreboard Display ────────────────────────────────────────────────────
export function ScoreboardDisplay({state}: { state: ScoreboardState }) {
    const [tick, setTick] = useState(true);
    useEffect(() => {
        const t = setInterval(() => setTick(b => !b), 900);
        return () => clearInterval(t);
    }, []);

    return (
        <div style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 24,
            overflow: "hidden"
        }}>
            <div style={{
                background: "var(--surface2)", borderBottom: "1px solid var(--border)",
                padding: "14px 24px", display: "flex", alignItems: "center",
                justifyContent: "space-between", flexWrap: "wrap", gap: 12,
            }}>
                <div style={{display: "flex", alignItems: "center", gap: 8}}>
                    <div style={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        background: "var(--red)",
                        boxShadow: "0 0 12px var(--red)",
                        animation: "pulse 1.5s infinite"
                    }}/>
                    <span style={{
                        fontFamily: "'DM Mono', monospace",
                        fontSize: 11,
                        letterSpacing: "0.2em",
                        color: "var(--red)",
                        fontWeight: 500
                    }}>LIVE</span>
                </div>
                <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    background: "var(--surface3)",
                    padding: "8px 18px",
                    borderRadius: 100,
                    border: "1px solid var(--border2)"
                }}>
                    <span style={{
                        fontFamily: "'Bebas Neue', sans-serif",
                        fontSize: 18,
                        letterSpacing: "0.1em",
                        color: "var(--text)"
                    }}>{state.period}</span>
                    <span style={{color: "var(--text3)", fontSize: 14}}>·</span>
                    <span style={{
                        fontFamily: "'DM Mono', monospace",
                        fontSize: 16,
                        fontWeight: 500,
                        color: tick ? "var(--cyan)" : "var(--text3)",
                        transition: "color 0.1s"
                    }}>Round</span>
                </div>
                <div style={{
                    fontFamily: "'DM Mono', monospace",
                    fontSize: 11,
                    color: "var(--text3)",
                    letterSpacing: "0.05em"
                }}>
                    {state.lastUpdated ? new Date(state.lastUpdated).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit"
                    }) : "—"}
                </div>
            </div>

            <div style={{display: "flex", alignItems: "center"}}>
                <ScoreCard team={state.teamA} isHome={true}/>
                <div style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 10,
                    padding: "0 16px",
                    flexShrink: 0
                }}>
                    <div style={{
                        width: 1,
                        height: 60,
                        background: "linear-gradient(to bottom, transparent, var(--border2), transparent)"
                    }}/>
                    <span style={{
                        fontFamily: "'Bebas Neue', sans-serif",
                        fontSize: 22,
                        letterSpacing: "0.1em",
                        color: "var(--text3)"
                    }}>VS</span>
                    <div style={{
                        width: 1,
                        height: 60,
                        background: "linear-gradient(to bottom, transparent, var(--border2), transparent)"
                    }}/>
                </div>
                <ScoreCard team={state.teamB} isHome={false}/>
            </div>
        </div>
    );
}

// ─── Countdown Display (Viewer only) ──────────────────────────────────────
function CountdownDisplay({state}: { state: ScoreboardState }) {
    const [remaining, setRemaining] = useState<number>(state.timerDuration);
    const warned10Ref = useRef(false);
    const warnedEndRef = useRef(false);
    const prevRunningRef = useRef(state.timerRunning);
    const prevStartedAtRef = useRef(state.timerStartedAt);
    const [isMuted, setIsMuted] = useState<boolean>(false)
    const {playSound, pauseAllSounds} = useAudioControl(isMuted)
    // Reset sound flags when timer restarts or duration changes
    useEffect(() => {
        const wasRunning = prevRunningRef.current;
        const wasStartedAt = prevStartedAtRef.current;
        prevRunningRef.current = state.timerRunning;
        prevStartedAtRef.current = state.timerStartedAt;

        // New start detected
        if (state.timerRunning && (!wasRunning || state.timerStartedAt !== wasStartedAt)) {
            warned10Ref.current = false;
            warnedEndRef.current = false;
        }
    }, [state.timerRunning, state.timerStartedAt]);
    useEffect(() => {
        setIsMuted(!state.timerRunning);
    }, [state.timerRunning]);

    // Pause all sounds when timer stops
    useEffect(() => {
        if (!state.timerRunning) {
            pauseAllSounds();
        }
    }, [state.timerRunning, pauseAllSounds]);
    // In CountdownDisplay component, fix the sound conditions:
    useEffect(() => {
        if (!state.timerRunning || state.timerStartedAt === null) {
            // Show static remaining when paused/stopped
            if (state.timerStartedAt !== null) {
                const elapsed = (Date.now() - state.timerStartedAt) / 1000;
                const rem = Math.max(0, state.timerDuration - elapsed);
                setRemaining(state.timerRunning ? rem : state.timerDuration);
            } else {
                setRemaining(state.timerDuration);
            }
            return;
        }

        const tick = () => {
            const elapsed = (Date.now() - (state.timerStartedAt as number)) / 1000;
            const rem = Math.max(0, state.timerDuration - elapsed);
            setRemaining(rem);

            // 10-second warning sound (two beeps)
            if (rem <= 10 && rem > 0 && !warned10Ref.current) {
                warned10Ref.current = true;
                playSound("tenSecTingSnd");
            }

            // 4-second warning sound (final beep)
            if (rem <= 3 && rem > 0 && !warnedEndRef.current) {
                warnedEndRef.current = true;
                playSound("CountDownSnd");
            }
        };

        tick(); // immediate
        const interval = setInterval(tick, 250);
        return () => clearInterval(interval);
    }, [state.timerRunning, state.timerStartedAt, state.timerDuration, playSound]);

    const secs = Math.ceil(remaining);
    const isWarning = secs <= 10 && secs > 0 && state.timerRunning;
    const isEnd = secs <= 0;
    const progress = Math.max(0, Math.min(1, remaining / state.timerDuration));
    const circumference = 2 * Math.PI * 54;

    const timerColor = isEnd ? "var(--text3)" : isWarning ? "var(--red)" : "var(--green)";
    const ringColor = isEnd ? "#333" : isWarning ? "var(--red)" : "var(--green)";

    return (
        <div style={{
            background: "var(--surface)", border: `1px solid ${isWarning ? "rgba(255,64,96,0.4)" : "var(--border)"}`,
            borderRadius: 24, padding: "28px 24px",
            display: "flex", flexDirection: "column", alignItems: "center", gap: 16,
            transition: "border-color 0.3s",
            boxShadow: isWarning ? "0 0 40px rgba(255,64,96,0.15)" : "none",
        }}>
            <div style={{display: "flex", alignItems: "center", gap: 10}}>
                <div style={{
                    fontFamily: "'DM Mono', monospace", fontSize: 11,
                    letterSpacing: "0.25em", color: "var(--text3)",
                }}>
                    ROUND {state.timerRound} TIMER
                </div>
                {state.timerRunning && !isEnd && (
                    <div style={{
                        width: 7, height: 7, borderRadius: "50%", background: "var(--green)",
                        boxShadow: "0 0 10px var(--green)", animation: "pulse 1s infinite",
                    }}/>
                )}
            </div>

            {/* Circular progress ring */}
            <div style={{position: "relative", width: 140, height: 140}}>
                <svg width="140" height="140" style={{transform: "rotate(-90deg)"}}>
                    <circle cx="70" cy="70" r="54" fill="none" stroke="var(--surface3)" strokeWidth="8"/>
                    <circle
                        cx="70" cy="70" r="54" fill="none"
                        stroke={ringColor}
                        strokeWidth="8"
                        strokeDasharray={circumference}
                        strokeDashoffset={circumference * (1 - progress)}
                        strokeLinecap="round"
                        style={{transition: "stroke-dashoffset 0.25s linear, stroke 0.3s ease"}}
                    />
                </svg>
                <div style={{
                    position: "absolute", inset: 0,
                    display: "flex", flexDirection: "column",
                    alignItems: "center", justifyContent: "center",
                }}>
                    <div
                        className={isWarning ? "timer-warning" : ""}
                        style={{
                            fontFamily: "'Bebas Neue', sans-serif",
                            fontSize: isEnd ? 36 : 52,
                            letterSpacing: "-0.02em",
                            color: timerColor,
                            lineHeight: 1,
                            textShadow: isWarning ? "0 0 30px rgba(255,64,96,0.6)" : isEnd ? "none" : "0 0 20px rgba(0,229,160,0.4)",
                        }}
                    >
                        {isEnd ? "END" : secs}
                    </div>
                    {!isEnd && (
                        <div style={{
                            fontFamily: "'DM Mono', monospace",
                            fontSize: 10,
                            color: "var(--text3)",
                            letterSpacing: "0.1em"
                        }}>
                            SEC
                        </div>
                    )}
                </div>
            </div>

            <div style={{
                display: "flex", gap: 12, alignItems: "center",
                fontFamily: "'DM Mono', monospace", fontSize: 11,
                color: "var(--text3)", letterSpacing: "0.1em",
            }}>
                <span>DURATION: {state.timerDuration}s</span>
                <span style={{color: "var(--surface3)"}}>|</span>
                <span style={{color: state.timerRunning && !isEnd ? "var(--green)" : "var(--text3)"}}>
          {isEnd ? "FINISHED" : state.timerRunning ? "RUNNING" : "READY"}
        </span>
            </div>
        </div>
    );
}

// ─── Timer Only View ── full-screen countdown for dedicated display ────────
export function TimerOnlyView({onBack}: { onBack: () => void }) {
    const [state, setState] = useState<ScoreboardState>(DEFAULT_STATE);
    const [status, setStatus] = useState<"connecting" | "live" | "offline">("connecting");
    const [remaining, setRemaining] = useState<number>(DEFAULT_STATE.timerDuration);
    const warned10Ref = useRef(false);
    const warnedEndRef = useRef(false);
    const prevStartedAtRef = useRef<number | null>(null);
    const prevRunningRef = useRef(false);


    // Update mute state based on timer running status
    // Add these missing state and hook
    const [isMuted, setIsMuted] = useState<boolean>(!state.timerRunning);
    const {playSound, pauseAllSounds} = useAudioControl(isMuted);

    useEffect(() => {
        const unsubscribe = subscribeToState((data) => {
            if (data) {
                setState({...DEFAULT_STATE, ...data});
                setStatus("live");
            } else {
                setStatus("offline");
            }
        });
        return unsubscribe;
    }, []);

    // Update mute state based on timer running status
    useEffect(() => {
        setIsMuted(!state.timerRunning);
    }, [state.timerRunning]);

    // Pause all sounds when timer stops
    useEffect(() => {
        if (!state.timerRunning) {
            pauseAllSounds();
        }
    }, [state.timerRunning, pauseAllSounds]);

    // Reset sound flags on new timer start
    useEffect(() => {
        if (state.timerRunning && (!prevRunningRef.current || state.timerStartedAt !== prevStartedAtRef.current)) {
            warned10Ref.current = false;
            warnedEndRef.current = false;
        }
        prevRunningRef.current = state.timerRunning;
        prevStartedAtRef.current = state.timerStartedAt;
    }, [state.timerRunning, state.timerStartedAt]);

    useEffect(() => {
        if (!state.timerRunning || state.timerStartedAt === null) {
            setRemaining(state.timerDuration);
            return;
        }
        const tick = () => {
            const elapsed = (Date.now() - (state.timerStartedAt as number)) / 1000;
            const rem = Math.max(0, state.timerDuration - elapsed);
            setRemaining(rem);

            // Fix the sound conditions - you had them swapped
            if (rem <= 10 && rem > 0 && !warned10Ref.current) {
                warned10Ref.current = true;
                playSound("tenSecTingSnd");
            }

            if (rem <= 3 && rem > 0 && !warnedEndRef.current) {
                warnedEndRef.current = true;
                playSound("CountDownSnd");
            }
        };
        tick();
        const interval = setInterval(tick, 100);
        return () => clearInterval(interval);
    }, [state.timerRunning, state.timerStartedAt, state.timerDuration, playSound]);

    const secs = Math.ceil(remaining);
    const isWarning = secs <= 10 && secs > 0 && state.timerRunning;
    const isEnd = secs <= 0;
    const progress = Math.max(0, Math.min(1, remaining / state.timerDuration));
    const R = 200;
    const circumference = 2 * Math.PI * R;

    const timerColor = isEnd ? "var(--text3)" : isWarning ? "var(--red)" : "var(--green)";
    const ringColor = isEnd ? "#222" : isWarning ? "var(--red)" : "var(--green)";
    const glowColor = isEnd ? "transparent" : isWarning ? "rgba(255,64,96,0.35)" : "rgba(0,229,160,0.25)";

    const statusColors: Record<string, string> = {
        connecting: "var(--text3)", live: "var(--green)", offline: "var(--red)",
    };

    return (
        <div style={{
            minHeight: "100vh", width: "100%",
            background: isWarning
                ? "radial-gradient(ellipse 80% 60% at 50% 50%, rgba(255,64,96,0.07), transparent), var(--bg)"
                : "radial-gradient(ellipse 80% 60% at 50% 50%, rgba(0,229,160,0.05), transparent), var(--bg)",
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            position: "relative", overflow: "hidden",
            transition: "background 0.5s ease",
        }}>
            <GlobalStyles/>

            {/* Grid pattern */}
            <div style={{
                position: "absolute", inset: 0, pointerEvents: "none",
                backgroundImage: "linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)",
                backgroundSize: "80px 80px",
            }}/>

            {/* Back button + status — top bar */}
            <div style={{
                position: "absolute", top: 0, left: 0, right: 0,
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "20px 28px",
            }}>
                <button className="btn" onClick={onBack} style={{
                    background: "var(--surface2)",
                    color: "var(--text2)",
                    padding: "10px 20px",
                    fontSize: 13,
                    border: "1px solid var(--border)"
                }}>← Back
                </button>
                <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    background: "var(--surface2)",
                    padding: "8px 16px",
                    borderRadius: 100,
                    border: "1px solid var(--border)",
                    fontFamily: "'DM Mono', monospace",
                    fontSize: 11,
                    letterSpacing: "0.15em",
                    color: statusColors[status]
                }}>
                    <div style={{
                        width: 7,
                        height: 7,
                        borderRadius: "50%",
                        background: statusColors[status],
                        boxShadow: status === "live" ? `0 0 10px ${statusColors[status]}` : "none",
                        animation: status === "live" ? "pulse 2s infinite" : "none"
                    }}/>
                    {status.toUpperCase()}
                </div>
            </div>

            {/* Round label */}
            <div style={{
                fontFamily: "'DM Mono', monospace", fontSize: 13,
                letterSpacing: "0.4em", color: "var(--text3)",
                marginBottom: 40, textTransform: "uppercase",
                position: "relative",
            }}>
                ROUND {state.timerRound} · {state.timerDuration}s
            </div>

            {/* Big circular ring */}
            <div style={{
                position: "relative",
                width: 480,
                height: 480,
                maxWidth: "min(480px, 80vw)",
                maxHeight: "min(480px, 80vw)"
            }}>
                <svg
                    width="100%" height="100%"
                    viewBox="0 0 480 480"
                    style={{transform: "rotate(-90deg)", filter: `drop-shadow(0 0 30px ${glowColor})`}}
                >
                    {/* Track */}
                    <circle cx="240" cy="240" r={R} fill="none" stroke="var(--surface3)" strokeWidth="14"/>
                    {/* Progress arc */}
                    <circle
                        cx="240" cy="240" r={R} fill="none"
                        stroke={ringColor}
                        strokeWidth="14"
                        strokeDasharray={circumference}
                        strokeDashoffset={circumference * (1 - progress)}
                        strokeLinecap="round"
                        style={{transition: "stroke-dashoffset 0.15s linear, stroke 0.4s ease"}}
                    />
                </svg>

                {/* Center content */}
                <div style={{
                    position: "absolute", inset: 0,
                    display: "flex", flexDirection: "column",
                    alignItems: "center", justifyContent: "center", gap: 4,
                }}>
                    {isEnd ? (
                        <div style={{
                            fontFamily: "'Bebas Neue', sans-serif",
                            fontSize: "clamp(60px, 14vw, 110px)",
                            letterSpacing: "0.08em",
                            color: "var(--text3)",
                            lineHeight: 1,
                        }}>
                            TIME
                        </div>
                    ) : (
                        <>
                            <div
                                className={isWarning ? "timer-warning" : ""}
                                style={{
                                    fontFamily: "'Bebas Neue', sans-serif",
                                    fontSize: "clamp(90px, 20vw, 160px)",
                                    letterSpacing: "-0.03em",
                                    color: timerColor,
                                    lineHeight: 1,
                                    textShadow: isWarning
                                        ? "0 0 60px rgba(255,64,96,0.7)"
                                        : isEnd ? "none"
                                            : "0 0 40px rgba(0,229,160,0.4)",
                                }}
                            >
                                {secs}
                            </div>
                            <div style={{
                                fontFamily: "'DM Mono', monospace",
                                fontSize: "clamp(12px, 2vw, 18px)",
                                letterSpacing: "0.3em",
                                color: isWarning ? "rgba(255,64,96,0.6)" : "var(--text3)",
                            }}>
                                SECONDS
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Status bar */}
            <div style={{
                marginTop: 48,
                display: "flex", alignItems: "center", gap: 16,
                fontFamily: "'DM Mono', monospace", fontSize: 12,
                letterSpacing: "0.2em", color: "var(--text3)",
            }}>
                {state.timerRunning && !isEnd && (
                    <div style={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        background: "var(--green)",
                        boxShadow: "0 0 12px var(--green)",
                        animation: "pulse 1s infinite"
                    }}/>
                )}
                <span style={{color: isEnd ? "var(--text3)" : state.timerRunning ? "var(--green)" : "var(--text2)"}}>
          {isEnd ? "FINISHED" : state.timerRunning ? "RUNNING" : "READY"}
        </span>
                {!isEnd && !state.timerRunning && (
                    <span style={{color: "var(--text3)"}}>· WAITING FOR OPERATOR</span>
                )}
            </div>
        </div>
    );
}

// ─── Viewer View ── real-time Firebase subscription ────────────────────────
export function ViewerView({onBack}: { onBack: () => void }) {
    const [state, setState] = useState<ScoreboardState>(DEFAULT_STATE);
    const [status, setStatus] = useState<"connecting" | "live" | "offline">("connecting");

    useEffect(() => {
        const unsubscribe = subscribeToState((data) => {
            if (data) {
                setState(data);
                setStatus("live");
            } else {
                setStatus("offline");
            }
        });
        return unsubscribe;
    }, []);

    const statusConfig: Record<"connecting" | "live" | "offline", { color: string; label: string }> = {
        connecting: {color: "var(--text3)", label: "CONNECTING"},
        live: {color: "var(--green)", label: "LIVE"},
        offline: {color: "var(--red)", label: "OFFLINE"},
    };
    const {color: statusColor, label: statusLabel} = statusConfig[status];

    return (
        <div style={{
            minHeight: "100vh",
            background: "radial-gradient(ellipse 100% 50% at 50% 0%, rgba(0,212,255,0.04), transparent), var(--bg)",
            display: "flex", flexDirection: "column", alignItems: "center",
        }}>
            <GlobalStyles/>
            <div style={{
                width: "100%", maxWidth: 1200,
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "20px 24px", flexWrap: "wrap", gap: 12,
            }}>
                <button className="btn" onClick={onBack} style={{
                    background: "var(--surface2)",
                    color: "var(--text2)",
                    padding: "10px 20px",
                    fontSize: 13,
                    border: "1px solid var(--border)"
                }}>← Back
                </button>
                <div style={{
                    fontFamily: "'Bebas Neue', sans-serif",
                    fontSize: 22,
                    letterSpacing: "0.15em",
                    color: "var(--text2)"
                }}></div>
                <div style={{
                    display: "flex", alignItems: "center", gap: 8,
                    background: "var(--surface2)", padding: "8px 16px", borderRadius: 100,
                    border: "1px solid var(--border)", fontFamily: "'DM Mono', monospace",
                    fontSize: 11, letterSpacing: "0.15em", color: statusColor,
                }}>
                    <div style={{
                        width: 7, height: 7, borderRadius: "50%", background: statusColor,
                        boxShadow: status === "live" ? `0 0 10px ${statusColor}` : "none",
                        animation: status === "live" ? "pulse 2s infinite" : "none",
                    }}/>
                    {statusLabel}
                </div>
            </div>

            <div className="fade-up" style={{
                width: "100%",
                maxWidth: 1200,
                padding: "0 24px 40px",
                display: "flex",
                flexDirection: "column",
                gap: 16
            }}>
                <ScoreboardDisplay state={state}/>
                <CountdownDisplay state={state}/>
                {/*<div style={{ textAlign: "center", fontFamily: "'DM Mono', monospace", fontSize: 11, color: "var(--text3)", letterSpacing: "0.1em" }}>*/}
                {/*  UPDATES INSTANTLY VIA FIREBASE*/}
                {/*</div>*/}
            </div>
        </div>
    );
}

import "../src/style.css"
import {useAudioControl} from "./hook/useSound.ts";

function ControlCard({children, accent, title}: { children: React.ReactNode; accent: string; title: string }) {
    return (
        <div
            style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: 20,
                padding: 24,
                transition: "border-color 0.2s"
            }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = accent + "40")}
            onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--border)")}
        >
            <div style={{display: "flex", alignItems: "center", gap: 8, marginBottom: 20}}>
                <div style={{
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    background: accent,
                    boxShadow: `0 0 10px ${accent}`
                }}/>
                <span style={{
                    fontFamily: "'DM Mono', monospace",
                    fontSize: 11,
                    letterSpacing: "0.2em",
                    color: accent
                }}>{title}</span>
            </div>
            {children}
        </div>
    );
}

export function AdminView({onBack}: { onBack: () => void }) {
    const [state, setState] = useState<ScoreboardState>(DEFAULT_STATE);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Sound control state
    const [isMuted, setIsMuted] = useState<boolean>(!state.timerRunning);
    const {playSound, pauseAllSounds} = useAudioControl(isMuted);
    const [audioEnabled, setAudioEnabled] = useState(false);
    const [pausedElapsed, setPausedElapsed] = useState<number>(0);

    // Update mute state based on timer running status
    useEffect(() => {
        setIsMuted(!state.timerRunning);
    }, [state.timerRunning]);

    // Pause all sounds when timer stops or resets
    useEffect(() => {
        if (!state.timerRunning || state.timerStartedAt === null) {
            // When paused, show the frozen time based on pausedElapsed
            if (state.timerStartedAt !== null && !state.timerRunning) {
                // Paused state - show frozen time
                setPreviewRemaining(Math.max(0, state.timerDuration - pausedElapsed));
            } else {
                // Reset state - show full duration
                setPreviewRemaining(state.timerDuration);
            }
            return;
        }

        // Timer is running - update normally
        const tick = () => {
            const elapsed = (Date.now() - (state.timerStartedAt as number)) / 1000;
            setPreviewRemaining(Math.max(0, state.timerDuration - elapsed));
        };

        tick();
        const interval = setInterval(tick, 250);
        return () => clearInterval(interval);
    }, [state.timerRunning, state.timerStartedAt, state.timerDuration, pausedElapsed]);
    // Draft state — local only, not synced until Enter
    const [drafts, setDrafts] = useState({
        teamAName: DEFAULT_STATE.teamA.name,
        teamBName: DEFAULT_STATE.teamB.name,
        clock: DEFAULT_STATE.clock,
        timerDuration: String(DEFAULT_STATE.timerDuration),
    });

    const testSound = () => {
        playSound("tenSecTingSnd");
        setAudioEnabled(true);
    };

    useEffect(() => {
        const scoreRef = ref(db, SCORE_REF);
        const loadInitialState = async () => {
            try {
                const snapshot = await get(scoreRef);
                if (snapshot.exists()) {
                    const loaded = {...DEFAULT_STATE, ...snapshot.val() as ScoreboardState};
                    setState(loaded);
                    setDrafts({
                        teamAName: loaded.teamA.name,
                        teamBName: loaded.teamB.name,
                        clock: loaded.clock,
                        timerDuration: String(loaded.timerDuration),
                    });
                }
            } catch (err) {
                console.error("Failed to load initial state:", err);
            } finally {
                setIsLoading(false);
            }
        };
        loadInitialState();
    }, []);

    const handleTeamANameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setDrafts(d => ({...d, teamAName: e.target.value.toUpperCase()}));
    };

    const handleTeamAScoreChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const inputValue = e.target.value;
        if (inputValue === '') {
            setState(prev => ({...prev, teamA: {...prev.teamA, score: 0}}));
            setSaved(false);
            return;
        }
        const newValue = parseInt(inputValue, 10);
        if (!isNaN(newValue)) {
            setState(prev => ({
                ...prev,
                teamA: {...prev.teamA, score: Math.max(0, Math.min(999999, newValue))}
            }));
            setSaved(false);
        }
    };

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
        e.target.select();
    };

    const handleTeamBNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setDrafts(d => ({...d, teamBName: e.target.value.toUpperCase()}));
    };

    const handleTeamBScoreChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const inputValue = e.target.value;
        if (inputValue === '') {
            setState(prev => ({...prev, teamB: {...prev.teamB, score: 0}}));
            setSaved(false);
            return;
        }
        const newValue = parseInt(inputValue, 10);
        if (!isNaN(newValue)) {
            setState(prev => ({
                ...prev,
                teamB: {...prev.teamB, score: Math.max(0, Math.min(999999, newValue))}
            }));
            setSaved(false);
        }
    };

    const teamANameRef = useRef<HTMLInputElement>(null);
    const teamAScoreRef = useRef<HTMLInputElement>(null);

    const handleQuickAddHome = (amount: number) => {
        setState(prev => ({
            ...prev,
            teamA: {...prev.teamA, score: Math.max(0, Math.min(999999, prev.teamA.score + amount))}
        }));
        setSaved(false);
    };

    const handleQuickAddAway = (amount: number) => {
        setState(prev => ({
            ...prev,
            teamB: {...prev.teamB, score: Math.max(0, Math.min(999999, prev.teamB.score + amount))}
        }));
        setSaved(false);
    };

    const handleIncrementHome = () => {
        setState(prev => ({
            ...prev,
            teamA: {...prev.teamA, score: Math.min(999999, prev.teamA.score + 100)}
        }));
        setSaved(false);
    };

    const handleDecrementHome = () => {
        setState(prev => ({
            ...prev,
            teamA: {...prev.teamA, score: Math.max(0, prev.teamA.score - 100)}
        }));
        setSaved(false);
    };

    const handleIncrementAway = () => {
        setState(prev => ({
            ...prev,
            teamB: {...prev.teamB, score: Math.min(999999, prev.teamB.score + 100)}
        }));
        setSaved(false);
    };

    const handleDecrementAway = () => {
        setState(prev => ({
            ...prev,
            teamB: {...prev.teamB, score: Math.max(0, prev.teamB.score - 100)}
        }));
        setSaved(false);
    };

    const commitTeamAName = () => {
        setState(prev => ({...prev, teamA: {...prev.teamA, name: drafts.teamAName}}));
        setSaved(false);
    };

    const commitTeamBName = () => {
        setState(prev => ({...prev, teamB: {...prev.teamB, name: drafts.teamBName}}));
        setSaved(false);
    };

    // ─── Timer handlers ──────────────────────────────────────────────────────
    const handleSelectRound = (round: number) => {
        const defaultDuration = round === 1 ? 90 : 30;
        pauseAllSounds();
        setPausedElapsed(0); // Reset elapsed time
        setState(prev => ({
            ...prev,
            timerRound: round,
            timerDuration: defaultDuration,
            timerStartedAt: null,
            timerRunning: false,
        }));
        setSaved(false);
    };

    const handleSelectDuration = (duration: number) => {
        pauseAllSounds();
        setPausedElapsed(0); // Reset elapsed time
        setState(prev => ({
            ...prev,
            timerDuration: duration,
            timerStartedAt: null,
            timerRunning: false,
        }));
        setSaved(false);
    };

    const handleTimerStart = async () => {
        setIsMuted(false); // Unmute when starting/continuing

        let nextState: ScoreboardState;

        if (state.timerStartedAt && !state.timerRunning) {
            // Continuing from a paused state
            // Calculate new start time that accounts for already elapsed time
            const now = Date.now();
            const newStartTime = now - (pausedElapsed * 1000);

            nextState = {
                ...state,
                timerStartedAt: newStartTime,
                timerRunning: true,
                lastUpdated: now,
            };
        } else {
            // Fresh start
            nextState = {
                ...state,
                timerStartedAt: Date.now(),
                timerRunning: true,
                lastUpdated: Date.now(),
            };
        }

        setState(nextState);
        setSaved(false);
        try {
            await saveState(nextState);
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save');
        }
    };

    const handleTimerStop = async () => {
        pauseAllSounds(); // Pause any playing sounds
        setIsMuted(true);

        // Calculate and store elapsed time at the moment of pause
        if (state.timerStartedAt) {
            const elapsed = (Date.now() - state.timerStartedAt) / 1000;
            setPausedElapsed(elapsed);
            console.log(`Paused at ${elapsed}s elapsed`); // For debugging
        }

        const next: ScoreboardState = {
            ...state,
            timerRunning: false,
            lastUpdated: Date.now(),
            // Keep timerStartedAt so we know the original start time
        };
        setState(next);
        setSaved(false);
        try {
            await saveState(next);
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save');
        }
    };

    const handleTimerReset = () => {
        pauseAllSounds();
        setIsMuted(true);
        setPausedElapsed(0); // Reset elapsed time
        const next: ScoreboardState = {
            ...state,
            timerStartedAt: null, // Clear start time
            timerRunning: false,
            lastUpdated: Date.now(),
        };
        setState(next);
        setSaved(false);
        try {
            saveState(next);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save');
        }
    };

    const handleSave = async () => {
        setSaving(true);
        setError(null);
        try {
            const next: ScoreboardState = {...state, lastUpdated: Date.now()};
            await saveState(next);
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save');
        } finally {
            setSaving(false);
        }
    };

    const handleReset = () => {
        handleTimerReset();
    };

    const QUICK_AMOUNTS = [100, 500, 600, 1000, 2000, 5000];
    const NEGATIVE_QUICK_AMOUNTS = [-100, -500, -600, -1000, -2000, -5000];

    const ROUND1_DURATIONS = [80, 90, 95, 100];
    const ROUND2_DURATIONS = [20, 30, 35, 40];

    // Live timer preview for admin
    const [previewRemaining, setPreviewRemaining] = useState(state.timerDuration);
    useEffect(() => {
        if (!state.timerRunning || state.timerStartedAt === null) {
            setPreviewRemaining(state.timerDuration);
            return;
        }
        const tick = () => {
            const elapsed = (Date.now() - (state.timerStartedAt as number)) / 1000;
            setPreviewRemaining(Math.max(0, state.timerDuration - elapsed));
        };
        tick();
        const interval = setInterval(tick, 250);
        return () => clearInterval(interval);
    }, [state.timerRunning, state.timerStartedAt, state.timerDuration]);

    if (isLoading) {
        return (
            <div className="admin-loading">
                <div className="admin-loading__text">Loading...</div>
            </div>
        );
    }

    const previewSecs = Math.ceil(previewRemaining);
    const timerIsWarning = previewSecs <= 10 && previewSecs > 0 && state.timerRunning;
    const timerIsEnd = previewSecs <= 0;

    const countdownClass = timerIsWarning
        ? "timer-preview__countdown timer-preview__countdown--warning"
        : timerIsEnd
            ? "timer-preview__countdown timer-preview__countdown--end"
            : "timer-preview__countdown timer-preview__countdown--normal";

    return (
        <div className="admin-page">
            <GlobalStyles/>

            {/* ── Top Bar ─────────────────────────────────────────────── */}
            <div className="admin-topbar">
                <button className="btn admin-topbar__back" onClick={onBack}>← Back</button>

                <div className="admin-topbar__title">OPERATOR CONTROL</div>

                <div className="admin-topbar__actions">
                    {/* Sound test */}
                    <button
                        onClick={testSound}
                        className={`sound-btn ${audioEnabled ? "sound-btn--enabled" : "sound-btn--disabled"}`}
                    >
                        <span
                            className={`sound-btn__dot ${audioEnabled ? "sound-btn__dot--active" : "sound-btn__dot--inactive"}`}/>
                        {audioEnabled ? "SOUND ON" : "CLICK TO TEST SOUND"}
                    </button>

                    {/* Mute indicator */}
                    <div className={`status-pill ${isMuted ? "status-pill--muted" : "status-pill--active"}`}>
                        <span
                            className={`status-pill__dot ${isMuted ? "status-pill__dot--muted" : "status-pill__dot--live"}`}/>
                        {isMuted ? "SOUND MUTED" : "SOUND ACTIVE"}
                    </div>

                    {/* Firebase pill */}
                    <div className="status-pill status-pill--active">
                        🔥 FIREBASE SYNC ACTIVE
                    </div>
                </div>
            </div>

            {/* ── Main Grid ───────────────────────────────────────────── */}
            <div className="admin-content">

                {/* ── Left: Live Preview ──────────────────────────────── */}
                <div className="preview-col">
                    <div className="preview-col__label">LIVE PREVIEW</div>
                    <ScoreboardDisplay state={state}/>
                    <div className="preview-col__hint">
                        Click PUBLISH to push scores to all viewers instantly
                    </div>
                </div>

                {/* ── Right: Controls ─────────────────────────────────── */}
                <div className="admin-right-col">

                    {/* ── Round Timer Card ──────────────────────────────── */}
                    <ControlCard accent="var(--green)" title="ROUND TIMER">
                        <div style={{display: "flex", flexDirection: "column", gap: 16}}>

                            {/* Round selector */}
                            <div>
                                <label className="field-label">SELECT ROUND</label>
                                <div className="round-selector">
                                    {[1, 2].map(r => (
                                        <button
                                            key={r}
                                            className={`btn round-btn ${state.timerRound === r ? "round-btn--active" : "round-btn--idle"}`}
                                            onClick={() => handleSelectRound(r)}
                                        >
                                            ROUND {r}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Duration presets */}
                            <div>
                                <label className="field-label">
                                    DURATION — {state.timerRound === 1 ? "ROUND 1 OPTIONS" : "ROUND 2 OPTIONS"}
                                </label>
                                <div className="duration-grid">
                                    {(state.timerRound === 1 ? ROUND1_DURATIONS : ROUND2_DURATIONS).map(d => (
                                        <button
                                            key={d}
                                            className={`btn duration-btn ${state.timerDuration === d ? "duration-btn--active" : "duration-btn--idle"}`}
                                            onClick={() => handleSelectDuration(d)}
                                        >
                                            {d}s
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Custom duration input */}
                            <div>
                                <label className="field-label">CUSTOM DURATION (SECONDS)</label>
                                <input
                                    type="number"
                                    className="duration-input"
                                    value={state.timerDuration}
                                    onChange={e => {
                                        const v = parseInt(e.target.value, 10);
                                        if (!isNaN(v) && v > 0) handleSelectDuration(v);
                                    }}
                                    onFocus={handleFocus}
                                    onBlur={(e) => e.target.style.borderColor = "var(--border2)"}
                                />
                            </div>

                            {/* Timer preview */}
                            <div className="timer-preview">
                                <div>
                                    <div className="timer-preview__info"
                                         style={{marginBottom: 4, letterSpacing: "0.15em"}}>
                                        PREVIEW
                                    </div>
                                    <div className={countdownClass}>
                                        {timerIsEnd ? "END" : previewSecs}
                                        <span className="timer-preview__unit">SEC</span>
                                    </div>
                                </div>
                                <div className="timer-preview__meta">
                                    <div
                                        className={`timer-preview__status ${state.timerRunning && !timerIsEnd ? "timer-preview__status--running" : "timer-preview__status--idle"}`}>
                                        {timerIsEnd ? "⏹ FINISHED" : state.timerRunning ? "▶ RUNNING" : "⏸ READY"}
                                    </div>
                                    <div className="timer-preview__info">
                                        RND {state.timerRound} · {state.timerDuration}s
                                    </div>
                                </div>
                            </div>

                            {/* Timer controls */}
                            <div className="timer-controls">
                                <button
                                    className={`btn timer-btn ${state.timerRunning ? "timer-btn--stop" : "timer-btn--start"}`}
                                    onClick={state.timerRunning ? handleTimerStop : handleTimerStart}
                                >
                                    {state.timerRunning ? "⏸ PAUSE" : "▶ START"}
                                </button>
                                <button
                                    className="btn timer-btn timer-btn--reset"
                                    onClick={handleTimerReset}
                                >
                                    ↺ RESET
                                </button>
                            </div>

                            <div className="timer-hint">
                                START/PAUSE pushes timer to all viewers instantly
                            </div>
                        </div>
                    </ControlCard>

                    {/* ── Teams Row ─────────────────────────────────────── */}
                    <div className="teams-row">
                        {/* HOME TEAM */}

                        <ControlCard accent="var(--cyan)" title="HOME TEAM">
                            <div style={{display: "flex", flexDirection: "column", gap: 16}}>
                                <div>
                                    <label className="field-label">TEAM NAME</label>
                                    <input
                                        ref={teamANameRef}
                                        type="text"
                                        value={drafts.teamAName}
                                        onChange={handleTeamANameChange}
                                        onKeyDown={e => e.key === "Enter" && commitTeamAName()}
                                        onFocus={handleFocus}
                                        placeholder="Enter team name..."
                                        maxLength={20}
                                        className="field-input"
                                        style={{letterSpacing: "0.06em"}}
                                    />
                                </div>

                                <div>
                                    <label className="field-label">SCORE</label>
                                    <div className="score-row">
                                        <button className="btn score-adj-btn score-adj-btn--minus"
                                                onClick={handleDecrementHome}>−
                                        </button>
                                        <input
                                            ref={teamAScoreRef}
                                            type="number"
                                            inputMode="numeric"
                                            value={state.teamA.score === 0 ? '' : state.teamA.score.toString()}
                                            onChange={handleTeamAScoreChange}
                                            onFocus={handleFocus}
                                            className="score-input cyan"
                                        />
                                        <button className="btn score-adj-btn score-adj-btn--plus-cyan"
                                                onClick={handleIncrementHome}>+
                                        </button>
                                    </div>

                                    <div style={{marginBottom: 12}}>
                                        <span className="quick-label">QUICK ADD</span>
                                        <div className="quick-buttons">
                                            {QUICK_AMOUNTS.map(amount => (
                                                <button
                                                    key={amount}
                                                    className="btn quick-btn quick-btn--cyan"
                                                    onClick={() => handleQuickAddHome(amount)}
                                                >
                                                    +{amount}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <span className="quick-label">QUICK SUBTRACT</span>
                                        <div className="quick-buttons">
                                            {NEGATIVE_QUICK_AMOUNTS.map(amount => (
                                                <button
                                                    key={amount}
                                                    className="btn quick-btn quick-btn--neg"
                                                    onClick={() => handleQuickAddHome(amount)}
                                                >
                                                    {amount}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </ControlCard>
                        {/* AWAY TEAM */}
                        <ControlCard accent="var(--amber)" title="AWAY TEAM">
                            <div style={{display: "flex", flexDirection: "column", gap: 16}}>
                                <div>
                                    <label className="field-label">TEAM NAME</label>
                                    <input
                                        type="text"
                                        value={drafts.teamBName}
                                        onChange={handleTeamBNameChange}
                                        onKeyDown={e => e.key === "Enter" && commitTeamBName()}
                                        onFocus={handleFocus}
                                        placeholder="Enter team name..."
                                        maxLength={1000000}
                                        className="field-input amber"
                                        style={{letterSpacing: "0.06em"}}
                                    />
                                </div>

                                <div>
                                    <label className="field-label">SCORE</label>
                                    <div className="score-row">
                                        <button className="btn score-adj-btn score-adj-btn--minus"
                                                onClick={handleDecrementAway}>−
                                        </button>
                                        <input
                                            type="number"
                                            inputMode="numeric"
                                            pattern="[0-9]*"
                                            value={state.teamB.score === 0 ? '' : state.teamB.score.toString()}
                                            onChange={handleTeamBScoreChange}
                                            onFocus={handleFocus}
                                            className="score-input amber"
                                        />
                                        <button className="btn score-adj-btn score-adj-btn--plus-amber"
                                                onClick={handleIncrementAway}>+
                                        </button>
                                    </div>

                                    <div style={{marginBottom: 12}}>
                                        <span className="quick-label">QUICK ADD</span>
                                        <div className="quick-buttons">
                                            {QUICK_AMOUNTS.map(amount => (
                                                <button
                                                    key={amount}
                                                    className="btn quick-btn quick-btn--amber"
                                                    onClick={() => handleQuickAddAway(amount)}
                                                >
                                                    +{amount}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <span className="quick-label">QUICK SUBTRACT</span>
                                        <div className="quick-buttons">
                                            {NEGATIVE_QUICK_AMOUNTS.map(amount => (
                                                <button
                                                    key={amount}
                                                    className="btn quick-btn quick-btn--neg"
                                                    onClick={() => handleQuickAddAway(amount)}
                                                >
                                                    {amount}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </ControlCard>


                    </div>

                    {/* ── Publish / Reset ───────────────────────────────── */}
                    <div className="publish-row">
                        {error && (
                            <div className="error-banner">
                                ⚠ FIREBASE ERROR<br/>{error}<br/><br/>
                                Fix: Go to Firebase Console → Realtime Database → Rules → set both "read" and "write"
                                to <strong>true</strong>
                            </div>
                        )}
                        <button
                            className={`btn publish-btn ${saved ? "publish-btn--saved" : "publish-btn--unsaved"}`}
                            onClick={handleSave}
                            disabled={saving}
                        >
                            {saving ? "PUBLISHING…" : saved ? "✓ PUSHED TO ALL DEVICES" : "PUBLISH SCORES"}
                        </button>
                        <button className="btn reset-btn" onClick={handleReset}>
                            Reset All
                        </button>
                    </div>

                </div>
                {/* end admin-right-col */}
            </div>
            {/* end admin-content */}
        </div>
    );
}