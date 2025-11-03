import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';
import './Register.css';
import './GoogleButton.css';

import API_BASE_URL from '../config/api';

const Register = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    userType: 'PATIENT',
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [backendStatus, setBackendStatus] = useState('checking');
  const [registerMode, setRegisterMode] = useState('email'); // 'email' or 'google'

  // Check backend health on component mount
  useEffect(() => {
    const checkBackendHealth = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/auth/health`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
        });
        
        if (response.ok) {
          setBackendStatus('online');
          console.log('✅ Backend is online and healthy');
        } else {
          setBackendStatus('error');
          setError('Backend server returned an error. Please check the server.');
        }
      } catch (err) {
        console.error('❌ Backend health check failed:', err);
        console.error('🔧 Attempted URL:', `${API_BASE_URL}/auth/health`);
        setBackendStatus('offline');
        // Build error message with correct URL
        const baseUrl = API_BASE_URL.replace('/api', '');
        setError(`Backend server is not running. Please start the backend server at ${baseUrl} and ensure it's accessible.`);
      }
    };

    checkBackendHealth();
  }, []);

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setLoading(true);
      setError('');
      
      try {
        console.log('✅ Google OAuth successful, getting user info...');
        
        // Get user info from Google
        const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: {
            Authorization: `Bearer ${tokenResponse.access_token}`,
          },
        });
        
        const userInfo = await userInfoResponse.json();
        console.log('✅ User info received:', userInfo);
        
        // Send to backend
        console.log('📤 Sending to backend...');
        const response = await fetch(`${API_BASE_URL}/auth/google-signin`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            idToken: tokenResponse.access_token,
            userType: formData.userType,
            email: userInfo.email,
            name: userInfo.name,
            googleId: userInfo.sub
          })
        });

        const data = await response.json();
        console.log('📥 Backend response:', data);
        
        if (!response.ok) {
          throw new Error(data.message || 'Google Sign-In failed');
        }

        // Store user data and login
        login(data.data);
        console.log('✅ Registration successful!');
        
        alert('✅ Account created successfully!');
        
        // Redirect based on user type
        if (formData.userType === 'PATIENT') {
          navigate('/patient-dashboard');
        } else {
          navigate('/hospital-dashboard');
        }
      } catch (err) {
        console.error('❌ Error in Google Sign-Up:', err);
        
        // Check if it's a network error (backend not reachable)
        if (err instanceof TypeError && err.message.includes('Failed to fetch')) {
          const baseUrl = API_BASE_URL.replace('/api', '');
          setError(`Cannot connect to backend server. Please start the backend at ${baseUrl}`);
        } else if (err.message && (err.message.includes('NetworkError') || err.message.includes('fetch'))) {
          const baseUrl = API_BASE_URL.replace('/api', '');
          setError(`Network error: Backend server may not be running at ${baseUrl}`);
        } else {
          setError(err.message || 'Sign-Up failed. Please try again.');
        }
      } finally {
        setLoading(false);
      }
    },
    onError: (error) => {
      console.error('❌ Google OAuth Error:', error);
      setError('Google Sign-Up was cancelled or failed. Please try again.');
    },
  });

  const handleEmailRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    // Validate password length
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    try {
      console.log('📧 Email Registration attempt...');
      const response = await fetch(`${API_BASE_URL}/auth/email-signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          userType: formData.userType
        })
      });

      const data = await response.json();
      console.log('📥 Backend response:', data);

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      // Store user data and login
      login(data.data);
      console.log('✅ Registration successful!');
      alert('✅ Account created successfully!');

      // Redirect based on user type
      if (formData.userType === 'PATIENT') {
        navigate('/patient-dashboard');
      } else {
        navigate('/hospital-dashboard');
      }
    } catch (err) {
      console.error('❌ Error in Email Registration:', err);
      setError(err.message || 'Registration failed. Please try again.');
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
              Sign up to manage your health records securely
            </p>
          </div>

          {backendStatus === 'offline' && error && (
            <div className="error-alert" style={{
              background: '#fee2e2',
              border: '1px solid #fecaca',
              color: '#991b1b',
              padding: '14px 18px',
              borderRadius: '10px',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontSize: '0.95rem'
            }}>
              <span style={{fontSize: '1.2rem'}}>⚠️</span>
              <span>{error}</span>
            </div>
          )}
          {backendStatus === 'checking' && (
            <div className="info-alert" style={{background: '#e3f2fd', color: '#1976d2', padding: '12px', borderRadius: '8px', marginBottom: '20px'}}>
              ℹ️ Checking backend connection...
            </div>
          )}
          {backendStatus === 'online' && !error && (
            <div className="success-alert" style={{background: '#e8f5e9', color: '#2e7d32', padding: '12px', borderRadius: '8px', marginBottom: '20px'}}>
              ✅ Backend connected successfully
            </div>
          )}

          <form className="register-form" onSubmit={handleEmailRegister}>
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

            {registerMode === 'email' && (
              <>
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Enter your full name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    disabled={loading}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '2px solid #e5e7eb',
                      borderRadius: '10px',
                      fontSize: '1rem',
                      outline: 'none',
                      transition: 'all 0.3s ease'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#6366f1'}
                    onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    disabled={loading}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '2px solid #e5e7eb',
                      borderRadius: '10px',
                      fontSize: '1rem',
                      outline: 'none',
                      transition: 'all 0.3s ease'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#6366f1'}
                    onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Password</label>
                  <input
                    type="password"
                    className="form-input"
                    placeholder="Create a password (min 6 characters)"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    disabled={loading}
                    minLength={6}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '2px solid #e5e7eb',
                      borderRadius: '10px',
                      fontSize: '1rem',
                      outline: 'none',
                      transition: 'all 0.3s ease'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#6366f1'}
                    onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Confirm Password</label>
                  <input
                    type="password"
                    className="form-input"
                    placeholder="Re-enter your password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    required
                    disabled={loading}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '2px solid #e5e7eb',
                      borderRadius: '10px',
                      fontSize: '1rem',
                      outline: 'none',
                      transition: 'all 0.3s ease'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#6366f1'}
                    onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                  />
                </div>

                <button 
                  type="submit"
                  className="google-signin-button"
                  disabled={loading}
                  style={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    marginBottom: '15px'
                  }}
                >
                  {loading ? 'Creating account...' : 'Sign up with Email'}
                </button>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  margin: '20px 0',
                  color: '#9ca3af'
                }}>
                  <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }}></div>
                  <span>OR</span>
                  <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }}></div>
                </div>
              </>
            )}

            <button 
              className="google-signin-button"
              onClick={() => {
                if (registerMode === 'email') {
                  googleLogin();
                } else {
                  setRegisterMode('email');
                }
              }}
              disabled={loading}
              type="button"
            >
              {!loading && registerMode === 'email' ? (
                <>
                  <svg className="google-icon" viewBox="0 0 24 24" width="18" height="18">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  <span>Sign up with Google</span>
                </>
              ) : loading ? (
                <span>Creating account...</span>
              ) : null}
            </button>

            <div className="form-footer">
              <p>Already have an account? <Link to="/login" className="link">Sign in</Link></p>
            </div>
          </form>
        </div>

        <div className="security-badge">
          <span className="badge-icon">🔐</span>
          <span>Secured with Google Authentication</span>
        </div>
      </div>
    </div>
  );
};

export default Register;
