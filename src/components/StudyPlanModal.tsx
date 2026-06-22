import { useState } from 'react';
import { useStore } from '../state/store';
import { STUDY } from '../state/defaults';
import { genId } from '../lib/utils';

interface StudyPlanModalProps {
  show: boolean;
  catId: string | null;
  onClose: () => void;
}

export default function StudyPlanModal({ show, catId, onClose }: StudyPlanModalProps) {
  const { state, dispatch } = useStore();
  const [variantIdx, setVariantIdx] = useState(0);
  const [openSteps, setOpenSteps] = useState<Record<string, boolean>>({});

  // Builder state
  const [buildMode, setBuildMode] = useState(false);
  const [bTitle, setBTitle] = useState('');
  const [bSteps, setBSteps] = useState([{ time: '', title: '' }]);

  if (!show) return null;

  const plan = catId ? STUDY[catId] : null;
  const cat = catId ? state.categories.find((c) => c.id === catId) : null;
  const variant = plan?.variants[variantIdx];

  function toggleStep(key: string) {
    setOpenSteps((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function openBuilder() {
    setBuildMode(true);
    setBTitle('');
    setBSteps([{ time: '', title: '' }]);
  }

  function saveCustomPlan() {
    const title = bTitle.trim();
    if (!title) {
      alert('Give your plan a name.');
      return;
    }
    const steps = bSteps
      .filter((s) => s.title.trim())
      .map((s) => (s.time.trim() ? `${s.time.trim()} - ${s.title.trim()}` : s.title.trim()));
    if (steps.length === 0) {
      alert('Add at least one step.');
      return;
    }
    dispatch({ type: 'ADD_CUSTOM_PLAN', payload: { id: genId('p'), title, steps } });
    setBuildMode(false);
    onClose();
  }

  if (buildMode) {
    return (
      <div
        className="modal show"
        onClick={(e) => {
          if ((e.target as HTMLElement).classList.contains('modal')) {
            setBuildMode(false);
            onClose();
          }
        }}
      >
        <div className="mbox">
          <h3>Build a study plan</h3>
          <div className="mfield">
            <label>Plan name</label>
            <input
              type="text"
              placeholder="e.g. Essay sprint"
              value={bTitle}
              onChange={(e) => setBTitle(e.target.value)}
              autoFocus
            />
          </div>
          <div style={{ marginBottom: 8, fontSize: 12, fontWeight: 600, color: 'var(--muted)' }}>
            STEPS
          </div>
          {bSteps.map((step, i) => (
            <div key={i} className="builder-step">
              <input
                type="text"
                placeholder="Time (e.g. 20 min)"
                value={step.time}
                style={{ maxWidth: 110, flex: 'none' }}
                onChange={(e) =>
                  setBSteps((prev) =>
                    prev.map((s, j) => (j === i ? { ...s, time: e.target.value } : s)),
                  )
                }
              />
              <input
                type="text"
                placeholder="What to do"
                value={step.title}
                onChange={(e) =>
                  setBSteps((prev) =>
                    prev.map((s, j) => (j === i ? { ...s, title: e.target.value } : s)),
                  )
                }
              />
              <button
                className="rm"
                onClick={() => setBSteps((prev) => prev.filter((_, j) => j !== i))}
              >
                &#215;
              </button>
            </div>
          ))}
          <button
            className="b-add"
            onClick={() => setBSteps((prev) => [...prev, { time: '', title: '' }])}
          >
            + Add step
          </button>
          <div className="mbtns">
            <button className="b-ghost" onClick={() => setBuildMode(false)}>
              Cancel
            </button>
            <button className="b-primary" onClick={saveCustomPlan}>
              Save plan
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="modal show"
      onClick={(e) => {
        if ((e.target as HTMLElement).classList.contains('modal')) onClose();
      }}
    >
      <div className="mbox">
        {plan && cat ? (
          <>
            <h3>Study plan: {cat.name}</h3>
            <p className="sg">Goal: {plan.goal}</p>

            {/* Variant toggle */}
            {plan.variants.length > 1 && (
              <div className="vtoggle">
                {plan.variants.map((v, i) => (
                  <button
                    key={i}
                    className={i === variantIdx ? 'on' : ''}
                    onClick={() => setVariantIdx(i)}
                  >
                    {v.label}
                  </button>
                ))}
              </div>
            )}

            {/* Steps */}
            {variant?.steps.map((step, i) => {
              const key = `${variantIdx}-${i}`;
              return (
                <div key={key} className="sstep">
                  <div className="sstep-row">
                    <span className="smin">{step.time}</span>
                    <span dangerouslySetInnerHTML={{ __html: step.title }} />
                  </div>
                  {step.detail && (
                    <>
                      <button className="more-btn" onClick={() => toggleStep(key)}>
                        {openSteps[key] ? 'Less' : 'More'}
                      </button>
                      <div className={`sdetail${openSteps[key] ? ' open' : ''}`}>{step.detail}</div>
                    </>
                  )}
                </div>
              );
            })}

            {variant && (
              <div
                className="sweekly"
                dangerouslySetInnerHTML={{
                  __html: `<b>${variant.weekly.replace(/^Weekly: /, 'Weekly: ')}</b>`,
                }}
              />
            )}

            <div className="add-plan-row" onClick={openBuilder} style={{ marginTop: 16 }}>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                width="14"
                height="14"
              >
                <path d="M12 5v14" />
                <path d="M5 12h14" />
              </svg>
              Add your own study plan
            </div>
          </>
        ) : (
          <>
            <h3>Build a study plan</h3>
            <p className="sg">No built-in plan for this category. Build your own below.</p>
            <div className="add-plan-row" onClick={openBuilder}>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                width="14"
                height="14"
              >
                <path d="M12 5v14" />
                <path d="M5 12h14" />
              </svg>
              Create a plan
            </div>
          </>
        )}

        <button className="mclose" onClick={onClose}>
          Got it
        </button>
      </div>
    </div>
  );
}
