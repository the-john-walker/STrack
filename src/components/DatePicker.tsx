import { useState, useEffect, useRef } from 'react';

interface DatePickerProps {
  value: Date;
  onChange: (d: Date) => void;
}

const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
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

function fmt12(d: Date): string {
  let h = d.getHours();
  const m = String(d.getMinutes()).padStart(2, '0');
  const ap = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${String(h).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}/${d.getFullYear()} ${h}:${m} ${ap}`;
}

export default function DatePicker({ value, onChange }: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const [viewMonth, setViewMonth] = useState(new Date(value.getFullYear(), value.getMonth(), 1));
  const [selDate, setSelDate] = useState(new Date(value));
  const [hour, setHour] = useState(value.getHours() % 12 || 12);
  const [minute, setMinute] = useState(value.getMinutes());
  const [ampm, setAmpm] = useState<'AM' | 'PM'>(value.getHours() >= 12 ? 'PM' : 'AM');
  const popRef = useRef<HTMLDivElement>(null);
  const today = new Date();

  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (popRef.current && !popRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, [open]);

  function buildGrid() {
    const y = viewMonth.getFullYear();
    const m = viewMonth.getMonth();
    const first = new Date(y, m, 1).getDay();
    const last = new Date(y, m + 1, 0).getDate();
    const cells: (number | null)[] = [];
    for (let i = 0; i < first; i++) cells.push(null);
    for (let d = 1; d <= last; d++) cells.push(d);
    return cells;
  }

  function selectDay(d: number) {
    const nd = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), d);
    setSelDate(nd);
  }

  function applyTime(): Date {
    const h24 = ampm === 'PM' ? (hour === 12 ? 12 : hour + 12) : hour === 12 ? 0 : hour;
    const d = new Date(selDate);
    d.setHours(h24, minute, 0, 0);
    return d;
  }

  function done() {
    onChange(applyTime());
    setOpen(false);
  }

  function now() {
    const n = new Date();
    setViewMonth(new Date(n.getFullYear(), n.getMonth(), 1));
    setSelDate(new Date(n));
    setHour(n.getHours() % 12 || 12);
    setMinute(n.getMinutes());
    setAmpm(n.getHours() >= 12 ? 'PM' : 'AM');
  }

  const cells = buildGrid();
  const selKey = `${selDate.getFullYear()}-${selDate.getMonth()}-${selDate.getDate()}`;

  const hours12 = Array.from({ length: 12 }, (_, i) => i + 1);
  const minutes60 = Array.from({ length: 60 }, (_, i) => i);

  return (
    <div className="when-wrap">
      <input
        type="text"
        readOnly
        style={{
          width: '100%',
          background: 'var(--card2)',
          border: '1.5px solid var(--line)',
          borderRadius: 11,
          padding: '11px 13px',
          fontSize: 14,
          color: 'var(--ink)',
          cursor: 'pointer',
        }}
        placeholder="now"
        value={fmt12(value)}
        onClick={() => setOpen((o) => !o)}
      />
      <div className={`when-pop${open ? ' open' : ''}`} ref={popRef}>
        <div className="wp-head">
          <button
            type="button"
            onClick={() => setViewMonth((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))}
          >
            &#8249;
          </button>
          <span>
            {MONTHS[viewMonth.getMonth()]} {viewMonth.getFullYear()}
          </span>
          <button
            type="button"
            onClick={() => {
              const next = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1);
              if (next <= new Date(today.getFullYear(), today.getMonth(), 1)) {
                setViewMonth(next);
              }
            }}
          >
            &#8250;
          </button>
        </div>

        <div className="wp-grid-head">
          {DAYS.map((d) => (
            <span key={d}>{d}</span>
          ))}
        </div>

        <div className="wp-grid">
          {cells.map((day, i) => {
            if (day === null) return <span key={`e${i}`} />;
            const key = `${viewMonth.getFullYear()}-${viewMonth.getMonth()}-${day}`;
            const isFuture = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), day) > today;
            return (
              <button
                key={key}
                type="button"
                className={`wp-day${key === selKey ? ' sel' : ''}`}
                disabled={isFuture}
                onClick={() => selectDay(day)}
              >
                {day}
              </button>
            );
          })}
        </div>

        <div className="wp-time">
          <select value={hour} onChange={(e) => setHour(parseInt(e.target.value))}>
            {hours12.map((h) => (
              <option key={h} value={h}>
                {String(h).padStart(2, '0')}
              </option>
            ))}
          </select>
          <span>:</span>
          <select value={minute} onChange={(e) => setMinute(parseInt(e.target.value))}>
            {minutes60.map((m) => (
              <option key={m} value={m}>
                {String(m).padStart(2, '0')}
              </option>
            ))}
          </select>
          <select value={ampm} onChange={(e) => setAmpm(e.target.value as 'AM' | 'PM')}>
            <option>AM</option>
            <option>PM</option>
          </select>
        </div>

        <div className="wp-btns">
          <button type="button" className="wp-now" onClick={now}>
            Now
          </button>
          <button type="button" className="wp-done" onClick={done}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
