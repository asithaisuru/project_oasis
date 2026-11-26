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
import { protect, admin } from '../middleware/auth.js';

const router = express.Router();

// Original CRUD routes
router.route('/')
  .get(protect, admin, getPayments)
  .post(protect, admin, createPayment);

router.route('/:id')
  .get(protect, admin, getPaymentById)
  .put(protect, admin, updatePayment)
  .delete(protect, admin, deletePayment);

// New automated payment generation routes
router.post('/generate/student', protect, admin, generateStudentPayments);
router.post('/generate/class', protect, admin, generateClassPayments);
router.post('/generate/bulk', protect, admin, generateBulkPayments);

// Original routes
router.patch('/:id/mark-paid', protect, admin, markPaymentAsPaid);
router.get('/student/:studentId', protect, admin, getPaymentsByStudent);
router.get('/class/:classId', protect, admin, getPaymentsByClass);

// Add this with your other routes
router.patch('/:id/revert-pending', protect, admin, revertPaymentToPending);

router.get('/student/:studentId/current', protect, getStudentCurrentPaymentStatus);

export default router;