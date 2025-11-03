import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import './Landing.css';

const Landing = () => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="landing">
      {/* Premium Navbar */}
      <nav className={`navbar ${scrolled ? 'navbar-scrolled' : ''}`}>
        <div className="navbar-container">
          <div className="logo">
            <span className="logo-icon">🏥</span>
            <span className="logo-text">MedicalGallery</span>
          </div>
          <div className="nav-links">
            <a href="#features">Features</a>
            <a href="#how">How It Works</a>
            <a href="#pricing">Pricing</a>
            <Link to="/login" className="nav-btn">Login</Link>
            <Link to="/register" className="nav-btn-primary">Get Started</Link>
          </div>
        </div>
      </nav>

      {/* Hero Section with Animated Background */}
      <section className="hero">
        <div className="hero-bg">
          <div className="floating-shape shape-1"></div>
          <div className="floating-shape shape-2"></div>
          <div className="floating-shape shape-3"></div>
        </div>
        
        <div className="hero-content">
          <h1 className="hero-title">
            Your Medical Records,
            <span className="gradient-text"> Simplified</span>
          </h1>
          
          <p className="hero-description">
            Store, access, and share your medical records securely from anywhere. 
            Built for modern healthcare with bank-level encryption.
          </p>
          
          <div className="hero-benefits">
            <div className="benefit-item">
              <div className="benefit-icon">🔐</div>
              <div className="benefit-content">
                <h3 className="benefit-title">Secure & Private</h3>
                <p className="benefit-text">Your medical records are encrypted and accessible only to authorized healthcare providers</p>
              </div>
            </div>
            <div className="benefit-item">
              <div className="benefit-icon">📱</div>
              <div className="benefit-content">
                <h3 className="benefit-title">Access Anywhere</h3>
                <p className="benefit-text">View and manage your health records from any device, anytime you need them</p>
              </div>
            </div>
            <div className="benefit-item">
              <div className="benefit-icon">🏥</div>
              <div className="benefit-content">
                <h3 className="benefit-title">Hospital Integration</h3>
                <p className="benefit-text">Hospitals can securely upload and share records with patients using QR codes</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="hero-visual">
          <div className="glass-card card-1">
            <div className="card-icon">📄</div>
            <div className="card-title">Lab Report</div>
            <div className="card-date">Oct 25, 2025</div>
            <div className="card-status status-complete">✓ Verified</div>
          </div>
          
          <div className="glass-card card-2">
            <div className="card-icon">🔬</div>
            <div className="card-title">X-Ray Scan</div>
            <div className="card-date">Oct 20, 2025</div>
            <div className="card-status status-pending">⏳ Processing</div>
          </div>
          
          <div className="glass-card card-3">
            <div className="card-icon">💊</div>
            <div className="card-title">Prescription</div>
            <div className="card-date">Oct 15, 2025</div>
            <div className="card-status status-complete">✓ Active</div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="features">
        <div className="section-header">
          <span className="section-badge">Features</span>
          <h2 className="section-title">Everything you need for<br/>medical record management</h2>
          <p className="section-subtitle">Powerful features designed for patients and healthcare providers</p>
        </div>
        
        <div className="features-grid">
          <div className="feature-card" data-aos="fade-up">
            <div className="feature-icon-wrapper purple">
              <div className="feature-icon">🔒</div>
            </div>
            <h3 className="feature-title">Bank-Level Security</h3>
            <p className="feature-description">
              256-bit encryption ensures your medical records are protected with military-grade security
            </p>
            <a href="#" className="feature-link">Learn more →</a>
          </div>
          
          <div className="feature-card" data-aos="fade-up" data-aos-delay="100">
            <div className="feature-icon-wrapper blue">
              <div className="feature-icon">☁️</div>
            </div>
            <h3 className="feature-title">Cloud Storage</h3>
            <p className="feature-description">
              Access your records from any device, anywhere in the world, 24/7
            </p>
            <a href="#" className="feature-link">Learn more →</a>
          </div>
          
          <div className="feature-card" data-aos="fade-up" data-aos-delay="200">
            <div className="feature-icon-wrapper green">
              <div className="feature-icon">📱</div>
            </div>
            <h3 className="feature-title">Mobile Ready</h3>
            <p className="feature-description">
              Fully responsive design works perfectly on phones, tablets, and desktops
            </p>
            <a href="#" className="feature-link">Learn more →</a>
          </div>
          
          <div className="feature-card" data-aos="fade-up">
            <div className="feature-icon-wrapper orange">
              <div className="feature-icon">⚡</div>
            </div>
            <h3 className="feature-title">Instant Upload</h3>
            <p className="feature-description">
              Upload X-rays, prescriptions, and reports in seconds with drag-and-drop
            </p>
            <a href="#" className="feature-link">Learn more →</a>
          </div>
          
          <div className="feature-card" data-aos="fade-up" data-aos-delay="100">
            <div className="feature-icon-wrapper pink">
              <div className="feature-icon">🤝</div>
            </div>
            <h3 className="feature-title">Easy Sharing</h3>
            <p className="feature-description">
              Share records with doctors using secure unique codes - no passwords needed
            </p>
            <a href="#" className="feature-link">Learn more →</a>
          </div>
          
          <div className="feature-card" data-aos="fade-up" data-aos-delay="200">
            <div className="feature-icon-wrapper teal">
              <div className="feature-icon">📊</div>
            </div>
            <h3 className="feature-title">Smart Analytics</h3>
            <p className="feature-description">
              Get insights and organize records with AI-powered categorization
            </p>
            <a href="#" className="feature-link">Learn more →</a>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how" className="how-it-works">
        <div className="section-header">
          <span className="section-badge">Simple Process</span>
          <h2 className="section-title">Get started in 3 easy steps</h2>
        </div>
        
        <div className="steps-container">
          <div className="step" data-aos="fade-right">
            <div className="step-number">01</div>
            <div className="step-content">
              <h3>Create Your Account</h3>
              <p>Sign up in 30 seconds with your phone number or email. No credit card required.</p>
            </div>
            <div className="step-visual">📝</div>
          </div>
          
          <div className="step-line"></div>
          
          <div className="step" data-aos="fade-left">
            <div className="step-visual">📤</div>
            <div className="step-content">
              <h3>Upload Your Records</h3>
              <p>Drag and drop your medical documents. We support all formats - PDF, JPG, PNG.</p>
            </div>
            <div className="step-number">02</div>
          </div>
          
          <div className="step-line"></div>
          
          <div className="step" data-aos="fade-right">
            <div className="step-number">03</div>
            <div className="step-content">
              <h3>Access Anywhere</h3>
              <p>View and share your records from any device, anytime you need them.</p>
            </div>
            <div className="step-visual">🎯</div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-content">
          <h2 className="cta-title">Ready to get started?</h2>
          <p className="cta-description">Join thousands of patients managing their health records smarter</p>
          <div className="cta-buttons">
            <Link to="/register" className="btn-cta-primary">
              Get Started
              <span className="btn-arrow">→</span>
            </Link>
            <Link to="/login" className="btn-cta-secondary">Sign In</Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-section">
            <div className="footer-logo">
              <span className="logo-icon">🏥</span>
              <span className="logo-text">MedicalGallery</span>
            </div>
            <p className="footer-description">
              Secure medical record management platform trusted by thousands worldwide.
            </p>
          </div>
          
          <div className="footer-section">
            <h4>Product</h4>
            <a href="#features">Features</a>
            <a href="#pricing">Pricing</a>
            <a href="#">Security</a>
          </div>
          
          <div className="footer-section">
            <h4>Company</h4>
            <a href="#">About</a>
            <a href="#">Blog</a>
            <a href="#">Contact</a>
          </div>
          
          <div className="footer-section">
            <h4>Legal</h4>
            <a href="#">Privacy</a>
            <a href="#">Terms</a>
            <a href="#">HIPAA</a>
          </div>
        </div>
        
        <div className="footer-bottom">
          <p>&copy; 2025 MedicalGallery. All rights reserved.</p>
          <div className="footer-social">
            <a href="#">Twitter</a>
            <a href="#">LinkedIn</a>
            <a href="#">GitHub</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
