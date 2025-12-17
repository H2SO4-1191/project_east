import 'dart:async';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:animations/animations.dart';
import '../config/theme.dart';
import '../providers/auth_provider.dart';
import '../widgets/profile_button.dart';
import '../widgets/category_card.dart';
import '../services/explore_service.dart';
import '../services/api_service.dart';
import '../utils/page_animations.dart';
import 'explore/courses_filtered_view.dart';
import 'explore/students_filtered_view.dart';
import 'explore/lecturers_filtered_view.dart';
import 'explore/jobs_filtered_view.dart';
import 'explore/institutions_filtered_view.dart';

class ExploreScreen extends StatefulWidget {
  const ExploreScreen({super.key});

  @override
  State<ExploreScreen> createState() => _ExploreScreenState();
}

class _ExploreScreenState extends State<ExploreScreen> with AutomaticKeepAliveClientMixin {
  final TextEditingController _searchController = TextEditingController();
  Timer? _debounceTimer;
  
  bool _isLoading = false;
  String? _error;
  String? _selectedFilter; // null = 'all', or 'courses', 'students', etc.

  @override
  bool get wantKeepAlive => true;

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
    super.dispose();
  }

  void _onSearchChanged() {
    _debounceTimer?.cancel();
    _debounceTimer = Timer(const Duration(milliseconds: 500), () {
      _performSearch();
    });
  }

  void _onFilterChanged(String? filter) {
    setState(() {
      _selectedFilter = filter;
    });
    _performSearch();
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
      final filter = _selectedFilter;
      
      final data = await ExploreService.exploreSearch(
        query: query,
        filter: filter,
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
        // For "All" view, combine all results
        if (filter == null) {
          final mixed = <dynamic>[];
          if (results['students'] is List) {
            mixed.addAll((results['students'] as List).map((s) => {...s, 'itemType': 'student'}));
          }
          if (results['lecturers'] is List) {
            mixed.addAll((results['lecturers'] as List).map((l) => {...l, 'itemType': 'lecturer'}));
          }
          if (results['jobs'] is List) {
            mixed.addAll((results['jobs'] as List).map((j) => {...j, 'itemType': 'job'}));
          }
          if (results['courses'] is List) {
            mixed.addAll((results['courses'] as List).map((c) => {...c, 'itemType': 'course'}));
          }
          // Results stored for "All" view if needed in future
        } else {
          // For filtered views, we navigate to dedicated screens
        }
      }
    } catch (e) {
      setState(() {
        _error = e is ApiException ? e.message : 'Failed to search. Please try again.';
      });
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  void _navigateToCategory(CategoryType category) {
    Widget screen;
    switch (category) {
      case CategoryType.courses:
        screen = const CoursesFilteredView();
        break;
      case CategoryType.students:
        screen = const StudentsFilteredView();
        break;
      case CategoryType.lecturers:
        screen = const LecturersFilteredView();
        break;
      case CategoryType.jobs:
        screen = const JobsFilteredView();
        break;
      case CategoryType.institutions:
        screen = const InstitutionsFilteredView();
        break;
    }

    Navigator.push(
      context,
      PageAnimations.sharedAxis(screen, SharedAxisTransitionType.horizontal),
    );
  }

  @override
  Widget build(BuildContext context) {
    super.build(context); // Required for AutomaticKeepAliveClientMixin
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: isDark ? AppTheme.navy900 : const Color(0xFFF9FAFB),
      appBar: AppBar(
        elevation: 0,
        backgroundColor: isDark ? AppTheme.navy800 : Colors.white,
        automaticallyImplyLeading: false,
        leading: const Padding(
          padding: EdgeInsets.only(left: 8.0),
          child: ProfileButton(),
        ),
        title: TextField(
          controller: _searchController,
          onChanged: (_) => setState(() {}), // Rebuild to show/hide filter chips
          decoration: InputDecoration(
            hintText: 'Search...',
            prefixIcon: const Icon(Icons.search),
            suffixIcon: _searchController.text.isNotEmpty
                ? IconButton(
                    icon: const Icon(Icons.clear),
                    onPressed: () {
                      _searchController.clear();
                      setState(() {}); // Rebuild to hide filter chips
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
      body: Column(
        children: [
          // Filter chips - only show when search has text
          if (_searchController.text.isNotEmpty)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              child: SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                child: Row(
                  children: [
                    _buildFilterChip('All', null),
                    const SizedBox(width: 8),
                    _buildFilterChip('Courses', 'courses'),
                    const SizedBox(width: 8),
                    _buildFilterChip('Students', 'students'),
                    const SizedBox(width: 8),
                    _buildFilterChip('Lecturers', 'lecturers'),
                    const SizedBox(width: 8),
                    _buildFilterChip('Jobs', 'jobs'),
                    const SizedBox(width: 8),
                    _buildFilterChip('Institutions', 'institutions'),
                  ],
                ),
              ),
            ),
          // Main content
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
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
                    : _selectedFilter != null
                        ? Center(
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(Icons.touch_app, size: 64, color: Colors.grey.shade400),
                                const SizedBox(height: 16),
                                Text(
                                  'Tap a category card to explore',
                                  style: TextStyle(color: Colors.grey.shade600),
                                ),
                              ],
                            ),
                          )
                        : _buildCategoryGrid(),
          ),
        ],
      ),
    );
  }

  Widget _buildFilterChip(String label, String? filter) {
    final isSelected = _selectedFilter == filter;
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return AnimatedContainer(
      duration: const Duration(milliseconds: 200),
      curve: Curves.easeOut,
      child: FilterChip(
        label: Text(label),
        selected: isSelected,
        onSelected: (selected) {
          _onFilterChanged(selected ? filter : null);
        },
        backgroundColor: isDark ? AppTheme.navy700 : Colors.grey.shade200,
        selectedColor: AppTheme.primary600,
        labelStyle: TextStyle(
          color: isSelected ? Colors.white : (isDark ? Colors.white : Colors.black87),
          fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
        ),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
      ),
    )
        .animate(target: isSelected ? 1 : 0)
        .scale(
          begin: const Offset(1.0, 1.0),
          end: const Offset(1.05, 1.05),
          duration: 200.ms,
        );
  }

  Widget _buildCategoryGrid() {
    return GridView.count(
      crossAxisCount: 2,
      padding: const EdgeInsets.all(16),
      crossAxisSpacing: 16,
      mainAxisSpacing: 16,
      childAspectRatio: 1.2,
      children: [
        CategoryCard(
          category: CategoryType.courses,
          index: 0,
          onTap: () => _navigateToCategory(CategoryType.courses),
        ),
        CategoryCard(
          category: CategoryType.students,
          index: 1,
          onTap: () => _navigateToCategory(CategoryType.students),
        ),
        CategoryCard(
          category: CategoryType.lecturers,
          index: 2,
          onTap: () => _navigateToCategory(CategoryType.lecturers),
        ),
        CategoryCard(
          category: CategoryType.jobs,
          index: 3,
          onTap: () => _navigateToCategory(CategoryType.jobs),
        ),
        CategoryCard(
          category: CategoryType.institutions,
          index: 4,
          onTap: () => _navigateToCategory(CategoryType.institutions),
        ),
      ],
    );
  }
}

// Card Widgets (kept for use in filtered views)
class StudentCard extends StatelessWidget {
  final Map<String, dynamic> student;
  final VoidCallback onTap;

  const StudentCard({
    super.key,
    required this.student,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final imageUrl = _getImageUrl(student['profile_image']);

    return Card(
      elevation: 2,
      color: isDark ? AppTheme.navy800 : Colors.white,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              CircleAvatar(
                radius: 30,
                backgroundColor: AppTheme.primary600,
                backgroundImage: imageUrl != null ? NetworkImage(imageUrl) : null,
                child: imageUrl == null
                    ? Text(
                        (student['first_name'] ?? student['username'] ?? 'S')[0].toString().toUpperCase(),
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
                      '${student['first_name'] ?? ''} ${student['last_name'] ?? ''}'.trim().isEmpty
                          ? student['username'] ?? 'Student'
                          : '${student['first_name'] ?? ''} ${student['last_name'] ?? ''}'.trim(),
                      style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
                    ),
                    if (student['studying_level'] != null) ...[
                      const SizedBox(height: 4),
                      Text(
                        student['studying_level'],
                        style: theme.textTheme.bodySmall?.copyWith(color: AppTheme.primary600),
                      ),
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
}

class LecturerCard extends StatelessWidget {
  final Map<String, dynamic> lecturer;
  final bool isMarked;
  final VoidCallback onTap;
  final VoidCallback onMark;

  const LecturerCard({
    super.key,
    required this.lecturer,
    required this.isMarked,
    required this.onTap,
    required this.onMark,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final imageUrl = _getImageUrl(lecturer['profile_image']);

    return Card(
      elevation: 2,
      color: isDark ? AppTheme.navy800 : Colors.white,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              CircleAvatar(
                radius: 30,
                backgroundColor: AppTheme.primary600,
                backgroundImage: imageUrl != null ? NetworkImage(imageUrl) : null,
                child: imageUrl == null
                    ? Text(
                        (lecturer['first_name'] ?? lecturer['username'] ?? 'L')[0].toString().toUpperCase(),
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
                      '${lecturer['first_name'] ?? ''} ${lecturer['last_name'] ?? ''}'.trim().isEmpty
                          ? lecturer['username'] ?? 'Lecturer'
                          : '${lecturer['first_name'] ?? ''} ${lecturer['last_name'] ?? ''}'.trim(),
                      style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
                    ),
                    if (lecturer['specialty'] != null) ...[
                      const SizedBox(height: 4),
                      Text(
                        lecturer['specialty'],
                        style: theme.textTheme.bodySmall?.copyWith(color: AppTheme.primary600),
                      ),
                    ],
                  ],
                ),
              ),
              IconButton(
                icon: Icon(
                  isMarked ? Icons.bookmark : Icons.bookmark_border,
                  color: isMarked ? AppTheme.gold500 : Colors.grey,
                ),
                onPressed: onMark,
              ),
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
}

class JobCard extends StatelessWidget {
  final Map<String, dynamic> job;
  final VoidCallback onTap;

  const JobCard({
    super.key,
    required this.job,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Card(
      elevation: 2,
      color: isDark ? AppTheme.navy800 : Colors.white,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                job['title'] ?? 'Job',
                style: theme.textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold),
              ),
              if (job['institution_username'] != null) ...[
                const SizedBox(height: 4),
                Text(
                  '@${job['institution_username']}',
                  style: theme.textTheme.bodySmall?.copyWith(color: Colors.grey.shade600),
                ),
              ],
              if (job['description'] != null) ...[
                const SizedBox(height: 8),
                Text(
                  job['description'],
                  style: theme.textTheme.bodyMedium,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
              if (job['salary_offer'] != null) ...[
                const SizedBox(height: 8),
                Row(
                  children: [
                    Icon(Icons.attach_money, size: 16, color: AppTheme.primary600),
                    const SizedBox(width: 4),
                    Text(
                      '${job['salary_offer']}',
                      style: theme.textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.bold),
                    ),
                  ],
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

class CourseCard extends StatelessWidget {
  final Map<String, dynamic> course;
  final VoidCallback onTap;

  const CourseCard({
    super.key,
    required this.course,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final courseImageUrl = _getImageUrl(course['course_image']);

    return Card(
      elevation: 2,
      color: isDark ? AppTheme.navy800 : Colors.white,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 100,
                height: 100,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(12),
                  color: AppTheme.primary100,
                ),
                child: courseImageUrl != null
                    ? ClipRRect(
                        borderRadius: BorderRadius.circular(12),
                        child: Image.network(
                          courseImageUrl,
                          fit: BoxFit.cover,
                          errorBuilder: (context, error, stackTrace) => Center(
                            child: Text(
                              (course['title'] ?? 'C')[0].toString().toUpperCase(),
                              style: TextStyle(
                                fontSize: 32,
                                fontWeight: FontWeight.bold,
                                color: AppTheme.primary600,
                              ),
                            ),
                          ),
                        ),
                      )
                    : Center(
                        child: Text(
                          (course['title'] ?? 'C')[0].toString().toUpperCase(),
                          style: TextStyle(
                            fontSize: 32,
                            fontWeight: FontWeight.bold,
                            color: AppTheme.primary600,
                          ),
                        ),
                      ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      course['title'] ?? 'Course',
                      style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
                    ),
                    if (course['level'] != null) ...[
                      const SizedBox(height: 4),
                      Text(
                        course['level'],
                        style: theme.textTheme.bodySmall?.copyWith(color: AppTheme.primary600),
                      ),
                    ],
                    if (course['price'] != null) ...[
                      const SizedBox(height: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                        decoration: BoxDecoration(
                          color: AppTheme.primary50,
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Text(
                          '${course['price']}',
                          style: theme.textTheme.bodySmall?.copyWith(
                            fontWeight: FontWeight.bold,
                            color: AppTheme.primary700,
                          ),
                        ),
                      ),
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
}
