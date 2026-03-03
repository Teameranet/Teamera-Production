import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import './AuthModal.css';

function AuthModal({ onClose, onSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();

  const handleInputChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({
      ...formData,
      [e.target.name]: value
    });
    // Clear error when user starts typing
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validate password match for sign up
    if (!isLogin) {
      if (formData.password !== formData.confirmPassword) {
        setError('Password and Confirm Password do not match');
        return;
      }
    }

    setLoading(true);

    try {
      const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const apiUrl = `${apiBaseUrl}/api`;
      
      if (isLogin) {
        // Login - Make API call to backend
        const response = await fetch(`${apiUrl}/users/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Invalid email or password');
        }

        // Successfully logged in
        const backendUser = data.data.user;
        const userData = {
          id: backendUser._id || backendUser.id,
          name: backendUser.name,
          email: backendUser.email,
          role: backendUser.role || 'user',
          avatar: backendUser.avatar || '/api/placeholder/40/40',
          bio: backendUser.bio || '',
          skills: backendUser.skills || [],
          experience: backendUser.experience || '',
          location: backendUser.location || '',
          title: backendUser.title || '',
          githubUrl: backendUser.githubUrl || '',
          linkedinUrl: backendUser.linkedinUrl || '',
          portfolioUrl: backendUser.portfolioUrl || '',
          experiences: backendUser.experiences || [],
          education: backendUser.education || [],
          createdAt: backendUser.createdAt,
          token: data.data.token
        };

        login(userData);
        onSuccess(userData);
      } else {
        // Sign up - Make API call to backend
        const response = await fetch(`${apiUrl}/users`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: formData.fullName,
            email: formData.email,
            password: formData.password,
            confirmPassword: formData.confirmPassword
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Failed to create account');
        }

        // Successfully created user
        const userData = {
          id: data.data._id,
          name: data.data.name,
          email: data.data.email,
          role: data.data.role || 'user',
          avatar: data.data.avatar || '/api/placeholder/40/40',
          bio: data.data.bio || '',
          skills: data.data.skills || [],
          experience: data.data.experience || '',
          location: data.data.location || ''
        };

        login(userData);
        onSuccess(userData);
      }
    } catch (err) {
      console.error('Auth error:', err);
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = () => {
    setLoading(true);
    setTimeout(() => {
      const userData = {
        id: Date.now(),
        name: 'John Doe',
        email: 'john.doe@gmail.com',
        role: 'user',
        avatar: '/api/placeholder/40/40',
        provider: 'google',
        bio: 'Full-stack developer with 5 years of experience in building scalable web applications',
        skills: ['React', 'Node.js', 'Python', 'UI/UX Design'],
        experience: '4-6',
        location: 'Bangalore, India'
      };

      login(userData);
      setLoading(false);
      onSuccess(userData);
    }, 1000);
  };

  const handleAppleAuth = () => {
    setLoading(true);
    setTimeout(() => {
      const userData = {
        id: Date.now(),
        name: 'Jane Smith',
        email: 'jane.smith@icloud.com',
        role: 'user',
        avatar: '/api/placeholder/40/40',
        provider: 'apple',
        bio: 'Product manager and entrepreneur focused on healthcare technology solutions',
        skills: ['Product Management', 'Marketing', 'Data Science'],
        experience: '7+',
        location: 'Delhi, India'
      };

      login(userData);
      setLoading(false);
      onSuccess(userData);
    }, 1000);
  };

  return (
    <div className="auth-modal-overlay" onClick={onClose}>
      <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
        {/* Close Button */}
        <button className="auth-close-btn" onClick={onClose} aria-label="Close">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        {/* Logo Section */}
        <div className="auth-logo-section">
          <div className="auth-logo-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M13 2L4.09 12.11C3.68 12.59 3.45 13 3.45 13.5C3.45 14.33 4.12 15 4.95 15H10L9 22L17.91 11.89C18.32 11.41 18.55 11 18.55 10.5C18.55 9.67 17.88 9 17.05 9H14L13 2Z" fill="white" />
            </svg>
          </div>
          <span className="auth-logo-text">Teamera</span>
        </div>

        {/* Heading */}
        <div className="auth-heading">
          <h2>{isLogin ? 'Sign in to your account' : 'Create your account'}</h2>
          <p className="auth-subtitle">
            {isLogin
              ? 'Welcome back! Please enter your details.'
              : 'Welcome! Fill in the details to get started.'}
          </p>
        </div>

        {/* Social Auth Buttons */}
        <div className="auth-social-row">
          <button
            className="auth-social-btn"
            onClick={handleGoogleAuth}
            disabled={loading}
            type="button"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Google
          </button>
          <button
            className="auth-social-btn"
            onClick={handleAppleAuth}
            disabled={loading}
            type="button"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
              <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
            </svg>
            Apple
          </button>
        </div>

        {/* Divider */}
        <div className="auth-divider">
          <span>OR</span>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="auth-form">
          {/* Error Message */}
          {error && (
            <div className="auth-error-message">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* Full Name (Sign Up only) */}
          {!isLogin && (
            <div className="auth-field">
              <label htmlFor="auth-fullname">Full Name</label>
              <input
                type="text"
                id="auth-fullname"
                name="fullName"
                placeholder="Enter your full name"
                value={formData.fullName}
                onChange={handleInputChange}
                required
                disabled={loading}
                autoComplete="name"
              />
            </div>
          )}

          {/* Email */}
          <div className="auth-field">
            <label htmlFor="auth-email">Email address</label>
            <input
              type="email"
              id="auth-email"
              name="email"
              placeholder="name@company.com"
              value={formData.email}
              onChange={handleInputChange}
              required
              disabled={loading}
              autoComplete="email"
            />
          </div>

          {/* Password */}
          <div className="auth-field">
            <label htmlFor="auth-password">Password</label>
            <div className="auth-password-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                id="auth-password"
                name="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleInputChange}
                required
                disabled={loading}
                autoComplete={isLogin ? 'current-password' : 'new-password'}
              />
              <button
                type="button"
                className="auth-toggle-password"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                tabIndex={-1}
              >
                {showPassword ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Confirm Password (Sign Up only) */}
          {!isLogin && (
            <div className="auth-field">
              <label htmlFor="auth-confirm-password">Confirm password</label>
              <div className="auth-password-wrapper">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="auth-confirm-password"
                  name="confirmPassword"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  required
                  disabled={loading}
                  autoComplete="new-password"
                  className={
                    formData.confirmPassword && formData.password !== formData.confirmPassword
                      ? 'password-mismatch'
                      : formData.confirmPassword && formData.password === formData.confirmPassword
                      ? 'password-match'
                      : ''
                  }
                />
                <button
                  type="button"
                  className="auth-toggle-password"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  tabIndex={-1}
                >
                  {showConfirmPassword ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
              {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                <span className="auth-field-hint error">Passwords do not match</span>
              )}
              {formData.confirmPassword && formData.password === formData.confirmPassword && (
                <span className="auth-field-hint success">Passwords match</span>
              )}
            </div>
          )}

          {/* Forgot Password (Sign In only) */}
          {isLogin && (
            <div className="auth-forgot-row">
              <a href="#" className="auth-forgot-link">Forgot password?</a>
            </div>
          )}

          {/* Terms Checkbox (Sign Up only) */}
          {!isLogin && (
            <div className="auth-terms-row">
              <label className="auth-checkbox-label">
                <input
                  type="checkbox"
                  name="agreeToTerms"
                  checked={formData.agreeToTerms}
                  onChange={handleInputChange}
                />
                <span className="auth-checkmark"></span>
                <span className="auth-terms-text">
                  I agree to the <a href="#" className="auth-link">Terms of Service</a> and <a href="#" className="auth-link">Privacy Policy</a>
                </span>
              </label>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            className="auth-submit-btn"
            disabled={loading || (!isLogin && !formData.agreeToTerms)}
          >
            {loading ? (
              <span className="auth-spinner"></span>
            ) : (
              isLogin ? 'Sign in' : 'Continue'
            )}
          </button>
        </form>

        {/* Toggle Sign In / Sign Up */}
        <div className="auth-toggle-row">
          {isLogin ? (
            <p>Don't have an account? <button type="button" className="auth-toggle-btn" onClick={() => setIsLogin(false)}>Sign up</button></p>
          ) : (
            <p>Already have an account? <button type="button" className="auth-toggle-btn" onClick={() => setIsLogin(true)}>Sign in</button></p>
          )}
        </div>
      </div>
    </div>
  );
}

export default AuthModal;