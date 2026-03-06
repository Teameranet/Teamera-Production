import { useState, useEffect } from 'react';
import { X, Users, MapPin, Calendar, IndianRupee, Upload, Send } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useProjects } from '../context/ProjectContext';
import { useNotifications } from '../context/NotificationContext';
import UserAvatar from './UserAvatar';
import './ProjectModal.css';

function ProjectModal({ project, onClose }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState(null);
  const [applicationData, setApplicationData] = useState({
    message: '',
    resume: null
  });
  const [showToast, setShowToast] = useState(false);
  const { user } = useAuth();
  const { applyToProject } = useProjects();
  const { addApplicationNotification } = useNotifications();

  // Function to create milestone data based on project stage
  // const getMilestonesByStage = (stage) => {
  //   const allMilestones = [
  //     {
  //       id: 'ideation',
  //       title: 'Project Ideation',
  //       description: 'Initial concept and market research completed',
  //       stage: 'Ideation Stage'
  //     },
  //     {
  //       id: 'validation',
  //       title: 'Idea Validation',
  //       description: 'Concept validation and initial user feedback',
  //       stage: 'Idea Validation'
  //     },
  //     {
  //       id: 'mvp',
  //       title: 'MVP Development',
  //       description: 'Building the minimum viable product',
  //       stage: 'MVP Development'
  //     },
  //     {
  //       id: 'testing',
  //       title: 'Beta Testing',
  //       description: 'User testing and feedback collection',
  //       stage: 'Beta Testing'
  //     },
  //     {
  //       id: 'market',
  //       title: 'Market Ready',
  //       description: 'Product launched to market',
  //       stage: 'Market Ready'
  //     },
  //     {
  //       id: 'scaling',
  //       title: 'Scaling',
  //       description: 'Growing user base and expanding features',
  //       stage: 'Scaling'
  //     }
  //   ];

  //   // Get the current stage index
  //   const stageIndex = allMilestones.findIndex(milestone => milestone.stage === stage);

  //   // If stage not found, return all milestones as upcoming
  //   if (stageIndex === -1) {
  //     return allMilestones.map(milestone => ({ ...milestone, status: 'upcoming' }));
  //   }

  //   // Return milestones with appropriate status
  //   return allMilestones.map((milestone, index) => {
  //     if (index < stageIndex) {
  //       return { ...milestone, status: 'completed' };
  //     } else if (index === stageIndex) {
  //       return { ...milestone, status: 'current' };
  //     } else {
  //       return { ...milestone, status: 'upcoming' };
  //     }
  //   });
  // };

  const handleApplicationSubmit = (e) => {
    e.preventDefault();
    if (!user || !selectedPosition) return;

    applyToProject(project.id, {
      userId: user.id,
      applicantName: user.name,
      applicantAvatar: user.name ? user.name.charAt(0) : 'U',
      applicantColor: '#4f46e5',
      message: applicationData.message,
      resume: applicationData.resume,
      resumeUrl: applicationData.resume ? URL.createObjectURL(applicationData.resume) : null,
      position: selectedPosition.role,
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

    // Add application notification for the project owner only
    if (project.ownerId) {
      console.log(`Sending notification to project owner ${project.ownerId} for project "${project.title}" from applicant "${user.name}"`);
      addApplicationNotification(project.ownerId, project.title, user.name);
    } else {
      console.warn(`No ownerId found for project "${project.title}". Notification not sent.`);
    }

    // Show toast notification
    setShowToast(true);

    // Hide toast and redirect after delay
    setTimeout(() => {
      setShowToast(false);
      setShowApplicationForm(false);
      setApplicationData({ message: '', resume: null });
      setSelectedPosition(null);
      onClose(); // Redirect back to projects
    }, 2000);
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
        return (
          <div className="tab-content">
            <div className="open-positions">
              {(project.openPositions || []).map((position, index) => (
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
                    <button
                      className="apply-position-btn"
                      onClick={() => handlePositionSelect(position)}
                    >
                      Apply for this position
                    </button>
                  )}
                </div>
              ))}
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
          <div className="toast-notification">
            <div className="toast-content">
              <div className="toast-icon">✓</div>
              <div className="toast-message">Your application has been sent</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ProjectModal;