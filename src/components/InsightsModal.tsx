import { useState, useRef, useEffect } from 'react';
import { useStore } from '../state/store';
import { sessionMin, fmtHours, fmtMins, calcStreak } from '../lib/utils';

interface InsightsModalProps {
  show: boolean;
  onClose: () => void;
}

type TrendMode = 'weekly' | 'daily';
type TrendType = 'bars' | 'line';

export default function InsightsModal({ show, onClose }: InsightsModalProps) {
  const { state } = useStore();
  const [trendMode, setTrendMode] = useState<TrendMode>('weekly');
  const [trendType, setTrendType] = useState<TrendType>('bars');
  if (!show) return null;

  const sessions = state.sessions;
  const totalMin = sessions.reduce((a, s) => a + sessionMin(s), 0);
  const streak = calcStreak(sessions);

  function getLast7Days(): { label: string; mins: number }[] {
    const result = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dStr = d.toDateString();
      const mins = sessions
        .filter((s) => new Date(s.date).toDateString() === dStr)
        .reduce((a, s) => a + sessionMin(s), 0);
      result.push({ label: d.toLocaleDateString('en-US', { weekday: 'short' }), mins });
    }
    return result;
  }

  function getWeekdayTotals(): number[] {
    const totals = Array(7).fill(0);
    sessions.forEach((s) => {
      const day = new Date(s.date).getDay();
      totals[day] += sessionMin(s);
    });
    return totals;
  }

  function getLastNWeeks(n: number): { label: string; mins: number }[] {
    const result = [];
    for (let i = n - 1; i >= 0; i--) {
      const ws = new Date();
      ws.setDate(ws.getDate() - ws.getDay() - i * 7);
      ws.setHours(0, 0, 0, 0);
      const we = new Date(ws);
      we.setDate(we.getDate() + 7);
      const mins = sessions
        .filter((s) => {
          const d = new Date(s.date);
          return d >= ws && d < we;
        })
        .reduce((a, s) => a + sessionMin(s), 0);
      result.push({
        label: ws.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        mins,
      });
    }
    return result;
  }

  const last7 = getLast7Days();
  const maxLast7 = Math.max(...last7.map((d) => d.mins), 1);
  const bestDayIdx7 = last7.reduce((bi, d, i, arr) => (d.mins > arr[bi].mins ? i : bi), 0);

  const wdTotals = getWeekdayTotals();
  const maxWd = Math.max(...wdTotals, 1);
  const bestWdIdx = wdTotals.reduce((bi, v, i, arr) => (v > arr[bi] ? i : bi), 0);

  const avgPerDay =
    sessions.length > 0
      ? (() => {
          const days = new Set(sessions.map((s) => new Date(s.date).toDateString()));
          return totalMin / days.size;
        })()
      : 0;

  const longestSession = sessions.reduce((max, s) => Math.max(max, sessionMin(s)), 0);

  const catMap: Record<string, number> = {};
  sessions.forEach((s) => {
    s.items.forEach((item) => {
      const cat = state.categories.find((c) => c.id === item.catId);
      const name = cat?.name ?? 'Other';
      catMap[name] =
        (catMap[name] ?? 0) + (item.minutes ?? sessionMin(s) / Math.max(1, s.items.length));
    });
  });

  const subjMap: Record<string, number> = {};
  sessions.forEach((s) => {
    s.items.forEach((item) => {
      subjMap[item.subject] =
        (subjMap[item.subject] ?? 0) +
        (item.minutes ?? sessionMin(s) / Math.max(1, s.items.length));
    });
  });

  const methodMap: Record<string, number> = {};
  sessions.forEach((s) => {
    if (s.method) methodMap[s.method] = (methodMap[s.method] ?? 0) + sessionMin(s);
  });

  const topCats = Object.entries(catMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);
  const topSubjs = Object.entries(subjMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);
  const topMethods = Object.entries(methodMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);
  const maxCat = topCats[0]?.[1] ?? 1;
  const maxSubj = topSubjs[0]?.[1] ?? 1;
  const maxMethod = topMethods[0]?.[1] ?? 1;

  const trendData = trendMode === 'daily' ? getLast7Days() : getLastNWeeks(8);
  const maxTrend = Math.max(...trendData.map((d) => d.mins), 1);

  return (
    <div
      className="modal show"
      onClick={(e) => {
        if ((e.target as HTMLElement).classList.contains('modal')) onClose();
      }}
    >
      <div className="mbox wide">
        <div className="iv-head">
          <h3>All data</h3>
          <button className="iv-x" onClick={onClose}>
            &#215;
          </button>
        </div>

        {sessions.length === 0 ? (
          <p style={{ color: 'var(--muted)', fontSize: 14 }}>
            Log some sessions to see your insights here.
          </p>
        ) : (
          <>
            {/* Stat cards */}
            <div className="iv-masonry">
              {/* Total time */}
              <div className="iv-card">
                <div className="iv-ico">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="9" />
                    <path d="M12 7v5l3 3" />
                  </svg>
                </div>
                <div className="iv-clab">Total time</div>
                <div className="iv-cval">
                  {(totalMin / 60).toFixed(1)}
                  <small>h</small>
                </div>
                <div className="iv-spark">
                  {last7.map((d, i) => (
                    <i
                      key={i}
                      className={i === bestDayIdx7 ? 'hi' : ''}
                      style={{ height: `${Math.max((d.mins / maxLast7) * 100, 4)}%` }}
                    />
                  ))}
                </div>
              </div>

              {/* Sessions */}
              <div className="iv-card">
                <div className="iv-ico">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <path d="M14 2v6h6" />
                  </svg>
                </div>
                <div className="iv-clab">Sessions</div>
                <div className="iv-cval">{sessions.length}</div>
              </div>

              {/* Day streak */}
              <div className="iv-card">
                <div className="iv-ico">
                  <svg viewBox="0 0 24 24" fill="var(--flame)">
                    <path d="M12 2.5C9 6 7 8.5 7 12a5 5 0 0 0 10 0c0-1.7-.7-3.2-1.8-4.5.1 1.3-.7 2.3-1.7 2.4C14.3 7.6 13.4 4.9 12 2.5Z" />
                  </svg>
                </div>
                <div className="iv-clab">Day streak</div>
                <div className="iv-cval">
                  {streak}
                  <small>days</small>
                </div>
              </div>

              {/* Avg per study day */}
              <div className="iv-card">
                <div className="iv-ico">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 3v18h18" />
                    <path d="m7 14 3-4 3 3 4-6" />
                  </svg>
                </div>
                <div className="iv-clab">Avg per day</div>
                <div className="iv-cval">
                  {(avgPerDay / 60).toFixed(1)}
                  <small>h</small>
                </div>
                <div className="iv-wd">
                  {wdTotals.map((v, i) => (
                    <i
                      key={i}
                      className={i === bestWdIdx ? 'best' : ''}
                      style={{ height: `${Math.max((v / maxWd) * 100, 4)}%` }}
                    />
                  ))}
                </div>
              </div>

              {/* Longest session */}
              <div className="iv-card">
                <div className="iv-ico">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="9" />
                    <path d="M12 7v5l2.5 1.5" />
                  </svg>
                </div>
                <div className="iv-clab">Longest session</div>
                <div className="iv-cval">{fmtMins(longestSession)}</div>
              </div>

              {/* Study days */}
              <div className="iv-card">
                <div className="iv-ico">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" />
                    <path d="M16 2v4M8 2v4M3 10h18" />
                  </svg>
                </div>
                <div className="iv-clab">Study days</div>
                <div className="iv-cval">
                  {new Set(sessions.map((s) => new Date(s.date).toDateString())).size}
                </div>
              </div>
            </div>

            {/* Activity trend */}
            <div>
              <div className="iv-sechead">
                <h4
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '.6px',
                    color: 'var(--muted)',
                  }}
                >
                  Activity
                </h4>
                <div style={{ display: 'flex', gap: 6 }}>
                  <div className="iv-tg">
                    <button
                      className={trendType === 'bars' ? 'on' : ''}
                      onClick={() => setTrendType('bars')}
                    >
                      Bars
                    </button>
                    <button
                      className={trendType === 'line' ? 'on' : ''}
                      onClick={() => setTrendType('line')}
                    >
                      Line
                    </button>
                  </div>
                  <div className="iv-tg">
                    <button
                      className={trendMode === 'weekly' ? 'on' : ''}
                      onClick={() => setTrendMode('weekly')}
                    >
                      Weekly
                    </button>
                    <button
                      className={trendMode === 'daily' ? 'on' : ''}
                      onClick={() => setTrendMode('daily')}
                    >
                      Daily
                    </button>
                  </div>
                </div>
              </div>

              <TrendChart data={trendData} maxMins={maxTrend} type={trendType} />
            </div>

            {/* Breakdowns */}
            {topCats.length > 0 && (
              <div className="iv-breakdown">
                <h4>By category</h4>
                {topCats.map(([name, mins]) => (
                  <div key={name} className="iv-brow">
                    <span className="iv-bname">{name}</span>
                    <span className="iv-bval">{fmtHours(mins)}</span>
                    <div className="iv-bbar">
                      <i
                        style={{ width: `${(mins / maxCat) * 100}%`, background: 'var(--slate)' }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {topSubjs.length > 0 && (
              <div className="iv-breakdown">
                <h4>Top subjects</h4>
                {topSubjs.map(([name, mins]) => (
                  <div key={name} className="iv-brow">
                    <span className="iv-bname">{name}</span>
                    <span className="iv-bval">{fmtHours(mins)}</span>
                    <div className="iv-bbar">
                      <i
                        style={{ width: `${(mins / maxSubj) * 100}%`, background: 'var(--sage)' }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {topMethods.length > 0 && (
              <div className="iv-breakdown">
                <h4>Top methods</h4>
                {topMethods.map(([name, mins]) => (
                  <div key={name} className="iv-brow">
                    <span className="iv-bname">{name}</span>
                    <span className="iv-bval">{fmtHours(mins)}</span>
                    <div className="iv-bbar">
                      <i
                        style={{
                          width: `${(mins / maxMethod) * 100}%`,
                          background: 'var(--flame)',
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        <button className="mclose" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}

function TrendChart({
  data,
  maxMins,
  type,
}: {
  data: { label: string; mins: number }[];
  maxMins: number;
  type: TrendType;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio ?? 1;
    const W = cv.offsetWidth;
    const H = cv.offsetHeight;
    cv.width = W * dpr;
    cv.height = H * dpr;
    ctx.scale(dpr, dpr);

    const pad = { top: 8, bottom: 28, left: 8, right: 8 };
    const cw = W - pad.left - pad.right;
    const ch = H - pad.top - pad.bottom;

    ctx.clearRect(0, 0, W, H);

    const slateColor =
      getComputedStyle(document.documentElement).getPropertyValue('--slate').trim() || '#5C7FB0';
    const mutedColor =
      getComputedStyle(document.documentElement).getPropertyValue('--muted').trim() || '#83806F';
    const sageColor =
      getComputedStyle(document.documentElement).getPropertyValue('--sage').trim() || '#94AC88';

    const barW = Math.max(4, cw / data.length - 6);
    const spacing = cw / data.length;

    if (type === 'bars') {
      data.forEach((d, i) => {
        const x = pad.left + i * spacing + spacing / 2 - barW / 2;
        const h = maxMins > 0 ? (d.mins / maxMins) * ch : 0;
        const y = pad.top + ch - h;

        const grad = ctx.createLinearGradient(0, pad.top, 0, pad.top + ch);
        grad.addColorStop(0, slateColor);
        grad.addColorStop(1, sageColor);

        ctx.fillStyle =
          d.mins > 0
            ? grad
            : getComputedStyle(document.documentElement).getPropertyValue('--line').trim() ||
              '#C2BEB0';
        ctx.beginPath();
        const r = Math.min(3, barW / 2);
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + barW - r, y);
        ctx.quadraticCurveTo(x + barW, y, x + barW, y + r);
        ctx.lineTo(x + barW, y + h);
        ctx.lineTo(x, y + h);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = mutedColor;
        ctx.font = '9px Montserrat, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(d.label, pad.left + i * spacing + spacing / 2, H - 4);
      });
    } else {
      const pts = data.map((d, i) => ({
        x: pad.left + i * spacing + spacing / 2,
        y: pad.top + ch - (maxMins > 0 ? (d.mins / maxMins) * ch : 0),
      }));

      ctx.strokeStyle = slateColor;
      ctx.lineWidth = 2;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.beginPath();
      pts.forEach((p, i) => {
        if (i === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      });
      ctx.stroke();

      const grad = ctx.createLinearGradient(0, pad.top, 0, pad.top + ch);
      grad.addColorStop(0, slateColor + '44');
      grad.addColorStop(1, slateColor + '00');
      ctx.fillStyle = grad;
      ctx.beginPath();
      pts.forEach((p, i) => {
        if (i === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      });
      ctx.lineTo(pts[pts.length - 1].x, pad.top + ch);
      ctx.lineTo(pts[0].x, pad.top + ch);
      ctx.closePath();
      ctx.fill();

      pts.forEach((p) => {
        ctx.fillStyle = slateColor;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
        ctx.fill();
      });

      data.forEach((d, i) => {
        ctx.fillStyle = mutedColor;
        ctx.font = '9px Montserrat, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(d.label, pts[i].x, H - 4);
      });
    }
  }, [data, maxMins, type]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: '100%', height: 140, marginTop: 10, display: 'block' }}
    />
  );
}
