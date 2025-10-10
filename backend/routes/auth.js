import express from 'express';
import { body } from 'express-validator';
import {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile
} from '../controllers/authController.js';
import { admin, protect } from '../middleware/auth.js';
import { handleValidationErrors } from '../middleware/validation.js';

const router = express.Router();

router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 })
  ],
  handleValidationErrors,
  loginUser
);

router.post(
  '/register',
  [
    body('name').notEmpty().trim(),
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 })
  ],
  handleValidationErrors,
  protect,
  admin,
  registerUser
);

router.route('/profile')
  .get(protect, getUserProfile)
  .put(
    protect,
    [
      body('name').optional().notEmpty().trim(),
      body('email').optional().isEmail().normalizeEmail(),
      body('phone').optional().trim(),
      body('password').optional().isLength({ min: 6 })
    ],
    handleValidationErrors,
    updateUserProfile
  );

export default router;