import { motion } from 'framer-motion';
import Modal from './Modal';
import { FaBook, FaUniversity, FaDollarSign, FaCheck, FaTimes, FaUser } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';

const EnrollmentConfirmationModal = ({ isOpen, onClose, onConfirm, course, studentProfile, isLoading = false }) => {
  const { t } = useTranslation();

  if (!course) return null;

  const courseName = course.title || t('feed.course') || 'Course';
  const institutionName = course.institution_name || course.institution || t('feed.institution') || 'Institution';
  const price = course.price ? parseFloat(course.price).toFixed(2) : '0.00';

  // Helper function to convert relative image URLs to full URLs
  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }
    const baseUrl = import.meta.env.VITE_API_BASE_URL?.replace(/\/+$/, '') || 'https://projecteastapi.ddns.net';
    let cleanPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
    cleanPath = cleanPath.replace(/^\/media\/media\//, '/media/');
    return `${baseUrl}${cleanPath}`;
  };

  const studentName = studentProfile?.name || 'Student';
  const studentImage = studentProfile?.profile_image ? getImageUrl(studentProfile.profile_image) : null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('feed.confirmEnrollment') || 'Confirm Enrollment'}
      size="md"
    >
      <div className="space-y-6">
        {/* Student Profile Header */}
        <div className="flex flex-col items-center gap-3 mb-4">
          <div className="relative">
            {studentImage ? (
              <img
                src={studentImage}
                alt={studentName}
                className="w-16 h-16 rounded-full object-cover border-4 border-white dark:border-navy-800 shadow-lg"
                onError={(e) => {
                  e.target.style.display = 'none';
                  if (e.target.nextSibling) {
                    e.target.nextSibling.style.display = 'flex';
                  }
                }}
              />
            ) : null}
            <div
              className={`w-16 h-16 rounded-full bg-gradient-to-br from-primary-500 to-teal-500 flex items-center justify-center border-4 border-white dark:border-navy-800 shadow-lg ${studentImage ? 'hidden' : ''}`}
            >
              <FaUser className="w-8 h-8 text-white" />
            </div>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
              {t('common.student') || t('feed.student') || 'Student'}
            </p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">
              {studentName}
            </p>
          </div>
        </div>

        {/* Enrollment Details Section */}
        <div className="bg-gradient-to-br from-primary-500 to-teal-500 rounded-xl p-6 border border-primary-200 dark:border-primary-800">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <FaBook className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-white">
              {t('feed.enrollmentDetails') || 'Enrollment Details'}
            </h3>
          </div>

          <div className="bg-white dark:bg-navy-800 rounded-lg p-4 space-y-4">
            {/* Course Name */}
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                <FaBook className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                  {t('feed.course') || 'Course'}
                </p>
                <p className="text-base font-semibold text-gray-900 dark:text-white">
                  {courseName}
                </p>
              </div>
            </div>

            {/* Institution Name */}
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                <FaUniversity className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                  {t('feed.institution') || 'Institution'}
                </p>
                <p className="text-base font-semibold text-gray-900 dark:text-white">
                  {institutionName}
                </p>
              </div>
            </div>

            {/* Price */}
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                <FaDollarSign className="w-4 h-4 text-green-600 dark:text-green-400" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                  {t('feed.price') || 'Price'}
                </p>
                <p className="text-base font-semibold text-gray-900 dark:text-white">
                  ${price}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 px-4 py-3 border-2 border-gray-300 dark:border-navy-600 text-gray-700 dark:text-gray-300 rounded-lg font-semibold hover:bg-gray-50 dark:hover:bg-navy-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <FaTimes className="w-4 h-4" />
            {t('common.cancel') || 'Cancel'}
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 px-4 py-3 bg-primary-600 hover:bg-primary-500 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>{t('feed.enrolling') || 'Enrolling...'}</span>
              </>
            ) : (
              <>
                <FaCheck className="w-4 h-4" />
                <span>{t('feed.confirm') || 'Confirm'}</span>
              </>
            )}
          </motion.button>
        </div>
      </div>
    </Modal>
  );
};

export default EnrollmentConfirmationModal;

