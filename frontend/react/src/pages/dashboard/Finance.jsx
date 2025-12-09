import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaDollarSign, FaFileInvoiceDollar, FaCreditCard, FaPlus, FaEdit, FaTimes, FaBook, FaClock, FaUsers } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import Card from '../../components/Card';
import AnimatedCounter from '../../components/AnimatedCounter';
import AnimatedButton from '../../components/AnimatedButton';
import Modal from '../../components/Modal';
import toast from 'react-hot-toast';
import { useInstitute } from '../../context/InstituteContext';
import VerificationLock from '../../components/VerificationLock';

const Finance = () => {
  const { instituteData } = useInstitute();
  const { t } = useTranslation();
  const [showCreateCourseModal, setShowCreateCourseModal] = useState(false);
  const [showEditCoursesModal, setShowEditCoursesModal] = useState(false);
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  
  // Create course form state
  const [createForm, setCreateForm] = useState({
    title: '',
    code: '',
    credits: '',
    duration: '',
    capacity: '',
    price: '',
    description: '',
  });

  // Edit course form state
  const [editForm, setEditForm] = useState({
    title: '',
    code: '',
    credits: '',
    duration: '',
    capacity: '',
    price: '',
    description: '',
  });

  const handleCreateChange = (e) => {
    const { name, value } = e.target;
    setCreateForm(prev => ({ ...prev, [name]: value }));
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({ ...prev, [name]: value }));
  };

  const handleCreateCourse = (e) => {
    e.preventDefault();
    
    // Validate form
    if (!createForm.title || !createForm.code || !createForm.price) {
      toast.error(t('dashboard.financePage.fillAllRequired'));
      return;
    }

    const newCourse = {
      id: Date.now(),
      ...createForm,
      createdAt: new Date().toISOString(),
    };

    setCourses(prev => [...prev, newCourse]);
    toast.success(t('dashboard.financePage.courseCreatedSuccess'));
    setShowCreateCourseModal(false);
    setCreateForm({
      title: '',
      code: '',
      credits: '',
      duration: '',
      capacity: '',
      price: '',
      description: '',
    });
  };

  const handleEditCourse = (course) => {
    setSelectedCourse(course);
    setEditForm(course);
  };

  const handleUpdateCourse = (e) => {
    e.preventDefault();
    
    setCourses(prev => prev.map(c => 
      c.id === selectedCourse.id ? { ...c, ...editForm } : c
    ));
    
    toast.success(t('dashboard.financePage.courseUpdatedSuccess'));
    setSelectedCourse(null);
    setEditForm({
      title: '',
      code: '',
      credits: '',
      duration: '',
      capacity: '',
      price: '',
      description: '',
    });
  };

  const handleDeleteCourse = (courseId) => {
    if (window.confirm(t('dashboard.financePage.deleteCourseConfirm'))) {
      setCourses(prev => prev.filter(c => c.id !== courseId));
      toast.success(t('dashboard.financePage.courseDeletedSuccess'));
      setSelectedCourse(null);
    }
  };

  // Show verification lock if not verified
  if (!instituteData.isVerified) {
    return <VerificationLock />;
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">{t('dashboard.financePage.title')}</h2>
        <p className="text-gray-600 dark:text-gray-400">{t('dashboard.financePage.subtitle')}</p>
      </motion.div>

      {/* Stats - All Zero */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card delay={0.1} className="relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm font-medium mb-2">{t('dashboard.financePage.totalRevenue')}</p>
              <p className="text-4xl font-bold text-green-600">
                $<AnimatedCounter value={0} duration={2} />
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-gradient-to-br from-green-500 to-green-600 bg-opacity-10">
              <FaDollarSign className="w-8 h-8 text-green-600" />
            </div>
          </div>
        </Card>

        <Card delay={0.2} className="relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm font-medium mb-2">{t('dashboard.financePage.pendingPayments')}</p>
              <p className="text-4xl font-bold text-orange-600">
                $<AnimatedCounter value={0} duration={2} />
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 bg-opacity-10">
              <FaFileInvoiceDollar className="w-8 h-8 text-orange-600" />
            </div>
          </div>
        </Card>

        <Card delay={0.3} className="relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm font-medium mb-2">{t('dashboard.financePage.totalInvoices')}</p>
              <p className="text-4xl font-bold text-blue-600">
                <AnimatedCounter value={0} duration={2} />
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 bg-opacity-10">
              <FaCreditCard className="w-8 h-8 text-blue-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Zero Balance Message */}
      <Card delay={0.4}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="text-center py-16"
        >
          <motion.div
            animate={{ 
              scale: [1, 1.1, 1],
              rotate: [0, 5, -5, 0]
            }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              repeatDelay: 1
            }}
            className="inline-block mb-6"
          >
            <div className="w-24 h-24 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-navy-700 dark:to-navy-600 rounded-full flex items-center justify-center mx-auto">
              <FaDollarSign className="w-12 h-12 text-gray-400 dark:text-gray-500" />
            </div>
          </motion.div>
          
          <motion.h3
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="text-2xl font-bold text-gray-800 dark:text-white mb-3"
          >
            {t('dashboard.financePage.noFundsAvailable')}
          </motion.h3>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            className="text-gray-600 dark:text-gray-400 text-lg max-w-md mx-auto"
          >
            {t('dashboard.financePage.zeroBalanceMessage')}
          </motion.p>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.1 }}
            className="text-gray-500 dark:text-gray-500 text-sm mt-4"
          >
            {t('dashboard.financePage.startCreatingCourses')}
          </motion.p>
        </motion.div>
      </Card>

      {/* Courses List */}
      {courses.length > 0 && (
        <Card delay={0.5}>
          <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
            {t('dashboard.financePage.yourCourses')}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {courses.map((course, index) => (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="p-4 border-2 border-gray-200 dark:border-navy-700 rounded-lg hover:border-primary-500 dark:hover:border-teal-500 transition-all cursor-pointer"
                onClick={() => handleEditCourse(course)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-800 dark:text-white mb-1">{course.title}</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{course.code}</p>
                  </div>
                  <span className="px-3 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-full text-xs font-semibold">
                    ${course.price}
                  </span>
                </div>
                
                <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  {course.credits && (
                    <div className="flex items-center gap-2">
                      <FaBook className="text-primary-600 dark:text-teal-400" />
                      <span>{course.credits} {t('dashboard.financePage.credits')}</span>
                    </div>
                  )}
                  {course.duration && (
                    <div className="flex items-center gap-2">
                      <FaClock className="text-primary-600 dark:text-teal-400" />
                      <span>{course.duration}</span>
                    </div>
                  )}
                  {course.capacity && (
                    <div className="flex items-center gap-2">
                      <FaUsers className="text-primary-600 dark:text-teal-400" />
                      <span>{t('dashboard.financePage.maxStudents')} {course.capacity}</span>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </Card>
      )}

      {/* Create Course Modal */}
      <Modal
        isOpen={showCreateCourseModal}
        onClose={() => setShowCreateCourseModal(false)}
        title={t('dashboard.financePage.createNewCourse')}
      >
        <form onSubmit={handleCreateCourse} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
                {t('dashboard.financePage.courseTitle')}
              </label>
              <input
                type="text"
                name="title"
                value={createForm.title}
                onChange={handleCreateChange}
                className="w-full px-4 py-3 border border-gray-300 dark:border-navy-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-navy-700 text-gray-900 dark:text-white"
                placeholder={t('dashboard.financePage.courseTitlePlaceholder')}
                required
              />
            </div>

            <div>
              <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
                {t('dashboard.financePage.courseCode')}
              </label>
              <input
                type="text"
                name="code"
                value={createForm.code}
                onChange={handleCreateChange}
                className="w-full px-4 py-3 border border-gray-300 dark:border-navy-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-navy-700 text-gray-900 dark:text-white"
                placeholder={t('dashboard.financePage.courseCodePlaceholder')}
                required
              />
            </div>

            <div>
              <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
                {t('dashboard.financePage.credits')}
              </label>
              <input
                type="number"
                name="credits"
                value={createForm.credits}
                onChange={handleCreateChange}
                className="w-full px-4 py-3 border border-gray-300 dark:border-navy-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-navy-700 text-gray-900 dark:text-white"
                placeholder={t('dashboard.financePage.creditsPlaceholder')}
              />
            </div>

            <div>
              <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
                {t('dashboard.financePage.duration')}
              </label>
              <input
                type="text"
                name="duration"
                value={createForm.duration}
                onChange={handleCreateChange}
                className="w-full px-4 py-3 border border-gray-300 dark:border-navy-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-navy-700 text-gray-900 dark:text-white"
                placeholder={t('dashboard.financePage.durationPlaceholder')}
              />
            </div>

            <div>
              <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
                {t('dashboard.financePage.capacity')}
              </label>
              <input
                type="number"
                name="capacity"
                value={createForm.capacity}
                onChange={handleCreateChange}
                className="w-full px-4 py-3 border border-gray-300 dark:border-navy-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-navy-700 text-gray-900 dark:text-white"
                placeholder={t('dashboard.financePage.capacityPlaceholder')}
              />
            </div>

            <div>
              <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
                {t('dashboard.financePage.price')}
              </label>
              <input
                type="number"
                name="price"
                value={createForm.price}
                onChange={handleCreateChange}
                className="w-full px-4 py-3 border border-gray-300 dark:border-navy-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-navy-700 text-gray-900 dark:text-white"
                placeholder={t('dashboard.financePage.pricePlaceholder')}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
              {t('dashboard.financePage.description')}
            </label>
            <textarea
              name="description"
              value={createForm.description}
              onChange={handleCreateChange}
              rows="4"
              className="w-full px-4 py-3 border border-gray-300 dark:border-navy-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-navy-700 text-gray-900 dark:text-white resize-none"
              placeholder={t('dashboard.financePage.descriptionPlaceholder')}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <AnimatedButton type="submit" className="flex-1">
              {t('dashboard.financePage.createCourse')}
            </AnimatedButton>
            <AnimatedButton
              type="button"
              variant="secondary"
              onClick={() => setShowCreateCourseModal(false)}
              className="flex-1"
            >
              {t('dashboard.financePage.cancel')}
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
        title={selectedCourse ? t('dashboard.financePage.editCourse') : t('dashboard.financePage.manageCourses')}
      >
        {!selectedCourse ? (
          <div className="space-y-3">
            {courses.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 dark:text-gray-400">
                  {t('dashboard.financePage.noCoursesAvailable')}
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
                  {t('dashboard.financePage.courseTitle')}
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
                  {t('dashboard.financePage.courseCode')}
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
                  {t('dashboard.financePage.credits')}
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
                  {t('dashboard.financePage.duration')}
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
                  {t('dashboard.financePage.capacity')}
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
                  {t('dashboard.financePage.price')}
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
                {t('dashboard.financePage.description')}
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
                {t('dashboard.financePage.updateCourse')}
              </AnimatedButton>
              <AnimatedButton
                type="button"
                variant="secondary"
                onClick={() => handleDeleteCourse(selectedCourse.id)}
                className="flex-1 bg-red-600 hover:bg-red-500"
              >
                {t('dashboard.financePage.deleteCourse')}
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
    </div>
  );
};

export default Finance;
