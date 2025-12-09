import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  FaArrowLeft, 
  FaBook, 
  FaClock,
  FaMoon,
  FaSun,
  FaChartLine,
  FaCalendarAlt,
  FaDollarSign,
  FaGraduationCap,
  FaSpinner,
  FaClipboardCheck,
  FaTrophy,
  FaTimes,
  FaCheckCircle,
  FaTimesCircle,
  FaExclamationCircle,
  FaChevronDown,
  FaChevronUp,
  FaStar,
  FaInfoCircle
} from 'react-icons/fa';
import { useTheme } from '../../context/ThemeContext';
import { useInstitute } from '../../context/InstituteContext';
import { authService } from '../../services/authService';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';

const StudentCourses = () => {
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();
  const { instituteData, updateInstituteData } = useInstitute();
  const { t } = useTranslation();
  const [courses, setCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Expanded course state
  const [expandedCourseId, setExpandedCourseId] = useState(null);
  
  // Attendance and grades state
  const [attendanceData, setAttendanceData] = useState({});
  const [gradesData, setGradesData] = useState({});
  const [progressData, setProgressData] = useState({});
  const [loadingAttendance, setLoadingAttendance] = useState({});
  const [loadingGrades, setLoadingGrades] = useState({});
  const [loadingProgress, setLoadingProgress] = useState({});

  // Modal states
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [showGradesModal, setShowGradesModal] = useState(false);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);

  // Helper function to get full image URL
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

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Get level badge color
  const getLevelColor = (level) => {
    switch (level?.toLowerCase()) {
      case 'beginner':
        return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400';
      case 'intermediate':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400';
      case 'advanced':
        return 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-400';
    }
  };

  // Get attendance status icon and color
  const getAttendanceStatusStyle = (status) => {
    switch (status?.toLowerCase()) {
      case 'present':
        return {
          icon: FaCheckCircle,
          color: 'text-green-600 dark:text-green-400',
          bg: 'bg-green-100 dark:bg-green-900/30',
          label: t('studentCourses.present') || 'Present'
        };
      case 'absent':
        return {
          icon: FaTimesCircle,
          color: 'text-red-600 dark:text-red-400',
          bg: 'bg-red-100 dark:bg-red-900/30',
          label: t('studentCourses.absent') || 'Absent'
        };
      case 'late':
        return {
          icon: FaExclamationCircle,
          color: 'text-yellow-600 dark:text-yellow-400',
          bg: 'bg-yellow-100 dark:bg-yellow-900/30',
          label: t('studentCourses.late') || 'Late'
        };
      default:
        return {
          icon: FaExclamationCircle,
          color: 'text-gray-600 dark:text-gray-400',
          bg: 'bg-gray-100 dark:bg-gray-700',
          label: status || 'Unknown'
        };
    }
  };

  // Get attendance percentage color
  const getAttendancePercentageColor = (percentage) => {
    if (percentage >= 80) return 'text-green-600 dark:text-green-400';
    if (percentage >= 60) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  // Get grade percentage color
  const getGradeColor = (score, maxScore) => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 85) return 'text-green-600 dark:text-green-400';
    if (percentage >= 70) return 'text-blue-600 dark:text-blue-400';
    if (percentage >= 50) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  // Auth options for API calls
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

  // Fetch attendance for a course
  const fetchAttendance = async (courseId) => {
    if (!instituteData.accessToken || loadingAttendance[courseId]) return;
    
    setLoadingAttendance(prev => ({ ...prev, [courseId]: true }));
    try {
      const response = await authService.getStudentCourseAttendance(
        instituteData.accessToken,
        courseId,
        getAuthOptions()
      );
      
      if (response?.success) {
        setAttendanceData(prev => ({ ...prev, [courseId]: response }));
      }
    } catch (err) {
      console.error('Error fetching attendance:', err);
      toast.error(err?.message || t('studentCourses.attendanceError') || 'Failed to load attendance');
    } finally {
      setLoadingAttendance(prev => ({ ...prev, [courseId]: false }));
    }
  };

  // Fetch grades for a course
  const fetchGrades = async (courseId) => {
    if (!instituteData.accessToken || loadingGrades[courseId]) return;
    
    setLoadingGrades(prev => ({ ...prev, [courseId]: true }));
    try {
      const response = await authService.getStudentCourseGrades(
        instituteData.accessToken,
        courseId,
        getAuthOptions()
      );
      
      if (response?.success) {
        setGradesData(prev => ({ ...prev, [courseId]: response }));
      }
    } catch (err) {
      console.error('Error fetching grades:', err);
      toast.error(err?.message || t('studentCourses.gradesError') || 'Failed to load grades');
    } finally {
      setLoadingGrades(prev => ({ ...prev, [courseId]: false }));
    }
  };

  // Open attendance modal
  const openAttendanceModal = async (course) => {
    setSelectedCourse(course);
    setShowAttendanceModal(true);
    if (!attendanceData[course.id]) {
      await fetchAttendance(course.id);
    }
  };

  // Open grades modal
  const openGradesModal = async (course) => {
    setSelectedCourse(course);
    setShowGradesModal(true);
    if (!gradesData[course.id]) {
      await fetchGrades(course.id);
    }
  };

  // Fetch progress for a course
  const fetchProgress = async (courseId) => {
    if (loadingProgress[courseId]) return;
    
    setLoadingProgress(prev => ({ ...prev, [courseId]: true }));
    try {
      const response = await authService.getCourseProgress(
        courseId,
        instituteData.accessToken,
        getAuthOptions()
      );
      
      if (response?.success) {
        setProgressData(prev => ({ ...prev, [courseId]: response }));
      }
    } catch (err) {
      console.error('Error fetching progress:', err);
      toast.error(err?.message || t('studentCourses.progressError') || 'Failed to load progress');
    } finally {
      setLoadingProgress(prev => ({ ...prev, [courseId]: false }));
    }
  };

  // Open progress modal
  const openProgressModal = async (course) => {
    setSelectedCourse(course);
    setShowProgressModal(true);
    if (!progressData[course.id]) {
      await fetchProgress(course.id);
    }
  };

  // Fetch enrolled courses
  useEffect(() => {
    const fetchCourses = async () => {
      if (!instituteData.username) {
        setError('Username not found');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        const response = await authService.getStudentCourses(instituteData.username);
        
        if (response?.results) {
          setCourses(response.results);
        } else if (response?.data) {
          setCourses(Array.isArray(response.data) ? response.data : []);
        } else {
          setCourses([]);
        }
      } catch (err) {
        console.error('Error fetching courses:', err);
        setError(err?.message || 'Failed to load courses');
        toast.error(err?.message || 'Failed to load courses');
        setCourses([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCourses();
  }, [instituteData.username]);

  const totalCourses = courses.length;
  const totalPrice = courses.reduce((sum, course) => {
    const price = parseFloat(course.price) || 0;
    return sum + price;
  }, 0);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-navy-900 transition-colors flex items-center justify-center">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-12 h-12 border-4 border-primary-200 dark:border-primary-800 border-t-primary-600 dark:border-t-teal-400 rounded-full mx-auto mb-4"
          />
          <p className="text-gray-600 dark:text-gray-400">{t('common.loading') || 'Loading courses...'}</p>
        </div>
      </div>
    );
  }

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
                <span>{t('common.back') || 'Back to Feed'}</span>
              </motion.button>
              <h1 className="text-xl font-bold text-gray-800 dark:text-white">
                {t('studentCourses.myCourses') || 'My Courses'}
              </h1>
            </div>

            {/* Theme Toggle */}
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
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-teal-600 to-cyan-500 text-white rounded-xl p-8 mb-8 shadow-lg"
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold mb-2">
                {t('studentCourses.hello') || 'Hello'}, {instituteData.firstName || instituteData.username || 'Student'}!
              </h2>
              <p className="text-white/90">
                {totalCourses === 0 
                  ? (t('studentCourses.noCourses') || "You're not enrolled in any courses yet")
                  : `${t('studentCourses.enrolledIn') || "You're enrolled in"} ${totalCourses} ${totalCourses === 1 ? (t('studentCourses.course') || 'course') : (t('studentCourses.courses') || 'courses')}`
                }
              </p>
            </div>
            {totalCourses > 0 && (
              <div className="hidden md:block">
                <div className="text-right">
                  <p className="text-white/80 text-sm">{t('studentCourses.totalCourses') || 'Total Courses'}</p>
                  <p className="text-4xl font-bold">{totalCourses}</p>
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Error State */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 mb-8"
          >
            <p className="text-red-600 dark:text-red-400">{error}</p>
          </motion.div>
        )}

        {/* Stats Cards */}
        {totalCourses > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white dark:bg-navy-800 rounded-xl shadow-lg p-6"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                  <FaBook className="text-2xl text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {t('studentCourses.enrolledCourses') || 'Enrolled Courses'}
                  </p>
                  <p className="text-2xl font-bold text-gray-800 dark:text-white">{totalCourses}</p>
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
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                  <FaDollarSign className="text-2xl text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {t('studentCourses.totalPrice') || 'Total Price'}
                  </p>
                  <p className="text-2xl font-bold text-gray-800 dark:text-white">
                    ${totalPrice.toFixed(2)}
                  </p>
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
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                  <FaGraduationCap className="text-2xl text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {t('studentCourses.levels') || 'Levels'}
                  </p>
                  <p className="text-2xl font-bold text-gray-800 dark:text-white">
                    {[...new Set(courses.map(c => c.level))].length}
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Course Cards */}
        {totalCourses === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-navy-800 rounded-xl shadow-lg p-12 text-center"
          >
            <FaBook className="text-6xl text-gray-400 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
              {t('studentCourses.noCoursesTitle') || 'No Courses Yet'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {t('studentCourses.noCoursesMessage') || "You haven't enrolled in any courses yet. Explore available courses and enroll to get started!"}
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/explore')}
              className="px-6 py-3 bg-primary-600 hover:bg-primary-500 text-white rounded-lg font-semibold transition-colors"
            >
              {t('studentCourses.exploreCourses') || 'Explore Courses'}
            </motion.button>
          </motion.div>
        ) : (
          <div className="space-y-6">
            {courses.map((course, index) => (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white dark:bg-navy-800 rounded-xl shadow-lg overflow-hidden"
              >
                <div className="md:flex">
                  {/* Course Image */}
                  {course.course_image && (
                    <div className="md:w-64 h-48 md:h-auto bg-gray-200 dark:bg-navy-700 overflow-hidden">
                      <img
                        src={getImageUrl(course.course_image)}
                        alt={course.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(course.title || 'Course')}&background=0D9488&color=fff&size=256`;
                        }}
                      />
                    </div>
                  )}

                  {/* Course Details */}
                  <div className="flex-1 p-6">
                    {/* Course Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                          <h3 className="text-xl font-bold text-gray-800 dark:text-white">
                            {course.title}
                          </h3>
                          {course.level && (
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getLevelColor(course.level)}`}>
                              {course.level}
                            </span>
                          )}
                        </div>
                        {course.about && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">
                            {course.about}
                          </p>
                        )}
                      </div>
                      {course.price && (
                        <div className="text-right ml-4">
                          <p className="text-2xl font-bold text-primary-600 dark:text-teal-400">
                            ${parseFloat(course.price).toFixed(2)}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-500">
                            {t('studentCourses.price') || 'Price'}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Course Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-navy-700">
                      {course.starting_date && (
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                            <FaCalendarAlt className="text-blue-600 dark:text-blue-400" />
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {t('studentCourses.startDate') || 'Start Date'}
                            </p>
                            <p className="text-sm font-semibold text-gray-800 dark:text-white">
                              {formatDate(course.starting_date)}
                            </p>
                          </div>
                        </div>
                      )}

                      {course.ending_date && (
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                            <FaCalendarAlt className="text-red-600 dark:text-red-400" />
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {t('studentCourses.endDate') || 'End Date'}
                            </p>
                            <p className="text-sm font-semibold text-gray-800 dark:text-white">
                              {formatDate(course.ending_date)}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-navy-700">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => openAttendanceModal(course)}
                        className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white rounded-lg font-medium transition-all shadow-md hover:shadow-lg"
                      >
                        <FaClipboardCheck className="text-lg" />
                        <span>{t('studentCourses.viewAttendance') || 'View Attendance'}</span>
                      </motion.button>

                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => openGradesModal(course)}
                        className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-lg font-medium transition-all shadow-md hover:shadow-lg"
                      >
                        <FaTrophy className="text-lg" />
                        <span>{t('studentCourses.viewGrades') || 'View Grades'}</span>
                      </motion.button>

                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => openProgressModal(course)}
                        className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-lg font-medium transition-all shadow-md hover:shadow-lg"
                      >
                        <FaChartLine className="text-lg" />
                        <span>{t('studentCourses.viewProgress') || 'View Progress'}</span>
                      </motion.button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Attendance Modal */}
      <AnimatePresence>
        {showAttendanceModal && selectedCourse && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => {
              setShowAttendanceModal(false);
              setSelectedCourse(null);
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-navy-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden"
            >
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-teal-600 to-cyan-500 p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                      <FaClipboardCheck className="text-2xl text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">
                        {t('studentCourses.attendanceRecords') || 'Attendance Records'}
                      </h3>
                      <p className="text-white/80 text-sm">{selectedCourse.title}</p>
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => {
                      setShowAttendanceModal(false);
                      setSelectedCourse(null);
                    }}
                    className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
                  >
                    <FaTimes className="text-white text-lg" />
                  </motion.button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-6 overflow-y-auto max-h-[60vh]">
                {loadingAttendance[selectedCourse.id] ? (
                  <div className="text-center py-12">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="w-10 h-10 border-4 border-teal-200 dark:border-teal-800 border-t-teal-600 dark:border-t-teal-400 rounded-full mx-auto mb-4"
                    />
                    <p className="text-gray-600 dark:text-gray-400">
                      {t('studentCourses.loadingAttendance') || 'Loading attendance...'}
                    </p>
                  </div>
                ) : attendanceData[selectedCourse.id] ? (
                  <>
                    {/* Summary Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                      <div className="bg-gray-50 dark:bg-navy-700 rounded-xl p-4 text-center">
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                          {t('studentCourses.totalLectures') || 'Total Lectures'}
                        </p>
                        <p className="text-2xl font-bold text-gray-800 dark:text-white">
                          {attendanceData[selectedCourse.id].total_lectures || 0}
                        </p>
                      </div>
                      <div className="bg-gray-50 dark:bg-navy-700 rounded-xl p-4 text-center">
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                          {t('studentCourses.attendanceRate') || 'Attendance Rate'}
                        </p>
                        <p className={`text-2xl font-bold ${getAttendancePercentageColor(attendanceData[selectedCourse.id].attendance_percentage || 0)}`}>
                          {(attendanceData[selectedCourse.id].attendance_percentage || 0).toFixed(1)}%
                        </p>
                      </div>
                      <div className="bg-gray-50 dark:bg-navy-700 rounded-xl p-4 text-center col-span-2 md:col-span-1">
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                          {t('studentCourses.courseName') || 'Course'}
                        </p>
                        <p className="text-lg font-semibold text-gray-800 dark:text-white truncate">
                          {attendanceData[selectedCourse.id].course || selectedCourse.title}
                        </p>
                      </div>
                    </div>

                    {/* Attendance Progress Bar */}
                    <div className="mb-6">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-600 dark:text-gray-400">
                          {t('studentCourses.attendanceProgress') || 'Attendance Progress'}
                        </span>
                        <span className={`font-semibold ${getAttendancePercentageColor(attendanceData[selectedCourse.id].attendance_percentage || 0)}`}>
                          {(attendanceData[selectedCourse.id].attendance_percentage || 0).toFixed(1)}%
                        </span>
                      </div>
                      <div className="h-3 bg-gray-200 dark:bg-navy-700 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${attendanceData[selectedCourse.id].attendance_percentage || 0}%` }}
                          transition={{ duration: 0.8, ease: 'easeOut' }}
                          className={`h-full rounded-full ${
                            (attendanceData[selectedCourse.id].attendance_percentage || 0) >= 80 
                              ? 'bg-gradient-to-r from-green-500 to-emerald-500' 
                              : (attendanceData[selectedCourse.id].attendance_percentage || 0) >= 60 
                                ? 'bg-gradient-to-r from-yellow-500 to-amber-500'
                                : 'bg-gradient-to-r from-red-500 to-rose-500'
                          }`}
                        />
                      </div>
                    </div>

                    {/* Attendance Records List */}
                    <h4 className="font-semibold text-gray-800 dark:text-white mb-4">
                      {t('studentCourses.lectureRecords') || 'Lecture Records'}
                    </h4>
                    {attendanceData[selectedCourse.id].records?.length > 0 ? (
                      <div className="space-y-3">
                        {attendanceData[selectedCourse.id].records.map((record, index) => {
                          const statusStyle = getAttendanceStatusStyle(record.status);
                          const StatusIcon = statusStyle.icon;
                          return (
                            <motion.div
                              key={index}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.05 }}
                              className="flex items-center justify-between p-4 bg-gray-50 dark:bg-navy-700 rounded-xl"
                            >
                              <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-gray-200 dark:bg-navy-600 rounded-lg flex items-center justify-center">
                                  <span className="font-bold text-gray-700 dark:text-gray-300">
                                    {record.lecture_number}
                                  </span>
                                </div>
                                <div>
                                  <p className="font-medium text-gray-800 dark:text-white">
                                    {t('studentCourses.lecture') || 'Lecture'} {record.lecture_number}
                                  </p>
                                </div>
                              </div>
                              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${statusStyle.bg}`}>
                                <StatusIcon className={statusStyle.color} />
                                <span className={`text-sm font-medium ${statusStyle.color}`}>
                                  {statusStyle.label}
                                </span>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <FaClipboardCheck className="text-4xl text-gray-400 dark:text-gray-600 mx-auto mb-3" />
                        <p className="text-gray-600 dark:text-gray-400">
                          {t('studentCourses.noAttendanceRecords') || 'No attendance records yet'}
                        </p>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-12">
                    <FaClipboardCheck className="text-4xl text-gray-400 dark:text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-600 dark:text-gray-400">
                      {t('studentCourses.noAttendanceData') || 'No attendance data available'}
                    </p>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-gray-200 dark:border-navy-700">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setShowAttendanceModal(false);
                    setSelectedCourse(null);
                  }}
                  className="w-full px-4 py-3 bg-gray-100 dark:bg-navy-700 hover:bg-gray-200 dark:hover:bg-navy-600 text-gray-800 dark:text-white rounded-lg font-medium transition-colors"
                >
                  {t('common.close') || 'Close'}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Grades Modal */}
      <AnimatePresence>
        {showGradesModal && selectedCourse && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => {
              setShowGradesModal(false);
              setSelectedCourse(null);
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-navy-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden"
            >
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                      <FaTrophy className="text-2xl text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">
                        {t('studentCourses.gradesReport') || 'Grades Report'}
                      </h3>
                      <p className="text-white/80 text-sm">{selectedCourse.title}</p>
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => {
                      setShowGradesModal(false);
                      setSelectedCourse(null);
                    }}
                    className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
                  >
                    <FaTimes className="text-white text-lg" />
                  </motion.button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-6 overflow-y-auto max-h-[60vh]">
                {loadingGrades[selectedCourse.id] ? (
                  <div className="text-center py-12">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="w-10 h-10 border-4 border-purple-200 dark:border-purple-800 border-t-purple-600 dark:border-t-purple-400 rounded-full mx-auto mb-4"
                    />
                    <p className="text-gray-600 dark:text-gray-400">
                      {t('studentCourses.loadingGrades') || 'Loading grades...'}
                    </p>
                  </div>
                ) : gradesData[selectedCourse.id] ? (
                  <>
                    {/* Course Name Header */}
                    <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-xl p-4 mb-6">
                      <div className="flex items-center gap-3">
                        <FaBook className="text-purple-600 dark:text-purple-400 text-xl" />
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {t('studentCourses.courseName') || 'Course'}
                          </p>
                          <p className="font-semibold text-gray-800 dark:text-white">
                            {gradesData[selectedCourse.id].course || selectedCourse.title}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Grades List */}
                    <h4 className="font-semibold text-gray-800 dark:text-white mb-4">
                      {t('studentCourses.examResults') || 'Exam Results'}
                    </h4>
                    {gradesData[selectedCourse.id].grades?.length > 0 ? (
                      <div className="space-y-4">
                        {gradesData[selectedCourse.id].grades.map((grade, index) => {
                          const percentage = ((grade.score / grade.max_score) * 100);
                          return (
                            <motion.div
                              key={index}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.1 }}
                              className="bg-gray-50 dark:bg-navy-700 rounded-xl p-5"
                            >
                              <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
                                    <FaStar className="text-xl text-purple-600 dark:text-purple-400" />
                                  </div>
                                  <div>
                                    <h5 className="font-semibold text-gray-800 dark:text-white">
                                      {grade.exam_title}
                                    </h5>
                                    {grade.exam_date && (
                                      <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                        <FaCalendarAlt className="text-xs" />
                                        {formatDate(grade.exam_date)}
                                      </p>
                                    )}
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className={`text-2xl font-bold ${getGradeColor(grade.score, grade.max_score)}`}>
                                    {grade.score}
                                  </p>
                                  <p className="text-sm text-gray-500 dark:text-gray-400">
                                    {t('studentCourses.outOf') || 'out of'} {grade.max_score}
                                  </p>
                                </div>
                              </div>

                              {/* Grade Progress Bar */}
                              <div>
                                <div className="flex justify-between text-sm mb-2">
                                  <span className="text-gray-600 dark:text-gray-400">
                                    {t('studentCourses.score') || 'Score'}
                                  </span>
                                  <span className={`font-semibold ${getGradeColor(grade.score, grade.max_score)}`}>
                                    {percentage.toFixed(1)}%
                                  </span>
                                </div>
                                <div className="h-2.5 bg-gray-200 dark:bg-navy-600 rounded-full overflow-hidden">
                                  <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${percentage}%` }}
                                    transition={{ duration: 0.8, ease: 'easeOut', delay: index * 0.1 }}
                                    className={`h-full rounded-full ${
                                      percentage >= 85 
                                        ? 'bg-gradient-to-r from-green-500 to-emerald-500' 
                                        : percentage >= 70 
                                          ? 'bg-gradient-to-r from-blue-500 to-cyan-500'
                                          : percentage >= 50 
                                            ? 'bg-gradient-to-r from-yellow-500 to-amber-500'
                                            : 'bg-gradient-to-r from-red-500 to-rose-500'
                                    }`}
                                  />
                                </div>
                              </div>
                            </motion.div>
                          );
                        })}

                        {/* Average Score */}
                        {gradesData[selectedCourse.id].grades.length > 1 && (
                          <div className="bg-gradient-to-r from-purple-100 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/30 rounded-xl p-5 mt-6">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-purple-200 dark:bg-purple-800/50 rounded-xl flex items-center justify-center">
                                  <FaChartLine className="text-xl text-purple-700 dark:text-purple-300" />
                                </div>
                                <div>
                                  <p className="font-semibold text-gray-800 dark:text-white">
                                    {t('studentCourses.averageScore') || 'Average Score'}
                                  </p>
                                  <p className="text-sm text-gray-600 dark:text-gray-400">
                                    {t('studentCourses.acrossAllExams') || 'Across all exams'}
                                  </p>
                                </div>
                              </div>
                              <p className="text-3xl font-bold text-purple-700 dark:text-purple-300">
                                {(
                                  gradesData[selectedCourse.id].grades.reduce((sum, g) => sum + ((g.score / g.max_score) * 100), 0) /
                                  gradesData[selectedCourse.id].grades.length
                                ).toFixed(1)}%
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <FaTrophy className="text-4xl text-gray-400 dark:text-gray-600 mx-auto mb-3" />
                        <p className="text-gray-600 dark:text-gray-400">
                          {t('studentCourses.noGradesYet') || 'No grades available yet'}
                        </p>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-12">
                    <FaTrophy className="text-4xl text-gray-400 dark:text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-600 dark:text-gray-400">
                      {t('studentCourses.noGradesData') || 'No grades data available'}
                    </p>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-gray-200 dark:border-navy-700">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setShowGradesModal(false);
                    setSelectedCourse(null);
                  }}
                  className="w-full px-4 py-3 bg-gray-100 dark:bg-navy-700 hover:bg-gray-200 dark:hover:bg-navy-600 text-gray-800 dark:text-white rounded-lg font-medium transition-colors"
                >
                  {t('common.close') || 'Close'}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progress Modal */}
      <AnimatePresence>
        {showProgressModal && selectedCourse && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => {
              setShowProgressModal(false);
              setSelectedCourse(null);
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-navy-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden"
            >
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                      <FaChartLine className="text-2xl text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">
                        {t('studentCourses.courseProgress') || 'Course Progress'}
                      </h3>
                      <p className="text-white/80 text-sm">{selectedCourse.title}</p>
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => {
                      setShowProgressModal(false);
                      setSelectedCourse(null);
                    }}
                    className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
                  >
                    <FaTimes className="text-white text-lg" />
                  </motion.button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-6 overflow-y-auto max-h-[60vh]">
                {loadingProgress[selectedCourse.id] ? (
                  <div className="text-center py-12">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="w-10 h-10 border-4 border-blue-200 dark:border-blue-800 border-t-blue-600 dark:border-t-blue-400 rounded-full mx-auto mb-4"
                    />
                    <p className="text-gray-600 dark:text-gray-400">
                      {t('studentCourses.loadingProgress') || 'Loading progress...'}
                    </p>
                  </div>
                ) : progressData[selectedCourse.id] ? (
                  <>
                    {/* Course Title */}
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-4 mb-6">
                      <div className="flex items-center gap-3">
                        <FaBook className="text-blue-600 dark:text-blue-400 text-xl" />
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {t('studentCourses.courseName') || 'Course'}
                          </p>
                          <p className="font-semibold text-gray-800 dark:text-white">
                            {progressData[selectedCourse.id].progress?.course_title || selectedCourse.title}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Progress Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                      <div className="bg-gray-50 dark:bg-navy-700 rounded-xl p-4 text-center">
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                          {t('studentCourses.totalLectures') || 'Total Lectures'}
                        </p>
                        <p className="text-2xl font-bold text-gray-800 dark:text-white">
                          {progressData[selectedCourse.id].progress?.total_lectures || 0}
                        </p>
                      </div>
                      <div className="bg-gray-50 dark:bg-navy-700 rounded-xl p-4 text-center">
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                          {t('studentCourses.completedLectures') || 'Completed'}
                        </p>
                        <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                          {progressData[selectedCourse.id].progress?.completed_lectures !== null 
                            ? progressData[selectedCourse.id].progress?.completed_lectures 
                            : 'N/A'}
                        </p>
                      </div>
                      <div className="bg-gray-50 dark:bg-navy-700 rounded-xl p-4 text-center col-span-2 md:col-span-1">
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                          {t('studentCourses.progressPercentage') || 'Progress'}
                        </p>
                        <p className={`text-2xl font-bold ${
                          (progressData[selectedCourse.id].progress?.progress_percentage || 0) >= 80 
                            ? 'text-green-600 dark:text-green-400'
                            : (progressData[selectedCourse.id].progress?.progress_percentage || 0) >= 50 
                              ? 'text-blue-600 dark:text-blue-400'
                              : 'text-yellow-600 dark:text-yellow-400'
                        }`}>
                          {(progressData[selectedCourse.id].progress?.progress_percentage || 0).toFixed(1)}%
                        </p>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-6">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-600 dark:text-gray-400">
                          {t('studentCourses.overallProgress') || 'Overall Progress'}
                        </span>
                        <span className={`font-semibold ${
                          (progressData[selectedCourse.id].progress?.progress_percentage || 0) >= 80 
                            ? 'text-green-600 dark:text-green-400'
                            : (progressData[selectedCourse.id].progress?.progress_percentage || 0) >= 50 
                              ? 'text-blue-600 dark:text-blue-400'
                              : 'text-yellow-600 dark:text-yellow-400'
                        }`}>
                          {(progressData[selectedCourse.id].progress?.progress_percentage || 0).toFixed(1)}%
                        </span>
                      </div>
                      <div className="h-4 bg-gray-200 dark:bg-navy-700 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${progressData[selectedCourse.id].progress?.progress_percentage || 0}%` }}
                          transition={{ duration: 0.8, ease: 'easeOut' }}
                          className={`h-full rounded-full ${
                            (progressData[selectedCourse.id].progress?.progress_percentage || 0) >= 80 
                              ? 'bg-gradient-to-r from-green-500 to-emerald-500' 
                              : (progressData[selectedCourse.id].progress?.progress_percentage || 0) >= 50 
                                ? 'bg-gradient-to-r from-blue-500 to-cyan-500'
                                : 'bg-gradient-to-r from-yellow-500 to-amber-500'
                          }`}
                        />
                      </div>
                    </div>

                    {/* Note if viewing as visitor */}
                    {progressData[selectedCourse.id].progress?.completed_lectures === null && (
                      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <FaInfoCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm text-blue-800 dark:text-blue-300">
                              {t('studentCourses.averageProgressNote') || 'This shows the average progress of all students in this course.'}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-12">
                    <FaChartLine className="text-4xl text-gray-400 dark:text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-600 dark:text-gray-400">
                      {t('studentCourses.noProgressData') || 'No progress data available'}
                    </p>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-gray-200 dark:border-navy-700">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setShowProgressModal(false);
                    setSelectedCourse(null);
                  }}
                  className="w-full px-4 py-3 bg-gray-100 dark:bg-navy-700 hover:bg-gray-200 dark:hover:bg-navy-600 text-gray-800 dark:text-white rounded-lg font-medium transition-colors"
                >
                  {t('common.close') || 'Close'}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default StudentCourses;
