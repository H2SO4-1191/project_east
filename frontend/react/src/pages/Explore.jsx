import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  FaArrowLeft,
  FaUserGraduate,
  FaChalkboardTeacher,
  FaBriefcase,
  FaMoon,
  FaSun,
  FaCompass,
  FaBook,
  FaTachometerAlt,
  FaMapMarkerAlt,
  FaSearch,
  FaUser,
  FaUniversity,
  FaBell,
  FaSignInAlt,
  FaSignOutAlt,
  FaTimes,
  FaFilter,
  FaStar,
  FaGraduationCap,
  FaClock,
  FaUsers,
  FaDollarSign,
  FaInfoCircle
} from 'react-icons/fa';
import { useInstitute } from '../context/InstituteContext';
import { useTheme } from '../context/ThemeContext';
import { authService } from '../services/authService';
import LanguageSwitcher from '../components/LanguageSwitcher';
import Modal from '../components/Modal';
import ProfileModal from '../components/ProfileModal';
import toast from 'react-hot-toast';

const Explore = () => {
  const navigate = useNavigate();
  const { instituteData } = useInstitute();
  const { isDark, toggleTheme } = useTheme();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'students', 'lecturers', 'positions', 'courses'
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [profileType, setProfileType] = useState(null);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [selectedInstitution, setSelectedInstitution] = useState('all');
  const [isLoadingSearch, setIsLoadingSearch] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);
  const notificationRef = useRef(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showVerificationPopup, setShowVerificationPopup] = useState(false);

  // API data states
  const [students, setStudents] = useState([]);
  const [lecturers, setLecturers] = useState([]);
  const [positions, setPositions] = useState([]);
  const [institutionJobPosts, setInstitutionJobPosts] = useState([]); // Job posts from institutions
  const [institutions, setInstitutions] = useState([]); // Institutions from search
  const [courses, setCourses] = useState([]);
  const [allResults, setAllResults] = useState([]); // Mixed results for "All" tab
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [isLoadingCourse, setIsLoadingCourse] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [isLoadingJob, setIsLoadingJob] = useState(false);
  const [showApplyJobModal, setShowApplyJobModal] = useState(false);
  const [applyJobMessage, setApplyJobMessage] = useState('');
  const [isApplying, setIsApplying] = useState(false);

  // Demo courses data (fallback)
  const [demoCourses] = useState([
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
  ]);

  // Demo students data (fallback)
  const [demoStudents] = useState([
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
      isVerified: true,
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
      isVerified: false,
      skills: ['Python', 'R', 'SQL', 'Data Visualization', 'Machine Learning'],
      interests: ['Big Data', 'Predictive Analytics', 'Business Intelligence'],
      achievements: ['Data Science Competition Winner', 'Research Publication', 'Industry Internship'],
      about: 'Data science student with expertise in statistical analysis and machine learning. Experienced in working with large datasets and creating predictive models. Currently interning at a tech company focusing on business intelligence solutions.',
    },
  ]);

  // Demo lecturers data (fallback)
  const [demoLecturers] = useState([
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
      isVerified: true,
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
      isVerified: false,
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
      isVerified: true,
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
      isVerified: false,
      education: 'PhD in Mechanical Engineering - Stanford University',
      courses: ['Thermodynamics', 'Fluid Mechanics', 'Engineering Design', 'Robotics'],
      research: ['Renewable Energy', 'Robotics', 'Sustainable Engineering'],
      publications: '12+ engineering journals',
      achievements: ['Young Engineer Award', 'Innovation in Teaching', 'Patent Holder'],
      about: 'Dr. Noor Ahmed specializes in mechanical engineering with a focus on sustainable solutions and robotics. With 8 years of teaching and research experience, she brings innovative approaches to engineering education. Her work on renewable energy systems has been recognized internationally.',
    },
  ]);

  // Demo positions/job posts data (fallback)
  const [demoPositions] = useState([
    {
      id: 1,
      lecturerName: 'Dr. Sarah Khan',
      lecturerImage: 'https://i.pravatar.cc/150?img=20',
      specialty: 'Computer Science',
      experience: '10 years',
      message: 'Looking for a teaching position in Computer Science. Specialized in AI and Machine Learning. Available for full-time or part-time positions.',
      location: 'Baghdad, Iraq',
      contact: 'sarah.khan@email.com',
      timestamp: '5 hours ago',
    },
    {
      id: 2,
      lecturerName: 'Prof. Ali Mahmoud',
      lecturerImage: 'https://i.pravatar.cc/150?img=13',
      specialty: 'Business Management',
      experience: '15 years',
      message: 'Experienced business professor seeking opportunities to teach strategic management and entrepreneurship. Open to consulting roles as well.',
      location: 'Erbil, Iraq',
      contact: 'ali.mahmoud@email.com',
      timestamp: '2 days ago',
    },
    {
      id: 3,
      lecturerName: 'Dr. Layla Hassan',
      lecturerImage: 'https://i.pravatar.cc/150?img=38',
      specialty: 'Medical Sciences',
      experience: '12 years',
      message: 'Medical professional with extensive teaching experience looking for a position in medical education. Specialized in Internal Medicine and Clinical Practice.',
      location: 'Najaf, Iraq',
      contact: 'layla.hassan@email.com',
      timestamp: '4 days ago',
    },
  ]);

  const isInstitution = instituteData.userType === 'institution';
  const { updateInstituteData } = useInstitute();

  // Helper function to convert relative image URLs to full URLs
  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }
    const baseUrl = import.meta.env.VITE_API_BASE_URL?.replace(/\/+$/, '') || 'http://127.0.0.1:8000';
    // Ensure imagePath starts with / and doesn't have duplicate /media/
    let cleanPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
    // Remove duplicate /media/ if present
    cleanPath = cleanPath.replace(/^\/media\/media\//, '/media/');
    return `${baseUrl}${cleanPath}`;
  };

  // Fetch job posts from institutions
  const fetchInstitutionJobPosts = async (institutionUsernames = []) => {
    if (institutionUsernames.length === 0) {
      // Try to get institution usernames from feed
      try {
        const accessToken = instituteData.accessToken || null;
        const refreshToken = instituteData.refreshToken || null;
        const feedData = await authService.getFeed(accessToken, {
          refreshToken,
          onTokenRefreshed: (tokens) => {
            updateInstituteData({
              accessToken: tokens.access,
              refreshToken: tokens.refresh || refreshToken,
            });
          },
        });

        if (feedData?.success && feedData?.data) {
          const usernames = new Set();
          feedData.data.forEach((item) => {
            if (item.institution_username) usernames.add(item.institution_username);
            if (item.institution?.username) usernames.add(item.institution.username);
            if (item.username && item.type === 'institution') usernames.add(item.username);
          });
          institutionUsernames = Array.from(usernames);
        }
      } catch (error) {
        console.error('Error fetching feed for institution usernames:', error);
      }
    }

    if (institutionUsernames.length === 0) {
      return [];
    }

    // Fetch job posts from all institutions
    const jobPostPromises = institutionUsernames.map(async (username) => {
      try {
        const jobData = await authService.getInstitutionJobs(username);
        if (jobData?.success && jobData?.data) {
          return jobData.data.map((job) => ({
            ...job,
            institution_username: username,
            itemType: 'institution_job',
          }));
        }
        return [];
      } catch (error) {
        console.error(`Error fetching jobs for ${username}:`, error);
        return [];
      }
    });

    const allJobPosts = await Promise.all(jobPostPromises);
    return allJobPosts.flat();
  };

  // Search API integration
  useEffect(() => {
    const performSearch = async () => {
      if (!searchQuery.trim()) {
        // If no search query, use demo data
        setStudents(demoStudents);
        setLecturers(demoLecturers);
        setPositions(demoPositions);
        setCourses(demoCourses);
        setAllResults([]);
        return;
      }

      setIsLoadingSearch(true);
      setSearchError(null);

      try {
        const accessToken = instituteData.accessToken || null;
        const refreshToken = instituteData.refreshToken || null;

        // Determine filter based on active tab
        let filter = null;
        if (activeTab === 'students') filter = 'students';
        else if (activeTab === 'lecturers') filter = 'lecturers';
        else if (activeTab === 'positions') filter = 'jobs';
        else if (activeTab === 'courses') filter = 'courses';
        // Note: 'institutions' filter can be added if needed

        const searchData = await authService.exploreSearch(searchQuery, filter, accessToken, {
          refreshToken,
          onTokenRefreshed: (tokens) => {
            updateInstituteData({
              accessToken: tokens.access,
              refreshToken: tokens.refresh || refreshToken,
            });
          },
          onSessionExpired: () => {
            // Handle session expired
          },
        });

        if (searchData?.success) {
          // Fetch institution job posts if positions tab is active or all tab
          let institutionJobs = [];
          if (activeTab === 'positions' || activeTab === 'all') {
            try {
              // Extract institution usernames from search results if available
              const institutionUsernames = [];
              if (searchData.results?.institutions) {
                searchData.results.institutions.forEach(inst => {
                  if (inst.username) institutionUsernames.push(inst.username);
                });
              }
              institutionJobs = await fetchInstitutionJobPosts(institutionUsernames);
            } catch (error) {
              console.error('Error fetching institution job posts:', error);
            }
          }

          if (activeTab === 'all') {
            // Mixed results for "All" tab
            const mixed = [];
            if (searchData.results?.students) {
              mixed.push(...searchData.results.students.map(s => ({ ...s, itemType: 'student' })));
            }
            if (searchData.results?.lecturers) {
              mixed.push(...searchData.results.lecturers.map(l => ({ ...l, itemType: 'lecturer' })));
            }
            if (searchData.results?.institutions) {
              mixed.push(...searchData.results.institutions.map(i => ({ ...i, itemType: 'institution' })));
              setInstitutions(searchData.results.institutions);
            }
            if (searchData.results?.jobs) {
              mixed.push(...searchData.results.jobs.map(j => ({ ...j, itemType: 'job' })));
            }
            // Add institution job posts
            if (institutionJobs.length > 0) {
              mixed.push(...institutionJobs);
            }
            if (searchData.results?.courses) {
              mixed.push(...searchData.results.courses.map(c => ({ ...c, itemType: 'course' })));
            }
            setAllResults(mixed);
            setStudents([]);
            setLecturers([]);
            setPositions([]);
            setInstitutionJobPosts(institutionJobs);
            setCourses([]);
          } else {
            // Filtered results
            if (activeTab === 'students') {
              setStudents(searchData.students || searchData.results?.students || []);
              setLecturers([]);
              setPositions([]);
              setInstitutionJobPosts([]);
              setCourses([]);
              setAllResults([]);
            } else if (activeTab === 'lecturers') {
              setLecturers(searchData.lecturers || searchData.results?.lecturers || []);
              setStudents([]);
              setPositions([]);
              setInstitutionJobPosts([]);
              setCourses([]);
              setAllResults([]);
            } else if (activeTab === 'positions') {
              // Jobs from search API
              const jobsFromSearch = searchData.jobs || searchData.results?.jobs || [];
              setPositions(jobsFromSearch);
              setInstitutionJobPosts(institutionJobs);
              setStudents([]);
              setLecturers([]);
              setCourses([]);
              setAllResults([]);
            } else if (activeTab === 'courses') {
              setCourses(searchData.courses || searchData.results?.courses || []);
              setStudents([]);
              setLecturers([]);
              setPositions([]);
              setInstitutionJobPosts([]);
              setAllResults([]);
            }
          }
        } else {
          setStudents([]);
          setLecturers([]);
          setPositions([]);
          setInstitutionJobPosts([]);
          setCourses([]);
          setAllResults([]);
        }
      } catch (error) {
        console.error('Error searching:', error);
        setSearchError(error?.message || 'Failed to search. Please try again.');
        // Fallback to demo data on error
        setStudents(demoStudents);
        setLecturers(demoLecturers);
        setPositions(demoPositions);
        setCourses(demoCourses);
        setAllResults([]);
      } finally {
        setIsLoadingSearch(false);
      }
    };

    // Debounce search
    const timeoutId = setTimeout(() => {
      performSearch();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, activeTab, instituteData.accessToken]);

  // Load initial data (demo data when no search)
  useEffect(() => {
    const loadInitialData = async () => {
      if (!searchQuery.trim()) {
        setStudents(demoStudents);
        setLecturers(demoLecturers);
        setPositions(demoPositions);
        setCourses(demoCourses);
        setAllResults([]);
        
        // Fetch institution job posts if positions tab is active
        if (activeTab === 'positions' || activeTab === 'all') {
          try {
            const institutionJobs = await fetchInstitutionJobPosts();
            setInstitutionJobPosts(institutionJobs);
          } catch (error) {
            console.error('Error fetching initial institution job posts:', error);
            setInstitutionJobPosts([]);
          }
        } else {
          setInstitutionJobPosts([]);
        }
      }
    };
    
    loadInitialData();
  }, [demoStudents, demoLecturers, demoPositions, demoCourses, searchQuery, activeTab]);

  // Fetch Notifications for Students and Lecturers
  useEffect(() => {
    const fetchNotifications = async () => {
      if (!instituteData.isAuthenticated || 
          !instituteData.accessToken || 
          (instituteData.userType !== 'student' && instituteData.userType !== 'lecturer')) {
        setNotifications([]);
        return;
      }

      setIsLoadingNotifications(true);
      
      try {
        const refreshToken = instituteData.refreshToken || null;
        
        const notificationData = await authService.getNotifications(instituteData.accessToken, {
          refreshToken,
          onTokenRefreshed: (tokens) => {
            updateInstituteData({
              accessToken: tokens.access,
              refreshToken: tokens.refresh || refreshToken,
            });
          },
          onSessionExpired: () => {
            // Handle session expired
          },
        });

        if (notificationData?.success && Array.isArray(notificationData.notifications)) {
          const transformedNotifications = notificationData.notifications.map((notif, index) => ({
            id: index + 1,
            title: notif.course_title || 'Lecture Reminder',
            message: notif.message || `You have '${notif.course_title}' tomorrow at ${notif.time}.`,
            time: notif.time || '',
            day: notif.day || '',
            read: false,
            type: notif.type || 'lecture_reminder',
            course_title: notif.course_title,
          }));
          setNotifications(transformedNotifications);
        } else {
          setNotifications([]);
        }
      } catch (error) {
        console.error('Error fetching notifications:', error);
        setNotifications([]);
      } finally {
        setIsLoadingNotifications(false);
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [instituteData.isAuthenticated, instituteData.accessToken, instituteData.userType, instituteData.refreshToken]);

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
    window.location.reload();
  };

  const handleViewProfile = async (profile, type) => {
    setIsLoadingProfile(true);
    try {
      let profileData = null;
      
      // If profile has username, fetch full profile from API
      if (profile.username) {
        try {
          if (type === 'student') {
            const response = await authService.getStudentPublicProfile(profile.username);
            if (response?.success && response?.data) {
              profileData = {
                ...response.data,
                name: `${response.data.first_name || ''} ${response.data.last_name || ''}`.trim() || response.data.username,
                username: response.data.username,
                image: getImageUrl(response.data.profile_image),
                bio: response.data.about,
                major: response.data.studying_level,
                isVerified: false, // Public profiles don't show verification status
              };
            }
          } else if (type === 'lecturer') {
            const response = await authService.getLecturerPublicProfile(profile.username);
            if (response?.success && response?.data) {
              profileData = {
                ...response.data,
                name: `${response.data.first_name || ''} ${response.data.last_name || ''}`.trim() || response.data.username,
                username: response.data.username,
                image: getImageUrl(response.data.profile_image),
                bio: response.data.about || '',
                specialty: response.data.specialty,
                experience: response.data.experience ? `${response.data.experience} years` : '',
                university: response.data.institutions?.[0] || '',
                isVerified: false,
              };
            }
          } else if (type === 'institution') {
            const response = await authService.getInstitutionPublicProfile(profile.username);
            if (response?.success && response?.data) {
              profileData = {
                ...response.data,
                name: response.data.title || `${response.data.first_name || ''} ${response.data.last_name || ''}`.trim() || response.data.username,
                username: response.data.username,
                first_name: response.data.first_name,
                last_name: response.data.last_name,
                image: getImageUrl(response.data.profile_image),
                profile_image: response.data.profile_image, // Keep original path too
                bio: response.data.about || '',
                about: response.data.about, // Keep both
                title: response.data.title,
                location: response.data.location,
                city: response.data.city,
                isVerified: false,
              };
            }
          }
        } catch (error) {
          console.error('Error fetching profile:', error);
          // Fallback to provided profile data if API fails
          profileData = profile;
        }
      } else {
        // Use provided profile data if no username
        profileData = profile;
      }
      
      if (profileData) {
        setSelectedProfile(profileData);
        setProfileType(type);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      toast.error(t('feed.profileLoadError') || 'Failed to load profile');
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const handleCloseProfile = () => {
    setSelectedProfile(null);
    setProfileType(null);
  };

  const handleViewJob = async (job) => {
    if (!job.id) {
      toast.error(t('feed.jobNotFound') || 'Job ID not found');
      return;
    }

    setIsLoadingJob(true);
    setSelectedJob(null);

    try {
      const response = await authService.getJobDetails(job.id);
      
      if (response?.success && response?.data) {
        setSelectedJob({
          ...response.data,
          institution_username: job.institution_username || null,
        });
      } else {
        toast.error(response?.message || t('feed.failedToLoadJob') || 'Failed to load job details');
      }
    } catch (error) {
      console.error('Error fetching job details:', error);
      toast.error(error?.message || t('feed.failedToLoadJob') || 'Failed to load job details');
    } finally {
      setIsLoadingJob(false);
    }
  };

  const handleCloseJob = () => {
    setSelectedJob(null);
  };

  const handleViewCourse = async (course) => {
    if (!course.id) {
      toast.error(t('feed.courseNotFound') || 'Course ID not found');
      return;
    }

    setIsLoadingCourse(true);
    setSelectedCourse(null);

    try {
      const response = await authService.getCourseDetails(course.id);
      
      if (response?.success && response?.data) {
        setSelectedCourse(response.data);
      } else {
        toast.error(response?.message || t('feed.failedToLoadCourse') || 'Failed to load course details');
      }
    } catch (error) {
      console.error('Error fetching course details:', error);
      toast.error(error?.message || t('feed.failedToLoadCourse') || 'Failed to load course details');
    } finally {
      setIsLoadingCourse(false);
    }
  };

  const handleCloseCourse = () => {
    setSelectedCourse(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-navy-900 transition-colors flex">
      {/* Left Sidebar */}
      <aside 
        className={`hidden lg:block bg-white dark:bg-navy-800 shadow-xl border-r border-gray-200 dark:border-navy-700 fixed left-0 top-0 bottom-0 overflow-y-auto z-40 transition-all duration-300 ${
          isSidebarExpanded ? 'w-80' : 'w-20'
        }`}
        onMouseEnter={() => setIsSidebarExpanded(true)}
        onMouseLeave={() => setIsSidebarExpanded(false)}
      >
        <div className="p-6 flex flex-col h-full">
          <div className="flex-1">
          <h2 className={`text-xl font-bold text-gray-800 dark:text-white mb-4 transition-opacity duration-300 ${
            isSidebarExpanded ? 'opacity-100' : 'opacity-0'
          }`}>
            {t('feed.explore')}
          </h2>

          {/* Back Button - Under Explore Label */}
          <motion.button
            type="button"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={(e) => {
              e.stopPropagation();
              navigate('/feed');
            }}
            className={`w-full flex items-center ${isSidebarExpanded ? 'gap-3' : 'justify-center'} px-4 py-3 rounded-lg transition-all text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-navy-700 mb-6 cursor-pointer`}
            whileTap={{ scale: 0.95 }}
          >
            <FaArrowLeft className="w-5 h-5 flex-shrink-0" />
            {isSidebarExpanded && <span className="font-medium">{t('common.back')}</span>}
          </motion.button>
          
          {/* Sidebar Navigation Buttons - Role Based */}
          {instituteData.isAuthenticated && (
            <div className="space-y-2 mb-6">
              {/* My Courses - Student & Lecturer Only */}
              {(instituteData.userType === 'student' || instituteData.userType === 'lecturer') && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    /* UNCOMMENT FOR PRODUCTION - Verification Check
                    if (!instituteData.isVerified) {
                      setShowVerificationPopup(true);
                      return;
                    }
                    */
                    if (instituteData.userType === 'student') {
                      navigate('/student/courses');
                    } else {
                      navigate('/lecturer/courses');
                    }
                  }}
                  className={`w-full flex items-center ${isSidebarExpanded ? 'gap-3' : 'justify-center'} px-4 py-3 rounded-lg transition-all text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-navy-700`}
                  title={t('nav.currentCourses')}
                >
                  <FaBook className="w-5 h-5 flex-shrink-0" />
                  {isSidebarExpanded && <span className="font-medium">{t('nav.currentCourses')}</span>}
                </button>
              )}

              {/* Schedule - Student & Lecturer Only */}
              {(instituteData.userType === 'student' || instituteData.userType === 'lecturer') && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    /* UNCOMMENT FOR PRODUCTION - Verification Check
                    if (!instituteData.isVerified) {
                      setShowVerificationPopup(true);
                      return;
                    }
                    */
                    if (instituteData.userType === 'student') {
                      navigate('/student/schedule');
                    } else {
                      navigate('/lecturer/schedule');
                    }
                  }}
                  className={`w-full flex items-center ${isSidebarExpanded ? 'gap-3' : 'justify-center'} px-4 py-3 rounded-lg transition-all text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-navy-700`}
                  title={t('nav.schedule')}
                >
                  <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"/>
                  </svg>
                  {isSidebarExpanded && <span className="font-medium">{t('nav.schedule')}</span>}
                </button>
              )}

              {/* Dashboard - Institution Only */}
              {isInstitution && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate('/dashboard');
                  }}
                  className={`w-full flex items-center ${isSidebarExpanded ? 'gap-3' : 'justify-center'} px-4 py-3 rounded-lg transition-all text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-navy-700`}
                  title={t('nav.dashboard')}
                >
                  <FaTachometerAlt className="w-5 h-5 flex-shrink-0" />
                  {isSidebarExpanded && <span className="font-medium">{t('nav.dashboard')}</span>}
                </button>
              )}

              {/* Explore - Active */}
              <button
                type="button"
                className={`w-full flex items-center ${isSidebarExpanded ? 'gap-3' : 'justify-center'} px-4 py-3 rounded-lg transition-all bg-primary-600 text-white`}
                title={t('feed.explore')}
              >
                <FaCompass className="w-5 h-5 flex-shrink-0" />
                {isSidebarExpanded && <span className="font-medium">{t('feed.explore')}</span>}
              </button>

              {/* Profile - All Authenticated Users */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowProfileModal(true);
                }}
                className={`w-full flex items-center ${isSidebarExpanded ? 'gap-3' : 'justify-center'} px-4 py-3 rounded-lg transition-all text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-navy-700`}
                title={t('nav.profile') || 'Profile'}
              >
                <FaUser className="w-5 h-5 flex-shrink-0" />
                {isSidebarExpanded && <span className="font-medium">{t('nav.profile') || 'Profile'}</span>}
              </button>
            </div>
          )}

          {/* Guest Navigation */}
          {!instituteData.isAuthenticated && (
            <div className="space-y-2 mb-6">
              <button
                type="button"
                className={`w-full flex items-center ${isSidebarExpanded ? 'gap-3' : 'justify-center'} px-4 py-3 rounded-lg transition-all bg-primary-600 text-white`}
                title={t('feed.explore')}
              >
                <FaCompass className="w-5 h-5 flex-shrink-0" />
                {isSidebarExpanded && <span className="font-medium">{t('feed.explore')}</span>}
              </button>
            </div>
          )}
          </div>

          {/* Language Switcher & Theme Toggle - Bottom of Sidebar */}
          <div className={`mt-auto pt-6 border-t border-gray-200 dark:border-navy-700 space-y-2`}>
            {/* Language Switcher */}
            {isSidebarExpanded ? (
              <LanguageSwitcher variant="sidebar" />
            ) : (
              <div className="flex items-center justify-center">
                <LanguageSwitcher />
              </div>
            )}

            {/* Theme Toggle */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleTheme}
              className={`w-full flex items-center ${isSidebarExpanded ? 'gap-3' : 'justify-center'} px-4 py-3 rounded-lg transition-all text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-navy-700`}
              title={isDark ? t('lightMode') || 'Light Mode' : t('darkMode') || 'Dark Mode'}
            >
              {isDark ? (
                <FaSun className="w-5 h-5 flex-shrink-0 text-yellow-400" />
              ) : (
                <FaMoon className="w-5 h-5 flex-shrink-0" />
              )}
              {isSidebarExpanded && <span className="font-medium">{isDark ? t('lightMode') || 'Light Mode' : t('darkMode') || 'Dark Mode'}</span>}
            </motion.button>
          </div>
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
                <div className="flex-1">
                {/* Back Button */}
                <motion.button
                  onClick={() => {
                    navigate('/feed');
                    setIsMobileSidebarOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-navy-700 mb-6"
                  whileTap={{ scale: 0.95 }}
                >
                  <FaArrowLeft className="w-5 h-5 flex-shrink-0" />
                  <span className="font-medium">{t('common.back')}</span>
                </motion.button>

                {/* Guest Message */}
                {!instituteData.isAuthenticated && (
                  <div className="mb-6 p-4 bg-primary-50 dark:bg-primary-900/20 rounded-lg border border-primary-200 dark:border-primary-800">
                    <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                      {t('feed.loginToSubscribe')}
                    </p>
                    <div className="flex flex-col gap-2">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          navigate('/login');
                          setIsMobileSidebarOpen(false);
                        }}
                        className="w-full px-3 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-lg text-sm font-semibold transition-colors"
                      >
                        {t('nav.login')}
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          navigate('/home');
                          setIsMobileSidebarOpen(false);
                        }}
                        className="w-full px-3 py-2 border border-primary-600 dark:border-teal-400 text-primary-600 dark:text-teal-400 rounded-lg text-sm font-semibold hover:bg-primary-50 dark:hover:bg-navy-700 transition-colors"
                      >
                        {t('nav.signUp')}
                      </motion.button>
                    </div>
                  </div>
                )}
                
                {/* Mobile Sidebar Navigation Buttons - Role Based */}
                {instituteData.isAuthenticated && (
                  <div className="space-y-2 mb-6">
                    {(instituteData.userType === 'student' || instituteData.userType === 'lecturer') && (
                      <button
                        onClick={() => {
                          /* UNCOMMENT FOR PRODUCTION - Verification Check
                          if (!instituteData.isVerified) {
                            setShowVerificationPopup(true);
                            setIsMobileSidebarOpen(false);
                            return;
                          }
                          */
                          if (instituteData.userType === 'student') {
                            navigate('/student/courses');
                          } else {
                            navigate('/lecturer/courses');
                          }
                          setIsMobileSidebarOpen(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-navy-700"
                      >
                        <FaBook className="w-5 h-5 flex-shrink-0" />
                        <span className="font-medium">{t('nav.currentCourses')}</span>
                      </button>
                    )}

                    {(instituteData.userType === 'student' || instituteData.userType === 'lecturer') && (
                      <button
                        onClick={() => {
                          /* UNCOMMENT FOR PRODUCTION - Verification Check
                          if (!instituteData.isVerified) {
                            setShowVerificationPopup(true);
                            setIsMobileSidebarOpen(false);
                            return;
                          }
                          */
                          if (instituteData.userType === 'student') {
                            navigate('/student/schedule');
                          } else {
                            navigate('/lecturer/schedule');
                          }
                          setIsMobileSidebarOpen(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-navy-700"
                      >
                        <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"/>
                        </svg>
                        <span className="font-medium">{t('nav.schedule')}</span>
                      </button>
                    )}

                    {isInstitution && (
                      <button
                        onClick={() => {
                          navigate('/dashboard');
                          setIsMobileSidebarOpen(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-navy-700"
                      >
                        <FaTachometerAlt className="w-5 h-5 flex-shrink-0" />
                        <span className="font-medium">{t('nav.dashboard')}</span>
                      </button>
                    )}

                    <button
                      onClick={() => {
                        navigate('/explore');
                        setIsMobileSidebarOpen(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all bg-primary-600 text-white"
                    >
                      <FaCompass className="w-5 h-5 flex-shrink-0" />
                      <span className="font-medium">{t('feed.explore')}</span>
                    </button>

                    {/* Profile */}
                    <button
                      onClick={() => {
                        setShowProfileModal(true);
                        setIsMobileSidebarOpen(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-navy-700"
                    >
                      <FaUser className="w-5 h-5 flex-shrink-0" />
                      <span className="font-medium">{t('nav.profile') || 'Profile'}</span>
                    </button>
                  </div>
                )}

                {/* Guest Navigation */}
                {!instituteData.isAuthenticated && (
                  <div className="space-y-2 mb-6">
                    <button
                      onClick={() => {
                        navigate('/explore');
                        setIsMobileSidebarOpen(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all bg-primary-600 text-white"
                    >
                      <FaCompass className="w-5 h-5 flex-shrink-0" />
                      <span className="font-medium">{t('feed.explore')}</span>
                    </button>
                  </div>
                )}

                {/* Language Switcher & Theme Toggle - Bottom of Mobile Sidebar */}
                <div className="mt-auto pt-6 border-t border-gray-200 dark:border-navy-700 space-y-2">
                  {/* Language Switcher */}
                  <LanguageSwitcher variant="sidebar" />

                  {/* Theme Toggle */}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={toggleTheme}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-navy-700"
                  >
                    {isDark ? (
                      <FaSun className="w-5 h-5 flex-shrink-0 text-yellow-400" />
                    ) : (
                      <FaMoon className="w-5 h-5 flex-shrink-0" />
                    )}
                    <span className="font-medium">{isDark ? t('lightMode') || 'Light Mode' : t('darkMode') || 'Dark Mode'}</span>
                  </motion.button>
                </div>
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
                  if (window.innerWidth < 1024) {
                    setIsMobileSidebarOpen(true);
                  } else {
                    navigate('/feed');
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
                    placeholder={t('feed.searchPlaceholder')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`bg-transparent outline-none text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 w-48 lg:w-64 ${isRTL ? 'text-right' : 'text-left'}`}
                  />
                  {searchQuery && (
                    <motion.button
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      onClick={() => setSearchQuery('')}
                      className={`p-1 rounded hover:bg-gray-200 dark:hover:bg-navy-600 transition-colors ${isRTL ? 'order-3' : ''}`}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </motion.button>
                  )}
                </div>

                {/* Mobile Search Button */}
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-navy-700 transition-colors"
                  onClick={() => {
                    const searchInput = document.getElementById('mobile-search-input');
                    if (searchInput) {
                      searchInput.focus();
                    }
                  }}
                >
                  <FaSearch className="text-gray-600 dark:text-gray-400 text-xl" />
                </motion.button>


                {/* Notification Button - Student & Lecturer Only */}
                {instituteData.isAuthenticated && (instituteData.userType === 'student' || instituteData.userType === 'lecturer') && (
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
                                        {notification.day && notification.time 
                                          ? `${notification.day.charAt(0).toUpperCase() + notification.day.slice(1)} at ${notification.time}`
                                          : notification.time || 'Tomorrow'
                                        }
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
                      <div className="relative">
                        <div className="w-8 h-8 bg-gradient-to-br from-primary-600 to-teal-500 rounded-full flex items-center justify-center">
                          <span className="text-white font-bold text-sm">
                            {instituteData.name?.[0]?.toUpperCase() || 'U'}
                          </span>
                        </div>
                        {/* Verification Badge on Avatar */}
                        {instituteData.isVerified && (
                          <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center border-2 border-white dark:border-navy-800">
                            <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
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
                          className={`absolute ${isRTL ? 'left-0' : 'right-0'} mt-2 w-56 bg-white dark:bg-navy-800 rounded-lg shadow-xl border border-gray-200 dark:border-navy-700 overflow-hidden`}
                        >
                          <div className={`p-3 border-b border-gray-200 dark:border-navy-700 ${isRTL ? 'text-right' : 'text-left'}`}>
                            <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''} gap-2 mb-1`}>
                              <p className="text-sm font-semibold text-gray-800 dark:text-white">
                                {instituteData.name || instituteData.username}
                              </p>
                              {/* Verification Badge */}
                              {instituteData.isVerified ? (
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded text-xs font-medium">
                                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                  </svg>
                                  {t('profile.verified') || 'Verified'}
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded text-xs font-medium">
                                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                  </svg>
                                  {t('profile.pendingVerification') || 'Pending'}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {instituteData.email}
                            </p>
                            <p className="text-xs text-gray-400 dark:text-gray-500 capitalize mt-1">
                              {instituteData.userType}
                            </p>
                          </div>

                          {/* View Profile Button */}
                          <button
                            onClick={() => {
                              setShowProfileModal(true);
                              setShowUserMenu(false);
                            }}
                            className={`w-full px-4 py-2 ${isRTL ? 'text-right' : 'text-left'} text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-navy-700 flex items-center ${isRTL ? 'flex-row-reverse' : ''} gap-2 transition-colors`}
                          >
                            <FaUser className="w-4 h-4" />
                            {t('nav.profile') || 'View Profile'}
                          </button>

                          <button
                            onClick={handleLogout}
                            className={`w-full px-4 py-2 ${isRTL ? 'text-right' : 'text-left'} text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-navy-700 flex items-center ${isRTL ? 'flex-row-reverse' : ''} gap-2 transition-colors border-t border-gray-200 dark:border-navy-700`}
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

        {/* Main Content Area */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Mobile Search Bar */}
          <div className="md:hidden mb-6">
            <div className={`flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-navy-700 rounded-lg border border-gray-300 dark:border-navy-600 transition-colors ${isRTL ? 'flex-row-reverse' : ''}`}>
              <FaSearch className={`text-gray-400 dark:text-gray-500 ${isRTL ? 'order-2' : ''}`} />
              <input
                id="mobile-search-input"
                type="text"
                placeholder={t('feed.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`flex-1 bg-transparent outline-none text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 ${isRTL ? 'text-right' : 'text-left'}`}
              />
              {searchQuery && (
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  onClick={() => setSearchQuery('')}
                  className={`p-1 rounded hover:bg-gray-200 dark:hover:bg-navy-600 transition-colors ${isRTL ? 'order-3' : ''}`}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </motion.button>
              )}
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="mb-8">
            <div className="flex flex-wrap gap-2 border-b border-gray-200 dark:border-navy-700">
              {/* All Tab - Default */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveTab('all')}
                className={`px-6 py-3 font-semibold text-sm transition-all relative ${
                  activeTab === 'all'
                    ? 'text-primary-600 dark:text-teal-400'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <FaCompass className="w-5 h-5" />
                  <span>{t('feed.all') || 'All'}</span>
                </div>
                {activeTab === 'all' && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600 dark:bg-teal-400"
                  />
                )}
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveTab('students')}
                className={`px-6 py-3 font-semibold text-sm transition-all relative ${
                  activeTab === 'students'
                    ? 'text-primary-600 dark:text-teal-400'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <FaUserGraduate className="w-5 h-5" />
                  <span>{t('feed.students')}</span>
                </div>
                {activeTab === 'students' && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600 dark:bg-teal-400"
                  />
                )}
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveTab('lecturers')}
                className={`px-6 py-3 font-semibold text-sm transition-all relative ${
                  activeTab === 'lecturers'
                    ? 'text-primary-600 dark:text-teal-400'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <FaChalkboardTeacher className="w-5 h-5" />
                  <span>{t('feed.lecturers')}</span>
                </div>
                {activeTab === 'lecturers' && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600 dark:bg-teal-400"
                  />
                )}
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveTab('positions')}
                className={`px-6 py-3 font-semibold text-sm transition-all relative ${
                  activeTab === 'positions'
                    ? 'text-primary-600 dark:text-teal-400'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <FaBriefcase className="w-5 h-5" />
                  <span>{t('feed.lookingForJob')}</span>
                </div>
                {activeTab === 'positions' && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600 dark:bg-teal-400"
                  />
                )}
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveTab('courses')}
                className={`px-6 py-3 font-semibold text-sm transition-all relative ${
                  activeTab === 'courses'
                    ? 'text-primary-600 dark:text-teal-400'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <FaBook className="w-5 h-5" />
                  <span>{t('feed.exploreCourses') || 'Courses'}</span>
                </div>
                {activeTab === 'courses' && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600 dark:bg-teal-400"
                  />
                )}
              </motion.button>
            </div>
          </div>

          {/* Tab Content */}
          <div className="mt-8">
            {/* Loading State */}
            {isLoadingSearch && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12"
              >
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 dark:border-teal-400"></div>
                <p className="mt-4 text-gray-600 dark:text-gray-400">{t('common.loading')}</p>
              </motion.div>
            )}

            {/* Error State */}
            {searchError && !isLoadingSearch && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12"
              >
                <p className="text-red-600 dark:text-red-400 mb-4">{searchError}</p>
              </motion.div>
            )}

            {/* All Tab - Mixed Results */}
            {!isLoadingSearch && !searchError && activeTab === 'all' && (
              <>
                {(searchQuery.trim() ? allResults.length === 0 : students.length === 0 && lecturers.length === 0 && positions.length === 0 && courses.length === 0) ? (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center py-12"
                  >
                    <FaCompass className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400 text-lg">
                      {searchQuery ? t('feed.noResultsFound') || 'No results found' : t('feed.noResults') || 'No results available'}
                    </p>
                    {searchQuery && (
                      <p className="text-gray-500 dark:text-gray-500 text-sm mt-2">
                        {t('feed.tryDifferentSearch')}
                      </p>
                    )}
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-8"
                  >
                    {/* Mixed Results from API */}
                    {searchQuery.trim() && allResults.length > 0 && (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {allResults.map((item, index) => {
                          if (item.itemType === 'student') {
                            return (
                              <motion.div
                                key={`student-${item.id}`}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                onClick={() => handleViewProfile(item, 'student')}
                                className="bg-white dark:bg-navy-800 rounded-lg shadow-md border border-gray-200 dark:border-navy-700 p-6 hover:shadow-xl transition-all cursor-pointer"
                              >
                                <div className="flex items-start gap-4 mb-4">
                                  <img
                                    src={getImageUrl(item.image) || 'https://i.pravatar.cc/150?img=12'}
                                    alt={item.name}
                                    className="w-16 h-16 rounded-full object-cover border-2 border-primary-200 dark:border-primary-800"
                                  />
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <h3 className="font-bold text-gray-800 dark:text-white">{item.name}</h3>
                                      {item.is_verified && (
                                        <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-full text-xs font-semibold">✓</span>
                                      )}
                                    </div>
                                    <p className="text-sm text-primary-600 dark:text-teal-400 mb-1">{item.major}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-500">{item.year} • {item.university}</p>
                                  </div>
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">{item.bio || item.about}</p>
                                {item.location && (
                                  <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-500">
                                    <FaMapMarkerAlt className="w-3 h-3" />
                                    <span>{item.location}</span>
                                  </div>
                                )}
                              </motion.div>
                            );
                          } else if (item.itemType === 'lecturer') {
                            return (
                              <motion.div
                                key={`lecturer-${item.id}`}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                onClick={() => handleViewProfile(item, 'lecturer')}
                                className="bg-white dark:bg-navy-800 rounded-lg shadow-md border border-gray-200 dark:border-navy-700 p-6 hover:shadow-xl transition-all cursor-pointer"
                              >
                                <div className="flex items-start gap-4 mb-4">
                                  <img
                                    src={getImageUrl(item.image) || 'https://i.pravatar.cc/150?img=20'}
                                    alt={item.name}
                                    className="w-16 h-16 rounded-full object-cover border-2 border-primary-200 dark:border-primary-800"
                                  />
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <h3 className="font-bold text-gray-800 dark:text-white">{item.name}</h3>
                                      {item.is_verified && (
                                        <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-full text-xs font-semibold">✓</span>
                                      )}
                                    </div>
                                    <p className="text-sm text-primary-600 dark:text-teal-400 mb-1">{item.specialty}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-500">{item.experience} • {item.university}</p>
                                  </div>
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">{item.bio || item.about}</p>
                                {item.location && (
                                  <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-500">
                                    <FaMapMarkerAlt className="w-3 h-3" />
                                    <span>{item.location}</span>
                                  </div>
                                )}
                              </motion.div>
                            );
                          } else if (item.itemType === 'job') {
                            return (
                              <motion.div
                                key={`job-${item.id}`}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                onClick={() => handleViewJob(item)}
                                className="bg-white dark:bg-navy-800 rounded-lg shadow-md border border-gray-200 dark:border-navy-700 p-6 hover:shadow-xl transition-all cursor-pointer"
                              >
                                <div className="mb-4">
                                  <h3 className="font-bold text-gray-800 dark:text-white mb-2 text-lg">{item.title}</h3>
                                  {item.institution && (
                                    <div className="flex items-center gap-2 mb-2">
                                      <FaUniversity className="text-primary-600 dark:text-teal-400" />
                                      <span className="text-sm text-primary-600 dark:text-teal-400 font-medium">{item.institution}</span>
                                    </div>
                                  )}
                                  {item.city && (
                                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-500 mb-2">
                                      <FaMapMarkerAlt className="w-3 h-3" />
                                      <span>{item.city}</span>
                                    </div>
                                  )}
                                </div>
                                {item.description && (
                                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-3">
                                    {item.description}
                                  </p>
                                )}
                                {/* Apply Button - For all lecturers */}
                                {instituteData.isAuthenticated && 
                                 instituteData.userType === 'lecturer' && (
                                  <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (!instituteData.isVerified) {
                                        setShowVerificationPopup(true);
                                      } else {
                                        setSelectedJob(item);
                                        setShowApplyJobModal(true);
                                      }
                                    }}
                                    className="w-full px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-lg transition-colors font-semibold text-sm"
                                  >
                                    {t('feed.applyJob') || 'Apply'}
                                  </motion.button>
                                )}
                              </motion.div>
                            );
                          } else if (item.itemType === 'institution_job') {
                            return (
                              <motion.div
                                key={`institution-job-${item.id}`}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                onClick={() => handleViewJob(item)}
                                className="bg-white dark:bg-navy-800 rounded-lg shadow-md border border-gray-200 dark:border-navy-700 p-6 hover:shadow-xl transition-all cursor-pointer"
                              >
                                <div className="mb-4">
                                  <h3 className="font-bold text-gray-800 dark:text-white mb-2 text-lg">{item.title}</h3>
                                  {item.institution_username && (
                                    <div className="flex items-center gap-2 mb-2">
                                      <FaUniversity className="text-primary-600 dark:text-teal-400" />
                                      <span className="text-sm text-primary-600 dark:text-teal-400 font-medium">{item.institution_username}</span>
                                    </div>
                                  )}
                                </div>
                                {item.description && (
                                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-3">
                                    {item.description}
                                  </p>
                                )}
                                {/* Apply Button - For all lecturers */}
                                {instituteData.isAuthenticated && 
                                 instituteData.userType === 'lecturer' && (
                                  <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (!instituteData.isVerified) {
                                        setShowVerificationPopup(true);
                                      } else {
                                        setSelectedJob(item);
                                        setShowApplyJobModal(true);
                                      }
                                    }}
                                    className="w-full px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-lg transition-colors font-semibold text-sm"
                                  >
                                    {t('feed.applyJob') || 'Apply'}
                                  </motion.button>
                                )}
                              </motion.div>
                            );
                          } else if (item.itemType === 'institution') {
                            return (
                              <motion.div
                                key={`institution-${item.id || item.username}`}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                onClick={() => handleViewProfile(item, 'institution')}
                                className="bg-white dark:bg-navy-800 rounded-lg shadow-md border border-gray-200 dark:border-navy-700 p-6 hover:shadow-xl transition-all cursor-pointer"
                              >
                                <div className="flex items-start gap-4 mb-4">
                                  <img
                                    src={getImageUrl(item.profile_image || item.image) || 'https://i.pravatar.cc/150?img=12'}
                                    alt={item.title || item.name || item.username}
                                    className="w-16 h-16 rounded-full object-cover border-2 border-primary-200 dark:border-primary-800"
                                  />
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <h3 className="font-bold text-gray-800 dark:text-white">{item.title || item.name || item.username}</h3>
                                    </div>
                                    <p className="text-sm text-primary-600 dark:text-teal-400 mb-1">{item.username}</p>
                                    {item.location && (
                                      <p className="text-xs text-gray-500 dark:text-gray-500">{item.location}</p>
                                    )}
                                  </div>
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">{item.about || item.bio}</p>
                                {item.city && (
                                  <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-500">
                                    <FaMapMarkerAlt className="w-3 h-3" />
                                    <span>{item.city}</span>
                                  </div>
                                )}
                              </motion.div>
                            );
                          } else if (item.itemType === 'course') {
                            return (
                              <motion.div
                                key={`course-${item.id}`}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                onClick={() => handleViewCourse(item)}
                                className="bg-white dark:bg-navy-800 rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow cursor-pointer"
                              >
                                <div className="relative h-32 overflow-hidden">
                                  <img
                                    src={getImageUrl(item.image) || item.image || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&q=80'}
                                    alt={item.title}
                                    className="w-full h-full object-cover"
                                  />
                                  <div className="absolute top-2 right-2">
                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                      item.level === 'Beginner' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' :
                                      item.level === 'Intermediate' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' :
                                      'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300'
                                    }`}>
                                      {item.level}
                                    </span>
                                  </div>
                                </div>
                                <div className="p-4">
                                  <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-1 line-clamp-2">
                                    {item.title}
                                  </h3>
                                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                    {item.code} • {item.institution}
                                  </p>
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                                      <FaChalkboardTeacher className="w-3 h-3" />
                                      <span className="truncate">{item.instructor}</span>
                                    </div>
                                    <div className="flex items-center gap-1 text-primary-600 dark:text-teal-400 font-bold text-sm">
                                      <FaDollarSign className="w-3 h-3" />
                                      <span>${item.price}</span>
                                    </div>
                                  </div>
                                </div>
                              </motion.div>
                            );
                          }
                          return null;
                        })}
                      </div>
                    )}

                    {/* Demo Data when no search */}
                    {!searchQuery.trim() && (
                      <>
                        {students.length > 0 && (
                          <div>
                            <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">{t('feed.students')}</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                              {students.slice(0, 3).map((student, index) => (
                                <motion.div
                                  key={student.id}
                                  initial={{ opacity: 0, y: 20 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: index * 0.1 }}
                                  onClick={() => handleViewProfile(student, 'student')}
                                  className="bg-white dark:bg-navy-800 rounded-lg shadow-md border border-gray-200 dark:border-navy-700 p-6 hover:shadow-xl transition-all cursor-pointer"
                                >
                                  <div className="flex items-start gap-4 mb-4">
                                    <img
                                      src={student.image}
                                      alt={student.name}
                                      className="w-16 h-16 rounded-full object-cover border-2 border-primary-200 dark:border-primary-800"
                                    />
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-1">
                                        <h3 className="font-bold text-gray-800 dark:text-white">{student.name}</h3>
                                        {student.isVerified && (
                                          <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-full text-xs font-semibold">✓</span>
                                        )}
                                      </div>
                                      <p className="text-sm text-primary-600 dark:text-teal-400 mb-1">{student.major}</p>
                                      <p className="text-xs text-gray-500 dark:text-gray-500">{student.year} • {student.university}</p>
                                    </div>
                                  </div>
                                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">{student.bio}</p>
                                  <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-500">
                                    <FaMapMarkerAlt className="w-3 h-3" />
                                    <span>{student.location}</span>
                                  </div>
                                </motion.div>
                              ))}
                            </div>
                          </div>
                        )}
                        {lecturers.length > 0 && (
                          <div>
                            <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">{t('feed.lecturers')}</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                              {lecturers.slice(0, 3).map((lecturer, index) => (
                                <motion.div
                                  key={lecturer.id}
                                  initial={{ opacity: 0, y: 20 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: index * 0.1 }}
                                  onClick={() => handleViewProfile(lecturer, 'lecturer')}
                                  className="bg-white dark:bg-navy-800 rounded-lg shadow-md border border-gray-200 dark:border-navy-700 p-6 hover:shadow-xl transition-all cursor-pointer"
                                >
                                  <div className="flex items-start gap-4 mb-4">
                                    <img
                                      src={lecturer.image}
                                      alt={lecturer.name}
                                      className="w-16 h-16 rounded-full object-cover border-2 border-primary-200 dark:border-primary-800"
                                    />
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-1">
                                        <h3 className="font-bold text-gray-800 dark:text-white">{lecturer.name}</h3>
                                        {lecturer.isVerified && (
                                          <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-full text-xs font-semibold">✓</span>
                                        )}
                                      </div>
                                      <p className="text-sm text-primary-600 dark:text-teal-400 mb-1">{lecturer.specialty}</p>
                                      <p className="text-xs text-gray-500 dark:text-gray-500">{lecturer.experience} • {lecturer.university}</p>
                                    </div>
                                  </div>
                                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">{lecturer.bio}</p>
                                  <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-500">
                                    <FaMapMarkerAlt className="w-3 h-3" />
                                    <span>{lecturer.location}</span>
                                  </div>
                                </motion.div>
                              ))}
                            </div>
                          </div>
                        )}
                        {positions.length > 0 && (
                          <div>
                            <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">{t('feed.lookingForJob')}</h3>
                            <div className="space-y-6">
                              {positions.slice(0, 3).map((position, index) => (
                                <motion.div
                                  key={position.id}
                                  initial={{ opacity: 0, y: 20 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: index * 0.1 }}
                                  className="bg-white dark:bg-navy-800 rounded-lg shadow-md border border-gray-200 dark:border-navy-700 p-6 hover:shadow-xl transition-all"
                                >
                                  <div className="flex items-start gap-4 mb-4">
                                    <img
                                      src={position.lecturerImage}
                                      alt={position.lecturerName}
                                      className="w-16 h-16 rounded-full object-cover border-2 border-primary-200 dark:border-primary-800"
                                    />
                                    <div className="flex-1">
                                      <h3 className="font-bold text-gray-800 dark:text-white mb-1">{position.lecturerName}</h3>
                                      <p className="text-sm text-primary-600 dark:text-teal-400 mb-1">{position.specialty} • {position.experience}</p>
                                      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-500">
                                        <FaMapMarkerAlt className="w-3 h-3" />
                                        <span>{position.location}</span>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-l-4 border-blue-500">
                                    <div className="flex items-center gap-2 mb-2">
                                      <FaBriefcase className="text-blue-600 dark:text-blue-400" />
                                      <span className="font-semibold text-blue-800 dark:text-blue-300">{t('feed.lookingForJob')}</span>
                                    </div>
                                    <p className="text-gray-700 dark:text-gray-300">{position.message}</p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                                      {t('feed.contact')}: <span className="font-medium">{position.contact}</span>
                                    </p>
                                  </div>
                                  {isInstitution && (
                                    <motion.button
                                      whileHover={{ scale: 1.02 }}
                                      whileTap={{ scale: 0.98 }}
                                      onClick={() => window.location.href = `mailto:${position.contact}`}
                                      className="w-full px-4 py-3 bg-primary-600 hover:bg-primary-500 text-white rounded-lg transition-colors font-semibold"
                                    >
                                      {t('feed.contactLecturer')}
                                    </motion.button>
                                  )}
                                </motion.div>
                              ))}
                            </div>
                          </div>
                        )}
                        {institutionJobPosts.length > 0 && (
                          <div>
                            <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">{t('feed.jobPostings') || 'Job Postings from Institutions'}</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                              {institutionJobPosts.slice(0, 3).map((job, index) => (
                                <motion.div
                                  key={`institution-job-${job.id}`}
                                  initial={{ opacity: 0, y: 20 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: index * 0.1 }}
                                  onClick={() => handleViewJob(job)}
                                  className="bg-white dark:bg-navy-800 rounded-lg shadow-md border border-gray-200 dark:border-navy-700 p-6 hover:shadow-xl transition-all cursor-pointer"
                                >
                                  <div className="mb-4">
                                    <h3 className="font-bold text-gray-800 dark:text-white mb-2 text-lg">{job.title}</h3>
                                    {job.institution_username && (
                                      <div className="flex items-center gap-2 mb-2">
                                        <FaUniversity className="text-primary-600 dark:text-teal-400" />
                                        <span className="text-sm text-primary-600 dark:text-teal-400 font-medium">{job.institution_username}</span>
                                      </div>
                                    )}
                                  </div>
                                  {job.description && (
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-3">
                                      {job.description}
                                    </p>
                                  )}
                                  {/* Apply Button - For all lecturers */}
                                  {instituteData.isAuthenticated && 
                                   instituteData.userType === 'lecturer' && (
                                    <motion.button
                                      whileHover={{ scale: 1.02 }}
                                      whileTap={{ scale: 0.98 }}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (!instituteData.isVerified) {
                                          setShowVerificationPopup(true);
                                        } else {
                                          setSelectedJob(job);
                                          setShowApplyJobModal(true);
                                        }
                                      }}
                                      className="w-full px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-lg transition-colors font-semibold text-sm"
                                    >
                                      {t('feed.applyJob') || 'Apply'}
                                    </motion.button>
                                  )}
                                </motion.div>
                              ))}
                            </div>
                          </div>
                        )}
                        {courses.length > 0 && (
                          <div>
                            <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">{t('feed.exploreCourses') || 'Courses'}</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                              {courses.slice(0, 3).map((course, index) => (
                                <motion.div
                                  key={course.id}
                                  initial={{ opacity: 0, y: 20 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: index * 0.1 }}
                                  className="bg-white dark:bg-navy-800 rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
                                >
                                  <div className="relative h-32 overflow-hidden">
                                    <img
                                      src={course.image}
                                      alt={course.title}
                                      className="w-full h-full object-cover"
                                    />
                                    <div className="absolute top-2 right-2">
                                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                        course.level === 'Beginner' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' :
                                        course.level === 'Intermediate' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' :
                                        'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300'
                                      }`}>
                                        {course.level}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="p-4">
                                    <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-1 line-clamp-2">
                                      {course.title}
                                    </h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                      {course.code} • {course.institution}
                                    </p>
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                                        <FaChalkboardTeacher className="w-3 h-3" />
                                        <span className="truncate">{course.instructor}</span>
                                      </div>
                                      <div className="flex items-center gap-1 text-primary-600 dark:text-teal-400 font-bold text-sm">
                                        <FaDollarSign className="w-3 h-3" />
                                        <span>${course.price}</span>
                                      </div>
                                    </div>
                                  </div>
                                </motion.div>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </motion.div>
                )}
              </>
            )}

            {/* Students Tab */}
            {!isLoadingSearch && !searchError && activeTab === 'students' && (
              <>
                {students.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center py-12"
                  >
                    <FaUserGraduate className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400 text-lg">
                      {searchQuery ? t('feed.noStudentsFound') : t('feed.noStudents')}
                    </p>
                    {searchQuery && (
                      <p className="text-gray-500 dark:text-gray-500 text-sm mt-2">
                        {t('feed.tryDifferentSearch')}
                      </p>
                    )}
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                  >
                    {students.map((student, index) => (
                  <motion.div
                    key={student.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    onClick={() => handleViewProfile(student, 'student')}
                    className="bg-white dark:bg-navy-800 rounded-lg shadow-md border border-gray-200 dark:border-navy-700 p-6 hover:shadow-xl transition-all cursor-pointer"
                  >
                    <div className="flex items-start gap-4 mb-4">
                      <img
                        src={student.image}
                        alt={student.name}
                        className="w-16 h-16 rounded-full object-cover border-2 border-primary-200 dark:border-primary-800"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-gray-800 dark:text-white">
                            {student.name}
                          </h3>
                          {student.isVerified && (
                            <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-full text-xs font-semibold">
                              ✓
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-primary-600 dark:text-teal-400 mb-1">
                          {student.major}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-500">
                          {student.year} • {student.university}
                        </p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                      {student.bio}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-500">
                      <FaMapMarkerAlt className="w-3 h-3" />
                      <span>{student.location}</span>
                    </div>
                  </motion.div>
                    ))}
                  </motion.div>
                )}
              </>
            )}

            {/* Lecturers Tab */}
            {!isLoadingSearch && !searchError && activeTab === 'lecturers' && (
              <>
                {lecturers.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center py-12"
                  >
                    <FaChalkboardTeacher className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400 text-lg">
                      {searchQuery ? t('feed.noLecturersFound') : t('feed.noLecturers')}
                    </p>
                    {searchQuery && (
                      <p className="text-gray-500 dark:text-gray-500 text-sm mt-2">
                        {t('feed.tryDifferentSearch')}
                      </p>
                    )}
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                  >
                    {lecturers.map((lecturer, index) => (
                  <motion.div
                    key={lecturer.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    onClick={() => handleViewProfile(lecturer, 'lecturer')}
                    className="bg-white dark:bg-navy-800 rounded-lg shadow-md border border-gray-200 dark:border-navy-700 p-6 hover:shadow-xl transition-all cursor-pointer"
                  >
                    <div className="flex items-start gap-4 mb-4">
                      <img
                        src={lecturer.image}
                        alt={lecturer.name}
                        className="w-16 h-16 rounded-full object-cover border-2 border-primary-200 dark:border-primary-800"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-gray-800 dark:text-white">
                            {lecturer.name}
                          </h3>
                          {lecturer.isVerified && (
                            <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-full text-xs font-semibold">
                              ✓
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-primary-600 dark:text-teal-400 mb-1">
                          {lecturer.specialty}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-500">
                          {lecturer.experience} • {lecturer.university}
                        </p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                      {lecturer.bio}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-500">
                      <FaMapMarkerAlt className="w-3 h-3" />
                      <span>{lecturer.location}</span>
                    </div>
                  </motion.div>
                    ))}
                  </motion.div>
                )}
              </>
            )}

            {/* Positions Tab */}
            {!isLoadingSearch && !searchError && activeTab === 'positions' && (
              <>
                {positions.length === 0 && institutionJobPosts.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center py-12"
                  >
                    <FaBriefcase className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400 text-lg">
                      {searchQuery ? t('feed.noPositionsFound') : t('feed.noPositions')}
                    </p>
                    {searchQuery && (
                      <p className="text-gray-500 dark:text-gray-500 text-sm mt-2">
                        {t('feed.tryDifferentSearch')}
                      </p>
                    )}
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                  >
                    {/* Institution Job Posts */}
                    {institutionJobPosts.length > 0 && (
                      <div className="mb-8">
                        <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">{t('feed.jobPostings') || 'Job Postings from Institutions'}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                          {institutionJobPosts.map((job, index) => (
                            <motion.div
                              key={`institution-job-${job.id}`}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.1 }}
                              onClick={() => handleViewJob(job)}
                              className="bg-white dark:bg-navy-800 rounded-lg shadow-md border border-gray-200 dark:border-navy-700 p-6 hover:shadow-xl transition-all cursor-pointer"
                            >
                              <div className="mb-4">
                                <h3 className="font-bold text-gray-800 dark:text-white mb-2 text-lg">{job.title}</h3>
                                {job.institution_username && (
                                  <div className="flex items-center gap-2 mb-2">
                                    <FaUniversity className="text-primary-600 dark:text-teal-400" />
                                    <span className="text-sm text-primary-600 dark:text-teal-400 font-medium">{job.institution_username}</span>
                                  </div>
                                )}
                              </div>
                              {job.description && (
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-3">
                                  {job.description}
                                </p>
                              )}
                              {/* Apply Button - For all lecturers */}
                              {instituteData.isAuthenticated && 
                               instituteData.userType === 'lecturer' && (
                                <motion.button
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.98 }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (!instituteData.isVerified) {
                                      setShowVerificationPopup(true);
                                    } else {
                                      setSelectedJob(job);
                                      setShowApplyJobModal(true);
                                    }
                                  }}
                                  className="w-full px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-lg transition-colors font-semibold text-sm"
                                >
                                  {t('feed.applyJob') || 'Apply'}
                                </motion.button>
                              )}
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Lecturer Positions (Looking for Job) */}
                    {positions.length > 0 && (
                      <div>
                        <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">{t('feed.lookingForJob')}</h3>
                        {positions.map((position, index) => (
                          <motion.div
                            key={position.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="bg-white dark:bg-navy-800 rounded-lg shadow-md border border-gray-200 dark:border-navy-700 p-6 hover:shadow-xl transition-all"
                          >
                            <div className="flex items-start gap-4 mb-4">
                              <img
                                src={position.lecturerImage}
                                alt={position.lecturerName}
                                className="w-16 h-16 rounded-full object-cover border-2 border-primary-200 dark:border-primary-800"
                              />
                              <div className="flex-1">
                                <h3 className="font-bold text-gray-800 dark:text-white mb-1">
                                  {position.lecturerName}
                                </h3>
                                <p className="text-sm text-primary-600 dark:text-teal-400 mb-1">
                                  {position.specialty} • {position.experience} {t('feed.experience')}
                                </p>
                                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-500">
                                  <FaMapMarkerAlt className="w-3 h-3" />
                                  <span>{position.location}</span>
                                </div>
                              </div>
                              <span className="text-xs text-gray-500 dark:text-gray-500">
                                {position.timestamp}
                              </span>
                            </div>

                            <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-l-4 border-blue-500">
                              <div className="flex items-center gap-2 mb-2">
                                <FaBriefcase className="text-blue-600 dark:text-blue-400" />
                                <span className="font-semibold text-blue-800 dark:text-blue-300">
                                  {t('feed.lookingForJob')}
                                </span>
                              </div>
                              <p className="text-gray-700 dark:text-gray-300 mb-2">
                                {position.message}
                              </p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {t('feed.contact')}: <span className="font-medium">{position.contact}</span>
                              </p>
                            </div>

                            {/* Contact Button for Institutions */}
                            {isInstitution && (
                              <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => window.location.href = `mailto:${position.contact}`}
                                className="w-full px-4 py-3 bg-primary-600 hover:bg-primary-500 text-white rounded-lg transition-colors font-semibold"
                              >
                                {t('feed.contactLecturer')}
                              </motion.button>
                            )}
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}
              </>
            )}

            {/* Courses Tab */}
            {!isLoadingSearch && !searchError && activeTab === 'courses' && (
              <>
                {/* Filters for Courses */}
                <div className="bg-white dark:bg-navy-800 rounded-xl shadow-lg p-6 mb-8">
                  <div className="flex flex-col md:flex-row gap-4">
                    {/* Search */}
                    <div className="flex-1 relative">
                      <FaSearch className={`absolute ${isRTL ? 'right-4' : 'left-4'} top-1/2 transform -translate-y-1/2 text-gray-400`} />
                      <input
                        type="text"
                        placeholder={t('coursesPage.searchPlaceholder') || 'Search courses...'}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className={`w-full ${isRTL ? 'pr-12 pl-4' : 'pl-12 pr-4'} py-3 border border-gray-300 dark:border-navy-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-navy-700 text-gray-900 dark:text-white`}
                      />
                    </div>

                    {/* Level Filter */}
                    <div className="relative">
                      <FaFilter className={`absolute ${isRTL ? 'right-4' : 'left-4'} top-1/2 transform -translate-y-1/2 text-gray-400`} />
                      <select
                        value={selectedLevel}
                        onChange={(e) => setSelectedLevel(e.target.value)}
                        className={`${isRTL ? 'pr-12 pl-10' : 'pl-12 pr-10'} py-3 border border-gray-300 dark:border-navy-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-navy-700 text-gray-900 dark:text-white appearance-none cursor-pointer`}
                      >
                        <option value="all">{t('coursesPage.allLevels') || 'All Levels'}</option>
                        <option value="Beginner">{t('coursesPage.beginner') || 'Beginner'}</option>
                        <option value="Intermediate">{t('coursesPage.intermediate') || 'Intermediate'}</option>
                        <option value="Advanced">{t('coursesPage.advanced') || 'Advanced'}</option>
                      </select>
                    </div>

                    {/* Institution Filter */}
                    <div className="relative">
                      <FaUniversity className={`absolute ${isRTL ? 'right-4' : 'left-4'} top-1/2 transform -translate-y-1/2 text-gray-400`} />
                      <select
                        value={selectedInstitution}
                        onChange={(e) => setSelectedInstitution(e.target.value)}
                        className={`${isRTL ? 'pr-12 pl-10' : 'pl-12 pr-10'} py-3 border border-gray-300 dark:border-navy-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-navy-700 text-gray-900 dark:text-white appearance-none cursor-pointer`}
                      >
                        <option value="all">{t('coursesPage.allInstitutions') || 'All Institutions'}</option>
                        {[...new Set(courses.map(c => c.institution))].map(inst => (
                          <option key={inst} value={inst}>{inst}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {(() => {
                  const filteredCourses = courses.filter(course => {
                    const matchesSearch = !searchQuery.trim() || 
                      course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      course.instructor.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      course.category.toLowerCase().includes(searchQuery.toLowerCase());
                    const matchesLevel = selectedLevel === 'all' || course.level === selectedLevel;
                    const matchesInstitution = selectedInstitution === 'all' || course.institution === selectedInstitution;
                    return matchesSearch && matchesLevel && matchesInstitution;
                  });

                  return filteredCourses.length === 0 ? (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-center py-12"
                    >
                      <FaGraduationCap className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                      <p className="text-gray-600 dark:text-gray-400 text-lg">
                        {t('coursesPage.noCoursesFound') || 'No courses found'}
                      </p>
                      {(searchQuery || selectedLevel !== 'all' || selectedInstitution !== 'all') && (
                        <p className="text-gray-500 dark:text-gray-500 text-sm mt-2">
                          {t('coursesPage.tryAdjustingFilters') || 'Try adjusting your filters'}
                        </p>
                      )}
                    </motion.div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                    >
                      {filteredCourses.map((course, index) => (
                        <motion.div
                          key={course.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          onClick={() => handleViewCourse(course)}
                          className="bg-white dark:bg-navy-800 rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow cursor-pointer"
                        >
                          {/* Course Image */}
                          <div className="relative h-48 overflow-hidden">
                            <img
                              src={getImageUrl(course.image) || course.image}
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
                                ({course.reviews} {t('coursesPage.reviews') || 'reviews'})
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
                                  <span>{course.students} {t('coursesPage.studentsLabel') || 'students'}</span>
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
                              {t('coursesPage.enrollNow') || 'Enroll Now'}
                            </motion.button>
                          </div>
                        </motion.div>
                      ))}
                    </motion.div>
                  );
                })()}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Profile Modal */}
      {selectedProfile && (
        <Modal
          isOpen={!!selectedProfile}
          onClose={handleCloseProfile}
          title={selectedProfile.name || selectedProfile.title || selectedProfile.username || 'Profile'}
        >
          {isLoadingProfile ? (
            <div className="flex items-center justify-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 dark:border-teal-400"></div>
              <p className="ml-4 text-gray-600 dark:text-gray-400">{t('common.loading')}</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Profile Header */}
              <div className="flex items-start gap-6">
                <div className="relative">
                  <img
                    src={selectedProfile.image || getImageUrl(selectedProfile.profile_image) || 'https://i.pravatar.cc/150?img=12'}
                    alt={selectedProfile.name || selectedProfile.title || selectedProfile.username}
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
                    {profileType === 'institution' 
                      ? (selectedProfile.title || selectedProfile.name || selectedProfile.username)
                      : selectedProfile.name}
                  </h2>
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
                {profileType === 'institution' ? (
                  <>
                    {selectedProfile.title && (
                      <p className="text-lg text-primary-600 dark:text-teal-400 font-semibold mb-1">
                        {selectedProfile.title}
                      </p>
                    )}
                    {(selectedProfile.first_name || selectedProfile.last_name) && (
                      <p className="text-sm text-gray-400 dark:text-gray-500 mb-1">
                        {selectedProfile.first_name || ''} {selectedProfile.last_name || ''}
                      </p>
                    )}
                    {selectedProfile.username && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                        @{selectedProfile.username}
                      </p>
                    )}
                  </>
                ) : (
                  <>
                    <p className="text-lg text-primary-600 dark:text-teal-400 mb-1">
                      {profileType === 'student' ? selectedProfile.major || selectedProfile.studying_level : selectedProfile.specialty}
                    </p>
                    <p className="text-gray-600 dark:text-gray-400">
                      {profileType === 'student' 
                        ? `${selectedProfile.year || ''} ${selectedProfile.year ? '•' : ''} ${selectedProfile.university || ''}`.trim()
                        : `${selectedProfile.experience || ''} ${selectedProfile.experience ? 'Experience' : ''} ${selectedProfile.experience && selectedProfile.university ? '•' : ''} ${selectedProfile.university || ''}`.trim()}
                    </p>
                  </>
                )}
                {(selectedProfile.bio || selectedProfile.about) && (
                  <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                    {selectedProfile.bio || selectedProfile.about}
                  </p>
                )}
              </div>
            </div>

            {/* Contact Information / Location Details */}
            {(selectedProfile.email || selectedProfile.phone || selectedProfile.location || selectedProfile.city) && (
              <div className="bg-gray-50 dark:bg-navy-900 rounded-lg p-4">
                <h3 className="font-semibold text-gray-800 dark:text-white mb-3">{t('feed.contactInformation') || 'Contact Information'}</h3>
                <div className="space-y-2 text-sm">
                  {selectedProfile.email && (
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600 dark:text-gray-400">📧 {t('feed.email') || 'Email'}:</span>
                      <span className="text-gray-800 dark:text-white">{selectedProfile.email}</span>
                    </div>
                  )}
                  {selectedProfile.phone_number && (
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600 dark:text-gray-400">📱 {t('feed.phone') || 'Phone'}:</span>
                      <span className="text-gray-800 dark:text-white">{selectedProfile.phone_number}</span>
                    </div>
                  )}
                  {selectedProfile.phone && !selectedProfile.phone_number && (
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600 dark:text-gray-400">📱 {t('feed.phone') || 'Phone'}:</span>
                      <span className="text-gray-800 dark:text-white">{selectedProfile.phone}</span>
                    </div>
                  )}
                  {selectedProfile.location && (
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600 dark:text-gray-400">📍 {t('feed.location') || 'Location'}:</span>
                      <span className="text-gray-800 dark:text-white">{selectedProfile.location}</span>
                    </div>
                  )}
                  {selectedProfile.city && (
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600 dark:text-gray-400">🏙️ {t('feed.city') || 'City'}:</span>
                      <span className="text-gray-800 dark:text-white">{selectedProfile.city}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* About */}
            {(selectedProfile.about || selectedProfile.bio) && (
              <div className="bg-gray-50 dark:bg-navy-900 rounded-lg p-4">
                <h3 className="font-semibold text-gray-800 dark:text-white mb-3">{t('feed.about') || 'About'}</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                  {selectedProfile.about || selectedProfile.bio}
                </p>
              </div>
            )}

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

            {/* Institution-specific content */}
            {profileType === 'institution' && (
              <>
                {selectedProfile.title && (
                  <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-800 dark:text-white mb-2">{t('feed.institutionName') || 'Institution Name'}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                      {selectedProfile.title}
                    </p>
                  </div>
                )}
                {(selectedProfile.first_name || selectedProfile.last_name) && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-800 dark:text-white mb-2">{t('feed.ownerName') || 'Owner Name'}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {selectedProfile.first_name || ''} {selectedProfile.last_name || ''}
                    </p>
                  </div>
                )}
                {selectedProfile.username && (
                  <div className="bg-gray-50 dark:bg-navy-900 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-800 dark:text-white mb-2">{t('feed.username') || 'Username'}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      @{selectedProfile.username}
                    </p>
                  </div>
                )}
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

                {selectedProfile.courses && selectedProfile.courses.length > 0 && (
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
                )}

                {selectedProfile.research && selectedProfile.research.length > 0 && (
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
                )}

                {selectedProfile.publications && (
                  <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-800 dark:text-white mb-2">{t('feed.publications')}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {selectedProfile.publications}
                    </p>
                  </div>
                )}

                {selectedProfile.achievements && selectedProfile.achievements.length > 0 && (
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
                )}
              </>
            )}
            </div>
          )}
        </Modal>
      )}

      {/* Profile Modal */}
      <ProfileModal 
        isOpen={showProfileModal} 
        onClose={() => setShowProfileModal(false)} 
      />

      {/* Job Details Modal */}
      {selectedJob && (
        <Modal
          isOpen={!!selectedJob}
          onClose={handleCloseJob}
          title={selectedJob.title || t('feed.jobDetails') || 'Job Details'}
        >
          {isLoadingJob ? (
            <div className="flex items-center justify-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 dark:border-teal-400"></div>
              <p className="ml-4 text-gray-600 dark:text-gray-400">{t('common.loading')}</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Job Header */}
              <div>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
                  {selectedJob.title}
                </h2>
                {selectedJob.specialty && (
                  <p className="text-lg text-primary-600 dark:text-teal-400 font-semibold mb-2">
                    {selectedJob.specialty}
                  </p>
                )}
                {selectedJob.institution_username && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-2">
                    <FaUniversity className="text-primary-600 dark:text-teal-400" />
                    <span>@{selectedJob.institution_username}</span>
                  </div>
                )}
              </div>

              {/* Description */}
              {selectedJob.description && (
                <div className="bg-gray-50 dark:bg-navy-900 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-800 dark:text-white mb-2">{t('feed.description') || 'Description'}</h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                    {selectedJob.description}
                  </p>
                </div>
              )}

              {/* Job Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Experience Required */}
                {selectedJob.experience_required !== undefined && selectedJob.experience_required !== null && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <FaBriefcase className="text-blue-600 dark:text-blue-400" />
                      <h3 className="font-semibold text-gray-800 dark:text-white text-sm">{t('feed.experienceRequired') || 'Experience Required'}</h3>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">
                      {selectedJob.experience_required} {t('feed.years') || 'years'}
                    </p>
                  </div>
                )}

                {/* Skills Required */}
                {selectedJob.skills_required && (
                  <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <FaGraduationCap className="text-purple-600 dark:text-purple-400" />
                      <h3 className="font-semibold text-gray-800 dark:text-white text-sm">{t('feed.skillsRequired') || 'Skills Required'}</h3>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                      {selectedJob.skills_required}
                    </p>
                  </div>
                )}

                {/* Salary Offer */}
                {selectedJob.salary_offer !== undefined && selectedJob.salary_offer !== null && (
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <FaDollarSign className="text-green-600 dark:text-green-400" />
                      <h3 className="font-semibold text-gray-800 dark:text-white text-sm">{t('feed.salaryOffer') || 'Salary Offer'}</h3>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 text-sm font-bold">
                      ${selectedJob.salary_offer.toLocaleString()}
                    </p>
                  </div>
                )}

                {/* Created Date */}
                {selectedJob.created_at && (
                  <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <FaClock className="text-orange-600 dark:text-orange-400" />
                      <h3 className="font-semibold text-gray-800 dark:text-white text-sm">{t('feed.postedDate') || 'Posted Date'}</h3>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                      {new Date(selectedJob.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </Modal>
      )}

      {/* Apply Job Modal */}
      {showApplyJobModal && selectedJob && (
        <Modal
          isOpen={showApplyJobModal}
          onClose={() => {
            setShowApplyJobModal(false);
            setApplyJobMessage('');
          }}
          title={t('feed.applyToJob') || 'Apply to Job'}
        >
          <div className="space-y-6">
            {/* Job Info */}
            <div className="bg-gray-50 dark:bg-navy-900 rounded-lg p-4">
              <h3 className="font-semibold text-gray-800 dark:text-white mb-2">{selectedJob.title}</h3>
              {selectedJob.institution && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {t('feed.institution') || 'Institution'}: {selectedJob.institution}
                </p>
              )}
            </div>

            {/* Message Input */}
            <div>
              <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
                {t('feed.messageToInstitution') || 'Message to Institution'} ({t('common.optional') || 'Optional'})
              </label>
              <textarea
                value={applyJobMessage}
                onChange={(e) => setApplyJobMessage(e.target.value)}
                placeholder={t('feed.messagePlaceholder') || 'Add a message to the institution (optional)...'}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 dark:border-navy-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-navy-700 text-gray-900 dark:text-white"
              />
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setShowApplyJobModal(false);
                  setApplyJobMessage('');
                }}
                className="flex-1 px-4 py-3 border border-gray-300 dark:border-navy-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-navy-700 transition-colors"
              >
                {t('common.cancel') || 'Cancel'}
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={async () => {
                  if (!instituteData.accessToken) {
                    toast.error(t('common.sessionExpired') || 'Session expired. Please log in again.');
                    return;
                  }

                  setIsApplying(true);
                  try {
                    const response = await authService.applyToJob(
                      instituteData.accessToken,
                      selectedJob.id,
                      applyJobMessage,
                      {
                        refreshToken: instituteData.refreshToken,
                        onTokenRefreshed: (tokens) => {
                          updateInstituteData({
                            accessToken: tokens.access,
                            refreshToken: tokens.refresh,
                          });
                        },
                        onSessionExpired: () => {
                          // Handle session expired
                        },
                      }
                    );

                    if (response?.success) {
                      toast.success(response.message || t('feed.applicationSubmitted') || 'Application submitted successfully!');
                      setShowApplyJobModal(false);
                      setApplyJobMessage('');
                      setSelectedJob(null);
                    } else {
                      toast.error(response?.message || t('feed.applicationFailed') || 'Failed to submit application');
                    }
                  } catch (error) {
                    console.error('Error applying to job:', error);
                    toast.error(error?.message || error?.data?.message || t('feed.applicationFailed') || 'Failed to submit application');
                  } finally {
                    setIsApplying(false);
                  }
                }}
                disabled={isApplying}
                className="flex-1 px-4 py-3 bg-primary-600 hover:bg-primary-500 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isApplying ? (t('feed.applying') || 'Applying...') : (t('feed.apply') || 'Apply')}
              </motion.button>
            </div>
          </div>
        </Modal>
      )}

      {/* Course Details Modal */}
      {selectedCourse && (
        <Modal
          isOpen={!!selectedCourse}
          onClose={handleCloseCourse}
          title={selectedCourse.title || 'Course Details'}
        >
          {isLoadingCourse ? (
            <div className="flex items-center justify-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 dark:border-teal-400"></div>
              <p className="ml-4 text-gray-600 dark:text-gray-400">{t('common.loading')}</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Course Image */}
              {selectedCourse.course_image && (
                <div className="relative h-64 overflow-hidden rounded-xl">
                  <img
                    src={getImageUrl(selectedCourse.course_image)}
                    alt={selectedCourse.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Course Header */}
              <div>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
                  {selectedCourse.title}
                </h2>
                {selectedCourse.level && (
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                    selectedCourse.level === 'beginner' || selectedCourse.level === 'Beginner' 
                      ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' :
                    selectedCourse.level === 'intermediate' || selectedCourse.level === 'Intermediate'
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' :
                      'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300'
                  }`}>
                    {selectedCourse.level}
                  </span>
                )}
              </div>

              {/* About/Description */}
              {selectedCourse.about && (
                <div className="bg-gray-50 dark:bg-navy-900 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-800 dark:text-white mb-2">{t('feed.about') || 'About'}</h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                    {selectedCourse.about}
                  </p>
                </div>
              )}

              {/* Course Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Institution */}
                {selectedCourse.institution_name && (
                  <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <FaUniversity className="text-indigo-600 dark:text-indigo-400" />
                      <h3 className="font-semibold text-gray-800 dark:text-white text-sm">{t('feed.institution') || 'Institution'}</h3>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">{selectedCourse.institution_name}</p>
                    {selectedCourse.institution_username && (
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">@{selectedCourse.institution_username}</p>
                    )}
                  </div>
                )}

                {/* Lecturer */}
                {selectedCourse.lecturer_name && (
                  <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <FaChalkboardTeacher className="text-purple-600 dark:text-purple-400" />
                      <h3 className="font-semibold text-gray-800 dark:text-white text-sm">{t('feed.lecturer') || 'Lecturer'}</h3>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">{selectedCourse.lecturer_name}</p>
                  </div>
                )}

                {/* Price */}
                {selectedCourse.price && (
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <FaDollarSign className="text-green-600 dark:text-green-400" />
                      <h3 className="font-semibold text-gray-800 dark:text-white text-sm">{t('feed.price') || 'Price'}</h3>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 text-sm font-bold">${parseFloat(selectedCourse.price).toFixed(2)}</p>
                  </div>
                )}

                {/* Dates */}
                {(selectedCourse.starting_date || selectedCourse.ending_date) && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <FaClock className="text-blue-600 dark:text-blue-400" />
                      <h3 className="font-semibold text-gray-800 dark:text-white text-sm">{t('feed.dates') || 'Course Dates'}</h3>
                    </div>
                    {selectedCourse.starting_date && (
                      <p className="text-gray-600 dark:text-gray-400 text-xs">
                        <span className="font-medium">{t('feed.startDate') || 'Start'}:</span> {new Date(selectedCourse.starting_date).toLocaleDateString()}
                      </p>
                    )}
                    {selectedCourse.ending_date && (
                      <p className="text-gray-600 dark:text-gray-400 text-xs">
                        <span className="font-medium">{t('feed.endDate') || 'End'}:</span> {new Date(selectedCourse.ending_date).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                )}

                {/* Schedule */}
                {(selectedCourse.days || selectedCourse.start_time || selectedCourse.end_time) && (
                  <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4 md:col-span-2">
                    <div className="flex items-center gap-2 mb-2">
                      <FaClock className="text-orange-600 dark:text-orange-400" />
                      <h3 className="font-semibold text-gray-800 dark:text-white text-sm">{t('feed.schedule') || 'Schedule'}</h3>
                    </div>
                    <div className="space-y-1">
                      {selectedCourse.days && selectedCourse.days.length > 0 && (
                        <p className="text-gray-600 dark:text-gray-400 text-sm">
                          <span className="font-medium">{t('feed.days') || 'Days'}:</span> {selectedCourse.days.map(day => day.charAt(0).toUpperCase() + day.slice(1)).join(', ')}
                        </p>
                      )}
                      {selectedCourse.start_time && selectedCourse.end_time && (
                        <p className="text-gray-600 dark:text-gray-400 text-sm">
                          <span className="font-medium">{t('feed.time') || 'Time'}:</span> {selectedCourse.start_time.substring(0, 5)} - {selectedCourse.end_time.substring(0, 5)}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </Modal>
      )}

      {/* Verification Required Popup */}
      <AnimatePresence>
        {showVerificationPopup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowVerificationPopup(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-navy-800 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-yellow-500 to-orange-500 p-6 text-center">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-white">
                  {t('verification.required') || 'Verification Required'}
                </h3>
              </div>

              {/* Content */}
              <div className="p-6">
                <p className="text-gray-600 dark:text-gray-400 text-center mb-6">
                  {t('verification.message') || 'Your account needs to be verified to access this feature. Please verify your account to continue.'}
                </p>

                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
                  <div className={`flex items-start gap-3 ${isRTL ? 'flex-row-reverse text-right' : ''}`}>
                    <FaInfoCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm text-yellow-800 dark:text-yellow-300 font-medium mb-1">
                        {t('verification.howToVerify') || 'How to verify?'}
                      </p>
                      <p className="text-xs text-yellow-700 dark:text-yellow-400">
                        {t('verification.instructions') || 'Go to your profile and complete the verification process by uploading the required documents.'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowVerificationPopup(false)}
                    className="flex-1 px-4 py-3 border border-gray-300 dark:border-navy-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-navy-700 transition-colors"
                  >
                    {t('common.close') || 'Close'}
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setShowVerificationPopup(false);
                      setShowProfileModal(true);
                    }}
                    className="flex-1 px-4 py-3 bg-primary-600 hover:bg-primary-500 text-white rounded-lg font-medium transition-colors"
                  >
                    {t('verification.goToProfile') || 'Go to Profile'}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Explore;

