import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Project title is required'],
    trim: true,
    maxlength: [200, 'Title must be less than 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Project description is required']
  },
  stage: {
    type: String,
    enum: ['Ideation Stage', 'Idea Validation', 'MVP Development', 'Beta Testing', 'Market Ready', 'Scaling'],
    default: 'Ideation Stage'
  },
  industry: {
    type: String,
    required: [true, 'Industry is required']
  },
  teamMembers: [{
    id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false
    },
    name: {
      type: String,
      required: true
    },
    role: {
      type: String,
      required: true
    },
    avatar: String,
    email: String,
    applicantColor: String
  }],
  openPositions: [{
    role: String,
    skills: [String],
    isPaid: Boolean
  }],
  funding: {
    type: String,
    default: ''
  },
  timeline: {
    type: String,
    default: ''
  },
  applications: {
    type: Number,
    default: 0
  },
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'archived'],
    default: 'active'
  },
  visibility: {
    type: String,
    enum: ['public', 'private'],
    default: 'public'
  }
}, {
  timestamps: true
});

// Index for search optimization
projectSchema.index({ title: 'text', description: 'text' });
projectSchema.index({ ownerId: 1 });
projectSchema.index({ stage: 1 });
projectSchema.index({ industry: 1 });

const Project = mongoose.model('Project', projectSchema);

export default Project;
