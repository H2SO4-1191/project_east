import { useState, useRef, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaHome, FaUsers, FaChalkboardTeacher, FaBriefcase, 
  FaCalendarAlt, FaDollarSign, FaCog, FaBars, FaTimes,
  FaMoon, FaSun, FaSignOutAlt, FaGlobe, FaPlus, FaEdit, FaBook, FaClock, FaBell, FaNewspaper
} from 'react-icons/fa';
import { useInstitute } from '../context/InstituteContext';
import { useTheme } from '../context/ThemeContext';
import Modal from '../components/Modal';
import AnimatedButton from '../components/AnimatedButton';
import toast from 'react-hot-toast';
import Overview from './dashboard/Overview';
import Students from './dashboard/Students';
import Teachers from './dashboard/Teachers';
import Employees from './dashboard/Employees';
import Schedule from './dashboard/Schedule';
import Finance from './dashboard/Finance';
import Settings from './dashboard/Settings';

const EnhancedDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { instituteData, clearInstituteData } = useInstitute();
  const { isDark, toggleTheme } = useTheme();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  const sidebarTimeoutRef = useRef(null);
  
  // Course management state
  const [showCreateCourseModal, setShowCreateCourseModal] = useState(false);
  const [showEditCoursesModal, setShowEditCoursesModal] = useState(false);
  const [showVerificationWarning, setShowVerificationWarning] = useState(false);
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef(null);
  const [showNewPostModal, setShowNewPostModal] = useState(false);
  
  // Demo notifications
  const [notifications] = useState([
    {
      id: 1,
      title: 'New Student Enrollment',
      message: '5 new students enrolled in Advanced Calculus course',
      time: '1 hour ago',
      read: false,
      type: 'enrollment'
    },
    {
      id: 2,
      title: 'Payment Received',
      message: 'Payment of $450 received for Business Strategy course',
      time: '3 hours ago',
      read: false,
      type: 'payment'
    },
    {
      id: 3,
      title: 'Course Update Required',
      message: 'Your Introduction to Programming course needs an update',
      time: '1 day ago',
      read: true,
      type: 'update'
    },
    {
      id: 4,
      title: 'New Message',
      message: 'You have a new message from a student',
      time: '2 days ago',
      read: true,
      type: 'message'
    },
  ]);
  
  // Create course form state
  const [createForm, setCreateForm] = useState({
    title: '',
    code: '',
    credits: '',
    duration: '',
    capacity: '',
    price: '',
    description: '',
  });

  // Edit course form state
  const [editForm, setEditForm] = useState({
    title: '',
    code: '',
    credits: '',
    duration: '',
    capacity: '',
    price: '',
    description: '',
  });

  const menuItems = [
    { id: 'overview', path: '/dashboard', label: 'Overview', icon: FaHome, color: 'from-blue-500 to-blue-600' },
    { id: 'students', path: '/dashboard/students', label: 'Students', icon: FaUsers, color: 'from-blue-500 to-blue-600' },
    { id: 'lecturers', path: '/dashboard/lecturers', label: 'Lecturers', icon: FaChalkboardTeacher, color: 'from-teal-500 to-teal-600' },
    { id: 'staff', path: '/dashboard/staff', label: 'Staff', icon: FaBriefcase, color: 'from-purple-500 to-purple-600' },
    { id: 'schedule', path: '/dashboard/schedule', label: 'Schedule', icon: FaCalendarAlt, color: 'from-pink-500 to-pink-600' },
    { id: 'finance', path: '/dashboard/finance', label: 'Finance', icon: FaDollarSign, color: 'from-gold-500 to-gold-600' },
    { id: 'settings', path: '/dashboard/settings', label: 'Settings', icon: FaCog, color: 'from-gray-500 to-gray-600' },
  ];

  const isActiveRoute = (path) => {
    if (path === '/dashboard') {
      return location.pathname === '/dashboard' || location.pathname === '/dashboard/';
    }
    return location.pathname.startsWith(path);
  };

  const handleNavigation = (path) => {
    navigate(path);
    setIsSidebarOpen(false);
  };

  // Close notifications when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };

    if (showNotifications) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showNotifications]);

  // Cleanup sidebar timeout on unmount
  useEffect(() => {
    return () => {
      if (sidebarTimeoutRef.current) {
        clearTimeout(sidebarTimeoutRef.current);
      }
    };
  }, []);

  const handleLogout = () => {
    // Clear all institute data
    localStorage.removeItem('instituteData');
    clearInstituteData();
    
    // Navigate to home and force reload to ensure clean state
    navigate('/');
    window.location.reload();
  };

  // Check verification before opening course modals
  const checkVerificationAndOpen = (modalType) => {
    if (!instituteData.isVerified) {
      setShowVerificationWarning(true);
      return;
    }
    
    if (modalType === 'new_post') {
      setShowNewPostModal(true);
    } else if (modalType === 'create') {
      setShowCreateCourseModal(true);
    } else if (modalType === 'edit') {
      setShowEditCoursesModal(true);
    }
  };

  const handleGoToSettings = () => {
    setShowVerificationWarning(false);
    navigate('/dashboard/settings');
    
    // Highlight verification button after navigation
    setTimeout(() => {
      const verifyButton = document.querySelector('[data-verify-button]');
      if (verifyButton) {
        verifyButton.classList.add('highlight-pulse');
        setTimeout(() => {
          verifyButton.classList.remove('highlight-pulse');
        }, 3500);
      }
    }, 100);
  };

  // Course management handlers
  const handleCreateChange = (e) => {
    const { name, value } = e.target;
    setCreateForm(prev => ({ ...prev, [name]: value }));
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({ ...prev, [name]: value }));
  };

  const handleCreateCourse = (e) => {
    e.preventDefault();
    
    if (!createForm.title || !createForm.code || !createForm.price) {
      toast.error('Please fill in all required fields');
      return;
    }

    const newCourse = {
      id: Date.now(),
      ...createForm,
      createdAt: new Date().toISOString(),
    };

    setCourses(prev => [...prev, newCourse]);
    toast.success('Course created successfully!');
    setShowCreateCourseModal(false);
    setCreateForm({
      title: '',
      code: '',
      credits: '',
      duration: '',
      capacity: '',
      price: '',
      description: '',
    });
  };

  const handleEditCourse = (course) => {
    setSelectedCourse(course);
    setEditForm(course);
  };

  const handleUpdateCourse = (e) => {
    e.preventDefault();
    
    setCourses(prev => prev.map(c => 
      c.id === selectedCourse.id ? { ...c, ...editForm } : c
    ));
    
    toast.success('Course updated successfully!');
    setSelectedCourse(null);
    setEditForm({
      title: '',
      code: '',
      credits: '',
      duration: '',
      capacity: '',
      price: '',
      description: '',
    });
  };

  const handleDeleteCourse = (courseId) => {
    if (window.confirm('Are you sure you want to delete this course?')) {
      setCourses(prev => prev.filter(c => c.id !== courseId));
      toast.success('Course deleted successfully!');
      setSelectedCourse(null);
    }
  };

  const displayName = instituteData.name || instituteData.username || instituteData.email || 'Institution';
  const displayEmail = instituteData.email || 'No email on file';
  const avatarLetter = displayName.charAt(0)?.toUpperCase() || 'I';
  const greetingName = instituteData.firstName || instituteData.name || instituteData.username || 'there';
  const subscriptionLabel = instituteData.subscriptionLabel || instituteData.subscription || 'Active Plan';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-navy-900 flex transition-colors duration-300">
      {/* Desktop Sidebar - Slide Based Design */}
      <aside 
        className={`hidden lg:block bg-white dark:bg-navy-800 shadow-xl border-r border-gray-200 dark:border-navy-700 fixed left-0 top-0 bottom-0 overflow-y-auto z-40 transition-all duration-500 ease-in-out ${
          isSidebarExpanded ? 'w-72' : 'w-20'
        }`}
        onMouseEnter={() => {
          // Clear any pending timeout
          if (sidebarTimeoutRef.current) {
            clearTimeout(sidebarTimeoutRef.current);
            sidebarTimeoutRef.current = null;
          }
          setIsSidebarExpanded(true);
        }}
        onMouseLeave={() => {
          // Set timeout to collapse after delay for smoother UX
          sidebarTimeoutRef.current = setTimeout(() => {
            setIsSidebarExpanded(false);
            sidebarTimeoutRef.current = null;
          }, 200);
        }}
      >
        {/* Logo */}
        <div className="p-6 border-b border-gray-200 dark:border-navy-700">
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => navigate('/dashboard')}
          >
            <div className="w-12 h-12 bg-gradient-to-br from-primary-600 to-teal-500 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
              <span className="text-white text-xl font-bold">PE</span>
            </div>
            <div className={`transition-all duration-500 ease-in-out ${isSidebarExpanded ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'}`}>
              <h2 className="text-lg font-bold text-gray-800 dark:text-white whitespace-nowrap">Project East</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">Dashboard</p>
            </div>
          </motion.div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {menuItems.map((item, index) => (
            <motion.button
              key={item.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => handleNavigation(item.path)}
              className={`
                w-full flex items-center ${isSidebarExpanded ? 'gap-3' : 'justify-center'} px-4 py-3 rounded-xl transition-all duration-300 ease-in-out group
                ${isActiveRoute(item.path)
                  ? 'bg-gradient-to-r from-primary-600 to-primary-700 dark:from-teal-500 dark:to-teal-600 text-white shadow-lg'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-navy-700'
                }
              `}
              whileHover={isSidebarExpanded ? { x: 5 } : {}}
              whileTap={{ scale: 0.98 }}
              title={item.label}
            >
              <item.icon className={`w-5 h-5 flex-shrink-0 ${isActiveRoute(item.path) ? 'text-white' : 'text-gray-500 dark:text-gray-400 group-hover:text-primary-600 dark:group-hover:text-teal-400'}`} />
              {isSidebarExpanded && <span className="font-medium whitespace-nowrap">{item.label}</span>}
            </motion.button>
          ))}
        </nav>

        {/* Theme Toggle & Logout */}
        <div className="p-4 border-t border-gray-200 dark:border-navy-700 space-y-2">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/')}
            className={`w-full flex items-center ${isSidebarExpanded ? 'gap-3' : 'justify-center'} px-4 py-3 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-navy-700 transition-all duration-300 ease-in-out`}
            title="Home Feed"
          >
            <FaGlobe className="w-5 h-5 flex-shrink-0" />
            {isSidebarExpanded && <span className="font-medium whitespace-nowrap">Home Feed</span>}
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={toggleTheme}
            className={`w-full flex items-center ${isSidebarExpanded ? 'gap-3' : 'justify-center'} px-4 py-3 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-navy-700 transition-all duration-300 ease-in-out`}
            title={isDark ? 'Light Mode' : 'Dark Mode'}
          >
            {isDark ? <FaSun className="w-5 h-5 text-gold-500 flex-shrink-0" /> : <FaMoon className="w-5 h-5 text-navy-600 flex-shrink-0" />}
            {isSidebarExpanded && <span className="font-medium whitespace-nowrap">{isDark ? 'Light Mode' : 'Dark Mode'}</span>}
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleLogout}
            className={`w-full flex items-center ${isSidebarExpanded ? 'gap-3' : 'justify-center'} px-4 py-3 rounded-xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-300 ease-in-out`}
            title="Logout"
          >
            <FaSignOutAlt className="w-5 h-5 flex-shrink-0" />
            {isSidebarExpanded && <span className="font-medium whitespace-nowrap">Logout</span>}
          </motion.button>
        </div>
      </aside>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
            />
            <motion.aside
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: 'spring', damping: 20 }}
              className="fixed left-0 top-0 bottom-0 w-72 bg-white dark:bg-navy-800 shadow-2xl z-50 lg:hidden flex flex-col"
            >
              {/* Logo */}
              <div className="p-6 border-b border-gray-200 dark:border-navy-700 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary-600 to-teal-500 rounded-xl flex items-center justify-center shadow-lg">
                    <span className="text-white text-xl font-bold">PE</span>
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-800 dark:text-white">Project East</h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Dashboard</p>
                  </div>
                </div>
                <motion.button
                  whileHover={{ rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setIsSidebarOpen(false)}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-navy-700"
                >
                  <FaTimes className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </motion.button>
              </div>

              {/* Navigation */}
              <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                {menuItems.map((item) => (
                  <motion.button
                    key={item.id}
                    onClick={() => handleNavigation(item.path)}
                    className={`
                      w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
                      ${isActiveRoute(item.path)
                        ? 'bg-gradient-to-r from-primary-600 to-primary-700 dark:from-teal-500 dark:to-teal-600 text-white shadow-lg'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-navy-700'
                      }
                    `}
                    whileTap={{ scale: 0.98 }}
                  >
                    <item.icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </motion.button>
                ))}
              </nav>

              {/* Theme Toggle & Logout */}
              <div className="p-4 border-t border-gray-200 dark:border-navy-700 space-y-2">
                <button
                  onClick={() => navigate('/')}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-navy-700 transition-all"
                >
                  <FaGlobe className="w-5 h-5" />
                  <span className="font-medium">Home Feed</span>
                </button>

                <button
                  onClick={toggleTheme}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-navy-700 transition-all"
                >
                  {isDark ? <FaSun className="w-5 h-5 text-gold-500" /> : <FaMoon className="w-5 h-5 text-navy-600" />}
                  <span className="font-medium">{isDark ? 'Light Mode' : 'Dark Mode'}</span>
                </button>
                
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                >
                  <FaSignOutAlt className="w-5 h-5" />
                  <span className="font-medium">Logout</span>
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${isSidebarExpanded ? 'lg:ml-72' : 'lg:ml-20'}`}>
        {/* Header */}
        <header className="bg-white dark:bg-navy-800 shadow-md border-b border-gray-200 dark:border-navy-700 sticky top-0 z-30">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {/* Logo Button for Mobile - Opens Sidebar */}
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsSidebarOpen(true)}
                  className="lg:hidden flex items-center gap-3 cursor-pointer"
                >
                  <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-teal-500 rounded-lg flex items-center justify-center shadow-lg">
                    <span className="text-white text-lg font-bold">PE</span>
                  </div>
                </motion.div>

                <div>
                  <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
                    {displayName}
                  </h1>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{displayEmail}</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="hidden md:block text-right">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Welcome {greetingName}
                  </p>
                  <div className="flex items-center gap-2 justify-end">
                    <p className="text-xs text-gray-500 dark:text-gray-500">
                      {subscriptionLabel}
                    </p>
                    {instituteData.isVerified !== undefined && (
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                          instituteData.isVerified
                            ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
                            : 'bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300'
                        }`}
                      >
                        {instituteData.isVerified ? 'Verified' : 'Unverified'}
                      </span>
                    )}
                  </div>
                </div>
                
                {/* Notification Button */}
                <div className="relative" ref={notificationRef}>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-navy-700 transition-colors"
                  >
                    <FaBell className="text-gray-600 dark:text-gray-400 text-xl" />
                    {notifications.filter(n => !n.read).length > 0 && (
                      <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                        {notifications.filter(n => !n.read).length}
                      </span>
                    )}
                  </motion.button>

                  {/* Notification Popup */}
                  <AnimatePresence>
                    {showNotifications && (
                      <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        className="absolute right-0 mt-2 w-80 bg-white dark:bg-navy-800 rounded-xl shadow-2xl border border-gray-200 dark:border-navy-700 overflow-hidden z-50"
                      >
                        <div className="p-4 border-b border-gray-200 dark:border-navy-700 flex items-center justify-between">
                          <h3 className="font-bold text-gray-800 dark:text-white">Notifications</h3>
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {notifications.filter(n => !n.read).length} new
                          </span>
                        </div>
                        <div className="max-h-96 overflow-y-auto">
                          {notifications.length === 0 ? (
                            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                              No notifications
                            </div>
                          ) : (
                            notifications.map((notification) => (
                              <motion.div
                                key={notification.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className={`p-4 border-b border-gray-100 dark:border-navy-700 hover:bg-gray-50 dark:hover:bg-navy-900 transition-colors cursor-pointer ${
                                  !notification.read ? 'bg-primary-50 dark:bg-primary-900/20' : ''
                                }`}
                                onClick={() => setShowNotifications(false)}
                              >
                                <div className="flex items-start gap-3">
                                  <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                                    !notification.read ? 'bg-primary-600' : 'bg-transparent'
                                  }`} />
                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-semibold text-sm text-gray-800 dark:text-white mb-1">
                                      {notification.title}
                                    </h4>
                                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                                      {notification.message}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-500">
                                      {notification.time}
                                    </p>
                                  </div>
                                </div>
                              </motion.div>
                            ))
                          )}
                        </div>
                        <div className="p-3 border-t border-gray-200 dark:border-navy-700 text-center">
                          <button className="text-sm text-primary-600 dark:text-teal-400 hover:underline font-medium">
                            View All Notifications
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  className="w-12 h-12 bg-gradient-to-br from-primary-600 to-teal-500 rounded-full flex items-center justify-center shadow-lg cursor-pointer"
                >
                  <span className="text-white font-bold text-lg">
                    {avatarLetter}
                  </span>
                </motion.div>
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 p-6 overflow-auto">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Routes>
              <Route path="/" element={<Overview />} />
              <Route path="/students" element={<Students />} />
              <Route path="/lecturers" element={<Teachers />} />
              <Route path="/staff" element={<Employees />} />
              <Route path="/schedule" element={<Schedule />} />
              <Route path="/finance" element={<Finance />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </motion.div>
        </main>

        {/* Mobile Bottom Navigation */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-navy-800 border-t border-gray-200 dark:border-navy-700 shadow-lg z-30">
          <div className="flex items-center justify-around p-2">
            {menuItems.slice(0, 5).map((item) => (
              <motion.button
                key={item.id}
                whileTap={{ scale: 0.9 }}
                onClick={() => handleNavigation(item.path)}
                className={`
                  flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all
                  ${isActiveRoute(item.path)
                    ? 'text-primary-600 dark:text-teal-400'
                    : 'text-gray-500 dark:text-gray-400'
                  }
                `}
              >
                <item.icon className="w-5 h-5" />
                <span className="text-xs font-medium">{item.label}</span>
              </motion.button>
            ))}
          </div>
        </nav>

        {/* Floating Action Buttons - Bottom Right Corner */}
        <div className="fixed bottom-6 right-6 flex flex-col items-end gap-3 z-40">
          {/* New Post Button */}
          <div className="relative group">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => checkVerificationAndOpen('new_post')}
              className="h-14 w-14 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white rounded-full shadow-lg flex items-center justify-center transition-all relative z-10"
            >
              <FaNewspaper className="w-6 h-6" />
            </motion.button>
            <div className="absolute right-0 top-0 h-14 bg-gradient-to-r from-purple-600 to-purple-700 rounded-full shadow-lg flex items-center pr-16 pl-6 overflow-hidden pointer-events-none w-0 opacity-0 group-hover:w-auto group-hover:opacity-100 transition-all duration-300 ease-out">
              <span className="whitespace-nowrap font-semibold text-sm text-white">
                New Post
              </span>
            </div>
          </div>

          {/* Create Course Button */}
          <div className="relative group">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => checkVerificationAndOpen('create')}
              className="h-14 w-14 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-500 hover:to-primary-600 text-white rounded-full shadow-lg flex items-center justify-center transition-all relative z-10"
            >
              <FaPlus className="w-6 h-6" />
            </motion.button>
            <div className="absolute right-0 top-0 h-14 bg-gradient-to-r from-primary-600 to-primary-700 rounded-full shadow-lg flex items-center pr-16 pl-6 overflow-hidden pointer-events-none w-0 opacity-0 group-hover:w-auto group-hover:opacity-100 transition-all duration-300 ease-out">
              <span className="whitespace-nowrap font-semibold text-sm text-white">
                Create New Course
              </span>
            </div>
          </div>

          {/* Edit Courses Button */}
          <div className="relative group">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => checkVerificationAndOpen('edit')}
              className="h-14 w-14 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-500 hover:to-teal-600 text-white rounded-full shadow-lg flex items-center justify-center transition-all relative z-10"
            >
              <FaEdit className="w-6 h-6" />
            </motion.button>
            <div className="absolute right-0 top-0 h-14 bg-gradient-to-r from-teal-600 to-teal-700 rounded-full shadow-lg flex items-center pr-16 pl-6 overflow-hidden pointer-events-none w-0 opacity-0 group-hover:w-auto group-hover:opacity-100 transition-all duration-300 ease-out">
              <span className="whitespace-nowrap font-semibold text-sm text-white">
                Edit Current Courses
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Verification Warning Modal */}
      <Modal
        isOpen={showVerificationWarning}
        onClose={() => setShowVerificationWarning(false)}
        title="Account Verification Required"
      >
        <div className="space-y-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center flex-shrink-0">
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                <FaCog className="w-6 h-6 text-amber-600 dark:text-amber-400" />
              </motion.div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
                Verification Needed
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                You need to verify your account before you can create or manage courses. 
                Please complete the verification process in Settings to unlock this feature.
              </p>
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <p className="text-sm text-blue-800 dark:text-blue-300">
              <strong>Why verify?</strong> Account verification ensures the security and authenticity 
              of your institution, allowing you to access all platform features.
            </p>
          </div>

          <div className="flex gap-3">
            <AnimatedButton
              onClick={handleGoToSettings}
              className="flex-1"
            >
              Go to Settings
            </AnimatedButton>
            <AnimatedButton
              variant="secondary"
              onClick={() => setShowVerificationWarning(false)}
              className="flex-1"
            >
              OK
            </AnimatedButton>
          </div>
        </div>
      </Modal>

      {/* Create Course Modal */}
      <Modal
        isOpen={showCreateCourseModal}
        onClose={() => setShowCreateCourseModal(false)}
        title="Create New Course"
      >
        <form onSubmit={handleCreateCourse} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
                Course Title *
              </label>
              <input
                type="text"
                name="title"
                value={createForm.title}
                onChange={handleCreateChange}
                className="w-full px-4 py-3 border border-gray-300 dark:border-navy-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-navy-700 text-gray-900 dark:text-white"
                placeholder="e.g. Introduction to Computer Science"
                required
              />
            </div>

            <div>
              <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
                Course Code *
              </label>
              <input
                type="text"
                name="code"
                value={createForm.code}
                onChange={handleCreateChange}
                className="w-full px-4 py-3 border border-gray-300 dark:border-navy-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-navy-700 text-gray-900 dark:text-white"
                placeholder="e.g. CS101"
                required
              />
            </div>

            <div>
              <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
                Credits
              </label>
              <input
                type="number"
                name="credits"
                value={createForm.credits}
                onChange={handleCreateChange}
                className="w-full px-4 py-3 border border-gray-300 dark:border-navy-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-navy-700 text-gray-900 dark:text-white"
                placeholder="e.g. 3"
              />
            </div>

            <div>
              <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
                Duration
              </label>
              <input
                type="text"
                name="duration"
                value={createForm.duration}
                onChange={handleCreateChange}
                className="w-full px-4 py-3 border border-gray-300 dark:border-navy-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-navy-700 text-gray-900 dark:text-white"
                placeholder="e.g. 12 weeks"
              />
            </div>

            <div>
              <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
                Capacity
              </label>
              <input
                type="number"
                name="capacity"
                value={createForm.capacity}
                onChange={handleCreateChange}
                className="w-full px-4 py-3 border border-gray-300 dark:border-navy-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-navy-700 text-gray-900 dark:text-white"
                placeholder="e.g. 30"
              />
            </div>

            <div>
              <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
                Price ($) *
              </label>
              <input
                type="number"
                name="price"
                value={createForm.price}
                onChange={handleCreateChange}
                className="w-full px-4 py-3 border border-gray-300 dark:border-navy-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-navy-700 text-gray-900 dark:text-white"
                placeholder="e.g. 500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
              Description
            </label>
            <textarea
              name="description"
              value={createForm.description}
              onChange={handleCreateChange}
              rows="4"
              className="w-full px-4 py-3 border border-gray-300 dark:border-navy-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-navy-700 text-gray-900 dark:text-white resize-none"
              placeholder="Course description..."
            />
          </div>

          <div className="flex gap-3 pt-4">
            <AnimatedButton type="submit" className="flex-1">
              Create Course
            </AnimatedButton>
            <AnimatedButton
              type="button"
              variant="secondary"
              onClick={() => setShowCreateCourseModal(false)}
              className="flex-1"
            >
              Cancel
            </AnimatedButton>
          </div>
        </form>
      </Modal>

      {/* Edit Courses Modal */}
      <Modal
        isOpen={showEditCoursesModal}
        onClose={() => {
          setShowEditCoursesModal(false);
          setSelectedCourse(null);
        }}
        title={selectedCourse ? "Edit Course" : "Manage Courses"}
      >
        {!selectedCourse ? (
          <div className="space-y-3">
            {courses.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 dark:text-gray-400">
                  No courses available. Create your first course!
                </p>
              </div>
            ) : (
              courses.map((course) => (
                <motion.div
                  key={course.id}
                  whileHover={{ scale: 1.02 }}
                  className="p-4 border-2 border-gray-200 dark:border-navy-700 rounded-lg hover:border-primary-500 dark:hover:border-teal-500 transition-all cursor-pointer"
                  onClick={() => handleEditCourse(course)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-gray-800 dark:text-white">{course.title}</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{course.code}</p>
                    </div>
                    <span className="px-3 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-full text-sm font-semibold">
                      ${course.price}
                    </span>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        ) : (
          <form onSubmit={handleUpdateCourse} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
                  Course Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={editForm.title}
                  onChange={handleEditChange}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-navy-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-navy-700 text-gray-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
                  Course Code *
                </label>
                <input
                  type="text"
                  name="code"
                  value={editForm.code}
                  onChange={handleEditChange}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-navy-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-navy-700 text-gray-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
                  Credits
                </label>
                <input
                  type="number"
                  name="credits"
                  value={editForm.credits}
                  onChange={handleEditChange}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-navy-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-navy-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
                  Duration
                </label>
                <input
                  type="text"
                  name="duration"
                  value={editForm.duration}
                  onChange={handleEditChange}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-navy-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-navy-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
                  Capacity
                </label>
                <input
                  type="number"
                  name="capacity"
                  value={editForm.capacity}
                  onChange={handleEditChange}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-navy-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-navy-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
                  Price ($) *
                </label>
                <input
                  type="number"
                  name="price"
                  value={editForm.price}
                  onChange={handleEditChange}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-navy-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-navy-700 text-gray-900 dark:text-white"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={editForm.description}
                onChange={handleEditChange}
                rows="4"
                className="w-full px-4 py-3 border border-gray-300 dark:border-navy-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-navy-700 text-gray-900 dark:text-white resize-none"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <AnimatedButton type="submit" className="flex-1">
                Update Course
              </AnimatedButton>
              <AnimatedButton
                type="button"
                variant="secondary"
                onClick={() => handleDeleteCourse(selectedCourse.id)}
                className="flex-1 bg-red-600 hover:bg-red-500"
              >
                Delete Course
              </AnimatedButton>
              <AnimatedButton
                type="button"
                variant="secondary"
                onClick={() => setSelectedCourse(null)}
                className="flex-1"
              >
                Back
              </AnimatedButton>
            </div>
          </form>
        )}
      </Modal>

      {/* New Post Modal */}
      <Modal
        isOpen={showNewPostModal}
        onClose={() => setShowNewPostModal(false)}
        title="Create New Post"
      >
        <div className="space-y-6">
          <p className="text-gray-600 dark:text-gray-400">
            Create a new post to share updates, achievements, or announcements with the community.
          </p>
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <p className="text-sm text-blue-800 dark:text-blue-300">
              <strong>Note:</strong> This feature is coming soon. You'll be able to create posts about your institution's achievements, job openings, and more.
            </p>
          </div>
          <div className="flex gap-3 pt-4">
            <AnimatedButton
              onClick={() => setShowNewPostModal(false)}
              className="flex-1"
            >
              Close
            </AnimatedButton>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default EnhancedDashboard;

