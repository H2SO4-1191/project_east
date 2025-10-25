import { createContext, useContext, useState, useEffect } from 'react';

const InstituteContext = createContext();

export const useInstitute = () => {
  const context = useContext(InstituteContext);
  if (!context) {
    throw new Error('useInstitute must be used within InstituteProvider');
  }
  return context;
};

export const InstituteProvider = ({ children }) => {
  const [instituteData, setInstituteData] = useState(() => {
    const saved = localStorage.getItem('instituteData');
    return saved ? JSON.parse(saved) : {
      name: 'Al-Noor Educational Institute',
      email: 'info@alnoor.edu',
      subscription: '1year',
      subscriptionLabel: '1 Year',
      paymentMethod: 'credit',
      paymentMethodLabel: 'Credit Card',
      registrationDate: new Date().toISOString(),
    };
  });

  useEffect(() => {
    localStorage.setItem('instituteData', JSON.stringify(instituteData));
  }, [instituteData]);

  const updateInstituteData = (newData) => {
    setInstituteData(prev => ({ ...prev, ...newData }));
  };

  return (
    <InstituteContext.Provider value={{ instituteData, setInstituteData, updateInstituteData }}>
      {children}
    </InstituteContext.Provider>
  );
};

