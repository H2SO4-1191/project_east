import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  FaBook, 
  FaTachometerAlt, 
  FaCompass, 
  FaUser, 
  FaMoon, 
  FaSun, 
  FaTimes 
} from 'react-icons/fa';
import { useInstitute } from '../context/InstituteContext';
import { useTheme } from '../context/ThemeContext';
import LanguageSwitcher from './LanguageSwitcher';

const Sidebar = ({ 
  onShowProfileModal, 
  onShowVerificationPopup,
  showBackButton = false,
  onBackClick 
}) => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const { 
    instituteData, 
    isSidebarExpanded, 
    setIsSidebarExpanded,
    isMobileSidebarOpen,
    closeMobileSidebar 
  } = useInstitute();
  const { isDark, toggleTheme } = useTheme();

  const isInstitution = instituteData.userType === 'institution';
  const isLecturer = instituteData.userType === 'lecturer';
  const isStudent = instituteData.userType === 'student';

  const handleCoursesClick = () => {
    if (isStudent && !instituteData.isVerified) {
      if (onShowVerificationPopup) {
        onShowVerificationPopup();
      }
      closeMobileSidebar();
      return;
    }
    if (isStudent) {
      navigate('/student/courses');
    } else if (isLecturer) {
      navigate('/lecturer/courses');
    }
    closeMobileSidebar();
  };

  const handleScheduleClick = () => {
    if (isStudent && !instituteData.isVerified) {
      if (onShowVerificationPopup) {
        onShowVerificationPopup();
      }
      closeMobileSidebar();
      return;
    }
    if (isStudent) {
      navigate('/student/schedule');
    } else if (isLecturer) {
      navigate('/lecturer/schedule');
    }
    closeMobileSidebar();
  };

  const handleProfileClick = () => {
    if (onShowProfileModal) {
      onShowProfileModal();
    }
    closeMobileSidebar();
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <aside 
        className={`hidden lg:block shadow-xl border-r fixed left-0 top-0 bottom-0 overflow-y-auto z-40 transition-all duration-300 ${
          isSidebarExpanded ? 'w-80' : 'w-20'
        } ${
          isLecturer 
            ? 'bg-white dark:bg-navy-800 border-gray-200 dark:border-navy-700 border-l-2 border-l-purple-400/30 dark:border-l-purple-500/20' 
            : 'bg-white dark:bg-navy-800 border-gray-200 dark:border-navy-700'
        }`}
        onMouseEnter={() => setIsSidebarExpanded(true)}
        onMouseLeave={() => setIsSidebarExpanded(false)}
      >
        <div className="p-6 flex flex-col h-full">
          <div className="flex-1">
            <h2 className={`text-xl font-bold text-gray-800 dark:text-white mb-6 transition-opacity duration-300 ${
              isSidebarExpanded ? 'opacity-100' : 'opacity-0'
            }`}>
              {instituteData.isAuthenticated ? t('feed.explore') : t('feed.welcome')}
            </h2>
            
            {/* Back Button */}
            {showBackButton && onBackClick && isSidebarExpanded && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onBackClick}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-navy-700 mb-6 cursor-pointer"
              >
                <FaTimes className="w-5 h-5 flex-shrink-0" />
                <span className="font-medium">{t('common.back')}</span>
              </motion.button>
            )}
            
            {/* Guest Message */}
            {!instituteData.isAuthenticated && isSidebarExpanded && (
              <div className="mb-6 p-4 bg-primary-50 dark:bg-primary-900/20 rounded-lg border border-primary-200 dark:border-primary-800">
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                  {t('feed.loginToSubscribe')}
                </p>
                <div className="flex flex-col gap-2">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => navigate('/login')}
                    className="w-full px-3 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-lg text-sm font-semibold transition-colors"
                  >
                    {t('nav.login')}
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => navigate('/home')}
                    className="w-full px-3 py-2 border border-primary-600 dark:border-teal-400 text-primary-600 dark:text-teal-400 rounded-lg text-sm font-semibold hover:bg-primary-50 dark:hover:bg-navy-700 transition-colors"
                  >
                    {t('nav.signUp')}
                  </motion.button>
                </div>
              </div>
            )}

            {/* Sidebar Navigation Buttons - Role Based */}
            {instituteData.isAuthenticated && (
              <div className="space-y-2 mb-6">
                {/* My Courses - Student & Lecturer Only */}
                {(isStudent || isLecturer) && (
                  <button
                    onClick={handleCoursesClick}
                    className={`w-full flex items-center ${isSidebarExpanded ? 'gap-3' : 'justify-center'} px-4 py-3 rounded-lg transition-all text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-navy-700 ${
                      isStudent && !instituteData.isVerified ? 'opacity-60 cursor-not-allowed' : ''
                    }`}
                    title={isStudent && !instituteData.isVerified ? t('nav.verificationRequired') || 'Verification Required' : t('nav.currentCourses')}
                  >
                    <FaBook className="w-5 h-5 flex-shrink-0" />
                    {isSidebarExpanded && <span className="font-medium">{t('nav.currentCourses')}</span>}
                  </button>
                )}
                
                {/* Schedule - Student & Lecturer Only */}
                {(isStudent || isLecturer) && (
                  <button
                    onClick={handleScheduleClick}
                    className={`w-full flex items-center ${isSidebarExpanded ? 'gap-3' : 'justify-center'} px-4 py-3 rounded-lg transition-all text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-navy-700 ${
                      isStudent && !instituteData.isVerified ? 'opacity-60 cursor-not-allowed' : ''
                    }`}
                    title={isStudent && !instituteData.isVerified ? t('nav.verificationRequired') || 'Verification Required' : t('nav.schedule')}
                  >
                    <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"/>
                    </svg>
                    {isSidebarExpanded && <span className="font-medium">{t('nav.schedule')}</span>}
                  </button>
                )}
                
                {/* Dashboard - Institution Only */}
                {isInstitution && (
                  <button
                    onClick={() => navigate('/dashboard')}
                    className={`w-full flex items-center ${isSidebarExpanded ? 'gap-3' : 'justify-center'} px-4 py-3 rounded-lg transition-all text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-navy-700`}
                    title={t('nav.dashboard')}
                  >
                    <FaTachometerAlt className="w-5 h-5 flex-shrink-0" />
                    {isSidebarExpanded && <span className="font-medium">{t('nav.dashboard')}</span>}
                  </button>
                )}

                {/* Explore - All Authenticated Users */}
                <button
                  onClick={() => navigate('/explore')}
                  className={`w-full flex items-center ${isSidebarExpanded ? 'gap-3' : 'justify-center'} px-4 py-3 rounded-lg transition-all text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-navy-700`}
                  title={t('feed.explore')}
                >
                  <FaCompass className="w-5 h-5 flex-shrink-0" />
                  {isSidebarExpanded && <span className="font-medium">{t('feed.explore')}</span>}
                </button>
                
                {/* Profile - All Authenticated Users */}
                <button
                  onClick={handleProfileClick}
                  className={`w-full flex items-center ${isSidebarExpanded ? 'gap-3' : 'justify-center'} px-4 py-3 rounded-lg transition-all text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-navy-700`}
                  title={t('nav.profile') || 'Profile'}
                >
                  <FaUser className="w-5 h-5 flex-shrink-0" />
                  {isSidebarExpanded && <span className="font-medium">{t('nav.profile') || 'Profile'}</span>}
                </button>
              </div>
            )}

            {/* Guest Navigation */}
            {!instituteData.isAuthenticated && (
              <div className="space-y-2 mb-6">
                <button
                  onClick={() => navigate('/explore')}
                  className={`w-full flex items-center ${isSidebarExpanded ? 'gap-3' : 'justify-center'} px-4 py-3 rounded-lg transition-all text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-navy-700`}
                  title={t('feed.explore')}
                >
                  <FaCompass className="w-5 h-5 flex-shrink-0" />
                  {isSidebarExpanded && <span className="font-medium">{t('feed.explore')}</span>}
                </button>
              </div>
            )}
          </div>

          {/* Language Switcher & Theme Toggle - Bottom of Sidebar */}
          <div className={`mt-auto pt-6 border-t border-gray-200 dark:border-navy-700 space-y-2`}>
            {/* Language Switcher */}
            {isSidebarExpanded ? (
              <LanguageSwitcher variant="sidebar" />
            ) : (
              <div className="flex items-center justify-center">
                <LanguageSwitcher />
              </div>
            )}

            {/* Theme Toggle */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleTheme}
              className={`w-full flex items-center ${isSidebarExpanded ? 'gap-3' : 'justify-center'} px-4 py-3 rounded-lg transition-all text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-navy-700`}
              title={isDark ? t('lightMode') || 'Light Mode' : t('darkMode') || 'Dark Mode'}
            >
              {isDark ? (
                <FaSun className="w-5 h-5 flex-shrink-0 text-yellow-400" />
              ) : (
                <FaMoon className="w-5 h-5 flex-shrink-0" />
              )}
              {isSidebarExpanded && <span className="font-medium">{isDark ? t('lightMode') || 'Light Mode' : t('darkMode') || 'Dark Mode'}</span>}
            </motion.button>
          </div>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isMobileSidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeMobileSidebar}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
            />
            <motion.aside
              initial={{ x: -320 }}
              animate={{ x: 0 }}
              exit={{ x: -320 }}
              transition={{ type: 'spring', damping: 20 }}
              className={`fixed left-0 top-0 bottom-0 w-80 shadow-2xl z-50 lg:hidden overflow-y-auto bg-white dark:bg-navy-800 ${
                isLecturer ? 'border-l-2 border-l-purple-400/30 dark:border-l-purple-500/20' : ''
              }`}
            >
              <div className="p-6">
                {/* Mobile Sidebar Header */}
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                    {instituteData.isAuthenticated ? t('feed.explore') : t('feed.welcome')}
                  </h2>
                  <motion.button
                    whileHover={{ rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={closeMobileSidebar}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-navy-700"
                  >
                    <FaTimes className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  </motion.button>
                </div>
                
                {/* Back Button */}
                {showBackButton && onBackClick && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      onBackClick();
                      closeMobileSidebar();
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-navy-700 mb-6 cursor-pointer"
                  >
                    <FaTimes className="w-5 h-5 flex-shrink-0" />
                    <span className="font-medium">{t('common.back')}</span>
                  </motion.button>
                )}
                
                {/* Guest Message */}
                {!instituteData.isAuthenticated && (
                  <div className="mb-6 p-4 bg-primary-50 dark:bg-primary-900/20 rounded-lg border border-primary-200 dark:border-primary-800">
                    <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                      {t('feed.loginToSubscribe')}
                    </p>
                    <div className="flex flex-col gap-2">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          navigate('/login');
                          closeMobileSidebar();
                        }}
                        className="w-full px-3 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-lg text-sm font-semibold transition-colors"
                      >
                        {t('nav.login')}
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          navigate('/home');
                          closeMobileSidebar();
                        }}
                        className="w-full px-3 py-2 border border-primary-600 dark:border-teal-400 text-primary-600 dark:text-teal-400 rounded-lg text-sm font-semibold hover:bg-primary-50 dark:hover:bg-navy-700 transition-colors"
                      >
                        {t('nav.signUp')}
                      </motion.button>
                    </div>
                  </div>
                )}
                
                {/* Mobile Sidebar Navigation Buttons - Role Based */}
                {instituteData.isAuthenticated && (
                  <div className="space-y-2 mb-6">
                    {/* My Courses - Student & Lecturer Only */}
                    {(isStudent || isLecturer) && (
                      <button
                        onClick={handleCoursesClick}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-navy-700 ${
                          isStudent && !instituteData.isVerified ? 'opacity-60 cursor-not-allowed' : ''
                        }`}
                      >
                        <FaBook className="w-5 h-5 flex-shrink-0" />
                        <span className="font-medium">{t('nav.currentCourses')}</span>
                      </button>
                    )}
                    
                    {/* Schedule - Student & Lecturer Only */}
                    {(isStudent || isLecturer) && (
                      <button
                        onClick={handleScheduleClick}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-navy-700 ${
                          isStudent && !instituteData.isVerified ? 'opacity-60 cursor-not-allowed' : ''
                        }`}
                      >
                        <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"/>
                        </svg>
                        <span className="font-medium">{t('nav.schedule')}</span>
                      </button>
                    )}
                    
                    {/* Dashboard - Institution Only */}
                    {isInstitution && (
                      <button
                        onClick={() => {
                          navigate('/dashboard');
                          closeMobileSidebar();
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-navy-700"
                      >
                        <FaTachometerAlt className="w-5 h-5 flex-shrink-0" />
                        <span className="font-medium">{t('nav.dashboard')}</span>
                      </button>
                    )}
                    
                    {/* Explore */}
                    <button
                      onClick={() => {
                        navigate('/explore');
                        closeMobileSidebar();
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-navy-700"
                    >
                      <FaCompass className="w-5 h-5 flex-shrink-0" />
                      <span className="font-medium">{t('feed.explore')}</span>
                    </button>

                    {/* Profile */}
                    <button
                      onClick={handleProfileClick}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-navy-700"
                    >
                      <FaUser className="w-5 h-5 flex-shrink-0" />
                      <span className="font-medium">{t('nav.profile') || 'Profile'}</span>
                    </button>
                  </div>
                )}

                {/* Guest Navigation */}
                {!instituteData.isAuthenticated && (
                  <div className="space-y-2 mb-6">
                    <button
                      onClick={() => {
                        navigate('/explore');
                        closeMobileSidebar();
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-navy-700"
                    >
                      <FaCompass className="w-5 h-5 flex-shrink-0" />
                      <span className="font-medium">{t('feed.explore')}</span>
                    </button>
                  </div>
                )}

                {/* Language Switcher & Theme Toggle - Bottom of Mobile Sidebar */}
                <div className="mt-auto pt-6 border-t border-gray-200 dark:border-navy-700 space-y-2">
                  {/* Language Switcher */}
                  <LanguageSwitcher variant="sidebar" />

                  {/* Theme Toggle */}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={toggleTheme}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-navy-700"
                  >
                    {isDark ? (
                      <FaSun className="w-5 h-5 flex-shrink-0 text-yellow-400" />
                    ) : (
                      <FaMoon className="w-5 h-5 flex-shrink-0" />
                    )}
                    <span className="font-medium">{isDark ? t('lightMode') || 'Light Mode' : t('darkMode') || 'Dark Mode'}</span>
                  </motion.button>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Sidebar;

