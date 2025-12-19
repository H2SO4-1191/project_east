import 'package:flutter/material.dart';
import 'package:lottie/lottie.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../config/theme.dart';

class OnboardingScreen extends StatefulWidget {
  const OnboardingScreen({super.key});

  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen>
    with TickerProviderStateMixin {
  final PageController _pageController = PageController();
  int _currentPage = 0;

  late AnimationController _fadeController;
  late Animation<double> _fadeAnimation;

  final List<OnboardingPage> _pages = [
    OnboardingPage(
      title: 'Welcome to Project East',
      subtitle: 'Your gateway to modern education',
      isWelcome: true,
    ),
    OnboardingPage(
      title: 'For Institutions',
      subtitle: 'Manage your educational organization with ease',
      lottieAsset: 'assets/lottie/institution.json',
      features: [
        'Create and manage courses',
        'Track student progress & analytics',
        'Manage lecturers and staff',
      ],
      accentColor: AppTheme.primary600,
    ),
    OnboardingPage(
      title: 'For Lecturers',
      subtitle: 'Empower your teaching experience',
      lottieAsset: 'assets/lottie/lecturer.json',
      features: [
        'Create engaging content',
        'Grade exams efficiently',
        'Track attendance seamlessly',
      ],
      accentColor: AppTheme.teal500,
    ),
    OnboardingPage(
      title: 'For Students',
      subtitle: 'Learn smarter, achieve more',
      lottieAsset: 'assets/lottie/student.json',
      features: [
        'Enroll in courses easily',
        'Track your progress',
        'Manage your schedule',
      ],
      accentColor: AppTheme.gold500,
    ),
  ];

  @override
  void initState() {
    super.initState();
    _fadeController = AnimationController(
      duration: const Duration(milliseconds: 600),
      vsync: this,
    );
    _fadeAnimation = CurvedAnimation(
      parent: _fadeController,
      curve: Curves.easeOut,
    );
    _fadeController.forward();
  }

  @override
  void dispose() {
    _pageController.dispose();
    _fadeController.dispose();
    super.dispose();
  }

  void _nextPage() {
    if (_currentPage < _pages.length - 1) {
      _pageController.nextPage(
        duration: const Duration(milliseconds: 400),
        curve: Curves.easeInOutCubic,
      );
    } else {
      _completeOnboarding();
    }
  }

  void _skip() {
    _completeOnboarding();
  }

  Future<void> _completeOnboarding() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('onboarding_complete', true);
    if (mounted) {
      Navigator.of(context).pushReplacementNamed('/');
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final size = MediaQuery.of(context).size;

    return Scaffold(
      backgroundColor: isDark ? AppTheme.navy900 : Colors.white,
      body: SafeArea(
        child: FadeTransition(
          opacity: _fadeAnimation,
          child: Column(
            children: [
              // Skip button
              Align(
                alignment: Alignment.topRight,
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: TextButton(
                    onPressed: _skip,
                    child: Text(
                      'Skip',
                      style: TextStyle(
                        color: isDark ? AppTheme.navy400 : AppTheme.navy600,
                        fontSize: 16,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ),
                ),
              ),

              // Page content
              Expanded(
                child: PageView.builder(
                  controller: _pageController,
                  onPageChanged: (index) {
                    setState(() => _currentPage = index);
                  },
                  itemCount: _pages.length,
                  itemBuilder: (context, index) {
                    return _buildPage(_pages[index], isDark, size);
                  },
                ),
              ),

              // Dot indicators
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 24),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: List.generate(
                    _pages.length,
                    (index) => _buildDotIndicator(index, isDark),
                  ),
                ),
              ),

              // Next/Get Started button
              Padding(
                padding: const EdgeInsets.fromLTRB(24, 0, 24, 32),
                child: SizedBox(
                  width: double.infinity,
                  height: 56,
                  child: ElevatedButton(
                    onPressed: _nextPage,
                    style: ElevatedButton.styleFrom(
                      backgroundColor:
                          isDark ? AppTheme.teal500 : AppTheme.primary600,
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(16),
                      ),
                      elevation: 0,
                    ),
                    child: Text(
                      _currentPage == _pages.length - 1 ? 'Get Started' : 'Next',
                      style: const TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w600,
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

  Widget _buildPage(OnboardingPage page, bool isDark, Size size) {
    if (page.isWelcome) {
      return _buildWelcomePage(page, isDark, size);
    }
    return _buildFeaturePage(page, isDark, size);
  }

  Widget _buildWelcomePage(OnboardingPage page, bool isDark, Size size) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 32),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          // Logo
          Container(
            width: 140,
            height: 140,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: isDark
                    ? [AppTheme.teal500, AppTheme.primary600]
                    : [AppTheme.primary500, AppTheme.primary700],
              ),
              boxShadow: [
                BoxShadow(
                  color: (isDark ? AppTheme.teal500 : AppTheme.primary600)
                      .withOpacity(0.3),
                  blurRadius: 30,
                  spreadRadius: 5,
                ),
              ],
            ),
            child: ClipOval(
              child: Image.asset(
                'assets/logo.png',
                fit: BoxFit.cover,
                errorBuilder: (context, error, stackTrace) {
                  return Icon(
                    Icons.school_rounded,
                    size: 70,
                    color: Colors.white,
                  );
                },
              ),
            ),
          ),
          const SizedBox(height: 48),

          // Title
          Text(
            page.title,
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 32,
              fontWeight: FontWeight.bold,
              color: isDark ? Colors.white : AppTheme.navy900,
              letterSpacing: -0.5,
            ),
          ),
          const SizedBox(height: 16),

          // Subtitle
          Text(
            page.subtitle,
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 18,
              color: isDark ? AppTheme.navy400 : AppTheme.navy600,
              height: 1.5,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFeaturePage(OnboardingPage page, bool isDark, Size size) {
    final accentColor = page.accentColor ?? AppTheme.primary600;

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 32),
      child: Column(
        children: [
          // Lottie animation
          Expanded(
            flex: 5,
            child: page.lottieAsset != null
                ? Lottie.asset(
                    page.lottieAsset!,
                    fit: BoxFit.contain,
                    errorBuilder: (context, error, stackTrace) {
                      return Container(
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: accentColor.withOpacity(0.1),
                        ),
                        child: Icon(
                          _getIconForPage(page.title),
                          size: 100,
                          color: accentColor,
                        ),
                      );
                    },
                  )
                : Container(
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: accentColor.withOpacity(0.1),
                    ),
                    child: Icon(
                      _getIconForPage(page.title),
                      size: 100,
                      color: accentColor,
                    ),
                  ),
          ),

          // Title
          Text(
            page.title,
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 28,
              fontWeight: FontWeight.bold,
              color: isDark ? Colors.white : AppTheme.navy900,
              letterSpacing: -0.5,
            ),
          ),
          const SizedBox(height: 12),

          // Subtitle
          Text(
            page.subtitle,
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 16,
              color: isDark ? AppTheme.navy400 : AppTheme.navy600,
            ),
          ),
          const SizedBox(height: 32),

          // Features list
          Expanded(
            flex: 3,
            child: Column(
              children: page.features
                      ?.map((feature) => _buildFeatureItem(feature, accentColor, isDark))
                      .toList() ??
                  [],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFeatureItem(String feature, Color accentColor, bool isDark) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        children: [
          Container(
            width: 28,
            height: 28,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: accentColor.withOpacity(0.15),
            ),
            child: Icon(
              Icons.check_rounded,
              size: 16,
              color: accentColor,
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Text(
              feature,
              style: TextStyle(
                fontSize: 16,
                color: isDark ? AppTheme.navy300 : AppTheme.navy700,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDotIndicator(int index, bool isDark) {
    final isActive = index == _currentPage;
    return AnimatedContainer(
      duration: const Duration(milliseconds: 300),
      margin: const EdgeInsets.symmetric(horizontal: 4),
      width: isActive ? 32 : 8,
      height: 8,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(4),
        color: isActive
            ? (isDark ? AppTheme.teal500 : AppTheme.primary600)
            : (isDark ? AppTheme.navy700 : AppTheme.navy300),
      ),
    );
  }

  IconData _getIconForPage(String title) {
    if (title.contains('Institution')) return Icons.business_rounded;
    if (title.contains('Lecturer')) return Icons.person_rounded;
    if (title.contains('Student')) return Icons.school_rounded;
    return Icons.star_rounded;
  }
}

class OnboardingPage {
  final String title;
  final String subtitle;
  final String? lottieAsset;
  final List<String>? features;
  final Color? accentColor;
  final bool isWelcome;

  OnboardingPage({
    required this.title,
    required this.subtitle,
    this.lottieAsset,
    this.features,
    this.accentColor,
    this.isWelcome = false,
  });
}

