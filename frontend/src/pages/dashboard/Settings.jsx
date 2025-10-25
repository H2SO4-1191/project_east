import { useState } from 'react';
import { motion } from 'framer-motion';
import { FaUniversity, FaCreditCard, FaCheck, FaTimes } from 'react-icons/fa';
import Card from '../../components/Card';
import AnimatedButton from '../../components/AnimatedButton';
import Modal from '../../components/Modal';
import { useInstitute } from '../../context/InstituteContext';
import toast from 'react-hot-toast';
import confetti from 'canvas-confetti';

const Settings = () => {
  const { instituteData, updateInstituteData } = useInstitute();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  const subscriptionPlans = [
    { value: '1month', label: '1 Month', price: 99 },
    { value: '3months', label: '3 Months', price: 249, save: '15%' },
    { value: '6months', label: '6 Months', price: 449, save: '25%' },
    { value: '1year', label: '1 Year', price: 799, save: '35%' },
  ];

  const currentPlan = subscriptionPlans.find(p => p.value === instituteData.subscription);

  const handleUpgrade = (newPlan) => {
    updateInstituteData({
      subscription: newPlan.value,
      subscriptionLabel: newPlan.label,
    });
    setShowUpgradeModal(false);
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    });
    toast.success('Subscription upgraded successfully!');
  };

  const handleCancelSubscription = () => {
    toast.success('Subscription cancelled (Demo only)');
    setShowCancelModal(false);
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">Settings</h2>
        <p className="text-gray-600 dark:text-gray-400">Manage your institute profile and subscription</p>
      </motion.div>

      {/* Institute Profile */}
      <Card delay={0.1}>
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-primary-600 to-teal-500 rounded-2xl flex items-center justify-center">
            <FaUniversity className="w-8 h-8 text-white" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-gray-800 dark:text-white">
              {instituteData.name}
            </h3>
            <p className="text-gray-600 dark:text-gray-400">{instituteData.email}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
              Institute Name
            </label>
            <input
              type="text"
              value={instituteData.name}
              onChange={(e) => updateInstituteData({ name: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 dark:border-navy-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all bg-white dark:bg-navy-700 text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={instituteData.email}
              onChange={(e) => updateInstituteData({ email: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 dark:border-navy-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all bg-white dark:bg-navy-700 text-gray-900 dark:text-white"
            />
          </div>
        </div>

        <div className="mt-6">
          <AnimatedButton onClick={() => toast.success('Profile updated!')}>
            Save Changes
          </AnimatedButton>
        </div>
      </Card>

      {/* Subscription Info */}
      <Card delay={0.2}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-gold-500 to-gold-600 rounded-2xl flex items-center justify-center">
              <FaCreditCard className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-800 dark:text-white">
                Subscription
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Current Plan: <span className="font-semibold text-primary-600 dark:text-teal-400">
                  {instituteData.subscriptionLabel || '1 Year'}
                </span>
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-gray-800 dark:text-white">
              ${currentPlan?.price || 799}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">per period</p>
          </div>
        </div>

        <div className="space-y-4 mb-6">
          <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
            <FaCheck className="text-green-600" />
            <span>Unlimited Students & Teachers</span>
          </div>
          <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
            <FaCheck className="text-green-600" />
            <span>Advanced Analytics & Reports</span>
          </div>
          <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
            <FaCheck className="text-green-600" />
            <span>Priority Support</span>
          </div>
          <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
            <FaCheck className="text-green-600" />
            <span>Custom Branding</span>
          </div>
        </div>

        <div className="flex gap-4">
          <AnimatedButton
            onClick={() => setShowUpgradeModal(true)}
            variant="teal"
          >
            Upgrade Plan
          </AnimatedButton>
          <AnimatedButton
            onClick={() => setShowCancelModal(true)}
            variant="danger"
          >
            Cancel Subscription
          </AnimatedButton>
        </div>
      </Card>

      {/* Payment Method */}
      <Card delay={0.3}>
        <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
          Payment Method
        </h3>
        <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-navy-900 rounded-lg">
          <FaCreditCard className="w-8 h-8 text-primary-600 dark:text-teal-400" />
          <div>
            <p className="font-semibold text-gray-800 dark:text-white">
              {instituteData.paymentMethodLabel || 'Credit Card'}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Last updated: {new Date(instituteData.registrationDate).toLocaleDateString()}
            </p>
          </div>
        </div>
      </Card>

      {/* Upgrade Modal */}
      <Modal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        title="Upgrade Subscription"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {subscriptionPlans.map((plan) => (
            <motion.div
              key={plan.value}
              whileHover={{ scale: 1.02 }}
              onClick={() => handleUpgrade(plan)}
              className={`
                relative p-6 rounded-xl border-2 cursor-pointer transition-all
                ${plan.value === instituteData.subscription
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 opacity-50 cursor-not-allowed'
                  : 'border-gray-200 dark:border-navy-700 hover:border-primary-400'
                }
              `}
            >
              {plan.value === instituteData.subscription && (
                <div className="absolute top-2 right-2 px-2 py-1 bg-primary-500 text-white text-xs rounded-full">
                  Current
                </div>
              )}
              <div className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {plan.label}
              </div>
              <div className="text-3xl font-bold text-primary-600 dark:text-primary-400 mb-2">
                ${plan.price}
              </div>
              {plan.save && (
                <div className="inline-block px-2 py-1 bg-teal-100 dark:bg-teal-900 text-teal-700 dark:text-teal-300 text-sm font-semibold rounded">
                  Save {plan.save}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </Modal>

      {/* Cancel Modal */}
      <Modal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        title="Cancel Subscription"
      >
        <div className="text-center py-6">
          <div className="w-20 h-20 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-6">
            <FaTimes className="w-10 h-10 text-red-600 dark:text-red-400" />
          </div>
          <h4 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
            Are you sure?
          </h4>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            This action will cancel your subscription. You'll lose access to all premium features.
          </p>
          <div className="flex gap-4 justify-center">
            <AnimatedButton
              onClick={() => setShowCancelModal(false)}
              variant="secondary"
            >
              Keep Subscription
            </AnimatedButton>
            <AnimatedButton
              onClick={handleCancelSubscription}
              variant="danger"
            >
              Confirm Cancellation
            </AnimatedButton>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Settings;

