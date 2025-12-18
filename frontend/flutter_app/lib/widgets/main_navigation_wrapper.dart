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
  
  // Cache pages to prevent recreation - but always check current userType
  List<Widget>? _cachedPages;
  String? _cachedUserType;

  List<Widget> get _pages {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final userType = authProvider.instituteData['userType'] ?? '';
    final isInstitute = userType == 'institution';
    
    // Re-initialize pages if userType changed or pages not yet cached
    if (_cachedPages == null || _cachedUserType != userType) {
      _cachedUserType = userType;
      if (isInstitute) {
        // For institutions: Feed -> Dashboard -> Explore (3 pages)
        _cachedPages = [
          const FeedScreen(),
          const DashboardScreen(),
          const ExploreScreen(),
        ];
      } else {
        // For guests, students, lecturers: Feed -> Explore (2 pages, skip dashboard)
        _cachedPages = [
          const FeedScreen(),
          const ExploreScreen(),
        ];
      }
    }
    return _cachedPages!;
  }

  // Map bottom navigation index to page index
  int _getPageIndexFromBottomNav(int bottomNavIndex) {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final userType = authProvider.instituteData['userType'] ?? '';
    final isInstitute = userType == 'institution';
    
    if (isInstitute) {
      // For institutions: direct mapping (0->0, 1->1, 2->2)
      return bottomNavIndex;
    } else {
      // For non-institutions: map (0->0, 1->skip, 2->1)
      if (bottomNavIndex == 0) return 0; // Feed
      if (bottomNavIndex == 2) return 1; // Explore
      return 0; // Default to Feed for index 1 (handled by ModernBottomNav)
    }
  }

  // Map page index to bottom navigation index
  int _getBottomNavIndexFromPage(int pageIndex) {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final userType = authProvider.instituteData['userType'] ?? '';
    final isInstitute = userType == 'institution';
    
    if (isInstitute) {
      // For institutions: direct mapping
      return pageIndex;
    } else {
      // For non-institutions: map (0->0, 1->2)
      if (pageIndex == 0) return 0; // Feed
      if (pageIndex == 1) return 2; // Explore
      return 0;
    }
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
      // Ensure pages are correctly initialized for institution
      // Force re-evaluation of pages to ensure dashboard is at index 1
      final currentUserType = authProvider.instituteData['userType'] ?? '';
      if (_cachedUserType != currentUserType) {
        _cachedPages = null; // Force re-initialization
        _cachedUserType = currentUserType;
      }
      
      // If already on dashboard, ModernBottomNav will handle opening the modal
      // Otherwise, navigate to dashboard
      final pageIndex = _getPageIndexFromBottomNav(index);
      if (_currentIndex != index) {
        setState(() {
          _currentIndex = index;
        });
        _pageController.animateToPage(
          pageIndex,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOutCubic,
        );
      }
      return;
    }
    
    // Map bottom nav index to page index
    final pageIndex = _getPageIndexFromBottomNav(index);
    
    setState(() {
      _currentIndex = index;
    });
    _pageController.animateToPage(
      pageIndex,
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
    final authProvider = Provider.of<AuthProvider>(context);
    final userType = authProvider.instituteData['userType'] ?? '';
    
    // Use userType as key to force PageView rebuild when userType changes
    return Scaffold(
      body: PageView(
        key: ValueKey('pages_$userType'),
        controller: _pageController,
        onPageChanged: (pageIndex) {
          // Map page index back to bottom nav index
          final bottomNavIndex = _getBottomNavIndexFromPage(pageIndex);
          setState(() {
            _currentIndex = bottomNavIndex;
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

