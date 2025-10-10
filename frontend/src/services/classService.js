import api from './api';

export const classService = {
  // Get all classes
  getClasses: async (params = {}) => {
    const response = await api.get('/classes', { params });
    return response.data;
  },

  // Get single class
  getClass: async (id) => {
    const response = await api.get(`/classes/${id}`);
    return response.data;
  },

  // Create class
  createClass: async (classData) => {
    const response = await api.post('/classes', classData);
    return response.data;
  },

  // Update class
  updateClass: async (id, classData) => {
    const response = await api.put(`/classes/${id}`, classData);
    return response.data;
  },

  // Delete class
  deleteClass: async (id) => {
    const response = await api.delete(`/classes/${id}`);
    return response.data;
  },

  // Add student to class
  addStudentToClass: async (classId, studentId) => {
    const response = await api.post(`/classes/${classId}/students`, { studentId });
    return response.data;
  },

  // Remove student from class
  removeStudentFromClass: async (classId, studentId) => {
    const response = await api.delete(`/classes/${classId}/students/${studentId}`);
    return response.data;
  }
};