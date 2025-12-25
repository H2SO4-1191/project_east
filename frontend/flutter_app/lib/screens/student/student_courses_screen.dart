import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../providers/theme_provider.dart';
import '../../config/theme.dart';
import '../../services/student_service.dart';
import '../../services/explore_service.dart';
import '../../services/api_service.dart';
import '../../widgets/language_switcher.dart';
import '../../widgets/modern_bottom_nav.dart';
import '../../widgets/enhanced_loading_indicator.dart';

class StudentCoursesScreen extends StatefulWidget {
  const StudentCoursesScreen({super.key});

  @override
  State<StudentCoursesScreen> createState() => _StudentCoursesScreenState();
}

class _StudentCoursesScreenState extends State<StudentCoursesScreen>
    with TickerProviderStateMixin {
  List<dynamic> _courses = [];
  bool _isLoading = true;
  String? _error;
  String? _firstName;
  
  late AnimationController _coursesCardController;
  late AnimationController _priceCardController;

  @override
  void initState() {
    super.initState();
    _fetchCourses();
    
    // Initialize animation controllers for stat cards
    _coursesCardController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 600),
    );
    _priceCardController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 600),
    );
    
    // Start animations with staggered delays
    Future.delayed(const Duration(milliseconds: 300), () {
      if (mounted) {
        _coursesCardController.forward();
      }
    });
    Future.delayed(const Duration(milliseconds: 400), () {
      if (mounted) {
        _priceCardController.forward();
      }
    });
  }
  
  @override
  void dispose() {
    _coursesCardController.dispose();
    _priceCardController.dispose();
    super.dispose();
  }

  Future<void> _fetchCourses() async {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final accessToken = authProvider.instituteData['accessToken'];
    final refreshToken = authProvider.instituteData['refreshToken'];

    if (accessToken == null) {
      setState(() {
        _error = 'Authentication required';
        _isLoading = false;
      });
      return;
    }

    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      // First, load student profile in the background to get username
      final profileResponse = await ApiService.getStudentMyProfile(
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

      // Extract username from profile
      final profileData = profileResponse['data'] ?? profileResponse;
      final username = profileData['username'];
      final profileFirstName = profileData['first_name'];

      if (username == null || username.toString().isEmpty) {
        setState(() {
          _error = 'Username not found in profile';
          _isLoading = false;
        });
        return;
      }

      // Now fetch courses using the username from profile
      final response = await StudentService.getStudentCourses(username.toString());
      
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
        _firstName = (profileFirstName?.toString().trim().isNotEmpty ?? false)
            ? profileFirstName.toString().trim()
            : _firstName;
      });
    } catch (e) {
      setState(() {
        _error = e is ApiException ? e.message : 'Failed to load courses';
      });
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
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
          ? const FullScreenLoading(message: 'Loading your courses...')
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
                                    'Hello, ${_firstName ?? instituteData['firstName'] ?? instituteData['username'] ?? 'Student'}!',
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
                        // Stats Cards with animations
                        Row(
                          children: [
                            Expanded(
                              child: _buildAnimatedStatCard(
                                context,
                                isDark,
                                Icons.book_rounded,
                                'Enrolled Courses',
                                '$totalCourses',
                                Colors.blue,
                                _coursesCardController,
                                0,
                              ),
                            ),
                            const SizedBox(width: 16),
                            Expanded(
                              child: _buildAnimatedStatCard(
                                context,
                                isDark,
                                Icons.attach_money_rounded,
                                'Total Price',
                                '\$${totalPrice.toStringAsFixed(2)}',
                                Colors.green,
                                _priceCardController,
                                1,
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
      bottomNavigationBar: ModernBottomNav(
        currentIndex: 1,
        onTap: (index) {
          if (index == 0) {
            Navigator.pushNamedAndRemoveUntil(context, '/', (route) => false);
          } else if (index == 2) {
            Navigator.pushNamedAndRemoveUntil(context, '/', (route) => false);
            Navigator.pushNamed(context, '/explore');
          }
        },
      ),
    );
  }

  Widget _buildAnimatedStatCard(
    BuildContext context,
    bool isDark,
    IconData icon,
    String label,
    String value,
    Color color,
    AnimationController controller,
    int index,
  ) {
    // Create enhanced gradient colors based on the base color
    final gradientColors = _getEnhancedGradientColors(color);
    
    // Animations
    final slideAnimation = Tween<Offset>(
      begin: Offset(0, 0.3 + (index * 0.1)),
      end: Offset.zero,
    ).animate(CurvedAnimation(
      parent: controller,
      curve: Curves.easeOutCubic,
    ));
    
    final fadeAnimation = Tween<double>(
      begin: 0.0,
      end: 1.0,
    ).animate(CurvedAnimation(
      parent: controller,
      curve: const Interval(0.0, 0.8, curve: Curves.easeOut),
    ));
    
    final scaleAnimation = Tween<double>(
      begin: 0.8,
      end: 1.0,
    ).animate(CurvedAnimation(
      parent: controller,
      curve: Curves.easeOutBack,
    ));
    
    return AnimatedBuilder(
      animation: controller,
      builder: (context, child) {
        return FadeTransition(
          opacity: fadeAnimation,
          child: SlideTransition(
            position: slideAnimation,
            child: Transform.scale(
              scale: scaleAnimation.value,
              child: child,
            ),
          ),
        );
      },
      child: Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: gradientColors,
          ),
          borderRadius: BorderRadius.circular(24),
          boxShadow: [
            BoxShadow(
              color: color.withOpacity(0.4),
              blurRadius: 20,
              offset: const Offset(0, 10),
              spreadRadius: 2,
            ),
            BoxShadow(
              color: Colors.black.withOpacity(0.1),
              blurRadius: 15,
              offset: const Offset(0, 5),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            // Icon with enhanced background
            Container(
              width: 64,
              height: 64,
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.3),
                borderRadius: BorderRadius.circular(18),
                border: Border.all(
                  color: Colors.white.withOpacity(0.5),
                  width: 2,
                ),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.15),
                    blurRadius: 12,
                    offset: const Offset(0, 6),
                  ),
                  BoxShadow(
                    color: Colors.white.withOpacity(0.2),
                    blurRadius: 8,
                    offset: const Offset(-2, -2),
                  ),
                ],
              ),
              child: Icon(
                icon,
                color: Colors.white,
                size: 32,
              ),
            ),
            const SizedBox(height: 20),
            // Label with better styling
            Text(
              label,
              style: TextStyle(
                fontSize: 13,
                color: Colors.white.withOpacity(0.95),
                fontWeight: FontWeight.w600,
                letterSpacing: 0.8,
              ),
            ),
            const SizedBox(height: 10),
            // Value with enhanced styling
            Row(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Flexible(
                  child: Text(
                    value,
                    style: const TextStyle(
                      fontSize: 32,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                      height: 1.0,
                      letterSpacing: -1.0,
                      shadows: [
                        Shadow(
                          color: Colors.black26,
                          blurRadius: 4,
                          offset: Offset(0, 2),
                        ),
                      ],
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                // Decorative element
                Container(
                  margin: const EdgeInsets.only(left: 4, bottom: 4),
                  width: 6,
                  height: 6,
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.8),
                    shape: BoxShape.circle,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
  
  List<Color> _getEnhancedGradientColors(Color baseColor) {
    // Create enhanced, more vibrant gradients based on the base color
    if (baseColor == Colors.blue) {
      return [
        Colors.blue.shade700,
        Colors.blue.shade500,
        Colors.blue.shade400,
      ];
    } else if (baseColor == Colors.green) {
      return [
        Colors.green.shade700,
        Colors.teal.shade500,
        Colors.teal.shade400,
      ];
    } else if (baseColor == Colors.purple) {
      return [
        Colors.purple.shade700,
        Colors.purple.shade500,
        Colors.purple.shade400,
      ];
    } else {
      // Default gradient - use the base color with opacity variations
      return [
        baseColor,
        Color.lerp(baseColor, Colors.white, 0.2) ?? baseColor,
        Color.lerp(baseColor, Colors.white, 0.4) ?? baseColor,
      ];
    }
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
    final courseId = course['id'] as int?;

    return InkWell(
      onTap: courseId != null
          ? () async {
              // Show loading indicator
              showDialog(
                context: context,
                barrierDismissible: false,
                builder: (context) => const Center(
                  child: EnhancedLoadingIndicator(),
                ),
              );

              try {
                // Fetch course details first using GET /course/<course_id>/
                await ExploreService.getCourseDetails(courseId);
                
                // Close loading dialog
                if (context.mounted) {
                  Navigator.pop(context);
                }

                // Navigate to course details page
                if (context.mounted) {
                  Navigator.pushNamed(
                    context,
                    '/student/course',
                    arguments: courseId,
                  );
                }
              } catch (e) {
                // Close loading dialog
                if (context.mounted) {
                  Navigator.pop(context);
                }

                // Show error message
                if (context.mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text(
                        e is ApiException
                            ? e.message
                            : 'Failed to load course details',
                      ),
                      backgroundColor: Colors.red,
                    ),
                  );
                }
              }
            }
          : null,
      borderRadius: BorderRadius.circular(16),
      child: Container(
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
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Full-width image header with gradient overlay
            Stack(
              children: [
                Container(
                  width: double.infinity,
                  height: 180,
                  decoration: BoxDecoration(
                    borderRadius: const BorderRadius.vertical(
                      top: Radius.circular(16),
                    ),
                    image: courseImageUrl != null
                        ? DecorationImage(
                            image: NetworkImage(courseImageUrl),
                            fit: BoxFit.cover,
                            onError: (exception, stackTrace) {},
                          )
                        : null,
                    color: courseImageUrl == null
                        ? (isDark ? AppTheme.navy700 : Colors.grey.shade300)
                        : null,
                  ),
                  child: courseImageUrl == null
                      ? Center(
                          child: Icon(
                            Icons.book,
                            size: 64,
                            color: isDark
                                ? AppTheme.navy500
                                : Colors.grey.shade600,
                          ),
                        )
                      : null,
                ),
                // Gradient overlay
                Container(
                  width: double.infinity,
                  height: 180,
                  decoration: BoxDecoration(
                    borderRadius: const BorderRadius.vertical(
                      top: Radius.circular(16),
                    ),
                    gradient: LinearGradient(
                      begin: Alignment.topCenter,
                      end: Alignment.bottomCenter,
                      colors: [
                        Colors.transparent,
                        Colors.black.withOpacity(0.6),
                      ],
                    ),
                  ),
                ),
                // Level badge positioned on image
                if (course['level'] != null)
                  Positioned(
                    top: 12,
                    left: 12,
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 12,
                        vertical: 6,
                      ),
                      decoration: BoxDecoration(
                        color: levelColor.withOpacity(0.9),
                        borderRadius: BorderRadius.circular(20),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withOpacity(0.2),
                            blurRadius: 4,
                            offset: const Offset(0, 2),
                          ),
                        ],
                      ),
                      child: Text(
                        (course['level'] as String).toUpperCase(),
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                          letterSpacing: 0.5,
                        ),
                      ),
                    ),
                  ),
                // Price badge positioned on image
                if (course['price'] != null)
                  Positioned(
                    top: 12,
                    right: 12,
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 14,
                        vertical: 8,
                      ),
                      decoration: BoxDecoration(
                        gradient: const LinearGradient(
                          colors: [AppTheme.primary600, AppTheme.teal500],
                        ),
                        borderRadius: BorderRadius.circular(20),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withOpacity(0.2),
                            blurRadius: 4,
                            offset: const Offset(0, 2),
                          ),
                        ],
                      ),
                      child: Text(
                        '\$${course['price']}',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ),
                // Course title on image
                Positioned(
                  bottom: 16,
                  left: 16,
                  right: 16,
                  child: Text(
                    course['title'] ?? 'Course',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 22,
                      fontWeight: FontWeight.bold,
                      shadows: [
                        Shadow(
                          color: Colors.black54,
                          blurRadius: 4,
                          offset: Offset(0, 2),
                        ),
                      ],
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ],
            ),
            // Content section
            Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // About section
                  if (course['about'] != null) ...[
                    Text(
                      course['about'],
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        fontSize: 14,
                        color: Colors.grey.shade600,
                        height: 1.4,
                      ),
                    ),
                    const SizedBox(height: 16),
                  ],
                  // Date containers
                  Row(
                    children: [
                      if (course['starting_date'] != null)
                        Expanded(
                          child: Container(
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: isDark
                                  ? AppTheme.navy700
                                  : Colors.blue.shade50,
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Row(
                              children: [
                                Icon(
                                  Icons.calendar_today,
                                  size: 16,
                                  color: Colors.blue.shade700,
                                ),
                                const SizedBox(width: 8),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        'Start Date',
                                        style: TextStyle(
                                          fontSize: 10,
                                          color: Colors.grey.shade600,
                                        ),
                                      ),
                                      const SizedBox(height: 2),
                                      Text(
                                        _formatDate(course['starting_date']),
                                        style: TextStyle(
                                          fontSize: 12,
                                          fontWeight: FontWeight.w600,
                                          color: Colors.blue.shade700,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      if (course['starting_date'] != null &&
                          course['ending_date'] != null)
                        const SizedBox(width: 12),
                      if (course['ending_date'] != null)
                        Expanded(
                          child: Container(
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: isDark
                                  ? AppTheme.navy700
                                  : Colors.red.shade50,
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Row(
                              children: [
                                Icon(
                                  Icons.event,
                                  size: 16,
                                  color: Colors.red.shade700,
                                ),
                                const SizedBox(width: 8),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        'End Date',
                                        style: TextStyle(
                                          fontSize: 10,
                                          color: Colors.grey.shade600,
                                        ),
                                      ),
                                      const SizedBox(height: 2),
                                      Text(
                                        _formatDate(course['ending_date']),
                                        style: TextStyle(
                                          fontSize: 12,
                                          fontWeight: FontWeight.w600,
                                          color: Colors.red.shade700,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
