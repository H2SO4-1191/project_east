import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaUniversity, FaCheckCircle, FaExclamationTriangle, FaUpload, FaSpinner, FaCreditCard, FaCrown, FaClock, FaCalendarAlt, FaFacebook, FaInstagram, FaTwitter, FaTiktok } from 'react-icons/fa';
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
    facebook_link: '',
    instagram_link: '',
    x_link: '',
    tiktok_link: '',
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
  const [isAddingPaymentMethod, setIsAddingPaymentMethod] = useState(false);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('3m');
  const [profileData, setProfileData] = useState(null);

  // Format date and time in 24-hour format
  const formatDateTime24 = (dateTimeString) => {
    if (!dateTimeString) return '';
    try {
      const date = new Date(dateTimeString);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');
      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    } catch {
      return dateTimeString;
    }
  };

  // Fetch institution profile data to get up_time and up_days
  useEffect(() => {
    const fetchProfile = async () => {
      if (!instituteData.isAuthenticated || !instituteData.accessToken) return;

      try {
        const data = await authService.getInstitutionProfile(instituteData.accessToken, {
          refreshToken: instituteData.refreshToken,
          onTokenRefreshed: (tokens) => {
            updateInstituteData({
              accessToken: tokens.access,
              refreshToken: tokens.refresh || instituteData.refreshToken,
            });
          },
        });

        if (data?.success && data?.data) {
          setProfileData(data.data);
        }
      } catch (error) {
        console.error('Error fetching profile data:', error);
      }
    };

    fetchProfile();
  }, [instituteData.isAuthenticated, instituteData.accessToken, instituteData.refreshToken, updateInstituteData]);

  // Populate edit form when modal opens
  useEffect(() => {
    if (showEditProfileModal && profileData) {
      setEditForm({
        first_name: profileData.first_name || '',
        last_name: profileData.last_name || '',
        title: profileData.title || '',
        location: profileData.location || '',
        phone_number: profileData.phone_number || '',
        about: profileData.about || '',
        facebook_link: profileData.facebook_link || '',
        instagram_link: profileData.instagram_link || '',
        x_link: profileData.x_link || '',
        tiktok_link: profileData.tiktok_link || '',
        profile_image: null,
        idcard_back: null,
        idcard_front: null,
        residence_front: null,
        residence_back: null,
      });
    }
  }, [showEditProfileModal, profileData]);


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

      // Username cannot be changed - removed from edit form

      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });

      toast.success(result.message || t('dashboard.settingsPage.profileUpdatedSuccess'));
      setShowEditProfileModal(false);

      // Reset form
      setEditForm({
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

  // Handle adding payment method
  const handleAddPaymentMethod = async () => {
    if (!instituteData.isVerified) {
      toast.error(t('dashboard.settingsPage.verifyFirst') || 'Please verify your account first');
      return;
    }

    setIsAddingPaymentMethod(true);

    try {
      const result = await authService.addInstitutionPaymentMethod(
        instituteData.accessToken,
        {
          refreshToken: instituteData.refreshToken,
          onTokenRefreshed: (tokens) =>
            updateInstituteData({
              accessToken: tokens.access,
              refreshToken: tokens.refresh || instituteData.refreshToken,
            }),
          onSessionExpired: () => {
            toast.error(t('common.sessionExpired') || 'Session expired. Please log in again.');
          },
        }
      );

      if (result?.success && result?.url) {
        // Open Stripe onboarding URL in new window
        const stripeWindow = window.open(result.url, '_blank', 'width=800,height=600');

        if (stripeWindow) {
          toast.success(t('dashboard.settingsPage.paymentMethodRedirect') || 'Redirecting to Stripe...');

          // Listen for window close (basic check)
          const checkClosed = setInterval(() => {
            if (stripeWindow.closed) {
              clearInterval(checkClosed);
              toast.info(t('dashboard.settingsPage.completePaymentSetup') || 'Please complete the payment setup in the Stripe window.');
            }
          }, 1000);
        } else {
          toast.error(t('dashboard.settingsPage.popupBlocked') || 'Popup blocked. Please allow popups and try again.');
        }
      } else {
        throw new Error(result?.message || 'Failed to get payment setup URL');
      }
    } catch (err) {
      console.error('Payment method error:', err);
      toast.error(err?.message || t('dashboard.settingsPage.failedToAddPaymentMethod') || 'Failed to add payment method');
    } finally {
      setIsAddingPaymentMethod(false);
    }
  };

  // Handle subscription
  const handleSubscribe = async () => {
    if (!instituteData.isVerified) {
      toast.error(t('dashboard.settingsPage.verifyFirst') || 'Please verify your account first');
      return;
    }

    if (!selectedPlan) {
      toast.error(t('dashboard.settingsPage.selectPlan') || 'Please select a subscription plan');
      return;
    }

    setIsSubscribing(true);

    try {
      const result = await authService.subscribeInstitution(
        instituteData.accessToken,
        selectedPlan,
        {
          refreshToken: instituteData.refreshToken,
          onTokenRefreshed: (tokens) =>
            updateInstituteData({
              accessToken: tokens.access,
              refreshToken: tokens.refresh || instituteData.refreshToken,
            }),
          onSessionExpired: () => {
            toast.error(t('common.sessionExpired') || 'Session expired. Please log in again.');
          },
        }
      );

      if (result?.success && result?.checkout_url) {
        // Open Stripe checkout URL in new window
        const stripeWindow = window.open(result.checkout_url, '_blank', 'width=800,height=600');

        if (stripeWindow) {
          toast.success(t('dashboard.settingsPage.subscriptionRedirect') || 'Redirecting to checkout...');

          // Listen for window close (basic check)
          const checkClosed = setInterval(() => {
            if (stripeWindow.closed) {
              clearInterval(checkClosed);
              toast.info(t('dashboard.settingsPage.completeSubscription') || 'Please complete the subscription in the checkout window.');
            }
          }, 1000);
        } else {
          toast.error(t('dashboard.settingsPage.popupBlocked') || 'Popup blocked. Please allow popups and try again.');
        }
      } else {
        throw new Error(result?.message || 'Failed to get checkout URL');
      }
    } catch (err) {
      console.error('Subscription error:', err);
      toast.error(err?.message || t('dashboard.settingsPage.failedToSubscribe') || 'Failed to subscribe');
    } finally {
      setIsSubscribing(false);
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
                {(profileData?.up_time || profileData?.up_days) && (
                  <div className="mt-2 flex flex-wrap gap-4 text-xs text-gray-500 dark:text-gray-400">
                    {profileData.up_time && (
                      <div className="flex items-center gap-1">
                        <FaClock className="w-3 h-3" />
                        <span>{t('profile.upTime') || 'Updated at'}: {formatDateTime24(profileData.up_time)}</span>
                      </div>
                    )}
                    {profileData.up_days && (
                      <div className="flex items-center gap-1">
                        <FaCalendarAlt className="w-3 h-3" />
                        <span>{t('profile.upDays') || 'Days active'}: {profileData.up_days}</span>
                      </div>
                    )}
                  </div>
                )}
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
            {instituteData.isVerified ? (
              <input
                type="text"
                value={instituteData.name || ''}
                readOnly
                className="w-full px-4 py-3 border border-gray-300 dark:border-navy-600 rounded-lg bg-gray-50 dark:bg-navy-800 text-gray-900 dark:text-white cursor-not-allowed"
              />
            ) : (
              <input
                type="text"
                value={t('dashboard.settingsPage.noInstitutionName') || 'You don\'t have a name of institution, verify your account.'}
                readOnly
                className="w-full px-4 py-3 border border-amber-300 dark:border-amber-600 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 cursor-not-allowed italic"
              />
            )}
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

        {/* Display up_time and up_days if available */}
        {(profileData?.up_time || profileData?.up_days) && (
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-navy-700">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {profileData.up_time && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-navy-800 rounded-lg">
                  <FaClock className="w-5 h-5 text-primary-600 dark:text-teal-400" />
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                      {t('profile.upTime') || 'Last Updated'}
                    </p>
                    <p className="text-sm font-medium text-gray-800 dark:text-white">
                      {formatDateTime24(profileData.up_time)}
                    </p>
                  </div>
                </div>
              )}
              {profileData.up_days && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-navy-800 rounded-lg">
                  <FaCalendarAlt className="w-5 h-5 text-primary-600 dark:text-teal-400" />
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                      {t('profile.upDays') || 'Days Active'}
                    </p>
                    <p className="text-sm font-medium text-gray-800 dark:text-white">
                      {profileData.up_days} {t('profile.days') || 'days'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </Card>

      {/* Payment Method Section */}
      {instituteData.isVerified && (
        <Card delay={0.15}>
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-xl flex items-center justify-center">
              <FaCreditCard className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-800 dark:text-white">
                {t('dashboard.settingsPage.paymentMethod') || 'Payment Method'}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t('dashboard.settingsPage.paymentMethodDescription') || 'Add a payment method to receive payments'}
              </p>
            </div>
          </div>
          <AnimatedButton
            onClick={handleAddPaymentMethod}
            disabled={isAddingPaymentMethod}
            variant="teal"
            className="w-full"
          >
            {isAddingPaymentMethod ? (
              <>
                <FaSpinner className="animate-spin mr-2" />
                {t('dashboard.settingsPage.addingPaymentMethod') || 'Setting up...'}
              </>
            ) : (
              <>
                <FaCreditCard className="mr-2" />
                {t('dashboard.settingsPage.addPaymentMethod') || 'Add Payment Method'}
              </>
            )}
          </AnimatedButton>
        </Card>
      )}

      {/* Subscription Section */}
      {instituteData.isVerified && (
        <Card delay={0.2}>
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-xl flex items-center justify-center">
              <FaCrown className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-800 dark:text-white">
                {t('dashboard.settingsPage.subscription') || 'Subscription'}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t('dashboard.settingsPage.subscriptionDescription') || 'Choose your subscription plan'}
              </p>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
                {t('dashboard.settingsPage.selectPlan') || 'Select Plan'}
              </label>
              <select
                value={selectedPlan}
                onChange={(e) => setSelectedPlan(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-navy-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all bg-white dark:bg-navy-700 text-gray-900 dark:text-white"
              >
                <option value="3m">{t('dashboard.settingsPage.plan3m') || '3 Months'}</option>
                <option value="6m">{t('dashboard.settingsPage.plan6m') || '6 Months'}</option>
                <option value="12m">{t('dashboard.settingsPage.plan12m') || '12 Months'}</option>
              </select>
            </div>
            <AnimatedButton
              onClick={handleSubscribe}
              disabled={isSubscribing}
              variant="purple"
              className="w-full"
            >
              {isSubscribing ? (
                <>
                  <FaSpinner className="animate-spin mr-2" />
                  {t('dashboard.settingsPage.processing') || 'Processing...'}
                </>
              ) : (
                <>
                  <FaCrown className="mr-2" />
                  {t('dashboard.settingsPage.subscribe') || 'Subscribe'}
                </>
              )}
            </AnimatedButton>
          </div>
        </Card>
      )}

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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
                <FaFacebook className="inline mr-2 text-blue-600" /> Facebook Link (Optional)
              </label>
              <input
                type="text"
                value={editForm.facebook_link || ''}
                onChange={(e) => setEditForm(prev => ({ ...prev, facebook_link: e.target.value }))}
                placeholder="https://facebook.com/..."
                className="w-full px-4 py-3 border border-gray-300 dark:border-navy-600 rounded-lg bg-white dark:bg-navy-800 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
                <FaInstagram className="inline mr-2 text-pink-600" /> Instagram Link (Optional)
              </label>
              <input
                type="text"
                value={editForm.instagram_link || ''}
                onChange={(e) => setEditForm(prev => ({ ...prev, instagram_link: e.target.value }))}
                placeholder="https://instagram.com/..."
                className="w-full px-4 py-3 border border-gray-300 dark:border-navy-600 rounded-lg bg-white dark:bg-navy-800 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
                <FaTwitter className="inline mr-2 text-blue-400" /> X (Twitter) Link (Optional)
              </label>
              <input
                type="text"
                value={editForm.x_link || ''}
                onChange={(e) => setEditForm(prev => ({ ...prev, x_link: e.target.value }))}
                placeholder="https://x.com/..."
                className="w-full px-4 py-3 border border-gray-300 dark:border-navy-600 rounded-lg bg-white dark:bg-navy-800 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
                <FaTiktok className="inline mr-2 text-black dark:text-white" /> TikTok Link (Optional)
              </label>
              <input
                type="text"
                value={editForm.tiktok_link || ''}
                onChange={(e) => setEditForm(prev => ({ ...prev, tiktok_link: e.target.value }))}
                placeholder="https://tiktok.com/@..."
                className="w-full px-4 py-3 border border-gray-300 dark:border-navy-600 rounded-lg bg-white dark:bg-navy-800 text-gray-900 dark:text-white"
              />
            </div>
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

