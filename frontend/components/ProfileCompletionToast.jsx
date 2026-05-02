import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './ProfileCompletionToast.css';

/**
 * Calculates profile completion percentage based on filled fields.
 * Returns a number 0–100.
 */
export function calculateProfileCompletion(user) {
  if (!user) return 0;

  const checks = [
    !!user.name,
    !!user.bio,
    !!user.location,
    !!user.role,
    !!(user.skills && user.skills.length > 0),
    !!(user.githubUrl || user.linkedinUrl || user.portfolioUrl),
    !!(user.experiences && user.experiences.length > 0),
    !!(user.education && user.education.length > 0),
    !!user.title,
  ];

  const filled = checks.filter(Boolean).length;
  return Math.round((filled / checks.length) * 100);
}

function ProfileCompletionToast() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [dismissed, setDismissed] = useState(false);

  // Reset dismissed state when user changes (new login)
  useEffect(() => {
    setDismissed(false);
  }, [user?.id, user?._id]);

  // Re-show when user navigates to the profile page
  useEffect(() => {
    if (location.pathname === '/profile') {
      setDismissed(false);
    }
  }, [location.pathname]);

  const percent = calculateProfileCompletion(user);
  const isVisible = isAuthenticated && !dismissed && percent < 100;

  // Tell Toast.css whether to offset upward via a body data attribute
  useEffect(() => {
    if (isVisible) {
      document.body.setAttribute('data-pct-toast', 'true');
    } else {
      document.body.removeAttribute('data-pct-toast');
    }
    return () => document.body.removeAttribute('data-pct-toast');
  }, [isVisible]);

  if (!isVisible) return null;

  // Circular progress ring math
  const size = 52;
  const strokeWidth = 4;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <div className="pct-toast" role="status" aria-label={`Profile ${percent}% complete`}>
      {/* Circular progress */}
      <div className="pct-ring-wrap" aria-hidden="true">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {/* Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="var(--color-border)"
            strokeWidth={strokeWidth}
          />
          {/* Progress arc */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="var(--color-primary)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        </svg>
        <span className="pct-percent">{percent}%</span>
      </div>

      {/* Label */}
      <button
        className="pct-label"
        onClick={() => navigate('/profile')}
        aria-label="Go to profile to complete it"
      >
        Complete profile
      </button>

      {/* Dismiss */}
      <button
        className="pct-close"
        onClick={() => setDismissed(true)}
        aria-label="Dismiss profile completion reminder"
      >
        <X size={14} />
      </button>
    </div>
  );
}

export default ProfileCompletionToast;
