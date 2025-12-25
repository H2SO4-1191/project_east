import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';
import '../config/theme.dart';
import '../providers/theme_provider.dart';
import '../services/profile_service.dart';
import '../services/api_service.dart';
import '../services/explore_service.dart';
import '../providers/auth_provider.dart';
import '../widgets/language_switcher.dart';
import '../widgets/full_screen_image_viewer.dart';
import '../widgets/animated_background.dart';
import '../widgets/enhanced_loading_indicator.dart';

class InstitutionProfileScreen extends StatefulWidget {
  final String username;

  const InstitutionProfileScreen({
    super.key,
    required this.username,
  });

  @override
  State<InstitutionProfileScreen> createState() => _InstitutionProfileScreenState();
}

class _InstitutionProfileScreenState extends State<InstitutionProfileScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  
  Map<String, dynamic>? _profile;
  List<dynamic> _posts = [];
  List<dynamic> _courses = [];
  List<dynamic> _jobs = [];
  
  bool _isLoadingProfile = true;
  bool _isLoadingPosts = false;
  bool _isLoadingCourses = false;
  bool _isLoadingJobs = false;
  
  String? _error;
  
  // Expanded state for descriptions
  Map<int, bool> _expandedCourses = {};
  Map<int, bool> _expandedJobs = {};
  
  // Course modal state
  bool _isLoadingCourseProgress = false;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _loadProfile();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _loadProfile() async {
    setState(() {
      _isLoadingProfile = true;
      _error = null;
    });

    try {
      final response = await ProfileService.getInstitutionPublicProfile(widget.username);
      final profileData = response['data'] is Map<String, dynamic>
          ? response['data']
          : response;

      setState(() {
        _profile = profileData;
        _isLoadingProfile = false;
      });

      // Load all data
      _loadPosts();
      _loadCourses();
      _loadJobs();
    } catch (e) {
      setState(() {
        _error = e is ApiException ? e.message : 'Failed to load profile';
        _isLoadingProfile = false;
      });
    }
  }

  Future<void> _loadTabData(int index) async {
    if (index == 0 && _posts.isEmpty && !_isLoadingPosts) {
      await _loadPosts();
    } else if (index == 1 && _courses.isEmpty && !_isLoadingCourses) {
      await _loadCourses();
    } else if (index == 2 && _jobs.isEmpty && !_isLoadingJobs) {
      await _loadJobs();
    }
  }

  Future<void> _loadPosts() async {
    setState(() {
      _isLoadingPosts = true;
    });

    try {
      final response = await ProfileService.getInstitutionPosts(widget.username);
      final posts = response['results'] is List
          ? List<dynamic>.from(response['results'])
          : (response['data'] is List
              ? List<dynamic>.from(response['data'])
              : []);

      setState(() {
        _posts = posts;
        _isLoadingPosts = false;
      });
    } catch (e) {
      setState(() {
        _isLoadingPosts = false;
      });
    }
  }

  Future<void> _loadCourses() async {
    setState(() {
      _isLoadingCourses = true;
    });

    try {
      final response = await ProfileService.getInstitutionCourses(widget.username);
      final courses = response['results'] is List
          ? List<dynamic>.from(response['results'])
          : (response['data'] is List
              ? List<dynamic>.from(response['data'])
              : []);

      setState(() {
        _courses = courses;
        _isLoadingCourses = false;
      });
    } catch (e) {
      setState(() {
        _isLoadingCourses = false;
      });
    }
  }

  Future<void> _loadJobs() async {
    setState(() {
      _isLoadingJobs = true;
    });

    try {
      final response = await ProfileService.getInstitutionJobs(widget.username);
      final jobs = response['results'] is List
          ? List<dynamic>.from(response['results'])
          : (response['data'] is List
              ? List<dynamic>.from(response['data'])
              : []);

      setState(() {
        _jobs = jobs;
        _isLoadingJobs = false;
      });
    } catch (e) {
      setState(() {
        _isLoadingJobs = false;
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
    String cleanPath = path.startsWith('/') ? path : '/$path';
    // Fix double /media/media/ issue
    cleanPath = cleanPath.replaceAll(RegExp(r'/media/media+'), '/media/');
    if (cleanPath.startsWith('/media/media/')) {
      cleanPath = cleanPath.replaceFirst('/media/media/', '/media/');
    }
    return '$baseUrl$cleanPath';
  }
  
  bool _isAccountUnverified() {
    if (_profile == null) return false;
    
    // Simple check: if endpoint doesn't return a "description" (about), account is not verified
    final description = _profile!['about'] ?? _profile!['description'];
    if (description == null || description.toString().trim().isEmpty) {
      return true;
    }
    
    return false;
  }

  List<String> _getPostImages(dynamic post) {
    final List<String> images = [];
    
    // Check for images array
    if (post['images'] != null) {
      if (post['images'] is List) {
        for (var img in post['images']) {
          if (img is Map && img['image'] != null) {
            final url = _getImageUrl(img['image']);
            if (url != null) images.add(url);
          } else if (img is String) {
            final url = _getImageUrl(img);
            if (url != null) images.add(url);
          }
        }
      }
    }
    
    // Check for single image field
    if (post['image'] != null) {
      final url = _getImageUrl(post['image']);
      if (url != null && !images.contains(url)) {
        images.add(url);
      }
    }
    
    return images;
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: isDark ? AppTheme.navy900 : Colors.white,
      appBar: AppBar(
        elevation: 0,
        backgroundColor: isDark ? AppTheme.navy800 : Colors.white,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => Navigator.pop(context),
        ),
        title: _isLoadingProfile
            ? null
            : Text(
                _profile?['title'] ?? _profile?['username'] ?? 'Profile',
                style: const TextStyle(fontWeight: FontWeight.bold),
              ),
        actions: [
          const LanguageSwitcher(),
          IconButton(
            icon: Icon(isDark ? Icons.wb_sunny : Icons.nightlight_round),
            onPressed: () {
              Provider.of<ThemeProvider>(context, listen: false).toggleTheme();
            },
          ),
        ],
      ),
      body: AnimatedBackground(
        child: _isLoadingProfile
            ? const Center(child: EnhancedLoadingIndicator())
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
                          onPressed: _loadProfile,
                          child: const Text('Retry'),
                        ),
                      ],
                    ),
                  )
                : _profile == null
                    ? const Center(child: Text('Profile not found'))
                    : _buildProfileContent(context, isDark),
      ),
    );
  }

  Widget _buildProfileContent(BuildContext context, bool isDark) {
    final profileImageUrl = _getImageUrl(_profile!['profile_image']);
    final name = _profile!['title'] ?? _profile!['username'] ?? 'Institution';
    final city = _profile!['city'] ?? _profile!['location'] ?? '';
    final about = _profile!['about'] ?? '';
    final upTime = _profile!['up_time'];
    final upDays = _profile!['up_days'];

    return NestedScrollView(
      headerSliverBuilder: (context, innerBoxIsScrolled) {
        return [
          SliverToBoxAdapter(
            child: Container(
              padding: const EdgeInsets.all(20),
              child: Column(
                children: [
                  // Verification Status Label
                  if (_isAccountUnverified())
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(12),
                      margin: const EdgeInsets.only(bottom: 16),
                      decoration: BoxDecoration(
                        color: Colors.orange.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: Colors.orange.withOpacity(0.3)),
                      ),
                      child: Row(
                        children: [
                          Icon(Icons.info_outline, color: Colors.orange, size: 20),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              'This account is not verified yet. Limited information is available.',
                              style: TextStyle(
                                color: Colors.orange.shade700,
                                fontSize: 12,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  // Profile Header (Instagram-like)
                  Row(
                    children: [
                      // Profile Image
                      GestureDetector(
                        onTap: profileImageUrl != null
                            ? () {
                                Navigator.of(context).push(
                                  MaterialPageRoute(
                                    builder: (context) => FullScreenImageViewer(imageUrl: profileImageUrl),
                                    fullscreenDialog: true,
                                  ),
                                );
                              }
                            : null,
                        child: Container(
                          width: 100,
                          height: 100,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            border: Border.all(
                              color: isDark ? AppTheme.navy700 : Colors.grey.shade300,
                              width: 3,
                            ),
                            image: profileImageUrl != null
                                ? DecorationImage(
                                    image: NetworkImage(profileImageUrl),
                                    fit: BoxFit.cover,
                                  )
                                : null,
                          ),
                          child: profileImageUrl == null
                              ? Container(
                                  decoration: BoxDecoration(
                                    shape: BoxShape.circle,
                                    color: AppTheme.primary600,
                                  ),
                                  child: Center(
                                    child: Text(
                                      name.isNotEmpty ? name[0].toUpperCase() : 'I',
                                      style: const TextStyle(
                                        color: Colors.white,
                                        fontSize: 40,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                  ),
                                )
                              : null,
                        ),
                      ),
                      const SizedBox(width: 20),
                      // Stats
                      Expanded(
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceAround,
                          children: [
                            _buildStatColumn(
                              _posts.length.toString(),
                              'Posts',
                              isDark,
                            ),
                            _buildStatColumn(
                              _courses.length.toString(),
                              'Courses',
                              isDark,
                            ),
                            _buildStatColumn(
                              _jobs.length.toString(),
                              'Jobs',
                              isDark,
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 20),
                  // Name and Bio
                  Align(
                    alignment: Alignment.centerLeft,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          name,
                          style: const TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        if (city.isNotEmpty) ...[
                          const SizedBox(height: 4),
                          Row(
                            children: [
                              Icon(Icons.location_on, size: 16, color: Colors.grey.shade600),
                              const SizedBox(width: 4),
                              Text(
                                city,
                                style: TextStyle(
                                  fontSize: 14,
                                  color: Colors.grey.shade600,
                                ),
                              ),
                            ],
                          ),
                        ],
                        if (about.isNotEmpty) ...[
                          const SizedBox(height: 12),
                          Text(
                            about,
                            style: const TextStyle(fontSize: 14),
                          ),
                        ],
                        // Social Media Links
                        if (_hasSocialMediaLinks(_profile!)) ...[
                          const SizedBox(height: 16),
                          _buildSocialMediaLinks(_profile!, isDark),
                        ],
                        // Up Time and Up Days
                        if (upTime != null || upDays != null) ...[
                          const SizedBox(height: 12),
                          if (upTime != null)
                            Row(
                              children: [
                                Icon(Icons.access_time, size: 16, color: Colors.grey.shade600),
                                const SizedBox(width: 4),
                                Text(
                                  'Up Time: $upTime',
                                  style: TextStyle(
                                    fontSize: 14,
                                    color: Colors.grey.shade600,
                                  ),
                                ),
                              ],
                            ),
                          if (upDays != null && upDays.toString().isNotEmpty) ...[
                            if (upTime != null) const SizedBox(height: 4),
                            Row(
                              children: [
                                Icon(Icons.calendar_today, size: 16, color: Colors.grey.shade600),
                                const SizedBox(width: 4),
                                Expanded(
                                  child: Text(
                                    'Up Days: ${upDays.toString()}',
                                    style: TextStyle(
                                      fontSize: 14,
                                      color: Colors.grey.shade600,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ],
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        ];
      },
      body: Column(
        children: [
          // Tab Bar
          Container(
            decoration: BoxDecoration(
              color: isDark ? AppTheme.navy800 : Colors.white,
              border: Border(
                bottom: BorderSide(color: Colors.grey.shade300),
              ),
            ),
            child: TabBar(
              controller: _tabController,
              indicatorColor: AppTheme.primary600,
              labelColor: AppTheme.primary600,
              unselectedLabelColor: Colors.grey.shade600,
              onTap: (index) {
                _loadTabData(index);
              },
              tabs: const [
                Tab(icon: Icon(Icons.article), text: 'Posts'),
                Tab(icon: Icon(Icons.book), text: 'Courses'),
                Tab(icon: Icon(Icons.work), text: 'Jobs'),
              ],
            ),
          ),
          // Tab Content
          Expanded(
            child: TabBarView(
              controller: _tabController,
              children: [
                _buildPostsTab(isDark),
                _buildCoursesTab(isDark),
                _buildJobsTab(isDark),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatColumn(String count, String label, bool isDark) {
    return Column(
      children: [
        Text(
          count,
          style: const TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          label,
          style: TextStyle(
            fontSize: 12,
            color: Colors.grey.shade600,
          ),
        ),
      ],
    );
  }

  Widget _buildPostsTab(bool isDark) {
    if (_isLoadingPosts) {
      return const Center(child: EnhancedLoadingIndicator());
    }

    if (_posts.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.article, size: 64, color: Colors.grey.shade400),
            const SizedBox(height: 16),
            Text(
              'No posts yet',
              style: TextStyle(color: Colors.grey.shade600),
            ),
          ],
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: _posts.length,
      itemBuilder: (context, index) {
        final post = _posts[index];
        final postImages = _getPostImages(post);
        final imageUrl = postImages.isNotEmpty ? postImages[0] : null;
        
        return GestureDetector(
          onTap: () => _showPostModal(post),
          child: Container(
          margin: const EdgeInsets.only(bottom: 16),
          decoration: BoxDecoration(
            color: isDark ? AppTheme.navy800 : Colors.white,
            borderRadius: BorderRadius.circular(12),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.05),
                blurRadius: 10,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: Row(
            children: [
              if (imageUrl != null)
                ClipRRect(
                  borderRadius: const BorderRadius.only(
                    topLeft: Radius.circular(12),
                    bottomLeft: Radius.circular(12),
                  ),
                  child: Image.network(
                    imageUrl,
                    width: 120,
                    height: 120,
                    fit: BoxFit.cover,
                    errorBuilder: (context, error, stackTrace) {
                      return Container(
                        width: 120,
                        height: 120,
                        color: AppTheme.primary100,
                        child: const Icon(Icons.image_not_supported, color: Colors.grey),
                      );
                    },
                  ),
                )
              else
                Container(
                  width: 120,
                  height: 120,
                  decoration: BoxDecoration(
                    color: AppTheme.primary100,
                    borderRadius: const BorderRadius.only(
                      topLeft: Radius.circular(12),
                      bottomLeft: Radius.circular(12),
                    ),
                  ),
                  child: const Icon(Icons.article, color: Colors.grey, size: 40),
                ),
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        post['title'] ?? 'Post',
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      if (post['description'] != null) ...[
                        const SizedBox(height: 4),
                        _buildExpandableText(
                          post['description'],
                          index,
                          _expandedCourses, // Reuse expandedCourses map for posts
                          (idx, expanded) {
                            setState(() {
                              _expandedCourses[idx] = expanded;
                            });
                          },
                          isDark,
                        ),
                      ],
                      if (post['created_at'] != null) ...[
                        const SizedBox(height: 8),
                        Text(
                          _formatPostDate(post['created_at']),
                          style: TextStyle(
                            fontSize: 12,
                            color: isDark ? Colors.white70 : Colors.grey.shade600,
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
        );
      },
    );
  }

  Widget _buildCoursesTab(bool isDark) {
    if (_isLoadingCourses) {
      return const Center(child: EnhancedLoadingIndicator());
    }

    if (_courses.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.book, size: 64, color: Colors.grey.shade400),
            const SizedBox(height: 16),
            Text(
              'No courses yet',
              style: TextStyle(color: Colors.grey.shade600),
            ),
          ],
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: _courses.length,
      itemBuilder: (context, index) {
        final course = _courses[index];
        final imageUrl = _getImageUrl(course['course_image']);
        
        return GestureDetector(
          onTap: () => _showCourseModal(course),
          child: Container(
            margin: const EdgeInsets.only(bottom: 16),
            decoration: BoxDecoration(
              color: isDark ? AppTheme.navy800 : Colors.white,
              borderRadius: BorderRadius.circular(12),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.05),
                  blurRadius: 10,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: Row(
            children: [
              if (imageUrl != null)
                ClipRRect(
                  borderRadius: const BorderRadius.only(
                    topLeft: Radius.circular(12),
                    bottomLeft: Radius.circular(12),
                  ),
                  child: Image.network(
                    imageUrl,
                    width: 120,
                    height: 120,
                    fit: BoxFit.cover,
                  ),
                ),
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        course['title'] ?? 'Course',
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      if (course['about'] != null) ...[
                        const SizedBox(height: 4),
                        _buildExpandableText(
                          course['about'],
                          index,
                          _expandedCourses,
                          (idx, expanded) {
                            setState(() {
                              _expandedCourses[idx] = expanded;
                            });
                          },
                          isDark,
                        ),
                      ],
                      if (course['price'] != null) ...[
                        const SizedBox(height: 8),
                        Text(
                          '\$${course['price']}',
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                            color: AppTheme.primary600,
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
              ),
            ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildJobsTab(bool isDark) {
    if (_isLoadingJobs) {
      return const Center(child: EnhancedLoadingIndicator());
    }

    if (_jobs.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.work, size: 64, color: Colors.grey.shade400),
            const SizedBox(height: 16),
            Text(
              'No jobs yet',
              style: TextStyle(color: Colors.grey.shade600),
            ),
          ],
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: _jobs.length,
      itemBuilder: (context, index) {
        final job = _jobs[index];
        
        return GestureDetector(
          onTap: () => _showJobModal(job),
          child: Container(
            margin: const EdgeInsets.only(bottom: 16),
            decoration: BoxDecoration(
              color: isDark ? AppTheme.navy800 : Colors.white,
              borderRadius: BorderRadius.circular(12),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.05),
                  blurRadius: 10,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: Row(
              children: [
                // Job Icon/Image placeholder
                Container(
                  width: 120,
                  height: 120,
                  decoration: BoxDecoration(
                    color: AppTheme.primary100,
                    borderRadius: const BorderRadius.only(
                      topLeft: Radius.circular(12),
                      bottomLeft: Radius.circular(12),
                    ),
                  ),
                  child: const Icon(Icons.work, color: AppTheme.primary600, size: 50),
                ),
                Expanded(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          job['title'] ?? 'Job',
                          style: const TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        if (job['description'] != null) ...[
                          const SizedBox(height: 4),
                          _buildExpandableText(
                            job['description'],
                            index,
                            _expandedJobs,
                            (idx, expanded) {
                              setState(() {
                                _expandedJobs[idx] = expanded;
                              });
                            },
                            isDark,
                          ),
                        ],
                        if (job['salary_offer'] != null) ...[
                          const SizedBox(height: 8),
                          Text(
                            '\$${job['salary_offer']}',
                            style: TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                              color: AppTheme.primary600,
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildExpandableText(
    String text,
    int index,
    Map<int, bool> expandedMap,
    Function(int, bool) onToggle,
    bool isDark,
  ) {
    final isExpanded = expandedMap[index] ?? false;
    final shouldShowExpand = text.length > 100;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          isExpanded ? text : (shouldShowExpand ? '${text.substring(0, 100)}...' : text),
          style: TextStyle(
            fontSize: 14,
            color: isDark ? Colors.white70 : Colors.grey.shade600,
          ),
        ),
        if (shouldShowExpand)
          GestureDetector(
            onTap: () => onToggle(index, !isExpanded),
            child: Padding(
              padding: const EdgeInsets.only(top: 4),
              child: Text(
                isExpanded ? 'Show less' : 'Show more',
                style: TextStyle(
                  fontSize: 12,
                  color: AppTheme.primary600,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ),
      ],
    );
  }

  Future<void> _showCourseModal(Map<String, dynamic> course) async {
    setState(() {
      _isLoadingCourseProgress = true;
    });

    // Fetch course progress
    Map<String, dynamic>? progress;
    try {
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      final accessToken = authProvider.instituteData['accessToken'];
      final refreshToken = authProvider.instituteData['refreshToken'];

      progress = await ExploreService.getCourseProgress(
        courseId: course['id'] as int,
        accessToken: accessToken,
        refreshToken: refreshToken,
        onTokenRefreshed: (tokens) {
          authProvider.onTokenRefreshed(tokens);
        },
        onSessionExpired: () {
          authProvider.onSessionExpired();
        },
      );
    } catch (e) {
      // Progress fetch failed, continue without it
    }

    if (!mounted) return;

    showDialog(
      context: context,
      barrierDismissible: true,
      builder: (context) => _buildCourseModal(context, course, progress),
    ).then((_) {
      setState(() {
        _isLoadingCourseProgress = false;
      });
    });
  }

  Widget _buildCourseModal(BuildContext context, Map<String, dynamic> course, Map<String, dynamic>? progressData) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final courseImageUrl = _getImageUrl(course['course_image']);
    final progress = progressData?['progress'];

    return Dialog(
      backgroundColor: Colors.transparent,
      insetPadding: const EdgeInsets.all(16),
      child: Container(
        constraints: const BoxConstraints(maxWidth: 500),
        decoration: BoxDecoration(
          color: isDark ? AppTheme.navy800 : Colors.white,
          borderRadius: BorderRadius.circular(20),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Header with image
            Stack(
              children: [
                if (courseImageUrl != null)
                  GestureDetector(
                    onTap: () {
                      Navigator.of(context).push(
                        MaterialPageRoute(
                          builder: (context) => FullScreenImageViewer(imageUrl: courseImageUrl),
                          fullscreenDialog: true,
                        ),
                      );
                    },
                    child: ClipRRect(
                      borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
                      child: Image.network(
                        courseImageUrl,
                        height: 200,
                        width: double.infinity,
                        fit: BoxFit.cover,
                        errorBuilder: (context, error, stackTrace) {
                          return Container(
                            height: 200,
                            color: AppTheme.primary600,
                            child: Center(
                              child: Text(
                                ((course['title'] ?? 'C') as String).isNotEmpty 
                                    ? (course['title'] ?? 'C')[0].toUpperCase() 
                                    : 'C',
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 64,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ),
                          );
                        },
                      ),
                    ),
                  )
                else
                  Container(
                    height: 200,
                    decoration: BoxDecoration(
                      color: AppTheme.primary600,
                      borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
                    ),
                    child: Center(
                      child: Text(
                        (course['title'] ?? 'C')[0].toUpperCase(),
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 64,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ),
                // Close button
                Positioned(
                  top: 8,
                  right: 8,
                  child: IconButton(
                    icon: Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: Colors.black.withOpacity(0.5),
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(Icons.close, color: Colors.white, size: 20),
                    ),
                    onPressed: () {
                      Navigator.pop(context);
                    },
                  ),
                ),
              ],
            ),
            // Content
            Flexible(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(24),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Title
                    Text(
                      course['title'] ?? 'Course',
                      style: const TextStyle(
                        fontSize: 24,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 16),
                    // Course Details Grid
                    Row(
                      children: [
                        if (course['level'] != null)
                          Expanded(
                            child: _buildDetailChip(
                              Icons.school,
                              course['level'].toString().toUpperCase(),
                              isDark,
                            ),
                          ),
                        if (course['price'] != null) ...[
                          const SizedBox(width: 8),
                          Expanded(
                            child: _buildDetailChip(
                              Icons.attach_money,
                              '\$${course['price']}',
                              isDark,
                            ),
                          ),
                        ],
                      ],
                    ),
                    const SizedBox(height: 16),
                    // Dates
                    if (course['starting_date'] != null || course['ending_date'] != null)
                      Row(
                        children: [
                          if (course['starting_date'] != null)
                            Expanded(
                              child: _buildDateInfo(
                                Icons.calendar_today,
                                'Start',
                                course['starting_date'],
                                isDark,
                              ),
                            ),
                          if (course['ending_date'] != null) ...[
                            const SizedBox(width: 12),
                            Expanded(
                              child: _buildDateInfo(
                                Icons.event,
                                'End',
                                course['ending_date'],
                                isDark,
                              ),
                            ),
                          ],
                        ],
                      ),
                    const SizedBox(height: 16),
                    // About
                    if (course['about'] != null) ...[
                      const Text(
                        'About',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        course['about'],
                        style: TextStyle(
                          fontSize: 14,
                          color: isDark ? Colors.white70 : Colors.grey.shade600,
                          height: 1.5,
                        ),
                      ),
                      const SizedBox(height: 24),
                    ],
                    // Progress Section
                    if (progress != null) ...[
                      const Divider(),
                      const SizedBox(height: 16),
                      const Text(
                        'Course Progress',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 16),
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: isDark ? AppTheme.navy700 : Colors.grey.shade100,
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Column(
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text(
                                  'Progress',
                                  style: TextStyle(
                                    fontSize: 14,
                                    color: isDark ? Colors.white70 : Colors.grey.shade600,
                                  ),
                                ),
                                Text(
                                  '${(progress['progress_percentage'] ?? 0).toStringAsFixed(1)}%',
                                  style: const TextStyle(
                                    fontSize: 18,
                                    fontWeight: FontWeight.bold,
                                    color: AppTheme.primary600,
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 12),
                            LinearProgressIndicator(
                              value: ((progress['progress_percentage'] ?? 0) as num) / 100,
                              backgroundColor: Colors.grey.shade300,
                              valueColor: const AlwaysStoppedAnimation<Color>(AppTheme.primary600),
                              minHeight: 8,
                              borderRadius: BorderRadius.circular(4),
                            ),
                            const SizedBox(height: 12),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                _buildProgressStat(
                                  'Total Lectures',
                                  '${progress['total_lectures'] ?? 0}',
                                  isDark,
                                ),
                                if (progress['completed_lectures'] != null)
                                  _buildProgressStat(
                                    'Completed',
                                    '${progress['completed_lectures']}',
                                    isDark,
                                  ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ] else if (_isLoadingCourseProgress) ...[
                      const Divider(),
                      const SizedBox(height: 16),
                      const Center(child: EnhancedLoadingIndicator()),
                    ],
                    // Enroll Button
                    if (course['id'] != null) ...[
                      const SizedBox(height: 24),
                      SizedBox(
                        width: double.infinity,
                        child: ElevatedButton(
                          onPressed: () {
                            Navigator.pop(context); // Close modal first
                            Navigator.pushNamed(
                              context,
                              '/student/enroll',
                              arguments: course['id'],
                            );
                          },
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
                              Icon(Icons.school, size: 20),
                              SizedBox(width: 8),
                              Text(
                                'Enroll Now',
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
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDetailChip(IconData icon, String label, bool isDark) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: isDark ? AppTheme.navy700 : AppTheme.primary50,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 16, color: AppTheme.primary600),
          const SizedBox(width: 6),
          Flexible(
            child: Text(
              label,
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: AppTheme.primary600,
              ),
              overflow: TextOverflow.ellipsis,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDateInfo(IconData icon, String label, String date, bool isDark) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: isDark ? AppTheme.navy700 : Colors.grey.shade100,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          Icon(icon, size: 18, color: AppTheme.primary600),
          const SizedBox(width: 8),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: TextStyle(
                    fontSize: 11,
                    color: isDark ? Colors.white70 : Colors.grey.shade600,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  _formatDate(date),
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildProgressStat(String label, String value, bool isDark) {
    return Column(
      children: [
        Text(
          value,
          style: const TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          label,
          style: TextStyle(
            fontSize: 12,
            color: isDark ? Colors.white70 : Colors.grey.shade600,
          ),
        ),
      ],
    );
  }

  String _formatDate(String dateString) {
    try {
      final date = DateTime.parse(dateString);
      return '${date.month}/${date.day}/${date.year}';
    } catch (e) {
      return dateString;
    }
  }

  String _formatPostDate(String dateString) {
    try {
      final date = DateTime.parse(dateString);
      final now = DateTime.now();
      final difference = now.difference(date);

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
        return '${date.month}/${date.day}/${date.year}';
      }
    } catch (e) {
      return dateString;
    }
  }

  bool _hasSocialMediaLinks(Map<String, dynamic> profile) {
    return (profile['facebook_link'] != null && profile['facebook_link'].toString().isNotEmpty) ||
           (profile['instagram_link'] != null && profile['instagram_link'].toString().isNotEmpty) ||
           (profile['x_link'] != null && profile['x_link'].toString().isNotEmpty) ||
           (profile['tiktok_link'] != null && profile['tiktok_link'].toString().isNotEmpty);
  }

  Widget _buildSocialMediaLinks(Map<String, dynamic> profile, bool isDark) {
    return Wrap(
      spacing: 8,
      runSpacing: 8,
      children: [
        if (profile['facebook_link'] != null && profile['facebook_link'].toString().isNotEmpty)
          _buildSocialMediaIcon(
            context: context,
            icon: Icons.facebook,
            url: profile['facebook_link'].toString(),
            color: const Color(0xFF1877F2),
            isDark: isDark,
          ),
        if (profile['instagram_link'] != null && profile['instagram_link'].toString().isNotEmpty)
          _buildSocialMediaIcon(
            context: context,
            icon: Icons.camera_alt,
            url: profile['instagram_link'].toString(),
            color: const Color(0xFFE4405F),
            isDark: isDark,
          ),
        if (profile['x_link'] != null && profile['x_link'].toString().isNotEmpty)
          _buildSocialMediaIcon(
            context: context,
            icon: Icons.alternate_email,
            url: profile['x_link'].toString(),
            color: Colors.black,
            isDark: isDark,
          ),
        if (profile['tiktok_link'] != null && profile['tiktok_link'].toString().isNotEmpty)
          _buildSocialMediaIcon(
            context: context,
            icon: Icons.music_note,
            url: profile['tiktok_link'].toString(),
            color: const Color(0xFF000000),
            isDark: isDark,
          ),
      ],
    );
  }

  Widget _buildSocialMediaIcon({
    required BuildContext context,
    required IconData icon,
    required String url,
    required Color color,
    required bool isDark,
  }) {
    return InkWell(
      onTap: () async {
        await _openExternalUrl(context, url);
      },
      borderRadius: BorderRadius.circular(20),
      child: Container(
        width: 40,
        height: 40,
        decoration: BoxDecoration(
          color: isDark ? AppTheme.navy700 : Colors.grey.shade100,
          shape: BoxShape.circle,
          border: Border.all(
            color: color.withOpacity(0.3),
            width: 1.5,
          ),
        ),
        child: Icon(icon, color: color, size: 20),
      ),
    );
  }

  Future<void> _openExternalUrl(BuildContext context, String rawUrl) async {
    String formattedUrl = rawUrl.trim();
    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      formattedUrl = 'https://$formattedUrl';
    }
    final uri = Uri.tryParse(formattedUrl);
    if (uri == null) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Could not open $formattedUrl')),
        );
      }
      return;
    }
    try {
      final opened = await launchUrl(uri, mode: LaunchMode.externalApplication);
      if (!opened && context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Could not open $formattedUrl')),
        );
      }
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Could not open $formattedUrl')),
        );
      }
    }
  }

  Future<void> _showJobModal(Map<String, dynamic> job) async {

    // Fetch job details
    Map<String, dynamic>? jobDetails;
    try {
      final response = await ExploreService.getJobDetails(job['id'] as int);
      jobDetails = response['data'] is Map<String, dynamic>
          ? response['data'] as Map<String, dynamic>
          : response;
    } catch (e) {
      // If fetch fails, use the job data we already have
      jobDetails = job;
    }

    if (!mounted) return;

    showDialog(
      context: context,
      barrierDismissible: true,
      builder: (context) => _buildJobModal(context, jobDetails ?? job),
    );
  }

  Widget _buildJobModal(BuildContext context, Map<String, dynamic> job) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Dialog(
      backgroundColor: Colors.transparent,
      insetPadding: const EdgeInsets.all(16),
      child: Container(
        constraints: const BoxConstraints(maxWidth: 500),
        decoration: BoxDecoration(
          color: isDark ? AppTheme.navy800 : Colors.white,
          borderRadius: BorderRadius.circular(20),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Header
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [AppTheme.primary600, AppTheme.teal500],
                ),
                borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
              ),
              child: Row(
                children: [
                  Container(
                    width: 60,
                    height: 60,
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.2),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Icon(Icons.work, color: Colors.white, size: 30),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          job['title'] ?? 'Job',
                          style: const TextStyle(
                            fontSize: 22,
                            fontWeight: FontWeight.bold,
                            color: Colors.white,
                          ),
                        ),
                        if (job['specialty'] != null)
                          Text(
                            job['specialty'],
                            style: const TextStyle(
                              fontSize: 14,
                              color: Colors.white70,
                            ),
                          ),
                      ],
                    ),
                  ),
                  IconButton(
                    icon: Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.2),
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(Icons.close, color: Colors.white, size: 20),
                    ),
                    onPressed: () => Navigator.pop(context),
                  ),
                ],
              ),
            ),
            // Content
            Flexible(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(24),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Salary
                    if (job['salary_offer'] != null) ...[
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: isDark ? AppTheme.navy700 : AppTheme.primary50,
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Row(
                          children: [
                            Icon(Icons.attach_money, color: AppTheme.primary600, size: 28),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    'Salary Offer',
                                    style: TextStyle(
                                      fontSize: 12,
                                      color: Colors.grey.shade600,
                                    ),
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    '\$${job['salary_offer']}',
                                    style: const TextStyle(
                                      fontSize: 24,
                                      fontWeight: FontWeight.bold,
                                      color: AppTheme.primary600,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 16),
                    ],
                    // Description
                    if (job['description'] != null) ...[
                      const Text(
                        'Description',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        job['description'],
                        style: TextStyle(
                          fontSize: 14,
                          color: Colors.grey.shade600,
                          height: 1.5,
                        ),
                      ),
                      const SizedBox(height: 24),
                    ],
                    // Requirements Grid
                    if (job['experience_required'] != null || job['skills_required'] != null) ...[
                      const Divider(),
                      const SizedBox(height: 16),
                      const Text(
                        'Requirements',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 16),
                      if (job['experience_required'] != null)
                        _buildRequirementItem(
                          Icons.trending_up,
                          'Experience Required',
                          '${job['experience_required']} ${job['experience_required'] == 1 ? 'year' : 'years'}',
                          isDark,
                        ),
                      if (job['skills_required'] != null) ...[
                        const SizedBox(height: 12),
                        _buildRequirementItem(
                          Icons.star,
                          'Skills Required',
                          job['skills_required'],
                          isDark,
                        ),
                      ],
                      const SizedBox(height: 24),
                    ],
                    // Posted Date
                    if (job['created_at'] != null) ...[
                      const Divider(),
                      const SizedBox(height: 16),
                      Row(
                        children: [
                          Icon(Icons.calendar_today, size: 16, color: isDark ? Colors.white70 : Colors.grey.shade600),
                          const SizedBox(width: 8),
                          Text(
                            'Posted: ${_formatPostDate(job['created_at'])}',
                            style: TextStyle(
                              fontSize: 12,
                              color: isDark ? Colors.white70 : Colors.grey.shade600,
                            ),
                          ),
                        ],
                      ),
                    ],
                    // Apply Button (for lecturers only)
                    if (job['id'] != null) ...[
                      const SizedBox(height: 24),
                      Consumer<AuthProvider>(
                        builder: (context, authProvider, _) {
                          final isLecturer = authProvider.instituteData['userType'] == 'lecturer';
                          final isVerified = authProvider.isVerified;
                          
                          if (!isLecturer || !isVerified) {
                            return const SizedBox.shrink();
                          }
                          
                          return SizedBox(
                            width: double.infinity,
                            child: ElevatedButton.icon(
                              onPressed: () {
                                Navigator.pop(context); // Close job modal first
                                _showApplyJobModal(context, job['id'] as int);
                              },
                              icon: const Icon(Icons.send, size: 20),
                              label: const Text(
                                'Apply',
                                style: TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: AppTheme.primary600,
                                foregroundColor: Colors.white,
                                padding: const EdgeInsets.symmetric(vertical: 16),
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                elevation: 4,
                              ),
                            ),
                          );
                        },
                      ),
                    ],
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showApplyJobModal(BuildContext context, int jobId) {
    final messageController = TextEditingController();
    final formKey = GlobalKey<FormState>();
    bool isSubmitting = false;

    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => StatefulBuilder(
        builder: (context, setState) {
          return AlertDialog(
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(20),
            ),
            title: const Row(
              children: [
                Icon(Icons.work, color: AppTheme.primary600),
                SizedBox(width: 12),
                Text('Apply for Job'),
              ],
            ),
            content: Form(
              key: formKey,
              child: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Message (Optional)',
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(height: 8),
                    TextFormField(
                      controller: messageController,
                      maxLines: 5,
                      decoration: InputDecoration(
                        hintText: 'Add a message to your application...',
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                        filled: true,
                        fillColor: Colors.grey.shade50,
                      ),
                    ),
                  ],
                ),
              ),
            ),
            actions: [
              TextButton(
                onPressed: isSubmitting
                    ? null
                    : () {
                        Navigator.pop(context);
                      },
                child: const Text('Cancel'),
              ),
              ElevatedButton(
                onPressed: isSubmitting
                    ? null
                    : () async {
                        if (!formKey.currentState!.validate()) return;

                        setState(() {
                          isSubmitting = true;
                        });

                        try {
                          final authProvider = Provider.of<AuthProvider>(context, listen: false);
                          final accessToken = authProvider.instituteData['accessToken'];
                          final refreshToken = authProvider.instituteData['refreshToken'];

                          final response = await ExploreService.applyToJob(
                            jobId: jobId,
                            accessToken: accessToken!,
                            message: messageController.text.trim(),
                            refreshToken: refreshToken,
                            onTokenRefreshed: (tokens) {
                              authProvider.onTokenRefreshed(tokens);
                            },
                            onSessionExpired: () {
                              authProvider.onSessionExpired();
                            },
                          );

                          if (context.mounted) {
                            Navigator.pop(context);
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(
                                content: Row(
                                  children: [
                                    const Icon(Icons.check_circle, color: Colors.white),
                                    const SizedBox(width: 12),
                                    Text(
                                      response['message'] ?? 'Application submitted successfully!',
                                    ),
                                  ],
                                ),
                                backgroundColor: Colors.green,
                                duration: const Duration(seconds: 3),
                              ),
                            );
                          }
                        } catch (e) {
                          if (context.mounted) {
                            setState(() {
                              isSubmitting = false;
                            });
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(
                                content: Text(
                                  e is ApiException
                                      ? e.message
                                      : 'Failed to submit application. Please try again.',
                                ),
                                backgroundColor: Colors.red,
                                duration: const Duration(seconds: 3),
                              ),
                            );
                          }
                        }
                      },
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.primary600,
                  foregroundColor: Colors.white,
                ),
                child: isSubmitting
                    ? const SmallLoadingIndicator(
                        size: 20,
                        color: Colors.white,
                      )
                    : const Text('Submit Application'),
              ),
            ],
          );
        },
      ),
    );
  }

  Widget _buildRequirementItem(IconData icon, String label, String value, bool isDark) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isDark ? AppTheme.navy700 : Colors.grey.shade100,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          Icon(icon, color: AppTheme.primary600, size: 24),
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
                const SizedBox(height: 4),
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
      ),
    );
  }

  Future<void> _showPostModal(Map<String, dynamic> post) async {
    if (!mounted) return;

    showDialog(
      context: context,
      barrierDismissible: true,
      builder: (context) => _buildPostModal(context, post),
    );
  }

  Widget _buildPostModal(BuildContext context, Map<String, dynamic> post) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final postImages = _getPostImages(post);
    final title = post['title'] ?? 'Post';
    final description = post['description'] ?? '';
    final createdAt = post['created_at'];

    return Dialog(
      backgroundColor: Colors.transparent,
      insetPadding: const EdgeInsets.all(16),
      child: Container(
        constraints: const BoxConstraints(maxWidth: 500),
        decoration: BoxDecoration(
          color: isDark ? AppTheme.navy800 : Colors.white,
          borderRadius: BorderRadius.circular(20),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Header with image(s)
            Stack(
              children: [
                if (postImages.isNotEmpty)
                  GestureDetector(
                    onTap: () {
                      Navigator.of(context).push(
                        MaterialPageRoute(
                          builder: (context) => FullScreenImageViewer(imageUrl: postImages[0]),
                          fullscreenDialog: true,
                        ),
                      );
                    },
                    child: ClipRRect(
                      borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
                      child: Image.network(
                        postImages[0],
                        height: 300,
                        width: double.infinity,
                        fit: BoxFit.cover,
                        errorBuilder: (context, error, stackTrace) {
                          return Container(
                            height: 300,
                            color: AppTheme.primary600,
                            child: Center(
                            child: Text(
                              title.isNotEmpty ? title[0].toUpperCase() : 'P',
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 64,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            ),
                          );
                        },
                      ),
                    ),
                  )
                else
                  Container(
                    height: 200,
                    decoration: BoxDecoration(
                      color: AppTheme.primary600,
                      borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
                    ),
                    child: Center(
                            child: Text(
                              title.isNotEmpty ? title[0].toUpperCase() : 'P',
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 64,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                    ),
                  ),
                // Image indicator if multiple images
                if (postImages.length > 1)
                  Positioned(
                    bottom: 8,
                    left: 0,
                    right: 0,
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: List.generate(
                        postImages.length,
                        (index) => Container(
                          margin: const EdgeInsets.symmetric(horizontal: 4),
                          width: 8,
                          height: 8,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: index == 0
                                ? Colors.white
                                : Colors.white.withOpacity(0.5),
                          ),
                        ),
                      ),
                    ),
                  ),
                // Close button
                Positioned(
                  top: 8,
                  right: 8,
                  child: IconButton(
                    icon: Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: Colors.black.withOpacity(0.5),
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(Icons.close, color: Colors.white, size: 20),
                    ),
                    onPressed: () {
                      Navigator.pop(context);
                    },
                  ),
                ),
              ],
            ),
            // Content
            Flexible(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(24),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Title
                    Text(
                      title,
                      style: const TextStyle(
                        fontSize: 24,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 16),
                    // Description
                    if (description.isNotEmpty) ...[
                      const Text(
                        'Description',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        description,
                        style: TextStyle(
                          fontSize: 14,
                          color: isDark ? Colors.white70 : Colors.grey.shade600,
                          height: 1.5,
                        ),
                      ),
                      const SizedBox(height: 24),
                    ],
                    // Additional images if any
                    if (postImages.length > 1) ...[
                      const Divider(),
                      const SizedBox(height: 16),
                      const Text(
                        'More Images',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 12),
                      SizedBox(
                        height: 100,
                        child: ListView.builder(
                          scrollDirection: Axis.horizontal,
                          itemCount: postImages.length - 1,
                          itemBuilder: (context, index) {
                            final imgIndex = index + 1;
                            return GestureDetector(
                              onTap: () {
                                Navigator.of(context).push(
                                  MaterialPageRoute(
                                    builder: (context) => FullScreenImageViewer(imageUrl: postImages[imgIndex]),
                                    fullscreenDialog: true,
                                  ),
                                );
                              },
                              child: Container(
                                margin: const EdgeInsets.only(right: 8),
                                width: 100,
                                decoration: BoxDecoration(
                                  borderRadius: BorderRadius.circular(8),
                                  border: Border.all(color: isDark ? AppTheme.navy600 : Colors.grey.shade300),
                                ),
                                child: ClipRRect(
                                  borderRadius: BorderRadius.circular(8),
                                  child: Image.network(
                                    postImages[imgIndex],
                                    fit: BoxFit.cover,
                                    errorBuilder: (context, error, stackTrace) {
                                      return Container(
                                        color: Colors.grey.shade200,
                                        child: const Icon(Icons.broken_image),
                                      );
                                    },
                                  ),
                                ),
                              ),
                            );
                          },
                        ),
                      ),
                      const SizedBox(height: 24),
                    ],
                    // Posted Date
                    if (createdAt != null) ...[
                      const Divider(),
                      const SizedBox(height: 16),
                      Row(
                        children: [
                          Icon(Icons.calendar_today, size: 16, color: isDark ? Colors.white70 : Colors.grey.shade600),
                          const SizedBox(width: 8),
                          Text(
                            'Posted: ${_formatPostDate(createdAt.toString())}',
                            style: TextStyle(
                              fontSize: 12,
                              color: isDark ? Colors.white70 : Colors.grey.shade600,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
