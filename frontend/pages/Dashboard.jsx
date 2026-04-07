import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Users, Bookmark, Settings, MessageSquare, User, CheckCircle, XCircle, Clock, Download, FileText } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useProjects } from '../context/ProjectContext';
import { useNotifications } from '../context/NotificationContext';
import UserAvatar from '../components/UserAvatar';
import ProfileModal from '../components/ProfileModal';
import ProjectModal from '../components/ProjectModal';
import CollaborationSpace from '../components/CollaborationSpace';
import './Dashboard.css';
import ProjectCard from '../components/ProjectCard'; // Added import for ProjectCard

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
    getSentApplications 
  } = useProjects();
  // Get notification functions
  const { addAcceptanceNotification, addRejectionNotification, showToast } = useNotifications();
  // State to manage which tab is active: 'bookmarks' or 'applications'
  const [activeTab, setActiveTab] = useState('bookmarks');
  // State to manage which application sub-tab is active: 'received' or 'sent'
  const [applicationTab, setApplicationTab] = useState('received');
  // State to track selected user for profile modal
  const [selectedUser, setSelectedUser] = useState(null);
  // State to track selected project for project modal (from bookmarks)
  const [selectedProject, setSelectedProject] = useState(null);
  const [showProjectModal, setShowProjectModal] = useState(false);
  // State to track selected project for project modal (from applications)
  const [selectedProjectForModal, setSelectedProjectForModal] = useState(null);
  // State to track collaboration space
  const [showCollaborationSpace, setShowCollaborationSpace] = useState(false);
  // State to track the active project in collaboration space
  const [activeCollabProject, setActiveCollabProject] = useState(null);

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
  const filteredApplications = applicationTab === 'received' ? receivedApplications : sentApplications;

  // Get real application counts from the Application collection
  const receivedApplicationsCount = receivedApplications.length;
  const sentApplicationsCount = sentApplications.length;

  // Get bookmarked projects
  const bookmarkedProjectsList = projects.filter(project => 
    bookmarkedProjects.includes(project.id)
  );

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
      
      // Find the project object to pass to the action function
      const acceptedProject = projects.find(p => p.id === application.projectId);

      showToast({
        type: 'success',
        title: 'Application accepted',
        description: `${application.applicantName} has been added to '${application.projectName}'.`,
        action: {
          label: 'Open Workspace',
          onClick: () => {
            if (acceptedProject) {
              setActiveCollabProject(acceptedProject);
              setShowCollaborationSpace(true);
            }
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
    
    // In "Sent" tab: Show project modal (the project you applied to)
    if (applicationTab === 'sent') {
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
      return;
    }
    
    // In "Received" tab: Show applicant's profile (who applied to your project)
    try {
      // Show loading state
      setSelectedUser({ loading: true });
      
      const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      
      // Convert applicantId to string for comparison
      const idToFetch = typeof application.applicantId === 'object' 
        ? application.applicantId._id || application.applicantId.toString() 
        : application.applicantId.toString();
      
      console.log('Fetching applicant profile for ID:', idToFetch);
      
      const response = await fetch(`${apiBaseUrl}/api/users/${idToFetch}/profile`);
      const result = await response.json();
      
      console.log('Fetched user profile result:', result);
      
      if (result.success && result.data) {
        // Add id field if not present
        const userData = {
          ...result.data,
          id: result.data._id || result.data.id
        };
        setSelectedUser(userData);
      } else {
        console.error('Failed to fetch user profile:', result.message);
        // Fallback to application userDetails if API fails
        if (application.userDetails) {
          setSelectedUser(application.userDetails);
        } else {
          setSelectedUser(null);
        }
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      // Fallback to application userDetails
      if (application.userDetails) {
        setSelectedUser(application.userDetails);
      } else {
        setSelectedUser(null);
      }
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
            {applicationsLoading ? (
              <div className="empty-applications">
                <p>Loading applications...</p>
              </div>
            ) : filteredApplications.length > 0 ? (
              <div className="applications-list">
                {filteredApplications.map(application => (
                  <div key={application.id} className="application-item">
                    {/* Applicant info - Display based on tab context */}
                    <div className="applicant-info">
                      <UserAvatar 
                        user={{ 
                          name: applicationTab === 'received' 
                            ? application.applicantName 
                            : application.projectOwnerName 
                        }} 
                        size="medium"
                        className="applicant-avatar"
                      />
                      <div className="applicant-details">
                        <h4>
                          {applicationTab === 'received' 
                            ? application.applicantName 
                            : application.projectOwnerName}
                        </h4>
                        <p className="profile-title">
                          {applicationTab === 'received' 
                            ? (application.applicantTitle || 'Member')
                            : 'Project Owner'}
                        </p>
                        {applicationTab === 'received' && application.applicantLocation && (
                          <span className="applicant-location">{application.applicantLocation}</span>
                        )}
                        <span>Applied {getRelativeTime(application.appliedDate)}</span>
                      </div>
                    </div>
                    
                    {/* Application details from Application collection schema */}
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
                    
                    {/* Status and actions - Aligned with Application schema statuses */}
                    <div className="application-status-actions">
                      <div className={`application-status status-${application.status.toLowerCase()}`}>
                        {application.status === 'PENDING' && <Clock size={16} />}
                        {application.status === 'ACCEPTED' && <CheckCircle size={16} />}
                        {application.status === 'INVITED' && <CheckCircle size={16} />}
                        {(application.status === 'REJECTED' || application.status === 'QUIT') && <XCircle size={16} />}
                        {application.status === 'REMOVED' && <XCircle size={16} />}
                        <span>
                          {application.status === 'QUIT' ? 'Quit' : 
                           application.status === 'REMOVED' ? 'Removed' :
                           application.status.charAt(0) + application.status.slice(1).toLowerCase()}
                        </span>
                      </div>
                      
                      <div className="application-actions">
                        {applicationTab === 'received' && (
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
                          <FileText size={16} />
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
                        
                        {/* Only show accept/reject for PENDING applications in received tab */}
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
                <p>
                  {applicationTab === 'received' 
                    ? 'No applications received yet. When users apply to your projects, their applications will appear here in your applications_received array.' 
                    : 'No applications sent yet. When you apply to projects, your applications will appear here in your applications_sent array.'}
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
            setActiveCollabProject(project);
            setShowCollaborationSpace(true);
            setShowProjectModal(false);
            setSelectedProject(null);
          }}
        />
      )}
      
      {/* Project Modal for Applications */}
      {selectedProjectForModal && (
        <ProjectModal
          project={selectedProjectForModal}
          onClose={() => setSelectedProjectForModal(null)}
          onOpenCollaboration={(project) => {
            setActiveCollabProject(project);
            setShowCollaborationSpace(true);
            setSelectedProjectForModal(null);
          }}
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