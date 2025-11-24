import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
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
  FaClipboardList
} from 'react-icons/fa';
import { useTheme } from '../../context/ThemeContext';
import { useInstitute } from '../../context/InstituteContext';

const LecturerCourses = () => {
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();
  const { instituteData } = useInstitute();

  // Demo courses data for lecturer
  const [courses] = useState([
    {
      id: 1,
      title: 'Introduction to Programming',
      code: 'CS101',
      institution: 'Baghdad International Academy',
      students: 45,
      duration: '12 weeks',
      progress: 65,
      status: 'In Progress',
      nextClass: 'Monday, 09:00 AM',
      completedLectures: 13,
      totalLectures: 20,
      assignments: {
        pending: 3,
        graded: 8,
        total: 11,
      },
      attendance: 92,
    },
    {
      id: 2,
      title: 'Data Structures',
      code: 'CS201',
      institution: 'Baghdad International Academy',
      students: 38,
      duration: '14 weeks',
      progress: 50,
      status: 'In Progress',
      nextClass: 'Tuesday, 10:00 AM',
      completedLectures: 10,
      totalLectures: 20,
      assignments: {
        pending: 5,
        graded: 6,
        total: 11,
      },
      attendance: 88,
    },
    {
      id: 3,
      title: 'Advanced Algorithms',
      code: 'CS301',
      institution: 'Baghdad International Academy',
      students: 28,
      duration: '16 weeks',
      progress: 40,
      status: 'In Progress',
      nextClass: 'Monday, 02:00 PM',
      completedLectures: 8,
      totalLectures: 20,
      assignments: {
        pending: 4,
        graded: 5,
        total: 9,
      },
      attendance: 95,
    },
    {
      id: 4,
      title: 'Machine Learning Fundamentals',
      code: 'CS401',
      institution: 'Baghdad International Academy',
      students: 32,
      duration: '15 weeks',
      progress: 35,
      status: 'In Progress',
      nextClass: 'Wednesday, 01:00 PM',
      completedLectures: 7,
      totalLectures: 20,
      assignments: {
        pending: 6,
        graded: 4,
        total: 10,
      },
      attendance: 90,
    },
  ]);

  const totalStudents = courses.reduce((sum, course) => sum + course.students, 0);
  const averageProgress = Math.round(
    courses.reduce((sum, course) => sum + course.progress, 0) / courses.length
  );
  const totalPendingAssignments = courses.reduce((sum, course) => sum + course.assignments.pending, 0);
  const averageAttendance = Math.round(
    courses.reduce((sum, course) => sum + course.attendance, 0) / courses.length
  );

  const getAttendanceColor = (attendance) => {
    if (attendance >= 90) return 'text-green-600 dark:text-green-400';
    if (attendance >= 80) return 'text-blue-600 dark:text-blue-400';
    if (attendance >= 70) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
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
              <h1 className="text-xl font-bold text-gray-800 dark:text-white">Current Courses</h1>
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
          className="bg-gradient-to-r from-pink-600 to-purple-500 text-white rounded-xl p-8 mb-8 shadow-lg"
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold mb-2">
                Hello, {instituteData.firstName || instituteData.username || 'Lecturer'}!
              </h2>
              <p className="text-white/90 mb-3">You're teaching {courses.length} courses this semester</p>
              <div className="flex items-center gap-2 bg-white/10 rounded-lg px-4 py-2 w-fit">
                <FaUniversity className="text-lg" />
                <span className="font-medium">{instituteData.institution || 'Baghdad International Academy'}</span>
              </div>
            </div>
            <div className="hidden md:block">
              <div className="text-right">
                <p className="text-white/80 text-sm">Total Students</p>
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
                <p className="text-sm text-gray-600 dark:text-gray-400">Teaching</p>
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
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Students</p>
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
              <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center">
                <FaClipboardList className="text-2xl text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Pending Grading</p>
                <p className="text-2xl font-bold text-gray-800 dark:text-white">{totalPendingAssignments}</p>
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
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                <FaCheckCircle className="text-2xl text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Avg. Attendance</p>
                <p className="text-2xl font-bold text-gray-800 dark:text-white">{averageAttendance}%</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Course Cards */}
        <div className="space-y-6">
          {courses.map((course, index) => (
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
                      <h3 className="text-xl font-bold text-gray-800 dark:text-white">
                        {course.title}
                      </h3>
                      <span className="px-3 py-1 bg-gray-100 dark:bg-navy-700 text-gray-600 dark:text-gray-400 rounded-full text-xs font-semibold">
                        {course.code}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex items-center gap-2">
                        <FaUsers />
                        <span>{course.students} students</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <FaClock />
                        <span>{course.nextClass}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-2xl font-bold ${getAttendanceColor(course.attendance)}`}>
                      {course.attendance}%
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500">Attendance</p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Course Progress
                    </span>
                    <span className="text-sm font-bold text-primary-600 dark:text-teal-400">
                      {course.progress}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-navy-700 rounded-full h-3 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${course.progress}%` }}
                      transition={{ duration: 1, delay: index * 0.1 }}
                      className="h-full bg-gradient-to-r from-purple-600 to-pink-500 rounded-full"
                    />
                  </div>
                  <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                    Lectures: {course.completedLectures}/{course.totalLectures} completed
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-200 dark:border-navy-700">
                  <div className="text-center">
                    <p className="text-xs text-gray-500 dark:text-gray-500 mb-1">Duration</p>
                    <p className="text-sm font-bold text-gray-800 dark:text-white">{course.duration}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-500 dark:text-gray-500 mb-1">Pending</p>
                    <p className="text-lg font-bold text-amber-600 dark:text-amber-400">
                      {course.assignments.pending}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-500 dark:text-gray-500 mb-1">Graded</p>
                    <p className="text-lg font-bold text-green-600 dark:text-green-400">
                      {course.assignments.graded}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-500 dark:text-gray-500 mb-1">Total Assignments</p>
                    <p className="text-sm font-bold text-gray-800 dark:text-white">
                      {course.assignments.total}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LecturerCourses;

