import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:convert';
import '../providers/theme_provider.dart';
import '../widgets/animated_background.dart';
import '../widgets/enhanced_button.dart';
import '../widgets/glass_card.dart';
import '../config/theme.dart';
import '../services/api_service.dart';
import 'login_screen.dart';

class SignupScreen extends StatefulWidget {
  const SignupScreen({super.key});

  @override
  State<SignupScreen> createState() => _SignupScreenState();
}

class _SignupScreenState extends State<SignupScreen> {
  final _formKey = GlobalKey<FormState>();
  final _usernameController = TextEditingController();
  final _emailController = TextEditingController();
  final _firstNameController = TextEditingController();
  final _lastNameController = TextEditingController();
  
  bool _isLoading = false;
  String _formError = '';
  Map<String, String> _fieldErrors = {};

  @override
  void dispose() {
    _usernameController.dispose();
    _emailController.dispose();
    _firstNameController.dispose();
    _lastNameController.dispose();
    super.dispose();
  }

  void _handleSubmit() async {
    if (_formKey.currentState!.validate()) {
      setState(() {
        _isLoading = true;
        _formError = '';
        _fieldErrors = {};
      });

      final payload = {
        'username': _usernameController.text.trim(),
        'email': _emailController.text.trim(),
        'first_name': _firstNameController.text.trim(),
        'last_name': _lastNameController.text.trim(),
        'user_type': 'institution',
      };

      try {
        final result = await ApiService.signup(payload);
        
        if (mounted) {
          final message = result['message'] ?? 
              'Account created successfully. Please check your email to continue.';
          
          // Store signup info for OTP screen
          final prefs = await SharedPreferences.getInstance();
          await prefs.setString('recentSignup', json.encode({
            'email': payload['email'],
            'username': payload['username'],
            'firstName': payload['first_name'],
            'lastName': payload['last_name'],
            'userType': payload['user_type'],
          }));

          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Row(
                children: [
                  const Icon(Icons.check_circle, color: Colors.white),
                  const SizedBox(width: 12),
                  Expanded(child: Text(message)),
                ],
              ),
              backgroundColor: AppTheme.teal500,
              behavior: SnackBarBehavior.floating,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
              duration: const Duration(seconds: 3),
            ),
          );

          // Clear form
          _usernameController.clear();
          _emailController.clear();
          _firstNameController.clear();
          _lastNameController.clear();

          // Navigate to login after short delay
          await Future.delayed(const Duration(milliseconds: 800));
          
          if (mounted) {
            Navigator.of(context).pushReplacement(
              MaterialPageRoute(
                builder: (context) => LoginScreen(
                  initialEmail: payload['email'],
                ),
              ),
            );
          }
        }
      } catch (e) {
        if (mounted) {
          setState(() {
            _isLoading = false;
            
            if (e is ApiException) {
              _formError = e.message;
              
              // Parse field-specific errors
              if (e.data?['errors'] != null) {
                final errors = e.data!['errors'] as Map<String, dynamic>;
                errors.forEach((key, value) {
                  if (value is List && value.isNotEmpty) {
                    _fieldErrors[key] = value.join(' ');
                  } else if (value is String) {
                    _fieldErrors[key] = value;
                  }
                });
              }
            } else {
              _formError = 'Unable to create the account right now. Please check your connection and try again.';
            }
          });

          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(_formError),
              backgroundColor: Colors.red.shade600,
              behavior: SnackBarBehavior.floating,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
          );
        }
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final themeProvider = Provider.of<ThemeProvider>(context);
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Scaffold(
      body: AnimatedBackground(
        child: SafeArea(
          child: Stack(
            children: [
              // Theme Toggle Button
              Positioned(
                top: 24,
                right: 24,
                child: Material(
                  color: isDark
                      ? AppTheme.navy800.withOpacity(0.8)
                      : Colors.white.withOpacity(0.8),
                  borderRadius: BorderRadius.circular(50),
                  elevation: 4,
                  child: InkWell(
                    onTap: () => themeProvider.toggleTheme(),
                    borderRadius: BorderRadius.circular(50),
                    child: Padding(
                      padding: const EdgeInsets.all(12),
                      child: Icon(
                        isDark ? Icons.wb_sunny : Icons.nightlight_round,
                        color: isDark ? AppTheme.gold500 : AppTheme.navy700,
                        size: 24,
                      ),
                    ),
                  ),
                ),
              ),

              // Main Content
              Center(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.all(16),
                  child: ConstrainedBox(
                    constraints: const BoxConstraints(maxWidth: 640),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        // Back Button
                        Align(
                          alignment: Alignment.centerLeft,
                          child: TextButton.icon(
                            onPressed: () => Navigator.pop(context),
                            icon: const Icon(Icons.arrow_back),
                            label: const Text('Back'),
                            style: TextButton.styleFrom(
                              foregroundColor: isDark
                                  ? AppTheme.teal400
                                  : AppTheme.primary600,
                            ),
                          ),
                        ),
                        
                        const SizedBox(height: 24),

                        // Logo and Title
                        TweenAnimationBuilder(
                          tween: Tween<double>(begin: 0, end: 1),
                          duration: const Duration(milliseconds: 600),
                          builder: (context, value, child) {
                            return Opacity(
                              opacity: value,
                              child: Transform.translate(
                                offset: Offset(0, 20 * (1 - value)),
                                child: child,
                              ),
                            );
                          },
                          child: Column(
                            children: [
                              Container(
                                width: 96,
                                height: 96,
                                decoration: BoxDecoration(
                                  borderRadius: BorderRadius.circular(24),
                                  gradient: const LinearGradient(
                                    colors: [AppTheme.primary600, AppTheme.teal500],
                                  ),
                                  boxShadow: [
                                    BoxShadow(
                                      color: AppTheme.primary500.withOpacity(0.3),
                                      blurRadius: 20,
                                      offset: const Offset(0, 10),
                                    ),
                                  ],
                                ),
                                child: const Center(
                                  child: Icon(
                                    Icons.business,
                                    color: Colors.white,
                                    size: 48,
                                  ),
                                ),
                              ),
                              const SizedBox(height: 24),
                              Text(
                                'Institution Sign Up',
                                style: theme.textTheme.displaySmall,
                              ),
                              const SizedBox(height: 8),
                              Padding(
                                padding: const EdgeInsets.symmetric(horizontal: 16),
                                child: Text(
                                  'Create your institution account to access the Project East dashboard and manage students, lecturers, and schedules in one place.',
                                  style: theme.textTheme.bodyMedium,
                                  textAlign: TextAlign.center,
                                ),
                              ),
                            ],
                          ),
                        ),

                        const SizedBox(height: 40),

                        // Signup Form Card
                        TweenAnimationBuilder(
                          tween: Tween<double>(begin: 0, end: 1),
                          duration: const Duration(milliseconds: 800),
                          builder: (context, value, child) {
                            return Opacity(
                              opacity: value,
                              child: Transform.translate(
                                offset: Offset(0, 30 * (1 - value)),
                                child: Transform.scale(
                                  scale: 0.9 + (0.1 * value),
                                  child: child,
                                ),
                              ),
                            );
                          },
                          child: GlassCard(
                            borderRadius: 20,
                            child: Form(
                              key: _formKey,
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  // First Name and Last Name
                                  Row(
                                    children: [
                                      Expanded(
                                        child: Column(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            Text(
                                              'First Name',
                                              style: theme.textTheme.bodyMedium?.copyWith(
                                                fontWeight: FontWeight.w600,
                                              ),
                                            ),
                                            const SizedBox(height: 8),
                                            TextFormField(
                                              controller: _firstNameController,
                                              decoration: const InputDecoration(
                                                hintText: 'Contact first name',
                                              ),
                                              onChanged: (value) {
                                                setState(() {
                                                  _fieldErrors.remove('first_name');
                                                  _formError = '';
                                                });
                                              },
                                              validator: (value) {
                                                if (value == null || value.trim().isEmpty) {
                                                  return 'First name is required';
                                                }
                                                return null;
                                              },
                                            ),
                                            if (_fieldErrors.containsKey('first_name'))
                                              Padding(
                                                padding: const EdgeInsets.only(top: 4),
                                                child: Text(
                                                  _fieldErrors['first_name']!,
                                                  style: TextStyle(
                                                    color: Colors.red.shade700,
                                                    fontSize: 12,
                                                  ),
                                                ),
                                              ),
                                          ],
                                        ),
                                      ),
                                      const SizedBox(width: 16),
                                      Expanded(
                                        child: Column(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            Text(
                                              'Last Name',
                                              style: theme.textTheme.bodyMedium?.copyWith(
                                                fontWeight: FontWeight.w600,
                                              ),
                                            ),
                                            const SizedBox(height: 8),
                                            TextFormField(
                                              controller: _lastNameController,
                                              decoration: const InputDecoration(
                                                hintText: 'Contact last name',
                                              ),
                                              onChanged: (value) {
                                                setState(() {
                                                  _fieldErrors.remove('last_name');
                                                  _formError = '';
                                                });
                                              },
                                              validator: (value) {
                                                if (value == null || value.trim().isEmpty) {
                                                  return 'Last name is required';
                                                }
                                                return null;
                                              },
                                            ),
                                            if (_fieldErrors.containsKey('last_name'))
                                              Padding(
                                                padding: const EdgeInsets.only(top: 4),
                                                child: Text(
                                                  _fieldErrors['last_name']!,
                                                  style: TextStyle(
                                                    color: Colors.red.shade700,
                                                    fontSize: 12,
                                                  ),
                                                ),
                                              ),
                                          ],
                                        ),
                                      ),
                                    ],
                                  ),
                                  
                                  const SizedBox(height: 20),

                                  // Username and Email
                                  Row(
                                    children: [
                                      Expanded(
                                        child: Column(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            Text(
                                              'Institution Username',
                                              style: theme.textTheme.bodyMedium?.copyWith(
                                                fontWeight: FontWeight.w600,
                                              ),
                                            ),
                                            const SizedBox(height: 8),
                                            TextFormField(
                                              controller: _usernameController,
                                              decoration: const InputDecoration(
                                                hintText: 'e.g. alnoor_institution',
                                              ),
                                              onChanged: (value) {
                                                setState(() {
                                                  _fieldErrors.remove('username');
                                                  _formError = '';
                                                });
                                              },
                                              validator: (value) {
                                                if (value == null || value.trim().isEmpty) {
                                                  return 'Username is required';
                                                }
                                                return null;
                                              },
                                            ),
                                            if (_fieldErrors.containsKey('username'))
                                              Padding(
                                                padding: const EdgeInsets.only(top: 4),
                                                child: Text(
                                                  _fieldErrors['username']!,
                                                  style: TextStyle(
                                                    color: Colors.red.shade700,
                                                    fontSize: 12,
                                                  ),
                                                ),
                                              ),
                                          ],
                                        ),
                                      ),
                                      const SizedBox(width: 16),
                                      Expanded(
                                        child: Column(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            Text(
                                              'Contact Email',
                                              style: theme.textTheme.bodyMedium?.copyWith(
                                                fontWeight: FontWeight.w600,
                                              ),
                                            ),
                                            const SizedBox(height: 8),
                                            TextFormField(
                                              controller: _emailController,
                                              decoration: const InputDecoration(
                                                hintText: 'name@institution.edu',
                                              ),
                                              keyboardType: TextInputType.emailAddress,
                                              onChanged: (value) {
                                                setState(() {
                                                  _fieldErrors.remove('email');
                                                  _formError = '';
                                                });
                                              },
                                              validator: (value) {
                                                if (value == null || value.trim().isEmpty) {
                                                  return 'Email is required';
                                                }
                                                if (!RegExp(r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$')
                                                    .hasMatch(value)) {
                                                  return 'Please enter a valid email';
                                                }
                                                return null;
                                              },
                                            ),
                                            if (_fieldErrors.containsKey('email'))
                                              Padding(
                                                padding: const EdgeInsets.only(top: 4),
                                                child: Text(
                                                  _fieldErrors['email']!,
                                                  style: TextStyle(
                                                    color: Colors.red.shade700,
                                                    fontSize: 12,
                                                  ),
                                                ),
                                              ),
                                          ],
                                        ),
                                      ),
                                    ],
                                  ),

                                  const SizedBox(height: 20),

                                  // Account Type Info
                                  Container(
                                    padding: const EdgeInsets.all(12),
                                    decoration: BoxDecoration(
                                      color: isDark
                                          ? Colors.blue.withOpacity(0.1)
                                          : Colors.blue.shade50,
                                      border: Border.all(
                                        color: isDark
                                            ? Colors.blue.shade800
                                            : Colors.blue.shade200,
                                      ),
                                      borderRadius: BorderRadius.circular(8),
                                    ),
                                    child: Row(
                                      children: [
                                        Icon(
                                          Icons.info_outline,
                                          color: isDark
                                              ? Colors.blue.shade400
                                              : Colors.blue.shade700,
                                          size: 20,
                                        ),
                                        const SizedBox(width: 8),
                                        Text(
                                          'Account type: Institution (auto-selected)',
                                          style: theme.textTheme.bodySmall?.copyWith(
                                            color: isDark
                                                ? Colors.blue.shade400
                                                : Colors.blue.shade700,
                                            fontWeight: FontWeight.w600,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),

                                  if (_formError.isNotEmpty) ...[
                                    const SizedBox(height: 16),
                                    Container(
                                      padding: const EdgeInsets.all(12),
                                      decoration: BoxDecoration(
                                        color: Colors.red.withOpacity(0.1),
                                        border: Border.all(color: Colors.red.shade300),
                                        borderRadius: BorderRadius.circular(8),
                                      ),
                                      child: Text(
                                        _formError,
                                        style: TextStyle(
                                          color: Colors.red.shade700,
                                          fontSize: 12,
                                        ),
                                      ),
                                    ),
                                  ],
                                  
                                  const SizedBox(height: 24),
                                  
                                  SizedBox(
                                    width: double.infinity,
                                    child: EnhancedButton(
                                      text: _isLoading ? 'Creating Account...' : 'Create Account',
                                      icon: Icons.check_circle,
                                      onPressed: _handleSubmit,
                                      isLoading: _isLoading,
                                    ),
                                  ),

                                  const SizedBox(height: 16),

                                  // Login link
                                  Center(
                                    child: Row(
                                      mainAxisAlignment: MainAxisAlignment.center,
                                      children: [
                                        Text(
                                          'Already have an account? ',
                                          style: theme.textTheme.bodySmall,
                                        ),
                                        TextButton(
                                          onPressed: () => Navigator.pushNamed(context, '/login'),
                                          style: TextButton.styleFrom(
                                            padding: EdgeInsets.zero,
                                            minimumSize: Size.zero,
                                            tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                                          ),
                                          child: Text(
                                            'Go to Login',
                                            style: TextStyle(
                                              color: isDark
                                                  ? AppTheme.teal400
                                                  : AppTheme.primary600,
                                              fontWeight: FontWeight.w600,
                                              fontSize: 12,
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
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}


