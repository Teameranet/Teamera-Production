import { useState } from 'react';
import { UserPlus, X, Users, Crown, Shield, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import UserAvatar from '../UserAvatar';
import './WorkspaceTabs.css';

function WorkspaceTeamTab({ project, isAdmin }) {
  const { user } = useAuth();
  const [confirmRemove, setConfirmRemove] = useState(null);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('Member');

  const currentUserId = String(user?.id || user?._id);
  const teamMembers = project?.teamMembers || [];

  const roleMeta = {
    OWNER:   { label: 'Founder', color: '#4f46e5', bg: '#ede9fe', icon: Crown },
    Founder: { label: 'Founder', color: '#4f46e5', bg: '#ede9fe', icon: Crown },
    ADMIN:   { label: 'Admin',   color: '#2563eb', bg: '#dbeafe', icon: Shield },
    MEMBER:  { label: 'Member',  color: '#6b7280', bg: '#f3f4f6', icon: User },
  };

  const getMeta = (role) => roleMeta[role] || { label: role || 'Member', color: '#059669', bg: '#d1fae5', icon: User };

  const getMemberId = (member, idx) =>
    typeof member.id === 'string' ? member.id :
    typeof member._id === 'string' ? member._id :
    member.id?._id?.toString() || member._id?.toString() || `${member.name}-${idx}`;

  const isFounder = (member) => member.role === 'OWNER' || member.role === 'Founder';

  const handleRemove = (memberId) => {
    if (confirmRemove === memberId) {
      console.log('Remove member:', memberId);
      setConfirmRemove(null);
    } else {
      setConfirmRemove(memberId);
      setTimeout(() => setConfirmRemove(null), 3000);
    }
  };

  const handleInvite = (e) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    console.log('Invite:', inviteEmail, inviteRole);
    setInviteEmail('');
    setInviteRole('Member');
    setShowInvite(false);
  };

  if (!project) {
    return (
      <div className="wt-empty-state">
        <Users size={48} className="wt-empty-icon" />
        <h3>Select a project to view the team</h3>
        <p>Choose a project from the dropdown above to see team members.</p>
      </div>
    );
  }

  return (
    <div className="wt-team">
      {/* Header */}
      <div className="wt-team-header">
        <div className="wt-team-header-info">
          <h3>{project.title}</h3>
          <span className="wt-member-count">{teamMembers.length} member{teamMembers.length !== 1 ? 's' : ''}</span>
        </div>
        {isAdmin && (
          <button className="wt-btn wt-btn--primary" onClick={() => setShowInvite(v => !v)}>
            <UserPlus size={16} /> Invite Member
          </button>
        )}
      </div>

      {/* Invite form */}
      {showInvite && isAdmin && (
        <form className="wt-invite-form" onSubmit={handleInvite}>
          <input
            className="wt-form-input"
            type="email"
            placeholder="Email address"
            value={inviteEmail}
            onChange={e => setInviteEmail(e.target.value)}
            required
          />
          <select
            className="wt-form-input"
            value={inviteRole}
            onChange={e => setInviteRole(e.target.value)}
          >
            <option>Member</option>
            <option>Admin</option>
          </select>
          <div className="wt-form-actions">
            <button type="submit" className="wt-btn wt-btn--primary">Send Invite</button>
            <button type="button" className="wt-btn wt-btn--ghost" onClick={() => setShowInvite(false)}>Cancel</button>
          </div>
        </form>
      )}

      {/* Member list */}
      <div className="wt-member-list">
        {teamMembers.length === 0 ? (
          <div className="wt-empty-state">
            <Users size={48} className="wt-empty-icon" />
            <h3>No team members yet</h3>
            <p>Invite members to start collaborating on this project.</p>
          </div>
        ) : (
          teamMembers.map((member, idx) => {
            const memberId = getMemberId(member, idx);
            const meta = getMeta(member.role);
            const RoleIcon = meta.icon;
            const isCurrentUser = String(memberId) === currentUserId;
            const founder = isFounder(member);

            return (
              <div key={memberId} className={`wt-member-card ${isCurrentUser ? 'wt-member-card--self' : ''}`}>
                <UserAvatar user={member} size="small" />
                <div className="wt-member-info">
                  <div className="wt-member-name">
                    {member.name}
                    {isCurrentUser && <span className="wt-you-badge">You</span>}
                  </div>
                  <div className="wt-member-email">{member.email || 'No email provided'}</div>
                </div>
                <div className="wt-role-badge" style={{ color: meta.color, background: meta.bg }}>
                  <RoleIcon size={12} />
                  {meta.label}
                </div>
                {isAdmin && !founder && !isCurrentUser && (
                  <button
                    className={`wt-remove-btn ${confirmRemove === memberId ? 'wt-remove-btn--confirm' : ''}`}
                    onClick={() => handleRemove(memberId)}
                    title={confirmRemove === memberId ? 'Click again to confirm' : 'Remove member'}
                  >
                    <X size={16} />
                    {confirmRemove === memberId && <span>Confirm</span>}
                  </button>
                )}
                {!isAdmin && isCurrentUser && !founder && (
                  <button className="wt-btn wt-btn--danger-outline wt-quit-btn">
                    Quit Project
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default WorkspaceTeamTab;
