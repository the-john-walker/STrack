import { useState } from 'react';
import { supabase } from '../lib/supabase';

type Status = 'idle' | 'sending' | 'sent' | 'error';

export default function Auth() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  async function sendLink(e: React.FormEvent) {
    e.preventDefault();
    const addr = email.trim();
    if (!addr || !supabase) return;
    setStatus('sending');
    const { error } = await supabase.auth.signInWithOtp({
      email: addr,
      options: { emailRedirectTo: window.location.origin },
    });
    if (error) {
      setErrorMsg(error.message);
      setStatus('error');
    } else {
      setStatus('sent');
    }
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="auth-brand">
          <svg className="brand-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <rect x="3.5" y="3.5" width="17" height="17" rx="4.5" stroke="currentColor" strokeWidth="1.8" />
            <path
              d="M8 12.2L10.8 15L16.5 9"
              stroke="currentColor"
              strokeWidth="1.9"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className="wordmark">STrack</span>
        </div>

        <h1>Sign in</h1>
        <p>Enter your email and we will send you a magic link. No password needed.</p>

        {status === 'sent' ? (
          <div className="auth-sent">
            Check <b>{email}</b> for your sign in link, then open it on this device.
          </div>
        ) : (
          <form onSubmit={sendLink}>
            <input
              type="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <button className="auth-btn" type="submit" disabled={status === 'sending'}>
              {status === 'sending' ? 'Sending...' : 'Send magic link'}
            </button>
            {status === 'error' && <div className="auth-error">{errorMsg}</div>}
          </form>
        )}
      </div>
    </div>
  );
}
