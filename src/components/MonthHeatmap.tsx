import { useState } from 'react';
import { useStore } from '../state/store';
import { sessionMin, fmtMins, calcStreak } from '../lib/utils';

const DAY_HEADS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const HEAT_LIGHT = ['#e8e4dc', '#c8d8f0', '#9ab8df', '#6c98ce', '#2a5898'];
const HEAT_DARK = ['#2d323a', '#1e3358', '#2a4870', '#365e8a', '#4a78bb'];

export default function MonthHeatmap() {
  const { state } = useStore();
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selDay, setSelDay] = useState<number | null>(null);

  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

  function navMonth(dir: number) {
    let m = month + dir;
    let y = year;
    if (m < 0) {
      m = 11;
      y--;
    }
    if (m > 11) {
      m = 0;
      y++;
    }
    if (y > today.getFullYear() || (y === today.getFullYear() && m > today.getMonth())) return;
    setMonth(m);
    setYear(y);
    setSelDay(null);
  }

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const perDay: Record<number, number> = {};
  let monthTotal = 0;
  state.sessions.forEach((s) => {
    const d = new Date(s.date);
    if (d.getFullYear() === year && d.getMonth() === month) {
      const day = d.getDate();
      const mins = sessionMin(s);
      perDay[day] = (perDay[day] ?? 0) + mins;
      monthTotal += mins;
    }
  });

  // The baseline (an average day, default 60 minutes) maps to the middle heat level.
  // Twice the baseline reaches the brightest level, half the baseline the dimmest.
  const baseMin = Math.max(1, state.settings.heatBaseline);

  function getHeatIdx(mins: number): number {
    if (mins <= 0) return 0;
    const idx = Math.round((mins / baseMin) * 2);
    return Math.max(1, Math.min(4, idx));
  }

  function getHeatColor(mins: number): string {
    const palette = isDark ? HEAT_DARK : HEAT_LIGHT;
    return palette[getHeatIdx(mins)];
  }

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const selSessions =
    selDay !== null
      ? state.sessions.filter((s) => {
          const d = new Date(s.date);
          return d.getFullYear() === year && d.getMonth() === month && d.getDate() === selDay;
        })
      : [];

  const streak = calcStreak(state.sessions);

  const prevTotal = (() => {
    let pm = month - 1,
      py = year;
    if (pm < 0) {
      pm = 11;
      py--;
    }
    let t = 0;
    state.sessions.forEach((s) => {
      const d = new Date(s.date);
      if (d.getFullYear() === py && d.getMonth() === pm) t += sessionMin(s);
    });
    return t;
  })();

  const palette = isDark ? HEAT_DARK : HEAT_LIGHT;

  return (
    <div className="card span-full">
      <h2>
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            onClick={() => navMonth(-1)}
            style={{
              background: 'none',
              padding: '2px 6px',
              borderRadius: 6,
              color: 'var(--muted)',
              fontSize: 16,
            }}
          >
            &#8249;
          </button>
          {MONTHS[month]} {year}
          <button
            onClick={() => navMonth(1)}
            disabled={year === today.getFullYear() && month === today.getMonth()}
            style={{
              background: 'none',
              padding: '2px 6px',
              borderRadius: 6,
              color: 'var(--muted)',
              fontSize: 16,
              opacity: year === today.getFullYear() && month === today.getMonth() ? 0.3 : 1,
            }}
          >
            &#8250;
          </button>
        </span>
      </h2>

      <div className="heat-wrap">
        {/* Left: calendar */}
        <div className="heat-cal">
          {/* Day headers */}
          <div className="cal-head">
            {DAY_HEADS.map((d) => (
              <span key={d}>{d}</span>
            ))}
          </div>

          {/* Grid */}
          <div className="cal-grid">
            {cells.map((day, i) => {
              if (day === null) return <span key={`e${i}`} />;
              const mins = perDay[day] ?? 0;
              const isToday =
                year === today.getFullYear() &&
                month === today.getMonth() &&
                day === today.getDate();
              const isSel = selDay === day;
              return (
                <button
                  key={day}
                  className={`cell${isToday ? ' today' : ''}${isSel ? ' sel' : ''}`}
                  style={
                    mins > 0
                      ? {
                          background: getHeatColor(mins),
                          border: '1px solid transparent',
                          color: isDark ? '#e8e8e3' : '#2b2b2b',
                        }
                      : undefined
                  }
                  onClick={() => setSelDay(isSel ? null : day)}
                  title={mins > 0 ? fmtMins(mins) : undefined}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* Heat legend */}
          <div className="cal-legend">
            <span>Less</span>
            <div className="cal-legend-swatches">
              {palette.map((c, i) => (
                <span
                  key={i}
                  className="cal-legend-swatch"
                  style={{ background: c, border: '1px solid var(--line)' }}
                />
              ))}
            </div>
            <span>More</span>
          </div>
        </div>

        {/* Right: stats and detail */}
        <div className="heat-side">
          {/* Monthly totals */}
          <div className="tot">
            <div>
              <div>This month</div>
              <b>{(monthTotal / 60).toFixed(1)}h</b>
            </div>
            <div>
              <div>Last month</div>
              <b>{(prevTotal / 60).toFixed(1)}h</b>
            </div>
          </div>

          {/* Day detail */}
          {selDay !== null && (
            <div className="cal-detail">
              {selSessions.length === 0 ? (
                <span style={{ color: 'var(--muted)' }}>
                  No sessions on {MONTHS[month]} {selDay}
                </span>
              ) : (
                <>
                  <div style={{ fontWeight: 600, marginBottom: 6, fontSize: 13 }}>
                    {MONTHS[month]} {selDay} &middot;{' '}
                    {fmtMins(selSessions.reduce((a, s) => a + sessionMin(s), 0))}
                  </div>
                  {selSessions.map((s) => (
                    <div key={s.id} style={{ padding: '3px 0', fontSize: 13 }}>
                      <b style={{ marginRight: 6 }}>{fmtMins(sessionMin(s))}</b>
                      {s.items.map((i) => i.subject).join(', ')}
                      {s.method && (
                        <span style={{ color: 'var(--muted)', fontSize: 12 }}>
                          {' '}
                          &middot; {s.method}
                        </span>
                      )}
                    </div>
                  ))}
                </>
              )}
            </div>
          )}

          {/* Streak */}
          <div className="streak-line">
            <svg viewBox="0 0 24 24" fill="var(--flame)" width="14" height="14">
              <path d="M12 2.5C9 6 7 8.5 7 12a5 5 0 0 0 10 0c0-1.7-.7-3.2-1.8-4.5.1 1.3-.7 2.3-1.7 2.4C14.3 7.6 13.4 4.9 12 2.5Z" />
            </svg>
            Day streak: <b>{streak}</b>
          </div>
        </div>
      </div>
    </div>
  );
}
