import { useState } from 'react';
import { useStore } from '../state/store';
import { inWeek, sessionMin, genId } from '../lib/utils';
import { CAT_PALETTE } from '../state/defaults';
import StudyPlanModal from './StudyPlanModal';
import type { Category } from '../state/types';

interface WeeklyGoalsProps {
  weekOffset: number;
}

interface ConfirmState {
  msg: string;
  danger?: boolean;
  onYes: () => void;
}

interface FormState {
  mode: 'add' | 'edit';
  cat?: Category;
}

export default function WeeklyGoals({ weekOffset }: WeeklyGoalsProps) {
  const { state, dispatch } = useStore();
  const [studyModal, setStudyModal] = useState<string | null>(null);
  const [form, setForm] = useState<FormState | null>(null);
  const [confirm, setConfirm] = useState<ConfirmState | null>(null);

  // Form fields
  const [fname, setFname] = useState('');
  const [fgoal, setFgoal] = useState('');
  const [fcolor, setFcolor] = useState(CAT_PALETTE[0]);
  const [fsubs, setFsubs] = useState('');

  const weekSessions = state.sessions.filter((s) => inWeek(s.date, weekOffset));

  function hrsForCat(catId: string): number {
    return (
      weekSessions
        .filter((s) => s.items.some((i) => i.catId === catId))
        .reduce((a, s) => {
          const catMin = s.items
            .filter((i) => i.catId === catId)
            .reduce((acc, i) => acc + (i.minutes ?? 0), 0);
          return a + (catMin > 0 ? catMin : sessionMin(s) / Math.max(1, s.items.length));
        }, 0) / 60
    );
  }

  function openAdd() {
    setFname('');
    setFgoal('');
    setFsubs('');
    setFcolor(CAT_PALETTE[state.categories.length % CAT_PALETTE.length]);
    setForm({ mode: 'add' });
  }

  function openEdit(cat: Category) {
    setFname(cat.name);
    setFgoal(String(cat.goalH));
    setFcolor(cat.color);
    setFsubs('');
    setForm({ mode: 'edit', cat });
  }

  function saveAdd() {
    const name = fname.trim();
    if (!name) return;
    const goalH = parseFloat(fgoal) || 0;
    const id = genId('c');
    dispatch({ type: 'ADD_CATEGORY', payload: { id, name, goalH, color: fcolor } });
    if (fsubs.trim()) {
      dispatch({
        type: 'ADD_CUSTOM_SUBJECT',
        payload: {
          catId: id,
          subjects: fsubs
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean),
        },
      });
    }
    setForm(null);
  }

  function saveEdit() {
    if (!form?.cat) return;
    const name = fname.trim();
    if (!name) return;
    const goalH = parseFloat(fgoal) || 0;
    dispatch({ type: 'UPDATE_CATEGORY', payload: { ...form.cat, name, goalH, color: fcolor } });
    if (fsubs.trim()) {
      dispatch({
        type: 'ADD_CUSTOM_SUBJECT',
        payload: {
          catId: form.cat.id,
          subjects: fsubs
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean),
        },
      });
    }
    setForm(null);
  }

  function askDelete(cat: Category) {
    setConfirm({
      msg: `Delete category "${cat.name}"?`,
      danger: true,
      onYes: () => {
        dispatch({ type: 'DELETE_CATEGORY', payload: cat.id });
        setConfirm(null);
      },
    });
  }

  return (
    <div className="card span-full">
      <h2>Weekly goals</h2>

      {state.categories.map((cat) => {
        const done = hrsForCat(cat.id);
        const goal = cat.goalH;
        const pct = goal > 0 ? Math.min((done / goal) * 100, 100) : 0;
        const doneLabel = done.toFixed(1);
        const goalLabel = goal > 0 ? `/ ${goal}h` : '';

        return (
          <div key={cat.id} className="goal">
            <span className="goal-dot" style={{ background: cat.color }} />
            <div className="goal-body">
              <div
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <span className="goal-name">{cat.name}</span>
                <span className="goal-hrs">
                  {doneLabel}h {goalLabel}
                </span>
              </div>
              {goal > 0 && (
                <div className="bar" style={{ marginTop: 6 }}>
                  <i style={{ width: `${pct}%`, background: cat.color }} />
                </div>
              )}
              <button className="plan-link" onClick={() => setStudyModal(cat.id)}>
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  width="12"
                  height="12"
                >
                  <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
                  <path d="M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2" />
                </svg>
                Study plan
              </button>
            </div>
            <button className="goal-edit" onClick={() => openEdit(cat)} title="Edit">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                width="13"
                height="13"
              >
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </button>
          </div>
        );
      })}

      {/* Custom plans section */}
      {state.customPlans.length > 0 && (
        <div className="plans-divider">
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: 'var(--muted)',
              textTransform: 'uppercase',
              letterSpacing: '.6px',
              marginBottom: 6,
            }}
          >
            Your plans
          </div>
          {state.customPlans.map((p) => (
            <div key={p.id} className="myplan">
              <div>
                <div className="mp-name">{p.title}</div>
                <div className="mp-meta">
                  {p.steps.length} step{p.steps.length !== 1 ? 's' : ''}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button className="mp-open" onClick={() => setStudyModal(`custom:${p.id}`)}>
                  View
                </button>
                <button
                  className="mp-del"
                  onClick={() =>
                    setConfirm({
                      msg: `Delete plan "${p.title}"?`,
                      danger: true,
                      onYes: () => {
                        dispatch({ type: 'DELETE_CUSTOM_PLAN', payload: p.id });
                        setConfirm(null);
                      },
                    })
                  }
                >
                  &#215;
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <button className="add-cat" onClick={openAdd}>
        + Add category
      </button>

      {/* Study Plan Modal */}
      <StudyPlanModal
        show={studyModal !== null && !studyModal.startsWith('custom:')}
        catId={studyModal}
        onClose={() => setStudyModal(null)}
      />

      {/* Custom plan viewer */}
      {studyModal?.startsWith('custom:') &&
        (() => {
          const pid = studyModal.slice(7);
          const cp = state.customPlans.find((p) => p.id === pid);
          if (!cp) return null;
          return (
            <div
              className="modal show"
              onClick={(e) => {
                if ((e.target as HTMLElement).classList.contains('modal')) setStudyModal(null);
              }}
            >
              <div className="mbox">
                <h3>{cp.title}</h3>
                {cp.steps.map((step, i) => (
                  <div key={i} className="sstep">
                    <div className="sstep-row">
                      <span>{step}</span>
                    </div>
                  </div>
                ))}
                <button className="mclose" onClick={() => setStudyModal(null)}>
                  Got it
                </button>
              </div>
            </div>
          );
        })()}

      {/* Add / Edit form modal */}
      {form && (
        <div
          className="modal show"
          onClick={(e) => {
            if ((e.target as HTMLElement).classList.contains('modal')) setForm(null);
          }}
        >
          <div className="mbox">
            <h3>{form.mode === 'add' ? 'Add category' : `Edit: ${form.cat?.name}`}</h3>
            <div className="mfield">
              <label>Name</label>
              <input
                type="text"
                value={fname}
                onChange={(e) => setFname(e.target.value)}
                autoFocus
                placeholder="e.g. Chemistry"
              />
            </div>
            <div className="mfield">
              <label>Weekly goal (hours)</label>
              <input
                type="number"
                value={fgoal}
                onChange={(e) => setFgoal(e.target.value)}
                placeholder="e.g. 2"
                min={0}
                step={0.25}
              />
            </div>
            <div className="mfield">
              <label>Color</label>
              <input
                type="color"
                value={fcolor}
                onChange={(e) => setFcolor(e.target.value)}
                style={{ height: 38, borderRadius: 8, padding: 2 }}
              />
            </div>
            <div className="mfield">
              <label>Subjects (comma-separated, optional)</label>
              <input
                type="text"
                value={fsubs}
                onChange={(e) => setFsubs(e.target.value)}
                placeholder="e.g. Titrations, Kinetics"
              />
            </div>
            {form.mode === 'edit' && (
              <button
                style={{
                  width: '100%',
                  marginBottom: 10,
                  padding: '9px',
                  borderRadius: 11,
                  background: '#B4533F',
                  color: '#fff',
                  fontWeight: 600,
                  fontSize: 14,
                }}
                onClick={() => {
                  askDelete(form.cat!);
                  setForm(null);
                }}
              >
                Delete category
              </button>
            )}
            <div className="mbtns">
              <button className="b-ghost" onClick={() => setForm(null)}>
                Cancel
              </button>
              <button className="b-primary" onClick={form.mode === 'add' ? saveAdd : saveEdit}>
                {form.mode === 'add' ? 'Add' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm modal */}
      {confirm && (
        <div
          className="modal show"
          onClick={(e) => {
            if ((e.target as HTMLElement).classList.contains('modal')) setConfirm(null);
          }}
        >
          <div className="mbox">
            <h3>Confirm</h3>
            <p style={{ marginBottom: 16, color: 'var(--muted)' }}>{confirm.msg}</p>
            <div className="mbtns">
              <button className="b-ghost" onClick={() => setConfirm(null)}>
                Cancel
              </button>
              <button className={confirm.danger ? 'b-danger' : 'b-primary'} onClick={confirm.onYes}>
                Yes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
