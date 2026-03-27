import { useState, useEffect } from "react";
import "../shared/GlobalStyles.css";
import { saveQuestions, fetchQuestions } from "../../firebase";
import type { Question, Category, QuestionsData } from "../../hooks/useQuestions";
import { ROUND_1_QUESTIONS, ROUND_2_CATEGORIES, ROUND_3_QUESTIONS } from "../../hooks/useQuestions";

const EMOJI_OPTIONS = [
    "🎭","🌍","🏛️","🔬","⚽","✝️","📖","🎬","📐","🎵","🍎","🚀","🏆","💡","🌿",
    "🦁","🐘","🎨","🧠","🌊","🔥","⚡","🎯","🏅","🌸","🦋","🎲","🧩","🪄","🌙",
];

interface Props { onBack: () => void; }

function EmojiPicker({ value, onChange }: { value: string; onChange: (e: string) => void }) {
    const [open, setOpen] = useState(false);
    return (
        <div style={{ position: "relative" }}>
            <button type="button" onClick={() => setOpen((o) => !o)}
                style={{ fontSize: 22, background: "var(--surface3)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: "6px 10px", cursor: "pointer", minWidth: 52 }}>
                {value || "🎭"}
            </button>
            {open && (
                <div style={{
                    position: "absolute", top: "110%", left: 0, zIndex: 100,
                    background: "var(--surface2)", border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 10, padding: 8, display: "grid", gridTemplateColumns: "repeat(6,1fr)",
                    gap: 4, boxShadow: "0 8px 32px rgba(0,0,0,0.5)", width: 220,
                }}>
                    {EMOJI_OPTIONS.map((e) => (
                        <button key={e} type="button" onClick={() => { onChange(e); setOpen(false); }}
                            style={{
                                fontSize: 20, background: value === e ? "var(--surface3)" : "transparent",
                                border: "none", borderRadius: 6, padding: "4px", cursor: "pointer",
                                outline: value === e ? "2px solid var(--cyan)" : "none",
                            }}>
                            {e}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}


// Also handles "Q: ...\nA: ..." two-line format as fallback.
function parseBulkQA(text: string, startId = 1): Question[] {
    const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
    const questions: Question[] = [];
    let id = startId;
    let i = 0;
    while (i < lines.length) {
        const line = lines[i];
        const qMark = line.lastIndexOf("?");
        if (qMark !== -1) {
            // "Question? Answer" on one line
            const question = line.slice(0, qMark + 1).trim();
            const answer = line.slice(qMark + 1).trim();
            questions.push({ id: id++, question, answer });
            i++;
        } else {
            // Fallback: "Q: ..." / "A: ..." two-line format
            const qLine = line.replace(/^Q\s*\d*[:.)\s]*/i, "").trim();
            const aLine = lines[i + 1]?.replace(/^A\s*[:.)\s]*/i, "").trim() ?? "";
            if (qLine) {
                questions.push({ id: id++, question: qLine, answer: aLine });
                i += aLine ? 2 : 1;
            } else {
                i++;
            }
        }
    }
    return questions;
}

type RoundTab = 1 | 2 | 3;

export function QuestionsEditorView({ onBack }: Props) {
    const [tab, setTab] = useState<RoundTab>(1);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    // Round 1 & 3: list of {question, answer}
    const [r1, setR1] = useState<Question[]>(ROUND_1_QUESTIONS);
    const [r3, setR3] = useState<Question[]>(ROUND_3_QUESTIONS);

    // Round 2: list of categories each with bulk text
    const [r2, setR2] = useState<Category[]>(ROUND_2_CATEGORIES);

    // Bulk paste buffers
    const [r1Bulk, setR1Bulk] = useState("");
    const [r3Bulk, setR3Bulk] = useState("");
    const [r2BulkMap, setR2BulkMap] = useState<Record<number, string>>({});

    // Load from Firebase on mount
    useEffect(() => {
        fetchQuestions().then((raw) => {
            if (!raw) return;
            const d = raw as Partial<QuestionsData>;
            if (d.round1?.length) setR1(d.round1);
            if (d.round2?.length) setR2(d.round2);
            if (d.round3?.length) setR3(d.round3);
        });
    }, []);

    async function handleSave() {
        setSaving(true);
        // Apply any pending bulk pastes
        const finalR1 = r1Bulk.trim() ? parseBulkQA(r1Bulk) : r1;
        const finalR3 = r3Bulk.trim() ? parseBulkQA(r3Bulk) : r3;
        const finalR2 = r2.map((cat) => {
            const bulk = r2BulkMap[cat.id];
            return bulk?.trim()
                ? { ...cat, questions: parseBulkQA(bulk) }
                : cat;
        });
        await saveQuestions({ round1: finalR1, round2: finalR2, round3: finalR3 });
        setR1(finalR1);
        setR3(finalR3);
        setR2(finalR2);
        setR1Bulk("");
        setR3Bulk("");
        setR2BulkMap({});
        setSaving(false);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    }

    function addR2Category() {
        const newId = Math.max(0, ...r2.map((c) => c.id)) + 1;
        setR2([...r2, { id: newId, name: "", emoji: "📝", questions: [] }]);
    }

    function updateR2Cat(id: number, field: "name" | "emoji", val: string) {
        setR2(r2.map((c) => (c.id === id ? { ...c, [field]: val } : c)));
    }

    function removeR2Cat(id: number) {
        setR2(r2.filter((c) => c.id !== id));
    }

    const inputStyle: React.CSSProperties = {
        width: "100%", background: "var(--surface3)", border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 8, padding: "10px 12px", color: "var(--text)",
        fontFamily: "'DM Sans', sans-serif", fontSize: 13, outline: "none",
    };

    const taStyle: React.CSSProperties = {
        ...inputStyle, resize: "vertical", minHeight: 160, lineHeight: 1.6,
        fontFamily: "'DM Mono', monospace", fontSize: 12,
    };

    const label: React.CSSProperties = {
        fontFamily: "'DM Mono', monospace", fontSize: 10,
        letterSpacing: "0.15em", color: "var(--text3)", marginBottom: 6, display: "block",
    };

    return (
        <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", flexDirection: "column" }}>
            {/* Top bar */}
            <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "16px 24px", borderBottom: "1px solid rgba(255,255,255,0.05)",
                background: "var(--surface)", flexWrap: "wrap", gap: 12,
            }}>
                <button className="btn" onClick={onBack}
                    style={{ background: "var(--surface2)", color: "var(--text2)", padding: "9px 18px", fontSize: 13, border: "1px solid rgba(255,255,255,0.06)" }}>
                    ← Back
                </button>
                <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, letterSpacing: "0.1em", color: "var(--text)" }}>
                    QUESTIONS EDITOR
                </span>
                <button className="btn" onClick={handleSave} disabled={saving}
                    style={{ background: saved ? "var(--green)" : "var(--cyan)", color: "var(--bg)", padding: "9px 22px", fontSize: 13, fontWeight: 700 }}>
                    {saving ? "Saving…" : saved ? "✓ Saved" : "Save to DB"}
                </button>
            </div>

            {/* Tabs */}
            <div className="admin-tabs" style={{ padding: "0 24px", background: "var(--surface)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                {([1, 2, 3] as RoundTab[]).map((r) => (
                    <button key={r} className={`admin-tab ${tab === r ? "admin-tab--active" : ""}`} onClick={() => setTab(r)}>
                        Round {r}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div style={{ flex: 1, overflowY: "auto", padding: "24px", maxWidth: 900, width: "100%", margin: "0 auto" }}>

                {/* ── Round 1 ── */}
                {tab === 1 && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                        <div>
                            <span style={label}>BULK PASTE — one question per line: "Question? Answer"</span>
                            <textarea style={taStyle} value={r1Bulk} onChange={(e) => setR1Bulk(e.target.value)}
                                placeholder={"My mothers mother is my? Grand Mother\nWho parted the Red Sea? Moses"} />
                            <span style={{ ...label, marginTop: 6 }}>Paste replaces existing questions on Save. Current count: {r1.length}</span>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                            <span style={label}>CURRENT QUESTIONS (edit inline)</span>
                            {r1.map((q, i) => (
                                <div key={q.id} style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 8, alignItems: "center" }}>
                                    <input style={inputStyle} value={q.question} placeholder="Question"
                                        onChange={(e) => setR1(r1.map((x, j) => j === i ? { ...x, question: e.target.value } : x))} />
                                    <input style={inputStyle} value={q.answer} placeholder="Answer"
                                        onChange={(e) => setR1(r1.map((x, j) => j === i ? { ...x, answer: e.target.value } : x))} />
                                    <button className="btn" onClick={() => setR1(r1.filter((_, j) => j !== i))}
                                        style={{ background: "rgba(255,64,96,0.15)", color: "var(--red)", border: "1px solid var(--red)", padding: "8px 12px", fontSize: 12 }}>✕</button>
                                </div>
                            ))}
                            <button className="btn" onClick={() => setR1([...r1, { id: r1.length + 1, question: "", answer: "" }])}
                                style={{ background: "var(--surface2)", color: "var(--text2)", border: "1px solid rgba(255,255,255,0.08)", padding: "10px", fontSize: 13, marginTop: 4 }}>
                                + Add Question
                            </button>
                        </div>
                    </div>
                )}

                {/* ── Round 2 ── */}
                {tab === 2 && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                        {r2.map((cat) => (
                            <div key={cat.id} style={{ background: "var(--surface)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: 20 }}>
                                <div style={{ display: "flex", gap: 8, marginBottom: 14, alignItems: "center" }}>
                                    <EmojiPicker value={cat.emoji} onChange={(e) => updateR2Cat(cat.id, "emoji", e)} />
                                    <input style={{ ...inputStyle, flex: 1 }} value={cat.name} placeholder="Category name"
                                        onChange={(e) => updateR2Cat(cat.id, "name", e.target.value)} />
                                    <button className="btn" onClick={() => removeR2Cat(cat.id)}
                                        style={{ background: "rgba(255,64,96,0.15)", color: "var(--red)", border: "1px solid var(--red)", padding: "8px 12px", fontSize: 12, flexShrink: 0 }}>✕</button>
                                </div>
                                <span style={label}>BULK PASTE — "Question? Answer" per line. Current: {(cat.questions ?? []).length}</span>
                                <textarea style={taStyle} value={r2BulkMap[cat.id] ?? ""}
                                    onChange={(e) => setR2BulkMap({ ...r2BulkMap, [cat.id]: e.target.value })}
                                    placeholder={"Which is the largest ocean? Pacific Ocean\nWhich continent has the most countries? Africa"} />
                                {/* Inline edit existing */}
                                {(cat.questions ?? []).length > 0 && !r2BulkMap[cat.id] && (
                                    <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 12 }}>
                                        {(cat.questions ?? []).map((q, i) => (
                                            <div key={q.id} style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 8 }}>
                                                <input style={inputStyle} value={q.question} placeholder="Question"
                                                    onChange={(e) => setR2(r2.map((c) => c.id === cat.id
                                                        ? { ...c, questions: (c.questions ?? []).map((x, j) => j === i ? { ...x, question: e.target.value } : x) }
                                                        : c))} />
                                                <input style={inputStyle} value={q.answer} placeholder="Answer"
                                                    onChange={(e) => setR2(r2.map((c) => c.id === cat.id
                                                        ? { ...c, questions: (c.questions ?? []).map((x, j) => j === i ? { ...x, answer: e.target.value } : x) }
                                                        : c))} />
                                                <button className="btn" onClick={() => setR2(r2.map((c) => c.id === cat.id
                                                    ? { ...c, questions: (c.questions ?? []).filter((_, j) => j !== i) } : c))}
                                                    style={{ background: "rgba(255,64,96,0.15)", color: "var(--red)", border: "1px solid var(--red)", padding: "8px 12px", fontSize: 12 }}>✕</button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                <button className="btn" onClick={() => setR2(r2.map((c) => c.id === cat.id
                                    ? { ...c, questions: [...(c.questions ?? []), { id: (c.questions ?? []).length + 1, question: "", answer: "" }] } : c))}
                                    style={{ background: "var(--surface2)", color: "var(--text2)", border: "1px solid rgba(255,255,255,0.08)", padding: "8px 14px", fontSize: 12, marginTop: 10 }}>
                                    + Add Question
                                </button>
                            </div>
                        ))}
                        <button className="btn" onClick={addR2Category}
                            style={{ background: "var(--surface2)", color: "var(--cyan)", border: "1px solid var(--cyan)", padding: "12px", fontSize: 14 }}>
                            + Add Category
                        </button>
                    </div>
                )}

                {/* ── Round 3 ── */}
                {tab === 3 && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                        <div>
                            <span style={label}>BULK PASTE — one question per line: "Question? Answer"</span>
                            <textarea style={taStyle} value={r3Bulk} onChange={(e) => setR3Bulk(e.target.value)}
                                placeholder={"What is the capital of Kenya? Nairobi\nHow many counties does Kenya have? 47"} />
                            <span style={{ ...label, marginTop: 6 }}>Current count: {r3.length}</span>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                            <span style={label}>CURRENT QUESTIONS</span>
                            {r3.map((q, i) => (
                                <div key={q.id} style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 8, alignItems: "center" }}>
                                    <input style={inputStyle} value={q.question} placeholder="Question"
                                        onChange={(e) => setR3(r3.map((x, j) => j === i ? { ...x, question: e.target.value } : x))} />
                                    <input style={inputStyle} value={q.answer} placeholder="Answer"
                                        onChange={(e) => setR3(r3.map((x, j) => j === i ? { ...x, answer: e.target.value } : x))} />
                                    <button className="btn" onClick={() => setR3(r3.filter((_, j) => j !== i))}
                                        style={{ background: "rgba(255,64,96,0.15)", color: "var(--red)", border: "1px solid var(--red)", padding: "8px 12px", fontSize: 12 }}>✕</button>
                                </div>
                            ))}
                            <button className="btn" onClick={() => setR3([...r3, { id: r3.length + 1, question: "", answer: "" }])}
                                style={{ background: "var(--surface2)", color: "var(--text2)", border: "1px solid rgba(255,255,255,0.08)", padding: "10px", fontSize: 13, marginTop: 4 }}>
                                + Add Question
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
