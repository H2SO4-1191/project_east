import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../providers/theme_provider.dart';
import '../../config/theme.dart';
import '../../services/lecturer_service.dart';
import '../../services/explore_service.dart';
import '../../services/api_service.dart';
import '../../widgets/language_switcher.dart';

class LecturerCoursesScreen extends StatefulWidget {
  const LecturerCoursesScreen({super.key});

  @override
  State<LecturerCoursesScreen> createState() => _LecturerCoursesScreenState();
}

class _LecturerCoursesScreenState extends State<LecturerCoursesScreen> {
  List<dynamic> _courses = [];
  bool _isLoading = true;
  String? _error;
  Map<int, Map<String, dynamic>> _courseProgress = {};
  Map<String, dynamic>? _selectedCourse;

  // Modal states
  bool _showExamModal = false;
  bool _showGradesModal = false;
  bool _showAttendanceModal = false;
  bool _showViewGradesModal = false;
  bool _showViewAttendanceModal = false;

  // Form states
  final _examTitleController = TextEditingController();
  final _examDateController = TextEditingController();
  final _examMaxScoreController = TextEditingController(text: '100');
  bool _isCreatingExam = false;
  List<Map<String, dynamic>> _gradesForm = [];
  bool _isSubmittingGrades = false;
  int? _selectedExamId;
  int? _selectedLectureForAttendance;
  List<dynamic> _courseStudents = [];
  bool _isLoadingStudents = false;
  Map<String, dynamic>? _attendanceForm;
  Map<String, dynamic>? _examGrades;
  Map<String, dynamic>? _lectureAttendance;
  int? _viewLectureNumber;
  bool _isLoadingGrades = false;
  bool _isLoadingAttendance = false;
  bool _isSubmittingAttendance = false;

  @override
  void initState() {
    super.initState();
    _fetchCourses();
  }

  @override
  void dispose() {
    _examTitleController.dispose();
    _examDateController.dispose();
    _examMaxScoreController.dispose();
    super.dispose();
  }

  Future<void> _fetchCourses() async {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final username = authProvider.instituteData['username'];
    
    if (username == null) {
      setState(() {
        _error = 'Username not available';
        _isLoading = false;
      });
      return;
    }

    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final response = await LecturerService.getLecturerCourses(username);
      
      List<dynamic> courses = [];
      final results = response['results'];
      final data = response['data'];
      if (results is List) {
        courses = List<dynamic>.from(results);
      } else if (data is List) {
        courses = List<dynamic>.from(data);
      } else {
        courses = [];
      }

      setState(() {
        _courses = courses;
      });

      // Fetch progress for each course
      for (var course in courses) {
        _fetchCourseProgress(course['id']);
      }
    } catch (e) {
      setState(() {
        _error = e is ApiException ? e.message : 'Failed to load courses';
      });
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  Future<void> _fetchCourseProgress(int courseId) async {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final accessToken = authProvider.instituteData['accessToken'];
    final refreshToken = authProvider.instituteData['refreshToken'];

    try {
      final response = await ExploreService.getCourseProgress(
        courseId: courseId,
        accessToken: accessToken,
        refreshToken: refreshToken,
        onTokenRefreshed: (tokens) {
          authProvider.onTokenRefreshed(tokens);
        },
        onSessionExpired: () {
          authProvider.onSessionExpired();
        },
      );

      if (response['success'] == true) {
        setState(() {
          _courseProgress[courseId] = response;
        });
      }
    } catch (e) {
      // Silently fail for progress
    }
  }

  String? _getImageUrl(dynamic imagePath) {
    if (imagePath == null || imagePath.toString().isEmpty) return null;
    final path = imagePath.toString();
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }
    final baseUrl = ApiService.baseUrl;
    final cleanPath = path.startsWith('/') ? path : '/$path';
    return '$baseUrl$cleanPath';
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final authProvider = Provider.of<AuthProvider>(context);
    final instituteData = authProvider.instituteData;
    final isVerified = instituteData['isVerified'] == true;

    final totalStudents = _courseProgress.values.fold<int>(
      0,
      (sum, progress) => sum + (progress['enrolled_students'] as int? ?? 0),
    );

    return Scaffold(
      backgroundColor: isDark ? AppTheme.navy900 : const Color(0xFFF9FAFB),
      appBar: AppBar(
        elevation: 0,
        backgroundColor: isDark ? AppTheme.navy800 : Colors.white,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => Navigator.pop(context),
        ),
        title: const Text('My Courses'),
        actions: [
          const LanguageSwitcher(),
          IconButton(
            icon: Icon(_isLoading ? Icons.refresh : Icons.refresh),
            onPressed: _isLoading ? null : _fetchCourses,
          ),
          IconButton(
            icon: Icon(isDark ? Icons.wb_sunny : Icons.nightlight_round),
            onPressed: () {
              Provider.of<ThemeProvider>(context, listen: false).toggleTheme();
            },
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.error_outline, size: 64, color: Colors.red),
                      const SizedBox(height: 16),
                      Text(_error!),
                      const SizedBox(height: 16),
                      ElevatedButton(
                        onPressed: _fetchCourses,
                        child: const Text('Retry'),
                      ),
                    ],
                  ),
                )
              : _courses.isEmpty
                  ? Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.book, size: 64, color: Colors.grey),
                          const SizedBox(height: 16),
                          const Text('No Courses Found'),
                          const Text("You don't have any courses assigned yet."),
                        ],
                      ),
                    )
                  : SingleChildScrollView(
                      padding: const EdgeInsets.all(24),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // Welcome Section
                          Container(
                            padding: const EdgeInsets.all(24),
                            decoration: BoxDecoration(
                              gradient: const LinearGradient(
                                colors: [AppTheme.primary600, AppTheme.teal500],
                              ),
                              borderRadius: BorderRadius.circular(16),
                            ),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      'Hello, ${instituteData['firstName'] ?? instituteData['username'] ?? 'Lecturer'}!',
                                      style: const TextStyle(
                                        fontSize: 24,
                                        fontWeight: FontWeight.bold,
                                        color: Colors.white,
                                      ),
                                    ),
                                    const SizedBox(height: 8),
                                    Text(
                                      "You're teaching ${_courses.length} courses",
                                      style: const TextStyle(
                                        color: Colors.white70,
                                      ),
                                    ),
                                    const SizedBox(height: 12),
                                    Container(
                                      padding: const EdgeInsets.symmetric(
                                        horizontal: 12,
                                        vertical: 6,
                                      ),
                                      decoration: BoxDecoration(
                                        color: isVerified
                                            ? Colors.green.withOpacity(0.2)
                                            : Colors.amber.withOpacity(0.2),
                                        borderRadius: BorderRadius.circular(20),
                                      ),
                                      child: Row(
                                        mainAxisSize: MainAxisSize.min,
                                        children: [
                                          Icon(
                                            isVerified
                                                ? Icons.check_circle
                                                : Icons.warning,
                                            size: 16,
                                            color: Colors.white,
                                          ),
                                          const SizedBox(width: 4),
                                          Text(
                                            isVerified ? 'Verified' : 'Pending Verification',
                                            style: const TextStyle(
                                              color: Colors.white,
                                              fontWeight: FontWeight.w600,
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                  ],
                                ),
                                Column(
                                  crossAxisAlignment: CrossAxisAlignment.end,
                                  children: [
                                    const Text(
                                      'Total Students',
                                      style: TextStyle(
                                        color: Colors.white70,
                                        fontSize: 12,
                                      ),
                                    ),
                                    Text(
                                      '$totalStudents',
                                      style: const TextStyle(
                                        fontSize: 32,
                                        fontWeight: FontWeight.bold,
                                        color: Colors.white,
                                      ),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ),

                          const SizedBox(height: 24),

                          // Stats Cards
                          Row(
                            children: [
                              Expanded(
                                child: _buildStatCard(
                                  context,
                                  isDark,
                                  Icons.book,
                                  'Courses',
                                  '${_courses.length}',
                                  Colors.purple,
                                ),
                              ),
                              const SizedBox(width: 16),
                              Expanded(
                                child: _buildStatCard(
                                  context,
                                  isDark,
                                  Icons.people,
                                  'Total Students',
                                  '$totalStudents',
                                  Colors.pink,
                                ),
                              ),
                            ],
                          ),

                          const SizedBox(height: 24),

                          // Course Cards
                          ..._courses.asMap().entries.map((entry) {
                            final index = entry.key;
                            final course = entry.value;
                            final progress = _courseProgress[course['id']] ?? {};

                            return _buildCourseCard(
                              context,
                              isDark,
                              course,
                              progress,
                              isVerified,
                              index,
                            );
                          }),
                        ],
                      ),
                    ),
    );
  }

  Widget _buildStatCard(
    BuildContext context,
    bool isDark,
    IconData icon,
    String label,
    String value,
    Color color,
  ) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: isDark ? AppTheme.navy800 : Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              color: color.withOpacity(0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(icon, color: color, size: 24),
          ),
          const SizedBox(width: 16),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: TextStyle(
                  fontSize: 12,
                  color: Colors.grey.shade600,
                ),
              ),
              Text(
                value,
                style: const TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildCourseCard(
    BuildContext context,
    bool isDark,
    Map<String, dynamic> course,
    Map<String, dynamic> progress,
    bool isVerified,
    int index,
  ) {
    final courseImageUrl = _getImageUrl(course['course_image']);
    final enrolledStudents = progress['enrolled_students'] ?? 0;
    final progressPercentage = progress['progress_percentage'] ?? 0;

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: isDark ? AppTheme.navy800 : Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Course Header
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (courseImageUrl != null)
                  Container(
                    width: 48,
                    height: 48,
                    margin: const EdgeInsets.only(right: 12),
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(12),
                      image: DecorationImage(
                        image: NetworkImage(courseImageUrl),
                        fit: BoxFit.cover,
                      ),
                    ),
                  ),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        course['title'] ?? 'Course',
                        style: const TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 12,
                          vertical: 4,
                        ),
                        decoration: BoxDecoration(
                          color: _getLevelColor(course['level']).withOpacity(0.1),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Text(
                          course['level'] ?? 'beginner',
                          style: TextStyle(
                            color: _getLevelColor(course['level']),
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                Text(
                  '\$${course['price'] ?? '0'}',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: AppTheme.primary600,
                  ),
                ),
              ],
            ),

            const SizedBox(height: 16),

            // Course Info
            Row(
              children: [
                Icon(Icons.people, size: 16, color: Colors.grey),
                const SizedBox(width: 4),
                Text('$enrolledStudents students'),
                const SizedBox(width: 16),
                Icon(Icons.calendar_today, size: 16, color: Colors.grey),
                const SizedBox(width: 4),
                Text('${course['starting_date'] ?? ''} - ${course['ending_date'] ?? ''}'),
              ],
            ),

            const SizedBox(height: 16),

            // Progress Bar
            if (progressPercentage > 0) ...[
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text('Course Progress'),
                  Text(
                    '$progressPercentage%',
                    style: const TextStyle(
                      fontWeight: FontWeight.bold,
                      color: AppTheme.primary600,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              LinearProgressIndicator(
                value: progressPercentage / 100,
                backgroundColor: Colors.grey.shade200,
                valueColor: const AlwaysStoppedAnimation<Color>(
                  AppTheme.primary600,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                'Lectures: ${progress['completed_lectures'] ?? 0}/${progress['total_lectures'] ?? 0}',
                style: TextStyle(
                  fontSize: 12,
                  color: Colors.grey.shade600,
                ),
              ),
              const SizedBox(height: 16),
            ],

            // Action Buttons
            if (isVerified) ...[
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  ElevatedButton.icon(
                    onPressed: () {
                      setState(() {
                        _selectedCourse = course;
                        _showExamModal = true;
                      });
                    },
                    icon: const Icon(Icons.add, size: 18),
                    label: const Text('Create Exam'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.purple,
                      foregroundColor: Colors.white,
                    ),
                  ),
                  ElevatedButton.icon(
                    onPressed: () {
                      setState(() {
                        _selectedCourse = course;
                        _gradesForm = [{'student_id': '', 'score': ''}];
                        _showGradesModal = true;
                      });
                    },
                    icon: const Icon(Icons.edit, size: 18),
                    label: const Text('Submit Grades'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.green,
                      foregroundColor: Colors.white,
                    ),
                  ),
                  ElevatedButton.icon(
                    onPressed: () {
                      setState(() {
                        _selectedCourse = course;
                        _attendanceForm = null;
                        _courseStudents = [];
                        _selectedLectureForAttendance = null;
                        _showAttendanceModal = true;
                      });
                    },
                    icon: const Icon(Icons.checklist, size: 18),
                    label: const Text('Mark Attendance'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.blue,
                      foregroundColor: Colors.white,
                    ),
                  ),
                  ElevatedButton.icon(
                    onPressed: () {
                      setState(() {
                        _selectedCourse = course;
                        _viewLectureNumber = null;
                        _lectureAttendance = null;
                        _showViewAttendanceModal = true;
                      });
                    },
                    icon: const Icon(Icons.visibility, size: 18),
                    label: const Text('View Attendance'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.teal,
                      foregroundColor: Colors.white,
                    ),
                  ),
                ],
              ),
            ] else ...[
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.amber.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.warning, color: Colors.amber, size: 20),
                    const SizedBox(width: 8),
                    const Expanded(
                      child: Text(
                        'Account verification required to manage exams and attendance',
                        style: TextStyle(fontSize: 12),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Color _getLevelColor(String? level) {
    switch (level) {
      case 'beginner':
        return Colors.green;
      case 'intermediate':
        return Colors.blue;
      case 'advanced':
        return Colors.purple;
      default:
        return Colors.grey;
    }
  }

  // Modal builders would go here - keeping it simple for now
  // The full implementation would include all the modals from React
}

