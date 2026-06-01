import axios from 'axios';

// Create AXIOS instance targeting local relative routes
export const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Automatically inject JWT token into header if present
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('epms_token');
    if (token && config.headers) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Intercept responses to catch unauthorized (401/403) token expirations and log out
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      // Clear token and reload if token was expired
      localStorage.removeItem('epms_token');
      localStorage.removeItem('epms_user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
