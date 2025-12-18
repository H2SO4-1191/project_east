import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../config/theme.dart';
import '../providers/auth_provider.dart';
import 'academic_submenu.dart';
import 'action_modal_bottom_sheet.dart';

class ModernBottomNav extends StatefulWidget {
  final int currentIndex;
  final Function(int) onTap;
  final Function(String action)? onActionSelected;

  const ModernBottomNav({
    super.key,
    required this.currentIndex,
    required this.onTap,
    this.onActionSelected,
  });

  @override
  State<ModernBottomNav> createState() => _ModernBottomNavState();
}

class _ModernBottomNavState extends State<ModernBottomNav>
    with SingleTickerProviderStateMixin {
  late AnimationController _middleButtonController;
  late Animation<double> _middleButtonScale;

  @override
  void initState() {
    super.initState();
    _middleButtonController = AnimationController(
      duration: const Duration(milliseconds: 200),
      vsync: this,
    );
    _middleButtonScale = Tween<double>(begin: 1.0, end: 0.95).animate(
      CurvedAnimation(
        parent: _middleButtonController,
        curve: Curves.easeInOut,
      ),
    );
  }

  @override
  void dispose() {
    _middleButtonController.dispose();
    super.dispose();
  }

  void _handleMiddleButtonTap(BuildContext context) {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final isAuthenticated = authProvider.isAuthenticated;
    final userType = authProvider.instituteData['userType'] ?? '';
    final isInstitute = userType == 'institution';

    if (!isAuthenticated) {
      // Show login/signup prompt for non-authenticated users
      _middleButtonController.forward().then((_) {
        _middleButtonController.reverse();
      });
      _showLoginSignupPrompt(context);
    } else if (userType == 'student' || userType == 'lecturer') {
      // Show academic submenu
      _middleButtonController.forward().then((_) {
        _middleButtonController.reverse();
      });
      AcademicSubmenu.show(context, userType);
    } else if (isInstitute) {
      // For institute users: check if on dashboard
      if (widget.currentIndex == 1) {
        // On dashboard: open action modal
        _middleButtonController.forward().then((_) {
          _middleButtonController.reverse();
        });
        if (widget.onActionSelected != null) {
          ActionModalBottomSheet.show(context, widget.onActionSelected!);
        }
      } else {
        // Not on dashboard: navigate to dashboard
        widget.onTap(1);
      }
    }
  }

  void _showLoginSignupPrompt(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      useSafeArea: true,
      builder: (context) => Container(
        decoration: BoxDecoration(
          color: isDark ? AppTheme.navy800 : Colors.white,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
        ),
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                // Handle bar
                Container(
                  margin: const EdgeInsets.only(bottom: 16),
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: Colors.grey.shade400,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
                // Icon
                Container(
                  width: 80,
                  height: 80,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    gradient: const LinearGradient(
                      colors: [AppTheme.primary600, AppTheme.teal500],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                  ),
                  child: const Icon(
                    Icons.school,
                    color: Colors.white,
                    size: 40,
                  ),
                ),
                const SizedBox(height: 24),
                // Title
                Text(
                  'Access Academic Features',
                  style: theme.textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 12),
                // Description
                Text(
                  'Sign in or create an account to access your courses, schedule, and academic resources.',
                  style: theme.textTheme.bodyMedium?.copyWith(
                    color: Colors.grey.shade600,
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 32),
                // Login Button
                SizedBox(
                  width: double.infinity,
                  child: FilledButton(
                    onPressed: () {
                      Navigator.pop(context);
                      Navigator.pushNamed(context, '/login');
                    },
                    style: FilledButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    child: const Text(
                      'Sign In',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 12),
                // Sign Up Button
                SizedBox(
                  width: double.infinity,
                  child: OutlinedButton(
                    onPressed: () {
                      Navigator.pop(context);
                      Navigator.pushNamed(context, '/account-type-selection');
                    },
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    child: const Text(
                      'Create Account',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 8),
              ],
            ),
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
    final userType = authProvider.instituteData['userType'] ?? '';

    // Determine navigation items based on user type
    final isInstitute = userType == 'institution';
    final bottomPadding = MediaQuery.of(context).padding.bottom;
    const navBarHeight = 72.0;
    const buttonSize = 64.0;

    return SizedBox(
      height: navBarHeight + bottomPadding,
      child: Stack(
        clipBehavior: Clip.none,
        children: [
          // Navigation bar with curved cutout (transparent cutout area)
          Positioned(
            bottom: 0,
            left: 0,
            right: 0,
            child: ClipPath(
              clipper: _BottomNavClipper(buttonSize: buttonSize),
              child: Container(
                height: navBarHeight + bottomPadding,
                decoration: BoxDecoration(
                  color: isDark ? AppTheme.navy800 : Colors.white,
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.15),
                      blurRadius: 10,
                      offset: const Offset(0, -2),
                    ),
                  ],
                ),
              ),
            ),
          ),
          // Content on top (buttons) - no background
          Positioned(
            bottom: 0,
            left: 0,
            right: 0,
            child: SizedBox(
              height: navBarHeight + bottomPadding,
              child: SafeArea(
                top: false,
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceAround,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Home button
                    Expanded(
                      child: _buildNavItem(
                        context: context,
                        icon: Icons.home_outlined,
                        filledIcon: Icons.home,
                        label: 'Home',
                        index: 0,
                        isActive: widget.currentIndex == 0,
                      ),
                    ),
                    // Spacer for middle button
                    SizedBox(width: buttonSize + 60),
                    // Explore button
                    Expanded(
                      child: _buildNavItem(
                        context: context,
                        icon: Icons.explore_outlined,
                        filledIcon: Icons.explore,
                        label: 'Explore',
                        index: 2,
                        isActive: widget.currentIndex == 2,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
          // Animated dot indicator that moves between tabs
          // Only show for Home (0) and Explore (2), hide for Academic (1)
          if (widget.currentIndex == 0 || widget.currentIndex == 2)
            _AnimatedDotIndicator(
              currentIndex: widget.currentIndex == 2 ? 1 : 0,
              isDark: isDark,
            ),
          // Show dot under middle button when Academic is active
          if (widget.currentIndex == 1)
            Positioned(
              bottom: 8 + MediaQuery.of(context).padding.bottom,
              left: MediaQuery.of(context).size.width / 2 - 3,
              child: Container(
                width: 6,
                height: 6,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: isDark ? AppTheme.teal500 : AppTheme.primary600,
                ),
              ),
            ),
          // Floating middle button
          Positioned(
            bottom: navBarHeight / 2 - buttonSize / 2 + bottomPadding,
            left: MediaQuery.of(context).size.width / 2 - buttonSize / 2,
            child: GestureDetector(
              onTapDown: (_) => _middleButtonController.forward(),
              onTapUp: (_) {
                _middleButtonController.reverse();
                _handleMiddleButtonTap(context);
              },
              onTapCancel: () => _middleButtonController.reverse(),
              child: ScaleTransition(
                scale: _middleButtonScale,
                child: Container(
                  width: buttonSize,
                  height: buttonSize,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    gradient: const LinearGradient(
                      colors: [AppTheme.primary600, AppTheme.teal500],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: AppTheme.primary600.withOpacity(0.5),
                        blurRadius: 20,
                        offset: const Offset(0, 8),
                        spreadRadius: 2,
                      ),
                      BoxShadow(
                        color: AppTheme.teal500.withOpacity(0.3),
                        blurRadius: 15,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  child: AnimatedSwitcher(
                    duration: const Duration(milliseconds: 200),
                    transitionBuilder: (child, animation) {
                      return ScaleTransition(
                        scale: animation,
                        child: child,
                      );
                    },
                    child: Icon(
                      isInstitute
                          ? (widget.currentIndex == 1
                              ? Icons.add
                              : Icons.dashboard)
                          : Icons.school,
                      key: ValueKey(
                          '${isInstitute}_${widget.currentIndex == 1}'),
                      color: Colors.white,
                      size: 28,
                    ),
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildNavItem({
    required BuildContext context,
    required IconData icon,
    required IconData filledIcon,
    required String label,
    required int index,
    required bool isActive,
  }) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: () => widget.onTap(index),
        borderRadius: BorderRadius.circular(12),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 8),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              AnimatedSwitcher(
                duration: const Duration(milliseconds: 200),
                transitionBuilder: (child, animation) {
                  return ScaleTransition(
                    scale: animation,
                    child: child,
                  );
                },
                child: Icon(
                  isActive ? filledIcon : icon,
                  key: ValueKey(isActive),
                  color: isActive
                      ? (isDark ? AppTheme.teal500 : AppTheme.primary600)
                      : (isDark ? const Color(0xFF9CA3AF) : const Color(0xFF6B7280)),
                  size: 24,
                ),
              ),
              const SizedBox(height: 4),
              AnimatedDefaultTextStyle(
                duration: const Duration(milliseconds: 200),
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: isActive ? FontWeight.w600 : FontWeight.normal,
                  color: isActive
                      ? (isDark ? AppTheme.teal500 : AppTheme.primary600)
                      : (isDark ? const Color(0xFF9CA3AF) : const Color(0xFF6B7280)),
                ),
                child: Text(label),
              ),
              // Placeholder for dot height
              const SizedBox(height: 10),
            ],
          ),
        ),
      ),
    );
  }

}

// Animated dot indicator widget
class _AnimatedDotIndicator extends StatelessWidget {
  final int currentIndex;
  final bool isDark;

  const _AnimatedDotIndicator({
    required this.currentIndex,
    required this.isDark,
  });

  @override
  Widget build(BuildContext context) {
    final screenWidth = MediaQuery.of(context).size.width;
    const buttonSize = 64.0;
    final sideWidth = (screenWidth - buttonSize - 60) / 2;
    
    // Calculate target position
    double targetX;
    if (currentIndex == 0) {
      targetX = sideWidth / 2 - 3; // -3 for dot width/2
    } else {
      targetX = screenWidth - sideWidth / 2 - 3;
    }

    return AnimatedPositioned(
      duration: const Duration(milliseconds: 500),
      curve: Curves.easeInOutCirc,
      left: targetX,
      bottom: 16,
      child: Container(
        width: 6,
        height: 6,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          color: isDark ? AppTheme.teal500 : AppTheme.primary600,
        ),
      ),
    );
  }
}

// Custom clipper to create curved cutout for the floating button
class _BottomNavClipper extends CustomClipper<Path> {
  final double buttonSize;

  _BottomNavClipper({required this.buttonSize});

  @override
  Path getClip(Size size) {
    final path = Path();
    final centerX = size.width / 2;
    final buttonRadius = buttonSize / 2;
    final curveRadius = buttonRadius + 8; // Slightly larger than button to wrap around it
    final curveDepth = buttonRadius * 2 + 16; // Deep enough to go UNDER the entire button

    // Start from bottom-left
    path.moveTo(0, size.height);

    // Line up to top-left
    path.lineTo(0, 0);

    // Line across to start of curve (left side)
    path.lineTo(centerX - curveRadius - 15, 0);

    // Smooth curve down (left side) - goes down to the depth
    path.quadraticBezierTo(
      centerX - curveRadius - 5, 0, // Control point (smooth entry)
      centerX - curveRadius, curveDepth / 3, // End point (start of vertical)
    );

    // Continue down on left side
    path.lineTo(centerX - curveRadius, curveDepth - curveRadius);

    // Semicircle at the bottom - goes UNDER the button completely
    path.arcToPoint(
      Offset(centerX + curveRadius, curveDepth - curveRadius),
      radius: Radius.circular(curveRadius),
      clockwise: false,
    );

    // Continue up on right side
    path.lineTo(centerX + curveRadius, curveDepth / 3);

    // Smooth curve back up (right side)
    path.quadraticBezierTo(
      centerX + curveRadius + 5, 0, // Control point (smooth exit)
      centerX + curveRadius + 15, 0, // End point
    );

    // Line across to top-right
    path.lineTo(size.width, 0);

    // Line down to bottom-right
    path.lineTo(size.width, size.height);

    // Close the path
    path.close();
    return path;
  }

  @override
  bool shouldReclip(covariant CustomClipper<Path> oldClipper) => false;
}

