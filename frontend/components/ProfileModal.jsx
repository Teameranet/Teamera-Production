import { useState } from 'react';
import UserAvatar from './UserAvatar';
import './ProfileModal.css';
import { X, Github, Linkedin, Globe, Mail } from 'lucide-react';

/**
 * ProfileModal Component
 * 
 * Displays a modal with detailed information about a user
 * including their avatar, about section, experience, education, and skills
 * 
 * @param {Object} props
 * @param {Object} props.user - User object with profile details
 * @param {Function} props.onClose - Function to close the modal
 * @returns {JSX.Element} ProfileModal component
 */
function ProfileModal({ user, onClose }) {
  const [activeTab, setActiveTab] = useState('about');

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

  // If no user is provided, return null
  if (!user) return null;

  return (
    <div className="profile-modal-overlay" onClick={onClose}>
      <div className="profile-modal" onClick={(e) => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}>
          <X size={24} />
        </button>

        {/* Header with user avatar and basic info */}
        <div className="profile-header">
          <UserAvatar user={user} size="large" className="profile-avatar" />
          <div className="profile-basic-info">
            <h2>{user.name}</h2>
            <p className="profile-title">{user.title || getRoleDisplayTitle(user.role)}</p>
            {user.location && <p className="profile-location">{user.location}</p>}
          </div>
        </div>

        {/* Profile navigation tabs */}
        <div className="profile-tabs">
          <button
            className={`profile-tab ${activeTab === 'about' ? 'active' : ''}`}
            onClick={() => setActiveTab('about')}
          >
            About
          </button>
          <button
            className={`profile-tab ${activeTab === 'experience' ? 'active' : ''}`}
            onClick={() => setActiveTab('experience')}
          >
            Experience
          </button>
          <button
            className={`profile-tab ${activeTab === 'education' ? 'active' : ''}`}
            onClick={() => setActiveTab('education')}
          >
            Education
          </button>
          <button
            className={`profile-tab ${activeTab === 'skills' ? 'active' : ''}`}
            onClick={() => setActiveTab('skills')}
          >
            Skills
          </button>
        </div>

        {/* Profile content based on active tab */}
        <div className="profile-content">
          {activeTab === 'about' && (
            <div className="profile-about">
              <h3>About</h3>
              <p>{user.bio || 'No bio information available.'}</p>

              {/* Contact information */}
              <div className="contact-info">
                <h4>Contact</h4>
                
                {/* Basic contact info */}
                {user.email && (
                  <div className="contact-item">
                    <Mail size={16} />
                    <span>{user.email}</span>
                  </div>
                )}
                

                {/* Social media links */}
                {(user.githubUrl || user.linkedinUrl || user.portfolioUrl || user.twitterUrl || user.instagramUrl) && (
                  <div className="social-media-section">
                    <h5>Social Media</h5>
                    <div className="social-links-grid">
                      {user.githubUrl && (
                        <a href={user.githubUrl} target="_blank" rel="noopener noreferrer" className="social-link">
                          <Github size={20} />
                          <span>GitHub</span>
                        </a>
                      )}
                      {user.linkedinUrl && (
                        <a href={user.linkedinUrl} target="_blank" rel="noopener noreferrer" className="social-link">
                          <Linkedin size={20} />
                          <span>LinkedIn</span>
                        </a>
                      )}
                      {user.portfolioUrl && (
                        <a href={user.portfolioUrl} target="_blank" rel="noopener noreferrer" className="social-link">
                          <Globe size={20} />
                          <span>Portfolio</span>
                        </a>
                      )}
                      
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'experience' && (
            <div className="profile-experience">
              <h3>Experience</h3>
              {(() => {
                // Use 'experiences' array from user object (backend field)
                const experiences = Array.isArray(user.experiences) ? user.experiences : [];
                return experiences.length > 0 ? (
                <div className="experience-list">
                  {experiences.map((exp, index) => (
                    <div key={index} className="experience-item">
                      <h4>{exp.title}</h4>
                      <p className="company-name">{exp.company}</p>
                      <p className="experience-duration">{exp.period || exp.duration}</p>
                      {exp.description && <p className="experience-description">{exp.description}</p>}
                      {exp.technologies && exp.technologies.length > 0 && (
                        <div className="experience-technologies">
                          <strong>Technologies:</strong> {exp.technologies.join(', ')}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p>No experience information available.</p>
              );
              })()}
            </div>
          )}

          {activeTab === 'education' && (
            <div className="profile-education">
              <h3>Education</h3>
              {(() => {
                const education = Array.isArray(user.education) ? user.education : [];
                return education.length > 0 ? (
                <div className="education-list">
                  {education.map((edu, index) => (
                    <div key={index} className="education-item">
                      <h4>{edu.degree}</h4>
                      <p className="institution-name">{edu.institution}</p>
                      <p className="education-duration">{edu.duration || edu.period}</p>
                      {(edu.description || edu.details) && (
                        <p className="education-description">{edu.description || edu.details}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p>No education information available.</p>
              );
              })()}
            </div>
          )}

          {activeTab === 'skills' && (
            <div className="profile-skills">
              <h3>Skills</h3>
              {(() => {
                const skills = Array.isArray(user.skills) ? user.skills : [];
                return skills.length > 0 ? (
                <div className="skills-list">
                  {skills.map((skill, index) => {
                    // Handle both string skills and object skills
                    if (typeof skill === 'string') {
                      return <span key={index} className="skill-tag">{skill}</span>;
                    } else if (skill && skill.name) {
                      return <span key={index} className="skill-tag">{skill.name}</span>;
                    }
                    return null;
                  })}
                </div>
              ) : (
                <p>No skills information available.</p>
              );
              })()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProfileModal; 