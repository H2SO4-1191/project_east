import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaArrowLeft, FaUserGraduate, FaMoon, FaSun } from 'react-icons/fa';
import AnimatedBackground from '../components/AnimatedBackground';
import AnimatedButton from '../components/AnimatedButton';
import Card from '../components/Card';
import { useTheme } from '../context/ThemeContext';
import toast from 'react-hot-toast';
import { authService } from '../services/authService';

const initialState = {
  username: '',
  email: '',
  first_name: '',
  last_name: '',
};

const StudentSignup = () => {
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [formValues, setFormValues] = useState(initialState);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const buttonLabel = useMemo(
    () => (isLoading ? 'Creating Account...' : 'Create Student Account'),
    [isLoading]
  );

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormValues((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
    setFormError('');
  };

  const validate = () => {
    const nextErrors = {};

    if (!formValues.username.trim()) {
      nextErrors.username = 'Username is required';
    }

    if (!formValues.email.trim()) {
      nextErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formValues.email.trim())) {
      nextErrors.email = 'Please enter a valid email address';
    }

    if (!formValues.first_name.trim()) {
      nextErrors.first_name = 'First name is required';
    }

    if (!formValues.last_name.trim()) {
      nextErrors.last_name = 'Last name is required';
    }

    setErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  };

  const mapServerErrors = (data) => {
    if (!data?.errors || typeof data.errors !== 'object') return {};

    return Object.entries(data.errors).reduce((acc, [key, value]) => {
      const message =
        Array.isArray(value) && value.length > 0
          ? value.join(' ')
          : typeof value === 'string'
            ? value
            : 'Invalid value';
      acc[key] = message;
      return acc;
    }, {});
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validate()) {
      return;
    }

    setIsLoading(true);
    setFormError('');

    const payload = {
      ...formValues,
      email: formValues.email.trim(),
      username: formValues.username.trim(),
      first_name: formValues.first_name.trim(),
      last_name: formValues.last_name.trim(),
      user_type: 'student',
    };

    try {
      const result = await authService.signup(payload);
      const message =
        result?.message ||
        'Account created successfully. Please check your email to continue.';

      toast.success(message);
      localStorage.setItem(
        'recentSignup',
        JSON.stringify({
          email: payload.email,
          username: payload.username,
          firstName: payload.first_name,
          lastName: payload.last_name,
          userType: payload.user_type,
        })
      );
      setFormValues(initialState);

      // slight delay for user to read toast
      setTimeout(() => {
        navigate('/login', {
          replace: true,
          state: {
            email: payload.email,
          },
        });
      }, 800);
    } catch (err) {
      console.error('Signup error:', err);

      if (err?.data?.errors) {
        setErrors((prev) => ({ ...prev, ...mapServerErrors(err.data) }));
      }

      if (err?.message) {
        setFormError(err.message);
        toast.error(err.message);
      } else {
        const message =
          'Unable to create the account right now. Please check your connection and try again.';
        setFormError(message);
        toast.error(message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatedBackground>
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-2xl">
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

          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-primary-600 dark:text-teal-400 hover:text-primary-700 dark:hover:text-teal-300 mb-8 transition-colors font-medium"
            whileHover={{ x: -5 }}
          >
            <FaArrowLeft />
            Back
          </motion.button>

          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-10"
          >
            <motion.div
              className="mb-6"
              whileHover={{ scale: 1.05 }}
              transition={{ type: 'spring', stiffness: 250 }}
            >
              <div className="w-24 h-24 bg-gradient-to-br from-blue-600 to-indigo-500 rounded-3xl mx-auto flex items-center justify-center shadow-2xl">
                <FaUserGraduate className="text-white text-5xl" />
              </div>
            </motion.div>
            <motion.h1
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-4xl font-bold text-gray-800 dark:text-white mb-2"
            >
              Student Sign Up
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-gray-600 dark:text-gray-300 max-w-xl mx-auto"
            >
              Create your student account to access courses, schedules, and connect with institutions.
            </motion.p>
          </motion.div>

          <Card delay={0.4}>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
                    First Name
                  </label>
                  <motion.input
                    whileFocus={{ scale: 1.01 }}
                    type="text"
                    name="first_name"
                    value={formValues.first_name}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-navy-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all bg-white dark:bg-navy-700 text-gray-900 dark:text-white"
                    placeholder="Your first name"
                    autoComplete="given-name"
                  />
                  {errors.first_name && (
                    <p className="mt-2 text-sm text-red-500">{errors.first_name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
                    Last Name
                  </label>
                  <motion.input
                    whileFocus={{ scale: 1.01 }}
                    type="text"
                    name="last_name"
                    value={formValues.last_name}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-navy-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all bg-white dark:bg-navy-700 text-gray-900 dark:text-white"
                    placeholder="Your last name"
                    autoComplete="family-name"
                  />
                  {errors.last_name && (
                    <p className="mt-2 text-sm text-red-500">{errors.last_name}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
                  Username
                </label>
                <motion.input
                  whileFocus={{ scale: 1.01 }}
                  type="text"
                  name="username"
                  value={formValues.username}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-navy-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all bg-white dark:bg-navy-700 text-gray-900 dark:text-white"
                  placeholder="e.g. ahmed_hassan"
                  autoComplete="username"
                />
                {errors.username && (
                  <p className="mt-2 text-sm text-red-500">{errors.username}</p>
                )}
              </div>

              <div>
                <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
                  Email Address
                </label>
                <motion.input
                  whileFocus={{ scale: 1.01 }}
                  type="email"
                  name="email"
                  value={formValues.email}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-navy-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all bg-white dark:bg-navy-700 text-gray-900 dark:text-white"
                  placeholder="your.email@example.com"
                  autoComplete="email"
                />
                {errors.email && <p className="mt-2 text-sm text-red-500">{errors.email}</p>}
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400 px-4 py-3 rounded-lg text-sm">
                <strong>Account type:</strong> Student (auto-selected)
              </div>

              {formError && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg text-sm"
                >
                  {formError}
                </motion.div>
              )}

              <AnimatedButton type="submit" className="w-full text-lg py-4" disabled={isLoading}>
                {buttonLabel}
              </AnimatedButton>

              <p className="text-center text-gray-600 dark:text-gray-400 text-sm">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold transition-colors"
                >
                  Go to Login
                </button>
              </p>
            </form>
          </Card>
        </div>
      </div>
    </AnimatedBackground>
  );
};

export default StudentSignup;

