import mongoose from 'mongoose';

const applicationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  userName: {
    type: String,
    required: false
  },
  userEmail: {
    type: String,
    required: false
  },
  
  // ========================================
  // APPLICATIONS RECEIVED (For Project Owners)
  // ========================================
  applications_received: [{
    applicationId: {
      type: String,
      required: true
    },
    
    // APPLICANT INFORMATION (User who applied)
    applicantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    applicantName: {
      type: String,
      required: true
    },
    applicantEmail: {
      type: String,
      required: true
    },
    applicantAvatar: {
      type: String,
      default: ''
    },
    applicantTitle: {
      type: String,
      default: ''
    },
    applicantLocation: {
      type: String,
      default: ''
    },
    
    // PROJECT INFORMATION
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true
    },
    projectName: {
      type: String,
      required: true
    },
    projectStage: {
      type: String,
      default: ''
    },
    
    // APPLICATION DETAILS
    position: {
      type: String,
      required: true
    },
    message: {
      type: String,
      default: ''
    },
    skills: [{
      type: String
    }],
    status: {
      type: String,
      enum: ['PENDING', 'ACCEPTED', 'REJECTED', 'REMOVED'],
      default: 'PENDING'
    },
    
    // RESUME/ATTACHMENTS
    hasResume: {
      type: Boolean,
      default: false
    },
    resumeUrl: {
      type: String,
      default: ''
    },
    resumeFileName: {
      type: String,
      default: ''
    },
    attachments: [{
      fileName: String,
      fileUrl: String,
      fileType: String,
      fileSize: Number
    }],
    
    // REVIEW INFORMATION
    reviewNotes: {
      type: String,
      default: ''
    },
    reviewedAt: {
      type: Date,
      default: null
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      default: null
    },
    removedFromTeamAt: {
      type: Date,
      default: null
    },
    removalReason: {
      type: String,
      default: ''
    },
    
    // TIMESTAMPS
    appliedDate: {
      type: Date,
      default: Date.now
    },
    statusUpdatedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // ========================================
  // APPLICATIONS SENT (For Applicants)
  // ========================================
  applications_sent: [{
    applicationId: {
      type: String,
      required: true
    },
    
    // PROJECT OWNER INFORMATION (Who created the project)
    projectOwnerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    projectOwnerName: {
      type: String,
      required: true
    },
    projectOwnerEmail: {
      type: String,
      required: true
    },
    projectOwnerAvatar: {
      type: String,
      default: ''
    },
    
    // PROJECT INFORMATION
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true
    },
    projectName: {
      type: String,
      required: true
    },
    projectStage: {
      type: String,
      default: ''
    },
    projectIndustry: {
      type: String,
      default: ''
    },
    
    // APPLICATION DETAILS
    position: {
      type: String,
      required: true
    },
    message: {
      type: String,
      default: ''
    },
    skills: [{
      type: String
    }],
    status: {
      type: String,
      enum: ['PENDING', 'ACCEPTED', 'REJECTED', 'WITHDRAWN', 'REMOVED'],
      default: 'PENDING'
    },
    
    // RESUME/ATTACHMENTS
    hasResume: {
      type: Boolean,
      default: false
    },
    resumeUrl: {
      type: String,
      default: ''
    },
    resumeFileName: {
      type: String,
      default: ''
    },
    attachments: [{
      fileName: String,
      fileUrl: String,
      fileType: String,
      fileSize: Number
    }],
    
    // REVIEW INFORMATION
    reviewNotes: {
      type: String,
      default: ''
    },
    reviewedAt: {
      type: Date,
      default: null
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    rejectionReason: {
      type: String,
      default: ''
    },
    removedFromTeamAt: {
      type: Date,
      default: null
    },
    removalReason: {
      type: String,
      default: ''
    },
    
    // TIMESTAMPS
    appliedDate: {
      type: Date,
      default: Date.now
    },
    statusUpdatedAt: {
      type: Date,
      default: Date.now
    },
    withdrawnAt: {
      type: Date,
      default: null
    }
  }],
  
  // ========================================
  // STATISTICS
  // ========================================
  stats: {
    // Received Statistics
    totalReceived: {
      type: Number,
      default: 0
    },
    pendingReceived: {
      type: Number,
      default: 0
    },
    acceptedReceived: {
      type: Number,
      default: 0
    },
    rejectedReceived: {
      type: Number,
      default: 0
    },
    removedReceived: {
      type: Number,
      default: 0
    },
    
    // Sent Statistics
    totalSent: {
      type: Number,
      default: 0
    },
    pendingSent: {
      type: Number,
      default: 0
    },
    acceptedSent: {
      type: Number,
      default: 0
    },
    rejectedSent: {
      type: Number,
      default: 0
    },
    withdrawnSent: {
      type: Number,
      default: 0
    },
    removedSent: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true
});

// Indexes for faster queries
applicationSchema.index({ userId: 1 }, { unique: true });
applicationSchema.index({ 'applications_received.applicationId': 1 });
applicationSchema.index({ 'applications_received.status': 1 });
applicationSchema.index({ 'applications_received.applicantId': 1 });
applicationSchema.index({ 'applications_received.projectId': 1 });
applicationSchema.index({ 'applications_sent.applicationId': 1 });
applicationSchema.index({ 'applications_sent.status': 1 });
applicationSchema.index({ 'applications_sent.projectId': 1 });
applicationSchema.index({ 'applications_sent.projectOwnerId': 1 });

// Method to update stats
applicationSchema.methods.updateStats = function() {
  // Received Statistics
  this.stats.totalReceived = this.applications_received.length;
  this.stats.pendingReceived = this.applications_received.filter(app => app.status === 'PENDING').length;
  this.stats.acceptedReceived = this.applications_received.filter(app => app.status === 'ACCEPTED').length;
  this.stats.rejectedReceived = this.applications_received.filter(app => app.status === 'REJECTED').length;
  this.stats.removedReceived = this.applications_received.filter(app => app.status === 'REMOVED').length;
  
  // Sent Statistics
  this.stats.totalSent = this.applications_sent.length;
  this.stats.pendingSent = this.applications_sent.filter(app => app.status === 'PENDING').length;
  this.stats.acceptedSent = this.applications_sent.filter(app => app.status === 'ACCEPTED').length;
  this.stats.rejectedSent = this.applications_sent.filter(app => app.status === 'REJECTED').length;
  this.stats.withdrawnSent = this.applications_sent.filter(app => app.status === 'WITHDRAWN').length;
  this.stats.removedSent = this.applications_sent.filter(app => app.status === 'REMOVED').length;
};

const Application = mongoose.model('Application', applicationSchema);

export default Application;
