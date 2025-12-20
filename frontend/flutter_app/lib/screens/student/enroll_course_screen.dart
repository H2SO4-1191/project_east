import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../config/theme.dart';
import '../../services/explore_service.dart';
import '../../services/api_service.dart';
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

class _EnrollCourseScreenState extends State<EnrollCourseScreen> {
  Map<String, dynamic>? _courseDetails;
  bool _isLoading = true;
  bool _isCheckingAvailability = false;
  bool _isEnrolling = false;
  String? _error;
  Map<String, dynamic>? _conflict;
  bool _hasCheckedGuest = false;

  @override
  void initState() {
    super.initState();
    _fetchCourseDetails();
    _checkGuestStatus();
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

  Future<bool> _showConfirmationDialog() async {
    return await showDialog<bool>(
          context: context,
          builder: (context) => AlertDialog(
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(20),
            ),
            title: const Row(
              children: [
                Icon(Icons.school, color: AppTheme.primary600),
                SizedBox(width: 12),
                Text('Confirm Enrollment'),
              ],
            ),
            content: Text(
              'Are you sure you want to enroll in "${_courseDetails?['title'] ?? 'this course'}"?',
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(context, false),
                child: const Text('Cancel'),
              ),
              ElevatedButton(
                onPressed: () => Navigator.pop(context, true),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.primary600,
                  foregroundColor: Colors.white,
                ),
                child: const Text('Confirm'),
              ),
            ],
          ),
        ) ??
        false;
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
          ? const Center(child: CircularProgressIndicator())
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
                    '\$${_courseDetails!['price']}',
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
    // Determine button state
    final bool isEnabled = isStudent && isVerified && _conflict == null;
    final bool showButton = _hasCheckedGuest;

    if (!showButton) {
      return const SizedBox.shrink();
    }

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isDark ? AppTheme.navy800 : Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.1),
            blurRadius: 10,
            offset: const Offset(0, -4),
          ),
        ],
      ),
      child: SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (_isCheckingAvailability)
              const Padding(
                padding: EdgeInsets.only(bottom: 12),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    ),
                    SizedBox(width: 12),
                    Text('Checking availability...'),
                  ],
                ),
              ),
            SizedBox(
              width: double.infinity,
              height: 56,
              child: ElevatedButton(
                onPressed: isEnabled && !_isEnrolling && !_isCheckingAvailability
                    ? _handleEnroll
                    : null,
                style: ElevatedButton.styleFrom(
                  backgroundColor: isEnabled
                      ? null
                      : Colors.grey.shade300,
                  foregroundColor: isEnabled ? Colors.white : Colors.grey.shade600,
                  disabledBackgroundColor: Colors.grey.shade300,
                  disabledForegroundColor: Colors.grey.shade600,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16),
                  ),
                  elevation: isEnabled ? 4 : 0,
                ).copyWith(
                  backgroundColor: isEnabled
                      ? MaterialStateProperty.all<Color>(
                          Colors.transparent,
                        )
                      : null,
                ),
                child: Container(
                  decoration: isEnabled
                      ? BoxDecoration(
                          gradient: const LinearGradient(
                            colors: [AppTheme.primary600, AppTheme.teal500],
                          ),
                          borderRadius: BorderRadius.circular(16),
                        )
                      : null,
                  child: Center(
                    child: _isEnrolling
                        ? const Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              SizedBox(
                                width: 20,
                                height: 20,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                  valueColor: AlwaysStoppedAnimation<Color>(
                                    Colors.white,
                                  ),
                                ),
                              ),
                              SizedBox(width: 12),
                              Text(
                                'Enrolling...',
                                style: TextStyle(
                                  fontSize: 18,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ],
                          )
                        : Text(
                            isStudent && !isVerified
                                ? 'Verification Required'
                                : _conflict != null
                                    ? 'Conflict Detected'
                                    : 'Enroll Now',
                            style: const TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
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

