import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { QRCodeSVG } from 'qrcode.react';
import API_BASE_URL from '../config/api';
import './PatientDashboard.css';

const PatientDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [activeSection, setActiveSection] = useState('dashboard');
  const [records, setRecords] = useState([]);
  const [stats, setStats] = useState({
    totalRecords: 0,
    verifiedRecords: 0,
    pendingRecords: 0,
    sharedRecords: 0
  });
  const [loading, setLoading] = useState(true);
  const [shareCode, setShareCode] = useState(null);
  const [shareCodeLoading, setShareCodeLoading] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [editProfileForm, setEditProfileForm] = useState({
    gender: '',
    dateOfBirth: '',
    bloodGroup: '',
    address: '',
    emergencyContact: ''
  });

  // Redirect if not logged in
  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  useEffect(() => {
    fetchPatientData();
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    if (!user || !user.userId) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/patient/user/${user.userId}/profile`);
      if (response.ok) {
        const data = await response.json();
        const profile = data.data || null;
        setProfileData(profile);
        // Populate edit form with existing data
        if (profile) {
          setEditProfileForm({
            gender: profile.gender || '',
            dateOfBirth: profile.dateOfBirth ? profile.dateOfBirth.split('T')[0] : '',
            bloodGroup: profile.bloodGroup || '',
            address: profile.address || '',
            emergencyContact: profile.emergencyContact || ''
          });
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!user || !user.userId) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/patient/user/${user.userId}/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editProfileForm)
      });
      
      if (response.ok) {
        alert('Profile updated successfully!');
        setShowEditProfile(false);
        fetchProfileData();
      } else {
        const data = await response.json();
        alert(data.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Error updating profile. Please try again.');
    }
  };

  const fetchPatientData = async () => {
    if (!user || !user.userId) return;
    
    try {
      // Fetch stats from backend API
      const statsResponse = await fetch(`${API_BASE_URL}/patient/user/${user.userId}/stats`);
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData.data || {
          totalRecords: 0,
          verifiedRecords: 0,
          pendingRecords: 0,
          sharedRecords: 0
        });
      }

      // Fetch records from backend
      const recordsResponse = await fetch(`${API_BASE_URL}/patient/user/${user.userId}/records`);
      if (recordsResponse.ok) {
        const recordsData = await recordsResponse.json();
        setRecords(recordsData.data || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleViewRecord = (record) => {
    setSelectedRecord(record);
    setShowRecordModal(true);
  };

  const handlePreviewRecord = async (record) => {
    try {
      const fileName = record.fileName || '';
      const isImage = fileName.toLowerCase().endsWith('.png') || 
                     fileName.toLowerCase().endsWith('.jpg') || 
                     fileName.toLowerCase().endsWith('.jpeg');
      
      if (isImage) {
        console.log('Attempting to preview record:', record.recordId);
        console.log('Preview URL:', `${API_BASE_URL}/records/${record.recordId}/preview`);
        
        // Fetch image as blob to handle authentication properly
        const response = await fetch(`${API_BASE_URL}/records/${record.recordId}/preview`);
        console.log('Preview response status:', response.status);
        
        if (response.ok) {
          const blob = await response.blob();
          console.log('Blob received, size:', blob.size, 'type:', blob.type);
          
          // Check if blob is valid
          if (blob.size === 0) {
            alert('The preview file is empty. Please check if the file was uploaded correctly.');
            return;
          }
          
          const objectUrl = URL.createObjectURL(blob);
          setPreviewUrl(objectUrl);
          setShowPreview(true);
        } else {
          const errorText = await response.text();
          console.error('Preview failed:', response.status, errorText);
          alert(`Failed to load preview (Status: ${response.status}). The file may not be accessible or may not exist on the server.`);
        }
      } else {
        // For non-images, show modal with details
        handleViewRecord(record);
      }
    } catch (error) {
      console.error('Error previewing record:', error);
      alert(`Error previewing record: ${error.message}. Please check your connection and try again.`);
    }
  };

  const handleSearchRecords = async () => {
    if (!searchQuery.trim()) {
      return;
    }

    setIsSearching(true);
    setSearchResults([]);

    try {
      const response = await fetch(`${API_BASE_URL}/records/search?q=${encodeURIComponent(searchQuery)}`);
      
      if (response.ok) {
        const data = await response.json();
        const results = data.data || [];
        // Filter to only show this patient's records
        const filtered = results.filter(r => 
          r.patient?.user?.userId === user.userId ||
          records.find(rec => rec.recordId === r.recordId)
        );
        setSearchResults(filtered.map(r => ({
          recordId: r.recordId,
          recordType: r.recordType,
          fileName: r.fileName,
          uploadDate: r.uploadDate,
          status: r.status?.toString() || 'PENDING',
          hospital: r.hospital?.hospitalName || 'N/A',
          description: r.description
        })));
      } else {
        // Fallback: local search
        const filtered = records.filter(record => 
          record.recordType?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          record.fileName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          record.hospital?.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setSearchResults(filtered);
      }
    } catch (error) {
      console.error('Search error:', error);
      // Fallback search
      const filtered = records.filter(record => 
        record.recordType?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        record.fileName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        record.hospital?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setSearchResults(filtered);
    } finally {
      setIsSearching(false);
    }
  };

  const handleDownloadAll = async () => {
    if (records.length === 0) {
      alert('No records to download');
      return;
    }

    try {
      for (const record of records) {
        await handleDownloadRecord(record.recordId);
        // Small delay between downloads
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      alert(`Downloaded ${records.length} record(s)`);
    } catch (error) {
      console.error('Error downloading all records:', error);
      alert('Error downloading records');
    }
  };

  const handleDownloadRecord = async (recordId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/records/${recordId}/download`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = selectedRecord.fileName || 'medical-record.pdf';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        alert('Failed to download file');
      }
    } catch (error) {
      console.error('Download error:', error);
      alert('Error downloading file');
    }
  };

  const handleGenerateShareCode = async () => {
    if (!user || !user.userId) return;
    
    setShareCodeLoading(true);
    try {
      // Get patient ID from user
      const response = await fetch(`${API_BASE_URL}/share/generate/${user.userId}`, {
        method: 'POST'
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        // data.data now contains the profile URL for QR code
        setShareCode(data.data);
      } else {
        alert('Failed to generate share code. Please try again.');
      }
    } catch (error) {
      console.error('Error generating share code:', error);
      alert('Error generating share code. Please try again.');
    } finally {
      setShareCodeLoading(false);
    }
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'records':
        return (
          <div className="section-content">
            <div className="section-header">
              <h2 className="section-title">My Records</h2>
            </div>
            <div className="records-table">
              {records.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                  <p>📭 No records yet. Hospitals will upload your medical documents here.</p>
                </div>
              ) : (
                records.map(record => (
                  <div key={record.recordId} className="record-row">
                    <div className="record-icon">{record.icon || '📄'}</div>
                    <div className="record-info">
                      <div className="record-type">{record.recordType}</div>
                      <div className="record-hospital">{record.hospital || 'Personal Upload'}</div>
                    </div>
                    <div className="record-date">{record.uploadDate}</div>
                    <div className={`record-status ${record.status}`}>
                      {record.status === 'VERIFIED' ? '✓ Verified' : '⏳ Pending'}
                    </div>
                    <button className="record-action" onClick={() => handlePreviewRecord(record)} style={{ marginRight: '8px' }}>
                      👁️ Preview
                    </button>
                    <button className="record-action" onClick={() => handleViewRecord(record)}>View</button>
                  </div>
                ))
              )}
            </div>
          </div>
        );
      
      case 'shared':
        return (
          <div className="section-content">
            <div className="section-header">
              <h2 className="section-title">Share Access</h2>
              <p className="section-subtitle">Generate a QR code to share your medical records with hospitals</p>
            </div>
            <div className="share-access-container">
              <div className="share-info-card">
                <div className="share-info-header">
                  <div className="share-icon">🔐</div>
                  <div>
                    <h3>Secure Sharing</h3>
                    <p>Each QR code is unique and expires after use for maximum privacy</p>
                  </div>
                </div>
              </div>
              
              <div className="qr-code-card">
                {shareCode ? (
                  <>
                    <div className="qr-code-wrapper">
                      <QRCodeSVG 
                        value={shareCode}
                        size={280}
                        level="H"
                        includeMargin={true}
                        fgColor="#1a1a1a"
                      />
                    </div>
                    <div className="share-code-display">
                      <label>Profile URL:</label>
                      <div className="code-text" style={{ wordBreak: 'break-all', fontSize: '0.85rem' }}>{shareCode}</div>
                      <p className="code-instructions">
                        Hospitals can scan this QR code to view your profile and upload records directly.
                        A new QR code is generated each time for security.
                      </p>
                    </div>
                    <button 
                      className="generate-new-btn"
                      onClick={handleGenerateShareCode}
                      disabled={shareCodeLoading}
                    >
                      {shareCodeLoading ? 'Generating...' : 'Generate New Code'}
                    </button>
                  </>
                ) : (
                  <div className="no-code-state">
                    <div className="qr-placeholder">📱</div>
                    <h3>Generate Share Code</h3>
                    <p>Click the button below to generate a unique QR code that hospitals can scan to access your medical records.</p>
                    <button 
                      className="generate-btn"
                      onClick={handleGenerateShareCode}
                      disabled={shareCodeLoading}
                    >
                      {shareCodeLoading ? 'Generating...' : 'Generate QR Code'}
                    </button>
                  </div>
                )}
              </div>
              
              <div className="share-safety-card">
                <h4>🛡️ Privacy & Security</h4>
                <ul>
                  <li>Each QR code is unique and changes every time you generate a new one</li>
                  <li>Codes are designed for one-time use to protect your privacy</li>
                  <li>Only authorized hospitals can access your records</li>
                  <li>You maintain full control over who accesses your medical data</li>
                </ul>
              </div>
            </div>
          </div>
        );
      
      case 'profile':
        return (
          <div className="section-content">
            <div className="section-header">
              <h2 className="section-title">Profile</h2>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button className="view-all-btn" onClick={() => setShowEditProfile(true)}>
                  ✏️ Edit Profile
                </button>
                <button className="view-all-btn" onClick={() => fetchProfileData()}>
                  🔄 Refresh
                </button>
              </div>
            </div>
            <div style={{ padding: '20px' }}>
              <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', marginBottom: '20px', border: '1px solid #e5e7eb' }}>
                <h3 style={{ marginBottom: '24px', fontSize: '20px', fontWeight: '700', color: '#1a1a1a' }}>Vital Information</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#6b7280', marginBottom: '6px', textTransform: 'uppercase' }}>
                      Name
                    </label>
                    <p style={{ margin: 0, fontSize: '16px', color: '#1a1a1a', fontWeight: '500' }}>{user?.name || 'N/A'}</p>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#6b7280', marginBottom: '6px', textTransform: 'uppercase' }}>
                      Email
                    </label>
                    <p style={{ margin: 0, fontSize: '16px', color: '#1a1a1a', fontWeight: '500' }}>{user?.email || 'N/A'}</p>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#6b7280', marginBottom: '6px', textTransform: 'uppercase' }}>
                      Access Code
                    </label>
                    <p style={{ margin: 0, fontSize: '16px', color: '#6366f1', fontWeight: '600' }}>{user?.accessCode || 'N/A'}</p>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#6b7280', marginBottom: '6px', textTransform: 'uppercase' }}>
                      Gender
                    </label>
                    <p style={{ margin: 0, fontSize: '16px', color: '#1a1a1a', fontWeight: '500' }}>{profileData?.gender || 'Not set'}</p>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#6b7280', marginBottom: '6px', textTransform: 'uppercase' }}>
                      Date of Birth
                    </label>
                    <p style={{ margin: 0, fontSize: '16px', color: '#1a1a1a', fontWeight: '500' }}>
                      {profileData?.dateOfBirth ? new Date(profileData.dateOfBirth).toLocaleDateString() : 'Not set'}
                    </p>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#6b7280', marginBottom: '6px', textTransform: 'uppercase' }}>
                      Blood Group
                    </label>
                    <p style={{ margin: 0, fontSize: '16px', color: '#1a1a1a', fontWeight: '500' }}>{profileData?.bloodGroup || 'Not set'}</p>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#6b7280', marginBottom: '6px', textTransform: 'uppercase' }}>
                      Address
                    </label>
                    <p style={{ margin: 0, fontSize: '16px', color: '#1a1a1a', fontWeight: '500' }}>{profileData?.address || 'Not set'}</p>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#6b7280', marginBottom: '6px', textTransform: 'uppercase' }}>
                      Emergency Contact
                    </label>
                    <p style={{ margin: 0, fontSize: '16px', color: '#1a1a1a', fontWeight: '500' }}>{profileData?.emergencyContact || 'Not set'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'settings':
        return (
          <div className="section-content">
            <div className="section-header">
              <h2 className="section-title">Settings</h2>
            </div>
            <div style={{ padding: '20px' }}>
              <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
                <h3 style={{ marginBottom: '15px' }}>Profile Information</h3>
                <p><strong>Name:</strong> {user?.name || 'N/A'}</p>
                <p><strong>Email:</strong> {user?.email || 'N/A'}</p>
                <p><strong>Access Code:</strong> {user?.accessCode || 'N/A'}</p>
              </div>
            </div>
          </div>
        );
      
      default: // dashboard
        return (
          <>
            {/* Stats Cards */}
            <div className="stats-grid">
              <div className="stat-card purple">
                <div className="stat-icon">📄</div>
                <div className="stat-content">
                  <div className="stat-value">{stats.totalRecords || 0}</div>
                  <div className="stat-label">Total Records</div>
                </div>
              </div>
              
              <div className="stat-card blue">
                <div className="stat-icon">✓</div>
                <div className="stat-content">
                  <div className="stat-value">{stats.verifiedRecords || 0}</div>
                  <div className="stat-label">Verified</div>
                </div>
              </div>
              
              <div className="stat-card green">
                <div className="stat-icon">⏳</div>
                <div className="stat-content">
                  <div className="stat-value">{stats.pendingRecords || 0}</div>
                  <div className="stat-label">Pending</div>
                </div>
              </div>
              
              <div className="stat-card orange">
                <div className="stat-icon">🤝</div>
                <div className="stat-content">
                  <div className="stat-value">{stats.sharedRecords || 0}</div>
                  <div className="stat-label">Shared</div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="quick-actions">
              <h2 className="section-title">Quick Actions</h2>
              <div className="actions-grid">
                <button 
                  className="action-card"
                  onClick={() => setShowSearchModal(true)}
                >
                  <div className="action-icon">🔍</div>
                  <div className="action-title">Search Records</div>
                  <div className="action-desc">Find specific documents</div>
                </button>
                
                <button 
                  className="action-card"
                  onClick={() => setActiveSection('shared')}
                >
                  <div className="action-icon">📤</div>
                  <div className="action-title">Share Access</div>
                  <div className="action-desc">Share with hospitals</div>
                </button>
                
                <button 
                  className="action-card"
                  onClick={handleDownloadAll}
                >
                  <div className="action-icon">📥</div>
                  <div className="action-title">Download All</div>
                  <div className="action-desc">Export your records</div>
                </button>
              </div>
            </div>

            {/* Recent Records */}
            <div className="recent-records">
              <div className="section-header">
                <h2 className="section-title">Recent Records</h2>
                <button className="view-all-btn" onClick={() => setActiveSection('records')}>View All →</button>
              </div>
              
              <div className="records-table">
                {records.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                    <p>📭 No records yet. Hospitals will upload your medical documents here.</p>
                  </div>
                ) : (
                  records.slice(0, 5).map(record => (
                    <div key={record.recordId} className="record-row">
                      <div className="record-icon">{record.icon || '📄'}</div>
                      <div className="record-info">
                        <div className="record-type">{record.recordType}</div>
                        <div className="record-hospital">{record.hospital || 'Personal Upload'}</div>
                      </div>
                      <div className="record-date">{record.uploadDate}</div>
                      <div className={`record-status ${record.status}`}>
                        {record.status === 'VERIFIED' ? '✓ Verified' : '⏳ Pending'}
                      </div>
                      <button className="record-action" onClick={() => handlePreviewRecord(record)} style={{ marginRight: '8px' }}>
                        👁️ Preview
                      </button>
                      <button className="record-action" onClick={() => handleViewRecord(record)}>View</button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        );
    }
  };

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <span className="logo-icon">🏥</span>
            <span className="logo-text">MedGallery</span>
          </div>
        </div>
        
        <nav className="sidebar-nav">
          <button 
            className={`nav-item ${activeSection === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveSection('dashboard')}
          >
            <span className="nav-icon">📊</span>
            <span>Dashboard</span>
          </button>
          <button 
            className={`nav-item ${activeSection === 'records' ? 'active' : ''}`}
            onClick={() => setActiveSection('records')}
          >
            <span className="nav-icon">📁</span>
            <span>My Records</span>
          </button>
          <button 
            className={`nav-item ${activeSection === 'shared' ? 'active' : ''}`}
            onClick={() => setActiveSection('shared')}
          >
            <span className="nav-icon">🤝</span>
            <span>Shared</span>
          </button>
          <button 
            className={`nav-item ${activeSection === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveSection('profile')}
          >
            <span className="nav-icon">👤</span>
            <span>Profile</span>
          </button>
          <button 
            className={`nav-item ${activeSection === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveSection('settings')}
          >
            <span className="nav-icon">⚙️</span>
            <span>Settings</span>
          </button>
        </nav>
        
        <div className="sidebar-footer">
          <button onClick={handleLogout} className="logout-btn">
            <span className="nav-icon">🚪</span>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        {/* Top Bar */}
        <header className="top-bar">
          <div className="welcome-section">
            <h1 className="welcome-title">Welcome back, {user?.name || 'Patient'}! 👋</h1>
            <p className="welcome-subtitle">Here's your health dashboard</p>
          </div>
          
          <div className="top-bar-actions">
            <button className="icon-btn">
              <span>🔔</span>
              <span className="notification-badge">0</span>
            </button>
            <div className="user-avatar">
              <span>{user?.name?.substring(0, 2).toUpperCase() || 'U'}</span>
            </div>
          </div>
        </header>

        {/* Dynamic Content Based on Active Section */}
        {renderContent()}
      </main>

      {/* Record View Modal */}
      {showRecordModal && selectedRecord && (
        <div className="modal-overlay" onClick={() => setShowRecordModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '700px' }}>
            <div className="modal-header">
              <h3>📄 Medical Record Details</h3>
              <button className="close-modal" onClick={() => setShowRecordModal(false)}>×</button>
            </div>
            
            <div style={{ padding: '20px' }}>
              <div style={{ display: 'grid', gap: '15px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', backgroundColor: '#f5f5f5', borderRadius: '6px' }}>
                  <span style={{ fontWeight: '600', color: '#666' }}>Record Type:</span>
                  <span style={{ fontWeight: '600', color: '#333' }}>{selectedRecord.recordType}</span>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', backgroundColor: '#f5f5f5', borderRadius: '6px' }}>
                  <span style={{ fontWeight: '600', color: '#666' }}>File Name:</span>
                  <span style={{ color: '#333' }}>{selectedRecord.fileName}</span>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', backgroundColor: '#f5f5f5', borderRadius: '6px' }}>
                  <span style={{ fontWeight: '600', color: '#666' }}>Upload Date:</span>
                  <span style={{ color: '#333' }}>{new Date(selectedRecord.uploadDate).toLocaleString()}</span>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', backgroundColor: '#f5f5f5', borderRadius: '6px' }}>
                  <span style={{ fontWeight: '600', color: '#666' }}>Status:</span>
                  <span style={{ 
                    color: selectedRecord.status === 'VERIFIED' ? '#22c55e' : '#f59e0b',
                    fontWeight: '600'
                  }}>
                    {selectedRecord.status === 'VERIFIED' ? '✓ Verified' : '⏳ Pending'}
                  </span>
                </div>
                
                {selectedRecord.hospitalName && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', backgroundColor: '#f5f5f5', borderRadius: '6px' }}>
                    <span style={{ fontWeight: '600', color: '#666' }}>Hospital:</span>
                    <span style={{ color: '#333' }}>{selectedRecord.hospitalName}</span>
                  </div>
                )}
                
                {selectedRecord.description && (
                  <div style={{ padding: '12px', backgroundColor: '#f5f5f5', borderRadius: '6px' }}>
                    <span style={{ fontWeight: '600', color: '#666', display: 'block', marginBottom: '8px' }}>Notes:</span>
                    <span style={{ color: '#333' }}>{selectedRecord.description}</span>
                  </div>
                )}
              </div>
              
              <div style={{ marginTop: '25px', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button 
                  className="primary-btn"
                  onClick={() => handlePreviewRecord(selectedRecord)}
                  style={{ 
                    padding: '10px 20px',
                    backgroundColor: '#8b5cf6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: '600'
                  }}
                >
                  👁️ Preview
                </button>
                <button 
                  className="primary-btn"
                  onClick={() => handleDownloadRecord(selectedRecord.recordId)}
                  style={{ 
                    padding: '10px 20px',
                    backgroundColor: '#6366f1',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: '600'
                  }}
                >
                  📥 Download File
                </button>
                <button 
                  onClick={() => setShowRecordModal(false)}
                  style={{ 
                    padding: '10px 20px',
                    backgroundColor: '#e5e7eb',
                    color: '#333',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: '600'
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreview && previewUrl && (
        <div className="modal-overlay" onClick={() => {
          if (previewUrl && previewUrl.startsWith('blob:')) {
            URL.revokeObjectURL(previewUrl);
          }
          setShowPreview(false);
          setPreviewUrl(null);
        }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '90vw', maxHeight: '90vh' }}>
            <div className="modal-header">
              <h3>📷 Preview</h3>
              <button className="close-modal" onClick={() => {
                if (previewUrl && previewUrl.startsWith('blob:')) {
                  URL.revokeObjectURL(previewUrl);
                }
                setShowPreview(false);
                setPreviewUrl(null);
              }}>×</button>
            </div>
            <div style={{ padding: '20px', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px', backgroundColor: '#f9fafb' }}>
              <img 
                src={previewUrl} 
                alt="Medical Record Preview" 
                style={{ maxWidth: '100%', maxHeight: '70vh', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
                onError={(e) => {
                  console.error('Image failed to load:', previewUrl);
                  alert('Failed to display the image. The file format may not be supported.');
                }}
              />
            </div>
            <div style={{ padding: '20px', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button 
                onClick={() => {
                  if (previewUrl && previewUrl.startsWith('blob:')) {
                    URL.revokeObjectURL(previewUrl);
                  }
                  setShowPreview(false);
                  setPreviewUrl(null);
                }}
                style={{ 
                  padding: '10px 20px',
                  backgroundColor: '#e5e7eb',
                  color: '#333',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Search Modal */}
      {showSearchModal && (
        <div className="modal-overlay" onClick={() => setShowSearchModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '800px' }}>
            <div className="modal-header">
              <h3>🔍 Search Records</h3>
              <button className="close-modal" onClick={() => setShowSearchModal(false)}>×</button>
            </div>
            <div style={{ padding: '20px' }}>
              <div style={{ marginBottom: '20px' }}>
                <input
                  type="text"
                  placeholder="Search by record type, file name, or hospital..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearchRecords()}
                  style={{
                    width: '100%',
                    padding: '12px',
                    fontSize: '16px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    marginBottom: '10px'
                  }}
                />
                <button 
                  onClick={handleSearchRecords}
                  disabled={isSearching}
                  className="primary-btn"
                  style={{ width: '100%' }}
                >
                  {isSearching ? 'Searching...' : '🔍 Search'}
                </button>
              </div>

              {searchResults.length > 0 && (
                <div className="records-table">
                  {searchResults.map(record => (
                    <div key={record.recordId} className="record-row">
                      <div className="record-icon">📄</div>
                      <div className="record-info">
                        <div className="record-type">{record.recordType}</div>
                        <div className="record-hospital">{record.hospital || 'N/A'}</div>
                      </div>
                      <div className="record-date">{new Date(record.uploadDate).toLocaleDateString()}</div>
                      <div className={`record-status ${record.status}`}>
                        {record.status === 'VERIFIED' ? '✓ Verified' : '⏳ Pending'}
                      </div>
                      <button className="record-action" onClick={() => handlePreviewRecord(record)} style={{ marginRight: '8px' }}>
                        👁️ Preview
                      </button>
                      <button className="record-action" onClick={() => handleViewRecord(record)}>View</button>
                    </div>
                  ))}
                </div>
              )}

              {searchQuery && !isSearching && searchResults.length === 0 && (
                <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                  <p>🔍 No results found for "{searchQuery}"</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      {showEditProfile && (
        <div className="modal-overlay" onClick={() => setShowEditProfile(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h3>✏️ Edit Profile Information</h3>
              <button className="close-modal" onClick={() => setShowEditProfile(false)}>×</button>
            </div>
            
            <form onSubmit={handleUpdateProfile} style={{ padding: '20px' }}>
              <div style={{ display: 'grid', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#333', marginBottom: '8px' }}>
                    Gender
                  </label>
                  <select
                    value={editProfileForm.gender}
                    onChange={(e) => setEditProfileForm({...editProfileForm, gender: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '10px',
                      fontSize: '14px',
                      border: '1px solid #e5e7eb',
                      borderRadius: '6px'
                    }}
                  >
                    <option value="">Select Gender</option>
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#333', marginBottom: '8px' }}>
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    value={editProfileForm.dateOfBirth}
                    onChange={(e) => setEditProfileForm({...editProfileForm, dateOfBirth: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '10px',
                      fontSize: '14px',
                      border: '1px solid #e5e7eb',
                      borderRadius: '6px'
                    }}
                  />
                </div>
                
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#333', marginBottom: '8px' }}>
                    Blood Group
                  </label>
                  <select
                    value={editProfileForm.bloodGroup}
                    onChange={(e) => setEditProfileForm({...editProfileForm, bloodGroup: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '10px',
                      fontSize: '14px',
                      border: '1px solid #e5e7eb',
                      borderRadius: '6px'
                    }}
                  >
                    <option value="">Select Blood Group</option>
                    <option value="A_POSITIVE">A+</option>
                    <option value="A_NEGATIVE">A-</option>
                    <option value="B_POSITIVE">B+</option>
                    <option value="B_NEGATIVE">B-</option>
                    <option value="AB_POSITIVE">AB+</option>
                    <option value="AB_NEGATIVE">AB-</option>
                    <option value="O_POSITIVE">O+</option>
                    <option value="O_NEGATIVE">O-</option>
                  </select>
                </div>
                
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#333', marginBottom: '8px' }}>
                    Address
                  </label>
                  <textarea
                    value={editProfileForm.address}
                    onChange={(e) => setEditProfileForm({...editProfileForm, address: e.target.value})}
                    rows="3"
                    placeholder="Enter your full address"
                    style={{
                      width: '100%',
                      padding: '10px',
                      fontSize: '14px',
                      border: '1px solid #e5e7eb',
                      borderRadius: '6px',
                      fontFamily: 'inherit',
                      resize: 'vertical'
                    }}
                  />
                </div>
                
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#333', marginBottom: '8px' }}>
                    Emergency Contact
                  </label>
                  <input
                    type="text"
                    value={editProfileForm.emergencyContact}
                    onChange={(e) => setEditProfileForm({...editProfileForm, emergencyContact: e.target.value})}
                    placeholder="e.g., +1 (555) 123-4567"
                    style={{
                      width: '100%',
                      padding: '10px',
                      fontSize: '14px',
                      border: '1px solid #e5e7eb',
                      borderRadius: '6px'
                    }}
                  />
                </div>
              </div>
              
              <div style={{ marginTop: '25px', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button 
                  type="button"
                  onClick={() => setShowEditProfile(false)}
                  style={{ 
                    padding: '10px 20px',
                    backgroundColor: '#e5e7eb',
                    color: '#333',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: '600'
                  }}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  style={{ 
                    padding: '10px 20px',
                    backgroundColor: '#6366f1',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: '600'
                  }}
                >
                  💾 Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default PatientDashboard;
