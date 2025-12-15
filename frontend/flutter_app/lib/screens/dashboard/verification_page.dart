import 'dart:io';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:image_picker/image_picker.dart';
import '../../config/theme.dart';
import '../../providers/auth_provider.dart';
import '../../services/api_service.dart';

class VerificationPage extends StatefulWidget {
  const VerificationPage({super.key});

  @override
  State<VerificationPage> createState() => _VerificationPageState();
}

class _VerificationPageState extends State<VerificationPage> {
  final _formKey = GlobalKey<FormState>();
  final _titleController = TextEditingController();
  final _locationController = TextEditingController();
  final _phoneController = TextEditingController();
  final _aboutController = TextEditingController();

  final ImagePicker _picker = ImagePicker();
  
  File? _profileImage;
  File? _idcardFront;
  File? _idcardBack;
  File? _residenceFront;
  File? _residenceBack;

  Map<String, Map<String, dynamic>> _documentValidation = {};
  bool _isSubmitting = false;
  bool _isValidating = false;

  @override
  void dispose() {
    _titleController.dispose();
    _locationController.dispose();
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
            // Skip AI validation for profile_image
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

  Future<void> _submitVerification() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    // Check if all required files are uploaded
    if (_profileImage == null ||
        _idcardFront == null ||
        _idcardBack == null ||
        _residenceFront == null ||
        _residenceBack == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please upload all required documents')),
      );
      return;
    }

    // Check if all documents passed AI validation (except profile_image)
    final requiredDocs = ['idcard_front', 'idcard_back', 'residence_front', 'residence_back'];
    final invalidDocs = requiredDocs.where((field) {
      final validation = _documentValidation[field];
      return validation == null || validation['isValid'] != true;
    }).toList();

    if (invalidDocs.isNotEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Some documents failed validation: ${invalidDocs.join(', ')}')),
      );
      return;
    }

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

    try {
      final payload = {
        'title': _titleController.text.trim(),
        'location': _locationController.text.trim(),
        'phone_number': _phoneController.text.trim(),
        'about': _aboutController.text.trim(),
        'profile_image': _profileImage,
        'idcard_front': _idcardFront,
        'idcard_back': _idcardBack,
        'residence_front': _residenceFront,
        'residence_back': _residenceBack,
      };

      final result = await ApiService.verifyInstitution(
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

      // Update verification status
      await authProvider.updateInstituteData({
        'isVerified': result['is_verified'] ?? true,
      });

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(result['message'] ?? 'Institution verified successfully'),
            backgroundColor: Colors.green,
          ),
        );
        Navigator.pop(context, true); // Return true to indicate success
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

  Widget _buildTextField(String label, TextEditingController controller, {bool required = false, int maxLines = 1}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Text(
              label,
              style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500),
            ),
            if (required)
              const Text(' *', style: TextStyle(color: Colors.red)),
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
          validator: (value) {
            if (required && (value == null || value.trim().isEmpty)) {
              return 'This field is required';
            }
            return null;
          },
        ),
      ],
    );
  }

  Widget _buildFilePicker(String label, File? file, String fieldName, {bool required = false}) {
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
            if (required)
              const Text(' *', style: TextStyle(color: Colors.red)),
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
                    file?.path.split('/').last ?? 'Choose file',
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
        title: const Text('Verify Your Institution'),
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
                'Complete all fields to verify your institution',
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
                      _buildTextField('Institution Title', _titleController, required: true),
                      _buildTextField('Location', _locationController, required: true),
                      _buildTextField('Phone Number', _phoneController, required: true),
                    ],
                  );
                },
              ),
              const SizedBox(height: 16),
              _buildTextField('About', _aboutController, required: true, maxLines: 3),
              const SizedBox(height: 24),
              
              // File Upload Fields
              Text(
                'Required Documents',
                style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
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
                      _buildFilePicker('Profile Image', _profileImage, 'profile_image', required: true),
                      _buildFilePicker('ID Card Front', _idcardFront, 'idcard_front', required: true),
                      _buildFilePicker('ID Card Back', _idcardBack, 'idcard_back', required: true),
                      _buildFilePicker('Residence Front', _residenceFront, 'residence_front', required: true),
                      _buildFilePicker('Residence Back', _residenceBack, 'residence_back', required: true),
                    ],
                  );
                },
              ),
              const SizedBox(height: 24),
              
              // Submit Button
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: (_isSubmitting || _isValidating) ? null : _submitVerification,
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
                      : const Text('Submit for Verification'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

