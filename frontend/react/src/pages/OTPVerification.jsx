import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaMoon, FaSun, FaArrowLeft, FaShieldAlt } from 'react-icons/fa';
import { useInstitute } from '../context/InstituteContext';
import { useTheme } from '../context/ThemeContext';
import AnimatedBackground from '../components/AnimatedBackground';
import AnimatedButton from '../components/AnimatedButton';
import Card from '../components/Card';
import toast from 'react-hot-toast';
import confetti from 'canvas-confetti';

const OTPVerification = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { updateInstituteData } = useInstitute();
  const { isDark, toggleTheme } = useTheme();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const inputRefs = useRef([]);

  const email = location.state?.email || '';

  useEffect(() => {
    // If no email, redirect back to login
    if (!email) {
      navigate('/login');
    }
    // Focus first input on mount
    inputRefs.current[0]?.focus();
  }, [email, navigate]);

  const handleChange = (index, value) => {
    // Only allow numbers
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setError('');

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    // Handle backspace
    if (e.key === 'Backspace') {
      if (!otp[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    }
    // Handle paste
    else if (e.key === 'v' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      navigator.clipboard.readText().then((text) => {
        const digits = text.replace(/\D/g, '').slice(0, 6).split('');
        const newOtp = [...otp];
        digits.forEach((digit, i) => {
          if (i < 6) newOtp[i] = digit;
        });
        setOtp(newOtp);
        // Focus last filled input or last input
        const lastIndex = Math.min(digits.length, 5);
        inputRefs.current[lastIndex]?.focus();
      });
    }
    // Handle arrow keys
    else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const otpCode = otp.join('');
    
    if (otpCode.length !== 6) {
      setError('Please enter all 6 digits');
      // Shake animation
      const inputs = document.querySelectorAll('.otp-input');
      inputs.forEach(input => {
        input.classList.add('shake');
        setTimeout(() => input.classList.remove('shake'), 500);
      });
      return;
    }
    
    setIsLoading(true);
    
    // Simulate API verification
    setTimeout(() => {
      if (otpCode === '200471') {
        // Success
        updateInstituteData({
          name: 'Al-Noor Educational Institute',
          email: email,
        });
        
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
        
        toast.success('Verification successful! Welcome back!');
        navigate('/dashboard');
      } else {
        setError('Invalid verification code. Please try again.');
        toast.error('Invalid code');
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
        setIsLoading(false);
      }
    }, 1000);
  };

  const handleResendCode = () => {
    setOtp(['', '', '', '', '', '']);
    setError('');
    toast.success('Verification code resent to your email!');
    inputRefs.current[0]?.focus();
  };

  return (
    <AnimatedBackground>
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Theme Toggle */}
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={toggleTheme}
            className="fixed top-6 right-6 p-3 bg-white/80 dark:bg-navy-800/80 backdrop-blur-sm rounded-full shadow-lg hover:shadow-xl transition-all z-50"
            whileHover={{ scale: 1.1, rotate: 180 }}
            whileTap={{ scale: 0.9 }}
          >
            {isDark ? (
              <FaSun className="w-6 h-6 text-gold-500" />
            ) : (
              <FaMoon className="w-6 h-6 text-navy-700" />
            )}
          </motion.button>

          {/* Back Button */}
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={() => navigate('/login')}
            className="flex items-center gap-2 text-primary-600 dark:text-teal-400 hover:text-primary-700 dark:hover:text-teal-300 mb-8 transition-colors font-medium"
            whileHover={{ x: -5 }}
          >
            <FaArrowLeft />
            Back to Login
          </motion.button>

          {/* Logo and Title */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <motion.div
              className="mb-6"
              whileHover={{ scale: 1.05 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <div className="w-24 h-24 bg-gradient-to-br from-teal-600 to-teal-500 rounded-3xl mx-auto flex items-center justify-center shadow-2xl">
                <FaShieldAlt className="text-white text-5xl" />
              </div>
            </motion.div>
            <motion.h1
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-4xl font-bold text-gray-800 dark:text-white mb-2"
            >
              Verify Your Email
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-gray-600 dark:text-gray-300"
            >
              Enter the 6-digit code sent to
            </motion.p>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-primary-600 dark:text-teal-400 font-semibold mt-1"
            >
              {email}
            </motion.p>
          </motion.div>

          {/* OTP Form Card */}
          <Card delay={0.4}>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* OTP Input */}
              <div>
                <label className="block text-gray-700 dark:text-gray-300 font-medium mb-4 text-center">
                  Verification Code
                </label>
                <div className="flex justify-center gap-3">
                  {otp.map((digit, index) => (
                    <motion.input
                      key={index}
                      ref={(el) => (inputRefs.current[index] = el)}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      className="otp-input w-12 h-14 sm:w-14 sm:h-16 text-center text-2xl font-bold border-2 border-gray-300 dark:border-navy-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all bg-white dark:bg-navy-700 text-gray-900 dark:text-white"
                      whileFocus={{ scale: 1.05 }}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    />
                  ))}
                </div>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg text-sm text-center"
                >
                  {error}
                </motion.div>
              )}

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400 px-4 py-3 rounded-lg text-sm text-center"
              >
                <strong>Demo Code:</strong> 200471
              </motion.div>

              <AnimatedButton 
                type="submit" 
                className="w-full text-lg py-4"
                disabled={isLoading}
              >
                {isLoading ? 'Verifying...' : 'Verify Code'}
              </AnimatedButton>

              {/* Resend Code */}
              <div className="text-center">
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">
                  Didn't receive the code?
                </p>
                <motion.button
                  type="button"
                  onClick={handleResendCode}
                  className="text-primary-600 dark:text-teal-400 hover:text-primary-700 dark:hover:text-teal-300 font-semibold text-sm transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Resend Code
                </motion.button>
              </div>
            </form>
          </Card>
        </div>
      </div>

      <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-10px); }
          75% { transform: translateX(10px); }
        }
        .shake {
          animation: shake 0.3s ease-in-out;
        }
      `}</style>
    </AnimatedBackground>
  );
};

export default OTPVerification;

