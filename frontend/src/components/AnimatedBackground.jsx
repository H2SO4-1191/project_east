import { motion } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';

const AnimatedBackground = ({ children }) => {
  const { isDark } = useTheme();

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Gradient Background */}
      <div className={`fixed inset-0 ${
        isDark 
          ? 'bg-gradient-to-br from-navy-900 via-navy-800 to-primary-900' 
          : 'bg-gradient-to-br from-primary-50 via-teal-50 to-gold-50'
      } transition-colors duration-500`}></div>
      
      {/* Animated Shapes */}
      <motion.div
        className={`fixed w-96 h-96 rounded-full ${
          isDark ? 'bg-primary-500/10' : 'bg-primary-200/30'
        } blur-3xl`}
        animate={{
          x: [0, 100, 0],
          y: [0, -100, 0],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        style={{ top: '10%', left: '10%' }}
      />
      
      <motion.div
        className={`fixed w-80 h-80 rounded-full ${
          isDark ? 'bg-teal-500/10' : 'bg-teal-300/20'
        } blur-3xl`}
        animate={{
          x: [0, -80, 0],
          y: [0, 80, 0],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        style={{ bottom: '15%', right: '15%' }}
      />
      
      <motion.div
        className={`fixed w-72 h-72 rounded-full ${
          isDark ? 'bg-gold-500/10' : 'bg-gold-300/20'
        } blur-3xl`}
        animate={{
          x: [0, 60, 0],
          y: [0, -60, 0],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        style={{ top: '50%', right: '30%' }}
      />
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};

export default AnimatedBackground;

