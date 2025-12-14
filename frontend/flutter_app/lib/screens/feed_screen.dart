import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../config/theme.dart';
import '../providers/auth_provider.dart';
import '../providers/theme_provider.dart';
import '../widgets/language_switcher.dart';
import '../services/api_service.dart';
import '../models/feed_item.dart';
import '../services/profile_service.dart';
import '../services/explore_service.dart';

class FeedScreen extends StatefulWidget {
  const FeedScreen({super.key});

  @override
  State<FeedScreen> createState() => _FeedScreenState();
}

class _FeedScreenState extends State<FeedScreen> {
  final ScrollController _scrollController = ScrollController();
  bool _isLoading = true;
  String? _error;
  List<FeedItem> _feedItems = [];
  final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey<ScaffoldState>();

  @override
  void initState() {
    super.initState();
    _loadFeed();
  }

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  Future<void> _loadFeed() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      final accessToken = authProvider.accessToken;
      final refreshToken = authProvider.refreshToken;

      final data = await ApiService.getFeed(
        accessToken: accessToken,
        refreshToken: refreshToken,
        onTokenRefreshed: (tokens) {
          authProvider.onTokenRefreshed(tokens);
        },
        onSessionExpired: () {
          authProvider.onSessionExpired();
        },
      );

      if (data['results'] != null && data['results'] is List) {
        final items = (data['results'] as List)
            .map((item) => FeedItem.fromJson(item as Map<String, dynamic>))
            .toList();
        setState(() {
          _feedItems = items;
          _isLoading = false;
        });
      } else {
        setState(() {
          _feedItems = [];
          _isLoading = false;
        });
      }
    } catch (e) {
      setState(() {
        _error = e is ApiException ? e.message : 'Failed to load feed';
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final authProvider = Provider.of<AuthProvider>(context);
    final isAuthenticated = authProvider.isAuthenticated;
    final instituteData = authProvider.instituteData;

    return Scaffold(
      key: _scaffoldKey,
      backgroundColor: isDark ? AppTheme.navy900 : const Color(0xFFF9FAFB),
      drawer: _buildDrawer(context, isDark, isAuthenticated, instituteData),
      appBar: _buildAppBar(context, isDark, isAuthenticated, instituteData),
      floatingActionButton: _buildFloatingMenuButton(context, isDark, isAuthenticated, instituteData),
      floatingActionButtonLocation: FloatingActionButtonLocation.startFloat,
      body: RefreshIndicator(
        onRefresh: _loadFeed,
        child: CustomScrollView(
          controller: _scrollController,
          slivers: [
            // Hero Section
            SliverToBoxAdapter(
              child: _buildHeroSection(context, isDark, isAuthenticated, instituteData),
            ),
            // Feed Content
            if (_isLoading)
              SliverFillRemaining(
                child: Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const CircularProgressIndicator(),
                      const SizedBox(height: 16),
                      Text(
                        'Loading feed...',
                        style: theme.textTheme.bodyMedium,
                      ),
                    ],
                  ),
                ),
              )
            else if (_error != null)
              SliverFillRemaining(
                child: Center(
                  child: Padding(
                    padding: const EdgeInsets.all(24.0),
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
                          onPressed: _loadFeed,
                          child: const Text('Retry'),
                        ),
                      ],
                    ),
                  ),
                ),
              )
            else if (_feedItems.isEmpty)
              SliverFillRemaining(
                child: Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        Icons.feed_outlined,
                        size: 64,
                        color: Colors.grey.shade400,
                      ),
                      const SizedBox(height: 16),
                      Text(
                        'No feed items available',
                        style: theme.textTheme.bodyLarge?.copyWith(
                          color: Colors.grey.shade600,
                        ),
                      ),
                    ],
                  ),
                ),
              )
            else
              SliverPadding(
                padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0),
                sliver: SliverList(
                  delegate: SliverChildBuilderDelegate(
                    (context, index) {
                      return Padding(
                        padding: const EdgeInsets.only(bottom: 16.0),
                        child: _buildFeedItem(context, _feedItems[index], isDark),
                      );
                    },
                    childCount: _feedItems.length,
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }

  PreferredSizeWidget _buildAppBar(
    BuildContext context,
    bool isDark,
    bool isAuthenticated,
    Map<String, dynamic> instituteData,
  ) {
    return AppBar(
      elevation: 0,
      backgroundColor: isDark ? AppTheme.navy800 : Colors.white,
      automaticallyImplyLeading: false, // Remove default back button
      title: const Text(
            'Project East',
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.bold,
            ),
      ),
      actions: [
        // Account button (always visible)
        IconButton(
          icon: isAuthenticated
              ? CircleAvatar(
              radius: 16,
              backgroundColor: AppTheme.primary600,
              child: Text(
                (instituteData['username'] ?? instituteData['name'] ?? 'U')
                    .toString()
                    .substring(0, 1)
                    .toUpperCase(),
                style: const TextStyle(color: Colors.white, fontSize: 14),
              ),
                )
              : const Icon(Icons.account_circle),
            onPressed: () {
            _showAccountOptions(context, isDark, isAuthenticated, instituteData);
            },
          ),
      ],
    );
  }

  Widget _buildDrawer(
    BuildContext context,
    bool isDark,
    bool isAuthenticated,
    Map<String, dynamic> instituteData,
  ) {
    return Drawer(
      backgroundColor: isDark ? AppTheme.navy800 : Colors.white,
      child: _buildDrawerContent(context, isDark, isAuthenticated, instituteData),
    );
  }

  Widget _buildDrawerContent(
    BuildContext context,
    bool isDark,
    bool isAuthenticated,
    Map<String, dynamic> instituteData,
  ) {
    return ListView(
        padding: EdgeInsets.zero,
        children: [
          DrawerHeader(
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [AppTheme.primary600, AppTheme.teal500],
              ),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                const Text(
                  'Project East',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                if (isAuthenticated)
                  Padding(
                    padding: const EdgeInsets.only(top: 8.0),
                    child: Text(
                      instituteData['username'] ?? instituteData['name'] ?? 'User',
                      style: const TextStyle(
                        color: Colors.white70,
                        fontSize: 16,
                      ),
                    ),
                  ),
              ],
            ),
          ),
        // Explore button - Public (visible to everyone)
        ListTile(
          leading: const Icon(Icons.explore),
          title: const Text('Explore'),
          onTap: () {
            Navigator.pop(context);
            Navigator.pushNamed(context, '/explore');
          },
        ),
          if (isAuthenticated) ...[
          const Divider(),
          // Lecturer-specific buttons
          if (instituteData['userType'] == 'lecturer') ...[
            ListTile(
              leading: const Icon(Icons.book),
              title: const Text('Current Courses'),
              onTap: () {
                Navigator.pop(context);
                Navigator.pushNamed(context, '/lecturer/courses');
              },
            ),
            ListTile(
              leading: const Icon(Icons.calendar_today),
              title: const Text('Schedules'),
              onTap: () {
                Navigator.pop(context);
                Navigator.pushNamed(context, '/lecturer/schedule');
              },
            ),
            const Divider(),
          ],
          // Student-specific buttons
          if (instituteData['userType'] == 'student') ...[
            ListTile(
              leading: const Icon(Icons.book),
              title: const Text('My Courses'),
              onTap: () {
                Navigator.pop(context);
                Navigator.pushNamed(context, '/student/courses');
              },
            ),
            ListTile(
              leading: const Icon(Icons.calendar_today),
              title: const Text('My Schedule'),
              onTap: () {
                Navigator.pop(context);
                Navigator.pushNamed(context, '/student/schedule');
              },
            ),
            const Divider(),
          ],
          // Institution-specific buttons
          if (instituteData['userType'] == 'institution') ...[
            ListTile(
              leading: const Icon(Icons.dashboard),
              title: const Text('Dashboard'),
              onTap: () {
                Navigator.pop(context);
                Navigator.pushNamed(context, '/dashboard');
              },
            ),
          ],
            ListTile(
              leading: const Icon(Icons.person),
              title: const Text('Profile'),
              onTap: () {
                Navigator.pop(context);
                // TODO: Navigate to profile
              },
            ),
            const Divider(),
          ],
          ListTile(
            leading: Icon(isDark ? Icons.wb_sunny : Icons.nightlight_round),
            title: Text(isDark ? 'Light Mode' : 'Dark Mode'),
            onTap: () {
              Provider.of<ThemeProvider>(context, listen: false).toggleTheme();
            },
          ),
        const Divider(),
        const LanguageSwitcher(isInDrawer: true),
            const Divider(),
            ListTile(
          leading: Icon(isAuthenticated ? Icons.account_circle : Icons.account_circle_outlined),
          title: Text(isAuthenticated ? 'Account' : 'Account'),
              onTap: () {
                Navigator.pop(context);
            _showAccountOptions(context, isDark, isAuthenticated, instituteData);
              },
            ),
          ],
    );
  }

  Widget _buildHeroSection(
    BuildContext context,
    bool isDark,
    bool isAuthenticated,
    Map<String, dynamic> instituteData,
  ) {
    final firstName = instituteData['firstName'] ?? 
        instituteData['name'] ?? 
        instituteData['username'] ?? 
        'User';

    return Container(
      width: double.infinity,
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [AppTheme.primary600, AppTheme.teal500],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
      ),
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 48),
      child: Column(
        children: [
          Text(
            isAuthenticated 
                ? 'Welcome Back, $firstName!'
                : 'Discover Excellence',
            style: const TextStyle(
              fontSize: 28,
              fontWeight: FontWeight.bold,
              color: Colors.white,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 12),
          Text(
            isAuthenticated
                ? 'Explore institutions, courses, and opportunities'
                : 'Explore institutions, courses, and opportunities',
            style: const TextStyle(
              fontSize: 16,
              color: Colors.white70,
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  Widget _buildFeedItem(BuildContext context, FeedItem item, bool isDark) {
    if (item.type == 'course') {
      return _buildCourseCard(context, item, isDark);
    } else if (item.type == 'job') {
      return _buildJobCard(context, item, isDark);
    } else {
      return _buildPostCard(context, item, isDark);
    }
  }

  Widget _buildPostCard(BuildContext context, FeedItem item, bool isDark) {
    final theme = Theme.of(context);
    final imageUrl = item.getImageUrl(item.publisherProfileImage);
    final publisherUsername = item.publisherUsername ?? item.publisherName;
    
    return Card(
      elevation: 2,
      color: isDark ? AppTheme.navy800 : Colors.white,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: Row(
              children: [
                GestureDetector(
                  onTap: publisherUsername == null
                      ? null
                      : () => Navigator.pushNamed(
                            context,
                            '/institution-profile',
                            arguments: publisherUsername,
                          ),
                  child: CircleAvatar(
                  radius: 24,
                  backgroundColor: AppTheme.primary600,
                  backgroundImage: imageUrl.isNotEmpty ? NetworkImage(imageUrl) : null,
                  child: imageUrl.isEmpty
                      ? Text(
                          (item.publisherName ?? 'P')[0].toUpperCase(),
                          style: const TextStyle(color: Colors.white),
                        )
                      : null,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      GestureDetector(
                        onTap: publisherUsername == null
                            ? null
                            : () => Navigator.pushNamed(
                                  context,
                                  '/institution-profile',
                                  arguments: publisherUsername,
                                ),
                        child: Text(
                        item.publisherName ?? 'Publisher',
                        style: theme.textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.bold,
                            color: publisherUsername != null
                                ? AppTheme.primary600
                                : null,
                          ),
                        ),
                      ),
                      if (item.timestamp != null)
                        Text(
                          item.timestamp!,
                          style: theme.textTheme.bodySmall?.copyWith(
                            color: Colors.grey.shade600,
                          ),
                        ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          // Content
          if (item.title != null)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16.0),
              child: Text(
                item.title!,
                style: theme.textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          if (item.description != null)
            Padding(
              padding: const EdgeInsets.all(16.0),
              child: Text(
                item.description!,
                style: theme.textTheme.bodyMedium,
              ),
            ),
          // Images
          if (item.images != null && item.images!.isNotEmpty)
            _buildImageGrid(item.images!, item),
        ],
      ),
    );
  }

  Widget _buildCourseCard(BuildContext context, FeedItem item, bool isDark) {
    final theme = Theme.of(context);
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final isStudent = authProvider.instituteData['userType'] == 'student';
    final courseImageUrl = item.getImageUrl(item.courseImage);
    
    return GestureDetector(
      onTap: () => _showCourseModalFromFeed(item),
      child: Card(
      elevation: 2,
      color: isDark ? AppTheme.navy800 : Colors.white,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Course Image
                Container(
                  width: 100,
                  height: 100,
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(12),
                    color: AppTheme.primary100,
                  ),
                  child: courseImageUrl.isNotEmpty
                      ? ClipRRect(
                          borderRadius: BorderRadius.circular(12),
                          child: Image.network(
                            courseImageUrl,
                            fit: BoxFit.cover,
                            errorBuilder: (context, error, stackTrace) {
                              return Center(
                                child: Text(
                                  (item.title ?? 'C')[0].toUpperCase(),
                                  style: TextStyle(
                                    fontSize: 32,
                                    fontWeight: FontWeight.bold,
                                    color: AppTheme.primary600,
                                  ),
                                ),
                              );
                            },
                          ),
                        )
                      : Center(
                          child: Text(
                            (item.title ?? 'C')[0].toUpperCase(),
                            style: TextStyle(
                              fontSize: 32,
                              fontWeight: FontWeight.bold,
                              color: AppTheme.primary600,
                            ),
                          ),
                        ),
                ),
                const SizedBox(width: 16),
                // Course Info
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        item.title ?? 'Course',
                        style: theme.textTheme.titleLarge?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      if (item.level != null)
                        Padding(
                          padding: const EdgeInsets.only(top: 4.0),
                          child: Text(
                            item.level!,
                            style: theme.textTheme.bodySmall?.copyWith(
                              color: AppTheme.primary600,
                            ),
                          ),
                        ),
                      if (item.price != null)
                        Padding(
                          padding: const EdgeInsets.only(top: 8.0),
                          child: Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 12,
                              vertical: 6,
                            ),
                            decoration: BoxDecoration(
                              color: AppTheme.primary50,
                              borderRadius: BorderRadius.circular(20),
                            ),
                            child: Text(
                              '${item.price} ${item.currency ?? '\$'}',
                              style: theme.textTheme.bodySmall?.copyWith(
                                fontWeight: FontWeight.bold,
                                color: AppTheme.primary700,
                              ),
                            ),
                          ),
                        ),
                    ],
                  ),
                ),
              ],
            ),
            if (item.description != null)
              Padding(
                padding: const EdgeInsets.only(top: 12.0),
                child: Text(
                  item.description!,
                  style: theme.textTheme.bodyMedium,
                  maxLines: 3,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            // Course Details
            if (item.startingDate != null || item.city != null)
              Padding(
                padding: const EdgeInsets.only(top: 12.0),
                child: Wrap(
                  spacing: 12,
                  runSpacing: 8,
                  children: [
                    if (item.startingDate != null)
                      Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(
                            Icons.calendar_today,
                            size: 16,
                            color: AppTheme.primary500,
                          ),
                          const SizedBox(width: 4),
                          Text(
                            item.startingDate!,
                            style: theme.textTheme.bodySmall,
                          ),
                        ],
                      ),
                    if (item.city != null)
                      Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(
                            Icons.location_on,
                            size: 16,
                            color: AppTheme.primary500,
                          ),
                          const SizedBox(width: 4),
                          Text(
                            item.city!,
                            style: theme.textTheme.bodySmall,
                          ),
                        ],
                      ),
                  ],
                ),
              ),
            // Enroll Button
            if (isStudent)
              Padding(
                padding: const EdgeInsets.only(top: 16.0),
                child: SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: item.isEnrolled == true
                        ? null
                        : () {
                            // TODO: Implement enrollment
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(content: Text('Enrollment feature coming soon')),
                            );
                          },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: item.isEnrolled == true
                          ? Colors.grey
                          : AppTheme.primary600,
                      foregroundColor: Colors.white,
                    ),
                    child: Text(
                      item.isEnrolled == true ? 'Enrolled' : 'Enroll',
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

  Widget _buildJobCard(BuildContext context, FeedItem item, bool isDark) {
    final theme = Theme.of(context);
    final imageUrl = item.getImageUrl(item.publisherProfileImage);
    final publisherUsername = item.publisherUsername;
    
    return GestureDetector(
      onTap: () => _showJobModalFromFeed(item),
      child: Card(
      elevation: 2,
      color: isDark ? AppTheme.navy800 : Colors.white,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                GestureDetector(
                  onTap: publisherUsername == null
                      ? null
                      : () => _openProfileByUsername(publisherUsername),
                  child: CircleAvatar(
                  radius: 28,
                  backgroundColor: AppTheme.primary600,
                  backgroundImage: imageUrl.isNotEmpty ? NetworkImage(imageUrl) : null,
                  child: imageUrl.isEmpty
                      ? Text(
                          (item.publisherUsername ?? 'J')[0].toUpperCase(),
                          style: const TextStyle(color: Colors.white),
                        )
                      : null,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        item.title ?? 'Job',
                        style: theme.textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      if (item.publisherUsername != null)
                        GestureDetector(
                          onTap: () => Navigator.pushNamed(
                                context,
                                '/institution-profile',
                                arguments: item.publisherUsername,
                              ),
                          child: Text(
                          '@${item.publisherUsername}',
                          style: theme.textTheme.bodySmall?.copyWith(
                              color: AppTheme.primary600,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ),
                      if (item.timestamp != null)
                        Padding(
                          padding: const EdgeInsets.only(top: 4.0),
                          child: Row(
                            children: [
                              Icon(
                                Icons.access_time,
                                size: 14,
                                color: Colors.grey.shade500,
                              ),
                              const SizedBox(width: 4),
                              Text(
                                item.timestamp!,
                                style: theme.textTheme.bodySmall?.copyWith(
                                  color: Colors.grey.shade600,
                                ),
                              ),
                            ],
                          ),
                        ),
                    ],
                  ),
                ),
              ],
            ),
            if (item.description != null)
              Padding(
                padding: const EdgeInsets.only(top: 12.0),
                child: Text(
                  item.description!,
                  style: theme.textTheme.bodyMedium,
                  maxLines: 3,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            // Meta info
            if (item.institution != null || item.city != null)
              Padding(
                padding: const EdgeInsets.only(top: 12.0),
                child: Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: [
                    if (item.institution != null)
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 12,
                          vertical: 6,
                        ),
                        decoration: BoxDecoration(
                          color: AppTheme.primary50,
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(
                              Icons.school,
                              size: 14,
                              color: AppTheme.primary700,
                            ),
                            const SizedBox(width: 4),
                            Text(
                              item.institution!,
                              style: theme.textTheme.bodySmall?.copyWith(
                                fontWeight: FontWeight.bold,
                                color: AppTheme.primary700,
                              ),
                            ),
                          ],
                        ),
                      ),
                    if (item.city != null)
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 12,
                          vertical: 6,
                        ),
                        decoration: BoxDecoration(
                          color: Colors.grey.shade100,
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(
                              Icons.location_on,
                              size: 14,
                              color: Colors.grey.shade700,
                            ),
                            const SizedBox(width: 4),
                            Text(
                              item.city!,
                              style: theme.textTheme.bodySmall?.copyWith(
                                color: Colors.grey.shade700,
                              ),
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

  Future<void> _showCourseModalFromFeed(FeedItem item) async {
    if (item.id == null) return;

    // Fetch course details
    Map<String, dynamic>? courseData;
    try {
      courseData = await ExploreService.getCourseDetails(item.id!);
      courseData = courseData['data'] is Map<String, dynamic>
          ? courseData['data'] as Map<String, dynamic>
          : courseData;
    } catch (e) {
      // If fetch fails, use item data
      courseData = {
        'id': item.id,
        'title': item.title,
        'about': item.description,
        'course_image': item.courseImage,
        'starting_date': item.startingDate,
        'ending_date': item.endingDate,
        'level': item.level,
        'price': item.price,
      };
    }

    // Fetch course progress
    Map<String, dynamic>? progress;
    try {
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      final accessToken = authProvider.instituteData['accessToken'];
      final refreshToken = authProvider.instituteData['refreshToken'];

      progress = await ExploreService.getCourseProgress(
        courseId: item.id!,
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
      builder: (context) => _buildCourseModal(context, courseData!, progress),
    );
  }

  Future<void> _showJobModalFromFeed(FeedItem item) async {
    if (item.id == null) return;

    // Fetch job details
    Map<String, dynamic>? jobData;
    try {
      jobData = await ExploreService.getJobDetails(item.id!);
      jobData = jobData['data'] is Map<String, dynamic>
          ? jobData['data'] as Map<String, dynamic>
          : jobData;
    } catch (e) {
      // If fetch fails, use item data
      jobData = {
        'id': item.id,
        'title': item.title,
        'description': item.description,
        'salary_offer': null,
      };
    }

    if (!mounted) return;

    showDialog(
      context: context,
      barrierDismissible: true,
      builder: (context) => _buildJobModal(context, jobData!, item.publisherUsername),
    );
  }

  Widget _buildCourseModal(BuildContext context, Map<String, dynamic> course, Map<String, dynamic>? progressData) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    dynamic courseImageUrlData = course['course_image'];
    String? courseImageUrl;
    if (courseImageUrlData != null) {
      courseImageUrl = courseImageUrlData.toString();
      if (!courseImageUrl.startsWith('http')) {
        courseImageUrl = '${ApiService.baseUrl}${courseImageUrl.startsWith('/') ? courseImageUrl : '/$courseImageUrl'}';
      }
    }
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
                  ClipRRect(
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
                              (course['title'] ?? 'C')[0].toUpperCase(),
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
                    onPressed: () => Navigator.pop(context),
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
                          color: Colors.grey.shade600,
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
                                    color: Colors.grey.shade600,
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

  Widget _buildJobModal(BuildContext context, Map<String, dynamic> job, String? institutionUsername) {
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
                        if (institutionUsername != null) ...[
                          const SizedBox(height: 8),
                          GestureDetector(
                            onTap: () {
                              Navigator.pop(context);
                              Navigator.pushNamed(
                                context,
                                '/institution-profile',
                                arguments: institutionUsername,
                              );
                            },
                            child: Text(
                              '@$institutionUsername',
                              style: const TextStyle(
                                fontSize: 14,
                                color: Colors.white,
                                decoration: TextDecoration.underline,
                                decorationColor: Colors.white,
                              ),
                            ),
                          ),
                        ],
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
                          Icon(Icons.calendar_today, size: 16, color: Colors.grey.shade600),
                          const SizedBox(width: 8),
                          Text(
                            'Posted: ${_formatPostDate(job['created_at'])}',
                            style: TextStyle(
                              fontSize: 12,
                              color: Colors.grey.shade600,
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
                    color: Colors.grey.shade600,
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
            color: Colors.grey.shade600,
          ),
        ),
      ],
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
                    color: Colors.grey.shade600,
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

  Future<void> _openProfileByUsername(String username) async {
    Map<String, dynamic>? profile;
    String? type;

    Future<Map<String, dynamic>?> tryFetch(
        Future<Map<String, dynamic>> Function(String) fn, String t) async {
      try {
        final res = await fn(username);
        final data = res['data'] is Map<String, dynamic>
            ? res['data']
            : res;
        type ??= t;
        return data;
      } catch (_) {
        return null;
      }
    }

    profile ??= await tryFetch(ProfileService.getStudentPublicProfile, 'student');
    profile ??= await tryFetch(ProfileService.getLecturerPublicProfile, 'lecturer');
    profile ??= await tryFetch(ProfileService.getInstitutionPublicProfile, 'institution');

    if (profile == null || type == null) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Could not load profile for $username')),
        );
      }
      return;
    }

    if (!mounted) return;
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (context) => _buildProfileSheet(profile!, type!),
    );
  }

  Widget _buildProfileSheet(Map<String, dynamic> profile, String type) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    String? imageUrl = profile['profile_image'];
    if (imageUrl is String && imageUrl.isNotEmpty && !(imageUrl.startsWith('http://') || imageUrl.startsWith('https://'))) {
      imageUrl = '${ApiService.baseUrl}${imageUrl.startsWith('/') ? imageUrl : '/$imageUrl'}';
    }
    final fullName = '${profile['first_name'] ?? ''} ${profile['last_name'] ?? ''}'.trim();
    final displayName = fullName.isEmpty ? (profile['username'] ?? 'User') : fullName;

    return Container(
      decoration: BoxDecoration(
        color: isDark ? AppTheme.navy800 : Colors.white,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
      ),
      padding: const EdgeInsets.all(24),
      child: SafeArea(
        top: false,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                CircleAvatar(
                  radius: 32,
                  backgroundColor: AppTheme.primary600,
                  backgroundImage: imageUrl != null ? NetworkImage(imageUrl) : null,
                  child: imageUrl == null
                      ? Text(
                          displayName.isNotEmpty ? displayName[0].toUpperCase() : 'U',
                          style: const TextStyle(color: Colors.white, fontSize: 20),
                        )
                      : null,
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        displayName,
                        style: theme.textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold),
                      ),
                      if (profile['city'] != null)
                        Text(
                          profile['city'],
                          style: theme.textTheme.bodySmall?.copyWith(color: Colors.grey.shade600),
                        ),
                      Text(
                        type.toUpperCase(),
                        style: theme.textTheme.bodySmall?.copyWith(color: AppTheme.primary600),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            if (profile['about'] != null) ...[
              const SizedBox(height: 16),
              Text('About', style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              Text(profile['about'], style: theme.textTheme.bodyMedium),
            ],
            const SizedBox(height: 16),
            Align(
              alignment: Alignment.centerRight,
              child: TextButton(
                onPressed: () => Navigator.pop(context),
                child: const Text('Close'),
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildImageGrid(List<FeedImage> images, FeedItem item) {
    if (images.isEmpty) return const SizedBox.shrink();
    
    if (images.length == 1) {
      final imageUrl = item.getImageUrl(images[0].image);
      if (imageUrl.isEmpty) return const SizedBox.shrink();
      
      return Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(12),
          child: Image.network(
            imageUrl,
            width: double.infinity,
            height: 300,
            fit: BoxFit.cover,
            errorBuilder: (context, error, stackTrace) {
              return Container(
                height: 300,
                color: Colors.grey.shade200,
                child: const Center(
                  child: Icon(Icons.broken_image, size: 48),
                ),
              );
            },
          ),
        ),
      );
    }
    
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0),
      child: GridView.builder(
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 2,
          crossAxisSpacing: 8,
          mainAxisSpacing: 8,
          childAspectRatio: 1,
        ),
        itemCount: images.length > 4 ? 4 : images.length,
        itemBuilder: (context, index) {
          final imageUrl = item.getImageUrl(images[index].image);
          if (imageUrl.isEmpty) {
            return Container(
              color: Colors.grey.shade200,
              child: const Center(
                child: Icon(Icons.broken_image),
              ),
            );
          }
          
          return ClipRRect(
            borderRadius: BorderRadius.circular(8),
            child: Image.network(
              imageUrl,
              fit: BoxFit.cover,
              errorBuilder: (context, error, stackTrace) {
                return Container(
                  color: Colors.grey.shade200,
                  child: const Center(
                    child: Icon(Icons.broken_image),
                  ),
                );
              },
            ),
          );
        },
      ),
    );
  }

  void _handleLogout(BuildContext context) async {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    await authProvider.logout();
    if (context.mounted) {
      Navigator.pushNamedAndRemoveUntil(context, '/', (route) => false);
    }
  }

  Widget _buildFloatingMenuButton(
    BuildContext context,
    bool isDark,
    bool isAuthenticated,
    Map<String, dynamic> instituteData,
  ) {
    return FloatingActionButton(
      onPressed: () {
        _showAnimatedDrawer(context, isDark, isAuthenticated, instituteData);
      },
      backgroundColor: AppTheme.primary600,
      child: Container(
        width: 56,
        height: 56,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(12),
          gradient: const LinearGradient(
            colors: [AppTheme.primary600, AppTheme.teal500],
          ),
        ),
        child: const Icon(
          Icons.school,
          color: Colors.white,
          size: 28,
        ),
      ),
    );
  }

  void _showAnimatedDrawer(
    BuildContext context,
    bool isDark,
    bool isAuthenticated,
    Map<String, dynamic> instituteData,
  ) {
    showGeneralDialog(
      context: context,
      barrierDismissible: true,
      barrierLabel: MaterialLocalizations.of(context).modalBarrierDismissLabel,
      barrierColor: Colors.black.withOpacity(0.5),
      transitionDuration: const Duration(milliseconds: 300),
      pageBuilder: (context, animation, secondaryAnimation) {
        return _AnimatedDrawerContent(
          animation: animation,
          isDark: isDark,
          isAuthenticated: isAuthenticated,
          instituteData: instituteData,
          drawerContent: _buildDrawerContent(context, isDark, isAuthenticated, instituteData),
        );
      },
    );
  }

  void _showAccountOptions(
    BuildContext context,
    bool isDark,
    bool isAuthenticated,
    Map<String, dynamic> instituteData,
  ) {
    if (isAuthenticated) {
      // Show user menu
      showModalBottomSheet(
        context: context,
        backgroundColor: Colors.transparent,
        builder: (context) => Container(
          decoration: BoxDecoration(
            color: isDark ? AppTheme.navy800 : Colors.white,
            borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
          ),
          child: SafeArea(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                ListTile(
                  leading: const Icon(Icons.person),
                  title: Text(instituteData['username'] ?? instituteData['name'] ?? 'User'),
                  subtitle: Text(instituteData['userType'] ?? 'User'),
                ),
                const Divider(),
                ListTile(
                  leading: const Icon(Icons.logout, color: Colors.red),
                  title: const Text('Logout', style: TextStyle(color: Colors.red)),
                  onTap: () {
                    Navigator.pop(context);
                    _handleLogout(context);
                  },
                ),
                const SizedBox(height: 8),
              ],
            ),
          ),
        ),
      );
    } else {
      // Show Login/Sign Up options
      showModalBottomSheet(
        context: context,
        backgroundColor: Colors.transparent,
        builder: (context) => Container(
          decoration: BoxDecoration(
            color: isDark ? AppTheme.navy800 : Colors.white,
            borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
          ),
          child: SafeArea(
            child: Padding(
              padding: const EdgeInsets.all(24.0),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    'Welcome',
                    style: Theme.of(context).textTheme.titleLarge?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 24),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: () {
                        Navigator.pop(context);
                        Navigator.pushNamed(context, '/login');
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppTheme.primary600,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                      child: const Text('Login'),
                    ),
                  ),
                  const SizedBox(height: 12),
                  SizedBox(
                    width: double.infinity,
                    child: OutlinedButton(
                      onPressed: () {
                        Navigator.pop(context);
                        Navigator.pushNamed(context, '/account-type-selection');
                      },
                      style: OutlinedButton.styleFrom(
                        foregroundColor: AppTheme.primary600,
                        side: const BorderSide(color: AppTheme.primary600, width: 2),
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                      child: const Text('Sign Up'),
                    ),
                  ),
                  const SizedBox(height: 8),
                ],
              ),
            ),
          ),
        ),
      );
    }
  }
}

class _AnimatedDrawerContent extends StatelessWidget {
  final Animation<double> animation;
  final bool isDark;
  final bool isAuthenticated;
  final Map<String, dynamic> instituteData;
  final Widget drawerContent;

  const _AnimatedDrawerContent({
    required this.animation,
    required this.isDark,
    required this.isAuthenticated,
    required this.instituteData,
    required this.drawerContent,
  });

  @override
  Widget build(BuildContext context) {
    final fadeAnimation = Tween<double>(
      begin: 0.0,
      end: 1.0,
    ).animate(
      CurvedAnimation(
        parent: animation,
        curve: Curves.easeInOut,
      ),
    );

    final slideAnimation = Tween<Offset>(
      begin: const Offset(-1.0, 0.0),
      end: Offset.zero,
    ).animate(
      CurvedAnimation(
        parent: animation,
        curve: Curves.easeOutCubic,
      ),
    );

    return GestureDetector(
      onTap: () => Navigator.of(context).pop(),
      child: Container(
        color: Colors.transparent,
        child: Stack(
          children: [
            // Backdrop
            FadeTransition(
              opacity: fadeAnimation,
              child: Container(
                color: Colors.black.withOpacity(0.5),
              ),
            ),
            // Drawer
            SlideTransition(
              position: slideAnimation,
              child: FadeTransition(
                opacity: fadeAnimation,
                child: GestureDetector(
                  onTap: () {}, // Prevent closing when tapping inside drawer
                  child: Material(
                    color: isDark ? AppTheme.navy800 : Colors.white,
                    child: Container(
                      width: MediaQuery.of(context).size.width * 0.75,
                      child: SafeArea(
                        child: drawerContent,
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
