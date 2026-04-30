import { Twitter, Facebook, Instagram, Github } from 'lucide-react';
import './Footer.css';

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-main">
          {/* Logo */}
          <div className="footer-logo">
            <span className="footer-logo-mark">
              <svg width="34" height="34" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <defs>
                  <linearGradient id="footerLogoGrad" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#60a5fa"/>
                    <stop offset="1" stopColor="#a78bfa"/>
                  </linearGradient>
                </defs>
                {/* Three connected people forming a team circle */}
                {/* Person 1 - Top */}
                <circle cx="18" cy="8" r="3.5" fill="url(#footerLogoGrad)"/>
                <path d="M18 12 Q18 16 18 18" stroke="url(#footerLogoGrad)" strokeWidth="2.5" strokeLinecap="round"/>
                
                {/* Person 2 - Bottom Left */}
                <circle cx="8" cy="24" r="3.5" fill="url(#footerLogoGrad)"/>
                <path d="M10.5 21.5 Q14 19 18 18" stroke="url(#footerLogoGrad)" strokeWidth="2.5" strokeLinecap="round"/>
                
                {/* Person 3 - Bottom Right */}
                <circle cx="28" cy="24" r="3.5" fill="url(#footerLogoGrad)"/>
                <path d="M25.5 21.5 Q22 19 18 18" stroke="url(#footerLogoGrad)" strokeWidth="2.5" strokeLinecap="round"/>
                
                {/* Central connection hub */}
                <circle cx="18" cy="18" r="2.5" fill="url(#footerLogoGrad)"/>
              </svg>
            </span>
            <span className="footer-logo-wordmark">
              <span className="footer-logo-name">Teamera</span>
              <span className="footer-logo-slogan">Teamwork Simplified</span>
            </span>
          </div>
          
          {/* Navigation */}
          <div className="footer-nav">
            <a href="#features">Features</a>
            <a href="/projects">Projects</a>
            <a href="/community">Community</a>
          </div>
          
          {/* Social Media Icons */}
          <div className="footer-social">
            <a href="#" aria-label="Twitter">
              <Twitter size={18} />
            </a>
            <a href="#" aria-label="Facebook">
              <Facebook size={18} />
            </a>
            <a href="#" aria-label="Instagram">
              <Instagram size={18} />
            </a>
            <a href="#" aria-label="GitHub">
              <Github size={18} />
            </a>
          </div>
        </div>
        
        {/* Copyright */}
        <div className="footer-copyright">
          <p>© Copyright 2025, All Rights Reserved by Teamera.net</p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;