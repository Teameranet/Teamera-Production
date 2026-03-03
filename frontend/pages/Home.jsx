import { Link } from 'react-router-dom';
import { Rocket, Search, ArrowRight, Users, Lightbulb, Trophy, Target, GitBranch, MessageSquare, Shield, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './Home.css';

function Home({ onAuthClick }) {
  const { user } = useAuth();


  const handleStartBuilding = () => {
    if (!user) {
      onAuthClick();
    }
  };

  return (
    <div className="home-container">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">
            Build Your Dream Team and
            <span className="gradient-text"> Launch Your Next Big Idea </span>
          </h1>
          <p className="hero-subtitle">
            From concept to funded startup. Connect with talented individuals, collaborate on exciting projects, and turn your vision into reality. Join thousands of creators building the future together.
          </p>
          <div className="hero-actions">
            {user ? (
              <Link to="/projects" className="cta-button primary">
                <Rocket size={20} className="button-icon" />
                Explore Projects
              </Link>
            ) : (
              <button className="cta-button primary" onClick={handleStartBuilding}>
                <Rocket size={20} className="button-icon" />
                Start Building Today
              </button>
            )}
            <Link to="/hackathons" className="cta-button secondary">
              <Search size={20} className="button-icon" />
              Join Hackathons
            </Link>
          </div>
        </div>

      </section>

      {/* Features Section */}
      <section id="features" className="our-features-section">
        <div className="features-header">
          <p className="features-label">OUR FEATURES</p>
<h2 className="features-title">See Your Journey With Teamera.net</h2>
          <p className="features-subtitle">
            From user onboarding to project collaboration, our comprehensive platform streamlines every step of your startup journey with integrated tools and community support.
          </p>
        </div>
        <div className="features-grid-new">
          <div className="feature-card-new">
            <div className="feature-icon-new">
              <Users size={24} />
            </div>
            <h3>User Onboarding</h3>
            <p>Intuitive registration, login, and profile creation.</p>
          </div>
          <div className="feature-card-new">
            <div className="feature-icon-new">
              <Target size={24} />
            </div>
            <h3>Project Creation</h3>
            <p>Guided flow to list projects and define team needs.</p>
          </div>
          <div className="feature-card-new">
            <div className="feature-icon-new">
              <Search size={24} />
            </div>
            <h3>Project Discovery</h3>
            <p>Advanced browsing and filtering to find projects.</p>
          </div>
          <div className="feature-card-new">
            <div className="feature-icon-new">
              <GitBranch size={24} />
            </div>
            <h3>Application Management</h3>
            <p>Apply to projects and manage applications easily.</p>
          </div>
          <div className="feature-card-new">
            <div className="feature-icon-new">
              <MessageSquare size={24} />
            </div>
            <h3>Real-time Collaboration</h3>
            <p>Integrated chat, task tracking, and file sharing.</p>
          </div>
          <div className="feature-card-new">
            <div className="feature-icon-new">
              <Trophy size={24} />
            </div>
            <h3>Hackathon Tracking</h3>
            <p>Join hackathons, track progress, and win prizes.</p>
          </div>
        </div>
      </section>

      {/* Project Stages Section */}
      <section className="stages-section">
        <div className="section-header">
          <h2>Project stages from idea to scale</h2>
          <p>Understand where your project is and what to do next.</p>
        </div>
        <div className="stages-timeline">
          <div className="stage-card ideation">
            <div className="stage-icon">
              <Lightbulb size={24} />
            </div>
            <h3>Ideation</h3>
            <p>Define the problem, research the space, and outline the solution.</p>
            <ul>
              <li>Write problem statement</li>
              <li>Market and competitor scan</li>
              <li>Create lean canvas</li>
            </ul>
            <span className="stage-badge">Start here</span>
          </div>
          <div className="stage-card validation">
            <div className="stage-icon">
              <Target size={24} />
            </div>
            <h3>Validation</h3>
            <p>Test assumptions with users and validate demand before building.</p>
            <ul>
              <li>Customer interviews</li>
              <li>Landing page + waitlist</li>
              <li>Pilot or concierge test</li>
            </ul>
            <span className="stage-badge">De‑risk</span>
          </div>
          <div className="stage-card mvp">
            <div className="stage-icon">
              <GitBranch size={24} />
            </div>
            <h3>MVP</h3>
            <p>Build a minimal version focused on the core value proposition.</p>
            <ul>
              <li>Scope v1 features</li>
              <li>Ship fast, measure usage</li>
              <li>Iterate from feedback</li>
            </ul>
            <span className="stage-badge">Build</span>
          </div>
          <div className="stage-card launch">
            <div className="stage-icon">
              <Rocket size={24} />
            </div>
            <h3>Launch</h3>
            <p>Release publicly, announce widely, and onboard early adopters.</p>
            <ul>
              <li>Public release checklist</li>
              <li>Go‑to‑market plan</li>
              <li>Monitor KPIs</li>
            </ul>
            <span className="stage-badge">Go live</span>
          </div>
          <div className="stage-card scale">
            <div className="stage-icon">
              <Users size={24} />
            </div>
            <h3>Scale</h3>
            <p>Grow usage, strengthen the team, and optimize for reliability.</p>
            <ul>
              <li>Growth experiments</li>
              <li>Team hiring</li>
              <li>Security & reliability</li>
            </ul>
            <span className="stage-badge">Grow</span>
          </div>
        </div>
      </section>

      {/* User Personas Section */}
      <section className="personas-section">
        <div className="section-header">
          <h2>Built for every type of entrepreneur</h2>
          <p>Whether you're starting out or scaling up, find your place in our community</p>
        </div>
        <div className="personas-grid">
          <div className="persona-card founder">
            <div className="persona-icon">🚀</div>
            <h3>The Founder</h3>
            <p>Have a brilliant idea? Build your dream team and turn your vision into reality.</p>
            <ul>
              <li>Create project listings</li>
              <li>Find co-founders</li>
              <li>Recruit team members</li>
              <li>Access funding opportunities</li>
            </ul>
          </div>
          <div className="persona-card professional">
            <div className="persona-icon">💼</div>
            <h3>The Professional</h3>
            <p>Ready to contribute your skills to exciting projects and grow your career.</p>
            <ul>
              <li>Discover projects</li>
              <li>Showcase your skills</li>
              <li>Join innovative teams</li>
              <li>Build your portfolio</li>
            </ul>
          </div>
          <div className="persona-card investor">
            <div className="persona-icon">💰</div>
            <h3>The Investor</h3>
            <p>Looking for promising startups and talented teams to invest in.</p>
            <ul>
              <li>Browse startup projects</li>
              <li>Connect with founders</li>
              <li>Track team progress</li>
              <li>Make informed investments</li>
            </ul>
          </div>
          <div className="persona-card student">
            <div className="persona-icon">🎓</div>
            <h3>The Student</h3>
            <p>Gain real-world experience and learn from industry professionals.</p>
            <ul>
              <li>Join learning projects</li>
              <li>Participate in hackathons</li>
              <li>Build your network</li>
              <li>Develop practical skills</li>
            </ul>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-content">
          <h1 className="hero-title">Ready to Build the Future?</h1>
          <p className="hero-subtitle">
            Join thousands of entrepreneurs, developers, and creators who are building amazing projects together. Your next big opportunity is just one click away.
          </p>
          <div className="hero-actions">
            {user ? (
              <Link to="/projects" className="cta-button primary">
                <Rocket size={20} className="button-icon" />
                Get Started Free
              </Link>
            ) : (
              <button className="cta-button primary" onClick={handleStartBuilding}>
                <Rocket size={20} className="button-icon" />
                Get Started Free
              </button>
            )}
            <Link to="/hackathons" className="cta-button secondary">
              <Search size={20} className="button-icon" />
              Join Hackathons
            </Link>
          </div>
          <div className="trust-indicators">
            <div className="trust-item">
              <Shield size={20} />
              100% Free to Join
            </div>
            <div className="trust-item">
              <Users size={20} />
              No Credit Card Required
            </div>
            <div className="trust-item">
              <Zap size={20} />
              Start Collaborating Today
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Home;