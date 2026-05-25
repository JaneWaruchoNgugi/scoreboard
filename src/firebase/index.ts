import { initializeApp } from "firebase/app";
import type { FirebaseApp } from "firebase/app";
import { getDatabase, ref, set, push, onValue, get } from "firebase/database";
import type { Database } from "firebase/database";
import type { ScoreboardState, Category } from "../types";
import { DEFAULT_CATEGORIES, DEFAULT_STATE } from "../data/categories";

// ─── Config ────────────────────────────────────────────────────────────────
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

const app: FirebaseApp = initializeApp(firebaseConfig);
export const db: Database = getDatabase(app);
export const SCORE_REF = "scoreboard/state";

function isFiniteNumber(value: unknown): value is number {
    return typeof value === "number" && Number.isFinite(value);
}

export function normalizeScoreboardState(state: Partial<ScoreboardState> | null | undefined): ScoreboardState {
    const round = isFiniteNumber(state?.timerRound) ? state.timerRound : DEFAULT_STATE.timerRound;
    const roundDefaults: Record<number, number> = { 1: 150, 2: 30, 3: 60 };

    return {
        ...DEFAULT_STATE,
        ...state,
        teamA: {
            ...DEFAULT_STATE.teamA,
            ...state?.teamA,
        },
        teamB: {
            ...DEFAULT_STATE.teamB,
            ...state?.teamB,
        },
        timerDuration: isFiniteNumber(state?.timerDuration)
            ? state.timerDuration
            : roundDefaults[round] ?? DEFAULT_STATE.timerDuration,
        timerStartedAt: isFiniteNumber(state?.timerStartedAt) ? state.timerStartedAt : null,
        timerRunning: typeof state?.timerRunning === "boolean" ? state.timerRunning : DEFAULT_STATE.timerRunning,
        timerRound: round,
        timerElapsed: isFiniteNumber(state?.timerElapsed) ? state.timerElapsed : DEFAULT_STATE.timerElapsed,
        lastUpdated: isFiniteNumber(state?.lastUpdated) ? state.lastUpdated : null,
        activeCategory: typeof state?.activeCategory === "string" ? state.activeCategory : null,
        showAnswer: typeof state?.showAnswer === "boolean" ? state.showAnswer : DEFAULT_STATE.showAnswer,
        categories: state?.categories ? mergeCategories(state.categories) : DEFAULT_CATEGORIES,
    };
}

// ─── CRUD ──────────────────────────────────────────────────────────────────

/** Overwrite the full state document in Firebase. */
export async function saveState(state: ScoreboardState): Promise<void> {
    await set(ref(db, SCORE_REF), normalizeScoreboardState(state));
}

/** One-time fetch of current state (used on admin load). */
export async function fetchState(): Promise<ScoreboardState | null> {
    const snap = await get(ref(db, SCORE_REF));
    return snap.exists() ? normalizeScoreboardState(snap.val() as Partial<ScoreboardState>) : null;
}

/** Real-time listener — returns an unsubscribe function. */
export function subscribeToState(
    callback: (state: ScoreboardState | null) => void
): () => void {
    const unsubscribe = onValue(ref(db, SCORE_REF), (snap) => {
        callback(snap.exists() ? normalizeScoreboardState(snap.val() as Partial<ScoreboardState>) : null);
    });
    return unsubscribe;
}

// ─── Score History ─────────────────────────────────────────────────────────

export interface ScoreRecord {
    timestamp: number;
    teamAName: string;
    teamBName: string;
    teamAScore: number;
    teamBScore: number;
    period: string;
}

export async function appendScoreRecord(record: ScoreRecord): Promise<void> {
    await push(ref(db, "scoreboard/scoreHistory"), record);
}

export async function fetchScoreHistory(): Promise<ScoreRecord[]> {
    const snap = await get(ref(db, "scoreboard/scoreHistory"));
    if (!snap.exists()) return [];
    const val = snap.val();
    // push() stores as object with auto-keys; set() stores as array — handle both
    return Array.isArray(val) ? val : Object.values(val);
}

export async function clearScoreHistory(): Promise<void> {
    await set(ref(db, "scoreboard/scoreHistory"), []);
}

export async function saveScoreHistory(records: ScoreRecord[]): Promise<void> {
    await set(ref(db, "scoreboard/scoreHistory"), records);
}

// ─── Questions CRUD ────────────────────────────────────────────────────────

export const QUESTIONS_REF = "scoreboard/questions";

export async function saveQuestions(data: unknown): Promise<void> {
    await set(ref(db, QUESTIONS_REF), data);
}

export async function fetchQuestions(): Promise<unknown | null> {
    const snap = await get(ref(db, QUESTIONS_REF));
    return snap.exists() ? snap.val() : null;
}

export function subscribeToQuestions(callback: (data: unknown | null) => void): () => void {
    return onValue(ref(db, QUESTIONS_REF), (snap) => {
        callback(snap.exists() ? snap.val() : null);
    });
}

// ─── Activity Log ──────────────────────────────────────────────────────────

export interface ActivityEntry {
    timestamp: number;
    username: string;
    role: "admin" | "Questions-Entry";
    action: string;
    detail?: string;
    device?: string;
    ip?: string;
}

export function getDeviceName(): string {
    const ua = navigator.userAgent;
    if (/iphone/i.test(ua)) return "iPhone · iOS";
    if (/ipad/i.test(ua)) return "iPad · iOS";
    if (/android/i.test(ua)) {
        const m = ua.match(/Android[^;]*;\s*([^)]+)\)/);
        const model = m ? m[1].trim() : "Android Device";
        return `${model} · Android`;
    }
    if (/macintosh/i.test(ua)) return "Mac · macOS";
    if (/windows/i.test(ua)) return "PC · Windows";
    if (/linux/i.test(ua)) return "Linux";
    return "Unknown Device";
}

export async function getClientIP(): Promise<string> {
    try {
        const res = await fetch("https://api.ipify.org?format=json");
        const data = await res.json();
        return data.ip ?? "unknown";
    } catch {
        return "unknown";
    }
}

export async function appendActivity(entry: ActivityEntry): Promise<void> {
    await push(ref(db, "scoreboard/activityLog"), entry);
}

export async function fetchActivityLog(): Promise<ActivityEntry[]> {
    const snap = await get(ref(db, "scoreboard/activityLog"));
    if (!snap.exists()) return [];
    const val = snap.val();
    return Array.isArray(val) ? val : Object.values(val);
}

export async function clearActivityLog(): Promise<void> {
    await set(ref(db, "scoreboard/activityLog"), []);
}
/**
 * Merges Firebase-saved categories with DEFAULT_CATEGORIES.
 * Preserves saved question banks; falls back to defaults when missing.
 */
export function mergeCategories(saved: Category[]): Category[] {
    return DEFAULT_CATEGORIES.map((def) => {
        const s = saved.find((c) => c.id === def.id);
        if (!s) return def;
        return {
            ...def,
            ...s,
            questionBank:
                s.questionBank && s.questionBank.length > 0
                    ? s.questionBank
                    : def.questionBank,
        };
    });
}

// ─── Voice Stats ───────────────────────────────────────────────────────────

export interface VoiceStats { correct: number; wrong: number; pass: number; }

export async function saveVoiceStats(stats: VoiceStats): Promise<void> {
    await set(ref(db, "scoreboard/voiceStats"), stats);
}

export function subscribeToVoiceStats(callback: (s: VoiceStats) => void): () => void {
    return onValue(ref(db, "scoreboard/voiceStats"), (snap) => {
        callback(snap.exists() ? snap.val() : { correct: 0, wrong: 0, pass: 0 });
    });
}
