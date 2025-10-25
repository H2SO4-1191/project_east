import { motion } from 'framer-motion';

const Card = ({ 
  children, 
  className = '', 
  hover = true,
  delay = 0,
  ...props 
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      whileHover={hover ? { y: -4, boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' } : {}}
      className={`
        bg-white dark:bg-navy-800 
        rounded-xl shadow-lg 
        p-6 
        transition-all duration-300
        border border-gray-100 dark:border-navy-700
        ${className}
      `}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export default Card;

