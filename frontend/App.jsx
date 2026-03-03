import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useState, useEffect, startTransition } from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Projects from './pages/Projects';
import Hackathons from './pages/Hackathons';
import Profile from './pages/Profile';
import Dashboard from './pages/Dashboard';
import Community from './pages/Community';
import AuthModal from './components/AuthModal';
import OnboardingModal from './components/OnboardingModal';
import ProjectModal from './components/ProjectModal';
import CreateProjectModal from './components/CreateProjectModal';
import CollaborationSpace from './components/CollaborationSpace';
import { AuthProvider } from './context/AuthContext';
import { ProjectProvider } from './context/ProjectContext';
import { NotificationProvider } from './context/NotificationContext';
import './styles/App.css';

function App() {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [showCollaboration, setShowCollaboration] = useState(false);
  const [projectToEdit, setProjectToEdit] = useState(null);

  // Handle state updates with startTransition
  const handleModalState = (setter, value) => {
    startTransition(() => {
      setter(value);
    });
  };

  // Handle editing a project
  const handleEditProject = (project) => {
    setProjectToEdit(project);
    handleModalState(setShowCreateProject, true);
  };

  // Reset project to edit when modal is closed
  const handleCloseCreateModal = () => {
    handleModalState(setShowCreateProject, false);
    startTransition(() => {
      setProjectToEdit(null);
    });
  };

  return (
    <AuthProvider>
      <ProjectProvider>
        <NotificationProvider>
          <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <div className="app">
            <Navbar 
              onAuthClick={() => handleModalState(setShowAuthModal, true)}
              onCreateProject={() => handleModalState(setShowCreateProject, true)}
              onCollaborationClick={() => handleModalState(setShowCollaboration, true)}
            />
            <main className="main-content">
              <Routes>
                <Route path="/" element={<Home onAuthClick={() => handleModalState(setShowAuthModal, true)} />} />
                <Route path="/projects" element={
                  <Projects 
                    onProjectClick={setSelectedProject}
                    onCreateProject={() => handleModalState(setShowCreateProject, true)}
                    onEditProject={handleEditProject}
                  />
                } />
                <Route path="/hackathons" element={<Hackathons />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/community" element={<Community />} />
              </Routes>
            </main>
            <Footer />

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
                  }
                }}
              />
            )}

            {showOnboarding && (
              <OnboardingModal 
                onClose={() => handleModalState(setShowOnboarding, false)}
              />
            )}

            {selectedProject && (
              <ProjectModal 
                project={selectedProject}
                onClose={() => handleModalState(setSelectedProject, null)}
              />
            )}

            {showCreateProject && (
              <CreateProjectModal 
                onClose={handleCloseCreateModal}
                projectToEdit={projectToEdit}
              />
            )}

            {showCollaboration && (
              <CollaborationSpace 
                onClose={() => handleModalState(setShowCollaboration, false)}
              />
            )}
          </div>
        </Router>
        </NotificationProvider>
      </ProjectProvider>
    </AuthProvider>
  );
}

export default App;