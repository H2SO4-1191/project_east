# Project East Flutter App - Setup Guide

## Prerequisites

Before you begin, ensure you have the following installed:

1. **Flutter SDK** (3.0.0 or higher)
   - Download from: https://flutter.dev/docs/get-started/install
   - Verify installation: `flutter --version`

2. **Android Studio** or **VS Code** with Flutter extensions

3. **Android SDK** (for Android development)
   - Install via Android Studio
   - Set up Android emulator or connect physical device

## Installation Steps

### 1. Navigate to the Flutter project directory

```bash
cd /home/mohammed/Documents/GitHub/project_east/frontend/flutter
```

### 2. Install dependencies

```bash
flutter pub get
```

### 3. Verify Flutter installation

```bash
flutter doctor
```

Fix any issues reported by Flutter Doctor before proceeding.

### 4. Run the app

#### On Android Emulator:
```bash
flutter run
```

#### On specific device:
```bash
# List available devices
flutter devices

# Run on specific device
flutter run -d <device_id>
```

#### Build APK for testing:
```bash
flutter build apk --debug
```

#### Build release APK:
```bash
flutter build apk --release
```

## Project Structure

```
lib/
├── main.dart                 # App entry point
├── app.dart                  # Main app widget with routing
├── config/
│   └── theme.dart           # Theme configuration (colors, styles)
├── providers/
│   ├── theme_provider.dart  # Theme state management
│   └── institute_provider.dart # Institute data management
├── models/
│   ├── student.dart         # Student data model
│   ├── teacher.dart         # Teacher data model
│   ├── employee.dart        # Employee data model
│   ├── schedule.dart        # Schedule data model
│   └── invoice.dart         # Invoice data model
├── data/
│   └── demo_data.dart       # Demo data for the app
├── widgets/
│   ├── card_widget.dart     # Reusable card widget
│   ├── animated_button.dart # Animated button widget
│   ├── animated_background.dart # Animated background
│   └── animated_counter.dart # Animated counter widget
├── screens/
│   ├── home_screen.dart     # Home/Landing page
│   ├── login_screen.dart    # Login page
│   ├── otp_screen.dart      # OTP verification page
│   └── dashboard/
│       ├── dashboard_screen.dart # Main dashboard
│       ├── overview_page.dart    # Overview tab
│       ├── students_page.dart    # Students management
│       ├── teachers_page.dart    # Teachers management
│       ├── employees_page.dart   # Employees management
│       ├── schedule_page.dart    # Schedule management
│       ├── finance_page.dart     # Finance tracking
│       └── settings_page.dart    # Settings page
```

## Features

- ✅ **Authentication Flow**
  - Home page with sign-in options
  - Login with email
  - OTP verification (Demo: 200471)

- ✅ **Dashboard**
  - Responsive sidebar navigation
  - Overview with charts and statistics
  - Students management
  - Teachers management
  - Employees management
  - Schedule management
  - Finance tracking
  - Settings

- ✅ **Theme Support**
  - Light/Dark mode toggle
  - Persistent theme preference
  - Smooth theme transitions

- ✅ **State Management**
  - Provider for state management
  - Persistent storage with SharedPreferences

- ✅ **Responsive Design**
  - Adaptive layouts for different screen sizes
  - Mobile-first design
  - Tablet and desktop support

## Demo Credentials

**Email:** demo@east.edu  
**Verification Code:** 200471

## Color Scheme

The app follows the same color scheme as the web version:

- **Primary Blue:** #2563EB (Light) / #14B8A6 (Dark)
- **Teal:** #14B8A6
- **Navy:** #102A43 (Dark background)
- **Gold:** #F59E0B

## Development Tips

### Hot Reload
While the app is running, press `r` in the terminal to hot reload changes.

### Hot Restart
Press `R` (capital R) in the terminal for a hot restart.

### Debug Mode
Run with debug flag for detailed error messages:
```bash
flutter run --debug
```

### Release Mode
Build and run in release mode for better performance:
```bash
flutter run --release
```

## Troubleshooting

### Common Issues

1. **Gradle build fails:**
   ```bash
   cd android
   ./gradlew clean
   cd ..
   flutter clean
   flutter pub get
   ```

2. **Dependencies not found:**
   ```bash
   flutter pub cache repair
   flutter pub get
   ```

3. **Android licenses not accepted:**
   ```bash
   flutter doctor --android-licenses
   ```

4. **App not installing on device:**
   - Enable USB debugging on Android device
   - Ensure device is authorized
   - Check device connection: `flutter devices`

### Performance Optimization

- Use release mode for production
- Enable multidex if hitting method limit
- Optimize images in assets folder
- Use const constructors where possible

## Building for Production

### Android APK
```bash
flutter build apk --release
```
Output: `build/app/outputs/flutter-apk/app-release.apk`

### Android App Bundle (for Play Store)
```bash
flutter build appbundle --release
```
Output: `build/app/outputs/bundle/release/app-release.aab`

## Additional Resources

- [Flutter Documentation](https://docs.flutter.dev/)
- [Provider Package](https://pub.dev/packages/provider)
- [FL Chart Package](https://pub.dev/packages/fl_chart)
- [Flutter Cookbook](https://docs.flutter.dev/cookbook)

## Support

For issues or questions, please refer to the main project documentation or contact the development team.

