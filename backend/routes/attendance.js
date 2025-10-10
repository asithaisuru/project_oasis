import express from 'express';
import { body } from 'express-validator';
import {
  getAttendance,
  markAttendance,
  bulkMarkAttendance,
  getAttendanceStats,
  scanQRCode
} from '../controllers/attendanceController.js';
import { protect } from '../middleware/auth.js';
import { handleValidationErrors } from '../middleware/validation.js';

const router = express.Router();

router.get('/', protect, getAttendance);
router.post('/', protect, markAttendance);
router.post('/bulk', protect, bulkMarkAttendance);
router.get('/stats', protect, getAttendanceStats);
router.post('/scan', protect, scanQRCode);

export default router;