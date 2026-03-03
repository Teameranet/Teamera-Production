import { useState, useEffect, useRef } from 'react';
import { X, MessageCircle, FileText, CheckSquare, Copy, User, Users, Plus, Upload } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useProjects } from '../context/ProjectContext';
import ChatTab from './tabs/ChatTab';
import TasksTab from './tabs/TasksTab';
import FilesTab from './tabs/FilesTab';
import TeamTab from './tabs/TeamTab';
import './CollaborationSpace.css';

function CollaborationSpace({ onClose, activeProject = null, defaultTab = 'chat' }) {
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [selectedProject, setSelectedProject] = useState(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', description: '', assignee: '', dueDate: '', priority: 'medium' });
  const [isUploading, setIsUploading] = useState(false);
  const { user } = useAuth();
  const { projects } = useProjects();
  const contentRef = useRef(null);

  // Filter projects where user is a team member (no limit)
  const userProjects = projects
    .filter(project => project.teamMembers.some(member => member.name === user?.name));

  // Set active project if provided
  useEffect(() => {
    if (activeProject) {
      setSelectedProject(activeProject);
    }
  }, [activeProject]);

  // Check if user is owner of selected project
  const isOwner = selectedProject ?
    selectedProject.teamMembers.some(member =>
      member.name === user?.name && (member.role === 'Founder' || member.role === 'OWNER')
    ) : false;

  // Check if user is admin of selected project
  const isAdmin = selectedProject ?
    selectedProject.teamMembers.some(member =>
      member.name === user?.name && (member.role === 'ADMIN' || member.role === 'OWNER')
    ) : false;

  // Reset scroll position when changing tabs
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = 0;
    }
  }, [activeTab]);

  // Handle project selection
  const handleProjectChange = (e) => {
    const projectId = e.target.value;
    const project = userProjects.find(p => p.id === projectId);
    setSelectedProject(project);

    // Reset scroll position when changing projects
    if (contentRef.current) {
      contentRef.current.scrollTop = 0;
    }
  };

  // Handle task creation
  const handleCreateTask = (e) => {
    e.preventDefault();
    if (newTask.title.trim()) {
      // Create task object with metadata
      const taskData = {
        id: Date.now(),
        title: newTask.title,
        description: newTask.description,
        assignee: newTask.assignee,
        dueDate: newTask.dueDate,
        priority: newTask.priority,
        status: 'pending',
        createdAt: new Date().toISOString(),
        createdBy: user?.name || 'Unknown User',
        projectId: selectedProject?.id || null,
        projectName: selectedProject?.title || 'Unknown Project'
      };

      // Store task in localStorage
      const storedTasks = JSON.parse(localStorage.getItem('createdTasks') || '[]');
      storedTasks.unshift(taskData); // Add to beginning (most recent first)
      localStorage.setItem('createdTasks', JSON.stringify(storedTasks));

      console.log('Task created and stored:', taskData);

      // Reset form with current project context
      setNewTask({
        title: '',
        description: '',
        assignee: '',
        dueDate: '',
        priority: 'medium'
      });
      setShowNewTaskModal(false);

      // Show success feedback (optional)
      // You can add a toast notification here
    }
  };

  // Handle file upload
  const handleFileUpload = () => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.multiple = true; // Allow multiple file selection
    fileInput.click();

    fileInput.onchange = (e) => {
      const files = Array.from(e.target.files);
      if (files.length > 0) {
        // Show uploading state
        setIsUploading(true);

        // Process each file
        files.forEach((file, index) => {
          // Create a unique ID for the file
          const fileId = Date.now() + index;

          // Create file object with metadata
          const fileData = {
            id: fileId,
            name: file.name,
            size: file.size,
            type: file.type,
            uploadedBy: user?.name || 'Unknown User',
            uploadedAt: new Date().toISOString(),
            status: 'uploading',
            progress: 0,
            projectId: selectedProject?.id || null,
            projectName: selectedProject?.title || 'Unknown Project',
            file: file // Store the actual file object
          };

          // Store file in localStorage
          const storedFiles = JSON.parse(localStorage.getItem('uploadedFiles') || '[]');
          storedFiles.unshift(fileData); // Add to beginning (most recent first)
          localStorage.setItem('uploadedFiles', JSON.stringify(storedFiles));

          // Simulate upload progress
          let progress = 0;
          const progressInterval = setInterval(() => {
            progress += Math.random() * 15;
            if (progress >= 100) {
              progress = 100;
              clearInterval(progressInterval);

              // Update file status to completed
              const updatedFiles = JSON.parse(localStorage.getItem('uploadedFiles') || '[]');
              const fileIndex = updatedFiles.findIndex(f => f.id === fileId);
              if (fileIndex !== -1) {
                updatedFiles[fileIndex].status = 'completed';
                updatedFiles[fileIndex].progress = 100;
                localStorage.setItem('uploadedFiles', JSON.stringify(updatedFiles));
              }

              // Check if all files are done
              const allCompleted = updatedFiles.every(f => f.status === 'completed');
              if (allCompleted) {
                setIsUploading(false);
                // Scroll to top of content to show new files
                if (contentRef.current) {
                  contentRef.current.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                  });
                }
              }
            } else {
              // Update progress in localStorage
              const updatedFiles = JSON.parse(localStorage.getItem('uploadedFiles') || '[]');
              const fileIndex = updatedFiles.findIndex(f => f.id === fileId);
              if (fileIndex !== -1) {
                updatedFiles[fileIndex].progress = Math.round(progress);
                localStorage.setItem('uploadedFiles', JSON.stringify(updatedFiles));
              }
            }
          }, 200);
        });
      }
    };
  };

  // Render no projects message with clear instructions
  const renderNoProjects = () => (
    <div className="no-projects">
      <div className="no-projects-content">
        <h3>No Projects Available</h3>
        <div className="no-projects-messages">
          <div className="message-card">
            <Users size={24} />
            <h4>Join Existing Projects</h4>
            <p>Browse and join existing projects to start collaborating with other members.</p>
          </div>
          <div className="message-card">
            <Users size={24} />
            <h4>Create New Project</h4>
            <p>Start your own project and invite others to join your team.</p>
          </div>
        </div>
        <div className="no-projects-actions">
          <button className="browse-projects-btn" onClick={() => {
            // Redirect to /projects and show create project modal
            window.location.href = "/projects";
          }}>
            Browse Projects
          </button>
          <button
            className="start-project-btn"
            onClick={() => {
              // Redirect to /projects and show create project modal
              window.location.href = "/projects";
            }}
          >
            Create Project
          </button>
        </div>
      </div>
    </div>
  );

  // Render project selector
  const renderProjectSelector = () => (
    <div className="project-selector">
      <div className="selector-header">
        <label htmlFor="project-select">Your Projects</label>
        <div className="selector-buttons">
          {isOwner && activeTab === 'team' && (
            <button
              className="invite-members-btn"
              onClick={() => setShowInviteModal(true)}
            >
              <Users size={16} />
              Invite Members
            </button>
          )}
          {activeTab === 'tasks' && selectedProject && (
            <button
              className="new-task-btn"
              onClick={() => setShowNewTaskModal(true)}
            >
              <Plus size={16} />
              New Task
            </button>
          )}
          {activeTab === 'files' && selectedProject && (
            <button
              className={`upload-btn ${isUploading ? 'uploading' : ''}`}
              onClick={handleFileUpload}
              disabled={isUploading}
            >
              <Upload size={16} />
              {isUploading ? 'Uploading...' : 'Upload Files'}
            </button>
          )}
        </div>
      </div>
      <select
        id="project-select"
        value={selectedProject?.id || ''}
        onChange={handleProjectChange}
      >
        <option value="">Select a project to collaborate</option>
        {userProjects.map(project => (
          <option key={project.id} value={project.id}>
            {project.title}
          </option>
        ))}
      </select>
    </div>
  );

  // Render no project selected message
  const renderNoProjectSelected = () => (
    <div className="no-project-selected">
      <h3>Select a Project to Begin</h3>
      <p>Choose one of your projects from the dropdown above to:</p>
      <div className="feature-list">
        <div className="feature-item">
          <MessageCircle size={20} />
          <span>Chat with team members in real-time</span>
        </div>
        <div className="feature-item">
          <CheckSquare size={20} />
          <span>Manage and track project tasks</span>
        </div>
        <div className="feature-item">
          <FileText size={20} />
          <span>Share and access project files</span>
        </div>
        <div className="feature-item">
          <Users size={20} />
          <span>Collaborate with team members</span>
        </div>
      </div>
    </div>
  );

  // Render active tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case 'chat':
        return <ChatTab project={selectedProject} />;
      case 'tasks':
        return <TasksTab
          project={selectedProject}
          isAdmin={isAdmin}
          isOwner={isOwner}
        />;
      case 'files':
        return <FilesTab project={selectedProject} isUploading={isUploading} />;
      case 'team':
        return <TeamTab project={selectedProject} isAdmin={isAdmin} isOwner={isOwner} />;
      default:
        return <ChatTab project={selectedProject} />;
    }
  };

  if (!user) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="collaboration-modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2>Collaboration Space</h2>
            <button className="close-btn" onClick={onClose}>
              <X size={24} />
            </button>
          </div>
          <div className="auth-required">
            <p>Please sign in to access the collaboration space</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="collaboration-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Collaboration Space</h2>
          <button className="close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        {userProjects.length === 0 ? (
          renderNoProjects()
        ) : (
          <div className="collaboration-content">
            {renderProjectSelector()}

            {!selectedProject ? (
              renderNoProjectSelected()
            ) : (
              <>
                <div className="collaboration-tabs">
                  <button
                    className={`tab-btn ${activeTab === 'chat' ? 'active' : ''}`}
                    onClick={() => setActiveTab('chat')}
                  >
                    <MessageCircle size={20} />
                    Chat
                  </button>
                  <button
                    className={`tab-btn ${activeTab === 'tasks' ? 'active' : ''}`}
                    onClick={() => setActiveTab('tasks')}
                  >
                    <CheckSquare size={20} />
                    Tasks
                  </button>
                  <button
                    className={`tab-btn ${activeTab === 'files' ? 'active' : ''}`}
                    onClick={() => setActiveTab('files')}
                  >
                    <FileText size={20} />
                    Files
                  </button>
                  <button
                    className={`tab-btn ${activeTab === 'team' ? 'active' : ''}`}
                    onClick={() => setActiveTab('team')}
                  >
                    <User size={20} />
                    Team
                  </button>
                </div>

                <div ref={contentRef} className="tab-content scrollable">
                  {renderTabContent()}
                </div>
              </>
            )}
          </div>
        )}

        {showInviteModal && isOwner && (
          <div className="invite-modal-overlay" onClick={() => setShowInviteModal(false)}>
            <div className="invite-modal" onClick={(e) => e.stopPropagation()}>
              <div className="invite-header">
                <h3>Invite Team Members</h3>
                <button className="close-btn" onClick={() => setShowInviteModal(false)}>
                  <X size={20} />
                </button>
              </div>
              <div className="invite-content">
                <p>Invite members to collaborate on {selectedProject?.title || 'your project'}:</p>
                <div className="invite-form">
                  <input
                    type="email"
                    placeholder="Enter Member Email Id"
                    className="invite-input"
                  />
                  <button className="send-invite-btn">
                    Send Invite
                  </button>
                </div>

                <div className="share-section">
                  <h4>Or share invitation link</h4>
                  <div className="share-link">
                    <input
                      type="text"
                      value="https://yourapp.com/invite/xyz123"
                      readOnly
                      className="share-input"
                    />
                    <button className="copy-btn">
                      <Copy size={16} />
                      Copy
                    </button>
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}

        {showNewTaskModal && (
          <div className="task-modal-overlay" onClick={() => setShowNewTaskModal(false)}>
            <div className="task-modal" onClick={(e) => e.stopPropagation()}>
              <div className="task-modal-header">
                <h3>Create New Task</h3>
                <button className="close-btn" onClick={() => setShowNewTaskModal(false)}>
                  <X size={20} />
                </button>
              </div>
              <form className="task-modal-form" onSubmit={handleCreateTask}>
                <div className="form-group">
                  <label>Task Title</label>
                  <input
                    type="text"
                    placeholder="Enter task title..."
                    value={newTask.title}
                    onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                    autoFocus
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    placeholder="Enter task description..."
                    value={newTask.description}
                    onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                    rows={4}
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Assign to</label>
                    <select
                      value={newTask.assignee}
                      onChange={(e) => setNewTask({ ...newTask, assignee: e.target.value })}
                    >
                      <option value="">Select assignee</option>
                      {selectedProject?.teamMembers && selectedProject.teamMembers.length > 0 ? (
                        selectedProject.teamMembers.map((member, index) => (
                          <option key={index} value={member.name}>
                            {member.name} {member.role ? `(${member.role})` : ''}
                          </option>
                        ))
                      ) : (
                        <option value="" disabled>No team members available</option>
                      )}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Due Date</label>
                    <input
                      type="date"
                      value={newTask.dueDate}
                      onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Priority</label>
                    <select
                      value={newTask.priority}
                      onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                </div>
                <div className="task-modal-actions">
                  <button type="button" className="cancel-btn" onClick={() => setShowNewTaskModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="create-task-btn">
                    Create Task
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default CollaborationSpace;