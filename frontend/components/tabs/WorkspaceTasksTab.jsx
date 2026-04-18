import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Plus, Trash2, Check, Clock, User, ChevronDown, ChevronUp,
  CheckSquare, X, AlertCircle, Edit2, Flag
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './WorkspaceTabs.css';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const PRIORITIES = ['low', 'medium', 'high'];
const STATUSES   = ['pending', 'in-progress', 'completed'];

const priorityMeta = {
  low:    { color: '#10b981', bg: '#d1fae5', label: 'Low' },
  medium: { color: '#f59e0b', bg: '#fef3c7', label: 'Medium' },
  high:   { color: '#ef4444', bg: '#fee2e2', label: 'High' },
};

const statusMeta = {
  pending:       { color: '#6b7280', bg: '#f3f4f6', icon: Clock,  label: 'Pending' },
  'in-progress': { color: '#f59e0b', bg: '#fef3c7', icon: Clock,  label: 'In Progress' },
  completed:     { color: '#10b981', bg: '#d1fae5', icon: Check,  label: 'Completed' },
};

const EMPTY_FORM = {
  title: '', description: '', assigneeId: '', dueDate: '', priority: 'medium', steps: [],
};

function formatDue(dateStr) {
  if (!dateStr) return null;
  const d    = new Date(dateStr);
  const diff = Math.ceil((d - new Date()) / 86400000);
  if (diff < 0)  return { label: 'Overdue',  color: '#ef4444' };
  if (diff === 0) return { label: 'Due today', color: '#f59e0b' };
  if (diff <= 3)  return { label: `${diff}d left`, color: '#f59e0b' };
  return { label: d.toLocaleDateString([], { month: 'short', day: 'numeric' }), color: '#6b7280' };
}

function calcProgress(steps) {
  if (!steps?.length) return 0;
  return Math.round((steps.filter(s => s.done).length / steps.length) * 100);
}

/* ── Task Modal ──────────────────────────────────────────── */
function TaskModal({ task, members, onSave, onClose }) {
  const isEdit = !!task;
  const [form, setForm]     = useState(isEdit ? { ...task } : { ...EMPTY_FORM });
  const [stepInput, setStepInput] = useState('');
  const stepRef = useRef(null);

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const addStep = () => {
    const text = stepInput.trim();
    if (!text) return;
    set('steps', [...(form.steps || []), { id: Date.now().toString(), text, done: false }]);
    setStepInput('');
    stepRef.current?.focus();
  };

  const toggleStep = (id) =>
    set('steps', form.steps.map(s => s.id === id ? { ...s, done: !s.done } : s));

  const removeStep = (id) =>
    set('steps', form.steps.filter(s => s.id !== id));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    onSave(form);
  };

  return (
    <div className="wt-modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="wt-modal" role="dialog" aria-modal="true" aria-label={isEdit ? 'Edit task' : 'Create task'}>
        <div className="wt-modal-header">
          <h2 className="wt-modal-title">{isEdit ? 'Edit Task' : 'Create Task'}</h2>
          <button className="wt-modal-close" onClick={onClose} aria-label="Close"><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} className="wt-modal-body">
          <div className="wt-mfield">
            <label className="wt-mlabel">Title <span className="wt-required">*</span></label>
            <input
              className="wt-form-input"
              placeholder="Task title"
              value={form.title}
              onChange={e => set('title', e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="wt-mfield">
            <label className="wt-mlabel">Description</label>
            <textarea
              className="wt-form-input wt-form-textarea"
              placeholder="What needs to be done?"
              value={form.description}
              onChange={e => set('description', e.target.value)}
              rows={3}
            />
          </div>

          <div className="wt-mfield">
            <label className="wt-mlabel">Steps / Checklist</label>
            <div className="wt-step-add-row">
              <input
                ref={stepRef}
                className="wt-form-input"
                placeholder="Add a step..."
                value={stepInput}
                onChange={e => setStepInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addStep(); } }}
              />
              <button type="button" className="wt-btn wt-btn--ghost wt-step-add-btn" onClick={addStep}>
                <Plus size={14} /> Add
              </button>
            </div>
            <div className="wt-steps-list">
              {form.steps?.map(step => (
                <div key={step.id} className="wt-step-item">
                  <button
                    type="button"
                    className={`wt-step-check ${step.done ? 'wt-step-check--done' : ''}`}
                    onClick={() => toggleStep(step.id)}
                    aria-label={step.done ? 'Mark incomplete' : 'Mark complete'}
                  >
                    {step.done && <Check size={12} />}
                  </button>
                  <span className={`wt-step-text ${step.done ? 'wt-step-text--done' : ''}`}>{step.text}</span>
                  <button type="button" className="wt-step-remove" onClick={() => removeStep(step.id)} aria-label="Remove step">
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="wt-form-row">
            <div className="wt-form-group">
              <label className="wt-mlabel">Assignee</label>
              <select className="wt-form-input" value={form.assigneeId} onChange={e => set('assigneeId', e.target.value)}>
                <option value="">Unassigned</option>
                {members.map(m => (
                  <option key={m.id || m._id} value={m.id || m._id}>
                    {m.name}{m.isOwner ? ' (Founder)' : ''}
                  </option>
                ))}
              </select>
            </div>
            <div className="wt-form-group">
              <label className="wt-mlabel">Due Date</label>
              <input type="date" className="wt-form-input" value={form.dueDate} onChange={e => set('dueDate', e.target.value)} />
            </div>
            <div className="wt-form-group">
              <label className="wt-mlabel">Priority</label>
              <select className="wt-form-input" value={form.priority} onChange={e => set('priority', e.target.value)}>
                {PRIORITIES.map(p => (
                  <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="wt-modal-footer">
            <button type="button" className="wt-btn wt-btn--ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="wt-btn wt-btn--primary">
              {isEdit ? 'Save Changes' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── Task Card ───────────────────────────────────────────── */
function TaskCard({ task, currentUserId, isAdmin, members, onStatusChange, onStepToggle, onEdit, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const sm  = statusMeta[task.status] || statusMeta.pending;
  const pm  = priorityMeta[task.priority] || priorityMeta.medium;
  const due = formatDue(task.dueDate);
  const progress = calcProgress(task.steps);
  const StatusIcon = sm.icon;

  const assignee = members.find(m => String(m.id || m._id) === String(task.assigneeId));
  const isCreator = String(task.createdById) === String(currentUserId);
  const canManage = isAdmin || isCreator;

  return (
    <div className={`wt-task-card ${task.status === 'completed' ? 'wt-task-card--done' : ''}`}>
      <div className="wt-task-stripe" style={{ background: pm.color }} />

      <div className="wt-task-card-main">
        <button
          className="wt-status-btn"
          style={{ '--status-color': sm.color, '--status-bg': sm.bg }}
          onClick={() => onStatusChange(task._id || task.id)}
          title={`${sm.label} — click to advance`}
        >
          <StatusIcon size={16} />
        </button>

        <div className="wt-task-info" onClick={() => setExpanded(v => !v)}>
          <span className={`wt-task-title ${task.status === 'completed' ? 'wt-task-title--done' : ''}`}>
            {task.title}
          </span>
          <div className="wt-task-chips">
            <span className="wt-chip" style={{ color: pm.color, background: pm.bg }}>
              <Flag size={10} /> {pm.label}
            </span>
            {due && <span className="wt-chip" style={{ color: due.color, background: '#f9fafb' }}>{due.label}</span>}
            {assignee && (
              <span className="wt-chip wt-chip--assignee"><User size={10} /> {assignee.name}</span>
            )}
          </div>
          {task.steps?.length > 0 && (
            <div className="wt-card-progress">
              <div className="wt-progress-bar wt-progress-bar--sm">
                <div className="wt-progress-fill" style={{ width: `${progress}%` }} />
              </div>
              <span className="wt-progress-label wt-progress-label--sm">
                {task.steps.filter(s => s.done).length}/{task.steps.length}
              </span>
            </div>
          )}
        </div>

        <div className="wt-task-card-actions">
          <button className="wt-icon-btn" onClick={() => setExpanded(v => !v)} title={expanded ? 'Collapse' : 'Expand'}>
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          {canManage && (
            <button className="wt-icon-btn" onClick={() => onEdit(task)} title="Edit task">
              <Edit2 size={15} />
            </button>
          )}
          {canManage && (
            confirmDelete ? (
              <button
                className="wt-icon-btn wt-icon-btn--danger"
                onClick={() => onDelete(task._id || task.id)}
                title="Confirm delete"
              >
                <AlertCircle size={15} />
              </button>
            ) : (
              <button
                className="wt-icon-btn wt-icon-btn--danger"
                onClick={() => setConfirmDelete(true)}
                onBlur={() => setTimeout(() => setConfirmDelete(false), 200)}
                title="Delete task"
              >
                <Trash2 size={15} />
              </button>
            )
          )}
        </div>
      </div>

      {expanded && (
        <div className="wt-task-detail">
          {task.description && <p className="wt-task-desc">{task.description}</p>}

          {task.steps?.length > 0 && (
            <div className="wt-task-steps">
              <div className="wt-steps-progress">
                <div className="wt-progress-bar">
                  <div
                    className={`wt-progress-fill ${progress === 100 ? 'wt-progress-fill--complete' : ''}`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <span className="wt-progress-label">{progress}%</span>
              </div>
              {task.steps.map(step => (
                <div key={step.id} className="wt-step-item wt-step-item--view">
                  <button
                    className={`wt-step-check ${step.done ? 'wt-step-check--done' : ''}`}
                    onClick={() => onStepToggle(task._id || task.id, step.id)}
                    aria-label={step.done ? 'Mark incomplete' : 'Mark complete'}
                  >
                    {step.done && <Check size={12} />}
                  </button>
                  <span className={`wt-step-text ${step.done ? 'wt-step-text--done' : ''}`}>{step.text}</span>
                </div>
              ))}
            </div>
          )}

          <div className="wt-task-meta-row">
            <span>By {task.createdBy}</span>
            {task.dueDate && <span>Due {new Date(task.dueDate).toLocaleDateString()}</span>}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Main Component ──────────────────────────────────────── */
function WorkspaceTasksTab({ project, isAdmin }) {
  const { user } = useAuth();
  const [tasks, setTasks]         = useState([]);
  const [loading, setLoading]     = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editTask, setEditTask]   = useState(null);
  const sseRef = useRef(null);

  const projectId = project ? (project._id || project.id) : null;
  const currentUserId = user?.id || user?._id;

  /* ── Fetch tasks from API ── */
  const fetchTasks = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/projects/${projectId}/tasks`);
      const data = await res.json();
      if (data.success) setTasks(data.data || []);
    } catch (err) {
      console.error('[Tasks] fetch error', err);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  /* ── Initial load ── */
  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  /* ── SSE for real-time updates (reuse chat SSE stream) ── */
  useEffect(() => {
    if (!projectId) return;

    const es = new EventSource(`${API_BASE}/api/messages/${projectId}/stream`);
    sseRef.current = es;

    es.onmessage = (e) => {
      try {
        const payload = JSON.parse(e.data);
        if (payload.type === 'task_created') {
          setTasks(prev => {
            // avoid duplicate if we already added it optimistically
            if (prev.find(t => String(t._id) === String(payload.task._id))) return prev;
            return [...prev, payload.task];
          });
        } else if (payload.type === 'task_updated') {
          setTasks(prev => prev.map(t =>
            String(t._id) === String(payload.task._id) ? payload.task : t
          ));
        } else if (payload.type === 'task_deleted') {
          setTasks(prev => prev.filter(t => String(t._id) !== String(payload.taskId)));
        }
      } catch (_) {}
    };

    es.onerror = () => es.close();

    return () => {
      es.close();
      sseRef.current = null;
    };
  }, [projectId]);

  /* ── Members list ── */
  const members = (() => {
    if (!project) return [];
    const list = [];
    const ownerId = project.ownerId?._id || project.ownerId;
    const founderMember = project.teamMembers?.find(m => m.role === 'Founder');
    const ownerName = founderMember?.name || project.ownerName || 'Owner';

    if (ownerId) list.push({ id: ownerId, name: ownerName, isOwner: true });

    (project.teamMembers || []).forEach(m => {
      const id = m.id?._id || m.id || m._id;
      if (id && !list.find(l => String(l.id) === String(id)) && m.role !== 'Founder') {
        list.push({ id, name: m.name, isOwner: false });
      }
    });
    return list;
  })();

  /* ── CRUD handlers ── */
  const handleSave = async (form) => {
    if (editTask) {
      // Update
      try {
        const res = await fetch(`${API_BASE}/api/projects/${projectId}/tasks/${editTask._id || editTask.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });
        const data = await res.json();
        if (data.success) {
          // SSE will update state; also update locally for instant feedback
          setTasks(prev => prev.map(t =>
            String(t._id) === String(editTask._id || editTask.id) ? data.data : t
          ));
        }
      } catch (err) {
        console.error('[Tasks] update error', err);
      }
    } else {
      // Create
      try {
        const payload = {
          ...form,
          createdBy: user?.name || 'Unknown',
          createdById: currentUserId,
        };
        const res = await fetch(`${API_BASE}/api/projects/${projectId}/tasks`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (data.success) {
          // Optimistically add; SSE deduplicates
          setTasks(prev => {
            if (prev.find(t => String(t._id) === String(data.data._id))) return prev;
            return [...prev, data.data];
          });
        }
      } catch (err) {
        console.error('[Tasks] create error', err);
      }
    }
    setShowModal(false);
    setEditTask(null);
  };

  const handleStatusCycle = async (taskId) => {
    const task = tasks.find(t => String(t._id || t.id) === String(taskId));
    if (!task) return;
    const idx  = STATUSES.indexOf(task.status);
    const next = STATUSES[(idx + 1) % STATUSES.length];
    // Optimistic update
    setTasks(prev => prev.map(t => String(t._id || t.id) === String(taskId) ? { ...t, status: next } : t));
    try {
      await fetch(`${API_BASE}/api/projects/${projectId}/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: next }),
      });
    } catch (err) {
      console.error('[Tasks] status update error', err);
    }
  };

  const handleStepToggle = async (taskId, stepId) => {
    const task = tasks.find(t => String(t._id || t.id) === String(taskId));
    if (!task) return;
    const steps = task.steps.map(s => s.id === stepId ? { ...s, done: !s.done } : s);
    const progress = calcProgress(steps);
    let status = task.status;
    if (progress === 0) status = 'pending';
    else if (progress === 100) status = 'completed';
    else status = 'in-progress';

    // Optimistic update
    setTasks(prev => prev.map(t => String(t._id || t.id) === String(taskId) ? { ...t, steps, status } : t));
    try {
      await fetch(`${API_BASE}/api/projects/${projectId}/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ steps, status }),
      });
    } catch (err) {
      console.error('[Tasks] step toggle error', err);
    }
  };

  const handleDelete = async (taskId) => {
    // Optimistic remove
    setTasks(prev => prev.filter(t => String(t._id || t.id) !== String(taskId)));
    try {
      await fetch(`${API_BASE}/api/projects/${projectId}/tasks/${taskId}`, { method: 'DELETE' });
    } catch (err) {
      console.error('[Tasks] delete error', err);
    }
  };

  const handleEdit = (task) => {
    setEditTask(task);
    setShowModal(true);
  };

  const counts = {
    pending:       tasks.filter(t => t.status === 'pending').length,
    'in-progress': tasks.filter(t => t.status === 'in-progress').length,
    completed:     tasks.filter(t => t.status === 'completed').length,
  };

  if (!project) {
    return (
      <div className="wt-empty-state">
        <CheckSquare size={48} className="wt-empty-icon" />
        <h3>Select a project to manage tasks</h3>
        <p>Choose a project from the dropdown above to view and create tasks.</p>
      </div>
    );
  }

  return (
    <div className="wt-tasks">
      {/* Stats bar */}
      <div className="wt-tasks-stats">
        {Object.entries(counts).map(([status, count]) => {
          const meta = statusMeta[status];
          return (
            <div key={status} className="wt-stat-chip" style={{ '--chip-color': meta.color, '--chip-bg': meta.bg }}>
              <span className="wt-stat-count">{count}</span>
              <span className="wt-stat-label">{meta.label}</span>
            </div>
          );
        })}
        <button className="wt-add-task-btn" onClick={() => { setEditTask(null); setShowModal(true); }}>
          <Plus size={16} /> New Task
        </button>
      </div>

      {/* Task grid */}
      <div className="wt-tasks-grid-scroll">
        {loading ? (
          <div className="wt-empty-state">
            <p>Loading tasks...</p>
          </div>
        ) : tasks.length === 0 ? (
          <div className="wt-empty-state">
            <CheckSquare size={48} className="wt-empty-icon" />
            <h3>No tasks yet</h3>
            <p>Create your first task using the button above.</p>
          </div>
        ) : (
          <div className="wt-tasks-grid">
            {tasks.map(task => (
              <TaskCard
                key={task._id || task.id}
                task={task}
                currentUserId={currentUserId}
                isAdmin={isAdmin}
                members={members}
                onStatusChange={handleStatusCycle}
                onStepToggle={handleStepToggle}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <TaskModal
          task={editTask}
          members={members}
          onSave={handleSave}
          onClose={() => { setShowModal(false); setEditTask(null); }}
        />
      )}
    </div>
  );
}

export default WorkspaceTasksTab;
