import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Student from '../models/Student.js';
import Teacher from '../models/Teacher.js';
import Class from '../models/Class.js';
import Attendance from '../models/Attendance.js';
import Payment from '../models/Payment.js';

dotenv.config();

const seedRobust = async () => {
  let connection;
  try {
    connection = await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get the database name from connection
    const dbName = mongoose.connection.db.databaseName;
    console.log(`🗑️  Dropping database: ${dbName}`);
    
    // Drop the entire database to clear everything including indexes
    await mongoose.connection.db.dropDatabase();
    console.log('✅ Database dropped successfully');

    // ==================== STEP 1: CREATE USERS ====================
    console.log('\n👥 Step 1: Creating users...');
    
    const adminUser = await User.create({
      name: 'Admin User',
      email: 'admin@oasis.edu',
      password: 'password123',
      role: 'admin'
    });

    const teacherUser = await User.create({
      name: 'Sarah Johnson',
      email: 'sarah.johnson@oasis.edu',
      password: 'teacher123',
      role: 'teacher'
    });

    console.log('✅ Users created');

    // ==================== STEP 2: CREATE TEACHERS (ONE BY ONE) ====================
    console.log('\n👨‍🏫 Step 2: Creating teachers...');
    
    // Create teachers one by one to ensure proper ID generation
    const teacher1 = new Teacher({
      name: 'Dr. Sarah Johnson',
      email: 'sarah.math@oasis.edu',
      phone: '+91 9876543210',
      address: {
        street: '123 Teacher Lane',
        city: 'Mumbai',
        state: 'Maharashtra',
        zipCode: '400001'
      },
      qualifications: ['M.Sc Mathematics', 'B.Ed', 'Ph.D in Education'],
      subjects: ['Mathematics', 'Advanced Mathematics', 'Statistics'],
      experience: 8,
      salary: 55000,
      joiningDate: new Date('2020-01-15')
    });
    await teacher1.save();

    const teacher2 = new Teacher({
      name: 'Mr. David Chen',
      email: 'david.physics@oasis.edu',
      phone: '+91 9876543211',
      address: {
        street: '456 Science Street',
        city: 'Mumbai',
        state: 'Maharashtra',
        zipCode: '400002'
      },
      qualifications: ['M.Sc Physics', 'Ph.D Physics', 'B.Ed'],
      subjects: ['Physics', 'Science', 'Electronics'],
      experience: 12,
      salary: 60000,
      joiningDate: new Date('2018-03-10')
    });
    await teacher2.save();

    const teacher3 = new Teacher({
      name: 'Mrs. Priya Sharma',
      email: 'priya.chemistry@oasis.edu',
      phone: '+91 9876543212',
      address: {
        street: '789 Chemistry Road',
        city: 'Mumbai',
        state: 'Maharashtra',
        zipCode: '400003'
      },
      qualifications: ['M.Sc Chemistry', 'B.Ed', 'NET Qualified'],
      subjects: ['Chemistry', 'Organic Chemistry', 'Biochemistry'],
      experience: 6,
      salary: 52000,
      joiningDate: new Date('2021-06-20')
    });
    await teacher3.save();

    const teacher4 = new Teacher({
      name: 'Mr. Rajesh Kumar',
      email: 'rajesh.biology@oasis.edu',
      phone: '+91 9876543213',
      address: {
        street: '321 Biology Avenue',
        city: 'Mumbai',
        state: 'Maharashtra',
        zipCode: '400004'
      },
      qualifications: ['M.Sc Biology', 'B.Ed', 'M.Phil Biology'],
      subjects: ['Biology', 'Botany', 'Zoology'],
      experience: 9,
      salary: 54000,
      joiningDate: new Date('2019-08-12')
    });
    await teacher4.save();

    const teacher5 = new Teacher({
      name: 'Ms. Anjali Mehta',
      email: 'anjali.english@oasis.edu',
      phone: '+91 9876543214',
      address: {
        street: '654 English Lane',
        city: 'Mumbai',
        state: 'Maharashtra',
        zipCode: '400005'
      },
      qualifications: ['MA English', 'B.Ed', 'PhD in Literature'],
      subjects: ['English', 'Literature', 'Communication Skills'],
      experience: 7,
      salary: 53000,
      joiningDate: new Date('2020-11-05')
    });
    await teacher5.save();

    const teachers = [teacher1, teacher2, teacher3, teacher4, teacher5];
    console.log('✅ Teachers created with IDs:', teachers.map(t => t.teacherId));

    // ==================== STEP 3: CREATE CLASSES (ONE BY ONE) ====================
    console.log('\n📚 Step 3: Creating classes...');
    
    const class1 = new Class({
      name: 'Grade 10 Mathematics - Advanced',
      subject: 'Mathematics',
      grade: '10',
      teacher: teachers[0]._id,
      schedule: {
        days: ['monday', 'wednesday', 'friday'],
        startTime: '16:00',
        endTime: '17:30'
      },
      fee: 2500,
      capacity: 20,
      room: 'Room A-101',
      startDate: new Date('2024-01-01')
    });
    await class1.save();

    const class2 = new Class({
      name: 'Grade 11 Physics - CBSE',
      subject: 'Physics',
      grade: '11',
      teacher: teachers[1]._id,
      schedule: {
        days: ['tuesday', 'thursday', 'saturday'],
        startTime: '15:00',
        endTime: '16:30'
      },
      fee: 2800,
      capacity: 18,
      room: 'Room B-202',
      startDate: new Date('2024-01-01')
    });
    await class2.save();

    const class3 = new Class({
      name: 'Grade 12 Chemistry - NEET Prep',
      subject: 'Chemistry',
      grade: '12',
      teacher: teachers[2]._id,
      schedule: {
        days: ['monday', 'tuesday', 'thursday'],
        startTime: '17:00',
        endTime: '18:30'
      },
      fee: 3200,
      capacity: 15,
      room: 'Lab C-301',
      startDate: new Date('2024-01-01')
    });
    await class3.save();

    const class4 = new Class({
      name: 'Grade 10 Biology - Foundation',
      subject: 'Biology',
      grade: '10',
      teacher: teachers[3]._id,
      schedule: {
        days: ['wednesday', 'friday', 'saturday'],
        startTime: '14:00',
        endTime: '15:30'
      },
      fee: 2300,
      capacity: 22,
      room: 'Room D-104',
      startDate: new Date('2024-01-01')
    });
    await class4.save();

    const class5 = new Class({
      name: 'Grade 9 English - Communication',
      subject: 'English',
      grade: '9',
      teacher: teachers[4]._id,
      schedule: {
        days: ['monday', 'wednesday', 'friday'],
        startTime: '16:30',
        endTime: '18:00'
      },
      fee: 2000,
      capacity: 25,
      room: 'Room E-205',
      startDate: new Date('2024-01-01')
    });
    await class5.save();

    const classes = [class1, class2, class3, class4, class5];
    console.log('✅ Classes created with IDs:', classes.map(c => c.classId));

    // ==================== STEP 4: CREATE STUDENTS ====================
    console.log('\n👨‍🎓 Step 4: Creating students...');
    
    const studentsData = [
      {
        name: 'Aarav Sharma',
        email: 'aarav.sharma@student.com',
        phone: '+91 9123456780',
        parentName: 'Mr. Rajesh Sharma',
        parentPhone: '+91 9123456781',
        grade: '10',
        school: 'Delhi Public School',
        enrolledClasses: [classes[0]._id, classes[3]._id]
      },
      {
        name: 'Priya Patel',
        email: 'priya.patel@student.com',
        phone: '+91 9123456782',
        parentName: 'Mrs. Sunita Patel',
        parentPhone: '+91 9123456783',
        grade: '11',
        school: 'Ryan International School',
        enrolledClasses: [classes[1]._id]
      },
      {
        name: 'Rohan Verma',
        email: 'rohan.verma@student.com',
        phone: '+91 9123456784',
        parentName: 'Mr. Amit Verma',
        parentPhone: '+91 9123456785',
        grade: '12',
        school: 'Bombay Scottish School',
        enrolledClasses: [classes[2]._id]
      },
      {
        name: 'Sneha Gupta',
        email: 'sneha.gupta@student.com',
        phone: '+91 9123456786',
        parentName: 'Mr. Sanjay Gupta',
        parentPhone: '+91 9123456787',
        grade: '10',
        school: 'Dhirubhai Ambani International School',
        enrolledClasses: [classes[0]._id, classes[4]._id]
      }
    ];

    const students = [];
    for (const studentData of studentsData) {
      const student = new Student(studentData);
      await student.save();
      students.push(student);
    }

    console.log('✅ Students created with IDs:', students.map(s => s.studentId));

    // ==================== STEP 5: UPDATE CLASSES WITH STUDENTS ====================
    console.log('\n🔗 Step 5: Linking students to classes...');
    
    await Class.findByIdAndUpdate(classes[0]._id, { 
      students: [students[0]._id, students[3]._id] 
    });
    await Class.findByIdAndUpdate(classes[1]._id, { 
      students: [students[1]._id] 
    });
    await Class.findByIdAndUpdate(classes[2]._id, { 
      students: [students[2]._id] 
    });
    await Class.findByIdAndUpdate(classes[3]._id, { 
      students: [students[0]._id] 
    });
    await Class.findByIdAndUpdate(classes[4]._id, { 
      students: [students[3]._id] 
    });

    console.log('✅ Classes updated with students');

    // ==================== STEP 6: FINAL SUMMARY ====================
    console.log('\n🎉 DATABASE SEEDED SUCCESSFULLY!');
    console.log('========================================');
    console.log('📊 SEEDING SUMMARY:');
    console.log(`👤 Admin Users: 2`);
    console.log(`👨‍🏫 Teachers: ${teachers.length}`);
    console.log(`📚 Classes: ${classes.length}`);
    console.log(`👨‍🎓 Students: ${students.length}`);
    console.log('========================================');
    console.log('🔐 LOGIN CREDENTIALS:');
    console.log('📧 Admin Email: admin@oasis.edu');
    console.log('🔑 Admin Password: password123');
    console.log('📧 Teacher Email: sarah.johnson@oasis.edu');
    console.log('🔑 Teacher Password: teacher123');
    console.log('========================================\n');

    process.exit(0);

  } catch (error) {
    console.error('❌ Seeding error:', error.message);
    if (error.code === 11000) {
      console.error('Duplicate key error details:', error.keyValue);
    }
    process.exit(1);
  } finally {
    if (connection) {
      await mongoose.disconnect();
    }
  }
};

seedRobust();