import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  FaArrowLeft, 
  FaCalendarAlt, 
  FaClock, 
  FaMapMarkerAlt, 
  FaUser,
  FaMoon,
  FaSun
} from 'react-icons/fa';
import { useTheme } from '../../context/ThemeContext';
import { useInstitute } from '../../context/InstituteContext';

const StudentSchedule = () => {
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();
  const { instituteData } = useInstitute();

  // Demo schedule data
  const [schedule] = useState({
    Monday: [
      {
        id: 1,
        course: 'Introduction to Programming',
        code: 'CS101',
        time: '09:00 AM - 11:00 AM',
        instructor: 'Dr. Sarah Khan',
        location: 'Room 201, Computer Lab',
        type: 'Lecture',
      },
      {
        id: 2,
        course: 'Calculus I',
        code: 'MATH101',
        time: '02:00 PM - 03:30 PM',
        instructor: 'Prof. Karim Saleh',
        location: 'Room 105, Mathematics Building',
        type: 'Lecture',
      },
    ],
    Tuesday: [
      {
        id: 3,
        course: 'Data Structures',
        code: 'CS201',
        time: '10:00 AM - 12:00 PM',
        instructor: 'Dr. Sarah Khan',
        location: 'Room 202, Computer Lab',
        type: 'Lab',
      },
    ],
    Wednesday: [
      {
        id: 4,
        course: 'Introduction to Programming',
        code: 'CS101',
        time: '09:00 AM - 11:00 AM',
        instructor: 'Dr. Sarah Khan',
        location: 'Room 201, Computer Lab',
        type: 'Lecture',
      },
      {
        id: 5,
        course: 'English Composition',
        code: 'ENG101',
        time: '01:00 PM - 02:30 PM',
        instructor: 'Prof. Ahmed Ali',
        location: 'Room 301, Arts Building',
        type: 'Lecture',
      },
    ],
    Thursday: [
      {
        id: 6,
        course: 'Data Structures',
        code: 'CS201',
        time: '10:00 AM - 12:00 PM',
        instructor: 'Dr. Sarah Khan',
        location: 'Room 202, Computer Lab',
        type: 'Lab',
      },
      {
        id: 7,
        course: 'Physics I',
        code: 'PHY101',
        time: '03:00 PM - 04:30 PM',
        instructor: 'Dr. Omar Hassan',
        location: 'Room 150, Science Building',
        type: 'Lecture',
      },
    ],
    Friday: [
      {
        id: 8,
        course: 'Calculus I',
        code: 'MATH101',
        time: '09:00 AM - 10:30 AM',
        instructor: 'Prof. Karim Saleh',
        location: 'Room 105, Mathematics Building',
        type: 'Tutorial',
      },
    ],
  });

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const [selectedDay, setSelectedDay] = useState('Monday');

  const getTypeColor = (type) => {
    switch (type) {
      case 'Lecture':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300';
      case 'Lab':
        return 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300';
      case 'Tutorial':
        return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300';
      default:
        return 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300';
    }
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
                <span>Back to Feed</span>
              </motion.button>
              <h1 className="text-xl font-bold text-gray-800 dark:text-white">My Schedule</h1>
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
                Welcome, {instituteData.firstName || instituteData.username || 'Student'}!
              </h2>
              <p className="text-white/90 mt-1">Here's your weekly schedule</p>
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
                key={day}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedDay(day)}
                className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                  selectedDay === day
                    ? 'bg-primary-600 text-white shadow-md'
                    : 'bg-gray-100 dark:bg-navy-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-navy-600'
                }`}
              >
                {day}
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Schedule Cards */}
        <div className="space-y-4">
          {schedule[selectedDay] && schedule[selectedDay].length > 0 ? (
            schedule[selectedDay].map((session, index) => (
              <motion.div
                key={session.id}
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
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getTypeColor(session.type)}`}>
                          {session.type}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 font-mono">
                        {session.code}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                      <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                        <FaClock className="text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-500">Time</p>
                        <p className="font-semibold">{session.time}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                      <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                        <FaUser className="text-purple-600 dark:text-purple-400" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-500">Instructor</p>
                        <p className="font-semibold">{session.instructor}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                      <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                        <FaMapMarkerAlt className="text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-500">Location</p>
                        <p className="font-semibold">{session.location}</p>
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
                No Classes Today
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Enjoy your day off!
              </p>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentSchedule;

