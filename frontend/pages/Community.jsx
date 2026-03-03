
import { useState, useEffect, useRef } from 'react';
import { Search, MessageSquare, Filter, X, Send, Paperclip, Download, User, Tag, Heart } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import UserAvatar from '../components/UserAvatar';
import ProfileModal from '../components/ProfileModal';
import './Community.css';

// Utility function to get file icon based on file type
const getFileIcon = (fileType) => {
  if (!fileType) return '📁';

  switch (fileType.toLowerCase()) {
    case 'pdf':
      return '📄';
    case 'figma':
      return '🎨';
    case 'doc':
    case 'docx':
      return '📝';
    case 'xls':
    case 'xlsx':
      return '📊';
    case 'ppt':
    case 'pptx':
      return '📑';
    case 'zip':
    case 'rar':
      return '🗜️';
    case 'image':
    case 'png':
    case 'jpg':
      return '🖼️';
    default:
      return '📁';
  }
};

// Create Post Modal Component
function CreatePostModal({ onClose, onSubmit }) {
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('General');
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  // Updated category options for creating new posts
  const categories = ['General', 'Announcements', 'Project Showcase', 'Job Opportunities', 'Help & Support'];

  useEffect(() => {
    // Focus textarea when modal opens
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  const handleKeyDown = (e) => {
    // Implement Ctrl+Enter functionality to submit post
    if (e.key === 'Enter' && e.ctrlKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    if (content.trim()) {
      onSubmit({
        content,
        category,
        attachedFiles
      });
      onClose();
    }
  };

  const processFiles = (files) => {
    const fileArray = Array.from(files);
    const newFiles = fileArray.map(file => ({
      id: Date.now() + Math.random(),
      name: file.name,
      size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
      type: file.name.split('.').pop().toLowerCase(),
      file: file
    }));

    setAttachedFiles(prev => [...prev, ...newFiles]);
  };

  const handleFileChange = (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFiles(files);
    }
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processFiles(files);
    }
  };

  const removeFile = (fileId) => {
    setAttachedFiles(prev => prev.filter(file => file.id !== fileId));
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="create-post-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Create Post</h2>
          <button className="close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>
        <div className="modal-content">
          <div className="form-group">
            <label htmlFor="post-category">Category</label>
            <select
              id="post-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="post-content">Content</label>
            <textarea
              ref={textareaRef}
              id="post-content"
              placeholder="What's on your mind? (Use Ctrl+Enter to submit)"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={6}
            />
          </div>

          {/* Drag and Drop File Area */}
          <div className="attach-file-section">
            <label className="attach-file-label">Attach File</label>
            <div
              className={`drag-drop-area ${isDragOver ? 'drag-over' : ''}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="drag-drop-content">
                <div className="drag-drop-icon">
                  📁
                </div>
                <div className="drag-drop-text">
                  <p className="drag-drop-primary">
                    {isDragOver ? 'Drop files here' : 'Drag and drop files here'}
                  </p>
                  <p className="drag-drop-secondary">
                    or <span className="click-to-browse">click to browse</span>
                  </p>
                </div>
              </div>

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileChange}
                style={{ display: 'none' }}
                multiple
                accept="*/*"
              />
            </div>

            {/* Attached Files Display */}
            {attachedFiles.length > 0 && (
              <div className="attached-files-list">
                {attachedFiles.map((file) => (
                  <div key={file.id} className="attached-file-item">
                    <div className="file-icon">
                      {getFileIcon(file.type)}
                    </div>
                    <div className="file-info">
                      <span className="file-name">{file.name}</span>
                      <span className="file-size">{file.size}</span>
                    </div>
                    <button
                      className="remove-file-btn"
                      onClick={() => removeFile(file.id)}
                      title="Remove file"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="modal-footer">
          {/* <div className="file-count">
            {attachedFiles.length > 0 && (
              <span className="files-attached">
                {attachedFiles.length} file{attachedFiles.length > 1 ? 's' : ''} attached
              </span>
            )}
          </div> */}
          <button
            className="submit-btn"
            onClick={handleSubmit}
            disabled={!content.trim()}
          >
            <Send size={20} />
            Post
          </button>
        </div>
      </div>
    </div>
  );
}

function Community() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showCreatePostModal, setShowCreatePostModal] = useState(false);
  const [posts, setPosts] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [expandedComments, setExpandedComments] = useState(new Set());
  const [commentInputs, setCommentInputs] = useState({});

  // Map user role to display title (match Profile page behavior)
  const getRoleDisplayTitle = (role) => {
    const roleMap = {
      'founder': 'The Founder',
      'professional': 'The Professional',
      'investor': 'The Investor',
      'student': 'The Student'
    };
    return roleMap[role] || role || 'Developer';
  };

  // Mock data - in a real app, this would come from an API
  // Updated category options for filtering posts
  const categories = ['General', 'Announcements', 'Project Showcase', 'Job Opportunities', 'Help & Support'];

  // Mock members data for user profiles
  const mockMembers = [
    {
      id: '1',
      name: 'Ankit Kumar',
      title: 'Full Stack Developer',
      role: 'professional',
      location: 'Bangalore, India',
      bio: 'Passionate full-stack developer with 5+ years of experience in React, Node.js, and cloud technologies. Love building scalable applications and mentoring junior developers.',
      email: 'ankit.kumar@example.com',
      website: 'https://ankitkumar.dev',
      githubUrl: 'https://github.com/ankitkumar',
      linkedinUrl: 'https://linkedin.com/in/ankitkumar-dev',
      portfolioUrl: 'https://portfolio.ankitkumar.dev',
      experiences: [
        {
          title: 'Senior Full Stack Developer',
          company: 'TechCorp Solutions',
          duration: '2022 - Present',
          description: 'Leading development of microservices architecture and React applications. Mentoring junior developers and implementing best practices.'
        },
        {
          title: 'Full Stack Developer',
          company: 'StartupXYZ',
          duration: '2020 - 2022',
          description: 'Built and maintained multiple web applications using React, Node.js, and MongoDB. Collaborated with cross-functional teams.'
        }
      ],
      education: [
        {
          degree: 'Bachelor of Technology in Computer Science',
          institution: 'Indian Institute of Technology',
          duration: '2016 - 2020',
          description: 'Specialized in software engineering and data structures.'
        }
      ],
      skills: ['React', 'Node.js', 'JavaScript', 'TypeScript', 'MongoDB', 'AWS', 'Docker', 'GraphQL']
    },
    {
      id: '2',
      name: 'Priya Sharma',
      title: 'UI/UX Designer',
      role: 'professional',
      location: 'Mumbai, India',
      bio: 'Creative UI/UX designer with expertise in user-centered design and design systems. Passionate about creating intuitive and accessible digital experiences.',
      email: 'priya.sharma@example.com',
      website: 'https://priyasharma.design',
      githubUrl: 'https://github.com/priyasharma',
      linkedinUrl: 'https://linkedin.com/in/priyasharma-ux',
      portfolioUrl: 'https://dribbble.com/priyasharma',
      experiences: [
        {
          title: 'Senior UI/UX Designer',
          company: 'DesignStudio Pro',
          duration: '2021 - Present',
          description: 'Leading design for healthcare and fintech applications. Created comprehensive design systems and conducted user research.'
        },
        {
          title: 'UI/UX Designer',
          company: 'Creative Agency',
          duration: '2019 - 2021',
          description: 'Designed web and mobile applications for various clients. Collaborated with developers to ensure design implementation.'
        }
      ],
      education: [
        {
          degree: 'Master of Design',
          institution: 'National Institute of Design',
          duration: '2017 - 2019',
          description: 'Specialized in interaction design and user experience.'
        }
      ],
      skills: ['Figma', 'Adobe Creative Suite', 'Sketch', 'Prototyping', 'User Research', 'Design Systems', 'HTML/CSS']
    },
    {
      id: '3',
      name: 'Rahul Verma',
      title: 'Product Manager',
      role: 'professional',
      location: 'Delhi, India',
      bio: 'Strategic product manager with experience in fintech and blockchain technologies. Focused on building products that solve real-world problems.',
      email: 'rahul.verma@example.com',
      experiences: [
        {
          title: 'Senior Product Manager',
          company: 'FinTech Innovations',
          duration: '2020 - Present',
          description: 'Managing product roadmap for blockchain-based financial products. Leading cross-functional teams and driving product strategy.'
        },
        {
          title: 'Product Manager',
          company: 'Tech Solutions Inc',
          duration: '2018 - 2020',
          description: 'Managed product development lifecycle for B2B SaaS applications. Conducted market research and user interviews.'
        }
      ],
      education: [
        {
          degree: 'MBA in Technology Management',
          institution: 'Indian School of Business',
          duration: '2016 - 2018',
          description: 'Focused on technology strategy and product management.'
        }
      ],
      skills: ['Product Strategy', 'Agile', 'Data Analysis', 'User Research', 'Blockchain', 'Project Management', 'SQL']
    }
  ];

  // Sample posts with updated categories to match the new category system and comments
  const mockPosts = [
    {
      id: '1',
      userId: '1',
      author: 'Ankit Kumar',
      authorTitle: 'Full Stack Developer',
      content: 'Exciting news! We\'re launching a new React animation library next month. Stay tuned for the official release and documentation!',
      timestamp: '2 hours ago',
      likes: 12,
      comments: [
        {
          id: '1',
          userId: '2',
          author: 'Priya Sharma',
          content: 'This sounds amazing! Can\'t wait to see the documentation and examples.',
          timestamp: '1 hour ago',
          likes: 3
        },
        {
          id: '2',
          userId: '3',
          author: 'Rahul Verma',
          content: 'Will this be compatible with existing React projects? Looking forward to trying it out!',
          timestamp: '30 minutes ago',
          likes: 1
        }
      ],
      category: 'Announcements'
    },
    {
      id: '2',
      userId: '2',
      author: 'Priya Sharma',
      authorTitle: 'UI/UX Designer',
      content: 'Just completed my healthcare design system project! Check out the comprehensive component library and design tokens I\'ve created.',
      timestamp: '5 hours ago',
      likes: 8,
      comments: [
        {
          id: '3',
          userId: '1',
          author: 'Ankit Kumar',
          content: 'This looks really professional! The accessibility considerations are spot on.',
          timestamp: '4 hours ago',
          likes: 2
        }
      ],
      category: 'Project Showcase',
      attachedFile: {
        name: 'HealthcareDesignSystem.fig',
        size: '2.3 MB',
        type: 'figma'
      }
    },
    {
      id: '3',
      userId: '3',
      author: 'Rahul Verma',
      authorTitle: 'Product Manager',
      content: 'We\'re hiring! Looking for talented developers and designers to join our fintech startup. Exciting blockchain projects ahead. Apply now!',
      timestamp: '1 day ago',
      likes: 24,
      comments: [
        {
          id: '4',
          userId: '1',
          author: 'Ankit Kumar',
          content: 'Interested! What\'s the tech stack you\'re using?',
          timestamp: '23 hours ago',
          likes: 5
        },
        {
          id: '5',
          userId: '2',
          author: 'Priya Sharma',
          content: 'This sounds like a great opportunity! Are you looking for remote work as well?',
          timestamp: '22 hours ago',
          likes: 3
        }
      ],
      category: 'Job Opportunities'
    },
    {
      id: '4',
      userId: '1',
      author: 'Ankit Kumar',
      authorTitle: 'Full Stack Developer',
      content: 'Need help with microservices architecture? I\'ve shared our implementation guide. Feel free to ask questions or request clarifications!',
      timestamp: '2 days ago',
      likes: 18,
      comments: [],
      category: 'Help & Support',
      attachedFile: {
        name: 'MicroservicesArchitecture.pdf',
        size: '1.5 MB',
        type: 'pdf'
      }
    }
  ];

  // Initialize posts state with mock data
  useEffect(() => {
    setPosts(mockPosts);
  }, []);

  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.author.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || post.category === selectedCategory;
    const matchesTab = activeTab === 'all' ||
      (activeTab === 'discussions' && !post.attachedFile) ||
      (activeTab === 'resources' && post.attachedFile);

    return matchesSearch && matchesCategory && matchesTab;
  });

  const handleUserClick = async (memberId) => {
    try {
      // First check mock members (for demo users)
      const mockMember = mockMembers.find(m => m.id === memberId);
      if (mockMember) {
        const profileData = {
          ...mockMember,
          title: mockMember.title || getRoleDisplayTitle(mockMember.role)
        };
        setSelectedMember(profileData);
        setShowProfileModal(true);
        return;
      }

      // Try to fetch from backend API
      const response = await fetch(`/api/users/${memberId}/profile`);
      if (response.ok) {
        const result = await response.json();
        const userProfile = result.data;

        // Transform backend data to match ProfileModal expected format
        const profileData = {
          ...userProfile,
          title: userProfile.title || getRoleDisplayTitle(userProfile.role),
          // Use 'experiences' array from backend (not 'experience' string)
          experiences: Array.isArray(userProfile.experiences) ? userProfile.experiences : [],
          // Keep skills as array for ProfileModal
          skills: Array.isArray(userProfile.skills) ? userProfile.skills : [],
          // Ensure social media links are available
          githubUrl: userProfile.githubUrl || '',
          linkedinUrl: userProfile.linkedinUrl || '',
          portfolioUrl: userProfile.portfolioUrl || ''
        };

        setSelectedMember(profileData);
        setShowProfileModal(true);
        return;
      }

      // Fallback to current user data if it's the logged-in user
      if (user && user.id === memberId) {
        const profileData = {
          ...user,
          title: user.title || getRoleDisplayTitle(user.role),
          experiences: Array.isArray(user.experiences) ? user.experiences : [],
          skills: Array.isArray(user.skills) ? user.skills : []
        };
        setSelectedMember(profileData);
        setShowProfileModal(true);
        return;
      }

      // Final fallback - create basic profile
      const fallbackProfile = {
        id: memberId,
        name: 'User',
        title: 'Member',
        bio: 'No profile information available.',
        experiences: [],
        education: [],
        skills: []
      };

      setSelectedMember(fallbackProfile);
      setShowProfileModal(true);

    } catch (error) {
      console.error('Error fetching user profile:', error);

      // Error fallback
      const errorProfile = {
        id: memberId,
        name: 'User',
        title: 'Member',
        bio: 'Unable to load profile information.',
        experiences: [],
        education: [],
        skills: []
      };

      setSelectedMember(errorProfile);
      setShowProfileModal(true);
    }
  };

  const handleCreatePost = (postData) => {
    const newPost = {
      id: Date.now().toString(),
      userId: user?.id || '0',
      author: user?.name || 'Guest User',
      authorTitle: user?.title || getRoleDisplayTitle(user?.role),
      content: postData.content,
      timestamp: 'Just now',
      likes: 0,
      comments: [],
      category: postData.category,
      attachedFile: postData.attachedFiles && postData.attachedFiles.length > 0 ? postData.attachedFiles[0] : null
    };

    setPosts([newPost, ...posts]);
  };

  const toggleComments = (postId) => {
    const newExpanded = new Set(expandedComments);
    if (newExpanded.has(postId)) {
      newExpanded.delete(postId);
    } else {
      newExpanded.add(postId);
    }
    setExpandedComments(newExpanded);
  };

  const handleCommentSubmit = (postId) => {
    const commentText = commentInputs[postId]?.trim();
    if (!commentText) return;

    const newComment = {
      id: Date.now().toString(),
      userId: user?.id || '0',
      author: user?.name || 'Guest User',
      content: commentText,
      timestamp: 'Just now',
      likes: 0
    };

    setPosts(posts.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          comments: [...post.comments, newComment]
        };
      }
      return post;
    }));

    // Clear the input
    setCommentInputs(prev => ({
      ...prev,
      [postId]: ''
    }));
  };

  const handleCommentInputChange = (postId, value) => {
    setCommentInputs(prev => ({
      ...prev,
      [postId]: value
    }));
  };

  const handleCommentKeyDown = (e, postId) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleCommentSubmit(postId);
    }
  };

  return (
    <div className="community-container">
      <div className="community-header">
        <div className="header-content">
          <h1 style={{ color: 'white' }}>Community</h1>
          <p style={{ color: 'white' }}>Connect, share, and grow with fellow developers</p>
        </div>
        <button className="new-post-btn" onClick={() => setShowCreatePostModal(true)}>
          <MessageSquare size={20} />
          New Post
        </button>
      </div>

      <div className="community-filters">
        <div className="search-bar">
          <Search size={20} />
          <input
            type="text"
            placeholder="Search posts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button
          className="filter-toggle"
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter size={20} />
          <span className="filter-text">Filters</span>
          {selectedCategory && <span className="filter-indicator"></span>}
        </button>
      </div>

      {showFilters && (
        <div className="filters-panel">
          <div className="filter-group">
            <label htmlFor="category-filter">Category</label>
            <select
              id="category-filter"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
          <div className="filter-actions">
            <button
              className="clear-filters-btn"
              onClick={() => {
                setSelectedCategory('');
                setShowFilters(false);
              }}
            >
              Clear Filters
            </button>
          </div>
        </div>
      )}

      {/* <div className="tabs-container">
        <button
          className={`tab-button ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          <MessageSquare size={16} />
          All Posts
        </button>
        <button
          className={`tab-button ${activeTab === 'recent' ? 'active' : ''}`}
          onClick={() => setActiveTab('recent')}
        >
          <Clock size={16} />
          Recent
        </button>
        <button
          className={`tab-button ${activeTab === 'following' ? 'active' : ''}`}
          onClick={() => setActiveTab('following')}
        >
          <Users size={16} />
          Following
        </button>
      </div> */}

      <div className="community-feed">
        {/* Empty state */}
        {posts.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">
              <MessageSquare size={48} />
            </div>
            <h3>No Posts Yet</h3>
            <p>Be the first one to start a discussion!</p>
          </div>
        )}

        {/* Posts list */}
        <div className="posts-list">
          {filteredPosts.map(post => (
            <div key={post.id} className="post-card">
              <div className="post-header">
                <div className="post-author" onClick={() => handleUserClick(post.userId)}>
                  <UserAvatar user={{ name: post.author }} size="medium" />
                  <div className="author-info">
                    <span className="author-name">{post.author}</span>
                    <span className="author-title">{post.authorTitle}</span>
                  </div>
                </div>
                <div className="post-meta">
                  <span className="post-timestamp">{post.timestamp}</span>
                  <span className="post-category">{post.category}</span>
                </div>
              </div>
              <div className="post-content">
                <p>{post.content}</p>
                {post.attachedFile && (
                  <div className="attached-file">
                    <div className="file-icon">
                      {getFileIcon(post.attachedFile.type)}
                    </div>
                    <div className="file-info">
                      <span className="file-name">{post.attachedFile.name}</span>
                      <span className="file-size">{post.attachedFile.size}</span>
                    </div>
                    <button
                      className="download-btn"
                      title="Download file"
                      onClick={(e) => {
                        e.stopPropagation();
                        // In a real app, this would initiate a file download
                        alert('File download started');
                      }}
                    >
                      <Download size={18} />
                    </button>
                  </div>
                )}
              </div>
              <div className="post-actions">
                <button
                  className={`post-action-btn ${expandedComments.has(post.id) ? 'active' : ''}`}
                  onClick={() => toggleComments(post.id)}
                >
                  <MessageSquare size={18} />
                  {post.comments.length} Comments
                </button>
                <button className="post-action-btn">
                  <Heart size={18} />
                  {post.likes} Likes
                </button>
                <button className="post-action-btn">
                  <Tag size={18} />
                  Share
                </button>
              </div>

              {/* Comments Section */}
              {expandedComments.has(post.id) && (
                <div className="comments-section">
                  <div className="comments-list">
                    {post.comments.length === 0 ? (
                      <div className="no-comments">
                        <p>No comments yet. Be the first to comment!</p>
                      </div>
                    ) : (
                      post.comments.map(comment => (
                        <div key={comment.id} className="comment-item">
                          <UserAvatar user={{ name: comment.author }} size="small" />
                          <div className="comment-content">
                            <div className="comment-header">
                              <span className="comment-user">{comment.author}</span>
                              <span className="comment-time">{comment.timestamp}</span>
                            </div>
                            <p className="comment-text">{comment.content}</p>
                            <div className="comment-actions">
                              <button className="comment-action">
                                <Heart size={14} />
                                {comment.likes}
                              </button>
                              <button className="comment-action">Reply</button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Comment Input */}
                  <div className="comment-input">
                    <UserAvatar user={{ name: user?.name || 'Guest' }} size="small" />
                    <input
                      type="text"
                      placeholder="Write a comment..."
                      value={commentInputs[post.id] || ''}
                      onChange={(e) => handleCommentInputChange(post.id, e.target.value)}
                      onKeyDown={(e) => handleCommentKeyDown(e, post.id)}
                    />
                    <button
                      className="send-comment-btn"
                      onClick={() => handleCommentSubmit(post.id)}
                      disabled={!commentInputs[post.id]?.trim()}
                    >
                      <Send size={16} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {showCreatePostModal && (
        <CreatePostModal
          onClose={() => setShowCreatePostModal(false)}
          onSubmit={handleCreatePost}
        />
      )}

      {showProfileModal && selectedMember && (
        <ProfileModal
          user={selectedMember}
          onClose={() => {
            setShowProfileModal(false);
            setSelectedMember(null);
          }}
        />
      )}
    </div>
  );
}

export default Community; 