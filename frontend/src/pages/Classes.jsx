import React, { useState, useEffect } from "react";
import { classService } from "../services/classService";
import { teacherService } from "../services/teacherService";
import { studentService } from "../services/studentService";
import {
  FaBook,
  FaSearch,
  FaPlus,
  FaEdit,
  FaTrash,
  FaEye,
  FaFilter,
  FaChalkboardTeacher,
  FaUsers,
  FaClock,
  FaCalendar,
  FaMoneyBillWave,
  FaDoorOpen,
  FaSort,
} from "react-icons/fa";

const Classes = () => {
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [gradeFilter, setGradeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    subject: "",
    grade: "",
    teacher: "",
    schedule: {
      days: [],
      startTime: "",
      endTime: "",
    },
    fee: "",
  });

  useEffect(() => {
    fetchClasses();
    fetchTeachers();
    fetchStudents();
  }, []);

  const handleEditClass = (classItem) => {
    setSelectedClass(classItem);
    setFormData({
      name: classItem.name,
      subject: classItem.subject,
      grade: classItem.grade,
      teacher: classItem.teacher?._id || classItem.teacher,
      schedule: classItem.schedule || {
        days: [],
        startTime: "",
        endTime: "",
      },
      fee: classItem.fee,
    });
    setShowEditModal(true);
  };

  const handleUpdateClass = async (e) => {
    e.preventDefault();
    try {
      await classService.updateClass(selectedClass._id, formData);
      setShowEditModal(false);
      setSelectedClass(null);
      setFormData({
        name: "",
        subject: "",
        grade: "",
        teacher: "",
        schedule: {
          days: [],
          startTime: "",
          endTime: "",
        },
        fee: "",
      });
      fetchClasses(); // Refresh the classes list
    } catch (error) {
      console.error("Error updating class:", error);
      alert(
        "Error updating class: " +
        (error.response?.data?.message || error.message)
      );
    }
  };

  const fetchClasses = async () => {
    try {
      setLoading(true);
      const response = await classService.getClasses();
      setClasses(response.data || []);
    } catch (error) {
      console.error("Error fetching classes:", error);
      setClasses([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeachers = async () => {
    try {
      const response = await teacherService.getTeachers();
      setTeachers(response.data || []);
    } catch (error) {
      console.error("Error fetching teachers:", error);
      setTeachers([]);
    }
  };

  const fetchStudents = async () => {
    try {
      const response = await studentService.getStudents();
      setStudents(response.data || []);
    } catch (error) {
      console.error("Error fetching students:", error);
      setStudents([]);
    }
  };

  const filteredClasses = classes.filter((classItem) => {
    const matchesSearch =
      classItem.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      classItem.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      classItem.classId?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesSubject =
      subjectFilter === "all" || classItem.subject === subjectFilter;
    const matchesGrade =
      gradeFilter === "all" || classItem.grade === gradeFilter;
    const matchesStatus =
      statusFilter === "all" || classItem.status === statusFilter;

    return matchesSearch && matchesSubject && matchesGrade && matchesStatus;
  });

  const getUniqueSubjects = () => {
    return [...new Set(classes.map((c) => c.subject))];
  };

  const getUniqueGrades = () => {
    return [...new Set(classes.map((c) => c.grade))];
  };

  const handleViewClass = (classItem) => {
    setSelectedClass(classItem);
    setShowViewModal(true);
  };

  const handleAddClass = async (e) => {
    e.preventDefault();
    try {
      await classService.createClass(formData);
      setShowAddModal(false);
      setFormData({
        name: "",
        subject: "",
        grade: "",
        teacher: "",
        schedule: {
          days: [],
          startTime: "",
          endTime: "",
        },
        fee: "",
      });
      fetchClasses();
    } catch (error) {
      console.error("Error adding class:", error);
      alert(
        "Error adding class: " +
        (error.response?.data?.message || error.message)
      );
    }
  };

  const handleDeleteClass = async (classId) => {
    if (
      window.confirm(
        "Are you sure you want to delete this class? This action cannot be undone."
      )
    ) {
      try {
        await classService.deleteClass(classId);
        fetchClasses();
      } catch (error) {
        console.error("Error deleting class:", error);
        alert(
          "Error deleting class: " +
          (error.response?.data?.message || error.message)
        );
      }
    }
  };

  const StatusBadge = ({ status }) => {
    const statusColors = {
      active: "bg-green-100 text-green-800",
      inactive: "bg-gray-100 text-gray-800",
      completed: "bg-blue-100 text-blue-800",
    };

    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[status] || "bg-gray-100 text-gray-800"
          }`}
      >
        {status?.charAt(0).toUpperCase() + status?.slice(1)}
      </span>
    );
  };

  const ScheduleDisplay = ({ schedule }) => {
    if (!schedule) return null;

    return (
      <div className="text-sm">
      <div className="flex items-center space-x-1 text-gray-600">
        <FaCalendar className="w-3 h-3" />
        <span>{schedule.days?.map(day => day.charAt(0).toUpperCase() + day.slice(1)).join(", ")}</span>
      </div>
      <div className="flex items-center space-x-1 text-gray-600">
        <FaClock className="w-3 h-3" />
        <span>
        {schedule.startTime} - {schedule.endTime}
        </span>
      </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 flex items-center">
            <FaBook className="mr-3 text-purple-600" />
            Classes Management
          </h1>
          <p className="text-gray-600 mt-1">
            Manage all classes, schedules, and enrollments
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors duration-200"
        >
          <FaPlus className="w-4 h-4" />
          <span>Add New Class</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Classes</p>
              <p className="text-2xl font-bold text-gray-900">
                {classes.length}
              </p>
            </div>
            <FaBook className="text-purple-500 text-xl" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Active Classes
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {classes.filter((c) => c.status === "active").length}
              </p>
            </div>
            <FaChalkboardTeacher className="text-green-500 text-xl" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Total Students
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {classes.reduce(
                  (acc, cls) => acc + (cls.currentStrength || 0),
                  0
                )}
              </p>
            </div>
            <FaUsers className="text-blue-500 text-xl" />
          </div>
        </div>
        {/* <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg. Fee</p>
              <p className="text-2xl font-bold text-gray-900">
                Rs.
                {Math.round(
                  classes.reduce((acc, cls) => acc + (cls.fee || 0), 0) /
                    (classes.length || 1)
                )}
              </p>
            </div>
            <FaMoneyBillWave className="text-yellow-500 text-xl" />
          </div>
        </div> */}
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {/* Search */}
          <div className="relative">
            <FaSearch className="absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search classes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            />
          </div>

          {/* Subject Filter */}
          <select
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          >
            <option value="all">All Subjects</option>
            {getUniqueSubjects().map((subject) => (
              <option key={subject} value={subject}>
                {subject}
              </option>
            ))}
          </select>

          {/* Grade Filter */}
          <select
            value={gradeFilter}
            onChange={(e) => setGradeFilter(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          >
            <option value="all">All Grades</option>
            {getUniqueGrades().map((grade) => (
              <option key={grade} value={grade}>
                Grade {grade}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="completed">Completed</option>
          </select>

          {/* Reset Filters */}
          <button
            onClick={() => {
              setSearchTerm("");
              setSubjectFilter("all");
              setGradeFilter("all");
              setStatusFilter("all");
            }}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200 flex items-center justify-center space-x-2"
          >
            <FaFilter className="w-4 h-4" />
            <span>Reset Filters</span>
          </button>
        </div>
      </div>

      {/* Classes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredClasses.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <FaBook className="mx-auto text-4xl text-gray-300 mb-4" />
            <p className="text-gray-500 text-lg">No classes found</p>
            {searchTerm ||
              subjectFilter !== "all" ||
              gradeFilter !== "all" ||
              statusFilter !== "all" ? (
              <p className="text-gray-400">Try adjusting your filters</p>
            ) : (
              <p className="text-gray-400">
                Get started by adding your first class
              </p>
            )}
          </div>
        ) : (
          filteredClasses.map((classItem) => (
            <div
              key={classItem._id}
              className="bg-white rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow duration-200"
            >
              {/* Class Header */}
              <div className="p-4 border-b border-gray-200">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-semibold text-gray-900 text-lg">
                      {classItem.name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      ID: {classItem.classId}
                    </p>
                  </div>
                  <StatusBadge status={classItem.status} />
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <FaBook className="w-3 h-3" />
                  <span>{classItem.subject}</span>
                  <span>•</span>
                  <span>Grade {classItem.grade}</span>
                </div>
              </div>

              {/* Class Details */}
              <div className="p-4 space-y-3">
                {/* Teacher */}
                <div className="flex items-center space-x-2">
                  <FaChalkboardTeacher className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-700">
                    {classItem.teacher?.name || "Teacher not assigned"}
                  </span>
                </div>

                {/* Schedule */}
                <ScheduleDisplay schedule={classItem.schedule} />

                {/* Fee */}
                <div className="flex items-center space-x-2">
                  <FaMoneyBillWave className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-700">
                    Rs. {classItem.fee}/month
                  </span>
                </div>

                {/* Student Count */}
                {/* <div className="flex items-center space-x-2">
                  <FaUsers className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-700">
                    {classItem.currentStrength || 0} students enrolled
                  </span>
                </div> */}
              </div>

              {/* Actions - FIXED EDIT BUTTON */}
              <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 rounded-b-lg">
                <div className="flex justify-between items-center">
                  <button
                    onClick={() => handleViewClass(classItem)}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center space-x-1 transition-colors duration-200"
                  >
                    <FaEye className="w-3 h-3" />
                    <span>View Details</span>
                  </button>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEditClass(classItem)}
                      className="text-green-600 hover:text-green-800 transition-colors duration-200"
                      title="Edit Class"
                    >
                      <FaEdit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteClass(classItem._id)}
                      className="text-red-600 hover:text-red-800 transition-colors duration-200"
                      title="Delete Class"
                    >
                      <FaTrash className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Class Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                Add New Class
              </h2>
              <form onSubmit={handleAddClass} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Class Name
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      placeholder="Eg : 2026 O/L Maths Grade 10"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Subject
                    </label>
                    <select
                      required
                      value={formData.subject}
                      onChange={(e) =>
                        setFormData({ ...formData, subject: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    >
                      <option value="">Select Subject</option>
                      <option value="Sinhala">Sinhala</option>
                      <option value="English">English</option>
                      <option value="History">History</option>
                      <option value="Maths">Maths</option>
                      <option value="Science">Science</option>
                      <option value="IT">IT</option>
                      <option value="Tamil">Tamil</option>
                      <option value="Physics">Physics</option>
                      <option value="Chemistry">Chemistry</option>
                      <option value="Combined Maths">Combined Maths</option>
                      <option value="Art">Art</option>
                      <option value="Music">Music</option>
                      <option value="Dancing">Dancing</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Grade
                    </label>
                    <select
                      required
                      value={formData.grade}
                      onChange={(e) =>
                        setFormData({ ...formData, grade: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    >
                      <option value="">Select Grade</option>
                      <option value="6">Grade 6</option>
                      <option value="7">Grade 7</option>
                      <option value="8">Grade 8</option>
                      <option value="9">Grade 9</option>
                      <option value="10">Grade 10</option>
                      <option value="11">Grade 11</option>
                      <option value="12">Grade 12</option>
                      <option value="13">Grade 13</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Teacher
                    </label>
                    <select
                      required
                      value={formData.teacher}
                      onChange={(e) =>
                        setFormData({ ...formData, teacher: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    >
                      <option value="">Select Teacher</option>
                      {teachers.map((teacher) => (
                        <option key={teacher._id} value={teacher._id}>
                          {teacher.name} - {teacher.subject}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Monthly Fee (Rs. )
                    </label>
                    <input
                      type="number"
                      required
                      value={formData.fee}
                      onChange={(e) =>
                        setFormData({ ...formData, fee: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      placeholder="2000"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Start Time
                    </label>
                    <input
                      type="time"
                      value={formData.schedule.startTime}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          schedule: {
                            ...formData.schedule,
                            startTime: e.target.value,
                          },
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      End Time
                    </label>
                    <input
                      type="time"
                      value={formData.schedule.endTime}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          schedule: {
                            ...formData.schedule,
                            endTime: e.target.value,
                          },
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Days
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {[
                        "monday",
                        "tuesday",
                        "wednesday",
                        "thursday",
                        "friday",
                        "saturday",
                        "sunday",
                      ].map((day) => (
                        <label
                          key={day}
                          className="flex items-center space-x-2"
                        >
                          <input
                            type="checkbox"
                            checked={formData.schedule.days.includes(day)}
                            onChange={(e) => {
                              const newDays = e.target.checked
                                ? [...formData.schedule.days, day]
                                : formData.schedule.days.filter(
                                  (d) => d !== day
                                );
                              setFormData({
                                ...formData,
                                schedule: {
                                  ...formData.schedule,
                                  days: newDays,
                                },
                              });
                            }}
                            className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                          />
                          <span className="text-sm text-gray-700 capitalize">
                            {day}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-200"
                  >
                    Add Class
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {showEditModal && selectedClass && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                Edit Class
              </h2>
              <form onSubmit={handleUpdateClass} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Class Name
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      placeholder="e.g., Grade 10 Mathematics - Advanced"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Subject
                    </label>
                    <select
                      required
                      value={formData.subject}
                      onChange={(e) =>
                        setFormData({ ...formData, subject: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    >
                      <option value="">Select Subject</option>
                      <option value="Sinhala">Sinhala</option>
                      <option value="English">English</option>
                      <option value="History">History</option>
                      <option value="Maths">Maths</option>
                      <option value="Science">Science</option>
                      <option value="IT">IT</option>
                      <option value="Tamil">Tamil</option>
                      <option value="Physics">Physics</option>
                      <option value="Chemistry">Chemistry</option>
                      <option value="Combined Maths">Combined Maths</option>
                      <option value="Art">Art</option>
                      <option value="Music">Music</option>
                      <option value="Dancing">Dancing</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Grade
                    </label>
                    <select
                      required
                      value={formData.grade}
                      onChange={(e) =>
                        setFormData({ ...formData, grade: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    >
                      <option value="">Select Grade</option>
                      <option value="6">Grade 6</option>
                      <option value="7">Grade 7</option>
                      <option value="8">Grade 8</option>
                      <option value="9">Grade 9</option>
                      <option value="10">Grade 10</option>
                      <option value="11">Grade 11</option>
                      <option value="12">Grade 12</option>
                      <option value="13">Grade 13</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Teacher
                    </label>
                    <select
                      required
                      value={formData.teacher}
                      onChange={(e) =>
                        setFormData({ ...formData, teacher: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    >
                      <option value="">Select Teacher</option>
                      {teachers.map((teacher) => (
                        <option key={teacher._id} value={teacher._id}>
                          {teacher.name} - {teacher.subject}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Monthly Fee (Rs. )
                    </label>
                    <input
                      type="number"
                      required
                      value={formData.fee}
                      onChange={(e) =>
                        setFormData({ ...formData, fee: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      placeholder="2000"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                      value={formData.status || selectedClass.status}
                      onChange={(e) =>
                        setFormData({ ...formData, status: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Start Time
                    </label>
                    <input
                      type="time"
                      value={formData.schedule.startTime}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          schedule: {
                            ...formData.schedule,
                            startTime: e.target.value,
                          },
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      End Time
                    </label>
                    <input
                      type="time"
                      value={formData.schedule.endTime}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          schedule: {
                            ...formData.schedule,
                            endTime: e.target.value,
                          },
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Days
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {[
                        "monday",
                        "tuesday",
                        "wednesday",
                        "thursday",
                        "friday",
                        "saturday",
                        "sunday",
                      ].map((day) => (
                        <label
                          key={day}
                          className="flex items-center space-x-2"
                        >
                          <input
                            type="checkbox"
                            checked={formData.schedule.days.includes(day)}
                            onChange={(e) => {
                              const newDays = e.target.checked
                                ? [...formData.schedule.days, day]
                                : formData.schedule.days.filter(
                                  (d) => d !== day
                                );
                              setFormData({
                                ...formData,
                                schedule: {
                                  ...formData.schedule,
                                  days: newDays,
                                },
                              });
                            }}
                            className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                          />
                          <span className="text-sm text-gray-700 capitalize">
                            {day}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setSelectedClass(null);
                    }}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-200"
                  >
                    Update Class
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* View Class Modal */}
      {showViewModal && selectedClass && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">
                    {selectedClass.name}
                  </h2>
                  <p className="text-gray-600">ID: {selectedClass.classId}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <StatusBadge status={selectedClass.status} />
                  <button
                    onClick={() => setShowViewModal(false)}
                    className="text-gray-400 hover:text-gray-600 text-xl"
                  >
                    ×
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">
                    Class Information
                  </h3>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Subject</p>
                      <p className="font-medium">{selectedClass.subject}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Grade</p>
                      <p className="font-medium">Grade {selectedClass.grade}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Monthly Fee</p>
                      <p className="font-medium">Rs. {selectedClass.fee}</p>
                    </div>
                    {/* <div>
                      <p className="text-sm text-gray-600">Students Enrolled</p>
                      <p className="font-medium">
                        {selectedClass.currentStrength || 0}
                      </p>
                    </div> */}
                  </div>
                </div>

                {/* Schedule & Teacher */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">
                    Schedule & Teacher
                  </h3>

                  <div>
                    <p className="text-sm text-gray-600 mb-2">Teacher</p>
                    <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
                      <FaChalkboardTeacher className="text-gray-400" />
                      <div>
                        <p className="font-medium">
                          {selectedClass.teacher?.name || "Not assigned"}
                        </p>
                        <p className="text-sm text-gray-600">
                          {selectedClass.teacher?.email}
                        </p>
                      </div>
                    </div>
                  </div>

                  {selectedClass.schedule && (
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Schedule</p>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <ScheduleDisplay schedule={selectedClass.schedule} />
                      </div>
                    </div>
                  )}

                  <div>
                    <p className="text-sm text-gray-600 mb-2">Start Date</p>
                    <p className="font-medium">
                      {new Date(selectedClass.startDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* Students List */}
                {selectedClass.students &&
                  selectedClass.students.length > 0 && (
                    <div className="lg:col-span-2">
                      <h3 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-4">
                        Enrolled Students ({selectedClass.students.length})
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {selectedClass.students.map((student, index) => (
                          <div
                            key={index}
                            className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg"
                          >
                            <div className="flex-shrink-0 h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <FaUsers className="text-blue-600 text-sm" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {student.name}
                              </p>
                              <p className="text-xs text-gray-500 truncate">
                                {student.email}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
              </div>

              <div className="flex justify-end space-x-3 pt-6">
                <button
                  onClick={() => setShowViewModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Classes;
