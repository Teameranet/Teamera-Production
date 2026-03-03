import { Calendar, Users, Trophy, MapPin, Bookmark, Share2 } from 'lucide-react';
import './HackathonCard.css';

function HackathonCard({ hackathon, onJoinClick, onRegisterClick }) {
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getDaysUntil = (dateString) => {
    const today = new Date();
    const eventDate = new Date(dateString);
    const diffTime = eventDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysUntil = getDaysUntil(hackathon.startDate);

  const handleBookmark = (e) => {
    e.stopPropagation();
    console.log('Bookmarked:', hackathon.title);
  };

  const handleShare = (e) => {
    e.stopPropagation();
    console.log('Shared:', hackathon.title);
  };

  return (
    <div className="hackathon-card">
      <div className="hackathon-header">
        <h3 className="hackathon-title">{hackathon.title}</h3>
        <div className="hackathon-actions-header">
          <span className={`hackathon-status ${hackathon.status}`}>
            {hackathon.status === 'upcoming' && 'Upcoming'}
            {hackathon.status === 'ongoing' && 'Live Now'}
            {hackathon.status === 'completed' && 'Completed'}
          </span>
          <div className="card-actions">
            <button className="action-btn bookmark-btn" onClick={handleBookmark}>
              <Bookmark size={16} />
            </button>
            <button className="action-btn share-btn" onClick={handleShare}>
              <Share2 size={16} />
            </button>
          </div>
        </div>
      </div>

      <p className="hackathon-description">{hackathon.description}</p>

      <div className="hackathon-meta">
        <div className="meta-item">
          <Calendar size={16} />
          <span>{formatDate(hackathon.startDate)} - {formatDate(hackathon.endDate)}</span>
        </div>
        <div className="meta-item">
          <Users size={16} />
          <span>{hackathon.participants} participants</span>
        </div>
        <div className="meta-item">
          <Trophy size={16} />
          <span>{hackathon.prize}</span>
        </div>
      </div>

      <div className="hackathon-categories">
        {hackathon.categories.slice(0, 3).map((category, index) => (
          <span key={index} className="category-tag">{category}</span>
        ))}
        {hackathon.categories.length > 3 && (
          <span className="category-tag more">+{hackathon.categories.length - 3}</span>
        )}
      </div>

      <div className="hackathon-footer">
        {hackathon.status === 'upcoming' && daysUntil > 0 && (
          <span className="days-until">{daysUntil} days to go</span>
        )}
        <div className="hackathon-actions">
          {hackathon.status === 'upcoming' && (
            <button 
              className="register-btn"
              onClick={(e) => {
                e.stopPropagation();
                onRegisterClick(hackathon);
              }}
            >
              Register Now
            </button>
          )}
          {hackathon.status === 'ongoing' && (
            <button 
              className="join-btn"
              onClick={(e) => {
                e.stopPropagation();
                onJoinClick(hackathon);
              }}
            >
              Join Now
            </button>
          )}
          {hackathon.status === 'completed' && (
            <button className="view-results-btn">View Results</button>
          )}
        </div>
      </div>
    </div>
  );
}

export default HackathonCard;