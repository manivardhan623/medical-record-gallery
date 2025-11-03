import axios from 'axios';

import API_BASE_URL from '../config/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Auth API
export const authAPI = {
  // Health check
  health: () => api.get('/auth/health'),

  // Register patient
  registerPatient: (data) => api.post('/auth/register-patient', {
    name: data.name,
    phoneNumber: data.phone,
    email: data.email,
  }),

  // Register hospital
  registerHospital: (data) => api.post('/auth/register-hospital', {
    hospitalName: data.hospitalName,
    phoneNumber: data.phone,
    email: data.email,
  }),

  // Send OTP
  sendOTP: (contact, userType) => api.post('/auth/send-otp', {
    contact,
    userType,
  }),

  // Verify OTP
  verifyOTP: (contact, otpCode) => api.post('/auth/verify-otp', {
    contact,
    otpCode,
  }),

  // Get user by access code
  getUserByAccessCode: (accessCode) => api.get(`/auth/user/${accessCode}`),
};

// Patient API
export const patientAPI = {
  // Get patient profile
  getProfile: (userId) => api.get(`/patient/${userId}`),

  // Update patient profile
  updateProfile: (patientId, data) => 
    api.put(`/patient/${patientId}`, null, { params: data }),

  // Get patient records
  getRecords: (patientId) => api.get(`/patient/${patientId}/records`),

  // Get patient stats
  getStats: (patientId) => api.get(`/patient/${patientId}/stats`),
};

// Hospital API
export const hospitalAPI = {
  // Get hospital profile
  getProfile: (hospitalId) => api.get(`/hospital/${hospitalId}`),

  // Update hospital profile
  updateProfile: (hospitalId, data) => 
    api.put(`/hospital/${hospitalId}`, null, { params: data }),

  // Get all hospitals
  getAllHospitals: () => api.get('/hospital/'),
};

// Medical Records API
export const recordsAPI = {
  // Upload record
  uploadRecord: (patientId, hospitalId, data) => 
    api.post('/records/upload', data, { 
      params: { patientId, hospitalId } 
    }),

  // Get record by ID
  getRecord: (recordId) => api.get(`/records/${recordId}`),

  // Update record status
  updateStatus: (recordId, status) => 
    api.put(`/records/${recordId}/status`, null, { params: { status } }),

  // Delete record
  deleteRecord: (recordId) => api.delete(`/records/${recordId}`),

  // Get verified records
  getVerifiedRecords: (patientId) => api.get(`/records/verified/${patientId}`),
};

export default api;
