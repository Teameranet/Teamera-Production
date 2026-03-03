import mongoose from 'mongoose';

const dashboardSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  bookmarkedProjects: [{
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true
    },
    bookmarkedAt: {
      type: Date,
      default: Date.now
    }
  }],
  applications: [{
    applicationId: {
      type: String,
      required: true
    },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true
    },
    projectName: {
      type: String,
      required: true
    },
    position: {
      type: String,
      required: true
    },
    applicantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    applicantName: {
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
      enum: ['PENDING', 'ACCEPTED', 'REJECTED'],
      default: 'PENDING'
    },
    hasResume: {
      type: Boolean,
      default: false
    },
    resumeUrl: {
      type: String,
      default: ''
    },
    appliedDate: {
      type: Date,
      default: Date.now
    }
  }],
  stats: {
    totalBookmarks: {
      type: Number,
      default: 0
    },
    totalApplicationsReceived: {
      type: Number,
      default: 0
    },
    totalApplicationsSent: {
      type: Number,
      default: 0
    },
    pendingApplications: {
      type: Number,
      default: 0
    },
    acceptedApplications: {
      type: Number,
      default: 0
    },
    rejectedApplications: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true
});

// Index for faster queries (userId already has unique index from schema)
dashboardSchema.index({ 'bookmarkedProjects.projectId': 1 });
dashboardSchema.index({ 'applications.applicationId': 1 });
dashboardSchema.index({ 'applications.status': 1 });

// Method to update stats
dashboardSchema.methods.updateStats = function() {
  this.stats.totalBookmarks = this.bookmarkedProjects.length;
  this.stats.totalApplicationsReceived = this.applications.filter(app => 
    app.applicantId.toString() !== this.userId.toString()
  ).length;
  this.stats.totalApplicationsSent = this.applications.filter(app => 
    app.applicantId.toString() === this.userId.toString()
  ).length;
  this.stats.pendingApplications = this.applications.filter(app => 
    app.status === 'PENDING'
  ).length;
  this.stats.acceptedApplications = this.applications.filter(app => 
    app.status === 'ACCEPTED'
  ).length;
  this.stats.rejectedApplications = this.applications.filter(app => 
    app.status === 'REJECTED'
  ).length;
};

const Dashboard = mongoose.model('Dashboard', dashboardSchema);

export default Dashboard;
