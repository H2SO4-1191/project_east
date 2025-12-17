import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { 
  FaTimes, 
  FaRocket, 
  FaCheckCircle, 
  FaChevronLeft, 
  FaChevronRight,
  FaGraduationCap,
  FaUsers,
  FaChalkboardTeacher,
  FaBook,
  FaAward,
  FaUniversity,
  FaClock,
  FaChartLine,
  FaCalendarAlt,
  FaDollarSign,
  FaBriefcase,
  FaUserGraduate,
  FaTachometerAlt,
  FaShieldAlt,
  FaGlobe,
  FaMoon,
  FaSun,
  FaBell,
  FaSearch,
  FaNewspaper,
  FaCompass
} from 'react-icons/fa';
import { useTheme } from '../context/ThemeContext';

// Image configuration - Using high-quality educational images from Unsplash
const getCarouselImages = (t) => [
  {
    id: 1,
    image: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=1200&q=80&auto=format&fit=crop',
    caption: t('welcome.carousel1.caption') || 'Modern Learning Environment',
    description: t('welcome.carousel1.description') || 'State-of-the-art facilities for optimal learning experience'
  },
  {
    id: 2,
    image: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=1200&q=80',
    caption: t('welcome.carousel2.caption') || 'Expert Faculty',
    description: t('welcome.carousel2.description') || 'Learn from industry professionals and academic experts'
  },
  {
    id: 3,
    image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1200&q=80',
    caption: t('welcome.carousel3.caption') || 'Collaborative Learning',
    description: t('welcome.carousel3.description') || 'Work together with peers and build lasting connections'
  },
  {
    id: 4,
    image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1200&q=80',
    caption: t('welcome.carousel4.caption') || 'Innovative Programs',
    description: t('welcome.carousel4.description') || 'Cutting-edge curriculum designed for the future'
  },
  {
    id: 5,
    image: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=1200&q=80',
    caption: t('welcome.carousel5.caption') || 'Digital Excellence',
    description: t('welcome.carousel5.description') || 'Embrace technology for enhanced educational experiences'
  }
];

const WelcomeModal = ({ onClose }) => {
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const carouselIntervalRef = useRef(null);
  const containerRef = useRef(null);
  const [visibleSections, setVisibleSections] = useState(new Set());
  
  const carouselImages = getCarouselImages(t);

  useEffect(() => {
    // Small delay for smooth animation
    setTimeout(() => setIsVisible(true), 100);
    
    // Auto-advance carousel
    carouselIntervalRef.current = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % carouselImages.length);
    }, 6000);

    return () => {
      if (carouselIntervalRef.current) {
        clearInterval(carouselIntervalRef.current);
      }
    };
  }, []);

  // Scroll animations using Intersection Observer
  useEffect(() => {
    if (!isVisible) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisibleSections((prev) => new Set([...prev, entry.target.id]));
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );

    const sections = containerRef.current?.querySelectorAll('[data-scroll-section]');
    sections?.forEach((section) => {
      if (section.id) {
        observer.observe(section);
      }
    });

    return () => {
      sections?.forEach((section) => {
        if (section.id) {
          observer.unobserve(section);
        }
      });
    };
  }, [isVisible]);

  const handleContinue = () => {
    // Mark as seen in localStorage
    localStorage.setItem('hasSeenWelcome', 'true');
    setIsVisible(false);
    // Wait for exit animation to complete before closing
    setTimeout(() => onClose(), 650);
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % carouselImages.length);
    // Reset auto-play timer
    if (carouselIntervalRef.current) {
      clearInterval(carouselIntervalRef.current);
      carouselIntervalRef.current = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % carouselImages.length);
      }, 6000);
    }
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + carouselImages.length) % carouselImages.length);
    // Reset auto-play timer
    if (carouselIntervalRef.current) {
      clearInterval(carouselIntervalRef.current);
      carouselIntervalRef.current = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % carouselImages.length);
      }, 6000);
    }
  };

  const goToSlide = (index) => {
    setCurrentSlide(index);
    // Reset auto-play timer
    if (carouselIntervalRef.current) {
      clearInterval(carouselIntervalRef.current);
      carouselIntervalRef.current = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % carouselImages.length);
      }, 6000);
    }
  };

  // Real features from the application
  const features = [
    {
      icon: FaUserGraduate,
      title: t('welcome.feature1.title') || 'Student Management',
      description: t('welcome.feature1.desc') || 'Complete student profiles, enrollment tracking, grade management, and academic records',
      color: 'from-blue-500 to-blue-600'
    },
    {
      icon: FaChalkboardTeacher,
      title: t('welcome.feature2.title') || 'Lecturer Management',
      description: t('welcome.feature2.desc') || 'Manage faculty profiles, subject assignments, department organization, and status tracking',
      color: 'from-teal-500 to-teal-600'
    },
    {
      icon: FaBriefcase,
      title: t('welcome.feature3.title') || 'Employee Management',
      description: t('welcome.feature3.desc') || 'Comprehensive employee records, role assignments, and department tracking',
      color: 'from-purple-500 to-purple-600'
    },
    {
      icon: FaCalendarAlt,
      title: t('welcome.feature4.title') || 'Schedule Management',
      description: t('welcome.feature4.desc') || 'Class timetables, day-wise organization, teacher and room assignments with time slots',
      color: 'from-pink-500 to-pink-600'
    },
    {
      icon: FaDollarSign,
      title: t('welcome.feature5.title') || 'Finance Tracking',
      description: t('welcome.feature5.desc') || 'Invoice management, payment tracking, financial statistics, and status monitoring',
      color: 'from-gold-500 to-gold-600'
    },
    {
      icon: FaBook,
      title: t('welcome.feature6.title') || 'Course Management',
      description: t('welcome.feature6.desc') || 'Browse and enroll in courses, track progress, access materials, and manage your learning',
      color: 'from-indigo-500 to-indigo-600'
    },
    {
      icon: FaNewspaper,
      title: t('welcome.feature7.title') || 'Feed & Explore',
      description: t('welcome.feature7.desc') || 'Discover posts, courses, job opportunities, and connect with educational institutions',
      color: 'from-green-500 to-green-600'
    },
    {
      icon: FaTachometerAlt,
      title: t('welcome.feature8.title') || 'Dashboard Analytics',
      description: t('welcome.feature8.desc') || 'Real-time statistics, interactive charts, activity feeds, and comprehensive overviews',
      color: 'from-orange-500 to-orange-600'
    }
  ];

  const benefits = [
    {
      icon: FaShieldAlt,
      text: t('welcome.benefit1') || 'Secure OTP Verification',
      color: 'text-green-500'
    },
    {
      icon: FaMoon,
      text: t('welcome.benefit2') || 'Dark/Light Theme',
      color: 'text-primary-500'
    },
    {
      icon: FaGlobe,
      text: t('welcome.benefit3') || 'Multi-Language Support',
      color: 'text-teal-500'
    },
    {
      icon: FaBell,
      text: t('welcome.benefit4') || 'Smart Notifications',
      color: 'text-pink-500'
    },
    {
      icon: FaChartLine,
      text: t('welcome.benefit5') || 'Progress Tracking',
      color: 'text-gold-500'
    },
    {
      icon: FaClock,
      text: t('welcome.benefit6') || 'Flexible Scheduling',
      color: 'text-indigo-500'
    }
  ];

  return (
    <AnimatePresence mode="wait">
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ 
            scale: 1.2,
            y: -100,
            transition: { 
              duration: 0.6,
              ease: [0.4, 0, 1, 1]
            }
          }}
          transition={{ duration: 0.4 }}
          className="fixed inset-0 z-[100] overflow-y-auto"
          onClick={handleContinue}
        >
          {/* Animated Gradient Background */}
          <motion.div 
            className="fixed inset-0 bg-gradient-to-br from-primary-600/20 via-teal-500/20 to-gold-500/20 dark:from-navy-900/80 dark:via-primary-900/80 dark:to-navy-800/80 overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ 
              scale: 1.3,
              rotate: 5,
              transition: { duration: 0.6, ease: [0.4, 0, 1, 1] }
            }}
          >
            {/* Floating Animated Shapes */}
            <motion.div
              className="absolute w-96 h-96 rounded-full bg-primary-400/20 blur-3xl"
              animate={{
                x: [0, 100, 0],
                y: [0, -100, 0],
                scale: [1, 1.2, 1],
              }}
              transition={{
                duration: 20,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              style={{ top: '10%', left: '10%' }}
            />
            <motion.div
              className="absolute w-80 h-80 rounded-full bg-teal-400/20 blur-3xl"
              animate={{
                x: [0, -80, 0],
                y: [0, 80, 0],
                scale: [1, 1.1, 1],
              }}
              transition={{
                duration: 15,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              style={{ bottom: '15%', right: '15%' }}
            />
            <motion.div
              className="absolute w-72 h-72 rounded-full bg-gold-400/20 blur-3xl"
              animate={{
                x: [0, 60, 0],
                y: [0, -60, 0],
                scale: [1, 1.15, 1],
              }}
              transition={{
                duration: 18,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              style={{ top: '50%', right: '30%' }}
            />
            {/* Additional floating particles for magic effect */}
            {[...Array(15)].map((_, i) => (
              <motion.div
                key={`particle-${i}`}
                className="absolute w-2 h-2 rounded-full bg-white/30"
                initial={{
                  x: `${Math.random() * 100}%`,
                  y: `${Math.random() * 100}%`,
                  opacity: 0,
                }}
                animate={{
                  x: [
                    `${Math.random() * 100}%`,
                    `${Math.random() * 100}%`,
                    `${Math.random() * 100}%`,
                  ],
                  y: [
                    `${Math.random() * 100}%`,
                    `${Math.random() * 100}%`,
                    `${Math.random() * 100}%`,
                  ],
                  opacity: [0, 0.8, 0],
                  scale: [0, 1.5, 0],
                }}
                transition={{
                  duration: Math.random() * 10 + 10,
                  repeat: Infinity,
                  delay: Math.random() * 5,
                  ease: 'easeInOut',
                }}
              />
            ))}
          </motion.div>

          {/* Backdrop Blur Overlay */}
          <motion.div 
            className="fixed inset-0 bg-black/40 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ 
              scale: 1.1,
              transition: { duration: 0.5, ease: [0.4, 0, 1, 1] }
            }}
          />

          {/* Main Content */}
          <div ref={containerRef} className="relative z-10 min-h-screen flex items-center justify-center p-4 py-8">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20, rotateX: -10 }}
              animate={{ scale: 1, opacity: 1, y: 0, rotateX: 0 }}
              exit={{ 
                scale: 0.3, 
                y: -200,
                rotateX: 45,
                rotateY: 20,
                rotateZ: -10,
                transition: { 
                  duration: 0.6,
                  ease: [0.4, 0, 1, 1]
                }
              }}
              transition={{ duration: 0.4, type: 'spring', damping: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-6xl"
              style={{ perspective: '1000px', transformStyle: 'preserve-3d' }}
            >
              {/* Glassmorphism Card */}
              <motion.div 
                className="relative bg-white/90 dark:bg-navy-800/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 dark:border-navy-700/50 overflow-hidden"
                exit={{
                  scale: 0.2,
                  rotateY: 90,
                  transition: {
                    duration: 0.6,
                    ease: [0.4, 0, 1, 1]
                  }
                }}
              >
                {/* Gradient Border Effect */}
                <motion.div 
                  className="absolute inset-0 bg-gradient-to-r from-primary-500/20 via-teal-500/20 to-gold-500/20 rounded-3xl blur-xl -z-10"
                  exit={{
                    scale: 0.5,
                    rotate: 180,
                    transition: {
                      duration: 0.6,
                      ease: [0.4, 0, 1, 1]
                    }
                  }}
                />
                
                {/* Close Button */}
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleContinue}
                  className="absolute top-6 right-6 z-50 p-3 rounded-full bg-white/80 dark:bg-navy-700/80 backdrop-blur-sm hover:bg-white dark:hover:bg-navy-600 transition-colors shadow-lg"
                >
                  <FaTimes className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                </motion.button>

                <div className="p-8 md:p-12">
                  {/* Hero Section */}
                  <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-center mb-8"
                  >
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
                      className="w-32 h-32 bg-gradient-to-br from-primary-600 to-teal-500 rounded-3xl mx-auto flex items-center justify-center mb-6 shadow-2xl"
                    >
                      <FaRocket className="w-16 h-16 text-white" />
                    </motion.div>
                    
                    <motion.h1
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.4 }}
                      className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-primary-600 via-teal-500 to-gold-500 bg-clip-text text-transparent mb-4"
                    >
                      {t('welcome.title') || 'Welcome to Project East!'}
                    </motion.h1>
                    
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.5 }}
                      className="text-xl md:text-2xl text-gray-600 dark:text-gray-300"
                    >
                      {t('welcome.subtitle') || 'Your Gateway to Excellence in Education'}
                    </motion.p>
                  </motion.div>

                  {/* Image Carousel Section */}
                  <motion.div
                    data-scroll-section
                    id="carousel-section"
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={visibleSections.has('carousel-section') ? { 
                      opacity: 1, 
                      y: 0, 
                      scale: 1,
                      transition: { duration: 0.6, type: 'spring' }
                    } : { opacity: 0, y: 20, scale: 0.95 }}
                    className="mb-10"
                    onMouseEnter={() => {
                      // Pause carousel on hover
                      if (carouselIntervalRef.current) {
                        clearInterval(carouselIntervalRef.current);
                      }
                    }}
                    onMouseLeave={() => {
                      // Resume carousel on leave
                      carouselIntervalRef.current = setInterval(() => {
                        setCurrentSlide((prev) => (prev + 1) % carouselImages.length);
                      }, 6000);
                    }}
                  >
                    <div className="relative rounded-2xl overflow-hidden shadow-2xl bg-gradient-to-br from-primary-100 to-teal-100 dark:from-navy-900 dark:to-navy-800">
                      {/* Carousel Container */}
                      <div className="relative h-64 md:h-80 lg:h-96 overflow-hidden">
                        <AnimatePresence mode="wait">
                          {carouselImages.map((item, index) => {
                            if (index !== currentSlide) return null;
                            return (
                              <motion.div
                                key={item.id}
                                initial={{ opacity: 0, x: 100 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -100 }}
                                transition={{ duration: 0.5 }}
                                className="absolute inset-0"
                              >
                                <div className="relative w-full h-full">
                                  <img 
                                    src={item.image} 
                                    alt={item.caption} 
                                    className="w-full h-full object-cover" 
                                  />
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent flex flex-col justify-end p-8">
                                    <h3 className="text-3xl font-bold text-white mb-2">{item.caption}</h3>
                                    <p className="text-lg text-white/90">{item.description}</p>
                                  </div>
                                </div>
                              </motion.div>
                            );
                          })}
                        </AnimatePresence>

                        {/* Navigation Arrows */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            prevSlide();
                          }}
                          className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/90 dark:bg-navy-800/90 backdrop-blur-sm hover:bg-white dark:hover:bg-navy-700 transition-all shadow-lg z-10"
                        >
                          <FaChevronLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            nextSlide();
                          }}
                          className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/90 dark:bg-navy-800/90 backdrop-blur-sm hover:bg-white dark:hover:bg-navy-700 transition-all shadow-lg z-10"
                        >
                          <FaChevronRight className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                        </button>

                        {/* Navigation Dots */}
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                          {carouselImages.map((_, index) => (
                            <button
                              key={index}
                              onClick={(e) => {
                                e.stopPropagation();
                                goToSlide(index);
                              }}
                              className={`w-3 h-3 rounded-full transition-all ${
                                index === currentSlide
                                  ? 'bg-white w-8'
                                  : 'bg-white/50 hover:bg-white/75'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>

                  {/* Features Section */}
                  <motion.div
                    data-scroll-section
                    id="features-section"
                    initial={{ opacity: 0, y: 20 }}
                    animate={visibleSections.has('features-section') ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                    transition={{ duration: 0.6 }}
                    className="mb-10"
                  >
                    <motion.h2 
                      className="text-3xl md:text-4xl font-bold text-center text-gray-800 dark:text-white mb-8"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={visibleSections.has('features-section') ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
                      transition={{ delay: 0.2 }}
                    >
                      {t('welcome.featuresTitle') || 'Powerful Features for Modern Education'}
                    </motion.h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      {features.map((feature, index) => {
                        const Icon = feature.icon;
                        const isVisible = visibleSections.has('features-section');
                        return (
                          <motion.div
                            key={index}
                            data-scroll-section
                            id={`feature-${index}`}
                            initial={{ opacity: 0, y: 50, rotateX: -15 }}
                            animate={isVisible ? { 
                              opacity: 1, 
                              y: 0, 
                              rotateX: 0,
                              transition: { delay: index * 0.1, type: 'spring', stiffness: 100 }
                            } : { opacity: 0, y: 50, rotateX: -15 }}
                            whileHover={{ 
                              y: -12, 
                              scale: 1.05,
                              rotateY: 5,
                              transition: { duration: 0.3 }
                            }}
                            className="bg-gradient-to-br from-white to-primary-50/50 dark:from-navy-700 dark:to-navy-800/50 rounded-2xl p-6 shadow-lg border border-primary-100 dark:border-navy-600 hover:shadow-2xl transition-all relative overflow-hidden group"
                          >
                            {/* Animated background gradient */}
                            <motion.div
                              className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}
                              initial={false}
                            />
                            <motion.div
                              whileHover={{ rotate: 360, scale: 1.15 }}
                              transition={{ duration: 0.6, type: 'spring' }}
                              className={`w-16 h-16 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center mb-4 mx-auto shadow-lg relative z-10`}
                            >
                              <Icon className="w-8 h-8 text-white" />
                            </motion.div>
                            <h3 className="text-lg font-bold text-center text-gray-800 dark:text-white mb-2 relative z-10">
                              {feature.title}
                            </h3>
                            <p className="text-sm text-center text-gray-600 dark:text-gray-400 relative z-10">
                              {feature.description}
                            </p>
                            {/* Shine effect on hover */}
                            <motion.div
                              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"
                              initial={false}
                            />
                          </motion.div>
                        );
                      })}
                    </div>
                  </motion.div>

                  {/* Benefits Section */}
                  <motion.div
                    data-scroll-section
                    id="benefits-section"
                    initial={{ opacity: 0, y: 20 }}
                    animate={visibleSections.has('benefits-section') ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                    transition={{ duration: 0.6 }}
                    className="mb-10"
                  >
                    <motion.h2 
                      className="text-2xl md:text-3xl font-bold text-center text-gray-800 dark:text-white mb-8"
                      initial={{ opacity: 0 }}
                      animate={visibleSections.has('benefits-section') ? { opacity: 1 } : { opacity: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      {t('welcome.benefitsTitle') || 'Additional Benefits'}
                    </motion.h2>
                    <div className="flex flex-wrap justify-center gap-4 md:gap-6">
                      {benefits.map((benefit, index) => {
                        const Icon = benefit.icon;
                        const isVisible = visibleSections.has('benefits-section');
                        return (
                          <motion.div
                            key={index}
                            data-scroll-section
                            id={`benefit-${index}`}
                            initial={{ opacity: 0, scale: 0, rotate: -180 }}
                            animate={isVisible ? { 
                              opacity: 1, 
                              scale: 1, 
                              rotate: 0,
                              transition: { delay: index * 0.1, type: 'spring', stiffness: 200 }
                            } : { opacity: 0, scale: 0, rotate: -180 }}
                            whileHover={{ 
                              scale: 1.15, 
                              rotate: 5,
                              y: -5,
                              transition: { duration: 0.2 }
                            }}
                            className="flex items-center gap-3 bg-white/80 dark:bg-navy-700/80 backdrop-blur-sm rounded-full px-6 py-3 shadow-lg border-2 border-primary-200 dark:border-navy-600 hover:border-primary-400 dark:hover:border-teal-400 transition-all relative overflow-hidden group"
                          >
                            <motion.div
                              whileHover={{ rotate: 360 }}
                              transition={{ duration: 0.5 }}
                            >
                              <Icon className={`w-6 h-6 ${benefit.color} relative z-10`} />
                            </motion.div>
                            <span className="font-semibold text-gray-700 dark:text-gray-300 relative z-10">
                              {benefit.text}
                            </span>
                            {/* Pulse effect */}
                            <motion.div
                              className={`absolute inset-0 rounded-full bg-gradient-to-r ${benefit.color.replace('text-', 'from-').replace('-500', '-400/20')} opacity-0 group-hover:opacity-100 blur-xl`}
                              animate={{
                                scale: [1, 1.5, 1],
                                opacity: [0, 0.3, 0],
                              }}
                              transition={{
                                duration: 2,
                                repeat: Infinity,
                                ease: 'easeInOut'
                              }}
                            />
                          </motion.div>
                        );
                      })}
                    </div>
                  </motion.div>

                  {/* Academy Info Section */}
                  <motion.div
                    data-scroll-section
                    id="academy-section"
                    initial={{ opacity: 0, y: 20 }}
                    animate={visibleSections.has('academy-section') ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                    transition={{ duration: 0.6 }}
                    className="mb-10 text-center"
                  >
                    <motion.div 
                      className="bg-gradient-to-r from-primary-500/10 via-teal-500/10 to-gold-500/10 dark:from-primary-500/20 dark:via-teal-500/20 dark:to-gold-500/20 rounded-2xl p-8 border border-primary-200 dark:border-primary-800 relative overflow-hidden group"
                      whileHover={{ scale: 1.02 }}
                      transition={{ duration: 0.3 }}
                    >
                      {/* Animated background particles */}
                      {[...Array(20)].map((_, i) => (
                        <motion.div
                          key={i}
                          className="absolute w-2 h-2 bg-primary-400/30 rounded-full"
                          initial={{
                            x: Math.random() * 100 + '%',
                            y: Math.random() * 100 + '%',
                            opacity: 0,
                          }}
                          animate={{
                            y: [null, Math.random() * -100 - 50],
                            opacity: [0, 1, 0],
                            scale: [0, 1, 0],
                          }}
                          transition={{
                            duration: Math.random() * 3 + 2,
                            repeat: Infinity,
                            delay: Math.random() * 2,
                            ease: 'easeOut',
                          }}
                        />
                      ))}
                      <motion.div
                        whileHover={{ rotate: 360, scale: 1.1 }}
                        transition={{ duration: 0.6 }}
                      >
                        <FaUniversity className="w-16 h-16 text-primary-600 dark:text-teal-400 mx-auto mb-4 relative z-10" />
                      </motion.div>
                      <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-3 relative z-10">
                        {t('welcome.academyTitle') || 'Excellence in Education'}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto relative z-10">
                        {t('welcome.academyDesc') || 'Join thousands of students and educators in a platform designed to transform the way we learn, teach, and grow together. Experience the future of educational management.'}
                      </p>
                    </motion.div>
                  </motion.div>

                  {/* CTA Button */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.7 }}
                    className="text-center"
                  >
                    <motion.button
                      whileHover={{ scale: 1.05, y: -4 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleContinue}
                      className="w-full md:w-auto px-12 py-5 bg-gradient-to-r from-primary-600 via-teal-500 to-primary-600 text-white rounded-2xl font-bold text-xl shadow-2xl transition-all duration-500 relative overflow-hidden group"
                      exit={{
                        scale: 0.8,
                        opacity: 0,
                        transition: { duration: 0.3 }
                      }}
                    >
                      <motion.span 
                        className="relative z-10 flex items-center justify-center gap-3"
                        animate={{
                          backgroundPosition: ['0%', '100%', '0%'],
                        }}
                        transition={{
                          duration: 3,
                          repeat: Infinity,
                          ease: 'linear'
                        }}
                      >
                        <motion.span
                          animate={{ rotate: [0, 360] }}
                          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                        >
                          <FaRocket className="w-6 h-6" />
                        </motion.span>
                        {t('welcome.continue') || 'Get Started'}
                      </motion.span>
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-teal-500 via-primary-500 to-teal-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                        initial={false}
                      />
                    </motion.button>
                  </motion.div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default WelcomeModal;

