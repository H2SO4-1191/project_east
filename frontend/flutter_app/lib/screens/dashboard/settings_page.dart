import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../providers/theme_provider.dart';
import '../../providers/auth_provider.dart';
import '../../config/theme.dart';
import '../../widgets/card_widget.dart';
import '../../services/api_service.dart';
import '../../widgets/modern_bottom_nav.dart';
import '../../utils/navigation_helper.dart';
import 'edit_profile_page.dart';

class SettingsPage extends StatefulWidget {
  const SettingsPage({super.key});

  @override
  State<SettingsPage> createState() => _SettingsPageState();
}

class _SettingsPageState extends State<SettingsPage> {
  String _selectedPlan = '3m';
  bool _isAddingPaymentMethod = false;
  bool _isSubscribing = false;

  Future<void> _handleAddPaymentMethod(AuthProvider authProvider) async {
    final accessToken = authProvider.instituteData['accessToken'] as String?;
    final refreshToken = authProvider.instituteData['refreshToken'] as String?;

    if (accessToken == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please log in first')),
      );
      return;
    }

    setState(() => _isAddingPaymentMethod = true);

    try {
      final result = await ApiService.addInstitutionPaymentMethod(
        accessToken: accessToken,
        refreshToken: refreshToken,
        onTokenRefreshed: (tokens) {
          authProvider.updateInstituteData({
            'accessToken': tokens['access'],
            'refreshToken': tokens['refresh'] ?? refreshToken,
          });
        },
        onSessionExpired: () {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Session expired. Please log in again.')),
          );
        },
      );

      if (result['success'] == true && result['url'] != null) {
        final url = Uri.parse(result['url']);
        if (await canLaunchUrl(url)) {
          await launchUrl(url, mode: LaunchMode.externalApplication);
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Redirecting to Stripe...')),
          );
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Could not open payment setup URL')),
          );
        }
      } else {
        throw Exception(result['message'] ?? 'Failed to get payment setup URL');
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error: ${e.toString()}')),
      );
    } finally {
      setState(() => _isAddingPaymentMethod = false);
    }
  }

  Future<void> _handleSubscribe(AuthProvider authProvider) async {
    final accessToken = authProvider.instituteData['accessToken'] as String?;
    final refreshToken = authProvider.instituteData['refreshToken'] as String?;

    if (accessToken == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please log in first')),
      );
      return;
    }

    setState(() => _isSubscribing = true);

    try {
      final result = await ApiService.subscribeInstitution(
        accessToken: accessToken,
        plan: _selectedPlan,
        refreshToken: refreshToken,
        onTokenRefreshed: (tokens) {
          authProvider.updateInstituteData({
            'accessToken': tokens['access'],
            'refreshToken': tokens['refresh'] ?? refreshToken,
          });
        },
        onSessionExpired: () {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Session expired. Please log in again.')),
          );
        },
      );

      if (result['success'] == true && result['checkout_url'] != null) {
        final url = Uri.parse(result['checkout_url']);
        if (await canLaunchUrl(url)) {
          await launchUrl(url, mode: LaunchMode.externalApplication);
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Redirecting to checkout...')),
          );
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Could not open checkout URL')),
          );
        }
      } else {
        throw Exception(result['message'] ?? 'Failed to get checkout URL');
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error: ${e.toString()}')),
      );
    } finally {
      setState(() => _isSubscribing = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final themeProvider = Provider.of<ThemeProvider>(context);
    final authProvider = Provider.of<AuthProvider>(context);
    final isVerified = authProvider.isVerified;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Settings'),
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
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Settings', style: theme.textTheme.displaySmall),
          const SizedBox(height: 4),
          Text('Manage your preferences', style: theme.textTheme.bodyMedium),
          const SizedBox(height: 24),
          
          // Verification Status Banner
          if (!isVerified)
            CardWidget(
              color: isDark ? Colors.amber.shade900.withOpacity(0.2) : Colors.amber.shade50,
              child: Row(
                children: [
                  Container(
                    width: 48,
                    height: 48,
                    decoration: BoxDecoration(
                      color: Colors.amber.shade100,
                      borderRadius: BorderRadius.circular(24),
                    ),
                    child: Icon(
                      Icons.warning_amber_rounded,
                      color: Colors.amber.shade700,
                      size: 24,
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Account Not Verified',
                          style: theme.textTheme.titleMedium?.copyWith(
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'Complete verification to access all features',
                          style: theme.textTheme.bodySmall,
                        ),
                      ],
                    ),
                  ),
                  ElevatedButton(
                    onPressed: () {
                      Navigator.pushNamed(context, '/institution/verify').then((_) {
                        // Refresh the page after verification
                        setState(() {});
                      });
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.teal500,
                      foregroundColor: Colors.white,
                    ),
                    child: const Text('Verify Now'),
                  ),
                ],
              ),
            ),
          
          if (isVerified)
            CardWidget(
              color: isDark ? Colors.green.shade900.withOpacity(0.2) : Colors.green.shade50,
              child: Row(
                children: [
                  Container(
                    width: 48,
                    height: 48,
                    decoration: BoxDecoration(
                      color: Colors.green.shade100,
                      borderRadius: BorderRadius.circular(24),
                    ),
                    child: Icon(
                      Icons.check_circle,
                      color: Colors.green.shade700,
                      size: 24,
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Account Verified',
                          style: theme.textTheme.titleMedium?.copyWith(
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'Your institution has been verified successfully',
                          style: theme.textTheme.bodySmall,
                        ),
                      ],
                    ),
                  ),
                  ElevatedButton(
                    onPressed: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (context) => const EditProfilePage(),
                        ),
                      );
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.primary600,
                      foregroundColor: Colors.white,
                    ),
                    child: const Text('Edit Profile'),
                  ),
                ],
              ),
            ),
          
          const SizedBox(height: 16),
          
          // Institute Information
          CardWidget(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      width: 48,
                      height: 48,
                      decoration: BoxDecoration(
                        gradient: const LinearGradient(
                          colors: [AppTheme.primary600, AppTheme.teal500],
                        ),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: const Icon(
                        Icons.school,
                        color: Colors.white,
                        size: 24,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            authProvider.instituteData['name'] ?? 'Institution',
                            style: theme.textTheme.titleLarge?.copyWith(
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          Text(
                            authProvider.instituteData['email'] ?? '',
                            style: theme.textTheme.bodyMedium,
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                if (!isVerified)
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: Colors.amber.shade50,
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: Colors.amber.shade300),
                    ),
                    child: Row(
                      children: [
                        Icon(Icons.info_outline, color: Colors.amber.shade700, size: 20),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            'You don\'t have a name of institution, verify your account.',
                            style: TextStyle(
                              color: Colors.amber.shade700,
                              fontStyle: FontStyle.italic,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                if (isVerified) ...[
                  _SettingRow(
                    label: 'Institute Name',
                    value: authProvider.instituteData['name'] ?? 'N/A',
                  ),
                  const SizedBox(height: 12),
                ],
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
          
          // Payment Method (only if verified)
          if (isVerified)
            CardWidget(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Icon(Icons.credit_card, color: AppTheme.primary600),
                    const SizedBox(width: 12),
                    Text(
                      'Payment Method',
                      style: theme.textTheme.titleLarge,
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                Text(
                  'Add a payment method to receive payments',
                  style: theme.textTheme.bodyMedium,
                ),
                const SizedBox(height: 16),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton.icon(
                    onPressed: _isAddingPaymentMethod
                        ? null
                        : () => _handleAddPaymentMethod(authProvider),
                    icon: _isAddingPaymentMethod
                        ? const SizedBox(
                            width: 16,
                            height: 16,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          )
                        : const Icon(Icons.credit_card),
                    label: Text(_isAddingPaymentMethod ? 'Setting up...' : 'Add Payment Method'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.teal500,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 12),
                    ),
                  ),
                ),
              ],
            ),
          ),
          
          if (isVerified) const SizedBox(height: 16),
          
          // Subscription (only if verified)
          if (isVerified)
            CardWidget(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Icon(Icons.workspace_premium, color: AppTheme.primary600),
                    const SizedBox(width: 12),
                    Text(
                      'Subscription',
                      style: theme.textTheme.titleLarge,
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                Text(
                  'Choose your subscription plan',
                  style: theme.textTheme.bodyMedium,
                ),
                const SizedBox(height: 16),
                DropdownButtonFormField<String>(
                  value: _selectedPlan,
                  decoration: InputDecoration(
                    labelText: 'Select Plan',
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                  ),
                  items: const [
                    DropdownMenuItem(value: '3m', child: Text('3 Months')),
                    DropdownMenuItem(value: '6m', child: Text('6 Months')),
                    DropdownMenuItem(value: '12m', child: Text('12 Months')),
                  ],
                  onChanged: (value) {
                    if (value != null) {
                      setState(() => _selectedPlan = value);
                    }
                  },
                ),
                const SizedBox(height: 16),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton.icon(
                    onPressed: _isSubscribing
                        ? null
                        : () => _handleSubscribe(authProvider),
                    icon: _isSubscribing
                        ? const SizedBox(
                            width: 16,
                            height: 16,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          )
                        : const Icon(Icons.workspace_premium),
                    label: Text(_isSubscribing ? 'Processing...' : 'Subscribe'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.primary600,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 12),
                    ),
                  ),
                ),
              ],
            ),
          ),
          
          if (isVerified) const SizedBox(height: 16),
          
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

