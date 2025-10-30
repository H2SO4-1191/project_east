import 'package:flutter/material.dart';
import '../../config/theme.dart';
import '../../widgets/card_widget.dart';
import '../../data/demo_data.dart';

class FinancePage extends StatelessWidget {
  const FinancePage({super.key});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    
    final totalPaid = DemoData.invoices
        .where((i) => i.status == 'Paid')
        .fold<double>(0, (sum, i) => sum + i.amount);
    final totalPending = DemoData.invoices
        .where((i) => i.status == 'Pending')
        .fold<double>(0, (sum, i) => sum + i.amount);
    final totalOverdue = DemoData.invoices
        .where((i) => i.status == 'Overdue')
        .fold<double>(0, (sum, i) => sum + i.amount);

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Finance', style: theme.textTheme.displaySmall),
          const SizedBox(height: 4),
          Text('Financial records and invoices', style: theme.textTheme.bodyMedium),
          const SizedBox(height: 24),
          
          // Summary Cards
          GridView.count(
            crossAxisCount: MediaQuery.of(context).size.width > 600 ? 3 : 1,
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            mainAxisSpacing: 16,
            crossAxisSpacing: 16,
            childAspectRatio: 2,
            children: [
              CardWidget(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text('Total Paid', style: theme.textTheme.bodySmall),
                    const SizedBox(height: 8),
                    Text(
                      'IQD ${totalPaid.toStringAsFixed(0)}',
                      style: theme.textTheme.displaySmall?.copyWith(
                        color: AppTheme.teal600,
                      ),
                    ),
                  ],
                ),
              ),
              CardWidget(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text('Pending', style: theme.textTheme.bodySmall),
                    const SizedBox(height: 8),
                    Text(
                      'IQD ${totalPending.toStringAsFixed(0)}',
                      style: theme.textTheme.displaySmall?.copyWith(
                        color: Colors.orange,
                      ),
                    ),
                  ],
                ),
              ),
              CardWidget(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text('Overdue', style: theme.textTheme.bodySmall),
                    const SizedBox(height: 8),
                    Text(
                      'IQD ${totalOverdue.toStringAsFixed(0)}',
                      style: theme.textTheme.displaySmall?.copyWith(
                        color: Colors.red,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          
          const SizedBox(height: 24),
          
          // Invoices List
          CardWidget(
            padding: EdgeInsets.zero,
            child: ListView.separated(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: DemoData.invoices.length,
              separatorBuilder: (context, index) => Divider(
                color: isDark ? AppTheme.navy700 : Colors.grey.shade200,
              ),
              itemBuilder: (context, index) {
                final invoice = DemoData.invoices[index];
                Color statusColor;
                if (invoice.status == 'Paid') {
                  statusColor = AppTheme.teal600;
                } else if (invoice.status == 'Pending') {
                  statusColor = Colors.orange;
                } else {
                  statusColor = Colors.red;
                }
                
                return ListTile(
                  leading: CircleAvatar(
                    backgroundColor: statusColor.withOpacity(0.1),
                    child: Icon(
                      invoice.status == 'Paid'
                          ? Icons.check_circle
                          : Icons.pending,
                      color: statusColor,
                    ),
                  ),
                  title: Text(invoice.studentName),
                  subtitle: Text('${invoice.id} • Due: ${invoice.dueDate}'),
                  trailing: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Text(
                        'IQD ${invoice.amount.toStringAsFixed(0)}',
                        style: theme.textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                        decoration: BoxDecoration(
                          color: statusColor.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(
                          invoice.status,
                          style: TextStyle(
                            color: statusColor,
                            fontSize: 10,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    ],
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

