import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Toaster } from 'react-hot-toast';
import { InstituteProvider } from './context/InstituteContext';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';
import Feed from './pages/Feed';
import EnhancedHome from './pages/EnhancedHome';
import EnhancedLogin from './pages/EnhancedLogin';
import OTPVerification from './pages/OTPVerification';
import EnhancedDashboard from './pages/EnhancedDashboard';
import EnhancedSignup from './pages/EnhancedSignup';
import StudentSignup from './pages/StudentSignup';
import LecturerSignup from './pages/LecturerSignup';
import AboutUs from './pages/AboutUs';
import Courses from './pages/Courses';
import StudentSchedule from './pages/student/StudentSchedule';
import StudentCourses from './pages/student/StudentCourses';
import LecturerSchedule from './pages/lecturer/LecturerSchedule';
import LecturerCourses from './pages/lecturer/LecturerCourses';

function AnimatedRoutes() {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Feed />} />
        <Route path="/feed" element={<Feed />} />
        <Route path="/home" element={<EnhancedHome />} />
        <Route path="/login" element={<EnhancedLogin />} />
        <Route path="/signup" element={<EnhancedSignup />} />
        <Route path="/signup/student" element={<StudentSignup />} />
        <Route path="/signup/lecturer" element={<LecturerSignup />} />
        <Route path="/verify-otp" element={<OTPVerification />} />
        <Route path="/about" element={<AboutUs />} />
        <Route path="/courses" element={<Courses />} />
        <Route 
          path="/dashboard/*" 
          element={
            <ProtectedRoute requireInstitution={true}>
              <EnhancedDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/student/schedule" 
          element={
            <ProtectedRoute requireInstitution={false}>
              <StudentSchedule />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/student/courses" 
          element={
            <ProtectedRoute requireInstitution={false}>
              <StudentCourses />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/lecturer/schedule" 
          element={
            <ProtectedRoute requireInstitution={false}>
              <LecturerSchedule />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/lecturer/courses" 
          element={
            <ProtectedRoute requireInstitution={false}>
              <LecturerCourses />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </AnimatePresence>
  );
}

function App() {
  return (
    <ThemeProvider>
      <InstituteProvider>
        <Router>
          <AnimatedRoutes />
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 3000,
              style: {
                background: '#363636',
                color: '#fff',
              },
              success: {
                iconTheme: {
                  primary: '#14b8a6',
                  secondary: '#fff',
                },
              },
            }}
          />
        </Router>
      </InstituteProvider>
    </ThemeProvider>
  );
}

export default App;

