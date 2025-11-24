import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/theme_provider.dart';
import '../../providers/auth_provider.dart';
import '../../config/theme.dart';
import '../../widgets/card_widget.dart';

class SettingsPage extends StatelessWidget {
  const SettingsPage({super.key});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final themeProvider = Provider.of<ThemeProvider>(context);
    final authProvider = Provider.of<AuthProvider>(context);

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Settings', style: theme.textTheme.displaySmall),
          const SizedBox(height: 4),
          Text('Manage your preferences', style: theme.textTheme.bodyMedium),
          const SizedBox(height: 24),
          
          // Institute Information
          CardWidget(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Institute Information',
                  style: theme.textTheme.titleLarge,
                ),
                const SizedBox(height: 16),
                _SettingRow(
                  label: 'Institute Name',
                  value: authProvider.instituteData['name'] ?? 'N/A',
                ),
                const SizedBox(height: 12),
                _SettingRow(
                  label: 'Email',
                  value: authProvider.instituteData['email'] ?? 'N/A',
                ),
                const SizedBox(height: 12),
                _SettingRow(
                  label: 'Subscription',
                  value: authProvider.instituteData['subscriptionLabel'] ?? 'N/A',
                ),
              ],
            ),
          ),
          
          const SizedBox(height: 16),
          
          // Appearance
          CardWidget(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Appearance',
                  style: theme.textTheme.titleLarge,
                ),
                const SizedBox(height: 16),
                SwitchListTile(
                  value: isDark,
                  onChanged: (value) => themeProvider.toggleTheme(),
                  title: const Text('Dark Mode'),
                  subtitle: const Text('Enable dark theme'),
                  contentPadding: EdgeInsets.zero,
                  activeColor: AppTheme.teal500,
                ),
              ],
            ),
          ),
          
          const SizedBox(height: 16),
          
          // About
          CardWidget(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'About',
                  style: theme.textTheme.titleLarge,
                ),
                const SizedBox(height: 16),
                _SettingRow(
                  label: 'Version',
                  value: '1.0.0',
                ),
                const SizedBox(height: 12),
                _SettingRow(
                  label: 'Build',
                  value: '100',
                ),
              ],
            ),
          ),
          
          const SizedBox(height: 24),
          
          // Danger Zone
          CardWidget(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Danger Zone',
                  style: theme.textTheme.titleLarge?.copyWith(
                    color: Colors.red,
                  ),
                ),
                const SizedBox(height: 16),
                SizedBox(
                  width: double.infinity,
                  child: OutlinedButton.icon(
                    onPressed: () {
                      showDialog(
                        context: context,
                        builder: (context) => AlertDialog(
                          title: const Text('Clear All Data'),
                          content: const Text(
                            'This will delete all your data. This action cannot be undone.',
                          ),
                          actions: [
                            TextButton(
                              onPressed: () => Navigator.pop(context),
                              child: const Text('Cancel'),
                            ),
                            TextButton(
                              onPressed: () {
                                authProvider.clearData();
                                Navigator.pop(context);
                                ScaffoldMessenger.of(context).showSnackBar(
                                  const SnackBar(
                                    content: Text('All data cleared'),
                                  ),
                                );
                              },
                              child: const Text(
                                'Clear Data',
                                style: TextStyle(color: Colors.red),
                              ),
                            ),
                          ],
                        ),
                      );
                    },
                    icon: const Icon(Icons.delete_forever, color: Colors.red),
                    label: const Text(
                      'Clear All Data',
                      style: TextStyle(color: Colors.red),
                    ),
                    style: OutlinedButton.styleFrom(
                      side: const BorderSide(color: Colors.red),
                    ),
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

class _SettingRow extends StatelessWidget {
  final String label;
  final String value;

  const _SettingRow({
    required this.label,
    required this.value,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: theme.textTheme.bodyMedium?.copyWith(
            color: Colors.grey.shade600,
          ),
        ),
        Text(
          value,
          style: theme.textTheme.bodyMedium?.copyWith(
            fontWeight: FontWeight.w600,
          ),
        ),
      ],
    );
  }
}

