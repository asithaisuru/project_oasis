import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema({
  class: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  students: [{
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true
    },
    status: {
      type: String,
      enum: ['present', 'absent', 'late'],
      default: 'present'
    },
    notes: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  takenBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Ensure one attendance record per class per date
attendanceSchema.index({ class: 1, date: 1 }, { unique: true });

export default mongoose.model('Attendance', attendanceSchema);