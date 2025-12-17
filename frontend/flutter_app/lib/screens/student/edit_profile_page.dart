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
    _selectedCity = data['city'];
    _selectedStudyingLevel = data['studying_level'];
  }

  @override
  void dispose() {
    _firstNameController.dispose();
    _lastNameController.dispose();
    _phoneController.dispose();
    _aboutController.dispose();
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
        final isValid = result['is_document'] == true;
        final percentage = result['document_percentage'] ?? 0.0;

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

  Widget _buildTextField(String label, TextEditingController controller, {int maxLines = 1}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Text(
              label,
              style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500),
            ),
            Text(
              ' (Optional)',
              style: TextStyle(
                fontSize: 12,
                color: Colors.grey.shade600,
              ),
            ),
          ],
        ),
        const SizedBox(height: 8),
        TextFormField(
          controller: controller,
          maxLines: maxLines,
          decoration: InputDecoration(
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
            filled: true,
            fillColor: Theme.of(context).brightness == Brightness.dark
                ? AppTheme.navy700
                : Colors.grey.shade50,
            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
          ),
        ),
      ],
    );
  }

  Widget _buildCityDropdown() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            const Text(
              'City',
              style: TextStyle(fontSize: 14, fontWeight: FontWeight.w500),
            ),
            Text(
              ' (Optional)',
              style: TextStyle(
                fontSize: 12,
                color: Colors.grey.shade600,
              ),
            ),
          ],
        ),
        const SizedBox(height: 8),
        DropdownButtonFormField<String>(
          value: _selectedCity,
          decoration: InputDecoration(
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
            filled: true,
            fillColor: Theme.of(context).brightness == Brightness.dark
                ? AppTheme.navy700
                : Colors.grey.shade50,
            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
          ),
          items: _cities.entries.map((entry) {
            return DropdownMenuItem<String>(
              value: entry.key,
              child: Text(entry.value),
            );
          }).toList(),
          onChanged: (value) => setState(() => _selectedCity = value),
        ),
      ],
    );
  }

  Widget _buildDropdownField(String label, String? value, List<String> items, Function(String?) onChanged) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Text(
              label,
              style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500),
            ),
            Text(
              ' (Optional)',
              style: TextStyle(
                fontSize: 12,
                color: Colors.grey.shade600,
              ),
            ),
          ],
        ),
        const SizedBox(height: 8),
        DropdownButtonFormField<String>(
          value: value,
          decoration: InputDecoration(
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
            filled: true,
            fillColor: Theme.of(context).brightness == Brightness.dark
                ? AppTheme.navy700
                : Colors.grey.shade50,
            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
          ),
          items: items.map((item) {
            return DropdownMenuItem<String>(
              value: item,
              child: Text(item),
            );
          }).toList(),
          onChanged: onChanged,
        ),
      ],
    );
  }

  Widget _buildFilePicker(String label, File? file, String fieldName) {
    final validation = _documentValidation[fieldName];
    final isValid = validation?['isValid'];
    final isLoading = validation?['loading'] == true;
    final message = validation?['message'];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Text(
              label,
              style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500),
            ),
            Text(
              ' (Optional)',
              style: TextStyle(
                fontSize: 12,
                color: Colors.grey.shade600,
              ),
            ),
          ],
        ),
        const SizedBox(height: 8),
        InkWell(
          onTap: () => _pickImage(fieldName),
          child: Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              border: Border.all(
                color: isValid == false
                    ? Colors.red
                    : isValid == true
                        ? Colors.green
                        : Colors.grey,
              ),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Row(
              children: [
                Icon(
                  Icons.upload_file,
                  color: isValid == false
                      ? Colors.red
                      : isValid == true
                          ? Colors.green
                          : Colors.grey,
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    file?.path.split('/').last ?? 'Choose file to update',
                    style: TextStyle(
                      color: file != null ? Colors.black87 : Colors.grey,
                    ),
                  ),
                ),
                if (isLoading)
                  const SizedBox(
                    width: 16,
                    height: 16,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                else if (isValid == true)
                  const Icon(Icons.check_circle, color: Colors.green, size: 20)
                else if (isValid == false)
                  const Icon(Icons.error, color: Colors.red, size: 20),
              ],
            ),
          ),
        ),
        if (message != null)
          Padding(
            padding: const EdgeInsets.only(top: 4),
            child: Text(
              message,
              style: TextStyle(
                fontSize: 12,
                color: isValid == true ? Colors.green : Colors.red,
              ),
            ),
          ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Edit Student Profile'),
        elevation: 0,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Update your student information',
                style: theme.textTheme.bodyMedium,
              ),
              const SizedBox(height: 24),
              
              // Text Fields
              Builder(
                builder: (context) {
                  final screenWidth = MediaQuery.of(context).size.width;
                  final isSmallScreen = screenWidth < 600;
                  final crossAxisCount = isSmallScreen ? 1 : 2;
                  
                  return GridView.count(
                    crossAxisCount: crossAxisCount,
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    crossAxisSpacing: 12,
                    mainAxisSpacing: 12,
                    childAspectRatio: isSmallScreen ? 2.5 : 1.3,
                    children: [
                      _buildTextField('First Name', _firstNameController),
                      _buildTextField('Last Name', _lastNameController),
                      _buildCityDropdown(),
                      _buildTextField('Phone Number', _phoneController),
                    ],
                  );
                },
              ),
              const SizedBox(height: 16),
              _buildTextField('About', _aboutController, maxLines: 3),
              const SizedBox(height: 16),
              
              // Student Specific Fields
              Text(
                'Student Information',
                style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 8),
              _buildDropdownField(
                'Studying Level',
                _selectedStudyingLevel,
                _studyingLevels,
                (value) => setState(() => _selectedStudyingLevel = value),
              ),
              const SizedBox(height: 24),
              
              // File Upload Fields
              Text(
                'Update Documents',
                style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 8),
              Text(
                'Only upload files you want to update',
                style: theme.textTheme.bodySmall,
              ),
              const SizedBox(height: 16),
              Builder(
                builder: (context) {
                  final screenWidth = MediaQuery.of(context).size.width;
                  final isSmallScreen = screenWidth < 600;
                  final crossAxisCount = isSmallScreen ? 1 : 2;
                  
                  return GridView.count(
                    crossAxisCount: crossAxisCount,
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    crossAxisSpacing: 12,
                    mainAxisSpacing: 12,
                    childAspectRatio: isSmallScreen ? 2.0 : 1.2,
                    children: [
                      _buildFilePicker('Profile Image', _profileImage, 'profile_image'),
                      _buildFilePicker('ID Card Front', _idcardFront, 'idcard_front'),
                      _buildFilePicker('ID Card Back', _idcardBack, 'idcard_back'),
                      _buildFilePicker('Residence Front', _residenceFront, 'residence_front'),
                      _buildFilePicker('Residence Back', _residenceBack, 'residence_back'),
                    ],
                  );
                },
              ),
              const SizedBox(height: 24),
              
              // Submit Button
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: (_isSubmitting || _isValidating) ? null : _submitEdit,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.teal500,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                  ),
                  child: _isSubmitting
                      ? const SizedBox(
                          height: 20,
                          width: 20,
                          child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                        )
                      : const Text('Update Profile'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

