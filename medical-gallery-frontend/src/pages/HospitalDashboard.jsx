import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './HospitalDashboard.css';

const HospitalDashboard = () => {
  const navigate = useNavigate();
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    patientCode: '',
    recordType: 'Lab Report',
    notes: ''
  });

  const handleLogout = () => {
    navigate('/login');
  };

  const handleUpload = (e) => {
    e.preventDefault();
    // Handle upload logic
    setShowUploadModal(false);
  };

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
          <a href="#" className="nav-item active">
            <span className="nav-icon">📊</span>
            <span>Dashboard</span>
          </a>
          <a href="#" className="nav-item">
            <span className="nav-icon">⬆️</span>
            <span>Upload Records</span>
          </a>
          <a href="#" className="nav-item">
            <span className="nav-icon">👥</span>
            <span>Patients</span>
          </a>
          <a href="#" className="nav-item">
            <span className="nav-icon">📁</span>
            <span>All Records</span>
          </a>
          <a href="#" className="nav-item">
            <span className="nav-icon">⚙️</span>
            <span>Settings</span>
          </a>
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
        <header className="top-bar">
          <div className="welcome-section">
            <h1 className="welcome-title">City Hospital Dashboard 🏥</h1>
            <p className="welcome-subtitle">Manage patient records securely</p>
          </div>
          
          <button 
            className="upload-primary-btn"
            onClick={() => setShowUploadModal(true)}
          >
            <span>⬆️</span>
            <span>Upload Record</span>
          </button>
        </header>

        {/* Stats */}
        <div className="stats-grid">
          <div className="stat-card blue">
            <div className="stat-icon">📄</div>
            <div className="stat-content">
              <div className="stat-value">156</div>
              <div className="stat-label">Records Uploaded</div>
            </div>
          </div>
          
          <div className="stat-card green">
            <div className="stat-icon">👥</div>
            <div className="stat-content">
              <div className="stat-value">89</div>
              <div className="stat-label">Active Patients</div>
            </div>
          </div>
          
          <div className="stat-card purple">
            <div className="stat-icon">✓</div>
            <div className="stat-content">
              <div className="stat-value">142</div>
              <div className="stat-label">Verified</div>
            </div>
          </div>
          
          <div className="stat-card orange">
            <div className="stat-icon">⏳</div>
            <div className="stat-content">
              <div className="stat-value">14</div>
              <div className="stat-label">Pending</div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="activity-section">
          <h2 className="section-title">Recent Activity</h2>
          
          <div className="activity-list">
            <div className="activity-item">
              <div className="activity-icon">📄</div>
              <div className="activity-details">
                <div className="activity-title">Lab Report Uploaded</div>
                <div className="activity-subtitle">Patient Code: MG-2451 • 2 hours ago</div>
              </div>
              <div className="activity-status verified">✓ Verified</div>
            </div>
            
            <div className="activity-item">
              <div className="activity-icon">🔬</div>
              <div className="activity-details">
                <div className="activity-title">X-Ray Scan Uploaded</div>
                <div className="activity-subtitle">Patient Code: MG-2450 • 5 hours ago</div>
              </div>
              <div className="activity-status pending">⏳ Processing</div>
            </div>
            
            <div className="activity-item">
              <div className="activity-icon">💊</div>
              <div className="activity-details">
                <div className="activity-title">Prescription Added</div>
                <div className="activity-subtitle">Patient Code: MG-2449 • 1 day ago</div>
              </div>
              <div className="activity-status verified">✓ Verified</div>
            </div>
          </div>
        </div>
      </main>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="modal-overlay" onClick={() => setShowUploadModal(false)}>
          <div className="modal-content hospital-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Upload Patient Record</h3>
              <button 
                className="close-modal"
                onClick={() => setShowUploadModal(false)}
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleUpload}>
              <div className="form-group">
                <label className="form-label">Patient Access Code</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Enter patient's unique code"
                  value={uploadForm.patientCode}
                  onChange={(e) => setUploadForm({...uploadForm, patientCode: e.target.value})}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Record Type</label>
                <select 
                  className="form-input"
                  value={uploadForm.recordType}
                  onChange={(e) => setUploadForm({...uploadForm, recordType: e.target.value})}
                >
                  <option>Lab Report</option>
                  <option>X-Ray</option>
                  <option>Prescription</option>
                  <option>CT Scan</option>
                  <option>MRI</option>
                  <option>Other</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Upload File</label>
                <div className="upload-area-small">
                  <span>📤</span>
                  <span>Choose file or drag here</span>
                  <input type="file" className="file-input" />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Notes (Optional)</label>
                <textarea
                  className="form-textarea"
                  rows="3"
                  placeholder="Add any additional notes..."
                  value={uploadForm.notes}
                  onChange={(e) => setUploadForm({...uploadForm, notes: e.target.value})}
                />
              </div>

              <div className="modal-footer">
                <button 
                  type="button"
                  className="cancel-btn"
                  onClick={() => setShowUploadModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="upload-btn">
                  Upload Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default HospitalDashboard;
