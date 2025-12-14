import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../providers/theme_provider.dart';
import '../../config/theme.dart';
import '../../services/lecturer_service.dart';
import '../../services/api_service.dart';
import '../../widgets/language_switcher.dart';

class LecturerScheduleScreen extends StatefulWidget {
  const LecturerScheduleScreen({super.key});

  @override
  State<LecturerScheduleScreen> createState() => _LecturerScheduleScreenState();
}

class _LecturerScheduleScreenState extends State<LecturerScheduleScreen> {
  Map<String, List<dynamic>> _schedule = {};
  bool _isLoading = true;
  String? _error;
  bool _isNotVerified = false;
  String _selectedDay = 'monday';

  final List<String> _days = [
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
    'sunday',
  ];

  @override
  void initState() {
    super.initState();
    _setCurrentDay();
    _fetchSchedule();
  }

  void _setCurrentDay() {
    final now = DateTime.now();
    final dayName = _days[now.weekday - 1];
    setState(() {
      _selectedDay = dayName;
    });
  }

  Future<void> _fetchSchedule() async {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final accessToken = authProvider.instituteData['accessToken'];
    final refreshToken = authProvider.instituteData['refreshToken'];

    if (accessToken == null) {
      setState(() {
        _error = 'Please login to view your schedule';
        _isLoading = false;
      });
      return;
    }

    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final scheduleData = await LecturerService.getLecturerSchedule(
        accessToken: accessToken,
        refreshToken: refreshToken,
        onTokenRefreshed: (tokens) {
          authProvider.onTokenRefreshed(tokens);
        },
        onSessionExpired: () {
          authProvider.onSessionExpired();
        },
      );

      if (scheduleData['success'] == true && scheduleData['schedule'] != null) {
        final groupedSchedule = <String, List<dynamic>>{};
        final today = DateTime.now();
        today.copyWith(hour: 0, minute: 0, second: 0, millisecond: 0);

        final scheduleList = List<dynamic>.from(scheduleData['schedule']);
        
        for (var item in scheduleList) {
          // Filter: only include schedule items if course is active
          if (item['starting_date'] != null && item['ending_date'] != null) {
            final startDate = DateTime.parse(item['starting_date']);
            final endDate = DateTime.parse(item['ending_date']);
            final start = DateTime(startDate.year, startDate.month, startDate.day);
            final end = DateTime(endDate.year, endDate.month, endDate.day, 23, 59, 59);
            final now = DateTime.now();

            if (now.isAfter(start.subtract(const Duration(days: 1))) &&
                now.isBefore(end.add(const Duration(days: 1)))) {
              final day = (item['day'] as String? ?? '').toLowerCase();
              if (_days.contains(day)) {
                groupedSchedule.putIfAbsent(day, () => []).add({
                  'id': item['course_id'],
                  'course': item['course_title'],
                  'startTime': item['start_time'],
                  'endTime': item['end_time'],
                  'institution': item['institution'],
                  'starting_date': item['starting_date'],
                  'ending_date': item['ending_date'],
                  'type': 'Lecture',
                });
              }
            }
          } else {
            // If no dates provided, include it (backward compatibility)
            final day = (item['day'] as String? ?? '').toLowerCase();
            if (_days.contains(day)) {
              groupedSchedule.putIfAbsent(day, () => []).add({
                'id': item['course_id'],
                'course': item['course_title'],
                'startTime': item['start_time'],
                'endTime': item['end_time'],
                'institution': item['institution'],
                'type': 'Lecture',
              });
            }
          }
        }

        setState(() {
          _schedule = groupedSchedule;
        });
      } else {
        setState(() {
          _schedule = {};
        });
      }
    } catch (e) {
      if (e is ApiException && e.status == 403) {
        setState(() {
          _isNotVerified = true;
        });
      } else {
        setState(() {
          _error = e is ApiException ? e.message : 'Failed to load schedule. Please try again.';
        });
      }
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  String _capitalizeDay(String day) {
    return day[0].toUpperCase() + day.substring(1);
  }

  String _formatTime(String? startTime, String? endTime) {
    if (startTime == null) return '';
    if (endTime != null) {
      return '$startTime - $endTime';
    }
    return startTime;
  }

  Color _getTypeColor(String type) {
    switch (type) {
      case 'Lecture':
        return Colors.purple;
      case 'Lab':
        return Colors.pink;
      case 'Tutorial':
        return Colors.indigo;
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

    return Scaffold(
      backgroundColor: isDark ? AppTheme.navy900 : const Color(0xFFF9FAFB),
      appBar: AppBar(
        elevation: 0,
        backgroundColor: isDark ? AppTheme.navy800 : Colors.white,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => Navigator.pop(context),
        ),
        title: const Text('Teaching Schedule'),
        actions: [
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
          : _isNotVerified
              ? _buildNotVerifiedView(context, isDark)
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
                                colors: [AppTheme.primary600, AppTheme.teal500],
                              ),
                              borderRadius: BorderRadius.circular(16),
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
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
                                            'Welcome, ${instituteData['firstName'] ?? instituteData['username'] ?? 'Lecturer'}!',
                                            style: const TextStyle(
                                              fontSize: 24,
                                              fontWeight: FontWeight.bold,
                                              color: Colors.white,
                                            ),
                                          ),
                                          const SizedBox(height: 4),
                                          const Text(
                                            'Your weekly teaching schedule',
                                            style: TextStyle(
                                              color: Colors.white70,
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                  ],
                                ),
                                if (instituteData['institution'] != null) ...[
                                  const SizedBox(height: 16),
                                  Container(
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: 16,
                                      vertical: 8,
                                    ),
                                    decoration: BoxDecoration(
                                      color: Colors.white.withOpacity(0.1),
                                      borderRadius: BorderRadius.circular(8),
                                    ),
                                    child: Row(
                                      mainAxisSize: MainAxisSize.min,
                                      children: [
                                        const Icon(
                                          Icons.school,
                                          color: Colors.white,
                                          size: 20,
                                        ),
                                        const SizedBox(width: 8),
                                        Text(
                                          instituteData['institution'],
                                          style: const TextStyle(
                                            color: Colors.white,
                                            fontWeight: FontWeight.w600,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ],
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
                                final isSelected = _selectedDay == day;
                                return InkWell(
                                  onTap: () {
                                    setState(() {
                                      _selectedDay = day;
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
                                              colors: [
                                                AppTheme.primary600,
                                                AppTheme.teal500
                                              ],
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
                                      _capitalizeDay(day),
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
                          if (_schedule[_selectedDay] != null &&
                              _schedule[_selectedDay]!.isNotEmpty)
                            ..._schedule[_selectedDay]!.asMap().entries.map((entry) {
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

  Widget _buildNotVerifiedView(BuildContext context, bool isDark) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 80,
              height: 80,
              decoration: BoxDecoration(
                color: Colors.amber.withOpacity(0.1),
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.warning,
                size: 40,
                color: Colors.amber,
              ),
            ),
            const SizedBox(height: 24),
            const Text(
              'Account Not Verified',
              style: TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 12),
            const Text(
              'You need to verify your account to view your schedule.',
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Go to Profile'),
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
    final typeColor = _getTypeColor(session['type'] ?? 'Lecture');

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
            Row(
              children: [
                Expanded(
                  child: Text(
                    session['course'] ?? 'Course',
                    style: const TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 12,
                    vertical: 6,
                  ),
                  decoration: BoxDecoration(
                    color: typeColor.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    session['type'] ?? 'Lecture',
                    style: TextStyle(
                      color: typeColor,
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ],
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
                          color: Colors.purple.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: const Icon(
                          Icons.access_time,
                          color: Colors.purple,
                          size: 20,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Column(
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
                            _formatTime(session['startTime'], session['endTime']),
                            style: const TextStyle(
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ],
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
                          color: Colors.indigo.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: const Icon(
                          Icons.school,
                          color: Colors.indigo,
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
                              session['institution'] ?? '',
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
            if (session['starting_date'] != null &&
                session['ending_date'] != null) ...[
              const SizedBox(height: 16),
              const Divider(),
              const SizedBox(height: 16),
              Row(
                children: [
                  const Icon(
                    Icons.calendar_today,
                    color: AppTheme.primary600,
                    size: 20,
                  ),
                  const SizedBox(width: 8),
                  Text(
                    'Course Dates',
                    style: TextStyle(
                      fontSize: 12,
                      color: Colors.grey.shade600,
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      '${_formatDate(session['starting_date'])} - ${_formatDate(session['ending_date'])}',
                      style: const TextStyle(
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }

  String _formatDate(String dateString) {
    try {
      final date = DateTime.parse(dateString);
      return '${date.month}/${date.day}/${date.year}';
    } catch (e) {
      return dateString;
    }
  }
}

