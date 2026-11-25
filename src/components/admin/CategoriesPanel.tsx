import { useState } from "react";
import { serverNow } from "../../firebase";
import { useAudioControl } from "../../hooks/useAudioControl";
import type { ScoreboardState, Category, QuestionEntry } from "../../types";
import { ControlCard } from "../shared/ControlCard";
export interface CategoryGridProps {
    categories: Category[];
    activeCategory: string | null;
    onSelectCategory: (catId: string) => Promise<void>;
}

export function CategoryGrid({ categories, activeCategory, onSelectCategory }: CategoryGridProps) {
    return (
        <div className="category-grid">
            {categories.map((cat: Category) => {
                const isActive = activeCategory === cat.id;
                return (
                    <button
                        key={cat.id}
                        disabled={cat.used}
                        onClick={() => onSelectCategory(cat.id)}
                        className={`category-grid__item ${cat.used ? 'used' : ''} ${isActive ? 'active' : ''}`}
                        style={{
                            background: cat.used ? "var(--surface3)" : isActive ? cat.color : `${cat.color}44`,
                            borderColor: cat.used ? "#333" : isActive ? cat.borderColor : `${cat.borderColor}66`,
                            color: cat.used ? "var(--text3)" : isActive ? "white" : cat.borderColor,
                            boxShadow: isActive && !cat.used ? `0 0 16px ${cat.color}66` : "none",
                        }}
                    >
                        {cat.used ? "🔒 " : isActive ? "▶ " : ""}
                        {cat.name}
                    </button>
                );
            })}
        </div>
    );
}

export interface ActiveCategoryPanelProps {
    state: ScoreboardState;
    categories: Category[];
    onPushState: (state: ScoreboardState) => Promise<void>;
    pendingQuestion: {
        categoryId: string;
        question: string;
        answer: string;
    } | null;
    setPendingQuestion: React.Dispatch<React.SetStateAction<{
        categoryId: string;
        question: string;
        answer: string;
    } | null>>;
    // onTimerStop: () => Promise<void>;
}


export function ActiveCategoryPanel({
                                 state,
                                 categories,
                                 onPushState,
                                 pendingQuestion,
                                 setPendingQuestion,
                                 // onTimerStop
                             }: ActiveCategoryPanelProps) {
    const activeIdx = categories.findIndex((c: Category) => c.id === state.activeCategory);
    const active = categories[activeIdx];
    const [isMuted, setIsMuted] = useState(true);

    const {  pauseAllSounds } = useAudioControl(isMuted);

    if (!active) return null;

    const updateCat = async (patch: Partial<Category>) => {
        const nc = categories.map((c: Category, i: number) => i === activeIdx ? { ...c, ...patch } : c);
        await onPushState({ ...state, categories: nc, lastUpdated: Date.now() });
    };

    // Add this function to handle question selection with delay
    const handleQuestionSelect = async (question: string, answer: string) => {
        // First, clear any existing pending question to prevent auto-start
        setPendingQuestion(null);


        // Update the question and answer
        await updateCat({ question, answer });

        // Clear any existing answer visibility
        if (state.showAnswer) {
            await onPushState({ ...state, showAnswer: false, lastUpdated: Date.now() });
        }

        // Set pending question for delayed start
        setPendingQuestion({
            categoryId: active.id,
            question,
            answer
        });
    };
    const handleAnswerReveal = async () => {
        setPendingQuestion(null);

        const elapsed = state.timerStartedAt
            ? (serverNow() - state.timerStartedAt) / 1000
            : state.timerElapsed || 0;

        await onPushState({
            ...state,
            timerRunning: false,                     // ✅ stop timer atomically
            timerElapsed: state.timerRunning ? elapsed : state.timerElapsed,
            showAnswer: !state.showAnswer,
            lastUpdated: Date.now(),
        });

        if (state.timerRunning) {
            pauseAllSounds();                        // ✅ mute after save
            setIsMuted(true);
        }
    };

    return (
        <div className="active-category-panel" style={{ background: `${active.color}18`, borderColor: `${active.borderColor}55` }}>
            <div className="active-category-panel__title" style={{ color: active.borderColor }}>
                ▸ {active.name}
            </div>

            {/* Show countdown indicator if question is pending */}
            {pendingQuestion && pendingQuestion.categoryId === active.id && (
                <div className="pending-question-indicator" style={{
                    background: `${active.color}22`,
                    borderColor: active.borderColor,
                    padding: "8px 12px",
                    borderRadius: 6,
                    marginBottom: 12,
                    fontSize: 14,
                    color: active.borderColor,
                    display: "flex",
                    alignItems: "center",
                    gap: 8
                }}>
                    <span className="spinner" style={{
                        width: 16,
                        height: 16,
                        border: `2px solid ${active.borderColor}`,
                        borderTopColor: "transparent",
                        borderRadius: "50%",
                        animation: "spin 1s linear infinite"
                    }} />
                    Question selected — timer starting in 4 seconds...
                </div>
            )}

            {(active.questionBank || []).length > 0 && (
                <QuestionBankList
                    questions={active.questionBank}
                    activeCategory={active}
                    onSelect={handleQuestionSelect}
                    selectedQuestion={active.question}
                    pendingQuestion={pendingQuestion}
                />
            )}

            {(active.questionBank || []).length === 0 && (
                <div className="active-category-panel__empty">
                    No questions in bank — add them in the Question Bank panel.
                </div>
            )}

            <div className="active-category-panel__actions">
                <button
                    className="btn active-category-panel__answer-btn"
                    onClick={handleAnswerReveal}

                    style={{
                        background: state.showAnswer ? `${active.color}55` : "var(--surface3)",
                        borderColor: state.showAnswer ? active.borderColor : "var(--border2)",
                        color: state.showAnswer ? active.borderColor : "var(--text2)",
                    }}
                >
                    {state.showAnswer ? "✓ ANSWER SHOWN" : "REVEAL ANSWER"}
                </button>

                <button
                    className="btn active-category-panel__lock-btn"
                    onClick={async () => {
                        const nc = categories.map((c: Category, i: number) =>
                            i === activeIdx ? { ...c, used: !c.used } : c
                        );
                        await onPushState({
                            ...state,
                            categories: nc,
                            activeCategory: !active.used ? null : state.activeCategory,
                            showAnswer: false,
                            lastUpdated: Date.now()
                        });
                        setPendingQuestion(null);
                    }}
                    style={{
                        background: active.used ? "rgba(0,229,160,0.1)" : "rgba(255,64,96,0.1)",
                        borderColor: active.used ? "var(--green)" : "var(--red)",
                        color: active.used ? "var(--green)" : "var(--red)",
                    }}
                >
                    {active.used ? "🔓 UNLOCK" : "🔒 LOCK USED"}
                </button>
            </div>

            <button
                className="btn active-category-panel__clear"
                onClick={async () => {
                    await onPushState({ ...state, activeCategory: null, showAnswer: false, lastUpdated: Date.now() });
                    setPendingQuestion(null);
                }}
            >
                ✕ CLEAR SELECTION
            </button>
        </div>
    );
}
export interface QuestionBankListProps {
    questions: QuestionEntry[];
    activeCategory: Category;
    onSelect: (q: string, a: string) => void;
    selectedQuestion?: string;
    pendingQuestion: {
        categoryId: string;
        question: string;
        answer: string;
    } | null;
}

export function QuestionBankList({ questions, activeCategory, onSelect, selectedQuestion, pendingQuestion }: QuestionBankListProps) {
    return (
        <div className="question-bank-list">
            <div className="question-bank-list__label">
                PICK FROM BANK ({questions.length})
            </div>
            <div className="question-bank-list__items">
                {questions.map((entry: QuestionEntry, idx: number) => {
                    const isSel = selectedQuestion === entry.q;
                    const isPending = pendingQuestion?.question === entry.q;
                    return (
                        <button
                            key={entry.id}
                            onClick={() => onSelect(entry.q, entry.a)}
                            className={`question-bank-list__item ${isSel ? 'selected' : ''} ${isPending ? 'pending' : ''}`}
                            style={{
                                background: isSel ? `${activeCategory.color}55` : "var(--surface3)",
                                borderColor: isSel ? activeCategory.borderColor : "transparent",
                                opacity: isPending ? 0.7 : 1,
                                cursor: isPending ? "wait" : "pointer"
                            }}
                            disabled={isPending}
                        >
                            <div className="question-bank-list__item-index" style={{ background: isSel ? activeCategory.borderColor : activeCategory.color }}>
                                {isSel ? "✓" : idx + 1}
                            </div>
                            <div className="question-bank-list__item-content">
                                <div className="question-bank-list__item-question">{entry.q}</div>
                                {entry.a && (
                                    <div className="question-bank-list__item-answer" style={{ color: activeCategory.borderColor }}>
                                        → {entry.a}
                                    </div>
                                )}
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

export interface CategoriesCardProps {
    state: ScoreboardState;
    categories: Category[];
    onPushState: (state: ScoreboardState) => Promise<void>;
    pendingQuestion: {
        categoryId: string;
        question: string;
        answer: string;
    } | null;
    setPendingQuestion: React.Dispatch<React.SetStateAction<{
        categoryId: string;
        question: string;
        answer: string;
    } | null>>;
    // onTimerStop: () => Promise<void>;
}

export function CategoriesCard({
                            state,
                            categories,
                            onPushState,
                            pendingQuestion,
                            setPendingQuestion,
                            // onTimerStop
                        }: CategoriesCardProps) {
    return (
        <ControlCard accent="var(--cyan)" title="CATEGORIES">
            <div className="categories-card__content">
                <CategoryGrid
                    categories={categories}
                    activeCategory={state.activeCategory}
                    onSelectCategory={async (catId: string) => {
                        await onPushState({
                            ...state,
                            activeCategory: catId === state.activeCategory ? null : catId,
                            showAnswer: false,
                            lastUpdated: Date.now()
                        });
                    }}
                />

                {state.activeCategory && (
                    <ActiveCategoryPanel
                        state={state}
                        categories={categories}
                        onPushState={onPushState}
                        pendingQuestion={pendingQuestion}
                        setPendingQuestion={setPendingQuestion}
                        // onTimerStop={onTimerStop}
                    />
                )}
            </div>
        </ControlCard>
    );
}
