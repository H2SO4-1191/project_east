import 'package:flutter/material.dart';

class FloatingActionMenu extends StatefulWidget {
  final Function(String action) onActionSelected;
  final VoidCallback? onDrawerButtonPressed;
  
  const FloatingActionMenu({
    super.key,
    required this.onActionSelected,
    this.onDrawerButtonPressed,
  });

  @override
  State<FloatingActionMenu> createState() => _FloatingActionMenuState();
}

class _FloatingActionMenuState extends State<FloatingActionMenu>
    with SingleTickerProviderStateMixin {
  bool _isExpanded = false;

  void _toggleMenu() {
    setState(() {
      _isExpanded = !_isExpanded;
    });
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    
    return GestureDetector(
      onTap: () {
        if (!_isExpanded) {
          _toggleMenu();
        }
      },
      child: MouseRegion(
        onEnter: (_) {
          if (!_isExpanded) {
            _toggleMenu();
          }
        },
        onExit: (_) {
          if (_isExpanded) {
            _toggleMenu();
          }
        },
        child: Container(
          width: 80,
          height: _isExpanded ? 700 : 80,
          alignment: Alignment.bottomRight,
          child: Stack(
            clipBehavior: Clip.none,
            alignment: Alignment.bottomRight,
            children: [
              // Expanded menu buttons (from bottom to top)
              if (_isExpanded)
                Positioned(
                  right: 0,
                  bottom: 80,
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      // Applications (top, appears last)
                      _buildMenuButton(
                        icon: Icons.assignment,
                        label: 'Applications',
                        color: Colors.indigo,
                        delay: 400,
                        action: 'applications',
                      ),
                      const SizedBox(height: 16),
                      
                      // Create Job Post
                      _buildMenuButton(
                        icon: Icons.work,
                        label: 'Create Job Post',
                        color: Colors.orange,
                        delay: 300,
                        action: 'job_post',
                      ),
                      const SizedBox(height: 16),
                      
                      // Edit Courses
                      _buildMenuButton(
                        icon: Icons.edit,
                        label: 'Edit Courses',
                        color: Colors.teal,
                        delay: 200,
                        action: 'edit_courses',
                      ),
                      const SizedBox(height: 16),
                      
                      // Create Course
                      _buildMenuButton(
                        icon: Icons.add,
                        label: 'Create Course',
                        color: theme.primaryColor,
                        delay: 100,
                        action: 'create_course',
                      ),
                      const SizedBox(height: 16),
                      
                      // New Post (bottom, appears first)
                      _buildMenuButton(
                        icon: Icons.article,
                        label: 'New Post',
                        color: Colors.purple,
                        delay: 0,
                        action: 'create_post',
                      ),
                    ],
                  ),
                ),
              
              // Main floating action button (teal color as per plan: #52988E)
              FloatingActionButton(
                onPressed: _toggleMenu,
                backgroundColor: _isExpanded ? Colors.grey : const Color(0xFF52988E),
                child: Icon(
                  _isExpanded ? Icons.close : Icons.add,
                  color: Colors.white,
                ),
              ),
              
              // Drawer button (always visible below the menu)
              if (widget.onDrawerButtonPressed != null)
                Positioned(
                  bottom: -80,
                  right: 0,
                  child: FloatingActionButton(
                    onPressed: widget.onDrawerButtonPressed,
                    backgroundColor: const Color(0xFF52988E),
                    child: const Icon(
                      Icons.menu,
                      color: Colors.white,
                    ),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildMenuButton({
    required IconData icon,
    required String label,
    required Color color,
    required int delay,
    required String action,
  }) {
    return IgnorePointer(
      ignoring: !_isExpanded,
      child: AnimatedOpacity(
        opacity: _isExpanded ? 1.0 : 0.0,
        duration: Duration(milliseconds: 300 + delay),
        child: AnimatedScale(
          scale: _isExpanded ? 1.0 : 0.5,
          duration: Duration(milliseconds: 300 + delay),
          curve: Curves.easeOut,
          child: InkWell(
            onTap: () {
              widget.onActionSelected(action);
              _toggleMenu();
            },
            borderRadius: BorderRadius.circular(28),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                // Label button
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                  decoration: BoxDecoration(
                    color: color,
                    borderRadius: BorderRadius.circular(28),
                    boxShadow: [
                      BoxShadow(
                        color: color.withOpacity(0.3),
                        blurRadius: 8,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  child: Text(
                    label,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                
                // Icon button
                Container(
                  width: 56,
                  height: 56,
                  decoration: BoxDecoration(
                    color: color,
                    shape: BoxShape.circle,
                    boxShadow: [
                      BoxShadow(
                        color: color.withOpacity(0.3),
                        blurRadius: 8,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  child: Icon(
                    icon,
                    color: Colors.white,
                    size: 24,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

