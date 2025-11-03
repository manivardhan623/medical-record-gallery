import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Login.css';

import API_BASE_URL from '../config/api';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    contact: '',
    userType: 'PATIENT'
  });
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch(`${API_BASE_URL}/auth/send-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contact: formData.contact,
          userType: formData.userType
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to send OTP');
      }

      setOtpSent(true);
      alert('✅ OTP sent! Check your phone or backend console for the code.');
    } catch (err) {
      setError(err.message);
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index, value) => {
    if (value.length <= 1 && /^\d*$/.test(value)) {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);
      
      if (value && index < 5) {
        document.getElementById(`otp-${index + 1}`).focus();
      }
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const otpCode = otp.join('');
      
      const response = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contact: formData.contact,
          otpCode: otpCode
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Invalid OTP');
      }

      // Store user data and login
      login(data.data);

      // Redirect based on user type
      const userType = data.data.userType;
      if (userType === 'PATIENT') {
        navigate('/patient-dashboard');
      } else if (userType === 'HOSPITAL') {
        navigate('/hospital-dashboard');
      }
    } catch (err) {
      setError(err.message);
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-background">
        <div className="bg-shape shape-1"></div>
        <div className="bg-shape shape-2"></div>
        <div className="bg-shape shape-3"></div>
      </div>

      <div className="login-content">
        {/* Left Side - Branding */}
        <div className="login-branding">
          <Link to="/" className="back-button">
            <span>←</span>
            <span>Back to Home</span>
          </Link>
          
          <div className="branding-content">
            <div className="brand-logo">
              <span className="logo-icon">🏥</span>
              <span className="logo-text">MedicalGallery</span>
            </div>
            
            <h1 className="branding-title">
              Welcome back to your<br/>
              <span className="gradient-text">Health Dashboard</span>
            </h1>
            
            <p className="branding-description">
              Access your medical records securely with OTP verification. 
              No passwords needed - just simple and secure.
            </p>
            
            <div className="branding-features">
              <div className="feature-item">
                <span className="feature-icon">🔒</span>
                <span>Bank-level Security</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">⚡</span>
                <span>Instant Access</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">📱</span>
                <span>OTP Verification</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="login-form-wrapper">
          <div className="login-card">
            <div className="login-header">
              <h2 className="login-title">Sign In</h2>
              <p className="login-subtitle">
                Enter your phone or email to receive OTP
              </p>
            </div>

            {error && <div className="error-alert">❌ {error}</div>}

            {!otpSent ? (
              <form onSubmit={handleSendOTP} className="login-form">
                <div className="form-group">
                  <label className="form-label">Phone Number or Email</label>
                  <div className="input-wrapper">
                    <span className="input-icon">📱</span>
                    <input
                      type="text"
                      name="contact"
                      className="form-input"
                      placeholder="Enter phone or email"
                      value={formData.contact}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">I am a</label>
                  <div className="user-type-selector">
                    <button
                      type="button"
                      className={`user-type-btn ${formData.userType === 'PATIENT' ? 'active' : ''}`}
                      onClick={() => setFormData({ ...formData, userType: 'PATIENT' })}
                    >
                      <span className="user-type-icon">👤</span>
                      <span>Patient</span>
                    </button>
                    <button
                      type="button"
                      className={`user-type-btn ${formData.userType === 'HOSPITAL' ? 'active' : ''}`}
                      onClick={() => setFormData({ ...formData, userType: 'HOSPITAL' })}
                    >
                      <span className="user-type-icon">🏥</span>
                      <span>Hospital</span>
                    </button>
                  </div>
                </div>

                <button 
                  type="submit" 
                  className="submit-btn"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="loading-spinner"></span>
                  ) : (
                    <>
                      <span>Send OTP</span>
                      <span className="btn-arrow">→</span>
                    </>
                  )}
                </button>

                <div className="form-footer">
                  <p>Don't have an account? <Link to="/register" className="link">Sign up</Link></p>
                </div>
              </form>
            ) : (
              <form onSubmit={handleVerifyOTP} className="login-form">
                <div className="otp-info">
                  <div className="otp-icon">📬</div>
                  <p className="otp-message">
                    We've sent a 6-digit OTP to<br/>
                    <strong>{formData.contact}</strong>
                  </p>
                  <button 
                    type="button" 
                    className="change-number"
                    onClick={() => {
                      setOtpSent(false);
                      setOtp(['', '', '', '', '', '']);
                    }}
                  >
                    Change number
                  </button>
                </div>

                <div className="form-group">
                  <label className="form-label">Enter OTP</label>
                  <div className="otp-inputs">
                    {otp.map((digit, index) => (
                      <input
                        key={index}
                        id={`otp-${index}`}
                        type="text"
                        maxLength="1"
                        className="otp-input"
                        value={digit}
                        onChange={(e) => handleOtpChange(index, e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Backspace' && !digit && index > 0) {
                            document.getElementById(`otp-${index - 1}`).focus();
                          }
                        }}
                      />
                    ))}
                  </div>
                </div>

                <button 
                  type="submit" 
                  className="submit-btn"
                  disabled={loading || otp.some(d => !d)}
                >
                  {loading ? (
                    <span className="loading-spinner"></span>
                  ) : (
                    <>
                      <span>Verify & Sign In</span>
                      <span className="btn-arrow">→</span>
                    </>
                  )}
                </button>

                <div className="resend-section">
                  <p>Didn't receive OTP?</p>
                  <button type="button" className="resend-btn">Resend OTP</button>
                </div>
              </form>
            )}
          </div>

          <div className="security-badge">
            <span className="badge-icon">🔐</span>
            <span>Secured with 256-bit encryption</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
