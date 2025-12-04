import mongoose from 'mongoose';

const gradeSchema = new mongoose.Schema({
  gradeId: {
    type: String,
    unique: true
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  class: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: true
  },
  subject: {
    type: String,
    required: true
  },
  grade: {
    type: String,
    required: true,
    enum: ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D', 'F']
  },
  marks: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  examType: {
    type: String,
    required: true,
    enum: ['mid-term', 'final', 'quiz', 'assignment', 'project']
  },
  examDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  weightage: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
    default: 100
  },
  comments: {
    type: String,
    maxlength: 500
  },
  isPublished: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Generate grade ID before saving
gradeSchema.pre('save', async function(next) {
  if (!this.gradeId) {
    try {
      const GradeModel = mongoose.model('Grade');
      const count = await GradeModel.countDocuments();
      this.gradeId = `GRD${String(count + 1).padStart(4, '0')}`;
      next();
    } catch (error) {
      next(error);
    }
  } else {
    next();
  }
});

// Indexes for better query performance
gradeSchema.index({ student: 1, class: 1 });
gradeSchema.index({ class: 1, subject: 1 });
gradeSchema.index({ grade: 1 });
gradeSchema.index({ examDate: 1 });

export default mongoose.model('Grade', gradeSchema);