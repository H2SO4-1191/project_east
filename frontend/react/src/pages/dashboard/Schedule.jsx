import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FaCalendarAlt, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import Card from '../../components/Card';
import { scheduleData } from '../../data/enhancedDemoData';
import { ScheduleSkeleton, ListEmptyState } from '../../components/Skeleton';
import { useInstitute } from '../../context/InstituteContext';
import { authService } from '../../services/authService';
import VerificationLock from '../../components/VerificationLock';

const FALLBACK_SCHEDULE = scheduleData.reduce((acc, item) => {
  const dayKey = item.day?.toLowerCase() || 'monday';
  if (!acc[dayKey]) acc[dayKey] = [];
  acc[dayKey].push({
    course_id: item.id,
    course_title: item.subject,
    lecturer: item.teacher,
    start_time: item.time.split(' - ')[0] || '',
    end_time: item.time.split(' - ')[1] || '',
    room: item.room,
  });
  return acc;
}, {});

const Schedule = () => {
  const navigate = useNavigate();
  const { instituteData, updateInstituteData, clearInstituteData } = useInstitute();
  const { t } = useTranslation();
  const [currentWeek, setCurrentWeek] = useState(0);
  const [schedule, setSchedule] = useState(FALLBACK_SCHEDULE);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const days = useMemo(
    () => [
      { key: 'monday', label: t('dashboard.schedulePage.monday') },
      { key: 'tuesday', label: t('dashboard.schedulePage.tuesday') },
      { key: 'wednesday', label: t('dashboard.schedulePage.wednesday') },
      { key: 'thursday', label: t('dashboard.schedulePage.thursday') },
      { key: 'friday', label: t('dashboard.schedulePage.friday') },
      { key: 'saturday', label: t('dashboard.schedulePage.saturday') },
      { key: 'sunday', label: t('dashboard.schedulePage.sunday') },
    ],
    [t]
  );

  useEffect(() => {
    const loadSchedule = async () => {
      if (!instituteData.accessToken) return;

      setIsLoading(true);
      setError('');

      try {
        const remoteSchedule = await authService.getSchedule(instituteData.accessToken, {
          refreshToken: instituteData.refreshToken,
          onTokenRefreshed: (tokens) =>
            updateInstituteData({
              accessToken: tokens.access,
              refreshToken: tokens.refresh || instituteData.refreshToken,
            }),
          onSessionExpired: () => {
            clearInstituteData();
            navigate('/login', { replace: true });
          },
        });
        setSchedule(remoteSchedule);
      } catch (err) {
        console.error('Failed to fetch schedule:', err);
        setError(
          err?.message ||
            t('dashboard.schedulePage.unableToLoadSchedule')
        );
        setSchedule(FALLBACK_SCHEDULE);
      } finally {
        setIsLoading(false);
      }
    };

    loadSchedule();
  }, [
    instituteData.accessToken,
    instituteData.refreshToken,
    updateInstituteData,
    clearInstituteData,
    navigate,
  ]);

  const getScheduleByDay = (dayKey) => {
    const key = typeof dayKey === 'string' ? dayKey.toLowerCase() : dayKey.key?.toLowerCase();
    if (Array.isArray(schedule?.[key])) {
      return schedule[key];
    }
    return [];
  };

  const handlePrevWeek = () => setCurrentWeek(prev => prev - 1);
  const handleNextWeek = () => setCurrentWeek(prev => prev + 1);

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">{t('dashboard.schedulePage.title')}</h2>
          <p className="text-gray-600 dark:text-gray-400">{t('dashboard.schedulePage.subtitle')}</p>
        </div>
        
        <div className="flex items-center gap-4">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handlePrevWeek}
            className="p-3 bg-white dark:bg-navy-800 rounded-lg shadow-md hover:shadow-lg transition-all"
          >
            <FaChevronLeft className="text-gray-600 dark:text-gray-400" />
          </motion.button>
          
          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">{t('dashboard.schedulePage.currentWeek')}</p>
            <p className="font-semibold text-gray-800 dark:text-white">
              {t('dashboard.schedulePage.week')} {currentWeek === 0 ? t('dashboard.schedulePage.current') : currentWeek > 0 ? `+${currentWeek}` : currentWeek}
            </p>
          </div>
          
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleNextWeek}
            className="p-3 bg-white dark:bg-navy-800 rounded-lg shadow-md hover:shadow-lg transition-all"
          >
            <FaChevronRight className="text-gray-600 dark:text-gray-400" />
          </motion.button>
        </div>
      </motion.div>

      {/* Weekly Calendar View */}
      {error && (
        <div className="text-sm text-amber-500 dark:text-amber-300">
          {error}
        </div>
      )}

      {isLoading ? (
        <ScheduleSkeleton />
      ) : (
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <AnimatePresence mode="wait">
            {days.slice(0, 5).map((day, index) => {
              const entries = getScheduleByDay(day.key);
              return (
            <motion.div
                  key={`${day.key}-${currentWeek}`}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card delay={0} className="h-full">
                <div className="flex items-center gap-2 mb-4">
                  <FaCalendarAlt className="text-primary-600 dark:text-teal-400" />
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                        {day.label}
                  </h3>
                </div>
                
                <div className="space-y-3">
                      {entries.map((item) => (
                    <motion.div
                          key={`${item.course_id}-${item.start_time}`}
                      whileHover={{ scale: 1.02, y: -2 }}
                          className="p-3 bg-gradient-to-r from-primary-50 to-teal-50 dark:from-primary-900/20 dark:to-teal-900/20 rounded-lg border-l-4 border-primary-500 dark:border-teal-400"
                    >
                      <p className="text-xs font-semibold text-primary-600 dark:text-teal-400 mb-1">
                            {item.start_time} – {item.end_time}
                      </p>
                      <p className="text-sm font-bold text-gray-800 dark:text-white mb-1">
                            {item.course_title}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                            {item.lecturer}
                      </p>
                          {item.room && (
                      <p className="text-xs text-gray-500 dark:text-gray-500">
                              {t('dashboard.schedulePage.room')} {item.room}
                      </p>
                          )}
                    </motion.div>
                  ))}
                  
                      {entries.length === 0 && (
                    <div className="text-center py-8 text-gray-400 dark:text-gray-600">
                          <p className="text-sm">{t('dashboard.schedulePage.noClasses')}</p>
                    </div>
                  )}
                </div>
              </Card>
            </motion.div>
              );
            })}
        </AnimatePresence>
      </div>
      )}

      {!isLoading && days.slice(5).some(day => getScheduleByDay(day.key).length > 0) && (
        <Card delay={0.1}>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">{t('dashboard.schedulePage.weekend')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {days.slice(5).map((day) => {
              const entries = getScheduleByDay(day.key);
              return (
                <div key={day.key} className="space-y-3">
                  <h4 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    {day.label}
                  </h4>
                  {entries.length > 0 ? (
                    entries.map((item) => (
                      <div
                        key={`${item.course_id}-${item.start_time}`}
                        className="p-3 bg-gradient-to-r from-primary-50 to-teal-50 dark:from-primary-900/20 dark:to-teal-900/20 rounded-lg border-l-4 border-primary-500 dark:border-teal-400"
                      >
                        <p className="text-xs font-semibold text-primary-600 dark:text-teal-400 mb-1">
                          {item.start_time} – {item.end_time}
                        </p>
                        <p className="text-sm font-bold text-gray-800 dark:text-white mb-1">
                          {item.course_title}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {item.lecturer}
                        </p>
                        {item.room && (
                          <p className="text-xs text-gray-500 dark:text-gray-500">
                            {t('dashboard.schedulePage.room')} {item.room}
                          </p>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-gray-400 dark:text-gray-600">{t('dashboard.schedulePage.noClasses')}</div>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
};

export default Schedule;

