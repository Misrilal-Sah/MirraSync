import axios from 'axios';

// Dynamically resolve API URL: when accessed via LAN IP (mobile), use same hostname for API
const getBaseURL = () => {
  const envUrl = process.env.REACT_APP_API_URL;
  if (envUrl) {
    // If running on a non-localhost host (e.g. mobile via LAN IP), rewrite localhost to current host
    const { hostname } = window.location;
    if (hostname !== 'localhost' && hostname !== '127.0.0.1' && envUrl.includes('localhost')) {
      return envUrl.replace('localhost', hostname);
    }
    return envUrl;
  }
  return `http://${window.location.hostname}:5000/api`;
};

const api = axios.create({
  baseURL: getBaseURL(),
  withCredentials: true,
  timeout: 30000,
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('mirrasync_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('mirrasync_token');
      localStorage.removeItem('mirrasync_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
