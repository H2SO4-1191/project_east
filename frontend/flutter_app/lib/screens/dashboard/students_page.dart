import 'dart:async';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../config/theme.dart';
import '../../providers/auth_provider.dart';
import '../../services/api_service.dart';
import '../../widgets/verification_lock.dart';
import '../../widgets/modern_bottom_nav.dart';
import '../../utils/navigation_helper.dart';

class StudentsPage extends StatefulWidget {
  const StudentsPage({super.key});

  @override
  State<StudentsPage> createState() => _StudentsPageState();
}

class _StudentsPageState extends State<StudentsPage> {
  final TextEditingController _searchController = TextEditingController();
  Timer? _debounceTimer;
  bool _isLoading = false;
  bool _isCheckingVerification = true;
  bool _isVerified = false;
  String? _error;
  List<dynamic> _students = [];
  String _filterStatus = 'all';
  Map<String, dynamic> _pagination = {
    'count': 0,
    'next': null,
    'previous': null,
    'currentPage': 1,
  };
  bool _isRemote = false;
  Map<String, dynamic>? _selectedStudent;
  bool _showProfileModal = false;
  bool _isLoadingProfile = false;

  static const String _baseUrl = 'https://projecteastapi.ddns.net';

  @override
  void initState() {
    super.initState();
    _searchController.addListener(_onSearchChanged);
    _checkVerification();
  }

  Future<void> _checkVerification() async {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final instituteData = authProvider.instituteData;
    final accessToken = instituteData['accessToken'];
    final refreshToken = instituteData['refreshToken'];
    final email = instituteData['email'];

    if (accessToken == null || email == null) {
      setState(() {
        _isCheckingVerification = false;
        _isVerified = false;
      });
      return;
    }

    try {
      final verificationStatus = await ApiService.checkVerificationStatus(
        email,
        accessToken: accessToken,
        refreshToken: refreshToken,
        onTokenRefreshed: (tokens) {
          authProvider.onTokenRefreshed(tokens);
        },
        onSessionExpired: () {
          authProvider.onSessionExpired();
        },
      );

      final isVerified = verificationStatus['is_verified'] == true;
      
      // Update auth provider
      if (verificationStatus['is_verified'] != instituteData['isVerified']) {
        authProvider.updateInstituteData({
          'isVerified': isVerified,
        });
      }

      setState(() {
        _isCheckingVerification = false;
        _isVerified = isVerified;
      });

      if (isVerified) {
        _fetchStudents();
      }
    } catch (e) {
      setState(() {
        _isCheckingVerification = false;
        _isVerified = false;
      });
    }
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
      _fetchStudents(page: 1);
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

  Future<void> _fetchStudents({int? page, String? status, String? search}) async {
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
      final data = await ApiService.getInstitutionStudentsList(
        accessToken: accessToken,
        page: page ?? _pagination['currentPage'],
        search: search ?? _searchController.text.trim(),
        status: status ?? _filterStatus,
        refreshToken: refreshToken,
        onTokenRefreshed: (tokens) {
          authProvider.onTokenRefreshed(tokens);
        },
        onSessionExpired: () {
          authProvider.onSessionExpired();
        },
      );

      List<dynamic> students = [];
      if (data['results'] is List) {
        students = data['results'] as List<dynamic>;
      }

      setState(() {
        _students = students;
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
        _error = err is ApiException ? err.message : 'Unable to load students';
        _isRemote = false;
      });
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  Future<void> _loadStudentProfile(int studentId) async {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final instituteData = authProvider.instituteData;
    final accessToken = instituteData['accessToken'];
    final refreshToken = instituteData['refreshToken'];

    if (accessToken == null) return;

    setState(() {
      _isLoadingProfile = true;
      _selectedStudent = null;
    });

    try {
      final response = await ApiService.getInstitutionStudentProfile(
        accessToken: accessToken,
        studentId: studentId,
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
          _selectedStudent = response['data'] as Map<String, dynamic>;
        });
      } else {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(response['message'] ?? 'Failed to load student profile')),
          );
        }
        setState(() {
          _showProfileModal = false;
        });
      }
    } catch (err) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(err is ApiException ? err.message : 'Failed to load student profile')),
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

  void _handleStudentClick(Map<String, dynamic> student) {
    final studentId = student['id'];
    if (studentId == null) return;
    setState(() {
      _showProfileModal = true;
    });
    _loadStudentProfile(studentId as int);
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
        _selectedStudent = null;
      });
    });
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    // Check verification status
    if (_isCheckingVerification) {
      return Scaffold(
        appBar: AppBar(
          title: const Text('Students'),
          elevation: 0,
          backgroundColor: isDark ? AppTheme.navy800 : Colors.white,
          foregroundColor: isDark ? Colors.white : Colors.black,
        ),
        body: const Center(child: CircularProgressIndicator()),
      );
    }

    // BLOCK ACCESS if not verified
    if (!_isVerified) {
      return const VerificationLock();
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('Students'),
        elevation: 0,
        backgroundColor: isDark ? AppTheme.navy800 : Colors.white,
        foregroundColor: isDark ? Colors.white : Colors.black,
      ),
      bottomNavigationBar: ModernBottomNav(
        currentIndex: 1, // Dashboard index for institutions
        onTap: (index) {
          NavigationHelper.handleBottomNavTap(context, index);
        },
      ),
      body: Stack(
        children: [
          SingleChildScrollView(
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
                        'Students',
                        style: TextStyle(
                          fontSize: 32,
                          fontWeight: FontWeight.bold,
                          color: isDark ? Colors.white : Colors.grey.shade800,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'Manage and view all your students',
                        style: TextStyle(
                          fontSize: 16,
                          color: isDark ? Colors.grey.shade400 : Colors.grey.shade600,
                        ),
                      ),
                    ],
                  ),
                ),

                // Filters and Search
                Card(
                  elevation: 2,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  child: Padding(
                    padding: const EdgeInsets.all(16.0),
                    child: Column(
                      children: [
                        Row(
                          children: [
                            // Search
                            Expanded(
                              child: TextField(
                                controller: _searchController,
                                decoration: InputDecoration(
                                  hintText: 'Search by name, email, or ID...',
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
                            // Status Filter
                            DropdownButton<String>(
                              value: _filterStatus,
                              items: const [
                                DropdownMenuItem(value: 'all', child: Text('All')),
                                DropdownMenuItem(value: 'Active', child: Text('Active')),
                                DropdownMenuItem(value: 'Inactive', child: Text('Inactive')),
                              ],
                              onChanged: (value) {
                                if (value != null) {
                                  setState(() {
                                    _filterStatus = value;
                                  });
                                  _fetchStudents(page: 1, status: value);
                                }
                              },
                            ),
                            const SizedBox(width: 12),
                            // Refresh Button
                            IconButton(
                              onPressed: _isLoading ? null : () => _fetchStudents(),
                              icon: Icon(
                                Icons.refresh,
                                color: _isLoading ? Colors.grey : AppTheme.primary600,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        // Results count
                        Row(
                          children: [
                            Text(
                              'Showing ${_students.length} of ${_pagination['count']} students',
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

                // Students Table
                Card(
                  elevation: 2,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  child: _isLoading
                      ? const Padding(
                          padding: EdgeInsets.all(32.0),
                          child: Center(child: CircularProgressIndicator()),
                        )
                      : _students.isEmpty
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
                                      'No students found',
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
                                  AppTheme.primary600,
                                ),
                                columns: const [
                                  DataColumn(label: Text('#', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold))),
                                  DataColumn(label: Text('Name', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold))),
                                  DataColumn(label: Text('Level', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold))),
                                  DataColumn(label: Text('Phone', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold))),
                                  DataColumn(label: Text('Status', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold))),
                                ],
                                rows: List.generate(_students.length, (index) {
                                  final student = _students[index];
                                  final firstName = student['first_name'] ?? '';
                                  final lastName = student['last_name'] ?? '';
                                  final name = '$firstName $lastName'.trim();
                                  final email = student['email'] ?? '';
                                  final profileImage = student['profile_image'];
                                  final studyingLevel = student['studying_level'] ?? '—';
                                  final phone = student['responsible_phone'] ?? student['phone_number'] ?? '—';
                                  final active = student['active'] == true;

                                  final rowNumber = (((_pagination['currentPage'] as int) - 1) * 10) + index + 1;
                                  return DataRow(
                                    onSelectChanged: (_) => _handleStudentClick(student),
                                    cells: [
                                      DataCell(Text(
                                        '$rowNumber',
                                        style: TextStyle(color: isDark ? Colors.white : Colors.black),
                                      )),
                                      DataCell(
                                        Row(
                                          children: [
                                            if (profileImage != null)
                                              CircleAvatar(
                                                radius: 20,
                                                backgroundImage: NetworkImage(_getImageUrl(profileImage)),
                                                onBackgroundImageError: (_, __) {},
                                              )
                                            else
                                              CircleAvatar(
                                                radius: 20,
                                                backgroundColor: AppTheme.primary600,
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
                                        studyingLevel,
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
                                    ],
                                  );
                                }),
                              ),
                            ),
                ),

                // Pagination
                if (!_isLoading && _students.isNotEmpty)
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
                                  _fetchStudents(page: prev);
                                },
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppTheme.primary600,
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
                                  _fetchStudents(page: next);
                                },
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppTheme.primary600,
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
        ],
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
                color: AppTheme.primary600,
                borderRadius: const BorderRadius.only(
                  topLeft: Radius.circular(16),
                  topRight: Radius.circular(16),
                ),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'Student Profile',
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
                  : _selectedStudent == null
                      ? const Center(child: Text('No profile data available'))
                      : SingleChildScrollView(
                          padding: const EdgeInsets.all(16),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              // Header with Avatar
                              Row(
                                children: [
                                  if (_selectedStudent!['profile_image'] != null)
                                    CircleAvatar(
                                      radius: 48,
                                      backgroundImage: NetworkImage(
                                        _getImageUrl(_selectedStudent!['profile_image']),
                                      ),
                                      onBackgroundImageError: (_, __) {},
                                    )
                                  else
                                    CircleAvatar(
                                      radius: 48,
                                      backgroundColor: AppTheme.primary600,
                                      child: const Icon(Icons.person, size: 48, color: Colors.white),
                                    ),
                                  const SizedBox(width: 16),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          '${_selectedStudent!['first_name'] ?? ''} ${_selectedStudent!['last_name'] ?? ''}',
                                          style: TextStyle(
                                            fontSize: 24,
                                            fontWeight: FontWeight.bold,
                                            color: isDark ? Colors.white : Colors.black,
                                          ),
                                        ),
                                        Text(
                                          '@${_selectedStudent!['username'] ?? ''}',
                                          style: TextStyle(
                                            fontSize: 14,
                                            color: isDark ? Colors.grey.shade400 : Colors.grey.shade600,
                                          ),
                                        ),
                                        Text(
                                          'Student ID: ${_selectedStudent!['id'] ?? ''}',
                                          style: TextStyle(
                                            fontSize: 12,
                                            color: isDark ? Colors.grey.shade500 : Colors.grey.shade700,
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
                                    value: _selectedStudent!['email'] ?? '—',
                                    isDark: isDark,
                                  ),
                                  _buildInfoCard(
                                    icon: Icons.phone,
                                    label: 'Phone',
                                    value: _selectedStudent!['phone_number'] ?? '—',
                                    isDark: isDark,
                                  ),
                                  _buildInfoCard(
                                    icon: Icons.location_city,
                                    label: 'City',
                                    value: (_selectedStudent!['city'] ?? '—').toString().toUpperCase(),
                                    isDark: isDark,
                                  ),
                                  _buildInfoCard(
                                    icon: Icons.school,
                                    label: 'Studying Level',
                                    value: (_selectedStudent!['studying_level'] ?? '—').toString().toUpperCase(),
                                    isDark: isDark,
                                  ),
                                ],
                              ),
                              // About Section
                              if (_selectedStudent!['about'] != null) ...[
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
                                        _selectedStudent!['about'],
                                        style: TextStyle(
                                          fontSize: 14,
                                          color: isDark ? Colors.grey.shade300 : Colors.grey.shade700,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                              // Responsible Contact
                              if (_selectedStudent!['responsible_phone'] != null ||
                                  _selectedStudent!['responsible_email'] != null) ...[
                                const SizedBox(height: 16),
                                Container(
                                  padding: const EdgeInsets.all(16),
                                  decoration: BoxDecoration(
                                    color: Colors.blue.shade50,
                                    borderRadius: BorderRadius.circular(12),
                                    border: Border.all(color: Colors.blue.shade200),
                                  ),
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        'Responsible Contact',
                                        style: TextStyle(
                                          fontSize: 16,
                                          fontWeight: FontWeight.bold,
                                          color: Colors.blue.shade900,
                                        ),
                                      ),
                                      const SizedBox(height: 8),
                                      if (_selectedStudent!['responsible_phone'] != null)
                                        Row(
                                          children: [
                                            Icon(Icons.phone, size: 16, color: Colors.blue.shade600),
                                            const SizedBox(width: 8),
                                            Text(
                                              _selectedStudent!['responsible_phone'],
                                              style: TextStyle(color: Colors.blue.shade900),
                                            ),
                                          ],
                                        ),
                                      if (_selectedStudent!['responsible_email'] != null) ...[
                                        const SizedBox(height: 4),
                                        Row(
                                          children: [
                                            Icon(Icons.email, size: 16, color: Colors.blue.shade600),
                                            const SizedBox(width: 8),
                                            Text(
                                              _selectedStudent!['responsible_email'],
                                              style: TextStyle(color: Colors.blue.shade900),
                                            ),
                                          ],
                                        ),
                                      ],
                                    ],
                                  ),
                                ),
                              ],
                              // Interests
                              if (_selectedStudent!['interesting_keywords'] != null) ...[
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
                                        'Interests',
                                        style: TextStyle(
                                          fontSize: 16,
                                          fontWeight: FontWeight.bold,
                                          color: isDark ? Colors.white : Colors.black,
                                        ),
                                      ),
                                      const SizedBox(height: 8),
                                      Text(
                                        _selectedStudent!['interesting_keywords'],
                                        style: TextStyle(
                                          fontSize: 14,
                                          color: isDark ? Colors.grey.shade300 : Colors.grey.shade700,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                              // Documents
                              if (_selectedStudent!['idcard_front'] != null ||
                                  _selectedStudent!['idcard_back'] != null ||
                                  _selectedStudent!['residence_front'] != null ||
                                  _selectedStudent!['residence_back'] != null) ...[
                                const SizedBox(height: 16),
                                Text(
                                  'Documents',
                                  style: TextStyle(
                                    fontSize: 16,
                                    fontWeight: FontWeight.bold,
                                    color: isDark ? Colors.white : Colors.black,
                                  ),
                                ),
                                const SizedBox(height: 8),
                                GridView.count(
                                  crossAxisCount: 2,
                                  shrinkWrap: true,
                                  physics: const NeverScrollableScrollPhysics(),
                                  crossAxisSpacing: 8,
                                  mainAxisSpacing: 8,
                                  childAspectRatio: 1.5,
                                  children: [
                                    if (_selectedStudent!['idcard_front'] != null)
                                      _buildDocumentCard(
                                        imageUrl: _getImageUrl(_selectedStudent!['idcard_front']),
                                        label: 'ID Front',
                                        isDark: isDark,
                                      ),
                                    if (_selectedStudent!['idcard_back'] != null)
                                      _buildDocumentCard(
                                        imageUrl: _getImageUrl(_selectedStudent!['idcard_back']),
                                        label: 'ID Back',
                                        isDark: isDark,
                                      ),
                                    if (_selectedStudent!['residence_front'] != null)
                                      _buildDocumentCard(
                                        imageUrl: _getImageUrl(_selectedStudent!['residence_front']),
                                        label: 'Residence Front',
                                        isDark: isDark,
                                      ),
                                    if (_selectedStudent!['residence_back'] != null)
                                      _buildDocumentCard(
                                        imageUrl: _getImageUrl(_selectedStudent!['residence_back']),
                                        label: 'Residence Back',
                                        isDark: isDark,
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
          Icon(icon, color: AppTheme.primary600, size: 20),
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

  Widget _buildDocumentCard({
    required String imageUrl,
    required String label,
    required bool isDark,
  }) {
    return Column(
      children: [
        Expanded(
          child: Container(
            decoration: BoxDecoration(
              color: isDark ? AppTheme.navy700 : Colors.grey.shade100,
              borderRadius: BorderRadius.circular(8),
            ),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(8),
              child: Image.network(
                imageUrl,
                fit: BoxFit.cover,
                errorBuilder: (_, __, ___) => const Icon(Icons.image_not_supported),
              ),
            ),
          ),
        ),
        const SizedBox(height: 4),
        Text(
          label,
          style: TextStyle(
            fontSize: 12,
            color: isDark ? Colors.grey.shade400 : Colors.grey.shade600,
          ),
        ),
      ],
    );
  }
}
