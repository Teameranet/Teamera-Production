import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Users, MapPin, Calendar, IndianRupee, Upload, Send } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useProjects } from '../context/ProjectContext';
import { useNotifications } from '../context/NotificationContext';
import UserAvatar from './UserAvatar';
import './ProjectModal.css';

function ProjectModal({ project, onClose }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState(null);
  const [applicationData, setApplicationData] = useState({
    message: '',
    resume: null
  });
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success'); // 'success' or 'error'
  const [existingApplications, setExistingApplications] = useState({}); // Track existing applications by position
  const [invitations, setInvitations] = useState([]); // Track INVITED status for this project

  const { user } = useAuth();
  const { applyToProject } = useProjects();
  const { addApplicationNotification } = useNotifications();



  // Check for existing applications + fetch invitations (including custom positions) on mount
  useEffect(() => {
    const checkExistingApplications = async () => {
      if (!user) return;

      const projectId = project._id || project.id;
      const userId = user._id || user.id;
      const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

      // 1. Fetch all INVITED records for this user+project in one shot
      //    This covers both open-position invites AND custom-position invites
      try {
        const invRes = await fetch(
          `${apiBaseUrl}/api/applications/invitations?projectId=${projectId}&userId=${userId}`
        );
        const invData = await invRes.json();
        if (invData.success) {
          setInvitations(invData.data); // [{ applicationId, position, positionId, projectOwnerName }]
        }
      } catch (error) {
        console.error('Error fetching invitations:', error);
      }

      // 2. Check per-position application status for the open-positions list UI
      const checks = {};
      for (const position of (project.openPositions || [])) {
        try {
          const response = await fetch(
            `${apiBaseUrl}/api/applications/check?projectId=${projectId}&userId=${userId}&position=${encodeURIComponent(position.role)}&positionId=${position._id || position.id || ''}`
          );
          const data = await response.json();
          if (data.success) {
            checks[position.role] = {
              hasApplied: data.data.hasApplied,
              application: data.data.application,
              previousApplication: data.data.previousApplication
            };
          }
        } catch (error) {
          console.error('Error checking application:', error);
        }
      }
      setExistingApplications(checks);
    };

    checkExistingApplications();
  }, [user, project._id, project.id, project.openPositions]);

  const handleApplicationSubmit = async (e) => {
    e.preventDefault();
    if (!user || !selectedPosition) return;

    const result = await applyToProject(project.id, {
      userId: user.id,
      applicantName: user.name,
      applicantAvatar: user.name ? user.name.charAt(0) : 'U',
      applicantColor: '#4f46e5',
      message: applicationData.message,
      resume: applicationData.resume,
      resumeUrl: applicationData.resume ? URL.createObjectURL(applicationData.resume) : null,
      position: selectedPosition.role,
      positionId: selectedPosition._id || selectedPosition.id, // Include positionId
      projectName: project.title,
      skills: selectedPosition.skills || [],
      userDetails: {
        name: user.name,
        title: user.title || 'Developer',
        email: user.email,
        location: user.location || '',
        bio: user.bio || '',
        skills: user.skills || [],
        experiences: user.experience || [],
        education: user.education || []
      }
    });

    if (result.success) {
      // Add application notification for the project owner only
      if (project.ownerId) {
        console.log(`Sending notification to project owner ${project.ownerId} for project "${project.title}" from applicant "${user.name}"`);
        addApplicationNotification(project.ownerId, project.title, user.name);
      } else {
        console.warn(`No ownerId found for project "${project.title}". Notification not sent.`);
      }

      // Show success toast notification
      setToastMessage('Your application has been sent successfully!');
      setToastType('success');
      setShowToast(true);

      // Hide toast and redirect after delay
      setTimeout(() => {
        setShowToast(false);
        setShowApplicationForm(false);
        setApplicationData({ message: '', resume: null });
        setSelectedPosition(null);
        onClose(); // Redirect back to projects
      }, 2000);
    } else {
      // Show error toast notification
      setToastMessage(result.message || 'Failed to submit application. Please try again.');
      setToastType('error');
      setShowToast(true);

      // Hide toast after delay but keep form open
      setTimeout(() => {
        setShowToast(false);
      }, 4000);
    }
  };

  const handlePositionSelect = (position) => {
    setSelectedPosition(position);
    setShowApplicationForm(true);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    setApplicationData(prev => ({
      ...prev,
      resume: file
    }));
  };

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'team', label: 'Team' },
    { id: 'positions', label: 'Open Positions' },
    // { id: 'milestones', label: 'Milestones' }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        // Always prioritize skills from openPositions, fall back to requiredSkills if openPositions is empty
        const openPositionsSkills = project.openPositions ?
          [...new Set(project.openPositions.flatMap(pos => pos.skills || []))] :
          [];

        const requiredSkills = openPositionsSkills.length > 0 ?
          openPositionsSkills :
          (project.requiredSkills || []);

        return (
          <div className="tab-content">
            <div className="project-details">
              <div className="detail-section">
                <h4>Project Description</h4>
                <p>{project.description}</p>
              </div>

              {requiredSkills.length > 0 && (
                <div className="detail-section">
                  <h4>Required Skills</h4>
                  <div className="skills-list">
                    {requiredSkills.map((skill, index) => (
                      <span key={index} className="skill-tag">{skill}</span>
                    ))}
                  </div>
                </div>
              )}

              <div className="project-stats">
                <div className="stat-item">
                  <Users size={20} />
                  <div>
                    <span className="stat-value">{project.teamMembers?.length || 0}</span>
                    <span className="stat-label">Team Members</span>
                  </div>
                </div>
                <div className="stat-item">
                  <MapPin size={20} />
                  <div>
                    <span className="stat-value">{project.industry}</span>
                    <span className="stat-label">Industry</span>
                  </div>
                </div>
                <div className="stat-item">
                  <IndianRupee size={20} />
                  <div>
                    <span className="stat-value">{project.funding}</span>
                    <span className="stat-label">Funding</span>
                  </div>
                </div>
                <div className="stat-item">
                  <Calendar size={20} />
                  <div>
                    <span className="stat-value">{project.stage}</span>
                    <span className="stat-label">Current Stage</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'team':
        return (
          <div className="tab-content">
            <div className="team-members">
              {(project.teamMembers || []).map((member, index) => {
                // Safely extract ID - handle cases where id might be an object
                const memberId = typeof member.id === 'string' ? member.id :
                  typeof member._id === 'string' ? member._id :
                    member.id?._id || member.id?.toString() ||
                    member._id?.toString() ||
                    `${member.name}-${member.role}-${index}`;

                return (
                  <div key={memberId} className="team-member-card">
                    <UserAvatar
                      user={member}
                      size="large"
                      className="member-avatar"
                    />
                    <div className="member-info">
                      <h4>{member.name}</h4>
                      <p>{member.role || member.position}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );

      case 'positions':
        // Check if the user is already a team member of this project (any position)
        const isTeamMember = user && (project.teamMembers || []).some(member => {
          const memberId = member.id?._id || member.id || member._id;
          const userId = user._id || user.id;
          return String(memberId) === String(userId);
        });

        // Also check if any position has an ACCEPTED application status
        const hasAcceptedApplication = Object.values(existingApplications).some(
          appData => appData?.hasApplied && appData?.application?.status === 'ACCEPTED'
        );

        const userIsOnTeam = isTeamMember || hasAcceptedApplication;

        return (
          <div className="tab-content">
            <div className="open-positions">
              {/* Invitation banners — shown for custom positions not listed in openPositions */}
              {invitations
                .filter(inv => !(project.openPositions || []).some(
                  p => (p._id || p.id)?.toString() === inv.positionId?.toString() || p.role === inv.position
                ))
                .map((inv) => {
                  // Resolve the live position name for this invitation:
                  // 1. Check project.teamMembers for the invited user's current role (handles custom position renames)
                  // 2. Fall back to the stored inv.position name
                  const userId = user?._id || user?.id;
                  const teamMember = (project.teamMembers || []).find(m => {
                    const memberId = m.id?._id || m.id || m._id;
                    return String(memberId) === String(userId);
                  });
                  const displayName = teamMember ? teamMember.role : inv.position;

                  return (
                    <div key={inv.applicationId} className="invitation-banner">
                      <span className="invitation-banner-icon">🎉</span>
                      <span className="invitation-banner-text">
                        You have been invited by the Founder for the <strong>'{displayName}'</strong> position
                      </span>
                    </div>
                  );
                })
              }
              {(project.openPositions || []).map((position, index) => {
                const appData = existingApplications[position.role];
                const hasActiveApplication = appData?.hasApplied || false;
                const existingApp = appData?.application;
                const previousApp = appData?.previousApplication;

                // If user is on the team via another position, disable this button too
                const isThisPositionAccepted = existingApp?.status === 'ACCEPTED';
                const disabledByTeamMembership = userIsOnTeam && !isThisPositionAccepted && !hasActiveApplication;

                // Determine what message to show
                let statusMessage = null;
                let canApply = !hasActiveApplication;

                if (hasActiveApplication && existingApp) {
                  // User has an active PENDING, ACCEPTED, or INVITED application
                  const statusMap = {
                    PENDING: { icon: '⏳', text: 'Your application is under review' },
                    ACCEPTED: { icon: '✓', text: 'You are part of this team' },
                    // Use position.role (live from project prop) so renames reflect immediately
                    INVITED: { icon: '🎉', text: `You have been invited by the Founder for the '${position.role}' position` }
                  };
                  const s = statusMap[existingApp.status] || statusMap.PENDING;
                  statusMessage = { icon: s.icon, text: s.text, showLink: true, isPrevious: false };
                } else if (previousApp) {
                  // User has a previous REJECTED, QUIT, or REMOVED application
                  // They can reapply, but show them their history
                  const statusTexts = {
                    'REJECTED': 'Your previous application was not accepted. You can apply again.',
                    'QUIT': 'You previously quit this position. You can reapply if interested.',
                    'REMOVED': 'You were previously removed from this position. You can reapply.'
                  };

                  statusMessage = {
                    icon: '🔄',
                    text: statusTexts[previousApp.status] || 'You can apply for this position.',
                    showLink: true,
                    isPrevious: true
                  };
                }

                return (
                  <div key={index} className="position-card">
                    <div className="position-header">
                      <h4>{position.role}</h4>
                      <span className={`position-payment-status ${position.isPaid ? 'paid' : 'unpaid'}`}>
                        {position.isPaid ? 'Paid' : 'Unpaid'}
                      </span>
                    </div>
                    <div className="position-skills">
                      {(position.skills || []).map((skill, skillIndex) => (
                        <span key={skillIndex} className="skill-tag small">{skill}</span>
                      ))}
                    </div>
                    {user && (
                      <>
                        <button
                          className="apply-position-btn"
                          onClick={() => handlePositionSelect(position)}
                          disabled={hasActiveApplication || disabledByTeamMembership}
                          title={disabledByTeamMembership ? 'You are already part of this team' : ''}
                        >
                          {previousApp && !hasActiveApplication ? 'Reapply for this position' : 'Apply for this position'}
                        </button>



                        {/* Always show status message if there's any application history */}
                        {statusMessage && (
                          <div className={`application-status-message ${statusMessage.isPrevious ? 'previous' : ''}`}>
                            <div className="status-icon">
                              {statusMessage.icon}
                            </div>
                            <div className="status-content">
                              <p className="status-text">
                                {statusMessage.text}
                              </p>
                              {statusMessage.showLink && (
                                <button
                                  className="view-application-link"
                                  onClick={() => {
                                    onClose();
                                    navigate('/dashboard', { state: { tab: 'applications', subTab: 'sent' } });
                                  }}
                                >
                                  View application history →
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
              {(!project.openPositions || project.openPositions.length === 0) && (
                <div className="no-positions">
                  <p>No open positions available at the moment.</p>
                </div>
              )}
            </div>
          </div>
        );

      // case 'milestones':
      //   // Get milestones based on the current project stage
      //   const milestones = getMilestonesByStage(project.stage);

      //   return (
      //     <div className="tab-content">
      //       <div className="milestones">
      //         {milestones.map((milestone) => (
      //           <div key={milestone.id} className={`milestone ${milestone.status}`}>
      //             <div className="milestone-marker"></div>
      //             <div className="milestone-content">
      //               <h4>{milestone.title}</h4>
      //               <p>{milestone.description}</p>
      //               <span className="milestone-date">
      //                 {milestone.status === 'completed' && 'Completed'}
      //                 {milestone.status === 'current' && 'In Progress'}
      //                 {milestone.status === 'upcoming' && 'Upcoming'}
      //               </span>
      //             </div>
      //           </div>
      //         ))}
      //       </div>
      //     </div>
      //   );

      default:
        return null;
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="project-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="project-header-info">
            <h2>{project.title}</h2>
            <span className="project-stage-badge">{project.stage}</span>
          </div>
          <button className="close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="modal-tabs">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="modal-content">
          {renderTabContent()}
        </div>

        {user && !showApplicationForm && activeTab !== 'positions' && (
          <div className="modal-actions">
            <button
              className="apply-btn primary"
              onClick={() => setActiveTab('positions')}
            >
              View Open Positions
            </button>
          </div>
        )}

        {showApplicationForm && (
          <div className="application-form-overlay">
            <div className="application-form">
              <button className="close-form-btn" onClick={() => {
                setShowApplicationForm(false);
                setSelectedPosition(null);
              }}>
                <X size={20} />
              </button>
              <h3>Apply for {selectedPosition?.role} position in {project.title}</h3>
              <form onSubmit={handleApplicationSubmit}>
                <div className="form-group">
                  <label>Position</label>
                  <div className="selected-position">
                    <h4>{selectedPosition?.role}</h4>
                    <span className={`payment-status ${selectedPosition?.isPaid ? 'paid' : 'unpaid'}`}>
                      {selectedPosition?.isPaid ? 'Paid' : 'Unpaid'}
                    </span>
                  </div>
                </div>

                <div className="form-group">
                  <label>Why do you want to join this project?</label>
                  <textarea
                    value={applicationData.message}
                    onChange={(e) => setApplicationData(prev => ({
                      ...prev,
                      message: e.target.value
                    }))}
                    placeholder="Tell the team why you're interested and what you can contribute..."
                    rows={4}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Upload Resume (Optional)</label>
                  <div className="file-upload">
                    <input
                      type="file"
                      id="resume"
                      accept=".pdf,.doc,.docx"
                      onChange={handleFileUpload}
                      hidden
                    />
                    <label htmlFor="resume" className="file-upload-btn">
                      <Upload size={16} />
                      {applicationData.resume ? applicationData.resume.name : 'Choose file'}
                    </label>
                  </div>
                </div>

                <div className="form-actions">
                  <button
                    type="button"
                    className="cancel-btn"
                    onClick={() => {
                      setShowApplicationForm(false);
                      setSelectedPosition(null);
                    }}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="submit-btn">
                    <Send size={16} />
                    Send Application
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Toast notification */}
        {showToast && (
          <div className={`toast-notification ${toastType}`}>
            <div className="toast-content">
              <div className="toast-icon">{toastType === 'success' ? '✓' : '✕'}</div>
              <div className="toast-message">{toastMessage}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ProjectModal;