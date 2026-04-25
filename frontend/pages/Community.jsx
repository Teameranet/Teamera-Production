import { useState, useRef } from 'react';
import {
  Heart, MessageCircle, Share2, Bookmark, Paperclip, Image,
  Send, Search, Hash, TrendingUp, Users, Trash2, Download,
  ChevronDown, ChevronUp, SlidersHorizontal, X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import UserAvatar from '../components/UserAvatar';
import ProfileModal from '../components/ProfileModal';
import './Community.css';

// ─── Mock Data ────────────────────────────────────────────────────────────────

const INITIAL_POSTS = [
  {
    id: '1',
    author: {
      name: 'Alex Rivera',
      title: 'Full Stack Developer',
      role: 'developer',
    },
    category: 'Tech',
    content:
      'Just shipped a new feature using React Server Components and I have to say — the mental model shift is real. Moving data-fetching to the server cuts client bundle size dramatically and makes async waterfalls a thing of the past. If you haven\'t tried RSC yet, now is a great time to experiment. Happy to answer questions or share the approach we used!',
    likes: 24,
    liked: false,
    bookmarked: false,
    comments: [
      {
        id: 'c1',
        author: { name: 'Jordan Lee', role: 'developer' },
        text: 'Great write-up! Did you run into any issues with third-party libraries that rely on client context?',
        timestamp: '1h ago',
        likes: 3,
      },
      {
        id: 'c2',
        author: { name: 'Mia Torres', role: 'designer' },
        text: 'This is super helpful, bookmarking for our next sprint.',
        timestamp: '45m ago',
        likes: 1,
      },
    ],
    timestamp: '2h ago',
    tags: ['#react', '#webdev', '#rsc'],
    attachment: null,
    image: null,
  },
  {
    id: '2',
    author: {
      name: 'Sarah Chen',
      title: 'UI/UX Designer',
      role: 'designer',
    },
    category: 'Design',
    content:
      'Working on a new design system for our startup and the hardest part isn\'t the components — it\'s the tokens. Getting spacing, typography, and color scales to feel cohesive across light and dark modes takes way more iteration than expected. Currently using Figma Variables synced to CSS custom properties. Anyone else gone through this process? Would love to compare notes.',
    likes: 18,
    liked: false,
    bookmarked: false,
    comments: [
      {
        id: 'c3',
        author: { name: 'Alex Rivera', role: 'developer' },
        text: 'We did exactly this! The Figma → CSS token pipeline is a game changer once it clicks.',
        timestamp: '3h ago',
        likes: 5,
      },
    ],
    timestamp: '4h ago',
    tags: ['#design', '#ux', '#designsystem'],
    attachment: null,
    image: null,
  },
  {
    id: '3',
    author: {
      name: 'Marcus Johnson',
      title: 'Startup Founder',
      role: 'founder',
    },
    category: 'Project Ideas',
    content:
      'Looking for a technical co-founder for my EdTech startup. We\'re building an adaptive learning platform that uses spaced repetition and AI-generated practice problems to help adult learners upskill faster. I have the product vision, early user research, and a small seed round lined up. What I need is someone who loves education, can architect a scalable backend, and wants to own the technical roadmap. DM me if this resonates!',
    likes: 31,
    liked: false,
    bookmarked: false,
    comments: [
      {
        id: 'c4',
        author: { name: 'Priya Patel', role: 'professional' },
        text: 'This sounds really exciting. What\'s the target learner demographic?',
        timestamp: '5h ago',
        likes: 2,
      },
      {
        id: 'c5',
        author: { name: 'Jordan Lee', role: 'developer' },
        text: 'Sent you a DM — I\'ve been building in the EdTech space for 3 years.',
        timestamp: '4h ago',
        likes: 4,
      },
    ],
    timestamp: '6h ago',
    tags: ['#startup', '#edtech', '#cofounders'],
    attachment: { name: 'pitch-deck-v2.pdf', size: '2.4 MB' },
    image: null,
  },
  {
    id: '4',
    author: {
      name: 'Priya Patel',
      title: 'Product Manager',
      role: 'professional',
    },
    category: 'Help',
    content:
      'Anyone have experience with user research for B2B products? I\'m trying to figure out the best way to recruit enterprise users for discovery interviews. Cold outreach has a terrible response rate and our sales team is protective of their relationships. Considering LinkedIn, UserInterviews.com, or partnering with industry communities. What\'s worked for you?',
    likes: 9,
    liked: false,
    bookmarked: false,
    comments: [
      {
        id: 'c6',
        author: { name: 'Sarah Chen', role: 'designer' },
        text: 'UserInterviews.com worked well for us — pricey but fast. Also try posting in relevant Slack communities.',
        timestamp: '20h ago',
        likes: 6,
      },
    ],
    timestamp: '1d ago',
    tags: ['#productmanagement', '#research', '#b2b'],
    attachment: null,
    image: null,
  },
];

const TRENDING_TOPICS = [
  { tag: '#buildinpublic', count: 142 },
  { tag: '#reactjs', count: 98 },
  { tag: '#startup', count: 87 },
  { tag: '#designsystem', count: 64 },
  { tag: '#aitools', count: 59 },
  { tag: '#remotework', count: 41 },
];


const CATEGORIES = ['All', 'General', 'Tech', 'Design', 'Marketing', 'Project Ideas', 'Help'];
const COMPOSER_CATEGORIES = ['General', 'Tech', 'Design', 'Marketing', 'Project Ideas', 'Help'];

const COMMUNITY_STATS = {
  totalPosts: 1284,
  members: 3471,
  thisWeek: 94,
};

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

function generateId() {
  return Math.random().toString(36).slice(2, 10);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function CategoryBadge({ category }) {
  return (
    <span className={`post-category-badge ${getCategoryBadgeClass(category)}`}>
      {category}
    </span>
  );
}

function PostAttachment({ attachment }) {
  if (!attachment) return null;
  return (
    <div className="post-attachment">
      <Paperclip size={16} className="attachment-icon" />
      <div className="attachment-info">
        <span className="attachment-name">{attachment.name}</span>
        <span className="attachment-size">{attachment.size}</span>
      </div>
      <button className="download-btn" title="Download" aria-label="Download attachment">
        <Download size={16} />
      </button>
    </div>
  );
}

function CommentItem({ comment, onAvatarClick }) {
  return (
    <div className="comment-item">
      <UserAvatar
        user={{ name: comment.author.name }}
        size="small"
        style={{ cursor: 'pointer' }}
        onClick={() => onAvatarClick(comment.author)}
      />
      <div className="comment-body">
        <span
          className="comment-author"
          onClick={() => onAvatarClick(comment.author)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && onAvatarClick(comment.author)}
        >
          {comment.author.name}
        </span>
        <p className="comment-text">{comment.text}</p>
        <span className="comment-meta">{comment.timestamp} · {comment.likes} likes</span>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

function Community() {
  const { user } = useAuth();

  // Feed state
  const [posts, setPosts] = useState(INITIAL_POSTS);
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Post composer state
  const [newPostText, setNewPostText] = useState('');
  const [newPostCategory, setNewPostCategory] = useState('General');
  const [showCreatePost, setShowCreatePost] = useState(false);

  // UI state
  const [showComments, setShowComments] = useState({});
  const [expandedPosts, setExpandedPosts] = useState({});
  const [commentInputs, setCommentInputs] = useState({});
  const [showMobileFilter, setShowMobileFilter] = useState(false);
  // Profile modal
  const [selectedUser, setSelectedUser] = useState(null);

  // File input ref
  const fileInputRef = useRef(null);

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleLike = (postId) => {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 }
          : p
      )
    );
  };

  const handleBookmark = (postId) => {
    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, bookmarked: !p.bookmarked } : p))
    );
  };

  const handleDeletePost = (postId) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  };

  const handlePost = () => {
    if (!newPostText.trim()) return;
    const newPost = {
      id: generateId(),
      author: {
        name: user?.name || 'You',
        title: user?.title || '',
        role: user?.role || 'developer',
      },
      category: newPostCategory,
      content: newPostText.trim(),
      likes: 0,
      liked: false,
      bookmarked: false,
      comments: [],
      timestamp: 'Just now',
      tags: [],
      attachment: null,
      image: null,
    };
    setPosts((prev) => [newPost, ...prev]);
    setNewPostText('');
    setNewPostCategory('General');
    setShowCreatePost(false);
  };

  const handleComposerKeyDown = (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      handlePost();
    }
  };

  const handleAddComment = (postId) => {
    const text = (commentInputs[postId] || '').trim();
    if (!text) return;
    const newComment = {
      id: generateId(),
      author: { name: user?.name || 'You', role: user?.role || 'developer' },
      text,
      timestamp: 'Just now',
      likes: 0,
    };
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId ? { ...p, comments: [...p.comments, newComment] } : p
      )
    );
    setCommentInputs((prev) => ({ ...prev, [postId]: '' }));
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
          p.tags.some((t) => t.toLowerCase().includes(q))
      );
    }

    return filtered;
  };

  const filteredPosts = filterPosts();

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
        </header>
        <div className="community-search-bar">
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

          {/* Mobile filter drawer */}
          {showMobileFilter && (
            <div className="mobile-filter-drawer">
              <p className="mobile-filter-label">Category</p>
              <div className="mobile-filter-chips">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    className={`mobile-filter-chip ${activeCategory === cat ? 'active' : ''}`}
                    onClick={() => {
                      setActiveCategory(cat);
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
            {TRENDING_TOPICS.map((item) => (
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
            ))}
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
                    <button
                      className="composer-icon-btn"
                      title="Add image"
                      aria-label="Add image"
                      type="button"
                    >
                      <Image size={18} />
                    </button>
                    <span className="composer-hint">Ctrl+Enter to post</span>
                  </div>
                  <div className="composer-right-btns">
                    <button
                      className="composer-cancel-btn"
                      onClick={() => {
                        setShowCreatePost(false);
                        setNewPostText('');
                      }}
                      type="button"
                    >
                      Cancel
                    </button>
                    <button
                      className="post-btn"
                      onClick={handlePost}
                      disabled={!newPostText.trim()}
                      type="button"
                    >
                      Post
                    </button>
                  </div>
                </div>
                {/* Hidden file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  style={{ display: 'none' }}
                  aria-hidden="true"
                />
              </>
            )}
          </div>

          {/* Posts */}
          {filteredPosts.length === 0 ? (
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
                <article key={post.id} className="post-card">
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
                          {post.author.title} · {post.timestamp}
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

                    <button className="action-btn" aria-label="Share post">
                      <Share2 size={16} />
                      <span>Share</span>
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
                      {post.comments.map((comment) => (
                        <CommentItem
                          key={comment.id}
                          comment={comment}
                          onAvatarClick={(author) => setSelectedUser(author)}
                        />
                      ))}

                      {/* Comment input */}
                      <div className="comment-input-row">
                        <UserAvatar user={user || { name: 'You' }} size="small" />
                        <input
                          type="text"
                          className="comment-input"
                          placeholder="Write a comment…"
                          value={commentInputs[post.id] || ''}
                          onChange={(e) =>
                            setCommentInputs((prev) => ({
                              ...prev,
                              [post.id]: e.target.value,
                            }))
                          }
                          onKeyDown={(e) => handleCommentKeyDown(e, post.id)}
                          aria-label="Write a comment"
                        />
                        <button
                          className="send-comment-btn"
                          onClick={() => handleAddComment(post.id)}
                          disabled={!(commentInputs[post.id] || '').trim()}
                          aria-label="Send comment"
                        >
                          <Send size={16} />
                        </button>
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
                <div className="stat-number">{COMMUNITY_STATS.totalPosts.toLocaleString()}</div>
                <div className="stat-label">Total Posts</div>
              </div>
              <div className="stat-item-community">
                <div className="stat-number">{COMMUNITY_STATS.members.toLocaleString()}</div>
                <div className="stat-label">Members</div>
              </div>
              <div className="stat-item-community" style={{ gridColumn: '1 / -1' }}>
                <div className="stat-number">{COMMUNITY_STATS.thisWeek}</div>
                <div className="stat-label">Posts This Week</div>
              </div>
            </div>
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
