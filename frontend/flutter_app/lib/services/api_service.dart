import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;

class ApiException implements Exception {
  final int? status;
  final String message;
  final bool suggestSignup;
  final Map<String, dynamic>? data;

  ApiException({
    this.status,
    required this.message,
    this.suggestSignup = false,
    this.data,
  });

  @override
  String toString() => message;
}

class ApiService {
  static const String baseUrl = 'http://192.168.0.249:8000';
  
  static final Map<String, String> _defaultHeaders = {
    'Content-Type': 'application/json',
  };

  static Map<String, dynamic> _parseResponse(String responseBody) {
    try {
      return responseBody.isNotEmpty ? json.decode(responseBody) : {};
    } catch (e) {
      return {'raw': responseBody};
    }
  }

  static ApiException _buildError(int status, Map<String, dynamic> data) {
    const fallbackMessage = 'Unable to complete the request. Please try again.';
    
    final apiMessage = data['message'] ??
        data['errors']?['detail'] ??
        data['errors']?['email']?[0] ??
        data['errors']?['otp_code'] ??
        data['errors']?['non_field_errors']?[0] ??
        data['detail'] ??
        data['error'];

    final message = apiMessage?.toString() ?? fallbackMessage;
    
    final shouldSuggestSignup = RegExp(
      r'not\s+registered|not\s+found|does\s+not\s+exist|no\s+account',
      caseSensitive: false,
    ).hasMatch(message);

    return ApiException(
      status: status,
      message: message,
      suggestSignup: shouldSuggestSignup,
      data: data,
    );
  }

  /// Request OTP for login
  static Future<Map<String, dynamic>> requestOtp(String email) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/registration/login/'),
        headers: _defaultHeaders,
        body: json.encode({'email': email}),
      );

      final data = _parseResponse(response.body);

      if (response.statusCode != 200 && response.statusCode != 201 || data['success'] == false) {
        throw _buildError(response.statusCode, data);
      }

      return data;
    } catch (e) {
      if (e is ApiException) rethrow;
      throw ApiException(
        message: 'Network error. Please check your connection and try again.',
      );
    }
  }

  /// Sign up new institution
  static Future<Map<String, dynamic>> signup(Map<String, dynamic> payload) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/registration/signup/'),
        headers: _defaultHeaders,
        body: json.encode(payload),
      );

      final data = _parseResponse(response.body);

      if (response.statusCode != 200 && response.statusCode != 201 || data['success'] == false) {
        throw _buildError(response.statusCode, data);
      }

      return data;
    } catch (e) {
      if (e is ApiException) rethrow;
      throw ApiException(
        message: 'Network error. Please check your connection and try again.',
      );
    }
  }

  /// Verify OTP code
  static Future<Map<String, dynamic>> verifyOtp({
    required String email,
    required String otpCode,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/registration/otp/'),
        headers: _defaultHeaders,
        body: json.encode({
          'email': email,
          'otp_code': otpCode,
        }),
      );

      final data = _parseResponse(response.body);

      if (response.statusCode != 200 && response.statusCode != 201 || data['success'] == false) {
        throw _buildError(response.statusCode, data);
      }

      return data;
    } catch (e) {
      if (e is ApiException) rethrow;
      throw ApiException(
        message: 'Network error. Please check your connection and try again.',
      );
    }
  }

  /// Refresh access token
  static Future<Map<String, dynamic>> refreshAccessToken(String refreshToken) async {
    final endpoints = ['/refresh/', '/token/refresh/', '/registration/refresh/'];
    ApiException? lastError;

    for (final endpoint in endpoints) {
      try {
        final response = await http.post(
          Uri.parse('$baseUrl$endpoint'),
          headers: _defaultHeaders,
          body: json.encode({'refresh': refreshToken}),
        );

        final data = _parseResponse(response.body);

        if (response.statusCode == 200 && data['access'] != null) {
          return {
            'access': data['access'],
            'refresh': data['refresh'] ?? refreshToken,
          };
        }

        lastError = _buildError(response.statusCode, data);
      } catch (e) {
        if (e is ApiException) {
          lastError = e;
        } else {
          lastError = ApiException(
            message: 'Network error during token refresh.',
          );
        }
      }
    }

    throw lastError ?? ApiException(
      status: 400,
      message: 'Unable to refresh session.',
    );
  }

  /// Make authenticated GET request
  static Future<Map<String, dynamic>> getProtected({
    required String endpoint,
    required String accessToken,
    String? refreshToken,
    Function(Map<String, dynamic>)? onTokenRefreshed,
    Function()? onSessionExpired,
  }) async {
    try {
      var response = await http.get(
        Uri.parse('$baseUrl$endpoint'),
        headers: {
          ..._defaultHeaders,
          'Authorization': 'Bearer $accessToken',
        },
      );

      // Handle token refresh on 401
      if (response.statusCode == 401 && refreshToken != null && onTokenRefreshed != null) {
        try {
          final refreshed = await refreshAccessToken(refreshToken);
          onTokenRefreshed(refreshed);
          
          // Retry request with new token
          response = await http.get(
            Uri.parse('$baseUrl$endpoint'),
            headers: {
              ..._defaultHeaders,
              'Authorization': 'Bearer ${refreshed['access']}',
            },
          );
        } catch (refreshError) {
          if (onSessionExpired != null) {
            onSessionExpired();
          }
          throw ApiException(
            status: 401,
            message: 'Session expired. Please log in again.',
          );
        }
      }

      final data = _parseResponse(response.body);

      if (response.statusCode != 200) {
        throw _buildError(response.statusCode, data);
      }

      return data;
    } catch (e) {
      if (e is ApiException) rethrow;
      throw ApiException(
        message: 'Network error. Please check your connection and try again.',
      );
    }
  }

  /// Get dashboard statistics
  static Future<Map<String, dynamic>> getDashboardStats({
    required String accessToken,
    String? refreshToken,
    Function(Map<String, dynamic>)? onTokenRefreshed,
    Function()? onSessionExpired,
  }) async {
    final endpoints = [
      {'key': 'totalStudents', 'path': '/institution/total-students/'},
      {'key': 'totalLecturers', 'path': '/institution/total-lecturers/'},
      {'key': 'totalStaff', 'path': '/institution/total-staff/'},
      {'key': 'activeStudents', 'path': '/institution/active-students/'},
      {'key': 'activeLecturers', 'path': '/institution/active-lecturers/'},
      {'key': 'activeStaff', 'path': '/institution/active-staff/'},
    ];

    final results = <String, dynamic>{};

    for (final endpoint in endpoints) {
      try {
        final data = await getProtected(
          endpoint: endpoint['path'] as String,
          accessToken: accessToken,
          refreshToken: refreshToken,
          onTokenRefreshed: onTokenRefreshed,
          onSessionExpired: onSessionExpired,
        );
        results[endpoint['key'] as String] = data;
      } catch (e) {
        results[endpoint['key'] as String] = {
          'error': e is ApiException ? e.message : 'Unable to fetch this statistic.',
        };
      }
    }

    return results;
  }

  /// Get schedule data
  static Future<List<dynamic>> getSchedule({
    required String accessToken,
    String? refreshToken,
    Function(Map<String, dynamic>)? onTokenRefreshed,
    Function()? onSessionExpired,
  }) async {
    final data = await getProtected(
      endpoint: '/institution/schedule/',
      accessToken: accessToken,
      refreshToken: refreshToken,
      onTokenRefreshed: onTokenRefreshed,
      onSessionExpired: onSessionExpired,
    );

    if (data['schedule'] == null) {
      throw ApiException(
        status: 500,
        message: 'Schedule data missing from response.',
      );
    }

    return data['schedule'] as List<dynamic>;
  }

  /// Check verification status

  /// Verify institution with documents
  static Future<Map<String, dynamic>> verifyInstitution({
    required String accessToken,
    String? refreshToken,
    required Map<String, dynamic> payload,
    Function(Map<String, dynamic>)? onTokenRefreshed,
  }) async {
    try {
      final request = http.MultipartRequest(
        'PUT',
        Uri.parse('$baseUrl/institution/institution-verify/'),
      );

      request.headers['Authorization'] = 'Bearer $accessToken';

      // Add text fields
      if (payload['title'] != null) request.fields['title'] = payload['title'];
      if (payload['location'] != null) request.fields['location'] = payload['location'];
      if (payload['phone_number'] != null) request.fields['phone_number'] = payload['phone_number'];
      if (payload['about'] != null) request.fields['about'] = payload['about'];

      // Add file fields (if needed in future)
      // Example: request.files.add(await http.MultipartFile.fromPath('profile_image', filePath));

      var response = await request.send();
      final responseBody = await response.stream.bytesToString();
      final data = _parseResponse(responseBody);

      // Handle token refresh on 401
      if (response.statusCode == 401 && refreshToken != null && onTokenRefreshed != null) {
        try {
          final refreshed = await refreshAccessToken(refreshToken);
          onTokenRefreshed(refreshed);

          // Retry request with new token
          final retryRequest = http.MultipartRequest(
            'PUT',
            Uri.parse('$baseUrl/institution/institution-verify/'),
          );
          retryRequest.headers['Authorization'] = 'Bearer ${refreshed['access']}';
          retryRequest.fields.addAll(request.fields);

          response = await retryRequest.send();
          final retryBody = await response.stream.bytesToString();
          final retryData = _parseResponse(retryBody);

          if (response.statusCode != 200) {
            throw _buildError(response.statusCode, retryData);
          }

          return retryData;
        } catch (refreshError) {
          throw ApiException(
            status: 401,
            message: 'Session expired. Please log in again.',
          );
        }
      }

      if (response.statusCode != 200) {
        throw _buildError(response.statusCode, data);
      }

      return data;
    } catch (e) {
      if (e is ApiException) rethrow;
      throw ApiException(
        message: 'Network error. Please check your connection and try again.',
      );
    }
  }

  /// Edit institution profile
  static Future<Map<String, dynamic>> editInstitutionProfile({
    required String accessToken,
    String? refreshToken,
    required Map<String, dynamic> payload,
    Function(Map<String, dynamic>)? onTokenRefreshed,
  }) async {
    try {
      final request = http.MultipartRequest(
        'PUT',
        Uri.parse('$baseUrl/institution/edit-profile/'),
      );

      request.headers['Authorization'] = 'Bearer $accessToken';

      // Add text fields
      if (payload['username'] != null) request.fields['username'] = payload['username'];
      if (payload['title'] != null) request.fields['title'] = payload['title'];
      if (payload['location'] != null) request.fields['location'] = payload['location'];
      if (payload['phone_number'] != null) request.fields['phone_number'] = payload['phone_number'];
      if (payload['about'] != null) request.fields['about'] = payload['about'];

      var response = await request.send();
      final responseBody = await response.stream.bytesToString();
      final data = _parseResponse(responseBody);

      // Handle token refresh on 401
      if (response.statusCode == 401 && refreshToken != null && onTokenRefreshed != null) {
        try {
          final refreshed = await refreshAccessToken(refreshToken);
          onTokenRefreshed(refreshed);

          // Retry request with new token
          final retryRequest = http.MultipartRequest(
            'PUT',
            Uri.parse('$baseUrl/institution/edit-profile/'),
          );
          retryRequest.headers['Authorization'] = 'Bearer ${refreshed['access']}';
          retryRequest.fields.addAll(request.fields);

          response = await retryRequest.send();
          final retryBody = await response.stream.bytesToString();
          final retryData = _parseResponse(retryBody);

          if (response.statusCode != 200) {
            throw _buildError(response.statusCode, retryData);
          }

          return retryData;
        } catch (refreshError) {
          throw ApiException(
            status: 401,
            message: 'Session expired. Please log in again.',
          );
        }
      }

      if (response.statusCode != 200) {
        throw _buildError(response.statusCode, data);
      }

      return data;
    } catch (e) {
      if (e is ApiException) rethrow;
      throw ApiException(
        message: 'Network error. Please check your connection and try again.',
      );
    }
  }

  /// Get feed data (posts, courses, jobs)
  static Future<Map<String, dynamic>> getFeed({
    String? accessToken,
    String? refreshToken,
    Function(Map<String, dynamic>)? onTokenRefreshed,
    Function()? onSessionExpired,
  }) async {
    try {
      final headers = <String, String>{..._defaultHeaders};
      if (accessToken != null && accessToken.isNotEmpty) {
        headers['Authorization'] = 'Bearer $accessToken';
      }

      var response = await http.get(
        Uri.parse('$baseUrl/home/feed/'),
        headers: headers,
      );

      // Handle token refresh on 401 (only if token was provided)
      if (response.statusCode == 401 && accessToken != null && refreshToken != null && onTokenRefreshed != null) {
        try {
          final refreshed = await refreshAccessToken(refreshToken);
          onTokenRefreshed(refreshed);
          
          // Retry request with new token
          headers['Authorization'] = 'Bearer ${refreshed['access']}';
          response = await http.get(
            Uri.parse('$baseUrl/home/feed/'),
            headers: headers,
          );
        } catch (refreshError) {
          if (onSessionExpired != null) {
            onSessionExpired();
          }
          throw ApiException(
            status: 401,
            message: 'Session expired. Please log in again.',
          );
        }
      }

      final data = _parseResponse(response.body);

      if (response.statusCode != 200) {
        throw _buildError(response.statusCode, data);
      }

      return data;
    } catch (e) {
      if (e is ApiException) rethrow;
      throw ApiException(
        message: 'Network error. Please check your connection and try again.',
      );
    }
  }

  /// Check verification status
  static Future<Map<String, dynamic>> checkVerificationStatus(
    String email, {
    required String accessToken,
    String? refreshToken,
    Function(Map<String, dynamic>)? onTokenRefreshed,
    Function()? onSessionExpired,
  }) async {
    try {
      var response = await http.get(
        Uri.parse('$baseUrl/registration/is-verified/?email=${Uri.encodeComponent(email)}'),
        headers: {
          ..._defaultHeaders,
          'Authorization': 'Bearer $accessToken',
        },
      );

      if (response.statusCode == 401 && refreshToken != null && onTokenRefreshed != null) {
        try {
          final refreshed = await refreshAccessToken(refreshToken);
          onTokenRefreshed(refreshed);
          response = await http.get(
            Uri.parse('$baseUrl/registration/is-verified/?email=${Uri.encodeComponent(email)}'),
            headers: {
              ..._defaultHeaders,
              'Authorization': 'Bearer ${refreshed['access']}',
            },
          );
        } catch (refreshError) {
          if (onSessionExpired != null) {
            onSessionExpired();
          }
          throw ApiException(
            status: 401,
            message: 'Session expired. Please log in again.',
          );
        }
      }

      final data = _parseResponse(response.body);

      if (response.statusCode != 200) {
        throw _buildError(response.statusCode, data);
      }

      return data;
    } catch (e) {
      if (e is ApiException) rethrow;
      throw ApiException(
        message: 'Network error. Please check your connection and try again.',
      );
    }
  }

  /// Get institution profile
  static Future<Map<String, dynamic>> getInstitutionProfile({
    required String accessToken,
    String? refreshToken,
    Function(Map<String, dynamic>)? onTokenRefreshed,
    Function()? onSessionExpired,
  }) async {
    return getProtected(
      endpoint: '/institution/profile/self/',
      accessToken: accessToken,
      refreshToken: refreshToken,
      onTokenRefreshed: onTokenRefreshed,
      onSessionExpired: onSessionExpired,
    );
  }

  /// Get institution students list (JWT required)
  static Future<Map<String, dynamic>> getInstitutionStudentsList({
    required String accessToken,
    int page = 1,
    String? search,
    String? status,
    String? refreshToken,
    Function(Map<String, dynamic>)? onTokenRefreshed,
    Function()? onSessionExpired,
  }) async {
    final params = <String, String>{'page': page.toString()};
    if (search != null && search.isNotEmpty) {
      params['search'] = search;
    }
    if (status != null && status != 'all') {
      params['active'] = status == 'Active' ? 'true' : 'false';
    }

    final endpoint = '/institution/students-list/?${Uri(queryParameters: params).query}';

    return getProtected(
      endpoint: endpoint,
      accessToken: accessToken,
      refreshToken: refreshToken,
      onTokenRefreshed: onTokenRefreshed,
      onSessionExpired: onSessionExpired,
    );
  }

  /// Get institution student profile (JWT required)
  static Future<Map<String, dynamic>> getInstitutionStudentProfile({
    required String accessToken,
    required int studentId,
    String? refreshToken,
    Function(Map<String, dynamic>)? onTokenRefreshed,
    Function()? onSessionExpired,
  }) async {
    return getProtected(
      endpoint: '/institution/student/$studentId/',
      accessToken: accessToken,
      refreshToken: refreshToken,
      onTokenRefreshed: onTokenRefreshed,
      onSessionExpired: onSessionExpired,
    );
  }

  /// Get institution lecturers list (JWT required)
  static Future<Map<String, dynamic>> getInstitutionLecturersList({
    required String accessToken,
    int page = 1,
    String? refreshToken,
    Function(Map<String, dynamic>)? onTokenRefreshed,
    Function()? onSessionExpired,
  }) async {
    final endpoint = '/institution/lecturers-list/?page=$page';

    return getProtected(
      endpoint: endpoint,
      accessToken: accessToken,
      refreshToken: refreshToken,
      onTokenRefreshed: onTokenRefreshed,
      onSessionExpired: onSessionExpired,
    );
  }

  /// Get institution lecturer profile (JWT required)
  static Future<Map<String, dynamic>> getInstitutionLecturerProfile({
    required String accessToken,
    required int lecturerId,
    String? refreshToken,
    Function(Map<String, dynamic>)? onTokenRefreshed,
    Function()? onSessionExpired,
  }) async {
    return getProtected(
      endpoint: '/institution/lecturer/$lecturerId/',
      accessToken: accessToken,
      refreshToken: refreshToken,
      onTokenRefreshed: onTokenRefreshed,
      onSessionExpired: onSessionExpired,
    );
  }

  /// Get institution staff list (JWT required)
  static Future<Map<String, dynamic>> getInstitutionStaffList({
    required String accessToken,
    int page = 1,
    String? refreshToken,
    Function(Map<String, dynamic>)? onTokenRefreshed,
    Function()? onSessionExpired,
  }) async {
    final endpoint = '/institution/staff-list/?page=$page';

    return getProtected(
      endpoint: endpoint,
      accessToken: accessToken,
      refreshToken: refreshToken,
      onTokenRefreshed: onTokenRefreshed,
      onSessionExpired: onSessionExpired,
    );
  }

  /// Create staff member (JWT required)
  static Future<Map<String, dynamic>> createStaff({
    required String accessToken,
    required Map<String, dynamic> payload,
    String? refreshToken,
    Function(Map<String, dynamic>)? onTokenRefreshed,
    Function()? onSessionExpired,
  }) async {
    try {
      final request = http.MultipartRequest(
        'POST',
        Uri.parse('$baseUrl/institution/staff/create/'),
      );

      request.headers['Authorization'] = 'Bearer $accessToken';

      // Add text fields
      if (payload['first_name'] != null) request.fields['first_name'] = payload['first_name'].toString();
      if (payload['last_name'] != null) request.fields['last_name'] = payload['last_name'].toString();
      if (payload['phone_number'] != null) request.fields['phone_number'] = payload['phone_number'].toString();
      if (payload['duty'] != null) request.fields['duty'] = payload['duty'].toString();
      if (payload['salary'] != null) request.fields['salary'] = payload['salary'].toString();

      // Add files
      if (payload['personal_image'] != null) {
        request.files.add(await http.MultipartFile.fromPath('personal_image', payload['personal_image'].path));
      }
      if (payload['idcard_front'] != null) {
        request.files.add(await http.MultipartFile.fromPath('idcard_front', payload['idcard_front'].path));
      }
      if (payload['idcard_back'] != null) {
        request.files.add(await http.MultipartFile.fromPath('idcard_back', payload['idcard_back'].path));
      }
      if (payload['residence_front'] != null) {
        request.files.add(await http.MultipartFile.fromPath('residence_front', payload['residence_front'].path));
      }
      if (payload['residence_back'] != null) {
        request.files.add(await http.MultipartFile.fromPath('residence_back', payload['residence_back'].path));
      }

      var response = await request.send();
      final responseBody = await response.stream.bytesToString();
      final data = _parseResponse(responseBody);

      // Handle token refresh on 401
      if (response.statusCode == 401 && refreshToken != null && onTokenRefreshed != null) {
        try {
          final refreshed = await refreshAccessToken(refreshToken);
          onTokenRefreshed(refreshed);

          // Retry request with new token
          final retryRequest = http.MultipartRequest(
            'POST',
            Uri.parse('$baseUrl/institution/staff/create/'),
          );
          retryRequest.headers['Authorization'] = 'Bearer ${refreshed['access']}';
          retryRequest.fields.addAll(request.fields);
          retryRequest.files.addAll(request.files);

          response = await retryRequest.send();
          final retryBody = await response.stream.bytesToString();
          final retryData = _parseResponse(retryBody);

          if (response.statusCode != 200 && response.statusCode != 201) {
            throw _buildError(response.statusCode, retryData);
          }

          return retryData;
        } catch (refreshError) {
          if (onSessionExpired != null) {
            onSessionExpired();
          }
          throw ApiException(
            status: 401,
            message: 'Session expired. Please log in again.',
          );
        }
      }

      if (response.statusCode != 200 && response.statusCode != 201) {
        throw _buildError(response.statusCode, data);
      }

      return data;
    } catch (e) {
      if (e is ApiException) rethrow;
      throw ApiException(
        message: 'Network error. Please check your connection and try again.',
      );
    }
  }

  /// Get staff details (JWT required)
  static Future<Map<String, dynamic>> getStaffDetails({
    required String accessToken,
    required int staffId,
    String? refreshToken,
    Function(Map<String, dynamic>)? onTokenRefreshed,
    Function()? onSessionExpired,
  }) async {
    return getProtected(
      endpoint: '/institution/staff/$staffId/',
      accessToken: accessToken,
      refreshToken: refreshToken,
      onTokenRefreshed: onTokenRefreshed,
      onSessionExpired: onSessionExpired,
    );
  }

  /// Edit staff member (JWT required)
  static Future<Map<String, dynamic>> editStaff({
    required String accessToken,
    required int staffId,
    required Map<String, dynamic> payload,
    String? refreshToken,
    Function(Map<String, dynamic>)? onTokenRefreshed,
    Function()? onSessionExpired,
  }) async {
    try {
      final request = http.MultipartRequest(
        'PUT',
        Uri.parse('$baseUrl/institution/staff/$staffId/edit/'),
      );

      request.headers['Authorization'] = 'Bearer $accessToken';

      // Add text fields (only if provided)
      if (payload['first_name'] != null) request.fields['first_name'] = payload['first_name'].toString();
      if (payload['last_name'] != null) request.fields['last_name'] = payload['last_name'].toString();
      if (payload['phone_number'] != null) request.fields['phone_number'] = payload['phone_number'].toString();
      if (payload['duty'] != null) request.fields['duty'] = payload['duty'].toString();
      if (payload['salary'] != null) request.fields['salary'] = payload['salary'].toString();

      // Add files (only if provided)
      if (payload['personal_image'] != null) {
        request.files.add(await http.MultipartFile.fromPath('personal_image', payload['personal_image'].path));
      }
      if (payload['idcard_front'] != null) {
        request.files.add(await http.MultipartFile.fromPath('idcard_front', payload['idcard_front'].path));
      }
      if (payload['idcard_back'] != null) {
        request.files.add(await http.MultipartFile.fromPath('idcard_back', payload['idcard_back'].path));
      }
      if (payload['residence_front'] != null) {
        request.files.add(await http.MultipartFile.fromPath('residence_front', payload['residence_front'].path));
      }
      if (payload['residence_back'] != null) {
        request.files.add(await http.MultipartFile.fromPath('residence_back', payload['residence_back'].path));
      }

      var response = await request.send();
      final responseBody = await response.stream.bytesToString();
      final data = _parseResponse(responseBody);

      // Handle token refresh on 401
      if (response.statusCode == 401 && refreshToken != null && onTokenRefreshed != null) {
        try {
          final refreshed = await refreshAccessToken(refreshToken);
          onTokenRefreshed(refreshed);

          // Retry request with new token
          final retryRequest = http.MultipartRequest(
            'PUT',
            Uri.parse('$baseUrl/institution/staff/$staffId/edit/'),
          );
          retryRequest.headers['Authorization'] = 'Bearer ${refreshed['access']}';
          retryRequest.fields.addAll(request.fields);
          retryRequest.files.addAll(request.files);

          response = await retryRequest.send();
          final retryBody = await response.stream.bytesToString();
          final retryData = _parseResponse(retryBody);

          if (response.statusCode != 200) {
            throw _buildError(response.statusCode, retryData);
          }

          return retryData;
        } catch (refreshError) {
          if (onSessionExpired != null) {
            onSessionExpired();
          }
          throw ApiException(
            status: 401,
            message: 'Session expired. Please log in again.',
          );
        }
      }

      if (response.statusCode != 200) {
        throw _buildError(response.statusCode, data);
      }

      return data;
    } catch (e) {
      if (e is ApiException) rethrow;
      throw ApiException(
        message: 'Network error. Please check your connection and try again.',
      );
    }
  }

  /// Delete staff member (JWT required)
  static Future<Map<String, dynamic>> deleteStaff({
    required String accessToken,
    required int staffId,
    String? refreshToken,
    Function(Map<String, dynamic>)? onTokenRefreshed,
    Function()? onSessionExpired,
  }) async {
    try {
      var response = await http.delete(
        Uri.parse('$baseUrl/institution/staff/$staffId/delete/'),
        headers: {
          ..._defaultHeaders,
          'Authorization': 'Bearer $accessToken',
        },
      );

      // Handle token refresh on 401
      if (response.statusCode == 401 && refreshToken != null && onTokenRefreshed != null) {
        try {
          final refreshed = await refreshAccessToken(refreshToken);
          onTokenRefreshed(refreshed);

          // Retry request with new token
          response = await http.delete(
            Uri.parse('$baseUrl/institution/staff/$staffId/delete/'),
            headers: {
              ..._defaultHeaders,
              'Authorization': 'Bearer ${refreshed['access']}',
            },
          );
        } catch (refreshError) {
          if (onSessionExpired != null) {
            onSessionExpired();
          }
          throw ApiException(
            status: 401,
            message: 'Session expired. Please log in again.',
          );
        }
      }

      final data = _parseResponse(response.body);

      if (response.statusCode != 200 && response.statusCode != 204) {
        throw _buildError(response.statusCode, data);
      }

      return data;
    } catch (e) {
      if (e is ApiException) rethrow;
      throw ApiException(
        message: 'Network error. Please check your connection and try again.',
      );
    }
  }

  /// Check document using AI (JWT required)
  static Future<Map<String, dynamic>> checkDocument({
    required String accessToken,
    required File file,
    String? refreshToken,
    Function(Map<String, dynamic>)? onTokenRefreshed,
    Function()? onSessionExpired,
  }) async {
    try {
      final request = http.MultipartRequest(
        'POST',
        Uri.parse('$baseUrl/ai/doc/'),
      );

      request.headers['Authorization'] = 'Bearer $accessToken';
      request.files.add(await http.MultipartFile.fromPath('file', file.path));

      var response = await request.send();
      final responseBody = await response.stream.bytesToString();
      final data = _parseResponse(responseBody);

      // Handle token refresh on 401
      if (response.statusCode == 401 && refreshToken != null && onTokenRefreshed != null) {
        try {
          final refreshed = await refreshAccessToken(refreshToken);
          onTokenRefreshed(refreshed);

          // Retry request with new token
          final retryRequest = http.MultipartRequest(
            'POST',
            Uri.parse('$baseUrl/ai/doc/'),
          );
          retryRequest.headers['Authorization'] = 'Bearer ${refreshed['access']}';
          retryRequest.files.add(await http.MultipartFile.fromPath('file', file.path));

          response = await retryRequest.send();
          final retryBody = await response.stream.bytesToString();
          final retryData = _parseResponse(retryBody);

          if (response.statusCode != 200) {
            throw _buildError(response.statusCode, retryData);
          }

          return retryData;
        } catch (refreshError) {
          if (onSessionExpired != null) {
            onSessionExpired();
          }
          throw ApiException(
            status: 401,
            message: 'Session expired. Please log in again.',
          );
        }
      }

      if (response.statusCode != 200) {
        throw _buildError(response.statusCode, data);
      }

      return data;
    } catch (e) {
      if (e is ApiException) rethrow;
      throw ApiException(
        message: 'Network error. Please check your connection and try again.',
      );
    }
  }
}

