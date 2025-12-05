import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
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
  FaSpinner
} from 'react-icons/fa';
import { useTheme } from '../../context/ThemeContext';
import { useInstitute } from '../../context/InstituteContext';
import { authService } from '../../services/authService';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';

const StudentCourses = () => {
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();
  const { instituteData } = useInstitute();
  const { t } = useTranslation();
  const [courses, setCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Helper function to get full image URL
  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }
    const baseUrl = import.meta.env.VITE_API_BASE_URL?.replace(/\/+$/, '') || 'http://127.0.0.1:8000';
    // Ensure imagePath starts with / and doesn't have duplicate /media/
    let cleanPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
    // Remove duplicate /media/ if present
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
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentCourses;
