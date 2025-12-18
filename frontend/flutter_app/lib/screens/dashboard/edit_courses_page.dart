import 'dart:io';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:image_picker/image_picker.dart';
import '../../providers/auth_provider.dart';
import '../../services/api_service.dart';

class EditCoursesPage extends StatefulWidget {
  const EditCoursesPage({super.key});

  @override
  State<EditCoursesPage> createState() => _EditCoursesPageState();
}

class _EditCoursesPageState extends State<EditCoursesPage> {
  List<dynamic> _courses = [];
  Map<String, dynamic>? _selectedCourse;
  bool _isLoadingCourses = false;
  bool _isUpdatingCourse = false;
  String? _error;

  // Form controllers
  final _titleController = TextEditingController();
  final _priceController = TextEditingController();
  final _aboutController = TextEditingController();
  final _startingDateController = TextEditingController();
  final _endingDateController = TextEditingController();
  final _startTimeController = TextEditingController();
  final _endTimeController = TextEditingController();

  String _level = 'beginner';
  List<String> _selectedDays = [];
  Map<String, dynamic>? _selectedLecturer;
  bool _isLoadingLecturers = false;
  bool _isCheckingAvailability = false;
  List<dynamic> _markedLecturers = [];
  Map<String, dynamic>? _lecturerConflict;
  File? _courseImage;
  final ImagePicker _picker = ImagePicker();

  final List<String> _days = [
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
    'sunday',
  ];

  @override
  void initState() {
    super.initState();
    _fetchCourses();
    _fetchMarkedLecturers();
  }

  @override
  void dispose() {
    _titleController.dispose();
    _priceController.dispose();
    _aboutController.dispose();
      _startingDateController.dispose();
      _endingDateController.dispose();
      _startTimeController.dispose();
      _endTimeController.dispose();
      super.dispose();
  }

  Future<void> _fetchCourses() async {
    setState(() {
      _isLoadingCourses = true;
      _error = null;
    });

    try {
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      final accessToken = authProvider.accessToken;
      final refreshToken = authProvider.refreshToken;

      if (accessToken == null) {
        throw Exception('Not authenticated');
      }

      // Step 1: Fetch profile information from /institution/my-profile/
      final profileData = await ApiService.getInstitutionMyProfile(
        accessToken: accessToken,
        refreshToken: refreshToken,
        onTokenRefreshed: (tokens) {
          authProvider.onTokenRefreshed(tokens);
        },
        onSessionExpired: () {
          authProvider.logout();
        },
      );

      // Step 2: Extract username from profile
      String? username;
      if (profileData['success'] == true && profileData['data'] != null) {
        final data = profileData['data'];
        username = data['username']?.toString();
      }

      if (username == null || username.isEmpty) {
        throw Exception('Username not found in profile');
      }

      // Step 3: Use username to fetch courses from /institution/<username>/courses/
      final coursesData = await ApiService.getInstitutionCourses(username);

      if (coursesData['results'] != null) {
        setState(() {
          _courses = coursesData['results'] is List ? coursesData['results'] : [];
        });
      } else if (coursesData['data'] != null) {
        setState(() {
          _courses = coursesData['data'] is List ? coursesData['data'] : [];
        });
      } else {
        setState(() {
          _courses = [];
        });
      }
    } catch (e) {
      setState(() {
        _error = e.toString();
        _courses = [];
      });
    } finally {
      setState(() {
        _isLoadingCourses = false;
      });
    }
  }

  Future<void> _fetchMarkedLecturers() async {
    setState(() {
      _isLoadingLecturers = true;
    });

    try {
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      final accessToken = authProvider.accessToken;
      final refreshToken = authProvider.refreshToken;

      if (accessToken == null) {
        throw Exception('Not authenticated');
      }

      final data = await ApiService.getMarkedLecturers(
        accessToken: accessToken,
        refreshToken: refreshToken,
        onTokenRefreshed: (tokens) {
          authProvider.onTokenRefreshed(tokens);
        },
        onSessionExpired: () {
          authProvider.logout();
        },
      );

      if (data['success'] == true && data['lecturers'] != null) {
        setState(() {
          _markedLecturers = data['lecturers'] is List ? data['lecturers'] : [];
        });
      } else {
        setState(() {
          _markedLecturers = [];
        });
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error loading lecturers: ${e.toString()}')),
        );
      }
      setState(() {
        _markedLecturers = [];
      });
    } finally {
      setState(() {
        _isLoadingLecturers = false;
      });
    }
  }

  Future<void> _checkLecturerAvailability() async {
    if (_selectedLecturer == null ||
        _selectedDays.isEmpty ||
        _startTimeController.text.trim().isEmpty ||
        _endTimeController.text.trim().isEmpty) {
      return;
    }

    setState(() {
      _isCheckingAvailability = true;
      _lecturerConflict = null;
    });

    try {
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      final accessToken = authProvider.accessToken;
      final refreshToken = authProvider.refreshToken;

      if (accessToken == null) {
        throw Exception('Not authenticated');
      }

      final lecturerId = _selectedLecturer!['id'] as int;
      final data = await ApiService.checkLecturerAvailability(
        accessToken: accessToken,
        lecturerId: lecturerId,
        days: _selectedDays,
        startTime: _startTimeController.text.trim(),
        endTime: _endTimeController.text.trim(),
        refreshToken: refreshToken,
        onTokenRefreshed: (tokens) {
          authProvider.onTokenRefreshed(tokens);
        },
        onSessionExpired: () {
          authProvider.logout();
        },
      );

      if (data['success'] == true) {
        if (data['contradiction'] == null) {
          // Lecturer is free
          setState(() {
            _lecturerConflict = null;
          });
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text('Lecturer is available for the selected schedule'),
                backgroundColor: Colors.green,
              ),
            );
          }
        } else {
          // Lecturer has conflicts
          setState(() {
            _lecturerConflict = data['contradiction'];
          });
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text('Lecturer has scheduling conflicts'),
                backgroundColor: Colors.orange,
              ),
            );
          }
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error checking availability: ${e.toString()}')),
        );
      }
    } finally {
      setState(() {
        _isCheckingAvailability = false;
      });
    }
  }

  void _selectCourse(Map<String, dynamic> course) {
    setState(() {
      _selectedCourse = course;
      _titleController.text = course['title'] ?? '';
      _priceController.text = course['price']?.toString() ?? '';
      _aboutController.text = course['about'] ?? '';
      _startingDateController.text = course['starting_date'] ?? '';
      _endingDateController.text = course['ending_date'] ?? '';
      
      // Convert 24-hour time to 12-hour format for display
      final startTime = course['start_time'] ?? '';
      final endTime = course['end_time'] ?? '';
      _startTimeController.text = startTime.isNotEmpty ? _convertTo12Hour(startTime) : '';
      _endTimeController.text = endTime.isNotEmpty ? _convertTo12Hour(endTime) : '';
      
      // Find and set selected lecturer from marked lecturers
      final lecturerId = course['lecturer'];
      if (lecturerId != null) {
        final lecturer = _markedLecturers.firstWhere(
          (l) => l['id'] == lecturerId,
          orElse: () => null,
        );
        _selectedLecturer = lecturer;
      } else {
        _selectedLecturer = null;
      }
      
      _level = course['level'] ?? 'beginner';
      _selectedDays = course['days'] is List
          ? List<String>.from(course['days'])
          : [];
      _lecturerConflict = null;
      _courseImage = null;
    });
  }

  void _clearSelection() {
    setState(() {
      _selectedCourse = null;
      _titleController.clear();
      _priceController.clear();
      _aboutController.clear();
      _startingDateController.clear();
      _endingDateController.clear();
      _startTimeController.clear();
      _endTimeController.clear();
      _level = 'beginner';
      _selectedDays = [];
      _selectedLecturer = null;
      _lecturerConflict = null;
      _courseImage = null;
    });
  }

  void _unselectLecturer() {
    setState(() {
      _selectedLecturer = null;
      _lecturerConflict = null;
    });
  }

  String _convertTo24Hour(String time12) {
    try {
      final parts = time12.split(' ');
      if (parts.length != 2) return time12; // Already 24-hour or invalid
      
      final timePart = parts[0];
      final period = parts[1].toUpperCase();
      final timeComponents = timePart.split(':');
      
      if (timeComponents.length != 2) return time12;
      
      int hour = int.parse(timeComponents[0]);
      final minute = timeComponents[1];
      
      if (period == 'PM' && hour != 12) {
        hour += 12;
      } else if (period == 'AM' && hour == 12) {
        hour = 0;
      }
      
      return '${hour.toString().padLeft(2, '0')}:$minute';
    } catch (e) {
      return time12; // Return original if conversion fails
    }
  }

  Future<void> _pickImage() async {
    try {
      final XFile? image = await _picker.pickImage(source: ImageSource.gallery);
      if (image != null) {
        setState(() {
          _courseImage = File(image.path);
        });
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error picking image: $e')),
        );
      }
    }
  }

  String _convertTo12Hour(String time24) {
    try {
      final parts = time24.split(':');
      final hour = int.parse(parts[0]);
      final minute = parts[1];
      final period = hour >= 12 ? 'PM' : 'AM';
      final hour12 = hour % 12 == 0 ? 12 : hour % 12;
      return '${hour12.toString().padLeft(2, '0')}:$minute $period';
    } catch (e) {
      return time24;
    }
  }

  Future<void> _selectDate(BuildContext context, bool isStartDate) async {
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: DateTime.now(),
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 365 * 5)),
    );
    if (picked != null) {
      final dateStr =
          '${picked.year}-${picked.month.toString().padLeft(2, '0')}-${picked.day.toString().padLeft(2, '0')}';
      if (isStartDate) {
        _startingDateController.text = dateStr;
      } else {
        _endingDateController.text = dateStr;
      }
    }
  }

  Future<void> _selectTime(BuildContext context, bool isStartTime) async {
    final TimeOfDay? picked = await showTimePicker(
      context: context,
      initialTime: TimeOfDay.now(),
    );
    if (picked != null) {
      final time24 =
          '${picked.hour.toString().padLeft(2, '0')}:${picked.minute.toString().padLeft(2, '0')}';
      final time12 = _convertTo12Hour(time24);
      if (isStartTime) {
        _startTimeController.text = time12;
      } else {
        _endTimeController.text = time12;
      }
      
      // Check availability when time is selected
      if (_selectedLecturer != null && _selectedDays.isNotEmpty) {
        _checkLecturerAvailability();
      }
    }
  }

  Future<void> _updateCourse() async {
    if (_selectedCourse == null || _selectedCourse!['id'] == null) {
      return;
    }

    setState(() {
      _isUpdatingCourse = true;
    });

    try {
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      final accessToken = authProvider.accessToken;
      final refreshToken = authProvider.refreshToken;

      if (accessToken == null) {
        throw Exception('Not authenticated');
      }

      final payload = <String, dynamic>{};

      if (_titleController.text.trim().isNotEmpty) {
        payload['title'] = _titleController.text.trim();
      }
      if (_priceController.text.trim().isNotEmpty) {
        payload['price'] = _priceController.text.trim();
      }
      if (_aboutController.text.trim().isNotEmpty) {
        payload['about'] = _aboutController.text.trim();
      }
      if (_startingDateController.text.trim().isNotEmpty) {
        payload['starting_date'] = _startingDateController.text.trim();
      }
      if (_endingDateController.text.trim().isNotEmpty) {
        payload['ending_date'] = _endingDateController.text.trim();
      }
      // Convert 12-hour time to 24-hour format for backend
      if (_startTimeController.text.trim().isNotEmpty) {
        payload['start_time'] = _convertTo24Hour(_startTimeController.text.trim());
      }
      if (_endTimeController.text.trim().isNotEmpty) {
        payload['end_time'] = _convertTo24Hour(_endTimeController.text.trim());
      }
      if (_selectedLecturer != null) {
        payload['lecturer'] = _selectedLecturer!['id'];
      }
      payload['level'] = _level;
      if (_selectedDays.isNotEmpty) {
        payload['days'] = _selectedDays;
      }

      if (_courseImage != null) {
        payload['course_image'] = _courseImage!;
      }

      await ApiService.editInstitutionCourse(
        accessToken: accessToken,
        courseId: _selectedCourse!['id'],
        payload: payload,
        refreshToken: refreshToken,
        onTokenRefreshed: (tokens) {
          authProvider.onTokenRefreshed(tokens);
        },
        onSessionExpired: () {
          authProvider.logout();
        },
      );

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Course updated successfully!')),
        );
        _fetchCourses(); // Refresh course list
        _clearSelection();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error updating course: ${e.toString()}')),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isUpdatingCourse = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Scaffold(
      appBar: AppBar(
        title: Text(_selectedCourse == null ? 'Edit Courses' : 'Edit Course'),
        elevation: 0,
        leading: _selectedCourse != null
            ? IconButton(
                icon: const Icon(Icons.arrow_back),
                onPressed: _clearSelection,
              )
            : null,
      ),
      body: _selectedCourse == null
          ? _buildCourseList(theme, isDark)
          : _buildEditForm(theme, isDark),
    );
  }

  Widget _buildCourseList(ThemeData theme, bool isDark) {
    if (_isLoadingCourses) {
      return const Center(child: CircularProgressIndicator());
    }

    if (_error != null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.error_outline, size: 48, color: Colors.red),
            const SizedBox(height: 16),
            Text('Error: $_error'),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: _fetchCourses,
              child: const Text('Retry'),
            ),
          ],
        ),
      );
    }

    if (_courses.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.school_outlined, size: 64, color: Colors.grey),
            const SizedBox(height: 16),
            Text(
              'No courses available',
              style: theme.textTheme.titleLarge,
            ),
            const SizedBox(height: 8),
            Text(
              'Create a course first to edit it',
              style: theme.textTheme.bodyMedium?.copyWith(color: Colors.grey),
            ),
          ],
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: _courses.length,
      itemBuilder: (context, index) {
        final course = _courses[index];
        return Card(
          margin: const EdgeInsets.only(bottom: 12),
          child: ListTile(
            title: Text(
              course['title'] ?? 'Untitled',
              style: const TextStyle(fontWeight: FontWeight.bold),
            ),
            subtitle: Text(
              'Level: ${course['level'] ?? 'N/A'} • Price: \$${course['price'] ?? '0'}',
            ),
            trailing: const Icon(Icons.edit),
            onTap: () => _selectCourse(course),
          ),
        );
      },
    );
  }

  Widget _buildEditForm(ThemeData theme, bool isDark) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Title
          TextFormField(
            controller: _titleController,
            decoration: InputDecoration(
              labelText: 'Title',
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(8),
              ),
              filled: true,
              fillColor: isDark ? Colors.grey[900] : Colors.white,
            ),
          ),
          const SizedBox(height: 16),

          // Price and Level
          Row(
            children: [
              Expanded(
                child: TextFormField(
                  controller: _priceController,
                  decoration: InputDecoration(
                    labelText: 'Price (\$)',
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                    filled: true,
                    fillColor: isDark ? Colors.grey[900] : Colors.white,
                  ),
                  keyboardType: TextInputType.numberWithOptions(decimal: true),
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: DropdownButtonFormField<String>(
                  value: _level,
                  decoration: InputDecoration(
                    labelText: 'Level',
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                    filled: true,
                    fillColor: isDark ? Colors.grey[900] : Colors.white,
                  ),
                  items: const [
                    DropdownMenuItem(value: 'beginner', child: Text('Beginner')),
                    DropdownMenuItem(
                        value: 'intermediate', child: Text('Intermediate')),
                    DropdownMenuItem(value: 'advanced', child: Text('Advanced')),
                  ],
                  onChanged: (value) {
                    if (value != null) {
                      setState(() {
                        _level = value;
                      });
                    }
                  },
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),

          // Dates and Times (similar to CreateCoursePage)
          Row(
            children: [
              Expanded(
                child: TextFormField(
                  controller: _startingDateController,
                  decoration: InputDecoration(
                    labelText: 'Starting Date',
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                    filled: true,
                    fillColor: isDark ? Colors.grey[900] : Colors.white,
                    suffixIcon: const Icon(Icons.calendar_today),
                  ),
                  readOnly: true,
                  onTap: () => _selectDate(context, true),
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: TextFormField(
                  controller: _endingDateController,
                  decoration: InputDecoration(
                    labelText: 'Ending Date',
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                    filled: true,
                    fillColor: isDark ? Colors.grey[900] : Colors.white,
                    suffixIcon: const Icon(Icons.calendar_today),
                  ),
                  readOnly: true,
                  onTap: () => _selectDate(context, false),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),

          Row(
            children: [
              Expanded(
                child: TextFormField(
                  controller: _startTimeController,
                  decoration: InputDecoration(
                    labelText: 'Start Time',
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                    filled: true,
                    fillColor: isDark ? Colors.grey[900] : Colors.white,
                    suffixIcon: const Icon(Icons.access_time),
                  ),
                  readOnly: true,
                  onTap: () => _selectTime(context, true),
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: TextFormField(
                  controller: _endTimeController,
                  decoration: InputDecoration(
                    labelText: 'End Time',
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                    filled: true,
                    fillColor: isDark ? Colors.grey[900] : Colors.white,
                    suffixIcon: const Icon(Icons.access_time),
                  ),
                  readOnly: true,
                  onTap: () => _selectTime(context, false),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),

          // Lecturer Selection
          Text(
            'Lecturer',
            style: theme.textTheme.titleMedium,
          ),
          const SizedBox(height: 8),
          Text(
            'The list of lecturers you have',
            style: theme.textTheme.bodySmall?.copyWith(
              color: Colors.grey,
              fontStyle: FontStyle.italic,
            ),
          ),
          const SizedBox(height: 8),
          if (_isLoadingLecturers)
            const Center(child: Padding(
              padding: EdgeInsets.all(16.0),
              child: CircularProgressIndicator(),
            ))
          else if (_markedLecturers.isEmpty)
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                border: Border.all(color: Colors.grey),
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Text('No marked lecturers available'),
            )
          else
            Container(
              height: 200,
              decoration: BoxDecoration(
                border: Border.all(color: Colors.grey),
                borderRadius: BorderRadius.circular(8),
              ),
              child: ListView.builder(
                itemCount: _markedLecturers.length,
                itemBuilder: (context, index) {
                  final lecturer = _markedLecturers[index];
                  final isSelected = _selectedLecturer?['id'] == lecturer['id'];
                  final fullName = lecturer['full_name'] ?? 'Unknown';
                  final profileImage = lecturer['profile_image'];
                  
                  return ListTile(
                    leading: CircleAvatar(
                      backgroundImage: profileImage != null
                          ? NetworkImage(profileImage.toString().startsWith('http')
                              ? profileImage.toString()
                              : 'https://projecteastapi.ddns.net$profileImage')
                          : null,
                      child: profileImage == null
                          ? Text(fullName.isNotEmpty ? fullName[0].toUpperCase() : '?')
                          : null,
                    ),
                    title: Text(fullName),
                    subtitle: Text(lecturer['username'] ?? ''),
                    selected: isSelected,
                    selectedTileColor: isDark ? Colors.grey[800] : Colors.blue[50],
                    onTap: () {
                      setState(() {
                        _selectedLecturer = lecturer;
                        _lecturerConflict = null;
                      });
                      
                      // Check availability if days and times are already selected
                      if (_selectedDays.isNotEmpty &&
                          _startTimeController.text.trim().isNotEmpty &&
                          _endTimeController.text.trim().isNotEmpty) {
                        _checkLecturerAvailability();
                      }
                    },
                  );
                },
              ),
            ),
          if (_selectedLecturer != null) ...[
            const SizedBox(height: 12),
            Text(
              'You chose:',
              style: theme.textTheme.bodySmall?.copyWith(
                color: Colors.grey,
                fontStyle: FontStyle.italic,
              ),
            ),
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: isDark ? Colors.grey[800] : Colors.blue[50],
                borderRadius: BorderRadius.circular(8),
                border: Border.all(
                  color: _lecturerConflict != null ? Colors.red : Colors.blue,
                  width: 2,
                ),
              ),
              child: Row(
                children: [
                  CircleAvatar(
                    backgroundImage: _selectedLecturer!['profile_image'] != null
                        ? NetworkImage(
                            _selectedLecturer!['profile_image'].toString().startsWith('http')
                                ? _selectedLecturer!['profile_image'].toString()
                                : 'https://projecteastapi.ddns.net${_selectedLecturer!['profile_image']}')
                        : null,
                    child: _selectedLecturer!['profile_image'] == null
                        ? Text(
                            (_selectedLecturer!['full_name'] ?? 'Unknown')[0].toUpperCase())
                        : null,
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          _selectedLecturer!['full_name'] ?? 'Unknown',
                          style: const TextStyle(fontWeight: FontWeight.bold),
                        ),
                        if (_lecturerConflict != null)
                          Text(
                            '⚠️ Has scheduling conflicts',
                            style: TextStyle(color: Colors.red, fontSize: 12),
                          )
                        else if (_isCheckingAvailability)
                          const Text(
                            'Checking availability...',
                            style: TextStyle(fontSize: 12),
                          )
                        else if (_selectedDays.isNotEmpty &&
                            _startTimeController.text.trim().isNotEmpty &&
                            _endTimeController.text.trim().isNotEmpty)
                          const Text(
                            '✓ Available',
                            style: TextStyle(color: Colors.green, fontSize: 12),
                          ),
                      ],
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close, size: 20),
                    color: Colors.grey,
                    tooltip: 'Unselect lecturer',
                    onPressed: _unselectLecturer,
                  ),
                ],
              ),
            ),
            if (_lecturerConflict != null) ...[
              const SizedBox(height: 8),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.red[50],
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: Colors.red),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Scheduling Conflict:',
                      style: TextStyle(fontWeight: FontWeight.bold, color: Colors.red),
                    ),
                    const SizedBox(height: 4),
                    Text('Course: ${_lecturerConflict!['course_title'] ?? 'N/A'}'),
                    Text('Institution: ${_lecturerConflict!['institution'] ?? 'N/A'}'),
                    Text('Day: ${_lecturerConflict!['day'] ?? 'N/A'}'),
                    Text('Time: ${_lecturerConflict!['time'] ?? 'N/A'}'),
                  ],
                ),
              ),
            ],
          ],
          const SizedBox(height: 16),

          // Days
          Text('Days', style: theme.textTheme.titleMedium),
          const SizedBox(height: 8),
          Wrap(
            spacing: 12,
            runSpacing: 12,
            children: _days.map((day) {
              final isSelected = _selectedDays.contains(day);
              return FilterChip(
                label: Text(day.substring(0, 1).toUpperCase() + day.substring(1)),
                selected: isSelected,
                onSelected: (selected) {
                  setState(() {
                    if (selected) {
                      _selectedDays.add(day);
                    } else {
                      _selectedDays.remove(day);
                    }
                  });
                  
                  // Check availability when days change
                  if (_selectedLecturer != null && 
                      _startTimeController.text.trim().isNotEmpty &&
                      _endTimeController.text.trim().isNotEmpty) {
                    _checkLecturerAvailability();
                  }
                },
              );
            }).toList(),
          ),
          const SizedBox(height: 16),

          // About
          TextFormField(
            controller: _aboutController,
            decoration: InputDecoration(
              labelText: 'About',
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(8),
              ),
              filled: true,
              fillColor: isDark ? Colors.grey[900] : Colors.white,
            ),
            maxLines: 4,
          ),
          const SizedBox(height: 16),

          // Course Image
          Text('Course Image (Optional)', style: theme.textTheme.titleMedium),
          const SizedBox(height: 8),
          InkWell(
            onTap: _pickImage,
            child: Container(
              width: double.infinity,
              height: 200,
              decoration: BoxDecoration(
                border: Border.all(color: Colors.grey),
                borderRadius: BorderRadius.circular(8),
              ),
              child: _courseImage != null
                  ? Image.file(_courseImage!, fit: BoxFit.cover)
                  : Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.add_photo_alternate,
                            size: 48, color: Colors.grey),
                        const SizedBox(height: 8),
                        Text('Tap to select new image',
                            style: TextStyle(color: Colors.grey)),
                      ],
                    ),
            ),
          ),
          const SizedBox(height: 24),

          // Update Button
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: _isUpdatingCourse ? null : _updateCourse,
              style: ElevatedButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
              ),
              child: _isUpdatingCourse
                  ? const SizedBox(
                      height: 20,
                      width: 20,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : const Text('Update Course'),
            ),
          ),
        ],
      ),
    );
  }
}

