import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useInstitute } from '../context/InstituteContext';
import { useTranslation } from 'react-i18next';

const Home = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setInstituteData } = useInstitute();
  const { t } = useTranslation();
  const [showSignInOptions, setShowSignInOptions] = useState(false);
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);
  
  // Check if navigation state has showSignUp flag
  useEffect(() => {
    if (location.state?.showSignUp) {
      setShowSignInOptions(true);
    }
  }, [location.state]);
  const [formData, setFormData] = useState({
    instituteName: '',
    email: '',
    password: '',
  });

  const handleSignInClick = () => {
    setShowSignInOptions(true);
  };

  const handleInstitutionClick = () => {
    setShowSignInOptions(false);
    setShowRegistrationForm(true);
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleRegistrationSubmit = (e) => {
    e.preventDefault();
    if (formData.instituteName && formData.email && formData.password) {
      setInstituteData({
        name: formData.instituteName,
        email: formData.email,
      });
      navigate('/dashboard');
    }
  };

  const handleBack = () => {
    setShowSignInOptions(false);
    setShowRegistrationForm(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-100 dark:from-navy-900 dark:via-navy-800 dark:to-navy-900 flex items-center justify-center p-4 relative">
      <div className="w-full max-w-md">
        {/* Logo and Title */}
        <div className="text-center mb-12 animate-fade-in">
          <div className="mb-4">
            <div className="w-20 h-20 bg-primary-600 rounded-2xl mx-auto flex items-center justify-center shadow-lg">
              <span className="text-white text-4xl font-bold">PE</span>
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-2">{t('home.title') || 'Project East'}</h1>
          <p className="text-gray-600 dark:text-gray-400">{t('home.subtitle') || 'Educational Institute Management System'}</p>
        </div>

        {/* Main Content Card */}
        <div className="card bg-white dark:bg-navy-800 p-6 rounded-2xl shadow-xl border border-gray-200 dark:border-navy-700">
          {!showSignInOptions && !showRegistrationForm && (
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold text-center text-gray-800 dark:text-white mb-6">
                {t('home.welcomeBack') || 'Welcome Back'}
              </h2>
              <button
                onClick={() => navigate('/login')}
                className="btn-primary w-full bg-primary-600 hover:bg-primary-500 text-white py-3 rounded-lg font-semibold transition-colors"
              >
                {t('nav.login') || 'Login'}
              </button>
              <button
                onClick={handleSignInClick}
                className="btn-secondary w-full border-2 border-primary-600 dark:border-teal-400 text-primary-600 dark:text-teal-400 py-3 rounded-lg font-semibold hover:bg-primary-50 dark:hover:bg-navy-700 transition-colors"
              >
                {t('nav.signUp') || 'Sign Up'}
              </button>
            </div>
          )}

          {showSignInOptions && !showRegistrationForm && (
            <div className="space-y-4">
              <div className="flex items-center mb-6">
                <button
                  onClick={handleBack}
                  className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <h2 className="text-2xl font-semibold text-gray-800 dark:text-white ml-4">
                  {t('home.chooseAccountType') || 'Choose Account Type'}
                </h2>
              </div>
              
              <button
                onClick={() => navigate('/signup/student')}
                className="btn-primary w-full flex items-center justify-center gap-3 bg-primary-600 hover:bg-primary-500 text-white py-3 rounded-lg font-semibold transition-colors"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z"/>
                </svg>
                {t('home.student') || 'Student'}
              </button>
              <button
                onClick={() => navigate('/signup/lecturer')}
                className="btn-primary w-full flex items-center justify-center gap-3 bg-primary-600 hover:bg-primary-500 text-white py-3 rounded-lg font-semibold transition-colors"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd"/>
                  <path d="M2 13.692V16a2 2 0 002 2h12a2 2 0 002-2v-2.308A24.974 24.974 0 0110 15c-2.796 0-5.487-.46-8-1.308z"/>
                </svg>
                {t('home.lecturer') || 'Lecturer'}
              </button>
              <button
                onClick={handleInstitutionClick}
                className="btn-primary w-full flex items-center justify-center gap-3 bg-primary-600 hover:bg-primary-500 text-white py-3 rounded-lg font-semibold transition-colors"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clipRule="evenodd"/>
                </svg>
                {t('home.institution') || 'Institution'}
              </button>
            </div>
          )}

          {showRegistrationForm && (
            <div>
              <div className="flex items-center mb-6">
                <button
                  onClick={handleBack}
                  className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <h2 className="text-2xl font-semibold text-gray-800 dark:text-white ml-4">Institution Registration</h2>
              </div>

              <form onSubmit={handleRegistrationSubmit} className="space-y-4">
                <div>
                  <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
                    Institute Name
                  </label>
                  <input
                    type="text"
                    name="instituteName"
                    value={formData.instituteName}
                    onChange={handleInputChange}
                    className="input-field w-full px-4 py-3 border border-gray-300 dark:border-navy-600 rounded-lg bg-white dark:bg-navy-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Enter institute name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="input-field w-full px-4 py-3 border border-gray-300 dark:border-navy-600 rounded-lg bg-white dark:bg-navy-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Enter email address"
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
                    placeholder="Enter password"
                    required
                  />
                </div>

                <button type="submit" className="btn-primary w-full mt-6 bg-primary-600 hover:bg-primary-500 text-white py-3 rounded-lg font-semibold transition-colors">
                  Register Institute
                </button>
              </form>
            </div>
          )}
        </div>

        <p className="text-center text-gray-600 dark:text-gray-400 text-sm mt-6">
          © 2025 Project East. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default Home;
