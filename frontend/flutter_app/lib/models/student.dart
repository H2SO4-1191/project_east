class Student {
  final String id;
  final String name;
  final String grade;
  final String enrollmentDate;
  final String status;
  final String email;
  final String phone;
  final double gpa;

  Student({
    required this.id,
    required this.name,
    required this.grade,
    required this.enrollmentDate,
    required this.status,
    required this.email,
    required this.phone,
    required this.gpa,
  });

  factory Student.fromJson(Map<String, dynamic> json) {
    return Student(
      id: json['id'],
      name: json['name'],
      grade: json['grade'],
      enrollmentDate: json['enrollmentDate'],
      status: json['status'],
      email: json['email'],
      phone: json['phone'],
      gpa: json['gpa'].toDouble(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'grade': grade,
      'enrollmentDate': enrollmentDate,
      'status': status,
      'email': email,
      'phone': phone,
      'gpa': gpa,
    };
  }
}

