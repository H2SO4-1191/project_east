import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  FaArrowLeft,
  FaUserGraduate,
  FaChalkboardTeacher,
  FaBriefcase,
  FaMoon,
  FaSun,
  FaCompass,
  FaBook,
  FaTachometerAlt,
  FaMapMarkerAlt,
  FaSearch,
  FaUser,
  FaUniversity,
  FaBell,
  FaSignInAlt,
  FaSignOutAlt,
  FaTimes,
  FaFilter,
  FaStar,
  FaGraduationCap,
  FaClock,
  FaUsers,
  FaDollarSign,
  FaInfoCircle,
  FaBookmark,
  FaChartLine
} from 'react-icons/fa';
import { useInstitute } from '../context/InstituteContext';
import { useTheme } from '../context/ThemeContext';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { authService } from '../services/authService';
import LanguageSwitcher from '../components/LanguageSwitcher';
import Modal from '../components/Modal';
import ProfileModal from '../components/ProfileModal';
import KeyboardShortcutsHelp from '../components/KeyboardShortcutsHelp';
import toast from 'react-hot-toast';

const Explore = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { instituteData, updateInstituteData } = useInstitute();
  const { isDark, toggleTheme } = useTheme();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'students', 'lecturers', 'positions', 'courses', 'institutions'
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [profileType, setProfileType] = useState(null);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedInstitution, setSelectedInstitution] = useState('all');
  const [isLoadingSearch, setIsLoadingSearch] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);
  const notificationRef = useRef(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showVerificationPopup, setShowVerificationPopup] = useState(false);

  // API data states
  const [students, setStudents] = useState([]);
  const [lecturers, setLecturers] = useState([]);
  const [positions, setPositions] = useState([]);
  const [institutionJobPosts, setInstitutionJobPosts] = useState([]); // Job posts from institutions
  const [institutions, setInstitutions] = useState([]); // Institutions from search
  const [courses, setCourses] = useState([]);
  const [allResults, setAllResults] = useState([]); // Mixed results for "All" tab
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [isLoadingCourse, setIsLoadingCourse] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [isLoadingJob, setIsLoadingJob] = useState(false);
  const [showApplyJobModal, setShowApplyJobModal] = useState(false);
  const [applyJobMessage, setApplyJobMessage] = useState('');
  const [isApplying, setIsApplying] = useState(false);
  const [markingLecturer, setMarkingLecturer] = useState(null); // Track which lecturer is being marked
  const [markedLecturers, setMarkedLecturers] = useState(new Set()); // Track marked lecturer IDs
  const [enrollingCourseId, setEnrollingCourseId] = useState(null); // Track which course is being enrolled
  const [showEnrollmentContradiction, setShowEnrollmentContradiction] = useState(false);
  const [enrollmentContradiction, setEnrollmentContradiction] = useState(null);
  
  // Progress modal state
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [progressData, setProgressData] = useState(null);
  const [loadingProgress, setLoadingProgress] = useState(false);
  const [progressCourse, setProgressCourse] = useState(null);
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);
  const searchInputRef = useRef(null);
  const [username, setUsername] = useState(null);
  const sidebarTimeoutRef = useRef(null);
  
  // Lecturer courses modal state
  const [showLecturerCoursesModal, setShowLecturerCoursesModal] = useState(false);
  const [lecturerCourses, setLecturerCourses] = useState([]);
  const [isLoadingLecturerCourses, setIsLoadingLecturerCourses] = useState(false);

  const isInstitution = instituteData.userType === 'institution';

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (sidebarTimeoutRef.current) {
        clearTimeout(sidebarTimeoutRef.current);
      }
    };
  }, []);
  
  // Keyboard shortcuts
  useKeyboardShortcuts({
    onSearch: () => searchInputRef.current?.focus(),
    onHelp: () => setShowKeyboardHelp(true),
    userType: instituteData.userType,
  });

  // Fetch username from profile on mount
  useEffect(() => {
    const fetchUsername = async () => {
      if (!instituteData.isAuthenticated || !instituteData.accessToken) {
        return;
      }

      try {
        // Fetch profile based on user type
        let profileData = null;
        if (instituteData.userType === 'institution') {
          const data = await authService.getInstitutionProfile(instituteData.accessToken, {
            refreshToken: instituteData.refreshToken,
            onTokenRefreshed: (tokens) => {
              updateInstituteData({
                accessToken: tokens.access,
                refreshToken: tokens.refresh || instituteData.refreshToken,
              });
            },
            onSessionExpired: () => {
              // Handle session expired
            },
          });
          if (data?.success && data?.data?.username) {
            setUsername(data.data.username);
          }
        } else if (instituteData.userType === 'student') {
          const data = await authService.getStudentProfileSelf(instituteData.accessToken, {
            refreshToken: instituteData.refreshToken,
            onTokenRefreshed: (tokens) => {
              updateInstituteData({
                accessToken: tokens.access,
                refreshToken: tokens.refresh || instituteData.refreshToken,
              });
            },
            onSessionExpired: () => {
              // Handle session expired
            },
          });
          if (data?.success && data?.data?.username) {
            setUsername(data.data.username);
          }
        } else if (instituteData.userType === 'lecturer') {
          const data = await authService.getLecturerProfileSelf(instituteData.accessToken, {
            refreshToken: instituteData.refreshToken,
            onTokenRefreshed: (tokens) => {
              updateInstituteData({
                accessToken: tokens.access,
                refreshToken: tokens.refresh || instituteData.refreshToken,
              });
            },
            onSessionExpired: () => {
              // Handle session expired
            },
          });
          if (data?.success && data?.data?.username) {
            setUsername(data.data.username);
          }
        }
      } catch (error) {
        console.error('Error fetching username:', error);
        // Fallback to instituteData.username if fetch fails
        if (instituteData.username) {
          setUsername(instituteData.username);
        }
      }
    };

    fetchUsername();
  }, [instituteData.isAuthenticated, instituteData.accessToken, instituteData.userType, instituteData.refreshToken, updateInstituteData]);

  // Helper function to convert relative image URLs to full URLs
  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }
    const baseUrl = import.meta.env.VITE_API_BASE_URL?.replace(/\/+$/, '') || 'https://projecteastapi.ddns.net';
    // Ensure imagePath starts with / and doesn't have duplicate /media/
    let cleanPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
    // Remove duplicate /media/ if present
    cleanPath = cleanPath.replace(/^\/media\/media\//, '/media/');
    return `${baseUrl}${cleanPath}`;
  };

  // Fetch job posts from institutions
  const fetchInstitutionJobPosts = async (institutionUsernames = []) => {
    if (institutionUsernames.length === 0) {
      // Try to get institution usernames from feed
      try {
        const accessToken = instituteData.accessToken || null;
        const refreshToken = instituteData.refreshToken || null;
        const feedData = await authService.getFeed(accessToken, {
          refreshToken,
          onTokenRefreshed: (tokens) => {
            updateInstituteData({
              accessToken: tokens.access,
              refreshToken: tokens.refresh || refreshToken,
            });
          },
        });

        if (feedData?.success && feedData?.data) {
          const usernames = new Set();
          feedData.data.forEach((item) => {
            if (item.institution_username) usernames.add(item.institution_username);
            if (item.institution?.username) usernames.add(item.institution.username);
            if (item.username && item.type === 'institution') usernames.add(item.username);
          });
          institutionUsernames = Array.from(usernames);
        }
      } catch (error) {
        console.error('Error fetching feed for institution usernames:', error);
      }
    }

    if (institutionUsernames.length === 0) {
      return [];
    }

    // Fetch job posts from all institutions
    const jobPostPromises = institutionUsernames.map(async (username) => {
      try {
        const jobData = await authService.getInstitutionJobs(username);
        if (jobData?.success && jobData?.data) {
          return jobData.data.map((job) => ({
            ...job,
            institution_username: username,
            itemType: 'institution_job',
          }));
        }
        return [];
      } catch (error) {
        console.error(`Error fetching jobs for ${username}:`, error);
        return [];
      }
    });

    const allJobPosts = await Promise.all(jobPostPromises);
    return allJobPosts.flat();
  };

  // Check if lecturers are marked (for institution users)
  useEffect(() => {
    const checkLecturersMarked = async () => {
      if (!isInstitution || !instituteData.isAuthenticated || !instituteData.accessToken || !instituteData.isVerified) {
        return;
      }

      // Get all lecturer IDs from current results
      const lecturerIds = [];
      
      // From "All" tab
      allResults.forEach(item => {
        if (item.itemType === 'lecturer' && item.id) {
          lecturerIds.push(item.id);
        }
      });
      
      // From "Lecturers" tab
      lecturers.forEach(lecturer => {
        if (lecturer.id) {
          lecturerIds.push(lecturer.id);
        }
      });

      if (lecturerIds.length === 0) {
        return;
      }

      // Check each lecturer's marked status
      const checkPromises = lecturerIds.map(async (lecturerId) => {
        try {
          const response = await authService.isLecturerMarked(
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
                // Handle session expired silently
              },
            }
          );
          
          if (response?.success && response?.marked === true) {
            return lecturerId;
          }
          return null;
        } catch (error) {
          // Silently fail - lecturer might not be marked
          return null;
        }
      });

      const markedIds = await Promise.all(checkPromises);
      const validMarkedIds = markedIds.filter(id => id !== null);
      
      if (validMarkedIds.length > 0) {
        setMarkedLecturers(prev => {
          const newSet = new Set(prev);
          validMarkedIds.forEach(id => newSet.add(id));
          return newSet;
        });
      }
    };

    checkLecturersMarked();
  }, [allResults, lecturers, isInstitution, instituteData.isAuthenticated, instituteData.accessToken, instituteData.isVerified, instituteData.refreshToken, updateInstituteData]);

  // Search API integration
  useEffect(() => {
    const performSearch = async () => {
      setIsLoadingSearch(true);
      setSearchError(null);

      try {
        const accessToken = instituteData.accessToken || null;
        const refreshToken = instituteData.refreshToken || null;

        // Determine filter based on active tab
        let filter = null;
        if (activeTab === 'students') filter = 'students';
        else if (activeTab === 'lecturers') filter = 'lecturers';
        else if (activeTab === 'positions') filter = 'jobs';
        else if (activeTab === 'courses') filter = 'courses';
        else if (activeTab === 'institutions') filter = 'institutions';

        // Use empty query to fetch all data from /explore/ endpoint
        const query = searchQuery.trim() || '';
        const searchData = await authService.exploreSearch(query, filter, accessToken, {
          refreshToken,
          onTokenRefreshed: (tokens) => {
            updateInstituteData({
              accessToken: tokens.access,
              refreshToken: tokens.refresh || refreshToken,
            });
          },
          onSessionExpired: () => {
            // Handle session expired
          },
        });

        // Handle API response structure: { success: true, results: {...} }
        const results = searchData?.success === true && searchData?.results 
          ? searchData.results 
          : (searchData?.results || searchData);
        
        // Only process if we have valid results
        if (searchData?.success === true || (results && typeof results === 'object')) {
          // Fetch institution job posts if positions tab is active or all tab
          let institutionJobs = [];
          if (activeTab === 'positions' || activeTab === 'all') {
            try {
              // Extract institution usernames from search results if available
              const institutionUsernames = [];
              if (Array.isArray(results?.institutions)) {
                results.institutions.forEach(inst => {
                  if (inst?.username) institutionUsernames.push(inst.username);
                });
              }
              institutionJobs = await fetchInstitutionJobPosts(institutionUsernames);
            } catch (error) {
              console.error('Error fetching institution job posts:', error);
              institutionJobs = [];
            }
          }

          if (activeTab === 'all') {
            // Mixed results for "All" tab
            const mixed = [];
            if (Array.isArray(results?.students)) {
              mixed.push(...results.students.map(s => ({ ...s, itemType: 'student' })));
            }
            if (Array.isArray(results?.lecturers)) {
              mixed.push(...results.lecturers.map(l => ({ ...l, itemType: 'lecturer' })));
            }
            if (Array.isArray(results?.institutions)) {
              mixed.push(...results.institutions.map(i => ({ ...i, itemType: 'institution' })));
              setInstitutions(results.institutions);
            }
            if (Array.isArray(results?.jobs)) {
              mixed.push(...results.jobs.map(j => ({ ...j, itemType: 'job' })));
            }
            // Add institution job posts
            if (Array.isArray(institutionJobs) && institutionJobs.length > 0) {
              mixed.push(...institutionJobs);
            }
            if (Array.isArray(results?.courses)) {
              mixed.push(...results.courses.map(c => ({ ...c, itemType: 'course' })));
            }
            setAllResults(mixed);
            setStudents([]);
            setLecturers([]);
            setPositions([]);
            setInstitutionJobPosts(institutionJobs || []);
            setCourses([]);
          } else {
            // Filtered results - extract from results object
            if (activeTab === 'students') {
              const studentsData = Array.isArray(results?.students) ? results.students : [];
              setStudents(studentsData);
              setLecturers([]);
              setPositions([]);
              setInstitutionJobPosts([]);
              setCourses([]);
              setAllResults([]);
            } else if (activeTab === 'lecturers') {
              const lecturersData = Array.isArray(results?.lecturers) ? results.lecturers : [];
              setLecturers(lecturersData);
              setStudents([]);
              setPositions([]);
              setInstitutionJobPosts([]);
              setCourses([]);
              setAllResults([]);
            } else if (activeTab === 'positions') {
              // Jobs from search API
              const jobsFromSearch = Array.isArray(results?.jobs) ? results.jobs : [];
              setPositions(jobsFromSearch);
              setInstitutionJobPosts(Array.isArray(institutionJobs) ? institutionJobs : []);
              setStudents([]);
              setLecturers([]);
              setCourses([]);
              setAllResults([]);
            } else if (activeTab === 'courses') {
              const coursesData = Array.isArray(results?.courses) ? results.courses : [];
              // Check enrollment status for courses if user is a student
              if (instituteData.isAuthenticated && instituteData.userType === 'student' && instituteData.accessToken && coursesData.length > 0) {
                const enrollmentChecks = await Promise.allSettled(
                  coursesData.map(async (course) => {
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
                
                // Update courses with enrollment status
                const coursesWithEnrollment = coursesData.map(course => {
                  const courseId = course.id || course.course_id;
                  return {
                    ...course,
                    is_enrolled: enrollmentMap.get(courseId) || false,
                  };
                });
                
                setCourses(coursesWithEnrollment);
              } else {
                setCourses(coursesData);
              }
              setStudents([]);
              setLecturers([]);
              setPositions([]);
              setInstitutionJobPosts([]);
              setInstitutions([]);
              setAllResults([]);
            } else if (activeTab === 'institutions') {
              const institutionsData = Array.isArray(results?.institutions) ? results.institutions : [];
              setInstitutions(institutionsData);
              setStudents([]);
              setLecturers([]);
              setPositions([]);
              setInstitutionJobPosts([]);
              setCourses([]);
              setAllResults([]);
            }
          }
        } else {
          // API returned success: false or invalid response
          setStudents([]);
          setLecturers([]);
          setPositions([]);
          setInstitutionJobPosts([]);
          setCourses([]);
          setAllResults([]);
        }
      } catch (error) {
        console.error('Error searching:', error);
        setSearchError(error?.message || error?.data?.message || 'Failed to search. Please try again.');
        // Clear all results on error instead of showing demo data
        setStudents([]);
        setLecturers([]);
        setPositions([]);
        setInstitutionJobPosts([]);
        setCourses([]);
        setAllResults([]);
      } finally {
        setIsLoadingSearch(false);
      }
    };

    // Debounce search
    const timeoutId = setTimeout(() => {
      performSearch();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, activeTab, instituteData.accessToken]);


  // Fetch Notifications for Students and Lecturers
  useEffect(() => {
    const fetchNotifications = async () => {
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
            // Handle session expired
          },
        });

        if (notificationData?.success && Array.isArray(notificationData.notifications)) {
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
        setNotifications([]);
      } finally {
        setIsLoadingNotifications(false);
      }
    };

    fetchNotifications();
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
    window.location.reload();
  };

  const handleViewProfile = async (profile, type) => {
    setIsLoadingProfile(true);
    try {
      let profileData = null;
      
      // If profile has username, fetch full profile from API
      if (profile.username) {
        try {
          if (type === 'student') {
            const response = await authService.getStudentPublicProfile(profile.username);
            if (response?.success && response?.data) {
              profileData = {
                ...response.data,
                // Preserve original API fields
                username: response.data.username,
                first_name: response.data.first_name,
                last_name: response.data.last_name,
                city: response.data.city,
                about: response.data.about,
                profile_image: response.data.profile_image,
                studying_level: response.data.studying_level,
                // Also add mapped fields for compatibility
                name: `${response.data.first_name || ''} ${response.data.last_name || ''}`.trim() || response.data.username,
                image: getImageUrl(response.data.profile_image),
                bio: response.data.about,
                major: response.data.studying_level,
                isVerified: false, // Public profiles don't show verification status
              };
            }
          } else if (type === 'lecturer') {
            const response = await authService.getLecturerPublicProfile(profile.username);
            if (response?.success && response?.data) {
              profileData = {
                ...response.data,
                name: `${response.data.first_name || ''} ${response.data.last_name || ''}`.trim() || response.data.username,
                username: response.data.username,
                image: getImageUrl(response.data.profile_image),
                bio: response.data.about || '',
                specialty: response.data.specialty,
                experience: response.data.experience ? `${response.data.experience} years` : '',
                university: response.data.institutions?.[0] || '',
                isVerified: false,
              };
            }
          } else if (type === 'institution') {
            const response = await authService.getInstitutionPublicProfile(profile.username);
            if (response?.success && response?.data) {
              profileData = {
                ...response.data,
                name: response.data.title || `${response.data.first_name || ''} ${response.data.last_name || ''}`.trim() || response.data.username,
                username: response.data.username,
                first_name: response.data.first_name,
                last_name: response.data.last_name,
                image: getImageUrl(response.data.profile_image),
                profile_image: response.data.profile_image, // Keep original path too
                bio: response.data.about || '',
                about: response.data.about, // Keep both
                title: response.data.title,
                location: response.data.location,
                city: response.data.city,
                isVerified: false,
              };
            }
          }
        } catch (error) {
          console.error('Error fetching profile:', error);
          // Fallback to provided profile data if API fails
          profileData = profile;
        }
      } else {
        // Use provided profile data if no username
        profileData = profile;
      }
      
      if (profileData) {
        setSelectedProfile(profileData);
        setProfileType(type);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      toast.error(t('feed.profileLoadError') || 'Failed to load profile');
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const handleCloseProfile = () => {
    setSelectedProfile(null);
    setProfileType(null);
  };

  const handleViewJob = async (job) => {
    if (!job.id) {
      toast.error(t('feed.jobNotFound') || 'Job ID not found');
      return;
    }

    setIsLoadingJob(true);
    setSelectedJob(null);

    try {
      const response = await authService.getJobDetails(job.id);
      
      if (response?.success && response?.data) {
        setSelectedJob({
          ...response.data,
          institution_username: job.institution_username || null,
        });
      } else {
        toast.error(response?.message || t('feed.failedToLoadJob') || 'Failed to load job details');
      }
    } catch (error) {
      console.error('Error fetching job details:', error);
      toast.error(error?.message || t('feed.failedToLoadJob') || 'Failed to load job details');
    } finally {
      setIsLoadingJob(false);
    }
  };

  const handleCloseJob = () => {
    setSelectedJob(null);
  };

  const handleViewCourse = async (course) => {
    if (!course.id) {
      toast.error(t('feed.courseNotFound') || 'Course ID not found');
      return;
    }

    setIsLoadingCourse(true);
    // Set basic course data first to show modal with loading state
    setSelectedCourse(course);

    try {
      const response = await authService.getCourseDetails(course.id);
      
      if (response?.success && response?.data) {
        setSelectedCourse(response.data);
      } else {
        // Keep the basic data from search results if API fails
        console.warn('Failed to fetch full course details, using basic data');
      }
    } catch (error) {
      console.error('Error fetching course details:', error);
      // Keep the basic data from search results if API fails
    } finally {
      setIsLoadingCourse(false);
    }
  };

  const handleCloseCourse = () => {
    setSelectedCourse(null);
  };

  // Handle course enrollment
  const handleEnrollCourse = async (course, e) => {
    if (e) {
      e.stopPropagation();
    }

    // Check if user is authenticated
    if (!instituteData.isAuthenticated) {
      toast.error(t('common.loginRequired') || 'Please log in to enroll');
      return;
    }

    // Check if user is a student
    if (instituteData.userType !== 'student') {
      toast.error(t('feed.studentOnly') || 'Only students can enroll in courses');
      return;
    }

    // Check if user is verified
    if (!instituteData.isVerified) {
      setShowVerificationPopup(true);
      return;
    }

    if (!course.id) {
      toast.error(t('feed.courseNotFound') || 'Course ID not found');
      return;
    }

    setEnrollingCourseId(course.id);

    try {
      // First check if student is free (no schedule conflict)
      const checkResponse = await authService.checkStudentFree(
        instituteData.accessToken,
        course.id,
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

      // Check if there's a schedule conflict
      if (checkResponse?.success === false && checkResponse?.contradiction) {
        setEnrollmentContradiction(checkResponse.contradiction);
        setShowEnrollmentContradiction(true);
        return;
      }

      // If no conflict, proceed with enrollment
      const enrollResponse = await authService.enrollInCourse(
        instituteData.accessToken,
        course.id,
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

      // Handle enrollment success
      if (enrollResponse?.success) {
        toast.success(enrollResponse?.message || t('feed.enrollmentSuccess') || 'Enrolled successfully!');
        // Close course modal if open
        if (selectedCourse?.id === course.id) {
          setSelectedCourse(null);
        }
      } else {
        toast.error(enrollResponse?.message || t('feed.enrollmentFailed') || 'Failed to enroll');
      }
    } catch (error) {
      console.error('Error enrolling in course:', error);
      toast.error(error?.message || error?.data?.message || t('feed.enrollmentFailed') || 'Failed to enroll');
    } finally {
      setEnrollingCourseId(null);
    }
  };

  // Handle viewing course progress
  const handleViewProgress = async (course, e) => {
    if (e) {
      e.stopPropagation();
    }

    if (!course.id) {
      toast.error(t('feed.courseNotFound') || 'Course ID not found');
      return;
    }

    setProgressCourse(course);
    setShowProgressModal(true);
    setLoadingProgress(true);
    setProgressData(null);

    try {
      const response = await authService.getCourseProgress(
        course.id,
        instituteData.accessToken || null,
        {
          refreshToken: instituteData.refreshToken,
          onTokenRefreshed: (tokens) => {
            updateInstituteData({
              accessToken: tokens.access,
              refreshToken: tokens.refresh || instituteData.refreshToken,
            });
          },
          onSessionExpired: () => {
            // Don't show error for public endpoint
          },
        }
      );

      if (response?.success) {
        setProgressData(response);
      } else {
        toast.error(response?.message || t('feed.failedToLoadProgress') || 'Failed to load progress');
      }
    } catch (error) {
      console.error('Error fetching progress:', error);
      toast.error(error?.message || t('feed.failedToLoadProgress') || 'Failed to load progress');
    } finally {
      setLoadingProgress(false);
    }
  };

  const isLecturer = instituteData.userType === 'lecturer';

  return (
    <div className={`min-h-screen transition-colors flex ${
      isLecturer 
        ? 'bg-gray-50/95 dark:bg-navy-900' 
        : 'bg-gray-50 dark:bg-navy-900'
    }`} style={isLecturer ? { background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.03) 0%, transparent 50%)' } : undefined}>
      {/* Left Sidebar */}
      <aside 
        className={`hidden lg:block shadow-xl border-r fixed left-0 top-0 bottom-0 overflow-y-auto z-40 transition-all duration-300 ${
          isSidebarExpanded ? 'w-80' : 'w-20'
        } ${
          isLecturer 
            ? 'bg-white dark:bg-navy-800 border-gray-200 dark:border-navy-700 border-l-2 border-l-purple-400/30 dark:border-l-purple-500/20' 
            : 'bg-white dark:bg-navy-800 border-gray-200 dark:border-navy-700'
        }`}
        onMouseEnter={() => {
          if (sidebarTimeoutRef.current) {
            clearTimeout(sidebarTimeoutRef.current);
          }
          setIsSidebarExpanded(true);
        }}
        onMouseLeave={() => {
          // Add delay before collapsing to allow clicks to register
          sidebarTimeoutRef.current = setTimeout(() => {
            setIsSidebarExpanded(false);
          }, 200);
        }}
      >
        <div className="p-6 flex flex-col h-full">
          <div className="flex-1">
          <h2 className={`text-xl font-bold text-gray-800 dark:text-white mb-4 transition-opacity duration-300 ${
            isSidebarExpanded ? 'opacity-100' : 'opacity-0'
          }`}>
            {t('feed.explore')}
          </h2>

          {/* Back Button - Under Explore Label */}
          <motion.button
            type="button"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (sidebarTimeoutRef.current) {
                clearTimeout(sidebarTimeoutRef.current);
              }
              navigate('/feed');
            }}
            onMouseEnter={() => {
              if (sidebarTimeoutRef.current) {
                clearTimeout(sidebarTimeoutRef.current);
              }
              setIsSidebarExpanded(true);
            }}
            className={`w-full flex items-center ${isSidebarExpanded ? 'gap-3' : 'justify-center'} px-4 py-3 rounded-lg transition-all text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-navy-700 mb-6 cursor-pointer`}
            whileTap={{ scale: 0.95 }}
          >
            <FaArrowLeft className="w-5 h-5 flex-shrink-0" />
            {isSidebarExpanded && <span className="font-medium">{t('common.back')}</span>}
          </motion.button>
          
          {/* Sidebar Navigation Buttons - Role Based */}
          {instituteData.isAuthenticated && (
            <div className="space-y-2 mb-6">
              {/* My Courses - Student & Lecturer Only */}
              {(instituteData.userType === 'student' || instituteData.userType === 'lecturer') && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (sidebarTimeoutRef.current) {
                      clearTimeout(sidebarTimeoutRef.current);
                    }
                    /* UNCOMMENT FOR PRODUCTION - Verification Check
                    if (!instituteData.isVerified) {
                      setShowVerificationPopup(true);
                      return;
                    }
                    */
                    const targetPath = instituteData.userType === 'student' ? '/student/courses' : '/lecturer/courses';
                    navigate(targetPath);
                  }}
                  onMouseEnter={() => {
                    if (sidebarTimeoutRef.current) {
                      clearTimeout(sidebarTimeoutRef.current);
                    }
                    setIsSidebarExpanded(true);
                  }}
                  className={`w-full flex items-center ${isSidebarExpanded ? 'gap-3' : 'justify-center'} px-4 py-3 rounded-lg transition-all text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-navy-700`}
                  title={t('nav.currentCourses')}
                >
                  <FaBook className="w-5 h-5 flex-shrink-0" />
                  {isSidebarExpanded && <span className="font-medium">{t('nav.currentCourses')}</span>}
                </button>
              )}

              {/* Schedule - Student & Lecturer Only */}
              {(instituteData.userType === 'student' || instituteData.userType === 'lecturer') && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (sidebarTimeoutRef.current) {
                      clearTimeout(sidebarTimeoutRef.current);
                    }
                    /* UNCOMMENT FOR PRODUCTION - Verification Check
                    if (!instituteData.isVerified) {
                      setShowVerificationPopup(true);
                      return;
                    }
                    */
                    const targetPath = instituteData.userType === 'student' ? '/student/schedule' : '/lecturer/schedule';
                    navigate(targetPath);
                  }}
                  onMouseEnter={() => {
                    if (sidebarTimeoutRef.current) {
                      clearTimeout(sidebarTimeoutRef.current);
                    }
                    setIsSidebarExpanded(true);
                  }}
                  className={`w-full flex items-center ${isSidebarExpanded ? 'gap-3' : 'justify-center'} px-4 py-3 rounded-lg transition-all text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-navy-700`}
                  title={t('nav.schedule')}
                >
                  <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"/>
                  </svg>
                  {isSidebarExpanded && <span className="font-medium">{t('nav.schedule')}</span>}
                </button>
              )}

              {/* Dashboard - Institution Only */}
              {isInstitution && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (sidebarTimeoutRef.current) {
                      clearTimeout(sidebarTimeoutRef.current);
                    }
                    navigate('/dashboard');
                  }}
                  onMouseEnter={() => {
                    if (sidebarTimeoutRef.current) {
                      clearTimeout(sidebarTimeoutRef.current);
                    }
                    setIsSidebarExpanded(true);
                  }}
                  className={`w-full flex items-center ${isSidebarExpanded ? 'gap-3' : 'justify-center'} px-4 py-3 rounded-lg transition-all text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-navy-700`}
                  title={t('nav.dashboard')}
                >
                  <FaTachometerAlt className="w-5 h-5 flex-shrink-0" />
                  {isSidebarExpanded && <span className="font-medium">{t('nav.dashboard')}</span>}
                </button>
              )}

              {/* Explore - Active */}
              <button
                type="button"
                className={`w-full flex items-center ${isSidebarExpanded ? 'gap-3' : 'justify-center'} px-4 py-3 rounded-lg transition-all bg-primary-600 text-white`}
                title={t('feed.explore')}
              >
                <FaCompass className="w-5 h-5 flex-shrink-0" />
                {isSidebarExpanded && <span className="font-medium">{t('feed.explore')}</span>}
              </button>

              {/* Profile - All Authenticated Users */}
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (sidebarTimeoutRef.current) {
                    clearTimeout(sidebarTimeoutRef.current);
                  }
                  setShowProfileModal(true);
                }}
                onMouseEnter={() => {
                  if (sidebarTimeoutRef.current) {
                    clearTimeout(sidebarTimeoutRef.current);
                  }
                  setIsSidebarExpanded(true);
                }}
                className={`w-full flex items-center ${isSidebarExpanded ? 'gap-3' : 'justify-center'} px-4 py-3 rounded-lg transition-all text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-navy-700`}
                title={t('nav.profile') || 'Profile'}
              >
                <FaUser className="w-5 h-5 flex-shrink-0" />
                {isSidebarExpanded && <span className="font-medium">{t('nav.profile') || 'Profile'}</span>}
              </button>
            </div>
          )}

          {/* Guest Navigation */}
          {!instituteData.isAuthenticated && (
            <div className="space-y-2 mb-6">
              <button
                type="button"
                className={`w-full flex items-center ${isSidebarExpanded ? 'gap-3' : 'justify-center'} px-4 py-3 rounded-lg transition-all bg-primary-600 text-white`}
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
              className={`fixed left-0 top-0 bottom-0 w-80 shadow-2xl z-50 lg:hidden overflow-y-auto bg-white dark:bg-navy-800 ${
                isLecturer ? 'border-l-2 border-l-purple-400/30 dark:border-l-purple-500/20' : ''
              }`}
            >
              <div className="p-6">
                {/* Mobile Sidebar Header */}
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                    {t('feed.explore')}
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
                <div className="flex-1">
                {/* Back Button */}
                <motion.button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsMobileSidebarOpen(false);
                    navigate('/feed');
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-navy-700 mb-6"
                  whileTap={{ scale: 0.95 }}
                >
                  <FaArrowLeft className="w-5 h-5 flex-shrink-0" />
                  <span className="font-medium">{t('common.back')}</span>
                </motion.button>

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
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setIsMobileSidebarOpen(false);
                          navigate('/login');
                        }}
                        className="w-full px-3 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-lg text-sm font-semibold transition-colors"
                      >
                        {t('nav.login')}
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setIsMobileSidebarOpen(false);
                          navigate('/home');
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
                    {(instituteData.userType === 'student' || instituteData.userType === 'lecturer') && (
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          /* UNCOMMENT FOR PRODUCTION - Verification Check
                          if (!instituteData.isVerified) {
                            setShowVerificationPopup(true);
                            setIsMobileSidebarOpen(false);
                            return;
                          }
                          */
                          setIsMobileSidebarOpen(false);
                          if (instituteData.userType === 'student') {
                            navigate('/student/courses');
                          } else {
                            navigate('/lecturer/courses');
                          }
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-navy-700"
                      >
                        <FaBook className="w-5 h-5 flex-shrink-0" />
                        <span className="font-medium">{t('nav.currentCourses')}</span>
                      </button>
                    )}

                    {(instituteData.userType === 'student' || instituteData.userType === 'lecturer') && (
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          /* UNCOMMENT FOR PRODUCTION - Verification Check
                          if (!instituteData.isVerified) {
                            setShowVerificationPopup(true);
                            setIsMobileSidebarOpen(false);
                            return;
                          }
                          */
                          setIsMobileSidebarOpen(false);
                          if (instituteData.userType === 'student') {
                            navigate('/student/schedule');
                          } else {
                            navigate('/lecturer/schedule');
                          }
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-navy-700"
                      >
                        <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"/>
                        </svg>
                        <span className="font-medium">{t('nav.schedule')}</span>
                      </button>
                    )}

                    {isInstitution && (
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setIsMobileSidebarOpen(false);
                          navigate('/dashboard');
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-navy-700"
                      >
                        <FaTachometerAlt className="w-5 h-5 flex-shrink-0" />
                        <span className="font-medium">{t('nav.dashboard')}</span>
                      </button>
                    )}

                    <button
                      onClick={() => {
                        navigate('/explore');
                        setIsMobileSidebarOpen(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all bg-primary-600 text-white"
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
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all bg-primary-600 text-white"
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
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className={`flex-1 transition-all duration-300 ${isSidebarExpanded ? 'lg:ml-80' : 'lg:ml-20'}`}>
        {/* Navigation Bar */}
        <nav className={`shadow-lg sticky top-0 z-50 transition-colors bg-white dark:bg-navy-800 ${
          isLecturer ? 'border-b-2 border-b-purple-400/20 dark:border-b-purple-500/15' : ''
        }`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className={`flex ${isRTL ? 'flex-row-reverse' : 'flex-row'} justify-between items-center h-16 ${isRTL ? 'gap-4' : 'gap-4'}`}>
              {/* Logo - Clickable on Mobile to Open Sidebar */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-3 cursor-pointer"
                onClick={() => {
                  if (window.innerWidth < 1024) {
                    setIsMobileSidebarOpen(true);
                  } else {
                    navigate('/feed');
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
                {/* Search Bar */}
                <div className={`hidden md:flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-navy-700 rounded-lg border border-gray-300 dark:border-navy-600 transition-colors ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <FaSearch className={`text-gray-400 dark:text-gray-500 ${isRTL ? 'order-2' : ''}`} />
                  <input
                    type="text"
                    placeholder={t('feed.searchPlaceholder')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`bg-transparent outline-none text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 w-48 lg:w-64 ${isRTL ? 'text-right' : 'text-left'}`}
                  />
                  {searchQuery && (
                    <motion.button
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      onClick={() => setSearchQuery('')}
                      className={`p-1 rounded hover:bg-gray-200 dark:hover:bg-navy-600 transition-colors ${isRTL ? 'order-3' : ''}`}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </motion.button>
                  )}
                </div>

                {/* Mobile Search Button */}
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-navy-700 transition-colors"
                  onClick={() => {
                    const searchInput = document.getElementById('mobile-search-input');
                    if (searchInput) {
                      searchInput.focus();
                    }
                  }}
                >
                  <FaSearch className="text-gray-600 dark:text-gray-400 text-xl" />
                </motion.button>


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
                                  className={`p-4 border-b border-gray-100 dark:border-navy-700 hover:bg-gray-50 dark:hover:bg-navy-900 transition-colors cursor-pointer ${
                                    !notification.read ? 'bg-primary-50 dark:bg-primary-900/20' : ''
                                  }`}
                                  onClick={() => setShowNotifications(false)}
                                >
                                  <div className={`flex items-start gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                                    <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                                      !notification.read ? 'bg-primary-600' : 'bg-transparent'
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
                        <div className="w-8 h-8 bg-gradient-to-br from-primary-600 to-teal-500 rounded-full flex items-center justify-center">
                          <span className="text-white font-bold text-sm">
                            {(username || instituteData.username || instituteData.name)?.[0]?.toUpperCase() || 'U'}
                          </span>
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
                                {username || instituteData.username || instituteData.name}
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
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {instituteData.email}
                            </p>
                            <p className="text-xs text-gray-400 dark:text-gray-500 capitalize mt-1">
                              {instituteData.userType}
                            </p>
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

        {/* Main Content Area */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Mobile Search Bar */}
          <div className="md:hidden mb-6">
            <div className={`flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-navy-700 rounded-lg border border-gray-300 dark:border-navy-600 transition-colors ${isRTL ? 'flex-row-reverse' : ''}`}>
              <FaSearch className={`text-gray-400 dark:text-gray-500 ${isRTL ? 'order-2' : ''}`} />
              <input
                id="mobile-search-input"
                type="text"
                placeholder={t('feed.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`flex-1 bg-transparent outline-none text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 ${isRTL ? 'text-right' : 'text-left'}`}
              />
              {searchQuery && (
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  onClick={() => setSearchQuery('')}
                  className={`p-1 rounded hover:bg-gray-200 dark:hover:bg-navy-600 transition-colors ${isRTL ? 'order-3' : ''}`}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </motion.button>
              )}
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="mb-8">
            <div className="flex flex-wrap gap-2 border-b border-gray-200 dark:border-navy-700">
              {/* All Tab - Default */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveTab('all')}
                className={`px-6 py-3 font-semibold text-sm transition-all relative ${
                  activeTab === 'all'
                    ? 'text-primary-600 dark:text-teal-400'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <FaCompass className="w-5 h-5" />
                  <span>{t('feed.all') || 'All'}</span>
                </div>
                {activeTab === 'all' && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600 dark:bg-teal-400"
                  />
                )}
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveTab('students')}
                className={`px-6 py-3 font-semibold text-sm transition-all relative ${
                  activeTab === 'students'
                    ? 'text-primary-600 dark:text-teal-400'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <FaUserGraduate className="w-5 h-5" />
                  <span>{t('feed.students')}</span>
                </div>
                {activeTab === 'students' && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600 dark:bg-teal-400"
                  />
                )}
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveTab('lecturers')}
                className={`px-6 py-3 font-semibold text-sm transition-all relative ${
                  activeTab === 'lecturers'
                    ? 'text-primary-600 dark:text-teal-400'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <FaChalkboardTeacher className="w-5 h-5" />
                  <span>{t('feed.lecturers')}</span>
                </div>
                {activeTab === 'lecturers' && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600 dark:bg-teal-400"
                  />
                )}
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveTab('positions')}
                className={`px-6 py-3 font-semibold text-sm transition-all relative ${
                  activeTab === 'positions'
                    ? 'text-primary-600 dark:text-teal-400'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <FaBriefcase className="w-5 h-5" />
                  <span>{t('feed.lookingForJob')}</span>
                </div>
                {activeTab === 'positions' && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600 dark:bg-teal-400"
                  />
                )}
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveTab('courses')}
                className={`px-6 py-3 font-semibold text-sm transition-all relative ${
                  activeTab === 'courses'
                    ? 'text-primary-600 dark:text-teal-400'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <FaBook className="w-5 h-5" />
                  <span>{t('feed.exploreCourses') || 'Courses'}</span>
                </div>
                {activeTab === 'courses' && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600 dark:bg-teal-400"
                  />
                )}
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveTab('institutions')}
                className={`px-6 py-3 font-semibold text-sm transition-all relative ${
                  activeTab === 'institutions'
                    ? 'text-primary-600 dark:text-teal-400'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <FaUniversity className="w-5 h-5" />
                  <span>{t('feed.institutions') || 'Institutions+'}</span>
                </div>
                {activeTab === 'institutions' && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600 dark:bg-teal-400"
                  />
                )}
              </motion.button>
            </div>
          </div>

          {/* Tab Content */}
          <div className="mt-8">
            {/* Loading State */}
            {isLoadingSearch && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12"
              >
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 dark:border-teal-400"></div>
                <p className="mt-4 text-gray-600 dark:text-gray-400">{t('common.loading')}</p>
              </motion.div>
            )}

            {/* Error State */}
            {searchError && !isLoadingSearch && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12"
              >
                <p className="text-red-600 dark:text-red-400 mb-4">{searchError}</p>
              </motion.div>
            )}

            {/* All Tab - Mixed Results */}
            {!isLoadingSearch && !searchError && activeTab === 'all' && (
              <>
                {allResults.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center py-12"
                  >
                    <FaCompass className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400 text-lg">
                      {searchQuery ? t('feed.noResultsFound') || 'No results found' : t('feed.noResults') || 'No results available'}
                    </p>
                    {searchQuery && (
                      <p className="text-gray-500 dark:text-gray-500 text-sm mt-2">
                        {t('feed.tryDifferentSearch')}
                      </p>
                    )}
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-8"
                  >
                    {/* Mixed Results from API */}
                    {allResults.length > 0 && (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {allResults.filter(item => item && item.id).map((item, index) => {
                          if (item.itemType === 'student') {
                            // Default avatar for students without profile image
                            const defaultStudentAvatar = 'data:image/svg+xml,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="#6366f1" width="100" height="100"/><text x="50" y="55" font-family="Arial" font-size="40" fill="white" text-anchor="middle" dominant-baseline="middle">${(item.name || item.username || 'S').charAt(0).toUpperCase()}</text></svg>`);
                            const studentImage = item.profile_image ? getImageUrl(item.profile_image) : (item.image ? getImageUrl(item.image) : defaultStudentAvatar);
                            
                            return (
                              <motion.div
                                key={`student-${item.id}`}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                onClick={() => handleViewProfile(item, 'student')}
                                className="bg-white dark:bg-navy-800 rounded-lg shadow-md border border-gray-200 dark:border-navy-700 p-6 hover:shadow-xl transition-all cursor-pointer"
                              >
                                <div className="flex items-start gap-4 mb-4">
                                  <img
                                    src={studentImage}
                                    alt={item.name || item.username}
                                    className="w-16 h-16 rounded-full object-cover border-2 border-primary-200 dark:border-primary-800"
                                    onError={(e) => { e.target.src = defaultStudentAvatar; }}
                                  />
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <h3 className="font-bold text-gray-800 dark:text-white">{item.name || item.username}</h3>
                                      {item.is_verified && (
                                        <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-full text-xs font-semibold">✓</span>
                                      )}
                                    </div>
                                    {(item.studying_level || item.major) && (
                                      <p className="text-sm text-primary-600 dark:text-teal-400 mb-1">
                                        {t(`profile.${item.studying_level}`) || item.studying_level || item.major}
                                      </p>
                                    )}
                                    {item.city && (
                                      <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-500">
                                        <FaMapMarkerAlt className="w-3 h-3" />
                                        <span>{item.city}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                {(item.bio || item.about) && (
                                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">{item.bio || item.about}</p>
                                )}
                              </motion.div>
                            );
                          } else if (item.itemType === 'lecturer') {
                            // Default avatar for lecturers without profile image
                            const defaultLecturerAvatar = 'data:image/svg+xml,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="#0d9488" width="100" height="100"/><text x="50" y="55" font-family="Arial" font-size="40" fill="white" text-anchor="middle" dominant-baseline="middle">${(item.name || item.username || 'L').charAt(0).toUpperCase()}</text></svg>`);
                            const lecturerImage = item.profile_image ? getImageUrl(item.profile_image) : (item.image ? getImageUrl(item.image) : defaultLecturerAvatar);
                            
                            return (
                              <motion.div
                                key={`lecturer-${item.id}`}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="bg-white dark:bg-navy-800 rounded-lg shadow-md border border-gray-200 dark:border-navy-700 p-6 hover:shadow-xl transition-all"
                              >
                                <div 
                                  onClick={() => handleViewProfile(item, 'lecturer')}
                                  className="cursor-pointer"
                                >
                                  <div className="flex items-start gap-4 mb-4">
                                    <img
                                      src={lecturerImage}
                                      alt={item.name || item.username}
                                      className="w-16 h-16 rounded-full object-cover border-2 border-primary-200 dark:border-primary-800"
                                      onError={(e) => { e.target.src = defaultLecturerAvatar; }}
                                    />
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-1">
                                        <h3 className="font-bold text-gray-800 dark:text-white">{item.name || item.username}</h3>
                                        {item.is_verified && (
                                          <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-full text-xs font-semibold">✓</span>
                                        )}
                                      </div>
                                      {item.specialty && (
                                        <p className="text-sm text-primary-600 dark:text-teal-400 mb-1">{item.specialty}</p>
                                      )}
                                      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-500">
                                        {item.city && (
                                          <div className="flex items-center gap-1">
                                            <FaMapMarkerAlt className="w-3 h-3" />
                                            <span>{item.city}</span>
                                          </div>
                                        )}
                                        {item.institutions && item.institutions.length > 0 && (
                                          <span>• {item.institutions.join(', ')}</span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                  {(item.bio || item.about) && (
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">{item.bio || item.about}</p>
                                  )}
                                </div>
                                {/* Mark Button - Only for Institution Users */}
                                {isInstitution && instituteData.isVerified && (
                                  <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={async (e) => {
                                      e.stopPropagation();
                                      if (!item.id) {
                                        toast.error(t('feed.lecturerIdNotFound') || 'Lecturer ID not found');
                                        return;
                                      }
                                      if (!instituteData.accessToken) {
                                        toast.error(t('common.sessionExpired') || 'Session expired. Please log in again.');
                                        return;
                                      }
                                      
                                      const isMarked = markedLecturers.has(item.id);
                                      
                                      setMarkingLecturer(item.id);
                                      try {
                                        let response;
                                        if (isMarked) {
                                          // Unmark lecturer
                                          response = await authService.removeMarkedLecturer(
                                            instituteData.accessToken,
                                            item.id,
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
                                            toast.success(response.message || t('feed.lecturerUnmarked') || 'Lecturer removed from marked list');
                                            setMarkedLecturers(prev => {
                                              const newSet = new Set(prev);
                                              newSet.delete(item.id);
                                              return newSet;
                                            });
                                          } else {
                                            toast.error(response?.message || t('feed.failedToUnmarkLecturer') || 'Failed to unmark lecturer');
                                          }
                                        } else {
                                          // Mark lecturer
                                          response = await authService.markLecturer(
                                            instituteData.accessToken,
                                            item.id,
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
                                            toast.success(response.message || t('feed.lecturerMarked') || 'Lecturer marked successfully!');
                                            setMarkedLecturers(prev => new Set([...prev, item.id]));
                                          } else {
                                            toast.error(response?.message || t('feed.failedToMarkLecturer') || 'Failed to mark lecturer');
                                          }
                                        }
                                      } catch (error) {
                                        console.error('Error marking/unmarking lecturer:', error);
                                        toast.error(error?.message || error?.data?.message || (isMarked ? t('feed.failedToUnmarkLecturer') : t('feed.failedToMarkLecturer')) || 'Failed to update lecturer status');
                                      } finally {
                                        setMarkingLecturer(null);
                                      }
                                    }}
                                    disabled={markingLecturer === item.id}
                                    className={`w-full mt-3 px-4 py-2 rounded-lg font-semibold text-sm transition-colors flex items-center justify-center gap-2 ${
                                      markedLecturers.has(item.id)
                                        ? 'bg-green-600 hover:bg-green-500 text-white'
                                        : 'bg-primary-600 hover:bg-primary-500 text-white'
                                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                                  >
                                    {markingLecturer === item.id ? (
                                      <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        <span>{markedLecturers.has(item.id) ? (t('feed.unmarking') || 'Unmarking...') : (t('feed.marking') || 'Marking...')}</span>
                                      </>
                                    ) : markedLecturers.has(item.id) ? (
                                      <>
                                        <FaBookmark className="w-4 h-4" />
                                        <span>{t('feed.marked') || 'Marked'}</span>
                                      </>
                                    ) : (
                                      <>
                                        <FaBookmark className="w-4 h-4" />
                                        <span>{t('feed.mark') || 'Mark'}</span>
                                      </>
                                    )}
                                  </motion.button>
                                )}
                              </motion.div>
                            );
                          } else if (item.itemType === 'job') {
                            // Default avatar for job publisher - use first letter of institution name
                            const institutionName = item.institution || item.publisher_username || 'J';
                            const defaultJobAvatar = 'data:image/svg+xml,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="#8b5cf6" width="100" height="100"/><text x="50" y="55" font-family="Arial" font-size="40" fill="white" text-anchor="middle" dominant-baseline="middle">${institutionName.charAt(0).toUpperCase()}</text></svg>`);
                            const publisherImage = item.publisher_profile_image ? getImageUrl(item.publisher_profile_image) : defaultJobAvatar;
                            
                            return (
                              <motion.div
                                key={`job-${item.id}`}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                onClick={() => handleViewJob(item)}
                                className="bg-white dark:bg-navy-800 rounded-lg shadow-md border border-gray-200 dark:border-navy-700 p-6 hover:shadow-xl transition-all cursor-pointer"
                              >
                                <div className="flex items-start gap-4 mb-4">
                                  <img
                                    src={publisherImage}
                                    alt={item.institution || item.publisher_username}
                                    className="w-12 h-12 rounded-full object-cover border-2 border-purple-200 dark:border-purple-800"
                                    onError={(e) => { e.target.src = defaultJobAvatar; }}
                                  />
                                  <div className="flex-1">
                                    <h3 className="font-bold text-gray-800 dark:text-white mb-1 text-lg">{item.title}</h3>
                                    {item.institution && (
                                      <div className="flex items-center gap-2 mb-1">
                                        <FaUniversity className="text-primary-600 dark:text-teal-400 w-3 h-3" />
                                        <span className="text-sm text-primary-600 dark:text-teal-400 font-medium">{item.institution}</span>
                                      </div>
                                    )}
                                    {item.city && (
                                      <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-500">
                                        <FaMapMarkerAlt className="w-3 h-3" />
                                        <span>{item.city}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                {item.description && (
                                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-3">
                                    {item.description}
                                  </p>
                                )}
                                {/* Apply Button - For lecturers only (not for institutions) */}
                                {instituteData.isAuthenticated && 
                                 instituteData.userType === 'lecturer' && (
                                  <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (!instituteData.isVerified) {
                                        setShowVerificationPopup(true);
                                      } else {
                                        setSelectedJob(item);
                                        setShowApplyJobModal(true);
                                      }
                                    }}
                                    className="w-full px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-lg transition-colors font-semibold text-sm"
                                  >
                                    {t('feed.applyJob') || 'Apply'}
                                  </motion.button>
                                )}
                              </motion.div>
                            );
                          } else if (item.itemType === 'institution_job') {
                            // Default avatar for institution job
                            const defaultInstJobAvatar = 'data:image/svg+xml,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="#8b5cf6" width="100" height="100"/><text x="50" y="55" font-family="Arial" font-size="40" fill="white" text-anchor="middle" dominant-baseline="middle">${(item.institution_username || 'J').charAt(0).toUpperCase()}</text></svg>`);
                            const instJobImage = item.publisher_profile_image ? getImageUrl(item.publisher_profile_image) : defaultInstJobAvatar;
                            
                            return (
                              <motion.div
                                key={`institution-job-${item.id}`}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                onClick={() => handleViewJob(item)}
                                className="bg-white dark:bg-navy-800 rounded-lg shadow-md border border-gray-200 dark:border-navy-700 p-6 hover:shadow-xl transition-all cursor-pointer"
                              >
                                <div className="flex items-start gap-4 mb-4">
                                  <img
                                    src={instJobImage}
                                    alt={item.institution_username}
                                    className="w-12 h-12 rounded-full object-cover border-2 border-purple-200 dark:border-purple-800"
                                    onError={(e) => { e.target.src = defaultInstJobAvatar; }}
                                  />
                                  <div className="flex-1">
                                    <h3 className="font-bold text-gray-800 dark:text-white mb-1 text-lg">{item.title}</h3>
                                    {item.institution_username && (
                                      <div className="flex items-center gap-2 mb-1">
                                        <FaUniversity className="text-primary-600 dark:text-teal-400 w-3 h-3" />
                                        <span className="text-sm text-primary-600 dark:text-teal-400 font-medium">{item.institution_username}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                {item.description && (
                                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-3">
                                    {item.description}
                                  </p>
                                )}
                                {/* Apply Button - For lecturers only (not for institutions) */}
                                {instituteData.isAuthenticated && 
                                 instituteData.userType === 'lecturer' && (
                                  <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (!instituteData.isVerified) {
                                        setShowVerificationPopup(true);
                                      } else {
                                        setSelectedJob(item);
                                        setShowApplyJobModal(true);
                                      }
                                    }}
                                    className="w-full px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-lg transition-colors font-semibold text-sm"
                                  >
                                    {t('feed.applyJob') || 'Apply'}
                                  </motion.button>
                                )}
                              </motion.div>
                            );
                          } else if (item.itemType === 'institution') {
                            return (
                              <motion.div
                                key={`institution-${item.id || item.username}`}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                onClick={() => handleViewProfile(item, 'institution')}
                                className="bg-white dark:bg-navy-800 rounded-lg shadow-md border border-gray-200 dark:border-navy-700 p-6 hover:shadow-xl transition-all cursor-pointer"
                              >
                                <div className="flex items-start gap-4 mb-4">
                                  <img
                                    src={getImageUrl(item.profile_image || item.image) || 'https://i.pravatar.cc/150?img=12'}
                                    alt={item.title || item.name || item.username}
                                    className="w-16 h-16 rounded-full object-cover border-2 border-primary-200 dark:border-primary-800"
                                  />
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <h3 className="font-bold text-gray-800 dark:text-white">{item.title || item.name || item.username}</h3>
                                    </div>
                                    <p className="text-sm text-primary-600 dark:text-teal-400 mb-1">{item.username}</p>
                                    {item.location && (
                                      <p className="text-xs text-gray-500 dark:text-gray-500">{item.location}</p>
                                    )}
                                  </div>
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">{item.about || item.bio}</p>
                                {item.city && (
                                  <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-500">
                                    <FaMapMarkerAlt className="w-3 h-3" />
                                    <span>{item.city}</span>
                                  </div>
                                )}
                              </motion.div>
                            );
                          } else if (item.itemType === 'course') {
                            return (
                              <motion.div
                                key={`course-${item.id}`}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                onClick={() => handleViewCourse(item)}
                                className="bg-white dark:bg-navy-800 rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow cursor-pointer"
                              >
                                <div className="relative h-32 overflow-hidden bg-gradient-to-br from-primary-100 to-teal-100 dark:from-primary-900 dark:to-teal-900">
                                  {(item.course_image || item.publisher_profile_image) && (
                                    <img
                                      src={getImageUrl(item.course_image || item.publisher_profile_image)}
                                      alt={item.title}
                                      className="w-full h-full object-cover"
                                      onError={(e) => {
                                        e.target.style.display = 'none';
                                      }}
                                    />
                                  )}
                                </div>
                                <div className="p-4">
                                  <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-1 line-clamp-2">
                                    {item.title}
                                  </h3>
                                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                    {item.institution && (
                                      <>
                                        <FaUniversity className="inline w-3 h-3 mr-1" />
                                        {item.institution}
                                      </>
                                    )}
                                    {item.city && (
                                      <>
                                        {item.institution && ' • '}
                                        <FaMapMarkerAlt className="inline w-3 h-3 mr-1" />
                                        {item.city}
                                      </>
                                    )}
                                  </p>
                                  {item.about && (
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                                      {item.about}
                                    </p>
                                  )}
                                  {item.publisher_username && (
                                    <p className="text-xs text-gray-500 dark:text-gray-500 mb-3">
                                      @{item.publisher_username}
                                    </p>
                                  )}
                                  {/* Buttons */}
                                  <div className="flex gap-2">
                                    {/* Progress button - always visible */}
                                    <motion.button
                                      whileHover={{ scale: 1.02 }}
                                      whileTap={{ scale: 0.98 }}
                                      onClick={(e) => handleViewProgress(item, e)}
                                      className="px-3 py-2 bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-400 rounded-lg transition-colors font-medium text-sm flex items-center gap-1"
                                    >
                                      <FaChartLine className="text-sm" />
                                      <span>{t('feed.progress') || 'Progress'}</span>
                                    </motion.button>
                                    {/* Enroll button for verified students */}
                                    {instituteData.isAuthenticated && instituteData.userType === 'student' && (
                                      <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={(e) => handleEnrollCourse(item, e)}
                                        disabled={enrollingCourseId === item.id}
                                        className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-lg transition-colors font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                      >
                                        {enrollingCourseId === item.id ? (
                                          <>
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            <span>{t('feed.enrolling') || 'Enrolling...'}</span>
                                          </>
                                        ) : (
                                          <span>{t('feed.enroll') || 'Enroll'}</span>
                                        )}
                                      </motion.button>
                                    )}
                                  </div>
                                </div>
                              </motion.div>
                            );
                          }
                          return null;
                        })}
                      </div>
                    )}
                  </motion.div>
                )}
              </>
            )}

            {/* Students Tab */}
            {!isLoadingSearch && !searchError && activeTab === 'students' && (
              <>
                {students.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center py-12"
                  >
                    <FaUserGraduate className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400 text-lg">
                      {searchQuery ? t('feed.noStudentsFound') : t('feed.noStudents')}
                    </p>
                    {searchQuery && (
                      <p className="text-gray-500 dark:text-gray-500 text-sm mt-2">
                        {t('feed.tryDifferentSearch')}
                      </p>
                    )}
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                  >
                    {students.map((student, index) => {
                      // Default avatar for students without profile image
                      const defaultStudentAvatarTab = 'data:image/svg+xml,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="#6366f1" width="100" height="100"/><text x="50" y="55" font-family="Arial" font-size="40" fill="white" text-anchor="middle" dominant-baseline="middle">${(student.name || student.username || 'S').charAt(0).toUpperCase()}</text></svg>`);
                      const studentImgTab = student.profile_image ? getImageUrl(student.profile_image) : (student.image ? getImageUrl(student.image) : defaultStudentAvatarTab);
                      
                      return (
                        <motion.div
                          key={student.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          onClick={() => handleViewProfile(student, 'student')}
                          className="bg-white dark:bg-navy-800 rounded-lg shadow-md border border-gray-200 dark:border-navy-700 p-6 hover:shadow-xl transition-all cursor-pointer"
                        >
                          <div className="flex items-start gap-4 mb-4">
                            <img
                              src={studentImgTab}
                              alt={student.name || student.username}
                              className="w-16 h-16 rounded-full object-cover border-2 border-primary-200 dark:border-primary-800"
                              onError={(e) => { e.target.src = defaultStudentAvatarTab; }}
                            />
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-bold text-gray-800 dark:text-white">
                                  {student.name || student.username}
                                </h3>
                                {student.is_verified && (
                                  <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-full text-xs font-semibold">
                                    ✓
                                  </span>
                                )}
                              </div>
                              {(student.studying_level || student.major) && (
                                <p className="text-sm text-primary-600 dark:text-teal-400 mb-1">
                                  {t(`profile.${student.studying_level}`) || student.studying_level || student.major}
                                </p>
                              )}
                              {student.city && (
                                <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-500">
                                  <FaMapMarkerAlt className="w-3 h-3" />
                                  <span>{student.city}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          {(student.bio || student.about) && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                              {student.bio || student.about}
                            </p>
                          )}
                        </motion.div>
                      );
                    })}
                  </motion.div>
                )}
              </>
            )}

            {/* Lecturers Tab */}
            {!isLoadingSearch && !searchError && activeTab === 'lecturers' && (
              <>
                {lecturers.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center py-12"
                  >
                    <FaChalkboardTeacher className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400 text-lg">
                      {searchQuery ? t('feed.noLecturersFound') : t('feed.noLecturers')}
                    </p>
                    {searchQuery && (
                      <p className="text-gray-500 dark:text-gray-500 text-sm mt-2">
                        {t('feed.tryDifferentSearch')}
                      </p>
                    )}
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                  >
                    {lecturers.filter(lecturer => lecturer && lecturer.id).map((lecturer, index) => {
                      // Default avatar for lecturers without profile image
                      const defaultLecturerAvatarTab = 'data:image/svg+xml,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="#0d9488" width="100" height="100"/><text x="50" y="55" font-family="Arial" font-size="40" fill="white" text-anchor="middle" dominant-baseline="middle">${(lecturer.name || lecturer.username || 'L').charAt(0).toUpperCase()}</text></svg>`);
                      const lecturerImgTab = lecturer.profile_image ? getImageUrl(lecturer.profile_image) : (lecturer.image ? getImageUrl(lecturer.image) : defaultLecturerAvatarTab);
                      
                      return (
                        <motion.div
                          key={lecturer.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="bg-white dark:bg-navy-800 rounded-lg shadow-md border border-gray-200 dark:border-navy-700 p-6 hover:shadow-xl transition-all"
                        >
                          <div 
                            onClick={() => handleViewProfile(lecturer, 'lecturer')}
                            className="cursor-pointer"
                          >
                            <div className="flex items-start gap-4 mb-4">
                              <img
                                src={lecturerImgTab}
                                alt={lecturer.name || lecturer.username}
                                className="w-16 h-16 rounded-full object-cover border-2 border-primary-200 dark:border-primary-800"
                                onError={(e) => { e.target.src = defaultLecturerAvatarTab; }}
                              />
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className="font-bold text-gray-800 dark:text-white">
                                    {lecturer.name || lecturer.username}
                                  </h3>
                                  {lecturer.is_verified && (
                                    <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-full text-xs font-semibold">
                                      ✓
                                    </span>
                                  )}
                                </div>
                                {lecturer.specialty && (
                                  <p className="text-sm text-primary-600 dark:text-teal-400 mb-1">
                                    {lecturer.specialty}
                                  </p>
                                )}
                                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-500">
                                  {lecturer.city && (
                                    <div className="flex items-center gap-1">
                                      <FaMapMarkerAlt className="w-3 h-3" />
                                      <span>{lecturer.city}</span>
                                    </div>
                                  )}
                                  {lecturer.institutions && lecturer.institutions.length > 0 && (
                                    <span>• {lecturer.institutions.join(', ')}</span>
                                  )}
                                </div>
                              </div>
                            </div>
                            {(lecturer.bio || lecturer.about) && (
                              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                                {lecturer.bio || lecturer.about}
                              </p>
                            )}
                          </div>
                    {/* Mark Button - Only for Institution Users */}
                    {isInstitution && instituteData.isVerified && (
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={async (e) => {
                          e.stopPropagation();
                          if (!lecturer.id) {
                            toast.error(t('feed.lecturerIdNotFound') || 'Lecturer ID not found');
                            return;
                          }
                          if (!instituteData.accessToken) {
                            toast.error(t('common.sessionExpired') || 'Session expired. Please log in again.');
                            return;
                          }
                          
                          const isMarked = markedLecturers.has(lecturer.id);
                          
                          setMarkingLecturer(lecturer.id);
                          try {
                            let response;
                            if (isMarked) {
                              // Unmark lecturer
                              response = await authService.removeMarkedLecturer(
                                instituteData.accessToken,
                                lecturer.id,
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
                                toast.success(response.message || t('feed.lecturerUnmarked') || 'Lecturer removed from marked list');
                                setMarkedLecturers(prev => {
                                  const newSet = new Set(prev);
                                  newSet.delete(lecturer.id);
                                  return newSet;
                                });
                              } else {
                                toast.error(response?.message || t('feed.failedToUnmarkLecturer') || 'Failed to unmark lecturer');
                              }
                            } else {
                              // Mark lecturer
                              response = await authService.markLecturer(
                                instituteData.accessToken,
                                lecturer.id,
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
                                toast.success(response.message || t('feed.lecturerMarked') || 'Lecturer marked successfully!');
                                setMarkedLecturers(prev => new Set([...prev, lecturer.id]));
                              } else {
                                toast.error(response?.message || t('feed.failedToMarkLecturer') || 'Failed to mark lecturer');
                              }
                            }
                          } catch (error) {
                            console.error('Error marking/unmarking lecturer:', error);
                            toast.error(error?.message || error?.data?.message || (isMarked ? t('feed.failedToUnmarkLecturer') : t('feed.failedToMarkLecturer')) || 'Failed to update lecturer status');
                          } finally {
                            setMarkingLecturer(null);
                          }
                        }}
                        disabled={markingLecturer === lecturer.id}
                        className={`w-full mt-3 px-4 py-2 rounded-lg font-semibold text-sm transition-colors flex items-center justify-center gap-2 ${
                          markedLecturers.has(lecturer.id)
                            ? 'bg-green-600 hover:bg-green-500 text-white'
                            : 'bg-primary-600 hover:bg-primary-500 text-white'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        {markingLecturer === lecturer.id ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            <span>{markedLecturers.has(lecturer.id) ? (t('feed.unmarking') || 'Unmarking...') : (t('feed.marking') || 'Marking...')}</span>
                          </>
                        ) : markedLecturers.has(lecturer.id) ? (
                          <>
                            <FaBookmark className="w-4 h-4" />
                            <span>{t('feed.marked') || 'Marked'}</span>
                          </>
                        ) : (
                          <>
                            <FaBookmark className="w-4 h-4" />
                            <span>{t('feed.mark') || 'Mark'}</span>
                          </>
                        )}
                      </motion.button>
                    )}
                        </motion.div>
                      );
                    })}
                  </motion.div>
                )}
              </>
            )}

            {/* Positions Tab */}
            {!isLoadingSearch && !searchError && activeTab === 'positions' && (
              <>
                {positions.length === 0 && institutionJobPosts.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center py-12"
                  >
                    <FaBriefcase className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400 text-lg">
                      {searchQuery ? t('feed.noPositionsFound') : t('feed.noPositions')}
                    </p>
                    {searchQuery && (
                      <p className="text-gray-500 dark:text-gray-500 text-sm mt-2">
                        {t('feed.tryDifferentSearch')}
                      </p>
                    )}
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                  >
                    {/* Jobs from API */}
                    {positions.length > 0 && (
                      <div className="mb-8">
                        <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">{t('feed.jobPostings') || 'Job Postings'}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                          {positions.map((job, index) => {
                            // Default avatar for job - use first letter of institution name
                            const institutionName = job.institution || job.publisher_username || 'J';
                            const defaultJobAvatarTab = 'data:image/svg+xml,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="#8b5cf6" width="100" height="100"/><text x="50" y="55" font-family="Arial" font-size="40" fill="white" text-anchor="middle" dominant-baseline="middle">${institutionName.charAt(0).toUpperCase()}</text></svg>`);
                            const jobImgTab = job.publisher_profile_image ? getImageUrl(job.publisher_profile_image) : defaultJobAvatarTab;
                            
                            return (
                              <motion.div
                                key={`job-${job.id}`}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                onClick={() => handleViewJob(job)}
                                className="bg-white dark:bg-navy-800 rounded-lg shadow-md border border-gray-200 dark:border-navy-700 p-6 hover:shadow-xl transition-all cursor-pointer"
                              >
                                <div className="flex items-start gap-4 mb-4">
                                  <img
                                    src={jobImgTab}
                                    alt={job.institution || job.publisher_username}
                                    className="w-12 h-12 rounded-full object-cover border-2 border-purple-200 dark:border-purple-800"
                                    onError={(e) => { e.target.src = defaultJobAvatarTab; }}
                                  />
                                  <div className="flex-1">
                                    <h3 className="font-bold text-gray-800 dark:text-white mb-1 text-lg">{job.title}</h3>
                                    {job.institution && (
                                      <div className="flex items-center gap-2 mb-1">
                                        <FaUniversity className="text-primary-600 dark:text-teal-400 w-3 h-3" />
                                        <span className="text-sm text-primary-600 dark:text-teal-400 font-medium">{job.institution}</span>
                                      </div>
                                    )}
                                    {job.city && (
                                      <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-500">
                                        <FaMapMarkerAlt className="w-3 h-3" />
                                        <span>{job.city}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                {job.description && (
                                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-3">
                                    {job.description}
                                  </p>
                                )}
                                {/* Apply Button - For lecturers only (not for institutions) */}
                                {instituteData.isAuthenticated && 
                                 instituteData.userType === 'lecturer' && (
                                  <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (!instituteData.isVerified) {
                                        setShowVerificationPopup(true);
                                      } else {
                                        setSelectedJob(job);
                                        setShowApplyJobModal(true);
                                      }
                                    }}
                                    className="w-full px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-lg transition-colors font-semibold text-sm"
                                  >
                                    {t('feed.applyJob') || 'Apply'}
                                  </motion.button>
                                )}
                              </motion.div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    
                    {/* Institution Job Posts (from separate API) */}
                    {institutionJobPosts.length > 0 && (
                      <div className="mb-8">
                        <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">{t('feed.jobPostingsFromInstitutions') || 'Job Postings from Institutions'}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                          {institutionJobPosts.map((job, index) => {
                            // Default avatar for job
                            const institutionName = job.institution_username || job.institution || 'J';
                            const defaultJobAvatarTab = 'data:image/svg+xml,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="#8b5cf6" width="100" height="100"/><text x="50" y="55" font-family="Arial" font-size="40" fill="white" text-anchor="middle" dominant-baseline="middle">${institutionName.charAt(0).toUpperCase()}</text></svg>`);
                            const jobImgTab = job.publisher_profile_image ? getImageUrl(job.publisher_profile_image) : defaultJobAvatarTab;
                            
                            return (
                              <motion.div
                                key={`institution-job-${job.id}`}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                onClick={() => handleViewJob(job)}
                                className="bg-white dark:bg-navy-800 rounded-lg shadow-md border border-gray-200 dark:border-navy-700 p-6 hover:shadow-xl transition-all cursor-pointer"
                              >
                                <div className="flex items-start gap-4 mb-4">
                                  <img
                                    src={jobImgTab}
                                    alt={job.institution_username || job.institution}
                                    className="w-12 h-12 rounded-full object-cover border-2 border-purple-200 dark:border-purple-800"
                                    onError={(e) => { e.target.src = defaultJobAvatarTab; }}
                                  />
                                  <div className="flex-1">
                                    <h3 className="font-bold text-gray-800 dark:text-white mb-1 text-lg">{job.title}</h3>
                                    {(job.institution_username || job.institution) && (
                                      <div className="flex items-center gap-2 mb-1">
                                        <FaUniversity className="text-primary-600 dark:text-teal-400 w-3 h-3" />
                                        <span className="text-sm text-primary-600 dark:text-teal-400 font-medium">{job.institution_username || job.institution}</span>
                                      </div>
                                    )}
                                    {job.city && (
                                      <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-500">
                                        <FaMapMarkerAlt className="w-3 h-3" />
                                        <span>{job.city}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                {job.description && (
                                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-3">
                                    {job.description}
                                  </p>
                                )}
                                {/* Apply Button - For lecturers only (not for institutions) */}
                                {instituteData.isAuthenticated && 
                                 instituteData.userType === 'lecturer' && (
                                  <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (!instituteData.isVerified) {
                                        setShowVerificationPopup(true);
                                      } else {
                                        setSelectedJob(job);
                                        setShowApplyJobModal(true);
                                      }
                                    }}
                                    className="w-full px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-lg transition-colors font-semibold text-sm"
                                  >
                                    {t('feed.applyJob') || 'Apply'}
                                  </motion.button>
                                )}
                              </motion.div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </>
            )}

            {/* Courses Tab */}
            {!isLoadingSearch && !searchError && activeTab === 'institutions' && (
              <>
                {institutions.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center py-12"
                  >
                    <FaUniversity className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400 text-lg">
                      {t('feed.noInstitutionsFound') || 'No institutions found'}
                    </p>
                    {searchQuery && (
                      <p className="text-gray-500 dark:text-gray-500 text-sm mt-2">
                        {t('feed.tryDifferentSearch') || 'Try a different search term'}
                      </p>
                    )}
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                  >
                    {institutions.map((institution, index) => (
                      <motion.div
                        key={institution.id || institution.username}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={() => handleViewProfile(institution, 'institution')}
                        className="bg-white dark:bg-navy-800 rounded-lg shadow-md border border-gray-200 dark:border-navy-700 p-6 hover:shadow-xl transition-all cursor-pointer"
                      >
                        <div className="flex items-start gap-4 mb-4">
                          <img
                            src={getImageUrl(institution.profile_image || institution.image) || 'https://i.pravatar.cc/150?img=12'}
                            alt={institution.title || institution.name || institution.username}
                            className="w-16 h-16 rounded-full object-cover border-2 border-primary-200 dark:border-primary-800"
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-bold text-gray-800 dark:text-white">{institution.title || institution.name || institution.username}</h3>
                            </div>
                            <p className="text-sm text-primary-600 dark:text-teal-400 mb-1">{institution.username}</p>
                            {institution.location && (
                              <p className="text-xs text-gray-500 dark:text-gray-500">{institution.location}</p>
                            )}
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">{institution.about || institution.bio}</p>
                        {institution.isVerified && (
                          <div className="flex items-center gap-2 text-green-600 dark:text-green-400 text-xs font-semibold">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <span>{t('feed.verified')}</span>
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </>
            )}

            {!isLoadingSearch && !searchError && activeTab === 'courses' && (
              <>
                {/* Filters for Courses */}
                <div className="bg-white dark:bg-navy-800 rounded-xl shadow-lg p-6 mb-8">
                  <div className="flex flex-col md:flex-row gap-4">
                    {/* Search */}
                    <div className="flex-1 relative">
                      <FaSearch className={`absolute ${isRTL ? 'right-4' : 'left-4'} top-1/2 transform -translate-y-1/2 text-gray-400`} />
                      <input
                        ref={searchInputRef}
                        type="text"
                        placeholder={t('coursesPage.searchPlaceholder') || 'Search courses...'}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className={`w-full ${isRTL ? 'pr-12 pl-4' : 'pl-12 pr-4'} py-3 border border-gray-300 dark:border-navy-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-navy-700 text-gray-900 dark:text-white`}
                      />
                    </div>

                    {/* Institution Filter */}
                    <div className="relative">
                      <FaUniversity className={`absolute ${isRTL ? 'right-4' : 'left-4'} top-1/2 transform -translate-y-1/2 text-gray-400`} />
                      <select
                        value={selectedInstitution}
                        onChange={(e) => setSelectedInstitution(e.target.value)}
                        className={`${isRTL ? 'pr-12 pl-10' : 'pl-12 pr-10'} py-3 border border-gray-300 dark:border-navy-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-navy-700 text-gray-900 dark:text-white appearance-none cursor-pointer`}
                      >
                        <option value="all">{t('coursesPage.allInstitutions') || 'All Institutions'}</option>
                        {[...new Set(courses.map(c => c.institution))].map(inst => (
                          <option key={inst} value={inst}>{inst}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {(() => {
                  const filteredCourses = courses.filter(course => {
                    const matchesSearch = !searchQuery.trim() || 
                      (course.title && course.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
                      (course.about && course.about.toLowerCase().includes(searchQuery.toLowerCase())) ||
                      (course.institution && course.institution.toLowerCase().includes(searchQuery.toLowerCase())) ||
                      (course.publisher_username && course.publisher_username.toLowerCase().includes(searchQuery.toLowerCase()));
                    const matchesInstitution = selectedInstitution === 'all' || (course.institution && course.institution === selectedInstitution);
                    return matchesSearch && matchesInstitution;
                  });

                  return filteredCourses.length === 0 ? (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-center py-12"
                    >
                      <FaGraduationCap className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                      <p className="text-gray-600 dark:text-gray-400 text-lg">
                        {t('coursesPage.noCoursesFound') || 'No courses found'}
                      </p>
                      {(searchQuery || selectedInstitution !== 'all') && (
                        <p className="text-gray-500 dark:text-gray-500 text-sm mt-2">
                          {t('coursesPage.tryAdjustingFilters') || 'Try adjusting your filters'}
                        </p>
                      )}
                    </motion.div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                    >
                      {filteredCourses.map((course, index) => (
                        <motion.div
                          key={course.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          onClick={() => handleViewCourse(course)}
                          className="bg-white dark:bg-navy-800 rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow cursor-pointer"
                        >
                          {/* Course Image */}
                          <div className="relative h-48 overflow-hidden bg-gradient-to-br from-primary-100 to-teal-100 dark:from-primary-900 dark:to-teal-900">
                            {(course.course_image || course.publisher_profile_image) && (
                              <img
                                src={getImageUrl(course.course_image || course.publisher_profile_image)}
                                alt={course.title}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                }}
                              />
                            )}
                          </div>

                          {/* Course Content */}
                          <div className="p-6">
                            <div className="mb-3">
                              <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-1 line-clamp-2">
                                {course.title}
                              </h3>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {course.institution && (
                                  <>
                                    <FaUniversity className="inline w-3 h-3 mr-1" />
                                    {course.institution}
                                  </>
                                )}
                                {course.city && (
                                  <>
                                    {course.institution && ' • '}
                                    <FaMapMarkerAlt className="inline w-3 h-3 mr-1" />
                                    {course.city}
                                  </>
                                )}
                              </p>
                            </div>

                            {course.about && (
                              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-3">
                                {course.about}
                              </p>
                            )}

                            {course.publisher_username && (
                              <p className="text-xs text-gray-500 dark:text-gray-500 mb-4">
                                @{course.publisher_username}
                              </p>
                            )}

                            {/* Buttons */}
                            <div className="flex gap-2 mt-4">
                              {/* Progress button - always visible */}
                              <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={(e) => handleViewProgress(course, e)}
                                className="px-3 py-2 bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-400 rounded-lg transition-colors font-medium text-sm flex items-center gap-1"
                              >
                                <FaChartLine className="text-sm" />
                                <span>{t('feed.progress') || 'Progress'}</span>
                              </motion.button>
                              {/* Enroll button for verified students */}
                              {instituteData.isAuthenticated && instituteData.userType === 'student' ? (
                                <motion.button
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.98 }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEnrollCourse(course, e);
                                  }}
                                  disabled={enrollingCourseId === course.id}
                                  className="flex-1 px-4 py-3 bg-primary-600 hover:bg-primary-500 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                  {enrollingCourseId === course.id ? (
                                    <>
                                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                      <span>{t('feed.enrolling') || 'Enrolling...'}</span>
                                    </>
                                  ) : (
                                    <span>{t('feed.enroll') || 'Enroll'}</span>
                                  )}
                                </motion.button>
                              ) : null}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </motion.div>
                  );
                })()}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Profile Modal */}
      {selectedProfile && (
        <Modal
          isOpen={!!selectedProfile}
          onClose={handleCloseProfile}
          title={selectedProfile.name || selectedProfile.title || selectedProfile.username || 'Profile'}
        >
          {isLoadingProfile ? (
            <div className="flex items-center justify-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 dark:border-teal-400"></div>
              <p className="ml-4 text-gray-600 dark:text-gray-400">{t('common.loading')}</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Profile Header */}
              <div className="flex items-start gap-6">
                <div className="relative">
                  {(() => {
                    const defaultProfileAvatar = `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="${profileType === 'student' ? '#6366f1' : profileType === 'lecturer' ? '#0d9488' : '#8b5cf6'}" width="100" height="100"/><text x="50" y="55" font-family="Arial" font-size="40" fill="white" text-anchor="middle" dominant-baseline="middle">${(selectedProfile.name || selectedProfile.title || selectedProfile.username || 'P').charAt(0).toUpperCase()}</text></svg>`)}`;
                    const profileImg = selectedProfile.image || getImageUrl(selectedProfile.profile_image) || defaultProfileAvatar;
                    return (
                      <img
                        src={profileImg}
                        alt={selectedProfile.name || selectedProfile.title || selectedProfile.username}
                        className="w-32 h-32 rounded-full object-cover border-4 border-primary-200 dark:border-primary-800"
                        onError={(e) => { e.target.src = defaultProfileAvatar; }}
                      />
                    );
                  })()}
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
                    {profileType === 'institution' 
                      ? (selectedProfile.title || selectedProfile.name || selectedProfile.username)
                      : profileType === 'student'
                      ? (selectedProfile.name || `${selectedProfile.first_name || ''} ${selectedProfile.last_name || ''}`.trim() || selectedProfile.username)
                      : selectedProfile.name}
                  </h2>
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
                {profileType === 'institution' ? (
                  <>
                    {selectedProfile.title && (
                      <p className="text-lg text-primary-600 dark:text-teal-400 font-semibold mb-1">
                        {selectedProfile.title}
                      </p>
                    )}
                    {(selectedProfile.first_name || selectedProfile.last_name) && (
                      <p className="text-sm text-gray-400 dark:text-gray-500 mb-1">
                        {selectedProfile.first_name || ''} {selectedProfile.last_name || ''}
                      </p>
                    )}
                    {selectedProfile.username && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                        @{selectedProfile.username}
                      </p>
                    )}
                  </>
                ) : profileType === 'student' ? (
                  <>
                    {/* Username */}
                    {selectedProfile.username && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                        @{selectedProfile.username}
                      </p>
                    )}
                    {/* Studying Level */}
                    {selectedProfile.studying_level && (
                      <p className="text-lg text-primary-600 dark:text-teal-400 mb-1">
                        {t(`profile.${selectedProfile.studying_level}`) || selectedProfile.studying_level}
                      </p>
                    )}
                    {/* City */}
                    {selectedProfile.city && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        📍 {selectedProfile.city}
                      </p>
                    )}
                  </>
                ) : (
                  <>
                    <p className="text-lg text-primary-600 dark:text-teal-400 mb-1">
                      {selectedProfile.specialty}
                    </p>
                    <p className="text-gray-600 dark:text-gray-400">
                      {`${selectedProfile.experience || ''} ${selectedProfile.experience ? 'Experience' : ''} ${selectedProfile.experience && selectedProfile.university ? '•' : ''} ${selectedProfile.university || ''}`.trim()}
                    </p>
                  </>
                )}
                {(selectedProfile.bio || selectedProfile.about) && (
                  <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                    {selectedProfile.bio || selectedProfile.about}
                  </p>
                )}
              </div>
            </div>

            {/* Contact Information / Location Details */}
            {(selectedProfile.email || selectedProfile.phone || selectedProfile.phone_number || selectedProfile.location || selectedProfile.city) && (
              <div className="bg-gray-50 dark:bg-navy-900 rounded-lg p-4">
                <h3 className="font-semibold text-gray-800 dark:text-white mb-3">
                  {profileType === 'student' ? (t('feed.location') || 'Location') : (t('feed.contactInformation') || 'Contact Information')}
                </h3>
                <div className="space-y-2 text-sm">
                  {selectedProfile.email && (
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600 dark:text-gray-400">📧 {t('feed.email') || 'Email'}:</span>
                      <span className="text-gray-800 dark:text-white">{selectedProfile.email}</span>
                    </div>
                  )}
                  {selectedProfile.phone_number && (
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600 dark:text-gray-400">📱 {t('feed.phone') || 'Phone'}:</span>
                      <span className="text-gray-800 dark:text-white">{selectedProfile.phone_number}</span>
                    </div>
                  )}
                  {selectedProfile.phone && !selectedProfile.phone_number && (
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600 dark:text-gray-400">📱 {t('feed.phone') || 'Phone'}:</span>
                      <span className="text-gray-800 dark:text-white">{selectedProfile.phone}</span>
                    </div>
                  )}
                  {selectedProfile.location && (
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600 dark:text-gray-400">📍 {t('feed.location') || 'Location'}:</span>
                      <span className="text-gray-800 dark:text-white">{selectedProfile.location}</span>
                    </div>
                  )}
                  {selectedProfile.city && (
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600 dark:text-gray-400">🏙️ {t('feed.city') || 'City'}:</span>
                      <span className="text-gray-800 dark:text-white">{selectedProfile.city}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* About */}
            {(selectedProfile.about || selectedProfile.bio) && (
              <div className="bg-gray-50 dark:bg-navy-900 rounded-lg p-4">
                <h3 className="font-semibold text-gray-800 dark:text-white mb-3">{t('feed.about') || 'About'}</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                  {selectedProfile.about || selectedProfile.bio}
                </p>
              </div>
            )}

            {/* Student-specific content */}
            {profileType === 'student' && (
              <>
                {/* Studying Level - Only show if available */}
                {selectedProfile.studying_level && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-800 dark:text-white mb-2">{t('profile.studyingLevel') || 'Studying Level'}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                      {t(`profile.${selectedProfile.studying_level}`) || selectedProfile.studying_level}
                    </p>
                  </div>
                )}

                {/* Show additional fields only if they exist (from full profile, not public) */}
                {selectedProfile.interesting_keywords && (
                  <div>
                    <h3 className="font-semibold text-gray-800 dark:text-white mb-2">{t('feed.interests') || 'Interests'}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {selectedProfile.interesting_keywords}
                    </p>
                  </div>
                )}

                {selectedProfile.skills && Array.isArray(selectedProfile.skills) && selectedProfile.skills.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-800 dark:text-white mb-2">{t('feed.skills') || 'Skills'}</h3>
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
                )}

                {selectedProfile.achievements && Array.isArray(selectedProfile.achievements) && selectedProfile.achievements.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-800 dark:text-white mb-2">{t('feed.achievements') || 'Achievements'}</h3>
                    <ul className="space-y-2">
                      {selectedProfile.achievements.map((achievement, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <span className="text-primary-600 dark:text-teal-400">✓</span>
                          {achievement}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}

            {/* Institution-specific content */}
            {profileType === 'institution' && (
              <>
                {selectedProfile.title && (
                  <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-800 dark:text-white mb-2">{t('feed.institutionName') || 'Institution Name'}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                      {selectedProfile.title}
                    </p>
                  </div>
                )}
                {(selectedProfile.first_name || selectedProfile.last_name) && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-800 dark:text-white mb-2">{t('feed.ownerName') || 'Owner Name'}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {selectedProfile.first_name || ''} {selectedProfile.last_name || ''}
                    </p>
                  </div>
                )}
                {selectedProfile.username && (
                  <div className="bg-gray-50 dark:bg-navy-900 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-800 dark:text-white mb-2">{t('feed.username') || 'Username'}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      @{selectedProfile.username}
                    </p>
                  </div>
                )}
                
                {/* See Full Page Button */}
                {selectedProfile.username && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleCloseProfile();
                      navigate(`/institution/profile/${selectedProfile.username}`);
                    }}
                    className="w-full px-6 py-3 bg-gradient-to-r from-primary-600 to-teal-500 hover:from-primary-700 hover:to-teal-600 text-white rounded-lg font-semibold transition-all flex items-center justify-center gap-2 mt-4"
                  >
                    <FaUniversity className="w-5 h-5" />
                    <span>{t('feed.seeFullPage') || 'See Full Page'}</span>
                  </motion.button>
                )}
              </>
            )}

            {/* Lecturer-specific content */}
            {profileType === 'lecturer' && (
              <>
                {/* Academic Achievement */}
                {selectedProfile.academic_achievement && (
                  <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-800 dark:text-white mb-2">{t('profile.academicAchievement') || 'Academic Achievement'}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {selectedProfile.academic_achievement}
                    </p>
                  </div>
                )}

                {/* Specialty */}
                {selectedProfile.specialty && (
                  <div className="bg-teal-50 dark:bg-teal-900/20 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-800 dark:text-white mb-2">{t('profile.specialty') || 'Specialty'}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                      {selectedProfile.specialty}
                    </p>
                  </div>
                )}

                {/* Experience */}
                {selectedProfile.experience && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-800 dark:text-white mb-2">{t('profile.experience') || 'Experience'}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {selectedProfile.experience} {t('profile.years') || 'years'}
                    </p>
                  </div>
                )}

                {/* Free Time / Availability */}
                {selectedProfile.free_time && (
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-800 dark:text-white mb-2">{t('profile.freeTime') || 'Available Time'}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {selectedProfile.free_time}
                    </p>
                  </div>
                )}

                {/* Institutions */}
                {selectedProfile.institutions && selectedProfile.institutions.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-800 dark:text-white mb-2">{t('profile.institutions') || 'Institutions'}</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedProfile.institutions.map((inst, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 rounded-full text-sm"
                        >
                          {inst}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Skills */}
                {selectedProfile.skills && (
                  <div>
                    <h3 className="font-semibold text-gray-800 dark:text-white mb-2">{t('profile.skills') || 'Skills'}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {selectedProfile.skills}
                    </p>
                  </div>
                )}

                {selectedProfile.publications && (
                  <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-800 dark:text-white mb-2">{t('feed.publications') || 'Publications'}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {selectedProfile.publications}
                    </p>
                  </div>
                )}

                {selectedProfile.achievements && Array.isArray(selectedProfile.achievements) && selectedProfile.achievements.length > 0 && (
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
                )}

                {/* Courses Button */}
                {selectedProfile.username && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={async () => {
                      if (!selectedProfile.username) {
                        toast.error(t('feed.lecturerUsernameNotFound') || 'Lecturer username not found');
                        return;
                      }
                      
                      setShowLecturerCoursesModal(true);
                      setIsLoadingLecturerCourses(true);
                      setLecturerCourses([]);
                      
                      try {
                        const response = await authService.getLecturerCourses(selectedProfile.username);
                        if (response?.results && Array.isArray(response.results)) {
                          setLecturerCourses(response.results);
                        } else if (Array.isArray(response)) {
                          setLecturerCourses(response);
                        } else {
                          setLecturerCourses([]);
                        }
                      } catch (error) {
                        console.error('Error fetching lecturer courses:', error);
                        toast.error(error?.message || t('feed.failedToLoadCourses') || 'Failed to load courses');
                        setLecturerCourses([]);
                      } finally {
                        setIsLoadingLecturerCourses(false);
                      }
                    }}
                    className="w-full mt-4 px-4 py-3 bg-primary-600 hover:bg-primary-500 text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                  >
                    <FaBook className="w-4 h-4" />
                    <span>{t('feed.viewCourses') || 'View Courses'}</span>
                  </motion.button>
                )}
              </>
            )}
            </div>
          )}
        </Modal>
      )}

      {/* Profile Modal */}
      <ProfileModal 
        isOpen={showProfileModal} 
        onClose={() => setShowProfileModal(false)} 
      />

      {/* Job Details Modal */}
      {selectedJob && (
        <Modal
          isOpen={!!selectedJob}
          onClose={handleCloseJob}
          title={selectedJob.title || t('feed.jobDetails') || 'Job Details'}
        >
          {isLoadingJob ? (
            <div className="flex items-center justify-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 dark:border-teal-400"></div>
              <p className="ml-4 text-gray-600 dark:text-gray-400">{t('common.loading')}</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Job Header */}
              <div>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
                  {selectedJob.title}
                </h2>
                {selectedJob.specialty && (
                  <p className="text-lg text-primary-600 dark:text-teal-400 font-semibold mb-2">
                    {selectedJob.specialty}
                  </p>
                )}
                {selectedJob.institution_username && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-2">
                    <FaUniversity className="text-primary-600 dark:text-teal-400" />
                    <span>@{selectedJob.institution_username}</span>
                  </div>
                )}
              </div>

              {/* Description */}
              {selectedJob.description && (
                <div className="bg-gray-50 dark:bg-navy-900 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-800 dark:text-white mb-2">{t('feed.description') || 'Description'}</h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                    {selectedJob.description}
                  </p>
                </div>
              )}

              {/* Job Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Experience Required */}
                {selectedJob.experience_required !== undefined && selectedJob.experience_required !== null && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <FaBriefcase className="text-blue-600 dark:text-blue-400" />
                      <h3 className="font-semibold text-gray-800 dark:text-white text-sm">{t('feed.experienceRequired') || 'Experience Required'}</h3>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">
                      {selectedJob.experience_required} {t('feed.years') || 'years'}
                    </p>
                  </div>
                )}

                {/* Skills Required */}
                {selectedJob.skills_required && (
                  <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <FaGraduationCap className="text-purple-600 dark:text-purple-400" />
                      <h3 className="font-semibold text-gray-800 dark:text-white text-sm">{t('feed.skillsRequired') || 'Skills Required'}</h3>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                      {selectedJob.skills_required}
                    </p>
                  </div>
                )}

                {/* Salary Offer */}
                {selectedJob.salary_offer !== undefined && selectedJob.salary_offer !== null && (
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <FaDollarSign className="text-green-600 dark:text-green-400" />
                      <h3 className="font-semibold text-gray-800 dark:text-white text-sm">{t('feed.salaryOffer') || 'Salary Offer'}</h3>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 text-sm font-bold">
                      ${selectedJob.salary_offer.toLocaleString()}
                    </p>
                  </div>
                )}

                {/* Created Date */}
                {selectedJob.created_at && (
                  <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <FaClock className="text-orange-600 dark:text-orange-400" />
                      <h3 className="font-semibold text-gray-800 dark:text-white text-sm">{t('feed.postedDate') || 'Posted Date'}</h3>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                      {new Date(selectedJob.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </Modal>
      )}

      {/* Apply Job Modal */}
      {showApplyJobModal && selectedJob && (
        <Modal
          isOpen={showApplyJobModal}
          onClose={() => {
            setShowApplyJobModal(false);
            setApplyJobMessage('');
          }}
          title={t('feed.applyToJob') || 'Apply to Job'}
        >
          <div className="space-y-6">
            {/* Job Info */}
            <div className="bg-gray-50 dark:bg-navy-900 rounded-lg p-4">
              <h3 className="font-semibold text-gray-800 dark:text-white mb-2">{selectedJob.title}</h3>
              {selectedJob.institution && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {t('feed.institution') || 'Institution'}: {selectedJob.institution}
                </p>
              )}
            </div>

            {/* Message Input */}
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

            {/* Buttons */}
            <div className="flex gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setShowApplyJobModal(false);
                  setApplyJobMessage('');
                }}
                className="flex-1 px-4 py-3 border border-gray-300 dark:border-navy-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-navy-700 transition-colors"
              >
                {t('common.cancel') || 'Cancel'}
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={async () => {
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
                            refreshToken: tokens.refresh,
                          });
                        },
                        onSessionExpired: () => {
                          // Handle session expired
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
                }}
                disabled={isApplying}
                className="flex-1 px-4 py-3 bg-primary-600 hover:bg-primary-500 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isApplying ? (t('feed.applying') || 'Applying...') : (t('feed.apply') || 'Apply')}
              </motion.button>
            </div>
          </div>
        </Modal>
      )}

      {/* Course Details Modal */}
      {selectedCourse && (
        <Modal
          isOpen={!!selectedCourse}
          onClose={handleCloseCourse}
          title={selectedCourse.title || t('feed.courseDetails') || 'Course Details'}
        >
          {isLoadingCourse ? (
            <div className="flex items-center justify-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 dark:border-teal-400"></div>
              <p className="ml-4 text-gray-600 dark:text-gray-400">{t('common.loading')}</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Course Image */}
              {(selectedCourse.course_image || selectedCourse.publisher_profile_image) && (
                <div className="relative h-64 overflow-hidden rounded-xl">
                  <img
                    src={getImageUrl(selectedCourse.course_image || selectedCourse.publisher_profile_image)}
                    alt={selectedCourse.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Course Header */}
              <div>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
                  {selectedCourse.title}
                </h2>
                {selectedCourse.level && (
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                    selectedCourse.level === 'beginner' || selectedCourse.level === 'Beginner' 
                      ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' :
                    selectedCourse.level === 'intermediate' || selectedCourse.level === 'Intermediate'
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' :
                      'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300'
                  }`}>
                    {selectedCourse.level}
                  </span>
                )}
              </div>

              {/* About/Description */}
              {selectedCourse.about && (
                <div className="bg-gray-50 dark:bg-navy-900 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-800 dark:text-white mb-2">{t('feed.about') || 'About'}</h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed whitespace-pre-wrap">
                    {selectedCourse.about}
                  </p>
                </div>
              )}

              {/* Course Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Institution */}
                {(selectedCourse.institution_name || selectedCourse.institution) && (
                  <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <FaUniversity className="text-indigo-600 dark:text-indigo-400" />
                      <h3 className="font-semibold text-gray-800 dark:text-white text-sm">{t('feed.institution') || 'Institution'}</h3>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">{selectedCourse.institution_name || selectedCourse.institution}</p>
                    {(selectedCourse.institution_username || selectedCourse.publisher_username) && (
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">@{selectedCourse.institution_username || selectedCourse.publisher_username}</p>
                    )}
                  </div>
                )}

                {/* City */}
                {selectedCourse.city && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <FaMapMarkerAlt className="text-blue-600 dark:text-blue-400" />
                      <h3 className="font-semibold text-gray-800 dark:text-white text-sm">{t('feed.city') || 'City'}</h3>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">{selectedCourse.city}</p>
                  </div>
                )}

                {/* Lecturer */}
                {selectedCourse.lecturer_name && (
                  <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <FaChalkboardTeacher className="text-purple-600 dark:text-purple-400" />
                      <h3 className="font-semibold text-gray-800 dark:text-white text-sm">{t('feed.lecturer') || 'Lecturer'}</h3>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">{selectedCourse.lecturer_name}</p>
                  </div>
                )}

                {/* Price */}
                {selectedCourse.price && (
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <FaDollarSign className="text-green-600 dark:text-green-400" />
                      <h3 className="font-semibold text-gray-800 dark:text-white text-sm">{t('feed.price') || 'Price'}</h3>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 text-sm font-bold">${parseFloat(selectedCourse.price).toFixed(2)}</p>
                  </div>
                )}

                {/* Dates */}
                {(selectedCourse.starting_date || selectedCourse.ending_date) && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <FaClock className="text-blue-600 dark:text-blue-400" />
                      <h3 className="font-semibold text-gray-800 dark:text-white text-sm">{t('feed.dates') || 'Course Dates'}</h3>
                    </div>
                    {selectedCourse.starting_date && (
                      <p className="text-gray-600 dark:text-gray-400 text-xs">
                        <span className="font-medium">{t('feed.startDate') || 'Start'}:</span> {new Date(selectedCourse.starting_date).toLocaleDateString()}
                      </p>
                    )}
                    {selectedCourse.ending_date && (
                      <p className="text-gray-600 dark:text-gray-400 text-xs">
                        <span className="font-medium">{t('feed.endDate') || 'End'}:</span> {new Date(selectedCourse.ending_date).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                )}

                {/* Schedule */}
                {(selectedCourse.days || selectedCourse.start_time || selectedCourse.end_time) && (
                  <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4 md:col-span-2">
                    <div className="flex items-center gap-2 mb-2">
                      <FaClock className="text-orange-600 dark:text-orange-400" />
                      <h3 className="font-semibold text-gray-800 dark:text-white text-sm">{t('feed.schedule') || 'Schedule'}</h3>
                    </div>
                    <div className="space-y-1">
                      {selectedCourse.days && Array.isArray(selectedCourse.days) && selectedCourse.days.length > 0 && (
                        <p className="text-gray-600 dark:text-gray-400 text-sm">
                          <span className="font-medium">{t('feed.days') || 'Days'}:</span> {selectedCourse.days.map(day => day.charAt(0).toUpperCase() + day.slice(1)).join(', ')}
                        </p>
                      )}
                      {selectedCourse.start_time && selectedCourse.end_time && (
                        <p className="text-gray-600 dark:text-gray-400 text-sm">
                          <span className="font-medium">{t('feed.time') || 'Time'}:</span> {selectedCourse.start_time.substring(0, 5)} - {selectedCourse.end_time.substring(0, 5)}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Enroll button for verified students */}
              {instituteData.isAuthenticated && instituteData.userType === 'student' && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEnrollCourse(selectedCourse, e);
                  }}
                  disabled={enrollingCourseId === selectedCourse.id}
                  className="w-full mt-4 px-4 py-3 bg-primary-600 hover:bg-primary-500 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {enrollingCourseId === selectedCourse.id ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>{t('feed.enrolling') || 'Enrolling...'}</span>
                    </>
                  ) : (
                    <span>{t('feed.enroll') || 'Enroll'}</span>
                  )}
                </motion.button>
              )}
            </div>
          )}
        </Modal>
      )}

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

      {/* Enrollment Contradiction Modal */}
      <AnimatePresence>
        {showEnrollmentContradiction && enrollmentContradiction && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => {
              setShowEnrollmentContradiction(false);
              setEnrollmentContradiction(null);
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
                  {t('feed.scheduleConflict') || 'Schedule Conflict'}
                </h3>
              </div>

              {/* Content */}
              <div className="p-6">
                <p className="text-gray-600 dark:text-gray-400 text-center mb-6">
                  {t('feed.conflictMessage') || 'You cannot enroll in this course because you have a scheduling conflict with another course.'}
                </p>

                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
                  <h4 className="font-semibold text-gray-800 dark:text-white mb-3">
                    {t('feed.conflictingCourse') || 'Conflicting Course:'}
                  </h4>
                  <div className="space-y-2 text-sm">
                    <p className="text-gray-700 dark:text-gray-300">
                      <span className="font-medium">{t('feed.course') || 'Course'}:</span> {enrollmentContradiction.course_title}
                    </p>
                    <p className="text-gray-700 dark:text-gray-300">
                      <span className="font-medium">{t('feed.institution') || 'Institution'}:</span> {enrollmentContradiction.institution}
                    </p>
                    <p className="text-gray-700 dark:text-gray-300">
                      <span className="font-medium">{t('feed.day') || 'Day'}:</span> {enrollmentContradiction.day}
                    </p>
                    <p className="text-gray-700 dark:text-gray-300">
                      <span className="font-medium">{t('feed.time') || 'Time'}:</span> {enrollmentContradiction.time}
                    </p>
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setShowEnrollmentContradiction(false);
                    setEnrollmentContradiction(null);
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

      {/* Progress Modal */}
      <AnimatePresence>
        {showProgressModal && progressCourse && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => {
              setShowProgressModal(false);
              setProgressCourse(null);
              setProgressData(null);
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
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                      <FaChartLine className="text-2xl text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">
                        {t('feed.courseProgress') || 'Course Progress'}
                      </h3>
                      <p className="text-white/80 text-sm">{progressCourse.title}</p>
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => {
                      setShowProgressModal(false);
                      setProgressCourse(null);
                      setProgressData(null);
                    }}
                    className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
                  >
                    <FaTimes className="text-white text-lg" />
                  </motion.button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                {loadingProgress ? (
                  <div className="text-center py-12">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="w-10 h-10 border-4 border-blue-200 dark:border-blue-800 border-t-blue-600 dark:border-t-blue-400 rounded-full mx-auto mb-4"
                    />
                    <p className="text-gray-600 dark:text-gray-400">
                      {t('feed.loadingProgress') || 'Loading progress...'}
                    </p>
                  </div>
                ) : progressData ? (
                  <>
                    {/* Progress Stats */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="bg-gray-50 dark:bg-navy-700 rounded-xl p-4 text-center">
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                          {t('feed.totalLectures') || 'Total Lectures'}
                        </p>
                        <p className="text-2xl font-bold text-gray-800 dark:text-white">
                          {progressData.progress?.total_lectures || 0}
                        </p>
                      </div>
                      <div className="bg-gray-50 dark:bg-navy-700 rounded-xl p-4 text-center">
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                          {t('feed.completed') || 'Completed'}
                        </p>
                        <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                          {progressData.progress?.completed_lectures !== null 
                            ? progressData.progress?.completed_lectures 
                            : 'N/A'}
                        </p>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-6">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-600 dark:text-gray-400">
                          {t('feed.progressPercentage') || 'Progress'}
                        </span>
                        <span className={`font-semibold ${
                          (progressData.progress?.progress_percentage || 0) >= 80 
                            ? 'text-green-600 dark:text-green-400'
                            : (progressData.progress?.progress_percentage || 0) >= 50 
                              ? 'text-blue-600 dark:text-blue-400'
                              : 'text-yellow-600 dark:text-yellow-400'
                        }`}>
                          {(progressData.progress?.progress_percentage || 0).toFixed(1)}%
                        </span>
                      </div>
                      <div className="h-4 bg-gray-200 dark:bg-navy-700 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${progressData.progress?.progress_percentage || 0}%` }}
                          transition={{ duration: 0.8, ease: 'easeOut' }}
                          className={`h-full rounded-full ${
                            (progressData.progress?.progress_percentage || 0) >= 80 
                              ? 'bg-gradient-to-r from-green-500 to-emerald-500' 
                              : (progressData.progress?.progress_percentage || 0) >= 50 
                                ? 'bg-gradient-to-r from-blue-500 to-cyan-500'
                                : 'bg-gradient-to-r from-yellow-500 to-amber-500'
                          }`}
                        />
                      </div>
                    </div>

                    {/* Note */}
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <FaInfoCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm text-blue-800 dark:text-blue-300">
                            {progressData.progress?.completed_lectures !== null 
                              ? (t('feed.personalProgress') || 'This is your personal progress in this course.')
                              : (t('feed.averageProgress') || 'This shows the average progress of all students in this course.')}
                          </p>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-12">
                    <FaChartLine className="text-4xl text-gray-400 dark:text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-600 dark:text-gray-400">
                      {t('feed.noProgressData') || 'No progress data available'}
                    </p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-gray-200 dark:border-navy-700">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setShowProgressModal(false);
                    setProgressCourse(null);
                    setProgressData(null);
                  }}
                  className="w-full px-4 py-3 bg-gray-100 dark:bg-navy-700 hover:bg-gray-200 dark:hover:bg-navy-600 text-gray-800 dark:text-white rounded-lg font-medium transition-colors"
                >
                  {t('common.close') || 'Close'}
                </motion.button>
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

      {/* Lecturer Courses Modal */}
      <AnimatePresence>
        {showLecturerCoursesModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => {
              setShowLecturerCoursesModal(false);
              setLecturerCourses([]);
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-navy-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden flex flex-col"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-primary-600 to-teal-500 p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                      <FaBook className="text-2xl text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">
                        {t('feed.lecturerCourses') || 'Lecturer Courses'}
                      </h3>
                      {selectedProfile?.name && (
                        <p className="text-white/80 text-sm">{selectedProfile.name}</p>
                      )}
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => {
                      setShowLecturerCoursesModal(false);
                      setLecturerCourses([]);
                    }}
                    className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
                  >
                    <FaTimes className="text-white text-lg" />
                  </motion.button>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6">
                {isLoadingLecturerCourses ? (
                  <div className="text-center py-12">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="w-10 h-10 border-4 border-primary-200 dark:border-primary-800 border-t-primary-600 dark:border-t-primary-400 rounded-full mx-auto mb-4"
                    />
                    <p className="text-gray-600 dark:text-gray-400">
                      {t('feed.loadingCourses') || 'Loading courses...'}
                    </p>
                  </div>
                ) : lecturerCourses.length === 0 ? (
                  <div className="text-center py-12">
                    <FaBook className="text-4xl text-gray-400 dark:text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-600 dark:text-gray-400">
                      {t('feed.noCoursesFound') || 'No courses found for this lecturer'}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {lecturerCourses.map((course, index) => (
                      <motion.div
                        key={course.id || index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        onClick={() => {
                          handleViewCourse(course);
                          setShowLecturerCoursesModal(false);
                        }}
                        className="bg-gray-50 dark:bg-navy-700 rounded-xl p-4 hover:shadow-lg transition-all cursor-pointer border border-gray-200 dark:border-navy-600"
                      >
                        {/* Course Image */}
                        {course.course_image && (
                          <div className="relative h-32 overflow-hidden rounded-lg mb-3 bg-gradient-to-br from-primary-100 to-teal-100 dark:from-primary-900 dark:to-teal-900">
                            <img
                              src={getImageUrl(course.course_image)}
                              alt={course.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        
                        {/* Course Title */}
                        <h4 className="font-bold text-gray-800 dark:text-white mb-2 line-clamp-2">
                          {course.title}
                        </h4>
                        
                        {/* Course About */}
                        {course.about && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                            {course.about}
                          </p>
                        )}
                        
                        {/* Course Details */}
                        <div className="space-y-1 text-xs text-gray-500 dark:text-gray-500">
                          {course.level && (
                            <div className="flex items-center gap-1">
                              <span className="font-medium">{t('feed.level') || 'Level'}:</span>
                              <span className="capitalize">{course.level}</span>
                            </div>
                          )}
                          {course.price && (
                            <div className="flex items-center gap-1">
                              <FaDollarSign className="w-3 h-3" />
                              <span>{parseFloat(course.price).toFixed(2)}</span>
                            </div>
                          )}
                          {course.starting_date && (
                            <div className="flex items-center gap-1">
                              <FaClock className="w-3 h-3" />
                              <span>{new Date(course.starting_date).toLocaleDateString()}</span>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Explore;

