import 'dart:io';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:provider/provider.dart';
import '../../config/theme.dart';
import '../../providers/auth_provider.dart';
import '../../services/api_service.dart';

class InstitutionVerifyScreen extends StatefulWidget {
  const InstitutionVerifyScreen({super.key});

  @override
  State<InstitutionVerifyScreen> createState() => _InstitutionVerifyScreenState();
}

class _InstitutionVerifyScreenState extends State<InstitutionVerifyScreen> {
  final _formKey = GlobalKey<FormState>();
  final _titleController = TextEditingController();
  final _locationController = TextEditingController();
  final _phoneController = TextEditingController();
  final _aboutController = TextEditingController();
  
  TimeOfDay? _upTime;
  Set<String> _selectedDays = {};
  
  File? _profileImage;
  File? _idcardFront;
  File? _idcardBack;
  File? _residenceFront;
  File? _residenceBack;
  
  // Document validation states
  Map<String, bool?> _docValidation = {};
  Map<String, bool> _docChecking = {};
  
  bool _isLoading = false;
  final ImagePicker _picker = ImagePicker();

  final Map<String, String> _daysMap = {
    'monday': 'Monday',
    'tuesday': 'Tuesday',
    'wednesday': 'Wednesday',
    'thursday': 'Thursday',
    'friday': 'Friday',
    'saturday': 'Saturday',
    'sunday': 'Sunday',
  };

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _checkVerificationStatus();
    });
  }

  Future<void> _checkVerificationStatus() async {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final isVerified = authProvider.instituteData['isVerified'] == true;
    
    if (isVerified) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Your account is already verified')),
        );
        Navigator.of(context).pop();
      }
    }
  }

  Future<void> _pickImage(String field) async {
    final XFile? image = await _picker.pickImage(
      source: ImageSource.gallery,
      maxWidth: 1200,
      maxHeight: 1200,
      imageQuality: 85,
    );
    
    if (image != null) {
      final file = File(image.path);
      setState(() {
        switch (field) {
          case 'profile_image':
            _profileImage = file;
            break;
          case 'idcard_front':
            _idcardFront = file;
            break;
          case 'idcard_back':
            _idcardBack = file;
            break;
          case 'residence_front':
            _residenceFront = file;
            break;
          case 'residence_back':
            _residenceBack = file;
            break;
        }
      });
      
      // Check document validity for ID and residence cards
      if (field != 'profile_image') {
        _checkDocument(field, file);
      }
    }
  }

  Future<void> _checkDocument(String field, File file) async {
    setState(() {
      _docChecking[field] = true;
      _docValidation[field] = null;
    });

    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final accessToken = authProvider.instituteData['accessToken'];
    final refreshToken = authProvider.instituteData['refreshToken'];

    try {
      final result = await ApiService.checkDocument(
        accessToken: accessToken,
        refreshToken: refreshToken,
        file: file,
        onTokenRefreshed: (tokens) {
          authProvider.onTokenRefreshed(tokens);
        },
        onSessionExpired: () {
          authProvider.onSessionExpired();
        },
      );

      final docPercentage = (result['document_percentage'] ?? 0.0) as num;
      final isValid = docPercentage >= 60;

      if (mounted) {
        setState(() {
          _docValidation[field] = isValid;
          _docChecking[field] = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _docValidation[field] = null;
          _docChecking[field] = false;
        });
      }
    }
  }

  Future<void> _submit() async {
    print('🔵 [DEBUG] Institution Verification: Starting submission...');
    
    if (!_formKey.currentState!.validate()) {
      print('🔴 [DEBUG] Institution Verification: Form validation failed');
      return;
    }
    
    print('✅ [DEBUG] Institution Verification: Form validation passed');
    
    // Validate required images
    if (_profileImage == null) {
      print('🔴 [DEBUG] Institution Verification: Profile image missing');
      _showError('Please upload your profile image');
      return;
    }
    if (_idcardFront == null || _idcardBack == null) {
      print('🔴 [DEBUG] Institution Verification: ID card images missing');
      _showError('Please upload both sides of your ID card');
      return;
    }
    if (_residenceFront == null || _residenceBack == null) {
      print('🔴 [DEBUG] Institution Verification: Residence card images missing');
      _showError('Please upload both sides of your residence card');
      return;
    }
    
    print('✅ [DEBUG] Institution Verification: All required images present');
    print('   - Profile image: ${_profileImage!.path}');
    print('   - ID card front: ${_idcardFront!.path}');
    print('   - ID card back: ${_idcardBack!.path}');
    print('   - Residence front: ${_residenceFront!.path}');
    print('   - Residence back: ${_residenceBack!.path}');
    
    // Check if any document validation is still in progress
    if (_docChecking.values.any((v) => v == true)) {
      print('🔴 [DEBUG] Institution Verification: Document validation still in progress');
      _showError('Please wait for document validation to complete');
      return;
    }
    
    // Check if any document failed validation
    final invalidDocs = <String>[];
    if (_docValidation['idcard_front'] == false) invalidDocs.add('ID Card Front');
    if (_docValidation['idcard_back'] == false) invalidDocs.add('ID Card Back');
    if (_docValidation['residence_front'] == false) invalidDocs.add('Residence Front');
    if (_docValidation['residence_back'] == false) invalidDocs.add('Residence Back');
    
    if (invalidDocs.isNotEmpty) {
      print('🔴 [DEBUG] Institution Verification: Invalid documents detected: $invalidDocs');
      _showError('Invalid documents: ${invalidDocs.join(', ')}. Please upload valid document images.');
      return;
    }
    
    // Validate up_time and up_days
    if (_upTime == null) {
      print('🔴 [DEBUG] Institution Verification: Up time is required');
      _showError('Please select up time');
      return;
    }
    
    if (_selectedDays.isEmpty) {
      print('🔴 [DEBUG] Institution Verification: Up days is required');
      _showError('Please select at least one day');
      return;
    }
    
    print('✅ [DEBUG] Institution Verification: Document validation passed');
    print('   - ID card front: ${_docValidation['idcard_front']}');
    print('   - ID card back: ${_docValidation['idcard_back']}');
    print('   - Residence front: ${_docValidation['residence_front']}');
    print('   - Residence back: ${_docValidation['residence_back']}');
    print('   - Up time: ${_formatTimeForDisplay(_upTime!)} (will be converted to 24-hour format)');
    print('   - Up days: ${_formatSelectedDays()}');

    setState(() => _isLoading = true);

    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final accessToken = authProvider.instituteData['accessToken'];
    final refreshToken = authProvider.instituteData['refreshToken'];
    
    print('🔵 [DEBUG] Institution Verification: Preparing payload...');
    print('   - Title: ${_titleController.text.trim()}');
    print('   - Location: ${_locationController.text.trim()}');
    print('   - Phone: ${_phoneController.text.trim()}');
    print('   - About: ${_aboutController.text.trim()}');
    print('   - Up time (24h): ${_upTime!.hour.toString().padLeft(2, '0')}:${_upTime!.minute.toString().padLeft(2, '0')}');
    print('   - Up days: ${_formatSelectedDays()}');
    print('   - Access token present: ${accessToken != null && accessToken.isNotEmpty}');
    print('   - Refresh token present: ${refreshToken != null && refreshToken.isNotEmpty}');

    try {
      // Convert time to 24-hour format (HH:mm) for backend
      final time24Hour = '${_upTime!.hour.toString().padLeft(2, '0')}:${_upTime!.minute.toString().padLeft(2, '0')}';
      
      final payload = {
        'title': _titleController.text.trim(),
        'location': _locationController.text.trim(),
        'phone_number': _phoneController.text.trim(),
        'about': _aboutController.text.trim(),
        'up_time': time24Hour,
        'up_days': _formatSelectedDays(),
        'profile_image': _profileImage,
        'idcard_front': _idcardFront,
        'idcard_back': _idcardBack,
        'residence_front': _residenceFront,
        'residence_back': _residenceBack,
      };

      print('🔵 [DEBUG] Institution Verification: Calling API service...');
      final result = await ApiService.verifyInstitution(
        accessToken: accessToken,
        refreshToken: refreshToken,
        payload: payload,
        onTokenRefreshed: (tokens) {
          print('🟡 [DEBUG] Institution Verification: Token refreshed');
          authProvider.onTokenRefreshed(tokens);
        },
        onSessionExpired: () {
          print('🔴 [DEBUG] Institution Verification: Session expired');
          authProvider.onSessionExpired();
        },
      );

      print('✅ [DEBUG] Institution Verification: API call successful');
      print('   - Response: $result');

      if (mounted) {
        // Update auth provider with verified status
        authProvider.updateInstituteData({'isVerified': true});
        
        print('✅ [DEBUG] Institution Verification: Auth provider updated, showing success message');
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Verification submitted successfully!'),
            backgroundColor: Colors.green,
          ),
        );
        Navigator.pop(context, true);
      }
    } catch (e, stackTrace) {
      print('🔴 [DEBUG] Institution Verification: ERROR OCCURRED');
      print('   - Error type: ${e.runtimeType}');
      print('   - Error message: ${e.toString()}');
      if (e is ApiException) {
        print('   - Status code: ${e.status}');
        print('   - API message: ${e.message}');
      }
      print('   - Stack trace: $stackTrace');
      
      String errorMessage = 'Failed to submit verification';
      if (e is ApiException) {
        errorMessage = e.message;
        // Try to extract more details from the error
        if (e.message.contains('errors') || e.message.contains('error')) {
          print('   - Full error details: ${e.toString()}');
        }
      } else {
        errorMessage = 'Error: ${e.toString()}';
      }
      
      _showError(errorMessage);
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
        print('🔵 [DEBUG] Institution Verification: Loading state reset');
      }
    }
  }

  void _showError(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message), backgroundColor: Colors.red),
    );
  }

  Future<void> _selectTime() async {
    final TimeOfDay? picked = await showTimePicker(
      context: context,
      initialTime: _upTime ?? TimeOfDay.now(),
      builder: (context, child) {
        // Show time picker in 12-hour format (AM/PM) for user
        return MediaQuery(
          data: MediaQuery.of(context).copyWith(alwaysUse24HourFormat: false),
          child: child!,
        );
      },
    );
    if (picked != null) {
      setState(() {
        _upTime = picked;
      });
    }
  }

  String _formatTimeForDisplay(TimeOfDay time) {
    // Convert 24-hour format to 12-hour format with AM/PM
    int hour = time.hour;
    final period = hour >= 12 ? 'PM' : 'AM';
    if (hour == 0) {
      hour = 12; // Midnight
    } else if (hour > 12) {
      hour = hour - 12; // Afternoon
    }
    final minute = time.minute.toString().padLeft(2, '0');
    return '$hour:$minute $period';
  }

  Future<void> _showDaysPicker() async {
    final result = await showDialog<Set<String>>(
      context: context,
      builder: (context) => _DaysSelectionDialog(
        selectedDays: _selectedDays,
        daysMap: _daysMap,
      ),
    );
    
    if (result != null) {
      setState(() {
        _selectedDays = result;
      });
    }
  }

  String _formatSelectedDays() {
    if (_selectedDays.isEmpty) return '';
    // Format as comma-separated with quotes: "monday","tuesday","wednesday"
    return _selectedDays.map((day) => '"$day"').join(',');
  }

  String _getSelectedDaysDisplay() {
    if (_selectedDays.isEmpty) return 'Select days';
    return _selectedDays.map((day) => _daysMap[day] ?? day).join(', ');
  }

  @override
  void dispose() {
    _titleController.dispose();
    _locationController.dispose();
    _phoneController.dispose();
    _aboutController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: isDark ? AppTheme.navy900 : const Color(0xFFF9FAFB),
      appBar: AppBar(
        elevation: 0,
        backgroundColor: isDark ? AppTheme.navy800 : Colors.white,
        title: const Text(
          'Verify Institution',
          style: TextStyle(fontWeight: FontWeight.bold),
        ),
      ),
      body: Form(
        key: _formKey,
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [AppTheme.primary600, AppTheme.teal500],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.2),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: const Icon(
                        Icons.verified_user,
                        color: Colors.white,
                        size: 32,
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: const [
                          Text(
                            'Institution Verification',
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 20,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          SizedBox(height: 4),
                          Text(
                            'Complete your profile to get verified',
                            style: TextStyle(
                              color: Colors.white70,
                              fontSize: 14,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),

              // Profile Image
              _buildSectionTitle('Institution Logo', Icons.business),
              const SizedBox(height: 12),
              Center(
                child: _buildImagePicker(
                  'profile_image',
                  _profileImage,
                  'Upload Logo',
                  isCircular: true,
                ),
              ),
              const SizedBox(height: 24),

              // Institution Information
              _buildSectionTitle('Institution Information', Icons.info_outline),
              const SizedBox(height: 12),
              _buildTextField(
                controller: _titleController,
                label: 'Institution Title',
                hint: 'e.g., University of Technology',
                icon: Icons.school,
                validator: (v) => v?.isEmpty == true ? 'Title is required' : null,
              ),
              const SizedBox(height: 16),
              _buildTextField(
                controller: _locationController,
                label: 'Location',
                hint: 'e.g., Baghdad, Iraq',
                icon: Icons.location_on,
                validator: (v) => v?.isEmpty == true ? 'Location is required' : null,
              ),
              const SizedBox(height: 16),
              _buildTextField(
                controller: _phoneController,
                label: 'Phone Number',
                hint: '+9647700000000',
                icon: Icons.phone,
                keyboardType: TextInputType.phone,
                validator: (v) => v?.isEmpty == true ? 'Phone number is required' : null,
              ),
              const SizedBox(height: 16),
              _buildTextField(
                controller: _aboutController,
                label: 'About Institution',
                hint: 'Tell us about your institution...',
                icon: Icons.description,
                maxLines: 3,
                validator: (v) => v?.isEmpty == true ? 'About is required' : null,
              ),
              const SizedBox(height: 24),

              // Up Time and Up Days
              _buildSectionTitle('Operating Hours', Icons.access_time),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: _buildTimePicker('Up Time'),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: _buildDaysPicker('Up Days'),
                  ),
                ],
              ),
              const SizedBox(height: 24),

              // ID Card
              _buildSectionTitle('ID Card', Icons.credit_card),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: _buildImagePicker(
                      'idcard_front',
                      _idcardFront,
                      'Front Side',
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: _buildImagePicker(
                      'idcard_back',
                      _idcardBack,
                      'Back Side',
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 24),

              // Residence Card
              _buildSectionTitle('Residence Card', Icons.home),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: _buildImagePicker(
                      'residence_front',
                      _residenceFront,
                      'Front Side',
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: _buildImagePicker(
                      'residence_back',
                      _residenceBack,
                      'Back Side',
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 32),

              // Submit Button
              SizedBox(
                width: double.infinity,
                height: 56,
                child: ElevatedButton(
                  onPressed: _isLoading ? null : _submit,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: isDark ? AppTheme.teal500 : AppTheme.primary600,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16),
                    ),
                    elevation: 0,
                  ),
                  child: _isLoading
                      ? const SizedBox(
                          width: 24,
                          height: 24,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                          ),
                        )
                      : const Text(
                          'Submit Verification',
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                ),
              ),
              const SizedBox(height: 32),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSectionTitle(String title, IconData icon) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Row(
      children: [
        Icon(
          icon,
          size: 20,
          color: isDark ? AppTheme.teal400 : AppTheme.primary600,
        ),
        const SizedBox(width: 8),
        Text(
          title,
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.bold,
            color: isDark ? Colors.white : AppTheme.navy900,
          ),
        ),
      ],
    );
  }

  Widget _buildTextField({
    required TextEditingController controller,
    required String label,
    required String hint,
    required IconData icon,
    TextInputType? keyboardType,
    int maxLines = 1,
    String? Function(String?)? validator,
  }) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return TextFormField(
      controller: controller,
      keyboardType: keyboardType,
      maxLines: maxLines,
      validator: validator,
      decoration: InputDecoration(
        labelText: label,
        hintText: hint,
        prefixIcon: Icon(icon),
        filled: true,
        fillColor: isDark ? AppTheme.navy800 : Colors.white,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(
            color: isDark ? AppTheme.navy700 : Colors.grey.shade300,
          ),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(
            color: isDark ? AppTheme.navy700 : Colors.grey.shade300,
          ),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(
            color: isDark ? AppTheme.teal500 : AppTheme.primary600,
            width: 2,
          ),
        ),
      ),
    );
  }

  Widget _buildDaysPicker(String label) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return GestureDetector(
      onTap: _showDaysPicker,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
        decoration: BoxDecoration(
          color: isDark ? AppTheme.navy800 : Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: _selectedDays.isNotEmpty
                ? (isDark ? AppTheme.teal500 : AppTheme.primary600)
                : (isDark ? AppTheme.navy700 : Colors.grey.shade300),
            width: _selectedDays.isNotEmpty ? 2 : 1,
          ),
        ),
        child: Row(
          children: [
            Icon(
              Icons.calendar_today,
              color: isDark ? AppTheme.teal400 : AppTheme.primary600,
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    label,
                    style: TextStyle(
                      fontSize: 12,
                      color: isDark ? Colors.white70 : Colors.grey.shade600,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    _getSelectedDaysDisplay(),
                    style: TextStyle(
                      fontSize: 16,
                      color: _selectedDays.isNotEmpty
                          ? (isDark ? Colors.white : Colors.black87)
                          : Colors.grey,
                      fontWeight: _selectedDays.isNotEmpty ? FontWeight.w500 : FontWeight.normal,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
            Icon(
              Icons.arrow_drop_down,
              color: isDark ? Colors.white70 : Colors.grey.shade600,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTimePicker(String label) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return GestureDetector(
      onTap: _selectTime,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
        decoration: BoxDecoration(
          color: isDark ? AppTheme.navy800 : Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: _upTime != null
                ? (isDark ? AppTheme.teal500 : AppTheme.primary600)
                : (isDark ? AppTheme.navy700 : Colors.grey.shade300),
            width: _upTime != null ? 2 : 1,
          ),
        ),
        child: Row(
          children: [
            Icon(
              Icons.access_time,
              color: isDark ? AppTheme.teal400 : AppTheme.primary600,
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    label,
                    style: TextStyle(
                      fontSize: 12,
                      color: isDark ? Colors.white70 : Colors.grey.shade600,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    _upTime != null
                        ? _formatTimeForDisplay(_upTime!)
                        : 'Select time (AM/PM)',
                    style: TextStyle(
                      fontSize: 16,
                      color: _upTime != null
                          ? (isDark ? Colors.white : Colors.black87)
                          : Colors.grey,
                      fontWeight: _upTime != null ? FontWeight.w500 : FontWeight.normal,
                    ),
                  ),
                ],
              ),
            ),
            Icon(
              Icons.arrow_drop_down,
              color: isDark ? Colors.white70 : Colors.grey.shade600,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildImagePicker(String field, File? file, String label, {bool isCircular = false}) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final isChecking = _docChecking[field] == true;
    final isValid = _docValidation[field];
    final needsValidation = field != 'profile_image';
    
    // Determine border color based on validation state
    Color borderColor;
    if (file == null) {
      borderColor = isDark ? AppTheme.navy700 : Colors.grey.shade300;
    } else if (needsValidation && isValid == false) {
      borderColor = Colors.red;
    } else if (needsValidation && isValid == true) {
      borderColor = Colors.green;
    } else {
      borderColor = isDark ? AppTheme.teal500 : AppTheme.primary600;
    }
    
    return GestureDetector(
      onTap: () => _pickImage(field),
      child: Container(
        height: isCircular ? 150 : 120,
        width: isCircular ? 150 : null,
        decoration: BoxDecoration(
          color: isDark ? AppTheme.navy800 : Colors.white,
          borderRadius: BorderRadius.circular(isCircular ? 75 : 12),
          border: Border.all(
            color: borderColor,
            width: file != null ? 2 : 1,
          ),
        ),
        child: file != null
            ? ClipRRect(
                borderRadius: BorderRadius.circular(isCircular ? 75 : 12),
                child: Stack(
                  fit: StackFit.expand,
                  children: [
                    Image.file(file, fit: BoxFit.cover),
                    // Validation indicator
                    Positioned(
                      bottom: 8,
                      right: 8,
                      child: isChecking
                          ? Container(
                              padding: const EdgeInsets.all(6),
                              decoration: const BoxDecoration(
                                color: Colors.blue,
                                shape: BoxShape.circle,
                              ),
                              child: const SizedBox(
                                width: 16,
                                height: 16,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                  valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                                ),
                              ),
                            )
                          : Container(
                              padding: const EdgeInsets.all(6),
                              decoration: BoxDecoration(
                                color: needsValidation
                                    ? (isValid == true ? Colors.green : (isValid == false ? Colors.red : Colors.green))
                                    : Colors.green,
                                shape: BoxShape.circle,
                              ),
                              child: Icon(
                                needsValidation
                                    ? (isValid == true ? Icons.check : (isValid == false ? Icons.close : Icons.check))
                                    : Icons.check,
                                color: Colors.white,
                                size: 16,
                              ),
                            ),
                    ),
                  ],
                ),
              )
            : Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    Icons.add_photo_alternate_outlined,
                    size: 32,
                    color: isDark ? AppTheme.navy400 : Colors.grey.shade400,
                  ),
                  const SizedBox(height: 8),
                  Text(
                    label,
                    style: TextStyle(
                      fontSize: 12,
                      color: isDark ? AppTheme.navy400 : Colors.grey.shade600,
                    ),
                    textAlign: TextAlign.center,
                  ),
                ],
              ),
      ),
    );
  }
}

class _DaysSelectionDialog extends StatefulWidget {
  final Set<String> selectedDays;
  final Map<String, String> daysMap;

  const _DaysSelectionDialog({
    required this.selectedDays,
    required this.daysMap,
  });

  @override
  State<_DaysSelectionDialog> createState() => _DaysSelectionDialogState();
}

class _DaysSelectionDialogState extends State<_DaysSelectionDialog> {
  late Set<String> _selectedDays;

  @override
  void initState() {
    super.initState();
    _selectedDays = Set<String>.from(widget.selectedDays);
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    
    return Dialog(
      backgroundColor: isDark ? AppTheme.navy800 : Colors.white,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(20),
      ),
      child: Container(
        constraints: const BoxConstraints(maxWidth: 400),
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Title
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Select Days',
                  style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                    color: isDark ? Colors.white : AppTheme.navy900,
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.close),
                  onPressed: () => Navigator.of(context).pop(),
                  color: isDark ? Colors.white70 : Colors.grey.shade600,
                ),
              ],
            ),
            const SizedBox(height: 16),
            // Days List
            ...widget.daysMap.entries.map((entry) {
              final dayKey = entry.key;
              final dayLabel = entry.value;
              final isSelected = _selectedDays.contains(dayKey);
              
              return CheckboxListTile(
                title: Text(
                  dayLabel,
                  style: TextStyle(
                    color: isDark ? Colors.white : AppTheme.navy900,
                  ),
                ),
                value: isSelected,
                onChanged: (value) {
                  setState(() {
                    if (value == true) {
                      _selectedDays.add(dayKey);
                    } else {
                      _selectedDays.remove(dayKey);
                    }
                  });
                },
                activeColor: isDark ? AppTheme.teal500 : AppTheme.primary600,
                checkColor: Colors.white,
              );
            }),
            const SizedBox(height: 24),
            // Buttons
            Row(
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                TextButton(
                  onPressed: () => Navigator.of(context).pop(),
                  child: Text(
                    'Cancel',
                    style: TextStyle(
                      color: isDark ? Colors.white70 : Colors.grey.shade600,
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                ElevatedButton(
                  onPressed: () {
                    Navigator.of(context).pop(_selectedDays);
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: isDark ? AppTheme.teal500 : AppTheme.primary600,
                    foregroundColor: Colors.white,
                  ),
                  child: const Text('Done'),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

