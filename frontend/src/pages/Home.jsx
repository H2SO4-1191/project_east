import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInstitute } from '../context/InstituteContext';

const Home = () => {
  const navigate = useNavigate();
  const { setInstituteData } = useInstitute();
  const [showSignInOptions, setShowSignInOptions] = useState(false);
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);
  const [formData, setFormData] = useState({
    instituteName: '',
    email: '',
    password: '',
  });

  const handleSignInClick = () => {
    setShowSignInOptions(true);
  };

  const handleInstitutionClick = () => {
    setShowSignInOptions(false);
    setShowRegistrationForm(true);
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleRegistrationSubmit = (e) => {
    e.preventDefault();
    if (formData.instituteName && formData.email && formData.password) {
      setInstituteData({
        name: formData.instituteName,
        email: formData.email,
      });
      navigate('/dashboard');
    }
  };

  const handleBack = () => {
    setShowSignInOptions(false);
    setShowRegistrationForm(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo and Title */}
        <div className="text-center mb-12 animate-fade-in">
          <div className="mb-4">
            <div className="w-20 h-20 bg-primary-600 rounded-2xl mx-auto flex items-center justify-center shadow-lg">
              <span className="text-white text-4xl font-bold">PE</span>
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Project East</h1>
          <p className="text-gray-600">Educational Institute Management System</p>
        </div>

        {/* Main Content Card */}
        <div className="card">
          {!showSignInOptions && !showRegistrationForm && (
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold text-center text-gray-800 mb-6">
                Welcome Back
              </h2>
              <button
                onClick={() => navigate('/login')}
                className="btn-primary w-full"
              >
                Login
              </button>
              <button
                onClick={handleSignInClick}
                className="btn-secondary w-full"
              >
                Sign In
              </button>
            </div>
          )}

          {showSignInOptions && !showRegistrationForm && (
            <div className="space-y-4">
              <div className="flex items-center mb-6">
                <button
                  onClick={handleBack}
                  className="text-gray-600 hover:text-gray-800 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <h2 className="text-2xl font-semibold text-gray-800 ml-4">Select Account Type</h2>
              </div>
              
              <button
                className="w-full px-6 py-4 bg-gray-100 text-gray-400 rounded-lg font-semibold cursor-not-allowed"
                disabled
              >
                Student (Coming Soon)
              </button>
              <button
                className="w-full px-6 py-4 bg-gray-100 text-gray-400 rounded-lg font-semibold cursor-not-allowed"
                disabled
              >
                Teacher (Coming Soon)
              </button>
              <button
                onClick={handleInstitutionClick}
                className="btn-primary w-full"
              >
                Institution
              </button>
            </div>
          )}

          {showRegistrationForm && (
            <div>
              <div className="flex items-center mb-6">
                <button
                  onClick={handleBack}
                  className="text-gray-600 hover:text-gray-800 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <h2 className="text-2xl font-semibold text-gray-800 ml-4">Institution Registration</h2>
              </div>

              <form onSubmit={handleRegistrationSubmit} className="space-y-4">
                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    Institute Name
                  </label>
                  <input
                    type="text"
                    name="instituteName"
                    value={formData.instituteName}
                    onChange={handleInputChange}
                    className="input-field"
                    placeholder="Enter institute name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="input-field"
                    placeholder="Enter email address"
                    required
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="input-field"
                    placeholder="Enter password"
                    required
                  />
                </div>

                <button type="submit" className="btn-primary w-full mt-6">
                  Register Institute
                </button>
              </form>
            </div>
          )}
        </div>

        <p className="text-center text-gray-600 text-sm mt-6">
          © 2025 Project East. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default Home;


