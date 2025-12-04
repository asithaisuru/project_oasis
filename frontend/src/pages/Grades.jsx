import React, { useState, useEffect } from "react";
import { gradeService } from "../services/gradeService";
import { classService } from "../services/classService";
import { studentService } from "../services/studentService";
import {
    FaBook,
    FaSearch,
    FaPlus,
    FaEdit,
    FaTrash,
    FaEye,
    FaFilter,
    FaSort,
    FaChartBar,
    FaUserGraduate,
    FaPercentage,
    FaTimes,
    FaCheck,
    FaPaperPlane,
    FaClock,
} from "react-icons/fa";

const Grades = () => {
    const [grades, setGrades] = useState([]);
    const [classes, setClasses] = useState([]);
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [studentFilter, setStudentFilter] = useState("all");
    const [classFilter, setClassFilter] = useState("all");
    const [subjectFilter, setSubjectFilter] = useState("all");
    const [gradeFilter, setGradeFilter] = useState("all");
    const [examTypeFilter, setExamTypeFilter] = useState("all");
    const [sortBy, setSortBy] = useState("examDate");
    const [sortOrder, setSortOrder] = useState("desc");

    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [selectedGrade, setSelectedGrade] = useState(null);

    const [bulkPublishClass, setBulkPublishClass] = useState("");
    const [bulkExamType, setBulkExamType] = useState("all");
    const [bulkSubject, setBulkSubject] = useState("all");

    const [formData, setFormData] = useState({
        student: "",
        class: "",
        subject: "",
        grade: "",
        marks: "",
        examType: "",
        weightage: 100,
        comments: "",
        examDate: new Date().toISOString().split('T')[0]
    });

    const [selectedClassStudents, setSelectedClassStudents] = useState([]);

    const gradeOptions = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D', 'F'];
    const examTypeOptions = ['mid-term', 'final', 'quiz', 'assignment', 'project'];

    useEffect(() => {
        fetchGrades();
        fetchClasses();
        fetchStudents();
    }, []);

    useEffect(() => {
        if (formData.class) {
            fetchClassStudents(formData.class);
        }
    }, [formData.class]);

    const handlePublishGrade = async (grade) => {
        const confirmed = window.confirm(
            `Publish ${grade.subject} grade for ${grade.student?.name}?\n\n` +
            `This will send email notifications to:\n` +
            `• Student: ${grade.student?.email || 'No email'}\n` +
            `• Parent: ${grade.student?.parentEmail || 'No email'}`
        );

        if (confirmed) {
            try {
                const result = await gradeService.publishGrade(grade._id);

                if (result.success) {
                    // Show success with email status
                    let message = '✅ Grade published successfully!';
                    if (result.emailSent) {
                        message += '\n📧 Email notifications have been sent.';
                    } else if (result.emailError) {
                        message += `\n⚠️ Grade published but email failed: ${result.emailError}`;
                    } else {
                        message += '\nℹ️ No email sent (no email addresses available).';
                    }
                    alert(message);
                }

                fetchGrades(); // Refresh the list
            } catch (error) {
                console.error('Error publishing grade:', error);
                alert('❌ Error: ' + (error.response?.data?.message || 'Failed to publish grade'));
            }
        }
    };

    // Bulk publish for a class
    const handleBulkPublish = async () => {
        if (!bulkPublishClass) {
            alert('Please select a class first');
            return;
        }

        const classObj = classes.find(c => c._id === bulkPublishClass);
        const classInfo = classObj ? `${classObj.name} - ${classObj.subject}` : 'Selected Class';

        const confirmed = window.confirm(
            `Publish ALL unpublished grades for:\n\n` +
            `📚 ${classInfo}\n` +
            `📝 Exam Type: ${bulkExamType === 'all' ? 'All' : bulkExamType}\n` +
            `📖 Subject: ${bulkSubject === 'all' ? 'All' : bulkSubject}\n\n` +
            `This will send email notifications to all students and parents in this class.`
        );

        if (confirmed) {
            try {
                const filters = {};
                if (bulkExamType !== 'all') filters.examType = bulkExamType;
                if (bulkSubject !== 'all') filters.subject = bulkSubject;

                const result = await gradeService.bulkPublishGrades(bulkPublishClass, filters);

                if (result.success) {
                    let message = `✅ Successfully published ${result.data?.length || 0} grades!\n\n`;

                    if (result.errors && result.errors.length > 0) {
                        message += `⚠️ ${result.errors.length} error${result.errors.length !== 1 ? 's' : ''} occurred`;
                    }

                    alert(message);

                    // Reset filters and refresh data
                    setBulkPublishClass("");
                    setBulkExamType("all");
                    setBulkSubject("all");
                    fetchGrades();
                }
            } catch (error) {
                console.error('Error bulk publishing:', error);
                alert('Error: ' + (error.response?.data?.message || 'Failed to bulk publish grades'));
            }
        }
    };

    const fetchGrades = async () => {
        try {
            setLoading(true);
            const params = {
                studentId: studentFilter !== "all" ? studentFilter : undefined,
                classId: classFilter !== "all" ? classFilter : undefined,
                subject: subjectFilter !== "all" ? subjectFilter : undefined,
                grade: gradeFilter !== "all" ? gradeFilter : undefined,
                examType: examTypeFilter !== "all" ? examTypeFilter : undefined,
                sortBy,
                sortOrder,
                search: searchTerm || undefined
            };

            console.log("Fetching grades with params:", params);
            const response = await gradeService.getGrades(params);
            console.log("Grades response:", response);
            setGrades(response.data || []);
        } catch (error) {
            console.error("Error fetching grades:", error);
            setGrades([]);
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

    const fetchStudents = async () => {
        try {
            const response = await studentService.getStudents();
            setStudents(response.data || []);
        } catch (error) {
            console.error("Error fetching students:", error);
            setStudents([]);
        }
    };

    const fetchClassStudents = async (classId) => {
        try {
            const response = await classService.getClass(classId);
            if (response.data && response.data.students) {
                // Get full student objects for the students in this class
                const studentIds = response.data.students.map(s => s._id || s);
                const studentsResponse = await studentService.getStudents();
                const allStudents = studentsResponse.data || [];
                const studentsInClass = allStudents.filter(s =>
                    studentIds.includes(s._id)
                );
                setSelectedClassStudents(studentsInClass);
            }
        } catch (error) {
            console.error("Error fetching class students:", error);
            setSelectedClassStudents([]);
        }
    };

    const handleAddGrade = async (e) => {
        e.preventDefault();
        try {
            console.log("Adding grade with data:", formData);
            const response = await gradeService.createGrade(formData);
            console.log("Add grade response:", response);
            setShowAddModal(false);
            resetForm();
            fetchGrades();
        } catch (error) {
            console.error("Error adding grade:", error);
            alert("Error adding grade: " + (error.response?.data?.message || error.message));
        }
    };

    const handleEditGrade = (grade) => {
        setSelectedGrade(grade);
        setFormData({
            student: grade.student._id || grade.student,
            class: grade.class._id || grade.class,
            subject: grade.subject,
            grade: grade.grade,
            marks: grade.marks,
            examType: grade.examType,
            weightage: grade.weightage || 100,
            comments: grade.comments || "",
            examDate: new Date(grade.examDate).toISOString().split('T')[0]
        });
        setShowEditModal(true);
    };

    const handleUpdateGrade = async (e) => {
        e.preventDefault();
        try {
            await gradeService.updateGrade(selectedGrade._id, formData);
            setShowEditModal(false);
            setSelectedGrade(null);
            resetForm();
            fetchGrades();
        } catch (error) {
            console.error("Error updating grade:", error);
            alert("Error updating grade: " + (error.response?.data?.message || error.message));
        }
    };

    const handleDeleteGrade = async (gradeId) => {
        if (window.confirm("Are you sure you want to delete this grade? This action cannot be undone.")) {
            try {
                await gradeService.deleteGrade(gradeId);
                fetchGrades();
            } catch (error) {
                console.error("Error deleting grade:", error);
                alert("Error deleting grade: " + (error.response?.data?.message || error.message));
            }
        }
    };

    const handleViewGrade = (grade) => {
        setSelectedGrade(grade);
        setShowViewModal(true);
    };

    const resetForm = () => {
        setFormData({
            student: "",
            class: "",
            subject: "",
            grade: "",
            marks: "",
            examType: "",
            weightage: 100,
            comments: "",
            examDate: new Date().toISOString().split('T')[0]
        });
        setSelectedClassStudents([]);
    };

    const getGradeColor = (grade) => {
        const colors = {
            'A+': 'bg-green-100 text-green-800',
            'A': 'bg-green-50 text-green-700',
            'A-': 'bg-green-50 text-green-600',
            'B+': 'bg-blue-100 text-blue-800',
            'B': 'bg-blue-50 text-blue-700',
            'B-': 'bg-blue-50 text-blue-600',
            'C+': 'bg-yellow-100 text-yellow-800',
            'C': 'bg-yellow-50 text-yellow-700',
            'C-': 'bg-yellow-50 text-yellow-600',
            'D': 'bg-orange-100 text-orange-800',
            'F': 'bg-red-100 text-red-800'
        };
        return colors[grade] || 'bg-gray-100 text-gray-800';
    };

    const handleSort = (field) => {
        if (sortBy === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(field);
            setSortOrder('asc');
        }
        // Fetch grades with new sort
        setTimeout(() => fetchGrades(), 0);
    };

    const handleApplyFilters = () => {
        fetchGrades();
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
                        <FaChartBar className="mr-3 text-purple-600" />
                        Grade Management
                    </h1>
                    <p className="text-gray-600 mt-1">
                        Manage student grades, view performance, and generate reports
                    </p>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors duration-200"
                >
                    <FaPlus className="w-4 h-4" />
                    <span>Add Grade</span>
                </button>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-purple-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Total Grades</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {grades.length}
                            </p>
                        </div>
                        <FaChartBar className="text-purple-500 text-xl" />
                    </div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-green-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Total Students</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {students.length}
                            </p>
                        </div>
                        <FaUserGraduate className="text-green-500 text-xl" />
                    </div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-blue-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Total Classes</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {classes.length}
                            </p>
                        </div>
                        <FaBook className="text-blue-500 text-xl" />
                    </div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-yellow-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Avg. Marks</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {grades.length > 0
                                    ? Math.round(grades.reduce((acc, g) => acc + g.marks, 0) / grades.length)
                                    : 0
                                }%
                            </p>
                        </div>
                        <FaPercentage className="text-yellow-500 text-xl" />
                    </div>
                </div>
            </div>

            {/* Filters and Search */}
            <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                    {/* Search */}
                    <div className="relative">
                        <FaSearch className="absolute left-3 top-3 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search grades..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        />
                    </div>

                    {/* Student Filter */}
                    <select
                        value={studentFilter}
                        onChange={(e) => setStudentFilter(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    >
                        <option value="all">All Students</option>
                        {students.map((student) => (
                            <option key={student._id} value={student._id}>
                                {student.name} ({student.studentId || student.id})
                            </option>
                        ))}
                    </select>

                    {/* Class Filter */}
                    <select
                        value={classFilter}
                        onChange={(e) => setClassFilter(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    >
                        <option value="all">All Classes</option>
                        {classes.map((cls) => (
                            <option key={cls._id} value={cls._id}>
                                {cls.name}
                            </option>
                        ))}
                    </select>

                    {/* Subject Filter */}
                    <select
                        value={subjectFilter}
                        onChange={(e) => setSubjectFilter(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    >
                        <option value="all">All Subjects</option>
                        {[...new Set(classes.map(c => c.subject))].map((subject) => (
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
                        {gradeOptions.map((grade) => (
                            <option key={grade} value={grade}>
                                {grade}
                            </option>
                        ))}
                    </select>

                    {/* Exam Type Filter */}
                    <select
                        value={examTypeFilter}
                        onChange={(e) => setExamTypeFilter(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    >
                        <option value="all">All Exam Types</option>
                        {examTypeOptions.map((type) => (
                            <option key={type} value={type}>
                                {type.charAt(0).toUpperCase() + type.slice(1)}
                            </option>
                        ))}
                    </select>

                    {/* Action Buttons */}
                    <div className="flex space-x-2">
                        <button
                            onClick={handleApplyFilters}
                            className="flex-1 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
                        >
                            Apply Filters
                        </button>
                        <button
                            onClick={() => {
                                setSearchTerm("");
                                setStudentFilter("all");
                                setClassFilter("all");
                                setSubjectFilter("all");
                                setGradeFilter("all");
                                setExamTypeFilter("all");
                                fetchGrades();
                            }}
                            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                        >
                            <FaTimes className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Bulk Publish Section */}
            <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Bulk Publish by Class</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
                        <select
                            value={bulkPublishClass}
                            onChange={(e) => setBulkPublishClass(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        >
                            <option value="">Select Class</option>
                            {classes.map((cls) => (
                                <option key={cls._id} value={cls._id}>
                                    {cls.name} - {cls.subject}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Exam Type</label>
                        <select
                            value={bulkExamType}
                            onChange={(e) => setBulkExamType(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        >
                            <option value="all">All Exam Types</option>
                            <option value="mid-term">Mid-term</option>
                            <option value="final">Final</option>
                            <option value="quiz">Quiz</option>
                            <option value="assignment">Assignment</option>
                            <option value="project">Project</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                        <select
                            value={bulkSubject}
                            onChange={(e) => setBulkSubject(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        >
                            <option value="all">All Subjects</option>
                            {bulkPublishClass ? (
                                // Show only subjects for the selected class
                                classes
                                    .filter(c => c._id === bulkPublishClass)
                                    .map(cls => (
                                        <option key={cls.subject} value={cls.subject}>
                                            {cls.subject}
                                        </option>
                                    ))
                            ) : (
                                // Show all subjects if no class selected
                                [...new Set(classes.map(c => c.subject))].map((subject) => (
                                    <option key={subject} value={subject}>
                                        {subject}
                                    </option>
                                ))
                            )}
                        </select>
                    </div>

                    <div className="flex items-end">
                        <button
                            onClick={handleBulkPublish}
                            disabled={!bulkPublishClass}
                            className="w-full px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <FaPaperPlane className="mr-2" />
                            Publish All for Class
                        </button>
                    </div>
                </div>
            </div>

            {/* Grades Table */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                    onClick={() => handleSort('student.name')}
                                >
                                    <div className="flex items-center space-x-1">
                                        <span>Student</span>
                                        <FaSort className="w-3 h-3" />
                                    </div>
                                </th>
                                <th
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                    onClick={() => handleSort('class.name')}
                                >
                                    <div className="flex items-center space-x-1">
                                        <span>Class</span>
                                        <FaSort className="w-3 h-3" />
                                    </div>
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Subject
                                </th>
                                <th
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                    onClick={() => handleSort('marks')}
                                >
                                    <div className="flex items-center space-x-1">
                                        <span>Marks</span>
                                        <FaSort className="w-3 h-3" />
                                    </div>
                                </th>
                                <th
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                    onClick={() => handleSort('grade')}
                                >
                                    <div className="flex items-center space-x-1">
                                        <span>Grade</span>
                                        <FaSort className="w-3 h-3" />
                                    </div>
                                </th>
                                <th
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                    onClick={() => handleSort('status')}
                                >
                                    <div className="flex items-center space-x-1">
                                        <span>Status</span>
                                        <FaSort className="w-3 h-3" />
                                    </div>
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Exam Type
                                </th>
                                <th
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                    onClick={() => handleSort('examDate')}
                                >
                                    <div className="flex items-center space-x-1">
                                        <span>Date</span>
                                        <FaSort className="w-3 h-3" />
                                    </div>
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {grades.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="px-6 py-12 text-center">
                                        <FaChartBar className="mx-auto text-4xl text-gray-300 mb-4" />
                                        <p className="text-gray-500 text-lg">No grades found</p>
                                        <p className="text-gray-400">Add your first grade to get started</p>
                                    </td>
                                </tr>
                            ) : (
                                grades.map((grade) => (
                                    <tr key={grade._id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                                                    <FaUserGraduate className="text-blue-600" />
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {grade.student?.name || "Unknown Student"}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        {grade.student?.studentId || grade.student?.id || "N/A"}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">{grade.class?.name || "Unknown Class"}</div>
                                            <div className="text-sm text-gray-500">Grade {grade.class?.grade || "N/A"}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {grade.subject}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">
                                                {grade.marks}%
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                Weight: {grade.weightage || 100}%
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getGradeColor(grade.grade)}`}>
                                                {grade.grade}
                                            </span>

                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="space-y-1">
                                                {/* Published status */}
                                                {grade.isPublished ? (
                                                    <span className="inline-flex items-center px-2 py-1 text-xs font-medium text-green-800 bg-green-100 rounded-full">
                                                        <FaCheck className="w-3 h-3 mr-1" />
                                                        Published
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center px-2 py-1 text-xs font-medium text-yellow-800 bg-yellow-100 rounded-full">
                                                        <FaClock className="w-3 h-3 mr-1" />
                                                        Draft
                                                    </span>
                                                )}

                                                {/* Email status (if published) */}
                                                {grade.isPublished && grade.publishedAt && (
                                                    <div className="text-xs text-gray-500">
                                                        {new Date(grade.publishedAt).toLocaleDateString()}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                                            {grade.examType}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {new Date(grade.examDate).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <div className="flex space-x-2">
                                                <button
                                                    onClick={() => handleViewGrade(grade)}
                                                    className="text-blue-600 hover:text-blue-900"
                                                    title="View Details"
                                                >
                                                    <FaEye className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleEditGrade(grade)}
                                                    className="text-green-600 hover:text-green-900"
                                                    title="Edit Grade"
                                                >
                                                    <FaEdit className="w-4 h-4" />
                                                </button>
                                                {!grade.isPublished && (
                                                    <button
                                                        onClick={() => handlePublishGrade(grade)}
                                                        className="text-purple-600 hover:text-purple-900"
                                                        title="Publish Grade"
                                                    >
                                                        <FaPaperPlane className="w-4 h-4" />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleDeleteGrade(grade._id)}
                                                    className="text-red-600 hover:text-red-900"
                                                    title="Delete Grade"
                                                >
                                                    <FaTrash className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add Grade Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <h2 className="text-2xl font-bold text-gray-800 mb-4">
                                Add New Grade
                            </h2>
                            <form onSubmit={handleAddGrade} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Class Selection */}
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Select Class *
                                        </label>
                                        <select
                                            required
                                            value={formData.class}
                                            onChange={(e) => {
                                                const selectedClass = classes.find(c => c._id === e.target.value);
                                                setFormData({
                                                    ...formData,
                                                    class: e.target.value,
                                                    student: "",
                                                    subject: selectedClass?.subject || ""
                                                });
                                            }}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                        >
                                            <option value="">Select Class</option>
                                            {classes.map((cls) => (
                                                <option key={cls._id} value={cls._id}>
                                                    {cls.name} - {cls.subject} (Grade {cls.grade})
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Student Selection */}
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Select Student *
                                        </label>
                                        <select
                                            required
                                            value={formData.student}
                                            onChange={(e) => setFormData({ ...formData, student: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                        >
                                            <option value="">Select Student</option>
                                            {formData.class ? (
                                                students.filter(student => {
                                                    // Filter students who are enrolled in the selected class
                                                    const selectedClass = classes.find(c => c._id === formData.class);
                                                    return selectedClass?.students?.some(s =>
                                                        s._id === student._id || s === student._id
                                                    );
                                                }).map((student) => (
                                                    <option key={student._id} value={student._id}>
                                                        {student.name} ({student.studentId || student.id})
                                                    </option>
                                                ))
                                            ) : (
                                                students.map((student) => (
                                                    <option key={student._id} value={student._id}>
                                                        {student.name} ({student.studentId || student.id})
                                                    </option>
                                                ))
                                            )}
                                        </select>
                                        {formData.class && (
                                            <p className="mt-1 text-sm text-gray-500">
                                                Showing students enrolled in this class
                                            </p>
                                        )}
                                    </div>

                                    {/* Subject */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Subject *
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.subject}
                                            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                            placeholder="e.g., Mathematics"
                                        />
                                    </div>

                                    {/* Exam Type */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Exam Type *
                                        </label>
                                        <select
                                            required
                                            value={formData.examType}
                                            onChange={(e) => setFormData({ ...formData, examType: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                        >
                                            <option value="">Select Exam Type</option>
                                            {examTypeOptions.map((type) => (
                                                <option key={type} value={type}>
                                                    {type.charAt(0).toUpperCase() + type.slice(1)}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Marks */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Marks (0-100) *
                                        </label>
                                        <input
                                            type="number"
                                            required
                                            min="0"
                                            max="100"
                                            step="0.01"
                                            value={formData.marks}
                                            onChange={(e) => setFormData({ ...formData, marks: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                            placeholder="85.5"
                                        />
                                    </div>

                                    {/* Grade */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Grade *
                                        </label>
                                        <select
                                            required
                                            value={formData.grade}
                                            onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                        >
                                            <option value="">Select Grade</option>
                                            {gradeOptions.map((grade) => (
                                                <option key={grade} value={grade}>
                                                    {grade}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Weightage */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Weightage (%)
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            max="100"
                                            value={formData.weightage}
                                            onChange={(e) => setFormData({ ...formData, weightage: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                            placeholder="100"
                                        />
                                    </div>

                                    {/* Exam Date */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Exam Date
                                        </label>
                                        <input
                                            type="date"
                                            value={formData.examDate}
                                            onChange={(e) => setFormData({ ...formData, examDate: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                        />
                                    </div>

                                    {/* Comments */}
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Comments
                                        </label>
                                        <textarea
                                            value={formData.comments}
                                            onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
                                            rows="3"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                            placeholder="Additional comments about this grade..."
                                            maxLength="500"
                                        />
                                    </div>
                                </div>

                                <div className="flex justify-end space-x-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowAddModal(false);
                                            resetForm();
                                        }}
                                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-200"
                                    >
                                        Add Grade
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Grade Modal */}
            {showEditModal && selectedGrade && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <h2 className="text-2xl font-bold text-gray-800 mb-4">
                                Edit Grade
                            </h2>
                            <form onSubmit={handleUpdateGrade} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Display Student and Class (read-only) */}
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Student
                                        </label>
                                        <div className="p-2 bg-gray-50 rounded border">
                                            <p className="font-medium">{selectedGrade.student?.name || "Unknown Student"}</p>
                                            <p className="text-sm text-gray-600">ID: {selectedGrade.student?.studentId || selectedGrade.student?.id || "N/A"}</p>
                                        </div>
                                    </div>

                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Class
                                        </label>
                                        <div className="p-2 bg-gray-50 rounded border">
                                            <p className="font-medium">{selectedGrade.class?.name || "Unknown Class"}</p>
                                            <p className="text-sm text-gray-600">{selectedGrade.class?.subject || "N/A"} - Grade {selectedGrade.class?.grade || "N/A"}</p>
                                        </div>
                                    </div>

                                    {/* Editable Fields */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Subject *
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.subject}
                                            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Exam Type *
                                        </label>
                                        <select
                                            required
                                            value={formData.examType}
                                            onChange={(e) => setFormData({ ...formData, examType: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                        >
                                            {examTypeOptions.map((type) => (
                                                <option key={type} value={type}>
                                                    {type.charAt(0).toUpperCase() + type.slice(1)}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Marks (0-100) *
                                        </label>
                                        <input
                                            type="number"
                                            required
                                            min="0"
                                            max="100"
                                            step="0.01"
                                            value={formData.marks}
                                            onChange={(e) => setFormData({ ...formData, marks: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Grade *
                                        </label>
                                        <select
                                            required
                                            value={formData.grade}
                                            onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                        >
                                            {gradeOptions.map((grade) => (
                                                <option key={grade} value={grade}>
                                                    {grade}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Weightage (%)
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            max="100"
                                            value={formData.weightage}
                                            onChange={(e) => setFormData({ ...formData, weightage: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Exam Date
                                        </label>
                                        <input
                                            type="date"
                                            value={formData.examDate}
                                            onChange={(e) => setFormData({ ...formData, examDate: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                        />
                                    </div>

                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Comments
                                        </label>
                                        <textarea
                                            value={formData.comments}
                                            onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
                                            rows="3"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                            maxLength="500"
                                        />
                                    </div>
                                </div>

                                <div className="flex justify-end space-x-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowEditModal(false);
                                            setSelectedGrade(null);
                                            resetForm();
                                        }}
                                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-200"
                                    >
                                        Update Grade
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* View Grade Modal */}
            {showViewModal && selectedGrade && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-800">Grade Details</h2>
                                    <p className="text-gray-600">ID: {selectedGrade.gradeId || selectedGrade._id}</p>
                                </div>
                                <button
                                    onClick={() => setShowViewModal(false)}
                                    className="text-gray-400 hover:text-gray-600 text-xl"
                                >
                                    ×
                                </button>
                            </div>

                            <div className="space-y-6">
                                {/* Grade Summary */}
                                <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-lg">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-lg font-semibold text-gray-800">Grade Summary</p>
                                            <div className="flex items-center space-x-4 mt-2">
                                                <div className="text-center">
                                                    <p className="text-3xl font-bold text-gray-900">{selectedGrade.marks}%</p>
                                                    <p className="text-sm text-gray-600">Marks</p>
                                                </div>
                                                <div className="text-center">
                                                    <span className={`px-3 py-1 text-lg font-bold rounded-full ${getGradeColor(selectedGrade.grade)}`}>
                                                        {selectedGrade.grade}
                                                    </span>
                                                    <p className="text-sm text-gray-600 mt-1">Grade</p>
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-xl font-bold text-gray-900">{selectedGrade.weightage || 100}%</p>
                                                    <p className="text-sm text-gray-600">Weightage</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Student and Class Info */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-800 mb-3">Student Information</h3>
                                        <div className="space-y-2">
                                            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                                                <FaUserGraduate className="text-gray-400" />
                                                <div>
                                                    <p className="font-medium">{selectedGrade.student?.name || "Unknown Student"}</p>
                                                    <p className="text-sm text-gray-600">ID: {selectedGrade.student?.studentId || selectedGrade.student?.id || "N/A"}</p>
                                                </div>
                                            </div>
                                            {selectedGrade.student?.email && (
                                                <div className="p-3 bg-gray-50 rounded-lg">
                                                    <p className="text-sm text-gray-600">Email</p>
                                                    <p className="font-medium">{selectedGrade.student.email}</p>
                                                </div>
                                            )}
                                            {selectedGrade.student?.grade && (
                                                <div className="p-3 bg-gray-50 rounded-lg">
                                                    <p className="text-sm text-gray-600">Grade Level</p>
                                                    <p className="font-medium">Grade {selectedGrade.student.grade}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-800 mb-3">Class Information</h3>
                                        <div className="space-y-2">
                                            <div className="p-3 bg-gray-50 rounded-lg">
                                                <p className="text-sm text-gray-600">Class Name</p>
                                                <p className="font-medium">{selectedGrade.class?.name || "Unknown Class"}</p>
                                            </div>
                                            <div className="p-3 bg-gray-50 rounded-lg">
                                                <p className="text-sm text-gray-600">Subject</p>
                                                <p className="font-medium">{selectedGrade.subject}</p>
                                            </div>
                                            {selectedGrade.class?.grade && (
                                                <div className="p-3 bg-gray-50 rounded-lg">
                                                    <p className="text-sm text-gray-600">Grade Level</p>
                                                    <p className="font-medium">Grade {selectedGrade.class.grade}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Exam Details */}
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-800 mb-3">Exam Details</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="p-3 bg-gray-50 rounded-lg">
                                            <p className="text-sm text-gray-600">Exam Type</p>
                                            <p className="font-medium capitalize">{selectedGrade.examType}</p>
                                        </div>
                                        <div className="p-3 bg-gray-50 rounded-lg">
                                            <p className="text-sm text-gray-600">Exam Date</p>
                                            <p className="font-medium">
                                                {new Date(selectedGrade.examDate).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <div className="p-3 bg-gray-50 rounded-lg">
                                            <p className="text-sm text-gray-600">Published</p>
                                            <p className="font-medium">
                                                {selectedGrade.isPublished ? (
                                                    <span className="text-green-600 flex items-center">
                                                        <FaCheck className="mr-1" /> Yes
                                                    </span>
                                                ) : (
                                                    <span className="text-yellow-600">No</span>
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Comments */}
                                {selectedGrade.comments && (
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-800 mb-3">Comments</h3>
                                        <div className="p-4 bg-gray-50 rounded-lg">
                                            <p className="text-gray-700">{selectedGrade.comments}</p>
                                        </div>
                                    </div>
                                )}

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
                </div>
            )}
        </div>
    );
};

export default Grades;