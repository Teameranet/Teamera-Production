import React from 'react';
import './UserAvatar.css';

/**
 * UserAvatar Component
 * 
 * Displays a circular avatar with the first letter of the user's name or email.
 * 
 * @param {Object} props
 * @param {Object} props.user - User object (can contain name, email)
 * @param {string} props.size - Size of the avatar (small, medium, large)
 * @param {string} props.className - Additional CSS classes
 * @param {string} props.name - Override name for initial
 * @param {string} props.color - Override background color
 * @returns {JSX.Element} UserAvatar component
 */
function UserAvatar({ user, size = 'medium', className = '', name, color }) {
  // Get the first letter of name or email
  const getInitial = () => {
    if (name) return name.charAt(0).toUpperCase();
    if (!user) return 'A';
    if (user.name) return user.name.charAt(0).toUpperCase();
    if (user.email) return user.email.charAt(0).toUpperCase();
    return 'A'; // Default if no name or email
  };

  // Generate classes based on props
  const avatarClasses = `user-avatar avatar-${size} ${className}`;

  // Get background color
  const getBackgroundColor = () => {
    if (color) return color;
    if (user?.applicantColor) return user.applicantColor;
    return '#4f46e5'; // Default color
  };

  return (
    <div 
      className={avatarClasses}
      style={{ backgroundColor: getBackgroundColor() }}
    >
      <span className="avatar-initial">{getInitial()}</span>
    </div>
  );
}

export default UserAvatar; 