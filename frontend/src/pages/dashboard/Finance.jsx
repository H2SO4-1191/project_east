import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { FaDollarSign, FaFileInvoiceDollar, FaCreditCard } from 'react-icons/fa';
import Card from '../../components/Card';
import AnimatedCounter from '../../components/AnimatedCounter';
import { invoicesData, paymentMethodsData, revenueData } from '../../data/enhancedDemoData';

const Finance = () => {
  const COLORS = ['#3b82f6', '#14b8a6', '#f59e0b', '#ef4444'];
  
  const totalRevenue = invoicesData
    .filter(i => i.status === 'Paid')
    .reduce((sum, i) => sum + i.amount, 0);
    
  const pendingAmount = invoicesData
    .filter(i => i.status === 'Pending' || i.status === 'Overdue')
    .reduce((sum, i) => sum + i.amount, 0);

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">Finance</h2>
        <p className="text-gray-600 dark:text-gray-400">Financial overview and management</p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card delay={0.1} className="relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm font-medium mb-2">Total Revenue</p>
              <p className="text-4xl font-bold text-green-600">
                $<AnimatedCounter value={totalRevenue} duration={2} />
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-gradient-to-br from-green-500 to-green-600 bg-opacity-10">
              <FaDollarSign className="w-8 h-8 text-green-600" />
            </div>
          </div>
        </Card>

        <Card delay={0.2} className="relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm font-medium mb-2">Pending Payments</p>
              <p className="text-4xl font-bold text-orange-600">
                $<AnimatedCounter value={pendingAmount} duration={2} />
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 bg-opacity-10">
              <FaFileInvoiceDollar className="w-8 h-8 text-orange-600" />
            </div>
          </div>
        </Card>

        <Card delay={0.3} className="relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm font-medium mb-2">Total Invoices</p>
              <p className="text-4xl font-bold text-blue-600">
                <AnimatedCounter value={invoicesData.length} duration={2} />
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 bg-opacity-10">
              <FaCreditCard className="w-8 h-8 text-blue-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card delay={0.4}>
          <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
            Payment Methods Distribution
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={paymentMethodsData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {paymentMethodsData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        <Card delay={0.5}>
          <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
            Monthly Revenue
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={revenueData}>
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
              <Bar dataKey="revenue" fill="#3b82f6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Invoices Table */}
      <Card delay={0.6}>
        <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
          Recent Invoices
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gradient-to-r from-gold-600 to-gold-700 dark:from-gold-700 dark:to-gold-800 text-white">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold">Invoice ID</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Student</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Amount</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Due Date</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Status</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Payment Method</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-navy-700">
              {invoicesData.map((invoice, index) => (
                <motion.tr
                  key={invoice.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ backgroundColor: 'rgba(245, 158, 11, 0.05)' }}
                  className="hover:shadow-md transition-all"
                >
                  <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                    {invoice.id}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                    {invoice.studentName}
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white">
                    ${invoice.amount.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                    {new Date(invoice.dueDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        invoice.status === 'Paid'
                          ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
                          : invoice.status === 'Pending'
                          ? 'bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300'
                          : 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300'
                      }`}
                    >
                      {invoice.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                    {invoice.paymentMethod || '-'}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default Finance;

