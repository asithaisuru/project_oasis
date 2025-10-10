import api from "./api";

export const attendanceService = {
  // Get attendance records
  getAttendance: async (params = {}) => {
    const response = await api.get("/attendance", { params });
    return response.data;
  },

  // Mark attendance
  markAttendance: async (attendanceData) => {
    const response = await api.post("/attendance", attendanceData);
    return response.data;
  },

  // Bulk mark attendance
  bulkMarkAttendance: async (classId, date, status) => {
    const response = await api.post("/attendance/bulk", {
      class: classId,
      date: date,
      status: status,
    });
    return response.data;
  },

  // Get attendance statistics
  getAttendanceStats: async (classId, startDate, endDate) => {
    const response = await api.get("/attendance/stats", {
      params: { class: classId, startDate, endDate },
    });
    return response.data;
  },

  // Scan QR code and get student details - FIXED VERSION
  scanQRCode: async (qrData) => {
    // Send the QR data as a string in the qrData field
    const response = await api.post("/attendance/scan", {
      qrData: qrData,
    });
    return response.data;
  },

  getStudentCurrentPaymentStatus: async (studentId) => {
    try {
      const response = await api.get(`/payments/student/${studentId}/current`);
      return response.data;
    } catch (error) {
      console.error("Error fetching payment status:", error);
      return { success: false, data: null };
    }
  },
};
