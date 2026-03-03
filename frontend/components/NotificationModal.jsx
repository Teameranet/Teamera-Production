import { X, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../context/NotificationContext';
import './NotificationModal.css';

function NotificationModal({ onClose }) {
  const { notifications, markAsRead, markAllAsRead, removeNotification } = useNotifications();
  const navigate = useNavigate();

  const handleNotificationClick = (notification) => {
    // Mark as read if unread
    if (!notification.read) {
      markAsRead(notification.id);
    }

    // Navigate to the appropriate page
    if (notification.navigationPath) {
      // Close the notification modal first
      onClose();

      // Navigate to the path with state if provided
      if (notification.navigationState) {
        navigate(notification.navigationPath, { state: notification.navigationState });
      } else {
        navigate(notification.navigationPath);
      }
    }
  };

  const handleRemoveNotification = (e, notificationId) => {
    e.stopPropagation();
    removeNotification(notificationId);
  };

  return (
    <div className="notification-modal-overlay" onClick={onClose}>
      <div className="notification-modal" onClick={(e) => e.stopPropagation()}>
        <div className="notification-header">
          <h3>Recent Activity</h3>
          <div className="header-actions">

            <button className="close-btn" onClick={onClose}>
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="notifications-list">
          {notifications.length === 0 ? (
            <div className="no-notifications">
              <p>No notifications yet</p>
            </div>
          ) : (
            notifications.map(notification => (
              <div
                key={notification.id}
                className={`notification-item ${!notification.read ? 'unread' : ''}`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div
                  className="notification-icon"
                  style={{ color: notification.color }}
                >
                  {notification.icon}
                </div>
                <div className="notification-content">
                  <p className="notification-title">{notification.title}</p>
                  <span className="notification-time">{notification.time}</span>
                </div>
                <button
                  className="remove-notification-btn"
                  onClick={(e) => handleRemoveNotification(e, notification.id)}
                  title="Remove notification"
                >
                  <Trash2 size={14} />
                </button>
                {/* {!notification.read && <div className="unread-indicator"></div>} */}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default NotificationModal;