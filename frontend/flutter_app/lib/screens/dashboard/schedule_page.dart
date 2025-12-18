import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../config/theme.dart';
import '../../providers/auth_provider.dart';
import '../../services/api_service.dart';
import '../../widgets/modern_bottom_nav.dart';
import '../../utils/navigation_helper.dart';
import '../../widgets/verification_lock.dart';

class SchedulePage extends StatefulWidget {
  const SchedulePage({super.key});

  @override
  State<SchedulePage> createState() => _SchedulePageState();
}

class _SchedulePageState extends State<SchedulePage> {
  bool _isLoading = false;
  bool _isCheckingVerification = true;
  bool _isVerified = false;
  String? _error;
  Map<String, dynamic> _schedule = {};
  int _currentWeek = 0;

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
    _checkVerification();
  }

  Future<void> _checkVerification() async {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final instituteData = authProvider.instituteData;
    final accessToken = instituteData['accessToken'];
    final refreshToken = instituteData['refreshToken'];
    final email = instituteData['email'];

    if (accessToken == null || email == null) {
      setState(() {
        _isCheckingVerification = false;
        _isVerified = false;
      });
      return;
    }

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

      final isVerified = verificationStatus['is_verified'] == true;
      
      // Update auth provider
      if (verificationStatus['is_verified'] != instituteData['isVerified']) {
        authProvider.updateInstituteData({
          'isVerified': isVerified,
        });
      }

      setState(() {
        _isCheckingVerification = false;
        _isVerified = isVerified;
      });

      if (isVerified) {
        _loadSchedule();
      }
    } catch (e) {
      setState(() {
        _isCheckingVerification = false;
        _isVerified = false;
      });
    }
  }

  Future<void> _loadSchedule() async {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final instituteData = authProvider.instituteData;
    final accessToken = instituteData['accessToken'];
    final refreshToken = instituteData['refreshToken'];

    if (accessToken == null) {
      setState(() {
        _isLoading = false;
        _error = 'Not authenticated';
      });
      return;
    }

    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final scheduleMap = await ApiService.getSchedule(
        accessToken: accessToken,
        refreshToken: refreshToken,
        onTokenRefreshed: (tokens) {
          authProvider.onTokenRefreshed(tokens);
        },
        onSessionExpired: () {
          authProvider.onSessionExpired();
        },
      );

      // Ensure all days are present in the map (even if empty)
      final Map<String, List<dynamic>> processedSchedule = {};
      for (final day in _days) {
        final dayKey = day['key']!;
        // The API returns schedule as a map with day keys (monday, tuesday, etc.)
        if (scheduleMap[dayKey] is List) {
          processedSchedule[dayKey] = scheduleMap[dayKey] as List<dynamic>;
        } else {
          processedSchedule[dayKey] = [];
        }
      }

      setState(() {
        _schedule = processedSchedule;
      });
    } catch (err) {
      setState(() {
        _error = err is ApiException ? err.message : 'Unable to load schedule';
      });
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  List<dynamic> _getScheduleByDay(String dayKey) {
    final key = dayKey.toLowerCase();
    if (_schedule[key] is List) {
      return _schedule[key] as List<dynamic>;
    }
    return [];
  }

  void _handlePrevWeek() {
    setState(() {
      _currentWeek--;
    });
  }

  void _handleNextWeek() {
    setState(() {
      _currentWeek++;
    });
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    // Check verification status
    if (_isCheckingVerification) {
      return Scaffold(
        appBar: AppBar(
          title: const Text('Schedule'),
          elevation: 0,
          backgroundColor: isDark ? AppTheme.navy800 : Colors.white,
          foregroundColor: isDark ? Colors.white : Colors.black,
        ),
        body: const Center(child: CircularProgressIndicator()),
      );
    }

    // BLOCK ACCESS if not verified
    if (!_isVerified) {
      return const VerificationLock();
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('Schedule'),
        elevation: 0,
        backgroundColor: isDark ? AppTheme.navy800 : Colors.white,
        foregroundColor: isDark ? Colors.white : Colors.black,
      ),
      bottomNavigationBar: ModernBottomNav(
        currentIndex: 1, // Dashboard index for institutions
        onTap: (index) {
          NavigationHelper.handleBottomNavTap(context, index);
        },
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header with Week Navigation
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Schedule',
                      style: TextStyle(
                        fontSize: 32,
                        fontWeight: FontWeight.bold,
                        color: isDark ? Colors.white : Colors.grey.shade800,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'View your institution schedule',
                      style: TextStyle(
                        fontSize: 16,
                        color: isDark ? Colors.grey.shade400 : Colors.grey.shade600,
                      ),
                    ),
                  ],
                ),
                Row(
                  children: [
                    IconButton(
                      onPressed: _handlePrevWeek,
                      icon: const Icon(Icons.chevron_left),
                      style: IconButton.styleFrom(
                        backgroundColor: isDark ? AppTheme.navy700 : Colors.white,
                        foregroundColor: isDark ? Colors.white : Colors.black,
                      ),
                    ),
                    const SizedBox(width: 16),
                    Column(
                      children: [
                        Text(
                          'Current Week',
                          style: TextStyle(
                            fontSize: 12,
                            color: isDark ? Colors.grey.shade400 : Colors.grey.shade600,
                          ),
                        ),
                        Text(
                          _currentWeek == 0
                              ? 'Current'
                              : _currentWeek > 0
                                  ? '+$_currentWeek'
                                  : '$_currentWeek',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                            color: isDark ? Colors.white : Colors.black,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(width: 16),
                    IconButton(
                      onPressed: _handleNextWeek,
                      icon: const Icon(Icons.chevron_right),
                      style: IconButton.styleFrom(
                        backgroundColor: isDark ? AppTheme.navy700 : Colors.white,
                        foregroundColor: isDark ? Colors.white : Colors.black,
                      ),
                    ),
                  ],
                ),
              ],
            ),

            if (_error != null)
              Padding(
                padding: const EdgeInsets.only(top: 16.0),
                child: Row(
                  children: [
                    Icon(Icons.warning_amber, color: Colors.amber.shade600, size: 20),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        _error!,
                        style: TextStyle(
                          fontSize: 14,
                          color: Colors.amber.shade600,
                        ),
                      ),
                    ),
                  ],
                ),
              ),

            const SizedBox(height: 24),

            // Weekly Calendar View
            _isLoading
                ? const Center(child: CircularProgressIndicator())
                : LayoutBuilder(
                    builder: (context, constraints) {
                      final isDesktop = constraints.maxWidth >= 1024;
                      return Column(
                        children: [
                          // Main weekdays (Monday-Friday)
                          GridView.builder(
                            shrinkWrap: true,
                            physics: const NeverScrollableScrollPhysics(),
                            gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                              crossAxisCount: isDesktop ? 5 : 1,
                              crossAxisSpacing: 16,
                              mainAxisSpacing: 16,
                              childAspectRatio: isDesktop ? 0.8 : 1.5,
                            ),
                            itemCount: 5,
                            itemBuilder: (context, index) {
                              final day = _days[index];
                              final entries = _getScheduleByDay(day['key']!);
                              return _buildDayCard(day, entries, isDark);
                            },
                          ),
                          // Weekend section (if has entries)
                          if (_days.skip(5).any((day) => _getScheduleByDay(day['key']!).isNotEmpty)) ...[
                            const SizedBox(height: 24),
                            Card(
                              elevation: 2,
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                              child: Padding(
                                padding: const EdgeInsets.all(16.0),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      'Weekend',
                                      style: TextStyle(
                                        fontSize: 20,
                                        fontWeight: FontWeight.bold,
                                        color: isDark ? Colors.white : Colors.black,
                                      ),
                                    ),
                                    const SizedBox(height: 16),
                                    GridView.builder(
                                      shrinkWrap: true,
                                      physics: const NeverScrollableScrollPhysics(),
                                      gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                                        crossAxisCount: isDesktop ? 2 : 1,
                                        crossAxisSpacing: 16,
                                        mainAxisSpacing: 16,
                                        childAspectRatio: 2,
                                      ),
                                      itemCount: 2,
                                      itemBuilder: (context, index) {
                                        final day = _days[5 + index];
                                        final entries = _getScheduleByDay(day['key']!);
                                        return _buildWeekendDayCard(day, entries, isDark);
                                      },
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ],
                        ],
                      );
                    },
                  ),
          ],
        ),
      ),
    );
  }

  Widget _buildDayCard(Map<String, String> day, List<dynamic> entries, bool isDark) {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(
                  Icons.calendar_today,
                  color: AppTheme.primary600,
                  size: 20,
                ),
                const SizedBox(width: 8),
                Text(
                  day['label']!,
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: isDark ? Colors.white : Colors.black,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            Expanded(
              child: entries.isEmpty
                  ? Center(
                      child: Text(
                        'No classes',
                        style: TextStyle(
                          fontSize: 14,
                          color: isDark ? Colors.grey.shade500 : Colors.grey.shade600,
                        ),
                      ),
                    )
                  : ListView.builder(
                      itemCount: entries.length,
                      itemBuilder: (context, index) {
                        final entry = entries[index];
                        return _buildScheduleEntry(entry, isDark);
                      },
                    ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildWeekendDayCard(Map<String, String> day, List<dynamic> entries, bool isDark) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          day['label']!,
          style: TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.bold,
            color: isDark ? Colors.grey.shade400 : Colors.grey.shade600,
          ),
        ),
        const SizedBox(height: 8),
        if (entries.isEmpty)
          Text(
            'No classes',
            style: TextStyle(
              fontSize: 12,
              color: isDark ? Colors.grey.shade500 : Colors.grey.shade600,
            ),
          )
        else
          ...entries.map((entry) => _buildScheduleEntry(entry, isDark)),
      ],
    );
  }

  Widget _buildScheduleEntry(Map<String, dynamic> entry, bool isDark) {
    final startTime = entry['start_time'] ?? '';
    final endTime = entry['end_time'] ?? '';
    final courseTitle = entry['course_title'] ?? entry['course'] ?? '—';
    final lecturer = entry['lecturer'] ?? '—';
    final room = entry['room'];

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            AppTheme.primary600.withOpacity(0.1),
            AppTheme.teal500.withOpacity(0.1),
          ],
        ),
        borderRadius: BorderRadius.circular(8),
        border: Border(
          left: BorderSide(
            color: AppTheme.primary600,
            width: 4,
          ),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            '$startTime – $endTime',
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.bold,
              color: AppTheme.primary600,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            courseTitle,
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.bold,
              color: isDark ? Colors.white : Colors.black,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            lecturer,
            style: TextStyle(
              fontSize: 12,
              color: isDark ? Colors.grey.shade400 : Colors.grey.shade600,
            ),
          ),
          if (room != null && room.toString().isNotEmpty)
            Padding(
              padding: const EdgeInsets.only(top: 4),
              child: Text(
                'Room $room',
                style: TextStyle(
                  fontSize: 11,
                  color: isDark ? Colors.grey.shade500 : Colors.grey.shade700,
                ),
              ),
            ),
        ],
      ),
    );
  }
}
