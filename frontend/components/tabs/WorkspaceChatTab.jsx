import { useState, useEffect, useRef } from 'react';
import { Send, Paperclip, Smile, Reply, Trash2, MessageCircle, X } from 'lucide-react';
import UserAvatar from '../UserAvatar';
import { useAuth } from '../../context/AuthContext';
import './WorkspaceTabs.css';

function WorkspaceChatTab({ project }) {
  const { user } = useAuth();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [replyTo, setReplyTo] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const storageKey = project ? `workspace_chat_${project.id || project._id}` : null;

  useEffect(() => {
    if (!storageKey) return;
    const stored = localStorage.getItem(storageKey);
    setMessages(stored ? JSON.parse(stored) : []);
  }, [storageKey]);

  useEffect(() => {
    if (storageKey && messages.length > 0) {
      localStorage.setItem(storageKey, JSON.stringify(messages));
    }
  }, [messages, storageKey]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
      replyTo: replyTo ? { id: replyTo.id, user: replyTo.user, text: replyTo.text } : null,
    };

    setMessages(prev => [...prev, newMsg]);
    setMessage('');
    setReplyTo(null);
  };

  const handleDelete = (msgId) => {
    setMessages(prev => {
      const updated = prev.filter(m => m.id !== msgId);
      if (storageKey) localStorage.setItem(storageKey, JSON.stringify(updated));
      return updated;
    });
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(e);
    }
  };

  const formatTime = (iso) => {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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

  // Group messages by date
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
      {/* Messages */}
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
                return (
                  <div key={msg.id} className={`wt-message ${isOwn ? 'wt-message--own' : ''}`}>
                    {!isOwn && (
                      <div className="wt-message-avatar">
                        <UserAvatar user={{ name: msg.user }} size="small" />
                      </div>
                    )}
                    <div className="wt-message-body">
                      {!isOwn && <span className="wt-message-name">{msg.user}</span>}
                      {msg.replyTo && (
                        <div className="wt-reply-preview">
                          <span className="wt-reply-author">{msg.replyTo.user}</span>
                          <span className="wt-reply-text">{msg.replyTo.text}</span>
                        </div>
                      )}
                      <div className="wt-message-bubble">
                        <p>{msg.text}</p>
                        <span className="wt-message-time">{formatTime(msg.timestamp)}</span>
                      </div>
                      <div className="wt-message-actions">
                        <button
                          className="wt-msg-action-btn"
                          onClick={() => { setReplyTo(msg); inputRef.current?.focus(); }}
                          title="Reply"
                        >
                          <Reply size={14} /> Reply
                        </button>
                        {isOwn && (
                          <button
                            className="wt-msg-action-btn wt-msg-action-btn--danger"
                            onClick={() => handleDelete(msg.id)}
                            title="Delete"
                          >
                            <Trash2 size={14} /> Delete
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

      {/* Reply preview */}
      {replyTo && (
        <div className="wt-reply-bar">
          <Reply size={16} className="wt-reply-bar-icon" />
          <div className="wt-reply-bar-content">
            <span className="wt-reply-bar-name">{replyTo.user}</span>
            <span className="wt-reply-bar-text">{replyTo.text}</span>
          </div>
          <button className="wt-reply-bar-close" onClick={() => setReplyTo(null)}>
            <X size={16} />
          </button>
        </div>
      )}

      {/* Input */}
      <form className="wt-chat-input" onSubmit={handleSend}>
        <button type="button" className="wt-input-icon-btn" title="Attach file">
          <Paperclip size={18} />
        </button>
        <textarea
          ref={inputRef}
          rows={1}
          placeholder="Type a message… (Enter to send, Shift+Enter for new line)"
          value={message}
          onChange={e => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          className="wt-chat-textarea"
        />
        <button type="button" className="wt-input-icon-btn" title="Emoji">
          <Smile size={18} />
        </button>
        <button type="submit" className="wt-send-btn" disabled={!message.trim()}>
          <Send size={18} />
        </button>
      </form>
    </div>
  );
}

export default WorkspaceChatTab;
