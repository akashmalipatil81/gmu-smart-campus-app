import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth';
import { api, User } from '../api';
import { ReservationRequest, Stats } from '../types';
import { Alert, Card, Info, errMsg } from '../ui';
import ClubsPanel from '../panels/ClubsPanel';
import EventsPanel from '../panels/EventsPanel';
import LibraryPanel from '../panels/LibraryPanel';
import ProjectsPanel from '../panels/ProjectsPanel';
import AdminPanel from '../panels/AdminPanel';
import ClubRequestsPanel from '../panels/ClubRequestsPanel';
import SimpleDataPanel from '../panels/SimpleDataPanel';

const ROLE_LABEL: Record<User['role'], string> = {
  student: 'Student Portal',
  faculty: 'Faculty Portal',
  admin: 'Admin Console',
};

const TABS: Record<User['role'], { id: string; label: string }[]> = {
  student: [
    { id: 'overview', label: 'Overview' },
    { id: 'clubs', label: 'Clubs' },
    { id: 'club-requests', label: 'Club requests' },
    { id: 'events', label: 'Events' },
    { id: 'library', label: 'Library' },
    { id: 'projects', label: 'Projects' },
    { id: 'announcements', label: 'Announcements' },
    { id: 'academics', label: 'Academics' },
    { id: 'notifications', label: 'Notifications' },
  ],
  faculty: [
    { id: 'overview', label: 'Overview' },
    { id: 'clubs', label: 'My clubs' },
    { id: 'club-requests', label: 'Membership requests' },
    { id: 'announcements', label: 'Announcements' },
    { id: 'academics', label: 'Academics' },
    { id: 'notifications', label: 'Notifications' },
    { id: 'events', label: 'Events' },
    { id: 'projects', label: 'Project reviews' },
  ],
  admin: [
    { id: 'overview', label: 'Overview' },
    { id: 'clubs', label: 'Manage clubs' },
    { id: 'events', label: 'Events' },
    { id: 'library', label: 'Library approvals' },
    { id: 'projects', label: 'Projects' },
    { id: 'users', label: 'Users' },
    { id: 'club-requests', label: 'Club requests' },
    { id: 'announcements', label: 'Announcements' },
    { id: 'academics', label: 'Academics' },
    { id: 'notifications', label: 'Notifications' },
  ],
};

function AdminOverview({ stats, onNavigate }: { stats: Stats | null; onNavigate: (tab: string) => void }) {
  const [reservationRequests, setReservationRequests] = useState<ReservationRequest[]>([]);
  const [clubRequests, setClubRequests] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      api<{ requests: ReservationRequest[] }>('/library/bookings/requests'),
      api<{ requests: unknown[] }>('/clubs/requests'),
    ])
      .then(([reservations, memberships]) => {
        if (cancelled) return;
        setReservationRequests(reservations.requests);
        setClubRequests(memberships.requests.length);
      })
      .catch((e) => {
        if (!cancelled) setError(errMsg(e));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const value = (count: number | undefined) => loading ? '…' : error ? '—' : count ?? 0;

  return (
    <div className="admin-layout">
      <div className="admin-heading">
        <div>
          <span className="eyebrow">CAMPUS ADMINISTRATION</span>
          <h2>Admin workspace</h2>
          <p>Review student requests and manage campus clubs and library access.</p>
        </div>
        <span className="admin-secure"><span aria-hidden="true">●</span> Admin workspace</span>
      </div>

      {error && <Alert kind="error">Unable to load the admin overview: {error}</Alert>}

      <div className="admin-metrics">
        <div className="admin-metric"><span>Pending seat reservations</span><strong>{value(reservationRequests.length)}</strong><small>Awaiting your decision</small></div>
        <div className="admin-metric"><span>Pending club requests</span><strong>{value(clubRequests ?? undefined)}</strong><small>Membership requests to review</small></div>
        <div className="admin-metric"><span>Student clubs</span><strong>{value(stats?.clubs)}</strong><small>Manage details and coordinators</small></div>
        <div className="admin-metric"><span>Library seats</span><strong>{value(stats?.seats)}</strong><small>Manage availability and maintenance</small></div>
      </div>

      <div className="admin-workflows">
        <Card title="Library reservation approvals">
          <p>Approve or reject student seat requests. Approved reservations are confirmed for the requested time.</p>
          <strong className="admin-workflow-count">{value(reservationRequests.length)} pending</strong>
          <button type="button" className="primary small" onClick={() => onNavigate('library')}>Review reservations</button>
        </Card>
        <Card title="Student club management">
          <p>Create clubs, update descriptions and faculty coordinators, and review club membership.</p>
          <strong className="admin-workflow-count">{value(stats?.clubs)} clubs</strong>
          <button type="button" className="primary small" onClick={() => onNavigate('clubs')}>Manage club details</button>
        </Card>
        <Card title="Club membership requests">
          <p>Review student requests to join clubs and approve or reject membership.</p>
          <strong className="admin-workflow-count">{value(clubRequests ?? undefined)} pending</strong>
          <button type="button" className="primary small" onClick={() => onNavigate('club-requests')}>Review club requests</button>
        </Card>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('overview');
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    if (user?.role === 'admin') {
      api<Stats>('/admin/stats').then(setStats).catch(() => setStats(null));
    }
  }, [user]);

  if (!user) return null;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <img src="/gmu-logo.svg" alt="" className="brand-logo" />
          <div>
            <strong>GM University</strong>
            <span>{ROLE_LABEL[user.role]}</span>
          </div>
        </div>
        <button className="ghost" onClick={handleLogout}>Logout</button>
      </header>

      <section className="hero">
        <p>{greeting},</p>
        <h1>{user.fullName}</h1>
        <p className="hero-sub">
          {user.department}
          {user.semester ? ` · Semester ${user.semester}` : ''} · Aadhaar {user.aadhaarMasked}
        </p>
      </section>

      <main className="container">
        <nav className="tabs">
          {TABS[user.role].map((t) => (
            <button key={t.id} className={tab === t.id ? 'tab active' : 'tab'} onClick={() => setTab(t.id)}>
              {t.label}
            </button>
          ))}
        </nav>

        {tab === 'overview' && user.role === 'admin' && (
          <AdminOverview stats={stats} onNavigate={setTab} />
        )}

        {tab === 'overview' && user.role !== 'admin' && (
          <div className="overview-stack">
            <div className="grid two">
              <Card title="Profile">
                <Info label="Full name" value={user.fullName} />
                <Info label="Aadhaar" value={user.aadhaarMasked} />
                <Info label="Mobile" value={user.mobile} />
                <Info label="Department" value={user.department} />
                <Info label="Semester" value={user.semester ? `Semester ${user.semester}` : ''} />
                <Info label="Role" value={ROLE_LABEL[user.role].replace(' Portal', '').replace(' Console', '')} />
              </Card>

              <Card title="Campus snapshot">
                <div className="quick-grid">
                  <button className="quick-card" onClick={() => setTab('clubs')}>
                    <span className="quick-label">Clubs</span>
                    <strong>{stats?.clubs ?? 0}</strong>
                    <small>Active groups</small>
                  </button>
                  <button className="quick-card gold" onClick={() => setTab('events')}>
                    <span className="quick-label">Events</span>
                    <strong>{stats?.upcomingEvents ?? 0}</strong>
                    <small>Scheduled</small>
                  </button>
                  <button className="quick-card purple" onClick={() => setTab('library')}>
                    <span className="quick-label">Library</span>
                    <strong>{stats?.seats ?? 0}</strong>
                    <small>Study seats</small>
                  </button>
                  <button className="quick-card green" onClick={() => setTab('projects')}>
                    <span className="quick-label">Projects</span>
                    <strong>{stats?.approvedProjects ?? 0}</strong>
                    <small>Approved</small>
                  </button>
                </div>
              </Card>
            </div>

            <Card title="Campus modules">
              <div className="module-grid">
                <button className="module-tile" onClick={() => setTab('clubs')}>
                  <span className="module-icon">🎓</span>
                  <strong>Clubs</strong>
                  <small>Student communities</small>
                </button>
                <button className="module-tile" onClick={() => setTab('events')}>
                  <span className="module-icon">📅</span>
                  <strong>Events</strong>
                  <small>Campus activities</small>
                </button>
                <button className="module-tile" onClick={() => setTab('library')}>
                  <span className="module-icon">📚</span>
                  <strong>Library</strong>
                  <small>Seat booking</small>
                </button>
                <button className="module-tile" onClick={() => setTab('projects')}>
                  <span className="module-icon">🚀</span>
                  <strong>Projects</strong>
                  <small>Collaboration</small>
                </button>
                <button className="module-tile" onClick={() => setTab('announcements')}>
                  <span className="module-icon">📢</span>
                  <strong>Announcements</strong>
                  <small>Latest updates</small>
                </button>
                <button className="module-tile" onClick={() => setTab('notifications')}>
                  <span className="module-icon">🔔</span>
                  <strong>Notifications</strong>
                  <small>My updates</small>
                </button>
              </div>
            </Card>
          </div>
        )}

        {tab === 'clubs' && <ClubsPanel me={user} />}
        {tab === 'club-requests' && <ClubRequestsPanel />}
        {tab === 'announcements' && <SimpleDataPanel kind="announcements" title="Announcements" me={user} />}
        {tab === 'academics' && <SimpleDataPanel kind="academics" title="Academic records" me={user} />}
        {tab === 'notifications' && <SimpleDataPanel kind="notifications" title="Notifications" me={user} />}
        {tab === 'events' && <EventsPanel me={user} />}
        {tab === 'library' && <LibraryPanel me={user} />}
        {tab === 'projects' && <ProjectsPanel me={user} />}
        {tab === 'users' && user.role === 'admin' && <AdminPanel />}
      </main>
    </div>
  );
}
