import Project from '../../models/Project.js';
import User from '../../models/User.js';
import Application from '../../models/Application.js';
import { createNotification } from './notificationController.js';
import { broadcastToProject } from '../../utils/chatSseClients.js';
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
      const invitedMembers = projectData.teamMembers
        .filter(member => member.role !== 'Founder' && member.id)
        .map(member => {
          const position = newProject.openPositions.find(p => p.role === member.role);
          return {
            ...member,
            positionId: position ? position._id.toString() : (member.positionId || null)
          };
        });

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
                  positionId: member.positionId,
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
                  positionId: member.positionId,
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

          // Notify invited member
          await createNotification({
            recipientId: member.id,
            type: 'INVITATION_RECEIVED',
            message: `${newProject.title}: You have been invited to join as ${member.role} by ${owner.name}.`,
            projectId: newProject._id,
            projectName: newProject.title,
            positionName: member.role,
            actorName: owner.name,
            navigationPath: '/dashboard',
            navigationState: { tab: 'applications', subTab: 'sent' }
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

    // CRITICAL DATA INTEGRITY: Ensure all ACCEPTED members are preserved during updates
    // unless this is an EXPLICIT membership change that doesn't break relationships.
    // Participation should depend on status/membership, not on project fields.
    let membersActuallyChanged = false;
    let memberRolesChanged = []; // Track members who had their role changed

    if (updateData.teamMembers !== undefined) {
      const originalMembers = originalProject.teamMembers || [];
      const newMembersInUpdate = updateData.teamMembers || [];
      
      // Helper to normalize IDs for comparison
      const getNormalizedId = (idOrObj) => {
        if (!idOrObj) return null;
        if (typeof idOrObj === 'string') return idOrObj;
        if (typeof idOrObj === 'object') {
          return (idOrObj._id || idOrObj).toString();
        }
        return idOrObj.toString();
      };

      const originalMemberIdsSet = new Set(originalMembers
        .map(m => getNormalizedId(m.id))
        .filter(Boolean));
      
      const newMemberIdsSet = new Set(newMembersInUpdate
        .map(m => getNormalizedId(m.id))
        .filter(Boolean));
      
      // Identify members genuinely added
      membersActuallyChanged = newMembersInUpdate.some(m => {
        const mid = getNormalizedId(m.id);
        return mid && !originalMemberIdsSet.has(mid);
      });

      // SYNC ROLE CHANGES: Detect if an existing member's role was changed in the update
      for (const newMember of newMembersInUpdate) {
        const mid = getNormalizedId(newMember.id);
        if (mid && originalMemberIdsSet.has(mid)) {
          const oldMember = originalMembers.find(m => getNormalizedId(m.id) === mid);
          const oldPosId = getNormalizedId(oldMember.positionId);
          const newPosId = getNormalizedId(newMember.positionId);

          if (oldMember && (oldMember.role !== newMember.role || oldPosId !== newPosId)) {
            console.log(`Detected role change for member ${mid}: "${oldMember.role}" → "${newMember.role}"`);
            memberRolesChanged.push({
              userId: mid,
              oldRole: oldMember.role,
              oldPositionId: oldPosId,
              newRole: newMember.role,
              newPositionId: newPosId
            });
          }
        }
      }

      // Identify members genuinely removed (present in original but NOT in update)
      const removedMembers = originalMembers.filter(m => {
        const mid = getNormalizedId(m.id);
        return mid && !newMemberIdsSet.has(mid) && m.role !== 'Founder';
      });

      if (removedMembers.length > 0) {
        console.log(`Processing removal for ${removedMembers.length} members missing from update.`);
        const now = new Date();
        for (const rm of removedMembers) {
          const userId = getNormalizedId(rm.id);
          try {
            // Update applicant's application record (sent)
            const applicantApp = await Application.findOne({ userId });
            if (applicantApp) {
              const app = applicantApp.applications_sent.find(
                a => a.projectId.toString() === id && 
                   (a.status === 'ACCEPTED' || a.status === 'INVITED')
              );
              if (app) {
                app.status = 'REMOVED';
                app.statusUpdatedAt = now;
                app.removedFromTeamAt = now;
                app.removalReason = 'Removed by project owner during project update';
                applicantApp.updateStats();
                await applicantApp.save();
                console.log(`Marked application status as REMOVED for user ${userId}`);
              }
            }

            // Update owner's application record (received)
            const ownerApp = await Application.findOne({ userId: originalProject.ownerId });
            if (ownerApp) {
              const app = ownerApp.applications_received.find(
                a => a.projectId.toString() === id && 
                   a.applicantId.toString() === userId &&
                   (a.status === 'ACCEPTED' || a.status === 'INVITED')
              );
              if (app) {
                app.status = 'REMOVED';
                app.statusUpdatedAt = now;
                app.removedFromTeamAt = now;
                app.removalReason = 'Removed by project owner during project update';
                ownerApp.updateStats();
                await ownerApp.save();
              }
            }

            // Notify removed member
            const removedMemberApp = await Application.findOne({ userId });
            const removedApp = removedMemberApp?.applications_sent.find(
              a => a.projectId.toString() === id && a.status === 'REMOVED'
            );
            if (removedApp) {
              await createNotification({
                recipientId: userId,
                type: 'MEMBER_REMOVED',
                message: `${originalProject.title}: You have been removed from the ${removedApp.position} role.`,
                projectId: id,
                projectName: originalProject.title,
                positionName: removedApp.position,
                navigationPath: '/dashboard',
                navigationState: { tab: 'applications', subTab: 'sent' }
              });
            }
          } catch (err) {
            console.error(`Error during member removal sync for user ${userId}:`, err);
          }
        }
      }

      // Final deduplication
      const uniqueMembers = [];
      const seenMemberIds = new Set();
      for (const member of updateData.teamMembers) {
        const mid = getNormalizedId(member.id);
        if (mid && !seenMemberIds.has(mid)) {
          uniqueMembers.push(member);
          seenMemberIds.add(mid);
        } else if (!mid) {
          uniqueMembers.push(member);
        }
      }
      updateData.teamMembers = uniqueMembers;
    }

    const updatedProject = await Project.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    )
      .populate('ownerId', 'name email')
      .populate('teamMembers.id', 'name email');

    // CRITICAL FIX: Sync individual member role updates back to their Applications
    // This ensures that when an owner changes a member's position/custom-role, 
    // the application record stays in sync with matching projectId + userId + status
    if (memberRolesChanged.length > 0) {
      for (const change of memberRolesChanged) {
        try {
          // Update applicant's send record - Match by userId, projectId, and status
          // Use ID-based matching primarily, with role name as fallback
          const sentFilter = { 
            userId: change.userId, 
            'applications_sent.projectId': id,
            'applications_sent.status': { $in: ['ACCEPTED', 'INVITED'] }
          };

          if (change.oldPositionId) {
            sentFilter['$or'] = [
              { 'applications_sent.positionId': change.oldPositionId },
              { 'applications_sent.position': change.oldRole }
            ];
          } else {
            sentFilter['applications_sent.position'] = change.oldRole;
          }

          await Application.updateOne(
            sentFilter,
            { 
              $set: { 
                'applications_sent.$[elem].position': change.newRole,
                'applications_sent.$[elem].positionId': change.newPositionId 
              } 
            },
            { arrayFilters: [{ 
              'elem.projectId': id, 
              'elem.status': { $in: ['ACCEPTED', 'INVITED'] },
              $or: [
                { 'elem.positionId': change.oldPositionId || 'NONE' },
                { 'elem.position': change.oldRole }
              ]
            }] }
          );

          // Update owner's received record
          const receivedFilter = { 
            userId: originalProject.ownerId, 
            'applications_received.projectId': id,
            'applications_received.applicantId': change.userId,
            'applications_received.status': { $in: ['ACCEPTED', 'INVITED'] }
          };

          if (change.oldPositionId) {
            receivedFilter['$or'] = [
              { 'applications_received.positionId': change.oldPositionId },
              { 'applications_received.position': change.oldRole }
            ];
          } else {
            receivedFilter['applications_received.position'] = change.oldRole;
          }

          await Application.updateOne(
            receivedFilter,
            { 
              $set: { 
                'applications_received.$[elem].position': change.newRole,
                'applications_received.$[elem].positionId': change.newPositionId 
              } 
            },
            { arrayFilters: [{ 
              'elem.projectId': id, 
              'elem.applicantId': change.userId,
              'elem.status': { $in: ['ACCEPTED', 'INVITED'] },
              $or: [
                { 'elem.positionId': change.oldPositionId || 'NONE' },
                { 'elem.position': change.oldRole }
              ]
            }] }
          );
        } catch (error) {
          console.error(`Error syncing role change for user ${change.userId}:`, error);
        }
      }
    }

    // Process new invitations only
    if (membersActuallyChanged) {
      // Re-calculate original IDs
      const originalMemberIdsSet = new Set(originalProject.teamMembers
        .map(m => m.id ? (typeof m.id === 'object' ? (m.id._id?.toString() || m.id.toString()) : m.id.toString()) : null)
        .filter(Boolean));

      // Find truly new members (excluding founder)
      let addedMembers = (updateData.teamMembers || [])
        .filter(member => member.id && 
                  member.role !== 'Founder' && 
                  !originalMemberIdsSet.has(member.id.toString()))
        .map(member => {
          const position = updatedProject.openPositions.find(p => p.role === member.role);
          return {
            ...member,
            positionId: position ? position._id.toString() : (member.positionId || null)
          };
        });

      if (addedMembers.length > 0) {
        console.log(`Processing ${addedMembers.length} new team invitations`);
        for (const member of addedMembers) {
          try {
            const applicationId = `INV-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            const owner = await User.findById(updatedProject.ownerId);
            const invitedUser = await User.findById(member.id);
            if (!owner || !invitedUser) continue;

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
                    positionId: member.positionId,
                    message: 'Invited to join the project',
                    status: 'INVITED',
                    appliedDate: new Date(),
                    statusUpdatedAt: new Date()
                  }
                }
              },
              { upsert: true, new: true }
            ).then(doc => { doc.updateStats(); return doc.save(); });

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
                    positionId: member.positionId,
                    message: 'Invited to join the project',
                    status: 'INVITED',
                    appliedDate: new Date(),
                    statusUpdatedAt: new Date()
                  }
                }
              },
              { upsert: true, new: true }
            ).then(doc => { doc.updateStats(); return doc.save(); });

            // Notify invited member
            await createNotification({
              recipientId: member.id,
              type: 'INVITATION_RECEIVED',
              message: `${updatedProject.title}: You have been invited to join as ${member.role} by ${owner.name}.`,
              projectId: updatedProject._id,
              projectName: updatedProject.title,
              positionName: member.role,
              actorName: owner.name,
              navigationPath: '/dashboard',
              navigationState: { tab: 'applications', subTab: 'sent' }
            });
          } catch (error) {
            console.error('Error creating invitation record:', error);
          }
        }
      }
    }

    // CRITICAL FIX: Sync project name, stage, and industry to ALL applications
    // This keeps application data current WITHOUT touching status or membership
    if (updateData.title || updateData.stage || updateData.industry) {
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

        if (updateData.industry) {
          // Note: applications_received doesn't store projectIndustry, only applications_sent does
          updateFields['applications_sent.$[elem].projectIndustry'] = updateData.industry;
        }

        // CRITICAL: Only update display fields, NEVER touch status or membership fields
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

        console.log(`Project details (${Object.keys(updateFields).join(', ')}) synced to all applications`);
      } catch (error) {
        console.error('Error syncing project details to applications:', error);
      }
    }

    // CRITICAL FIX: Sync position alterations to applications
    // This handles both renames and other property changes for open positions
    if (updateData.openPositions && originalProject.openPositions) {
      try {
        const originalPositions = originalProject.openPositions;
        const newPositions = updatedProject.openPositions;

        for (const newPos of newPositions) {
          // Find the corresponding original position by ID
          const oldPos = originalPositions.find(p => p._id.toString() === newPos._id.toString());
          
          if (oldPos && oldPos.role !== newPos.role) {
            console.log(`Detected position rename via ID: "${oldPos.role}" → "${newPos.role}" (ID: ${newPos._id})`);
            
            // Update applications_received position field using positionId as primary anchor
            await Application.updateMany(
              { 
                'applications_received.projectId': id,
                $or: [
                  { 'applications_received.positionId': newPos._id.toString() },
                  { 'applications_received.position': oldPos.role }
                ]
              },
              { 
                $set: { 
                  'applications_received.$[elem].position': newPos.role,
                  'applications_received.$[elem].positionId': newPos._id.toString()
                }
              },
              { 
                arrayFilters: [{ 
                  'elem.projectId': id,
                  $or: [
                    { 'elem.positionId': newPos._id.toString() },
                    { 'elem.position': oldPos.role }
                  ]
                }]
              }
            );

            // Update applications_sent position field
            await Application.updateMany(
              { 
                'applications_sent.projectId': id,
                $or: [
                  { 'applications_sent.positionId': newPos._id.toString() },
                  { 'applications_sent.position': oldPos.role }
                ]
              },
              { 
                $set: { 
                  'applications_sent.$[elem].position': newPos.role,
                  'applications_sent.$[elem].positionId': newPos._id.toString()
                }
              },
              { 
                arrayFilters: [{ 
                  'elem.projectId': id,
                  $or: [
                    { 'elem.positionId': newPos._id.toString() },
                    { 'elem.position': oldPos.role }
                  ]
                }]
              }
            );

            // Update team member roles in project
            await Project.updateOne(
              { _id: id },
              { 
                $set: { 
                  'teamMembers.$[member].role': newPos.role,
                  'teamMembers.$[member].positionId': newPos._id
                }
              },
              {
                arrayFilters: [{
                  $or: [
                    { 'member.positionId': newPos._id },
                    { 'member.role': oldPos.role }
                  ]
                }]
              }
            );

            // Update in-memory object for response consistency
            if (updatedProject.teamMembers) {
              updatedProject.teamMembers.forEach(member => {
                const memberPosId = member.positionId?.toString();
                if (memberPosId === newPos._id.toString() || member.role === oldPos.role) {
                  member.role = newPos.role;
                  member.positionId = newPos._id;
                }
              });
            }

            console.log(`Position name and ID synced across applications and team: "${oldPos.role}" → "${newPos.role}"`);
          }
        }
      } catch (error) {
        console.error('Error syncing position name changes:', error);
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
    // Check BOTH Application status AND Project teamMembers for maximum reliability
    const userApplications = await Application.findOne({ userId });
    const participatingProjectIds = [];
    
    if (userApplications && userApplications.applications_sent) {
      userApplications.applications_sent.forEach(app => {
        // Include both ACCEPTED and INVITED status
        if ((app.status === 'ACCEPTED' || app.status === 'INVITED') && app.projectId) {
          participatingProjectIds.push(app.projectId.toString());
        }
      });
    }

    // Query projects by Application ID list OR direct membership in teamMembers array
    const participatingFilter = {
      $or: [
        { _id: { $in: participatingProjectIds } },
        { 'teamMembers.id': userId }
      ],
      ownerId: { $ne: userId }
    };

    const participatingProjects = await Project.find(participatingFilter)
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

        // Send notification based on action type
        if (isQuit === 'true') {
          // Notify project owner that a member quit
          const memberUser = await User.findById(userId);
          const memberName = memberUser?.name || application.applicantName || 'A member';
          await createNotification({
            recipientId: project.ownerId,
            type: 'MEMBER_QUIT',
            message: `${memberName} has left the ${application.position} role in ${project.title}.`,
            projectId: project._id,
            projectName: project.title,
            positionName: application.position,
            actorName: memberName,
            navigationPath: '/dashboard',
            navigationState: { tab: 'applications', subTab: 'received' }
          });
        } else {
          // Notify the removed member
          await createNotification({
            recipientId: userId,
            type: 'MEMBER_REMOVED',
            message: `${project.title}: You have been removed from the ${application.position} role.`,
            projectId: project._id,
            projectName: project.title,
            positionName: application.position,
            navigationPath: '/dashboard',
            navigationState: { tab: 'applications', subTab: 'sent' }
          });
        }
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
  }),

  // ── Tasks ──────────────────────────────────────────────────────────────────

  // GET /projects/:id/tasks
  getTasks: asyncHandler(async (req, res) => {
    const project = await Project.findById(req.params.id).select('tasks');
    if (!project) return res.status(404).json(errorResponse('Project not found', 'PROJECT_NOT_FOUND'));
    res.json(successResponse(project.tasks, 'Tasks retrieved'));
  }),

  // POST /projects/:id/tasks
  createTask: asyncHandler(async (req, res) => {
    const { title, description, assigneeId, dueDate, priority, steps, createdBy, createdById } = req.body;
    if (!title?.trim()) return res.status(400).json(errorResponse('Title is required', 'MISSING_TITLE'));

    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json(errorResponse('Project not found', 'PROJECT_NOT_FOUND'));

    const task = {
      title: title.trim(),
      description: description || '',
      assigneeId: assigneeId || '',
      dueDate: dueDate || '',
      priority: priority || 'medium',
      steps: (steps || []).map(s => ({ id: s.id?.toString() || Date.now().toString(), text: s.text, done: !!s.done })),
      status: 'pending',
      createdBy: createdBy || 'Unknown',
      createdById: createdById || '',
      createdAt: new Date(),
    };

    project.tasks.push(task);
    await project.save();

    const saved = project.tasks[project.tasks.length - 1];
    broadcastToProject(req.params.id, { type: 'task_created', task: saved });
    res.status(201).json(successResponse(saved, 'Task created'));
  }),

  // PUT /projects/:id/tasks/:taskId
  updateTask: asyncHandler(async (req, res) => {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json(errorResponse('Project not found', 'PROJECT_NOT_FOUND'));

    const task = project.tasks.id(req.params.taskId);
    if (!task) return res.status(404).json(errorResponse('Task not found', 'TASK_NOT_FOUND'));

    const { title, description, assigneeId, dueDate, priority, steps, status } = req.body;
    if (title !== undefined) task.title = title.trim();
    if (description !== undefined) task.description = description;
    if (assigneeId !== undefined) task.assigneeId = assigneeId;
    if (dueDate !== undefined) task.dueDate = dueDate;
    if (priority !== undefined) task.priority = priority;
    if (status !== undefined) task.status = status;
    if (steps !== undefined) task.steps = steps.map(s => ({ id: s.id?.toString(), text: s.text, done: !!s.done }));

    await project.save();
    broadcastToProject(req.params.id, { type: 'task_updated', task });
    res.json(successResponse(task, 'Task updated'));
  }),

  // DELETE /projects/:id/tasks/:taskId
  deleteTask: asyncHandler(async (req, res) => {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json(errorResponse('Project not found', 'PROJECT_NOT_FOUND'));

    const task = project.tasks.id(req.params.taskId);
    if (!task) return res.status(404).json(errorResponse('Task not found', 'TASK_NOT_FOUND'));

    task.deleteOne();
    await project.save();
    broadcastToProject(req.params.id, { type: 'task_deleted', taskId: req.params.taskId });
    res.json(successResponse({ taskId: req.params.taskId }, 'Task deleted'));
  })
};

export default projectController;