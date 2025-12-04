import Attendance from "../models/Attendance.js";
import Class from "../models/Class.js";
import Student from "../models/Student.js";
import mongoose from "mongoose";

// @desc    Get attendance records
// @route   GET /api/attendance
// @access  Private
export const getAttendance = async (req, res) => {
  try {
    const { class: classId, date, student } = req.query;

    let query = {};

    if (classId) query.class = classId;
    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      query.date = { $gte: startDate, $lt: endDate };
    }
    if (student) query["students.student"] = student;

    const attendance = await Attendance.find(query)
      .populate("class", "name subject grade")
      .populate("students.student", "name email studentId grade profilePicture")
      .populate("takenBy", "name")
      .sort({ date: -1, createdAt: -1 });

    console.log("🔍 Attendance query results:", {
      query,
      count: attendance.length,
      records: attendance.map(rec => ({
        date: rec.date,
        studentCount: rec.students.length,
        students: rec.students.map(s => ({
          studentId: s.student?._id,
          name: s.student?.name,
          status: s.status
        }))
      }))
    });

    res.json({
      success: true,
      data: attendance,
    });
  } catch (error) {
    console.error("Get attendance error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// @desc    Mark attendance
// @route   POST /api/attendance
// @access  Private
export const markAttendance = async (req, res) => {
  try {
    const {
      class: classId,
      date,
      student: studentId,
      status,
      notes,
    } = req.body;

    // Find or create attendance record for the class and date
    const attendanceDate = new Date(date);
    const startOfDay = new Date(attendanceDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(attendanceDate.setHours(23, 59, 59, 999));

    let attendance = await Attendance.findOne({
      class: classId,
      date: { $gte: startOfDay, $lte: endOfDay },
    });

    if (!attendance) {
      attendance = new Attendance({
        class: classId,
        date: startOfDay,
        takenBy: req.user._id,
        students: [],
      });
    }

    // Check if student already has attendance marked
    const studentIndex = attendance.students.findIndex(
      (s) => s.student.toString() === studentId
    );

    const currentTime = new Date(); // Get current time

    if (studentIndex > -1) {
      // Update existing record
      attendance.students[studentIndex].status = status;
      attendance.students[studentIndex].notes = notes || "";
      attendance.students[studentIndex].timestamp = currentTime; // Update timestamp
    } else {
      // Add new student attendance
      attendance.students.push({
        student: studentId,
        status: status,
        notes: notes || "",
        timestamp: currentTime, // Set timestamp
      });
    }

    await attendance.save();

    // Populate the response
    await attendance.populate("students.student", "name email studentId grade");
    await attendance.populate("class", "name subject grade");

    res.json({
      success: true,
      message: "Attendance marked successfully",
      data: attendance,
    });
  } catch (error) {
    console.error("Mark attendance error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// @desc    Bulk mark attendance
// @route   POST /api/attendance/bulk
// @access  Private
export const bulkMarkAttendance = async (req, res) => {
  try {
    const { class: classId, date, status } = req.body;

    const classStudents = await Student.find({ enrolledClasses: classId });
    
    const attendanceDate = new Date(date);
    const startOfDay = new Date(attendanceDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(attendanceDate.setHours(23, 59, 59, 999));

    let attendance = await Attendance.findOne({
      class: classId,
      date: { $gte: startOfDay, $lte: endOfDay }
    });

    if (!attendance) {
      attendance = new Attendance({
        class: classId,
        date: startOfDay,
        takenBy: req.user._id,
        students: []
      });
    }

    const currentTime = new Date(); // Get current time for bulk marking

    // Mark all students with the specified status
    for (const student of classStudents) {
      const studentIndex = attendance.students.findIndex(
        s => s.student.toString() === student._id.toString()
      );

      if (studentIndex > -1) {
        attendance.students[studentIndex].status = status;
        attendance.students[studentIndex].timestamp = currentTime; // Update timestamp
      } else {
        attendance.students.push({
          student: student._id,
          status: status,
          notes: `Bulk marked ${status}`,
          timestamp: currentTime // Set timestamp
        });
      }
    }

    await attendance.save();
    
    res.json({
      success: true,
      message: `Bulk attendance marked as ${status}`,
      data: attendance
    });
  } catch (error) {
    console.error('Bulk mark attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Scan QR code and get student details
// @route   POST /api/attendance/scan
// @access  Private
export const scanQRCode = async (req, res) => {
  try {
    const { qrData } = req.body;

    console.log("🔍 QR Scan Request Received");
    console.log("QR Data received:", qrData);
    console.log("Full request body:", req.body);

    if (!qrData) {
      return res.status(400).json({
        success: false,
        message:
          "No QR data provided in request. Received: " +
          JSON.stringify(req.body),
      });
    }

    let parsedData;
    try {
      // Check if qrData is already an object or needs parsing
      if (typeof qrData === "string") {
        parsedData = JSON.parse(qrData);
      } else if (typeof qrData === "object") {
        parsedData = qrData; // It's already parsed
      } else {
        throw new Error("QR data must be a string or object");
      }
      console.log("✅ Successfully parsed QR data:", parsedData);
    } catch (parseError) {
      console.log("❌ JSON parse error:", parseError.message);
      return res.status(400).json({
        success: false,
        message: "Invalid QR code format: " + parseError.message,
      });
    }

    // Extract studentId from different possible field names
    const studentId = parsedData.studentId || parsedData.studentID;
    const type = parsedData.type;

    console.log("📋 Extracted fields - studentId:", studentId, "type:", type);

    if (!type) {
      return res.status(400).json({
        success: false,
        message:
          "QR code missing type field. Available fields: " +
          Object.keys(parsedData).join(", "),
      });
    }

    if (type !== "student_attendance") {
      return res.status(400).json({
        success: false,
        message:
          "Invalid QR code type. Expected: student_attendance, Got: " + type,
      });
    }

    if (!studentId) {
      return res.status(400).json({
        success: false,
        message:
          "Student ID not found in QR code. Available fields: " +
          Object.keys(parsedData).join(", "),
      });
    }

    console.log("🔎 Looking for student with ID:", studentId);

    // Get student details with all information
    const student = await Student.findById(studentId)
      .populate("enrolledClasses", "name grade subject")
      .select(
        "name email studentId phone parentName parentPhone address grade school status profilePicture feeStatus feeAmount enrolledClasses"
      );

    if (!student) {
      console.log("❌ Student not found with ID:", studentId);
      return res.status(404).json({
        success: false,
        message: "Student not found with ID: " + studentId,
      });
    }

    console.log("✅ Found student:", student.name);

    res.json({
      success: true,
      message: "QR code scanned successfully",
      data: {
        student: student,
        scanned: true,
      },
    });
  } catch (error) {
    console.error("❌ QR scan attendance error:", error);
    res.status(500).json({
      success: false,
      message: "Server error: " + error.message,
    });
  }
};

// @desc    Get attendance statistics
// @route   GET /api/attendance/stats
// @access  Private
export const getAttendanceStats = async (req, res) => {
  try {
    const { class: classId, startDate, endDate } = req.query;

    const stats = await Attendance.aggregate([
      {
        $match: {
          class: new mongoose.Types.ObjectId(classId),
          date: {
            $gte: new Date(startDate),
            $lte: new Date(endDate),
          },
        },
      },
      {
        $unwind: "$students",
      },
      {
        $group: {
          _id: "$students.status",
          count: { $sum: 1 },
        },
      },
    ]);

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("Get attendance stats error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
