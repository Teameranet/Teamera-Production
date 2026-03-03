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

  const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  // Fetch all projects from backend
  useEffect(() => {
    const fetchProjects = async () => {
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

    fetchProjects();
    setHackathons(sampleHackathons);

    // Load bookmarked projects from localStorage
    const savedBookmarks = localStorage.getItem('bookmarkedProjects');
    if (savedBookmarks) {
      setBookmarkedProjects(JSON.parse(savedBookmarks));
    }
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
      if (updatedData.teamMembers && updatedData.teamMembers.length > 0) {
        const founderIndex = updatedData.teamMembers.findIndex(
          member => founder && member.id === founder.id
        );

        if (founderIndex === -1 && founder) {
          updatedData.teamMembers = [founder, ...updatedData.teamMembers];
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

  const applyToProject = (projectId, applicationData) => {
    // Create a new application
    const newApplication = {
      id: Date.now().toString(),
      applicantId: applicationData.userId,
      applicantName: applicationData.applicantName || 'Unknown User',
      applicantAvatar: applicationData.applicantAvatar || 'U',
      applicantColor: applicationData.applicantColor || '#4f46e5',
      position: applicationData.position,
      skills: applicationData.skills || [],
      projectId: projectId,
      projectName: applicationData.projectName || 'Unknown Project',
      appliedDate: new Date().toISOString().split('T')[0],
      status: 'PENDING',
      message: applicationData.message || '',
      hasResume: !!applicationData.resume,
      resumeUrl: applicationData.resumeUrl || null,
      userDetails: applicationData.userDetails || null
    };

    // Add application to the applications list
    setApplications(prev => [...prev, newApplication]);

    // Update project application count
    setProjects(prev => prev.map(project =>
      project.id === projectId
        ? { ...project, applications: project.applications + 1 }
        : project
    ));
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
  const acceptApplication = (applicationId) => {
    const application = applications.find(app => app.id === applicationId);
    if (!application) return false;

    console.log('Accepting application:', applicationId, 'for project:', application.projectId);
    console.log('Adding user:', application.applicantName, 'with position:', application.position);

    // Update application status
    setApplications(prev => prev.map(app =>
      app.id === applicationId ? { ...app, status: 'ACCEPTED' } : app
    ));

    // Add user to project team with position name and color
    const userData = {
      id: application.applicantId,
      name: application.applicantName,
      role: application.position, // This will be the position name (e.g., "Frontend Developer")
      avatar: application.applicantAvatar,
      applicantColor: application.applicantColor || '#4f46e5',
      email: application.userDetails?.email || undefined
    };

    console.log('User data to add:', userData);
    const result = addUserToProject(application.projectId, userData);
    console.log('Add user result:', result);
    
    return result;
  };

  // Reject an application
  const rejectApplication = (applicationId) => {
    setApplications(prev => prev.map(app =>
      app.id === applicationId ? { ...app, status: 'REJECTED' } : app
    ));
    return true;
  };

  // Get applications for a specific project
  const getProjectApplications = (projectId) => {
    return applications.filter(app => app.projectId === projectId);
  };

  // Get applications received by a user (for their projects)
  const getReceivedApplications = (userId) => {
    // Get projects owned by the user
    const userProjects = userProjectMap[userId] || { ownedProjects: [], participatingProjects: [] };
    const ownedProjectIds = userProjects.ownedProjects;

    // Return applications for projects owned by the user
    return applications.filter(app => ownedProjectIds.includes(app.projectId));
  };

  // Get applications sent by a user
  const getSentApplications = (userId) => {
    return applications.filter(app => app.applicantId === userId);
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
  const toggleBookmark = (projectId) => {
    setBookmarkedProjects(prevBookmarks => {
      let newBookmarks;
      if (prevBookmarks.includes(projectId)) {
        // Remove bookmark
        newBookmarks = prevBookmarks.filter(id => id !== projectId);
      } else {
        // Add bookmark
        newBookmarks = [...prevBookmarks, projectId];
      }

      // Save to localStorage
      localStorage.setItem('bookmarkedProjects', JSON.stringify(newBookmarks));
      return newBookmarks;
    });
  };

  // Function to check if a project is bookmarked
  const isProjectBookmarked = (projectId) => {
    return bookmarkedProjects.includes(projectId);
  };

  // Leave a project the user is participating in
  const leaveProject = async (projectId, userId) => {
    try {
      // Find the project
      const project = projects.find(p => p.id === projectId || p._id === projectId);
      if (!project) return false;

      // Check if user is the owner
      const isOwner = project.ownerId === userId || project.ownerId?._id === userId || project.ownerId?.toString() === userId;
      if (isOwner) return false;

      const response = await fetch(`${apiBaseUrl}/api/projects/${projectId}/team/${userId}`, {
        method: 'DELETE'
      });

      const result = await response.json();

      if (result.success) {
        // Update local state
        setProjects(prev => prev.map(p =>
          (p.id === projectId || p._id === projectId)
            ? {
                ...p,
                teamMembers: p.teamMembers.filter(member =>
                  member.id !== userId && member.id?._id !== userId && member.id?.toString() !== userId
                )
              }
            : p
        ));

        // Update user project mapping
        setUserProjectMap(prev => {
          const updatedUserProjects = { ...prev };
          if (updatedUserProjects[userId]) {
            updatedUserProjects[userId] = {
              ...updatedUserProjects[userId],
              participatingProjects: updatedUserProjects[userId].participatingProjects.filter(
                id => id.toString() !== projectId.toString()
              )
            };
          }
          return updatedUserProjects;
        });

        return true;
      } else {
        console.error('Failed to leave project:', result.message);
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