import { useState, useEffect, useRef } from 'react';
import { Send, Paperclip, ThumbsUp, MessageCircle } from 'lucide-react';
import UserAvatar from '../UserAvatar';
import { useAuth } from '../../context/AuthContext';
import './Tabs.css';

function ChatTab({ project }) {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const messagesEndRef = useRef(null);
  const { user } = useAuth();

  // Load messages from localStorage on component mount
  useEffect(() => {
    const loadMessages = () => {
      const projectKey = project ? `chat_messages_${project.id}` : 'chat_messages_general';
      const storedMessages = localStorage.getItem(projectKey);

      if (storedMessages) {
        setMessages(JSON.parse(storedMessages));
      }
      // Removed hardcoded sample messages
    };

    loadMessages();
  }, [project]);

  // Save messages to localStorage whenever messages change
  useEffect(() => {
    if (messages.length > 0) {
      const projectKey = project ? `chat_messages_${project.id}` : 'chat_messages_general';
      localStorage.setItem(projectKey, JSON.stringify(messages));
    }
  }, [messages, project]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Format timestamp
  const formatTimestamp = () => {
    const now = new Date();
    return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (message.trim() && user) {
      // Create new message object
      const newMessage = {
        id: Date.now(),
        user: user.name || 'Anonymous',
        message: message.trim(),
        timestamp: formatTimestamp(),
        avatar: user.avatar || '/api/placeholder/32/32',
        likes: 0,
        replies: 0,
        createdAt: new Date().toISOString(),
        projectId: project?.id || null
      };

      // Add message to the messages array
      setMessages(prevMessages => [...prevMessages, newMessage]);

      // Clear input
      setMessage('');

      // Scroll to bottom after sending message
      setTimeout(scrollToBottom, 100);
    }
  };

  // Handle message like
  const handleLikeMessage = (messageId) => {
    setMessages(prevMessages =>
      prevMessages.map(msg =>
        msg.id === messageId
          ? { ...msg, likes: msg.likes + 1 }
          : msg
      )
    );
  };

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
          messages.map((msg) => (
            <div key={msg.id} className="chat-message">
              <div className="avatar-container">
                <UserAvatar user={{ name: msg.user }} size="small" />
              </div>
              <div className="message-content">
                <div className="message-header">
                  <span className="message-user">{msg.user}</span>
                  <span className="message-time">{msg.timestamp}</span>
                </div>
                <p className="message-text">{msg.message}</p>
                <div className="message-actions">
                  <button
                    className="message-action"
                    onClick={() => handleLikeMessage(msg.id)}
                  >
                    <ThumbsUp size={16} />
                    <span>{msg.likes} Like</span>
                  </button>
                  {/* <button className="message-action">
                    <MessageCircle size={16} />
                    <span>{msg.replies} Replies</span>
                  </button> */}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <form className="chat-input" onSubmit={handleSendMessage}>
        <button type="button" className="attach-btn">
          <Paperclip size={20} />
        </button>
        <input
          type="text"
          placeholder="Type a message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <button type="submit" className="send-btn" disabled={!message.trim()}>
          <Send size={20} />
        </button>
      </form>
    </div>
  );
}

export default ChatTab; 