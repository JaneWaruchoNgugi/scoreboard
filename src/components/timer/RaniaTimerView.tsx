import { useEffect, useState } from "react";
import { AdminTimerView } from "../admin/AdminTimerView";
import "../shared/GlobalStyles.css";
import "../../styles/admin.css";
import { DEFAULT_CATEGORIES, DEFAULT_STATE } from "../../data/categories";
import { mergeCategories, saveState, subscribeToState } from "../../firebase";
import { useAudioControl } from "../../hooks/useAudioControl";
import type { ScoreboardState } from "../../types";

interface Props {
    onBack: () => void;
}

export function RaniaTimerView({ onBack }: Props) {
    const [state, setState] = useState<ScoreboardState>(DEFAULT_STATE);
    const [previewRemaining, setPreviewRemaining] = useState(DEFAULT_STATE.timerDuration);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isMuted, setIsMuted] = useState(true);
    const { pauseAllSounds } = useAudioControl(isMuted);

    useEffect(() => {
        return subscribeToState((data) => {
            if (data) {
                setState({
                    ...DEFAULT_STATE,
                    ...data,
                    categories: data.categories ? mergeCategories(data.categories) : DEFAULT_CATEGORIES,
                });
            }
            setIsLoading(false);
        });
    }, []);

    useEffect(() => {
        setIsMuted(!state.timerRunning);
    }, [state.timerRunning]);

    useEffect(() => {
        if (!state.timerRunning || state.timerStartedAt === null) {
            setPreviewRemaining(
                state.timerStartedAt !== null && !state.timerRunning
                    ? Math.max(0, state.timerDuration - (state.timerElapsed || 0))
                    : state.timerDuration
            );
            return;
        }

        const tick = () => {
            const elapsed = (Date.now() - state.timerStartedAt!) / 1000;
            setPreviewRemaining(Math.max(0, state.timerDuration - elapsed));
        };

        tick();
        const id = setInterval(tick, 250);
        return () => clearInterval(id);
    }, [state.timerDuration, state.timerElapsed, state.timerRunning, state.timerStartedAt]);

    const pushState = async (next: ScoreboardState) => {
        setState(next);
        setError(null);
        try {
            await saveState(next);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to save timer state");
        }
    };

    const handleSelectRound = async (round: number) => {
        pauseAllSounds();
        await pushState({
            ...state,
            timerRound: round,
            timerDuration: round === 1 ? 150 : round === 2 ? 30 : 60,
            timerStartedAt: null,
            timerRunning: false,
            timerElapsed: 0,
            activeCategory: null,
            showAnswer: false,
            lastUpdated: Date.now(),
        });
    };

    const handleSelectDuration = async (duration: number) => {
        pauseAllSounds();
        await pushState({
            ...state,
            timerDuration: duration,
            timerStartedAt: null,
            timerRunning: false,
            timerElapsed: 0,
            lastUpdated: Date.now(),
        });
    };

    const handleTimerStart = async () => {
        setIsMuted(false);
        await pushState(
            state.timerStartedAt && !state.timerRunning
                ? {
                    ...state,
                    timerStartedAt: Date.now() - (state.timerElapsed || 0) * 1000,
                    timerRunning: true,
                    timerElapsed: 0,
                    lastUpdated: Date.now(),
                }
                : {
                    ...state,
                    timerStartedAt: Date.now(),
                    timerRunning: true,
                    timerElapsed: 0,
                    lastUpdated: Date.now(),
                }
        );
    };

    const handleTimerStop = async () => {
        pauseAllSounds();
        setIsMuted(true);
        const elapsed = state.timerStartedAt ? (Date.now() - state.timerStartedAt) / 1000 : 0;

        await pushState({
            ...state,
            timerRunning: false,
            timerElapsed: elapsed,
            lastUpdated: Date.now(),
        });
    };

    const handleTimerReset = async () => {
        if (!confirm("Reset the timer?")) return;
        pauseAllSounds();
        setIsMuted(true);

        await pushState({
            ...state,
            timerStartedAt: null,
            timerRunning: false,
            timerElapsed: 0,
            lastUpdated: Date.now(),
        });
    };

    const previewSecs = Math.ceil(previewRemaining);
    const timerIsWarn = previewSecs <= 10 && previewSecs > 0 && state.timerRunning;
    const timerIsEnd = previewSecs <= 0;
    const countdownCls = timerIsWarn
        ? "timer-preview__countdown timer-preview__countdown--warning"
        : timerIsEnd
            ? "timer-preview__countdown timer-preview__countdown--end"
            : "timer-preview__countdown timer-preview__countdown--normal";

    if (isLoading) {
        return (
            <div className="admin-loading">
                <div className="admin-loading__text">Loading...</div>
            </div>
        );
    }

    return (
        <div className="admin-page">
            <div className="admin-topbar">
                <button className="btn admin-topbar__back" onClick={onBack}>Back</button>
                <div className="admin-topbar__title">OPERATOR Rania</div>
                <div className="admin-topbar__actions">
                    <div className="status-pill status-pill--active">TIMER CONTROL</div>
                </div>
            </div>

            {error && <div className="rania-timer-error">{error}</div>}

            <AdminTimerView
                state={state}
                onSelectRound={handleSelectRound}
                onSelectDuration={handleSelectDuration}
                onTimerStart={handleTimerStart}
                onTimerStop={handleTimerStop}
                onTimerReset={handleTimerReset}
                previewRemaining={previewRemaining}
                timerIsEnd={timerIsEnd}
                countdownCls={countdownCls}
                onFocus={(e) => e.target.select()}
            />
        </div>
    );
}
