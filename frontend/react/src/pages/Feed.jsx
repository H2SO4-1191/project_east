import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  FaUniversity,
  FaUser,
  FaSignInAlt,
  FaSignOutAlt,
  FaTachometerAlt,
  FaMapMarkerAlt,
  FaUsers,
  FaChalkboardTeacher,
  FaMoon,
  FaSun,
  FaUserGraduate,
  FaBook,
  FaCompass,
  FaClock,
  FaDollarSign,
  FaInfoCircle,
  FaPen,
  FaBell,
  FaBriefcase,
  FaTrophy,
  FaTimes,
  FaCalendarAlt,
  FaCreditCard,
  FaSpinner,
  FaNewspaper
} from 'react-icons/fa';
import { useInstitute } from '../context/InstituteContext';
import { useTheme } from '../context/ThemeContext';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { authService } from '../services/authService';
import Modal from '../components/Modal';
import LanguageSwitcher from '../components/LanguageSwitcher';
import ProfileModal from '../components/ProfileModal';
import KeyboardShortcutsHelp from '../components/KeyboardShortcutsHelp';
import toast from 'react-hot-toast';

const Feed = () => {
  const navigate = useNavigate();
  const { instituteData, updateInstituteData } = useInstitute();
  const { isDark, toggleTheme } = useTheme();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [feedItems, setFeedItems] = useState([]);
  const [isLoadingFeed, setIsLoadingFeed] = useState(true);
  const [feedError, setFeedError] = useState(null);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [profileType, setProfileType] = useState(null); // 'student' or 'lecturer'
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showVerificationPopup, setShowVerificationPopup] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [username, setUsername] = useState(null);
  const [showInstitutionProfile, setShowInstitutionProfile] = useState(false);
  const [selectedInstitution, setSelectedInstitution] = useState(null);
  const [isLoadingInstitutionProfile, setIsLoadingInstitutionProfile] = useState(false);
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);
  const [enrollingCourseId, setEnrollingCourseId] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null);
  const [showApplyJobModal, setShowApplyJobModal] = useState(false);
  const [applyJobMessage, setApplyJobMessage] = useState('');
  const [isApplying, setIsApplying] = useState(false);
  const [hoveredItemId, setHoveredItemId] = useState(null);
  const [hoverInstitutionData, setHoverInstitutionData] = useState(null);
  const [isLoadingHoverInstitution, setIsLoadingHoverInstitution] = useState(false);
  const hoverTimeoutRef = useRef(null);
  const [isAddingPaymentMethod, setIsAddingPaymentMethod] = useState(false);

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onSearch: () => { }, // Search bar removed
    onHelp: () => setShowKeyboardHelp(true),
    userType: instituteData.userType,
  });


  // Check authentication status on mount
  useEffect(() => {
    // Verify if user has valid authentication data
    const hasValidAuth = instituteData.accessToken && instituteData.isAuthenticated;

    if (hasValidAuth) {
      console.log('User is authenticated:', {
        name: instituteData.name || instituteData.username,
        email: instituteData.email,
        userType: instituteData.userType,
        isVerified: instituteData.isVerified
      });

      // Fetch latest verification status for all authenticated users
      if (instituteData.email && instituteData.accessToken) {
        const checkVerification = async () => {
          try {
            const verificationStatus = await authService.checkVerificationStatus(
              instituteData.email,
              instituteData.accessToken
            );
            if (verificationStatus?.is_verified !== instituteData.isVerified) {
              updateInstituteData({
                isVerified: verificationStatus?.is_verified || false,
              });
              console.log('Verification status updated:', verificationStatus?.is_verified);
            }
          } catch (error) {
            console.warn('Failed to check verification status on feed load:', error);
          }
        };
        checkVerification();
      }
    } else {
      console.log('User is not authenticated - showing public feed');
    }
  }, [instituteData.accessToken, instituteData.isAuthenticated, instituteData.email, instituteData.userType]);

  // Helper function to convert relative image URLs to full URLs
  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }
    const baseUrl = import.meta.env.VITE_API_BASE_URL?.replace(/\/+$/, '') || 'https://projecteastapi.ddns.net';
    // Ensure imagePath starts with / and doesn't have duplicate /media/
    let cleanPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
    // Remove duplicate /media/ segments (handle multiple duplicates)
    cleanPath = cleanPath.replace(/\/media\/media+/g, '/media/');
    // Ensure path starts with /media/ (not /media/media/)
    if (cleanPath.startsWith('/media/media/')) {
      cleanPath = cleanPath.replace('/media/media/', '/media/');
    }
    const fullUrl = `${baseUrl}${cleanPath}`;
    console.log('Image URL conversion:', { original: imagePath, cleaned: cleanPath, fullUrl });
    return fullUrl;
  };

  const handleApplyJob = async () => {
    if (!selectedJob) return;
    if (!instituteData.isAuthenticated || instituteData.userType !== 'lecturer') {
      toast.error(t('feed.applyJobLecturerOnly') || 'Only lecturers can apply to jobs');
      return;
    }
    if (!instituteData.isVerified) {
      setShowVerificationPopup(true);
      return;
    }
    if (!instituteData.accessToken) {
      toast.error(t('common.sessionExpired') || 'Session expired. Please log in again.');
      return;
    }

    setIsApplying(true);
    try {
      const response = await authService.applyToJob(
        instituteData.accessToken,
        selectedJob.id,
        applyJobMessage,
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
        toast.success(response.message || t('feed.applicationSubmitted') || 'Application submitted successfully!');
        setShowApplyJobModal(false);
        setApplyJobMessage('');
        setSelectedJob(null);
      } else {
        toast.error(response?.message || t('feed.applicationFailed') || 'Failed to submit application');
      }
    } catch (error) {
      console.error('Error applying to job:', error);
      toast.error(error?.message || error?.data?.message || t('feed.applicationFailed') || 'Failed to submit application');
    } finally {
      setIsApplying(false);
    }
  };

  // Fetch user profile image on mount
  useEffect(() => {
    const fetchProfileImage = async () => {
      if (!instituteData.isAuthenticated || !instituteData.accessToken) {
        setProfileImage(null);
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
            console.log('Session expired');
          },
        };

        let data;
        if (instituteData.userType === 'institution') {
          data = await authService.getInstitutionProfile(instituteData.accessToken, options);
        } else if (instituteData.userType === 'lecturer') {
          data = await authService.getLecturerProfile(instituteData.accessToken, {
            ...options,
            isVerified: instituteData.isVerified,
            username: instituteData.username,
          });
        } else if (instituteData.userType === 'student') {
          data = await authService.getStudentProfile(instituteData.accessToken, {
            ...options,
            isVerified: instituteData.isVerified,
            username: instituteData.username,
          });
        }

        if (data?.success && data?.data) {
          if (data.data.profile_image) {
            setProfileImage(getImageUrl(data.data.profile_image));
          } else {
            setProfileImage(null);
          }
          if (data.data.username) {
            setUsername(data.data.username);
          }
        } else {
          setProfileImage(null);
        }
      } catch (err) {
        console.error('Error fetching profile image:', err);
        setProfileImage(null);
      }
    };

    fetchProfileImage();
  }, [instituteData.isAuthenticated, instituteData.accessToken, instituteData.userType, instituteData.refreshToken]);

  // Helper function to format timestamp
  const formatTimestamp = (createdAt) => {
    if (!createdAt) return '';
    try {
      const date = new Date(createdAt);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'} ago`;
      if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
      if (diffDays < 7) return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
      return date.toLocaleDateString();
    } catch {
      return createdAt;
    }
  };

  // Fetch Feed Data from API - Get mixed feed of posts, courses and jobs
  useEffect(() => {
    const fetchFeed = async () => {
      setIsLoadingFeed(true);
      setFeedError(null);

      try {
        const accessToken = instituteData.accessToken || null;
        const refreshToken = instituteData.refreshToken || null;

        // Get feed from new endpoint: GET /home/feed/
        const feedData = await authService.getFeed(accessToken, {
          refreshToken,
          onTokenRefreshed: (tokens) => {
            updateInstituteData({
              accessToken: tokens.access,
              refreshToken: tokens.refresh || refreshToken,
            });
          },
          onSessionExpired: () => {
            handleLogout();
          },
        });

        console.log('Feed data received:', feedData);
        console.log('Feed data structure:', {
          count: feedData?.count,
          hasResults: !!feedData?.results,
          resultsLength: feedData?.results?.length,
          hasNext: !!feedData?.next,
          hasPrevious: !!feedData?.previous,
        });

        // Extract results from paginated response
        const feedItems = feedData?.results || [];

        if (Array.isArray(feedItems) && feedItems.length > 0) {
          console.log(`Processing ${feedItems.length} feed items`);

          // Process each feed item
          const processedItems = feedItems.map(item => {
            // Handle image field (singular) - convert to images array for consistency
            let images = [];
            if (item.image) {
              // If single image, convert to array format
              images = [{ image: item.image }];
            } else if (item.images && Array.isArray(item.images)) {
              // If already an array, use it
              images = item.images;
            }

            // Extract publisher/institution information from new API structure
            const publisherUsername = item.publisher_username ||
              item.institution_username ||
              item.institution?.username ||
              item.username;

            const publisherName = item.publisher_username ||
              item.institution_name ||
              item.institution?.name ||
              item.institution?.title ||
              item.institution_title ||
              item.name ||
              publisherUsername;

            const publisherProfileImage = item.publisher_profile_image ||
              item.institution_profile_image ||
              item.institution?.profile_image ||
              null;

            const processedPublisherImage = publisherProfileImage ? getImageUrl(publisherProfileImage) : null;

            console.log('Processing publisher profile image:', {
              original: publisherProfileImage,
              processed: processedPublisherImage,
              publisherUsername,
            });

            return {
              ...item,
              images: images,
              timestamp: formatTimestamp(item.created_at),
              type: item.type || 'post', // Ensure type is set
              // Use new publisher fields, fallback to old institution fields for backward compatibility
              publisher_username: publisherUsername,
              publisher_id: item.publisher_id,
              publisher_profile_image: processedPublisherImage,
              // Keep old fields for backward compatibility
              institution_username: publisherUsername,
              institution_name: publisherName,
              institution_title: publisherName,
              institution_profile_image: processedPublisherImage,
            };
          }).filter(item => {
            // Filter out items that don't have required fields for display
            return item.title || item.description || (item.images && item.images.length > 0);
          });

          console.log('Processed feed items:', processedItems.length);
          console.log('Sample processed item:', processedItems[0]);

          // Check enrollment status for courses if user is a student
          if (instituteData.isAuthenticated && instituteData.userType === 'student' && instituteData.accessToken) {
            const courses = processedItems.filter(item => item.type === 'course');
            if (courses.length > 0) {
              const enrollmentChecks = await Promise.allSettled(
                courses.map(async (course) => {
                  const courseId = course.id || course.course_id;
                  if (!courseId) return null;
                  try {
                    const enrollmentStatus = await authService.isEnrolled(
                      instituteData.accessToken,
                      courseId,
                      {
                        refreshToken: instituteData.refreshToken,
                        onTokenRefreshed: (tokens) => {
                          updateInstituteData({
                            accessToken: tokens.access,
                            refreshToken: tokens.refresh || instituteData.refreshToken,
                          });
                        },
                        onSessionExpired: () => {
                          // Silently fail - don't show error for enrollment check
                        },
                      }
                    );
                    return { courseId, isEnrolled: enrollmentStatus?.is_enrolled || enrollmentStatus?.enrolled || false };
                  } catch (error) {
                    console.warn(`Failed to check enrollment for course ${courseId}:`, error);
                    return { courseId, isEnrolled: false };
                  }
                })
              );

              // Create a map of course IDs to enrollment status
              const enrollmentMap = new Map();
              enrollmentChecks.forEach((result) => {
                if (result.status === 'fulfilled' && result.value) {
                  enrollmentMap.set(result.value.courseId, result.value.isEnrolled);
                }
              });

              // Update processed items with enrollment status
              const itemsWithEnrollment = processedItems.map(item => {
                if (item.type === 'course') {
                  const courseId = item.id || item.course_id;
                  return {
                    ...item,
                    is_enrolled: enrollmentMap.get(courseId) || false,
                  };
                }
                return item;
              });

              setFeedItems(itemsWithEnrollment);
            } else {
              setFeedItems(processedItems);
            }
          } else {
            setFeedItems(processedItems);
          }
        } else {
          console.warn('No feed items found in response');
          setFeedItems([]);
        }
      } catch (error) {
        console.error('Error fetching feed:', error);
        setFeedError(error?.message || 'Failed to load feed. Please try again.');
        setFeedItems([]);
      } finally {
        setIsLoadingFeed(false);
      }
    };

    fetchFeed();
  }, [instituteData.accessToken, instituteData.refreshToken]);

  // Fetch Notifications for Students and Lecturers
  useEffect(() => {
    const fetchNotifications = async () => {
      // Only fetch notifications for students and lecturers
      if (!instituteData.isAuthenticated ||
        !instituteData.accessToken ||
        (instituteData.userType !== 'student' && instituteData.userType !== 'lecturer')) {
        setNotifications([]);
        return;
      }

      setIsLoadingNotifications(true);

      try {
        const refreshToken = instituteData.refreshToken || null;

        const notificationData = await authService.getNotifications(instituteData.accessToken, {
          refreshToken,
          onTokenRefreshed: (tokens) => {
            updateInstituteData({
              accessToken: tokens.access,
              refreshToken: tokens.refresh || refreshToken,
            });
          },
          onSessionExpired: () => {
            handleLogout();
          },
        });

        // Handle API response structure
        if (notificationData?.success && Array.isArray(notificationData.notifications)) {
          // Transform API notifications to match UI structure
          const transformedNotifications = notificationData.notifications.map((notif, index) => ({
            id: index + 1,
            title: notif.course_title || 'Lecture Reminder',
            message: notif.message || `You have '${notif.course_title}' tomorrow at ${notif.time}.`,
            time: notif.time || '',
            day: notif.day || '',
            read: false,
            type: notif.type || 'lecture_reminder',
            course_title: notif.course_title,
          }));
          setNotifications(transformedNotifications);
        } else {
          setNotifications([]);
        }
      } catch (error) {
        console.error('Error fetching notifications:', error);
        // Don't show error to user, just set empty array
        setNotifications([]);
      } finally {
        setIsLoadingNotifications(false);
      }
    };

    fetchNotifications();

    // Refresh notifications every 5 minutes
    const interval = setInterval(fetchNotifications, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [instituteData.isAuthenticated, instituteData.accessToken, instituteData.userType, instituteData.refreshToken]);

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

  const handleLogout = () => {
    // Clear all institute data
    localStorage.removeItem('instituteData');

    updateInstituteData({
      name: '',
      email: '',
      username: '',
      firstName: '',
      lastName: '',
      userId: null,
      userType: '',
      accessToken: '',
      refreshToken: '',
      isAuthenticated: false,
      isVerified: false,
    });

    setShowUserMenu(false);
    toast.success(t('feed.loggedOutSuccess'));

    // Force page reload to ensure clean state
    window.location.reload();
  };

  const handleSubscribe = (institutionName) => {
    if (!instituteData.isAuthenticated) {
      toast.error(t('feed.loginToSubscribe'));
      navigate('/home'); // Navigate to account type selection page
      return;
    }
    toast.success(`${t('feed.subscribedSuccess')} ${institutionName}!`);
  };

  const handleViewProfile = (profile, type) => {
    setSelectedProfile(profile);
    setProfileType(type);
  };

  const handleCloseProfile = () => {
    setSelectedProfile(null);
    setProfileType(null);
  };

  const handleInstitutionProfileClick = (username) => {
    if (!username) return;
    // Navigate to institution profile page
    navigate(`/institution/profile/${username}`);
  };

  // Handle course click - navigate to institution profile with courses tab active
  const handleCourseClick = (course) => {
    const username = course.publisher_username || course.institution_username;
    if (!username) return;
    // Navigate to institution profile page with courses tab active
    navigate(`/institution/profile/${username}?tab=courses`);
  };

  // Handle job click - navigate to institution profile with jobs tab active
  const handleJobClick = (job) => {
    const username = job.publisher_username || job.institution_username;
    if (!username) return;
    // Navigate to institution profile page with jobs tab active
    navigate(`/institution/profile/${username}?tab=jobs`);
  };

  const handleInstitutionProfileHover = async (itemId, username, event) => {
    if (!username) return;

    // Clear any existing timeout
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }

    // Set hovered item
    setHoveredItemId(itemId);

    // Small delay before fetching to avoid unnecessary API calls
    hoverTimeoutRef.current = setTimeout(async () => {
      setIsLoadingHoverInstitution(true);
      try {
        const profileData = await authService.getInstitutionPublicProfile(username);
        if (profileData?.success && profileData?.data) {
          setHoverInstitutionData({
            ...profileData.data,
            profile_image: profileData.data.profile_image ? getImageUrl(profileData.data.profile_image) : null,
          });
        }
      } catch (error) {
        console.error('Error fetching institution profile for hover:', error);
        // Don't show error toast for hover, just fail silently
      } finally {
        setIsLoadingHoverInstitution(false);
      }
    }, 300); // 300ms delay
  };

  const handleInstitutionProfileHoverLeave = () => {
    // Clear open timeout if pending
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }

    // Set a delay before closing to allow moving mouse to the popup
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredItemId(null);
      setHoverInstitutionData(null);
      setIsLoadingHoverInstitution(false);
    }, 300);
  };

  const handleCloseInstitutionProfile = () => {
    setShowInstitutionProfile(false);
    setSelectedInstitution(null);
  };

  const isInstitution = instituteData.userType === 'institution';
  const isLecturer = instituteData.userType === 'lecturer';
  const isStudent = instituteData.userType === 'student';

  const handleEnrollCourse = async (course) => {
    if (!isStudent) {
      toast.error(t('nav.login') || 'Please login as a student to enroll');
      return;
    }
    if (!instituteData.isVerified) {
      setShowVerificationPopup(true);
      return;
    }
    if (!instituteData.accessToken) {
      toast.error(t('common.sessionExpired') || 'Session expired');
      return;
    }
    const courseId = course.id || course.course_id;
    if (!courseId) {
      toast.error(t('feed.courseIdMissing') || 'Course id missing');
      return;
    }
    try {
      setEnrollingCourseId(courseId);
      const enrollResponse = await authService.enrollInCourse(instituteData.accessToken, courseId, {
        refreshToken: instituteData.refreshToken,
        onTokenRefreshed: (tokens) => {
          updateInstituteData({
            accessToken: tokens.access,
            refreshToken: tokens.refresh || instituteData.refreshToken,
          });
        },
        onSessionExpired: () => {
          toast.error(t('common.sessionExpired') || 'Session expired');
        },
      });

      // Handle enrollment success
      if (enrollResponse?.success) {
        toast.success(enrollResponse?.message || t('feed.enrolledSuccess') || 'Enrolled successfully');
        // Mark course as enrolled in local state if present
        setFeedItems((prev) =>
          prev.map((item) =>
            (item.id === courseId || item.course_id === courseId)
              ? { ...item, is_enrolled: true }
              : item
          )
        );
      } else {
        toast.error(enrollResponse?.message || t('feed.enrollmentFailed') || 'Failed to enroll');
      }
    } catch (error) {
      console.error('Enroll failed:', error);
      toast.error(error?.message || t('feed.enrollFailed') || 'Failed to enroll');
    } finally {
      setEnrollingCourseId(null);
    }
  };

  return (
    <div className={`min-h-screen transition-colors flex ${isLecturer
      ? 'bg-gray-50/95 dark:bg-navy-900'
      : 'bg-gray-50 dark:bg-navy-900'
      }`} style={isLecturer ? { background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.03) 0%, transparent 50%)' } : undefined}>
      {/* Left Sidebar - Desktop: Hover, Mobile: Logo Click */}
      <aside
        className={`hidden lg:block shadow-xl border-r fixed left-0 top-0 bottom-0 overflow-y-auto z-40 transition-all duration-300 ${isSidebarExpanded ? 'w-80' : 'w-20'
          } ${isLecturer
            ? 'bg-white dark:bg-navy-800 border-gray-200 dark:border-navy-700 border-l-2 border-l-purple-400/30 dark:border-l-purple-500/20'
            : 'bg-white dark:bg-navy-800 border-gray-200 dark:border-navy-700'
          }`}
        onMouseEnter={() => setIsSidebarExpanded(true)}
        onMouseLeave={() => setIsSidebarExpanded(false)}
      >
        <div className="p-6 flex flex-col h-full">
          <div className="flex-1">
            <h2 className={`text-xl font-bold text-gray-800 dark:text-white mb-6 transition-opacity duration-300 ${isSidebarExpanded ? 'opacity-100' : 'opacity-0'
              }`}>
              {instituteData.isAuthenticated ? t('feed.explore') : t('feed.welcome')}
            </h2>

            {/* Guest Message */}
            {!instituteData.isAuthenticated && isSidebarExpanded && (
              <div className="mb-6 p-4 bg-primary-50 dark:bg-primary-900/20 rounded-lg border border-primary-200 dark:border-primary-800">
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                  {t('feed.loginToSubscribe')}
                </p>
                <div className="flex flex-col gap-2">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => navigate('/login')}
                    className="w-full px-3 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-lg text-sm font-semibold transition-colors"
                  >
                    {t('nav.login')}
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => navigate('/home')}
                    className="w-full px-3 py-2 border border-primary-600 dark:border-teal-400 text-primary-600 dark:text-teal-400 rounded-lg text-sm font-semibold hover:bg-primary-50 dark:hover:bg-navy-700 transition-colors"
                  >
                    {t('nav.signUp')}
                  </motion.button>
                </div>
              </div>
            )}

            {/* Sidebar Navigation Buttons - Role Based */}
            {instituteData.isAuthenticated && (
              <div className="space-y-2 mb-6">
                {/* My Courses - Student & Lecturer Only */}
                {(instituteData.userType === 'student' || instituteData.userType === 'lecturer') && (
                  <button
                    onClick={() => {
                      // Verification check for students only
                      if (instituteData.userType === 'student' && !instituteData.isVerified) {
                        setShowVerificationPopup(true);
                        return;
                      }
                      if (instituteData.userType === 'student') {
                        navigate('/student/courses');
                      } else {
                        navigate('/lecturer/courses');
                      }
                    }}
                    className={`w-full flex items-center ${isSidebarExpanded ? 'gap-3' : 'justify-center'} px-4 py-3 rounded-lg transition-all text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-navy-700 ${instituteData.userType === 'student' && !instituteData.isVerified ? 'opacity-60 cursor-not-allowed' : ''}`}
                    title={instituteData.userType === 'student' && !instituteData.isVerified ? t('nav.verificationRequired') || 'Verification Required' : t('nav.currentCourses')}
                  >
                    <FaBook className="w-5 h-5 flex-shrink-0" />
                    {isSidebarExpanded && <span className="font-medium">{t('nav.currentCourses')}</span>}
                  </button>
                )}

                {/* Schedule - Student & Lecturer Only */}
                {(instituteData.userType === 'student' || instituteData.userType === 'lecturer') && (
                  <button
                    onClick={() => {
                      // Verification check for students only
                      if (instituteData.userType === 'student' && !instituteData.isVerified) {
                        setShowVerificationPopup(true);
                        return;
                      }
                      if (instituteData.userType === 'student') {
                        navigate('/student/schedule');
                      } else {
                        navigate('/lecturer/schedule');
                      }
                    }}
                    className={`w-full flex items-center ${isSidebarExpanded ? 'gap-3' : 'justify-center'} px-4 py-3 rounded-lg transition-all text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-navy-700 ${instituteData.userType === 'student' && !instituteData.isVerified ? 'opacity-60 cursor-not-allowed' : ''}`}
                    title={instituteData.userType === 'student' && !instituteData.isVerified ? t('nav.verificationRequired') || 'Verification Required' : t('nav.schedule')}
                  >
                    <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                    </svg>
                    {isSidebarExpanded && <span className="font-medium">{t('nav.schedule')}</span>}
                  </button>
                )}

                {/* Dashboard - Institution Only */}
                {isInstitution && (
                  <button
                    onClick={() => navigate('/dashboard')}
                    className={`w-full flex items-center ${isSidebarExpanded ? 'gap-3' : 'justify-center'} px-4 py-3 rounded-lg transition-all text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-navy-700`}
                    title={t('nav.dashboard')}
                  >
                    <FaTachometerAlt className="w-5 h-5 flex-shrink-0" />
                    {isSidebarExpanded && <span className="font-medium">{t('nav.dashboard')}</span>}
                  </button>
                )}

                {/* Explore - All Authenticated Users */}
                <button
                  onClick={() => navigate('/explore')}
                  className={`w-full flex items-center ${isSidebarExpanded ? 'gap-3' : 'justify-center'} px-4 py-3 rounded-lg transition-all text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-navy-700`}
                  title={t('feed.explore')}
                >
                  <FaCompass className="w-5 h-5 flex-shrink-0" />
                  {isSidebarExpanded && <span className="font-medium">{t('feed.explore')}</span>}
                </button>

                {/* Profile - All Authenticated Users */}
                <button
                  onClick={() => setShowProfileModal(true)}
                  className={`w-full flex items-center ${isSidebarExpanded ? 'gap-3' : 'justify-center'} px-4 py-3 rounded-lg transition-all text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-navy-700`}
                  title={t('nav.profile') || 'Profile'}
                >
                  <FaUser className="w-5 h-5 flex-shrink-0" />
                  {isSidebarExpanded && <span className="font-medium">{t('nav.profile') || 'Profile'}</span>}
                </button>

                {/* Add Payment Method - Student Only */}
                {instituteData.userType === 'student' && instituteData.isVerified && (
                  <button
                    onClick={async () => {
                      setIsAddingPaymentMethod(true);
                      try {
                        const result = await authService.addStudentPaymentMethod(
                          instituteData.accessToken,
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

                        if (result?.success && result?.client_secret) {
                          // For Stripe Customer Attach, we might need to handle it differently
                          // For now, show a message that payment method setup is in progress
                          toast.success(t('feed.paymentMethodSetup') || 'Payment method setup initiated. Please check your email for further instructions.');
                        } else {
                          throw new Error(result?.message || 'Failed to setup payment method');
                        }
                      } catch (error) {
                        console.error('Payment method error:', error);
                        toast.error(error?.message || t('feed.failedToAddPaymentMethod') || 'Failed to add payment method');
                      } finally {
                        setIsAddingPaymentMethod(false);
                      }
                    }}
                    disabled={isAddingPaymentMethod}
                    className={`w-full flex items-center ${isSidebarExpanded ? 'gap-3' : 'justify-center'} px-4 py-3 rounded-lg transition-all text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-navy-700 ${isAddingPaymentMethod ? 'opacity-60 cursor-not-allowed' : ''}`}
                    title={t('feed.addPaymentMethod') || 'Add Payment Method'}
                  >
                    {isAddingPaymentMethod ? (
                      <FaSpinner className="w-5 h-5 flex-shrink-0 animate-spin" />
                    ) : (
                      <FaCreditCard className="w-5 h-5 flex-shrink-0" />
                    )}
                    {isSidebarExpanded && <span className="font-medium">{t('feed.addPaymentMethod') || 'Add Payment Method'}</span>}
                  </button>
                )}
              </div>
            )}

            {/* Guest Navigation */}
            {!instituteData.isAuthenticated && (
              <div className="space-y-2 mb-6">
                <button
                  onClick={() => navigate('/explore')}
                  className={`w-full flex items-center ${isSidebarExpanded ? 'gap-3' : 'justify-center'} px-4 py-3 rounded-lg transition-all text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-navy-700`}
                  title={t('feed.explore')}
                >
                  <FaCompass className="w-5 h-5 flex-shrink-0" />
                  {isSidebarExpanded && <span className="font-medium">{t('feed.explore')}</span>}
                </button>
              </div>
            )}
          </div>

          {/* Language Switcher & Theme Toggle - Bottom of Sidebar */}
          <div className={`mt-auto pt-6 border-t border-gray-200 dark:border-navy-700 space-y-2`}>
            {/* Language Switcher */}
            {isSidebarExpanded ? (
              <LanguageSwitcher variant="sidebar" />
            ) : (
              <div className="flex items-center justify-center">
                <LanguageSwitcher />
              </div>
            )}

            {/* Theme Toggle */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleTheme}
              className={`w-full flex items-center ${isSidebarExpanded ? 'gap-3' : 'justify-center'} px-4 py-3 rounded-lg transition-all text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-navy-700`}
              title={isDark ? t('lightMode') || 'Light Mode' : t('darkMode') || 'Dark Mode'}
            >
              {isDark ? (
                <FaSun className="w-5 h-5 flex-shrink-0 text-yellow-400" />
              ) : (
                <FaMoon className="w-5 h-5 flex-shrink-0" />
              )}
              {isSidebarExpanded && <span className="font-medium">{isDark ? t('lightMode') || 'Light Mode' : t('darkMode') || 'Dark Mode'}</span>}
            </motion.button>
          </div>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isMobileSidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileSidebarOpen(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
            />
            <motion.aside
              initial={{ x: -320 }}
              animate={{ x: 0 }}
              exit={{ x: -320 }}
              transition={{ type: 'spring', damping: 20 }}
              className={`fixed left-0 top-0 bottom-0 w-80 shadow-2xl z-50 lg:hidden overflow-y-auto bg-white dark:bg-navy-800 ${isLecturer ? 'border-l-2 border-l-purple-400/30 dark:border-l-purple-500/20' : ''
                }`}
            >
              <div className="p-6">
                {/* Mobile Sidebar Header */}
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                    {instituteData.isAuthenticated ? t('feed.explore') : t('feed.welcome')}
                  </h2>
                  <motion.button
                    whileHover={{ rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setIsMobileSidebarOpen(false)}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-navy-700"
                  >
                    <FaTimes className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  </motion.button>
                </div>

                {/* Guest Message */}
                {!instituteData.isAuthenticated && (
                  <div className="mb-6 p-4 bg-primary-50 dark:bg-primary-900/20 rounded-lg border border-primary-200 dark:border-primary-800">
                    <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                      {t('feed.loginToSubscribe')}
                    </p>
                    <div className="flex flex-col gap-2">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          navigate('/login');
                          setIsMobileSidebarOpen(false);
                        }}
                        className="w-full px-3 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-lg text-sm font-semibold transition-colors"
                      >
                        {t('nav.login')}
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          navigate('/home');
                          setIsMobileSidebarOpen(false);
                        }}
                        className="w-full px-3 py-2 border border-primary-600 dark:border-teal-400 text-primary-600 dark:text-teal-400 rounded-lg text-sm font-semibold hover:bg-primary-50 dark:hover:bg-navy-700 transition-colors"
                      >
                        {t('nav.signUp')}
                      </motion.button>
                    </div>
                  </div>
                )}

                {/* Mobile Sidebar Navigation Buttons - Role Based */}
                {instituteData.isAuthenticated && (
                  <div className="space-y-2 mb-6">
                    {/* My Courses - Student & Lecturer Only */}
                    {(instituteData.userType === 'student' || instituteData.userType === 'lecturer') && (
                      <button
                        onClick={() => {
                          // Verification check for students only
                          if (instituteData.userType === 'student' && !instituteData.isVerified) {
                            setShowVerificationPopup(true);
                            setIsMobileSidebarOpen(false);
                            return;
                          }
                          if (instituteData.userType === 'student') {
                            navigate('/student/courses');
                          } else {
                            navigate('/lecturer/courses');
                          }
                          setIsMobileSidebarOpen(false);
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-navy-700 ${instituteData.userType === 'student' && !instituteData.isVerified ? 'opacity-60 cursor-not-allowed' : ''}`}
                      >
                        <FaBook className="w-5 h-5 flex-shrink-0" />
                        <span className="font-medium">{t('nav.currentCourses')}</span>
                      </button>
                    )}

                    {/* Schedule - Student & Lecturer Only */}
                    {(instituteData.userType === 'student' || instituteData.userType === 'lecturer') && (
                      <button
                        onClick={() => {
                          // Verification check for students only
                          if (instituteData.userType === 'student' && !instituteData.isVerified) {
                            setShowVerificationPopup(true);
                            setIsMobileSidebarOpen(false);
                            return;
                          }
                          if (instituteData.userType === 'student') {
                            navigate('/student/schedule');
                          } else {
                            navigate('/lecturer/schedule');
                          }
                          setIsMobileSidebarOpen(false);
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-navy-700 ${instituteData.userType === 'student' && !instituteData.isVerified ? 'opacity-60 cursor-not-allowed' : ''}`}
                      >
                        <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                        </svg>
                        <span className="font-medium">{t('nav.schedule')}</span>
                      </button>
                    )}

                    {/* Dashboard - Institution Only */}
                    {isInstitution && (
                      <button
                        onClick={() => {
                          navigate('/dashboard');
                          setIsMobileSidebarOpen(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-navy-700"
                      >
                        <FaTachometerAlt className="w-5 h-5 flex-shrink-0" />
                        <span className="font-medium">{t('nav.dashboard')}</span>
                      </button>
                    )}

                    {/* Explore */}
                    <button
                      onClick={() => {
                        navigate('/explore');
                        setIsMobileSidebarOpen(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-navy-700"
                    >
                      <FaCompass className="w-5 h-5 flex-shrink-0" />
                      <span className="font-medium">{t('feed.explore')}</span>
                    </button>

                    {/* Profile */}
                    <button
                      onClick={() => {
                        setShowProfileModal(true);
                        setIsMobileSidebarOpen(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-navy-700"
                    >
                      <FaUser className="w-5 h-5 flex-shrink-0" />
                      <span className="font-medium">{t('nav.profile') || 'Profile'}</span>
                    </button>
                  </div>
                )}

                {/* Guest Navigation */}
                {!instituteData.isAuthenticated && (
                  <div className="space-y-2 mb-6">
                    <button
                      onClick={() => {
                        navigate('/explore');
                        setIsMobileSidebarOpen(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-navy-700"
                    >
                      <FaCompass className="w-5 h-5 flex-shrink-0" />
                      <span className="font-medium">{t('feed.explore')}</span>
                    </button>
                  </div>
                )}

                {/* Language Switcher & Theme Toggle - Bottom of Mobile Sidebar */}
                <div className="mt-auto pt-6 border-t border-gray-200 dark:border-navy-700 space-y-2">
                  {/* Language Switcher */}
                  <LanguageSwitcher variant="sidebar" />

                  {/* Theme Toggle */}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={toggleTheme}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-navy-700"
                  >
                    {isDark ? (
                      <FaSun className="w-5 h-5 flex-shrink-0 text-yellow-400" />
                    ) : (
                      <FaMoon className="w-5 h-5 flex-shrink-0" />
                    )}
                    <span className="font-medium">{isDark ? t('lightMode') || 'Light Mode' : t('darkMode') || 'Dark Mode'}</span>
                  </motion.button>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className={`flex-1 transition-all duration-300 ${isSidebarExpanded ? 'lg:ml-80' : 'lg:ml-20'}`}>
        {/* Navigation Bar */}
        <nav className={`shadow-lg sticky top-0 z-50 transition-colors bg-white dark:bg-navy-800 ${isLecturer ? 'border-b-2 border-b-purple-400/20 dark:border-b-purple-500/15' : ''
          }`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className={`flex ${isRTL ? 'flex-row-reverse' : 'flex-row'} justify-between items-center h-16 ${isRTL ? 'gap-4' : 'gap-4'}`}>
              {/* Logo - Clickable on Mobile to Open Sidebar */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-3 cursor-pointer"
                onClick={() => {
                  // On mobile, open sidebar; on desktop, navigate home
                  if (window.innerWidth < 1024) {
                    setIsMobileSidebarOpen(true);
                  } else {
                    navigate('/');
                  }
                }}
              >
                <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-teal-500 rounded-lg flex items-center justify-center">
                  <FaUniversity className="text-white text-xl" />
                </div>
                <span className="text-xl font-bold text-gray-800 dark:text-white">
                  Project East
                </span>
              </motion.div>

              {/* Right Side */}
              <div className={`flex items-center gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                {/* Notification Button - Student & Lecturer Only */}
                {instituteData.isAuthenticated && (instituteData.userType === 'student' || instituteData.userType === 'lecturer') && (
                  <div className="relative" ref={notificationRef}>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
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
                          className={`absolute ${isRTL ? 'left-0' : 'right-0'} mt-2 w-80 bg-white dark:bg-navy-800 rounded-xl shadow-2xl border border-gray-200 dark:border-navy-700 overflow-hidden z-50`}
                        >
                          <div className={`p-4 border-b border-gray-200 dark:border-navy-700 flex items-center ${isRTL ? 'flex-row-reverse' : ''} justify-between`}>
                            <h3 className="font-bold text-gray-800 dark:text-white">{t('nav.notifications')}</h3>
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              {notifications.filter(n => !n.read).length} {t('feed.new')}
                            </span>
                          </div>
                          <div className="max-h-96 overflow-y-auto">
                            {notifications.length === 0 ? (
                              <div className={`p-8 ${isRTL ? 'text-right' : 'text-center'} text-gray-500 dark:text-gray-400`}>
                                {t('nav.noNotifications')}
                              </div>
                            ) : (
                              notifications.map((notification) => (
                                <motion.div
                                  key={notification.id}
                                  initial={{ opacity: 0, x: -20 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  className={`p-4 border-b border-gray-100 dark:border-navy-700 hover:bg-gray-50 dark:hover:bg-navy-900 transition-colors cursor-pointer ${!notification.read ? 'bg-primary-50 dark:bg-primary-900/20' : ''
                                    }`}
                                  onClick={() => setShowNotifications(false)}
                                >
                                  <div className={`flex items-start gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                                    <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${!notification.read ? 'bg-primary-600' : 'bg-transparent'
                                      }`} />
                                    <div className={`flex-1 min-w-0 ${isRTL ? 'text-right' : 'text-left'}`}>
                                      <h4 className="font-semibold text-sm text-gray-800 dark:text-white mb-1">
                                        {notification.title}
                                      </h4>
                                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                                        {notification.message}
                                      </p>
                                      <p className="text-xs text-gray-500 dark:text-gray-500">
                                        {notification.day && notification.time
                                          ? `${notification.day.charAt(0).toUpperCase() + notification.day.slice(1)} at ${notification.time}`
                                          : notification.time || 'Tomorrow'
                                        }
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
                )}

                {/* User Menu or Login/Signup */}
                {instituteData.isAuthenticated ? (
                  <div className="relative">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setShowUserMenu(!showUserMenu)}
                      className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''} gap-2 px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-navy-700 transition-colors`}
                    >
                      <div className="relative">
                        <div className="w-8 h-8 bg-gradient-to-br from-primary-600 to-teal-500 rounded-full flex items-center justify-center overflow-hidden">
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
                            <span className="text-white font-bold text-sm">
                              {(username || instituteData.username || instituteData.name)?.[0]?.toUpperCase() || 'U'}
                            </span>
                          )}
                        </div>
                        {/* Verification Badge on Avatar */}
                        {instituteData.isVerified && (
                          <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center border-2 border-white dark:border-navy-800">
                            <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                      </div>
                      <span className="hidden sm:block text-gray-800 dark:text-white font-medium">
                        {username || instituteData.username || instituteData.name || 'User'}
                      </span>
                    </motion.button>

                    <AnimatePresence>
                      {showUserMenu && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className={`absolute ${isRTL ? 'left-0' : 'right-0'} mt-2 w-56 bg-white dark:bg-navy-800 rounded-lg shadow-xl border border-gray-200 dark:border-navy-700 overflow-hidden`}
                        >
                          <div className={`p-3 border-b border-gray-200 dark:border-navy-700 ${isRTL ? 'text-right' : 'text-left'}`}>
                            <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''} gap-2 mb-1`}>
                              <p className="text-sm font-semibold text-gray-800 dark:text-white">
                                {username || instituteData.username || instituteData.name || 'User'}
                              </p>
                              {/* Verification Badge */}
                              {instituteData.isVerified ? (
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded text-xs font-medium">
                                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                  </svg>
                                  {t('profile.verified') || 'Verified'}
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded text-xs font-medium">
                                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                  </svg>
                                  {t('profile.pendingVerification') || 'Pending'}
                                </span>
                              )}
                            </div>
                            {instituteData.email && (
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {instituteData.email}
                              </p>
                            )}
                            <p className="text-xs text-gray-400 dark:text-gray-500 capitalize mt-1">
                              {instituteData.userType}
                            </p>
                            {instituteData.userType === 'lecturer' && instituteData.institution && (
                              <div className="mt-2 pt-2 border-t border-gray-200 dark:border-navy-700">
                                <p className={`text-xs font-medium text-primary-600 dark:text-teal-400 flex items-center ${isRTL ? 'flex-row-reverse' : ''} gap-1`}>
                                  <FaUniversity className="w-3 h-3" />
                                  {instituteData.institution}
                                </p>
                              </div>
                            )}
                          </div>

                          {/* View Profile Button */}
                          <button
                            onClick={() => {
                              setShowProfileModal(true);
                              setShowUserMenu(false);
                            }}
                            className={`w-full px-4 py-2 ${isRTL ? 'text-right' : 'text-left'} text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-navy-700 flex items-center ${isRTL ? 'flex-row-reverse' : ''} gap-2 transition-colors`}
                          >
                            <FaUser className="w-4 h-4" />
                            {t('nav.profile') || 'View Profile'}
                          </button>

                          <button
                            onClick={handleLogout}
                            className={`w-full px-4 py-2 ${isRTL ? 'text-right' : 'text-left'} text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-navy-700 flex items-center ${isRTL ? 'flex-row-reverse' : ''} gap-2 transition-colors border-t border-gray-200 dark:border-navy-700`}
                          >
                            <FaSignOutAlt />
                            {t('nav.logout')}
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => navigate('/login')}
                      className="flex items-center gap-2 px-4 py-2 border border-primary-600 text-primary-600 dark:border-teal-400 dark:text-teal-400 rounded-lg hover:bg-primary-50 dark:hover:bg-navy-700 transition-colors"
                    >
                      <FaSignInAlt />
                      <span>{t('nav.login')}</span>
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => navigate('/home', { state: { showSignUp: true } })}
                      className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-lg transition-colors"
                    >
                      <FaUser />
                      <span>{t('nav.signUp')}</span>
                    </motion.button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <div className="bg-gradient-to-r from-primary-600 to-teal-500 text-white py-16 relative overflow-hidden">
          {/* Animated Decorative Elements */}
          <div className="absolute inset-0 pointer-events-none">
            {/* Animated School Symbols */}
            <motion.div
              animate={{
                x: [0, 100, 0],
                y: [0, 50, 0],
                rotate: [0, 15, -15, 0],
              }}
              transition={{
                duration: 20,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="absolute top-20 left-10 opacity-20"
            >
              <FaUniversity className="w-16 h-16 text-red-300" />
            </motion.div>

            <motion.div
              animate={{
                x: [0, -80, 0],
                y: [0, 30, 0],
                rotate: [0, -10, 10, 0],
              }}
              transition={{
                duration: 25,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="absolute top-32 right-20 opacity-15"
            >
              <FaUniversity className="w-12 h-12 text-orange-300" />
            </motion.div>

            <motion.div
              animate={{
                x: [0, 60, 0],
                y: [0, -40, 0],
                rotate: [0, 20, -20, 0],
              }}
              transition={{
                duration: 18,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="absolute bottom-20 left-1/4 opacity-20"
            >
              <FaUniversity className="w-10 h-10 text-red-300" />
            </motion.div>

            <motion.div
              animate={{
                x: [0, -70, 0],
                y: [0, 60, 0],
                rotate: [0, -15, 15, 0],
              }}
              transition={{
                duration: 22,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="absolute bottom-32 right-1/3 opacity-15"
            >
              <FaUniversity className="w-14 h-14 text-orange-300" />
            </motion.div>

            {/* Animated Pens */}
            <motion.div
              animate={{
                rotate: [0, 360],
                y: [0, -20, 0],
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="absolute top-1/4 left-1/4 opacity-25"
            >
              <FaPen className="w-8 h-8 text-orange-300" />
            </motion.div>

            <motion.div
              animate={{
                rotate: [0, -360],
                y: [0, 15, 0],
              }}
              transition={{
                duration: 10,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="absolute top-1/3 right-1/4 opacity-20"
            >
              <FaPen className="w-6 h-6 text-red-300" />
            </motion.div>

            <motion.div
              animate={{
                rotate: [0, 360],
                y: [0, -25, 0],
              }}
              transition={{
                duration: 12,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="absolute bottom-1/4 left-1/3 opacity-25"
            >
              <FaPen className="w-7 h-7 text-orange-300" />
            </motion.div>

            {/* Animated Books */}
            <motion.div
              animate={{
                rotate: [0, 15, -15, 0],
                x: [0, 10, -10, 0],
              }}
              transition={{
                duration: 6,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="absolute top-1/4 right-1/3 opacity-20"
            >
              <FaBook className="w-10 h-10 text-red-300" />
            </motion.div>

            <motion.div
              animate={{
                rotate: [0, -20, 20, 0],
                x: [0, -15, 15, 0],
              }}
              transition={{
                duration: 7,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="absolute bottom-1/3 right-1/5 opacity-25"
            >
              <FaBook className="w-9 h-9 text-orange-300" />
            </motion.div>

            <motion.div
              animate={{
                rotate: [0, 10, -10, 0],
                y: [0, -10, 10, 0],
              }}
              transition={{
                duration: 9,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="absolute top-1/2 left-1/5 opacity-20"
            >
              <FaBook className="w-8 h-8 text-red-300" />
            </motion.div>
          </div>

          {/* Content */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl md:text-5xl font-bold mb-4"
            >
              {instituteData.isAuthenticated
                ? `${t('feed.welcomeBack')}, ${instituteData.username || instituteData.firstName || instituteData.name || 'User'}!`
                : t('feed.discoverExcellence')
              }
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-xl text-white/90 max-w-2xl mx-auto"
            >
              {instituteData.isAuthenticated
                ? isInstitution
                  ? t('feed.manageInstitution')
                  : t('feed.exploreInstitutions')
                : t('feed.exploreInstitutions')
              }
            </motion.p>
          </div>
        </div>

        {/* Social Media Style Feed */}
        <div className="w-full flex justify-center py-8">
          <div className="w-full max-w-[895px] px-4 sm:px-6">
            {isLoadingFeed ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12"
              >
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 dark:border-teal-400"></div>
                <p className="mt-4 text-gray-600 dark:text-gray-400">{t('common.loading')}</p>
              </motion.div>
            ) : feedError ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12"
              >
                <p className="text-red-600 dark:text-red-400 mb-4">{feedError}</p>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-lg transition-colors"
                >
                  {t('common.retry') || 'Retry'}
                </motion.button>
              </motion.div>
            ) : feedItems.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12"
              >
                <p className="text-gray-600 dark:text-gray-400 text-lg">{t('feed.noFeedItems') || 'No feed items available'}</p>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="space-y-4"
              >
                {feedItems.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    style={{ zIndex: hoveredItemId === item.id ? 40 : 1, position: 'relative' }}
                    className="bg-white dark:bg-navy-800 rounded-lg shadow-md border border-gray-200 dark:border-navy-700"
                  >
                    {/* Facebook-style Post */}
                    {(item.type === 'post' || item.title || item.description) && (
                      <>
                        {/* Post Header - Publisher/Institution Profile */}
                        <div className="p-4 flex items-center gap-3 relative">
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleInstitutionProfileClick(item.publisher_username || item.institution_username)}
                            onMouseEnter={(e) => handleInstitutionProfileHover(item.id, item.publisher_username || item.institution_username, e)}
                            onMouseLeave={handleInstitutionProfileHoverLeave}
                            className="flex-shrink-0 cursor-pointer relative"
                          >
                            <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-gray-200 dark:border-navy-700 bg-gray-100 dark:bg-navy-700 flex items-center justify-center relative">
                              {(item.publisher_profile_image || item.institution_profile_image) ? (
                                <>
                                  <img
                                    src={item.publisher_profile_image || item.institution_profile_image}
                                    alt={item.publisher_username || item.institution_name || 'Publisher'}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      console.error('Image failed to load:', e.target.src);
                                      e.target.style.display = 'none';
                                      const fallback = e.target.parentElement?.querySelector('.profile-fallback');
                                      if (fallback) {
                                        fallback.style.display = 'flex';
                                      }
                                    }}
                                    onLoad={() => {
                                      console.log('Image loaded successfully:', item.publisher_profile_image || item.institution_profile_image);
                                    }}
                                  />
                                  <div className="w-full h-full flex items-center justify-center text-primary-600 dark:text-teal-400 font-bold text-lg profile-fallback absolute inset-0" style={{ display: 'none' }}>
                                    {(item.publisher_username || item.institution_name || item.institution_username || 'P')?.[0]?.toUpperCase()}
                                  </div>
                                </>
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-primary-600 dark:text-teal-400 font-bold text-lg">
                                  {(item.publisher_username || item.institution_name || item.institution_username || 'P')?.[0]?.toUpperCase()}
                                </div>
                              )}
                            </div>
                          </motion.button>
                          <div className="flex-1 min-w-0 relative">
                            <motion.button
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => handleInstitutionProfileClick(item.publisher_username || item.institution_username)}
                              onMouseEnter={(e) => handleInstitutionProfileHover(item.id, item.publisher_username || item.institution_username, e)}
                              onMouseLeave={handleInstitutionProfileHoverLeave}
                              className="text-left w-full"
                            >
                              <h3 className="font-bold text-gray-800 dark:text-white hover:underline">
                                {item.publisher_username || item.institution_name || item.institution_title || item.institution_username || 'Publisher'}
                              </h3>
                              {item.timestamp && (
                                <p className="text-xs text-gray-500 dark:text-gray-500">
                                  {item.timestamp}
                                </p>
                              )}
                            </motion.button>
                          </div>


                          {/* Hover Popup - Moved inside relative container for better positioning */}
                          {hoveredItemId === item.id && (
                            <motion.div
                              initial={{ opacity: 0, y: 10, scale: 0.95 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: 10, scale: 0.95 }}
                              className={`absolute ${isRTL ? 'right-0' : 'left-0'} top-full mt-2 w-64 bg-white dark:bg-navy-800 rounded-lg shadow-2xl border border-gray-200 dark:border-navy-700 z-50 p-4`}
                              onMouseEnter={() => {
                                if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
                                setHoveredItemId(item.id);
                              }}
                              onMouseLeave={handleInstitutionProfileHoverLeave}
                            >
                              {isLoadingHoverInstitution ? (
                                <div className="flex items-center justify-center py-4">
                                  <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600 dark:border-teal-400"></div>
                                </div>
                              ) : hoverInstitutionData ? (
                                <div className="space-y-3">
                                  <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-primary-200 dark:border-primary-800 bg-gray-100 dark:bg-navy-700 flex items-center justify-center flex-shrink-0">
                                      {hoverInstitutionData.profile_image ? (
                                        <img
                                          src={hoverInstitutionData.profile_image}
                                          alt={hoverInstitutionData.title || hoverInstitutionData.username}
                                          className="w-full h-full object-cover"
                                          onError={(e) => {
                                            e.target.style.display = 'none';
                                            e.target.nextSibling.style.display = 'flex';
                                          }}
                                        />
                                      ) : null}
                                      <div className="w-full h-full flex items-center justify-center text-primary-600 dark:text-teal-400 font-bold text-lg" style={{ display: hoverInstitutionData.profile_image ? 'none' : 'flex' }}>
                                        {(hoverInstitutionData.title || hoverInstitutionData.username || 'I')?.[0]?.toUpperCase()}
                                      </div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <h4 className="font-bold text-gray-800 dark:text-white text-sm truncate">
                                        {hoverInstitutionData.title || `${hoverInstitutionData.first_name || ''} ${hoverInstitutionData.last_name || ''}`.trim() || hoverInstitutionData.username}
                                      </h4>
                                      {hoverInstitutionData.location && (
                                        <p className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1 truncate">
                                          <FaMapMarkerAlt className="text-xs flex-shrink-0" />
                                          {hoverInstitutionData.location}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                  {hoverInstitutionData.about && (
                                    <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                                      {hoverInstitutionData.about}
                                    </p>
                                  )}
                                  <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => handleInstitutionProfileClick(item.publisher_username || item.institution_username)}
                                    className="w-full px-3 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-lg text-xs font-semibold transition-colors"
                                  >
                                    {t('feed.viewProfile') || 'View Profile'}
                                  </motion.button>
                                </div>
                              ) : (
                                <div className="text-center py-4">
                                  <p className="text-xs text-gray-500 dark:text-gray-500">{t('common.loading')}</p>
                                </div>
                              )}
                            </motion.div>
                          )}
                        </div>

                        {/* Hover Popup used to be here */}

                        {/* Post Content */}
                        <div className="px-4 pb-4">
                          {item.title && (
                            <h4 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
                              {item.title}
                            </h4>
                          )}
                          {item.description && (
                            <p className="text-gray-700 dark:text-gray-300 text-sm sm:text-base mb-4 leading-relaxed whitespace-pre-wrap">
                              {item.description}
                            </p>
                          )}

                          {/* Post Images */}
                          {item.images && item.images.length > 0 && (
                            <div className={`mb-4 ${item.images.length === 1 ? '' : 'grid gap-2'} ${item.images.length === 2 ? 'grid-cols-2' : item.images.length === 3 ? 'grid-cols-2' : item.images.length === 4 ? 'grid-cols-2' : 'grid-cols-2'}`}>
                              {item.images.slice(0, 4).map((imageObj, imgIndex) => {
                                const imageUrl = imageObj.image ? getImageUrl(imageObj.image) : null;
                                if (!imageUrl) return null;

                                return (
                                  <div
                                    key={imgIndex}
                                    className={`relative overflow-hidden rounded-lg ${item.images.length === 1 ? 'h-96' : 'h-48'} ${imgIndex === 0 && item.images.length === 3 ? 'col-span-2' : ''}`}
                                  >
                                    <img
                                      src={imageUrl}
                                      alt={`Post image ${imgIndex + 1}`}
                                      className="w-full h-full object-cover"
                                      onError={(e) => {
                                        e.target.style.display = 'none';
                                      }}
                                    />
                                  </div>
                                );
                              })}
                              {item.images.length > 4 && (
                                <div className="relative h-48 overflow-hidden rounded-lg bg-gray-100 dark:bg-navy-700 flex items-center justify-center">
                                  <span className="text-gray-600 dark:text-gray-400 font-semibold">
                                    +{item.images.length - 4} {t('feed.moreImages') || 'more'}
                                  </span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </>
                    )}

                    {/* Lecturer Job Post */}
                    {item.type === 'job_post' && (
                      <div className="p-4 sm:p-6">
                        <div className="flex items-start gap-4 mb-4">
                          <img
                            src={item.lecturerImage}
                            alt={item.lecturerName}
                            className="w-16 h-16 rounded-full object-cover border-2 border-primary-200 dark:border-primary-800"
                          />
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h3 className="text-xl font-bold text-gray-800 dark:text-white">
                                  {item.lecturerName}
                                </h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  {item.specialty} • {item.experience} {t('feed.experience')}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                                  <FaMapMarkerAlt className="inline mr-1" />
                                  {item.location}
                                </p>
                              </div>
                              <span className="text-sm text-gray-500 dark:text-gray-500">{item.timestamp}</span>
                            </div>
                          </div>
                        </div>

                        <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-l-4 border-blue-500">
                          <div className="flex items-center gap-2 mb-2">
                            <FaBriefcase className="text-blue-600 dark:text-blue-400" />
                            <span className="font-semibold text-blue-800 dark:text-blue-300">{t('feed.lookingForJob')}</span>
                          </div>
                          <p className="text-gray-700 dark:text-gray-300">{item.message}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                            {t('feed.contact')}: <span className="font-medium">{item.contact}</span>
                          </p>
                        </div>

                        {/* Contact Button for Institutions */}
                        {isInstitution && (
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => window.location.href = `mailto:${item.contact}`}
                            className="w-full px-4 py-3 bg-primary-600 hover:bg-primary-500 text-white rounded-lg transition-colors font-semibold"
                          >
                            {t('feed.contactLecturer')}
                          </motion.button>
                        )}
                      </div>
                    )}

                    {/* Job Card (public jobs) */}
                    {item.type === 'job' && (
                      <motion.div
                        className="p-4 sm:p-6 cursor-pointer"
                        onClick={() => handleJobClick(item)}
                        whileHover={{ scale: 1.01 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className="flex items-start gap-4 mb-4 relative">
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleInstitutionProfileClick(item.publisher_username);
                            }}
                            onMouseEnter={(e) => handleInstitutionProfileHover(item.id, item.publisher_username, e)}
                            onMouseLeave={handleInstitutionProfileHoverLeave}
                            className="flex-shrink-0 cursor-pointer relative"
                          >
                            <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-purple-200 dark:border-purple-800 bg-gray-100 dark:bg-navy-700 flex items-center justify-center">
                              {item.publisher_profile_image ? (
                                <img
                                  src={getImageUrl(item.publisher_profile_image)}
                                  alt={item.publisher_username || 'publisher'}
                                  className="w-full h-full object-cover"
                                  onError={(e) => { e.target.style.display = 'none'; }}
                                />
                              ) : (
                                <span className="text-purple-600 dark:text-purple-300 font-bold">
                                  {(item.publisher_username || 'J')[0].toUpperCase()}
                                </span>
                              )}
                            </div>
                          </motion.button>
                          <div className="flex-1 relative">
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex-1">
                                <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-1">
                                  {item.title || t('feed.job') || 'Job'}
                                </h3>
                                {item.publisher_username && (
                                  <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleInstitutionProfileClick(item.publisher_username);
                                    }}
                                    onMouseEnter={(e) => handleInstitutionProfileHover(item.id, item.publisher_username, e)}
                                    onMouseLeave={handleInstitutionProfileHoverLeave}
                                    className="text-sm text-gray-600 dark:text-gray-400 hover:underline"
                                  >
                                    @{item.publisher_username}
                                  </motion.button>
                                )}
                                {item.created_at && (
                                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1 flex items-center gap-1">
                                    <FaClock className="inline text-gray-400 dark:text-gray-500" />
                                    {formatTimestamp(item.created_at)}
                                  </p>
                                )}
                              </div>
                            </div>

                            {item.description && item.description.trim() !== '' && (
                              <p className="text-sm text-gray-600 dark:text-gray-400 mt-3 line-clamp-3">
                                {item.description}
                              </p>
                            )}

                            {/* Meta */}
                            <div className="flex flex-wrap gap-3 text-sm text-gray-600 dark:text-gray-400 mt-3">
                              {item.institution && (
                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded-full text-xs font-semibold">
                                  <FaUniversity className="w-3 h-3" />
                                  {item.institution}
                                </span>
                              )}
                              {item.city && (
                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-navy-700 text-gray-700 dark:text-gray-300 rounded-full text-xs font-semibold">
                                  <FaMapMarkerAlt className="w-3 h-3" />
                                  {item.city}
                                </span>
                              )}
                            </div>

                            {/* Apply Button - Lecturers only */}
                            {instituteData.isAuthenticated && instituteData.userType === 'lecturer' && (
                              <div className="mt-4">
                                <motion.button
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.98 }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (!instituteData.isVerified) {
                                      setShowVerificationPopup(true);
                                      return;
                                    }
                                    setSelectedJob(item);
                                    setApplyJobMessage('');
                                    setShowApplyJobModal(true);
                                  }}
                                  className="w-full sm:w-auto px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-lg transition-colors font-semibold text-sm"
                                >
                                  {t('feed.applyJob') || 'Apply'}
                                </motion.button>
                              </div>
                            )}

                            {/* Hover Popup for Job Card */}
                            {hoveredItemId === item.id && (
                              <motion.div
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                className={`absolute ${isRTL ? 'right-0' : 'left-0'} top-full mt-2 w-64 bg-white dark:bg-navy-800 rounded-lg shadow-2xl border border-gray-200 dark:border-navy-700 z-50 p-4`}
                                onMouseEnter={() => {
                                  if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
                                  setHoveredItemId(item.id);
                                }}
                                onMouseLeave={handleInstitutionProfileHoverLeave}
                              >
                                {isLoadingHoverInstitution ? (
                                  <div className="flex items-center justify-center py-4">
                                    <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600 dark:border-teal-400"></div>
                                  </div>
                                ) : hoverInstitutionData ? (
                                  <div className="space-y-3">
                                    <div className="flex items-center gap-3">
                                      <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-primary-200 dark:border-primary-800 bg-gray-100 dark:bg-navy-700 flex items-center justify-center flex-shrink-0">
                                        {hoverInstitutionData.profile_image ? (
                                          <img
                                            src={hoverInstitutionData.profile_image}
                                            alt={hoverInstitutionData.title || hoverInstitutionData.username}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                              e.target.style.display = 'none';
                                              e.target.nextSibling.style.display = 'flex';
                                            }}
                                          />
                                        ) : null}
                                        <div className="w-full h-full flex items-center justify-center text-primary-600 dark:text-teal-400 font-bold text-lg" style={{ display: hoverInstitutionData.profile_image ? 'none' : 'flex' }}>
                                          {(hoverInstitutionData.title || hoverInstitutionData.username || 'I')?.[0]?.toUpperCase()}
                                        </div>
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <h4 className="font-bold text-gray-800 dark:text-white text-sm truncate">
                                          {hoverInstitutionData.title || `${hoverInstitutionData.first_name || ''} ${hoverInstitutionData.last_name || ''}`.trim() || hoverInstitutionData.username}
                                        </h4>
                                        {hoverInstitutionData.location && (
                                          <p className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1 truncate">
                                            <FaMapMarkerAlt className="text-xs flex-shrink-0" />
                                            {hoverInstitutionData.location}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                    {hoverInstitutionData.about && (
                                      <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                                        {hoverInstitutionData.about}
                                      </p>
                                    )}
                                    <motion.button
                                      whileHover={{ scale: 1.02 }}
                                      whileTap={{ scale: 0.98 }}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleInstitutionProfileClick(item.publisher_username);
                                      }}
                                      className="w-full px-3 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-lg text-xs font-semibold transition-colors"
                                    >
                                      {t('feed.viewProfile') || 'View Profile'}
                                    </motion.button>
                                  </div>
                                ) : (
                                  <div className="text-center py-4">
                                    <p className="text-xs text-gray-500 dark:text-gray-500">{t('common.loading')}</p>
                                  </div>
                                )}
                              </motion.div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* Course Card */}
                    {item.type === 'course' && (
                      <motion.div
                        className="p-4 sm:p-6 cursor-pointer"
                        onClick={() => handleCourseClick(item)}
                        whileHover={{ scale: 1.01 }}
                        transition={{ duration: 0.2 }}
                      >
                        {/* Course Header with Institution Info */}
                        {item.publisher_username && (
                          <div className="mb-4 flex items-center gap-3 relative">
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleInstitutionProfileClick(item.publisher_username);
                              }}
                              onMouseEnter={(e) => handleInstitutionProfileHover(item.id, item.publisher_username, e)}
                              onMouseLeave={handleInstitutionProfileHoverLeave}
                              className="flex-shrink-0 cursor-pointer relative"
                            >
                              <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-gray-200 dark:border-navy-700 bg-gray-100 dark:bg-navy-700 flex items-center justify-center">
                                {item.publisher_profile_image ? (
                                  <img
                                    src={getImageUrl(item.publisher_profile_image)}
                                    alt={item.publisher_username}
                                    className="w-full h-full object-cover"
                                    onError={(e) => { e.target.style.display = 'none'; }}
                                  />
                                ) : (
                                  <span className="text-primary-600 dark:text-teal-400 font-bold text-sm">
                                    {(item.publisher_username || 'I')[0].toUpperCase()}
                                  </span>
                                )}
                              </div>
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleInstitutionProfileClick(item.publisher_username);
                              }}
                              onMouseEnter={(e) => handleInstitutionProfileHover(item.id, item.publisher_username, e)}
                              onMouseLeave={handleInstitutionProfileHoverLeave}
                              className="text-sm font-semibold text-gray-700 dark:text-gray-300 hover:underline"
                            >
                              {item.publisher_username || item.institution_name}
                            </motion.button>

                            {/* Hover Popup for Course Card */}
                            {hoveredItemId === item.id && (
                              <motion.div
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                className={`absolute ${isRTL ? 'right-0' : 'left-0'} top-full mt-2 w-64 bg-white dark:bg-navy-800 rounded-lg shadow-2xl border border-gray-200 dark:border-navy-700 z-50 p-4`}
                                onMouseEnter={() => {
                                  if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
                                  setHoveredItemId(item.id);
                                }}
                                onMouseLeave={handleInstitutionProfileHoverLeave}
                              >
                                {isLoadingHoverInstitution ? (
                                  <div className="flex items-center justify-center py-4">
                                    <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600 dark:border-teal-400"></div>
                                  </div>
                                ) : hoverInstitutionData ? (
                                  <div className="space-y-3">
                                    <div className="flex items-center gap-3">
                                      <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-primary-200 dark:border-primary-800 bg-gray-100 dark:bg-navy-700 flex items-center justify-center flex-shrink-0">
                                        {hoverInstitutionData.profile_image ? (
                                          <img
                                            src={hoverInstitutionData.profile_image}
                                            alt={hoverInstitutionData.title || hoverInstitutionData.username}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                              e.target.style.display = 'none';
                                              e.target.nextSibling.style.display = 'flex';
                                            }}
                                          />
                                        ) : null}
                                        <div className="w-full h-full flex items-center justify-center text-primary-600 dark:text-teal-400 font-bold text-lg" style={{ display: hoverInstitutionData.profile_image ? 'none' : 'flex' }}>
                                          {(hoverInstitutionData.title || hoverInstitutionData.username || 'I')?.[0]?.toUpperCase()}
                                        </div>
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <h4 className="font-bold text-gray-800 dark:text-white text-sm truncate">
                                          {hoverInstitutionData.title || `${hoverInstitutionData.first_name || ''} ${hoverInstitutionData.last_name || ''}`.trim() || hoverInstitutionData.username}
                                        </h4>
                                        {hoverInstitutionData.location && (
                                          <p className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1 truncate">
                                            <FaMapMarkerAlt className="text-xs flex-shrink-0" />
                                            {hoverInstitutionData.location}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                    {hoverInstitutionData.about && (
                                      <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                                        {hoverInstitutionData.about}
                                      </p>
                                    )}
                                    <motion.button
                                      whileHover={{ scale: 1.02 }}
                                      whileTap={{ scale: 0.98 }}
                                      onClick={() => handleInstitutionProfileClick(item.publisher_username)}
                                      className="w-full px-3 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-lg text-xs font-semibold transition-colors"
                                    >
                                      {t('feed.viewProfile') || 'View Profile'}
                                    </motion.button>
                                  </div>
                                ) : (
                                  <div className="text-center py-4">
                                    <p className="text-xs text-gray-500 dark:text-gray-500">{t('common.loading')}</p>
                                  </div>
                                )}
                              </motion.div>
                            )}
                          </div>
                        )}
                        <div className="flex flex-col sm:flex-row gap-4">
                          <div className="w-full sm:w-32 h-32 rounded-xl overflow-hidden bg-gray-100 dark:bg-navy-700 flex-shrink-0">
                            {item.course_image ? (
                              <img
                                src={getImageUrl(item.course_image)}
                                alt={item.title || 'Course'}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-primary-600 dark:text-teal-400 font-bold text-lg">
                                {(item.title || 'C')?.[0]?.toUpperCase()}
                              </div>
                            )}
                          </div>
                          <div className="flex-1 space-y-2">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <h3 className="text-xl font-bold text-gray-800 dark:text-white">
                                  {item.title || t('feed.course') || 'Course'}
                                </h3>
                                {item.level && (
                                  <p className="text-sm text-primary-600 dark:text-teal-400">
                                    {item.level}
                                  </p>
                                )}
                              </div>
                              {item.price && (
                                <span className="px-3 py-1 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full text-sm font-semibold">
                                  {item.price} {item.currency || '$'}
                                </span>
                              )}
                            </div>

                            {item.description && (
                              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3">
                                {item.description}
                              </p>
                            )}

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm text-gray-600 dark:text-gray-400">
                              {item.starting_date && (
                                <div className="flex items-center gap-2">
                                  <FaCalendarAlt className="text-primary-500 dark:text-teal-400" />
                                  <span>{item.starting_date}</span>
                                </div>
                              )}
                              {item.ending_date && (
                                <div className="flex items-center gap-2">
                                  <FaCalendarAlt className="text-primary-500 dark:text-teal-400" />
                                  <span>{item.ending_date}</span>
                                </div>
                              )}
                              {item.city && (
                                <div className="flex items-center gap-2">
                                  <FaMapMarkerAlt className="text-primary-500 dark:text-teal-400" />
                                  <span>{item.city}</span>
                                </div>
                              )}
                            </div>

                            {/* Enroll Button */}
                            {isStudent && (
                              <div className="pt-2">
                                {item.is_enrolled ? (
                                  <button
                                    disabled
                                    className="w-full sm:w-auto px-4 py-2 rounded-lg bg-gray-200 dark:bg-navy-700 text-gray-600 dark:text-gray-400 font-semibold cursor-not-allowed"
                                  >
                                    {t('feed.enrolled') || 'Enrolled'}
                                  </button>
                                ) : (
                                  <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleEnrollCourse(item);
                                    }}
                                    disabled={enrollingCourseId === (item.id || item.course_id)}
                                    className={`w-full sm:w-auto px-4 py-2 rounded-lg font-semibold transition-colors ${enrollingCourseId === (item.id || item.course_id)
                                      ? 'bg-primary-300 dark:bg-primary-700 text-white cursor-wait'
                                      : 'bg-primary-600 hover:bg-primary-500 text-white'
                                      }`}
                                  >
                                    {enrollingCourseId === (item.id || item.course_id)
                                      ? t('common.loading') || 'Loading...'
                                      : t('feed.enroll') || 'Enroll'}
                                  </motion.button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* Institution Achievement */}
                    {item.type === 'achievement' && (
                      <div className="p-4 sm:p-6">
                        <div className="flex items-start gap-4 mb-4">
                          <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-yellow-400">
                            <img
                              src={item.institutionImage}
                              alt={item.institutionName}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h3 className="text-xl font-bold text-gray-800 dark:text-white">
                                  {item.institutionName}
                                </h3>
                                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                                  <FaMapMarkerAlt className="inline mr-1" />
                                  {item.location}
                                </p>
                              </div>
                              <span className="text-sm text-gray-500 dark:text-gray-500">{item.timestamp}</span>
                            </div>
                          </div>
                        </div>

                        <div className="mb-4 p-4 bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 rounded-lg border-l-4 border-yellow-500">
                          <div className="flex items-center gap-2 mb-2">
                            <FaTrophy className="text-yellow-600 dark:text-yellow-400 text-xl" />
                            <span className="font-bold text-yellow-800 dark:text-yellow-300 text-lg">{item.achievement}</span>
                          </div>
                          <p className="text-gray-700 dark:text-gray-300">{item.description}</p>
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))}
              </motion.div>
            )}
          </div>
        </div>

        {/* Footer */}
        <footer className="bg-white dark:bg-navy-800 border-t border-gray-200 dark:border-navy-700 mt-12 transition-colors">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-6">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate('/about')}
                  className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-teal-400 transition-colors"
                >
                  <FaInfoCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">{t('feed.aboutUs')}</span>
                </motion.button>
              </div>
              <div className="text-center md:text-right text-gray-600 dark:text-gray-400">
                <p className="text-sm">
                  {t('feed.copyright')}
                </p>
                <p className="text-sm mt-2 text-gray-500 dark:text-gray-500">
                  {t('feed.developedBy')} <span className="font-semibold text-primary-600 dark:text-teal-400">Mohammed Salah</span> {t('feed.and')} <span className="font-semibold text-primary-600 dark:text-teal-400">Mustafa Mohammed</span>
                </p>
              </div>
            </div>
          </div>
        </footer>
      </div>

      {/* Apply Job Modal */}
      {showApplyJobModal && selectedJob && (
        <Modal
          isOpen={showApplyJobModal}
          onClose={() => {
            setShowApplyJobModal(false);
            setApplyJobMessage('');
            setSelectedJob(null);
          }}
          title={t('feed.applyToJob') || 'Apply to Job'}
        >
          <div className="space-y-6">
            <div className="bg-gray-50 dark:bg-navy-900 rounded-lg p-4">
              <h3 className="font-semibold text-gray-800 dark:text-white mb-2">{selectedJob.title}</h3>
              {selectedJob.institution && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {t('feed.institution') || 'Institution'}: {selectedJob.institution}
                </p>
              )}
              {selectedJob.city && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {t('feed.city') || 'City'}: {selectedJob.city}
                </p>
              )}
            </div>

            <div>
              <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
                {t('feed.messageToInstitution') || 'Message to Institution'} ({t('common.optional') || 'Optional'})
              </label>
              <textarea
                value={applyJobMessage}
                onChange={(e) => setApplyJobMessage(e.target.value)}
                placeholder={t('feed.messagePlaceholder') || 'Add a message to the institution (optional)...'}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 dark:border-navy-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-navy-700 text-gray-900 dark:text-white"
              />
            </div>

            <div className="flex gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setShowApplyJobModal(false);
                  setApplyJobMessage('');
                  setSelectedJob(null);
                }}
                className="flex-1 px-4 py-3 border border-gray-300 dark:border-navy-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-navy-700 transition-colors"
              >
                {t('common.cancel') || 'Cancel'}
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleApplyJob}
                disabled={isApplying}
                className="flex-1 px-4 py-3 bg-primary-600 hover:bg-primary-500 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isApplying ? (t('feed.applying') || 'Applying...') : (t('feed.apply') || 'Apply')}
              </motion.button>
            </div>
          </div>
        </Modal>
      )}

      {/* Profile Modal */}
      {selectedProfile && (
        <Modal
          isOpen={!!selectedProfile}
          onClose={handleCloseProfile}
          title={selectedProfile.name}
        >
          <div className="space-y-6">
            {/* Profile Header */}
            <div className="flex items-start gap-6">
              <div className="relative">
                <img
                  src={selectedProfile.image}
                  alt={selectedProfile.name}
                  className="w-32 h-32 rounded-full object-cover border-4 border-primary-200 dark:border-primary-800"
                />
                {/* Verification Badge */}
                {selectedProfile.isVerified && (
                  <div className="absolute bottom-0 right-0 w-10 h-10 bg-green-500 rounded-full flex items-center justify-center border-4 border-white dark:border-navy-800">
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                    {selectedProfile.name}
                  </h2>
                  {/* Verification Badge (Text) */}
                  {selectedProfile.isVerified ? (
                    <span className="px-3 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-full text-xs font-semibold flex items-center gap-1">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      {t('feed.verified')}
                    </span>
                  ) : (
                    <span className="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-full text-xs font-semibold">
                      {t('feed.notVerified')}
                    </span>
                  )}
                </div>
                <p className="text-lg text-primary-600 dark:text-teal-400 mb-1">
                  {profileType === 'student' ? selectedProfile.major : selectedProfile.specialty}
                </p>
                <p className="text-gray-600 dark:text-gray-400">
                  {profileType === 'student' ? `${selectedProfile.year} • ${selectedProfile.university}` : `${selectedProfile.experience} Experience • ${selectedProfile.university}`}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                  {selectedProfile.bio}
                </p>
              </div>
            </div>

            {/* Contact Information */}
            <div className="bg-gray-50 dark:bg-navy-900 rounded-lg p-4">
              <h3 className="font-semibold text-gray-800 dark:text-white mb-3">{t('feed.contactInformation')}</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-gray-600 dark:text-gray-400">📧 {t('feed.email')}:</span>
                  <span className="text-gray-800 dark:text-white">{selectedProfile.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-600 dark:text-gray-400">📱 {t('feed.phone')}:</span>
                  <span className="text-gray-800 dark:text-white">{selectedProfile.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-600 dark:text-gray-400">📍 {t('feed.location')}:</span>
                  <span className="text-gray-800 dark:text-white">{selectedProfile.location}</span>
                </div>
              </div>
            </div>

            {/* About */}
            <div>
              <h3 className="font-semibold text-gray-800 dark:text-white mb-2">{t('feed.about')}</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                {selectedProfile.about}
              </p>
            </div>

            {/* Student-specific content */}
            {profileType === 'student' && (
              <>
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-800 dark:text-white mb-2">{t('feed.academicPerformance')}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-semibold">{t('feed.gpa')}:</span> {selectedProfile.gpa}
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-800 dark:text-white mb-2">{t('feed.skills')}</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedProfile.skills.map((skill, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 rounded-full text-sm"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-800 dark:text-white mb-2">{t('feed.interests')}</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedProfile.interests.map((interest, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-teal-100 dark:bg-teal-900 text-teal-700 dark:text-teal-300 rounded-full text-sm"
                      >
                        {interest}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-800 dark:text-white mb-2">{t('feed.achievements')}</h3>
                  <ul className="space-y-2">
                    {selectedProfile.achievements.map((achievement, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <span className="text-primary-600 dark:text-teal-400">✓</span>
                        {achievement}
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            )}

            {/* Lecturer-specific content */}
            {profileType === 'lecturer' && (
              <>
                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-800 dark:text-white mb-2">{t('feed.education')}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {selectedProfile.education}
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-800 dark:text-white mb-2">{t('feed.coursesTaught')}</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedProfile.courses.map((course, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 rounded-full text-sm"
                      >
                        {course}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-800 dark:text-white mb-2">{t('feed.researchInterests')}</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedProfile.research.map((topic, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-teal-100 dark:bg-teal-900 text-teal-700 dark:text-teal-300 rounded-full text-sm"
                      >
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-800 dark:text-white mb-2">{t('feed.publications')}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {selectedProfile.publications}
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-800 dark:text-white mb-2">{t('feed.achievementsAwards')}</h3>
                  <ul className="space-y-2">
                    {selectedProfile.achievements.map((achievement, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <span className="text-primary-600 dark:text-teal-400">🏆</span>
                        {achievement}
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            )}
          </div>
        </Modal>
      )}

      {/* Profile Modal */}
      <ProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
      />

      {/* Institution Profile Modal */}
      <Modal
        isOpen={showInstitutionProfile}
        onClose={handleCloseInstitutionProfile}
        title={selectedInstitution?.title || selectedInstitution?.username || 'Institution Profile'}
      >
        {isLoadingInstitutionProfile ? (
          <div className="flex items-center justify-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 dark:border-teal-400"></div>
            <p className="ml-3 text-gray-600 dark:text-gray-400">{t('common.loading')}</p>
          </div>
        ) : selectedInstitution ? (
          <div className="space-y-6">
            {/* Institution Header */}
            <div className="flex items-start gap-6">
              <div className="relative flex-shrink-0">
                <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-primary-200 dark:border-primary-800 bg-gray-100 dark:bg-navy-700 flex items-center justify-center">
                  {selectedInstitution.profile_image ? (
                    <img
                      src={selectedInstitution.profile_image}
                      alt={selectedInstitution.title || selectedInstitution.username}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div className="w-full h-full flex items-center justify-center text-primary-600 dark:text-teal-400 font-bold text-2xl" style={{ display: selectedInstitution.profile_image ? 'none' : 'flex' }}>
                    {(selectedInstitution.title || selectedInstitution.username || 'I')?.[0]?.toUpperCase()}
                  </div>
                </div>
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-1">
                  {selectedInstitution.title || `${selectedInstitution.first_name || ''} ${selectedInstitution.last_name || ''}`.trim() || selectedInstitution.username}
                </h2>
                {selectedInstitution.location && (
                  <p className="text-gray-600 dark:text-gray-400 flex items-center gap-2 mb-2">
                    <FaMapMarkerAlt className="text-sm" />
                    {selectedInstitution.location}
                  </p>
                )}
                {selectedInstitution.city && (
                  <p className="text-sm text-gray-500 dark:text-gray-500">
                    {selectedInstitution.city}
                  </p>
                )}
              </div>
            </div>

            {/* About Section */}
            {selectedInstitution.about && (
              <div>
                <h3 className="font-semibold text-gray-800 dark:text-white mb-2">{t('feed.about')}</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed whitespace-pre-wrap">
                  {selectedInstitution.about}
                </p>
              </div>
            )}

            {/* Contact Information */}
            {selectedInstitution.username && (
              <div className="bg-gray-50 dark:bg-navy-900 rounded-lg p-4">
                <h3 className="font-semibold text-gray-800 dark:text-white mb-3">{t('feed.contactInformation')}</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600 dark:text-gray-400">👤 {t('feed.username') || 'Username'}:</span>
                    <span className="text-gray-800 dark:text-white font-medium">{selectedInstitution.username}</span>
                  </div>
                  {selectedInstitution.location && (
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600 dark:text-gray-400">📍 {t('feed.location')}:</span>
                      <span className="text-gray-800 dark:text-white">{selectedInstitution.location}</span>
                    </div>
                  )}
                  {selectedInstitution.city && (
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600 dark:text-gray-400">🏙️ {t('feed.city') || 'City'}:</span>
                      <span className="text-gray-800 dark:text-white">{selectedInstitution.city}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400">{t('feed.failedToLoadProfile') || 'Failed to load institution profile'}</p>
          </div>
        )}
      </Modal>

      {/* Verification Required Popup */}
      <AnimatePresence>
        {showVerificationPopup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowVerificationPopup(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-navy-800 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-yellow-500 to-orange-500 p-6 text-center">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-white">
                  {t('verification.required') || 'Verification Required'}
                </h3>
              </div>

              {/* Content */}
              <div className="p-6">
                <p className="text-gray-600 dark:text-gray-400 text-center mb-6">
                  {t('verification.message') || 'Your account needs to be verified to access this feature. Please verify your account to continue.'}
                </p>

                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
                  <div className={`flex items-start gap-3 ${isRTL ? 'flex-row-reverse text-right' : ''}`}>
                    <FaInfoCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm text-yellow-800 dark:text-yellow-300 font-medium mb-1">
                        {t('verification.howToVerify') || 'How to verify?'}
                      </p>
                      <p className="text-xs text-yellow-700 dark:text-yellow-400">
                        {t('verification.instructions') || 'Go to your profile and complete the verification process by uploading the required documents.'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowVerificationPopup(false)}
                    className="flex-1 px-4 py-3 border border-gray-300 dark:border-navy-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-navy-700 transition-colors"
                  >
                    {t('common.close') || 'Close'}
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setShowVerificationPopup(false);
                      setShowProfileModal(true);
                    }}
                    className="flex-1 px-4 py-3 bg-primary-600 hover:bg-primary-500 text-white rounded-lg font-medium transition-colors"
                  >
                    {t('verification.goToProfile') || 'Go to Profile'}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Keyboard Shortcuts Help Modal */}
      <KeyboardShortcutsHelp
        isOpen={showKeyboardHelp}
        onClose={() => setShowKeyboardHelp(false)}
      />
    </div>
  );
};

export default Feed;

