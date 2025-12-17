import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../screens/login_screen.dart';
import '../widgets/main_navigation_wrapper.dart';

/// A widget that protects routes requiring authentication
/// Redirects to login if user is not authenticated
/// Optionally restricts access to institutions only
class ProtectedRoute extends StatelessWidget {
  final Widget child;
  final bool requireInstitution;

  const ProtectedRoute({
    super.key,
    required this.child,
    this.requireInstitution = false,
  });

  @override
  Widget build(BuildContext context) {
    return Consumer<AuthProvider>(
      builder: (context, authProvider, _) {
        // Check if user is authenticated
        if (!authProvider.isAuthenticated || 
            authProvider.accessToken == null || 
            authProvider.accessToken!.isEmpty) {
          // Redirect to login if not authenticated
          WidgetsBinding.instance.addPostFrameCallback((_) {
            Navigator.of(context).pushReplacement(
              MaterialPageRoute(
                builder: (context) => const LoginScreen(),
              ),
            );
          });
          
          // Show loading indicator while redirecting
          return const Scaffold(
            body: Center(
              child: CircularProgressIndicator(),
            ),
          );
        }

        // Check if institution access is required (for Dashboard)
        if (requireInstitution && authProvider.instituteData['userType'] != 'institution') {
          // Redirect non-institutions to main navigation
          WidgetsBinding.instance.addPostFrameCallback((_) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text('Dashboard access is only available for institutions'),
                backgroundColor: Colors.red,
              ),
            );
            Navigator.of(context).pushReplacement(
              MaterialPageRoute(
                builder: (context) => const MainNavigationWrapper(),
              ),
            );
          });
          
          // Show loading indicator while redirecting
          return const Scaffold(
            body: Center(
              child: CircularProgressIndicator(),
            ),
          );
        }

        // User is authenticated and authorized, show the protected content
        return child;
      },
    );
  }
}


