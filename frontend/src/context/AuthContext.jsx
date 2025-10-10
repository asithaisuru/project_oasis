import React, { createContext, useState, useContext, useEffect } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      const savedUser = localStorage.getItem('user');
      
      if (token && savedUser) {
        // Verify token is still valid by fetching profile
        const response = await authService.getProfile();
        setIsAuthenticated(true);
        setUser(response.data);
      }
    } catch (error) {
      // Token is invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      console.log('AuthContext: Attempting login with:', email); // Debug log
      const response = await authService.login(email, password);
      console.log('AuthContext: Login response:', response); // Debug log
      
      if (response.success) {
        const { data } = response;
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data));
        
        setIsAuthenticated(true);
        setUser(data);
        
        return { success: true, data };
      } else {
        // Handle case where response.success is false
        const message = response.message || 'Login failed. Please try again.';
        return { success: false, message };
      }
    } catch (error) {
      console.error('AuthContext: Login error:', error); // Debug log
      
      // Handle different types of errors
      let message = 'Login failed. Please try again.';
      
      if (error.response) {
        // Server responded with error status
        message = error.response.data?.message || error.response.data?.error || `Server error: ${error.response.status}`;
      } else if (error.request) {
        // Request was made but no response received
        message = 'No response from server. Please check your connection.';
      } else {
        // Something else happened
        message = error.message || 'An unexpected error occurred.';
      }
      
      return { success: false, message };
    }
  };

  const logout = () => {
    authService.logout();
    setIsAuthenticated(false);
    setUser(null);
  };

  const updateUser = (userData) => {
    const updatedUser = { ...user, ...userData };
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  const value = {
    isAuthenticated,
    user,
    login,
    logout,
    updateUser,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};