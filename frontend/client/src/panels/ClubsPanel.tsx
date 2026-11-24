import { FormEvent, useEffect, useState } from 'react';
import { api, User } from '../api';
import { Club, ClubMember } from '../types';
import { Card, Alert, Empty, errMsg } from '../ui';

export default function ClubsPanel({ me }: { me: User }) {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [faculty, setFaculty] = useState<User[]>([]);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [openId, setOpenId] = useState<number | null>(null);
  const [members, setMembers] = useState<ClubMember[]>([]);
  const [editing, setEditing] = useState<Club | null>(null);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [coordinatorId, setCoordinatorId] = useState('');

  function load() {
    api<{ clubs: Club[] }>('/clubs').then((r) => setClubs(r.clubs)).catch((e) => setError(errMsg(e)));
  }

  useEffect(() => {
    load();
    if (me.role === 'admin') {
      api<{ users: User[] }>('/admin/users?role=faculty')
        .then((r) => setFaculty(r.users.filter((u) => u.active)))
        .catch(() => setFaculty([]));
    }
  }, []);

  async function run(fn: () => Promise<unknown>, ok: string) {
    setMsg('');
    setError('');
    try {
      await fn();
      setMsg(ok);
      load();
    } catch (e) {
      setError(errMsg(e));
    }
  }

  async function openMembers(id: number) {
    setOpenId(id);
    setError('');
    try {
      const r = await api<{ members: ClubMember[] }>(`/clubs/${id}/members`);
      setMembers(r.members);
    } catch (e) {
      setMembers([]);
      setError(errMsg(e));
    }
  }

  function createClub(e: FormEvent) {
    e.preventDefault();
    run(async () => {
      const body = me.role === 'admin'
        ? { name, description, coordinatorId: Number(coordinatorId) }
        : { name, description };
      await api('/clubs', { method: 'POST', body });
      setName('');
      setDescription('');
      setCoordinatorId('');
    }, me.role === 'student' ? 'Club created. You are now its host.' : 'Club created.');
  }

  return (
    <div className="grid two">
      <Card title="Clubs">
        {msg && <Alert kind="success">{msg}</Alert>}
        {error && <Alert kind="error">{error}</Alert>}
        {clubs.length === 0 && <Empty>No clubs have been created yet.</Empty>}
        {clubs.map((c) => (
          <article key={c.id} className="post">
            <header>
              <strong>{c.name}</strong>
              <span className="pill">{c.memberCount} members</span>
            </header>
            <p>{c.description || 'No description.'}</p>
            <small>Coordinator: {c.coordinatorName || '—'}</small>
            <div className="row-actions">
              {me.role === 'student' && c.coordinatorId !== me.id &&
                (c.joined ? (
                  <button className="ghost small" onClick={() => run(() => api(`/clubs/${c.id}/join`, { method: 'DELETE' }), 'You left the club.')}>
                    Leave club
                  </button>
                ) : c.pendingRequest ? (
                  <button className="ghost small" disabled>Request pending</button>
                ) : (
                  <button className="primary small" onClick={() => run(() => api(`/clubs/${c.id}/join`, { method: 'POST' }), 'Membership request sent to the club coordinator.')}>
                    Request to join
                  </button>
                ))}
              {c.canManage && (
                <>
                  <button className="ghost small" onClick={() => openMembers(c.id)}>View members</button>
                  <button className="ghost small" onClick={() => setEditing(c)}>Edit</button>
                </>
              )}
              {me.role === 'admin' && (
                <button className="ghost small danger" onClick={() => run(() => api(`/clubs/${c.id}`, { method: 'DELETE' }), 'Club deleted.')}>
                  Delete
                </button>
              )}
            </div>
          </article>
        ))}
      </Card>

      <div className="stack">
        {(me.role === 'admin' || me.role === 'student') && (
          <Card title={me.role === 'student' ? 'Start a student club' : 'Create club'}>
            <form className="subform" onSubmit={createClub}>
              <label>
                Club name
                <input value={name} onChange={(e) => setName(e.target.value)} required />
              </label>
              <label>
                Description
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} />
              </label>
              {me.role === 'admin' && (
                <>
                  <label>
                    Faculty coordinator
                    <select value={coordinatorId} onChange={(e) => setCoordinatorId(e.target.value)} required>
                      <option value="" disabled>Select faculty</option>
                      {faculty.map((f) => (
                        <option key={f.id} value={f.id}>{f.fullName} · {f.department}</option>
                      ))}
                    </select>
                  </label>
                  {faculty.length === 0 && <p className="hint">Create a faculty account in the Users tab first.</p>}
                </>
              )}
              {me.role === 'student' && <p className="hint">You will be the club host and can review student membership requests.</p>}
              <button className="primary">{me.role === 'student' ? 'Create and host club' : 'Create club'}</button>
            </form>
          </Card>
        )}

        {editing && (
          <EditClub
            key={editing.id}
            club={editing}
            faculty={faculty}
            isAdmin={me.role === 'admin'}
            onDone={(m) => {
              setEditing(null);
              setMsg(m);
              load();
            }}
            onCancel={() => setEditing(null)}
          />
        )}

        {openId !== null && (
          <Card title="Members">
            {members.length === 0 ? (
              <Empty>No approved members yet.</Empty>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Department</th>
                      <th>Sem</th>
                      <th>University ID</th>
                    </tr>
                  </thead>
                  <tbody>
                    {members.map((m) => (
                      <tr key={m.userId}>
                        <td>{m.name}</td>
                        <td>{m.department}</td>
                        <td>{m.semester}</td>
                        <td>{m.aadhaarMasked}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}

function EditClub({
  club,
  faculty,
  isAdmin,
  onDone,
  onCancel,
}: {
  club: Club;
  faculty: User[];
  isAdmin: boolean;
  onDone: (msg: string) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(club.name);
  const [description, setDescription] = useState(club.description);
  const [coordinatorId, setCoordinatorId] = useState(club.coordinatorId ? String(club.coordinatorId) : '');
  const [error, setError] = useState('');

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError('');
    const body: Record<string, unknown> = { description };
    if (isAdmin) {
      body.name = name;
      body.coordinatorId = Number(coordinatorId);
    }
    try {
      await api(`/clubs/${club.id}`, { method: 'PATCH', body });
      onDone('Club updated.');
    } catch (err) {
      setError(errMsg(err));
    }
  }

  return (
    <Card title={`Edit ${club.name}`}>
      {error && <Alert kind="error">{error}</Alert>}
      <form className="subform" onSubmit={submit}>
        <label>
          Club name
          <input value={name} onChange={(e) => setName(e.target.value)} disabled={!isAdmin} required />
        </label>
        <label>
          Description
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} />
        </label>
        {isAdmin && (
          <label>
            Faculty coordinator
            <select value={coordinatorId} onChange={(e) => setCoordinatorId(e.target.value)} required>
              {faculty.map((f) => (
                <option key={f.id} value={f.id}>{f.fullName} · {f.department}</option>
              ))}
            </select>
          </label>
        )}
        <div className="row-actions">
          <button className="primary">Save changes</button>
          <button type="button" className="ghost" onClick={onCancel}>Cancel</button>
        </div>
      </form>
    </Card>
  );
}

