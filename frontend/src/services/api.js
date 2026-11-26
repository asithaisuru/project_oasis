import axios from 'axios';
const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api', withCredentials: true, timeout: 15000, headers: { 'Content-Type': 'application/json' } });
api.interceptors.response.use((response) => response, (error) => {
  if (error.response?.status === 401 && !error.config?.url?.includes('/auth/login') && !error.config?.url?.includes('/auth/profile')) window.dispatchEvent(new Event('oasis-session-expired'));
  return Promise.reject(error);
});
export default api;
