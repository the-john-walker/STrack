import { useState } from 'react';
import { useStore } from '../state/store';
import { sessionMin, fmtMins, shortDate } from '../lib/utils';
import type { Session } from '../state/types';

interface ConfirmState {
  msg: string;
  danger?: boolean;
  onYes: () => void;
}

export default function History() {
  const { state, dispatch } = useStore();
  const [confirm, setConfirm] = useState<ConfirmState | null>(null);
  const [trashOpen, setTrashOpen] = useState(false);

  const sorted = [...state.sessions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );

  function askDelete(s: Session) {
    setConfirm({
      msg: 'Delete this session?',
      onYes: () => {
        dispatch({ type: 'DELETE_SESSION', payload: s.id });
        setConfirm(null);
      },
    });
  }

  function restore(id: string) {
    dispatch({ type: 'RESTORE_SESSION', payload: id });
  }

  function clearTrash() {
    setConfirm({
      msg: 'Permanently delete all trashed sessions?',
      danger: true,
      onYes: () => {
        dispatch({ type: 'CLEAR_TRASH' });
        setConfirm(null);
      },
    });
  }

  function restoreAll() {
    dispatch({ type: 'RESTORE_ALL' });
  }

  return (
    <div className="card span-full">
      <h2>History</h2>

      {sorted.length === 0 ? (
        <div className="empty">No sessions yet. Log your first one above.</div>
      ) : (
        sorted.map((s) => {
          const { day, mo } = shortDate(s.date);
          const mins = sessionMin(s);
          const subjects = s.items.map((i) => i.subject).join(', ');
          return (
            <div key={s.id} className="h-row">
              <div className="h-date-col">
                <div className="h-day">{day}</div>
                <div className="h-mo">{mo}</div>
              </div>
              <div className="h-body">
                <div className="h-subj">{subjects || 'Session'}</div>
                <div
                  style={{
                    display: 'flex',
                    gap: 10,
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    marginTop: 2,
                  }}
                >
                  <span className="h-min">{fmtMins(mins)}</span>
                  {s.method && <span className="h-meta">{s.method}</span>}
                </div>
                {s.notes && <div className="h-notes">{s.notes}</div>}
              </div>
              <button className="h-del" onClick={() => askDelete(s)} title="Delete">
                &#215;
              </button>
            </div>
          );
        })
      )}

      {/* Trash section */}
      {state.trash.length > 0 && (
        <div className="trash-bar">
          <div className="trash-head" onClick={() => setTrashOpen((o) => !o)}>
            <span>Recently deleted ({state.trash.length})</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <span style={{ fontWeight: 600, color: 'var(--slate)', fontSize: 12 }}>
                {trashOpen ? 'Hide' : 'Show'}
              </span>
              {trashOpen && (
                <button
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: 'var(--sage)',
                    background: 'none',
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    restoreAll();
                  }}
                >
                  Restore all
                </button>
              )}
              {trashOpen && (
                <button
                  style={{ fontSize: 12, fontWeight: 600, color: '#B4533F', background: 'none' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    clearTrash();
                  }}
                >
                  Clear all
                </button>
              )}
            </div>
          </div>
          {trashOpen && (
            <div className="trash-list">
              {[...state.trash].reverse().map((s) => {
                const { day, mo } = shortDate(s.date);
                const subjects = s.items.map((i) => i.subject).join(', ');
                return (
                  <div key={s.id} className="t-row">
                    <span className="t-info">
                      {mo} {day} &middot; {subjects || 'Session'} &middot; {fmtMins(sessionMin(s))}
                    </span>
                    <button className="t-restore" onClick={() => restore(s.id)}>
                      Restore
                    </button>
                  </div>
                );
              })}
            </div>
          )}
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
