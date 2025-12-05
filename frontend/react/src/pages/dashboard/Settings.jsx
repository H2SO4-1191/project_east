import { useState } from 'react';
import { motion } from 'framer-motion';
import { FaUniversity, FaCheckCircle, FaExclamationTriangle, FaUpload, FaSpinner } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import Card from '../../components/Card';
import AnimatedButton from '../../components/AnimatedButton';
import Modal from '../../components/Modal';
import { useInstitute } from '../../context/InstituteContext';
import { authService } from '../../services/authService';
import toast from 'react-hot-toast';
import confetti from 'canvas-confetti';

const Settings = () => {
  const { instituteData, updateInstituteData } = useInstitute();
  const { t } = useTranslation();
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  
  // Verification form state
  const [verificationForm, setVerificationForm] = useState({
    title: '',
    location: '',
    phone_number: '',
    about: '',
    profile_image: null,
    idcard_back: null,
    idcard_front: null,
    residence_front: null,
    residence_back: null,
  });

  // Edit profile form state
  const [editForm, setEditForm] = useState({
    username: '',
    first_name: '',
    last_name: '',
    title: '',
    location: '',
    phone_number: '',
    about: '',
    profile_image: null,
    idcard_back: null,
    idcard_front: null,
    residence_front: null,
    residence_back: null,
  });

  const [fileValidation, setFileValidation] = useState({
    profile_image: null,
    idcard_back: null,
    idcard_front: null,
    residence_front: null,
    residence_back: null,
  });

  const [editFileValidation, setEditFileValidation] = useState({
    profile_image: null,
    idcard_back: null,
    idcard_front: null,
    residence_front: null,
    residence_back: null,
  });

  const [isValidating, setIsValidating] = useState({});
  const [isEditValidating, setIsEditValidating] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [verificationErrors, setVerificationErrors] = useState({});
  const [editErrors, setEditErrors] = useState({});


  const handleFileChange = async (fieldName, file) => {
    if (!file) return;

    // Check file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast.error(t('dashboard.settingsPage.validImageFile'));
      return;
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error(t('dashboard.settingsPage.fileSizeLimit'));
      return;
    }

    setVerificationForm(prev => ({ ...prev, [fieldName]: file }));

    // Skip AI validation for profile_image
    if (fieldName === 'profile_image') {
      setFileValidation(prev => ({
        ...prev,
        [fieldName]: {
          isValid: true,
          message: t('dashboard.settingsPage.profileImageUploaded'),
        },
      }));
      return;
    }

    setIsValidating(prev => ({ ...prev, [fieldName]: true }));
    setFileValidation(prev => ({ ...prev, [fieldName]: null }));

    try {
      const result = await authService.validateDocumentWithAI(file, instituteData.accessToken);
      
      console.log('AI validation response:', result);
      
      // Handle the actual API response format
      let confidence;
      let isValid;
      
      if (result.document_percentage !== undefined) {
        // API returns percentage (0-100)
        confidence = result.document_percentage / 100; // Convert to 0-1 scale
        isValid = result.is_document === true || confidence >= 0.7;
      } else if (result.document !== undefined) {
        // Fallback to documented format
        confidence = result.document;
        isValid = confidence >= 0.7;
      } else {
        console.error('Invalid AI response structure:', result);
        throw new Error('Invalid AI response format');
      }
      
      setFileValidation(prev => ({
        ...prev,
        [fieldName]: {
          isValid,
          confidence,
          message: isValid
            ? `${t('dashboard.settingsPage.documentVerified')} (${(confidence * 100).toFixed(0)}% ${t('dashboard.settingsPage.confidence')})`
            : `${t('dashboard.settingsPage.invalidDocument')} (${(confidence * 100).toFixed(0)}% ${t('dashboard.settingsPage.confidence')})`,
        },
      }));

      if (!isValid) {
        toast.error(t('dashboard.settingsPage.aiValidationFailed'));
      }
    } catch (err) {
      console.error('AI validation error:', err);
      
      setFileValidation(prev => ({
        ...prev,
        [fieldName]: {
          isValid: false,
          message: err?.message || t('dashboard.settingsPage.failedToValidate'),
        },
      }));
      toast.error(err?.message || t('dashboard.settingsPage.failedToValidate'));
    } finally {
      setIsValidating(prev => ({ ...prev, [fieldName]: false }));
    }
  };

  const handleVerificationSubmit = async (e) => {
    e.preventDefault();
    setVerificationErrors({});

    // Check if all required files are uploaded and validated
    const requiredFiles = ['profile_image', 'idcard_back', 'idcard_front', 'residence_front', 'residence_back'];
    const missingFiles = requiredFiles.filter(field => !verificationForm[field]);
    
    if (missingFiles.length > 0) {
      toast.error(t('dashboard.settingsPage.uploadAllRequired'));
      return;
    }

    // Check if all files passed AI validation
    const invalidFiles = requiredFiles.filter(
      field => fileValidation[field] && !fileValidation[field].isValid
    );

    if (invalidFiles.length > 0) {
      toast.error(t('dashboard.settingsPage.someDocumentsFailed'));
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await authService.verifyInstitution(
        instituteData.accessToken,
        verificationForm,
        {
          refreshToken: instituteData.refreshToken,
          onTokenRefreshed: (tokens) =>
            updateInstituteData({
              accessToken: tokens.access,
              refreshToken: tokens.refresh || instituteData.refreshToken,
            }),
        }
      );

      updateInstituteData({ isVerified: result.is_verified || true });
      
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
      });

      toast.success(result.message || t('dashboard.settingsPage.institutionVerifiedSuccess'));
      setShowVerificationModal(false);
      
      // Reset form
      setVerificationForm({
        title: '',
        location: '',
        phone_number: '',
        about: '',
        profile_image: null,
        idcard_back: null,
        idcard_front: null,
        residence_front: null,
        residence_back: null,
      });
      setFileValidation({});
    } catch (err) {
      console.error('Verification error:', err);
      
      if (err?.errors) {
        setVerificationErrors(err.errors);
      }
      
      toast.error(err?.message || t('dashboard.settingsPage.failedToVerify'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditFileChange = async (fieldName, file) => {
    if (!file) return;

    // Check file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast.error(t('dashboard.settingsPage.validImageFile'));
      return;
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error(t('dashboard.settingsPage.fileSizeLimit'));
      return;
    }

    setEditForm(prev => ({ ...prev, [fieldName]: file }));

    // Skip AI validation for profile_image
    if (fieldName === 'profile_image') {
      setEditFileValidation(prev => ({
        ...prev,
        [fieldName]: {
          isValid: true,
          message: t('dashboard.settingsPage.profileImageUploaded'),
        },
      }));
      return;
    }

    setIsEditValidating(prev => ({ ...prev, [fieldName]: true }));
    setEditFileValidation(prev => ({ ...prev, [fieldName]: null }));

    try {
      const result = await authService.validateDocumentWithAI(file, instituteData.accessToken);
      
      console.log('AI validation response (edit):', result);
      
      // Handle the actual API response format
      let confidence;
      let isValid;
      
      if (result.document_percentage !== undefined) {
        // API returns percentage (0-100)
        confidence = result.document_percentage / 100; // Convert to 0-1 scale
        isValid = result.is_document === true || confidence >= 0.7;
      } else if (result.document !== undefined) {
        // Fallback to documented format
        confidence = result.document;
        isValid = confidence >= 0.7;
      } else {
        console.error('Invalid AI response structure:', result);
        throw new Error('Invalid AI response format');
      }
      
      setEditFileValidation(prev => ({
        ...prev,
        [fieldName]: {
          isValid,
          confidence,
          message: isValid
            ? `${t('dashboard.settingsPage.documentVerified')} (${(confidence * 100).toFixed(0)}% ${t('dashboard.settingsPage.confidence')})`
            : `${t('dashboard.settingsPage.invalidDocument')} (${(confidence * 100).toFixed(0)}% ${t('dashboard.settingsPage.confidence')})`,
        },
      }));

      if (!isValid) {
        toast.error(t('dashboard.settingsPage.aiValidationFailed'));
      }
    } catch (err) {
      console.error('AI validation error (edit):', err);
      
      setEditFileValidation(prev => ({
        ...prev,
        [fieldName]: {
          isValid: false,
          message: err?.message || t('dashboard.settingsPage.failedToValidate'),
        },
      }));
      toast.error(err?.message || t('dashboard.settingsPage.failedToValidate'));
    } finally {
      setIsEditValidating(prev => ({ ...prev, [fieldName]: false }));
    }
  };

  const handleEditProfileSubmit = async (e) => {
    e.preventDefault();
    setEditErrors({});

    // Check if any files that were uploaded passed AI validation
    const fileFields = ['profile_image', 'idcard_back', 'idcard_front', 'residence_front', 'residence_back'];
    const uploadedFiles = fileFields.filter(field => editForm[field]);
    const invalidFiles = uploadedFiles.filter(
      field => editFileValidation[field] && !editFileValidation[field].isValid
    );

    if (invalidFiles.length > 0) {
      toast.error(t('dashboard.settingsPage.someDocumentsFailed'));
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await authService.editInstitutionProfile(
        instituteData.accessToken,
        editForm,
        {
          refreshToken: instituteData.refreshToken,
          onTokenRefreshed: (tokens) =>
            updateInstituteData({
              accessToken: tokens.access,
              refreshToken: tokens.refresh || instituteData.refreshToken,
            }),
        }
      );

      // Update username in context if it was changed
      if (editForm.username && editForm.username !== instituteData.username) {
        updateInstituteData({ username: editForm.username });
      }

      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });

      toast.success(result.message || t('dashboard.settingsPage.profileUpdatedSuccess'));
      setShowEditProfileModal(false);
      
      // Reset form
      setEditForm({
        username: '',
        first_name: '',
        last_name: '',
        title: '',
        location: '',
        phone_number: '',
        about: '',
        profile_image: null,
        idcard_back: null,
        idcard_front: null,
        residence_front: null,
        residence_back: null,
      });
      setEditFileValidation({});
    } catch (err) {
      console.error('Profile edit error:', err);
      
      if (err?.errors) {
        setEditErrors(err.errors);
      }
      
      toast.error(err?.message || t('dashboard.settingsPage.failedToUpdate'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">{t('dashboard.settingsPage.title')}</h2>
        <p className="text-gray-600 dark:text-gray-400">{t('dashboard.settingsPage.subtitle')}</p>
      </motion.div>

      {/* Verification Status Banner */}
      {!instituteData.isVerified && (
        <Card delay={0.05}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900 rounded-full flex items-center justify-center">
                <FaExclamationTriangle className="w-6 h-6 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <h4 className="text-lg font-semibold text-gray-800 dark:text-white">
                  {t('dashboard.settingsPage.accountNotVerified')}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {t('dashboard.settingsPage.completeVerification')}
                </p>
              </div>
            </div>
            <AnimatedButton 
              onClick={() => setShowVerificationModal(true)} 
              variant="teal"
              data-verify-button
            >
              {t('dashboard.settingsPage.verifyNow')}
            </AnimatedButton>
          </div>
        </Card>
      )}

      {instituteData.isVerified && (
        <Card delay={0.05}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                <FaCheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h4 className="text-lg font-semibold text-gray-800 dark:text-white">
                  {t('dashboard.settingsPage.accountVerified')}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {t('dashboard.settingsPage.institutionVerifiedSuccess')}
                </p>
              </div>
            </div>
            <AnimatedButton onClick={() => setShowEditProfileModal(true)} variant="secondary">
              {t('dashboard.settingsPage.editProfile')}
            </AnimatedButton>
          </div>
        </Card>
      )}

      {/* Institute Profile */}
      <Card delay={0.1}>
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-primary-600 to-teal-500 rounded-2xl flex items-center justify-center">
            <FaUniversity className="w-8 h-8 text-white" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-gray-800 dark:text-white">
              {instituteData.name}
            </h3>
            <p className="text-gray-600 dark:text-gray-400">{instituteData.email}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
              {t('dashboard.settingsPage.instituteName')}
            </label>
            <input
              type="text"
              value={instituteData.name}
              readOnly
              className="w-full px-4 py-3 border border-gray-300 dark:border-navy-600 rounded-lg bg-gray-50 dark:bg-navy-800 text-gray-900 dark:text-white cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
              {t('dashboard.settingsPage.emailAddress')}
            </label>
            <input
              type="email"
              value={instituteData.email}
              readOnly
              className="w-full px-4 py-3 border border-gray-300 dark:border-navy-600 rounded-lg bg-gray-50 dark:bg-navy-800 text-gray-900 dark:text-white cursor-not-allowed"
            />
          </div>
        </div>
      </Card>

      {/* Verification Modal */}
      <Modal
        isOpen={showVerificationModal}
        onClose={() => !isSubmitting && setShowVerificationModal(false)}
        title={t('dashboard.settingsPage.verifyYourInstitution')}
      >
        <form onSubmit={handleVerificationSubmit} className="space-y-6">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t('dashboard.settingsPage.completeAllFields')}
          </p>

          {/* Text Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
                {t('dashboard.settingsPage.institutionTitle')} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={verificationForm.title}
                onChange={(e) => setVerificationForm(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 dark:border-navy-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all bg-white dark:bg-navy-700 text-gray-900 dark:text-white"
                required
              />
              {verificationErrors.title && (
                <p className="text-red-500 text-xs mt-1">{verificationErrors.title[0]}</p>
              )}
            </div>

            <div>
              <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
                {t('dashboard.settingsPage.location')} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={verificationForm.location}
                onChange={(e) => setVerificationForm(prev => ({ ...prev, location: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 dark:border-navy-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all bg-white dark:bg-navy-700 text-gray-900 dark:text-white"
                required
              />
              {verificationErrors.location && (
                <p className="text-red-500 text-xs mt-1">{verificationErrors.location[0]}</p>
              )}
            </div>

            <div>
              <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
                {t('dashboard.settingsPage.phoneNumber')} <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                value={verificationForm.phone_number}
                onChange={(e) => setVerificationForm(prev => ({ ...prev, phone_number: e.target.value }))}
                placeholder="+9647700000000"
                className="w-full px-4 py-3 border border-gray-300 dark:border-navy-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all bg-white dark:bg-navy-700 text-gray-900 dark:text-white"
                required
              />
              {verificationErrors.phone_number && (
                <p className="text-red-500 text-xs mt-1">{verificationErrors.phone_number[0]}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
              {t('dashboard.settingsPage.aboutInstitution')} <span className="text-red-500">*</span>
            </label>
            <textarea
              value={verificationForm.about}
              onChange={(e) => setVerificationForm(prev => ({ ...prev, about: e.target.value }))}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 dark:border-navy-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all bg-white dark:bg-navy-700 text-gray-900 dark:text-white"
              required
            />
            {verificationErrors.about && (
              <p className="text-red-500 text-xs mt-1">{verificationErrors.about[0]}</p>
            )}
          </div>

          {/* File Upload Fields */}
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-800 dark:text-white">{t('dashboard.settingsPage.requiredDocuments')}</h4>
            
            {[
              { field: 'profile_image', label: t('dashboard.settingsPage.profileImage') },
              { field: 'idcard_front', label: t('dashboard.settingsPage.idCardFront') },
              { field: 'idcard_back', label: t('dashboard.settingsPage.idCardBack') },
              { field: 'residence_front', label: t('dashboard.settingsPage.residenceFront') },
              { field: 'residence_back', label: t('dashboard.settingsPage.residenceBack') },
            ].map(({ field, label }) => (
              <div key={field} className="border border-gray-300 dark:border-navy-600 rounded-lg p-4">
                <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
                  {label} <span className="text-red-500">*</span>
                </label>
                
                <div className="flex items-center gap-3">
                  <label className="flex-1 cursor-pointer">
                    <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-navy-700 rounded-lg hover:bg-gray-200 dark:hover:bg-navy-600 transition-colors">
                      <FaUpload className="text-gray-600 dark:text-gray-400" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {verificationForm[field] ? verificationForm[field].name : t('dashboard.settingsPage.chooseFile')}
                      </span>
                    </div>
                    <input
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      onChange={(e) => handleFileChange(field, e.target.files[0])}
                      className="hidden"
                      disabled={isValidating[field]}
                    />
                  </label>

                  {isValidating[field] && (
                    <FaSpinner className="animate-spin text-primary-600" />
                  )}

                  {fileValidation[field] && !isValidating[field] && (
                    <div className="flex items-center gap-2">
                      {fileValidation[field].isValid ? (
                        <FaCheckCircle className="text-green-600" />
                      ) : (
                        <FaExclamationTriangle className="text-red-600" />
                      )}
                    </div>
                  )}
                </div>

                {fileValidation[field] && (
                  <p className={`text-xs mt-2 ${fileValidation[field].isValid ? 'text-green-600' : 'text-red-600'}`}>
                    {fileValidation[field].message}
                  </p>
                )}

                {verificationErrors[field] && (
                  <p className="text-red-500 text-xs mt-1">{verificationErrors[field][0]}</p>
                )}
              </div>
            ))}
          </div>

          <div className="flex gap-4 justify-end pt-4">
            <AnimatedButton
              type="button"
              onClick={() => setShowVerificationModal(false)}
              variant="secondary"
              disabled={isSubmitting}
            >
              {t('dashboard.settingsPage.cancel')}
            </AnimatedButton>
            <AnimatedButton
              type="submit"
              variant="teal"
              disabled={isSubmitting || Object.values(isValidating).some(v => v)}
            >
              {isSubmitting ? (
                <>
                  <FaSpinner className="animate-spin mr-2" />
                  {t('dashboard.settingsPage.submitting')}
                </>
              ) : (
                t('dashboard.settingsPage.submitForVerification')
              )}
            </AnimatedButton>
          </div>
        </form>
      </Modal>

      {/* Edit Profile Modal */}
      <Modal
        isOpen={showEditProfileModal}
        onClose={() => !isSubmitting && setShowEditProfileModal(false)}
        title={t('dashboard.settingsPage.editInstitutionProfile')}
      >
        <form onSubmit={handleEditProfileSubmit} className="space-y-6">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t('dashboard.settingsPage.updateInstitutionInfo')}
          </p>

          {/* Text Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
                {t('dashboard.settingsPage.username')}
              </label>
              <input
                type="text"
                value={editForm.username}
                onChange={(e) => setEditForm(prev => ({ ...prev, username: e.target.value }))}
                placeholder={instituteData.username || t('dashboard.settingsPage.enterNewUsername')}
                className="w-full px-4 py-3 border border-gray-300 dark:border-navy-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all bg-white dark:bg-navy-700 text-gray-900 dark:text-white"
              />
              {editErrors.username && (
                <p className="text-red-500 text-xs mt-1">{editErrors.username[0]}</p>
              )}
            </div>

            <div>
              <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
                {t('dashboard.settingsPage.institutionTitle')}
              </label>
              <input
                type="text"
                value={editForm.title}
                onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder={t('dashboard.settingsPage.enterInstitutionTitle')}
                className="w-full px-4 py-3 border border-gray-300 dark:border-navy-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all bg-white dark:bg-navy-700 text-gray-900 dark:text-white"
              />
              {editErrors.title && (
                <p className="text-red-500 text-xs mt-1">{editErrors.title[0]}</p>
              )}
            </div>

            <div>
              <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
                {t('dashboard.settingsPage.firstName') || 'First Name'}
              </label>
              <input
                type="text"
                value={editForm.first_name}
                onChange={(e) => setEditForm(prev => ({ ...prev, first_name: e.target.value }))}
                placeholder={t('dashboard.settingsPage.enterFirstName') || 'Enter first name'}
                className="w-full px-4 py-3 border border-gray-300 dark:border-navy-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all bg-white dark:bg-navy-700 text-gray-900 dark:text-white"
              />
              {editErrors.first_name && (
                <p className="text-red-500 text-xs mt-1">{editErrors.first_name[0]}</p>
              )}
            </div>

            <div>
              <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
                {t('dashboard.settingsPage.lastName') || 'Last Name'}
              </label>
              <input
                type="text"
                value={editForm.last_name}
                onChange={(e) => setEditForm(prev => ({ ...prev, last_name: e.target.value }))}
                placeholder={t('dashboard.settingsPage.enterLastName') || 'Enter last name'}
                className="w-full px-4 py-3 border border-gray-300 dark:border-navy-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all bg-white dark:bg-navy-700 text-gray-900 dark:text-white"
              />
              {editErrors.last_name && (
                <p className="text-red-500 text-xs mt-1">{editErrors.last_name[0]}</p>
              )}
            </div>

            <div>
              <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
                {t('dashboard.settingsPage.location')}
              </label>
              <input
                type="text"
                value={editForm.location}
                onChange={(e) => setEditForm(prev => ({ ...prev, location: e.target.value }))}
                placeholder={t('dashboard.settingsPage.enterLocation')}
                className="w-full px-4 py-3 border border-gray-300 dark:border-navy-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all bg-white dark:bg-navy-700 text-gray-900 dark:text-white"
              />
              {editErrors.location && (
                <p className="text-red-500 text-xs mt-1">{editErrors.location[0]}</p>
              )}
            </div>

            <div>
              <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
                {t('dashboard.settingsPage.phoneNumber')}
              </label>
              <input
                type="tel"
                value={editForm.phone_number}
                onChange={(e) => setEditForm(prev => ({ ...prev, phone_number: e.target.value }))}
                placeholder="+9647700000000"
                className="w-full px-4 py-3 border border-gray-300 dark:border-navy-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all bg-white dark:bg-navy-700 text-gray-900 dark:text-white"
              />
              {editErrors.phone_number && (
                <p className="text-red-500 text-xs mt-1">{editErrors.phone_number[0]}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
              {t('dashboard.settingsPage.aboutInstitution')}
            </label>
            <textarea
              value={editForm.about}
              onChange={(e) => setEditForm(prev => ({ ...prev, about: e.target.value }))}
              rows={3}
              placeholder={t('dashboard.settingsPage.enterInstitutionDescription')}
              className="w-full px-4 py-3 border border-gray-300 dark:border-navy-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all bg-white dark:bg-navy-700 text-gray-900 dark:text-white"
            />
            {editErrors.about && (
              <p className="text-red-500 text-xs mt-1">{editErrors.about[0]}</p>
            )}
          </div>

          {/* File Upload Fields (Optional) */}
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-800 dark:text-white">
              {t('dashboard.settingsPage.updateDocuments')}
            </h4>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {t('dashboard.settingsPage.onlyUploadToUpdate')}
            </p>
            
            {[
              { field: 'profile_image', label: t('dashboard.settingsPage.profileImage') },
              { field: 'idcard_front', label: t('dashboard.settingsPage.idCardFront') },
              { field: 'idcard_back', label: t('dashboard.settingsPage.idCardBack') },
              { field: 'residence_front', label: t('dashboard.settingsPage.residenceFront') },
              { field: 'residence_back', label: t('dashboard.settingsPage.residenceBack') },
            ].map(({ field, label }) => (
              <div key={field} className="border border-gray-300 dark:border-navy-600 rounded-lg p-4">
                <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
                  {label}
                </label>
                
                <div className="flex items-center gap-3">
                  <label className="flex-1 cursor-pointer">
                    <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-navy-700 rounded-lg hover:bg-gray-200 dark:hover:bg-navy-600 transition-colors">
                      <FaUpload className="text-gray-600 dark:text-gray-400" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {editForm[field] ? editForm[field].name : t('dashboard.settingsPage.chooseFileToUpdate')}
                      </span>
                    </div>
                    <input
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      onChange={(e) => handleEditFileChange(field, e.target.files[0])}
                      className="hidden"
                      disabled={isEditValidating[field]}
                    />
                  </label>

                  {isEditValidating[field] && (
                    <FaSpinner className="animate-spin text-primary-600" />
                  )}

                  {editFileValidation[field] && !isEditValidating[field] && (
                    <div className="flex items-center gap-2">
                      {editFileValidation[field].isValid ? (
                        <FaCheckCircle className="text-green-600" />
                      ) : (
                        <FaExclamationTriangle className="text-red-600" />
                      )}
                    </div>
                  )}
                </div>

                {editFileValidation[field] && (
                  <p className={`text-xs mt-2 ${editFileValidation[field].isValid ? 'text-green-600' : 'text-red-600'}`}>
                    {editFileValidation[field].message}
                  </p>
                )}

                {editErrors[field] && (
                  <p className="text-red-500 text-xs mt-1">{editErrors[field][0]}</p>
                )}
              </div>
            ))}
          </div>

          <div className="flex gap-4 justify-end pt-4">
            <AnimatedButton
              type="button"
              onClick={() => setShowEditProfileModal(false)}
              variant="secondary"
              disabled={isSubmitting}
            >
              {t('dashboard.settingsPage.cancel')}
            </AnimatedButton>
            <AnimatedButton
              type="submit"
              variant="teal"
              disabled={isSubmitting || Object.values(isEditValidating).some(v => v)}
            >
              {isSubmitting ? (
                <>
                  <FaSpinner className="animate-spin mr-2" />
                  {t('dashboard.settingsPage.updating')}
                </>
              ) : (
                t('dashboard.settingsPage.updateProfile')
              )}
            </AnimatedButton>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Settings;

