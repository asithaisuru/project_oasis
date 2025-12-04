import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { studentService } from "../services/studentService";
import { teacherService } from "../services/teacherService";
import { classService } from "../services/classService";
import { paymentService } from "../services/paymentService";
import QuickAction from "../components/QuickAction";
import {
  FaUsers,
  FaChalkboardTeacher,
  FaBook,
  FaMoneyBillWave,
  FaUserPlus,
  FaCalendarAlt,
  FaChartLine,
  FaClock,
  FaSchool,
} from "react-icons/fa";

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalTeachers: 0,
    totalClasses: 0,
    totalRevenue: 0,
    newStudentsThisMonth: 0,
  });
  const [recentStudents, setRecentStudents] = useState([]);
  const [activeClasses, setActiveClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Navigation handlers
  const navigateToStudents = () => navigate("/students");
  const navigateToTeachers = () => navigate("/teachers");
  const navigateToClasses = () => navigate("/classes");
  const navigateToAttendance = () => navigate("/attendance");
  const navigateToPayments = () => navigate("/payments");
  const navigateToReports = () => navigate("/reports");
  const navigateToGrades = () => navigate("/grades");

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch all data in parallel
      const [studentsRes, teachersRes, classesRes, paymentsRes] =
        await Promise.all([
          studentService.getStudents(),
          teacherService.getTeachers(),
          classService.getClasses(),
          paymentService.getPayments(),
        ]);

      const students = studentsRes.data || [];
      const teachers = teachersRes.data || [];
      const classes = classesRes.data || [];

      // FIX: Your payment API returns the array directly, not under data property
      let payments = [];
      if (Array.isArray(paymentsRes)) {
        payments = paymentsRes; // Direct array response
      } else if (paymentsRes.data && Array.isArray(paymentsRes.data)) {
        payments = paymentsRes.data; // Nested under data property
      }

      // Calculate new students this month
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();

      const newStudentsThisMonth = students.filter((student) => {
        const enrollDate = new Date(
          student.enrollmentDate || student.createdAt
        );
        return (
          enrollDate.getMonth() === currentMonth &&
          enrollDate.getFullYear() === currentYear
        );
      }).length;

      // Calculate total revenue (sum of all paid payments)
      const totalRevenue = payments
        .filter((payment) => payment.status === "pending")
        .reduce((sum, payment) => {
          const amount = parseFloat(payment.amount) || 0;
          return sum + amount;
        }, 0);

      // Get recent students (last 5)
      const recentStudentsList = students
        .sort(
          (a, b) =>
            new Date(b.enrollmentDate || b.createdAt) -
            new Date(a.enrollmentDate || a.createdAt)
        )
        .slice(0, 5);

      setStats({
        totalStudents: students.length,
        totalTeachers: teachers.length,
        totalClasses: classes.length,
        totalRevenue,
        newStudentsThisMonth,
      });

      setRecentStudents(recentStudentsList);

      // Get active classes
      setActiveClasses(
        classes.slice(0, 4).map((cls) => ({
          ...cls,
          studentCount: cls.students?.length || 0,
        }))
      );
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ icon: Icon, title, value, subtitle, color, trend }) => (
    <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          {loading ? (
            <div className="h-8 w-20 bg-gray-200 rounded animate-pulse mb-1"></div>
          ) : (
            <p className="text-3xl font-bold text-gray-900">{value}</p>
          )}
          {subtitle && (
            <p
              className={`text-sm ${
                trend === "up"
                  ? "text-green-600"
                  : trend === "down"
                  ? "text-red-600"
                  : "text-gray-500"
              }`}
            >
              {subtitle}
            </p>
          )}
        </div>
        <div className={`p-4 rounded-2xl ${color} bg-opacity-10`}>
          <Icon className={`text-2xl ${color}`} />
        </div>
      </div>
    </div>
  );

  

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">
            Dashboard Overview
          </h1>
          <p className="text-gray-600 mt-1">
            Welcome back! Here's what's happening today.
          </p>
        </div>
        <div className="text-sm text-gray-500">
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={FaUsers}
          title="Total Students"
          value={stats.totalStudents}
          subtitle={
            stats.newStudentsThisMonth > 0
              ? `+${stats.newStudentsThisMonth} this month`
              : ""
          }
          color="text-blue-600"
          trend={stats.newStudentsThisMonth > 0 ? "up" : ""}
        />
        <StatCard
          icon={FaChalkboardTeacher}
          title="Teachers"
          value={stats.totalTeachers}
          color="text-green-600"
        />
        <StatCard
          icon={FaBook}
          title="Active Classes"
          value={stats.totalClasses}
          color="text-purple-600"
        />
        <StatCard
          icon={FaMoneyBillWave}
          title="Revenue"
          value={`Rs. ${stats.totalRevenue.toLocaleString()}`}
          subtitle="total to be collected"
          color="text-red-600"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="xl:col-span-2 space-y-6">
          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <FaClock className="text-blue-600" />
              Quick Actions
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <QuickAction
                icon={FaUserPlus}
                title="Students"
                description="Manage all students"
                color="text-blue-600"
                onClick={navigateToStudents}
                disabled={false}
              />
              <QuickAction
                icon={FaChalkboardTeacher}
                title="Teachers"
                description="Manage teaching staff"
                color="text-green-600"
                onClick={navigateToTeachers}
                disabled={false}
              />
              <QuickAction
                icon={FaBook}
                title="Classes"
                description="Manage classes & schedules"
                color="text-purple-600"
                onClick={navigateToClasses}
                disabled={false}
              />
              <QuickAction
                icon={FaCalendarAlt}
                title="Attendance"
                description="Take daily attendance"
                color="text-orange-600"
                onClick={navigateToAttendance}
              />
              <QuickAction
                icon={FaMoneyBillWave}
                title="Payments"
                description="Manage fee payments"
                color="text-yellow-600"
                onClick={navigateToPayments}
                disabled={false}
              />
              <QuickAction
                icon={FaChartLine}
                title="Reports"
                description="View analytics & reports - coming soon"
                color="text-indigo-600"
                onClick={navigateToReports}
                disabled={true}
              />
            </div>
          </div>

          {/* Recent Students */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <FaUsers className="text-blue-600" />
              Recent Students
            </h3>
            <div className="space-y-3">
              {recentStudents.length > 0 ? (
                recentStudents.map((student) => (
                  <div
                    key={student._id}
                    className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        {student.profilePicture ? (
                          <img
                            src={student.profilePicture}
                            alt={student.name}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <FaUsers className="text-blue-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {student.name}
                        </p>
                        <p className="text-sm text-gray-500">
                          ID: {student.studentId}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">
                        Grade {student.grade}
                      </p>
                      <p className="text-xs text-gray-400">
                        {new Date(
                          student.enrollmentDate || student.createdAt
                        ).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">
                  No students found
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Active Classes */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <FaBook className="text-purple-600" />
              Active Classes
            </h3>
            <div className="space-y-4">
              {activeClasses.length > 0 ? (
                activeClasses.map((cls) => (
                  <div
                    key={cls._id}
                    className="p-4 border-l-4 border-purple-500 bg-purple-50 rounded-r-lg hover:bg-purple-100 transition-colors"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <p className="font-medium text-gray-900">{cls.name}</p>
                      <span className="text-xs text-purple-600 bg-purple-100 px-2 py-1 rounded">
                        {cls.studentCount} students
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{cls.subject}</p>
                    <div className="flex justify-between items-center text-xs text-gray-500">
                      <span>Grade {cls.grade}</span>
                      <span>{cls.teacher?.name || "No teacher"}</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">
                  No classes found
                </p>
              )}
            </div>
          </div>

          {/* System Summary */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <FaSchool className="text-indigo-600" />
              System Summary
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600">Total Students</span>
                <span className="font-semibold text-gray-900">
                  {stats.totalStudents}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600">Active Teachers</span>
                <span className="font-semibold text-gray-900">
                  {stats.totalTeachers}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600">Classes Running</span>
                <span className="font-semibold text-gray-900">
                  {stats.totalClasses}
                </span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-600">Revenue to be collected</span>
                <span className="font-semibold text-red-600">
                  Rs. {stats.totalRevenue.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
