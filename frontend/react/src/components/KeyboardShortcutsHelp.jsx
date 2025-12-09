import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import { useInstitute } from '../context/InstituteContext';

const KeyboardShortcutsHelp = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const { instituteData } = useInstitute();
  const userType = instituteData.userType;

  // Base shortcuts available to all users
  const globalShortcuts = [
    { keys: ['Ctrl', 'K'], description: t('shortcuts.search') || 'Search / Command Palette' },
    { keys: ['?'], description: t('shortcuts.showHelp') || 'Show this help' },
    { keys: ['Esc'], description: t('shortcuts.closeModal') || 'Close modal / Cancel' },
  ];

  // Navigation shortcuts
  const navigationShortcuts = [
    { keys: ['G', 'B'], description: t('shortcuts.goBack') || 'Go Back', show: true },
    { keys: ['G', 'D'], description: t('shortcuts.goToDashboard') || 'Go to Dashboard', show: userType === 'institution' },
    { keys: ['G', 'F'], description: t('shortcuts.goToFeed') || 'Go to Feed', show: true },
    { keys: ['G', 'E'], description: t('shortcuts.goToExplore') || 'Go to Explore', show: true },
    { keys: ['G', 'C'], description: t('shortcuts.goToCourses') || 'Go to My Courses', show: userType === 'lecturer' || userType === 'student' },
    { keys: ['G', 'S'], description: t('shortcuts.goToSchedule') || 'Go to Schedule', show: userType === 'lecturer' || userType === 'student' },
  ].filter(s => s.show);

  // Action shortcuts
  const actionShortcuts = [
    { keys: ['Shift', 'C'], description: t('shortcuts.createCourse') || 'Create Course', show: userType === 'institution' },
    { keys: ['Shift', 'E'], description: t('shortcuts.editCourse') || 'Edit Course', show: userType === 'institution' },
    { keys: ['Shift', 'S'], description: t('shortcuts.openSettings') || 'Open Settings', show: true },
    { keys: ['/'], description: t('shortcuts.focusSearch') || 'Focus Search (Feed/Explore)', show: true },
  ].filter(s => s.show);

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleBackdropClick}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999]"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', duration: 0.3 }}
              className="bg-white dark:bg-navy-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto pointer-events-auto"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-navy-700 sticky top-0 bg-white dark:bg-navy-800 z-10">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">⌨️</span>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {t('shortcuts.title') || 'Keyboard Shortcuts'}
                  </h2>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-navy-700 rounded-lg transition-colors"
                  aria-label="Close"
                >
                  <FaTimes className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-8">
                {/* Global Shortcuts */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <span className="text-blue-500">🌐</span>
                    {t('shortcuts.global') || 'Global'}
                  </h3>
                  <div className="space-y-3">
                    {globalShortcuts.map((shortcut, i) => (
                      <ShortcutRow key={i} keys={shortcut.keys} description={shortcut.description} />
                    ))}
                  </div>
                </div>

                {/* Navigation Shortcuts */}
                {navigationShortcuts.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                      <span className="text-purple-500">🧭</span>
                      {t('shortcuts.navigation') || 'Navigation'}
                    </h3>
                    <div className="space-y-3">
                      {navigationShortcuts.map((shortcut, i) => (
                        <ShortcutRow key={i} keys={shortcut.keys} description={shortcut.description} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Shortcuts */}
                {actionShortcuts.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                      <span className="text-green-500">⚡</span>
                      {t('shortcuts.actions') || 'Actions'}
                    </h3>
                    <div className="space-y-3">
                      {actionShortcuts.map((shortcut, i) => (
                        <ShortcutRow key={i} keys={shortcut.keys} description={shortcut.description} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Pro Tips */}
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-navy-700 dark:to-navy-700 rounded-xl p-4 border border-blue-200 dark:border-navy-600">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                    <span>💡</span>
                    {t('shortcuts.proTips') || 'Pro Tips'}
                  </h4>
                  <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                    <li>• {t('shortcuts.tip1') || 'Press G then another key for quick navigation'}</li>
                    <li>• {t('shortcuts.tip2') || 'Use / to quickly search in Feed or Explore pages'}</li>
                    <li>• {t('shortcuts.tip3') || 'Shortcuts are disabled when typing in input fields'}</li>
                  </ul>
                </div>
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-gray-200 dark:border-navy-700 text-center bg-gray-50 dark:bg-navy-900/50 rounded-b-2xl">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {t('shortcuts.footerHint') || 'Press'} <Kbd>?</Kbd> {t('shortcuts.footerHint2') || 'anytime to show this help'}
                </p>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

const ShortcutRow = ({ keys, description }) => (
  <div className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50 dark:hover:bg-navy-700/50 transition-colors">
    <div className="flex items-center gap-2">
      {keys.map((key, i) => (
        <div key={i} className="flex items-center gap-2">
          <Kbd>{key}</Kbd>
          {i < keys.length - 1 && (
            <span className="text-gray-400 dark:text-gray-500 font-bold">+</span>
          )}
        </div>
      ))}
    </div>
    <span className="text-gray-700 dark:text-gray-300 text-sm">{description}</span>
  </div>
);

const Kbd = ({ children }) => (
  <kbd className="px-3 py-1.5 text-xs font-semibold text-gray-800 dark:text-gray-200 bg-white dark:bg-navy-700 border border-gray-300 dark:border-navy-600 rounded-lg shadow-sm min-w-[2rem] text-center">
    {children}
  </kbd>
);

export default KeyboardShortcutsHelp;

