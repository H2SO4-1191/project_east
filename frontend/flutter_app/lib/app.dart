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
import 'screens/dashboard/dashboard_screen.dart';
import 'widgets/main_navigation_wrapper.dart';
import 'screens/lecturer/lecturer_courses_screen.dart';
import 'screens/lecturer/lecturer_schedule_screen.dart';
import 'screens/student/student_courses_screen.dart';
import 'screens/student/student_schedule_screen.dart';
import 'screens/institution_profile_screen.dart';
import 'screens/profile_screen.dart';
import 'screens/dashboard/my_profile_screen.dart';
import 'screens/dashboard/edit_profile_page.dart';
import 'screens/lecturer/my_profile_screen.dart';
import 'screens/lecturer/edit_profile_page.dart';
import 'screens/student/my_profile_screen.dart';
import 'screens/student/edit_profile_page.dart';
import 'widgets/protected_route.dart';

class MyApp extends StatelessWidget {
  const MyApp({super.key});

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
          initialRoute: '/',
          routes: {
            '/': (context) => const MainNavigationWrapper(),
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
            '/lecturer/schedule': (context) => const LecturerScheduleScreen(),
            '/student/courses': (context) => const StudentCoursesScreen(),
            '/student/schedule': (context) => const StudentScheduleScreen(),
            '/profile': (context) => const ProfileScreen(),
            '/lecturer/my-profile': (context) => const LecturerMyProfileScreen(),
            '/lecturer/edit-profile': (context) => const LecturerEditProfilePage(),
            '/student/my-profile': (context) => const StudentMyProfileScreen(),
            '/student/edit-profile': (context) => const StudentEditProfilePage(),
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
