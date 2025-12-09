import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaMoon, FaSun } from 'react-icons/fa';
import { useInstitute } from '../context/InstituteContext';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../components/LanguageSwitcher';

const Login = () => {
  const navigate = useNavigate();
  const { setInstituteData } = useInstitute();
  const { isDark, toggleTheme } = useTheme();
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Hardcoded demo credentials
    if (formData.email === 'demo@east.edu' && formData.password === '12345') {
      setInstituteData({
        name: 'Baghdad Technical University',
        email: 'demo@east.edu',
      });
      navigate('/dashboard');
    } else {
      setError('Invalid credentials. Use demo@east.edu / 12345');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-100 dark:from-navy-900 dark:via-navy-800 dark:to-navy-900 flex items-center justify-center p-4 relative">
      {/* Theme Toggle & Language Switcher - Fixed Position */}
      <div className="fixed top-4 right-4 flex flex-col items-end gap-3 z-50">
        {/* Theme Toggle */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={toggleTheme}
          className="p-3 rounded-lg bg-white dark:bg-navy-700 shadow-md hover:shadow-lg transition-all border border-gray-200 dark:border-navy-600"
          title={isDark ? t('lightMode') || 'Light Mode' : t('darkMode') || 'Dark Mode'}
        >
          {isDark ? (
            <FaSun className="w-5 h-5 text-yellow-400" />
          ) : (
            <FaMoon className="w-5 h-5 text-gray-600" />
          )}
        </motion.button>

        {/* Language Switcher */}
        <LanguageSwitcher />
      </div>

      <div className="w-full max-w-md">
        {/* Logo and Title */}
        <div className="text-center mb-12">
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center text-primary-600 dark:text-teal-400 hover:text-primary-700 dark:hover:text-teal-300 mb-6 transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            {t('login.backToHome') || 'Back to Home'}
          </button>
          <div className="mb-4">
            <div className="w-20 h-20 bg-primary-600 rounded-2xl mx-auto flex items-center justify-center shadow-lg">
              <span className="text-white text-4xl font-bold">PE</span>
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-2">{t('login.title') || 'Welcome Back'}</h1>
          <p className="text-gray-600 dark:text-gray-400">{t('login.subtitle') || 'Login to your institution account'}</p>
        </div>

        {/* Login Form Card */}
        <div className="card bg-white dark:bg-navy-800 p-6 rounded-2xl shadow-xl border border-gray-200 dark:border-navy-700">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
                {t('login.emailLabel') || 'Email Address'}
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="input-field w-full px-4 py-3 border border-gray-300 dark:border-navy-600 rounded-lg bg-white dark:bg-navy-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder={t('login.emailPlaceholder') || 'Enter your email'}
                required
              />
            </div>

            <div>
              <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
                Password
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className="input-field w-full px-4 py-3 border border-gray-300 dark:border-navy-600 rounded-lg bg-white dark:bg-navy-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Enter your password"
                required
              />
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400 px-4 py-3 rounded-lg text-sm">
              <strong>Demo Credentials:</strong><br />
              Email: demo@east.edu<br />
              Password: 12345
            </div>

            <button type="submit" className="btn-primary w-full bg-primary-600 hover:bg-primary-500 text-white py-3 rounded-lg font-semibold transition-colors">
              {t('nav.login') || 'Login'}
            </button>
          </form>
        </div>

        <p className="text-center text-gray-600 dark:text-gray-400 text-sm mt-6">
          {t('login.noAccount') || "Don't have an account?"}{' '}
          <button
            onClick={() => navigate('/home', { state: { showSignUp: true } })}
            className="text-primary-600 dark:text-teal-400 hover:text-primary-700 dark:hover:text-teal-300 font-semibold"
          >
            {t('login.signUpHere') || 'Sign up here'}
          </button>
        </p>
      </div>
    </div>
  );
};

export default Login;
