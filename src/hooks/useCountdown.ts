import { useState, useEffect, useRef } from "react";
import type { ScoreboardState } from "../types";
import { useAudioControl } from "./useAudioControl";
import { serverNow } from "../firebase";

interface UseCountdownReturn {
    remaining: number;   // seconds remaining (float)
    secs: number;        // ceiled integer for display
    isWarning: boolean;  // ≤ 10 s and running
    isEnd: boolean;      // 0 s reached
    progress: number;    // 0–1 for ring fill
    isMuted: boolean;
    setIsMuted: (v: boolean) => void;
    playSound: ReturnType<typeof useAudioControl>["playSound"];
    pauseAllSounds: ReturnType<typeof useAudioControl>["pauseAllSounds"];
}

/** Drives a live countdown from ScoreboardState fields. */
export function useCountdown(state: ScoreboardState, externalMuted: boolean = false): UseCountdownReturn {
    const [remaining, setRemaining] = useState(state.timerDuration);
    const [isMuted, setIsMuted] = useState(!state.timerRunning || externalMuted);
    const { playSound, pauseAllSounds } = useAudioControl(isMuted || externalMuted);

    const w10 = useRef(false);
    const wEnd = useRef(false);

    // Update muted state when timer running or externalMuted changes
    useEffect(() => {
        setIsMuted(!state.timerRunning || externalMuted);
    }, [externalMuted, state.timerRunning]);
    useEffect(() => {
        if (!state.timerRunning) pauseAllSounds();
    }, [state.timerRunning, pauseAllSounds]);

    useEffect(() => {
        if (!state.timerRunning || state.timerStartedAt === null) {
            // Paused timers must show the time that was left, not the full
            // duration, so viewers match the admin screen while paused.
            const pausedRemaining =
                state.timerStartedAt !== null
                    ? Math.max(0, state.timerDuration - (state.timerElapsed || 0))
                    : state.timerDuration;
            setRemaining(pausedRemaining);
            // Re-arm the warning sounds so they play again on the next run
            // (previously they only ever played once per page load).
            w10.current = pausedRemaining <= 10;
            wEnd.current = pausedRemaining <= 3;
            return;
        }
        const tick = () => {
            // Use the shared server clock, not this device's own clock.
            const elapsed =
                (serverNow() - (state.timerStartedAt as number)) / 1000;
            const rem = Math.max(0, state.timerDuration - elapsed);
            setRemaining(rem);

            // Only play sounds if not externally muted
            if (!externalMuted) {
                if (rem <= 10 && rem > 0 && !w10.current) {
                    w10.current = true;
                    playSound("tenSecTingSnd");
                }
                if (rem <= 3 && rem > 0 && !wEnd.current) {
                    wEnd.current = true;
                    playSound("CountDownSnd");
                }
            }
        };
        tick();
        const id = setInterval(tick, 100);
        // Background tabs are throttled; refresh as soon as the tab is visible again.
        const onVisible = () => {
            if (document.visibilityState === "visible") tick();
        };
        document.addEventListener("visibilitychange", onVisible);
        return () => {
            clearInterval(id);
            document.removeEventListener("visibilitychange", onVisible);
        };
    }, [
        state.timerRunning,
        state.timerStartedAt,
        state.timerDuration,
        state.timerElapsed,
        playSound,
        externalMuted,
    ]);

    const secs = Math.ceil(remaining);
    const isWarning = secs <= 10 && secs > 0 && state.timerRunning;
    const isEnd = secs <= 0;
    const progress = Math.max(0, Math.min(1, remaining / state.timerDuration));

    return {
        remaining,
        secs,
        isWarning,
        isEnd,
        progress,
        isMuted: isMuted || externalMuted,
        setIsMuted,
        playSound,
        pauseAllSounds,
    };
}