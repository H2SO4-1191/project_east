import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../config/theme.dart';
import '../providers/auth_provider.dart';
import '../providers/theme_provider.dart';
import '../providers/language_provider.dart';
import '../screens/dashboard/my_profile_screen.dart';
import '../screens/dashboard/edit_profile_page.dart';

class ProfileButton extends StatelessWidget {
  const ProfileButton({super.key});

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
    final displayNameStr = displayName.toString().trim();
    final initial = displayNameStr.isNotEmpty 
        ? displayNameStr.substring(0, 1).toUpperCase()
        : 'U';

    return PopupMenuButton<String>(
      offset: const Offset(0, 56),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
      ),
      child: Container(
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
      ),
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
        // View Profile
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
        // Edit Profile (for authenticated users)
        if (isAuthenticated) ...[
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
        if (value == 'profile') {
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
            Navigator.pushNamed(context, '/lecturer/edit-profile');
          } else if (userType == 'student') {
            Navigator.pushNamed(context, '/student/edit-profile');
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

