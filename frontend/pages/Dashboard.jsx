import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Users, Bookmark, Settings, MessageCircle, User, CheckCircle, XCircle, Clock, Download, LayoutDashboard, ExternalLink, X, LogOut, Mail } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useProjects } from '../context/ProjectContext';
import { useNotifications } from '../context/NotificationContext';
import UserAvatar from '../components/UserAvatar';
import ProfileModal from '../components/ProfileModal';
import ProjectModal from '../components/ProjectModal';
import CreateProjectModal from '../components/CreateProjectModal';
import './Dashboard.css';
import '../components/tabs/WorkspaceTabs.css';
import ProjectCard from '../components/ProjectCard';

// Dashboard component displays the main dashboard UI for authenticated users
// 
// APPLICATION COLLECTION STRUCTURE (from SYSTEM_FLOW_DATABASE_SCHEMA.md):
// - Each user has ONE Application document (userId is unique)
// - applications_received[]: Applications this user received as project owner
//   - Contains: applicantId, applicantName, applicantEmail, applicantAvatar, applicantTitle, applicantLocation
//   - Project info: projectId, projectName, projectStage
//   - Application: position, message, skills, status (PENDING/ACCEPTED/REJECTED/REMOVED)
//   - Resume: hasResume, resumeUrl, resumeFileName, attachments[]
//   - Review: reviewNotes, reviewedAt, reviewedBy, rating, removedFromTeamAt, removalReason
// - applications_sent[]: Applications this user sent as applicant
//   - Contains: projectOwnerId, projectOwnerName, projectOwnerEmail, projectOwnerAvatar
//   - Project info: projectId, projectName, projectStage, projectIndustry
//   - Application: position, message, skills, status (PENDING/ACCEPTED/REJECTED/QUIT/REMOVED/INVITED)
//   - Resume: hasResume, resumeUrl, resumeFileName, attachments[]
//   - Review: reviewNotes, reviewedAt, reviewedBy, rejectionReason, removedFromTeamAt, removalReason
// - stats: Aggregated counts for both received and sent applications
function Dashboard() {
  // Get current user from AuthContext
  const { user } = useAuth();
  // Get location for navigation state
  const location = useLocation();
  const navigate = useNavigate();
  // Get all projects and bookmarked projects from ProjectContext
  const { 
    projects, 
    bookmarkedProjects, 
    applications,
    applicationsLoading,
    fetchApplications,
    acceptApplication, 
    rejectApplication, 
    getReceivedApplications, 
    getSentApplications,
    getUserProjects,
    deleteProject,
    editProject,
    leaveProject
  } = useProjects();
  // Get notification functions
  const { addAcceptanceNotification, addRejectionNotification, showToast } = useNotifications();
  // State to manage which tab is active: 'myprojects', 'bookmarks' or 'applications'
  const [activeTab, setActiveTab] = useState('myprojects');
  // State to manage which My Projects sub-tab is active: 'owned' or 'participating'
  const [myProjectsSubTab, setMyProjectsSubTab] = useState('owned');
  // State to hold user's owned and participating projects
  const [userProjects, setUserProjects] = useState({ owned: [], participating: [] });
  // State to show/hide create project modal
  const [showCreateProject, setShowCreateProject] = useState(false);
  // State to hold the project being edited
  const [projectToEdit, setProjectToEdit] = useState(null);
  // State to manage which application sub-tab is active: 'received' or 'sent'
  const [applicationTab, setApplicationTab] = useState('received');
  // State to track selected user for profile modal
  const [selectedUser, setSelectedUser] = useState(null);
  // State to track selected project for project modal (from bookmarks)
  const [selectedProject, setSelectedProject] = useState(null);
  const [showProjectModal, setShowProjectModal] = useState(false);
  // State to track selected project for project modal (from applications)
  const [selectedProjectForModal, setSelectedProjectForModal] = useState(null);
  // State for quit project confirmation modal
  const [quitProjectTarget, setQuitProjectTarget] = useState(null); // { id, title }
  const [quitLoading, setQuitLoading] = useState(false);

  // Fetch user's owned and participating projects
  useEffect(() => {
    if (user) {
      getUserProjects(user.id).then(result => {
        setUserProjects(result || { owned: [], participating: [] });
      });
    }
  }, [user, projects]);

  // Handle navigation from notifications
  useEffect(() => {
    if (location.state) {
      const { tab, subTab } = location.state;
      if (tab) {
        setActiveTab(tab);
      }
      if (subTab) {
        setApplicationTab(subTab);
      }
      // Clear the navigation state to prevent issues on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Refresh applications when switching to applications tab
  useEffect(() => {
    if (activeTab === 'applications' && user) {
      console.log('Applications tab active, refreshing data...');
      fetchApplications();
    }
  }, [activeTab, user]);

  // Get applications for the current user based on the Application collection schema
  // applications_received: Applications where current user is the project owner
  // applications_sent: Applications where current user is the applicant
  const receivedApplications = user ? getReceivedApplications(user.id) : [];
  const sentApplications = user ? getSentApplications(user.id) : [];

  // Debug logging
  useEffect(() => {
    if (user) {
      console.log('Dashboard - Current User ID:', user.id);
      console.log('Dashboard - Total Applications:', applications.length);
      console.log('Dashboard - Received Applications (as project owner):', receivedApplications.length);
      console.log('Dashboard - Sent Applications (as applicant):', sentApplications.length);
      
      if (applications.length > 0) {
        console.log('Sample Application:', applications[0]);
      }
    }
  }, [user, applications, receivedApplications.length, sentApplications.length]);

  // Filter applications based on the selected tab
  // 'received' tab shows applications_received (user is project owner)
  // 'sent' tab shows applications_sent (user is applicant)
  const filteredApplications = (applicationTab === 'received' ? receivedApplications : sentApplications)
    .slice()
    .sort((a, b) => new Date(b.appliedDate) - new Date(a.appliedDate));

  // Get real application counts from the Application collection
  const receivedApplicationsCount = receivedApplications.length;
  const sentApplicationsCount = sentApplications.length;

  // Get bookmarked projects
  const bookmarkedProjectsList = projects.filter(project => 
    bookmarkedProjects.includes(project.id)
  );

  // Function to handle editing a project
  const handleEditProject = (project) => {
    setProjectToEdit(project);
    setShowCreateProject(true);
  };

  // Function to close the create/edit project modal
  const handleCloseCreateModal = () => {
    setShowCreateProject(false);
    setProjectToEdit(null);
  };

  // Function to handle deleting a project
  const handleDeleteProject = async (projectId) => {
    const success = await deleteProject(projectId);
    if (success) {
      setUserProjects(prev => ({
        ...prev,
        owned: prev.owned.filter(p => (p.id || p._id) !== projectId)
      }));
      showToast({ type: 'success', title: 'Project deleted', description: 'Your project has been removed.' });
    }
  };

  // Function to handle leaving a project (participating)
  const handleLeaveProject = (project) => {
    setQuitProjectTarget({ id: project.id || project._id, title: project.title });
  };

  const handleConfirmQuit = async () => {
    if (!quitProjectTarget) return;
    setQuitLoading(true);
    const success = await leaveProject(quitProjectTarget.id, user.id);
    setQuitLoading(false);
    setQuitProjectTarget(null);
    if (success) {
      setUserProjects(prev => ({
        ...prev,
        participating: prev.participating.filter(p => (p.id || p._id) !== quitProjectTarget.id)
      }));
      showToast({ type: 'success', title: 'Left project', description: `You have left "${quitProjectTarget.title}".` });
    } else {
      showToast({ type: 'error', title: 'Failed to quit', description: 'Something went wrong. Please try again.' });
    }
  };

  // Function to handle accepting an application
  const handleAcceptApplication = async (applicationId) => {
    // Find the application
    const application = applications.find(app => app.id === applicationId || app.applicationId === applicationId);
    
    if (!application) {
      console.error('Application not found:', applicationId);
      return;
    }
    
    // Accept the application using context function
    const success = await acceptApplication(applicationId);
    
    if (success) {
      // Send acceptance notification to the applicant
      addAcceptanceNotification(
        application.applicantId,
        application.projectName,
        application.position
      );

      showToast({
        type: 'success',
        title: 'Application accepted',
        description: `${application.applicantName} has been added to '${application.projectName}'.`,
        action: {
          label: 'Open Workspace',
          onClick: () => {
            const projectId = String(application.projectId?._id || application.projectId);
            if (projectId) localStorage.setItem('workspace_selected_project', projectId);
            navigate('/workspace');
          }
        }
      });
    } else {
      showToast({
        type: 'error',
        title: 'Failed to accept application',
        description: 'Something went wrong. Please try again.',
      });
    }
  };

  // Function to handle rejecting an application
  const handleRejectApplication = async (applicationId) => {
    // Find the application
    const application = applications.find(app => app.id === applicationId || app.applicationId === applicationId);
    
    if (!application) {
      console.error('Application not found:', applicationId);
      return;
    }
    
    // Reject the application using context function
    const success = await rejectApplication(applicationId);
    
    if (success) {
      // Send rejection notification to the applicant
      addRejectionNotification(
        application.applicantId,
        application.projectName,
        application.position
      );
      
      showToast({
        type: 'warning',
        title: 'Application rejected',
        description: `${application.applicantName}'s application for '${application.position}' has been declined.`,
      });
    } else {
      showToast({
        type: 'error',
        title: 'Failed to reject application',
        description: 'Something went wrong. Please try again.',
      });
    }
  };

  // Function to handle viewing profile/project based on tab
  const handleViewProfile = async (application) => {
    console.log(`Viewing details for application:`, application);
    
    // type:'sent' = member's record → show the project they applied/were invited to
    if (application.type === 'sent') {
      const project = projects.find(p => 
        (p.id === application.projectId || p._id === application.projectId)
      );
      
      if (project) {
        setSelectedProjectForModal(project);
      } else {
        try {
          const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
          const projectId = typeof application.projectId === 'object' 
            ? application.projectId._id || application.projectId.toString() 
            : application.projectId.toString();
          
          const response = await fetch(`${apiBaseUrl}/api/projects/${projectId}`);
          const result = await response.json();
          
          if (result.success && result.data) {
            setSelectedProjectForModal({ ...result.data, id: result.data._id || result.data.id });
          }
        } catch (error) {
          console.error('Error fetching project:', error);
        }
      }
      return;
    }
    
    // type:'received' = owner's record → show the applicant's profile
    try {
      setSelectedUser({ loading: true });
      
      const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const idToFetch = typeof application.applicantId === 'object' 
        ? application.applicantId._id || application.applicantId.toString() 
        : application.applicantId.toString();
      
      const response = await fetch(`${apiBaseUrl}/api/users/${idToFetch}/profile`);
      const result = await response.json();
      
      if (result.success && result.data) {
        setSelectedUser({ ...result.data, id: result.data._id || result.data.id });
      } else {
        setSelectedUser(application.userDetails || null);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setSelectedUser(application.userDetails || null);
    }
  };

  // Function to handle viewing project details
  const handleViewProject = async (application) => {
    console.log(`Viewing project for application:`, application);
    
    // Find the project from the projects list
    const project = projects.find(p => 
      (p.id === application.projectId || p._id === application.projectId)
    );
    
    if (project) {
      setSelectedProjectForModal(project);
    } else {
      // If project not in local state, fetch it
      try {
        const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const projectId = typeof application.projectId === 'object' 
          ? application.projectId._id || application.projectId.toString() 
          : application.projectId.toString();
        
        const response = await fetch(`${apiBaseUrl}/api/projects/${projectId}`);
        const result = await response.json();
        
        if (result.success && result.data) {
          const projectData = {
            ...result.data,
            id: result.data._id || result.data.id
          };
          setSelectedProjectForModal(projectData);
        } else {
          console.error('Failed to fetch project:', result.message);
        }
      } catch (error) {
        console.error('Error fetching project:', error);
      }
    }
  };

  // Function to close the profile modal
  const handleCloseProfileModal = () => {
    setSelectedUser(null);
  };

  // Open workspace for a project linked to an application
  const handleOpenWorkspace = (application) => {
    const projectId = typeof application.projectId === 'object'
      ? application.projectId._id || application.projectId.toString()
      : application.projectId?.toString();

    if (projectId) {
      localStorage.setItem('workspace_selected_project', projectId);
    }
    navigate('/workspace');
  };

  // Function to handle sending a message to an applicant
  const handleSendMessage = (applicantId) => {
    console.log(`Sending message to ${applicantId}`);
    // In a real app, this would open a messaging interface
  };

  // Function to handle downloading a resume
  const handleDownloadResume = (resumeUrl, applicantName) => {
    console.log(`Downloading resume from ${resumeUrl} for ${applicantName}`);
    // In a real app, this would trigger the file download
    // For demo purposes, we'll just log it
    window.open(resumeUrl, '_blank');
  };

  // Format date to relative time (e.g., "2 days ago")
  const getRelativeTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
    return `${Math.floor(diffInDays / 30)} months ago`;
  };

  // Map user role to display title (match Profile page behavior)
  const getRoleDisplayTitle = (role) => {
    const roleMap = {
      'founder': 'The Founder',
      'professional': 'The Professional',
      'investor': 'The Investor',
      'student': 'The Student'
    };
    return roleMap[role] || role || 'Developer';
  };

  // If user is not authenticated, show a message
  if (!user) {
    return (
      <div className="dashboard-container">
        <div className="auth-required">
          <h2>Please sign in to access your dashboard</h2>
        </div>
      </div>
    );
  }

  // Main dashboard layout
  return (
    <div className="dashboard-container">
      {/* Dashboard header */}
      <header className="dashboard-header">
        <div className="header-content">
          <h1 style={{ color: 'white' }}>Welcome back, {user.name}!</h1>
          <p style={{ color: 'white' }}>Here's what's happening with your projects</p>
        </div>
        {/* <div className="header-actions">
          <button className="settings-btn" title="Settings">
            <Settings size={24} />
          </button>
        </div> */}
      </header>

      {/* Dashboard tabs for switching between My Projects, Bookmarks and Applications */}
      <div className="dashboard-tabs">
        <button
          className={`tab-btn ${activeTab === 'myprojects' ? 'active' : ''}`}
          onClick={() => setActiveTab('myprojects')}
        >
          My Projects
        </button>
        <button
          className={`tab-btn ${activeTab === 'bookmarks' ? 'active' : ''}`}
          onClick={() => setActiveTab('bookmarks')}
        >
          Bookmarked Projects
        </button>
        <button
          className={`tab-btn ${activeTab === 'applications' ? 'active' : ''}`}
          onClick={() => setActiveTab('applications')}
        >
          Applications
        </button>
      </div>

      {/* Main content area */}
      <div className="dashboard-content">
        {activeTab === 'myprojects' && (
          <div className="myprojects-content">
            <div className="myprojects-subtabs">
              <button
                className={`subtab-btn ${myProjectsSubTab === 'owned' ? 'active' : ''}`}
                onClick={() => setMyProjectsSubTab('owned')}
              >
                Projects I Own ({userProjects.owned.length})
              </button>
              <button
                className={`subtab-btn ${myProjectsSubTab === 'participating' ? 'active' : ''}`}
                onClick={() => setMyProjectsSubTab('participating')}
              >
                Projects I'm In ({userProjects.participating.length})
              </button>
            </div>

            {myProjectsSubTab === 'owned' && (
              <div className="projects-grid">
                {userProjects.owned.length === 0 ? (
                  <div className="empty-state">
                    <p>You haven't created any projects yet.</p>
                    <button className="empty-state-btn" onClick={() => setShowCreateProject(true)}>+ Create Your First Project</button>
                  </div>
                ) : (
                  userProjects.owned.map(project => (
                    <ProjectCard
                      key={project.id || project._id}
                      project={project}
                      isOwned={true}
                      onEdit={() => handleEditProject(project)}
                      onDelete={() => handleDeleteProject(project.id || project._id)}
                      onClick={() => {
                        localStorage.setItem('workspace_selected_project', project.id || project._id);
                        navigate('/workspace');
                      }}
                    />
                  ))
                )}
              </div>
            )}

            {myProjectsSubTab === 'participating' && (
              <div className="projects-grid">
                {userProjects.participating.length === 0 ? (
                  <div className="empty-state">
                    <p>You haven't joined any projects yet.</p>
                    <a href="/projects" className="empty-state-link">Browse Projects to Apply →</a>
                  </div>
                ) : (
                  userProjects.participating.map(project => (
                    <ProjectCard
                      key={project.id || project._id}
                      project={project}
                      isParticipating={true}
                      onLeave={() => handleLeaveProject(project)}
                      onClick={() => {
                        localStorage.setItem('workspace_selected_project', project.id || project._id);
                        navigate('/workspace');
                      }}
                    />
                  ))
                )}
              </div>
            )}
          </div>
        )}
        {activeTab === 'bookmarks' && (
          <div className="projects-content">
            <span className="projects-count">{bookmarkedProjectsList.length} bookmarked projects</span>
            {bookmarkedProjectsList.length > 0 ? (
              <div className="projects-grid">
                {bookmarkedProjectsList.map(project => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    onClick={(project) => {
                      setSelectedProject(project);
                      setShowProjectModal(true);
                    }}
                  />
                ))}
              </div>
            ) : (
              <div className="empty-bookmarks">
                <Bookmark size={48} />
                <h3>No Projects Bookmarked</h3>
                <p>Browse projects and bookmark the ones you're interested in to see them here.</p>
              </div>
            )}
          </div>
        )}
        {activeTab === 'applications' && (
          <div className="applications-content">
            {/* <h3>Application Management</h3> */}
            
            {/* Tabs for received and sent applications */}
            <div className="myprojects-subtabs">
              <button 
                className={`subtab-btn ${applicationTab === 'received' ? 'active' : ''}`}
                onClick={() => setApplicationTab('received')}
              >
                Received ({receivedApplicationsCount})
              </button>
              <button 
                className={`subtab-btn ${applicationTab === 'sent' ? 'active' : ''}`}
                onClick={() => setApplicationTab('sent')}
              >
                Sent ({sentApplicationsCount})
              </button>
            </div>
            
            {/* Applications list */}
            {applicationsLoading ? (
              <div className="empty-applications">
                <p>Loading applications...</p>
              </div>
            ) : filteredApplications.length > 0 ? (
              <div className="applications-list">
                {filteredApplications.map(application => (
                  <div key={application.id} className="application-item">
                    {/*
                      Display logic uses application.type (the raw backend source), NOT applicationTab.
                      Reason: invitations are cross-tab — an invitation in the "Received" tab has
                      type:'sent' (member's record), and one in "Sent" has type:'received' (owner's record).
                      Using applicationTab would read the wrong fields and show undefined names.

                      type:'received' = owner's record  → has applicantName, applicantTitle, applicantLocation
                      type:'sent'     = member's record → has projectOwnerName
                    */}
                    <div className="applicant-info">
                      <UserAvatar
                        user={{
                          name: application.type === 'received'
                            ? application.applicantName
                            : application.projectOwnerName
                        }}
                        size="medium"
                        className="applicant-avatar"
                      />
                      <div className="applicant-details">
                        <h4>
                          {application.type === 'received'
                            ? application.applicantName
                            : application.projectOwnerName}
                        </h4>
                        <p className="profile-title">
                          {application.type === 'received'
                            ? (application.applicantTitle || 'Member')
                            : 'Project Owner'}
                        </p>
                        {application.type === 'received' && application.applicantLocation && (
                          <span className="applicant-location">{application.applicantLocation}</span>
                        )}
                        <span>{application.status === 'INVITED' ? 'Invited' : 'Applied'} {getRelativeTime(application.appliedDate)}</span>
                      </div>
                    </div>

                    {/* Application details */}
                    <div className="application-details">
                      <div className="application-project">
                        <p>{application.projectName}</p>
                        <span>{application.position} position</span>
                      </div>

                      <div className="applicant-skills">
                        {application.skills.map((skill, index) => (
                          <span key={index} className="skill-tag">{skill}</span>
                        ))}
                      </div>

                      <p className="application-message">
                        {application.status === 'INVITED'
                          ? (application.type === 'sent'
                              // Member's record: they received the invite
                              ? `${application.projectOwnerName} invited you to join as ${application.position}`
                              // Owner's record: they sent the invite
                              : `You invited ${application.applicantName} to join as ${application.position}`)
                          : application.message}
                      </p>
                    </div>

                    {/* Status badge + action buttons */}
                    <div className="application-status-actions">
                      <div className={`application-status status-${application.status.toLowerCase()}`}>
                        {application.status === 'PENDING'  && <Clock size={16} />}
                        {application.status === 'ACCEPTED' && <CheckCircle size={16} />}
                        {application.status === 'INVITED'  && <Mail size={16} />}
                        {(application.status === 'REJECTED' || application.status === 'QUIT' || application.status === 'REMOVED') && <XCircle size={16} />}
                        <span>
                          {application.status === 'QUIT'    ? 'Quit'    :
                           application.status === 'REMOVED' ? 'Removed' :
                           application.status === 'INVITED' ? 'Invited' :
                           application.status.charAt(0) + application.status.slice(1).toLowerCase()}
                        </span>
                      </div>

                      <div className="application-actions">
                        {/* Profile button — only for owner's records (type:'received'), never for invitations in member view */}
                        {application.type === 'received' && (
                          <button
                            className="view-profile-btn"
                            onClick={() => handleViewProfile(application)}
                          >
                            <User size={16} />
                            Profile
                          </button>
                        )}

                        <button
                          className="view-project-btn"
                          onClick={() => handleViewProject(application)}
                        >
                          <ExternalLink size={16} />
                          View Project
                        </button>

                        {application.hasResume && (
                          <button
                            className="resume-btn"
                            onClick={() => handleDownloadResume(application.resumeUrl, application.applicantName)}
                          >
                            <Download size={16} />
                            Resume
                          </button>
                        )}

                        {/* Workspace — visible when accepted or when owner has an active invitation */}
                        {(application.status === 'ACCEPTED' ||
                          (application.status === 'INVITED' && application.type === 'received') ||
                          (application.status === 'INVITED' && application.type === 'sent')) && (
                          <button
                            className="workspace-btn"
                            onClick={() => handleOpenWorkspace(application)}
                          >
                            <MessageCircle size={16} />
                            My Workspace
                          </button>
                        )}

                        {/* Accept / Reject — only for regular PENDING applications (never for invitations) */}
                        {application.status === 'PENDING' && application.type === 'received' && (
                          <div className="decision-actions">
                            <button
                              className="accept-btn"
                              onClick={() => handleAcceptApplication(application.id)}
                            >
                              Accept
                            </button>
                            <button
                              className="reject-btn"
                              onClick={() => handleRejectApplication(application.id)}
                            >
                              Reject
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-applications">
                <p>
                  {applicationTab === 'received' 
                    ? 'No applications or invitations received yet. Applications from users and invitations you accepted will appear here.' 
                    : 'No sent applications or invitations yet. Applications you submitted and invitations you sent to members will appear here.'}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Profile Modal */}
      {selectedUser && (
        <ProfileModal
          user={selectedUser}
          onClose={handleCloseProfileModal}
        />
      )}
      
      {/* Project Modal for Bookmarks */}
      {showProjectModal && selectedProject && (
        <ProjectModal
          project={selectedProject}
          onClose={() => {
            setShowProjectModal(false);
            setSelectedProject(null);
          }}
          onOpenCollaboration={(project) => {
            const id = project.id || project._id;
            if (id) localStorage.setItem('workspace_selected_project', id);
            navigate('/workspace');
          }}
        />
      )}
      
      {/* Project Modal for Applications */}
      {selectedProjectForModal && (
        <ProjectModal
          project={selectedProjectForModal}
          onClose={() => setSelectedProjectForModal(null)}
          onOpenCollaboration={(project) => {
            const id = project.id || project._id;
            if (id) localStorage.setItem('workspace_selected_project', id);
            navigate('/workspace');
          }}
        />
      )}
      
      {/* Create Project Modal */}
      {showCreateProject && (
        <CreateProjectModal
          onClose={handleCloseCreateModal}
          projectToEdit={projectToEdit}
        />
      )}

      {/* Quit Project Confirmation Modal */}
      {quitProjectTarget && (
        <div className="wt-modal-overlay" onClick={() => setQuitProjectTarget(null)}>
          <div className="wt-modal wt-modal--sm" onClick={e => e.stopPropagation()}>
            <div className="wt-modal-header">
              <h4 className="wt-modal-title">Quit Project</h4>
              <button className="wt-modal-close" onClick={() => setQuitProjectTarget(null)}><X size={16} /></button>
            </div>
            <div className="wt-modal-body">
              <p style={{ margin: 0, color: '#4b5563', fontSize: '0.9rem' }}>
                Are you sure you want to leave <strong>{quitProjectTarget.title}</strong>? You will lose access to this project's workspace.
              </p>
              <div className="wt-modal-footer">
                <button className="wt-btn wt-btn--ghost" onClick={() => setQuitProjectTarget(null)}>Cancel</button>
                <button
                  className="wt-btn wt-btn--danger"
                  onClick={handleConfirmQuit}
                  disabled={quitLoading}
                >
                  {quitLoading ? 'Leaving…' : 'Quit Project'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;