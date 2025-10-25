import { motion } from 'framer-motion';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { FaUsers, FaChalkboardTeacher, FaBriefcase, FaDollarSign } from 'react-icons/fa';
import Card from '../../components/Card';
import AnimatedCounter from '../../components/AnimatedCounter';
import { studentsData, teachersData, employeesData, activityData, revenueData } from '../../data/enhancedDemoData';

const StatCard = ({ title, value, icon: Icon, color, delay }) => (
  <Card delay={delay} className="relative overflow-hidden">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-gray-600 dark:text-gray-400 text-sm font-medium mb-2">{title}</p>
        <p className={`text-4xl font-bold ${color}`}>
          <AnimatedCounter value={value} duration={2} />
        </p>
      </div>
      <div className={`p-4 rounded-2xl bg-gradient-to-br ${color.replace('text-', 'from-')} ${color.replace('text-', 'to-')}-600 bg-opacity-10`}>
        <Icon className={`w-8 h-8 ${color}`} />
      </div>
    </div>
    <motion.div
      className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${color.replace('text-', 'from-')} ${color.replace('text-', 'to-')}-600`}
      initial={{ scaleX: 0 }}
      animate={{ scaleX: 1 }}
      transition={{ duration: 1, delay: delay + 0.5 }}
    />
  </Card>
);

const Overview = () => {
  const stats = [
    {
      title: 'Total Students',
      value: studentsData.length,
      icon: FaUsers,
      color: 'text-blue-600',
      delay: 0,
    },
    {
      title: 'Active Teachers',
      value: teachersData.filter(t => t.status === 'Active').length,
      icon: FaChalkboardTeacher,
      color: 'text-teal-600',
      delay: 0.1,
    },
    {
      title: 'Total Employees',
      value: employeesData.length,
      icon: FaBriefcase,
      color: 'text-purple-600',
      delay: 0.2,
    },
    {
      title: 'Monthly Revenue',
      value: 38000,
      icon: FaDollarSign,
      color: 'text-gold-600',
      delay: 0.3,
    },
  ];

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">Overview</h2>
        <p className="text-gray-600 dark:text-gray-400">Welcome to your dashboard</p>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activity Chart */}
        <Card delay={0.4}>
          <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
            Weekly Activity
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={activityData}>
              <defs>
                <linearGradient id="colorStudents" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorTeachers" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#14b8a6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-navy-700" />
              <XAxis dataKey="day" className="text-gray-600 dark:text-gray-400" />
              <YAxis className="text-gray-600 dark:text-gray-400" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.9)', 
                  border: 'none', 
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                }} 
              />
              <Legend />
              <Area type="monotone" dataKey="students" stroke="#3b82f6" fillOpacity={1} fill="url(#colorStudents)" />
              <Area type="monotone" dataKey="teachers" stroke="#14b8a6" fillOpacity={1} fill="url(#colorTeachers)" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        {/* Revenue Chart */}
        <Card delay={0.5}>
          <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
            Revenue vs Expenses
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-navy-700" />
              <XAxis dataKey="month" className="text-gray-600 dark:text-gray-400" />
              <YAxis className="text-gray-600 dark:text-gray-400" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.9)', 
                  border: 'none', 
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                }} 
              />
              <Legend />
              <Line type="monotone" dataKey="revenue" stroke="#f59e0b" strokeWidth={3} dot={{ r: 5 }} />
              <Line type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={3} dot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card delay={0.6}>
        <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
          Recent Activity
        </h3>
        <div className="space-y-4">
          {[
            { action: 'New student enrolled', name: 'Yasmin Ali', time: '2 hours ago', color: 'text-blue-600' },
            { action: 'Teacher updated profile', name: 'Dr. Sarah Khan', time: '4 hours ago', color: 'text-teal-600' },
            { action: 'Payment received', name: 'Ahmed Hassan', time: '6 hours ago', color: 'text-gold-600' },
            { action: 'Schedule updated', name: 'Grade 10-A', time: '8 hours ago', color: 'text-purple-600' },
          ].map((activity, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7 + index * 0.1 }}
              className="flex items-center justify-between p-4 bg-gray-50 dark:bg-navy-900 rounded-lg hover:bg-gray-100 dark:hover:bg-navy-800 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${activity.color.replace('text-', 'bg-')}`} />
                <div>
                  <p className="text-gray-800 dark:text-white font-medium">{activity.action}</p>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">{activity.name}</p>
                </div>
              </div>
              <span className="text-gray-500 dark:text-gray-500 text-sm">{activity.time}</span>
            </motion.div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default Overview;

