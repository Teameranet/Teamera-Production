import Project from '../../models/Project.js';
import User from '../../models/User.js';
import {
  successResponse,
  errorResponse,
  asyncHandler,
} from '../../utils/helpers.js';

const projectController = {
  // Get all projects
  getAllProjects: asyncHandler(async (req, res) => {
    const { industry, stage, status } = req.query;
    
    const filter = {};
    if (industry) filter.industry = industry;
    if (stage) filter.stage = stage;
    if (status) filter.status = status;

    const projects = await Project.find(filter)
      .populate('ownerId', 'name email')
      .populate('teamMembers.id', 'name email')
      .sort({ createdAt: -1 });

    const response = successResponse(projects, 'Projects retrieved successfully');
    res.json(response);
  }),

  // Get project by ID
  getProjectById: asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    const project = await Project.findById(id)
      .populate('ownerId', 'name email')
      .populate('teamMembers.id', 'name email');

    if (!project) {
      return res
        .status(404)
        .json(errorResponse('Project not found', 'PROJECT_NOT_FOUND'));
    }

    const response = successResponse(project, 'Project retrieved successfully');
    res.json(response);
  }),

  // Create new project
  createProject: asyncHandler(async (req, res) => {
    const projectData = req.body;

    // Validate required fields
    if (!projectData.title || !projectData.description || !projectData.industry) {
      return res
        .status(400)
        .json(errorResponse('Missing required fields', 'MISSING_FIELDS'));
    }

    // Set ownerId from teamMembers if not provided
    if (!projectData.ownerId && projectData.teamMembers && projectData.teamMembers.length > 0) {
      const founder = projectData.teamMembers.find(member => member.role === 'Founder');
      if (founder) {
        projectData.ownerId = founder.id;
      }
    }

    const newProject = await Project.create(projectData);

    const response = successResponse(newProject, 'Project created successfully');
    res.status(201).json(response);
  }),

  // Update project
  updateProject: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;

    // Remove fields that shouldn't be updated directly
    delete updateData._id;
    delete updateData.createdAt;

    const updatedProject = await Project.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    )
      .populate('ownerId', 'name email')
      .populate('teamMembers.id', 'name email');

    if (!updatedProject) {
      return res
        .status(404)
        .json(errorResponse('Project not found', 'PROJECT_NOT_FOUND'));
    }

    const response = successResponse(updatedProject, 'Project updated successfully');
    res.json(response);
  }),

  // Delete project
  deleteProject: asyncHandler(async (req, res) => {
    const { id } = req.params;

    const deletedProject = await Project.findByIdAndDelete(id);

    if (!deletedProject) {
      return res
        .status(404)
        .json(errorResponse('Project not found', 'PROJECT_NOT_FOUND'));
    }

    const response = successResponse(
      { id: deletedProject._id },
      'Project deleted successfully'
    );
    res.json(response);
  }),

  // Get projects by user ID (owned and participating)
  getUserProjects: asyncHandler(async (req, res) => {
    const { userId } = req.params;

    // Find projects owned by the user
    const ownedProjects = await Project.find({ ownerId: userId })
      .populate('ownerId', 'name email')
      .populate('teamMembers.id', 'name email')
      .sort({ createdAt: -1 });

    // Find projects where user is a team member
    const participatingProjects = await Project.find({
      'teamMembers.id': userId,
      ownerId: { $ne: userId }
    })
      .populate('ownerId', 'name email')
      .populate('teamMembers.id', 'name email')
      .sort({ createdAt: -1 });

    const response = successResponse(
      {
        owned: ownedProjects,
        participating: participatingProjects
      },
      'User projects retrieved successfully'
    );
    res.json(response);
  }),

  // Update project stage
  updateProjectStage: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { stage } = req.body;

    const validStages = [
      'Ideation Stage',
      'Idea Validation',
      'MVP Development',
      'Beta Testing',
      'Market Ready',
      'Scaling'
    ];

    if (!validStages.includes(stage)) {
      return res
        .status(400)
        .json(errorResponse('Invalid stage', 'INVALID_STAGE'));
    }

    const updatedProject = await Project.findByIdAndUpdate(
      id,
      { stage },
      { new: true }
    );

    if (!updatedProject) {
      return res
        .status(404)
        .json(errorResponse('Project not found', 'PROJECT_NOT_FOUND'));
    }

    const response = successResponse(updatedProject, 'Project stage updated successfully');
    res.json(response);
  }),

  // Add team member to project
  addTeamMember: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { userId, name, role, email, applicantColor } = req.body;

    const project = await Project.findById(id);

    if (!project) {
      return res
        .status(404)
        .json(errorResponse('Project not found', 'PROJECT_NOT_FOUND'));
    }

    // Check if user is already a team member
    const isAlreadyMember = project.teamMembers.some(
      member => member.id.toString() === userId
    );

    if (isAlreadyMember) {
      return res
        .status(400)
        .json(errorResponse('User is already a team member', 'ALREADY_MEMBER'));
    }

    project.teamMembers.push({
      id: userId,
      name,
      role,
      email,
      applicantColor
    });

    await project.save();

    const response = successResponse(project, 'Team member added successfully');
    res.json(response);
  }),

  // Remove team member from project
  removeTeamMember: asyncHandler(async (req, res) => {
    const { id, userId } = req.params;

    console.log('Removing team member - ProjectId:', id, 'UserId:', userId);

    const project = await Project.findById(id);

    if (!project) {
      return res
        .status(404)
        .json(errorResponse('Project not found', 'PROJECT_NOT_FOUND'));
    }

    // Don't allow removing the owner
    if (project.ownerId && project.ownerId.toString() === userId) {
      return res
        .status(400)
        .json(errorResponse('Cannot remove project owner', 'CANNOT_REMOVE_OWNER'));
    }

    // Log before filtering
    console.log('Team members before removal:', project.teamMembers.length);
    console.log('Team member IDs:', project.teamMembers.map(m => ({ id: m.id?.toString(), name: m.name })));

    // Filter out the team member - handle both ObjectId and string comparisons
    const initialLength = project.teamMembers.length;
    project.teamMembers = project.teamMembers.filter(member => {
      const memberId = member.id ? member.id.toString() : null;
      const shouldKeep = memberId !== userId;
      if (!shouldKeep) {
        console.log('Removing member:', member.name, 'with ID:', memberId);
      }
      return shouldKeep;
    });

    // Log after filtering
    console.log('Team members after removal:', project.teamMembers.length);

    // Check if any member was actually removed
    if (initialLength === project.teamMembers.length) {
      console.log('Warning: No team member was removed. User might not be in the team.');
      return res
        .status(404)
        .json(errorResponse('User is not a team member of this project', 'USER_NOT_FOUND'));
    }

    await project.save();
    console.log('Project saved successfully');

    const response = successResponse(project, 'Team member removed successfully');
    res.json(response);
  }),

  // Increment application count
  incrementApplicationCount: asyncHandler(async (req, res) => {
    const { id } = req.params;

    const project = await Project.findByIdAndUpdate(
      id,
      { $inc: { applications: 1 } },
      { new: true }
    )
      .populate('ownerId', 'name email')
      .populate('teamMembers.id', 'name email');

    if (!project) {
      return res
        .status(404)
        .json(errorResponse('Project not found', 'PROJECT_NOT_FOUND'));
    }

    const response = successResponse(
      { applications: project.applications },
      'Application count incremented successfully'
    );
    res.json(response);
  })
};

export default projectController;