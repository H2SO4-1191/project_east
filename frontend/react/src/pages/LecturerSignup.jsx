import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { FaArrowLeft, FaChalkboardTeacher, FaMoon, FaSun } from 'react-icons/fa';
import AnimatedBackground from '../components/AnimatedBackground';
import AnimatedButton from '../components/AnimatedButton';
import Card from '../components/Card';
import { useTheme } from '../context/ThemeContext';
import LanguageSwitcher from '../components/LanguageSwitcher';
import toast from 'react-hot-toast';
import { authService } from '../services/authService';

const initialState = {
  username: '',
  email: '',
  first_name: '',
  last_name: '',
};

const LecturerSignup = () => {
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [formValues, setFormValues] = useState(initialState);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const buttonLabel = useMemo(
    () => (isLoading ? t('signup.creatingAccount') : t('signup.createLecturerAccount')),
    [isLoading, t]
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
      nextErrors.username = t('signup.usernameRequired');
    }

    if (!formValues.email.trim()) {
      nextErrors.email = t('signup.emailRequired');
    } else if (!/\S+@\S+\.\S+/.test(formValues.email.trim())) {
      nextErrors.email = t('signup.emailInvalid');
    }

    if (!formValues.first_name.trim()) {
      nextErrors.first_name = t('signup.firstNameRequired');
    }

    if (!formValues.last_name.trim()) {
      nextErrors.last_name = t('signup.lastNameRequired');
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
      user_type: 'lecturer',
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
      const message = t('signup.createError');
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
          {/* Language Switcher */}
          <div className="fixed top-6 right-6 rtl:left-6 rtl:right-auto z-50">
            <LanguageSwitcher />
          </div>

          {/* Theme Toggle */}
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={toggleTheme}
            className="fixed top-6 right-20 rtl:left-20 rtl:right-auto p-3 bg-white/80 dark:bg-navy-800/80 backdrop-blur-sm rounded-full shadow-lg hover:shadow-xl transition-all z-50"
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
            {t('common.back')}
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
              <div className="w-24 h-24 bg-gradient-to-br from-purple-600 to-pink-500 rounded-3xl mx-auto flex items-center justify-center shadow-2xl">
                <FaChalkboardTeacher className="text-white text-5xl" />
              </div>
            </motion.div>
            <motion.h1
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-4xl font-bold text-gray-800 dark:text-white mb-2"
            >
              {t('signup.lecturerTitle')}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-gray-600 dark:text-gray-300 max-w-xl mx-auto"
            >
              {t('signup.lecturerSubtitle')}
            </motion.p>
          </motion.div>

          <Card delay={0.4}>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
                    {t('signup.firstName')}
                  </label>
                  <motion.input
                    whileFocus={{ scale: 1.01 }}
                    type="text"
                    name="first_name"
                    value={formValues.first_name}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-navy-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all bg-white dark:bg-navy-700 text-gray-900 dark:text-white"
                    placeholder={t('signup.firstNamePlaceholder')}
                    autoComplete="given-name"
                  />
                  {errors.first_name && (
                    <p className="mt-2 text-sm text-red-500">{errors.first_name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
                    {t('signup.lastName')}
                  </label>
                  <motion.input
                    whileFocus={{ scale: 1.01 }}
                    type="text"
                    name="last_name"
                    value={formValues.last_name}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-navy-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all bg-white dark:bg-navy-700 text-gray-900 dark:text-white"
                    placeholder={t('signup.lastNamePlaceholder')}
                    autoComplete="family-name"
                  />
                  {errors.last_name && (
                    <p className="mt-2 text-sm text-red-500">{errors.last_name}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
                  {t('signup.username')}
                </label>
                <motion.input
                  whileFocus={{ scale: 1.01 }}
                  type="text"
                  name="username"
                  value={formValues.username}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-navy-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all bg-white dark:bg-navy-700 text-gray-900 dark:text-white"
                  placeholder={t('signup.usernamePlaceholder')}
                  autoComplete="username"
                />
                {errors.username && (
                  <p className="mt-2 text-sm text-red-500">{errors.username}</p>
                )}
              </div>

              <div>
                <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
                  {t('login.emailLabel')}
                </label>
                <motion.input
                  whileFocus={{ scale: 1.01 }}
                  type="email"
                  name="email"
                  value={formValues.email}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-navy-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all bg-white dark:bg-navy-700 text-gray-900 dark:text-white"
                  placeholder={t('signup.emailPlaceholder')}
                  autoComplete="email"
                />
                {errors.email && <p className="mt-2 text-sm text-red-500">{errors.email}</p>}
              </div>

              <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-400 px-4 py-3 rounded-lg text-sm">
                <strong>{t('signup.accountType')}</strong> {t('home.lecturer')} ({t('signup.accountTypeInstitution').split('(')[1] || 'auto-selected'})
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
                {t('signup.alreadyHaveAccount')}{' '}
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-semibold transition-colors"
                >
                  {t('signup.goToLogin')}
                </button>
              </p>
            </form>
          </Card>
        </div>
      </div>
    </AnimatedBackground>
  );
};

export default LecturerSignup;

