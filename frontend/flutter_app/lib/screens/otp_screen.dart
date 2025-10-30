import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../providers/theme_provider.dart';
import '../providers/institute_provider.dart';
import '../widgets/animated_background.dart';
import '../widgets/enhanced_button.dart';
import '../config/theme.dart';
import '../utils/page_transitions.dart';
import 'dashboard/dashboard_screen.dart';

class OTPScreen extends StatefulWidget {
  final String? email;
  
  const OTPScreen({super.key, this.email});

  @override
  State<OTPScreen> createState() => _OTPScreenState();
}

class _OTPScreenState extends State<OTPScreen> {
  final List<TextEditingController> _controllers = List.generate(
    6,
    (index) => TextEditingController(),
  );
  final List<FocusNode> _focusNodes = List.generate(
    6,
    (index) => FocusNode(),
  );
  bool _isLoading = false;
  String _error = '';
  String? _email;

  @override
  void initState() {
    super.initState();
    _email = widget.email;
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _focusNodes[0].requestFocus();
    });
  }

  @override
  void dispose() {
    for (var controller in _controllers) {
      controller.dispose();
    }
    for (var node in _focusNodes) {
      node.dispose();
    }
    super.dispose();
  }

  String _getOTPCode() {
    return _controllers.map((c) => c.text).join();
  }

  void _handleSubmit() async {
    final otpCode = _getOTPCode();

    if (otpCode.length != 6) {
      setState(() {
        _error = 'Please enter all 6 digits';
      });
      return;
    }

    setState(() {
      _isLoading = true;
      _error = '';
    });

    // Simulate API call
    await Future.delayed(const Duration(seconds: 1));

    if (mounted) {
      if (otpCode == '200471') {
        // Success
        final instituteProvider = Provider.of<InstituteProvider>(context, listen: false);
        
        instituteProvider.updateInstituteData({
          'name': 'Al-Noor Educational Institute',
          'email': _email ?? 'info@alnoor.edu',
        });

        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Row(
              children: [
                const Icon(Icons.check_circle, color: Colors.white),
                const SizedBox(width: 12),
                const Expanded(
                  child: Text('Verification successful! Welcome back!'),
                ),
              ],
            ),
            backgroundColor: AppTheme.teal500,
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
            ),
          ),
        );

        await Future.delayed(const Duration(milliseconds: 500));
        
        if (mounted) {
          Navigator.of(context).pushReplacement(
            ScaleSlideTransition(page: const DashboardScreen()),
          );
        }
      } else {
        setState(() {
          _error = 'Invalid verification code. Please try again.';
          _isLoading = false;
        });
        
        // Clear OTP inputs
        for (var controller in _controllers) {
          controller.clear();
        }
        _focusNodes[0].requestFocus();
      }
    }
  }

  void _handleResendCode() {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Verification code resent to your email!'),
        backgroundColor: AppTheme.teal500,
      ),
    );
    
    for (var controller in _controllers) {
      controller.clear();
    }
    _focusNodes[0].requestFocus();
    setState(() {
      _error = '';
    });
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
                    constraints: const BoxConstraints(maxWidth: 480),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        // Back Button
                        Align(
                          alignment: Alignment.centerLeft,
                          child: TextButton.icon(
                            onPressed: () => Navigator.pop(context),
                            icon: const Icon(Icons.arrow_back),
                            label: const Text('Back to Login'),
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
                                    colors: [AppTheme.teal600, AppTheme.teal500],
                                  ),
                                  boxShadow: [
                                    BoxShadow(
                                      color: AppTheme.teal500.withOpacity(0.3),
                                      blurRadius: 20,
                                      offset: const Offset(0, 10),
                                    ),
                                  ],
                                ),
                                child: const Center(
                                  child: Icon(
                                    Icons.shield,
                                    color: Colors.white,
                                    size: 48,
                                  ),
                                ),
                              ),
                              const SizedBox(height: 24),
                              Text(
                                'Verify Your Email',
                                style: theme.textTheme.displaySmall,
                              ),
                              const SizedBox(height: 8),
                              Text(
                                'Enter the 6-digit code sent to',
                                style: theme.textTheme.bodyMedium,
                                textAlign: TextAlign.center,
                              ),
                              const SizedBox(height: 4),
                              Text(
                                _email ?? '',
                                style: theme.textTheme.bodyMedium?.copyWith(
                                  color: isDark
                                      ? AppTheme.teal400
                                      : AppTheme.primary600,
                                  fontWeight: FontWeight.w600,
                                ),
                                textAlign: TextAlign.center,
                              ),
                            ],
                          ),
                        ),

                        const SizedBox(height: 48),

                        // OTP Form Card
                        TweenAnimationBuilder(
                          tween: Tween<double>(begin: 0, end: 1),
                          duration: const Duration(milliseconds: 800),
                          builder: (context, value, child) {
                            return Opacity(
                              opacity: value,
                              child: Transform.translate(
                                offset: Offset(0, 20 * (1 - value)),
                                child: child,
                              ),
                            );
                          },
                          child: Container(
                            padding: const EdgeInsets.all(20),
                            decoration: BoxDecoration(
                              color: isDark
                                  ? const Color(0xFF243B53).withOpacity(0.8)
                                  : Colors.white.withOpacity(0.8),
                              borderRadius: BorderRadius.circular(20),
                              border: Border.all(
                                color: isDark
                                    ? Colors.white.withOpacity(0.1)
                                    : Colors.white.withOpacity(0.3),
                                width: 1.5,
                              ),
                              boxShadow: [
                                BoxShadow(
                                  color: isDark
                                      ? Colors.black.withOpacity(0.2)
                                      : Colors.black.withOpacity(0.08),
                                  blurRadius: 10,
                                  offset: const Offset(0, 4),
                                ),
                              ],
                            ),
                            child: Column(
                              children: [
                                Text(
                                  'Verification Code',
                                  style: theme.textTheme.bodyMedium?.copyWith(
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                                const SizedBox(height: 24),
                                
                                // OTP Input Fields
                                Padding(
                                  padding: const EdgeInsets.symmetric(horizontal: 8),
                                  child: Row(
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    children: List.generate(6, (index) {
                                      return Flexible(
                                        child: Container(
                                          constraints: const BoxConstraints(
                                            maxWidth: 52,
                                            minWidth: 40,
                                          ),
                                          height: 56,
                                          margin: const EdgeInsets.symmetric(horizontal: 4),
                                          child: TextField(
                                            controller: _controllers[index],
                                            focusNode: _focusNodes[index],
                                            textAlign: TextAlign.center,
                                            keyboardType: TextInputType.number,
                                            maxLength: 1,
                                            style: const TextStyle(
                                              fontSize: 24,
                                              fontWeight: FontWeight.bold,
                                            ),
                                            decoration: InputDecoration(
                                              counterText: '',
                                              contentPadding: EdgeInsets.zero,
                                              border: OutlineInputBorder(
                                                borderRadius: BorderRadius.circular(12),
                                                borderSide: BorderSide(
                                                  color: isDark
                                                      ? AppTheme.navy600
                                                      : Colors.grey.shade300,
                                                  width: 2,
                                                ),
                                              ),
                                              focusedBorder: OutlineInputBorder(
                                                borderRadius: BorderRadius.circular(12),
                                                borderSide: const BorderSide(
                                                  color: AppTheme.teal500,
                                                  width: 2,
                                                ),
                                              ),
                                              enabledBorder: OutlineInputBorder(
                                                borderRadius: BorderRadius.circular(12),
                                                borderSide: BorderSide(
                                                  color: isDark
                                                      ? AppTheme.navy600
                                                      : Colors.grey.shade300,
                                                  width: 2,
                                                ),
                                              ),
                                            ),
                                            inputFormatters: [
                                              FilteringTextInputFormatter.digitsOnly,
                                            ],
                                            onChanged: (value) {
                                              if (value.isNotEmpty && index < 5) {
                                                _focusNodes[index + 1].requestFocus();
                                              } else if (value.isEmpty && index > 0) {
                                                _focusNodes[index - 1].requestFocus();
                                              }
                                              setState(() {
                                                _error = '';
                                              });
                                            },
                                          ),
                                        ),
                                      );
                                    }),
                                  ),
                                ),
                                
                                if (_error.isNotEmpty) ...[
                                  const SizedBox(height: 16),
                                  Container(
                                    padding: const EdgeInsets.all(12),
                                    decoration: BoxDecoration(
                                      color: Colors.red.withOpacity(0.1),
                                      border: Border.all(color: Colors.red.shade300),
                                      borderRadius: BorderRadius.circular(8),
                                    ),
                                    child: Text(
                                      _error,
                                      style: TextStyle(
                                        color: Colors.red.shade700,
                                        fontSize: 12,
                                      ),
                                      textAlign: TextAlign.center,
                                    ),
                                  ),
                                ],
                                
                                const SizedBox(height: 24),
                                
                                // Demo Code Info
                                Container(
                                  padding: const EdgeInsets.all(12),
                                  decoration: BoxDecoration(
                                    color: isDark
                                        ? AppTheme.primary900.withOpacity(0.2)
                                        : AppTheme.primary50,
                                    border: Border.all(
                                      color: isDark
                                          ? AppTheme.primary800
                                          : AppTheme.primary200,
                                    ),
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                  child: Row(
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    children: [
                                      Text(
                                        'Demo Code: ',
                                        style: theme.textTheme.bodySmall?.copyWith(
                                          fontWeight: FontWeight.bold,
                                          color: isDark
                                              ? AppTheme.primary400
                                              : AppTheme.primary700,
                                        ),
                                      ),
                                      Text(
                                        '200471',
                                        style: theme.textTheme.bodySmall?.copyWith(
                                          color: isDark
                                              ? AppTheme.primary400
                                              : AppTheme.primary700,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                                
                                const SizedBox(height: 24),
                                
                                SizedBox(
                                  width: double.infinity,
                                  child: EnhancedButton(
                                    text: _isLoading ? 'Verifying...' : 'Verify Code',
                                    icon: Icons.verified_user,
                                    onPressed: _handleSubmit,
                                    isLoading: _isLoading,
                                  ),
                                ),
                                
                                const SizedBox(height: 24),
                                
                                // Resend Code
                                Column(
                                  children: [
                                    Text(
                                      "Didn't receive the code?",
                                      style: theme.textTheme.bodySmall,
                                    ),
                                    const SizedBox(height: 8),
                                    TextButton(
                                      onPressed: _handleResendCode,
                                      child: Text(
                                        'Resend Code',
                                        style: TextStyle(
                                          color: isDark
                                              ? AppTheme.teal400
                                              : AppTheme.primary600,
                                          fontWeight: FontWeight.w600,
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              ],
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

