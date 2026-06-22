import { useState, useRef, useEffect, useCallback } from 'react';
import { useStore } from '../state/store';
import { pad } from '../lib/utils';
import type { FocusBg, TimerMode, AmbientSound } from '../state/types';

interface FocusTimerProps {
  onLogTime: (minutes: number) => void;
}

const BG_OPTIONS: { value: FocusBg; label: string }[] = [
  { value: 'streaks', label: 'Streaks' },
  { value: 'dots', label: 'Dots' },
  { value: 'rain', label: 'Rain' },
  { value: 'glow', label: 'Glow' },
  { value: 'gradient', label: 'Gradient' },
  { value: 'color', label: 'Solid color' },
  { value: 'custom', label: 'Custom image' },
];

const MODE_OPTIONS: { value: TimerMode; label: string }[] = [
  { value: 'countdown', label: 'Countdown' },
  { value: 'stopwatch', label: 'Stopwatch' },
  { value: 'pomodoro', label: 'Pomodoro' },
];

// Relative luminance of a hex color, used to pick light or dark text over it.
function luminance(hex: string): number {
  const m = hex.replace('#', '');
  if (m.length < 6) return 0.5;
  const r = parseInt(m.slice(0, 2), 16) / 255;
  const g = parseInt(m.slice(2, 4), 16) / 255;
  const b = parseInt(m.slice(4, 6), 16) / 255;
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

// "#rrggbb" to "r,g,b" for use inside rgba() particle colors.
function hexToRgb(hex: string): string {
  const m = hex.replace('#', '');
  if (m.length < 6) return '255,255,255';
  return `${parseInt(m.slice(0, 2), 16)},${parseInt(m.slice(2, 4), 16)},${parseInt(m.slice(4, 6), 16)}`;
}

export default function FocusTimer({ onLogTime }: FocusTimerProps) {
  const { state, dispatch } = useStore();
  const settings = state.settings;
  const [mode, setMode] = useState<TimerMode>('countdown');
  const [mins, setMins] = useState(25);
  const [active, setActive] = useState(false);
  const [donePrompt, setDonePrompt] = useState<{ elapsed: number } | null>(null);
  const [hintOpacity, setHintOpacity] = useState(1);
  const [phaseLabel, setPhaseLabel] = useState('');
  const [paused, setPaused] = useState(false);

  const focusRef = useRef<HTMLDivElement>(null);
  const clockRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const gradRef = useRef<HTMLDivElement>(null);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const animRef = useRef<number | null>(null);
  const bgOnRef = useRef(true);
  const cellsRef = useRef<HTMLElement[]>([]);
  const plainModeRef = useRef(false);
  const particleColorRef = useRef('255,255,255');

  // Timer engine: everything is derived from wall clock timestamps so it stays
  // accurate even if the tab is throttled in the background or the screen sleeps.
  const modeRef = useRef<TimerMode>('countdown');
  const startTsRef = useRef(0); // ms when the current phase started
  const phaseLenRef = useRef(0); // seconds in the current phase (0 = open ended stopwatch)
  const countUpRef = useRef(false); // stopwatch counts up
  const phaseRef = useRef<'focus' | 'break'>('focus');
  const roundRef = useRef(1);
  const roundsRef = useRef(4);
  const focusAccumRef = useRef(0); // completed focus seconds (pomodoro)
  const endedRef = useRef(false);

  // Pause support. We track total paused milliseconds so the wall clock math
  // stays correct: real elapsed = (now - phaseStart) - pausedTime.
  const pausedRef = useRef(false);
  const pauseStartRef = useRef(0);
  const pauseAccumRef = useRef(0);

  // Web Audio (ambient noise + end chime). Created lazily on first start click.
  const audioCtxRef = useRef<AudioContext | null>(null);
  const noiseSrcRef = useRef<AudioBufferSourceNode | null>(null);
  const noiseGainRef = useRef<GainNode | null>(null);

  function bump(delta: number) {
    setMins((m) => Math.max(1, Math.min(300, m + delta)));
  }

  function setBg(v: FocusBg) {
    dispatch({ type: 'SET_FOCUS_BG', payload: v });
  }

  function uploadBg(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const rd = new FileReader();
    rd.onload = () => {
      dispatch({ type: 'SET_FOCUS_CUSTOM', payload: rd.result as string });
      dispatch({ type: 'SET_FOCUS_BG', payload: 'custom' });
    };
    rd.readAsDataURL(f);
    e.target.value = '';
  }

  // Audio

  function ensureCtx(): AudioContext {
    if (!audioCtxRef.current) {
      const Ctor =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      audioCtxRef.current = new Ctor();
    }
    return audioCtxRef.current;
  }

  function makeNoise(ctx: AudioContext, type: AmbientSound): AudioBuffer {
    const len = ctx.sampleRate * 2;
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    if (type === 'white') {
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    } else if (type === 'pink') {
      let b0 = 0,
        b1 = 0,
        b2 = 0,
        b3 = 0,
        b4 = 0,
        b5 = 0,
        b6 = 0;
      for (let i = 0; i < len; i++) {
        const w = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + w * 0.0555179;
        b1 = 0.99332 * b1 + w * 0.0750759;
        b2 = 0.969 * b2 + w * 0.153852;
        b3 = 0.8665 * b3 + w * 0.3104856;
        b4 = 0.55 * b4 + w * 0.5329522;
        b5 = -0.7616 * b5 - w * 0.016898;
        d[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11;
        b6 = w * 0.115926;
      }
    } else {
      let last = 0;
      for (let i = 0; i < len; i++) {
        const w = Math.random() * 2 - 1;
        last = (last + 0.02 * w) / 1.02;
        d[i] = last * 3.5;
      }
    }
    return buf;
  }

  function startAmbient() {
    const type = settings.ambient;
    if (type === 'none') return;
    const ctx = ensureCtx();
    if (ctx.state === 'suspended') ctx.resume();
    const src = ctx.createBufferSource();
    src.buffer = makeNoise(ctx, type);
    src.loop = true;
    const g = ctx.createGain();
    g.gain.value = 0;
    src.connect(g).connect(ctx.destination);
    src.start();
    const target = type === 'brown' ? 0.22 : 0.1;
    g.gain.linearRampToValueAtTime(target, ctx.currentTime + 0.8);
    noiseSrcRef.current = src;
    noiseGainRef.current = g;
  }

  function stopAmbient() {
    const ctx = audioCtxRef.current;
    const src = noiseSrcRef.current;
    const g = noiseGainRef.current;
    if (!ctx || !src) return;
    try {
      if (g) {
        g.gain.cancelScheduledValues(ctx.currentTime);
        g.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.4);
      }
      src.stop(ctx.currentTime + 0.45);
    } catch {
      // already stopped
    }
    noiseSrcRef.current = null;
    noiseGainRef.current = null;
  }

  function playChime() {
    if (!settings.alertSound) return;
    const ctx = ensureCtx();
    if (ctx.state === 'suspended') ctx.resume();
    const t = ctx.currentTime;
    [880, 1320].forEach((f, i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sine';
      o.frequency.value = f;
      o.connect(g).connect(ctx.destination);
      const s = t + i * 0.18;
      g.gain.setValueAtTime(0, s);
      g.gain.linearRampToValueAtTime(0.3, s + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, s + 0.5);
      o.start(s);
      o.stop(s + 0.55);
    });
  }

  function flashAlert() {
    const el = focusRef.current;
    if (!el) return;
    el.classList.remove('flash');
    void el.offsetWidth;
    el.classList.add('flash');
  }

  // Clock building (imperative, like the reference)

  const makeDigit = useCallback((): HTMLDivElement => {
    const d = document.createElement('div');
    d.className = 'digit';
    d.dataset.val = '0';
    d.innerHTML = `<div class="static top"><div class="num">0</div></div><div class="static bottom"><div class="num">0</div></div><div class="fold foldtop"><div class="num">0</div></div><div class="fold foldbottom"><div class="num">0</div></div>`;
    return d;
  }, []);

  const makePlain = useCallback((): HTMLDivElement => {
    const d = document.createElement('div');
    d.className = 'pdigit';
    d.dataset.val = '0';
    d.textContent = '0';
    return d;
  }, []);

  const buildClock = useCallback(() => {
    const c = clockRef.current;
    if (!c) return;
    c.innerHTML = '';
    plainModeRef.current = state.focusTransp;
    c.classList.toggle('transp', state.focusTransp);
    c.classList.toggle('plain', state.focusTransp);

    const make = state.focusTransp ? makePlain : makeDigit;
    const cells: HTMLDivElement[] = [make(), make()];
    c.appendChild(cells[0]);
    c.appendChild(cells[1]);
    const col = document.createElement('div');
    col.className = 'colon';
    col.innerHTML = '<span></span><span></span>';
    c.appendChild(col);
    cells.push(make(), make());
    c.appendChild(cells[2]);
    c.appendChild(cells[3]);
    cellsRef.current = cells;
  }, [state.focusTransp, makeDigit, makePlain]);

  function flipCell(cell: HTMLElement, val: string) {
    if (cell.dataset.val === val) return;
    const ft = cell.querySelector('.foldtop .num') as HTMLElement | null;
    const fb = cell.querySelector('.foldbottom .num') as HTMLElement | null;
    const top = cell.querySelector('.top .num') as HTMLElement | null;
    const bot = cell.querySelector('.bottom .num') as HTMLElement | null;
    if (ft) ft.textContent = cell.dataset.val ?? '0';
    if (fb) fb.textContent = val;
    if (top) top.textContent = val;
    cell.classList.remove('go');
    void cell.offsetWidth;
    cell.classList.add('go');
    cell.dataset.val = val;
    setTimeout(() => {
      if (bot) bot.textContent = val;
    }, 600);
  }

  function plainSet(cell: HTMLElement, val: string) {
    if (cell.dataset.val === val) return;
    cell.classList.add('dip');
    setTimeout(() => {
      cell.textContent = val;
      cell.dataset.val = val;
      cell.classList.remove('dip');
    }, 160);
  }

  function setClock(sec: number) {
    const totalMin = Math.min(99, Math.floor(sec / 60));
    const mm = pad(totalMin);
    const ss = pad(Math.floor(sec % 60));
    const vals = [mm[0], mm[1], ss[0], ss[1]];
    const setter = plainModeRef.current ? plainSet : flipCell;
    cellsRef.current.forEach((cell, i) => setter(cell, vals[i]));
  }

  // Particles

  type ParticleKind = 'streaks' | 'dots' | 'rain';

  function startParticles(kind: ParticleKind) {
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext('2d');
    if (!ctx) return;

    type Particle = {
      x: number;
      y: number;
      vx?: number;
      vy?: number;
      v?: number;
      r?: number;
      len?: number;
      dot?: boolean;
      vertical?: boolean;
    };

    function size() {
      cv!.width = window.innerWidth;
      cv!.height = window.innerHeight;
    }
    size();
    const onResize = () => size();
    window.addEventListener('resize', onResize);

    const particles: Particle[] = [];

    if (kind === 'rain') {
      const cols = Math.round(window.innerWidth / 46);
      for (let i = 0; i < cols; i++) {
        particles.push({
          x: (i + 0.5) * (window.innerWidth / cols),
          y: Math.random() * window.innerHeight,
          v: 1.1 + Math.random() * 0.6,
          len: 26,
          vertical: true,
        });
      }
    } else if (kind === 'dots') {
      const n = Math.round(window.innerWidth / 30);
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2;
        particles.push({
          x: Math.random() * window.innerWidth,
          y: Math.random() * window.innerHeight,
          vx: Math.cos(a) * 0.25,
          vy: Math.sin(a) * 0.25,
          r: 1.6,
          dot: true,
        });
      }
    } else {
      const rows = Math.max(8, Math.round(window.innerHeight / 70));
      for (let i = 0; i < rows; i++) {
        const dir = i % 2 === 0 ? 1 : -1;
        const count = 2 + Math.round(window.innerWidth / 640);
        for (let j = 0; j < count; j++) {
          particles.push({
            x: Math.random() * window.innerWidth,
            y: (i + 0.5) * (window.innerHeight / rows),
            v: 0.42 * dir,
            len: 34,
          });
        }
      }
    }

    let alpha = 1;

    function frame() {
      if (!cv || !ctx) return;
      ctx.clearRect(0, 0, cv.width, cv.height);
      alpha += ((bgOnRef.current ? 1 : 0) - alpha) * 0.07;
      const col = particleColorRef.current;

      for (const p of particles) {
        if (p.dot) {
          p.x! += p.vx!;
          p.y += p.vy!;
          if (p.x! < 0) p.x = cv.width;
          if (p.x! > cv.width) p.x = 0;
          if (p.y < 0) p.y = cv.height;
          if (p.y > cv.height) p.y = 0;
          ctx.fillStyle = `rgba(${col},${0.4 * alpha})`;
          ctx.beginPath();
          ctx.arc(p.x!, p.y, p.r!, 0, 7);
          ctx.fill();
        } else if (p.vertical) {
          p.y += p.v!;
          if (p.y > cv.height + p.len!) p.y = -p.len!;
          ctx.strokeStyle = `rgba(${col},${0.32 * alpha})`;
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x, p.y - p.len!);
          ctx.stroke();
        } else {
          p.x += p.v!;
          if (p.x > cv.width + p.len!) p.x = -p.len!;
          if (p.x < -p.len!) p.x = cv.width + p.len!;
          ctx.strokeStyle = `rgba(${col},${0.42 * alpha})`;
          ctx.lineWidth = 1.6;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x - p.len! * Math.sign(p.v!), p.y);
          ctx.stroke();
        }
      }

      animRef.current = requestAnimationFrame(frame);
    }

    frame();

    return () => {
      window.removeEventListener('resize', onResize);
    };
  }

  // Engine

  // Seconds elapsed in the current phase, excluding any paused time.
  function elapsedSeconds(): number {
    let paused = pauseAccumRef.current;
    if (pausedRef.current) paused += Date.now() - pauseStartRef.current;
    return (Date.now() - startTsRef.current - paused) / 1000;
  }

  // Focus seconds completed so far, used when logging the session.
  function currentFocusSeconds(): number {
    const elapsed = elapsedSeconds();
    if (countUpRef.current) return elapsed;
    if (modeRef.current === 'pomodoro') {
      const cur = phaseRef.current === 'focus' ? Math.min(elapsed, phaseLenRef.current) : 0;
      return focusAccumRef.current + cur;
    }
    return Math.min(elapsed, phaseLenRef.current);
  }

  function togglePause() {
    if (pausedRef.current) {
      // Resume: bank the time spent paused.
      pauseAccumRef.current += Date.now() - pauseStartRef.current;
      pausedRef.current = false;
      setPaused(false);
    } else {
      pauseStartRef.current = Date.now();
      pausedRef.current = true;
      setPaused(true);
    }
  }

  function exitFocus(finished = false) {
    if (timerRef.current) clearInterval(timerRef.current);
    if (animRef.current) cancelAnimationFrame(animRef.current);
    const focusSec = currentFocusSeconds();
    stopAmbient();
    setActive(false);
    bgOnRef.current = true;
    setHintOpacity(1);
    pausedRef.current = false;
    setPaused(false);

    const elapsedMin = Math.round(focusSec / 60);
    if (finished || elapsedMin >= 1) {
      setDonePrompt({ elapsed: elapsedMin });
    }
  }

  function startTimer() {
    modeRef.current = mode;
    endedRef.current = false;
    focusAccumRef.current = 0;
    pausedRef.current = false;
    pauseStartRef.current = 0;
    pauseAccumRef.current = 0;
    setPaused(false);
    bgOnRef.current = true;
    setDonePrompt(null);
    setHintOpacity(1);
    startTsRef.current = Date.now();

    if (mode === 'stopwatch') {
      countUpRef.current = true;
      phaseLenRef.current = 0;
      setPhaseLabel('Stopwatch');
    } else if (mode === 'pomodoro') {
      countUpRef.current = false;
      phaseRef.current = 'focus';
      roundRef.current = 1;
      roundsRef.current = settings.pomodoroRounds;
      phaseLenRef.current = settings.pomodoroFocus * 60;
      setPhaseLabel(`Focus 1/${settings.pomodoroRounds}`);
    } else {
      countUpRef.current = false;
      phaseLenRef.current = Math.max(1, mins) * 60;
      setPhaseLabel('');
    }

    setActive(true);
  }

  useEffect(() => {
    if (!active) return;

    buildClock();
    // Initial reading.
    if (countUpRef.current) setClock(0);
    else setClock(phaseLenRef.current);

    if (glowRef.current) glowRef.current.style.display = 'none';
    if (gradRef.current) gradRef.current.style.display = 'none';
    if (state.focusBg === 'glow' && glowRef.current) glowRef.current.style.display = 'block';
    else if (state.focusBg === 'gradient' && gradRef.current)
      gradRef.current.style.display = 'block';

    let cleanup: (() => void) | undefined;
    if (['streaks', 'dots', 'rain'].includes(state.focusBg)) {
      cleanup = startParticles(state.focusBg as ParticleKind) ?? undefined;
    }

    startAmbient();

    function advancePomodoro() {
      if (phaseRef.current === 'focus') {
        focusAccumRef.current += phaseLenRef.current;
        if (roundRef.current >= roundsRef.current) {
          // All focus rounds done. Finish.
          endedRef.current = true;
          playChime();
          flashAlert();
          if (timerRef.current) clearInterval(timerRef.current);
          setTimeout(() => exitFocus(true), 800);
          return;
        }
        phaseRef.current = 'break';
        phaseLenRef.current = settings.pomodoroBreak * 60;
        startTsRef.current = Date.now();
        pauseAccumRef.current = 0;
        setPhaseLabel(`Break ${roundRef.current}/${roundsRef.current}`);
        playChime();
        flashAlert();
      } else {
        roundRef.current += 1;
        phaseRef.current = 'focus';
        phaseLenRef.current = settings.pomodoroFocus * 60;
        startTsRef.current = Date.now();
        pauseAccumRef.current = 0;
        setPhaseLabel(`Focus ${roundRef.current}/${roundsRef.current}`);
        playChime();
        flashAlert();
      }
    }

    function update() {
      if (endedRef.current || pausedRef.current) return;
      const elapsed = elapsedSeconds();

      if (countUpRef.current) {
        setClock(Math.floor(elapsed));
        return;
      }

      const remaining = phaseLenRef.current - elapsed;
      if (remaining > 0) {
        setClock(Math.ceil(remaining));
        return;
      }

      setClock(0);
      if (modeRef.current === 'pomodoro') {
        advancePomodoro();
      } else {
        // Countdown finished.
        endedRef.current = true;
        playChime();
        flashAlert();
        if (timerRef.current) clearInterval(timerRef.current);
        setTimeout(() => exitFocus(true), 800);
      }
    }

    timerRef.current = setInterval(update, 250);

    const onVis = () => {
      if (!document.hidden) update();
    };
    document.addEventListener('visibilitychange', onVis);

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') exitFocus();
    };
    document.addEventListener('keydown', onKey);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (animRef.current) cancelAnimationFrame(animRef.current);
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('visibilitychange', onVis);
      cleanup?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  function handleOverlayClick(e: React.MouseEvent) {
    const target = e.target as HTMLElement;
    if (target.closest('#fcontrols')) return;
    bgOnRef.current = !bgOnRef.current;
    setHintOpacity(bgOnRef.current ? 1 : 0);
    if (glowRef.current && glowRef.current.style.display === 'block') {
      glowRef.current.style.opacity = bgOnRef.current ? '1' : '0';
    }
    if (gradRef.current && gradRef.current.style.display === 'block') {
      gradRef.current.style.opacity = bgOnRef.current ? '1' : '0';
    }
  }

  function acceptLog() {
    if (!donePrompt) return;
    onLogTime(donePrompt.elapsed);
    setDonePrompt(null);
  }

  // Color scheme for the overlay

  const isDarkTheme = document.documentElement.getAttribute('data-theme') === 'dark';
  const usingImage = state.focusBg === 'custom' && !!state.focusCustom;

  // Base background: a custom color if set, otherwise it follows the theme.
  // It applies to every background type, not only the solid color one.
  const bg = settings.focusColor ?? (isDarkTheme ? '#0B0C0E' : '#E9E5DB');
  // Use the background (or a dark stand in for images) to decide readable text.
  const lightBg = !usingImage && luminance(bg) > 0.55;
  const autoParticle = lightBg ? '43,43,43' : '255,255,255';
  // Optional custom effect color overrides the auto particle color.
  const particle = settings.focusEffectColor ? hexToRgb(settings.focusEffectColor) : autoParticle;

  const scheme = {
    bg,
    ink: lightBg ? '#2B2B2B' : '#ECECE6',
    particle,
    face: lightBg ? '#FAF8F2' : '#1b1e23',
  };
  particleColorRef.current = scheme.particle;

  const focusStyle: React.CSSProperties = usingImage
    ? { backgroundImage: `url(${state.focusCustom})` }
    : { backgroundColor: scheme.bg };
  // CSS custom properties are not in the React.CSSProperties type, so set them
  // through an index signature cast.
  const focusVars = focusStyle as Record<string, string>;
  focusVars['--focus-ink'] = scheme.ink;
  focusVars['--focus-particle'] = scheme.particle;
  focusVars['--clock-face'] = usingImage ? '#1b1e23' : scheme.face;
  focusVars['--clock-ink'] = usingImage ? '#ECECE6' : scheme.ink;

  // Preview text for the pre-start card.
  const previewSec =
    mode === 'pomodoro' ? settings.pomodoroFocus * 60 : mode === 'stopwatch' ? 0 : mins * 60;
  const preview = `${pad(Math.min(99, Math.floor(previewSec / 60)))}:${pad(0)}`;

  return (
    <>
      {/* Pre-start card (always dark inkwell card) */}
      <div className="card timer-card">
        <h2>Focus timer</h2>

        <div className="tmode">
          {MODE_OPTIONS.map((o) => (
            <button
              key={o.value}
              className={mode === o.value ? 'on' : ''}
              onClick={() => setMode(o.value)}
            >
              {o.label}
            </button>
          ))}
        </div>

        <div className="tprev">{preview}</div>

        {mode === 'countdown' && (
          <div className="tset">
            <button onClick={() => bump(-5)}>&#8722;</button>
            <input
              type="number"
              value={mins}
              min={1}
              max={300}
              onChange={(e) => setMins(Math.max(1, Math.min(300, parseInt(e.target.value) || 25)))}
            />
            <span className="lbl">min</span>
            <button onClick={() => bump(5)}>+</button>
          </div>
        )}

        {mode === 'pomodoro' && (
          <div className="tnote">
            {settings.pomodoroFocus} min focus, {settings.pomodoroBreak} min break,{' '}
            {settings.pomodoroRounds} rounds. Change these in Settings.
          </div>
        )}

        {mode === 'stopwatch' && (
          <div className="tnote">
            Counts up from zero. End it when you are done to log the time.
          </div>
        )}

        <div className="bgrow">
          <select value={state.focusBg} onChange={(e) => setBg(e.target.value as FocusBg)}>
            {BG_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <button className="mini" onClick={() => document.getElementById('bgFile')?.click()}>
            Upload
          </button>
          <input
            id="bgFile"
            type="file"
            accept="image/*,image/gif"
            style={{ display: 'none' }}
            onChange={uploadBg}
          />
        </div>

        <label className="chk">
          <input
            type="checkbox"
            checked={state.focusTransp}
            onChange={(e) => dispatch({ type: 'SET_FOCUS_TRANSP', payload: e.target.checked })}
          />
          transparent clock (show background through)
        </label>

        <button className="start-btn" onClick={startTimer}>
          Start focus
        </button>
      </div>

      {/* Full-screen focus overlay */}
      <div
        id="focus"
        ref={focusRef}
        className={active ? 'active' : ''}
        style={focusStyle}
        onClick={handleOverlayClick}
      >
        <canvas
          id="dots"
          ref={canvasRef}
          style={{
            display: ['streaks', 'dots', 'rain'].includes(state.focusBg) ? 'block' : 'none',
          }}
        />
        <div id="glow" ref={glowRef} />
        <div id="grad" ref={gradRef} />

        <div id="fcontrols">
          <button id="fpause" onClick={togglePause}>
            {paused ? 'Resume' : 'Pause'}
          </button>
          <button id="fexit" onClick={() => exitFocus(false)}>
            End
          </button>
        </div>

        {phaseLabel && <div id="fphase">{phaseLabel}</div>}

        <div className="clock" ref={clockRef} />

        <div id="fhint" style={{ opacity: hintOpacity }}>
          {paused ? 'Paused' : 'click anywhere to dim the background · Esc to end'}
        </div>
      </div>

      {/* Done prompt */}
      <div id="donep" className={donePrompt ? 'active' : ''}>
        <span>Focused for {donePrompt?.elapsed ?? 0} min. Log it?</span>
        <button className="yes" onClick={acceptLog}>
          Log it
        </button>
        <button className="no" onClick={() => setDonePrompt(null)}>
          Skip
        </button>
      </div>
    </>
  );
}
