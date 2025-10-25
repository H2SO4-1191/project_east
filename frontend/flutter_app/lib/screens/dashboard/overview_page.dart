import 'package:flutter/material.dart';
import 'package:fl_chart/fl_chart.dart';
import '../../config/theme.dart';
import '../../widgets/card_widget.dart';
import '../../widgets/animated_counter.dart';
import '../../data/demo_data.dart';

class OverviewPage extends StatelessWidget {
  const OverviewPage({super.key});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final activeTeachers = DemoData.teachers.where((t) => t.status == 'Active').length;

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header
          Text(
            'Overview',
            style: theme.textTheme.displaySmall,
          ),
          const SizedBox(height: 4),
          Text(
            'Welcome to your dashboard',
            style: theme.textTheme.bodyMedium,
          ),
          const SizedBox(height: 24),

          // Stats Grid
          LayoutBuilder(
            builder: (context, constraints) {
              final isWide = constraints.maxWidth > 600;
              return GridView.count(
                crossAxisCount: isWide ? 4 : 2,
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                mainAxisSpacing: 16,
                crossAxisSpacing: 16,
                childAspectRatio: isWide ? 1.5 : 1.3,
                children: [
                  _StatCard(
                    title: 'Total Students',
                    value: DemoData.students.length,
                    icon: Icons.people,
                    color: AppTheme.primary600,
                  ),
                  _StatCard(
                    title: 'Active Teachers',
                    value: activeTeachers,
                    icon: Icons.person,
                    color: AppTheme.teal600,
                  ),
                  _StatCard(
                    title: 'Total Employees',
                    value: DemoData.employees.length,
                    icon: Icons.business_center,
                    color: Colors.purple.shade600,
                  ),
                  _StatCard(
                    title: 'Monthly Revenue',
                    value: 38000,
                    icon: Icons.attach_money,
                    color: AppTheme.gold600,
                    prefix: '\$',
                  ),
                ],
              );
            },
          ),

          const SizedBox(height: 24),

          // Charts
          LayoutBuilder(
            builder: (context, constraints) {
              final isWide = constraints.maxWidth > 800;
              if (isWide) {
                return Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(child: _ActivityChart(isDark: isDark, theme: theme)),
                    const SizedBox(width: 16),
                    Expanded(child: _RevenueChart(isDark: isDark, theme: theme)),
                  ],
                );
              }
              return Column(
                children: [
                  _ActivityChart(isDark: isDark, theme: theme),
                  const SizedBox(height: 16),
                  _RevenueChart(isDark: isDark, theme: theme),
                ],
              );
            },
          ),

          const SizedBox(height: 24),

          // Recent Activity
          CardWidget(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Recent Activity',
                  style: theme.textTheme.headlineMedium,
                ),
                const SizedBox(height: 16),
                ...[
                  {'action': 'New student enrolled', 'name': 'Yasmin Ali', 'time': '2 hours ago', 'color': AppTheme.primary600},
                  {'action': 'Teacher updated profile', 'name': 'Dr. Sarah Khan', 'time': '4 hours ago', 'color': AppTheme.teal600},
                  {'action': 'Payment received', 'name': 'Ahmed Hassan', 'time': '6 hours ago', 'color': AppTheme.gold600},
                  {'action': 'Schedule updated', 'name': 'Grade 10-A', 'time': '8 hours ago', 'color': Colors.purple.shade600},
                ].map((activity) {
                  return Padding(
                    padding: const EdgeInsets.only(bottom: 12),
                    child: Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: isDark
                            ? AppTheme.navy900.withOpacity(0.5)
                            : Colors.grey.shade50,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Row(
                        children: [
                          Container(
                            width: 8,
                            height: 8,
                            decoration: BoxDecoration(
                              color: activity['color'] as Color,
                              shape: BoxShape.circle,
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  activity['action'] as String,
                                  style: theme.textTheme.bodyMedium?.copyWith(
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                                Text(
                                  activity['name'] as String,
                                  style: theme.textTheme.bodySmall,
                                ),
                              ],
                            ),
                          ),
                          Text(
                            activity['time'] as String,
                            style: theme.textTheme.bodySmall,
                          ),
                        ],
                      ),
                    ),
                  );
                }),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _StatCard extends StatelessWidget {
  final String title;
  final int value;
  final IconData icon;
  final Color color;
  final String? prefix;

  const _StatCard({
    required this.title,
    required this.value,
    required this.icon,
    required this.color,
    this.prefix,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    
    return CardWidget(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: theme.textTheme.bodySmall?.copyWith(
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        if (prefix != null)
                          Text(
                            prefix!,
                            style: theme.textTheme.displaySmall?.copyWith(
                              color: color,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        AnimatedCounter(
                          value: value,
                          textStyle: theme.textTheme.displaySmall?.copyWith(
                            color: color,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: color.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(icon, color: color, size: 28),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _ActivityChart extends StatelessWidget {
  final bool isDark;
  final ThemeData theme;

  const _ActivityChart({required this.isDark, required this.theme});

  @override
  Widget build(BuildContext context) {
    return CardWidget(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Weekly Activity',
            style: theme.textTheme.headlineMedium,
          ),
          const SizedBox(height: 16),
          SizedBox(
            height: 250,
            child: LineChart(
              LineChartData(
                gridData: FlGridData(
                  show: true,
                  drawVerticalLine: false,
                  horizontalInterval: 50,
                  getDrawingHorizontalLine: (value) {
                    return FlLine(
                      color: isDark ? AppTheme.navy700 : Colors.grey.shade200,
                      strokeWidth: 1,
                    );
                  },
                ),
                titlesData: FlTitlesData(
                  leftTitles: AxisTitles(
                    sideTitles: SideTitles(
                      showTitles: true,
                      reservedSize: 40,
                      getTitlesWidget: (value, meta) {
                        return Text(
                          value.toInt().toString(),
                          style: theme.textTheme.bodySmall,
                        );
                      },
                    ),
                  ),
                  rightTitles: const AxisTitles(
                    sideTitles: SideTitles(showTitles: false),
                  ),
                  topTitles: const AxisTitles(
                    sideTitles: SideTitles(showTitles: false),
                  ),
                  bottomTitles: AxisTitles(
                    sideTitles: SideTitles(
                      showTitles: true,
                      getTitlesWidget: (value, meta) {
                        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
                        if (value.toInt() >= 0 && value.toInt() < days.length) {
                          return Padding(
                            padding: const EdgeInsets.only(top: 8),
                            child: Text(
                              days[value.toInt()],
                              style: theme.textTheme.bodySmall,
                            ),
                          );
                        }
                        return const SizedBox.shrink();
                      },
                    ),
                  ),
                ),
                borderData: FlBorderData(show: false),
                lineBarsData: [
                  LineChartBarData(
                    spots: [
                      const FlSpot(0, 185),
                      const FlSpot(1, 192),
                      const FlSpot(2, 188),
                      const FlSpot(3, 195),
                      const FlSpot(4, 198),
                    ],
                    isCurved: true,
                    color: AppTheme.primary500,
                    barWidth: 3,
                    dotData: const FlDotData(show: true),
                    belowBarData: BarAreaData(
                      show: true,
                      color: AppTheme.primary500.withOpacity(0.1),
                    ),
                  ),
                  LineChartBarData(
                    spots: [
                      const FlSpot(0, 42),
                      const FlSpot(1, 45),
                      const FlSpot(2, 43),
                      const FlSpot(3, 46),
                      const FlSpot(4, 47),
                    ],
                    isCurved: true,
                    color: AppTheme.teal500,
                    barWidth: 3,
                    dotData: const FlDotData(show: true),
                    belowBarData: BarAreaData(
                      show: true,
                      color: AppTheme.teal500.withOpacity(0.1),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _RevenueChart extends StatelessWidget {
  final bool isDark;
  final ThemeData theme;

  const _RevenueChart({required this.isDark, required this.theme});

  @override
  Widget build(BuildContext context) {
    return CardWidget(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Revenue vs Expenses',
            style: theme.textTheme.headlineMedium,
          ),
          const SizedBox(height: 16),
          SizedBox(
            height: 250,
            child: LineChart(
              LineChartData(
                gridData: FlGridData(
                  show: true,
                  drawVerticalLine: false,
                  horizontalInterval: 10000,
                  getDrawingHorizontalLine: (value) {
                    return FlLine(
                      color: isDark ? AppTheme.navy700 : Colors.grey.shade200,
                      strokeWidth: 1,
                    );
                  },
                ),
                titlesData: FlTitlesData(
                  leftTitles: AxisTitles(
                    sideTitles: SideTitles(
                      showTitles: true,
                      reservedSize: 50,
                      getTitlesWidget: (value, meta) {
                        return Text(
                          '\$${(value / 1000).toInt()}K',
                          style: theme.textTheme.bodySmall,
                        );
                      },
                    ),
                  ),
                  rightTitles: const AxisTitles(
                    sideTitles: SideTitles(showTitles: false),
                  ),
                  topTitles: const AxisTitles(
                    sideTitles: SideTitles(showTitles: false),
                  ),
                  bottomTitles: AxisTitles(
                    sideTitles: SideTitles(
                      showTitles: true,
                      getTitlesWidget: (value, meta) {
                        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
                        if (value.toInt() >= 0 && value.toInt() < months.length) {
                          return Padding(
                            padding: const EdgeInsets.only(top: 8),
                            child: Text(
                              months[value.toInt()],
                              style: theme.textTheme.bodySmall,
                            ),
                          );
                        }
                        return const SizedBox.shrink();
                      },
                    ),
                  ),
                ),
                borderData: FlBorderData(show: false),
                lineBarsData: [
                  LineChartBarData(
                    spots: [
                      const FlSpot(0, 24000),
                      const FlSpot(1, 28000),
                      const FlSpot(2, 32000),
                      const FlSpot(3, 29000),
                      const FlSpot(4, 35000),
                      const FlSpot(5, 38000),
                    ],
                    isCurved: true,
                    color: AppTheme.gold500,
                    barWidth: 3,
                    dotData: const FlDotData(show: true),
                  ),
                  LineChartBarData(
                    spots: [
                      const FlSpot(0, 18000),
                      const FlSpot(1, 19000),
                      const FlSpot(2, 20000),
                      const FlSpot(3, 21000),
                      const FlSpot(4, 22000),
                      const FlSpot(5, 23000),
                    ],
                    isCurved: true,
                    color: Colors.red,
                    barWidth: 3,
                    dotData: const FlDotData(show: true),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

