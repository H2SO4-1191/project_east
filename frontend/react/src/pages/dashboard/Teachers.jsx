import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaChalkboardTeacher, FaEnvelope, FaPhone, FaSearch, FaSync, FaExclamationTriangle, FaMapMarkerAlt, FaBriefcase, FaClock, FaTools } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import Card from '../../components/Card';
import { teachersData } from '../../data/enhancedDemoData';
import { TableSkeleton, ListEmptyState } from '../../components/Skeleton';
import { useInstitute } from '../../context/InstituteContext';
import { authService } from '../../services/authService';
import toast from 'react-hot-toast';
import Modal from '../../components/Modal';
import VerificationLock from '../../components/VerificationLock';

// Helper function to convert relative image URLs to full URLs
const getImageUrl = (imagePath) => {
  if (!imagePath) return null;
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  const baseUrl = import.meta.env.VITE_API_BASE_URL?.replace(/\/+$/, '') || 'http://127.0.0.1:8000';
  // Ensure imagePath starts with / and doesn't have duplicate /media/
  let cleanPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
  // Remove duplicate /media/ if present
  cleanPath = cleanPath.replace(/^\/media\/media\//, '/media/');
  return `${baseUrl}${cleanPath}`;
};

const FALLBACK_LECTURERS = teachersData.map((t) => ({
  id: t.id,
  first_name: t.name.split(' ')[0] || '',
  last_name: t.name.split(' ').slice(1).join(' ') || '',
  email: t.email,
  profile_image: null,
  specialty: t.subject,
  experience: parseInt(t.experience) || 0,
  active: t.status === 'Active',
  phone_number: t.phone || '',
}));

const Lecturers = () => {
  const { instituteData, updateInstituteData } = useInstitute();
  const { t } = useTranslation();
  const [lecturers, setLecturers] = useState(FALLBACK_LECTURERS);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState({
    count: 0,
    next: null,
    previous: null,
    currentPage: 1,
  });
  const [isRemote, setIsRemote] = useState(false);
  const [selectedLecturer, setSelectedLecturer] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);

  const fetchLecturers = async ({ page = 1 } = {}) => {
    if (!instituteData.accessToken) return;

    setIsLoading(true);
    setError('');

    try {
      const options = {
        refreshToken: instituteData.refreshToken,
        onTokenRefreshed: (tokens) =>
          updateInstituteData({
            accessToken: tokens.access,
            refreshToken: tokens.refresh || instituteData.refreshToken,
          }),
        onSessionExpired: () => {
          toast.error(t('common.sessionExpired') || 'Session expired. Please log in again.');
        },
      };

      const response = await authService.getInstitutionLecturersList(
        instituteData.accessToken,
        page,
        options
      );

      // Process lecturers to ensure profile_image URLs are properly formatted
      const processedLecturers = (response.results || []).map((lecturer) => ({
        ...lecturer,
        profile_image: lecturer.profile_image ? getImageUrl(lecturer.profile_image) : null,
      }));

      setLecturers(processedLecturers);
      setPagination({
        count: response.count || 0,
        next: response.next,
        previous: response.previous,
        currentPage: page,
      });
      setIsRemote(true);
    } catch (err) {
      console.error('Failed to fetch lecturers:', err);
      setError(err?.message || t('dashboard.lecturersPage.unableToLoadLecturers'));
      setLecturers(FALLBACK_LECTURERS);
      setIsRemote(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLecturers({ page: 1 });
  }, [instituteData.accessToken]);

  const filteredLecturers = useMemo(() => {
    return lecturers.filter((lecturer) => {
      const fullName = `${lecturer.first_name} ${lecturer.last_name}`.toLowerCase();
      const search = searchTerm.toLowerCase();
      return (
        fullName.includes(search) ||
        (lecturer.email || '').toLowerCase().includes(search) ||
        (lecturer.specialty || '').toLowerCase().includes(search)
      );
    });
  }, [lecturers, searchTerm]);

  const handleQuickAction = (action, lecturer) => {
    const actionText = action === 'Email sent' ? t('dashboard.lecturersPage.emailSent') : t('dashboard.lecturersPage.callInitiated');
    toast.success(`${actionText} ${t('common.for')} ${lecturer.first_name} ${lecturer.last_name}`);
  };

  const handleLecturerClick = async (lecturer) => {
    if (!lecturer.id) {
      toast.error(t('dashboard.lecturersPage.noLecturerId') || 'Lecturer ID not available');
      return;
    }

    setShowProfileModal(true);
    setIsLoadingProfile(true);
    setSelectedLecturer(null);

    try {
      const options = {
        refreshToken: instituteData.refreshToken,
        onTokenRefreshed: (tokens) =>
          updateInstituteData({
            accessToken: tokens.access,
            refreshToken: tokens.refresh || instituteData.refreshToken,
          }),
        onSessionExpired: () => {
          toast.error(t('common.sessionExpired') || 'Session expired. Please log in again.');
        },
      };

      const response = await authService.getInstitutionLecturerProfile(
        instituteData.accessToken,
        lecturer.id,
        options
      );

      if (response?.success && response?.data) {
        setSelectedLecturer(response.data);
      } else {
        toast.error(response?.message || t('dashboard.lecturersPage.failedToLoadProfile') || 'Failed to load lecturer profile');
        setShowProfileModal(false);
      }
    } catch (error) {
      console.error('Error fetching lecturer profile:', error);
      toast.error(error?.message || t('dashboard.lecturersPage.failedToLoadProfile') || 'Failed to load lecturer profile');
      setShowProfileModal(false);
    } finally {
      setIsLoadingProfile(false);
    }
  };

  // Show verification lock if not verified
  if (!instituteData.isVerified) {
    return <VerificationLock />;
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">{t('dashboard.lecturersPage.title')}</h2>
        <p className="text-gray-600 dark:text-gray-400">{t('dashboard.lecturersPage.subtitle')}</p>
      </motion.div>

      {/* Search and Refresh */}
      <Card delay={0.1}>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder={t('dashboard.lecturersPage.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-300 dark:border-navy-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all bg-white dark:bg-navy-700 text-gray-900 dark:text-white"
            />
          </div>

          <button
            onClick={() => fetchLecturers({ page: pagination.currentPage })}
            className="inline-flex items-center justify-center gap-2 px-4 py-3 bg-teal-600 hover:bg-teal-500 text-white rounded-lg transition-colors disabled:opacity-60"
            disabled={isLoading}
          >
            <FaSync className={isLoading ? 'animate-spin' : ''} />
            {t('dashboard.lecturersPage.refresh')}
          </button>
        </div>

        <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
          {t('dashboard.lecturersPage.showing')}{' '}
          <span className="font-semibold text-teal-600 dark:text-teal-400">
            {filteredLecturers.length}
          </span>{' '}
          {t('dashboard.lecturersPage.of')}{' '}
          <span className="font-semibold text-teal-600 dark:text-teal-400">
            {pagination.count || lecturers.length}
          </span>{' '}
          {t('dashboard.lecturersPage.lecturers')} {isRemote ? t('dashboard.lecturersPage.live') : t('dashboard.lecturersPage.demo')}
        </div>

        {error && (
          <div className="mt-3 flex items-center gap-2 text-sm text-amber-500 dark:text-amber-300">
            <FaExclamationTriangle />
            <span>{error}</span>
          </div>
        )}
      </Card>

      {/* Lecturers Table */}
      <Card delay={0.2}>
        {isLoading ? (
          <TableSkeleton rows={5} columns={7} />
        ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gradient-to-r from-teal-600 to-teal-700 dark:from-teal-700 dark:to-teal-800 text-white">
              <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold">{t('dashboard.lecturersPage.name')}</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">{t('dashboard.lecturersPage.id')}</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">{t('dashboard.lecturersPage.specialty')}</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">{t('dashboard.lecturersPage.experience')}</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">{t('dashboard.lecturersPage.phone')}</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">{t('dashboard.lecturersPage.status')}</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">{t('dashboard.lecturersPage.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-navy-700">
                <AnimatePresence>
                  {filteredLecturers.map((lecturer, index) => (
                <motion.tr
                      key={`${lecturer.id || 'local'}-${lecturer.email}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ backgroundColor: 'rgba(20, 184, 166, 0.05)' }}
                  className="hover:shadow-md transition-all cursor-pointer"
                  onClick={() => handleLecturerClick(lecturer)}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                          {lecturer.profile_image ? (
                            <img
                              src={lecturer.profile_image}
                              alt={`${lecturer.first_name} ${lecturer.last_name}`}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                      <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-teal-600 rounded-full flex items-center justify-center">
                        <FaChalkboardTeacher className="text-white" />
                      </div>
                          )}
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {lecturer.first_name} {lecturer.last_name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                              {lecturer.email}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                        {lecturer.id || '—'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                        {lecturer.specialty || '—'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                        {lecturer.experience ? `${lecturer.experience} ${t('dashboard.lecturersPage.years')}` : '—'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                        {lecturer.phone_number || '—'}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            lecturer.active
                          ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
                              : 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300'
                      }`}
                    >
                          {lecturer.active ? t('dashboard.lecturersPage.active') : t('dashboard.lecturersPage.inactive')}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                            onClick={() => handleQuickAction(t('dashboard.lecturersPage.emailSent'), lecturer)}
                        className="p-2 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                            title={t('dashboard.lecturersPage.sendEmail')}
                      >
                        <FaEnvelope />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                            onClick={() => handleQuickAction('Call initiated', lecturer)}
                        className="p-2 bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-300 rounded-lg hover:bg-green-200 dark:hover:bg-green-800 transition-colors"
                            title={t('dashboard.lecturersPage.call')}
                      >
                        <FaPhone />
                      </motion.button>
                    </div>
                  </td>
                </motion.tr>
              ))}
                </AnimatePresence>
            </tbody>
          </table>

            {filteredLecturers.length === 0 && (
              <ListEmptyState
                icon={FaChalkboardTeacher}
                title={t('dashboard.lecturersPage.noLecturersFound')}
                message={
                  isRemote
                    ? t('dashboard.lecturersPage.tryAdjustingSearch')
                    : t('dashboard.lecturersPage.noMatchesDemo')
                }
                actionLabel={t('dashboard.lecturersPage.refresh')}
                onAction={() => fetchLecturers({ page: 1 })}
              />
            )}
        </div>
        )}
      </Card>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 text-sm text-gray-600 dark:text-gray-400">
        <div>{isRemote ? t('dashboard.lecturersPage.liveDataFromBackend') : t('dashboard.lecturersPage.showingLocalDemoData')}</div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              const prev = Math.max(pagination.currentPage - 1, 1);
              setPagination((prevState) => ({ ...prevState, currentPage: prev }));
              fetchLecturers({ page: prev });
            }}
            disabled={!pagination.previous || isLoading || !isRemote}
            className="px-4 py-2 border border-gray-300 dark:border-navy-600 rounded-lg hover:bg-gray-100 dark:hover:bg-navy-700 disabled:opacity-50 transition-colors"
          >
            {t('dashboard.lecturersPage.previous')}
          </button>
          <span>
            {t('dashboard.lecturersPage.page')}{' '}
            <span className="font-semibold text-gray-800 dark:text-white">
              {pagination.currentPage}
            </span>
          </span>
          <button
            onClick={() => {
              const next = pagination.currentPage + 1;
              setPagination((prevState) => ({ ...prevState, currentPage: next }));
              fetchLecturers({ page: next });
            }}
            disabled={!pagination.next || isLoading || !isRemote}
            className="px-4 py-2 border border-gray-300 dark:border-navy-600 rounded-lg hover:bg-gray-100 dark:hover:bg-navy-700 disabled:opacity-50 transition-colors"
          >
            {t('dashboard.lecturersPage.next')}
          </button>
        </div>
      </div>

      {/* Lecturer Profile Modal */}
      <Modal
        isOpen={showProfileModal}
        onClose={() => {
          setShowProfileModal(false);
          setSelectedLecturer(null);
        }}
        title={t('dashboard.lecturersPage.lecturerProfile') || 'Lecturer Profile'}
        size="lg"
      >
        {isLoadingProfile ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-12 h-12 border-4 border-teal-200 dark:border-teal-800 border-t-teal-600 dark:border-t-teal-400 rounded-full animate-spin"></div>
          </div>
        ) : selectedLecturer ? (
          <div className="space-y-6">
            {/* Header with Avatar */}
            <div className="flex items-center gap-6 pb-6 border-b border-gray-200 dark:border-navy-700">
              {selectedLecturer.profile_image ? (
                <img
                  src={getImageUrl(selectedLecturer.profile_image)}
                  alt={`${selectedLecturer.first_name} ${selectedLecturer.last_name}`}
                  className="w-24 h-24 rounded-full object-cover border-4 border-teal-200 dark:border-teal-800"
                />
              ) : (
                <div className="w-24 h-24 bg-gradient-to-br from-teal-500 to-teal-600 rounded-full flex items-center justify-center">
                  <FaChalkboardTeacher className="text-white text-4xl" />
                </div>
              )}
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {selectedLecturer.first_name} {selectedLecturer.last_name}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">@{selectedLecturer.username}</p>
                <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                  {t('dashboard.lecturersPage.lecturerId') || 'Lecturer ID'}: {selectedLecturer.id}
                </p>
              </div>
            </div>

            {/* Contact Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-navy-900 rounded-lg">
                <FaEnvelope className="text-teal-600 dark:text-teal-400 mt-1" />
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t('dashboard.lecturersPage.email') || 'Email'}</p>
                  <p className="text-gray-900 dark:text-white font-medium">{selectedLecturer.email}</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-navy-900 rounded-lg">
                <FaPhone className="text-teal-600 dark:text-teal-400 mt-1" />
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t('dashboard.lecturersPage.phone') || 'Phone'}</p>
                  <p className="text-gray-900 dark:text-white font-medium">{selectedLecturer.phone_number || '—'}</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-navy-900 rounded-lg">
                <FaMapMarkerAlt className="text-teal-600 dark:text-teal-400 mt-1" />
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t('dashboard.lecturersPage.city') || 'City'}</p>
                  <p className="text-gray-900 dark:text-white font-medium capitalize">{selectedLecturer.city || '—'}</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-navy-900 rounded-lg">
                <FaBriefcase className="text-teal-600 dark:text-teal-400 mt-1" />
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t('dashboard.lecturersPage.specialty') || 'Specialty'}</p>
                  <p className="text-gray-900 dark:text-white font-medium">{selectedLecturer.specialty || '—'}</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-navy-900 rounded-lg">
                <FaBriefcase className="text-teal-600 dark:text-teal-400 mt-1" />
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t('dashboard.lecturersPage.experience') || 'Experience'}</p>
                  <p className="text-gray-900 dark:text-white font-medium">
                    {selectedLecturer.experience ? `${selectedLecturer.experience} ${t('dashboard.lecturersPage.years') || 'years'}` : '—'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-navy-900 rounded-lg">
                <FaClock className="text-teal-600 dark:text-teal-400 mt-1" />
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t('dashboard.lecturersPage.freeTime') || 'Available Time'}</p>
                  <p className="text-gray-900 dark:text-white font-medium">{selectedLecturer.free_time || '—'}</p>
                </div>
              </div>
            </div>

            {/* Academic Achievement */}
            {selectedLecturer.academic_achievement && (
              <div className="p-4 bg-teal-50 dark:bg-teal-900/20 rounded-lg border border-teal-200 dark:border-teal-800">
                <h4 className="text-sm font-semibold text-teal-900 dark:text-teal-300 mb-2">
                  {t('dashboard.lecturersPage.academicAchievement') || 'Academic Achievement'}
                </h4>
                <p className="text-gray-900 dark:text-white font-medium">{selectedLecturer.academic_achievement}</p>
              </div>
            )}

            {/* Skills */}
            {selectedLecturer.skills && (
              <div className="p-4 bg-gray-50 dark:bg-navy-900 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <FaTools className="text-teal-600 dark:text-teal-400" />
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    {t('dashboard.lecturersPage.skills') || 'Skills'}
                  </h4>
                </div>
                <p className="text-gray-600 dark:text-gray-400">{selectedLecturer.skills}</p>
              </div>
            )}

            {/* About Section */}
            {selectedLecturer.about && (
              <div className="p-4 bg-gray-50 dark:bg-navy-900 rounded-lg">
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  {t('dashboard.lecturersPage.about') || 'About'}
                </h4>
                <p className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap">{selectedLecturer.about}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            {t('dashboard.lecturersPage.noProfileData') || 'No profile data available'}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Lecturers;

