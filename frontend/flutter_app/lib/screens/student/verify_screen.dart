import 'dart:io';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:provider/provider.dart';
import '../../config/theme.dart';
import '../../providers/auth_provider.dart';
import '../../services/api_service.dart';

class StudentVerifyScreen extends StatefulWidget {
  const StudentVerifyScreen({super.key});

  @override
  State<StudentVerifyScreen> createState() => _StudentVerifyScreenState();
}

class _StudentVerifyScreenState extends State<StudentVerifyScreen> {
  final _formKey = GlobalKey<FormState>();
  final _phoneController = TextEditingController();
  final _aboutController = TextEditingController();
  
  String? _studyingLevel;
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

  final List<String> _studyingLevels = [
    'primary',
    'middle',
    'high_school',
    'bachelors',
    'masters',
    'doctorate',
  ];

  String _formatStudyingLevel(String level) {
    switch (level) {
      case 'primary':
        return 'Primary School';
      case 'middle':
        return 'Middle School';
      case 'high_school':
        return 'High School';
      case 'bachelors':
        return 'Bachelor\'s Degree';
      case 'masters':
        return 'Master\'s Degree';
      case 'doctorate':
        return 'Doctorate';
      default:
        return level;
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

      final docPercentage = result['document_percentage'] ?? 0.0;
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
    if (!_formKey.currentState!.validate()) return;
    
    // Validate required images
    if (_profileImage == null) {
      _showError('Please upload your profile image');
      return;
    }
    if (_idcardFront == null || _idcardBack == null) {
      _showError('Please upload both sides of your ID card');
      return;
    }
    if (_residenceFront == null || _residenceBack == null) {
      _showError('Please upload both sides of your residence card');
      return;
    }
    
    // Check if any document validation is still in progress
    if (_docChecking.values.any((v) => v == true)) {
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
      _showError('Invalid documents: ${invalidDocs.join(', ')}. Please upload valid document images.');
      return;
    }

    setState(() => _isLoading = true);

    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final accessToken = authProvider.instituteData['accessToken'];
    final refreshToken = authProvider.instituteData['refreshToken'];

    try {
      final payload = {
        'phone_number': _phoneController.text.trim(),
        'about': _aboutController.text.trim(),
        'studying_level': _studyingLevel,
        'profile_image': _profileImage,
        'idcard_front': _idcardFront,
        'idcard_back': _idcardBack,
        'residence_front': _residenceFront,
        'residence_back': _residenceBack,
      };

      await ApiService.verifyStudent(
        accessToken: accessToken,
        refreshToken: refreshToken,
        payload: payload,
        onTokenRefreshed: (tokens) {
          authProvider.onTokenRefreshed(tokens);
        },
        onSessionExpired: () {
          authProvider.onSessionExpired();
        },
      );

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Verification submitted successfully!'),
            backgroundColor: Colors.green,
          ),
        );
        Navigator.pop(context, true);
      }
    } catch (e) {
      _showError(e is ApiException ? e.message : 'Failed to submit verification');
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _showError(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message), backgroundColor: Colors.red),
    );
  }

  @override
  void dispose() {
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
          'Verify Account',
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
                            'Complete Verification',
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 20,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          SizedBox(height: 4),
                          Text(
                            'Submit your documents to verify your account',
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
              _buildSectionTitle('Profile Image', Icons.person),
              const SizedBox(height: 12),
              _buildImagePicker(
                'profile_image',
                _profileImage,
                'Upload Profile Photo',
                isCircular: true,
              ),
              const SizedBox(height: 24),

              // Personal Information
              _buildSectionTitle('Personal Information', Icons.info_outline),
              const SizedBox(height: 12),
              _buildTextField(
                controller: _phoneController,
                label: 'Phone Number',
                hint: '+9647700000000',
                icon: Icons.phone,
                keyboardType: TextInputType.phone,
                validator: (v) => v?.isEmpty == true ? 'Phone number is required' : null,
              ),
              const SizedBox(height: 16),
              _buildDropdown(),
              const SizedBox(height: 16),
              _buildTextField(
                controller: _aboutController,
                label: 'About You',
                hint: 'Tell us about yourself...',
                icon: Icons.description,
                maxLines: 3,
                validator: (v) => v?.isEmpty == true ? 'About is required' : null,
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

  Widget _buildDropdown() {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return DropdownButtonFormField<String>(
      value: _studyingLevel,
      decoration: InputDecoration(
        labelText: 'Studying Level',
        prefixIcon: const Icon(Icons.school),
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
      ),
      items: _studyingLevels.map((level) {
        return DropdownMenuItem(
          value: level,
          child: Text(_formatStudyingLevel(level)),
        );
      }).toList(),
      onChanged: (value) {
        setState(() => _studyingLevel = value);
      },
      validator: (v) => v == null ? 'Please select your studying level' : null,
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
                              decoration: BoxDecoration(
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

