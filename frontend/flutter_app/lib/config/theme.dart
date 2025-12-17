import 'package:flutter/material.dart';

class AppTheme {
  // Primary Colors
  static const Color primary50 = Color(0xFFEFF6FF);
  static const Color primary100 = Color(0xFFDBEAFE);
  static const Color primary200 = Color(0xFFBFDBFE);
  static const Color primary300 = Color(0xFF93C5FD);
  static const Color primary400 = Color(0xFF60A5FA);
  static const Color primary500 = Color(0xFF3B82F6);
  static const Color primary600 = Color(0xFF2563EB);
  static const Color primary700 = Color(0xFF1D4ED8);
  static const Color primary800 = Color(0xFF1E40AF);
  static const Color primary900 = Color(0xFF1E3A8A);

  // Navy Colors
  static const Color navy50 = Color(0xFFF0F4F8);
  static const Color navy100 = Color(0xFFD9E2EC);
  static const Color navy200 = Color(0xFFBCCCDC);
  static const Color navy300 = Color(0xFF9FB3C8);
  static const Color navy400 = Color(0xFF829AB1);
  static const Color navy500 = Color(0xFF627D98);
  static const Color navy600 = Color(0xFF486581);
  static const Color navy700 = Color(0xFF334E68);
  static const Color navy800 = Color(0xFF243B53);
  static const Color navy900 = Color(0xFF102A43);

  // Teal Colors
  static const Color teal50 = Color(0xFFF0FDFA);
  static const Color teal100 = Color(0xFFCCFBF1);
  static const Color teal200 = Color(0xFF99F6E4);
  static const Color teal300 = Color(0xFF5EEAD4);
  static const Color teal400 = Color(0xFF2DD4BF);
  static const Color teal500 = Color(0xFF14B8A6);
  static const Color teal600 = Color(0xFF0D9488);
  static const Color teal700 = Color(0xFF0F766E);
  static const Color teal800 = Color(0xFF115E59);
  static const Color teal900 = Color(0xFF134E4A);

  // Gold Colors
  static const Color gold50 = Color(0xFFFFFBEB);
  static const Color gold100 = Color(0xFFFEF3C7);
  static const Color gold200 = Color(0xFFFDE68A);
  static const Color gold300 = Color(0xFFFCD34D);
  static const Color gold400 = Color(0xFFFBBF24);
  static const Color gold500 = Color(0xFFF59E0B);
  static const Color gold600 = Color(0xFFD97706);
  static const Color gold700 = Color(0xFFB45309);
  static const Color gold800 = Color(0xFF92400E);
  static const Color gold900 = Color(0xFF78350F);

  // Light Theme
  static ThemeData lightTheme = ThemeData(
    useMaterial3: true,
    brightness: Brightness.light,
    primaryColor: primary600,
    scaffoldBackgroundColor: const Color(0xFFF9FAFB),
    colorScheme: ColorScheme.fromSeed(
      seedColor: primary600,
      primary: primary600,
      secondary: teal500,
      tertiary: gold500,
      error: const Color(0xFFDC2626),
      surface: Colors.white,
      onPrimary: Colors.white,
      onSecondary: Colors.white,
      onTertiary: Colors.white,
      onError: Colors.white,
      onSurface: const Color(0xFF111827),
      onSurfaceVariant: const Color(0xFF6B7280),
      outline: const Color(0xFFE5E7EB),
      outlineVariant: const Color(0xFFF3F4F6),
      shadow: Colors.black,
      scrim: Colors.black,
      inverseSurface: const Color(0xFF111827),
      onInverseSurface: Colors.white,
      inversePrimary: primary300,
      surfaceTint: primary600,
    ).copyWith(
      // Material 3 Surface Colors
      surfaceContainerHighest: const Color(0xFFF3F4F6),
      surfaceContainerHigh: const Color(0xFFF9FAFB),
      surfaceContainer: Colors.white,
      surfaceContainerLow: const Color(0xFFF9FAFB),
      surfaceContainerLowest: Colors.white,
      surfaceDim: const Color(0xFFE5E7EB),
      surfaceBright: Colors.white,
      surfaceVariant: const Color(0xFFF3F4F6),
    ),
    appBarTheme: const AppBarTheme(
      elevation: 0,
      backgroundColor: Colors.white,
      foregroundColor: Color(0xFF111827),
      iconTheme: IconThemeData(color: Color(0xFF111827)),
      centerTitle: false,
      titleTextStyle: TextStyle(
        fontSize: 20,
        fontWeight: FontWeight.w600,
        color: Color(0xFF111827),
      ),
    ),
    navigationBarTheme: NavigationBarThemeData(
      elevation: 8,
      height: 72,
      backgroundColor: Colors.white,
      indicatorColor: primary50,
      labelTextStyle: MaterialStateProperty.resolveWith((states) {
        if (states.contains(MaterialState.selected)) {
          return const TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w600,
            color: primary600,
          );
        }
        return const TextStyle(
          fontSize: 12,
          fontWeight: FontWeight.normal,
          color: Color(0xFF6B7280),
        );
      }),
      iconTheme: MaterialStateProperty.resolveWith((states) {
        if (states.contains(MaterialState.selected)) {
          return const IconThemeData(color: primary600, size: 24);
        }
        return const IconThemeData(color: Color(0xFF6B7280), size: 24);
      }),
    ),
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: primary600,
        foregroundColor: Colors.white,
        elevation: 2,
        shadowColor: primary500.withOpacity(0.3),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
        ),
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
      ),
    ),
    filledButtonTheme: FilledButtonThemeData(
      style: FilledButton.styleFrom(
        backgroundColor: primary600,
        foregroundColor: Colors.white,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
        ),
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
      ),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        foregroundColor: primary600,
        side: const BorderSide(color: primary600, width: 1.5),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
        ),
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
      ),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: Colors.white,
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide(color: Colors.grey.shade300),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide(color: Colors.grey.shade300),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: primary500, width: 2),
      ),
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
    ),
    textTheme: const TextTheme(
      displayLarge: TextStyle(fontSize: 32, fontWeight: FontWeight.bold, color: Color(0xFF111827)),
      displayMedium: TextStyle(fontSize: 28, fontWeight: FontWeight.bold, color: Color(0xFF111827)),
      displaySmall: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Color(0xFF111827)),
      headlineLarge: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Color(0xFF111827)),
      headlineMedium: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Color(0xFF111827)),
      titleLarge: TextStyle(fontSize: 18, fontWeight: FontWeight.w600, color: Color(0xFF111827)),
      titleMedium: TextStyle(fontSize: 16, fontWeight: FontWeight.w600, color: Color(0xFF111827)),
      bodyLarge: TextStyle(fontSize: 16, color: Color(0xFF374151)),
      bodyMedium: TextStyle(fontSize: 14, color: Color(0xFF374151)),
      bodySmall: TextStyle(fontSize: 12, color: Color(0xFF6B7280)),
    ),
  );

  // Dark Theme
  static ThemeData darkTheme = ThemeData(
    useMaterial3: true,
    brightness: Brightness.dark,
    primaryColor: teal500,
    scaffoldBackgroundColor: navy900,
    colorScheme: ColorScheme.fromSeed(
      seedColor: teal500,
      brightness: Brightness.dark,
      primary: teal500,
      secondary: primary500,
      tertiary: gold500,
      error: const Color(0xFFEF4444),
      surface: navy800,
      onPrimary: Colors.white,
      onSecondary: Colors.white,
      onTertiary: Colors.white,
      onError: Colors.white,
      onSurface: Colors.white,
      onSurfaceVariant: const Color(0xFF9CA3AF),
      outline: navy600,
      outlineVariant: navy700,
      shadow: Colors.black,
      scrim: Colors.black,
      inverseSurface: Colors.white,
      onInverseSurface: navy900,
      inversePrimary: teal700,
      surfaceTint: teal500,
    ).copyWith(
      // Material 3 Surface Colors
      surfaceContainerHighest: navy700,
      surfaceContainerHigh: navy800,
      surfaceContainer: navy800,
      surfaceContainerLow: navy900,
      surfaceContainerLowest: navy900,
      surfaceDim: navy900,
      surfaceBright: navy700,
      surfaceVariant: navy700,
    ),
    appBarTheme: const AppBarTheme(
      elevation: 0,
      backgroundColor: navy800,
      foregroundColor: Colors.white,
      iconTheme: IconThemeData(color: Colors.white),
      centerTitle: false,
      titleTextStyle: TextStyle(
        fontSize: 20,
        fontWeight: FontWeight.w600,
        color: Colors.white,
      ),
    ),
    navigationBarTheme: NavigationBarThemeData(
      elevation: 8,
      height: 72,
      backgroundColor: navy800,
      indicatorColor: navy700,
      labelTextStyle: MaterialStateProperty.resolveWith((states) {
        if (states.contains(MaterialState.selected)) {
          return const TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w600,
            color: teal500,
          );
        }
        return const TextStyle(
          fontSize: 12,
          fontWeight: FontWeight.normal,
          color: Color(0xFF9CA3AF),
        );
      }),
      iconTheme: MaterialStateProperty.resolveWith((states) {
        if (states.contains(MaterialState.selected)) {
          return const IconThemeData(color: teal500, size: 24);
        }
        return const IconThemeData(color: Color(0xFF9CA3AF), size: 24);
      }),
    ),
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: teal500,
        foregroundColor: Colors.white,
        elevation: 2,
        shadowColor: teal500.withOpacity(0.3),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
        ),
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
      ),
    ),
    filledButtonTheme: FilledButtonThemeData(
      style: FilledButton.styleFrom(
        backgroundColor: teal500,
        foregroundColor: Colors.white,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
        ),
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
      ),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        foregroundColor: teal500,
        side: const BorderSide(color: teal500, width: 1.5),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
        ),
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
      ),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: navy700,
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: navy600),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: navy600),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: teal500, width: 2),
      ),
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
    ),
    textTheme: const TextTheme(
      displayLarge: TextStyle(fontSize: 32, fontWeight: FontWeight.bold, color: Colors.white),
      displayMedium: TextStyle(fontSize: 28, fontWeight: FontWeight.bold, color: Colors.white),
      displaySmall: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Colors.white),
      headlineLarge: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Colors.white),
      headlineMedium: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Colors.white),
      titleLarge: TextStyle(fontSize: 18, fontWeight: FontWeight.w600, color: Colors.white),
      titleMedium: TextStyle(fontSize: 16, fontWeight: FontWeight.w600, color: Colors.white),
      bodyLarge: TextStyle(fontSize: 16, color: Color(0xFFD1D5DB)),
      bodyMedium: TextStyle(fontSize: 14, color: Color(0xFFD1D5DB)),
      bodySmall: TextStyle(fontSize: 12, color: Color(0xFF9CA3AF)),
    ),
  );
}

