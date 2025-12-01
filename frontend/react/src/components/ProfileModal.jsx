import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { 
  FaTimes, 
  FaEnvelope, 
  FaPhone, 
  FaMapMarkerAlt, 
  FaGraduationCap,
  FaBriefcase,
  FaClock,
  FaUniversity,
  FaUserCheck,
  FaUserTimes,
  FaTools,
  FaInfoCircle,
  FaEdit,
  FaCamera,
  FaSave,
  FaArrowLeft,
  FaUser
} from 'react-icons/fa';
import { authService } from '../services/authService';
import { useInstitute } from '../context/InstituteContext';
import toast from 'react-hot-toast';

// Cities list
const CITIES = [
  'baghdad', 'basra', 'erbil', 'sulaymaniyah', 'mosul', 'najaf',
  'karbala', 'kirkuk', 'duhok', 'diyala', 'anbar', 'wasit',
  'maysan', 'dhi_qar', 'muthanna', 'qadisiyyah', 'babylon', 'saladin'
];

const ProfileModal = ({ isOpen, onClose }) => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const { instituteData, updateInstituteData } = useInstitute();
  const [profileData, setProfileData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [profileImagePreview, setProfileImagePreview] = useState(null);
  const fileInputRef = useRef(null);

  // Helper function to convert relative image URLs to full URLs
  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }
    const baseUrl = import.meta.env.VITE_API_BASE_URL?.replace(/\/+$/, '') || 'https://projecteastapi.ddns.net';
    return `${baseUrl}${imagePath.startsWith('/') ? '' : '/'}${imagePath}`;
  };

  // Fetch profile data when modal opens
  useEffect(() => {
    const fetchProfile = async () => {
      if (!isOpen || !instituteData.isAuthenticated || !instituteData.accessToken) {
        return;
      }

      setIsLoading(true);
      setError(null);
      setIsEditMode(false);

      try {
        let data;
        const options = {
          refreshToken: instituteData.refreshToken,
          onTokenRefreshed: (tokens) => {
            updateInstituteData({
              accessToken: tokens.access,
              refreshToken: tokens.refresh || instituteData.refreshToken,
            });
          },
          onSessionExpired: () => {
            setError('Session expired. Please log in again.');
          },
        };

        if (instituteData.userType === 'lecturer') {
          data = await authService.getLecturerProfile(instituteData.accessToken, options);
        } else if (instituteData.userType === 'student') {
          data = await authService.getStudentProfile(instituteData.accessToken, options);
        } else if (instituteData.userType === 'institution') {
          data = await authService.getInstitutionProfile(instituteData.accessToken, options);
        }

        if (data?.success && data?.data) {
          setProfileData(data.data);
          // Initialize edit form with current data
          setEditForm({
            first_name: data.data.first_name || '',
            last_name: data.data.last_name || '',
            phone_number: data.data.phone_number || '',
            city: data.data.city || '',
            about: data.data.about || '',
            specialty: data.data.specialty || '',
            academic_achievement: data.data.academic_achievement || '',
            skills: data.data.skills || '',
            experience: data.data.experience || '',
            free_time: data.data.free_time || '',
            // Institution-specific fields
            title: data.data.title || '',
            location: data.data.location || '',
          });
        } else {
          setError('Failed to load profile data');
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError(err?.message || 'Failed to load profile');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [isOpen, instituteData.isAuthenticated, instituteData.accessToken, instituteData.userType]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        if (isEditMode) {
          setIsEditMode(false);
        } else {
          onClose();
        }
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose, isEditMode]);

  const getCityName = (cityKey) => {
    if (!cityKey) return '';
    return t(`cities.${cityKey}`) || cityKey.charAt(0).toUpperCase() + cityKey.slice(1);
  };

  const handleInputChange = (field, value) => {
    setEditForm(prev => ({ ...prev, [field]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setEditForm(prev => ({ ...prev, profile_image: file }));
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    
    try {
      const options = {
        refreshToken: instituteData.refreshToken,
        onTokenRefreshed: (tokens) => {
          updateInstituteData({
            accessToken: tokens.access,
            refreshToken: tokens.refresh || instituteData.refreshToken,
          });
        },
        onSessionExpired: () => {
          toast.error('Session expired. Please log in again.');
        },
      };

      let result;
      if (instituteData.userType === 'lecturer') {
        result = await authService.editLecturerProfile(instituteData.accessToken, editForm, options);
      } else if (instituteData.userType === 'student') {
        result = await authService.editStudentProfile(instituteData.accessToken, editForm, options);
      } else if (instituteData.userType === 'institution') {
        result = await authService.editInstitutionProfile(instituteData.accessToken, editForm, options);
      }

      if (result?.success) {
        toast.success(t('profile.updateSuccess') || 'Profile updated successfully!');
        
        // Update local profile data
        setProfileData(prev => ({
          ...prev,
          ...editForm,
          profile_image: profileImagePreview ? profileImagePreview : prev.profile_image,
        }));
        
        // Update institute context with new name
        if (editForm.first_name || editForm.last_name) {
          updateInstituteData({
            firstName: editForm.first_name,
            lastName: editForm.last_name,
            name: `${editForm.first_name} ${editForm.last_name}`.trim(),
          });
        }
        
        setIsEditMode(false);
        setProfileImagePreview(null);
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      toast.error(err?.message || t('profile.updateError') || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    // Reset form to original data
    if (profileData) {
      setEditForm({
        first_name: profileData.first_name || '',
        last_name: profileData.last_name || '',
        phone_number: profileData.phone_number || '',
        city: profileData.city || '',
        about: profileData.about || '',
        specialty: profileData.specialty || '',
        academic_achievement: profileData.academic_achievement || '',
        skills: profileData.skills || '',
        experience: profileData.experience || '',
        free_time: profileData.free_time || '',
        // Institution-specific fields
        title: profileData.title || '',
        location: profileData.location || '',
      });
    }
    setProfileImagePreview(null);
    setIsEditMode(false);
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
            transition={{ duration: 0.3 }}
            onClick={isEditMode ? undefined : onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ 
              type: 'spring', 
              damping: 25, 
              stiffness: 300,
              duration: 0.3 
            }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div 
              className={`relative w-full max-w-2xl max-h-[90vh] overflow-hidden bg-white dark:bg-navy-800 rounded-2xl shadow-2xl pointer-events-auto ${isRTL ? 'rtl' : 'ltr'}`}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={isEditMode ? handleCancelEdit : onClose}
                className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/80 dark:bg-navy-700/80 backdrop-blur-sm shadow-lg hover:bg-white dark:hover:bg-navy-600 transition-colors"
              >
                <FaTimes className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </motion.button>

              {/* Content */}
              <div className="overflow-y-auto max-h-[90vh]">
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center py-20">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="w-12 h-12 border-4 border-primary-200 dark:border-primary-800 border-t-primary-600 dark:border-t-teal-400 rounded-full"
                    />
                    <p className="mt-4 text-gray-600 dark:text-gray-400">{t('common.loading')}</p>
                  </div>
                ) : error ? (
                  <div className="flex flex-col items-center justify-center py-20">
                    <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
                      <FaTimes className="w-8 h-8 text-red-500" />
                    </div>
                    <p className="text-red-600 dark:text-red-400 text-center mb-4">{error}</p>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={onClose}
                      className="px-6 py-2 bg-gray-200 dark:bg-navy-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium"
                    >
                      {t('common.close') || 'Close'}
                    </motion.button>
                  </div>
                ) : profileData ? (
                  <>
                    {/* Header with Profile Image */}
                    <div className="relative">
                      {/* Cover Background */}
                      <div className="h-32 bg-gradient-to-r from-primary-600 via-primary-500 to-teal-500" />
                      
                      {/* Edit Mode Header */}
                      {isEditMode && (
                        <motion.div
                          initial={{ opacity: 0, y: -20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="absolute top-4 left-4 flex items-center gap-2"
                        >
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleCancelEdit}
                            className="p-2 rounded-full bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 transition-colors"
                          >
                            <FaArrowLeft className="w-5 h-5" />
                          </motion.button>
                          <span className="text-white font-semibold">
                            {t('profile.editProfile') || 'Edit Profile'}
                          </span>
                        </motion.div>
                      )}
                      
                      {/* Profile Image */}
                      <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2">
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                          className="relative"
                        >
                          <div className="w-32 h-32 rounded-full border-4 border-white dark:border-navy-800 shadow-xl overflow-hidden bg-gray-200 dark:bg-navy-700">
                            {(profileImagePreview || profileData.profile_image) ? (
                              <img
                                src={profileImagePreview || getImageUrl(profileData.profile_image)}
                                alt="Profile"
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(profileData.first_name || 'U')}&background=0D9488&color=fff&size=128`;
                                }}
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-primary-600 to-teal-500 flex items-center justify-center">
                                <span className="text-4xl font-bold text-white">
                                  {(profileData.first_name?.[0] || profileData.title?.[0] || 'U').toUpperCase()}
                                </span>
                              </div>
                            )}
                          </div>
                          {/* Camera Button for Edit */}
                          {isEditMode && (
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => fileInputRef.current?.click()}
                              className="absolute bottom-0 right-0 p-2 bg-primary-600 hover:bg-primary-500 text-white rounded-full shadow-lg"
                            >
                              <FaCamera className="w-4 h-4" />
                            </motion.button>
                          )}
                          <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleImageChange}
                            accept="image/*"
                            className="hidden"
                          />
                        </motion.div>
                      </div>
                    </div>

                    {/* Profile Info */}
                    <div className="pt-20 pb-6 px-6">
                      <AnimatePresence mode="wait">
                        {isEditMode ? (
                          /* Edit Form */
                          <motion.div
                            key="edit-form"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.2 }}
                          >
                            {/* Name Fields */}
                            <div className="grid grid-cols-2 gap-4 mb-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                  {t('profile.firstName') || 'First Name'}
                                </label>
                                <input
                                  type="text"
                                  value={editForm.first_name}
                                  onChange={(e) => handleInputChange('first_name', e.target.value)}
                                  className="w-full px-4 py-2 border border-gray-300 dark:border-navy-600 rounded-lg bg-white dark:bg-navy-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                  {t('profile.lastName') || 'Last Name'}
                                </label>
                                <input
                                  type="text"
                                  value={editForm.last_name}
                                  onChange={(e) => handleInputChange('last_name', e.target.value)}
                                  className="w-full px-4 py-2 border border-gray-300 dark:border-navy-600 rounded-lg bg-white dark:bg-navy-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                />
                              </div>
                            </div>

                            {/* Phone */}
                            <div className="mb-4">
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                {t('profile.phone') || 'Phone'}
                              </label>
                              <input
                                type="tel"
                                value={editForm.phone_number}
                                onChange={(e) => handleInputChange('phone_number', e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-navy-600 rounded-lg bg-white dark:bg-navy-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                placeholder="+964..."
                              />
                            </div>

                            {/* City */}
                            <div className="mb-4">
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                {t('profile.city') || 'City'}
                              </label>
                              <select
                                value={editForm.city}
                                onChange={(e) => handleInputChange('city', e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-navy-600 rounded-lg bg-white dark:bg-navy-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                              >
                                <option value="">{t('citySelect') || 'Select your city'}</option>
                                {CITIES.map((city) => (
                                  <option key={city} value={city}>
                                    {t(`cities.${city}`) || city}
                                  </option>
                                ))}
                              </select>
                            </div>

                            {/* Lecturer-specific fields */}
                            {instituteData.userType === 'lecturer' && (
                              <>
                                {/* Specialty */}
                                <div className="mb-4">
                                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    {t('profile.specialty') || 'Specialty'}
                                  </label>
                                  <input
                                    type="text"
                                    value={editForm.specialty}
                                    onChange={(e) => handleInputChange('specialty', e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-navy-600 rounded-lg bg-white dark:bg-navy-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                  />
                                </div>

                                {/* Academic Achievement */}
                                <div className="mb-4">
                                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    {t('profile.academicAchievement') || 'Academic Achievement'}
                                  </label>
                                  <input
                                    type="text"
                                    value={editForm.academic_achievement}
                                    onChange={(e) => handleInputChange('academic_achievement', e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-navy-600 rounded-lg bg-white dark:bg-navy-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                    placeholder="MSc, PhD, etc."
                                  />
                                </div>

                                {/* Experience */}
                                <div className="mb-4">
                                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    {t('profile.experience') || 'Experience'} ({t('profile.years') || 'years'})
                                  </label>
                                  <input
                                    type="number"
                                    min="0"
                                    value={editForm.experience}
                                    onChange={(e) => handleInputChange('experience', e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-navy-600 rounded-lg bg-white dark:bg-navy-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                  />
                                </div>

                                {/* Skills */}
                                <div className="mb-4">
                                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    {t('profile.skills') || 'Skills'}
                                  </label>
                                  <input
                                    type="text"
                                    value={editForm.skills}
                                    onChange={(e) => handleInputChange('skills', e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-navy-600 rounded-lg bg-white dark:bg-navy-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                    placeholder="Teaching, Python, Research, etc."
                                  />
                                </div>

                                {/* Free Time */}
                                <div className="mb-4">
                                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    {t('profile.freeTime') || 'Available Time'}
                                  </label>
                                  <input
                                    type="text"
                                    value={editForm.free_time}
                                    onChange={(e) => handleInputChange('free_time', e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-navy-600 rounded-lg bg-white dark:bg-navy-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                    placeholder="09:00-14:00"
                                  />
                                </div>
                              </>
                            )}

                            {/* Institution-specific fields */}
                            {instituteData.userType === 'institution' && (
                              <>
                                {/* Institution Title */}
                                <div className="mb-4">
                                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    {t('profile.institutionTitle') || 'Institution Name'}
                                  </label>
                                  <input
                                    type="text"
                                    value={editForm.title}
                                    onChange={(e) => handleInputChange('title', e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-navy-600 rounded-lg bg-white dark:bg-navy-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                    placeholder="ProjectEast Academy"
                                  />
                                </div>

                                {/* Location */}
                                <div className="mb-4">
                                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    {t('profile.location') || 'Full Address'}
                                  </label>
                                  <input
                                    type="text"
                                    value={editForm.location}
                                    onChange={(e) => handleInputChange('location', e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-navy-600 rounded-lg bg-white dark:bg-navy-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                    placeholder="Baghdad, Al-Mansour District..."
                                  />
                                </div>
                              </>
                            )}

                            {/* About */}
                            <div className="mb-6">
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                {t('profile.about') || 'About'}
                              </label>
                              <textarea
                                value={editForm.about}
                                onChange={(e) => handleInputChange('about', e.target.value)}
                                rows={4}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-navy-600 rounded-lg bg-white dark:bg-navy-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                                placeholder={t('profile.aboutPlaceholder') || 'Tell us about yourself...'}
                              />
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-3">
                              <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={handleSave}
                                disabled={isSaving}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-primary-600 hover:bg-primary-500 disabled:bg-primary-400 text-white rounded-xl font-semibold transition-colors"
                              >
                                {isSaving ? (
                                  <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                    className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                                  />
                                ) : (
                                  <FaSave className="w-4 h-4" />
                                )}
                                {isSaving ? (t('common.saving') || 'Saving...') : (t('profile.saveChanges') || 'Save Changes')}
                              </motion.button>
                              <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={handleCancelEdit}
                                className="px-6 py-3 bg-gray-200 dark:bg-navy-700 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-300 dark:hover:bg-navy-600 transition-colors"
                              >
                                {t('common.cancel') || 'Cancel'}
                              </motion.button>
                            </div>
                          </motion.div>
                        ) : (
                          /* View Mode */
                          <motion.div
                            key="view-mode"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={{ duration: 0.2 }}
                          >
                            {/* Name & Verification */}
                            <motion.div
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.3 }}
                              className="text-center mb-6"
                            >
                              <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-1">
                                {profileData.first_name && profileData.last_name 
                                  ? `${profileData.first_name} ${profileData.last_name}`
                                  : profileData.title || profileData.username || 'User'}
                              </h2>
                              <p className="text-primary-600 dark:text-teal-400 font-medium capitalize">
                                {instituteData.userType}
                              </p>
                              
                              {/* Verification Badge */}
                              <div className="flex items-center justify-center gap-2 mt-2">
                                {profileData.is_verified ? (
                                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-sm font-medium">
                                    <FaUserCheck className="w-4 h-4" />
                                    {t('profile.verified') || 'Verified'}
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded-full text-sm font-medium">
                                    <FaUserTimes className="w-4 h-4" />
                                    {t('profile.pendingVerification') || 'Pending Verification'}
                                  </span>
                                )}
                              </div>
                            </motion.div>

                            {/* Info Grid */}
                            <motion.div
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.4 }}
                              className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6"
                            >
                              {/* Email */}
                              {profileData.email && (
                                <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-navy-900/50 rounded-xl">
                                  <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
                                    <FaEnvelope className="w-5 h-5 text-primary-600 dark:text-teal-400" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs text-gray-500 dark:text-gray-400">{t('profile.email') || 'Email'}</p>
                                    <p className="text-sm font-medium text-gray-800 dark:text-white truncate">{profileData.email}</p>
                                  </div>
                                </div>
                              )}

                              {/* Phone */}
                              {profileData.phone_number && (
                                <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-navy-900/50 rounded-xl">
                                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                                    <FaPhone className="w-5 h-5 text-green-600 dark:text-green-400" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs text-gray-500 dark:text-gray-400">{t('profile.phone') || 'Phone'}</p>
                                    <p className="text-sm font-medium text-gray-800 dark:text-white">{profileData.phone_number}</p>
                                  </div>
                                </div>
                              )}

                              {/* City */}
                              {profileData.city && (
                                <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-navy-900/50 rounded-xl">
                                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                                    <FaMapMarkerAlt className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs text-gray-500 dark:text-gray-400">{t('profile.city') || 'City'}</p>
                                    <p className="text-sm font-medium text-gray-800 dark:text-white">{getCityName(profileData.city)}</p>
                                  </div>
                                </div>
                              )}

                              {/* Specialty (Lecturer) */}
                              {profileData.specialty && (
                                <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-navy-900/50 rounded-xl">
                                  <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                                    <FaGraduationCap className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs text-gray-500 dark:text-gray-400">{t('profile.specialty') || 'Specialty'}</p>
                                    <p className="text-sm font-medium text-gray-800 dark:text-white">{profileData.specialty}</p>
                                  </div>
                                </div>
                              )}

                              {/* Academic Achievement */}
                              {profileData.academic_achievement && (
                                <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-navy-900/50 rounded-xl">
                                  <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center">
                                    <FaGraduationCap className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs text-gray-500 dark:text-gray-400">{t('profile.academicAchievement') || 'Academic Achievement'}</p>
                                    <p className="text-sm font-medium text-gray-800 dark:text-white">{profileData.academic_achievement}</p>
                                  </div>
                                </div>
                              )}

                              {/* Experience (Lecturer) */}
                              {profileData.experience !== undefined && profileData.experience !== null && (
                                <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-navy-900/50 rounded-xl">
                                  <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                                    <FaBriefcase className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs text-gray-500 dark:text-gray-400">{t('profile.experience') || 'Experience'}</p>
                                    <p className="text-sm font-medium text-gray-800 dark:text-white">
                                      {profileData.experience} {t('profile.years') || 'years'}
                                    </p>
                                  </div>
                                </div>
                              )}

                              {/* Free Time (Lecturer) */}
                              {profileData.free_time && (
                                <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-navy-900/50 rounded-xl">
                                  <div className="w-10 h-10 bg-teal-100 dark:bg-teal-900/30 rounded-lg flex items-center justify-center">
                                    <FaClock className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs text-gray-500 dark:text-gray-400">{t('profile.freeTime') || 'Available Time'}</p>
                                    <p className="text-sm font-medium text-gray-800 dark:text-white">{profileData.free_time}</p>
                                  </div>
                                </div>
                              )}

                              {/* Institution Title */}
                              {profileData.title && (
                                <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-navy-900/50 rounded-xl">
                                  <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center">
                                    <FaUniversity className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs text-gray-500 dark:text-gray-400">{t('profile.institutionTitle') || 'Institution Name'}</p>
                                    <p className="text-sm font-medium text-gray-800 dark:text-white">{profileData.title}</p>
                                  </div>
                                </div>
                              )}

                              {/* Location (Institution) */}
                              {profileData.location && (
                                <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-navy-900/50 rounded-xl md:col-span-2">
                                  <div className="w-10 h-10 bg-rose-100 dark:bg-rose-900/30 rounded-lg flex items-center justify-center">
                                    <FaMapMarkerAlt className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs text-gray-500 dark:text-gray-400">{t('profile.location') || 'Full Address'}</p>
                                    <p className="text-sm font-medium text-gray-800 dark:text-white">{profileData.location}</p>
                                  </div>
                                </div>
                              )}
                            </motion.div>

                            {/* Skills */}
                            {profileData.skills && (
                              <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5 }}
                                className="mb-6"
                              >
                                <div className="flex items-center gap-2 mb-3">
                                  <FaTools className="w-5 h-5 text-primary-600 dark:text-teal-400" />
                                  <h3 className="font-semibold text-gray-800 dark:text-white">{t('profile.skills') || 'Skills'}</h3>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  {profileData.skills.split(',').map((skill, index) => (
                                    <motion.span
                                      key={index}
                                      initial={{ opacity: 0, scale: 0.8 }}
                                      animate={{ opacity: 1, scale: 1 }}
                                      transition={{ delay: 0.5 + index * 0.05 }}
                                      className="px-3 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-teal-400 rounded-full text-sm font-medium"
                                    >
                                      {skill.trim()}
                                    </motion.span>
                                  ))}
                                </div>
                              </motion.div>
                            )}

                            {/* Institutions (Lecturer) */}
                            {profileData.institutions && profileData.institutions.length > 0 && (
                              <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.55 }}
                                className="mb-6"
                              >
                                <div className="flex items-center gap-2 mb-3">
                                  <FaUniversity className="w-5 h-5 text-primary-600 dark:text-teal-400" />
                                  <h3 className="font-semibold text-gray-800 dark:text-white">{t('profile.institutions') || 'Institutions'}</h3>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  {profileData.institutions.map((inst, index) => (
                                    <motion.span
                                      key={index}
                                      initial={{ opacity: 0, scale: 0.8 }}
                                      animate={{ opacity: 1, scale: 1 }}
                                      transition={{ delay: 0.55 + index * 0.05 }}
                                      className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-sm font-medium"
                                    >
                                      {inst}
                                    </motion.span>
                                  ))}
                                </div>
                              </motion.div>
                            )}

                            {/* About */}
                            {profileData.about && (
                              <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.6 }}
                                className="mb-6"
                              >
                                <div className="flex items-center gap-2 mb-3">
                                  <FaInfoCircle className="w-5 h-5 text-primary-600 dark:text-teal-400" />
                                  <h3 className="font-semibold text-gray-800 dark:text-white">{t('profile.about') || 'About'}</h3>
                                </div>
                                <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed bg-gray-50 dark:bg-navy-900/50 p-4 rounded-xl">
                                  {profileData.about}
                                </p>
                              </motion.div>
                            )}

                            {/* Action Buttons */}
                            <motion.div
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.65 }}
                              className="flex gap-3"
                            >
                              <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => setIsEditMode(true)}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-primary-600 hover:bg-primary-500 text-white rounded-xl font-semibold transition-colors"
                              >
                                <FaEdit className="w-4 h-4" />
                                {t('profile.editProfile') || 'Edit Profile'}
                              </motion.button>
                              <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={onClose}
                                className="px-6 py-3 bg-gray-200 dark:bg-navy-700 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-300 dark:hover:bg-navy-600 transition-colors"
                              >
                                {t('common.close') || 'Close'}
                              </motion.button>
                            </motion.div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center py-20">
                    <p className="text-gray-600 dark:text-gray-400">{t('profile.noData') || 'No profile data available'}</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ProfileModal;
