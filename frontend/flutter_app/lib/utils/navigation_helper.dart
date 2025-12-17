import 'package:flutter/material.dart';

class NavigationHelper {
  /// Handle bottom navigation tap from nested routes
  /// Pops back to root (MainNavigationWrapper) and lets it handle navigation
  static void handleBottomNavTap(BuildContext context, int index) {
    // Pop until we reach the root (MainNavigationWrapper)
    Navigator.of(context).popUntil((route) => route.isFirst);
    
    // The MainNavigationWrapper is now at the root
    // It will handle the navigation when the user interacts with it
    // For now, we just ensure we're back at the root
  }
}

