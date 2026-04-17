import { useState, useEffect, useRef } from 'react';
import { Send, Paperclip, Smile, Reply, Trash2, MessageCircle, X, Download } from 'lucide-react';
import UserAvatar from '../UserAvatar';
import { useAuth } from '../../context/AuthContext';
import './WorkspaceTabs.css';

const EMOJIS = ['😀','😂','😍','🥰','😎','🤔','👍','👎','❤️','🔥','🎉','✅','😢','😡','🙏','💯','🚀','⭐','💡','🎯'];

// In-memory blob store — avoids localStorage quota errors for file data
const fileBlobStore = new Map(); // msgId -> objectURL

function WorkspaceChatTab({ project }) {
  const { user } = useAuth();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [replyTo, setReplyTo] = useState(null);
  const [showEmoji, setShowEmoji] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const emojiRef = useRef(null);

  const storageKey = project ? `workspace_chat_${project.id || project._id}` : null;

  useEffect(() => {
    if (!storageKey) return;
    try {
      const stored = localStorage.getItem(storageKey);
      setMessages(stored ? JSON.parse(stored) : []);
    } catch {
      setMessages([]);
    }
  }, [storageKey]);

  // Save only metadata (no fileData) to localStorage
  useEffect(() => {
    if (!storageKey) return;
    try {
      const safe = messages.map(m => {
        const { fileData, ...rest } = m; // strip blob data
        return rest;
      });
      localStorage.setItem(storageKey, JSON.stringify(safe));
    } catch (err) {
      console.warn('Chat: localStorage save failed', err.message);
    }
  }, [messages, storageKey]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const handler = (e) => {
      if (emojiRef.current && !emojiRef.current.contains(e.target)) {
        setShowEmoji(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Revoke object URLs on unmount to free memory
  useEffect(() => {
    return () => {
      fileBlobStore.forEach(url => URL.revokeObjectURL(url));
      fileBlobStore.clear();
    };
  }, []);

  const currentUserId = user?.id || user?._id;

  const handleSend = (e) => {
    e.preventDefault();
    if (!message.trim() || !user) return;

    const newMsg = {
      id: Date.now(),
      userId: currentUserId,
      user: user.name || 'Anonymous',
      text: message.trim(),
      timestamp: new Date().toISOString(),
      replyTo: replyTo ? { id: replyTo.id, user: replyTo.user, text: replyTo.text || replyTo.fileName } : null,
      type: 'text',
    };

    setMessages(prev => [...prev, newMsg]);
    setMessage('');
    setReplyTo(null);
    setShowEmoji(false);
    // Reset textarea height back to one row
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file || !user) return;

    const msgId = Date.now();
    // Store object URL in memory only — never in localStorage
    const objectURL = URL.createObjectURL(file);
    fileBlobStore.set(msgId, objectURL);

    const newMsg = {
      id: msgId,
      userId: currentUserId,
      user: user.name || 'Anonymous',
      timestamp: new Date().toISOString(),
      replyTo: replyTo ? { id: replyTo.id, user: replyTo.user, text: replyTo.text || replyTo.fileName } : null,
      type: 'file',
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      // fileData intentionally omitted — use fileBlobStore instead
    };

    setMessages(prev => [...prev, newMsg]);
    setReplyTo(null);
    e.target.value = '';
  };

  const handleDownload = (msg) => {
    const url = fileBlobStore.get(msg.id);
    if (!url) return; // file not available after page reload
    const a = document.createElement('a');
    a.href = url;
    a.download = msg.fileName;
    a.click();
  };

  const handleDelete = (msgId) => {
    // Revoke object URL if it exists
    if (fileBlobStore.has(msgId)) {
      URL.revokeObjectURL(fileBlobStore.get(msgId));
      fileBlobStore.delete(msgId);
    }
    setMessages(prev => prev.filter(m => m.id !== msgId));
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
    // Shift+Enter falls through — browser inserts \n naturally into the textarea
  };

  const handleTextareaChange = (e) => {
    setMessage(e.target.value);
    // Auto-expand: reset to auto first so shrinking works too
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
  };

  const formatTime = (iso) => new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const formatFileSize = (bytes) => {
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

  const grouped = messages.reduce((acc, msg) => {
    const label = formatDate(msg.timestamp);
    if (!acc[label]) acc[label] = [];
    acc[label].push(msg);
    return acc;
  }, {});

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
        {messages.length === 0 ? (
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
                const isOwn = String(msg.userId) === String(currentUserId);
                const canDownload = msg.type === 'file' && fileBlobStore.has(msg.id);
                return (
                  <div key={msg.id} className={`wt-message ${isOwn ? 'wt-message--own' : ''}`}>
                    {!isOwn && (
                      <div className="wt-message-avatar">
                        <UserAvatar user={{ name: msg.user }} size="small" />
                      </div>
                    )}
                    <div className="wt-message-body">
                      <div className="wt-message-meta">
                        <span className="wt-message-name">{isOwn ? 'You' : msg.user}</span>
                        <span className="wt-message-ts">{formatTime(msg.timestamp)}</span>
                      </div>

                      {msg.replyTo && (
                        <div className="wt-reply-preview">
                          <span className="wt-reply-author">{msg.replyTo.user}</span>
                          <span className="wt-reply-text">{msg.replyTo.text}</span>
                        </div>
                      )}

                      {msg.type === 'file' ? (
                        <div
                          className={`wt-file-card ${!canDownload ? 'wt-file-card--expired' : ''}`}
                          onClick={() => canDownload && handleDownload(msg)}
                          title={canDownload ? 'Click to download' : 'File only available in the session it was sent'}
                        >
                          <div className="wt-file-card-icon">
                            <div className="wt-file-card-page" />
                            <span className="wt-file-card-ext">{getFileExt(msg.fileName)}</span>
                          </div>
                          <div className="wt-file-card-info">
                            <span className="wt-file-card-name">{msg.fileName}</span>
                            <span className="wt-file-card-size">
                              {formatFileSize(msg.fileSize)}
                              {!canDownload && <span className="wt-file-expired-label"> · session ended</span>}
                            </span>
                          </div>
                          <Download size={16} className={`wt-file-card-dl ${!canDownload ? 'wt-file-card-dl--disabled' : ''}`} />
                        </div>
                      ) : (
                        <div className="wt-message-bubble">
                          <p style={{ whiteSpace: 'pre-wrap' }}>{msg.text}</p>
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
                        {isOwn && (
                          <button
                            className="wt-msg-action-btn wt-msg-action-btn--danger"
                            onClick={() => handleDelete(msg.id)}
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
            <span className="wt-reply-bar-name">{replyTo.user}</span>
            <span className="wt-reply-bar-text">{replyTo.text || replyTo.fileName}</span>
          </div>
          <button className="wt-reply-bar-close" onClick={() => setReplyTo(null)}>
            <X size={16} />
          </button>
        </div>
      )}

      <form className="wt-chat-input" onSubmit={handleSend}>
        <input type="file" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileChange} />
        <button type="button" className="wt-input-icon-btn" title="Attach file" onClick={() => fileInputRef.current?.click()}>
          <Paperclip size={18} />
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
        <button type="submit" className="wt-send-btn" disabled={!message.trim()}>
          <Send size={18} />
        </button>
      </form>
    </div>
  );
}

export default WorkspaceChatTab;
