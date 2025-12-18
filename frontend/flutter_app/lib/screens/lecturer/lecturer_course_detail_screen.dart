import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../providers/theme_provider.dart';
import '../../config/theme.dart';
import '../../services/lecturer_service.dart';
import '../../services/explore_service.dart';
import '../../services/api_service.dart';
import '../../widgets/modern_bottom_nav.dart';

class LecturerCourseDetailScreen extends StatefulWidget {
  const LecturerCourseDetailScreen({super.key});

  @override
  State<LecturerCourseDetailScreen> createState() => _LecturerCourseDetailScreenState();
}

class _LecturerCourseDetailScreenState extends State<LecturerCourseDetailScreen> {
  Map<String, dynamic>? _courseDetails;
  Map<String, dynamic>? _progress;
  bool _isLoading = true;
  String? _error;
  bool _isInfoExpanded = true;
  int? _courseId;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final args = ModalRoute.of(context)?.settings.arguments as Map<String, dynamic>?;
    if (args != null && _courseId == null) {
      _courseId = args['courseId'];
      _progress = args['progress'];
      _fetchCourseDetails();
    }
  }

  Future<void> _fetchCourseDetails() async {
    if (_courseId == null) return;

    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final response = await ExploreService.getCourseDetails(_courseId!);
      setState(() {
        _courseDetails = response['data'] ?? response;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = e is ApiException ? e.message : 'Failed to load course details';
        _isLoading = false;
      });
    }
  }

  String? _getImageUrl(dynamic imagePath) {
    if (imagePath == null || imagePath.toString().isEmpty) return null;
    final path = imagePath.toString();
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }
    final baseUrl = ApiService.baseUrl;
    final cleanPath = path.startsWith('/') ? path : '/$path';
    return '$baseUrl$cleanPath';
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final authProvider = Provider.of<AuthProvider>(context);
    final isVerified = authProvider.instituteData['isVerified'] == true;

    return Scaffold(
      backgroundColor: isDark ? AppTheme.navy900 : const Color(0xFFF9FAFB),
      appBar: AppBar(
        elevation: 0,
        backgroundColor: isDark ? AppTheme.navy800 : Colors.white,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(_courseDetails?['title'] ?? 'Course Details'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _fetchCourseDetails,
          ),
          IconButton(
            icon: Icon(isDark ? Icons.wb_sunny : Icons.nightlight_round),
            onPressed: () {
              Provider.of<ThemeProvider>(context, listen: false).toggleTheme();
            },
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.error_outline, size: 64, color: Colors.red),
                      const SizedBox(height: 16),
                      Text(_error!),
                      const SizedBox(height: 16),
                      ElevatedButton(
                        onPressed: _fetchCourseDetails,
                        child: const Text('Retry'),
                      ),
                    ],
                  ),
                )
              : SingleChildScrollView(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Expandable Course Info Section
                      _buildCourseInfoSection(isDark),

                      const SizedBox(height: 24),

                      // Action Buttons
                      if (isVerified) ...[
                        _buildActionButtons(context, isDark),
                      ] else ...[
                        _buildVerificationWarning(isDark),
                      ],
                    ],
                  ),
                ),
      bottomNavigationBar: ModernBottomNav(
        currentIndex: 1,
        onTap: (index) {
          if (index == 0) {
            Navigator.pushNamedAndRemoveUntil(context, '/', (route) => false);
          } else if (index == 2) {
            Navigator.pushNamedAndRemoveUntil(context, '/', (route) => false);
            Navigator.pushNamed(context, '/explore');
          }
        },
      ),
    );
  }

  Widget _buildCourseInfoSection(bool isDark) {
    final courseImageUrl = _getImageUrl(_courseDetails?['course_image']);
    final enrolledStudents = _progress?['enrolled_students'] ?? _courseDetails?['enrolled_students'] ?? 0;
    final totalLectures = _progress?['total_lectures'] ?? _courseDetails?['total_lectures'] ?? 0;
    final completedLectures = _progress?['completed_lectures'] ?? 0;

    return Container(
      decoration: BoxDecoration(
        color: isDark ? AppTheme.navy800 : Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        children: [
          // Header with expand/collapse
          InkWell(
            onTap: () {
              setState(() {
                _isInfoExpanded = !_isInfoExpanded;
              });
            },
            borderRadius: const BorderRadius.vertical(top: Radius.circular(16)),
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Row(
                children: [
                  if (courseImageUrl != null)
                    Container(
                      width: 60,
                      height: 60,
                      margin: const EdgeInsets.only(right: 16),
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(12),
                        image: DecorationImage(
                          image: NetworkImage(courseImageUrl),
                          fit: BoxFit.cover,
                        ),
                      ),
                    )
                  else
                    Container(
                      width: 60,
                      height: 60,
                      margin: const EdgeInsets.only(right: 16),
                      decoration: BoxDecoration(
                        color: AppTheme.primary600.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: const Icon(Icons.book, color: AppTheme.primary600, size: 30),
                    ),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          _courseDetails?['title'] ?? 'Course',
                          style: const TextStyle(
                            fontSize: 20,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'Tap to ${_isInfoExpanded ? 'collapse' : 'expand'} details',
                          style: TextStyle(
                            fontSize: 12,
                            color: Colors.grey.shade500,
                          ),
                        ),
                      ],
                    ),
                  ),
                  AnimatedRotation(
                    turns: _isInfoExpanded ? 0.5 : 0,
                    duration: const Duration(milliseconds: 300),
                    child: const Icon(Icons.keyboard_arrow_down),
                  ),
                ],
              ),
            ),
          ),

          // Expandable content
          AnimatedCrossFade(
            firstChild: Padding(
              padding: const EdgeInsets.fromLTRB(20, 0, 20, 20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Divider(),
                  const SizedBox(height: 12),

                  // Description
                  if (_courseDetails?['about'] != null) ...[
                    Text(
                      'About',
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        color: Colors.grey.shade600,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      _courseDetails!['about'],
                      style: const TextStyle(fontSize: 14),
                    ),
                    const SizedBox(height: 16),
                  ],

                  // Stats Grid
                  Row(
                    children: [
                      Expanded(
                        child: _buildInfoChip(
                          Icons.people,
                          '$enrolledStudents Students',
                          Colors.blue,
                          isDark,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: _buildInfoChip(
                          Icons.play_circle_outline,
                          '$completedLectures/$totalLectures Lectures',
                          Colors.green,
                          isDark,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        child: _buildInfoChip(
                          Icons.signal_cellular_alt,
                          _courseDetails?['level'] ?? 'Beginner',
                          Colors.purple,
                          isDark,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: _buildInfoChip(
                          Icons.attach_money,
                          '\$${_courseDetails?['price'] ?? '0'}',
                          Colors.orange,
                          isDark,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),

                  // Dates
                  Row(
                    children: [
                      Expanded(
                        child: _buildInfoChip(
                          Icons.calendar_today,
                          'Start: ${_courseDetails?['starting_date'] ?? 'N/A'}',
                          Colors.teal,
                          isDark,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: _buildInfoChip(
                          Icons.event,
                          'End: ${_courseDetails?['ending_date'] ?? 'N/A'}',
                          Colors.red,
                          isDark,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            secondChild: const SizedBox.shrink(),
            crossFadeState: _isInfoExpanded
                ? CrossFadeState.showFirst
                : CrossFadeState.showSecond,
            duration: const Duration(milliseconds: 300),
          ),
        ],
      ),
    );
  }

  Widget _buildInfoChip(IconData icon, String text, Color color, bool isDark) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: color.withOpacity(isDark ? 0.15 : 0.1),
        borderRadius: BorderRadius.circular(10),
      ),
      child: Row(
        children: [
          Icon(icon, size: 18, color: color),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              text,
              style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w500,
                color: isDark ? Colors.white : color.withOpacity(0.8),
              ),
              overflow: TextOverflow.ellipsis,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildActionButtons(BuildContext context, bool isDark) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Actions',
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.bold,
            color: isDark ? Colors.white : Colors.black87,
          ),
        ),
        const SizedBox(height: 16),
        GridView.count(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          crossAxisCount: 2,
          mainAxisSpacing: 16,
          crossAxisSpacing: 16,
          childAspectRatio: 1.3,
          children: [
            _buildActionCard(
              context,
              isDark,
              Icons.add_circle_outline,
              'Create Exam',
              'Add new exam for this course',
              Colors.purple,
              () => _showCreateExamModal(context, isDark),
            ),
            _buildActionCard(
              context,
              isDark,
              Icons.grade,
              'Submit Grades',
              'Enter student scores',
              Colors.green,
              () => _showSubmitGradesModal(context, isDark),
            ),
            _buildActionCard(
              context,
              isDark,
              Icons.checklist,
              'Mark Attendance',
              'Record student attendance',
              Colors.blue,
              () => _showMarkAttendanceModal(context, isDark),
            ),
            _buildActionCard(
              context,
              isDark,
              Icons.visibility,
              'View Attendance',
              'See attendance records',
              Colors.teal,
              () => _showViewAttendanceModal(context, isDark),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildActionCard(
    BuildContext context,
    bool isDark,
    IconData icon,
    String title,
    String subtitle,
    Color color,
    VoidCallback onTap,
  ) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: isDark ? AppTheme.navy800 : Colors.white,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.05),
              blurRadius: 10,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                color: color.withOpacity(0.1),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(icon, color: color, size: 24),
            ),
            const SizedBox(height: 12),
            Text(
              title,
              style: const TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              subtitle,
              style: TextStyle(
                fontSize: 11,
                color: Colors.grey.shade500,
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildVerificationWarning(bool isDark) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.amber.withOpacity(isDark ? 0.15 : 0.1),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.amber.withOpacity(0.3)),
      ),
      child: Row(
        children: [
          const Icon(Icons.warning_amber_rounded, color: Colors.amber, size: 32),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Verification Required',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  'Your account needs to be verified to manage exams and attendance.',
                  style: TextStyle(
                    fontSize: 13,
                    color: Colors.grey.shade600,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // ==================== MODALS ====================

  void _showCreateExamModal(BuildContext context, bool isDark) {
    final titleController = TextEditingController();
    final dateController = TextEditingController();
    final maxScoreController = TextEditingController(text: '100');
    bool isSubmitting = false;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => StatefulBuilder(
        builder: (context, setModalState) {
          return AnimatedContainer(
            duration: const Duration(milliseconds: 300),
            curve: Curves.easeOutCubic,
            padding: EdgeInsets.only(
              bottom: MediaQuery.of(context).viewInsets.bottom,
            ),
            child: Container(
              decoration: BoxDecoration(
                color: isDark ? AppTheme.navy800 : Colors.white,
                borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
              ),
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(24),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Handle bar
                    Center(
                      child: Container(
                        width: 40,
                        height: 4,
                        decoration: BoxDecoration(
                          color: Colors.grey.shade300,
                          borderRadius: BorderRadius.circular(2),
                        ),
                      ),
                    ),
                    const SizedBox(height: 20),

                    // Title
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(10),
                          decoration: BoxDecoration(
                            color: Colors.purple.withOpacity(0.1),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: const Icon(Icons.add_circle_outline, color: Colors.purple),
                        ),
                        const SizedBox(width: 12),
                        const Text(
                          'Create Exam',
                          style: TextStyle(
                            fontSize: 20,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 24),

                    // Form
                    TextField(
                      controller: titleController,
                      decoration: InputDecoration(
                        labelText: 'Exam Title',
                        hintText: 'e.g., Midterm Exam',
                        prefixIcon: const Icon(Icons.title),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),

                    TextField(
                      controller: dateController,
                      readOnly: true,
                      decoration: InputDecoration(
                        labelText: 'Exam Date',
                        hintText: 'Select date',
                        prefixIcon: const Icon(Icons.calendar_today),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                      onTap: () async {
                        final date = await showDatePicker(
                          context: context,
                          initialDate: DateTime.now(),
                          firstDate: DateTime.now(),
                          lastDate: DateTime.now().add(const Duration(days: 365)),
                        );
                        if (date != null) {
                          dateController.text = '${date.year}-${date.month.toString().padLeft(2, '0')}-${date.day.toString().padLeft(2, '0')}';
                        }
                      },
                    ),
                    const SizedBox(height: 16),

                    TextField(
                      controller: maxScoreController,
                      keyboardType: TextInputType.number,
                      decoration: InputDecoration(
                        labelText: 'Maximum Score',
                        hintText: 'e.g., 100',
                        prefixIcon: const Icon(Icons.score),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                    ),
                    const SizedBox(height: 24),

                    // Submit Button
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        onPressed: isSubmitting
                            ? null
                            : () async {
                                if (titleController.text.isEmpty ||
                                    dateController.text.isEmpty ||
                                    maxScoreController.text.isEmpty) {
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    const SnackBar(content: Text('Please fill all fields')),
                                  );
                                  return;
                                }

                                setModalState(() => isSubmitting = true);

                                try {
                                  final authProvider = Provider.of<AuthProvider>(context, listen: false);
                                  final accessToken = authProvider.instituteData['accessToken'];
                                  final refreshToken = authProvider.instituteData['refreshToken'];

                                  await LecturerService.createExam(
                                    accessToken: accessToken,
                                    courseId: _courseId!,
                                    examData: {
                                      'title': titleController.text,
                                      'date': dateController.text,
                                      'max_score': int.parse(maxScoreController.text),
                                    },
                                    refreshToken: refreshToken,
                                    onTokenRefreshed: (tokens) {
                                      authProvider.onTokenRefreshed(tokens);
                                    },
                                    onSessionExpired: () {
                                      authProvider.onSessionExpired();
                                    },
                                  );

                                  if (context.mounted) {
                                    Navigator.pop(context);
                                    ScaffoldMessenger.of(context).showSnackBar(
                                      const SnackBar(
                                        content: Text('Exam created successfully!'),
                                        backgroundColor: Colors.green,
                                      ),
                                    );
                                  }
                                } catch (e) {
                                  setModalState(() => isSubmitting = false);
                                  if (context.mounted) {
                                    ScaffoldMessenger.of(context).showSnackBar(
                                      SnackBar(
                                        content: Text(e is ApiException ? e.message : 'Failed to create exam'),
                                        backgroundColor: Colors.red,
                                      ),
                                    );
                                  }
                                }
                              },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.purple,
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 16),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                        child: isSubmitting
                            ? const SizedBox(
                                width: 24,
                                height: 24,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                  valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                                ),
                              )
                            : const Text(
                                'Create Exam',
                                style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                              ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          );
        },
      ),
    );
  }

  void _showSubmitGradesModal(BuildContext context, bool isDark) {
    List<dynamic> exams = [];
    int? selectedExamId;
    List<dynamic> students = [];
    Map<int, TextEditingController> scoreControllers = {};
    bool isLoadingExams = true;
    bool isLoadingStudents = false;
    bool isSubmitting = false;
    bool hasLoadedExams = false;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => StatefulBuilder(
        builder: (context, setModalState) {
          // Load exams on first build
          if (!hasLoadedExams) {
            hasLoadedExams = true;
            _loadExams(context, setModalState, (loadedExams, error) {
              setModalState(() {
                exams = loadedExams;
                isLoadingExams = false;
              });
            });
          }

          return AnimatedOpacity(
            opacity: 1.0,
            duration: const Duration(milliseconds: 300),
            child: Container(
              height: MediaQuery.of(context).size.height * 0.85,
              decoration: BoxDecoration(
                color: isDark ? AppTheme.navy800 : Colors.white,
                borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
              ),
              child: Column(
                children: [
                  // Handle bar
                  Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      children: [
                        Container(
                          width: 40,
                          height: 4,
                          decoration: BoxDecoration(
                            color: Colors.grey.shade300,
                            borderRadius: BorderRadius.circular(2),
                          ),
                        ),
                        const SizedBox(height: 16),
                        Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.all(10),
                              decoration: BoxDecoration(
                                color: Colors.green.withOpacity(0.1),
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: const Icon(Icons.grade, color: Colors.green),
                            ),
                            const SizedBox(width: 12),
                            const Text(
                              'Submit Grades',
                              style: TextStyle(
                                fontSize: 20,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),

                  Expanded(
                    child: isLoadingExams
                        ? const Center(child: CircularProgressIndicator())
                        : exams.isEmpty
                            ? Center(
                                child: Column(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    Icon(Icons.quiz_outlined, size: 64, color: Colors.grey.shade400),
                                    const SizedBox(height: 16),
                                    Text(
                                      'No exams found',
                                      style: TextStyle(
                                        fontSize: 16,
                                        color: Colors.grey.shade600,
                                      ),
                                    ),
                                    const SizedBox(height: 8),
                                    Text(
                                      'Create an exam first to submit grades',
                                      style: TextStyle(
                                        fontSize: 14,
                                        color: Colors.grey.shade500,
                                      ),
                                    ),
                                  ],
                                ),
                              )
                            : SingleChildScrollView(
                            padding: const EdgeInsets.symmetric(horizontal: 16),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                // Exam Selection
                                const Text(
                                  'Select Exam',
                                  style: TextStyle(fontWeight: FontWeight.w600),
                                ),
                                const SizedBox(height: 8),
                                Container(
                                  decoration: BoxDecoration(
                                    border: Border.all(color: Colors.grey.shade300),
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                  child: DropdownButtonHideUnderline(
                                    child: DropdownButton<int>(
                                      value: selectedExamId,
                                      isExpanded: true,
                                      hint: const Padding(
                                        padding: EdgeInsets.symmetric(horizontal: 16),
                                        child: Text('Choose an exam'),
                                      ),
                                      padding: const EdgeInsets.symmetric(horizontal: 16),
                                      borderRadius: BorderRadius.circular(12),
                                      items: exams.asMap().entries.map((entry) {
                                        final exam = entry.value;
                                        return DropdownMenuItem<int>(
                                          value: exam['id'] ?? entry.key,
                                          child: Text(exam['title'] ?? 'Exam ${exam['id'] ?? entry.key}'),
                                        );
                                      }).toList(),
                                      onChanged: (value) async {
                                        setModalState(() {
                                          selectedExamId = value;
                                          isLoadingStudents = true;
                                          students = [];
                                          scoreControllers.clear();
                                        });

                                        // Load students
                                        try {
                                          final response = await LecturerService.getCourseStudents(_courseId!, 1);
                                          final studentsList = response['students'] ?? response['data'] ?? [];
                                          setModalState(() {
                                            students = studentsList;
                                            for (var student in studentsList) {
                                              scoreControllers[student['id']] = TextEditingController();
                                            }
                                            isLoadingStudents = false;
                                          });
                                        } catch (e) {
                                          setModalState(() {
                                            isLoadingStudents = false;
                                          });
                                        }
                                      },
                                    ),
                                  ),
                                ),

                                if (isLoadingStudents) ...[
                                  const SizedBox(height: 24),
                                  const Center(child: CircularProgressIndicator()),
                                ],

                                if (students.isNotEmpty) ...[
                                  const SizedBox(height: 24),
                                  Text(
                                    'Enter Scores (${students.length} students)',
                                    style: const TextStyle(fontWeight: FontWeight.w600),
                                  ),
                                  const SizedBox(height: 12),
                                  ...students.map((student) {
                                    return Container(
                                      margin: const EdgeInsets.only(bottom: 12),
                                      padding: const EdgeInsets.all(12),
                                      decoration: BoxDecoration(
                                        color: isDark ? AppTheme.navy900 : Colors.grey.shade50,
                                        borderRadius: BorderRadius.circular(12),
                                      ),
                                      child: Row(
                                        children: [
                                          CircleAvatar(
                                            radius: 20,
                                            backgroundColor: Colors.green.withOpacity(0.1),
                                            child: Text(
                                              (student['name'] ?? student['username'] ?? 'S')[0].toUpperCase(),
                                              style: const TextStyle(
                                                color: Colors.green,
                                                fontWeight: FontWeight.bold,
                                              ),
                                            ),
                                          ),
                                          const SizedBox(width: 12),
                                          Expanded(
                                            child: Column(
                                              crossAxisAlignment: CrossAxisAlignment.start,
                                              children: [
                                                Text(
                                                  student['name'] ?? student['username'] ?? 'Student',
                                                  style: const TextStyle(fontWeight: FontWeight.w500),
                                                ),
                                                Text(
                                                  'ID: ${student['id']}',
                                                  style: TextStyle(
                                                    fontSize: 12,
                                                    color: Colors.grey.shade500,
                                                  ),
                                                ),
                                              ],
                                            ),
                                          ),
                                          SizedBox(
                                            width: 80,
                                            child: TextField(
                                              controller: scoreControllers[student['id']],
                                              keyboardType: TextInputType.number,
                                              textAlign: TextAlign.center,
                                              decoration: InputDecoration(
                                                hintText: 'Score',
                                                contentPadding: const EdgeInsets.symmetric(
                                                  horizontal: 8,
                                                  vertical: 8,
                                                ),
                                                border: OutlineInputBorder(
                                                  borderRadius: BorderRadius.circular(8),
                                                ),
                                              ),
                                            ),
                                          ),
                                        ],
                                      ),
                                    );
                                  }),
                                ],
                              ],
                            ),
                          ),
                  ),

                  // Submit Button for grades
                  if (students.isNotEmpty && exams.isNotEmpty)
                    Padding(
                      padding: const EdgeInsets.all(16),
                      child: SizedBox(
                        width: double.infinity,
                        child: ElevatedButton(
                          onPressed: isSubmitting
                              ? null
                              : () async {
                                  setModalState(() => isSubmitting = true);

                                  try {
                                    final authProvider = Provider.of<AuthProvider>(context, listen: false);
                                    final accessToken = authProvider.instituteData['accessToken'];
                                    final refreshToken = authProvider.instituteData['refreshToken'];

                                    final grades = <Map<String, dynamic>>[];
                                    for (var student in students) {
                                      final scoreText = scoreControllers[student['id']]?.text;
                                      if (scoreText != null && scoreText.isNotEmpty) {
                                        grades.add({
                                          'student_id': student['id'],
                                          'score': double.parse(scoreText),
                                        });
                                      }
                                    }

                                    if (grades.isEmpty) {
                                      setModalState(() => isSubmitting = false);
                                      ScaffoldMessenger.of(context).showSnackBar(
                                        const SnackBar(content: Text('Please enter at least one score')),
                                      );
                                      return;
                                    }

                                    await LecturerService.submitExamGrades(
                                      accessToken: accessToken,
                                      examId: selectedExamId!,
                                      grades: grades,
                                      refreshToken: refreshToken,
                                      onTokenRefreshed: (tokens) {
                                        authProvider.onTokenRefreshed(tokens);
                                      },
                                      onSessionExpired: () {
                                        authProvider.onSessionExpired();
                                      },
                                    );

                                    if (context.mounted) {
                                      Navigator.pop(context);
                                      ScaffoldMessenger.of(context).showSnackBar(
                                        const SnackBar(
                                          content: Text('Grades submitted successfully!'),
                                          backgroundColor: Colors.green,
                                        ),
                                      );
                                    }
                                  } catch (e) {
                                    setModalState(() => isSubmitting = false);
                                    if (context.mounted) {
                                      ScaffoldMessenger.of(context).showSnackBar(
                                        SnackBar(
                                          content: Text(e is ApiException ? e.message : 'Failed to submit grades'),
                                          backgroundColor: Colors.red,
                                        ),
                                      );
                                    }
                                  }
                                },
                          style: ElevatedButton.styleFrom(
                            backgroundColor: Colors.green,
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(vertical: 16),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12),
                            ),
                          ),
                          child: isSubmitting
                              ? const SizedBox(
                                  width: 24,
                                  height: 24,
                                  child: CircularProgressIndicator(
                                    strokeWidth: 2,
                                    valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                                  ),
                                )
                              : const Text(
                                  'Submit Grades',
                                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                                ),
                        ),
                      ),
                    ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  void _loadExams(BuildContext context, StateSetter setModalState, Function(List<dynamic>, String?) callback) async {
    try {
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      final accessToken = authProvider.instituteData['accessToken'];
      final refreshToken = authProvider.instituteData['refreshToken'];

      final response = await LecturerService.getLecturerExams(
        accessToken: accessToken,
        refreshToken: refreshToken,
        onTokenRefreshed: (tokens) {
          authProvider.onTokenRefreshed(tokens);
        },
        onSessionExpired: () {
          authProvider.onSessionExpired();
        },
      );

      final rawExams = response['exams'] ?? response['data'] ?? response['results'] ?? [];
      // Deduplicate exams by ID
      final seenIds = <int>{};
      final examsList = <dynamic>[];
      for (var exam in rawExams) {
        final id = exam['id'];
        if (id != null && !seenIds.contains(id)) {
          seenIds.add(id);
          examsList.add(exam);
        }
      }
      callback(examsList, null);
    } catch (e) {
      callback([], e is ApiException ? e.message : 'Failed to load exams');
    }
  }

  void _showMarkAttendanceModal(BuildContext context, bool isDark) {
    int? selectedLecture;
    List<dynamic> students = [];
    Map<int, String> attendanceStatus = {}; // student_id -> 'present' or 'absent'
    bool isLoadingStudents = false;
    bool isSubmitting = false;
    final totalLectures = _progress?['total_lectures'] ?? 10;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => StatefulBuilder(
        builder: (context, setModalState) {
          return AnimatedContainer(
            duration: const Duration(milliseconds: 300),
            height: MediaQuery.of(context).size.height * 0.85,
            decoration: BoxDecoration(
              color: isDark ? AppTheme.navy800 : Colors.white,
              borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
            ),
            child: Column(
              children: [
                // Handle bar
                Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    children: [
                      Container(
                        width: 40,
                        height: 4,
                        decoration: BoxDecoration(
                          color: Colors.grey.shade300,
                          borderRadius: BorderRadius.circular(2),
                        ),
                      ),
                      const SizedBox(height: 16),
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(10),
                            decoration: BoxDecoration(
                              color: Colors.blue.withOpacity(0.1),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: const Icon(Icons.checklist, color: Colors.blue),
                          ),
                          const SizedBox(width: 12),
                          const Text(
                            'Mark Attendance',
                            style: TextStyle(
                              fontSize: 20,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),

                Expanded(
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Lecture Selection
                        const Text(
                          'Select Lecture',
                          style: TextStyle(fontWeight: FontWeight.w600),
                        ),
                        const SizedBox(height: 8),
                        Container(
                          decoration: BoxDecoration(
                            border: Border.all(color: Colors.grey.shade300),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: DropdownButtonHideUnderline(
                            child: DropdownButton<int>(
                              value: selectedLecture,
                              isExpanded: true,
                              hint: const Padding(
                                padding: EdgeInsets.symmetric(horizontal: 16),
                                child: Text('Choose lecture number'),
                              ),
                              padding: const EdgeInsets.symmetric(horizontal: 16),
                              borderRadius: BorderRadius.circular(12),
                              items: List.generate(totalLectures, (i) => i + 1).map((num) {
                                return DropdownMenuItem<int>(
                                  value: num,
                                  child: Text('Lecture $num'),
                                );
                              }).toList(),
                              onChanged: (value) async {
                                setModalState(() {
                                  selectedLecture = value;
                                  isLoadingStudents = true;
                                  students = [];
                                  attendanceStatus.clear();
                                });

                                // Load students
                                try {
                                  final response = await LecturerService.getCourseStudents(_courseId!, value!);
                                  final studentsList = response['students'] ?? response['data'] ?? [];
                                  setModalState(() {
                                    students = studentsList;
                                    for (var student in studentsList) {
                                      attendanceStatus[student['id']] = 'present'; // Default to present
                                    }
                                    isLoadingStudents = false;
                                  });
                                } catch (e) {
                                  setModalState(() {
                                    isLoadingStudents = false;
                                  });
                                }
                              },
                            ),
                          ),
                        ),

                        if (isLoadingStudents) ...[
                          const SizedBox(height: 24),
                          const Center(child: CircularProgressIndicator()),
                        ],

                        if (students.isNotEmpty) ...[
                          const SizedBox(height: 24),
                          Text(
                            'Students (${students.length})',
                            style: const TextStyle(fontWeight: FontWeight.w600),
                          ),
                          const SizedBox(height: 12),
                          ...students.map((student) {
                            final status = attendanceStatus[student['id']] ?? 'present';
                            return Container(
                              margin: const EdgeInsets.only(bottom: 12),
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(
                                color: isDark ? AppTheme.navy900 : Colors.grey.shade50,
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: Row(
                                children: [
                                  CircleAvatar(
                                    radius: 20,
                                    backgroundColor: status == 'present'
                                        ? Colors.green.withOpacity(0.1)
                                        : Colors.red.withOpacity(0.1),
                                    child: Icon(
                                      status == 'present' ? Icons.check : Icons.close,
                                      color: status == 'present' ? Colors.green : Colors.red,
                                    ),
                                  ),
                                  const SizedBox(width: 12),
                                  Expanded(
                                    child: Text(
                                      student['name'] ?? student['username'] ?? 'Student',
                                      style: const TextStyle(fontWeight: FontWeight.w500),
                                    ),
                                  ),
                                  Row(
                                    children: [
                                      _buildAttendanceButton(
                                        'Present',
                                        Colors.green,
                                        status == 'present',
                                        () {
                                          setModalState(() {
                                            attendanceStatus[student['id']] = 'present';
                                          });
                                        },
                                      ),
                                      const SizedBox(width: 8),
                                      _buildAttendanceButton(
                                        'Absent',
                                        Colors.red,
                                        status == 'absent',
                                        () {
                                          setModalState(() {
                                            attendanceStatus[student['id']] = 'absent';
                                          });
                                        },
                                      ),
                                    ],
                                  ),
                                ],
                              ),
                            );
                          }),
                        ],
                      ],
                    ),
                  ),
                ),

                // Submit Button
                if (students.isNotEmpty)
                  Padding(
                    padding: const EdgeInsets.all(16),
                    child: SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        onPressed: isSubmitting
                            ? null
                            : () async {
                                setModalState(() => isSubmitting = true);

                                try {
                                  final authProvider = Provider.of<AuthProvider>(context, listen: false);
                                  final accessToken = authProvider.instituteData['accessToken'];
                                  final refreshToken = authProvider.instituteData['refreshToken'];

                                  final records = students.map((student) {
                                    return {
                                      'username': student['username'],
                                      'status': attendanceStatus[student['id']] ?? 'present',
                                    };
                                  }).toList();

                                  await LecturerService.markAttendance(
                                    accessToken: accessToken,
                                    courseId: _courseId!,
                                    lectureNumber: selectedLecture!,
                                    records: records,
                                    refreshToken: refreshToken,
                                    onTokenRefreshed: (tokens) {
                                      authProvider.onTokenRefreshed(tokens);
                                    },
                                    onSessionExpired: () {
                                      authProvider.onSessionExpired();
                                    },
                                  );

                                  if (context.mounted) {
                                    Navigator.pop(context);
                                    ScaffoldMessenger.of(context).showSnackBar(
                                      const SnackBar(
                                        content: Text('Attendance saved successfully!'),
                                        backgroundColor: Colors.green,
                                      ),
                                    );
                                  }
                                } catch (e) {
                                  setModalState(() => isSubmitting = false);
                                  if (context.mounted) {
                                    ScaffoldMessenger.of(context).showSnackBar(
                                      SnackBar(
                                        content: Text(e is ApiException ? e.message : 'Failed to save attendance'),
                                        backgroundColor: Colors.red,
                                      ),
                                    );
                                  }
                                }
                              },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.blue,
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 16),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                        child: isSubmitting
                            ? const SizedBox(
                                width: 24,
                                height: 24,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                  valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                                ),
                              )
                            : const Text(
                                'Save Attendance',
                                style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                              ),
                      ),
                    ),
                  ),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildAttendanceButton(String label, Color color, bool isSelected, VoidCallback onTap) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(8),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: isSelected ? color : color.withOpacity(0.1),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w600,
            color: isSelected ? Colors.white : color,
          ),
        ),
      ),
    );
  }

  void _showViewAttendanceModal(BuildContext context, bool isDark) {
    int? selectedLecture;
    Map<String, dynamic>? attendanceData;
    bool isLoading = false;
    final totalLectures = _progress?['total_lectures'] ?? 10;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => StatefulBuilder(
        builder: (context, setModalState) {
          return AnimatedOpacity(
            opacity: 1.0,
            duration: const Duration(milliseconds: 300),
            child: Container(
              height: MediaQuery.of(context).size.height * 0.85,
              decoration: BoxDecoration(
                color: isDark ? AppTheme.navy800 : Colors.white,
                borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
              ),
              child: Column(
                children: [
                  // Handle bar
                  Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      children: [
                        Container(
                          width: 40,
                          height: 4,
                          decoration: BoxDecoration(
                            color: Colors.grey.shade300,
                            borderRadius: BorderRadius.circular(2),
                          ),
                        ),
                        const SizedBox(height: 16),
                        Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.all(10),
                              decoration: BoxDecoration(
                                color: Colors.teal.withOpacity(0.1),
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: const Icon(Icons.visibility, color: Colors.teal),
                            ),
                            const SizedBox(width: 12),
                            const Text(
                              'View Attendance',
                              style: TextStyle(
                                fontSize: 20,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),

                  Expanded(
                    child: SingleChildScrollView(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // Lecture Selection
                          const Text(
                            'Select Lecture',
                            style: TextStyle(fontWeight: FontWeight.w600),
                          ),
                          const SizedBox(height: 8),
                          Container(
                            decoration: BoxDecoration(
                              border: Border.all(color: Colors.grey.shade300),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: DropdownButtonHideUnderline(
                              child: DropdownButton<int>(
                                value: selectedLecture,
                                isExpanded: true,
                                hint: const Padding(
                                  padding: EdgeInsets.symmetric(horizontal: 16),
                                  child: Text('Choose lecture number'),
                                ),
                                padding: const EdgeInsets.symmetric(horizontal: 16),
                                borderRadius: BorderRadius.circular(12),
                                items: List.generate(totalLectures, (i) => i + 1).map((num) {
                                  return DropdownMenuItem<int>(
                                    value: num,
                                    child: Text('Lecture $num'),
                                  );
                                }).toList(),
                                onChanged: (value) async {
                                  setModalState(() {
                                    selectedLecture = value;
                                    isLoading = true;
                                    attendanceData = null;
                                  });

                                  try {
                                    final authProvider = Provider.of<AuthProvider>(context, listen: false);
                                    final accessToken = authProvider.instituteData['accessToken'];
                                    final refreshToken = authProvider.instituteData['refreshToken'];

                                    final response = await LecturerService.viewLectureAttendance(
                                      accessToken: accessToken,
                                      courseId: _courseId!,
                                      lectureNumber: value!,
                                      refreshToken: refreshToken,
                                      onTokenRefreshed: (tokens) {
                                        authProvider.onTokenRefreshed(tokens);
                                      },
                                      onSessionExpired: () {
                                        authProvider.onSessionExpired();
                                      },
                                    );

                                    setModalState(() {
                                      attendanceData = response;
                                      isLoading = false;
                                    });
                                  } catch (e) {
                                    setModalState(() {
                                      isLoading = false;
                                    });
                                    if (context.mounted) {
                                      ScaffoldMessenger.of(context).showSnackBar(
                                        SnackBar(
                                          content: Text(e is ApiException ? e.message : 'Failed to load attendance'),
                                          backgroundColor: Colors.red,
                                        ),
                                      );
                                    }
                                  }
                                },
                              ),
                            ),
                          ),

                          if (isLoading) ...[
                            const SizedBox(height: 24),
                            const Center(child: CircularProgressIndicator()),
                          ],

                          if (attendanceData != null) ...[
                            const SizedBox(height: 24),

                            // Summary
                            Container(
                              padding: const EdgeInsets.all(16),
                              decoration: BoxDecoration(
                                color: Colors.teal.withOpacity(0.1),
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: Row(
                                mainAxisAlignment: MainAxisAlignment.spaceAround,
                                children: [
                                  Column(
                                    children: [
                                      Text(
                                        attendanceData!['course'] ?? 'Course',
                                        style: const TextStyle(
                                          fontWeight: FontWeight.bold,
                                          fontSize: 16,
                                        ),
                                      ),
                                      const SizedBox(height: 4),
                                      Text(
                                        'Lecture ${attendanceData!['lecture_number']}',
                                        style: TextStyle(
                                          color: Colors.grey.shade600,
                                        ),
                                      ),
                                    ],
                                  ),
                                ],
                              ),
                            ),

                            const SizedBox(height: 16),
                            const Text(
                              'Attendance Records',
                              style: TextStyle(fontWeight: FontWeight.w600),
                            ),
                            const SizedBox(height: 12),

                            // Records list
                            ...(attendanceData!['records'] as List? ?? []).map((record) {
                              final isPresent = record['status'] == 'present';
                              return Container(
                                margin: const EdgeInsets.only(bottom: 8),
                                padding: const EdgeInsets.all(12),
                                decoration: BoxDecoration(
                                  color: isDark ? AppTheme.navy900 : Colors.grey.shade50,
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                child: Row(
                                  children: [
                                    CircleAvatar(
                                      radius: 18,
                                      backgroundColor: isPresent
                                          ? Colors.green.withOpacity(0.1)
                                          : Colors.red.withOpacity(0.1),
                                      child: Icon(
                                        isPresent ? Icons.check : Icons.close,
                                        size: 18,
                                        color: isPresent ? Colors.green : Colors.red,
                                      ),
                                    ),
                                    const SizedBox(width: 12),
                                    Expanded(
                                      child: Text(
                                        record['name'] ?? 'Student ${record['student_id']}',
                                        style: const TextStyle(fontWeight: FontWeight.w500),
                                      ),
                                    ),
                                    Container(
                                      padding: const EdgeInsets.symmetric(
                                        horizontal: 10,
                                        vertical: 4,
                                      ),
                                      decoration: BoxDecoration(
                                        color: isPresent ? Colors.green : Colors.red,
                                        borderRadius: BorderRadius.circular(20),
                                      ),
                                      child: Text(
                                        isPresent ? 'Present' : 'Absent',
                                        style: const TextStyle(
                                          color: Colors.white,
                                          fontSize: 12,
                                          fontWeight: FontWeight.w600,
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              );
                            }),
                          ],
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}

