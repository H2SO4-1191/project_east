import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../config/theme.dart';

enum CategoryType {
  courses,
  students,
  lecturers,
  jobs,
  institutions,
}

class CategoryCard extends StatefulWidget {
  final CategoryType category;
  final int index; // For staggered animation delay
  final VoidCallback onTap;

  const CategoryCard({
    super.key,
    required this.category,
    required this.index,
    required this.onTap,
  });

  @override
  State<CategoryCard> createState() => _CategoryCardState();
}

class _CategoryCardState extends State<CategoryCard>
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

    // Icon animation controller (category-specific)
    _iconController = AnimationController(
      vsync: this,
      duration: _getIconAnimationDuration(),
    );
    
    // Only animate if not courses or institutions
    if (widget.category != CategoryType.courses && 
        widget.category != CategoryType.institutions) {
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
    switch (widget.category) {
      case CategoryType.courses:
        return const Duration(seconds: 4);
      case CategoryType.students:
        return const Duration(seconds: 2);
      case CategoryType.lecturers:
        return const Duration(milliseconds: 1500);
      case CategoryType.jobs:
        return const Duration(seconds: 2);
      case CategoryType.institutions:
        return const Duration(seconds: 3);
    }
  }

  bool _shouldReverseIconAnimation() {
    switch (widget.category) {
      case CategoryType.courses:
      case CategoryType.students:
      case CategoryType.jobs:
        return true;
      case CategoryType.lecturers:
      case CategoryType.institutions:
        return true;
    }
  }

  IconData _getIcon() {
    switch (widget.category) {
      case CategoryType.courses:
        return Icons.book;
      case CategoryType.students:
        return Icons.people;
      case CategoryType.lecturers:
        return Icons.school;
      case CategoryType.jobs:
        return Icons.work;
      case CategoryType.institutions:
        return Icons.business;
    }
  }

  String _getTitle() {
    switch (widget.category) {
      case CategoryType.courses:
        return 'Courses';
      case CategoryType.students:
        return 'Students';
      case CategoryType.lecturers:
        return 'Lecturers';
      case CategoryType.jobs:
        return 'Jobs';
      case CategoryType.institutions:
        return 'Institutions';
    }
  }

  List<Color> _getGradientColors() {
    switch (widget.category) {
      case CategoryType.courses:
        return [AppTheme.primary400, AppTheme.teal500];
      case CategoryType.students:
        return [AppTheme.teal400, AppTheme.primary400];
      case CategoryType.lecturers:
        return [AppTheme.gold400, AppTheme.primary500];
      case CategoryType.jobs:
        return [AppTheme.teal400, AppTheme.primary400];
      case CategoryType.institutions:
        return [AppTheme.primary500, AppTheme.teal600];
    }
  }

  Widget _buildAnimatedIcon() {
    final icon = Icon(
      _getIcon(),
      size: 40,
      color: Colors.white,
    );

    switch (widget.category) {
      case CategoryType.courses:
        // No animation - static icon
        return icon;
      case CategoryType.students:
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
      case CategoryType.lecturers:
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
      case CategoryType.jobs:
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
      case CategoryType.institutions:
        // No animation - static icon
        return icon;
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
            padding: const EdgeInsets.all(20),
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

