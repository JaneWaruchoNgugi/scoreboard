import { useState } from "react";
import type { ScoreboardState, Category, QuestionEntry } from "../../types";
import { DEFAULT_CATEGORIES } from "../../data/categories";
import { ControlCard } from "../shared/ControlCard";

interface Props {
    state: ScoreboardState;
    onSave: (cats: Category[]) => Promise<void>;
}

export function QuestionBankCard({ state, onSave }: Props) {
    const cats = state.categories || DEFAULT_CATEGORIES;
    const [selectedCatId, setSelectedCatId] = useState(cats[0]?.id ?? "");
    const [newQ, setNewQ] = useState("");
    const [newA, setNewA] = useState("");
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editQ, setEditQ] = useState("");
    const [editA, setEditA] = useState("");

    const cat = cats.find((c) => c.id === selectedCatId);

    const addQuestion = async () => {
        if (!newQ.trim() || !cat) return;
        const entry: QuestionEntry = {
            id: `${selectedCatId}_${Date.now()}`,
            q: newQ.trim(),
            a: newA.trim(),
        };
        await onSave(
            cats.map((c) =>
                c.id === selectedCatId
                    ? { ...c, questionBank: [...(c.questionBank || []), entry] }
                    : c
            )
        );
        setNewQ("");
        setNewA("");
    };

    const deleteQuestion = async (qid: string) => {
        if (!cat) return;
        await onSave(
            cats.map((c) =>
                c.id === selectedCatId
                    ? { ...c, questionBank: (c.questionBank || []).filter((q) => q.id !== qid) }
                    : c
            )
        );
    };

    const startEdit = (entry: QuestionEntry) => {
        setEditingId(entry.id);
        setEditQ(entry.q);
        setEditA(entry.a);
    };

    const saveEdit = async () => {
        if (!cat || !editingId || !editQ.trim()) return;
        await onSave(
            cats.map((c) =>
                c.id === selectedCatId
                    ? {
                          ...c,
                          questionBank: (c.questionBank || []).map((q) =>
                              q.id === editingId
                                  ? { ...q, q: editQ.trim(), a: editA.trim() }
                                  : q
                          ),
                      }
                    : c
            )
        );
        setEditingId(null);
    };

    return (
        <ControlCard accent="var(--cyan)" title="QUESTION BANK">
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

                {/* Category tabs */}
                <div style={{ display: "flex", gap: 5 }}>
                    {cats.map((c) => (
                        <button
                            key={c.id}
                            onClick={() => { setSelectedCatId(c.id); setEditingId(null); }}
                            style={{
                                padding: "5px 10px", borderRadius: 7,
                                fontFamily: "'Bebas Neue', sans-serif",
                                fontSize: 12, letterSpacing: "0.07em",
                                cursor: "pointer", transition: "all 0.15s ease",
                                background: selectedCatId === c.id ? c.color : "var(--surface3)",
                                border: `1px solid ${selectedCatId === c.id ? c.borderColor : "transparent"}`,
                                color: selectedCatId === c.id ? "white" : "var(--text3)",
                            }}
                        >
                            {c.name.split(" ")[0]}
                        </button>
                    ))}
                </div>

                {cat && (
                    <>
                        {/* Category header */}
                        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.2em", color: cat.borderColor }}>
                            {cat.name} · {(cat.questionBank || []).length} question{(cat.questionBank || []).length !== 1 ? "s" : ""}
                        </div>

                        {/* Question list */}
                        <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 380, overflowY: "auto", paddingRight: 2 }}>
                            {(cat.questionBank || []).length === 0 && (
                                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "var(--text3)", textAlign: "center", padding: "24px 0", border: "1px dashed var(--border2)", borderRadius: 10 }}>
                                    No questions yet — add one below
                                </div>
                            )}

                            {(cat.questionBank || []).map((entry, idx) => (
                                <div key={entry.id}>
                                    {editingId === entry.id ? (
                                        /* Edit mode */
                                        <div style={{ background: `${cat.color}22`, border: `1px solid ${cat.borderColor}`, borderRadius: 10, padding: 12, display: "flex", flexDirection: "column", gap: 8 }}>
                                            <textarea value={editQ} onChange={(e) => setEditQ(e.target.value)} rows={2} style={{ width: "100%", background: "var(--surface3)", border: `1px solid ${cat.borderColor}66`, borderRadius: 7, padding: "8px 10px", color: "var(--text)", fontFamily: "'DM Sans', sans-serif", fontSize: 13, resize: "vertical", outline: "none" }} />
                                            <input type="text" value={editA} onChange={(e) => setEditA(e.target.value)} placeholder="Answer..." style={{ width: "100%", background: "var(--surface3)", border: `1px solid ${cat.borderColor}66`, borderRadius: 7, padding: "8px 10px", color: "var(--text)", fontFamily: "'DM Mono', monospace", fontSize: 12, outline: "none" }} />
                                            <div style={{ display: "flex", gap: 6 }}>
                                                <button className="btn" onClick={saveEdit} style={{ flex: 1, padding: "8px 0", background: cat.color, color: "white", fontFamily: "'Bebas Neue', sans-serif", fontSize: 12, letterSpacing: "0.1em", borderRadius: 8 }}>SAVE</button>
                                                <button className="btn" onClick={() => setEditingId(null)} style={{ flex: 1, padding: "8px 0", background: "var(--surface3)", color: "var(--text3)", fontFamily: "'Bebas Neue', sans-serif", fontSize: 12, letterSpacing: "0.1em", borderRadius: 8 }}>CANCEL</button>
                                            </div>
                                        </div>
                                    ) : (
                                        /* View mode */
                                        <div className="qb-row" style={{ background: "var(--surface2)", border: `1px solid ${cat.borderColor}18`, borderRadius: 10, padding: "10px 12px", display: "flex", alignItems: "flex-start", gap: 10, transition: "background 0.15s ease" }}>
                                            <div style={{ minWidth: 22, height: 22, borderRadius: "50%", background: cat.color, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Bebas Neue', sans-serif", fontSize: 11, color: "white", flexShrink: 0, marginTop: 2 }}>
                                                {idx + 1}
                                            </div>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "var(--text)", lineHeight: 1.4, marginBottom: 3, wordBreak: "break-word" }}>{entry.q}</div>
                                                {entry.a && <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: cat.borderColor }}>→ {entry.a}</div>}
                                            </div>
                                            <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                                                <button onClick={() => startEdit(entry)} style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--text3)", fontSize: 13, padding: "2px 5px", borderRadius: 4 }} onMouseEnter={(e) => (e.currentTarget.style.color = cat.borderColor)} onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text3)")}>✎</button>
                                                <button onClick={() => deleteQuestion(entry.id)} style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--text3)", fontSize: 13, padding: "2px 5px", borderRadius: 4 }} onMouseEnter={(e) => (e.currentTarget.style.color = "var(--red)")} onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text3)")}>✕</button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Add new question */}
                        <div style={{ borderTop: `1px solid ${cat.borderColor}33`, paddingTop: 14, display: "flex", flexDirection: "column", gap: 8 }}>
                            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.18em", color: cat.borderColor }}>
                                + ADD TO {cat.name}
                            </div>
                            <textarea value={newQ} onChange={(e) => setNewQ(e.target.value)} placeholder="Question text..." rows={2} style={{ width: "100%", background: "var(--surface3)", border: `1px solid ${cat.borderColor}44`, borderRadius: 8, padding: "10px 12px", color: "var(--text)", fontFamily: "'DM Sans', sans-serif", fontSize: 13, resize: "vertical", outline: "none", lineHeight: 1.5 }} />
                            <input type="text" value={newA} onChange={(e) => setNewA(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addQuestion()} placeholder="Answer (optional)..." style={{ width: "100%", background: "var(--surface3)", border: `1px solid ${cat.borderColor}44`, borderRadius: 8, padding: "10px 12px", color: "var(--text)", fontFamily: "'DM Mono', monospace", fontSize: 12, outline: "none" }} />
                            <button className="btn" onClick={addQuestion} disabled={!newQ.trim()} style={{ padding: "11px 0", background: newQ.trim() ? cat.color : "var(--surface3)", color: newQ.trim() ? "white" : "var(--text3)", fontFamily: "'Bebas Neue', sans-serif", fontSize: 14, letterSpacing: "0.1em", borderRadius: 10, border: `1px solid ${newQ.trim() ? cat.borderColor : "transparent"}`, transition: "all 0.2s ease" }}>
                                ADD QUESTION
                            </button>
                        </div>
                    </>
                )}
            </div>
        </ControlCard>
    );
}
