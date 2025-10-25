import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaGraduationCap, FaChalkboardTeacher, FaUniversity, FaMoon, FaSun } from 'react-icons/fa';
import { useInstitute } from '../context/InstituteContext';
import { useTheme } from '../context/ThemeContext';
import AnimatedBackground from '../components/AnimatedBackground';
import AnimatedButton from '../components/AnimatedButton';
import Card from '../components/Card';
import PaymentModal from '../components/PaymentModal';

const EnhancedHome = () => {
  const navigate = useNavigate();
  const { updateInstituteData } = useInstitute();
  const { isDark, toggleTheme } = useTheme();
  const [showSignInOptions, setShowSignInOptions] = useState(false);
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [formData, setFormData] = useState({
    instituteName: '',
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState({});

  const accountTypes = [
    {
      id: 'student',
      title: 'Student',
      description: 'Access courses, grades, and schedule',
      icon: FaGraduationCap,
      color: 'from-blue-500 to-blue-600',
      disabled: true,
    },
    {
      id: 'teacher',
      title: 'Teacher',
      description: 'Manage classes, students, and assignments',
      icon: FaChalkboardTeacher,
      color: 'from-teal-500 to-teal-600',
      disabled: true,
    },
    {
      id: 'institution',
      title: 'Institution',
      description: 'Complete institute management system',
      icon: FaUniversity,
      color: 'from-primary-500 to-primary-600',
      disabled: false,
    },
  ];

  const handleSignInClick = () => {
    setShowSignInOptions(true);
  };

  const handleAccountTypeClick = (type) => {
    if (type === 'institution') {
      setShowSignInOptions(false);
      setShowRegistrationForm(true);
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    // Clear error for this field
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: '' });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.instituteName.trim()) {
      newErrors.instituteName = 'Institute name is required';
    }
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    if (!formData.password.trim()) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegistrationSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      setShowPaymentModal(true);
    }
  };

  const handlePaymentSuccess = (paymentData) => {
    updateInstituteData({
      name: formData.instituteName,
      email: formData.email,
      ...paymentData,
      registrationDate: new Date().toISOString(),
    });
    setShowPaymentModal(false);
    navigate('/dashboard');
  };

  const handleBack = () => {
    setShowSignInOptions(false);
    setShowRegistrationForm(false);
    setErrors({});
  };

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
            {!showSignInOptions && !showRegistrationForm && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                <h2 className="text-3xl font-semibold text-center text-gray-800 dark:text-white mb-8">
                  Welcome Back
                </h2>
                <div className="space-y-4">
                  <AnimatedButton
                    onClick={() => navigate('/login')}
                    className="w-full text-lg py-4"
                  >
                    Login
                  </AnimatedButton>
                  <AnimatedButton
                    onClick={handleSignInClick}
                    variant="secondary"
                    className="w-full text-lg py-4"
                  >
                    Sign In
                  </AnimatedButton>
                </div>
              </motion.div>
            )}

            {showSignInOptions && !showRegistrationForm && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <div className="flex items-center mb-8">
                  <motion.button
                    whileHover={{ x: -5 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={handleBack}
                    className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </motion.button>
                  <h2 className="text-2xl font-semibold text-gray-800 dark:text-white ml-4">
                    Select Account Type
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {accountTypes.map((type, index) => (
                    <motion.div
                      key={type.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={!type.disabled ? { y: -8, scale: 1.02 } : {}}
                      onClick={() => !type.disabled && handleAccountTypeClick(type.id)}
                      className={`
                        relative p-6 rounded-xl border-2 transition-all
                        ${type.disabled
                          ? 'border-gray-200 dark:border-navy-700 opacity-50 cursor-not-allowed bg-gray-50 dark:bg-navy-900'
                          : 'border-gray-200 dark:border-navy-700 hover:border-primary-400 dark:hover:border-primary-500 cursor-pointer bg-white dark:bg-navy-800'
                        }
                      `}
                    >
                      {type.disabled && (
                        <div className="absolute top-2 right-2 px-2 py-1 bg-gray-500 text-white text-xs rounded-full">
                          Coming Soon
                        </div>
                      )}
                      <div className={`w-16 h-16 bg-gradient-to-br ${type.color} rounded-xl flex items-center justify-center mb-4 mx-auto`}>
                        <type.icon className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="text-lg font-bold text-gray-800 dark:text-white text-center mb-2">
                        {type.title}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                        {type.description}
                      </p>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {showRegistrationForm && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <div className="flex items-center mb-8">
                  <motion.button
                    whileHover={{ x: -5 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={handleBack}
                    className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </motion.button>
                  <h2 className="text-2xl font-semibold text-gray-800 dark:text-white ml-4">
                    Institution Registration
                  </h2>
                </div>

                <form onSubmit={handleRegistrationSubmit} className="space-y-6">
                  <div>
                    <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
                      Institute Name *
                    </label>
                    <motion.input
                      whileFocus={{ scale: 1.01 }}
                      type="text"
                      name="instituteName"
                      value={formData.instituteName}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border ${
                        errors.instituteName ? 'border-red-500' : 'border-gray-300 dark:border-navy-600'
                      } rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all bg-white dark:bg-navy-700 text-gray-900 dark:text-white`}
                      placeholder="Enter institute name"
                    />
                    {errors.instituteName && (
                      <motion.p
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-red-500 text-sm mt-1"
                      >
                        {errors.instituteName}
                      </motion.p>
                    )}
                  </div>

                  <div>
                    <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
                      Email *
                    </label>
                    <motion.input
                      whileFocus={{ scale: 1.01 }}
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border ${
                        errors.email ? 'border-red-500' : 'border-gray-300 dark:border-navy-600'
                      } rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all bg-white dark:bg-navy-700 text-gray-900 dark:text-white`}
                      placeholder="Enter email address"
                    />
                    {errors.email && (
                      <motion.p
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-red-500 text-sm mt-1"
                      >
                        {errors.email}
                      </motion.p>
                    )}
                  </div>

                  <div>
                    <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
                      Password *
                    </label>
                    <motion.input
                      whileFocus={{ scale: 1.01 }}
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border ${
                        errors.password ? 'border-red-500' : 'border-gray-300 dark:border-navy-600'
                      } rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all bg-white dark:bg-navy-700 text-gray-900 dark:text-white`}
                      placeholder="Enter password"
                    />
                    {errors.password && (
                      <motion.p
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-red-500 text-sm mt-1"
                      >
                        {errors.password}
                      </motion.p>
                    )}
                  </div>

                  <AnimatedButton type="submit" className="w-full text-lg py-4">
                    Continue to Payment
                  </AnimatedButton>
                </form>
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

      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onSuccess={handlePaymentSuccess}
        formData={formData}
      />
    </AnimatedBackground>
  );
};

export default EnhancedHome;

