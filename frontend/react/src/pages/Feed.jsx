import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  FaUniversity, 
  FaUser, 
  FaSignInAlt, 
  FaSignOutAlt, 
  FaTachometerAlt,
  FaMapMarkerAlt,
  FaUsers,
  FaChalkboardTeacher,
  FaMoon,
  FaSun,
  FaSearch,
  FaUserGraduate,
  FaBook,
  FaCompass,
  FaClock,
  FaDollarSign,
  FaInfoCircle,
  FaPen,
  FaBell,
  FaBriefcase,
  FaTrophy,
  FaTimes
} from 'react-icons/fa';
import { useInstitute } from '../context/InstituteContext';
import { useTheme } from '../context/ThemeContext';
import { authService } from '../services/authService';
import Modal from '../components/Modal';
import LanguageSwitcher from '../components/LanguageSwitcher';
import toast from 'react-hot-toast';

const Feed = () => {
  const navigate = useNavigate();
  const { instituteData, updateInstituteData } = useInstitute();
  const { isDark, toggleTheme } = useTheme();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [feedItems, setFeedItems] = useState([]);
  const [sidebarView, setSidebarView] = useState('students'); // 'students', 'lecturers', 'courses'
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [profileType, setProfileType] = useState(null); // 'student' or 'lecturer'
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  
  // Demo notifications
  const [notifications] = useState([
    {
      id: 1,
      title: 'New Course Available',
      message: 'Introduction to Machine Learning course is now available for enrollment',
      time: '2 hours ago',
      read: false,
      type: 'course'
    },
    {
      id: 2,
      title: 'Student Enrollment',
      message: '5 new students enrolled in your Advanced Calculus course',
      time: '5 hours ago',
      read: false,
      type: 'enrollment'
    },
    {
      id: 3,
      title: 'Payment Received',
      message: 'Payment of $450 received for Business Strategy course',
      time: '1 day ago',
      read: true,
      type: 'payment'
    },
    {
      id: 4,
      title: 'Course Update',
      message: 'Your Web Development Bootcamp course has been updated',
      time: '2 days ago',
      read: true,
      type: 'update'
    },
    {
      id: 5,
      title: 'New Message',
      message: 'You have a new message from Prof. Ali Mahmoud',
      time: '3 days ago',
      read: false,
      type: 'message'
    },
  ]);
  
  // Demo students data
  const [students] = useState([
    {
      id: 1,
      name: 'Ahmed Hassan',
      major: 'Computer Science',
      year: '3rd Year',
      university: 'Baghdad University',
      image: 'https://i.pravatar.cc/150?img=12',
      bio: 'Passionate about AI and Machine Learning',
      email: 'ahmed.hassan@student.edu',
      phone: '+964 770 123 4567',
      location: 'Baghdad, Iraq',
      gpa: '3.8',
      isVerified: true, // Demo verification status
      skills: ['Python', 'JavaScript', 'Machine Learning', 'React'],
      interests: ['Artificial Intelligence', 'Web Development', 'Data Science'],
      achievements: ['Dean\'s List 2023', 'Hackathon Winner', 'Research Assistant'],
      about: 'I am a dedicated Computer Science student with a strong passion for artificial intelligence and machine learning. Currently working on several projects involving neural networks and deep learning. Always eager to learn new technologies and collaborate on innovative projects.',
    },
    {
      id: 2,
      name: 'Fatima Ali',
      major: 'Business Administration',
      year: '2nd Year',
      university: 'Al-Noor Institute',
      image: 'https://i.pravatar.cc/150?img=45',
      bio: 'Future entrepreneur and business leader',
      email: 'fatima.ali@student.edu',
      phone: '+964 771 234 5678',
      location: 'Baghdad, Iraq',
      gpa: '3.9',
      isVerified: true, // Demo verification status
      skills: ['Marketing', 'Finance', 'Leadership', 'Strategic Planning'],
      interests: ['Entrepreneurship', 'Digital Marketing', 'Business Strategy'],
      achievements: ['Student Council President', 'Business Plan Competition Winner', 'Internship at Top Firm'],
      about: 'Aspiring entrepreneur with a keen interest in business strategy and innovation. I believe in creating value through sustainable business practices and am currently developing my own startup idea focused on e-commerce solutions.',
    },
    {
      id: 3,
      name: 'Omar Khalid',
      major: 'Engineering',
      year: '4th Year',
      university: 'Kurdistan Technical University',
      image: 'https://i.pravatar.cc/150?img=33',
      bio: 'Building the future with technology',
      email: 'omar.khalid@student.edu',
      phone: '+964 772 345 6789',
      location: 'Erbil, Iraq',
      gpa: '3.7',
      isVerified: false, // Demo verification status
      skills: ['CAD Design', 'Project Management', 'AutoCAD', 'SolidWorks'],
      interests: ['Mechanical Design', 'Robotics', 'Sustainable Engineering'],
      achievements: ['Engineering Excellence Award', 'Senior Project Lead', 'Published Research Paper'],
      about: 'Senior engineering student specializing in mechanical design and robotics. Passionate about creating sustainable solutions for real-world problems. Currently leading a team project on renewable energy systems.',
    },
    {
      id: 4,
      name: 'Zahra Mohammed',
      major: 'Medicine',
      year: '1st Year',
      university: 'Euphrates Medical Institute',
      image: 'https://i.pravatar.cc/150?img=47',
      bio: 'Dedicated to healthcare and healing',
      email: 'zahra.mohammed@student.edu',
      phone: '+964 773 456 7890',
      location: 'Najaf, Iraq',
      gpa: '4.0',
      isVerified: true, // Demo verification status
      skills: ['Patient Care', 'Medical Research', 'Anatomy', 'Clinical Skills'],
      interests: ['Pediatrics', 'Medical Research', 'Public Health'],
      achievements: ['Top of Class', 'Medical Scholarship Recipient', 'Volunteer at Local Clinic'],
      about: 'First-year medical student with a strong commitment to healthcare and patient welfare. Volunteering at local clinics to gain practical experience and contribute to community health. Aspiring to specialize in pediatrics.',
    },
    {
      id: 5,
      name: 'Youssef Ibrahim',
      major: 'Data Science',
      year: '3rd Year',
      university: 'Mesopotamia Science College',
      image: 'https://i.pravatar.cc/150?img=51',
      bio: 'Data enthusiast and problem solver',
      email: 'youssef.ibrahim@student.edu',
      phone: '+964 774 567 8901',
      location: 'Basra, Iraq',
      gpa: '3.85',
      isVerified: false, // Demo verification status
      skills: ['Python', 'R', 'SQL', 'Data Visualization', 'Machine Learning'],
      interests: ['Big Data', 'Predictive Analytics', 'Business Intelligence'],
      achievements: ['Data Science Competition Winner', 'Research Publication', 'Industry Internship'],
      about: 'Data science student with expertise in statistical analysis and machine learning. Experienced in working with large datasets and creating predictive models. Currently interning at a tech company focusing on business intelligence solutions.',
    },
  ]);

  // Demo lecturers data
  const [lecturers] = useState([
    {
      id: 1,
      name: 'Dr. Sarah Khan',
      specialty: 'Computer Science',
      experience: '10 years',
      university: 'Baghdad International Academy',
      image: 'https://i.pravatar.cc/150?img=20',
      bio: 'PhD in AI, Published researcher',
      email: 'sarah.khan@university.edu',
      phone: '+964 770 987 6543',
      location: 'Baghdad, Iraq',
      isVerified: true, // Demo verification status
      education: 'PhD in Artificial Intelligence - MIT',
      courses: ['Introduction to Programming', 'Machine Learning', 'Data Structures', 'AI Fundamentals'],
      research: ['Neural Networks', 'Deep Learning', 'Computer Vision'],
      publications: '25+ research papers in top-tier journals',
      achievements: ['Best Teacher Award 2023', 'Research Excellence Award', 'IEEE Senior Member'],
      about: 'Dr. Sarah Khan is a distinguished professor specializing in Artificial Intelligence and Machine Learning. With over 10 years of teaching experience and extensive research background, she has mentored hundreds of students and published numerous papers in leading journals. Her research focuses on neural networks and their applications in real-world problems.',
    },
    {
      id: 2,
      name: 'Prof. Ali Mahmoud',
      specialty: 'Business Management',
      experience: '15 years',
      university: 'Tigris Business School',
      image: 'https://i.pravatar.cc/150?img=13',
      bio: 'MBA, Former CEO, Business consultant',
      email: 'ali.mahmoud@university.edu',
      phone: '+964 771 876 5432',
      location: 'Erbil, Iraq',
      isVerified: true, // Demo verification status
      education: 'MBA - Harvard Business School',
      courses: ['Business Strategy', 'Leadership', 'Entrepreneurship', 'Marketing Management'],
      research: ['Strategic Management', 'Digital Transformation', 'Innovation'],
      publications: 'Author of 3 business books',
      achievements: ['Former Fortune 500 CEO', 'Business Consultant for 50+ companies', 'TED Speaker'],
      about: 'Professor Ali Mahmoud brings 15 years of real-world business experience to the classroom. As a former CEO and successful entrepreneur, he combines academic theory with practical insights. His teaching style focuses on case studies and real business scenarios, preparing students for leadership roles in the corporate world.',
    },
    {
      id: 3,
      name: 'Dr. Layla Hassan',
      specialty: 'Medical Sciences',
      experience: '12 years',
      university: 'Euphrates Medical Institute',
      image: 'https://i.pravatar.cc/150?img=38',
      bio: 'MD, Specialized in Internal Medicine',
      email: 'layla.hassan@university.edu',
      phone: '+964 772 765 4321',
      location: 'Najaf, Iraq',
      isVerified: false, // Demo verification status
      education: 'MD, Fellowship in Internal Medicine',
      courses: ['Human Anatomy', 'Physiology', 'Internal Medicine', 'Clinical Practice'],
      research: ['Cardiovascular Health', 'Preventive Medicine', 'Patient Care'],
      publications: '15+ medical journal publications',
      achievements: ['Medical Excellence Award', 'Best Clinical Instructor', 'Healthcare Innovation Award'],
      about: 'Dr. Layla Hassan is a practicing physician and dedicated educator with 12 years of experience in internal medicine. She combines her clinical expertise with teaching to provide students with comprehensive medical education. Her research focuses on cardiovascular health and preventive medicine.',
    },
    {
      id: 4,
      name: 'Prof. Karim Saleh',
      specialty: 'Mathematics',
      experience: '20 years',
      university: 'Baghdad Technical University',
      image: 'https://i.pravatar.cc/150?img=14',
      bio: 'PhD in Applied Mathematics',
      email: 'karim.saleh@university.edu',
      phone: '+964 773 654 3210',
      location: 'Baghdad, Iraq',
      isVerified: true, // Demo verification status
      education: 'PhD in Applied Mathematics - Oxford University',
      courses: ['Calculus', 'Linear Algebra', 'Differential Equations', 'Mathematical Modeling'],
      research: ['Applied Mathematics', 'Numerical Analysis', 'Mathematical Physics'],
      publications: '40+ research papers',
      achievements: ['Distinguished Professor Award', 'Mathematics Society Fellow', 'Textbook Author'],
      about: 'Professor Karim Saleh is a renowned mathematician with 20 years of teaching experience. His expertise in applied mathematics has helped countless students understand complex mathematical concepts. He has authored several textbooks and is known for his engaging teaching methods that make mathematics accessible and interesting.',
    },
    {
      id: 5,
      name: 'Dr. Noor Ahmed',
      specialty: 'Engineering',
      experience: '8 years',
      university: 'Kurdistan Technical University',
      image: 'https://i.pravatar.cc/150?img=44',
      bio: 'PhD in Mechanical Engineering',
      email: 'noor.ahmed@university.edu',
      phone: '+964 774 543 2109',
      location: 'Sulaymaniyah, Iraq',
      isVerified: false, // Demo verification status
      education: 'PhD in Mechanical Engineering - Stanford University',
      courses: ['Thermodynamics', 'Fluid Mechanics', 'Engineering Design', 'Robotics'],
      research: ['Renewable Energy', 'Robotics', 'Sustainable Engineering'],
      publications: '12+ engineering journals',
      achievements: ['Young Engineer Award', 'Innovation in Teaching', 'Patent Holder'],
      about: 'Dr. Noor Ahmed specializes in mechanical engineering with a focus on sustainable solutions and robotics. With 8 years of teaching and research experience, she brings innovative approaches to engineering education. Her work on renewable energy systems has been recognized internationally.',
    },
  ]);

  // Demo courses data
  const [courses] = useState([
    {
      id: 1,
      title: 'Introduction to Programming',
      code: 'CS101',
      institution: 'Baghdad International Academy',
      instructor: 'Dr. Sarah Khan',
      duration: '12 weeks',
      students: 45,
      price: 350,
      level: 'Beginner',
    },
    {
      id: 2,
      title: 'Business Strategy & Management',
      code: 'BUS201',
      institution: 'Tigris Business School',
      instructor: 'Prof. Ali Mahmoud',
      duration: '10 weeks',
      students: 38,
      price: 450,
      level: 'Intermediate',
    },
    {
      id: 3,
      title: 'Human Anatomy & Physiology',
      code: 'MED101',
      institution: 'Euphrates Medical Institute',
      instructor: 'Dr. Layla Hassan',
      duration: '16 weeks',
      students: 52,
      price: 600,
      level: 'Beginner',
    },
    {
      id: 4,
      title: 'Advanced Calculus',
      code: 'MATH301',
      institution: 'Iraqi Science Academy',
      instructor: 'Prof. Karim Saleh',
      duration: '14 weeks',
      students: 30,
      price: 400,
      level: 'Advanced',
    },
    {
      id: 5,
      title: 'Mechanical Engineering Fundamentals',
      code: 'ENG102',
      institution: 'Kurdistan Technical University',
      instructor: 'Dr. Noor Ahmed',
      duration: '15 weeks',
      students: 42,
      price: 500,
      level: 'Intermediate',
    },
  ]);

  // Check authentication status on mount
  useEffect(() => {
    // Verify if user has valid authentication data
    const hasValidAuth = instituteData.accessToken && instituteData.isAuthenticated;
    
    if (hasValidAuth) {
      console.log('User is authenticated:', {
        name: instituteData.name || instituteData.username,
        email: instituteData.email,
        userType: instituteData.userType,
        isVerified: instituteData.isVerified
      });

      // Fetch latest verification status for institutions
      if (instituteData.email && instituteData.userType === 'institution' && instituteData.accessToken) {
        const checkVerification = async () => {
          try {
            const verificationStatus = await authService.checkVerificationStatus(
              instituteData.email,
              instituteData.accessToken
            );
            if (verificationStatus?.is_verified !== instituteData.isVerified) {
              updateInstituteData({
                isVerified: verificationStatus?.is_verified || false,
              });
              console.log('Verification status updated:', verificationStatus?.is_verified);
            }
          } catch (error) {
            console.warn('Failed to check verification status on feed load:', error);
          }
        };
        checkVerification();
      }
    } else {
      console.log('User is not authenticated - showing public feed');
    }
  }, [instituteData.accessToken, instituteData.isAuthenticated, instituteData.email, instituteData.userType]);

  // Mixed Feed Data (Social Media Style)
  useEffect(() => {
    const mixedFeed = [
      // Institution Card
      {
        id: 1,
        type: 'institution',
        title: 'Baghdad Science Institute',
        description: 'Leading educational center offering comprehensive programs in Science, Technology, Engineering, and Mathematics. Join our community of excellence.',
        location: 'Baghdad, Iraq',
        students: 450,
        lecturers: 35,
        image: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=800&q=80',
        timestamp: '2 hours ago',
        likes: 45,
        comments: 12,
      },
      // Lecturer Job Post
      {
        id: 2,
        type: 'job_post',
        lecturerName: 'Dr. Sarah Khan',
        lecturerImage: 'https://i.pravatar.cc/150?img=20',
        specialty: 'Computer Science',
        experience: '10 years',
        message: 'Looking for a teaching position in Computer Science. Specialized in AI and Machine Learning. Available for full-time or part-time positions.',
        location: 'Baghdad, Iraq',
        contact: 'sarah.khan@email.com',
        timestamp: '5 hours ago',
        likes: 28,
        comments: 8,
      },
      // Institution Achievement
      {
        id: 3,
        type: 'achievement',
        institutionName: 'Baghdad International Academy',
        institutionImage: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=400&q=80',
        achievement: 'Awarded Best Educational Institution 2024',
        description: 'We are proud to announce that we have been recognized as the Best Educational Institution of 2024 for our outstanding contribution to education and student success.',
        location: 'Baghdad, Iraq',
        timestamp: '1 day ago',
        likes: 156,
        comments: 34,
      },
      // Institution Card
      {
        id: 4,
        type: 'institution',
        title: 'Mesopotamia Science College',
        description: 'Specialized in advanced sciences and research programs. Our graduates excel in their fields with cutting-edge knowledge and practical skills.',
        location: 'Basra, Iraq',
        students: 320,
        lecturers: 28,
        image: 'https://images.unsplash.com/photo-1562774053-701939374585?w=800&q=80',
        timestamp: '1 day ago',
        likes: 32,
        comments: 7,
      },
      // Lecturer Job Post
      {
        id: 5,
        type: 'job_post',
        lecturerName: 'Prof. Ali Mahmoud',
        lecturerImage: 'https://i.pravatar.cc/150?img=13',
        specialty: 'Business Management',
        experience: '15 years',
        message: 'Experienced business professor seeking opportunities to teach strategic management and entrepreneurship. Open to consulting roles as well.',
        location: 'Erbil, Iraq',
        contact: 'ali.mahmoud@email.com',
        timestamp: '2 days ago',
        likes: 42,
        comments: 15,
      },
      // Institution Achievement
      {
        id: 6,
        type: 'achievement',
        institutionName: 'Tigris Business School',
        institutionImage: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=400&q=80',
        achievement: '1000+ Graduates Successfully Placed',
        description: 'Celebrating a major milestone! Over 1000 of our graduates have been successfully placed in top companies across Iraq and the region.',
        location: 'Erbil, Iraq',
        timestamp: '3 days ago',
        likes: 203,
        comments: 52,
      },
      // Institution Card
      {
        id: 7,
        type: 'institution',
        title: 'Euphrates Medical Institute',
        description: 'Training future healthcare professionals with state-of-the-art facilities and expert medical faculty. Your journey to medical excellence starts here.',
        location: 'Najaf, Iraq',
        students: 390,
        lecturers: 45,
        image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&q=80',
        timestamp: '3 days ago',
        likes: 67,
        comments: 18,
      },
      // Lecturer Job Post
      {
        id: 8,
        type: 'job_post',
        lecturerName: 'Dr. Layla Hassan',
        lecturerImage: 'https://i.pravatar.cc/150?img=38',
        specialty: 'Medical Sciences',
        experience: '12 years',
        message: 'Medical professional with extensive teaching experience looking for a position in medical education. Specialized in Internal Medicine and Clinical Practice.',
        location: 'Najaf, Iraq',
        contact: 'layla.hassan@email.com',
        timestamp: '4 days ago',
        likes: 35,
        comments: 11,
      },
      // Institution Achievement
      {
        id: 9,
        type: 'achievement',
        institutionName: 'Kurdistan Technical University',
        institutionImage: 'https://images.unsplash.com/photo-1498243691581-b145c3f54a5a?w=400&q=80',
        achievement: 'New Research Lab Inaugurated',
        description: 'We are excited to announce the opening of our new state-of-the-art research laboratory, equipped with the latest technology for engineering research.',
        location: 'Sulaymaniyah, Iraq',
        timestamp: '5 days ago',
        likes: 89,
        comments: 23,
      },
    ];
    setFeedItems(mixedFeed);
  }, []);

  // Close notifications when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };

    if (showNotifications) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showNotifications]);

  const handleLogout = () => {
    // Clear all institute data
    localStorage.removeItem('instituteData');
    
    updateInstituteData({
      name: '',
      email: '',
      username: '',
      firstName: '',
      lastName: '',
      userId: null,
      userType: '',
      accessToken: '',
      refreshToken: '',
      isAuthenticated: false,
      isVerified: false,
    });
    
    setShowUserMenu(false);
    toast.success(t('feed.loggedOutSuccess'));
    
    // Force page reload to ensure clean state
    window.location.reload();
  };

  const handleSubscribe = (institutionName) => {
    if (!instituteData.isAuthenticated) {
      toast.error(t('feed.loginToSubscribe'));
      navigate('/home'); // Navigate to account type selection page
      return;
    }
    toast.success(`${t('feed.subscribedSuccess')} ${institutionName}!`);
  };

  const handleViewProfile = (profile, type) => {
    setSelectedProfile(profile);
    setProfileType(type);
  };

  const handleCloseProfile = () => {
    setSelectedProfile(null);
    setProfileType(null);
  };

  const isInstitution = instituteData.userType === 'institution';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-navy-900 transition-colors flex">
      {/* Left Sidebar - Desktop: Hover, Mobile: Logo Click */}
      <aside 
        className={`hidden lg:block bg-white dark:bg-navy-800 shadow-xl border-r border-gray-200 dark:border-navy-700 fixed left-0 top-0 bottom-0 overflow-y-auto z-40 transition-all duration-300 ${
          isSidebarExpanded ? 'w-80' : 'w-20'
        }`}
        onMouseEnter={() => setIsSidebarExpanded(true)}
        onMouseLeave={() => setIsSidebarExpanded(false)}
      >
        <div className="p-6">
          <h2 className={`text-xl font-bold text-gray-800 dark:text-white mb-6 transition-opacity duration-300 ${
            isSidebarExpanded ? 'opacity-100' : 'opacity-0'
          }`}>
            {t('feed.explore')}
          </h2>
          
          {/* Sidebar Navigation Buttons */}
          <div className="space-y-2 mb-6">
            <button
              onClick={() => setSidebarView('students')}
              className={`w-full flex items-center ${isSidebarExpanded ? 'gap-3' : 'justify-center'} px-4 py-3 rounded-lg transition-all ${
                sidebarView === 'students'
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-navy-700'
              }`}
              title={t('feed.students')}
            >
              <FaUserGraduate className="w-5 h-5 flex-shrink-0" />
              {isSidebarExpanded && <span className="font-medium">{t('feed.students')}</span>}
            </button>
            
            <button
              onClick={() => setSidebarView('lecturers')}
              className={`w-full flex items-center ${isSidebarExpanded ? 'gap-3' : 'justify-center'} px-4 py-3 rounded-lg transition-all ${
                sidebarView === 'lecturers'
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-navy-700'
              }`}
              title={t('feed.lecturers')}
            >
              <FaChalkboardTeacher className="w-5 h-5 flex-shrink-0" />
              {isSidebarExpanded && <span className="font-medium">{t('feed.lecturers')}</span>}
            </button>
            
            <button
              onClick={() => setSidebarView('courses')}
              className={`w-full flex items-center ${isSidebarExpanded ? 'gap-3' : 'justify-center'} px-4 py-3 rounded-lg transition-all ${
                sidebarView === 'courses'
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-navy-700'
              }`}
              title={t('feed.exploreCourses')}
            >
              <FaCompass className="w-5 h-5 flex-shrink-0" />
              {isSidebarExpanded && <span className="font-medium">{t('feed.exploreCourses')}</span>}
            </button>
            
            <button
              onClick={() => navigate('/about')}
              className={`w-full flex items-center ${isSidebarExpanded ? 'gap-3' : 'justify-center'} px-4 py-3 rounded-lg transition-all text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-navy-700`}
              title={t('feed.aboutUs')}
            >
              <FaInfoCircle className="w-5 h-5 flex-shrink-0" />
              {isSidebarExpanded && <span className="font-medium">{t('feed.aboutUs')}</span>}
            </button>
          </div>

          {/* Sidebar Content */}
          {isSidebarExpanded && (
            <div className="space-y-4">

            {sidebarView === 'students' && students.map((student) => (
              <motion.div
                key={student.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                onClick={() => handleViewProfile(student, 'student')}
                className="p-4 bg-gray-50 dark:bg-navy-900 rounded-lg hover:bg-gray-100 dark:hover:bg-navy-700 transition-all cursor-pointer"
              >
                <div className="flex items-start gap-3">
                  <img
                    src={student.image}
                    alt={student.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-800 dark:text-white text-sm truncate">
                      {student.name}
                    </h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                      {student.major}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500">
                      {student.year} • {student.university}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                      {student.bio}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}

            {sidebarView === 'lecturers' && lecturers.map((lecturer) => (
              <motion.div
                key={lecturer.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                onClick={() => handleViewProfile(lecturer, 'lecturer')}
                className="p-4 bg-gray-50 dark:bg-navy-900 rounded-lg hover:bg-gray-100 dark:hover:bg-navy-700 transition-all cursor-pointer"
              >
                <div className="flex items-start gap-3">
                  <img
                    src={lecturer.image}
                    alt={lecturer.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-800 dark:text-white text-sm truncate">
                      {lecturer.name}
                    </h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                      {lecturer.specialty}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500">
                      {lecturer.experience} • {lecturer.university}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                      {lecturer.bio}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}

            {sidebarView === 'courses' && (
              <>
                <motion.button
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  onClick={() => navigate('/courses')}
                  className="w-full px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-lg font-semibold text-sm transition-colors flex items-center justify-center gap-2 mb-4"
                >
                  <FaBook className="w-4 h-4" />
                  {t('feed.viewAllCourses')}
                </motion.button>
                {courses.map((course) => (
                  <motion.div
                    key={course.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="p-4 bg-gray-50 dark:bg-navy-900 rounded-lg hover:bg-gray-100 dark:hover:bg-navy-700 transition-all cursor-pointer"
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-semibold text-gray-800 dark:text-white text-sm line-clamp-2">
                          {course.title}
                        </h4>
                        <span className="px-2 py-1 bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 rounded text-xs font-semibold whitespace-nowrap">
                          {course.level}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {course.code} • {course.instructor}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500 truncate">
                        {course.institution}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-1">
                          <FaClock className="w-3 h-3" />
                          <span>{course.duration}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <FaUsers className="w-3 h-3" />
                          <span>{course.students}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <FaDollarSign className="w-3 h-3" />
                          <span>${course.price}</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </>
            )}
            </div>
          )}
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isMobileSidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileSidebarOpen(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
            />
            <motion.aside
              initial={{ x: -320 }}
              animate={{ x: 0 }}
              exit={{ x: -320 }}
              transition={{ type: 'spring', damping: 20 }}
              className="fixed left-0 top-0 bottom-0 w-80 bg-white dark:bg-navy-800 shadow-2xl z-50 lg:hidden overflow-y-auto"
            >
              <div className="p-6">
                {/* Mobile Sidebar Header */}
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                    {t('feed.explore')}
                  </h2>
                  <motion.button
                    whileHover={{ rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setIsMobileSidebarOpen(false)}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-navy-700"
                  >
                    <FaTimes className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  </motion.button>
                </div>
                
                {/* Mobile Sidebar Navigation Buttons */}
                <div className="space-y-2 mb-6">
                  <button
                    onClick={() => {
                      setSidebarView('students');
                      setIsMobileSidebarOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                      sidebarView === 'students'
                        ? 'bg-primary-600 text-white'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-navy-700'
                    }`}
                  >
                    <FaUserGraduate className="w-5 h-5 flex-shrink-0" />
                    <span className="font-medium">{t('feed.students')}</span>
                  </button>
                  
                  <button
                    onClick={() => {
                      setSidebarView('lecturers');
                      setIsMobileSidebarOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                      sidebarView === 'lecturers'
                        ? 'bg-primary-600 text-white'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-navy-700'
                    }`}
                  >
                    <FaChalkboardTeacher className="w-5 h-5 flex-shrink-0" />
                    <span className="font-medium">{t('feed.lecturers')}</span>
                  </button>
                  
                  <button
                    onClick={() => {
                      setSidebarView('courses');
                      setIsMobileSidebarOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                      sidebarView === 'courses'
                        ? 'bg-primary-600 text-white'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-navy-700'
                    }`}
                  >
                    <FaCompass className="w-5 h-5 flex-shrink-0" />
                    <span className="font-medium">{t('feed.exploreCourses')}</span>
                  </button>
                  
                  <button
                    onClick={() => {
                      navigate('/about');
                      setIsMobileSidebarOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-navy-700"
                  >
                    <FaInfoCircle className="w-5 h-5 flex-shrink-0" />
                    <span className="font-medium">{t('feed.aboutUs')}</span>
                  </button>
                </div>

                {/* Mobile Sidebar Content */}
                <div className="space-y-4">
                  {sidebarView === 'students' && students.map((student) => (
                    <motion.div
                      key={student.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      onClick={() => {
                        handleViewProfile(student, 'student');
                        setIsMobileSidebarOpen(false);
                      }}
                      className="p-4 bg-gray-50 dark:bg-navy-900 rounded-lg hover:bg-gray-100 dark:hover:bg-navy-700 transition-all cursor-pointer"
                    >
                      <div className="flex items-start gap-3">
                        <img
                          src={student.image}
                          alt={student.name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-800 dark:text-white text-sm truncate">
                            {student.name}
                          </h4>
                          <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                            {student.major}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-500">
                            {student.year} • {student.university}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))}

                  {sidebarView === 'lecturers' && lecturers.map((lecturer) => (
                    <motion.div
                      key={lecturer.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      onClick={() => {
                        handleViewProfile(lecturer, 'lecturer');
                        setIsMobileSidebarOpen(false);
                      }}
                      className="p-4 bg-gray-50 dark:bg-navy-900 rounded-lg hover:bg-gray-100 dark:hover:bg-navy-700 transition-all cursor-pointer"
                    >
                      <div className="flex items-start gap-3">
                        <img
                          src={lecturer.image}
                          alt={lecturer.name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-800 dark:text-white text-sm truncate">
                            {lecturer.name}
                          </h4>
                          <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                            {lecturer.specialty}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-500">
                            {lecturer.experience} • {lecturer.university}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))}

                  {sidebarView === 'courses' && (
                    <>
                      <motion.button
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        onClick={() => {
                          navigate('/courses');
                          setIsMobileSidebarOpen(false);
                        }}
                        className="w-full px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-lg font-semibold text-sm transition-colors flex items-center justify-center gap-2 mb-4"
                      >
                        <FaBook className="w-4 h-4" />
                        {t('feed.viewAllCourses')}
                      </motion.button>
                      {courses.map((course) => (
                        <motion.div
                          key={course.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="p-4 bg-gray-50 dark:bg-navy-900 rounded-lg hover:bg-gray-100 dark:hover:bg-navy-700 transition-all cursor-pointer"
                        >
                          <div className="space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <h4 className="font-semibold text-gray-800 dark:text-white text-sm line-clamp-2">
                                {course.title}
                              </h4>
                              <span className="px-2 py-1 bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 rounded text-xs font-semibold whitespace-nowrap">
                                {course.level}
                              </span>
                            </div>
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                              {course.code} • {course.instructor}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-500 truncate">
                              {course.institution}
                            </p>
                            <div className="flex items-center gap-3 text-xs text-gray-600 dark:text-gray-400">
                              <div className="flex items-center gap-1">
                                <FaClock className="w-3 h-3" />
                                <span>{course.duration}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <FaUsers className="w-3 h-3" />
                                <span>{course.students}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <FaDollarSign className="w-3 h-3" />
                                <span>${course.price}</span>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </>
                  )}
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className={`flex-1 transition-all duration-300 ${isSidebarExpanded ? 'lg:ml-80' : 'lg:ml-20'}`}>
        {/* Navigation Bar */}
        <nav className="bg-white dark:bg-navy-800 shadow-lg sticky top-0 z-50 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`flex ${isRTL ? 'flex-row-reverse' : 'flex-row'} justify-between items-center h-16 ${isRTL ? 'gap-4' : 'gap-4'}`}>
            {/* Logo - Clickable on Mobile to Open Sidebar */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3 cursor-pointer"
              onClick={() => {
                // On mobile, open sidebar; on desktop, navigate home
                if (window.innerWidth < 1024) {
                  setIsMobileSidebarOpen(true);
                } else {
                  navigate('/');
                }
              }}
            >
              <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-teal-500 rounded-lg flex items-center justify-center">
                <FaUniversity className="text-white text-xl" />
              </div>
              <span className="text-xl font-bold text-gray-800 dark:text-white">
                Project East
              </span>
            </motion.div>

            {/* Right Side */}
            <div className={`flex items-center gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
              {/* Search Bar */}
              <div className={`hidden md:flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-navy-700 rounded-lg border border-gray-300 dark:border-navy-600 transition-colors ${isRTL ? 'flex-row-reverse' : ''}`}>
                <FaSearch className={`text-gray-400 dark:text-gray-500 ${isRTL ? 'order-2' : ''}`} />
                <input
                  type="text"
                  placeholder={t('feed.searchInstitutions')}
                  className={`bg-transparent outline-none text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 w-48 lg:w-64 ${isRTL ? 'text-right' : 'text-left'}`}
                  readOnly
                />
              </div>

              {/* Mobile Search Button */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-navy-700 transition-colors"
              >
                <FaSearch className="text-gray-600 dark:text-gray-400 text-xl" />
              </motion.button>

              {/* Language Switcher */}
              <LanguageSwitcher />

              {/* Theme Toggle */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={toggleTheme}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-navy-700 transition-colors"
              >
                {isDark ? (
                  <FaSun className="text-yellow-400 text-xl" />
                ) : (
                  <FaMoon className="text-gray-600 text-xl" />
                )}
              </motion.button>

              {/* Student/Lecturer Navigation Buttons */}
              {instituteData.isAuthenticated && (instituteData.userType === 'student' || instituteData.userType === 'lecturer') && (
                <>
                  {/* Notification Button for Students */}
                  <div className="relative" ref={notificationRef}>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setShowNotifications(!showNotifications)}
                      className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-navy-700 transition-colors"
                    >
                      <FaBell className="text-gray-600 dark:text-gray-400 text-xl" />
                      {notifications.filter(n => !n.read).length > 0 && (
                        <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                          {notifications.filter(n => !n.read).length}
                        </span>
                      )}
                    </motion.button>

                    {/* Notification Popup */}
                    <AnimatePresence>
                      {showNotifications && (
                        <motion.div
                          initial={{ opacity: 0, y: -10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -10, scale: 0.95 }}
                          className={`absolute ${isRTL ? 'left-0' : 'right-0'} mt-2 w-80 bg-white dark:bg-navy-800 rounded-xl shadow-2xl border border-gray-200 dark:border-navy-700 overflow-hidden z-50`}
                        >
                          <div className={`p-4 border-b border-gray-200 dark:border-navy-700 flex items-center ${isRTL ? 'flex-row-reverse' : ''} justify-between`}>
                            <h3 className="font-bold text-gray-800 dark:text-white">{t('nav.notifications')}</h3>
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              {notifications.filter(n => !n.read).length} {t('feed.new')}
                            </span>
                          </div>
                          <div className="max-h-96 overflow-y-auto">
                            {notifications.length === 0 ? (
                              <div className={`p-8 ${isRTL ? 'text-right' : 'text-center'} text-gray-500 dark:text-gray-400`}>
                                {t('nav.noNotifications')}
                              </div>
                            ) : (
                              notifications.map((notification) => (
                                <motion.div
                                  key={notification.id}
                                  initial={{ opacity: 0, x: -20 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  className={`p-4 border-b border-gray-100 dark:border-navy-700 hover:bg-gray-50 dark:hover:bg-navy-900 transition-colors cursor-pointer ${
                                    !notification.read ? 'bg-primary-50 dark:bg-primary-900/20' : ''
                                  }`}
                                  onClick={() => setShowNotifications(false)}
                                >
                                  <div className={`flex items-start gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                                    <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                                      !notification.read ? 'bg-primary-600' : 'bg-transparent'
                                    }`} />
                                    <div className={`flex-1 min-w-0 ${isRTL ? 'text-right' : 'text-left'}`}>
                                      <h4 className="font-semibold text-sm text-gray-800 dark:text-white mb-1">
                                        {notification.title}
                                      </h4>
                                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                                        {notification.message}
                                      </p>
                                      <p className="text-xs text-gray-500 dark:text-gray-500">
                                        {notification.time}
                                      </p>
                                    </div>
                                  </div>
                                </motion.div>
                              ))
                            )}
                          </div>
                          <div className="p-3 border-t border-gray-200 dark:border-navy-700 text-center">
                            <button className="text-sm text-primary-600 dark:text-teal-400 hover:underline font-medium">
                              {t('nav.viewAllNotifications')}
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {instituteData.userType === 'student' && (
                    <>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => navigate('/student/schedule')}
                        className={`hidden sm:flex items-center ${isRTL ? 'flex-row-reverse' : ''} gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors`}
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"/>
                        </svg>
                        <span>{t('nav.schedule')}</span>
                      </motion.button>

                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => navigate('/student/courses')}
                        className={`hidden sm:flex items-center ${isRTL ? 'flex-row-reverse' : ''} gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-lg transition-colors`}
                      >
                        <FaBook className="w-5 h-5" />
                        <span>{t('nav.currentCourses')}</span>
                      </motion.button>
                    </>
                  )}

                  {instituteData.userType === 'lecturer' && (
                    <>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => navigate('/lecturer/schedule')}
                        className={`hidden sm:flex items-center ${isRTL ? 'flex-row-reverse' : ''} gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors`}
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"/>
                        </svg>
                        <span>{t('nav.schedule')}</span>
                      </motion.button>

                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => navigate('/lecturer/courses')}
                        className={`hidden sm:flex items-center ${isRTL ? 'flex-row-reverse' : ''} gap-2 px-4 py-2 bg-pink-600 hover:bg-pink-500 text-white rounded-lg transition-colors`}
                      >
                        <FaBook className="w-5 h-5" />
                        <span>{t('nav.currentCourses')}</span>
                      </motion.button>
                    </>
                  )}
                </>
              )}

              {/* Dashboard Link (Institution Only) */}
              {instituteData.isAuthenticated && isInstitution && (
                <>
                  {/* Notification Button */}
                  <div className="relative" ref={notificationRef}>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setShowNotifications(!showNotifications)}
                      className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-navy-700 transition-colors"
                    >
                      <FaBell className="text-gray-600 dark:text-gray-400 text-xl" />
                      {notifications.filter(n => !n.read).length > 0 && (
                        <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                          {notifications.filter(n => !n.read).length}
                        </span>
                      )}
                    </motion.button>

                    {/* Notification Popup */}
                    <AnimatePresence>
                      {showNotifications && (
                        <motion.div
                          initial={{ opacity: 0, y: -10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -10, scale: 0.95 }}
                          className={`absolute ${isRTL ? 'left-0' : 'right-0'} mt-2 w-80 bg-white dark:bg-navy-800 rounded-xl shadow-2xl border border-gray-200 dark:border-navy-700 overflow-hidden z-50`}
                        >
                          <div className={`p-4 border-b border-gray-200 dark:border-navy-700 flex items-center ${isRTL ? 'flex-row-reverse' : ''} justify-between`}>
                            <h3 className="font-bold text-gray-800 dark:text-white">{t('nav.notifications')}</h3>
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              {notifications.filter(n => !n.read).length} {t('feed.new')}
                            </span>
                          </div>
                          <div className="max-h-96 overflow-y-auto">
                            {notifications.length === 0 ? (
                              <div className={`p-8 ${isRTL ? 'text-right' : 'text-center'} text-gray-500 dark:text-gray-400`}>
                                {t('nav.noNotifications')}
                              </div>
                            ) : (
                              notifications.map((notification) => (
                                <motion.div
                                  key={notification.id}
                                  initial={{ opacity: 0, x: -20 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  className={`p-4 border-b border-gray-100 dark:border-navy-700 hover:bg-gray-50 dark:hover:bg-navy-900 transition-colors cursor-pointer ${
                                    !notification.read ? 'bg-primary-50 dark:bg-primary-900/20' : ''
                                  }`}
                                  onClick={() => setShowNotifications(false)}
                                >
                                  <div className={`flex items-start gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                                    <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                                      !notification.read ? 'bg-primary-600' : 'bg-transparent'
                                    }`} />
                                    <div className={`flex-1 min-w-0 ${isRTL ? 'text-right' : 'text-left'}`}>
                                      <h4 className="font-semibold text-sm text-gray-800 dark:text-white mb-1">
                                        {notification.title}
                                      </h4>
                                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                                        {notification.message}
                                      </p>
                                      <p className="text-xs text-gray-500 dark:text-gray-500">
                                        {notification.time}
                                      </p>
                                    </div>
                                  </div>
                                </motion.div>
                              ))
                            )}
                          </div>
                          <div className="p-3 border-t border-gray-200 dark:border-navy-700 text-center">
                            <button className="text-sm text-primary-600 dark:text-teal-400 hover:underline font-medium">
                              {t('nav.viewAllNotifications')}
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate('/dashboard')}
                    className={`hidden sm:flex items-center ${isRTL ? 'flex-row-reverse' : ''} gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-lg transition-colors`}
                  >
                    <FaTachometerAlt />
                    <span>{t('nav.dashboard')}</span>
                  </motion.button>
                </>
              )}

              {/* User Menu or Login/Signup */}
              {instituteData.isAuthenticated ? (
                <div className="relative">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''} gap-2 px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-navy-700 transition-colors`}
                  >
                    <div className="w-8 h-8 bg-gradient-to-br from-primary-600 to-teal-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-sm">
                        {instituteData.name?.[0]?.toUpperCase() || 'U'}
                      </span>
                    </div>
                    <span className="hidden sm:block text-gray-800 dark:text-white font-medium">
                      {instituteData.name || instituteData.username || 'User'}
                    </span>
                  </motion.button>

                  <AnimatePresence>
                    {showUserMenu && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className={`absolute ${isRTL ? 'left-0' : 'right-0'} mt-2 w-48 bg-white dark:bg-navy-800 rounded-lg shadow-xl border border-gray-200 dark:border-navy-700 overflow-hidden`}
                      >
                        <div className={`p-3 border-b border-gray-200 dark:border-navy-700 ${isRTL ? 'text-right' : 'text-left'}`}>
                          <p className="text-sm font-semibold text-gray-800 dark:text-white">
                            {instituteData.name || instituteData.username}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {instituteData.email}
                          </p>
                          {instituteData.userType === 'lecturer' && (
                            <div className="mt-2 pt-2 border-t border-gray-200 dark:border-navy-700">
                              <p className="text-xs text-gray-500 dark:text-gray-500">Institution</p>
                              <p className={`text-sm font-medium text-primary-600 dark:text-teal-400 flex items-center ${isRTL ? 'flex-row-reverse' : ''} gap-1`}>
                                <FaUniversity className="w-3 h-3" />
                                {instituteData.institution || t('feed.institution')}
                              </p>
                            </div>
                          )}
                        </div>

                        {isInstitution && (
                          <button
                            onClick={() => {
                              navigate('/dashboard');
                              setShowUserMenu(false);
                            }}
                            className={`w-full px-4 py-2 ${isRTL ? 'text-right' : 'text-left'} text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-navy-700 flex items-center ${isRTL ? 'flex-row-reverse' : ''} gap-2 transition-colors sm:hidden`}
                          >
                            <FaTachometerAlt />
                            {t('nav.dashboard')}
                          </button>
                        )}

                        {instituteData.userType === 'student' && (
                          <>
                            <button
                              onClick={() => {
                                navigate('/student/schedule');
                                setShowUserMenu(false);
                              }}
                              className={`w-full px-4 py-2 ${isRTL ? 'text-right' : 'text-left'} text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-navy-700 flex items-center ${isRTL ? 'flex-row-reverse' : ''} gap-2 transition-colors sm:hidden`}
                            >
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"/>
                              </svg>
                              {t('nav.schedule')}
                            </button>
                            <button
                              onClick={() => {
                                navigate('/student/courses');
                                setShowUserMenu(false);
                              }}
                              className={`w-full px-4 py-2 ${isRTL ? 'text-right' : 'text-left'} text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-navy-700 flex items-center ${isRTL ? 'flex-row-reverse' : ''} gap-2 transition-colors sm:hidden`}
                            >
                              <FaBook className="w-4 h-4" />
                              {t('nav.currentCourses')}
                            </button>
                          </>
                        )}

                        {instituteData.userType === 'lecturer' && (
                          <>
                            <button
                              onClick={() => {
                                navigate('/lecturer/schedule');
                                setShowUserMenu(false);
                              }}
                              className={`w-full px-4 py-2 ${isRTL ? 'text-right' : 'text-left'} text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-navy-700 flex items-center ${isRTL ? 'flex-row-reverse' : ''} gap-2 transition-colors sm:hidden`}
                            >
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"/>
                              </svg>
                              {t('nav.schedule')}
                            </button>
                            <button
                              onClick={() => {
                                navigate('/lecturer/courses');
                                setShowUserMenu(false);
                              }}
                              className={`w-full px-4 py-2 ${isRTL ? 'text-right' : 'text-left'} text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-navy-700 flex items-center ${isRTL ? 'flex-row-reverse' : ''} gap-2 transition-colors sm:hidden`}
                            >
                              <FaBook className="w-4 h-4" />
                              {t('nav.currentCourses')}
                            </button>
                          </>
                        )}

                        <button
                          onClick={handleLogout}
                          className={`w-full px-4 py-2 ${isRTL ? 'text-right' : 'text-left'} text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-navy-700 flex items-center ${isRTL ? 'flex-row-reverse' : ''} gap-2 transition-colors`}
                        >
                          <FaSignOutAlt />
                          {t('nav.logout')}
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate('/login')}
                    className="flex items-center gap-2 px-4 py-2 border border-primary-600 text-primary-600 dark:border-teal-400 dark:text-teal-400 rounded-lg hover:bg-primary-50 dark:hover:bg-navy-700 transition-colors"
                  >
                    <FaSignInAlt />
                    <span>{t('nav.login')}</span>
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate('/home', { state: { showSignUp: true } })}
                    className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-lg transition-colors"
                  >
                    <FaUser />
                    <span>{t('nav.signUp')}</span>
                  </motion.button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary-600 to-teal-500 text-white py-16 relative overflow-hidden">
        {/* Animated Decorative Elements */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Animated School Symbols */}
          <motion.div
            animate={{
              x: [0, 100, 0],
              y: [0, 50, 0],
              rotate: [0, 15, -15, 0],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute top-20 left-10 opacity-20"
          >
            <FaUniversity className="w-16 h-16 text-red-300" />
          </motion.div>
          
          <motion.div
            animate={{
              x: [0, -80, 0],
              y: [0, 30, 0],
              rotate: [0, -10, 10, 0],
            }}
            transition={{
              duration: 25,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute top-32 right-20 opacity-15"
          >
            <FaUniversity className="w-12 h-12 text-orange-300" />
          </motion.div>
          
          <motion.div
            animate={{
              x: [0, 60, 0],
              y: [0, -40, 0],
              rotate: [0, 20, -20, 0],
            }}
            transition={{
              duration: 18,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute bottom-20 left-1/4 opacity-20"
          >
            <FaUniversity className="w-10 h-10 text-red-300" />
          </motion.div>
          
          <motion.div
            animate={{
              x: [0, -70, 0],
              y: [0, 60, 0],
              rotate: [0, -15, 15, 0],
            }}
            transition={{
              duration: 22,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute bottom-32 right-1/3 opacity-15"
          >
            <FaUniversity className="w-14 h-14 text-orange-300" />
          </motion.div>

          {/* Animated Pens */}
          <motion.div
            animate={{
              rotate: [0, 360],
              y: [0, -20, 0],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute top-1/4 left-1/4 opacity-25"
          >
            <FaPen className="w-8 h-8 text-orange-300" />
          </motion.div>
          
          <motion.div
            animate={{
              rotate: [0, -360],
              y: [0, 15, 0],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute top-1/3 right-1/4 opacity-20"
          >
            <FaPen className="w-6 h-6 text-red-300" />
          </motion.div>
          
          <motion.div
            animate={{
              rotate: [0, 360],
              y: [0, -25, 0],
            }}
            transition={{
              duration: 12,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute bottom-1/4 left-1/3 opacity-25"
          >
            <FaPen className="w-7 h-7 text-orange-300" />
          </motion.div>

          {/* Animated Books */}
          <motion.div
            animate={{
              rotate: [0, 15, -15, 0],
              x: [0, 10, -10, 0],
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute top-1/4 right-1/3 opacity-20"
          >
            <FaBook className="w-10 h-10 text-red-300" />
          </motion.div>
          
          <motion.div
            animate={{
              rotate: [0, -20, 20, 0],
              x: [0, -15, 15, 0],
            }}
            transition={{
              duration: 7,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute bottom-1/3 right-1/5 opacity-25"
          >
            <FaBook className="w-9 h-9 text-orange-300" />
          </motion.div>
          
          <motion.div
            animate={{
              rotate: [0, 10, -10, 0],
              y: [0, -10, 10, 0],
            }}
            transition={{
              duration: 9,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute top-1/2 left-1/5 opacity-20"
          >
            <FaBook className="w-8 h-8 text-red-300" />
          </motion.div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-bold mb-4"
          >
            {instituteData.isAuthenticated 
              ? `${t('feed.welcomeBack')}, ${instituteData.firstName || instituteData.name || instituteData.username || 'User'}!`
              : t('feed.discoverExcellence')
            }
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-white/90 max-w-2xl mx-auto"
          >
            {instituteData.isAuthenticated
              ? isInstitution
                ? t('feed.manageInstitution')
                : t('feed.exploreInstitutions')
              : t('feed.exploreInstitutions')
            }
          </motion.p>
        </div>
      </div>

      {/* Social Media Style Feed */}
      <div className="w-full flex justify-center py-8">
        <div className="w-full max-w-[895px] px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="space-y-4"
          >
          {feedItems.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white dark:bg-navy-800 rounded-lg shadow-md border border-gray-200 dark:border-navy-700 overflow-hidden"
            >
              {/* Institution Card */}
              {item.type === 'institution' && (
                <>
                  {/* Image */}
                  <div className="relative h-64 overflow-hidden">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-4 left-4 flex items-center gap-2 text-white text-base">
                      <FaMapMarkerAlt className="text-sm" />
                      <span>{item.location}</span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4 sm:p-6">
                    <div className="flex items-start justify-between mb-3 gap-4">
                      <h3 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white flex-1">
                        {item.title}
                      </h3>
                      <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-500 whitespace-nowrap flex-shrink-0">{item.timestamp}</span>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base mb-4 leading-relaxed">
                      {item.description}
                    </p>

                    {/* Stats */}
                    <div className="flex items-center gap-6 mb-4 text-base text-gray-600 dark:text-gray-400">
                      <div className="flex items-center gap-2">
                        <FaUsers className="text-primary-600 dark:text-teal-400 text-lg" />
                        <span>{item.students} {t('feed.students')}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <FaChalkboardTeacher className="text-primary-600 dark:text-teal-400 text-lg" />
                        <span>{item.lecturers} {t('feed.lecturers')}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-navy-700">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="flex-1 px-4 py-2 border-2 border-primary-600 dark:border-teal-400 text-primary-600 dark:text-teal-400 rounded-lg hover:bg-primary-50 dark:hover:bg-navy-700 transition-colors font-semibold"
                      >
                        {t('feed.learnMore')}
                      </motion.button>
                      
                      {!isInstitution && (
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleSubscribe(item.title)}
                          className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-lg transition-colors font-semibold"
                        >
                          {t('feed.subscribe')}
                        </motion.button>
                      )}
                    </div>

                  </div>
                </>
              )}

              {/* Lecturer Job Post */}
              {item.type === 'job_post' && (
                <div className="p-4 sm:p-6">
                  <div className="flex items-start gap-4 mb-4">
                    <img
                      src={item.lecturerImage}
                      alt={item.lecturerName}
                      className="w-16 h-16 rounded-full object-cover border-2 border-primary-200 dark:border-primary-800"
                    />
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="text-xl font-bold text-gray-800 dark:text-white">
                            {item.lecturerName}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {item.specialty} • {item.experience} {t('feed.experience')}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                            <FaMapMarkerAlt className="inline mr-1" />
                            {item.location}
                          </p>
                        </div>
                        <span className="text-sm text-gray-500 dark:text-gray-500">{item.timestamp}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-l-4 border-blue-500">
                    <div className="flex items-center gap-2 mb-2">
                      <FaBriefcase className="text-blue-600 dark:text-blue-400" />
                      <span className="font-semibold text-blue-800 dark:text-blue-300">{t('feed.lookingForJob')}</span>
                    </div>
                    <p className="text-gray-700 dark:text-gray-300">{item.message}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                      {t('feed.contact')}: <span className="font-medium">{item.contact}</span>
                    </p>
                  </div>

                  {/* Contact Button for Institutions */}
                  {isInstitution && (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => window.location.href = `mailto:${item.contact}`}
                      className="w-full px-4 py-3 bg-primary-600 hover:bg-primary-500 text-white rounded-lg transition-colors font-semibold"
                    >
                      {t('feed.contactLecturer')}
                    </motion.button>
                  )}
                </div>
              )}

              {/* Institution Achievement */}
              {item.type === 'achievement' && (
                <div className="p-4 sm:p-6">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-yellow-400">
                      <img
                        src={item.institutionImage}
                        alt={item.institutionName}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="text-xl font-bold text-gray-800 dark:text-white">
                            {item.institutionName}
                          </h3>
                          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                            <FaMapMarkerAlt className="inline mr-1" />
                            {item.location}
                          </p>
                        </div>
                        <span className="text-sm text-gray-500 dark:text-gray-500">{item.timestamp}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mb-4 p-4 bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 rounded-lg border-l-4 border-yellow-500">
                    <div className="flex items-center gap-2 mb-2">
                      <FaTrophy className="text-yellow-600 dark:text-yellow-400 text-xl" />
                      <span className="font-bold text-yellow-800 dark:text-yellow-300 text-lg">{item.achievement}</span>
                    </div>
                    <p className="text-gray-700 dark:text-gray-300">{item.description}</p>
                  </div>
                </div>
              )}
            </motion.div>
          ))}
          </motion.div>
        </div>
      </div>

        {/* Footer */}
        <footer className="bg-white dark:bg-navy-800 border-t border-gray-200 dark:border-navy-700 mt-12 transition-colors">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center text-gray-600 dark:text-gray-400">
              <p className="text-sm">
                {t('feed.copyright')}
              </p>
              <p className="text-sm mt-2 text-gray-500 dark:text-gray-500">
                {t('feed.developedBy')} <span className="font-semibold text-primary-600 dark:text-teal-400">Mohammed Salah</span> {t('feed.and')} <span className="font-semibold text-primary-600 dark:text-teal-400">Mustafa Mohammed</span>
              </p>
            </div>
          </div>
        </footer>
      </div>

      {/* Profile Modal */}
      {selectedProfile && (
        <Modal
          isOpen={!!selectedProfile}
          onClose={handleCloseProfile}
          title={selectedProfile.name}
        >
          <div className="space-y-6">
            {/* Profile Header */}
            <div className="flex items-start gap-6">
              <div className="relative">
                <img
                  src={selectedProfile.image}
                  alt={selectedProfile.name}
                  className="w-32 h-32 rounded-full object-cover border-4 border-primary-200 dark:border-primary-800"
                />
                {/* Verification Badge */}
                {selectedProfile.isVerified && (
                  <div className="absolute bottom-0 right-0 w-10 h-10 bg-green-500 rounded-full flex items-center justify-center border-4 border-white dark:border-navy-800">
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                    {selectedProfile.name}
                  </h2>
                  {/* Verification Badge (Text) */}
                  {selectedProfile.isVerified ? (
                    <span className="px-3 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-full text-xs font-semibold flex items-center gap-1">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      {t('feed.verified')}
                    </span>
                  ) : (
                    <span className="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-full text-xs font-semibold">
                      {t('feed.notVerified')}
                    </span>
                  )}
                </div>
                <p className="text-lg text-primary-600 dark:text-teal-400 mb-1">
                  {profileType === 'student' ? selectedProfile.major : selectedProfile.specialty}
                </p>
                <p className="text-gray-600 dark:text-gray-400">
                  {profileType === 'student' ? `${selectedProfile.year} • ${selectedProfile.university}` : `${selectedProfile.experience} Experience • ${selectedProfile.university}`}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                  {selectedProfile.bio}
                </p>
              </div>
            </div>

            {/* Contact Information */}
            <div className="bg-gray-50 dark:bg-navy-900 rounded-lg p-4">
              <h3 className="font-semibold text-gray-800 dark:text-white mb-3">{t('feed.contactInformation')}</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-gray-600 dark:text-gray-400">📧 {t('feed.email')}:</span>
                  <span className="text-gray-800 dark:text-white">{selectedProfile.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-600 dark:text-gray-400">📱 {t('feed.phone')}:</span>
                  <span className="text-gray-800 dark:text-white">{selectedProfile.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-600 dark:text-gray-400">📍 {t('feed.location')}:</span>
                  <span className="text-gray-800 dark:text-white">{selectedProfile.location}</span>
                </div>
              </div>
            </div>

            {/* About */}
            <div>
              <h3 className="font-semibold text-gray-800 dark:text-white mb-2">{t('feed.about')}</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                {selectedProfile.about}
              </p>
            </div>

            {/* Student-specific content */}
            {profileType === 'student' && (
              <>
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-800 dark:text-white mb-2">{t('feed.academicPerformance')}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-semibold">{t('feed.gpa')}:</span> {selectedProfile.gpa}
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-800 dark:text-white mb-2">{t('feed.skills')}</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedProfile.skills.map((skill, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 rounded-full text-sm"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-800 dark:text-white mb-2">{t('feed.interests')}</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedProfile.interests.map((interest, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-teal-100 dark:bg-teal-900 text-teal-700 dark:text-teal-300 rounded-full text-sm"
                      >
                        {interest}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-800 dark:text-white mb-2">{t('feed.achievements')}</h3>
                  <ul className="space-y-2">
                    {selectedProfile.achievements.map((achievement, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <span className="text-primary-600 dark:text-teal-400">✓</span>
                        {achievement}
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            )}

            {/* Lecturer-specific content */}
            {profileType === 'lecturer' && (
              <>
                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-800 dark:text-white mb-2">{t('feed.education')}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {selectedProfile.education}
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-800 dark:text-white mb-2">{t('feed.coursesTaught')}</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedProfile.courses.map((course, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 rounded-full text-sm"
                      >
                        {course}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-800 dark:text-white mb-2">{t('feed.researchInterests')}</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedProfile.research.map((topic, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-teal-100 dark:bg-teal-900 text-teal-700 dark:text-teal-300 rounded-full text-sm"
                      >
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-800 dark:text-white mb-2">{t('feed.publications')}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {selectedProfile.publications}
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-800 dark:text-white mb-2">{t('feed.achievementsAwards')}</h3>
                  <ul className="space-y-2">
                    {selectedProfile.achievements.map((achievement, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <span className="text-primary-600 dark:text-teal-400">🏆</span>
                        {achievement}
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Feed;

