import express from 'express';
import {
  // Original CRUD functions
  getPayments,
  getPaymentById,
  createPayment,
  updatePayment,
  markPaymentAsPaid,
  deletePayment,
  getPaymentsByStudent,
  getPaymentsByClass,
  // New automated payment generation functions
  generateStudentPayments,
  generateClassPayments,
  generateBulkPayments,
  revertPaymentToPending,
  getStudentCurrentPaymentStatus
} from '../controllers/paymentController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Original CRUD routes
router.route('/')
  .get(protect, getPayments)
  .post(protect, createPayment);

router.route('/:id')
  .get(protect, getPaymentById)
  .put(protect, updatePayment)
  .delete(protect, deletePayment);

// New automated payment generation routes
router.post('/generate/student', protect, generateStudentPayments);
router.post('/generate/class', protect, generateClassPayments);
router.post('/generate/bulk', protect, generateBulkPayments);

// Original routes
router.patch('/:id/mark-paid', protect, markPaymentAsPaid);
router.get('/student/:studentId', protect, getPaymentsByStudent);
router.get('/class/:classId', protect, getPaymentsByClass);

// Add this with your other routes
router.patch('/:id/revert-pending', protect, revertPaymentToPending);

router.get('/student/:studentId/current', protect, getStudentCurrentPaymentStatus);

export default router;