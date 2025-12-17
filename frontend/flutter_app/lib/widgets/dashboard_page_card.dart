import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../config/theme.dart';

enum DashboardPageType {
  students,
  lecturers,
  staff,
  schedule,
  settings,
}

class DashboardPageCard extends StatefulWidget {
  final DashboardPageType pageType;
  final int index; // For staggered animation delay
  final VoidCallback onTap;

  const DashboardPageCard({
    super.key,
    required this.pageType,
    required this.index,
    required this.onTap,
  });

  @override
  State<DashboardPageCard> createState() => _DashboardPageCardState();
}

class _DashboardPageCardState extends State<DashboardPageCard>
    with TickerProviderStateMixin {
  late AnimationController _gradientController;
  late AnimationController _iconController;
  late Animation<double> _gradientAnimation;
  bool _isPressed = false;

  @override
  void initState() {
    super.initState();

    // Gradient animation controller (continuous loop)
    _gradientController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 4),
    )..repeat();

    // Icon animation controller (page-specific)
    _iconController = AnimationController(
      vsync: this,
      duration: _getIconAnimationDuration(),
    );
    
    // Only animate if not schedule
    if (widget.pageType != DashboardPageType.schedule) {
      _iconController.repeat(reverse: _shouldReverseIconAnimation());
    }

    // Gradient color shift animation
    _gradientAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(
        parent: _gradientController,
        curve: Curves.easeInOut,
      ),
    );
  }

  @override
  void dispose() {
    _gradientController.dispose();
    _iconController.dispose();
    super.dispose();
  }

  Duration _getIconAnimationDuration() {
    switch (widget.pageType) {
      case DashboardPageType.students:
        return const Duration(seconds: 2);
      case DashboardPageType.lecturers:
        return const Duration(milliseconds: 1500);
      case DashboardPageType.staff:
        return const Duration(seconds: 2);
      case DashboardPageType.schedule:
        return const Duration(seconds: 2);
      case DashboardPageType.settings:
        return const Duration(seconds: 3);
    }
  }

  bool _shouldReverseIconAnimation() {
    switch (widget.pageType) {
      case DashboardPageType.students:
      case DashboardPageType.staff:
      case DashboardPageType.schedule:
        return true;
      case DashboardPageType.lecturers:
      case DashboardPageType.settings:
        return true;
    }
  }

  IconData _getIcon() {
    switch (widget.pageType) {
      case DashboardPageType.students:
        return Icons.people;
      case DashboardPageType.lecturers:
        return Icons.school;
      case DashboardPageType.staff:
        return Icons.business_center;
      case DashboardPageType.schedule:
        return Icons.calendar_today;
      case DashboardPageType.settings:
        return Icons.settings;
    }
  }

  String _getTitle() {
    switch (widget.pageType) {
      case DashboardPageType.students:
        return 'Students';
      case DashboardPageType.lecturers:
        return 'Lecturers';
      case DashboardPageType.staff:
        return 'Staff';
      case DashboardPageType.schedule:
        return 'Schedule';
      case DashboardPageType.settings:
        return 'Settings';
    }
  }

  List<Color> _getGradientColors() {
    switch (widget.pageType) {
      case DashboardPageType.students:
        return [AppTheme.primary500, AppTheme.teal500];
      case DashboardPageType.lecturers:
        return [AppTheme.teal500, AppTheme.primary600];
      case DashboardPageType.staff:
        return [AppTheme.gold500, AppTheme.primary500];
      case DashboardPageType.schedule:
        return [AppTheme.teal400, AppTheme.primary500];
      case DashboardPageType.settings:
        return [AppTheme.primary600, AppTheme.teal600];
    }
  }

  Widget _buildAnimatedIcon() {
    final icon = Icon(
      _getIcon(),
      size: 40,
      color: Colors.white,
    );

    switch (widget.pageType) {
      case DashboardPageType.students:
        // Pulsing scale
        return AnimatedBuilder(
          animation: _iconController,
          builder: (context, child) {
            return Transform.scale(
              scale: 1.0 + (_iconController.value * 0.1),
              child: child!,
            );
          },
          child: icon,
        );
      case DashboardPageType.lecturers:
        // Floating up/down
        return AnimatedBuilder(
          animation: _iconController,
          builder: (context, child) {
            return Transform.translate(
              offset: Offset(0, -(_iconController.value * 8)),
              child: child!,
            );
          },
          child: icon,
        );
      case DashboardPageType.staff:
        // Gentle bounce
        return AnimatedBuilder(
          animation: _iconController,
          builder: (context, child) {
            return Transform.scale(
              scale: 1.0 + (_iconController.value * 0.08),
              child: child!,
            );
          },
          child: icon,
        );
      case DashboardPageType.schedule:
        // No animation - static icon
        return icon;
      case DashboardPageType.settings:
        // Gentle rotation
        return AnimatedBuilder(
          animation: _iconController,
          builder: (context, child) {
            return Transform.rotate(
              angle: _iconController.value * 2 * 3.14159,
              child: child!,
            );
          },
          child: icon,
        );
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final gradientColors = _getGradientColors();

    return GestureDetector(
      onTapDown: (_) {
        setState(() => _isPressed = true);
      },
      onTapUp: (_) {
        setState(() => _isPressed = false);
        widget.onTap();
      },
      onTapCancel: () {
        setState(() => _isPressed = false);
      },
      child: AnimatedScale(
        scale: _isPressed ? 0.95 : 1.0,
        duration: const Duration(milliseconds: 150),
        curve: Curves.easeOut,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          curve: Curves.easeOut,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(16),
            gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [
                Color.lerp(
                  gradientColors[0],
                  gradientColors[1],
                  _gradientAnimation.value,
                )!,
                Color.lerp(
                  gradientColors[1],
                  gradientColors[0],
                  _gradientAnimation.value,
                )!,
              ],
            ),
            boxShadow: [
              BoxShadow(
                color: (_isPressed
                        ? gradientColors[0].withOpacity(0.4)
                        : gradientColors[0].withOpacity(0.2))
                    .withOpacity(0.3),
                blurRadius: _isPressed ? 16 : 8,
                spreadRadius: _isPressed ? 2 : 0,
                offset: Offset(0, _isPressed ? 6 : 2),
              ),
            ],
          ),
          child: Container(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildAnimatedIcon(),
                const SizedBox(height: 12),
                Text(
                  _getTitle(),
                  style: theme.textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                    fontSize: 18,
                  ),
                ),
              ],
            ),
          ),
        ),
      )
          .animate()
          .fadeIn(
            duration: 400.ms,
            delay: (widget.index * 100).ms,
            curve: Curves.easeOutCubic,
          )
          .slideY(
            begin: 0.2,
            end: 0,
            duration: 400.ms,
            delay: (widget.index * 100).ms,
            curve: Curves.easeOutCubic,
          ),
    );
  }
}

