class Teacher {
  final String id;
  final String name;
  final String subject;
  final String department;
  final String email;
  final String phone;
  final String status;
  final String experience;

  Teacher({
    required this.id,
    required this.name,
    required this.subject,
    required this.department,
    required this.email,
    required this.phone,
    required this.status,
    required this.experience,
  });

  factory Teacher.fromJson(Map<String, dynamic> json) {
    return Teacher(
      id: json['id'],
      name: json['name'],
      subject: json['subject'],
      department: json['department'],
      email: json['email'],
      phone: json['phone'],
      status: json['status'],
      experience: json['experience'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'subject': subject,
      'department': department,
      'email': email,
      'phone': phone,
      'status': status,
      'experience': experience,
    };
  }
}

