import { Navigate } from 'react-router-dom';
import { useInstitute } from '../context/InstituteContext';
import toast from 'react-hot-toast';

const ProtectedRoute = ({ children, requireInstitution = true, requireVerified = false }) => {
  const { instituteData } = useInstitute();

  // Check if user is authenticated
  if (!instituteData.isAuthenticated || !instituteData.accessToken) {
    // Redirect to login if not authenticated
    return <Navigate to="/login" replace />;
  }

  // Check if institution access is required (for Dashboard)
  if (requireInstitution && instituteData.userType !== 'institution') {
    toast.error('Dashboard access is only available for institutions');
    return <Navigate to="/feed" replace />;
  }

  // Check if verification is required (for student-specific routes)
  if (requireVerified && instituteData.userType === 'student' && !instituteData.isVerified) {
    toast.error('Account verification is required to access this page. Please verify your account first.');
    return <Navigate to="/feed" replace />;
  }

  return children;
};

export default ProtectedRoute;

