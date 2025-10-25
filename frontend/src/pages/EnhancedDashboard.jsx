import { useState } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaHome, FaUsers, FaChalkboardTeacher, FaBriefcase, 
  FaCalendarAlt, FaDollarSign, FaCog, FaBars, FaTimes,
  FaMoon, FaSun, FaSignOutAlt 
} from 'react-icons/fa';
import { useInstitute } from '../context/InstituteContext';
import { useTheme } from '../context/ThemeContext';
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
  const { instituteData } = useInstitute();
  const { isDark, toggleTheme } = useTheme();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const menuItems = [
    { id: 'overview', path: '/dashboard', label: 'Overview', icon: FaHome, color: 'from-blue-500 to-blue-600' },
    { id: 'students', path: '/dashboard/students', label: 'Students', icon: FaUsers, color: 'from-blue-500 to-blue-600' },
    { id: 'teachers', path: '/dashboard/teachers', label: 'Teachers', icon: FaChalkboardTeacher, color: 'from-teal-500 to-teal-600' },
    { id: 'employees', path: '/dashboard/employees', label: 'Employees', icon: FaBriefcase, color: 'from-purple-500 to-purple-600' },
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

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-navy-900 flex transition-colors duration-300">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-72 bg-white dark:bg-navy-800 shadow-xl border-r border-gray-200 dark:border-navy-700">
        {/* Logo */}
        <div className="p-6 border-b border-gray-200 dark:border-navy-700">
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => navigate('/dashboard')}
          >
            <div className="w-12 h-12 bg-gradient-to-br from-primary-600 to-teal-500 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white text-xl font-bold">PE</span>
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-800 dark:text-white">Project East</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">Dashboard</p>
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
                w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group
                ${isActiveRoute(item.path)
                  ? 'bg-gradient-to-r from-primary-600 to-primary-700 dark:from-teal-500 dark:to-teal-600 text-white shadow-lg'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-navy-700'
                }
              `}
              whileHover={{ x: 5 }}
              whileTap={{ scale: 0.98 }}
            >
              <item.icon className={`w-5 h-5 ${isActiveRoute(item.path) ? 'text-white' : 'text-gray-500 dark:text-gray-400 group-hover:text-primary-600 dark:group-hover:text-teal-400'}`} />
              <span className="font-medium">{item.label}</span>
            </motion.button>
          ))}
        </nav>

        {/* Theme Toggle & Logout */}
        <div className="p-4 border-t border-gray-200 dark:border-navy-700 space-y-2">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={toggleTheme}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-navy-700 transition-all"
          >
            {isDark ? <FaSun className="w-5 h-5 text-gold-500" /> : <FaMoon className="w-5 h-5 text-navy-600" />}
            <span className="font-medium">{isDark ? 'Light Mode' : 'Dark Mode'}</span>
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
          >
            <FaSignOutAlt className="w-5 h-5" />
            <span className="font-medium">Logout</span>
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
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="bg-white dark:bg-navy-800 shadow-md border-b border-gray-200 dark:border-navy-700 sticky top-0 z-30">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {/* Mobile Menu Button */}
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setIsSidebarOpen(true)}
                  className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-navy-700 transition-colors"
                >
                  <FaBars className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                </motion.button>

                <div>
                  <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
                    {instituteData.name}
                  </h1>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{instituteData.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="hidden md:block text-right">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Welcome Admin</p>
                  <p className="text-xs text-gray-500 dark:text-gray-500">
                    {instituteData.subscriptionLabel || 'Premium Plan'}
                  </p>
                </div>
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  className="w-12 h-12 bg-gradient-to-br from-primary-600 to-teal-500 rounded-full flex items-center justify-center shadow-lg cursor-pointer"
                >
                  <span className="text-white font-bold text-lg">
                    {instituteData.name.charAt(0)}
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
              <Route path="/teachers" element={<Teachers />} />
              <Route path="/employees" element={<Employees />} />
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
      </div>
    </div>
  );
};

export default EnhancedDashboard;

