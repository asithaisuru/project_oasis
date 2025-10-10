// Attendance.jsx
import React, { useState, useEffect, useRef, use } from "react";
import { attendanceService } from "../services/attendanceService";
import { classService } from "../services/classService";
import { studentService } from "../services/studentService";
import { QRCodeSVG } from "qrcode.react";
import QrScanner from "qr-scanner";
import {
  FaCamera,
  FaStop,
  FaDownload,
  FaQrcode,
  FaUserCheck,
  FaUserTimes,
  FaPhone,
  FaEnvelope,
  FaUser,
  FaSchool,
  FaMoneyBillWave,
  FaCheckCircle,
  FaExclamationTriangle,
  FaTimes,
  FaSync,
  FaSearch,
  FaClock,
} from "react-icons/fa";

const Attendance = () => {
  // Data
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [scannedStudents, setScannedStudents] = useState([]);

  // UI state
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  });
  const [loading, setLoading] = useState(false);

  // Scanner state
  const [showScanner, setShowScanner] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanStatus, setScanStatus] = useState("idle");
  const [scanMessage, setScanMessage] = useState("");
  const [cameraError, setCameraError] = useState("");

  // Student details modal
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [scannedStudent, setScannedStudent] = useState(null);
  const [markingAttendance, setMarkingAttendance] = useState(false);

  // QR modal
  const [showQRModal, setShowQRModal] = useState(false);
  const [selectedStudentForQR, setSelectedStudentForQR] = useState(null);
  const [manualQRInput, setManualQRInput] = useState("");

  // Search state
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);

  // refs
  const videoRef = useRef(null);
  const qrScannerRef = useRef(null);

  // --- Lifecycle: load initial lists ---
  useEffect(() => {
    fetchClasses();
    fetchStudents();
    return () => stopScanner();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    console.log(
      "🔄 Component mounted - Today's date should be:",
      new Date().toISOString().split("T")[0]
    );
    console.log("📅 Current selectedDate:", selectedDate);
  }, []);

  useEffect(() => {
    const getStudentCurrentPaymentStatus = async (studentId) => {
      if (!studentId) return;
      try {
        const response = await attendanceService.getStudentCurrentPaymentStatus(
          studentId
        );
        if (response.success) {
          setScannedStudent((prev) => ({
            ...prev,
            feeStatus: response.data.status || "unknown",
          }));
        }
      } catch (error) {
        console.error(
          "Error fetching student's current payment status:",
          error
        );
        return null;
      }
    };

    getStudentCurrentPaymentStatus(scannedStudent?._id);
  }, [scannedStudent]);

  useEffect(() => {
    if (selectedClass && selectedDate) {
      fetchClassAttendance();
    } else {
      setScannedStudents([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClass, selectedDate]);

  // --- API calls ---
  const fetchClasses = async () => {
    try {
      const res = await classService.getClasses();
      const data = res.data || [];
      setClasses(data);
      if (data.length > 0 && !selectedClass) {
        setSelectedClass(data[0]._id);
      }
    } catch (err) {
      console.error("fetchClasses:", err);
    }
  };

  const fetchStudents = async () => {
    try {
      const res = await studentService.getStudents();
      setStudents(res.data || []);
    } catch (err) {
      console.error("fetchStudents:", err);
    }
  };

  const fetchClassAttendance = async () => {
    if (!selectedClass || !selectedDate) return;
    try {
      setLoading(true);

      const queryDate = new Date(selectedDate);
      queryDate.setHours(0, 0, 0, 0);

      const res = await attendanceService.getAttendance({
        class: selectedClass,
        date: queryDate.toISOString(),
      });

      const record = res.data?.[0] || null;
    } catch (err) {
      console.error("fetchClassAttendance error:", err);
      setScannedStudents([]);
    } finally {
      setLoading(false);
    }
  };

  // --- Search functionality ---
  const handleSearch = (term) => {
    setSearchTerm(term);
    if (term.trim() === "") {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    const results = students.filter(
      (student) =>
        student.name.toLowerCase().includes(term.toLowerCase()) ||
        (student.studentId &&
          student.studentId.toLowerCase().includes(term.toLowerCase())) ||
        student.email.toLowerCase().includes(term.toLowerCase())
    );

    setSearchResults(results);
    setShowSearchResults(true);
  };

  const showStudentDetails = (student) => {
    setScannedStudent(student);
    setShowStudentModal(true);
    setShowSearchResults(false);
    setSearchTerm("");
  };

  // --- Scanner lifecycle & handlers ---
  const initializeScanner = async () => {
    if (!selectedClass) {
      alert("Select a class first!");
      return;
    }

    setCameraError("");
    setScanStatus("scanning");
    setScanMessage("Requesting camera permission...");
    setShowScanner(true);

    await new Promise((r) => setTimeout(r, 250));

    const videoEl = videoRef.current;
    if (!videoEl) {
      setCameraError("Video element not found");
      return;
    }

    try {
      if (qrScannerRef.current) {
        qrScannerRef.current.stop();
        qrScannerRef.current.destroy();
      }

      qrScannerRef.current = new QrScanner(
        videoEl,
        (result) => {
          if (result?.data) handleScanResult(result.data);
        },
        {
          highlightScanRegion: true,
          highlightCodeOutline: true,
        }
      );

      await qrScannerRef.current.start();
      setIsScanning(true);
      setScanStatus("scanning");
      setScanMessage("Camera ready - point at QR code");
    } catch (err) {
      console.error("Error starting scanner:", err);
      setScanStatus("error");
      setCameraError(
        err.message || "Could not start camera. Check permissions."
      );
    }
  };

  const stopScanner = () => {
    if (qrScannerRef.current) {
      try {
        qrScannerRef.current.stop();
        qrScannerRef.current.destroy();
        qrScannerRef.current = null;
      } catch (err) {
        console.error("Error stopping scanner:", err);
      }
    }
    setIsScanning(false);
    setShowScanner(false);
    setScanStatus("idle");
    setScanMessage("");
    setCameraError("");
  };

  // --- When a QR is scanned ---
  const handleScanResult = async (qrData) => {
    try {
      setScanStatus("processing");
      setScanMessage("Processing QR...");

      const response = await attendanceService.scanQRCode(qrData);

      if (response.success) {
        const student = response.data.student;

        // *** FIXED: Handle both class IDs and populated class objects ***
        const isEnrolled = student.enrolledClasses?.some((cls) => {
          // If cls is an object (populated), check its _id
          if (cls && typeof cls === "object") {
            return cls._id === selectedClass;
          }
          // If cls is a string (ID), check directly
          return cls === selectedClass;
        });

        if (!isEnrolled) {
          setScanStatus("error");
          setScanMessage(`${student.name} is not enrolled in this class.`);
          setTimeout(() => {
            if (isScanning) {
              setScanStatus("scanning");
              setScanMessage("Camera ready - scan next");
            }
          }, 3000);
          return;
        }

        const alreadyPresent = scannedStudents.some(
          (s) => s.student._id === student._id && s.status === "present"
        );

        if (alreadyPresent) {
          setScanStatus("warning");
          setScanMessage(`${student.name} already marked present.`);
          setTimeout(() => {
            if (isScanning) {
              setScanStatus("scanning");
              setScanMessage("Camera ready - scan next");
            }
          }, 2000);
          return;
        }

        setScannedStudent(student);
        setShowStudentModal(true);
        setScanStatus("success");
        setScanMessage(`✓ ${student.name} scanned - Review details`);
        if (qrScannerRef.current) qrScannerRef.current.stop();
      } else {
        throw new Error(response.message || "Unknown error from server");
      }
    } catch (err) {
      let errorMessage =
        err.response?.data?.message || err.message || "Scan error";
      setScanStatus("error");
      setScanMessage(`Error: ${errorMessage}`);
      setTimeout(() => {
        if (isScanning) {
          setScanStatus("scanning");
          setScanMessage("Camera ready - scan next");
        }
      }, 3000);
    }
  };

  // --- Mark attendance ---
  const updateLocalAttendance = (studentId, status, studentObj) => {
    setScannedStudents((prev) => {
      const existingIndex = prev.findIndex((p) => p.student._id === studentId);

      // Ensure student object has the right structure
      const studentData = studentObj
        ? {
            _id: studentObj._id,
            name: studentObj.name,
            studentId: studentObj.studentId,
            // Add other fields that might be needed
          }
        : {
            _id: studentId,
            name: "Unknown",
            studentId: "Unknown",
          };

      const newRecord = {
        student: studentData,
        status,
        timestamp: new Date().toISOString(),
      };

      if (existingIndex >= 0) {
        const updatedList = [...prev];
        updatedList[existingIndex] = newRecord;
        return updatedList;
      } else {
        return [newRecord, ...prev];
      }
    });
  };

  const markAttendance = async (studentId, status, options = {}) => {
    try {
      const currentTime = new Date().toISOString();
      const payload = {
        class: selectedClass,
        date: new Date(selectedDate).toISOString(),
        student: studentId,
        status,
        notes: options.notes || `Marked ${status} manually`,
      };

      console.log("Sending attendance payload:", payload);

      const response = await attendanceService.markAttendance(payload);
      console.log("Attendance service response:", response);

      if (response.success) {
        // Store timestamp locally since backend doesn't have it yet
        updateLocalAttendance(studentId, status, {
          ...options.studentObj,
          timestamp: currentTime, // Add timestamp on frontend
        });
        return response;
      } else {
        throw new Error(response.message || "Failed to mark attendance");
      }
    } catch (err) {
      console.error("markAttendance error:", err);
      const errorMessage = err.response?.data?.message || err.message;
      alert(`Error marking attendance: ${errorMessage}`);
      throw err;
    }
  };

  const markAttendanceFromModal = async (status) => {
    if (!scannedStudent) return;

    console.log(
      "Marking attendance for:",
      scannedStudent._id,
      "Status:",
      status
    );
    setMarkingAttendance(true);

    try {
      const response = await markAttendance(scannedStudent._id, status, {
        notes: `Marked ${status} via QR scan`,
        studentObj: scannedStudent,
      });

      console.log("Attendance marked successfully:", response);

      setShowStudentModal(false);
      setScannedStudent(null);

      // Refresh the attendance data to get the latest from server
      await fetchClassAttendance();

      if (qrScannerRef.current && isScanning) {
        await qrScannerRef.current.start();
        setScanStatus("scanning");
        setScanMessage(
          `✓ ${scannedStudent.name} marked ${status} - Camera ready for next scan`
        );
      }
    } catch (err) {
      console.error("Error in markAttendanceFromModal:", err);
      // Error is already handled by markAttendance
    } finally {
      setMarkingAttendance(false);
    }
  };

  const closeStudentModal = async () => {
    setShowStudentModal(false);
    setScannedStudent(null);
    if (qrScannerRef.current && isScanning) {
      try {
        await qrScannerRef.current.start();
        setScanStatus("scanning");
        setScanMessage("Camera ready - scan next");
      } catch (e) {
        console.error("Error restarting scanner:", e);
      }
    }
  };

  // --- Utilities ---
  const getStatusIcon = (status) => {
    if (status === "present") return <FaUserCheck className="text-green-600" />;
    if (status === "late") return <FaClock className="text-yellow-600" />;
    if (status === "absent") return <FaUserTimes className="text-red-600" />;
    return <FaUserTimes className="text-gray-400" />;
  };

  const getFeeStatusIcon = (status) => {
    if (status === "paid") return <FaCheckCircle className="text-green-500" />;
    if (status === "overdue")
      return <FaExclamationTriangle className="text-red-500" />;
    return <FaMoneyBillWave className="text-yellow-500" />;
  };

  const calculateStats = () => {
    const total = students.filter((s) =>
      s.enrolledClasses?.includes(selectedClass)
    ).length;
    const present = scannedStudents.filter(
      (s) => s.status === "present"
    ).length;
    const percent = total > 0 ? Math.round((present / total) * 100) : 0;
    return { present, total, percent };
  };

  const exportCSV = () => {
    if (!selectedClass || scannedStudents.length === 0) {
      alert(
        "No attendance data to export. Please select a class and ensure there are attendance records."
      );
      return;
    }

    try {
      // Get the class name for the filename
      const className =
        classes.find((c) => c._id === selectedClass)?.name || "UnknownClass";

      // Create CSV headers
      const headers = ["Student Name", "Student ID", "Status", "Time", "Date"];

      // Create CSV rows
      const rows = scannedStudents.map((record) => {
        const student = record.student;
        const timestamp =
          record.timestamp || record.createdAt || record.updatedAt;

        let timeString = "N/A";
        let dateString = "N/A";

        if (timestamp) {
          try {
            const date = new Date(timestamp);
            if (!isNaN(date.getTime())) {
              timeString = date.toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
              });
              dateString = date.toLocaleDateString("en-US");
            }
          } catch (error) {
            console.error("Error formatting date:", error);
          }
        }

        return [
          `"${student?.name || "Unknown"}"`,
          `"${student?.studentId || student?._id || "N/A"}"`,
          `"${record.status || "N/A"}"`,
          `"${timeString}"`,
          `"${dateString}"`,
        ];
      });

      // Combine headers and rows
      const csvContent = [
        headers.join(","),
        ...rows.map((row) => row.join(",")),
      ].join("\n");

      // Create and download the file
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);

      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `attendance_${className}_${selectedDate.replace(/-/g, "")}.csv`
      );
      link.style.visibility = "hidden";

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      console.log("CSV exported successfully");
    } catch (error) {
      console.error("Error exporting CSV:", error);
      alert("Error exporting CSV file. Please try again.");
    }
  };

  const stats = calculateStats();
  const enrolledStudents = students.filter((s) =>
    s.enrolledClasses?.some((cls) => {
      if (cls && typeof cls === "object") {
        return cls._id === selectedClass;
      }
      return cls === selectedClass;
    })
  );

  // --- Render ---
  return (
    <div className="space-y-6 p-4">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <FaQrcode /> QR Attendance
          </h1>
          <p className="text-sm text-gray-600">
            Scan student QR codes for fast attendance
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* <div className="text-right">
            <div className="text-xs text-gray-500">Attendance Rate</div>
            <div className="text-lg font-bold">{stats.percent}%</div>
          </div> */}
          <button
            className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2"
            onClick={exportCSV}
            title="Export attendance CSV"
          >
            <FaDownload /> Export
          </button>
          <button
            className="px-3 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 flex items-center gap-2"
            onClick={fetchClassAttendance}
            title="Refresh attendance data"
          >
            <FaSync /> Refresh
          </button>
        </div>
      </header>

      {/* Search Section */}
      <section className="bg-white p-4 rounded shadow">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <FaSearch /> Search Student Details
        </h3>
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search by name, student ID, or email..."
            className="w-full border rounded px-3 py-2 pl-10"
          />
          <FaSearch className="absolute left-3 top-3 text-gray-400" />
          {showSearchResults && (
            <div className="absolute z-10 w-full mt-1 bg-white border rounded shadow-lg max-h-60 overflow-y-auto">
              {searchResults.length > 0 ? (
                searchResults.map((student) => (
                  <div
                    key={student._id}
                    className="p-3 border-b hover:bg-gray-50 cursor-pointer"
                    onClick={() => showStudentDetails(student)}
                  >
                    <div className="font-medium">{student.name}</div>
                    <div className="text-sm text-gray-600">
                      ID: {student.studentId} | Email: {student.email}
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-3 text-gray-500">
                  No students found matching "{searchTerm}"
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Controls */}
      <section className="bg-white p-4 rounded shadow grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm text-gray-600 block mb-1">Class</label>
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="w-full border rounded px-3 py-2"
          >
            <option value="">-- Select class --</option>
            {classes.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name} (Grade {c.grade})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm text-gray-600 block mb-1">Date</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full border rounded px-3 py-2"
          />
        </div>
        <div className="flex items-end gap-2 col-span-1 md:col-span-2">
          {!showScanner ? (
            <button
              onClick={initializeScanner}
              disabled={!selectedClass || loading}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded disabled:opacity-50"
            >
              <FaCamera className="inline mr-2" /> Start Scanner
            </button>
          ) : (
            <button
              onClick={stopScanner}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
            >
              <FaStop className="inline mr-2" /> Stop Scanner
            </button>
          )}
        </div>
      </section>

      {/* Scanner panel */}
      {showScanner && (
        <section className="bg-white rounded shadow p-4">
          <div className="mb-3 text-sm">
            <strong>Status:</strong> {scanMessage}
            {cameraError && (
              <span className="text-red-600"> - {cameraError}</span>
            )}
          </div>
          <div
            className="relative bg-black rounded overflow-hidden"
            style={{ minHeight: 220 }}
          >
            <video ref={videoRef} className="w-full h-auto" muted playsInline />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-48 h-48 border-2 border-green-400 rounded-lg" />
            </div>
          </div>
        </section>
      )}

      {/* Manual QR Input for development
      {!showScanner && (
        <section className="bg-white p-4 rounded shadow">
          <h3 className="font-semibold mb-3">
            Manual QR Input (For Dev/Testing)
          </h3>
          <div className="flex gap-2">
            <input
              type="text"
              value={manualQRInput}
              onChange={(e) => setManualQRInput(e.target.value)}
              placeholder="Paste QR code data here"
              className="flex-1 border rounded px-3 py-2"
              onKeyDown={(e) => e.key === "Enter" && handleManualQRSubmit()}
            />
            <button
              onClick={handleManualQRSubmit}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Submit
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Useful for testing when camera access (HTTPS) is not available.
          </p>
        </section>
      )} */}

      {/* Student Details Modal */}
      {showStudentModal && scannedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-lg">Student Details</h3>
              <button
                onClick={closeStudentModal}
                className="text-gray-600 hover:text-gray-800"
              >
                <FaTimes size={20} />
              </button>
            </div>
            {/* ... Modal content is fine, no changes needed ... */}
            <div className="text-center mb-6">
              <div className="w-80 h-80 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center border-4 border-white shadow-lg">
                {scannedStudent.profilePicture ? (
                  <img
                    src={scannedStudent.profilePicture}
                    alt={scannedStudent.name}
                    className="w-48 h-48 rounded-full object-cover"
                  />
                ) : (
                  <FaUser className="text-gray-400 text-7xl" />
                )}
              </div>
              <h4 className="font-bold text-xl">{scannedStudent.name}</h4>
              <p className="text-gray-600">ID: {scannedStudent.studentId}</p>
              <div className="flex items-center justify-center gap-2 mt-2">
                {getFeeStatusIcon(scannedStudent.feeStatus)}
                <span
                  className={`text-sm font-medium ${
                    scannedStudent.feeStatus === "paid"
                      ? "text-green-600"
                      : scannedStudent.feeStatus === "overdue"
                      ? "text-red-600"
                      : "text-yellow-600"
                  }`}
                >
                  Fee: {scannedStudent.feeStatus?.toUpperCase()}
                </span>
              </div>
            </div>
            <div className="space-y-4 mb-6 bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center gap-3 text-sm">
                <FaEnvelope className="text-gray-400 flex-shrink-0" />
                <span className="break-all">{scannedStudent.email}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <FaPhone className="text-gray-400 flex-shrink-0" />
                <span>{scannedStudent.phone}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <FaSchool className="text-gray-400 flex-shrink-0" />
                <span>
                  Grade {scannedStudent.grade} - {scannedStudent.school}
                </span>
              </div>
            </div>
            <div className="border-t pt-4">
              <p className="text-sm text-gray-600 mb-4 text-center">
                Mark attendance for {scannedStudent.name}?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => markAttendanceFromModal("present")}
                  disabled={markingAttendance}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <FaUserCheck />
                  {markingAttendance ? "Marking..." : "Mark Present"}
                </button>
                <button
                  onClick={() => markAttendanceFromModal("late")}
                  disabled={markingAttendance}
                  className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white py-3 px-4 rounded-lg font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <FaClock />
                  {markingAttendance ? "Marking..." : "Mark Late"}
                </button>
              </div>
              <button
                onClick={closeStudentModal}
                disabled={markingAttendance}
                className="w-full mt-3 border border-gray-300 text-gray-700 py-2 px-4 rounded hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Attendance list */}
      <section className="bg-white rounded shadow overflow-x-auto">
        <div className="px-4 py-3 border-b">
          <h3 className="font-semibold">
            Attendance for:{" "}
            {classes.find((c) => c._id === selectedClass)?.name ||
              "No Class Selected"}
          </h3>
          <div className="text-sm text-gray-500">
            Total Enrolled: {enrolledStudents.length}
          </div>
        </div>

        <table className="min-w-full">
          <thead className="bg-gray-50 text-xs uppercase text-gray-600">
            <tr>
              <th className="px-4 py-2 text-left">Student</th>
              <th className="px-4 py-2 text-left">Status</th>
              <th className="px-4 py-2 text-left">Time</th>
              <th className="px-4 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="4" className="text-center py-4">
                  Loading attendance...
                </td>
              </tr>
            ) : enrolledStudents.length === 0 ? (
              <tr>
                <td colSpan="4" className="text-center py-4 text-gray-500">
                  No students enrolled in this class.
                </td>
              </tr>
            ) : (
              enrolledStudents.map((enrolledStu) => {
                const attendanceRecord = scannedStudents.find((scanned) => {
                  const scannedStudentId =
                    scanned.student?._id || scanned.student;
                  return scannedStudentId === enrolledStu._id;
                });

                const status = attendanceRecord?.status;

                // Try different possible timestamp field names
                const timestamp =
                  attendanceRecord?.timestamp ||
                  attendanceRecord?.createdAt ||
                  attendanceRecord?.updatedAt ||
                  attendanceRecord?.time;

                // console.log("📅 Student record fields:", {
                //   name: enrolledStu.name,
                //   record: attendanceRecord,
                //   availableFields: attendanceRecord
                //     ? Object.keys(attendanceRecord)
                //     : "No record",
                // });

                return (
                  <tr
                    key={enrolledStu._id}
                    className="border-b hover:bg-gray-50"
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium">{enrolledStu.name}</div>
                      <div className="text-xs text-gray-500">
                        ID: {enrolledStu.studentId || enrolledStu._id}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-2 px-2 py-1 rounded text-sm ${
                          status === "present"
                            ? "bg-green-100 text-green-700"
                            : status === "late"
                            ? "bg-yellow-100 text-yellow-700"
                            : status === "absent"
                            ? "bg-red-100 text-red-700"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {getStatusIcon(status)}
                        {status
                          ? status.charAt(0).toUpperCase() + status.slice(1)
                          : "Not Marked"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {timestamp
                        ? (() => {
                            try {
                              const date = new Date(timestamp);
                              if (isNaN(date.getTime())) {
                                return "--:--";
                              }
                              return date.toLocaleTimeString("en-US", {
                                hour: "2-digit",
                                minute: "2-digit",
                                hour12: true,
                              });
                            } catch (error) {
                              console.log(
                                "Error parsing timestamp:",
                                timestamp,
                                error
                              );
                              return "--:--";
                            }
                          })()
                        : "No time"}
                    </td>
                    {/* In the Attendance list section - Update the manual buttons */}
                    <td className="px-4 py-3">
                      <div className="flex gap-2 items-center">
                        <button
                          onClick={() =>
                            markAttendance(enrolledStu._id, "present", {
                              studentObj: enrolledStu,
                            })
                          }
                          disabled={status === "present"}
                          className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded disabled:opacity-50 hover:bg-green-200"
                        >
                          Present
                        </button>
                        <button
                          onClick={() =>
                            markAttendance(enrolledStu._id, "absent", {
                              studentObj: enrolledStu,
                            })
                          }
                          disabled={status === "absent"}
                          className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded disabled:opacity-50 hover:bg-red-200"
                        >
                          Absent
                        </button>
                        <button
                          onClick={() => {
                            setSelectedStudentForQR(enrolledStu);
                            setShowQRModal(true);
                          }}
                          className="text-gray-500 hover:text-blue-600"
                          title="Show QR Code"
                        >
                          <FaQrcode />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </section>

      {/* QR modal */}
      {showQRModal && selectedStudentForQR && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-lg">Student QR Code</h3>
              <button
                onClick={() => setShowQRModal(false)}
                className="text-gray-600 hover:text-gray-800"
              >
                <FaTimes size={20} />
              </button>
            </div>
            <div className="flex flex-col items-center gap-4">
              <QRCodeSVG
                value={
                  selectedStudentForQR._id ||
                  selectedStudentForQR.studentId ||
                  ""
                }
                size={200}
              />
              <div className="text-center">
                <div className="font-medium">{selectedStudentForQR.name}</div>
                <div className="text-sm text-gray-500">
                  ID:{" "}
                  {selectedStudentForQR.studentId || selectedStudentForQR._id}
                </div>
              </div>
              <button
                onClick={() => setShowQRModal(false)}
                className="mt-3 w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Attendance;
