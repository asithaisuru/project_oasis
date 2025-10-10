import React, { useState, useEffect, useCallback } from "react";
import { studentService } from "../services/studentService";
import { classService } from "../services/classService";
import { QRCodeSVG } from "qrcode.react";
import {
  FaUserPlus,
  FaUsers,
  FaUser,
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
  FaDownload,
  FaQrcode,
} from "react-icons/fa";
import StatCard from "../components/StatCard";

// Memoized form component - ONLY ONE DEFINITION
const StudentFormFields = React.memo(
  ({ formData, setFormData, handleProfilePictureUpload }) => {
    const handleChange = useCallback(
      (field, value) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
      },
      [setFormData]
    );

    return (
      <div className="space-y-4">
        <div className="flex items-center space-x-4">
          <div className="flex-shrink-0">
            {formData.profilePicture ? (
              <img
                src={formData.profilePicture}
                alt="Profile"
                className="h-20 w-20 rounded-full object-cover border-2 border-gray-300"
              />
            ) : (
              <div className="h-20 w-20 rounded-full bg-gray-200 flex items-center justify-center border-2 border-gray-300">
                <FaUser className="text-gray-400 text-2xl" />
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Profile Picture
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleProfilePictureUpload}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            <p className="text-xs text-gray-500 mt-1">
              JPG, PNG or GIF. Max size 2MB.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            {
              label: "Full Name *",
              type: "text",
              field: "name",
              required: true,
            },
            {
              label: "Student Email *",
              type: "email",
              field: "email",
              required: true,
            },
            {
              label: "Student Phone *",
              type: "tel",
              field: "phone",
              required: true,
            },
            {
              label: "Parent Name *",
              type: "text",
              field: "parentName",
              required: true,
            },
            {
              label: "Parent Email *",
              type: "email",
              field: "parentEmail",
              required: true,
            },
            {
              label: "Parent Phone *",
              type: "tel",
              field: "parentPhone",
              required: true,
            },
          ].map(({ label, type, field, required }) => (
            <div key={field}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {label}
              </label>
              <input
                type={type}
                required={required}
                value={formData[field]}
                onChange={(e) => handleChange(field, e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          ))}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Grade *
            </label>
            <select
              required
              value={formData.grade}
              onChange={(e) => handleChange("grade", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select Grade</option>
              {[6, 7, 8, 9, 10, 11, 12, 13].map((grade) => (
                <option key={grade} value={grade}>
                  Grade {grade}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              School *
            </label>
            <input
              type="text"
              required
              value={formData.school}
              onChange={(e) => handleChange("school", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleChange("notes", e.target.value)}
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>
    );
  }
);

// Memoized status badge
const StatusBadge = React.memo(({ status }) => {
  const statusColors = {
    active: "bg-green-100 text-green-800",
    inactive: "bg-gray-100 text-gray-800",
    suspended: "bg-red-100 text-red-800",
  };
  return (
    <span
      className={`px-2 py-1 rounded-full text-xs font-medium ${
        statusColors[status] || "bg-gray-100 text-gray-800"
      }`}
    >
      {status?.charAt(0).toUpperCase() + status?.slice(1)}
    </span>
  );
});

// Memoized QR modal
const QRCodeModal = React.memo(
  ({
    qrStudent,
    showQRModal,
    setShowQRModal,
    generateStudentQRCode,
    downloadQRCode,
  }) => {
    if (!showQRModal || !qrStudent) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg max-w-md w-full">
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800 flex items-center space-x-2">
                <FaQrcode className="text-blue-600" />
                <span>Student QR Code</span>
              </h3>
              <button
                onClick={() => setShowQRModal(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>
            <div className="text-center">
              <div className="mb-4">
                <QRCodeSVG
                  id={`qr-svg-${qrStudent._id}`}
                  value={generateStudentQRCode(qrStudent)}
                  size={200}
                  level="H"
                  includeMargin
                  className="mx-auto border rounded-lg"
                />
              </div>
              <div className="mb-4">
                <h4 className="font-semibold text-gray-900 text-lg">
                  {qrStudent.name}
                </h4>
                <p className="text-gray-600 text-sm">
                  ID: {qrStudent.studentId} | Grade {qrStudent.grade}
                </p>
                <p className="text-gray-500 text-xs mt-1">{qrStudent.school}</p>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => downloadQRCode(qrStudent)}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center justify-center space-x-2 transition-colors duration-200"
                >
                  <FaDownload className="w-4 h-4" />
                  <span>Download QR</span>
                </button>
                <button
                  onClick={() => setShowQRModal(false)}
                  className="flex-1 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                >
                  Close
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-3">
                This QR code can be used for attendance scanning
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

const Students = () => {
  // State
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [gradeFilter, setGradeFilter] = useState("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrStudent, setQrStudent] = useState(null);
  const [formError, setFormError] = useState("");
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [studentToEnroll, setStudentToEnroll] = useState(null);
  const [selectedClasses, setSelectedClasses] = useState([]);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    parentName: "",
    parentEmail: "",
    parentPhone: "",
    grade: "",
    school: "",
    profilePicture: "",
    notes: "",
  });

  // Effects
  useEffect(() => {
    fetchStudents();
    fetchClasses();
  }, []);

  // API calls
  const fetchStudents = async () => {
    try {
      setLoading(true);
      const response = await studentService.getStudents();
      setStudents(response.data || []);
    } catch (error) {
      console.error("Error fetching students:", error);
      setStudents([]);
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

  // Handlers
  // In your handleProfilePictureUpload function, add size validation
  const handleProfilePictureUpload = useCallback((e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size
      const maxSize = 5 * 1024 * 1024; // 5MB absolute limit
      if (file.size > maxSize) {
        alert(
          "Profile picture must be less than 5MB. Please choose a smaller image."
        );
        e.target.value = "";
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result;

        // Show size warning for large images
        if (base64String.length > 1000000) {
          console.log(
            "Large image detected, will upload separately after student creation"
          );
        }

        setFormData((prev) => ({ ...prev, profilePicture: base64String }));
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const uploadProfilePicture = async (studentId, profilePicture) => {
    const response = await axios.put(
      `${API_URL}/${studentId}/profile-picture`,
      { profilePicture },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
      }
    );
    return response;
  };

  const resetFormData = useCallback(() => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      parentName: "",
      parentEmail: "",
      parentPhone: "",
      grade: "",
      school: "",
      profilePicture: "",
      notes: "",
    });
  }, []);

  const handleEditClick = useCallback((student) => {
    setSelectedStudent(student);
    setFormData({
      name: student.name || "",
      email: student.email || "",
      phone: student.phone || "",
      parentName: student.parentName || "",
      parentEmail: student.parentEmail || "",
      parentPhone: student.parentPhone || "",
      grade: student.grade || "",
      school: student.school || "",
      notes: student.notes || "",
    });
    setShowEditModal(true);
    setFormError("");
  }, []);

  const handleAddStudent = async () => {
    setFormError("");
    setIsSubmitting(true);

    try {
      // Step 1: Check if profile picture is too large
      const profilePicture = formData.profilePicture;
      const isLargeImage = profilePicture && profilePicture.length > 1000000; // ~1MB

      // Create student data (remove profile picture if it's large)
      const studentData = { ...formData };
      if (isLargeImage) {
        delete studentData.profilePicture;
      }

      // Step 2: Create the student first
      const response = await studentService.createStudent(studentData);
      const newStudent = response.data;

      // Step 3: If we have a large profile picture, upload it separately
      if (isLargeImage && profilePicture) {
        try {
          await studentService.uploadProfilePicture(
            newStudent._id,
            profilePicture
          );
          console.log("Profile picture uploaded separately");
        } catch (uploadError) {
          console.warn(
            "Student created but profile picture upload failed:",
            uploadError
          );
          // Don't fail the entire operation - student was created successfully
        }
      }

      // Step 4: Reset form and show success
      resetFormData();
      setShowAddModal(false);

      // Refresh students list
      await fetchStudents();

      // Generate QR code
      const updatedStudents = await studentService.getStudents();
      const freshStudent = updatedStudents.data.find(
        (s) => s._id === newStudent._id
      );

      if (freshStudent) {
        setQrStudent(freshStudent);
        setShowQRModal(true);
        setTimeout(() => downloadQRCode(freshStudent), 1000);
      }
    } catch (error) {
      setFormError(
        error.response?.data?.message ||
          "An unknown error occurred. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStudent = async () => {
    if (!selectedStudent) return;
    setFormError("");
    setIsSubmitting(true);
    try {
      await studentService.updateStudent(selectedStudent._id, formData);
      resetFormData();
      setShowEditModal(false);
      setSelectedStudent(null);
      await fetchStudents();
    } catch (error) {
      setFormError(
        error.response?.data?.message ||
          "An unknown error occurred. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const generateStudentQRCode = (student) =>
    JSON.stringify({
      studentId: student._id,
      studentName: student.name,
      type: "student_attendance",
      timestamp: new Date().toISOString(),
    });

  const handleEnrollClick = (student) => {
    setStudentToEnroll(student);
    setSelectedClasses(student.enrolledClasses.map((c) => c._id));
    setShowEnrollModal(true);
  };

  const handleClassSelection = (classId) => {
    setSelectedClasses((prev) =>
      prev.includes(classId)
        ? prev.filter((id) => id !== classId)
        : [...prev, classId]
    );
  };

  const handleEnrollSubmit = async (e) => {
    e.preventDefault();
    if (!studentToEnroll) return;
    setIsEnrolling(true);
    try {
      await studentService.updateStudentEnrollments(
        studentToEnroll._id,
        selectedClasses
      );
      setShowEnrollModal(false);
      setStudentToEnroll(null);
      await fetchStudents();
    } catch (error) {
      alert(
        "Error: " +
          (error.response?.data?.message || "Could not update enrollments.")
      );
    } finally {
      setIsEnrolling(false);
    }
  };

  const downloadQRCode = (student) => {
    try {
      const svgElement = document.getElementById(`qr-svg-${student._id}`);
      if (!svgElement) throw new Error("QR code element not found");

      const svgString = new XMLSerializer().serializeToString(svgElement);
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const size = 300;
      canvas.width = canvas.height = size;

      const img = new Image();
      const svgBlob = new Blob([svgString], {
        type: "image/svg+xml;charset=utf-8",
      });
      const url = URL.createObjectURL(svgBlob);

      img.onload = () => {
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, size, size);
        ctx.drawImage(img, 50, 30, 200, 200);
        ctx.fillStyle = "black";
        ctx.textAlign = "center";
        ctx.font = "bold 14px Arial";
        ctx.fillText(student.name, size / 2, 250);
        ctx.font = "12px Arial";
        ctx.fillText(
          `ID: ${student.studentId} | Grade ${student.grade}`,
          size / 2,
          270
        );

        canvas.toBlob((blob) => {
          const downloadUrl = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.download = `student_${student.studentId}_qrcode.png`;
          link.href = downloadUrl;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(downloadUrl);
          URL.revokeObjectURL(url);
        }, "image/png");
      };
      img.src = url;
    } catch (error) {
      console.error("Error downloading QR code:", error);
      const textContent = `Student QR Code Information\nName: ${student.name}\nStudent ID: ${student.studentId}\nGrade: ${student.grade}\nSchool: ${student.school}`;
      const blob = new Blob([textContent], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.download = `student_${student.studentId}_qrinfo.txt`;
      link.href = url;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  const handleViewStudent = (student) => {
    setSelectedStudent(student);
    setShowViewModal(true);
  };
  const handleShowQRCode = (student) => {
    setQrStudent(student);
    setShowQRModal(true);
  };

  const handleDeleteStudent = async (studentId) => {
    if (window.confirm("Are you sure you want to delete this student?")) {
      try {
        await studentService.deleteStudent(studentId);
        fetchStudents();
      } catch (error) {
        alert(
          "Error deleting student: " +
            (error.response?.data?.message || error.message)
        );
      }
    }
  };

  // Filtering
  const filteredStudents = students.filter((student) => {
    const matchesSearch =
      student.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.studentId?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || student.status === statusFilter;
    const matchesGrade = gradeFilter === "all" || student.grade === gradeFilter;
    return matchesSearch && matchesStatus && matchesGrade;
  });

  // Loading state
  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 flex items-center">
            <FaUsers className="mr-3 text-blue-600" />
            Students Management
          </h1>
          <p className="text-gray-600 mt-1">
            Manage all student records and information
          </p>
        </div>
        <button
          onClick={() => {
            resetFormData();
            setShowAddModal(true);
            setFormError("");
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors duration-200"
        >
          <FaPlus className="w-4 h-4" />
          <span>Add New Student</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          {
            title: "Total Students",
            value: students.length,
            icon: FaUsers,
            color: "blue",
          },
          {
            title: "Active Students",
            value: students.filter((s) => s.status === "active").length,
            icon: FaUserGraduate,
            color: "green",
          },
          {
            title: "Different Grades",
            value: new Set(students.map((s) => s.grade)).size,
            icon: FaSchool,
            color: "purple",
          },
        ].map(({ title, value, icon: Icon, color }) => (
          <StatCard
            key={title}
            title={title}
            value={value}
            color={color}
            Icon={Icon}
          />
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <FaSearch className="absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search students..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="suspended">Suspended</option>
          </select>
          <select
            value={gradeFilter}
            onChange={(e) => setGradeFilter(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Grades</option>
            {[6, 7, 8, 9, 10, 11, 12, 13].map((grade) => (
              <option key={grade} value={grade}>
                Grade {grade}
              </option>
            ))}
          </select>
          <button
            onClick={() => {
              setSearchTerm("");
              setStatusFilter("all");
              setGradeFilter("all");
            }}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200 flex items-center justify-center space-x-2"
          >
            <FaFilter className="w-4 h-4" />
            <span>Reset Filters</span>
          </button>
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {[
                  "Student",
                  "Contact",
                  "Grade & School",
                  "Status",
                  "Enrollment Date",
                  "Actions",
                ].map((header) => (
                  <th
                    key={header}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td
                    colSpan="6"
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    <FaUsers className="mx-auto text-4xl text-gray-300 mb-2" />
                    <p>No students found</p>
                    <p className="text-sm">
                      {searchTerm ||
                      statusFilter !== "all" ||
                      gradeFilter !== "all"
                        ? "Try adjusting your filters"
                        : "Get started by adding your first student"}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student) => (
                  <tr
                    key={student._id}
                    className="hover:bg-gray-50 transition-colors duration-150"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          {student.profilePicture ? (
                            <img
                              src={student.profilePicture}
                              alt={student.name}
                              className="h-10 w-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <FaUserGraduate className="text-blue-600" />
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {student.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            ID: {student.studentId}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 flex items-center space-x-1 mb-1">
                        <FaEnvelope className="text-gray-400" />
                        <span>{student.email}</span>
                      </div>
                      <div className="text-sm text-gray-500 flex items-center space-x-1">
                        <FaPhone className="text-gray-400" />
                        <span>{student.phone}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        Grade {student.grade}
                      </div>
                      <div className="text-sm text-gray-500 flex items-center space-x-1">
                        <FaSchool className="text-gray-400" />
                        <span className="truncate max-w-xs">
                          {student.school}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={student.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(student.enrollmentDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        {[
                          {
                            icon: FaUserPlus,
                            onClick: () => handleEnrollClick(student),
                            title: "Enroll in Classes",
                            color: "blue",
                          },
                          {
                            icon: FaQrcode,
                            onClick: () => handleShowQRCode(student),
                            title: "QR Code",
                            color: "purple",
                          },
                          {
                            icon: FaEye,
                            onClick: () => handleViewStudent(student),
                            title: "View Details",
                            color: "blue",
                          },
                          {
                            icon: FaEdit,
                            onClick: () => handleEditClick(student),
                            title: "Edit Student",
                            color: "green",
                          },
                          {
                            icon: FaTrash,
                            onClick: () => handleDeleteStudent(student._id),
                            title: "Delete Student",
                            color: "red",
                          },
                        ].map(({ icon: Icon, onClick, title, color }) => (
                          <button
                            key={title}
                            onClick={onClick}
                            className={`text-${color}-600 hover:text-${color}-900 transition-colors duration-200 p-1 rounded hover:bg-${color}-50`}
                            title={title}
                          >
                            <Icon className="w-4 h-4" />
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      {showAddModal && (
        <StudentModal
          title="Add New Student"
          onSubmit={handleAddStudent}
          onClose={() => setShowAddModal(false)}
          formData={formData}
          setFormData={setFormData}
          handleProfilePictureUpload={handleProfilePictureUpload}
          formError={formError}
          isSubmitting={isSubmitting}
          submitText="Add Student"
        />
      )}
      {showEditModal && selectedStudent && (
        <StudentModal
          title="Edit Student"
          onSubmit={handleUpdateStudent}
          onClose={() => setShowEditModal(false)}
          formData={formData}
          setFormData={setFormData}
          handleProfilePictureUpload={handleProfilePictureUpload}
          formError={formError}
          isSubmitting={isSubmitting}
          submitText="Update Student"
        />
      )}
      {showViewModal && selectedStudent && (
        <ViewStudentModal
          student={selectedStudent}
          onClose={() => setShowViewModal(false)}
          generateStudentQRCode={generateStudentQRCode}
          downloadQRCode={downloadQRCode}
        />
      )}
      {showEnrollModal && studentToEnroll && (
        <EnrollModal
          student={studentToEnroll}
          classes={classes}
          selectedClasses={selectedClasses}
          onClassSelection={handleClassSelection}
          onSubmit={handleEnrollSubmit}
          onClose={() => setShowEnrollModal(false)}
          isEnrolling={isEnrolling}
        />
      )}
      <QRCodeModal
        qrStudent={qrStudent}
        showQRModal={showQRModal}
        setShowQRModal={setShowQRModal}
        generateStudentQRCode={generateStudentQRCode}
        downloadQRCode={downloadQRCode}
      />
    </div>
  );
};

// Reusable modal components
const StudentModal = ({
  title,
  onSubmit,
  onClose,
  formData,
  setFormData,
  handleProfilePictureUpload,
  formError,
  isSubmitting,
  submitText,
}) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
    <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
      <div className="p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">{title}</h2>
        <div className="space-y-4">
          {formError && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
              <span className="block sm:inline">{formError}</span>
            </div>
          )}
          {formData.profilePicture &&
            formData.profilePicture.length > 1000000 && (
              <p className="text-xs text-yellow-600 mt-1">
                Large image detected - will be uploaded separately after student
                creation
              </p>
            )}
          <StudentFormFields
            formData={formData}
            setFormData={setFormData}
            handleProfilePictureUpload={handleProfilePictureUpload}
          />
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              onClick={onSubmit}
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors duration-200"
            >
              {isSubmitting ? `${submitText}...` : submitText}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const ViewStudentModal = ({
  student,
  onClose,
  generateStudentQRCode,
  downloadQRCode,
}) => {
  const handlePrint = async () => {
    // Create a simple QR code representation using CSS
    const printWindow = window.open("", "_blank");

    printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Student Details - ${student.name}</title>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        @page {
          size: A4;
          margin: 15mm;
        }
        @media print {
          body { 
            margin: 0;
            padding: 0;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .a4-container {
            width: 210mm;
            min-height: 297mm;
            margin: 0;
            padding: 15mm;
            box-sizing: border-box;
          }
          .no-print { 
            display: none !important; 
          }
          * {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          margin: 0;
          padding: 0;
          background: white;
          color: #333;
        }
        .a4-container {
          width: 210mm;
          min-height: 297mm;
          margin: 0 auto;
          padding: 15mm;
          box-sizing: border-box;
          background: white;
        }
        .header {
          text-align: center;
          border-bottom: 3px solid #2563eb;
          padding-bottom: 12px;
          margin-bottom: 20px;
        }
        .header h1 {
          font-size: 24px;
          font-weight: bold;
          color: #1e293b;
          margin: 0 0 8px 0;
        }
        .header p {
          font-size: 12px;
          color: #64748b;
          margin: 0;
        }
        .main-content {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 20px;
        }
        .profile-section {
          text-align: center;
          padding: 15px;
          background: #f8fafc;
          border-radius: 8px;
            border: 1px solid #e2e8f0;
        }
        .profile-img {
          width: 180px;
          height: 180px;
          border-radius: 50%;
          object-fit: cover;
          border: 3px solid #2563eb;
          margin: 0 auto 12px;
        }
        .profile-placeholder {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background: #dbeafe;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 12px;
          border: 3px solid #2563eb;
        }
        .student-name {
          font-size: 18px;
          font-weight: bold;
          color: #1e293b;
          margin-bottom: 4px;
        }
        .student-id {
          font-size: 12px;
          color: #64748b;
          margin-bottom: 8px;
        }
        .status-badge {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: bold;
          text-transform: capitalize;
        }
        .contact-grid {
          display: grid;
          gap: 15px;
        }
        .contact-card {
          padding: 12px;
          background: #f8fafc;
          border-radius: 6px;
          border: 1px solid #e2e8f0;
        }
        .contact-card h3 {
          font-size: 14px;
          font-weight: 600;
          color: #374151;
          margin: 0 0 8px 0;
          border-bottom: 1px solid #e2e8f0;
          padding-bottom: 4px;
        }
        .contact-info {
          font-size: 12px;
          line-height: 1.4;
        }
        .contact-item {
          margin-bottom: 4px;
        }
        .contact-label {
          font-weight: 500;
          color: #4b5563;
        }
        .academic-section {
          grid-column: 1 / -1;
          padding: 15px;
          background: #f8fafc;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
          margin-bottom: 5px;
        }
        .academic-section h3 {
          font-size: 14px;
          font-weight: 600;
          color: #374151;
          margin: 0 0 12px 0;
          border-bottom: 1px solid #e2e8f0;
          padding-bottom: 4px;
        }
        .academic-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
        }
        .academic-item {
          font-size: 12px;
        }
        .academic-label {
          font-weight: 500;
          color: #4b5563;
          margin-bottom: 2px;
        }
        .classes-section {
          grid-column: 1 / -1;
          padding: 15px;
          background: #f8fafc;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
          margin-bottom: 5px;
        }
        .classes-section h3 {
          font-size: 14px;
          font-weight: 600;
          color: #374151;
          margin: 0 0 12px 0;
          border-bottom: 1px solid #e2e8f0;
          padding-bottom: 4px;
        }
        .classes-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 8px;
        }
        .class-item {
          padding: 8px;
          background: white;
          border-radius: 4px;
          border-left: 3px solid #2563eb;
          font-size: 11px;
        }
        .class-name {
          font-weight: 600;
          color: #1e293b;
          margin-bottom: 2px;
        }
        .class-details {
          color: #64748b;
        }
        .notes-section {
          grid-column: 1 / -1;
          padding: 15px;
          background: #f8fafc;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
          margin-bottom: 15px;
        }
        .notes-section h3 {
          font-size: 14px;
          font-weight: 600;
          color: #374151;
          margin: 0 0 8px 0;
          border-bottom: 1px solid #e2e8f0;
          padding-bottom: 4px;
        }
        .notes-content {
          font-size: 12px;
          line-height: 1.4;
          color: #374151;
        }
        .footer {
          text-align: center;
          margin-top: 20px;
          padding-top: 12px;
          border-top: 1px solid #e2e8f0;
          font-size: 10px;
          color: #94a3b8;
        }
        /* Simple QR Code Styling */
        .simple-qr {
          width: 120px;
          height: 120px;
          background: white;
          border: 2px solid #333;
          position: relative;
          margin: 0 auto;
        }
        .qr-corner {
          position: absolute;
          width: 20px;
          height: 20px;
          background: #000;
        }
        .qr-corner-tl {
          top: 10px;
          left: 10px;
        }
        .qr-corner-tr {
          top: 10px;
          right: 10px;
        }
        .qr-corner-bl {
          bottom: 10px;
          left: 10px;
        }
        .qr-pattern {
          position: absolute;
          background: #000;
        }
        .qr-text {
          position: absolute;
          bottom: -25px;
          left: 0;
          right: 0;
          text-align: center;
          font-size: 9px;
          color: #666;
        }
      </style>
    </head>
    <body>
      <div class="a4-container">
        <!-- Header -->
        <div class="header">
          <h1>Student Details</h1>
          <p>Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
        </div>

        <!-- Main Content -->
        <div class="main-content">
          <!-- Profile Section -->
          <div class="profile-section">
            ${
              student.profilePicture
                ? `<img src="${student.profilePicture}" alt="${student.name}" class="profile-img" />`
                : `<div class="profile-placeholder">
                <span style="font-size: 24px;">👤</span>
              </div>`
            }
            <div class="student-name">${student.name}</div>
            <div class="student-id">ID: ${student.studentId}</div>
            <div class="status-badge" style="${
              student.status === "active"
                ? "background: #d1fae5; color: #065f46;"
                : student.status === "inactive"
                ? "background: #f3f4f6; color: #374151;"
                : "background: #fee2e2; color: #991b1b;"
            }">
              ${
                student.status?.charAt(0).toUpperCase() +
                student.status?.slice(1)
              }
            </div>
          </div>

          <!-- Contact Information -->
          <div class="contact-grid">
            <!-- Student Contact -->
            <div class="contact-card">
              <h3>Student Contact</h3>
              <div class="contact-info">
                <div class="contact-item">
                  <span class="contact-label">Email:</span><br>
                  ${student.email || "N/A"}
                </div>
                <div class="contact-item">
                  <span class="contact-label">Phone:</span><br>
                  ${student.phone || "N/A"}
                </div>
              </div>
            </div>

            <!-- Parent Contact -->
            <div class="contact-card">
              <h3>Parent Contact</h3>
              <div class="contact-info">
                <div class="contact-item">
                  <span class="contact-label">Name:</span><br>
                  ${student.parentName || "N/A"}
                </div>
                <div class="contact-item">
                  <span class="contact-label">Email:</span><br>
                  ${student.parentEmail || "N/A"}
                </div>
                <div class="contact-item">
                  <span class="contact-label">Phone:</span><br>
                  ${student.parentPhone || "N/A"}
                </div>
              </div>
            </div>
          </div>

          <!-- Academic Information -->
          <div class="academic-section">
            <h3>Academic Information</h3>
            <div class="academic-grid">
              <div class="academic-item">
                <div class="academic-label">School</div>
                <div>${student.school || "N/A"}</div>
              </div>
              <div class="academic-item">
                <div class="academic-label">Enrollment Date</div>
                <div>${new Date(
                  student.enrollmentDate
                ).toLocaleDateString()}</div>
              </div>
            </div>
          </div>

          <!-- Enrolled Classes -->
          ${
            student.enrolledClasses?.length > 0
              ? `
            <div class="classes-section">
              <h3>Enrolled Classes (${student.enrolledClasses.length})</h3>
              <div class="classes-grid">
                ${student.enrolledClasses
                  .map(
                    (classItem, index) => `
                  <div class="class-item">
                    <div class="class-name">${
                      classItem.name || "Class Name"
                    }</div>
                    <div class="class-details">${
                      classItem.subject || "N/A"
                    }</div>
                  </div>
                `
                  )
                  .join("")}
              </div>
            </div>
          `
              : ""
          }

          <!-- Notes -->
          ${
            student.notes
              ? `
            <div class="notes-section">
              <h3>Notes</h3>
              <div class="notes-content">${student.notes}</div>
            </div>
          `
              : ""
          }
        </div>

        <!-- Footer -->
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} Oasis Management System • Confidential Student Document</p>
        </div>
      </div>

      <script>
        // Trigger print after content loads
        setTimeout(() => {
          window.print();
          setTimeout(() => {
            window.close();
          }, 100);
        }, 500);
      </script>
    </body>
    </html>
  `);

    printWindow.document.close();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-start mb-6">
            <h2 className="text-2xl font-bold text-gray-800">
              Student Details
            </h2>
            <div className="flex space-x-2">
              {/* Print Button */}
              <button
                onClick={handlePrint}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors duration-200 no-print"
                title="Print Student Details"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                  />
                </svg>
                <span>Print</span>
              </button>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 text-2xl no-print"
              >
                ×
              </button>
            </div>
          </div>

          {/* ... rest of your existing modal content remains the same ... */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Profile Section */}
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  {student.profilePicture ? (
                    <img
                      src={student.profilePicture}
                      alt={student.name}
                      className="h-60 w-60 rounded-full object-cover border-2 border-blue-200"
                    />
                  ) : (
                    <div className="h-60 w-60 bg-blue-100 rounded-full flex items-center justify-center border-2 border-blue-200">
                      <FaUserGraduate className="text-blue-600 text-4xl" />
                    </div>
                  )}
                </div>
                <div className="flex-1 items-center justify-center my-auto">
                  <h3 className="text-2xl font-semibold text-gray-900">
                    {student.name}
                  </h3>
                  <p className="text-gray-400">ID: {student.studentId}</p>
                  <StatusBadge status={student.status} />
                </div>
              </div>

              {/* Contact Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-gray-700 mb-2">
                    Student Contact
                  </h4>
                  <p className="text-gray-600 flex items-center space-x-2">
                    <FaEnvelope className="text-gray-400" />
                    <span>{student.email}</span>
                  </p>
                  <p className="text-gray-600 flex items-center space-x-2 mt-1">
                    <FaPhone className="text-gray-400" />
                    <span>{student.phone}</span>
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-700 mb-2">
                    Parent Contact
                  </h4>
                  <p className="text-gray-600">{student.parentName}</p>
                  <p className="text-gray-600">{student.parentEmail}</p>
                  <p className="text-gray-600">{student.parentPhone}</p>
                </div>
              </div>

              {/* Academic Information */}
              <div>
                <h4 className="font-semibold text-gray-700 mb-2">
                  Academic Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">School</p>
                    <p className="font-medium">{student.school}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Enrollment Date</p>
                    <p className="font-medium">
                      {new Date(student.enrollmentDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Enrolled Classes */}
              {student.enrolledClasses?.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-700 mb-2">
                    Enrolled Classes
                  </h4>
                  <div className="space-y-2">
                    {student.enrolledClasses.map((classItem, index) => (
                      <div key={index} className="bg-gray-50 p-3 rounded-lg">
                        <p className="font-medium">
                          {classItem.name || "Class Name"}
                        </p>
                        <p className="text-sm text-gray-600">
                          {classItem.subject}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              {student.notes && (
                <div>
                  <h4 className="font-semibold text-gray-700 mb-2">Notes</h4>
                  <p className="text-gray-600 bg-gray-50 p-3 rounded-lg">
                    {student.notes}
                  </p>
                </div>
              )}
            </div>

            {/* QR Code Section */}
            <div className="lg:col-span-1">
              <div className="bg-gray-50 p-6 rounded-lg border">
                <h4 className="font-semibold text-gray-700 mb-4 text-center flex items-center justify-center space-x-2">
                  <FaQrcode className="text-blue-600" />
                  <span>Student QR Code</span>
                </h4>
                <div className="text-center mb-4">
                  <QRCodeSVG
                    id={`qr-svg-view-${student._id}`}
                    value={generateStudentQRCode(student)}
                    size={200}
                    level="H"
                    includeMargin
                    className="mx-auto border rounded"
                  />
                </div>
                <div className="text-center text-sm text-gray-600 mb-4">
                  <p>Use this QR code for attendance scanning</p>
                  <p className="text-xs mt-1">
                    Student ID: {student.studentId}
                  </p>
                </div>
                <button
                  onClick={() => downloadQRCode(student)}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center justify-center space-x-2 transition-colors duration-200"
                >
                  <FaDownload className="w-4 h-4" />
                  <span>Download QR Code</span>
                </button>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-6 no-print">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const EnrollModal = ({
  student,
  classes,
  selectedClasses,
  onClassSelection,
  onSubmit,
  onClose,
  isEnrolling,
}) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
    <div className="bg-white rounded-lg max-w-lg w-full">
      <form onSubmit={onSubmit}>
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-2">
            Enroll Student
          </h2>
          <p className="text-gray-600 mb-4">
            Select classes for{" "}
            <span className="font-semibold">{student.name}</span>
          </p>
          <div className="max-h-60 overflow-y-auto border rounded-lg p-4 space-y-3">
            {classes.length > 0 ? (
              classes.map((cls) => (
                <div key={cls._id} className="flex items-center">
                  <input
                    type="checkbox"
                    id={`class-${cls._id}`}
                    checked={selectedClasses.includes(cls._id)}
                    onChange={() => onClassSelection(cls._id)}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label
                    htmlFor={`class-${cls._id}`}
                    className="ml-3 block text-sm font-medium text-gray-700"
                  >
                    {cls.name}{" "}
                    <span className="text-gray-500">
                      ({cls.subject} - Grade {cls.grade})
                    </span>
                  </label>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center">No classes available.</p>
            )}
          </div>
        </div>
        <div className="bg-gray-50 px-6 py-3 flex justify-end space-x-3 rounded-b-lg">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isEnrolling}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {isEnrolling ? "Saving..." : "Save Enrollments"}
          </button>
        </div>
      </form>
    </div>
  </div>
);

export default Students;
