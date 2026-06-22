import { useState } from 'react';
import { useStore } from '../state/store';
import type { AmbientSound, AppAction, Category, CustomPlan, Theme } from '../state/types';
import type { SetupVariant } from '../state/types';
import { genId } from '../lib/utils';
import { subjectSuggestionsFor } from '../state/defaults';

interface SettingsModalProps {
  show: boolean;
  onClose: () => void;
}

// A local snapshot of the setup fields we might want to undo.
interface SetupSnapshot {
  label: string; // "autofill" or the variant name that was loaded
  categories: Category[];
  customSubjects: Record<string, string[]>;
  methods: string[];
  customPlans: CustomPlan[];
}

const AMBIENT_OPTIONS: { value: AmbientSound; label: string }[] = [
  { value: 'none', label: 'Off' },
  { value: 'white', label: 'White noise' },
  { value: 'pink', label: 'Pink noise' },
  { value: 'brown', label: 'Brown noise (deep)' },
];

const THEME_OPTIONS: { value: Theme; label: string }[] = [
  { value: 'auto', label: 'Auto' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

// Read the current value of a CSS variable so the color pickers default to
// exactly what the app looks like right now (per active theme).
function liveVar(name: string, fallback: string): string {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
}

// Deep clone helper.
function deepClone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v));
}

export default function SettingsModal({ show, onClose }: SettingsModalProps) {
  const { state, dispatch, configured, userEmail, signOut } = useStore();
  const s = state.settings;

  const [newMethod, setNewMethod] = useState('');
  const [subjInputs, setSubjInputs] = useState<Record<string, string>>({});
  const [openSuggest, setOpenSuggest] = useState<string | null>(null); // catId with open suggestion dropdown
  const [undoSnapshot, setUndoSnapshot] = useState<SetupSnapshot | null>(null);
  const [variantName, setVariantName] = useState('');

  // Take a snapshot of the current setup before applying autofill or a variant.
  function takeSnapshot(label: string): SetupSnapshot {
    return {
      label,
      categories: deepClone(state.categories),
      customSubjects: deepClone(state.customSubjects),
      methods: [...state.methods],
      customPlans: deepClone(state.customPlans),
    };
  }

  // Wrap dispatch for setup-changing manual actions: clears the undo snapshot so
  // the undo button disappears once the user edits anything after an autofill/load.
  function setupDispatch(action: AppAction) {
    setUndoSnapshot(null);
    dispatch(action);
  }

  function addMethod() {
    const name = newMethod.trim();
    if (!name) return;
    setupDispatch({ type: 'ADD_METHOD', payload: name });
    setNewMethod('');
  }

  function addSubject(catId: string) {
    const name = (subjInputs[catId] ?? '').trim();
    if (!name) return;
    setupDispatch({ type: 'ADD_CUSTOM_SUBJECT', payload: { catId, subjects: [name] } });
    setSubjInputs((prev) => ({ ...prev, [catId]: '' }));
    setOpenSuggest(null);
  }

  function autofill() {
    const hasData = state.categories.length > 0 || state.methods.length > 0;
    if (
      hasData &&
      !window.confirm(
        'Replace your current sectors, subjects, methods, and plans with the starter setup?',
      )
    ) {
      return;
    }
    const snap = takeSnapshot('autofill');
    dispatch({ type: 'AUTOFILL' }); // use raw dispatch; snap is taken before the change
    setUndoSnapshot(snap);
  }

  function undoSetup() {
    if (!undoSnapshot) return;
    dispatch({
      type: 'RESTORE_SETUP',
      payload: {
        categories: undoSnapshot.categories,
        customSubjects: undoSnapshot.customSubjects,
        methods: undoSnapshot.methods,
        customPlans: undoSnapshot.customPlans,
      },
    });
    setUndoSnapshot(null);
  }

  function saveVariant() {
    const name = variantName.trim();
    if (!name) return;
    const hasData = state.categories.length > 0 || state.methods.length > 0;
    if (!hasData) {
      alert('Nothing to save. Add some sectors or methods first.');
      return;
    }
    dispatch({ type: 'SAVE_VARIANT', payload: { id: genId('v'), name } });
    setVariantName('');
  }

  function loadVariant(v: SetupVariant) {
    const snap = takeSnapshot(v.name);
    dispatch({ type: 'LOAD_VARIANT', payload: v.id });
    setUndoSnapshot(snap);
  }

  function deleteVariant(id: string) {
    dispatch({ type: 'DELETE_VARIANT', payload: id });
  }

  function clearSetup() {
    if (
      !window.confirm(
        'This will clear all your sectors, subjects, methods, and plans. Are you sure?',
      )
    ) {
      return;
    }
    dispatch({ type: 'CLEAR_SETUP' }); // intentionally raw dispatch -- cannot undo this
    setUndoSnapshot(null);
  }

  // Filter suggestions for a sector: exclude already-added subjects, filter by typed text.
  function suggestionsFor(cat: Category, typed: string): string[] {
    const all = subjectSuggestionsFor(cat.name);
    const existing = new Set(state.customSubjects[cat.id] ?? []);
    const lower = typed.toLowerCase();
    return all.filter((s) => !existing.has(s) && (!typed || s.toLowerCase().includes(lower)));
  }

  // Defaults mirror the live theme.
  const baseColors = {
    dominant: liveVar('--bg', '#D3CFC3'),
    secondary: liveVar('--card', '#FFFFFF'),
    accent: liveVar('--slate', '#5C7FB0'),
  };
  const colors = s.customColors ?? baseColors;

  function setColor(key: 'dominant' | 'secondary' | 'accent', value: string) {
    dispatch({ type: 'UPDATE_SETTINGS', payload: { customColors: { ...colors, [key]: value } } });
  }

  function resetColors() {
    dispatch({ type: 'UPDATE_SETTINGS', payload: { customColors: null } });
  }

  if (!show) return null;

  return (
    <div
      className="modal show"
      onClick={(e) => {
        if ((e.target as HTMLElement).classList.contains('modal')) onClose();
      }}
    >
      <div className="mbox settings-box">
        <div className="settings-head">
          <h3>Settings</h3>
          <button className="b-ghost" onClick={onClose}>
            Done
          </button>
        </div>

        {/* Account */}
        <section className="set-section">
          <div className="set-title">Account</div>
          {configured ? (
            <div className="set-row">
              <span className="set-unit">Signed in as {userEmail ?? 'your account'}</span>
              <button
                className="b-ghost set-reset"
                style={{ marginTop: 0 }}
                onClick={() => signOut()}
              >
                Sign out
              </button>
            </div>
          ) : (
            <p className="set-desc">
              Offline mode. Add your Supabase keys to the .env file to enable accounts and cloud
              sync.
            </p>
          )}
        </section>

        {/* Your setup */}
        <section className="set-section">
          <div className="set-title">Your setup</div>
          <p className="set-desc">
            Load a generic starter setup of sectors, subjects, methods, and study plans. This
            replaces your current setup but keeps your logged sessions.
          </p>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
            <button className="b-ghost set-reset" style={{ marginTop: 0 }} onClick={autofill}>
              Autofill my setup
            </button>
            {undoSnapshot && (
              <button
                className="b-ghost set-reset"
                style={{ marginTop: 0, borderColor: 'var(--flame)', color: 'var(--flame)' }}
                onClick={undoSetup}
              >
                Undo {undoSnapshot.label === 'autofill' ? 'autofill' : `load "${undoSnapshot.label}"`}
              </button>
            )}
          </div>

          {/* Save current setup as a named variant */}
          <p className="set-desc" style={{ marginBottom: 8 }}>
            Save your current setup as a named variant to switch between schedules quickly.
          </p>
          <div className="manage-add" style={{ marginBottom: 12 }}>
            <input
              type="text"
              placeholder='Name it, e.g. "Math focus week"'
              value={variantName}
              onChange={(e) => setVariantName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  saveVariant();
                }
              }}
            />
            <button className="b-add" onClick={saveVariant}>
              + Save
            </button>
          </div>

          {/* Saved variants list */}
          {state.setupVariants.length > 0 && (
            <div className="variant-list">
              {state.setupVariants.map((v) => (
                <div key={v.id} className="variant-row">
                  <span className="variant-name">{v.name}</span>
                  <button className="variant-load" onClick={() => loadVariant(v)}>
                    Load
                  </button>
                  <button
                    className="variant-del"
                    title="Delete this variant"
                    onClick={() => deleteVariant(v.id)}
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Start from scratch */}
          <button
            className="b-ghost set-reset"
            style={{ marginTop: 0, color: '#b4533f', borderColor: '#b4533f' }}
            onClick={clearSetup}
          >
            Start from scratch
          </button>
        </section>

        {/* Methods */}
        <section className="set-section">
          <div className="set-title">Methods</div>
          <p className="set-desc">The study methods you can pick when logging a session.</p>
          <div className="manage-list">
            {state.methods.length === 0 && <span className="set-unit">No methods yet.</span>}
            {state.methods.map((m) => (
              <span key={m} className="manage-chip">
                {m}
                <button
                  className="manage-x"
                  title="Remove"
                  onClick={() => setupDispatch({ type: 'DELETE_METHOD', payload: m })}
                >
                  &times;
                </button>
              </span>
            ))}
          </div>
          <div className="manage-add">
            <input
              type="text"
              placeholder="Add a method"
              value={newMethod}
              onChange={(e) => setNewMethod(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addMethod();
                }
              }}
            />
            <button className="b-add" onClick={addMethod}>
              + Add
            </button>
          </div>
        </section>

        {/* Subjects */}
        <section className="set-section">
          <div className="set-title">Subjects</div>
          <p className="set-desc">
            Subjects grouped by sector. Add or remove the options that show up in the subject
            picker.
          </p>
          {state.categories.length === 0 && (
            <span className="set-unit">Add a sector first (in Weekly goals).</span>
          )}
          {state.categories.map((cat) => {
            const catInput = subjInputs[cat.id] ?? '';
            const suggestions = suggestionsFor(cat, catInput);
            const showDrop = openSuggest === cat.id && suggestions.length > 0;

            return (
              <div key={cat.id} className="manage-group">
                <div className="manage-group-name">
                  <span className="goal-dot" style={{ background: cat.color }} />
                  {cat.name}
                </div>
                <div className="manage-list">
                  {(state.customSubjects[cat.id] ?? []).length === 0 && (
                    <span className="set-unit">No subjects yet.</span>
                  )}
                  {(state.customSubjects[cat.id] ?? []).map((name) => (
                    <span key={name} className="manage-chip">
                      {name}
                      <button
                        className="manage-x"
                        title="Remove"
                        onClick={() =>
                          setupDispatch({
                            type: 'DELETE_SUBJECT',
                            payload: { catId: cat.id, name },
                          })
                        }
                      >
                        &times;
                      </button>
                    </span>
                  ))}
                </div>
                <div className="manage-add">
                  <input
                    type="text"
                    placeholder={`Add a subject to ${cat.name}`}
                    value={catInput}
                    onChange={(e) => {
                      setSubjInputs((prev) => ({ ...prev, [cat.id]: e.target.value }));
                      setOpenSuggest(cat.id); // re-open on each keystroke
                    }}
                    onFocus={() => setOpenSuggest(cat.id)}
                    onBlur={() => {
                      // Delay so a suggestion click fires first.
                      setTimeout(() => setOpenSuggest(null), 150);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addSubject(cat.id);
                      }
                      if (e.key === 'Escape') {
                        setOpenSuggest(null);
                      }
                    }}
                  />
                  <button className="b-add" onClick={() => addSubject(cat.id)}>
                    + Add
                  </button>
                  {showDrop && (
                    <div className="suggest-drop">
                      {suggestions.map((sug) => (
                        <button
                          key={sug}
                          className="suggest-item"
                          onMouseDown={(e) => {
                            e.preventDefault(); // keep input focused through the click
                            setSubjInputs((prev) => ({ ...prev, [cat.id]: sug }));
                            setOpenSuggest(null);
                          }}
                        >
                          {sug}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </section>

        {/* Appearance */}
        <section className="set-section">
          <div className="set-title">Appearance</div>
          <p className="set-desc">Light or dark mode. Auto follows your device setting.</p>
          <div className="tmode set-theme">
            {THEME_OPTIONS.map((o) => (
              <button
                key={o.value}
                className={state.theme === o.value ? 'on' : ''}
                onClick={() => dispatch({ type: 'SET_THEME', payload: o.value })}
              >
                {o.label}
              </button>
            ))}
          </div>
        </section>

        {/* Colors */}
        <section className="set-section">
          <div className="set-title">Colors</div>
          <p className="set-desc">
            Dominant is the page background, Secondary is the boxes, and Accent is the highlights
            (links, charts, dots, progress bars). Defaults match the current look.
          </p>
          <div className="set-colors">
            <label className="set-color">
              <input
                type="color"
                value={colors.dominant}
                onChange={(e) => setColor('dominant', e.target.value)}
              />
              <span>Dominant</span>
            </label>
            <label className="set-color">
              <input
                type="color"
                value={colors.secondary}
                onChange={(e) => setColor('secondary', e.target.value)}
              />
              <span>Secondary</span>
            </label>
            <label className="set-color">
              <input
                type="color"
                value={colors.accent}
                onChange={(e) => setColor('accent', e.target.value)}
              />
              <span>Accent</span>
            </label>
          </div>
          {s.customColors && (
            <button className="b-ghost set-reset" onClick={resetColors}>
              Reset to default colors
            </button>
          )}
        </section>

        {/* Heatmap baseline */}
        <section className="set-section">
          <div className="set-title">Month map baseline</div>
          <p className="set-desc">
            An average study day equals the middle color. Set how many minutes that is.
          </p>
          <div className="set-row">
            <input
              type="number"
              min={5}
              step={5}
              value={s.heatBaseline}
              onChange={(e) =>
                dispatch({
                  type: 'UPDATE_SETTINGS',
                  payload: { heatBaseline: Math.max(5, parseInt(e.target.value) || 60) },
                })
              }
            />
            <span className="set-unit">minutes = middle color</span>
          </div>
        </section>

        {/* Pomodoro */}
        <section className="set-section">
          <div className="set-title">Pomodoro</div>
          <p className="set-desc">Lengths used by the Pomodoro timer mode.</p>
          <div className="set-grid3">
            <label className="set-field">
              <span>Focus (min)</span>
              <input
                type="number"
                min={1}
                value={s.pomodoroFocus}
                onChange={(e) =>
                  dispatch({
                    type: 'UPDATE_SETTINGS',
                    payload: { pomodoroFocus: Math.max(1, parseInt(e.target.value) || 25) },
                  })
                }
              />
            </label>
            <label className="set-field">
              <span>Break (min)</span>
              <input
                type="number"
                min={1}
                value={s.pomodoroBreak}
                onChange={(e) =>
                  dispatch({
                    type: 'UPDATE_SETTINGS',
                    payload: { pomodoroBreak: Math.max(1, parseInt(e.target.value) || 5) },
                  })
                }
              />
            </label>
            <label className="set-field">
              <span>Rounds</span>
              <input
                type="number"
                min={1}
                value={s.pomodoroRounds}
                onChange={(e) =>
                  dispatch({
                    type: 'UPDATE_SETTINGS',
                    payload: { pomodoroRounds: Math.max(1, parseInt(e.target.value) || 4) },
                  })
                }
              />
            </label>
          </div>
        </section>

        {/* Sound */}
        <section className="set-section">
          <div className="set-title">Sound</div>
          <p className="set-desc">Ambient background noise during a session, plus an end chime.</p>
          <div className="set-row">
            <select
              value={s.ambient}
              onChange={(e) =>
                dispatch({
                  type: 'UPDATE_SETTINGS',
                  payload: { ambient: e.target.value as AmbientSound },
                })
              }
            >
              {AMBIENT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <span className="set-unit">ambient sound</span>
          </div>
          <label className="chk set-chk">
            <input
              type="checkbox"
              checked={s.alertSound}
              onChange={(e) =>
                dispatch({ type: 'UPDATE_SETTINGS', payload: { alertSound: e.target.checked } })
              }
            />
            play a chime when a timer ends
          </label>
        </section>

        {/* Focus colors */}
        <section className="set-section">
          <div className="set-title">Focus screen colors</div>
          <p className="set-desc">
            The background color applies to every focus background. The effect color tints the rain,
            dots, streaks, and glow. Leave either off to follow the theme automatically.
          </p>

          <div className="set-row" style={{ marginBottom: 12 }}>
            {s.focusColor === null ? (
              <button
                className="b-ghost set-reset"
                style={{ marginTop: 0 }}
                onClick={() =>
                  dispatch({ type: 'UPDATE_SETTINGS', payload: { focusColor: '#0B0C0E' } })
                }
              >
                Set a background color
              </button>
            ) : (
              <>
                <label className="set-color">
                  <input
                    type="color"
                    value={s.focusColor}
                    onChange={(e) =>
                      dispatch({ type: 'UPDATE_SETTINGS', payload: { focusColor: e.target.value } })
                    }
                  />
                  <span>Background</span>
                </label>
                <button
                  className="b-ghost set-reset"
                  style={{ marginTop: 0 }}
                  onClick={() =>
                    dispatch({ type: 'UPDATE_SETTINGS', payload: { focusColor: null } })
                  }
                >
                  Clear
                </button>
              </>
            )}
          </div>

          <div className="set-row">
            {s.focusEffectColor === null ? (
              <button
                className="b-ghost set-reset"
                style={{ marginTop: 0 }}
                onClick={() =>
                  dispatch({ type: 'UPDATE_SETTINGS', payload: { focusEffectColor: '#5C7FB0' } })
                }
              >
                Set an effect color
              </button>
            ) : (
              <>
                <label className="set-color">
                  <input
                    type="color"
                    value={s.focusEffectColor}
                    onChange={(e) =>
                      dispatch({
                        type: 'UPDATE_SETTINGS',
                        payload: { focusEffectColor: e.target.value },
                      })
                    }
                  />
                  <span>Effect</span>
                </label>
                <button
                  className="b-ghost set-reset"
                  style={{ marginTop: 0 }}
                  onClick={() =>
                    dispatch({ type: 'UPDATE_SETTINGS', payload: { focusEffectColor: null } })
                  }
                >
                  Clear
                </button>
              </>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
