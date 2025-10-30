import 'package:flutter/material.dart';
import '../../config/theme.dart';
import '../../widgets/card_widget.dart';
import '../../widgets/enhanced_button.dart';
import '../../data/demo_data.dart';
import '../../models/student.dart';

class StudentsPage extends StatefulWidget {
  const StudentsPage({super.key});

  @override
  State<StudentsPage> createState() => _StudentsPageState();
}

class _StudentsPageState extends State<StudentsPage> {
  String _searchQuery = '';
  String _statusFilter = 'All';

  List<Student> get _filteredStudents {
    return DemoData.students.where((student) {
      final matchesSearch = student.name.toLowerCase().contains(_searchQuery.toLowerCase()) ||
          student.id.toLowerCase().contains(_searchQuery.toLowerCase()) ||
          student.email.toLowerCase().contains(_searchQuery.toLowerCase());
      
      final matchesStatus = _statusFilter == 'All' || student.status == _statusFilter;
      
      return matchesSearch && matchesStatus;
    }).toList();
  }

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
          Text('Students', style: theme.textTheme.displaySmall),
          const SizedBox(height: 4),
          Text(
            'Manage student information',
            style: theme.textTheme.bodyMedium,
          ),
          
          const SizedBox(height: 16),
          
          // Add Student Button
          SizedBox(
            width: double.infinity,
            child: EnhancedButton(
              text: 'Add Student',
              icon: Icons.add,
              onPressed: () {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: const Row(
                      children: [
                        Icon(Icons.info, color: Colors.white),
                        SizedBox(width: 12),
                        Expanded(
                          child: Text('Add Student feature coming soon!'),
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

          // Search and Filter
          CardWidget(
            child: Column(
              children: [
                Row(
                  children: [
                    Expanded(
                      child: TextField(
                        decoration: const InputDecoration(
                          hintText: 'Search students...',
                          prefixIcon: Icon(Icons.search),
                        ),
                        onChanged: (value) {
                          setState(() {
                            _searchQuery = value;
                          });
                        },
                      ),
                    ),
                    const SizedBox(width: 16),
                    DropdownButton<String>(
                      value: _statusFilter,
                      items: ['All', 'Active', 'Inactive'].map((status) {
                        return DropdownMenuItem(
                          value: status,
                          child: Text(status),
                        );
                      }).toList(),
                      onChanged: (value) {
                        setState(() {
                          _statusFilter = value!;
                        });
                      },
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // Students Table
          CardWidget(
            padding: EdgeInsets.zero,
            child: LayoutBuilder(
              builder: (context, constraints) {
                if (constraints.maxWidth > 800) {
                  return _buildTable(theme, isDark);
                } else {
                  return _buildList(theme, isDark);
                }
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTable(ThemeData theme, bool isDark) {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: DataTable(
        headingRowColor: WidgetStateProperty.all(
          isDark ? AppTheme.navy900.withOpacity(0.5) : Colors.grey.shade50,
        ),
        columns: const [
          DataColumn(label: Text('ID')),
          DataColumn(label: Text('Name')),
          DataColumn(label: Text('Grade')),
          DataColumn(label: Text('Email')),
          DataColumn(label: Text('Phone')),
          DataColumn(label: Text('GPA')),
          DataColumn(label: Text('Status')),
          DataColumn(label: Text('Actions')),
        ],
        rows: _filteredStudents.map((student) {
          return DataRow(
            cells: [
              DataCell(Text(student.id)),
              DataCell(Text(student.name)),
              DataCell(Text(student.grade)),
              DataCell(Text(student.email)),
              DataCell(Text(student.phone)),
              DataCell(Text(student.gpa.toString())),
              DataCell(
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                  decoration: BoxDecoration(
                    color: student.status == 'Active'
                        ? AppTheme.teal500.withOpacity(0.1)
                        : Colors.grey.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    student.status,
                    style: TextStyle(
                      color: student.status == 'Active'
                          ? AppTheme.teal600
                          : Colors.grey.shade600,
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ),
              DataCell(
                Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    IconButton(
                      icon: const Icon(Icons.edit, size: 20),
                      onPressed: () {},
                    ),
                    IconButton(
                      icon: const Icon(Icons.delete, size: 20, color: Colors.red),
                      onPressed: () {},
                    ),
                  ],
                ),
              ),
            ],
          );
        }).toList(),
      ),
    );
  }

  Widget _buildList(ThemeData theme, bool isDark) {
    return ListView.separated(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: _filteredStudents.length,
      separatorBuilder: (context, index) => Divider(
        color: isDark ? AppTheme.navy700 : Colors.grey.shade200,
      ),
      itemBuilder: (context, index) {
        final student = _filteredStudents[index];
        return ListTile(
          leading: CircleAvatar(
            child: Text(student.name[0]),
          ),
          title: Text(student.name),
          subtitle: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('${student.id} • ${student.grade}'),
              Text(student.email, style: theme.textTheme.bodySmall),
            ],
          ),
          trailing: Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
            decoration: BoxDecoration(
              color: student.status == 'Active'
                  ? AppTheme.teal500.withOpacity(0.1)
                  : Colors.grey.withOpacity(0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Text(
              student.status,
              style: TextStyle(
                color: student.status == 'Active'
                    ? AppTheme.teal600
                    : Colors.grey.shade600,
                fontSize: 12,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
          onTap: () {},
        );
      },
    );
  }
}

