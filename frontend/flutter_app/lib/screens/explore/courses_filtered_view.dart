import 'dart:async';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../config/theme.dart';
import '../../providers/auth_provider.dart';
import '../../widgets/profile_button.dart';
import '../../services/explore_service.dart';
import '../../services/api_service.dart';
import '../../services/profile_service.dart';
import '../explore_screen.dart'; // For CourseCard

class CoursesFilteredView extends StatefulWidget {
  const CoursesFilteredView({super.key});

  @override
  State<CoursesFilteredView> createState() => _CoursesFilteredViewState();
}

class _CoursesFilteredViewState extends State<CoursesFilteredView> {
  final TextEditingController _searchController = TextEditingController();
  Timer? _debounceTimer;
  
  bool _isLoading = false;
  String? _error;
  List<dynamic> _courses = [];
  
  Map<String, dynamic>? _selectedCourse;
  bool _isLoadingCourse = false;
  bool _isEnrolling = false;
  int? _enrollingCourseId;
  Map<String, dynamic>? _enrollmentConflict;
  bool _showEnrollmentConflict = false;

  @override
  void initState() {
    super.initState();
    _searchController.addListener(_onSearchChanged);
    _performSearch();
  }

  @override
  void dispose() {
    _debounceTimer?.cancel();
    _searchController.dispose();
    super.dispose();
  }

  void _onSearchChanged() {
    _debounceTimer?.cancel();
    _debounceTimer = Timer(const Duration(milliseconds: 500), () {
      _performSearch();
    });
  }

  Future<void> _performSearch() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      final accessToken = authProvider.accessToken;
      final refreshToken = authProvider.refreshToken;
      
      final query = _searchController.text.trim();
      
      final data = await ExploreService.exploreSearch(
        query: query,
        filter: 'courses',
        accessToken: accessToken,
        refreshToken: refreshToken,
        onTokenRefreshed: (tokens) {
          authProvider.onTokenRefreshed(tokens);
        },
        onSessionExpired: () {
          authProvider.onSessionExpired();
        },
      );

      final results = data['success'] == true && data['results'] != null
          ? data['results']
          : (data['results'] ?? data);

      if (data['success'] == true || (results is Map)) {
        setState(() {
          _courses = results['courses'] is List ? List.from(results['courses']) : [];
        });
      } else {
        setState(() {
          _courses = [];
        });
      }
    } catch (e) {
      setState(() {
        _error = e is ApiException ? e.message : 'Failed to search. Please try again.';
        _courses = [];
      });
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  void _showCourseSheet(Map<String, dynamic> course) {
    setState(() {
      _isLoadingCourse = true;
      _selectedCourse = course;
    });

    if (course['id'] != null) {
      ExploreService.getCourseDetails(course['id'] as int).then((data) {
        if (mounted) {
          setState(() {
            _selectedCourse = data['success'] == true && data['data'] != null ? data['data'] : course;
            _isLoadingCourse = false;
          });
        }
      }).catchError((e) {
        if (mounted) {
          setState(() {
            _isLoadingCourse = false;
          });
        }
      });
    } else {
      setState(() {
        _isLoadingCourse = false;
      });
    }

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => _buildCourseSheet(),
    ).then((_) {
      setState(() {
        _selectedCourse = null;
      });
    });
  }

  Widget _buildCourseSheet() {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final authProvider = Provider.of<AuthProvider>(context);
    final isStudent = authProvider.instituteData['userType'] == 'student';
    final course = _selectedCourse ?? {};
    final courseImageUrl = _getImageUrl(course['course_image']);

    return Container(
      decoration: BoxDecoration(
        color: isDark ? AppTheme.navy800 : Colors.white,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
      ),
      padding: const EdgeInsets.all(24),
      child: _isLoadingCourse
          ? const Center(child: CircularProgressIndicator())
          : Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (courseImageUrl != null)
                  ClipRRect(
                    borderRadius: BorderRadius.circular(12),
                    child: Image.network(
                      courseImageUrl,
                      width: double.infinity,
                      height: 200,
                      fit: BoxFit.cover,
                      errorBuilder: (context, error, stackTrace) => const SizedBox.shrink(),
                    ),
                  ),
                const SizedBox(height: 16),
                Text(
                  course['title'] ?? 'Course',
                  style: theme.textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold),
                ),
                if (course['about'] != null) ...[
                  const SizedBox(height: 16),
                  Text('About', style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold)),
                  const SizedBox(height: 8),
                  Text(course['about'], style: theme.textTheme.bodyMedium),
                ],
                if (course['starting_date'] != null || course['ending_date'] != null) ...[
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      Icon(Icons.calendar_today, size: 16, color: AppTheme.primary500),
                      const SizedBox(width: 4),
                      Text(
                        '${course['starting_date'] ?? ''} - ${course['ending_date'] ?? ''}',
                        style: theme.textTheme.bodyMedium,
                      ),
                    ],
                  ),
                ],
                if (course['price'] != null) ...[
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      Icon(Icons.attach_money, size: 20, color: AppTheme.primary600),
                      const SizedBox(width: 4),
                      Text(
                        '${course['price']}',
                        style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
                      ),
                    ],
                  ),
                ],
                if (isStudent && course['id'] != null) ...[
                  const SizedBox(height: 24),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: _isEnrolling || _enrollingCourseId == course['id']
                          ? null
                          : () => _handleEnrollCourse(course),
                      child: _isEnrolling && _enrollingCourseId == course['id']
                          ? const SizedBox(
                              height: 20,
                              width: 20,
                              child: CircularProgressIndicator(strokeWidth: 2),
                            )
                          : const Text('Enroll'),
                    ),
                  ),
                ],
                const SizedBox(height: 24),
              ],
            ),
    );
  }

  Future<void> _handleEnrollCourse(Map<String, dynamic> course) async {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    
    if (!authProvider.isAuthenticated) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please log in to enroll')),
      );
      return;
    }

    if (authProvider.instituteData['userType'] != 'student') {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Only students can enroll in courses')),
      );
      return;
    }

    if (!authProvider.isVerified) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please verify your account to enroll')),
      );
      return;
    }

    if (course['id'] == null) return;

    setState(() {
      _isEnrolling = true;
      _enrollingCourseId = course['id'] as int;
    });

    try {
      final checkResponse = await ExploreService.checkStudentFree(
        courseId: course['id'] as int,
        accessToken: authProvider.accessToken!,
        refreshToken: authProvider.refreshToken,
        onTokenRefreshed: (tokens) {
          authProvider.onTokenRefreshed(tokens);
        },
        onSessionExpired: () {
          authProvider.onSessionExpired();
        },
      );

      if (checkResponse['success'] == false && checkResponse['contradiction'] != null) {
        setState(() {
          _enrollmentConflict = checkResponse['contradiction'];
          _showEnrollmentConflict = true;
          _isEnrolling = false;
          _enrollingCourseId = null;
        });
        _showEnrollmentConflictDialog();
        return;
      }

      final enrollResponse = await ExploreService.enrollInCourse(
        courseId: course['id'] as int,
        accessToken: authProvider.accessToken!,
        refreshToken: authProvider.refreshToken,
        onTokenRefreshed: (tokens) {
          authProvider.onTokenRefreshed(tokens);
        },
        onSessionExpired: () {
          authProvider.onSessionExpired();
        },
      );

      if (mounted) {
        if (enrollResponse['success'] == true) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(enrollResponse['message'] ?? 'Enrolled successfully!')),
          );
          Navigator.pop(context);
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(enrollResponse['message'] ?? 'Failed to enroll')),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e is ApiException ? e.message : 'Failed to enroll')),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isEnrolling = false;
          _enrollingCourseId = null;
        });
      }
    }
  }

  void _showEnrollmentConflictDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Schedule Conflict'),
        content: Text(
          _enrollmentConflict?['message'] ?? 
          'This course conflicts with your existing schedule. Please choose a different course.',
        ),
        actions: [
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              setState(() {
                _showEnrollmentConflict = false;
                _enrollmentConflict = null;
              });
            },
            child: const Text('OK'),
          ),
        ],
      ),
    );
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

    return Scaffold(
      backgroundColor: isDark ? AppTheme.navy900 : const Color(0xFFF9FAFB),
      appBar: AppBar(
        elevation: 0,
        backgroundColor: isDark ? AppTheme.navy800 : Colors.white,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => Navigator.pop(context),
        ),
        title: TextField(
          controller: _searchController,
          decoration: InputDecoration(
            hintText: 'Search courses...',
            prefixIcon: const Icon(Icons.search),
            suffixIcon: _searchController.text.isNotEmpty
                ? IconButton(
                    icon: const Icon(Icons.clear),
                    onPressed: () {
                      _searchController.clear();
                    },
                  )
                : null,
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide(color: Colors.grey.shade300),
            ),
            filled: true,
            fillColor: isDark ? AppTheme.navy700 : Colors.grey.shade100,
          ),
        ),
      ),
      body: _isLoading
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
                        onPressed: _performSearch,
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
                          Icon(Icons.search_off, size: 64, color: Colors.grey.shade400),
                          const SizedBox(height: 16),
                          Text(
                            'No courses found',
                            style: TextStyle(color: Colors.grey.shade600),
                          ),
                        ],
                      ),
                    )
                  : RefreshIndicator(
                      onRefresh: _performSearch,
                      child: ListView.builder(
                        padding: const EdgeInsets.all(16),
                        itemCount: _courses.length,
                        itemBuilder: (context, index) {
                          return Padding(
                            padding: const EdgeInsets.only(bottom: 12),
                            child: CourseCard(
                              course: _courses[index],
                              onTap: () => _showCourseSheet(_courses[index]),
                            )
                                .animate()
                                .fadeIn(
                                  duration: 300.ms,
                                  delay: (index * 50).ms,
                                )
                                .slideX(
                                  begin: 0.2,
                                  end: 0,
                                  duration: 300.ms,
                                  delay: (index * 50).ms,
                                ),
                          );
                        },
                      ),
                    ),
    );
  }
}

