import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../providers/theme_provider.dart';
import '../../config/theme.dart';
import '../../services/student_service.dart';
import '../../services/explore_service.dart';
import '../../services/api_service.dart';
import '../../widgets/language_switcher.dart';

class StudentCoursesScreen extends StatefulWidget {
  const StudentCoursesScreen({super.key});

  @override
  State<StudentCoursesScreen> createState() => _StudentCoursesScreenState();
}

class _StudentCoursesScreenState extends State<StudentCoursesScreen> {
  List<dynamic> _courses = [];
  bool _isLoading = true;
  String? _error;
  Map<int, Map<String, dynamic>> _attendanceData = {};
  Map<int, Map<String, dynamic>> _gradesData = {};
  Map<int, Map<String, dynamic>> _progressData = {};
  Map<int, bool> _loadingAttendance = {};
  Map<int, bool> _loadingGrades = {};
  Map<int, bool> _loadingProgress = {};

  // Modal states
  bool _showAttendanceModal = false;
  bool _showGradesModal = false;
  bool _showProgressModal = false;
  Map<String, dynamic>? _selectedCourse;

  @override
  void initState() {
    super.initState();
    _fetchCourses();
  }

  Future<void> _fetchCourses() async {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final username = authProvider.instituteData['username'];
    
    if (username == null) {
      setState(() {
        _error = 'Username not found';
        _isLoading = false;
      });
      return;
    }

    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final response = await StudentService.getStudentCourses(username);
      
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

  Future<void> _fetchAttendance(int courseId) async {
    if (_loadingAttendance[courseId] == true) return;

    setState(() {
      _loadingAttendance[courseId] = true;
    });

    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final accessToken = authProvider.instituteData['accessToken'];
    final refreshToken = authProvider.instituteData['refreshToken'];

    try {
      final response = await StudentService.getStudentCourseAttendance(
        accessToken: accessToken,
        courseId: courseId,
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
          _attendanceData[courseId] = response;
        });
      }
    } catch (e) {
      // Handle error silently or show snackbar
    } finally {
      setState(() {
        _loadingAttendance[courseId] = false;
      });
    }
  }

  Future<void> _fetchGrades(int courseId) async {
    if (_loadingGrades[courseId] == true) return;

    setState(() {
      _loadingGrades[courseId] = true;
    });

    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final accessToken = authProvider.instituteData['accessToken'];
    final refreshToken = authProvider.instituteData['refreshToken'];

    try {
      final response = await StudentService.getStudentCourseGrades(
        accessToken: accessToken,
        courseId: courseId,
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
          _gradesData[courseId] = response;
        });
      }
    } catch (e) {
      // Handle error silently or show snackbar
    } finally {
      setState(() {
        _loadingGrades[courseId] = false;
      });
    }
  }

  Future<void> _fetchProgress(int courseId) async {
    if (_loadingProgress[courseId] == true) return;

    setState(() {
      _loadingProgress[courseId] = true;
    });

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
          _progressData[courseId] = response;
        });
      }
    } catch (e) {
      // Handle error silently
    } finally {
      setState(() {
        _loadingProgress[courseId] = false;
      });
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

  String _formatDate(String? dateString) {
    if (dateString == null || dateString.isEmpty) return 'N/A';
    try {
      final date = DateTime.parse(dateString);
      return '${date.month}/${date.day}/${date.year}';
    } catch (e) {
      return dateString;
    }
  }

  Color _getLevelColor(String? level) {
    switch (level?.toLowerCase()) {
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

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final authProvider = Provider.of<AuthProvider>(context);
    final instituteData = authProvider.instituteData;

    final totalCourses = _courses.length;
    final totalPrice = _courses.fold<double>(
      0,
      (sum, course) => sum + (double.tryParse(course['price']?.toString() ?? '0') ?? 0),
    );
    final uniqueLevels = _courses.map((c) => c['level']).toSet().length;

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
          // Verification Status Badge
          Consumer<AuthProvider>(
            builder: (context, authProvider, _) {
              final isVerified = authProvider.instituteData['isVerified'] == true;
              return Container(
                margin: const EdgeInsets.only(right: 8),
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: isVerified
                      ? Colors.green.withOpacity(isDark ? 0.3 : 0.2)
                      : Colors.orange.withOpacity(isDark ? 0.3 : 0.2),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      isVerified ? Icons.verified : Icons.pending,
                      size: 16,
                      color: isVerified ? Colors.green.shade700 : Colors.orange.shade700,
                    ),
                    const SizedBox(width: 4),
                    Text(
                      isVerified ? 'Verified' : 'Pending',
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: isVerified ? Colors.green.shade700 : Colors.orange.shade700,
                      ),
                    ),
                  ],
                ),
              );
            },
          ),
          const LanguageSwitcher(),
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
                      const Icon(Icons.error_outline, size: 64, color: Colors.red),
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
                            colors: [AppTheme.teal500, AppTheme.primary600],
                          ),
                          borderRadius: BorderRadius.circular(16),
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    'Hello, ${instituteData['firstName'] ?? instituteData['username'] ?? 'Student'}!',
                                    style: const TextStyle(
                                      fontSize: 24,
                                      fontWeight: FontWeight.bold,
                                      color: Colors.white,
                                    ),
                                  ),
                                  const SizedBox(height: 8),
                                  Text(
                                    totalCourses == 0
                                        ? "You're not enrolled in any courses yet"
                                        : "You're enrolled in $totalCourses ${totalCourses == 1 ? 'course' : 'courses'}",
                                    style: const TextStyle(
                                      color: Colors.white70,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            if (totalCourses > 0)
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.end,
                                children: [
                                  const Text(
                                    'Total Courses',
                                    style: TextStyle(
                                      color: Colors.white70,
                                      fontSize: 12,
                                    ),
                                  ),
                                  Text(
                                    '$totalCourses',
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

                      if (_error != null) ...[
                        const SizedBox(height: 16),
                        Container(
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: Colors.red.withOpacity(0.1),
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: Colors.red.shade300),
                          ),
                          child: Text(
                            _error!,
                            style: const TextStyle(color: Colors.red),
                          ),
                        ),
                      ],

                      if (totalCourses > 0) ...[
                        const SizedBox(height: 24),
                        // Stats Cards
                        Row(
                          children: [
                            Expanded(
                              child: _buildStatCard(
                                context,
                                isDark,
                                Icons.book,
                                'Enrolled Courses',
                                '$totalCourses',
                                Colors.blue,
                              ),
                            ),
                            const SizedBox(width: 16),
                            Expanded(
                              child: _buildStatCard(
                                context,
                                isDark,
                                Icons.attach_money,
                                'Total Price',
                                '\$${totalPrice.toStringAsFixed(2)}',
                                Colors.green,
                              ),
                            ),
                            const SizedBox(width: 16),
                            Expanded(
                              child: _buildStatCard(
                                context,
                                isDark,
                                Icons.school,
                                'Levels',
                                '$uniqueLevels',
                                Colors.purple,
                              ),
                            ),
                          ],
                        ),
                      ],

                      const SizedBox(height: 24),

                      // Course Cards
                      if (totalCourses == 0)
                        _buildEmptyState(context, isDark)
                      else
                        ..._courses.asMap().entries.map((entry) {
                          final index = entry.key;
                          final course = entry.value;
                          return _buildCourseCard(
                            context,
                            isDark,
                            course,
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
      padding: const EdgeInsets.all(16),
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
          const SizedBox(width: 12),
          Expanded(
            child: Column(
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
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState(BuildContext context, bool isDark) {
    return Container(
      padding: const EdgeInsets.all(48),
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
      child: Column(
        children: [
          Icon(Icons.book, size: 64, color: Colors.grey.shade400),
          const SizedBox(height: 16),
          const Text(
            'No Courses Yet',
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            "You haven't enrolled in any courses yet. Explore available courses and enroll to get started!",
            textAlign: TextAlign.center,
            style: TextStyle(
              color: Colors.grey.shade600,
            ),
          ),
          const SizedBox(height: 24),
          ElevatedButton(
            onPressed: () {
              Navigator.pushNamed(context, '/explore');
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTheme.primary600,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
            ),
            child: const Text('Explore Courses'),
          ),
        ],
      ),
    );
  }

  Widget _buildCourseCard(
    BuildContext context,
    bool isDark,
    Map<String, dynamic> course,
    int index,
  ) {
    final courseImageUrl = _getImageUrl(course['course_image']);
    final levelColor = _getLevelColor(course['level']);

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
      child: Column(
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Course Image
              if (courseImageUrl != null)
                Container(
                  width: 120,
                  height: 120,
                  decoration: BoxDecoration(
                    borderRadius: const BorderRadius.only(
                      topLeft: Radius.circular(16),
                      bottomLeft: Radius.circular(16),
                    ),
                    image: DecorationImage(
                      image: NetworkImage(courseImageUrl),
                      fit: BoxFit.cover,
                    ),
                  ),
                ),
              // Course Details
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Expanded(
                            child: Text(
                              course['title'] ?? 'Course',
                              style: const TextStyle(
                                fontSize: 20,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                          if (course['level'] != null)
                            Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 12,
                                vertical: 6,
                              ),
                              decoration: BoxDecoration(
                                color: levelColor.withOpacity(0.1),
                                borderRadius: BorderRadius.circular(20),
                              ),
                              child: Text(
                                course['level'],
                                style: TextStyle(
                                  color: levelColor,
                                  fontSize: 12,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ),
                        ],
                      ),
                      if (course['about'] != null) ...[
                        const SizedBox(height: 8),
                        Text(
                          course['about'],
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                          style: TextStyle(
                            fontSize: 14,
                            color: Colors.grey.shade600,
                          ),
                        ),
                      ],
                      const SizedBox(height: 16),
                      Row(
                        children: [
                          if (course['starting_date'] != null)
                            Expanded(
                              child: Row(
                                children: [
                                  Icon(Icons.calendar_today,
                                      size: 16, color: Colors.blue),
                                  const SizedBox(width: 4),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          'Start Date',
                                          style: TextStyle(
                                            fontSize: 10,
                                            color: Colors.grey.shade600,
                                          ),
                                        ),
                                        Text(
                                          _formatDate(course['starting_date']),
                                          style: const TextStyle(
                                            fontSize: 12,
                                            fontWeight: FontWeight.w600,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          if (course['ending_date'] != null)
                            Expanded(
                              child: Row(
                                children: [
                                  Icon(Icons.calendar_today,
                                      size: 16, color: Colors.red),
                                  const SizedBox(width: 4),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          'End Date',
                                          style: TextStyle(
                                            fontSize: 10,
                                            color: Colors.grey.shade600,
                                          ),
                                        ),
                                        Text(
                                          _formatDate(course['ending_date']),
                                          style: const TextStyle(
                                            fontSize: 12,
                                            fontWeight: FontWeight.w600,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ],
                              ),
                            ),
                        ],
                      ),
                      const SizedBox(height: 16),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.end,
                        children: [
                          if (course['price'] != null)
                            Text(
                              '\$${course['price']}',
                              style: TextStyle(
                                fontSize: 20,
                                fontWeight: FontWeight.bold,
                                color: AppTheme.primary600,
                              ),
                            ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
          const Divider(),
          Padding(
            padding: const EdgeInsets.all(16),
            child: Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                ElevatedButton.icon(
                  onPressed: () async {
                    setState(() {
                      _selectedCourse = course;
                    });
                    if (!_attendanceData.containsKey(course['id'])) {
                      await _fetchAttendance(course['id'] as int);
                    }
                    if (mounted) {
                      showDialog(
                        context: context,
                        barrierDismissible: true,
                        builder: (context) => _buildAttendanceModal(
                          context,
                          Theme.of(context).brightness == Brightness.dark,
                        ),
                      );
                    }
                  },
                  icon: const Icon(Icons.checklist, size: 18),
                  label: const Text('View Attendance'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.teal500,
                    foregroundColor: Colors.white,
                  ),
                ),
                ElevatedButton.icon(
                  onPressed: () async {
                    setState(() {
                      _selectedCourse = course;
                    });
                    if (!_gradesData.containsKey(course['id'])) {
                      await _fetchGrades(course['id'] as int);
                    }
                    if (mounted) {
                      showDialog(
                        context: context,
                        barrierDismissible: true,
                        builder: (context) => _buildGradesModal(
                          context,
                          Theme.of(context).brightness == Brightness.dark,
                        ),
                      );
                    }
                  },
                  icon: const Icon(Icons.emoji_events, size: 18),
                  label: const Text('View Grades'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.purple,
                    foregroundColor: Colors.white,
                  ),
                ),
                ElevatedButton.icon(
                  onPressed: () async {
                    setState(() {
                      _selectedCourse = course;
                    });
                    if (!_progressData.containsKey(course['id'])) {
                      await _fetchProgress(course['id'] as int);
                    }
                    if (mounted) {
                      showDialog(
                        context: context,
                        barrierDismissible: true,
                        builder: (context) => _buildProgressModal(
                          context,
                          Theme.of(context).brightness == Brightness.dark,
                        ),
                      );
                    }
                  },
                  icon: const Icon(Icons.trending_up, size: 18),
                  label: const Text('View Progress'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.blue,
                    foregroundColor: Colors.white,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAttendanceModal(BuildContext context, bool isDark) {
    final courseId = _selectedCourse!['id'] as int;
    final attendance = _attendanceData[courseId];
    final isLoading = _loadingAttendance[courseId] == true;

    return Dialog(
      backgroundColor: Colors.transparent,
      child: Container(
        constraints: const BoxConstraints(maxWidth: 600, maxHeight: 600),
        decoration: BoxDecoration(
          color: isDark ? AppTheme.navy800 : Colors.white,
          borderRadius: BorderRadius.circular(20),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Header
            Container(
              padding: const EdgeInsets.all(20),
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  colors: [AppTheme.teal500, AppTheme.primary600],
                ),
                borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
              ),
              child: Row(
                children: [
                  Container(
                    width: 48,
                    height: 48,
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.2),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Icon(Icons.checklist, color: Colors.white, size: 24),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Attendance Records',
                          style: TextStyle(
                            fontSize: 20,
                            fontWeight: FontWeight.bold,
                            color: Colors.white,
                          ),
                        ),
                        Text(
                          _selectedCourse!['title'] ?? 'Course',
                          style: const TextStyle(
                            color: Colors.white70,
                            fontSize: 14,
                          ),
                        ),
                      ],
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close, color: Colors.white),
                    onPressed: () {
                      setState(() {
                        _showAttendanceModal = false;
                        _selectedCourse = null;
                      });
                    },
                  ),
                ],
              ),
            ),
            // Content
            Expanded(
              child: isLoading
                  ? const Center(child: CircularProgressIndicator())
                  : attendance == null
                      ? const Center(child: Text('No attendance data available'))
                      : SingleChildScrollView(
                          padding: const EdgeInsets.all(20),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              // Summary Stats
                              Row(
                                children: [
                                  Expanded(
                                    child: _buildStatBox(
                                      'Total Lectures',
                                      '${attendance['total_lectures'] ?? 0}',
                                    ),
                                  ),
                                  const SizedBox(width: 12),
                                  Expanded(
                                    child: _buildStatBox(
                                      'Attendance Rate',
                                      '${((attendance['attendance_percentage'] ?? 0) as num).toStringAsFixed(1)}%',
                                      color: _getAttendancePercentageColor(
                                        attendance['attendance_percentage'] ?? 0,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 20),
                              // Progress Bar
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                    children: [
                                      const Text('Attendance Progress'),
                                      Text(
                                        '${((attendance['attendance_percentage'] ?? 0) as num).toStringAsFixed(1)}%',
                                        style: TextStyle(
                                          fontWeight: FontWeight.bold,
                                          color: _getAttendancePercentageColor(
                                            attendance['attendance_percentage'] ?? 0,
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 8),
                                  LinearProgressIndicator(
                                    value: ((attendance['attendance_percentage'] ?? 0) as num) / 100,
                                    backgroundColor: Colors.grey.shade200,
                                    valueColor: AlwaysStoppedAnimation<Color>(
                                      _getAttendancePercentageColor(
                                        attendance['attendance_percentage'] ?? 0,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 20),
                              const Text(
                                'Lecture Records',
                                style: TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              const SizedBox(height: 12),
                              if (attendance['records'] != null &&
                                  (attendance['records'] as List).isNotEmpty)
                                ...(attendance['records'] as List).map((record) {
                                  return _buildAttendanceRecord(record);
                                }).toList()
                              else
                                const Center(
                                  child: Padding(
                                    padding: EdgeInsets.all(32),
                                    child: Text('No attendance records yet'),
                                  ),
                                ),
                            ],
                          ),
                        ),
            ),
            // Footer
            Padding(
              padding: const EdgeInsets.all(16),
              child: SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () {
                    setState(() {
                      _showAttendanceModal = false;
                      _selectedCourse = null;
                    });
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.grey.shade200,
                    foregroundColor: Colors.grey.shade800,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                  ),
                  child: const Text('Close'),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildGradesModal(BuildContext context, bool isDark) {
    final courseId = _selectedCourse!['id'] as int;
    final grades = _gradesData[courseId];
    final isLoading = _loadingGrades[courseId] == true;

    return Dialog(
      backgroundColor: Colors.transparent,
      child: Container(
        constraints: const BoxConstraints(maxWidth: 600, maxHeight: 600),
        decoration: BoxDecoration(
          color: isDark ? AppTheme.navy800 : Colors.white,
          borderRadius: BorderRadius.circular(20),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Header
            Container(
              padding: const EdgeInsets.all(20),
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  colors: [Colors.purple, Colors.indigo],
                ),
                borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
              ),
              child: Row(
                children: [
                  Container(
                    width: 48,
                    height: 48,
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.2),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Icon(Icons.emoji_events, color: Colors.white, size: 24),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Grades Report',
                          style: TextStyle(
                            fontSize: 20,
                            fontWeight: FontWeight.bold,
                            color: Colors.white,
                          ),
                        ),
                        Text(
                          _selectedCourse!['title'] ?? 'Course',
                          style: const TextStyle(
                            color: Colors.white70,
                            fontSize: 14,
                          ),
                        ),
                      ],
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close, color: Colors.white),
                    onPressed: () {
                      setState(() {
                        _showGradesModal = false;
                        _selectedCourse = null;
                      });
                    },
                  ),
                ],
              ),
            ),
            // Content
            Expanded(
              child: isLoading
                  ? const Center(child: CircularProgressIndicator())
                  : grades == null
                      ? const Center(child: Text('No grades data available'))
                      : SingleChildScrollView(
                          padding: const EdgeInsets.all(20),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              // Course Name
                              Container(
                                padding: const EdgeInsets.all(16),
                                decoration: BoxDecoration(
                                  color: Colors.purple.withOpacity(0.1),
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                child: Row(
                                  children: [
                                    const Icon(Icons.book, color: Colors.purple),
                                    const SizedBox(width: 12),
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          const Text(
                                            'Course',
                                            style: TextStyle(
                                              fontSize: 12,
                                              color: Colors.grey,
                                            ),
                                          ),
                                          Text(
                                            grades['course'] ?? _selectedCourse!['title'] ?? 'Course',
                                            style: const TextStyle(
                                              fontWeight: FontWeight.w600,
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              const SizedBox(height: 20),
                              const Text(
                                'Exam Results',
                                style: TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              const SizedBox(height: 12),
                              if (grades['grades'] != null &&
                                  (grades['grades'] as List).isNotEmpty)
                                ...(grades['grades'] as List).map((grade) {
                                  return _buildGradeRecord(grade);
                                }).toList()
                              else
                                const Center(
                                  child: Padding(
                                    padding: EdgeInsets.all(32),
                                    child: Text('No grades recorded yet'),
                                  ),
                                ),
                            ],
                          ),
                        ),
            ),
            // Footer
            Padding(
              padding: const EdgeInsets.all(16),
              child: SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () {
                    setState(() {
                      _showGradesModal = false;
                      _selectedCourse = null;
                    });
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.grey.shade200,
                    foregroundColor: Colors.grey.shade800,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                  ),
                  child: const Text('Close'),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildProgressModal(BuildContext context, bool isDark) {
    final courseId = _selectedCourse!['id'] as int;
    final progress = _progressData[courseId];
    final isLoading = _loadingProgress[courseId] == true;

    return Dialog(
      backgroundColor: Colors.transparent,
      child: Container(
        constraints: const BoxConstraints(maxWidth: 600, maxHeight: 600),
        decoration: BoxDecoration(
          color: isDark ? AppTheme.navy800 : Colors.white,
          borderRadius: BorderRadius.circular(20),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Header
            Container(
              padding: const EdgeInsets.all(20),
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  colors: [Colors.blue, Colors.indigo],
                ),
                borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
              ),
              child: Row(
                children: [
                  Container(
                    width: 48,
                    height: 48,
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.2),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Icon(Icons.trending_up, color: Colors.white, size: 24),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Course Progress',
                          style: TextStyle(
                            fontSize: 20,
                            fontWeight: FontWeight.bold,
                            color: Colors.white,
                          ),
                        ),
                        Text(
                          _selectedCourse!['title'] ?? 'Course',
                          style: const TextStyle(
                            color: Colors.white70,
                            fontSize: 14,
                          ),
                        ),
                      ],
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close, color: Colors.white),
                    onPressed: () {
                      setState(() {
                        _showProgressModal = false;
                        _selectedCourse = null;
                      });
                    },
                  ),
                ],
              ),
            ),
            // Content
            Expanded(
              child: isLoading
                  ? const Center(child: CircularProgressIndicator())
                  : progress == null
                      ? const Center(child: Text('No progress data available'))
                      : SingleChildScrollView(
                          padding: const EdgeInsets.all(20),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              // Progress Stats
                              Row(
                                children: [
                                  Expanded(
                                    child: _buildStatBox(
                                      'Completed Lectures',
                                      '${progress['completed_lectures'] ?? 0}',
                                    ),
                                  ),
                                  const SizedBox(width: 12),
                                  Expanded(
                                    child: _buildStatBox(
                                      'Total Lectures',
                                      '${progress['total_lectures'] ?? 0}',
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 20),
                              // Progress Bar
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                    children: [
                                      const Text('Course Progress'),
                                      Text(
                                        '${progress['progress_percentage'] ?? 0}%',
                                        style: const TextStyle(
                                          fontWeight: FontWeight.bold,
                                          color: AppTheme.primary600,
                                        ),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 8),
                                  LinearProgressIndicator(
                                    value: ((progress['progress_percentage'] ?? 0) as num) / 100,
                                    backgroundColor: Colors.grey.shade200,
                                    valueColor: const AlwaysStoppedAnimation<Color>(
                                      AppTheme.primary600,
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 20),
                              if (progress['enrolled_students'] != null)
                                _buildStatBox(
                                  'Enrolled Students',
                                  '${progress['enrolled_students']}',
                                ),
                            ],
                          ),
                        ),
            ),
            // Footer
            Padding(
              padding: const EdgeInsets.all(16),
              child: SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () {
                    setState(() {
                      _showProgressModal = false;
                      _selectedCourse = null;
                    });
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.grey.shade200,
                    foregroundColor: Colors.grey.shade800,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                  ),
                  child: const Text('Close'),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatBox(String label, String value, {Color? color}) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.grey.shade100,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        children: [
          Text(
            label,
            style: TextStyle(
              fontSize: 12,
              color: Colors.grey.shade600,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            value,
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.bold,
              color: color,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAttendanceRecord(Map<String, dynamic> record) {
    IconData icon;
    Color color;
    String label;

    switch ((record['status'] as String? ?? '').toLowerCase()) {
      case 'present':
        icon = Icons.check_circle;
        color = Colors.green;
        label = 'Present';
        break;
      case 'absent':
        icon = Icons.cancel;
        color = Colors.red;
        label = 'Absent';
        break;
      case 'late':
        icon = Icons.warning;
        color = Colors.amber;
        label = 'Late';
        break;
      default:
        icon = Icons.help;
        color = Colors.grey;
        label = 'Unknown';
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.grey.shade50,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: Colors.grey.shade200,
              borderRadius: BorderRadius.circular(10),
            ),
            child: Center(
              child: Text(
                '${record['lecture_number'] ?? ''}',
                style: const TextStyle(
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              'Lecture ${record['lecture_number'] ?? ''}',
              style: const TextStyle(
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            decoration: BoxDecoration(
              color: color.withOpacity(0.1),
              borderRadius: BorderRadius.circular(20),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(icon, color: color, size: 16),
                const SizedBox(width: 4),
                Text(
                  label,
                  style: TextStyle(
                    color: color,
                    fontWeight: FontWeight.w600,
                    fontSize: 12,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildGradeRecord(Map<String, dynamic> grade) {
    final score = grade['score'] as num? ?? 0;
    final maxScore = grade['max_score'] as num? ?? 100;
    final percentage = (score / maxScore) * 100;
    Color gradeColor;

    if (percentage >= 85) {
      gradeColor = Colors.green;
    } else if (percentage >= 70) {
      gradeColor = Colors.blue;
    } else if (percentage >= 50) {
      gradeColor = Colors.amber;
    } else {
      gradeColor = Colors.red;
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.grey.shade50,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  grade['exam_title'] ?? 'Exam',
                  style: const TextStyle(
                    fontWeight: FontWeight.w600,
                  ),
                ),
                if (grade['exam_date'] != null)
                  Text(
                    _formatDate(grade['exam_date']),
                    style: TextStyle(
                      fontSize: 12,
                      color: Colors.grey.shade600,
                    ),
                  ),
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                '$score / $maxScore',
                style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                  color: gradeColor,
                ),
              ),
              Text(
                '${percentage.toStringAsFixed(1)}%',
                style: TextStyle(
                  fontSize: 12,
                  color: Colors.grey.shade600,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Color _getAttendancePercentageColor(num percentage) {
    if (percentage >= 80) return Colors.green;
    if (percentage >= 60) return Colors.amber;
    return Colors.red;
  }
}

