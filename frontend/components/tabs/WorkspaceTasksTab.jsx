import { useState, useEffect, useRef } from 'react';
import {
  Plus, Trash2, Check, Clock, User, ChevronDown, ChevronUp,
  CheckSquare, X, AlertCircle, Edit2, Flag
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './WorkspaceTabs.css';

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

/* ── helpers ─────────────────────────────────────────────── */
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
function TaskModal({ task, members, currentUserId, onSave, onClose }) {
  const isEdit = !!task;
  const [form, setForm]     = useState(isEdit ? { ...task } : { ...EMPTY_FORM });
  const [stepInput, setStepInput] = useState('');
  const stepRef = useRef(null);

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const addStep = () => {
    const text = stepInput.trim();
    if (!text) return;
    set('steps', [...(form.steps || []), { id: Date.now(), text, done: false }]);
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

  const progress = calcProgress(form.steps);

  return (
    <div className="wt-modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="wt-modal" role="dialog" aria-modal="true" aria-label={isEdit ? 'Edit task' : 'Create task'}>
        {/* Header */}
        <div className="wt-modal-header">
          <h2 className="wt-modal-title">{isEdit ? 'Edit Task' : 'Create Task'}</h2>
          <button className="wt-modal-close" onClick={onClose} aria-label="Close"><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} className="wt-modal-body">
          {/* Title */}
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

          {/* Description */}
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

          {/* Steps */}
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

          {/* Row: Assignee + Due date + Priority */}
          <div className="wt-form-row">
            <div className="wt-form-group">
              <label className="wt-mlabel">Assignee</label>
              <select
                className="wt-form-input"
                value={form.assigneeId}
                onChange={e => set('assigneeId', e.target.value)}
              >
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
              <input
                type="date"
                className="wt-form-input"
                value={form.dueDate}
                onChange={e => set('dueDate', e.target.value)}
              />
            </div>
            <div className="wt-form-group">
              <label className="wt-mlabel">Priority</label>
              <select
                className="wt-form-input"
                value={form.priority}
                onChange={e => set('priority', e.target.value)}
              >
                {PRIORITIES.map(p => (
                  <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Actions */}
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
      {/* Priority stripe */}
      <div className="wt-task-stripe" style={{ background: pm.color }} />

      <div className="wt-task-card-main">
        {/* Status toggle */}
        <button
          className="wt-status-btn"
          style={{ '--status-color': sm.color, '--status-bg': sm.bg }}
          onClick={() => onStatusChange(task.id)}
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
          {/* Mini progress bar on card */}
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
                onClick={() => onDelete(task.id)}
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

      {/* Expanded detail */}
      {expanded && (
        <div className="wt-task-detail">
          {task.description && <p className="wt-task-desc">{task.description}</p>}

          {/* Steps checklist */}
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
                    onClick={() => onStepToggle(task.id, step.id)}
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
  const [showModal, setShowModal] = useState(false);
  const [editTask, setEditTask]   = useState(null);

  const storageKey = project ? `workspace_tasks_${project.id || project._id}` : null;

  useEffect(() => {
    if (!storageKey) return;
    const stored = localStorage.getItem(storageKey);
    setTasks(stored ? JSON.parse(stored) : []);
  }, [storageKey]);

  const saveTasks = (updated) => {
    setTasks(updated);
    if (storageKey) localStorage.setItem(storageKey, JSON.stringify(updated));
  };

  /* Build members list: owner + teamMembers */
  const members = (() => {
    if (!project) return [];
    const list = [];
    const ownerId = project.ownerId?._id || project.ownerId;

    // Find owner name from teamMembers where role === 'Founder'
    const founderMember = project.teamMembers?.find(m => m.role === 'Founder');
    const ownerName = founderMember?.name || project.ownerName || 'Owner';

    if (ownerId) {
      list.push({ id: ownerId, name: ownerName, isOwner: true });
    }

    (project.teamMembers || []).forEach(m => {
      const id = m.id?._id || m.id || m._id;
      // skip if already in list (e.g. the founder added above)
      if (id && !list.find(l => String(l.id) === String(id)) && m.role !== 'Founder') {
        list.push({ id, name: m.name, isOwner: false });
      }
    });

    return list;
  })();

  const handleSave = (form) => {
    if (editTask) {
      // Edit existing
      saveTasks(tasks.map(t => t.id === editTask.id ? { ...t, ...form } : t));
      setEditTask(null);
    } else {
      // Create new
      const task = {
        id: Date.now(),
        ...form,
        status: 'pending',
        createdAt: new Date().toISOString(),
        createdBy: user?.name || 'Unknown',
        createdById: user?.id || user?._id,
      };
      saveTasks([...tasks, task]);
    }
    setShowModal(false);
  };

  const handleStatusCycle = (taskId) => {
    saveTasks(tasks.map(t => {
      if (t.id !== taskId) return t;
      const idx = STATUSES.indexOf(t.status);
      const next = STATUSES[(idx + 1) % STATUSES.length];
      return { ...t, status: next };
    }));
  };

  const handleStepToggle = (taskId, stepId) => {
    saveTasks(tasks.map(t => {
      if (t.id !== taskId) return t;
      const steps = t.steps.map(s => s.id === stepId ? { ...s, done: !s.done } : s);
      const progress = calcProgress(steps);
      // Auto-advance status based on progress
      let status = t.status;
      if (progress === 0) status = 'pending';
      else if (progress === 100) status = 'completed';
      else status = 'in-progress';
      return { ...t, steps, status };
    }));
  };

  const handleDelete = (taskId) => {
    saveTasks(tasks.filter(t => t.id !== taskId));
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

  const currentUserId = user?.id || user?._id;

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
        {tasks.length === 0 ? (
          <div className="wt-empty-state">
            <CheckSquare size={48} className="wt-empty-icon" />
            <h3>No tasks yet</h3>
            <p>Create your first task using the button above.</p>
          </div>
        ) : (
          <div className="wt-tasks-grid">
            {tasks.map(task => (
              <TaskCard
                key={task.id}
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

      {/* Modal */}
      {showModal && (
        <TaskModal
          task={editTask}
          members={members}
          currentUserId={currentUserId}
          onSave={handleSave}
          onClose={() => { setShowModal(false); setEditTask(null); }}
        />
      )}
    </div>
  );
}

export default WorkspaceTasksTab;
