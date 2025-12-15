import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaUsers, FaChalkboardTeacher, FaBriefcase, FaNewspaper, FaInfoCircle } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import Card from '../../components/Card';
import AnimatedCounter from '../../components/AnimatedCounter';
import { studentsData, teachersData, employeesData } from '../../data/enhancedDemoData';
import { useInstitute } from '../../context/InstituteContext';
import { authService } from '../../services/authService';

const StatCard = ({ title, value, note, icon: Icon, color, delay }) => (
  <Card delay={delay} className="relative overflow-hidden">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-gray-600 dark:text-gray-400 text-sm font-medium mb-2">{title}</p>
        <p className={`text-4xl font-bold ${color}`}>
          <AnimatedCounter value={value} duration={2} />
        </p>
        {note && (
          <p className="text-xs text-amber-500 dark:text-amber-300 mt-2">
            {note}
          </p>
        )}
      </div>
      <div className={`p-4 rounded-2xl bg-gradient-to-br ${color.replace('text-', 'from-')} ${color.replace('text-', 'to-')}-600 bg-opacity-10`}>
        <Icon className={`w-8 h-8 ${color}`} />
      </div>
    </div>
    <motion.div
      className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${color.replace('text-', 'from-')} ${color.replace('text-', 'to-')}-600`}
      initial={{ scaleX: 0 }}
      animate={{ scaleX: 1 }}
      transition={{ duration: 1, delay: delay + 0.5 }}
    />
  </Card>
);

const Overview = () => {
  const navigate = useNavigate();
  const { instituteData, updateInstituteData, clearInstituteData } = useInstitute();
  const { t } = useTranslation();
  const [statsState, setStatsState] = useState({
    totalStudents: { value: studentsData.length },
    totalLecturers: { value: teachersData.length },
    totalStaff: { value: employeesData.length },
    activeStudents: { value: studentsData.filter(s => s.status === 'Active').length },
    activeLecturers: { value: teachersData.filter(t => t.status === 'Active').length },
    activeStaff: { value: employeesData.filter(e => e.status === 'Active').length },
    loading: false,
    error: '',
  });
  const [posts, setPosts] = useState([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(false);
  const [postsError, setPostsError] = useState('');
  const [username, setUsername] = useState(null);

  const displayName =
    username ||
    instituteData.username ||
    instituteData.firstName ||
    instituteData.name ||
    'there';
  const statCards = useMemo(() => ([
    {
      title: t('dashboard.overviewPage.totalStudents'),
      value: statsState.totalStudents.value,
      note: statsState.totalStudents.error && t('dashboard.overviewPage.showingLocalTotals'),
      icon: FaUsers,
      color: 'text-blue-600',
      delay: 0,
    },
    {
      title: t('dashboard.overviewPage.activeStudents'),
      value: statsState.activeStudents.value,
      note: statsState.activeStudents.error && t('dashboard.overviewPage.usingFallbackActive'),
      icon: FaUsers,
      color: 'text-indigo-600',
      delay: 0.05,
    },
    {
      title: t('dashboard.overviewPage.totalLecturers'),
      value: statsState.totalLecturers.value,
      note: statsState.totalLecturers.error && t('dashboard.overviewPage.showingLocalTotals'),
      icon: FaChalkboardTeacher,
      color: 'text-teal-600',
      delay: 0.1,
    },
    {
      title: t('dashboard.overviewPage.activeLecturers'),
      value: statsState.activeLecturers.value,
      note: statsState.activeLecturers.error && t('dashboard.overviewPage.usingFallbackActive'),
      icon: FaChalkboardTeacher,
      color: 'text-emerald-600',
      delay: 0.15,
    },
    {
      title: t('dashboard.overviewPage.totalStaff'),
      value: statsState.totalStaff.value,
      note: statsState.totalStaff.error && t('dashboard.overviewPage.showingLocalTotals'),
      icon: FaBriefcase,
      color: 'text-purple-600',
      delay: 0.2,
    },
    {
      title: t('dashboard.overviewPage.activeStaff'),
      value: statsState.activeStaff.value,
      note: statsState.activeStaff.error && t('dashboard.overviewPage.usingFallbackActive'),
      icon: FaBriefcase,
      color: 'text-rose-600',
      delay: 0.25,
    },
  ]), [
    statsState.totalStudents.value,
    statsState.activeStudents.value,
    statsState.totalLecturers.value,
    statsState.activeLecturers.value,
    statsState.totalStaff.value,
    statsState.activeStaff.value,
  ]);

  useEffect(() => {
    let isMounted = true;

    const fetchTotals = async () => {
      if (!instituteData.accessToken) {
        return;
      }
      setStatsState(prev => ({ ...prev, loading: true, error: '' }));

      try {
        // Fetch verification status on dashboard load
        if (instituteData.email && instituteData.userType === 'institution' && instituteData.accessToken) {
          try {
            const verificationStatus = await authService.checkVerificationStatus(
              instituteData.email,
              instituteData.accessToken
            );
            if (isMounted && verificationStatus?.is_verified !== instituteData.isVerified) {
              updateInstituteData({
                isVerified: verificationStatus?.is_verified || false,
              });
            }
          } catch (verifyErr) {
            console.warn('Failed to check verification status on dashboard load:', verifyErr);
          }
        }

        const results = await authService.getDashboardStats(instituteData.accessToken, {
          refreshToken: instituteData.refreshToken,
          onTokenRefreshed: (tokens) =>
            updateInstituteData({
              accessToken: tokens.access,
              refreshToken: tokens.refresh || instituteData.refreshToken,
            }),
          onSessionExpired: () => {
            clearInstituteData();
            navigate('/login', { replace: true });
          },
        });
        if (!isMounted) return;

        const safeNumber = (value, fallback) =>
          typeof value === 'number' && Number.isFinite(value) ? value : fallback;

        setStatsState({
          totalStudents: {
            value: safeNumber(results.totalStudents?.total_students, studentsData.length),
            error: results.totalStudents?.error || '',
          },
          totalLecturers: {
            value: safeNumber(results.totalLecturers?.total_lecturers, teachersData.length),
            error: results.totalLecturers?.error || '',
          },
          totalStaff: {
            value: safeNumber(results.totalStaff?.total_staff, employeesData.length),
            error: results.totalStaff?.error || '',
          },
          activeStudents: {
            value: safeNumber(results.activeStudents?.active_students, studentsData.filter(s => s.status === 'Active').length),
            error: results.activeStudents?.error || '',
          },
          activeLecturers: {
            value: safeNumber(results.activeLecturers?.active_lecturers, teachersData.filter(t => t.status === 'Active').length),
            error: results.activeLecturers?.error || '',
          },
          activeStaff: {
            value: safeNumber(results.activeStaff?.active_staff, employeesData.filter(e => e.status === 'Active').length),
            error: results.activeStaff?.error || '',
          },
          loading: false,
          error: '',
        });
      } catch (error) {
        console.error('Failed to fetch total students:', error);
        if (!isMounted) return;
        setStatsState(prev => ({
          ...prev,
          loading: false,
          error: error?.message || t('dashboard.overviewPage.unableToLoadTotals'),
        }));
      }
    };

    fetchTotals();

    return () => {
      isMounted = false;
    };
  }, [instituteData.accessToken, instituteData.refreshToken, updateInstituteData, clearInstituteData, navigate]);

  // Fetch institution profile to get the correct username
  useEffect(() => {
    let isMounted = true;

    const fetchInstitutionProfile = async () => {
      if (!instituteData.isAuthenticated || !instituteData.accessToken) {
        return;
      }

      try {
        const data = await authService.getInstitutionProfile(instituteData.accessToken, {
          refreshToken: instituteData.refreshToken,
          onTokenRefreshed: (tokens) => {
            updateInstituteData({
              accessToken: tokens.access,
              refreshToken: tokens.refresh || instituteData.refreshToken,
            });
          },
          onSessionExpired: () => {
            clearInstituteData();
            navigate('/login', { replace: true });
          },
        });

        if (isMounted && data?.success && data?.data?.username) {
          setUsername(data.data.username);
        }
      } catch (err) {
        console.error('Error fetching institution profile:', err);
      }
    };

    fetchInstitutionProfile();

    return () => {
      isMounted = false;
    };
  }, [instituteData.isAuthenticated, instituteData.accessToken, instituteData.refreshToken, updateInstituteData, clearInstituteData, navigate]);

  // Fetch institution posts
  useEffect(() => {
    let isMounted = true;

    const fetchPosts = async () => {
      // Use the username from profile API (correct public username), not instituteData.username (which might be email)
      const usernameToUse = username || instituteData.username;
      if (!usernameToUse) {
        return;
      }

      setIsLoadingPosts(true);
      setPostsError('');

      try {
        const response = await authService.getInstitutionPosts(usernameToUse);
        if (!isMounted) return;

        if (response && response.results) {
          setPosts(response.results || []);
        } else if (Array.isArray(response)) {
          setPosts(response);
        } else {
          setPosts([]);
        }
      } catch (error) {
        console.error('Failed to fetch posts:', error);
        if (!isMounted) return;
        setPostsError(error?.message || t('dashboard.overviewPage.failedToLoadPosts'));
        setPosts([]);
      } finally {
        if (isMounted) {
          setIsLoadingPosts(false);
        }
      }
    };

    fetchPosts();

    return () => {
      isMounted = false;
    };
  }, [username, instituteData.username, t]);

  // Helper function to convert relative image URLs to full URLs
  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }
    const baseUrl = import.meta.env.VITE_API_BASE_URL?.replace(/\/+$/, '') || 'http://127.0.0.1:8000';
    let cleanPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
    cleanPath = cleanPath.replace(/^\/media\/media\//, '/media/');
    return `${baseUrl}${cleanPath}`;
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(date);
    } catch (error) {
      return dateString;
    }
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">{t('dashboard.overviewPage.title')}</h2>
            <div>
              <p className="text-gray-600 dark:text-gray-400">
                {t('dashboard.overviewPage.welcomeBack')}, {displayName}
              </p>
              {instituteData.email && (
                <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">@{instituteData.email}</p>
              )}
            </div>
          </div>
          
          {/* Syncing/Error Status in Navigation */}
          <div className="flex flex-col items-end gap-1">
            {statsState.loading && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-2 text-sm text-primary-600 dark:text-teal-400 bg-primary-50 dark:bg-primary-900/20 px-3 py-2 rounded-lg"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-4 h-4 border-2 border-primary-600 dark:border-teal-400 border-t-transparent rounded-full"
                />
                <span>{t('dashboard.overviewPage.syncing')}</span>
              </motion.div>
            )}

            {statsState.error && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-sm text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg max-w-xs text-right"
              >
                {statsState.error}
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>

      {/* Institution Posts or verification message */}
      {!instituteData.isVerified ? (
        <Card delay={0.4}>
          <div className="flex items-start gap-4 p-6 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
            <FaInfoCircle className="w-6 h-6 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-amber-900 dark:text-amber-200 mb-2">
                {t('dashboard.overviewPage.verificationRequired')}
          </h3>
              <p className="text-amber-800 dark:text-amber-300">
                {t('dashboard.overviewPage.verificationMessage')}
              </p>
            </div>
          </div>
        </Card>
      ) : (
        <Card delay={0.4}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white flex items-center gap-2">
              <FaNewspaper className="text-blue-600 dark:text-blue-400" />
              {t('dashboard.overviewPage.institutionPosts')}
          </h3>
      </div>

          {isLoadingPosts ? (
            <div className="flex items-center justify-center py-12">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-8 h-8 border-4 border-blue-600 dark:border-blue-400 border-t-transparent rounded-full"
              />
            </div>
          ) : postsError ? (
            <div className="text-center py-12">
              <p className="text-red-500 dark:text-red-400">{postsError}</p>
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-12">
              <FaNewspaper className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">{t('dashboard.overviewPage.noPosts')}</p>
            </div>
          ) : (
        <div className="space-y-4">
              {posts.map((post, index) => (
            <motion.div
                  key={post.id || index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-6 bg-gray-50 dark:bg-navy-900 rounded-lg hover:bg-gray-100 dark:hover:bg-navy-800 transition-colors border border-gray-200 dark:border-navy-700"
            >
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <h4 className="text-lg font-semibold text-gray-800 dark:text-white flex-1">
                      {post.title}
                    </h4>
                    <span className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                      {formatDate(post.created_at)}
                    </span>
                </div>
                  
                  {post.description && (
                    <p className="text-gray-600 dark:text-gray-300 mb-4">
                      {post.description}
                    </p>
                  )}

                  {post.images && post.images.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
                      {post.images.map((img, imgIndex) => {
                        const imageUrl = getImageUrl(img.image || img);
                        if (!imageUrl) return null;
                        return (
                          <motion.img
                            key={imgIndex}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: (index * 0.1) + (imgIndex * 0.05) }}
                            src={imageUrl}
                            alt={`${post.title} - Image ${imgIndex + 1}`}
                            className="w-full h-48 object-cover rounded-lg border border-gray-200 dark:border-navy-700"
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                        );
                      })}
              </div>
                  )}
            </motion.div>
          ))}
        </div>
          )}
      </Card>
      )}
    </div>
  );
};

export default Overview;

