import { createContext, useContext, useReducer, useEffect, useRef, useState, ReactNode } from 'react';
import type { Session as SupabaseSession } from '@supabase/supabase-js';
import type { AppState, AppAction, Theme, Settings, SetupVariant } from './types';
import { BUILTIN_SUBJECTS, DEFAULTS, DEFAULT_SETTINGS, METHODS, STARTER_TEMPLATE } from './defaults';
import { genId } from '../lib/utils';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { loadAll, pushAll, type CloudData } from '../lib/cloud';

const STORAGE_KEY = 'studytracker';

function loadState(): Partial<AppState> | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function persistState(s: AppState): void {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        theme: s.theme,
        focusBg: s.focusBg,
        focusCustom: s.focusCustom,
        focusTransp: s.focusTransp,
        categories: s.categories,
        sessions: s.sessions,
        trash: s.trash,
        customSubjects: s.customSubjects,
        customPlans: s.customPlans,
        methods: s.methods,
        settings: s.settings,
        setupVariants: s.setupVariants,
      }),
    );
  } catch {
    // storage not available
  }
}

const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v));

// Builtin subjects were previously hardcoded in the picker. Fold them into
// customSubjects once for pre Phase 2 saves so those users keep their subjects.
function mergeBuiltins(cs: Record<string, string[]>): Record<string, string[]> {
  const out: Record<string, string[]> = { ...cs };
  for (const [catId, names] of Object.entries(BUILTIN_SUBJECTS)) {
    const merged = [...names];
    for (const n of out[catId] ?? []) if (!merged.includes(n)) merged.push(n);
    out[catId] = merged;
  }
  return out;
}

function initState(): AppState {
  const saved = loadState();

  const base = {
    theme: (saved?.theme ?? 'auto') as Theme,
    focusBg: saved?.focusBg ?? 'streaks',
    focusCustom: saved?.focusCustom ?? null,
    focusTransp: saved?.focusTransp ?? false,
    settings: migrateSettings({ ...DEFAULT_SETTINGS, ...(saved?.settings ?? {}) }),
  } as const;

  if (saved && (saved.categories || saved.sessions)) {
    const legacy = saved.methods === undefined; // saved before methods/subjects moved into state
    return {
      ...base,
      categories: saved.categories ?? [],
      sessions: saved.sessions ?? [],
      trash: saved.trash ?? [],
      customSubjects: legacy ? mergeBuiltins(saved.customSubjects ?? {}) : (saved.customSubjects ?? {}),
      customPlans: saved.customPlans ?? [],
      methods: saved.methods ?? [...METHODS],
      setupVariants: saved.setupVariants ?? [],
    };
  }

  // No saved data. New accounts start blank; offline use gets the old defaults.
  if (isSupabaseConfigured) {
    return {
      ...base,
      categories: [],
      sessions: [],
      trash: [],
      customSubjects: {},
      customPlans: [],
      methods: [],
      setupVariants: [],
    };
  }
  return {
    ...base,
    categories: clone(DEFAULTS),
    sessions: [],
    trash: [],
    customSubjects: clone(BUILTIN_SUBJECTS),
    customPlans: [],
    methods: [...METHODS],
    setupVariants: [],
  };
}

// The heat baseline used to be stored in hours. Small values are almost
// certainly legacy hours, so convert them to minutes.
function migrateSettings(s: Settings): Settings {
  if (s.heatBaseline > 0 && s.heatBaseline <= 10) {
    return { ...s, heatBaseline: Math.round(s.heatBaseline * 60) };
  }
  return s;
}

function reducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_THEME':
      return { ...state, theme: action.payload };
    case 'SET_FOCUS_BG':
      return { ...state, focusBg: action.payload };
    case 'SET_FOCUS_CUSTOM':
      return { ...state, focusCustom: action.payload };
    case 'SET_FOCUS_TRANSP':
      return { ...state, focusTransp: action.payload };
    case 'SET_CATEGORIES':
      return { ...state, categories: action.payload };
    case 'ADD_CATEGORY':
      return { ...state, categories: [...state.categories, action.payload] };
    case 'UPDATE_CATEGORY':
      return {
        ...state,
        categories: state.categories.map((c) => (c.id === action.payload.id ? action.payload : c)),
      };
    case 'DELETE_CATEGORY': {
      const customSubjects = { ...state.customSubjects };
      delete customSubjects[action.payload];
      return {
        ...state,
        categories: state.categories.filter((c) => c.id !== action.payload),
        customSubjects,
      };
    }
    case 'ADD_SESSION':
      return { ...state, sessions: [...state.sessions, action.payload] };
    case 'DELETE_SESSION': {
      const s = state.sessions.find((x) => x.id === action.payload);
      if (!s) return state;
      const trash = [...state.trash, s];
      if (trash.length > 50) trash.shift();
      return { ...state, sessions: state.sessions.filter((x) => x.id !== action.payload), trash };
    }
    case 'RESTORE_SESSION': {
      const s = state.trash.find((x) => x.id === action.payload);
      if (!s) return state;
      return {
        ...state,
        trash: state.trash.filter((x) => x.id !== action.payload),
        sessions: [...state.sessions, s],
      };
    }
    case 'CLEAR_TRASH':
      return { ...state, trash: [] };
    case 'RESTORE_ALL':
      return { ...state, sessions: [...state.sessions, ...state.trash], trash: [] };
    case 'ADD_CUSTOM_SUBJECT': {
      const existing = state.customSubjects[action.payload.catId] ?? [];
      const added = action.payload.subjects.filter((s) => !existing.includes(s));
      return {
        ...state,
        customSubjects: {
          ...state.customSubjects,
          [action.payload.catId]: [...existing, ...added],
        },
      };
    }
    case 'DELETE_SUBJECT': {
      const existing = state.customSubjects[action.payload.catId] ?? [];
      return {
        ...state,
        customSubjects: {
          ...state.customSubjects,
          [action.payload.catId]: existing.filter((n) => n !== action.payload.name),
        },
      };
    }
    case 'ADD_CUSTOM_PLAN':
      return { ...state, customPlans: [...state.customPlans, action.payload] };
    case 'DELETE_CUSTOM_PLAN':
      return { ...state, customPlans: state.customPlans.filter((p) => p.id !== action.payload) };
    case 'ADD_METHOD': {
      const name = action.payload.trim();
      if (!name || state.methods.includes(name)) return state;
      return { ...state, methods: [...state.methods, name] };
    }
    case 'DELETE_METHOD':
      return { ...state, methods: state.methods.filter((m) => m !== action.payload) };
    case 'RENAME_METHOD': {
      const { from, to } = action.payload;
      const name = to.trim();
      if (!name) return state;
      return { ...state, methods: state.methods.map((m) => (m === from ? name : m)) };
    }
    case 'UPDATE_SETTINGS':
      return { ...state, settings: { ...state.settings, ...action.payload } };
    case 'AUTOFILL': {
      const categories = STARTER_TEMPLATE.sectors.map((s) => ({
        id: genId('c'),
        name: s.name,
        goalH: s.goalH,
        color: s.color,
      }));
      const customSubjects: Record<string, string[]> = {};
      categories.forEach((c, i) => {
        const subs = STARTER_TEMPLATE.sectors[i].subjects;
        if (subs.length) customSubjects[c.id] = [...subs];
      });
      const customPlans = STARTER_TEMPLATE.plans.map((p) => ({
        id: genId('p'),
        title: p.title,
        steps: [...p.steps],
      }));
      return {
        ...state,
        categories,
        customSubjects,
        methods: [...STARTER_TEMPLATE.methods],
        customPlans,
      };
    }
    case 'SAVE_VARIANT': {
      const { id, name } = action.payload;
      const variant: SetupVariant = {
        id,
        name,
        categories: clone(state.categories),
        customSubjects: clone(state.customSubjects),
        methods: [...state.methods],
        customPlans: clone(state.customPlans),
      };
      return { ...state, setupVariants: [...state.setupVariants, variant] };
    }
    case 'DELETE_VARIANT':
      return { ...state, setupVariants: state.setupVariants.filter((v) => v.id !== action.payload) };
    case 'LOAD_VARIANT': {
      const v = state.setupVariants.find((x) => x.id === action.payload);
      if (!v) return state;
      return {
        ...state,
        categories: clone(v.categories),
        customSubjects: clone(v.customSubjects),
        methods: [...v.methods],
        customPlans: clone(v.customPlans),
      };
    }
    case 'RESTORE_SETUP': {
      const p = action.payload;
      return {
        ...state,
        categories: p.categories,
        customSubjects: p.customSubjects,
        methods: p.methods,
        customPlans: p.customPlans,
      };
    }
    case 'CLEAR_SETUP':
      return { ...state, categories: [], customSubjects: {}, methods: [], customPlans: [] };
    case 'REPLACE_DATA': {
      const p = action.payload;
      return {
        ...state,
        categories: p.categories,
        customSubjects: p.customSubjects,
        methods: p.methods,
        sessions: p.sessions,
        customPlans: p.customPlans,
        trash: p.trash,
        setupVariants: p.setupVariants ?? state.setupVariants,
        settings: p.settings ? migrateSettings({ ...DEFAULT_SETTINGS, ...p.settings }) : state.settings,
      };
    }
    case 'IMPORT_STATE':
      return { ...state, ...action.payload };
    default:
      return state;
  }
}

function sliceOf(s: AppState): CloudData {
  return {
    categories: s.categories,
    customSubjects: s.customSubjects,
    methods: s.methods,
    sessions: s.sessions,
    customPlans: s.customPlans,
    trash: s.trash,
    settings: s.settings as unknown as Record<string, unknown>,
    setupVariants: s.setupVariants,
  };
}

interface StoreCtx {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  configured: boolean;
  session: SupabaseSession | null;
  userEmail: string | null;
  signOut: () => Promise<void>;
}

const StoreContext = createContext<StoreCtx | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, initState);
  const [session, setSession] = useState<SupabaseSession | null>(null);
  const [hydrated, setHydrated] = useState(false);

  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    persistState(state);
  }, [state]);

  useEffect(() => {
    applyTheme(state.theme);
  }, [state.theme]);

  useEffect(() => {
    applyCustomColors(state.settings.customColors);
  }, [state.settings.customColors]);

  // Track the auth session.
  useEffect(() => {
    if (!supabase) return;
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (active) setSession(data.session);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  // On login, load the cloud. If the account is empty, migrate local data up;
  // otherwise the cloud is the source of truth and replaces local state.
  useEffect(() => {
    if (!supabase || !session) {
      setHydrated(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const cloud = await loadAll();
        if (cancelled) return;
        const cloudEmpty =
          !cloud.categories.length &&
          !cloud.sessions.length &&
          !cloud.methods.length &&
          !cloud.customPlans.length;
        if (cloudEmpty) {
          const local = stateRef.current;
          const hasLocal = local.categories.length || local.sessions.length || local.methods.length;
          if (hasLocal) await pushAll(session.user.id, sliceOf(local));
        } else {
          dispatch({ type: 'REPLACE_DATA', payload: cloud });
        }
        if (!cancelled) setHydrated(true);
      } catch (e) {
        console.error('Cloud load failed, staying on local data', e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [session]);

  // Push changes to the cloud, debounced, once hydrated.
  useEffect(() => {
    if (!supabase || !session || !hydrated) return;
    const id = setTimeout(() => {
      pushAll(session.user.id, sliceOf(stateRef.current)).catch((e) =>
        console.error('Cloud sync failed', e),
      );
    }, 700);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    session,
    hydrated,
    state.categories,
    state.customSubjects,
    state.methods,
    state.sessions,
    state.customPlans,
    state.trash,
    state.settings,
  ]);

  async function signOut() {
    if (supabase) await supabase.auth.signOut();
    setSession(null);
    setHydrated(false);
  }

  return (
    <StoreContext.Provider
      value={{
        state,
        dispatch,
        configured: isSupabaseConfigured,
        session,
        userEmail: session?.user.email ?? null,
        signOut,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be inside StoreProvider');
  return ctx;
}

export function applyTheme(theme: Theme) {
  const dark =
    theme === 'dark' ||
    (theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
}

// Relative luminance of a hex color (0 dark, 1 light).
function hexLuminance(hex: string): number {
  const m = hex.replace('#', '');
  if (m.length < 6) return 0.5;
  const r = parseInt(m.slice(0, 2), 16) / 255;
  const g = parseInt(m.slice(2, 4), 16) / 255;
  const b = parseInt(m.slice(4, 6), 16) / 255;
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

// Shade a hex color: positive percent lightens, negative darkens.
function shadeHex(hex: string, percent: number): string {
  const m = hex.replace('#', '');
  if (m.length < 6) return hex;
  const adj = (c: number) => {
    const v = Math.round(c + (percent / 100) * 255);
    return Math.max(0, Math.min(255, v));
  };
  const r = adj(parseInt(m.slice(0, 2), 16));
  const g = adj(parseInt(m.slice(2, 4), 16));
  const b = adj(parseInt(m.slice(4, 6), 16));
  return '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('');
}

// Dominant is the page background, Secondary is the card/box surface (with
// derived inner-field and border shades), and Accent is the small highlight
// color used for links, charts, dots, and progress bars.
const CUSTOM_VARS = ['--bg', '--card', '--card2', '--line', '--slate'];

export function applyCustomColors(colors: Settings['customColors']) {
  const root = document.documentElement;
  if (!colors) {
    CUSTOM_VARS.forEach((v) => root.style.removeProperty(v));
    return;
  }
  const cardIsLight = hexLuminance(colors.secondary) > 0.5;
  root.style.setProperty('--bg', colors.dominant);
  root.style.setProperty('--card', colors.secondary);
  root.style.setProperty('--card2', shadeHex(colors.secondary, cardIsLight ? -7 : 12));
  root.style.setProperty('--line', shadeHex(colors.secondary, cardIsLight ? -16 : 22));
  root.style.setProperty('--slate', colors.accent);
}
