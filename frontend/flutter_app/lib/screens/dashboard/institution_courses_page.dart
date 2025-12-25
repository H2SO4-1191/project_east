import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../config/theme.dart';
import '../../providers/auth_provider.dart';
import '../../services/api_service.dart';
import '../../widgets/modern_bottom_nav.dart';
import '../../utils/navigation_helper.dart';
import 'institution_course_detail_page.dart';

class InstitutionCoursesPage extends StatefulWidget {
  const InstitutionCoursesPage({super.key});

  @override
  State<InstitutionCoursesPage> createState() => _InstitutionCoursesPageState();
}

class _InstitutionCoursesPageState extends State<InstitutionCoursesPage>
    with TickerProviderStateMixin {
  List<dynamic> _courses = [];
  bool _isLoading = true;
  String? _error;
  String? _institutionUsername;
  List<AnimationController> _animationControllers = [];

  @override
  void initState() {
    super.initState();
    _loadInstitutionUsername();
  }

  @override
  void dispose() {
    for (var controller in _animationControllers) {
      controller.dispose();
    }
    super.dispose();
  }

  Future<void> _loadInstitutionUsername() async {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final accessToken = authProvider.instituteData['accessToken'];
    final refreshToken = authProvider.instituteData['refreshToken'];

    if (accessToken == null) {
      setState(() {
        _error = 'Not authenticated';
        _isLoading = false;
      });
      return;
    }

    try {
      final username = await ApiService.getInstitutionUsername(
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

      if (username != null) {
        setState(() {
          _institutionUsername = username;
        });
        _loadCourses();
      } else {
        setState(() {
          _error = 'Failed to load institution username';
          _isLoading = false;
        });
      }
    } catch (e) {
      setState(() {
        _error = e is ApiException ? e.message : 'Failed to load username';
        _isLoading = false;
      });
    }
  }

  Future<void> _loadCourses() async {
    if (_institutionUsername == null) return;

    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final response = await ApiService.getInstitutionCourses(_institutionUsername!);
      
      if (response['success'] == true && response['courses'] != null) {
        final courses = List.from(response['courses']);
        setState(() {
          _courses = courses;
          _isLoading = false;
        });
        
        // Initialize animation controllers
        _animationControllers.clear();
        for (int i = 0; i < courses.length; i++) {
          final controller = AnimationController(
            vsync: this,
            duration: const Duration(milliseconds: 600),
          );
          _animationControllers.add(controller);
          
          Future.delayed(Duration(milliseconds: 100 + (i * 100)), () {
            if (mounted && controller.value == 0) {
              controller.forward();
            }
          });
        }
      } else {
        setState(() {
          _courses = [];
          _isLoading = false;
        });
      }
    } catch (e) {
      setState(() {
        _error = e is ApiException ? e.message : 'Failed to load courses';
        _isLoading = false;
      });
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

  String _formatPrice(dynamic price) {
    if (price == null) return 'Free';
    final priceValue = double.tryParse(price.toString()) ?? 0.0;
    if (priceValue == 0.0) {
      return 'Free';
    }
    return '\$${priceValue.toStringAsFixed(2)}';
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

    return Scaffold(
      backgroundColor: isDark ? AppTheme.navy900 : const Color(0xFFF9FAFB),
      appBar: AppBar(
        elevation: 0,
        backgroundColor: isDark ? AppTheme.navy800 : Colors.white,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => Navigator.pop(context),
        ),
        title: const Text(
          'My Courses',
          style: TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.bold,
          ),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadCourses,
            tooltip: 'Refresh',
          ),
        ],
      ),
      bottomNavigationBar: ModernBottomNav(
        currentIndex: 1,
        onTap: (index) {
          NavigationHelper.handleBottomNavTap(context, index);
        },
      ),
      body: _isLoading
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
                      Text(
                        _error!,
                        style: theme.textTheme.bodyLarge,
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 24),
                      ElevatedButton(
                        onPressed: _loadInstitutionUsername,
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
                          Icon(
                            Icons.book_outlined,
                            size: 64,
                            color: isDark ? Colors.white54 : Colors.grey.shade400,
                          ),
                          const SizedBox(height: 16),
                          Text(
                            'No courses found',
                            style: TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                              color: isDark ? Colors.white70 : Colors.grey.shade700,
                            ),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            'You haven\'t created any courses yet',
                            style: TextStyle(
                              color: isDark ? Colors.white54 : Colors.grey.shade600,
                            ),
                          ),
                        ],
                      ),
                    )
                  : RefreshIndicator(
                      onRefresh: _loadCourses,
                      color: AppTheme.primary600,
                      child: ListView.builder(
                        padding: const EdgeInsets.all(16),
                        itemCount: _courses.length,
                        itemBuilder: (context, index) {
                          final course = _courses[index];
                          return _buildAnimatedCourseCard(
                            course,
                            isDark,
                            index < _animationControllers.length
                                ? _animationControllers[index]
                                : null,
                          );
                        },
                      ),
                    ),
    );
  }

  Widget _buildAnimatedCourseCard(
    Map<String, dynamic> course,
    bool isDark,
    AnimationController? controller,
  ) {
    if (controller == null) {
      return _buildCourseCard(course, isDark);
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
      child: _buildCourseCard(course, isDark),
    );
  }

  Widget _buildCourseCard(Map<String, dynamic> course, bool isDark) {
    final courseImageUrl = _getImageUrl(course['course_image']);
    final courseTitle = course['title'] ?? 'Course';
    final price = _formatPrice(course['price']);
    final level = course['level'] ?? '';
    final levelColor = _getLevelColor(level);

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
          onTap: () {
            Navigator.push(
              context,
              MaterialPageRoute(
                builder: (context) => InstitutionCourseDetailPage(
                  courseId: course['id'] ?? course['course_id'],
                ),
              ),
            );
          },
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Course Image
              ClipRRect(
                borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
                child: Container(
                  width: double.infinity,
                  height: 200,
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: [
                        AppTheme.primary600.withOpacity(0.8),
                        AppTheme.teal500.withOpacity(0.8),
                      ],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                  ),
                  child: courseImageUrl != null
                      ? Image.network(
                          courseImageUrl,
                          fit: BoxFit.cover,
                          errorBuilder: (context, error, stackTrace) {
                            return _buildImagePlaceholder(courseTitle);
                          },
                        )
                      : _buildImagePlaceholder(courseTitle),
                ),
              ),
              
              // Course Info
              Padding(
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Title and Price Row
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Expanded(
                          child: Text(
                            courseTitle,
                            style: TextStyle(
                              fontSize: 20,
                              fontWeight: FontWeight.bold,
                              color: isDark ? Colors.white : Colors.grey.shade800,
                            ),
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        const SizedBox(width: 12),
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 12,
                            vertical: 6,
                          ),
                          decoration: BoxDecoration(
                            gradient: price == 'Free'
                                ? null
                                : const LinearGradient(
                                    colors: [AppTheme.primary600, AppTheme.teal500],
                                  ),
                            color: price == 'Free' ? Colors.green : null,
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Text(
                            price,
                            style: const TextStyle(
                              color: Colors.white,
                              fontWeight: FontWeight.bold,
                              fontSize: 14,
                            ),
                          ),
                        ),
                      ],
                    ),
                    
                    const SizedBox(height: 12),
                    
                    // Level Badge
                    if (level.isNotEmpty)
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 10,
                          vertical: 4,
                        ),
                        decoration: BoxDecoration(
                          color: levelColor.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(
                          level.toUpperCase(),
                          style: TextStyle(
                            color: levelColor,
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                            letterSpacing: 0.5,
                          ),
                        ),
                      ),
                    
                    const SizedBox(height: 16),
                    
                    // View Details Button
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      decoration: BoxDecoration(
                        gradient: const LinearGradient(
                          colors: [AppTheme.primary600, AppTheme.teal500],
                        ),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: const Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Text(
                            'View Details',
                            style: TextStyle(
                              color: Colors.white,
                              fontWeight: FontWeight.bold,
                              fontSize: 16,
                            ),
                          ),
                          SizedBox(width: 8),
                          Icon(
                            Icons.arrow_forward_rounded,
                            color: Colors.white,
                            size: 20,
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildImagePlaceholder(String title) {
    return Container(
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          colors: [AppTheme.primary600, AppTheme.teal500],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
      ),
      child: Center(
        child: Text(
          title.isNotEmpty ? title[0].toUpperCase() : 'C',
          style: const TextStyle(
            color: Colors.white,
            fontSize: 64,
            fontWeight: FontWeight.bold,
          ),
        ),
      ),
    );
  }
}

