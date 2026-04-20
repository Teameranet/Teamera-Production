import { useState } from 'react';
import { Users, MapPin, Briefcase, Bookmark, Flag, Edit, Trash2, LogOut } from 'lucide-react';
import { useProjects } from '../context/ProjectContext';
import UserAvatar from './UserAvatar';
import './ProjectCard.css';

const REPORT_REASONS = [
  'Fake Details',
  'Spam',
  'Misleading Points',
  'Inappropriate Content',
];

function ProjectCard({ project, onClick, isOwned, isParticipating, onEdit, onDelete, onLeave, hideReport }) {
  const { toggleBookmark, isProjectBookmarked } = useProjects();
  const projectId = project.id || project._id;
  const isBookmarked = isProjectBookmarked(projectId);

  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportDetails, setReportDetails] = useState('');
  const [reportSubmitted, setReportSubmitted] = useState(false);

  const handleBookmark = (e) => {
    e.stopPropagation();
    toggleBookmark(projectId);
  };

  const handleReportOpen = (e) => {
    e.stopPropagation();
    setShowReportModal(true);
    setReportReason('');
    setReportDetails('');
    setReportSubmitted(false);
  };

  const handleReportClose = (e) => {
    if (e) e.stopPropagation();
    setShowReportModal(false);
  };

  const handleReportSubmit = (e) => {
    e.stopPropagation();
    if (!reportReason) return;
    // TODO: wire up to API
    console.log('Report submitted:', { projectId, reason: reportReason, details: reportDetails });
    setReportSubmitted(true);
    setTimeout(() => setShowReportModal(false), 1500);
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

  return (
    <>
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
            {!hideReport && (
              <button className="action-btn report-btn" onClick={handleReportOpen} title="Report project">
                <Flag size={16} />
              </button>
            )}
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
          <Briefcase size={18} />
          <span>{Array.isArray(project.openPositions) ? project.openPositions.length : 0} open positions</span>
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
      </div>
      
      <div className="project-footer">
        <span className="applications-count">{project.applications} applications</span>
        <button className="view-details-btn" onClick={(e) => {
          e.stopPropagation();
          onClick(project);
        }}>View Details</button>
      </div>
    </div>

    {showReportModal && (
      <div className="report-modal-overlay" onClick={handleReportClose}>
        <div className="report-modal" onClick={(e) => e.stopPropagation()}>
          {reportSubmitted ? (
            <div className="report-success">
              <Flag size={32} color="#ef4444" />
              <p>Report submitted. Thank you for your feedback.</p>
            </div>
          ) : (
            <>
              <div className="report-modal-header">
                <Flag size={18} color="#ef4444" />
                <h3>Report Project</h3>
              </div>
              <p className="report-modal-subtitle">Why are you reporting <strong>{project.title}</strong>?</p>
              <div className="report-reasons">
                {REPORT_REASONS.map((reason) => (
                  <label key={reason} className={`report-reason-option ${reportReason === reason ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="reportReason"
                      value={reason}
                      checked={reportReason === reason}
                      onChange={() => setReportReason(reason)}
                    />
                    {reason}
                  </label>
                ))}
              </div>
              <textarea
                className="report-details-input"
                placeholder="Additional details (optional)"
                value={reportDetails}
                onChange={(e) => setReportDetails(e.target.value)}
                rows={3}
              />
              <div className="report-modal-actions">
                <button className="report-cancel-btn" onClick={handleReportClose}>Cancel</button>
                <button
                  className="report-submit-btn"
                  onClick={handleReportSubmit}
                  disabled={!reportReason}
                >
                  Submit Report
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    )}
    </>
  );
}

export default ProjectCard;