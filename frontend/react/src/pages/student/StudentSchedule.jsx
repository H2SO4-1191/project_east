import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  FaArrowLeft, 
  FaCalendarAlt, 
  FaClock, 
  FaMapMarkerAlt, 
  FaUser,
  FaMoon,
  FaSun,
  FaSpinner
} from 'react-icons/fa';
import { useTheme } from '../../context/ThemeContext';
import { useInstitute } from '../../context/InstituteContext';
import { authService } from '../../services/authService';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';

const StudentSchedule = () => {
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();
  const { instituteData, updateInstituteData, clearInstituteData } = useInstitute();
  const { t } = useTranslation();
  
  const [schedule, setSchedule] = useState({
    Monday: [],
    Tuesday: [],
    Wednesday: [],
    Thursday: [],
    Friday: [],
    Saturday: [],
    Sunday: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const days = [
    { key: 'monday', label: 'Monday' },
    { key: 'tuesday', label: 'Tuesday' },
    { key: 'wednesday', label: 'Wednesday' },
    { key: 'thursday', label: 'Thursday' },
    { key: 'friday', label: 'Friday' },
    { key: 'saturday', label: 'Saturday' },
    { key: 'sunday', label: 'Sunday' },
  ];
  const [selectedDay, setSelectedDay] = useState('monday');

  // Fetch schedule from API
  useEffect(() => {
    const fetchSchedule = async () => {
      if (!instituteData.accessToken || instituteData.userType !== 'student') {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await authService.getStudentSchedule(instituteData.accessToken, {
          refreshToken: instituteData.refreshToken,
          onTokenRefreshed: (tokens) => {
            updateInstituteData({
              accessToken: tokens.access,
              refreshToken: tokens.refresh,
            });
          },
          onSessionExpired: () => {
            clearInstituteData();
            navigate('/login');
            toast.error(t('common.sessionExpired') || 'Session expired. Please log in again.');
          },
        });

        if (response?.success && response?.schedule) {
          // Transform API response to grouped by day
          const groupedSchedule = {
            Monday: [],
            Tuesday: [],
            Wednesday: [],
            Thursday: [],
            Friday: [],
            Saturday: [],
            Sunday: [],
          };

          response.schedule.forEach((item) => {
            const dayKey = item.day 
              ? item.day.charAt(0).toUpperCase() + item.day.slice(1).toLowerCase()
              : 'Monday';
            
            if (groupedSchedule[dayKey]) {
              groupedSchedule[dayKey].push({
                id: item.course_id,
                course: item.course_title || 'Untitled Course',
                time: `${item.start_time || '09:00'} - ${item.end_time || '10:00'}`,
                instructor: item.lecturer || 'TBA',
                institution: item.institution || 'N/A',
                course_id: item.course_id,
                start_time: item.start_time,
                end_time: item.end_time,
              });
            }
          });

          setSchedule(groupedSchedule);
        } else {
          setError(t('schedule.noSchedule') || 'No schedule data available');
        }
      } catch (err) {
        console.error('Error fetching schedule:', err);
        setError(err?.message || t('schedule.fetchError') || 'Failed to load schedule');
        toast.error(err?.message || t('schedule.fetchError') || 'Failed to load schedule');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSchedule();
  }, [instituteData.accessToken, instituteData.refreshToken, instituteData.userType, navigate, updateInstituteData, clearInstituteData, t]);

  // Get schedule for selected day
  const getSelectedDayKey = () => {
    const day = days.find(d => d.key === selectedDay);
    return day ? day.label : 'Monday';
  };

  const getSelectedDaySchedule = () => {
    const dayKey = getSelectedDayKey();
    return schedule[dayKey] || [];
  };

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
              <h1 className="text-xl font-bold text-gray-800 dark:text-white">{t('schedule.title') || 'My Schedule'}</h1>
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
          className="bg-gradient-to-r from-blue-600 to-indigo-500 text-white rounded-xl p-8 mb-8 shadow-lg"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
              <FaCalendarAlt className="text-3xl" />
            </div>
            <div>
              <h2 className="text-3xl font-bold">
                {t('schedule.welcome', { name: instituteData.firstName || instituteData.username || 'Student' }) || `Welcome, ${instituteData.firstName || instituteData.username || 'Student'}!`}
              </h2>
              <p className="text-white/90 mt-1">{t('schedule.subtitle') || "Here's your weekly schedule"}</p>
            </div>
          </div>
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
                key={day.key}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedDay(day.key)}
                className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                  selectedDay === day.key
                    ? 'bg-primary-600 text-white shadow-md'
                    : 'bg-gray-100 dark:bg-navy-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-navy-600'
                }`}
              >
                {day.label}
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Schedule Cards */}
        <div className="space-y-4">
          {isLoading ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white dark:bg-navy-800 rounded-xl shadow-lg p-12 text-center"
            >
              <div className="w-20 h-20 bg-gray-100 dark:bg-navy-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaSpinner className="text-4xl text-primary-600 dark:text-primary-400 animate-spin" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
                {t('schedule.loading') || 'Loading schedule...'}
              </h3>
            </motion.div>
          ) : error ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white dark:bg-navy-800 rounded-xl shadow-lg p-12 text-center"
            >
              <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaCalendarAlt className="text-4xl text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
                {t('schedule.error') || 'Error Loading Schedule'}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {error}
              </p>
            </motion.div>
          ) : getSelectedDaySchedule().length > 0 ? (
            getSelectedDaySchedule().map((session, index) => (
              <motion.div
                key={session.id || session.course_id || index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white dark:bg-navy-800 rounded-xl shadow-lg overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold text-gray-800 dark:text-white">
                          {session.course}
                        </h3>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                      <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                        <FaClock className="text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-500">{t('schedule.time') || 'Time'}</p>
                        <p className="font-semibold">{session.time}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                      <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                        <FaUser className="text-purple-600 dark:text-purple-400" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-500">{t('schedule.instructor') || 'Instructor'}</p>
                        <p className="font-semibold">{session.instructor}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                      <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                        <FaMapMarkerAlt className="text-green-600 dark:text-green-400" />
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
        </div>
      </div>
    </div>
  );
};

export default StudentSchedule;
