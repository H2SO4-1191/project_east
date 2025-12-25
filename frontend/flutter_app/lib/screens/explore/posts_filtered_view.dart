import 'dart:async';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../config/theme.dart';
import '../../providers/auth_provider.dart';
import '../../services/explore_service.dart';
import '../../services/api_service.dart';
import '../../widgets/post_card.dart';
import '../../widgets/enhanced_loading_indicator.dart';

class PostsFilteredView extends StatefulWidget {
  const PostsFilteredView({super.key});

  @override
  State<PostsFilteredView> createState() => _PostsFilteredViewState();
}

class _PostsFilteredViewState extends State<PostsFilteredView> {
  final TextEditingController _searchController = TextEditingController();
  final FocusNode _searchFocusNode = FocusNode();
  Timer? _debounceTimer;
  
  bool _isLoading = false;
  String? _error;
  List<dynamic> _posts = [];

  @override
  void initState() {
    super.initState();
    _searchController.addListener(_onSearchChanged);
    _performSearch();
  }

  @override
  void dispose() {
    _debounceTimer?.cancel();
    _searchController.dispose();
    _searchFocusNode.dispose();
    super.dispose();
  }

  void _onSearchChanged() {
    _debounceTimer?.cancel();
    _debounceTimer = Timer(const Duration(milliseconds: 500), () {
      _performSearch();
    });
  }

  Future<void> _performSearch() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      final accessToken = authProvider.accessToken;
      final refreshToken = authProvider.refreshToken;
      
      final query = _searchController.text.trim();
      
      final data = await ExploreService.exploreSearch(
        query: query,
        filter: 'posts', // Note: API might use 'jobs' or another filter
        accessToken: accessToken,
        refreshToken: refreshToken,
        onTokenRefreshed: (tokens) {
          authProvider.onTokenRefreshed(tokens);
        },
        onSessionExpired: () {
          authProvider.onSessionExpired();
        },
      );

      final results = data['success'] == true && data['results'] != null
          ? data['results']
          : (data['results'] ?? data);

      if (data['success'] == true || (results is Map)) {
        setState(() {
          // Try different possible keys for posts
          _posts = results['posts'] is List 
              ? List.from(results['posts'])
              : (results['jobs'] is List 
                  ? List.from(results['jobs'])
                  : []);
        });
      } else {
        setState(() {
          _posts = [];
        });
      }
    } catch (e) {
      setState(() {
        _error = e is ApiException ? e.message : 'Failed to search. Please try again.';
        _posts = [];
      });
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  void _showPostSheet(Map<String, dynamic> post) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final imageUrl = _getImageUrl(post['image'] ?? post['post_image']);

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => Container(
        decoration: BoxDecoration(
          color: isDark ? AppTheme.navy800 : Colors.white,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
        ),
        padding: const EdgeInsets.all(24),
        child: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              if (post['publisher_username'] != null || post['publisher_name'] != null) ...[
                Row(
                  children: [
                    CircleAvatar(
                      radius: 20,
                      backgroundColor: AppTheme.primary600,
                      backgroundImage: _getImageUrl(post['publisher_profile_image']) != null
                          ? NetworkImage(_getImageUrl(post['publisher_profile_image'])!)
                          : null,
                      child: _getImageUrl(post['publisher_profile_image']) == null
                          ? Text(
                              (post['publisher_name'] ?? post['publisher_username'] ?? 'U')[0].toString().toUpperCase(),
                              style: const TextStyle(color: Colors.white, fontSize: 16),
                            )
                          : null,
                    ),
                    const SizedBox(width: 12),
                    Text(
                      post['publisher_name'] ?? '@${post['publisher_username']}',
                      style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
              ],
              if (post['title'] != null) ...[
                Text(
                  post['title'],
                  style: theme.textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 16),
              ],
              if (imageUrl != null) ...[
                ClipRRect(
                  borderRadius: BorderRadius.circular(12),
                  child: Image.network(
                    imageUrl,
                    width: double.infinity,
                    fit: BoxFit.cover,
                    errorBuilder: (context, error, stackTrace) => const SizedBox.shrink(),
                  ),
                ),
                const SizedBox(height: 16),
              ],
              if (post['description'] != null || post['content'] != null) ...[
                Text(
                  post['description'] ?? post['content'] ?? '',
                  style: theme.textTheme.bodyMedium,
                ),
              ],
              if (post['created_at'] != null) ...[
                const SizedBox(height: 16),
                Text(
                  _formatDate(post['created_at']),
                  style: theme.textTheme.bodySmall?.copyWith(color: Colors.grey.shade600),
                ),
              ],
              const SizedBox(height: 24),
            ],
          ),
        ),
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

  String _formatDate(dynamic date) {
    if (date == null) return '';
    try {
      final dateTime = date is DateTime ? date : DateTime.parse(date.toString());
      final now = DateTime.now();
      final difference = now.difference(dateTime);
      
      if (difference.inDays == 0) {
        if (difference.inHours == 0) {
          return '${difference.inMinutes} minutes ago';
        }
        return '${difference.inHours} hours ago';
      } else if (difference.inDays < 7) {
        return '${difference.inDays} days ago';
      } else {
        return '${dateTime.day}/${dateTime.month}/${dateTime.year}';
      }
    } catch (e) {
      return date.toString();
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return GestureDetector(
      onTap: () {
        // Unfocus search field when tapping outside
        _searchFocusNode.unfocus();
      },
      child: Scaffold(
        backgroundColor: isDark ? AppTheme.navy900 : const Color(0xFFF9FAFB),
        appBar: AppBar(
          elevation: 0,
          backgroundColor: isDark ? AppTheme.navy800 : Colors.white,
          leading: IconButton(
            icon: const Icon(Icons.arrow_back),
            onPressed: () => Navigator.pop(context),
          ),
          title: TextField(
            controller: _searchController,
            focusNode: _searchFocusNode,
            decoration: InputDecoration(
            hintText: 'Search posts...',
            prefixIcon: const Icon(Icons.search),
            suffixIcon: _searchController.text.isNotEmpty
                ? IconButton(
                    icon: const Icon(Icons.clear),
                    onPressed: () {
                      _searchController.clear();
                    },
                  )
                : null,
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide(color: Colors.grey.shade300),
            ),
            filled: true,
            fillColor: isDark ? AppTheme.navy700 : Colors.grey.shade100,
          ),
        ),
      ),
      body: _isLoading
          ? const Center(child: EnhancedLoadingIndicator())
          : _error != null
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.error_outline, size: 64, color: Colors.red.shade400),
                      const SizedBox(height: 16),
                      Text(_error!),
                      const SizedBox(height: 24),
                      ElevatedButton(
                        onPressed: _performSearch,
                        child: const Text('Retry'),
                      ),
                    ],
                  ),
                )
              : _posts.isEmpty
                  ? Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.search_off, size: 64, color: Colors.grey.shade400),
                          const SizedBox(height: 16),
                          Text(
                            'No posts found',
                            style: TextStyle(color: Colors.grey.shade600),
                          ),
                        ],
                      ),
                    )
                  : RefreshIndicator(
                      onRefresh: _performSearch,
                      child: ListView.builder(
                        padding: const EdgeInsets.all(16),
                        itemCount: _posts.length,
                        itemBuilder: (context, index) {
                          return Padding(
                            padding: const EdgeInsets.only(bottom: 12),
                            child: PostCard(
                              post: _posts[index],
                              onTap: () => _showPostSheet(_posts[index]),
                            )
                                .animate()
                                .fadeIn(
                                  duration: 300.ms,
                                  delay: (index * 50).ms,
                                )
                                .slideX(
                                  begin: 0.2,
                                  end: 0,
                                  duration: 300.ms,
                                  delay: (index * 50).ms,
                                ),
                          );
                        },
                      ),
                    ),
      ),
    );
  }
}

