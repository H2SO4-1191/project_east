import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../config/theme.dart';
import '../providers/auth_provider.dart';
import '../services/profile_service.dart';
import '../services/api_service.dart';
import '../widgets/profile_button.dart';
import 'dashboard/edit_profile_page.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  Map<String, dynamic>? _profile;
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadProfile();
  }

  Future<void> _loadProfile() async {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final instituteData = authProvider.instituteData;
    final username = instituteData['username'];
    final userType = instituteData['userType'];

    if (username == null || username.toString().isEmpty) {
      setState(() {
        _isLoading = false;
        _error = 'Username not available';
      });
      return;
    }

    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      Map<String, dynamic>? profileData;
      
      if (userType == 'student') {
        final response = await ProfileService.getStudentPublicProfile(username);
        profileData = response['data'] ?? response;
      } else if (userType == 'lecturer') {
        final response = await ProfileService.getLecturerPublicProfile(username);
        profileData = response['data'] ?? response;
      } else if (userType == 'institution') {
        final response = await ProfileService.getInstitutionPublicProfile(username);
        profileData = response['data'] ?? response;
      }

      setState(() {
        _profile = profileData;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString();
        _isLoading = false;
      });
    }
  }

  String _getImageUrl(String? imagePath) {
    if (imagePath == null || imagePath.isEmpty) return '';
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }
    final baseUrl = ApiService.baseUrl;
    String cleanPath = imagePath.startsWith('/') ? imagePath : '/$imagePath';
    cleanPath = cleanPath.replaceAll(RegExp(r'/media/media+'), '/media/');
    if (cleanPath.startsWith('/media/media/')) {
      cleanPath = cleanPath.replaceFirst('/media/media/', '/media/');
    }
    return '$baseUrl$cleanPath';
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final authProvider = Provider.of<AuthProvider>(context);
    final instituteData = authProvider.instituteData;
    final userType = instituteData['userType'] ?? '';

    return Scaffold(
      backgroundColor: isDark ? AppTheme.navy900 : const Color(0xFFF9FAFB),
      appBar: AppBar(
        elevation: 0,
        backgroundColor: isDark ? AppTheme.navy800 : Colors.white,
        leading: const Padding(
          padding: EdgeInsets.only(left: 8.0),
          child: ProfileButton(),
        ),
        title: const Text(
          'Profile',
          style: TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.bold,
          ),
        ),
        actions: [
          if (userType == 'institution')
            IconButton(
              icon: const Icon(Icons.edit),
              onPressed: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (context) => const EditProfilePage(),
                  ),
                ).then((_) => _loadProfile());
              },
            ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? Center(
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
                      FilledButton(
                        onPressed: _loadProfile,
                        child: const Text('Retry'),
                      ),
                    ],
                  ),
                )
              : _profile == null
                  ? Center(
                      child: Text(
                        'Profile not found',
                        style: theme.textTheme.bodyLarge,
                      ),
                    )
                  : SingleChildScrollView(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // Profile Header
                          _buildProfileHeader(theme, isDark, instituteData),
                          const SizedBox(height: 24),
                          // Profile Information
                          Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 24),
                            child: _buildProfileInfo(theme, isDark),
                          ),
                        ],
                      ),
                    ),
    );
  }

  Widget _buildProfileHeader(
    ThemeData theme,
    bool isDark,
    Map<String, dynamic> instituteData,
  ) {
    final profileImage = _getImageUrl(
      _profile?['profile_image'] ?? instituteData['profileImage'],
    );
    final displayName = _profile?['first_name'] != null && _profile?['last_name'] != null
        ? '${_profile?['first_name']} ${_profile?['last_name']}'
        : _profile?['username'] ?? instituteData['username'] ?? 'User';
    final username = _profile?['username'] ?? instituteData['username'] ?? '';
    final userType = instituteData['userType'] ?? '';

    return Container(
      width: double.infinity,
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [AppTheme.primary600, AppTheme.teal500],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
      ),
      child: SafeArea(
        bottom: false,
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            children: [
              // Profile Image
              Container(
                width: 120,
                height: 120,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  border: Border.all(
                    color: Colors.white,
                    width: 4,
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.2),
                      blurRadius: 20,
                      offset: const Offset(0, 10),
                    ),
                  ],
                ),
                child: ClipOval(
                  child: profileImage.isNotEmpty
                      ? Image.network(
                          profileImage,
                          fit: BoxFit.cover,
                          errorBuilder: (context, error, stackTrace) {
                            return _buildAvatarPlaceholder(displayName);
                          },
                        )
                      : _buildAvatarPlaceholder(displayName),
                ),
              ),
              const SizedBox(height: 16),
              // Name
              Text(
                displayName.toString(),
                style: const TextStyle(
                  fontSize: 28,
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                ),
              ),
              if (username.isNotEmpty) ...[
                const SizedBox(height: 4),
                Text(
                  '@$username',
                  style: TextStyle(
                    fontSize: 16,
                    color: Colors.white.withOpacity(0.9),
                  ),
                ),
              ],
              if (userType.isNotEmpty) ...[
                const SizedBox(height: 12),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 8,
                  ),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.2),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    userType.toUpperCase(),
                    style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.w600,
                      fontSize: 12,
                    ),
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildAvatarPlaceholder(String displayName) {
    final initial = displayName.toString().isNotEmpty
        ? displayName.toString().substring(0, 1).toUpperCase()
        : 'U';
    return Container(
      color: AppTheme.primary600,
      child: Center(
        child: Text(
          initial,
          style: const TextStyle(
            fontSize: 48,
            fontWeight: FontWeight.bold,
            color: Colors.white,
          ),
        ),
      ),
    );
  }

  Widget _buildProfileInfo(ThemeData theme, bool isDark) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // About Section
        if (_profile?['about'] != null) ...[
          _buildInfoCard(
            theme: theme,
            isDark: isDark,
            title: 'About',
            content: _profile!['about'].toString(),
            icon: Icons.info_outline,
          ),
          const SizedBox(height: 16),
        ],
        // Contact Information
        _buildInfoCard(
          theme: theme,
          isDark: isDark,
          title: 'Contact Information',
          icon: Icons.contact_mail,
          children: [
            if (_profile?['email'] != null)
              _buildInfoRow(
                icon: Icons.email,
                label: 'Email',
                value: _profile!['email'].toString(),
              ),
            if (_profile?['phone_number'] != null) ...[
              const SizedBox(height: 12),
              _buildInfoRow(
                icon: Icons.phone,
                label: 'Phone',
                value: _profile!['phone_number'].toString(),
              ),
            ],
            if (_profile?['city'] != null) ...[
              const SizedBox(height: 12),
              _buildInfoRow(
                icon: Icons.location_on,
                label: 'Location',
                value: _profile!['city'].toString(),
              ),
            ],
          ],
        ),
        // Additional Info based on user type
        if (_profile?['specialty'] != null) ...[
          const SizedBox(height: 16),
          _buildInfoCard(
            theme: theme,
            isDark: isDark,
            title: 'Specialty',
            content: _profile!['specialty'].toString(),
            icon: Icons.work_outline,
          ),
        ],
        if (_profile?['studying_level'] != null) ...[
          const SizedBox(height: 16),
          _buildInfoCard(
            theme: theme,
            isDark: isDark,
            title: 'Studying Level',
            content: _profile!['studying_level'].toString(),
            icon: Icons.school_outlined,
          ),
        ],
        if (_profile?['title'] != null) ...[
          const SizedBox(height: 16),
          _buildInfoCard(
            theme: theme,
            isDark: isDark,
            title: 'Title',
            content: _profile!['title'].toString(),
            icon: Icons.badge_outlined,
          ),
        ],
      ],
    );
  }

  Widget _buildInfoCard({
    required ThemeData theme,
    required bool isDark,
    required String title,
    String? content,
    required IconData icon,
    List<Widget>? children,
  }) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: isDark ? AppTheme.navy800 : Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: isDark
                      ? AppTheme.teal500.withOpacity(0.2)
                      : AppTheme.primary50,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(
                  icon,
                  color: isDark ? AppTheme.teal400 : AppTheme.primary600,
                  size: 20,
                ),
              ),
              const SizedBox(width: 12),
              Text(
                title,
                style: theme.textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
          if (content != null) ...[
            const SizedBox(height: 12),
            Text(
              content,
              style: theme.textTheme.bodyMedium,
            ),
          ],
          if (children != null) ...[
            const SizedBox(height: 12),
            ...children,
          ],
        ],
      ),
    );
  }

  Widget _buildInfoRow({
    required IconData icon,
    required String label,
    required String value,
  }) {
    final theme = Theme.of(context);
    return Row(
      children: [
        Icon(
          icon,
          size: 20,
          color: Colors.grey.shade600,
        ),
        const SizedBox(width: 12),
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
              const SizedBox(height: 2),
              Text(
                value,
                style: theme.textTheme.bodyMedium?.copyWith(
                  fontWeight: FontWeight.w500,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

