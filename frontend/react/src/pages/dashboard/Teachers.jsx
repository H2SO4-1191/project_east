import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaChalkboardTeacher, FaEnvelope, FaPhone, FaSearch, FaSync, FaExclamationTriangle } from 'react-icons/fa';
import Card from '../../components/Card';
import { teachersData } from '../../data/enhancedDemoData';
import { TableSkeleton, ListEmptyState } from '../../components/Skeleton';
import { useInstitute } from '../../context/InstituteContext';
import { authService } from '../../services/authService';
import toast from 'react-hot-toast';

const FALLBACK_LECTURERS = teachersData.map((t) => ({
  id: t.id,
  first_name: t.name.split(' ')[0] || '',
  last_name: t.name.split(' ').slice(1).join(' ') || '',
  email: t.email,
  profile_image: null,
  specialty: t.subject,
  experience: parseInt(t.experience) || 0,
  active: t.status === 'Active',
  phone_number: t.phone || '',
}));

const Lecturers = () => {
  const { instituteData, updateInstituteData } = useInstitute();
  const [lecturers, setLecturers] = useState(FALLBACK_LECTURERS);
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

  const fetchLecturers = async ({ page = 1 } = {}) => {
    if (!instituteData.accessToken) return;

    setIsLoading(true);
    setError('');

    try {
      const params = new URLSearchParams({ page: page.toString() });
      const response = await authService.getProtected(
        `/institution/lecturers-list/?${params}`,
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

      setLecturers(response.results || []);
      setPagination({
        count: response.count || 0,
        next: response.next,
        previous: response.previous,
        currentPage: page,
      });
      setIsRemote(true);
    } catch (err) {
      console.error('Failed to fetch lecturers:', err);
      setError(err?.message || 'Unable to load lecturers. Showing demo data.');
      setLecturers(FALLBACK_LECTURERS);
      setIsRemote(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLecturers({ page: 1 });
  }, [instituteData.accessToken]);

  const filteredLecturers = useMemo(() => {
    return lecturers.filter((lecturer) => {
      const fullName = `${lecturer.first_name} ${lecturer.last_name}`.toLowerCase();
      const search = searchTerm.toLowerCase();
      return (
        fullName.includes(search) ||
        (lecturer.email || '').toLowerCase().includes(search) ||
        (lecturer.specialty || '').toLowerCase().includes(search)
      );
    });
  }, [lecturers, searchTerm]);

  const handleQuickAction = (action, lecturer) => {
    toast.success(`${action} for ${lecturer.first_name} ${lecturer.last_name}`);
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">Lecturers</h2>
        <p className="text-gray-600 dark:text-gray-400">Manage your teaching staff</p>
      </motion.div>

      {/* Search and Refresh */}
      <Card delay={0.1}>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, email, or specialty..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-300 dark:border-navy-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all bg-white dark:bg-navy-700 text-gray-900 dark:text-white"
            />
          </div>

          <button
            onClick={() => fetchLecturers({ page: pagination.currentPage })}
            className="inline-flex items-center justify-center gap-2 px-4 py-3 bg-teal-600 hover:bg-teal-500 text-white rounded-lg transition-colors disabled:opacity-60"
            disabled={isLoading}
          >
            <FaSync className={isLoading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
          Showing{' '}
          <span className="font-semibold text-teal-600 dark:text-teal-400">
            {filteredLecturers.length}
          </span>{' '}
          of{' '}
          <span className="font-semibold text-teal-600 dark:text-teal-400">
            {pagination.count || lecturers.length}
          </span>{' '}
          lecturers {isRemote ? '(live)' : '(demo)'}
        </div>

        {error && (
          <div className="mt-3 flex items-center gap-2 text-sm text-amber-500 dark:text-amber-300">
            <FaExclamationTriangle />
            <span>{error}</span>
          </div>
        )}
      </Card>

      {/* Lecturers Table */}
      <Card delay={0.2}>
        {isLoading ? (
          <TableSkeleton rows={5} columns={7} />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gradient-to-r from-teal-600 to-teal-700 dark:from-teal-700 dark:to-teal-800 text-white">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Name</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">ID</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Specialty</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Experience</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Phone</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-navy-700">
                <AnimatePresence>
                  {filteredLecturers.map((lecturer, index) => (
                    <motion.tr
                      key={`${lecturer.id || 'local'}-${lecturer.email}`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ backgroundColor: 'rgba(20, 184, 166, 0.05)' }}
                      className="hover:shadow-md transition-all"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {lecturer.profile_image ? (
                            <img
                              src={lecturer.profile_image}
                              alt={`${lecturer.first_name} ${lecturer.last_name}`}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-teal-600 rounded-full flex items-center justify-center">
                              <FaChalkboardTeacher className="text-white" />
                            </div>
                          )}
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {lecturer.first_name} {lecturer.last_name}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {lecturer.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                        {lecturer.id || '—'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                        {lecturer.specialty || '—'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                        {lecturer.experience ? `${lecturer.experience} years` : '—'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                        {lecturer.phone_number || '—'}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            lecturer.active
                              ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
                              : 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300'
                          }`}
                        >
                          {lecturer.active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleQuickAction('Email sent', lecturer)}
                            className="p-2 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                            title="Send Email"
                          >
                            <FaEnvelope />
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleQuickAction('Call initiated', lecturer)}
                            className="p-2 bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-300 rounded-lg hover:bg-green-200 dark:hover:bg-green-800 transition-colors"
                            title="Call"
                          >
                            <FaPhone />
                          </motion.button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>

            {filteredLecturers.length === 0 && (
              <ListEmptyState
                icon={FaChalkboardTeacher}
                title="No lecturers found"
                message={
                  isRemote
                    ? 'Try adjusting your search. The API returned no results.'
                    : 'No matches in the demo dataset. Refresh to hit the API again.'
                }
                actionLabel="Refresh"
                onAction={() => fetchLecturers({ page: 1 })}
              />
            )}
          </div>
        )}
      </Card>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 text-sm text-gray-600 dark:text-gray-400">
        <div>{isRemote ? 'Live data from backend.' : 'Showing local demo data.'}</div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              const prev = Math.max(pagination.currentPage - 1, 1);
              setPagination((prevState) => ({ ...prevState, currentPage: prev }));
              fetchLecturers({ page: prev });
            }}
            disabled={!pagination.previous || isLoading || !isRemote}
            className="px-4 py-2 border border-gray-300 dark:border-navy-600 rounded-lg hover:bg-gray-100 dark:hover:bg-navy-700 disabled:opacity-50 transition-colors"
          >
            Previous
          </button>
          <span>
            Page{' '}
            <span className="font-semibold text-gray-800 dark:text-white">
              {pagination.currentPage}
            </span>
          </span>
          <button
            onClick={() => {
              const next = pagination.currentPage + 1;
              setPagination((prevState) => ({ ...prevState, currentPage: next }));
              fetchLecturers({ page: next });
            }}
            disabled={!pagination.next || isLoading || !isRemote}
            className="px-4 py-2 border border-gray-300 dark:border-navy-600 rounded-lg hover:bg-gray-100 dark:hover:bg-navy-700 disabled:opacity-50 transition-colors"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default Lecturers;

