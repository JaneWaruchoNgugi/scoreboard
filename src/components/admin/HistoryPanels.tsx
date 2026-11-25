import { useState, useEffect } from "react";
import { fetchScoreHistory, clearScoreHistory, saveScoreHistory, fetchActivityLog, clearActivityLog, saveVoiceStats } from "../../firebase";
import type { ScoreRecord, ActivityEntry } from "../../firebase";
export function ScoreHistoryPanel() {
    const [history, setHistory] = useState<ScoreRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [editIdx, setEditIdx] = useState<number | null>(null);
    const [editDraft, setEditDraft] = useState<ScoreRecord | null>(null);
    const [saving, setSaving] = useState(false);
    const [addingNew, setAddingNew] = useState(false);
    const [newDraft, setNewDraft] = useState<ScoreRecord>({
        timestamp: Date.now(), teamAName: "", teamBName: "", teamAScore: 0, teamBScore: 0, period: "",
    });

    useEffect(() => {
        fetchScoreHistory().then((h) => { setHistory([...h].reverse()); setLoading(false); });
    }, []);

    // history is displayed reversed; we need to map display index → original index
    const originalIdx = (displayIdx: number) => history.length - 1 - displayIdx;

    async function persist(updated: ScoreRecord[]) {
        setSaving(true);
        // store in chronological order (reversed from display)
        await saveScoreHistory([...updated].reverse());
        setSaving(false);
    }

    async function handleDelete(displayIdx: number) {
        const next = history.filter((_, i) => i !== displayIdx);
        setHistory(next);
        await persist(next);
    }

    function startEdit(displayIdx: number) {
        setEditIdx(displayIdx);
        setEditDraft({ ...history[displayIdx] });
    }

    async function commitEdit() {
        if (editIdx === null || !editDraft) return;
        const next = history.map((r, i) => i === editIdx ? editDraft : r);
        setHistory(next);
        setEditIdx(null);
        setEditDraft(null);
        await persist(next);
    }

    async function handleAdd() {
        const next = [{ ...newDraft, timestamp: Date.now() }, ...history];
        setHistory(next);
        setAddingNew(false);
        setNewDraft({ timestamp: Date.now(), teamAName: "", teamBName: "", teamAScore: 0, teamBScore: 0, period: "" });
        await persist(next);
    }

    const handleClear = async () => {
        if (!confirm("Clear all score history?")) return;
        await clearScoreHistory();
        setHistory([]);
    };

    const handleExportCSV = () => {
        const rows = [["Time", "Period", "Team A", "Score A", "Team B", "Score B"]];
        [...history].reverse().forEach((r) => rows.push([
            new Date(r.timestamp).toLocaleString(), r.period,
            r.teamAName, String(r.teamAScore), r.teamBName, String(r.teamBScore),
        ]));
        const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
        const a = document.createElement("a");
        a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
        a.download = `score-history-${Date.now()}.csv`;
        a.click();
    };

    const handlePrintPDF = () => {
        const rows = [...history].reverse();
        const tableRows = rows.map((r) => `
            <tr>
                <td>${new Date(r.timestamp).toLocaleString()}</td>
                <td>${r.period}</td>
                <td>${r.teamAName}</td>
                <td>${r.teamAScore}</td>
                <td>${r.teamBName}</td>
                <td>${r.teamBScore}</td>
            </tr>`).join("");
        const win = window.open("", "_blank");
        if (!win) return;
        win.document.write(`
            <html><head><title>Score History</title>
            <style>
                body { font-family: sans-serif; padding: 24px; }
                h2 { margin-bottom: 16px; }
                table { width: 100%; border-collapse: collapse; font-size: 13px; }
                th { background: #1a1d23; color: #fff; padding: 10px 12px; text-align: left; }
                td { padding: 9px 12px; border-bottom: 1px solid #eee; }
                tr:nth-child(even) td { background: #f9f9f9; }
            </style></head>
            <body>
                <h2>Bongo Quiz — Score History</h2>
                <p style="color:#666;font-size:12px;margin-bottom:16px">Exported ${new Date().toLocaleString()}</p>
                <table><thead><tr><th>Time</th><th>Period</th><th>Team A</th><th>Score A</th><th>Team B</th><th>Score B</th></tr></thead>
                <tbody>${tableRows}</tbody></table>
            </body></html>`);
        win.document.close();
        win.print();
    };

    const cell: React.CSSProperties = {
        padding: "12px 16px", fontFamily: "'DM Sans', sans-serif", fontSize: 14,
        borderBottom: "1px solid rgba(255,255,255,0.05)",
    };
    const inp: React.CSSProperties = {
        background: "var(--surface3)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 6,
        color: "var(--text)", padding: "5px 8px", fontSize: 13, width: "100%", fontFamily: "'DM Sans', sans-serif",
    };

    return (
        <div style={{ padding: 24, maxWidth: 1200, width: "100%", margin: "0 auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, gap: 12, flexWrap: "wrap" }}>
                <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, letterSpacing: "0.1em" }}>SCORE HISTORY</span>
                <div style={{ display: "flex", gap: 8 }}>
                    <button className="btn" onClick={() => setAddingNew(true)} disabled={addingNew}
                        style={{ background: "rgba(0,200,150,0.15)", color: "var(--cyan)", border: "1px solid var(--cyan)", padding: "8px 16px", fontSize: 12 }}>
                        + Add Entry
                    </button>
                    <button className="btn" onClick={handleExportCSV} disabled={history.length === 0}
                        style={{ background: "rgba(0,180,255,0.12)", color: "var(--cyan)", border: "1px solid var(--cyan)", padding: "8px 16px", fontSize: 12 }}>
                        ↓ Export CSV
                    </button>
                    <button className="btn" onClick={handlePrintPDF} disabled={history.length === 0}
                        style={{ background: "rgba(0,229,160,0.12)", color: "var(--green)", border: "1px solid var(--green)", padding: "8px 16px", fontSize: 12 }}>
                        🖨 Print PDF
                    </button>
                    <button className="btn" onClick={handleClear}
                        style={{ background: "rgba(255,64,96,0.15)", color: "var(--red)", border: "1px solid var(--red)", padding: "8px 16px", fontSize: 12 }}>
                        Clear All
                    </button>
                </div>
            </div>

            {/* Add new row form */}
            {addingNew && (
                <div style={{ background: "var(--surface)", border: "1px solid var(--cyan)", borderRadius: 12, padding: 16, marginBottom: 16, display: "grid", gridTemplateColumns: "1fr 1fr 80px 80px 1fr auto auto", gap: 8, alignItems: "center" }}>
                    <input style={inp} placeholder="Team A name" value={newDraft.teamAName} onChange={(e) => setNewDraft({ ...newDraft, teamAName: e.target.value })} />
                    <input style={inp} placeholder="Team B name" value={newDraft.teamBName} onChange={(e) => setNewDraft({ ...newDraft, teamBName: e.target.value })} />
                    <input style={inp} type="number" placeholder="A score" value={newDraft.teamAScore} onChange={(e) => setNewDraft({ ...newDraft, teamAScore: +e.target.value })} />
                    <input style={inp} type="number" placeholder="B score" value={newDraft.teamBScore} onChange={(e) => setNewDraft({ ...newDraft, teamBScore: +e.target.value })} />
                    <input style={inp} placeholder="Period" value={newDraft.period} onChange={(e) => setNewDraft({ ...newDraft, period: e.target.value })} />
                    <button className="btn" onClick={handleAdd} disabled={saving}
                        style={{ background: "var(--cyan)", color: "var(--bg)", padding: "7px 14px", fontSize: 12, fontWeight: 700 }}>Save</button>
                    <button className="btn" onClick={() => setAddingNew(false)}
                        style={{ background: "var(--surface2)", color: "var(--text2)", padding: "7px 12px", fontSize: 12 }}>✕</button>
                </div>
            )}

            {loading && <div style={{ color: "var(--text3)", fontFamily: "'DM Mono', monospace", fontSize: 12 }}>Loading…</div>}
            {!loading && history.length === 0 && (
                <div style={{ color: "var(--text3)", fontFamily: "'DM Mono', monospace", fontSize: 12 }}>
                    No records yet. Scores are recorded each time you hit Publish.
                </div>
            )}
            {!loading && history.length > 0 && (
                <div style={{ background: "var(--surface)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, overflow: "hidden" }}>
                    {/* Header */}
                    <div style={{ display: "grid", gridTemplateColumns: "1.4fr 0.8fr 1fr 1.2fr 1fr 80px", background: "var(--surface2)" }}>
                        {["TIME", "PERIOD", "TEAM A", "SCORE", "TEAM B", ""].map((h, i) => (
                            <div key={i} style={{ ...cell, color: "var(--text3)", fontSize: 11, letterSpacing: "0.15em", fontFamily: "'DM Mono', monospace", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>{h}</div>
                        ))}
                    </div>
                    {history.map((r, i) => {
                        const aWin = r.teamAScore > r.teamBScore;
                        const bWin = r.teamBScore > r.teamAScore;
                        const isEditing = editIdx === i;
                        return (
                            <div key={originalIdx(i)} style={{ display: "grid", gridTemplateColumns: "1.4fr 0.8fr 1fr 1.2fr 1fr 80px", background: isEditing ? "rgba(0,200,150,0.05)" : undefined }}>
                                {isEditing && editDraft ? (<>
                                    <div style={cell}><input style={inp} type="datetime-local" value={new Date(editDraft.timestamp - new Date(editDraft.timestamp).getTimezoneOffset() * 60000).toISOString().slice(0, 16)} onChange={(e) => setEditDraft({ ...editDraft, timestamp: new Date(e.target.value).getTime() })} /></div>
                                    <div style={cell}><input style={inp} value={editDraft.period} onChange={(e) => setEditDraft({ ...editDraft, period: e.target.value })} /></div>
                                    <div style={cell}><input style={inp} value={editDraft.teamAName} onChange={(e) => setEditDraft({ ...editDraft, teamAName: e.target.value })} /></div>
                                    <div style={{ ...cell, display: "flex", gap: 4, alignItems: "center" }}>
                                        <input style={{ ...inp, width: 60 }} type="number" value={editDraft.teamAScore} onChange={(e) => setEditDraft({ ...editDraft, teamAScore: +e.target.value })} />
                                        <span style={{ color: "var(--text3)" }}>–</span>
                                        <input style={{ ...inp, width: 60 }} type="number" value={editDraft.teamBScore} onChange={(e) => setEditDraft({ ...editDraft, teamBScore: +e.target.value })} />
                                    </div>
                                    <div style={cell}><input style={inp} value={editDraft.teamBName} onChange={(e) => setEditDraft({ ...editDraft, teamBName: e.target.value })} /></div>
                                    <div style={{ ...cell, display: "flex", gap: 4 }}>
                                        <button className="btn" onClick={commitEdit} disabled={saving} style={{ background: "var(--cyan)", color: "var(--bg)", padding: "5px 10px", fontSize: 11, fontWeight: 700 }}>✓</button>
                                        <button className="btn" onClick={() => { setEditIdx(null); setEditDraft(null); }} style={{ background: "var(--surface2)", color: "var(--text2)", padding: "5px 8px", fontSize: 11 }}>✕</button>
                                    </div>
                                </>) : (<>
                                    <div style={{ ...cell, color: "var(--text3)", fontSize: 12, fontFamily: "'DM Mono', monospace" }}>
                                        {new Date(r.timestamp).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                                    </div>
                                    <div style={{ ...cell, color: "var(--text2)" }}>{r.period}</div>
                                    <div style={{ ...cell, color: aWin ? "var(--cyan)" : "var(--text2)", fontWeight: aWin ? 700 : 400 }}>{r.teamAName}</div>
                                    <div style={{ ...cell, textAlign: "center" }}>
                                        <span style={{ color: "var(--cyan)", fontSize: 18, fontFamily: "'Bebas Neue', sans-serif" }}>{r.teamAScore}</span>
                                        <span style={{ color: "var(--text3)", margin: "0 6px" }}>–</span>
                                        <span style={{ color: "var(--amber)", fontSize: 18, fontFamily: "'Bebas Neue', sans-serif" }}>{r.teamBScore}</span>
                                    </div>
                                    <div style={{ ...cell, color: bWin ? "var(--amber)" : "var(--text2)", fontWeight: bWin ? 700 : 400 }}>{r.teamBName}</div>
                                    <div style={{ ...cell, display: "flex", gap: 4 }}>
                                        <button className="btn" onClick={() => startEdit(i)} style={{ background: "rgba(255,255,255,0.06)", color: "var(--text2)", padding: "5px 8px", fontSize: 11, border: "1px solid rgba(255,255,255,0.08)" }}>✏️</button>
                                        <button className="btn" onClick={() => handleDelete(i)} style={{ background: "rgba(255,64,96,0.12)", color: "var(--red)", padding: "5px 8px", fontSize: 11, border: "1px solid var(--red)" }}>✕</button>
                                    </div>
                                </>)}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export function ActivityLogPanel() {
    const [log, setLog] = useState<ActivityEntry[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchActivityLog().then((entries) => {
            setLog([...entries].reverse());
            setLoading(false);
        });
    }, []);

    const roleColor = (role: string) => role === "admin" ? "var(--amber)" : "var(--green, #00e5a0)";

    return (
        <div style={{ padding: 24, maxWidth: 900, width: "100%", margin: "0 auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, letterSpacing: "0.1em" }}>ACTIVITY LOG</span>
                <button className="btn" onClick={async () => { if (!confirm("Clear activity log?")) return; await clearActivityLog(); setLog([]); }}
                    style={{ background: "rgba(255,64,96,0.15)", color: "var(--red)", border: "1px solid var(--red)", padding: "8px 16px", fontSize: 12 }}>
                    Clear All
                </button>
            </div>
            {loading && <div style={{ color: "var(--text3)", fontFamily: "'DM Mono', monospace", fontSize: 12 }}>Loading…</div>}
            {!loading && log.length === 0 && <div style={{ color: "var(--text3)", fontFamily: "'DM Mono', monospace", fontSize: 12 }}>No activity yet.</div>}
            {!loading && log.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {log.map((entry, i) => (
                        <div key={i} style={{ background: "var(--surface)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: "12px 16px", display: "grid", gridTemplateColumns: "160px 100px 1fr auto", gap: 12, alignItems: "start" }}>
                            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "var(--text3)" }}>
                                {new Date(entry.timestamp).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                            </span>
                            <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 13, color: roleColor(entry.role), letterSpacing: "0.05em" }}>
                                {entry.username}
                            </span>
                            <div>
                                <div style={{ fontSize: 13, color: "var(--text)", marginBottom: entry.detail ? 4 : 0 }}>{entry.action}</div>
                                {entry.detail && <div style={{ fontSize: 11, color: "var(--text3)", fontFamily: "'DM Mono', monospace" }}>{entry.detail}</div>}
                            </div>
                            {entry.device && (
                                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "var(--text3)", whiteSpace: "nowrap", background: "var(--surface2)", padding: "3px 8px", borderRadius: 6 }}>
                                    {entry.device}{entry.ip ? ` · ${entry.ip}` : ""}
                                </span>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// ── Voice Tracker ─────────────────────────────────────────────────────────────
export interface VoiceStatsLocal { correct: number; wrong: number; pass: number; }

export function VoiceTrackerPanel({ stats }: { stats: VoiceStatsLocal }) {
    const total = stats.correct + stats.wrong + stats.pass;

    const statBox = (label: string, val: number, color: string) => (
        <div style={{ flex: 1, background: "var(--surface)", border: `1px solid ${color}33`, borderRadius: 14, padding: "24px 16px", textAlign: "center" }}>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 48, color, lineHeight: 1 }}>{val}</div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "var(--text3)", marginTop: 6, letterSpacing: "0.15em" }}>{label}</div>
            {total > 0 && <div style={{ fontSize: 12, color, marginTop: 4, opacity: 0.7 }}>{Math.round(val / total * 100)}%</div>}
        </div>
    );

    return (
        <div style={{ padding: 24, maxWidth: 700, width: "100%", margin: "0 auto" }}>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, letterSpacing: "0.1em", marginBottom: 6 }}>🎙️ VOICE TRACKER — ROUND 1</div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "var(--text3)", marginBottom: 20 }}>
                Live from Bella's device · Listening for: <b style={{ color: "var(--cyan)" }}>correct</b> · <b style={{ color: "var(--red)" }}>wrong / incorrect</b> · <b style={{ color: "var(--amber)" }}>pass</b>
            </div>

            <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
                {statBox("CORRECT", stats.correct, "var(--cyan)")}
                {statBox("WRONG", stats.wrong, "var(--red)")}
                {statBox("PASS", stats.pass, "var(--amber)")}
                <div style={{ flex: 1, background: "var(--surface)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: "24px 16px", textAlign: "center" }}>
                    <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 48, color: "var(--text)", lineHeight: 1 }}>{total}</div>
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "var(--text3)", marginTop: 6, letterSpacing: "0.15em" }}>TOTAL</div>
                </div>
            </div>

            <button className="btn" onClick={() => saveVoiceStats({ correct: 0, wrong: 0, pass: 0 })}
                style={{ padding: "10px 24px", fontSize: 13, background: "var(--surface2)", border: "1px solid rgba(255,255,255,0.08)", color: "var(--text3)" }}>
                ↺ Reset Stats
            </button>
        </div>
    );
}
