import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:convert';
import '../providers/auth_provider.dart';
import '../widgets/animated_background.dart';
import '../widgets/enhanced_button.dart';
import '../config/theme.dart';
import '../utils/page_transitions.dart';
import '../services/api_service.dart';
import '../models/auth_response.dart';
import '../widgets/main_navigation_wrapper.dart';

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
  bool _isResending = false;
  String _error = '';
  String? _email;
  Map<String, dynamic>? _recentSignup;

  @override
  void initState() {
    super.initState();
    _email = widget.email;
    _loadRecentSignup();
    
    WidgetsBinding.instance.addPostFrameCallback((_) {
      // Redirect if already authenticated
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      if (authProvider.isAuthenticated) {
        Navigator.pushNamedAndRemoveUntil(context, '/', (route) => false);
        return;
      }
      
      if (_email == null || _email!.isEmpty) {
        Navigator.of(context).pushReplacementNamed('/login');
      } else {
        _focusNodes[0].requestFocus();
      }
    });
  }

  Future<void> _loadRecentSignup() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final stored = prefs.getString('recentSignup');
      if (stored != null) {
        _recentSignup = json.decode(stored);
      }
    } catch (e) {
      print('Failed to load recent signup: $e');
    }
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

    try {
      final result = await ApiService.verifyOtp(
        email: _email!,
        otpCode: otpCode,
      );

      if (mounted) {
        final authProvider = Provider.of<AuthProvider>(context, listen: false);
        
        // Decode JWT payload
        final payload = JwtPayload.decode(result['access']);
        final resolvedEmail = payload?.email ?? _email!;
        final usernameFromEmail = resolvedEmail.split('@')[0];
        
        final firstName = payload?.firstName ?? 
            _recentSignup?['firstName'] ?? 
            usernameFromEmail;
        final lastName = payload?.lastName ?? 
            _recentSignup?['lastName'] ?? 
            '';
        final username = payload?.username ?? 
            _recentSignup?['username'] ?? 
            usernameFromEmail;
        final nameParts = [firstName, lastName].where((s) => s.isNotEmpty).toList();
        final displayName = payload?.fullName ?? 
            payload?.name ?? 
            (nameParts.isNotEmpty ? nameParts.join(' ') : username);

        // Extract tokens
        final accessToken = result['access'];
        final refreshToken = result['refresh'];

        // Check verification status
        bool isVerified = false;
        if (accessToken != null) {
          try {
            final verificationStatus = await ApiService.checkVerificationStatus(
              resolvedEmail,
              accessToken: accessToken,
              refreshToken: refreshToken,
              onTokenRefreshed: (tokens) {
                // Token refreshed, but we're already setting it below
              },
              onSessionExpired: () {
                // Session expired during verification check
              },
            );
            isVerified = verificationStatus['is_verified'] ?? false;
          } catch (e) {
            print('Failed to check verification status: $e');
          }
        }

        // Get user type
        final userType = result['user_type'] ?? _recentSignup?['userType'] ?? 'institution';

        // Update auth provider with all data
        await authProvider.updateInstituteData({
          'name': displayName,
          'email': resolvedEmail,
          'username': username,
          'firstName': firstName,
          'lastName': lastName,
          'userId': result['user_id'],
          'userType': userType,
          'accessToken': accessToken,
          'refreshToken': refreshToken,
          'isAuthenticated': true,
          'isVerified': isVerified,
        });

        // Clear recent signup if it matches
        if (_recentSignup?['email'] == resolvedEmail) {
          final prefs = await SharedPreferences.getInstance();
          await prefs.remove('recentSignup');
        }

        final message = result['message'] ?? 'Verification successful! Welcome back!';
        
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Row(
              children: [
                const Icon(Icons.check_circle, color: Colors.white),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(message),
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
          // Navigate all users to main navigation (feed screen)
          // Dashboard can be accessed via navigation menu if needed
          Navigator.of(context).pushReplacement(
            ScaleSlideTransition(page: const MainNavigationWrapper()),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isLoading = false;
          _error = e is ApiException 
              ? e.message 
              : 'Invalid verification code. Please try again.';
        });
        
        final theme = Theme.of(context);
        final isDarkMode = theme.brightness == Brightness.dark;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(_error),
            backgroundColor: isDarkMode ? AppTheme.navy800 : Colors.red.shade600,
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
            ),
          ),
        );
        
        // Clear OTP inputs
        for (var controller in _controllers) {
          controller.clear();
        }
        _focusNodes[0].requestFocus();
      }
    }
  }

  void _handleResendCode() async {
    if (_email == null || _email!.isEmpty) {
        final theme = Theme.of(context);
        final isDarkMode = theme.brightness == Brightness.dark;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: const Text('Missing email. Please go back and request a new code.'),
            backgroundColor: isDarkMode ? AppTheme.navy800 : Colors.red.shade600,
          ),
        );
      Navigator.of(context).pushReplacementNamed('/login');
      return;
    }

    setState(() {
      _isResending = true;
      _error = '';
    });

    try {
      final response = await ApiService.requestOtp(_email!);
      
      if (mounted) {
        final message = response['message'] ?? 'Verification code resent to your email!';
        
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(message),
            backgroundColor: AppTheme.teal500,
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
            ),
          ),
        );
        
        for (var controller in _controllers) {
          controller.clear();
        }
        _focusNodes[0].requestFocus();
      }
    } catch (e) {
      if (mounted) {
        final message = e is ApiException 
            ? e.message 
            : 'Unable to resend the verification code. Please try again shortly.';
        
        final theme = Theme.of(context);
        final isDarkMode = theme.brightness == Brightness.dark;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(message),
            backgroundColor: isDarkMode ? AppTheme.navy800 : Colors.red.shade600,
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
            ),
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isResending = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: isDark ? AppTheme.navy900 : const Color(0xFFF9FAFB),
      body: AnimatedBackground(
        child: SafeArea(
          child: Center(
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
                                  ? AppTheme.navy800.withOpacity(0.9)
                                  : Colors.white.withOpacity(0.9),
                              borderRadius: BorderRadius.circular(20),
                              border: Border.all(
                                color: isDark
                                    ? AppTheme.navy700
                                    : Colors.white.withOpacity(0.3),
                                width: 1.5,
                              ),
                              boxShadow: [
                                BoxShadow(
                                  color: isDark
                                      ? Colors.black.withOpacity(0.3)
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
                                            onTap: () async {
                                              // Check clipboard for OTP code when field is tapped
                                              final clipboardData = await Clipboard.getData(Clipboard.kTextPlain);
                                              if (clipboardData?.text != null) {
                                                final text = clipboardData!.text!.trim();
                                                // Check if clipboard contains a 6-digit code
                                                if (RegExp(r'^\d{6}$').hasMatch(text)) {
                                                  // Fill all fields with the code
                                                  for (int i = 0; i < 6 && i < text.length; i++) {
                                                    _controllers[i].text = text[i];
                                                  }
                                                  // Move focus to last field
                                                  _focusNodes[5].requestFocus();
                                                  setState(() {
                                                    _error = '';
                                                  });
                                                }
                                              }
                                            },
                                          ),
                                        ),
                                      );
                                    }),
                                  ),
                                ),
                                
                                // Paste button
                                const SizedBox(height: 12),
                                TextButton.icon(
                                  onPressed: () async {
                                    final clipboardData = await Clipboard.getData(Clipboard.kTextPlain);
                                    if (clipboardData?.text != null) {
                                      final text = clipboardData!.text!.trim();
                                      // Check if clipboard contains a 6-digit code
                                      if (RegExp(r'^\d{6}$').hasMatch(text)) {
                                        // Fill all fields with the code
                                        for (int i = 0; i < 6 && i < text.length; i++) {
                                          _controllers[i].text = text[i];
                                        }
                                        // Move focus to last field
                                        _focusNodes[5].requestFocus();
                                        setState(() {
                                          _error = '';
                                        });
                                      } else {
                                        ScaffoldMessenger.of(context).showSnackBar(
                                          const SnackBar(
                                            content: Text('Clipboard does not contain a valid 6-digit code'),
                                            duration: Duration(seconds: 2),
                                          ),
                                        );
                                      }
                                    }
                                  },
                                  icon: const Icon(Icons.paste, size: 18),
                                  label: const Text('Paste from clipboard'),
                                  style: TextButton.styleFrom(
                                    foregroundColor: isDark
                                        ? AppTheme.teal400
                                        : AppTheme.primary600,
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
                                      onPressed: _isResending ? null : _handleResendCode,
                                      child: Text(
                                        _isResending ? 'Resending...' : 'Resend Code',
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
        ),
      ),
    );
  }
}
