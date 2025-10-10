// In src/services/studentService.js
import api from "./api";

export const studentService = {
  // Get all students
  getStudents: async () => {
    const response = await api.get("/students");
    return response.data;
  },

  // Get student by ID
  getStudentById: async (id) => {
    const response = await api.get(`/students/${id}`);
    return response.data;
  },

  // Create student
  createStudent: async (studentData) => {
    const response = await api.post("/students", studentData);
    return response.data;
  },

  // UPDATE STUDENT - ADD THIS FUNCTION
  updateStudent: async (id, studentData) => {
    const response = await api.put(`/students/${id}`, studentData);
    return response.data;
  },

  // Delete student
  deleteStudent: async (id) => {
    const response = await api.delete(`/students/${id}`);
    return response.data;
  },

  // Enroll students in class
  enrollStudentsInClass: async (classId, studentIds) => {
    const response = await api.post("/students/enroll-class", {
      classId,
      studentIds,
    });
    return response.data;
  },

  updateStudentEnrollments: async (studentId, classIds) => {
    // classIds should be an array of strings
    const response = await api.put(`/students/${studentId}/enrollments`, {
      classIds,
    });
    return response.data;
  },

  getStudentById: async (id) => {
    const response = await api.get(`/students/${id}?populate=enrolledClasses`);
    return response.data;
  },

  // Or create a separate function for getting student with classes
  getStudentWithClasses: async (id) => {
    const response = await api.get(`/students/${id}/with-classes`);
    return response.data;
  },

  uploadProfilePicture: async (studentId, imageFile) => {
    const formData = new FormData();
    formData.append("profilePicture", imageFile);

    const response = await api.put(
      `/students/${studentId}/profile-picture`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data;
  },
};
