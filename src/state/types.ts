export type Theme = 'auto' | 'light' | 'dark';

export type FocusBg = 'streaks' | 'dots' | 'rain' | 'glow' | 'gradient' | 'custom' | 'color';

export type TimerMode = 'countdown' | 'stopwatch' | 'pomodoro';

export type AmbientSound = 'none' | 'white' | 'pink' | 'brown';

export interface CustomColors {
  dominant: string;
  secondary: string;
  accent: string;
}

export interface Settings {
  // Custom accent palette. When null, the built in palette is used.
  customColors: CustomColors | null;
  // Minutes of study that map to the middle heat color on the month map.
  heatBaseline: number;
  // Pomodoro lengths in minutes.
  pomodoroFocus: number;
  pomodoroBreak: number;
  pomodoroRounds: number;
  // Ambient sound played during a focus session.
  ambient: AmbientSound;
  // Play a chime when a countdown or pomodoro round ends.
  alertSound: boolean;
  // Background color for the focus overlay (all backgrounds). Null follows the theme.
  focusColor: string | null;
  // Color of the focus effects (rain, dots, streaks, glow). Null derives it automatically.
  focusEffectColor: string | null;
}

export interface Category {
  id: string;
  name: string;
  goalH: number;
  color: string;
}

export interface SessionItem {
  subject: string;
  catId: string;
  minutes?: number;
}

export interface Session {
  id: string;
  date: string;
  min: number;
  items: SessionItem[];
  method: string;
  notes: string;
}

export interface CustomPlan {
  id: string;
  title: string;
  steps: string[];
}

// A saved snapshot of the user's current setup (sectors, subjects, methods, plans).
export interface SetupVariant {
  id: string;
  name: string;
  categories: Category[];
  customSubjects: Record<string, string[]>;
  methods: string[];
  customPlans: CustomPlan[];
}

export interface AppState {
  theme: Theme;
  focusBg: FocusBg;
  focusCustom: string | null;
  focusTransp: boolean;
  categories: Category[];
  sessions: Session[];
  trash: Session[];
  customSubjects: Record<string, string[]>;
  customPlans: CustomPlan[];
  methods: string[];
  settings: Settings;
  setupVariants: SetupVariant[];
}

// The data slice that syncs to the cloud, used by REPLACE_DATA on first load.
export interface DataSlice {
  categories: Category[];
  customSubjects: Record<string, string[]>;
  methods: string[];
  sessions: Session[];
  customPlans: CustomPlan[];
  trash: Session[];
  settings?: Partial<Settings> | null;
  setupVariants?: SetupVariant[];
}

export type AppAction =
  | { type: 'SET_THEME'; payload: Theme }
  | { type: 'SET_FOCUS_BG'; payload: FocusBg }
  | { type: 'SET_FOCUS_CUSTOM'; payload: string | null }
  | { type: 'SET_FOCUS_TRANSP'; payload: boolean }
  | { type: 'SET_CATEGORIES'; payload: Category[] }
  | { type: 'ADD_CATEGORY'; payload: Category }
  | { type: 'UPDATE_CATEGORY'; payload: Category }
  | { type: 'DELETE_CATEGORY'; payload: string }
  | { type: 'ADD_SESSION'; payload: Session }
  | { type: 'DELETE_SESSION'; payload: string }
  | { type: 'RESTORE_SESSION'; payload: string }
  | { type: 'CLEAR_TRASH' }
  | { type: 'ADD_CUSTOM_SUBJECT'; payload: { catId: string; subjects: string[] } }
  | { type: 'DELETE_SUBJECT'; payload: { catId: string; name: string } }
  | { type: 'ADD_CUSTOM_PLAN'; payload: CustomPlan }
  | { type: 'DELETE_CUSTOM_PLAN'; payload: string }
  | { type: 'ADD_METHOD'; payload: string }
  | { type: 'DELETE_METHOD'; payload: string }
  | { type: 'RENAME_METHOD'; payload: { from: string; to: string } }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<Settings> }
  | { type: 'RESTORE_ALL' }
  | { type: 'AUTOFILL' }
  | { type: 'REPLACE_DATA'; payload: DataSlice }
  | { type: 'IMPORT_STATE'; payload: Partial<AppState> }
  // Setup variant actions
  | { type: 'SAVE_VARIANT'; payload: { id: string; name: string } }
  | { type: 'DELETE_VARIANT'; payload: string }
  | { type: 'LOAD_VARIANT'; payload: string }
  // Restore a prior setup snapshot (used by undo autofill / undo load variant).
  | {
      type: 'RESTORE_SETUP';
      payload: {
        categories: Category[];
        customSubjects: Record<string, string[]>;
        methods: string[];
        customPlans: CustomPlan[];
      };
    }
  // Wipe all setup data, keep sessions and settings.
  | { type: 'CLEAR_SETUP' };
