import api from './api';

// Auth services
export const authService = {
  // Login user
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },

  // Register user (admin only)
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  // Get user profile
  getProfile: async () => {
    const response = await api.get('/auth/profile');
    return response.data;
  },

  // Update user profile
  updateProfile: async (userData) => {
    const response = await api.put('/auth/profile', userData);
    return response.data;
  },

  // Logout (client-side only)
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
};