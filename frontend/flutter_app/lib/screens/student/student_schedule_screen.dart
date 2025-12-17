import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../providers/theme_provider.dart';
import '../../config/theme.dart';
import '../../services/student_service.dart';
import '../../services/api_service.dart';
import '../../widgets/language_switcher.dart';

class StudentScheduleScreen extends StatefulWidget {
  const StudentScheduleScreen({super.key});

  @override
  State<StudentScheduleScreen> createState() => _StudentScheduleScreenState();
}

class _StudentScheduleScreenState extends State<StudentScheduleScreen> {
  Map<String, List<dynamic>> _schedule = {
    'Monday': [],
    'Tuesday': [],
    'Wednesday': [],
    'Thursday': [],
    'Friday': [],
    'Saturday': [],
    'Sunday': [],
  };
  bool _isLoading = true;
  String? _error;
  String _selectedDay = 'monday';

  final List<Map<String, String>> _days = [
    {'key': 'monday', 'label': 'Monday'},
    {'key': 'tuesday', 'label': 'Tuesday'},
    {'key': 'wednesday', 'label': 'Wednesday'},
    {'key': 'thursday', 'label': 'Thursday'},
    {'key': 'friday', 'label': 'Friday'},
    {'key': 'saturday', 'label': 'Saturday'},
    {'key': 'sunday', 'label': 'Sunday'},
  ];

  @override
  void initState() {
    super.initState();
    _setCurrentDay();
    _fetchSchedule();
    _checkVerificationStatus();
  }

  Future<void> _checkVerificationStatus() async {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final instituteData = authProvider.instituteData;
    final email = instituteData['email'];
    final accessToken = instituteData['accessToken'];
    final refreshToken = instituteData['refreshToken'];

    if (email != null && accessToken != null) {
      try {
        final verificationStatus = await ApiService.checkVerificationStatus(
          email,
          accessToken: accessToken,
          refreshToken: refreshToken,
          onTokenRefreshed: (tokens) {
            authProvider.onTokenRefreshed(tokens);
          },
          onSessionExpired: () {
            authProvider.onSessionExpired();
          },
        );
        if (mounted && verificationStatus['is_verified'] != instituteData['isVerified']) {
          await authProvider.updateInstituteData({
            'isVerified': verificationStatus['is_verified'] ?? false,
          });
        }
      } catch (e) {
        // Silently fail - verification check is not critical
      }
    }
  }

  void _setCurrentDay() {
    final now = DateTime.now();
    final dayIndex = now.weekday - 1;
    if (dayIndex < _days.length) {
      setState(() {
        _selectedDay = _days[dayIndex]['key']!;
      });
    }
  }

  Future<void> _fetchSchedule() async {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final accessToken = authProvider.instituteData['accessToken'];
    final refreshToken = authProvider.instituteData['refreshToken'];
    final userType = authProvider.instituteData['userType'];

    if (accessToken == null || userType != 'student') {
      setState(() {
        _error = 'Please login as a student to view your schedule';
        _isLoading = false;
      });
      return;
    }

    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final response = await StudentService.getStudentSchedule(
        accessToken: accessToken,
        refreshToken: refreshToken,
        onTokenRefreshed: (tokens) {
          authProvider.onTokenRefreshed(tokens);
        },
        onSessionExpired: () {
          authProvider.onSessionExpired();
        },
      );

      if (response['success'] == true && response['schedule'] != null) {
        final groupedSchedule = {
          'Monday': <dynamic>[],
          'Tuesday': <dynamic>[],
          'Wednesday': <dynamic>[],
          'Thursday': <dynamic>[],
          'Friday': <dynamic>[],
          'Saturday': <dynamic>[],
          'Sunday': <dynamic>[],
        };

        final scheduleList = List<dynamic>.from(response['schedule']);
        for (var item in scheduleList) {
          final dayKey = item['day'] != null
              ? (item['day'] as String)
                  .substring(0, 1)
                  .toUpperCase() +
                  (item['day'] as String).substring(1).toLowerCase()
              : 'Monday';

          if (groupedSchedule.containsKey(dayKey)) {
            groupedSchedule[dayKey]!.add({
              'id': item['course_id'],
              'course': item['course_title'] ?? 'Untitled Course',
              'time': '${item['start_time'] ?? '09:00'} - ${item['end_time'] ?? '10:00'}',
              'instructor': item['lecturer'] ?? 'TBA',
              'institution': item['institution'] ?? 'N/A',
              'course_id': item['course_id'],
              'start_time': item['start_time'],
              'end_time': item['end_time'],
            });
          }
        }

        setState(() {
          _schedule = groupedSchedule;
        });
      } else {
        setState(() {
          _error = 'No schedule data available';
        });
      }
    } catch (e) {
      setState(() {
        _error = e is ApiException ? e.message : 'Failed to load schedule';
      });
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  String _getSelectedDayKey() {
    final day = _days.firstWhere(
      (d) => d['key'] == _selectedDay,
      orElse: () => _days[0],
    );
    return day['label']!;
  }

  List<dynamic> _getSelectedDaySchedule() {
    final dayKey = _getSelectedDayKey();
    return _schedule[dayKey] ?? [];
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final authProvider = Provider.of<AuthProvider>(context);
    final instituteData = authProvider.instituteData;

    return Scaffold(
      backgroundColor: isDark ? AppTheme.navy900 : const Color(0xFFF9FAFB),
      appBar: AppBar(
        elevation: 0,
        backgroundColor: isDark ? AppTheme.navy800 : Colors.white,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => Navigator.pop(context),
        ),
        title: const Text('My Schedule'),
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
              ? _buildErrorView(context, isDark)
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
                            colors: [Colors.blue, Colors.indigo],
                          ),
                          borderRadius: BorderRadius.circular(16),
                        ),
                        child: Row(
                          children: [
                            Container(
                              width: 64,
                              height: 64,
                              decoration: BoxDecoration(
                                color: Colors.white.withOpacity(0.2),
                                borderRadius: BorderRadius.circular(32),
                              ),
                              child: const Icon(
                                Icons.calendar_today,
                                color: Colors.white,
                                size: 32,
                              ),
                            ),
                            const SizedBox(width: 16),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    'Welcome, ${instituteData['firstName'] ?? instituteData['username'] ?? 'Student'}!',
                                    style: const TextStyle(
                                      fontSize: 24,
                                      fontWeight: FontWeight.bold,
                                      color: Colors.white,
                                    ),
                                  ),
                                  const SizedBox(height: 4),
                                  const Text(
                                    "Here's your weekly schedule",
                                    style: TextStyle(
                                      color: Colors.white70,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),

                      const SizedBox(height: 24),

                      // Day Selector
                      Container(
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
                        child: Wrap(
                          spacing: 8,
                          runSpacing: 8,
                          children: _days.map((day) {
                            final isSelected = _selectedDay == day['key'];
                            return InkWell(
                              onTap: () {
                                setState(() {
                                  _selectedDay = day['key']!;
                                });
                              },
                              borderRadius: BorderRadius.circular(12),
                              child: Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 24,
                                  vertical: 12,
                                ),
                                decoration: BoxDecoration(
                                  gradient: isSelected
                                      ? const LinearGradient(
                                          colors: [AppTheme.primary600, AppTheme.teal500],
                                        )
                                      : null,
                                  color: isSelected
                                      ? null
                                      : (isDark
                                          ? AppTheme.navy700
                                          : Colors.grey.shade100),
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                child: Text(
                                  day['label']!,
                                  style: TextStyle(
                                    fontWeight: FontWeight.w600,
                                    color: isSelected
                                        ? Colors.white
                                        : (isDark
                                            ? Colors.grey.shade300
                                            : Colors.grey.shade700),
                                  ),
                                ),
                              ),
                            );
                          }).toList(),
                        ),
                      ),

                      const SizedBox(height: 24),

                      // Schedule Cards
                      if (_getSelectedDaySchedule().isNotEmpty)
                        ..._getSelectedDaySchedule().asMap().entries.map((entry) {
                          final index = entry.key;
                          final session = entry.value;
                          return _buildScheduleCard(
                            context,
                            isDark,
                            session,
                            index,
                          );
                        })
                      else
                        Container(
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
                              Container(
                                width: 80,
                                height: 80,
                                decoration: BoxDecoration(
                                  color: Colors.grey.shade200,
                                  shape: BoxShape.circle,
                                ),
                                child: Icon(
                                  Icons.calendar_today,
                                  size: 40,
                                  color: Colors.grey.shade400,
                                ),
                              ),
                              const SizedBox(height: 16),
                              const Text(
                                'No Classes Today',
                                style: TextStyle(
                                  fontSize: 20,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              const SizedBox(height: 8),
                              Text(
                                'Enjoy your day off!',
                                style: TextStyle(
                                  color: Colors.grey.shade600,
                                ),
                              ),
                            ],
                          ),
                        ),
                    ],
                  ),
                ),
    );
  }

  Widget _buildErrorView(BuildContext context, bool isDark) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.error_outline, size: 64, color: Colors.red),
            const SizedBox(height: 16),
            Text(
              _error ?? 'Error',
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: _fetchSchedule,
              child: const Text('Retry'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildScheduleCard(
    BuildContext context,
    bool isDark,
    Map<String, dynamic> session,
    int index,
  ) {
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
            Text(
              session['course'] ?? 'Course',
              style: const TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: Row(
                    children: [
                      Container(
                        width: 40,
                        height: 40,
                        decoration: BoxDecoration(
                          color: Colors.blue.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: const Icon(
                          Icons.access_time,
                          color: Colors.blue,
                          size: 20,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Time',
                              style: TextStyle(
                                fontSize: 12,
                                color: Colors.grey.shade600,
                              ),
                            ),
                            Text(
                              session['time'] ?? '',
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
                Expanded(
                  child: Row(
                    children: [
                      Container(
                        width: 40,
                        height: 40,
                        decoration: BoxDecoration(
                          color: Colors.purple.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: const Icon(
                          Icons.person,
                          color: Colors.purple,
                          size: 20,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Instructor',
                              style: TextStyle(
                                fontSize: 12,
                                color: Colors.grey.shade600,
                              ),
                            ),
                            Text(
                              session['instructor'] ?? 'TBA',
                              style: const TextStyle(
                                fontWeight: FontWeight.w600,
                              ),
                              overflow: TextOverflow.ellipsis,
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                Expanded(
                  child: Row(
                    children: [
                      Container(
                        width: 40,
                        height: 40,
                        decoration: BoxDecoration(
                          color: Colors.green.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: const Icon(
                          Icons.school,
                          color: Colors.green,
                          size: 20,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Institution',
                              style: TextStyle(
                                fontSize: 12,
                                color: Colors.grey.shade600,
                              ),
                            ),
                            Text(
                              session['institution'] ?? 'N/A',
                              style: const TextStyle(
                                fontWeight: FontWeight.w600,
                              ),
                              overflow: TextOverflow.ellipsis,
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

