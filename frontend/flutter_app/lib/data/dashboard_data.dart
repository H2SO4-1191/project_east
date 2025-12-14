class DashboardStudent {
  final int id;
  final String name;
  final String classGrade;
  final String rollNo;
  final String email;
  final String phone;

  DashboardStudent({
    required this.id,
    required this.name,
    required this.classGrade,
    required this.rollNo,
    required this.email,
    required this.phone,
  });
}

class DashboardTeacher {
  final int id;
  final String name;
  final String subject;
  final String department;
  final String email;
  final String phone;

  DashboardTeacher({
    required this.id,
    required this.name,
    required this.subject,
    required this.department,
    required this.email,
    required this.phone,
  });
}

class DashboardEmployee {
  final int id;
  final String name;
  final String role;
  final String department;
  final String email;
  final String phone;

  DashboardEmployee({
    required this.id,
    required this.name,
    required this.role,
    required this.department,
    required this.email,
    required this.phone,
  });
}

class DashboardSchedule {
  final int id;
  final String day;
  final String time;
  final String classGrade;
  final String subject;
  final String teacher;

  DashboardSchedule({
    required this.id,
    required this.day,
    required this.time,
    required this.classGrade,
    required this.subject,
    required this.teacher,
  });
}

class DashboardData {
  static final List<DashboardStudent> students = [
    DashboardStudent(
      id: 1,
      name: 'Ahmed Hassan',
      classGrade: 'Grade 10-A',
      rollNo: '2024001',
      email: 'ahmed.hassan@student.com',
      phone: '+1 234-567-8901',
    ),
    DashboardStudent(
      id: 2,
      name: 'Fatima Ali',
      classGrade: 'Grade 9-B',
      rollNo: '2024002',
      email: 'fatima.ali@student.com',
      phone: '+1 234-567-8902',
    ),
    DashboardStudent(
      id: 3,
      name: 'Omar Ibrahim',
      classGrade: 'Grade 11-A',
      rollNo: '2024003',
      email: 'omar.ibrahim@student.com',
      phone: '+1 234-567-8903',
    ),
    DashboardStudent(
      id: 4,
      name: 'Aisha Mohammed',
      classGrade: 'Grade 10-B',
      rollNo: '2024004',
      email: 'aisha.mohammed@student.com',
      phone: '+1 234-567-8904',
    ),
    DashboardStudent(
      id: 5,
      name: 'Yusuf Ahmed',
      classGrade: 'Grade 9-A',
      rollNo: '2024005',
      email: 'yusuf.ahmed@student.com',
      phone: '+1 234-567-8905',
    ),
  ];

  static final List<DashboardTeacher> teachers = [
    DashboardTeacher(
      id: 1,
      name: 'Dr. Sarah Khan',
      subject: 'Mathematics',
      department: 'Science',
      email: 'sarah.khan@alnoor.edu',
      phone: '+1 234-567-9001',
    ),
    DashboardTeacher(
      id: 2,
      name: 'Prof. Abdullah Rahman',
      subject: 'Physics',
      department: 'Science',
      email: 'abdullah.rahman@alnoor.edu',
      phone: '+1 234-567-9002',
    ),
    DashboardTeacher(
      id: 3,
      name: 'Ms. Maryam Yousuf',
      subject: 'English Literature',
      department: 'Languages',
      email: 'maryam.yousuf@alnoor.edu',
      phone: '+1 234-567-9003',
    ),
    DashboardTeacher(
      id: 4,
      name: 'Mr. Hassan Malik',
      subject: 'Computer Science',
      department: 'Technology',
      email: 'hassan.malik@alnoor.edu',
      phone: '+1 234-567-9004',
    ),
    DashboardTeacher(
      id: 5,
      name: 'Dr. Zainab Ahmed',
      subject: 'Chemistry',
      department: 'Science',
      email: 'zainab.ahmed@alnoor.edu',
      phone: '+1 234-567-9005',
    ),
  ];

  static final List<DashboardEmployee> employees = [
    DashboardEmployee(
      id: 1,
      name: 'Ibrahim Siddiqui',
      role: 'Administrator',
      department: 'Administration',
      email: 'ibrahim.s@alnoor.edu',
      phone: '+1 234-567-7001',
    ),
    DashboardEmployee(
      id: 2,
      name: 'Amina Hassan',
      role: 'Accountant',
      department: 'Finance',
      email: 'amina.hassan@alnoor.edu',
      phone: '+1 234-567-7002',
    ),
    DashboardEmployee(
      id: 3,
      name: 'Khalid Mahmood',
      role: 'IT Support',
      department: 'Technology',
      email: 'khalid.m@alnoor.edu',
      phone: '+1 234-567-7003',
    ),
    DashboardEmployee(
      id: 4,
      name: 'Noor Fatima',
      role: 'Librarian',
      department: 'Library',
      email: 'noor.fatima@alnoor.edu',
      phone: '+1 234-567-7004',
    ),
    DashboardEmployee(
      id: 5,
      name: 'Ali Raza',
      role: 'Maintenance Staff',
      department: 'Operations',
      email: 'ali.raza@alnoor.edu',
      phone: '+1 234-567-7005',
    ),
  ];

  static final List<DashboardSchedule> schedule = [
    DashboardSchedule(
      id: 1,
      day: 'Monday',
      time: '08:00 - 09:00',
      classGrade: 'Grade 10-A',
      subject: 'Mathematics',
      teacher: 'Dr. Sarah Khan',
    ),
    DashboardSchedule(
      id: 2,
      day: 'Monday',
      time: '09:00 - 10:00',
      classGrade: 'Grade 11-A',
      subject: 'Physics',
      teacher: 'Prof. Abdullah Rahman',
    ),
    DashboardSchedule(
      id: 3,
      day: 'Tuesday',
      time: '08:00 - 09:00',
      classGrade: 'Grade 9-B',
      subject: 'English Literature',
      teacher: 'Ms. Maryam Yousuf',
    ),
    DashboardSchedule(
      id: 4,
      day: 'Tuesday',
      time: '10:00 - 11:00',
      classGrade: 'Grade 10-B',
      subject: 'Computer Science',
      teacher: 'Mr. Hassan Malik',
    ),
    DashboardSchedule(
      id: 5,
      day: 'Wednesday',
      time: '09:00 - 10:00',
      classGrade: 'Grade 11-A',
      subject: 'Chemistry',
      teacher: 'Dr. Zainab Ahmed',
    ),
    DashboardSchedule(
      id: 6,
      day: 'Thursday',
      time: '08:00 - 09:00',
      classGrade: 'Grade 9-A',
      subject: 'Mathematics',
      teacher: 'Dr. Sarah Khan',
    ),
    DashboardSchedule(
      id: 7,
      day: 'Friday',
      time: '10:00 - 11:00',
      classGrade: 'Grade 10-A',
      subject: 'Physics',
      teacher: 'Prof. Abdullah Rahman',
    ),
  ];
}

