import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/theme_provider.dart';
import '../../providers/institute_provider.dart';
import '../../config/theme.dart';
import 'overview_page.dart';
import 'students_page.dart';
import 'teachers_page.dart';
import 'employees_page.dart';
import 'schedule_page.dart';
import 'finance_page.dart';
import 'settings_page.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  int _selectedIndex = 0;
  final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey<ScaffoldState>();

  final List<MenuItem> _menuItems = [
    MenuItem(id: 'overview', label: 'Overview', icon: Icons.home, page: const OverviewPage()),
    MenuItem(id: 'students', label: 'Students', icon: Icons.people, page: const StudentsPage()),
    MenuItem(id: 'teachers', label: 'Teachers', icon: Icons.person, page: const TeachersPage()),
    MenuItem(id: 'employees', label: 'Employees', icon: Icons.business_center, page: const EmployeesPage()),
    MenuItem(id: 'schedule', label: 'Schedule', icon: Icons.calendar_today, page: const SchedulePage()),
    MenuItem(id: 'finance', label: 'Finance', icon: Icons.attach_money, page: const FinancePage()),
    MenuItem(id: 'settings', label: 'Settings', icon: Icons.settings, page: const SettingsPage()),
  ];

  void _handleLogout() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Logout'),
        content: const Text('Are you sure you want to logout?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              Navigator.pushReplacementNamed(context, '/');
            },
            child: const Text('Logout'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final themeProvider = Provider.of<ThemeProvider>(context);
    final instituteProvider = Provider.of<InstituteProvider>(context);

    return Scaffold(
      key: _scaffoldKey,
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.menu),
          onPressed: () {
            _scaffoldKey.currentState?.openDrawer();
          },
        ),
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              instituteProvider.instituteData['name'] ?? 'Institute',
              style: theme.textTheme.titleMedium,
            ),
            Text(
              instituteProvider.instituteData['email'] ?? '',
              style: theme.textTheme.bodySmall,
            ),
          ],
        ),
        actions: [
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 8),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Text(
                  'Welcome Admin',
                  style: theme.textTheme.bodySmall?.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
                ),
                Text(
                  instituteProvider.instituteData['subscriptionLabel'] ?? 'Premium Plan',
                  style: theme.textTheme.bodySmall,
                ),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.only(right: 16),
            child: CircleAvatar(
              radius: 20,
              child: Text(
                (instituteProvider.instituteData['name'] ?? 'I')[0].toUpperCase(),
                style: const TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ),
        ],
      ),
      drawer: _buildDrawer(theme, isDark, themeProvider, instituteProvider),
      body: AnimatedSwitcher(
        duration: const Duration(milliseconds: 300),
        child: _menuItems[_selectedIndex].page,
      ),
      bottomNavigationBar: MediaQuery.of(context).size.width < 1024
          ? BottomNavigationBar(
              currentIndex: _selectedIndex < 5 ? _selectedIndex : 0,
              onTap: (index) {
                setState(() {
                  _selectedIndex = index;
                });
              },
              type: BottomNavigationBarType.fixed,
              selectedItemColor: isDark ? AppTheme.teal400 : AppTheme.primary600,
              unselectedItemColor: isDark ? Colors.grey.shade500 : Colors.grey.shade600,
              items: _menuItems.take(5).map((item) {
                return BottomNavigationBarItem(
                  icon: Icon(item.icon),
                  label: item.label,
                );
              }).toList(),
            )
          : null,
    );
  }

  Widget _buildDrawer(ThemeData theme, bool isDark, ThemeProvider themeProvider, InstituteProvider instituteProvider) {
    return Drawer(
      child: Column(
        children: [
          // Header
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: isDark ? AppTheme.navy800 : Colors.white,
              border: Border(
                bottom: BorderSide(
                  color: isDark ? AppTheme.navy700 : Colors.grey.shade200,
                ),
              ),
            ),
            child: SafeArea(
              bottom: false,
              child: Row(
                children: [
                  Container(
                    width: 48,
                    height: 48,
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(12),
                      gradient: const LinearGradient(
                        colors: [AppTheme.primary600, AppTheme.teal500],
                      ),
                    ),
                    child: const Center(
                      child: Text(
                        'PE',
                        style: TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Project East',
                        style: theme.textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      Text(
                        'Dashboard',
                        style: theme.textTheme.bodySmall,
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),

          // Menu Items
          Expanded(
            child: ListView.builder(
              padding: const EdgeInsets.symmetric(vertical: 8),
              itemCount: _menuItems.length,
              itemBuilder: (context, index) {
                final item = _menuItems[index];
                final isSelected = _selectedIndex == index;
                
                return Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  child: Material(
                    color: isSelected
                        ? (isDark ? AppTheme.teal500 : AppTheme.primary600)
                        : Colors.transparent,
                    borderRadius: BorderRadius.circular(12),
                    child: InkWell(
                      onTap: () {
                        setState(() {
                          _selectedIndex = index;
                        });
                        Navigator.pop(context); // Close drawer
                      },
                      borderRadius: BorderRadius.circular(12),
                      child: Padding(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 16,
                          vertical: 12,
                        ),
                        child: Row(
                          children: [
                            Icon(
                              item.icon,
                              color: isSelected
                                  ? Colors.white
                                  : (isDark ? Colors.grey.shade400 : Colors.grey.shade700),
                            ),
                            const SizedBox(width: 12),
                            Text(
                              item.label,
                              style: TextStyle(
                                color: isSelected
                                    ? Colors.white
                                    : (isDark ? Colors.grey.shade300 : Colors.grey.shade800),
                                fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                );
              },
            ),
          ),

          // Footer Actions
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              border: Border(
                top: BorderSide(
                  color: isDark ? AppTheme.navy700 : Colors.grey.shade200,
                ),
              ),
            ),
            child: Column(
              children: [
                // Theme Toggle
                Material(
                  color: Colors.transparent,
                  child: InkWell(
                    onTap: () => themeProvider.toggleTheme(),
                    borderRadius: BorderRadius.circular(12),
                    child: Padding(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 16,
                        vertical: 12,
                      ),
                      child: Row(
                        children: [
                          Icon(
                            isDark ? Icons.wb_sunny : Icons.nightlight_round,
                            color: isDark ? AppTheme.gold500 : AppTheme.navy600,
                          ),
                          const SizedBox(width: 12),
                          Text(
                            isDark ? 'Light Mode' : 'Dark Mode',
                            style: theme.textTheme.bodyMedium,
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
                
                // Logout
                Material(
                  color: Colors.transparent,
                  child: InkWell(
                    onTap: _handleLogout,
                    borderRadius: BorderRadius.circular(12),
                    child: Padding(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 16,
                        vertical: 12,
                      ),
                      child: Row(
                        children: [
                          const Icon(
                            Icons.logout,
                            color: Colors.red,
                          ),
                          const SizedBox(width: 12),
                          Text(
                            'Logout',
                            style: theme.textTheme.bodyMedium?.copyWith(
                              color: Colors.red,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class MenuItem {
  final String id;
  final String label;
  final IconData icon;
  final Widget page;

  MenuItem({
    required this.id,
    required this.label,
    required this.icon,
    required this.page,
  });
}

