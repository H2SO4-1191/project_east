import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:project_east_app/providers/theme_provider.dart';
import 'package:project_east_app/providers/institute_provider.dart';

void main() {
  testWidgets('App smoke test', (WidgetTester tester) async {
    // Test providers initialization
    final themeProvider = ThemeProvider();
    final instituteProvider = InstituteProvider();
    
    expect(themeProvider, isNotNull);
    expect(instituteProvider, isNotNull);
  });
}
