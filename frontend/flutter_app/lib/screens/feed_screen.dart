import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../config/theme.dart';
import '../providers/auth_provider.dart';
import '../widgets/profile_button.dart';
import '../widgets/full_screen_image_viewer.dart';
import '../services/api_service.dart';
import '../models/feed_item.dart';
import '../services/profile_service.dart';
import '../services/explore_service.dart';

class FeedScreen extends StatefulWidget {
  const FeedScreen({super.key});

  @override
  State<FeedScreen> createState() => _FeedScreenState();
}

class _FeedScreenState extends State<FeedScreen> with AutomaticKeepAliveClientMixin {
  final ScrollController _scrollController = ScrollController();
  bool _isLoading = true;
  String? _error;
  List<FeedItem> _feedItems = [];

  @override
  bool get wantKeepAlive => true;

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
    super.build(context); // Required for AutomaticKeepAliveClientMixin
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final authProvider = Provider.of<AuthProvider>(context);
    final isAuthenticated = authProvider.isAuthenticated;
    final instituteData = authProvider.instituteData;

    return Scaffold(
      backgroundColor: isDark ? AppTheme.navy900 : const Color(0xFFF9FAFB),
      appBar: _buildAppBar(context, isDark, isAuthenticated, instituteData),
      body: RefreshIndicator(
        onRefresh: _loadFeed,
        child: CustomScrollView(
          controller: _scrollController,
          slivers: [
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
                          color: isDark ? Colors.white70 : Colors.grey.shade600,
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
      automaticallyImplyLeading: false,
      leading: Padding(
        padding: const EdgeInsets.only(left: 8.0),
        child: ProfileButton(),
      ),
      title: const Text(
        'Project East',
        style: TextStyle(
          fontSize: 20,
          fontWeight: FontWeight.bold,
        ),
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
      child: Stack(
        children: [
          Column(
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
                            color: isDark ? Colors.white70 : Colors.grey.shade600,
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
          // Type Label
          Positioned(
            top: 12,
            right: 12,
            child: Container(
              padding: const EdgeInsets.symmetric(
                horizontal: 10,
                vertical: 5,
              ),
              decoration: BoxDecoration(
                color: AppTheme.teal500,
                borderRadius: BorderRadius.circular(12),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.2),
                    blurRadius: 4,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: const Text(
                'POST',
                style: TextStyle(
                  fontSize: 10,
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                  letterSpacing: 0.5,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCourseCard(BuildContext context, FeedItem item, bool isDark) {
    final theme = Theme.of(context);
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final userType = authProvider.instituteData['userType'];
    final isInstitution = userType == 'institution';
    final isStudent = userType == 'student';
    
    // Get course image URL with better handling
    String courseImageUrl = '';
    if (item.courseImage != null && item.courseImage!.isNotEmpty) {
      courseImageUrl = item.getImageUrl(item.courseImage);
    }
    
    return GestureDetector(
      onTap: () {
        if (item.id == null) return;
        // Students go directly to enroll page, others go to course details
        if (isStudent) {
          Navigator.pushNamed(context, '/student/enroll', arguments: item.id);
        } else {
          Navigator.pushNamed(context, '/course', arguments: item.id);
        }
      },
      child: Card(
        elevation: 4,
        margin: EdgeInsets.zero,
        color: isDark ? AppTheme.navy800 : Colors.white,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Course Image Header
              Stack(
                children: [
                  Container(
                    height: 200,
                    width: double.infinity,
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: [AppTheme.primary600, AppTheme.teal500],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                    ),
                    child: courseImageUrl.isNotEmpty
                        ? Image.network(
                            courseImageUrl,
                            fit: BoxFit.cover,
                            loadingBuilder: (context, child, loadingProgress) {
                              if (loadingProgress == null) return child;
                              return Container(
                                decoration: const BoxDecoration(
                                  gradient: LinearGradient(
                                    colors: [AppTheme.primary600, AppTheme.teal500],
                                    begin: Alignment.topLeft,
                                    end: Alignment.bottomRight,
                                  ),
                                ),
                                child: Center(
                                  child: CircularProgressIndicator(
                                    value: loadingProgress.expectedTotalBytes != null
                                        ? loadingProgress.cumulativeBytesLoaded /
                                            loadingProgress.expectedTotalBytes!
                                        : null,
                                    color: Colors.white,
                                  ),
                                ),
                              );
                            },
                            errorBuilder: (context, error, stackTrace) {
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
                                    (item.title ?? 'C')[0].toUpperCase(),
                                    style: const TextStyle(
                                      fontSize: 64,
                                      fontWeight: FontWeight.bold,
                                      color: Colors.white,
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
                                begin: Alignment.topLeft,
                                end: Alignment.bottomRight,
                              ),
                            ),
                            child: Center(
                              child: Text(
                                (item.title ?? 'C')[0].toUpperCase(),
                                style: const TextStyle(
                                  fontSize: 64,
                                  fontWeight: FontWeight.bold,
                                  color: Colors.white,
                                ),
                              ),
                            ),
                          ),
                  ),
                  // Gradient overlay for better text readability
                  Positioned.fill(
                    child: Container(
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          begin: Alignment.topCenter,
                          end: Alignment.bottomCenter,
                          colors: [
                            Colors.transparent,
                            Colors.black.withOpacity(0.3),
                          ],
                        ),
                      ),
                    ),
                  ),
                  // Type Label
                  Positioned(
                    top: 16,
                    left: 16,
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 10,
                        vertical: 5,
                      ),
                      decoration: BoxDecoration(
                        color: AppTheme.primary600,
                        borderRadius: BorderRadius.circular(12),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withOpacity(0.3),
                            blurRadius: 8,
                            offset: const Offset(0, 2),
                          ),
                        ],
                      ),
                      child: const Text(
                        'COURSE',
                        style: TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                          letterSpacing: 0.5,
                        ),
                      ),
                    ),
                  ),
                  // Level badge
                  if (item.level != null)
                    Positioned(
                      top: 16,
                      right: 16,
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 12,
                          vertical: 6,
                        ),
                        decoration: BoxDecoration(
                          color: Colors.white.withOpacity(0.9),
                          borderRadius: BorderRadius.circular(20),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withOpacity(0.1),
                              blurRadius: 8,
                              offset: const Offset(0, 2),
                            ),
                          ],
                        ),
                        child: Text(
                          item.level!.toUpperCase(),
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                            color: AppTheme.primary700,
                            letterSpacing: 0.5,
                          ),
                        ),
                      ),
                    ),
                ],
              ),
              // Course Content
              Padding(
                padding: const EdgeInsets.all(20.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Title and Price Row
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Expanded(
                          child: Text(
                            item.title ?? 'Course',
                            style: theme.textTheme.titleLarge?.copyWith(
                              fontWeight: FontWeight.bold,
                              fontSize: 22,
                              height: 1.2,
                            ),
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        if (item.price != null) ...[
                          const SizedBox(width: 12),
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 14,
                              vertical: 8,
                            ),
                            decoration: BoxDecoration(
                              gradient: const LinearGradient(
                                colors: [AppTheme.primary600, AppTheme.teal500],
                              ),
                              borderRadius: BorderRadius.circular(12),
                              boxShadow: [
                                BoxShadow(
                                  color: AppTheme.primary600.withOpacity(0.3),
                                  blurRadius: 8,
                                  offset: const Offset(0, 4),
                                ),
                              ],
                            ),
                            child: Text(
                              '${item.price} ${item.currency ?? '\$'}',
                              style: const TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.bold,
                                color: Colors.white,
                              ),
                            ),
                          ),
                        ],
                      ],
                    ),
                    const SizedBox(height: 12),
                    // Description
                    if (item.description != null)
                      Text(
                        item.description!,
                        style: theme.textTheme.bodyMedium?.copyWith(
                          color: isDark ? Colors.white70 : Colors.grey.shade600,
                          height: 1.5,
                        ),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                    const SizedBox(height: 16),
                    // Course Details Row
                    if (item.startingDate != null || item.city != null)
                      Row(
                        children: [
                          if (item.startingDate != null) ...[
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
                                    Icons.calendar_today,
                                    size: 14,
                                    color: AppTheme.primary600,
                                  ),
                                  const SizedBox(width: 6),
                                  Text(
                                    item.startingDate!,
                                    style: theme.textTheme.bodySmall?.copyWith(
                                      fontWeight: FontWeight.w500,
                                      color: AppTheme.primary700,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            if (item.city != null) const SizedBox(width: 8),
                          ],
                          if (item.city != null)
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
                                    Icons.location_on,
                                    size: 14,
                                    color: Colors.grey.shade700,
                                  ),
                                  const SizedBox(width: 6),
                                  Text(
                                    item.city!,
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
                    // Enroll Button - only show for non-institution users
                    if (!isInstitution) ...[
                      if (item.isEnrolled == true) ...[
                        const SizedBox(height: 16),
                        SizedBox(
                          width: double.infinity,
                          child: ElevatedButton(
                            onPressed: null,
                            style: ElevatedButton.styleFrom(
                              backgroundColor: Colors.grey.shade400,
                              foregroundColor: Colors.white,
                              padding: const EdgeInsets.symmetric(vertical: 14),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(12),
                              ),
                              elevation: 0,
                            ),
                            child: const Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(Icons.check_circle, size: 20),
                                SizedBox(width: 8),
                                Text(
                                  'Enrolled',
                                  style: TextStyle(
                                    fontSize: 16,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ] else if (item.id != null) ...[
                        const SizedBox(height: 16),
                        SizedBox(
                          width: double.infinity,
                          child: ElevatedButton(
                            onPressed: () {
                              Navigator.pushNamed(
                                context,
                                '/student/enroll',
                                arguments: item.id,
                              );
                            },
                            style: ElevatedButton.styleFrom(
                              backgroundColor: AppTheme.primary600,
                              foregroundColor: Colors.white,
                              padding: const EdgeInsets.symmetric(vertical: 14),
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
                  ],
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
        elevation: 4,
        margin: EdgeInsets.zero,
        color: isDark ? AppTheme.navy800 : Colors.white,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(16),
          child: Stack(
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Header Section with Gradient
                  Container(
                    padding: const EdgeInsets.all(20.0),
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: [AppTheme.primary600, AppTheme.teal500],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                    ),
                    child: Row(
                      children: [
                        // Institution Avatar
                        GestureDetector(
                          onTap: publisherUsername == null
                              ? null
                              : () => _openProfileByUsername(publisherUsername),
                          child: Container(
                            width: 60,
                            height: 60,
                            decoration: BoxDecoration(
                              color: Colors.white.withOpacity(0.2),
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(
                                color: Colors.white.withOpacity(0.3),
                                width: 2,
                              ),
                            ),
                            child: imageUrl.isNotEmpty
                                ? ClipRRect(
                                    borderRadius: BorderRadius.circular(10),
                                    child: Image.network(
                                      imageUrl,
                                      fit: BoxFit.cover,
                                      errorBuilder: (context, error, stackTrace) {
                                        return Center(
                                          child: Text(
                                            (item.publisherUsername ?? 'J')[0].toUpperCase(),
                                            style: const TextStyle(
                                              color: Colors.white,
                                              fontSize: 24,
                                              fontWeight: FontWeight.bold,
                                            ),
                                          ),
                                        );
                                      },
                                    ),
                                  )
                                : Center(
                                    child: Text(
                                      (item.publisherUsername ?? 'J')[0].toUpperCase(),
                                      style: const TextStyle(
                                        color: Colors.white,
                                        fontSize: 24,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                  ),
                          ),
                        ),
                        const SizedBox(width: 16),
                        // Title and Institution Info
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                item.title ?? 'Job',
                                style: const TextStyle(
                                  fontSize: 20,
                                  fontWeight: FontWeight.bold,
                                  color: Colors.white,
                                  height: 1.2,
                                ),
                                maxLines: 2,
                                overflow: TextOverflow.ellipsis,
                              ),
                              if (item.publisherUsername != null) ...[
                                const SizedBox(height: 6),
                                GestureDetector(
                                  onTap: () => Navigator.pushNamed(
                                    context,
                                    '/institution-profile',
                                    arguments: item.publisherUsername,
                                  ),
                                  child: Row(
                                    children: [
                                      Icon(
                                        Icons.business,
                                        size: 14,
                                        color: Colors.white.withOpacity(0.9),
                                      ),
                                      const SizedBox(width: 4),
                                      Text(
                                        '@${item.publisherUsername}',
                                        style: TextStyle(
                                          fontSize: 13,
                                          color: Colors.white.withOpacity(0.9),
                                          fontWeight: FontWeight.w500,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                  // Content Section
                  Padding(
                    padding: const EdgeInsets.all(20.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Description
                        if (item.description != null)
                          Text(
                            item.description!,
                            style: theme.textTheme.bodyMedium?.copyWith(
                              color: isDark ? Colors.white70 : Colors.grey.shade600,
                              height: 1.5,
                            ),
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                          ),
                        const SizedBox(height: 16),
                        // Meta Info Row
                        if (item.institution != null || item.city != null || item.timestamp != null)
                          Wrap(
                            spacing: 8,
                            runSpacing: 8,
                            children: [
                              if (item.institution != null)
                                Container(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 12,
                                    vertical: 8,
                                  ),
                                  decoration: BoxDecoration(
                                    color: isDark
                                        ? AppTheme.navy700
                                        : AppTheme.primary50,
                                    borderRadius: BorderRadius.circular(10),
                                  ),
                                  child: Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      Icon(
                                        Icons.school,
                                        size: 16,
                                        color: AppTheme.primary600,
                                      ),
                                      const SizedBox(width: 6),
                                      Flexible(
                                        child: Text(
                                          item.institution!,
                                          style: theme.textTheme.bodySmall?.copyWith(
                                            fontWeight: FontWeight.w600,
                                            color: AppTheme.primary700,
                                          ),
                                          maxLines: 1,
                                          overflow: TextOverflow.ellipsis,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              if (item.city != null)
                                Container(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 12,
                                    vertical: 8,
                                  ),
                                  decoration: BoxDecoration(
                                    color: isDark
                                        ? AppTheme.navy700
                                        : Colors.grey.shade100,
                                    borderRadius: BorderRadius.circular(10),
                                  ),
                                  child: Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      Icon(
                                        Icons.location_on,
                                        size: 16,
                                        color: Colors.grey.shade700,
                                      ),
                                      const SizedBox(width: 6),
                                      Text(
                                        item.city!,
                                        style: theme.textTheme.bodySmall?.copyWith(
                                          fontWeight: FontWeight.w500,
                                          color: Colors.grey.shade700,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              if (item.timestamp != null)
                                Container(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 12,
                                    vertical: 8,
                                  ),
                                  decoration: BoxDecoration(
                                    color: isDark
                                        ? AppTheme.navy700
                                        : Colors.grey.shade100,
                                    borderRadius: BorderRadius.circular(10),
                                  ),
                                  child: Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      Icon(
                                        Icons.access_time,
                                        size: 16,
                                        color: isDark ? Colors.white70 : Colors.grey.shade600,
                                      ),
                                      const SizedBox(width: 6),
                                      Text(
                                        item.timestamp!,
                                        style: theme.textTheme.bodySmall?.copyWith(
                                          color: isDark ? Colors.white70 : Colors.grey.shade600,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                            ],
                          ),
                      ],
                    ),
                  ),
                  // Apply Button (for lecturers only)
                  if (item.id != null) ...[
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 20.0, vertical: 16.0),
                      child: Consumer<AuthProvider>(
                        builder: (context, authProvider, _) {
                          final isLecturer = authProvider.instituteData['userType'] == 'lecturer';
                          final isVerified = authProvider.isVerified;
                          
                          if (!isLecturer || !isVerified) {
                            return const SizedBox.shrink();
                          }
                          
                          return SizedBox(
                            width: double.infinity,
                            child: ElevatedButton.icon(
                              onPressed: () => _showApplyJobModal(context, item.id!),
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
                                padding: const EdgeInsets.symmetric(vertical: 14),
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                elevation: 4,
                              ),
                            ),
                          );
                        },
                      ),
                    ),
                  ],
                ],
              ),
              // Type Label
              Positioned(
                top: 16,
                right: 16,
                child: Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 10,
                    vertical: 5,
                  ),
                  decoration: BoxDecoration(
                    color: AppTheme.primary600,
                    borderRadius: BorderRadius.circular(12),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.3),
                        blurRadius: 8,
                        offset: const Offset(0, 2),
                      ),
                    ],
                  ),
                  child: const Text(
                    'JOB',
                    style: TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                      letterSpacing: 0.5,
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
                                      color: isDark ? Colors.white70 : Colors.grey.shade600,
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
                          color: isDark ? Colors.white70 : Colors.grey.shade600,
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
                    ? const SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                        ),
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
                          style: theme.textTheme.bodySmall?.copyWith(color: isDark ? Colors.white70 : Colors.grey.shade600),
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
        child: GestureDetector(
          onTap: () => _showFullScreenImage(context, imageUrl),
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
          
          return GestureDetector(
            onTap: () => _showFullScreenImage(context, imageUrl),
            child: ClipRRect(
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
            ),
          );
        },
      ),
    );
  }

  void _showFullScreenImage(BuildContext context, String imageUrl) {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (context) => FullScreenImageViewer(imageUrl: imageUrl),
        fullscreenDialog: true,
      ),
    );
  }

}
