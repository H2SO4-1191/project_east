class Schedule {
  final int id;
  final String day;
  final String time;
  final String grade;
  final String subject;
  final String teacher;
  final String room;

  Schedule({
    required this.id,
    required this.day,
    required this.time,
    required this.grade,
    required this.subject,
    required this.teacher,
    required this.room,
  });

  factory Schedule.fromJson(Map<String, dynamic> json) {
    return Schedule(
      id: json['id'],
      day: json['day'],
      time: json['time'],
      grade: json['grade'],
      subject: json['subject'],
      teacher: json['teacher'],
      room: json['room'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'day': day,
      'time': time,
      'grade': grade,
      'subject': subject,
      'teacher': teacher,
      'room': room,
    };
  }
}

