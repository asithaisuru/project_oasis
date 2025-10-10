import React, { useState, useEffect } from "react";
import { paymentService } from "../services/paymentService";
import { studentService } from "../services/studentService";
import { classService } from "../services/classService";

const Payments = () => {
  const [payments, setPayments] = useState([]);
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("view"); // 'view' or 'generate'
  const [generationResult, setGenerationResult] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Generation states
  // In your generation states, change the defaults:
  const [studentGeneration, setStudentGeneration] = useState({
    studentId: "",
    months: 6,
    startFrom: new Date().toISOString().split("T")[0], // This already prevents past dates
  });

  const [classGeneration, setClassGeneration] = useState({
    classId: "",
    month: new Date().toLocaleString("default", { month: "long" }),
    year: new Date().getFullYear(),
  });

  const [bulkGeneration, setBulkGeneration] = useState({
    month: new Date().toLocaleString("default", { month: "long" }),
    year: new Date().getFullYear(),
  });

  const [filter, setFilter] = useState({
    status: "",
    month: "",
    year: new Date().getFullYear(),
  });

  useEffect(() => {
    loadPayments();
    loadStudents();
    loadClasses();
  }, []);

  const loadPayments = async () => {
    try {
      setLoading(true);
      const data = await paymentService.getPayments();
      setPayments(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error loading payments:", error);
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRevertToPending = async (paymentId) => {
    if (
      !window.confirm(
        "Are you sure you want to revert this payment to pending?"
      )
    ) {
      return;
    }

    try {
      await paymentService.revertPaymentToPending(paymentId);
      alert("Payment reverted to pending successfully");
      loadPayments();
    } catch (error) {
      console.error("Error reverting payment:", error);
      alert("Error reverting payment");
    }
  };

  const loadStudents = async () => {
    try {
      const data = await studentService.getStudents();
      if (Array.isArray(data)) {
        setStudents(data);
      } else if (data && Array.isArray(data.data)) {
        setStudents(data.data);
      } else {
        setStudents([]);
      }
    } catch (error) {
      console.error("Error loading students:", error);
      setStudents([]);
    }
  };

  const loadClasses = async () => {
    try {
      const data = await classService.getClasses();
      if (Array.isArray(data)) {
        setClasses(data);
      } else if (data && Array.isArray(data.data)) {
        setClasses(data.data);
      } else {
        setClasses([]);
      }
    } catch (error) {
      console.error("Error loading classes:", error);
      setClasses([]);
    }
  };

  // Automated Payment Generation Functions
  const handleGenerateStudentPayments = async () => {
    if (!studentGeneration.studentId) {
      alert("Please select a student");
      return;
    }

    try {
      setLoading(true);
      const result = await paymentService.generateStudentPayments(
        studentGeneration
      );
      setGenerationResult(result);
      alert(
        `Successfully generated ${result.payments.length} payments for ${result.student.name}`
      );
      loadPayments();
    } catch (error) {
      console.error("Error generating student payments:", error);
      alert("Error: " + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateClassPayments = async () => {
    if (!classGeneration.classId) {
      alert("Please select a class");
      return;
    }

    try {
      setLoading(true);
      const result = await paymentService.generateClassPayments(
        classGeneration
      );
      setGenerationResult(result);
      alert(
        `Successfully generated ${result.payments.length} payments for ${result.class.name}`
      );
      loadPayments();
    } catch (error) {
      console.error("Error generating class payments:", error);
      alert("Error: " + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateBulkPayments = async () => {
    try {
      setLoading(true);
      const result = await paymentService.generateBulkPayments(bulkGeneration);
      setGenerationResult(result);
      alert(
        `Successfully generated ${result.totalGenerated} payments for ${result.totalStudents} students`
      );
      loadPayments();
    } catch (error) {
      console.error("Error generating bulk payments:", error);
      alert("Error: " + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsPaid = async (paymentId) => {
    try {
      await paymentService.markPaymentAsPaid(paymentId, {
        paymentMethod: "cash",
        transactionId: `TXN${Date.now()}`,
      });
      alert("Payment marked as paid successfully");
      loadPayments();
    } catch (error) {
      console.error("Error marking payment as paid:", error);
      alert("Error marking payment as paid");
    }
  };

  const getStatusBadge = (status) => {
    const statusClasses = {
      pending: "bg-yellow-100 text-yellow-800",
      paid: "bg-green-100 text-green-800",
      overdue: "bg-red-100 text-red-800",
    };
    return `px-2 py-1 rounded-full text-xs font-medium ${statusClasses[status]}`;
  };

  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const filteredPayments = payments.filter((payment) => {
    const matchesSearch =
      searchTerm === "" ||
      payment.student?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.class?.className
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      payment.class?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.paymentId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.month?.toLowerCase().includes(searchTerm.toLowerCase());

    return (
      matchesSearch &&
      (filter.status === "" || payment.status === filter.status) &&
      (filter.month === "" || payment.month === filter.month) &&
      (filter.year === "" || payment.year.toString() === filter.year.toString())
    );
  });

  const safeStudents = Array.isArray(students) ? students : [];
  const safeClasses = Array.isArray(classes) ? classes : [];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">
          Payments Management
        </h1>
        <div className="flex space-x-4">
          <button
            onClick={() => setActiveTab("view")}
            className={`px-4 py-2 rounded-lg ${
              activeTab === "view"
                ? "bg-blue-500 text-white"
                : "bg-gray-200 text-gray-700"
            }`}
          >
            View Payments
          </button>
          <button
            onClick={() => setActiveTab("generate")}
            className={`px-4 py-2 rounded-lg ${
              activeTab === "generate"
                ? "bg-blue-500 text-white"
                : "bg-gray-200 text-gray-700"
            }`}
          >
            Generate Payments
          </button>
        </div>
      </div>

      {activeTab === "generate" && (
        <div className="space-y-6">
          {/* Student Payment Generation */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-4">
              Generate Student Payments
            </h3>
            <p className="text-gray-600 mb-4">
              Generate multiple months of payments for a specific student
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Student *
                </label>
                <select
                  value={studentGeneration.studentId}
                  onChange={(e) =>
                    setStudentGeneration((prev) => ({
                      ...prev,
                      studentId: e.target.value,
                    }))
                  }
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="">Select Student</option>
                  {safeStudents.map((student) => (
                    <option key={student._id} value={student._id}>
                      {student.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Number of Months
                </label>
                <select
                  value={studentGeneration.months}
                  onChange={(e) =>
                    setStudentGeneration((prev) => ({
                      ...prev,
                      months: parseInt(e.target.value),
                    }))
                  }
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value={3}>3 Months</option>
                  <option value={6}>6 Months</option>
                  <option value={12}>12 Months</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start From
                </label>
                <input
                  type="date"
                  value={studentGeneration.startFrom}
                  onChange={(e) =>
                    setStudentGeneration((prev) => ({
                      ...prev,
                      startFrom: e.target.value,
                    }))
                  }
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
            </div>

            <button
              onClick={handleGenerateStudentPayments}
              disabled={loading || !studentGeneration.studentId}
              className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg disabled:opacity-50"
            >
              {loading ? "Generating..." : "Generate Student Payments"}
            </button>
          </div>

          {/* Class Payment Generation */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-4">
              Generate Class Payments
            </h3>
            <p className="text-gray-600 mb-4">
              Generate payments for all students in a specific class for a given
              month
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Class *
                </label>
                <select
                  value={classGeneration.classId}
                  onChange={(e) =>
                    setClassGeneration((prev) => ({
                      ...prev,
                      classId: e.target.value,
                    }))
                  }
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="">Select Class</option>
                  {safeClasses.map((classItem) => (
                    <option key={classItem._id} value={classItem._id}>
                      {classItem.name || classItem.className}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Month
                </label>
                <select
                  value={classGeneration.month}
                  onChange={(e) =>
                    setClassGeneration((prev) => ({
                      ...prev,
                      month: e.target.value,
                    }))
                  }
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  {months.map((month) => (
                    <option key={month} value={month}>
                      {month}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Year
                </label>
                <input
                  type="number"
                  value={classGeneration.year}
                  onChange={(e) =>
                    setClassGeneration((prev) => ({
                      ...prev,
                      year: parseInt(e.target.value),
                    }))
                  }
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
            </div>

            <button
              onClick={handleGenerateClassPayments}
              disabled={loading || !classGeneration.classId}
              className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-2 rounded-lg disabled:opacity-50"
            >
              {loading ? "Generating..." : "Generate Class Payments"}
            </button>
          </div>

          {/* Bulk Payment Generation */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-4">
              Generate Bulk Payments
            </h3>
            <p className="text-gray-600 mb-4">
              Generate payments for ALL students across ALL classes for a given
              month
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 max-w-md">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Month
                </label>
                <select
                  value={bulkGeneration.month}
                  onChange={(e) =>
                    setBulkGeneration((prev) => ({
                      ...prev,
                      month: e.target.value,
                    }))
                  }
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  {months.map((month) => (
                    <option key={month} value={month}>
                      {month}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Year
                </label>
                <input
                  type="number"
                  value={bulkGeneration.year}
                  onChange={(e) =>
                    setBulkGeneration((prev) => ({
                      ...prev,
                      year: parseInt(e.target.value),
                    }))
                  }
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
            </div>

            <button
              onClick={handleGenerateBulkPayments}
              disabled={loading}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg disabled:opacity-50"
            >
              {loading ? "Generating..." : "Generate All Payments"}
            </button>
            <p className="text-sm text-gray-500 mt-2">
              This will create payments for all enrolled students across all
              classes
            </p>
          </div>

          {/* Generation Results */}
          {generationResult && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-semibold text-green-800 mb-2">
                Generation Complete!
              </h4>
              <p className="text-green-700">{generationResult.message}</p>
              {generationResult.payments && (
                <div className="mt-2">
                  <p className="text-sm font-medium text-green-800">
                    Generated payments:
                  </p>
                  <ul className="list-disc list-inside text-sm text-green-700">
                    {generationResult.payments.slice(0, 5).map((payment) => (
                      <li key={payment._id}>
                        {payment.student.name} - {payment.class.className} -{" "}
                        {payment.month} {payment.year} - ${payment.amount}
                      </li>
                    ))}
                    {generationResult.payments.length > 5 && (
                      <li>
                        ... and {generationResult.payments.length - 5} more
                      </li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === "view" && (
        <>
          {/* Filters and Payments Table (keep your existing view code) */}
          {/* Filters */}
          <div className="bg-white p-4 rounded-lg shadow-md mb-6">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {" "}
              {/* Changed to 5 columns */}
              {/* Search Bar - Add this */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Search
                </label>
                <input
                  type="text"
                  placeholder="Search by student, class, payment ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              {/* Your existing filters - they will now be in columns 3, 4, and 5 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={filter.status}
                  onChange={(e) =>
                    setFilter({ ...filter, status: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                  <option value="overdue">Overdue</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Month
                </label>
                <select
                  value={filter.month}
                  onChange={(e) =>
                    setFilter({ ...filter, month: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="">All Months</option>
                  {months.map((month) => (
                    <option key={month} value={month}>
                      {month}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Year
                </label>
                <input
                  type="number"
                  value={filter.year}
                  onChange={(e) =>
                    setFilter({ ...filter, year: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
              {/* Remove the Clear Filters button from here and add it below */}
            </div>

            {/* Add Clear All button below the filters */}
            <div className="flex justify-end mt-4 space-x-2">
              <button
                onClick={() => {
                  setSearchTerm("");
                  setFilter({
                    status: "",
                    month: "",
                    year: new Date().getFullYear(),
                  });
                }}
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md text-sm"
              >
                Clear All
              </button>
            </div>
          </div>

          {/* Payments Table */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {loading ? (
              <div className="text-center py-8">Loading payments...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Payment ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Student
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Class
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Month/Year
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Due Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredPayments.map((payment) => (
                      <tr key={payment._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {payment.paymentId}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {payment.student?.name || "N/A"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {payment.class?.className ||
                            payment.class?.name ||
                            "N/A"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          Rs. {payment.amount}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {payment.month} {payment.year}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={getStatusBadge(payment.status)}>
                            {payment.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {payment.dueDate
                            ? new Date(payment.dueDate).toLocaleDateString()
                            : "N/A"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {payment.isGenerated ? (
                            <span className="text-blue-600 text-xs">
                              Auto-generated
                            </span>
                          ) : (
                            <span className="text-gray-500 text-xs">
                              Manual
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {payment.status === "pending" ? (
                            <button
                              onClick={() => handleMarkAsPaid(payment._id)}
                              className="text-green-600 hover:text-green-900 mr-3"
                            >
                              Mark Paid
                            </button>
                          ) : (
                            <button
                              onClick={() => handleRevertToPending(payment._id)}
                              className="text-yellow-600 hover:text-yellow-900 mr-3"
                            >
                              Revert to Pending
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredPayments.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No payments found. Generate some payments using the
                    "Generate Payments" tab!
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Payments;
