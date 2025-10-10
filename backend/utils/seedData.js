import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Student from '../models/Student.js';
import Teacher from '../models/Teacher.js';
import Class from '../models/Class.js';
import Attendance from '../models/Attendance.js';
import Payment from '../models/Payment.js';

dotenv.config();

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await mongoose.connection.db.dropDatabase();
    console.log('🗑️  Cleared existing database');

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

    // ==================== STEP 2: CREATE TEACHERS ====================
    console.log('\n👨‍🏫 Step 2: Creating teachers...');
    
    const teachers = await Teacher.create([
      {
        name: 'Dr. Sarah Johnson',
        email: 'sarah.johnson@oasis.edu',
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
      },
      {
        name: 'Mr. David Chen',
        email: 'david.chen@oasis.edu',
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
      },
      {
        name: 'Mrs. Priya Sharma',
        email: 'priya.sharma@oasis.edu',
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
      },
      {
        name: 'Mr. Rajesh Kumar',
        email: 'rajesh.kumar@oasis.edu',
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
      },
      {
        name: 'Ms. Anjali Mehta',
        email: 'anjali.mehta@oasis.edu',
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
      }
    ]);

    console.log('✅ Teachers created:', teachers.length);

    // ==================== STEP 3: CREATE CLASSES ====================
    console.log('\n📚 Step 3: Creating classes...');
    
    const classes = await Class.create([
      {
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
      },
      {
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
      },
      {
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
      },
      {
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
      },
      {
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
      },
      {
        name: 'Grade 11 Mathematics - IIT Foundation',
        subject: 'Mathematics',
        grade: '11',
        teacher: teachers[0]._id,
        schedule: {
          days: ['tuesday', 'thursday', 'saturday'],
          startTime: '17:30',
          endTime: '19:00'
        },
        fee: 3500,
        capacity: 12,
        room: 'Room A-102',
        startDate: new Date('2024-01-01')
      }
    ]);

    console.log('✅ Classes created:', classes.length);

    // ==================== STEP 4: CREATE STUDENTS ====================
    console.log('\n👨‍🎓 Step 4: Creating students...');
    
    const students = await Student.create([
      {
        name: 'Aarav Sharma',
        email: 'aarav.sharma@student.com',
        phone: '+91 9123456780',
        parentName: 'Mr. Rajesh Sharma',
        parentPhone: '+91 9123456781',
        grade: '10',
        school: 'Delhi Public School',
        address: {
          street: '101 Student Street',
          city: 'Mumbai',
          state: 'Maharashtra',
          zipCode: '400011'
        },
        enrolledClasses: [classes[0]._id, classes[3]._id],
        enrollmentDate: new Date('2024-01-10')
      },
      {
        name: 'Priya Patel',
        email: 'priya.patel@student.com',
        phone: '+91 9123456782',
        parentName: 'Mrs. Sunita Patel',
        parentPhone: '+91 9123456783',
        grade: '11',
        school: 'Ryan International School',
        address: {
          street: '202 Learning Lane',
          city: 'Mumbai',
          state: 'Maharashtra',
          zipCode: '400012'
        },
        enrolledClasses: [classes[1]._id, classes[5]._id],
        enrollmentDate: new Date('2024-01-12')
      },
      {
        name: 'Rohan Verma',
        email: 'rohan.verma@student.com',
        phone: '+91 9123456784',
        parentName: 'Mr. Amit Verma',
        parentPhone: '+91 9123456785',
        grade: '12',
        school: 'Bombay Scottish School',
        address: {
          street: '303 Education Road',
          city: 'Mumbai',
          state: 'Maharashtra',
          zipCode: '400013'
        },
        enrolledClasses: [classes[2]._id],
        enrollmentDate: new Date('2024-01-08')
      },
      {
        name: 'Sneha Gupta',
        email: 'sneha.gupta@student.com',
        phone: '+91 9123456786',
        parentName: 'Mr. Sanjay Gupta',
        parentPhone: '+91 9123456787',
        grade: '10',
        school: 'Dhirubhai Ambani International School',
        address: {
          street: '404 Knowledge Avenue',
          city: 'Mumbai',
          state: 'Maharashtra',
          zipCode: '400014'
        },
        enrolledClasses: [classes[0]._id, classes[4]._id],
        enrollmentDate: new Date('2024-01-15')
      },
      {
        name: 'Karan Singh',
        email: 'karan.singh@student.com',
        phone: '+91 9123456788',
        parentName: 'Mrs. Neha Singh',
        parentPhone: '+91 9123456789',
        grade: '11',
        school: 'Cathedral and John Connon School',
        address: {
          street: '505 Wisdom Street',
          city: 'Mumbai',
          state: 'Maharashtra',
          zipCode: '400015'
        },
        enrolledClasses: [classes[1]._id],
        enrollmentDate: new Date('2024-01-18')
      },
      {
        name: 'Ananya Reddy',
        email: 'ananya.reddy@student.com',
        phone: '+91 9123456790',
        parentName: 'Mr. Ramesh Reddy',
        parentPhone: '+91 9123456791',
        grade: '12',
        school: 'Jamnabai Narsee School',
        address: {
          street: '606 Study Lane',
          city: 'Mumbai',
          state: 'Maharashtra',
          zipCode: '400016'
        },
        enrolledClasses: [classes[2]._id, classes[5]._id],
        enrollmentDate: new Date('2024-01-20')
      },
      {
        name: 'Vikram Joshi',
        email: 'vikram.joshi@student.com',
        phone: '+91 9123456792',
        parentName: 'Mrs. Meera Joshi',
        parentPhone: '+91 9123456793',
        grade: '9',
        school: 'Arya Vidya Mandir',
        address: {
          street: '707 Growth Road',
          city: 'Mumbai',
          state: 'Maharashtra',
          zipCode: '400017'
        },
        enrolledClasses: [classes[4]._id],
        enrollmentDate: new Date('2024-01-22')
      },
      {
        name: 'Neha Kapoor',
        email: 'neha.kapoor@student.com',
        phone: '+91 9123456794',
        parentName: 'Mr. Anil Kapoor',
        parentPhone: '+91 9123456795',
        grade: '10',
        school: 'B.D. Somani International School',
        address: {
          street: '808 Success Avenue',
          city: 'Mumbai',
          state: 'Maharashtra',
          zipCode: '400018'
        },
        enrolledClasses: [classes[3]._id],
        enrollmentDate: new Date('2024-01-25')
      },
      {
        name: 'Rahul Mehta',
        email: 'rahul.mehta@student.com',
        phone: '+91 9123456796',
        parentName: 'Mrs. Pooja Mehta',
        parentPhone: '+91 9123456797',
        grade: '11',
        school: 'G.D. Somani Memorial School',
        address: {
          street: '909 Achievement Street',
          city: 'Mumbai',
          state: 'Maharashtra',
          zipCode: '400019'
        },
        enrolledClasses: [classes[1]._id, classes[5]._id],
        enrollmentDate: new Date('2024-01-28')
      },
      {
        name: 'Pooja Nair',
        email: 'pooja.nair@student.com',
        phone: '+91 9123456798',
        parentName: 'Mr. Suresh Nair',
        parentPhone: '+91 9123456799',
        grade: '12',
        school: 'Aditya Birla World Academy',
        address: {
          street: '1010 Excellence Road',
          city: 'Mumbai',
          state: 'Maharashtra',
          zipCode: '400020'
        },
        enrolledClasses: [classes[2]._id],
        enrollmentDate: new Date('2024-02-01')
      }
    ]);

    console.log('✅ Students created:', students.length);

    // ==================== STEP 5: UPDATE CLASSES WITH STUDENTS ====================
    console.log('\n🔗 Step 5: Linking students to classes...');
    
    // Update each class with their students
    await Class.findByIdAndUpdate(classes[0]._id, { 
      students: [students[0]._id, students[3]._id] 
    });
    await Class.findByIdAndUpdate(classes[1]._id, { 
      students: [students[1]._id, students[4]._id, students[8]._id] 
    });
    await Class.findByIdAndUpdate(classes[2]._id, { 
      students: [students[2]._id, students[5]._id, students[9]._id] 
    });
    await Class.findByIdAndUpdate(classes[3]._id, { 
      students: [students[0]._id, students[7]._id] 
    });
    await Class.findByIdAndUpdate(classes[4]._id, { 
      students: [students[3]._id, students[6]._id] 
    });
    await Class.findByIdAndUpdate(classes[5]._id, { 
      students: [students[1]._id, students[5]._id, students[8]._id] 
    });

    console.log('✅ Classes updated with students');

    // ==================== STEP 6: CREATE ATTENDANCE RECORDS ====================
    console.log('\n📅 Step 6: Creating attendance records...');
    
    const today = new Date();
    const attendanceRecords = [];

    // Create attendance for each class for the current month
    for (const classObj of classes) {
      for (let i = 0; i < 5; i++) { // Last 5 days
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        
        // Skip weekends
        if (date.getDay() === 0 || date.getDay() === 6) continue;

        const attendance = new Attendance({
          class: classObj._id,
          date: date,
          takenBy: adminUser._id,
          students: []
        });

        // Add students with random attendance status
        const classStudents = await Class.findById(classObj._id).populate('students');
        for (const student of classStudents.students) {
          const status = Math.random() > 0.2 ? 'present' : (Math.random() > 0.5 ? 'absent' : 'late');
          attendance.students.push({
            student: student._id,
            status: status
          });
        }

        await attendance.save();
        attendanceRecords.push(attendance);
      }
    }

    console.log('✅ Attendance records created:', attendanceRecords.length);

    // ==================== STEP 7: CREATE PAYMENT RECORDS ====================
    console.log('\n💰 Step 7: Creating payment records...');
    
    const paymentRecords = [];
    const months = ['January', 'February', 'March', 'April', 'May'];
    const currentYear = new Date().getFullYear();

    for (const student of students) {
      for (let i = 0; i < 3; i++) { // Last 3 months
        const month = months[i];
        const status = i === 0 ? 'paid' : (i === 1 ? 'pending' : 'overdue');
        
        for (const classId of student.enrolledClasses) {
          const classObj = await Class.findById(classId);
          
          const payment = new Payment({
            student: student._id,
            class: classId,
            amount: classObj.fee,
            month: month,
            year: currentYear,
            dueDate: new Date(currentYear, i, 10), // 10th of each month
            status: status,
            paymentMethod: status === 'paid' ? 'online' : null,
            collectedBy: status === 'paid' ? adminUser._id : null,
            paymentDate: status === 'paid' ? new Date(currentYear, i, 5) : null
          });

          await payment.save();
          paymentRecords.push(payment);
        }
      }
    }

    console.log('✅ Payment records created:', paymentRecords.length);

    // ==================== STEP 8: FINAL SUMMARY ====================
    console.log('\n🎉 DATABASE SEEDED SUCCESSFULLY!');
    console.log('========================================');
    console.log('📊 SEEDING SUMMARY:');
    console.log(`👤 Admin Users: 1`);
    console.log(`👨‍🏫 Teachers: ${teachers.length}`);
    console.log(`📚 Classes: ${classes.length}`);
    console.log(`👨‍🎓 Students: ${students.length}`);
    console.log(`📅 Attendance Records: ${attendanceRecords.length}`);
    console.log(`💰 Payment Records: ${paymentRecords.length}`);
    console.log('========================================');
    console.log('🔐 LOGIN CREDENTIALS:');
    console.log('📧 Admin Email: admin@oasis.edu');
    console.log('🔑 Admin Password: password123');
    console.log('📧 Teacher Email: sarah.johnson@oasis.edu');
    console.log('🔑 Teacher Password: teacher123');
    console.log('========================================');
    console.log('💡 SAMPLE DATA INCLUDES:');
    console.log('• 10 Students across different grades');
    console.log('• 6 Classes covering major subjects');
    console.log('• Attendance records for the last 5 days');
    console.log('• Payment records for the last 3 months');
    console.log('• Realistic Indian names and contact details');
    console.log('========================================\n');

    process.exit(0);

  } catch (error) {
    console.error('❌ Seeding error:', error);
    if (error.code === 11000) {
      console.error('Duplicate key error - some data already exists');
    }
    process.exit(1);
  }
};

seedData();