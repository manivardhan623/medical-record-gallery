import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Register.css';

import API_BASE_URL from '../config/api';

const Register = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    userType: 'PATIENT',
    name: '',
    phone: '',
    email: '',
    hospitalName: '',
    address: ''
  });
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

  const handleNext = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const endpoint = formData.userType === 'PATIENT' 
        ? '/auth/register-patient' 
        : '/auth/register-hospital';

      const payload = formData.userType === 'PATIENT'
        ? { name: formData.name, phoneNumber: formData.phone, email: formData.email }
        : { hospitalName: formData.hospitalName, phoneNumber: formData.phone, email: formData.email };

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      alert('✅ Registration successful! OTP sent to your phone.');
      setStep(3); // Jump to OTP verification
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
        document.getElementById(`reg-otp-${index + 1}`).focus();
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const otpCode = otp.join('');

      const response = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contact: formData.phone,
          otpCode: otpCode
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Invalid OTP');
      }

      // Store user data and login
      login(data.data);
      
      alert('✅ Account verified successfully!');
      
      // Redirect based on user type
      if (formData.userType === 'PATIENT') {
        navigate('/patient-dashboard');
      } else {
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
    <div className="register-container">
      <div className="register-background">
        <div className="bg-shape shape-1"></div>
        <div className="bg-shape shape-2"></div>
        <div className="bg-shape shape-3"></div>
      </div>

      <div className="register-content">
        <div className="register-card">
          <Link to="/" className="back-button-register">
            <span>←</span>
            <span>Back to Home</span>
          </Link>

          <div className="register-header">
            <h2 className="register-title">Create Account</h2>
            <p className="register-subtitle">
              Join thousands of users managing their health records
            </p>
            
            <div className="progress-steps">
              <div className={`progress-step ${step >= 1 ? 'active' : ''}`}>
                <div className="step-circle">1</div>
                <div className="step-label">Account Type</div>
              </div>
              <div className={`progress-line ${step >= 2 ? 'active' : ''}`}></div>
              <div className={`progress-step ${step >= 2 ? 'active' : ''}`}>
                <div className="step-circle">2</div>
                <div className="step-label">Details</div>
              </div>
              <div className={`progress-line ${step >= 3 ? 'active' : ''}`}></div>
              <div className={`progress-step ${step >= 3 ? 'active' : ''}`}>
                <div className="step-circle">3</div>
                <div className="step-label">Verify</div>
              </div>
            </div>
          </div>

          {error && <div className="error-alert">❌ {error}</div>}

          {/* Step 1: User Type */}
          {step === 1 && (
            <form onSubmit={handleNext} className="register-form">
              <div className="form-group">
                <label className="form-label">I want to register as</label>
                <div className="user-type-cards">
                  <div 
                    className={`type-card ${formData.userType === 'PATIENT' ? 'selected' : ''}`}
                    onClick={() => setFormData({ ...formData, userType: 'PATIENT' })}
                  >
                    <div className="type-icon">👤</div>
                    <h3>Patient</h3>
                    <p>Store and manage your medical records</p>
                  </div>
                  
                  <div 
                    className={`type-card ${formData.userType === 'HOSPITAL' ? 'selected' : ''}`}
                    onClick={() => setFormData({ ...formData, userType: 'HOSPITAL' })}
                  >
                    <div className="type-icon">🏥</div>
                    <h3>Hospital</h3>
                    <p>Upload patient records securely</p>
                  </div>
                </div>
              </div>

              <button type="submit" className="submit-btn">
                <span>Continue</span>
                <span className="btn-arrow">→</span>
              </button>

              <div className="form-footer">
                <p>Already have an account? <Link to="/login" className="link">Sign in</Link></p>
              </div>
            </form>
          )}

          {/* Step 2: Details */}
          {step === 2 && (
            <form onSubmit={handleNext} className="register-form">
              {formData.userType === 'PATIENT' ? (
                <>
                  <div className="form-group">
                    <label className="form-label">Full Name</label>
                    <input
                      type="text"
                      name="name"
                      className="form-input"
                      placeholder="Enter your full name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Phone Number</label>
                    <input
                      type="tel"
                      name="phone"
                      className="form-input"
                      placeholder="+91 XXXXX XXXXX"
                      value={formData.phone}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Email (Optional)</label>
                    <input
                      type="email"
                      name="email"
                      className="form-input"
                      placeholder="your@email.com"
                      value={formData.email}
                      onChange={handleChange}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="form-group">
                    <label className="form-label">Hospital Name</label>
                    <input
                      type="text"
                      name="hospitalName"
                      className="form-input"
                      placeholder="Enter hospital name"
                      value={formData.hospitalName}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Contact Number</label>
                    <input
                      type="tel"
                      name="phone"
                      className="form-input"
                      placeholder="+91 XXXXX XXXXX"
                      value={formData.phone}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <input
                      type="email"
                      name="email"
                      className="form-input"
                      placeholder="hospital@email.com"
                      value={formData.email}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Address</label>
                    <textarea
                      name="address"
                      className="form-textarea"
                      placeholder="Enter hospital address"
                      value={formData.address}
                      onChange={handleChange}
                      rows="3"
                      required
                    />
                  </div>
                </>
              )}

              <div className="button-group">
                <button 
                  type="button" 
                  className="back-btn"
                  onClick={() => setStep(step - 1)}
                >
                  ← Back
                </button>
                <button type="submit" className="submit-btn" disabled={loading}>
                  {loading ? <span className="loading-spinner"></span> : (
                    <>
                      <span>Send OTP</span>
                      <span className="btn-arrow">→</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Step 3: OTP Verification */}
          {step === 3 && (
            <form onSubmit={handleSubmit} className="register-form">
              <div className="otp-info">
                <div className="otp-icon">📬</div>
                <p className="otp-message">
                  Enter the 6-digit OTP sent to<br/>
                  <strong>{formData.phone}</strong>
                </p>
              </div>

              <div className="form-group">
                <label className="form-label">Enter OTP</label>
                <div className="otp-inputs">
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      id={`reg-otp-${index}`}
                      type="text"
                      maxLength="1"
                      className="otp-input"
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Backspace' && !digit && index > 0) {
                          document.getElementById(`reg-otp-${index - 1}`).focus();
                        }
                      }}
                    />
                  ))}
                </div>
              </div>

              <div className="button-group">
                <button 
                  type="button" 
                  className="back-btn"
                  onClick={() => setStep(step - 1)}
                >
                  ← Back
                </button>
                <button 
                  type="submit" 
                  className="submit-btn"
                  disabled={loading || otp.some(d => !d)}
                >
                  {loading ? <span className="loading-spinner"></span> : (
                    <>
                      <span>Create Account</span>
                      <span>✓</span>
                    </>
                  )}
                </button>
              </div>

              <div className="resend-section">
                <p>Didn't receive OTP?</p>
                <button type="button" className="resend-btn">Resend OTP</button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Register;
