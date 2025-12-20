import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../services/api_service.dart';
import '../../config/theme.dart';

class ApplicationsPage extends StatefulWidget {
  const ApplicationsPage({super.key});

  @override
  State<ApplicationsPage> createState() => _ApplicationsPageState();
}

class _ApplicationsPageState extends State<ApplicationsPage> {
  List<dynamic> _jobPosts = [];
  List<dynamic> _applications = [];
  int? _selectedJobId;
  bool _isLoadingJobs = false;
  bool _isLoadingApplications = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _fetchJobPosts();
  }

  Future<void> _fetchJobPosts() async {
    setState(() {
      _isLoadingJobs = true;
      _error = null;
    });

    try {
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      final instituteData = authProvider.instituteData;
      final accessToken = instituteData['accessToken'] as String?;
      final refreshToken = instituteData['refreshToken'] as String?;

      if (accessToken == null || accessToken.isEmpty) {
        throw Exception('Not authenticated');
      }

      // Step 1: Fetch profile information from /institution/my-profile/
      final profileData = await ApiService.getInstitutionMyProfile(
        accessToken: accessToken,
        refreshToken: refreshToken,
        onTokenRefreshed: (tokens) {
          authProvider.onTokenRefreshed(tokens);
        },
        onSessionExpired: () {
          authProvider.logout();
        },
      );

      // Step 2: Extract username from profile
      String? username;
      if (profileData['success'] == true && profileData['data'] != null) {
        final data = profileData['data'];
        username = data['username']?.toString();
      }

      if (username == null || username.isEmpty) {
        throw Exception('Username not found in profile');
      }

      // Step 3: Use username to fetch jobs from /institution/<username>/jobs/
      final jobsData = await ApiService.getInstitutionJobs(username);
      
      if (jobsData['success'] == true && jobsData['data'] != null) {
        setState(() {
          _jobPosts = jobsData['data'] is List ? jobsData['data'] : [];
        });
      } else {
        setState(() {
          _jobPosts = [];
        });
      }
    } catch (e) {
      setState(() {
        _error = e.toString();
        _jobPosts = [];
      });
    } finally {
      setState(() {
        _isLoadingJobs = false;
      });
    }
  }

  Future<void> _fetchApplications(int jobId) async {
    setState(() {
      _isLoadingApplications = true;
      _selectedJobId = jobId;
      _error = null;
    });

    try {
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      final instituteData = authProvider.instituteData;
      final accessToken = instituteData['accessToken'] as String?;
      final refreshToken = instituteData['refreshToken'] as String?;

      if (accessToken == null || accessToken.isEmpty) {
        throw Exception('Not authenticated');
      }

      final data = await ApiService.getJobApplications(
        accessToken: accessToken,
        jobId: jobId,
        refreshToken: refreshToken,
        onTokenRefreshed: (tokens) {
          authProvider.onTokenRefreshed(tokens);
        },
        onSessionExpired: () {
          authProvider.logout();
        },
      );

      // API returns { "success": true, "applications": [...] }
      if (data['success'] == true && data['applications'] != null) {
        setState(() {
          _applications = data['applications'] is List ? data['applications'] : [];
        });
      } else {
        setState(() {
          _applications = [];
        });
      }
    } catch (e) {
      setState(() {
        _error = e.toString();
        _applications = [];
      });
    } finally {
      setState(() {
        _isLoadingApplications = false;
      });
    }
  }

  void _goBackToJobList() {
    setState(() {
      _selectedJobId = null;
      _applications = [];
    });
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Scaffold(
      appBar: AppBar(
        title: Text(_selectedJobId == null ? 'Applications' : 'Job Applications'),
        elevation: 0,
        leading: _selectedJobId != null
            ? IconButton(
                icon: const Icon(Icons.arrow_back),
                onPressed: _goBackToJobList,
              )
            : null,
      ),
      body: _selectedJobId == null ? _buildJobList(theme, isDark) : _buildApplicationsList(theme, isDark),
    );
  }

  Widget _buildJobList(ThemeData theme, bool isDark) {
    if (_isLoadingJobs) {
      return const Center(
        child: CircularProgressIndicator(),
      );
    }

    if (_error != null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.error_outline, size: 48, color: Colors.red),
            const SizedBox(height: 16),
            Text('Error: $_error'),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: _fetchJobPosts,
              child: const Text('Retry'),
            ),
          ],
        ),
      );
    }

    if (_jobPosts.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.work_outline, size: 64, color: Colors.grey),
            const SizedBox(height: 16),
            Text(
              'No job posts available',
              style: theme.textTheme.titleLarge,
            ),
            const SizedBox(height: 8),
            Text(
              'Create a job post first to see applications',
              style: theme.textTheme.bodyMedium?.copyWith(color: Colors.grey),
            ),
          ],
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: _jobPosts.length,
      itemBuilder: (context, index) {
        final job = _jobPosts[index];
        return Card(
          margin: const EdgeInsets.only(bottom: 12),
          child: ListTile(
            title: Text(
              job['title'] ?? 'Untitled',
              style: const TextStyle(fontWeight: FontWeight.bold),
            ),
            subtitle: job['specialty'] != null
                ? Text(job['specialty'])
                : null,
            trailing: const Icon(Icons.chevron_right),
            onTap: () => _fetchApplications(job['id']),
          ),
        );
      },
    );
  }

  Widget _buildApplicationsList(ThemeData theme, bool isDark) {
    if (_isLoadingApplications) {
      return const Center(
        child: CircularProgressIndicator(),
      );
    }

    if (_error != null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.error_outline, size: 48, color: Colors.red),
            const SizedBox(height: 16),
            Text('Error: $_error'),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: () => _fetchApplications(_selectedJobId!),
              child: const Text('Retry'),
            ),
          ],
        ),
      );
    }

    if (_applications.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.description_outlined, size: 64, color: Colors.grey),
            const SizedBox(height: 16),
            Text(
              'No applications yet',
              style: theme.textTheme.titleLarge,
            ),
            const SizedBox(height: 8),
            Text(
              'Applications for this job will appear here',
              style: theme.textTheme.bodyMedium?.copyWith(color: Colors.grey),
            ),
          ],
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: _applications.length,
      itemBuilder: (context, index) {
        final application = _applications[index];
        final firstName = application['first_name'] ?? '';
        final lastName = application['last_name'] ?? '';
        final fullName = '$firstName $lastName'.trim();
        final appliedAt = application['applied_at'];

        return Card(
          margin: const EdgeInsets.only(bottom: 12),
          elevation: 2,
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Header with name and application ID
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Expanded(
                      child: Text(
                        fullName.isEmpty ? 'Unknown' : fullName,
                        style: theme.textTheme.titleLarge?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                    if (application['application_id'] != null)
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 8,
                          vertical: 4,
                        ),
                        decoration: BoxDecoration(
                          color: isDark
                              ? AppTheme.navy700
                              : AppTheme.primary50,
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(
                          '#${application['application_id']}',
                          style: theme.textTheme.bodySmall?.copyWith(
                            color: AppTheme.primary600,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                  ],
                ),
                const SizedBox(height: 12),
                // Contact Information
                if (application['email'] != null || application['phone_number'] != null) ...[
                  Wrap(
                    spacing: 16,
                    runSpacing: 8,
                    children: [
                      if (application['email'] != null)
                        Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(Icons.email, size: 16, color: Colors.grey.shade600),
                            const SizedBox(width: 6),
                            Text(
                              application['email'],
                              style: theme.textTheme.bodyMedium,
                            ),
                          ],
                        ),
                      if (application['phone_number'] != null)
                        Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(Icons.phone, size: 16, color: Colors.grey.shade600),
                            const SizedBox(width: 6),
                            Text(
                              application['phone_number'],
                              style: theme.textTheme.bodyMedium,
                            ),
                          ],
                        ),
                    ],
                  ),
                  const SizedBox(height: 12),
                ],
                // Professional Information
                if (application['specialty'] != null || 
                    application['experience'] != null ||
                    application['skills'] != null) ...[
                  Wrap(
                    spacing: 12,
                    runSpacing: 8,
                    children: [
                      if (application['specialty'] != null)
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 10,
                            vertical: 6,
                          ),
                          decoration: BoxDecoration(
                            color: isDark
                                ? AppTheme.navy700
                                : AppTheme.primary50,
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(
                                Icons.school,
                                size: 14,
                                color: AppTheme.primary600,
                              ),
                              const SizedBox(width: 6),
                              Text(
                                application['specialty'],
                                style: theme.textTheme.bodySmall?.copyWith(
                                  fontWeight: FontWeight.w500,
                                  color: AppTheme.primary700,
                                ),
                              ),
                            ],
                          ),
                        ),
                      if (application['experience'] != null)
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 10,
                            vertical: 6,
                          ),
                          decoration: BoxDecoration(
                            color: isDark
                                ? AppTheme.navy700
                                : Colors.grey.shade100,
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(
                                Icons.work_history,
                                size: 14,
                                color: Colors.grey.shade700,
                              ),
                              const SizedBox(width: 6),
                              Text(
                                '${application['experience']} ${application['experience'] == 1 ? 'year' : 'years'}',
                                style: theme.textTheme.bodySmall?.copyWith(
                                  fontWeight: FontWeight.w500,
                                  color: Colors.grey.shade700,
                                ),
                              ),
                            ],
                          ),
                        ),
                    ],
                  ),
                  if (application['skills'] != null) ...[
                    const SizedBox(height: 8),
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Icon(Icons.star, size: 16, color: Colors.grey.shade600),
                        const SizedBox(width: 6),
                        Expanded(
                          child: Text(
                            application['skills'],
                            style: theme.textTheme.bodyMedium,
                          ),
                        ),
                      ],
                    ),
                  ],
                  const SizedBox(height: 12),
                ],
                // Message
                if (application['message'] != null) ...[
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: isDark
                          ? AppTheme.navy700
                          : Colors.grey.shade50,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Message',
                          style: theme.textTheme.titleSmall?.copyWith(
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          application['message'],
                          style: theme.textTheme.bodyMedium,
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 12),
                ],
                // Applied Date
                if (appliedAt != null) ...[
                  Row(
                    children: [
                      Icon(
                        Icons.calendar_today,
                        size: 14,
                        color: Colors.grey.shade600,
                      ),
                      const SizedBox(width: 6),
                      Text(
                        'Applied: ${_formatDate(appliedAt)}',
                        style: theme.textTheme.bodySmall?.copyWith(
                          color: Colors.grey.shade600,
                        ),
                      ),
                    ],
                  ),
                ],
              ],
            ),
          ),
        );
      },
    );
  }

  String _formatDate(dynamic date) {
    if (date == null) return '';
    try {
      final dateTime = date is DateTime ? date : DateTime.parse(date.toString());
      final now = DateTime.now();
      final difference = now.difference(dateTime);
      
      if (difference.inDays == 0) {
        if (difference.inHours == 0) {
          if (difference.inMinutes == 0) {
            return 'Just now';
          }
          return '${difference.inMinutes} ${difference.inMinutes == 1 ? 'minute' : 'minutes'} ago';
        }
        return '${difference.inHours} ${difference.inHours == 1 ? 'hour' : 'hours'} ago';
      } else if (difference.inDays < 7) {
        return '${difference.inDays} ${difference.inDays == 1 ? 'day' : 'days'} ago';
      } else {
        return '${dateTime.day}/${dateTime.month}/${dateTime.year}';
      }
    } catch (e) {
      return date.toString();
    }
  }
}

