import { useState, useEffect } from 'react';
import { useStore } from '../state/store';
import { genId } from '../lib/utils';
import type { SessionItem } from '../state/types';
import DatePicker from './DatePicker';

interface LogSessionProps {
  prefillMins?: number | null;
  onLogged?: () => void;
}

interface Chip {
  subject: string;
  catId: string;
  minutes: string;
}

export default function LogSession({ prefillMins, onLogged }: LogSessionProps) {
  const { state, dispatch } = useStore();
  const [totalMins, setTotalMins] = useState('');
  const [when, setWhen] = useState(() => new Date());
  const [chips, setChips] = useState<Chip[]>([]);
  const [splitMode, setSplitMode] = useState(false);
  const [method, setMethod] = useState(state.methods[0] ?? '');
  const [notes, setNotes] = useState('');
  const [showHint, setShowHint] = useState(false);
  const [saved, setSaved] = useState(false);
  const [otherText, setOtherText] = useState('');
  const [otherCatId, setOtherCatId] = useState(state.categories[0]?.id ?? '');
  const [showOther, setShowOther] = useState(false);

  useEffect(() => {
    if (prefillMins != null) {
      setTotalMins(String(prefillMins));
    }
  }, [prefillMins]);

  function subsFor(catId: string): string[] {
    return state.customSubjects[catId] ?? [];
  }

  function addOtherChip() {
    const text = otherText.trim();
    if (!text) return;
    setChips((prev) => [...prev, { subject: text, catId: otherCatId, minutes: '' }]);
    setOtherText('');
    setShowOther(false);
  }

  function removeChip(idx: number) {
    setChips((prev) => prev.filter((_, i) => i !== idx));
  }

  function setChipMin(idx: number, val: string) {
    setChips((prev) => prev.map((c, i) => (i === idx ? { ...c, minutes: val } : c)));
  }

  function validate(): string | null {
    const m = parseInt(totalMins);
    if (isNaN(m) || m < 1) return 'Enter a number of minutes.';
    if (chips.length === 0) return 'Add at least one subject.';
    return null;
  }

  function save() {
    const err = validate();
    if (err) {
      alert(err);
      return;
    }

    const total = parseInt(totalMins);
    const items: SessionItem[] = chips.map((c) => ({
      subject: c.subject,
      catId: c.catId,
      minutes: splitMode && c.minutes ? parseInt(c.minutes) : undefined,
    }));

    dispatch({
      type: 'ADD_SESSION',
      payload: {
        id: genId('s'),
        date: when.toISOString(),
        min: total,
        items,
        method,
        notes: notes.trim(),
      },
    });

    setTotalMins('');
    setWhen(new Date());
    setChips([]);
    setSplitMode(false);
    setNotes('');
    setSaved(true);
    onLogged?.();
    setTimeout(() => setSaved(false), 1400);
  }

  const catOptions = state.categories.map((c) => ({ value: c.id, label: c.name }));

  return (
    <div className="card">
      <h2>Log a session</h2>

      <div className="row2">
        {/* Minutes */}
        <div className="field">
          <label>Minutes (total)</label>
          <input
            type="number"
            placeholder="30"
            min={1}
            value={totalMins}
            onChange={(e) => setTotalMins(e.target.value)}
          />
        </div>

        {/* Date/time picker */}
        <div className="field">
          <label>When</label>
          <DatePicker value={when} onChange={setWhen} />
        </div>
      </div>

      {/* Subject picker: value is "catId:::subject" */}
      <div className="field">
        <label>
          What you worked on{' '}
          <span style={{ color: 'var(--muted)', fontWeight: 500 }}>&middot; add one or more</span>
        </label>
        <select
          value=""
          onChange={(e) => {
            const v = e.target.value;
            if (!v) return;
            const [catId, subject] = v.split(':::');
            if (subject === '__other__') {
              // Reveal the type your own box, pre-set to the chosen section.
              setOtherCatId(catId);
              setShowOther(true);
              e.target.value = '';
              return;
            }
            if (!chips.find((c) => c.catId === catId && c.subject === subject)) {
              setChips((prev) => [...prev, { subject, catId, minutes: '' }]);
            }
            e.target.value = '';
          }}
        >
          <option value="" disabled>
            Pick a subject...
          </option>
          {catOptions.map((c) => (
            <optgroup key={c.value} label={c.label}>
              {subsFor(c.value).map((s) => (
                <option key={`${c.value}:::${s}`} value={`${c.value}:::${s}`}>
                  {s}
                </option>
              ))}
              <option value={`${c.value}:::__other__`}>Other (type your own)...</option>
            </optgroup>
          ))}
        </select>
      </div>

      {/* Type-your-own block: only shown after picking "Other" */}
      {showOther && (
        <div id="otherBlock">
          <div className="row2">
            <div className="field">
              <label>Type it</label>
              <input
                type="text"
                placeholder="e.g. Sidgwick essay"
                value={otherText}
                autoFocus
                onChange={(e) => setOtherText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addOtherChip();
                  }
                }}
              />
            </div>
            <div className="field">
              <label>Section</label>
              <select value={otherCatId} onChange={(e) => setOtherCatId(e.target.value)}>
                {catOptions.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <button className="b-add" onClick={addOtherChip}>
              + Add this
            </button>
            <button
              className="b-ghost"
              onClick={() => {
                setShowOther(false);
                setOtherText('');
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Chips */}
      <div className="chips">
        {chips.length === 0 ? (
          <span className="chips-empty">No subjects added yet</span>
        ) : (
          chips.map((chip, i) => (
            <span key={i} className="chip">
              {chip.subject}
              {splitMode && (
                <input
                  type="number"
                  placeholder="min"
                  value={chip.minutes}
                  min={1}
                  onChange={(e) => setChipMin(i, e.target.value)}
                />
              )}
              <span className="x" onClick={() => removeChip(i)}>
                &times;
              </span>
            </span>
          ))
        )}
      </div>

      <label className="split-toggle">
        <input
          type="checkbox"
          checked={splitMode}
          onChange={(e) => setSplitMode(e.target.checked)}
        />
        set minutes per item
      </label>

      {/* Method */}
      <div className="field">
        <label>Method</label>
        <select value={method} onChange={(e) => setMethod(e.target.value)}>
          {state.methods.length === 0 && <option value="">No methods yet</option>}
          {state.methods.map((m) => (
            <option key={m}>{m}</option>
          ))}
        </select>
      </div>

      {/* Notes */}
      <div className="field">
        <label>
          Notes
          <span
            className="hint-toggle"
            onClick={() => setShowHint((h) => !h)}
            title="Show note ideas"
          >
            ?
          </span>
        </label>
        {showHint && (
          <div className="hint-panel" style={{ marginBottom: 8 }}>
            What clicked today?
            <br />
            Where did you get stuck?
            <br />
            Key insight from this session.
            <br />
            What to revisit next time.
          </div>
        )}
        <textarea
          rows={3}
          placeholder="Optional notes..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          style={{ resize: 'vertical' }}
        />
      </div>

      <button className={`save-btn${saved ? ' saved-flash' : ''}`} onClick={save}>
        {saved ? 'Saved!' : 'Save session'}
      </button>
    </div>
  );
}
