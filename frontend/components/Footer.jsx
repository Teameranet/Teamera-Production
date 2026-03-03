import { Twitter, Facebook, Instagram, Github } from 'lucide-react';
import './Footer.css';

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-main">
          {/* Logo */}
          <div className="footer-logo">
            {/* <div className="logo-icon"></div> */}
            <span className="logo-text">Teamera.net</span>
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