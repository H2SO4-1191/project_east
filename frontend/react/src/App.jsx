import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Toaster } from 'react-hot-toast';
import { InstituteProvider } from './context/InstituteContext';
import { ThemeProvider } from './context/ThemeContext';
import EnhancedHome from './pages/EnhancedHome';
import EnhancedLogin from './pages/EnhancedLogin';
import OTPVerification from './pages/OTPVerification';
import EnhancedDashboard from './pages/EnhancedDashboard';
import EnhancedSignup from './pages/EnhancedSignup';

function AnimatedRoutes() {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<EnhancedHome />} />
        <Route path="/login" element={<EnhancedLogin />} />
        <Route path="/signup" element={<EnhancedSignup />} />
        <Route path="/verify-otp" element={<OTPVerification />} />
        <Route path="/dashboard/*" element={<EnhancedDashboard />} />
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

