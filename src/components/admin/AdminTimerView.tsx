import { useEffect, useState } from "react";
import type { ScoreboardState } from "../../types";
import { ControlCard } from "../shared/ControlCard";

const R1_DURATIONS = [150];
const R2_DURATIONS = [20, 25, 30, 35, 40];
const R3_DURATIONS = [60];

interface Props {
    state: ScoreboardState;
    onSelectRound: (round: number) => void;
    onSelectDuration: (duration: number) => void;
    onTimerStart: () => Promise<void>;
    onTimerStop: () => Promise<void>;
    onTimerReset: () => Promise<void>;
    previewRemaining: number;
    timerIsEnd: boolean;
    countdownCls: string;
    onFocus: (e: React.FocusEvent<HTMLInputElement | null>) => void;
}

export function AdminTimerView({
    state,
    onSelectRound,
    onSelectDuration,
    onTimerStart,
    onTimerStop,
    onTimerReset,
    previewRemaining,
    timerIsEnd,
    countdownCls,
    onFocus,
}: Props) {
    const previewSecs = Math.ceil(previewRemaining);
    const formatTime = (seconds: number) => seconds <= 0 ? "0" : seconds.toString();

    return (
        <div className="admin-timer-view">
            <ControlCard accent="var(--green)" title="ROUND TIMER">
                <div className="timer-card__content">
                    <RoundSelector currentRound={state.timerRound} onSelectRound={onSelectRound} />

                    <DurationSelector
                        round={state.timerRound}
                        currentDuration={state.timerDuration}
                        onSelectDuration={onSelectDuration}
                        onFocus={onFocus}
                        isRunning={state.timerRunning}
                    />

                    <TimerDisplay
                        isRunning={state.timerRunning}
                        hasStarted={state.timerStartedAt !== null}
                        round={state.timerRound}
                        duration={state.timerDuration}
                        remaining={previewSecs}
                        isEnd={timerIsEnd}
                        countdownClass={countdownCls}
                        pausedAt={state.timerStartedAt && !state.timerRunning ? previewSecs : null}
                        formatTime={formatTime}
                    />

                    <TimerControls
                        isRunning={state.timerRunning}
                        hasStarted={state.timerStartedAt !== null}
                        isEnd={timerIsEnd}
                        onStart={onTimerStart}
                        onStop={onTimerStop}
                        onReset={onTimerReset}
                    />
                </div>
            </ControlCard>
        </div>
    );
}

function RoundSelector({ currentRound, onSelectRound }: {
    currentRound: number;
    onSelectRound: (round: number) => void;
}) {
    return (
        <div>
            <label className="field-label">SELECT ROUND</label>
            <div className="round-selector">
                {[1, 2, 3].map((round) => (
                    <button
                        key={round}
                        className={`btn round-btn ${currentRound === round ? "round-btn--active" : "round-btn--idle"}`}
                        onClick={() => onSelectRound(round)}
                    >
                        ROUND {round}
                    </button>
                ))}
            </div>
        </div>
    );
}

function DurationSelector({ round, currentDuration, onSelectDuration, onFocus, isRunning }: {
    round: number;
    currentDuration: number;
    onSelectDuration: (duration: number) => void;
    onFocus: (e: React.FocusEvent<HTMLInputElement | null>) => void;
    isRunning: boolean;
}) {
    const durations = round === 1 ? R1_DURATIONS : round === 2 ? R2_DURATIONS : R3_DURATIONS;
    const [draft, setDraft] = useState(currentDuration.toString());

    useEffect(() => {
        setDraft(currentDuration.toString());
    }, [currentDuration]);

    return (
        <>
            <div>
                <label className="field-label">DURATION - ROUND {round} OPTIONS</label>
                <div className="duration-grid">
                    {durations.map((duration) => (
                        <button
                            key={duration}
                            className={`btn duration-btn ${currentDuration === duration ? "duration-btn--active" : "duration-btn--idle"}`}
                            onClick={() => onSelectDuration(duration)}
                        >
                            {duration}s
                        </button>
                    ))}
                </div>
            </div>

            <div>
                <label className="field-label">CUSTOM DURATION (SECONDS)</label>
                <input
                    type="number"
                    className="duration-input"
                    value={draft}
                    onChange={(e) => {
                        setDraft(e.target.value);
                        const duration = parseInt(e.target.value, 10);
                        if (!isNaN(duration) && duration > 0) onSelectDuration(duration);
                    }}
                    onFocus={onFocus}
                    disabled={isRunning}
                />
            </div>
        </>
    );
}

function TimerDisplay({ isRunning, hasStarted, round, duration, remaining, isEnd, countdownClass, pausedAt, formatTime }: {
    isRunning: boolean;
    hasStarted: boolean;
    round: number;
    duration: number;
    remaining: number;
    isEnd: boolean;
    countdownClass: string;
    pausedAt: number | null;
    formatTime: (seconds: number) => string;
}) {
    return (
        <div className="timer-preview">
            <div>
                <div className="timer-preview__info" style={{ marginBottom: 4, letterSpacing: "0.15em" }}>
                    {isRunning ? "RUNNING" : hasStarted ? "PAUSED" : "READY"}
                </div>
                <div className={countdownClass}>
                    {isEnd ? "0" : formatTime(remaining)}
                    <span className="timer-preview__unit">SEC</span>
                </div>
            </div>
            <div className="timer-preview__meta">
                <div className={`timer-preview__status ${isRunning && !isEnd ? "timer-preview__status--running" : "timer-preview__status--idle"}`}>
                    {isEnd ? "FINISHED" : isRunning ? "RUNNING" : hasStarted ? "PAUSED" : "READY"}
                </div>
                <div className="timer-preview__info">
                    RND {round} - {duration}s
                    {pausedAt !== null && (
                        <span style={{ color: "var(--amber)", marginLeft: 8 }}>
                            (Paused at {formatTime(pausedAt)}s)
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}

function TimerControls({ isRunning, hasStarted, isEnd, onStart, onStop, onReset }: {
    isRunning: boolean;
    hasStarted: boolean;
    isEnd: boolean;
    onStart: () => Promise<void>;
    onStop: () => Promise<void>;
    onReset: () => Promise<void>;
}) {
    return (
        <>
            <div className="timer-controls">
                {!isRunning && hasStarted ? (
                    <button className="btn timer-btn timer-btn--start" onClick={onStart}>
                        RESUME
                    </button>
                ) : (
                    <button
                        className={`btn timer-btn ${isRunning ? "timer-btn--stop" : "timer-btn--start"}`}
                        onClick={isRunning ? onStop : onStart}
                        disabled={isEnd}
                    >
                        {isRunning ? "PAUSE" : "START"}
                    </button>
                )}

                <button className="btn timer-btn timer-btn--reset" onClick={onReset}>
                    RESET
                </button>
            </div>

            <div className="timer-hint">
                {isRunning
                    ? "Timer running - PAUSE to stop"
                    : hasStarted
                        ? "Timer paused at current time - RESET to clear"
                        : "START to begin countdown"}
            </div>
        </>
    );
}
