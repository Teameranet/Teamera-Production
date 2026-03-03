import { useState, useEffect } from 'react';
import { Calendar, Users, Trophy, Clock, MapPin, Plus } from 'lucide-react';
import { useProjects } from '../context/ProjectContext';
import { useAuth } from '../context/AuthContext';
import HackathonCard from '../components/HackathonCard';
import HackathonRegistrationModal from '../components/HackathonRegistrationModal';
import './Hackathons.css';

function Hackathons() {
  const [activeTab, setActiveTab] = useState('upcoming');
  const [selectedHackathon, setSelectedHackathon] = useState(null);
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [isJoinFlow, setIsJoinFlow] = useState(false);
  const { hackathons } = useProjects();
  const { user } = useAuth();

  const upcomingHackathons = hackathons.filter(h => h.status === 'upcoming');
  const ongoingHackathons = hackathons.filter(h => h.status === 'ongoing');
  const pastHackathons = hackathons.filter(h => h.status === 'completed');

  const getHackathonsByTab = () => {
    switch (activeTab) {
      case 'upcoming': return upcomingHackathons;
      case 'ongoing': return ongoingHackathons;
      case 'past': return pastHackathons;
      default: return upcomingHackathons;
    }
  };

  const handleRegisterClick = (hackathon) => {
    setSelectedHackathon(hackathon);
    setIsJoinFlow(false);
    setShowRegistrationModal(true);
  };

  const handleJoinClick = (hackathon) => {
    setSelectedHackathon(hackathon);
    setIsJoinFlow(true);
    setShowRegistrationModal(true);
  };

  const closeModal = () => {
    setShowRegistrationModal(false);
    setSelectedHackathon(null);
    setIsJoinFlow(false);
  };

  return (
    <div className="hackathons-container">
      <div className="hackathons-header">
        <div className="header-content">
          <h1 style={{ color: 'white' }}>Hackathons & Competitions</h1>
          <p style={{ color: 'white' }}>Participate in exciting challenges, showcase your skills, and win amazing prizes</p>
        </div>
        {/* {user && (
          <button className="create-hackathon-btn">
            <Plus size={20} />
            Host Hackathon
          </button>
        )} */}
      </div>

      <div className="hackathons-tabs">
        <button
          className={`tab-btn ${activeTab === 'upcoming' ? 'active' : ''}`}
          onClick={() => setActiveTab('upcoming')}
        >
          Upcoming ({upcomingHackathons.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'ongoing' ? 'active' : ''}`}
          onClick={() => setActiveTab('ongoing')}
        >
          Live Now ({ongoingHackathons.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'past' ? 'active' : ''}`}
          onClick={() => setActiveTab('past')}
        >
          Past Events ({pastHackathons.length})
        </button>
      </div>

      <div className="hackathons-content">
        {getHackathonsByTab().length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🏆</div>
            <h3>No hackathons found</h3>
            <p>
              {activeTab === 'upcoming' && 'No upcoming hackathons at the moment. Check back soon!'}
              {activeTab === 'ongoing' && 'No hackathons are currently live.'}
              {activeTab === 'past' && 'No past hackathons to display.'}
            </p>
          </div>
        ) : (
          <div className="hackathons-grid">
            {getHackathonsByTab().map(hackathon => (
              <HackathonCard
                key={hackathon.id}
                hackathon={hackathon}
                onRegisterClick={handleRegisterClick}
                onJoinClick={handleJoinClick}
              />
            ))}
          </div>
        )}
      </div>

      {/* Featured Section */}
      <div className="featured-section">
        <h2>Why Participate in Hackathons?</h2>
        <div className="benefits-grid">
          <div className="benefit-card">
            <div className="benefit-icon">🚀</div>
            <h3>Build & Innovate</h3>
            <p>Turn your ideas into reality and create innovative solutions to real-world problems</p>
          </div>
          <div className="benefit-card">
            <div className="benefit-icon">🤝</div>
            <h3>Network & Collaborate</h3>
            <p>Meet like-minded developers, designers, and entrepreneurs from around the world</p>
          </div>
          <div className="benefit-card">
            <div className="benefit-icon">🏆</div>
            <h3>Win Prizes</h3>
            <p>Compete for cash prizes, mentorship opportunities, and recognition in the community</p>
          </div>
          <div className="benefit-card">
            <div className="benefit-icon">📈</div>
            <h3>Learn & Grow</h3>
            <p>Enhance your skills, learn new technologies, and get feedback from industry experts</p>
          </div>
        </div>
      </div>

      {/* Leaderboard Section */}
      {/* <div className="leaderboard-section">
        <h2>Top Performers</h2>
        <div className="leaderboard">
          <div className="leaderboard-item">
            <div className="rank">1</div>
            <div className="user-info">
              <img src="https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?w=40&h=40&fit=crop&crop=face" alt="User" />
              <div>
                <div className="username">Alex Chen</div>
                <div className="points">2,450 points</div>
              </div>
            </div>
            <div className="achievements">🥇 5 wins</div>
          </div>
          <div className="leaderboard-item">
            <div className="rank">2</div>
            <div className="user-info">
              <img src="https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?w=40&h=40&fit=crop&crop=face" alt="User" />
              <div>
                <div className="username">Sarah Johnson</div>
                <div className="points">2,180 points</div>
              </div>
            </div>
            <div className="achievements">🥈 3 wins</div>
          </div>
          <div className="leaderboard-item">
            <div className="rank">3</div>
            <div className="user-info">
              <img src="https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?w=40&h=40&fit=crop&crop=face" alt="User" />
              <div>
                <div className="username">Mike Rodriguez</div>
                <div className="points">1,920 points</div>
              </div>
            </div>
            <div className="achievements">🥉 2 wins</div>
          </div>
        </div>
      </div> */}

      {/* Registration Modal */}
      {showRegistrationModal && selectedHackathon && (
        <HackathonRegistrationModal
          hackathon={selectedHackathon}
          onClose={closeModal}
          isJoinFlow={isJoinFlow}
        />
      )}
    </div>
  );
}

export default Hackathons;