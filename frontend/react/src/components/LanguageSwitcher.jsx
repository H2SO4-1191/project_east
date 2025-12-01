import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { FaGlobe, FaCheck, FaChevronDown } from 'react-icons/fa';

const LanguageSwitcher = ({ variant = 'default' }) => {
  const { i18n, t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  
  const changeLanguage = (lang) => {
    i18n.changeLanguage(lang);
    setIsOpen(false);
  };
  
  const currentLang = i18n.language || 'en';
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const languages = [
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'ar', name: 'العربية', flag: '🇮🇶' },
  ];

  const currentLanguage = languages.find(l => l.code === currentLang) || languages[0];

  // Sidebar variant - full width button with enhanced popup
  if (variant === 'sidebar') {
    return (
      <div className="relative" ref={dropdownRef}>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-navy-700"
        >
          <FaGlobe className="w-5 h-5 flex-shrink-0 text-primary-600 dark:text-teal-400" />
          <span className="flex-1 text-left font-medium">{currentLanguage.flag} {currentLanguage.name}</span>
          <motion.span
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <FaChevronDown className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          </motion.span>
        </motion.button>
        
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute bottom-full left-0 right-0 mb-2 z-50"
            >
              <div className="bg-white dark:bg-navy-800 rounded-xl shadow-2xl border border-gray-200 dark:border-navy-700 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-200 dark:border-navy-700">
                  <h4 className="text-sm font-semibold text-gray-800 dark:text-white">
                    {t('selectLanguage') || 'Select Language'}
                  </h4>
                </div>
                <div className="p-2">
                  {languages.map((lang) => (
                    <motion.button
                      key={lang.code}
                      whileHover={{ scale: 1.02, x: 4 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => changeLanguage(lang.code)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                        currentLang === lang.code 
                          ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-teal-400' 
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-navy-700'
                      }`}
                    >
                      <span className="text-2xl">{lang.flag}</span>
                      <span className="flex-1 text-left font-medium">{lang.name}</span>
                      {currentLang === lang.code && (
                        <FaCheck className="w-4 h-4 text-primary-600 dark:text-teal-400" />
                      )}
                    </motion.button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }
  
  // Default variant - compact button with dropdown
  return (
    <div className="relative" ref={dropdownRef}>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/80 dark:bg-navy-800/80 backdrop-blur-sm shadow-md hover:shadow-lg transition-all"
        title={currentLang === 'ar' ? 'Switch to English' : 'التبديل إلى العربية'}
      >
        <FaGlobe className="w-4 h-4 text-primary-600 dark:text-teal-400" />
        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          {currentLanguage.flag} {currentLang === 'ar' ? 'عربي' : 'EN'}
        </span>
        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <FaChevronDown className="w-3 h-3 text-gray-500 dark:text-gray-400" />
        </motion.span>
      </motion.button>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full mt-2 right-0 rtl:left-0 rtl:right-auto z-50"
          >
            <div className="bg-white dark:bg-navy-800 rounded-xl shadow-2xl border border-gray-200 dark:border-navy-700 overflow-hidden min-w-[160px]">
              <div className="px-4 py-2 border-b border-gray-200 dark:border-navy-700">
                <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  {t('selectLanguage') || 'Language'}
                </h4>
              </div>
              <div className="p-1">
                {languages.map((lang) => (
                  <motion.button
                    key={lang.code}
                    whileHover={{ scale: 1.02, x: 2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => changeLanguage(lang.code)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${
                      currentLang === lang.code 
                        ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-teal-400' 
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-navy-700'
            }`}
          >
                    <span className="text-lg">{lang.flag}</span>
                    <span className="flex-1 text-left text-sm font-medium">{lang.name}</span>
                    {currentLang === lang.code && (
                      <FaCheck className="w-3 h-3 text-primary-600 dark:text-teal-400" />
                    )}
                  </motion.button>
                ))}
        </div>
      </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LanguageSwitcher;
