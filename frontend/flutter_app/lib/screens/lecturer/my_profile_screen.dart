import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../config/theme.dart';
import '../../providers/auth_provider.dart';
import '../../services/api_service.dart';
import '../../widgets/full_screen_image_viewer.dart';

class LecturerMyProfileScreen extends StatefulWidget {
  const LecturerMyProfileScreen({super.key});

  @override
  State<LecturerMyProfileScreen> createState() => _LecturerMyProfileScreenState();
}

class _LecturerMyProfileScreenState extends State<LecturerMyProfileScreen> {
  Map<String, dynamic>? _profileData;
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadProfile();
  }

  Future<void> _loadProfile() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final instituteData = authProvider.instituteData;
    final accessToken = instituteData['accessToken'];
    final refreshToken = instituteData['refreshToken'];

    if (accessToken == null) {
      setState(() {
        _error = 'Please log in first';
        _isLoading = false;
      });
      return;
    }

    try {
      final response = await ApiService.getLecturerMyProfile(
        accessToken: accessToken,
        refreshToken: refreshToken,
        onTokenRefreshed: (tokens) {
          authProvider.onTokenRefreshed(tokens);
        },
        onSessionExpired: () {
          authProvider.onSessionExpired();
        },
      );

      final data = response['data'] ?? response;
      
      setState(() {
        _profileData = data;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = e is ApiException ? e.message : 'Failed to load profile';
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

  void _showImageFullScreen(String imageUrl) {
    showDialog(
      context: context,
      builder: (context) => Dialog(
        backgroundColor: Colors.transparent,
        insetPadding: const EdgeInsets.all(16),
        child: Stack(
          children: [
            Center(
              child: InteractiveViewer(
                child: Image.network(
                  imageUrl,
                  fit: BoxFit.contain,
                  errorBuilder: (context, error, stackTrace) {
                    return Container(
                      padding: const EdgeInsets.all(20),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: const Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.error_outline, size: 48, color: Colors.red),
                          SizedBox(height: 8),
                          Text('Failed to load image'),
                        ],
                      ),
                    );
                  },
                ),
              ),
            ),
            Positioned(
              top: 8,
              right: 8,
              child: IconButton(
                icon: Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: Colors.black.withOpacity(0.5),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(Icons.close, color: Colors.white, size: 24),
                ),
                onPressed: () => Navigator.pop(context),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildImageCard(String label, String? imagePath, IconData icon) {
    final imageUrl = imagePath != null ? _getImageUrl(imagePath) : '';
    final hasImage = imageUrl.isNotEmpty;

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(icon, size: 20, color: AppTheme.primary600),
                const SizedBox(width: 8),
                Text(
                  label,
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            if (hasImage)
              GestureDetector(
                onTap: () => _showImageFullScreen(imageUrl),
                child: Container(
                  width: double.infinity,
                  height: 200,
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: Colors.grey.shade300),
                  ),
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(8),
                    child: Image.network(
                      imageUrl,
                      fit: BoxFit.cover,
                      errorBuilder: (context, error, stackTrace) {
                        return Container(
                          color: Colors.grey.shade200,
                          child: const Center(
                            child: Icon(Icons.broken_image, size: 48, color: Colors.grey),
                          ),
                        );
                      },
                      loadingBuilder: (context, child, loadingProgress) {
                        if (loadingProgress == null) return child;
                        return Center(
                          child: CircularProgressIndicator(
                            value: loadingProgress.expectedTotalBytes != null
                                ? loadingProgress.cumulativeBytesLoaded /
                                    loadingProgress.expectedTotalBytes!
                                : null,
                          ),
                        );
                      },
                    ),
                  ),
                ),
              )
            else
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: Colors.grey.shade100,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: Colors.grey.shade300),
                ),
                child: Column(
                  children: [
                    Icon(Icons.image_not_supported, size: 48, color: Colors.grey.shade400),
                    const SizedBox(height: 8),
                    Text(
                      'No image available',
                      style: TextStyle(color: Colors.grey.shade600),
                    ),
                  ],
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildInfoCard({
    required String title,
    required IconData icon,
    required List<Widget> children,
  }) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Container(
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
            const SizedBox(height: 16),
            ...children,
          ],
        ),
      ),
    );
  }

  Widget _buildInfoRow({
    required IconData icon,
    required String label,
    required String value,
  }) {
    final theme = Theme.of(context);
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
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
                const SizedBox(height: 4),
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
      ),
    );
  }

  Widget _buildAvatarPlaceholder(String text) {
    return Container(
      color: AppTheme.primary100,
      child: Center(
        child: Text(
          text.isNotEmpty ? text.substring(0, 1).toUpperCase() : 'L',
          style: const TextStyle(
            fontSize: 48,
            fontWeight: FontWeight.bold,
            color: AppTheme.primary600,
          ),
        ),
      ),
    );
  }

  bool _hasSocialMediaLinks() {
    return (_profileData?['facebook_link'] != null && _profileData!['facebook_link'].toString().isNotEmpty) ||
           (_profileData?['instagram_link'] != null && _profileData!['instagram_link'].toString().isNotEmpty) ||
           (_profileData?['x_link'] != null && _profileData!['x_link'].toString().isNotEmpty) ||
           (_profileData?['tiktok_link'] != null && _profileData!['tiktok_link'].toString().isNotEmpty);
  }

  Widget _buildSocialMediaLinks() {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    
    return Wrap(
      spacing: 12,
      runSpacing: 12,
      children: [
        if (_profileData?['facebook_link'] != null && _profileData!['facebook_link'].toString().isNotEmpty)
          _buildSocialMediaButton(
            icon: Icons.facebook,
            label: 'Facebook',
            url: _profileData!['facebook_link'].toString(),
            color: const Color(0xFF1877F2),
            isDark: isDark,
          ),
        if (_profileData?['instagram_link'] != null && _profileData!['instagram_link'].toString().isNotEmpty)
          _buildSocialMediaButton(
            icon: Icons.camera_alt,
            label: 'Instagram',
            url: _profileData!['instagram_link'].toString(),
            color: const Color(0xFFE4405F),
            isDark: isDark,
          ),
        if (_profileData?['x_link'] != null && _profileData!['x_link'].toString().isNotEmpty)
          _buildSocialMediaButton(
            icon: Icons.alternate_email,
            label: 'X (Twitter)',
            url: _profileData!['x_link'].toString(),
            color: Colors.black,
            isDark: isDark,
          ),
        if (_profileData?['tiktok_link'] != null && _profileData!['tiktok_link'].toString().isNotEmpty)
          _buildSocialMediaButton(
            icon: Icons.music_note,
            label: 'TikTok',
            url: _profileData!['tiktok_link'].toString(),
            color: const Color(0xFF000000),
            isDark: isDark,
          ),
      ],
    );
  }

  Widget _buildSocialMediaButton({
    required IconData icon,
    required String label,
    required String url,
    required Color color,
    required bool isDark,
  }) {
    return InkWell(
      onTap: () async {
        await _openExternalUrl(url);
      },
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        decoration: BoxDecoration(
          color: isDark ? AppTheme.navy700 : Colors.grey.shade100,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: color.withOpacity(0.3),
            width: 1.5,
          ),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, color: color, size: 20),
            const SizedBox(width: 8),
            Text(
              label,
              style: TextStyle(
                color: isDark ? Colors.white : Colors.black87,
                fontWeight: FontWeight.w500,
                fontSize: 14,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _openExternalUrl(String rawUrl) async {
    String formattedUrl = rawUrl.trim();
    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      formattedUrl = 'https://$formattedUrl';
    }
    final uri = Uri.tryParse(formattedUrl);
    if (uri == null) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Could not open $formattedUrl')),
        );
      }
      return;
    }
    try {
      final opened = await launchUrl(uri, mode: LaunchMode.externalApplication);
      if (!opened && mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Could not open $formattedUrl')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Could not open $formattedUrl')),
        );
      }
    }
  }

  Widget _buildVerificationPrompt() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: Colors.amber.shade50,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: Colors.amber.shade200),
        ),
        child: Row(
          children: [
            Icon(Icons.warning_amber_rounded, color: Colors.amber.shade700, size: 32),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Verification Required',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      color: Colors.amber.shade900,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'You need to check verified',
                    style: TextStyle(
                      fontSize: 14,
                      color: Colors.amber.shade800,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: isDark ? AppTheme.navy900 : const Color(0xFFF9FAFB),
      appBar: AppBar(
        elevation: 0,
        backgroundColor: isDark ? AppTheme.navy800 : Colors.white,
        title: const Text(
          'My Profile',
          style: TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.bold,
          ),
        ),
        actions: [
          if (_profileData != null && _profileData!['is_verified'] == true)
            IconButton(
              icon: const Icon(Icons.edit),
              onPressed: () {
                Navigator.pushNamed(context, '/lecturer/edit-profile/').then((_) => _loadProfile());
              },
              tooltip: 'Edit Profile',
            )
          else if (_profileData != null && _profileData!['is_verified'] != true)
            TextButton.icon(
              onPressed: () {
                Navigator.pushNamed(context, '/lecturer/verify').then((_) => _loadProfile());
              },
              icon: const Icon(Icons.verified_user, size: 20),
              label: const Text('Verify'),
              style: TextButton.styleFrom(
                foregroundColor: Colors.orange,
              ),
            ),
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadProfile,
            tooltip: 'Refresh',
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
              : _profileData == null
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
                          // Header Section - Full width gradient
                          Container(
                            width: double.infinity,
                            margin: const EdgeInsets.only(bottom: 16),
                            decoration: const BoxDecoration(
                              gradient: LinearGradient(
                                colors: [AppTheme.primary600, AppTheme.teal500],
                                begin: Alignment.topLeft,
                                end: Alignment.bottomRight,
                              ),
                            ),
                            padding: const EdgeInsets.only(
                              top: 40,
                              bottom: 40,
                            ),
                            child: Column(
                              children: [
                                // Profile Image - Centered
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
                                  child: GestureDetector(
                                    onTap: _getImageUrl(_profileData!['profile_image']).isNotEmpty
                                        ? () {
                                            Navigator.of(context).push(
                                              MaterialPageRoute(
                                                builder: (context) => FullScreenImageViewer(
                                                  imageUrl: _getImageUrl(_profileData!['profile_image']),
                                                ),
                                                fullscreenDialog: true,
                                              ),
                                            );
                                          }
                                        : null,
                                    child: ClipOval(
                                      child: _getImageUrl(_profileData!['profile_image']).isNotEmpty
                                          ? Image.network(
                                              _getImageUrl(_profileData!['profile_image']),
                                              fit: BoxFit.cover,
                                              errorBuilder: (context, error, stackTrace) {
                                                final name = _profileData!['first_name'] ?? _profileData!['username'] ?? 'L';
                                                return _buildAvatarPlaceholder(name);
                                              },
                                            )
                                          : _buildAvatarPlaceholder(
                                              _profileData!['first_name'] ?? _profileData!['username'] ?? 'L',
                                            ),
                                    ),
                                  ),
                                ),
                                const SizedBox(height: 16),
                                // Name
                                Text(
                                  '${_profileData!['first_name'] ?? ''} ${_profileData!['last_name'] ?? ''}'.trim().isEmpty
                                      ? _profileData!['username'] ?? 'Lecturer'
                                      : '${_profileData!['first_name'] ?? ''} ${_profileData!['last_name'] ?? ''}'.trim(),
                                  style: const TextStyle(
                                    fontSize: 24,
                                    fontWeight: FontWeight.bold,
                                    color: Colors.white,
                                  ),
                                  textAlign: TextAlign.center,
                                ),
                                const SizedBox(height: 8),
                                // Verification Badge
                                Container(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 16,
                                    vertical: 8,
                                  ),
                                  decoration: BoxDecoration(
                                    color: (_profileData!['is_verified'] == true)
                                        ? Colors.green
                                        : Colors.orange,
                                    borderRadius: BorderRadius.circular(20),
                                  ),
                                  child: Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      Icon(
                                        (_profileData!['is_verified'] == true)
                                            ? Icons.verified
                                            : Icons.pending,
                                        color: Colors.white,
                                        size: 18,
                                      ),
                                      const SizedBox(width: 6),
                                      Text(
                                        (_profileData!['is_verified'] == true)
                                            ? 'Verified'
                                            : 'Pending Verification',
                                        style: const TextStyle(
                                          color: Colors.white,
                                          fontWeight: FontWeight.w600,
                                          fontSize: 12,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          ),

                          // Verification Prompt (if not verified)
                          if (_profileData!['is_verified'] != true) _buildVerificationPrompt(),

                          // Personal Information
                          _buildInfoCard(
                            title: 'Personal Information',
                            icon: Icons.person_outline,
                            children: [
                              if (_profileData!['username'] != null)
                                _buildInfoRow(
                                  icon: Icons.alternate_email,
                                  label: 'Username',
                                  value: _profileData!['username'].toString(),
                                ),
                              if (_profileData!['first_name'] != null)
                                _buildInfoRow(
                                  icon: Icons.badge_outlined,
                                  label: 'First Name',
                                  value: _profileData!['first_name'].toString(),
                                ),
                              if (_profileData!['last_name'] != null)
                                _buildInfoRow(
                                  icon: Icons.badge_outlined,
                                  label: 'Last Name',
                                  value: _profileData!['last_name'].toString(),
                                ),
                              if (_profileData!['email'] != null)
                                _buildInfoRow(
                                  icon: Icons.email,
                                  label: 'Email',
                                  value: _profileData!['email'].toString(),
                                ),
                            ],
                          ),

                          // Lecturer Specific Information
                          _buildInfoCard(
                            title: 'Lecturer Information',
                            icon: Icons.school,
                            children: [
                              if (_profileData!['specialty'] != null)
                                _buildInfoRow(
                                  icon: Icons.work_outline,
                                  label: 'Specialty',
                                  value: _profileData!['specialty'].toString(),
                                ),
                              if (_profileData!['academic_achievement'] != null)
                                _buildInfoRow(
                                  icon: Icons.school_outlined,
                                  label: 'Academic Achievement',
                                  value: _profileData!['academic_achievement'].toString(),
                                ),
                              if (_profileData!['skills'] != null)
                                _buildInfoRow(
                                  icon: Icons.stars_outlined,
                                  label: 'Skills',
                                  value: _profileData!['skills'].toString(),
                                ),
                              if (_profileData!['experience'] != null)
                                _buildInfoRow(
                                  icon: Icons.trending_up,
                                  label: 'Experience',
                                  value: '${_profileData!['experience']} years',
                                ),
                              if (_profileData!['free_time'] != null)
                                _buildInfoRow(
                                  icon: Icons.access_time,
                                  label: 'Free Time',
                                  value: _profileData!['free_time'].toString(),
                                ),
                            ],
                          ),

                          // Contact Information
                          _buildInfoCard(
                            title: 'Contact Information',
                            icon: Icons.contact_mail,
                            children: [
                              if (_profileData!['phone_number'] != null)
                                _buildInfoRow(
                                  icon: Icons.phone,
                                  label: 'Phone Number',
                                  value: _profileData!['phone_number'].toString(),
                                ),
                              if (_profileData!['city'] != null)
                                _buildInfoRow(
                                  icon: Icons.location_city,
                                  label: 'City',
                                  value: _profileData!['city'].toString(),
                                ),
                            ],
                          ),

                          // About Section
                          if (_profileData!['about'] != null)
                            _buildInfoCard(
                              title: 'About',
                              icon: Icons.info_outline,
                              children: [
                                Text(
                                  _profileData!['about'].toString(),
                                  style: theme.textTheme.bodyMedium,
                                ),
                              ],
                            ),

                          // Social Media Links
                          if (_hasSocialMediaLinks())
                            _buildInfoCard(
                              title: 'Social Media',
                              icon: Icons.share,
                              children: [
                                _buildSocialMediaLinks(),
                              ],
                            ),

                          // Documents Section
                          _buildInfoCard(
                            title: 'Documents',
                            icon: Icons.description,
                            children: [
                              _buildImageCard(
                                'Profile Image',
                                _profileData!['profile_image'],
                                Icons.person,
                              ),
                              _buildImageCard(
                                'ID Card Front',
                                _profileData!['idcard_front'],
                                Icons.credit_card,
                              ),
                              _buildImageCard(
                                'ID Card Back',
                                _profileData!['idcard_back'],
                                Icons.credit_card,
                              ),
                              _buildImageCard(
                                'Residence Front',
                                _profileData!['residence_front'],
                                Icons.home,
                              ),
                              _buildImageCard(
                                'Residence Back',
                                _profileData!['residence_back'],
                                Icons.home,
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
    );
  }
}

