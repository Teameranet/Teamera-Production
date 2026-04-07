import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  recipientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['NEW_APPLICATION', 'APPLICATION_ACCEPTED', 'APPLICATION_REJECTED', 'MEMBER_REMOVED', 'MEMBER_QUIT', 'INVITATION_RECEIVED'],
    required: true
  },
  message: {
    type: String,
    required: true
  },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project'
  },
  projectName: { type: String },
  positionName: { type: String },
  actorName: { type: String }, // member name or owner name depending on context
  read: {
    type: Boolean,
    default: false
  },
  navigationPath: { type: String, default: '/dashboard' },
  navigationState: { type: mongoose.Schema.Types.Mixed }
}, { timestamps: true });

export default mongoose.model('Notification', notificationSchema);
