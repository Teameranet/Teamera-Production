import Notification from '../../models/Notification.js';
import { addClient, removeClient, pushToUser } from '../../utils/sseClients.js';

// SSE stream endpoint — client connects once and stays open
export const streamNotifications = (req, res) => {
  const { userId } = req.params;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // disable nginx buffering
  res.flushHeaders();

  // Confirm connection to client
  res.write(`data: ${JSON.stringify({ type: 'CONNECTED', userId })}\n\n`);

  // Heartbeat every 25s to keep the connection alive through proxies
  const heartbeat = setInterval(() => {
    try { res.write(': heartbeat\n\n'); } catch (_) {}
  }, 25000);

  addClient(userId, res);

  req.on('close', () => {
    clearInterval(heartbeat);
    removeClient(userId);
  });
};

// Get all notifications for a user
export const getNotifications = async (req, res) => {
  try {
    const { userId } = req.params;
    const notifications = await Notification.find({ recipientId: userId })
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({ success: true, data: notifications });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Mark a single notification as read
export const markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    await Notification.findByIdAndUpdate(notificationId, { read: true });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Mark all notifications as read for a user
export const markAllAsRead = async (req, res) => {
  try {
    const { userId } = req.params;
    await Notification.updateMany({ recipientId: userId, read: false }, { read: true });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete a notification
export const deleteNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;
    await Notification.findByIdAndDelete(notificationId);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Helper: create a notification and push it live to the recipient if connected
export const createNotification = async ({ recipientId, type, message, projectId, projectName, positionName, actorName, navigationPath, navigationState }) => {
  try {
    const notification = await Notification.create({
      recipientId,
      type,
      message,
      projectId,
      projectName,
      positionName,
      actorName,
      navigationPath: navigationPath || '/dashboard',
      navigationState: navigationState || null
    });

    // Push to connected SSE client immediately
    pushToUser(notification.recipientId.toString(), notification);

    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    return null;
  }
};
