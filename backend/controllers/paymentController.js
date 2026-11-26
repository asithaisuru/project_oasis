import { escapeHtml } from '../utils/html.js';
import { scopeFor } from '../middleware/dataScope.js';
import Payment from '../models/Payment.js';
import Student from '../models/Student.js';
import Class from '../models/Class.js';
import { queueEmail } from '../utils/emailOutbox.js';

// ===== ORIGINAL CRUD FUNCTIONS =====

// @desc    Get all payments
// @route   GET /api/payments
// @access  Private
export const getPayments = async (req, res) => {
  try {
    const payments = await Payment.find().and([scopeFor('Payment', req)])
      .populate('student', 'name email')
      .populate('class', 'name className fee subject')
      .populate('collectedBy', 'name')
      .sort({ createdAt: -1 });

    res.status(200).json(payments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get payment by ID
// @route   GET /api/payments/:id
// @access  Private
export const getPaymentById = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id).and([scopeFor('Payment', req)])
      .populate('student', 'name email phone')
      .populate('class', 'name className fee subject')
      .populate('collectedBy', 'name');

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    res.status(200).json(payment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create new payment
// @route   POST /api/payments
// @access  Private
export const createPayment = async (req, res) => {
  try {
    const paymentData = {
      ...req.body
    };

    const payment = new Payment(paymentData);
    const savedPayment = await payment.save();

    const populatedPayment = await Payment.findById(savedPayment._id).and([scopeFor('Payment', req)])
      .populate('student', 'name email')
      .populate('class', 'name className fee subject')
      .populate('collectedBy', 'name');

    res.status(201).json(populatedPayment);
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update payment
// @route   PUT /api/payments/:id
// @access  Private
export const updatePayment = async (req, res) => {
  try {
    if (['status', 'paymentDate', 'paymentId', 'notificationPending'].some((field) => req.body[field] !== undefined) || Object.keys(req.body).some((field) => field.startsWith('$'))) return res.status(400).json({ message: 'Use explicit payment-state endpoints; receipt identity and timestamps are server controlled' });
    const payment = await Payment.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).and([scopeFor('Payment', req)])
      .populate('student', 'name email')
      .populate('class', 'name className fee subject')
      .populate('collectedBy', 'name');

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    res.status(200).json(payment);
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    res.status(500).json({ message: error.message });
  }
};

// @desc    Mark payment as paid
// @route   PATCH /api/payments/:id/mark-paid
// @access  Private
export const markPaymentAsPaid = async (req, res, next) => {
  try {
    const { paymentMethod = 'cash', transactionId, notes } = req.body;
    if (!['cash', 'card', 'bank-transfer', 'online'].includes(paymentMethod)) return res.status(400).json({ message: 'Invalid payment method' });
    let payment = await Payment.findOneAndUpdate({ _id: req.params.id, status: { $ne: 'paid' } }, { $set: { status: 'paid', paymentMethod, transactionId, notes, paymentDate: new Date(), notificationPending: true } }, { new: true, runValidators: true }).and([scopeFor('Payment', req)]).populate('student').populate('class');
    if (!payment) payment = await Payment.findById(req.params.id).and([scopeFor('Payment', req)]).populate('student').populate('class');
    if (!payment) return res.status(404).json({ message: 'Payment not found' });
    const delivery = await sendPaymentEmail(payment);
    res.status(200).json({ ...payment.toObject(), ...delivery });
  } catch (error) { next(error); }
};

export const sendPaymentEmail = async (payment) => {
  if (!payment.student) return { emailSent: false, emailPending: false };
  const notes = payment.notes;
    // Pretty HTML email template
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; color: #333; background-color: #f7f9fc; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background: #fff; border-radius: 8px; overflow: hidden;">
          <div style="background: #2563eb; color: #fff; text-align: center; padding: 20px;">
            <h1 style="margin: 0; font-size: 22px;">Payment Confirmation</h1>
          </div>

          <div style="padding: 25px;">
            <p>Dear ${escapeHtml(payment.student.name)},</p>
            <p>Your payment for <strong>${escapeHtml(payment.class?.name || payment.class?.className)}</strong> has been successfully marked as <span style="color: #16a34a; font-weight: bold;">PAID</span>.</p>

            <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Amount</strong></td>
                <td style="padding: 8px; border-bottom: 1px solid #eee;">${escapeHtml(payment.amount)}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Payment Method</strong></td>
                <td style="padding: 8px; border-bottom: 1px solid #eee;">${escapeHtml(payment.paymentMethod)}</td>
              </tr>
              ${payment.transactionId ? `<tr>
                <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Transaction ID</strong></td>
                <td style="padding: 8px; border-bottom: 1px solid #eee;">${escapeHtml(payment.transactionId)}</td>
              </tr>` : ""}
              <tr>
                <td style="padding: 8px;">Date</td>
                <td style="padding: 8px;">${escapeHtml(new Date(payment.paymentDate).toLocaleString())}</td>
              </tr>
            </table>

            ${notes ? `<div style="margin-top: 20px;">
              <p><strong>Notes:</strong></p>
              <p style="background: #f1f5f9; padding: 10px; border-radius: 5px;">${escapeHtml(notes)}</p>
            </div>` : ""}

            <p style="margin-top: 25px;">Thank you for your payment. Please keep this email for your records.</p>
            <p style="font-size: 14px; color: #555;">Best regards,<br><strong>School Administration</strong></p>
          </div>

          <div style="background: #f1f5f9; text-align: center; padding: 10px; font-size: 12px; color: #777;">
            © ${escapeHtml(new Date().getFullYear())} Your School Name. All rights reserved.
          </div>
        </div>
      </div>
    `;

  const result = await queueEmail(`payment:${payment._id}:${Number(payment.paymentDate)}`, [payment.student.email, payment.student.parentEmail], 'Payment confirmation', emailHtml, { model: 'Payment', record: payment._id, eventAt: payment.paymentDate });
  await Payment.updateOne({ _id: payment._id, paymentDate: payment.paymentDate }, { notificationPending: false });
  return result;
};

// @desc    Delete payment
// @route   DELETE /api/payments/:id
// @access  Private
export const deletePayment = async (req, res) => {
  try {
    const payment = await Payment.findByIdAndDelete(req.params.id).and([scopeFor('Payment', req)]);

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    res.status(200).json({ message: 'Payment deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get payments by student
// @route   GET /api/payments/student/:studentId
// @access  Private
export const getPaymentsByStudent = async (req, res) => {
  try {
    const payments = await Payment.find({ student: req.params.studentId }).and([scopeFor('Payment', req)])
      .populate('class', 'name className fee subject')
      .populate('collectedBy', 'name')
      .sort({ createdAt: -1 });

    res.status(200).json(payments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get payments by class
// @route   GET /api/payments/class/:classId
// @access  Private
export const getPaymentsByClass = async (req, res) => {
  try {
    const payments = await Payment.find({ class: req.params.classId }).and([scopeFor('Payment', req)])
      .populate('student', 'name email')
      .populate('collectedBy', 'name')
      .sort({ createdAt: -1 });

    res.status(200).json(payments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ===== AUTOMATED PAYMENT GENERATION FUNCTIONS =====

// @desc    Generate monthly payments for a student
// @route   POST /api/payments/generate/student
// @access  Private
export const generateStudentPayments = async (req, res) => {
  try {
    const { studentId, months = 6, startFrom = new Date() } = req.body;

    if (!studentId) {
      return res.status(400).json({ message: 'Student ID is required' });
    }

    const student = await Student.findById(studentId).and([scopeFor('Student', req)]);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Use the correct field: enrolledClasses
    if (!student.enrolledClasses || student.enrolledClasses.length === 0) {
      return res.status(400).json({
        message: 'Student is not enrolled in any classes'
      });
    }

    const classIds = student.enrolledClasses.map(item =>
      typeof item === 'string' ? item : (item._id || item)
    );

    // Get class details
    const classes = await Class.find({ _id: { $in: classIds } }).and([scopeFor('Class', req)]);
    if (classes.length === 0) {
      return res.status(400).json({
        message: 'No valid classes found for student',
        classIdsSearched: classIds
      });
    }

    const generatedPayments = [];
    const startDate = new Date(startFrom);
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    // Get the current count for payment ID generation

    for (let i = 0; i < months; i++) {
      const targetDate = new Date(startDate);
      targetDate.setMonth(startDate.getMonth() + i);

      const month = targetDate.toLocaleString('default', { month: 'long' });
      const year = targetDate.getFullYear();

      // Skip past months (before current month)
      if (year < currentYear || (year === currentYear && targetDate.getMonth() < currentMonth)) {
        continue;
      }

      const dueDate = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0);

      for (const classInfo of classes) {
        const existingPayment = await Payment.findOne({
          student: studentId,
          class: classInfo._id,
          month,
          year
        }).and([scopeFor('Payment', req)]);

        if (!existingPayment) {
          // Manually generate payment ID to ensure it's set

          const paymentData = {
            student: studentId,
            class: classInfo._id,
            amount: classInfo.fee || 0,
            month,
            year,
            dueDate,
            status: 'pending',
            paymentMethod: 'cash',
            isGenerated: true,
            enrollmentDate: student.enrollmentDate || student.createdAt || new Date()
          };

          const payment = new Payment(paymentData);
          const savedPayment = await payment.save();

          const populatedPayment = await Payment.findById(savedPayment._id).and([scopeFor('Payment', req)])
            .populate('student', 'name email')
            .populate('class', 'name fee subject');

          generatedPayments.push(populatedPayment);
        }
      }
    }

    const skippedMonths = months - (generatedPayments.length / classes.length);

    res.status(201).json({
      message: `Generated ${generatedPayments.length} payment(s) for ${student.name}. ${skippedMonths > 0 ? `Skipped ${skippedMonths} past month(s).` : ''}`,
      payments: generatedPayments,
      student: {
        name: student.name,
        totalClasses: classes.length
      }
    });

  } catch (error) {
    console.error('Error generating student payments:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Generate payments for all students in a class
// @route   POST /api/payments/generate/class
// @access  Private
export const generateClassPayments = async (req, res) => {
  try {
    const { classId, month, year } = req.body;

    if (!classId || !month || !year) {
      return res.status(400).json({
        message: 'Class ID, Month, and Year are required'
      });
    }

    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    const targetMonth = getMonthNumber(month);

    // Check if the target month is in the past
    if (year < currentYear || (year === currentYear && targetMonth < currentMonth)) {
      return res.status(400).json({
        message: 'Cannot generate payments for past months'
      });
    }

    const classInfo = await Class.findById(classId).and([scopeFor('Class', req)]);
    if (!classInfo) {
      return res.status(404).json({ message: 'Class not found' });
    }

    // Use the correct field: students
    if (!classInfo.students || classInfo.students.length === 0) {
      return res.status(400).json({
        message: 'No students enrolled in this class'
      });
    }

    const studentIds = classInfo.students.map(item =>
      typeof item === 'string' ? item : (item._id || item)
    );

    const students = await Student.find({ _id: { $in: studentIds } }).and([scopeFor('Student', req)]);
    const generatedPayments = [];
    const dueDate = new Date(year, targetMonth + 1, 0);

    // Get the current count for payment ID generation

    for (const student of students) {
      const existingPayment = await Payment.findOne({
        student: student._id,
        class: classId,
        month,
        year
      }).and([scopeFor('Payment', req)]);

      if (!existingPayment) {
        // Manually generate payment ID

        const paymentData = {
          student: student._id,
          class: classId,
          amount: classInfo.fee || 0,
          month,
          year,
          dueDate,
          status: 'pending',
          paymentMethod: 'cash',
          isGenerated: true,
          enrollmentDate: student.enrollmentDate || student.createdAt || new Date()
        };

        const payment = new Payment(paymentData);
        const savedPayment = await payment.save();

        const populatedPayment = await Payment.findById(savedPayment._id).and([scopeFor('Payment', req)])
          .populate('student', 'name email')
          .populate('class', 'name fee subject');

        generatedPayments.push(populatedPayment);
      }
    }

    res.status(201).json({
      message: `Generated ${generatedPayments.length} payment(s) for ${students.length} student(s) in ${classInfo.name}`,
      payments: generatedPayments,
      class: {
        name: classInfo.name,
        subject: classInfo.subject,
        fee: classInfo.fee,
        studentCount: students.length
      }
    });

  } catch (error) {
    console.error('Error generating class payments:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Generate payments for all students (bulk operation)
// @route   POST /api/payments/generate/bulk
// @access  Private
export const generateBulkPayments = async (req, res) => {
  try {
    const { month, year } = req.body;

    if (!month || !year) {
      return res.status(400).json({
        message: 'Month and Year are required'
      });
    }

    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    const targetMonth = getMonthNumber(month);

    // Check if the target month is in the past
    if (year < currentYear || (year === currentYear && targetMonth < currentMonth)) {
      return res.status(400).json({
        message: 'Cannot generate payments for past months'
      });
    }

    // Get all students with their enrolled classes
    const students = await Student.find().and([scopeFor('Student', req)]);
    const dueDate = new Date(year, targetMonth + 1, 0);

    let totalGenerated = 0;
    const results = [];

    // Get the current count for payment ID generation

    for (const student of students) {
      if (student.enrolledClasses && student.enrolledClasses.length > 0) {
        // Get class details for this student's enrolled classes
        const classIds = student.enrolledClasses.map(item =>
          typeof item === 'string' ? item : (item._id || item)
        );
        const classes = await Class.find({ _id: { $in: classIds } }).and([scopeFor('Class', req)]);

        let studentGenerated = 0;
        for (const classInfo of classes) {
          // Check if payment already exists
          const existingPayment = await Payment.findOne({
            student: student._id,
            class: classInfo._id,
            month,
            year
          }).and([scopeFor('Payment', req)]);

          if (!existingPayment) {
            // Manually generate payment ID

            const paymentData = {
              student: student._id,
              class: classInfo._id,
              amount: classInfo.fee || 0,
              month,
              year,
              dueDate,
              status: 'pending',
              paymentMethod: 'cash',
              isGenerated: true,
              enrollmentDate: student.enrollmentDate || student.createdAt || new Date()
            };

            await new Payment(paymentData).save();
            totalGenerated++;
            studentGenerated++;
          }
        }

        results.push({
          student: student.name,
          classes: classes.length,
          generated: studentGenerated
        });
      }
    }

    res.status(201).json({
      message: `Generated ${totalGenerated} payments for ${results.length} students`,
      totalGenerated,
      totalStudents: students.length,
      results
    });

  } catch (error) {
    console.error('Error generating bulk payments:', error);
    res.status(500).json({ message: error.message });
  }
};

// Helper function to get month number
function getMonthNumber(monthName) {
  const months = {
    'January': 0, 'February': 1, 'March': 2, 'April': 3, 'May': 4, 'June': 5,
    'July': 6, 'August': 7, 'September': 8, 'October': 9, 'November': 10, 'December': 11
  };
  return months[monthName];
};

// @desc    Revert payment status to pending
// @route   PATCH /api/payments/:id/revert-pending
// @access  Private
export const revertPaymentToPending = async (req, res) => {
  try {
    const payment = await Payment.findByIdAndUpdate(
      req.params.id,
      {
        status: 'pending',
        paymentDate: null,
        transactionId: null,
        paymentMethod: 'cash'
      },
      { new: true }
    ).and([scopeFor('Payment', req)])
      .populate('student', 'name email')
      .populate('class', 'name className fee subject')
      .populate('collectedBy', 'name');

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    res.status(200).json(payment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get current month payment status for a student
// @route   GET /api/payments/student/:studentId/current
// @access  Private
export const getStudentCurrentPaymentStatus = async (req, res) => {
  try {
    const { studentId } = req.params;

    if (!studentId) {
      return res.status(400).json({ message: 'Student ID is required' });
    }

    const currentDate = new Date();
    const currentMonth = currentDate.toLocaleString('default', { month: 'long' });
    const currentYear = currentDate.getFullYear();

    // Find payment for current month
    const currentPayment = await Payment.findOne({
      student: studentId,
      month: currentMonth,
      year: currentYear
    }).and([scopeFor('Payment', req)])
      .populate('class', 'name className fee subject')
      .populate('collectedBy', 'name');

    if (currentPayment) {
      return res.status(200).json({
        success: true,
        data: {
          status: currentPayment.status,
          ...(req.user.role === 'admin' ? {
          paymentId: currentPayment.paymentId,
          amount: currentPayment.amount,
          month: currentPayment.month,
          year: currentPayment.year,
          dueDate: currentPayment.dueDate,
          paymentDate: currentPayment.paymentDate,
          paymentMethod: currentPayment.paymentMethod
          } : {})
        }
      });
    }

    // If no payment found for current month, return pending status
    res.status(200).json({
      success: true,
      data: {
        status: 'pending',
        month: currentMonth,
        year: currentYear
      }
    });

  } catch (error) {
    console.error('Error getting current payment status:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
