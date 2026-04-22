import { useState } from 'react';
import { UserPlus, X, Users, Shield, LogOut, Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import UserAvatar from '../UserAvatar';
import './WorkspaceTabs.css';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';



function WorkspaceTeamTab({ project, onProjectUpdate }) {
  const { user } = useAuth();
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(null); // memberId to remove
  const [showQuitModal, setShowQuitModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('');
  const [customRole, setCustomRole] = useState('');
  const [verifiedUser, setVerifiedUser] = useState(null);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifyError, setVerifyError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const currentUserId = String(user?.id || user?._id || '');
  const teamMembers = project?.teamMembers || [];
  const projectId = project?.id || project?._id;

  const getOwnerId = () => {
    const ownerId = project?.ownerId;
    if (!ownerId) return null;
    if (typeof ownerId === 'string') return ownerId;
    if (typeof ownerId === 'object') return ownerId._id?.toString() || ownerId.toString();
    return String(ownerId);
  };

  const ownerId = getOwnerId();
  const isFounder = currentUserId === ownerId;

  const getMemberId = (member) => {
    const id = member.id || member._id;
    if (!id) return null;
    if (typeof id === 'string') return id;
    if (typeof id === 'object') return id._id?.toString() || id.toString();
    return String(id);
  };

  const isMemberFounder = (member) =>
    member.role === 'OWNER' || member.role === 'Founder';

  const founder = teamMembers.find(isMemberFounder);
  const activeMembers = teamMembers.filter(m => !isMemberFounder(m));

  // ── Verify email ──────────────────────────────────────────────────────────
  const handleVerifyEmail = async () => {
    if (!inviteEmail.trim()) return;
    setVerifyLoading(true);
    setVerifyError('');
    setVerifiedUser(null);
    try {
      const res = await fetch(`${API_BASE}/api/users/verify-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        const uid = data.data._id || data.data.id;
        // Check if already a member
        const alreadyMember = teamMembers.some(m => getMemberId(m) === String(uid));
        if (alreadyMember) {
          setVerifyError('This user is already a team member.');
        } else {
          setVerifiedUser(data.data);
        }
      } else {
        setVerifyError('User not found. They must be registered first.');
      }
    } catch {
      setVerifyError('Error verifying email. Please try again.');
    } finally {
      setVerifyLoading(false);
    }
  };

  // ── Invite member ─────────────────────────────────────────────────────────
  const handleInvite = async () => {
    if (!verifiedUser || !inviteRole) return;
    const finalRole = inviteRole === '__custom__' ? customRole.trim() : inviteRole;
    if (!finalRole) return;
    setActionLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/projects/${projectId}/team`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: verifiedUser._id || verifiedUser.id,
          name: verifiedUser.name,
          role: finalRole,
          email: verifiedUser.email,
          applicantColor: verifiedUser.applicantColor || '#4f46e5',
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        onProjectUpdate?.(data.data);
        closeInviteModal();
      }
    } catch (err) {
      console.error('Invite error:', err);
    } finally {
      setActionLoading(false);
    }
  };

  // ── Remove member ─────────────────────────────────────────────────────────
  const handleRemove = async (memberId) => {
    setActionLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/projects/${projectId}/team/${memberId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        onProjectUpdate?.(data.data);
      }
    } catch (err) {
      console.error('Remove error:', err);
    } finally {
      setActionLoading(false);
      setShowConfirmModal(null);
    }
  };

  // ── Quit project ──────────────────────────────────────────────────────────
  const handleQuit = async () => {
    setActionLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/projects/${projectId}/team/${currentUserId}?isQuit=true`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        onProjectUpdate?.(data.data);
      }
    } catch (err) {
      console.error('Quit error:', err);
    } finally {
      setActionLoading(false);
      setShowQuitModal(false);
    }
  };

  const closeInviteModal = () => {
    setShowInviteModal(false);
    setInviteEmail('');
    setInviteRole('');
    setCustomRole('');
    setVerifiedUser(null);
    setVerifyError('');
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
          <span className="wt-member-count">{teamMembers.length} member{teamMembers.length !== 1 ? 's' : ''}</span>
        </div>
        {isFounder ? (
          <button className="wt-btn wt-btn--primary" onClick={() => setShowInviteModal(true)}>
            <UserPlus size={16} /> Invite Members
          </button>
        ) : (
          // Non-founder: show Quit Project button in header area
          !isMemberFounder(teamMembers.find(m => getMemberId(m) === currentUserId) || {}) && (
            <button className="wt-btn wt-btn--danger-outline" onClick={() => setShowQuitModal(true)}>
              <LogOut size={16} /> Quit Project
            </button>
          )
        )}
      </div>

      {/* Member list */}
      <div className="wt-member-list">
        {/* Founder section */}
        {founder && (
          <>
            <p className="wt-section-label">PROJECT FOUNDER</p>
            <div className="wt-member-card wt-member-card--founder">
              <UserAvatar user={founder} size="medium" />
              <div className="wt-member-info">
                <div className="wt-member-name">
                  {founder.name}
                  {/* <span className="wt-founder-badge">FOUNDER</span> */}
                </div>
                <div className="wt-member-email">
                  {founder.role !== 'Founder' && founder.role !== 'OWNER' ? `${founder.role} • ` : ''}
                  {founder.email || ''}
                </div>
              </div>

            </div>
          </>
        )}

        {/* Active members section */}
        {activeMembers.length > 0 && (
          <>
            <p className="wt-section-label" style={{ marginTop: '1.25rem' }}>ACTIVE MEMBERS</p>
            <div className="wt-members-grid">
              {activeMembers.map((member, idx) => {
                const memberId = getMemberId(member);
                const isCurrentUser = memberId === currentUserId;

                return (
                  <div key={memberId || idx} className={`wt-member-card ${isCurrentUser ? 'wt-member-card--self' : ''}`}>
                    <UserAvatar user={member} size="medium" />
                    <div className="wt-member-info">
                      <div className="wt-member-name">
                        {member.name}
                      </div>
                      <div className="wt-member-email">{member.role}</div>
                    </div>
                    {/* Founder can remove non-founder members */}
                    {isFounder && !isCurrentUser && (
                      <button
                        className="wt-remove-btn"
                        onClick={() => setShowConfirmModal(memberId)}
                        title="Remove member"
                      >
                        <X size={14} />
                      </button>
                    )}

                  </div>
                );
              })}
            </div>
          </>
        )}

        {teamMembers.length === 0 && (
          <div className="wt-empty-state">
            <Users size={48} className="wt-empty-icon" />
            <h3>No team members yet</h3>
            <p>Invite members to start collaborating on this project.</p>
          </div>
        )}
      </div>

      {/* ── Invite Modal ──────────────────────────────────────────────────── */}
      {showInviteModal && (
        <div className="wt-modal-overlay" onClick={closeInviteModal}>
          <div className="wt-modal" onClick={e => e.stopPropagation()}>
            <div className="wt-modal-header">
              <h4 className="wt-modal-title">Invite Member</h4>
              <button className="wt-modal-close" onClick={closeInviteModal}><X size={16} /></button>
            </div>
            <div className="wt-modal-body">
              {/* Email verify */}
              <div className="wt-mfield">
                <label className="wt-mlabel">Email Address <span className="wt-required">*</span></label>
                <div className="wt-invite-email-row">
                  <input
                    className="wt-form-input"
                    type="email"
                    placeholder="member@example.com"
                    value={inviteEmail}
                    onChange={e => { setInviteEmail(e.target.value); setVerifiedUser(null); setVerifyError(''); }}
                    disabled={!!verifiedUser}
                  />
                  {verifiedUser ? (
                    <span className="wt-verified-chip"><Check size={13} /> Verified</span>
                  ) : (
                    <button
                      className="wt-btn wt-btn--primary wt-verify-btn"
                      onClick={handleVerifyEmail}
                      disabled={verifyLoading || !inviteEmail.trim()}
                    >
                      {verifyLoading ? 'Checking…' : 'Verify'}
                    </button>
                  )}
                </div>
                {verifyError && <p className="wt-field-error">{verifyError}</p>}
                {verifiedUser && (
                  <div className="wt-verified-user-row">
                    <UserAvatar user={verifiedUser} size="small" />
                    <span className="wt-verified-name">{verifiedUser.name}</span>
                  </div>
                )}
              </div>

              {/* Role select */}
              <div className="wt-mfield">
                <label className="wt-mlabel">Role / Position <span className="wt-required">*</span></label>
                <select
                  className="wt-form-input"
                  value={inviteRole}
                  onChange={e => { setInviteRole(e.target.value); setCustomRole(''); }}
                  disabled={!verifiedUser}
                >
                  <option value="">Select a role</option>
                  {(project.openPositions || []).filter(p => p.role?.trim()).map((p, i) => (
                    <option key={i} value={p.role}>{p.role}</option>
                  ))}
                  <option value="__custom__">Custom position</option>
                </select>
                {inviteRole === '__custom__' && (
                  <input
                    className="wt-form-input"
                    style={{ marginTop: '0.5rem' }}
                    type="text"
                    placeholder="Enter custom position"
                    value={customRole}
                    onChange={e => setCustomRole(e.target.value)}
                  />
                )}
              </div>

              <div className="wt-modal-footer">
                <button className="wt-btn wt-btn--ghost" onClick={closeInviteModal}>Cancel</button>
                <button
                  className="wt-btn wt-btn--primary"
                  onClick={handleInvite}
                  disabled={!verifiedUser || !inviteRole || actionLoading || (inviteRole === '__custom__' && !customRole.trim())}
                >
                  {actionLoading ? 'Sending…' : 'Invite Members'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Remove Confirmation Modal ─────────────────────────────────────── */}
      {showConfirmModal && (
        <div className="wt-modal-overlay" onClick={() => setShowConfirmModal(null)}>
          <div className="wt-modal wt-modal--sm" onClick={e => e.stopPropagation()}>
            <div className="wt-modal-header">
              <h4 className="wt-modal-title">Remove Member</h4>
              <button className="wt-modal-close" onClick={() => setShowConfirmModal(null)}><X size={16} /></button>
            </div>
            <div className="wt-modal-body">
              <p style={{ margin: 0, color: '#4b5563', fontSize: '0.9rem' }}>
                Are you sure you want to remove{' '}
                <strong>{teamMembers.find(m => getMemberId(m) === showConfirmModal)?.name || 'this member'}</strong>{' '}
                from the project? This action cannot be undone.
              </p>
              <div className="wt-modal-footer">
                <button className="wt-btn wt-btn--ghost" onClick={() => setShowConfirmModal(null)}>Cancel</button>
                <button
                  className="wt-btn wt-btn--danger"
                  onClick={() => handleRemove(showConfirmModal)}
                  disabled={actionLoading}
                >
                  {actionLoading ? 'Removing…' : 'Remove Member'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Quit Confirmation Modal ───────────────────────────────────────── */}
      {showQuitModal && (
        <div className="wt-modal-overlay" onClick={() => setShowQuitModal(false)}>
          <div className="wt-modal wt-modal--sm" onClick={e => e.stopPropagation()}>
            <div className="wt-modal-header">
              <h4 className="wt-modal-title">Quit Project</h4>
              <button className="wt-modal-close" onClick={() => setShowQuitModal(false)}><X size={16} /></button>
            </div>
            <div className="wt-modal-body">
              <p style={{ margin: 0, color: '#4b5563', fontSize: '0.9rem' }}>
                Are you sure you want to leave <strong>{project.title}</strong>? You will lose access to this project's workspace.
              </p>
              <div className="wt-modal-footer">
                <button className="wt-btn wt-btn--ghost" onClick={() => setShowQuitModal(false)}>Cancel</button>
                <button
                  className="wt-btn wt-btn--danger"
                  onClick={handleQuit}
                  disabled={actionLoading}
                >
                  {actionLoading ? 'Leaving…' : 'Quit Project'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default WorkspaceTeamTab;
