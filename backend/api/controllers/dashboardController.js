import Dashboard from '../../models/dashboard.js';
import User from '../../models/User.js';
import Project from '../../models/Project.js';

// Get dashboard data for a user
export const getDashboard = async (req, res) => {
  try {
    const { userId } = req.params;

    let dashboard = await Dashboard.findOne({ userId })
      .populate('bookmarkedProjects.projectId')
      .populate('applications.projectId')
      .populate('applications.applicantId', 'name email');

    if (!dashboard) {
      // Create a new dashboard if it doesn't exist
      dashboard = new Dashboard({ userId });
      await dashboard.save();
    }

    res.status(200).json({
      success: true,
      data: dashboard
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard data',
      error: error.message
    });
  }
};

// Add bookmark to dashboard
export const addBookmark = async (req, res) => {
  try {
    const { userId } = req.params;
    const { projectId } = req.body;

    // Verify project exists
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    let dashboard = await Dashboard.findOne({ userId });
    
    if (!dashboard) {
      dashboard = new Dashboard({ userId });
    }

    // Check if already bookmarked
    const alreadyBookmarked = dashboard.bookmarkedProjects.some(
      bookmark => bookmark.projectId.toString() === projectId
    );

    if (alreadyBookmarked) {
      return res.status(400).json({
        success: false,
        message: 'Project already bookmarked'
      });
    }

    dashboard.bookmarkedProjects.push({ projectId });
    dashboard.updateStats();
    await dashboard.save();

    res.status(200).json({
      success: true,
      message: 'Project bookmarked successfully',
      data: dashboard
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error adding bookmark',
      error: error.message
    });
  }
};

// Remove bookmark from dashboard
export const removeBookmark = async (req, res) => {
  try {
    const { userId, projectId } = req.params;

    const dashboard = await Dashboard.findOne({ userId });
    
    if (!dashboard) {
      return res.status(404).json({
        success: false,
        message: 'Dashboard not found'
      });
    }

    dashboard.bookmarkedProjects = dashboard.bookmarkedProjects.filter(
      bookmark => bookmark.projectId.toString() !== projectId
    );

    dashboard.updateStats();
    await dashboard.save();

    res.status(200).json({
      success: true,
      message: 'Bookmark removed successfully',
      data: dashboard
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error removing bookmark',
      error: error.message
    });
  }
};

// Add application to dashboard
export const addApplication = async (req, res) => {
  try {
    const { userId } = req.params;
    const {
      applicationId,
      projectId,
      projectName,
      position,
      applicantId,
      applicantName,
      message,
      skills,
      hasResume,
      resumeUrl
    } = req.body;

    let dashboard = await Dashboard.findOne({ userId });
    
    if (!dashboard) {
      dashboard = new Dashboard({ userId });
    }

    dashboard.applications.push({
      applicationId,
      projectId,
      projectName,
      position,
      applicantId,
      applicantName,
      message,
      skills,
      hasResume,
      resumeUrl
    });

    dashboard.updateStats();
    await dashboard.save();

    res.status(201).json({
      success: true,
      message: 'Application added successfully',
      data: dashboard
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error adding application',
      error: error.message
    });
  }
};

// Update application status
export const updateApplicationStatus = async (req, res) => {
  try {
    const { userId, applicationId } = req.params;
    const { status } = req.body;

    if (!['PENDING', 'ACCEPTED', 'REJECTED'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be PENDING, ACCEPTED, or REJECTED'
      });
    }

    const dashboard = await Dashboard.findOne({ userId });
    
    if (!dashboard) {
      return res.status(404).json({
        success: false,
        message: 'Dashboard not found'
      });
    }

    const application = dashboard.applications.find(
      app => app.applicationId === applicationId
    );

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    application.status = status;
    dashboard.updateStats();
    await dashboard.save();

    res.status(200).json({
      success: true,
      message: 'Application status updated successfully',
      data: dashboard
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating application status',
      error: error.message
    });
  }
};

// Get dashboard stats
export const getDashboardStats = async (req, res) => {
  try {
    const { userId } = req.params;

    const dashboard = await Dashboard.findOne({ userId });
    
    if (!dashboard) {
      return res.status(404).json({
        success: false,
        message: 'Dashboard not found'
      });
    }

    res.status(200).json({
      success: true,
      data: dashboard.stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard stats',
      error: error.message
    });
  }
};

// Get bookmarked projects
export const getBookmarkedProjects = async (req, res) => {
  try {
    const { userId } = req.params;

    const dashboard = await Dashboard.findOne({ userId })
      .populate('bookmarkedProjects.projectId');
    
    if (!dashboard) {
      return res.status(404).json({
        success: false,
        message: 'Dashboard not found'
      });
    }

    res.status(200).json({
      success: true,
      data: dashboard.bookmarkedProjects
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching bookmarked projects',
      error: error.message
    });
  }
};

// Get applications
export const getApplications = async (req, res) => {
  try {
    const { userId } = req.params;
    const { status } = req.query;

    const dashboard = await Dashboard.findOne({ userId })
      .populate('applications.projectId')
      .populate('applications.applicantId', 'name email');
    
    if (!dashboard) {
      return res.status(404).json({
        success: false,
        message: 'Dashboard not found'
      });
    }

    let applications = dashboard.applications;

    if (status) {
      applications = applications.filter(app => app.status === status);
    }

    res.status(200).json({
      success: true,
      data: applications
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching applications',
      error: error.message
    });
  }
};

export default {
  getDashboard,
  addBookmark,
  removeBookmark,
  addApplication,
  updateApplicationStatus,
  getDashboardStats,
  getBookmarkedProjects,
  getApplications
};
