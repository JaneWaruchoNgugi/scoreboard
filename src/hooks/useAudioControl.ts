import { useCallback, useMemo, useRef, useEffect } from "react";
import CountDown from "../assets/endsound.mp3";
import tenSecondTingSnd from "../assets/ting_sound.mp3";

/**
 * Manages two sound effects used during the countdown timer.
 * Pass `isMuted = true` to suppress all playback (e.g. when timer is paused).
 */
export function useAudioControl(isMuted: boolean) {
    const userInteractedRef = useRef(false);

    const audioInstances = useMemo(
        () => ({
            CountDownSnd: new Audio(CountDown),
            tenSecTingSnd: new Audio(tenSecondTingSnd),
        }),
        []
    );

    // Pre-load and unlock audio on first user interaction
    useEffect(() => {
        Object.values(audioInstances).forEach((audio) => {
            audio.load();
            audio.volume = 0.5;
        });

        const unlockAudio = () => {
            userInteractedRef.current = true;
            const silent = new Audio();
            silent.play().then(() => silent.pause()).catch(() => {});
            document.removeEventListener("click", unlockAudio);
            document.removeEventListener("touchstart", unlockAudio);
            document.removeEventListener("keydown", unlockAudio);
        };

        document.addEventListener("click", unlockAudio);
        document.addEventListener("touchstart", unlockAudio);
        document.addEventListener("keydown", unlockAudio);

        return () => {
            document.removeEventListener("click", unlockAudio);
            document.removeEventListener("touchstart", unlockAudio);
            document.removeEventListener("keydown", unlockAudio);
        };
    }, [audioInstances]);

    const playSound = useCallback(
        (soundKey: keyof typeof audioInstances) => {
            if (isMuted) return;
            const sound = audioInstances[soundKey];
            sound.currentTime = 0;
            const p = sound.play();
            if (p !== undefined) {
                p.catch((err) => {
                    if (err.name === "NotAllowedError") {
                        console.warn("Audio blocked — click the page to enable sound.");
                    } else {
                        console.error("Audio error:", err);
                    }
                });
            }
        },
        [audioInstances, isMuted]
    );

    const pauseAllSounds = useCallback(() => {
        Object.values(audioInstances).forEach((sound) => {
            if (!sound.paused) {
                sound.pause();
                sound.currentTime = 0;
            }
        });
    }, [audioInstances]);

    return { playSound, pauseAllSounds };
}
