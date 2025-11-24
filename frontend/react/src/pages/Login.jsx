import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInstitute } from '../context/InstituteContext';

const Login = () => {
  const navigate = useNavigate();
  const { setInstituteData } = useInstitute();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Hardcoded demo credentials
    if (formData.email === 'demo@east.edu' && formData.password === '12345') {
      setInstituteData({
        name: 'Baghdad Technical University',
        email: 'demo@east.edu',
      });
      navigate('/dashboard');
    } else {
      setError('Invalid credentials. Use demo@east.edu / 12345');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo and Title */}
        <div className="text-center mb-12">
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center text-primary-600 hover:text-primary-700 mb-6 transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Home
          </button>
          <div className="mb-4">
            <div className="w-20 h-20 bg-primary-600 rounded-2xl mx-auto flex items-center justify-center shadow-lg">
              <span className="text-white text-4xl font-bold">PE</span>
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Welcome Back</h1>
          <p className="text-gray-600">Login to your institution account</p>
        </div>

        {/* Login Form Card */}
        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-gray-700 font-medium mb-2">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="input-field"
                placeholder="Enter your email"
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
                placeholder="Enter your password"
                required
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg text-sm">
              <strong>Demo Credentials:</strong><br />
              Email: demo@east.edu<br />
              Password: 12345
            </div>

            <button type="submit" className="btn-primary w-full">
              Login
            </button>
          </form>
        </div>

        <p className="text-center text-gray-600 text-sm mt-6">
          Don't have an account?{' '}
          <button
            onClick={() => navigate('/')}
            className="text-primary-600 hover:text-primary-700 font-semibold"
          >
            Sign up here
          </button>
        </p>
      </div>
    </div>
  );
};

export default Login;


