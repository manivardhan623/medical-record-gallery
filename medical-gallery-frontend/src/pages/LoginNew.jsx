import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';
import './Login.css';
import './GoogleButton.css';

import API_BASE_URL from '../config/api';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    userType: 'PATIENT',
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [backendStatus, setBackendStatus] = useState('checking');
  const [loginMode, setLoginMode] = useState('email'); // 'email' or 'google'

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
          throw new Error(data.message || 'Authentication failed');
        }

        // Store user data and login
        login(data.data);
        console.log('✅ Login successful!');

        // Redirect based on user type
        const userType = data.data.userType;
        if (userType === 'PATIENT') {
          navigate('/patient-dashboard');
        } else if (userType === 'HOSPITAL') {
          navigate('/hospital-dashboard');
        }
      } catch (err) {
        console.error('❌ Error in Google Sign-In:', err);
        
        // Check if it's a network error (backend not reachable)
        if (err instanceof TypeError && err.message.includes('Failed to fetch')) {
          const baseUrl = API_BASE_URL.replace('/api', '');
          setError(`Cannot connect to backend server. Please start the backend at ${baseUrl}`);
        } else if (err.message && (err.message.includes('NetworkError') || err.message.includes('fetch'))) {
          const baseUrl = API_BASE_URL.replace('/api', '');
          setError(`Network error: Backend server may not be running at ${baseUrl}`);
        } else {
          setError(err.message || 'Sign-In failed. Please try again.');
        }
      } finally {
        setLoading(false);
      }
    },
    onError: (error) => {
      console.error('❌ Google OAuth Error:', error);
      setError('Google Sign-In was cancelled or failed. Please try again.');
    },
  });

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      console.log('📧 Email Login attempt...');
      const response = await fetch(`${API_BASE_URL}/auth/email-signin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password
        })
      });

      const data = await response.json();
      console.log('📥 Backend response:', data);

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      // Store user data and login
      login(data.data);
      console.log('✅ Login successful!');

      // Redirect based on user type
      const userType = data.data.userType;
      if (userType === 'PATIENT') {
        navigate('/patient-dashboard');
      } else if (userType === 'HOSPITAL') {
        navigate('/hospital-dashboard');
      }
    } catch (err) {
      console.error('❌ Error in Email Login:', err);
      setError(err.message || 'Login failed. Please check your credentials.');
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
              Access your medical records securely with Google Sign-In. 
              Simple, fast, and secure authentication.
            </p>
            
            <div className="branding-features">
              <div className="feature-item">
                <span className="feature-icon">🔒</span>
                <span>Secure Google Auth</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">⚡</span>
                <span>Instant Access</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">🌐</span>
                <span>No Passwords</span>
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
                Choose your account type and sign in to continue
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
            {backendStatus !== 'offline' && error && (
              <div className="error-alert">❌ {error}</div>
            )}
            {backendStatus === 'checking' && (
              <div className="info-alert" style={{background: '#e3f2fd', color: '#1976d2', padding: '12px', borderRadius: '8px', marginBottom: '20px'}}>ℹ️ Checking backend connection...</div>
            )}
            {backendStatus === 'online' && !error && (
              <div className="success-alert" style={{background: '#e8f5e9', color: '#2e7d32', padding: '12px', borderRadius: '8px', marginBottom: '20px'}}>✅ Backend connected successfully</div>
            )}

            <form className="login-form" onSubmit={handleEmailLogin}>
              <div className="form-group">
                <label className="form-label">I am a</label>
                <div className="user-type-selector">
                  <button
                    type="button"
                    className={`user-type-btn ${formData.userType === 'PATIENT' ? 'active' : ''}`}
                    onClick={() => setFormData({ ...formData, userType: 'PATIENT' })}
                    disabled={loading}
                  >
                    <span className="user-type-icon">👤</span>
                    <span>Patient</span>
                  </button>
                  <button
                    type="button"
                    className={`user-type-btn ${formData.userType === 'HOSPITAL' ? 'active' : ''}`}
                    onClick={() => setFormData({ ...formData, userType: 'HOSPITAL' })}
                    disabled={loading}
                  >
                    <span className="user-type-icon">🏥</span>
                    <span>Hospital</span>
                  </button>
                </div>
              </div>

              {loginMode === 'email' && (
                <>
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
                      placeholder="Enter your password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
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
                    {loading ? 'Signing in...' : 'Sign in with Email'}
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
                  if (loginMode === 'email') {
                    googleLogin();
                  } else {
                    setLoginMode('email');
                  }
                }}
                disabled={loading}
                type="button"
              >
                {!loading && loginMode === 'email' ? (
                  <>
                    <svg className="google-icon" viewBox="0 0 24 24" width="18" height="18">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    <span>Sign in with Google</span>
                  </>
                ) : loading ? (
                  <span>Signing in...</span>
                ) : null}
              </button>

              <div className="form-footer">
                <p>Don't have an account? <Link to="/register" className="link">Sign up</Link></p>
              </div>
            </form>
          </div>

          <div className="security-badge">
            <span className="badge-icon">🔐</span>
            <span>Secured with Google Authentication</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
