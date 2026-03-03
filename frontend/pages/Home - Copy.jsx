import { Link } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
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

      {/* Features Section - Horizontal Scroll on Vertical Scroll */}
      <FeaturesHorizontal />

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

function FeaturesHorizontal() {
  const sectionRef = useRef(null);
  const [progress, setProgress] = useState(0); // 0..1 overall
  const [activeIndex, setActiveIndex] = useState(0);
  const slideCount = 6;

  useEffect(() => {
    const handleScroll = () => {
      const el = sectionRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const viewportH = window.innerHeight;
      const totalScroll = viewportH * (slideCount - 1);
      const start = rect.top;
      const traveled = Math.min(Math.max(-start, 0), totalScroll);
      const p = totalScroll > 0 ? traveled / totalScroll : 0;
      setProgress(p);
      setActiveIndex(Math.round(p * (slideCount - 1)));
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, []);

  // Touch support: swipe left/right to move between slides
  const touchStartX = useRef(0);
  const touchDeltaX = useRef(0);
  const isTouching = useRef(false);

  const onTouchStart = (e) => {
    isTouching.current = true;
    touchStartX.current = e.touches[0].clientX;
    touchDeltaX.current = 0;
  };
  const onTouchMove = (e) => {
    if (!isTouching.current) return;
    touchDeltaX.current = e.touches[0].clientX - touchStartX.current;
  };
  const onTouchEnd = () => {
    if (!isTouching.current) return;
    isTouching.current = false;
    const threshold = 50;
    if (touchDeltaX.current > threshold && activeIndex > 0) {
      scrollToSlide(activeIndex - 1);
    } else if (touchDeltaX.current < -threshold && activeIndex < slideCount - 1) {
      scrollToSlide(activeIndex + 1);
    }
  };

  const scrollToSlide = (index) => {
    const targetProgress = index / (slideCount - 1);
    const el = sectionRef.current;
    if (!el) return;
    const viewportH = window.innerHeight;
    const totalScroll = viewportH * (slideCount - 1);
    const containerTop = el.getBoundingClientRect().top + window.scrollY;
    const targetY = containerTop + targetProgress * totalScroll;
    window.scrollTo({ top: targetY, behavior: 'smooth' });
  };

  const translateXPercent = -(progress * (100 * (slideCount - 1)));

  return (
    <section id="features" className="features-horizontal" ref={sectionRef}>
      <div className="features-sticky">
        <div className="features-left">
          <div className="features-header left">
            <p className="features-label">OUR FEATURES</p>
            <h2 className="features-title">See Your Journey With Teamera.net</h2>
            <p className="features-subtitle">
              From user onboarding to project collaboration, our comprehensive platform streamlines every step of your startup journey with integrated tools and community support.
            </p>
          </div>
        </div>
        <div className="features-right" onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
          <div className="features-viewport">
            <div
              className="features-track"
              style={{ transform: `translate3d(${translateXPercent}%, 0, 0)` }}
            >
              <FeatureSlide icon={<Users size={24} />} title="User Onboarding" desc="Intuitive registration, login, and profile creation." />
              <FeatureSlide icon={<Target size={24} />} title="Project Creation" desc="Guided flow to list projects and define team needs." />
              <FeatureSlide icon={<Search size={24} />} title="Project Discovery" desc="Advanced browsing and filtering to find projects." />
              <FeatureSlide icon={<GitBranch size={24} />} title="Application Management" desc="Apply to projects and manage applications easily." />
              <FeatureSlide icon={<MessageSquare size={24} />} title="Real-time Collaboration" desc="Integrated chat, task tracking, and file sharing." />
              <FeatureSlide icon={<Trophy size={24} />} title="Hackathon Tracking" desc="Join hackathons, track progress, and win prizes." />
            </div>
          </div>
          <div className="features-indicators">
            <div className="dots">
              {Array.from({ length: slideCount }).map((_, i) => (
                <button
                  key={i}
                  className={"dot" + (i === activeIndex ? " active" : "")}
                  aria-label={`Go to slide ${i + 1}`}
                  onClick={() => scrollToSlide(i)}
                />
              ))}
            </div>
            <div className="progress-bar" aria-hidden>
              <div className="progress-fill" style={{ width: `${progress * 100}%` }} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function FeatureSlide({ icon, title, desc }) {
  return (
    <div className="feature-slide">
      <div className="feature-icon-new">{icon}</div>
      <h3>{title}</h3>
      <p>{desc}</p>
    </div>
  );
}