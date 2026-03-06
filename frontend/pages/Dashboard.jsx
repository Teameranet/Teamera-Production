import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Users, Bookmark, Settings, MessageSquare, User, CheckCircle, XCircle, Clock, Download } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useProjects } from '../context/ProjectContext';
import { useNotifications } from '../context/NotificationContext';
import UserAvatar from '../components/UserAvatar';
import ProfileModal from '../components/ProfileModal';
import CollaborationSpace from '../components/CollaborationSpace';
import './Dashboard.css';
import ProjectCard from '../components/ProjectCard'; // Added import for ProjectCard

// Dashboard component displays the main dashboard UI for authenticated users
function Dashboard() {
  // Get current user from AuthContext
  const { user } = useAuth();
  // Get location for navigation state
  const location = useLocation();
  // Get all projects and bookmarked projects from ProjectContext
  const { 
    projects, 
    bookmarkedProjects, 
    applications, 
    acceptApplication, 
    rejectApplication, 
    getReceivedApplications, 
    getSentApplications 
  } = useProjects();
  // Get notification functions
  const { addAcceptanceNotification, addRejectionNotification } = useNotifications();
  // State to manage which tab is active: 'bookmarks' or 'applications'
  const [activeTab, setActiveTab] = useState('bookmarks');
  // State to manage which application sub-tab is active: 'received' or 'sent'
  const [applicationTab, setApplicationTab] = useState('received');
  // State to track selected user for profile modal
  const [selectedUser, setSelectedUser] = useState(null);
  // State to track toast notifications
  const [toast, setToast] = useState({ show: false, message: '', type: '' });
  // State to track collaboration space
  const [showCollaborationSpace, setShowCollaborationSpace] = useState(false);
  // State to track the active project in collaboration space
  const [activeCollabProject, setActiveCollabProject] = useState(null);
  // State to track pending collaboration space opening
  const [pendingCollabProjectId, setPendingCollabProjectId] = useState(null);

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

  // Handle pending collaboration space opening
  useEffect(() => {
    if (pendingCollabProjectId) {
      console.log('Looking for project with ID:', pendingCollabProjectId);
      console.log('Available projects:', projects.map(p => ({ id: p.id, title: p.title, teamMembers: p.teamMembers.length })));
      
      const updatedProject = projects.find(p => p.id === pendingCollabProjectId);
      if (updatedProject) {
        console.log('Found updated project:', updatedProject.title, 'with', updatedProject.teamMembers.length, 'team members');
        setActiveCollabProject(updatedProject);
        setShowCollaborationSpace(true);
        setPendingCollabProjectId(null); // Clear the pending state
      } else {
        console.log('Project not found yet, waiting for state update...');
      }
    }
  }, [pendingCollabProjectId, projects]);

  // Get applications for the current user
  const receivedApplications = user ? getReceivedApplications(user.id) : [];
  const sentApplications = user ? getSentApplications(user.id) : [];

  // Filter applications based on the selected tab
  const filteredApplications = applicationTab === 'received' ? receivedApplications : sentApplications;

  // Get real application counts
  const receivedApplicationsCount = receivedApplications.filter(app => app.status === 'PENDING').length;
  const sentApplicationsCount = sentApplications.length;

  // Get bookmarked projects
  const bookmarkedProjectsList = projects.filter(project => 
    bookmarkedProjects.includes(project.id)
  );

  // Function to handle accepting an application
  const handleAcceptApplication = (applicationId) => {
    // Find the application
    const application = applications.find(app => app.id === applicationId);
    
    if (!application) return;
    
    // Accept the application using context function
    const success = acceptApplication(applicationId);
    
    if (success) {
      // Send acceptance notification to the applicant
      addAcceptanceNotification(
        application.applicantId,
        application.projectName,
        application.position
      );
      
      // Show success toast
      setToast({
        show: true,
        message: `${application.applicantName} has been added to the project`,
        type: 'success'
      });
      
      // Set pending collaboration space opening
      setPendingCollabProjectId(application.projectId);
      
      // Hide toast after delay
      setTimeout(() => {
        setToast({ show: false, message: '', type: '' });
      }, 3000);
    }
  };

  // Function to handle rejecting an application
  const handleRejectApplication = (applicationId) => {
    // Find the application
    const application = applications.find(app => app.id === applicationId);
    
    if (!application) return;
    
    // Reject the application using context function
    const success = rejectApplication(applicationId);
    
    if (success) {
      // Send rejection notification to the applicant
      addRejectionNotification(
        application.applicantId,
        application.projectName,
        application.position
      );
      
      // Show toast notification
      setToast({
        show: true,
        message: 'Application has been rejected',
        type: 'error'
      });
      
      // Hide toast after delay
      setTimeout(() => {
        setToast({ show: false, message: '', type: '' });
      }, 2000);
    }
  };

  // Function to handle viewing an applicant's profile
  const handleViewProfile = (applicantId) => {
    console.log(`Viewing profile for ${applicantId}`);
    // Find the selected user from applications
    const application = applications.find(app => app.applicantId === applicantId);
    if (application && application.userDetails) {
      // If viewing from "Sent" section, show current user's profile
      // If viewing from "Received" section, show applicant's profile
      if (applicationTab === 'sent') {
        setSelectedUser(user);
      } else {
        setSelectedUser(application.userDetails);
      }
    }
  };

  // Function to close the profile modal
  const handleCloseProfileModal = () => {
    setSelectedUser(null);
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

      {/* Dashboard tabs for switching between Bookmarks and Applications */}
      <div className="dashboard-tabs">
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
                      setActiveCollabProject(project);
                      setShowCollaborationSpace(true);
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
            <h3>Application Management</h3>
            
            {/* Tabs for received and sent applications */}
            <div className="applications-tabs">
              <button 
                className={`app-tab ${applicationTab === 'received' ? 'active' : ''}`}
                onClick={() => setApplicationTab('received')}
              >
                Received ({receivedApplicationsCount})
              </button>
              <button 
                className={`app-tab ${applicationTab === 'sent' ? 'active' : ''}`}
                onClick={() => setApplicationTab('sent')}
              >
                Sent ({sentApplicationsCount})
              </button>
            </div>
            
            {/* Applications list */}
            {filteredApplications.length > 0 ? (
              <div className="applications-list">
                {filteredApplications.map(application => (
                  <div key={application.id} className="application-item">
                    {/* Applicant info */}
                    <div className="applicant-info">
                      <UserAvatar 
                        user={{ name: application.applicantName }} 
                        size="medium"
                        className="applicant-avatar"
                      />
                      <div className="applicant-details">
                        <h4>{application.applicantName}</h4>
                        <p className="profile-title">{applicationTab === 'sent' ? (user.title || getRoleDisplayTitle(user.role)) : (user.title || 'Member')}</p>
                        <span>Applied {getRelativeTime(application.appliedDate)}</span>
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
                        {application.message}
                      </p>
                    </div>
                    
                    {/* Status and actions */}
                    <div className="application-status-actions">
                      <div className={`application-status status-${application.status.toLowerCase()}`}>
                        {application.status === 'PENDING' && <Clock size={16} />}
                        {application.status === 'ACCEPTED' && <CheckCircle size={16} />}
                        {application.status === 'REJECTED' && <XCircle size={16} />}
                        <span>{application.status}</span>
                      </div>
                      
                      <div className="application-actions">
                        <button 
                          className="view-profile-btn" 
                          onClick={() => handleViewProfile(application.applicantId)}
                        >
                          <User size={16} />
                          Profile
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
                        
                        {application.status === 'PENDING' && applicationTab === 'received' && (
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
                <p>No applications to display.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Toast notification */}
      {toast.show && (
        <div className={`toast-notification ${toast.type}`}>
          <div className="toast-content">
            <div className="toast-icon">
              {toast.type === 'success' ? '✓' : '✕'}
            </div>
            <div className="toast-message">{toast.message}</div>
          </div>
        </div>
      )}
      
      {/* Profile Modal */}
      {selectedUser && (
        <ProfileModal
          user={selectedUser}
          onClose={handleCloseProfileModal}
        />
      )}
      
      {/* Collaboration Space Modal */}
      {showCollaborationSpace && (
        <CollaborationSpace
          activeProject={activeCollabProject}
          onClose={() => setShowCollaborationSpace(false)}
          defaultTab="team"
        />
      )}
    </div>
  );
}

export default Dashboard;