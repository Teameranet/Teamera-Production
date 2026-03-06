import { createContext, useContext, useState, useEffect } from 'react';
import { Users, CheckCircle, XCircle } from 'lucide-react';
import { useAuth } from './AuthContext';

const NotificationContext = createContext();

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
};

export const NotificationProvider = ({ children }) => {
    // Store notifications by userId
    const [userNotifications, setUserNotifications] = useState({});
    const [unreadCount, setUnreadCount] = useState(0);
    const { user } = useAuth();

    // Initialize with some sample notifications for demo
    useEffect(() => {
        const initialNotifications = {
            '1': [ // User-1 (demo user)
                {
                    id: 1,
                    type: 'application',
                    icon: <Users size={16} />,
                    title: 'New application received for EcoTrack project',
                    time: '2 hours ago',
                    color: '#10b981',
                    read: false,
                    projectName: 'EcoTrack',
                    applicantName: 'John Smith',
                    navigationPath: '/dashboard',
                    navigationState: { tab: 'applications', subTab: 'received' }
                },
              
            ]
        };

        setUserNotifications(initialNotifications);
    }, []);

    // Get notifications for current user
    const getNotificationsForUser = (userId) => {
        return userNotifications[userId] || [];
    };

    // Update unread count for current user
    const updateUnreadCount = (userId) => {
        const notifications = getNotificationsForUser(userId);
        setUnreadCount(notifications.filter(n => !n.read).length);
    };

    // Update unread count when user changes
    useEffect(() => {
        if (user?.id) {
            updateUnreadCount(user.id);
        } else {
            setUnreadCount(0);
        }
    }, [user, userNotifications]);

    // Add new application notification (for specific project owner)
    const addApplicationNotification = (projectOwnerId, projectName, applicantName) => {
        console.log(`Adding application notification for user ${projectOwnerId}: ${applicantName} applied to ${projectName}`);
        
        const newNotification = {
            id: Date.now(),
            type: 'application',
            icon: <Users size={16} />,
            title: `New application received for '${projectName}' project`,
            time: 'Just now',
            color: '#10b981',
            read: false,
            projectName,
            applicantName,
            navigationPath: '/dashboard',
            navigationState: { tab: 'applications', subTab: 'received' }
        };

        setUserNotifications(prev => {
            const updated = {
                ...prev,
                [projectOwnerId]: [newNotification, ...(prev[projectOwnerId] || [])]
            };
            console.log(`Updated notifications for user ${projectOwnerId}:`, updated[projectOwnerId]);
            return updated;
        });
    };

    // Add acceptance notification (for specific applicant)
    const addAcceptanceNotification = (applicantId, projectName, position) => {
        const newNotification = {
            id: Date.now(),
            type: 'acceptance',
            icon: <CheckCircle size={16} />,
            title: `You had '${projectName} & ${position}' successfully accepted`,
            time: 'Just now',
            color: '#10b981',
            read: false,
            projectName,
            position,
            navigationPath: '/dashboard',
            navigationState: { tab: 'applications', subTab: 'sent' }
        };

        setUserNotifications(prev => ({
            ...prev,
            [applicantId]: [newNotification, ...(prev[applicantId] || [])]
        }));
    };

    // Add rejection notification (for specific applicant)
    const addRejectionNotification = (applicantId, projectName, position) => {
        const newNotification = {
            id: Date.now(),
            type: 'rejection',
            icon: <XCircle size={16} />,
            title: `Your application for '${projectName} & ${position}' was not accepted`,
            time: 'Just now',
            color: '#ef4444',
            read: false,
            projectName,
            position,
            navigationPath: '/dashboard',
            navigationState: { tab: 'applications', subTab: 'sent' }
        };

        setUserNotifications(prev => ({
            ...prev,
            [applicantId]: [newNotification, ...(prev[applicantId] || [])]
        }));
    };

    // Mark notification as read for current user
    const markAsRead = (notificationId) => {
        if (!user?.id) return;

        setUserNotifications(prev => ({
            ...prev,
            [user.id]: (prev[user.id] || []).map(notification =>
                notification.id === notificationId
                    ? { ...notification, read: true }
                    : notification
            )
        }));
    };

    // Mark all notifications as read for current user
    const markAllAsRead = () => {
        if (!user?.id) return;

        setUserNotifications(prev => ({
            ...prev,
            [user.id]: (prev[user.id] || []).map(notification => ({ ...notification, read: true }))
        }));
    };

    // Remove notification for current user
    const removeNotification = (notificationId) => {
        if (!user?.id) return;

        setUserNotifications(prev => ({
            ...prev,
            [user.id]: (prev[user.id] || []).filter(notification => notification.id !== notificationId)
        }));
    };

    // Get current user's notifications
    const notifications = user?.id ? getNotificationsForUser(user.id) : [];

    const value = {
        notifications,
        unreadCount,
        addApplicationNotification,
        addAcceptanceNotification,
        addRejectionNotification,
        markAsRead,
        markAllAsRead,
        removeNotification
    };

    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    );
};