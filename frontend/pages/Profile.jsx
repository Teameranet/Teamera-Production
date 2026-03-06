// Import necessary hooks and components
import { useState, useEffect } from 'react';
import { Edit, MapPin, Calendar, Mail, Github as GitHub, Linkedin, Globe, User, Briefcase, Award, Settings, Eye, Plus, X, Check, ChevronDown, Users, Clock, Map, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useProjects } from '../context/ProjectContext';
import ProjectCard from '../components/ProjectCard';
import ProjectModal from '../components/ProjectModal';
import CreateProjectModal from '../components/CreateProjectModal';
import './Profile.css';

// Main Profile component
function Profile() {
  // Auth and project context hooks
  const { user, updateProfile, setUser, profileUpdateTrigger } = useAuth();
  const { getUserProjects, updateProjectStage, editProject, deleteProject, leaveProject } = useProjects();

  // Function to map experience to skill level
  const mapExperienceToSkillLevel = (experience) => {
    switch(experience) {
      case '0-1': return 'BEGINNER';
      case '2-3': return 'INTERMEDIATE';
      case '4-6': return 'ADVANCED';
      case '7+': return 'EXPERT';
      default: return 'BEGINNER';
    }
  };

  // State for active tab
  const [activeTab, setActiveTab] = useState('overview');
  // State for edit mode
  const [isEditing, setIsEditing] = useState(false);
  // State for user's projects
  const [userProjects, setUserProjects] = useState({ owned: [], participating: [] });
  // State for editing project stage
  const [editingProjectStage, setEditingProjectStage] = useState(null);
  // State for password reset message
  const [resetPasswordMessage, setResetPasswordMessage] = useState('');

  // Project modal state
  const [selectedProject, setSelectedProject] = useState(null);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showEditProjectModal, setShowEditProjectModal] = useState(false);
  const [projectToEdit, setProjectToEdit] = useState(null);

  // List of possible project stages
  const projectStages = [
    'Ideation Stage',
    'Idea Validation',
    'MVP Development',
    'Beta Testing',
    'Market Ready',
    'Scaling'
  ];

  // useEffect to load user projects when user is available
  // function: useEffect, add API call to fetch user projects here if needed
  useEffect(() => {
    if (user && user.id) {
      // Here you can add API call to fetch user projects from backend
      const projects = getUserProjects(user.id);
      setUserProjects(projects);
    }
  }, [user, getUserProjects]);

  // Handle project stage change
  // function: handleStageChange, add API call to update project stage here
  const handleStageChange = (projectId, newStage) => {
    // Add API call to update project stage in backend here
    const success = updateProjectStage(projectId, newStage);
    if (success) {
      // Update local state
      setUserProjects(prev => ({
        ...prev,
        owned: prev.owned.map(project =>
          project.id === projectId
            ? { ...project, stage: newStage }
            : project
        )
      }));
      setEditingProjectStage(null);
    }
  };

  // Handle editing a project
  // function: handleEditProject, open edit modal, API handled in modal
  const handleEditProject = (project) => {
    setProjectToEdit(project);
    setShowEditProjectModal(true);
  };

  // Handle deleting a project
  // function: handleDeleteProject, add API call to delete project here
  const handleDeleteProject = (projectId) => {
    if (window.confirm('Are you sure you want to delete this project?')) {
      // Use the project ID (could be either id or _id from MongoDB)
      const success = deleteProject(projectId);
      if (success) {
        // Update local state after successful deletion
        setUserProjects(prev => ({
          ...prev,
          owned: prev.owned.filter(project => 
            project.id !== projectId && project._id !== projectId
          )
        }));
        console.log("Project deleted successfully:", projectId);
      } else {
        console.error("Failed to delete project:", projectId);
      }
    }
  };

  // Handle leaving a project
  // function: handleLeaveProject, add API call to leave project here
  const handleLeaveProject = (projectId) => {
    if (window.confirm('Are you sure you want to leave this project?')) {
      // Add API call to leave project in backend here
      const success = leaveProject(projectId, user.id || user._id);
      if (success) {
        // Update local state after successfully leaving
        setUserProjects(prev => ({
          ...prev,
          participating: prev.participating.filter(project => 
            project.id !== projectId && project._id !== projectId
          )
        }));
        console.log("Project left successfully:", projectId);
      } else {
        console.error("Failed to leave project:", projectId);
      }
    }
  };

  // View project details
  // function: handleViewProject, no API needed, just open modal
  const handleViewProject = (project) => {
    setSelectedProject(project);
    setShowProjectModal(true);
  };

  // Handle closing the project details modal
  // function: handleCloseProjectModal, no API needed
  const handleCloseProjectModal = () => {
    setShowProjectModal(false);
    setSelectedProject(null);
  };

  // Handle password reset
  // function: handleResetPassword, add API call to send reset password email here
  const handleResetPassword = () => {
    if (user && user.email) {
      // TODO: Add API call to send reset password link to user.email here
      console.log(`Password reset link sent to ${user.email}`);
      setResetPasswordMessage('Password reset link has been sent to your email.');

      // Clear message after 5 seconds
      setTimeout(() => {
        setResetPasswordMessage('');
      }, 5000);
    } else {
      setResetPasswordMessage('Unable to reset password. Please try again later.');

      // Clear message after 5 seconds
      setTimeout(() => {
        setResetPasswordMessage('');
      }, 5000);
    }
  };

  // Sample data for new users (default experience)
  const defaultExperienceData = [
    {
      id: 1,
      title: "Senior Full Stack Developer",
      company: "TechCorp Solutions",
      period: "2022 - Present",
      description: "Led development of microservices architecture serving 1M+ users. Built and maintained React applications with Node.js backends.",
      technologies: ["React", "Node.js", "MongoDB", "AWS", "Docker"]
    },
    {
      id: 2,
      title: "Full Stack Developer",
      company: "StartupXYZ",
      period: "2020 - 2022",
      description: "Early employee at a fintech startup. Developed core platform features and helped scale from 0 to 100K users.",
      technologies: ["Vue.js", "Python", "PostgreSQL", "Redis"]
    }
  ];


  // Get metrics from user data with fallbacks to default values
  // function: stats, if you want to fetch stats from API, do it here
  const stats = [
    { label: "Projects Created", value: userProjects.owned?.length.toString() || "0" },
    { label: "Hackathons Won", value: user?.hackathonsWon?.toString() || user?.metrics?.hackathonsWon?.toString() || "0" },
    { label: "Connections Helped", value: userProjects.participating?.length.toString() || "0" }
  ];

  // Function to get display title based on user role
  // function: getRoleDisplayTitle, no API needed
  const getRoleDisplayTitle = (role) => {
    const roleMap = {
      'founder': 'The Founder',
      'professional': 'The Professional',
      'investor': 'The Investor',
      'student': 'The Student'
    };
    return roleMap[role] || role || 'Developer';
  };

  // Initialize formData with user data from signup
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (user && (user.id || user._id)) {
        try {
          const userId = user.id || user._id;
          const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
          // Fetch latest profile data from backend
          const response = await fetch(`${apiBaseUrl}/api/users/${userId}/profile`);
          if (response.ok) {
            const result = await response.json();
            const backendUser = result.data;
            
            // Update local user state with backend data
            const updatedUser = { ...user, ...backendUser, id: backendUser._id || backendUser.id };
            setUser(updatedUser);
            localStorage.setItem('teamera_user', JSON.stringify(updatedUser));
            
            // Initialize form data with backend user data
            initializeFormData(updatedUser);
          } else {
            // If backend fetch fails, use local user data
            initializeFormData(user);
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
          // If error occurs, use local user data
          initializeFormData(user);
        }
      } else if (user) {
        // No user ID, use local data
        initializeFormData(user);
      }
    };

    const initializeFormData = (userData) => {
      const skillLevel = 'BEGINNER';
      
      // Handle skills - convert strings to objects if needed
      let formattedSkills = [];
      if (Array.isArray(userData.skills)) {
        formattedSkills = userData.skills.map(skill => {
          if (typeof skill === 'string') {
            // Convert string to object format
            return { name: skill, level: skillLevel };
          } else if (typeof skill === 'object' && skill.name) {
            // Already in object format (remove years if present)
            return { name: skill.name, level: skill.level || skillLevel };
          }
          return null;
        }).filter(Boolean);
      }
      
      setFormData({
        name: userData.name || '',
        email: userData.email || '',
        bio: userData.bio || '',
        location: userData.location || '',
        title: userData.title || getRoleDisplayTitle(userData.role),
        githubUrl: userData.githubUrl || '',
        linkedinUrl: userData.linkedinUrl || '',
        portfolioUrl: userData.portfolioUrl || '',
        skills: formattedSkills,
        experience: Array.isArray(userData.experiences) && userData.experiences.length > 0
          ? userData.experiences
          : [],
        education: Array.isArray(userData.education) ? userData.education : []
      });
    };

    fetchUserProfile();
  }, [profileUpdateTrigger, user?.id, user?._id, setUser]); // Re-run when profile is updated or user ID changes

  // Initialize formData state
  // function: useState for formData, no API needed
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    bio: '',
    location: '',
    title: '',
    githubUrl: '',
    linkedinUrl: '',
    portfolioUrl: '',
    skills: [],
    experience: [],
    education: []
  });

  // Handle input change for form fields
  // function: handleInputChange, no API needed
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle experience field change
  // function: handleExperienceChange, no API needed
  const handleExperienceChange = (index, field, value) => {
    const updatedExperience = [...formData.experience];
    updatedExperience[index] = {
      ...updatedExperience[index],
      [field]: value
    };
    handleInputChange('experience', updatedExperience);
  };

  // Handle education field change
  // function: handleEducationChange, no API needed
  const handleEducationChange = (index, field, value) => {
    const updatedEducation = [...formData.education];
    updatedEducation[index] = {
      ...updatedEducation[index],
      [field]: value
    };
    handleInputChange('education', updatedEducation);
  };

  // Add new experience entry
  // function: addExperience, no API needed
  const addExperience = () => {
    const newExperience = {
      id: Date.now(),
      title: '',
      company: '',
      period: '',
      description: '',
      technologies: []
    };
    handleInputChange('experience', [...formData.experience, newExperience]);
  };

  // Remove experience entry
  // function: removeExperience, no API needed
  const removeExperience = (index) => {
    const updatedExperience = formData.experience.filter((_, i) => i !== index);
    handleInputChange('experience', updatedExperience);
  };

  // Add new education entry
  // function: addEducation, no API needed
  const addEducation = () => {
    const newEducation = {
      degree: '',
      institution: '',
      period: '',
      details: ''
    };
    handleInputChange('education', [...formData.education, newEducation]);
  };

  // Remove education entry
  // function: removeEducation, no API needed
  const removeEducation = (index) => {
    const updatedEducation = formData.education.filter((_, i) => i !== index);
    handleInputChange('education', updatedEducation);
  };

  // Save profile changes
  // function: handleSave, add API call to update user profile here
  const handleSave = async () => {
    try {
      // Prepare data for backend - map 'experience' array to 'experiences'
      const profileData = {
        ...formData,
        experiences: formData.experience, // Backend expects 'experiences'
      };
      
      // Remove the 'experience' field to avoid confusion
      delete profileData.experience;
      
      console.log('Saving profile data:', profileData);
      
      // Update profile via context (which calls backend)
      const result = await updateProfile(profileData);
      
      if (result.success) {
        // Update local user state
        setUser(result.user);
        setIsEditing(false);
        console.log('Profile updated successfully');
      } else {
        console.error('Failed to update profile:', result.error);
        alert(`Failed to update profile: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      alert(`An error occurred while saving your profile: ${error.message}`);
    }
  };

  // Cancel editing and reset formData to user data or defaults
  // function: handleCancel, no API needed
  const handleCancel = () => {
    // Reset formData to the current user object, but ensure all required fields exist
    const skillLevel = 'BEGINNER';
    
    setFormData({
      name: user?.name ?? '',
      bio: user?.bio ?? '',
      location: user?.location ?? '',
      title: user?.title ?? '',
      githubUrl: user?.githubUrl ?? '',
      linkedinUrl: user?.linkedinUrl ?? '',
      portfolioUrl: user?.portfolioUrl ?? '',
      skills: Array.isArray(user?.skills)
        ? user.skills.map(skill =>
            typeof skill === 'object'
              ? { name: skill.name, level: skill.level || skillLevel }
              : { name: skill, level: skillLevel }
          )
        : [],
      experience: Array.isArray(user?.experience)
        ? user.experience.map(exp => ({ ...exp }))
        : [],
      education: Array.isArray(user?.education)
        ? user.education.map(edu => ({ ...edu }))
        : []
    });
    setIsEditing(false);
  };

  // If user is not signed in, show message
  // function: Profile (main), router: protect this route for authenticated users
  if (!user) {
    return (
      <div className="profile-container">
        <div className="auth-required">
          <h2>Please sign in to view your profile</h2>
        </div>
      </div>
    );
  }

  // Main render
  return (
    <div className="profile-container">
      {/* Profile banner section */}
      <div className="profile-banner">
        <div className="banner-content">
          <div className="profile-info-section">
            <div className="avatar-wrapper">
              <div className="avatar-circle">
                <span>{user?.name?.charAt(0) || (user?.email?.charAt(0) || '').toUpperCase()}</span>
              </div>
            </div>

            <div className="user-info">
              <h1>{user?.name || user?.email?.split('@')[0] || 'User'}</h1>
              {isEditing ? (
                <input
                  type="text"
                  className="edit-input title-input"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="Enter your title"
                />
              ) : (
                <p className="user-title">{formData.title}</p>
              )}

              <div className="user-meta">
                <div className="profile-meta-item">
                  <MapPin size={16} />
                  {isEditing ? (
                    <input
                      type="text"
                      className="edit-input location-input"
                      value={formData.location}
                      onChange={(e) => handleInputChange('location', e.target.value)}
                      placeholder="Enter your location"
                    />
                  ) : (
                    <span>{formData.location}</span>
                  )}
                </div>
                <div className="profile-meta-item">
                  <Calendar size={16} />
                  <span>Joined {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' }) : 'Recently'}</span>
                </div>
              </div>

              {/* Social links section */}
              <div className="social-links">
                {isEditing ? (
                  <div className="social-links-edit">
                    <div className="social-input-group">
                      <GitHub size={20} />
                      <input
                        type="text"
                        className="edit-input social-input"
                        value={formData.githubUrl}
                        onChange={(e) => handleInputChange('githubUrl', e.target.value)}
                        placeholder="GitHub URL"
                      />
                    </div>
                    <div className="social-input-group">
                      <Linkedin size={20} />
                      <input
                        type="text"
                        className="edit-input social-input"
                        value={formData.linkedinUrl}
                        onChange={(e) => handleInputChange('linkedinUrl', e.target.value)}
                        placeholder="LinkedIn URL"
                      />
                    </div>
                    <div className="social-input-group">
                      <Globe size={20} />
                      <input
                        type="text"
                        className="edit-input social-input"
                        value={formData.portfolioUrl}
                        onChange={(e) => handleInputChange('portfolioUrl', e.target.value)}
                        placeholder="Portfolio URL"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="social-links-display">
                    {formData.githubUrl && (
                      <a href={formData.githubUrl} target="_blank" rel="noopener noreferrer" className="social-btn">
                        <GitHub size={20} />
                      </a>
                    )}
                    {formData.linkedinUrl && (
                      <a href={formData.linkedinUrl} target="_blank" rel="noopener noreferrer" className="social-btn">
                        <Linkedin size={20} />
                      </a>
                    )}
                    {formData.portfolioUrl && (
                      <a href={formData.portfolioUrl} target="_blank" rel="noopener noreferrer" className="social-btn">
                        <Globe size={20} />
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action buttons for edit/save/cancel */}
          <div className="action-buttons">
            {isEditing ? (
              <>
                <button className="profile-btn save-btn" onClick={handleSave}>
                  <Check size={16} />
                  Save
                </button>
                <button className="profile-btn cancel-btn" onClick={handleCancel}>
                  <X size={16} />
                  Cancel
                </button>
              </>
            ) : (
              <button className="profile-btn edit-btn" onClick={() => setIsEditing(true)}>
                <Edit size={16} />
                Edit Profile
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Profile stats section */}
      <div className="profile-stats-container">
        {stats.map((stat, index) => (
          <div key={index} className="stat-item">
            <h3 className="stat-number">{stat.value}</h3>
            <p className="stat-label">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Mobile navigation grid */}
      <div className="mobile-nav-grid">
        <div
          className={`mobile-nav-item ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <User size={24} />
          <span>Overview</span>
        </div>
        <div
          className={`mobile-nav-item ${activeTab === 'projects' ? 'active' : ''}`}
          onClick={() => setActiveTab('projects')}
        >
          <Briefcase size={24} />
          <span>Projects</span>
        </div>
        {/* <div
          className={`mobile-nav-item ${activeTab === 'achievements' ? 'active' : ''}`}
          onClick={() => setActiveTab('achievements')}
        >
          <Award size={24} />
          <span>Achievements</span>
        </div> */}
        <div
          className={`mobile-nav-item ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          <Settings size={24} />
          <span>Settings</span>
        </div>
      </div>

      {/* Desktop tab navigation */}
      <div className="tabs-container">
        <button
          className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <User size={18} />
          Overview
        </button>
        <button
          className={`tab-button ${activeTab === 'projects' ? 'active' : ''}`}
          onClick={() => setActiveTab('projects')}
        >
          <Briefcase size={18} />
          Projects
        </button>
        {/* <button
          className={`tab-button ${activeTab === 'achievements' ? 'active' : ''}`}
          onClick={() => setActiveTab('achievements')}
        >
          <Award size={18} />
          Achievements
        </button> */}
        <button
          className={`tab-button ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          <Settings size={18} />
          Settings
        </button>
      </div>

      {/* Tab content */}
      <div className="tab-content">
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'projects' && renderProjects()}
        {/* {activeTab === 'achievements' && renderAchievements()} */}
        {activeTab === 'settings' && renderSettings()}
      </div>

      {/* Project details modal */}
      {showProjectModal && selectedProject && (
        <ProjectModal
          project={selectedProject}
          onClose={handleCloseProjectModal}
        />
      )}

      {/* Edit project modal */}
      {showEditProjectModal && projectToEdit && (
        <CreateProjectModal
          projectToEdit={projectToEdit}
          onClose={() => {
            setShowEditProjectModal(false);
            setProjectToEdit(null);
          }}
        />
      )}
    </div>
  );

  // Render overview tab content
  // function: renderOverview, no API needed
  function renderOverview() {
    return (
      <div className="overview-content">
        <div className="overview-grid">
          <div className="overview-left-column">
            {/* About section */}
            <div className="about-section">
              <h3>About</h3>
              {isEditing ? (
                <div className="edit-form">
                  <textarea
                    className="form-textarea"
                    value={formData.bio}
                    onChange={e => handleInputChange('bio', e.target.value)}
                    rows={4}
                    placeholder="Tell us about yourself..."
                  />
                </div>
              ) : (
                <p>
                  {formData.bio ||
                    'Tell us about yourself...'}
                </p>
              )}
            </div>

            {/* Experience section */}
            <div className="experience-section">
              <h3>Experience</h3>
              <div className="experience-list">
                {(() => {
                  // When editing and no items exist, show empty state with add button
                  // When editing and items exist, show all items in edit mode
                  // When not editing, filter out empty items
                  const displayExperience = isEditing 
                    ? formData.experience 
                    : formData.experience.filter(exp => exp.title || exp.company || exp.period || exp.description);
                  
                  return Array.isArray(displayExperience) && displayExperience.length > 0 ? (
                    displayExperience.map((exp, index) => (
                      <div key={exp.id || index} className="experience-item">
                        {isEditing ? (
                          <div className="edit-form">
                            <div className="form-row">
                              <input
                                type="text"
                                className="edit-input"
                                value={exp.title}
                                onChange={(e) => handleExperienceChange(index, 'title', e.target.value)}
                                placeholder="Job Title"
                              />
                              <button className="remove-btn" onClick={() => removeExperience(index)}>
                                <X size={16} />
                              </button>
                            </div>
                            <input
                              type="text"
                              className="edit-input"
                              value={exp.company}
                              onChange={(e) => handleExperienceChange(index, 'company', e.target.value)}
                              placeholder="Company Name"
                            />
                            <input
                              type="text"
                              className="edit-input"
                              value={exp.period}
                              onChange={(e) => handleExperienceChange(index, 'period', e.target.value)}
                              placeholder="Period (e.g., 2020 - Present)"
                            />
                            <textarea
                              className="form-textarea"
                              value={exp.description}
                              onChange={(e) => handleExperienceChange(index, 'description', e.target.value)}
                              placeholder="Description of your role and achievements"
                              rows={3}
                            />
                            <input
                              type="text"
                              className="edit-input"
                              value={exp.technologies.join(', ')}
                              onChange={(e) => handleExperienceChange(index, 'technologies', e.target.value.split(',').map(t => t.trim()))}
                              placeholder="Technologies (comma-separated)"
                            />
                          </div>
                        ) : (
                          <>
                            <div className="experience-header">
                              <h4>{exp.title}</h4>
                              <span className="period">{exp.period}</span>
                            </div>
                            <p className="company">{exp.company}</p>
                            <p className="experience-description">{exp.description}</p>
                            <div className="experience-technologies">
                              {exp.technologies.map((tech, techIndex) => (
                                <span key={techIndex} className="tech-tag">{tech}</span>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    ))
                  ) : isEditing ? (
                    <div className="empty-section-prompt">
                      <p>Click "Add Experience" below to add your professional background</p>
                    </div>
                  ) : (
                    <div className="empty-section-prompt">
                      <p>Add your Experience details to showcase your professional background</p>
                    </div>
                  );
                })()}
                {isEditing && (
                  <button className="add-btn experience-add-btn" onClick={addExperience}>
                    <Plus size={16} /> Add Experience
                  </button>
                )}
              </div>
            </div>

            {/* Education section */}
            <div className="education-section">
              <h3>Education</h3>
              <div className="education-list">
                {(() => {
                  // When editing and no items exist, show empty state with add button
                  // When editing and items exist, show all items in edit mode
                  // When not editing, filter out empty items
                  const displayEducation = isEditing 
                    ? formData.education 
                    : formData.education.filter(edu => edu.degree || edu.institution || edu.period || edu.details);
                  
                  return Array.isArray(displayEducation) && displayEducation.length > 0 ? (
                    displayEducation.map((edu, index) => (
                      <div key={index} className="education-item">
                        {isEditing ? (
                          <div className="edit-form">
                            <div className="form-row">
                              <input
                                type="text"
                                className="edit-input"
                                value={edu.degree}
                                onChange={(e) => handleEducationChange(index, 'degree', e.target.value)}
                                placeholder="Degree"
                              />
                              <button className="remove-btn" onClick={() => removeEducation(index)}>
                                <X size={16} />
                              </button>
                            </div>
                            <input
                              type="text"
                              className="edit-input"
                              value={edu.institution}
                              onChange={(e) => handleEducationChange(index, 'institution', e.target.value)}
                              placeholder="Institution"
                            />
                            <input
                              type="text"
                              className="edit-input"
                              value={edu.period}
                              onChange={(e) => handleEducationChange(index, 'period', e.target.value)}
                              placeholder="Period (e.g., 2016 - 2020)"
                            />
                            <input
                              type="text"
                              className="edit-input"
                              value={edu.details}
                              onChange={(e) => handleEducationChange(index, 'details', e.target.value)}
                              placeholder="Additional details"
                            />
                          </div>
                        ) : (
                          <>
                            <div className="education-header">
                              <h4>{edu.degree}</h4>
                              <span className="period">{edu.period}</span>
                            </div>
                            <p className="institution">{edu.institution}</p>
                            <p className="education-details">{edu.details}</p>
                          </>
                        )}
                      </div>
                    ))
                  ) : isEditing ? (
                    <div className="empty-section-prompt">
                      <p>Click "Add Education" below to add your academic background</p>
                    </div>
                  ) : (
                    <div className="empty-section-prompt">
                      <p>Add your Education details to highlight your academic background</p>
                    </div>
                  );
                })()}
                {isEditing && (
                  <button className="add-btn education-add-btn" onClick={addEducation}>
                    <Plus size={16} /> Add Education
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Skills section (desktop only) */}
          <div className="overview-right-column">
            <div className="skills-section desktop-only">
              <h3>Skills</h3>
              {isEditing ? (
                <div className="edit-skills-form">
                  {formData.skills.map((skill, index) => (
                    <div key={index} className="edit-skill-item">
                      <div className="skill-form-row">
                        <input
                          type="text"
                          className="skill-name-input"
                          value={skill.name}
                          onChange={(e) => {
                            const updatedSkills = [...formData.skills];
                            updatedSkills[index] = { ...skill, name: e.target.value };
                            handleInputChange('skills', updatedSkills);
                          }}
                          placeholder="Skill name"
                        />
                        <select
                          className="skill-level-select"
                          value={skill.level}
                          onChange={(e) => {
                            const updatedSkills = [...formData.skills];
                            updatedSkills[index] = { ...skill, level: e.target.value };
                            handleInputChange('skills', updatedSkills);
                          }}
                        >
                          <option value="BEGINNER">Beginner</option>
                          <option value="INTERMEDIATE">Intermediate</option>
                          <option value="ADVANCED">Advanced</option>
                          <option value="EXPERT">Expert</option>
                        </select>
                        <button
                          className="remove-skill-btn"
                          onClick={() => {
                            const updatedSkills = formData.skills.filter((_, i) => i !== index);
                            handleInputChange('skills', updatedSkills);
                          }}
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                  <button
                    className="add-skill-btn"
                    onClick={() => {
                      const updatedSkills = [...formData.skills, { name: '', level: 'BEGINNER' }];
                      handleInputChange('skills', updatedSkills);
                    }}
                  >
                    <Plus size={16} /> Add Skill
                  </button>
                </div>
              ) : (
                <div className="skills-overview">
                  {formData.skills.map((skill, index) => (
                    <div key={index} className="skill-item">
                      <div className="skill-header">
                        <span className="skill-name">{skill.name}</span>
                        <span className={`skill-level ${skill.level.toLowerCase()}`}>{skill.level}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render projects tab content
  // function: renderProjects, no API needed (API handled in context/hooks)
  function renderProjects() {
    return (
      <div className="projects-content">
        <div className="projects-section">
          <h3>Projects You Own</h3>
          <div className="projects-grid">
            {userProjects.owned.map(project => (
              <ProjectCard
                key={project.id || project._id}
                project={project}
                onClick={handleViewProject}
                isOwned={true}
                onEdit={handleEditProject}
                onDelete={handleDeleteProject}
              />
            ))}
          </div>
        </div>

        <div className="projects-section">
          <h3>Projects You're Participating In</h3>
          <div className="projects-grid">
            {userProjects.participating.map(project => (
              <ProjectCard
                key={project.id || project._id}
                project={project}
                onClick={handleViewProject}
                isParticipating={true}
                onLeave={handleLeaveProject}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Render achievements tab content
  // function: renderAchievements, if you want to fetch from API, do it here
  // COMMENTED OUT - Achievements tab removed
  /*
  function renderAchievements() {
    return (
      <div className="achievements-content">
        <div className="achievements-list">
          {achievements.map(achievement => (
            <div key={achievement.id} className="achievement-card">
              <div className="achievement-icon">
                <span className="trophy">{achievement.icon}</span>
              </div>
              <div className="achievement-details">
                <h4 className="achievement-title">{achievement.title}</h4>
                <p className="achievement-desc">{achievement.description}</p>
                <p className="achievement-date">
                  {new Date(achievement.date).toLocaleDateString('en-US', {
                    month: 'numeric',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  */

  // Render settings tab content
  // function: renderSettings, add API calls for privacy/notification settings as needed
  function renderSettings() {
    return (
      <div className="settings-content">
        <div className="settings-card">
          <h3>Account Settings</h3>
          <div className="account-info">
            <div className="account-info-item">
              <Mail size={16} />
              <span>{user?.email || 'No email provided'}</span>
            </div>
          </div>
          {resetPasswordMessage && (
            <p className="settings-message">{resetPasswordMessage}</p>
          )}
          <button className="settings-btn" onClick={handleResetPassword}>Reset Password</button>
        </div>

        <div className="settings-card">
          <h3>Privacy Settings</h3>
          <p>Control who can see your profile and contact you.</p>
          {/* Add router or API call for privacy settings here */}
          <button className="settings-btn">Manage Privacy</button>
        </div>

        <div className="settings-card">
          <h3>Notification Settings</h3>
          <p>Choose what notifications you want to receive.</p>
          {/* Add router or API call for notification settings here */}
          <button className="settings-btn">Manage Notifications</button>
        </div>
      </div>
    );
  }
}

// Export the Profile component
export default Profile;