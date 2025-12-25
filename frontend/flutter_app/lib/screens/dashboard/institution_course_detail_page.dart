import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../config/theme.dart';
import '../../providers/auth_provider.dart';
import '../../services/api_service.dart';
import '../../services/explore_service.dart';
import '../../widgets/modern_bottom_nav.dart';
import '../../utils/navigation_helper.dart';

class InstitutionCourseDetailPage extends StatefulWidget {
  final int courseId;

  const InstitutionCourseDetailPage({
    super.key,
    required this.courseId,
  });

  @override
  State<InstitutionCourseDetailPage> createState() =>
      _InstitutionCourseDetailPageState();
}

class _InstitutionCourseDetailPageState
    extends State<InstitutionCourseDetailPage>
    with TickerProviderStateMixin {
  Map<String, dynamic>? _courseDetails;
  List<dynamic> _exams = [];
  List<dynamic> _lectures = [];
  bool _isLoadingCourse = true;
  bool _isLoadingExams = false;
  bool _isLoadingLectures = false;
  String? _error;
  int _selectedTab = 0; // 0: Info, 1: Exams, 2: Attendance

  // Animation controllers
  late AnimationController _tabController;
  List<AnimationController> _examControllers = [];
  List<AnimationController> _attendanceControllers = [];

  @override
  void initState() {
    super.initState();
    _tabController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 300),
    );
    _loadCourseDetails();
    _loadExams();
    _loadLectures();
  }

  @override
  void dispose() {
    _tabController.dispose();
    for (var controller in _examControllers) {
      controller.dispose();
    }
    for (var controller in _attendanceControllers) {
      controller.dispose();
    }
    super.dispose();
  }

  Future<void> _loadCourseDetails() async {
    setState(() {
      _isLoadingCourse = true;
      _error = null;
    });

    try {
      final response = await ExploreService.getCourseDetails(widget.courseId);
      if (response['success'] == true && response['data'] != null) {
        setState(() {
          _courseDetails = response['data'];
          _isLoadingCourse = false;
        });
      } else {
        setState(() {
          _error = 'Failed to load course details';
          _isLoadingCourse = false;
        });
      }
    } catch (e) {
      setState(() {
        _error = e is ApiException ? e.message : 'Failed to load course details';
        _isLoadingCourse = false;
      });
    }
  }

  Future<void> _loadLectures() async {
    setState(() {
      _isLoadingLectures = true;
    });

    // Generate lecture numbers based on course details
    // This is a placeholder - you may need to adjust based on your API
    if (_courseDetails != null) {
      final totalLectures = _courseDetails!['total_lectures'] ?? 10;
      final lectures = List.generate(
        totalLectures as int,
        (index) => {'lecture_number': index + 1},
      );
      
      setState(() {
        _lectures = lectures;
        _isLoadingLectures = false;
      });

      // Initialize attendance animation controllers
      _attendanceControllers.clear();
      for (int i = 0; i < lectures.length; i++) {
        final controller = AnimationController(
          vsync: this,
          duration: const Duration(milliseconds: 600),
        );
        _attendanceControllers.add(controller);

        Future.delayed(Duration(milliseconds: 50 + (i * 50)), () {
          if (mounted && controller.value == 0) {
            controller.forward();
          }
        });
      }
    } else {
      setState(() {
        _isLoadingLectures = false;
      });
    }
  }

  Future<void> _loadExams() async {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final accessToken = authProvider.instituteData['accessToken'];
    final refreshToken = authProvider.instituteData['refreshToken'];

    if (accessToken == null) return;

    setState(() {
      _isLoadingExams = true;
    });

    try {
      final response = await ApiService.getCourseExams(
        courseId: widget.courseId,
        accessToken: accessToken,
        refreshToken: refreshToken,
        onTokenRefreshed: (tokens) {
          if (mounted) {
            authProvider.onTokenRefreshed(tokens);
          }
        },
        onSessionExpired: () {
          if (mounted) {
            authProvider.onSessionExpired();
          }
        },
      );

      if (mounted) {
        if (response['success'] == true && response['exams'] != null) {
          final exams = List.from(response['exams']);
          setState(() {
            _exams = exams;
            _isLoadingExams = false;
          });

          // Initialize exam animation controllers
          _examControllers.clear();
          for (int i = 0; i < exams.length; i++) {
            final controller = AnimationController(
              vsync: this,
              duration: const Duration(milliseconds: 600),
            );
            _examControllers.add(controller);

            Future.delayed(Duration(milliseconds: 100 + (i * 100)), () {
              if (mounted && controller.value == 0) {
                controller.forward();
              }
            });
          }
        } else {
          setState(() {
            _exams = [];
            _isLoadingExams = false;
          });
        }
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isLoadingExams = false;
        });
      }
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

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: isDark ? AppTheme.navy900 : const Color(0xFFF9FAFB),
      appBar: AppBar(
        elevation: 0,
        backgroundColor: isDark ? AppTheme.navy800 : Colors.white,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          _courseDetails?['title'] ?? 'Course Details',
          style: const TextStyle(fontSize: 18),
        ),
      ),
      bottomNavigationBar: ModernBottomNav(
        currentIndex: 1,
        onTap: (index) {
          NavigationHelper.handleBottomNavTap(context, index);
        },
      ),
      body: _isLoadingCourse
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        Icons.error_outline,
                        size: 64,
                        color: Colors.red.shade400,
                      ),
                      const SizedBox(height: 16),
                      Text(_error!),
                      const SizedBox(height: 16),
                      ElevatedButton(
                        onPressed: _loadCourseDetails,
                        child: const Text('Retry'),
                      ),
                    ],
                  ),
                )
              : _courseDetails == null
                  ? const Center(child: Text('Course not found'))
                  : Column(
                      children: [
                        // Tab Bar
                        Container(
                          color: isDark ? AppTheme.navy800 : Colors.white,
                          child: Row(
                            children: [
                              _buildTabButton('Info', 0, isDark),
                              _buildTabButton('Exams', 1, isDark),
                              _buildTabButton('Attendance', 2, isDark),
                            ],
                          ),
                        ),
                        // Content
                        Expanded(
                          child: IndexedStack(
                            index: _selectedTab,
                            children: [
                              _buildCourseInfoTab(isDark),
                              _buildExamsTab(isDark),
                              _buildAttendanceTab(isDark),
                            ],
                          ),
                        ),
                      ],
                    ),
    );
  }

  Widget _buildTabButton(String label, int index, bool isDark) {
    final isSelected = _selectedTab == index;
    return Expanded(
      child: InkWell(
        onTap: () {
          setState(() {
            _selectedTab = index;
          });
        },
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 16),
          decoration: BoxDecoration(
            border: Border(
              bottom: BorderSide(
                color: isSelected
                    ? AppTheme.primary600
                    : Colors.transparent,
                width: 3,
              ),
            ),
          ),
          child: Text(
            label,
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 16,
              fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
              color: isSelected
                  ? AppTheme.primary600
                  : (isDark ? Colors.white70 : Colors.grey.shade600),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildCourseInfoTab(bool isDark) {
    if (_courseDetails == null) return const SizedBox.shrink();

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Course Image
          _buildCourseImageHeader(isDark),
          const SizedBox(height: 24),

          // Course Overview
          _buildInfoCard(
            'Course Information',
            Icons.info_outline_rounded,
            [
              _buildInfoRow('Title', _courseDetails!['title'] ?? 'N/A', isDark),
              _buildInfoRow('Level', _courseDetails!['level'] ?? 'N/A', isDark),
              _buildInfoRow('Price', _formatPrice(_courseDetails!['price']), isDark),
              if (_courseDetails!['about'] != null)
                _buildInfoRow('About', _courseDetails!['about'], isDark, isMultiline: true),
            ],
            isDark,
          ),
          const SizedBox(height: 16),

          // Schedule
          if (_courseDetails!['days'] != null || _courseDetails!['start_time'] != null)
            _buildInfoCard(
              'Schedule',
              Icons.calendar_today_rounded,
              [
                if (_courseDetails!['days'] != null)
                  _buildInfoRow('Days', (_courseDetails!['days'] as List).join(', '), isDark),
                if (_courseDetails!['start_time'] != null && _courseDetails!['end_time'] != null)
                  _buildInfoRow(
                    'Time',
                    '${_courseDetails!['start_time']} - ${_courseDetails!['end_time']}',
                    isDark,
                  ),
              ],
              isDark,
            ),
          const SizedBox(height: 16),

          // Dates
          _buildInfoCard(
            'Dates',
            Icons.event_rounded,
            [
              if (_courseDetails!['starting_date'] != null)
                _buildInfoRow('Start Date', _formatDate(_courseDetails!['starting_date']), isDark),
              if (_courseDetails!['ending_date'] != null)
                _buildInfoRow('End Date', _formatDate(_courseDetails!['ending_date']), isDark),
            ],
            isDark,
          ),
        ],
      ),
    );
  }

  Widget _buildExamsTab(bool isDark) {
    return RefreshIndicator(
      onRefresh: _loadExams,
      color: AppTheme.primary600,
      child: _isLoadingExams
          ? const Center(child: CircularProgressIndicator())
          : _exams.isEmpty
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        Icons.quiz_outlined,
                        size: 64,
                        color: isDark ? Colors.white54 : Colors.grey.shade400,
                      ),
                      const SizedBox(height: 16),
                      Text(
                        'No exams found',
                        style: TextStyle(
                          color: isDark ? Colors.white70 : Colors.grey.shade700,
                        ),
                      ),
                    ],
                  ),
                )
              : ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: _exams.length,
                  itemBuilder: (context, index) {
                    final exam = _exams[index];
                    return _buildAnimatedExamCard(
                      exam,
                      isDark,
                      index < _examControllers.length
                          ? _examControllers[index]
                          : null,
                    );
                  },
                ),
    );
  }

  Widget _buildAttendanceTab(bool isDark) {
    return RefreshIndicator(
      onRefresh: _loadLectures,
      color: AppTheme.primary600,
      child: _isLoadingLectures
          ? const Center(child: CircularProgressIndicator())
          : _lectures.isEmpty
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        Icons.checklist_outlined,
                        size: 64,
                        color: isDark ? Colors.white54 : Colors.grey.shade400,
                      ),
                      const SizedBox(height: 16),
                      Text(
                        'No lectures found',
                        style: TextStyle(
                          color: isDark ? Colors.white70 : Colors.grey.shade700,
                        ),
                      ),
                    ],
                  ),
                )
              : ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: _lectures.length,
                  itemBuilder: (context, index) {
                    final lecture = _lectures[index];
                    return _buildAnimatedLectureCard(
                      lecture,
                      isDark,
                      index < _attendanceControllers.length
                          ? _attendanceControllers[index]
                          : null,
                    );
                  },
                ),
    );
  }

  Widget _buildAnimatedLectureCard(
    Map<String, dynamic> lecture,
    bool isDark,
    AnimationController? controller,
  ) {
    if (controller == null) {
      return _buildLectureCard(lecture, isDark);
    }

    return AnimatedBuilder(
      animation: controller,
      builder: (context, child) {
        return Opacity(
          opacity: controller.value,
          child: Transform.translate(
            offset: Offset(0, 30 * (1 - controller.value)),
            child: Transform.scale(
              scale: 0.95 + (0.05 * controller.value),
              child: child,
            ),
          ),
        );
      },
      child: _buildLectureCard(lecture, isDark),
    );
  }

  Widget _buildLectureCard(Map<String, dynamic> lecture, bool isDark) {
    final lectureNumber = lecture['lecture_number'] ?? 0;

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: isDark ? AppTheme.navy800 : Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: isDark
              ? AppTheme.teal500.withOpacity(0.2)
              : AppTheme.primary600.withOpacity(0.1),
          width: 1,
        ),
        boxShadow: [
          BoxShadow(
            color: isDark
                ? Colors.black.withOpacity(0.3)
                : AppTheme.primary600.withOpacity(0.08),
            blurRadius: 15,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: BorderRadius.circular(20),
          onTap: () => _showLectureAttendance(lectureNumber),
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Row(
              children: [
                Container(
                  width: 56,
                  height: 56,
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      colors: [AppTheme.teal500, AppTheme.primary600],
                    ),
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Center(
                    child: Text(
                      '$lectureNumber',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 24,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Lecture $lectureNumber',
                        style: const TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'Tap to view attendance',
                        style: TextStyle(
                          fontSize: 13,
                          color: isDark ? Colors.white70 : Colors.grey.shade600,
                        ),
                      ),
                    ],
                  ),
                ),
                Icon(
                  Icons.arrow_forward_ios_rounded,
                  size: 20,
                  color: isDark ? Colors.white70 : Colors.grey.shade600,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Future<void> _showLectureAttendance(int lectureNumber) async {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final accessToken = authProvider.instituteData['accessToken'];
    final refreshToken = authProvider.instituteData['refreshToken'];

    if (accessToken == null) return;

    showDialog(
      context: context,
      barrierDismissible: true,
      builder: (context) => Dialog(
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(24),
        ),
        child: Container(
          constraints: const BoxConstraints(maxWidth: 500, maxHeight: 600),
          child: FutureBuilder<Map<String, dynamic>>(
            future: ApiService.getCourseAttendance(
              courseId: widget.courseId,
              lectureNumber: lectureNumber,
              accessToken: accessToken,
              refreshToken: refreshToken,
              onTokenRefreshed: (tokens) {
                if (mounted) {
                  authProvider.onTokenRefreshed(tokens);
                }
              },
              onSessionExpired: () {
                if (mounted) {
                  authProvider.onSessionExpired();
                }
              },
            ),
            builder: (context, snapshot) {
              final theme = Theme.of(context);
              final isDark = theme.brightness == Brightness.dark;

              if (snapshot.connectionState == ConnectionState.waiting) {
                return Container(
                  padding: const EdgeInsets.all(24),
                  child: const Center(child: CircularProgressIndicator()),
                );
              }

              if (snapshot.hasError) {
                return Container(
                  padding: const EdgeInsets.all(24),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.error_outline, size: 48, color: Colors.red),
                      const SizedBox(height: 16),
                      Text('Failed to load attendance'),
                      const SizedBox(height: 16),
                      ElevatedButton(
                        onPressed: () => Navigator.pop(context),
                        child: const Text('Close'),
                      ),
                    ],
                  ),
                );
              }

              final data = snapshot.data ?? {};
              final attendance = data['attendance'] ?? data['students'] ?? [];

              return Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  // Header
                  Container(
                    padding: const EdgeInsets.all(24),
                    decoration: const BoxDecoration(
                      gradient: LinearGradient(
                        colors: [AppTheme.teal500, AppTheme.primary600],
                      ),
                      borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.checklist_rounded, color: Colors.white, size: 28),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Text(
                            'Lecture $lectureNumber - Attendance',
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 20,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                        IconButton(
                          icon: const Icon(Icons.close, color: Colors.white),
                          onPressed: () => Navigator.pop(context),
                        ),
                      ],
                    ),
                  ),
                  // Attendance List
                  Expanded(
                    child: attendance.isEmpty
                        ? Center(
                            child: Padding(
                              padding: const EdgeInsets.all(24),
                              child: Column(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Icon(
                                    Icons.people_outline,
                                    size: 48,
                                    color: isDark ? Colors.white54 : Colors.grey.shade400,
                                  ),
                                  const SizedBox(height: 16),
                                  Text(
                                    'No attendance records',
                                    style: TextStyle(
                                      color: isDark ? Colors.white70 : Colors.grey.shade700,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          )
                        : ListView.builder(
                            padding: const EdgeInsets.all(16),
                            itemCount: attendance.length,
                            itemBuilder: (context, index) {
                              final record = attendance[index];
                              return _buildAttendanceRecord(record, isDark);
                            },
                          ),
                  ),
                ],
              );
            },
          ),
        ),
      ),
    );
  }

  Widget _buildAttendanceRecord(Map<String, dynamic> record, bool isDark) {
    final studentName = record['student_name'] ??
        '${record['first_name'] ?? ''} ${record['last_name'] ?? ''}'.trim();
    final status = record['status'] ?? record['attendance_status'] ?? 'unknown';
    final statusColor = _getAttendanceStatusColor(status);
    final statusIcon = _getAttendanceStatusIcon(status);

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isDark ? AppTheme.navy700 : Colors.grey.shade50,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: statusColor.withOpacity(0.3),
          width: 1,
        ),
      ),
      child: Row(
        children: [
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              color: statusColor.withOpacity(0.2),
              shape: BoxShape.circle,
            ),
            child: Center(
              child: Icon(
                statusIcon,
                color: statusColor,
                size: 24,
              ),
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  studentName.isNotEmpty ? studentName : 'Student',
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  'Status: ${status.toString().toUpperCase()}',
                  style: TextStyle(
                    fontSize: 13,
                    color: isDark ? Colors.white70 : Colors.grey.shade600,
                  ),
                ),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            decoration: BoxDecoration(
              color: statusColor.withOpacity(0.2),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Text(
              status.toString().toUpperCase(),
              style: TextStyle(
                color: statusColor,
                fontWeight: FontWeight.bold,
                fontSize: 12,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Color _getAttendanceStatusColor(String status) {
    switch (status.toLowerCase()) {
      case 'present':
        return Colors.green;
      case 'absent':
        return Colors.red;
      case 'late':
        return Colors.orange;
      default:
        return Colors.grey;
    }
  }

  IconData _getAttendanceStatusIcon(String status) {
    switch (status.toLowerCase()) {
      case 'present':
        return Icons.check_circle_rounded;
      case 'absent':
        return Icons.cancel_rounded;
      case 'late':
        return Icons.schedule_rounded;
      default:
        return Icons.help_outline_rounded;
    }
  }

  Widget _buildCourseImageHeader(bool isDark) {
    final courseImageUrl = _getImageUrl(_courseDetails!['course_image']);

    return Container(
      width: double.infinity,
      height: 250,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(20),
        gradient: const LinearGradient(
          colors: [AppTheme.primary600, AppTheme.teal500],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
      ),
      child: courseImageUrl != null
          ? ClipRRect(
              borderRadius: BorderRadius.circular(20),
              child: Image.network(
                courseImageUrl,
                fit: BoxFit.cover,
                errorBuilder: (context, error, stackTrace) {
                  return _buildImagePlaceholder();
                },
              ),
            )
          : _buildImagePlaceholder(),
    );
  }

  Widget _buildImagePlaceholder() {
    final title = _courseDetails?['title'] ?? 'C';
    return Container(
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          colors: [AppTheme.primary600, AppTheme.teal500],
        ),
        borderRadius: BorderRadius.all(Radius.circular(20)),
      ),
      child: Center(
        child: Text(
          title.toString().isNotEmpty ? title.toString()[0].toUpperCase() : 'C',
          style: const TextStyle(
            color: Colors.white,
            fontSize: 64,
            fontWeight: FontWeight.bold,
          ),
        ),
      ),
    );
  }

  Widget _buildInfoCard(
    String title,
    IconData icon,
    List<Widget> children,
    bool isDark,
  ) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: isDark ? AppTheme.navy800 : Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: AppTheme.primary600.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(icon, color: AppTheme.primary600, size: 24),
              ),
              const SizedBox(width: 12),
              Text(
                title,
                style: const TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          ...children,
        ],
      ),
    );
  }

  Widget _buildInfoRow(String label, String value, bool isDark, {bool isMultiline = false}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: TextStyle(
              fontSize: 12,
              color: isDark ? Colors.white70 : Colors.grey.shade600,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            value,
            style: TextStyle(
              fontSize: 15,
              color: isDark ? Colors.white : Colors.grey.shade800,
              fontWeight: FontWeight.w500,
            ),
            maxLines: isMultiline ? null : 2,
            overflow: isMultiline ? null : TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }

  String _formatPrice(dynamic price) {
    if (price == null) return 'Free';
    final priceValue = double.tryParse(price.toString()) ?? 0.0;
    if (priceValue == 0.0) {
      return 'Free';
    }
    return '\$${priceValue.toStringAsFixed(2)}';
  }

  Widget _buildAnimatedExamCard(
    Map<String, dynamic> exam,
    bool isDark,
    AnimationController? controller,
  ) {
    if (controller == null) {
      return _buildExamCard(exam, isDark);
    }

    return AnimatedBuilder(
      animation: controller,
      builder: (context, child) {
        return Opacity(
          opacity: controller.value,
          child: Transform.translate(
            offset: Offset(0, 30 * (1 - controller.value)),
            child: Transform.scale(
              scale: 0.95 + (0.05 * controller.value),
              child: child,
            ),
          ),
        );
      },
      child: _buildExamCard(exam, isDark),
    );
  }

  Widget _buildExamCard(Map<String, dynamic> exam, bool isDark) {
    final examTitle = exam['title'] ?? exam['exam_title'] ?? 'Exam';
    final examDate = exam['date'] ?? exam['exam_date'];
    final examId = exam['id'] ?? exam['exam_id'];

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: isDark ? AppTheme.navy800 : Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: isDark
              ? AppTheme.teal500.withOpacity(0.2)
              : AppTheme.primary600.withOpacity(0.1),
          width: 1,
        ),
        boxShadow: [
          BoxShadow(
            color: isDark
                ? Colors.black.withOpacity(0.3)
                : AppTheme.primary600.withOpacity(0.08),
            blurRadius: 15,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: BorderRadius.circular(20),
          onTap: () => _showExamGrades(examId, examTitle),
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Row(
              children: [
                Container(
                  width: 56,
                  height: 56,
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      colors: [Colors.purple, Colors.indigo],
                    ),
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: const Icon(
                    Icons.quiz_rounded,
                    color: Colors.white,
                    size: 28,
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        examTitle,
                        style: const TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      if (examDate != null) ...[
                        const SizedBox(height: 4),
                        Row(
                          children: [
                            Icon(
                              Icons.calendar_today_rounded,
                              size: 14,
                              color: isDark ? Colors.white70 : Colors.grey.shade600,
                            ),
                            const SizedBox(width: 6),
                            Text(
                              _formatDate(examDate.toString()),
                              style: TextStyle(
                                fontSize: 13,
                                color: isDark ? Colors.white70 : Colors.grey.shade600,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ],
                  ),
                ),
                Icon(
                  Icons.arrow_forward_ios_rounded,
                  size: 20,
                  color: isDark ? Colors.white70 : Colors.grey.shade600,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Future<void> _showExamGrades(int examId, String examTitle) async {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final accessToken = authProvider.instituteData['accessToken'];
    final refreshToken = authProvider.instituteData['refreshToken'];

    if (accessToken == null) return;

    showDialog(
      context: context,
      barrierDismissible: true,
      builder: (context) => Dialog(
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(24),
        ),
        child: Container(
          constraints: const BoxConstraints(maxWidth: 500, maxHeight: 600),
          child: FutureBuilder<Map<String, dynamic>>(
            future: ApiService.getExamGrades(
              examId: examId,
              accessToken: accessToken,
              refreshToken: refreshToken,
              onTokenRefreshed: (tokens) {
                if (mounted) {
                  authProvider.onTokenRefreshed(tokens);
                }
              },
              onSessionExpired: () {
                if (mounted) {
                  authProvider.onSessionExpired();
                }
              },
            ),
            builder: (context, snapshot) {
              final theme = Theme.of(context);
              final isDark = theme.brightness == Brightness.dark;

              if (snapshot.connectionState == ConnectionState.waiting) {
                return Container(
                  padding: const EdgeInsets.all(24),
                  child: const Center(child: CircularProgressIndicator()),
                );
              }

              if (snapshot.hasError) {
                return Container(
                  padding: const EdgeInsets.all(24),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.error_outline, size: 48, color: Colors.red),
                      const SizedBox(height: 16),
                      Text('Failed to load grades'),
                      const SizedBox(height: 16),
                      ElevatedButton(
                        onPressed: () => Navigator.pop(context),
                        child: const Text('Close'),
                      ),
                    ],
                  ),
                );
              }

              final data = snapshot.data ?? {};
              final grades = data['grades'] ?? data['results'] ?? [];

              return Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  // Header
                  Container(
                    padding: const EdgeInsets.all(24),
                    decoration: const BoxDecoration(
                      gradient: LinearGradient(
                        colors: [Colors.purple, Colors.indigo],
                      ),
                      borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.emoji_events_rounded, color: Colors.white, size: 28),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Text(
                            examTitle,
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 20,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                        IconButton(
                          icon: const Icon(Icons.close, color: Colors.white),
                          onPressed: () => Navigator.pop(context),
                        ),
                      ],
                    ),
                  ),
                  // Grades List
                  Expanded(
                    child: grades.isEmpty
                        ? Center(
                            child: Padding(
                              padding: const EdgeInsets.all(24),
                              child: Column(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Icon(
                                    Icons.assignment_outlined,
                                    size: 48,
                                    color: isDark ? Colors.white54 : Colors.grey.shade400,
                                  ),
                                  const SizedBox(height: 16),
                                  Text(
                                    'No grades yet',
                                    style: TextStyle(
                                      color: isDark ? Colors.white70 : Colors.grey.shade700,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          )
                        : ListView.builder(
                            padding: const EdgeInsets.all(16),
                            itemCount: grades.length,
                            itemBuilder: (context, index) {
                              final grade = grades[index];
                              return _buildGradeCard(grade, isDark);
                            },
                          ),
                  ),
                ],
              );
            },
          ),
        ),
      ),
    );
  }

  Widget _buildGradeCard(Map<String, dynamic> grade, bool isDark) {
    final studentName = grade['student_name'] ??
        '${grade['first_name'] ?? ''} ${grade['last_name'] ?? ''}'.trim();
    final score = grade['score'] ?? grade['grade'] ?? 0;
    final maxScore = grade['max_score'] ?? 100;
    final percentage = maxScore > 0 ? (score / maxScore) * 100 : 0;
    final gradeColor = _getGradeColor(percentage);

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isDark ? AppTheme.navy700 : Colors.grey.shade50,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: gradeColor.withOpacity(0.3),
          width: 1,
        ),
      ),
      child: Row(
        children: [
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              color: gradeColor.withOpacity(0.2),
              shape: BoxShape.circle,
            ),
            child: Center(
              child: Text(
                studentName.isNotEmpty ? studentName[0].toUpperCase() : 'S',
                style: TextStyle(
                  color: gradeColor,
                  fontWeight: FontWeight.bold,
                  fontSize: 18,
                ),
              ),
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  studentName.isNotEmpty ? studentName : 'Student',
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  'Score: $score / $maxScore',
                  style: TextStyle(
                    fontSize: 13,
                    color: isDark ? Colors.white70 : Colors.grey.shade600,
                  ),
                ),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            decoration: BoxDecoration(
              color: gradeColor.withOpacity(0.2),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Text(
              '${percentage.toStringAsFixed(1)}%',
              style: TextStyle(
                color: gradeColor,
                fontWeight: FontWeight.bold,
                fontSize: 16,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Color _getGradeColor(double percentage) {
    if (percentage >= 85) return Colors.green;
    if (percentage >= 70) return Colors.blue;
    if (percentage >= 50) return Colors.amber;
    return Colors.red;
  }
}

