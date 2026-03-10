import {useCallback, useMemo, useRef, useEffect} from "react";
import CountDown from "../assets/endsound.mp3";
import tenSecondTingSnd from "../assets/ting_sound.mp3";

export const useAudioControl = (isMuted: boolean) => {
    const userInteractedRef = useRef(false);

    const audioInstances = useMemo(() => {
        return {
            CountDownSnd: new Audio(CountDown),
            tenSecTingSnd: new Audio(tenSecondTingSnd),
        };
    }, []);

    // Pre-load all audio instances
    useEffect(() => {
        Object.values(audioInstances).forEach(audio => {
            audio.load();
            audio.volume = 0.5; // Set a reasonable volume
        });

        // Listen for user interaction to unlock audio
        const unlockAudio = () => {
            userInteractedRef.current = true;
            // Play and immediately pause a silent sound to unlock audio
            const silentAudio = new Audio();
            silentAudio.play().then(() => {
                silentAudio.pause();
            }).catch(() => {});

            // Remove listeners after first interaction
            document.removeEventListener('click', unlockAudio);
            document.removeEventListener('touchstart', unlockAudio);
            document.removeEventListener('keydown', unlockAudio);
        };

        document.addEventListener('click', unlockAudio);
        document.addEventListener('touchstart', unlockAudio);
        document.addEventListener('keydown', unlockAudio);

        return () => {
            document.removeEventListener('click', unlockAudio);
            document.removeEventListener('touchstart', unlockAudio);
            document.removeEventListener('keydown', unlockAudio);
        };
    }, [audioInstances]);

    const playSound = useCallback(
        (soundKey: keyof typeof audioInstances) => {
            if (isMuted) return;

            const sound = audioInstances[soundKey];

            // Reset the sound to start
            sound.currentTime = 0;

            // Try to play
            const playPromise = sound.play();

            if (playPromise !== undefined) {
                playPromise.catch((err) => {
                    if (err.name === 'NotAllowedError') {
                        console.warn('Audio playback requires user interaction first. Click anywhere on the page to enable sound.');
                    } else {
                        console.error('Audio playback error:', err);
                    }
                });
            }
        },
        [audioInstances, isMuted]
    );

    const pauseAllSounds = useCallback(() => {
        Object.values(audioInstances).forEach(sound => {
            if (!sound.paused) {
                sound.pause();
                sound.currentTime = 0;
            }
        });
    }, [audioInstances]);

    return {playSound, pauseAllSounds};
};