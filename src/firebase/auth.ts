// ─── Login ─────────────────────────────────────────────────────────────────
// How the login works:
// • The PIN lives in the database at auth/pin. Nobody can read it; only a
//   super admin can change it. It is never in the website code.
// • To log in, a device signs in anonymously with Firebase and writes its
//   name, device and the PIN it typed to auth/sessions/<its id>. The database
//   rules (database.rules.json) reject that write unless the PIN matches.
// • The scoreboard data can only be read or written by a device whose saved
//   PIN still matches. Changing the PIN therefore logs every device out.
// • Super admins sign in with email and password, and are listed at
//   auth/superAdmins/<uid> = true (added by hand in the Firebase console).

import {
    getAuth,
    connectAuthEmulator,
    signInAnonymously,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
} from "firebase/auth";
import type { User } from "firebase/auth";
import { ref, set, get, push, remove, serverTimestamp } from "firebase/database";
import { app, db, getDeviceName, SCORE_REF, USE_EMULATORS } from "./index";

export const auth = getAuth(app);
if (USE_EMULATORS) connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });

export interface LoginRecord {
    name: string;
    device: string;
    at: number;
    uid: string;
}

/** Resolves once Firebase has restored any saved login on this device. */
export function waitForAuth(): Promise<User | null> {
    return new Promise((resolve) => {
        const unsub = onAuthStateChanged(auth, (user) => {
            unsub();
            resolve(user);
        });
    });
}

function isPermissionError(err: unknown): boolean {
    const code = (err as { code?: string })?.code ?? "";
    const msg = err instanceof Error ? err.message : String(err);
    return code.includes("permission") || /permission/i.test(msg);
}

/**
 * True when this device has a valid login for the scoreboard
 * (its saved PIN still matches the current one).
 */
export async function hasValidSession(): Promise<boolean> {
    const user = await waitForAuth();
    if (!user || !user.isAnonymous) return false;
    try {
        await get(ref(db, SCORE_REF));
        return true;
    } catch (err) {
        if (isPermissionError(err)) return false;
        throw err;
    }
}

export type LoginResult = { ok: true; name: string } | { ok: false; reason: "wrong-pin" | "error"; message?: string };

/** Log this device in with a name and the shared PIN. */
export async function loginWithPin(name: string, pin: string): Promise<LoginResult> {
    const cleanName = name.trim().slice(0, 60);
    try {
        // A super admin signed in on this browser must not be reused as a scoreboard login.
        if (auth.currentUser && !auth.currentUser.isAnonymous) await signOut(auth);
        const user = auth.currentUser ?? (await signInAnonymously(auth)).user;
        const device = getDeviceName();
        try {
            await set(ref(db, `auth/sessions/${user.uid}`), {
                pin,
                name: cleanName,
                device,
                at: serverTimestamp(),
            });
        } catch (err) {
            if (isPermissionError(err)) return { ok: false, reason: "wrong-pin" };
            throw err;
        }
        await push(ref(db, "auth/loginLog"), {
            name: cleanName,
            device,
            at: serverTimestamp(),
            uid: user.uid,
        });
        return { ok: true, name: cleanName };
    } catch (err) {
        return { ok: false, reason: "error", message: err instanceof Error ? err.message : String(err) };
    }
}

/** Log this device out of the scoreboard. */
export async function logout(): Promise<void> {
    const user = auth.currentUser;
    if (user?.isAnonymous) {
        try {
            await remove(ref(db, `auth/sessions/${user.uid}`));
        } catch {
            // Already invalid (e.g. PIN changed); nothing to clean up.
        }
    }
    await signOut(auth);
}

// ─── Super admin ───────────────────────────────────────────────────────────

export async function superAdminSignIn(email: string, password: string): Promise<User> {
    const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
    return cred.user;
}

export async function isSuperAdmin(uid: string): Promise<boolean> {
    try {
        const snap = await get(ref(db, `auth/superAdmins/${uid}`));
        return snap.val() === true;
    } catch {
        return false;
    }
}

export async function superAdminSignOut(): Promise<void> {
    await signOut(auth);
}

/** Set the scoreboard PIN. Every logged-in device is logged out. */
export async function setLoginPin(pin: string): Promise<void> {
    await set(ref(db, "auth/pin"), pin);
}

export async function fetchLoginLog(): Promise<LoginRecord[]> {
    const snap = await get(ref(db, "auth/loginLog"));
    if (!snap.exists()) return [];
    return (Object.values(snap.val()) as LoginRecord[]).sort((a, b) => b.at - a.at);
}

export async function clearLoginLog(): Promise<void> {
    await remove(ref(db, "auth/loginLog"));
}

export async function fetchActiveSessions(): Promise<LoginRecord[]> {
    const snap = await get(ref(db, "auth/sessions"));
    if (!snap.exists()) return [];
    const val = snap.val() as Record<string, { name: string; device: string; at: number; pin: string }>;
    return Object.entries(val)
        .map(([uid, s]) => ({ uid, name: s.name, device: s.device, at: s.at }))
        .sort((a, b) => b.at - a.at);
}

/** Log one device out. */
export async function revokeSession(uid: string): Promise<void> {
    await remove(ref(db, `auth/sessions/${uid}`));
}
