import { FormEvent, useEffect, useState } from 'react';
import { api, User } from '../api';
import { Club, EventItem, Registration } from '../types';
import { Card, Alert, Empty, errMsg, todayIST } from '../ui';

export default function EventsPanel({ me }: { me: User }) {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [showPast, setShowPast] = useState(false);
  const [editing, setEditing] = useState<EventItem | null>(null);
  const [regsFor, setRegsFor] = useState<EventItem | null>(null);
  const [regs, setRegs] = useState<Registration[]>([]);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  const canCreate = me.role === 'faculty' || me.role === 'admin';

  function load() {
    api<{ events: EventItem[] }>('/events').then((r) => setEvents(r.events)).catch((e) => setError(errMsg(e)));
  }

  useEffect(() => {
    load();
    if (canCreate) {
      api<{ clubs: Club[] }>('/clubs')
        .then((r) => setClubs(r.clubs.filter((c) => c.canManage)))
        .catch(() => setClubs([]));
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

  async function showRegistrations(ev: EventItem) {
    setRegsFor(ev);
    setError('');
    try {
      const r = await api<{ registrations: Registration[] }>(`/events/${ev.id}/registrations`);
      setRegs(r.registrations);
    } catch (e) {
      setError(errMsg(e));
    }
  }

  const visible = events.filter((e) => (showPast ? e.isPast : !e.isPast));

  return (
    <div className="grid two">
      <Card title="Events">
        {msg && <Alert kind="success">{msg}</Alert>}
        {error && <Alert kind="error">{error}</Alert>}
        <div className="row-actions">
          <button className={!showPast ? 'tab active' : 'tab'} onClick={() => setShowPast(false)}>Upcoming</button>
          <button className={showPast ? 'tab active' : 'tab'} onClick={() => setShowPast(true)}>Past</button>
        </div>

        {visible.length === 0 && <Empty>No {showPast ? 'past' : 'upcoming'} events.</Empty>}

        {visible.map((ev) => (
          <article key={ev.id} className="post">
            <header>
              <strong>{ev.title}</strong>
              <span className="pill">{ev.clubName}</span>
            </header>
            <p>{ev.description}</p>
            <small>{ev.date} · {ev.time} · {ev.venue}</small>
            <small>
              {ev.registrationCount}/{ev.capacity} registered · {ev.spotsLeft} spots left · by {ev.createdByName}
            </small>
            <div className="row-actions">
              {me.role === 'student' && !ev.isPast &&
                (ev.registered ? (
                  <button
                    className="ghost small"
                    onClick={() => run(() => api(`/events/${ev.id}/register`, { method: 'DELETE' }), 'Registration cancelled.')}
                  >
                    Cancel registration
                  </button>
                ) : (
                  <button
                    className="primary small"
                    disabled={ev.spotsLeft <= 0}
                    onClick={() => run(() => api(`/events/${ev.id}/register`, { method: 'POST' }), 'You are registered.')}
                  >
                    {ev.spotsLeft <= 0 ? 'Full' : 'Register'}
                  </button>
                ))}
              {ev.canManage && (
                <>
                  <button className="ghost small" onClick={() => setEditing(ev)}>Edit</button>
                  <button className="ghost small" onClick={() => showRegistrations(ev)}>Registrations</button>
                  <button
                    className="ghost small danger"
                    onClick={() => run(() => api(`/events/${ev.id}`, { method: 'DELETE' }), 'Event deleted.')}
                  >
                    Delete
                  </button>
                </>
              )}
            </div>
          </article>
        ))}
      </Card>

      <div className="stack">
        {canCreate && !editing && (
          <EventForm
            clubs={clubs}
            isAdmin={me.role === 'admin'}
            onSaved={(m) => {
              setMsg(m);
              load();
            }}
          />
        )}
        {editing && (
          <EventForm
            key={editing.id}
            initial={editing}
            clubs={clubs}
            isAdmin={me.role === 'admin'}
            onCancel={() => setEditing(null)}
            onSaved={(m) => {
              setEditing(null);
              setMsg(m);
              load();
            }}
          />
        )}
        {regsFor && (
          <Card title={`Registrations: ${regsFor.title}`}>
            {regs.length === 0 ? (
              <Empty>No students have registered yet.</Empty>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Department</th>
                      <th>Sem</th>
                    </tr>
                  </thead>
                  <tbody>
                    {regs.map((r) => (
                      <tr key={r.userId}>
                        <td>{r.name}</td>
                        <td>{r.department}</td>
                        <td>{r.semester}</td>
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

function EventForm({
  initial,
  clubs,
  isAdmin,
  onSaved,
  onCancel,
}: {
  initial?: EventItem;
  clubs: Club[];
  isAdmin: boolean;
  onSaved: (msg: string) => void;
  onCancel?: () => void;
}) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [date, setDate] = useState(initial?.date ?? todayIST());
  const [time, setTime] = useState(initial?.time ?? '10:00');
  const [venue, setVenue] = useState(initial?.venue ?? '');
  const [capacity, setCapacity] = useState(String(initial?.capacity ?? 50));
  const [clubId, setClubId] = useState(initial?.clubId ? String(initial.clubId) : '');
  const [error, setError] = useState('');

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError('');
    try {
      if (initial) {
        await api(`/events/${initial.id}`, {
          method: 'PATCH',
          body: { title, description, date, time, venue, capacity: Number(capacity) },
        });
        onSaved('Event updated.');
      } else {
        await api('/events', {
          method: 'POST',
          body: {
            title,
            description,
            date,
            time,
            venue,
            capacity: Number(capacity),
            clubId: clubId ? Number(clubId) : null,
          },
        });
        setTitle('');
        setDescription('');
        setVenue('');
        onSaved('Event created.');
      }
    } catch (err) {
      setError(errMsg(err));
    }
  }

  return (
    <Card title={initial ? `Edit ${initial.title}` : 'Create event'}>
      {error && <Alert kind="error">{error}</Alert>}
      {!initial && clubs.length === 0 && !isAdmin && (
        <p className="hint">You coordinate no clubs yet, so you cannot create events.</p>
      )}
      <form className="subform" onSubmit={submit}>
        <label>
          Title
          <input value={title} onChange={(e) => setTitle(e.target.value)} required />
        </label>
        <label>
          Description
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} />
        </label>
        <div className="form-grid">
          <label>
            Date
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
          </label>
          <label>
            Time
            <input type="time" value={time} onChange={(e) => setTime(e.target.value)} required />
          </label>
          <label>
            Venue
            <input value={venue} onChange={(e) => setVenue(e.target.value)} required />
          </label>
          <label>
            Capacity
            <input type="number" min={1} max={5000} value={capacity} onChange={(e) => setCapacity(e.target.value)} required />
          </label>
          {!initial && (
            <label className="full">
              Club
              <select value={clubId} onChange={(e) => setClubId(e.target.value)} required={!isAdmin}>
                <option value="">{isAdmin ? 'General (no club)' : 'Select your club'}</option>
                {clubs.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </label>
          )}
        </div>
        <div className="row-actions">
          <button className="primary" disabled={!initial && !isAdmin && clubs.length === 0}>
            {initial ? 'Save changes' : 'Create event'}
          </button>
          {onCancel && (
            <button type="button" className="ghost" onClick={onCancel}>Cancel</button>
          )}
        </div>
      </form>
    </Card>
  );
}
