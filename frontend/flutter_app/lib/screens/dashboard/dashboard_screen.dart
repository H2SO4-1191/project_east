import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../config/theme.dart';
import '../../providers/auth_provider.dart';
import '../../widgets/profile_button.dart';
import '../../widgets/dashboard_stat_card.dart';
import '../../widgets/dashboard_page_card.dart';
import '../../services/api_service.dart';
import '../../utils/page_animations.dart';
import 'package:animations/animations.dart';
import 'students_page.dart';
import 'lecturers_page.dart';
import 'staff_page.dart';
import 'schedule_page.dart';
import 'settings_page.dart';
import 'applications_page.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> with AutomaticKeepAliveClientMixin {
  bool _isLoading = true;
  String? _error;
  Map<String, dynamic> _stats = {};

  @override
  bool get wantKeepAlive => true;

  @override
  void initState() {
    super.initState();
    _loadStats();
  }

  Future<void> _loadStats() async {
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
      // Fetch verification status
      if (instituteData['email'] != null && instituteData['userType'] == 'institution') {
        try {
          final verificationStatus = await ApiService.checkVerificationStatus(
            instituteData['email'],
            accessToken: accessToken,
            refreshToken: refreshToken,
            onTokenRefreshed: (tokens) {
              authProvider.onTokenRefreshed(tokens);
            },
            onSessionExpired: () {
              authProvider.onSessionExpired();
            },
          );
          if (verificationStatus['is_verified'] != instituteData['isVerified']) {
            authProvider.updateInstituteData({
              'isVerified': verificationStatus['is_verified'] ?? false,
            });
          }
        } catch (e) {
          // Verification check failed, continue
        }
      }

      // Fetch dashboard stats
      final stats = await ApiService.getDashboardStats(
        accessToken: accessToken,
        refreshToken: refreshToken,
        onTokenRefreshed: (tokens) {
          authProvider.onTokenRefreshed(tokens);
        },
        onSessionExpired: () {
          authProvider.onSessionExpired();
        },
      );

      setState(() {
        _stats = stats;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString();
        _isLoading = false;
      });
    }
  }

  Future<void> _navigateToPage(DashboardPageType pageType) async {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final instituteData = authProvider.instituteData;
    final accessToken = instituteData['accessToken'];
    final refreshToken = instituteData['refreshToken'];
    final email = instituteData['email'];

    // Settings page is always accessible
    if (pageType == DashboardPageType.settings) {
      Navigator.push(
        context,
        PageAnimations.sharedAxis(const SettingsPage(), SharedAxisTransitionType.horizontal),
      );
      return;
    }

    // Check verification for other pages
    if (accessToken != null && email != null) {
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

        if (!isVerified) {
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text('Please verify your account to access this page. Go to Settings to verify.'),
                duration: Duration(seconds: 3),
              ),
            );
          }
          return;
        }
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Unable to verify account status. Please try again.'),
              duration: Duration(seconds: 3),
            ),
          );
        }
        return;
      }
    }

    Widget page;
    switch (pageType) {
      case DashboardPageType.students:
        page = const StudentsPage();
        break;
      case DashboardPageType.lecturers:
        page = const LecturersPage();
        break;
      case DashboardPageType.staff:
        page = const StaffPage();
        break;
      case DashboardPageType.schedule:
        page = const SchedulePage();
        break;
      case DashboardPageType.settings:
        page = const SettingsPage();
        break;
      case DashboardPageType.applications:
        page = const ApplicationsPage();
        break;
    }

    if (mounted) {
      Navigator.push(
        context,
        PageAnimations.sharedAxis(page, SharedAxisTransitionType.horizontal),
      );
    }
  }

  int _safeNumber(dynamic value, int fallback) {
    if (value is num && value.isFinite) {
      return value.toInt();
    }
    return fallback;
  }

  @override
  Widget build(BuildContext context) {
    super.build(context); // Required for AutomaticKeepAliveClientMixin
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final authProvider = Provider.of<AuthProvider>(context);
    final instituteData = authProvider.instituteData;
    final displayName = instituteData['title'] ?? 
                       instituteData['name'] ?? 
                       instituteData['username'] ?? 
                       'Institution';

    return Scaffold(
      backgroundColor: isDark ? AppTheme.navy900 : const Color(0xFFF9FAFB),
      appBar: AppBar(
        leading: Padding(
          padding: const EdgeInsets.only(left: 8.0),
          child: ProfileButton(),
        ),
        title: const Text('Dashboard'),
        elevation: 0,
        backgroundColor: isDark ? AppTheme.navy800 : Colors.white,
        foregroundColor: isDark ? Colors.white : Colors.black,
      ),
      body: Stack(
        children: [
          RefreshIndicator(
            onRefresh: _loadStats,
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : _error != null
                    ? Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.error_outline, size: 64, color: Colors.red.shade400),
                            const SizedBox(height: 16),
                            Text(_error!),
                            const SizedBox(height: 24),
                            ElevatedButton(
                              onPressed: _loadStats,
                              child: const Text('Retry'),
                            ),
                          ],
                        ),
                      )
                    : SingleChildScrollView(
                        padding: const EdgeInsets.all(16),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            // Welcome Header
                            Text(
                              'Welcome back, $displayName',
                              style: theme.textTheme.titleLarge?.copyWith(
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            const SizedBox(height: 24),

                            // Statistics Section
                            Text(
                              'Statistics',
                              style: theme.textTheme.titleMedium?.copyWith(
                                fontWeight: FontWeight.bold,
                                fontSize: 18,
                              ),
                            ),
                            const SizedBox(height: 16),

                            // Statistics Cards Grid
                            GridView.count(
                              shrinkWrap: true,
                              physics: const NeverScrollableScrollPhysics(),
                              crossAxisCount: 2,
                              crossAxisSpacing: 16,
                              mainAxisSpacing: 16,
                              childAspectRatio: 1.1,
                              children: [
                                DashboardStatCard(
                                  title: 'Total Students',
                                  value: _safeNumber(_stats['totalStudents']?['total_students'], 0),
                                  icon: Icons.people,
                                  color: Colors.blue,
                                  index: 0,
                                ),
                                DashboardStatCard(
                                  title: 'Active Students',
                                  value: _safeNumber(_stats['activeStudents']?['active_students'], 0),
                                  icon: Icons.people_outline,
                                  color: Colors.indigo,
                                  index: 1,
                                ),
                                DashboardStatCard(
                                  title: 'Total Lecturers',
                                  value: _safeNumber(_stats['totalLecturers']?['total_lecturers'], 0),
                                  icon: Icons.school,
                                  color: Colors.teal,
                                  index: 2,
                                ),
                                DashboardStatCard(
                                  title: 'Active Lecturers',
                                  value: _safeNumber(_stats['activeLecturers']?['active_lecturers'], 0),
                                  icon: Icons.school_outlined,
                                  color: Colors.green,
                                  index: 3,
                                ),
                                DashboardStatCard(
                                  title: 'Total Staff',
                                  value: _safeNumber(_stats['totalStaff']?['total_staff'], 0),
                                  icon: Icons.business_center,
                                  color: Colors.purple,
                                  index: 4,
                                ),
                                DashboardStatCard(
                                  title: 'Active Staff',
                                  value: _safeNumber(_stats['activeStaff']?['active_staff'], 0),
                                  icon: Icons.business_center_outlined,
                                  color: Colors.pink,
                                  index: 5,
                                ),
                              ],
                            ),

                            const SizedBox(height: 32),

                            // Page Navigation Section
                            Text(
                              'Pages',
                              style: theme.textTheme.titleMedium?.copyWith(
                                fontWeight: FontWeight.bold,
                                fontSize: 18,
                              ),
                            ),
                            const SizedBox(height: 16),

                            // Page Navigation Cards Grid
                            GridView.count(
                              shrinkWrap: true,
                              physics: const NeverScrollableScrollPhysics(),
                              crossAxisCount: 2,
                              crossAxisSpacing: 16,
                              mainAxisSpacing: 16,
                              childAspectRatio: 1.3,
                              children: [
                                DashboardPageCard(
                                  pageType: DashboardPageType.students,
                                  index: 0,
                                  onTap: () => _navigateToPage(DashboardPageType.students),
                                ),
                                DashboardPageCard(
                                  pageType: DashboardPageType.lecturers,
                                  index: 1,
                                  onTap: () => _navigateToPage(DashboardPageType.lecturers),
                                ),
                                DashboardPageCard(
                                  pageType: DashboardPageType.staff,
                                  index: 2,
                                  onTap: () => _navigateToPage(DashboardPageType.staff),
                                ),
                                DashboardPageCard(
                                  pageType: DashboardPageType.schedule,
                                  index: 3,
                                  onTap: () => _navigateToPage(DashboardPageType.schedule),
                                ),
                                DashboardPageCard(
                                  pageType: DashboardPageType.applications,
                                  index: 4,
                                  onTap: () => _navigateToPage(DashboardPageType.applications),
                                ),
                                DashboardPageCard(
                                  pageType: DashboardPageType.settings,
                                  index: 5,
                                  onTap: () => _navigateToPage(DashboardPageType.settings),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
          ),
        ],
      ),
    );
  }
}
