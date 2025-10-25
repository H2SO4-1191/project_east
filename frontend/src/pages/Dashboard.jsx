import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInstitute } from '../context/InstituteContext';
import { studentsData, teachersData, employeesData, scheduleData } from '../data/demoData';

const Dashboard = () => {
  const navigate = useNavigate();
  const { instituteData } = useInstitute();
  const [activeSection, setActiveSection] = useState('students');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleLogout = () => {
    navigate('/');
  };

  const sections = [
    { id: 'students', name: 'Students', icon: '👨‍🎓' },
    { id: 'teachers', name: 'Teachers', icon: '👨‍🏫' },
    { id: 'employees', name: 'Employees', icon: '👔' },
    { id: 'schedule', name: 'Schedule', icon: '📅' },
  ];

  const renderTable = () => {
    switch (activeSection) {
      case 'students':
        return (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white rounded-lg overflow-hidden">
              <thead className="bg-primary-600 text-white">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Roll No</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Name</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Class</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Email</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Phone</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {studentsData.map((student) => (
                  <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm text-gray-900">{student.rollNo}</td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{student.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{student.class}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{student.email}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{student.phone}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

      case 'teachers':
        return (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white rounded-lg overflow-hidden">
              <thead className="bg-primary-600 text-white">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Name</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Subject</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Department</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Email</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Phone</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {teachersData.map((teacher) => (
                  <tr key={teacher.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{teacher.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{teacher.subject}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{teacher.department}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{teacher.email}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{teacher.phone}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

      case 'employees':
        return (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white rounded-lg overflow-hidden">
              <thead className="bg-primary-600 text-white">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Name</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Role</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Department</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Email</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Phone</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {employeesData.map((employee) => (
                  <tr key={employee.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{employee.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{employee.role}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{employee.department}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{employee.email}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{employee.phone}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

      case 'schedule':
        return (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white rounded-lg overflow-hidden">
              <thead className="bg-primary-600 text-white">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Day</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Time</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Class</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Subject</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Teacher</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {scheduleData.map((schedule) => (
                  <tr key={schedule.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{schedule.day}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{schedule.time}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{schedule.class}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{schedule.subject}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{schedule.teacher}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white shadow-xl transform transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="h-full flex flex-col">
          {/* Logo */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-xl font-bold">PE</span>
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-800">Project East</h2>
                <p className="text-xs text-gray-500">Dashboard</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => {
                  setActiveSection(section.id);
                  setIsSidebarOpen(false);
                }}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                  activeSection === section.id
                    ? 'bg-primary-600 text-white shadow-md'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span className="text-2xl">{section.icon}</span>
                <span className="font-medium">{section.name}</span>
              </button>
            ))}
          </nav>

          {/* Logout Button */}
          <div className="p-4 border-t border-gray-200">
            <button
              onClick={handleLogout}
              className="w-full flex items-center space-x-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {/* Mobile menu button */}
                <button
                  onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                  className="lg:hidden p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>

                <div>
                  <h1 className="text-2xl font-bold text-gray-800">{instituteData.name}</h1>
                  <p className="text-sm text-gray-600">{instituteData.email}</p>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="hidden md:block text-right">
                  <p className="text-sm font-medium text-gray-700">Welcome Admin</p>
                  <p className="text-xs text-gray-500">Institute Portal</p>
                </div>
                <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold">
                    {instituteData.name.charAt(0)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 p-6 overflow-auto">
          <div className="max-w-7xl mx-auto">
            {/* Section Header */}
            <div className="mb-6">
              <h2 className="text-3xl font-bold text-gray-800 capitalize">
                {activeSection}
              </h2>
              <p className="text-gray-600 mt-1">
                Manage and view all {activeSection} information
              </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Total Students</p>
                    <p className="text-3xl font-bold text-gray-800 mt-1">{studentsData.length}</p>
                  </div>
                  <div className="text-4xl">👨‍🎓</div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Total Teachers</p>
                    <p className="text-3xl font-bold text-gray-800 mt-1">{teachersData.length}</p>
                  </div>
                  <div className="text-4xl">👨‍🏫</div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-purple-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Total Employees</p>
                    <p className="text-3xl font-bold text-gray-800 mt-1">{employeesData.length}</p>
                  </div>
                  <div className="text-4xl">👔</div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-orange-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Classes</p>
                    <p className="text-3xl font-bold text-gray-800 mt-1">{scheduleData.length}</p>
                  </div>
                  <div className="text-4xl">📅</div>
                </div>
              </div>
            </div>

            {/* Data Table */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              {renderTable()}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;


