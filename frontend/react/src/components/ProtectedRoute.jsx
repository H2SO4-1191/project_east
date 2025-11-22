import { Navigate } from 'react-router-dom';
import { useInstitute } from '../context/InstituteContext';

const ProtectedRoute = ({ children }) => {
  const { instituteData } = useInstitute();

  // Check if user is authenticated
  if (!instituteData.isAuthenticated || !instituteData.accessToken) {
    // Redirect to login if not authenticated
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;

