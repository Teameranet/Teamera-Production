import Post from '../../models/Post.js';
import { successResponse, errorResponse, asyncHandler, sanitizeInput } from '../../utils/helpers.js';
import { 
  addCommunityClient, 
  removeCommunityClient, 
  broadcastToCommunity 
} from '../../utils/communitySseClients.js';

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Format a post document for the frontend.
 * Adds `liked` and `bookmarked` boolean flags relative to the requesting user.
 */
const formatPost = (post, userId) => {
  const obj = post.toObject ? post.toObject() : post;
  const uid = userId ? userId.toString() : null;

  return {
    ...obj,
    id: obj._id.toString(),
    liked: uid ? obj.likedBy.some((id) => id.toString() === uid) : false,
    bookmarked: uid ? obj.bookmarkedBy.some((id) => id.toString() === uid) : false,
    // Remove internal arrays from response — client only needs the booleans
    likedBy: undefined,
    bookmarkedBy: undefined,
    comments: (obj.comments || []).map((c) => ({
      ...c,
      id: c._id.toString(),
    })),
  };
};

// ── SSE Stream ────────────────────────────────────────────────────────────────

/**
 * GET /api/community/stream
 * Server-Sent Events endpoint for real-time community updates
 */
export const streamCommunity = asyncHandler(async (req, res) => {
  const { userId } = req.query;

  if (!userId) {
    return res.status(400).json(errorResponse('userId is required', 'MISSING_USER_ID'));
  }

  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering

  // Send initial connection message
  res.write(`data: ${JSON.stringify({ type: 'connected', message: 'Community stream connected' })}\n\n`);

  // Add client to the community SSE clients map
  addCommunityClient(userId, res);

  // Handle client disconnect
  req.on('close', () => {
    removeCommunityClient(userId);
  });
});

// ── Posts ─────────────────────────────────────────────────────────────────────

/**
 * GET /api/community/posts
 * Query params: category, search, page, limit
 */
export const getPosts = asyncHandler(async (req, res) => {
  const { category, search, page = 1, limit = 20 } = req.query;
  const userId = req.query.userId || null;

  const filter = {};

  if (category && category !== 'All') {
    filter.category = category;
  }

  if (search && search.trim()) {
    filter.$text = { $search: search.trim() };
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const total = await Post.countDocuments(filter);

  const posts = await Post.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit))
    .lean();

  // lean() returns plain objects — add id and boolean flags manually
  const formatted = posts.map((p) => {
    const uid = userId ? userId.toString() : null;
    return {
      ...p,
      id: p._id.toString(),
      liked: uid ? (p.likedBy || []).some((id) => id.toString() === uid) : false,
      bookmarked: uid ? (p.bookmarkedBy || []).some((id) => id.toString() === uid) : false,
      likedBy: undefined,
      bookmarkedBy: undefined,
      comments: (p.comments || []).map((c) => ({ ...c, id: c._id.toString() })),
    };
  });

  res.json(
    successResponse(
      {
        posts: formatted,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalItems: total,
          itemsPerPage: parseInt(limit),
          hasNextPage: skip + formatted.length < total,
          hasPrevPage: parseInt(page) > 1,
        },
      },
      'Posts retrieved successfully'
    )
  );
});

/**
 * POST /api/community/posts
 * Body: { content, category, tags, author: { userId, name, title, role, avatar }, attachment? }
 */
export const createPost = asyncHandler(async (req, res) => {
  const { content, category, tags, author, attachment } = req.body;

  if (!content || !content.trim()) {
    return res.status(400).json(errorResponse('Post content is required', 'MISSING_CONTENT'));
  }

  if (!author || !author.name) {
    return res.status(400).json(errorResponse('Author information is required', 'MISSING_AUTHOR'));
  }

  // Parse tags from content (words starting with #) if not provided
  let parsedTags = tags || [];
  if (!parsedTags.length) {
    const matches = content.match(/#\w+/g);
    if (matches) parsedTags = matches.map((t) => t.toLowerCase());
  }

  const post = new Post({
    author: {
      userId: author.userId || null,
      name: sanitizeInput(author.name),
      title: sanitizeInput(author.title || ''),
      role: author.role || 'user',
      avatar: author.avatar || null,
    },
    category: category || 'General',
    content: sanitizeInput(content),
    tags: parsedTags.map((t) => sanitizeInput(t)),
    attachment: attachment && attachment.name
      ? { name: attachment.name, size: attachment.size, url: attachment.url || null }
      : undefined,
  });

  await post.save();

  const formattedPost = formatPost(post, author.userId);

  // Broadcast new post to all connected clients
  broadcastToCommunity({
    type: 'newPost',
    payload: formattedPost,
  });

  res.status(201).json(successResponse(formattedPost, 'Post created successfully'));
});

/**
 * PUT /api/community/posts/:postId
 * Body: { content, category, userId }
 */
export const updatePost = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  const { content, category, userId } = req.body;

  if (!content || !content.trim()) {
    return res.status(400).json(errorResponse('Post content is required', 'MISSING_CONTENT'));
  }

  const post = await Post.findById(postId);
  if (!post) {
    return res.status(404).json(errorResponse('Post not found', 'POST_NOT_FOUND'));
  }

  // Only the author can edit their post
  if (userId && post.author.userId && post.author.userId.toString() !== userId.toString()) {
    return res.status(403).json(errorResponse('Not authorised to edit this post', 'FORBIDDEN'));
  }

  post.content = sanitizeInput(content.trim());
  if (category) post.category = category;

  // Re-parse tags from updated content
  const matches = post.content.match(/#\w+/g);
  post.tags = matches ? matches.map((t) => t.toLowerCase()) : [];

  await post.save();

  const formattedPost = formatPost(post, userId);

  // Broadcast update to all connected clients
  broadcastToCommunity({
    type: 'updatePost',
    payload: formattedPost,
  });

  res.json(successResponse(formattedPost, 'Post updated successfully'));
});

/**
 * DELETE /api/community/posts/:postId
 * Query param: userId (for ownership check)
 */
export const deletePost = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  const { userId } = req.query;

  const post = await Post.findById(postId);
  if (!post) {
    return res.status(404).json(errorResponse('Post not found', 'POST_NOT_FOUND'));
  }

  // Only the author can delete their post
  if (userId && post.author.userId && post.author.userId.toString() !== userId.toString()) {
    return res.status(403).json(errorResponse('Not authorised to delete this post', 'FORBIDDEN'));
  }

  await Post.findByIdAndDelete(postId);

  // Broadcast post deletion to all connected clients
  broadcastToCommunity({
    type: 'deletePost',
    payload: { postId },
  });

  res.json(successResponse({ postId }, 'Post deleted successfully'));
});

// ── Like / Bookmark toggles ───────────────────────────────────────────────────

/**
 * POST /api/community/posts/:postId/like
 * Body: { userId }
 */
export const toggleLike = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json(errorResponse('userId is required', 'MISSING_USER_ID'));
  }

  const post = await Post.findById(postId);
  if (!post) {
    return res.status(404).json(errorResponse('Post not found', 'POST_NOT_FOUND'));
  }

  const alreadyLiked = post.likedBy.some((id) => id.toString() === userId.toString());

  if (alreadyLiked) {
    post.likedBy = post.likedBy.filter((id) => id.toString() !== userId.toString());
    post.likes = Math.max(0, post.likes - 1);
  } else {
    post.likedBy.push(userId);
    post.likes += 1;
  }

  await post.save();

  // Broadcast like update to all connected clients
  broadcastToCommunity({
    type: 'likeUpdate',
    payload: {
      postId,
      liked: !alreadyLiked,
      likes: post.likes,
    },
  });

  res.json(
    successResponse(
      { liked: !alreadyLiked, likes: post.likes },
      alreadyLiked ? 'Post unliked' : 'Post liked'
    )
  );
});

/**
 * POST /api/community/posts/:postId/bookmark
 * Body: { userId }
 */
export const toggleBookmark = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json(errorResponse('userId is required', 'MISSING_USER_ID'));
  }

  const post = await Post.findById(postId);
  if (!post) {
    return res.status(404).json(errorResponse('Post not found', 'POST_NOT_FOUND'));
  }

  const alreadyBookmarked = post.bookmarkedBy.some((id) => id.toString() === userId.toString());

  if (alreadyBookmarked) {
    post.bookmarkedBy = post.bookmarkedBy.filter((id) => id.toString() !== userId.toString());
  } else {
    post.bookmarkedBy.push(userId);
  }

  await post.save();

  res.json(
    successResponse(
      { bookmarked: !alreadyBookmarked },
      alreadyBookmarked ? 'Bookmark removed' : 'Post bookmarked'
    )
  );
});

// ── Comments ──────────────────────────────────────────────────────────────────

/**
 * POST /api/community/posts/:postId/comments
 * Body: { text, author: { userId, name, role, avatar }, attachment?, replyTo? }
 */
export const addComment = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  const { text, author, attachment, replyTo } = req.body;

  if (!text && !attachment) {
    return res.status(400).json(errorResponse('Comment text or attachment is required', 'MISSING_CONTENT'));
  }

  if (!author || !author.name) {
    return res.status(400).json(errorResponse('Author information is required', 'MISSING_AUTHOR'));
  }

  const post = await Post.findById(postId);
  if (!post) {
    return res.status(404).json(errorResponse('Post not found', 'POST_NOT_FOUND'));
  }

  const comment = {
    author: {
      userId: author.userId || null,
      name: sanitizeInput(author.name),
      title: sanitizeInput(author.title || ''),
      role: author.role || 'user',
      avatar: author.avatar || null,
    },
    text: text ? sanitizeInput(text) : '',
    attachment: attachment && attachment.name
      ? { name: attachment.name, size: attachment.size, url: attachment.url || null }
      : undefined,
    replyTo: replyTo
      ? {
          commentId: replyTo.commentId || null,
          author: { name: replyTo.author?.name || null, role: replyTo.author?.role || null },
          text: replyTo.text || null,
        }
      : null,
    likes: 0,
  };

  post.comments.push(comment);
  await post.save();

  const savedComment = post.comments[post.comments.length - 1];
  const formattedComment = { ...savedComment.toObject(), id: savedComment._id.toString() };

  // Broadcast new comment to all connected clients
  broadcastToCommunity({
    type: 'newComment',
    payload: {
      postId,
      comment: formattedComment,
    },
  });

  res.status(201).json(
    successResponse(
      formattedComment,
      'Comment added successfully'
    )
  );
});

/**
 * DELETE /api/community/posts/:postId/comments/:commentId
 * Query param: userId (for ownership check)
 */
export const deleteComment = asyncHandler(async (req, res) => {
  const { postId, commentId } = req.params;
  const { userId } = req.query;

  const post = await Post.findById(postId);
  if (!post) {
    return res.status(404).json(errorResponse('Post not found', 'POST_NOT_FOUND'));
  }

  const comment = post.comments.id(commentId);
  if (!comment) {
    return res.status(404).json(errorResponse('Comment not found', 'COMMENT_NOT_FOUND'));
  }

  // Only the comment author can delete (ownership check is advisory — no hard auth here)
  if (userId && comment.author.userId && comment.author.userId.toString() !== userId.toString()) {
    return res.status(403).json(errorResponse('Not authorised to delete this comment', 'FORBIDDEN'));
  }

  post.comments = post.comments.filter((c) => c._id.toString() !== commentId);
  await post.save();

  // Broadcast comment deletion to all connected clients
  broadcastToCommunity({
    type: 'deleteComment',
    payload: {
      postId,
      commentId,
    },
  });

  res.json(successResponse({ commentId }, 'Comment deleted successfully'));
});

// ── Trending & Stats ──────────────────────────────────────────────────────────

/**
 * GET /api/community/trending
 * Returns top hashtags by post count over the last 30 days.
 */
export const getTrending = asyncHandler(async (req, res) => {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const result = await Post.aggregate([
    { $match: { createdAt: { $gte: thirtyDaysAgo }, tags: { $exists: true, $ne: [] } } },
    { $unwind: '$tags' },
    { $group: { _id: '$tags', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 10 },
    { $project: { _id: 0, tag: '$_id', count: 1 } },
  ]);

  res.json(successResponse(result, 'Trending topics retrieved successfully'));
});

/**
 * GET /api/community/stats
 * Returns total posts, total members (users who have posted), posts this week.
 */
export const getStats = asyncHandler(async (req, res) => {
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [totalPosts, thisWeek, membersResult] = await Promise.all([
    Post.countDocuments(),
    Post.countDocuments({ createdAt: { $gte: oneWeekAgo } }),
    Post.distinct('author.userId', { 'author.userId': { $ne: null } }),
  ]);

  res.json(
    successResponse(
      {
        totalPosts,
        members: membersResult.length,
        thisWeek,
      },
      'Community stats retrieved successfully'
    )
  );
});

/**
 * GET /api/community/posts/bookmarked
 * Query param: userId — returns all posts bookmarked by this user.
 */
export const getBookmarkedPosts = asyncHandler(async (req, res) => {
  const { userId } = req.query;

  if (!userId) {
    return res.status(400).json(errorResponse('userId is required', 'MISSING_USER_ID'));
  }

  const posts = await Post.find({ bookmarkedBy: userId }).sort({ createdAt: -1 }).lean();

  const formatted = posts.map((p) => ({
    ...p,
    id: p._id.toString(),
    liked: (p.likedBy || []).some((id) => id.toString() === userId.toString()),
    bookmarked: true,
    likedBy: undefined,
    bookmarkedBy: undefined,
    comments: (p.comments || []).map((c) => ({ ...c, id: c._id.toString() })),
  }));

  res.json(successResponse(formatted, 'Bookmarked posts retrieved successfully'));
});
