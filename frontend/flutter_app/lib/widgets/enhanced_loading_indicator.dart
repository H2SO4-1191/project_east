import 'package:flutter/material.dart';
import '../config/theme.dart';

class EnhancedLoadingIndicator extends StatefulWidget {
  final String? message;
  final double size;
  final Color? color;

  const EnhancedLoadingIndicator({
    super.key,
    this.message,
    this.size = 50.0,
    this.color,
  });

  @override
  State<EnhancedLoadingIndicator> createState() => _EnhancedLoadingIndicatorState();
}

class _EnhancedLoadingIndicatorState extends State<EnhancedLoadingIndicator>
    with TickerProviderStateMixin {
  late AnimationController _rotationController;
  late AnimationController _pulseController;
  late AnimationController _fadeController;
  
  late Animation<double> _rotationAnimation;
  late Animation<double> _pulseAnimation;
  late Animation<double> _fadeAnimation;

  @override
  void initState() {
    super.initState();

    // Rotation animation - smooth continuous rotation
    _rotationController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1200),
    )..repeat();

    // Pulse animation - breathing effect
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1500),
    )..repeat(reverse: true);

    // Fade animation for dots
    _fadeController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1200),
    )..repeat();

    _rotationAnimation = Tween<double>(
      begin: 0.0,
      end: 1.0,
    ).animate(CurvedAnimation(
      parent: _rotationController,
      curve: Curves.linear,
    ));

    _pulseAnimation = Tween<double>(
      begin: 0.8,
      end: 1.2,
    ).animate(CurvedAnimation(
      parent: _pulseController,
      curve: Curves.easeInOut,
    ));

    _fadeAnimation = TweenSequence<double>([
      TweenSequenceItem(
        tween: Tween<double>(begin: 0.3, end: 1.0)
            .chain(CurveTween(curve: Curves.easeIn)),
        weight: 0.33,
      ),
      TweenSequenceItem(
        tween: Tween<double>(begin: 1.0, end: 0.3)
            .chain(CurveTween(curve: Curves.easeOut)),
        weight: 0.33,
      ),
      TweenSequenceItem(
        tween: Tween<double>(begin: 0.3, end: 0.3),
        weight: 0.34,
      ),
    ]).animate(CurvedAnimation(
      parent: _fadeController,
      curve: Curves.linear,
    ));
  }

  @override
  void dispose() {
    _rotationController.dispose();
    _pulseController.dispose();
    _fadeController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final color = widget.color ?? (isDark ? AppTheme.teal400 : AppTheme.primary600);

    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      mainAxisSize: MainAxisSize.min,
      children: [
        AnimatedBuilder(
          animation: Listenable.merge([
            _rotationAnimation,
            _pulseAnimation,
          ]),
          builder: (context, child) {
            return Transform.scale(
              scale: _pulseAnimation.value,
              child: Transform.rotate(
                angle: _rotationAnimation.value * 2 * 3.14159,
                child: Container(
                  width: widget.size,
                  height: widget.size,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    gradient: LinearGradient(
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                      colors: [
                        color,
                        isDark ? AppTheme.teal500 : AppTheme.primary500,
                        color.withOpacity(0.6),
                      ],
                      stops: const [0.0, 0.5, 1.0],
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: color.withOpacity(0.3),
                        blurRadius: 20,
                        spreadRadius: 5,
                      ),
                    ],
                  ),
                  child: Stack(
                    children: [
                      // Outer rotating ring
                      AnimatedBuilder(
                        animation: _rotationAnimation,
                        builder: (context, child) {
                          return CustomPaint(
                            painter: _LoadingRingPainter(
                              progress: _rotationAnimation.value,
                              color: color,
                              strokeWidth: 4.0,
                            ),
                          );
                        },
                      ),
                      // Inner pulsing circle
                      Center(
                        child: AnimatedBuilder(
                          animation: _pulseAnimation,
                          builder: (context, child) {
                            return Container(
                              width: widget.size * 0.4,
                              height: widget.size * 0.4,
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                color: color.withOpacity(0.3 * _pulseAnimation.value),
                              ),
                            );
                          },
                        ),
                      ),
                      // Center dot
                      Center(
                        child: Container(
                          width: widget.size * 0.15,
                          height: widget.size * 0.15,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: color,
                            boxShadow: [
                              BoxShadow(
                                color: color.withOpacity(0.5),
                                blurRadius: 8,
                                spreadRadius: 2,
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            );
          },
        ),
        if (widget.message != null) ...[
          const SizedBox(height: 24),
          AnimatedBuilder(
            animation: _fadeAnimation,
            builder: (context, child) {
              return Opacity(
                opacity: _fadeAnimation.value,
                child: Text(
                  widget.message!,
                  style: TextStyle(
                    fontSize: 14,
                    color: isDark ? Colors.white70 : Colors.grey.shade600,
                    fontWeight: FontWeight.w500,
                  ),
                  textAlign: TextAlign.center,
                ),
              );
            },
          ),
        ],
      ],
    );
  }
}

class _LoadingRingPainter extends CustomPainter {
  final double progress;
  final Color color;
  final double strokeWidth;

  _LoadingRingPainter({
    required this.progress,
    required this.color,
    required this.strokeWidth,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final radius = size.width / 2 - strokeWidth / 2;

    // Draw the background ring
    final backgroundPaint = Paint()
      ..color = color.withOpacity(0.1)
      ..style = PaintingStyle.stroke
      ..strokeWidth = strokeWidth
      ..strokeCap = StrokeCap.round;

    canvas.drawCircle(center, radius, backgroundPaint);

    // Draw the animated arc
    final paint = Paint()
      ..color = color
      ..style = PaintingStyle.stroke
      ..strokeWidth = strokeWidth
      ..strokeCap = StrokeCap.round;

    final sweepAngle = 2 * 3.14159 * 0.6; // 60% of the circle
    final startAngle = -3.14159 / 2 + (progress * 2 * 3.14159);

    canvas.drawArc(
      Rect.fromCircle(center: center, radius: radius),
      startAngle,
      sweepAngle,
      false,
      paint,
    );
  }

  @override
  bool shouldRepaint(_LoadingRingPainter oldDelegate) {
    return oldDelegate.progress != progress ||
        oldDelegate.color != color ||
        oldDelegate.strokeWidth != strokeWidth;
  }
}

// Convenience widget for full-screen loading
class FullScreenLoading extends StatelessWidget {
  final String? message;
  final Color? backgroundColor;

  const FullScreenLoading({
    super.key,
    this.message,
    this.backgroundColor,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final bgColor = backgroundColor ??
        (isDark ? AppTheme.navy900 : const Color(0xFFF9FAFB));

    return Container(
      color: bgColor,
      child: Center(
        child: EnhancedLoadingIndicator(
          message: message ?? 'Loading...',
          size: 60.0,
        ),
      ),
    );
  }
}

// Small loading indicator for buttons and inline use
class SmallLoadingIndicator extends StatelessWidget {
  final Color? color;
  final double size;

  const SmallLoadingIndicator({
    super.key,
    this.color,
    this.size = 20.0,
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: size,
      height: size,
      child: EnhancedLoadingIndicator(
        size: size,
        color: color,
      ),
    );
  }
}

