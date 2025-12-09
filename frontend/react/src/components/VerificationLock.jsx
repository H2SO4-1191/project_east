import { motion } from 'framer-motion';
import { FaLock, FaInfoCircle, FaArrowRight } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import Card from './Card';
import AnimatedButton from './AnimatedButton';

const VerificationLock = ({ title, description }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleGoToSettings = () => {
    navigate('/dashboard/settings');
  };

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card delay={0.2} className="max-w-2xl w-full">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="text-center p-8"
        >
          {/* Lock Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="flex justify-center mb-6"
          >
            <div className="relative">
              <div className="w-24 h-24 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center">
                <FaLock className="w-12 h-12 text-amber-600 dark:text-amber-400" />
              </div>
              <motion.div
                animate={{ rotate: [0, 10, -10, 10, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                className="absolute -top-2 -right-2"
              >
                <FaInfoCircle className="w-8 h-8 text-amber-500 dark:text-amber-400" />
              </motion.div>
            </div>
          </motion.div>

          {/* Title */}
          <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-4">
            {title || t('dashboard.verificationLock.title')}
          </h2>

          {/* Description */}
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 max-w-md mx-auto">
            {description || t('dashboard.verificationLock.description')}
          </p>

          {/* Additional Info */}
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-6 mb-8">
            <div className="flex items-start gap-4">
              <FaInfoCircle className="w-6 h-6 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="text-left">
                <h3 className="text-lg font-semibold text-amber-900 dark:text-amber-200 mb-2">
                  {t('dashboard.verificationLock.whyVerify')}
                </h3>
                <p className="text-amber-800 dark:text-amber-300">
                  {t('dashboard.verificationLock.whyVerifyMessage')}
                </p>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <AnimatedButton
            onClick={handleGoToSettings}
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-8 py-3 rounded-lg font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2 mx-auto"
          >
            <span>{t('dashboard.verificationLock.goToSettings')}</span>
            <FaArrowRight className="w-5 h-5" />
          </AnimatedButton>
        </motion.div>
      </Card>
    </div>
  );
};

export default VerificationLock;

