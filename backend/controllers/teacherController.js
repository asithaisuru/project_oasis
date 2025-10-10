import Teacher from "../models/Teacher.js";
import Class from "../models/Class.js";

// @desc    Get all teachers
// @route   GET /api/teachers
// @access  Private
const getTeachers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, status } = req.query;

    let query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { teacherId: { $regex: search, $options: "i" } },
        { subject: { $regex: search, $options: "i" } },
      ];
    }

    if (status && status !== "all") {
      query.status = status;
    }

    const teachers = await Teacher.find(query)
      .populate("assignedClasses", "name subject grade schedule")
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await Teacher.countDocuments(query);

    res.json({
      success: true,
      data: teachers,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalTeachers: total,
      },
    });
  } catch (error) {
    console.error("Get teachers error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// @desc    Get single teacher
// @route   GET /api/teachers/:id
// @access  Private
const getTeacher = async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.params.id).populate(
      "assignedClasses"
    );

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: "Teacher not found",
      });
    }

    res.json({
      success: true,
      data: teacher,
    });
  } catch (error) {
    console.error("Get teacher error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// @desc    Create new teacher
// @route   POST /api/teachers
// @access  Private/Admin
const createTeacher = async (req, res) => {
  try {
    // console.log("=== TEACHER CREATE REQUEST START ===");
    // console.log("Headers:", JSON.stringify(req.headers, null, 2));
    // console.log("Body received:", JSON.stringify(req.body, null, 2));
    // console.log("Body keys:", Object.keys(req.body));
    // console.log("=== TEACHER CREATE REQUEST END ===");

    // Try with minimal data first
    const teacherData = {
      name: req.body.name,
      email: req.body.email,
      phone: req.body.phone,
      subject: req.body.subject,
      status: req.body.status || "active",
      teacherId: req.body.teacherId || `TCH${Date.now()}`,
      hireDate: req.body.hireDate || new Date(),
    };

    console.log("Attempting to create teacher with:", teacherData);

    const teacher = await Teacher.create(teacherData);

    console.log("Teacher created successfully:", teacher._id);

    res.status(201).json({
      success: true,
      message: "Teacher created successfully",
      data: teacher,
    });
  } catch (error) {
    console.error("=== TEACHER CREATE ERROR ===");
    console.error("Error name:", error.name);
    console.error("Error message:", error.message);

    if (error.name === "ValidationError") {
      console.error("Validation errors:");
      Object.values(error.errors).forEach((err) => {
        console.error(`- ${err.path}: ${err.message} (value: ${err.value})`);
      });
    }

    console.error("Full error stack:", error.stack);
    console.error("=== END ERROR ===");

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Teacher with this email already exists",
      });
    }

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((val) => ({
        field: val.path,
        message: val.message,
        value: val.value,
      }));

      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: messages,
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error while creating teacher",
    });
  }
};

// @desc    Update teacher
// @route   PUT /api/teachers/:id
// @access  Private/Admin
const updateTeacher = async (req, res) => {
  try {
    const teacher = await Teacher.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate("assignedClasses", "name subject grade schedule");

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: "Teacher not found",
      });
    }

    res.json({
      success: true,
      message: "Teacher updated successfully",
      data: teacher,
    });
  } catch (error) {
    console.error("Update teacher error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// @desc    Delete teacher
// @route   DELETE /api/teachers/:id
// @access  Private/Admin
const deleteTeacher = async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.params.id);

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: "Teacher not found",
      });
    }

    // Check if teacher has assigned classes
    if (teacher.assignedClasses.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete teacher with assigned classes",
      });
    }

    await Teacher.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Teacher deleted successfully",
    });
  } catch (error) {
    console.error("Delete teacher error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

export { getTeachers, getTeacher, createTeacher, updateTeacher, deleteTeacher };
