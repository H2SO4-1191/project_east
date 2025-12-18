import 'package:flutter/material.dart';
import '../config/theme.dart';
import '../services/explore_service.dart';
import '../services/api_service.dart';

class PublicCourseDetailsScreen extends StatefulWidget {
  final int courseId;

  const PublicCourseDetailsScreen({
    super.key,
    required this.courseId,
  });

  @override
  State<PublicCourseDetailsScreen> createState() => _PublicCourseDetailsScreenState();
}

class _PublicCourseDetailsScreenState extends State<PublicCourseDetailsScreen> {
  Map<String, dynamic>? _courseDetails;
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _fetchCourseDetails();
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

    return Scaffold(
      backgroundColor: isDark ? AppTheme.navy900 : const Color(0xFFF9FAFB),
      appBar: AppBar(
        elevation: 0,
        backgroundColor: isDark ? AppTheme.navy800 : Colors.white,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => Navigator.pop(context),
        ),
        title: const Text('Course Details'),
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
                  : SingleChildScrollView(
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
                        ],
                      ),
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
            ),
            const SizedBox(height: 12),
          ],
          if (_courseDetails!['institution_name'] != null)
            _buildInfoRow(
              'Institution',
              _courseDetails!['institution_name'],
              Icons.business,
              AppTheme.primary600,
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
                  color: Colors.grey.shade600,
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
}

