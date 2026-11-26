import { allocateHumanId } from '../utils/humanId.js';
import mongoose from 'mongoose';

const studentSchema = new mongoose.Schema({
  studentId: {
    type: String,
    unique: true
  },
  name: {
    type: String,
    required: [true, 'Please add student name'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Please add student email'],
    unique: true,
    lowercase: true
  },
  phone: {
    type: String,
    required: [true, 'Please add student phone number']
  },
  parentName: {
    type: String,
    required: [true, 'Please add parent name']
  },
  parentEmail: { // ADD THIS FIELD
    type: String,
    required: [true, 'Please add parent email'],
    lowercase: true
  },
  parentPhone: {
    type: String,
    required: [true, 'Please add parent phone number']
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String
  },
  grade: {
    type: String,
    required: [true, 'Please add student grade']
  },
  school: {
    type: String,
    required: [true, 'Please add school name']
  },
  enrolledClasses: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class'
  }],
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active'
  },
  enrollmentDate: {
    type: Date,
    default: Date.now
  },
  notes: String,
  profilePicture: {
    type: String,
    default: ''
  },
  feeStatus: {
    type: String,
    enum: ['paid', 'pending', 'overdue'],
    default: 'pending'
  },
  feeAmount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Generate student ID before saving
studentSchema.pre('validate', async function () {
  if (this.isNew) this.studentId = await allocateHumanId(this.constructor, 'studentId', 'STU', this.studentId);
});

export default mongoose.model('Student', studentSchema);