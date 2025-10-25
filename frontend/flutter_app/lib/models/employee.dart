class Employee {
  final String id;
  final String name;
  final String role;
  final String department;
  final String email;
  final String phone;
  final String status;

  Employee({
    required this.id,
    required this.name,
    required this.role,
    required this.department,
    required this.email,
    required this.phone,
    required this.status,
  });

  factory Employee.fromJson(Map<String, dynamic> json) {
    return Employee(
      id: json['id'],
      name: json['name'],
      role: json['role'],
      department: json['department'],
      email: json['email'],
      phone: json['phone'],
      status: json['status'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'role': role,
      'department': department,
      'email': email,
      'phone': phone,
      'status': status,
    };
  }
}

