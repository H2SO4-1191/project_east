import { useState, useRef, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { 
  FaHome, FaUsers, FaChalkboardTeacher, FaBriefcase, 
  FaCalendarAlt, FaDollarSign, FaCog, FaBars, FaTimes,
  FaMoon, FaSun, FaSignOutAlt, FaGlobe, FaPlus, FaEdit, FaBook, FaClock, FaBell, FaNewspaper, FaUserCircle, FaSuitcase
} from 'react-icons/fa';
import { useInstitute } from '../context/InstituteContext';
import { useTheme } from '../context/ThemeContext';
import { authService } from '../services/authService';
import Modal from '../components/Modal';
import AnimatedButton from '../components/AnimatedButton';
import LanguageSwitcher from '../components/LanguageSwitcher';
import ProfileModal from '../components/ProfileModal';
import toast from 'react-hot-toast';
import Overview from './dashboard/Overview';
import Students from './dashboard/Students';
import Teachers from './dashboard/Teachers';
import Employees from './dashboard/Employees';
import Schedule from './dashboard/Schedule';
import Finance from './dashboard/Finance';
import Settings from './dashboard/Settings';

const EnhancedDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { instituteData, clearInstituteData, updateInstituteData } = useInstitute();
  const { isDark, toggleTheme } = useTheme();
  const { t } = useTranslation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  const sidebarTimeoutRef = useRef(null);
  
  // Course management state
  const [showCreateCourseModal, setShowCreateCourseModal] = useState(false);
  const [showEditCoursesModal, setShowEditCoursesModal] = useState(false);
  const [showVerificationWarning, setShowVerificationWarning] = useState(false);
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef(null);
  const [showNewPostModal, setShowNewPostModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showJobPostModal, setShowJobPostModal] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [institutionTitle, setInstitutionTitle] = useState(null);
  const [username, setUsername] = useState(null);
  const [isCreatingPost, setIsCreatingPost] = useState(false);
  const [isCreatingCourse, setIsCreatingCourse] = useState(false);
  const [isUpdatingCourse, setIsUpdatingCourse] = useState(false);
  const [isCreatingJobPost, setIsCreatingJobPost] = useState(false);
  
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
  
  // Demo notifications
  const [notifications] = useState([
    {
      id: 1,
      title: 'New Student Enrollment',
      message: '5 new students enrolled in Advanced Calculus course',
      time: '1 hour ago',
      read: false,
      type: 'enrollment'
    },
    {
      id: 2,
      title: 'Payment Received',
      message: 'Payment of $450 received for Business Strategy course',
      time: '3 hours ago',
      read: false,
      type: 'payment'
    },
    {
      id: 3,
      title: 'Course Update Required',
      message: 'Your Introduction to Programming course needs an update',
      time: '1 day ago',
      read: true,
      type: 'update'
    },
    {
      id: 4,
      title: 'New Message',
      message: 'You have a new message from a student',
      time: '2 days ago',
      read: true,
      type: 'message'
    },
  ]);
  
  // Create post form state
  const [postForm, setPostForm] = useState({
    title: '',
    description: '',
    images: [],
  });

  // Create job post form state
  const [jobPostForm, setJobPostForm] = useState({
    title: '',
    description: '',
    specialty: '',
    experience_required: '',
    skills_required: '',
    salary_offer: '',
  });

  // Create course form state
  const [createForm, setCreateForm] = useState({
    title: '',
    about: '',
    starting_date: '',
    ending_date: '',
    level: 'beginner',
    price: '',
    days: [],
    start_time: '',
    end_time: '',
    lecturer: '',
    course_image: null,
  });
  
  // Lecturers list for dropdown
  const [lecturers, setLecturers] = useState([]);
  const [isLoadingLecturers, setIsLoadingLecturers] = useState(false);

  // Edit course form state
  const [editForm, setEditForm] = useState({
    title: '',
    about: '',
    starting_date: '',
    ending_date: '',
    level: 'beginner',
    price: '',
    days: [],
    start_time: '',
    end_time: '',
    lecturer: '',
    course_image: null,
  });

  const menuItems = [
    { id: 'overview', path: '/dashboard', label: t('dashboard.overview'), icon: FaHome, color: 'from-blue-500 to-blue-600' },
    { id: 'students', path: '/dashboard/students', label: t('dashboard.students'), icon: FaUsers, color: 'from-blue-500 to-blue-600' },
    { id: 'lecturers', path: '/dashboard/lecturers', label: t('dashboard.lecturers'), icon: FaChalkboardTeacher, color: 'from-teal-500 to-teal-600' },
    { id: 'staff', path: '/dashboard/staff', label: t('dashboard.staff'), icon: FaBriefcase, color: 'from-purple-500 to-purple-600' },
    { id: 'schedule', path: '/dashboard/schedule', label: t('dashboard.schedule'), icon: FaCalendarAlt, color: 'from-pink-500 to-pink-600' },
    { id: 'finance', path: '/dashboard/finance', label: t('dashboard.finance'), icon: FaDollarSign, color: 'from-gold-500 to-gold-600' },
    { id: 'settings', path: '/dashboard/settings', label: t('dashboard.settings'), icon: FaCog, color: 'from-gray-500 to-gray-600' },
  ];

  const isActiveRoute = (path) => {
    if (path === '/dashboard') {
      return location.pathname === '/dashboard' || location.pathname === '/dashboard/';
    }
    return location.pathname.startsWith(path);
  };

  const handleNavigation = (path) => {
    navigate(path);
    setIsSidebarOpen(false);
  };

  // Fetch institution profile on mount
  useEffect(() => {
    const fetchInstitutionProfile = async () => {
      if (!instituteData.isAuthenticated || !instituteData.accessToken) {
        return;
      }

      try {
        const data = await authService.getInstitutionProfile(instituteData.accessToken, {
          refreshToken: instituteData.refreshToken,
          onTokenRefreshed: (tokens) => {
            // Token refreshed, but we don't update context here to avoid loop
          },
          onSessionExpired: () => {
            console.log('Session expired');
          },
        });

        if (data?.success && data?.data) {
          if (data.data.profile_image) {
            setProfileImage(getImageUrl(data.data.profile_image));
          }
          if (data.data.title) {
            setInstitutionTitle(data.data.title);
          }
          if (data.data.username) {
            setUsername(data.data.username);
          }
        }
      } catch (err) {
        console.error('Error fetching institution profile:', err);
      }
    };

    fetchInstitutionProfile();
  }, [instituteData.isAuthenticated, instituteData.accessToken]);

  // Close notifications when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };

    if (showNotifications) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showNotifications]);

  // Cleanup sidebar timeout on unmount
  useEffect(() => {
    return () => {
      if (sidebarTimeoutRef.current) {
        clearTimeout(sidebarTimeoutRef.current);
      }
    };
  }, []);

  const handleLogout = () => {
    // Clear all institute data
    localStorage.removeItem('instituteData');
    clearInstituteData();
    
    // Navigate to home and force reload to ensure clean state
    navigate('/');
    window.location.reload();
  };

  // Check verification before opening course modals
  const checkVerificationAndOpen = (modalType) => {
    if (!instituteData.isVerified) {
      setShowVerificationWarning(true);
      return;
    }
    
    if (modalType === 'new_post') {
      setShowNewPostModal(true);
    } else if (modalType === 'create') {
      setShowCreateCourseModal(true);
    } else if (modalType === 'edit') {
      setShowEditCoursesModal(true);
    } else if (modalType === 'job_post') {
      setShowJobPostModal(true);
    }
  };

  const handleGoToSettings = () => {
    setShowVerificationWarning(false);
    navigate('/dashboard/settings');
    
    // Highlight verification button after navigation
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

  // Post form handlers
  const handlePostChange = (e) => {
    const { name, value } = e.target;
    setPostForm(prev => ({ ...prev, [name]: value }));
  };

  const handlePostImageChange = (e) => {
    const files = Array.from(e.target.files);
    setPostForm(prev => ({ ...prev, images: [...prev.images, ...files] }));
  };

  const handleRemovePostImage = (index) => {
    setPostForm(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  // Job post form handlers
  const handleJobPostChange = (e) => {
    const { name, value } = e.target;
    setJobPostForm(prev => ({ ...prev, [name]: value }));
  };

  const handleCreateJobPost = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!jobPostForm.title || !jobPostForm.specialty || !jobPostForm.experience_required || !jobPostForm.salary_offer) {
      toast.error(t('dashboard.fillRequiredFields') || 'Please fill in all required fields');
      return;
    }

    // Validate numeric fields
    if (isNaN(parseInt(jobPostForm.experience_required)) || parseInt(jobPostForm.experience_required) < 0) {
      toast.error(t('dashboard.experienceMustBePositive') || 'Experience required must be a positive number');
      return;
    }

    if (isNaN(parseInt(jobPostForm.salary_offer)) || parseInt(jobPostForm.salary_offer) < 0) {
      toast.error(t('dashboard.salaryMustBePositive') || 'Salary offer must be a positive number');
      return;
    }

    setIsCreatingJobPost(true);
    
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

      const result = await authService.createJobPost(
        instituteData.accessToken,
        {
          title: jobPostForm.title.trim(),
          description: jobPostForm.description?.trim() || '',
          specialty: jobPostForm.specialty.trim(),
          experience_required: parseInt(jobPostForm.experience_required),
          skills_required: jobPostForm.skills_required?.trim() || '',
          salary_offer: parseInt(jobPostForm.salary_offer),
        },
        options
      );

      if (result?.success) {
        toast.success(result.message || t('dashboard.jobPostCreated') || 'Job post created successfully!');
        setShowJobPostModal(false);
        setJobPostForm({
          title: '',
          description: '',
          specialty: '',
          experience_required: '',
          skills_required: '',
          salary_offer: '',
        });
      } else {
        const errorMessage = result?.message || t('dashboard.jobPostCreateError') || 'Failed to create job post';
        toast.error(errorMessage);
      }
    } catch (error) {
      console.error('Error creating job post:', error);
      
      let errorMessage = t('dashboard.jobPostCreateError') || 'Failed to create job post';
      
      if (error?.data?.errors) {
        const errorMessages = Object.entries(error.data.errors)
          .map(([field, messages]) => {
            const fieldLabel = field === 'title' ? t('dashboard.jobTitle') || 'Title' : 
                              field === 'specialty' ? t('dashboard.specialty') || 'Specialty' :
                              field === 'experience_required' ? t('dashboard.experienceRequired') || 'Experience Required' :
                              field === 'salary_offer' ? t('dashboard.salaryOffer') || 'Salary Offer' : field;
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
      setIsCreatingJobPost(false);
    }
  };

  // Course management handlers
  const handleCreateChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
      // Handle days checkbox
      setCreateForm(prev => ({
        ...prev,
        days: checked
          ? [...prev.days, value]
          : prev.days.filter(day => day !== value)
      }));
    } else if (type === 'file') {
      setCreateForm(prev => ({ ...prev, [name]: e.target.files[0] }));
    } else {
      setCreateForm(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleEditChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
      // Handle days checkbox
      setEditForm(prev => ({
        ...prev,
        days: checked
          ? [...prev.days, value]
          : prev.days.filter(day => day !== value)
      }));
    } else if (type === 'file') {
      setEditForm(prev => ({ ...prev, [name]: e.target.files[0] }));
    } else {
      setEditForm(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    
    // Validate required field: title
    if (!postForm.title || !postForm.title.trim()) {
      toast.error(t('post.postTitleRequired') || 'Post title is required');
      return;
    }

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

    setIsCreatingPost(true);
    
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

      // Prepare payload matching API endpoint:
      // - title (string, required)
      // - description (string, optional) - send empty string if not provided
      // - images (0..N files, optional) - only send if provided
      const payload = {
        title: postForm.title.trim(),
        description: postForm.description?.trim() || '', // Optional, but send empty string if not provided
        images: postForm.images && postForm.images.length > 0 ? postForm.images : [], // Optional, only send if provided
      };

      console.log('Creating post:', {
        title: payload.title,
        hasDescription: !!payload.description,
        imagesCount: payload.images.length
      });

      const result = await authService.createInstitutionPost(
        instituteData.accessToken,
        payload,
        options
      );

      if (result?.success) {
        toast.success(result.message || t('dashboard.postCreated') || 'Post created successfully!');
        setShowNewPostModal(false);
        setPostForm({
          title: '',
          description: '',
          images: [],
        });
      } else {
        // Handle case where API returns success: false
        const errorMessage = result?.message || t('dashboard.postCreateError') || 'Failed to create post';
        toast.error(errorMessage);
      }
    } catch (error) {
      console.error('Error creating post:', error);
      
      // Handle API error response format: { success: false, errors: { field: ["message"] } }
      let errorMessage = t('dashboard.postCreateError') || 'Failed to create post';
      
      if (error?.data?.errors) {
        // Format: { title: ["This field is required."] }
        const errorMessages = Object.entries(error.data.errors)
          .map(([field, messages]) => {
            const fieldLabel = field === 'title' ? t('post.postTitle') || 'Title' : field;
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
      setIsCreatingPost(false);
    }
  };

  // Fetch lecturers on mount
  useEffect(() => {
    const fetchLecturers = async () => {
      if (!instituteData.accessToken || !showCreateCourseModal) return;
      
      setIsLoadingLecturers(true);
      try {
        const params = new URLSearchParams({ page: '1' });
        const response = await authService.getProtected(
          `/institution/lecturers-list/?${params}`,
          instituteData.accessToken,
          {
            refreshToken: instituteData.refreshToken,
            onTokenRefreshed: (tokens) => {
              updateInstituteData({
                accessToken: tokens.access,
                refreshToken: tokens.refresh || instituteData.refreshToken,
              });
            },
          }
        );
        setLecturers(response.results || []);
      } catch (error) {
        console.error('Failed to fetch lecturers:', error);
        setLecturers([]);
      } finally {
        setIsLoadingLecturers(false);
      }
    };
    
    fetchLecturers();
  }, [instituteData.accessToken, showCreateCourseModal]);

  const handleCreateCourse = async (e) => {
    e.preventDefault();
    
    // Validate all required fields
    if (!createForm.title || !createForm.about || !createForm.starting_date || 
        !createForm.ending_date || !createForm.level || !createForm.price ||
        !createForm.days.length || !createForm.start_time || !createForm.end_time ||
        !createForm.lecturer) {
      toast.error(t('dashboard.fillRequiredFields') || 'Please fill in all required fields');
      return;
    }
    
    // Validate dates
    if (new Date(createForm.ending_date) < new Date(createForm.starting_date)) {
      toast.error(t('dashboard.endingDateBeforeStarting') || 'Ending date cannot be before starting date');
      return;
    }
    
    // Validate times
    if (createForm.end_time <= createForm.start_time) {
      toast.error(t('dashboard.endTimeBeforeStart') || 'End time must be greater than start time');
      return;
    }
    
    // Validate price
    if (parseFloat(createForm.price) < 0) {
      toast.error(t('dashboard.priceMustBePositive') || 'Price must be positive');
      return;
    }

    setIsCreatingCourse(true);
    
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

      const result = await authService.createInstitutionCourse(
        instituteData.accessToken,
        {
          title: createForm.title,
          about: createForm.about,
          starting_date: createForm.starting_date,
          ending_date: createForm.ending_date,
          level: createForm.level,
          price: parseFloat(createForm.price),
          days: createForm.days,
          start_time: createForm.start_time,
          end_time: createForm.end_time,
          lecturer: parseInt(createForm.lecturer),
          course_image: createForm.course_image,
        },
        options
      );

      if (result?.success) {
        toast.success(result.message || t('dashboard.courseCreated') || 'Course created successfully!');
        setShowCreateCourseModal(false);
        setCreateForm({
          title: '',
          about: '',
          starting_date: '',
          ending_date: '',
          level: 'beginner',
          price: '',
          days: [],
          start_time: '',
          end_time: '',
          lecturer: '',
          course_image: null,
        });
      }
    } catch (error) {
      console.error('Error creating course:', error);
      const errorMessage = error?.data?.errors
        ? Object.values(error.data.errors).flat().join(', ')
        : error?.message || t('dashboard.courseCreateError') || 'Failed to create course';
      toast.error(errorMessage);
    } finally {
      setIsCreatingCourse(false);
    }
  };

  const handleEditCourse = (course) => {
    setSelectedCourse(course);
    setEditForm(course);
  };

  const handleUpdateCourse = async (e) => {
    e.preventDefault();
    
    if (!selectedCourse || !selectedCourse.id) {
      toast.error(t('dashboard.noCourseSelected') || 'No course selected');
      return;
    }

    setIsUpdatingCourse(true);
    
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

      // Prepare payload with only changed fields
      const payload = {};
      if (editForm.title) payload.title = editForm.title;
      if (editForm.about) payload.about = editForm.about;
      if (editForm.starting_date) payload.starting_date = editForm.starting_date;
      if (editForm.ending_date) payload.ending_date = editForm.ending_date;
      if (editForm.level) payload.level = editForm.level;
      if (editForm.price !== '' && editForm.price !== undefined) payload.price = parseFloat(editForm.price);
      if (editForm.days && editForm.days.length > 0) payload.days = editForm.days;
      if (editForm.start_time) payload.start_time = editForm.start_time;
      if (editForm.end_time) payload.end_time = editForm.end_time;
      if (editForm.lecturer) payload.lecturer = parseInt(editForm.lecturer);
      if (editForm.course_image) payload.course_image = editForm.course_image;

      const result = await authService.editInstitutionCourse(
        instituteData.accessToken,
        selectedCourse.id,
        payload,
        options
      );

      if (result?.success) {
        toast.success(result.message || t('dashboard.courseUpdated') || 'Course updated successfully!');
        setSelectedCourse(null);
        setEditForm({
          title: '',
          about: '',
          starting_date: '',
          ending_date: '',
          level: 'beginner',
          price: '',
          days: [],
          start_time: '',
          end_time: '',
          lecturer: '',
          course_image: null,
        });
      }
    } catch (error) {
      console.error('Error updating course:', error);
      const errorMessage = error?.data?.errors
        ? Object.values(error.data.errors).flat().join(', ')
        : error?.message || t('dashboard.courseUpdateError') || 'Failed to update course';
      toast.error(errorMessage);
    } finally {
      setIsUpdatingCourse(false);
    }
  };

  const handleDeleteCourse = (courseId) => {
    if (window.confirm(t('dashboard.deleteConfirm'))) {
      setCourses(prev => prev.filter(c => c.id !== courseId));
      toast.success(t('dashboard.courseDeleted'));
      setSelectedCourse(null);
    }
  };

  const displayName = username || instituteData.username || instituteData.name || institutionTitle || 'Institution';
  const displayUsername = username || instituteData.username || instituteData.name || 'User';
  const avatarLetter = displayName.charAt(0)?.toUpperCase() || 'I';
  const greetingName = instituteData.firstName || username || instituteData.username || instituteData.name || 'there';
  const subscriptionLabel = instituteData.subscriptionLabel || instituteData.subscription || 'Active Plan';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-navy-900 flex transition-colors duration-300">
      {/* Desktop Sidebar - Slide Based Design */}
      <aside 
        className={`hidden lg:block bg-white dark:bg-navy-800 shadow-xl border-r border-gray-200 dark:border-navy-700 fixed left-0 top-0 bottom-0 overflow-y-auto z-40 transition-all duration-500 ease-in-out ${
          isSidebarExpanded ? 'w-72' : 'w-20'
        }`}
        onMouseEnter={() => {
          // Clear any pending timeout
          if (sidebarTimeoutRef.current) {
            clearTimeout(sidebarTimeoutRef.current);
            sidebarTimeoutRef.current = null;
          }
          setIsSidebarExpanded(true);
        }}
        onMouseLeave={() => {
          // Set timeout to collapse after delay for smoother UX
          sidebarTimeoutRef.current = setTimeout(() => {
            setIsSidebarExpanded(false);
            sidebarTimeoutRef.current = null;
          }, 200);
        }}
      >
        {/* Logo */}
        <div className="p-6 border-b border-gray-200 dark:border-navy-700">
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => navigate('/dashboard')}
          >
            <div className="w-12 h-12 bg-gradient-to-br from-primary-600 to-teal-500 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
              <span className="text-white text-xl font-bold">PE</span>
            </div>
            <div className={`transition-all duration-500 ease-in-out ${isSidebarExpanded ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'}`}>
              <h2 className="text-lg font-bold text-gray-800 dark:text-white whitespace-nowrap">Project East</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">{t('nav.dashboard')}</p>
            </div>
          </motion.div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {menuItems.map((item, index) => (
            <motion.button
              key={item.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => handleNavigation(item.path)}
              className={`
                w-full flex items-center ${isSidebarExpanded ? 'gap-3' : 'justify-center'} px-4 py-3 rounded-xl transition-all duration-300 ease-in-out group
                ${isActiveRoute(item.path)
                  ? 'bg-gradient-to-r from-primary-600 to-primary-700 dark:from-teal-500 dark:to-teal-600 text-white shadow-lg'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-navy-700'
                }
              `}
              whileHover={isSidebarExpanded ? { x: 5 } : {}}
              whileTap={{ scale: 0.98 }}
              title={item.label}
            >
              <item.icon className={`w-5 h-5 flex-shrink-0 ${isActiveRoute(item.path) ? 'text-white' : 'text-gray-500 dark:text-gray-400 group-hover:text-primary-600 dark:group-hover:text-teal-400'}`} />
              {isSidebarExpanded && <span className="font-medium whitespace-nowrap">{item.label}</span>}
            </motion.button>
          ))}
        </nav>

        {/* Theme Toggle & Logout */}
        <div className="p-4 border-t border-gray-200 dark:border-navy-700 space-y-2">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowProfileModal(true)}
            className={`w-full flex items-center ${isSidebarExpanded ? 'gap-3' : 'justify-center'} px-4 py-3 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-navy-700 transition-all duration-300 ease-in-out`}
            title={t('profile.myProfile') || 'My Profile'}
          >
            <FaUserCircle className="w-5 h-5 flex-shrink-0" />
            {isSidebarExpanded && <span className="font-medium whitespace-nowrap">{t('profile.myProfile') || 'My Profile'}</span>}
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/')}
            className={`w-full flex items-center ${isSidebarExpanded ? 'gap-3' : 'justify-center'} px-4 py-3 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-navy-700 transition-all duration-300 ease-in-out`}
            title={t('nav.homeFeed')}
          >
            <FaGlobe className="w-5 h-5 flex-shrink-0" />
            {isSidebarExpanded && <span className="font-medium whitespace-nowrap">{t('nav.homeFeed')}</span>}
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={toggleTheme}
            className={`w-full flex items-center ${isSidebarExpanded ? 'gap-3' : 'justify-center'} px-4 py-3 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-navy-700 transition-all duration-300 ease-in-out`}
            title={isDark ? t('nav.lightMode') : t('nav.darkMode')}
          >
            {isDark ? <FaSun className="w-5 h-5 text-gold-500 flex-shrink-0" /> : <FaMoon className="w-5 h-5 text-navy-600 flex-shrink-0" />}
            {isSidebarExpanded && <span className="font-medium whitespace-nowrap">{isDark ? t('nav.lightMode') : t('nav.darkMode')}</span>}
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleLogout}
            className={`w-full flex items-center ${isSidebarExpanded ? 'gap-3' : 'justify-center'} px-4 py-3 rounded-xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-300 ease-in-out`}
            title={t('nav.logout')}
          >
            <FaSignOutAlt className="w-5 h-5 flex-shrink-0" />
            {isSidebarExpanded && <span className="font-medium whitespace-nowrap">{t('nav.logout')}</span>}
          </motion.button>
        </div>
      </aside>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
            />
            <motion.aside
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: 'spring', damping: 20 }}
              className="fixed left-0 top-0 bottom-0 w-72 bg-white dark:bg-navy-800 shadow-2xl z-50 lg:hidden flex flex-col"
            >
              {/* Logo */}
              <div className="p-6 border-b border-gray-200 dark:border-navy-700 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary-600 to-teal-500 rounded-xl flex items-center justify-center shadow-lg">
                    <span className="text-white text-xl font-bold">PE</span>
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-800 dark:text-white">Project East</h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{t('nav.dashboard')}</p>
                  </div>
                </div>
                <motion.button
                  whileHover={{ rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setIsSidebarOpen(false)}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-navy-700"
                >
                  <FaTimes className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </motion.button>
              </div>

              {/* Navigation */}
              <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                {menuItems.map((item) => (
                  <motion.button
                    key={item.id}
                    onClick={() => handleNavigation(item.path)}
                    className={`
                      w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
                      ${isActiveRoute(item.path)
                        ? 'bg-gradient-to-r from-primary-600 to-primary-700 dark:from-teal-500 dark:to-teal-600 text-white shadow-lg'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-navy-700'
                      }
                    `}
                    whileTap={{ scale: 0.98 }}
                  >
                    <item.icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </motion.button>
                ))}
              </nav>

              {/* Theme Toggle & Logout */}
              <div className="p-4 border-t border-gray-200 dark:border-navy-700 space-y-2">
                <button
                  onClick={() => {
                    setShowProfileModal(true);
                    setIsSidebarOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-navy-700 transition-all"
                >
                  <FaUserCircle className="w-5 h-5" />
                  <span className="font-medium">{t('profile.myProfile') || 'My Profile'}</span>
                </button>

                <button
                  onClick={() => navigate('/')}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-navy-700 transition-all"
                >
                  <FaGlobe className="w-5 h-5" />
                  <span className="font-medium">{t('nav.homeFeed')}</span>
                </button>

                <button
                  onClick={toggleTheme}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-navy-700 transition-all"
                >
                  {isDark ? <FaSun className="w-5 h-5 text-gold-500" /> : <FaMoon className="w-5 h-5 text-navy-600" />}
                  <span className="font-medium">{isDark ? t('nav.lightMode') : t('nav.darkMode')}</span>
                </button>
                
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                >
                  <FaSignOutAlt className="w-5 h-5" />
                  <span className="font-medium">{t('nav.logout')}</span>
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${isSidebarExpanded ? 'lg:ml-72' : 'lg:ml-20'}`}>
        {/* Header */}
        <header className="bg-white dark:bg-navy-800 shadow-md border-b border-gray-200 dark:border-navy-700 sticky top-0 z-30">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {/* Logo Button for Mobile - Opens Sidebar */}
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsSidebarOpen(true)}
                  className="lg:hidden flex items-center gap-3 cursor-pointer"
                >
                  <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-teal-500 rounded-lg flex items-center justify-center shadow-lg">
                    <span className="text-white text-lg font-bold">PE</span>
                  </div>
                </motion.div>

                <div>
                  <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
                    {displayName}
                  </h1>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{displayUsername}</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                {/* Language Switcher */}
                <LanguageSwitcher />

                <div className="hidden md:block text-right">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('dashboard.welcome')} {greetingName}
                  </p>
                  <div className="flex items-center gap-2 justify-end">
                    <p className="text-xs text-gray-500 dark:text-gray-500">
                      {subscriptionLabel}
                    </p>
                    {instituteData.isVerified !== undefined && (
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                          instituteData.isVerified
                            ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
                            : 'bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300'
                        }`}
                      >
                        {instituteData.isVerified ? t('dashboard.verified') : t('dashboard.unverified')}
                      </span>
                    )}
                  </div>
                </div>
                
                {/* Notification Button */}
                <div className="relative" ref={notificationRef}>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-navy-700 transition-colors"
                  >
                    <FaBell className="text-gray-600 dark:text-gray-400 text-xl" />
                    {notifications.filter(n => !n.read).length > 0 && (
                      <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                        {notifications.filter(n => !n.read).length}
                      </span>
                    )}
                  </motion.button>

                  {/* Notification Popup */}
                  <AnimatePresence>
                    {showNotifications && (
                      <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        className="absolute right-0 mt-2 w-80 bg-white dark:bg-navy-800 rounded-xl shadow-2xl border border-gray-200 dark:border-navy-700 overflow-hidden z-50"
                      >
                        <div className="p-4 border-b border-gray-200 dark:border-navy-700 flex items-center justify-between">
                          <h3 className="font-bold text-gray-800 dark:text-white">{t('nav.notifications')}</h3>
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {notifications.filter(n => !n.read).length} new
                          </span>
                        </div>
                        <div className="max-h-96 overflow-y-auto">
                          {notifications.length === 0 ? (
                            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                              {t('nav.noNotifications')}
                            </div>
                          ) : (
                            notifications.map((notification) => (
                              <motion.div
                                key={notification.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className={`p-4 border-b border-gray-100 dark:border-navy-700 hover:bg-gray-50 dark:hover:bg-navy-900 transition-colors cursor-pointer ${
                                  !notification.read ? 'bg-primary-50 dark:bg-primary-900/20' : ''
                                }`}
                                onClick={() => setShowNotifications(false)}
                              >
                                <div className="flex items-start gap-3">
                                  <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                                    !notification.read ? 'bg-primary-600' : 'bg-transparent'
                                  }`} />
                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-semibold text-sm text-gray-800 dark:text-white mb-1">
                                      {notification.title}
                                    </h4>
                                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                                      {notification.message}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-500">
                                      {notification.time}
                                    </p>
                                  </div>
                                </div>
                              </motion.div>
                            ))
                          )}
                        </div>
                        <div className="p-3 border-t border-gray-200 dark:border-navy-700 text-center">
                          <button className="text-sm text-primary-600 dark:text-teal-400 hover:underline font-medium">
                            {t('nav.viewAllNotifications')}
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <motion.button
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowProfileModal(true)}
                  className="w-12 h-12 bg-gradient-to-br from-primary-600 to-teal-500 rounded-full flex items-center justify-center shadow-lg cursor-pointer overflow-hidden"
                  title={t('profile.myProfile') || 'My Profile'}
                >
                  {profileImage ? (
                    <img
                      src={profileImage}
                      alt="Profile"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.onerror = null;
                        setProfileImage(null);
                      }}
                    />
                  ) : (
                    <span className="text-white font-bold text-lg">
                      {avatarLetter}
                    </span>
                  )}
                </motion.button>
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 p-6 overflow-auto">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Routes>
              <Route path="/" element={<Overview />} />
              <Route path="/students" element={<Students />} />
              <Route path="/lecturers" element={<Teachers />} />
              <Route path="/staff" element={<Employees />} />
              <Route path="/schedule" element={<Schedule />} />
              <Route path="/finance" element={<Finance />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </motion.div>
        </main>

        {/* Mobile Bottom Navigation */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-navy-800 border-t border-gray-200 dark:border-navy-700 shadow-lg z-30">
          <div className="flex items-center justify-around p-2">
            {menuItems.slice(0, 5).map((item) => (
              <motion.button
                key={item.id}
                whileTap={{ scale: 0.9 }}
                onClick={() => handleNavigation(item.path)}
                className={`
                  flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all
                  ${isActiveRoute(item.path)
                    ? 'text-primary-600 dark:text-teal-400'
                    : 'text-gray-500 dark:text-gray-400'
                  }
                `}
              >
                <item.icon className="w-5 h-5" />
                <span className="text-xs font-medium">{item.label}</span>
              </motion.button>
            ))}
          </div>
        </nav>

        {/* Floating Action Buttons - Bottom Right Corner */}
        <div className="fixed bottom-6 right-6 flex flex-col items-end gap-3 z-40">
          {/* New Post Button */}
          <div className="relative group">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => checkVerificationAndOpen('new_post')}
              className="h-14 w-14 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white rounded-full shadow-lg flex items-center justify-center transition-all relative z-10"
            >
              <FaNewspaper className="w-6 h-6" />
            </motion.button>
            <div className="absolute right-0 top-0 h-14 bg-gradient-to-r from-purple-600 to-purple-700 rounded-full shadow-lg flex items-center pr-16 pl-6 overflow-hidden pointer-events-none w-0 opacity-0 group-hover:w-auto group-hover:opacity-100 transition-all duration-300 ease-out">
              <span className="whitespace-nowrap font-semibold text-sm text-white">
                {t('dashboard.newPost')}
              </span>
            </div>
          </div>

          {/* Create Course Button */}
          <div className="relative group">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => checkVerificationAndOpen('create')}
              className="h-14 w-14 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-500 hover:to-primary-600 text-white rounded-full shadow-lg flex items-center justify-center transition-all relative z-10"
            >
              <FaPlus className="w-6 h-6" />
            </motion.button>
            <div className="absolute right-0 top-0 h-14 bg-gradient-to-r from-primary-600 to-primary-700 rounded-full shadow-lg flex items-center pr-16 pl-6 overflow-hidden pointer-events-none w-0 opacity-0 group-hover:w-auto group-hover:opacity-100 transition-all duration-300 ease-out">
              <span className="whitespace-nowrap font-semibold text-sm text-white">
                {t('dashboard.createNewCourse')}
              </span>
            </div>
          </div>

          {/* Edit Courses Button */}
          <div className="relative group">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => checkVerificationAndOpen('edit')}
              className="h-14 w-14 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-500 hover:to-teal-600 text-white rounded-full shadow-lg flex items-center justify-center transition-all relative z-10"
            >
              <FaEdit className="w-6 h-6" />
            </motion.button>
            <div className="absolute right-0 top-0 h-14 bg-gradient-to-r from-teal-600 to-teal-700 rounded-full shadow-lg flex items-center pr-16 pl-6 overflow-hidden pointer-events-none w-0 opacity-0 group-hover:w-auto group-hover:opacity-100 transition-all duration-300 ease-out">
              <span className="whitespace-nowrap font-semibold text-sm text-white">
                {t('dashboard.editCurrentCourses')}
              </span>
            </div>
          </div>

          {/* Create Job Post Button */}
          <div className="relative group">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => checkVerificationAndOpen('job_post')}
              className="h-14 w-14 bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-500 hover:to-orange-600 text-white rounded-full shadow-lg flex items-center justify-center transition-all relative z-10"
            >
              <FaSuitcase className="w-6 h-6" />
            </motion.button>
            <div className="absolute right-0 top-0 h-14 bg-gradient-to-r from-orange-600 to-orange-700 rounded-full shadow-lg flex items-center pr-16 pl-6 overflow-hidden pointer-events-none w-0 opacity-0 group-hover:w-auto group-hover:opacity-100 transition-all duration-300 ease-out">
              <span className="whitespace-nowrap font-semibold text-sm text-white">
                {t('dashboard.createJobPost') || 'Create Job Post'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Verification Warning Modal */}
      <Modal
        isOpen={showVerificationWarning}
        onClose={() => setShowVerificationWarning(false)}
        title={t('dashboard.accountVerificationRequired')}
      >
        <div className="space-y-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center flex-shrink-0">
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                <FaCog className="w-6 h-6 text-amber-600 dark:text-amber-400" />
              </motion.div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
                {t('dashboard.verificationNeeded')}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {t('dashboard.verificationMessage')}
              </p>
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <p className="text-sm text-blue-800 dark:text-blue-300">
              <strong>{t('dashboard.whyVerify')}</strong> {t('dashboard.whyVerifyMessage')}
            </p>
          </div>

          <div className="flex gap-3">
            <AnimatedButton
              onClick={handleGoToSettings}
              className="flex-1"
            >
              {t('dashboard.goToSettings')}
            </AnimatedButton>
            <AnimatedButton
              variant="secondary"
              onClick={() => setShowVerificationWarning(false)}
              className="flex-1"
            >
              {t('common.ok')}
            </AnimatedButton>
          </div>
        </div>
      </Modal>

      {/* Create Course Modal */}
      <Modal
        isOpen={showCreateCourseModal}
        onClose={() => setShowCreateCourseModal(false)}
        title={t('dashboard.createNewCourse')}
      >
        <form onSubmit={handleCreateCourse} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Title - Required */}
            <div>
              <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
                {t('dashboard.courseTitle')} *
              </label>
              <input
                type="text"
                name="title"
                value={createForm.title}
                onChange={handleCreateChange}
                className="w-full px-4 py-3 border border-gray-300 dark:border-navy-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-navy-700 text-gray-900 dark:text-white"
                placeholder={t('dashboard.courseTitlePlaceholder')}
                required
              />
            </div>

            {/* Price - Required */}
            <div>
              <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
                {t('dashboard.price')} * ($)
              </label>
              <input
                type="number"
                name="price"
                value={createForm.price}
                onChange={handleCreateChange}
                min="0"
                step="0.01"
                className="w-full px-4 py-3 border border-gray-300 dark:border-navy-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-navy-700 text-gray-900 dark:text-white"
                placeholder={t('dashboard.pricePlaceholder')}
                required
              />
            </div>

            {/* Starting Date - Required */}
            <div>
              <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
                {t('dashboard.startingDate') || 'Starting Date'} * (YYYY-MM-DD)
              </label>
              <input
                type="date"
                name="starting_date"
                value={createForm.starting_date}
                onChange={handleCreateChange}
                className="w-full px-4 py-3 border border-gray-300 dark:border-navy-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-navy-700 text-gray-900 dark:text-white"
                required
              />
            </div>

            {/* Ending Date - Required */}
            <div>
              <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
                {t('dashboard.endingDate') || 'Ending Date'} * (YYYY-MM-DD)
              </label>
              <input
                type="date"
                name="ending_date"
                value={createForm.ending_date}
                onChange={handleCreateChange}
                min={createForm.starting_date || undefined}
                className="w-full px-4 py-3 border border-gray-300 dark:border-navy-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-navy-700 text-gray-900 dark:text-white"
                required
              />
            </div>

            {/* Level - Required */}
            <div>
              <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
                {t('dashboard.level') || 'Level'} *
              </label>
              <select
                name="level"
                value={createForm.level}
                onChange={handleCreateChange}
                className="w-full px-4 py-3 border border-gray-300 dark:border-navy-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-navy-700 text-gray-900 dark:text-white"
                required
              >
                <option value="beginner">{t('dashboard.beginner') || 'Beginner'}</option>
                <option value="intermediate">{t('dashboard.intermediate') || 'Intermediate'}</option>
                <option value="advanced">{t('dashboard.advanced') || 'Advanced'}</option>
              </select>
            </div>

            {/* Lecturer - Required */}
            <div>
              <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
                {t('dashboard.lecturer') || 'Lecturer'} *
              </label>
              <select
                name="lecturer"
                value={createForm.lecturer}
                onChange={handleCreateChange}
                disabled={isLoadingLecturers}
                className="w-full px-4 py-3 border border-gray-300 dark:border-navy-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-navy-700 text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                required
              >
                <option value="">{isLoadingLecturers ? t('common.loading') : t('dashboard.selectLecturer') || 'Select Lecturer'}</option>
                {lecturers.map((lecturer) => (
                  <option key={lecturer.id} value={lecturer.id}>
                    {lecturer.first_name} {lecturer.last_name} {lecturer.specialty ? `- ${lecturer.specialty}` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Start Time - Required */}
            <div>
              <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
                {t('dashboard.startTime') || 'Start Time'} * (HH:MM)
              </label>
              <input
                type="time"
                name="start_time"
                value={createForm.start_time}
                onChange={handleCreateChange}
                className="w-full px-4 py-3 border border-gray-300 dark:border-navy-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-navy-700 text-gray-900 dark:text-white"
                required
              />
            </div>

            {/* End Time - Required */}
            <div>
              <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
                {t('dashboard.endTime') || 'End Time'} * (HH:MM)
              </label>
              <input
                type="time"
                name="end_time"
                value={createForm.end_time}
                onChange={handleCreateChange}
                className="w-full px-4 py-3 border border-gray-300 dark:border-navy-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-navy-700 text-gray-900 dark:text-white"
                required
              />
            </div>
          </div>

          {/* Days - Required */}
          <div>
            <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
              {t('dashboard.days') || 'Days'} * (Select at least one)
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => (
                <label key={day} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="days"
                    value={day}
                    checked={createForm.days.includes(day)}
                    onChange={handleCreateChange}
                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <span className="text-gray-700 dark:text-gray-300 capitalize">{t(`dashboard.${day}`) || day}</span>
                </label>
              ))}
            </div>
          </div>

          {/* About/Description - Required */}
          <div>
            <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
              {t('dashboard.about') || 'About'} *
            </label>
            <textarea
              name="about"
              value={createForm.about}
              onChange={handleCreateChange}
              rows="4"
              className="w-full px-4 py-3 border border-gray-300 dark:border-navy-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-navy-700 text-gray-900 dark:text-white resize-none"
              placeholder={t('dashboard.aboutPlaceholder') || 'Course description...'}
              required
            />
          </div>

          {/* Course Image - Optional */}
          <div>
            <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
              {t('dashboard.courseImage') || 'Course Image'} ({t('common.optional') || 'Optional'})
            </label>
            <input
              type="file"
              name="course_image"
              accept="image/*"
              onChange={handleCreateChange}
              className="w-full px-4 py-3 border border-gray-300 dark:border-navy-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-navy-700 text-gray-900 dark:text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 dark:file:bg-navy-800 dark:file:text-teal-400"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <AnimatedButton type="submit" className="flex-1">
              {t('dashboard.createCourse')}
            </AnimatedButton>
            <AnimatedButton
              type="button"
              variant="secondary"
              onClick={() => setShowCreateCourseModal(false)}
              className="flex-1"
            >
              {t('common.cancel')}
            </AnimatedButton>
          </div>
        </form>
      </Modal>

      {/* Edit Courses Modal */}
      <Modal
        isOpen={showEditCoursesModal}
        onClose={() => {
          setShowEditCoursesModal(false);
          setSelectedCourse(null);
        }}
        title={selectedCourse ? t('dashboard.editCourse') : t('dashboard.manageCourses')}
      >
        {!selectedCourse ? (
          <div className="space-y-3">
            {courses.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 dark:text-gray-400">
                  {t('dashboard.noCourses')}
                </p>
              </div>
            ) : (
              courses.map((course) => (
                <motion.div
                  key={course.id}
                  whileHover={{ scale: 1.02 }}
                  className="p-4 border-2 border-gray-200 dark:border-navy-700 rounded-lg hover:border-primary-500 dark:hover:border-teal-500 transition-all cursor-pointer"
                  onClick={() => handleEditCourse(course)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-gray-800 dark:text-white">{course.title}</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{course.code}</p>
                    </div>
                    <span className="px-3 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-full text-sm font-semibold">
                      ${course.price}
                    </span>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        ) : (
          <form onSubmit={handleUpdateCourse} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
                  {t('dashboard.courseTitle')} *
                </label>
                <input
                  type="text"
                  name="title"
                  value={editForm.title}
                  onChange={handleEditChange}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-navy-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-navy-700 text-gray-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
                  {t('dashboard.courseCode')} *
                </label>
                <input
                  type="text"
                  name="code"
                  value={editForm.code}
                  onChange={handleEditChange}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-navy-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-navy-700 text-gray-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
                  {t('dashboard.credits')}
                </label>
                <input
                  type="number"
                  name="credits"
                  value={editForm.credits}
                  onChange={handleEditChange}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-navy-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-navy-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
                  {t('dashboard.duration')}
                </label>
                <input
                  type="text"
                  name="duration"
                  value={editForm.duration}
                  onChange={handleEditChange}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-navy-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-navy-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
                  {t('dashboard.capacity')}
                </label>
                <input
                  type="number"
                  name="capacity"
                  value={editForm.capacity}
                  onChange={handleEditChange}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-navy-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-navy-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
                  {t('dashboard.price')} *
                </label>
                <input
                  type="number"
                  name="price"
                  value={editForm.price}
                  onChange={handleEditChange}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-navy-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-navy-700 text-gray-900 dark:text-white"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
                {t('dashboard.description')}
              </label>
              <textarea
                name="description"
                value={editForm.description}
                onChange={handleEditChange}
                rows="4"
                className="w-full px-4 py-3 border border-gray-300 dark:border-navy-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-navy-700 text-gray-900 dark:text-white resize-none"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <AnimatedButton type="submit" className="flex-1">
                {t('dashboard.updateCourse')}
              </AnimatedButton>
              <AnimatedButton
                type="button"
                variant="secondary"
                onClick={() => handleDeleteCourse(selectedCourse.id)}
                className="flex-1 bg-red-600 hover:bg-red-500"
              >
                {t('dashboard.deleteCourse')}
              </AnimatedButton>
              <AnimatedButton
                type="button"
                variant="secondary"
                onClick={() => setSelectedCourse(null)}
                className="flex-1"
              >
                {t('common.back')}
              </AnimatedButton>
            </div>
          </form>
        )}
      </Modal>

      {/* New Post Modal */}
      <Modal
        isOpen={showNewPostModal}
        onClose={() => setShowNewPostModal(false)}
        title={t('dashboard.createNewPost')}
      >
        <form onSubmit={handleCreatePost} className="space-y-4">
          <div>
            <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
              {t('post.postTitle') || 'Post Title'} *
            </label>
            <input
              type="text"
              name="title"
              value={postForm.title}
              onChange={handlePostChange}
              className="w-full px-4 py-3 border border-gray-300 dark:border-navy-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-navy-700 text-gray-900 dark:text-white"
              placeholder={t('post.postTitlePlaceholder') || 'Enter post title...'}
              required
            />
          </div>

          <div>
            <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
              {t('post.description') || 'Description'}
            </label>
            <textarea
              name="description"
              value={postForm.description}
              onChange={handlePostChange}
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 dark:border-navy-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-navy-700 text-gray-900 dark:text-white resize-none"
              placeholder={t('post.descriptionPlaceholder') || 'Enter post description...'}
            />
          </div>

          <div>
            <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
              {t('post.images') || 'Images'} ({t('post.optional') || 'Optional'})
            </label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handlePostImageChange}
              className="w-full px-4 py-3 border border-gray-300 dark:border-navy-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-navy-700 text-gray-900 dark:text-white"
            />
            {postForm.images.length > 0 && (
              <div className="mt-2 grid grid-cols-3 gap-2">
                {postForm.images.map((image, index) => (
                  <div key={index} className="relative">
                    <img
                      src={URL.createObjectURL(image)}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemovePostImage(index)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <AnimatedButton
              type="submit"
              className="flex-1"
              disabled={isCreatingPost}
            >
              {isCreatingPost ? (t('common.saving') || 'Saving...') : (t('post.createPost') || 'Create Post')}
            </AnimatedButton>
            <AnimatedButton
              type="button"
              variant="secondary"
              onClick={() => {
                setShowNewPostModal(false);
                setPostForm({ title: '', description: '', images: [] });
              }}
              className="flex-1"
              disabled={isCreatingPost}
            >
              {t('common.cancel')}
            </AnimatedButton>
          </div>
        </form>
      </Modal>

      {/* Create Job Post Modal */}
      <Modal
        isOpen={showJobPostModal}
        onClose={() => setShowJobPostModal(false)}
        title={t('dashboard.createJobPost') || 'Create Job Post'}
      >
        <form onSubmit={handleCreateJobPost} className="space-y-4">
          {/* Title - Required */}
          <div>
            <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
              {t('dashboard.jobTitle') || 'Job Title'} *
            </label>
            <input
              type="text"
              name="title"
              value={jobPostForm.title}
              onChange={handleJobPostChange}
              className="w-full px-4 py-3 border border-gray-300 dark:border-navy-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-navy-700 text-gray-900 dark:text-white"
              placeholder={t('dashboard.jobTitlePlaceholder') || 'e.g. Senior Mathematics Lecturer'}
              required
            />
          </div>

          {/* Specialty - Required */}
          <div>
            <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
              {t('dashboard.specialty') || 'Specialty'} *
            </label>
            <input
              type="text"
              name="specialty"
              value={jobPostForm.specialty}
              onChange={handleJobPostChange}
              className="w-full px-4 py-3 border border-gray-300 dark:border-navy-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-navy-700 text-gray-900 dark:text-white"
              placeholder={t('dashboard.specialtyPlaceholder') || 'e.g. Mathematics, Computer Science'}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Experience Required - Required */}
            <div>
              <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
                {t('dashboard.experienceRequired') || 'Experience Required'} * (years)
              </label>
              <input
                type="number"
                name="experience_required"
                value={jobPostForm.experience_required}
                onChange={handleJobPostChange}
                min="0"
                className="w-full px-4 py-3 border border-gray-300 dark:border-navy-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-navy-700 text-gray-900 dark:text-white"
                placeholder={t('dashboard.experiencePlaceholder') || 'e.g. 5'}
                required
              />
            </div>

            {/* Salary Offer - Required */}
            <div>
              <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
                {t('dashboard.salaryOffer') || 'Salary Offer'} * ($)
              </label>
              <input
                type="number"
                name="salary_offer"
                value={jobPostForm.salary_offer}
                onChange={handleJobPostChange}
                min="0"
                className="w-full px-4 py-3 border border-gray-300 dark:border-navy-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-navy-700 text-gray-900 dark:text-white"
                placeholder={t('dashboard.salaryPlaceholder') || 'e.g. 5000'}
                required
              />
            </div>
          </div>

          {/* Skills Required - Optional */}
          <div>
            <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
              {t('dashboard.skillsRequired') || 'Skills Required'} ({t('common.optional') || 'Optional'})
            </label>
            <input
              type="text"
              name="skills_required"
              value={jobPostForm.skills_required}
              onChange={handleJobPostChange}
              className="w-full px-4 py-3 border border-gray-300 dark:border-navy-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-navy-700 text-gray-900 dark:text-white"
              placeholder={t('dashboard.skillsPlaceholder') || 'e.g. Python, JavaScript, Teaching'}
            />
          </div>

          {/* Description - Optional */}
          <div>
            <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
              {t('dashboard.description') || 'Description'} ({t('common.optional') || 'Optional'})
            </label>
            <textarea
              name="description"
              value={jobPostForm.description}
              onChange={handleJobPostChange}
              rows="4"
              className="w-full px-4 py-3 border border-gray-300 dark:border-navy-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-navy-700 text-gray-900 dark:text-white resize-none"
              placeholder={t('dashboard.jobDescriptionPlaceholder') || 'Job description and requirements...'}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <AnimatedButton
              type="submit"
              className="flex-1"
              disabled={isCreatingJobPost}
            >
              {isCreatingJobPost ? (t('common.saving') || 'Saving...') : (t('dashboard.createJobPost') || 'Create Job Post')}
            </AnimatedButton>
            <AnimatedButton
              type="button"
              variant="secondary"
              onClick={() => {
                setShowJobPostModal(false);
                setJobPostForm({
                  title: '',
                  description: '',
                  specialty: '',
                  experience_required: '',
                  skills_required: '',
                  salary_offer: '',
                });
              }}
              className="flex-1"
              disabled={isCreatingJobPost}
            >
              {t('common.cancel')}
            </AnimatedButton>
          </div>
        </form>
      </Modal>

      {/* Profile Modal */}
      <ProfileModal 
        isOpen={showProfileModal} 
        onClose={() => setShowProfileModal(false)} 
      />
    </div>
  );
};

export default EnhancedDashboard;

