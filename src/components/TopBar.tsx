import { useStore } from '../state/store';
import { calcStreak } from '../lib/utils';

interface TopBarProps {
  weekOffset: number;
  weekLabel: string;
  onShiftWeek: (dir: number) => void;
  onShowAbout: () => void;
  onExport: () => void;
  onImportClick: () => void;
  onOpenSettings: () => void;
}

export default function TopBar({
  weekOffset,
  weekLabel,
  onShiftWeek,
  onShowAbout,
  onExport,
  onImportClick,
  onOpenSettings,
}: TopBarProps) {
  const { state } = useStore();
  const streak = calcStreak(state.sessions);

  return (
    <div className="topbar">
      {/* Left: streak, export, import */}
      <div className="tb-left">
        <div className={`streak-badge${streak === 0 ? ' zero' : ''}`} title="Current study streak">
          <svg viewBox="0 0 24 24" fill="var(--flame)" aria-hidden="true">
            <path d="M12 2.5C9 6 7 8.5 7 12a5 5 0 0 0 10 0c0-1.7-.7-3.2-1.8-4.5.1 1.3-.7 2.3-1.7 2.4C14.3 7.6 13.4 4.9 12 2.5Z" />
          </svg>
          <span>{streak}</span>
        </div>

        <button className="icon-btn" onClick={onExport} title="Export backup">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            width="17"
            height="17"
          >
            <path d="M12 3v12" />
            <path d="m7 10 5 5 5-5" />
            <path d="M5 21h14" />
          </svg>
        </button>

        <button className="icon-btn" onClick={onImportClick} title="Import backup">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            width="17"
            height="17"
          >
            <path d="M12 15V3" />
            <path d="m7 8 5-5 5 5" />
            <path d="M5 21h14" />
          </svg>
        </button>
      </div>

      {/* Center: brand */}
      <div className="tb-center">
        <svg className="brand-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <rect
            x="3.5"
            y="3.5"
            width="17"
            height="17"
            rx="4.5"
            stroke="currentColor"
            strokeWidth="1.8"
          />
          <path
            d="M8 12.2L10.8 15L16.5 9"
            stroke="currentColor"
            strokeWidth="1.9"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span className="wordmark">STrack</span>
      </div>

      {/* Right: about, theme, week nav */}
      <div className="tb-right">
        <button className="about-btn" onClick={onShowAbout}>
          About
        </button>

        <button className="icon-btn" onClick={onOpenSettings} title="Settings">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            width="17"
            height="17"
          >
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </button>

        <div className="pill">
          <button onClick={() => onShiftWeek(-1)} aria-label="Previous week">
            &#8249;
          </button>
          <span className="lab">{weekLabel}</span>
          <button
            onClick={() => onShiftWeek(1)}
            disabled={weekOffset >= 0}
            aria-label="Next week"
            style={{ opacity: weekOffset >= 0 ? 0.35 : 1 }}
          >
            &#8250;
          </button>
        </div>
      </div>
    </div>
  );
}
