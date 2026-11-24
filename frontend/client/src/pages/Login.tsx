import { FormEvent, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const notice = (location.state as { message?: string } | null)?.message;

  const [accountType, setAccountType] = useState<'student' | 'admin'>('student');
  const [aadhaar, setAadhaar] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await login(aadhaar.replace(/[\s-]/g, ''), password, accountType === 'admin');
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-hero">
        <img src="/gmu-logo.svg" alt="GM University logo" className="auth-logo" />
        <h1>GM University</h1>
        <p className="tagline">Innovating Minds</p>
      </div>

      <form className="auth-card" onSubmit={onSubmit}>
        <h2>Sign in</h2>
        {notice && <div className="alert success">{notice}</div>}
        {error && <div className="alert error">{error}</div>}

        <div className="account-type">
          <span>Sign in as</span>
          <div className="account-type-options" role="group" aria-label="Choose account type">
            <button
              type="button"
              className={accountType === 'student' ? 'account-type-option active' : 'account-type-option'}
              aria-pressed={accountType === 'student'}
              onClick={() => { setAccountType('student'); setError(''); }}
            >
              Student
            </button>
            <button
              type="button"
              className={accountType === 'admin' ? 'account-type-option active' : 'account-type-option'}
              aria-pressed={accountType === 'admin'}
              onClick={() => { setAccountType('admin'); setError(''); }}
            >
              Admin
            </button>
          </div>
        </div>

        <label>
          Aadhaar number (username)
          <input
            inputMode="numeric"
            autoComplete="username"
            placeholder="12-digit Aadhaar"
            maxLength={14}
            value={aadhaar}
            onChange={(e) => setAadhaar(e.target.value)}
            required
          />
        </label>

        <label>
          Password
          <div className="pw-row">
            <input
              type={showPw ? 'text' : 'password'}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button type="button" className="ghost" onClick={() => setShowPw((s) => !s)}>
              {showPw ? 'Hide' : 'Show'}
            </button>
          </div>
        </label>

        <button className="primary block" disabled={busy}>
          {busy ? 'Signing in…' : `Sign in as ${accountType === 'admin' ? 'Admin' : 'Student'}`}
        </button>

        {accountType === 'student' && (
          <p className="switch">
            New student? <Link to="/register">Create an account</Link>
          </p>
        )}
      </form>
    </div>
  );
}
