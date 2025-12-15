import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../services/api_service.dart';

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
      final username = authProvider.instituteData['username'];
      
      if (username == null) {
        throw Exception('Username not available');
      }

      final data = await ApiService.getInstitutionJobs(username);
      
      if (data['success'] == true && data['data'] != null) {
        setState(() {
          _jobPosts = data['data'] is List ? data['data'] : [];
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
      final accessToken = authProvider.accessToken;
      final refreshToken = authProvider.refreshToken;

      if (accessToken == null) {
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

        return Card(
          margin: const EdgeInsets.only(bottom: 12),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  fullName.isEmpty ? 'Unknown' : fullName,
                  style: theme.textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
                if (application['email'] != null) ...[
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      const Icon(Icons.email, size: 16),
                      const SizedBox(width: 8),
                      Text(application['email']),
                    ],
                  ),
                ],
                if (application['phone_number'] != null) ...[
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      const Icon(Icons.phone, size: 16),
                      const SizedBox(width: 8),
                      Text(application['phone_number']),
                    ],
                  ),
                ],
                if (application['experience_years'] != null) ...[
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      const Icon(Icons.work, size: 16),
                      const SizedBox(width: 8),
                      Text('Experience: ${application['experience_years']} years'),
                    ],
                  ),
                ],
                if (application['cover_letter'] != null) ...[
                  const SizedBox(height: 12),
                  Text(
                    'Cover Letter:',
                    style: theme.textTheme.titleSmall,
                  ),
                  const SizedBox(height: 4),
                  Text(
                    application['cover_letter'],
                    style: theme.textTheme.bodyMedium,
                  ),
                ],
              ],
            ),
          ),
        );
      },
    );
  }
}

