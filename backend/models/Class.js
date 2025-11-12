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
classSchema.pre('save', async function(next) {
  if (!this.classId) {
    try {
      const ClassModel = mongoose.model('Class');
      const count = await ClassModel.countDocuments();
      this.classId = `CLS${String(count + 1).padStart(4, '0')}`;
      next();
    } catch (error) {
      next(error);
    }
  } else {
    next();
  }
});

// Update current strength when students are added/removed
classSchema.pre('save', function(next) {
  this.currentStrength = this.students.length;
  next();
});

export default mongoose.model('Class', classSchema);