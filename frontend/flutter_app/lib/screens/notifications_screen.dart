import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../config/theme.dart';
import '../providers/auth_provider.dart';
import '../services/api_service.dart';
import '../services/notification_service.dart';
import '../widgets/enhanced_loading_indicator.dart';

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen>
    with TickerProviderStateMixin {
  bool _isLoading = true;
  String? _error;
  List<dynamic> _notifications = [];
  bool _notificationsEnabled = true;
  late AnimationController _settingsCardController;
  List<AnimationController> _notificationControllers = [];

  @override
  void initState() {
    super.initState();
    _settingsCardController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 600),
    );
    _loadNotificationSettings();
    _loadNotifications();
    
    // Start settings card animation
    Future.delayed(const Duration(milliseconds: 100), () {
      if (mounted) {
        _settingsCardController.forward();
      }
    });
  }

  @override
  void dispose() {
    _settingsCardController.dispose();
    for (var controller in _notificationControllers) {
      controller.dispose();
    }
    super.dispose();
  }

  Future<void> _loadNotificationSettings() async {
    final enabled = await NotificationService().areNotificationsEnabled();
    if (mounted) {
      setState(() {
        _notificationsEnabled = enabled;
      });
    }
  }

  Future<void> _toggleNotifications(bool value) async {
    await NotificationService().setNotificationsEnabled(value);
    if (mounted) {
      setState(() {
        _notificationsEnabled = value;
      });
    }
  }

  Future<void> _loadNotifications() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      final accessToken = authProvider.accessToken;
      final refreshToken = authProvider.refreshToken;

      if (accessToken == null) {
        setState(() {
          _error = 'Please log in to view notifications';
          _isLoading = false;
        });
        return;
      }

      final data = await ApiService.getNotifications(
        accessToken: accessToken,
        refreshToken: refreshToken,
        onTokenRefreshed: (tokens) {
          authProvider.onTokenRefreshed(tokens);
        },
        onSessionExpired: () {
          authProvider.onSessionExpired();
        },
      );

      if (data['success'] == true && data['notifications'] != null) {
        final notifications = List.from(data['notifications']);
        setState(() {
          _notifications = notifications;
          _isLoading = false;
        });
        
        // Initialize animation controllers for each notification
        _notificationControllers.clear();
        for (int i = 0; i < notifications.length; i++) {
          final controller = AnimationController(
            vsync: this,
            duration: const Duration(milliseconds: 600),
          );
          _notificationControllers.add(controller);
          
          // Start animation with delay
          Future.delayed(Duration(milliseconds: 150 + (i * 100)), () {
            if (mounted && controller.value == 0) {
              controller.forward();
            }
          });
        }
      } else {
        setState(() {
          _notifications = [];
          _isLoading = false;
        });
      }
    } catch (e) {
      setState(() {
        _error = e is ApiException ? e.message : 'Failed to load notifications';
        _isLoading = false;
      });
    }
  }

  String _formatDay(String? day) {
    if (day == null) return '';
    // Capitalize first letter
    return day[0].toUpperCase() + day.substring(1);
  }

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
        title: const Text('Notifications'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadNotifications,
            tooltip: 'Refresh',
          ),
        ],
      ),
      body: _isLoading
          ? _buildLoadingState(isDark)
          : _error != null
              ? _buildErrorState(theme, isDark)
              : _notifications.isEmpty
                  ? _buildEmptyState(isDark)
                  : RefreshIndicator(
                      onRefresh: _loadNotifications,
                      color: AppTheme.primary600,
                      child: ListView(
                        padding: const EdgeInsets.all(16),
                        children: [
                          // Notification Settings Card
                          _buildNotificationSettingsCard(isDark, theme),
                          const SizedBox(height: 20),
                          // Header
                          if (_notifications.isNotEmpty) ...[
                            Row(
                              children: [
                                Container(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 12,
                                    vertical: 6,
                                  ),
                                  decoration: BoxDecoration(
                                    gradient: const LinearGradient(
                                      colors: [AppTheme.primary600, AppTheme.teal500],
                                    ),
                                    borderRadius: BorderRadius.circular(20),
                                  ),
                                  child: Text(
                                    '${_notifications.length} ${_notifications.length == 1 ? 'Reminder' : 'Reminders'}',
                                    style: const TextStyle(
                                      color: Colors.white,
                                      fontWeight: FontWeight.bold,
                                      fontSize: 12,
                                    ),
                                  ),
                                ),
                                const Spacer(),
                                Text(
                                  'Lecture Reminders',
                                  style: TextStyle(
                                    fontSize: 14,
                                    fontWeight: FontWeight.w600,
                                    color: isDark ? Colors.white70 : Colors.grey.shade600,
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 16),
                          ],
                          // Notifications List
                          ..._notifications.asMap().entries.map((entry) {
                            final index = entry.key;
                            final notification = entry.value;
                            return _buildAnimatedNotificationCard(
                              notification,
                              isDark,
                              theme,
                              index < _notificationControllers.length
                                  ? _notificationControllers[index]
                                  : null,
                            );
                          }).toList(),
                        ],
                      ),
                    ),
    );
  }

  Widget _buildLoadingState(bool isDark) {
    return Center(
      child: EnhancedLoadingIndicator(
        message: 'Loading notifications...',
        color: AppTheme.primary600,
      ),
    );
  }

  Widget _buildErrorState(ThemeData theme, bool isDark) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 80,
              height: 80,
              decoration: BoxDecoration(
                color: Colors.red.shade50,
                shape: BoxShape.circle,
              ),
              child: Icon(
                Icons.error_outline,
                size: 48,
                color: Colors.red.shade400,
              ),
            ),
            const SizedBox(height: 24),
            Text(
              'Oops! Something went wrong',
              style: theme.textTheme.titleLarge?.copyWith(
                fontWeight: FontWeight.bold,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 8),
            Text(
              _error!,
              style: theme.textTheme.bodyMedium?.copyWith(
                color: isDark ? Colors.white70 : Colors.grey.shade600,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 32),
            ElevatedButton.icon(
              onPressed: _loadNotifications,
              icon: const Icon(Icons.refresh),
              label: const Text('Retry'),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.primary600,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEmptyState(bool isDark) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 120,
              height: 120,
              decoration: BoxDecoration(
                color: isDark
                    ? AppTheme.navy800
                    : AppTheme.primary50,
                shape: BoxShape.circle,
              ),
              child: Icon(
                Icons.notifications_none_rounded,
                size: 64,
                color: isDark ? AppTheme.teal400 : AppTheme.primary600,
              ),
            ),
            const SizedBox(height: 32),
            Text(
              'All caught up!',
              style: TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.bold,
                color: isDark ? Colors.white : Colors.grey.shade800,
              ),
            ),
            const SizedBox(height: 12),
            Text(
              'You have no lecture reminders',
              style: TextStyle(
                color: isDark ? Colors.white70 : Colors.grey.shade600,
                fontSize: 16,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 8),
            Text(
              'New reminders will appear here',
              style: TextStyle(
                color: isDark ? Colors.white54 : Colors.grey.shade500,
                fontSize: 14,
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildNotificationSettingsCard(bool isDark, ThemeData theme) {
    return TweenAnimationBuilder<double>(
      tween: Tween<double>(begin: 0, end: 1),
      duration: const Duration(milliseconds: 600),
      builder: (context, value, child) {
        return Opacity(
          opacity: value,
          child: Transform.translate(
            offset: Offset(0, 20 * (1 - value)),
            child: Transform.scale(
              scale: 0.95 + (0.05 * value),
              child: child,
            ),
          ),
        );
      },
      child: Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: isDark
                ? [AppTheme.navy800, AppTheme.navy700]
                : [Colors.white, Colors.white],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: isDark
                ? AppTheme.teal500.withOpacity(0.3)
                : AppTheme.primary600.withOpacity(0.2),
            width: 1.5,
          ),
          boxShadow: [
            BoxShadow(
              color: isDark
                  ? Colors.black.withOpacity(0.3)
                  : AppTheme.primary600.withOpacity(0.1),
              blurRadius: 20,
              offset: const Offset(0, 8),
            ),
          ],
        ),
        child: Row(
          children: [
            Container(
              width: 56,
              height: 56,
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [AppTheme.primary600, AppTheme.teal500],
                ),
                borderRadius: BorderRadius.circular(16),
                boxShadow: [
                  BoxShadow(
                    color: AppTheme.primary600.withOpacity(0.3),
                    blurRadius: 12,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: const Icon(
                Icons.notifications_active_rounded,
                color: Colors.white,
                size: 28,
              ),
            ),
            const SizedBox(width: 20),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Device Notifications',
                    style: theme.textTheme.titleLarge?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    _notificationsEnabled
                        ? 'You will receive notifications on your device'
                        : 'Notifications are disabled',
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: isDark ? Colors.white70 : Colors.grey.shade600,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 12),
            Transform.scale(
              scale: 1.1,
              child: Switch(
                value: _notificationsEnabled,
                onChanged: _toggleNotifications,
                activeColor: AppTheme.primary600,
                activeTrackColor: AppTheme.teal500,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildAnimatedNotificationCard(
    Map<String, dynamic> notification,
    bool isDark,
    ThemeData theme,
    AnimationController? controller,
  ) {
    if (controller == null) {
      return _buildNotificationCard(notification, isDark, theme);
    }

    return AnimatedBuilder(
      animation: controller,
      builder: (context, child) {
        return Opacity(
          opacity: controller.value,
          child: Transform.translate(
            offset: Offset(0, 30 * (1 - controller.value)),
            child: Transform.scale(
              scale: 0.9 + (0.1 * controller.value),
              child: child,
            ),
          ),
        );
      },
      child: _buildNotificationCard(notification, isDark, theme),
    );
  }

  Widget _buildNotificationCard(
    Map<String, dynamic> notification,
    bool isDark,
    ThemeData theme,
  ) {
    final courseTitle = notification['course_title'] ?? 'Course';
    final message = notification['message'] ?? '';
    final day = notification['day'] ?? '';
    final time = notification['time'] ?? '';

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: isDark ? AppTheme.navy800 : Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: isDark
              ? AppTheme.teal500.withOpacity(0.2)
              : AppTheme.primary600.withOpacity(0.1),
          width: 1,
        ),
        boxShadow: [
          BoxShadow(
            color: isDark
                ? Colors.black.withOpacity(0.3)
                : AppTheme.primary600.withOpacity(0.08),
            blurRadius: 15,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: BorderRadius.circular(20),
          onTap: () {
            // Handle notification tap if needed
          },
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Icon with gradient background
                Container(
                  width: 56,
                  height: 56,
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      colors: [AppTheme.primary600, AppTheme.teal500],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                    borderRadius: BorderRadius.circular(16),
                    boxShadow: [
                      BoxShadow(
                        color: AppTheme.primary600.withOpacity(0.3),
                        blurRadius: 12,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  child: const Icon(
                    Icons.school_rounded,
                    color: Colors.white,
                    size: 28,
                  ),
                ),
                const SizedBox(width: 16),
                // Content
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        courseTitle,
                        style: theme.textTheme.titleLarge?.copyWith(
                          fontWeight: FontWeight.bold,
                          fontSize: 18,
                        ),
                      ),
                      if (message.isNotEmpty) ...[
                        const SizedBox(height: 8),
                        Text(
                          message,
                          style: theme.textTheme.bodyMedium?.copyWith(
                            color: isDark ? Colors.white70 : Colors.grey.shade700,
                            height: 1.5,
                          ),
                        ),
                      ],
                      if (day.isNotEmpty || time.isNotEmpty) ...[
                        const SizedBox(height: 12),
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 12,
                            vertical: 8,
                          ),
                          decoration: BoxDecoration(
                            color: isDark
                                ? AppTheme.navy700
                                : AppTheme.primary50,
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              if (day.isNotEmpty) ...[
                                Icon(
                                  Icons.calendar_today_rounded,
                                  size: 16,
                                  color: isDark
                                      ? AppTheme.teal400
                                      : AppTheme.primary600,
                                ),
                                const SizedBox(width: 6),
                                Text(
                                  _formatDay(day),
                                  style: TextStyle(
                                    fontSize: 13,
                                    fontWeight: FontWeight.w600,
                                    color: isDark
                                        ? Colors.white
                                        : AppTheme.primary700,
                                  ),
                                ),
                              ],
                              if (day.isNotEmpty && time.isNotEmpty)
                                Padding(
                                  padding: const EdgeInsets.symmetric(horizontal: 8),
                                  child: Container(
                                    width: 4,
                                    height: 4,
                                    decoration: BoxDecoration(
                                      color: isDark
                                          ? Colors.white54
                                          : AppTheme.primary600.withOpacity(0.5),
                                      shape: BoxShape.circle,
                                    ),
                                  ),
                                ),
                              if (time.isNotEmpty) ...[
                                Icon(
                                  Icons.access_time_rounded,
                                  size: 16,
                                  color: isDark
                                      ? AppTheme.teal400
                                      : AppTheme.primary600,
                                ),
                                const SizedBox(width: 6),
                                Text(
                                  time,
                                  style: TextStyle(
                                    fontSize: 13,
                                    fontWeight: FontWeight.w600,
                                    color: isDark
                                        ? Colors.white
                                        : AppTheme.primary700,
                                  ),
                                ),
                              ],
                            ],
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

