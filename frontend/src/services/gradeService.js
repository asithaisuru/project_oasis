import api from './api';

export const gradeService = {
    // Get all grades with filters
    getGrades: async (params = {}) => {
        const response = await api.get('/grades', { params });
        return response.data;
    },

    // Get single grade
    getGrade: async (id) => {
        const response = await api.get(`/grades/${id}`);
        return response.data;
    },

    // Create grade
    createGrade: async (gradeData) => {
        const response = await api.post('/grades', gradeData);
        return response.data;
    },

    // Update grade
    updateGrade: async (id, gradeData) => {
        const response = await api.put(`/grades/${id}`, gradeData);
        return response.data;
    },

    // Delete grade
    deleteGrade: async (id) => {
        const response = await api.delete(`/grades/${id}`);
        return response.data;
    },

    // Get grades by student
    getGradesByStudent: async (studentId) => {
        const response = await api.get(`/grades/student/${studentId}`);
        return response.data;
    },

    // Get grades by class
    getGradesByClass: async (classId, params = {}) => {
        const response = await api.get(`/grades/class/${classId}`, { params });
        return response.data;
    },

    // Publish grade
    publishGrade: async (gradeId) => {
        const response = await api.post(`/grades/${gradeId}/publish`);
        return response.data;
    },

    // Bulk publish grades for a class
    bulkPublishGrades: async (classId, filters = {}) => {
        const response = await api.post(`/grades/class/${classId}/publish-bulk`, filters);
        return response.data;
    }
};