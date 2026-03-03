import mongoose from 'mongoose';

const hackathonSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Hackathon title is required'],
    trim: true,
    maxlength: [200, 'Title must be less than 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    maxlength: [2000, 'Description must be less than 2000 characters']
  },
  startDate: {
    type: Date,
    required: [true, 'Start date is required']
  },
  endDate: {
    type: Date,
    required: [true, 'End date is required']
  },
  prize: {
    type: String,
    default: ''
  },
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  status: {
    type: String,
    enum: ['upcoming', 'ongoing', 'completed', 'cancelled'],
    default: 'upcoming'
  },
  categories: [{
    type: String
  }],
  maxParticipants: {
    type: Number,
    default: null
  },
  organizerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  location: {
    type: String,
    default: 'Online'
  },
  registrationDeadline: {
    type: Date
  }
}, {
  timestamps: true
});

// Index for search and filtering
hackathonSchema.index({ title: 'text', description: 'text' });
hackathonSchema.index({ status: 1 });
hackathonSchema.index({ startDate: 1 });

const Hackathon = mongoose.model('Hackathon', hackathonSchema);

export default Hackathon;
