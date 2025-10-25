import '../models/student.dart';
import '../models/teacher.dart';
import '../models/employee.dart';
import '../models/schedule.dart';
import '../models/invoice.dart';

class DemoData {
  static final List<Student> students = [
    Student(id: 'STU001', name: 'Ahmed Hassan', grade: 'Grade 10-A', enrollmentDate: '2024-01-15', status: 'Active', email: 'ahmed.hassan@student.com', phone: '+1 234-567-8901', gpa: 3.8),
    Student(id: 'STU002', name: 'Fatima Ali', grade: 'Grade 9-B', enrollmentDate: '2024-01-16', status: 'Active', email: 'fatima.ali@student.com', phone: '+1 234-567-8902', gpa: 3.9),
    Student(id: 'STU003', name: 'Omar Ibrahim', grade: 'Grade 11-A', enrollmentDate: '2024-01-10', status: 'Active', email: 'omar.ibrahim@student.com', phone: '+1 234-567-8903', gpa: 3.7),
    Student(id: 'STU004', name: 'Aisha Mohammed', grade: 'Grade 10-B', enrollmentDate: '2024-02-01', status: 'Active', email: 'aisha.mohammed@student.com', phone: '+1 234-567-8904', gpa: 4.0),
    Student(id: 'STU005', name: 'Yusuf Ahmed', grade: 'Grade 9-A', enrollmentDate: '2024-01-20', status: 'Active', email: 'yusuf.ahmed@student.com', phone: '+1 234-567-8905', gpa: 3.5),
    Student(id: 'STU006', name: 'Layla Hassan', grade: 'Grade 11-B', enrollmentDate: '2024-02-05', status: 'Active', email: 'layla.hassan@student.com', phone: '+1 234-567-8906', gpa: 3.6),
    Student(id: 'STU007', name: 'Khalid Rahman', grade: 'Grade 10-A', enrollmentDate: '2024-01-25', status: 'Active', email: 'khalid.rahman@student.com', phone: '+1 234-567-8907', gpa: 3.9),
    Student(id: 'STU008', name: 'Noor Fatima', grade: 'Grade 9-B', enrollmentDate: '2024-02-10', status: 'Active', email: 'noor.fatima@student.com', phone: '+1 234-567-8908', gpa: 3.8),
    Student(id: 'STU009', name: 'Ali Mahmoud', grade: 'Grade 11-A', enrollmentDate: '2024-01-12', status: 'Active', email: 'ali.mahmoud@student.com', phone: '+1 234-567-8909', gpa: 3.7),
    Student(id: 'STU010', name: 'Zainab Yousuf', grade: 'Grade 10-B', enrollmentDate: '2024-01-18', status: 'Active', email: 'zainab.yousuf@student.com', phone: '+1 234-567-8910', gpa: 4.0),
    Student(id: 'STU011', name: 'Ibrahim Saeed', grade: 'Grade 9-A', enrollmentDate: '2024-02-15', status: 'Inactive', email: 'ibrahim.saeed@student.com', phone: '+1 234-567-8911', gpa: 3.4),
    Student(id: 'STU012', name: 'Mariam Khan', grade: 'Grade 11-B', enrollmentDate: '2024-01-08', status: 'Active', email: 'mariam.khan@student.com', phone: '+1 234-567-8912', gpa: 3.9),
    Student(id: 'STU013', name: 'Hassan Ali', grade: 'Grade 10-A', enrollmentDate: '2024-02-20', status: 'Active', email: 'hassan.ali@student.com', phone: '+1 234-567-8913', gpa: 3.6),
    Student(id: 'STU014', name: 'Huda Ibrahim', grade: 'Grade 9-B', enrollmentDate: '2024-01-22', status: 'Active', email: 'huda.ibrahim@student.com', phone: '+1 234-567-8914', gpa: 3.8),
    Student(id: 'STU015', name: 'Tariq Ahmed', grade: 'Grade 11-A', enrollmentDate: '2024-01-30', status: 'Active', email: 'tariq.ahmed@student.com', phone: '+1 234-567-8915', gpa: 3.7),
    Student(id: 'STU016', name: 'Salma Hassan', grade: 'Grade 10-B', enrollmentDate: '2024-02-08', status: 'Active', email: 'salma.hassan@student.com', phone: '+1 234-567-8916', gpa: 4.0),
    Student(id: 'STU017', name: 'Bilal Mohammed', grade: 'Grade 9-A', enrollmentDate: '2024-01-28', status: 'Active', email: 'bilal.mohammed@student.com', phone: '+1 234-567-8917', gpa: 3.5),
    Student(id: 'STU018', name: 'Amina Yousuf', grade: 'Grade 11-B', enrollmentDate: '2024-02-12', status: 'Active', email: 'amina.yousuf@student.com', phone: '+1 234-567-8918', gpa: 3.9),
    Student(id: 'STU019', name: 'Hamza Rahman', grade: 'Grade 10-A', enrollmentDate: '2024-01-14', status: 'Active', email: 'hamza.rahman@student.com', phone: '+1 234-567-8919', gpa: 3.6),
    Student(id: 'STU020', name: 'Yasmin Ali', grade: 'Grade 9-B', enrollmentDate: '2024-02-18', status: 'Active', email: 'yasmin.ali@student.com', phone: '+1 234-567-8920', gpa: 3.8),
  ];

  static final List<Teacher> teachers = [
    Teacher(id: 'TCH001', name: 'Dr. Sarah Khan', subject: 'Mathematics', department: 'Science', email: 'sarah.khan@alnoor.edu', phone: '+1 234-567-9001', status: 'Active', experience: '12 years'),
    Teacher(id: 'TCH002', name: 'Prof. Abdullah Rahman', subject: 'Physics', department: 'Science', email: 'abdullah.rahman@alnoor.edu', phone: '+1 234-567-9002', status: 'Active', experience: '15 years'),
    Teacher(id: 'TCH003', name: 'Ms. Maryam Yousuf', subject: 'English Literature', department: 'Languages', email: 'maryam.yousuf@alnoor.edu', phone: '+1 234-567-9003', status: 'Active', experience: '8 years'),
    Teacher(id: 'TCH004', name: 'Mr. Hassan Malik', subject: 'Computer Science', department: 'Technology', email: 'hassan.malik@alnoor.edu', phone: '+1 234-567-9004', status: 'Active', experience: '10 years'),
    Teacher(id: 'TCH005', name: 'Dr. Zainab Ahmed', subject: 'Chemistry', department: 'Science', email: 'zainab.ahmed@alnoor.edu', phone: '+1 234-567-9005', status: 'Active', experience: '14 years'),
    Teacher(id: 'TCH006', name: 'Mr. Omar Siddiqui', subject: 'Biology', department: 'Science', email: 'omar.siddiqui@alnoor.edu', phone: '+1 234-567-9006', status: 'Active', experience: '9 years'),
    Teacher(id: 'TCH007', name: 'Ms. Fatima Bashir', subject: 'History', department: 'Social Studies', email: 'fatima.bashir@alnoor.edu', phone: '+1 234-567-9007', status: 'On Leave', experience: '7 years'),
    Teacher(id: 'TCH008', name: 'Mr. Ahmed Hussain', subject: 'Physical Education', department: 'Sports', email: 'ahmed.hussain@alnoor.edu', phone: '+1 234-567-9008', status: 'Active', experience: '6 years'),
  ];

  static final List<Employee> employees = [
    Employee(id: 'EMP001', name: 'Ibrahim Siddiqui', role: 'Administrator', department: 'Administration', email: 'ibrahim.s@alnoor.edu', phone: '+1 234-567-7001', status: 'Active'),
    Employee(id: 'EMP002', name: 'Amina Hassan', role: 'Accountant', department: 'Finance', email: 'amina.hassan@alnoor.edu', phone: '+1 234-567-7002', status: 'Active'),
    Employee(id: 'EMP003', name: 'Khalid Mahmood', role: 'IT Support', department: 'Technology', email: 'khalid.m@alnoor.edu', phone: '+1 234-567-7003', status: 'Active'),
    Employee(id: 'EMP004', name: 'Noor Fatima', role: 'Librarian', department: 'Library', email: 'noor.fatima@alnoor.edu', phone: '+1 234-567-7004', status: 'Active'),
    Employee(id: 'EMP005', name: 'Ali Raza', role: 'Maintenance Staff', department: 'Operations', email: 'ali.raza@alnoor.edu', phone: '+1 234-567-7005', status: 'Active'),
    Employee(id: 'EMP006', name: 'Zainab Malik', role: 'Receptionist', department: 'Administration', email: 'zainab.malik@alnoor.edu', phone: '+1 234-567-7006', status: 'Active'),
  ];

  static final List<Schedule> schedules = [
    Schedule(id: 1, day: 'Monday', time: '08:00 - 09:00', grade: 'Grade 10-A', subject: 'Mathematics', teacher: 'Dr. Sarah Khan', room: 'Room 101'),
    Schedule(id: 2, day: 'Monday', time: '09:00 - 10:00', grade: 'Grade 11-A', subject: 'Physics', teacher: 'Prof. Abdullah Rahman', room: 'Lab 201'),
    Schedule(id: 3, day: 'Monday', time: '10:00 - 11:00', grade: 'Grade 9-B', subject: 'English', teacher: 'Ms. Maryam Yousuf', room: 'Room 105'),
    Schedule(id: 4, day: 'Tuesday', time: '08:00 - 09:00', grade: 'Grade 9-B', subject: 'English Literature', teacher: 'Ms. Maryam Yousuf', room: 'Room 105'),
    Schedule(id: 5, day: 'Tuesday', time: '10:00 - 11:00', grade: 'Grade 10-B', subject: 'Computer Science', teacher: 'Mr. Hassan Malik', room: 'Lab 301'),
    Schedule(id: 6, day: 'Wednesday', time: '09:00 - 10:00', grade: 'Grade 11-A', subject: 'Chemistry', teacher: 'Dr. Zainab Ahmed', room: 'Lab 202'),
    Schedule(id: 7, day: 'Wednesday', time: '11:00 - 12:00', grade: 'Grade 10-A', subject: 'Biology', teacher: 'Mr. Omar Siddiqui', room: 'Lab 203'),
    Schedule(id: 8, day: 'Thursday', time: '08:00 - 09:00', grade: 'Grade 9-A', subject: 'Mathematics', teacher: 'Dr. Sarah Khan', room: 'Room 101'),
    Schedule(id: 9, day: 'Thursday', time: '10:00 - 11:00', grade: 'Grade 11-B', subject: 'History', teacher: 'Ms. Fatima Bashir', room: 'Room 108'),
    Schedule(id: 10, day: 'Friday', time: '08:00 - 09:00', grade: 'Grade 10-A', subject: 'Physics', teacher: 'Prof. Abdullah Rahman', room: 'Lab 201'),
    Schedule(id: 11, day: 'Friday', time: '09:00 - 10:00', grade: 'Grade 9-A', subject: 'Physical Education', teacher: 'Mr. Ahmed Hussain', room: 'Gym'),
    Schedule(id: 12, day: 'Friday', time: '11:00 - 12:00', grade: 'Grade 11-A', subject: 'Computer Science', teacher: 'Mr. Hassan Malik', room: 'Lab 301'),
  ];

  static final List<Invoice> invoices = [
    Invoice(id: 'INV001', studentName: 'Ahmed Hassan', amount: 1200, dueDate: '2024-03-01', status: 'Paid', paymentMethod: 'Credit Card', paidDate: '2024-02-28'),
    Invoice(id: 'INV002', studentName: 'Fatima Ali', amount: 1200, dueDate: '2024-03-01', status: 'Paid', paymentMethod: 'Bank Transfer', paidDate: '2024-02-25'),
    Invoice(id: 'INV003', studentName: 'Omar Ibrahim', amount: 1200, dueDate: '2024-03-01', status: 'Pending'),
    Invoice(id: 'INV004', studentName: 'Aisha Mohammed', amount: 1200, dueDate: '2024-03-01', status: 'Paid', paymentMethod: 'PayPal', paidDate: '2024-02-27'),
    Invoice(id: 'INV005', studentName: 'Yusuf Ahmed', amount: 1200, dueDate: '2024-03-01', status: 'Paid', paymentMethod: 'Credit Card', paidDate: '2024-02-26'),
    Invoice(id: 'INV006', studentName: 'Layla Hassan', amount: 1200, dueDate: '2024-03-01', status: 'Overdue'),
    Invoice(id: 'INV007', studentName: 'Khalid Rahman', amount: 1200, dueDate: '2024-03-01', status: 'Paid', paymentMethod: 'Bank Transfer', paidDate: '2024-02-29'),
    Invoice(id: 'INV008', studentName: 'Noor Fatima', amount: 1200, dueDate: '2024-03-01', status: 'Paid', paymentMethod: 'Credit Card', paidDate: '2024-02-24'),
    Invoice(id: 'INV009', studentName: 'Ali Mahmoud', amount: 1200, dueDate: '2024-03-01', status: 'Pending'),
    Invoice(id: 'INV010', studentName: 'Zainab Yousuf', amount: 1200, dueDate: '2024-03-01', status: 'Paid', paymentMethod: 'PayPal', paidDate: '2024-02-23'),
  ];

  static final List<Map<String, dynamic>> revenueData = [
    {'month': 'Jan', 'revenue': 24000, 'expenses': 18000},
    {'month': 'Feb', 'revenue': 28000, 'expenses': 19000},
    {'month': 'Mar', 'revenue': 32000, 'expenses': 20000},
    {'month': 'Apr', 'revenue': 29000, 'expenses': 21000},
    {'month': 'May', 'revenue': 35000, 'expenses': 22000},
    {'month': 'Jun', 'revenue': 38000, 'expenses': 23000},
  ];

  static final List<Map<String, dynamic>> activityData = [
    {'day': 'Mon', 'students': 185, 'teachers': 42},
    {'day': 'Tue', 'students': 192, 'teachers': 45},
    {'day': 'Wed', 'students': 188, 'teachers': 43},
    {'day': 'Thu', 'students': 195, 'teachers': 46},
    {'day': 'Fri', 'students': 198, 'teachers': 47},
  ];
}

