import express from 'express';
import {
    getGrades,
    getGrade,
    createGrade,
    updateGrade,
    deleteGrade,
    getGradesByStudent,
    getGradesByClass,
    publishGrade,
    bulkPublishGrades,
} from '../controllers/gradeController.js';
import { protect, admin } from '../middleware/auth.js';

const router = express.Router();

router.route('/')
    .get(protect, getGrades)
    .post(protect, createGrade);

router.route('/:id')
    .get(protect, getGrade)
    .put(protect, updateGrade)
    .delete(protect, admin, deleteGrade);

router.route('/student/:studentId')
    .get(protect, getGradesByStudent);

router.route('/class/:classId')
    .get(protect, getGradesByClass);

router.post('/:id/publish', publishGrade);
router.post('/class/:classId/publish-bulk', bulkPublishGrades);
export default router;