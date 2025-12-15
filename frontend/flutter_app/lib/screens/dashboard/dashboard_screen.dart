import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../config/theme.dart';
import '../../providers/auth_provider.dart';
import '../../providers/theme_provider.dart';
import '../../widgets/language_switcher.dart';
import 'overview_page.dart';
import 'students_page.dart';
import 'lecturers_page.dart';
import 'schedule_page.dart';
import 'staff_page.dart';
import 'settings_page.dart';
import 'create_course_page.dart';
import 'edit_courses_page.dart';
import 'create_post_page.dart';
import 'create_job_post_page.dart';
import 'applications_page.dart';
import '../feed_screen.dart';
import '../../widgets/floating_action_menu.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  String _activeSection = 'overview';
  final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey<ScaffoldState>();

  final List<Map<String, dynamic>> _sections = [
    {'id': 'overview', 'name': 'Overview', 'icon': Icons.dashboard},
    {'id': 'feed', 'name': 'Feed', 'icon': Icons.article},
    {'id': 'students', 'name': 'Students', 'icon': Icons.people},
    {'id': 'lecturers', 'name': 'Lecturers', 'icon': Icons.school},
    {'id': 'staff', 'name': 'Staff', 'icon': Icons.business_center},
    {'id': 'schedule', 'name': 'Schedule', 'icon': Icons.calendar_today},
    {'id': 'settings', 'name': 'Settings', 'icon': Icons.settings},
  ];

  void _handleLogout() {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    authProvider.logout();
    Navigator.pushNamedAndRemoveUntil(context, '/', (route) => false);
  }

  void _handleFloatingMenuAction(String action) {
    switch (action) {
      case 'create_course':
        Navigator.push(
          context,
          MaterialPageRoute(builder: (context) => const CreateCoursePage()),
        );
        break;
      case 'edit_courses':
        Navigator.push(
          context,
          MaterialPageRoute(builder: (context) => const EditCoursesPage()),
        );
        break;
      case 'create_post':
        Navigator.push(
          context,
          MaterialPageRoute(builder: (context) => const CreatePostPage()),
        );
        break;
      case 'job_post':
        Navigator.push(
          context,
          MaterialPageRoute(builder: (context) => const CreateJobPostPage()),
        );
        break;
      case 'applications':
        Navigator.push(
          context,
          MaterialPageRoute(builder: (context) => const ApplicationsPage()),
        );
        break;
    }
  }

  void _showAnimatedDrawer() {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final instituteData = authProvider.instituteData;
    final isAuthenticated = instituteData['isAuthenticated'] == true;

    showGeneralDialog(
      context: context,
      barrierDismissible: true,
      barrierLabel: MaterialLocalizations.of(context).modalBarrierDismissLabel,
      barrierColor: Colors.black.withOpacity(0.5),
      transitionDuration: const Duration(milliseconds: 300),
      pageBuilder: (context, animation, secondaryAnimation) {
        return _AnimatedDrawerContent(
          animation: animation,
          isDark: isDark,
          isAuthenticated: isAuthenticated,
          instituteData: instituteData,
          drawerContent: _buildDrawerContent(isDark, isAuthenticated, instituteData),
        );
      },
    );
  }

  Widget _buildDrawerContent(bool isDark, bool isAuthenticated, Map<String, dynamic> instituteData) {
    return ListView(
      padding: EdgeInsets.zero,
      children: [
        DrawerHeader(
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              colors: [AppTheme.primary600, AppTheme.teal500],
            ),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisAlignment: MainAxisAlignment.end,
            children: [
              const Text(
                'Project East',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                ),
              ),
              if (isAuthenticated)
                Padding(
                  padding: const EdgeInsets.only(top: 8.0),
                  child: Text(
                    instituteData['username'] ?? instituteData['name'] ?? 'User',
                    style: const TextStyle(
                      color: Colors.white70,
                      fontSize: 16,
                    ),
                  ),
                ),
            ],
          ),
        ),
        // Navigation sections
        ..._sections.map((section) {
          final isSelected = _activeSection == section['id'];
          return ListTile(
            leading: Icon(
              section['icon'] as IconData,
              color: isSelected ? AppTheme.primary600 : null,
          ),
            title: Text(
              section['name'] as String,
              style: TextStyle(
                fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                color: isSelected ? AppTheme.primary600 : null,
              ),
            ),
            selected: isSelected,
            onTap: () {
              Navigator.pop(context);
              setState(() {
                _activeSection = section['id'] as String;
              });
            },
          );
        }),
        const Divider(),
        Consumer<ThemeProvider>(
          builder: (context, themeProvider, child) {
            return ListTile(
              leading: Icon(themeProvider.isDark 
                  ? Icons.wb_sunny 
                  : Icons.nightlight_round),
              title: Text(themeProvider.isDark 
                  ? 'Light Mode' 
                  : 'Dark Mode'),
              onTap: () {
                themeProvider.toggleTheme();
            },
            );
          },
        ),
        const Divider(),
        const LanguageSwitcher(isInDrawer: true),
        const Divider(),
        ListTile(
          leading: const Icon(Icons.logout, color: Colors.red),
          title: const Text('Logout', style: TextStyle(color: Colors.red)),
          onTap: () {
            Navigator.pop(context);
            _handleLogout();
          },
          ),
        ],
    );
  }

  Widget _buildCurrentPage() {
    switch (_activeSection) {
      case 'overview':
        return const OverviewPage();
      case 'feed':
        return const FeedScreen();
      case 'students':
        return const StudentsPage();
      case 'lecturers':
        return const LecturersPage();
      case 'staff':
        return const StaffPage();
      case 'schedule':
        return const SchedulePage();
      case 'settings':
        return const SettingsPage();
      default:
        return const OverviewPage();
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Scaffold(
      key: _scaffoldKey,
      appBar: AppBar(
        title: Text(
          _sections.firstWhere((s) => s['id'] == _activeSection)['name'] as String,
                ),
        elevation: 0,
        backgroundColor: isDark ? AppTheme.navy800 : Colors.white,
        foregroundColor: isDark ? Colors.white : Colors.black,
      ),
      body: Stack(
        children: [
          _buildCurrentPage(),
          // Floating Action Menu - positioned in bottom right
          Positioned(
            bottom: 16,
            right: 16,
            child: FloatingActionMenu(
              onActionSelected: _handleFloatingMenuAction,
              onDrawerButtonPressed: _showAnimatedDrawer,
            ),
          ),
        ],
      ),
    );
  }
}

class _AnimatedDrawerContent extends StatelessWidget {
  final Animation<double> animation;
  final bool isDark;
  final bool isAuthenticated;
  final Map<String, dynamic> instituteData;
  final Widget drawerContent;

  const _AnimatedDrawerContent({
    required this.animation,
    required this.isDark,
    required this.isAuthenticated,
    required this.instituteData,
    required this.drawerContent,
  });

  @override
  Widget build(BuildContext context) {
    final fadeAnimation = Tween<double>(
      begin: 0.0,
      end: 1.0,
    ).animate(
      CurvedAnimation(
        parent: animation,
        curve: Curves.easeInOut,
      ),
    );

    final slideAnimation = Tween<Offset>(
      begin: const Offset(-1.0, 0.0),
      end: Offset.zero,
    ).animate(
      CurvedAnimation(
        parent: animation,
        curve: Curves.easeOutCubic,
      ),
    );

    return GestureDetector(
      onTap: () => Navigator.of(context).pop(),
      child: Container(
        color: Colors.transparent,
        child: Stack(
                    children: [
            // Backdrop
            FadeTransition(
              opacity: fadeAnimation,
              child: Container(
                color: Colors.black.withOpacity(0.5),
              ),
            ),
            // Drawer
            SlideTransition(
              position: slideAnimation,
              child: FadeTransition(
                opacity: fadeAnimation,
                child: GestureDetector(
                  onTap: () {}, // Prevent closing when tapping inside drawer
                  child: Material(
                    color: isDark ? AppTheme.navy800 : Colors.white,
                    child: Container(
                      width: MediaQuery.of(context).size.width * 0.75,
                      child: SafeArea(
                        child: drawerContent,
                            ),
                          ),
                      ),
                    ),
                  ),
                ),
              ],
            ),
      ),
    );
  }
}
