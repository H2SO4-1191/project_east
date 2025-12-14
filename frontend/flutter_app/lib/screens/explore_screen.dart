import 'dart:async';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../config/theme.dart';
import '../providers/auth_provider.dart';
import '../providers/theme_provider.dart';
import '../services/explore_service.dart';
import '../services/api_service.dart';
import '../services/profile_service.dart';
import '../widgets/language_switcher.dart';

class ExploreScreen extends StatefulWidget {
  const ExploreScreen({super.key});

  @override
  State<ExploreScreen> createState() => _ExploreScreenState();
}

class _ExploreScreenState extends State<ExploreScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final TextEditingController _searchController = TextEditingController();
  Timer? _debounceTimer;
  final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey<ScaffoldState>();
  
  bool _isLoading = false;
  String? _error;
  
  // Data lists
  List<dynamic> _allResults = [];
  List<dynamic> _students = [];
  List<dynamic> _lecturers = [];
  List<dynamic> _jobs = [];
  List<dynamic> _courses = [];
  
  // Selected items for modals
  Map<String, dynamic>? _selectedProfile;
  String? _profileType;
  Map<String, dynamic>? _selectedJob;
  Map<String, dynamic>? _selectedCourse;
  
  // Loading states
  bool _isLoadingProfile = false;
  bool _isLoadingJob = false;
  bool _isLoadingCourse = false;
  bool _isEnrolling = false;
  bool _isApplying = false;
  int? _enrollingCourseId;
  int? _applyingJobId;
  
  // Marked lecturers (for institutions)
  Set<int> _markedLecturers = {};
  int? _markingLecturerId;
  
  // Apply job message
  final TextEditingController _applyMessageController = TextEditingController();
  
  // Enrollment conflict
  Map<String, dynamic>? _enrollmentConflict;
  bool _showEnrollmentConflict = false;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 5, vsync: this);
    _tabController.addListener(_onTabChanged);
    _searchController.addListener(_onSearchChanged);
    _performSearch(); // Initial search
  }

  @override
  void dispose() {
    _debounceTimer?.cancel();
    _tabController.dispose();
    _searchController.dispose();
    _applyMessageController.dispose();
    super.dispose();
  }

  void _onTabChanged() {
    if (_tabController.indexIsChanging) return;
    _performSearch();
  }

  void _onSearchChanged() {
    _debounceTimer?.cancel();
    _debounceTimer = Timer(const Duration(milliseconds: 500), () {
      _performSearch();
    });
  }

  String? _getCurrentFilter() {
    switch (_tabController.index) {
      case 1: return 'students';
      case 2: return 'lecturers';
      case 3: return 'jobs';
      case 4: return 'courses';
      default: return null; // 'all'
    }
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
      final filter = _getCurrentFilter();
      
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
        if (_tabController.index == 0) {
          // All tab - mixed results
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
          setState(() {
            _allResults = mixed;
            _students = [];
            _lecturers = [];
            _jobs = [];
            _courses = [];
          });
        } else {
          // Filtered results
          setState(() {
            _allResults = [];
            _students = results['students'] is List ? List.from(results['students']) : [];
            _lecturers = results['lecturers'] is List ? List.from(results['lecturers']) : [];
            _jobs = results['jobs'] is List ? List.from(results['jobs']) : [];
            _courses = results['courses'] is List ? List.from(results['courses']) : [];
          });
        }
        
        // Check marked lecturers if institution
        final authProvider = Provider.of<AuthProvider>(context, listen: false);
        if (authProvider.instituteData['userType'] == 'institution' && 
            authProvider.isAuthenticated && 
            authProvider.isVerified) {
          _checkMarkedLecturers();
        }
      } else {
        setState(() {
          _allResults = [];
          _students = [];
          _lecturers = [];
          _jobs = [];
          _courses = [];
        });
      }
    } catch (e) {
      setState(() {
        _error = e is ApiException ? e.message : 'Failed to search. Please try again.';
        _allResults = [];
        _students = [];
        _lecturers = [];
        _jobs = [];
        _courses = [];
      });
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  Future<void> _checkMarkedLecturers() async {
    final lecturerIds = <int>[];
    for (var item in _allResults) {
      if (item['itemType'] == 'lecturer' && item['id'] != null) {
        lecturerIds.add(item['id'] as int);
      }
    }
    for (var lecturer in _lecturers) {
      if (lecturer['id'] != null) {
        lecturerIds.add(lecturer['id'] as int);
      }
    }

    if (lecturerIds.isEmpty) return;

    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final marked = <int>{};

    for (var id in lecturerIds) {
      try {
        final isMarked = await ExploreService.isLecturerMarked(
          lecturerId: id,
          accessToken: authProvider.accessToken!,
          refreshToken: authProvider.refreshToken,
          onTokenRefreshed: (tokens) {
            authProvider.onTokenRefreshed(tokens);
          },
          onSessionExpired: () {
            authProvider.onSessionExpired();
          },
        );
        if (isMarked) marked.add(id);
      } catch (e) {
        // Silently fail
      }
    }

    setState(() {
      _markedLecturers = marked;
    });
  }

  List<dynamic> _getCurrentList() {
    switch (_tabController.index) {
      case 0: return _allResults;
      case 1: return _students;
      case 2: return _lecturers;
      case 3: return _jobs;
      case 4: return _courses;
      default: return [];
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final authProvider = Provider.of<AuthProvider>(context);
    final isAuthenticated = authProvider.isAuthenticated;
    final isInstitution = authProvider.instituteData['userType'] == 'institution';

    return DefaultTabController(
      length: 5,
      child: Scaffold(
        key: _scaffoldKey,
        backgroundColor: isDark ? AppTheme.navy900 : const Color(0xFFF9FAFB),
        drawer: _buildDrawer(context, isDark, isAuthenticated, authProvider.instituteData),
        appBar: AppBar(
          elevation: 0,
          backgroundColor: isDark ? AppTheme.navy800 : Colors.white,
          automaticallyImplyLeading: false, // Remove default back button
          title: TextField(
            controller: _searchController,
            decoration: InputDecoration(
              hintText: 'Search...',
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
          bottom: TabBar(
            controller: _tabController,
            isScrollable: true,
            tabs: const [
              Tab(text: 'All'),
              Tab(text: 'Students'),
              Tab(text: 'Lecturers'),
              Tab(text: 'Jobs'),
              Tab(text: 'Courses'),
            ],
          ),
        ),
        floatingActionButton: _buildFloatingMenuButton(context, isDark, isAuthenticated, authProvider.instituteData),
        floatingActionButtonLocation: FloatingActionButtonLocation.startFloat,
        body: _isLoading
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
                : TabBarView(
                    controller: _tabController,
                    children: [
                      _buildList(_allResults),
                      _buildList(_students),
                      _buildList(_lecturers),
                      _buildList(_jobs),
                      _buildList(_courses),
                    ],
                  ),
      ),
    );
  }

  Widget _buildList(List<dynamic> items) {
    if (items.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.search_off, size: 64, color: Colors.grey.shade400),
            const SizedBox(height: 16),
            Text(
              'No results found',
              style: TextStyle(color: Colors.grey.shade600),
            ),
          ],
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: items.length,
      itemBuilder: (context, index) {
        final item = items[index];
        final itemType = item['itemType'] ?? _inferItemType(item);
        
        switch (itemType) {
          case 'student':
            return Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: StudentCard(
                student: item,
                onTap: () => _handleProfileTap(item, 'student'),
              ),
            );
          case 'lecturer':
            return Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: LecturerCard(
                lecturer: item,
                isMarked: _markedLecturers.contains(item['id']),
                onTap: () => _handleProfileTap(item, 'lecturer'),
                onMark: () => _handleMarkLecturer(item),
              ),
            );
          case 'job':
            return Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: JobCard(
                job: item,
                onTap: () => _showJobSheet(item),
              ),
            );
          case 'course':
            return Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: CourseCard(
                course: item,
                onTap: () => _showCourseSheet(item),
              ),
            );
          default:
            return const SizedBox.shrink();
        }
      },
    );
  }

  String _inferItemType(Map<String, dynamic> item) {
    if (item.containsKey('studying_level')) return 'student';
    if (item.containsKey('specialty')) return 'lecturer';
    if (item.containsKey('title') && item.containsKey('salary_offer')) return 'job';
    if (item.containsKey('about') && item.containsKey('starting_date')) return 'course';
    return 'unknown';
  }

  Future<void> _handleProfileTap(Map<String, dynamic> profile, String type) async {
    final username = profile['username'] ?? profile['publisher_username'];
    if (username == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Username not available for this profile')),
      );
      return;
    }

    setState(() {
      _isLoadingProfile = true;
      _selectedProfile = null;
      _profileType = type;
    });

    try {
      Map<String, dynamic> response;
      if (type == 'student') {
        response = await ProfileService.getStudentPublicProfile(username);
      } else if (type == 'lecturer') {
        response = await ProfileService.getLecturerPublicProfile(username);
      } else {
        response = await ProfileService.getInstitutionPublicProfile(username);
      }

      final profileData = response['data'] is Map<String, dynamic>
          ? response['data'] as Map<String, dynamic>
          : (response as Map<String, dynamic>);

      setState(() {
        _selectedProfile = profileData;
        _profileType = type;
        _isLoadingProfile = false;
      });

      showModalBottomSheet(
        context: context,
        isScrollControlled: true,
        backgroundColor: Colors.transparent,
        builder: (context) => _buildProfileSheet(profileData, type),
      ).then((_) {
        setState(() {
          _selectedProfile = null;
          _profileType = null;
          _isLoadingProfile = false;
        });
      });
    } catch (e) {
      setState(() {
        _isLoadingProfile = false;
      });
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to load $type profile')),
      );
    }
  }

  Widget _buildProfileSheet(Map<String, dynamic> profile, String type) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final imageUrl = _getImageUrl(profile['profile_image']);

    return Container(
      decoration: BoxDecoration(
        color: isDark ? AppTheme.navy800 : Colors.white,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
      ),
      padding: const EdgeInsets.all(24),
      child: _isLoadingProfile
          ? const Center(child: CircularProgressIndicator())
          : Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    CircleAvatar(
                      radius: 40,
                      backgroundColor: AppTheme.primary600,
                      backgroundImage: imageUrl != null ? NetworkImage(imageUrl) : null,
                      child: imageUrl == null
                          ? Text(
                              (profile['first_name'] ?? profile['username'] ?? 'U')[0].toString().toUpperCase(),
                              style: const TextStyle(color: Colors.white, fontSize: 24),
                            )
                          : null,
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            '${profile['first_name'] ?? ''} ${profile['last_name'] ?? ''}'.trim().isEmpty
                                ? profile['username'] ?? 'User'
                                : '${profile['first_name'] ?? ''} ${profile['last_name'] ?? ''}'.trim(),
                            style: theme.textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold),
                          ),
                          if (type == 'student' && profile['studying_level'] != null)
                            Text(
                              profile['studying_level'],
                              style: theme.textTheme.bodyMedium?.copyWith(color: AppTheme.primary600),
                            ),
                          if (type == 'lecturer' && profile['specialty'] != null)
                            Text(
                              profile['specialty'],
                              style: theme.textTheme.bodyMedium?.copyWith(color: AppTheme.primary600),
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
                if (type == 'lecturer' && profile['skills'] != null) ...[
                  const SizedBox(height: 16),
                  Text('Skills', style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold)),
                  const SizedBox(height: 8),
                  Text(profile['skills'], style: theme.textTheme.bodyMedium),
                ],
                if (profile['city'] != null) ...[
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      Icon(Icons.location_on, size: 16, color: AppTheme.primary500),
                      const SizedBox(width: 4),
                      Text(profile['city'], style: theme.textTheme.bodyMedium),
                    ],
                  ),
                ],
                const SizedBox(height: 24),
              ],
            ),
    );
  }

  void _showJobSheet(Map<String, dynamic> job) {
    setState(() {
      _isLoadingJob = true;
      _selectedJob = job;
    });

    // Fetch full job details
    if (job['id'] != null) {
      ExploreService.getJobDetails(job['id'] as int).then((data) {
        if (mounted) {
          setState(() {
            _selectedJob = data['success'] == true && data['data'] != null ? data['data'] : job;
            _isLoadingJob = false;
          });
        }
      }).catchError((e) {
        if (mounted) {
          setState(() {
            _isLoadingJob = false;
          });
        }
      });
    } else {
      setState(() {
        _isLoadingJob = false;
      });
    }

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => _buildJobSheet(),
    ).then((_) {
      setState(() {
        _selectedJob = null;
        _applyMessageController.clear();
      });
    });
  }

  Widget _buildJobSheet() {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final authProvider = Provider.of<AuthProvider>(context);
    final isLecturer = authProvider.instituteData['userType'] == 'lecturer';
    final job = _selectedJob ?? {};

    return Container(
      decoration: BoxDecoration(
        color: isDark ? AppTheme.navy800 : Colors.white,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
      ),
      padding: const EdgeInsets.all(24),
      child: _isLoadingJob
          ? const Center(child: CircularProgressIndicator())
          : Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  job['title'] ?? 'Job',
                  style: theme.textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold),
                ),
                if (job['institution_username'] != null) ...[
                  const SizedBox(height: 8),
                  Text(
                    '@${job['institution_username']}',
                    style: theme.textTheme.bodyMedium?.copyWith(color: Colors.grey.shade600),
                  ),
                ],
                if (job['description'] != null) ...[
                  const SizedBox(height: 16),
                  Text('Description', style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold)),
                  const SizedBox(height: 8),
                  Text(job['description'], style: theme.textTheme.bodyMedium),
                ],
                if (job['salary_offer'] != null) ...[
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      Icon(Icons.attach_money, size: 20, color: AppTheme.primary600),
                      const SizedBox(width: 4),
                      Text(
                        '${job['salary_offer']}',
                        style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
                      ),
                    ],
                  ),
                ],
                if (isLecturer && job['id'] != null) ...[
                  const SizedBox(height: 24),
                  TextField(
                    controller: _applyMessageController,
                    decoration: const InputDecoration(
                      labelText: 'Application Message (Optional)',
                      border: OutlineInputBorder(),
                    ),
                    maxLines: 3,
                  ),
                  const SizedBox(height: 16),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: _isApplying
                          ? null
                          : () => _handleApplyJob(job),
                      child: _isApplying
                          ? const SizedBox(
                              height: 20,
                              width: 20,
                              child: CircularProgressIndicator(strokeWidth: 2),
                            )
                          : const Text('Apply'),
                    ),
                  ),
                ],
                const SizedBox(height: 24),
              ],
            ),
    );
  }

  void _showCourseSheet(Map<String, dynamic> course) {
    setState(() {
      _isLoadingCourse = true;
      _selectedCourse = course;
    });

    // Fetch full course details
    if (course['id'] != null) {
      ExploreService.getCourseDetails(course['id'] as int).then((data) {
        if (mounted) {
          setState(() {
            _selectedCourse = data['success'] == true && data['data'] != null ? data['data'] : course;
            _isLoadingCourse = false;
          });
        }
      }).catchError((e) {
        if (mounted) {
          setState(() {
            _isLoadingCourse = false;
          });
        }
      });
    } else {
      setState(() {
        _isLoadingCourse = false;
      });
    }

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => _buildCourseSheet(),
    ).then((_) {
      setState(() {
        _selectedCourse = null;
      });
    });
  }

  Widget _buildCourseSheet() {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final authProvider = Provider.of<AuthProvider>(context);
    final isStudent = authProvider.instituteData['userType'] == 'student';
    final course = _selectedCourse ?? {};
    final courseImageUrl = _getImageUrl(course['course_image']);

    return Container(
      decoration: BoxDecoration(
        color: isDark ? AppTheme.navy800 : Colors.white,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
      ),
      padding: const EdgeInsets.all(24),
      child: _isLoadingCourse
          ? const Center(child: CircularProgressIndicator())
          : Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (courseImageUrl != null)
                  ClipRRect(
                    borderRadius: BorderRadius.circular(12),
                    child: Image.network(
                      courseImageUrl,
                      width: double.infinity,
                      height: 200,
                      fit: BoxFit.cover,
                      errorBuilder: (context, error, stackTrace) => const SizedBox.shrink(),
                    ),
                  ),
                const SizedBox(height: 16),
                Text(
                  course['title'] ?? 'Course',
                  style: theme.textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold),
                ),
                if (course['about'] != null) ...[
                  const SizedBox(height: 16),
                  Text('About', style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold)),
                  const SizedBox(height: 8),
                  Text(course['about'], style: theme.textTheme.bodyMedium),
                ],
                if (course['starting_date'] != null || course['ending_date'] != null) ...[
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      Icon(Icons.calendar_today, size: 16, color: AppTheme.primary500),
                      const SizedBox(width: 4),
                      Text(
                        '${course['starting_date'] ?? ''} - ${course['ending_date'] ?? ''}',
                        style: theme.textTheme.bodyMedium,
                      ),
                    ],
                  ),
                ],
                if (course['price'] != null) ...[
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      Icon(Icons.attach_money, size: 20, color: AppTheme.primary600),
                      const SizedBox(width: 4),
                      Text(
                        '${course['price']}',
                        style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
                      ),
                    ],
                  ),
                ],
                if (isStudent && course['id'] != null) ...[
                  const SizedBox(height: 24),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: _isEnrolling || _enrollingCourseId == course['id']
                          ? null
                          : () => _handleEnrollCourse(course),
                      child: _isEnrolling && _enrollingCourseId == course['id']
                          ? const SizedBox(
                              height: 20,
                              width: 20,
                              child: CircularProgressIndicator(strokeWidth: 2),
                            )
                          : const Text('Enroll'),
                    ),
                  ),
                ],
                const SizedBox(height: 24),
              ],
            ),
    );
  }

  Future<void> _handleEnrollCourse(Map<String, dynamic> course) async {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    
    if (!authProvider.isAuthenticated) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please log in to enroll')),
      );
      return;
    }

    if (authProvider.instituteData['userType'] != 'student') {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Only students can enroll in courses')),
      );
      return;
    }

    if (!authProvider.isVerified) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please verify your account to enroll')),
      );
      return;
    }

    if (course['id'] == null) return;

    setState(() {
      _isEnrolling = true;
      _enrollingCourseId = course['id'] as int;
    });

    try {
      // Check for schedule conflicts
      final checkResponse = await ExploreService.checkStudentFree(
        courseId: course['id'] as int,
        accessToken: authProvider.accessToken!,
        refreshToken: authProvider.refreshToken,
        onTokenRefreshed: (tokens) {
          authProvider.onTokenRefreshed(tokens);
        },
        onSessionExpired: () {
          authProvider.onSessionExpired();
        },
      );

      if (checkResponse['success'] == false && checkResponse['contradiction'] != null) {
        setState(() {
          _enrollmentConflict = checkResponse['contradiction'];
          _showEnrollmentConflict = true;
          _isEnrolling = false;
          _enrollingCourseId = null;
        });
        _showEnrollmentConflictDialog();
        return;
      }

      // Enroll
      final enrollResponse = await ExploreService.enrollInCourse(
        courseId: course['id'] as int,
        accessToken: authProvider.accessToken!,
        refreshToken: authProvider.refreshToken,
        onTokenRefreshed: (tokens) {
          authProvider.onTokenRefreshed(tokens);
        },
        onSessionExpired: () {
          authProvider.onSessionExpired();
        },
      );

      if (mounted) {
        if (enrollResponse['success'] == true) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(enrollResponse['message'] ?? 'Enrolled successfully!')),
          );
          Navigator.pop(context); // Close course sheet
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(enrollResponse['message'] ?? 'Failed to enroll')),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e is ApiException ? e.message : 'Failed to enroll')),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isEnrolling = false;
          _enrollingCourseId = null;
        });
      }
    }
  }

  void _showEnrollmentConflictDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Schedule Conflict'),
        content: Text(
          _enrollmentConflict?['message'] ?? 
          'This course conflicts with your existing schedule. Please choose a different course.',
        ),
        actions: [
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              setState(() {
                _showEnrollmentConflict = false;
                _enrollmentConflict = null;
              });
            },
            child: const Text('OK'),
          ),
        ],
      ),
    );
  }

  Future<void> _handleApplyJob(Map<String, dynamic> job) async {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    
    if (!authProvider.isAuthenticated) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please log in to apply')),
      );
      return;
    }

    if (authProvider.instituteData['userType'] != 'lecturer') {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Only lecturers can apply to jobs')),
      );
      return;
    }

    if (job['id'] == null) return;

    setState(() {
      _isApplying = true;
      _applyingJobId = job['id'] as int;
    });

    try {
      final response = await ExploreService.applyToJob(
        jobId: job['id'] as int,
        accessToken: authProvider.accessToken!,
        message: _applyMessageController.text.trim(),
        refreshToken: authProvider.refreshToken,
        onTokenRefreshed: (tokens) {
          authProvider.onTokenRefreshed(tokens);
        },
        onSessionExpired: () {
          authProvider.onSessionExpired();
        },
      );

      if (mounted) {
        if (response['success'] == true) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(response['message'] ?? 'Application submitted successfully!')),
          );
          Navigator.pop(context); // Close job sheet
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(response['message'] ?? 'Failed to apply')),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e is ApiException ? e.message : 'Failed to apply')),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isApplying = false;
          _applyingJobId = null;
        });
      }
    }
  }

  Future<void> _handleMarkLecturer(Map<String, dynamic> lecturer) async {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    
    if (!authProvider.isAuthenticated || 
        authProvider.instituteData['userType'] != 'institution' ||
        !authProvider.isVerified) {
      return;
    }

    if (lecturer['id'] == null) return;

    final lecturerId = lecturer['id'] as int;
    final isMarked = _markedLecturers.contains(lecturerId);

    setState(() {
      _markingLecturerId = lecturerId;
    });

    try {
      if (isMarked) {
        await ExploreService.removeMarkedLecturer(
          lecturerId: lecturerId,
          accessToken: authProvider.accessToken!,
          refreshToken: authProvider.refreshToken,
          onTokenRefreshed: (tokens) {
            authProvider.onTokenRefreshed(tokens);
          },
          onSessionExpired: () {
            authProvider.onSessionExpired();
          },
        );
        setState(() {
          _markedLecturers.remove(lecturerId);
        });
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Lecturer unmarked')),
          );
        }
      } else {
        await ExploreService.markLecturer(
          lecturerId: lecturerId,
          accessToken: authProvider.accessToken!,
          refreshToken: authProvider.refreshToken,
          onTokenRefreshed: (tokens) {
            authProvider.onTokenRefreshed(tokens);
          },
          onSessionExpired: () {
            authProvider.onSessionExpired();
          },
        );
        setState(() {
          _markedLecturers.add(lecturerId);
        });
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Lecturer marked')),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e is ApiException ? e.message : 'Failed to update mark')),
        );
      }
    } finally {
      setState(() {
        _markingLecturerId = null;
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
    final cleanPath = path.startsWith('/') ? path : '/$path';
    return '$baseUrl$cleanPath';
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
        // Feed button - Public (visible to everyone)
        ListTile(
          leading: const Icon(Icons.home),
          title: const Text('Feed'),
          onTap: () {
            Navigator.pop(context);
            Navigator.pushNamed(context, '/');
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
          title: const Text('Account'),
          onTap: () {
            Navigator.pop(context);
            _showAccountOptions(context, isDark, isAuthenticated, instituteData);
          },
        ),
      ],
    );
  }

  void _handleLogout(BuildContext context) async {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    await authProvider.logout();
    if (context.mounted) {
      Navigator.pushNamedAndRemoveUntil(context, '/', (route) => false);
    }
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

// Card Widgets

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


