import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters long'],
    maxlength: [100, 'Name must be less than 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Invalid email format']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [0, 'Password is required'],
    select: false
  },
  avatar: {
    type: String,
    default: null
  },
  bio: {
    type: String,
    maxlength: [500, 'Bio must be less than 500 characters'],
    default: ''
  },
  title: {
    type: String,
    default: ''
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'moderator', 'founder', 'professional', 'investor', 'student'],
    default: 'user'
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active'
  },
  skills: [{
    name: {
      type: String,
      required: false
    },
    level: {
      type: String,
      enum: ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'],
      default: 'INTERMEDIATE'
    },
    years: {
      type: Number,
      default: 1
    }
  }],
  experience: {
    type: String,
    default: ''
  },
  location: {
    type: String,
    default: ''
  },
  githubUrl: {
    type: String,
    default: ''
  },
  linkedinUrl: {
    type: String,
    default: ''
  },
  portfolioUrl: {
    type: String,
    default: ''
  },
  experiences: [{
    id: Number,
    title: String,
    company: String,
    period: String,
    description: String,
    technologies: [String]
  }],
  education: [{
    degree: String,
    institution: String,
    period: String,
    details: String
  }]
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  // Set default title based on role if not provided
  if (!this.title && this.role) {
    const roleMap = {
      'founder': 'The Founder',
      'professional': 'The Professional',
      'investor': 'The Investor',
      'student': 'The Student',
      // 'admin': 'Administrator',
      // 'moderator': 'Moderator',
      'user': 'Developer'
    };
    this.title = roleMap[this.role] || 'Developer';
  }

  // Hash password if modified
  if (!this.isModified('password')) {
    return next();
  }
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Convert to JSON (exclude password)
userSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  delete obj.__v;
  return obj;
};

const User = mongoose.model('User', userSchema);

export default User;
