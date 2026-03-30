import Dashboard from '../../models/Dashboard.js';
import Application from '../../models/Application.js';
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
      projectStage,
      projectIndustry,
      position,
      applicantId,
      applicantName,
      applicantEmail,
      applicantAvatar,
      applicantTitle,
      applicantLocation,
      projectOwnerId,
      projectOwnerName,
      projectOwnerEmail,
      projectOwnerAvatar,
      message,
      skills,
      hasResume,
      resumeUrl,
      resumeFileName
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

    // Fetch full applicant details from User model to ensure we have complete data
    const applicant = await User.findById(applicantId);
    if (!applicant) {
      return res.status(404).json({
        success: false,
        message: 'Applicant not found'
      });
    }

    // Fetch full project owner details
    const projectOwner = await User.findById(projectOwnerId);
    if (!projectOwner) {
      return res.status(404).json({
        success: false,
        message: 'Project owner not found'
      });
    }

    // Generate unique application ID
    const applicationId = `APP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Get or create applicant's Application document
    let applicantApplication = await Application.findOne({ userId: applicantId });
    if (!applicantApplication) {
      applicantApplication = new Application({
        userId: applicantId,
        userName: applicant.name,
        userEmail: applicant.email,
        applications_received: [],
        applications_sent: []
      });
    }

    // Get or create project owner's Application document
    let ownerApplication = await Application.findOne({ userId: projectOwnerId });
    if (!ownerApplication) {
      ownerApplication = new Application({
        userId: projectOwnerId,
        userName: projectOwner.name,
        userEmail: projectOwner.email,
        applications_received: [],
        applications_sent: []
      });
    }

    // Check if user already applied to this project for this position
    // Only block if there's a PENDING or ACCEPTED application
    // Allow re-application if previous was REJECTED, QUIT, or REMOVED
    const existingActiveApplication = applicantApplication.applications_sent.find(
      app => app.projectId.toString() === projectId && 
             app.position === position &&
             (app.status === 'PENDING' || app.status === 'ACCEPTED')
    );

    if (existingActiveApplication) {
      const statusMessage = existingActiveApplication.status === 'PENDING' 
        ? 'You already have a pending application for this position. Please wait for the project owner to review it.'
        : 'You are already accepted for this position and part of the team.';
      
      return res.status(400).json({
        success: false,
        message: statusMessage,
        existingStatus: existingActiveApplication.status
      });
    }

    // Check if there was a previous rejected, quit, or removed application (for logging)
    const previousApplication = applicantApplication.applications_sent.find(
      app => app.projectId.toString() === projectId && 
             app.position === position &&
             (app.status === 'REJECTED' || app.status === 'QUIT' || app.status === 'REMOVED')
    );

    if (previousApplication) {
      console.log(`User ${applicantId} is re-applying to ${projectName} - ${position} after ${previousApplication.status} status`);
    }

    const now = new Date();

    // Create application for applicant's applications_sent array
    // Use data from User model to ensure completeness
    const sentApplicationData = {
      applicationId,
      projectOwnerId,
      projectOwnerName: projectOwner.name,
      projectOwnerEmail: projectOwner.email,
      projectOwnerAvatar: projectOwner.avatar || '',
      projectId,
      projectName,
      projectStage: projectStage || project.stage || '',
      projectIndustry: projectIndustry || project.industry || '',
      position,
      message: message || '',
      skills: skills || [],
      status: 'PENDING',
      hasResume: hasResume || false,
      resumeUrl: resumeUrl || '',
      resumeFileName: resumeFileName || '',
      attachments: [],
      reviewNotes: '',
      reviewedAt: null,
      reviewedBy: null,
      rejectionReason: '',
      removedFromTeamAt: null,
      removalReason: '',
      appliedDate: now,
      statusUpdatedAt: now,
      quitAt: null
    };

    // Create application for owner's applications_received array
    // Use data from User model to ensure completeness
    const receivedApplicationData = {
      applicationId,
      applicantId,
      applicantName: applicant.name,
      applicantEmail: applicant.email,
      applicantAvatar: applicant.avatar || '',
      applicantTitle: applicant.title || '',
      applicantLocation: applicant.location || '',
      projectId,
      projectName,
      projectStage: projectStage || project.stage || '',
      position,
      message: message || '',
      skills: skills || [],
      status: 'PENDING',
      hasResume: hasResume || false,
      resumeUrl: resumeUrl || '',
      resumeFileName: resumeFileName || '',
      attachments: [],
      reviewNotes: '',
      reviewedAt: null,
      reviewedBy: null,
      rating: null,
      removedFromTeamAt: null,
      removalReason: '',
      appliedDate: now,
      statusUpdatedAt: now
    };

    // Add to both Application documents
    applicantApplication.applications_sent.push(sentApplicationData);
    ownerApplication.applications_received.push(receivedApplicationData);

    // Update stats
    applicantApplication.updateStats();
    ownerApplication.updateStats();

    // Increment project application count
    project.applications = (project.applications || 0) + 1;

    // Save all changes
    await Promise.all([
      applicantApplication.save(),
      ownerApplication.save(),
      project.save()
    ]);

    res.status(201).json({
      success: true,
      message: 'Application submitted successfully',
      data: {
        applicationId,
        status: 'PENDING',
        appliedDate: now
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
    const { status, reviewerId, reviewNotes } = req.body;

    if (!['PENDING', 'ACCEPTED', 'REJECTED', 'REMOVED'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be PENDING, ACCEPTED, REJECTED, or REMOVED'
      });
    }

    // Find the application in owner's applications_received
    const ownerApplication = await Application.findOne({
      'applications_received.applicationId': applicationId
    });

    if (!ownerApplication) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    // Find the specific application
    const application = ownerApplication.applications_received.find(
      app => app.applicationId === applicationId
    );

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    // Verify the reviewer is the project owner
    if (reviewerId && ownerApplication.userId.toString() !== reviewerId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the project owner can accept or reject applications'
      });
    }

    const now = new Date();

    // Update in owner's applications_received
    await Application.updateOne(
      { 
        userId: ownerApplication.userId,
        'applications_received.applicationId': applicationId 
      },
      { 
        $set: { 
          'applications_received.$.status': status,
          'applications_received.$.statusUpdatedAt': now,
          'applications_received.$.reviewedAt': now,
          'applications_received.$.reviewedBy': reviewerId,
          'applications_received.$.reviewNotes': reviewNotes || ''
        }
      }
    );

    // Update in applicant's applications_sent
    await Application.updateOne(
      { 
        userId: application.applicantId,
        'applications_sent.applicationId': applicationId 
      },
      { 
        $set: { 
          'applications_sent.$.status': status,
          'applications_sent.$.statusUpdatedAt': now,
          'applications_sent.$.reviewedAt': now,
          'applications_sent.$.reviewedBy': reviewerId,
          'applications_sent.$.reviewNotes': reviewNotes || ''
        }
      }
    );

    // Update stats in both documents
    const updatedOwnerApp = await Application.findOne({ userId: ownerApplication.userId });
    updatedOwnerApp.updateStats();
    await updatedOwnerApp.save();

    const updatedApplicantApp = await Application.findOne({ userId: application.applicantId });
    updatedApplicantApp.updateStats();
    await updatedApplicantApp.save();

    // If accepted, add applicant to project team
    if (status === 'ACCEPTED') {
      const project = await Project.findById(application.projectId);
      if (project) {
        const isAlreadyMember = project.teamMembers.some(
          member => member.id && member.id.toString() === application.applicantId.toString()
        );

        if (!isAlreadyMember) {
          project.teamMembers.push({
            id: application.applicantId,
            name: application.applicantName,
            role: application.position,
            email: application.applicantEmail,
            avatar: application.applicantAvatar || '',
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
        updatedAt: now
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

    // Use Application collection instead of Dashboard
    let application = await Application.findOne({ userId })
      .populate('applications_received.projectId')
      .populate('applications_received.applicantId', 'name email avatar bio title role skills location githubUrl linkedinUrl portfolioUrl experiences education')
      .populate('applications_sent.projectId')
      .populate('applications_sent.projectOwnerId', 'name email avatar');
    
    if (!application) {
      // Return empty structure if application document doesn't exist yet
      return res.status(200).json({
        success: true,
        data: {
          applications_received: [],
          applications_sent: [],
          stats: {
            totalReceived: 0,
            pendingReceived: 0,
            acceptedReceived: 0,
            rejectedReceived: 0,
            removedReceived: 0,
            totalSent: 0,
            pendingSent: 0,
            acceptedSent: 0,
            rejectedSent: 0,
            quitSent: 0,
            removedSent: 0
          }
        }
      });
    }

    // Return the full application document with both arrays
    res.status(200).json({
      success: true,
      data: {
        applications_received: application.applications_received || [],
        applications_sent: application.applications_sent || [],
        stats: application.stats
      }
    });
  } catch (error) {
    console.error('Error fetching applications:', error);
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

    // Find the project owner's Application document
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Find owner's Application document
    const ownerApplication = await Application.findOne({ userId: project.ownerId })
      .populate('applications_received.applicantId', 'name email avatar bio title role skills location');

    if (!ownerApplication) {
      return res.status(200).json({
        success: true,
        data: []
      });
    }

    // Filter applications for this project
    let applications = ownerApplication.applications_received.filter(
      app => app.projectId.toString() === projectId
    );

    // Filter by status if provided
    if (status) {
      applications = applications.filter(app => app.status === status);
    }

    res.status(200).json({
      success: true,
      data: applications
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

// Check if user has already applied to a project position
export const checkUserApplication = async (req, res) => {
  try {
    const { projectId, userId, position } = req.query;

    if (!projectId || !userId || !position) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameters: projectId, userId, and position are required'
      });
    }

    // Get user's application document
    const userApplication = await Application.findOne({ userId });
    
    if (!userApplication) {
      return res.json({
        success: true,
        data: {
          hasApplied: false,
          application: null
        }
      });
    }

    // Find application for this project and position
    const existingApplication = userApplication.applications_sent.find(
      app => app.projectId.toString() === projectId && 
             app.position === position
    );

    if (!existingApplication) {
      return res.json({
        success: true,
        data: {
          hasApplied: false,
          application: null
        }
      });
    }

    // Check if application is PENDING or ACCEPTED
    const isActive = existingApplication.status === 'PENDING' || existingApplication.status === 'ACCEPTED';

    res.json({
      success: true,
      data: {
        hasApplied: isActive,
        application: isActive ? {
          applicationId: existingApplication.applicationId,
          status: existingApplication.status,
          position: existingApplication.position,
          projectName: existingApplication.projectName,
          appliedDate: existingApplication.appliedDate,
          statusUpdatedAt: existingApplication.statusUpdatedAt
        } : null
      }
    });
  } catch (error) {
    console.error('Error checking user application:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking user application',
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
  checkUserApplication
};