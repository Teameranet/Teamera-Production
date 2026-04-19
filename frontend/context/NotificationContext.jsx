import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { Users, CheckCircle, XCircle, UserMinus, LogOut, Mail } from 'lucide-react';
import { useAuth } from './AuthContext';
import ToastContainer from '../components/Toast';

const NotificationContext = createContext();

const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const TYPE_META = {
  NEW_APPLICATION:      { icon: (s) => <Users size={s} />,       color: '#10b981', subTab: 'received' },
  APPLICATION_ACCEPTED: { icon: (s) => <CheckCircle size={s} />, color: '#10b981', subTab: 'sent' },
  APPLICATION_REJECTED: { icon: (s) => <XCircle size={s} />,     color: '#ef4444', subTab: 'sent' },
  // Owner is notified when a member quits → owner's copy is in Received (their received applications)
  MEMBER_QUIT:          { icon: (s) => <LogOut size={s} />,      color: '#6366f1', subTab: 'received' },
  // Owner is notified when they remove a member → owner's copy is in Received (their received applications)
  MEMBER_REMOVED_OWNER: { icon: (s) => <UserMinus size={s} />,   color: '#f59e0b', subTab: 'received' },
  // Member is notified when they are removed → member's copy is in Sent (their sent applications)
  MEMBER_REMOVED:       { icon: (s) => <UserMinus size={s} />,   color: '#f59e0b', subTab: 'sent' },
  // Member is notified when they receive an invitation → redirect to Received tab
  INVITATION_RECEIVED:  { icon: (s) => <Mail size={s} />,        color: '#3b82f6', subTab: 'received' },
};

function enrichNotification(n) {
  const meta = TYPE_META[n.type] || { icon: (s) => <Users size={s} />, color: '#10b981', subTab: 'received' };
  return {
    ...n,
    id: n._id || n.id,
    title: n.message,
    icon: meta.icon(16),
    color: meta.color,
    time: formatTime(n.createdAt),
    navigationPath: n.navigationPath || '/dashboard',
    navigationState: n.navigationState || { tab: 'applications', subTab: meta.subTab }
  };
}

function formatTime(dateStr) {
  if (!dateStr) return 'Just now';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} minute${mins > 1 ? 's' : ''} ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs > 1 ? 's' : ''} ago`;
  const days = Math.floor(hrs / 24);
  return `${days} day${days > 1 ? 's' : ''} ago`;
}

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotifications must be used within a NotificationProvider');
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [toasts, setToasts] = useState([]);
  const { user } = useAuth();
  const esRef = useRef(null);

  // ── Toast helpers ──────────────────────────────────────────
  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(({ title, description, type = 'info', duration = 5000, action }) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, title, description, type, duration, action }]);
  }, []);

  // Fetch full notification list from REST (initial load)
  const fetchNotifications = useCallback(async (userId) => {
    if (!userId) return;
    try {
      const res = await fetch(`${apiBaseUrl}/api/notifications/${userId}`);
      const result = await res.json();
      if (result.success) {
        setNotifications(result.data.map(enrichNotification));
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  }, []);

  // Open SSE stream for real-time push
  const openStream = useCallback((userId) => {
    // Close any existing connection first
    if (esRef.current) {
      esRef.current.close();
      esRef.current = null;
    }

    const es = new EventSource(`${apiBaseUrl}/api/notifications/${userId}/stream`);

    es.onopen = () => {
      console.log('[SSE] Connected for user:', userId);
    };

    es.onmessage = (event) => {
      try {
        const raw = JSON.parse(event.data);
        // Skip the connection-confirmation event
        if (raw.type === 'CONNECTED') return;
        const enriched = enrichNotification(raw);
        setNotifications((prev) => {
          // Avoid duplicates
          if (prev.some((n) => n.id === enriched.id)) return prev;
          return [enriched, ...prev];
        });
        // Show toast so user sees the notification in real-time
        setToasts((prev) => [
          ...prev,
          {
            id: Date.now() + Math.random(),
            title: enriched.title,
            description: enriched.time,
            type: 'info',
            duration: 5000,
          },
        ]);
      } catch (e) {
        console.error('[SSE] Parse error:', e);
      }
    };

    es.onerror = (err) => {
      console.warn('[SSE] Connection error, browser will auto-reconnect:', err);
    };

    esRef.current = es;
  }, []);

  useEffect(() => {
    const userId = user?.id || user?._id;
    if (!userId) {
      setNotifications([]);
      setUnreadCount(0);
      if (esRef.current) {
        esRef.current.close();
        esRef.current = null;
      }
      return;
    }

    fetchNotifications(userId);
    openStream(userId);

    return () => {
      if (esRef.current) {
        esRef.current.close();
        esRef.current = null;
      }
    };
  }, [user?.id, user?._id]); // only re-run when the actual user ID changes

  // Keep unread count in sync
  useEffect(() => {
    setUnreadCount(notifications.filter((n) => !n.read).length);
  }, [notifications]);

  // Mark a single notification as read
  const markAsRead = async (notificationId) => {
    try {
      await fetch(`${apiBaseUrl}/api/notifications/${notificationId}/read`, { method: 'PATCH' });
      setNotifications((prev) => prev.map((n) => n.id === notificationId ? { ...n, read: true } : n));
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    const userId = user?.id || user?._id;
    if (!userId) return;
    try {
      await fetch(`${apiBaseUrl}/api/notifications/${userId}/read-all`, { method: 'PATCH' });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  };

  // Remove a notification
  const removeNotification = async (notificationId) => {
    try {
      await fetch(`${apiBaseUrl}/api/notifications/${notificationId}`, { method: 'DELETE' });
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
    } catch (err) {
      console.error('Error removing notification:', err);
    }
  };

  // Legacy stubs kept for backward compatibility
  const addApplicationNotification = () => {};
  const addAcceptanceNotification = () => {};
  const addRejectionNotification = () => {};

  const value = {
    notifications,
    unreadCount,
    fetchNotifications,
    addApplicationNotification,
    addAcceptanceNotification,
    addRejectionNotification,
    markAsRead,
    markAllAsRead,
    removeNotification,
    showToast,
    toasts,
    dismissToast,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </NotificationContext.Provider>
  );
};
