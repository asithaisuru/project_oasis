import express from "express";
import { body } from "express-validator";
import {
  getTeachers,
  getTeacher,
  createTeacher,
  updateTeacher,
  deleteTeacher,
} from "../controllers/teacherController.js";
import { protect, admin } from "../middleware/auth.js";
import { handleValidationErrors } from "../middleware/validation.js";

const router = express.Router();

router
  .route("/")
  .get(protect, getTeachers)
  .post(
    [
      body("name").notEmpty().withMessage("Name is required").trim(),
      body("email")
        .isEmail()
        .withMessage("Valid email is required")
        .normalizeEmail(),
      body("phone").notEmpty().withMessage("Phone is required"),
      // Remove subject validation temporarily for testing
    ],
    handleValidationErrors,
    protect,
    admin,
    createTeacher
  );

router
  .route("/:id")
  .get(protect, getTeacher)
  .put(protect, admin, updateTeacher)
  .delete(protect, admin, deleteTeacher);

export default router;
