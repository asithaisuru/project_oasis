import api from "./api";

export const paymentService = {
  // Get all payments
  getPayments: async () => {
    const response = await api.get("/payments");
    return response.data;
  },

  // Get payment by ID
  getPaymentById: async (id) => {
    const response = await api.get(`/payments/${id}`);
    return response.data;
  },

  // Create payment
  createPayment: async (paymentData) => {
    const response = await api.post("/payments", paymentData);
    return response.data;
  },

  // Update payment
  updatePayment: async (id, paymentData) => {
    const response = await api.put(`/payments/${id}`, paymentData);
    return response.data;
  },

  // Mark payment as paid
  markPaymentAsPaid: async (id, paymentData) => {
    const response = await api.patch(`/payments/${id}/mark-paid`, paymentData);
    return response.data;
  },

  // Delete payment
  deletePayment: async (id) => {
    const response = await api.delete(`/payments/${id}`);
    return response.data;
  },

  // Get payments by student
  getPaymentsByStudent: async (studentId) => {
    const response = await api.get(`/payments/student/${studentId}`);
    return response.data;
  },

  // Get payments by class
  getPaymentsByClass: async (classId) => {
    const response = await api.get(`/payments/class/${classId}`);
    return response.data;
  },

  generateStudentPayments: async (generationData) => {
    const response = await api.post(
      "/payments/generate/student",
      generationData
    );
    return response.data;
  },

  generateClassPayments: async (generationData) => {
    const response = await api.post("/payments/generate/class", generationData);
    return response.data;
  },

  generateBulkPayments: async (generationData) => {
    const response = await api.post("/payments/generate/bulk", generationData);
    return response.data;
  },

  // Add this to your paymentService
  revertPaymentToPending: async (id) => {
    const response = await api.patch(`/payments/${id}/revert-pending`);
    return response.data;
  },
};
