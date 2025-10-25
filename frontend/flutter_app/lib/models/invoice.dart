class Invoice {
  final String id;
  final String studentName;
  final double amount;
  final String dueDate;
  final String status;
  final String? paymentMethod;
  final String? paidDate;

  Invoice({
    required this.id,
    required this.studentName,
    required this.amount,
    required this.dueDate,
    required this.status,
    this.paymentMethod,
    this.paidDate,
  });

  factory Invoice.fromJson(Map<String, dynamic> json) {
    return Invoice(
      id: json['id'],
      studentName: json['studentName'],
      amount: json['amount'].toDouble(),
      dueDate: json['dueDate'],
      status: json['status'],
      paymentMethod: json['paymentMethod'],
      paidDate: json['paidDate'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'studentName': studentName,
      'amount': amount,
      'dueDate': dueDate,
      'status': status,
      'paymentMethod': paymentMethod,
      'paidDate': paidDate,
    };
  }
}

