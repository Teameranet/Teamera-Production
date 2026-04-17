import { useState, useEffect } from 'react';
import { Plus, Trash2, Check, Clock, User, ChevronDown, ChevronUp, CheckSquare } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './WorkspaceTabs.css';

const PRIORITIES = ['low', 'medium', 'high'];
const STATUSES = ['pending', 'in-progress', 'completed'];

function WorkspaceTasksTab({ project, isAdmin }) {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [expandedTask, setExpandedTask] = useState(null);
  const [form, setForm] = useState({
    title: '', description: '', assignee: '', dueDate: '', priority: 'medium',
  });

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

  const handleCreate = (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    const task = {
      id: Date.now(),
      ...form,
      status: 'pending',
      createdAt: new Date().toISOString(),
      createdBy: user?.name || 'Unknown',
    };
    saveTasks([...tasks, task]);
    setForm({ title: '', description: '', assignee: '', dueDate: '', priority: 'medium' });
    setShowForm(false);
  };

  const handleStatusCycle = (taskId) => {
    saveTasks(tasks.map(t => {
      if (t.id !== taskId) return t;
      const idx = STATUSES.indexOf(t.status);
      return { ...t, status: STATUSES[(idx + 1) % STATUSES.length] };
    }));
  };

  const handleDelete = (taskId) => {
    saveTasks(tasks.filter(t => t.id !== taskId));
  };

  const priorityMeta = {
    low:    { color: '#10b981', bg: '#d1fae5', label: 'Low' },
    medium: { color: '#f59e0b', bg: '#fef3c7', label: 'Medium' },
    high:   { color: '#ef4444', bg: '#fee2e2', label: 'High' },
  };

  const statusMeta = {
    pending:     { color: '#6b7280', bg: '#f3f4f6', icon: Clock,  label: 'Pending' },
    'in-progress': { color: '#f59e0b', bg: '#fef3c7', icon: Clock,  label: 'In Progress' },
    completed:   { color: '#10b981', bg: '#d1fae5', icon: Check,  label: 'Completed' },
  };

  const formatDue = (dateStr) => {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    const diff = Math.ceil((d - new Date()) / 86400000);
    if (diff < 0) return { label: 'Overdue', color: '#ef4444' };
    if (diff === 0) return { label: 'Due today', color: '#f59e0b' };
    if (diff <= 3) return { label: `${diff}d left`, color: '#f59e0b' };
    return { label: d.toLocaleDateString([], { month: 'short', day: 'numeric' }), color: '#6b7280' };
  };

  const counts = {
    pending: tasks.filter(t => t.status === 'pending').length,
    'in-progress': tasks.filter(t => t.status === 'in-progress').length,
    completed: tasks.filter(t => t.status === 'completed').length,
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
        {isAdmin && (
          <button className="wt-add-task-btn" onClick={() => setShowForm(v => !v)}>
            <Plus size={16} /> New Task
          </button>
        )}
      </div>

      {/* Create form */}
      {showForm && isAdmin && (
        <form className="wt-task-form" onSubmit={handleCreate}>
          <input
            className="wt-form-input"
            placeholder="Task title *"
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            required
          />
          <textarea
            className="wt-form-input wt-form-textarea"
            placeholder="Description (optional)"
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            rows={2}
          />
          <div className="wt-form-row">
            <div className="wt-form-group">
              <label>Assignee</label>
              <input
                className="wt-form-input"
                placeholder="Name or email"
                value={form.assignee}
                onChange={e => setForm(f => ({ ...f, assignee: e.target.value }))}
              />
            </div>
            <div className="wt-form-group">
              <label>Due date</label>
              <input
                type="date"
                className="wt-form-input"
                value={form.dueDate}
                onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
              />
            </div>
            <div className="wt-form-group">
              <label>Priority</label>
              <select
                className="wt-form-input"
                value={form.priority}
                onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}
              >
                {PRIORITIES.map(p => (
                  <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="wt-form-actions">
            <button type="submit" className="wt-btn wt-btn--primary">Create Task</button>
            <button type="button" className="wt-btn wt-btn--ghost" onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </form>
      )}

      {/* Task list */}
      <div className="wt-tasks-list">
        {tasks.length === 0 ? (
          <div className="wt-empty-state">
            <CheckSquare size={48} className="wt-empty-icon" />
            <h3>No tasks yet</h3>
            <p>{isAdmin ? 'Create your first task using the button above.' : 'No tasks have been created for this project yet.'}</p>
          </div>
        ) : (
          tasks.map(task => {
            const sm = statusMeta[task.status] || statusMeta.pending;
            const pm = priorityMeta[task.priority] || priorityMeta.medium;
            const due = formatDue(task.dueDate);
            const StatusIcon = sm.icon;
            const isExpanded = expandedTask === task.id;

            return (
              <div key={task.id} className={`wt-task-card ${task.status === 'completed' ? 'wt-task-card--done' : ''}`}>
                <div className="wt-task-card-main">
                  {/* Status toggle */}
                  <button
                    className="wt-status-btn"
                    style={{ '--status-color': sm.color, '--status-bg': sm.bg }}
                    onClick={() => handleStatusCycle(task.id)}
                    title={`Status: ${sm.label} — click to advance`}
                  >
                    <StatusIcon size={16} />
                  </button>

                  <div className="wt-task-info" onClick={() => setExpandedTask(isExpanded ? null : task.id)}>
                    <span className={`wt-task-title ${task.status === 'completed' ? 'wt-task-title--done' : ''}`}>
                      {task.title}
                    </span>
                    <div className="wt-task-chips">
                      <span className="wt-chip" style={{ color: pm.color, background: pm.bg }}>{pm.label}</span>
                      <span className="wt-chip" style={{ color: sm.color, background: sm.bg }}>{sm.label}</span>
                      {due && <span className="wt-chip" style={{ color: due.color, background: '#f9fafb' }}>{due.label}</span>}
                      {task.assignee && (
                        <span className="wt-chip wt-chip--assignee">
                          <User size={12} /> {task.assignee}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="wt-task-card-actions">
                    <button
                      className="wt-icon-btn"
                      onClick={() => setExpandedTask(isExpanded ? null : task.id)}
                      title={isExpanded ? 'Collapse' : 'Expand'}
                    >
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                    {isAdmin && (
                      <button
                        className="wt-icon-btn wt-icon-btn--danger"
                        onClick={() => handleDelete(task.id)}
                        title="Delete task"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>

                {isExpanded && (
                  <div className="wt-task-detail">
                    {task.description && <p className="wt-task-desc">{task.description}</p>}
                    <div className="wt-task-meta-row">
                      <span>Created by {task.createdBy}</span>
                      {task.dueDate && <span>Due {new Date(task.dueDate).toLocaleDateString()}</span>}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default WorkspaceTasksTab;
