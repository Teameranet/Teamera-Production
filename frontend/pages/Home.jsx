import React from 'react';
import { Link } from 'react-router-dom';
import { Rocket, Search, ArrowRight, Users, Lightbulb, Target, GitBranch, MessageSquare, Shield, Zap, ChevronRight, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import UserAvatar from '../components/UserAvatar';
import './Home.css';

function Home({ onAuthClick }) {
  const { user } = useAuth();
  const [activePersona, setActivePersona] = React.useState('founder');
  const [activeFlow, setActiveFlow] = React.useState('hiring');

  const handleStartBuilding = () => {
    if (!user) {
      onAuthClick();
    }
  };

  const flows = {
    hiring: [
      {
        id: 1,
        title: "Post Your Vision",
        description: "List your project and specify the skills you need to bring it to life.",
        details: ["Define project goals", "Set required skills", "Outline team structure"],
        icon: <Rocket size={24} />,
        color: "#4f46e5",
        badge: "Post"
      },
      {
        id: 2,
        title: "Find Talent",
        description: "Browse through applications and search for professionals that match your needs.",
        details: ["Review portfolios", "Verify experience", "Direct messaging"],
        icon: <Search size={24} />,
        color: "#0ea5e9",
        badge: "Search"
      },
      {
        id: 3,
        title: "Build Your Team",
        description: "Select the best candidates and onboard them to your project.",
        details: ["Send invitations", "Confirm roles", "Manage permissions"],
        icon: <Users size={24} />,
        color: "#10b981",
        badge: "Hire"
      },
      {
        id: 4,
        title: "Launch Together",
        description: "Collaborate in real-time and turn your idea into a reality.",
        details: ["Real-time chat", "Task management", "Progress tracking"],
        icon: <Zap size={24} />,
        color: "#f59e0b",
        badge: "Build"
      }
    ],
    connecting: [
      {
        id: 1,
        title: "Discover Projects",
        description: "Explore a wide range of projects looking for your specific expertise.",
        details: ["Advanced filtering", "Skill-based matches", "Industry categories"],
        icon: <Search size={24} />,
        color: "#4f46e5",
        badge: "Explore"
      },
      {
        id: 2,
        title: "Apply & Pitch",
        description: "Apply to projects that excite you and showcase why you're the right fit.",
        details: ["Personalized pitch", "Portfolio highlight", "Quick application"],
        icon: <Target size={24} />,
        color: "#0ea5e9",
        badge: "Apply"
      },
      {
        id: 3,
        title: "Join a Team",
        description: "Get accepted into a team and start contributing your skills.",
        details: ["Accept invites", "Review team goals", "Meet your peers"],
        icon: <Users size={24} />,
        color: "#10b981",
        badge: "Join"
      },
      {
        id: 4,
        title: "Grow & Build",
        description: "Contribute to innovative projects and expand your professional portfolio.",
        details: ["Gain experience", "Build network", "Track contributions"],
        icon: <GitBranch size={24} />,
        color: "#f59e0b",
        badge: "Contribute"
      }
    ]
  };

  const personas = [
    {
      id: 'founder',
      title: "The Founder",
      icon: "🚀",
      description: "Have a brilliant idea? Build your dream team and turn your vision into reality.",
      features: ["Create project listings", "Find co-founders", "Recruit team members", "Access funding opportunities"],
      color: "#2563eb",
      avatar: { name: "Founder", color: "#2563eb" }
    },
    {
      id: 'professional',
      title: "The Professional",
      icon: "💼",
      description: "Ready to contribute your skills to exciting projects and grow your career.",
      features: ["Discover projects", "Showcase your skills", "Join innovative teams", "Build your portfolio"],
      color: "#2563eb",
      avatar: { name: "Pro", color: "#2563eb" }
    },
    {
      id: 'investor',
      title: "The Investor",
      icon: "💰",
      description: "Looking for promising startups and talented teams to invest in.",
      features: ["Browse startup projects", "Connect with founders", "Track team progress", "Make informed investments"],
      color: "#2563eb",
      avatar: { name: "Invest", color: "#2563eb" }
    },
    {
      id: 'student',
      title: "The Student",
      icon: "🎓",
      description: "Gain real-world experience and learn from industry professionals.",
      features: ["Join learning projects", "Build your network", "Develop practical skills"],
      color: "#2563eb",
      avatar: { name: "Student", color: "#2563eb" }
    }
  ];

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

        </div>
      </section>

      {/* Project Stages Section - Wavy Timeline */}
      <section className="stages-journey-section">
        <div className="section-header">
          <span className="section-label">OUR PROCESS</span>
          <h2>How Teamera works</h2>
          <p>Whether you're looking to hire or looking to connect, we've got you covered.</p>
        </div>

        <div className="persona-toggle-container">
          <button 
            className={`persona-toggle-btn ${activeFlow === 'hiring' ? 'active' : ''}`}
            onClick={() => setActiveFlow('hiring')}
          >
            For Hiring
          </button>
          <button 
            className={`persona-toggle-btn ${activeFlow === 'connecting' ? 'active' : ''}`}
            onClick={() => setActiveFlow('connecting')}
          >
            For Connecting
          </button>
        </div>

        <div className="journey-container">
          {/* SVG Wavy Line */}
          <div className="wavy-line-container">
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" fill="none" xmlns="http://www.w3.org/2000/svg" className="wavy-svg">
              <path 
                d="M 10 10 C 10 25, 90 25, 90 40 C 90 55, 10 55, 10 70 C 10 77.5, 90 77.5, 90 85" 
                stroke="url(#gradient-line)" 
                strokeWidth="3" 
                vectorEffect="non-scaling-stroke"
              />
              <defs>
                <linearGradient id="gradient-line" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#2563eb" />
                  <stop offset="50%" stopColor="#7c3aed" />
                  <stop offset="100%" stopColor="#ef4444" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          <div className="journey-steps">
            <AnimatePresence mode="wait">
              <motion.div 
                key={activeFlow}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="journey-steps-container"
              >
                {flows[activeFlow].map((stage, index) => (
                  <motion.div 
                    key={stage.id}
                    className={`journey-step ${index % 2 === 0 ? 'left' : 'right'}`}
                    initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                  >
                    <div className="step-content-card">
                      <div className="step-header">
                        <div className="step-number">{stage.id}</div>
                        <div className="step-icon" style={{ color: stage.color }}>
                          {stage.icon}
                        </div>
                      </div>
                      <h3>{stage.title}</h3>
                      <p>{stage.description}</p>
                      <ul className="step-features">
                        {stage.details.map((detail, i) => (
                          <li key={i}>
                            <CheckCircle2 size={14} className="feature-check" />
                            {detail}
                          </li>
                        ))}
                      </ul>
                      <div className="step-footer">
                        <span className="step-badge" style={{ backgroundColor: `${stage.color}15`, color: stage.color }}>
                          {stage.badge}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* User Personas Section - Premium Selector */}
      <section className="personas-modern-section">
        <div className="section-header">
          <span className="section-label">COMMUNITY</span>
          <h2>Built for every type of entrepreneur</h2>
          <p>Whether you're starting out or scaling up, find your place in our community</p>
        </div>

        <div className="persona-toggle-container">
          {personas.map((p) => (
            <button 
              key={p.id}
              className={`persona-toggle-btn ${activePersona === p.id ? 'active' : ''}`}
              onClick={() => setActivePersona(p.id)}
            >
              {p.title}
            </button>
          ))}
        </div>

        <div className="persona-display-container">
          <AnimatePresence mode="wait">
            {personas.map((p) => p.id === activePersona && (
              <motion.div 
                key={p.id}
                className="persona-detailed-card"
                initial={{ opacity: 0, scale: 0.95, x: 20 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95, x: -20 }}
                transition={{ duration: 0.4 }}
              >
                <div className="persona-card-visual" style={{ background: `linear-gradient(135deg, ${p.color}20, ${p.color}05)` }}>
                  <div 
                    className="persona-large-icon" 
                    style={{ 
                      fontSize: '6rem', 
                      filter: 'drop-shadow(0 15px 25px rgba(0,0,0,0.1))',
                      animation: 'float 6s ease-in-out infinite' 
                    }}
                  >
                    {p.icon}
                  </div>
                </div>
                <div className="persona-card-content">
                  <div className="persona-header">
                    <h3>{p.title}</h3>
                    <p className="persona-tagline">{p.description}</p>
                  </div>
                  <div className="persona-features-grid">
                    {p.features.map((feature, i) => (
                      <div key={i} className="persona-feature-item">
                        <CheckCircle2 size={18} className="feature-icon" style={{ color: p.color }} />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                  <div className="persona-cta">
                    <button className="cta-button primary" style={{ background: p.color }} onClick={handleStartBuilding}>
                      Join as {p.title}
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
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