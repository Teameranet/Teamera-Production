import { useState, useEffect } from 'react';
import { Search, Filter, Plus, ChevronDown, ChevronUp, Edit, Trash2 } from 'lucide-react';
import { useProjects } from '../context/ProjectContext';
import { useAuth } from '../context/AuthContext';
import ProjectCard from '../components/ProjectCard';
import './Projects.css';

function Projects({ onProjectClick, onCreateProject, onEditProject }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState('');
  const [selectedStage, setSelectedStage] = useState('');
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [showOwnedProjects, setShowOwnedProjects] = useState(true);
  const { projects, loading, deleteProject, getUserProjects } = useProjects();
  const { user } = useAuth();

  const industries = ['Technology', 'Healthcare', 'Finance', 'Education', 'E-commerce', 'Entertainment'];
  const stages = ['Idea Validation', 'MVP Development', 'Beta Testing', 'Market Ready', 'Scaling'];
  const skills = ['React', 'Node.js', 'Python', 'UI/UX Design', 'Marketing', 'Sales', 'Data Science'];

  // Get user's owned projects
  const userProjects = user ? getUserProjects(user.id) : { owned: [], participating: [] };
  
  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesIndustry = !selectedIndustry || project.industry === selectedIndustry;
    const matchesStage = !selectedStage || project.stage === selectedStage;
    const matchesSkills = selectedSkills.length === 0 || 
                         selectedSkills.some(skill => project.requiredSkills.includes(skill));

    return matchesSearch && matchesIndustry && matchesStage && matchesSkills;
  });

  const handleSkillToggle = (skill) => {
    setSelectedSkills(prev => 
      prev.includes(skill) 
        ? prev.filter(s => s !== skill)
        : [...prev, skill]
    );
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedIndustry('');
    setSelectedStage('');
    setSelectedSkills([]);
  };

  const handleDeleteProject = (projectId, e) => {
    e.stopPropagation(); // Prevent card click event
    if (window.confirm('Are you sure you want to delete this project?')) {
      deleteProject(projectId);
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
          <button className="create-project-btn" onClick={onCreateProject}>
            <Plus size={20} />
            Create Project
          </button>
        )}
      </div>

      {/* Projects You Own Section has been removed */}

      <div className="projects-filters">
        <div className="search-bar">
          <Search size={20} />
          <input
            type="text"
            placeholder="Search projects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <button 
          className="filter-toggle"
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter size={20} />
          <span className="filter-text">Filters</span>
          {(selectedIndustry || selectedStage || selectedSkills.length > 0) && (
            <span className="filter-indicator"></span>
          )}
        </button>
      </div>

      {showFilters && (
        <div className="filters-panel">
          <div className="filter-group">
            <label>Industry</label>
            <select
              value={selectedIndustry}
              onChange={(e) => setSelectedIndustry(e.target.value)}
            >
              <option value="">All Industries</option>
              {industries.map(industry => (
                <option key={industry} value={industry}>{industry}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Stage</label>
            <select
              value={selectedStage}
              onChange={(e) => setSelectedStage(e.target.value)}
            >
              <option value="">All Stages</option>
              {stages.map(stage => (
                <option key={stage} value={stage}>{stage}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Skills</label>
            <div className="skills-filter">
              {skills.map(skill => (
                <button
                  key={skill}
                  className={`skill-filter-btn ${selectedSkills.includes(skill) ? 'active' : ''}`}
                  onClick={() => handleSkillToggle(skill)}
                >
                  {skill}
                </button>
              ))}
            </div>
          </div>

          <div className="filter-actions">
            <button className="clear-filters-btn" onClick={clearFilters}>
              Clear All
            </button>
          </div>
        </div>
      )}

      <div className="projects-stats">
        <span>{filteredProjects.length} projects found</span>
        {(selectedIndustry || selectedStage || selectedSkills.length > 0 || searchTerm) && (
          <button className="clear-filters-btn small" onClick={clearFilters}>
            Clear filters
          </button>
        )}
      </div>

      {filteredProjects.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🔍</div>
          <h3>No projects found</h3>
          <p>Try adjusting your search criteria or create a new project</p>
          {user && (
            <button className="create-project-btn" onClick={onCreateProject}>
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
              onClick={onProjectClick}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default Projects;