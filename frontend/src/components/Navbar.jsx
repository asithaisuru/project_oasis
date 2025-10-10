import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  FaGraduationCap, 
  FaTachometerAlt, 
  FaUsers, 
  FaChalkboardTeacher, 
  FaBook, 
  FaClipboardCheck, 
  FaCreditCard, 
  FaUserShield, 
  FaChevronDown, 
  FaUserCog, 
  FaCog, 
  FaBell, 
  FaSignOutAlt,
  FaBars,
  FaTimes
} from "react-icons/fa";

const Navbar = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const { user, logout } = useAuth();
  const dropdownRef = useRef(null);
  const profileButtonRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target) &&
          profileButtonRef.current && !profileButtonRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Close mobile menu when clicking on a link
  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handleLogout = () => {
    logout();
    setIsDropdownOpen(false);
  };

  return (
    <nav className="bg-gradient-to-r from-blue-600 to-purple-700 shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo and Brand */}
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0 bg-white bg-opacity-20 p-2 rounded-lg">
              <FaGraduationCap className="text-black text-2xl" />
            </div>
            <Link to="/dashboard" className="text-white text-xl font-bold hidden sm:block">Oasis Admin</Link>
            <Link to="/dashboard" className="text-white text-xl font-bold sm:hidden">Oasis Admin</Link>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center space-x-6">
            <Link to="/dashboard" className="text-white hover:text-blue-200 transition-colors duration-200 flex items-center space-x-2">
              <FaTachometerAlt className="w-4 h-4" />
              <span>Dashboard</span>
            </Link>
            <Link to="/students" className="text-white hover:text-blue-200 transition-colors duration-200 flex items-center space-x-2">
              <FaUsers className="w-4 h-4" />
              <span>Students</span>
            </Link>
            <Link to="/teachers" className="text-white hover:text-blue-200 transition-colors duration-200 flex items-center space-x-2">
              <FaChalkboardTeacher className="w-4 h-4" />
              <span>Teachers</span>
            </Link>
            <Link to="/classes" className="text-white hover:text-blue-200 transition-colors duration-200 flex items-center space-x-2">
              <FaBook className="w-4 h-4" />
              <span>Classes</span>
            </Link>
            <Link to="/attendance" className="text-white hover:text-blue-200 transition-colors duration-200 flex items-center space-x-2">
              <FaClipboardCheck className="w-4 h-4" />
              <span>Attendance</span>
            </Link>
            <Link to="/payments" className="text-white hover:text-blue-200 transition-colors duration-200 flex items-center space-x-2">
              <FaCreditCard className="w-4 h-4" />
              <span>Payments</span>
            </Link>
          </div>

          {/* Right Section - Profile & Mobile Menu */}
          <div className="flex items-center space-x-4">
            {/* Mobile Menu Button */}
            <button 
              onClick={toggleMobileMenu}
              className="md:hidden bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg p-2 transition-all duration-200"
            >
              {isMobileMenuOpen ? (
                <FaTimes className="text-black text-lg" />
              ) : (
                <FaBars className="text-black text-lg" />
              )}
            </button>

            {/* Admin Profile Section */}
            <div className="relative" ref={dropdownRef}>
              <div 
                ref={profileButtonRef}
                className="flex items-center space-x-2 cursor-pointer bg-white bg-opacity-10 hover:bg-opacity-20 rounded-lg px-3 py-2 transition-all duration-200"
                onClick={toggleDropdown}
                onMouseEnter={() => setIsDropdownOpen(true)}
              >
                <div className="bg-white bg-opacity-20 p-1.5 rounded-full">
                  <FaUserShield className="text-black text-xl" />
                </div>
                <div className="hidden lg:block text-black">
                  <div className="text-sm font-semibold">{user?.name || 'Admin User'}</div>
                  <div className="text-xs text-blue-600 capitalize">{user?.role || 'Administrator'}</div>
                </div>
                <FaChevronDown className={`text-white text-xs transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </div>
              
              {/* Dropdown Menu */}
              {isDropdownOpen && (
                <div 
                  className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl py-2 z-50 border border-gray-200"
                  onMouseEnter={() => setIsDropdownOpen(true)}
                  onMouseLeave={() => setIsDropdownOpen(false)}
                >
                  <Link 
                    to="/profile" 
                    className="flex items-center space-x-3 px-4 py-2 text-gray-700 hover:bg-blue-50 transition-colors duration-150"
                    onClick={() => {
                      setIsDropdownOpen(false);
                      closeMobileMenu();
                    }}
                  >
                    <FaUserCog className="text-gray-400 w-4 h-4" />
                    <span>My Profile</span>
                  </Link>
                  {/* <Link 
                    to="/settings" 
                    className="flex items-center space-x-3 px-4 py-2 text-gray-700 hover:bg-blue-50 transition-colors duration-150"
                    onClick={() => {
                      setIsDropdownOpen(false);
                      closeMobileMenu();
                    }}
                  >
                    <FaCog className="text-gray-400 w-4 h-4" />
                    <span>Settings</span>
                  </Link>
                  <div className="border-t border-gray-100 my-1"></div>
                  <Link 
                    to="/notifications" 
                    className="flex items-center justify-between px-4 py-2 text-gray-700 hover:bg-blue-50 transition-colors duration-150"
                    onClick={() => {
                      setIsDropdownOpen(false);
                      closeMobileMenu();
                    }}
                  >
                    <div className="flex items-center space-x-3">
                      <FaBell className="text-gray-400 w-4 h-4" />
                      <span>Notifications</span>
                    </div>
                    <span className="bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">3</span>
                  </Link> */}
                  <div className="border-t border-gray-100 my-1"></div>
                  <button 
                    onClick={handleLogout}
                    className="flex items-center space-x-3 px-4 py-2 text-red-600 hover:bg-red-50 transition-colors duration-150 w-full text-left"
                  >
                    <FaSignOutAlt className="text-red-400 w-4 h-4" />
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-200 rounded-b-lg shadow-lg">
            <div className="px-2 pt-2 pb-3 space-y-1">
              <Link 
                to="/dashboard" 
                className="flex items-center space-x-3 px-3 py-2 text-gray-700 hover:bg-blue-50 rounded-lg transition-colors duration-150"
                onClick={closeMobileMenu}
              >
                <FaTachometerAlt className="text-gray-400 w-4 h-4" />
                <span>Dashboard</span>
              </Link>
              <Link 
                to="/students" 
                className="flex items-center space-x-3 px-3 py-2 text-gray-700 hover:bg-blue-50 rounded-lg transition-colors duration-150"
                onClick={closeMobileMenu}
              >
                <FaUsers className="text-gray-400 w-4 h-4" />
                <span>Students</span>
              </Link>
              <Link 
                to="/teachers" 
                className="flex items-center space-x-3 px-3 py-2 text-gray-700 hover:bg-blue-50 rounded-lg transition-colors duration-150"
                onClick={closeMobileMenu}
              >
                <FaChalkboardTeacher className="text-gray-400 w-4 h-4" />
                <span>Teachers</span>
              </Link>
              <Link 
                to="/classes" 
                className="flex items-center space-x-3 px-3 py-2 text-gray-700 hover:bg-blue-50 rounded-lg transition-colors duration-150"
                onClick={closeMobileMenu}
              >
                <FaBook className="text-gray-400 w-4 h-4" />
                <span>Classes</span>
              </Link>
              <Link 
                to="/attendance" 
                className="flex items-center space-x-3 px-3 py-2 text-gray-700 hover:bg-blue-50 rounded-lg transition-colors duration-150"
                onClick={closeMobileMenu}
              >
                <FaClipboardCheck className="text-gray-400 w-4 h-4" />
                <span>Attendance</span>
              </Link>
              <Link 
                to="/payments" 
                className="flex items-center space-x-3 px-3 py-2 text-gray-700 hover:bg-blue-50 rounded-lg transition-colors duration-150"
                onClick={closeMobileMenu}
              >
                <FaCreditCard className="text-gray-400 w-4 h-4" />
                <span>Payments</span>
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;