import { FormEvent, useEffect, useState } from 'react';
import { api, User } from '../api';
import { MyBooking, ReservationRequest, Seat } from '../types';
import { Card, Alert, Empty, errMsg, todayIST } from '../ui';

export default function LibraryPanel({ me }: { me: User }) {
  const isStudent = me.role === 'student';
  const isAdmin = me.role === 'admin';
  const [date, setDate] = useState(todayIST());
  const [seats, setSeats] = useState<Seat[]>([]);
  const [myBookings, setMyBookings] = useState<MyBooking[]>([]);
  const [reservationRequests, setReservationRequests] = useState<ReservationRequest[]>([]);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  const [seatId, setSeatId] = useState('');
  const [start, setStart] = useState('09:00');
  const [end, setEnd] = useState('11:00');
  const [code, setCode] = useState('');
  const [floor, setFloor] = useState('');

  function loadSeats(d: string) {
    api<{ seats: Seat[] }>(`/library/seats?date=${d}`)
      .then((r) => {
        setSeats(r.seats);
        setSeatId((prev) => (prev && r.seats.some((s) => String(s.id) === prev) ? prev : r.seats[0] ? String(r.seats[0].id) : ''));
      })
      .catch((e) => setError(errMsg(e)));
  }

  function loadMine() {
    api<{ bookings: MyBooking[] }>('/library/bookings/mine')
      .then((r) => setMyBookings(r.bookings))
      .catch((e) => setError(errMsg(e)));
  }

  function loadRequests() {
    api<{ requests: ReservationRequest[] }>('/library/bookings/requests')
      .then((r) => setReservationRequests(r.requests))
      .catch((e) => setError(errMsg(e)));
  }

  useEffect(() => {
    loadSeats(date);
  }, [date]);

  useEffect(() => {
    if (isStudent) loadMine();
    if (isAdmin) loadRequests();
  }, []);

  function refresh() {
    loadSeats(date);
    if (isStudent) loadMine();
    if (isAdmin) loadRequests();
  }

  async function run(fn: () => Promise<unknown>, ok: string) {
    setMsg('');
    setError('');
    try {
      await fn();
      setMsg(ok);
      refresh();
    } catch (e) {
      setError(errMsg(e));
    }
  }

  function book(e: FormEvent) {
    e.preventDefault();
    run(
      () => api('/library/bookings', { method: 'POST', body: { seatId: Number(seatId), date, start, end } }),
      'Reservation request sent for administrator approval.'
    );
  }

  function addSeat(e: FormEvent) {
    e.preventDefault();
    run(async () => {
      await api('/library/seats', { method: 'POST', body: { code, floor } });
      setCode('');
      setFloor('');
    }, 'Seat added.');
  }

  return (
    <div className="grid two">
      <Card title="Seats">
        {msg && <Alert kind="success">{msg}</Alert>}
        {error && <Alert kind="error">{error}</Alert>}
        <label>
          Date
          <input type="date" value={date} min={todayIST()} onChange={(e) => setDate(e.target.value)} />
        </label>
        <p className="hint">Library hours 08:00–22:00. Maximum 4 hours per booking, one booking per student per day.</p>
        {seats.length === 0 ? (
          <Empty>No seats have been set up yet.</Empty>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Seat</th>
                  <th>Floor</th>
                  <th>Status</th>
                  <th>Booked times</th>
                  {isAdmin && <th></th>}
                </tr>
              </thead>
              <tbody>
                {seats.map((s) => (
                  <tr key={s.id}>
                    <td>{s.code}</td>
                    <td>{s.floor || '—'}</td>
                    <td><span className={s.status === 'MAINTENANCE' ? 'badge-off' : 'badge-on'}>{s.status || 'AVAILABLE'}</span>{isAdmin && <button className="ghost small" onClick={() => run(() => api(`/library/seats/${s.id}`, { method: 'PATCH', body: { status: s.status === 'MAINTENANCE' ? 'AVAILABLE' : 'MAINTENANCE' } }), 'Seat status updated.')}>{s.status === 'MAINTENANCE' ? 'Enable' : 'Maintenance'}</button>}</td>
                    <td>
                      {s.bookings.length === 0 && <span className="hint">Free all day</span>}
                      {s.bookings.map((b) => (
                        <div key={b.id}>
                          {b.start}–{b.end} ·{' '}
                          {b.mine ? (
                            <span className="badge-on">You</span>
                          ) : isAdmin ? (
                            b.bookedBy
                          ) : (
                            'Reserved'
                          )}{b.status === 'PENDING' && <span className="hint"> · Pending approval</span>}
                        </div>
                      ))}
                    </td>
                    {isAdmin && (
                      <td>
                        <button
                          className="ghost small danger"
                          onClick={() => run(() => api(`/library/seats/${s.id}`, { method: 'DELETE' }), 'Seat removed.')}
                        >
                          Remove
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <div className="stack">
        {isStudent && (
          <Card title="Book a seat">
            <form className="subform" onSubmit={book}>
              <label>
                Seat
                <select value={seatId} onChange={(e) => setSeatId(e.target.value)} required>
                  {seats.length === 0 && <option value="">No seats available</option>}
                  {seats.map((s) => (
                    <option key={s.id} value={s.id}>{s.code} · {s.floor || 'Floor not set'}</option>
                  ))}
                </select>
              </label>
              <div className="form-grid">
                <label>
                  From
                  <input type="time" value={start} onChange={(e) => setStart(e.target.value)} required />
                </label>
                <label>
                  To
                  <input type="time" value={end} onChange={(e) => setEnd(e.target.value)} required />
                </label>
              </div>
              <button className="primary" disabled={!seatId}>Request seat</button>
            </form>
          </Card>
        )}

        {isStudent && (
          <Card title="My reservation requests">
            {myBookings.length === 0 ? (
              <Empty>You have no upcoming bookings.</Empty>
            ) : (
              myBookings.map((b) => (
                <div key={b.id} className="info">
                  <span>
                    {b.date} · {b.start}–{b.end} · {b.seatCode || 'Seat unavailable'} ·{' '}
                    {b.status === 'PENDING' ? 'Pending approval' : b.status === 'REJECTED' ? 'Declined' : 'Confirmed'}
                  </span>
                  <button
                    className="ghost small danger"
                    onClick={() => run(() => api(`/library/bookings/${b.id}`, { method: 'DELETE' }), 'Booking cancelled.')}
                  >
                    {b.status === 'REJECTED' ? 'Dismiss' : 'Cancel'}
                  </button>
                </div>
              ))
            )}
          </Card>
        )}

        {isAdmin && (
          <Card title="Add seat">
            <form className="subform" onSubmit={addSeat}>
              <div className="form-grid">
                <label>
                  Seat code
                  <input placeholder="e.g. A12" value={code} onChange={(e) => setCode(e.target.value)} required />
                </label>
                <label>
                  Floor / section
                  <input placeholder="e.g. Ground floor" value={floor} onChange={(e) => setFloor(e.target.value)} />
                </label>
              </div>
              <button className="primary">Add seat</button>
            </form>
          </Card>
        )}

        {isAdmin && (
          <Card title="Library reservation requests">
            {reservationRequests.length === 0 ? (
              <Empty>No pending library reservation requests.</Empty>
            ) : (
              reservationRequests.map((request) => (
                <article className="post" key={request.id}>
                  <strong>{request.studentName}</strong>
                  <p>{request.department}{request.semester ? ` · Semester ${request.semester}` : ''}</p>
                  <p>{request.date} · {request.start}–{request.end} · Seat {request.seatCode}</p>
                  <div className="row-actions">
                    <button
                      className="primary small"
                      onClick={() => run(
                        () => api(`/library/bookings/${request.id}/decision`, { method: 'POST', body: { decision: 'APPROVE' } }),
                        'Reservation approved.'
                      )}
                    >
                      Approve
                    </button>
                    <button
                      className="ghost small danger"
                      onClick={() => run(
                        () => api(`/library/bookings/${request.id}/decision`, { method: 'POST', body: { decision: 'REJECT' } }),
                        'Reservation rejected.'
                      )}
                    >
                      Reject
                    </button>
                  </div>
                </article>
              ))
            )}
          </Card>
        )}
      </div>
    </div>
  );
}
