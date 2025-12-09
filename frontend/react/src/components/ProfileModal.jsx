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
  FaUser,
  FaSync
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
  
  // Verification modal state
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  // Lecturer verification form
  const [lecturerVerificationForm, setLecturerVerificationForm] = useState({
    phone_number: '',
    about: '',
    academic_achievement: '',
    specialty: '',
    skills: '',
    experience: '',
    free_time: '',
    profile_image: null,
    idcard_front: null,
    idcard_back: null,
    residence_front: null,
    residence_back: null,
  });
  // Institution verification form
  const [institutionVerificationForm, setInstitutionVerificationForm] = useState({
    title: '',
    location: '',
    phone_number: '',
    about: '',
    profile_image: null,
    idcard_front: null,
    idcard_back: null,
    residence_front: null,
    residence_back: null,
  });
  // Student verification form
  const [studentVerificationForm, setStudentVerificationForm] = useState({
    phone_number: '',
    about: '',
    studying_level: '',
    responsible_phone: '',
    responsible_email: '',
    profile_image: null,
    idcard_front: null,
    idcard_back: null,
    residence_front: null,
    residence_back: null,
  });
  
  // Use appropriate form based on user type
  const verificationForm = instituteData.userType === 'institution' 
    ? institutionVerificationForm 
    : instituteData.userType === 'student'
    ? studentVerificationForm
    : lecturerVerificationForm;
  
  const setVerificationForm = instituteData.userType === 'institution'
    ? setInstitutionVerificationForm
    : instituteData.userType === 'student'
    ? setStudentVerificationForm
    : setLecturerVerificationForm;

  // Document validation states for verification
  const [verificationDocumentValidation, setVerificationDocumentValidation] = useState({
    profile_image: { loading: false, isValid: null, message: null, percentage: null },
    idcard_front: { loading: false, isValid: null, message: null, percentage: null },
    idcard_back: { loading: false, isValid: null, message: null, percentage: null },
    residence_front: { loading: false, isValid: null, message: null, percentage: null },
    residence_back: { loading: false, isValid: null, message: null, percentage: null },
  });

  // Image preview states for verification
  const [verificationImagePreviews, setVerificationImagePreviews] = useState({
    profile_image: null,
    idcard_front: null,
    idcard_back: null,
    residence_front: null,
    residence_back: null,
  });

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
          // Pass verification status and username to determine which endpoint to use
          data = await authService.getLecturerProfile(instituteData.accessToken, {
            ...options,
            isVerified: instituteData.isVerified,
            username: instituteData.username,
          });
        } else if (instituteData.userType === 'student') {
          // Pass verification status and username to determine which endpoint to use
          data = await authService.getStudentProfile(instituteData.accessToken, {
            ...options,
            isVerified: instituteData.isVerified,
            username: instituteData.username,
          });
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
            username: data.data.username || '',
            title: data.data.title || '',
            location: data.data.location || '',
          });
          // Initialize verification form with current data if lecturer
          if (instituteData.userType === 'lecturer') {
            setVerificationForm({
              phone_number: data.data.phone_number || '',
              about: data.data.about || '',
              academic_achievement: data.data.academic_achievement || '',
              specialty: data.data.specialty || '',
              skills: data.data.skills || '',
              experience: data.data.experience || '',
              free_time: data.data.free_time || '',
              profile_image: null,
              idcard_front: null,
              idcard_back: null,
              residence_front: null,
              residence_back: null,
            });
          }
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
    // Check if lecturer, institution, or student is verified before allowing edit
    const isVerified = profileData?.is_verified ?? instituteData.isVerified ?? false;
    if ((instituteData.userType === 'lecturer' || instituteData.userType === 'institution' || instituteData.userType === 'student') && !isVerified) {
      toast.error(t('profile.verificationRequired') || 'You must verify your account before editing. Please complete verification first.');
      setIsEditMode(false);
      setShowVerificationModal(true);
      return;
    }

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
        
        // Refetch profile data to get latest from server
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
              setError('Session expired. Please log in again.');
            },
          };

          let updatedData;
          if (instituteData.userType === 'institution') {
            updatedData = await authService.getInstitutionProfile(instituteData.accessToken, options);
          } else if (instituteData.userType === 'lecturer') {
            updatedData = await authService.getLecturerProfile(instituteData.accessToken, {
              ...options,
              isVerified: instituteData.isVerified,
              username: instituteData.username,
            });
          } else if (instituteData.userType === 'student') {
            updatedData = await authService.getStudentProfile(instituteData.accessToken, {
              ...options,
              isVerified: instituteData.isVerified,
              username: instituteData.username,
            });
          }

          if (updatedData?.success && updatedData?.data) {
            setProfileData(updatedData.data);
          }
        } catch (err) {
          console.error('Error refetching profile after update:', err);
          // Fallback to local update if refetch fails
        setProfileData(prev => ({
          ...prev,
          ...editForm,
          profile_image: profileImagePreview ? profileImagePreview : prev.profile_image,
        }));
        }
        
        // Update institute context with new name
        if (editForm.first_name || editForm.last_name) {
          updateInstituteData({
            firstName: editForm.first_name,
            lastName: editForm.last_name,
            name: `${editForm.first_name} ${editForm.last_name}`.trim(),
          });
        }
        
        // Update username in context if changed (for institutions)
        if (instituteData.userType === 'institution' && editForm.username) {
          updateInstituteData({
            username: editForm.username,
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

  // Validate document using AI for verification
  const validateVerificationDocument = async (file, fieldName) => {
    if (!file || !instituteData.accessToken) {
      setVerificationDocumentValidation(prev => ({
        ...prev,
        [fieldName]: { loading: false, isValid: null, message: null, percentage: null }
      }));
      return;
    }

    // Set loading state
    setVerificationDocumentValidation(prev => ({
      ...prev,
      [fieldName]: { loading: true, isValid: null, message: null, percentage: null }
    }));

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
          toast.error(t('common.sessionExpired') || 'Session expired. Please log in again.');
        },
      };

      const result = await authService.checkDocument(instituteData.accessToken, file, options);

      if (result?.is_document !== undefined) {
        const isValid = result.is_document;
        const percentage = result.document_percentage || 0;
        
        setVerificationDocumentValidation(prev => ({
          ...prev,
          [fieldName]: {
            loading: false,
            isValid,
            message: isValid 
              ? `${t('profile.documentValid') || 'Document is valid'} (${percentage.toFixed(1)}%)`
              : `${t('profile.documentInvalid') || 'Document is not valid'} (${percentage.toFixed(1)}% document, ${(result.nondocument_percentage || 0).toFixed(1)}% non-document)`,
            percentage
          }
        }));

        if (!isValid) {
          toast.error(
            `${fieldName.replace('_', ' ')}: ${t('profile.documentInvalid') || 'Document validation failed'}`,
            { duration: 4000 }
          );
        } else {
          toast.success(
            `${fieldName.replace('_', ' ')}: ${t('profile.documentValid') || 'Document validated successfully'}`,
            { duration: 2000 }
          );
        }
      } else {
        throw new Error('Invalid response from document validation API');
      }
    } catch (error) {
      console.error(`Error validating document ${fieldName}:`, error);
      setVerificationDocumentValidation(prev => ({
        ...prev,
        [fieldName]: {
          loading: false,
          isValid: false,
          message: error?.message || t('profile.documentValidationError') || 'Failed to validate document',
          percentage: null
        }
      }));
      toast.error(
        `${fieldName.replace('_', ' ')}: ${error?.message || t('profile.documentValidationError') || 'Document validation failed'}`,
        { duration: 4000 }
      );
    }
  };

  const handleVerificationFileChange = async (field, file) => {
    if (instituteData.userType === 'institution') {
      setInstitutionVerificationForm(prev => ({ ...prev, [field]: file }));
    } else if (instituteData.userType === 'student') {
      setStudentVerificationForm(prev => ({ ...prev, [field]: file }));
    } else {
      setLecturerVerificationForm(prev => ({ ...prev, [field]: file }));
    }

    // Generate image preview
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setVerificationImagePreviews(prev => ({
          ...prev,
          [field]: reader.result
        }));
      };
      reader.readAsDataURL(file);
    } else {
      // Clear preview if file is removed
      setVerificationImagePreviews(prev => ({
        ...prev,
        [field]: null
      }));
    }
    
    // Validate document fields using AI (only for actual documents, not profile images)
    const documentFields = ['idcard_front', 'idcard_back', 'residence_front', 'residence_back'];
    if (documentFields.includes(field) && file) {
      await validateVerificationDocument(file, field);
    } else if (documentFields.includes(field) && !file) {
      // Clear validation state if file is removed
      setVerificationDocumentValidation(prev => ({
        ...prev,
        [field]: { loading: false, isValid: null, message: null, percentage: null }
      }));
    }
  };
  
  const handleVerificationInputChange = (field, value) => {
    if (instituteData.userType === 'institution') {
      setInstitutionVerificationForm(prev => ({ ...prev, [field]: value }));
    } else if (instituteData.userType === 'student') {
      setStudentVerificationForm(prev => ({ ...prev, [field]: value }));
    } else {
      setLecturerVerificationForm(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleVerifyAccount = async () => {
    // Validate authentication token
    if (!instituteData.accessToken || !instituteData.isAuthenticated) {
      toast.error(t('common.sessionExpired') || 'You are not authenticated. Please log in again.');
      console.error('Missing access token:', {
        hasToken: !!instituteData.accessToken,
        isAuthenticated: instituteData.isAuthenticated,
        tokenLength: instituteData.accessToken?.length
      });
      return;
    }

    const isInstitution = instituteData.userType === 'institution';
    const isStudent = instituteData.userType === 'student';
    const currentForm = isInstitution 
      ? institutionVerificationForm 
      : isStudent 
      ? studentVerificationForm 
      : lecturerVerificationForm;

    // Validate required fields based on user type
    if (isInstitution) {
      if (!currentForm.title || !currentForm.location || !currentForm.phone_number || 
          !currentForm.about || !currentForm.profile_image || !currentForm.idcard_front ||
          !currentForm.idcard_back || !currentForm.residence_front || !currentForm.residence_back) {
        toast.error(t('profile.fillAllFields') || 'Please fill in all required fields');
        return;
      }
    } else if (isStudent) {
      if (!currentForm.phone_number || !currentForm.about || !currentForm.studying_level ||
          !currentForm.profile_image || !currentForm.idcard_front ||
          !currentForm.idcard_back || !currentForm.residence_front || !currentForm.residence_back) {
        toast.error(t('profile.fillAllFields') || 'Please fill in all required fields');
        return;
      }
    } else {
      if (!currentForm.phone_number || !currentForm.about || !currentForm.academic_achievement ||
          !currentForm.specialty || !currentForm.skills || !currentForm.experience || 
          !currentForm.free_time || !currentForm.profile_image || !currentForm.idcard_front ||
          !currentForm.idcard_back || !currentForm.residence_front || !currentForm.residence_back) {
        toast.error(t('profile.fillAllFields') || 'Please fill in all required fields');
        return;
      }
    }

    // Check if all required documents are validated and valid (profile_image is not validated by AI)
    const requiredDocuments = [
      { field: 'idcard_front', name: 'ID Card Front' },
      { field: 'idcard_back', name: 'ID Card Back' },
      { field: 'residence_front', name: 'Residence Front' },
      { field: 'residence_back', name: 'Residence Back' },
    ];

    for (const doc of requiredDocuments) {
      if (currentForm[doc.field]) {
        const validation = verificationDocumentValidation[doc.field];
        if (validation.loading) {
          toast.error(t('profile.waitingForValidation') || 'Please wait for document validation to complete');
          return;
        }
        if (validation.isValid === false) {
          toast.error(`${doc.name}: ${t('profile.documentInvalid') || 'Document validation failed'}`);
          return;
        }
        if (validation.isValid === null) {
          toast.error(`${doc.name}: ${t('profile.documentNotValidated') || 'Document must be validated before submission. Please wait for validation to complete.'}`);
          return;
        }
      }
    }

    setIsVerifying(true);

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
          toast.error(t('common.sessionExpired') || 'Session expired. Please log in again.');
        },
      };

      console.log(`Verifying ${isInstitution ? 'institution' : isStudent ? 'student' : 'lecturer'} account:`, {
        hasToken: !!instituteData.accessToken,
        tokenLength: instituteData.accessToken?.length,
        tokenPreview: instituteData.accessToken ? `${instituteData.accessToken.substring(0, 20)}...` : 'none'
      });

      const result = isInstitution
        ? await authService.verifyInstitution(instituteData.accessToken, currentForm, options)
        : isStudent
        ? await authService.verifyStudent(instituteData.accessToken, currentForm, options)
        : await authService.verifyLecturer(instituteData.accessToken, currentForm, options);

      if (result?.success) {
        toast.success(result.message || t('profile.verificationSuccess') || 'Account verified successfully!');
        
        // Refetch profile data to get latest from server after verification
        try {
          const refreshOptions = {
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

          let updatedData;
          if (isInstitution) {
            updatedData = await authService.getInstitutionProfile(instituteData.accessToken, refreshOptions);
          } else {
            updatedData = await authService.getLecturerProfile(instituteData.accessToken, {
              ...refreshOptions,
              isVerified: instituteData.isVerified,
              username: instituteData.username,
            });
          }

          if (updatedData?.success && updatedData?.data) {
            setProfileData(updatedData.data);
          }
        } catch (err) {
          console.error('Error refetching profile after verification:', err);
          // Fallback to local update if refetch fails
          setProfileData(prev => ({
            ...prev,
            is_verified: true,
          }));
        }
        
        // Update institute context
        updateInstituteData({
          isVerified: true,
        });
        
        setShowVerificationModal(false);
        // Reset verification form and validation states
        if (isInstitution) {
          setInstitutionVerificationForm({
            title: '',
            location: '',
            phone_number: '',
            about: '',
            profile_image: null,
            idcard_front: null,
            idcard_back: null,
            residence_front: null,
            residence_back: null,
          });
        } else if (isStudent) {
          setStudentVerificationForm({
            phone_number: '',
            about: '',
            studying_level: '',
            responsible_phone: '',
            responsible_email: '',
            profile_image: null,
            idcard_front: null,
            idcard_back: null,
            residence_front: null,
            residence_back: null,
          });
        } else {
          setLecturerVerificationForm({
            phone_number: '',
            about: '',
            academic_achievement: '',
            specialty: '',
            skills: '',
            experience: '',
            free_time: '',
            profile_image: null,
            idcard_front: null,
            idcard_back: null,
            residence_front: null,
            residence_back: null,
          });
        }
        setVerificationDocumentValidation({
          profile_image: { loading: false, isValid: null, message: null, percentage: null },
          idcard_front: { loading: false, isValid: null, message: null, percentage: null },
          idcard_back: { loading: false, isValid: null, message: null, percentage: null },
          residence_front: { loading: false, isValid: null, message: null, percentage: null },
          residence_back: { loading: false, isValid: null, message: null, percentage: null },
        });
        // Reset image previews
        setVerificationImagePreviews({
          profile_image: null,
          idcard_front: null,
          idcard_back: null,
          residence_front: null,
          residence_back: null,
        });
      }
    } catch (err) {
      console.error('Error verifying account:', err);
      console.error('Error details:', {
        status: err?.status,
        message: err?.message,
        data: err?.data,
        fullError: err
      });
      
      let errorMessage = err?.message || t('profile.verificationError') || 'Failed to verify account';
      
      // Handle 500 Internal Server Error
      if (err?.status === 500) {
        errorMessage = err?.data?.message || err?.data?.detail || 
          t('profile.serverError') || 'Server error occurred. Please check all fields and try again.';
        
        // If there are field-specific errors, show them
        if (err?.data?.errors) {
          const errorMessages = Object.entries(err.data.errors)
            .map(([field, messages]) => {
              const fieldLabel = field.replace('_', ' ');
              const messageList = Array.isArray(messages) ? messages.join(', ') : messages;
              return `${fieldLabel}: ${messageList}`;
            })
            .join('; ');
          errorMessage = errorMessages || errorMessage;
        }
      } else if (err?.data?.errors) {
        // Handle validation errors
        const errorMessages = Object.entries(err.data.errors)
          .map(([field, messages]) => {
            const fieldLabel = field.replace('_', ' ');
            const messageList = Array.isArray(messages) ? messages.join(', ') : messages;
            return `${fieldLabel}: ${messageList}`;
          })
          .join('; ');
        errorMessage = errorMessages || errorMessage;
      } else if (err?.data?.message) {
        errorMessage = err.data.message;
      } else if (err?.data?.detail) {
        errorMessage = err.data.detail;
      }
      
      toast.error(errorMessage, { duration: 5000 });
    } finally {
      setIsVerifying(false);
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
        username: profileData.username || '',
        title: profileData.title || '',
        location: profileData.location || '',
        // Student-specific fields
        studying_level: profileData.studying_level || '',
        interesting_keywords: profileData.interesting_keywords || '',
        responsible_phone: profileData.responsible_phone || '',
        responsible_email: profileData.responsible_email || '',
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
            key="profile-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={isEditMode ? undefined : onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            key="profile-modal"
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
                                {/* Username */}
                                <div className="mb-4">
                                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    {t('profile.username') || 'Username'}
                                  </label>
                                  <input
                                    type="text"
                                    value={editForm.username || ''}
                                    onChange={(e) => handleInputChange('username', e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-navy-600 rounded-lg bg-white dark:bg-navy-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                    placeholder="username"
                                  />
                                </div>

                                {/* First Name */}
                                <div className="mb-4">
                                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    {t('profile.firstName') || 'First Name'}
                                  </label>
                                  <input
                                    type="text"
                                    value={editForm.first_name || ''}
                                    onChange={(e) => handleInputChange('first_name', e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-navy-600 rounded-lg bg-white dark:bg-navy-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                    placeholder="First Name"
                                  />
                                </div>

                                {/* Last Name */}
                                <div className="mb-4">
                                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    {t('profile.lastName') || 'Last Name'}
                                  </label>
                                  <input
                                    type="text"
                                    value={editForm.last_name || ''}
                                    onChange={(e) => handleInputChange('last_name', e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-navy-600 rounded-lg bg-white dark:bg-navy-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                    placeholder="Last Name"
                                  />
                                </div>

                                {/* Institution Title */}
                                <div className="mb-4">
                                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    {t('profile.institutionTitle') || 'Institution Title'}
                                  </label>
                                  <input
                                    type="text"
                                    value={editForm.title || ''}
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
                                    value={editForm.location || ''}
                                    onChange={(e) => handleInputChange('location', e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-navy-600 rounded-lg bg-white dark:bg-navy-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                    placeholder="Baghdad, Al-Mansour District..."
                                  />
                                </div>
                              </>
                            )}

                            {/* Student-specific fields */}
                            {instituteData.userType === 'student' && (
                              <>
                                {/* Studying Level */}
                                <div className="mb-4">
                                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    {t('profile.studyingLevel') || 'Studying Level'}
                                  </label>
                                  <select
                                    value={editForm.studying_level || ''}
                                    onChange={(e) => handleInputChange('studying_level', e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-navy-600 rounded-lg bg-white dark:bg-navy-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                  >
                                    <option value="">{t('profile.selectLevel') || 'Select level'}</option>
                                    <option value="primary">{t('profile.primary') || 'Primary'}</option>
                                    <option value="intermediate">{t('profile.intermediate') || 'Intermediate'}</option>
                                    <option value="high">{t('profile.high') || 'High school'}</option>
                                    <option value="bachelors">{t('profile.bachelors') || "Bachelor's"}</option>
                                    <option value="masters">{t('profile.masters') || "Master's"}</option>
                                    <option value="phd">{t('profile.phd') || 'PhD'}</option>
                                    <option value="none">{t('profile.none') || 'Not studying'}</option>
                                  </select>
                                </div>

                                {/* Interesting Keywords */}
                                <div className="mb-4">
                                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    {t('profile.interestingKeywords') || 'Interesting Keywords'}
                                  </label>
                                  <input
                                    type="text"
                                    value={editForm.interesting_keywords || ''}
                                    onChange={(e) => handleInputChange('interesting_keywords', e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-navy-600 rounded-lg bg-white dark:bg-navy-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                    placeholder="Physics, Math, Programming"
                                  />
                                </div>

                                {/* Responsible Phone */}
                                <div className="mb-4">
                                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    {t('profile.responsiblePhone') || 'Responsible Phone'} ({t('profile.optional') || 'Optional'})
                                  </label>
                                  <input
                                    type="tel"
                                    value={editForm.responsible_phone || ''}
                                    onChange={(e) => handleInputChange('responsible_phone', e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-navy-600 rounded-lg bg-white dark:bg-navy-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                    placeholder="+964..."
                                  />
                                </div>

                                {/* Responsible Email */}
                                <div className="mb-4">
                                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    {t('profile.responsibleEmail') || 'Responsible Email'} ({t('profile.optional') || 'Optional'})
                                  </label>
                                  <input
                                    type="email"
                                    value={editForm.responsible_email || ''}
                                    onChange={(e) => handleInputChange('responsible_email', e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-navy-600 rounded-lg bg-white dark:bg-navy-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                    placeholder="parent@example.com"
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
                                {(() => {
                                  const isVerified = profileData?.is_verified ?? instituteData.isVerified ?? false;
                                  return isVerified ? (
                                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-sm font-medium">
                                    <FaUserCheck className="w-4 h-4" />
                                    {t('profile.verified') || 'Verified'}
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded-full text-sm font-medium">
                                    <FaUserTimes className="w-4 h-4" />
                                    {t('profile.pendingVerification') || 'Pending Verification'}
                                  </span>
                                  );
                                })()}
                              </div>
                            </motion.div>

                            {/* Info Grid */}
                            <motion.div
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.4 }}
                              className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6"
                            >
                              {/* Username (Institution) */}
                              {instituteData.userType === 'institution' && profileData.username && (
                                <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-navy-900/50 rounded-xl">
                                  <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                                    <FaUser className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs text-gray-500 dark:text-gray-400">{t('profile.username') || 'Username'}</p>
                                    <p className="text-sm font-medium text-gray-800 dark:text-white">{profileData.username}</p>
                                  </div>
                                </div>
                              )}

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

                              {/* Studying Level (Student) */}
                              {profileData.studying_level && (
                                <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-navy-900/50 rounded-xl">
                                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                                    <FaGraduationCap className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs text-gray-500 dark:text-gray-400">{t('profile.studyingLevel') || 'Studying Level'}</p>
                                    <p className="text-sm font-medium text-gray-800 dark:text-white capitalize">{profileData.studying_level}</p>
                                  </div>
                                </div>
                              )}

                              {/* Responsible Phone (Student) */}
                              {profileData.responsible_phone && (
                                <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-navy-900/50 rounded-xl">
                                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                                    <FaPhone className="w-5 h-5 text-green-600 dark:text-green-400" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs text-gray-500 dark:text-gray-400">{t('profile.responsiblePhone') || 'Responsible Phone'}</p>
                                    <p className="text-sm font-medium text-gray-800 dark:text-white">{profileData.responsible_phone}</p>
                                  </div>
                                </div>
                              )}

                              {/* Responsible Email (Student) */}
                              {profileData.responsible_email && (
                                <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-navy-900/50 rounded-xl">
                                  <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                                    <FaEnvelope className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs text-gray-500 dark:text-gray-400">{t('profile.responsibleEmail') || 'Responsible Email'}</p>
                                    <p className="text-sm font-medium text-gray-800 dark:text-white truncate">{profileData.responsible_email}</p>
                                  </div>
                                </div>
                              )}
                            </motion.div>

                            {/* Skills (Lecturer) */}
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

                            {/* Interesting Keywords (Student) */}
                            {profileData.interesting_keywords && (
                              <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5 }}
                                className="mb-6"
                              >
                                <div className="flex items-center gap-2 mb-3">
                                  <FaGraduationCap className="w-5 h-5 text-primary-600 dark:text-teal-400" />
                                  <h3 className="font-semibold text-gray-800 dark:text-white">{t('profile.interestingKeywords') || 'Interesting Keywords'}</h3>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  {profileData.interesting_keywords.split(',').map((keyword, index) => (
                                    <motion.span
                                      key={index}
                                      initial={{ opacity: 0, scale: 0.8 }}
                                      animate={{ opacity: 1, scale: 1 }}
                                      transition={{ delay: 0.5 + index * 0.05 }}
                                      className="px-3 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-teal-400 rounded-full text-sm font-medium"
                                    >
                                      {keyword.trim()}
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
                              {(() => {
                                const isVerified = profileData?.is_verified ?? instituteData.isVerified ?? false;
                                const isLecturer = instituteData.userType === 'lecturer';
                                const isInstitution = instituteData.userType === 'institution';
                                const isStudent = instituteData.userType === 'student';
                                
                                if ((isLecturer || isInstitution || isStudent) && !isVerified) {
                                  return (
                              <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                      onClick={() => setShowVerificationModal(true)}
                                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-semibold transition-colors"
                                    >
                                      <FaUserCheck className="w-4 h-4" />
                                      {t('profile.verifyAccount') || 'Verify Account'}
                                    </motion.button>
                                  );
                                } else {
                                  return (
                                    <motion.button
                                      whileHover={{ scale: 1.02 }}
                                      whileTap={{ scale: 0.98 }}
                                      onClick={() => {
                                        const verified = profileData?.is_verified ?? instituteData.isVerified ?? false;
                                        if ((isLecturer || isInstitution || isStudent) && !verified) {
                                          toast.error(t('profile.verificationRequired') || 'You must verify your account before editing.');
                                          setShowVerificationModal(true);
                                        } else {
                                          setIsEditMode(true);
                                        }
                                      }}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-primary-600 hover:bg-primary-500 text-white rounded-xl font-semibold transition-colors"
                              >
                                <FaEdit className="w-4 h-4" />
                                {t('profile.editProfile') || 'Edit Profile'}
                              </motion.button>
                                  );
                                }
                              })()}
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

      {/* Verification Modal */}
      <AnimatePresence>
        {showVerificationModal && (
          <>
            <motion.div
              key="verification-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setShowVerificationModal(false);
                // Reset validation states
                setVerificationDocumentValidation({
                  profile_image: { loading: false, isValid: null, message: null, percentage: null },
                  idcard_front: { loading: false, isValid: null, message: null, percentage: null },
                  idcard_back: { loading: false, isValid: null, message: null, percentage: null },
                  residence_front: { loading: false, isValid: null, message: null, percentage: null },
                  residence_back: { loading: false, isValid: null, message: null, percentage: null },
                });
                // Reset image previews
                setVerificationImagePreviews({
                  profile_image: null,
                  idcard_front: null,
                  idcard_back: null,
                  residence_front: null,
                  residence_back: null,
                });
              }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
            />
            <motion.div
              key="verification-modal"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed inset-0 z-[60] flex items-center justify-center p-4 pointer-events-none"
            >
              <div 
                className={`relative w-full max-w-3xl max-h-[90vh] overflow-hidden bg-white dark:bg-navy-800 rounded-2xl shadow-2xl pointer-events-auto ${isRTL ? 'rtl' : 'ltr'}`}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="overflow-y-auto max-h-[90vh] p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                      {t('profile.verifyAccount') || 'Verify Your Account'}
                    </h2>
                    <motion.button
                      whileHover={{ scale: 1.1, rotate: 90 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => {
                        setShowVerificationModal(false);
                        // Reset validation states
                        setVerificationDocumentValidation({
                          profile_image: { loading: false, isValid: null, message: null, percentage: null },
                          idcard_front: { loading: false, isValid: null, message: null, percentage: null },
                          idcard_back: { loading: false, isValid: null, message: null, percentage: null },
                          residence_front: { loading: false, isValid: null, message: null, percentage: null },
                          residence_back: { loading: false, isValid: null, message: null, percentage: null },
                        });
                        // Reset image previews
                        setVerificationImagePreviews({
                          profile_image: null,
                          idcard_front: null,
                          idcard_back: null,
                          residence_front: null,
                          residence_back: null,
                        });
                      }}
                      className="p-2 rounded-full bg-gray-100 dark:bg-navy-700 hover:bg-gray-200 dark:hover:bg-navy-600 transition-colors"
                    >
                      <FaTimes className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    </motion.button>
                  </div>

                  <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
                    <p className="text-sm text-amber-800 dark:text-amber-300">
                      <strong>{t('profile.verificationRequired') || 'Verification Required'}:</strong>{' '}
                      {instituteData.userType === 'institution'
                        ? (t('profile.verificationMessageInstitution') || 'Please complete all fields below to verify your institution account. All fields are required.')
                        : instituteData.userType === 'student'
                        ? (t('profile.verificationMessageStudent') || 'Please complete all fields below to verify your student account. All fields are required.')
                        : (t('profile.verificationMessage') || 'Please complete all fields below to verify your lecturer account. All fields are required.')
                      }
                    </p>
                  </div>

                  <div className="space-y-4">
                    {instituteData.userType === 'institution' ? (
                      // Institution verification fields
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            {t('profile.institutionTitle') || 'Institution Title'} *
                          </label>
                          <input
                            type="text"
                            value={verificationForm.title || ''}
                            onChange={(e) => handleVerificationInputChange('title', e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-navy-600 rounded-lg bg-white dark:bg-navy-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-primary-500"
                            placeholder={t('profile.enterInstitutionTitle') || 'Enter institution title'}
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            {t('profile.location') || 'Location'} *
                          </label>
                          <input
                            type="text"
                            value={verificationForm.location || ''}
                            onChange={(e) => handleVerificationInputChange('location', e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-navy-600 rounded-lg bg-white dark:bg-navy-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-primary-500"
                            placeholder={t('profile.enterLocation') || 'Enter location address'}
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            {t('profile.phone') || 'Phone Number'} *
                          </label>
                          <input
                            type="tel"
                            value={verificationForm.phone_number || ''}
                            onChange={(e) => handleVerificationInputChange('phone_number', e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-navy-600 rounded-lg bg-white dark:bg-navy-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-primary-500"
                            placeholder="+964..."
                            required
                          />
                        </div>
                      </div>
                    ) : instituteData.userType === 'student' ? (
                      // Student verification fields
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            {t('profile.phone') || 'Phone Number'} *
                          </label>
                          <input
                            type="tel"
                            value={verificationForm.phone_number || ''}
                            onChange={(e) => handleVerificationInputChange('phone_number', e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-navy-600 rounded-lg bg-white dark:bg-navy-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-primary-500"
                            placeholder="+964..."
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            {t('profile.studyingLevel') || 'Studying Level'} *
                          </label>
                          <select
                            value={verificationForm.studying_level || ''}
                            onChange={(e) => handleVerificationInputChange('studying_level', e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-navy-600 rounded-lg bg-white dark:bg-navy-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-primary-500"
                            required
                          >
                            <option value="">{t('profile.selectLevel') || 'Select level'}</option>
                            <option value="primary">{t('profile.primary') || 'Primary'}</option>
                            <option value="intermediate">{t('profile.intermediate') || 'Intermediate'}</option>
                            <option value="high">{t('profile.high') || 'High school'}</option>
                            <option value="bachelors">{t('profile.bachelors') || "Bachelor's"}</option>
                            <option value="masters">{t('profile.masters') || "Master's"}</option>
                            <option value="phd">{t('profile.phd') || 'PhD'}</option>
                            <option value="none">{t('profile.none') || 'Not studying'}</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            {t('profile.responsiblePhone') || 'Responsible Phone'} ({t('profile.optional') || 'Optional'})
                          </label>
                          <input
                            type="tel"
                            value={verificationForm.responsible_phone || ''}
                            onChange={(e) => handleVerificationInputChange('responsible_phone', e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-navy-600 rounded-lg bg-white dark:bg-navy-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-primary-500"
                            placeholder="+964..."
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            {t('profile.responsibleEmail') || 'Responsible Email'} ({t('profile.optional') || 'Optional'})
                          </label>
                          <input
                            type="email"
                            value={verificationForm.responsible_email || ''}
                            onChange={(e) => handleVerificationInputChange('responsible_email', e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-navy-600 rounded-lg bg-white dark:bg-navy-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-primary-500"
                            placeholder="parent@example.com"
                          />
                        </div>
                      </div>
                    ) : (
                      // Lecturer verification fields
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            {t('profile.phone') || 'Phone Number'} *
                          </label>
                          <input
                            type="tel"
                            value={verificationForm.phone_number || ''}
                            onChange={(e) => handleVerificationInputChange('phone_number', e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-navy-600 rounded-lg bg-white dark:bg-navy-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-primary-500"
                            placeholder="+964..."
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            {t('profile.specialty') || 'Specialty'} *
                          </label>
                          <input
                            type="text"
                            value={verificationForm.specialty || ''}
                            onChange={(e) => handleVerificationInputChange('specialty', e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-navy-600 rounded-lg bg-white dark:bg-navy-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-primary-500"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            {t('profile.academicAchievement') || 'Academic Achievement'} *
                          </label>
                          <input
                            type="text"
                            value={verificationForm.academic_achievement || ''}
                            onChange={(e) => handleVerificationInputChange('academic_achievement', e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-navy-600 rounded-lg bg-white dark:bg-navy-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-primary-500"
                            placeholder="bachelors, masters, phd"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            {t('profile.experience') || 'Experience'} * ({t('profile.years') || 'years'})
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={verificationForm.experience || ''}
                            onChange={(e) => handleVerificationInputChange('experience', e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-navy-600 rounded-lg bg-white dark:bg-navy-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-primary-500"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            {t('profile.skills') || 'Skills'} *
                          </label>
                          <input
                            type="text"
                            value={verificationForm.skills || ''}
                            onChange={(e) => handleVerificationInputChange('skills', e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-navy-600 rounded-lg bg-white dark:bg-navy-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-primary-500"
                            placeholder="Python, Machine Learning, Deep Learning"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            {t('profile.freeTime') || 'Available Time'} *
                          </label>
                          <input
                            type="text"
                            value={verificationForm.free_time || ''}
                            onChange={(e) => handleVerificationInputChange('free_time', e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-navy-600 rounded-lg bg-white dark:bg-navy-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-primary-500"
                            placeholder="14:00 - 19:00"
                            required
                          />
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {instituteData.userType === 'institution' 
                          ? (t('profile.aboutInstitution') || 'About Institution') 
                          : instituteData.userType === 'student'
                          ? (t('profile.about') || 'About')
                          : (t('profile.about') || 'About')
                        } *
                      </label>
                      <textarea
                        value={verificationForm.about || ''}
                        onChange={(e) => handleVerificationInputChange('about', e.target.value)}
                        rows={4}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-navy-600 rounded-lg bg-white dark:bg-navy-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-primary-500 resize-none"
                        placeholder={instituteData.userType === 'institution'
                          ? (t('profile.aboutInstitutionPlaceholder') || 'Tell us about your institution...')
                          : instituteData.userType === 'student'
                          ? (t('profile.aboutStudentPlaceholder') || 'Tell us about yourself as a student...')
                          : (t('profile.aboutPlaceholder') || 'Tell us about yourself...')
                        }
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          {t('profile.profileImage') || 'Profile Image'} *
                        </label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleVerificationFileChange('profile_image', e.target.files[0])}
                          className="w-full px-4 py-2 border border-gray-300 dark:border-navy-600 rounded-lg bg-white dark:bg-navy-700 text-gray-800 dark:text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                          required
                        />
                        {verificationImagePreviews.profile_image && (
                          <div className="mt-3">
                            <img
                              src={verificationImagePreviews.profile_image}
                              alt="Profile Preview"
                              className="w-20 h-20 object-cover rounded-full border-2 border-primary-500 shadow-md"
                            />
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          {t('profile.idcardFront') || 'ID Card Front'} *
                        </label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleVerificationFileChange('idcard_front', e.target.files[0])}
                          className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-navy-700 text-gray-800 dark:text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 ${
                            verificationDocumentValidation.idcard_front.isValid === false
                              ? 'border-red-500 dark:border-red-500'
                              : verificationDocumentValidation.idcard_front.isValid === true
                              ? 'border-green-500 dark:border-green-500'
                              : 'border-gray-300 dark:border-navy-600'
                          }`}
                          required
                        />
                        {verificationImagePreviews.idcard_front && (
                          <div className="mt-3">
                            <img
                              src={verificationImagePreviews.idcard_front}
                              alt="ID Card Front Preview"
                              className="w-full max-w-[200px] h-auto object-cover rounded-lg border-2 border-gray-300 dark:border-navy-500 shadow-md"
                            />
                          </div>
                        )}
                        {verificationDocumentValidation.idcard_front.loading && (
                          <div className="mt-2 flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
                            <FaSync className="animate-spin" />
                            <span>{t('profile.validatingDocument') || 'Validating document...'}</span>
                          </div>
                        )}
                        {verificationDocumentValidation.idcard_front.message && !verificationDocumentValidation.idcard_front.loading && (
                          <div className={`mt-2 text-sm flex items-center gap-2 ${
                            verificationDocumentValidation.idcard_front.isValid
                              ? 'text-green-600 dark:text-green-400'
                              : 'text-red-600 dark:text-red-400'
                          }`}>
                            {verificationDocumentValidation.idcard_front.isValid ? (
                              <span className="text-green-500">✓</span>
                            ) : (
                              <span className="text-red-500">✗</span>
                            )}
                            <span>{verificationDocumentValidation.idcard_front.message}</span>
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          {t('profile.idcardBack') || 'ID Card Back'} *
                        </label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleVerificationFileChange('idcard_back', e.target.files[0])}
                          className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-navy-700 text-gray-800 dark:text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 ${
                            verificationDocumentValidation.idcard_back.isValid === false
                              ? 'border-red-500 dark:border-red-500'
                              : verificationDocumentValidation.idcard_back.isValid === true
                              ? 'border-green-500 dark:border-green-500'
                              : 'border-gray-300 dark:border-navy-600'
                          }`}
                          required
                        />
                        {verificationImagePreviews.idcard_back && (
                          <div className="mt-3">
                            <img
                              src={verificationImagePreviews.idcard_back}
                              alt="ID Card Back Preview"
                              className="w-full max-w-[200px] h-auto object-cover rounded-lg border-2 border-gray-300 dark:border-navy-500 shadow-md"
                            />
                          </div>
                        )}
                        {verificationDocumentValidation.idcard_back.loading && (
                          <div className="mt-2 flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
                            <FaSync className="animate-spin" />
                            <span>{t('profile.validatingDocument') || 'Validating document...'}</span>
                          </div>
                        )}
                        {verificationDocumentValidation.idcard_back.message && !verificationDocumentValidation.idcard_back.loading && (
                          <div className={`mt-2 text-sm flex items-center gap-2 ${
                            verificationDocumentValidation.idcard_back.isValid
                              ? 'text-green-600 dark:text-green-400'
                              : 'text-red-600 dark:text-red-400'
                          }`}>
                            {verificationDocumentValidation.idcard_back.isValid ? (
                              <span className="text-green-500">✓</span>
                            ) : (
                              <span className="text-red-500">✗</span>
                            )}
                            <span>{verificationDocumentValidation.idcard_back.message}</span>
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          {t('profile.residenceFront') || 'Residence Document (Front)'} *
                        </label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleVerificationFileChange('residence_front', e.target.files[0])}
                          className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-navy-700 text-gray-800 dark:text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 ${
                            verificationDocumentValidation.residence_front.isValid === false
                              ? 'border-red-500 dark:border-red-500'
                              : verificationDocumentValidation.residence_front.isValid === true
                              ? 'border-green-500 dark:border-green-500'
                              : 'border-gray-300 dark:border-navy-600'
                          }`}
                          required
                        />
                        {verificationImagePreviews.residence_front && (
                          <div className="mt-3">
                            <img
                              src={verificationImagePreviews.residence_front}
                              alt="Residence Front Preview"
                              className="w-full max-w-[200px] h-auto object-cover rounded-lg border-2 border-gray-300 dark:border-navy-500 shadow-md"
                            />
                          </div>
                        )}
                        {verificationDocumentValidation.residence_front.loading && (
                          <div className="mt-2 flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
                            <FaSync className="animate-spin" />
                            <span>{t('profile.validatingDocument') || 'Validating document...'}</span>
                          </div>
                        )}
                        {verificationDocumentValidation.residence_front.message && !verificationDocumentValidation.residence_front.loading && (
                          <div className={`mt-2 text-sm flex items-center gap-2 ${
                            verificationDocumentValidation.residence_front.isValid
                              ? 'text-green-600 dark:text-green-400'
                              : 'text-red-600 dark:text-red-400'
                          }`}>
                            {verificationDocumentValidation.residence_front.isValid ? (
                              <span className="text-green-500">✓</span>
                            ) : (
                              <span className="text-red-500">✗</span>
                            )}
                            <span>{verificationDocumentValidation.residence_front.message}</span>
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          {t('profile.residenceBack') || 'Residence Document (Back)'} *
                        </label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleVerificationFileChange('residence_back', e.target.files[0])}
                          className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-navy-700 text-gray-800 dark:text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 ${
                            verificationDocumentValidation.residence_back.isValid === false
                              ? 'border-red-500 dark:border-red-500'
                              : verificationDocumentValidation.residence_back.isValid === true
                              ? 'border-green-500 dark:border-green-500'
                              : 'border-gray-300 dark:border-navy-600'
                          }`}
                          required
                        />
                        {verificationImagePreviews.residence_back && (
                          <div className="mt-3">
                            <img
                              src={verificationImagePreviews.residence_back}
                              alt="Residence Back Preview"
                              className="w-full max-w-[200px] h-auto object-cover rounded-lg border-2 border-gray-300 dark:border-navy-500 shadow-md"
                            />
                          </div>
                        )}
                        {verificationDocumentValidation.residence_back.loading && (
                          <div className="mt-2 flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
                            <FaSync className="animate-spin" />
                            <span>{t('profile.validatingDocument') || 'Validating document...'}</span>
                          </div>
                        )}
                        {verificationDocumentValidation.residence_back.message && !verificationDocumentValidation.residence_back.loading && (
                          <div className={`mt-2 text-sm flex items-center gap-2 ${
                            verificationDocumentValidation.residence_back.isValid
                              ? 'text-green-600 dark:text-green-400'
                              : 'text-red-600 dark:text-red-400'
                          }`}>
                            {verificationDocumentValidation.residence_back.isValid ? (
                              <span className="text-green-500">✓</span>
                            ) : (
                              <span className="text-red-500">✗</span>
                            )}
                            <span>{verificationDocumentValidation.residence_back.message}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleVerifyAccount}
                        disabled={isVerifying}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-primary-600 hover:bg-primary-500 disabled:bg-primary-400 text-white rounded-xl font-semibold transition-colors"
                      >
                        {isVerifying ? (
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                            className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                          />
                        ) : (
                          <FaUserCheck className="w-4 h-4" />
                        )}
                        {isVerifying ? (t('common.saving') || 'Verifying...') : (t('profile.verifyAccount') || 'Verify Account')}
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          setShowVerificationModal(false);
                          // Reset validation states
                          setVerificationDocumentValidation({
                            profile_image: { loading: false, isValid: null, message: null, percentage: null },
                            idcard_front: { loading: false, isValid: null, message: null, percentage: null },
                            idcard_back: { loading: false, isValid: null, message: null, percentage: null },
                            residence_front: { loading: false, isValid: null, message: null, percentage: null },
                            residence_back: { loading: false, isValid: null, message: null, percentage: null },
                          });
                          // Reset image previews
                          setVerificationImagePreviews({
                            profile_image: null,
                            idcard_front: null,
                            idcard_back: null,
                            residence_front: null,
                            residence_back: null,
                          });
                        }}
                        disabled={isVerifying}
                        className="px-6 py-3 bg-gray-200 dark:bg-navy-700 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-300 dark:hover:bg-navy-600 transition-colors disabled:opacity-50"
                      >
                        {t('common.cancel') || 'Cancel'}
                      </motion.button>
                    </div>
                  </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
      </AnimatePresence>
    </AnimatePresence>
  );
};

export default ProfileModal;
