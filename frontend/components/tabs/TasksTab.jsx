import { useState, useRef, useEffect } from 'react';
import { Check, Clock, User, Trash2, Plus, AlertCircle } from 'lucide-react';
import './Tabs.css';

function TasksTab({ project, isAdmin }) {
  const tasksListRef = useRef(null);
  const [tasks, setTasks] = useState([]);

  // Load tasks from localStorage and update in real-time
  useEffect(() => {
    const loadTasks = () => {
      // Load created tasks from localStorage
      const createdTasks = JSON.parse(localStorage.getItem('createdTasks') || '[]');
      
      // Filter tasks for current project if project is selected
      const projectTasks = project 
        ? createdTasks.filter(task => task.projectId === project.id)
        : createdTasks;
      
      setTasks(projectTasks);
    };

    // Load tasks initially
    loadTasks();

    // Set up interval to check for updates
    const interval = setInterval(loadTasks, 1000);

    // Listen for storage changes
    const handleStorageChange = () => {
      loadTasks();
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [project]);

  const handleDeleteTask = (taskId) => {
    // Remove task from localStorage
    const storedTasks = JSON.parse(localStorage.getItem('createdTasks') || '[]');
    const updatedTasks = storedTasks.filter(task => task.id !== taskId);
    localStorage.setItem('createdTasks', JSON.stringify(updatedTasks));
    
    // Update local state
    setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
  };

  const handleStatusChange = (taskId, newStatus) => {
    // Update task status in localStorage
    const storedTasks = JSON.parse(localStorage.getItem('createdTasks') || '[]');
    const updatedTasks = storedTasks.map(task => 
      task.id === taskId ? { ...task, status: newStatus } : task
    );
    localStorage.setItem('createdTasks', JSON.stringify(updatedTasks));
    
    // Update local state
    setTasks(prevTasks => 
      prevTasks.map(task => 
        task.id === taskId ? { ...task, status: newStatus } : task
      )
    );
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return '#10b981';
      case 'in-progress': return '#f59e0b';
      case 'pending': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
      default: return '#6b7280';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'completed': return 'COMPLETED';
      case 'in-progress': return 'IN-PROGRESS';
      case 'pending': return 'PENDING';
      default: return status.toUpperCase();
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'No due date';
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = date - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'Overdue';
    if (diffDays === 0) return 'Due today';
    if (diffDays === 1) return 'Due tomorrow';
    if (diffDays <= 7) return `Due in ${diffDays} days`;
    
    return date.toLocaleDateString('en-US', { 
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const formatCreatedDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffMinutes = Math.floor(diffTime / (1000 * 60));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffMinutes < 1) return 'Just created';
    if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    
    return date.toLocaleDateString('en-US', { 
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  return (
    <div className="tasks-section">
      <div ref={tasksListRef} className="tasks-list scrollable">
        {tasks.length === 0 && (
          <div className="empty-tasks">
            <Clock size={48} className="empty-icon" />
            <h3>No tasks created yet</h3>
            <p>Create your first task to get started with project management</p>
          </div>
        )}
        
        {tasks.map((task) => (
          <div key={task.id} className={`task-item ${task.status === 'completed' ? 'completed-task' : ''}`}>
            <div
              className="task-status"
              style={{ backgroundColor: getStatusColor(task.status) }}
            >
              {task.status === 'completed' ? <Check size={16} /> : <Clock size={16} />}
            </div>
            <div className="task-content">
              <div className="task-header">
                <h4 className={task.status === 'completed' ? 'completed' : ''}>
                  {task.title}
                </h4>
                <div className="task-actions">
                  {task.status !== 'completed' && (
                    <button
                      className="status-change-btn"
                      onClick={() => handleStatusChange(task.id, 'completed')}
                      title="Mark as completed"
                    >
                      <Check size={16} />
                    </button>
                  )}
                  {task.status === 'pending' && (
                    <button
                      className="status-change-btn"
                      onClick={() => handleStatusChange(task.id, 'in-progress')}
                      title="Mark as in progress"
                    >
                      <Clock size={16} />
                    </button>
                  )}
                  {isAdmin && (
                    <button
                      className="delete-task-btn"
                      onClick={() => handleDeleteTask(task.id)}
                      title="Delete task"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
              
              {task.description && (
                <p className="task-description">{task.description}</p>
              )}
              
              <div className="task-meta">
                <div className="task-assignee">
                  <User size={16} />
                  <span>{task.assignee || 'Unassigned'}</span>
                </div>
                <div className="task-due-date">
                  <Clock size={16} />
                  <span>{formatDate(task.dueDate)}</span>
                </div>
                <div
                  className="task-priority"
                  style={{ color: getPriorityColor(task.priority) }}
                >
                  {task.priority.toUpperCase()}
                </div>
                <div className="task-created">
                  <span>Created {formatCreatedDate(task.createdAt)}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default TasksTab; 