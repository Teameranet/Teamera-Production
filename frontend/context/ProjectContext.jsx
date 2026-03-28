import { createContext, useContext, useState, useEffect } from 'react';

const ProjectContext = createContext();

export const useProjects = () => {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProjects must be used within a ProjectProvider');
  }
  return context;
};

export const ProjectProvider = ({ children }) => {
  const [projects, setProjects] = useState([]);
  const [hackathons, setHackathons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userProjectMap, setUserProjectMap] = useState({});
  const [bookmarkedProjects, setBookmarkedProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [projectToEdit, setProjectToEdit] = useState(null);
  const [showCreateProjectModal, setShowCreateProjectModal] = useState(false);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [applications, setApplications] = useState([]);
  const [applicationsLoading, setApplicationsLoading] = useState(false);

  const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  
  // Function to fetch applications (can be called anytime)
  const fetchApplications = async () => {
    try {
      setApplicationsLoading(true);
      // Get userId from localStorage
      const savedUser = localStorage.getItem('teamera_user');
      if (!savedUser) {
        console.log('No user found in localStorage');
        setApplicationsLoading(false);
        return;
      }

      const user = JSON.parse(savedUser);
      const userId = user.id || user._id;

      if (!userId) {
        console.log('No userId found');
        setApplicationsLoading(false);
        return;
      }

      console.log('Fetching applications for user:', userId);

      // Fetch applications from dashboard endpoint
      const response = await fetch(`${apiBaseUrl}/api/dashboard/${userId}/applications`);
      const result = await response.json();

      console.log('Applications fetch result:', result);

      if (result.success && result.data) {
        const applicationData = result.data;
        
        // Combine received and sent applications
        const receivedApps = (applicationData.applications_received || []).map(app => {
          // If applicantId is populated (object), extract data from it
          const applicantData = typeof app.applicantId === 'object' && app.applicantId !== null
            ? app.applicantId
            : null;

          return {
            ...app,
            id: app.applicationId,
            type: 'received',
            // Use populated data if available, otherwise use stored fields
            applicantName: applicantData?.name || app.applicantName,
            applicantEmail: applicantData?.email || app.applicantEmail,
            applicantAvatar: applicantData?.avatar || app.applicantAvatar || 'U',
            applicantTitle: applicantData?.title || app.applicantTitle || '',
            applicantLocation: applicantData?.location || app.applicantLocation || '',
            applicantColor: app.applicantColor || '#4f46e5',
            // Store full user details for profile modal
            userDetails: applicantData ? {
              _id: applicantData._id,
              name: applicantData.name,
              email: applicantData.email,
              avatar: applicantData.avatar,
              title: applicantData.title,
              location: applicantData.location,
              bio: applicantData.bio,
              role: applicantData.role,
              skills: applicantData.skills,
              githubUrl: applicantData.githubUrl,
              linkedinUrl: applicantData.linkedinUrl,
              portfolioUrl: applicantData.portfolioUrl,
              experiences: applicantData.experiences,
              education: applicantData.education
            } : {
              _id: app.applicantId,
              name: app.applicantName,
              email: app.applicantEmail,
              avatar: app.applicantAvatar,
              title: app.applicantTitle,
              location: app.applicantLocation
            }
          };
        });

        const sentApps = (applicationData.applications_sent || []).map(app => {
          // If projectOwnerId is populated (object), extract data from it
          const ownerData = typeof app.projectOwnerId === 'object' && app.projectOwnerId !== null
            ? app.projectOwnerId
            : null;

          return {
            ...app,
            id: app.applicationId,
            type: 'sent',
            // Use populated data if available, otherwise use stored fields
            projectOwnerName: ownerData?.name || app.projectOwnerName,
            projectOwnerEmail: ownerData?.email || app.projectOwnerEmail,
            projectOwnerAvatar: ownerData?.avatar || app.projectOwnerAvatar || 'U',
            userDetails: ownerData ? {
              _id: ownerData._id,
              name: ownerData.name,
              email: ownerData.email,
              avatar: ownerData.avatar
            } : {
              _id: app.projectOwnerId,
              name: app.projectOwnerName,
              email: app.projectOwnerEmail,
              avatar: app.projectOwnerAvatar
            }
          };
        });

        // Combine both arrays
        const allApplications = [...receivedApps, ...sentApps];

        console.log('Transformed applications:', {
          received: receivedApps.length,
          sent: sentApps.length,
          total: allApplications.length
        });
        
        setApplications(allApplications);
      } else {
        console.log('No applications found or fetch failed');
        setApplications([]);
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
      setApplications([]);
    } finally {
      setApplicationsLoading(false);
    }
  };
   // Fetch all projects from backend
    useEffect(() => {
      const fetchProjectsData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${apiBaseUrl}/api/projects`);
        const result = await response.json();
        
        if (result.success && result.data) {
          // Transform backend data to match frontend format
          const transformedProjects = result.data.map(project => ({
            ...project,
            id: project._id || project.id,
            requiredSkills: project.requiredSkills || []
          }));
          setProjects(transformedProjects);
        }
      } catch (error) {
        console.error('Error fetching projects:', error);
      } finally {
        setLoading(false);
      }
    };

    const fetchBookmarks = async () => {
      try {
        // Get userId from localStorage
        const savedUser = localStorage.getItem('teamera_user');
        if (!savedUser) return;

        const user = JSON.parse(savedUser);
        const userId = user.id || user._id;

        if (!userId) return;

        // Fetch bookmarks from MongoDB
        const response = await fetch(`${apiBaseUrl}/api/dashboard/${userId}/bookmarks`);
        const result = await response.json();

        if (result.success && result.data) {
          // Extract project IDs from bookmarked projects
          // Handle both populated (object) and non-populated (string) projectId
          const bookmarkIds = result.data.map(bookmark => {
            const projectId = bookmark.projectId;
            // If projectId is an object (populated), get its _id
            if (projectId && typeof projectId === 'object') {
              return projectId._id || projectId.id;
            }
            // If projectId is a string, use it directly
            return projectId;
          }).filter(Boolean).map(id => id.toString());

          setBookmarkedProjects(bookmarkIds);
          // Also update localStorage for offline access
          localStorage.setItem('bookmarkedProjects', JSON.stringify(bookmarkIds));
        }
      } catch (error) {
        console.error('Error fetching bookmarks:', error);
        // Fallback to localStorage if API fails
        const savedBookmarks = localStorage.getItem('bookmarkedProjects');
        if (savedBookmarks) {
          setBookmarkedProjects(JSON.parse(savedBookmarks));
        }
      }
    };

    fetchProjectsData();
    fetchBookmarks();
    fetchApplications(); // Call the function defined above
    setHackathons(sampleHackathons);
  }, []);

  const createProject = async (projectData) => {
    try {
      // Get the founder ID from team members
      const founderId = projectData.teamMembers && projectData.teamMembers.length > 0 
        ? projectData.teamMembers[0].id 
        : null;

      const payload = {
        ...projectData,
        ownerId: founderId
      };

      const response = await fetch(`${apiBaseUrl}/api/projects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (result.success && result.data) {
        const newProject = {
          ...result.data,
          id: result.data._id || result.data.id
        };

        setProjects(prev => [newProject, ...prev]);

        // Update user project mapping
        if (founderId) {
          setUserProjectMap(prev => {
            const userProjects = prev[founderId] || { ownedProjects: [], participatingProjects: [] };
            return {
              ...prev,
              [founderId]: {
                ...userProjects,
                ownedProjects: [...userProjects.ownedProjects, newProject.id]
              }
            };
          });
        }

        return newProject;
      } else {
        console.error('Failed to create project:', result.message);
        return null;
      }
    } catch (error) {
      console.error('Error creating project:', error);
      return null;
    }
  };

  // Edit an existing project
  const editProject = async (projectId, projectData) => {
    try {
      // Find the project to edit
      const projectIndex = projects.findIndex(p => p.id === projectId || p._id === projectId);

      if (projectIndex === -1) return false;

      // Get the original project to preserve founder information
      const originalProject = projects[projectIndex];
      const founder = originalProject.teamMembers.find(member => member.role === "Founder");

      // Create updated project object
      const updatedData = {
        ...projectData,
        ownerId: originalProject.ownerId
      };

      // Ensure the founder remains in the team members list
      if (founder) {
        // Extract founder ID for comparison
        const founderId = typeof founder.id === 'string' ? founder.id : 
                         typeof founder._id === 'string' ? founder._id :
                         founder.id?._id || founder.id?.toString() || 
                         founder._id?.toString() || null;
        
        // Check if founder is already in the team members (by ID or email)
        const founderExists = updatedData.teamMembers?.some(member => {
          const memberId = typeof member.id === 'string' ? member.id : 
                          typeof member._id === 'string' ? member._id :
                          member.id?._id || member.id?.toString() || 
                          member._id?.toString() || null;
          
          const isSameById = memberId && founderId && memberId === founderId;
          const isSameByEmail = member.email && founder.email && 
                               member.email.toLowerCase() === founder.email.toLowerCase();
          const isSameByRole = member.role === "Founder";
          
          return isSameById || isSameByEmail || isSameByRole;
        }) ?? false;

        if (!founderExists) {
          // Add founder to the beginning of the team members array with properly extracted ID
          updatedData.teamMembers = [
            {
              id: founderId,
              name: founder.name,
              role: "Founder",
              email: founder.email || ''
            },
            ...(updatedData.teamMembers || [])
          ];
        }
        
        // Final deduplication: Remove any duplicate founders by role
        const founderCount = updatedData.teamMembers.filter(m => m.role === "Founder").length;
        if (founderCount > 1) {
          console.warn('Multiple founders detected, removing duplicates');
          let founderAdded = false;
          updatedData.teamMembers = updatedData.teamMembers.filter(member => {
            if (member.role === "Founder") {
              if (!founderAdded) {
                founderAdded = true;
                return true; // Keep the first founder
              }
              return false; // Remove subsequent founders
            }
            return true; // Keep non-founder members
          });
        }
      }

      const response = await fetch(`${apiBaseUrl}/api/projects/${projectId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedData)
      });

      const result = await response.json();

      if (result.success && result.data) {
        const updatedProject = {
          ...result.data,
          id: result.data._id || result.data.id
        };

        setProjects(prev => prev.map(project =>
          (project.id === projectId || project._id === projectId) ? updatedProject : project
        ));

        return true;
      } else {
        console.error('Failed to update project:', result.message);
        return false;
      }
    } catch (error) {
      console.error('Error updating project:', error);
      return false;
    }
  };

  // Delete a project and update user mappings
  const deleteProject = async (projectId) => {
    try {
      // Find the project to be deleted
      const projectToDelete = projects.find(p => p.id === projectId || p._id === projectId);

      if (!projectToDelete) return false;

      const response = await fetch(`${apiBaseUrl}/api/projects/${projectId}`, {
        method: 'DELETE'
      });

      const result = await response.json();

      if (result.success) {
        // Remove project from projects array
        setProjects(prev => prev.filter(project => 
          project.id !== projectId && project._id !== projectId
        ));

        // Update user project mappings
        setUserProjectMap(prev => {
          const updatedMap = { ...prev };
          const userIds = new Set();

          if (projectToDelete.ownerId) {
            userIds.add(projectToDelete.ownerId.toString());
          }

          projectToDelete.teamMembers?.forEach(member => {
            if (member.id) userIds.add(member.id.toString());
          });

          userIds.forEach(userId => {
            if (updatedMap[userId]) {
              if (updatedMap[userId].ownedProjects) {
                updatedMap[userId].ownedProjects = updatedMap[userId].ownedProjects.filter(
                  id => id !== projectId.toString()
                );
              }
              if (updatedMap[userId].participatingProjects) {
                updatedMap[userId].participatingProjects = updatedMap[userId].participatingProjects.filter(
                  id => id !== projectId.toString()
                );
              }
            }
          });

          return updatedMap;
        });

        // Remove from bookmarks
        if (bookmarkedProjects.includes(projectId)) {
          setBookmarkedProjects(prev => {
            const updatedBookmarks = prev.filter(id => id !== projectId);
            localStorage.setItem('bookmarkedProjects', JSON.stringify(updatedBookmarks));
            return updatedBookmarks;
          });
        }

        return true;
      } else {
        console.error('Failed to delete project:', result.message);
        return false;
      }
    } catch (error) {
      console.error('Error deleting project:', error);
      return false;
    }
  };

  const applyToProject = async (projectId, applicationData) => {
    try {
      // Get user from localStorage
      const savedUser = localStorage.getItem('teamera_user');
      if (!savedUser) {
        console.error('User not logged in');
        return false;
      }

      const user = JSON.parse(savedUser);
      const userId = user.id || user._id;

      // Find the project
      const project = projects.find(p => (p.id === projectId || p._id === projectId));
      if (!project) {
        console.error('Project not found');
        return false;
      }

      // Prepare application payload for backend
      const payload = {
        projectId: projectId,
        projectName: project.title,
        projectStage: project.stage || '',
        projectIndustry: project.industry || '',
        position: applicationData.position,
        applicantId: userId,
        applicantName: user.name,
        applicantEmail: user.email,
        applicantAvatar: user.avatar || '',
        applicantTitle: user.title || '',
        applicantLocation: user.location || '',
        projectOwnerId: project.ownerId || project.ownerId?._id,
        projectOwnerName: project.teamMembers?.find(m => m.role === 'Founder')?.name || 'Project Owner',
        projectOwnerEmail: project.teamMembers?.find(m => m.role === 'Founder')?.email || '',
        projectOwnerAvatar: project.teamMembers?.find(m => m.role === 'Founder')?.avatar || '',
        message: applicationData.message || '',
        skills: applicationData.skills || [],
        hasResume: !!applicationData.resumeUrl,
        resumeUrl: applicationData.resumeUrl || '',
        resumeFileName: applicationData.resume?.name || ''
      };

      // Submit application to backend
      const response = await fetch(`${apiBaseUrl}/api/applications/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (result.success) {
        // Create local application object for immediate UI update
        const newApplication = {
          id: result.data.applicationId,
          applicationId: result.data.applicationId,
          applicantId: userId,
          applicantName: user.name,
          applicantAvatar: user.avatar || 'U',
          applicantColor: applicationData.applicantColor || '#4f46e5',
          position: applicationData.position,
          skills: applicationData.skills || [],
          projectId: projectId,
          projectName: project.title,
          appliedDate: result.data.appliedDate,
          status: result.data.status,
          message: applicationData.message || '',
          hasResume: !!applicationData.resumeUrl,
          resumeUrl: applicationData.resumeUrl || '',
          userDetails: {
            name: user.name,
            email: user.email,
            avatar: user.avatar,
            bio: user.bio,
            skills: user.skills
          }
        };

        // Add application to local state
        setApplications(prev => [...prev, newApplication]);

        // Update project application count
        setProjects(prev => prev.map(p =>
          (p.id === projectId || p._id === projectId)
            ? { ...p, applications: (p.applications || 0) + 1 }
            : p
        ));

        return { success: true };
      } else {
        console.error('Failed to submit application:', result.message);
        return { 
          success: false, 
          message: result.message || 'Failed to submit application',
          existingStatus: result.existingStatus 
        };
      }
    } catch (error) {
      console.error('Error applying to project:', error);
      return { 
        success: false, 
        message: 'An error occurred while submitting your application. Please try again.' 
      };
    }
  };

  // Add a user to a project's team members
  const addUserToProject = (projectId, userData) => {
    console.log('Adding user to project:', projectId, 'User:', userData.name);
    
    // Check if project exists
    const projectIndex = projects.findIndex(p => p.id === projectId);

    if (projectIndex === -1) {
      console.log('Project not found:', projectId);
      return false;
    }

    console.log('Found project at index:', projectIndex, 'Current team members:', projects[projectIndex].teamMembers.length);

    // Check if user is already a team member
    const isAlreadyMember = projects[projectIndex].teamMembers.some(
      member => member.id === userData.id
    );

    if (isAlreadyMember) {
      console.log('User is already a team member');
      return false;
    }

    // Add user to the project's team members
    const updatedProjects = [...projects];
    updatedProjects[projectIndex] = {
      ...updatedProjects[projectIndex],
      teamMembers: [
        ...updatedProjects[projectIndex].teamMembers,
        userData
      ]
    };

    console.log('Updated project team members count:', updatedProjects[projectIndex].teamMembers.length);
    setProjects(updatedProjects);

    // Update user project mapping to add user to participating projects
    setUserProjectMap(prev => {
      const userProjects = prev[userData.id] || { ownedProjects: [], participatingProjects: [] };
      if (!userProjects.participatingProjects.includes(projectId.toString())) {
        return {
          ...prev,
          [userData.id]: {
            ...userProjects,
            participatingProjects: [...userProjects.participatingProjects, projectId.toString()]
          }
        };
      }
      return prev;
    });

    return true;
  };

  // Accept an application
  const acceptApplication = async (applicationId) => {
    try {
      const application = applications.find(app => app.id === applicationId || app.applicationId === applicationId);
      if (!application) {
        console.error('Application not found:', applicationId);
        return false;
      }

      // Get current user
      const savedUser = localStorage.getItem('teamera_user');
      if (!savedUser) return false;

      const user = JSON.parse(savedUser);
      const userId = user.id || user._id;

      console.log('Accepting application:', application.applicationId);

      // Update application status in backend
      const response = await fetch(`${apiBaseUrl}/api/applications/${application.applicationId || applicationId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'ACCEPTED',
          reviewerId: userId
        })
      });

      const result = await response.json();
      console.log('Accept application result:', result);

      if (result.success) {
        // Update local application status
        setApplications(prev => prev.map(app =>
          (app.id === applicationId || app.applicationId === applicationId)
            ? { ...app, status: 'ACCEPTED' }
            : app
        ));

        // Refresh project to get updated team
        const appProjectId = application.projectId?._id || application.projectId;
        const projectResponse = await fetch(`${apiBaseUrl}/api/projects/${appProjectId}`);
        const projectResult = await projectResponse.json();

        if (projectResult.success && projectResult.data) {
          const updatedProject = {
            ...projectResult.data,
            id: projectResult.data._id || projectResult.data.id
          };

          const projectIdToMatch = String(appProjectId);
          setProjects(prev => prev.map(p => {
            const pId = String(p.id || p._id);
            return pId === projectIdToMatch ? updatedProject : p;
          }));
        }

        return true;
      } else {
        console.error('Failed to accept application:', result.message);
        return false;
      }
    } catch (error) {
      console.error('Error accepting application:', error);
      return false;
    }
  };

  // Reject an application
  const rejectApplication = async (applicationId) => {
    try {
      const application = applications.find(app => app.id === applicationId || app.applicationId === applicationId);
      if (!application) {
        console.error('Application not found:', applicationId);
        return false;
      }

      // Get current user
      const savedUser = localStorage.getItem('teamera_user');
      if (!savedUser) return false;

      const user = JSON.parse(savedUser);
      const userId = user.id || user._id;

      console.log('Rejecting application:', application.applicationId);

      // Update application status in backend
      const response = await fetch(`${apiBaseUrl}/api/applications/${application.applicationId || applicationId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'REJECTED',
          reviewerId: userId
        })
      });

      const result = await response.json();
      console.log('Reject application result:', result);

      if (result.success) {
        // Update local application status
        setApplications(prev => prev.map(app =>
          (app.id === applicationId || app.applicationId === applicationId)
            ? { ...app, status: 'REJECTED' }
            : app
        ));

        return true;
      } else {
        console.error('Failed to reject application:', result.message);
        return false;
      }
    } catch (error) {
      console.error('Error rejecting application:', error);
      return false;
    }
  };

  // Get applications for a specific project
  const getProjectApplications = (projectId) => {
    return applications.filter(app => app.projectId === projectId);
  };

  // Get applications received by a user (for their projects)
  const getReceivedApplications = (userId) => {
    if (!userId) return [];
    
    // Filter applications by type 'received'
    return applications.filter(app => app.type === 'received');
  };

  // Get applications sent by a user
  const getSentApplications = (userId) => {
    if (!userId) return [];
    
    // Filter applications by type 'sent'
    return applications.filter(app => app.type === 'sent');
  };

  // Get projects for a specific user
  const getUserProjects = (userId) => {
    // First try to get from local state
    const owned = projects.filter(project =>
      (project.ownerId === userId || project.ownerId?._id === userId || project.ownerId?.toString() === userId)
    );

    const participating = projects.filter(project =>
      project.teamMembers?.some(member => 
        (member.id === userId || member.id?._id === userId || member.id?.toString() === userId)
      ) && !(project.ownerId === userId || project.ownerId?._id === userId || project.ownerId?.toString() === userId)
    );

    return { owned, participating };
  };

  // Update project stage
  const updateProjectStage = async (projectId, newStage) => {
    try {
      const response = await fetch(`${apiBaseUrl}/api/projects/${projectId}/stage`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ stage: newStage })
      });

      const result = await response.json();

      if (result.success) {
        setProjects(prev => prev.map(project =>
          (project.id === projectId || project._id === projectId)
            ? { ...project, stage: newStage }
            : project
        ));
        return true;
      } else {
        console.error('Failed to update project stage:', result.message);
        return false;
      }
    } catch (error) {
      console.error('Error updating project stage:', error);
      return false;
    }
  };

  // Function to toggle bookmark status for a project
  const toggleBookmark = async (projectId, userId) => {
    // Get userId from localStorage if not provided
    const currentUserId = userId || (() => {
      const savedUser = localStorage.getItem('teamera_user');
      if (savedUser) {
        const user = JSON.parse(savedUser);
        return user.id || user._id;
      }
      return null;
    })();

    if (!currentUserId) {
      console.error('User not logged in');
      return;
    }

    const isCurrentlyBookmarked = bookmarkedProjects.includes(projectId);

    try {
      if (isCurrentlyBookmarked) {
        // Remove bookmark from backend
        const response = await fetch(`${apiBaseUrl}/api/dashboard/${currentUserId}/bookmarks/${projectId}`, {
          method: 'DELETE'
        });

        const result = await response.json();

        if (result.success) {
          // Update local state
          setBookmarkedProjects(prevBookmarks => {
            const newBookmarks = prevBookmarks.filter(id => id !== projectId);
            localStorage.setItem('bookmarkedProjects', JSON.stringify(newBookmarks));
            return newBookmarks;
          });
          console.log('Bookmark removed successfully');
        } else {
          console.error('Failed to remove bookmark:', result.message);
        }
      } else {
        // Add bookmark to backend
        const response = await fetch(`${apiBaseUrl}/api/dashboard/${currentUserId}/bookmarks`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ projectId })
        });

        const result = await response.json();

        if (result.success) {
          // Update local state
          setBookmarkedProjects(prevBookmarks => {
            const newBookmarks = [...prevBookmarks, projectId];
            localStorage.setItem('bookmarkedProjects', JSON.stringify(newBookmarks));
            return newBookmarks;
          });
          console.log('Bookmark added successfully');
        } else {
          console.error('Failed to add bookmark:', result.message);
        }
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error);
    }
  };

  // Function to check if a project is bookmarked
  const isProjectBookmarked = (projectId) => {
    return bookmarkedProjects.includes(projectId);
  };

  // Leave a project the user is participating in
  const leaveProject = async (projectId, userId) => {
    try {
      // Ensure we have valid IDs - extract string values more robustly
      let cleanProjectId = projectId;
      if (projectId && typeof projectId === 'object') {
        cleanProjectId = projectId._id || projectId.id;
      }
      // Ensure it's a string
      cleanProjectId = String(cleanProjectId);
      
      let cleanUserId = userId;
      if (userId && typeof userId === 'object') {
        cleanUserId = userId._id || userId.id;
      }
      // Ensure it's a string
      cleanUserId = String(cleanUserId);

      console.log('leaveProject called with:', { 
        originalProjectId: projectId,
        cleanProjectId, 
        cleanProjectIdType: typeof cleanProjectId,
        originalUserId: userId,
        cleanUserId,
        cleanUserIdType: typeof cleanUserId
      });

      // Find the project
      const project = projects.find(p => (p.id === cleanProjectId || p._id === cleanProjectId));
      if (!project) {
        console.error('Project not found in local state');
        return false;
      }

      // Check if user is the owner
      const projectOwnerId = project.ownerId?._id || project.ownerId;
      const isOwner = projectOwnerId === cleanUserId || projectOwnerId?.toString() === cleanUserId?.toString();
      if (isOwner) {
        console.error('Cannot leave project: User is the owner');
        return false;
      }

      console.log('Removing user from project team...');
      
      // Use direct team member removal endpoint with isQuit parameter
      const response = await fetch(`${apiBaseUrl}/api/projects/${cleanProjectId}/team/${cleanUserId}?isQuit=true`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const result = await response.json();
      console.log('API response:', result);

      if (result.success) {
        console.log('Successfully left project, updating local state...');
        
        // Update local state - filter out the user from team members
        setProjects(prev => prev.map(p => {
          if (p.id === cleanProjectId || p._id === cleanProjectId) {
            const updatedTeamMembers = p.teamMembers.filter(member => {
              const memberId = member.id?._id || member.id;
              return memberId?.toString() !== cleanUserId?.toString();
            });
            console.log('Updated team members count:', updatedTeamMembers.length, 'from', p.teamMembers.length);
            return {
              ...p,
              teamMembers: updatedTeamMembers
            };
          }
          return p;
        }));

        // Refresh applications to get updated status
        await fetchApplications();

        // Update user project mapping
        setUserProjectMap(prev => {
          const updatedUserProjects = { ...prev };
          if (updatedUserProjects[cleanUserId]) {
            updatedUserProjects[cleanUserId] = {
              ...updatedUserProjects[cleanUserId],
              participatingProjects: updatedUserProjects[cleanUserId].participatingProjects.filter(
                id => id.toString() !== cleanProjectId.toString()
              )
            };
          }
          return updatedUserProjects;
        });

        return true;
      } else {
        console.error('Failed to leave project:', result.message || result.error);
        return false;
      }
    } catch (error) {
      console.error('Error leaving project:', error);
      return false;
    }
  };

  const value = {
    projects,
    hackathons,
    loading,
    applications,
    applicationsLoading,
    fetchApplications,
    createProject,
    editProject,
    deleteProject,
    leaveProject,
    applyToProject,
    addUserToProject,
    acceptApplication,
    rejectApplication,
    getProjectApplications,
    getReceivedApplications,
    getSentApplications,
    getUserProjects,
    updateProjectStage,
    userProjectMap,
    bookmarkedProjects,
    toggleBookmark,
    isProjectBookmarked
  };

  return (
    <ProjectContext.Provider value={value}>
      {children}
    </ProjectContext.Provider>
  );
};

// Sample hackathon data
const sampleHackathons = [
  {
    id: 1,
    title: "FinTech Innovation Challenge 2024",
    description: "Build the next generation of financial technology solutions",
    startDate: "2024-02-15",
    endDate: "2024-02-17",
    prize: "₹5,00,000",
    participants: 150,
    status: "upcoming",
    categories: ["Blockchain", "AI/ML", "Mobile Apps"]
  },
  {
    id: 2,
    title: "Sustainable Tech Hackathon",
    description: "Create technology solutions for environmental challenges",
    startDate: "2024-01-20",
    endDate: "2024-01-22",
    prize: "₹3,00,000",
    participants: 89,
    status: "ongoing",
    categories: ["IoT", "Clean Energy", "Data Analytics"]
  }
];