import Student from "../models/Student.js";
import Class from "../models/Class.js";

// @desc    Get all students
// @route   GET /api/students
// @access  Private
const getStudents = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, status } = req.query;

    let query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { studentId: { $regex: search, $options: "i" } },
      ];
    }

    if (status) {
      query.status = status;
    }

    const students = await Student.find(query)
      .populate("enrolledClasses", "name subject")
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await Student.countDocuments(query);

    res.json({
      success: true,
      data: students,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalStudents: total,
      },
    });
  } catch (error) {
    console.error("Get students error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// @desc    Get single student
// @route   GET /api/students/:id
// @access  Private
const getStudent = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id).populate(
      "enrolledClasses"
    );

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    res.json({
      success: true,
      data: student,
    });
  } catch (error) {
    console.error("Get student error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// @desc    Create new student
// @route   POST /api/students
// @access  Private
const createStudent = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      grade,
      school,
      parentName,
      parentEmail,
      parentPhone,
      profilePicture,
    } = req.body;

    // Basic validation (make profilePicture optional)
    if (
      !name ||
      !email ||
      !phone ||
      !grade ||
      !school ||
      !parentName ||
      !parentPhone
    ) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    // Create student without profile picture if it's too large
    const studentData = { ...req.body };

    if (profilePicture && profilePicture.length > 1000000) {
      // ~1MB
      // Remove large profile picture - will be uploaded separately
      delete studentData.profilePicture;
    }

    const student = await Student.create(studentData);

    res.status(201).json({
      success: true,
      message: "Student created successfully",
      data: student,
      needsProfilePictureUpload: !student.profilePicture && !!profilePicture,
    });
  } catch (error) {
    console.error("Create student error:", error);
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "A student with this email address already exists.",
      });
    }
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((val) => val.message);
      return res
        .status(400)
        .json({ success: false, message: messages.join(", ") });
    }
    res.status(500).json({
      success: false,
      message: "Server error while creating student",
    });
  }
};

// @desc    Update student
// @route   PUT /api/students/:id
// @access  Private
const updateStudent = async (req, res) => {
  try {
    const student = await Student.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate("enrolledClasses");

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    res.json({
      success: true,
      data: student,
    });
  } catch (error) {
    console.error("Update student error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// @desc    Delete student
// @route   DELETE /api/students/:id
// @access  Private/Admin
const deleteStudent = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    // Check if student is enrolled in any classes
    if (student.enrolledClasses.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete student enrolled in classes",
      });
    }

    await Student.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Student deleted successfully",
    });
  } catch (error) {
    console.error("Delete student error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// @desc    Enroll student in class
// @route   POST /api/students/:id/enroll
// @access  Private
const enrollStudent = async (req, res) => {
  try {
    const { classId } = req.body;

    const student = await Student.findById(req.params.id);
    const classToEnroll = await Class.findById(classId);

    if (!student || !classToEnroll) {
      return res.status(404).json({
        success: false,
        message: "Student or class not found",
      });
    }

    // Check if already enrolled
    if (student.enrolledClasses.includes(classId)) {
      return res.status(400).json({
        success: false,
        message: "Student already enrolled in this class",
      });
    }

    // Check class capacity
    if (classToEnroll.currentStrength >= classToEnroll.capacity) {
      return res.status(400).json({
        success: false,
        message: "Class is at full capacity",
      });
    }

    // Add to student's enrolled classes
    student.enrolledClasses.push(classId);
    await student.save();

    // Add to class's students
    classToEnroll.students.push(student._id);
    await classToEnroll.save();

    res.json({
      success: true,
      message: "Student enrolled successfully",
    });
  } catch (error) {
    console.error("Enroll student error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Add to controllers/studentController.js

// @desc    Enroll students in class
// @route   POST /api/students/enroll-class
// @access  Private
export const enrollStudentsInClass = async (req, res) => {
  try {
    const { classId, studentIds } = req.body;

    if (!classId || !studentIds || !Array.isArray(studentIds)) {
      return res.status(400).json({
        success: false,
        message: "Class ID and student IDs array are required",
      });
    }

    // Update all students to include this class in their enrolledClasses
    const updatePromises = studentIds.map((studentId) =>
      Student.findByIdAndUpdate(
        studentId,
        { $addToSet: { enrolledClasses: classId } }, // Use $addToSet to avoid duplicates
        { new: true }
      )
    );

    const updatedStudents = await Promise.all(updatePromises);

    res.json({
      success: true,
      message: `Successfully enrolled ${updatedStudents.length} students in class`,
      data: updatedStudents,
    });
  } catch (error) {
    console.error("Enroll students error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// @desc    Update a student's class enrollments
// @route   PUT /api/students/:id/enrollments
// @access  Private
const updateStudentEnrollments = async (req, res) => {
  try {
    const { classIds } = req.body; // Expect an array of class IDs
    const studentId = req.params.id;

    if (!Array.isArray(classIds)) {
      return res
        .status(400)
        .json({ success: false, message: "classIds must be an array." });
    }

    const student = await Student.findById(studentId);
    if (!student) {
      return res
        .status(404)
        .json({ success: false, message: "Student not found." });
    }

    const oldClassIds = student.enrolledClasses.map((id) => id.toString());
    const newClassIds = classIds;

    const classesToRemove = oldClassIds.filter(
      (id) => !newClassIds.includes(id)
    );
    const classesToAdd = newClassIds.filter((id) => !oldClassIds.includes(id));

    // Remove student from classes they are no longer enrolled in
    if (classesToRemove.length > 0) {
      await Class.updateMany(
        { _id: { $in: classesToRemove } },
        { $pull: { students: studentId } }
      );
    }

    // Add student to new classes
    if (classesToAdd.length > 0) {
      await Class.updateMany(
        { _id: { $in: classesToAdd } },
        { $addToSet: { students: studentId } } // Use $addToSet to prevent duplicates
      );
    }

    // Finally, update the student's own list of enrolled classes
    student.enrolledClasses = newClassIds;
    await student.save();

    const updatedStudent = await Student.findById(studentId).populate(
      "enrolledClasses",
      "name subject"
    );

    res.json({
      success: true,
      message: "Student enrollments updated successfully.",
      data: updatedStudent,
    });
  } catch (error) {
    console.error("Update enrollments error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while updating enrollments.",
    });
  }
};

export const getStudentById = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id).populate(
      "enrolledClasses",
      "name fee subject grade"
    ); // Populate the enrolledClasses

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    res.status(200).json({
      success: true,
      data: student,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Upload profile picture for student
// @route   PUT /api/students/:id/profile-picture
// @access  Private
export const uploadProfilePicture = async (req, res) => {
  try {
    const { profilePicture } = req.body;
    const studentId = req.params.id;

    if (!profilePicture) {
      return res.status(400).json({
        success: false,
        message: "Profile picture data is required",
      });
    }

    // Validate base64 image size (optional)
    if (profilePicture.length > 5 * 1024 * 1024) {
      // 5MB limit for base64
      return res.status(413).json({
        success: false,
        message: "Profile picture too large. Maximum size is 5MB.",
      });
    }

    const student = await Student.findByIdAndUpdate(
      studentId,
      { profilePicture },
      { new: true, runValidators: true }
    );

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    res.json({
      success: true,
      message: "Profile picture uploaded successfully",
      data: student,
    });
  } catch (error) {
    console.error("Upload profile picture error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while uploading profile picture",
    });
  }
};

export {
  getStudents,
  getStudent,
  createStudent,
  updateStudent,
  deleteStudent,
  enrollStudent,
  updateStudentEnrollments,
};
