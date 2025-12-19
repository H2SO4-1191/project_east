import 'dart:async';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:animations/animations.dart';
import '../config/theme.dart';
import '../providers/auth_provider.dart';
import '../widgets/profile_button.dart';
import '../widgets/category_card.dart';
import '../widgets/full_screen_image_viewer.dart';
import '../services/explore_service.dart';
import '../services/api_service.dart';
import '../services/profile_service.dart';
import '../utils/page_animations.dart';
import 'explore/courses_filtered_view.dart';
import 'explore/students_filtered_view.dart';
import 'explore/lecturers_filtered_view.dart';
import 'explore/jobs_filtered_view.dart';
import 'explore/institutions_filtered_view.dart';
import 'institution_profile_screen.dart';

class ExploreScreen extends StatefulWidget {
  const ExploreScreen({super.key});

  @override
  State<ExploreScreen> createState() => _ExploreScreenState();
}

class _ExploreScreenState extends State<ExploreScreen> with AutomaticKeepAliveClientMixin {
  final TextEditingController _searchController = TextEditingController();
  final FocusNode _searchFocusNode = FocusNode();
  Timer? _debounceTimer;
  
  bool _isLoading = false;
  String? _error;
  String? _selectedFilter; // null = 'all', or 'courses', 'students', etc.
  bool _isFilterExpanded = false; // For collapsible filter panel
  List<Map<String, dynamic>> _searchResults = []; // Store search results

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
    _searchFocusNode.dispose();
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

      if (data['success'] == true) {
        final mixed = <Map<String, dynamic>>[];
        
        // Helper to add itemType to each result
        void addResults(List? items, String itemType) {
          if (items == null) return;
          for (final item in items) {
            if (item is Map) {
              final map = Map<String, dynamic>.from(item);
              map['itemType'] = itemType;
              mixed.add(map);
            }
          }
        }
        
        // When no filter: results are in data['results']
        // When filter applied: results are directly in data (e.g., data['courses'])
        if (filter == null) {
          // No filter - get from results object
          final results = data['results'];
          if (results is Map) {
            addResults(results['students'] as List?, 'student');
            addResults(results['lecturers'] as List?, 'lecturer');
            addResults(results['jobs'] as List?, 'job');
            addResults(results['courses'] as List?, 'course');
            addResults(results['institutions'] as List?, 'institution');
          }
        } else {
          // Filter applied - results are directly in data[filter]
          String itemType;
          switch (filter) {
            case 'students':
              itemType = 'student';
              break;
            case 'lecturers':
              itemType = 'lecturer';
              break;
            case 'courses':
              itemType = 'course';
              break;
            case 'jobs':
              itemType = 'job';
              break;
            case 'institutions':
              itemType = 'institution';
              break;
            default:
              itemType = 'unknown';
          }
          addResults(data[filter] as List?, itemType);
        }
        
        setState(() {
          _searchResults = mixed;
        });
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

    return PopScope(
      canPop: _searchController.text.isEmpty && !_searchFocusNode.hasFocus,
      onPopInvokedWithResult: (didPop, result) {
        if (!didPop) {
          // Clear search and unfocus instead of popping
          if (_searchController.text.isNotEmpty) {
            _searchController.clear();
            _selectedFilter = null;
            _performSearch();
          }
          _searchFocusNode.unfocus();
        }
      },
      child: GestureDetector(
        onTap: () {
          // Unfocus search field when tapping outside
          _searchFocusNode.unfocus();
        },
        child: Scaffold(
        backgroundColor: isDark ? AppTheme.navy900 : const Color(0xFFF9FAFB),
        appBar: AppBar(
        elevation: 0,
        backgroundColor: isDark ? AppTheme.navy800 : Colors.white,
        automaticallyImplyLeading: false,
        leading: Padding(
          padding: const EdgeInsets.only(left: 8.0),
          child: ProfileButton(),
        ),
        title: TextField(
          controller: _searchController,
          focusNode: _searchFocusNode,
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
          // Collapsible Filter Tab - only show when search has text
          if (_searchController.text.isNotEmpty)
            _buildFilterTab(isDark),
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
                    // When searching, show search results
                    : _searchController.text.isNotEmpty
                        ? _buildSearchResults(isDark)
                        // When not searching, show category grid
                        : _buildCategoryGrid(),
          ),
        ],
      ),
      ),
      ),
    );
  }

  Widget _buildFilterTab(bool isDark) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      decoration: BoxDecoration(
        color: isDark ? AppTheme.navy800 : Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        children: [
          // Filter header (tap to expand/collapse)
          InkWell(
            onTap: () {
              setState(() {
                _isFilterExpanded = !_isFilterExpanded;
              });
            },
            borderRadius: BorderRadius.circular(16),
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              child: Row(
                children: [
                  Icon(
                    Icons.filter_list,
                    color: AppTheme.primary600,
                    size: 20,
                  ),
                  const SizedBox(width: 8),
                  Text(
                    'Filters',
                    style: TextStyle(
                      fontWeight: FontWeight.w600,
                      color: isDark ? Colors.white : Colors.black87,
                    ),
                  ),
                  if (_selectedFilter != null) ...[
                    const SizedBox(width: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                      decoration: BoxDecoration(
                        color: AppTheme.primary600,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Text(
                        _getFilterLabel(_selectedFilter),
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 12,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ),
                  ],
                  const Spacer(),
                  AnimatedRotation(
                    turns: _isFilterExpanded ? 0.5 : 0,
                    duration: const Duration(milliseconds: 200),
                    child: Icon(
                      Icons.keyboard_arrow_down,
                      color: isDark ? Colors.grey.shade400 : Colors.grey.shade600,
                    ),
                  ),
                ],
              ),
            ),
          ),
          // Expanded filter options
          AnimatedCrossFade(
            firstChild: const SizedBox.shrink(),
            secondChild: Padding(
              padding: const EdgeInsets.fromLTRB(12, 0, 12, 12),
              child: Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  _buildFilterChip('All', null, isDark),
                  _buildFilterChip('Courses', 'courses', isDark),
                  _buildFilterChip('Students', 'students', isDark),
                  _buildFilterChip('Lecturers', 'lecturers', isDark),
                  _buildFilterChip('Jobs', 'jobs', isDark),
                  _buildFilterChip('Institutions', 'institutions', isDark),
                ],
              ),
            ),
            crossFadeState: _isFilterExpanded
                ? CrossFadeState.showSecond
                : CrossFadeState.showFirst,
            duration: const Duration(milliseconds: 200),
          ),
        ],
      ),
    );
  }

  String _getFilterLabel(String? filter) {
    switch (filter) {
      case 'courses':
        return 'Courses';
      case 'students':
        return 'Students';
      case 'lecturers':
        return 'Lecturers';
      case 'jobs':
        return 'Jobs';
      case 'institutions':
        return 'Institutions';
      default:
        return 'All';
    }
  }

  Widget _buildFilterChip(String label, String? filter, bool isDark) {
    final isSelected = _selectedFilter == filter;

    return FilterChip(
      label: Text(label),
      selected: isSelected,
      onSelected: (selected) {
        _onFilterChanged(selected ? filter : null);
        // Collapse filter panel after selection
        setState(() {
          _isFilterExpanded = false;
        });
      },
      backgroundColor: isDark ? AppTheme.navy700 : Colors.grey.shade200,
      selectedColor: AppTheme.primary600,
      checkmarkColor: Colors.white,
      labelStyle: TextStyle(
        color: isSelected ? Colors.white : (isDark ? Colors.white : Colors.black87),
        fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
      ),
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
    );
  }

  Widget _buildSearchResults(bool isDark) {
    if (_searchResults.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.search_off, size: 64, color: isDark ? Colors.white54 : Colors.grey.shade400),
            const SizedBox(height: 16),
            Text(
              'No results found',
              style: TextStyle(
                color: isDark ? Colors.white70 : Colors.grey.shade600,
                fontSize: 16,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Try a different search term or filter',
              style: TextStyle(
                color: isDark ? Colors.white54 : Colors.grey.shade500,
                fontSize: 14,
              ),
            ),
          ],
        ),
      );
    }

    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final userType = authProvider.instituteData['userType'];

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: _searchResults.length,
      itemBuilder: (context, index) {
        final item = _searchResults[index];
        final itemType = item['itemType'] as String?;

        // Use existing card widgets based on item type
        switch (itemType) {
          case 'student':
            return StudentCard(
              student: item,
              onTap: () => _handleResultTap(item, itemType),
            );
          case 'lecturer':
            return LecturerCard(
              lecturer: item,
              isMarked: false,
              onTap: () => _handleResultTap(item, itemType),
              onMark: () {}, // Not used in search results
              showMarkButton: userType == 'institution',
            );
          case 'course':
            return CourseCard(
              course: item,
              onTap: () {
                final courseId = item['id'];
                if (courseId != null) {
                  if (userType == 'student') {
                    Navigator.pushNamed(context, '/student/enroll', arguments: courseId);
                  } else {
                    Navigator.pushNamed(context, '/course', arguments: courseId);
                  }
                }
              },
            );
          case 'job':
            return JobCard(
              job: item,
              onTap: () => _handleResultTap(item, itemType),
            );
          case 'institution':
            return _buildInstitutionCard(item, isDark);
          default:
            return const SizedBox.shrink();
        }
      },
    );
  }

  Widget _buildInstitutionCard(Map<String, dynamic> institution, bool isDark) {
    String? imageUrl;
    final img = institution['profile_image'];
    if (img != null && img.toString().isNotEmpty) {
      final path = img.toString();
      if (path.startsWith('http')) {
        imageUrl = path;
      } else {
        imageUrl = '${ApiService.baseUrl}${path.startsWith('/') ? '' : '/'}$path';
      }
    }

    return Card(
      elevation: 2,
      margin: const EdgeInsets.only(bottom: 12),
      color: isDark ? AppTheme.navy800 : Colors.white,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: InkWell(
        onTap: () {
          final username = institution['username'];
          if (username != null) {
            Navigator.push(
              context,
              MaterialPageRoute(
                builder: (context) => InstitutionProfileScreen(username: username),
              ),
            );
          }
        },
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              CircleAvatar(
                radius: 28,
                backgroundColor: AppTheme.primary600.withOpacity(0.1),
                backgroundImage: imageUrl != null ? NetworkImage(imageUrl) : null,
                child: imageUrl == null
                    ? Icon(Icons.business, color: AppTheme.primary600)
                    : null,
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      institution['name'] ?? institution['username'] ?? 'Institution',
                      style: TextStyle(
                        fontWeight: FontWeight.w600,
                        fontSize: 16,
                        color: isDark ? Colors.white : Colors.black87,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    if (institution['city'] != null) ...[
                      const SizedBox(height: 4),
                      Row(
                        children: [
                          Icon(Icons.location_on, size: 14, color: Colors.grey.shade500),
                          const SizedBox(width: 4),
                          Text(
                            institution['city'].toString(),
                            style: TextStyle(
                              color: isDark ? Colors.white70 : Colors.grey.shade600,
                              fontSize: 14,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: AppTheme.primary600.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  'Institution',
                  style: TextStyle(
                    color: AppTheme.primary600,
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _handleResultTap(Map<String, dynamic> item, String? itemType) {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final userType = authProvider.instituteData['userType'];

    switch (itemType) {
      case 'course':
        final courseId = item['id'];
        if (courseId != null) {
          if (userType == 'student') {
            Navigator.pushNamed(context, '/student/enroll', arguments: courseId);
          } else {
            Navigator.pushNamed(context, '/course', arguments: courseId);
          }
        }
        break;
      case 'institution':
        final username = item['username'];
        if (username != null) {
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (context) => InstitutionProfileScreen(username: username),
            ),
          );
        }
        break;
      case 'student':
        _showStudentModal(item);
        break;
      case 'lecturer':
        _showLecturerModal(item);
        break;
      case 'job':
        _showJobModal(item);
        break;
      default:
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Viewing ${_getFilterLabel(itemType)} details'),
            duration: const Duration(seconds: 1),
          ),
        );
    }
  }

  void _showStudentModal(Map<String, dynamic> student) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final imageUrl = _getImageUrl(student['profile_image']);
    final firstName = student['first_name'] ?? '';
    final lastName = student['last_name'] ?? '';
    final fullName = '$firstName $lastName'.trim();
    final displayName = fullName.isEmpty ? (student['username'] ?? 'Student') : fullName;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => Container(
        constraints: BoxConstraints(
          maxHeight: MediaQuery.of(context).size.height * 0.7,
        ),
        decoration: BoxDecoration(
          color: isDark ? AppTheme.navy800 : Colors.white,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Handle bar
            Container(
              margin: const EdgeInsets.only(top: 12),
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: isDark ? Colors.white24 : Colors.grey.shade300,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(24),
              child: Column(
                children: [
                  GestureDetector(
                    onTap: imageUrl != null
                        ? () {
                            Navigator.of(context).push(
                              MaterialPageRoute(
                                builder: (context) => FullScreenImageViewer(imageUrl: imageUrl),
                                fullscreenDialog: true,
                              ),
                            );
                          }
                        : null,
                    child: CircleAvatar(
                      radius: 50,
                      backgroundColor: Colors.blue.withOpacity(0.1),
                      backgroundImage: imageUrl != null ? NetworkImage(imageUrl) : null,
                      child: imageUrl == null
                          ? Text(
                              displayName[0].toUpperCase(),
                              style: const TextStyle(fontSize: 36, color: Colors.blue),
                            )
                          : null,
                    ),
                  ),
                  const SizedBox(height: 16),
                  Text(
                    displayName,
                    style: theme.textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold),
                  ),
                  if (student['email'] != null) ...[
                    const SizedBox(height: 8),
                    Text(
                      student['email'],
                      style: TextStyle(color: isDark ? Colors.white70 : Colors.grey.shade600),
                    ),
                  ],
                  const SizedBox(height: 24),
                  if (student['studying_level'] != null)
                    _buildInfoTile(Icons.school, 'Level', student['studying_level'], isDark),
                  if (student['city'] != null)
                    _buildInfoTile(Icons.location_on, 'City', student['city'], isDark),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showLecturerModal(Map<String, dynamic> lecturer) async {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    
    // Try to get more details from API
    final username = lecturer['username'];
    Map<String, dynamic> profileData = lecturer;
    
    if (username != null) {
      try {
        final response = await ProfileService.getLecturerPublicProfile(username);
        if (response['data'] != null) {
          profileData = Map<String, dynamic>.from(response['data']);
        }
      } catch (e) {
        // Use existing data
      }
    }

    final imageUrl = _getImageUrl(profileData['profile_image']);
    final firstName = profileData['first_name'] ?? '';
    final lastName = profileData['last_name'] ?? '';
    final fullName = '$firstName $lastName'.trim();
    final displayName = fullName.isEmpty ? (profileData['username'] ?? 'Lecturer') : fullName;

    if (!mounted) return;
    
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => Container(
        constraints: BoxConstraints(
          maxHeight: MediaQuery.of(context).size.height * 0.8,
        ),
        decoration: BoxDecoration(
          color: isDark ? AppTheme.navy800 : Colors.white,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
        ),
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Handle bar
              Container(
                margin: const EdgeInsets.only(top: 12),
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: isDark ? Colors.white24 : Colors.grey.shade300,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              Padding(
                padding: const EdgeInsets.all(24),
                child: Column(
                  children: [
                    GestureDetector(
                      onTap: imageUrl != null
                          ? () {
                              Navigator.of(context).push(
                                MaterialPageRoute(
                                  builder: (context) => FullScreenImageViewer(imageUrl: imageUrl),
                                  fullscreenDialog: true,
                                ),
                              );
                            }
                          : null,
                      child: CircleAvatar(
                        radius: 50,
                        backgroundColor: Colors.purple.withOpacity(0.1),
                        backgroundImage: imageUrl != null ? NetworkImage(imageUrl) : null,
                        child: imageUrl == null
                            ? Text(
                                displayName[0].toUpperCase(),
                                style: const TextStyle(fontSize: 36, color: Colors.purple),
                              )
                            : null,
                      ),
                    ),
                    const SizedBox(height: 16),
                    Text(
                      displayName,
                      style: theme.textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold),
                    ),
                    if (profileData['academic_achievement'] != null) ...[
                      const SizedBox(height: 4),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                        decoration: BoxDecoration(
                          color: Colors.purple.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Text(
                          profileData['academic_achievement'],
                          style: const TextStyle(color: Colors.purple, fontWeight: FontWeight.w500),
                        ),
                      ),
                    ],
                    const SizedBox(height: 24),
                    if (profileData['specialty'] != null)
                      _buildInfoTile(Icons.work, 'Specialty', profileData['specialty'], isDark),
                    if (profileData['experience'] != null)
                      _buildInfoTile(Icons.timeline, 'Experience', '${profileData['experience']} years', isDark),
                    if (profileData['city'] != null)
                      _buildInfoTile(Icons.location_on, 'City', profileData['city'], isDark),
                    if (profileData['free_time'] != null)
                      _buildInfoTile(Icons.access_time, 'Available', profileData['free_time'], isDark),
                    if (profileData['institutions'] != null && (profileData['institutions'] as List).isNotEmpty)
                      _buildInfoTile(Icons.business, 'Institutions', (profileData['institutions'] as List).join(', '), isDark),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _showJobModal(Map<String, dynamic> job) async {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    
    // Try to get more details from API
    final jobId = job['id'];
    Map<String, dynamic> jobData = job;
    
    if (jobId != null) {
      try {
        final response = await ExploreService.getJobDetails(jobId);
        if (response['data'] != null) {
          jobData = Map<String, dynamic>.from(response['data']);
        }
      } catch (e) {
        // Use existing data
      }
    }

    if (!mounted) return;
    
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => Container(
        constraints: BoxConstraints(
          maxHeight: MediaQuery.of(context).size.height * 0.85,
        ),
        decoration: BoxDecoration(
          color: isDark ? AppTheme.navy800 : Colors.white,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
        ),
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header with gradient
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [Colors.orange.shade600, Colors.orange.shade400],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                    Container(
                      margin: const EdgeInsets.only(bottom: 16),
                      width: 40,
                      height: 4,
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.5),
                        borderRadius: BorderRadius.circular(2),
                      ),
                    ),
                    const Icon(Icons.work, color: Colors.white, size: 48),
                    const SizedBox(height: 12),
                    Text(
                      jobData['title'] ?? 'Job',
                      style: theme.textTheme.headlineSmall?.copyWith(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                      ),
                      textAlign: TextAlign.center,
                    ),
                    if (jobData['institution'] != null || jobData['institution_username'] != null) ...[
                      const SizedBox(height: 8),
                      Text(
                        jobData['institution'] ?? '@${jobData['institution_username']}',
                        style: TextStyle(color: Colors.white.withOpacity(0.9)),
                      ),
                    ],
                  ],
                ),
              ),
              Padding(
                padding: const EdgeInsets.all(24),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    if (jobData['description'] != null) ...[
                      Text(
                        'Description',
                        style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        jobData['description'],
                        style: TextStyle(color: isDark ? Colors.white70 : Colors.grey.shade700),
                      ),
                      const SizedBox(height: 20),
                    ],
                    if (jobData['specialty'] != null)
                      _buildInfoTile(Icons.category, 'Specialty', jobData['specialty'], isDark),
                    if (jobData['experience_required'] != null)
                      _buildInfoTile(Icons.timeline, 'Experience Required', '${jobData['experience_required']} years', isDark),
                    if (jobData['skills_required'] != null)
                      _buildInfoTile(Icons.psychology, 'Skills', jobData['skills_required'], isDark),
                    if (jobData['salary_offer'] != null)
                      _buildInfoTile(Icons.attach_money, 'Salary', '${jobData['salary_offer']} IQD', isDark),
                    if (jobData['created_at'] != null)
                      _buildInfoTile(Icons.calendar_today, 'Posted', _formatDate(jobData['created_at']), isDark),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildInfoTile(IconData icon, String label, String value, bool isDark) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        children: [
          Icon(icon, size: 20, color: AppTheme.primary600),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: TextStyle(
                    fontSize: 12,
                    color: isDark ? Colors.white54 : Colors.grey.shade500,
                  ),
                ),
                Text(
                  value,
                  style: TextStyle(
                    fontWeight: FontWeight.w500,
                    color: isDark ? Colors.white : Colors.black87,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  String _formatDate(String? dateString) {
    if (dateString == null) return 'N/A';
    try {
      final date = DateTime.parse(dateString);
      return '${date.day}/${date.month}/${date.year}';
    } catch (e) {
      return dateString;
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
              GestureDetector(
                onTap: imageUrl != null
                    ? () {
                        Navigator.of(context).push(
                          MaterialPageRoute(
                            builder: (context) => FullScreenImageViewer(imageUrl: imageUrl),
                            fullscreenDialog: true,
                          ),
                        );
                      }
                    : null,
                child: CircleAvatar(
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
  final bool showMarkButton;

  const LecturerCard({
    super.key,
    required this.lecturer,
    required this.isMarked,
    required this.onTap,
    required this.onMark,
    this.showMarkButton = false,
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
              GestureDetector(
                onTap: imageUrl != null
                    ? () {
                        Navigator.of(context).push(
                          MaterialPageRoute(
                            builder: (context) => FullScreenImageViewer(imageUrl: imageUrl),
                            fullscreenDialog: true,
                          ),
                        );
                      }
                    : null,
                child: CircleAvatar(
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
              if (showMarkButton)
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
                  style: theme.textTheme.bodySmall?.copyWith(color: isDark ? Colors.white70 : Colors.grey.shade600),
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

class CourseCard extends StatefulWidget {
  final Map<String, dynamic> course;
  final VoidCallback onTap;

  const CourseCard({
    super.key,
    required this.course,
    required this.onTap,
  });

  @override
  State<CourseCard> createState() => _CourseCardState();
}

class _CourseCardState extends State<CourseCard> {
  String? _courseImageUrl;

  @override
  void initState() {
    super.initState();
    _fetchCourseImage();
  }

  Future<void> _fetchCourseImage() async {
    // If course already has image, use it
    if (widget.course['course_image'] != null) {
      setState(() {
        _courseImageUrl = _getImageUrl(widget.course['course_image']);
      });
      return;
    }

    // Fetch course image in background
    final courseId = widget.course['id'];
    if (courseId == null) return;

    try {
      final response = await ExploreService.getCourseDetails(courseId);
      final data = response['data'] is Map<String, dynamic> 
          ? response['data'] 
          : response;
      final courseImage = data['course_image'];
      
      if (mounted && courseImage != null) {
        setState(() {
          _courseImageUrl = _getImageUrl(courseImage);
        });
      }
    } catch (e) {
      // Silently fail, just show placeholder
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final courseImageUrl = _courseImageUrl;

    // Get level color
    MaterialColor levelColor = Colors.grey;
    switch (widget.course['level']?.toString().toLowerCase()) {
      case 'beginner':
        levelColor = Colors.green;
        break;
      case 'intermediate':
        levelColor = Colors.blue;
        break;
      case 'advanced':
        levelColor = Colors.purple;
        break;
    }

    return Card(
      elevation: 4,
      margin: const EdgeInsets.only(bottom: 12),
      color: isDark ? AppTheme.navy800 : Colors.white,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: InkWell(
        onTap: widget.onTap,
        borderRadius: BorderRadius.circular(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Course Image Header
            Stack(
              children: [
                Container(
                  height: 180,
                  width: double.infinity,
                  decoration: BoxDecoration(
                    borderRadius: const BorderRadius.vertical(top: Radius.circular(16)),
                    gradient: LinearGradient(
                      colors: [levelColor.shade600, levelColor.shade400],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                  ),
                  child: courseImageUrl != null
                      ? ClipRRect(
                          borderRadius: const BorderRadius.vertical(top: Radius.circular(16)),
                          child: Image.network(
                            courseImageUrl,
                            fit: BoxFit.cover,
                            loadingBuilder: (context, child, loadingProgress) {
                              if (loadingProgress == null) return child;
                              return Center(
                                child: CircularProgressIndicator(
                                  value: loadingProgress.expectedTotalBytes != null
                                      ? loadingProgress.cumulativeBytesLoaded /
                                          loadingProgress.expectedTotalBytes!
                                      : null,
                                  color: Colors.white,
                                ),
                              );
                            },
                            errorBuilder: (context, error, stackTrace) {
                              return Center(
                                child: Text(
                                  (widget.course['title'] ?? 'C')[0].toUpperCase(),
                                  style: const TextStyle(
                                    fontSize: 64,
                                    fontWeight: FontWeight.bold,
                                    color: Colors.white,
                                  ),
                                ),
                              );
                            },
                          ),
                        )
                      : Center(
                          child: Text(
                            (widget.course['title'] ?? 'C')[0].toUpperCase(),
                            style: const TextStyle(
                              fontSize: 64,
                              fontWeight: FontWeight.bold,
                              color: Colors.white,
                            ),
                          ),
                        ),
                ),
                // Level Badge
                if (widget.course['level'] != null)
                  Positioned(
                    top: 12,
                    left: 12,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.9),
                        borderRadius: BorderRadius.circular(20),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withOpacity(0.1),
                            blurRadius: 4,
                            offset: const Offset(0, 2),
                          ),
                        ],
                      ),
                      child: Text(
                        (widget.course['level'] as String).toUpperCase(),
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                          color: levelColor,
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
                  // Title
                  Text(
                    widget.course['title'] ?? 'Course',
                    style: theme.textTheme.titleLarge?.copyWith(
                      fontWeight: FontWeight.bold,
                      fontSize: 22,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 12),
                  // About/Description
                  if (widget.course['about'] != null)
                    Text(
                      widget.course['about'],
                      style: theme.textTheme.bodyMedium?.copyWith(
                        color: isDark ? Colors.white70 : Colors.grey.shade600,
                        height: 1.5,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                  const SizedBox(height: 16),
                  // Details Row
                  Row(
                    children: [
                      // Start Date
                      if (widget.course['starting_date'] != null)
                        Expanded(
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                            decoration: BoxDecoration(
                              color: isDark ? AppTheme.navy700 : Colors.blue.shade50,
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Row(
                              children: [
                                Icon(
                                  Icons.event,
                                  size: 16,
                                  color: Colors.blue.shade700,
                                ),
                                const SizedBox(width: 8),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        'Start',
                                        style: TextStyle(
                                          fontSize: 10,
                                          color: isDark ? Colors.white70 : Colors.grey.shade600,
                                        ),
                                      ),
                                      const SizedBox(height: 2),
                                      Text(
                                        _formatDate(widget.course['starting_date']),
                                        style: TextStyle(
                                          fontSize: 12,
                                          fontWeight: FontWeight.w600,
                                          color: Colors.blue.shade700,
                                        ),
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      if (widget.course['starting_date'] != null && widget.course['ending_date'] != null)
                        const SizedBox(width: 12),
                      // End Date
                      if (widget.course['ending_date'] != null)
                        Expanded(
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                            decoration: BoxDecoration(
                              color: isDark ? AppTheme.navy700 : Colors.red.shade50,
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Row(
                              children: [
                                Icon(
                                  Icons.event,
                                  size: 16,
                                  color: Colors.red.shade700,
                                ),
                                const SizedBox(width: 8),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        'End',
                                        style: TextStyle(
                                          fontSize: 10,
                                          color: isDark ? Colors.white70 : Colors.grey.shade600,
                                        ),
                                      ),
                                      const SizedBox(height: 2),
                                      Text(
                                        _formatDate(widget.course['ending_date']),
                                        style: TextStyle(
                                          fontSize: 12,
                                          fontWeight: FontWeight.w600,
                                          color: Colors.red.shade700,
                                        ),
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  // Price and Institution Row
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      // Institution
                      if (widget.course['institution_name'] != null || widget.course['institution_username'] != null || widget.course['institution'] != null)
                        Expanded(
                          child: Row(
                            children: [
                              Icon(
                                Icons.school,
                                size: 16,
                                color: isDark ? Colors.white70 : Colors.grey.shade600,
                              ),
                              const SizedBox(width: 6),
                              Expanded(
                                child: Text(
                                  widget.course['institution_name'] ?? widget.course['institution_username'] ?? widget.course['institution'] ?? '',
                                  style: theme.textTheme.bodySmall?.copyWith(
                                    color: isDark ? Colors.white70 : Colors.grey.shade600,
                                  ),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                            ],
                          ),
                        ),
                      // Price
                      if (widget.course['price'] != null)
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                          decoration: BoxDecoration(
                            gradient: const LinearGradient(
                              colors: [AppTheme.primary600, AppTheme.teal500],
                            ),
                            borderRadius: BorderRadius.circular(20),
                            boxShadow: [
                              BoxShadow(
                                color: AppTheme.primary600.withOpacity(0.3),
                                blurRadius: 8,
                                offset: const Offset(0, 4),
                              ),
                            ],
                          ),
                          child: Text(
                            '\$${(double.tryParse(widget.course['price']?.toString() ?? '0') ?? 0).toStringAsFixed(2)}',
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
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
