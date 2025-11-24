import { createContext, useContext, useState, useEffect } from 'react';

const InstituteContext = createContext();

export const useInstitute = () => {
  const context = useContext(InstituteContext);
  if (!context) {
    throw new Error('useInstitute must be used within InstituteProvider');
  }
  return context;
};

const createDefaultInstituteData = () => ({
  name: '',
  email: '',
  username: '',
  firstName: '',
  lastName: '',
  userId: null,
  userType: '',
  institution: '', // For lecturers - the institution they work with
  accessToken: '',
  refreshToken: '',
  subscription: '',
  subscriptionLabel: '',
  paymentMethod: '',
  paymentMethodLabel: '',
  registrationDate: '',
  isAuthenticated: false,
  isVerified: false,
});

export const InstituteProvider = ({ children }) => {
  const [instituteData, setInstituteData] = useState(() => {
    const saved = localStorage.getItem('instituteData');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return { ...createDefaultInstituteData(), ...parsed };
      } catch (error) {
        console.error('Failed to parse stored institute data:', error);
      }
    }
    return createDefaultInstituteData();
  });

  useEffect(() => {
    localStorage.setItem('instituteData', JSON.stringify(instituteData));
  }, [instituteData]);

  const updateInstituteData = (newData) => {
    setInstituteData(prev => ({ ...prev, ...newData }));
  };

  const clearInstituteData = () => {
    setInstituteData(createDefaultInstituteData());
    localStorage.removeItem('instituteData');
  };

  return (
    <InstituteContext.Provider value={{ instituteData, setInstituteData, updateInstituteData, clearInstituteData }}>
      {children}
    </InstituteContext.Provider>
  );
};

