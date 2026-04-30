import { useState, useEffect } from 'react';
import { Search, Plus, ChevronDown, ChevronUp, Edit, Trash2, SlidersHorizontal, X, Layers, Briefcase, Bookmark, FolderKanban, Users } from 'lucide-react';
import { useProjects } from '../context/ProjectContext';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import ProjectCard from '../components/ProjectCard';
import './Projects.css';

function Projects({ onEditProject }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState('');
  const [selectedStage, setSelectedStage] = useState('');
  const [selectedView, setSelectedView] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showOwnedProjects, setShowOwnedProjects] = useState(true);
  const { projects, loading, deleteProject, getUserProjects, setSelectedProject, setShowCreateProjectModal, bookmarkedProjects } = useProjects();
  const { user } = useAuth();
  const { showToast } = useNotifications();

  const industries = ['Technology', 'Healthcare', 'Finance', 'Education', 'E-commerce', 'Entertainment'];
  const stages = ['Idea Validation', 'MVP Development', 'Beta Testing', 'Market Ready', 'Scaling'];
  const viewOptions = [
    { value: 'saved',         label: 'Saved Projects',   icon: Bookmark },
    { value: 'owned',         label: 'Projects I Own',   icon: FolderKanban },
    { value: 'participating', label: "Projects I'm In",  icon: Users },
  ];

  // Get user's owned projects
  const [userProjects, setUserProjects] = useState({ owned: [], participating: [] });
  
  // CRITICAL FIX: Fetch user projects from backend API on mount
  useEffect(() => {
    const loadUserProjects = async () => {
      if (user && user.id) {
        const projects = await getUserProjects(user.id);
        setUserProjects(projects);
      }
    };
    
    loadUserProjects();
  }, [user, getUserProjects]);
  
  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesIndustry = !selectedIndustry || project.industry === selectedIndustry;
    const matchesStage = !selectedStage || project.stage === selectedStage;

    const projectId = (project.id || project._id)?.toString();
    let matchesView = true;
    if (user && selectedView === 'saved') {
      matchesView = bookmarkedProjects.map(id => id.toString()).includes(projectId);
    } else if (user && selectedView === 'owned') {
      matchesView = userProjects.owned.some(p => (p.id || p._id)?.toString() === projectId);
    } else if (user && selectedView === 'participating') {
      matchesView = userProjects.participating.some(p => (p.id || p._id)?.toString() === projectId);
    }

    return matchesSearch && matchesIndustry && matchesStage && matchesView;
  });


  const clearFilters = () => {
    setSearchTerm('');
    setSelectedIndustry('');
    setSelectedStage('');
    setSelectedView('');
  };

  const handleDeleteProject = (projectId, e) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this project?')) {
      const success = deleteProject(projectId);
      if (success !== false) {
        showToast({
          type: 'success',
          title: 'Project deleted',
          description: 'Your project has been permanently deleted.',
        });
      } else {
        showToast({
          type: 'error',
          title: 'Failed to delete project',
          description: 'Something went wrong. Please try again.',
        });
      }
    }
  };

  const handleEditProject = (project, e) => {
    e.stopPropagation(); // Prevent card click event
    onEditProject(project);
  };

  if (loading) {
    return (
      <div className="projects-container">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading projects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="projects-container">
      <div className="projects-header">
        <div className="header-content">
          <h1 style={{ color: 'white' }}>Discover Projects</h1>
          <p style={{ color: 'white' }}>Find exciting startup projects and join teams that match your skills and interests</p>
        </div>
        {user && (
          <button className="create-project-btn" onClick={() => setShowCreateProjectModal(true)}>
            <Plus size={20} />
            Create Project
          </button>
        )}
      </div>

      {/* Projects You Own Section has been removed */}

      {/* ── Filters Bar ── */}
      <div className="projects-filters">
        <div className="pf-search-wrapper">
          <Search size={18} className="pf-search-icon" />
          <input
            type="text"
            className="pf-search-input"
            placeholder="Search projects by name, description…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            aria-label="Search projects"
          />
          {searchTerm && (
            <button className="pf-search-clear" onClick={() => setSearchTerm('')} aria-label="Clear search">
              <X size={15} />
            </button>
          )}
        </div>

        <button
          className={`pf-filter-btn ${showFilters ? 'pf-filter-btn--active' : ''}`}
          onClick={() => setShowFilters(!showFilters)}
          aria-expanded={showFilters}
          aria-label="Toggle filters"
        >
          <SlidersHorizontal size={16} />
          <span>Filters</span>
          {(selectedIndustry || selectedStage || selectedView) && (
            <span className="pf-active-dot" />
          )}
        </button>
      </div>

      {/* ── Expanded Filter Panel ── */}
      {showFilters && (
        <div className="pf-panel">
          {/* Industry + Stage row */}
          <div className="pf-row">
            {/* Industry */}
            <div className="pf-section">
              <div className="pf-section-label">
                <Briefcase size={13} />
                Industry
              </div>
              <div className="pf-dropdown-wrapper">
                <select
                  className="pf-dropdown"
                  value={selectedIndustry}
                  onChange={e => setSelectedIndustry(e.target.value)}
                  aria-label="Filter by industry"
                >
                  <option value="">All Industries</option>
                  {industries.map(industry => (
                    <option key={industry} value={industry}>{industry}</option>
                  ))}
                </select>
                <ChevronDown size={15} className="pf-dropdown-icon" />
              </div>
            </div>

            {/* Stage */}
            <div className="pf-section">
              <div className="pf-section-label">
                <Layers size={13} />
                Stage
              </div>
              <div className="pf-dropdown-wrapper">
                <select
                  className="pf-dropdown"
                  value={selectedStage}
                  onChange={e => setSelectedStage(e.target.value)}
                  aria-label="Filter by stage"
                >
                  <option value="">All Stages</option>
                  {stages.map(stage => (
                    <option key={stage} value={stage}>{stage}</option>
                  ))}
                </select>
                <ChevronDown size={15} className="pf-dropdown-icon" />
              </div>
            </div>
          </div>

          {user && <div className="pf-divider" />}

          {/* View — only visible when logged in */}
          {user && (
            <div className="pf-section">
              <div className="pf-section-label">
                <FolderKanban size={13} />
                Show
              </div>
              <div className="pf-chips">
                {viewOptions.map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    className={`pf-chip pf-chip--view ${selectedView === value ? 'pf-chip--active' : ''}`}
                    onClick={() => setSelectedView(prev => prev === value ? '' : value)}
                  >
                    <Icon size={13} />
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Footer */}
          {(selectedIndustry || selectedStage || selectedView) && (
            <div className="pf-panel-footer">
              <button className="pf-clear-btn" onClick={clearFilters}>
                <X size={13} /> Clear all filters
              </button>
            </div>
          )}
        </div>
      )}

      <div className="projects-stats">
        <span>{filteredProjects.length} project{filteredProjects.length !== 1 ? 's' : ''} found</span>
      </div>

      {filteredProjects.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🔍</div>
          <h3>No projects found</h3>
          <p>Try adjusting your search criteria or create a new project</p>
          {user && (
            <button className="create-project-btn" onClick={() => setShowCreateProjectModal(true)}>
              <Plus size={20} />
              Create Your First Project
            </button>
          )}
        </div>
      ) : (
        <div className="projects-grid">
          {filteredProjects.map(project => (
            <ProjectCard
              key={project.id || project._id}
              project={project}
              onClick={setSelectedProject}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default Projects;