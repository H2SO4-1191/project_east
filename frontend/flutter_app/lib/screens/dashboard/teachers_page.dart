import 'package:flutter/material.dart';
import '../../config/theme.dart';
import '../../widgets/card_widget.dart';
import '../../data/demo_data.dart';
import '../../models/teacher.dart';

class TeachersPage extends StatefulWidget {
  const TeachersPage({super.key});

  @override
  State<TeachersPage> createState() => _TeachersPageState();
}

class _TeachersPageState extends State<TeachersPage> {
  String _searchQuery = '';

  List<Teacher> get _filteredTeachers {
    return DemoData.teachers.where((teacher) {
      return teacher.name.toLowerCase().contains(_searchQuery.toLowerCase()) ||
          teacher.subject.toLowerCase().contains(_searchQuery.toLowerCase()) ||
          teacher.department.toLowerCase().contains(_searchQuery.toLowerCase());
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
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Teachers', style: theme.textTheme.displaySmall),
                  const SizedBox(height: 4),
                  Text('Manage teacher information', style: theme.textTheme.bodyMedium),
                ],
              ),
              ElevatedButton.icon(
                onPressed: () {},
                icon: const Icon(Icons.add),
                label: const Text('Add Teacher'),
              ),
            ],
          ),
          const SizedBox(height: 24),
          CardWidget(
            child: TextField(
              decoration: const InputDecoration(
                hintText: 'Search teachers...',
                prefixIcon: Icon(Icons.search),
              ),
              onChanged: (value) => setState(() => _searchQuery = value),
            ),
          ),
          const SizedBox(height: 16),
          CardWidget(
            padding: EdgeInsets.zero,
            child: ListView.separated(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: _filteredTeachers.length,
              separatorBuilder: (context, index) => Divider(
                color: isDark ? AppTheme.navy700 : Colors.grey.shade200,
              ),
              itemBuilder: (context, index) {
                final teacher = _filteredTeachers[index];
                return ListTile(
                  leading: CircleAvatar(child: Text(teacher.name[0])),
                  title: Text(teacher.name),
                  subtitle: Text('${teacher.subject} • ${teacher.department}'),
                  trailing: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                    decoration: BoxDecoration(
                      color: teacher.status == 'Active'
                          ? AppTheme.teal500.withOpacity(0.1)
                          : Colors.orange.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      teacher.status,
                      style: TextStyle(
                        color: teacher.status == 'Active' ? AppTheme.teal600 : Colors.orange,
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

