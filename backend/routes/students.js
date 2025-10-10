import express from 'express';
import { body } from 'express-validator';
import {
  getStudents,
  getStudent,
  createStudent,
  updateStudent,
  deleteStudent,
  enrollStudent,
  enrollStudentsInClass,
  updateStudentEnrollments,
  uploadProfilePicture
} from '../controllers/studentController.js';
import { protect, admin } from '../middleware/auth.js';
import { handleValidationErrors } from '../middleware/validation.js';

const router = express.Router();

router.route('/')
  .get(protect, getStudents)
  .post(
    [
      body('name').notEmpty().trim(),
      body('email').isEmail().normalizeEmail(),
      body('phone').notEmpty(),
      body('parentName').notEmpty(),
      body('parentPhone').notEmpty(),
      body('grade').notEmpty(),
      body('school').notEmpty()
    ],
    handleValidationErrors,
    protect,
    createStudent
  );

router.route('/:id')
  .get(protect, getStudent)
  .put(protect, updateStudent)
  .delete(protect, admin, deleteStudent);

router.post('/:id/enroll', protect, enrollStudent);
router.post('/enroll-class', protect, enrollStudentsInClass);
router.route('/:id/enrollments').put(protect, updateStudentEnrollments);
router.put('/:id/profile-picture', protect, uploadProfilePicture);

export default router;