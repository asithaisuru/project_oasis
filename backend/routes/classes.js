import express from 'express';
import { body } from 'express-validator';
import {
  getClasses,
  getClass,
  createClass,
  updateClass,
  deleteClass
} from '../controllers/classController.js';
import { protect, admin } from '../middleware/auth.js';
import { handleValidationErrors } from '../middleware/validation.js';

const router = express.Router();

router.route('/')
  .get(protect, getClasses)
  .post(
    [
      body('name').notEmpty().trim(),
      body('subject').notEmpty(),
      body('grade').notEmpty(),
      body('teacher').isMongoId(),
      body('fee').isNumeric()
    ],
    handleValidationErrors,
    protect,
    admin,
    createClass
  );

router.route('/:id')
  .get(protect, getClass)
  .put(protect, admin, updateClass)
  .delete(protect, admin, deleteClass);

export default router;