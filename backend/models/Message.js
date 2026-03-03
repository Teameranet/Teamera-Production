import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  senderName: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: [true, 'Message content is required'],
    maxlength: [2000, 'Message must be less than 2000 characters']
  },
  type: {
    type: String,
    enum: ['text', 'file', 'image', 'system'],
    default: 'text'
  },
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message',
    default: null
  },
  reactions: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    emoji: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Index for efficient querying
messageSchema.index({ projectId: 1, createdAt: -1 });
messageSchema.index({ senderId: 1 });

const Message = mongoose.model('Message', messageSchema);

export default Message;
