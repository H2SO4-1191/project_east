import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  FaUniversity, 
  FaUser, 
  FaSignInAlt, 
  FaSignOutAlt, 
  FaTachometerAlt,
  FaMapMarkerAlt,
  FaUsers,
  FaChalkboardTeacher,
  FaMoon,
  FaSun,
  FaSearch
} from 'react-icons/fa';
import { useInstitute } from '../context/InstituteContext';
import { useTheme } from '../context/ThemeContext';
import toast from 'react-hot-toast';

const Feed = () => {
  const navigate = useNavigate();
  const { instituteData, updateInstituteData } = useInstitute();
  const { isDark, toggleTheme } = useTheme();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [advertisements, setAdvertisements] = useState([]);

  // Demo advertisements data
  useEffect(() => {
    const demoAds = [
      {
        id: 1,
        title: 'Al-Noor Educational Institute',
        description: 'Leading educational center offering comprehensive programs in Science, Technology, Engineering, and Mathematics. Join our community of excellence.',
        location: 'Baghdad, Iraq',
        students: 450,
        lecturers: 35,
        image: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800&q=80',
      },
      {
        id: 2,
        title: 'Baghdad International Academy',
        description: 'Premier institution providing world-class education with modern facilities and experienced faculty. Empowering students for a brighter future.',
        location: 'Baghdad, Iraq',
        students: 680,
        lecturers: 52,
        image: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=800&q=80',
      },
      {
        id: 3,
        title: 'Mesopotamia Science College',
        description: 'Specialized in advanced sciences and research programs. Our graduates excel in their fields with cutting-edge knowledge and practical skills.',
        location: 'Basra, Iraq',
        students: 320,
        lecturers: 28,
        image: 'https://images.unsplash.com/photo-1562774053-701939374585?w=800&q=80',
      },
      {
        id: 4,
        title: 'Tigris Business School',
        description: 'Excellence in business education and entrepreneurship. Preparing the next generation of business leaders and innovators.',
        location: 'Erbil, Iraq',
        students: 540,
        lecturers: 41,
        image: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=800&q=80',
      },
      {
        id: 5,
        title: 'Euphrates Medical Institute',
        description: 'Training future healthcare professionals with state-of-the-art facilities and expert medical faculty. Your journey to medical excellence starts here.',
        location: 'Najaf, Iraq',
        students: 390,
        lecturers: 45,
        image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&q=80',
      },
      {
        id: 6,
        title: 'Kurdistan Technical University',
        description: 'Pioneering technical education with hands-on training and industry partnerships. Building skilled professionals for the modern workforce.',
        location: 'Sulaymaniyah, Iraq',
        students: 720,
        lecturers: 58,
        image: 'https://images.unsplash.com/photo-1498243691581-b145c3f54a5a?w=800&q=80',
      },
    ];
    setAdvertisements(demoAds);
  }, []);

  const handleLogout = () => {
    updateInstituteData({
      name: '',
      email: '',
      username: '',
      firstName: '',
      lastName: '',
      userId: null,
      userType: '',
      accessToken: '',
      refreshToken: '',
      isAuthenticated: false,
      isVerified: false,
    });
    localStorage.removeItem('instituteData');
    toast.success('Logged out successfully');
    setShowUserMenu(false);
  };

  const handleSubscribe = (institutionName) => {
    if (!instituteData.isAuthenticated) {
      toast.error('Please login to subscribe');
      navigate('/login');
      return;
    }
    toast.success(`Subscribed to ${institutionName}!`);
  };

  const isInstitution = instituteData.userType === 'institution';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-navy-900 transition-colors">
      {/* Navigation Bar */}
      <nav className="bg-white dark:bg-navy-800 shadow-lg sticky top-0 z-50 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3 cursor-pointer"
              onClick={() => navigate('/')}
            >
              <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-teal-500 rounded-lg flex items-center justify-center">
                <FaUniversity className="text-white text-xl" />
              </div>
              <span className="text-xl font-bold text-gray-800 dark:text-white">
                Project East
              </span>
            </motion.div>

            {/* Right Side */}
            <div className="flex items-center gap-4">
              {/* Search Bar */}
              <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-navy-700 rounded-lg border border-gray-300 dark:border-navy-600 transition-colors">
                <FaSearch className="text-gray-400 dark:text-gray-500" />
                <input
                  type="text"
                  placeholder="Search institutions..."
                  className="bg-transparent outline-none text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 w-48 lg:w-64"
                  readOnly
                />
              </div>

              {/* Mobile Search Button */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-navy-700 transition-colors"
              >
                <FaSearch className="text-gray-600 dark:text-gray-400 text-xl" />
              </motion.button>

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

              {/* Dashboard Link (Institution Only) */}
              {instituteData.isAuthenticated && isInstitution && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate('/dashboard')}
                  className="hidden sm:flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-lg transition-colors"
                >
                  <FaTachometerAlt />
                  <span>Dashboard</span>
                </motion.button>
              )}

              {/* User Menu or Login/Signup */}
              {instituteData.isAuthenticated ? (
                <div className="relative">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-navy-700 transition-colors"
                  >
                    <div className="w-8 h-8 bg-gradient-to-br from-primary-600 to-teal-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-sm">
                        {instituteData.name?.[0]?.toUpperCase() || 'U'}
                      </span>
                    </div>
                    <span className="hidden sm:block text-gray-800 dark:text-white font-medium">
                      {instituteData.name || instituteData.username || 'User'}
                    </span>
                  </motion.button>

                  <AnimatePresence>
                    {showUserMenu && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute right-0 mt-2 w-48 bg-white dark:bg-navy-800 rounded-lg shadow-xl border border-gray-200 dark:border-navy-700 overflow-hidden"
                      >
                        <div className="p-3 border-b border-gray-200 dark:border-navy-700">
                          <p className="text-sm font-semibold text-gray-800 dark:text-white">
                            {instituteData.name || instituteData.username}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {instituteData.email}
                          </p>
                        </div>

                        {isInstitution && (
                          <button
                            onClick={() => {
                              navigate('/dashboard');
                              setShowUserMenu(false);
                            }}
                            className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-navy-700 flex items-center gap-2 transition-colors sm:hidden"
                          >
                            <FaTachometerAlt />
                            Dashboard
                          </button>
                        )}

                        <button
                          onClick={handleLogout}
                          className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-navy-700 flex items-center gap-2 transition-colors"
                        >
                          <FaSignOutAlt />
                          Logout
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate('/login')}
                    className="flex items-center gap-2 px-4 py-2 border border-primary-600 text-primary-600 dark:border-teal-400 dark:text-teal-400 rounded-lg hover:bg-primary-50 dark:hover:bg-navy-700 transition-colors"
                  >
                    <FaSignInAlt />
                    <span>Login</span>
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate('/home')}
                    className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-lg transition-colors"
                  >
                    <FaUser />
                    <span>Sign Up</span>
                  </motion.button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary-600 to-teal-500 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-bold mb-4"
          >
            Discover Educational Excellence
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-white/90 max-w-2xl mx-auto"
          >
            Explore leading institutions and find the perfect place to advance your education
          </motion.p>
        </div>
      </div>

      {/* Advertisements Feed */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {advertisements.map((ad, index) => (
            <motion.div
              key={ad.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white dark:bg-navy-800 rounded-xl shadow-lg overflow-hidden"
            >
              {/* Image */}
              <div className="relative h-64 overflow-hidden">
                <img
                  src={ad.image}
                  alt={ad.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-4 left-4 flex items-center gap-2 text-white text-base">
                  <FaMapMarkerAlt className="text-sm" />
                  <span>{ad.location}</span>
                </div>
              </div>

              {/* Content */}
              <div className="p-8">
                <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-3">
                  {ad.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-base mb-6 line-clamp-4">
                  {ad.description}
                </p>

                {/* Stats */}
                <div className="flex items-center gap-6 mb-6 text-base text-gray-600 dark:text-gray-400">
                  <div className="flex items-center gap-2">
                    <FaUsers className="text-primary-600 dark:text-teal-400 text-lg" />
                    <span>{ad.students} Students</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FaChalkboardTeacher className="text-primary-600 dark:text-teal-400 text-lg" />
                    <span>{ad.lecturers} Lecturers</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex-1 px-5 py-3 border-2 border-primary-600 dark:border-teal-400 text-primary-600 dark:text-teal-400 rounded-lg hover:bg-primary-50 dark:hover:bg-navy-700 transition-colors text-base font-semibold"
                  >
                    Learn More
                  </motion.button>
                  
                  {!isInstitution && (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleSubscribe(ad.title)}
                      className="flex-1 px-5 py-3 bg-primary-600 hover:bg-primary-500 text-white rounded-lg transition-colors text-base font-semibold"
                    >
                      Subscribe
                    </motion.button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Footer */}
      <footer className="bg-white dark:bg-navy-800 border-t border-gray-200 dark:border-navy-700 mt-12 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-600 dark:text-gray-400">
            <p className="text-sm">
              © 2025 Project East. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Feed;

