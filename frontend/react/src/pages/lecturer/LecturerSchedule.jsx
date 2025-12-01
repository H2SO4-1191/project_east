import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  FaArrowLeft, 
  FaCalendarAlt, 
  FaClock, 
  FaMapMarkerAlt, 
  FaUsers,
  FaMoon,
  FaSun,
  FaUniversity,
  FaExclamationTriangle,
  FaInfoCircle
} from 'react-icons/fa';
import { useTheme } from '../../context/ThemeContext';
import { useInstitute } from '../../context/InstituteContext';
import { authService } from '../../services/authService';

const LecturerSchedule = () => {
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();
  const { instituteData, updateInstituteData } = useInstitute();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  const [schedule, setSchedule] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isNotVerified, setIsNotVerified] = useState(false);

  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const [selectedDay, setSelectedDay] = useState('monday');

  // Capitalize first letter for display
  const capitalizeDay = (day) => {
    return day.charAt(0).toUpperCase() + day.slice(1);
  };

  // Get current day
  useEffect(() => {
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    if (days.includes(today)) {
      setSelectedDay(today);
    }
  }, []);

  // Fetch schedule from API
  useEffect(() => {
    const fetchSchedule = async () => {
      if (!instituteData.isAuthenticated || !instituteData.accessToken) {
        setError('Please login to view your schedule');
        setIsLoading(false);
        return;
      }

      /* UNCOMMENT FOR PRODUCTION - Verification Check
      if (!instituteData.isVerified) {
        setIsNotVerified(true);
        setIsLoading(false);
        return;
      }
      */

      setIsLoading(true);
      setError(null);

      try {
        const refreshToken = instituteData.refreshToken || null;
        
        const scheduleData = await authService.getLecturerSchedule(instituteData.accessToken, {
          refreshToken,
          onTokenRefreshed: (tokens) => {
            updateInstituteData({
              accessToken: tokens.access,
              refreshToken: tokens.refresh || refreshToken,
            });
          },
          onSessionExpired: () => {
            navigate('/login');
          },
        });

        if (scheduleData?.success && Array.isArray(scheduleData.schedule)) {
          // Group schedule by day
          const groupedSchedule = {};
          scheduleData.schedule.forEach((item) => {
            const day = item.day.toLowerCase();
            if (!groupedSchedule[day]) {
              groupedSchedule[day] = [];
            }
            groupedSchedule[day].push({
              id: item.course_id,
              course: item.course_title,
              startTime: item.start_time,
              endTime: item.end_time,
              institution: item.institution,
              type: 'Lecture', // Default type since API doesn't provide it
            });
          });
          setSchedule(groupedSchedule);
        } else {
          setSchedule({});
        }
      } catch (error) {
        console.error('Error fetching schedule:', error);
        if (error.status === 403) {
          // User is not verified
          setIsNotVerified(true);
        } else {
          setError(error.message || 'Failed to load schedule. Please try again.');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchSchedule();
  }, [instituteData.isAuthenticated, instituteData.accessToken]);

  const getTypeColor = (type) => {
    switch (type) {
      case 'Lecture':
        return 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300';
      case 'Lab':
        return 'bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300';
      case 'Tutorial':
        return 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300';
      default:
        return 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300';
    }
  };

  // Format time display
  const formatTime = (startTime, endTime) => {
    if (!startTime) return '';
    if (endTime) {
      return `${startTime} - ${endTime}`;
    }
    return startTime;
  };

  return (
    <div className={`min-h-screen bg-gray-50 dark:bg-navy-900 transition-colors ${isRTL ? 'rtl' : 'ltr'}`}>
      {/* Navigation Bar */}
      <nav className="bg-white dark:bg-navy-800 shadow-lg sticky top-0 z-50 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`flex justify-between items-center h-16 ${isRTL ? 'flex-row-reverse' : ''}`}>
            {/* Back Button and Title */}
            <div className={`flex items-center gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/feed')}
                className={`flex items-center gap-2 px-4 py-2 text-primary-600 dark:text-teal-400 hover:bg-gray-100 dark:hover:bg-navy-700 rounded-lg transition-colors ${isRTL ? 'flex-row-reverse' : ''}`}
              >
                <FaArrowLeft className={isRTL ? 'rotate-180' : ''} />
                <span>{t('common.back') || 'Back to Feed'}</span>
              </motion.button>
              <h1 className="text-xl font-bold text-gray-800 dark:text-white">
                {t('schedule.teachingSchedule') || 'Teaching Schedule'}
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
        {/* Not Verified Warning */}
        {isNotVerified && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-8 mb-8 text-center"
          >
            <div className="w-20 h-20 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaExclamationTriangle className="text-4xl text-yellow-600 dark:text-yellow-400" />
            </div>
            <h2 className="text-2xl font-bold text-yellow-800 dark:text-yellow-300 mb-2">
              {t('verification.notVerified') || 'Account Not Verified'}
            </h2>
            <p className="text-yellow-700 dark:text-yellow-400 mb-6 max-w-md mx-auto">
              {t('verification.scheduleMessage') || 'You need to verify your account to view your schedule.'}
            </p>
            <div className="bg-yellow-100 dark:bg-yellow-900/30 rounded-lg p-4 mb-6 max-w-md mx-auto">
              <div className={`flex items-start gap-3 ${isRTL ? 'flex-row-reverse text-right' : ''}`}>
                <FaInfoCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-yellow-800 dark:text-yellow-300 font-medium mb-1">
                    {t('verification.howToVerify') || 'How to verify?'}
                  </p>
                  <p className="text-xs text-yellow-700 dark:text-yellow-400">
                    {t('verification.instructions') || 'Go to your profile and complete the verification process by uploading the required documents.'}
                  </p>
                </div>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/feed')}
              className="px-6 py-3 bg-primary-600 hover:bg-primary-500 text-white rounded-lg font-medium transition-colors"
            >
              {t('verification.goToProfile') || 'Go to Profile'}
            </motion.button>
          </motion.div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 dark:border-teal-400"></div>
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && !isNotVerified && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-8 text-center"
          >
            <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaExclamationTriangle className="text-4xl text-red-600 dark:text-red-400" />
            </div>
            <h2 className="text-xl font-bold text-red-800 dark:text-red-300 mb-2">
              {t('common.error') || 'Error'}
            </h2>
            <p className="text-red-700 dark:text-red-400 mb-4">{error}</p>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg font-medium transition-colors"
            >
              {t('common.retry') || 'Retry'}
            </motion.button>
          </motion.div>
        )}

        {/* Schedule Content */}
        {!isLoading && !error && !isNotVerified && (
          <>
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-xl p-8 mb-8 shadow-lg"
        >
              <div className={`flex items-center gap-4 mb-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
              <FaCalendarAlt className="text-3xl" />
            </div>
                <div className={`flex-1 ${isRTL ? 'text-right' : ''}`}>
              <h2 className="text-3xl font-bold">
                    {t('schedule.welcome') || 'Welcome'}, {instituteData.firstName || instituteData.username || 'Lecturer'}!
              </h2>
                  <p className="text-white/90 mt-1">{t('schedule.weeklySchedule') || 'Your weekly teaching schedule'}</p>
            </div>
          </div>
              {instituteData.institution && (
                <div className={`flex items-center gap-2 bg-white/10 rounded-lg px-4 py-2 w-fit ${isRTL ? 'flex-row-reverse' : ''}`}>
            <FaUniversity className="text-lg" />
                  <span className="font-medium">{instituteData.institution}</span>
          </div>
              )}
        </motion.div>

        {/* Day Selector */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-navy-800 rounded-xl shadow-lg p-6 mb-8"
        >
          <div className="flex flex-wrap gap-3">
            {days.map((day) => (
              <motion.button
                key={day}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedDay(day)}
                className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                  selectedDay === day
                    ? 'bg-gradient-to-r from-purple-600 to-pink-500 text-white shadow-md'
                    : 'bg-gray-100 dark:bg-navy-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-navy-600'
                }`}
              >
                    {t(`days.${day}`) || capitalizeDay(day)}
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Schedule Cards */}
        <div className="space-y-4">
              <AnimatePresence mode="wait">
          {schedule[selectedDay] && schedule[selectedDay].length > 0 ? (
            schedule[selectedDay].map((session, index) => (
              <motion.div
                      key={`${session.id}-${index}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white dark:bg-navy-800 rounded-xl shadow-lg overflow-hidden"
              >
                <div className="p-6">
                        <div className={`flex items-start justify-between mb-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                          <div className={`flex-1 ${isRTL ? 'text-right' : ''}`}>
                            <div className={`flex items-center gap-3 mb-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <h3 className="text-xl font-bold text-gray-800 dark:text-white">
                          {session.course}
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getTypeColor(session.type)}`}>
                          {session.type}
                        </span>
                      </div>
                    </div>
                  </div>

                        <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${isRTL ? 'text-right' : ''}`}>
                          <div className={`flex items-center gap-3 text-gray-700 dark:text-gray-300 ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                        <FaClock className="text-purple-600 dark:text-purple-400" />
                      </div>
                      <div>
                              <p className="text-xs text-gray-500 dark:text-gray-500">{t('schedule.time') || 'Time'}</p>
                              <p className="font-semibold">{formatTime(session.startTime, session.endTime)}</p>
                      </div>
                    </div>

                          <div className={`flex items-center gap-3 text-gray-700 dark:text-gray-300 ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center">
                              <FaUniversity className="text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <div>
                              <p className="text-xs text-gray-500 dark:text-gray-500">{t('schedule.institution') || 'Institution'}</p>
                              <p className="font-semibold">{session.institution}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white dark:bg-navy-800 rounded-xl shadow-lg p-12 text-center"
            >
              <div className="w-20 h-20 bg-gray-100 dark:bg-navy-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaCalendarAlt className="text-4xl text-gray-400 dark:text-gray-500" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
                      {t('schedule.noClasses') || 'No Classes Today'}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                      {t('schedule.enjoyDayOff') || 'Enjoy your day off!'}
              </p>
            </motion.div>
          )}
              </AnimatePresence>
        </div>
          </>
        )}
      </div>
    </div>
  );
};

export default LecturerSchedule;
