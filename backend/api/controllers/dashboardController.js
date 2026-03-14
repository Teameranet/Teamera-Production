import Dashboard from '../../models/Dashboard.js';
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
      // Get user information to populate dashboard
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      dashboard = new Dashboard({ 
        userId,
        userName: user.name,
        userEmail: user.email
      });
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

// Submit application to a project
export const submitApplication = async (req, res) => {
  try {
    const {
      projectId,
      projectName,
      position,
      applicantId,
      applicantName,
      applicantEmail,
      projectOwnerId,
      projectOwnerName,
      projectOwnerEmail,
      message,
      skills,
      hasResume,
      resumeUrl
    } = req.body;

    // Validate required fields
    if (!projectId || !position || !applicantId || !projectOwnerId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Verify project exists
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Generate unique application ID
    const applicationId = `APP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Get or create applicant's dashboard
    let applicantDashboard = await Dashboard.findOne({ userId: applicantId });
    if (!applicantDashboard) {
      const applicant = await User.findById(applicantId);
      applicantDashboard = new Dashboard({
        userId: applicantId,
        userName: applicant.name,
        userEmail: applicant.email
      });
    }

    // Get or create project owner's dashboard
    let ownerDashboard = await Dashboard.findOne({ userId: projectOwnerId });
    if (!ownerDashboard) {
      const owner = await User.findById(projectOwnerId);
      ownerDashboard = new Dashboard({
        userId: projectOwnerId,
        userName: owner.name,
        userEmail: owner.email
      });
    }

    // Check if user already applied to this project for this position
    const existingApplication = applicantDashboard.applications.find(
      app => app.projectId.toString() === projectId && app.position === position
    );

    if (existingApplication) {
      return res.status(400).json({
        success: false,
        message: 'You have already applied to this position'
      });
    }

    // Create application object
    const applicationData = {
      applicationId,
      projectId,
      projectName,
      position,
      applicantId,
      applicantName,
      applicantEmail,
      projectOwnerId,
      projectOwnerName,
      projectOwnerEmail,
      message: message || '',
      skills: skills || [],
      status: 'PENDING',
      hasResume: hasResume || false,
      resumeUrl: resumeUrl || '',
      appliedDate: new Date()
    };

    // Add to both dashboards
    applicantDashboard.applications.push(applicationData);
    ownerDashboard.applications.push(applicationData);

    // Update stats
    applicantDashboard.updateStats();
    ownerDashboard.updateStats();

    // Increment project application count
    project.applications = (project.applications || 0) + 1;

    // Save all changes
    await Promise.all([
      applicantDashboard.save(),
      ownerDashboard.save(),
      project.save()
    ]);

    res.status(201).json({
      success: true,
      message: 'Application submitted successfully',
      data: {
        applicationId,
        status: 'PENDING',
        appliedDate: applicationData.appliedDate
      }
    });
  } catch (error) {
    console.error('Error submitting application:', error);
    res.status(500).json({
      success: false,
      message: 'Error submitting application',
      error: error.message
    });
  }
};

// Update application status (for project owners)
export const updateApplicationStatus = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { status, reviewerId } = req.body;

    if (!['PENDING', 'ACCEPTED', 'REJECTED'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be PENDING, ACCEPTED, or REJECTED'
      });
    }

    // Find the application in both applicant's and owner's dashboards
    const dashboards = await Dashboard.find({
      'applications.applicationId': applicationId
    });

    if (dashboards.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    let applicantDashboard, ownerDashboard, applicationData;

    // Update status in both dashboards
    for (const dashboard of dashboards) {
      const application = dashboard.applications.find(
        app => app.applicationId === applicationId
      );

      if (application) {
        // Verify the reviewer is the project owner
        if (reviewerId && dashboard.userId.toString() !== reviewerId) {
          // This is the applicant's dashboard
          applicantDashboard = dashboard;
        } else {
          // This is the owner's dashboard
          ownerDashboard = dashboard;
        }

        application.status = status;
        applicationData = application;
        dashboard.updateStats();
        await dashboard.save();
      }
    }

    // If accepted, optionally add applicant to project team
    if (status === 'ACCEPTED' && applicationData) {
      const project = await Project.findById(applicationData.projectId);
      if (project) {
        const isAlreadyMember = project.teamMembers.some(
          member => member.id && member.id.toString() === applicationData.applicantId.toString()
        );

        if (!isAlreadyMember) {
          project.teamMembers.push({
            id: applicationData.applicantId,
            name: applicationData.applicantName,
            role: applicationData.position,
            email: applicationData.applicantEmail,
            applicantColor: `#${Math.floor(Math.random()*16777215).toString(16)}`
          });
          await project.save();
        }
      }
    }

    res.status(200).json({
      success: true,
      message: `Application ${status.toLowerCase()} successfully`,
      data: {
        applicationId,
        status,
        updatedAt: new Date()
      }
    });
  } catch (error) {
    console.error('Error updating application status:', error);
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

    let dashboard = await Dashboard.findOne({ userId })
      .populate('bookmarkedProjects.projectId');
    
    if (!dashboard) {
      // Return empty array if dashboard doesn't exist yet
      return res.status(200).json({
        success: true,
        data: []
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
      .populate('applications.applicantId', 'name email avatar bio title role skills location githubUrl linkedinUrl portfolioUrl experiences education');
    
    if (!dashboard) {
      // Return empty array instead of 404 if dashboard doesn't exist yet
      return res.status(200).json({
        success: true,
        data: []
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

// Get applications for a specific project (for project owners)
export const getProjectApplications = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { status } = req.query;

    // Find all dashboards that have applications for this project
    const query = { 'applications.projectId': projectId };
    
    const dashboards = await Dashboard.find(query)
      .populate('applications.applicantId', 'name email avatar bio skills');

    if (!dashboards || dashboards.length === 0) {
      return res.status(200).json({
        success: true,
        data: []
      });
    }

    // Extract applications for this project
    let applications = [];
    dashboards.forEach(dashboard => {
      const projectApps = dashboard.applications.filter(
        app => app.projectId.toString() === projectId
      );
      applications.push(...projectApps);
    });

    // Remove duplicates based on applicationId
    const uniqueApplications = Array.from(
      new Map(applications.map(app => [app.applicationId, app])).values()
    );

    // Filter by status if provided
    if (status) {
      const filteredApps = uniqueApplications.filter(app => app.status === status);
      return res.status(200).json({
        success: true,
        data: filteredApps
      });
    }

    res.status(200).json({
      success: true,
      data: uniqueApplications
    });
  } catch (error) {
    console.error('Error fetching project applications:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching project applications',
      error: error.message
    });
  }
};

// Withdraw application (for applicants)
export const withdrawApplication = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { userId } = req.body;

    // Find dashboards with this application
    const dashboards = await Dashboard.find({
      'applications.applicationId': applicationId
    });

    if (dashboards.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    // Remove application from both dashboards
    for (const dashboard of dashboards) {
      const appIndex = dashboard.applications.findIndex(
        app => app.applicationId === applicationId
      );

      if (appIndex !== -1) {
        // Verify user is the applicant
        if (dashboard.applications[appIndex].applicantId.toString() === userId) {
          dashboard.applications.splice(appIndex, 1);
          dashboard.updateStats();
          await dashboard.save();
        }
      }
    }

    res.status(200).json({
      success: true,
      message: 'Application withdrawn successfully'
    });
  } catch (error) {
    console.error('Error withdrawing application:', error);
    res.status(500).json({
      success: false,
      message: 'Error withdrawing application',
      error: error.message
    });
  }
};

export default {
  getDashboard,
  addBookmark,
  removeBookmark,
  submitApplication,
  updateApplicationStatus,
  getDashboardStats,
  getBookmarkedProjects,
  getApplications,
  getProjectApplications,
  withdrawApplication
};