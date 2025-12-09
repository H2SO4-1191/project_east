import { useState, useRef, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { 
  FaHome, FaUsers, FaChalkboardTeacher, FaBriefcase, 
  FaCalendarAlt, FaDollarSign, FaCog, FaBars, FaTimes,
  FaMoon, FaSun, FaSignOutAlt, FaGlobe, FaPlus, FaEdit, FaBook, FaClock, FaNewspaper, FaUserCircle, FaSuitcase, FaClipboardList, FaChevronRight, FaBookmark, FaInfoCircle
} from 'react-icons/fa';
import { useInstitute } from '../context/InstituteContext';
import { useTheme } from '../context/ThemeContext';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { authService } from '../services/authService';
import Modal from '../components/Modal';
import AnimatedButton from '../components/AnimatedButton';
import LanguageSwitcher from '../components/LanguageSwitcher';
import ProfileModal from '../components/ProfileModal';
import KeyboardShortcutsHelp from '../components/KeyboardShortcutsHelp';
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
  const [isLoadingCourses, setIsLoadingCourses] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [showNewPostModal, setShowNewPostModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showJobPostModal, setShowJobPostModal] = useState(false);
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [institutionTitle, setInstitutionTitle] = useState(null);
  const [username, setUsername] = useState(null);
  
  // Keyboard shortcuts
  useKeyboardShortcuts({
    onCreate: () => checkVerificationAndOpen('create'),
    onEdit: () => checkVerificationAndOpen('edit'),
    onSettings: () => navigate('/dashboard/settings'),
    onHelp: () => setShowKeyboardHelp(true),
    enableCreate: true,
    enableEdit: true,
    userType: 'institution',
  });
  const [isCreatingPost, setIsCreatingPost] = useState(false);
  const [isCreatingCourse, setIsCreatingCourse] = useState(false);
  const [isUpdatingCourse, setIsUpdatingCourse] = useState(false);
  const [isCreatingJobPost, setIsCreatingJobPost] = useState(false);
  const [showApplicationsModal, setShowApplicationsModal] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState(null);
  const [applications, setApplications] = useState([]);
  const [isLoadingApplications, setIsLoadingApplications] = useState(false);
  const [jobPosts, setJobPosts] = useState([]);
  const [isLoadingJobs, setIsLoadingJobs] = useState(false);
  const [isMenuExpanded, setIsMenuExpanded] = useState(false);
  const menuTimeoutRef = useRef(null);
  
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
    start_time: '', // Will store 12-hour format for display
    end_time: '', // Will store 12-hour format for display
    lecturers: [], // Array of lecturer objects: { id, username, full_name, available, checking, message }
    lecturer_username: '', // Current input for searching lecturer by username
    capacity: '', // New field for course capacity
    course_image: null,
  });

  // Course image preview states
  const [createCourseImagePreview, setCreateCourseImagePreview] = useState(null);
  const [editCourseImagePreview, setEditCourseImagePreview] = useState(null);
  
  // Lecturer search state
  const [isSearchingLecturer, setIsSearchingLecturer] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState(null);
  
  // Lecturers list for dropdown
  const [lecturers, setLecturers] = useState([]);
  const [isLoadingLecturers, setIsLoadingLecturers] = useState(false);
  const [markedLecturers, setMarkedLecturers] = useState([]);
  const [isLoadingMarkedLecturers, setIsLoadingMarkedLecturers] = useState(false);
  const [markingLecturerId, setMarkingLecturerId] = useState(null); // Track which lecturer is being marked
  const [showLecturerConflictModal, setShowLecturerConflictModal] = useState(false);
  const [lecturerConflict, setLecturerConflict] = useState(null);

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

  // Cleanup sidebar timeout on unmount
  useEffect(() => {
    return () => {
      if (sidebarTimeoutRef.current) {
        clearTimeout(sidebarTimeoutRef.current);
      }
      if (menuTimeoutRef.current) {
        clearTimeout(menuTimeoutRef.current);
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
  const checkVerificationAndOpen = async (modalType) => {
    if (!instituteData.isVerified) {
      setShowVerificationWarning(true);
      return;
    }
    
    if (modalType === 'new_post') {
      setShowNewPostModal(true);
    } else if (modalType === 'create') {
      setShowCreateCourseModal(true);
    } else if (modalType === 'edit') {
      // Open modal first with loading state
      setShowEditCoursesModal(true);
      setIsLoadingCourses(true);
      setCourses([]);
      
      // Use the username from profile API (correct public username), not instituteData.username
      const usernameToUse = username || instituteData.username;
      console.log('Fetching courses for username:', usernameToUse); // Debug log
      
      // Fetch courses after opening modal
      if (usernameToUse) {
        try {
          const response = await authService.getInstitutionCourses(usernameToUse);
          console.log('Fetched courses:', response); // Debug log
          if (response?.results) {
            setCourses(response.results);
          } else if (response?.data) {
            setCourses(Array.isArray(response.data) ? response.data : []);
          } else {
            setCourses([]);
          }
        } catch (error) {
          console.error('Error fetching courses:', error);
          toast.error(t('dashboard.failedToLoadCourses') || 'Failed to load courses');
          setCourses([]);
        } finally {
          setIsLoadingCourses(false);
        }
      } else {
        console.warn('No username available to fetch courses');
        setIsLoadingCourses(false);
      }
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

  // Fetch job posts for the institution
  const fetchJobPosts = async () => {
    if (!instituteData.isAuthenticated || !instituteData.accessToken || !username) {
      return;
    }

    setIsLoadingJobs(true);
    try {
      const jobData = await authService.getInstitutionJobs(username);
      if (jobData?.success && jobData?.data) {
        setJobPosts(Array.isArray(jobData.data) ? jobData.data : []);
      } else {
        setJobPosts([]);
      }
    } catch (error) {
      console.error('Error fetching job posts:', error);
      setJobPosts([]);
    } finally {
      setIsLoadingJobs(false);
    }
  };

  // Fetch applications for a specific job
  const fetchApplications = async (jobId) => {
    if (!instituteData.isAuthenticated || !instituteData.accessToken || !jobId) {
      return;
    }

    setIsLoadingApplications(true);
    setSelectedJobId(jobId);
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

      const data = await authService.getJobApplications(instituteData.accessToken, jobId, options);
      if (data?.success && data?.applications) {
        setApplications(Array.isArray(data.applications) ? data.applications : []);
      } else {
        setApplications([]);
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
      toast.error(error?.message || t('dashboard.failedToLoadApplications') || 'Failed to load applications');
      setApplications([]);
    } finally {
      setIsLoadingApplications(false);
    }
  };

  // Handle opening applications modal
  const handleOpenApplications = async () => {
    if (!instituteData.isVerified) {
      setShowVerificationWarning(true);
      return;
    }

    await fetchJobPosts();
    setShowApplicationsModal(true);
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

  // Helper function to convert 12-hour time to 24-hour time
  const convertTo24Hour = (time12h) => {
    if (!time12h) return '';
    // Format: "HH:MM AM" or "HH:MM PM"
    const parts = time12h.trim().split(' ');
    if (parts.length !== 2) return '';
    const [time, period] = parts;
    const [hours, minutes] = time.split(':');
    if (!hours || !minutes || !period) return '';
    
    let hour24 = parseInt(hours);
    const periodUpper = period.toUpperCase();
    
    if (periodUpper === 'PM' && hour24 !== 12) {
      hour24 += 12;
    } else if (periodUpper === 'AM' && hour24 === 12) {
      hour24 = 0;
    }
    
    return `${hour24.toString().padStart(2, '0')}:${minutes}`;
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
      const file = e.target.files[0];
      setCreateForm(prev => ({ ...prev, [name]: file }));
      
      // Generate image preview for course_image
      if (name === 'course_image' && file) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setCreateCourseImagePreview(reader.result);
        };
        reader.readAsDataURL(file);
      } else if (name === 'course_image' && !file) {
        setCreateCourseImagePreview(null);
      }
    } else {
      setCreateForm(prev => ({ ...prev, [name]: value }));
      
      // Auto-search lecturer when username changes (with debouncing)
      if (name === 'lecturer_username') {
        // Clear previous timeout
        if (searchTimeout) {
          clearTimeout(searchTimeout);
        }
        
        // Set new timeout for auto-search
        if (value && value.trim()) {
          const timeout = setTimeout(() => {
            handleAutoSearchLecturer(value.trim());
          }, 800); // Wait 800ms after user stops typing
          setSearchTimeout(timeout);
        }
      }
    }
  };

  // Auto-search lecturer by username and check availability
  const handleAutoSearchLecturer = async (username) => {
    if (!username) return;

    // Check if lecturer already added
    const alreadyAdded = createForm.lecturers.find(l => l.username === username);
    if (alreadyAdded) {
      toast.info(t('dashboard.lecturerAlreadyAdded') || 'This lecturer is already added');
      return;
    }

    setIsSearchingLecturer(true);

    try {
      // Step 1: Search for lecturer
      const data = await authService.getLecturerPublicProfile(username);
      
      if (data?.success && data?.data) {
        const lecturerData = data.data;
        
        // Add lecturer to the list with "checking" status
        const newLecturer = {
          id: lecturerData.id,
          username: lecturerData.username,
          full_name: `${lecturerData.first_name || ''} ${lecturerData.last_name || ''}`.trim(),
          first_name: lecturerData.first_name,
          last_name: lecturerData.last_name,
          specialty: lecturerData.specialty,
          profile_image: lecturerData.profile_image,
          available: null,
          checking: true,
          message: t('dashboard.checkingAvailability') || 'Checking availability...',
        };

        setCreateForm(prev => ({
          ...prev,
          lecturers: [...prev.lecturers, newLecturer],
          lecturer_username: '', // Clear input
        }));

        toast.success(t('dashboard.lecturerFound') || `Lecturer found: ${newLecturer.full_name}`);

        // Step 2: Auto-check availability if days and times are set
        if (createForm.days.length > 0 && createForm.start_time && createForm.end_time) {
          await checkLecturerAvailability(lecturerData.id);
        } else {
          // Update lecturer status to indicate missing info
          setCreateForm(prev => ({
            ...prev,
            lecturers: prev.lecturers.map(l => 
              l.id === lecturerData.id 
                ? { ...l, checking: false, available: null, message: t('dashboard.selectDaysAndTimes') || 'Select days and times to check availability' }
                : l
            )
          }));
        }
      } else {
        toast.error(t('dashboard.lecturerNotFound') || 'Lecturer not found');
      }
    } catch (error) {
      console.error('Error searching lecturer:', error);
      toast.error(error?.message || t('dashboard.lecturerSearchFailed') || 'Failed to search lecturer');
    } finally {
      setIsSearchingLecturer(false);
    }
  };

  // Check lecturer availability
  const checkLecturerAvailability = async (lecturerId) => {
    if (!createForm.days || createForm.days.length === 0 || !createForm.start_time || !createForm.end_time) {
      return;
    }

    // Check if user is authenticated
    if (!instituteData.accessToken || !instituteData.isAuthenticated) {
      console.error('Not authenticated - cannot check lecturer availability');
      setCreateForm(prev => ({
        ...prev,
        lecturers: prev.lecturers.map(l => 
          l.id === lecturerId 
            ? { ...l, checking: false, available: null, message: t('common.authRequired') || 'Authentication required' }
            : l
        )
      }));
      return;
    }

    // Convert times from 12-hour to 24-hour format for backend
    const startTime24 = convertTo24Hour(createForm.start_time);
    const endTime24 = convertTo24Hour(createForm.end_time);

    if (!startTime24 || !endTime24) {
      console.error('Failed to convert times to 24-hour format');
      return;
    }

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

      const data = await authService.isLecturerFree(
        instituteData.accessToken,
        lecturerId,
        createForm.days,
        startTime24,
        endTime24,
        options
      );

      // Debug logging to see the actual response
      console.log('Lecturer availability response:', data);

      // Handle response - backend may return different structures
      if (data && (data.success === true || data.is_free !== undefined)) {
        const available = data.is_free;
        const message = data.message || (available ? t('dashboard.lecturerAvailable') || 'Available!' : t('dashboard.lecturerNotAvailable') || 'Not available');
        
        // Update lecturer in the list
        setCreateForm(prev => ({
          ...prev,
          lecturers: prev.lecturers.map(l => 
            l.id === lecturerId 
              ? { ...l, checking: false, available, message }
              : l
          )
        }));
      } else {
        console.error('Unexpected response structure:', data);
        setCreateForm(prev => ({
          ...prev,
          lecturers: prev.lecturers.map(l => 
            l.id === lecturerId 
              ? { ...l, checking: false, available: null, message: 'Failed to check' }
              : l
          )
        }));
      }
    } catch (error) {
      console.error('Error checking availability:', error);
      
      // Check if it's an authentication error
      let errorMessage = 'Error checking availability';
      if (error?.status === 401) {
        errorMessage = t('common.authRequired') || 'Authentication required';
      } else if (error?.status === 403) {
        errorMessage = t('common.permissionDenied') || 'Permission denied';
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      setCreateForm(prev => ({
        ...prev,
        lecturers: prev.lecturers.map(l => 
          l.id === lecturerId 
            ? { ...l, checking: false, available: null, message: errorMessage }
            : l
        )
      }));
    }
  };

  // Re-check all lecturers availability when days or times change
  const recheckAllLecturersAvailability = async () => {
    if (!createForm.days.length || !createForm.start_time || !createForm.end_time) return;
    
    // Mark all as checking
    setCreateForm(prev => ({
      ...prev,
      lecturers: prev.lecturers.map(l => ({ ...l, checking: true, message: 'Checking availability...' }))
    }));

    // Check each lecturer
    for (const lecturer of createForm.lecturers) {
      await checkLecturerAvailability(lecturer.id);
    }
  };

  // Remove lecturer from list
  const removeLecturer = (lecturerId) => {
    setCreateForm(prev => ({
      ...prev,
      lecturers: prev.lecturers.filter(l => l.id !== lecturerId)
    }));
  };

  // Handle marked lecturer selection
  const handleMarkedLecturerSelect = (lecturerId) => {
    const selected = markedLecturers.find(l => l.id === parseInt(lecturerId));
    if (selected && selected.username) {
      setCreateForm(prev => ({ ...prev, lecturer_username: selected.username }));
      handleAutoSearchLecturer(selected.username);
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
      const file = e.target.files[0];
      setEditForm(prev => ({ ...prev, [name]: file }));
      
      // Generate image preview for course_image
      if (name === 'course_image' && file) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setEditCourseImagePreview(reader.result);
        };
        reader.readAsDataURL(file);
      } else if (name === 'course_image' && !file) {
        setEditCourseImagePreview(null);
      }
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

  // Fetch marked lecturers when create course modal opens
  useEffect(() => {
    const fetchMarkedLecturers = async () => {
      if (!instituteData.accessToken || !showCreateCourseModal) return;
      
      setIsLoadingMarkedLecturers(true);
      try {
        const response = await authService.getMarkedLecturers(instituteData.accessToken, {
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
        });
        
        if (response?.success && Array.isArray(response.lecturers)) {
          setMarkedLecturers(response.lecturers);
        } else if (Array.isArray(response)) {
          setMarkedLecturers(response);
        } else {
          setMarkedLecturers([]);
        }
      } catch (error) {
        console.error('Failed to fetch marked lecturers:', error);
        setMarkedLecturers([]);
      } finally {
        setIsLoadingMarkedLecturers(false);
      }
    };
    
    fetchMarkedLecturers();
  }, [instituteData.accessToken, showCreateCourseModal]);

  // Auto-recheck lecturer availability when days or times change
  useEffect(() => {
    if (createForm.lecturers.length > 0 && createForm.days.length > 0 && createForm.start_time && createForm.end_time) {
      recheckAllLecturersAvailability();
    }
  }, [createForm.days, createForm.start_time, createForm.end_time]);

  // Handle marking a lecturer
  const handleMarkLecturer = async (lecturerId) => {
    if (!lecturerId) {
      toast.error(t('dashboard.lecturerIdRequired') || 'Lecturer ID is required');
      return;
    }
    
    if (!instituteData.accessToken) {
      toast.error(t('common.sessionExpired') || 'Session expired. Please log in again.');
      return;
    }
    
    setMarkingLecturerId(lecturerId);
    try {
      const response = await authService.markLecturer(
        instituteData.accessToken,
        lecturerId,
        {
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
        }
      );
      
      if (response?.success) {
        toast.success(response.message || t('dashboard.lecturerMarked') || 'Lecturer marked successfully!');
        // Refresh marked lecturers list
        const updatedResponse = await authService.getMarkedLecturers(instituteData.accessToken, {
          refreshToken: instituteData.refreshToken,
          onTokenRefreshed: (tokens) => {
            updateInstituteData({
              accessToken: tokens.access,
              refreshToken: tokens.refresh || instituteData.refreshToken,
            });
          },
        });
        if (updatedResponse?.success && Array.isArray(updatedResponse.lecturers)) {
          setMarkedLecturers(updatedResponse.lecturers);
        } else if (Array.isArray(updatedResponse)) {
          setMarkedLecturers(updatedResponse);
        }
      } else {
        toast.error(response?.message || t('dashboard.failedToMarkLecturer') || 'Failed to mark lecturer');
      }
    } catch (error) {
      console.error('Error marking lecturer:', error);
      toast.error(error?.message || error?.data?.message || t('dashboard.failedToMarkLecturer') || 'Failed to mark lecturer');
    } finally {
      setMarkingLecturerId(null);
    }
  };

  const handleCreateCourse = async (e) => {
    e.preventDefault();
    
    // Ensure level has a default value
    const courseLevel = createForm.level || 'beginner';
    
    // Validate all required fields
    if (!createForm.title || !createForm.about || !createForm.starting_date || 
        !createForm.ending_date || !courseLevel || !createForm.price ||
        !createForm.days.length || !createForm.start_time || !createForm.end_time ||
        !createForm.lecturers.length) {
      toast.error(t('dashboard.fillRequiredFields') || 'Please fill in all required fields and add at least one lecturer');
      return;
    }

    // Check if all lecturers are available
    const unavailableLecturers = createForm.lecturers.filter(l => l.available === false);
    if (unavailableLecturers.length > 0) {
      const names = unavailableLecturers.map(l => l.full_name).join(', ');
      toast.error(t('dashboard.someLecturersNotAvailable') || `Some lecturers are not available: ${names}`);
      return;
    }
    
    // Validate dates
    if (new Date(createForm.ending_date) < new Date(createForm.starting_date)) {
      toast.error(t('dashboard.endingDateBeforeStarting') || 'Ending date cannot be before starting date');
      return;
    }
    
    // Convert 12-hour format (HH:MM AM/PM) to 24-hour format (HH:MM) for validation and API
    const startTime24 = convertTo24Hour(createForm.start_time);
    const endTime24 = convertTo24Hour(createForm.end_time);

    // Validate times
    if (!startTime24 || !endTime24) {
      toast.error(t('dashboard.invalidTimeFormat') || 'Please enter valid times in HH:MM AM/PM format');
      return;
    }

    if (endTime24 <= startTime24) {
      toast.error(t('dashboard.endTimeBeforeStart') || 'End time must be greater than start time');
      return;
    }
    
    // Validate price
    if (parseFloat(createForm.price) < 0) {
      toast.error(t('dashboard.priceMustBePositive') || 'Price must be positive');
      return;
    }

    // Validate capacity if provided
    if (createForm.capacity && createForm.capacity.trim()) {
      const capacityValue = parseInt(createForm.capacity);
      if (isNaN(capacityValue) || capacityValue <= 0) {
        toast.error(t('dashboard.capacityMustBePositive') || 'Capacity must be a positive number');
        return;
      }
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

      // Use the first available lecturer (API expects single lecturer)
      // In the future, if API supports multiple lecturers, we can send array
      const primaryLecturer = createForm.lecturers[0];
      const lecturerId = primaryLecturer.id;

      // Prepare payload with capacity if provided
      const payload = {
        title: createForm.title,
        about: createForm.about,
        starting_date: createForm.starting_date,
        ending_date: createForm.ending_date,
        level: courseLevel, // Enum: "beginner", "intermediate", "advanced" - with guaranteed default
        price: parseFloat(createForm.price),
        days: createForm.days, // Enum: "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"
        start_time: startTime24, // Converted to 24-hour format (HH:MM)
        end_time: endTime24, // Converted to 24-hour format (HH:MM)
        lecturer: lecturerId, // Integer (primary key) - using first lecturer
        course_image: createForm.course_image,
      };

      // Add capacity if provided
      if (createForm.capacity && createForm.capacity.trim()) {
        const capacityValue = parseInt(createForm.capacity);
        if (!isNaN(capacityValue) && capacityValue > 0) {
          payload.capacity = capacityValue;
        }
      }

      // Debug logging
      console.log('Creating course with payload:', {
        ...payload,
        course_image: payload.course_image ? 'File attached' : 'No file'
      });

      const result = await authService.createInstitutionCourse(
        instituteData.accessToken,
        payload,
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
          lecturers: [],
          lecturer_username: '',
          capacity: '',
          course_image: null,
        });
        // Reset image preview
        setCreateCourseImagePreview(null);
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
    // Populate edit form with course data
    setEditForm({
      title: course.title || '',
      about: course.about || '',
      starting_date: course.starting_date || '',
      ending_date: course.ending_date || '',
      level: course.level || 'beginner',
      price: course.price || '',
      days: course.days || [],
      start_time: course.start_time || '',
      end_time: course.end_time || '',
      lecturer: course.lecturer || '',
      course_image: null, // Don't pre-populate file input
    });
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
        setEditCourseImagePreview(null); // Reset image preview
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
      setEditCourseImagePreview(null); // Reset image preview
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

          {/* Language Switcher */}
          <div className={`w-full ${isSidebarExpanded ? '' : 'flex justify-center'}`}>
            <LanguageSwitcher variant="sidebar" />
          </div>
          
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

                {/* Language Switcher */}
                <LanguageSwitcher variant="sidebar" />
                
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
            <div className="flex items-center justify-between" style={{ direction: 'ltr' }}>
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
              </div>

              <div className="flex items-center gap-4 ml-auto" dir="ltr" style={{ direction: 'ltr' }}>
                <div className="hidden md:block text-right" style={{ direction: 'ltr' }}>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('dashboard.welcome')} {username || greetingName}
                  </p>
                  {instituteData.email && (
                    <p className="text-xs text-gray-500 dark:text-gray-500">{instituteData.email}</p>
                  )}
                  <div className="flex items-center gap-2 justify-end mt-1" style={{ direction: 'ltr' }}>
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

        {/* Floating Action Menu - Bottom Right Corner */}
        <div 
          className="fixed bottom-6 right-6 z-40"
          onMouseEnter={() => {
            setIsMenuExpanded(true);
            // Clear any existing timeout
            if (menuTimeoutRef.current) {
              clearTimeout(menuTimeoutRef.current);
            }
          }}
          onMouseLeave={() => {
            setIsMenuExpanded(false);
            // Clear timeout on mouse leave
            if (menuTimeoutRef.current) {
              clearTimeout(menuTimeoutRef.current);
            }
          }}
        >
          <div className="flex flex-col items-end gap-4">
            {/* Expanded Menu Buttons - Vertical Layout (Stacking from bottom to top) */}
            <AnimatePresence>
              {isMenuExpanded && (
                <>
                  {/* Applications Button - Top (appears last) */}
                  <motion.div
                    initial={{ opacity: 0, y: 50, scale: 0.5 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 50, scale: 0.5 }}
                    transition={{ duration: 0.3, delay: 0.4 }}
                    className="relative group"
                  >
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={handleOpenApplications}
                      className="h-14 w-14 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white rounded-full shadow-lg flex items-center justify-center transition-all relative z-10"
                    >
                      <FaClipboardList className="w-6 h-6" />
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={handleOpenApplications}
                      className="absolute right-16 top-0 h-14 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 rounded-full shadow-lg flex items-center pr-4 pl-6 whitespace-nowrap cursor-pointer"
                    >
                      <span className="font-semibold text-sm text-white">
                        {t('dashboard.applications') || 'Applications'}
                      </span>
                    </motion.button>
                  </motion.div>

                  {/* Create Job Post Button */}
                  <motion.div
                    initial={{ opacity: 0, y: 50, scale: 0.5 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 50, scale: 0.5 }}
                    transition={{ duration: 0.3, delay: 0.3 }}
                    className="relative group"
                  >
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => checkVerificationAndOpen('job_post')}
                      className="h-14 w-14 bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-500 hover:to-orange-600 text-white rounded-full shadow-lg flex items-center justify-center transition-all relative z-10"
                    >
                      <FaSuitcase className="w-6 h-6" />
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => checkVerificationAndOpen('job_post')}
                      className="absolute right-20 top-0 h-14 bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-500 hover:to-orange-600 rounded-full shadow-lg flex items-center pr-4 pl-6 whitespace-nowrap cursor-pointer z-0"
                    >
                      <span className="font-semibold text-sm text-white">
                        {t('dashboard.createJobPost') || 'Create Job Post'}
                      </span>
                    </motion.button>
                  </motion.div>

                  {/* Edit Courses Button */}
                  <motion.div
                    initial={{ opacity: 0, y: 50, scale: 0.5 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 50, scale: 0.5 }}
                    transition={{ duration: 0.3, delay: 0.2 }}
                    className="relative group"
                  >
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => checkVerificationAndOpen('edit')}
                      className="h-14 w-14 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-500 hover:to-teal-600 text-white rounded-full shadow-lg flex items-center justify-center transition-all relative z-10"
                    >
                      <FaEdit className="w-6 h-6" />
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => checkVerificationAndOpen('edit')}
                      className="absolute right-20 top-0 h-14 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-500 hover:to-teal-600 rounded-full shadow-lg flex items-center pr-4 pl-6 whitespace-nowrap cursor-pointer z-0"
                    >
                      <span className="font-semibold text-sm text-white">
                        {t('dashboard.editCurrentCourses')}
                      </span>
                    </motion.button>
                  </motion.div>

                  {/* Create Course Button */}
                  <motion.div
                    initial={{ opacity: 0, y: 50, scale: 0.5 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 50, scale: 0.5 }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                    className="relative group"
                  >
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => checkVerificationAndOpen('create')}
                      className="h-14 w-14 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-500 hover:to-primary-600 text-white rounded-full shadow-lg flex items-center justify-center transition-all relative z-10"
                    >
                      <FaPlus className="w-6 h-6" />
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => checkVerificationAndOpen('create')}
                      className="absolute right-20 top-0 h-14 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-500 hover:to-primary-600 rounded-full shadow-lg flex items-center pr-4 pl-6 whitespace-nowrap cursor-pointer z-0"
                    >
                      <span className="font-semibold text-sm text-white">
                        {t('dashboard.createNewCourse')}
                      </span>
                    </motion.button>
                  </motion.div>

                  {/* New Post Button - Bottom (appears first) */}
                  <motion.div
                    initial={{ opacity: 0, y: 50, scale: 0.5 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 50, scale: 0.5 }}
                    transition={{ duration: 0.3, delay: 0 }}
                    className="relative group"
                  >
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => checkVerificationAndOpen('new_post')}
                      className="h-14 w-14 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white rounded-full shadow-lg flex items-center justify-center transition-all relative z-10"
                    >
                      <FaNewspaper className="w-6 h-6" />
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => checkVerificationAndOpen('new_post')}
                      className="absolute right-20 top-0 h-14 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 rounded-full shadow-lg flex items-center pr-4 pl-6 whitespace-nowrap cursor-pointer z-0"
                    >
                      <span className="font-semibold text-sm text-white">
                        {t('dashboard.newPost')}
                      </span>
                    </motion.button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>

            {/* Main Menu Button */}
            <motion.div
              animate={{ rotate: isMenuExpanded ? 90 : 0 }}
              transition={{ duration: 0.3 }}
              className="relative"
            >
              <motion.button
                whileTap={{ scale: 0.95 }}
                className="h-16 w-16 text-white rounded-full shadow-xl flex items-center justify-center transition-all relative z-20"
                style={{ backgroundColor: '#52988E' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#4a8980'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#52988E'}
              >
                <FaBars className="w-7 h-7" />
              </motion.button>
            </motion.div>
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
        size="xl"
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
                value={createForm.level || 'beginner'}
                defaultValue="beginner"
                onChange={handleCreateChange}
                className="w-full px-4 py-3 border border-gray-300 dark:border-navy-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-navy-700 text-gray-900 dark:text-white"
                required
              >
                <option value="beginner">{t('dashboard.beginner') || 'Beginner'}</option>
                <option value="intermediate">{t('dashboard.intermediate') || 'Intermediate'}</option>
                <option value="advanced">{t('dashboard.advanced') || 'Advanced'}</option>
              </select>
            </div>

            {/* Lecturer Username Search - Required */}
            <div className="md:col-span-2">
              <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
                {t('dashboard.lecturerUsername') || 'Lecturer Username'} *
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  name="lecturer_username"
                  value={createForm.lecturer_username}
                  onChange={handleCreateChange}
                  className="flex-1 px-4 py-3 border border-gray-300 dark:border-navy-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-navy-700 text-gray-900 dark:text-white"
                  placeholder={t('dashboard.enterLecturerUsername') || 'Type username to search automatically...'}
                />
                {isSearchingLecturer && (
                  <div className="px-4 py-3 flex items-center">
                    <div className="w-5 h-5 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      handleMarkedLecturerSelect(e.target.value);
                      e.target.value = '';
                    }
                  }}
                  value=""
                  disabled={isLoadingMarkedLecturers}
                  className="px-4 py-3 border border-gray-300 dark:border-navy-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-navy-700 text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed min-w-[200px]"
                >
                  <option value="">{isLoadingMarkedLecturers ? t('common.loading') : t('dashboard.markedLecturers') || 'Marked Lecturers'}</option>
                  {markedLecturers.map((lecturer) => (
                    <option key={lecturer.id} value={lecturer.id}>
                      {lecturer.full_name || `${lecturer.first_name || ''} ${lecturer.last_name || ''}`.trim()}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Added Lecturers List */}
              {createForm.lecturers.length > 0 && (
                <div className="mt-4 space-y-2">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('dashboard.addedLecturers') || 'Added Lecturers'} ({createForm.lecturers.length})
                  </p>
                  {createForm.lecturers.map((lecturer) => (
                    <motion.div
                      key={lecturer.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className={`p-4 rounded-lg border-2 ${
                        lecturer.checking
                          ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700'
                          : lecturer.available === true
                          ? 'bg-green-50 dark:bg-green-900/20 border-green-500'
                          : lecturer.available === false
                          ? 'bg-red-50 dark:bg-red-900/20 border-red-500'
                          : 'bg-gray-50 dark:bg-gray-900/20 border-gray-300 dark:border-gray-700'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-12 h-12 bg-primary-100 dark:bg-primary-800 rounded-full flex items-center justify-center">
                          <span className="text-primary-600 dark:text-primary-300 font-bold text-lg">
                            {lecturer.first_name?.charAt(0) || 'L'}
                          </span>
                        </div>
                        <div className="flex-1">
                          <p className="text-gray-900 dark:text-white font-semibold">
                            {lecturer.full_name}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            @{lecturer.username} • {t('dashboard.lecturerId') || 'ID'}: {lecturer.id}
                          </p>
                          {lecturer.specialty && (
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {lecturer.specialty}
                            </p>
                          )}
                          <div className="mt-2 flex items-center gap-2">
                            {lecturer.checking ? (
                              <>
                                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                <span className="text-sm text-blue-600 dark:text-blue-400">
                                  {lecturer.message}
                                </span>
                              </>
                            ) : lecturer.available === true ? (
                              <>
                                <span className="text-2xl">✅</span>
                                <span className="text-sm font-medium text-green-700 dark:text-green-300">
                                  {lecturer.message}
                                </span>
                              </>
                            ) : lecturer.available === false ? (
                              <>
                                <span className="text-2xl">❌</span>
                                <span className="text-sm font-medium text-red-700 dark:text-red-300">
                                  {lecturer.message}
                                </span>
                              </>
                            ) : (
                              <span className="text-sm text-gray-600 dark:text-gray-400">
                                {lecturer.message}
                              </span>
                            )}
                          </div>
                        </div>
                        <motion.button
                          type="button"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => removeLecturer(lecturer.id)}
                          className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          title={t('common.remove') || 'Remove'}
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </motion.button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Capacity - Optional */}
            <div>
              <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
                {t('dashboard.capacity') || 'Capacity'} ({t('common.optional') || 'Optional'})
              </label>
              <input
                type="number"
                name="capacity"
                value={createForm.capacity}
                onChange={handleCreateChange}
                min="1"
                step="1"
                className="w-full px-4 py-3 border border-gray-300 dark:border-navy-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-navy-700 text-gray-900 dark:text-white"
                placeholder={t('dashboard.capacityPlaceholder') || 'e.g. 30'}
              />
            </div>

            {/* Start Time - Required (12-hour format with AM/PM) */}
            <div>
              <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
                {t('dashboard.startTime') || 'Start Time'} * (HH:MM AM/PM)
              </label>
              <div className="flex gap-2 items-center">
                <input
                  type="time"
                  onChange={(e) => {
                    // Convert 24-hour format from time input to 12-hour format (HH:MM AM/PM)
                    const time24 = e.target.value;
                    if (time24) {
                      const [hours, minutes] = time24.split(':');
                      const hour12 = parseInt(hours);
                      const period = hour12 >= 12 ? 'PM' : 'AM';
                      const hour12Formatted = hour12 % 12 || 12;
                      const time12h = `${hour12Formatted.toString().padStart(2, '0')}:${minutes} ${period}`;
                      setCreateForm(prev => ({ ...prev, start_time: time12h }));
                    } else {
                      setCreateForm(prev => ({ ...prev, start_time: '' }));
                    }
                  }}
                  className="flex-1 px-4 py-3 border border-gray-300 dark:border-navy-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-navy-700 text-gray-900 dark:text-white"
                  required
                />
                {createForm.start_time && (
                  <div className="px-4 py-3 bg-gray-100 dark:bg-navy-600 rounded-lg text-gray-700 dark:text-gray-300 flex items-center min-w-[120px] justify-center font-medium">
                    {createForm.start_time}
                  </div>
                )}
              </div>
            </div>

            {/* End Time - Required (12-hour format with AM/PM) */}
            <div>
              <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
                {t('dashboard.endTime') || 'End Time'} * (HH:MM AM/PM)
              </label>
              <div className="flex gap-2 items-center">
                <input
                  type="time"
                  onChange={(e) => {
                    // Convert 24-hour format from time input to 12-hour format (HH:MM AM/PM)
                    const time24 = e.target.value;
                    if (time24) {
                      const [hours, minutes] = time24.split(':');
                      const hour12 = parseInt(hours);
                      const period = hour12 >= 12 ? 'PM' : 'AM';
                      const hour12Formatted = hour12 % 12 || 12;
                      const time12h = `${hour12Formatted.toString().padStart(2, '0')}:${minutes} ${period}`;
                      setCreateForm(prev => ({ ...prev, end_time: time12h }));
                    } else {
                      setCreateForm(prev => ({ ...prev, end_time: '' }));
                    }
                  }}
                  className="flex-1 px-4 py-3 border border-gray-300 dark:border-navy-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-navy-700 text-gray-900 dark:text-white"
                  required
                />
                {createForm.end_time && (
                  <div className="px-4 py-3 bg-gray-100 dark:bg-navy-600 rounded-lg text-gray-700 dark:text-gray-300 flex items-center min-w-[120px] justify-center font-medium">
                    {createForm.end_time}
                  </div>
                )}
              </div>
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
            {createCourseImagePreview && (
              <div className="mt-3">
                <img
                  src={createCourseImagePreview}
                  alt="Course Preview"
                  className="w-full max-w-[200px] h-auto object-cover rounded-lg border-2 border-primary-500 shadow-md"
                />
              </div>
            )}
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
          setEditCourseImagePreview(null); // Reset image preview
        }}
        title={selectedCourse ? t('dashboard.editCourse') : t('dashboard.manageCourses')}
      >
        {!selectedCourse ? (
          <div className="space-y-3">
            {isLoadingCourses ? (
              <div className="text-center py-12">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="w-10 h-10 border-4 border-teal-200 dark:border-teal-800 border-t-teal-600 dark:border-t-teal-400 rounded-full mx-auto mb-4"
                />
                <p className="text-gray-600 dark:text-gray-400">
                  {t('dashboard.loadingCourses') || 'Loading courses...'}
                </p>
              </div>
            ) : courses.length === 0 ? (
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
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-800 dark:text-white">{course.title}</h4>
                      {course.level && (
                        <span className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-semibold ${
                          course.level === 'beginner' ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300' :
                          course.level === 'intermediate' ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300' :
                          'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300'
                        }`}>
                          {course.level}
                        </span>
                      )}
                      {course.starting_date && course.ending_date && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {course.starting_date} - {course.ending_date}
                        </p>
                      )}
                    </div>
                    <span className="px-3 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-full text-sm font-semibold">
                      ${parseFloat(course.price).toFixed(2)}
                    </span>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        ) : (
          <form onSubmit={handleUpdateCourse} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Title */}
              <div className="md:col-span-2">
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

              {/* Starting Date */}
              <div>
                <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
                  {t('dashboard.startingDate')} *
                </label>
                <input
                  type="date"
                  name="starting_date"
                  value={editForm.starting_date}
                  onChange={handleEditChange}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-navy-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-navy-700 text-gray-900 dark:text-white"
                  required
                />
              </div>

              {/* Ending Date */}
              <div>
                <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
                  {t('dashboard.endingDate')} *
                </label>
                <input
                  type="date"
                  name="ending_date"
                  value={editForm.ending_date}
                  onChange={handleEditChange}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-navy-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-navy-700 text-gray-900 dark:text-white"
                  required
                />
              </div>

              {/* Level */}
              <div>
                <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
                  {t('dashboard.courseLevel')} *
                </label>
                <select
                  name="level"
                  value={editForm.level}
                  onChange={handleEditChange}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-navy-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-navy-700 text-gray-900 dark:text-white"
                  required
                >
                  <option value="beginner">{t('dashboard.beginner') || 'Beginner'}</option>
                  <option value="intermediate">{t('dashboard.intermediate') || 'Intermediate'}</option>
                  <option value="advanced">{t('dashboard.advanced') || 'Advanced'}</option>
                </select>
              </div>

              {/* Price */}
              <div>
                <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
                  {t('dashboard.price')} *
                </label>
                <input
                  type="number"
                  name="price"
                  value={editForm.price}
                  onChange={handleEditChange}
                  step="0.01"
                  min="0"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-navy-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-navy-700 text-gray-900 dark:text-white"
                  required
                />
              </div>
            </div>

            {/* About/Description */}
            <div>
              <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
                {t('dashboard.aboutCourse')}
              </label>
              <textarea
                name="about"
                value={editForm.about}
                onChange={handleEditChange}
                rows="4"
                className="w-full px-4 py-3 border border-gray-300 dark:border-navy-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-navy-700 text-gray-900 dark:text-white resize-none"
                placeholder={t('dashboard.aboutCoursePlaceholder') || 'Enter course description...'}
              />
            </div>

            {/* Course Image */}
            <div>
              <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
                {t('dashboard.courseImage')} ({t('common.optional') || 'Optional'})
              </label>
              <input
                type="file"
                name="course_image"
                onChange={handleEditChange}
                accept="image/*"
                className="w-full px-4 py-3 border border-gray-300 dark:border-navy-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-navy-700 text-gray-900 dark:text-white"
              />
              {editCourseImagePreview && (
                <div className="mt-3">
                  <img
                    src={editCourseImagePreview}
                    alt="Course Preview"
                    className="w-full max-w-[200px] h-auto object-cover rounded-lg border-2 border-primary-500 shadow-md"
                  />
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-4">
              <AnimatedButton type="submit" disabled={isUpdatingCourse} className="flex-1">
                {isUpdatingCourse ? (t('common.updating') || 'Updating...') : (t('dashboard.updateCourse') || 'Update Course')}
              </AnimatedButton>
              <AnimatedButton
                type="button"
                variant="secondary"
                onClick={() => {
                  setSelectedCourse(null);
                  setEditCourseImagePreview(null); // Reset image preview
                }}
                className="flex-1"
              >
                {t('common.back') || 'Back'}
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

      {/* Lecturer Conflict Modal */}
      <AnimatePresence>
        {showLecturerConflictModal && lecturerConflict && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => {
              setShowLecturerConflictModal(false);
              setLecturerConflict(null);
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-navy-800 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-red-500 to-orange-500 p-6 text-center">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FaInfoCircle className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white">
                  {t('dashboard.lecturerScheduleConflict') || 'Lecturer Schedule Conflict'}
                </h3>
              </div>

              {/* Content */}
              <div className="p-6">
                <p className="text-gray-600 dark:text-gray-400 text-center mb-6">
                  {t('dashboard.lecturerConflictMessage') || 'The lecturer is not available at the requested time due to a scheduling conflict with another course.'}
                </p>

                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
                  <h4 className="font-semibold text-gray-800 dark:text-white mb-3">
                    {t('dashboard.conflictingCourse') || 'Conflicting Course:'}
                  </h4>
                  <div className="space-y-2 text-sm">
                    <p className="text-gray-700 dark:text-gray-300">
                      <span className="font-medium">{t('dashboard.course') || 'Course'}:</span> {lecturerConflict.course_title}
                    </p>
                    <p className="text-gray-700 dark:text-gray-300">
                      <span className="font-medium">{t('dashboard.institution') || 'Institution'}:</span> {lecturerConflict.institution}
                    </p>
                    {lecturerConflict.institution_username && (
                      <p className="text-gray-700 dark:text-gray-300">
                        <span className="font-medium">{t('dashboard.institutionUsername') || 'Institution Username'}:</span> @{lecturerConflict.institution_username}
                      </p>
                    )}
                    <p className="text-gray-700 dark:text-gray-300">
                      <span className="font-medium">{t('dashboard.day') || 'Day'}:</span> {lecturerConflict.day}
                    </p>
                    <p className="text-gray-700 dark:text-gray-300">
                      <span className="font-medium">{t('dashboard.time') || 'Time'}:</span> {lecturerConflict.time}
                    </p>
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setShowLecturerConflictModal(false);
                    setLecturerConflict(null);
                  }}
                  className="w-full px-4 py-3 bg-primary-600 hover:bg-primary-500 text-white rounded-lg font-medium transition-colors"
                >
                  {t('common.close') || 'Close'}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Applications Modal */}
      <Modal
        isOpen={showApplicationsModal}
        onClose={() => {
          setShowApplicationsModal(false);
          setSelectedJobId(null);
          setApplications([]);
        }}
        title={t('dashboard.applications') || 'Job Applications'}
      >
        <div className="space-y-6">
          {/* Job Selection */}
          {!selectedJobId && (
            <div>
              <label className="block text-gray-700 dark:text-gray-300 font-medium mb-3">
                {t('dashboard.selectJob') || 'Select a Job Post'}
              </label>
              {isLoadingJobs ? (
                <div className="flex items-center justify-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 dark:border-teal-400"></div>
                  <p className="ml-3 text-gray-600 dark:text-gray-400">{t('common.loading')}</p>
                </div>
              ) : jobPosts.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <p>{t('dashboard.noJobPosts') || 'No job posts available. Create a job post first.'}</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {jobPosts.map((job) => (
                    <motion.button
                      key={job.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => fetchApplications(job.id)}
                      className="w-full p-4 bg-gray-50 dark:bg-navy-700 rounded-lg border border-gray-200 dark:border-navy-600 hover:border-primary-500 dark:hover:border-teal-400 transition-colors text-left"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold text-gray-800 dark:text-white">{job.title}</h4>
                          {job.specialty && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              {job.specialty}
                            </p>
                          )}
                        </div>
                        <FaChevronRight className="text-gray-400 dark:text-gray-500" />
                      </div>
                    </motion.button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Applications List */}
          {selectedJobId && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() => {
                    setSelectedJobId(null);
                    setApplications([]);
                  }}
                  className="flex items-center gap-2 text-primary-600 dark:text-teal-400 hover:underline text-sm font-medium"
                >
                  <FaChevronRight className="rotate-180" />
                  {t('common.back') || 'Back'}
                </button>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                  {t('dashboard.applications') || 'Applications'}
                </h3>
              </div>

              {isLoadingApplications ? (
                <div className="flex items-center justify-center py-12">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 dark:border-teal-400"></div>
                  <p className="ml-3 text-gray-600 dark:text-gray-400">{t('common.loading')}</p>
                </div>
              ) : applications.length === 0 ? (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <FaClipboardList className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>{t('dashboard.noApplications') || 'No applications for this job post yet.'}</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {applications.map((application) => (
                    <motion.div
                      key={application.application_id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 bg-gray-50 dark:bg-navy-700 rounded-lg border border-gray-200 dark:border-navy-600"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-semibold text-gray-800 dark:text-white">
                            {application.first_name} {application.last_name}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {application.specialty} • {application.experience} {t('dashboard.yearsExperience') || 'years experience'}
                          </p>
                        </div>
                        <span className="text-xs text-gray-500 dark:text-gray-500">
                          {new Date(application.applied_at).toLocaleDateString()}
                        </span>
                      </div>

                      {application.skills && (
                        <div className="mb-3">
                          <p className="text-xs text-gray-500 dark:text-gray-500 mb-1">
                            {t('dashboard.skills') || 'Skills'}:
                          </p>
                          <p className="text-sm text-gray-700 dark:text-gray-300">{application.skills}</p>
                        </div>
                      )}

                      {application.message && (
                        <div className="mb-3">
                          <p className="text-xs text-gray-500 dark:text-gray-500 mb-1">
                            {t('dashboard.message') || 'Message'}:
                          </p>
                          <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                            {application.message}
                          </p>
                        </div>
                      )}

                      <div className="flex items-center gap-4 pt-3 border-t border-gray-200 dark:border-navy-600">
                        {application.email && (
                          <a
                            href={`mailto:${application.email}`}
                            className="text-sm text-primary-600 dark:text-teal-400 hover:underline"
                          >
                            {application.email}
                          </a>
                        )}
                        {application.phone_number && (
                          <a
                            href={`tel:${application.phone_number}`}
                            className="text-sm text-primary-600 dark:text-teal-400 hover:underline"
                          >
                            {application.phone_number}
                          </a>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </Modal>

      {/* Keyboard Shortcuts Help Modal */}
      <KeyboardShortcutsHelp 
        isOpen={showKeyboardHelp} 
        onClose={() => setShowKeyboardHelp(false)} 
      />
    </div>
  );
};

export default EnhancedDashboard;

