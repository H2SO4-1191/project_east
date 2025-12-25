import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:shared_preferences/shared_preferences.dart';

class NotificationService {
  static final NotificationService _instance = NotificationService._internal();
  factory NotificationService() => _instance;
  NotificationService._internal();

  final FlutterLocalNotificationsPlugin _notifications =
      FlutterLocalNotificationsPlugin();
  
  bool _isInitialized = false;
  bool _notificationsEnabled = true;

  /// Initialize the notification service
  Future<bool> initialize() async {
    if (_isInitialized) return true;

    // Request notification permission
    final permissionStatus = await _requestPermission();
    if (!permissionStatus) {
      return false;
    }

    // Android initialization settings
    const androidSettings = AndroidInitializationSettings('@mipmap/ic_launcher');
    
    // iOS initialization settings
    const iosSettings = DarwinInitializationSettings(
      requestAlertPermission: true,
      requestBadgePermission: true,
      requestSoundPermission: true,
    );

    // Combined initialization settings
    const initSettings = InitializationSettings(
      android: androidSettings,
      iOS: iosSettings,
    );

    // Initialize the plugin
    final initialized = await _notifications.initialize(
      initSettings,
      onDidReceiveNotificationResponse: _onNotificationTapped,
    );

    if (initialized == true) {
      _isInitialized = true;
      // Load notification preference
      await _loadNotificationPreference();
      return true;
    }

    return false;
  }

  /// Request notification permission
  Future<bool> _requestPermission() async {
    // For Android 13+, request notification permission
    final permissionStatus = await Permission.notification.status;
    if (permissionStatus.isDenied) {
      final status = await Permission.notification.request();
      return status.isGranted;
    }
    return permissionStatus.isGranted;
  }

  /// Check if notifications are enabled
  Future<bool> areNotificationsEnabled() async {
    await _loadNotificationPreference();
    return _notificationsEnabled;
  }

  /// Enable or disable notifications
  Future<void> setNotificationsEnabled(bool enabled) async {
    _notificationsEnabled = enabled;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('notifications_enabled', enabled);
  }

  /// Load notification preference from storage
  Future<void> _loadNotificationPreference() async {
    final prefs = await SharedPreferences.getInstance();
    _notificationsEnabled = prefs.getBool('notifications_enabled') ?? true;
  }

  /// Show a notification for lecture reminder
  Future<void> showLectureReminder({
    required String courseTitle,
    required String message,
    required String day,
    required String time,
    required int notificationId,
  }) async {
    if (!_isInitialized) {
      await initialize();
    }

    // Check if notifications are enabled
    if (!_notificationsEnabled) {
      return;
    }

    // Check permission again
    if (!await Permission.notification.isGranted) {
      return;
    }

    // Android notification details
    const androidDetails = AndroidNotificationDetails(
      'lecture_reminders',
      'Lecture Reminders',
      channelDescription: 'Notifications for upcoming lectures',
      importance: Importance.high,
      priority: Priority.high,
      showWhen: true,
      enableVibration: true,
      playSound: true,
    );

    // iOS notification details
    const iosDetails = DarwinNotificationDetails(
      presentAlert: true,
      presentBadge: true,
      presentSound: true,
    );

    // Combined notification details
    const notificationDetails = NotificationDetails(
      android: androidDetails,
      iOS: iosDetails,
    );

    // Show the notification
    await _notifications.show(
      notificationId,
      courseTitle,
      message,
      notificationDetails,
      payload: 'lecture_reminder',
    );
  }

  /// Show multiple notifications for lecture reminders
  Future<void> showLectureReminders(List<Map<String, dynamic>> notifications) async {
    if (!_isInitialized) {
      await initialize();
    }

    // Check if notifications are enabled
    if (!_notificationsEnabled) {
      return;
    }

    // Cancel all previous notifications
    await _notifications.cancelAll();

    // Show each notification with a unique ID
    for (int i = 0; i < notifications.length; i++) {
      final notification = notifications[i];
      await showLectureReminder(
        courseTitle: notification['course_title'] ?? 'Course',
        message: notification['message'] ?? '',
        day: notification['day'] ?? '',
        time: notification['time'] ?? '',
        notificationId: i,
      );
    }
  }

  /// Handle notification tap
  void _onNotificationTapped(NotificationResponse response) {
    // Handle notification tap - can navigate to notifications screen
    // This will be handled by the app's navigation system
  }

  /// Cancel all notifications
  Future<void> cancelAll() async {
    await _notifications.cancelAll();
  }

  /// Cancel a specific notification
  Future<void> cancel(int notificationId) async {
    await _notifications.cancel(notificationId);
  }
}

