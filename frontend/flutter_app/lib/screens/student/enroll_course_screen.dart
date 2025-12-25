import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:flutter/services.dart';
import '../../providers/auth_provider.dart';
import '../../config/theme.dart';
import '../../services/explore_service.dart';
import '../../services/api_service.dart';
import '../../services/student_service.dart';
import '../../widgets/enhanced_loading_indicator.dart';
import '../institution_profile_screen.dart';

class EnrollCourseScreen extends StatefulWidget {
  final int courseId;

  const EnrollCourseScreen({
    super.key,
    required this.courseId,
  });

  @override
  State<EnrollCourseScreen> createState() => _EnrollCourseScreenState();
}

class _EnrollCourseScreenState extends State<EnrollCourseScreen>
    with TickerProviderStateMixin {
  Map<String, dynamic>? _courseDetails;
  Map<String, dynamic>? _studentProfile;
  bool _isLoading = true;
  bool _isCheckingAvailability = false;
  bool _isEnrolling = false;
  bool _isEnrolled = false;
  String? _error;
  Map<String, dynamic>? _conflict;
  bool _hasCheckedGuest = false;
  
  late AnimationController _buttonAnimationController;
  late AnimationController _pulseAnimationController;
  late Animation<double> _pulseAnimation;

  @override
  void initState() {
    super.initState();
    _fetchCourseDetails();
    _fetchStudentProfile();
    _checkGuestStatus();
    _checkEnrollmentStatus();
    
    // Initialize button animations - very slow animations
    _buttonAnimationController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 3000), // 3 seconds - very slow
    );
    
    _pulseAnimationController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 5000), // 5 seconds - very slow pulse
    )..repeat(reverse: true);
    
    _pulseAnimation = Tween<double>(
      begin: 1.0,
      end: 1.05,
    ).animate(CurvedAnimation(
      parent: _pulseAnimationController,
      curve: Curves.easeInOut,
    ));
    
    // Start button animation
    Future.delayed(const Duration(milliseconds: 300), () {
      if (mounted) {
        _buttonAnimationController.forward();
      }
    });
  }
  
  @override
  void dispose() {
    _buttonAnimationController.dispose();
    _pulseAnimationController.dispose();
    super.dispose();
  }

  Future<void> _checkGuestStatus() async {
    await Future.delayed(const Duration(milliseconds: 100));
    if (!mounted) return;

    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final isAuthenticated = authProvider.isAuthenticated;
    final userType = authProvider.instituteData['userType'];

    // If guest or not a student, show login prompt
    if (!isAuthenticated || userType != 'student') {
      setState(() {
        _hasCheckedGuest = true;
      });
      _showGuestDialog();
      return;
    }

    setState(() {
      _hasCheckedGuest = true;
    });
  }

  void _showGuestDialog() {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
        ),
        title: const Row(
          children: [
            Icon(Icons.info_outline, color: AppTheme.primary600),
            SizedBox(width: 12),
            Text('Login Required'),
          ],
        ),
        content: const Text(
          'You need to sign up or log in to enroll in courses.',
        ),
        actions: [
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              Navigator.pop(context); // Go back from enroll page
            },
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              Navigator.pop(context); // Go back from enroll page
              Navigator.pushNamed(context, '/login');
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTheme.primary600,
              foregroundColor: Colors.white,
            ),
            child: const Text('Login/Sign Up'),
          ),
        ],
      ),
    );
  }

  Future<void> _fetchCourseDetails() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final response = await ExploreService.getCourseDetails(widget.courseId);
      if (response['success'] == true && response['data'] != null) {
        setState(() {
          _courseDetails = response['data'];
        });
      } else {
        setState(() {
          _error = 'Failed to load course details';
        });
      }
    } catch (e) {
      setState(() {
        _error = e is ApiException ? e.message : 'Failed to load course details';
      });
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  Future<void> _fetchStudentProfile() async {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final accessToken = authProvider.accessToken;
    final refreshToken = authProvider.refreshToken;
    final userType = authProvider.instituteData['userType'];

    if (accessToken == null || userType != 'student') {
      return;
    }

    try {
      final response = await ApiService.getStudentMyProfile(
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

      if (mounted && response['data'] != null) {
        setState(() {
          _studentProfile = response['data'];
        });
      }
    } catch (e) {
      // Silently fail - profile is optional for confirmation dialog
    }
  }

  Future<void> _checkEnrollmentStatus() async {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final accessToken = authProvider.instituteData['accessToken'];
    final refreshToken = authProvider.instituteData['refreshToken'];
    final userType = authProvider.instituteData['userType'];

    if (accessToken == null || userType != 'student') {
      return;
    }

    try {
      final response = await StudentService.checkStudentEnrollment(
        accessToken: accessToken,
        courseId: widget.courseId,
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

      if (mounted) {
        setState(() {
          _isEnrolled = response['is_enrolled'] == true || response['enrolled'] == true;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          // If error, assume not enrolled to allow enrollment attempt
          _isEnrolled = false;
        });
      }
    }
  }

  Future<void> _handleEnroll() async {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final isAuthenticated = authProvider.isAuthenticated;
    final userType = authProvider.instituteData['userType'];
    final isVerified = authProvider.isVerified;

    // Check if user is authenticated and is a student
    if (!isAuthenticated || userType != 'student') {
      _showGuestDialog();
      return;
    }

    // Check if student is verified
    if (!isVerified) {
      _showVerificationPrompt();
      return;
    }

    // Check availability first
    setState(() {
      _isCheckingAvailability = true;
      _conflict = null;
    });

    try {
      final accessToken = authProvider.instituteData['accessToken'];
      final refreshToken = authProvider.instituteData['refreshToken'];

      final availabilityResponse = await ExploreService.checkStudentFree(
        courseId: widget.courseId,
        accessToken: accessToken!,
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

      if (!mounted) return;

      // Check if there's a conflict
      if (availabilityResponse['success'] == false ||
          availabilityResponse['contradiction'] != null) {
        setState(() {
          _conflict = availabilityResponse['contradiction'];
          _isCheckingAvailability = false;
        });
        return;
      }

      setState(() {
        _isCheckingAvailability = false;
      });

      // Show confirmation dialog
      final confirmed = await _showConfirmationDialog();
      if (!confirmed || !mounted) return;

      // Proceed with enrollment
      setState(() {
        _isEnrolling = true;
      });

      final enrollResponse = await ExploreService.enrollInCourse(
        courseId: widget.courseId,
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

      if (!mounted) return;

      if (enrollResponse['success'] == true) {
        // Haptic feedback on successful enrollment
        await HapticFeedback.mediumImpact();

        // Update enrollment status
        setState(() {
          _isEnrolled = true;
        });

        // Show success message
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Row(
              children: [
                Icon(Icons.check_circle, color: Colors.white),
                SizedBox(width: 12),
                Text('Enrolled successfully!'),
              ],
            ),
            backgroundColor: Colors.green,
            duration: Duration(seconds: 2),
          ),
        );

        // Navigate back after a short delay
        await Future.delayed(const Duration(milliseconds: 500));
        if (mounted) {
          Navigator.pop(context);
        }
      } else {
        setState(() {
          _error = enrollResponse['message'] ?? 'Failed to enroll in course';
          _isEnrolling = false;
        });
      }
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _isEnrolling = false;
        _isCheckingAvailability = false;
      });

      String errorMessage = 'Failed to enroll in course';
      if (e is ApiException) {
        errorMessage = e.message;
        // Handle specific error codes
        if (e.status == 403) {
          errorMessage = 'Only students can enroll.';
        } else if (e.status == 404) {
          errorMessage = 'Course not found.';
        } else if (e.status == 400) {
          errorMessage = e.message.contains('capacity')
              ? 'Course capacity is full.'
              : e.message;
        }
      }

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(errorMessage),
          backgroundColor: Colors.red,
          duration: const Duration(seconds: 3),
        ),
      );
    }
  }

  String _formatPrice(dynamic price) {
    if (price == null) return 'Free';
    final priceValue = double.tryParse(price.toString()) ?? 0.0;
    if (priceValue == 0.0) {
      return 'Free';
    }
    return '\$${priceValue.toStringAsFixed(2)}';
  }

  Future<bool> _showConfirmationDialog() async {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    
    final studentName = _studentProfile != null
        ? '${_studentProfile!['first_name'] ?? ''} ${_studentProfile!['last_name'] ?? ''}'.trim()
        : 'Student';
    final studentImage = _studentProfile?['profile_image'];
    final studentImageUrl = _getImageUrl(studentImage);
    
    final courseTitle = _courseDetails?['title'] ?? 'Course';
    final institutionName = _courseDetails?['institution_name'] ?? 'Institution';
    final price = _formatPrice(_courseDetails?['price']);

    return await showDialog<bool>(
          context: context,
          builder: (context) => Dialog(
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(24),
            ),
            child: Container(
              constraints: const BoxConstraints(maxWidth: 400),
              decoration: BoxDecoration(
                color: isDark ? AppTheme.navy800 : Colors.white,
                borderRadius: BorderRadius.circular(24),
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  // Header with gradient and profile
                  Container(
                    padding: const EdgeInsets.only(top: 28, bottom: 24, left: 24, right: 24),
                    decoration: const BoxDecoration(
                      gradient: LinearGradient(
                        colors: [AppTheme.primary600, AppTheme.teal500],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
                    ),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Container(
                          width: 86,
                          height: 86,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            border: Border.all(color: Colors.white.withOpacity(0.8), width: 3),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withOpacity(0.15),
                                blurRadius: 12,
                                offset: const Offset(0, 6),
                              ),
                            ],
                          ),
                          child: ClipOval(
                            child: studentImageUrl != null
                                ? Image.network(
                                    studentImageUrl,
                                    fit: BoxFit.cover,
                                    errorBuilder: (context, error, stackTrace) {
                                      return Container(
                                        decoration: const BoxDecoration(
                                          gradient: LinearGradient(
                                            colors: [AppTheme.primary600, AppTheme.teal500],
                                          ),
                                        ),
                                        child: Center(
                                          child: Text(
                                            studentName.isNotEmpty
                                                ? studentName[0].toUpperCase()
                                                : 'S',
                                            style: const TextStyle(
                                              color: Colors.white,
                                              fontSize: 28,
                                              fontWeight: FontWeight.bold,
                                            ),
                                          ),
                                        ),
                                      );
                                    },
                                  )
                                : Container(
                                    decoration: const BoxDecoration(
                                      gradient: LinearGradient(
                                        colors: [AppTheme.primary600, AppTheme.teal500],
                                      ),
                                    ),
                                    child: Center(
                                      child: Text(
                                        studentName.isNotEmpty
                                            ? studentName[0].toUpperCase()
                                            : 'S',
                                        style: const TextStyle(
                                          color: Colors.white,
                                          fontSize: 28,
                                          fontWeight: FontWeight.bold,
                                        ),
                                      ),
                                    ),
                                  ),
                          ),
                        ),
                        const SizedBox(height: 14),
                        Text(
                          studentName.isNotEmpty ? studentName : 'Student',
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 20,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 12),
                        const Text(
                          'Confirm Enrollment',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 22,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                  ),
                  
                  // Content
                  Padding(
                    padding: const EdgeInsets.all(24),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        // Course Details
                        Container(
                          padding: const EdgeInsets.all(20),
                          decoration: BoxDecoration(
                            color: isDark ? AppTheme.navy700 : Colors.white,
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(
                              color: isDark
                                  ? AppTheme.teal500.withOpacity(0.3)
                                  : AppTheme.primary200,
                              width: 1.5,
                            ),
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
                              Row(
                                children: [
                                  Icon(
                                    Icons.info_outline_rounded,
                                    color: AppTheme.primary600,
                                    size: 20,
                                  ),
                                  const SizedBox(width: 8),
                                  Text(
                                    'Enrollment Details',
                                    style: TextStyle(
                                      fontSize: 16,
                                      fontWeight: FontWeight.bold,
                                      color: isDark ? Colors.white : Colors.grey.shade800,
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 16),
                              _buildDetailRow(
                                Icons.book_rounded,
                                'Course',
                                courseTitle,
                                isDark,
                              ),
                              const SizedBox(height: 12),
                              _buildDetailRow(
                                Icons.business_rounded,
                                'Institution',
                                institutionName,
                                isDark,
                              ),
                              const SizedBox(height: 12),
                              _buildDetailRow(
                                Icons.attach_money_rounded,
                                'Price',
                                price,
                                isDark,
                                isPrice: true,
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                  
                  // Actions
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
                    decoration: BoxDecoration(
                      color: isDark ? AppTheme.navy700 : Colors.grey.shade50,
                      borderRadius: const BorderRadius.vertical(
                        bottom: Radius.circular(24),
                      ),
                    ),
                    child: Row(
                      children: [
                        Expanded(
                          child: TextButton(
                            onPressed: () => Navigator.pop(context, false),
                            style: TextButton.styleFrom(
                              padding: const EdgeInsets.symmetric(vertical: 16),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(12),
                              ),
                            ),
                            child: Text(
                              'Cancel',
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.w600,
                                color: isDark ? Colors.white70 : Colors.grey.shade700,
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          flex: 2,
                          child: ElevatedButton(
                            onPressed: () => Navigator.pop(context, true),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: AppTheme.primary600,
                              foregroundColor: Colors.white,
                              padding: const EdgeInsets.symmetric(vertical: 16),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(12),
                              ),
                              elevation: 4,
                            ),
                            child: const Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(Icons.check_circle_rounded, size: 20),
                                SizedBox(width: 8),
                                Text(
                                  'Confirm',
                                  style: TextStyle(
                                    fontSize: 16,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        ) ??
        false;
  }

  Widget _buildDetailRow(
    IconData icon,
    String label,
    String value,
    bool isDark, {
    bool isPrice = false,
  }) {
    return Row(
      children: [
        Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: isPrice
                ? Colors.green.withOpacity(0.1)
                : AppTheme.primary600.withOpacity(0.1),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Icon(
            icon,
            size: 18,
            color: isPrice ? Colors.green.shade700 : AppTheme.primary600,
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: TextStyle(
                  fontSize: 12,
                  color: isDark ? Colors.white70 : Colors.grey.shade600,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                value,
                style: TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w600,
                  color: isDark ? Colors.white : Colors.grey.shade800,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  void _showVerificationPrompt() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
        ),
        title: const Row(
          children: [
            Icon(Icons.verified_user, color: Colors.orange),
            SizedBox(width: 12),
            Text('Verification Required'),
          ],
        ),
        content: const Text(
          'You need to verify your account before enrolling in courses. Please complete verification in Settings.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              Navigator.pushNamed(context, '/student/my-profile');
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTheme.primary600,
              foregroundColor: Colors.white,
            ),
            child: const Text('Go to Profile'),
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

  String _formatDate(String? dateString) {
    if (dateString == null || dateString.isEmpty) return 'N/A';
    try {
      final date = DateTime.parse(dateString);
      return '${date.month}/${date.day}/${date.year}';
    } catch (e) {
      return dateString;
    }
  }

  String _formatTime(String? timeString) {
    if (timeString == null || timeString.isEmpty) return 'N/A';
    try {
      // Handle both "09:00:00" and "09:00" formats
      final parts = timeString.split(':');
      if (parts.length >= 2) {
        final hour = int.parse(parts[0]);
        final minute = parts[1];
        final period = hour >= 12 ? 'PM' : 'AM';
        final displayHour = hour > 12 ? hour - 12 : (hour == 0 ? 12 : hour);
        return '$displayHour:$minute $period';
      }
      return timeString;
    } catch (e) {
      return timeString;
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
    final isAuthenticated = authProvider.isAuthenticated;
    final userType = authProvider.instituteData['userType'];
    final isVerified = authProvider.isVerified;
    final isStudent = isAuthenticated && userType == 'student';

    return Scaffold(
      backgroundColor: isDark ? AppTheme.navy900 : const Color(0xFFF9FAFB),
      appBar: AppBar(
        elevation: 0,
        backgroundColor: isDark ? AppTheme.navy800 : Colors.white,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => Navigator.pop(context),
        ),
        title: const Text('Enroll in Course'),
      ),
      body: _isLoading
          ? const FullScreenLoading()
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
                        onPressed: _fetchCourseDetails,
                        child: const Text('Retry'),
                      ),
                    ],
                  ),
                )
              : _courseDetails == null
                  ? const Center(child: Text('Course not found'))
                  : Column(
                      children: [
                        Expanded(
                          child: SingleChildScrollView(
                            padding: const EdgeInsets.all(16),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                // Course Image Header
                                _buildCourseImageHeader(isDark),
                                const SizedBox(height: 24),

                                // Course Overview Card
                                _buildCourseOverviewCard(isDark),
                                const SizedBox(height: 16),

                                // Schedule Information Card
                                if (_courseDetails!['days'] != null ||
                                    _courseDetails!['start_time'] != null)
                                  _buildScheduleCard(isDark),
                                if (_courseDetails!['days'] != null ||
                                    _courseDetails!['start_time'] != null)
                                  const SizedBox(height: 16),

                                // Instructor & Institution Card
                                if (_courseDetails!['lecturer_name'] != null ||
                                    _courseDetails!['institution_name'] != null)
                                  _buildInstructorCard(isDark),
                                if (_courseDetails!['lecturer_name'] != null ||
                                    _courseDetails!['institution_name'] != null)
                                  const SizedBox(height: 16),

                                // Dates Card
                                _buildDatesCard(isDark),
                                const SizedBox(height: 16),

                                // Already Enrolled Card (if enrolled)
                                if (_isEnrolled) ...[
                                  _buildEnrolledCard(isDark),
                                  const SizedBox(height: 16),
                                ],

                                // Conflict Card (if exists)
                                if (_conflict != null) ...[
                                  _buildConflictCard(isDark),
                                  const SizedBox(height: 16),
                                ],

                                // Verification Prompt (if not verified)
                                if (isStudent && !isVerified) ...[
                                  _buildVerificationCard(isDark),
                                  const SizedBox(height: 16),
                                ],
                              ],
                            ),
                          ),
                        ),

                        // Enroll Button (Fixed at bottom)
                        _buildEnrollButton(isDark, isStudent, isVerified),
                      ],
                    ),
    );
  }

  Widget _buildCourseImageHeader(bool isDark) {
    final courseImageUrl = _getImageUrl(_courseDetails!['course_image']);

    return Container(
      width: double.infinity,
      height: 250,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(20),
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
        gradient: courseImageUrl == null
            ? null
            : LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [
                  Colors.transparent,
                  Colors.black.withOpacity(0.7),
                ],
              ),
      ),
      child: courseImageUrl == null
          ? Center(
              child: Icon(
                Icons.book,
                size: 64,
                color: isDark ? AppTheme.navy500 : Colors.grey.shade600,
              ),
            )
          : Stack(
              children: [
                // Gradient overlay
                Container(
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(20),
                    gradient: LinearGradient(
                      begin: Alignment.topCenter,
                      end: Alignment.bottomCenter,
                      colors: [
                        Colors.transparent,
                        Colors.black.withOpacity(0.7),
                      ],
                    ),
                  ),
                ),
                // Course title on image
                Positioned(
                  bottom: 20,
                  left: 20,
                  right: 20,
                  child: Text(
                    _courseDetails!['title'] ?? 'Course',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 28,
                      fontWeight: FontWeight.bold,
                      shadows: [
                        Shadow(
                          color: Colors.black54,
                          blurRadius: 8,
                          offset: Offset(0, 2),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
    );
  }

  Widget _buildCourseOverviewCard(bool isDark) {
    final levelColor = _getLevelColor(_courseDetails!['level']);

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: isDark ? AppTheme.navy800 : Colors.white,
        borderRadius: BorderRadius.circular(20),
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
          // Level and Price Row
          Row(
            children: [
              if (_courseDetails!['level'] != null)
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 12,
                    vertical: 6,
                  ),
                  decoration: BoxDecoration(
                    color: levelColor.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    (_courseDetails!['level'] as String).toUpperCase(),
                    style: TextStyle(
                      color: levelColor,
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                      letterSpacing: 0.5,
                    ),
                  ),
                ),
              const Spacer(),
              if (_courseDetails!['price'] != null)
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 8,
                  ),
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      colors: [AppTheme.primary600, AppTheme.teal500],
                    ),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    _formatPrice(_courseDetails!['price']),
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
            ],
          ),
          if (_courseDetails!['about'] != null) ...[
            const SizedBox(height: 20),
            const Text(
              'About',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 12),
            Text(
              _courseDetails!['about'],
              style: TextStyle(
                fontSize: 14,
                color: Colors.grey.shade700,
                height: 1.6,
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildScheduleCard(bool isDark) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: isDark ? AppTheme.navy800 : Colors.white,
        borderRadius: BorderRadius.circular(20),
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
          Row(
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: AppTheme.primary50,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Icon(
                  Icons.calendar_today,
                  color: AppTheme.primary600,
                  size: 20,
                ),
              ),
              const SizedBox(width: 12),
              const Text(
                'Schedule',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          if (_courseDetails!['days'] != null &&
              (_courseDetails!['days'] as List).isNotEmpty) ...[
            _buildInfoRow(
              'Days',
              (_courseDetails!['days'] as List)
                  .map((d) => (d as String).toUpperCase())
                  .join(', '),
              Icons.calendar_view_week,
              Colors.purple,
              isDark,
            ),
            const SizedBox(height: 12),
          ],
          if (_courseDetails!['start_time'] != null &&
              _courseDetails!['end_time'] != null)
            _buildInfoRow(
              'Time',
              '${_formatTime(_courseDetails!['start_time'])} - ${_formatTime(_courseDetails!['end_time'])}',
              Icons.access_time,
              Colors.orange,
              isDark,
            ),
        ],
      ),
    );
  }

  Widget _buildInstructorCard(bool isDark) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: isDark ? AppTheme.navy800 : Colors.white,
        borderRadius: BorderRadius.circular(20),
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
          Row(
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: AppTheme.teal50,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Icon(
                  Icons.person,
                  color: AppTheme.teal600,
                  size: 20,
                ),
              ),
              const SizedBox(width: 12),
              const Text(
                'Instructor & Institution',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          if (_courseDetails!['lecturer_name'] != null) ...[
            _buildInfoRow(
              'Lecturer',
              _courseDetails!['lecturer_name'],
              Icons.person_outline,
              Colors.teal,
              isDark,
            ),
            const SizedBox(height: 12),
          ],
          if (_courseDetails!['institution_name'] != null)
            GestureDetector(
              onTap: _courseDetails!['institution_username'] != null
                  ? () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (context) => InstitutionProfileScreen(
                            username: _courseDetails!['institution_username'],
                          ),
                        ),
                      );
                    }
                  : null,
              child: _buildInfoRow(
                'Institution',
                _courseDetails!['institution_name'],
                Icons.business,
                AppTheme.primary600,
                isDark,
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildDatesCard(bool isDark) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: isDark ? AppTheme.navy800 : Colors.white,
        borderRadius: BorderRadius.circular(20),
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
          Row(
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: Colors.blue.shade50,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(
                  Icons.event,
                  color: Colors.blue.shade700,
                  size: 20,
                ),
              ),
              const SizedBox(width: 12),
              const Text(
                'Course Dates',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          if (_courseDetails!['starting_date'] != null)
            _buildInfoRow(
              'Start Date',
              _formatDate(_courseDetails!['starting_date']),
              Icons.calendar_today,
              Colors.blue,
              isDark,
            ),
          if (_courseDetails!['starting_date'] != null &&
              _courseDetails!['ending_date'] != null)
            const SizedBox(height: 12),
          if (_courseDetails!['ending_date'] != null)
            _buildInfoRow(
              'End Date',
              _formatDate(_courseDetails!['ending_date']),
              Icons.event,
              Colors.red,
              isDark,
            ),
        ],
      ),
    );
  }

  Widget _buildInfoRow(
    String label,
    String value,
    IconData icon,
    Color color,
    bool isDark,
  ) {
    return Row(
      children: [
        Icon(icon, size: 20, color: color),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: TextStyle(
                  fontSize: 12,
                  color: isDark ? Colors.white70 : Colors.grey.shade600,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                value,
                style: const TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildEnrolledCard(bool isDark) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.green.shade50,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.green.shade300, width: 2),
      ),
      child: Row(
        children: [
          Icon(Icons.check_circle, color: Colors.green.shade700, size: 32),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Already Enrolled',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: Colors.green.shade800,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  'You are already enrolled in this course.',
                  style: TextStyle(
                    fontSize: 14,
                    color: Colors.green.shade700,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildConflictCard(bool isDark) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.red.shade50,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.red.shade300, width: 2),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.warning, color: Colors.red.shade700, size: 24),
              const SizedBox(width: 12),
              const Expanded(
                child: Text(
                  'Schedule Conflict',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: Colors.red,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Text(
            'You have a scheduling conflict with another course:',
            style: TextStyle(
              fontSize: 14,
              color: Colors.red.shade800,
              fontWeight: FontWeight.w500,
            ),
          ),
          const SizedBox(height: 12),
          if (_conflict!['course_title'] != null)
            _buildConflictInfoRow(
              'Course',
              _conflict!['course_title'],
            ),
          if (_conflict!['institution'] != null)
            _buildConflictInfoRow(
              'Institution',
              _conflict!['institution'],
            ),
          if (_conflict!['day'] != null)
            _buildConflictInfoRow(
              'Day',
              _conflict!['day'],
            ),
          if (_conflict!['time'] != null)
            _buildConflictInfoRow(
              'Time',
              _conflict!['time'],
            ),
          const SizedBox(height: 12),
          Text(
            'Please resolve this conflict before enrolling.',
            style: TextStyle(
              fontSize: 12,
              color: Colors.red.shade700,
              fontStyle: FontStyle.italic,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildConflictInfoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 80,
            child: Text(
              '$label:',
              style: TextStyle(
                fontSize: 13,
                color: Colors.red.shade800,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: TextStyle(
                fontSize: 13,
                color: Colors.red.shade700,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildVerificationCard(bool isDark) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.orange.shade50,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.orange.shade300, width: 2),
      ),
      child: Row(
        children: [
          Icon(Icons.verified_user, color: Colors.orange.shade700, size: 24),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Verification Required',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: Colors.orange.shade800,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  'Please verify your account to enroll in courses.',
                  style: TextStyle(
                    fontSize: 13,
                    color: Colors.orange.shade700,
                  ),
                ),
              ],
            ),
          ),
          TextButton(
            onPressed: () {
              Navigator.pushNamed(context, '/student/my-profile');
            },
            child: Text(
              'Verify',
              style: TextStyle(color: Colors.orange.shade700),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildEnrollButton(bool isDark, bool isStudent, bool isVerified) {
    // Determine button state - disable if already enrolled
    final bool isEnabled = isStudent && isVerified && _conflict == null && !_isEnrolled;
    final bool showButton = _hasCheckedGuest;

    if (!showButton) {
      return const SizedBox.shrink();
    }

    return AnimatedBuilder(
      animation: _buttonAnimationController,
      builder: (context, child) {
        return Opacity(
          opacity: _buttonAnimationController.value,
          child: Transform.translate(
            offset: Offset(0, 30 * (1 - _buttonAnimationController.value)),
            child: child,
          ),
        );
      },
      child: Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: isDark ? AppTheme.navy800 : Colors.white,
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.15),
              blurRadius: 20,
              offset: const Offset(0, -8),
            ),
          ],
        ),
        child: SafeArea(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Checking availability indicator
              if (_isCheckingAvailability)
                TweenAnimationBuilder<double>(
                  tween: Tween<double>(begin: 0, end: 1),
                  duration: const Duration(milliseconds: 300),
                  builder: (context, value, child) {
                    return Opacity(
                      opacity: value,
                      child: Transform.scale(
                        scale: 0.9 + (0.1 * value),
                        child: child,
                      ),
                    );
                  },
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 12,
                    ),
                    margin: const EdgeInsets.only(bottom: 16),
                    decoration: BoxDecoration(
                      color: AppTheme.primary50,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                        color: AppTheme.primary200,
                        width: 1,
                      ),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        SizedBox(
                          width: 20,
                          height: 20,
                          child: const SmallLoadingIndicator(
                            size: 20,
                            color: AppTheme.primary600,
                          ),
                        ),
                        const SizedBox(width: 12),
                        Text(
                          'Checking availability...',
                          style: TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w600,
                            color: AppTheme.primary700,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              
              // Main enroll button
              AnimatedBuilder(
                animation: _pulseAnimationController,
                builder: (context, child) {
                  return Transform.scale(
                    scale: isEnabled && !_isEnrolling && !_isCheckingAvailability
                        ? _pulseAnimation.value
                        : 1.0,
                    child: child,
                  );
                },
                child: Container(
                  width: double.infinity,
                  height: 64,
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(20),
                    boxShadow: isEnabled && !_isEnrolling && !_isCheckingAvailability
                        ? [
                            BoxShadow(
                              color: AppTheme.primary600.withOpacity(0.4),
                              blurRadius: 20,
                              spreadRadius: 2,
                              offset: const Offset(0, 8),
                            ),
                          ]
                        : [],
                  ),
                  child: Material(
                    color: Colors.transparent,
                    child: InkWell(
                      borderRadius: BorderRadius.circular(20),
                      onTap: isEnabled && !_isEnrolling && !_isCheckingAvailability
                          ? _handleEnroll
                          : null,
                      child: Container(
                        decoration: BoxDecoration(
                          gradient: isEnabled && !_isEnrolling && !_isCheckingAvailability
                              ? const LinearGradient(
                                  colors: [AppTheme.primary600, AppTheme.teal500],
                                  begin: Alignment.topLeft,
                                  end: Alignment.bottomRight,
                                )
                              : null,
                          color: !isEnabled || _isEnrolling || _isCheckingAvailability
                              ? Colors.grey.shade300
                              : null,
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Center(
                          child: _isEnrolling
                              ? Row(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    SizedBox(
                                      width: 24,
                                      height: 24,
                                      child: const SmallLoadingIndicator(
                                        size: 24,
                                        color: Colors.white,
                                      ),
                                    ),
                                    const SizedBox(width: 16),
                                    const Text(
                                      'Enrolling...',
                                      style: TextStyle(
                                        fontSize: 20,
                                        fontWeight: FontWeight.bold,
                                        color: Colors.white,
                                        letterSpacing: 0.5,
                                      ),
                                    ),
                                  ],
                                )
                              : Row(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    if (isEnabled && !_isEnrolling && !_isCheckingAvailability)
                                      Container(
                                        padding: const EdgeInsets.all(8),
                                        decoration: BoxDecoration(
                                          color: Colors.white.withOpacity(0.2),
                                          borderRadius: BorderRadius.circular(12),
                                        ),
                                        child: const Icon(
                                          Icons.school_rounded,
                                          color: Colors.white,
                                          size: 24,
                                        ),
                                      ),
                                    if (isEnabled && !_isEnrolling && !_isCheckingAvailability)
                                      const SizedBox(width: 12),
                                    Flexible(
                                      child: Text(
                                        _isEnrolled
                                            ? 'Already Enrolled'
                                            : isStudent && !isVerified
                                                ? 'Verification Required'
                                                : _conflict != null
                                                    ? 'Conflict Detected'
                                                    : 'Enroll Now',
                                        style: TextStyle(
                                          fontSize: 20,
                                          fontWeight: FontWeight.bold,
                                          color: isEnabled && !_isEnrolling && !_isCheckingAvailability
                                              ? Colors.white
                                              : Colors.grey.shade600,
                                          letterSpacing: 0.5,
                                        ),
                                        textAlign: TextAlign.center,
                                      ),
                                    ),
                                    if (isEnabled && !_isEnrolling && !_isCheckingAvailability)
                                      const SizedBox(width: 8),
                                    if (isEnabled && !_isEnrolling && !_isCheckingAvailability)
                                      const Icon(
                                        Icons.arrow_forward_rounded,
                                        color: Colors.white,
                                        size: 24,
                                      ),
                                  ],
                                ),
                        ),
                      ),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

