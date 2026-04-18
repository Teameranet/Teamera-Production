import { useState, useEffect, useRef, useCallback } from 'react';
import { Send, Paperclip, Smile, Reply, Trash2, MessageCircle, X, Download, Loader2 } from 'lucide-react';
import UserAvatar from '../UserAvatar';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../utils/api';
import './Tabs.css';

const EMOJIS = ['😀','😂','😍','🥰','😎','🤔','👍','👎','❤️','🔥','🎉','✅','😢','😡','🙏','💯','🚀','⭐','💡','🎯'];

// In-memory blob store for file attachments (session-only)
const fileBlobStore = new Map();

function ChatTab({ project }) {
  const { user } = useAuth();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [replyTo, setReplyTo] = useState(null);
  const [showEmoji, setShowEmoji] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const emojiRef = useRef(null);
  const eventSourceRef = useRef(null);

  const projectId = project?.id || project?._id;
  const currentUserId = user?.id || user?._id;

  // ── Fetch message history ──────────────────────────────────────────
  const fetchMessages = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/messages/${projectId}`);
      const data = await res.json();
      if (data.success) setMessages(data.data);
    } catch (err) {
      console.error('[Chat] Failed to fetch messages:', err);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  // ── SSE real-time stream ───────────────────────────────────────────
  useEffect(() => {
    if (!projectId) return;

    fetchMessages();

    if (eventSourceRef.current) eventSourceRef.current.close();

    const es = new EventSource(`${API_BASE_URL}/api/messages/${projectId}/stream`);
    eventSourceRef.current = es;

    es.onmessage = (e) => {
      try {
        const payload = JSON.parse(e.data);
        if (payload.type === 'NEW_MESSAGE') {
          setMessages(prev => {
            const realId = String(payload.message._id);
            // Already present as a confirmed message — skip
            if (prev.some(m => !String(m._id).startsWith('temp_') && String(m._id) === realId)) {
              return prev;
            }
            // Replace any pending optimistic temp message
            const hasTemp = prev.some(m => String(m._id).startsWith('temp_'));
            if (hasTemp) {
              let replaced = false;
              return prev.map(m => {
                if (!replaced && String(m._id).startsWith('temp_')) {
                  replaced = true;
                  return { ...payload.message, _replyToMsg: m._replyToMsg };
                }
                return m;
              });
            }
            return [...prev, payload.message];
          });
        } else if (payload.type === 'DELETE_MESSAGE') {
          setMessages(prev => prev.filter(m => String(m._id) !== String(payload.messageId)));
        }
      } catch (_) {}
    };

    return () => {
      es.close();
      eventSourceRef.current = null;
    };
  }, [projectId]);

  // ── Auto-scroll ────────────────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Close emoji picker on outside click ───────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (emojiRef.current && !emojiRef.current.contains(e.target)) setShowEmoji(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── Revoke blob URLs on unmount ────────────────────────────────────
  useEffect(() => {
    return () => {
      fileBlobStore.forEach(url => URL.revokeObjectURL(url));
      fileBlobStore.clear();
    };
  }, []);

  // ── Send text message ──────────────────────────────────────────────
  const handleSend = async (e) => {
    e.preventDefault();
    if (!message.trim() || !user || !projectId || sending) return;

    const content = message.trim();
    setMessage('');
    setReplyTo(null);
    setShowEmoji(false);

    const tempId = `temp_${Date.now()}`;
    const optimistic = {
      _id: tempId,
      projectId,
      senderId: currentUserId,
      senderName: user.name || 'Anonymous',
      senderAvatar: user.avatar || null,
      content,
      type: 'text',
      replyTo: replyTo ? replyTo._id || replyTo.id : null,
      _replyToMsg: replyTo,
      createdAt: new Date().toISOString(),
    };
    setMessages(prev => [...prev, optimistic]);

    setSending(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/messages/${projectId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: currentUserId,
          senderName: user.name || 'Anonymous',
          senderAvatar: user.avatar || null,
          content,
          type: 'text',
          replyTo: replyTo ? replyTo._id || replyTo.id : null,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setMessages(prev => prev.map(m => m._id === tempId ? { ...data.data, _replyToMsg: replyTo } : m));
      } else {
        setMessages(prev => prev.filter(m => m._id !== tempId));
      }
    } catch (err) {
      console.error('[Chat] Send failed:', err);
      setMessages(prev => prev.filter(m => m._id !== tempId));
    } finally {
      setSending(false);
    }
  };

  // ── Delete message ─────────────────────────────────────────────────
  const handleDelete = async (msgId) => {
    if (fileBlobStore.has(msgId)) {
      URL.revokeObjectURL(fileBlobStore.get(msgId));
      fileBlobStore.delete(msgId);
    }
    setMessages(prev => prev.filter(m => String(m._id) !== String(msgId)));
    try {
      await fetch(`${API_BASE_URL}/api/messages/${msgId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUserId }),
      });
    } catch (err) {
      console.error('[Chat] Delete failed:', err);
      fetchMessages();
    }
  };

  // ── File attachment (session-only) ─────────────────────────────────
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file || !user) return;
    const msgId = `file_${Date.now()}`;
    const objectURL = URL.createObjectURL(file);
    fileBlobStore.set(msgId, objectURL);
    const fileMsg = {
      _id: msgId,
      projectId,
      senderId: currentUserId,
      senderName: user.name || 'Anonymous',
      content: file.name,
      type: 'file',
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      replyTo: replyTo ? replyTo._id || replyTo.id : null,
      _replyToMsg: replyTo,
      createdAt: new Date().toISOString(),
      _localOnly: true,
    };
    setMessages(prev => [...prev, fileMsg]);
    setReplyTo(null);
    e.target.value = '';
  };

  const handleDownload = (msg) => {
    const url = fileBlobStore.get(msg._id);
    if (!url) return;
    const a = document.createElement('a');
    a.href = url;
    a.download = msg.fileName || msg.content;
    a.click();
  };

  const handleEmojiClick = (emoji) => {
    setMessage(prev => prev + emoji);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(e);
    }
  };

  // ── Helpers ────────────────────────────────────────────────────────
  const formatTime = (iso) => new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };
  const getFileExt = (name) => {
    const parts = name?.split('.');
    return parts && parts.length > 1 ? parts.pop().toUpperCase().slice(0, 4) : 'FILE';
  };
  const formatDate = (iso) => {
    const d = new Date(iso);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    if (d.toDateString() === today.toDateString()) return 'Today';
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const getReplyPreview = (msg) => {
    if (!msg.replyTo) return null;
    if (msg._replyToMsg) return msg._replyToMsg;
    return messages.find(m => String(m._id) === String(msg.replyTo)) || null;
  };

  const grouped = messages.reduce((acc, msg) => {
    const label = formatDate(msg.createdAt || msg.timestamp);
    if (!acc[label]) acc[label] = [];
    acc[label].push(msg);
    return acc;
  }, {});

  return (
    <div className="chat-section">
      <div className="chat-messages scrollable">
        {loading ? (
          <div className="empty-chat-state">
            <Loader2 size={32} className="empty-icon chat-spin" />
            <p>Loading messages…</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="empty-chat-state">
            <MessageCircle size={48} className="empty-icon" />
            <h3>No messages yet</h3>
            <p>Start the conversation by sending your first message</p>
          </div>
        ) : (
          Object.entries(grouped).map(([date, msgs]) => (
            <div key={date}>
              <div className="chat-date-divider"><span>{date}</span></div>
              {msgs.map(msg => {
                const isOwn = String(msg.senderId) === String(currentUserId);
                const canDownload = msg.type === 'file' && fileBlobStore.has(msg._id);
                const replyPreview = getReplyPreview(msg);
                const isTemp = String(msg._id).startsWith('temp_');

                return (
                  <div key={msg._id} className={`chat-msg-row ${isOwn ? 'chat-msg-row--own' : ''} ${isTemp ? 'chat-msg-sending' : ''}`}>
                    {!isOwn && (
                      <div className="chat-msg-avatar">
                        <UserAvatar user={{ name: msg.senderName, avatar: msg.senderAvatar }} size="small" />
                      </div>
                    )}
                    <div className="chat-msg-body">
                      <div className="chat-msg-meta">
                        <span className="chat-msg-name">{isOwn ? 'You' : msg.senderName}</span>
                        <span className="chat-msg-time">{formatTime(msg.createdAt || msg.timestamp)}</span>
                        {isTemp && <span className="chat-msg-sending-label">Sending…</span>}
                      </div>

                      {replyPreview && (
                        <div className="chat-reply-preview">
                          <span className="chat-reply-author">{replyPreview.senderName || replyPreview.user}</span>
                          <span className="chat-reply-text">{replyPreview.content || replyPreview.text || replyPreview.fileName}</span>
                        </div>
                      )}

                      {msg.type === 'file' ? (
                        <div
                          className={`chat-file-card ${isOwn ? 'chat-file-card--own' : ''} ${!canDownload ? 'chat-file-card--expired' : ''}`}
                          onClick={() => canDownload && handleDownload(msg)}
                          title={canDownload ? 'Click to download' : 'File only available in the session it was sent'}
                        >
                          <div className="chat-file-card-icon">
                            <div className="chat-file-card-page" />
                            <span className="chat-file-card-ext">{getFileExt(msg.fileName || msg.content)}</span>
                          </div>
                          <div className="chat-file-card-info">
                            <span className="chat-file-card-name">{msg.fileName || msg.content}</span>
                            <span className="chat-file-card-size">
                              {formatFileSize(msg.fileSize)}
                              {!canDownload && <span className="chat-file-expired-label"> · session ended</span>}
                            </span>
                          </div>
                          <Download size={16} className={`chat-file-card-dl ${!canDownload ? 'chat-file-card-dl--disabled' : ''}`} />
                        </div>
                      ) : (
                        <div className={`chat-bubble ${isOwn ? 'chat-bubble--own' : ''}`}>
                          <p style={{ whiteSpace: 'pre-wrap' }}>{msg.content || msg.text}</p>
                        </div>
                      )}

                      <div className="chat-msg-actions">
                        <button
                          className="chat-action-btn"
                          onClick={() => { setReplyTo(msg); inputRef.current?.focus(); }}
                        >
                          <Reply size={13} /> Reply
                        </button>
                        {isOwn && !isTemp && (
                          <button
                            className="chat-action-btn chat-action-btn--danger"
                            onClick={() => handleDelete(msg._id)}
                          >
                            <Trash2 size={13} /> Delete
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {replyTo && (
        <div className="chat-reply-bar">
          <Reply size={16} className="chat-reply-bar-icon" />
          <div className="chat-reply-bar-content">
            <span className="chat-reply-bar-name">{replyTo.senderName || replyTo.user}</span>
            <span className="chat-reply-bar-text">{replyTo.content || replyTo.text || replyTo.fileName}</span>
          </div>
          <button className="chat-reply-bar-close" onClick={() => setReplyTo(null)}>
            <X size={16} />
          </button>
        </div>
      )}

      <form className="chat-input" onSubmit={handleSend}>
        <input type="file" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileChange} />
        <button type="button" className="attach-btn" title="Attach file" onClick={() => fileInputRef.current?.click()}>
          <Paperclip size={20} />
        </button>
        <input
          ref={inputRef}
          type="text"
          placeholder="Type a message…"
          value={message}
          onChange={e => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <div className="chat-emoji-wrapper" ref={emojiRef}>
          <button type="button" className="attach-btn" title="Emoji" onClick={() => setShowEmoji(v => !v)}>
            <Smile size={20} />
          </button>
          {showEmoji && (
            <div className="chat-emoji-picker">
              {EMOJIS.map(e => (
                <button key={e} type="button" className="chat-emoji-btn" onClick={() => handleEmojiClick(e)}>{e}</button>
              ))}
            </div>
          )}
        </div>
        <button type="submit" className="send-btn" disabled={!message.trim() || sending}>
          {sending ? <Loader2 size={20} className="chat-spin" /> : <Send size={20} />}
        </button>
      </form>
    </div>
  );
}

export default ChatTab;
