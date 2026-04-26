import mongoose from 'mongoose';

// ── Comment sub-schema ────────────────────────────────────────────────────────
const commentSchema = new mongoose.Schema(
  {
    author: {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
      name: { type: String, required: true, trim: true },
      title: { type: String, default: '' },
      role: { type: String, default: 'user' },
      avatar: { type: String, default: null },
    },
    text: {
      type: String,
      trim: true,
      maxlength: [2000, 'Comment must be less than 2000 characters'],
      default: '',
    },
    attachment: {
      name: { type: String, default: null },
      size: { type: String, default: null },
      url: { type: String, default: null },
    },
    // Denormalised reply-to snapshot (null if not a reply)
    replyTo: {
      commentId: { type: mongoose.Schema.Types.ObjectId, default: null },
      author: {
        name: { type: String, default: null },
        role: { type: String, default: null },
      },
      text: { type: String, default: null },
    },
    likes: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

// ── Post schema ───────────────────────────────────────────────────────────────
const postSchema = new mongoose.Schema(
  {
    author: {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
      name: { type: String, required: true, trim: true },
      title: { type: String, default: '' },
      role: { type: String, default: 'user' },
      avatar: { type: String, default: null },
    },
    category: {
      type: String,
      enum: ['General', 'Tech', 'Design', 'Marketing', 'Project Ideas', 'Help'],
      default: 'General',
    },
    content: {
      type: String,
      required: [true, 'Post content is required'],
      trim: true,
      maxlength: [5000, 'Post must be less than 5000 characters'],
    },
    tags: [{ type: String, trim: true, lowercase: true }],
    attachment: {
      name: { type: String, default: null },
      size: { type: String, default: null },
      url: { type: String, default: null },
    },
    image: { type: String, default: null },
    likes: { type: Number, default: 0, min: 0 },
    // Array of userIds who liked this post (for toggling)
    likedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    // Array of userIds who bookmarked this post
    bookmarkedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    comments: [commentSchema],
  },
  { timestamps: true }
);

// ── Indexes ───────────────────────────────────────────────────────────────────
postSchema.index({ category: 1, createdAt: -1 });
postSchema.index({ 'author.userId': 1 });
postSchema.index({ tags: 1 });
postSchema.index({ content: 'text', 'author.name': 'text', tags: 'text' });

const Post = mongoose.model('Post', postSchema);

export default Post;
