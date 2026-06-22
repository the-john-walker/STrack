import { useState, useRef } from 'react';
import { useStore } from './state/store';
import { weekLabel } from './lib/utils';
import Landing from './components/Landing';
import TopBar from './components/TopBar';
import Hero from './components/Hero';
import FocusTimer from './components/FocusTimer';
import LogSession from './components/LogSession';
import WeeklyGoals from './components/WeeklyGoals';
import WeekChart from './components/WeekChart';
import MonthHeatmap from './components/MonthHeatmap';
import History from './components/History';
import InsightsModal from './components/InsightsModal';
import SettingsModal from './components/SettingsModal';
import Auth from './components/Auth';

const INTRO_SEEN_KEY = 'strack_intro_seen';

export default function App() {
  const { state, dispatch, configured, session } = useStore();
  const [showLanding, setShowLanding] = useState(() => !localStorage.getItem(INTRO_SEEN_KEY));
  const [weekOffset, setWeekOffset] = useState(0);
  const [prefillMins, setPrefillMins] = useState<number | null>(null);
  const [showInsights, setShowInsights] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const importRef = useRef<HTMLInputElement>(null);

  function enterApp() {
    localStorage.setItem(INTRO_SEEN_KEY, '1');
    setShowLanding(false);
  }

  function showIntro() {
    setShowLanding(true);
  }

  function shiftWeek(dir: number) {
    setWeekOffset((o) => Math.min(0, o + dir));
  }

  function exportData() {
    const data = {
      theme: state.theme,
      categories: state.categories,
      sessions: state.sessions,
      trash: state.trash,
      customSubjects: state.customSubjects,
      customPlans: state.customPlans,
      settings: state.settings,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `strack-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function importClick() {
    importRef.current?.click();
  }

  function importData(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const rd = new FileReader();
    rd.onload = () => {
      try {
        const d = JSON.parse(rd.result as string);
        if (!d.sessions) throw new Error('invalid');
        if (window.confirm('Replace current data with this backup?')) {
          dispatch({ type: 'IMPORT_STATE', payload: d });
        }
      } catch {
        alert('Invalid backup file.');
      }
    };
    rd.readAsText(file);
    e.target.value = '';
  }

  function handleTimerLog(minutes: number) {
    setPrefillMins(minutes);
    setTimeout(() => {
      const logCard = document.querySelector('.card:not(.timer-card)');
      logCard?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  }

  function handleLogged() {
    setPrefillMins(null);
  }

  // When Supabase is set up, the app sits behind a login. Offline mode shows it directly.
  if (configured && !session) {
    return (
      <>
        <Landing show={showLanding} onEnter={enterApp} />
        {!showLanding && <Auth />}
      </>
    );
  }

  return (
    <>
      <Landing show={showLanding} onEnter={enterApp} />

      <div className="wrap" id="app">
        <TopBar
          weekOffset={weekOffset}
          weekLabel={weekLabel(weekOffset)}
          onShiftWeek={shiftWeek}
          onShowAbout={showIntro}
          onExport={exportData}
          onImportClick={importClick}
          onOpenSettings={() => setShowSettings(true)}
        />

        <input
          ref={importRef}
          type="file"
          accept="application/json"
          style={{ display: 'none' }}
          onChange={importData}
        />

        <Hero weekOffset={weekOffset} />

        <div className="grid">
          <FocusTimer onLogTime={handleTimerLog} />
          <LogSession prefillMins={prefillMins} onLogged={handleLogged} />
          <WeeklyGoals weekOffset={weekOffset} />
          <WeekChart weekOffset={weekOffset} onOpenInsights={() => setShowInsights(true)} />
          <MonthHeatmap />
          <History />
        </div>
      </div>

      <InsightsModal show={showInsights} onClose={() => setShowInsights(false)} />
      <SettingsModal show={showSettings} onClose={() => setShowSettings(false)} />
    </>
  );
}
