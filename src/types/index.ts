// ─── Shared domain types ────────────────────────────────────────────────────

export interface Team {
    name: string;
    score: number;
}

export interface QuestionEntry {
    id: string;
    q: string;
    a: string;
}

export interface Category {
    id: string;
    name: string;
    color: string;
    borderColor: string;
    used: boolean;
    question: string;
    answer: string;
    questionBank: QuestionEntry[];
}

export interface ScoreboardState {
    teamA: Team;
    teamB: Team;
    period: string;
    clock: string;
    lastUpdated: number | null;
    timerDuration: number;
    timerStartedAt: number | null;
    timerRunning: boolean;
    timerRound: number;
    timerElapsed: number;
    categories: Category[];
    activeCategory: string | null;
    showAnswer: boolean;
}

export type ConnectionStatus = "connecting" | "live" | "offline";
export type TeamSide = "A" | "B";
