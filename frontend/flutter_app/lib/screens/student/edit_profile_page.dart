import 'dart:io';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:image_picker/image_picker.dart';
import '../../config/theme.dart';
import '../../providers/auth_provider.dart';
import '../../services/api_service.dart';

class StudentEditProfilePage extends StatefulWidget {
  const StudentEditProfilePage({super.key});

  @override
  State<StudentEditProfilePage> createState() => _StudentEditProfilePageState();
}

class _StudentEditProfilePageState extends State<StudentEditProfilePage> {
  final _formKey = GlobalKey<FormState>();
  final _firstNameController = TextEditingController();
  final _lastNameController = TextEditingController();
  final _phoneController = TextEditingController();
  final _aboutController = TextEditingController();
  final _interestingKeywordsController = TextEditingController();
  final _responsiblePhoneController = TextEditingController();
  final _responsibleEmailController = TextEditingController();

  final ImagePicker _picker = ImagePicker();
  
  File? _profileImage;
  File? _idcardFront;
  File? _idcardBack;
  File? _residenceFront;
  File? _residenceBack;

  String? _selectedCity;
  String? _selectedStudyingLevel;

  Map<String, Map<String, dynamic>> _documentValidation = {};
  bool _isSubmitting = false;
  bool _isValidating = false;

  static const Map<String, String> _cities = {
    'baghdad': 'Baghdad',
    'basra': 'Basra',
    'maysan': 'Maysan',
    'dhi_qar': 'Dhi Qar',
    'muthanna': 'Muthanna',
    'qadisiyyah': 'Qadisiyyah',
    'najaf': 'Najaf',
    'karbala': 'Karbala',
    'babel': 'Babel',
    'wasit': 'Wasit',
    'anbar': 'Anbar',
    'salah_al_din': 'Salah Al-Din',
    'kirkuk': 'Kirkuk',
    'diyala': 'Diyala',
    'mosul': 'Mosul',
    'erbil': 'Erbil',
    'duhok': 'Duhok',
    'sulaymaniyah': 'Sulaymaniyah',
  };

  static const List<String> _studyingLevels = [
    'bachelors',
    'masters',
    'phd',
  ];

  String _formatStudyingLevel(String level) {
    switch (level) {
      case 'bachelors':
        return 'Bachelor\'s Degree';
      case 'masters':
        return 'Master\'s Degree';
      case 'phd':
        return 'PhD / Doctorate';
      default:
        return level;
    }
  }

  @override
  void initState() {
    super.initState();
    _loadCurrentData();
  }

  void _loadCurrentData() {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final data = authProvider.instituteData;
    
    _firstNameController.text = data['firstName'] ?? '';
    _lastNameController.text = data['lastName'] ?? '';
    _phoneController.text = data['phoneNumber'] ?? '';
    _aboutController.text = data['about'] ?? '';
    _interestingKeywordsController.text = data['interesting_keywords'] ?? '';
    _responsiblePhoneController.text = data['responsible_phone'] ?? '';
    _responsibleEmailController.text = data['responsible_email'] ?? '';
    _selectedCity = data['city'];
    _selectedStudyingLevel = data['studying_level'];
  }

  @override
  void dispose() {
    _firstNameController.dispose();
    _lastNameController.dispose();
    _phoneController.dispose();
    _aboutController.dispose();
    _interestingKeywordsController.dispose();
    _responsiblePhoneController.dispose();
    _responsibleEmailController.dispose();
    super.dispose();
  }

  Future<void> _pickImage(String field) async {
    try {
      final XFile? image = await _picker.pickImage(source: ImageSource.gallery);
      if (image != null) {
        final file = File(image.path);
        
        // Check file size (max 5MB)
        final fileSize = await file.length();
        if (fileSize > 5 * 1024 * 1024) {
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text('File size must be less than 5MB')),
            );
          }
          return;
        }

        setState(() {
          if (field == 'profile_image') {
            _profileImage = file;
            _documentValidation['profile_image'] = {
              'isValid': true,
              'message': 'Profile image uploaded',
            };
          } else if (field == 'idcard_front') {
            _idcardFront = file;
            _validateDocument(file, 'idcard_front');
          } else if (field == 'idcard_back') {
            _idcardBack = file;
            _validateDocument(file, 'idcard_back');
          } else if (field == 'residence_front') {
            _residenceFront = file;
            _validateDocument(file, 'residence_front');
          } else if (field == 'residence_back') {
            _residenceBack = file;
            _validateDocument(file, 'residence_back');
          }
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

  Future<void> _validateDocument(File file, String fieldName) async {
    setState(() {
      _documentValidation[fieldName] = {'loading': true};
      _isValidating = true;
    });

    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final instituteData = authProvider.instituteData;
    final accessToken = instituteData['accessToken'];
    final refreshToken = instituteData['refreshToken'];

    if (accessToken == null) return;

    try {
      final result = await ApiService.checkDocument(
        accessToken: accessToken,
        file: file,
        refreshToken: refreshToken,
        onTokenRefreshed: (tokens) {
          authProvider.onTokenRefreshed(tokens);
        },
        onSessionExpired: () {
          authProvider.onSessionExpired();
        },
      );

      if (mounted) {
        final percentage = (result['document_percentage'] ?? 0.0) as num;
        final isValid = percentage >= 60;

        setState(() {
          _documentValidation[fieldName] = {
            'loading': false,
            'isValid': isValid,
            'message': isValid
                ? 'Document verified (${percentage.toStringAsFixed(0)}% confidence)'
                : 'Invalid document (${percentage.toStringAsFixed(0)}% confidence)',
            'percentage': percentage,
          };
          _isValidating = false;
        });

        if (!isValid) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('${fieldName.replaceAll('_', ' ')}: Document validation failed'),
              backgroundColor: Colors.red,
            ),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _documentValidation[fieldName] = {
            'loading': false,
            'isValid': false,
            'message': 'Failed to validate document',
          };
          _isValidating = false;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error validating document: $e')),
        );
      }
    }
  }

  Future<void> _submitEdit() async {
    setState(() => _isSubmitting = true);

    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final instituteData = authProvider.instituteData;
    final accessToken = instituteData['accessToken'];
    final refreshToken = instituteData['refreshToken'];

    if (accessToken == null) {
      setState(() => _isSubmitting = false);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please log in first')),
      );
      return;
    }

    // Check if any uploaded files failed AI validation
    final fileFields = ['idcard_front', 'idcard_back', 'residence_front', 'residence_back'];
    final uploadedFiles = fileFields.where((field) {
      if (field == 'idcard_front') return _idcardFront != null;
      if (field == 'idcard_back') return _idcardBack != null;
      if (field == 'residence_front') return _residenceFront != null;
      if (field == 'residence_back') return _residenceBack != null;
      return false;
    }).toList();

    final invalidFiles = uploadedFiles.where((field) {
      final validation = _documentValidation[field];
      return validation != null && validation['isValid'] != true;
    }).toList();

    if (invalidFiles.isNotEmpty) {
      setState(() => _isSubmitting = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Some documents failed validation: ${invalidFiles.join(', ')}')),
      );
      return;
    }

    try {
      final payload = <String, dynamic>{};
      
      // Add text fields only if they have values
      if (_firstNameController.text.trim().isNotEmpty) {
        payload['first_name'] = _firstNameController.text.trim();
      }
      if (_lastNameController.text.trim().isNotEmpty) {
        payload['last_name'] = _lastNameController.text.trim();
      }
      if (_selectedCity != null) {
        payload['city'] = _selectedCity!;
      }
      if (_phoneController.text.trim().isNotEmpty) {
        payload['phone_number'] = _phoneController.text.trim();
      }
      if (_aboutController.text.trim().isNotEmpty) {
        payload['about'] = _aboutController.text.trim();
      }
      if (_selectedStudyingLevel != null) {
        payload['studying_level'] = _selectedStudyingLevel!;
      }
      if (_interestingKeywordsController.text.trim().isNotEmpty) {
        payload['interesting_keywords'] = _interestingKeywordsController.text.trim();
      }
      if (_responsiblePhoneController.text.trim().isNotEmpty) {
        payload['responsible_phone'] = _responsiblePhoneController.text.trim();
      }
      if (_responsibleEmailController.text.trim().isNotEmpty) {
        payload['responsible_email'] = _responsibleEmailController.text.trim();
      }

      // Add file fields only if they are provided
      if (_profileImage != null) payload['profile_image'] = _profileImage;
      if (_idcardFront != null) payload['idcard_front'] = _idcardFront;
      if (_idcardBack != null) payload['idcard_back'] = _idcardBack;
      if (_residenceFront != null) payload['residence_front'] = _residenceFront;
      if (_residenceBack != null) payload['residence_back'] = _residenceBack;

      final result = await ApiService.editStudentProfile(
        accessToken: accessToken,
        payload: payload,
        refreshToken: refreshToken,
        onTokenRefreshed: (tokens) {
          authProvider.onTokenRefreshed(tokens);
        },
        onSessionExpired: () {
          authProvider.onSessionExpired();
        },
      );

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(result['message'] ?? 'Profile updated successfully'),
            backgroundColor: Colors.green,
          ),
        );
        Navigator.pop(context);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: ${e.toString()}')),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isSubmitting = false);
      }
    }
  }

  Widget _buildTextField(
    String label,
    TextEditingController controller, {
    int maxLines = 1,
    IconData? icon,
    String? hint,
  }) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return TextFormField(
      controller: controller,
      maxLines: maxLines,
      decoration: InputDecoration(
        labelText: label,
        hintText: hint,
        prefixIcon: icon != null ? Icon(icon) : null,
        filled: true,
        fillColor: isDark ? AppTheme.navy700 : Colors.white,
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
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
      ),
    );
  }

  Widget _buildCityDropdown() {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return DropdownButtonFormField<String>(
      value: _selectedCity,
      decoration: InputDecoration(
        labelText: 'City',
        prefixIcon: const Icon(Icons.location_city),
        filled: true,
        fillColor: isDark ? AppTheme.navy700 : Colors.white,
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
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
      ),
      items: _cities.entries.map((entry) {
        return DropdownMenuItem<String>(
          value: entry.key,
          child: Text(entry.value),
        );
      }).toList(),
      onChanged: (value) => setState(() => _selectedCity = value),
    );
  }

  Widget _buildDropdownField(String label, String? value, List<String> items, Function(String?) onChanged) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return DropdownButtonFormField<String>(
      value: value,
      decoration: InputDecoration(
        labelText: label,
        prefixIcon: const Icon(Icons.school),
        filled: true,
        fillColor: isDark ? AppTheme.navy700 : Colors.white,
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
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
      ),
      items: items.map((item) {
        return DropdownMenuItem<String>(
          value: item,
          child: Text(_formatStudyingLevel(item)),
        );
      }).toList(),
      onChanged: onChanged,
    );
  }

  Widget _buildImagePicker(String field, File? file, String label, {bool isCircular = false}) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final validation = _documentValidation[field];
    final isChecking = validation?['loading'] == true;
    final isValid = validation?['isValid'];
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
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w500,
              color: isDark ? Colors.white70 : Colors.grey.shade600,
            ),
          ),
          const SizedBox(height: 8),
          Container(
            height: isCircular ? 150 : 120,
            width: isCircular ? 150 : null,
            decoration: BoxDecoration(
              color: isDark ? AppTheme.navy700 : Colors.white,
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
                              : needsValidation
                                  ? Container(
                                      padding: const EdgeInsets.all(6),
                                      decoration: BoxDecoration(
                                        color: isValid == true
                                            ? Colors.green
                                            : (isValid == false
                                                ? Colors.red
                                                : Colors.green),
                                        shape: BoxShape.circle,
                                      ),
                                      child: Icon(
                                        isValid == true
                                            ? Icons.check
                                            : (isValid == false
                                                ? Icons.close
                                                : Icons.check),
                                        color: Colors.white,
                                        size: 16,
                                      ),
                                    )
                                  : Container(
                                      padding: const EdgeInsets.all(6),
                                      decoration: const BoxDecoration(
                                        color: Colors.green,
                                        shape: BoxShape.circle,
                                      ),
                                      child: const Icon(
                                        Icons.check,
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
                        'Tap to upload',
                        style: TextStyle(
                          fontSize: 12,
                          color: isDark ? AppTheme.navy400 : Colors.grey.shade600,
                        ),
                        textAlign: TextAlign.center,
                      ),
                    ],
                  ),
          ),
          if (needsValidation && validation?['message'] != null)
            Padding(
              padding: const EdgeInsets.only(top: 4),
              child: Text(
                validation!['message'],
                style: TextStyle(
                  fontSize: 11,
                  color: isValid == true ? Colors.green : Colors.red,
                ),
              ),
            ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: isDark ? AppTheme.navy900 : const Color(0xFFF9FAFB),
      appBar: AppBar(
        title: const Text('Edit Profile'),
        elevation: 0,
        backgroundColor: isDark ? AppTheme.navy800 : Colors.white,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header Card
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
                        Icons.edit,
                        color: Colors.white,
                        size: 32,
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'Edit Student Profile',
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 20,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            'Update your information and documents',
                            style: TextStyle(
                              color: Colors.white.withOpacity(0.9),
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

              // Personal Information Section
              _buildSectionCard(
                context,
                'Personal Information',
                Icons.person,
                [
                  _buildTextField('First Name', _firstNameController, icon: Icons.badge),
                  const SizedBox(height: 16),
                  _buildTextField('Last Name', _lastNameController, icon: Icons.badge),
                  const SizedBox(height: 16),
                  _buildCityDropdown(),
                  const SizedBox(height: 16),
                  _buildTextField('Phone Number', _phoneController, icon: Icons.phone),
                  const SizedBox(height: 16),
                  _buildTextField('About', _aboutController, maxLines: 3, icon: Icons.description),
                ],
              ),
              const SizedBox(height: 16),

              // Student Information Section
              _buildSectionCard(
                context,
                'Student Information',
                Icons.school,
                [
                  _buildDropdownField(
                    'Studying Level',
                    _selectedStudyingLevel,
                    _studyingLevels,
                    (value) => setState(() => _selectedStudyingLevel = value),
                  ),
                  const SizedBox(height: 16),
                  _buildTextField(
                    'Interesting Keywords',
                    _interestingKeywordsController,
                    icon: Icons.tag,
                    hint: 'e.g., programming, mathematics, physics',
                  ),
                ],
              ),
              const SizedBox(height: 16),

              // Guardian Information Section
              _buildSectionCard(
                context,
                'Guardian Information',
                Icons.family_restroom,
                [
                  _buildTextField(
                    'Guardian Phone',
                    _responsiblePhoneController,
                    icon: Icons.phone_android,
                  ),
                  const SizedBox(height: 16),
                  _buildTextField(
                    'Guardian Email',
                    _responsibleEmailController,
                    icon: Icons.email,
                  ),
                ],
              ),
              const SizedBox(height: 16),

              // Documents Section
              _buildSectionCard(
                context,
                'Update Documents',
                Icons.folder,
                [
                  Text(
                    'Only upload files you want to update',
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: isDark ? Colors.white70 : Colors.grey.shade600,
                    ),
                  ),
                  const SizedBox(height: 16),
                  // Profile Image
                  _buildImagePicker('profile_image', _profileImage, 'Profile Image', isCircular: true),
                  const SizedBox(height: 16),
                  // ID Card
                  Row(
                    children: [
                      Expanded(
                        child: _buildImagePicker('idcard_front', _idcardFront, 'ID Card Front'),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: _buildImagePicker('idcard_back', _idcardBack, 'ID Card Back'),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  // Residence Card
                  Row(
                    children: [
                      Expanded(
                        child: _buildImagePicker('residence_front', _residenceFront, 'Residence Front'),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: _buildImagePicker('residence_back', _residenceBack, 'Residence Back'),
                      ),
                    ],
                  ),
                ],
              ),
              const SizedBox(height: 24),

              // Submit Button
              SizedBox(
                width: double.infinity,
                height: 56,
                child: ElevatedButton(
                  onPressed: (_isSubmitting || _isValidating) ? null : _submitEdit,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: isDark ? AppTheme.teal500 : AppTheme.primary600,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16),
                    ),
                    elevation: 0,
                  ),
                  child: _isSubmitting
                      ? const SizedBox(
                          height: 24,
                          width: 24,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                          ),
                        )
                      : const Text(
                          'Update Profile',
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

  Widget _buildSectionCard(BuildContext context, String title, IconData icon, List<Widget> children) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: isDark ? AppTheme.navy800 : Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isDark ? AppTheme.navy700 : Colors.grey.shade200,
          width: 1,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: (isDark ? AppTheme.teal500 : AppTheme.primary600).withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(
                  icon,
                  color: isDark ? AppTheme.teal400 : AppTheme.primary600,
                  size: 20,
                ),
              ),
              const SizedBox(width: 12),
              Text(
                title,
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: isDark ? Colors.white : AppTheme.navy900,
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),
          ...children,
        ],
      ),
    );
  }
}

