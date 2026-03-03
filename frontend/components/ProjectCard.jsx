import { Users, MapPin, IndianRupee, Bookmark, Share2, Edit, Trash2, LogOut } from 'lucide-react';
import { useProjects } from '../context/ProjectContext';
import UserAvatar from './UserAvatar';
import './ProjectCard.css';

function ProjectCard({ project, onClick, isOwned, isParticipating, onEdit, onDelete, onLeave }) {
  const { toggleBookmark, isProjectBookmarked } = useProjects();
  const projectId = project.id || project._id;
  const isBookmarked = isProjectBookmarked(projectId);

  const handleBookmark = (e) => {
    e.stopPropagation();
    toggleBookmark(projectId);
  };

  const handleShare = (e) => {
    e.stopPropagation();
    // Handle share functionality
    console.log('Shared:', project.title);
  };
  
  const handleEdit = (e) => {
    e.stopPropagation();
    if (onEdit) onEdit(project);
  };
  
  const handleDelete = (e) => {
    e.stopPropagation();
    if (onDelete) onDelete(projectId);
  };
  
  const handleLeave = (e) => {
    e.stopPropagation();
    if (onLeave) onLeave(projectId);
  };
  
  // Find the founder - ensure teamMembers exists and is an array
  const teamMembers = Array.isArray(project.teamMembers) ? project.teamMembers : [];
  const founder = teamMembers.find(member => member?.role === "Founder") || teamMembers[0] || {};
  
  // Get the first initial of the founder's name
  const getInitial = (name) => {
    return name ? name.charAt(0) : "?";
  };

  return (
    <div className="project-card" onClick={() => onClick(project)}>
      <div className="project-header">
        <h3 className="project-title">{project.title}</h3>
        <div className="project-actions">
          <span className="project-stage">{project.stage}</span>
          <div className="card-actions">
            {isOwned && (
              <>
                <button className="action-btn edit-btn" onClick={handleEdit} title="Edit project">
                  <Edit size={16} />
                </button>
                <button className="action-btn delete-btn" onClick={handleDelete} title="Delete project">
                  <Trash2 size={16} />
                </button>
              </>
            )}
            {isParticipating && (
              <button className="action-btn leave-btn" onClick={handleLeave} title="Leave project">
                <LogOut size={16} />
              </button>
            )}
            <button 
              className={`action-btn bookmark-btn ${isBookmarked ? 'active' : ''}`} 
              onClick={handleBookmark}
            >
              <Bookmark size={16} fill={isBookmarked ? 'currentColor' : 'none'} />
            </button>
            <button className="action-btn share-btn" onClick={handleShare}>
              <Share2 size={16} />
            </button>
          </div>
        </div>
      </div>
      
      <p className="project-description">{project.description}</p>
      
      <div className="project-meta">
        <div className="meta-item">
          <Users size={18} />
          <span>{teamMembers.length} members</span>
        </div>
        <div className="meta-item">
          <MapPin size={18} />
          <span>{project.industry}</span>
        </div>
        <div className="meta-item">
          <IndianRupee size={18} />
          <span>{project.funding}</span>
        </div>
      </div>
      
      <div className="project-positions">
        {project.openPositions && Array.isArray(project.openPositions) && project.openPositions.slice(0, 3).map((position, index) => (
          <span key={index} className="position-tag">
            {position.role}
            <span className={`position-status ${position.isPaid ? 'paid' : 'unpaid'}`}>
              {position.isPaid ? 'Paid' : 'Unpaid'}
            </span>
          </span>
        ))}
        {project.openPositions && Array.isArray(project.openPositions) && project.openPositions.length > 3 && (
          <span className="position-tag more">+{project.openPositions.length - 3}</span>
        )}
      </div>
      
      <div className="project-team">
        <div className="founder-info">
          <UserAvatar user={founder} size="small" />
          <div className="founder-details">
            <div className="founder-name">{founder?.name || 'Unknown'}</div>
            <div className="founder-role">{founder?.role || 'Member'}</div>
          </div>
        </div>
        <div className="open-positions">
          <span>{typeof project.openPositions === 'number' ? project.openPositions : (Array.isArray(project.openPositions) ? project.openPositions.length : 0)} open positions</span>
        </div>
      </div>
      
      <div className="project-footer">
        <span className="applications-count">{project.applications} applications</span>
        <button className="view-details-btn" onClick={(e) => {
          e.stopPropagation();
          onClick(project);
        }}>View Details</button>
      </div>
    </div>
  );
}

export default ProjectCard;