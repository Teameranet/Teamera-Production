import mongoose from 'mongoose';

const dashboardSchema = new mongoose.Schema({
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
  stats: {
    totalBookmarks: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true
});

// Index for faster queries (userId already has unique index from schema)
dashboardSchema.index({ 'bookmarkedProjects.projectId': 1 });

// Method to update stats
dashboardSchema.methods.updateStats = function() {
  this.stats.totalBookmarks = this.bookmarkedProjects.length;
};

const Dashboard = mongoose.model('Dashboard', dashboardSchema);

export default Dashboard;
