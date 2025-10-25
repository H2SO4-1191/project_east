import { useState } from 'react';
import { motion } from 'framer-motion';
import Modal from './Modal';
import AnimatedButton from './AnimatedButton';
import { FaCreditCard, FaPaypal, FaUniversity, FaCheck } from 'react-icons/fa';
import confetti from 'canvas-confetti';
import toast from 'react-hot-toast';

const PaymentModal = ({ isOpen, onClose, onSuccess, formData }) => {
  const [step, setStep] = useState(1);
  const [subscription, setSubscription] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const subscriptionOptions = [
    { value: '1month', label: '1 Month', price: 99, popular: false },
    { value: '3months', label: '3 Months', price: 249, popular: true, save: '15%' },
    { value: '6months', label: '6 Months', price: 449, popular: false, save: '25%' },
    { value: '1year', label: '1 Year', price: 799, popular: false, save: '35%' },
  ];

  const paymentMethods = [
    { value: 'credit', label: 'Credit Card', icon: FaCreditCard },
    { value: 'paypal', label: 'PayPal', icon: FaPaypal },
    { value: 'bank', label: 'Bank Transfer', icon: FaUniversity },
  ];

  const handlePayment = () => {
    setIsProcessing(true);
    
    // Simulate payment processing
    setTimeout(() => {
      setIsProcessing(false);
      setStep(3);
      
      // Confetti effect
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
      
      // Success toast
      toast.success('Payment successful! Welcome to Project East!');
      
      // Call success callback after animation
      setTimeout(() => {
        onSuccess({
          subscription,
          paymentMethod,
          subscriptionLabel: subscriptionOptions.find(s => s.value === subscription)?.label,
          paymentMethodLabel: paymentMethods.find(p => p.value === paymentMethod)?.label,
        });
      }, 2000);
    }, 3000);
  };

  const handleClose = () => {
    setStep(1);
    setSubscription('');
    setPaymentMethod('');
    setIsProcessing(false);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Complete Your Registration" size="lg">
      {step === 1 && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
        >
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Choose Your Subscription Plan
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {subscriptionOptions.map((option) => (
              <motion.div
                key={option.value}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSubscription(option.value)}
                className={`
                  relative p-6 rounded-xl border-2 cursor-pointer transition-all
                  ${subscription === option.value
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                    : 'border-gray-200 dark:border-navy-700 hover:border-primary-300 dark:hover:border-primary-700'
                  }
                `}
              >
                {option.popular && (
                  <div className="absolute -top-3 right-4 px-3 py-1 bg-gradient-to-r from-gold-500 to-gold-600 text-white text-xs font-bold rounded-full">
                    POPULAR
                  </div>
                )}
                {subscription === option.value && (
                  <div className="absolute top-4 right-4">
                    <FaCheck className="w-5 h-5 text-primary-600" />
                  </div>
                )}
                <div className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  {option.label}
                </div>
                <div className="text-3xl font-bold text-primary-600 dark:text-primary-400 mb-2">
                  ${option.price}
                </div>
                {option.save && (
                  <div className="inline-block px-2 py-1 bg-teal-100 dark:bg-teal-900 text-teal-700 dark:text-teal-300 text-sm font-semibold rounded">
                    Save {option.save}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
          <AnimatedButton
            onClick={() => setStep(2)}
            disabled={!subscription}
            className="w-full"
          >
            Continue to Payment
          </AnimatedButton>
        </motion.div>
      )}

      {step === 2 && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
        >
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Select Payment Method
          </h4>
          <div className="space-y-4 mb-6">
            {paymentMethods.map((method) => (
              <motion.div
                key={method.value}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => setPaymentMethod(method.value)}
                className={`
                  flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all
                  ${paymentMethod === method.value
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                    : 'border-gray-200 dark:border-navy-700 hover:border-primary-300 dark:hover:border-primary-700'
                  }
                `}
              >
                <method.icon className="w-8 h-8 text-gray-600 dark:text-gray-400" />
                <div className="flex-1 text-lg font-medium text-gray-900 dark:text-white">
                  {method.label}
                </div>
                {paymentMethod === method.value && (
                  <FaCheck className="w-5 h-5 text-primary-600" />
                )}
              </motion.div>
            ))}
          </div>
          <div className="flex gap-4">
            <AnimatedButton
              onClick={() => setStep(1)}
              variant="secondary"
              className="flex-1"
            >
              Back
            </AnimatedButton>
            <AnimatedButton
              onClick={handlePayment}
              disabled={!paymentMethod || isProcessing}
              className="flex-1"
            >
              {isProcessing ? 'Processing...' : 'Complete Payment'}
            </AnimatedButton>
          </div>
        </motion.div>
      )}

      {step === 3 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-8"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
            className="w-20 h-20 bg-teal-500 rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <FaCheck className="w-10 h-10 text-white" />
          </motion.div>
          <h4 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Payment Successful!
          </h4>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Your account has been created successfully. Redirecting to dashboard...
          </p>
        </motion.div>
      )}
    </Modal>
  );
};

export default PaymentModal;

