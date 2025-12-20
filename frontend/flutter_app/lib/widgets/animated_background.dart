import 'package:flutter/material.dart';
import 'dart:math' as math;

class AnimatedBackground extends StatefulWidget {
  final Widget child;

  const AnimatedBackground({super.key, required this.child});

  @override
  State<AnimatedBackground> createState() => _AnimatedBackgroundState();
}

class _AnimatedBackgroundState extends State<AnimatedBackground>
    with TickerProviderStateMixin {
  late List<AnimationController> _controllers;
  late List<Animation<double>> _animations;

  @override
  void initState() {
    super.initState();
    _controllers = List.generate(
      5,
      (index) => AnimationController(
        duration: Duration(seconds: 15 + index * 2),
        vsync: this,
      )..repeat(reverse: true),
    );

    _animations = _controllers.map((controller) {
      return Tween<double>(begin: 0, end: 1).animate(
        CurvedAnimation(parent: controller, curve: Curves.easeInOut),
      );
    }).toList();
  }

  @override
  void dispose() {
    for (var controller in _controllers) {
      controller.dispose();
    }
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Stack(
      children: [
        // Background color - solid to match feed screen
        Container(
          color: isDark
              ? const Color(0xFF102A43) // navy900 - solid, no gradient
              : const Color(0xFFF9FAFB), // gray50
        ),
        // Animated circles
        ...List.generate(5, (index) {
          return AnimatedBuilder(
            animation: _animations[index],
            builder: (context, child) {
              return Positioned(
                left: _getPosition(index, _animations[index].value, true),
                top: _getPosition(index, _animations[index].value, false),
                child: Opacity(
                  opacity: isDark ? 0.1 : 0.2,
                  child: Container(
                    width: 200 + index * 50,
                    height: 200 + index * 50,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      gradient: RadialGradient(
                        colors: [
                          _getColor(index, isDark),
                          _getColor(index, isDark).withOpacity(0),
                        ],
                      ),
                    ),
                  ),
                ),
              );
            },
          );
        }),
        // Content
        widget.child,
      ],
    );
  }

  double _getPosition(int index, double value, bool isX) {
    final size = MediaQuery.of(context).size;
    final dimension = isX ? size.width : size.height;
    final offset = math.sin(value * 2 * math.pi + index) * 100;
    return (dimension / 4) * index + offset;
  }

  Color _getColor(int index, bool isDark) {
    final colors = isDark
        ? [
            const Color(0xFF14B8A6), // teal500
            const Color(0xFF2DD4BF), // teal400
            const Color(0xFF0D9488), // teal600
            const Color(0xFF5EEAD4), // teal300
            const Color(0xFF0F766E), // teal700
          ]
        : [
            const Color(0xFF3B82F6), // primary500
            const Color(0xFF14B8A6), // teal500
            const Color(0xFF60A5FA), // primary400
            const Color(0xFF2DD4BF), // teal400
            const Color(0xFF93C5FD), // primary300
          ];
    return colors[index % colors.length];
  }
}

