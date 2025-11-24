import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  FaUniversity, 
  FaArrowLeft,
  FaCode,
  FaRocket,
  FaUsers,
  FaGraduationCap,
  FaHeart,
  FaGithub,
  FaEnvelope,
  FaInstagram
} from 'react-icons/fa';
import muhammedProfile from '../assets/images/muhammedprofil.png';
import mustafaProfile from '../assets/images/mustafaprofile.png';
import { useTheme } from '../context/ThemeContext';

const AboutUs = () => {
  const navigate = useNavigate();
  const { isDark } = useTheme();

  const developers = [
    {
      name: 'Mohammed Salah',
      role: 'Frontend Developer',
      bio: 'Passionate about creating innovative solutions and building scalable applications. Specialized in modern web technologies and cloud architecture.',
      skills: ['React', 'Node.js', 'Python', 'AWS'],
      github: 'https://github.com/fuden4',
      instagram: 'https://www.instagram.com/pzx0z/',
      email: 'mohammed.salah@example.com',
      image: muhammedProfile,
    },
    {
      name: 'Mustafa Mohammed',
      role: 'Backend Developer',
      bio: 'Dedicated to crafting exceptional user experiences and robust backend systems. Expert in database design and API development.',
      skills: ['React', 'Django', 'PostgreSQL', 'Docker'],
      github: 'https://github.com/H2SO4-1191',
      instagram: 'https://www.instagram.com/h2so4.1191/',
      email: 'mustafa.mohammed@example.com',
      image: mustafaProfile,
    },
    {
      name: 'Noor Naji',
      role: 'Documentation Specialist',
      bio: 'Responsible for creating comprehensive documentation and ensuring clear communication of project features and functionality.',
      skills: ['Technical Writing', 'Documentation', 'Content Management'],
      github: null,
      instagram: null,
      email: 'noor.naji@example.com',
      image: null,
    },
  ];

  const features = [
    {
      icon: <FaGraduationCap className="w-8 h-8" />,
      title: 'Educational Excellence',
      description: 'Connecting students, lecturers, and institutions in one comprehensive platform.',
    },
    {
      icon: <FaUsers className="w-8 h-8" />,
      title: 'Community Driven',
      description: 'Building a vibrant community of learners and educators across Iraq.',
    },
    {
      icon: <FaRocket className="w-8 h-8" />,
      title: 'Innovation First',
      description: 'Leveraging cutting-edge technology to transform education.',
    },
    {
      icon: <FaCode className="w-8 h-8" />,
      title: 'Modern Technology',
      description: 'Built with React, Node.js, and modern web standards.',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-navy-900 transition-colors">
      {/* Navigation Bar */}
      <nav className="bg-white dark:bg-navy-800 shadow-lg sticky top-0 z-50 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3 cursor-pointer"
              onClick={() => navigate('/')}
            >
              <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-teal-500 rounded-lg flex items-center justify-center">
                <FaUniversity className="text-white text-xl" />
              </div>
              <span className="text-xl font-bold text-gray-800 dark:text-white">
                Project East
              </span>
            </motion.div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/')}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-navy-700 rounded-lg transition-colors"
            >
              <FaArrowLeft />
              <span>Back to Feed</span>
            </motion.button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary-600 to-teal-500 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-6xl font-bold mb-4"
          >
            About Project East
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-white/90 max-w-3xl mx-auto"
          >
            Empowering education through technology. Connecting institutions, students, and lecturers across Iraq.
          </motion.p>
        </div>
      </div>

      {/* Mission Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-navy-800 rounded-2xl shadow-xl p-8 md:p-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-white mb-6 text-center">
            Our Mission
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 text-center max-w-3xl mx-auto leading-relaxed">
            Project East is dedicated to revolutionizing the educational landscape in Iraq by providing a comprehensive platform 
            that bridges the gap between educational institutions, students, and lecturers. We believe in making quality education 
            accessible to everyone through innovative technology solutions.
          </p>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-white mb-12 text-center"
        >
          What We Offer
        </motion.h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + index * 0.1 }}
              className="bg-white dark:bg-navy-800 rounded-xl shadow-lg p-6 text-center hover:shadow-xl transition-shadow"
            >
              <div className="text-primary-600 dark:text-teal-400 mb-4 flex justify-center">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Developers Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-white mb-12 text-center"
        >
          Meet the Developers
        </motion.h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {developers.map((developer, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 + index * 0.1 }}
              className="bg-white dark:bg-navy-800 rounded-2xl shadow-xl p-8 hover:shadow-2xl transition-shadow"
            >
              <div className="text-center mb-6">
                {developer.image ? (
                  <div className="w-32 h-32 rounded-full overflow-hidden mx-auto mb-4 border-4 border-primary-200 dark:border-primary-800 shadow-lg">
                    <img
                      src={developer.image}
                      alt={developer.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-32 h-32 rounded-full mx-auto mb-4 border-4 border-primary-200 dark:border-primary-800 shadow-lg bg-gradient-to-br from-primary-600 to-teal-500 flex items-center justify-center">
                    <span className="text-white text-4xl font-bold">
                      {developer.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                )}
                <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
                  {developer.name}
                </h3>
                <p className="text-primary-600 dark:text-teal-400 font-semibold mb-4">
                  {developer.role}
                </p>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  {developer.bio}
                </p>
              </div>

              {/* Skills */}
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  Skills & Technologies
                </h4>
                <div className="flex flex-wrap gap-2">
                  {developer.skills.map((skill, skillIndex) => (
                    <span
                      key={skillIndex}
                      className="px-3 py-1 bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 rounded-full text-sm font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Social Links */}
              <div className="flex items-center justify-center gap-4 pt-4 border-t border-gray-200 dark:border-navy-700">
                {developer.github && (
                  <motion.a
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    href={developer.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 bg-gray-800 dark:bg-gray-700 hover:bg-gray-900 dark:hover:bg-gray-600 rounded-full flex items-center justify-center text-white transition-colors"
                    title="GitHub"
                  >
                    <FaGithub className="w-5 h-5" />
                  </motion.a>
                )}
                {developer.instagram && (
                  <motion.a
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    href={developer.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-full flex items-center justify-center text-white transition-colors"
                    title="Instagram"
                  >
                    <FaInstagram className="w-5 h-5" />
                  </motion.a>
                )}
                {developer.email && (
                  <motion.a
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    href={`mailto:${developer.email}`}
                    className="w-10 h-10 bg-primary-600 hover:bg-primary-700 rounded-full flex items-center justify-center text-white transition-colors"
                    title="Email"
                  >
                    <FaEnvelope className="w-5 h-5" />
                  </motion.a>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Supervisor Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-gradient-to-r from-primary-600 to-teal-500 rounded-2xl shadow-xl p-8 md:p-12 text-center"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Supervised By
          </h2>
          <p className="text-xl text-white/90 font-semibold">
            Assist. Prof. Adala Chehad
          </p>
          <p className="text-white/80 mt-2">
            Project Supervisor
          </p>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="bg-white dark:bg-navy-800 border-t border-gray-200 dark:border-navy-700 mt-16 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <FaHeart className="text-red-500" />
              <p className="text-gray-600 dark:text-gray-400">
                Made with passion for education
              </p>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              © 2025 Project East. All rights reserved.
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
              Developed by <span className="font-semibold text-primary-600 dark:text-teal-400">Mohammed Salah</span> and <span className="font-semibold text-primary-600 dark:text-teal-400">Mustafa Mohammed</span>
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
              Documentation by <span className="font-semibold text-primary-600 dark:text-teal-400">Noor Naji</span>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default AboutUs;

