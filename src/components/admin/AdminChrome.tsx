import type { ScoreboardState } from "../../types";
import { ScoreboardDisplay } from "../shared/ScoreboardDisplay";
export interface TopBarProps {
    onBack: () => void;
    // isMuted: boolean;
    // audioEnabled: boolean;
    // onTestSound: () => void;
}

export function AdminTopBar({ onBack }: TopBarProps) {
    return (
        <div className="admin-topbar">
            <button className="btn admin-topbar__back" onClick={onBack}>← Back</button>
            <div className="admin-topbar__title">OPERATOR Jane</div>
            <div className="admin-topbar__actions">
                {/*<button*/}
                {/*    onClick={onTestSound}*/}
                {/*    className={`sound-btn ${audioEnabled ? "sound-btn--enabled" : "sound-btn--disabled"}`}*/}
                {/*>*/}
                {/*    <span className={`sound-btn__dot ${audioEnabled ? "sound-btn__dot--active" : "sound-btn__dot--inactive"}`} />*/}
                {/*    {audioEnabled ? "SOUND ON" : "CLICK TO TEST SOUND"}*/}
                {/*</button>*/}
                {/*<div className={`status-pill ${isMuted ? "status-pill--muted" : "status-pill--active"}`}>*/}
                {/*    <span className={`status-pill__dot ${isMuted ? "status-pill__dot--muted" : "status-pill__dot--live"}`} />*/}
                {/*    {isMuted ? "SOUND MUTED" : "SOUND ACTIVE"}*/}
                {/*</div>*/}
                <div className="status-pill status-pill--active"> FIREBASE SYNC ACTIVE</div>
            </div>
        </div>
    );
}

export interface TabsProps {
    activeTab: "timer" | "categories" | "teams" | "bank" | "preview" | "history" | "activity" | "voice";
    onTabChange: (tab: "timer" | "categories" | "teams" | "bank" | "preview" | "history" | "activity" | "voice") => void;
}

export function AdminTabs({ activeTab, onTabChange }: TabsProps) {
    const tabs = [
        { id: "preview" as const, icon: "👥", label: "Preview Scores" },
        { id: "timer" as const, icon: "⏱️", label: "TIMER" },
        { id: "teams" as const, icon: "👥", label: "TEAMS" },
        { id: "history" as const, icon: "📊", label: "SCORE HISTORY" },
        { id: "activity" as const, icon: "📋", label: "ACTIVITY LOG" },
        { id: "voice" as const, icon: "🎙️", label: "VOICE TRACKER" },
    ];

    return (
        <div className="admin-tabs">
            {tabs.map((tab) => (
                <button
                    key={tab.id}
                    onClick={() => onTabChange(tab.id)}
                    className={`admin-tab ${activeTab === tab.id ? "admin-tab--active" : ""}`}
                >
                    {tab.icon} {tab.label}
                </button>
            ))}
        </div>
    );
}

export interface PreviewColumnProps {
    state: ScoreboardState;
}

export function PreviewColumn({ state }: PreviewColumnProps) {
    return (
        <div className="preview-col">
            <div className="preview-col__label">LIVE PREVIEW</div>
            <ScoreboardDisplay state={state} showScores={true}/>
            <div className="preview-col__hint">Click PUBLISH to push scores to all viewers instantly</div>
        </div>
    );
}
