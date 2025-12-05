import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaBriefcase, FaSearch, FaSync, FaExclamationTriangle, FaPlus, FaEdit, FaTrash, FaUser } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/Card';
import Modal from '../../components/Modal';
import AnimatedButton from '../../components/AnimatedButton';
import { employeesData } from '../../data/enhancedDemoData';
import { TableSkeleton, ListEmptyState } from '../../components/Skeleton';
import { useInstitute } from '../../context/InstituteContext';
import { authService } from '../../services/authService';
import toast from 'react-hot-toast';

const FALLBACK_STAFF = employeesData.map((e) => ({
  id: e.id,
  first_name: e.name.split(' ')[0] || '',
  last_name: e.name.split(' ').slice(1).join(' ') || '',
  personal_image: null,
  duty: e.role,
  phone_number: e.phone || '',
  salary: 0,
  is_active: e.status === 'Active',
}));

const Staff = () => {
  const navigate = useNavigate();
  const { instituteData, updateInstituteData } = useInstitute();
  const { t } = useTranslation();
  const [staff, setStaff] = useState(FALLBACK_STAFF);
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

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showVerificationWarning, setShowVerificationWarning] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form states
  const [createForm, setCreateForm] = useState({
    first_name: '',
    last_name: '',
    phone_number: '',
    duty: '',
    salary: '',
    personal_image: null,
    idcard_front: null,
    idcard_back: null,
    residence_front: null,
    residence_back: null,
  });

  const [editForm, setEditForm] = useState({
    first_name: '',
    last_name: '',
    phone_number: '',
    duty: '',
    salary: '',
    personal_image: null,
    idcard_front: null,
    idcard_back: null,
    residence_front: null,
    residence_back: null,
  });

  // Document validation states
  const [documentValidation, setDocumentValidation] = useState({
    personal_image: { loading: false, isValid: null, message: null, percentage: null },
    idcard_front: { loading: false, isValid: null, message: null, percentage: null },
    idcard_back: { loading: false, isValid: null, message: null, percentage: null },
    residence_front: { loading: false, isValid: null, message: null, percentage: null },
    residence_back: { loading: false, isValid: null, message: null, percentage: null },
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

  // Check verification before operations
  const checkVerification = (operation) => {
    if (!instituteData.isVerified) {
      setShowVerificationWarning(true);
      return false;
    }
    return true;
  };

  const fetchStaff = async ({ page = 1 } = {}) => {
    if (!instituteData.accessToken) return;

    setIsLoading(true);
    setError('');

    try {
      const params = new URLSearchParams({ page: page.toString() });
      const response = await authService.getProtected(
        `/institution/staff-list/?${params}`,
        instituteData.accessToken,
        {
          refreshToken: instituteData.refreshToken,
          onTokenRefreshed: (tokens) =>
            updateInstituteData({
              accessToken: tokens.access,
              refreshToken: tokens.refresh || instituteData.refreshToken,
            }),
        }
      );

      setStaff(response.results || []);
      setPagination({
        count: response.count || 0,
        next: response.next,
        previous: response.previous,
        currentPage: page,
      });
      setIsRemote(true);
    } catch (err) {
      console.error('Failed to fetch staff:', err);
      setError(err?.message || t('dashboard.staffPage.unableToLoadStaff'));
      setStaff(FALLBACK_STAFF);
      setIsRemote(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff({ page: 1 });
  }, [instituteData.accessToken]);

  const filteredStaff = useMemo(() => {
    return staff.filter((member) => {
      const fullName = `${member.first_name} ${member.last_name}`.toLowerCase();
      const search = searchTerm.toLowerCase();
      return (
        fullName.includes(search) ||
        (member.duty || '').toLowerCase().includes(search) ||
        (member.phone_number || '').toLowerCase().includes(search)
      );
    });
  }, [staff, searchTerm]);

  // Handle create staff
  const handleCreateStaff = async (e) => {
    e.preventDefault();

    if (!checkVerification('create')) return;

    // Validate required fields
    if (!createForm.first_name || !createForm.last_name || !createForm.phone_number || !createForm.duty || !createForm.salary || !createForm.personal_image) {
      toast.error(t('dashboard.fillRequiredFields') || 'Please fill in all required fields');
      return;
    }

    // Check if required document (personal_image) is validated and valid
    if (createForm.personal_image) {
      const personalImageValidation = documentValidation.personal_image;
      if (personalImageValidation.loading) {
        toast.error(t('dashboard.staffPage.waitingForValidation') || 'Please wait for document validation to complete');
        return;
      }
      if (personalImageValidation.isValid === false) {
        toast.error(t('dashboard.staffPage.personalImageInvalid') || 'Personal image failed document validation. Please upload a valid document.');
        return;
      }
      if (personalImageValidation.isValid === null) {
        toast.error(t('dashboard.staffPage.personalImageNotValidated') || 'Personal image must be validated before submission. Please wait for validation to complete.');
        return;
      }
    }

    // Check optional documents - if provided, they must be valid
    const optionalDocuments = [
      { field: 'idcard_front', name: 'ID Card Front' },
      { field: 'idcard_back', name: 'ID Card Back' },
      { field: 'residence_front', name: 'Residence Front' },
      { field: 'residence_back', name: 'Residence Back' },
    ];

    for (const doc of optionalDocuments) {
      if (createForm[doc.field]) {
        const validation = documentValidation[doc.field];
        if (validation.loading) {
          toast.error(t('dashboard.staffPage.waitingForValidation') || 'Please wait for document validation to complete');
          return;
        }
        if (validation.isValid === false) {
          toast.error(`${doc.name}: ${t('dashboard.staffPage.documentInvalid') || 'Document validation failed'}`);
          return;
        }
      }
    }

    setIsCreating(true);

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

      const result = await authService.createStaff(
        instituteData.accessToken,
        {
          first_name: createForm.first_name.trim(),
          last_name: createForm.last_name.trim(),
          phone_number: createForm.phone_number.trim(),
          duty: createForm.duty.trim(),
          salary: parseFloat(createForm.salary),
          personal_image: createForm.personal_image,
          idcard_front: createForm.idcard_front,
          idcard_back: createForm.idcard_back,
          residence_front: createForm.residence_front,
          residence_back: createForm.residence_back,
        },
        options
      );

      if (result?.success) {
        toast.success(result.message || t('dashboard.staffPage.staffCreated') || 'Staff member added successfully!');
        setShowCreateModal(false);
        setCreateForm({
          first_name: '',
          last_name: '',
          phone_number: '',
          duty: '',
          salary: '',
          personal_image: null,
          idcard_front: null,
          idcard_back: null,
          residence_front: null,
          residence_back: null,
        });
        // Reset validation states
        setDocumentValidation({
          personal_image: { loading: false, isValid: null, message: null, percentage: null },
          idcard_front: { loading: false, isValid: null, message: null, percentage: null },
          idcard_back: { loading: false, isValid: null, message: null, percentage: null },
          residence_front: { loading: false, isValid: null, message: null, percentage: null },
          residence_back: { loading: false, isValid: null, message: null, percentage: null },
        });
        // Refresh staff list
        await fetchStaff({ page: pagination.currentPage });
      } else {
        toast.error(result?.message || t('dashboard.staffPage.staffCreateError') || 'Failed to create staff member');
      }
    } catch (error) {
      console.error('Error creating staff:', error);
      let errorMessage = t('dashboard.staffPage.staffCreateError') || 'Failed to create staff member';
      
      if (error?.data?.errors) {
        const errorMessages = Object.entries(error.data.errors)
          .map(([field, messages]) => {
            const fieldLabel = field === 'first_name' ? t('dashboard.staffPage.firstName') || 'First Name' :
                              field === 'last_name' ? t('dashboard.staffPage.lastName') || 'Last Name' :
                              field === 'phone_number' ? t('dashboard.staffPage.phone') || 'Phone' :
                              field === 'duty' ? t('dashboard.staffPage.duty') || 'Duty' :
                              field === 'salary' ? t('dashboard.staffPage.salary') || 'Salary' :
                              field === 'personal_image' ? t('dashboard.staffPage.personalImage') || 'Personal Image' : field;
            const messageList = Array.isArray(messages) ? messages.join(', ') : messages;
            return `${fieldLabel}: ${messageList}`;
          })
          .join('; ');
        errorMessage = errorMessages || errorMessage;
      } else if (error?.message) {
        errorMessage = error.message;
      } else if (error?.data?.message) {
        errorMessage = error.data.message;
      }
      
      toast.error(errorMessage);
    } finally {
      setIsCreating(false);
    }
  };

  // Handle view staff profile
  const handleViewStaff = async (staffId) => {
    if (!checkVerification('view')) return;

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

      const result = await authService.getStaffDetails(instituteData.accessToken, staffId, options);
      
      if (result?.success && result?.data) {
        setSelectedStaff(result.data);
        setShowViewModal(true);
      } else {
        toast.error(result?.message || t('dashboard.staffPage.staffNotFound') || 'Staff member not found');
      }
    } catch (error) {
      console.error('Error fetching staff details:', error);
      toast.error(error?.message || t('dashboard.staffPage.unableToLoadStaffDetails') || 'Unable to load staff details');
    }
  };

  // Handle edit staff
  const handleEditStaff = async (staffId) => {
    if (!checkVerification('edit')) return;

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

      const result = await authService.getStaffDetails(instituteData.accessToken, staffId, options);
      
      if (result?.success && result?.data) {
        const staffData = result.data;
        setSelectedStaff(staffData);
        setEditForm({
          first_name: staffData.first_name || '',
          last_name: staffData.last_name || '',
          phone_number: staffData.phone_number || '',
          duty: staffData.duty || '',
          salary: staffData.salary || '',
          personal_image: null,
          idcard_front: null,
          idcard_back: null,
          residence_front: null,
          residence_back: null,
        });
        setShowEditModal(true);
      } else {
        toast.error(result?.message || t('dashboard.staffPage.staffNotFound') || 'Staff member not found');
      }
    } catch (error) {
      console.error('Error fetching staff details for edit:', error);
      toast.error(error?.message || t('dashboard.staffPage.unableToLoadStaffDetails') || 'Unable to load staff details');
    }
  };

  // Handle update staff
  const handleUpdateStaff = async (e) => {
    e.preventDefault();

    if (!selectedStaff || !selectedStaff.id) {
      toast.error(t('dashboard.staffPage.noStaffSelected') || 'No staff member selected');
      return;
    }

    setIsEditing(true);

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

      const payload = {};
      if (editForm.first_name) payload.first_name = editForm.first_name.trim();
      if (editForm.last_name) payload.last_name = editForm.last_name.trim();
      if (editForm.phone_number) payload.phone_number = editForm.phone_number.trim();
      if (editForm.duty) payload.duty = editForm.duty.trim();
      if (editForm.salary !== '' && editForm.salary !== undefined) payload.salary = parseFloat(editForm.salary);
      if (editForm.personal_image) payload.personal_image = editForm.personal_image;
      if (editForm.idcard_front) payload.idcard_front = editForm.idcard_front;
      if (editForm.idcard_back) payload.idcard_back = editForm.idcard_back;
      if (editForm.residence_front) payload.residence_front = editForm.residence_front;
      if (editForm.residence_back) payload.residence_back = editForm.residence_back;

      const result = await authService.editStaff(
        instituteData.accessToken,
        selectedStaff.id,
        payload,
        options
      );

      if (result?.success) {
        toast.success(result.message || t('dashboard.staffPage.staffUpdated') || 'Staff member updated successfully!');
        setShowEditModal(false);
        setSelectedStaff(null);
        setEditForm({
          first_name: '',
          last_name: '',
          phone_number: '',
          duty: '',
          salary: '',
          personal_image: null,
          idcard_front: null,
          idcard_back: null,
          residence_front: null,
          residence_back: null,
        });
        // Refresh staff list
        await fetchStaff({ page: pagination.currentPage });
      } else {
        toast.error(result?.message || t('dashboard.staffPage.staffUpdateError') || 'Failed to update staff member');
      }
    } catch (error) {
      console.error('Error updating staff:', error);
      let errorMessage = t('dashboard.staffPage.staffUpdateError') || 'Failed to update staff member';
      
      if (error?.data?.errors) {
        const errorMessages = Object.entries(error.data.errors)
          .map(([field, messages]) => {
            const messageList = Array.isArray(messages) ? messages.join(', ') : messages;
            return `${field}: ${messageList}`;
          })
          .join('; ');
        errorMessage = errorMessages || errorMessage;
      } else if (error?.message) {
        errorMessage = error.message;
      } else if (error?.data?.message) {
        errorMessage = error.data.message;
      }
      
      toast.error(errorMessage);
    } finally {
      setIsEditing(false);
    }
  };

  // Handle delete staff
  const handleDeleteStaff = async (staffId) => {
    if (!checkVerification('delete')) return;

    if (!window.confirm(t('dashboard.staffPage.deleteConfirm') || 'Are you sure you want to delete this staff member?')) {
      return;
    }

    setIsDeleting(true);

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

      const result = await authService.deleteStaff(instituteData.accessToken, staffId, options);

      if (result?.success) {
        toast.success(result.message || t('dashboard.staffPage.staffDeleted') || 'Staff member deleted successfully!');
        // Refresh staff list
        await fetchStaff({ page: pagination.currentPage });
      } else {
        toast.error(result?.message || t('dashboard.staffPage.staffDeleteError') || 'Failed to delete staff member');
      }
    } catch (error) {
      console.error('Error deleting staff:', error);
      toast.error(error?.message || t('dashboard.staffPage.staffDeleteError') || 'Failed to delete staff member');
    } finally {
      setIsDeleting(false);
    }
  };

  // Validate document using AI
  const validateDocument = async (file, fieldName) => {
    if (!file || !instituteData.accessToken) {
      setDocumentValidation(prev => ({
        ...prev,
        [fieldName]: { loading: false, isValid: null, message: null, percentage: null }
      }));
      return;
    }

    // Set loading state
    setDocumentValidation(prev => ({
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
        
        setDocumentValidation(prev => ({
          ...prev,
          [fieldName]: {
            loading: false,
            isValid,
            message: isValid 
              ? `${t('dashboard.staffPage.documentValid') || 'Document is valid'} (${percentage.toFixed(1)}%)`
              : `${t('dashboard.staffPage.documentInvalid') || 'Document is not valid'} (${percentage.toFixed(1)}% document, ${(result.nondocument_percentage || 0).toFixed(1)}% non-document)`,
            percentage
          }
        }));

        if (!isValid) {
          toast.error(
            `${fieldName.replace('_', ' ')}: ${t('dashboard.staffPage.documentInvalid') || 'Document validation failed'}`,
            { duration: 4000 }
          );
        } else {
          toast.success(
            `${fieldName.replace('_', ' ')}: ${t('dashboard.staffPage.documentValid') || 'Document validated successfully'}`,
            { duration: 2000 }
          );
        }
      } else {
        throw new Error('Invalid response from document validation API');
      }
    } catch (error) {
      console.error(`Error validating document ${fieldName}:`, error);
      setDocumentValidation(prev => ({
        ...prev,
        [fieldName]: {
          loading: false,
          isValid: false,
          message: error?.message || t('dashboard.staffPage.documentValidationError') || 'Failed to validate document',
          percentage: null
        }
      }));
      toast.error(
        `${fieldName.replace('_', ' ')}: ${error?.message || t('dashboard.staffPage.documentValidationError') || 'Document validation failed'}`,
        { duration: 4000 }
      );
    }
  };

  // Form change handlers
  const handleCreateChange = async (e) => {
    const { name, value, type, files } = e.target;
    if (type === 'file') {
      const file = files[0] || null;
      setCreateForm(prev => ({ ...prev, [name]: file }));
      
      // Validate document fields using AI
      const documentFields = ['personal_image', 'idcard_front', 'idcard_back', 'residence_front', 'residence_back'];
      if (documentFields.includes(name) && file) {
        await validateDocument(file, name);
      } else if (documentFields.includes(name) && !file) {
        // Clear validation state if file is removed
        setDocumentValidation(prev => ({
          ...prev,
          [name]: { loading: false, isValid: null, message: null, percentage: null }
        }));
      }
    } else {
      setCreateForm(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleEditChange = (e) => {
    const { name, value, type, files } = e.target;
    if (type === 'file') {
      setEditForm(prev => ({ ...prev, [name]: files[0] || null }));
    } else {
      setEditForm(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleGoToSettings = () => {
    setShowVerificationWarning(false);
    navigate('/dashboard/settings');
    
    setTimeout(() => {
      const verifyButton = document.querySelector('[data-verify-button]');
      if (verifyButton) {
        verifyButton.classList.add('highlight-pulse');
        setTimeout(() => {
          verifyButton.classList.remove('highlight-pulse');
        }, 3500);
      }
    }, 100);
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
      >
        <div>
          <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">{t('dashboard.staffPage.title')}</h2>
          <p className="text-gray-600 dark:text-gray-400">{t('dashboard.staffPage.subtitle')}</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            if (!checkVerification('create')) return;
            setShowCreateModal(true);
          }}
          className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors shadow-lg"
        >
          <FaPlus />
          {t('dashboard.staffPage.addStaff') || 'Add Staff'}
        </motion.button>
      </motion.div>

      {/* Search and Refresh */}
      <Card delay={0.1}>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder={t('dashboard.staffPage.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-300 dark:border-navy-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all bg-white dark:bg-navy-700 text-gray-900 dark:text-white"
            />
          </div>

          <button
            onClick={() => fetchStaff({ page: pagination.currentPage })}
            className="inline-flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors disabled:opacity-60"
            disabled={isLoading}
          >
            <FaSync className={isLoading ? 'animate-spin' : ''} />
            {t('dashboard.staffPage.refresh')}
          </button>
        </div>

        <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
          {t('dashboard.staffPage.showing')}{' '}
          <span className="font-semibold text-purple-600 dark:text-purple-400">
            {filteredStaff.length}
          </span>{' '}
          {t('dashboard.staffPage.of')}{' '}
          <span className="font-semibold text-purple-600 dark:text-purple-400">
            {pagination.count || staff.length}
          </span>{' '}
          {t('dashboard.staffPage.staffMembers')} {isRemote ? t('dashboard.staffPage.live') : t('dashboard.staffPage.demo')}
        </div>

        {error && (
          <div className="mt-3 flex items-center gap-2 text-sm text-amber-500 dark:text-amber-300">
            <FaExclamationTriangle />
            <span>{error}</span>
          </div>
        )}
      </Card>

      {/* Staff Table */}
      <Card delay={0.2}>
        {isLoading ? (
          <TableSkeleton rows={5} columns={7} />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gradient-to-r from-purple-600 to-purple-700 dark:from-purple-700 dark:to-purple-800 text-white">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold">{t('dashboard.staffPage.name')}</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">{t('dashboard.staffPage.id')}</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">{t('dashboard.staffPage.duty')}</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">{t('dashboard.staffPage.phone')}</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">{t('dashboard.staffPage.salary')}</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">{t('dashboard.staffPage.status')}</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">{t('dashboard.staffPage.actions') || 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-navy-700">
                <AnimatePresence>
                  {filteredStaff.map((member, index) => (
                    <motion.tr
                      key={`${member.id || 'local'}-${member.phone_number}`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ backgroundColor: 'rgba(168, 85, 247, 0.05)' }}
                      className="hover:shadow-md transition-all"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {member.personal_image ? (
                            <img
                              src={getImageUrl(member.personal_image)}
                              alt={`${member.first_name} ${member.last_name}`}
                              className="w-10 h-10 rounded-full object-cover"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = '';
                              }}
                            />
                          ) : (
                            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center">
                              <FaBriefcase className="text-white" />
                            </div>
                          )}
                          <button
                            onClick={() => member.id && handleViewStaff(member.id)}
                            className="text-left hover:underline"
                            disabled={!member.id}
                          >
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {member.first_name} {member.last_name}
                            </p>
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                        {member.id || '—'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                        {member.duty || '—'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                        {member.phone_number || '—'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                        {member.salary ? `$${member.salary}` : '—'}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            member.is_active
                              ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
                              : 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300'
                          }`}
                        >
                          {member.is_active ? t('dashboard.staffPage.active') : t('dashboard.staffPage.inactive')}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {member.id && (
                            <>
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => handleEditStaff(member.id)}
                                className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                title={t('dashboard.staffPage.edit') || 'Edit'}
                              >
                                <FaEdit />
                              </motion.button>
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => handleDeleteStaff(member.id)}
                                disabled={isDeleting}
                                className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
                                title={t('dashboard.staffPage.delete') || 'Delete'}
                              >
                                <FaTrash />
                              </motion.button>
                            </>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>

            {filteredStaff.length === 0 && (
              <ListEmptyState
                icon={FaBriefcase}
                title={t('dashboard.staffPage.noStaffFound')}
                message={
                  isRemote
                    ? t('dashboard.staffPage.tryAdjustingSearch')
                    : t('dashboard.staffPage.noMatchesDemo')
                }
                actionLabel={t('dashboard.staffPage.refresh')}
                onAction={() => fetchStaff({ page: 1 })}
              />
            )}
          </div>
        )}
      </Card>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 text-sm text-gray-600 dark:text-gray-400">
        <div>{isRemote ? t('dashboard.staffPage.liveDataFromBackend') : t('dashboard.staffPage.showingLocalDemoData')}</div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              const prev = Math.max(pagination.currentPage - 1, 1);
              setPagination((prevState) => ({ ...prevState, currentPage: prev }));
              fetchStaff({ page: prev });
            }}
            disabled={!pagination.previous || isLoading || !isRemote}
            className="px-4 py-2 border border-gray-300 dark:border-navy-600 rounded-lg hover:bg-gray-100 dark:hover:bg-navy-700 disabled:opacity-50 transition-colors"
          >
            {t('dashboard.staffPage.previous')}
          </button>
          <span>
            {t('dashboard.staffPage.page')}{' '}
            <span className="font-semibold text-gray-800 dark:text-white">
              {pagination.currentPage}
            </span>
          </span>
          <button
            onClick={() => {
              const next = pagination.currentPage + 1;
              setPagination((prevState) => ({ ...prevState, currentPage: next }));
              fetchStaff({ page: next });
            }}
            disabled={!pagination.next || isLoading || !isRemote}
            className="px-4 py-2 border border-gray-300 dark:border-navy-600 rounded-lg hover:bg-gray-100 dark:hover:bg-navy-700 disabled:opacity-50 transition-colors"
          >
            {t('dashboard.staffPage.next')}
          </button>
        </div>
      </div>

      {/* Verification Warning Modal */}
      <Modal
        isOpen={showVerificationWarning}
        onClose={() => setShowVerificationWarning(false)}
        title={t('dashboard.accountVerificationRequired') || 'Account Verification Required'}
      >
        <div className="space-y-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center flex-shrink-0">
              <FaExclamationTriangle className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
                {t('dashboard.verificationNeeded') || 'Verification Needed'}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {t('dashboard.verificationMessage') || 'Your account must be verified before you can perform this action. Please complete the verification process in Settings.'}
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <AnimatedButton
              onClick={handleGoToSettings}
              className="flex-1"
            >
              {t('dashboard.goToSettings') || 'Go to Settings'}
            </AnimatedButton>
            <AnimatedButton
              variant="secondary"
              onClick={() => setShowVerificationWarning(false)}
              className="flex-1"
            >
              {t('common.ok') || 'OK'}
            </AnimatedButton>
          </div>
        </div>
      </Modal>

      {/* Create Staff Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          // Reset form and validation states
          setCreateForm({
            first_name: '',
            last_name: '',
            phone_number: '',
            duty: '',
            salary: '',
            personal_image: null,
            idcard_front: null,
            idcard_back: null,
            residence_front: null,
            residence_back: null,
          });
          setDocumentValidation({
            personal_image: { loading: false, isValid: null, message: null, percentage: null },
            idcard_front: { loading: false, isValid: null, message: null, percentage: null },
            idcard_back: { loading: false, isValid: null, message: null, percentage: null },
            residence_front: { loading: false, isValid: null, message: null, percentage: null },
            residence_back: { loading: false, isValid: null, message: null, percentage: null },
          });
        }}
        title={t('dashboard.staffPage.addStaff') || 'Add Staff Member'}
        size="lg"
      >
        <form onSubmit={handleCreateStaff} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
                {t('dashboard.staffPage.firstName') || 'First Name'} *
              </label>
              <input
                type="text"
                name="first_name"
                value={createForm.first_name}
                onChange={handleCreateChange}
                className="w-full px-4 py-3 border border-gray-300 dark:border-navy-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-navy-700 text-gray-900 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
                {t('dashboard.staffPage.lastName') || 'Last Name'} *
              </label>
              <input
                type="text"
                name="last_name"
                value={createForm.last_name}
                onChange={handleCreateChange}
                className="w-full px-4 py-3 border border-gray-300 dark:border-navy-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-navy-700 text-gray-900 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
                {t('dashboard.staffPage.phone') || 'Phone Number'} *
              </label>
              <input
                type="text"
                name="phone_number"
                value={createForm.phone_number}
                onChange={handleCreateChange}
                className="w-full px-4 py-3 border border-gray-300 dark:border-navy-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-navy-700 text-gray-900 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
                {t('dashboard.staffPage.duty') || 'Duty'} *
              </label>
              <input
                type="text"
                name="duty"
                value={createForm.duty}
                onChange={handleCreateChange}
                className="w-full px-4 py-3 border border-gray-300 dark:border-navy-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-navy-700 text-gray-900 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
                {t('dashboard.staffPage.salary') || 'Salary'} * ($)
              </label>
              <input
                type="number"
                name="salary"
                value={createForm.salary}
                onChange={handleCreateChange}
                min="0"
                step="0.01"
                className="w-full px-4 py-3 border border-gray-300 dark:border-navy-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-navy-700 text-gray-900 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
                {t('dashboard.staffPage.personalImage') || 'Personal Image'} *
              </label>
              <input
                type="file"
                name="personal_image"
                accept="image/*"
                onChange={handleCreateChange}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-navy-700 text-gray-900 dark:text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 dark:file:bg-navy-800 dark:file:text-teal-400 ${
                  documentValidation.personal_image.isValid === false
                    ? 'border-red-500 dark:border-red-500'
                    : documentValidation.personal_image.isValid === true
                    ? 'border-green-500 dark:border-green-500'
                    : 'border-gray-300 dark:border-navy-600'
                }`}
                required
              />
              {documentValidation.personal_image.loading && (
                <div className="mt-2 flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
                  <FaSync className="animate-spin" />
                  <span>{t('dashboard.staffPage.validatingDocument') || 'Validating document...'}</span>
                </div>
              )}
              {documentValidation.personal_image.message && !documentValidation.personal_image.loading && (
                <div className={`mt-2 text-sm flex items-center gap-2 ${
                  documentValidation.personal_image.isValid
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-red-600 dark:text-red-400'
                }`}>
                  {documentValidation.personal_image.isValid ? (
                    <span className="text-green-500">✓</span>
                  ) : (
                    <span className="text-red-500">✗</span>
                  )}
                  <span>{documentValidation.personal_image.message}</span>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
                {t('dashboard.staffPage.idcardFront') || 'ID Card Front'} ({t('common.optional') || 'Optional'})
              </label>
              <input
                type="file"
                name="idcard_front"
                accept="image/*"
                onChange={handleCreateChange}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-navy-700 text-gray-900 dark:text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 dark:file:bg-navy-800 dark:file:text-teal-400 ${
                  documentValidation.idcard_front.isValid === false
                    ? 'border-red-500 dark:border-red-500'
                    : documentValidation.idcard_front.isValid === true
                    ? 'border-green-500 dark:border-green-500'
                    : 'border-gray-300 dark:border-navy-600'
                }`}
              />
              {documentValidation.idcard_front.loading && (
                <div className="mt-2 flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
                  <FaSync className="animate-spin" />
                  <span>{t('dashboard.staffPage.validatingDocument') || 'Validating document...'}</span>
                </div>
              )}
              {documentValidation.idcard_front.message && !documentValidation.idcard_front.loading && (
                <div className={`mt-2 text-sm flex items-center gap-2 ${
                  documentValidation.idcard_front.isValid
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-red-600 dark:text-red-400'
                }`}>
                  {documentValidation.idcard_front.isValid ? (
                    <span className="text-green-500">✓</span>
                  ) : (
                    <span className="text-red-500">✗</span>
                  )}
                  <span>{documentValidation.idcard_front.message}</span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
                {t('dashboard.staffPage.idcardBack') || 'ID Card Back'} ({t('common.optional') || 'Optional'})
              </label>
              <input
                type="file"
                name="idcard_back"
                accept="image/*"
                onChange={handleCreateChange}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-navy-700 text-gray-900 dark:text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 dark:file:bg-navy-800 dark:file:text-teal-400 ${
                  documentValidation.idcard_back.isValid === false
                    ? 'border-red-500 dark:border-red-500'
                    : documentValidation.idcard_back.isValid === true
                    ? 'border-green-500 dark:border-green-500'
                    : 'border-gray-300 dark:border-navy-600'
                }`}
              />
              {documentValidation.idcard_back.loading && (
                <div className="mt-2 flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
                  <FaSync className="animate-spin" />
                  <span>{t('dashboard.staffPage.validatingDocument') || 'Validating document...'}</span>
                </div>
              )}
              {documentValidation.idcard_back.message && !documentValidation.idcard_back.loading && (
                <div className={`mt-2 text-sm flex items-center gap-2 ${
                  documentValidation.idcard_back.isValid
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-red-600 dark:text-red-400'
                }`}>
                  {documentValidation.idcard_back.isValid ? (
                    <span className="text-green-500">✓</span>
                  ) : (
                    <span className="text-red-500">✗</span>
                  )}
                  <span>{documentValidation.idcard_back.message}</span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
                {t('dashboard.staffPage.residenceFront') || 'Residence Front'} ({t('common.optional') || 'Optional'})
              </label>
              <input
                type="file"
                name="residence_front"
                accept="image/*"
                onChange={handleCreateChange}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-navy-700 text-gray-900 dark:text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 dark:file:bg-navy-800 dark:file:text-teal-400 ${
                  documentValidation.residence_front.isValid === false
                    ? 'border-red-500 dark:border-red-500'
                    : documentValidation.residence_front.isValid === true
                    ? 'border-green-500 dark:border-green-500'
                    : 'border-gray-300 dark:border-navy-600'
                }`}
              />
              {documentValidation.residence_front.loading && (
                <div className="mt-2 flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
                  <FaSync className="animate-spin" />
                  <span>{t('dashboard.staffPage.validatingDocument') || 'Validating document...'}</span>
                </div>
              )}
              {documentValidation.residence_front.message && !documentValidation.residence_front.loading && (
                <div className={`mt-2 text-sm flex items-center gap-2 ${
                  documentValidation.residence_front.isValid
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-red-600 dark:text-red-400'
                }`}>
                  {documentValidation.residence_front.isValid ? (
                    <span className="text-green-500">✓</span>
                  ) : (
                    <span className="text-red-500">✗</span>
                  )}
                  <span>{documentValidation.residence_front.message}</span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
                {t('dashboard.staffPage.residenceBack') || 'Residence Back'} ({t('common.optional') || 'Optional'})
              </label>
              <input
                type="file"
                name="residence_back"
                accept="image/*"
                onChange={handleCreateChange}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-navy-700 text-gray-900 dark:text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 dark:file:bg-navy-800 dark:file:text-teal-400 ${
                  documentValidation.residence_back.isValid === false
                    ? 'border-red-500 dark:border-red-500'
                    : documentValidation.residence_back.isValid === true
                    ? 'border-green-500 dark:border-green-500'
                    : 'border-gray-300 dark:border-navy-600'
                }`}
              />
              {documentValidation.residence_back.loading && (
                <div className="mt-2 flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
                  <FaSync className="animate-spin" />
                  <span>{t('dashboard.staffPage.validatingDocument') || 'Validating document...'}</span>
                </div>
              )}
              {documentValidation.residence_back.message && !documentValidation.residence_back.loading && (
                <div className={`mt-2 text-sm flex items-center gap-2 ${
                  documentValidation.residence_back.isValid
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-red-600 dark:text-red-400'
                }`}>
                  {documentValidation.residence_back.isValid ? (
                    <span className="text-green-500">✓</span>
                  ) : (
                    <span className="text-red-500">✗</span>
                  )}
                  <span>{documentValidation.residence_back.message}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <AnimatedButton
              type="submit"
              className="flex-1"
              disabled={isCreating}
            >
              {isCreating ? (t('common.saving') || 'Saving...') : (t('dashboard.staffPage.createStaff') || 'Create Staff')}
            </AnimatedButton>
            <AnimatedButton
              type="button"
              variant="secondary"
              onClick={() => {
                setShowCreateModal(false);
                // Reset form and validation states
                setCreateForm({
                  first_name: '',
                  last_name: '',
                  phone_number: '',
                  duty: '',
                  salary: '',
                  personal_image: null,
                  idcard_front: null,
                  idcard_back: null,
                  residence_front: null,
                  residence_back: null,
                });
                setDocumentValidation({
                  personal_image: { loading: false, isValid: null, message: null, percentage: null },
                  idcard_front: { loading: false, isValid: null, message: null, percentage: null },
                  idcard_back: { loading: false, isValid: null, message: null, percentage: null },
                  residence_front: { loading: false, isValid: null, message: null, percentage: null },
                  residence_back: { loading: false, isValid: null, message: null, percentage: null },
                });
              }}
              className="flex-1"
              disabled={isCreating}
            >
              {t('common.cancel') || 'Cancel'}
            </AnimatedButton>
          </div>
        </form>
      </Modal>

      {/* View Staff Profile Modal */}
      <Modal
        isOpen={showViewModal}
        onClose={() => {
          setShowViewModal(false);
          setSelectedStaff(null);
        }}
        title={selectedStaff ? `${selectedStaff.first_name} ${selectedStaff.last_name}` : t('dashboard.staffPage.staffProfile') || 'Staff Profile'}
        size="lg"
      >
        {selectedStaff && (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              {selectedStaff.personal_image ? (
                <img
                  src={getImageUrl(selectedStaff.personal_image)}
                  alt={`${selectedStaff.first_name} ${selectedStaff.last_name}`}
                  className="w-24 h-24 rounded-full object-cover"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = '';
                  }}
                />
              ) : (
                <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center">
                  <FaUser className="text-white text-3xl" />
                </div>
              )}
              <div>
                <h3 className="text-2xl font-bold text-gray-800 dark:text-white">
                  {selectedStaff.first_name} {selectedStaff.last_name}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">{selectedStaff.duty}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('dashboard.staffPage.phone') || 'Phone'}</label>
                <p className="text-gray-900 dark:text-white">{selectedStaff.phone_number || '—'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('dashboard.staffPage.salary') || 'Salary'}</label>
                <p className="text-gray-900 dark:text-white">{selectedStaff.salary ? `$${selectedStaff.salary}` : '—'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('dashboard.staffPage.status') || 'Status'}</label>
                <span
                  className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                    selectedStaff.is_active
                      ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
                      : 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300'
                  }`}
                >
                  {selectedStaff.is_active ? t('dashboard.staffPage.active') : t('dashboard.staffPage.inactive')}
                </span>
              </div>
            </div>

            {(selectedStaff.idcard_front || selectedStaff.idcard_back || selectedStaff.residence_front || selectedStaff.residence_back) && (
              <div>
                <h4 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">{t('dashboard.staffPage.documents') || 'Documents'}</h4>
                <div className="grid grid-cols-2 gap-4">
                  {selectedStaff.idcard_front && (
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 block">{t('dashboard.staffPage.idcardFront') || 'ID Card Front'}</label>
                      <img
                        src={getImageUrl(selectedStaff.idcard_front)}
                        alt="ID Card Front"
                        className="w-full h-32 object-cover rounded-lg border border-gray-300 dark:border-navy-600"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                  {selectedStaff.idcard_back && (
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 block">{t('dashboard.staffPage.idcardBack') || 'ID Card Back'}</label>
                      <img
                        src={getImageUrl(selectedStaff.idcard_back)}
                        alt="ID Card Back"
                        className="w-full h-32 object-cover rounded-lg border border-gray-300 dark:border-navy-600"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                  {selectedStaff.residence_front && (
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 block">{t('dashboard.staffPage.residenceFront') || 'Residence Front'}</label>
                      <img
                        src={getImageUrl(selectedStaff.residence_front)}
                        alt="Residence Front"
                        className="w-full h-32 object-cover rounded-lg border border-gray-300 dark:border-navy-600"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                  {selectedStaff.residence_back && (
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 block">{t('dashboard.staffPage.residenceBack') || 'Residence Back'}</label>
                      <img
                        src={getImageUrl(selectedStaff.residence_back)}
                        alt="Residence Back"
                        className="w-full h-32 object-cover rounded-lg border border-gray-300 dark:border-navy-600"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <AnimatedButton
                onClick={() => {
                  setShowViewModal(false);
                  if (selectedStaff?.id) {
                    handleEditStaff(selectedStaff.id);
                  }
                }}
                className="flex-1"
              >
                {t('dashboard.staffPage.edit') || 'Edit'}
              </AnimatedButton>
              <AnimatedButton
                variant="secondary"
                onClick={() => {
                  setShowViewModal(false);
                  setSelectedStaff(null);
                }}
                className="flex-1"
              >
                {t('common.close') || 'Close'}
              </AnimatedButton>
            </div>
          </div>
        )}
      </Modal>

      {/* Edit Staff Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedStaff(null);
        }}
        title={t('dashboard.staffPage.editStaff') || 'Edit Staff Member'}
        size="lg"
      >
        <form onSubmit={handleUpdateStaff} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
                {t('dashboard.staffPage.firstName') || 'First Name'}
              </label>
              <input
                type="text"
                name="first_name"
                value={editForm.first_name}
                onChange={handleEditChange}
                className="w-full px-4 py-3 border border-gray-300 dark:border-navy-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-navy-700 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
                {t('dashboard.staffPage.lastName') || 'Last Name'}
              </label>
              <input
                type="text"
                name="last_name"
                value={editForm.last_name}
                onChange={handleEditChange}
                className="w-full px-4 py-3 border border-gray-300 dark:border-navy-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-navy-700 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
                {t('dashboard.staffPage.phone') || 'Phone Number'}
              </label>
              <input
                type="text"
                name="phone_number"
                value={editForm.phone_number}
                onChange={handleEditChange}
                className="w-full px-4 py-3 border border-gray-300 dark:border-navy-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-navy-700 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
                {t('dashboard.staffPage.duty') || 'Duty'}
              </label>
              <input
                type="text"
                name="duty"
                value={editForm.duty}
                onChange={handleEditChange}
                className="w-full px-4 py-3 border border-gray-300 dark:border-navy-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-navy-700 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
                {t('dashboard.staffPage.salary') || 'Salary'} ($)
              </label>
              <input
                type="number"
                name="salary"
                value={editForm.salary}
                onChange={handleEditChange}
                min="0"
                step="0.01"
                className="w-full px-4 py-3 border border-gray-300 dark:border-navy-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-navy-700 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
                {t('dashboard.staffPage.personalImage') || 'Personal Image'} ({t('common.optional') || 'Optional'})
              </label>
              <input
                type="file"
                name="personal_image"
                accept="image/*"
                onChange={handleEditChange}
                className="w-full px-4 py-3 border border-gray-300 dark:border-navy-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-navy-700 text-gray-900 dark:text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 dark:file:bg-navy-800 dark:file:text-teal-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
                {t('dashboard.staffPage.idcardFront') || 'ID Card Front'} ({t('common.optional') || 'Optional'})
              </label>
              <input
                type="file"
                name="idcard_front"
                accept="image/*"
                onChange={handleEditChange}
                className="w-full px-4 py-3 border border-gray-300 dark:border-navy-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-navy-700 text-gray-900 dark:text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 dark:file:bg-navy-800 dark:file:text-teal-400"
              />
            </div>

            <div>
              <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
                {t('dashboard.staffPage.idcardBack') || 'ID Card Back'} ({t('common.optional') || 'Optional'})
              </label>
              <input
                type="file"
                name="idcard_back"
                accept="image/*"
                onChange={handleEditChange}
                className="w-full px-4 py-3 border border-gray-300 dark:border-navy-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-navy-700 text-gray-900 dark:text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 dark:file:bg-navy-800 dark:file:text-teal-400"
              />
            </div>

            <div>
              <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
                {t('dashboard.staffPage.residenceFront') || 'Residence Front'} ({t('common.optional') || 'Optional'})
              </label>
              <input
                type="file"
                name="residence_front"
                accept="image/*"
                onChange={handleEditChange}
                className="w-full px-4 py-3 border border-gray-300 dark:border-navy-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-navy-700 text-gray-900 dark:text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 dark:file:bg-navy-800 dark:file:text-teal-400"
              />
            </div>

            <div>
              <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
                {t('dashboard.staffPage.residenceBack') || 'Residence Back'} ({t('common.optional') || 'Optional'})
              </label>
              <input
                type="file"
                name="residence_back"
                accept="image/*"
                onChange={handleEditChange}
                className="w-full px-4 py-3 border border-gray-300 dark:border-navy-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-navy-700 text-gray-900 dark:text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 dark:file:bg-navy-800 dark:file:text-teal-400"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <AnimatedButton
              type="submit"
              className="flex-1"
              disabled={isEditing}
            >
              {isEditing ? (t('common.saving') || 'Saving...') : (t('dashboard.staffPage.updateStaff') || 'Update Staff')}
            </AnimatedButton>
            <AnimatedButton
              type="button"
              variant="secondary"
              onClick={() => {
                setShowEditModal(false);
                setSelectedStaff(null);
              }}
              className="flex-1"
              disabled={isEditing}
            >
              {t('common.cancel') || 'Cancel'}
            </AnimatedButton>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Staff;
