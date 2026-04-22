import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { useState, useEffect, startTransition } from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Projects from './pages/Projects';
import Hackathons from './pages/Hackathons';
import Profile from './pages/Profile';
import Dashboard from './pages/Dashboard';
import Community from './pages/Community';
import Workspace from './pages/Workspace';
import AuthModal from './components/AuthModal';
import OnboardingModal from './components/OnboardingModal';
import ProjectModal from './components/ProjectModal';
import CreateProjectModal from './components/CreateProjectModal';
import CollaborationSpace from './components/CollaborationSpace';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './context/AuthContext';
import { ProjectProvider } from './context/ProjectContext';
import { useProjects } from './context/ProjectContext';
import { NotificationProvider } from './context/NotificationContext';
import './styles/App.css';

function AppContent() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    getUserProjects,
    selectedProject,
    setSelectedProject,
    showCreateProjectModal,
    setShowCreateProjectModal,
    showProjectModal,
    setShowProjectModal,
    projectToEdit,
    setProjectToEdit,
  } = useProjects();

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showCollaboration, setShowCollaboration] = useState(false);
  const [userProjects, setUserProjects] = useState({ owned: [], participating: [] });

  useEffect(() => {
    if (user?.id) {
      getUserProjects(user.id).then(result => {
        setUserProjects(result || { owned: [], participating: [] });
      });
    } else {
      setUserProjects({ owned: [], participating: [] });
    }
  }, [user]);

  const isOwnedProject = (project) => {
    if (!project || !user) return false;
    const pid = project.id || project._id;
    return userProjects.owned.some(p => (p.id || p._id) === pid);
  };

  const isParticipatingProject = (project) => {
    if (!project || !user) return false;
    const pid = project.id || project._id;
    return userProjects.participating.some(p => (p.id || p._id) === pid);
  };

  const handleEditProject = (project) => {
    startTransition(() => {
      setProjectToEdit(project);
      setShowCreateProjectModal(true);
    });
  };

  const handleCloseCreateModal = () => {
    startTransition(() => {
      setShowCreateProjectModal(false);
      setProjectToEdit(null);
    });
  };

  return (
    <div className="app">
      <Navbar
        onAuthClick={() => startTransition(() => setShowAuthModal(true))}
        onCollaborationClick={() => startTransition(() => setShowCollaboration(true))}
      />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home onAuthClick={() => startTransition(() => setShowAuthModal(true))} />} />
          <Route path="/projects" element={
            <Projects onEditProject={handleEditProject} />
          } />
          <Route path="/hackathons" element={<Hackathons />} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/community" element={<Community />} />
          <Route path="/workspace" element={<ProtectedRoute><Workspace /></ProtectedRoute>} />
        </Routes>
      </main>
      <Footer />

      {/* Modals */}
      {showAuthModal && (
        <AuthModal
          onClose={() => startTransition(() => setShowAuthModal(false))}
          onSuccess={(userData) => {
            startTransition(() => setShowAuthModal(false));
            if (userData.id !== '1' && (!userData.bio || !userData.skills || userData.skills.length === 0)) {
              startTransition(() => setShowOnboarding(true));
            } else {
              navigate('/dashboard');
            }
          }}
        />
      )}

      {showOnboarding && (
        <OnboardingModal
          onClose={() => {
            startTransition(() => setShowOnboarding(false));
            navigate('/dashboard');
          }}
        />
      )}
            {/* Modals */}
            {showAuthModal && (
              <AuthModal 
                onClose={() => handleModalState(setShowAuthModal, false)}
                onSuccess={(userData) => {
                  handleModalState(setShowAuthModal, false);
                  // Only show onboarding for new users without complete profiles
                  // Skip onboarding for User-1 (demo user)
                  if (userData.id !== '1' && (!userData.bio || !userData.skills || userData.skills.length === 0)) {
                    handleModalState(setShowOnboarding, true);
                  } else {
                    // Redirect to projects page after successful login
                    navigate('/projects');
                  }
                }}
              />
            )}

            {showOnboarding && (
              <OnboardingModal 
                onClose={() => {
                  handleModalState(setShowOnboarding, false);
                  // Redirect to projects page after onboarding
                  navigate('/projects');
                }}
              />
            )}

      {selectedProject && (
        <ProjectModal
          project={selectedProject}
          isOwned={isOwnedProject(selectedProject)}
          isParticipating={isParticipatingProject(selectedProject)}
          onClose={() => startTransition(() => setSelectedProject(null))}
          onOpenWorkspace={(project) => {
            const id = project.id || project._id;
            if (id) localStorage.setItem('workspace_selected_project', id);
            startTransition(() => setSelectedProject(null));
            navigate('/workspace');
          }}
        />
      )}

      {showCreateProjectModal && (
        <CreateProjectModal
          onClose={handleCloseCreateModal}
          projectToEdit={projectToEdit}
        />
      )}

      {showCollaboration && (
        <CollaborationSpace
          onClose={() => startTransition(() => setShowCollaboration(false))}
        />
      )}
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <ProjectProvider>
          <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <AppContent />
          </Router>
        </ProjectProvider>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;
