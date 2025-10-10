import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaGraduationCap, FaEye, FaEyeSlash, FaUserShield } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [formData, setFormData] = useState({
    email: 'admin@oasis.edu',
    password: 'password123'
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isLoading) return;
    
    setIsLoading(true);
    setError('');

    try {
      console.log('Login component: Calling login function...');
      const result = await login(formData.email, formData.password);
      console.log('Login component: Received result:', result);
      
      if (result.success) {
        console.log('Login successful, navigating to dashboard');
        navigate('/dashboard');
      } else {
        console.log('Login failed with message:', result.message);
        setError(result.message);
      }
    } catch (error) {
      console.error('Login component: Unexpected error:', error);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setShowPassword(!showPassword);
  };

  // Add this to check if there's any form submission happening
  const handleFormClick = (e) => {
    e.stopPropagation();
  };

  return (
    <div 
      className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8"
      onClick={() => console.log('Page clicked')} // Debug click events
    >
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center">
            <div className="bg-gradient-to-r from-blue-600 to-purple-700 p-4 rounded-2xl">
              <FaGraduationCap className="text-white text-4xl" />
            </div>
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Oasis Admin
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Sign in to your administrator account
          </p>
        </div>

        {/* Login Form */}
        <form 
          className="mt-8 space-y-6 bg-white p-8 rounded-2xl shadow-lg" 
          onSubmit={handleSubmit}
          onClick={handleFormClick}
        >
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
              <strong>Error:</strong> {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <div className="relative">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="appearance-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:z-10 transition-colors duration-200"
                  placeholder="admin@oasis.edu"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <FaUserShield className="h-5 w-5 text-gray-400" />
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="appearance-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:z-10 transition-colors duration-200 pr-10"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center focus:outline-none"
                  onClick={togglePasswordVisibility}
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <FaEyeSlash className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors duration-200" />
                  ) : (
                    <FaEye className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors duration-200" />
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                Remember me
              </label>
            </div>

            <div className="text-sm">
              <Link 
                to="/forgot-password" 
                className="font-medium text-blue-600 hover:text-blue-500 transition-colors duration-200"
              >
                Forgot your password?
              </Link>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-blue-600 to-purple-700 hover:from-blue-700 hover:to-purple-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Signing in...
                </div>
              ) : (
                'Sign in'
              )}
            </button>
          </div>

          <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-800 text-center">
              <strong>Demo Credentials:</strong><br />
              Email: admin@oasis.edu<br />
              Password: password123
            </p>
          </div>
        </form>

        <div className="text-center">
          <p className="text-xs text-gray-500">
            &copy; 2024 Oasis Tuition Classes. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;