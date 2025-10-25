import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaCalendarAlt, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import Card from '../../components/Card';
import { scheduleData } from '../../data/enhancedDemoData';

const Schedule = () => {
  const [currentWeek, setCurrentWeek] = useState(0);
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  const getScheduleByDay = (day) => {
    return scheduleData.filter(item => item.day === day);
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
          <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">Schedule</h2>
          <p className="text-gray-600 dark:text-gray-400">Weekly class timetable</p>
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
            <p className="text-sm text-gray-600 dark:text-gray-400">Current Week</p>
            <p className="font-semibold text-gray-800 dark:text-white">
              Week {currentWeek === 0 ? 'Current' : currentWeek > 0 ? `+${currentWeek}` : currentWeek}
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
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <AnimatePresence mode="wait">
          {days.map((day, index) => (
            <motion.div
              key={`${day}-${currentWeek}`}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card delay={0} className="h-full">
                <div className="flex items-center gap-2 mb-4">
                  <FaCalendarAlt className="text-primary-600 dark:text-teal-400" />
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                    {day}
                  </h3>
                </div>
                
                <div className="space-y-3">
                  {getScheduleByDay(day).map((schedule) => (
                    <motion.div
                      key={schedule.id}
                      whileHover={{ scale: 1.02, y: -2 }}
                      className="p-3 bg-gradient-to-r from-primary-50 to-teal-50 dark:from-primary-900/20 dark:to-teal-900/20 rounded-lg border-l-4 border-primary-500 dark:border-teal-400 cursor-pointer"
                    >
                      <p className="text-xs font-semibold text-primary-600 dark:text-teal-400 mb-1">
                        {schedule.time}
                      </p>
                      <p className="text-sm font-bold text-gray-800 dark:text-white mb-1">
                        {schedule.subject}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {schedule.grade}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                        {schedule.teacher}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500">
                        {schedule.room}
                      </p>
                    </motion.div>
                  ))}
                  
                  {getScheduleByDay(day).length === 0 && (
                    <div className="text-center py-8 text-gray-400 dark:text-gray-600">
                      <p className="text-sm">No classes</p>
                    </div>
                  )}
                </div>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Schedule;

