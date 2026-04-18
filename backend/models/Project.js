import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema({
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
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
    positionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project.openPositions'
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
  tasks: [{
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    status: { type: String, enum: ['pending', 'in-progress', 'completed'], default: 'pending' },
    priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    assigneeId: { type: String, default: '' },
    dueDate: { type: String, default: '' },
    steps: [{
      id: { type: String },
      text: { type: String },
      done: { type: Boolean, default: false }
    }],
    createdBy: { type: String },
    createdById: { type: String },
    createdAt: { type: Date, default: Date.now }
  }]
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
