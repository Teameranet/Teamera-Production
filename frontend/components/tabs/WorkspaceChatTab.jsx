import { useState, useEffect, useRef, useCallback } from 'react';
import { Send, Paperclip, Smile, Reply, Trash2, MessageCircle, X, Download, Loader2 } from 'lucide-react';
import UserAvatar from '../UserAvatar';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../utils/api';
import './WorkspaceTabs.css';

const EMOJIS = ['😀','😂','😍','🥰','😎','🤔','👍','👎','❤️','🔥','🎉','✅','😢','😡','🙏','💯','🚀','⭐','💡','🎯'];

function WorkspaceChatTab({ project }) {
  const { user } = useAuth();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [replyTo, setReplyTo] = useState(null);
  const [showEmoji, setShowEmoji] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);

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
            if (prev.some(m => !String(m._id).startsWith('temp_') && String(m._id) === realId)) return prev;
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

    es.onerror = () => {};

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

  // ── Send text message ──────────────────────────────────────────────
  const handleSend = async (e) => {
    e.preventDefault();
    if (!message.trim() || !user || !projectId || sending) return;

    const content = message.trim();
    setMessage('');
    setReplyTo(null);
    setShowEmoji(false);
    if (inputRef.current) inputRef.current.style.height = 'auto';

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

  // ── Delete message (sender only) ───────────────────────────────────
  const handleDelete = async (msgId) => {
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

  // ── File upload — real backend upload ─────────────────────────────
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file || !user || !projectId) return;

    // Optimistic placeholder while uploading
    const tempId = `temp_file_${Date.now()}`;
    const optimistic = {
      _id: tempId,
      projectId,
      senderId: currentUserId,
      senderName: user.name || 'Anonymous',
      senderAvatar: user.avatar || null,
      content: file.name,
      type: 'file',
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      fileUrl: null,
      replyTo: replyTo ? replyTo._id || replyTo.id : null,
      _replyToMsg: replyTo,
      createdAt: new Date().toISOString(),
      _uploading: true,
    };
    setMessages(prev => [...prev, optimistic]);
    setReplyTo(null);
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('senderId', currentUserId);
      formData.append('senderName', user.name || 'Anonymous');
      if (user.avatar) formData.append('senderAvatar', user.avatar);
      if (optimistic.replyTo) formData.append('replyTo', optimistic.replyTo);

      const res = await fetch(`${API_BASE_URL}/api/messages/${projectId}/upload`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        // Replace optimistic with real message (SSE will also broadcast, dedup handled)
        setMessages(prev => prev.map(m => m._id === tempId ? { ...data.data, _replyToMsg: optimistic._replyToMsg } : m));
      } else {
        setMessages(prev => prev.filter(m => m._id !== tempId));
      }
    } catch (err) {
      console.error('[Chat] File upload failed:', err);
      setMessages(prev => prev.filter(m => m._id !== tempId));
    } finally {
      setUploading(false);
    }
  };

  // ── Download file ──────────────────────────────────────────────────
  const handleDownload = (msg) => {
    if (!msg.fileUrl) return;
    const a = document.createElement('a');
    a.href = msg.fileUrl;
    a.download = msg.fileName || msg.content;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
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

  const handleTextareaChange = (e) => {
    setMessage(e.target.value);
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
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

  // ── Empty state ────────────────────────────────────────────────────
  if (!project) {
    return (
      <div className="wt-empty-state">
        <MessageCircle size={48} className="wt-empty-icon" />
        <h3>Select a project to start chatting</h3>
        <p>Choose a project from the dropdown above to access team chat.</p>
      </div>
    );
  }

  return (
    <div className="wt-chat">
      <div className="wt-chat-messages">
        {loading ? (
          <div className="wt-empty-state">
            <Loader2 size={32} className="wt-empty-icon wt-spin" />
            <p>Loading messages…</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="wt-empty-state">
            <MessageCircle size={48} className="wt-empty-icon" />
            <h3>No messages yet</h3>
            <p>Be the first to say something to your team.</p>
          </div>
        ) : (
          Object.entries(grouped).map(([date, msgs]) => (
            <div key={date}>
              <div className="wt-date-divider"><span>{date}</span></div>
              {msgs.map(msg => {
                const isOwn = String(msg.senderId) === String(currentUserId);
                const isTemp = String(msg._id).startsWith('temp_');
                const isUploading = msg._uploading;
                const canDownload = msg.type === 'file' && !!msg.fileUrl;
                const replyPreview = getReplyPreview(msg);

                return (
                  <div key={msg._id} className={`wt-message ${isOwn ? 'wt-message--own' : ''} ${isTemp ? 'wt-message--sending' : ''}`}>
                    {!isOwn && (
                      <div className="wt-message-avatar">
                        <UserAvatar user={{ name: msg.senderName, avatar: msg.senderAvatar }} size="small" />
                      </div>
                    )}
                    <div className="wt-message-body">
                      <div className="wt-message-meta">
                        <span className="wt-message-name">{isOwn ? 'You' : msg.senderName}</span>
                        <span className="wt-message-ts">{formatTime(msg.createdAt || msg.timestamp)}</span>
                        {isTemp && <span className="wt-message-status">{isUploading ? 'Uploading…' : 'Sending…'}</span>}
                      </div>

                      {replyPreview && (
                        <div className="wt-reply-preview">
                          <span className="wt-reply-author">{replyPreview.senderName || replyPreview.user}</span>
                          <span className="wt-reply-text">{replyPreview.content || replyPreview.text || replyPreview.fileName}</span>
                        </div>
                      )}

                      {msg.type === 'file' ? (
                        <div
                          className={`wt-file-card ${!canDownload ? 'wt-file-card--uploading' : ''}`}
                          onClick={() => canDownload && handleDownload(msg)}
                          title={canDownload ? 'Click to download' : 'Uploading…'}
                          style={{ cursor: canDownload ? 'pointer' : 'default' }}
                        >
                          <div className="wt-file-card-icon">
                            <div className="wt-file-card-page" />
                            <span className="wt-file-card-ext">{getFileExt(msg.fileName || msg.content)}</span>
                          </div>
                          <div className="wt-file-card-info">
                            <span className="wt-file-card-name">{msg.fileName || msg.content}</span>
                            <span className="wt-file-card-size">
                              {formatFileSize(msg.fileSize)}
                              {isUploading && <span className="wt-file-expired-label"> · uploading…</span>}
                            </span>
                          </div>
                          {canDownload
                            ? <Download size={16} className="wt-file-card-dl" />
                            : <Loader2 size={16} className="wt-file-card-dl wt-spin" />
                          }
                        </div>
                      ) : (
                        <div className="wt-message-bubble">
                          <p style={{ whiteSpace: 'pre-wrap' }}>{msg.content || msg.text}</p>
                        </div>
                      )}

                      <div className="wt-message-actions">
                        <button
                          className="wt-msg-action-btn"
                          onClick={() => { setReplyTo(msg); inputRef.current?.focus(); }}
                          title="Reply"
                        >
                          <Reply size={13} /> Reply
                        </button>
                        {isOwn && !isTemp && (
                          <button
                            className="wt-msg-action-btn wt-msg-action-btn--danger"
                            onClick={() => handleDelete(msg._id)}
                            title="Delete"
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
        <div className="wt-reply-bar">
          <Reply size={16} className="wt-reply-bar-icon" />
          <div className="wt-reply-bar-content">
            <span className="wt-reply-bar-name">{replyTo.senderName || replyTo.user}</span>
            <span className="wt-reply-bar-text">{replyTo.content || replyTo.text || replyTo.fileName}</span>
          </div>
          <button className="wt-reply-bar-close" onClick={() => setReplyTo(null)}>
            <X size={16} />
          </button>
        </div>
      )}

      <form className="wt-chat-input" onSubmit={handleSend}>
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
        <button
          type="button"
          className="wt-input-icon-btn"
          title="Attach file"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? <Loader2 size={18} className="wt-spin" /> : <Paperclip size={18} />}
        </button>
        <textarea
          ref={inputRef}
          rows={1}
          placeholder="Type a message… (Shift+Enter for new line)"
          value={message}
          onChange={handleTextareaChange}
          onKeyDown={handleKeyDown}
          className="wt-chat-textarea"
        />
        <div className="wt-emoji-wrapper" ref={emojiRef}>
          <button type="button" className="wt-input-icon-btn" title="Emoji" onClick={() => setShowEmoji(v => !v)}>
            <Smile size={18} />
          </button>
          {showEmoji && (
            <div className="wt-emoji-picker">
              {EMOJIS.map(e => (
                <button key={e} type="button" className="wt-emoji-btn" onClick={() => handleEmojiClick(e)}>{e}</button>
              ))}
            </div>
          )}
        </div>
        <button type="submit" className="wt-send-btn" disabled={!message.trim() || sending}>
          {sending ? <Loader2 size={18} className="wt-spin" /> : <Send size={18} />}
        </button>
      </form>
    </div>
  );
}

export default WorkspaceChatTab;
