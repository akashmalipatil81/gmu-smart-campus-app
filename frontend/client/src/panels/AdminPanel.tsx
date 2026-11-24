import { ChangeEvent, FormEvent, useEffect, useState } from 'react';
import { api, User } from '../api';
import { DEPARTMENTS } from '../constants';
import { Card, Alert, Empty, errMsg } from '../ui';

const emptyFaculty = { fullName: '', aadhaar: '', email: '', mobile: '', department: DEPARTMENTS[0], password: '' };

export default function AdminPanel() {
  const [q, setQ] = useState('');
  const [role, setRole] = useState('');
  const [status, setStatus] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [form, setForm] = useState(emptyFaculty);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  function load() {
    const params = new URLSearchParams({ q, role });
    api<{ users: User[] }>(`/admin/users?${params}`)
      .then((r) => setUsers(r.users))
      .catch((e) => setError(errMsg(e)));
  }

  useEffect(() => {
    load();
  }, [q, role]);

  const set =
    (key: keyof typeof emptyFaculty) =>
    (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm({ ...form, [key]: e.target.value });

  async function createFaculty(e: FormEvent) {
    e.preventDefault();
    setMsg('');
    setError('');
    try {
      await api('/admin/faculty', {
        method: 'POST',
        body: { ...form },
      });
      setMsg(`Faculty account created for ${form.fullName}.`);
      setForm(emptyFaculty);
      load();
    } catch (err) {
      setError(errMsg(err));
    }
  }

  async function toggle(u: User) {
    setMsg('');
    setError('');
    try {
      await api(`/admin/users/${u.id}`, { method: 'PATCH', body: { active: !u.active } });
      setMsg(`${u.fullName} ${u.active ? 'disabled' : 'enabled'}.`);
      load();
    } catch (err) {
      setError(errMsg(err));
    }
  }

  const visibleUsers = users.filter((u) => !status || (status === 'active' ? u.active : !u.active));
  const activeCount = visibleUsers.filter((u) => u.active).length;
  const studentCount = visibleUsers.filter((u) => u.role === 'student').length;
  const facultyCount = visibleUsers.filter((u) => u.role === 'faculty').length;

  return (
    <div className="admin-layout">
      <div className="admin-heading">
        <div>
          <span className="eyebrow">CAMPUS ADMINISTRATION</span>
          <h2>People & access</h2>
          <p>Manage campus accounts, roles and faculty access.</p>
        </div>
        <span className="admin-secure"><span aria-hidden="true">●</span> Admin workspace</span>
      </div>

      <div className="admin-metrics">
        <div className="admin-metric"><span>Matching users</span><strong>{visibleUsers.length}</strong><small>Current filter results</small></div>
        <div className="admin-metric"><span>Active accounts</span><strong>{activeCount}</strong><small>In current results</small></div>
        <div className="admin-metric"><span>Students</span><strong>{studentCount}</strong><small>In current results</small></div>
        <div className="admin-metric"><span>Faculty</span><strong>{facultyCount}</strong><small>In current results</small></div>
      </div>

      <div className="grid two admin-content">
      <Card title="User directory">
        {msg && <Alert kind="success">{msg}</Alert>}
        {error && <Alert kind="error">{error}</Alert>}
        <div className="filters">
          <input aria-label="Search users" placeholder="Search name or masked Aadhaar" value={q} onChange={(e) => setQ(e.target.value)} />
          <select value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="">All roles</option>
            <option value="student">Students</option>
            <option value="faculty">Faculty</option>
            <option value="admin">Admins</option>
          </select>
          <select aria-label="Filter by account status" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">Any status</option>
            <option value="active">Active</option>
            <option value="disabled">Disabled</option>
          </select>
        </div>
        <div className="directory-meta"><span>{visibleUsers.length} {visibleUsers.length === 1 ? 'account' : 'accounts'}</span><span>Search updates as you type</span></div>
        {visibleUsers.length === 0 && <Empty>No users match these filters.</Empty>}
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th scope="col">Person</th>
                <th scope="col">Role</th>
                <th scope="col">Department</th>
                <th scope="col">Account</th>
                <th scope="col"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {visibleUsers.map((u) => (
                <tr key={u.id}>
                  <td>
                    <div className="person-cell">
                      <span className={`person-avatar ${u.role}`}>{u.fullName.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase()}</span>
                      <span><strong>{u.fullName}</strong><small>{u.email || u.aadhaarMasked}</small></span>
                    </div>
                  </td>
                  <td><span className={`role-tag ${u.role}`}>{u.role}</span></td>
                  <td>{u.department || '—'}{u.semester && <small className="table-subtext">Semester {u.semester}</small>}</td>
                  <td><span className={`status-tag ${u.active ? 'active' : 'disabled'}`}><i />{u.active ? 'Active' : 'Disabled'}</span></td>
                  <td>
                    {u.role !== 'admin' && (
                      <button className={`ghost small ${u.active ? 'danger' : ''}`} onClick={() => toggle(u)} aria-label={`${u.active ? 'Disable' : 'Enable'} ${u.fullName}`}>
                        {u.active ? 'Disable' : 'Enable'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card title="Create faculty account">
        <p className="panel-intro">Set up faculty access for a campus department. Share the temporary password securely with the account holder.</p>
        <form className="form-grid" onSubmit={createFaculty}>
          <label className="full">
            Full name
            <input value={form.fullName} onChange={set('fullName')} required />
          </label>
          <label>
            Aadhaar number
            <input inputMode="numeric" maxLength={14} placeholder="12-digit Aadhaar" value={form.aadhaar} onChange={set('aadhaar')} required />
          </label>
          <label>
            Email
            <input type="email" value={form.email} onChange={set('email')} required />
          </label>
          <label>
            Mobile
            <input inputMode="numeric" maxLength={10} value={form.mobile} onChange={set('mobile')} required />
          </label>
          <label className="full">
            Department
            <select value={form.department} onChange={set('department')}>
              {DEPARTMENTS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </label>
          <label className="full">
            Temporary password
            <input type="password" autoComplete="new-password" value={form.password} onChange={set('password')} required />
          </label>
          <button className="primary full">Create faculty account</button>
        </form>
        <p className="hint">Faculty sign in using their Aadhaar number and temporary password. Do not share account details publicly.</p>
      </Card>
      </div>
    </div>
  );
}
