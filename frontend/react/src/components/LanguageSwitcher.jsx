import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { FaGlobe } from 'react-icons/fa';

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();
  
  const changeLanguage = (lang) => {
    i18n.changeLanguage(lang);
  };
  
  const currentLang = i18n.language || 'en';
  
  return (
    <div className="relative group">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/80 dark:bg-navy-800/80 backdrop-blur-sm shadow-md hover:shadow-lg transition-all"
        title={currentLang === 'ar' ? 'Switch to English' : 'التبديل إلى العربية'}
      >
        <FaGlobe className="w-4 h-4 text-primary-600 dark:text-teal-400" />
        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          {currentLang === 'ar' ? 'عربي' : 'EN'}
        </span>
      </motion.button>
      
      <div className="absolute top-full mt-2 right-0 rtl:left-0 rtl:right-auto opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
        <div className="bg-white dark:bg-navy-800 rounded-lg shadow-xl border border-gray-200 dark:border-navy-700 overflow-hidden min-w-[120px]">
          <button
            onClick={() => changeLanguage('en')}
            className={`w-full px-4 py-2 text-left rtl:text-right hover:bg-primary-50 dark:hover:bg-navy-700 transition-colors ${
              currentLang === 'en' 
                ? 'bg-primary-100 dark:bg-navy-700 font-semibold text-primary-700 dark:text-teal-400' 
                : 'text-gray-700 dark:text-gray-300'
            }`}
          >
            English
          </button>
          <button
            onClick={() => changeLanguage('ar')}
            className={`w-full px-4 py-2 text-left rtl:text-right hover:bg-primary-50 dark:hover:bg-navy-700 transition-colors ${
              currentLang === 'ar' 
                ? 'bg-primary-100 dark:bg-navy-700 font-semibold text-primary-700 dark:text-teal-400' 
                : 'text-gray-700 dark:text-gray-300'
            }`}
          >
            العربية
          </button>
        </div>
      </div>
    </div>
  );
};

export default LanguageSwitcher;

