import { ChangeEvent, FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { DEPARTMENTS, SEMESTERS } from '../constants';

const emptyForm = {
  fullName: '',
  aadhaar: '',
  email: '',
  mobile: '',
  department: '',
  semester: '',
  password: '',
  confirm: '',
};

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const set =
    (key: keyof typeof emptyForm) =>
    (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm({ ...form, [key]: e.target.value });

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm) {
      setError('Passwords do not match.');
      return;
    }
    setBusy(true);
    try {
      await api('/auth/register', {
        method: 'POST',
        body: {
          fullName: form.fullName,
          aadhaar: form.aadhaar.replace(/[\s-]/g, ''),
          email: form.email.trim(),
          mobile: form.mobile,
          department: form.department,
          semester: form.semester,
          password: form.password,
        },
      });
      navigate('/login', {
        replace: true,
        state: { message: 'Registration successful. Sign in with your Aadhaar number and password.' },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-hero">
        <img src="/gmu-logo.svg" alt="GM University logo" className="auth-logo" />
        <h1>Student Registration</h1>
        <p className="tagline">Use your Aadhaar details</p>
      </div>

      <form className="auth-card wide" onSubmit={onSubmit}>
        {error && <div className="alert error">{error}</div>}

        <div className="form-grid">
          <label className="full">
            Full name (as per Aadhaar)
            <input value={form.fullName} onChange={set('fullName')} required />
          </label>
          <label>
            Aadhaar number (username)
            <input inputMode="numeric" placeholder="12-digit Aadhaar" maxLength={14} value={form.aadhaar} onChange={set('aadhaar')} required />
          </label>
          <label>
            Email (optional)
            <input type="email" value={form.email} onChange={set('email')} />
          </label>
          <label>
            Mobile number
            <input inputMode="numeric" maxLength={10} value={form.mobile} onChange={set('mobile')} required />
          </label>
          <label>
            Department
            <select value={form.department} onChange={set('department')} required>
              <option value="" disabled>Select department</option>
              {DEPARTMENTS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </label>
          <label>
            Semester
            <select value={form.semester} onChange={set('semester')} required>
              <option value="" disabled>Select semester</option>
              {SEMESTERS.map((s) => (
                <option key={s} value={s}>Semester {s}</option>
              ))}
            </select>
          </label>
          <label>
            Password
            <input type="password" autoComplete="new-password" value={form.password} onChange={set('password')} required />
          </label>
          <label>
            Confirm password
            <input type="password" autoComplete="new-password" value={form.confirm} onChange={set('confirm')} required />
          </label>
        </div>

        <p className="hint">Password: at least 8 characters, with a letter and a number.</p>

        <button className="primary block" disabled={busy}>
          {busy ? 'Registering…' : 'Register'}
        </button>

        <p className="switch">
          Already registered? <Link to="/login">Sign in</Link>
        </p>
      </form>
    </div>
  );
}
