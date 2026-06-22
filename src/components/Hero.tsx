import { useEffect, useRef } from 'react';
import { useStore } from '../state/store';
import { greeting, fmtHours, calcStreak, totalGoalH, inWeek, sessionMin } from '../lib/utils';

interface HeroProps {
  weekOffset: number;
}

export default function Hero({ weekOffset }: HeroProps) {
  const { state } = useStore();
  const barRef = useRef<HTMLElement>(null);

  const todayStr = new Date().toDateString();
  const todayMin = state.sessions
    .filter((s) => new Date(s.date).toDateString() === todayStr)
    .reduce((a, s) => a + sessionMin(s), 0);

  const weekMin = state.sessions
    .filter((s) => inWeek(s.date, weekOffset))
    .reduce((a, s) => a + sessionMin(s), 0);

  const goalH = totalGoalH(state.categories);
  const goalPct = goalH > 0 ? Math.min(Math.round((weekMin / 60 / goalH) * 100), 999) : 0;

  const streak = calcStreak(state.sessions);

  useEffect(() => {
    if (barRef.current) {
      barRef.current.style.width = `${Math.min(goalPct, 100)}%`;
    }
  }, [goalPct]);

  return (
    <div className="hero">
      <div className="hero-bg" aria-hidden="true" />
      <div className="hero-inner">
        <div className="hero-lede">
          <h1>{greeting()}</h1>
        </div>
        <div className="hero-stats">
          <div className="hstat">
            <span className="hlab">Today</span>
            <span className="hval">{fmtHours(todayMin)}</span>
          </div>
          <div className="hdiv" />
          <div className="hstat">
            <span className="hlab">This week</span>
            <span className="hval">{fmtHours(weekMin)}</span>
          </div>
          <div className="hdiv" />
          <div className="hstat">
            <span className="hlab">Weekly goal</span>
            <span className="hval">{goalPct}%</span>
            <div className="hbar">
              <i ref={barRef} />
            </div>
          </div>
          <div className="hdiv" />
          <div className="hstat">
            <span className="hlab">Streak</span>
            <span className="hval">
              {streak}
              <span className="hunit"> {streak === 1 ? 'day' : 'days'}</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
