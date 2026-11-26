import { allocateHumanId } from '../utils/humanId.js';
import mongoose from 'mongoose';

const teacherSchema = new mongoose.Schema({
  teacherId: {
    type: String,
    unique: true
  },
  name: {
    type: String,
    required: [true, 'Please add teacher name'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Please add teacher email'],
    unique: true,
    lowercase: true
  },
  phone: {
    type: String,
    required: [true, 'Please add teacher phone number']
  },
  subject: {
    type: String,
    required: [true, 'Please add subject']
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'on_leave', 'retired'],
    default: 'active'
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String
  },
  emergencyContact: {
    name: String,
    phone: String,
    relationship: String
  },
  assignedClasses: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class'
  }],
  notes: String
}, {
  timestamps: true
});

// Generate teacher ID before saving
teacherSchema.pre('validate', async function () {
  if (this.isNew) this.teacherId = await allocateHumanId(this.constructor, 'teacherId', 'TCH', this.teacherId);
});

export default mongoose.model('Teacher', teacherSchema);