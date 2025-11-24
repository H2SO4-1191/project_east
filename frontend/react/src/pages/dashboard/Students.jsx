import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaSearch,
  FaFilter,
  FaUserGraduate,
  FaSync,
  FaExclamationTriangle,
} from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import Card from '../../components/Card';
import { studentsData } from '../../data/enhancedDemoData';
import { ListEmptyState, TableSkeleton } from '../../components/Skeleton';
import { authService } from '../../services/authService';
import { useInstitute } from '../../context/InstituteContext';

const DEFAULT_PAGE_SIZE = 10;

const parseApiStudent = (student) => ({
  id: student.id,
  firstName: student.first_name || '',
  lastName: student.last_name || '',
  email: student.email,
  profileImage: student.profile_image || '',
  studyingLevel: student.studying_level || '—',
  responsiblePhone: student.responsible_phone || '—',
  active: Boolean(student.active),
});

const Students = () => {
  const navigate = useNavigate();
  const { instituteData, updateInstituteData, clearInstituteData } = useInstitute();
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterGrade, setFilterGrade] = useState('all');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isRemote, setIsRemote] = useState(false);
  const [students, setStudents] = useState(studentsData.slice(0, DEFAULT_PAGE_SIZE));
  const [pagination, setPagination] = useState({
    count: studentsData.length,
    next: null,
    previous: null,
    currentPage: 1,
  });

  const grades = useMemo(
    () => ['all', ...new Set(studentsData.map((s) => s.grade || '—'))],
    []
  );

  const fetchStudents = useCallback(
    async ({ page = 1, status = filterStatus, grade = filterGrade, search = searchTerm } = {}) => {
      if (!instituteData.accessToken) {
        return;
      }

      setIsLoading(true);
      setError('');

      const params = new URLSearchParams();
      params.set('page', page);
      if (status !== 'all') {
        params.set('active', status === 'Active' ? 'true' : 'false');
      }
      if (grade !== 'all') {
        params.set('studying_level', grade);
      }
      if (search.trim()) {
        params.set('search', search.trim());
      }

      const endpoint = params.toString()
        ? `/institution/students-list/?${params.toString()}`
        : '/institution/students-list/';

      try {
        const data = await authService.getProtected(endpoint, instituteData.accessToken, {
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
        const parsed = Array.isArray(data?.results) ? data.results.map(parseApiStudent) : [];

        setStudents(parsed);
        setIsRemote(true);
        setPagination({
          count: typeof data?.count === 'number' ? data.count : parsed.length,
          next: data?.next || null,
          previous: data?.previous || null,
          currentPage: page,
        });
      } catch (err) {
        console.error('Failed to fetch students:', err);
        setError(
          err?.message ||
            t('dashboard.studentsPage.unableToLoadStudents')
        );
        const fallback = studentsData
          .filter((student) => {
            const matchesStatus = status === 'all' || student.status === status;
            const matchesGrade = grade === 'all' || student.grade === grade;
            const matchesSearch =
              student.name.toLowerCase().includes(search.toLowerCase()) ||
              student.id.toLowerCase().includes(search.toLowerCase()) ||
              student.email.toLowerCase().includes(search.toLowerCase());
            return matchesStatus && matchesGrade && matchesSearch;
          })
          .slice(0, DEFAULT_PAGE_SIZE);
        setStudents(fallback);
        setIsRemote(false);
        setPagination({
          count: studentsData.length,
          next: null,
          previous: null,
          currentPage: 1,
        });
      } finally {
        setIsLoading(false);
      }
    },
    [filterGrade, filterStatus, instituteData.accessToken, instituteData.refreshToken, searchTerm, updateInstituteData, clearInstituteData, navigate]
  );

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  useEffect(() => {
    const handler = setTimeout(() => {
      fetchStudents({ page: 1, search: searchTerm });
    }, 400);

    return () => clearTimeout(handler);
  }, [searchTerm, fetchStudents]);

  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      const matchesSearch =
        `${student.firstName || ''} ${student.lastName || ''}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (student.id || '').toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
        (student.email || '').toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        filterStatus === 'all' ||
        (filterStatus === 'Active' && student.active) ||
        (filterStatus === 'Inactive' && !student.active);
      const matchesGrade = filterGrade === 'all' || student.studyingLevel === filterGrade;

      return matchesSearch && matchesStatus && matchesGrade;
    });
  }, [students, searchTerm, filterStatus, filterGrade]);

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">{t('dashboard.studentsPage.title')}</h2>
        <p className="text-gray-600 dark:text-gray-400">{t('dashboard.studentsPage.subtitle')}</p>
      </motion.div>

      {/* Filters and Search */}
      <Card delay={0.1}>
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder={t('dashboard.studentsPage.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-300 dark:border-navy-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all bg-white dark:bg-navy-700 text-gray-900 dark:text-white"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <FaFilter className="text-gray-400" />
            <select
              value={filterStatus}
              onChange={(e) => {
                const status = e.target.value;
                setFilterStatus(status);
                fetchStudents({ page: 1, status });
              }}
              className="px-4 py-3 border border-gray-300 dark:border-navy-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all bg-white dark:bg-navy-700 text-gray-900 dark:text-white"
            >
              <option value="all">{t('dashboard.studentsPage.allStatus')}</option>
              <option value="Active">{t('dashboard.studentsPage.active')}</option>
              <option value="Inactive">{t('dashboard.studentsPage.inactive')}</option>
            </select>
          </div>

          {/* Grade Filter */}
          <div>
            <select
              value={filterGrade}
              onChange={(e) => {
                const grade = e.target.value;
                setFilterGrade(grade);
                fetchStudents({ page: 1, grade });
              }}
              className="px-4 py-3 border border-gray-300 dark:border-navy-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all bg-white dark:bg-navy-700 text-gray-900 dark:text-white"
            >
              {grades.map((grade) => (
                <option key={grade} value={grade}>
                  {grade === 'all' ? t('dashboard.studentsPage.allGrades') : grade}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => fetchStudents({ page: pagination.currentPage })}
            className="inline-flex items-center justify-center gap-2 px-4 py-3 bg-primary-600 hover:bg-primary-500 text-white rounded-lg transition-colors disabled:opacity-60"
            disabled={isLoading}
          >
            <FaSync className={isLoading ? 'animate-spin' : ''} />
            {t('dashboard.studentsPage.refresh')}
          </button>
        </div>

        {/* Results count */}
        <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
          {t('dashboard.studentsPage.showing')}{' '}
          <span className="font-semibold text-primary-600 dark:text-teal-400">
            {filteredStudents.length}
          </span>{' '}
          {t('dashboard.studentsPage.of')}{' '}
          <span className="font-semibold text-primary-600 dark:text-teal-400">
            {pagination.count}
          </span>{' '}
          {t('dashboard.studentsPage.students')} {isRemote ? t('dashboard.studentsPage.live') : t('dashboard.studentsPage.demo')}
        </div>

        {error && (
          <div className="mt-3 flex items-center gap-2 text-sm text-amber-500 dark:text-amber-300">
            <FaExclamationTriangle />
            <span>{error}</span>
          </div>
        )}
      </Card>

      {/* Students Table */}
      <Card delay={0.2}>
        {isLoading ? (
          <TableSkeleton rows={5} columns={6} />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gradient-to-r from-primary-600 to-primary-700 dark:from-primary-700 dark:to-primary-800 text-white">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold">{t('dashboard.studentsPage.name')}</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">{t('dashboard.studentsPage.email')}</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">{t('dashboard.studentsPage.level')}</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">{t('dashboard.studentsPage.phone')}</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">{t('dashboard.studentsPage.status')}</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">{t('dashboard.studentsPage.id')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-navy-700">
                <AnimatePresence>
                  {filteredStudents.map((student, index) => (
                    <motion.tr
                      key={`${student.id || 'local'}-${student.email}`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ backgroundColor: 'rgba(59, 130, 246, 0.05)' }}
                      className="hover:shadow-md transition-all cursor-pointer"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {student.profileImage ? (
                            <img
                              src={student.profileImage}
                              alt={`${student.firstName} ${student.lastName}`}
                              className="w-10 h-10 rounded-full object-cover border border-primary-200 dark:border-teal-400/40"
                            />
                          ) : (
                            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-teal-500 rounded-full flex items-center justify-center">
                              <FaUserGraduate className="text-white" />
                            </div>
                          )}
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {`${student.firstName || ''} ${student.lastName || ''}`.trim() ||
                                student.email}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {student.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                        {student.email}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                        {student.studyingLevel}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                        {student.responsiblePhone}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            student.active
                              ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
                              : 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300'
                          }`}
                        >
                          {student.active ? t('dashboard.studentsPage.active') : t('dashboard.studentsPage.inactive')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                        {student.id || '—'}
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>

            {filteredStudents.length === 0 && (
              <ListEmptyState
                icon={FaUserGraduate}
                title={t('dashboard.studentsPage.noStudentsFound')}
                message={
                  isRemote
                    ? t('dashboard.studentsPage.tryAdjustingFilters')
                    : t('dashboard.studentsPage.noMatchesDemo')
                }
                actionLabel={t('dashboard.studentsPage.refresh')}
                onAction={() => fetchStudents({ page: 1 })}
              />
            )}
          </div>
        )}
      </Card>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 text-sm text-gray-600 dark:text-gray-400">
        <div>{isRemote ? t('dashboard.studentsPage.liveDataFromBackend') : t('dashboard.studentsPage.showingLocalDemoData')}</div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              const prev = Math.max(pagination.currentPage - 1, 1);
              setPagination((prevState) => ({ ...prevState, currentPage: prev }));
              fetchStudents({ page: prev });
            }}
            disabled={!pagination.previous || isLoading || !isRemote}
            className="px-4 py-2 border border-gray-300 dark:border-navy-600 rounded-lg hover:bg-gray-100 dark:hover:bg-navy-700 disabled:opacity-50 transition-colors"
          >
            {t('dashboard.studentsPage.previous')}
          </button>
          <span>
            {t('dashboard.studentsPage.page')}{' '}
            <span className="font-semibold text-gray-800 dark:text-white">
              {pagination.currentPage}
            </span>
          </span>
          <button
            onClick={() => {
              const next = pagination.currentPage + 1;
              setPagination((prevState) => ({ ...prevState, currentPage: next }));
              fetchStudents({ page: next });
            }}
            disabled={!pagination.next || isLoading || !isRemote}
            className="px-4 py-2 border border-gray-300 dark:border-navy-600 rounded-lg hover:bg-gray-100 dark:hover:bg-navy-700 disabled:opacity-50 transition-colors"
          >
            {t('dashboard.studentsPage.next')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Students;

