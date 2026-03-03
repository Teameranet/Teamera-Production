import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import './OnboardingModal.css';

function OnboardingModal({ onClose }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    role: '',
    skills: [],
    experience: '',
    bio: '',
    location: '',
  });
  const { updateProfile } = useAuth();

  const steps = [
    { title: 'What describes you best?', subtitle: 'Choose the role that fits you' },
    { title: 'What are your skills?', subtitle: 'Select all that apply' },
    { title: 'Experience & Location', subtitle: 'Help us personalize your experience' },
    { title: 'Complete your profile', subtitle: 'Add a short bio & review your info' },
  ];

  const roles = [
    { id: 'founder', label: 'The Founder', description: 'I have startup ideas and want to build a team', icon: '🚀' },
    { id: 'professional', label: 'The Professional', description: 'I want to join exciting projects and contribute my skills', icon: '💼' },
    { id: 'investor', label: 'The Investor', description: 'I\'m looking for promising startups to invest in', icon: '📈' },
    { id: 'student', label: 'The Student', description: 'I want to learn and gain experience through projects', icon: '🎓' },
  ];

  const skillOptions = [
    'React', 'Node.js', 'Python', 'JavaScript', 'TypeScript', 'UI/UX Design',
    'Product Management', 'Marketing', 'Sales', 'Data Science', 'Machine Learning',
    'Mobile Development', 'DevOps', 'Blockchain', 'AI/ML', 'Backend Development',
    'Frontend Development', 'Full Stack', 'Digital Marketing', 'Content Writing',
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSkillToggle = (skill) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter(s => s !== skill)
        : [...prev.skills, skill],
    }));
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  const handleComplete = async () => {
    try {
      // Map experience to skill level
      const mapExperienceToSkillLevel = (experience) => {
        switch(experience) {
          case '0-1': return 'BEGINNER';
          case '2-3': return 'INTERMEDIATE';
          case '4-6': return 'ADVANCED';
          case '7+': return 'EXPERT';
          default: return 'INTERMEDIATE';
        }
      };

      // Map years to numeric value
      const mapExperienceToYears = (experience) => {
        switch(experience) {
          case '0-1': return 1;
          case '2-3': return 2;
          case '4-6': return 5;
          case '7+': return 8;
          default: return 1;
        }
      };

      const skillLevel = mapExperienceToSkillLevel(formData.experience);
      const skillYears = mapExperienceToYears(formData.experience);

      // Format skills as objects with name, level, and years
      const formattedSkills = formData.skills.map(skill => ({
        name: skill,
        level: skillLevel,
        years: skillYears
      }));

      // Prepare profile data with formatted skills
      const profileData = {
        ...formData,
        skills: formattedSkills
      };

      // Update profile with onboarding data
      const result = await updateProfile(profileData);
      if (result.success) {
        onClose();
      } else {
        console.error('Failed to save onboarding data:', result.error);
        // Still close modal even if backend fails (data is saved locally)
        onClose();
      }
    } catch (error) {
      console.error('Error completing onboarding:', error);
      // Still close modal even if error occurs
      onClose();
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0: return formData.role;
      case 1: return formData.skills.length > 0;
      case 2: return formData.experience && formData.location;
      case 3: return formData.bio;
      default: return false;
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="ob-role-grid">
            {roles.map(role => (
              <button
                key={role.id}
                type="button"
                className={`ob-role-card ${formData.role === role.id ? 'selected' : ''}`}
                onClick={() => handleInputChange('role', role.id)}
              >
                <span className="ob-role-icon">{role.icon}</span>
                <div>
                  <span className="ob-role-label">{role.label}</span>
                  <span className="ob-role-desc">{role.description}</span>
                </div>
              </button>
            ))}
          </div>
        );

      case 1:
        return (
          <div className="ob-skills-wrap">
            <div className="ob-skills-grid">
              {skillOptions.map(skill => (
                <button
                  key={skill}
                  type="button"
                  className={`ob-skill-chip ${formData.skills.includes(skill) ? 'selected' : ''}`}
                  onClick={() => handleSkillToggle(skill)}
                >
                  {formData.skills.includes(skill) && (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                  {skill}
                </button>
              ))}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="ob-fields">
            <div className="ob-field">
              <label htmlFor="ob-experience">Years of Experience</label>
              <select
                id="ob-experience"
                value={formData.experience}
                onChange={(e) => handleInputChange('experience', e.target.value)}
              >
                <option value="">Select experience level</option>
                <option value="0-1">0-1 years (Beginner)</option>
                <option value="2-3">2-3 years (Intermediate)</option>
                <option value="4-6">4-6 years (Experienced)</option>
                <option value="7+">7+ years (Expert)</option>
              </select>
            </div>
            <div className="ob-field">
              <label htmlFor="ob-location">Location</label>
              <input
                type="text"
                id="ob-location"
                placeholder="e.g., Mumbai, India"
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
              />
            </div>
          </div>
        );

      case 3:
        return (
          <div className="ob-fields">
            <div className="ob-field">
              <label htmlFor="ob-bio">Bio</label>
              <textarea
                id="ob-bio"
                placeholder="Tell us about yourself, your interests, and what you're looking for..."
                value={formData.bio}
                onChange={(e) => handleInputChange('bio', e.target.value)}
                rows={3}
              />
            </div>
            <div className="ob-summary">
              <h4>Profile Summary</h4>
              <div className="ob-summary-row">
                <span className="ob-summary-label">Role</span>
                <span className="ob-summary-value">{roles.find(r => r.id === formData.role)?.label || '—'}</span>
              </div>
              <div className="ob-summary-row">
                <span className="ob-summary-label">Skills</span>
                <span className="ob-summary-value">{formData.skills.length > 0 ? formData.skills.join(', ') : '—'}</span>
              </div>
              <div className="ob-summary-row">
                <span className="ob-summary-label">Experience</span>
                <span className="ob-summary-value">{formData.experience || '—'}</span>
              </div>
              <div className="ob-summary-row">
                <span className="ob-summary-label">Location</span>
                <span className="ob-summary-value">{formData.location || '—'}</span>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="ob-overlay">
      <div className="ob-modal">
        {/* Logo — same as AuthModal */}
        {/* <div className="ob-logo-section">
          <div className="ob-logo-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M13 2L4.09 12.11C3.68 12.59 3.45 13 3.45 13.5C3.45 14.33 4.12 15 4.95 15H10L9 22L17.91 11.89C18.32 11.41 18.55 11 18.55 10.5C18.55 9.67 17.88 9 17.05 9H14L13 2Z" fill="white" />
            </svg>
          </div>
          <span className="ob-logo-text">Teamera</span>
        </div> */}

        {/* Heading */}
        <div className="ob-heading">
          <h2>{steps[currentStep].title}</h2>
          <p className="ob-subtitle">{steps[currentStep].subtitle}</p>
        </div>

        {/* Progress Dots */}
        <div className="ob-progress">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`ob-dot ${i === currentStep ? 'active' : ''} ${i < currentStep ? 'done' : ''}`}
            />
          ))}
        </div>

        {/* Step Content */}
        <div className="ob-content">
          {renderStepContent()}
        </div>

        {/* Actions */}
        <div className="ob-actions">
          {currentStep > 0 ? (
            <button type="button" className="ob-btn-secondary" onClick={handlePrevious}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
              Back
            </button>
          ) : (
            <div />
          )}
          <button
            type="button"
            className="ob-btn-primary"
            onClick={handleNext}
            disabled={!canProceed()}
          >
            {currentStep === steps.length - 1 ? 'Complete' : 'Continue'}
            {currentStep < steps.length - 1 && (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            )}
          </button>
        </div>

        {/* Skip */}
        {/* <div className="ob-skip-row">
          <button type="button" className="ob-skip-btn" onClick={onClose}>Skip for now</button>
        </div> */}
      </div>
    </div>
  );
}

export default OnboardingModal;