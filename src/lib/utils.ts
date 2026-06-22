import type { Session, Category } from '../state/types';

export function pad(n: number): string {
  return String(n).padStart(2, '0');
}

export function fmtHours(min: number): string {
  return (min / 60).toFixed(1) + 'h';
}

export function fmtMins(min: number): string {
  if (min < 60) return `${min}m`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export function sessionMin(s: Session): number {
  return s.min || s.items.reduce((a, x) => a + (x.minutes ?? 0), 0) || 0;
}

export function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function weekStart(d: Date = new Date()): Date {
  const s = new Date(d);
  const day = s.getDay();
  s.setDate(s.getDate() - day);
  s.setHours(0, 0, 0, 0);
  return s;
}

export function inWeek(dateStr: string, weekOffset = 0): boolean {
  const d = new Date(dateStr);
  const now = new Date();
  const ws = weekStart(now);
  ws.setDate(ws.getDate() + weekOffset * 7);
  const we = new Date(ws);
  we.setDate(we.getDate() + 7);
  return d >= ws && d < we;
}

export function weekLabel(offset: number): string {
  if (offset === 0) return 'This week';
  if (offset === -1) return 'Last week';
  const ws = weekStart(new Date());
  ws.setDate(ws.getDate() + offset * 7);
  const we = new Date(ws);
  we.setDate(we.getDate() + 6);
  const fmt = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return `${fmt(ws)} - ${fmt(we)}`;
}

export function greeting(): string {
  const h = new Date().getHours();
  const p = h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
  return `${p}, good luck with your studies`;
}

export function calcStreak(sessions: Session[]): number {
  if (!sessions.length) return 0;
  const days = new Set(sessions.map((s) => new Date(s.date).toDateString()));
  const today = new Date();
  let streak = 0;
  const check = new Date(today);
  check.setHours(0, 0, 0, 0);
  while (days.has(check.toDateString())) {
    streak++;
    check.setDate(check.getDate() - 1);
  }
  return streak;
}

export function totalGoalH(categories: Category[]): number {
  return categories.reduce((a, c) => a + (c.goalH || 0), 0);
}

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function genId(prefix = 'id'): string {
  return prefix + Date.now() + Math.random().toString(36).slice(2, 6);
}

export function shortDate(dateStr: string): { day: string; mo: string } {
  const d = new Date(dateStr);
  return {
    day: String(d.getDate()),
    mo: d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
  };
}

export function sessionSubjects(s: Session): string {
  if (s.items && s.items.length > 0) {
    return s.items.map((i) => i.subject).join(', ');
  }
  return '';
}

export function heatColor(hours: number, maxHours: number): string {
  if (hours <= 0) return '';
  const ratio = Math.min(hours / Math.max(maxHours, 0.1), 1);
  const STEPS = [
    { bg: '#c8d8f0', border: '#b8cce8' },
    { bg: '#9ab8df', border: '#8aadd8' },
    { bg: '#6c98ce', border: '#5c8dc7' },
    { bg: '#4a78bb', border: '#3a6db0' },
    { bg: '#2a5898', border: '#1e4a88' },
  ];
  const idx = Math.floor(ratio * (STEPS.length - 1));
  return STEPS[idx].bg;
}

export function darkHeatColor(hours: number, maxHours: number): string {
  if (hours <= 0) return '';
  const ratio = Math.min(hours / Math.max(maxHours, 0.1), 1);
  const STEPS = [
    { bg: '#1e3358' },
    { bg: '#2a4870' },
    { bg: '#365e8a' },
    { bg: '#4a78bb' },
    { bg: '#6090d4' },
  ];
  const idx = Math.floor(ratio * (STEPS.length - 1));
  return STEPS[idx].bg;
}
