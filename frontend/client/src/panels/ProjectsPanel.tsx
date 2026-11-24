import { FormEvent, useEffect, useState } from 'react';
import { api, User } from '../api';
import { Project, ProjectDetail } from '../types';
import { Card, Alert, Empty, errMsg } from '../ui';

const STATUS: Record<Project['status'], { label: string; cls: string }> = {
  proposed: { label: 'Awaiting review', cls: 'wait' },
  approved: { label: 'Approved', cls: 'ok' },
  rejected: { label: 'Rejected', cls: 'bad' },
};

export default function ProjectsPanel({ me }: { me: User }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [openId, setOpenId] = useState<number | null>(null);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [skillsNeeded, setSkillsNeeded] = useState('');
  const [projectView, setProjectView] = useState<'open' | 'hosted' | 'all'>('open');
  const isStudent = me.role === 'student';

  function load() {
    api<{ projects: Project[] }>('/projects').then((r) => setProjects(r.projects)).catch((e) => setError(errMsg(e)));
  }

  useEffect(() => {
    load();
  }, []);

  function createProject(e: FormEvent) {
    e.preventDefault();
    setMsg('');
    setError('');
    api('/projects', { method: 'POST', body: { title, description, skillsNeeded } })
      .then(() => {
        setMsg('Project proposed. A faculty member will review it.');
        setTitle('');
        setDescription('');
        setSkillsNeeded('');
        load();
      })
      .catch((err) => setError(errMsg(err)));
  }

  const visibleProjects = isStudent
    ? projects.filter((project) => {
      if (projectView === 'hosted') return project.canManage || project.myRole === 'lead';
      if (projectView === 'open') return project.status === 'approved' && !project.canManage && !project.myRole && !project.pendingRequest;
      return true;
    })
    : projects;

  return (
    <div className="grid two">
      <Card title={isStudent ? 'Student projects' : 'Project proposals'}>
        {msg && <Alert kind="success">{msg}</Alert>}
        {error && <Alert kind="error">{error}</Alert>}
        {isStudent && (
          <div className="project-filters" aria-label="Filter projects">
            <button type="button" className={projectView === 'open' ? 'project-filter active' : 'project-filter'} onClick={() => setProjectView('open')}>Open to join</button>
            <button type="button" className={projectView === 'hosted' ? 'project-filter active' : 'project-filter'} onClick={() => setProjectView('hosted')}>My hosted projects</button>
            <button type="button" className={projectView === 'all' ? 'project-filter active' : 'project-filter'} onClick={() => setProjectView('all')}>All projects</button>
          </div>
        )}
        {visibleProjects.length === 0 && (
          <Empty>
            {projects.length === 0
              ? 'No projects yet.'
              : projectView === 'hosted'
                ? 'You have not hosted a project yet.'
                : projectView === 'open'
                  ? 'No approved projects are currently open for collaborators.'
                  : 'No projects yet.'}
          </Empty>
        )}
        {visibleProjects.map((p) => (
          <article key={p.id} className="post">
            <header>
              <strong>{p.title}</strong>
              <span className={`pill ${STATUS[p.status].cls}`}>{STATUS[p.status].label}</span>
            </header>
            <p>{p.description}</p>
            {p.skillsNeeded && <SkillList label="Looking for" skills={p.skillsNeeded} />}
            <small>Hosted by: {p.leadName} · Supervisor: {p.supervisorName || '—'} · {p.memberCount} members · {p.department}</small>
            {p.remark && <small>Review remark: {p.remark}</small>}
            <div className="row-actions">
              <button className="ghost small" onClick={() => setOpenId(p.id)}>Project details</button>
              {isStudent && p.status === 'approved' && !p.canManage && !p.myRole && !p.pendingRequest && (
                <button className="primary small" onClick={() => setOpenId(p.id)}>Request to join</button>
              )}
              {isStudent && p.pendingRequest && <span className="pill wait">Request pending</span>}
              {p.myRole && <span className="pill">You: {p.myRole}</span>}
              {!isStudent && p.status === 'proposed' && (
                <ReviewBox projectId={p.id} onDone={(m) => { setMsg(m); load(); }} onError={setError} />
              )}
            </div>
          </article>
        ))}
      </Card>

      <div className="stack">
        {isStudent && (
          <Card title="Publish a project">
            <form className="subform" onSubmit={createProject}>
              <label>
                Title
                <input value={title} onChange={(e) => setTitle(e.target.value)} required />
              </label>
              <label>
                Description
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} required />
              </label>
              <label>
                Skills you need
                <input
                  value={skillsNeeded}
                  onChange={(e) => setSkillsNeeded(e.target.value)}
                  maxLength={300}
                  placeholder="e.g. React, UI design, Python (comma-separated)"
                  required
                />
              </label>
              <p className="hint">You become the team lead. After faculty approval, students can apply with their relevant skills and you can choose your teammates.</p>
              <button className="primary">Publish project</button>
            </form>
          </Card>
        )}

        {openId !== null && (
          <ProjectDetails
            key={openId}
            id={openId}
            me={me}
            onChange={load}
          />
        )}
      </div>
    </div>
  );
}

function ReviewBox({ projectId, onDone, onError }: { projectId: number; onDone: (m: string) => void; onError: (m: string) => void }) {
  const [remark, setRemark] = useState('');
  const [show, setShow] = useState(false);

  async function decide(decision: 'approve' | 'reject') {
    try {
      const r = await api<{ message: string }>(`/projects/${projectId}/review`, {
        method: 'POST',
        body: { decision, remark },
      });
      setShow(false);
      setRemark('');
      onDone(r.message);
    } catch (e) {
      onError(errMsg(e));
    }
  }

  if (!show) {
    return <button className="primary small" onClick={() => setShow(true)}>Review</button>;
  }
  return (
    <div className="subform full">
      <input placeholder="Remark (optional)" value={remark} onChange={(e) => setRemark(e.target.value)} />
      <div className="row-actions">
        <button className="primary small" onClick={() => decide('approve')}>Approve</button>
        <button className="ghost small danger" onClick={() => decide('reject')}>Reject</button>
        <button className="ghost small" onClick={() => setShow(false)}>Cancel</button>
      </div>
    </div>
  );
}

function ProjectDetails({ id, me, onChange }: { id: number; me: User; onChange: () => void }) {
  const [data, setData] = useState<ProjectDetail | null>(null);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [taskTitle, setTaskTitle] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [applicantSkills, setApplicantSkills] = useState('');

  function load() {
    api<ProjectDetail>(`/projects/${id}`).then(setData).catch((e) => setError(errMsg(e)));
  }

  useEffect(() => {
    load();
  }, [id]);

  async function run(fn: () => Promise<unknown>, ok: string) {
    setMsg('');
    setError('');
    try {
      await fn();
      setMsg(ok);
      load();
      onChange();
    } catch (e) {
      setError(errMsg(e));
    }
  }

  function addTask(e: FormEvent) {
    e.preventDefault();
    run(async () => {
      await api(`/projects/${id}/tasks`, {
        method: 'POST',
        body: { title: taskTitle, assigneeId: Number(assigneeId), dueDate },
      });
      setTaskTitle('');
      setDueDate('');
    }, 'Task assigned.');
  }

  if (!data) {
    return <Card title="Project">{error ? <Alert kind="error">{error}</Alert> : <Empty>Loading…</Empty>}</Card>;
  }

  const p = data.project;
  const canRequest = me.role === 'student' && p.status === 'approved' && !data.isMember && !p.pendingRequest;
  const requiredSkills = splitSkills(p.skillsNeeded);

  return (
    <Card title={p.title}>
      {msg && <Alert kind="success">{msg}</Alert>}
      {error && <Alert kind="error">{error}</Alert>}
      <p>{p.description}</p>
      <small className="hint">Status: {STATUS[p.status].label} · Lead: {p.leadName} · Supervisor: {p.supervisorName || '—'}</small>
      {requiredSkills.length > 0 && <SkillList label="Skills requested" skills={p.skillsNeeded || ''} />}

      {canRequest && (
        <form className="subform join-application" onSubmit={(e) => {
          e.preventDefault();
          run(() => api(`/projects/${id}/join-requests`, {
            method: 'POST',
            body: { applicantSkills },
          }), 'Join request sent to the project lead.');
        }}>
          <label>
            Your relevant skills
            <textarea
              value={applicantSkills}
              onChange={(e) => setApplicantSkills(e.target.value)}
              maxLength={300}
              placeholder="List skills that make you a good fit, separated by commas."
              required
            />
          </label>
          <button className="primary small">Apply to join</button>
        </form>
      )}
      {me.role === 'student' && p.pendingRequest && <p className="hint">Your join request is pending.</p>}

      <h4 className="sub">Team</h4>
      {data.members.map((m) => (
        <div key={m.userId} className="info">
          <span>{m.name} · {m.department}</span>
          <span className="row-actions">
            <strong>{m.role === 'lead' ? 'Lead' : 'Member'}</strong>
            {data.canManage && m.role !== 'lead' && (
              <button
                className="ghost small danger"
                onClick={() => run(() => api(`/projects/${id}/members/${m.userId}/remove`, { method: 'POST' }), 'Member removed.')}
              >
                Remove
              </button>
            )}
          </span>
        </div>
      ))}

      {data.canManage && (
        <>
          <h4 className="sub">Join requests</h4>
          {data.joinRequests.length === 0 && <Empty>No pending requests.</Empty>}
          {data.joinRequests.map((r) => (
            <div key={r.id} className="join-request">
              <div className="join-applicant"><strong>{r.name}</strong><small>{r.department}</small></div>
              <SkillList label="Applicant skills" skills={r.applicantSkills || ''} />
              {requiredSkills.length > 0 && (
                <p className="skill-match">
                  Matching skills: {getMatchingSkills(requiredSkills, splitSkills(r.applicantSkills)).join(', ') || 'No exact matches listed'}
                </p>
              )}
              <div className="row-actions">
                <button className="primary small" onClick={() => run(() => api(`/join-requests/${r.id}/decide`, { method: 'POST', body: { decision: 'approve' } }), 'Member added.')}>
                  Approve
                </button>
                <button className="ghost small danger" onClick={() => run(() => api(`/join-requests/${r.id}/decide`, { method: 'POST', body: { decision: 'reject' } }), 'Request rejected.')}>
                  Reject
                </button>
              </div>
            </div>
          ))}
        </>
      )}

      {(data.canManage || data.isMember) && (
        <>
          <h4 className="sub">Tasks</h4>
          {data.tasks.length === 0 && <Empty>No tasks assigned yet.</Empty>}
          {data.tasks.map((t) => {
            const canUpdate = data.canManage || t.assigneeId === me.id;
            return (
              <div key={t.id} className="post">
                <header>
                  <strong>{t.title}</strong>
                  <span className={`pill ${t.status === 'done' ? 'ok' : ''}`}>{t.progress}%</span>
                </header>
                <small>
                  {t.assigneeName || 'Unassigned'}{t.dueDate ? ` · due ${t.dueDate}` : ''}
                </small>
                <div className="row-actions">
                  {canUpdate && (
                    <select
                      value={t.progress}
                      onChange={(e) =>
                        run(() => api(`/tasks/${t.id}`, { method: 'PATCH', body: { progress: Number(e.target.value) } }), 'Progress updated.')
                      }
                    >
                      {[0, 25, 50, 75, 100].map((v) => (
                        <option key={v} value={v}>{v}%</option>
                      ))}
                    </select>
                  )}
                  {data.canManage && (
                    <button className="ghost small danger" onClick={() => run(() => api(`/tasks/${t.id}`, { method: 'DELETE' }), 'Task deleted.')}>
                      Delete
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {data.canManage && p.status === 'approved' && (
            <form className="subform" onSubmit={addTask}>
              <h4 className="sub">Assign a task</h4>
              <input placeholder="Task title" value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} required />
              <div className="form-grid">
                <select value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)} required>
                  <option value="" disabled>Assign to</option>
                  {data.members.map((m) => (
                    <option key={m.userId} value={m.userId}>{m.name}</option>
                  ))}
                </select>
                <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
              </div>
              <button className="primary">Assign task</button>
            </form>
          )}
        </>
      )}
    </Card>
  );
}

function splitSkills(skills?: string) {
  return (skills || '').split(/[,;\n]/).map((skill) => skill.trim()).filter(Boolean);
}

function getMatchingSkills(required: string[], offered: string[]) {
  const offeredSkills = new Set(offered.map((skill) => skill.toLocaleLowerCase()));
  return required.filter((skill) => offeredSkills.has(skill.toLocaleLowerCase()));
}

function SkillList({ label, skills }: { label: string; skills: string }) {
  const items = splitSkills(skills);
  if (items.length === 0) return null;
  return (
    <div className="skill-list">
      <strong>{label}</strong>
      <div>{items.map((skill) => <span className="skill-chip" key={skill}>{skill}</span>)}</div>
    </div>
  );
}
