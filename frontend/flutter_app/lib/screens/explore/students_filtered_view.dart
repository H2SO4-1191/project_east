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
import '../explore_screen.dart'; // For StudentCard

class StudentsFilteredView extends StatefulWidget {
  const StudentsFilteredView({super.key});

  @override
  State<StudentsFilteredView> createState() => _StudentsFilteredViewState();
}

class _StudentsFilteredViewState extends State<StudentsFilteredView> {
  final TextEditingController _searchController = TextEditingController();
  final FocusNode _searchFocusNode = FocusNode();
  Timer? _debounceTimer;
  
  bool _isLoading = false;
  String? _error;
  List<dynamic> _students = [];
  String? _selectedCity;
  
  bool _isLoadingProfile = false;
  bool _isDescriptionExpanded = false;

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
        filter: 'students',
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
          final list = results['students'] is List ? List.from(results['students']) : [];
          _students = list.where((s) => _matchesCity(s['city'])).toList();
        });
      } else {
        setState(() {
          _students = [];
        });
      }
    } catch (e) {
      setState(() {
        _error = e is ApiException ? e.message : 'Failed to search. Please try again.';
        _students = [];
      });
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
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
    });

    try {
      final response = await ProfileService.getStudentPublicProfile(username);

      final profileData = (response['data'] ?? response) as Map<String, dynamic>;

      setState(() {
        _isLoadingProfile = false;
        _isDescriptionExpanded = false; // Reset expansion state
      });

      showModalBottomSheet(
        context: context,
        isScrollControlled: true,
        backgroundColor: Colors.transparent,
        builder: (context) => _buildProfileSheet(profileData),
      ).then((_) {
        setState(() {
          _isLoadingProfile = false;
          _isDescriptionExpanded = false;
        });
      });
    } catch (e) {
      setState(() {
        _isLoadingProfile = false;
      });
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Failed to load student profile')),
      );
    }
  }

  Widget _buildProfileSheet(Map<String, dynamic> profile) {
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
          ? const Center(child: EnhancedLoadingIndicator())
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
                          if (profile['studying_level'] != null)
                            Text(
                              profile['studying_level'],
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
                  _buildExpandableDescription(profile['about'], isDark),
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
                // Social Media Links
                if (_hasSocialMediaLinks(profile)) ...[
                  const SizedBox(height: 16),
                  Text('Social Media', style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold)),
                  const SizedBox(height: 8),
                  _buildSocialMediaLinks(profile, isDark),
                ],
                const SizedBox(height: 24),
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
            hintText: 'Search students...',
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
                    : _students.isEmpty
                        ? Center(
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(Icons.search_off, size: 64, color: Colors.grey.shade400),
                                const SizedBox(height: 16),
                                Text(
                                  'No students found',
                                  style: TextStyle(color: Colors.grey.shade600),
                                ),
                              ],
                            ),
                          )
                        : RefreshIndicator(
                            onRefresh: _performSearch,
                            child: ListView.builder(
                              padding: const EdgeInsets.all(16),
                              itemCount: _students.length,
                              itemBuilder: (context, index) {
                                return Padding(
                                  padding: const EdgeInsets.only(bottom: 12),
                                  child: _buildAnimatedCard(
                                    delay: index * 100,
                                    child: StudentCard(
                                      student: _students[index],
                                      onTap: () => _handleProfileTap(_students[index]),
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

  Widget _buildExpandableDescription(String description, bool isDark) {
    const maxLength = 150;
    final shouldShowExpand = description.length > maxLength;
    final isExpanded = _isDescriptionExpanded;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          isExpanded ? description : (shouldShowExpand ? '${description.substring(0, maxLength)}...' : description),
          style: TextStyle(
            fontSize: 14,
            color: isDark ? Colors.white70 : Colors.grey.shade700,
            height: 1.5,
          ),
        ),
        if (shouldShowExpand) ...[
          const SizedBox(height: 8),
          Align(
            alignment: Alignment.centerLeft,
            child: TextButton(
              style: TextButton.styleFrom(
                padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 4),
                minimumSize: const Size(0, 32),
                tapTargetSize: MaterialTapTargetSize.shrinkWrap,
              ),
              onPressed: () {
                setState(() {
                  _isDescriptionExpanded = !_isDescriptionExpanded;
                });
              },
              child: Text(
                isExpanded ? 'Read less' : 'Read more',
                style: TextStyle(
                  color: AppTheme.primary600,
                  fontWeight: FontWeight.w600,
                  fontSize: 14,
                ),
              ),
            ),
          ),
        ],
      ],
    );
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

