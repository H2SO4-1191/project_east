import 'dart:async';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../config/theme.dart';
import '../../providers/auth_provider.dart';
import '../../services/explore_service.dart';
import '../../services/api_service.dart';
import '../../services/profile_service.dart';
import '../../widgets/enhanced_loading_indicator.dart';
import '../explore_screen.dart'; // For LecturerCard

class LecturersFilteredView extends StatefulWidget {
  const LecturersFilteredView({super.key});

  @override
  State<LecturersFilteredView> createState() => _LecturersFilteredViewState();
}

class _LecturersFilteredViewState extends State<LecturersFilteredView> {
  final TextEditingController _searchController = TextEditingController();
  final FocusNode _searchFocusNode = FocusNode();
  Timer? _debounceTimer;
  
  bool _isLoading = false;
  String? _error;
  List<dynamic> _lecturers = [];
  String? _selectedCity;
  
  Map<String, dynamic>? _selectedProfile;
  bool _isLoadingProfile = false;
  Set<int> _markedLecturers = {};
  int? _markingLecturerId;

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
        filter: 'lecturers',
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
          final list = results['lecturers'] is List ? List.from(results['lecturers']) : [];
          _lecturers = list.where((l) => _matchesCity(l['city'])).toList();
        });
        
        // Check marked lecturers if institution
        if (authProvider.instituteData['userType'] == 'institution' && 
            authProvider.isAuthenticated && 
            authProvider.isVerified) {
          _checkMarkedLecturers();
        }
      } else {
        setState(() {
          _lecturers = [];
        });
      }
    } catch (e) {
      setState(() {
        _error = e is ApiException ? e.message : 'Failed to search. Please try again.';
        _lecturers = [];
      });
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  Future<void> _checkMarkedLecturers() async {
    final lecturerIds = <int>[];
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

  Future<void> _handleProfileTap(Map<String, dynamic> profile) async {
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
    });

    try {
      final response = await ProfileService.getLecturerPublicProfile(username);

      final profileData = response['data'] is Map<String, dynamic>
          ? response['data']
          : response;

      setState(() {
        _selectedProfile = profileData;
        _isLoadingProfile = false;
      });

      showModalBottomSheet(
        context: context,
        isScrollControlled: true,
        backgroundColor: Colors.transparent,
        builder: (context) => _buildProfileSheet(profileData),
      ).then((_) {
        setState(() {
          _selectedProfile = null;
          _isLoadingProfile = false;
        });
      });
    } catch (e) {
      setState(() {
        _isLoadingProfile = false;
      });
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Failed to load lecturer profile')),
      );
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

  Widget _buildProfileSheet(Map<String, dynamic> profile) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final imageUrl = _getImageUrl(profile['profile_image']);
    final firstName = profile['first_name'] ?? '';
    final lastName = profile['last_name'] ?? '';
    final fullName = '$firstName $lastName'.trim();
    final displayName = fullName.isEmpty ? (profile['username'] ?? 'User') : fullName;

    return Container(
      constraints: BoxConstraints(
        maxHeight: MediaQuery.of(context).size.height * 0.9,
      ),
      decoration: BoxDecoration(
        color: isDark ? AppTheme.navy800 : Colors.white,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: _isLoadingProfile
          ? const Padding(
              padding: EdgeInsets.all(48.0),
              child: const Center(child: EnhancedLoadingIndicator()),
            )
          : Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Header with close button
                Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Lecturer Profile',
                        style: theme.textTheme.titleLarge?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      IconButton(
                        icon: const Icon(Icons.close),
                        onPressed: () => Navigator.pop(context),
                      ),
                    ],
                  ),
                ),
                // Profile Header
                Container(
                  padding: const EdgeInsets.all(24),
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      colors: [AppTheme.primary600, AppTheme.teal500],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                  ),
                  child: Row(
                    children: [
                      CircleAvatar(
                        radius: 50,
                        backgroundColor: Colors.white.withOpacity(0.2),
                        backgroundImage: imageUrl != null ? NetworkImage(imageUrl) : null,
                        child: imageUrl == null
                            ? Text(
                                displayName.isNotEmpty ? displayName[0].toUpperCase() : 'U',
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 32,
                                  fontWeight: FontWeight.bold,
                                ),
                              )
                            : null,
                      ),
                      const SizedBox(width: 20),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              displayName,
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 24,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            if (profile['specialty'] != null) ...[
                              const SizedBox(height: 8),
                              Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 12,
                                  vertical: 6,
                                ),
                                decoration: BoxDecoration(
                                  color: Colors.white.withOpacity(0.2),
                                  borderRadius: BorderRadius.circular(20),
                                ),
                                child: Text(
                                  profile['specialty'],
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontSize: 14,
                                    fontWeight: FontWeight.w500,
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
                // Content
                Flexible(
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.all(24),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Academic Achievement
                        if (profile['academic_achievement'] != null) ...[
                          _buildInfoRow(
                            Icons.school,
                            'Academic Achievement',
                            profile['academic_achievement'],
                            isDark,
                            theme,
                          ),
                          const SizedBox(height: 16),
                        ],
                        // Experience
                        if (profile['experience'] != null) ...[
                          _buildInfoRow(
                            Icons.work_history,
                            'Experience',
                            '${profile['experience']} ${profile['experience'] == 1 ? 'year' : 'years'}',
                            isDark,
                            theme,
                          ),
                          const SizedBox(height: 16),
                        ],
                        // Free Time
                        if (profile['free_time'] != null) ...[
                          _buildInfoRow(
                            Icons.access_time,
                            'Available Time',
                            profile['free_time'],
                            isDark,
                            theme,
                          ),
                          const SizedBox(height: 16),
                        ],
                        // City
                        if (profile['city'] != null) ...[
                          _buildInfoRow(
                            Icons.location_on,
                            'City',
                            profile['city'],
                            isDark,
                            theme,
                          ),
                          const SizedBox(height: 16),
                        ],
                        // Institutions
                        if (profile['institutions'] != null && 
                            profile['institutions'] is List &&
                            (profile['institutions'] as List).isNotEmpty) ...[
                          Text(
                            'Institutions',
                            style: theme.textTheme.titleMedium?.copyWith(
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(height: 12),
                          Wrap(
                            spacing: 8,
                            runSpacing: 8,
                            children: (profile['institutions'] as List).map<Widget>((institution) {
                              return Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 12,
                                  vertical: 8,
                                ),
                                decoration: BoxDecoration(
                                  color: isDark
                                      ? AppTheme.navy700
                                      : AppTheme.primary50,
                                  borderRadius: BorderRadius.circular(20),
                                ),
                                child: Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Icon(
                                      Icons.business,
                                      size: 16,
                                      color: AppTheme.primary600,
                                    ),
                                    const SizedBox(width: 6),
                                    Text(
                                      institution.toString(),
                                      style: theme.textTheme.bodySmall?.copyWith(
                                        fontWeight: FontWeight.w500,
                                        color: AppTheme.primary700,
                                      ),
                                    ),
                                  ],
                                ),
                              );
                            }).toList(),
                          ),
                          const SizedBox(height: 24),
                        ],
                        // Social Media Links
                        if (_hasSocialMediaLinks(profile)) ...[
                          const SizedBox(height: 24),
                          Text(
                            'Social Media',
                            style: theme.textTheme.titleMedium?.copyWith(
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(height: 12),
                          _buildSocialMediaLinks(profile, isDark),
                        ],
                      ],
                    ),
                  ),
                ),
              ],
            ),
    );
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

  Widget _buildInfoRow(
    IconData icon,
    String label,
    String value,
    bool isDark,
    ThemeData theme,
  ) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isDark ? AppTheme.navy700 : Colors.grey.shade100,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: AppTheme.primary600.withOpacity(0.1),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(
              icon,
              color: AppTheme.primary600,
              size: 24,
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: Colors.grey.shade600,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  value,
                  style: theme.textTheme.bodyMedium?.copyWith(
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
            hintText: 'Search lecturers...',
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
                    : _lecturers.isEmpty
                        ? Center(
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(Icons.search_off, size: 64, color: Colors.grey.shade400),
                                const SizedBox(height: 16),
                                Text(
                                  'No lecturers found',
                                  style: TextStyle(color: Colors.grey.shade600),
                                ),
                              ],
                            ),
                          )
                        : RefreshIndicator(
                            onRefresh: _performSearch,
                            child: ListView.builder(
                              padding: const EdgeInsets.all(16),
                              itemCount: _lecturers.length,
                              itemBuilder: (context, index) {
                                final authProvider = Provider.of<AuthProvider>(context, listen: false);
                                final userType = authProvider.instituteData['userType'];
                                return Padding(
                                  padding: const EdgeInsets.only(bottom: 12),
                                  child: _buildAnimatedCard(
                                    delay: index * 100,
                                    child: LecturerCard(
                                      lecturer: _lecturers[index],
                                      isMarked: _markedLecturers.contains(_lecturers[index]['id']),
                                      onTap: () => _handleProfileTap(_lecturers[index]),
                                      onMark: () => _handleMarkLecturer(_lecturers[index]),
                                      showMarkButton: userType == 'institution',
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

