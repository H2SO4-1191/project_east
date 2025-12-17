import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../config/theme.dart';

enum ActionType {
  createCourse,
  editCourses,
  createPost,
  createJobPost,
  applications,
}

class ActionModalBottomSheet {
  static void show(
    BuildContext context,
    Function(String action) onActionSelected,
  ) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      useSafeArea: true,
      isDismissible: true,
      enableDrag: true,
      builder: (context) => _ActionModalContent(
        onActionSelected: onActionSelected,
      ),
    );
  }
}

class _ActionModalContent extends StatelessWidget {
  final Function(String action) onActionSelected;

  const _ActionModalContent({
    required this.onActionSelected,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Container(
      decoration: BoxDecoration(
        color: isDark ? AppTheme.navy800 : Colors.white,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: SafeArea(
        top: false,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Handle bar
            Container(
              margin: const EdgeInsets.only(top: 12, bottom: 8),
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: Colors.grey.shade400,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            // Title
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
              child: Text(
                'Quick Actions',
                style: theme.textTheme.titleLarge?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
            // Action buttons grid
            Padding(
              padding: const EdgeInsets.all(24),
              child: GridView.count(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                crossAxisCount: 3,
                crossAxisSpacing: 16,
                mainAxisSpacing: 16,
                childAspectRatio: 0.85,
                children: [
                  _ActionButton(
                    actionType: ActionType.createCourse,
                    index: 0,
                    onTap: () {
                      Navigator.pop(context);
                      onActionSelected('create_course');
                    },
                  ),
                  _ActionButton(
                    actionType: ActionType.editCourses,
                    index: 1,
                    onTap: () {
                      Navigator.pop(context);
                      onActionSelected('edit_courses');
                    },
                  ),
                  _ActionButton(
                    actionType: ActionType.createPost,
                    index: 2,
                    onTap: () {
                      Navigator.pop(context);
                      onActionSelected('create_post');
                    },
                  ),
                  _ActionButton(
                    actionType: ActionType.createJobPost,
                    index: 3,
                    onTap: () {
                      Navigator.pop(context);
                      onActionSelected('job_post');
                    },
                  ),
                  _ActionButton(
                    actionType: ActionType.applications,
                    index: 4,
                    onTap: () {
                      Navigator.pop(context);
                      onActionSelected('applications');
                    },
                  ),
                ],
              ),
            ),
            // Bottom padding for safe area
            SizedBox(height: MediaQuery.of(context).padding.bottom),
          ],
        ),
      ),
    );
  }
}

class _ActionButton extends StatefulWidget {
  final ActionType actionType;
  final int index;
  final VoidCallback onTap;

  const _ActionButton({
    required this.actionType,
    required this.index,
    required this.onTap,
  });

  @override
  State<_ActionButton> createState() => _ActionButtonState();
}

class _ActionButtonState extends State<_ActionButton>
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

    // Icon animation controller
    _iconController = AnimationController(
      vsync: this,
      duration: _getIconAnimationDuration(),
    )..repeat(reverse: _shouldReverseIconAnimation());

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
    switch (widget.actionType) {
      case ActionType.createCourse:
        return const Duration(seconds: 2);
      case ActionType.editCourses:
        return const Duration(milliseconds: 1500);
      case ActionType.createPost:
        return const Duration(seconds: 2);
      case ActionType.createJobPost:
        return const Duration(seconds: 2);
      case ActionType.applications:
        return const Duration(seconds: 3);
    }
  }

  bool _shouldReverseIconAnimation() {
    switch (widget.actionType) {
      case ActionType.createCourse:
      case ActionType.editCourses:
      case ActionType.createPost:
      case ActionType.createJobPost:
        return true;
      case ActionType.applications:
        return true;
    }
  }

  IconData _getIcon() {
    switch (widget.actionType) {
      case ActionType.createCourse:
        return Icons.add;
      case ActionType.editCourses:
        return Icons.edit;
      case ActionType.createPost:
        return Icons.article;
      case ActionType.createJobPost:
        return Icons.work;
      case ActionType.applications:
        return Icons.assignment;
    }
  }

  String _getTitle() {
    switch (widget.actionType) {
      case ActionType.createCourse:
        return 'Create\nCourse';
      case ActionType.editCourses:
        return 'Edit\nCourses';
      case ActionType.createPost:
        return 'Create\nPost';
      case ActionType.createJobPost:
        return 'Create Job\nPost';
      case ActionType.applications:
        return 'Applications';
    }
  }

  List<Color> _getGradientColors() {
    switch (widget.actionType) {
      case ActionType.createCourse:
        return [AppTheme.primary500, AppTheme.primary600];
      case ActionType.editCourses:
        return [AppTheme.teal400, AppTheme.teal600];
      case ActionType.createPost:
        return [Colors.purple.shade400, Colors.purple.shade600];
      case ActionType.createJobPost:
        return [Colors.orange.shade400, Colors.orange.shade600];
      case ActionType.applications:
        return [Colors.indigo.shade400, Colors.indigo.shade600];
    }
  }

  Widget _buildAnimatedIcon(IconData icon) {
    switch (widget.actionType) {
      case ActionType.createCourse:
        // Gentle rotation
        return AnimatedBuilder(
          animation: _iconController,
          builder: (context, child) {
            return Transform.rotate(
              angle: (_iconController.value - 0.5) * 3.14159,
              child: child!,
            );
          },
          child: Icon(icon, size: 32, color: Colors.white),
        );
      case ActionType.editCourses:
        // Pulsing scale
        return AnimatedBuilder(
          animation: _iconController,
          builder: (context, child) {
            return Transform.scale(
              scale: 1.0 + (_iconController.value * 0.1),
              child: child!,
            );
          },
          child: Icon(icon, size: 32, color: Colors.white),
        );
      case ActionType.createPost:
        // Gentle bounce
        return AnimatedBuilder(
          animation: _iconController,
          builder: (context, child) {
            return Transform.translate(
              offset: Offset(0, -(_iconController.value * 4)),
              child: child!,
            );
          },
          child: Icon(icon, size: 32, color: Colors.white),
        );
      case ActionType.createJobPost:
        // Gentle rotation
        return AnimatedBuilder(
          animation: _iconController,
          builder: (context, child) {
            return Transform.rotate(
              angle: (_iconController.value - 0.5) * 1.5708,
              child: child!,
            );
          },
          child: Icon(icon, size: 32, color: Colors.white),
        );
      case ActionType.applications:
        // Subtle rotation
        return AnimatedBuilder(
          animation: _iconController,
          builder: (context, child) {
            return Transform.rotate(
              angle: (_iconController.value - 0.5) * 2.35619,
              child: child!,
            );
          },
          child: Icon(icon, size: 32, color: Colors.white),
        );
    }
  }

  @override
  Widget build(BuildContext context) {
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
        duration: const Duration(milliseconds: 100),
        curve: Curves.easeOut,
        child: Container(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [
                Color.lerp(gradientColors[0], gradientColors[1],
                        _gradientAnimation.value) ??
                    gradientColors[0],
                Color.lerp(gradientColors[1], gradientColors[0],
                        _gradientAnimation.value) ??
                    gradientColors[1],
              ],
            ),
            borderRadius: BorderRadius.circular(16),
            boxShadow: [
              BoxShadow(
                color: gradientColors[0].withOpacity(0.4),
                blurRadius: 12,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: Material(
            color: Colors.transparent,
            child: InkWell(
              onTap: widget.onTap,
              borderRadius: BorderRadius.circular(16),
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    _buildAnimatedIcon(_getIcon()),
                    const SizedBox(height: 12),
                    Text(
                      _getTitle(),
                      textAlign: TextAlign.center,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                        height: 1.2,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        )
            .animate()
            .fadeIn(duration: 300.ms, delay: (widget.index * 100).ms)
            .slideY(
              begin: 0.2,
              end: 0,
              duration: 300.ms,
              delay: (widget.index * 100).ms,
              curve: Curves.easeOut,
            ),
      ),
    );
  }
}

