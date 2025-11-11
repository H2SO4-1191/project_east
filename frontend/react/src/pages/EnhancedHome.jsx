import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaMoon, FaSun, FaUniversity, FaChalkboardTeacher, FaGraduationCap } from 'react-icons/fa';
import { useTheme } from '../context/ThemeContext';
import AnimatedBackground from '../components/AnimatedBackground';
import AnimatedButton from '../components/AnimatedButton';
import Card from '../components/Card';

const EnhancedHome = () => {
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();
  const [showAccountSelection, setShowAccountSelection] = useState(false);

  return (
    <AnimatedBackground>
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-4xl">
          {/* Theme Toggle */}
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={toggleTheme}
            className="fixed top-6 right-6 p-3 bg-white/80 dark:bg-navy-800/80 backdrop-blur-sm rounded-full shadow-lg hover:shadow-xl transition-all z-50"
            whileHover={{ scale: 1.1, rotate: 180 }}
            whileTap={{ scale: 0.9 }}
          >
            {isDark ? (
              <FaSun className="w-6 h-6 text-gold-500" />
            ) : (
              <FaMoon className="w-6 h-6 text-navy-700" />
            )}
          </motion.button>

          {/* Logo and Title */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <motion.div
              className="mb-6"
              whileHover={{ scale: 1.05, rotate: 5 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <div className="w-24 h-24 bg-gradient-to-br from-primary-600 to-teal-500 rounded-3xl mx-auto flex items-center justify-center shadow-2xl">
                <span className="text-white text-5xl font-bold">PE</span>
              </div>
            </motion.div>
            <motion.h1
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-5xl font-bold bg-gradient-to-r from-primary-600 to-teal-600 dark:from-primary-400 dark:to-teal-400 bg-clip-text text-transparent mb-3"
            >
              Project East
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-gray-600 dark:text-gray-300 text-lg"
            >
              Educational Institute Management System
            </motion.p>
          </motion.div>

          {/* Main Content Card */}
          <Card className="max-w-2xl mx-auto" delay={0.4}>
            {!showAccountSelection && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-8"
              >
                <div className="text-center space-y-4">
                  <h2 className="text-3xl font-semibold text-gray-800 dark:text-white">
                    Welcome Back
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    Access your account or create a new institution profile.
                  </p>
                </div>
                <div className="space-y-4">
                  <AnimatedButton
                    onClick={() => navigate('/login')}
                    className="w-full text-lg py-4"
                  >
                    Login
                  </AnimatedButton>
                  <AnimatedButton
                    onClick={() => setShowAccountSelection(true)}
                    variant="secondary"
                    className="w-full text-lg py-4"
                  >
                    Sign Up
                  </AnimatedButton>
                </div>
              </motion.div>
            )}

            {showAccountSelection && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between">
                  <motion.button
                    whileHover={{ x: -5 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setShowAccountSelection(false)}
                    className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors flex items-center gap-2"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Back
                  </motion.button>
                  <h2 className="text-2xl font-semibold text-gray-800 dark:text-white">
                    Choose Account Type
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <motion.button
                    whileHover={{ y: -6, scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => navigate('/signup')}
                    className="p-6 rounded-xl border-2 border-gray-200 dark:border-navy-700 hover:border-primary-400 dark:hover:border-primary-500 transition-all bg-white dark:bg-navy-800 text-left"
                  >
                    <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center mb-4">
                      <FaUniversity className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-2">
                      Institution
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Full access to manage students, staff, schedules, and finances.
                    </p>
                  </motion.button>

                  <div className="relative p-6 rounded-xl border-2 border-dashed border-gray-300 dark:border-navy-700 bg-gray-50 dark:bg-navy-900 text-left opacity-60 cursor-not-allowed">
                    <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl flex items-center justify-center mb-4">
                      <FaChalkboardTeacher className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-2">
                      Teacher
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Manage classes and assignments. <span className="font-semibold">Coming soon.</span>
                    </p>
                    <span className="absolute top-3 right-3 px-2 py-1 bg-gray-500 text-white text-xs rounded-full">
                      Coming Soon
                    </span>
                  </div>

                  <div className="relative p-6 rounded-xl border-2 border-dashed border-gray-300 dark:border-navy-700 bg-gray-50 dark:bg-navy-900 text-left opacity-60 cursor-not-allowed">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-4">
                      <FaGraduationCap className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-2">
                      Student
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Access courses, grades, and schedules. <span className="font-semibold">Coming soon.</span>
                    </p>
                    <span className="absolute top-3 right-3 px-2 py-1 bg-gray-500 text-white text-xs rounded-full">
                      Coming Soon
                    </span>
                  </div>
                </div>
              </motion.div>
            )}
          </Card>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-center text-gray-600 dark:text-gray-400 text-sm mt-6"
          >
            © 2025 Project East. All rights reserved.
          </motion.p>
        </div>
      </div>
    </AnimatedBackground>
  );
};

export default EnhancedHome;

