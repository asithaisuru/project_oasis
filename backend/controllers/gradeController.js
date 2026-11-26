import { escapeHtml } from '../utils/html.js';
import { scopeFor } from '../middleware/dataScope.js';
import Grade from '../models/Grade.js';
import Student from '../models/Student.js';
import Class from '../models/Class.js';
import { queueEmail } from '../utils/emailOutbox.js';
// import { sendTestEmail as sendEmail } from '../utils/testEmailService.js';

// @desc    Get all grades
// @route   GET /api/grades
// @access  Private
const getGrades = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search, 
      studentId, 
      classId, 
      subject,
      grade,
      examType,
      sortBy = 'examDate',
      sortOrder = 'desc'
    } = req.query;
    
    let query = {};
    
    // Search functionality
    if (search) {
      query.$or = [
        { gradeId: { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } },
        { comments: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Filter by student
    if (studentId && studentId !== 'all') {
      query.student = studentId;
    }
    
    // Filter by class
    if (classId && classId !== 'all') {
      query.class = classId;
    }
    
    // Filter by subject
    if (subject && subject !== 'all') {
      query.subject = subject;
    }
    
    // Filter by grade
    if (grade && grade !== 'all') {
      query.grade = grade;
    }
    
    // Filter by exam type
    if (examType && examType !== 'all') {
      query.examType = examType;
    }

    // Sorting
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const grades = await Grade.find(query).and([scopeFor('Grade', req)])
      .populate('student', 'name email studentId grade')
      .populate('class', 'name subject grade classId')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort(sort);

    const total = await Grade.countDocuments(query).and([scopeFor('Grade', req)]);

    res.json({
      success: true,
      data: grades,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalGrades: total
      }
    });
  } catch (error) {
    console.error('Get grades error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get single grade
// @route   GET /api/grades/:id
// @access  Private
const getGrade = async (req, res) => {
  try {
    const grade = await Grade.findById(req.params.id).and([scopeFor('Grade', req)])
      .populate('student', 'name email studentId phone grade')
      .populate('class', 'name subject grade teacher schedule');

    if (!grade) {
      return res.status(404).json({
        success: false,
        message: 'Grade not found'
      });
    }

    res.json({
      success: true,
      data: grade
    });
  } catch (error) {
    console.error('Get grade error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Create new grade
// @route   POST /api/grades
// @access  Private/Admin/Teacher
const createGrade = async (req, res) => {
  try {
    const { student, class: classId, subject, grade: gradeValue, marks, examType, weightage, comments, examDate } = req.body;

    // Validate required fields
    if (!student || !classId || !subject || !gradeValue || marks === undefined || !examType) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: student, class, subject, grade, marks, examType'
      });
    }

    // Validate marks range
    if (marks < 0 || marks > 100) {
      return res.status(400).json({
        success: false,
        message: 'Marks must be between 0 and 100'
      });
    }

    // Check if student exists
    const studentExists = await Student.findById(student).and([scopeFor('Student', req)]);
    if (!studentExists) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Check if class exists
    const classExists = await Class.findById(classId).and([scopeFor('Class', req)]);
    if (!classExists) {
      return res.status(404).json({
        success: false,
        message: 'Class not found'
      });
    }

    const grade = await Grade.create({
      student,
      class: classId,
      subject,
      grade: gradeValue,
      marks: parseFloat(marks),
      examType,
      weightage: weightage || 100,
      comments: comments || '',
      examDate: examDate ? new Date(examDate) : new Date()
    });

    // Populate references in response
    await grade.populate('student', 'name email studentId');
    await grade.populate('class', 'name subject');

    res.status(201).json({
      success: true,
      message: 'Grade created successfully',
      data: grade
    });
  } catch (error) {
    console.error('Create grade error:', error);
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

// @desc    Update grade
// @route   PUT /api/grades/:id
// @access  Private/Admin/Teacher
const updateGrade = async (req, res) => {
  try {
    const { subject, grade: gradeValue, marks, examType, weightage, comments, isPublished } = req.body;

    const updateData = {};
    if (subject) updateData.subject = subject;
    if (gradeValue) updateData.grade = gradeValue;
    if (marks !== undefined) updateData.marks = parseFloat(marks);
    if (examType) updateData.examType = examType;
    if (weightage) updateData.weightage = weightage;
    if (comments !== undefined) updateData.comments = comments;
    if (isPublished !== undefined) return res.status(400).json({ success: false, message: 'Use the explicit publishing endpoint to preserve publication timestamps' });

    const grade = await Grade.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).and([scopeFor('Grade', req)])
    .populate('student', 'name email studentId')
    .populate('class', 'name subject');

    if (!grade) {
      return res.status(404).json({
        success: false,
        message: 'Grade not found'
      });
    }

    res.json({
      success: true,
      message: 'Grade updated successfully',
      data: grade
    });
  } catch (error) {
    console.error('Update grade error:', error);
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

// @desc    Delete grade
// @route   DELETE /api/grades/:id
// @access  Private/Admin
const deleteGrade = async (req, res) => {
  try {
    const grade = await Grade.findById(req.params.id).and([scopeFor('Grade', req)]);

    if (!grade) {
      return res.status(404).json({
        success: false,
        message: 'Grade not found'
      });
    }

    await Grade.findByIdAndDelete(req.params.id).and([scopeFor('Grade', req)]);

    res.json({
      success: true,
      message: 'Grade deleted successfully'
    });
  } catch (error) {
    console.error('Delete grade error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get grades by student
// @route   GET /api/grades/student/:studentId
// @access  Private
const getGradesByStudent = async (req, res) => {
  try {
    const grades = await Grade.find({ student: req.params.studentId }).and([scopeFor('Grade', req)])
      .populate('class', 'name subject grade teacher')
      .sort({ examDate: -1 });

    res.json({
      success: true,
      data: grades
    });
  } catch (error) {
    console.error('Get grades by student error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get grades by class
// @route   GET /api/grades/class/:classId
// @access  Private
const getGradesByClass = async (req, res) => {
  try {
    const { subject, examType } = req.query;
    
    let query = { class: req.params.classId };
    
    if (subject && subject !== 'all') {
      query.subject = subject;
    }
    
    if (examType && examType !== 'all') {
      query.examType = examType;
    }

    const grades = await Grade.find(query).and([scopeFor('Grade', req)])
      .populate('student', 'name email studentId grade')
      .sort({ marks: -1 });

    res.json({
      success: true,
      data: grades
    });
  } catch (error) {
    console.error('Get grades by class error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};


// @desc    Publish grade and send email notification
// @route   POST /api/grades/:id/publish
// @access  Private/Admin/Teacher
async function publishOne(id, req) {
  const timestamp = new Date();
  let grade = await Grade.findOneAndUpdate({ _id: id, isPublished: { $ne: true } }, { $set: { isPublished: true, publishedAt: timestamp, notificationPending: true } }, { new: true }).and([scopeFor('Grade', req)]).populate('student').populate('class');
  if (!grade) grade = await Grade.findById(id).and([scopeFor('Grade', req)]).populate('student').populate('class');
  return grade;
}
export const publishGrade = async (req, res, next) => {
  try {
    const grade = await publishOne(req.params.id, req);
    if (!grade) return res.status(404).json({ success: false, message: 'Grade not found' });
    const delivery = await sendGradeEmail(grade, [grade.student?.email, grade.student?.parentEmail]);
    res.json({ success: true, message: 'Grade published successfully', data: grade, ...delivery });
  } catch (error) { next(error); }
};
export const bulkPublishGrades = async (req, res, next) => {
  try {
    const query = { class: req.params.classId };
    for (const field of ['examType', 'subject']) if (req.body[field] && req.body[field] !== 'all') query[field] = req.body[field];
    const grades = await Grade.find(query).and([scopeFor('Grade', req)]).select('_id');
    if (!grades.length) return res.status(404).json({ success: false, message: 'No grades found for these criteria' });
    const published = [];
    for (const item of grades) {
      const grade = await publishOne(item._id, req);
      if (!grade) continue;
      await sendGradeEmail(grade, [grade.student?.email, grade.student?.parentEmail]);
      published.push(grade);
    }
    res.json({ success: true, message: `${published.length} grades published successfully`, data: published });
  } catch (error) { next(error); }
};

// @desc    Send grade email notification
// @route   Internal function
// @access  Private
export const sendGradeEmail = async (grade, recipients) => {
  if (!grade.student) return { emailSent: false, emailPending: false };
  // Determine performance message
  let performanceMessage = '';
  let performanceColor = '#000';
  
  if (grade.marks >= 85) {
    performanceMessage = 'Excellent performance!';
    performanceColor = '#16a34a'; // Green
  } else if (grade.marks >= 75) {
    performanceMessage = 'Good performance!';
    performanceColor = '#2563eb'; // Blue
  } else if (grade.marks >= 65) {
    performanceMessage = 'Satisfactory performance.';
    performanceColor = '#f59e0b'; // Yellow
  } else if (grade.marks >= 50) {
    performanceMessage = 'Needs improvement.';
    performanceColor = '#f97316'; // Orange
  } else {
    performanceMessage = 'Needs attention.';
    performanceColor = '#dc2626'; // Red
  }
  
  // HTML email template
  const emailHtml = `
    <div style="font-family: Arial, sans-serif; color: #333; background-color: #f7f9fc; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto; background: #fff; border-radius: 8px; overflow: hidden;">
        <div style="background: #7c3aed; color: #fff; text-align: center; padding: 20px;">
          <h1 style="margin: 0; font-size: 22px;">📚 Grade Published Notification</h1>
          <p style="margin: 5px 0 0; opacity: 0.9;">${escapeHtml(grade.class?.name || grade.subject)} - ${escapeHtml(grade.examType.charAt(0).toUpperCase() + grade.examType.slice(1))} Exam</p>
        </div>

        <div style="padding: 25px;">
          <p>Dear ${escapeHtml(grade.student.name)},</p>
          <p>Your ${escapeHtml(grade.subject)} ${escapeHtml(grade.examType)} grade has been published.</p>
          
          <!-- Grade Summary Card -->
          <div style="background: #f8fafc; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid ${escapeHtml(performanceColor)};">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
              <div>
                <h3 style="margin: 0; color: #1e293b;">${escapeHtml(grade.subject)}</h3>
                <p style="margin: 5px 0; color: #64748b; font-size: 14px;">
                  ${escapeHtml(grade.examType.charAt(0).toUpperCase() + grade.examType.slice(1))} Exam • ${escapeHtml(grade.class?.name || '')}
                </p>
              </div>
              <div style="text-align: center;">
                <div style="font-size: 32px; font-weight: bold; color: ${escapeHtml(performanceColor)};">${escapeHtml(grade.marks)}%</div>
                <div style="font-size: 14px; color: #64748b;">Marks Obtained</div>
              </div>
            </div>
            
            <div style="display: flex; gap: 20px; margin-top: 15px;">
              <div>
                <div style="font-size: 12px; color: #64748b;">Grade</div>
                <div style="font-size: 18px; font-weight: bold; color: #1e293b;">${escapeHtml(grade.grade)}</div>
              </div>
              <div>
                <div style="font-size: 12px; color: #64748b;">Weightage</div>
                <div style="font-size: 18px; font-weight: bold; color: #1e293b;">${escapeHtml(grade.weightage)}%</div>
              </div>
              <div>
                <div style="font-size: 12px; color: #64748b;">Exam Date</div>
                <div style="font-size: 18px; font-weight: bold; color: #1e293b;">
                  ${escapeHtml(new Date(grade.examDate).toLocaleDateString())}
                </div>
              </div>
            </div>
            
            <!-- Performance Message -->
            <div style="margin-top: 15px; padding: 10px; background: ${escapeHtml(performanceColor)}15; border-radius: 6px; border: 1px solid ${escapeHtml(performanceColor)}30;">
              <p style="margin: 0; color: ${escapeHtml(performanceColor)}; font-weight: bold;">
                ${escapeHtml(performanceMessage)}
              </p>
            </div>
          </div>

          <!-- Comments -->
          ${grade.comments ? `
          <div style="margin: 20px 0; padding: 15px; background: #f1f5f9; border-radius: 6px;">
            <h4 style="margin: 0 0 10px; color: #334155;">Teacher's Comments</h4>
            <p style="margin: 0; color: #475569;">"${escapeHtml(grade.comments)}"</p>
          </div>
          ` : ''}

          <!-- Additional Info -->
          <div style="background: #f8fafc; border-radius: 6px; padding: 15px; margin-top: 20px;">
            <h4 style="margin: 0 0 10px; color: #334155;">Additional Information</h4>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; color: #64748b;">Student ID</td>
                <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; font-weight: bold;">${escapeHtml(grade.student.studentId || 'N/A')}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; color: #64748b;">Class</td>
                <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; font-weight: bold;">${escapeHtml(grade.class?.name || 'N/A')}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; color: #64748b;">Grade Level</td>
                <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; font-weight: bold;">Grade ${escapeHtml(grade.student.grade || grade.class?.gradeLevel || 'N/A')}</td>
              </tr>
              <tr>
                <td style="padding: 8px; color: #64748b;">Published On</td>
                <td style="padding: 8px; font-weight: bold;">
                  ${escapeHtml(new Date(grade.publishedAt).toLocaleDateString())} at ${escapeHtml(new Date(grade.publishedAt).toLocaleTimeString())}
                </td>
              </tr>
            </table>
          </div>

          <!-- Action Buttons -->
          <div style="margin-top: 25px; text-align: center;">
            <a href="#" style="display: inline-block; background: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
              View Detailed Report
            </a>
          </div>

          <p style="margin-top: 25px; color: #64748b;">
            If you have any questions about this grade, please contact your subject teacher or class coordinator.
          </p>
          
          <p style="font-size: 14px; color: #555; margin-top: 30px;">
            Best regards,<br>
            <strong>${escapeHtml(grade.class?.teacher?.name || 'The Teaching Staff')}</strong><br>
            <span style="color: #7c3aed;">Oasis Institute of Higher Education</span>
          </p>
        </div>

        <div style="background: #f1f5f9; text-align: center; padding: 15px; font-size: 12px; color: #64748b;">
          <p style="margin: 5px 0;">
            This is an automated notification. Please do not reply to this email.
          </p>
          <p style="margin: 5px 0;">
            © ${escapeHtml(new Date().getFullYear())} Oasis Institute of Higher Education. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  `;
  
  const result = await queueEmail(`grade:${grade._id}:${Number(grade.publishedAt)}`, recipients,
    `Grade published: ${grade.subject}`, emailHtml, { model: 'Grade', record: grade._id, eventAt: grade.publishedAt });
  await Grade.updateOne({ _id: grade._id, publishedAt: grade.publishedAt }, { notificationPending: false });
  return result;
};


export {
  getGrades,
  getGrade,
  createGrade,
  updateGrade,
  deleteGrade,
  getGradesByStudent,
  getGradesByClass
};