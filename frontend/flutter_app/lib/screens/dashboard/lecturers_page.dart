import 'dart:async';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../config/theme.dart';
import '../../providers/auth_provider.dart';
import '../../services/api_service.dart';
import '../../widgets/verification_lock.dart';
import '../../widgets/modern_bottom_nav.dart';
import '../../utils/navigation_helper.dart';

class LecturersPage extends StatefulWidget {
  const LecturersPage({super.key});

  @override
  State<LecturersPage> createState() => _LecturersPageState();
}

class _LecturersPageState extends State<LecturersPage> {
  final TextEditingController _searchController = TextEditingController();
  Timer? _debounceTimer;
  bool _isLoading = false;
  String? _error;
  List<dynamic> _lecturers = [];
  Map<String, dynamic> _pagination = {
    'count': 0,
    'next': null,
    'previous': null,
    'currentPage': 1,
  };
  bool _isRemote = false;
  Map<String, dynamic>? _selectedLecturer;
  bool _showProfileModal = false;
  bool _isLoadingProfile = false;

  static const String _baseUrl = 'https://projecteastapi.ddns.net';

  @override
  void initState() {
    super.initState();
    _searchController.addListener(_onSearchChanged);
    _fetchLecturers();
  }

  @override
  void dispose() {
    _debounceTimer?.cancel();
    _searchController.dispose();
    super.dispose();
  }

  void _onSearchChanged() {
    if (_debounceTimer?.isActive ?? false) _debounceTimer!.cancel();
    _debounceTimer = Timer(const Duration(milliseconds: 400), () {
      setState(() {});
    });
  }

  String _getImageUrl(String? imagePath) {
    if (imagePath == null || imagePath.isEmpty) return '';
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }
    String cleanPath = imagePath.startsWith('/') ? imagePath : '/$imagePath';
    cleanPath = cleanPath.replaceAll(RegExp(r'/media/media+'), '/media/');
    if (cleanPath.startsWith('/media/media/')) {
      cleanPath = cleanPath.replaceFirst('/media/media/', '/media/');
    }
    return '$_baseUrl$cleanPath';
  }

  List<dynamic> get _filteredLecturers {
    if (_searchController.text.trim().isEmpty) return _lecturers;
    final search = _searchController.text.toLowerCase();
    return _lecturers.where((lecturer) {
      final fullName = '${lecturer['first_name'] ?? ''} ${lecturer['last_name'] ?? ''}'.toLowerCase();
      final email = (lecturer['email'] ?? '').toLowerCase();
      final specialty = (lecturer['specialty'] ?? '').toLowerCase();
      return fullName.contains(search) || email.contains(search) || specialty.contains(search);
    }).toList();
  }

  Future<void> _fetchLecturers({int? page}) async {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final instituteData = authProvider.instituteData;
    final accessToken = instituteData['accessToken'];
    final refreshToken = instituteData['refreshToken'];

    if (accessToken == null) {
      setState(() {
        _isLoading = false;
        _error = 'Not authenticated';
      });
      return;
    }

    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final data = await ApiService.getInstitutionLecturersList(
        accessToken: accessToken,
        page: page ?? _pagination['currentPage'],
        refreshToken: refreshToken,
        onTokenRefreshed: (tokens) {
          authProvider.onTokenRefreshed(tokens);
        },
        onSessionExpired: () {
          authProvider.onSessionExpired();
        },
      );

      List<dynamic> lecturers = [];
      if (data['results'] is List) {
        lecturers = (data['results'] as List<dynamic>).map((l) {
          final profileImage = l['profile_image'];
          if (profileImage != null) {
            l['profile_image'] = _getImageUrl(profileImage);
          }
          return l;
        }).toList();
      }

      setState(() {
        _lecturers = lecturers;
        _isRemote = true;
        _pagination = {
          'count': data['count'] ?? 0,
          'next': data['next'],
          'previous': data['previous'],
          'currentPage': page ?? _pagination['currentPage'],
        };
      });
    } catch (err) {
      setState(() {
        _error = err is ApiException ? err.message : 'Unable to load lecturers';
        _isRemote = false;
      });
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  Future<void> _loadLecturerProfile(int lecturerId) async {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final instituteData = authProvider.instituteData;
    final accessToken = instituteData['accessToken'];
    final refreshToken = instituteData['refreshToken'];

    if (accessToken == null) return;

    setState(() {
      _isLoadingProfile = true;
      _selectedLecturer = null;
    });

    try {
      final response = await ApiService.getInstitutionLecturerProfile(
        accessToken: accessToken,
        lecturerId: lecturerId,
        refreshToken: refreshToken,
        onTokenRefreshed: (tokens) {
          authProvider.onTokenRefreshed(tokens);
        },
        onSessionExpired: () {
          authProvider.onSessionExpired();
        },
      );

      if (response['success'] == true && response['data'] != null) {
        setState(() {
          _selectedLecturer = response['data'] as Map<String, dynamic>;
        });
      } else {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(response['message'] ?? 'Failed to load lecturer profile')),
          );
        }
        setState(() {
          _showProfileModal = false;
        });
      }
    } catch (err) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(err is ApiException ? err.message : 'Failed to load lecturer profile')),
        );
      }
      setState(() {
        _showProfileModal = false;
      });
    } finally {
      setState(() {
        _isLoadingProfile = false;
      });
    }
  }

  void _handleLecturerClick(Map<String, dynamic> lecturer) {
    final lecturerId = lecturer['id'];
    if (lecturerId == null) return;
    setState(() {
      _showProfileModal = true;
    });
    _loadLecturerProfile(lecturerId as int);
    _showProfileDialog();
  }

  void _showProfileDialog() {
    showDialog(
      context: context,
      barrierDismissible: true,
      builder: (context) => _buildProfileModal(),
    ).then((_) {
      setState(() {
        _showProfileModal = false;
        _selectedLecturer = null;
      });
    });
  }

  void _handleQuickAction(String action, Map<String, dynamic> lecturer) {
    final name = '${lecturer['first_name'] ?? ''} ${lecturer['last_name'] ?? ''}';
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('$action for $name')),
    );
  }

  @override
  Widget build(BuildContext context) {
    final authProvider = Provider.of<AuthProvider>(context);
    final instituteData = authProvider.instituteData;

    // BLOCK ACCESS if not verified
    if (instituteData['isVerified'] != true) {
      return const VerificationLock();
    }

    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Scaffold(
      bottomNavigationBar: ModernBottomNav(
        currentIndex: 1, // Dashboard index for institutions
        onTap: (index) {
          NavigationHelper.handleBottomNavTap(context, index);
        },
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header
            Padding(
              padding: const EdgeInsets.only(bottom: 16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Lecturers',
                    style: TextStyle(
                      fontSize: 32,
                      fontWeight: FontWeight.bold,
                      color: isDark ? Colors.white : Colors.grey.shade800,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Manage and view all your lecturers',
                    style: TextStyle(
                      fontSize: 16,
                      color: isDark ? Colors.grey.shade400 : Colors.grey.shade600,
                    ),
                  ),
                ],
              ),
            ),

            // Search and Refresh
            Card(
              elevation: 2,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: TextField(
                            controller: _searchController,
                            decoration: InputDecoration(
                              hintText: 'Search by name, email, or specialty...',
                              prefixIcon: const Icon(Icons.search),
                              border: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(8),
                              ),
                              filled: true,
                              fillColor: isDark ? AppTheme.navy700 : Colors.grey.shade50,
                            ),
                          ),
                        ),
                        const SizedBox(width: 12),
                        ElevatedButton.icon(
                          onPressed: _isLoading ? null : () => _fetchLecturers(),
                          icon: Icon(
                            Icons.refresh,
                            color: _isLoading ? Colors.grey : Colors.white,
                          ),
                          label: const Text('Refresh'),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppTheme.teal500,
                            foregroundColor: Colors.white,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        Text(
                          'Showing ${_filteredLecturers.length} of ${_pagination['count']} lecturers',
                          style: TextStyle(
                            fontSize: 14,
                            color: isDark ? Colors.grey.shade400 : Colors.grey.shade600,
                          ),
                        ),
                        const SizedBox(width: 8),
                        if (_isRemote)
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                            decoration: BoxDecoration(
                              color: Colors.green.shade100,
                              borderRadius: BorderRadius.circular(4),
                            ),
                            child: Text(
                              'Live',
                              style: TextStyle(
                                fontSize: 12,
                                color: Colors.green.shade700,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                      ],
                    ),
                    if (_error != null)
                      Padding(
                        padding: const EdgeInsets.only(top: 8.0),
                        child: Row(
                          children: [
                            Icon(Icons.warning_amber, color: Colors.amber.shade600, size: 20),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                _error!,
                                style: TextStyle(
                                  fontSize: 14,
                                  color: Colors.amber.shade600,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                  ],
                ),
              ),
            ),

            const SizedBox(height: 16),

            // Lecturers Table
            Card(
              elevation: 2,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              child: _isLoading
                  ? const Padding(
                      padding: EdgeInsets.all(32.0),
                      child: Center(child: CircularProgressIndicator()),
                    )
                  : _filteredLecturers.isEmpty
                      ? Padding(
                          padding: const EdgeInsets.all(48.0),
                          child: Center(
                            child: Column(
                              children: [
                                Icon(
                                  Icons.school_outlined,
                                  size: 64,
                                  color: Colors.grey.shade400,
                                ),
                                const SizedBox(height: 16),
                                Text(
                                  'No lecturers found',
                                  style: TextStyle(
                                    fontSize: 18,
                                    color: Colors.grey.shade600,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        )
                      : SingleChildScrollView(
                          scrollDirection: Axis.horizontal,
                          child: DataTable(
                            headingRowColor: MaterialStateProperty.all(
                              AppTheme.teal500,
                            ),
                            columns: const [
                              DataColumn(label: Text('Name', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold))),
                              DataColumn(label: Text('ID', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold))),
                              DataColumn(label: Text('Specialty', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold))),
                              DataColumn(label: Text('Experience', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold))),
                              DataColumn(label: Text('Phone', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold))),
                              DataColumn(label: Text('Status', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold))),
                              DataColumn(label: Text('Actions', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold))),
                            ],
                            rows: List.generate(_filteredLecturers.length, (index) {
                              final lecturer = _filteredLecturers[index];
                              final firstName = lecturer['first_name'] ?? '';
                              final lastName = lecturer['last_name'] ?? '';
                              final name = '$firstName $lastName'.trim();
                              final email = lecturer['email'] ?? '';
                              final profileImage = lecturer['profile_image'];
                              final specialty = lecturer['specialty'] ?? '—';
                              final experience = lecturer['experience'];
                              final phone = lecturer['phone_number'] ?? '—';
                              final active = lecturer['active'] == true;

                              return DataRow(
                                onSelectChanged: (_) => _handleLecturerClick(lecturer),
                                cells: [
                                  DataCell(
                                    Row(
                                      children: [
                                        if (profileImage != null)
                                          CircleAvatar(
                                            radius: 20,
                                            backgroundImage: NetworkImage(profileImage),
                                            onBackgroundImageError: (_, __) {},
                                          )
                                        else
                                          CircleAvatar(
                                            radius: 20,
                                            backgroundColor: AppTheme.teal500,
                                            child: const Icon(Icons.person, color: Colors.white, size: 20),
                                          ),
                                        const SizedBox(width: 12),
                                        Expanded(
                                          child: Column(
                                            crossAxisAlignment: CrossAxisAlignment.start,
                                            mainAxisAlignment: MainAxisAlignment.center,
                                            children: [
                                              Text(
                                                name.isNotEmpty ? name : email,
                                                style: TextStyle(
                                                  fontWeight: FontWeight.w500,
                                                  color: isDark ? Colors.white : Colors.black,
                                                ),
                                              ),
                                              Text(
                                                email,
                                                style: TextStyle(
                                                  fontSize: 12,
                                                  color: isDark ? Colors.grey.shade400 : Colors.grey.shade600,
                                                ),
                                              ),
                                            ],
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                  DataCell(Text(
                                    '${lecturer['id'] ?? '—'}',
                                    style: TextStyle(color: isDark ? Colors.white : Colors.black),
                                  )),
                                  DataCell(Text(
                                    specialty,
                                    style: TextStyle(color: isDark ? Colors.white : Colors.black),
                                  )),
                                  DataCell(Text(
                                    experience != null ? '$experience years' : '—',
                                    style: TextStyle(color: isDark ? Colors.white : Colors.black),
                                  )),
                                  DataCell(Text(
                                    phone,
                                    style: TextStyle(color: isDark ? Colors.white : Colors.black),
                                  )),
                                  DataCell(
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                                      decoration: BoxDecoration(
                                        color: active
                                            ? Colors.green.shade100
                                            : Colors.red.shade100,
                                        borderRadius: BorderRadius.circular(12),
                                      ),
                                      child: Text(
                                        active ? 'Active' : 'Inactive',
                                        style: TextStyle(
                                          fontSize: 12,
                                          fontWeight: FontWeight.bold,
                                          color: active
                                              ? Colors.green.shade700
                                              : Colors.red.shade700,
                                        ),
                                      ),
                                    ),
                                  ),
                                  DataCell(
                                    Row(
                                      children: [
                                        IconButton(
                                          icon: const Icon(Icons.email, size: 18),
                                          color: Colors.blue.shade600,
                                          onPressed: () => _handleQuickAction('Email sent', lecturer),
                                        ),
                                        IconButton(
                                          icon: const Icon(Icons.phone, size: 18),
                                          color: Colors.green.shade600,
                                          onPressed: () => _handleQuickAction('Call initiated', lecturer),
                                        ),
                                      ],
                                    ),
                                  ),
                                ],
                              );
                            }),
                          ),
                        ),
            ),

            // Pagination
            if (!_isLoading && _filteredLecturers.isNotEmpty)
              Padding(
                padding: const EdgeInsets.all(16.0),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    ElevatedButton(
                      onPressed: _pagination['previous'] == null || _isLoading
                          ? null
                          : () {
                              final prev = (_pagination['currentPage'] as int) - 1;
                              _fetchLecturers(page: prev);
                            },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppTheme.teal500,
                        foregroundColor: Colors.white,
                      ),
                      child: const Text('Previous'),
                    ),
                    const SizedBox(width: 16),
                    Text(
                      'Page ${_pagination['currentPage']}',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: isDark ? Colors.white : Colors.black,
                      ),
                    ),
                    const SizedBox(width: 16),
                    ElevatedButton(
                      onPressed: _pagination['next'] == null || _isLoading
                          ? null
                          : () {
                              final next = (_pagination['currentPage'] as int) + 1;
                              _fetchLecturers(page: next);
                            },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppTheme.teal500,
                        foregroundColor: Colors.white,
                      ),
                      child: const Text('Next'),
                    ),
                  ],
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildProfileModal() {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Dialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Container(
        constraints: const BoxConstraints(maxWidth: 700, maxHeight: 600),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Header
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppTheme.teal500,
                borderRadius: const BorderRadius.only(
                  topLeft: Radius.circular(16),
                  topRight: Radius.circular(16),
                ),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'Lecturer Profile',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close, color: Colors.white),
                    onPressed: () {
                      Navigator.of(context).pop();
                    },
                  ),
                ],
              ),
            ),
            // Content
            Expanded(
              child: _isLoadingProfile
                  ? const Center(child: CircularProgressIndicator())
                  : _selectedLecturer == null
                      ? const Center(child: Text('No profile data available'))
                      : SingleChildScrollView(
                          padding: const EdgeInsets.all(16),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              // Header with Avatar
                              Row(
                                children: [
                                  if (_selectedLecturer!['profile_image'] != null)
                                    CircleAvatar(
                                      radius: 48,
                                      backgroundImage: NetworkImage(
                                        _getImageUrl(_selectedLecturer!['profile_image']),
                                      ),
                                      onBackgroundImageError: (_, __) {},
                                    )
                                  else
                                    CircleAvatar(
                                      radius: 48,
                                      backgroundColor: AppTheme.teal500,
                                      child: const Icon(Icons.person, size: 48, color: Colors.white),
                                    ),
                                  const SizedBox(width: 16),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          '${_selectedLecturer!['first_name'] ?? ''} ${_selectedLecturer!['last_name'] ?? ''}',
                                          style: TextStyle(
                                            fontSize: 24,
                                            fontWeight: FontWeight.bold,
                                            color: isDark ? Colors.white : Colors.black,
                                          ),
                                        ),
                                        Text(
                                          '@${_selectedLecturer!['username'] ?? ''}',
                                          style: TextStyle(
                                            fontSize: 14,
                                            color: isDark ? Colors.grey.shade400 : Colors.grey.shade600,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 24),
                              // Contact Information Grid
                              GridView.count(
                                crossAxisCount: 2,
                                shrinkWrap: true,
                                physics: const NeverScrollableScrollPhysics(),
                                crossAxisSpacing: 12,
                                mainAxisSpacing: 12,
                                childAspectRatio: 3,
                                children: [
                                  _buildInfoCard(
                                    icon: Icons.email,
                                    label: 'Email',
                                    value: _selectedLecturer!['email'] ?? '—',
                                    isDark: isDark,
                                  ),
                                  _buildInfoCard(
                                    icon: Icons.phone,
                                    label: 'Phone',
                                    value: _selectedLecturer!['phone_number'] ?? '—',
                                    isDark: isDark,
                                  ),
                                  _buildInfoCard(
                                    icon: Icons.location_city,
                                    label: 'City',
                                    value: (_selectedLecturer!['city'] ?? '—').toString().toUpperCase(),
                                    isDark: isDark,
                                  ),
                                  _buildInfoCard(
                                    icon: Icons.work,
                                    label: 'Specialty',
                                    value: (_selectedLecturer!['specialty'] ?? '—').toString(),
                                    isDark: isDark,
                                  ),
                                  _buildInfoCard(
                                    icon: Icons.trending_up,
                                    label: 'Experience',
                                    value: _selectedLecturer!['experience'] != null
                                        ? '${_selectedLecturer!['experience']} years'
                                        : '—',
                                    isDark: isDark,
                                  ),
                                  _buildInfoCard(
                                    icon: Icons.access_time,
                                    label: 'Available Time',
                                    value: _selectedLecturer!['free_time'] ?? '—',
                                    isDark: isDark,
                                  ),
                                ],
                              ),
                              // Academic Achievement
                              if (_selectedLecturer!['academic_achievement'] != null) ...[
                                const SizedBox(height: 16),
                                Container(
                                  padding: const EdgeInsets.all(16),
                                  decoration: BoxDecoration(
                                    color: isDark ? AppTheme.navy700 : Colors.grey.shade50,
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        'Academic Achievement',
                                        style: TextStyle(
                                          fontSize: 16,
                                          fontWeight: FontWeight.bold,
                                          color: isDark ? Colors.white : Colors.black,
                                        ),
                                      ),
                                      const SizedBox(height: 8),
                                      Text(
                                        _selectedLecturer!['academic_achievement'],
                                        style: TextStyle(
                                          fontSize: 14,
                                          color: isDark ? Colors.grey.shade300 : Colors.grey.shade700,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                              // Skills
                              if (_selectedLecturer!['skills'] != null) ...[
                                const SizedBox(height: 16),
                                Container(
                                  padding: const EdgeInsets.all(16),
                                  decoration: BoxDecoration(
                                    color: isDark ? AppTheme.navy700 : Colors.grey.shade50,
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        'Skills',
                                        style: TextStyle(
                                          fontSize: 16,
                                          fontWeight: FontWeight.bold,
                                          color: isDark ? Colors.white : Colors.black,
                                        ),
                                      ),
                                      const SizedBox(height: 8),
                                      Text(
                                        _selectedLecturer!['skills'],
                                        style: TextStyle(
                                          fontSize: 14,
                                          color: isDark ? Colors.grey.shade300 : Colors.grey.shade700,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                              // About
                              if (_selectedLecturer!['about'] != null) ...[
                                const SizedBox(height: 16),
                                Container(
                                  padding: const EdgeInsets.all(16),
                                  decoration: BoxDecoration(
                                    color: isDark ? AppTheme.navy700 : Colors.grey.shade50,
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        'About',
                                        style: TextStyle(
                                          fontSize: 16,
                                          fontWeight: FontWeight.bold,
                                          color: isDark ? Colors.white : Colors.black,
                                        ),
                                      ),
                                      const SizedBox(height: 8),
                                      Text(
                                        _selectedLecturer!['about'],
                                        style: TextStyle(
                                          fontSize: 14,
                                          color: isDark ? Colors.grey.shade300 : Colors.grey.shade700,
                                        ),
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

  Widget _buildInfoCard({
    required IconData icon,
    required String label,
    required String value,
    required bool isDark,
  }) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: isDark ? AppTheme.navy700 : Colors.grey.shade50,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        children: [
          Icon(icon, color: AppTheme.teal500, size: 20),
          const SizedBox(width: 8),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  label,
                  style: TextStyle(
                    fontSize: 12,
                    color: isDark ? Colors.grey.shade400 : Colors.grey.shade600,
                  ),
                ),
                Text(
                  value,
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w500,
                    color: isDark ? Colors.white : Colors.black,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}


