import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  FaUniversity,
  FaArrowLeft,
  FaSearch,
  FaBook,
  FaClock,
  FaUsers,
  FaDollarSign,
  FaChalkboardTeacher,
  FaFilter,
  FaStar,
  FaGraduationCap,
  FaUserGraduate,
  FaCompass,
  FaInfoCircle,
  FaTimes
} from 'react-icons/fa';
import { useTheme } from '../context/ThemeContext';
import Modal from '../components/Modal';

const Courses = () => {
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [selectedInstitution, setSelectedInstitution] = useState('all');
  const [sidebarView, setSidebarView] = useState('students'); // 'students', 'lecturers', 'courses'
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [profileType, setProfileType] = useState(null); // 'student' or 'lecturer'
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Demo courses data
  const courses = [
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
      rating: 4.8,
      reviews: 120,
      description: 'Learn the fundamentals of programming with Python. Perfect for beginners who want to start their coding journey.',
      image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&q=80',
      category: 'Computer Science',
      language: 'Arabic & English',
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
      rating: 4.9,
      reviews: 95,
      description: 'Master the art of strategic business planning and management. Learn from real-world case studies and industry experts.',
      image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&q=80',
      category: 'Business',
      language: 'Arabic',
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
      rating: 4.7,
      reviews: 150,
      description: 'Comprehensive study of human body systems and their functions. Essential for medical students and healthcare professionals.',
      image: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&q=80',
      category: 'Medicine',
      language: 'Arabic & English',
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
      rating: 4.6,
      reviews: 78,
      description: 'Deep dive into advanced calculus concepts including multivariable calculus, differential equations, and mathematical analysis.',
      image: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400&q=80',
      category: 'Mathematics',
      language: 'English',
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
      rating: 4.8,
      reviews: 110,
      description: 'Learn the core principles of mechanical engineering including statics, dynamics, and materials science.',
      image: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=400&q=80',
      category: 'Engineering',
      language: 'Arabic & English',
    },
    {
      id: 6,
      title: 'Web Development Bootcamp',
      code: 'CS202',
      institution: 'Baghdad International Academy',
      instructor: 'Dr. Sarah Khan',
      duration: '16 weeks',
      students: 68,
      price: 550,
      level: 'Intermediate',
      rating: 4.9,
      reviews: 200,
      description: 'Complete web development course covering HTML, CSS, JavaScript, React, and Node.js. Build real-world projects.',
      image: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=400&q=80',
      category: 'Computer Science',
      language: 'Arabic & English',
    },
    {
      id: 7,
      title: 'Digital Marketing Essentials',
      code: 'BUS301',
      institution: 'Tigris Business School',
      instructor: 'Prof. Ali Mahmoud',
      duration: '8 weeks',
      students: 55,
      price: 380,
      level: 'Beginner',
      rating: 4.7,
      reviews: 145,
      description: 'Learn digital marketing strategies including SEO, social media marketing, content creation, and analytics.',
      image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&q=80',
      category: 'Business',
      language: 'Arabic',
    },
    {
      id: 8,
      title: 'Data Science & Analytics',
      code: 'CS301',
      institution: 'Iraqi Science Academy',
      instructor: 'Prof. Karim Saleh',
      duration: '18 weeks',
      students: 35,
      price: 650,
      level: 'Advanced',
      rating: 4.8,
      reviews: 88,
      description: 'Master data science techniques including machine learning, statistical analysis, and data visualization using Python and R.',
      image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&q=80',
      category: 'Computer Science',
      language: 'English',
    },
  ];

  // Demo students data (same as Feed.jsx)
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
      isVerified: true,
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
      isVerified: true,
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
      isVerified: false,
      skills: ['CAD Design', 'Project Management', 'AutoCAD', 'SolidWorks'],
      interests: ['Mechanical Design', 'Robotics', 'Sustainable Engineering'],
      achievements: ['Engineering Excellence Award', 'Senior Project Lead', 'Published Research Paper'],
      about: 'Senior engineering student specializing in mechanical design and robotics. Passionate about creating sustainable solutions for real-world problems. Currently leading a team project on renewable energy systems.',
    },
  ]);

  // Demo lecturers data (same as Feed.jsx)
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
      isVerified: true,
      education: 'PhD in Artificial Intelligence - MIT',
      courses: ['Introduction to Programming', 'Machine Learning', 'Data Structures', 'AI Fundamentals'],
      research: ['Neural Networks', 'Deep Learning', 'Computer Vision'],
      publications: '25+ research papers in top-tier journals',
      achievements: ['Best Teacher Award 2023', 'Research Excellence Award', 'IEEE Senior Member'],
      about: 'Dr. Sarah Khan is a distinguished professor specializing in Artificial Intelligence and Machine Learning. With over 10 years of teaching experience and extensive research background, she has mentored hundreds of students and published numerous papers in leading journals.',
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
      isVerified: true,
      education: 'MBA - Harvard Business School',
      courses: ['Business Strategy', 'Leadership', 'Entrepreneurship', 'Marketing Management'],
      research: ['Strategic Management', 'Digital Transformation', 'Innovation'],
      publications: 'Author of 3 business books',
      achievements: ['Former Fortune 500 CEO', 'Business Consultant for 50+ companies', 'TED Speaker'],
      about: 'Professor Ali Mahmoud brings 15 years of real-world business experience to the classroom. As a former CEO and successful entrepreneur, he combines academic theory with practical insights.',
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
      isVerified: false,
      education: 'MD, Fellowship in Internal Medicine',
      courses: ['Human Anatomy', 'Physiology', 'Internal Medicine', 'Clinical Practice'],
      research: ['Cardiovascular Health', 'Preventive Medicine', 'Patient Care'],
      publications: '15+ medical journal publications',
      achievements: ['Medical Excellence Award', 'Best Clinical Instructor', 'Healthcare Innovation Award'],
      about: 'Dr. Layla Hassan is a practicing physician and dedicated educator with 12 years of experience in internal medicine. She combines her clinical expertise with teaching to provide students with comprehensive medical education.',
    },
  ]);

  // Demo sidebar courses data
  const [sidebarCourses] = useState([
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
  ]);

  const handleViewProfile = (profile, type) => {
    setSelectedProfile(profile);
    setProfileType(type);
  };

  const handleCloseProfile = () => {
    setSelectedProfile(null);
    setProfileType(null);
  };

  const institutions = [...new Set(courses.map(c => c.institution))];
  const levels = ['all', 'Beginner', 'Intermediate', 'Advanced'];

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          course.instructor.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          course.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLevel = selectedLevel === 'all' || course.level === selectedLevel;
    const matchesInstitution = selectedInstitution === 'all' || course.institution === selectedInstitution;
    return matchesSearch && matchesLevel && matchesInstitution;
  });

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
            Explore
          </h2>
          
          {/* Sidebar Navigation Buttons */}
          <div className="space-y-2 mb-6">
            <button
              onClick={() => navigate('/')}
              className={`w-full flex items-center ${isSidebarExpanded ? 'gap-3' : 'justify-center'} px-4 py-3 rounded-lg transition-all text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-navy-700`}
              title="Back to Feed"
            >
              <FaArrowLeft className="w-5 h-5 flex-shrink-0" />
              {isSidebarExpanded && <span className="font-medium">Back to Feed</span>}
            </button>
            
            <button
              onClick={() => setSidebarView('students')}
              className={`w-full flex items-center ${isSidebarExpanded ? 'gap-3' : 'justify-center'} px-4 py-3 rounded-lg transition-all ${
                sidebarView === 'students'
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-navy-700'
              }`}
              title="Students"
            >
              <FaUserGraduate className="w-5 h-5 flex-shrink-0" />
              {isSidebarExpanded && <span className="font-medium">Students</span>}
            </button>
            
            <button
              onClick={() => setSidebarView('lecturers')}
              className={`w-full flex items-center ${isSidebarExpanded ? 'gap-3' : 'justify-center'} px-4 py-3 rounded-lg transition-all ${
                sidebarView === 'lecturers'
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-navy-700'
              }`}
              title="Lecturers"
            >
              <FaChalkboardTeacher className="w-5 h-5 flex-shrink-0" />
              {isSidebarExpanded && <span className="font-medium">Lecturers</span>}
            </button>
            
            <button
              onClick={() => setSidebarView('courses')}
              className={`w-full flex items-center ${isSidebarExpanded ? 'gap-3' : 'justify-center'} px-4 py-3 rounded-lg transition-all ${
                sidebarView === 'courses'
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-navy-700'
              }`}
              title="Explore Courses"
            >
              <FaCompass className="w-5 h-5 flex-shrink-0" />
              {isSidebarExpanded && <span className="font-medium">Explore Courses</span>}
            </button>
            
            <button
              onClick={() => navigate('/about')}
              className={`w-full flex items-center ${isSidebarExpanded ? 'gap-3' : 'justify-center'} px-4 py-3 rounded-lg transition-all text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-navy-700`}
              title="About Us"
            >
              <FaInfoCircle className="w-5 h-5 flex-shrink-0" />
              {isSidebarExpanded && <span className="font-medium">About Us</span>}
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
                    </div>
                  </div>
                </motion.div>
              ))}

              {sidebarView === 'courses' && sidebarCourses.map((course) => (
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
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                    Explore
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
                
                <div className="space-y-2 mb-6">
                  <button
                    onClick={() => {
                      navigate('/');
                      setIsMobileSidebarOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-navy-700"
                  >
                    <FaArrowLeft className="w-5 h-5 flex-shrink-0" />
                    <span className="font-medium">Back to Feed</span>
                  </button>
                  
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
                    <span className="font-medium">Students</span>
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
                    <span className="font-medium">Lecturers</span>
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
                    <span className="font-medium">Explore Courses</span>
                  </button>
                  
                  <button
                    onClick={() => {
                      navigate('/about');
                      setIsMobileSidebarOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-navy-700"
                  >
                    <FaInfoCircle className="w-5 h-5 flex-shrink-0" />
                    <span className="font-medium">About Us</span>
                  </button>
                </div>

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

                  {sidebarView === 'courses' && sidebarCourses.map((course) => (
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
            <div className="flex justify-between items-center h-16">
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
            </div>
          </div>
        </nav>

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary-600 to-teal-500 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-bold mb-4"
          >
            Explore Courses
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-white/90 max-w-2xl mx-auto"
          >
            Discover a wide range of courses from leading institutions
          </motion.p>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white dark:bg-navy-800 rounded-xl shadow-lg p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search courses, instructors, or categories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-300 dark:border-navy-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-navy-700 text-gray-900 dark:text-white"
              />
            </div>

            {/* Level Filter */}
            <div className="relative">
              <FaFilter className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <select
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value)}
                className="pl-12 pr-10 py-3 border border-gray-300 dark:border-navy-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-navy-700 text-gray-900 dark:text-white appearance-none cursor-pointer"
              >
                {levels.map(level => (
                  <option key={level} value={level}>
                    {level === 'all' ? 'All Levels' : level}
                  </option>
                ))}
              </select>
            </div>

            {/* Institution Filter */}
            <div className="relative">
              <FaUniversity className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <select
                value={selectedInstitution}
                onChange={(e) => setSelectedInstitution(e.target.value)}
                className="pl-12 pr-10 py-3 border border-gray-300 dark:border-navy-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-navy-700 text-gray-900 dark:text-white appearance-none cursor-pointer"
              >
                <option value="all">All Institutions</option>
                {institutions.map(inst => (
                  <option key={inst} value={inst}>{inst}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Courses Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course, index) => (
            <motion.div
              key={course.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white dark:bg-navy-800 rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
            >
              {/* Course Image */}
              <div className="relative h-48 overflow-hidden">
                <img
                  src={course.image}
                  alt={course.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-4 right-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    course.level === 'Beginner' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' :
                    course.level === 'Intermediate' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' :
                    'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300'
                  }`}>
                    {course.level}
                  </span>
                </div>
                <div className="absolute bottom-4 left-4">
                  <span className="px-3 py-1 bg-black/50 backdrop-blur-sm rounded-lg text-white text-sm font-semibold">
                    {course.category}
                  </span>
                </div>
              </div>

              {/* Course Content */}
              <div className="p-6">
                <div className="mb-3">
                  <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-1 line-clamp-2">
                    {course.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {course.code} • {course.institution}
                  </p>
                </div>

                <div className="flex items-center gap-2 mb-4">
                  <div className="flex items-center gap-1">
                    <FaStar className="w-4 h-4 text-yellow-400" />
                    <span className="text-sm font-semibold text-gray-800 dark:text-white">
                      {course.rating}
                    </span>
                  </div>
                  <span className="text-sm text-gray-500 dark:text-gray-500">
                    ({course.reviews} reviews)
                  </span>
                </div>

                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                  {course.description}
                </p>

                <div className="flex items-center gap-4 mb-4 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-center gap-1">
                    <FaChalkboardTeacher className="w-4 h-4" />
                    <span>{course.instructor}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <FaClock className="w-4 h-4" />
                    <span>{course.duration}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-navy-700">
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                      <FaUsers className="w-4 h-4" />
                      <span>{course.students} students</span>
                    </div>
                    <div className="flex items-center gap-1 text-primary-600 dark:text-teal-400 font-bold">
                      <FaDollarSign className="w-4 h-4" />
                      <span className="text-lg">${course.price}</span>
                    </div>
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full mt-4 px-4 py-3 bg-primary-600 hover:bg-primary-500 text-white rounded-lg font-semibold transition-colors"
                >
                  Enroll Now
                </motion.button>
              </div>
            </motion.div>
          ))}
        </div>

        {filteredCourses.length === 0 && (
          <div className="text-center py-16">
            <FaGraduationCap className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-xl font-semibold text-gray-600 dark:text-gray-400 mb-2">
              No courses found
            </p>
            <p className="text-gray-500 dark:text-gray-500">
              Try adjusting your search or filters
            </p>
          </div>
        )}
      </div>
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
                  {selectedProfile.isVerified ? (
                    <span className="px-3 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-full text-xs font-semibold flex items-center gap-1">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Verified
                    </span>
                  ) : (
                    <span className="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-full text-xs font-semibold">
                      Not Verified
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
              <h3 className="font-semibold text-gray-800 dark:text-white mb-3">Contact Information</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-gray-600 dark:text-gray-400">📧 Email:</span>
                  <span className="text-gray-800 dark:text-white">{selectedProfile.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-600 dark:text-gray-400">📱 Phone:</span>
                  <span className="text-gray-800 dark:text-white">{selectedProfile.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-600 dark:text-gray-400">📍 Location:</span>
                  <span className="text-gray-800 dark:text-white">{selectedProfile.location}</span>
                </div>
              </div>
            </div>

            {/* About */}
            <div>
              <h3 className="font-semibold text-gray-800 dark:text-white mb-2">About</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                {selectedProfile.about}
              </p>
            </div>

            {/* Student-specific content */}
            {profileType === 'student' && (
              <>
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-800 dark:text-white mb-2">Academic Performance</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-semibold">GPA:</span> {selectedProfile.gpa}
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-800 dark:text-white mb-2">Skills</h3>
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
                  <h3 className="font-semibold text-gray-800 dark:text-white mb-2">Interests</h3>
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
                  <h3 className="font-semibold text-gray-800 dark:text-white mb-2">Achievements</h3>
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
                  <h3 className="font-semibold text-gray-800 dark:text-white mb-2">Education</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {selectedProfile.education}
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-800 dark:text-white mb-2">Courses Taught</h3>
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
                  <h3 className="font-semibold text-gray-800 dark:text-white mb-2">Research Interests</h3>
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
                  <h3 className="font-semibold text-gray-800 dark:text-white mb-2">Publications</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {selectedProfile.publications}
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-800 dark:text-white mb-2">Achievements & Awards</h3>
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

export default Courses;


