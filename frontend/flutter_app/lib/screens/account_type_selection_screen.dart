import 'package:flutter/material.dart';
import '../config/theme.dart';
import '../widgets/animated_background.dart';

class AccountTypeSelectionScreen extends StatelessWidget {
  const AccountTypeSelectionScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: isDark ? AppTheme.navy900 : const Color(0xFFF9FAFB),
      appBar: AppBar(
        elevation: 0,
        backgroundColor: isDark ? AppTheme.navy800 : Colors.white,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => Navigator.pop(context),
        ),
        title: const Text('Choose Account Type'),
      ),
      body: AnimatedBackground(
        child: SafeArea(
          child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const SizedBox(height: 24),
              Text(
                'Select your account type',
                style: theme.textTheme.titleLarge?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 8),
              Text(
                'Choose the option that best describes you',
                style: theme.textTheme.bodyMedium?.copyWith(
                  color: Colors.grey.shade600,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 40),
              _buildAnimatedCard(
                delay: 0,
                child: _buildAccountTypeCard(
                  context,
                  isDark,
                  icon: Icons.school,
                  title: 'Student',
                  description: 'Join courses and track your progress',
                  color: AppTheme.primary600,
                  onTap: () {
                    Navigator.pushNamed(context, '/signup/student');
                  },
                ),
              ),
              const SizedBox(height: 16),
              _buildAnimatedCard(
                delay: 100,
                child: _buildAccountTypeCard(
                  context,
                  isDark,
                  icon: Icons.person,
                  title: 'Lecturer',
                  description: 'Teach courses and manage students',
                  color: AppTheme.teal500,
                  onTap: () {
                    Navigator.pushNamed(context, '/signup/lecturer');
                  },
                ),
              ),
              const SizedBox(height: 16),
              _buildAnimatedCard(
                delay: 200,
                child: _buildAccountTypeCard(
                  context,
                  isDark,
                  icon: Icons.business,
                  title: 'Institution',
                  description: 'Manage your educational institution',
                  color: AppTheme.gold500,
                  onTap: () {
                    Navigator.pushNamed(context, '/signup/institution');
                  },
                ),
              ),
            ],
          ),
        ),
        ),
      ),
    );
  }

  Widget _buildAccountTypeCard(
    BuildContext context,
    bool isDark, {
    required IconData icon,
    required String title,
    required String description,
    required Color color,
    required VoidCallback onTap,
  }) {
    return Card(
      elevation: 2,
      color: isDark ? AppTheme.navy800 : Colors.white,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
      ),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Row(
            children: [
              Container(
                width: 56,
                height: 56,
                decoration: BoxDecoration(
                  color: color.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(
                  icon,
                  color: color,
                  size: 28,
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      description,
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: Colors.grey.shade600,
                      ),
                    ),
                  ],
                ),
              ),
              Icon(
                Icons.arrow_forward_ios,
                size: 16,
                color: Colors.grey.shade400,
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildAnimatedCard({required int delay, required Widget child}) {
    return _DelayedAnimatedCard(delay: delay, child: child);
  }
}

class _DelayedAnimatedCard extends StatefulWidget {
  final int delay;
  final Widget child;

  const _DelayedAnimatedCard({
    required this.delay,
    required this.child,
  });

  @override
  State<_DelayedAnimatedCard> createState() => _DelayedAnimatedCardState();
}

class _DelayedAnimatedCardState extends State<_DelayedAnimatedCard>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _animation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: const Duration(milliseconds: 800),
      vsync: this,
    );
    _animation = CurvedAnimation(
      parent: _controller,
      curve: Curves.easeOut,
    );
    
    // Start animation after delay
    Future.delayed(Duration(milliseconds: widget.delay), () {
      if (mounted) {
        _controller.forward();
      }
    });
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _animation,
      builder: (context, child) {
        return Opacity(
          opacity: _animation.value,
          child: Transform.translate(
            offset: Offset(0, 30 * (1 - _animation.value)),
            child: Transform.scale(
              scale: 0.9 + (0.1 * _animation.value),
              child: child,
            ),
          ),
        );
      },
      child: widget.child,
    );
  }
}

