import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API_BASE_URL from '../config/api';
import './HospitalDashboard.css';

const HospitalDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [activeSection, setActiveSection] = useState('dashboard');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showAddPatientModal, setShowAddPatientModal] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  
  const [stats, setStats] = useState({
    totalUploads: 0,
    activePatients: 0,
    pendingReviews: 0,
    todayUploads: 0
  });
  const [uploadForm, setUploadForm] = useState({
    patientAccessCode: '',
    recordType: 'LAB_REPORT',
    notes: '',
    file: null
  });
  const [addPatientForm, setAddPatientForm] = useState({
    accessCode: '',
    name: '',
    email: ''
  });
  const [uploading, setUploading] = useState(false);
  const [addingPatient, setAddingPatient] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [allRecords, setAllRecords] = useState([]);
  const [allPatients, setAllPatients] = useState([]);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showPatientRecordsModal, setShowPatientRecordsModal] = useState(false);
  const [patientRecords, setPatientRecords] = useState([]);
  const [loadingPatientRecords, setLoadingPatientRecords] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);

  // Redirect if not logged in or not hospital
  useEffect(() => {
    if (!user) {
      navigate('/login');
    } else if (user.userType !== 'HOSPITAL') {
      navigate('/patient-dashboard');
    }
  }, [user, navigate]);

  const fetchHospitalStats = async () => {
    if (!user || !user.userId) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/hospital/${user.userId}/stats`);
      if (response.ok) {
        const data = await response.json();
        setStats(data.data || stats);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchAllRecords = async () => {
    if (!user || !user.userId) return;
    
    try {
      // Fetch records uploaded by this hospital
      const response = await fetch(`${API_BASE_URL}/hospital/${user.userId}/records`);
      if (response.ok) {
        const data = await response.json();
        setAllRecords(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching records:', error);
    }
  };

  const fetchAllPatients = async () => {
    if (!user || !user.userId) return;
    
    try {
      // Fetch patients (simplified - you may need to create an endpoint)
      const response = await fetch(`${API_BASE_URL}/hospital/${user.userId}/patients`);
      if (response.ok) {
        const data = await response.json();
        setAllPatients(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching patients:', error);
    }
  };

  useEffect(() => {
    fetchHospitalStats();
    fetchAllRecords();
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setUploadForm({ ...uploadForm, file });
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    setUploading(true);
    setMessage({ type: '', text: '' });

    try {
      const formData = new FormData();
      formData.append('file', uploadForm.file);
      formData.append('patientAccessCode', uploadForm.patientAccessCode);
      formData.append('recordType', uploadForm.recordType);
      formData.append('notes', uploadForm.notes);
      formData.append('hospitalId', user.userId);

      if (!uploadForm.file) {
        setMessage({ type: 'error', text: 'Please select a file to upload' });
        setUploading(false);
        return;
      }

      if (!uploadForm.patientAccessCode || !uploadForm.patientAccessCode.trim()) {
        setMessage({ type: 'error', text: 'Please enter a valid patient access code' });
        setUploading(false);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/records/upload`, {
        method: 'POST',
        body: formData
      });

      let data;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        try {
          data = JSON.parse(text);
        } catch {
          throw new Error(text || 'Upload failed');
        }
      }
      
      if (response.ok && data.success) {
        setMessage({ type: 'success', text: '✅ Medical record uploaded successfully!' });
        setUploadForm({
          patientAccessCode: '',
          recordType: 'LAB_REPORT',
          notes: '',
          file: null
        });
        // Reset file input
        const fileInput = document.getElementById('file-upload');
        if (fileInput) fileInput.value = '';
        fetchHospitalStats();
        setTimeout(() => setShowUploadModal(false), 2000);
      } else {
        setMessage({ type: 'error', text: data.message || 'Upload failed. Please check the patient access code and try again.' });
      }
    } catch (error) {
      console.error('Upload error:', error);
      setMessage({ type: 'error', text: `Error uploading record: ${error.message || 'Please check your connection and try again.'}` });
    } finally {
      setUploading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleAddPatient = async (e) => {
    e.preventDefault();
    setAddingPatient(true);
    setMessage({ type: '', text: '' });

    try {
      // Lookup patient by access code
      const response = await fetch(`${API_BASE_URL}/auth/user/${addPatientForm.accessCode}`);
      const data = await response.json();
      
      if (response.ok && data.data) {
        setMessage({ type: 'success', text: `✅ Patient found: ${data.data.name} (${data.data.email})` });
        setAllPatients(prev => {
          const exists = prev.find(p => p.userId === data.data.userId);
          if (!exists) {
            return [...prev, data.data];
          }
          return prev;
        });
        setAddPatientForm({ accessCode: '', name: '', email: '' });
        setTimeout(() => {
          setShowAddPatientModal(false);
          setMessage({ type: '', text: '' });
        }, 2000);
      } else {
        setMessage({ type: 'error', text: 'Patient not found. Please verify the access code.' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error looking up patient. Please try again.' });
    } finally {
      setAddingPatient(false);
    }
  };

  const handleSearchRecords = async () => {
    if (!searchQuery.trim()) {
      setMessage({ type: 'error', text: 'Please enter a search query' });
      return;
    }

    setIsSearching(true);
    setSearchResults([]);

    try {
      // Search through all records using backend endpoint
      const recordsResponse = await fetch(`${API_BASE_URL}/records/search?q=${encodeURIComponent(searchQuery)}&hospitalId=${user.userId}`);
      
      if (recordsResponse.ok) {
        const data = await recordsResponse.json();
        const results = data.data || [];
        // Convert to DTO format if needed
        const formattedResults = results.map(r => ({
          recordId: r.recordId,
          recordType: r.recordType,
          fileName: r.fileName,
          uploadDate: r.uploadDate,
          status: r.status?.toString() || 'PENDING',
          patientAccessCode: r.patient?.user?.accessCode || 'N/A',
          description: r.description
        }));
        setSearchResults(formattedResults);
      } else {
        // Fallback: search through local records
        const filtered = allRecords.filter(record => 
          record.recordType?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          record.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          record.patientAccessCode?.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setSearchResults(filtered);
      }
    } catch (error) {
      console.error('Search error:', error);
      // Fallback search
      const filtered = allRecords.filter(record => 
        record.recordType?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        record.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        record.patientAccessCode?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setSearchResults(filtered);
    } finally {
      setIsSearching(false);
    }
  };

  const handleViewRecord = (record) => {
    setSelectedRecord(record);
    setShowRecordModal(true);
  };

  const handleViewPatientRecords = async (patient) => {
    setSelectedPatient(patient);
    setShowPatientRecordsModal(true);
    setLoadingPatientRecords(true);
    setPatientRecords([]);
    
    // Fetch patient records
    try {
      const response = await fetch(`${API_BASE_URL}/patient/user/${patient.userId}/records`);
      if (response.ok) {
        const data = await response.json();
        setPatientRecords(data.data || []);
      } else {
        alert('Failed to fetch patient records');
      }
    } catch (error) {
      console.error('Error fetching patient records:', error);
      alert('Error fetching patient records');
    } finally {
      setLoadingPatientRecords(false);
    }
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

  useEffect(() => {
    if (activeSection === 'records' || activeSection === 'patients') {
      fetchAllRecords();
      fetchAllPatients();
    }
  }, [activeSection, user]);

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showProfileDropdown && !event.target.closest('.profile-dropdown-trigger') && !event.target.closest('.profile-dropdown')) {
        setShowProfileDropdown(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showProfileDropdown]);

  const renderContent = () => {
    switch (activeSection) {
      case 'records':
  return (
          <div className="section-content">
            <div className="section-header">
              <h2 className="section-title">All Records</h2>
              <button className="view-all-btn" onClick={() => setShowSearchModal(true)}>
                🔍 Search Records
              </button>
            </div>
            <div className="records-table">
              {allRecords.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                  <p>📭 No records uploaded yet.</p>
                </div>
              ) : (
                allRecords.map(record => (
                  <div key={record.recordId} className="record-row">
                    <div className="record-icon">📄</div>
                    <div className="record-info">
                      <div className="record-type">{record.recordType}</div>
                      <div className="record-hospital">Patient Code: {record.patientAccessCode || 'N/A'}</div>
                    </div>
                    <div className="record-date">{new Date(record.uploadDate).toLocaleDateString()}</div>
                    <div className={`record-status ${record.status}`}>
                      {record.status === 'VERIFIED' ? '✓ Verified' : '⏳ Pending'}
                    </div>
                    <button className="record-action" onClick={() => handleViewRecord(record)}>View</button>
                  </div>
                ))
              )}
            </div>
          </div>
        );

      case 'patients':
        return (
          <div className="section-content">
            <div className="section-header">
              <h2 className="section-title">Patients</h2>
              <button className="view-all-btn" onClick={() => setShowAddPatientModal(true)}>
                + Add Patient
          </button>
            </div>
            <div className="records-table">
              {allPatients.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                  <p>👥 No patients found. Add a patient using their access code.</p>
          <button 
                    className="primary-btn"
                    onClick={() => setShowAddPatientModal(true)}
                    style={{ marginTop: '20px' }}
                  >
                    Add Patient
          </button>
        </div>
              ) : (
                allPatients.map(patient => (
                  <div key={patient.userId} className="record-row">
                    <div className="record-icon">👤</div>
                    <div className="record-info">
                      <div className="record-type">{patient.name}</div>
                      <div className="record-hospital">{patient.email}</div>
                    </div>
                    <div className="record-date">Access Code: {patient.accessCode}</div>
                    <div className="record-status verified">
                      ✓ Active
                    </div>
                    <button className="record-action" onClick={() => handleViewPatientRecords(patient)}>View Records</button>
                  </div>
                ))
              )}
            </div>
          </div>
        );

      case 'reports':
        return (
          <div className="section-content">
            <div className="section-header">
              <h2 className="section-title">Reports & Analytics</h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px', padding: '20px' }}>
              <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px' }}>
                <h3 style={{ marginBottom: '15px' }}>Upload Statistics</h3>
                <p><strong>Total Uploads:</strong> {stats.totalUploads}</p>
                <p><strong>Today's Uploads:</strong> {stats.todayUploads}</p>
                <p><strong>Pending Reviews:</strong> {stats.pendingReviews}</p>
              </div>
              <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px' }}>
                <h3 style={{ marginBottom: '15px' }}>Patient Statistics</h3>
                <p><strong>Active Patients:</strong> {stats.activePatients}</p>
                <p><strong>Total Records:</strong> {allRecords.length}</p>
              </div>
              <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', gridColumn: '1 / -1' }}>
                <h3 style={{ marginBottom: '15px' }}>Record Types Distribution</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                  {['LAB_REPORT', 'X_RAY', 'CT_SCAN', 'MRI', 'PRESCRIPTION', 'DISCHARGE_SUMMARY'].map(type => {
                    const count = allRecords.filter(r => r.recordType === type).length;
                    return (
                      <div key={type} style={{ padding: '10px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
                        <strong>{type.replace('_', ' ')}:</strong> {count}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        );

      case 'settings':
        return (
          <div className="section-content">
            <div className="section-header">
              <h2 className="section-title">Settings & Profile</h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', padding: '20px' }}>
              <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px', paddingBottom: '20px', borderBottom: '1px solid #e5e7eb' }}>
                  <div style={{ 
                    width: '64px', 
                    height: '64px', 
                    borderRadius: '12px', 
                    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '24px',
                    fontWeight: '600'
                  }}>
                    {user?.name?.substring(0, 2).toUpperCase() || 'H'}
                  </div>
                  <div>
                    <h3 style={{ margin: 0, marginBottom: '4px', fontSize: '18px', fontWeight: '700', color: '#1a1a1a' }}>
                      {user?.name || 'Hospital'}
                    </h3>
                    <p style={{ margin: 0, fontSize: '14px', color: '#6b7280' }}>Hospital Account</p>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#6b7280', marginBottom: '6px', textTransform: 'uppercase' }}>
                      Hospital Name
                    </label>
                    <p style={{ margin: 0, fontSize: '16px', color: '#1a1a1a', fontWeight: '500' }}>{user?.name || 'N/A'}</p>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#6b7280', marginBottom: '6px', textTransform: 'uppercase' }}>
                      Email Address
                    </label>
                    <p style={{ margin: 0, fontSize: '16px', color: '#1a1a1a', fontWeight: '500' }}>{user?.email || 'N/A'}</p>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#6b7280', marginBottom: '6px', textTransform: 'uppercase' }}>
                      Hospital ID
                    </label>
                    <p style={{ margin: 0, fontSize: '16px', color: '#1a1a1a', fontWeight: '500' }}>#{user?.userId || 'N/A'}</p>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#6b7280', marginBottom: '6px', textTransform: 'uppercase' }}>
                      Access Code
                    </label>
                    <p style={{ margin: 0, fontSize: '16px', color: '#6366f1', fontWeight: '600' }}>{user?.accessCode || 'N/A'}</p>
                  </div>
                </div>
              </div>
              
              <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
                <h3 style={{ marginTop: 0, marginBottom: '20px', fontSize: '18px', fontWeight: '700', color: '#1a1a1a' }}>Statistics</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
                    <span style={{ fontSize: '14px', color: '#6b7280' }}>Total Uploads</span>
                    <span style={{ fontSize: '18px', fontWeight: '700', color: '#6366f1' }}>{stats.totalUploads || 0}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
                    <span style={{ fontSize: '14px', color: '#6b7280' }}>Active Patients</span>
                    <span style={{ fontSize: '18px', fontWeight: '700', color: '#6366f1' }}>{stats.activePatients || 0}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
                    <span style={{ fontSize: '14px', color: '#6b7280' }}>Pending Reviews</span>
                    <span style={{ fontSize: '18px', fontWeight: '700', color: '#f59e0b' }}>{stats.pendingReviews || 0}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      default: // dashboard
        return (
          <>
        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card green">
            <div className="stat-icon">📤</div>
            <div className="stat-content">
              <div className="stat-value">{stats.totalUploads || 0}</div>
              <div className="stat-label">Total Uploads</div>
            </div>
          </div>
          
          <div className="stat-card blue">
            <div className="stat-icon">👥</div>
            <div className="stat-content">
              <div className="stat-value">{stats.activePatients || 0}</div>
              <div className="stat-label">Active Patients</div>
            </div>
          </div>
          
          <div className="stat-card orange">
            <div className="stat-icon">⏳</div>
            <div className="stat-content">
              <div className="stat-value">{stats.pendingReviews || 0}</div>
              <div className="stat-label">Pending</div>
            </div>
          </div>
          
          <div className="stat-card purple">
            <div className="stat-icon">📅</div>
            <div className="stat-content">
              <div className="stat-value">{stats.todayUploads || 0}</div>
              <div className="stat-label">Today</div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="quick-actions">
          <h2 className="section-title">Quick Actions</h2>
          <div className="actions-grid">
            <button 
              className="action-card"
              onClick={() => setShowUploadModal(true)}
            >
              <div className="action-icon">⬆️</div>
              <div className="action-title">Upload Record</div>
              <div className="action-desc">Add patient medical document</div>
            </button>
            
                <button 
                  className="action-card"
                  onClick={() => setShowAddPatientModal(true)}
                >
              <div className="action-icon">👤</div>
              <div className="action-title">Add Patient</div>
              <div className="action-desc">Register new patient</div>
            </button>
            
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
                  onClick={() => setActiveSection('reports')}
                >
              <div className="action-icon">📊</div>
              <div className="action-title">View Reports</div>
              <div className="action-desc">Analytics and insights</div>
            </button>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="recent-activity">
          <div className="section-header">
            <h2 className="section-title">Recent Uploads</h2>
                <button className="view-all-btn" onClick={() => setActiveSection('records')}>View All →</button>
          </div>
          
          <div className="activity-list">
                {allRecords.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📋</div>
              <p>No recent uploads</p>
              <p className="empty-subtitle">Upload your first medical record to get started</p>
              <button 
                className="primary-btn"
                onClick={() => setShowUploadModal(true)}
              >
                Upload Now
              </button>
            </div>
                ) : (
                  allRecords.slice(0, 5).map(record => (
                    <div key={record.recordId} className="activity-item">
                      <div className="activity-icon">📄</div>
                      <div className="activity-info">
                        <div className="activity-title">{record.recordType}</div>
                        <div className="activity-subtitle">Patient: {record.patientAccessCode}</div>
                      </div>
                      <div className="activity-date">{new Date(record.uploadDate).toLocaleDateString()}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        );
    }
  };

  if (!user) return null;

  return (
    <div className="hospital-dashboard">
      {/* Sidebar */}
      <aside className="sidebar hospital-sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <span className="logo-icon">🏥</span>
            <span className="logo-text">Hospital Panel</span>
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
            className={`nav-item ${showUploadModal ? 'active' : ''}`}
            onClick={() => setShowUploadModal(true)}
          >
            <span className="nav-icon">⬆️</span>
            <span>Upload Records</span>
          </button>
          <button 
            className={`nav-item ${activeSection === 'patients' ? 'active' : ''}`}
            onClick={() => setActiveSection('patients')}
          >
            <span className="nav-icon">👥</span>
            <span>Patients</span>
          </button>
          <button 
            className={`nav-item ${activeSection === 'records' ? 'active' : ''}`}
            onClick={() => setActiveSection('records')}
          >
            <span className="nav-icon">📁</span>
            <span>All Records</span>
          </button>
          <button 
            className={`nav-item ${activeSection === 'reports' ? 'active' : ''}`}
            onClick={() => setActiveSection('reports')}
          >
            <span className="nav-icon">📊</span>
            <span>Reports</span>
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
            <h1 className="welcome-title">Hospital Management Dashboard 🏥</h1>
            <p className="welcome-subtitle">Manage patient records and uploads</p>
          </div>
          
          <div className="search-container">
            <div className="search-bar-wrapper">
              <svg className="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"></circle>
                <path d="m21 21-4.35-4.35"></path>
              </svg>
              <input
                type="text"
                className="search-input"
                placeholder="Search records, patients, or access codes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearchRecords()}
              />
              {searchQuery && (
                <button 
                  className="search-clear-btn"
                  onClick={() => {
                    setSearchQuery('');
                    setSearchResults([]);
                  }}
                >
                  ×
                </button>
              )}
            </div>
          </div>
          
          <div className="top-bar-actions">
            <button 
              className="icon-btn" 
              onClick={() => setShowSearchModal(true)}
              title="Advanced Search"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"></circle>
                <path d="m21 21-4.35-4.35"></path>
              </svg>
            </button>
            <button className="icon-btn" title="Notifications">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"></path>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
              </svg>
              <span className="notification-badge">0</span>
            </button>
            <div 
              className="user-avatar hospital-avatar profile-dropdown-trigger"
              onClick={() => setShowProfileDropdown(!showProfileDropdown)}
              style={{ cursor: 'pointer', position: 'relative' }}
            >
              <span>{user?.name?.substring(0, 2).toUpperCase() || 'H'}</span>
              {showProfileDropdown && (
                <div className="profile-dropdown">
                  <div className="profile-dropdown-header">
                    <div className="profile-dropdown-avatar">
                      <span>{user?.name?.substring(0, 2).toUpperCase() || 'H'}</span>
                    </div>
                    <div className="profile-dropdown-info">
                      <div className="profile-dropdown-name">{user?.name || 'Hospital'}</div>
                      <div className="profile-dropdown-email">{user?.email || 'N/A'}</div>
                    </div>
                  </div>
                  <div className="profile-dropdown-divider"></div>
                  <button 
                    className="profile-dropdown-item"
                    onClick={() => {
                      setActiveSection('settings');
                      setShowProfileDropdown(false);
                    }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="3"></circle>
                      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                    </svg>
                    Settings
                  </button>
                  <button 
                    className="profile-dropdown-item"
                    onClick={handleLogout}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                      <polyline points="16 17 21 12 16 7"></polyline>
                      <line x1="21" y1="12" x2="9" y2="12"></line>
                    </svg>
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Dynamic Content Based on Active Section */}
        {renderContent()}
      </main>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="modal-overlay" onClick={() => setShowUploadModal(false)}>
          <div className="modal-content upload-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Upload Medical Record</h3>
              <button 
                className="close-modal"
                onClick={() => setShowUploadModal(false)}
              >
                ×
              </button>
            </div>
            
            {message.text && (
              <div className={`message-banner ${message.type}`}>
                {message.text}
              </div>
            )}

            <form onSubmit={handleUpload} className="upload-form">
              <div className="form-group">
                <label>Patient Access Code *</label>
                <input
                  type="text"
                  placeholder="e.g., MG-A1B2C3D4"
                  value={uploadForm.patientAccessCode}
                  onChange={(e) => setUploadForm({...uploadForm, patientAccessCode: e.target.value})}
                  required
                  className="form-input"
                />
                <small>Enter the patient's unique access code</small>
              </div>

              <div className="form-group">
                <label>Record Type *</label>
                <select
                  value={uploadForm.recordType}
                  onChange={(e) => setUploadForm({...uploadForm, recordType: e.target.value})}
                  required
                  className="form-select"
                >
                  <option value="LAB_REPORT">Lab Report</option>
                  <option value="X_RAY">X-Ray</option>
                  <option value="CT_SCAN">CT Scan</option>
                  <option value="MRI">MRI</option>
                  <option value="PRESCRIPTION">Prescription</option>
                  <option value="DISCHARGE_SUMMARY">Discharge Summary</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div className="form-group">
                <label>Medical Document *</label>
                <div className="file-upload-area">
                  <input
                    type="file"
                    onChange={handleFileChange}
                    required
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    className="file-input-hidden"
                    id="file-upload"
                  />
                  <label htmlFor="file-upload" className="file-upload-label">
                    <div className="upload-icon">📎</div>
                    <div className="upload-text">
                      {uploadForm.file ? uploadForm.file.name : 'Click to select file'}
                    </div>
                    <div className="upload-subtext">PDF, JPG, PNG, DOC (Max 10MB)</div>
                  </label>
                </div>
              </div>

              <div className="form-group">
                <label>Notes (Optional)</label>
                <textarea
                  placeholder="Additional notes or observations..."
                  value={uploadForm.notes}
                  onChange={(e) => setUploadForm({...uploadForm, notes: e.target.value})}
                  rows="3"
                  className="form-textarea"
                />
              </div>

              <div className="modal-footer">
                <button 
                  type="button"
                  className="secondary-btn"
                  onClick={() => setShowUploadModal(false)}
                  disabled={uploading}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="primary-btn"
                  disabled={uploading}
                >
                  {uploading ? 'Uploading...' : 'Upload Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Patient Modal */}
      {showAddPatientModal && (
        <div className="modal-overlay" onClick={() => setShowAddPatientModal(false)}>
          <div className="modal-content upload-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add Patient</h3>
              <button 
                className="close-modal"
                onClick={() => setShowAddPatientModal(false)}
              >
                ×
              </button>
            </div>
            
            {message.text && (
              <div className={`message-banner ${message.type}`}>
                {message.text}
              </div>
            )}

            <form onSubmit={handleAddPatient} className="upload-form">
              <div className="form-group">
                <label>Patient Access Code *</label>
                <input
                  type="text"
                  placeholder="e.g., MG-A1B2C3D4"
                  value={addPatientForm.accessCode}
                  onChange={(e) => setAddPatientForm({...addPatientForm, accessCode: e.target.value})}
                  required
                  className="form-input"
                />
                <small>Enter the patient's unique access code to add them to your system</small>
              </div>

              <div className="modal-footer">
                <button 
                  type="button"
                  className="secondary-btn"
                  onClick={() => setShowAddPatientModal(false)}
                  disabled={addingPatient}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="primary-btn"
                  disabled={addingPatient}
                >
                  {addingPatient ? 'Searching...' : 'Lookup Patient'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Search Records Modal */}
      {showSearchModal && (
        <div className="modal-overlay" onClick={() => setShowSearchModal(false)}>
          <div className="modal-content upload-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '800px' }}>
            <div className="modal-header">
              <h3>Search Records</h3>
              <button 
                className="close-modal"
                onClick={() => setShowSearchModal(false)}
              >
                ×
              </button>
            </div>

            <div className="upload-form" style={{ padding: '20px' }}>
              <div className="form-group">
                <label>Search Query</label>
                <input
                  type="text"
                  placeholder="Search by record type, patient access code, or description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearchRecords()}
                  className="form-input"
                  style={{ marginBottom: '10px' }}
                />
                <button 
                  type="button"
                  className="primary-btn"
                  onClick={handleSearchRecords}
                  disabled={isSearching}
                  style={{ width: '100%' }}
                >
                  {isSearching ? 'Searching...' : '🔍 Search'}
                </button>
              </div>

              {searchResults.length > 0 && (
                <div style={{ marginTop: '20px' }}>
                  <h4 style={{ marginBottom: '15px' }}>Search Results ({searchResults.length})</h4>
                  <div className="records-table">
                    {searchResults.map(record => (
                      <div key={record.recordId} className="record-row">
                        <div className="record-icon">📄</div>
                        <div className="record-info">
                          <div className="record-type">{record.recordType}</div>
                          <div className="record-hospital">Patient: {record.patientAccessCode || 'N/A'}</div>
                        </div>
                        <div className="record-date">{new Date(record.uploadDate).toLocaleDateString()}</div>
                        <div className={`record-status ${record.status}`}>
                          {record.status === 'VERIFIED' ? '✓ Verified' : '⏳ Pending'}
                        </div>
                        <button className="record-action" onClick={() => handleViewRecord(record)}>View</button>
                      </div>
                    ))}
                  </div>
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
                  <span style={{ color: '#333' }}>{selectedRecord.fileName || 'N/A'}</span>
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
                
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', backgroundColor: '#f5f5f5', borderRadius: '6px' }}>
                  <span style={{ fontWeight: '600', color: '#666' }}>Patient Code:</span>
                  <span style={{ color: '#333' }}>{selectedRecord.patientAccessCode || 'N/A'}</span>
                </div>
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

      {/* Patient Records Modal */}
      {showPatientRecordsModal && selectedPatient && (
        <div className="modal-overlay" onClick={() => setShowPatientRecordsModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '900px', maxHeight: '80vh', overflow: 'auto' }}>
            <div className="modal-header">
              <h3>📋 Patient Records - {selectedPatient.name}</h3>
              <button className="close-modal" onClick={() => setShowPatientRecordsModal(false)}>×</button>
            </div>
            
            <div style={{ padding: '20px' }}>
              <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                  <div>
                    <label style={{ fontSize: '12px', color: '#6b7280', fontWeight: '600' }}>Patient Name</label>
                    <p style={{ margin: '4px 0 0 0', fontSize: '14px', fontWeight: '600', color: '#1a1a1a' }}>{selectedPatient.name}</p>
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', color: '#6b7280', fontWeight: '600' }}>Email</label>
                    <p style={{ margin: '4px 0 0 0', fontSize: '14px', fontWeight: '600', color: '#1a1a1a' }}>{selectedPatient.email}</p>
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', color: '#6b7280', fontWeight: '600' }}>Access Code</label>
                    <p style={{ margin: '4px 0 0 0', fontSize: '14px', fontWeight: '600', color: '#6366f1' }}>{selectedPatient.accessCode}</p>
                  </div>
                </div>
              </div>

              {loadingPatientRecords ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                  <p>Loading records...</p>
                </div>
              ) : patientRecords.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                  <p>📭 No records found for this patient.</p>
                </div>
              ) : (
                <div>
                  <h4 style={{ marginBottom: '15px', color: '#1a1a1a' }}>Medical Records ({patientRecords.length})</h4>
                  <div className="records-table">
                    {patientRecords.map(record => (
                      <div key={record.recordId} className="record-row">
                        <div className="record-icon">📄</div>
                        <div className="record-info">
                          <div className="record-type">{record.recordType}</div>
                          <div className="record-hospital">{record.fileName || 'N/A'}</div>
                        </div>
                        <div className="record-date">{new Date(record.uploadDate).toLocaleDateString()}</div>
                        <div className={`record-status ${record.status}`}>
                          {record.status === 'VERIFIED' ? '✓ Verified' : '⏳ Pending'}
                        </div>
                        <button 
                          className="record-action" 
                          onClick={() => handlePreviewRecord(record)}
                          style={{ marginRight: '8px' }}
                        >
                          👁️ Preview
                        </button>
                        <button className="record-action" onClick={() => handleViewRecord(record)}>View</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div style={{ marginTop: '25px', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button 
                  onClick={() => setShowPatientRecordsModal(false)}
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
    </div>
  );
};

export default HospitalDashboard;
