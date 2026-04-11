import { initializeApp } from "firebase/app";
import type { FirebaseApp } from "firebase/app";
import { getDatabase, ref, set, push, onValue, get } from "firebase/database";
import type { Database } from "firebase/database";
import type { ScoreboardState, Category } from "../types";
import { DEFAULT_CATEGORIES } from "../data/categories";

// ─── Config ────────────────────────────────────────────────────────────────
const firebaseConfig = {
    apiKey: "AIzaSyABmnlQj4dew4cVMCOpGrUyQk2Tdw4KRyI",
    authDomain: "scoreboard-9571d.firebaseapp.com",
    databaseURL: "https://scoreboard-9571d-default-rtdb.firebaseio.com",
    projectId: "scoreboard-9571d",
    storageBucket: "scoreboard-9571d.firebasestorage.app",
    messagingSenderId: "374688575278",
    appId: "1:374688575278:web:11061ad820664e300a94bf",
    measurementId: "G-B4BFNW02XG",
};

const app: FirebaseApp = initializeApp(firebaseConfig);
export const db: Database = getDatabase(app);
export const SCORE_REF = "scoreboard/state";

// ─── CRUD ──────────────────────────────────────────────────────────────────

/** Overwrite the full state document in Firebase. */
export async function saveState(state: ScoreboardState): Promise<void> {
    await set(ref(db, SCORE_REF), state);
}

/** One-time fetch of current state (used on admin load). */
export async function fetchState(): Promise<ScoreboardState | null> {
    const snap = await get(ref(db, SCORE_REF));
    return snap.exists() ? (snap.val() as ScoreboardState) : null;
}

/** Real-time listener — returns an unsubscribe function. */
export function subscribeToState(
    callback: (state: ScoreboardState | null) => void
): () => void {
    const unsubscribe = onValue(ref(db, SCORE_REF), (snap) => {
        callback(snap.exists() ? (snap.val() as ScoreboardState) : null);
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

// ─── Merge helper ──────────────────────────────────────────────────────────
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
