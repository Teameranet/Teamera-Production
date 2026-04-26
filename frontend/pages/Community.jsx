import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Heart, MessageCircle, Bookmark, BookmarkMinus, Paperclip,
  Send, Search, Hash, TrendingUp, Users, Trash2, Download,
  ChevronDown, ChevronUp, SlidersHorizontal, X, Reply
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import UserAvatar from '../components/UserAvatar';
import ProfileModal from '../components/ProfileModal';
import api, { endpoints, API_BASE_URL } from '../utils/api.js';
import './Community.css';

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES = ['All', 'General', 'Tech', 'Design', 'Marketing', 'Project Ideas', 'Help'];
const COMPOSER_CATEGORIES = ['General', 'Tech', 'Design', 'Marketing', 'Project Ideas', 'Help'];

const DEFAULT_STATS = { totalPosts: 0, members: 0, thisWeek: 0 };

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getCategoryBadgeClass(category) {
  const map = {
    Tech: 'badge-tech',
    Design: 'badge-design',
    Marketing: 'badge-marketing',
    General: 'badge-general',
    'Project Ideas': 'badge-project-ideas',
    Help: 'badge-help',
  };
  return map[category] || 'badge-general';
}

/** Format a relative timestamp from an ISO date string */
function formatTimestamp(dateStr) {
  if (!dateStr) return 'Just now';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function CategoryBadge({ category }) {
  return (
    <span className={`post-category-badge ${getCategoryBadgeClass(category)}`}>
      {category}
    </span>
  );
}

function getFileExt(name) {
  const parts = name?.split('.');
  return parts && parts.length > 1 ? parts.pop().toUpperCase().slice(0, 4) : 'FILE';
}

function PostAttachment({ attachment }) {
  if (!attachment || !attachment.name) return null;
  const ext = getFileExt(attachment.name);
  return (
    <div className="post-attachment">
      <div className="post-attachment-icon">
        <div className="post-attachment-page" />
        <span className="post-attachment-ext">{ext}</span>
      </div>
      <div className="post-attachment-info">
        <span className="post-attachment-name">{attachment.name}</span>
        <span className="post-attachment-size">{attachment.size}</span>
      </div>
      <button className="post-attachment-dl" title="Download" aria-label="Download attachment">
        <Download size={16} />
      </button>
    </div>
  );
}

function CommentItem({ comment, currentUserName, currentUserRole, onAvatarClick, onReply, onDelete }) {
  const isOwn = comment.author.name === currentUserName;
  const canDelete = isOwn || currentUserRole === 'admin' || currentUserRole === 'moderator';

  return (
    <div className={`cm-row ${isOwn ? 'cm-row--own' : ''}`}>
      {!isOwn && (
        <div className="cm-avatar" onClick={() => onAvatarClick(comment.author)}>
          <UserAvatar user={{ name: comment.author.name }} size="small" />
        </div>
      )}
      <div className="cm-body">
        <div className="cm-meta">
          <span
            className="cm-author"
            onClick={() => onAvatarClick(comment.author)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && onAvatarClick(comment.author)}
          >
            {isOwn ? 'You' : comment.author.name}
          </span>
          <span className="cm-time">{comment.timestamp}</span>
        </div>

        {/* Reply quote — always outside the bubble, same as workspace wt-reply-preview */}
        {comment.replyTo && (
          <div className="cm-reply-quote">
            <span className="cm-reply-quote-name">{comment.replyTo.author.name}</span>
            <span className="cm-reply-quote-text">{comment.replyTo.text}</span>
          </div>
        )}

        {/* Text bubble */}
        {comment.text && (
          <div className={`cm-bubble ${isOwn ? 'cm-bubble--own' : ''}`}>
            <p>{comment.text}</p>
          </div>
        )}

        {/* File attachment */}
        {comment.attachment && comment.attachment.name && (
          <div className={`cm-file-card ${isOwn ? 'cm-file-card--own' : ''}`}>
            <div className="cm-file-icon">
              <div className="cm-file-page" />
              <span className="cm-file-ext">{getFileExt(comment.attachment.name)}</span>
            </div>
            <div className="cm-file-info">
              <span className="cm-file-name">{comment.attachment.name}</span>
              <span className="cm-file-size">{comment.attachment.size}</span>
            </div>
            <button className="cm-file-dl" title="Download" aria-label="Download">
              <Download size={14} />
            </button>
          </div>
        )}

        {/* Hover actions */}
        <div className="cm-actions">
          <button className="cm-action-btn" onClick={() => onReply(comment)}>
            <Reply size={12} /> Reply
          </button>
          {canDelete && (
            <button
              className="cm-action-btn cm-action-btn--danger"
              onClick={() => onDelete(comment.id)}
              title="Delete comment"
              aria-label="Delete comment"
            >
              <Trash2 size={12} /> Delete
            </button>
          )}
          <span className="cm-likes">{comment.likes > 0 && `${comment.likes} likes`}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

function Community() {
  const { user } = useAuth();

  // Feed state
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Sidebar data
  const [trendingTopics, setTrendingTopics] = useState([]);
  const [communityStats, setCommunityStats] = useState(DEFAULT_STATS);

  // Post composer state
  const [newPostText, setNewPostText] = useState('');
  const [newPostCategory, setNewPostCategory] = useState('General');
  const [newPostFile, setNewPostFile] = useState(null); // { name, size, file }
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [posting, setPosting] = useState(false);

  // UI state
  const [showComments, setShowComments] = useState({});
  const [expandedPosts, setExpandedPosts] = useState({});
  const [commentInputs, setCommentInputs] = useState({});
  const [commentReplyTo, setCommentReplyTo] = useState({});   // postId → comment
  const [commentFiles, setCommentFiles] = useState({});        // postId → { name, size }
  const [showMobileFilter, setShowMobileFilter] = useState(false);
  const [showSavedPosts, setShowSavedPosts] = useState(false);
  const [showMyPosts, setShowMyPosts] = useState(false);
  // Profile modal
  const [selectedUser, setSelectedUser] = useState(null);
  // SSE connection status
  const [sseConnected, setSseConnected] = useState(false);

  // File input refs
  const fileInputRef = useRef(null);
  const commentFileRefs = useRef({});
  const postRefs = useRef({});

  const userId = user?.id || user?._id || null;

  // ── Data fetching ────────────────────────────────────────────────────────────

  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams({ limit: 50 });
      if (userId) params.append('userId', userId);
      const res = await api.get(`${endpoints.community.getPosts}?${params}`);
      setPosts(res.data?.posts || []);
    } catch (err) {
      console.error('Failed to fetch posts:', err);
      setError('Failed to load posts. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const fetchSidebar = useCallback(async () => {
    try {
      const [trendRes, statsRes] = await Promise.all([
        api.get(endpoints.community.trending),
        api.get(endpoints.community.stats),
      ]);
      setTrendingTopics(trendRes.data || []);
      setCommunityStats(statsRes.data || DEFAULT_STATS);
    } catch (err) {
      console.error('Failed to fetch sidebar data:', err);
    }
  }, []);

  useEffect(() => {
    fetchPosts();
    fetchSidebar();
  }, [fetchPosts, fetchSidebar]);

  // ── SSE Connection for real-time updates ─────────────────────────────────────

  useEffect(() => {
    if (!userId) return;

    let eventSource = null;

    const connectSSE = () => {
      try {
        const streamUrl = `${API_BASE_URL}${endpoints.community.stream(userId)}`;
        eventSource = new EventSource(streamUrl);

        eventSource.onopen = () => {
          console.log('[Community SSE] Connected');
          setSseConnected(true);
        };

        eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            console.log('[Community SSE] Received:', data.type, data);

            switch (data.type) {
              case 'connected':
                console.log('[Community SSE]', data.message);
                break;

              case 'newPost':
                // Add new post to the top of the feed
                setPosts((prev) => {
                  // Avoid duplicates
                  if (prev.some((p) => p.id === data.payload.id)) return prev;
                  return [data.payload, ...prev];
                });
                // Refresh stats
                fetchSidebar();
                break;

              case 'deletePost':
                // Remove deleted post
                setPosts((prev) => prev.filter((p) => p.id !== data.payload.postId));
                // Refresh stats
                fetchSidebar();
                break;

              case 'likeUpdate':
                // Update like count for the post
                setPosts((prev) =>
                  prev.map((p) =>
                    p.id === data.payload.postId
                      ? { ...p, likes: data.payload.likes }
                      : p
                  )
                );
                break;

              case 'newComment':
                // Add new comment to the post (avoid duplicates)
                setPosts((prev) =>
                  prev.map((p) => {
                    if (p.id !== data.payload.postId) return p;
                    // Check if comment already exists
                    const commentExists = p.comments.some((c) => c.id === data.payload.comment.id);
                    if (commentExists) return p;
                    return { ...p, comments: [...p.comments, data.payload.comment] };
                  })
                );
                break;

              case 'deleteComment':
                // Remove deleted comment
                setPosts((prev) =>
                  prev.map((p) =>
                    p.id === data.payload.postId
                      ? {
                          ...p,
                          comments: p.comments.filter((c) => c.id !== data.payload.commentId),
                        }
                      : p
                  )
                );
                break;

              default:
                console.log('[Community SSE] Unknown event type:', data.type);
            }
          } catch (err) {
            console.error('[Community SSE] Parse error:', err);
          }
        };

        eventSource.onerror = (err) => {
          console.error('[Community SSE] Error:', err);
          setSseConnected(false);
          eventSource.close();
          // Attempt to reconnect after 3 seconds
          setTimeout(() => {
            console.log('[Community SSE] Reconnecting...');
            connectSSE();
          }, 3000);
        };
      } catch (err) {
        console.error('[Community SSE] Connection error:', err);
      }
    };

    connectSSE();

    // Cleanup on unmount
    return () => {
      if (eventSource) {
        console.log('[Community SSE] Disconnecting');
        setSseConnected(false);
        eventSource.close();
      }
    };
  }, [userId, fetchSidebar]);

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleLike = async (postId) => {
    if (!userId) return;
    // Optimistic update
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 }
          : p
      )
    );
    try {
      await api.post(endpoints.community.likePost(postId), { userId });
    } catch (err) {
      console.error('Like failed:', err);
      // Revert on error
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 }
            : p
        )
      );
    }
  };

  const handleBookmark = async (postId) => {
    if (!userId) return;
    // Optimistic update
    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, bookmarked: !p.bookmarked } : p))
    );
    try {
      await api.post(endpoints.community.bookmarkPost(postId), { userId });
    } catch (err) {
      console.error('Bookmark failed:', err);
      // Revert on error
      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, bookmarked: !p.bookmarked } : p))
      );
    }
  };

  const handleDeletePost = async (postId) => {
    // Optimistic removal
    setPosts((prev) => prev.filter((p) => p.id !== postId));
    try {
      const params = userId ? `?userId=${userId}` : '';
      await api.delete(`${endpoints.community.deletePost(postId)}${params}`);
      // Refresh stats
      fetchSidebar();
    } catch (err) {
      console.error('Delete post failed:', err);
      fetchPosts(); // Re-fetch to restore state
    }
  };

  const handleDeleteComment = async (postId, commentId) => {
    // Optimistic removal
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? { ...p, comments: p.comments.filter((c) => c.id !== commentId) }
          : p
      )
    );
    try {
      const params = userId ? `?userId=${userId}` : '';
      await api.delete(`${endpoints.community.deleteComment(postId, commentId)}${params}`);
    } catch (err) {
      console.error('Delete comment failed:', err);
      fetchPosts(); // Re-fetch to restore state
    }
  };

  const handlePost = async () => {
    if (!newPostText.trim() || posting) return;
    setPosting(true);
    try {
      const postData = {
        content: newPostText.trim(),
        category: newPostCategory,
        author: {
          userId: userId || null,
          name: user?.name || 'Anonymous',
          title: user?.title || '',
          role: user?.role || 'user',
          avatar: user?.avatar || null,
        },
      };

      // Add attachment if file is selected
      if (newPostFile) {
        postData.attachment = {
          name: newPostFile.name,
          size: newPostFile.size,
          url: null, // TODO: Upload to server and get URL
        };
      }

      await api.post(endpoints.community.createPost, postData);
      // Don't add post locally - SSE will broadcast it to all clients including this one
      setNewPostText('');
      setNewPostCategory('General');
      setNewPostFile(null);
      setShowCreatePost(false);
      // Refresh stats
      fetchSidebar();
    } catch (err) {
      console.error('Create post failed:', err);
    } finally {
      setPosting(false);
    }
  };

  const handlePostFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setNewPostFile({
      name: file.name,
      size: formatFileSize(file.size),
      file: file,
    });
    e.target.value = ''; // Reset input
  };

  const handleRemovePostFile = () => {
    setNewPostFile(null);
  };

  const handleComposerKeyDown = (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      handlePost();
    }
  };

  const handleAddComment = async (postId) => {
    const text = (commentInputs[postId] || '').trim();
    const attachment = commentFiles[postId] || null;
    if (!text && !attachment) return;

    const replyTo = commentReplyTo[postId] || null;

    // Clear inputs immediately for better UX
    setCommentInputs((prev) => ({ ...prev, [postId]: '' }));
    setCommentFiles((prev) => ({ ...prev, [postId]: null }));
    setCommentReplyTo((prev) => ({ ...prev, [postId]: null }));

    try {
      await api.post(endpoints.community.addComment(postId), {
        text,
        attachment,
        replyTo: replyTo
          ? { commentId: replyTo.id, author: replyTo.author, text: replyTo.text }
          : null,
        author: {
          userId: userId || null,
          name: user?.name || 'Anonymous',
          title: user?.title || '',
          role: user?.role || 'user',
          avatar: user?.avatar || null,
        },
      });
      // Don't add comment locally - SSE will broadcast it to all clients including this one
    } catch (err) {
      console.error('Add comment failed:', err);
      // On error, restore the input values
      setCommentInputs((prev) => ({ ...prev, [postId]: text }));
      if (attachment) setCommentFiles((prev) => ({ ...prev, [postId]: attachment }));
      if (replyTo) setCommentReplyTo((prev) => ({ ...prev, [postId]: replyTo }));
    }
  };

  const handleCommentFileChange = (e, postId) => {
    const file = e.target.files[0];
    if (!file) return;
    setCommentFiles((prev) => ({ ...prev, [postId]: { name: file.name, size: formatFileSize(file.size) } }));
    e.target.value = '';
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleCommentKeyDown = (e, postId) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAddComment(postId);
    }
  };

  const toggleComments = (postId) => {
    setShowComments((prev) => ({ ...prev, [postId]: !prev[postId] }));
  };

  const toggleExpanded = (postId) => {
    setExpandedPosts((prev) => ({ ...prev, [postId]: !prev[postId] }));
  };

  const handleGoToPost = (postId) => {
    // Switch to main feed (not saved view) so the post is visible
    setShowSavedPosts(false);
    setActiveCategory('All');
    // Scroll after state update + render
    setTimeout(() => {
      const el = postRefs.current[postId];
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Brief highlight flash
        el.classList.add('post-card--highlight');
        setTimeout(() => el.classList.remove('post-card--highlight'), 1500);
      }
    }, 80);
  };

  // ── Filter logic ─────────────────────────────────────────────────────────────

  const filterPosts = () => {
    let filtered = [...posts];

    // Category filter
    if (activeCategory !== 'All') {
      filtered = filtered.filter((p) => p.category === activeCategory);
    }

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.content.toLowerCase().includes(q) ||
          p.author.name.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          (p.tags || []).some((t) => t.toLowerCase().includes(q))
      );
    }

    return filtered;
  };

  const filteredPosts = filterPosts();

  // Saved posts derived from bookmarked state
  const savedPosts = posts.filter((p) => p.bookmarked);

  // My posts — posts authored by the current user
  const myPosts = posts.filter(
    (p) => userId && p.author.userId && p.author.userId.toString() === userId.toString()
  );

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="community-page">
      {/* ── Header ── */}
      <div className="community-header-wrapper">
        <header className="community-header">
          <div className="community-header-content">
            <h1 className="community-title">Community</h1>
            <p className="community-subtitle">Connect, share, and grow with fellow builders</p>
          </div>
          {/* Real-time connection indicator */}
          {userId && (
            <div className={`realtime-indicator ${sseConnected ? 'connected' : 'disconnected'}`} title={sseConnected ? 'Real-time updates active' : 'Connecting...'}>
              <span className="realtime-dot"></span>
              <span className="realtime-text">{sseConnected ? 'Live' : 'Connecting...'}</span>
            </div>
          )}
        </header>
        <div className="community-search-bar">
          <div className="community-search-bar-row">
            <div className="community-search-wrapper">
              <Search size={18} className="community-search-icon" />
              <input
                type="text"
                className="community-search"
                placeholder="Search posts, topics, or members…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Search community"
              />
              <button
                className="mobile-filter-btn"
                onClick={() => setShowMobileFilter((v) => !v)}
                aria-label="Toggle filters"
                aria-expanded={showMobileFilter}
              >
                {showMobileFilter ? <X size={18} /> : <SlidersHorizontal size={18} />}
              </button>
            </div>

            {/* Your Posts button — desktop only */}
            <button
              className={`your-posts-btn ${showMyPosts ? 'your-posts-btn--active' : ''}`}
              onClick={() => {
                setShowMyPosts((v) => !v);
                setShowSavedPosts(false);
              }}
              aria-pressed={showMyPosts}
            >
              <Users size={15} />
              Your Posts
              {myPosts.length > 0 && (
                <span className="your-posts-count">{myPosts.length}</span>
              )}
            </button>
          </div>

          {/* Mobile filter drawer */}
          {showMobileFilter && (
            <div className="mobile-filter-drawer">
              <p className="mobile-filter-label">Category</p>
              <div className="mobile-filter-chips">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    className={`mobile-filter-chip ${activeCategory === cat && !showSavedPosts && !showMyPosts ? 'active' : ''}`}
                    onClick={() => {
                      setActiveCategory(cat);
                      setShowSavedPosts(false);
                      setShowMyPosts(false);
                      setShowMobileFilter(false);
                    }}
                  >
                    {cat}
                    {cat !== 'All' && (
                      <span className="mobile-filter-chip-count">
                        {posts.filter((p) => p.category === cat).length}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              <div className="mobile-filter-divider" />

              <div className="mobile-filter-chips">
                {/* Saved Posts chip */}
                <button
                  className={`mobile-filter-chip mobile-filter-chip--saved ${showSavedPosts ? 'active' : ''}`}
                  onClick={() => {
                    setShowSavedPosts((v) => !v);
                    setShowMyPosts(false);
                    setShowMobileFilter(false);
                  }}
                >
                  <Bookmark size={13} fill={showSavedPosts ? 'currentColor' : 'none'} />
                  Saved Posts
                  {savedPosts.length > 0 && (
                    <span className="mobile-filter-chip-count">{savedPosts.length}</span>
                  )}
                </button>

                {/* Your Posts chip */}
                <button
                  className={`mobile-filter-chip mobile-filter-chip--myposts ${showMyPosts ? 'active' : ''}`}
                  onClick={() => {
                    setShowMyPosts((v) => !v);
                    setShowSavedPosts(false);
                    setShowMobileFilter(false);
                  }}
                >
                  <Users size={13} />
                  Your Posts
                  {myPosts.length > 0 && (
                    <span className="mobile-filter-chip-count">{myPosts.length}</span>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── 3-column layout ── */}
      <div className="community-layout">

        {/* ── Left Sidebar ── */}
        <aside className="community-left-sidebar">
          {/* Categories */}
          <div className="sidebar-card">
            <h3 className="sidebar-title">Categories</h3>
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                className={`category-filter-btn ${activeCategory === cat ? 'active' : ''}`}
                onClick={() => setActiveCategory(cat)}
              >
                <span>{cat}</span>
                {cat !== 'All' && (
                  <span className="category-filter-count">
                    {posts.filter((p) => p.category === cat).length}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Trending Topics */}
          <div className="sidebar-card">
            <h3 className="sidebar-title">
              <TrendingUp size={14} style={{ marginRight: '0.4rem', verticalAlign: 'middle' }} />
              Trending Topics
            </h3>
            {trendingTopics.length === 0 ? (
              <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', padding: '0.5rem 0' }}>No trending topics yet.</p>
            ) : (
              trendingTopics.map((item) => (
                <div
                  key={item.tag}
                  className="trending-item"
                  onClick={() => setSearchQuery(item.tag)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && setSearchQuery(item.tag)}
                >
                  <Hash size={14} style={{ color: 'var(--color-accent)', flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <div className="trending-tag">{item.tag}</div>
                    <div className="trending-count">{item.count} posts</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </aside>

        {/* ── Main Feed ── */}
        <main className="community-feed">
          {/* Post Composer */}
          <div className="post-composer">
            <div className="composer-top">
              <UserAvatar user={user || { name: 'You' }} size="medium" />
              <textarea
                className="composer-input"
                placeholder="What are you working on?"
                value={newPostText}
                onChange={(e) => setNewPostText(e.target.value)}
                onKeyDown={handleComposerKeyDown}
                onFocus={() => setShowCreatePost(true)}
                rows={showCreatePost ? 4 : 2}
                aria-label="New post content"
              />
            </div>

            {showCreatePost && (
              <>
                {/* Category selector */}
                <div className="composer-categories">
                  {COMPOSER_CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      className={`category-chip ${newPostCategory === cat ? 'active' : ''}`}
                      onClick={() => setNewPostCategory(cat)}
                      type="button"
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* File preview */}
                {newPostFile && (
                  <div className="composer-file-preview">
                    <div className="post-attachment">
                      <div className="post-attachment-icon">
                        <div className="post-attachment-page" />
                        <span className="post-attachment-ext">{getFileExt(newPostFile.name)}</span>
                      </div>
                      <div className="post-attachment-info">
                        <span className="post-attachment-name">{newPostFile.name}</span>
                        <span className="post-attachment-size">{newPostFile.size}</span>
                      </div>
                      <button 
                        className="post-attachment-dl" 
                        onClick={handleRemovePostFile}
                        title="Remove file" 
                        aria-label="Remove file"
                        type="button"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                )}

                {/* Actions row */}
                <div className="composer-actions">
                  <div className="composer-media-btns">
                    <button
                      className="composer-icon-btn"
                      title="Attach file"
                      aria-label="Attach file"
                      onClick={() => fileInputRef.current?.click()}
                      type="button"
                    >
                      <Paperclip size={18} />
                    </button>

                    <span className="composer-hint">Ctrl+Enter to post</span>
                  </div>
                  <div className="composer-right-btns">
                    <button
                      className="composer-cancel-btn"
                      onClick={() => {
                        setShowCreatePost(false);
                        setNewPostText('');
                        setNewPostFile(null);
                      }}
                      type="button"
                    >
                      Cancel
                    </button>
                    <button
                      className="post-btn"
                      onClick={handlePost}
                      disabled={!newPostText.trim() || posting}
                      type="button"
                    >
                      <Send size={15} />
                      {posting ? 'Posting…' : 'Post'}
                    </button>
                  </div>
                </div>
                {/* Hidden file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  style={{ display: 'none' }}
                  onChange={handlePostFileChange}
                  aria-hidden="true"
                />
              </>
            )}
          </div>

          {/* Posts */}
          {loading ? (
            <div className="empty-feed">
              <div style={{ fontSize: '1rem', color: 'var(--color-text-muted)' }}>Loading posts…</div>
            </div>
          ) : error ? (
            <div className="empty-feed">
              <p style={{ color: 'var(--color-danger, #e53e3e)' }}>{error}</p>
              <button className="post-btn" onClick={fetchPosts} style={{ marginTop: '1rem' }}>Retry</button>
            </div>
          ) : showMyPosts ? (
            /* ── Your Posts Feed ── */
            <div>
              <div className="saved-feed-header saved-feed-header--myposts">
                <Users size={16} className="saved-feed-header-icon saved-feed-header-icon--myposts" />
                <span>Your Posts</span>
                <span className="saved-feed-count saved-feed-count--myposts">{myPosts.length}</span>
                <button
                  className="saved-feed-clear saved-feed-clear--myposts"
                  onClick={() => setShowMyPosts(false)}
                  aria-label="Back to feed"
                >
                  <X size={14} /> Back to feed
                </button>
              </div>

              {myPosts.length === 0 ? (
                <div className="empty-feed">
                  <Users size={48} />
                  <h3>No posts yet</h3>
                  <p>Posts you create will appear here.</p>
                </div>
              ) : (
                myPosts.map((post) => {
                  const isExpanded = expandedPosts[post.id];
                  const commentsOpen = showComments[post.id];
                  return (
                    <article key={post.id} className="post-card">
                      <div className="post-header">
                        <div className="post-author-info">
                          <UserAvatar user={{ name: post.author.name }} size="medium" />
                          <div>
                            <div className="post-author-name">{post.author.name}</div>
                            <div className="post-author-meta">{post.author.title} · {formatTimestamp(post.createdAt)}</div>
                          </div>
                        </div>
                        <div className="post-header-right">
                          <CategoryBadge category={post.category} />
                          <button className="delete-post-btn" onClick={() => handleDeletePost(post.id)} title="Delete post" aria-label="Delete post">
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                      <div className={`post-content ${isExpanded ? '' : 'truncated'}`}>{post.content}</div>
                      {post.content.length > 200 && (
                        <button className="show-more-btn" onClick={() => toggleExpanded(post.id)}>
                          {isExpanded
                            ? <><ChevronUp size={14} style={{ verticalAlign: 'middle' }} /> Show less</>
                            : <><ChevronDown size={14} style={{ verticalAlign: 'middle' }} /> Show more</>}
                        </button>
                      )}
                      <PostAttachment attachment={post.attachment} />
                      {post.tags.length > 0 && (
                        <div className="post-tags">
                          {post.tags.map((tag) => (
                            <span key={tag} className="post-tag"
                              onClick={() => { setSearchQuery(tag); setShowMyPosts(false); }}
                              role="button" tabIndex={0}
                              onKeyDown={(e) => e.key === 'Enter' && setSearchQuery(tag)}
                            >{tag}</span>
                          ))}
                        </div>
                      )}
                      <div className="post-actions">
                        <button className={`action-btn ${post.liked ? 'liked' : ''}`} onClick={() => handleLike(post.id)} aria-label={post.liked ? 'Unlike' : 'Like'}>
                          <Heart size={16} fill={post.liked ? 'currentColor' : 'none'} /><span>{post.likes}</span>
                        </button>
                        <button className="action-btn" onClick={() => toggleComments(post.id)} aria-label="Toggle comments">
                          <MessageCircle size={16} /><span>{post.comments.length}</span>
                        </button>
                        <button className={`action-btn ${post.bookmarked ? 'bookmarked' : ''}`} onClick={() => handleBookmark(post.id)} aria-label={post.bookmarked ? 'Remove bookmark' : 'Bookmark'}>
                          <Bookmark size={16} fill={post.bookmarked ? 'currentColor' : 'none'} />
                        </button>
                      </div>
                      {commentsOpen && (
                        <div className="comments-section">
                          {post.comments.length > 0 && (
                            <div className="cm-list">
                              {post.comments.map((comment) => (
                                <CommentItem key={comment.id} comment={comment} currentUserName={user?.name} currentUserRole={user?.role}
                                  onAvatarClick={(author) => setSelectedUser(author)}
                                  onReply={(c) => setCommentReplyTo((prev) => ({ ...prev, [post.id]: c }))}
                                  onDelete={(commentId) => handleDeleteComment(post.id, commentId)}
                                />
                              ))}
                            </div>
                          )}
                          <div className="cm-input-bar">
                            <div className="cm-input-wrap">
                              <textarea
                                rows={1}
                                className="cm-input"
                                placeholder="Write a comment… (Enter to send)"
                                value={commentInputs[post.id] || ''}
                                onChange={(e) => {
                                  setCommentInputs((prev) => ({ ...prev, [post.id]: e.target.value }));
                                  e.target.style.height = 'auto';
                                  e.target.style.height = Math.min(e.target.scrollHeight, 100) + 'px';
                                }}
                                onKeyDown={(e) => handleCommentKeyDown(e, post.id)}
                                aria-label="Write a comment"
                              />
                            </div>
                            <button className="cm-send-btn" onClick={() => handleAddComment(post.id)}
                              disabled={!(commentInputs[post.id] || '').trim()}
                              aria-label="Send comment" type="button"
                            ><Send size={15} /></button>
                          </div>
                        </div>
                      )}
                    </article>
                  );
                })
              )}
            </div>
          ) : showSavedPosts ? (
            /* ── Saved Posts Feed ── */
            <div>
              <div className="saved-feed-header">
                <Bookmark size={16} className="saved-feed-header-icon" />
                <span>Saved Posts</span>
                <span className="saved-feed-count">{savedPosts.length}</span>
                <button
                  className="saved-feed-clear"
                  onClick={() => setShowSavedPosts(false)}
                  aria-label="Back to feed"
                >
                  <X size={14} /> Back to feed
                </button>
              </div>

              {savedPosts.length === 0 ? (
                <div className="empty-feed">
                  <Bookmark size={48} />
                  <h3>No saved posts</h3>
                  <p>Bookmark posts to find them here later.</p>
                </div>
              ) : (
                savedPosts.map((post) => {
                  const isAuthor = user && user.name === post.author.name;
                  const isExpanded = expandedPosts[post.id];
                  const commentsOpen = showComments[post.id];
                  return (
                    <article key={post.id} className="post-card">
                      <div className="post-header">
                        <div className="post-author-info">
                          <UserAvatar user={{ name: post.author.name }} size="medium" style={{ cursor: 'pointer' }} onClick={() => setSelectedUser(post.author)} />
                          <div>
                            <div className="post-author-name" onClick={() => setSelectedUser(post.author)} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && setSelectedUser(post.author)}>{post.author.name}</div>
                            <div className="post-author-meta">{post.author.title} · {formatTimestamp(post.createdAt)}</div>
                          </div>
                        </div>
                        <div className="post-header-right">
                          <CategoryBadge category={post.category} />
                          {isAuthor && (
                            <button className="delete-post-btn" onClick={() => handleDeletePost(post.id)} title="Delete post" aria-label="Delete post"><Trash2 size={15} /></button>
                          )}
                        </div>
                      </div>
                      <div className={`post-content ${isExpanded ? '' : 'truncated'}`}>{post.content}</div>
                      {post.content.length > 200 && (
                        <button className="show-more-btn" onClick={() => toggleExpanded(post.id)}>
                          {isExpanded ? <><ChevronUp size={14} style={{ verticalAlign: 'middle' }} /> Show less</> : <><ChevronDown size={14} style={{ verticalAlign: 'middle' }} /> Show more</>}
                        </button>
                      )}
                      <PostAttachment attachment={post.attachment} />
                      {post.tags.length > 0 && (
                        <div className="post-tags">
                          {post.tags.map((tag) => (
                            <span key={tag} className="post-tag" onClick={() => { setSearchQuery(tag); setShowSavedPosts(false); }} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && setSearchQuery(tag)}>{tag}</span>
                          ))}
                        </div>
                      )}
                      <div className="post-actions">
                        <button className={`action-btn ${post.liked ? 'liked' : ''}`} onClick={() => handleLike(post.id)} aria-label={post.liked ? 'Unlike post' : 'Like post'}>
                          <Heart size={16} fill={post.liked ? 'currentColor' : 'none'} /><span>{post.likes}</span>
                        </button>
                        <button className="action-btn" onClick={() => toggleComments(post.id)} aria-label="Toggle comments">
                          <MessageCircle size={16} /><span>{post.comments.length}</span>
                        </button>
                        <button className={`action-btn bookmarked`} onClick={() => handleBookmark(post.id)} aria-label="Remove bookmark">
                          <Bookmark size={16} fill="currentColor" />
                        </button>
                      </div>
                      {commentsOpen && (
                        <div className="comments-section">
                          {post.comments.length > 0 && (
                            <div className="cm-list">
                              {post.comments.map((comment) => (
                                <CommentItem key={comment.id} comment={comment} currentUserName={user?.name} currentUserRole={user?.role} onAvatarClick={(author) => setSelectedUser(author)} onReply={(c) => setCommentReplyTo((prev) => ({ ...prev, [post.id]: c }))} onDelete={(commentId) => handleDeleteComment(post.id, commentId)} />
                              ))}
                            </div>
                          )}
                          <div className="cm-input-bar">
                            <div className="cm-input-wrap">
                              <textarea
                                rows={1}
                                className="cm-input"
                                placeholder="Write a comment… (Enter to send)"
                                value={commentInputs[post.id] || ''}
                                onChange={(e) => {
                                  setCommentInputs((prev) => ({ ...prev, [post.id]: e.target.value }));
                                  e.target.style.height = 'auto';
                                  e.target.style.height = Math.min(e.target.scrollHeight, 100) + 'px';
                                }}
                                onKeyDown={(e) => handleCommentKeyDown(e, post.id)}
                                aria-label="Write a comment"
                              />
                            </div>
                            <button className="cm-send-btn" onClick={() => handleAddComment(post.id)} disabled={!(commentInputs[post.id] || '').trim()} aria-label="Send comment" type="button"><Send size={15} /></button>
                          </div>
                        </div>
                      )}
                    </article>
                  );
                })
              )}
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="empty-feed">
              <Users size={48} />
              <h3>No posts found</h3>
              <p>
                {searchQuery
                  ? 'Try a different search term or clear the filter.'
                  : 'Be the first to post in this category!'}
              </p>
            </div>
          ) : (
            filteredPosts.map((post) => {
              const isAuthor = user && user.name === post.author.name;
              const isExpanded = expandedPosts[post.id];
              const commentsOpen = showComments[post.id];

              return (
                <article key={post.id} className="post-card" ref={(el) => { postRefs.current[post.id] = el; }}>
                  {/* Post header */}
                  <div className="post-header">
                    <div className="post-author-info">
                      <UserAvatar
                        user={{ name: post.author.name }}
                        size="medium"
                        style={{ cursor: 'pointer' }}
                        onClick={() => setSelectedUser(post.author)}
                      />
                      <div>
                        <div
                          className="post-author-name"
                          onClick={() => setSelectedUser(post.author)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => e.key === 'Enter' && setSelectedUser(post.author)}
                        >
                          {post.author.name}
                        </div>
                        <div className="post-author-meta">
                          {post.author.title} · {formatTimestamp(post.createdAt)}
                        </div>
                      </div>
                    </div>

                    <div className="post-header-right">
                      <CategoryBadge category={post.category} />
                      {isAuthor && (
                        <button
                          className="delete-post-btn"
                          onClick={() => handleDeletePost(post.id)}
                          title="Delete post"
                          aria-label="Delete post"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Post content */}
                  <div className={`post-content ${isExpanded ? '' : 'truncated'}`}>
                    {post.content}
                  </div>
                  {post.content.length > 200 && (
                    <button
                      className="show-more-btn"
                      onClick={() => toggleExpanded(post.id)}
                    >
                      {isExpanded ? (
                        <>
                          <ChevronUp size={14} style={{ verticalAlign: 'middle' }} /> Show less
                        </>
                      ) : (
                        <>
                          <ChevronDown size={14} style={{ verticalAlign: 'middle' }} /> Show more
                        </>
                      )}
                    </button>
                  )}

                  {/* Attachment */}
                  <PostAttachment attachment={post.attachment} />

                  {/* Tags */}
                  {post.tags.length > 0 && (
                    <div className="post-tags">
                      {post.tags.map((tag) => (
                        <span
                          key={tag}
                          className="post-tag"
                          onClick={() => setSearchQuery(tag)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => e.key === 'Enter' && setSearchQuery(tag)}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Action bar */}
                  <div className="post-actions">
                    <button
                      className={`action-btn ${post.liked ? 'liked' : ''}`}
                      onClick={() => handleLike(post.id)}
                      aria-label={post.liked ? 'Unlike post' : 'Like post'}
                    >
                      <Heart size={16} fill={post.liked ? 'currentColor' : 'none'} />
                      <span>{post.likes}</span>
                    </button>

                    <button
                      className="action-btn"
                      onClick={() => toggleComments(post.id)}
                      aria-label="Toggle comments"
                    >
                      <MessageCircle size={16} />
                      <span>{post.comments.length}</span>
                    </button>

<button
                      className={`action-btn ${post.bookmarked ? 'bookmarked' : ''}`}
                      onClick={() => handleBookmark(post.id)}
                      aria-label={post.bookmarked ? 'Remove bookmark' : 'Bookmark post'}
                    >
                      <Bookmark size={16} fill={post.bookmarked ? 'currentColor' : 'none'} />
                    </button>
                  </div>

                  {/* Comments section */}
                  {commentsOpen && (
                    <div className="comments-section">
                      {/* Comment list */}
                      {post.comments.length > 0 && (
                        <div className="cm-list">
                          {post.comments.map((comment) => (
                            <CommentItem
                              key={comment.id}
                              comment={comment}
                              currentUserName={user?.name}
                              currentUserRole={user?.role}
                              onAvatarClick={(author) => setSelectedUser(author)}
                              onReply={(c) => setCommentReplyTo((prev) => ({ ...prev, [post.id]: c }))}
                              onDelete={(commentId) => handleDeleteComment(post.id, commentId)}
                            />
                          ))}
                        </div>
                      )}

                      {/* Bottom: reply bar + pending file + input bar */}
                      <div className="cm-input-footer">
                        {/* Reply bar */}
                        {commentReplyTo[post.id] && (
                          <div className="cm-reply-bar">
                            <Reply size={14} className="cm-reply-bar-icon" />
                            <div className="cm-reply-bar-content">
                              <span className="cm-reply-bar-name">{commentReplyTo[post.id].author.name}</span>
                              <span className="cm-reply-bar-text">{commentReplyTo[post.id].text}</span>
                            </div>
                            <button
                              className="cm-reply-bar-close"
                              onClick={() => setCommentReplyTo((prev) => ({ ...prev, [post.id]: null }))}
                              aria-label="Cancel reply"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        )}

                        {/* Pending file preview */}
                        {commentFiles[post.id] && (
                          <div className="cm-pending-file">
                            <div className="cm-file-card">
                              <div className="cm-file-icon">
                                <div className="cm-file-page" />
                                <span className="cm-file-ext">{getFileExt(commentFiles[post.id].name)}</span>
                              </div>
                              <div className="cm-file-info">
                                <span className="cm-file-name">{commentFiles[post.id].name}</span>
                                <span className="cm-file-size">{commentFiles[post.id].size}</span>
                              </div>
                              <button
                                className="cm-reply-bar-close"
                                onClick={() => setCommentFiles((prev) => ({ ...prev, [post.id]: null }))}
                                aria-label="Remove file"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Comment input bar */}
                        <div className="cm-input-bar">
                        <button
                          className="cm-attach-btn"
                          title="Attach file"
                          aria-label="Attach file"
                          onClick={() => commentFileRefs.current[post.id]?.click()}
                          type="button"
                        >
                          <Paperclip size={16} />
                        </button>
                        {/* Hidden file input per post */}
                        <input
                          type="file"
                          style={{ display: 'none' }}
                          ref={(el) => { commentFileRefs.current[post.id] = el; }}
                          onChange={(e) => handleCommentFileChange(e, post.id)}
                          aria-hidden="true"
                        />
                        <div className="cm-input-wrap">
                          <textarea
                            rows={1}
                            className="cm-input"
                            placeholder="Write a comment… (Enter to send)"
                            value={commentInputs[post.id] || ''}
                            onChange={(e) => {
                              setCommentInputs((prev) => ({ ...prev, [post.id]: e.target.value }));
                              e.target.style.height = 'auto';
                              e.target.style.height = Math.min(e.target.scrollHeight, 100) + 'px';
                            }}
                            onKeyDown={(e) => handleCommentKeyDown(e, post.id)}
                            aria-label="Write a comment"
                          />
                        </div>
                        <button
                          className="cm-send-btn"
                          onClick={() => handleAddComment(post.id)}
                          disabled={!(commentInputs[post.id] || '').trim() && !commentFiles[post.id]}
                          aria-label="Send comment"
                          type="button"
                        >
                          <Send size={15} />
                        </button>
                        </div>
                      </div>
                    </div>
                  )}
                </article>
              );
            })
          )}
        </main>

        {/* ── Right Sidebar ── */}
        <aside className="community-right-sidebar">
          {/* Community Stats */}
          <div className="sidebar-card">
            <h3 className="sidebar-title">Community Stats</h3>
            <div className="stats-grid-community">
              <div className="stat-item-community">
                <div className="stat-number">{communityStats.totalPosts.toLocaleString()}</div>
                <div className="stat-label">Total Posts</div>
              </div>
              <div className="stat-item-community">
                <div className="stat-number">{communityStats.members.toLocaleString()}</div>
                <div className="stat-label">Members</div>
              </div>
              <div className="stat-item-community" style={{ gridColumn: '1 / -1' }}>
                <div className="stat-number">{communityStats.thisWeek}</div>
                <div className="stat-label">Posts This Week</div>
              </div>
            </div>
          </div>

          {/* Saved Posts */}
          <div className="sidebar-card">
            <h3 className="sidebar-title">
              <Bookmark size={13} style={{ marginRight: '0.4rem', verticalAlign: 'middle' }} />
              Saved Posts
              {savedPosts.length > 0 && (
                <span className="saved-posts-count">{savedPosts.length}</span>
              )}
            </h3>

            {savedPosts.length === 0 ? (
              <div className="saved-posts-empty">
                <Bookmark size={28} className="saved-posts-empty-icon" />
                <p>No saved posts yet</p>
                <span>Tap the bookmark icon on any post to save it here</span>
              </div>
            ) : (
              <div className="saved-posts-list">
                {savedPosts.map((post) => (
                  <div key={post.id} className="saved-post-item">
                    <div
                      className="saved-post-info"
                      onClick={() => handleGoToPost(post.id)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => e.key === 'Enter' && handleGoToPost(post.id)}
                      title="Go to post"
                    >
                      <span className="saved-post-author">{post.author.name}</span>
                      <p className="saved-post-preview">{post.content.slice(0, 72)}{post.content.length > 72 ? '…' : ''}</p>
                      <div className="saved-post-meta">
                        <span className={`saved-post-badge ${getCategoryBadgeClass(post.category)}`}>{post.category}</span>
                        <span className="saved-post-time">{formatTimestamp(post.createdAt)}</span>
                      </div>
                    </div>
                    <button
                      className="saved-post-remove"
                      title="Remove bookmark"
                      aria-label="Remove bookmark"
                      onClick={() => handleBookmark(post.id)}
                    >
                      <BookmarkMinus size={15} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* Profile Modal */}
      {selectedUser && (
        <ProfileModal user={selectedUser} onClose={() => setSelectedUser(null)} />
      )}
    </div>
  );
}

export default Community;
