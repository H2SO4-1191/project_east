import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaMoon, FaSun, FaArrowLeft } from 'react-icons/fa';
import { useTheme } from '../context/ThemeContext';
import AnimatedBackground from '../components/AnimatedBackground';
import AnimatedButton from '../components/AnimatedButton';
import Card from '../components/Card';
import toast from 'react-hot-toast';

const EnhancedLogin = () => {
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (e) => {
    setEmail(e.target.value);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }
    
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email address');
      return;
    }
    
    setIsLoading(true);
    
    // Simulate sending OTP
    setTimeout(() => {
      toast.success('Verification code sent to your email!');
      // Pass email to OTP page via state
      navigate('/verify-otp', { state: { email } });
    }, 1000);
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
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-primary-600 dark:text-teal-400 hover:text-primary-700 dark:hover:text-teal-300 mb-8 transition-colors font-medium"
            whileHover={{ x: -5 }}
          >
            <FaArrowLeft />
            Back to Home
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
              whileHover={{ scale: 1.05, rotate: 5 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <div className="w-24 h-24 bg-gradient-to-br from-primary-600 to-teal-500 rounded-3xl mx-auto flex items-center justify-center shadow-2xl">
                <span className="text-white text-5xl font-bold">PE</span>
              </div>
            </motion.div>
            <motion.h1
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-4xl font-bold text-gray-800 dark:text-white mb-2"
            >
              Welcome Back
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-gray-600 dark:text-gray-300"
            >
              Enter your email to receive a verification code
            </motion.p>
          </motion.div>

          {/* Login Form Card */}
          <Card delay={0.4}>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
                  Email Address
                </label>
                <motion.input
                  whileFocus={{ scale: 1.01 }}
                  type="email"
                  name="email"
                  value={email}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-navy-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all bg-white dark:bg-navy-700 text-gray-900 dark:text-white"
                  placeholder="Enter your email"
                  required
                />
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg text-sm"
                >
                  {error}
                </motion.div>
              )}

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400 px-4 py-3 rounded-lg text-sm"
              >
                <strong>Demo Login:</strong><br />
                Email: demo@east.edu<br />
                Verification Code: 200471
              </motion.div>

              <AnimatedButton 
                type="submit" 
                className="w-full text-lg py-4"
                disabled={isLoading}
              >
                {isLoading ? 'Sending Code...' : 'Continue'}
              </AnimatedButton>
            </form>
          </Card>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-center text-gray-600 dark:text-gray-400 text-sm mt-6"
          >
            Don't have an account?{' '}
            <button
              onClick={() => navigate('/')}
              className="text-primary-600 dark:text-teal-400 hover:text-primary-700 dark:hover:text-teal-300 font-semibold transition-colors"
            >
              Sign up here
            </button>
          </motion.p>
        </div>
      </div>
    </AnimatedBackground>
  );
};

export default EnhancedLogin;

