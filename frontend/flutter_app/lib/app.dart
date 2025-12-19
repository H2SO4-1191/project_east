import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:provider/provider.dart';
import 'config/theme.dart';
import 'providers/theme_provider.dart';
import 'providers/language_provider.dart';
import 'screens/home_screen.dart';
import 'screens/login_screen.dart';
import 'screens/signup_screen.dart';
import 'screens/signup_student_screen.dart';
import 'screens/signup_lecturer_screen.dart';
import 'screens/account_type_selection_screen.dart';
import 'screens/otp_screen.dart';
import 'screens/explore_screen.dart';
import 'screens/onboarding_screen.dart';
import 'screens/dashboard/dashboard_screen.dart';
import 'widgets/main_navigation_wrapper.dart';
import 'screens/lecturer/lecturer_courses_screen.dart';
import 'screens/lecturer/lecturer_course_detail_screen.dart';
import 'screens/lecturer/lecturer_schedule_screen.dart';
import 'screens/student/student_courses_screen.dart';
import 'screens/student/student_schedule_screen.dart';
import 'screens/student/course_details_screen.dart';
import 'screens/student/enroll_course_screen.dart';
import 'screens/course_details_screen.dart';
import 'screens/institution_profile_screen.dart';
import 'screens/profile_screen.dart';
import 'screens/lecturer/my_profile_screen.dart';
import 'screens/lecturer/edit_profile_page.dart';
import 'screens/student/my_profile_screen.dart';
import 'screens/student/edit_profile_page.dart';
import 'screens/student/verify_screen.dart';
import 'screens/lecturer/verify_screen.dart';
import 'screens/institution/verify_screen.dart';
import 'widgets/protected_route.dart';

class MyApp extends StatelessWidget {
  final bool showOnboarding;

  const MyApp({super.key, this.showOnboarding = false});

  @override
  Widget build(BuildContext context) {
    return Consumer2<ThemeProvider, LanguageProvider>(
      builder: (context, themeProvider, languageProvider, child) {
        // Set system UI overlay style based on theme
        SystemChrome.setSystemUIOverlayStyle(
          SystemUiOverlayStyle(
            statusBarColor: Colors.transparent,
            statusBarIconBrightness: themeProvider.isDark ? Brightness.light : Brightness.dark,
            systemNavigationBarColor: themeProvider.isDark 
                ? AppTheme.navy900 
                : Colors.white,
            systemNavigationBarIconBrightness: themeProvider.isDark ? Brightness.light : Brightness.dark,
          ),
        );

        return MaterialApp(
          title: 'Project East',
          debugShowCheckedModeBanner: false,
          locale: languageProvider.locale,
          supportedLocales: const [
            Locale('en', ''), // English
            Locale('ar', ''), // Arabic
          ],
          localizationsDelegates: const [
            GlobalMaterialLocalizations.delegate,
            GlobalWidgetsLocalizations.delegate,
            GlobalCupertinoLocalizations.delegate,
          ],
          builder: (context, child) {
            return Directionality(
              textDirection: languageProvider.isArabic ? TextDirection.rtl : TextDirection.ltr,
              child: child!,
            );
          },
          theme: AppTheme.lightTheme.copyWith(
            pageTransitionsTheme: const PageTransitionsTheme(
              builders: {
                TargetPlatform.android: CupertinoPageTransitionsBuilder(),
                TargetPlatform.iOS: CupertinoPageTransitionsBuilder(),
              },
            ),
          ),
          darkTheme: AppTheme.darkTheme.copyWith(
            pageTransitionsTheme: const PageTransitionsTheme(
              builders: {
                TargetPlatform.android: CupertinoPageTransitionsBuilder(),
                TargetPlatform.iOS: CupertinoPageTransitionsBuilder(),
              },
            ),
          ),
          themeMode: themeProvider.isDark ? ThemeMode.dark : ThemeMode.light,
          initialRoute: showOnboarding ? '/onboarding' : '/',
          routes: {
            '/': (context) => const MainNavigationWrapper(),
            '/onboarding': (context) => const OnboardingScreen(),
            '/home': (context) => const HomeScreen(),
            '/login': (context) => const LoginScreen(),
            '/signup': (context) => const SignupScreen(),
            '/signup/student': (context) => const SignupStudentScreen(),
            '/signup/lecturer': (context) => const SignupLecturerScreen(),
            '/signup/institution': (context) => const SignupScreen(),
            '/account-type-selection': (context) => const AccountTypeSelectionScreen(),
            '/otp': (context) => const OTPScreen(),
            '/explore': (context) => const ExploreScreen(),
            '/dashboard': (context) => const ProtectedRoute(
              requireInstitution: true,
              child: DashboardScreen(),
            ),
            '/lecturer/courses': (context) => const LecturerCoursesScreen(),
            '/lecturer/course-detail': (context) => const LecturerCourseDetailScreen(),
            '/lecturer/schedule': (context) => const LecturerScheduleScreen(),
            '/student/courses': (context) => const StudentCoursesScreen(),
            '/student/schedule': (context) => const StudentScheduleScreen(),
            '/student/course': (context) {
              final args = ModalRoute.of(context)!.settings.arguments;
              final courseId = args is int
                  ? args
                  : (args is String
                      ? int.tryParse(args)
                      : (args is Map<String, dynamic>
                          ? args['courseId'] as int?
                          : null));
              if (courseId == null) {
                return const Scaffold(
                  body: Center(child: Text('Invalid course ID')),
                );
              }
              return CourseDetailsScreen(courseId: courseId);
            },
            '/student/enroll': (context) {
              final args = ModalRoute.of(context)!.settings.arguments;
              final courseId = args is int
                  ? args
                  : (args is String
                      ? int.tryParse(args)
                      : (args is Map<String, dynamic>
                          ? args['courseId'] as int?
                          : null));
              if (courseId == null) {
                return const Scaffold(
                  body: Center(child: Text('Invalid course ID')),
                );
              }
              return EnrollCourseScreen(courseId: courseId);
            },
            '/course': (context) {
              final args = ModalRoute.of(context)!.settings.arguments;
              final courseId = args is int
                  ? args
                  : (args is String
                      ? int.tryParse(args)
                      : (args is Map<String, dynamic>
                          ? args['courseId'] as int?
                          : null));
              if (courseId == null) {
                return const Scaffold(
                  body: Center(child: Text('Invalid course ID')),
                );
              }
              return PublicCourseDetailsScreen(courseId: courseId);
            },
            '/profile': (context) => const ProfileScreen(),
            '/lecturer/my-profile': (context) => const LecturerMyProfileScreen(),
            '/lecturer/edit-profile': (context) => const LecturerEditProfilePage(),
            '/student/my-profile': (context) => const StudentMyProfileScreen(),
            '/student/edit-profile': (context) => const StudentEditProfilePage(),
            '/student/verify': (context) => const StudentVerifyScreen(),
            '/lecturer/verify': (context) => const LecturerVerifyScreen(),
            '/institution/verify': (context) => const InstitutionVerifyScreen(),
            '/institution-profile': (context) {
              final args = ModalRoute.of(context)!.settings.arguments;
              return InstitutionProfileScreen(
                username: args is String ? args : args.toString(),
              );
            },
          },
        );
      },
    );
  }
}
