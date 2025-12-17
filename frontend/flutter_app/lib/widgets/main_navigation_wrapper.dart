import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../screens/feed_screen.dart';
import '../screens/dashboard/dashboard_screen.dart';
import '../screens/explore_screen.dart';
import '../screens/dashboard/create_course_page.dart';
import '../screens/dashboard/edit_courses_page.dart';
import '../screens/dashboard/create_post_page.dart';
import '../screens/dashboard/create_job_post_page.dart';
import '../screens/dashboard/applications_page.dart';
import 'modern_bottom_nav.dart';

class MainNavigationWrapper extends StatefulWidget {
  const MainNavigationWrapper({super.key});

  @override
  State<MainNavigationWrapper> createState() => _MainNavigationWrapperState();
}

class _MainNavigationWrapperState extends State<MainNavigationWrapper> {
  int _currentIndex = 0;
  final PageController _pageController = PageController();
  
  // Cache pages to prevent recreation - initialize lazily
  List<Widget>? _cachedPages;

  List<Widget> get _pages {
    if (_cachedPages == null) {
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      final userType = authProvider.instituteData['userType'] ?? '';
      final isInstitute = userType == 'institution';
      
      _cachedPages = [
        const FeedScreen(),
        isInstitute ? const DashboardScreen() : const FeedScreen(),
        const ExploreScreen(),
      ];
    }
    return _cachedPages!;
  }

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  void _onTabTapped(int index) {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final isAuthenticated = authProvider.isAuthenticated;
    final userType = authProvider.instituteData['userType'] ?? '';
    final isInstitute = userType == 'institution';
    
    // Middle button (index 1) is handled by ModernBottomNav:
    // - Non-authenticated: shows login/signup prompt
    // - Students/Lecturers: shows academic submenu
    // - Institutes: navigates to dashboard (or opens modal if already on dashboard)
    if (index == 1) {
      if (!isAuthenticated || !isInstitute) {
        // Handled by ModernBottomNav
        return;
      }
      // If already on dashboard, ModernBottomNav will handle opening the modal
      // Otherwise, navigate to dashboard
      if (_currentIndex != 1) {
        setState(() {
          _currentIndex = index;
        });
        _pageController.animateToPage(
          index,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOutCubic,
        );
      }
      return;
    }
    
    setState(() {
      _currentIndex = index;
    });
    _pageController.animateToPage(
      index,
      duration: const Duration(milliseconds: 300),
      curve: Curves.easeOutCubic,
    );
  }

  void _handleActionSelected(String action) {
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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: PageView(
        controller: _pageController,
        onPageChanged: (index) {
          setState(() {
            _currentIndex = index;
          });
        },
        children: _pages,
      ),
      bottomNavigationBar: ModernBottomNav(
        currentIndex: _currentIndex,
        onTap: _onTabTapped,
        onActionSelected: _handleActionSelected,
      ),
    );
  }
}

