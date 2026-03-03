import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { User, Plus, Menu, X, Bell, MessageCircle, Settings, LogOut } from 'lucide-react';
import NotificationModal from './NotificationModal';
import UserAvatar from './UserAvatar';
import './Navbar.css';

// Navbar component handles navigation, user actions, and responsive menu
function Navbar({ onAuthClick, onCreateProject, onCollaborationClick }) {
  // Hooks for routing and authentication
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();

  // State for toggling mobile menu, user dropdown, and notifications modal
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  // Handle user logout and close user menu
  const handleLogout = () => {
    logout();
    setShowUserMenu(false);
  };

  // Navigate to profile and close menus
  const handleProfileClick = () => {
    setShowUserMenu(false);
    setShowMobileMenu(false);
    navigate('/profile');
  };

  return (
    <nav className="navbar">
      <div className="nav-container">
        {/* Logo Section */}
        <Link to="/" className="nav-logo">
          <span className="logo-text">Teamera</span>
          <span className="logo-dot">.net</span>
        </Link>

        {/* Desktop Navigation Menu */}
        <ul className="nav-menu desktop-menu">
          <li className="nav-item">
            <Link 
              to="/" 
              className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}
            >
              Home
            </Link>
          </li>
          <li className="nav-item">
            <Link 
              to="/projects" 
              className={`nav-link ${location.pathname === '/projects' ? 'active' : ''}`}
            >
              Projects
            </Link>
          </li>
          <li className="nav-item">
            <Link 
              to="/hackathons" 
              className={`nav-link ${location.pathname === '/hackathons' ? 'active' : ''}`}
            >
              Hackathons
            </Link>
          </li>
        </ul>

        {/* Desktop User Actions (right side) */}
        <div className="nav-actions desktop-actions">
          {user ? (
            // If user is logged in, show user menu and actions
            <>
              <div className="user-menu-container">
                {/* Notification Button */}
                <button 
                  className="notification-btn"
                  onClick={() => setShowNotifications(true)}
                  title="Notifications"
                >
                  <Bell size={16} />
                  {unreadCount > 0 && (
                    <span className="notification-badge">{unreadCount}</span>
                  )}
                </button>
                {/* User Avatar Button */}
                <button 
                  className="user-avatar-container"
                  onClick={() => setShowUserMenu(!showUserMenu)}
                >
                  <UserAvatar user={user} size="medium" />
                  <div className="user-info">
                    <span className="user-name">{user?.name || 'Admin'}</span>
                    {/* <span className="user-role">Member</span> */}
                  </div>
                </button>
                {/* User Dropdown Menu */}
                {showUserMenu && (
                  <div className="user-dropdown">
                    <div className="dropdown-header">
                      <UserAvatar user={user} size="medium" />
                      <div>
                        <div className="dropdown-name">{user?.name || 'Admin'}</div>
                        <div className="dropdown-email">{user?.email || 'Admin@myadvance.com'}</div>
                      </div>
                    </div>
                    <div className="dropdown-divider"></div>
                    {/* Profile Link */}
                    <button onClick={handleProfileClick} className="dropdown-item">
                      <User size={16} />
                      My Profile
                    </button>
                    {/* Dashboard Link */}
                    <Link to="/dashboard" onClick={() => setShowUserMenu(false)} className="dropdown-item">
                      <Settings size={16} />
                      Dashboard
                    </Link>
                    {/* Messages/Collaboration */}
                    <button onClick={onCollaborationClick} className="dropdown-item">
                      <MessageCircle size={16} />
                      Messages
                    </button>

                    {/* Settings Link */}
                    {/* <Link to="/settings" onClick={() => setShowUserMenu(false)} className="dropdown-item">
                      <Settings size={16} />
                      Settings
                    </Link> */}
                    
                    <div className="dropdown-divider"></div>
                    {/* Logout Button */}
                    <button onClick={handleLogout} className="dropdown-item logout">
                      <LogOut size={16} />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            // If user is not logged in, show Join Teamera button
            <>
              <button className="join-Teamera-btn" onClick={() => onAuthClick('signup')}>
                Join Teamera
              </button>
            </>
          )}
        </div>

        {/* Mobile Menu Toggle Button (hamburger or close icon) */}
        <button 
          className="mobile-menu-toggle"
          onClick={() => setShowMobileMenu(!showMobileMenu)}
        >
          {showMobileMenu ? <X size={24} /> : <Menu size={24} />}
        </button>

        {/* Mobile Menu (shown when toggled) */}
        {showMobileMenu && (
          <div className="mobile-menu">
            {/* Mobile Navigation Links */}
            <ul className="mobile-nav-menu">
              <li>
                <Link 
                  to="/" 
                  className={location.pathname === '/' ? 'active' : ''}
                  onClick={() => setShowMobileMenu(false)}
                >
                  Home
                </Link>
              </li>
              <li>
                <Link 
                  to="/projects" 
                  className={location.pathname === '/projects' ? 'active' : ''}
                  onClick={() => setShowMobileMenu(false)}
                >
                  Projects
                </Link>
              </li>
              <li>
                <Link 
                  to="/hackathons" 
                  className={location.pathname === '/hackathons' ? 'active' : ''}
                  onClick={() => setShowMobileMenu(false)}
                >
                  Hackathons
                </Link>
              </li>
            </ul>
            {/* Mobile User Actions */}
            <div className="mobile-actions">
              {user ? (
                // If user is logged in, show mobile user actions
                <>
                  {/* Notifications Button */}
                  <button 
                    className="notification-btn mobile"
                    onClick={() => {
                      setShowNotifications(true);
                      setShowMobileMenu(false);
                    }}
                  >
                    <Bell size={20} />
                    Notifications
                    {unreadCount > 0 && (
                      <span className="notification-badge">{unreadCount}</span>
                    )}
                  </button>

                  {/* Messages Button */}
                  <button 
                    className="collaboration-btn mobile"
                    onClick={() => {
                      onCollaborationClick();
                      setShowMobileMenu(false);
                    }}
                  >
                    <MessageCircle size={20} />
                    Messages
                  </button>

                  {/* Profile Button */}
                  <button 
                    onClick={handleProfileClick}
                    className="mobile-profile-link"
                  >
                    <User size={20} />
                    Profile
                  </button>

                  {/* Dashboard Link */}
                  <Link 
                    to="/dashboard" 
                    className="mobile-profile-link"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    <Settings size={20} />
                    Dashboard
                  </Link>
                  
                  {/* Logout Button */}
                  <button className="mobile-logout-btn" onClick={handleLogout}>
                    <LogOut size={20} />
                    Logout
                  </button>
                </>
              ) : (
                // If user is not logged in, show Join Teamera button
                <>
                  <button 
                    className="join-Teamera-btn mobile"
                    onClick={() => {
                      onAuthClick('signup');
                      setShowMobileMenu(false);
                    }}
                  >
                    Join Teamera
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Notification Modal (shown when notifications are open) */}
      {showNotifications && (
        <NotificationModal onClose={() => setShowNotifications(false)} />
      )}
    </nav>
  );
}

export default Navbar;