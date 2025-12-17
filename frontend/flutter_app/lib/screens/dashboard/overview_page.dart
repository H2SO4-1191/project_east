import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../config/theme.dart';
import '../../providers/auth_provider.dart';
import '../../services/api_service.dart';
import '../../services/profile_service.dart';

class OverviewPage extends StatefulWidget {
  const OverviewPage({super.key});

  @override
  State<OverviewPage> createState() => _OverviewPageState();
}

class _OverviewPageState extends State<OverviewPage> {
  bool _isLoading = true;
  String? _error;
  Map<String, dynamic> _stats = {};
  List<dynamic> _posts = [];
  bool _isLoadingPosts = false;
  String? _postsError;
  String? _username;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final instituteData = authProvider.instituteData;
    final accessToken = instituteData['accessToken'];
    final refreshToken = instituteData['refreshToken'];

    if (accessToken == null) {
      setState(() {
        _isLoading = false;
        _error = 'Not authenticated';
      });
      return;
    }

    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      // Fetch verification status
      if (instituteData['email'] != null && instituteData['userType'] == 'institution') {
        try {
          final verificationStatus = await ApiService.checkVerificationStatus(
            instituteData['email'],
            accessToken: accessToken,
            refreshToken: refreshToken,
            onTokenRefreshed: (tokens) {
              authProvider.onTokenRefreshed(tokens);
            },
            onSessionExpired: () {
              authProvider.onSessionExpired();
            },
          );
          if (verificationStatus['is_verified'] != instituteData['isVerified']) {
            authProvider.updateInstituteData({
              'isVerified': verificationStatus['is_verified'] ?? false,
            });
          }
        } catch (e) {
          // Verification check failed, continue
        }
      }

      // Fetch dashboard stats
      final stats = await ApiService.getDashboardStats(
        accessToken: accessToken,
        refreshToken: refreshToken,
        onTokenRefreshed: (tokens) {
          authProvider.onTokenRefreshed(tokens);
        },
        onSessionExpired: () {
          authProvider.onSessionExpired();
        },
      );

      // Fetch institution profile to get username
      try {
        final profileData = await ApiService.getInstitutionProfile(
          accessToken: accessToken,
          refreshToken: refreshToken,
          onTokenRefreshed: (tokens) {
            authProvider.onTokenRefreshed(tokens);
          },
          onSessionExpired: () {
            authProvider.onSessionExpired();
          },
        );
        if (profileData['success'] == true && profileData['data']?['username'] != null) {
          setState(() {
            _username = profileData['data']['username'];
          });
        } else if (profileData['username'] != null) {
          setState(() {
            _username = profileData['username'];
          });
        }
      } catch (e) {
        // Profile fetch failed, use existing username
      }

      // Fetch posts if verified
      if (authProvider.instituteData['isVerified'] == true) {
        _loadPosts();
      }

      setState(() {
        _stats = stats;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString();
        _isLoading = false;
      });
    }
  }

  Future<void> _loadPosts() async {
    final usernameToUse = _username ?? Provider.of<AuthProvider>(context, listen: false).instituteData['username'];
    if (usernameToUse == null) return;

    setState(() {
      _isLoadingPosts = true;
      _postsError = null;
    });

    try {
      final posts = await ProfileService.getInstitutionPosts(usernameToUse);
      setState(() {
        if (posts['results'] != null) {
          final results = posts['results'];
          if (results is List) {
            _posts = List<dynamic>.from(results);
          } else {
            _posts = [];
          }
        } else {
          _posts = [];
        }
        _isLoadingPosts = false;
      });
    } catch (e) {
      setState(() {
        _postsError = e.toString();
        _isLoadingPosts = false;
        _posts = [];
      });
    }
  }

  String _getImageUrl(String? imagePath) {
    if (imagePath == null || imagePath.isEmpty) return '';
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }
    const baseUrl = 'https://projecteastapi.ddns.net';
    String cleanPath = imagePath.startsWith('/') ? imagePath : '/$imagePath';
    cleanPath = cleanPath.replaceAll(RegExp(r'/media/media+'), '/media/');
    if (cleanPath.startsWith('/media/media/')) {
      cleanPath = cleanPath.replaceFirst('/media/media/', '/media/');
    }
    return '$baseUrl$cleanPath';
  }

  String _formatDate(String dateString) {
    try {
      final date = DateTime.parse(dateString);
      return '${date.month}/${date.day}/${date.year} ${date.hour}:${date.minute.toString().padLeft(2, '0')}';
    } catch (e) {
      return dateString;
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final authProvider = Provider.of<AuthProvider>(context);
    final instituteData = authProvider.instituteData;
    final displayName = _username ?? 
        instituteData['username'] ?? 
        instituteData['firstName'] ?? 
        instituteData['name'] ?? 
        'there';

    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header
          Text(
            'Overview',
            style: theme.textTheme.displaySmall?.copyWith(
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Welcome back, $displayName',
            style: theme.textTheme.bodyLarge,
          ),
          if (instituteData['email'] != null)
            Padding(
              padding: const EdgeInsets.only(top: 4),
              child: Text(
                '@${instituteData['email']}',
                style: theme.textTheme.bodySmall?.copyWith(
                  color: Colors.grey.shade600,
                ),
              ),
          ),
          const SizedBox(height: 24),

          // Loading/Error States
          if (_isLoading)
            const Center(child: CircularProgressIndicator())
          else if (_error != null)
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.red.shade50,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.red.shade200),
              ),
              child: Row(
                children: [
                  Icon(Icons.error_outline, color: Colors.red.shade600),
                  const SizedBox(width: 12),
                  Expanded(child: Text(_error!, style: TextStyle(color: Colors.red.shade700))),
                ],
                  ),
            )
          else ...[
            // Stats Grid
            _buildStatsGrid(theme, isDark),
          const SizedBox(height: 24),

            // Verification Message or Posts
            if (instituteData['isVerified'] != true)
              _buildVerificationCard(theme, isDark)
            else
              _buildPostsSection(theme, isDark),
          ],
        ],
      ),
    );
  }

  Widget _buildStatsGrid(ThemeData theme, bool isDark) {
    final safeNumber = (dynamic value, int fallback) {
      if (value is num && value.isFinite) {
        return value.toInt();
      }
      return fallback;
    };

    final statCards = [
      {
        'title': 'Total Students',
        'value': safeNumber(_stats['totalStudents']?['total_students'], 0),
        'icon': Icons.people,
        'color': Colors.blue,
      },
      {
        'title': 'Active Students',
        'value': safeNumber(_stats['activeStudents']?['active_students'], 0),
        'icon': Icons.people_outline,
        'color': Colors.indigo,
      },
      {
        'title': 'Total Lecturers',
        'value': safeNumber(_stats['totalLecturers']?['total_lecturers'], 0),
        'icon': Icons.school,
        'color': Colors.teal,
      },
      {
        'title': 'Active Lecturers',
        'value': safeNumber(_stats['activeLecturers']?['active_lecturers'], 0),
        'icon': Icons.school_outlined,
        'color': Colors.green,
      },
      {
        'title': 'Total Staff',
        'value': safeNumber(_stats['totalStaff']?['total_staff'], 0),
        'icon': Icons.business_center,
        'color': Colors.purple,
      },
      {
        'title': 'Active Staff',
        'value': safeNumber(_stats['activeStaff']?['active_staff'], 0),
        'icon': Icons.business_center_outlined,
        'color': Colors.pink,
      },
    ];

    return LayoutBuilder(
      builder: (context, constraints) {
        final crossAxisCount = constraints.maxWidth > 1024
            ? 3
            : constraints.maxWidth > 768
                ? 2
                : 1;

        return GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: crossAxisCount,
            crossAxisSpacing: 16,
            mainAxisSpacing: 16,
            childAspectRatio: 2.5,
          ),
          itemCount: statCards.length,
          itemBuilder: (context, index) {
            final stat = statCards[index];
            return _buildStatCard(stat, theme, isDark);
          },
        );
      },
    );
  }

  Widget _buildStatCard(Map<String, dynamic> stat, ThemeData theme, bool isDark) {
    return Container(
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
                    child: Container(
                      decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(16),
          border: Border(
            left: BorderSide(
              color: stat['color'] as Color,
              width: 4,
                            ),
                          ),
        ),
        padding: const EdgeInsets.all(20),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Text(
                    stat['title'] as String,
                    style: theme.textTheme.bodySmall?.copyWith(
                      fontWeight: FontWeight.w500,
                      color: Colors.grey.shade600,
                                  ),
                                ),
                  const SizedBox(height: 8),
                                Text(
                    '${stat['value']}',
                    style: theme.textTheme.headlineMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                                ),
                              ],
                            ),
                          ),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: (stat['color'] as Color).withOpacity(0.1),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(
                stat['icon'] as IconData,
                color: stat['color'] as Color,
                size: 32,
              ),
                          ),
                        ],
                      ),
                    ),
                  );
  }

  Widget _buildVerificationCard(ThemeData theme, bool isDark) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.amber.shade50,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.amber.shade200),
      ),
      child: Row(
        children: [
          Icon(Icons.info_outline, color: Colors.amber.shade600, size: 32),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Verification Required',
                  style: theme.textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                    color: Colors.amber.shade900,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  'Please verify your institution account to access all features and view your posts.',
                  style: theme.textTheme.bodyMedium?.copyWith(
                    color: Colors.amber.shade800,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPostsSection(ThemeData theme, bool isDark) {
    return Container(
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
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.article, color: Colors.blue.shade600),
              const SizedBox(width: 8),
          Text(
                'Institution Posts',
                style: theme.textTheme.titleLarge?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          if (_isLoadingPosts)
            const Center(child: CircularProgressIndicator())
          else if (_postsError != null)
            Center(
                            child: Text(
                _postsError!,
                style: TextStyle(color: Colors.red.shade600),
                    ),
            )
          else if (_posts.isEmpty)
            Center(
              child: Column(
                children: [
                  Icon(Icons.article_outlined, size: 64, color: Colors.grey.shade400),
                  const SizedBox(height: 16),
                  Text(
                    'No posts yet',
                    style: theme.textTheme.bodyLarge?.copyWith(
                      color: Colors.grey.shade600,
                    ),
                  ),
                ],
              ),
            )
          else
            ..._posts.map((post) => _buildPostCard(post, theme, isDark)),
        ],
      ),
    );
  }

  Widget _buildPostCard(Map<String, dynamic> post, ThemeData theme, bool isDark) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isDark ? AppTheme.navy700 : Colors.grey.shade50,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: isDark ? AppTheme.navy600 : Colors.grey.shade200,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Text(
                  post['title'] ?? 'Untitled Post',
                  style: theme.textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
              if (post['created_at'] != null)
                Text(
                  _formatDate(post['created_at']),
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: Colors.grey.shade600,
                  ),
                ),
            ],
                ),
          if (post['description'] != null) ...[
            const SizedBox(height: 8),
            Text(
              post['description'],
              style: theme.textTheme.bodyMedium,
            ),
          ],
          if (post['images'] != null && (post['images'] as List).isNotEmpty) ...[
            const SizedBox(height: 12),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: (post['images'] as List).take(3).map((img) {
                final imageUrl = _getImageUrl(img['image'] ?? img);
                if (imageUrl.isEmpty) return const SizedBox.shrink();
                return ClipRRect(
                  borderRadius: BorderRadius.circular(8),
                  child: Image.network(
                    imageUrl,
                    width: 100,
                    height: 100,
                    fit: BoxFit.cover,
                    errorBuilder: (context, error, stackTrace) => const SizedBox.shrink(),
                  ),
                );
              }).toList(),
                  ),
                ],
        ],
      ),
    );
  }
}
