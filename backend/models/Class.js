import { allocateHumanId } from '../utils/humanId.js';
import mongoose from 'mongoose';

const classSchema = new mongoose.Schema({
  classId: {
    type: String,
    unique: true
  },
  name: {
    type: String,
    required: [true, 'Please add class name'],
    trim: true
  },
  subject: {
    type: String,
    required: [true, 'Please add subject'],
    enum: [
      'Sinhala',
      'English', 
      'History',
      'Maths',
      'Science',
      'IT',
      'Tamil',
      'Physics',
      'Chemistry',
      'Combined Maths',
      'Art',
      'Music',
      'Dancing',
    ]
  },
  grade: {
    type: String,
    required: [true, 'Please add grade level'],
    enum: ['6', '7', '8', '9', '10', '11', '12', '13']
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher',
    required: true
  },
  students: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student'
  }],
  schedule: {
    days: [{
      type: String,
      enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    }],
    startTime: String,
    endTime: String
  },
  fee: {
    type: Number,
    required: [true, 'Please add class fee']
  },
  currentStrength: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'completed'],
    default: 'active'
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: Date
}, {
  timestamps: true
});

// Generate class ID before saving
classSchema.pre('validate', async function () {
  if (this.isNew) this.classId = await allocateHumanId(this.constructor, 'classId', 'CLS', this.classId);
});

// Update current strength when students are added/removed
classSchema.pre('save', function(next) {
  this.currentStrength = this.students.length;
  next();
});

export default mongoose.model('Class', classSchema);