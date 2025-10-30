import 'package:flutter/material.dart';
import '../../config/theme.dart';
import '../../widgets/card_widget.dart';
import '../../widgets/enhanced_button.dart';
import '../../data/demo_data.dart';

class EmployeesPage extends StatelessWidget {
  const EmployeesPage({super.key});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header
          Text('Employees', style: theme.textTheme.displaySmall),
          const SizedBox(height: 4),
          Text('Manage employee information', style: theme.textTheme.bodyMedium),
          
          const SizedBox(height: 16),
          
          // Add Employee Button
          SizedBox(
            width: double.infinity,
            child: EnhancedButton(
              text: 'Add Employee',
              icon: Icons.add,
              onPressed: () {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: const Row(
                      children: [
                        Icon(Icons.info, color: Colors.white),
                        SizedBox(width: 12),
                        Expanded(
                          child: Text('Add Employee feature coming soon!'),
                        ),
                      ],
                    ),
                    backgroundColor: AppTheme.primary600,
                    behavior: SnackBarBehavior.floating,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                );
              },
            ),
          ),
          const SizedBox(height: 24),
          CardWidget(
            padding: EdgeInsets.zero,
            child: ListView.separated(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: DemoData.employees.length,
              separatorBuilder: (context, index) => Divider(
                color: isDark ? AppTheme.navy700 : Colors.grey.shade200,
              ),
              itemBuilder: (context, index) {
                final employee = DemoData.employees[index];
                return ListTile(
                  leading: CircleAvatar(child: Text(employee.name[0])),
                  title: Text(employee.name),
                  subtitle: Text('${employee.role} • ${employee.department}'),
                  trailing: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                    decoration: BoxDecoration(
                      color: AppTheme.teal500.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      employee.status,
                      style: const TextStyle(
                        color: AppTheme.teal600,
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}

