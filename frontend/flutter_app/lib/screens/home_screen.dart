import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/theme_provider.dart';
import '../widgets/animated_background.dart';
import '../widgets/enhanced_button.dart';
import '../widgets/glass_card.dart';
import '../config/theme.dart';
import '../utils/page_transitions.dart';
import 'login_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  bool _showSignInOptions = false;
  bool _showRegistrationForm = false;
  final _formKey = GlobalKey<FormState>();
  
  final _instituteNameController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();

  @override
  void dispose() {
    _instituteNameController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  void _handleBack() {
    setState(() {
      _showSignInOptions = false;
      _showRegistrationForm = false;
    });
  }

  void _handleRegistrationSubmit() {
    if (_formKey.currentState!.validate()) {
      // Navigate to signup screen instead
      Navigator.pushNamed(context, '/signup');
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
              // Main Content
              Center(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.all(16),
                  child: ConstrainedBox(
                    constraints: const BoxConstraints(maxWidth: 600),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
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
                                  child: Text(
                                    'PE',
                                    style: TextStyle(
                                      fontSize: 48,
                                      fontWeight: FontWeight.bold,
                                      color: Colors.white,
                                    ),
                                  ),
                                ),
                              ),
                              const SizedBox(height: 24),
                              ShaderMask(
                                shaderCallback: (bounds) => LinearGradient(
                                  colors: isDark
                                      ? [AppTheme.primary400, AppTheme.teal400]
                                      : [AppTheme.primary600, AppTheme.teal600],
                                ).createShader(bounds),
                                child: const Text(
                                  'Project East',
                                  style: TextStyle(
                                    fontSize: 40,
                                    fontWeight: FontWeight.bold,
                                    color: Colors.white,
                                  ),
                                ),
                              ),
                              const SizedBox(height: 12),
                              Text(
                                'Educational Institute Management System',
                                style: theme.textTheme.bodyLarge,
                                textAlign: TextAlign.center,
                              ),
                            ],
                          ),
                        ),
                        
                        const SizedBox(height: 48),
                        
          // Main Content Card
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
              child: _buildContent(theme, isDark),
            ),
          ),
                        
                        const SizedBox(height: 24),
                        
                        Text(
                          '© 2025 Project East. All rights reserved.',
                          style: theme.textTheme.bodySmall,
                        ),
                      ],
                    ),
                  ),
                ),
              ),
              
              // Theme Toggle Button (on top)
              Positioned(
                top: 24,
                right: 24,
                child: Material(
                  color: isDark
                      ? AppTheme.navy800.withOpacity(0.8)
                      : Colors.white.withOpacity(0.8),
                  borderRadius: BorderRadius.circular(50),
                  elevation: 8,
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
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildContent(ThemeData theme, bool isDark) {
    if (!_showSignInOptions && !_showRegistrationForm) {
      return _buildMainButtons(theme);
    } else if (_showSignInOptions && !_showRegistrationForm) {
      return _buildAccountTypeSelection(theme, isDark);
    } else {
      return _buildRegistrationForm(theme, isDark);
    }
  }

  Widget _buildMainButtons(ThemeData theme) {
    return Column(
      children: [
        Text(
          'Welcome Back',
          style: theme.textTheme.displaySmall,
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: 32),
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
          child: SizedBox(
            width: double.infinity,
            child: EnhancedButton(
              text: 'Login',
              icon: Icons.login,
              onPressed: () {
                Navigator.of(context).push(
                  SmoothPageRoute(page: const LoginScreen()),
                );
              },
            ),
          ),
        ),
        const SizedBox(height: 16),
        TweenAnimationBuilder(
          tween: Tween<double>(begin: 0, end: 1),
          duration: const Duration(milliseconds: 700),
          builder: (context, value, child) {
            return Opacity(
              opacity: value,
              child: Transform.translate(
                offset: Offset(0, 20 * (1 - value)),
                child: child,
              ),
            );
          },
          child: SizedBox(
            width: double.infinity,
            child: EnhancedButton(
              text: 'Sign In',
              icon: Icons.person_add,
              isPrimary: false,
              onPressed: () {
                setState(() {
                  _showSignInOptions = true;
                });
              },
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildAccountTypeSelection(ThemeData theme, bool isDark) {
    final accountTypes = [
      {
        'id': 'student',
        'title': 'Student',
        'description': 'Access courses, grades, and schedule',
        'icon': Icons.school,
        'colors': [AppTheme.primary500, AppTheme.primary600],
        'disabled': true,
      },
      {
        'id': 'teacher',
        'title': 'Teacher',
        'description': 'Manage classes, students, and assignments',
        'icon': Icons.person,
        'colors': [AppTheme.teal500, AppTheme.teal600],
        'disabled': true,
      },
      {
        'id': 'institution',
        'title': 'Institution',
        'description': 'Complete institute management system',
        'icon': Icons.business,
        'colors': [AppTheme.primary500, AppTheme.primary600],
        'disabled': false,
      },
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            IconButton(
              icon: const Icon(Icons.arrow_back),
              onPressed: _handleBack,
            ),
            const SizedBox(width: 8),
            Text(
              'Select Account Type',
              style: theme.textTheme.titleLarge,
            ),
          ],
        ),
        const SizedBox(height: 24),
        ...accountTypes.map((type) {
          return Padding(
            padding: const EdgeInsets.only(bottom: 16),
            child: _buildAccountTypeCard(type, theme, isDark),
          );
        }),
      ],
    );
  }

  Widget _buildAccountTypeCard(Map<String, dynamic> type, ThemeData theme, bool isDark) {
    final isDisabled = type['disabled'] as bool;
    
    return Material(
      color: isDisabled
          ? (isDark ? AppTheme.navy900.withOpacity(0.5) : Colors.grey.shade100)
          : (isDark ? AppTheme.navy800 : Colors.white),
      borderRadius: BorderRadius.circular(12),
      child: InkWell(
        onTap: isDisabled
            ? null
            : () {
                if (type['id'] == 'institution') {
                  setState(() {
                    _showRegistrationForm = true;
                  });
                }
              },
        borderRadius: BorderRadius.circular(12),
        child: Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            border: Border.all(
              color: isDisabled
                  ? (isDark ? AppTheme.navy700 : Colors.grey.shade300)
                  : (isDark ? AppTheme.navy700 : Colors.grey.shade300),
            ),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Stack(
            children: [
              Row(
                children: [
                  Container(
                    width: 64,
                    height: 64,
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(12),
                      gradient: LinearGradient(
                        colors: type['colors'] as List<Color>,
                      ),
                    ),
                    child: Icon(
                      type['icon'] as IconData,
                      color: Colors.white,
                      size: 32,
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          type['title'] as String,
                          style: theme.textTheme.titleMedium?.copyWith(
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          type['description'] as String,
                          style: theme.textTheme.bodySmall,
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              if (isDisabled)
                Positioned(
                  top: 0,
                  right: 0,
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 8,
                      vertical: 4,
                    ),
                    decoration: BoxDecoration(
                      color: Colors.grey.shade500,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Text(
                      'Coming Soon',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 10,
                        fontWeight: FontWeight.bold,
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

  Widget _buildRegistrationForm(ThemeData theme, bool isDark) {
    return Form(
      key: _formKey,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              IconButton(
                icon: const Icon(Icons.arrow_back),
                onPressed: _handleBack,
              ),
              const SizedBox(width: 8),
              Text(
                'Institution Registration',
                style: theme.textTheme.titleLarge,
              ),
            ],
          ),
          const SizedBox(height: 24),
          Text(
            'Institute Name *',
            style: theme.textTheme.bodyMedium?.copyWith(
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 8),
          TextFormField(
            controller: _instituteNameController,
            decoration: const InputDecoration(
              hintText: 'Enter institute name',
            ),
            validator: (value) {
              if (value == null || value.trim().isEmpty) {
                return 'Institute name is required';
              }
              return null;
            },
          ),
          const SizedBox(height: 16),
          Text(
            'Email *',
            style: theme.textTheme.bodyMedium?.copyWith(
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 8),
          TextFormField(
            controller: _emailController,
            decoration: const InputDecoration(
              hintText: 'Enter email address',
            ),
            keyboardType: TextInputType.emailAddress,
            validator: (value) {
              if (value == null || value.trim().isEmpty) {
                return 'Email is required';
              }
              if (!RegExp(r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$').hasMatch(value)) {
                return 'Email is invalid';
              }
              return null;
            },
          ),
          const SizedBox(height: 16),
          Text(
            'Password *',
            style: theme.textTheme.bodyMedium?.copyWith(
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 8),
          TextFormField(
            controller: _passwordController,
            decoration: const InputDecoration(
              hintText: 'Enter password',
            ),
            obscureText: true,
            validator: (value) {
              if (value == null || value.trim().isEmpty) {
                return 'Password is required';
              }
              if (value.length < 6) {
                return 'Password must be at least 6 characters';
              }
              return null;
            },
          ),
          const SizedBox(height: 24),
          SizedBox(
            width: double.infinity,
            child: EnhancedButton(
              text: 'Continue to Payment',
              icon: Icons.arrow_forward,
              onPressed: _handleRegistrationSubmit,
            ),
          ),
        ],
      ),
    );
  }
}

