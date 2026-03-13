import { useState, useEffect, useRef } from "react";
import type { ScoreboardState } from "../types";
import { useAudioControl } from "./useAudioControl";

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
    const prevRun = useRef(state.timerRunning);
    const prevAt = useRef(state.timerStartedAt);

    // Update muted state when externalMuted changes
    useEffect(() => {
        setIsMuted(!state.timerRunning || externalMuted);
    }, [externalMuted, state.timerRunning]);

    // Reset warning flags when timer restarts
    useEffect(() => {
        const wasRun = prevRun.current;
        const wasAt = prevAt.current;
        prevRun.current = state.timerRunning;
        prevAt.current = state.timerStartedAt;

        if (
            state.timerRunning &&
            (!wasRun || state.timerStartedAt !== wasAt)
        ) {
            w10.current = false;
            wEnd.current = false;
        }
    }, [state.timerRunning, state.timerStartedAt]);

    useEffect(() => setIsMuted(!state.timerRunning || externalMuted), [state.timerRunning, externalMuted]);
    useEffect(() => {
        if (!state.timerRunning) pauseAllSounds();
    }, [state.timerRunning, pauseAllSounds]);

    useEffect(() => {
        if (!state.timerRunning || state.timerStartedAt === null) {
            setRemaining(state.timerDuration);
            return;
        }
        const tick = () => {
            const elapsed =
                (Date.now() - (state.timerStartedAt as number)) / 1000;
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
        return () => clearInterval(id);
    }, [
        state.timerRunning,
        state.timerStartedAt,
        state.timerDuration,
        playSound,
        externalMuted, // Add externalMuted to dependencies
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