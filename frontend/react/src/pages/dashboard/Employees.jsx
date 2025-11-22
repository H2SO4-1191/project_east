import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaBriefcase, FaSearch, FaSync, FaExclamationTriangle } from 'react-icons/fa';
import Card from '../../components/Card';
import { employeesData } from '../../data/enhancedDemoData';
import { TableSkeleton, ListEmptyState } from '../../components/Skeleton';
import { useInstitute } from '../../context/InstituteContext';
import { authService } from '../../services/authService';

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
  const { instituteData, updateInstituteData } = useInstitute();
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
      setError(err?.message || 'Unable to load staff. Showing demo data.');
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

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">Staff</h2>
        <p className="text-gray-600 dark:text-gray-400">Manage non-teaching staff</p>
      </motion.div>

      {/* Search and Refresh */}
      <Card delay={0.1}>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, duty, or phone..."
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
            Refresh
          </button>
        </div>

        <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
          Showing{' '}
          <span className="font-semibold text-purple-600 dark:text-purple-400">
            {filteredStaff.length}
          </span>{' '}
          of{' '}
          <span className="font-semibold text-purple-600 dark:text-purple-400">
            {pagination.count || staff.length}
          </span>{' '}
          staff members {isRemote ? '(live)' : '(demo)'}
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
          <TableSkeleton rows={5} columns={6} />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gradient-to-r from-purple-600 to-purple-700 dark:from-purple-700 dark:to-purple-800 text-white">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Name</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">ID</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Duty</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Phone</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Salary</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Status</th>
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
                              src={member.personal_image}
                              alt={`${member.first_name} ${member.last_name}`}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center">
                              <FaBriefcase className="text-white" />
                            </div>
                          )}
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {member.first_name} {member.last_name}
                            </p>
                          </div>
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
                          {member.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>

            {filteredStaff.length === 0 && (
              <ListEmptyState
                icon={FaBriefcase}
                title="No staff found"
                message={
                  isRemote
                    ? 'Try adjusting your search. The API returned no results.'
                    : 'No matches in the demo dataset. Refresh to hit the API again.'
                }
                actionLabel="Refresh"
                onAction={() => fetchStaff({ page: 1 })}
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
              fetchStaff({ page: prev });
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
              fetchStaff({ page: next });
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

export default Staff;

