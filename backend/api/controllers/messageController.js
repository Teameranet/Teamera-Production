import Message from '../../models/Message.js';
import Project from '../../models/Project.js';
import { addChatClient, removeChatClient, broadcastToProject } from '../../utils/chatSseClients.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ── SSE stream ────────────────────────────────────────────────────────────────
export const streamMessages = (req, res) => {
  const { projectId } = req.params;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  res.write(`data: ${JSON.stringify({ type: 'CONNECTED', projectId })}\n\n`);

  const heartbeat = setInterval(() => {
    try { res.write(': heartbeat\n\n'); } catch (_) {}
  }, 25000);

  addChatClient(projectId, res);

  req.on('close', () => {
    clearInterval(heartbeat);
    removeChatClient(projectId, res);
  });
};

// ── GET /api/messages/:projectId ──────────────────────────────────────────────
export const getMessages = async (req, res) => {
  try {
    const { projectId } = req.params;
    const limit = parseInt(req.query.limit) || 100;
    const before = req.query.before;

    const query = { projectId, isDeleted: false };
    if (before) query.createdAt = { $lt: new Date(before) };

    const messages = await Message.find(query)
      .sort({ createdAt: 1 })
      .limit(limit)
      .lean();

    res.json({ success: true, data: messages });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── POST /api/messages/:projectId — send a text message ──────────────────────
export const sendMessage = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { senderId, senderName, senderAvatar, content, type = 'text', replyTo } = req.body;

    if (!senderId || !senderName || !content?.trim()) {
      return res.status(400).json({ success: false, message: 'senderId, senderName, and content are required' });
    }

    const project = await Project.findById(projectId).lean();
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

    const message = await Message.create({
      projectId,
      senderId,
      senderName,
      senderAvatar: senderAvatar || null,
      content: content.trim(),
      type,
      replyTo: replyTo || null,
    });

    const msgObj = message.toObject();
    broadcastToProject(projectId, { type: 'NEW_MESSAGE', message: msgObj });
    res.status(201).json({ success: true, data: msgObj });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── POST /api/messages/:projectId/upload — send a file message ───────────────
export const uploadFile = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { senderId, senderName, senderAvatar, replyTo } = req.body;

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file provided' });
    }
    if (!senderId || !senderName) {
      return res.status(400).json({ success: false, message: 'senderId and senderName are required' });
    }

    const project = await Project.findById(projectId).lean();
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

    // Build a publicly accessible URL for the file
    const protocol = req.protocol;
    const host = req.get('host');
    const fileUrl = `${protocol}://${host}/uploads/${req.file.filename}`;

    const message = await Message.create({
      projectId,
      senderId,
      senderName,
      senderAvatar: senderAvatar || null,
      content: req.file.originalname,   // content = original filename for display
      type: 'file',
      fileUrl,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      fileType: req.file.mimetype,
      replyTo: replyTo || null,
    });

    const msgObj = message.toObject();
    broadcastToProject(projectId, { type: 'NEW_MESSAGE', message: msgObj });
    res.status(201).json({ success: true, data: msgObj });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── DELETE /api/messages/:messageId — soft delete (sender only) ───────────────
export const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { userId } = req.body;

    const message = await Message.findById(messageId);
    if (!message) return res.status(404).json({ success: false, message: 'Message not found' });
    if (String(message.senderId) !== String(userId)) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this message' });
    }

    // Remove file from disk if it's a file message
    if (message.type === 'file' && message.fileUrl) {
      try {
        const filename = message.fileUrl.split('/uploads/').pop();
        if (filename) {
          const filePath = path.join(__dirname, '../../uploads', filename);
          if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        }
      } catch (fsErr) {
        console.error('[Delete] Could not remove file from disk:', fsErr.message);
      }
    }

    message.isDeleted = true;
    message.deletedAt = new Date();
    await message.save();

    broadcastToProject(message.projectId.toString(), { type: 'DELETE_MESSAGE', messageId });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
