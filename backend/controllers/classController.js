import Class from '../models/Class.js';
import Teacher from '../models/Teacher.js';
import Student from '../models/Student.js';

// @desc    Get all classes
// @route   GET /api/classes
// @access  Private
const getClasses = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, status, subject, grade } = req.query;
    
    let query = {};
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } },
        { classId: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (status && status !== 'all') {
      query.status = status;
    }

    if (subject && subject !== 'all') {
      query.subject = subject;
    }

    if (grade && grade !== 'all') {
      query.grade = grade;
    }

    const classes = await Class.find(query)
      .populate('teacher', 'name email')
      .populate('students', 'name email studentId')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await Class.countDocuments(query);

    res.json({
      success: true,
      data: classes,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalClasses: total
      }
    });
  } catch (error) {
    console.error('Get classes error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get single class
// @route   GET /api/classes/:id
// @access  Private
const getClass = async (req, res) => {
  try {
    const classData = await Class.findById(req.params.id)
      .populate('teacher', 'name email phone subjects')
      .populate('students', 'name email studentId phone grade');

    if (!classData) {
      return res.status(404).json({
        success: false,
        message: 'Class not found'
      });
    }

    res.json({
      success: true,
      data: classData
    });
  } catch (error) {
    console.error('Get class error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Create new class
// @route   POST /api/classes
// @access  Private/Admin
const createClass = async (req, res) => {
  try {
    const { name, subject, grade, teacher, schedule, fee } = req.body;

    // Validate required fields
    if (!name || !subject || !grade || !teacher || !fee) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: name, subject, grade, teacher, fee'
      });
    }

    // Validate schedule if provided
    if (schedule) {
      if (schedule.days && schedule.days.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Please provide at least one day for the schedule'
        });
      }
    }

    const classData = await Class.create({
      name,
      subject,
      grade,
      teacher,
      schedule: schedule || { days: [], startTime: '', endTime: '' },
      fee
    });

    // Populate the teacher field in response
    await classData.populate('teacher', 'name email');

    res.status(201).json({
      success: true,
      message: 'Class created successfully',
      data: classData
    });
  } catch (error) {
    console.error('Create class error:', error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', ')
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update class
// @route   PUT /api/classes/:id
// @access  Private/Admin
const updateClass = async (req, res) => {
  try {
    const { name, subject, grade, teacher, schedule, fee, status } = req.body;

    const updateData = {};
    if (name) updateData.name = name;
    if (subject) updateData.subject = subject;
    if (grade) updateData.grade = grade;
    if (teacher) updateData.teacher = teacher;
    if (schedule) updateData.schedule = schedule;
    if (fee) updateData.fee = fee;
    if (status) updateData.status = status;

    const classData = await Class.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('teacher', 'name email').populate('students', 'name email');

    if (!classData) {
      return res.status(404).json({
        success: false,
        message: 'Class not found'
      });
    }

    res.json({
      success: true,
      message: 'Class updated successfully',
      data: classData
    });
  } catch (error) {
    console.error('Update class error:', error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', ')
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Delete class
// @route   DELETE /api/classes/:id
// @access  Private/Admin
const deleteClass = async (req, res) => {
  try {
    const classData = await Class.findById(req.params.id);

    if (!classData) {
      return res.status(404).json({
        success: false,
        message: 'Class not found'
      });
    }

    // Check if class has students
    if (classData.students.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete class with enrolled students'
      });
    }

    await Class.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Class deleted successfully'
    });
  } catch (error) {
    console.error('Delete class error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Add student to class
// @route   POST /api/classes/:id/students
// @access  Private/Admin
const addStudentToClass = async (req, res) => {
  try {
    const { studentId } = req.body;
    
    if (!studentId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide student ID'
      });
    }

    const classData = await Class.findById(req.params.id);
    if (!classData) {
      return res.status(404).json({
        success: false,
        message: 'Class not found'
      });
    }

    // Check if student is already enrolled
    if (classData.students.includes(studentId)) {
      return res.status(400).json({
        success: false,
        message: 'Student is already enrolled in this class'
      });
    }

    // Add student to class
    classData.students.push(studentId);
    await classData.save();

    await classData.populate('students', 'name email studentId');

    res.json({
      success: true,
      message: 'Student added to class successfully',
      data: classData
    });
  } catch (error) {
    console.error('Add student to class error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Remove student from class
// @route   DELETE /api/classes/:id/students/:studentId
// @access  Private/Admin
const removeStudentFromClass = async (req, res) => {
  try {
    const classData = await Class.findById(req.params.id);
    if (!classData) {
      return res.status(404).json({
        success: false,
        message: 'Class not found'
      });
    }

    // Remove student from class
    classData.students = classData.students.filter(
      student => student.toString() !== req.params.studentId
    );
    await classData.save();

    await classData.populate('students', 'name email studentId');

    res.json({
      success: true,
      message: 'Student removed from class successfully',
      data: classData
    });
  } catch (error) {
    console.error('Remove student from class error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

export {
  getClasses,
  getClass,
  createClass,
  updateClass,
  deleteClass,
  addStudentToClass,
  removeStudentFromClass
};