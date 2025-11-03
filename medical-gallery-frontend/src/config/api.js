// Central API Configuration
// You can override this by setting REACT_APP_API_URL in your .env file
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:9090/api';

// Debug log to verify API URL (remove in production)
if (typeof window !== 'undefined') {
  console.log('🔧 API Base URL:', API_BASE_URL);
}

export default API_BASE_URL;

