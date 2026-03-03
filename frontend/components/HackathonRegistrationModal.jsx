import { useState } from 'react';
import { X, Upload, Send, Calendar, Trophy, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './HackathonRegistrationModal.css';

function HackathonRegistrationModal({ hackathon, onClose, isJoinFlow = false }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    teamName: '',
    teamSize: '1',
    experience: '',
    motivation: '',
    skills: [],
    resume: null,
    agreeTerms: false
  });
  const { user } = useAuth();

  const steps = isJoinFlow 
    ? ['Team Info', 'Skills & Experience', 'Confirmation']
    : ['Registration', 'Team Details', 'Confirmation'];

  const skillOptions = [
    'React', 'Node.js', 'Python', 'JavaScript', 'TypeScript', 'UI/UX Design',
    'Machine Learning', 'Data Science', 'Mobile Development', 'DevOps',
    'Blockchain', 'AI/ML', 'Backend Development', 'Frontend Development'
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSkillToggle = (skill) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter(s => s !== skill)
        : [...prev.skills, skill]
    }));
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    setFormData(prev => ({
      ...prev,
      resume: file
    }));
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSubmit();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = () => {
    // Handle registration/join submission
    console.log('Submitting:', formData);
    onClose();
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return isJoinFlow 
          ? formData.teamName && formData.teamSize
          : formData.motivation && formData.experience;
      case 1:
        return formData.skills.length > 0;
      case 2:
        return formData.agreeTerms;
      default:
        return false;
    }
  };

  const renderStepContent = () => {
    if (isJoinFlow) {
      switch (currentStep) {
        case 0:
          return (
            <div className="step-content">
              <div className="form-group">
                <label>Team Name</label>
                <input
                  type="text"
                  value={formData.teamName}
                  onChange={(e) => handleInputChange('teamName', e.target.value)}
                  placeholder="Enter your team name"
                />
              </div>
              <div className="form-group">
                <label>Team Size</label>
                <select
                  value={formData.teamSize}
                  onChange={(e) => handleInputChange('teamSize', e.target.value)}
                >
                  <option value="1">Solo (1 member)</option>
                  <option value="2">2 members</option>
                  <option value="3">3 members</option>
                  <option value="4">4 members</option>
                  <option value="5">5+ members</option>
                </select>
              </div>
            </div>
          );
        case 1:
          return (
            <div className="step-content">
              <div className="form-group">
                <label>Your Skills</label>
                <div className="skills-grid">
                  {skillOptions.map(skill => (
                    <button
                      key={skill}
                      type="button"
                      className={`skill-btn ${formData.skills.includes(skill) ? 'selected' : ''}`}
                      onClick={() => handleSkillToggle(skill)}
                    >
                      {skill}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          );
        case 2:
          return (
            <div className="step-content">
              <div className="confirmation-content">
                <h3>Ready to Join!</h3>
                <div className="hackathon-summary">
                  <h4>{hackathon.title}</h4>
                  <div className="summary-details">
                    <div className="detail-item">
                      <Calendar size={16} />
                      <span>{new Date(hackathon.startDate).toLocaleDateString()} - {new Date(hackathon.endDate).toLocaleDateString()}</span>
                    </div>
                    <div className="detail-item">
                      <Trophy size={16} />
                      <span>{hackathon.prize}</span>
                    </div>
                    <div className="detail-item">
                      <Users size={16} />
                      <span>Team: {formData.teamName} ({formData.teamSize} members)</span>
                    </div>
                  </div>
                </div>
                <div className="form-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.agreeTerms}
                      onChange={(e) => handleInputChange('agreeTerms', e.target.checked)}
                    />
                    I agree to the hackathon terms and conditions
                  </label>
                </div>
              </div>
            </div>
          );
      }
    } else {
      switch (currentStep) {
        case 0:
          return (
            <div className="step-content">
              <div className="form-group">
                <label>Why do you want to participate?</label>
                <textarea
                  value={formData.motivation}
                  onChange={(e) => handleInputChange('motivation', e.target.value)}
                  placeholder="Tell us about your motivation and what you hope to achieve..."
                  rows={4}
                />
              </div>
              <div className="form-group">
                <label>Experience Level</label>
                <select
                  value={formData.experience}
                  onChange={(e) => handleInputChange('experience', e.target.value)}
                >
                  <option value="">Select your experience level</option>
                  <option value="beginner">Beginner (0-1 years)</option>
                  <option value="intermediate">Intermediate (2-3 years)</option>
                  <option value="experienced">Experienced (4-6 years)</option>
                  <option value="expert">Expert (7+ years)</option>
                </select>
              </div>
            </div>
          );
        case 1:
          return (
            <div className="step-content">
              <div className="form-group">
                <label>Team Name (Optional)</label>
                <input
                  type="text"
                  value={formData.teamName}
                  onChange={(e) => handleInputChange('teamName', e.target.value)}
                  placeholder="Enter team name if you have one"
                />
              </div>
              <div className="form-group">
                <label>Your Skills</label>
                <div className="skills-grid">
                  {skillOptions.map(skill => (
                    <button
                      key={skill}
                      type="button"
                      className={`skill-btn ${formData.skills.includes(skill) ? 'selected' : ''}`}
                      onClick={() => handleSkillToggle(skill)}
                    >
                      {skill}
                    </button>
                  ))}
                </div>
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
                    {formData.resume ? formData.resume.name : 'Choose file'}
                  </label>
                </div>
              </div>
            </div>
          );
        case 2:
          return (
            <div className="step-content">
              <div className="confirmation-content">
                <h3>Registration Complete!</h3>
                <div className="hackathon-summary">
                  <h4>{hackathon.title}</h4>
                  <div className="summary-details">
                    <div className="detail-item">
                      <Calendar size={16} />
                      <span>{new Date(hackathon.startDate).toLocaleDateString()} - {new Date(hackathon.endDate).toLocaleDateString()}</span>
                    </div>
                    <div className="detail-item">
                      <Trophy size={16} />
                      <span>{hackathon.prize}</span>
                    </div>
                    <div className="detail-item">
                      <Users size={16} />
                      <span>{hackathon.participants} participants registered</span>
                    </div>
                  </div>
                </div>
                <div className="form-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.agreeTerms}
                      onChange={(e) => handleInputChange('agreeTerms', e.target.checked)}
                    />
                    I agree to the hackathon terms and conditions
                  </label>
                </div>
              </div>
            </div>
          );
      }
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="hackathon-registration-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{isJoinFlow ? 'Join Hackathon' : 'Register for Hackathon'}</h2>
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
            <h3>{steps[currentStep]}</h3>
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
              {currentStep === steps.length - 1 ? (isJoinFlow ? 'Join Now' : 'Register') : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HackathonRegistrationModal;