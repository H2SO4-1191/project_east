import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  FaArrowLeft, 
  FaBook, 
  FaUser, 
  FaClock,
  FaCheckCircle,
  FaHourglassHalf,
  FaMoon,
  FaSun,
  FaChartLine
} from 'react-icons/fa';
import { useTheme } from '../../context/ThemeContext';
import { useInstitute } from '../../context/InstituteContext';

const StudentCourses = () => {
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();
  const { instituteData } = useInstitute();

  // Demo courses data
  const [courses] = useState([
    {
      id: 1,
      title: 'Introduction to Programming',
      code: 'CS101',
      instructor: 'Dr. Sarah Khan',
      credits: 3,
      progress: 75,
      grade: 'A',
      status: 'In Progress',
      nextClass: 'Monday, 09:00 AM',
      assignments: {
        completed: 8,
        total: 10,
      },
    },
    {
      id: 2,
      title: 'Calculus I',
      code: 'MATH101',
      instructor: 'Prof. Karim Saleh',
      credits: 4,
      progress: 60,
      grade: 'B+',
      status: 'In Progress',
      nextClass: 'Monday, 02:00 PM',
      assignments: {
        completed: 5,
        total: 8,
      },
    },
    {
      id: 3,
      title: 'Data Structures',
      code: 'CS201',
      instructor: 'Dr. Sarah Khan',
      credits: 3,
      progress: 45,
      grade: 'A-',
      status: 'In Progress',
      nextClass: 'Tuesday, 10:00 AM',
      assignments: {
        completed: 4,
        total: 10,
      },
    },
    {
      id: 4,
      title: 'English Composition',
      code: 'ENG101',
      instructor: 'Prof. Ahmed Ali',
      credits: 3,
      progress: 80,
      grade: 'A',
      status: 'In Progress',
      nextClass: 'Wednesday, 01:00 PM',
      assignments: {
        completed: 7,
        total: 8,
      },
    },
    {
      id: 5,
      title: 'Physics I',
      code: 'PHY101',
      instructor: 'Dr. Omar Hassan',
      credits: 4,
      progress: 50,
      grade: 'B',
      status: 'In Progress',
      nextClass: 'Thursday, 03:00 PM',
      assignments: {
        completed: 4,
        total: 9,
      },
    },
  ]);

  const totalCredits = courses.reduce((sum, course) => sum + course.credits, 0);
  const averageProgress = Math.round(
    courses.reduce((sum, course) => sum + course.progress, 0) / courses.length
  );

  const getGradeColor = (grade) => {
    if (grade.startsWith('A')) return 'text-green-600 dark:text-green-400';
    if (grade.startsWith('B')) return 'text-blue-600 dark:text-blue-400';
    if (grade.startsWith('C')) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-gray-600 dark:text-gray-400';
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
          className="bg-gradient-to-r from-teal-600 to-cyan-500 text-white rounded-xl p-8 mb-8 shadow-lg"
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold mb-2">
                Hello, {instituteData.firstName || instituteData.username || 'Student'}!
              </h2>
              <p className="text-white/90">You're enrolled in {courses.length} courses this semester</p>
            </div>
            <div className="hidden md:block">
              <div className="text-right">
                <p className="text-white/80 text-sm">Total Credits</p>
                <p className="text-4xl font-bold">{totalCredits}</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats Cards */}
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
                <p className="text-sm text-gray-600 dark:text-gray-400">Enrolled Courses</p>
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
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                <FaChartLine className="text-2xl text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Average Progress</p>
                <p className="text-2xl font-bold text-gray-800 dark:text-white">{averageProgress}%</p>
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
                <FaCheckCircle className="text-2xl text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Credits</p>
                <p className="text-2xl font-bold text-gray-800 dark:text-white">{totalCredits}</p>
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
                        <FaUser />
                        <span>{course.instructor}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <FaClock />
                        <span>{course.nextClass}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-3xl font-bold ${getGradeColor(course.grade)}`}>
                      {course.grade}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500">Current Grade</p>
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
                      className="h-full bg-gradient-to-r from-primary-600 to-teal-500 rounded-full"
                    />
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-200 dark:border-navy-700">
                  <div className="text-center">
                    <p className="text-xs text-gray-500 dark:text-gray-500 mb-1">Credits</p>
                    <p className="text-lg font-bold text-gray-800 dark:text-white">{course.credits}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-500 dark:text-gray-500 mb-1">Status</p>
                    <div className="flex items-center justify-center gap-1">
                      <FaHourglassHalf className="text-yellow-500" />
                      <p className="text-sm font-semibold text-gray-800 dark:text-white">
                        {course.status}
                      </p>
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-500 dark:text-gray-500 mb-1">Assignments</p>
                    <p className="text-lg font-bold text-gray-800 dark:text-white">
                      {course.assignments.completed}/{course.assignments.total}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-500 dark:text-gray-500 mb-1">Completion</p>
                    <p className="text-lg font-bold text-green-600 dark:text-green-400">
                      {Math.round((course.assignments.completed / course.assignments.total) * 100)}%
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

export default StudentCourses;

