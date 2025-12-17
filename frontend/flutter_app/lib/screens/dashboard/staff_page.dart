import 'dart:async';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:image_picker/image_picker.dart';
import '../../config/theme.dart';
import '../../providers/auth_provider.dart';
import '../../services/api_service.dart';
import '../../widgets/verification_lock.dart';
import '../../widgets/modern_bottom_nav.dart';
import '../../utils/navigation_helper.dart';

// Purple colors for staff page (matching React)
class StaffColors {
  static const Color purple600 = Color(0xFF9333EA);
  static const Color purple700 = Color(0xFF7E22CE);
  static const Color purple500 = Color(0xFFA855F7);
}

class StaffPage extends StatefulWidget {
  const StaffPage({super.key});

  @override
  State<StaffPage> createState() => _StaffPageState();
}

class _StaffPageState extends State<StaffPage> {
  final TextEditingController _searchController = TextEditingController();
  Timer? _debounceTimer;
  bool _isLoading = false;
  String? _error;
  List<dynamic> _staff = [];
  Map<String, dynamic> _pagination = {
    'count': 0,
    'next': null,
    'previous': null,
    'currentPage': 1,
  };
  bool _isRemote = false;
  Map<String, dynamic>? _selectedStaff;
  bool _showCreateModal = false;
  bool _showViewModal = false;
  bool _showEditModal = false;
  bool _showVerificationWarning = false;
  bool _isCreating = false;
  bool _isEditing = false;
  bool _isDeleting = false;
  bool _isLoadingProfile = false;

  // Form states
  final Map<String, TextEditingController> _createFormControllers = {
    'first_name': TextEditingController(),
    'last_name': TextEditingController(),
    'phone_number': TextEditingController(),
    'duty': TextEditingController(),
    'salary': TextEditingController(),
  };

  final Map<String, TextEditingController> _editFormControllers = {
    'first_name': TextEditingController(),
    'last_name': TextEditingController(),
    'phone_number': TextEditingController(),
    'duty': TextEditingController(),
    'salary': TextEditingController(),
  };

  File? _createPersonalImage;
  File? _createIdcardFront;
  File? _createIdcardBack;
  File? _createResidenceFront;
  File? _createResidenceBack;

  File? _editPersonalImage;
  File? _editIdcardFront;
  File? _editIdcardBack;
  File? _editResidenceFront;
  File? _editResidenceBack;

  // Document validation states
  final Map<String, Map<String, dynamic>> _documentValidation = {
    'idcard_front': {'loading': false, 'isValid': null, 'message': null, 'percentage': null},
    'idcard_back': {'loading': false, 'isValid': null, 'message': null, 'percentage': null},
    'residence_front': {'loading': false, 'isValid': null, 'message': null, 'percentage': null},
    'residence_back': {'loading': false, 'isValid': null, 'message': null, 'percentage': null},
  };

  final ImagePicker _picker = ImagePicker();
  static const String _baseUrl = 'https://projecteastapi.ddns.net';

  @override
  void initState() {
    super.initState();
    _searchController.addListener(_onSearchChanged);
    _fetchStaff();
  }

  @override
  void dispose() {
    _debounceTimer?.cancel();
    _searchController.dispose();
    for (var controller in _createFormControllers.values) {
      controller.dispose();
    }
    for (var controller in _editFormControllers.values) {
      controller.dispose();
    }
    super.dispose();
  }

  void _onSearchChanged() {
    if (_debounceTimer?.isActive ?? false) _debounceTimer!.cancel();
    _debounceTimer = Timer(const Duration(milliseconds: 400), () {
      setState(() {});
    });
  }

  String _getImageUrl(String? imagePath) {
    if (imagePath == null || imagePath.isEmpty) return '';
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }
    String cleanPath = imagePath.startsWith('/') ? imagePath : '/$imagePath';
    cleanPath = cleanPath.replaceAll(RegExp(r'/media/media+'), '/media/');
    if (cleanPath.startsWith('/media/media/')) {
      cleanPath = cleanPath.replaceFirst('/media/media/', '/media/');
    }
    return '$_baseUrl$cleanPath';
  }

  List<dynamic> get _filteredStaff {
    if (_searchController.text.trim().isEmpty) return _staff;
    final search = _searchController.text.toLowerCase();
    return _staff.where((member) {
      final fullName = '${member['first_name'] ?? ''} ${member['last_name'] ?? ''}'.toLowerCase();
      final duty = (member['duty'] ?? '').toLowerCase();
      final phone = (member['phone_number'] ?? '').toLowerCase();
      return fullName.contains(search) || duty.contains(search) || phone.contains(search);
    }).toList();
  }

  bool _checkVerification(String operation) {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final instituteData = authProvider.instituteData;
    if (instituteData['isVerified'] != true) {
      setState(() {
        _showVerificationWarning = true;
      });
      return false;
    }
    return true;
  }

  Future<void> _fetchStaff({int? page}) async {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final instituteData = authProvider.instituteData;
    final accessToken = instituteData['accessToken'];
    final refreshToken = instituteData['refreshToken'];

    if (accessToken == null) {
      setState(() {
        _isLoading = false;
        _error = 'Not authenticated';
      });
      return;
    }

    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final data = await ApiService.getInstitutionStaffList(
        accessToken: accessToken,
        page: page ?? _pagination['currentPage'],
        refreshToken: refreshToken,
        onTokenRefreshed: (tokens) {
          authProvider.onTokenRefreshed(tokens);
        },
        onSessionExpired: () {
          authProvider.onSessionExpired();
        },
      );

      List<dynamic> staff = [];
      if (data['results'] is List) {
        staff = data['results'] as List<dynamic>;
      }

      setState(() {
        _staff = staff;
        _isRemote = true;
        _pagination = {
          'count': data['count'] ?? 0,
          'next': data['next'],
          'previous': data['previous'],
          'currentPage': page ?? _pagination['currentPage'],
        };
      });
    } catch (err) {
      setState(() {
        _error = err is ApiException ? err.message : 'Unable to load staff';
        _isRemote = false;
      });
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  Future<void> _validateDocument(File file, String fieldName) async {
    if (!mounted) return;

    setState(() {
      _documentValidation[fieldName] = {
        'loading': true,
        'isValid': null,
        'message': null,
        'percentage': null,
      };
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
        final nonDocPercentage = result['nondocument_percentage'] ?? 0.0;

        setState(() {
          _documentValidation[fieldName] = {
            'loading': false,
            'isValid': isValid,
            'message': isValid
                ? 'Document is valid (${percentage.toStringAsFixed(1)}%)'
                : 'Document is not valid (${percentage.toStringAsFixed(1)}% document, ${nonDocPercentage.toStringAsFixed(1)}% non-document)',
            'percentage': percentage,
          };
        });

        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              isValid
                  ? '${fieldName.replaceAll('_', ' ')}: Document validated successfully'
                  : '${fieldName.replaceAll('_', ' ')}: Document validation failed',
            ),
            backgroundColor: isValid ? Colors.green : Colors.red,
            duration: Duration(seconds: isValid ? 2 : 4),
          ),
        );
      }
    } catch (err) {
      if (mounted) {
        setState(() {
          _documentValidation[fieldName] = {
            'loading': false,
            'isValid': false,
            'message': err is ApiException ? err.message : 'Failed to validate document',
            'percentage': null,
          };
        });

        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('${fieldName.replaceAll('_', ' ')}: ${err is ApiException ? err.message : 'Document validation failed'}'),
            backgroundColor: Colors.red,
            duration: const Duration(seconds: 4),
          ),
        );
      }
    }
  }

  Future<void> _pickImage(String field, bool isCreate) async {
    try {
      final XFile? image = await _picker.pickImage(source: ImageSource.gallery);
      if (image != null) {
        final file = File(image.path);
        setState(() {
          if (isCreate) {
            if (field == 'personal_image') {
              _createPersonalImage = file;
            } else if (field == 'idcard_front') {
              _createIdcardFront = file;
              _validateDocument(file, 'idcard_front');
            } else if (field == 'idcard_back') {
              _createIdcardBack = file;
              _validateDocument(file, 'idcard_back');
            } else if (field == 'residence_front') {
              _createResidenceFront = file;
              _validateDocument(file, 'residence_front');
            } else if (field == 'residence_back') {
              _createResidenceBack = file;
              _validateDocument(file, 'residence_back');
            }
          } else {
            if (field == 'personal_image') {
              _editPersonalImage = file;
            } else if (field == 'idcard_front') {
              _editIdcardFront = file;
              _validateDocument(file, 'idcard_front');
            } else if (field == 'idcard_back') {
              _editIdcardBack = file;
              _validateDocument(file, 'idcard_back');
            } else if (field == 'residence_front') {
              _editResidenceFront = file;
              _validateDocument(file, 'residence_front');
            } else if (field == 'residence_back') {
              _editResidenceBack = file;
              _validateDocument(file, 'residence_back');
            }
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

  Future<void> _createStaff() async {
    if (!_checkVerification('create')) return;

    // Validate required fields
    if (_createFormControllers['first_name']!.text.trim().isEmpty ||
        _createFormControllers['last_name']!.text.trim().isEmpty ||
        _createFormControllers['phone_number']!.text.trim().isEmpty ||
        _createFormControllers['duty']!.text.trim().isEmpty ||
        _createFormControllers['salary']!.text.trim().isEmpty ||
        _createPersonalImage == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please fill in all required fields')),
      );
      return;
    }

    // Check optional documents validation
    final optionalDocs = ['idcard_front', 'idcard_back', 'residence_front', 'residence_back'];
    for (final doc in optionalDocs) {
      File? file;
      if (doc == 'idcard_front') file = _createIdcardFront;
      if (doc == 'idcard_back') file = _createIdcardBack;
      if (doc == 'residence_front') file = _createResidenceFront;
      if (doc == 'residence_back') file = _createResidenceBack;

      if (file != null) {
        final validation = _documentValidation[doc];
        if (validation!['loading'] == true) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Please wait for document validation to complete')),
          );
          return;
        }
        if (validation['isValid'] == false) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('${doc.replaceAll('_', ' ')}: Document validation failed')),
          );
          return;
        }
      }
    }

    setState(() {
      _isCreating = true;
    });

    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final instituteData = authProvider.instituteData;
    final accessToken = instituteData['accessToken'];
    final refreshToken = instituteData['refreshToken'];

    try {
      final payload = <String, dynamic>{
        'first_name': _createFormControllers['first_name']!.text.trim(),
        'last_name': _createFormControllers['last_name']!.text.trim(),
        'phone_number': _createFormControllers['phone_number']!.text.trim(),
        'duty': _createFormControllers['duty']!.text.trim(),
        'salary': double.tryParse(_createFormControllers['salary']!.text) ?? 0.0,
        'personal_image': _createPersonalImage,
        if (_createIdcardFront != null) 'idcard_front': _createIdcardFront,
        if (_createIdcardBack != null) 'idcard_back': _createIdcardBack,
        if (_createResidenceFront != null) 'residence_front': _createResidenceFront,
        if (_createResidenceBack != null) 'residence_back': _createResidenceBack,
      };

      final result = await ApiService.createStaff(
        accessToken: accessToken!,
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
        if (result['success'] == true) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(result['message'] ?? 'Staff member added successfully!'),
              backgroundColor: Colors.green,
            ),
          );
          _resetCreateForm();
          setState(() {
            _showCreateModal = false;
          });
          await _fetchStaff(page: _pagination['currentPage']);
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(result['message'] ?? 'Failed to create staff member'),
              backgroundColor: Colors.red,
            ),
          );
        }
      }
    } catch (err) {
      if (mounted) {
        String errorMessage = 'Failed to create staff member';
        if (err is ApiException) {
          errorMessage = err.message;
          if (err.data != null && err.data!['errors'] != null) {
            final errors = err.data!['errors'] as Map<String, dynamic>;
            final errorList = errors.entries.map((e) {
              final fieldLabel = e.key == 'first_name'
                  ? 'First Name'
                  : e.key == 'last_name'
                      ? 'Last Name'
                      : e.key == 'phone_number'
                          ? 'Phone'
                          : e.key == 'duty'
                              ? 'Duty'
                              : e.key == 'salary'
                                  ? 'Salary'
                                  : e.key == 'personal_image'
                                      ? 'Personal Image'
                                      : e.key;
              final messages = e.value is List ? (e.value as List).join(', ') : e.value.toString();
              return '$fieldLabel: $messages';
            }).join('; ');
            errorMessage = errorList.isNotEmpty ? errorList : errorMessage;
          }
        }
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(errorMessage), backgroundColor: Colors.red),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isCreating = false;
        });
      }
    }
  }

  void _resetCreateForm() {
    for (var controller in _createFormControllers.values) {
      controller.clear();
    }
    setState(() {
      _createPersonalImage = null;
      _createIdcardFront = null;
      _createIdcardBack = null;
      _createResidenceFront = null;
      _createResidenceBack = null;
      _documentValidation['idcard_front'] = {'loading': false, 'isValid': null, 'message': null, 'percentage': null};
      _documentValidation['idcard_back'] = {'loading': false, 'isValid': null, 'message': null, 'percentage': null};
      _documentValidation['residence_front'] = {'loading': false, 'isValid': null, 'message': null, 'percentage': null};
      _documentValidation['residence_back'] = {'loading': false, 'isValid': null, 'message': null, 'percentage': null};
    });
  }

  Future<void> _loadStaffDetails(int staffId) async {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final instituteData = authProvider.instituteData;
    final accessToken = instituteData['accessToken'];
    final refreshToken = instituteData['refreshToken'];

    if (accessToken == null) return;

    setState(() {
      _isLoadingProfile = true;
      _selectedStaff = null;
    });

    try {
      final result = await ApiService.getStaffDetails(
        accessToken: accessToken,
        staffId: staffId,
        refreshToken: refreshToken,
        onTokenRefreshed: (tokens) {
          authProvider.onTokenRefreshed(tokens);
        },
        onSessionExpired: () {
          authProvider.onSessionExpired();
        },
      );

      if (mounted) {
        if (result['success'] == true && result['data'] != null) {
          setState(() {
            _selectedStaff = result['data'] as Map<String, dynamic>;
          });
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(result['message'] ?? 'Staff member not found')),
          );
          setState(() {
            _showViewModal = false;
            _showEditModal = false;
          });
        }
      }
    } catch (err) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(err is ApiException ? err.message : 'Unable to load staff details')),
        );
        setState(() {
          _showViewModal = false;
          _showEditModal = false;
        });
      }
    } finally {
      if (mounted) {
        setState(() {
          _isLoadingProfile = false;
        });
      }
    }
  }

  Future<void> _viewStaff(int staffId) async {
    if (!_checkVerification('view')) return;
    setState(() {
      _showViewModal = true;
    });
    await _loadStaffDetails(staffId);
  }

  Future<void> _editStaff(int staffId) async {
    if (!_checkVerification('edit')) return;
    await _loadStaffDetails(staffId);
    if (_selectedStaff != null) {
      _editFormControllers['first_name']!.text = _selectedStaff!['first_name'] ?? '';
      _editFormControllers['last_name']!.text = _selectedStaff!['last_name'] ?? '';
      _editFormControllers['phone_number']!.text = _selectedStaff!['phone_number'] ?? '';
      _editFormControllers['duty']!.text = _selectedStaff!['duty'] ?? '';
      _editFormControllers['salary']!.text = _selectedStaff!['salary']?.toString() ?? '';
      setState(() {
        _editPersonalImage = null;
        _editIdcardFront = null;
        _editIdcardBack = null;
        _editResidenceFront = null;
        _editResidenceBack = null;
        _showEditModal = true;
        _showViewModal = false;
      });
    }
  }

  Future<void> _updateStaff() async {
    if (_selectedStaff == null || _selectedStaff!['id'] == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('No staff member selected')),
      );
      return;
    }

    setState(() {
      _isEditing = true;
    });

    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final instituteData = authProvider.instituteData;
    final accessToken = instituteData['accessToken'];
    final refreshToken = instituteData['refreshToken'];

    try {
      final payload = <String, dynamic>{};
      if (_editFormControllers['first_name']!.text.trim().isNotEmpty) {
        payload['first_name'] = _editFormControllers['first_name']!.text.trim();
      }
      if (_editFormControllers['last_name']!.text.trim().isNotEmpty) {
        payload['last_name'] = _editFormControllers['last_name']!.text.trim();
      }
      if (_editFormControllers['phone_number']!.text.trim().isNotEmpty) {
        payload['phone_number'] = _editFormControllers['phone_number']!.text.trim();
      }
      if (_editFormControllers['duty']!.text.trim().isNotEmpty) {
        payload['duty'] = _editFormControllers['duty']!.text.trim();
      }
      if (_editFormControllers['salary']!.text.trim().isNotEmpty) {
        payload['salary'] = double.tryParse(_editFormControllers['salary']!.text) ?? 0.0;
      }
      if (_editPersonalImage != null) payload['personal_image'] = _editPersonalImage;
      if (_editIdcardFront != null) payload['idcard_front'] = _editIdcardFront;
      if (_editIdcardBack != null) payload['idcard_back'] = _editIdcardBack;
      if (_editResidenceFront != null) payload['residence_front'] = _editResidenceFront;
      if (_editResidenceBack != null) payload['residence_back'] = _editResidenceBack;

      final result = await ApiService.editStaff(
        accessToken: accessToken!,
        staffId: _selectedStaff!['id'] as int,
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
        if (result['success'] == true) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(result['message'] ?? 'Staff member updated successfully!'),
              backgroundColor: Colors.green,
            ),
          );
          setState(() {
            _showEditModal = false;
            _selectedStaff = null;
          });
          await _fetchStaff(page: _pagination['currentPage']);
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(result['message'] ?? 'Failed to update staff member'),
              backgroundColor: Colors.red,
            ),
          );
        }
      }
    } catch (err) {
      if (mounted) {
        String errorMessage = 'Failed to update staff member';
        if (err is ApiException) {
          errorMessage = err.message;
          if (err.data != null && err.data!['errors'] != null) {
            final errors = err.data!['errors'] as Map<String, dynamic>;
            final errorList = errors.entries.map((e) {
              final messages = e.value is List ? (e.value as List).join(', ') : e.value.toString();
              return '${e.key}: $messages';
            }).join('; ');
            errorMessage = errorList.isNotEmpty ? errorList : errorMessage;
          }
        }
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(errorMessage), backgroundColor: Colors.red),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isEditing = false;
        });
      }
    }
  }

  Future<void> _deleteStaff(int staffId) async {
    if (!_checkVerification('delete')) return;

    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete Staff Member'),
        content: const Text('Are you sure you want to delete this staff member?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.of(context).pop(true),
            style: TextButton.styleFrom(foregroundColor: Colors.red),
            child: const Text('Delete'),
          ),
        ],
      ),
    );

    if (confirmed != true) return;

    setState(() {
      _isDeleting = true;
    });

    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final instituteData = authProvider.instituteData;
    final accessToken = instituteData['accessToken'];
    final refreshToken = instituteData['refreshToken'];

    try {
      final result = await ApiService.deleteStaff(
        accessToken: accessToken!,
        staffId: staffId,
        refreshToken: refreshToken,
        onTokenRefreshed: (tokens) {
          authProvider.onTokenRefreshed(tokens);
        },
        onSessionExpired: () {
          authProvider.onSessionExpired();
        },
      );

      if (mounted) {
        if (result['success'] == true) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(result['message'] ?? 'Staff member deleted successfully!'),
              backgroundColor: Colors.green,
            ),
          );
          await _fetchStaff(page: _pagination['currentPage']);
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(result['message'] ?? 'Failed to delete staff member'),
              backgroundColor: Colors.red,
            ),
          );
        }
      }
    } catch (err) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(err is ApiException ? err.message : 'Failed to delete staff member'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isDeleting = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final authProvider = Provider.of<AuthProvider>(context);
    final instituteData = authProvider.instituteData;

    // BLOCK ACCESS if not verified
    if (instituteData['isVerified'] != true) {
      return const VerificationLock();
    }

    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Scaffold(
      bottomNavigationBar: ModernBottomNav(
        currentIndex: 1, // Dashboard index for institutions
        onTap: (index) {
          NavigationHelper.handleBottomNavTap(context, index);
        },
      ),
      body: Stack(
        children: [
          SingleChildScrollView(
            padding: const EdgeInsets.all(16.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Header
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Flexible(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Staff',
                            style: TextStyle(
                              fontSize: 32,
                              fontWeight: FontWeight.bold,
                              color: isDark ? Colors.white : Colors.grey.shade800,
                            ),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            'Manage your institution staff',
                            style: TextStyle(
                              fontSize: 16,
                              color: isDark ? Colors.grey.shade400 : Colors.grey.shade600,
                            ),
                          ),
                        ],
                      ),
                    ),
                    ElevatedButton.icon(
                      onPressed: () {
                        if (!_checkVerification('create')) return;
                        setState(() {
                          _showCreateModal = true;
                        });
                      },
                      icon: const Icon(Icons.add),
                      label: const Text('Add Staff'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: StaffColors.purple600,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
                      ),
                    ),
                  ],
                ),

                const SizedBox(height: 24),

                // Search and Refresh
                Card(
                  elevation: 2,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  child: Padding(
                    padding: const EdgeInsets.all(16.0),
                    child: Column(
                      children: [
                        Row(
                          children: [
                            Expanded(
                              child: TextField(
                                controller: _searchController,
                                decoration: InputDecoration(
                                  hintText: 'Search by name, duty, or phone...',
                                  prefixIcon: const Icon(Icons.search),
                                  border: OutlineInputBorder(
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                  filled: true,
                                  fillColor: isDark ? AppTheme.navy700 : Colors.grey.shade50,
                                ),
                              ),
                            ),
                            const SizedBox(width: 12),
                            ElevatedButton.icon(
                              onPressed: _isLoading ? null : () => _fetchStaff(),
                              icon: Icon(
                                Icons.refresh,
                                color: _isLoading ? Colors.grey : Colors.white,
                              ),
                              label: const Text('Refresh'),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: StaffColors.purple600,
                                foregroundColor: Colors.white,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        Row(
                          children: [
                            Text(
                              'Showing ${_filteredStaff.length} of ${_pagination['count']} staff members',
                              style: TextStyle(
                                fontSize: 14,
                                color: isDark ? Colors.grey.shade400 : Colors.grey.shade600,
                              ),
                            ),
                            const SizedBox(width: 8),
                            if (_isRemote)
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                decoration: BoxDecoration(
                                  color: Colors.green.shade100,
                                  borderRadius: BorderRadius.circular(4),
                                ),
                                child: Text(
                                  'Live',
                                  style: TextStyle(
                                    fontSize: 12,
                                    color: Colors.green.shade700,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ),
                          ],
                        ),
                        if (_error != null)
                          Padding(
                            padding: const EdgeInsets.only(top: 8.0),
                            child: Row(
                              children: [
                                Icon(Icons.warning_amber, color: Colors.amber.shade600, size: 20),
                                const SizedBox(width: 8),
                                Expanded(
                                  child: Text(
                                    _error!,
                                    style: TextStyle(
                                      fontSize: 14,
                                      color: Colors.amber.shade600,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                      ],
                    ),
                  ),
                ),

                const SizedBox(height: 16),

                // Staff Table
                Card(
                  elevation: 2,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  child: _isLoading
                      ? const Padding(
                          padding: EdgeInsets.all(32.0),
                          child: Center(child: CircularProgressIndicator()),
                        )
                      : _filteredStaff.isEmpty
                          ? Padding(
                              padding: const EdgeInsets.all(48.0),
                              child: Center(
                                child: Column(
                                  children: [
                                    Icon(
                                      Icons.business_center_outlined,
                                      size: 64,
                                      color: Colors.grey.shade400,
                                    ),
                                    const SizedBox(height: 16),
                                    Text(
                                      'No staff found',
                                      style: TextStyle(
                                        fontSize: 18,
                                        color: Colors.grey.shade600,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            )
                          : SingleChildScrollView(
                              scrollDirection: Axis.horizontal,
                              child: DataTable(
                                headingRowColor: MaterialStateProperty.all(
                                  StaffColors.purple600,
                                ),
                                columns: const [
                                  DataColumn(label: Text('#', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold))),
                                  DataColumn(label: Text('Name', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold))),
                                  DataColumn(label: Text('Duty', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold))),
                                  DataColumn(label: Text('Phone', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold))),
                                  DataColumn(label: Text('Salary', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold))),
                                  DataColumn(label: Text('Status', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold))),
                                  DataColumn(label: Text('Actions', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold))),
                                ],
                                rows: List.generate(_filteredStaff.length, (index) {
                                  final member = _filteredStaff[index];
                                  final firstName = member['first_name'] ?? '';
                                  final lastName = member['last_name'] ?? '';
                                  final name = '$firstName $lastName'.trim();
                                  final personalImage = member['personal_image'];
                                  final duty = member['duty'] ?? '—';
                                  final phone = member['phone_number'] ?? '—';
                                  final salary = member['salary'];
                                  final salaryText = salary != null ? '\$${salary.toStringAsFixed(2)}' : '—';
                                  final active = member['is_active'] == true;
                                  final staffId = member['id'];

                                  final rowNumber = (((_pagination['currentPage'] as int) - 1) * 10) + index + 1;
                                  return DataRow(
                                    cells: [
                                      DataCell(Text(
                                        '$rowNumber',
                                        style: TextStyle(color: isDark ? Colors.white : Colors.black),
                                      )),
                                      DataCell(
                                        InkWell(
                                          onTap: staffId != null ? () => _viewStaff(staffId as int) : null,
                                          child: Row(
                                            children: [
                                              if (personalImage != null)
                                                CircleAvatar(
                                                  radius: 20,
                                                  backgroundImage: NetworkImage(_getImageUrl(personalImage)),
                                                  onBackgroundImageError: (_, __) {},
                                                )
                                              else
                                                CircleAvatar(
                                                  radius: 20,
                                                  backgroundColor: StaffColors.purple600,
                                                  child: const Icon(Icons.person, color: Colors.white, size: 20),
                                                ),
                                              const SizedBox(width: 12),
                                              Expanded(
                                                child: Column(
                                                  crossAxisAlignment: CrossAxisAlignment.start,
                                                  mainAxisAlignment: MainAxisAlignment.center,
                                                  children: [
                                                    Text(
                                                      name.isNotEmpty ? name : '—',
                                                      style: TextStyle(
                                                        fontWeight: FontWeight.w500,
                                                        color: isDark ? Colors.white : Colors.black,
                                                      ),
                                                    ),
                                                  ],
                                                ),
                                              ),
                                            ],
                                          ),
                                        ),
                                      ),
                                      DataCell(Text(
                                        duty,
                                        style: TextStyle(color: isDark ? Colors.white : Colors.black),
                                      )),
                                      DataCell(Text(
                                        phone,
                                        style: TextStyle(color: isDark ? Colors.white : Colors.black),
                                      )),
                                      DataCell(Text(
                                        salaryText,
                                        style: TextStyle(color: isDark ? Colors.white : Colors.black),
                                      )),
                                      DataCell(
                                        Container(
                                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                                          decoration: BoxDecoration(
                                            color: active
                                                ? Colors.green.shade100
                                                : Colors.red.shade100,
                                            borderRadius: BorderRadius.circular(12),
                                          ),
                                          child: Text(
                                            active ? 'Active' : 'Inactive',
                                            style: TextStyle(
                                              fontSize: 12,
                                              fontWeight: FontWeight.bold,
                                              color: active
                                                  ? Colors.green.shade700
                                                  : Colors.red.shade700,
                                            ),
                                          ),
                                        ),
                                      ),
                                      DataCell(
                                        Row(
                                          children: [
                                            if (staffId != null)
                                              IconButton(
                                                icon: const Icon(Icons.edit, size: 18),
                                                color: Colors.blue.shade600,
                                                onPressed: () => _editStaff(staffId as int),
                                              ),
                                            if (staffId != null)
                                              IconButton(
                                                icon: const Icon(Icons.delete, size: 18),
                                                color: Colors.red.shade600,
                                                onPressed: _isDeleting ? null : () => _deleteStaff(staffId as int),
                                              ),
                                          ],
                                        ),
                                      ),
                                    ],
                                  );
                                }),
                              ),
                            ),
                ),

                // Pagination
                if (!_isLoading && _filteredStaff.isNotEmpty)
                  Padding(
                    padding: const EdgeInsets.all(16.0),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        ElevatedButton(
                          onPressed: _pagination['previous'] == null || _isLoading
                              ? null
                              : () {
                                  final prev = (_pagination['currentPage'] as int) - 1;
                                  _fetchStaff(page: prev);
                                },
                          style: ElevatedButton.styleFrom(
                            backgroundColor: StaffColors.purple600,
                            foregroundColor: Colors.white,
                          ),
                          child: const Text('Previous'),
                        ),
                        const SizedBox(width: 16),
                        Text(
                          'Page ${_pagination['currentPage']}',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                            color: isDark ? Colors.white : Colors.black,
                          ),
                        ),
                        const SizedBox(width: 16),
                        ElevatedButton(
                          onPressed: _pagination['next'] == null || _isLoading
                              ? null
                              : () {
                                  final next = (_pagination['currentPage'] as int) + 1;
                                  _fetchStaff(page: next);
                                },
                          style: ElevatedButton.styleFrom(
                            backgroundColor: StaffColors.purple600,
                            foregroundColor: Colors.white,
                          ),
                          child: const Text('Next'),
                        ),
                      ],
                    ),
                  ),
              ],
            ),
          ),
          // Modals
          if (_showCreateModal) _buildCreateModal(isDark),
          if (_showViewModal) _buildViewModal(isDark),
          if (_showEditModal) _buildEditModal(isDark),
          if (_showVerificationWarning) _buildVerificationWarningModal(isDark),
        ],
      ),
    );
  }

  Widget _buildCreateModal(bool isDark) {
    return Dialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Container(
        constraints: const BoxConstraints(maxWidth: 900, maxHeight: 800),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Header
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: StaffColors.purple600,
                borderRadius: const BorderRadius.only(
                  topLeft: Radius.circular(16),
                  topRight: Radius.circular(16),
                ),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Flexible(
                    child: Text(
                      'Add Staff Member',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                      ),
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close, color: Colors.white),
                    onPressed: _isCreating
                        ? null
                        : () {
                            setState(() {
                              _showCreateModal = false;
                            });
                            _resetCreateForm();
                          },
                  ),
                ],
              ),
            ),
            // Content
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(16),
                child: Form(
                  child: Builder(
                    builder: (context) {
                      final screenWidth = MediaQuery.of(context).size.width;
                      final isSmallScreen = screenWidth < 600;
                      final crossAxisCount = isSmallScreen ? 1 : 2;
                      final aspectRatio = isSmallScreen ? 2.5 : 1.3;
                      
                      return Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // Required fields grid
                          GridView.count(
                            crossAxisCount: crossAxisCount,
                            shrinkWrap: true,
                            physics: const NeverScrollableScrollPhysics(),
                            crossAxisSpacing: 12,
                            mainAxisSpacing: 12,
                            childAspectRatio: aspectRatio,
                        children: [
                          _buildTextField('First Name', _createFormControllers['first_name']!, isDark, required: true),
                          _buildTextField('Last Name', _createFormControllers['last_name']!, isDark, required: true),
                          _buildTextField('Phone Number', _createFormControllers['phone_number']!, isDark, required: true),
                          _buildTextField('Duty', _createFormControllers['duty']!, isDark, required: true),
                          _buildTextField('Salary (\$)', _createFormControllers['salary']!, isDark, required: true, keyboardType: TextInputType.number),
                        ],
                      ),
                      const SizedBox(height: 16),
                      // Personal Image (required)
                      _buildFilePicker(
                        'Personal Image',
                        _createPersonalImage,
                        'personal_image',
                        isDark,
                        required: true,
                        isCreate: true,
                      ),
                      const SizedBox(height: 16),
                      // Optional documents grid
                      GridView.count(
                        crossAxisCount: crossAxisCount,
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        crossAxisSpacing: 12,
                        mainAxisSpacing: 12,
                        childAspectRatio: isSmallScreen ? 2.0 : 1.2,
                        children: [
                          _buildFilePicker('ID Card Front', _createIdcardFront, 'idcard_front', isDark, isCreate: true),
                          _buildFilePicker('ID Card Back', _createIdcardBack, 'idcard_back', isDark, isCreate: true),
                          _buildFilePicker('Residence Front', _createResidenceFront, 'residence_front', isDark, isCreate: true),
                          _buildFilePicker('Residence Back', _createResidenceBack, 'residence_back', isDark, isCreate: true),
                        ],
                      ),
                      const SizedBox(height: 24),
                      // Buttons
                      Row(
                        children: [
                          Expanded(
                            child: ElevatedButton(
                              onPressed: _isCreating ? null : _createStaff,
                              style: ElevatedButton.styleFrom(
                                backgroundColor: StaffColors.purple600,
                                foregroundColor: Colors.white,
                                padding: const EdgeInsets.symmetric(vertical: 16),
                              ),
                              child: _isCreating
                                  ? const SizedBox(
                                      height: 20,
                                      width: 20,
                                      child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                                    )
                                  : const Text('Create Staff'),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: OutlinedButton(
                              onPressed: _isCreating
                                  ? null
                                  : () {
                                      setState(() {
                                        _showCreateModal = false;
                                      });
                                      _resetCreateForm();
                                    },
                              child: const Text('Cancel'),
                            ),
                          ),
                        ],
                      ),
                        ],
                      );
                    },
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTextField(String label, TextEditingController controller, bool isDark, {bool required = false, TextInputType? keyboardType}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: [
        Row(
          children: [
            Flexible(
              child: Text(
                label,
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w500,
                  color: isDark ? Colors.white : Colors.black,
                ),
                overflow: TextOverflow.ellipsis,
              ),
            ),
            if (required)
              const Text(
                ' *',
                style: TextStyle(color: Colors.red),
              ),
          ],
        ),
        const SizedBox(height: 8),
        TextField(
          controller: controller,
          keyboardType: keyboardType,
          style: const TextStyle(fontSize: 16),
          decoration: InputDecoration(
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8),
            ),
            filled: true,
            fillColor: isDark ? AppTheme.navy700 : Colors.grey.shade50,
            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
            isDense: false,
          ),
        ),
      ],
    );
  }

  Widget _buildFilePicker(String label, File? file, String fieldName, bool isDark, {bool required = false, bool isCreate = true}) {
    final validation = fieldName != 'personal_image' ? _documentValidation[fieldName] : null;
    final isValid = validation?['isValid'];
    final isLoading = validation?['loading'] == true;
    final message = validation?['message'];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: [
        Row(
          children: [
            Flexible(
              child: Text(
                label,
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w500,
                  color: isDark ? Colors.white : Colors.black,
                ),
                overflow: TextOverflow.ellipsis,
              ),
            ),
            if (required)
              const Text(
                ' *',
                style: TextStyle(color: Colors.red),
              ),
            if (!required)
              Flexible(
                child: Text(
                  ' (Optional)',
                  style: TextStyle(
                    fontSize: 12,
                    color: isDark ? Colors.grey.shade400 : Colors.grey.shade600,
                  ),
                  overflow: TextOverflow.ellipsis,
                ),
              ),
          ],
        ),
        const SizedBox(height: 8),
        InkWell(
          onTap: () => _pickImage(fieldName, isCreate),
          child: Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              border: Border.all(
                color: isValid == false
                    ? Colors.red
                    : isValid == true
                        ? Colors.green
                        : isDark
                            ? AppTheme.navy600
                            : Colors.grey.shade300,
                width: 2,
              ),
              borderRadius: BorderRadius.circular(8),
              color: isDark ? AppTheme.navy700 : Colors.grey.shade50,
            ),
            child: Row(
              children: [
                Icon(
                  Icons.image,
                  color: isDark ? Colors.grey.shade400 : Colors.grey.shade600,
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    file != null ? file.path.split('/').last : 'Choose file',
                    style: TextStyle(
                      color: isDark ? Colors.grey.shade300 : Colors.grey.shade700,
                    ),
                    overflow: TextOverflow.ellipsis,
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
                  const Icon(Icons.cancel, color: Colors.red, size: 20),
              ],
            ),
          ),
        ),
        if (message != null && !isLoading)
          Padding(
            padding: const EdgeInsets.only(top: 4),
            child: Text(
              message,
              style: TextStyle(
                fontSize: 12,
                color: isValid == true ? Colors.green.shade700 : Colors.red.shade700,
              ),
            ),
          ),
      ],
    );
  }

  Widget _buildViewModal(bool isDark) {
    return Dialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Container(
        constraints: const BoxConstraints(maxWidth: 1600, maxHeight: 800),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Header
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: StaffColors.purple600,
                borderRadius: const BorderRadius.only(
                  topLeft: Radius.circular(16),
                  topRight: Radius.circular(16),
                ),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Text(
                      _selectedStaff != null
                          ? '${_selectedStaff!['first_name'] ?? ''} ${_selectedStaff!['last_name'] ?? ''}'
                          : 'Staff Profile',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                      ),
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close, color: Colors.white),
                    onPressed: () {
                      setState(() {
                        _showViewModal = false;
                        _selectedStaff = null;
                      });
                    },
                  ),
                ],
              ),
            ),
            // Content
            Expanded(
              child: _isLoadingProfile
                  ? const Center(child: CircularProgressIndicator())
                  : _selectedStaff == null
                      ? const Center(child: Text('No profile data available'))
                      : SingleChildScrollView(
                          padding: const EdgeInsets.all(16),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              // Header with Avatar
                              Row(
                                children: [
                                  if (_selectedStaff!['personal_image'] != null)
                                    CircleAvatar(
                                      radius: 48,
                                      backgroundImage: NetworkImage(
                                        _getImageUrl(_selectedStaff!['personal_image']),
                                      ),
                                      onBackgroundImageError: (_, __) {},
                                    )
                                  else
                                    CircleAvatar(
                                      radius: 48,
                                      backgroundColor: StaffColors.purple600,
                                      child: const Icon(Icons.person, size: 48, color: Colors.white),
                                    ),
                                  const SizedBox(width: 16),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          '${_selectedStaff!['first_name'] ?? ''} ${_selectedStaff!['last_name'] ?? ''}',
                                          style: TextStyle(
                                            fontSize: 24,
                                            fontWeight: FontWeight.bold,
                                            color: isDark ? Colors.white : Colors.black,
                                          ),
                                        ),
                                        Text(
                                          _selectedStaff!['duty'] ?? '',
                                          style: TextStyle(
                                            fontSize: 16,
                                            color: isDark ? Colors.grey.shade400 : Colors.grey.shade600,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 24),
                              // Info Grid
                              GridView.count(
                                crossAxisCount: 2,
                                shrinkWrap: true,
                                physics: const NeverScrollableScrollPhysics(),
                                crossAxisSpacing: 12,
                                mainAxisSpacing: 12,
                                childAspectRatio: 3,
                                children: [
                                  _buildInfoCard(Icons.phone, 'Phone', _selectedStaff!['phone_number'] ?? '—', isDark),
                                  _buildInfoCard(Icons.attach_money, 'Salary', _selectedStaff!['salary'] != null ? '\$${_selectedStaff!['salary']}' : '—', isDark),
                                  _buildInfoCard(
                                    Icons.info,
                                    'Status',
                                    _selectedStaff!['is_active'] == true ? 'Active' : 'Inactive',
                                    isDark,
                                    statusColor: _selectedStaff!['is_active'] == true ? Colors.green : Colors.red,
                                  ),
                                ],
                              ),
                              // Documents
                              if (_selectedStaff!['idcard_front'] != null ||
                                  _selectedStaff!['idcard_back'] != null ||
                                  _selectedStaff!['residence_front'] != null ||
                                  _selectedStaff!['residence_back'] != null) ...[
                                const SizedBox(height: 24),
                                Text(
                                  'Documents',
                                  style: TextStyle(
                                    fontSize: 18,
                                    fontWeight: FontWeight.bold,
                                    color: isDark ? Colors.white : Colors.black,
                                  ),
                                ),
                                const SizedBox(height: 12),
                                GridView.count(
                                  crossAxisCount: 2,
                                  shrinkWrap: true,
                                  physics: const NeverScrollableScrollPhysics(),
                                  crossAxisSpacing: 12,
                                  mainAxisSpacing: 12,
                                  childAspectRatio: 1.5,
                                  children: [
                                    if (_selectedStaff!['idcard_front'] != null)
                                      _buildDocumentCard('ID Card Front', _getImageUrl(_selectedStaff!['idcard_front']), isDark),
                                    if (_selectedStaff!['idcard_back'] != null)
                                      _buildDocumentCard('ID Card Back', _getImageUrl(_selectedStaff!['idcard_back']), isDark),
                                    if (_selectedStaff!['residence_front'] != null)
                                      _buildDocumentCard('Residence Front', _getImageUrl(_selectedStaff!['residence_front']), isDark),
                                    if (_selectedStaff!['residence_back'] != null)
                                      _buildDocumentCard('Residence Back', _getImageUrl(_selectedStaff!['residence_back']), isDark),
                                  ],
                                ),
                              ],
                              const SizedBox(height: 24),
                              // Action Buttons
                              Row(
                                children: [
                                  Expanded(
                                    child: ElevatedButton(
                                      onPressed: () {
                                        if (_selectedStaff != null && _selectedStaff!['id'] != null) {
                                          _editStaff(_selectedStaff!['id'] as int);
                                        }
                                      },
                                      style: ElevatedButton.styleFrom(
                                        backgroundColor: StaffColors.purple600,
                                        foregroundColor: Colors.white,
                                        padding: const EdgeInsets.symmetric(vertical: 16),
                                      ),
                                      child: const Text('Edit'),
                                    ),
                                  ),
                                  const SizedBox(width: 12),
                                  Expanded(
                                    child: OutlinedButton(
                                      onPressed: () {
                                        setState(() {
                                          _showViewModal = false;
                                          _selectedStaff = null;
                                        });
                                      },
                                      child: const Text('Close'),
                                    ),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildInfoCard(IconData icon, String label, String value, bool isDark, {Color? statusColor}) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: isDark ? AppTheme.navy700 : Colors.grey.shade50,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        children: [
          Icon(icon, color: statusColor ?? StaffColors.purple600, size: 20),
          const SizedBox(width: 8),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  label,
                  style: TextStyle(
                    fontSize: 12,
                    color: isDark ? Colors.grey.shade400 : Colors.grey.shade600,
                  ),
                ),
                Text(
                  value,
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w500,
                    color: statusColor ?? (isDark ? Colors.white : Colors.black),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDocumentCard(String label, String imageUrl, bool isDark) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w500,
            color: isDark ? Colors.grey.shade400 : Colors.grey.shade600,
          ),
        ),
        const SizedBox(height: 4),
        Expanded(
          child: Container(
            decoration: BoxDecoration(
              color: isDark ? AppTheme.navy700 : Colors.grey.shade100,
              borderRadius: BorderRadius.circular(8),
            ),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(8),
              child: Image.network(
                imageUrl,
                fit: BoxFit.cover,
                errorBuilder: (_, __, ___) => const Icon(Icons.image_not_supported),
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildEditModal(bool isDark) {
    return Dialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Container(
        constraints: const BoxConstraints(maxWidth: 900, maxHeight: 800),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Header
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: StaffColors.purple600,
                borderRadius: const BorderRadius.only(
                  topLeft: Radius.circular(16),
                  topRight: Radius.circular(16),
                ),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Flexible(
                    child: Text(
                      'Edit Staff Member',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                      ),
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close, color: Colors.white),
                    onPressed: _isEditing
                        ? null
                        : () {
                            setState(() {
                              _showEditModal = false;
                              _selectedStaff = null;
                            });
                          },
                  ),
                ],
              ),
            ),
            // Content
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(16),
                child: Form(
                  child: Builder(
                    builder: (context) {
                      final screenWidth = MediaQuery.of(context).size.width;
                      final isSmallScreen = screenWidth < 600;
                      final crossAxisCount = isSmallScreen ? 1 : 2;
                      final aspectRatio = isSmallScreen ? 2.5 : 1.3;
                      
                      return Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // Fields grid
                          GridView.count(
                            crossAxisCount: crossAxisCount,
                            shrinkWrap: true,
                            physics: const NeverScrollableScrollPhysics(),
                            crossAxisSpacing: 12,
                            mainAxisSpacing: 12,
                            childAspectRatio: aspectRatio,
                        children: [
                          _buildTextField('First Name', _editFormControllers['first_name']!, isDark),
                          _buildTextField('Last Name', _editFormControllers['last_name']!, isDark),
                          _buildTextField('Phone Number', _editFormControllers['phone_number']!, isDark),
                          _buildTextField('Duty', _editFormControllers['duty']!, isDark),
                          _buildTextField('Salary (\$)', _editFormControllers['salary']!, isDark, keyboardType: TextInputType.number),
                        ],
                      ),
                      const SizedBox(height: 16),
                      // Personal Image (optional in edit)
                      _buildFilePicker(
                        'Personal Image',
                        _editPersonalImage,
                        'personal_image',
                        isDark,
                        isCreate: false,
                      ),
                      const SizedBox(height: 16),
                      // Optional documents grid
                      GridView.count(
                        crossAxisCount: crossAxisCount,
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        crossAxisSpacing: 12,
                        mainAxisSpacing: 12,
                        childAspectRatio: isSmallScreen ? 2.0 : 1.2,
                        children: [
                          _buildFilePicker('ID Card Front', _editIdcardFront, 'idcard_front', isDark, isCreate: false),
                          _buildFilePicker('ID Card Back', _editIdcardBack, 'idcard_back', isDark, isCreate: false),
                          _buildFilePicker('Residence Front', _editResidenceFront, 'residence_front', isDark, isCreate: false),
                          _buildFilePicker('Residence Back', _editResidenceBack, 'residence_back', isDark, isCreate: false),
                        ],
                      ),
                      const SizedBox(height: 24),
                      // Buttons
                      Row(
                        children: [
                          Expanded(
                            child: ElevatedButton(
                              onPressed: _isEditing ? null : _updateStaff,
                              style: ElevatedButton.styleFrom(
                                backgroundColor: StaffColors.purple600,
                                foregroundColor: Colors.white,
                                padding: const EdgeInsets.symmetric(vertical: 16),
                              ),
                              child: _isEditing
                                  ? const SizedBox(
                                      height: 20,
                                      width: 20,
                                      child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                                    )
                                  : const Text('Update Staff'),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: OutlinedButton(
                              onPressed: _isEditing
                                  ? null
                                  : () {
                                      setState(() {
                                        _showEditModal = false;
                                        _selectedStaff = null;
                                      });
                                    },
                              child: const Text('Cancel'),
                            ),
                          ),
                        ],
                      ),
                        ],
                      );
                    },
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildVerificationWarningModal(bool isDark) {
    return Dialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Container(
        constraints: const BoxConstraints(maxWidth: 500),
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 64,
              height: 64,
              decoration: BoxDecoration(
                color: Colors.amber.shade100,
                shape: BoxShape.circle,
              ),
              child: Icon(
                Icons.warning_amber,
                color: Colors.amber.shade600,
                size: 32,
              ),
            ),
            const SizedBox(height: 16),
            Text(
              'Verification Needed',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: isDark ? Colors.white : Colors.black,
              ),
            ),
            const SizedBox(height: 12),
            Text(
              'Your account must be verified before you can perform this action. Please complete the verification process in Settings.',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 14,
                color: isDark ? Colors.grey.shade300 : Colors.grey.shade700,
              ),
            ),
            const SizedBox(height: 24),
            Row(
              children: [
                Expanded(
                  child: ElevatedButton(
                    onPressed: () {
                      setState(() {
                        _showVerificationWarning = false;
                      });
                      Navigator.pushNamed(context, '/dashboard', arguments: 'settings');
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.primary600,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 16),
                    ),
                    child: const Text('Go to Settings'),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: OutlinedButton(
                    onPressed: () {
                      setState(() {
                        _showVerificationWarning = false;
                      });
                    },
                    child: const Text('OK'),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
