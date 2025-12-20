import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../config/theme.dart';
import '../providers/auth_provider.dart';
import '../providers/theme_provider.dart';
import '../providers/language_provider.dart';
import '../screens/dashboard/my_profile_screen.dart';
import '../screens/dashboard/edit_profile_page.dart';
import '../services/api_service.dart';

class ProfileButton extends StatefulWidget {
  const ProfileButton({super.key});

  @override
  State<ProfileButton> createState() => _ProfileButtonState();
}

class _ProfileButtonState extends State<ProfileButton> {
  String? _profileImageUrl;
  bool _isLoadingImage = false;
  String? _lastUserType;
  bool _hasAttemptedLoad = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadProfileImage();
    });
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (!mounted) return;
    
    try {
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      final userType = authProvider.instituteData['userType'];
      
      // Load image if:
      // 1. User type changed, OR
      // 2. Haven't attempted to load yet, OR
      // 3. Image URL is null and not currently loading
      if (_lastUserType != userType || 
          !_hasAttemptedLoad || 
          (_profileImageUrl == null && !_isLoadingImage && _lastUserType == userType)) {
        _lastUserType = userType;
        _hasAttemptedLoad = true;
        WidgetsBinding.instance.addPostFrameCallback((_) {
          if (mounted) {
            _loadProfileImage();
          }
        });
      }
    } catch (e) {
      // Silently handle any errors
    }
  }

  Future<void> _loadProfileImage() async {
    if (!mounted) return;
    
    try {
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      final instituteData = authProvider.instituteData;
      final userType = instituteData['userType'];
      final accessToken = instituteData['accessToken'];
      final refreshToken = instituteData['refreshToken'];

      // Only fetch for students, lecturers, and institutions
      if ((userType != 'student' && userType != 'lecturer' && userType != 'institution') || accessToken == null) {
        if (mounted) {
          setState(() {
            _isLoadingImage = false;
          });
        }
        return;
      }

      if (mounted) {
        setState(() {
          _isLoadingImage = true;
        });
      }

      Map<String, dynamic> response;
      if (userType == 'student') {
        response = await ApiService.getStudentMyProfile(
          accessToken: accessToken,
          refreshToken: refreshToken,
          onTokenRefreshed: (tokens) {
            if (mounted) {
              authProvider.onTokenRefreshed(tokens);
            }
          },
          onSessionExpired: () {
            if (mounted) {
              authProvider.onSessionExpired();
            }
          },
        );
      } else if (userType == 'lecturer') {
        response = await ApiService.getLecturerMyProfile(
          accessToken: accessToken,
          refreshToken: refreshToken,
          onTokenRefreshed: (tokens) {
            if (mounted) {
              authProvider.onTokenRefreshed(tokens);
            }
          },
          onSessionExpired: () {
            if (mounted) {
              authProvider.onSessionExpired();
            }
          },
        );
      } else if (userType == 'institution') {
        response = await ApiService.getInstitutionMyProfile(
          accessToken: accessToken,
          refreshToken: refreshToken,
          onTokenRefreshed: (tokens) {
            if (mounted) {
              authProvider.onTokenRefreshed(tokens);
            }
          },
          onSessionExpired: () {
            if (mounted) {
              authProvider.onSessionExpired();
            }
          },
        );
      } else {
        if (mounted) {
          setState(() {
            _isLoadingImage = false;
          });
        }
        return;
      }

      if (!mounted) return;

      // Extract profile_image from response - check both 'data' wrapper and direct
      // Also check 'logo' field for institutions
      dynamic profileImage;
      // Check if wrapped in 'data'
      if (response.containsKey('data') && response['data'] is Map) {
        final data = response['data'] as Map;
        profileImage = data['profile_image'] ?? data['logo'];
      } else {
        // Check direct in response
        profileImage = response['profile_image'] ?? response['logo'];
      }

      // Only care about the image - ignore everything else
      if (profileImage != null && profileImage.toString().trim().isNotEmpty) {
        final imagePath = profileImage.toString().trim();
        final imageUrl = _getImageUrl(imagePath);
        
        if (imageUrl.isNotEmpty && mounted) {
          setState(() {
            _profileImageUrl = imageUrl;
            _isLoadingImage = false;
          });
          return;
        }
      }
      
      // No image found or invalid
      if (mounted) {
        setState(() {
          _profileImageUrl = null;
          _isLoadingImage = false;
        });
      }
    } catch (e) {
      // Silently fail - profile image is optional
      if (mounted) {
        setState(() {
          _profileImageUrl = null;
          _isLoadingImage = false;
        });
      }
    }
  }

  String _getImageUrl(String imagePath) {
    if (imagePath.isEmpty) return '';
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

  Widget _buildAvatar() {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final instituteData = authProvider.instituteData;

    final displayName = instituteData['username'] ??
        instituteData['firstName'] ??
        instituteData['name'] ??
        '';
    final displayNameStr = displayName.toString().trim();
    final initial = displayNameStr.isNotEmpty 
        ? displayNameStr.substring(0, 1).toUpperCase()
        : 'U';

    // Show image if available and not loading
    if (_profileImageUrl != null && _profileImageUrl!.isNotEmpty && !_isLoadingImage) {
      return Container(
        width: 40,
        height: 40,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          border: Border.all(
            color: isDark ? AppTheme.navy600 : AppTheme.primary200,
            width: 2,
          ),
        ),
        child: ClipOval(
          child: Image.network(
            _profileImageUrl!,
            width: 36,
            height: 36,
            fit: BoxFit.cover,
            errorBuilder: (context, error, stackTrace) {
              // Fall back to initial on error and clear the image URL
              WidgetsBinding.instance.addPostFrameCallback((_) {
                if (mounted) {
                  setState(() {
                    _profileImageUrl = null;
                  });
                }
              });
              return Container(
                width: 36,
                height: 36,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: isDark ? AppTheme.navy700 : AppTheme.primary50,
                ),
                child: Center(
                  child: Text(
                    initial,
                    style: TextStyle(
                      color: isDark ? AppTheme.teal400 : AppTheme.primary600,
                      fontWeight: FontWeight.bold,
                      fontSize: 16,
                    ),
                  ),
                ),
              );
            },
            loadingBuilder: (context, child, loadingProgress) {
              if (loadingProgress == null) return child;
              return Container(
                width: 36,
                height: 36,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: isDark ? AppTheme.navy700 : AppTheme.primary50,
                ),
                child: const Center(
                  child: SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  ),
                ),
              );
            },
          ),
        ),
      );
    }

    // Default: show initial letter or loading
    return Container(
      width: 40,
      height: 40,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: isDark ? AppTheme.navy700 : AppTheme.primary50,
        border: Border.all(
          color: isDark ? AppTheme.navy600 : AppTheme.primary200,
          width: 2,
        ),
      ),
      child: _isLoadingImage
          ? const Center(
              child: SizedBox(
                width: 20,
                height: 20,
                child: CircularProgressIndicator(strokeWidth: 2),
              ),
            )
          : Center(
              child: Text(
                initial,
                style: TextStyle(
                  color: isDark ? AppTheme.teal400 : AppTheme.primary600,
                  fontWeight: FontWeight.bold,
                  fontSize: 16,
                ),
              ),
            ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final authProvider = Provider.of<AuthProvider>(context);
    final themeProvider = Provider.of<ThemeProvider>(context);
    final instituteData = authProvider.instituteData;
    final isAuthenticated = authProvider.isAuthenticated;

    final displayName = instituteData['username'] ??
        instituteData['firstName'] ??
        instituteData['name'] ??
        '';

    return PopupMenuButton<String>(
      offset: const Offset(0, 56),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
      ),
      child: _buildAvatar(),
      itemBuilder: (context) => [
        // User Info Header
        PopupMenuItem<String>(
          enabled: false,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              if (isAuthenticated) ...[
                Text(
                  displayName.toString(),
                  style: theme.textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
                if (instituteData['email'] != null) ...[
                  const SizedBox(height: 4),
                  Text(
                    instituteData['email'].toString(),
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: Colors.grey.shade600,
                    ),
                  ),
                ],
                if (instituteData['userType'] != null) ...[
                  const SizedBox(height: 4),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 8,
                      vertical: 4,
                    ),
                    decoration: BoxDecoration(
                      color: isDark
                          ? AppTheme.teal500.withOpacity(0.2)
                          : AppTheme.primary50,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      instituteData['userType'].toString().toUpperCase(),
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: isDark ? AppTheme.teal400 : AppTheme.primary600,
                        fontWeight: FontWeight.w600,
                        fontSize: 10,
                      ),
                    ),
                  ),
                ],
                // Verification Status Badge
                if (isAuthenticated) ...[
                  const SizedBox(height: 4),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 8,
                      vertical: 4,
                    ),
                    decoration: BoxDecoration(
                      color: (instituteData['isVerified'] == true)
                          ? Colors.green.withOpacity(isDark ? 0.3 : 0.2)
                          : Colors.orange.withOpacity(isDark ? 0.3 : 0.2),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          (instituteData['isVerified'] == true)
                              ? Icons.verified
                              : Icons.pending,
                          size: 12,
                          color: (instituteData['isVerified'] == true)
                              ? Colors.green.shade700
                              : Colors.orange.shade700,
                        ),
                        const SizedBox(width: 4),
                        Text(
                          (instituteData['isVerified'] == true)
                              ? 'Verified'
                              : 'Pending',
                          style: theme.textTheme.bodySmall?.copyWith(
                            color: (instituteData['isVerified'] == true)
                                ? Colors.green.shade700
                                : Colors.orange.shade700,
                            fontWeight: FontWeight.w600,
                            fontSize: 10,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ] else
                Text(
                  'Guest',
                  style: theme.textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
            ],
          ),
        ),
        const PopupMenuDivider(),
        // For guests: Show Sign Up and Login
        if (!isAuthenticated) ...[
          PopupMenuItem<String>(
            value: 'signup',
            child: Row(
              children: [
                const Icon(Icons.person_add_outlined, size: 20),
                const SizedBox(width: 12),
                Text(
                  'Sign Up',
                  style: theme.textTheme.bodyMedium,
                ),
              ],
            ),
          ),
          PopupMenuItem<String>(
            value: 'login',
            child: Row(
              children: [
                const Icon(Icons.login, size: 20),
                const SizedBox(width: 12),
                Text(
                  'Login',
                  style: theme.textTheme.bodyMedium,
                ),
              ],
            ),
          ),
        ] else ...[
          // For authenticated users: Show View Profile and Edit Profile/Verify
          PopupMenuItem<String>(
            value: 'profile',
            child: Row(
              children: [
                const Icon(Icons.person_outline, size: 20),
                const SizedBox(width: 12),
                Text(
                  'View Profile',
                  style: theme.textTheme.bodyMedium,
                ),
              ],
            ),
          ),
          // Show Verify for unverified users, Edit Profile for verified users
          if ((instituteData['userType'] == 'student' || instituteData['userType'] == 'lecturer' || instituteData['userType'] == 'institution') && instituteData['isVerified'] != true)
            PopupMenuItem<String>(
              value: 'verify',
              child: Row(
                children: [
                  Icon(Icons.verified_user_outlined, size: 20, color: Colors.orange),
                  const SizedBox(width: 12),
                  Text(
                    'Verify Account',
                    style: theme.textTheme.bodyMedium?.copyWith(
                      color: Colors.orange,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
            )
          else
            PopupMenuItem<String>(
              value: 'edit_profile',
              child: Row(
                children: [
                  const Icon(Icons.edit_outlined, size: 20),
                  const SizedBox(width: 12),
                  Text(
                    'Edit Profile',
                    style: theme.textTheme.bodyMedium,
                  ),
                ],
              ),
            ),
        ],
        const PopupMenuDivider(),
        // Theme Toggle
        PopupMenuItem<String>(
          value: 'theme',
          child: Row(
            children: [
              Icon(
                themeProvider.isDark ? Icons.wb_sunny : Icons.nightlight_round,
                size: 20,
                color: isDark ? AppTheme.teal400 : AppTheme.primary600,
              ),
              const SizedBox(width: 12),
              Text(
                themeProvider.isDark ? 'Light Mode' : 'Dark Mode',
                style: theme.textTheme.bodyMedium,
              ),
            ],
          ),
        ),
        // Language Switcher
        PopupMenuItem<String>(
          value: 'language',
          child: Consumer<LanguageProvider>(
            builder: (context, languageProvider, child) {
              final currentLang = languageProvider.languageCode;
              final languages = [
                {'code': 'en', 'name': 'English', 'flag': '🇬🇧'},
                {'code': 'ar', 'name': 'العربية', 'flag': '🇮🇶'},
              ];
              final currentLanguage = languages.firstWhere(
                (lang) => lang['code'] == currentLang,
                orElse: () => languages[0],
              );
              
              return Row(
                children: [
                  const Icon(Icons.language, size: 20),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      'Language',
                      style: theme.textTheme.bodyMedium,
                    ),
                  ),
                  Text(
                    '${currentLanguage['flag']} ${currentLanguage['name']}',
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: Colors.grey.shade600,
                    ),
                  ),
                ],
              );
            },
          ),
        ),
        if (isAuthenticated) ...[
          const PopupMenuDivider(),
          // Logout
          PopupMenuItem<String>(
            value: 'logout',
            child: Row(
              children: [
                const Icon(Icons.logout, size: 20, color: Colors.red),
                const SizedBox(width: 12),
                Text(
                  'Logout',
                  style: theme.textTheme.bodyMedium?.copyWith(
                    color: Colors.red,
                  ),
                ),
              ],
            ),
          ),
        ],
      ],
      onSelected: (value) {
        if (value == 'signup') {
          Navigator.pushNamed(context, '/account-type-selection');
        } else if (value == 'login') {
          Navigator.pushNamed(context, '/login');
        } else if (value == 'profile') {
          final userType = instituteData['userType'] ?? '';
          if (userType == 'institution') {
            Navigator.push(
              context,
              MaterialPageRoute(
                builder: (context) => const InstitutionMyProfileScreen(),
              ),
            );
          } else if (userType == 'lecturer') {
            Navigator.pushNamed(context, '/lecturer/my-profile');
          } else if (userType == 'student') {
            Navigator.pushNamed(context, '/student/my-profile');
          } else {
            Navigator.pushNamed(context, '/profile');
          }
        } else if (value == 'edit_profile') {
          final userType = instituteData['userType'] ?? '';
          if (userType == 'institution') {
            Navigator.push(
              context,
              MaterialPageRoute(
                builder: (context) => const EditProfilePage(),
              ),
            );
          } else if (userType == 'lecturer') {
            Navigator.pushNamed(context, '/lecturer/edit-profile/');
          } else if (userType == 'student') {
            Navigator.pushNamed(context, '/student/edit-profile/');
          }
        } else if (value == 'verify') {
          final userType = instituteData['userType'] ?? '';
          if (userType == 'student') {
            Navigator.pushNamed(context, '/student/verify');
          } else if (userType == 'lecturer') {
            Navigator.pushNamed(context, '/lecturer/verify');
          } else if (userType == 'institution') {
            Navigator.pushNamed(context, '/institution/verify');
          }
        } else if (value == 'theme') {
          themeProvider.toggleTheme();
        } else if (value == 'language') {
          _showLanguageDialog(context);
        } else if (value == 'logout') {
          _handleLogout(context, authProvider);
        }
      },
    );
  }

  void _showLanguageDialog(BuildContext context) {
    final languageProvider = Provider.of<LanguageProvider>(context, listen: false);
    final currentLang = languageProvider.languageCode;
    final languages = [
      {'code': 'en', 'name': 'English', 'flag': '🇬🇧'},
      {'code': 'ar', 'name': 'العربية', 'flag': '🇮🇶'},
    ];
    
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Select Language'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: languages.map((lang) {
            final isSelected = lang['code'] == currentLang;
            return ListTile(
              leading: Text(
                lang['flag'] as String,
                style: const TextStyle(fontSize: 24),
              ),
              title: Text(lang['name'] as String),
              trailing: isSelected
                  ? const Icon(Icons.check, color: AppTheme.primary600)
                  : null,
              onTap: () {
                languageProvider.setLanguage(lang['code'] as String);
                Navigator.pop(context);
              },
            );
          }).toList(),
        ),
      ),
    );
  }

  void _handleLogout(BuildContext context, AuthProvider authProvider) async {
    await authProvider.logout();
    if (context.mounted) {
      Navigator.pushNamedAndRemoveUntil(context, '/', (route) => false);
    }
  }
}

