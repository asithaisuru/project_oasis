// pages/Teachers.jsx
import React, { useState, useEffect } from "react";
import { teacherService } from "../services/teacherService";
import { classService } from "../services/classService";
import {
  FaChalkboardTeacher,
  FaSearch,
  FaPlus,
  FaEdit,
  FaTrash,
  FaEye,
  FaFilter,
  FaPhone,
  FaEnvelope,
  FaSchool,
  FaUserGraduate,
  FaBook,
} from "react-icons/fa";

const Teachers = () => {
  const [teachers, setTeachers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    status: "active",
    teacherId: `TCH${Date.now()}`,
    hireDate: new Date().toISOString().split("T")[0],
    salary: 0,
    address: {
      street: "",
      city: "",
      state: "",
      zipCode: "",
    },
    emergencyContact: {
      name: "",
      phone: "",
      relationship: "",
    },
    notes: "",
  });

  useEffect(() => {
    const token = localStorage.getItem("token");
    const user = localStorage.getItem("user");

    console.log("=== AUTH DEBUG ===");
    console.log("Token exists:", !!token);
    console.log("Token value:", token);
    console.log("User exists:", !!user);
    console.log("User value:", user);
    console.log("=== END DEBUG ===");

    if (!token) {
      alert(
        "Please log in to access teachers management. You will be redirected to login."
      );
      setTimeout(() => {
        window.location.href = "/login";
      }, 2000);
      return;
    }

    fetchTeachers();
    fetchClasses();
  }, []);

  const fetchTeachers = async () => {
    try {
      setLoading(true);
      const response = await teacherService.getTeachers();
      setTeachers(response.data || []);
    } catch (error) {
      console.error("Error fetching teachers:", error);
      setTeachers([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchClasses = async () => {
    try {
      const response = await classService.getClasses();
      setClasses(response.data || []);
    } catch (error) {
      console.error("Error fetching classes:", error);
      setClasses([]);
    }
  };

  const handleAddTeacher = async (e) => {
    e.preventDefault();
    try {
      console.log("=== FRONTEND DEBUG ===");
      console.log("Form data before sending:", formData);
      console.log("Subject value:", formData.subject);
      console.log("Subject type:", typeof formData.subject);
      console.log("All form keys:", Object.keys(formData));
      console.log("=== END DEBUG ===");

      const response = await teacherService.createTeacher(formData);
      console.log("Teacher created successfully:", response);

      // Reset form on success
      setFormData({
        name: "",
        email: "",
        phone: "",
        subject: "",
        status: "active",
        teacherId: `TCH${Date.now()}`,
        hireDate: new Date().toISOString().split("T")[0],
        salary: 0,
        address: {
          street: "",
          city: "",
          state: "",
          zipCode: "",
        },
        emergencyContact: {
          name: "",
          phone: "",
          relationship: "",
        },
        notes: "",
      });
      setShowAddModal(false);
      fetchTeachers();
    } catch (error) {
      console.error("Error adding teacher:", error);
      console.error("Error response:", error.response?.data);
      
      if (error.response?.data?.errors) {
        const errorDetails = error.response.data.errors.map(err => 
          `• ${err.path}: ${err.msg}`
        ).join('\n');
        alert(`Validation errors:\n\n${errorDetails}`);
      } else {
        const errorMessage = error.response?.data?.message || error.message;
        alert('Error adding teacher: ' + errorMessage);
      }
    }
  };

  const handleEditTeacher = async (e) => {
    e.preventDefault();
    try {
      await teacherService.updateTeacher(selectedTeacher._id, formData);
      setShowEditModal(false);
      setSelectedTeacher(null);
      fetchTeachers();
    } catch (error) {
      console.error("Error updating teacher:", error);
      alert(
        "Error updating teacher: " +
          (error.response?.data?.message || error.message)
      );
    }
  };

  const handleViewTeacher = (teacher) => {
    setSelectedTeacher(teacher);
    setShowViewModal(true);
  };

  const handleEditClick = (teacher) => {
    setSelectedTeacher(teacher);
    setFormData({
      name: teacher.name || "",
      email: teacher.email || "",
      phone: teacher.phone || "",
      subject: teacher.subject || "",
      status: teacher.status || "active",
      teacherId: teacher.teacherId || `TCH${Date.now()}`,
      hireDate: teacher.hireDate
        ? new Date(teacher.hireDate).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0],
      salary: teacher.salary || 0,
      address: {
        street: teacher.address?.street || "",
        city: teacher.address?.city || "",
        state: teacher.address?.state || "",
        zipCode: teacher.address?.zipCode || "",
      },
      emergencyContact: {
        name: teacher.emergencyContact?.name || "",
        phone: teacher.emergencyContact?.phone || "",
        relationship: teacher.emergencyContact?.relationship || "",
      },
      notes: teacher.notes || "",
    });
    setShowEditModal(true);
  };

  const handleDeleteTeacher = async (teacherId) => {
    if (window.confirm("Are you sure you want to delete this teacher?")) {
      try {
        await teacherService.deleteTeacher(teacherId);
        fetchTeachers();
      } catch (error) {
        console.error("Error deleting teacher:", error);
        alert(
          "Error deleting teacher: " +
            (error.response?.data?.message || error.message)
        );
      }
    }
  };

  const getTeacherClasses = (teacherId) => {
    return classes.filter((cls) => cls.teacher?._id === teacherId);
  };

  // Helper function to format schedule data safely
  const formatSchedule = (schedule) => {
    if (!schedule) return "Schedule not set";

    if (typeof schedule === "string") {
      return schedule;
    }

    if (
      typeof schedule === "object" &&
      schedule.days &&
      schedule.startTime &&
      schedule.endTime
    ) {
      return `${schedule.days} ${schedule.startTime} - ${schedule.endTime}`;
    }

    if (typeof schedule === "object") {
      try {
        return Object.entries(schedule)
          .map(([key, value]) => `${key}: ${value}`)
          .join(", ");
      } catch {
        return "Schedule available";
      }
    }

    return "Schedule not set";
  };

  const filteredTeachers = teachers.filter((teacher) => {
    const matchesSearch =
      teacher.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      teacher.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      teacher.subject?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || teacher.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const StatusBadge = ({ status }) => {
    const statusColors = {
      active: "bg-green-100 text-green-800",
      inactive: "bg-gray-100 text-gray-800",
      on_leave: "bg-yellow-100 text-yellow-800",
      retired: "bg-blue-100 text-blue-800",
    };

    const statusText = {
      active: "Active",
      inactive: "Inactive",
      on_leave: "On Leave",
      retired: "Retired",
    };

    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${
          statusColors[status] || "bg-gray-100 text-gray-800"
        }`}
      >
        {statusText[status] || status}
      </span>
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
            <FaChalkboardTeacher className="mr-3 text-blue-600" />
            Teachers Management
          </h1>
          <p className="text-gray-600 mt-1">
            Manage all teacher records, schedules, and information
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors duration-200"
        >
          <FaPlus className="w-4 h-4" />
          <span>Add New Teacher</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Total Teachers
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {teachers.length}
              </p>
            </div>
            <FaChalkboardTeacher className="text-blue-500 text-xl" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Active Teachers
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {teachers.filter((t) => t.status === "active").length}
              </p>
            </div>
            <FaUserGraduate className="text-green-500 text-xl" />
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <FaSearch className="absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search teachers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="on_leave">On Leave</option>
            <option value="retired">Retired</option>
          </select>

          {/* Reset Filters */}
          <button
            onClick={() => {
              setSearchTerm("");
              setStatusFilter("all");
            }}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200 flex items-center justify-center space-x-2"
          >
            <FaFilter className="w-4 h-4" />
            <span>Reset Filters</span>
          </button>
        </div>
      </div>

      {/* Teachers Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Teacher
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact Information
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Classes
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTeachers.length === 0 ? (
                <tr>
                  <td
                    colSpan="5"
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    <FaChalkboardTeacher className="mx-auto text-4xl text-gray-300 mb-2" />
                    <p>No teachers found</p>
                    {searchTerm || statusFilter !== "all" ? (
                      <p className="text-sm">Try adjusting your filters</p>
                    ) : (
                      <p className="text-sm">
                        Get started by adding your first teacher
                      </p>
                    )}
                  </td>
                </tr>
              ) : (
                filteredTeachers.map((teacher) => {
                  const teacherClasses = getTeacherClasses(teacher._id);
                  return (
                    <tr
                      key={teacher._id}
                      className="hover:bg-gray-50 transition-colors duration-150"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <FaChalkboardTeacher className="text-blue-600" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {teacher.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              ID: {teacher.teacherId}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 flex items-center space-x-1 mb-1">
                          <FaEnvelope className="text-gray-400" />
                          <span className="truncate">{teacher.email}</span>
                        </div>
                        <div className="text-sm text-gray-500 flex items-center space-x-1">
                          <FaPhone className="text-gray-400" />
                          <span>{teacher.phone}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={teacher.status} />
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {teacherClasses.length} classes
                        </div>
                        <div className="text-xs text-gray-500">
                          {teacherClasses
                            .slice(0, 2)
                            .map((cls) => cls.name)
                            .join(", ")}
                          {teacherClasses.length > 2 && "..."}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => handleViewTeacher(teacher)}
                            className="text-blue-600 hover:text-blue-900 transition-colors duration-200 p-1 rounded hover:bg-blue-50"
                            title="View Details"
                          >
                            <FaEye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleEditClick(teacher)}
                            className="text-green-600 hover:text-green-900 transition-colors duration-200 p-1 rounded hover:bg-green-50"
                            title="Edit Teacher"
                          >
                            <FaEdit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteTeacher(teacher._id)}
                            className="text-red-600 hover:text-red-900 transition-colors duration-200 p-1 rounded hover:bg-red-50"
                            title="Delete Teacher"
                          >
                            <FaTrash className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Teacher Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                Add New Teacher
              </h2>
              <form onSubmit={handleAddTeacher} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email *
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone *
                    </label>
                    <input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Subject *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.subject}
                      onChange={(e) =>
                        setFormData({ ...formData, subject: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., Mathematics"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Teacher ID *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.teacherId}
                      onChange={(e) =>
                        setFormData({ ...formData, teacherId: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., TCH001"
                    />
                  </div>
                  {/* <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Hire Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.createdAt}
                      onChange={(e) =>
                        setFormData({ ...formData, createdAt: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div> */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) =>
                        setFormData({ ...formData, status: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="on_leave">On Leave</option>
                      <option value="retired">Retired</option>
                    </select>
                  </div>
                </div>

                {/* Emergency Contact */}
                <div className="border-t pt-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">
                    Emergency Contact
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Contact Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.emergencyContact.name}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            emergencyContact: {
                              ...formData.emergencyContact,
                              name: e.target.value,
                            },
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Contact Phone *
                      </label>
                      <input
                        type="tel"
                        required
                        value={formData.emergencyContact.phone}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            emergencyContact: {
                              ...formData.emergencyContact,
                              phone: e.target.value,
                            },
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Relationship *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.emergencyContact.relationship}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            emergencyContact: {
                              ...formData.emergencyContact,
                              relationship: e.target.value,
                            },
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
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
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                  >
                    Add Teacher
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Teacher Modal */}
      {showEditModal && selectedTeacher && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                Edit Teacher
              </h2>
              <form onSubmit={handleEditTeacher} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email *
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone *
                    </label>
                    <input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Subject *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.subject}
                      onChange={(e) =>
                        setFormData({ ...formData, subject: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Teacher ID *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.teacherId}
                      onChange={(e) =>
                        setFormData({ ...formData, teacherId: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  {/* <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Hire Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.createdAt}
                      onChange={(e) =>
                        setFormData({ ...formData, createdAt: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div> */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) =>
                        setFormData({ ...formData, status: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="on_leave">On Leave</option>
                      <option value="retired">Retired</option>
                    </select>
                  </div>
                </div>

                {/* Emergency Contact */}
                <div className="border-t pt-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">
                    Emergency Contact
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Contact Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.emergencyContact.name}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            emergencyContact: {
                              ...formData.emergencyContact,
                              name: e.target.value,
                            },
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Contact Phone *
                      </label>
                      <input
                        type="tel"
                        required
                        value={formData.emergencyContact.phone}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            emergencyContact: {
                              ...formData.emergencyContact,
                              phone: e.target.value,
                            },
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Relationship *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.emergencyContact.relationship}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            emergencyContact: {
                              ...formData.emergencyContact,
                              relationship: e.target.value,
                            },
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                  >
                    Update Teacher
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* View Teacher Modal */}
      {showViewModal && selectedTeacher && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-2xl font-bold text-gray-800">
                  Teacher Details
                </h2>
                <button
                  onClick={() => setShowViewModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="space-y-6">
                {/* Basic Info */}
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center">
                    <FaChalkboardTeacher className="text-blue-600 text-2xl" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">
                      {selectedTeacher.name}
                    </h3>
                    <p className="text-gray-600">
                      ID: {selectedTeacher.teacherId}
                    </p>
                    <div className="flex space-x-2 mt-1">
                      <StatusBadge status={selectedTeacher.status} />
                    </div>
                  </div>
                </div>

                {/* Contact & Professional Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-gray-700 mb-3">
                      Contact Information
                    </h4>
                    <div className="space-y-2">
                      <p className="text-gray-600 flex items-center space-x-2">
                        <FaEnvelope className="text-gray-400" />
                        <span>{selectedTeacher.email}</span>
                      </p>
                      <p className="text-gray-600 flex items-center space-x-2">
                        <FaPhone className="text-gray-400" />
                        <span>{selectedTeacher.phone}</span>
                      </p>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-700 mb-3">
                      Professional Information
                    </h4>
                    <div className="space-y-2">
                      <p className="text-gray-600">
                        <span className="font-medium">Status:</span>{" "}
                        <StatusBadge status={selectedTeacher.status} />
                      </p>
                      <p className="text-gray-600">
                        <span className="font-medium">Subject:</span>{" "}
                        {selectedTeacher.subject}
                      </p>
                      <p className="text-gray-600">
                        <span className="font-medium">Created At:</span>{" "}
                        {new Date(selectedTeacher.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Classes & Schedule */}
                <div>
                  <h4 className="font-semibold text-gray-700 mb-3">
                    Assigned Classes
                  </h4>
                  {getTeacherClasses(selectedTeacher._id).length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {getTeacherClasses(selectedTeacher._id).map(
                        (cls, index) => (
                          <div
                            key={index}
                            className="bg-gray-50 p-3 rounded-lg border"
                          >
                            <p className="font-medium text-gray-900">
                              {cls.name}
                            </p>
                            <p className="text-sm text-gray-600">
                              {cls.subject} - Grade {cls.grade}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {formatSchedule(cls.schedule)}
                            </p>
                          </div>
                        )
                      )}
                    </div>
                  ) : (
                    <p className="text-gray-500 italic">No classes assigned</p>
                  )}
                </div>

                {/* Emergency Contact */}
                {selectedTeacher.emergencyContact && (
                  <div>
                    <h4 className="font-semibold text-gray-700 mb-3">
                      Emergency Contact
                    </h4>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-gray-900">
                        <span className="font-medium">Name:</span>{" "}
                        {selectedTeacher.emergencyContact.name}
                      </p>
                      <p className="text-gray-600">
                        <span className="font-medium">Phone:</span>{" "}
                        {selectedTeacher.emergencyContact.phone}
                      </p>
                      <p className="text-gray-600">
                        <span className="font-medium">Relationship:</span>{" "}
                        {selectedTeacher.emergencyContact.relationship}
                      </p>
                    </div>
                  </div>
                )}

                {selectedTeacher.notes && (
                  <div>
                    <h4 className="font-semibold text-gray-700 mb-2">Notes</h4>
                    <p className="text-gray-600 bg-gray-50 p-3 rounded-lg">
                      {selectedTeacher.notes}
                    </p>
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

export default Teachers;