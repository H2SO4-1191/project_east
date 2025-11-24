import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { FaUsers, FaChalkboardTeacher, FaBriefcase } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import Card from '../../components/Card';
import AnimatedCounter from '../../components/AnimatedCounter';
import { studentsData, teachersData, employeesData, activityData, revenueData } from '../../data/enhancedDemoData';
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

  const displayName =
    instituteData.firstName ||
    instituteData.name ||
    instituteData.username ||
    instituteData.email ||
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

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">{t('dashboard.overviewPage.title')}</h2>
            <p className="text-gray-600 dark:text-gray-400">
              {t('dashboard.overviewPage.welcomeBack')}, {displayName}
            </p>
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

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activity Chart */}
        <Card delay={0.4}>
          <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
            {t('dashboard.overviewPage.weeklyActivity')}
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={activityData}>
              <defs>
                <linearGradient id="colorStudents" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorTeachers" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#14b8a6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-navy-700" />
              <XAxis dataKey="day" className="text-gray-600 dark:text-gray-400" />
              <YAxis className="text-gray-600 dark:text-gray-400" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.9)', 
                  border: 'none', 
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                }} 
              />
              <Legend />
              <Area type="monotone" dataKey="students" stroke="#3b82f6" fillOpacity={1} fill="url(#colorStudents)" />
              <Area type="monotone" dataKey="teachers" stroke="#14b8a6" fillOpacity={1} fill="url(#colorTeachers)" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        {/* Revenue Chart */}
        <Card delay={0.5}>
          <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
            {t('dashboard.overviewPage.revenueVsExpenses')}
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-navy-700" />
              <XAxis dataKey="month" className="text-gray-600 dark:text-gray-400" />
              <YAxis className="text-gray-600 dark:text-gray-400" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.9)', 
                  border: 'none', 
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                }} 
              />
              <Legend />
              <Line type="monotone" dataKey="revenue" stroke="#f59e0b" strokeWidth={3} dot={{ r: 5 }} />
              <Line type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={3} dot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card delay={0.6}>
        <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
          {t('dashboard.overviewPage.recentActivity')}
        </h3>
        <div className="space-y-4">
          {[
            { action: t('dashboard.overviewPage.newStudentEnrolled'), name: 'Yasmin Ali', time: '2 hours ago', color: 'text-blue-600' },
            { action: t('dashboard.overviewPage.teacherUpdatedProfile'), name: 'Dr. Sarah Khan', time: '4 hours ago', color: 'text-teal-600' },
            { action: t('dashboard.overviewPage.paymentReceived'), name: 'Ahmed Hassan', time: '6 hours ago', color: 'text-gold-600' },
            { action: t('dashboard.overviewPage.scheduleUpdated'), name: 'Grade 10-A', time: '8 hours ago', color: 'text-purple-600' },
          ].map((activity, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7 + index * 0.1 }}
              className="flex items-center justify-between p-4 bg-gray-50 dark:bg-navy-900 rounded-lg hover:bg-gray-100 dark:hover:bg-navy-800 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${activity.color.replace('text-', 'bg-')}`} />
                <div>
                  <p className="text-gray-800 dark:text-white font-medium">{activity.action}</p>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">{activity.name}</p>
                </div>
              </div>
              <span className="text-gray-500 dark:text-gray-500 text-sm">{activity.time}</span>
            </motion.div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default Overview;

