import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  FaArrowLeft, 
  FaBook, 
  FaUsers, 
  FaClock,
  FaChartLine,
  FaMoon,
  FaSun,
  FaUniversity,
  FaCheckCircle,
  FaClipboardList,
  FaPlus,
  FaEdit,
  FaTimes,
  FaUserCheck,
  FaUserTimes,
  FaUserClock,
  FaSpinner,
  FaExclamationTriangle,
  FaSync,
  FaGraduationCap,
  FaCalendarAlt,
  FaEye,
  FaPaperPlane
} from 'react-icons/fa';
import { useTheme } from '../../context/ThemeContext';
import { useInstitute } from '../../context/InstituteContext';
import { authService } from '../../services/authService';
import Modal from '../../components/Modal';
import toast from 'react-hot-toast';
import LanguageSwitcher from '../../components/LanguageSwitcher';

// Helper function to convert relative image URLs to full URLs
const getImageUrl = (imagePath) => {
  if (!imagePath) return null;
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  const baseUrl = import.meta.env.VITE_API_BASE_URL?.replace(/\/+$/, '') || 'http://127.0.0.1:8000';
  let cleanPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
  cleanPath = cleanPath.replace(/^\/media\/media\//, '/media/');
  return `${baseUrl}${cleanPath}`;
};

const LecturerCourses = () => {
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();
  const { instituteData, updateInstituteData } = useInstitute();
  const { t } = useTranslation();

  // State
  const [courses, setCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [courseProgress, setCourseProgress] = useState({});
  
  // Modal states
  const [showExamModal, setShowExamModal] = useState(false);
  const [showGradesModal, setShowGradesModal] = useState(false);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [showViewGradesModal, setShowViewGradesModal] = useState(false);
  const [showViewAttendanceModal, setShowViewAttendanceModal] = useState(false);
  
  // Form states
  const [examForm, setExamForm] = useState({ title: '', date: '', max_score: 100 });
  const [isCreatingExam, setIsCreatingExam] = useState(false);
  const [gradesForm, setGradesForm] = useState([]);
  const [isSubmittingGrades, setIsSubmittingGrades] = useState(false);
  const [attendanceForm, setAttendanceForm] = useState({ lecture_number: null, records: [] });
  const [isSubmittingAttendance, setIsSubmittingAttendance] = useState(false);
  const [courseStudents, setCourseStudents] = useState([]);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  const [selectedLectureForAttendance, setSelectedLectureForAttendance] = useState(null);
  
  // View states
  const [examGrades, setExamGrades] = useState(null);
  const [lectureAttendance, setLectureAttendance] = useState(null);
  const [selectedExamId, setSelectedExamId] = useState(null);
  const [viewLectureNumber, setViewLectureNumber] = useState(1);
  const [isLoadingGrades, setIsLoadingGrades] = useState(false);
  const [isLoadingAttendance, setIsLoadingAttendance] = useState(false);

  // Auth options helper
  const getAuthOptions = () => ({
    refreshToken: instituteData.refreshToken,
    onTokenRefreshed: (tokens) => {
      updateInstituteData({
        accessToken: tokens.access,
        refreshToken: tokens.refresh || instituteData.refreshToken,
      });
    },
    onSessionExpired: () => {
      toast.error(t('common.sessionExpired') || 'Session expired. Please log in again.');
    },
  });

  // Fetch courses
  const fetchCourses = async () => {
    if (!instituteData.username) {
      setError(t('lecturerCourses.noUsername') || 'Username not available');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await authService.getLecturerCourses(instituteData.username);
      
      if (response?.results) {
        setCourses(response.results);
        // Fetch progress for each course
        response.results.forEach(course => fetchCourseProgress(course.id));
      } else if (Array.isArray(response)) {
        setCourses(response);
        response.forEach(course => fetchCourseProgress(course.id));
      } else {
        setCourses([]);
      }
    } catch (err) {
      console.error('Error fetching courses:', err);
      setError(err?.message || t('lecturerCourses.fetchError') || 'Failed to load courses');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch course progress
  const fetchCourseProgress = async (courseId) => {
    try {
      const response = await authService.getCourseProgress(courseId, instituteData.accessToken, getAuthOptions());
      
      if (response?.success) {
        setCourseProgress(prev => ({
          ...prev,
          [courseId]: response
        }));
      }
    } catch (err) {
      console.error(`Error fetching progress for course ${courseId}:`, err);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, [instituteData.username]);

  // Create Exam
  const handleCreateExam = async (e) => {
    e.preventDefault();
    
    if (!examForm.title || !examForm.date || !examForm.max_score) {
      toast.error(t('lecturerCourses.fillAllFields') || 'Please fill all fields');
      return;
    }

    setIsCreatingExam(true);
    
    try {
      const response = await authService.createExam(
        instituteData.accessToken,
        selectedCourse.id,
        {
          title: examForm.title,
          date: examForm.date,
          max_score: parseFloat(examForm.max_score),
        },
        getAuthOptions()
      );

      if (response?.success) {
        toast.success(response.message || t('lecturerCourses.examCreated') || 'Exam created successfully!');
        setShowExamModal(false);
        setExamForm({ title: '', date: '', max_score: 100 });
        // If exam_id is returned, we could use it for grades
        if (response.exam_id) {
          setSelectedExamId(response.exam_id);
        }
      }
    } catch (err) {
      console.error('Error creating exam:', err);
      toast.error(err?.message || t('lecturerCourses.examCreateError') || 'Failed to create exam');
    } finally {
      setIsCreatingExam(false);
    }
  };

  // Submit Grades
  const handleSubmitGrades = async (e) => {
    e.preventDefault();
    
    if (!selectedExamId || gradesForm.length === 0) {
      toast.error(t('lecturerCourses.noGradesToSubmit') || 'No grades to submit');
      return;
    }

    const validGrades = gradesForm.filter(g => g.student_id && g.score !== '');
    if (validGrades.length === 0) {
      toast.error(t('lecturerCourses.enterAtLeastOneGrade') || 'Please enter at least one grade');
      return;
    }

    setIsSubmittingGrades(true);
    
    try {
      const response = await authService.submitExamGrades(
        instituteData.accessToken,
        selectedExamId,
        validGrades.map(g => ({
          student_id: parseInt(g.student_id),
          score: parseFloat(g.score),
        })),
        getAuthOptions()
      );

      if (response?.success) {
        toast.success(response.message || t('lecturerCourses.gradesSubmitted') || 'Grades submitted and emails sent!');
        setShowGradesModal(false);
        setGradesForm([]);
      }
    } catch (err) {
      console.error('Error submitting grades:', err);
      toast.error(err?.message || t('lecturerCourses.gradesSubmitError') || 'Failed to submit grades');
    } finally {
      setIsSubmittingGrades(false);
    }
  };

  // Edit Grades (without emails)
  const handleEditGrades = async () => {
    if (!selectedExamId || gradesForm.length === 0) {
      toast.error(t('lecturerCourses.noGradesToUpdate') || 'No grades to update');
      return;
    }

    const validGrades = gradesForm.filter(g => g.student_id && g.score !== '');
    if (validGrades.length === 0) {
      toast.error(t('lecturerCourses.enterAtLeastOneGrade') || 'Please enter at least one grade');
      return;
    }

    setIsSubmittingGrades(true);
    
    try {
      const response = await authService.editExamGrades(
        instituteData.accessToken,
        selectedExamId,
        validGrades.map(g => ({
          student_id: parseInt(g.student_id),
          score: parseFloat(g.score),
        })),
        getAuthOptions()
      );

      if (response?.success) {
        toast.success(response.message || t('lecturerCourses.gradesUpdated') || 'Grades updated successfully!');
        setShowGradesModal(false);
        setGradesForm([]);
      }
    } catch (err) {
      console.error('Error updating grades:', err);
      toast.error(err?.message || t('lecturerCourses.gradesUpdateError') || 'Failed to update grades');
    } finally {
      setIsSubmittingGrades(false);
    }
  };

  // View Grades
  const handleViewGrades = async (examId) => {
    setSelectedExamId(examId);
    setIsLoadingGrades(true);
    setShowViewGradesModal(true);
    
    try {
      const response = await authService.viewExamGrades(
        instituteData.accessToken,
        examId,
        getAuthOptions()
      );

      if (response?.success) {
        setExamGrades(response);
      }
    } catch (err) {
      console.error('Error viewing grades:', err);
      toast.error(err?.message || t('lecturerCourses.gradesViewError') || 'Failed to load grades');
      setShowViewGradesModal(false);
    } finally {
      setIsLoadingGrades(false);
    }
  };

  // Fetch students for a lecture
  const fetchCourseStudents = async (courseId, lectureNumber) => {
    setIsLoadingStudents(true);
    setCourseStudents([]);
    
    try {
      const response = await authService.getCourseStudents(courseId, lectureNumber);
      
      if (response?.students && Array.isArray(response.students)) {
        // Initialize records with default 'present' status
        const records = response.students.map(student => ({
          student_id: student.id,
          name: student.name || `${student.first_name || ''} ${student.last_name || ''}`.trim(),
          status: 'present'
        }));
        setCourseStudents(response.students);
        setAttendanceForm(prev => ({
          ...prev,
          lecture_number: lectureNumber,
          records: records
        }));
      } else if (Array.isArray(response)) {
        const records = response.map(student => ({
          student_id: student.id,
          name: student.name || `${student.first_name || ''} ${student.last_name || ''}`.trim(),
          status: 'present'
        }));
        setCourseStudents(response);
        setAttendanceForm(prev => ({
          ...prev,
          lecture_number: lectureNumber,
          records: records
        }));
      }
    } catch (err) {
      console.error('Error fetching course students:', err);
      toast.error(err?.message || t('lecturerCourses.failedToLoadStudents') || 'Failed to load students');
    } finally {
      setIsLoadingStudents(false);
    }
  };

  // Handle lecture selection for attendance
  const handleLectureSelectForAttendance = async (lectureNumber) => {
    if (!selectedCourse) return;
    setSelectedLectureForAttendance(lectureNumber);
    await fetchCourseStudents(selectedCourse.id, lectureNumber);
  };

  // Mark Attendance
  const handleMarkAttendance = async (e) => {
    e.preventDefault();
    
    if (!attendanceForm.lecture_number || attendanceForm.records.length === 0) {
      toast.error(t('lecturerCourses.noAttendanceToSubmit') || 'Please mark attendance for at least one student');
      return;
    }

    setIsSubmittingAttendance(true);
    
    try {
      const response = await authService.markAttendance(
        instituteData.accessToken,
        selectedCourse.id,
        attendanceForm.lecture_number,
        attendanceForm.records.map(r => ({
          student_id: parseInt(r.student_id),
          status: r.status,
        })),
        getAuthOptions()
      );

      if (response?.success) {
        toast.success(response.message || t('lecturerCourses.attendanceSaved') || 'Attendance saved successfully!');
        setShowAttendanceModal(false);
        setAttendanceForm({ lecture_number: null, records: [] });
        setCourseStudents([]);
        setSelectedLectureForAttendance(null);
      }
    } catch (err) {
      console.error('Error marking attendance:', err);
      toast.error(err?.message || t('lecturerCourses.attendanceError') || 'Failed to save attendance');
    } finally {
      setIsSubmittingAttendance(false);
    }
  };

  // View Attendance - First select lecture, then fetch records
  const handleViewAttendance = async (lectureNumber) => {
    if (!selectedCourse || !lectureNumber) {
      toast.error(t('lecturerCourses.selectLectureNumber') || 'Please select a lecture number');
      return;
    }

    setIsLoadingAttendance(true);
    setViewLectureNumber(lectureNumber);
    
    try {
      const response = await authService.viewLectureAttendance(
        instituteData.accessToken,
        selectedCourse.id,
        lectureNumber,
        getAuthOptions()
      );

      if (response?.success) {
        setLectureAttendance(response);
      }
    } catch (err) {
      console.error('Error viewing attendance:', err);
      toast.error(err?.message || t('lecturerCourses.attendanceViewError') || 'Failed to load attendance');
    } finally {
      setIsLoadingAttendance(false);
    }
  };

  // Add grade row
  const addGradeRow = () => {
    setGradesForm([...gradesForm, { student_id: '', score: '' }]);
  };


  // Get attendance status icon
  const getAttendanceIcon = (status) => {
    switch (status) {
      case 'present': return <FaUserCheck className="text-green-500" />;
      case 'absent': return <FaUserTimes className="text-red-500" />;
      case 'late': return <FaUserClock className="text-yellow-500" />;
      default: return <FaUsers className="text-gray-500" />;
    }
  };

  // Calculate stats
  const totalStudents = courses.reduce((sum, course) => {
    const progress = courseProgress[course.id];
    return sum + (progress?.enrolled_students || 0);
  }, 0);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-navy-900 transition-colors">
      {/* Navigation Bar */}
      <nav className="bg-white dark:bg-navy-800 shadow-lg sticky top-0 z-50 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Back Button and Title */}
            <div className="flex items-center gap-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/feed')}
                className="flex items-center gap-2 px-4 py-2 text-primary-600 dark:text-teal-400 hover:bg-gray-100 dark:hover:bg-navy-700 rounded-lg transition-colors"
              >
                <FaArrowLeft />
                <span>{t('common.back') || 'Back'}</span>
              </motion.button>
              <h1 className="text-xl font-bold text-gray-800 dark:text-white">
                {t('lecturerCourses.title') || 'My Courses'}
              </h1>
            </div>

            <div className="flex items-center gap-3">
              <LanguageSwitcher />
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => fetchCourses()}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-navy-700 transition-colors"
                title={t('common.refresh') || 'Refresh'}
              >
                <FaSync className={`text-gray-600 dark:text-gray-400 ${isLoading ? 'animate-spin' : ''}`} />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={toggleTheme}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-navy-700 transition-colors"
              >
                {isDark ? (
                  <FaSun className="text-yellow-400 text-xl" />
                ) : (
                  <FaMoon className="text-gray-600 text-xl" />
                )}
              </motion.button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-xl p-8 mb-8 shadow-lg"
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold mb-2">
                {t('lecturerCourses.hello') || 'Hello'}, {instituteData.firstName || instituteData.username || t('lecturerCourses.lecturer') || 'Lecturer'}!
              </h2>
              <p className="text-white/90 mb-3">
                {t('lecturerCourses.teachingCourses', { count: courses.length }) || `You're teaching ${courses.length} courses`}
              </p>
              {instituteData.isVerified ? (
                <div className="flex items-center gap-2 bg-green-500/20 rounded-lg px-4 py-2 w-fit">
                  <FaCheckCircle className="text-lg" />
                  <span className="font-medium">{t('common.verified') || 'Verified'}</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 bg-amber-500/20 rounded-lg px-4 py-2 w-fit">
                  <FaExclamationTriangle className="text-lg" />
                  <span className="font-medium">{t('common.pendingVerification') || 'Pending Verification'}</span>
                </div>
              )}
            </div>
            <div className="hidden md:block">
              <div className="text-right">
                <p className="text-white/80 text-sm">{t('lecturerCourses.totalStudents') || 'Total Students'}</p>
                <p className="text-4xl font-bold">{totalStudents}</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-navy-800 rounded-xl shadow-lg p-6"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                <FaBook className="text-2xl text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{t('lecturerCourses.courses') || 'Courses'}</p>
                <p className="text-2xl font-bold text-gray-800 dark:text-white">{courses.length}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-navy-800 rounded-xl shadow-lg p-6"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-pink-100 dark:bg-pink-900/30 rounded-lg flex items-center justify-center">
                <FaUsers className="text-2xl text-pink-600 dark:text-pink-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{t('lecturerCourses.totalStudents') || 'Total Students'}</p>
                <p className="text-2xl font-bold text-gray-800 dark:text-white">{totalStudents}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white dark:bg-navy-800 rounded-xl shadow-lg p-6"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                <FaCheckCircle className="text-2xl text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{t('lecturerCourses.verified') || 'Status'}</p>
                <p className="text-lg font-bold text-gray-800 dark:text-white">
                  {instituteData.isVerified ? t('common.verified') || 'Verified' : t('common.pending') || 'Pending'}
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white dark:bg-navy-800 rounded-xl shadow-lg p-6"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center">
                <FaGraduationCap className="text-2xl text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{t('lecturerCourses.role') || 'Role'}</p>
                <p className="text-lg font-bold text-gray-800 dark:text-white">{t('lecturerCourses.lecturer') || 'Lecturer'}</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <FaSpinner className="text-4xl text-primary-600 dark:text-teal-400 animate-spin" />
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="text-center py-20">
            <FaExclamationTriangle className="text-4xl text-amber-500 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">{error}</p>
            <button
              onClick={fetchCourses}
              className="mt-4 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              {t('common.retry') || 'Retry'}
            </button>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && courses.length === 0 && (
          <div className="text-center py-20">
            <FaBook className="text-6xl text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
              {t('lecturerCourses.noCourses') || 'No Courses Found'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {t('lecturerCourses.noCoursesDescription') || "You don't have any courses assigned yet."}
            </p>
          </div>
        )}

        {/* Course Cards */}
        {!isLoading && !error && courses.length > 0 && (
          <div className="space-y-6">
            {courses.map((course, index) => {
              const progress = courseProgress[course.id] || {};
              
              return (
                <motion.div
                  key={course.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white dark:bg-navy-800 rounded-xl shadow-lg overflow-hidden"
                >
                  <div className="p-6">
                    {/* Course Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          {course.course_image && (
                            <img 
                              src={getImageUrl(course.course_image)} 
                              alt={course.title}
                              className="w-12 h-12 rounded-lg object-cover"
                            />
                          )}
                          <div>
                            <h3 className="text-xl font-bold text-gray-800 dark:text-white">
                              {course.title}
                            </h3>
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              course.level === 'beginner' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' :
                              course.level === 'intermediate' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' :
                              'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                            }`}>
                              {course.level}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                          <div className="flex items-center gap-2">
                            <FaUsers />
                            <span>{progress.enrolled_students || 0} {t('lecturerCourses.students') || 'students'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <FaCalendarAlt />
                            <span>{course.starting_date} - {course.ending_date}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <FaClock />
                            <span>{course.start_time} - {course.end_time}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-primary-600 dark:text-teal-400">
                          ${course.price}
                        </p>
                      </div>
                    </div>

                    {/* About */}
                    {course.about && (
                      <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">
                        {course.about}
                      </p>
                    )}

                    {/* Progress Bar */}
                    {progress.progress_percentage !== undefined && (
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {t('lecturerCourses.courseProgress') || 'Course Progress'}
                          </span>
                          <span className="text-sm font-bold text-primary-600 dark:text-teal-400">
                            {progress.progress_percentage || 0}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-navy-700 rounded-full h-3 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progress.progress_percentage || 0}%` }}
                            transition={{ duration: 1, delay: index * 0.1 }}
                            className="h-full bg-gradient-to-r from-purple-600 to-pink-500 rounded-full"
                          />
                        </div>
                        <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                          {t('lecturerCourses.lectures') || 'Lectures'}: {progress.completed_lectures || 0}/{progress.total_lectures || 0}
                        </div>
                      </div>
                    )}

                    {/* Days */}
                    {course.days && course.days.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {course.days.map(day => (
                          <span key={day} className="px-3 py-1 bg-gray-100 dark:bg-navy-700 text-gray-600 dark:text-gray-400 rounded-full text-xs capitalize">
                            {day}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Action Buttons */}
                    {instituteData.isVerified && (
                      <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-200 dark:border-navy-700">
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => {
                            setSelectedCourse(course);
                            setShowExamModal(true);
                          }}
                          className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                        >
                          <FaPlus />
                          <span>{t('lecturerCourses.createExam') || 'Create Exam'}</span>
                        </motion.button>

                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => {
                            setSelectedCourse(course);
                            setGradesForm([{ student_id: '', score: '' }]);
                            setShowGradesModal(true);
                          }}
                          className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                        >
                          <FaEdit />
                          <span>{t('lecturerCourses.submitGrades') || 'Submit Grades'}</span>
                        </motion.button>

                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => {
                            setSelectedCourse(course);
                            setAttendanceForm({ lecture_number: null, records: [] });
                            setCourseStudents([]);
                            setSelectedLectureForAttendance(null);
                            setShowAttendanceModal(true);
                          }}
                          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                        >
                          <FaClipboardList />
                          <span>{t('lecturerCourses.markAttendance') || 'Mark Attendance'}</span>
                        </motion.button>

                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => {
                            setSelectedCourse(course);
                            setViewLectureNumber(null);
                            setLectureAttendance(null);
                            setShowViewAttendanceModal(true);
                          }}
                          className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors"
                        >
                          <FaEye />
                          <span>{t('lecturerCourses.viewAttendance') || 'View Attendance'}</span>
                        </motion.button>
                      </div>
                    )}

                    {!instituteData.isVerified && (
                      <div className="pt-4 border-t border-gray-200 dark:border-navy-700">
                        <p className="text-amber-600 dark:text-amber-400 text-sm flex items-center gap-2">
                          <FaExclamationTriangle />
                          {t('lecturerCourses.verificationRequired') || 'Account verification required to manage exams and attendance'}
                        </p>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Exam Modal */}
      <Modal
        isOpen={showExamModal}
        onClose={() => setShowExamModal(false)}
        title={t('lecturerCourses.createExam') || 'Create Exam'}
      >
        <form onSubmit={handleCreateExam} className="space-y-4">
          <div>
            <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
              {t('lecturerCourses.examTitle') || 'Exam Title'} *
            </label>
            <input
              type="text"
              value={examForm.title}
              onChange={(e) => setExamForm({ ...examForm, title: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 dark:border-navy-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-navy-700 text-gray-900 dark:text-white"
              placeholder={t('lecturerCourses.examTitlePlaceholder') || 'e.g. Midterm Exam'}
              required
            />
          </div>

          <div>
            <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
              {t('lecturerCourses.examDate') || 'Exam Date'} *
            </label>
            <input
              type="date"
              value={examForm.date}
              onChange={(e) => setExamForm({ ...examForm, date: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 dark:border-navy-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-navy-700 text-gray-900 dark:text-white"
              required
            />
          </div>

          <div>
            <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
              {t('lecturerCourses.maxScore') || 'Maximum Score'} *
            </label>
            <input
              type="number"
              value={examForm.max_score}
              onChange={(e) => setExamForm({ ...examForm, max_score: e.target.value })}
              min="1"
              className="w-full px-4 py-3 border border-gray-300 dark:border-navy-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-navy-700 text-gray-900 dark:text-white"
              placeholder="100"
              required
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={isCreatingExam}
              className="flex-1 px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isCreatingExam ? <FaSpinner className="animate-spin" /> : <FaPlus />}
              {t('lecturerCourses.createExam') || 'Create Exam'}
            </button>
            <button
              type="button"
              onClick={() => setShowExamModal(false)}
              className="flex-1 px-4 py-3 bg-gray-200 dark:bg-navy-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-navy-600"
            >
              {t('common.cancel') || 'Cancel'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Submit/Edit Grades Modal */}
      <Modal
        isOpen={showGradesModal}
        onClose={() => setShowGradesModal(false)}
        title={t('lecturerCourses.submitGrades') || 'Submit Grades'}
        size="lg"
      >
        <form onSubmit={handleSubmitGrades} className="space-y-4">
          <div>
            <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
              {t('lecturerCourses.examId') || 'Exam ID'} *
            </label>
            <input
              type="number"
              value={selectedExamId || ''}
              onChange={(e) => setSelectedExamId(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 dark:border-navy-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-navy-700 text-gray-900 dark:text-white"
              placeholder={t('lecturerCourses.enterExamId') || 'Enter exam ID'}
              required
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-gray-700 dark:text-gray-300 font-medium">
                {t('lecturerCourses.studentGrades') || 'Student Grades'}
              </label>
              <button
                type="button"
                onClick={addGradeRow}
                className="text-primary-600 dark:text-teal-400 hover:underline text-sm flex items-center gap-1"
              >
                <FaPlus /> {t('lecturerCourses.addStudent') || 'Add Student'}
              </button>
            </div>
            
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {gradesForm.map((grade, index) => (
                <div key={index} className="flex gap-2 items-center">
                  <input
                    type="number"
                    value={grade.student_id}
                    onChange={(e) => {
                      const newGrades = [...gradesForm];
                      newGrades[index].student_id = e.target.value;
                      setGradesForm(newGrades);
                    }}
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-navy-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-navy-700 text-gray-900 dark:text-white"
                    placeholder={t('lecturerCourses.studentId') || 'Student ID'}
                  />
                  <input
                    type="number"
                    value={grade.score}
                    onChange={(e) => {
                      const newGrades = [...gradesForm];
                      newGrades[index].score = e.target.value;
                      setGradesForm(newGrades);
                    }}
                    step="0.1"
                    min="0"
                    className="w-24 px-3 py-2 border border-gray-300 dark:border-navy-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-navy-700 text-gray-900 dark:text-white"
                    placeholder={t('lecturerCourses.score') || 'Score'}
                  />
                  <button
                    type="button"
                    onClick={() => setGradesForm(gradesForm.filter((_, i) => i !== index))}
                    className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg"
                  >
                    <FaTimes />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={isSubmittingGrades}
              className="flex-1 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmittingGrades ? <FaSpinner className="animate-spin" /> : <FaPaperPlane />}
              {t('lecturerCourses.submitAndSendEmail') || 'Submit & Send Emails'}
            </button>
            <button
              type="button"
              onClick={handleEditGrades}
              disabled={isSubmittingGrades}
              className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmittingGrades ? <FaSpinner className="animate-spin" /> : <FaEdit />}
              {t('lecturerCourses.updateOnly') || 'Update Only'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Mark Attendance Modal */}
      <Modal
        isOpen={showAttendanceModal}
        onClose={() => {
          setShowAttendanceModal(false);
          setAttendanceForm({ lecture_number: null, records: [] });
          setCourseStudents([]);
          setSelectedLectureForAttendance(null);
        }}
        title={t('lecturerCourses.markAttendance') || 'Mark Attendance'}
        size="lg"
      >
        <form onSubmit={handleMarkAttendance} className="space-y-4">
          {/* Lecture Selection */}
          {!selectedLectureForAttendance && selectedCourse && (
            <div>
              <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
                {t('lecturerCourses.selectLecture') || 'Select Lecture'} *
              </label>
              {(() => {
                const progress = courseProgress[selectedCourse.id];
                const totalLectures = progress?.progress?.total_lectures || progress?.total_lectures || 0;
                const lectureNumbers = Array.from({ length: totalLectures }, (_, i) => i + 1);
                
                if (totalLectures === 0) {
                  return (
                    <p className="text-amber-600 dark:text-amber-400 text-sm">
                      {t('lecturerCourses.noLecturesAvailable') || 'No lectures available. Please check course progress.'}
                    </p>
                  );
                }
                
                return (
                  <select
                    onChange={(e) => handleLectureSelectForAttendance(parseInt(e.target.value))}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-navy-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-navy-700 text-gray-900 dark:text-white"
                    required
                  >
                    <option value="">{t('lecturerCourses.selectLectureNumber') || 'Select a lecture number...'}</option>
                    {lectureNumbers.map(num => (
                      <option key={num} value={num}>
                        {t('lecturerCourses.lecture') || 'Lecture'} {num}
                      </option>
                    ))}
                  </select>
                );
              })()}
            </div>
          )}

          {/* Loading Students */}
          {isLoadingStudents && (
            <div className="flex items-center justify-center py-8">
              <FaSpinner className="text-2xl text-primary-600 dark:text-teal-400 animate-spin" />
              <span className="ml-2 text-gray-600 dark:text-gray-400">
                {t('lecturerCourses.loadingStudents') || 'Loading students...'}
              </span>
            </div>
          )}

          {/* Students List with Attendance Buttons */}
          {selectedLectureForAttendance && !isLoadingStudents && attendanceForm.records.length > 0 && (
            <div>
              <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
                {t('lecturerCourses.markStudentAttendance') || 'Mark Student Attendance'}
              </label>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {attendanceForm.records.map((record, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-navy-900 rounded-lg">
                    <div className="flex-1">
                      <span className="text-gray-900 dark:text-white font-medium">{record.name}</span>
                      <span className="text-gray-500 dark:text-gray-400 text-sm ml-2">ID: {record.student_id}</span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const newRecords = [...attendanceForm.records];
                          newRecords[index].status = 'present';
                          setAttendanceForm({ ...attendanceForm, records: newRecords });
                        }}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                          record.status === 'present'
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-200 dark:bg-navy-700 text-gray-700 dark:text-gray-300 hover:bg-green-100 dark:hover:bg-green-900/20'
                        }`}
                      >
                        {t('lecturerCourses.present') || 'Present'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const newRecords = [...attendanceForm.records];
                          newRecords[index].status = 'late';
                          setAttendanceForm({ ...attendanceForm, records: newRecords });
                        }}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                          record.status === 'late'
                            ? 'bg-yellow-600 text-white'
                            : 'bg-gray-200 dark:bg-navy-700 text-gray-700 dark:text-gray-300 hover:bg-yellow-100 dark:hover:bg-yellow-900/20'
                        }`}
                      >
                        {t('lecturerCourses.late') || 'Late'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const newRecords = [...attendanceForm.records];
                          newRecords[index].status = 'absent';
                          setAttendanceForm({ ...attendanceForm, records: newRecords });
                        }}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                          record.status === 'absent'
                            ? 'bg-red-600 text-white'
                            : 'bg-gray-200 dark:bg-navy-700 text-gray-700 dark:text-gray-300 hover:bg-red-100 dark:hover:bg-red-900/20'
                        }`}
                      >
                        {t('lecturerCourses.absent') || 'Absent'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Submit Button */}
          {selectedLectureForAttendance && !isLoadingStudents && attendanceForm.records.length > 0 && (
            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={isSubmittingAttendance}
                className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSubmittingAttendance ? <FaSpinner className="animate-spin" /> : <FaCheckCircle />}
                {t('lecturerCourses.complete') || 'Complete'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAttendanceModal(false);
                  setAttendanceForm({ lecture_number: null, records: [] });
                  setCourseStudents([]);
                  setSelectedLectureForAttendance(null);
                }}
                className="flex-1 px-4 py-3 bg-gray-200 dark:bg-navy-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-navy-600"
              >
                {t('common.cancel') || 'Cancel'}
              </button>
            </div>
          )}
        </form>
      </Modal>

      {/* View Attendance Modal */}
      <Modal
        isOpen={showViewAttendanceModal}
        onClose={() => {
          setShowViewAttendanceModal(false);
          setViewLectureNumber(null);
          setLectureAttendance(null);
        }}
        title={t('lecturerCourses.viewAttendance') || 'View Attendance'}
        size="lg"
      >
        <div className="space-y-4">
          {/* Lecture Selection */}
          {!viewLectureNumber && selectedCourse && (
            <div>
              <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
                {t('lecturerCourses.selectLecture') || 'Select Lecture'} *
              </label>
              {(() => {
                const progress = courseProgress[selectedCourse.id];
                const totalLectures = progress?.progress?.total_lectures || progress?.total_lectures || 0;
                const lectureNumbers = Array.from({ length: totalLectures }, (_, i) => i + 1);
                
                if (totalLectures === 0) {
                  return (
                    <p className="text-amber-600 dark:text-amber-400 text-sm">
                      {t('lecturerCourses.noLecturesAvailable') || 'No lectures available. Please check course progress.'}
                    </p>
                  );
                }
                
                return (
                  <select
                    onChange={(e) => handleViewAttendance(parseInt(e.target.value))}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-navy-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-navy-700 text-gray-900 dark:text-white"
                    required
                  >
                    <option value="">{t('lecturerCourses.selectLectureNumber') || 'Select a lecture number...'}</option>
                    {lectureNumbers.map(num => (
                      <option key={num} value={num}>
                        {t('lecturerCourses.lecture') || 'Lecture'} {num}
                      </option>
                    ))}
                  </select>
                );
              })()}
            </div>
          )}

          {/* Loading Attendance */}
          {isLoadingAttendance && (
            <div className="flex items-center justify-center py-8">
              <FaSpinner className="text-2xl text-primary-600 dark:text-teal-400 animate-spin" />
              <span className="ml-2 text-gray-600 dark:text-gray-400">
                {t('lecturerCourses.loadingAttendance') || 'Loading attendance...'}
              </span>
            </div>
          )}

          {/* Attendance Records */}
          {lectureAttendance && !isLoadingAttendance && (
            <div className="mt-4">
              <h4 className="text-lg font-bold text-gray-800 dark:text-white mb-2">
                {lectureAttendance.course} - {t('lecturerCourses.lecture') || 'Lecture'} {lectureAttendance.lecture_number}
              </h4>
              
              {lectureAttendance.records && lectureAttendance.records.length > 0 ? (
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {lectureAttendance.records.map((record, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-navy-900 rounded-lg">
                      <div className="flex items-center gap-3">
                        {getAttendanceIcon(record.status)}
                        <span className="text-gray-900 dark:text-white font-medium">{record.name}</span>
                        <span className="text-gray-500 dark:text-gray-400 text-sm">ID: {record.student_id}</span>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${
                        record.status === 'present' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' :
                        record.status === 'late' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' :
                        'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                      }`}>
                        {record.status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                  {t('lecturerCourses.noAttendanceRecords') || 'No attendance records for this lecture'}
                </p>
              )}
            </div>
          )}
        </div>
      </Modal>

      {/* View Grades Modal */}
      <Modal
        isOpen={showViewGradesModal}
        onClose={() => setShowViewGradesModal(false)}
        title={t('lecturerCourses.viewGrades') || 'View Grades'}
        size="lg"
      >
        {isLoadingGrades ? (
          <div className="flex items-center justify-center py-12">
            <FaSpinner className="text-4xl text-primary-600 animate-spin" />
          </div>
        ) : examGrades ? (
          <div className="space-y-4">
            <div className="bg-gray-50 dark:bg-navy-900 rounded-lg p-4">
              <h4 className="text-lg font-bold text-gray-800 dark:text-white">{examGrades.exam_title}</h4>
              <p className="text-gray-600 dark:text-gray-400">{examGrades.course}</p>
              <p className="text-sm text-gray-500 dark:text-gray-500">
                {t('lecturerCourses.maxScore') || 'Max Score'}: {examGrades.max_score}
              </p>
            </div>

            {examGrades.grades && examGrades.grades.length > 0 ? (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {examGrades.grades.map((grade, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-navy-900 rounded-lg">
                    <div>
                      <span className="text-gray-900 dark:text-white font-medium">{grade.student_name}</span>
                      <span className="text-gray-500 dark:text-gray-400 text-sm ml-2">ID: {grade.student_id}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-xl font-bold text-primary-600 dark:text-teal-400">
                        {grade.score}
                      </span>
                      <span className="text-gray-500 dark:text-gray-500 text-sm">/{grade.max_score}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                {t('lecturerCourses.noGrades') || 'No grades recorded for this exam'}
              </p>
            )}
          </div>
        ) : (
          <p className="text-center text-gray-500 dark:text-gray-400 py-8">
            {t('lecturerCourses.selectExam') || 'Select an exam to view grades'}
          </p>
        )}
      </Modal>
    </div>
  );
};

export default LecturerCourses;
