import { useState, useEffect } from 'react';
import { MessageSquare, CheckSquare, Users, FileText, FolderOpen } from 'lucide-react';
import { useProjects } from '../context/ProjectContext';
import { useAuth } from '../context/AuthContext';
import ChatTab from '../components/tabs/ChatTab';
import TasksTab from '../components/tabs/TasksTab';
import TeamTab from '../components/tabs/TeamTab';
import FilesTab from '../components/tabs/FilesTab';
import './Workspace.css';

const TABS = [
  { id: 'chat', label: 'Chat', icon: MessageSquare },
  { id: 'tasks', label: 'Tasks', icon: CheckSquare },
  { id: 'team', label: 'Team', icon: Users },
  { id: 'files', label: 'Files', icon: FileText },
];

function Workspace() {
  const [activeTab, setActiveTab] = useState('chat');
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const { projects } = useProjects();
  const { user } = useAuth();

  // Filter projects the user is part of
  const userProjects = projects.filter(p => {
    if (!user) return false;
    const userId = user.id || user._id;
    const ownerId = p.ownerId?._id || p.ownerId;
    if (String(ownerId) === String(userId)) return true;
    return p.teamMembers?.some(m => {
      const mId = m.id?._id || m.id || m._id;
      return String(mId) === String(userId);
    });
  });

  const selectedProject = userProjects.find(
    p => (p.id || p._id) === selectedProjectId
  ) || null;

  const isAdmin = selectedProject
    ? String(selectedProject.ownerId?._id || selectedProject.ownerId) === String(user?.id || user?._id)
    : false;

  // No auto-select — user must choose a project

  const renderTab = () => {
    switch (activeTab) {
      case 'chat':  return <ChatTab project={selectedProject} />;
      case 'tasks': return <TasksTab project={selectedProject} isAdmin={isAdmin} />;
      case 'team':  return <TeamTab project={selectedProject} isAdmin={isAdmin} />;
      case 'files': return <FilesTab project={selectedProject} />;
      default:      return null;
    }
  };

  return (
    <div className="workspace-container">
      {/* Header — mirrors Hackathons gradient header */}
      <div className="workspace-header">
        <div className="workspace-header-content">
          <h1>Workspace</h1>
          <p>Collaborate with your team — chat, manage tasks, share files, and track progress</p>
        </div>

        {userProjects.length > 0 && (
          <div className="workspace-project-selector">
            <FolderOpen size={18} />
            <select
              value={selectedProjectId}
              onChange={e => setSelectedProjectId(e.target.value)}
              aria-label="Select project"
            >
              <option value="">Select your project</option>
              {userProjects.map(p => (
                <option key={p.id || p._id} value={p.id || p._id}>
                  {p.title}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Tabs — only shown when user has projects */}
      {userProjects.length > 0 && (
        <div className="workspace-tabs">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              className={`workspace-tab-btn ${activeTab === id ? 'active' : ''}`}
              onClick={() => setActiveTab(id)}
            >
              <Icon size={18} />
              {label}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      <div className="workspace-content">
        {userProjects.length === 0 ? (
          <div className="workspace-empty-state">
            <div className="empty-icon">🚀</div>
            <h3>No projects yet</h3>
            <p>Join or create a project to start collaborating with your team.</p>
          </div>
        ) : !selectedProject ? (
          <div className="workspace-select-state">
            <h3>Select a Project to Begin</h3>
            <p>Choose one of your projects from the dropdown above to:</p>
            <div className="workspace-select-grid">
              <div className="workspace-select-card">
                <MessageSquare size={20} className="select-card-icon" />
                Chat with team members in real-time
              </div>
              <div className="workspace-select-card">
                <CheckSquare size={20} className="select-card-icon" />
                Manage and track project tasks
              </div>
              <div className="workspace-select-card">
                <FileText size={20} className="select-card-icon" />
                Share and access project files
              </div>
              <div className="workspace-select-card">
                <Users size={20} className="select-card-icon" />
                Collaborate with team members
              </div>
            </div>
          </div>
        ) : (
          <div className="workspace-tab-content">
            {renderTab()}
          </div>
        )}
      </div>
    </div>
  );
}

export default Workspace;
