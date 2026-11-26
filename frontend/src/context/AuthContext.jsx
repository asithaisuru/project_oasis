import React, { createContext, useState, useContext, useEffect } from 'react';
import { authService } from '../services/authService';
const AuthContext = createContext();
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
const withoutToken = ({ token: _token, ...user }) => user;
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    // Remove credentials written by pre-upgrade versions; all old sessions require login.
    try { localStorage.removeItem('token'); localStorage.removeItem('user'); } catch { /* Storage may be unavailable. */ }
    const expired = () => setUser(null);
    window.addEventListener('oasis-session-expired', expired);
    authService.getProfile().then((response) => { if (active) setUser(withoutToken(response.data)); }).catch(() => { if (active) setUser(null); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; window.removeEventListener('oasis-session-expired', expired); };
  }, []);
  const login = async (email, password) => {
    try {
      const response = await authService.login(email, password);
      const data = withoutToken(response.data);
      setUser(data);
      return { success: true, data };
    } catch (error) { return { success: false, message: error.response?.data?.message || 'Unable to sign in. Please check your connection.' }; }
  };
  const logout = async () => { await authService.logout(); setUser(null); };
  const updateUser = (data) => setUser((previous) => ({ ...previous, ...withoutToken(data) }));
  return <AuthContext.Provider value={{ isAuthenticated: Boolean(user), user, login, logout, updateUser, loading }}>{children}</AuthContext.Provider>;
};
