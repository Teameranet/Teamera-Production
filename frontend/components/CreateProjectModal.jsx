// This is the CreateProjectModal component for creating or editing a project
import { useState, useEffect } from 'react';
import { X, Plus, Minus, Upload, CheckCircle, AlertCircle } from 'lucide-react';
import { useProjects } from '../context/ProjectContext';
import { useAuth } from '../context/AuthContext';
import UserAvatar from './UserAvatar';
import ProfileModal from './ProfileModal';
import './CreateProjectModal.css';

function CreateProjectModal({ onClose, projectToEdit }) {
  // State for current step in the modal
  const [currentStep, setCurrentStep] = useState(0);
  // State for form data
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    industry: '',
    stage: '',
    openPositions: [{ role: '', skills: [], isPaid: false }],
    funding: '',
    timeline: '',
    teamMembers: []
  });
  
  // State for profile modal
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedUserProfile, setSelectedUserProfile] = useState(null);
  
  const { createProject, editProject } = useProjects();
  const { user } = useAuth();
  const isEditMode = Boolean(projectToEdit);

  // Initialize form with project data when editing
  useEffect(() => {
    if (projectToEdit) {
      // Format team members, excluding the founder
      const teamMembersWithoutFounder = projectToEdit.teamMembers
        .filter(member => member.role !== "Founder")
        .map(member => {
          // Extract ID - handle cases where id might be an object (populated) or string
          const memberId = typeof member.id === 'object' 
            ? (member.id._id || member.id.toString()) 
            : (typeof member._id === 'object' ? (member._id._id || member._id.toString()) : (member.id || member._id));
          
          return {
            name: member.name,
            position: member.role,
            positionId: member.positionId, // CRITICAL: Preserve position ID for syncing
            email: member.email || '',
            id: memberId,
            verified: true, // Existing members are already verified
            tempId: memberId || `temp-${Date.now()}-${Math.random()}` 
          };
        });
      
      setFormData({
        title: projectToEdit.title || '',
        description: projectToEdit.description || '',
        industry: projectToEdit.industry || '',
        stage: projectToEdit.stage || '',
        openPositions: projectToEdit.openPositions && projectToEdit.openPositions.length > 0 
          ? projectToEdit.openPositions 
          : [{ role: '', skills: [], isPaid: false }],
        funding: projectToEdit.funding || '',
        timeline: projectToEdit.timeline || '',
        teamMembers: teamMembersWithoutFounder.map(member => {
          const availableRoles = projectToEdit.openPositions?.map(p => p.role) || [];
          return {
            ...member,
            isCustom: member.position && !availableRoles.includes(member.position)
          };
        })
      });
    }
  }, [projectToEdit]);

  // Steps for the modal
  const steps = [
    { title: 'Project Basics', component: 'basics' },
    { title: 'Team Requirements', component: 'team' },
    { title: 'Team Members', component: 'members' },
    { title: 'Project Details', component: 'details' }
  ];

  // Industry options
  const industries = [
    'Technology', 'Healthcare', 'Finance', 'Education', 'E-commerce',
    'Entertainment', 'Food & Beverage', 'Travel', 'Real Estate', 'Other'
  ];

  // Project stage options
  const stages = [
    'Idea Validation', 'MVP Development', 'Beta Testing', 'Market Ready', 'Scaling'
  ];

  // State for custom skill input
  const [customSkill, setCustomSkill] = useState('');
  const [showCustomSkillInput, setShowCustomSkillInput] = useState(false);

  // Skill options for positions
  const skillOptions = [
    'React', 'Node.js', 'Python', 'JavaScript', 'TypeScript', 'UI/UX Design',
    'Product Management', 'Marketing', 'Sales', 'Data Science', 'Machine Learning',
    'Mobile Development', 'DevOps', 'Blockchain', 'AI/ML', 'Backend Development',
    'Frontend Development', 'Full Stack', 'Digital Marketing', 'Content Writing',
    'Other'
  ];

  // Handle adding a custom skill
  const handleCustomSkillAdd = (positionIndex) => {
    if (customSkill.trim()) {
      handlePositionSkillToggle(positionIndex, customSkill.trim());
      setCustomSkill('');
      setShowCustomSkillInput(false);
    }
  };

  // Handle input change for form fields
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle change for a specific open position
  const handlePositionChange = (index, field, value) => {
    setFormData(prev => {
      const oldRole = prev.openPositions[index].role;
      const positionId = prev.openPositions[index]._id || prev.openPositions[index].id;
      
      const newOpenPositions = prev.openPositions.map((pos, i) =>
        i === index ? { ...pos, [field]: value } : pos
      );
      
      // If the role name was changed, sync it to team members holding this position
      let newTeamMembers = prev.teamMembers;
      if (field === 'role' && oldRole && value !== oldRole) {
        newTeamMembers = prev.teamMembers.map(member => {
          // Match by positionId (most reliable) or role name
          const isMatch = (positionId && member.positionId === positionId) || 
                         (!member.isCustom && member.position === oldRole);
          
          if (isMatch) {
            return { ...member, position: value };
          }
          return member;
        });
      }
      
      return {
        ...prev,
        openPositions: newOpenPositions,
        teamMembers: newTeamMembers
      };
    });
  };

  // Handle toggling a skill for a position
  const handlePositionSkillToggle = (positionIndex, skill) => {
    if (skill === 'Other') {
      setShowCustomSkillInput(true);
      return;
    }

    setFormData(prev => ({
      ...prev,
      openPositions: prev.openPositions.map((pos, i) =>
        i === positionIndex
          ? {
            ...pos,
            skills: pos.skills.includes(skill)
              ? pos.skills.filter(s => s !== skill)
              : [...pos.skills, skill]
          }
          : pos
      )
    }));
  };

  // Add a new open position
  const addPosition = () => {
    setFormData(prev => ({
      ...prev,
      openPositions: [...prev.openPositions, { role: '', skills: [], isPaid: false }]
    }));
  };

  // Remove an open position
  const removePosition = (index) => {
    setFormData(prev => ({
      ...prev,
      openPositions: prev.openPositions.filter((_, i) => i !== index)
    }));
  };

  // Handle change for a team member
  const handleTeamMemberChange = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      teamMembers: prev.teamMembers.map((member, i) =>
        i === index ? { ...member, [field]: value } : member
      )
    }));
  };

  // Profile pic upload is no longer needed with UserAvatar component

  // Add a new team member
  const addTeamMember = () => {
    setFormData(prev => ({
      ...prev,
      teamMembers: [...prev.teamMembers, { 
        name: '', 
        position: '', 
        email: '', 
        isCustom: false,
        verified: false,
        tempId: `temp-${Date.now()}-${Math.random()}` // Unique temporary ID
      }]
    }));
  };

  // Remove a team member
  const removeTeamMember = (index) => {
    setFormData(prev => ({
      ...prev,
      teamMembers: prev.teamMembers.filter((_, i) => i !== index)
    }));
  };

  // Verify email for team member
  const verifyEmail = async (index) => {
    const member = formData.teamMembers[index];
    
    if (!member.email || !member.email.trim()) {
      alert('Please enter an email address');
      return;
    }

    // Check if this is the project owner in edit mode
    if (isEditMode && projectToEdit) {
      const founder = projectToEdit.teamMembers.find(m => m.role === "Founder");
      if (founder && founder.email && 
          member.email.trim().toLowerCase() === founder.email.toLowerCase()) {
        alert('This is the project owner. The owner is automatically included in the team.');
        // Remove this team member entry
        removeTeamMember(index);
        return;
      }
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/users/verify-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: member.email.trim() }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Check if this user is the current logged-in user (for new projects)
        if (!isEditMode && user && (data.data._id === user.id || data.data._id === user._id)) {
          alert('You are the project owner and will be automatically added as the founder.');
          removeTeamMember(index);
          return;
        }
        
        // User found - update member with verified data
        setFormData(prev => ({
          ...prev,
          teamMembers: prev.teamMembers.map((m, i) =>
            i === index
              ? {
                  ...m,
                  name: data.data.name,
                  id: data.data._id || data.data.id,
                  verified: true,
                  userData: data.data,
                  tempId: m.tempId // Preserve tempId for key stability
                }
              : m
          )
        }));
        
        // Show profile modal
        setSelectedUserProfile(data.data);
        setShowProfileModal(true);
      } else {
        // User not found
        alert('User not found. The email must be registered first.');
        setFormData(prev => ({
          ...prev,
          teamMembers: prev.teamMembers.map((m, i) =>
            i === index ? { ...m, verified: false } : m
          )
        }));
      }
    } catch (error) {
      console.error('Error verifying email:', error);
      alert('Error verifying email. Please try again.');
    }
  };

  // Handle moving to the next step or submitting
  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSubmit();
    }
  };

  // Handle moving to the previous step
  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Handle form submission
  const handleSubmit = () => {
    if (!user) return;

    // Process team members for submission
    const processedTeamMembers = formData.teamMembers
      .filter(member => member.name.trim() !== '' && member.position && member.position.trim() !== '')
      .map(member => ({
        // Only include id if it's a valid MongoDB ObjectId (24 hex characters) or existing user ID
        ...(member.id && typeof member.id === 'string' && member.id.length === 24 ? { id: member.id } : {}),
        name: member.name,
        role: member.position, // Map position to role
        positionId: member.positionId, // Include positionId
        email: member.email || '' // Include email
      }));

    // Create project data object
    const projectData = {
      title: formData.title,
      description: formData.description,
      industry: formData.industry,
      stage: formData.stage,
      funding: formData.funding,
      timeline: formData.timeline,
      openPositions: formData.openPositions.filter(pos => pos.role.trim() !== '')
    };

    if (isEditMode) {
      // CRITICAL FIX: When editing, check if team members actually changed
      // Only send teamMembers if they were modified in the form
      // This prevents breaking user-project relationships during simple detail updates
      const projectId = projectToEdit.id || projectToEdit._id;
      
      // Get original team members (excluding founder)
      const originalTeamMembers = projectToEdit.teamMembers
        .filter(member => member.role !== "Founder")
        .map(member => {
          const memberId = typeof member.id === 'string' ? member.id : 
                          typeof member._id === 'string' ? member._id :
                          member.id?._id || member.id?.toString() || 
                          member._id?.toString() || null;
          return {
            id: memberId,
            name: member.name,
            role: member.role,
            email: member.email || ''
          };
        });
      
      // Compare original vs current team members
      // Compare original vs current team members (including roles to detect role changes)
      const originalRep = originalTeamMembers.map(m => `${m.id}-${m.role}`).sort();
      const currentRep = processedTeamMembers.map(m => `${m.id}-${m.role}`).sort();
      const teamMembersChanged = JSON.stringify(originalRep) !== JSON.stringify(currentRep);
      
      // Only include teamMembers in update if they actually changed
      if (teamMembersChanged) {
        console.log('Team members changed - including in update');
        
        // Find the founder from the original project
        const founder = projectToEdit.teamMembers.find(member => member.role === "Founder");
        
        if (founder) {
          const founderId = typeof founder.id === 'string' ? founder.id : 
                           typeof founder._id === 'string' ? founder._id :
                           founder.id?._id || founder.id?.toString() || 
                           founder._id?.toString() || null;
          
          // Remove any duplicate founder entries from processedTeamMembers
          const teamMembersWithoutFounder = processedTeamMembers.filter(member => {
            const isDuplicateById = member.id && founderId && member.id === founderId;
            const isDuplicateByEmail = member.email && founder.email && 
                                       member.email.toLowerCase() === founder.email.toLowerCase();
            return !isDuplicateById && !isDuplicateByEmail;
          });
          
          // Add founder at the beginning
          projectData.teamMembers = [
            {
              id: founderId,
              name: founder.name,
              role: "Founder",
              email: founder.email || ''
            },
            ...teamMembersWithoutFounder
          ];
        } else {
          projectData.teamMembers = processedTeamMembers;
        }
      } else {
        console.log('Team members unchanged - excluding from update to preserve relationships');
        // Do NOT include teamMembers in the update
        // This prevents the backend from processing team member changes
      }
      
      editProject(projectId, projectData);
    } else {
      // For new projects, add the current user as a founder
      projectData.teamMembers = [
        { id: user.id || user._id, name: user.name, role: "Founder", email: user.email },
        ...processedTeamMembers
      ];
      createProject(projectData);
    }

    onClose();
  };

  // Check if the user can proceed to the next step
  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return formData.title && formData.description && formData.industry && formData.stage;
      case 1:
        return formData.openPositions.some(pos => pos.role.trim() !== '');
      case 2:
        // All team members must be verified and have a position if any are added
        return formData.teamMembers.length === 0 || 
               formData.teamMembers.every(m => m.verified && m.position && m.position.trim() !== '');
      case 3:
        return formData.timeline && formData.timeline.trim() !== '';
      default:
        return false;
    }
  };

  // Render the content for the current step
  const renderStepContent = () => {
    switch (steps[currentStep].component) {
      case 'basics':
        return (
          <div className="step-content">
            <div className="form-group">
              <label>Project Title *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="Enter your project title"
              />
            </div>

            <div className="form-group">
              <label>Project Description *</label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Describe your project, its goals, and what problem it solves"
                rows={4}
              />
            </div>

            <div className="form-row">
              <div className="form-group industry-form-group">
                <label>Industry *</label>
                <select
                  value={formData.industry}
                  onChange={(e) => handleInputChange('industry', e.target.value)}
                >
                  <option value="">Select industry</option>
                  {industries.map(industry => (
                    <option key={industry} value={industry}>{industry}</option>
                  ))}
                </select>
              </div>

              <div className="form-group stage-form-group">
                <label>Project Stage *</label>
                <select
                  value={formData.stage}
                  onChange={(e) => handleInputChange('stage', e.target.value)}
                >
                  <option value="">Select stage</option>
                  {stages.map(stage => (
                    <option key={stage} value={stage}>{stage}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        );

      case 'team':
        return (
          <div className="step-content">
            <div className="form-group">
              <label>Open Positions *</label>
              {formData.openPositions.map((position, index) => (
                <div key={index} className="position-form">
                  <div className="position-header">
                    <input
                      type="text"
                      value={position.role}
                      onChange={(e) => handlePositionChange(index, 'role', e.target.value)}
                      placeholder="Position title (e.g., Frontend Developer)"
                    />
                    <div className="position-paid-checkbox">
                      <label>
                        <input
                          type="checkbox"
                          checked={position.isPaid}
                          onChange={(e) => handlePositionChange(index, 'isPaid', e.target.checked)}
                        />
                        Paid
                      </label>
                    </div>
                    {formData.openPositions.length > 1 && (
                      <button
                        type="button"
                        className="remove-position-btn"
                        onClick={() => removePosition(index)}
                      >
                        <Minus size={14} />
                      </button>
                    )}
                  </div>
                  <div className="position-skills">
                    <label>Required skills for this position:</label>
                    <div className="skills-input-container">
                      <select
                        className="skills-dropdown"
                        onChange={(e) => {
                          if (e.target.value && !position.skills.includes(e.target.value)) {
                            handlePositionSkillToggle(index, e.target.value);
                          }
                          e.target.value = '';
                        }}
                        value=""
                      >
                        <option value="">Select a skill to add</option>
                        {skillOptions
                          .filter(skill => !position.skills.includes(skill))
                          .map(skill => (
                            <option key={skill} value={skill}>{skill}</option>
                          ))}
                      </select>
                      {showCustomSkillInput && (
                        <div className="custom-skill-input">
                          <input
                            type="text"
                            value={customSkill}
                            onChange={(e) => setCustomSkill(e.target.value)}
                            placeholder="Enter custom skill"
                          />
                          <button
                            type="button"
                            className="add-custom-skill-btn"
                            onClick={() => handleCustomSkillAdd(index)}
                          >
                            Add
                          </button>
                        </div>
                      )}
                    </div>
                    {position.skills.length > 0 && (
                      <div className="selected-skills">
                        {position.skills.map(skill => (
                          <span key={skill} className="selected-skill-tag">
                            {skill}
                            <button
                              type="button"
                              className="remove-skill-btn"
                              tabIndex={0}
                              aria-label={`Remove skill ${skill}`}
                              onClick={() => handlePositionSkillToggle(index, skill)}
                            >
                              <span aria-hidden="true">&times;</span>
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <button
                type="button"
                className="add-position-btn"
                onClick={addPosition}
              >
                <Plus size={16} />
                Add Another Position
              </button>
            </div>
          </div>
        );

      case 'members':
        // Get valid positions from open positions defined in step 2
        const availablePositions = formData.openPositions
          .filter(pos => pos.role && pos.role.trim() !== '')
          .map(pos => ({
            role: pos.role,
            id: pos._id || pos.id || null
          }));
        
        // Helper to check if a position is in availablePositions
        const isKnownPosition = (role) => availablePositions.some(p => p.role === role);

        return (
          <div className="step-content">
            <div className="form-group">
              <label>Team Members (Optional)</label>
              <p className="form-description">Add existing team members by verifying their email addresses</p>

              {formData.teamMembers.map((member, index) => (
                <div key={member.tempId || member.id || `member-${index}`} className="team-member-form">
                  <div className="member-avatar-section">
                    <div className="avatar-preview">
                      {member.verified && member.name ? (
                        <UserAvatar user={member} size="medium" />
                      ) : (
                        <div className="avatar-placeholder">
                          <Upload size={24} />
                        </div>
                      )}
                    </div>
                    {member.verified && (
                      <div className="verified-badge">
                        <CheckCircle size={16} />
                        <span>Verified</span>
                      </div>
                    )}
                  </div>

                  <div className="member-details">
                    <div className="form-row">
                      <div className="email-verification-group">
                        <input
                          type="email"
                          value={member.email}
                          onChange={(e) => handleTeamMemberChange(index, 'email', e.target.value)}
                          placeholder="Member email address"
                          disabled={member.verified}
                          className={member.verified ? 'verified-input' : ''}
                        />
                        <button
                          type="button"
                          className={`verify-email-btn ${member.verified ? 'verified' : ''}`}
                          onClick={() => verifyEmail(index)}
                          disabled={member.verified}
                        >
                          {member.verified ? (
                            <>
                              <CheckCircle size={16} />
                              Verified
                            </>
                          ) : (
                            'Verify Email'
                          )}
                        </button>
                      </div>
                    </div>
                    
                    {member.verified && (
                      <div className="form-row">
                        <input
                          type="text"
                          value={member.name}
                          readOnly
                          placeholder="Member name"
                          className="verified-input"
                        />
                        <div className="position-input-group">
                          <select
                            value={member.isCustom ? 'Custom position' : (isKnownPosition(member.position) ? member.position : '')}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val === 'Custom position') {
                                handleTeamMemberChange(index, 'isCustom', true);
                                handleTeamMemberChange(index, 'position', '');
                                handleTeamMemberChange(index, 'positionId', null);
                              } else {
                                const posObj = availablePositions.find(p => p.role === val);
                                handleTeamMemberChange(index, 'isCustom', false);
                                handleTeamMemberChange(index, 'position', val);
                                handleTeamMemberChange(index, 'positionId', posObj ? posObj.id : null);
                              }
                            }}
                            required
                          >
                            <option value="">Select Position *</option>
                            {availablePositions.map(pos => (
                              <option key={pos.id || pos.role} value={pos.role}>{pos.role}</option>
                            ))}
                            <option value="Custom position">Custom position</option>
                          </select>
                          
                          {member.isCustom && (
                            <input
                              type="text"
                              value={member.position}
                              onChange={(e) => handleTeamMemberChange(index, 'position', e.target.value)}
                              placeholder="Enter custom position"
                              required
                            />
                          )}
                        </div>
                      </div>
                    )}
                    
                    {member.verified && (!member.position || member.position.trim() === '') && (
                      <div className="verification-warning">
                        <AlertCircle size={14} />
                        <span>Please select or enter a position/role for this member</span>
                      </div>
                    )}
                    
                    {!member.verified && member.email && (
                      <div className="verification-warning">
                        <AlertCircle size={14} />
                        <span>Please verify this email to add the member</span>
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    className="remove-member-btn"
                    onClick={() => removeTeamMember(index)}
                  >
                    <Minus size={16} />
                  </button>
                </div>
              ))}

              <button
                type="button"
                className="add-member-btn"
                onClick={addTeamMember}
              >
                <Plus size={16} />
                Add Team Member
              </button>
            </div>
          </div>
        );

      case 'details':
        return (
          <div className="step-content">
            <div className="form-group">
              <label>Project Timeline *</label>
              <input
                type="text"
                value={formData.timeline}
                onChange={(e) => handleInputChange('timeline', e.target.value)}
                placeholder="e.g., 6 months to MVP"
              />
            </div>

            <div className="project-preview">
              <h4>Project Preview</h4>
              <div className="preview-card">
                <h5>{formData.title}</h5>
                <p>{formData.description}</p>
                <div className="preview-meta">
                  <span>Industry: {formData.industry}</span>
                  <span>Stage: {formData.stage}</span>
                  <span>Timeline: {formData.timeline}</span>
                  <span>Team: {formData.teamMembers.length + 1} members</span>
                </div>
                <div className="preview-skills">
                  {formData.openPositions.slice(0, 3).map((pos, index) => (
                    <span key={index} className="skill-tag">
                      {pos.role}
                      {pos.isPaid ? ' (Paid)' : ' (Unpaid)'}
                    </span>
                  ))}
                  {formData.openPositions.length > 3 && (
                    <span className="skill-tag">+{formData.openPositions.length - 3}</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // Render the modal UI
  return (
    <>
      <div className="modal-overlay" onClick={onClose}>
        <div className="create-project-modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2>{isEditMode ? 'Edit Project' : 'Create New Project'}</h2>
            <button className="close-btn" onClick={onClose}>
              <X size={24} />
            </button>
          </div>

          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            />
          </div>

          <div className="modal-content">
            <div className="step-header">
              <h3>{steps[currentStep].title}</h3>
              <span className="step-counter">
                Step {currentStep + 1} of {steps.length}
              </span>
            </div>

            {renderStepContent()}

            <div className="step-actions">
              {currentStep > 0 && (
                <button className="prev-btn" onClick={handlePrevious}>
                  Previous
                </button>
              )}
              <button
                className="next-btn"
                onClick={handleNext}
                disabled={!canProceed()}
              >
                {currentStep === steps.length - 1 ? (isEditMode ? 'Save Changes' : 'Create Project') : 'Next'}
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Profile Modal */}
      {showProfileModal && selectedUserProfile && (
        <ProfileModal
          user={selectedUserProfile}
          onClose={() => setShowProfileModal(false)}
        />
      )}
    </>
  );
}

// Export the CreateProjectModal component
export default CreateProjectModal;