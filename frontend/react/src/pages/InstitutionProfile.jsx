import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { 
  FaUniversity, 
  FaArrowLeft,
  FaNewspaper,
  FaBook,
  FaBriefcase,
  FaMapMarkerAlt,
  FaClock,
  FaDollarSign,
  FaCalendarAlt,
  FaUser,
  FaSpinner
} from 'react-icons/fa';
import { authService } from '../services/authService';
import { useInstitute } from '../context/InstituteContext';
import Modal from '../components/Modal';
import toast from 'react-hot-toast';

const InstitutionProfile = () => {
  const { username } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const { instituteData, updateInstituteData } = useInstitute();
  
  // Get initial tab from URL query parameter, default to 'posts'
  const initialTab = searchParams.get('tab') || 'posts';
  const [activeTab, setActiveTab] = useState(initialTab); // 'posts', 'courses', 'jobs'
  
  // Update active tab when URL query parameter changes
  useEffect(() => {
    const tabFromUrl = searchParams.get('tab') || 'posts';
    if (tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl);
    }
  }, [searchParams]);
  const [institutionInfo, setInstitutionInfo] = useState(null);
  const [posts, setPosts] = useState([]);
  const [courses, setCourses] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingPosts, setIsLoadingPosts] = useState(false);
  const [isLoadingCourses, setIsLoadingCourses] = useState(false);
  const [isLoadingJobs, setIsLoadingJobs] = useState(false);
  
  // Modal states
  const [selectedJob, setSelectedJob] = useState(null);
  const [showJobModal, setShowJobModal] = useState(false);
  const [isLoadingJobDetails, setIsLoadingJobDetails] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [isLoadingCourseDetails, setIsLoadingCourseDetails] = useState(false);
  const [courseProgress, setCourseProgress] = useState(null);

  // Helper function to convert relative image URLs to full URLs
  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }
    const baseUrl = import.meta.env.VITE_API_BASE_URL?.replace(/\/+$/, '') || 'http://127.0.0.1:8000';
    let cleanPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
    cleanPath = cleanPath.replace(/\/media\/media+/g, '/media/');
    if (cleanPath.startsWith('/media/media/')) {
      cleanPath = cleanPath.replace('/media/media/', '/media/');
    }
    return `${baseUrl}${cleanPath}`;
  };

  // Fetch institution profile info
  useEffect(() => {
    const fetchInstitutionInfo = async () => {
      if (!username) return;
      
      try {
        const profileData = await authService.getInstitutionPublicProfile(username);
        if (profileData?.success && profileData?.data) {
          setInstitutionInfo({
            ...profileData.data,
            profile_image: profileData.data.profile_image ? getImageUrl(profileData.data.profile_image) : null,
          });
        }
      } catch (error) {
        console.error('Error fetching institution info:', error);
        toast.error(t('feed.failedToLoadProfile') || 'Failed to load institution profile');
      } finally {
        setIsLoading(false);
      }
    };

    fetchInstitutionInfo();
  }, [username]);

  // Fetch posts
  const fetchPosts = async () => {
    if (!username) return;
    setIsLoadingPosts(true);
    try {
      const data = await authService.getInstitutionPosts(username);
      if (data?.success && data?.data) {
        setPosts(Array.isArray(data.data) ? data.data : []);
      } else if (data?.results) {
        setPosts(Array.isArray(data.results) ? data.results : []);
      } else {
        setPosts([]);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
      toast.error(t('feed.failedToLoadPosts') || 'Failed to load posts');
      setPosts([]);
    } finally {
      setIsLoadingPosts(false);
    }
  };

  // Fetch courses
  const fetchCourses = async () => {
    if (!username) return;
    setIsLoadingCourses(true);
    try {
      const data = await authService.getInstitutionCourses(username);
      if (data?.success && data?.data) {
        setCourses(Array.isArray(data.data) ? data.data : []);
      } else if (data?.results) {
        setCourses(Array.isArray(data.results) ? data.results : []);
      } else {
        setCourses([]);
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
      toast.error(t('feed.failedToLoadCourses') || 'Failed to load courses');
      setCourses([]);
    } finally {
      setIsLoadingCourses(false);
    }
  };

  // Fetch jobs
  const fetchJobs = async () => {
    if (!username) return;
    setIsLoadingJobs(true);
    try {
      const data = await authService.getInstitutionJobs(username);
      if (data?.success && data?.data) {
        setJobs(Array.isArray(data.data) ? data.data : []);
      } else if (data?.results) {
        setJobs(Array.isArray(data.results) ? data.results : []);
      } else {
        setJobs([]);
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
      toast.error(t('feed.failedToLoadJobs') || 'Failed to load jobs');
      setJobs([]);
    } finally {
      setIsLoadingJobs(false);
    }
  };

  // Fetch data when tab changes
  useEffect(() => {
    if (activeTab === 'posts' && posts.length === 0) {
      fetchPosts();
    } else if (activeTab === 'courses' && courses.length === 0) {
      fetchCourses();
    } else if (activeTab === 'jobs' && jobs.length === 0) {
      fetchJobs();
    }
  }, [activeTab, username]);

  // Handle job click
  const handleJobClick = async (job) => {
    if (!job.id) return;
    setSelectedJob(job);
    setShowJobModal(true);
    setIsLoadingJobDetails(true);
    
    try {
      const jobDetails = await authService.getJobDetails(job.id);
      if (jobDetails?.success && jobDetails?.data) {
        setSelectedJob({ ...job, ...jobDetails.data });
      }
    } catch (error) {
      console.error('Error fetching job details:', error);
      toast.error(t('feed.failedToLoadJobDetails') || 'Failed to load job details');
    } finally {
      setIsLoadingJobDetails(false);
    }
  };

  // Handle course click
  const handleCourseClick = async (course) => {
    const courseId = course.id || course.course_id;
    if (!courseId) return;
    setSelectedCourse(course);
    setShowCourseModal(true);
    setIsLoadingCourseDetails(true);
    setCourseProgress(null);
    
    try {
      // Fetch course details and progress in parallel
      const [courseDetails, progressData] = await Promise.all([
        authService.getCourseDetails(courseId),
        authService.getCourseProgress(
          courseId,
          instituteData.accessToken || null,
          {
            refreshToken: instituteData.refreshToken,
            onTokenRefreshed: (tokens) => {
              updateInstituteData({
                accessToken: tokens.access,
                refreshToken: tokens.refresh || instituteData.refreshToken,
              });
            },
          }
        ).catch(() => null) // Progress is optional, don't fail if it errors
      ]);
      
      if (courseDetails?.success && courseDetails?.data) {
        setSelectedCourse({ ...course, ...courseDetails.data });
      }
      
      if (progressData?.success && progressData?.progress) {
        setCourseProgress(progressData.progress);
      }
    } catch (error) {
      console.error('Error fetching course details:', error);
      toast.error(t('feed.failedToLoadCourseDetails') || 'Failed to load course details');
    } finally {
      setIsLoadingCourseDetails(false);
    }
  };

  // Format timestamp
  const formatTimestamp = (createdAt) => {
    if (!createdAt) return '';
    try {
      const date = new Date(createdAt);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return t('feed.justNow') || 'Just now';
      if (diffMins < 60) return `${diffMins} ${diffMins === 1 ? t('feed.minute') || 'minute' : t('feed.minutes') || 'minutes'} ${t('feed.ago') || 'ago'}`;
      if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? t('feed.hour') || 'hour' : t('feed.hours') || 'hours'} ${t('feed.ago') || 'ago'}`;
      if (diffDays < 7) return `${diffDays} ${diffDays === 1 ? t('feed.day') || 'day' : t('feed.days') || 'days'} ${t('feed.ago') || 'ago'}`;
      return date.toLocaleDateString();
    } catch {
      return createdAt;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-navy-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 dark:border-teal-400"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (!institutionInfo) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-navy-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400">{t('feed.failedToLoadProfile') || 'Failed to load institution profile'}</p>
          <button
            onClick={() => navigate(-1)}
            className="mt-4 px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-lg"
          >
            {t('common.back') || 'Back'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-navy-900">
      {/* Header */}
      <div className="bg-white dark:bg-navy-800 shadow-md border-b border-gray-200 dark:border-navy-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4 mb-6">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate(-1)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-navy-700 transition-colors"
            >
              <FaArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </motion.button>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
              {t('feed.institutionProfile') || t('institutionProfile.title') || 'Institution Profile'}
            </h1>
          </div>

          {/* Institution Header Info */}
          <div className="flex items-start gap-6">
            <div className="relative flex-shrink-0">
              <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-primary-200 dark:border-primary-800 bg-gray-100 dark:bg-navy-700 flex items-center justify-center">
                {institutionInfo.profile_image ? (
                  <img
                    src={institutionInfo.profile_image}
                    alt={institutionInfo.title || institutionInfo.username}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div className="w-full h-full flex items-center justify-center text-primary-600 dark:text-teal-400 font-bold text-2xl" style={{ display: institutionInfo.profile_image ? 'none' : 'flex' }}>
                  {(institutionInfo.title || institutionInfo.username || 'I')?.[0]?.toUpperCase()}
                </div>
              </div>
            </div>
            <div className="flex-1">
              <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
                {institutionInfo.title || `${institutionInfo.first_name || ''} ${institutionInfo.last_name || ''}`.trim() || institutionInfo.username}
              </h2>
              {institutionInfo.location && (
                <p className="text-gray-600 dark:text-gray-400 flex items-center gap-2 mb-2">
                  <FaMapMarkerAlt className="text-sm" />
                  {institutionInfo.location}
                </p>
              )}
              {institutionInfo.city && (
                <p className="text-sm text-gray-500 dark:text-gray-500 mb-2">
                  {institutionInfo.city}
                </p>
              )}
              {institutionInfo.about && (
                <p className="text-gray-700 dark:text-gray-300 text-sm mt-2 line-clamp-2">
                  {institutionInfo.about}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-4 mb-6 border-b border-gray-200 dark:border-navy-700">
          <button
            onClick={() => setActiveTab('posts')}
            className={`px-6 py-3 font-semibold transition-colors border-b-2 ${
              activeTab === 'posts'
                ? 'border-primary-600 dark:border-teal-400 text-primary-600 dark:text-teal-400'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
            }`}
          >
            <div className="flex items-center gap-2">
              <FaNewspaper />
              <span>{t('feed.posts') || 'Posts'}</span>
              {posts.length > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 rounded-full text-xs">
                  {posts.length}
                </span>
              )}
            </div>
          </button>
          <button
            onClick={() => setActiveTab('courses')}
            className={`px-6 py-3 font-semibold transition-colors border-b-2 ${
              activeTab === 'courses'
                ? 'border-primary-600 dark:border-teal-400 text-primary-600 dark:text-teal-400'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
            }`}
          >
            <div className="flex items-center gap-2">
              <FaBook />
              <span>{t('feed.courses') || 'Courses'}</span>
              {courses.length > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 rounded-full text-xs">
                  {courses.length}
                </span>
              )}
            </div>
          </button>
          <button
            onClick={() => setActiveTab('jobs')}
            className={`px-6 py-3 font-semibold transition-colors border-b-2 ${
              activeTab === 'jobs'
                ? 'border-primary-600 dark:border-teal-400 text-primary-600 dark:text-teal-400'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
            }`}
          >
            <div className="flex items-center gap-2">
              <FaBriefcase />
              <span>{t('feed.jobs') || 'Jobs'}</span>
              {jobs.length > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 rounded-full text-xs">
                  {jobs.length}
                </span>
              )}
            </div>
          </button>
        </div>

        {/* Content */}
        <div className="mt-6">
          {/* Posts Tab */}
          {activeTab === 'posts' && (
            <div>
              {isLoadingPosts ? (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 dark:border-teal-400"></div>
                  <p className="mt-4 text-gray-600 dark:text-gray-400">{t('common.loading')}</p>
                </div>
              ) : posts.length === 0 ? (
                <div className="text-center py-12">
                  <FaNewspaper className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">{t('feed.noPosts') || 'No posts available'}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {posts.map((post) => (
                    <motion.div
                      key={post.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white dark:bg-navy-800 rounded-lg shadow-md border border-gray-200 dark:border-navy-700 overflow-hidden hover:shadow-lg transition-shadow"
                    >
                      {post.images && post.images.length > 0 && post.images[0]?.image && (
                        <div className="h-48 overflow-hidden">
                          <img
                            src={getImageUrl(post.images[0].image)}
                            alt={post.title}
                            className="w-full h-full object-cover"
                            onError={(e) => { e.target.style.display = 'none'; }}
                          />
                        </div>
                      )}
                      <div className="p-4">
                        <h3 className="font-bold text-gray-800 dark:text-white mb-2 line-clamp-2">
                          {post.title}
                        </h3>
                        {post.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3 mb-3">
                            {post.description}
                          </p>
                        )}
                        {post.created_at && (
                          <p className="text-xs text-gray-500 dark:text-gray-500 flex items-center gap-1">
                            <FaClock className="text-gray-400 dark:text-gray-500" />
                            {formatTimestamp(post.created_at)}
                          </p>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Courses Tab */}
          {activeTab === 'courses' && (
            <div>
              {isLoadingCourses ? (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 dark:border-teal-400"></div>
                  <p className="mt-4 text-gray-600 dark:text-gray-400">{t('common.loading')}</p>
                </div>
              ) : courses.length === 0 ? (
                <div className="text-center py-12">
                  <FaBook className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">{t('feed.noCourses') || 'No courses available'}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {courses.map((course) => (
                    <motion.div
                      key={course.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      onClick={() => handleCourseClick(course)}
                      className="bg-white dark:bg-navy-800 rounded-lg shadow-md border border-gray-200 dark:border-navy-700 overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                    >
                      <div className="h-48 overflow-hidden bg-gray-100 dark:bg-navy-700">
                        {course.course_image ? (
                          <img
                            src={getImageUrl(course.course_image)}
                            alt={course.title}
                            className="w-full h-full object-cover"
                            onError={(e) => { e.target.style.display = 'none'; }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-primary-600 dark:text-teal-400 font-bold text-2xl">
                            {(course.title || 'C')?.[0]?.toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <h3 className="font-bold text-gray-800 dark:text-white mb-2 line-clamp-2">
                          {course.title}
                        </h3>
                        {course.level && (
                          <span className="inline-block px-2 py-1 bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 rounded text-xs font-semibold mb-2">
                            {course.level}
                          </span>
                        )}
                        {course.price && (
                          <p className="text-lg font-semibold text-primary-600 dark:text-teal-400 mb-2">
                            ${parseFloat(course.price).toFixed(2)}
                          </p>
                        )}
                        {course.starting_date && course.ending_date && (
                          <p className="text-xs text-gray-500 dark:text-gray-500 flex items-center gap-1">
                            <FaCalendarAlt />
                            {course.starting_date} - {course.ending_date}
                          </p>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Jobs Tab */}
          {activeTab === 'jobs' && (
            <div>
              {isLoadingJobs ? (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 dark:border-teal-400"></div>
                  <p className="mt-4 text-gray-600 dark:text-gray-400">{t('common.loading')}</p>
                </div>
              ) : jobs.length === 0 ? (
                <div className="text-center py-12">
                  <FaBriefcase className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">{t('feed.noJobs') || 'No jobs available'}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {jobs.map((job) => (
                    <motion.div
                      key={job.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      onClick={() => handleJobClick(job)}
                      className="bg-white dark:bg-navy-800 rounded-lg shadow-md border border-gray-200 dark:border-navy-700 overflow-hidden hover:shadow-lg transition-shadow cursor-pointer p-6"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="font-bold text-gray-800 dark:text-white text-lg flex-1">
                          {job.title}
                        </h3>
                        {job.created_at && (
                          <p className="text-xs text-gray-500 dark:text-gray-500 flex items-center gap-1 ml-2">
                            <FaClock />
                            {formatTimestamp(job.created_at)}
                          </p>
                        )}
                      </div>
                      {job.specialty && (
                        <span className="inline-block px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded text-xs font-semibold mb-2">
                          {job.specialty}
                        </span>
                      )}
                      {job.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3 mt-2">
                          {job.description}
                        </p>
                      )}
                      {job.salary_offer && (
                        <p className="text-lg font-semibold text-primary-600 dark:text-teal-400 mt-3">
                          ${job.salary_offer.toLocaleString()}
                        </p>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Job Detail Modal */}
      <Modal
        isOpen={showJobModal}
        onClose={() => {
          setShowJobModal(false);
          setSelectedJob(null);
        }}
        title={selectedJob?.title || t('feed.jobDetails') || 'Job Details'}
        size="lg"
      >
        {isLoadingJobDetails ? (
          <div className="flex items-center justify-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 dark:border-teal-400"></div>
            <p className="ml-3 text-gray-600 dark:text-gray-400">{t('common.loading')}</p>
          </div>
        ) : selectedJob ? (
          <div className="space-y-6">
            <div>
              <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
                {selectedJob.title}
              </h3>
              {selectedJob.specialty && (
                <span className="inline-block px-3 py-1 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded-full text-sm font-semibold">
                  {selectedJob.specialty}
                </span>
              )}
            </div>

            {selectedJob.description && (
              <div>
                <h4 className="font-semibold text-gray-800 dark:text-white mb-2">
                  {t('feed.description') || 'Description'}
                </h4>
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                  {selectedJob.description}
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {selectedJob.experience_required !== undefined && (
                <div className="bg-gray-50 dark:bg-navy-900 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-800 dark:text-white mb-1">
                    {t('feed.experienceRequired') || 'Experience Required'}
                  </h4>
                  <p className="text-gray-600 dark:text-gray-400">
                    {selectedJob.experience_required} {t('feed.years') || 'years'}
                  </p>
                </div>
              )}

              {selectedJob.salary_offer && (
                <div className="bg-gray-50 dark:bg-navy-900 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-800 dark:text-white mb-1">
                    {t('feed.salaryOffer') || 'Salary Offer'}
                  </h4>
                  <p className="text-lg font-bold text-primary-600 dark:text-teal-400">
                    ${selectedJob.salary_offer.toLocaleString()}
                  </p>
                </div>
              )}

              {selectedJob.skills_required && (
                <div className="bg-gray-50 dark:bg-navy-900 rounded-lg p-4 md:col-span-2">
                  <h4 className="font-semibold text-gray-800 dark:text-white mb-2">
                    {t('feed.skillsRequired') || 'Skills Required'}
                  </h4>
                  <p className="text-gray-600 dark:text-gray-400">
                    {selectedJob.skills_required}
                  </p>
                </div>
              )}

              {selectedJob.created_at && (
                <div className="bg-gray-50 dark:bg-navy-900 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-800 dark:text-white mb-1">
                    {t('feed.postedOn') || 'Posted On'}
                  </h4>
                  <p className="text-gray-600 dark:text-gray-400 flex items-center gap-1">
                    <FaClock />
                    {new Date(selectedJob.created_at).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400">{t('feed.failedToLoadJobDetails') || 'Failed to load job details'}</p>
          </div>
        )}
      </Modal>

      {/* Course Detail Modal */}
      <Modal
        isOpen={showCourseModal}
        onClose={() => {
          setShowCourseModal(false);
          setSelectedCourse(null);
          setCourseProgress(null);
        }}
        title={selectedCourse?.title || t('feed.courseDetails') || 'Course Details'}
        size="lg"
      >
        {isLoadingCourseDetails ? (
          <div className="flex items-center justify-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 dark:border-teal-400"></div>
            <p className="ml-3 text-gray-600 dark:text-gray-400">{t('common.loading')}</p>
          </div>
        ) : selectedCourse ? (
          <div className="space-y-6">
            {/* Course Image */}
            {selectedCourse.course_image && (
              <div className="h-64 overflow-hidden rounded-lg">
                <img
                  src={getImageUrl(selectedCourse.course_image)}
                  alt={selectedCourse.title}
                  className="w-full h-full object-cover"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              </div>
            )}

            <div>
              <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
                {selectedCourse.title}
              </h3>
              {selectedCourse.level && (
                <span className="inline-block px-3 py-1 bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 rounded-full text-sm font-semibold">
                  {selectedCourse.level}
                </span>
              )}
            </div>

            {selectedCourse.about && (
              <div>
                <h4 className="font-semibold text-gray-800 dark:text-white mb-2">
                  {t('feed.about') || 'About'}
                </h4>
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                  {selectedCourse.about}
                </p>
              </div>
            )}

            {/* Course Progress */}
            {courseProgress && (
              <div className="bg-primary-50 dark:bg-primary-900/20 rounded-lg p-4 border border-primary-200 dark:border-primary-800">
                <h4 className="font-semibold text-gray-800 dark:text-white mb-3">
                  {t('feed.courseProgress') || 'Course Progress'}
                </h4>
                <div className="space-y-2">
                  {courseProgress.total_lectures && (
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      <span className="font-medium">{t('feed.totalLectures') || 'Total Lectures'}:</span> {courseProgress.total_lectures}
                    </p>
                  )}
                  {courseProgress.completed_lectures !== null && courseProgress.completed_lectures !== undefined && (
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      <span className="font-medium">{t('feed.completedLectures') || 'Completed Lectures'}:</span> {courseProgress.completed_lectures}
                    </p>
                  )}
                  {courseProgress.progress_percentage !== null && courseProgress.progress_percentage !== undefined && (
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {t('feed.progress') || 'Progress'}
                        </span>
                        <span className="text-sm font-semibold text-primary-600 dark:text-teal-400">
                          {courseProgress.progress_percentage.toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-navy-700 rounded-full h-2">
                        <div
                          className="bg-primary-600 dark:bg-teal-400 h-2 rounded-full transition-all"
                          style={{ width: `${courseProgress.progress_percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {selectedCourse.price && (
                <div className="bg-gray-50 dark:bg-navy-900 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-800 dark:text-white mb-1">
                    {t('feed.price') || 'Price'}
                  </h4>
                  <p className="text-lg font-bold text-primary-600 dark:text-teal-400">
                    ${parseFloat(selectedCourse.price).toFixed(2)}
                  </p>
                </div>
              )}

              {selectedCourse.starting_date && (
                <div className="bg-gray-50 dark:bg-navy-900 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-800 dark:text-white mb-1">
                    {t('feed.startingDate') || 'Starting Date'}
                  </h4>
                  <p className="text-gray-600 dark:text-gray-400 flex items-center gap-1">
                    <FaCalendarAlt />
                    {selectedCourse.starting_date}
                  </p>
                </div>
              )}

              {selectedCourse.ending_date && (
                <div className="bg-gray-50 dark:bg-navy-900 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-800 dark:text-white mb-1">
                    {t('feed.endingDate') || 'Ending Date'}
                  </h4>
                  <p className="text-gray-600 dark:text-gray-400 flex items-center gap-1">
                    <FaCalendarAlt />
                    {selectedCourse.ending_date}
                  </p>
                </div>
              )}

              {selectedCourse.capacity && (
                <div className="bg-gray-50 dark:bg-navy-900 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-800 dark:text-white mb-1">
                    {t('feed.capacity') || 'Capacity'}
                  </h4>
                  <p className="text-gray-600 dark:text-gray-400">
                    {selectedCourse.capacity} {t('feed.students') || 'students'}
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400">{t('feed.failedToLoadCourseDetails') || 'Failed to load course details'}</p>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default InstitutionProfile;

