import { useState } from 'react';
import { useStore } from '../state/store';
import { sessionMin, fmtMins } from '../lib/utils';

interface WeekChartProps {
  weekOffset: number;
  onOpenInsights: () => void;
}

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function WeekChart({ weekOffset, onOpenInsights }: WeekChartProps) {
  const { state } = useStore();
  const [selDay, setSelDay] = useState<number | null>(null);

  const today = new Date();

  function getWeekDays(): Date[] {
    const ws = new Date(today);
    ws.setDate(ws.getDate() - ws.getDay() + weekOffset * 7);
    ws.setHours(0, 0, 0, 0);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(ws);
      d.setDate(d.getDate() + i);
      return d;
    });
  }

  const days = getWeekDays();

  const dayMins: number[] = days.map((d) => {
    const dStr = d.toDateString();
    return state.sessions
      .filter((s) => new Date(s.date).toDateString() === dStr)
      .reduce((a, s) => a + sessionMin(s), 0);
  });

  const maxMin = Math.max(...dayMins, 1);

  function getSelSessions(dayIdx: number) {
    const d = days[dayIdx];
    if (!d) return [];
    return state.sessions.filter((s) => new Date(s.date).toDateString() === d.toDateString());
  }

  const selSessions = selDay !== null ? getSelSessions(selDay) : [];

  return (
    <div className="card span-full">
      <h2>
        Hours this week
        <button className="insights-btn" onClick={onOpenInsights}>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            width="12"
            height="12"
          >
            <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
          All data
        </button>
      </h2>

      <div className="chart">
        {days.map((d, i) => {
          const mins = dayMins[i];
          const heightPct = (mins / maxMin) * 100;
          const isSel = selDay === i;
          const isToday = d.toDateString() === today.toDateString();
          return (
            <div
              key={i}
              className={`col${isSel ? ' sel' : ''}`}
              onClick={() => setSelDay(isSel ? null : i)}
              title={mins > 0 ? fmtMins(mins) : undefined}
            >
              <div
                className={`colbar${mins > 0 ? ' has' : ''}`}
                style={{ height: `${Math.max(heightPct, mins > 0 ? 8 : 4)}%` }}
              />
              <span className="day" style={{ color: isToday ? 'var(--ink)' : undefined }}>
                {DAY_LABELS[i].slice(0, 1)}
              </span>
            </div>
          );
        })}
      </div>

      {selDay !== null && (
        <div className="chart-detail">
          {selSessions.length === 0 ? (
            <span className="cd-empty">
              No sessions on{' '}
              {days[selDay].toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'short',
                day: 'numeric',
              })}
            </span>
          ) : (
            <>
              <div
                style={{ fontWeight: 600, fontSize: 12, marginBottom: 8, color: 'var(--muted)' }}
              >
                {days[selDay].toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'short',
                  day: 'numeric',
                })}
              </div>
              {selSessions.map((s) => (
                <div key={s.id} className="cd-item">
                  <b>{fmtMins(sessionMin(s))}</b> {s.items.map((i) => i.subject).join(', ')}
                  {s.method && (
                    <span style={{ color: 'var(--muted)', fontSize: 12 }}>
                      {' '}
                      &middot; {s.method}
                    </span>
                  )}
                </div>
              ))}
              <div style={{ marginTop: 6, fontSize: 13, fontWeight: 700, color: 'var(--inkwell)' }}>
                Total: {fmtMins(selSessions.reduce((a, s) => a + sessionMin(s), 0))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
