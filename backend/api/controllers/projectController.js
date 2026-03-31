import Project from '../../models/Project.js';
import User from '../../models/User.js';
import Application from '../../models/Application.js';
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

    // Create invitation records for invited team members (excluding founder)
    if (projectData.teamMembers && projectData.teamMembers.length > 0) {
      const invitedMembers = projectData.teamMembers.filter(
        member => member.role !== 'Founder' && member.id
      );

      for (const member of invitedMembers) {
        try {
          const applicationId = `INV-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          
          // Get owner details
          const owner = await User.findById(newProject.ownerId);
          if (!owner) continue;

          // Get invited member details
          const invitedUser = await User.findById(member.id);
          if (!invitedUser) continue;

          // Create/update application record for project owner (received)
          await Application.findOneAndUpdate(
            { userId: newProject.ownerId },
            {
              $push: {
                applications_received: {
                  applicationId,
                  applicantId: member.id,
                  applicantName: member.name,
                  applicantEmail: member.email || invitedUser.email,
                  applicantAvatar: invitedUser.avatar || '',
                  applicantTitle: invitedUser.title || '',
                  applicantLocation: invitedUser.location || '',
                  projectId: newProject._id,
                  projectName: newProject.title,
                  projectStage: newProject.stage,
                  position: member.role,
                  message: 'Invited to join the project',
                  status: 'INVITED',
                  appliedDate: new Date(),
                  statusUpdatedAt: new Date()
                }
              }
            },
            { upsert: true, new: true }
          ).then(doc => {
            doc.updateStats();
            return doc.save();
          });

          // Create/update application record for invited member (sent)
          await Application.findOneAndUpdate(
            { userId: member.id },
            {
              $push: {
                applications_sent: {
                  applicationId,
                  projectOwnerId: newProject.ownerId,
                  projectOwnerName: owner.name,
                  projectOwnerEmail: owner.email,
                  projectOwnerAvatar: owner.avatar || '',
                  projectId: newProject._id,
                  projectName: newProject.title,
                  projectStage: newProject.stage,
                  projectIndustry: newProject.industry,
                  position: member.role,
                  message: 'Invited to join the project',
                  status: 'INVITED',
                  appliedDate: new Date(),
                  statusUpdatedAt: new Date()
                }
              }
            },
            { upsert: true, new: true }
          ).then(doc => {
            doc.updateStats();
            return doc.save();
          });
        } catch (error) {
          console.error('Error creating invitation record:', error);
          // Continue with other members even if one fails
        }
      }
    }

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

    // Get the original project to compare team members
    const originalProject = await Project.findById(id);
    if (!originalProject) {
      return res
        .status(404)
        .json(errorResponse('Project not found', 'PROJECT_NOT_FOUND'));
    }

    // CRITICAL FIX: Detect if teamMembers actually changed
    // Only process team member changes if members were genuinely added/removed
    // This prevents accepted users from being removed during simple project updates
    let membersActuallyChanged = false;
    
    if (updateData.teamMembers !== undefined) {
      // Extract and normalize member IDs from original project
      const originalMemberIds = originalProject.teamMembers
        .map(m => {
          if (!m.id) return null;
          // Handle both populated and unpopulated IDs
          const id = typeof m.id === 'object' ? (m.id._id || m.id.toString()) : m.id.toString();
          return id;
        })
        .filter(Boolean)
        .sort();
      
      // Extract and normalize member IDs from update data
      const newMemberIds = updateData.teamMembers
        .map(m => {
          if (!m.id) return null;
          // Handle both populated and unpopulated IDs
          const id = typeof m.id === 'object' ? (m.id._id || m.id.toString()) : m.id.toString();
          return id;
        })
        .filter(Boolean)
        .sort();
      
      // Compare sorted arrays to detect real changes
      membersActuallyChanged = JSON.stringify(originalMemberIds) !== JSON.stringify(newMemberIds);
      
      if (!membersActuallyChanged) {
        // CRITICAL: Preserve original team members completely - this is just a detail update
        // Do NOT update teamMembers field at all to prevent any relationship breakage
        // This ensures accepted users remain in the project when only name/position/etc are updated
        delete updateData.teamMembers;
        console.log('Team members unchanged - preserving original team structure to prevent relationship breakage');
      } else {
        console.log('Team members changed - processing additions/removals:', {
          original: originalMemberIds,
          new: newMemberIds
        });
      }
    } else {
      // If teamMembers is not in the update at all, this is a safe partial update
      console.log('Team members not included in update - safe partial update of other fields');
    }

    const updatedProject = await Project.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    )
      .populate('ownerId', 'name email')
      .populate('teamMembers.id', 'name email');

    // Only process team member changes if members ACTUALLY changed
    if (membersActuallyChanged && updateData.teamMembers) {
      const originalMemberIds = originalProject.teamMembers
        .filter(m => m.id && m.role !== 'Founder')
        .map(m => m.id.toString());
      
      const updatedMemberIds = updateData.teamMembers
        .filter(m => m.id && m.role !== 'Founder')
        .map(m => m.id.toString());
      
      // Find newly added members
      const newMembers = updateData.teamMembers.filter(
        member => member.id && 
                  member.role !== 'Founder' && 
                  !originalMemberIds.includes(member.id.toString())
      );

      // Find removed members
      const removedMemberIds = originalMemberIds.filter(
        memberId => !updatedMemberIds.includes(memberId)
      );

      // Handle newly added members (create invitations)
      for (const member of newMembers) {
        try {
          const applicationId = `INV-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          
          // Get owner details
          const owner = await User.findById(updatedProject.ownerId);
          if (!owner) continue;

          // Get invited member details
          const invitedUser = await User.findById(member.id);
          if (!invitedUser) continue;

          // Create/update application record for project owner (received)
          await Application.findOneAndUpdate(
            { userId: updatedProject.ownerId },
            {
              $push: {
                applications_received: {
                  applicationId,
                  applicantId: member.id,
                  applicantName: member.name,
                  applicantEmail: member.email || invitedUser.email,
                  applicantAvatar: invitedUser.avatar || '',
                  applicantTitle: invitedUser.title || '',
                  applicantLocation: invitedUser.location || '',
                  projectId: updatedProject._id,
                  projectName: updatedProject.title,
                  projectStage: updatedProject.stage,
                  position: member.role,
                  message: 'Invited to join the project',
                  status: 'INVITED',
                  appliedDate: new Date(),
                  statusUpdatedAt: new Date()
                }
              }
            },
            { upsert: true, new: true }
          ).then(doc => {
            doc.updateStats();
            return doc.save();
          });

          // Create/update application record for invited member (sent)
          await Application.findOneAndUpdate(
            { userId: member.id },
            {
              $push: {
                applications_sent: {
                  applicationId,
                  projectOwnerId: updatedProject.ownerId,
                  projectOwnerName: owner.name,
                  projectOwnerEmail: owner.email,
                  projectOwnerAvatar: owner.avatar || '',
                  projectId: updatedProject._id,
                  projectName: updatedProject.title,
                  projectStage: updatedProject.stage,
                  projectIndustry: updatedProject.industry,
                  position: member.role,
                  message: 'Invited to join the project',
                  status: 'INVITED',
                  appliedDate: new Date(),
                  statusUpdatedAt: new Date()
                }
              }
            },
            { upsert: true, new: true }
          ).then(doc => {
            doc.updateStats();
            return doc.save();
          });
        } catch (error) {
          console.error('Error creating invitation record:', error);
          // Continue with other members even if one fails
        }
      }

      // Handle removed members (update status to REMOVED)
      const now = new Date();
      for (const removedMemberId of removedMemberIds) {
        try {
          // Find the application for this project and removed member
          const memberApplication = await Application.findOne({
            userId: removedMemberId,
            'applications_sent.projectId': id
          });

          if (memberApplication) {
            const application = memberApplication.applications_sent.find(
              app => app.projectId.toString() === id && 
                     (app.status === 'ACCEPTED' || app.status === 'INVITED')
            );

            if (application) {
              // Update member's applications_sent to REMOVED
              await Application.updateOne(
                {
                  userId: removedMemberId,
                  'applications_sent.applicationId': application.applicationId
                },
                {
                  $set: {
                    'applications_sent.$.status': 'REMOVED',
                    'applications_sent.$.statusUpdatedAt': now,
                    'applications_sent.$.removedFromTeamAt': now,
                    'applications_sent.$.removalReason': 'Removed by project owner during project edit'
                  }
                }
              );

              // Update owner's applications_received to REMOVED
              await Application.updateOne(
                {
                  userId: updatedProject.ownerId,
                  'applications_received.applicationId': application.applicationId
                },
                {
                  $set: {
                    'applications_received.$.status': 'REMOVED',
                    'applications_received.$.statusUpdatedAt': now,
                    'applications_received.$.removedFromTeamAt': now,
                    'applications_received.$.removalReason': 'Removed by project owner during project edit'
                  }
                }
              );

              // Update stats for both users
              const updatedMemberApp = await Application.findOne({ userId: removedMemberId });
              if (updatedMemberApp) {
                updatedMemberApp.updateStats();
                await updatedMemberApp.save();
              }

              const updatedOwnerApp = await Application.findOne({ userId: updatedProject.ownerId });
              if (updatedOwnerApp) {
                updatedOwnerApp.updateStats();
                await updatedOwnerApp.save();
              }

              console.log(`Application status updated to REMOVED for removed member: ${removedMemberId}`);
            }
          }
        } catch (error) {
          console.error('Error updating application status for removed member:', error);
          // Continue with other members even if one fails
        }
      }
    }

    // CRITICAL FIX: Sync project name and stage to applications
    // This keeps application data current WITHOUT touching status or membership fields
    // Only updates display fields like projectName and projectStage
    if (updateData.title || updateData.stage) {
      try {
        const updateFields = {};
        
        if (updateData.title) {
          updateFields['applications_received.$[elem].projectName'] = updateData.title;
          updateFields['applications_sent.$[elem].projectName'] = updateData.title;
        }
        
        if (updateData.stage) {
          updateFields['applications_received.$[elem].projectStage'] = updateData.stage;
          updateFields['applications_sent.$[elem].projectStage'] = updateData.stage;
        }

        // CRITICAL: Only update display fields, never touch status fields
        // This ensures ACCEPTED/INVITED users maintain their status regardless of project updates
        await Application.updateMany(
          { 'applications_received.projectId': id },
          { $set: updateFields },
          { arrayFilters: [{ 'elem.projectId': id }] }
        );

        await Application.updateMany(
          { 'applications_sent.projectId': id },
          { $set: updateFields },
          { arrayFilters: [{ 'elem.projectId': id }] }
        );

        console.log('Project details synced to applications (display fields only, status preserved)');
      } catch (error) {
        console.error('Error syncing project details to applications:', error);
        // Don't fail the request, just log the error
      }
    }

    // CRITICAL FIX: Sync position name changes to applications
    // When openPositions role names change, update all applications with old position names
    if (updateData.openPositions && originalProject.openPositions) {
      try {
        // Simple approach: Compare positions by index
        // If a position at the same index has a different role name, it's likely a rename
        const positionNameChanges = {};
        
        const minLength = Math.min(originalProject.openPositions.length, updateData.openPositions.length);
        
        for (let i = 0; i < minLength; i++) {
          const oldPos = originalProject.openPositions[i];
          const newPos = updateData.openPositions[i];
          
          // If role name changed at same index, consider it a rename
          if (oldPos.role && newPos.role && oldPos.role !== newPos.role) {
            // Additional check: skills should be similar (at least 50% overlap)
            let isSimilar = true;
            if (oldPos.skills && newPos.skills && oldPos.skills.length > 0 && newPos.skills.length > 0) {
              const oldSkillsSet = new Set(oldPos.skills.map(s => s.toLowerCase()));
              const newSkillsSet = new Set(newPos.skills.map(s => s.toLowerCase()));
              const intersection = [...oldSkillsSet].filter(s => newSkillsSet.has(s));
              const similarity = intersection.length / Math.max(oldSkillsSet.size, newSkillsSet.size);
              isSimilar = similarity >= 0.3; // At least 30% similarity
            }
            
            if (isSimilar) {
              positionNameChanges[oldPos.role] = newPos.role;
            }
          }
        }

        // Update position names in applications if any were renamed
        for (const [oldPositionName, newPositionName] of Object.entries(positionNameChanges)) {
          // Update applications_received
          await Application.updateMany(
            { 
              'applications_received.projectId': id,
              'applications_received.position': oldPositionName
            },
            { 
              $set: { 'applications_received.$[elem].position': newPositionName }
            },
            { 
              arrayFilters: [{ 
                'elem.projectId': id,
                'elem.position': oldPositionName
              }]
            }
          );

          // Update applications_sent
          await Application.updateMany(
            { 
              'applications_sent.projectId': id,
              'applications_sent.position': oldPositionName
            },
            { 
              $set: { 'applications_sent.$[elem].position': newPositionName }
            },
            { 
              arrayFilters: [{ 
                'elem.projectId': id,
                'elem.position': oldPositionName
              }]
            }
          );

          // Update teamMembers role if they match the old position name
          await Project.updateOne(
            { _id: id },
            { 
              $set: { 
                'teamMembers.$[member].role': newPositionName
              }
            },
            {
              arrayFilters: [{
                'member.role': oldPositionName
              }]
            }
          );

          console.log(`Position name synced: "${oldPositionName}" → "${newPositionName}"`);
        }
      } catch (error) {
        console.error('Error syncing position name changes:', error);
        // Don't fail the request, just log the error
      }
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

    // CRITICAL FIX: Find projects where user is participating
    // User is participating if:
    // 1. They are in teamMembers array, OR
    // 2. They have an ACCEPTED or INVITED application (both indicate membership)
    // This ensures users don't lose visibility to projects during updates
    
    // Get projects where user is a team member
    const teamMemberProjects = await Project.find({
      'teamMembers.id': userId,
      ownerId: { $ne: userId }
    })
      .populate('ownerId', 'name email')
      .populate('teamMembers.id', 'name email')
      .sort({ createdAt: -1 });

    // Get projects where user has ACCEPTED or INVITED applications
    const userApplications = await Application.findOne({ userId });
    const participatingProjectIds = [];
    
    if (userApplications && userApplications.applications_sent) {
      userApplications.applications_sent.forEach(app => {
        // Include both ACCEPTED and INVITED status - both mean user is part of the project
        if ((app.status === 'ACCEPTED' || app.status === 'INVITED') && app.projectId) {
          participatingProjectIds.push(app.projectId.toString());
        }
      });
    }

    // Get projects with accepted/invited applications (excluding already found team member projects)
    const teamMemberProjectIds = teamMemberProjects.map(p => p._id.toString());
    const additionalProjectIds = participatingProjectIds.filter(
      id => !teamMemberProjectIds.includes(id)
    );

    let acceptedApplicationProjects = [];
    if (additionalProjectIds.length > 0) {
      acceptedApplicationProjects = await Project.find({
        _id: { $in: additionalProjectIds },
        ownerId: { $ne: userId }
      })
        .populate('ownerId', 'name email')
        .populate('teamMembers.id', 'name email')
        .sort({ createdAt: -1 });
    }

    // Combine both lists - user sees project if they're in teamMembers OR have accepted/invited status
    const participatingProjects = [...teamMemberProjects, ...acceptedApplicationProjects];

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
    const { isQuit } = req.query; // Check if this is a quit action from the member

    console.log('Removing team member - ProjectId:', id, 'UserId:', userId, 'isQuit:', isQuit);

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

    // Determine status and reason based on whether it's a quit or removal
    const status = isQuit === 'true' ? 'QUIT' : 'REMOVED';
    const removalReason = isQuit === 'true' ? 'Member quit the project' : 'Removed by project owner';
    const now = new Date();

    // Find the application for this project and user
    const memberApplication = await Application.findOne({
      userId: userId,
      'applications_sent.projectId': id
    });

    if (memberApplication) {
      const application = memberApplication.applications_sent.find(
        app => app.projectId.toString() === id && 
               (app.status === 'ACCEPTED' || app.status === 'INVITED')
      );

      if (application) {
        // Update member's applications_sent with appropriate status
        const updateFields = {
          'applications_sent.$.status': status,
          'applications_sent.$.statusUpdatedAt': now,
          'applications_sent.$.removalReason': removalReason
        };

        if (isQuit === 'true') {
          updateFields['applications_sent.$.quitAt'] = now;
        } else {
          updateFields['applications_sent.$.removedFromTeamAt'] = now;
        }

        await Application.updateOne(
          {
            userId: userId,
            'applications_sent.applicationId': application.applicationId
          },
          { $set: updateFields }
        );

        // Update owner's applications_received with appropriate status
        const ownerUpdateFields = {
          'applications_received.$.status': status,
          'applications_received.$.statusUpdatedAt': now,
          'applications_received.$.removalReason': removalReason
        };

        if (isQuit === 'true') {
          ownerUpdateFields['applications_received.$.quitAt'] = now;
        } else {
          ownerUpdateFields['applications_received.$.removedFromTeamAt'] = now;
        }

        await Application.updateOne(
          {
            userId: project.ownerId,
            'applications_received.applicationId': application.applicationId
          },
          { $set: ownerUpdateFields }
        );

        // Update stats for both users
        const updatedMemberApp = await Application.findOne({ userId: userId });
        if (updatedMemberApp) {
          updatedMemberApp.updateStats();
          await updatedMemberApp.save();
        }

        const updatedOwnerApp = await Application.findOne({ userId: project.ownerId });
        if (updatedOwnerApp) {
          updatedOwnerApp.updateStats();
          await updatedOwnerApp.save();
        }

        console.log(`Application status updated to ${status}`);
      }
    }

    const response = successResponse(project, isQuit === 'true' ? 'Successfully quit project' : 'Team member removed successfully');
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