import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';
import { 
  FaUser,
  FaEnvelope,
  FaPhone,
  FaLock,
  FaSave,
  FaEdit,
  FaTimes,
  FaCheckCircle,
  FaExclamationTriangle,
  FaUserShield,
  FaCalendarAlt,
  FaIdCard,
  FaShieldAlt
} from 'react-icons/fa';

// Separate component for password input to prevent re-renders
const PasswordInput = React.memo(({ 
  label, 
  value, 
  onChange, 
  placeholder, 
  required = false,
  autoComplete = "current-password"
}) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-2">
      {label}
    </label>
    <div className="relative">
      <FaLock className="absolute left-3 top-3 text-gray-400" />
      <input
        type="password"
        value={value}
        onChange={onChange}
        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        placeholder={placeholder}
        required={required}
        autoComplete={autoComplete}
      />
    </div>
  </div>
));

// Move these components outside the main Profile component to prevent re-renders
const UserInfoCard = ({ user }) => (
  <div className="bg-white rounded-lg shadow-md p-6">
    <div className="flex items-center space-x-4 mb-6">
      <div className="relative">
        <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
          <FaUser className="text-white text-2xl" />
        </div>
        <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-1 border-2 border-white">
          <FaUserShield className="text-white text-xs" />
        </div>
      </div>
      <div>
        <h2 className="text-2xl font-bold text-gray-800">{user?.name}</h2>
        <p className="text-gray-600 capitalize">{user?.role}</p>
        <p className="text-sm text-gray-500 flex items-center space-x-1">
          <FaIdCard className="w-3 h-3" />
          <span>User ID: {user?._id?.substring(0, 8)}...</span>
        </p>
      </div>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-3">
        <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
          <FaEnvelope className="text-gray-400" />
          <div>
            <p className="text-sm text-gray-500">Email</p>
            <p className="font-medium">{user?.email}</p>
          </div>
        </div>

        <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
          <FaUserShield className="text-gray-400" />
          <div>
            <p className="text-sm text-gray-500">Role</p>
            <p className="font-medium capitalize">{user?.role}</p>
          </div>
        </div>

        {user?.lastLogin && (
          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
            <FaCalendarAlt className="text-gray-400" />
            <div>
              <p className="text-sm text-gray-500">Last Login</p>
              <p className="font-medium">
                {new Date(user.lastLogin).toLocaleDateString()} at {new Date(user.lastLogin).toLocaleTimeString()}
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-3">
        <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
          <FaCheckCircle className="text-green-500" />
          <div>
            <p className="text-sm text-gray-500">Status</p>
            <p className="font-medium text-green-600">Active</p>
          </div>
        </div>

        <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
          <FaCalendarAlt className="text-gray-400" />
          <div>
            <p className="text-sm text-gray-500">Member Since</p>
            <p className="font-medium">
              {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
          <FaShieldAlt className="text-blue-500" />
          <div>
            <p className="text-sm text-gray-500">Security Level</p>
            <p className="font-medium">Administrator</p>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const ProfileForm = ({ 
  user, 
  profileData, 
  setProfileData, 
  isEditing, 
  setIsEditing, 
  loading, 
  handleProfileUpdate 
}) => (
  <div className="bg-white rounded-lg shadow-md p-6">
    <div className="flex justify-between items-center mb-6">
      <h3 className="text-lg font-semibold text-gray-800">Personal Information</h3>
      <button
        onClick={() => setIsEditing(!isEditing)}
        className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
      >
        {isEditing ? <FaTimes className="w-4 h-4" /> : <FaEdit className="w-4 h-4" />}
        <span>{isEditing ? 'Cancel' : 'Edit Profile'}</span>
      </button>
    </div>

    <form onSubmit={handleProfileUpdate}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Full Name
          </label>
          <input
            type="text"
            value={profileData.name}
            onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
            disabled={!isEditing}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            required
            autoComplete="name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email Address
          </label>
          <input
            type="email"
            value={profileData.email}
            onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
            disabled={!isEditing}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            required
            autoComplete="email"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Phone Number
          </label>
          <input
            type="tel"
            value={profileData.phone}
            onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
            disabled={!isEditing}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            placeholder="+1 (555) 123-4567"
            autoComplete="tel"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Address
          </label>
          <input
            type="text"
            value={profileData.address}
            onChange={(e) => setProfileData({ ...profileData, address: e.target.value })}
            disabled={!isEditing}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            placeholder="Enter your address"
            autoComplete="street-address"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Bio
          </label>
          <textarea
            value={profileData.bio}
            onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
            disabled={!isEditing}
            rows="4"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            placeholder="Tell us about yourself..."
            autoComplete="off"
          />
        </div>
      </div>

      {isEditing && (
        <div className="flex justify-end space-x-3 mt-6">
          <button
            type="button"
            onClick={() => setIsEditing(false)}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition-colors duration-200 flex items-center space-x-2"
          >
            <FaSave className="w-4 h-4" />
            <span>{loading ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </div>
      )}
    </form>
  </div>
);

const SecuritySettings = ({ 
  currentPassword, 
  newPassword, 
  confirmPassword, 
  handleCurrentPasswordChange, 
  handleNewPasswordChange, 
  handleConfirmPasswordChange, 
  loading, 
  handlePasswordChange 
}) => (
  <div className="bg-white rounded-lg shadow-md p-6">
    <h3 className="text-lg font-semibold text-gray-800 mb-6">Change Password</h3>

    <form onSubmit={handlePasswordChange}>
      <div className="space-y-4 max-w-md">
        <PasswordInput
          label="Current Password"
          value={currentPassword}
          onChange={handleCurrentPasswordChange}
          placeholder="Enter current password"
          required={true}
          autoComplete="current-password"
        />

        <PasswordInput
          label="New Password"
          value={newPassword}
          onChange={handleNewPasswordChange}
          placeholder="Enter new password"
          required={true}
          autoComplete="new-password"
        />
        <p className="text-xs text-gray-500 mt-1 -mb-2">
          Password must be at least 6 characters long
        </p>

        <PasswordInput
          label="Confirm New Password"
          value={confirmPassword}
          onChange={handleConfirmPasswordChange}
          placeholder="Confirm new password"
          required={true}
          autoComplete="new-password"
        />

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <FaExclamationTriangle className="text-yellow-500" />
            <h4 className="font-medium text-yellow-800">Password Requirements</h4>
          </div>
          <ul className="text-sm text-yellow-700 mt-2 space-y-1">
            <li>• Minimum 6 characters</li>
            <li>• Include uppercase and lowercase letters</li>
            <li>• Include numbers and special characters</li>
            <li>• Not similar to your current password</li>
          </ul>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition-colors duration-200 flex items-center space-x-2"
          >
            <FaSave className="w-4 h-4" />
            <span>{loading ? 'Updating...' : 'Update Password'}</span>
          </button>
        </div>
      </div>
    </form>
  </div>
);

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    bio: ''
  });
  
  // Separate state for password fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || '',
        bio: user.bio || ''
      });
    }
  }, [user]);

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await authService.updateProfile(profileData);
      if (response.success) {
        updateUser(response.data);
        setMessage({ type: 'success', text: 'Profile updated successfully!' });
        setIsEditing(false);
      }
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to update profile' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' });
      setLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters long' });
      setLoading(false);
      return;
    }

    try {
      const response = await authService.updateProfile({
        password: newPassword,
        currentPassword: currentPassword
      });
      
      if (response.success) {
        setMessage({ type: 'success', text: 'Password updated successfully!' });
        // Clear password fields
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to update password' 
      });
    } finally {
      setLoading(false);
    }
  };

  // Memoized change handlers for password fields
  const handleCurrentPasswordChange = useCallback((e) => {
    setCurrentPassword(e.target.value);
  }, []);

  const handleNewPasswordChange = useCallback((e) => {
    setNewPassword(e.target.value);
  }, []);

  const handleConfirmPasswordChange = useCallback((e) => {
    setConfirmPassword(e.target.value);
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 flex items-center">
            <FaUser className="mr-3 text-blue-600" />
            My Profile
          </h1>
          <p className="text-gray-600 mt-1">Manage your account settings and preferences</p>
        </div>
      </div>

      {/* Message Alert */}
      {message.text && (
        <div className={`p-4 rounded-lg ${
          message.type === 'success' 
            ? 'bg-green-100 text-green-800 border border-green-200' 
            : 'bg-red-100 text-red-800 border border-red-200'
        }`}>
          <div className="flex items-center space-x-2">
            {message.type === 'success' ? (
              <FaCheckCircle className="w-5 h-5" />
            ) : (
              <FaExclamationTriangle className="w-5 h-5" />
            )}
            <span>{message.text}</span>
          </div>
        </div>
      )}

      {/* User Info Card */}
      <UserInfoCard user={user} />

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('profile')}
              className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                activeTab === 'profile'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <FaUser className="inline w-4 h-4 mr-2" />
              Personal Information
            </button>
            <button
              onClick={() => setActiveTab('security')}
              className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                activeTab === 'security'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <FaShieldAlt className="inline w-4 h-4 mr-2" />
              Security
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'profile' && (
            <ProfileForm
              user={user}
              profileData={profileData}
              setProfileData={setProfileData}
              isEditing={isEditing}
              setIsEditing={setIsEditing}
              loading={loading}
              handleProfileUpdate={handleProfileUpdate}
            />
          )}
          {activeTab === 'security' && (
            <SecuritySettings
              currentPassword={currentPassword}
              newPassword={newPassword}
              confirmPassword={confirmPassword}
              handleCurrentPasswordChange={handleCurrentPasswordChange}
              handleNewPasswordChange={handleNewPasswordChange}
              handleConfirmPasswordChange={handleConfirmPasswordChange}
              loading={loading}
              handlePasswordChange={handlePasswordChange}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;