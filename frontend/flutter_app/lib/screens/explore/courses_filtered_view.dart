import 'dart:async';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../config/theme.dart';
import '../../providers/auth_provider.dart';
import '../../services/explore_service.dart';
import '../../services/api_service.dart';
import '../../widgets/enhanced_loading_indicator.dart';
import '../explore_screen.dart'; // For CourseCard

class CoursesFilteredView extends StatefulWidget {
  const CoursesFilteredView({super.key});

  @override
  State<CoursesFilteredView> createState() => _CoursesFilteredViewState();
}

class _CoursesFilteredViewState extends State<CoursesFilteredView> {
  final TextEditingController _searchController = TextEditingController();
  final FocusNode _searchFocusNode = FocusNode();
  Timer? _debounceTimer;
  
  bool _isLoading = false;
  String? _error;
  List<dynamic> _courses = [];
  String? _selectedCity;

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

  static const Map<String, String> _cities = {
    'baghdad': 'Baghdad',
    'basra': 'Basra',
    'maysan': 'Maysan',
    'dhi_qar': 'Dhi Qar',
    'muthanna': 'Muthanna',
    'qadisiyyah': 'Qadisiyyah',
    'najaf': 'Najaf',
    'karbala': 'Karbala',
    'babel': 'Babel',
    'wasit': 'Wasit',
    'anbar': 'Anbar',
    'salah_al_din': 'Salah Al-Din',
    'kirkuk': 'Kirkuk',
    'diyala': 'Diyala',
    'mosul': 'Mosul',
    'erbil': 'Erbil',
    'duhok': 'Duhok',
    'sulaymaniyah': 'Sulaymaniyah',
  };

  bool _matchesCity(dynamic cityValue) {
    if (_selectedCity == null || _selectedCity!.isEmpty) return true;
    if (cityValue == null) return false;
    final code = _selectedCity!;
    final targetRaw = cityValue.toString().trim().toLowerCase();
    final normalizedTarget = targetRaw.replaceAll(RegExp(r'[\s-]+'), '_');
    if (normalizedTarget == code) return true;
    final display = _cities[code]?.toLowerCase();
    if (display != null) {
      final normalizedDisplay = display.replaceAll(RegExp(r'[\s-]+'), '_');
      if (normalizedTarget == normalizedDisplay || targetRaw == display) return true;
    }
    return false;
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
      final combinedQuery = _selectedCity != null && _selectedCity!.isNotEmpty
          ? '${query.isNotEmpty ? '$query ' : ''}city:${_selectedCity!}'
          : query;
      
      final data = await ExploreService.exploreSearch(
        query: combinedQuery,
        filter: 'courses',
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
          final list = results['courses'] is List ? List.from(results['courses']) : [];
          _courses = list.where((c) => _matchesCity(c['city'])).toList();
        });
      } else {
        setState(() {
          _courses = [];
        });
      }
    } catch (e) {
      setState(() {
        _error = e is ApiException ? e.message : 'Failed to search. Please try again.';
        _courses = [];
      });
    } finally {
      setState(() {
        _isLoading = false;
      });
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
            hintText: 'Search courses...',
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
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
            child: Align(
              alignment: Alignment.centerLeft,
              child: DropdownButton<String>(
                value: _selectedCity,
                hint: const Text('Filter by city'),
                onChanged: (value) {
                  setState(() {
                    _selectedCity = value;
                  });
                  _performSearch();
                },
                items: [
                  const DropdownMenuItem<String>(
                    value: null,
                    child: Text('All cities'),
                  ),
                  ..._cities.entries.map((e) => DropdownMenuItem<String>(
                        value: e.key,
                        child: Text(e.value),
                      )),
                ],
              ),
            ),
          ),
          Expanded(
            child: _isLoading
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
                    : _courses.isEmpty
                        ? Center(
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(Icons.search_off, size: 64, color: Colors.grey.shade400),
                                const SizedBox(height: 16),
                                Text(
                                  'No courses found',
                                  style: TextStyle(color: Colors.grey.shade600),
                                ),
                              ],
                            ),
                          )
                        : RefreshIndicator(
                            onRefresh: _performSearch,
                            child: ListView.builder(
                              padding: const EdgeInsets.all(16),
                              itemCount: _courses.length,
                              itemBuilder: (context, index) {
                                return Padding(
                                  padding: const EdgeInsets.only(bottom: 12),
                                  child: _buildAnimatedCard(
                                    delay: index * 100,
                                    child: CourseCard(
                                      course: _courses[index],
                                      onTap: () {
                                        final authProvider = Provider.of<AuthProvider>(context, listen: false);
                                        final userType = authProvider.instituteData['userType'];
                                        final courseId = _courses[index]['id'];
                                        
                                        if (courseId == null) return;
                                        
                                        if (userType == 'student') {
                                          Navigator.pushNamed(
                                            context,
                                            '/student/enroll',
                                            arguments: courseId,
                                          );
                                        } else {
                                          Navigator.pushNamed(
                                            context,
                                            '/course',
                                            arguments: courseId,
                                          );
                                        }
                                      },
                                    ),
                                  ),
                                );
                              },
                            ),
                          ),
          ),
        ],
      ),
      ),
    );
  }

  Widget _buildAnimatedCard({required int delay, required Widget child}) {
    return _DelayedAnimatedCard(delay: delay, child: child);
  }
}

class _DelayedAnimatedCard extends StatefulWidget {
  final int delay;
  final Widget child;

  const _DelayedAnimatedCard({
    required this.delay,
    required this.child,
  });

  @override
  State<_DelayedAnimatedCard> createState() => _DelayedAnimatedCardState();
}

class _DelayedAnimatedCardState extends State<_DelayedAnimatedCard>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _animation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: const Duration(milliseconds: 800),
      vsync: this,
    );
    _animation = CurvedAnimation(
      parent: _controller,
      curve: Curves.easeOut,
    );
    
    // Start animation after delay
    Future.delayed(Duration(milliseconds: widget.delay), () {
      if (mounted) {
        _controller.forward();
      }
    });
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _animation,
      builder: (context, child) {
        return Opacity(
          opacity: _animation.value,
          child: Transform.translate(
            offset: Offset(0, 30 * (1 - _animation.value)),
            child: Transform.scale(
              scale: 0.9 + (0.1 * _animation.value),
              child: child,
            ),
          ),
        );
      },
      child: widget.child,
    );
  }
}

