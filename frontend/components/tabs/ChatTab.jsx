import { useState, useEffect, useRef } from 'react';
import { Send, Paperclip, Smile, Reply, Trash2, MessageCircle, X, Download } from 'lucide-react';
import UserAvatar from '../UserAvatar';
import { useAuth } from '../../context/AuthContext';
import './Tabs.css';

const EMOJIS = ['😀','😂','😍','🥰','😎','🤔','👍','👎','❤️','🔥','🎉','✅','😢','😡','🙏','💯','🚀','⭐','💡','🎯'];

// In-memory blob store — avoids localStorage quota errors for file data
const fileBlobStore = new Map(); // msgId -> objectURL

function ChatTab({ project }) {
  const { user } = useAuth();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [replyTo, setReplyTo] = useState(null);
  const [showEmoji, setShowEmoji] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const emojiRef = useRef(null);

  const storageKey = project ? `chat_messages_${project.id || project._id}` : 'chat_messages_general';

  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      setMessages(stored ? JSON.parse(stored) : []);
    } catch {
      setMessages([]);
    }
  }, [storageKey]);

  // Save only metadata (no fileData) to localStorage
  useEffect(() => {
    try {
      const safe = messages.map(m => {
        const { fileData, ...rest } = m;
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
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file || !user) return;

    const msgId = Date.now();
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
    };

    setMessages(prev => [...prev, newMsg]);
    setReplyTo(null);
    e.target.value = '';
  };

  const handleDownload = (msg) => {
    const url = fileBlobStore.get(msg.id);
    if (!url) return;
    const a = document.createElement('a');
    a.href = url;
    a.download = msg.fileName;
    a.click();
  };

  const handleDelete = (msgId) => {
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

  return (
    <div className="chat-section">
      <div className="chat-messages scrollable">
        {messages.length === 0 ? (
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
                const isOwn = String(msg.userId) === String(currentUserId);
                const canDownload = msg.type === 'file' && fileBlobStore.has(msg.id);
                return (
                  <div key={msg.id} className={`chat-msg-row ${isOwn ? 'chat-msg-row--own' : ''}`}>
                    {!isOwn && (
                      <div className="chat-msg-avatar">
                        <UserAvatar user={{ name: msg.user }} size="small" />
                      </div>
                    )}
                    <div className="chat-msg-body">
                      <div className="chat-msg-meta">
                        <span className="chat-msg-name">{isOwn ? 'You' : msg.user}</span>
                        <span className="chat-msg-time">{formatTime(msg.timestamp)}</span>
                      </div>

                      {msg.replyTo && (
                        <div className="chat-reply-preview">
                          <span className="chat-reply-author">{msg.replyTo.user}</span>
                          <span className="chat-reply-text">{msg.replyTo.text}</span>
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
                            <span className="chat-file-card-ext">{getFileExt(msg.fileName)}</span>
                          </div>
                          <div className="chat-file-card-info">
                            <span className="chat-file-card-name">{msg.fileName}</span>
                            <span className="chat-file-card-size">
                              {formatFileSize(msg.fileSize)}
                              {!canDownload && <span className="chat-file-expired-label"> · session ended</span>}
                            </span>
                          </div>
                          <Download size={16} className={`chat-file-card-dl ${!canDownload ? 'chat-file-card-dl--disabled' : ''}`} />
                        </div>
                      ) : (
                        <div className={`chat-bubble ${isOwn ? 'chat-bubble--own' : ''}`}>
                          <p>{msg.text}</p>
                        </div>
                      )}

                      <div className="chat-msg-actions">
                        <button
                          className="chat-action-btn"
                          onClick={() => { setReplyTo(msg); inputRef.current?.focus(); }}
                        >
                          <Reply size={13} /> Reply
                        </button>
                        {isOwn && (
                          <button
                            className="chat-action-btn chat-action-btn--danger"
                            onClick={() => handleDelete(msg.id)}
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
            <span className="chat-reply-bar-name">{replyTo.user}</span>
            <span className="chat-reply-bar-text">{replyTo.text || replyTo.fileName}</span>
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
        <button type="submit" className="send-btn" disabled={!message.trim()}>
          <Send size={20} />
        </button>
      </form>
    </div>
  );
}

export default ChatTab;
