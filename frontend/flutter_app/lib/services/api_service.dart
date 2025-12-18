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
  static const String baseUrl = 'https://projecteastapi.ddns.net';
  
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
  static Future<Map<String, dynamic>> getSchedule({
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

    return data['schedule'] as Map<String, dynamic>;
  }

  /// Check verification status

  /// Verify institution with documents
  static Future<Map<String, dynamic>> verifyInstitution({
    required String accessToken,
    String? refreshToken,
    required Map<String, dynamic> payload,
    Function(Map<String, dynamic>)? onTokenRefreshed,
    Function()? onSessionExpired,
  }) async {
    try {
      final request = http.MultipartRequest(
        'PUT',
        Uri.parse('$baseUrl/institution/verify/'),
      );

      request.headers['Authorization'] = 'Bearer $accessToken';

      // Add text fields
      if (payload['title'] != null) request.fields['title'] = payload['title'].toString();
      if (payload['location'] != null) request.fields['location'] = payload['location'].toString();
      if (payload['phone_number'] != null) request.fields['phone_number'] = payload['phone_number'].toString();
      if (payload['about'] != null) request.fields['about'] = payload['about'].toString();
      if (payload['up_time'] != null) request.fields['up_time'] = payload['up_time'].toString();
      if (payload['up_days'] != null) request.fields['up_days'] = payload['up_days'].toString();

      // Add file fields
      if (payload['profile_image'] != null && payload['profile_image'] is File) {
        request.files.add(await http.MultipartFile.fromPath('profile_image', (payload['profile_image'] as File).path));
      }
      if (payload['idcard_front'] != null && payload['idcard_front'] is File) {
        request.files.add(await http.MultipartFile.fromPath('idcard_front', (payload['idcard_front'] as File).path));
      }
      if (payload['idcard_back'] != null && payload['idcard_back'] is File) {
        request.files.add(await http.MultipartFile.fromPath('idcard_back', (payload['idcard_back'] as File).path));
      }
      if (payload['residence_front'] != null && payload['residence_front'] is File) {
        request.files.add(await http.MultipartFile.fromPath('residence_front', (payload['residence_front'] as File).path));
      }
      if (payload['residence_back'] != null && payload['residence_back'] is File) {
        request.files.add(await http.MultipartFile.fromPath('residence_back', (payload['residence_back'] as File).path));
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
            Uri.parse('$baseUrl/institution/verify/'),
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

  /// Edit institution profile
  static Future<Map<String, dynamic>> editInstitutionProfile({
    required String accessToken,
    String? refreshToken,
    required Map<String, dynamic> payload,
    Function(Map<String, dynamic>)? onTokenRefreshed,
    Function()? onSessionExpired,
  }) async {
    try {
      final request = http.MultipartRequest(
        'PUT',
        Uri.parse('$baseUrl/institution/edit-profile/'),
      );

      request.headers['Authorization'] = 'Bearer $accessToken';

      // Add text fields
      if (payload['username'] != null) request.fields['username'] = payload['username'].toString();
      if (payload['first_name'] != null) request.fields['first_name'] = payload['first_name'].toString();
      if (payload['last_name'] != null) request.fields['last_name'] = payload['last_name'].toString();
      if (payload['title'] != null) request.fields['title'] = payload['title'].toString();
      if (payload['location'] != null) request.fields['location'] = payload['location'].toString();
      if (payload['phone_number'] != null) request.fields['phone_number'] = payload['phone_number'].toString();
      if (payload['about'] != null) request.fields['about'] = payload['about'].toString();
      if (payload['up_time'] != null) request.fields['up_time'] = payload['up_time'].toString();
      if (payload['up_days'] != null) request.fields['up_days'] = payload['up_days'].toString();

      // Add file fields (only if provided)
      if (payload['profile_image'] != null && payload['profile_image'] is File) {
        request.files.add(await http.MultipartFile.fromPath('profile_image', (payload['profile_image'] as File).path));
      }
      if (payload['idcard_front'] != null && payload['idcard_front'] is File) {
        request.files.add(await http.MultipartFile.fromPath('idcard_front', (payload['idcard_front'] as File).path));
      }
      if (payload['idcard_back'] != null && payload['idcard_back'] is File) {
        request.files.add(await http.MultipartFile.fromPath('idcard_back', (payload['idcard_back'] as File).path));
      }
      if (payload['residence_front'] != null && payload['residence_front'] is File) {
        request.files.add(await http.MultipartFile.fromPath('residence_front', (payload['residence_front'] as File).path));
      }
      if (payload['residence_back'] != null && payload['residence_back'] is File) {
        request.files.add(await http.MultipartFile.fromPath('residence_back', (payload['residence_back'] as File).path));
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
            Uri.parse('$baseUrl/institution/edit-profile/'),
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

  /// Edit lecturer profile
  static Future<Map<String, dynamic>> editLecturerProfile({
    required String accessToken,
    String? refreshToken,
    required Map<String, dynamic> payload,
    Function(Map<String, dynamic>)? onTokenRefreshed,
    Function()? onSessionExpired,
  }) async {
    try {
      final request = http.MultipartRequest(
        'PUT',
        Uri.parse('$baseUrl/lecturer/profile/edit/'),
      );

      request.headers['Authorization'] = 'Bearer $accessToken';

      // Add text fields (no username field - users can't change username)
      if (payload['first_name'] != null) request.fields['first_name'] = payload['first_name'].toString();
      if (payload['last_name'] != null) request.fields['last_name'] = payload['last_name'].toString();
      if (payload['city'] != null) request.fields['city'] = payload['city'].toString();
      if (payload['phone_number'] != null) request.fields['phone_number'] = payload['phone_number'].toString();
      if (payload['about'] != null) request.fields['about'] = payload['about'].toString();
      if (payload['academic_achievement'] != null) request.fields['academic_achievement'] = payload['academic_achievement'].toString();
      if (payload['specialty'] != null) request.fields['specialty'] = payload['specialty'].toString();
      if (payload['skills'] != null) request.fields['skills'] = payload['skills'].toString();
      if (payload['experience'] != null) request.fields['experience'] = payload['experience'].toString();
      if (payload['free_time'] != null) request.fields['free_time'] = payload['free_time'].toString();

      // Add file fields (only if provided)
      if (payload['profile_image'] != null && payload['profile_image'] is File) {
        request.files.add(await http.MultipartFile.fromPath('profile_image', (payload['profile_image'] as File).path));
      }
      if (payload['idcard_front'] != null && payload['idcard_front'] is File) {
        request.files.add(await http.MultipartFile.fromPath('idcard_front', (payload['idcard_front'] as File).path));
      }
      if (payload['idcard_back'] != null && payload['idcard_back'] is File) {
        request.files.add(await http.MultipartFile.fromPath('idcard_back', (payload['idcard_back'] as File).path));
      }
      if (payload['residence_front'] != null && payload['residence_front'] is File) {
        request.files.add(await http.MultipartFile.fromPath('residence_front', (payload['residence_front'] as File).path));
      }
      if (payload['residence_back'] != null && payload['residence_back'] is File) {
        request.files.add(await http.MultipartFile.fromPath('residence_back', (payload['residence_back'] as File).path));
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
            Uri.parse('$baseUrl/lecturer/profile/edit/'),
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

  /// Edit student profile
  static Future<Map<String, dynamic>> editStudentProfile({
    required String accessToken,
    String? refreshToken,
    required Map<String, dynamic> payload,
    Function(Map<String, dynamic>)? onTokenRefreshed,
    Function()? onSessionExpired,
  }) async {
    try {
      final request = http.MultipartRequest(
        'PUT',
        Uri.parse('$baseUrl/student/profile/edit/'),
      );

      request.headers['Authorization'] = 'Bearer $accessToken';

      // Add text fields (no username field - users can't change username)
      if (payload['first_name'] != null) request.fields['first_name'] = payload['first_name'].toString();
      if (payload['last_name'] != null) request.fields['last_name'] = payload['last_name'].toString();
      if (payload['city'] != null) request.fields['city'] = payload['city'].toString();
      if (payload['phone_number'] != null) request.fields['phone_number'] = payload['phone_number'].toString();
      if (payload['about'] != null) request.fields['about'] = payload['about'].toString();
      if (payload['studying_level'] != null) request.fields['studying_level'] = payload['studying_level'].toString();

      // Add file fields (only if provided)
      if (payload['profile_image'] != null && payload['profile_image'] is File) {
        request.files.add(await http.MultipartFile.fromPath('profile_image', (payload['profile_image'] as File).path));
      }
      if (payload['idcard_front'] != null && payload['idcard_front'] is File) {
        request.files.add(await http.MultipartFile.fromPath('idcard_front', (payload['idcard_front'] as File).path));
      }
      if (payload['idcard_back'] != null && payload['idcard_back'] is File) {
        request.files.add(await http.MultipartFile.fromPath('idcard_back', (payload['idcard_back'] as File).path));
      }
      if (payload['residence_front'] != null && payload['residence_front'] is File) {
        request.files.add(await http.MultipartFile.fromPath('residence_front', (payload['residence_front'] as File).path));
      }
      if (payload['residence_back'] != null && payload['residence_back'] is File) {
        request.files.add(await http.MultipartFile.fromPath('residence_back', (payload['residence_back'] as File).path));
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
            Uri.parse('$baseUrl/student/profile/edit/'),
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

  /// Get institution my profile (own account information)
  static Future<Map<String, dynamic>> getInstitutionMyProfile({
    required String accessToken,
    String? refreshToken,
    Function(Map<String, dynamic>)? onTokenRefreshed,
    Function()? onSessionExpired,
  }) async {
    return getProtected(
      endpoint: '/institution/my-profile/',
      accessToken: accessToken,
      refreshToken: refreshToken,
      onTokenRefreshed: onTokenRefreshed,
      onSessionExpired: onSessionExpired,
    );
  }

  /// Get lecturer my profile (own account information)
  static Future<Map<String, dynamic>> getLecturerMyProfile({
    required String accessToken,
    String? refreshToken,
    Function(Map<String, dynamic>)? onTokenRefreshed,
    Function()? onSessionExpired,
  }) async {
    return getProtected(
      endpoint: '/lecturer/my-profile/',
      accessToken: accessToken,
      refreshToken: refreshToken,
      onTokenRefreshed: onTokenRefreshed,
      onSessionExpired: onSessionExpired,
    );
  }

  /// Get student my profile (own account information)
  static Future<Map<String, dynamic>> getStudentMyProfile({
    required String accessToken,
    String? refreshToken,
    Function(Map<String, dynamic>)? onTokenRefreshed,
    Function()? onSessionExpired,
  }) async {
    return getProtected(
      endpoint: '/student/my-profile/',
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

  /// Add institution payment method (Stripe Connect Onboarding)
  static Future<Map<String, dynamic>> addInstitutionPaymentMethod({
    required String accessToken,
    String? refreshToken,
    Function(Map<String, dynamic>)? onTokenRefreshed,
    Function()? onSessionExpired,
  }) async {
    try {
      var response = await http.post(
        Uri.parse('$baseUrl/institution/add-payment-method/'),
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
          response = await http.post(
            Uri.parse('$baseUrl/institution/add-payment-method/'),
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

  /// Subscribe institution to a plan
  static Future<Map<String, dynamic>> subscribeInstitution({
    required String accessToken,
    required String plan,
    String? refreshToken,
    Function(Map<String, dynamic>)? onTokenRefreshed,
    Function()? onSessionExpired,
  }) async {
    try {
      var response = await http.post(
        Uri.parse('$baseUrl/institution/subscribe/'),
        headers: {
          ..._defaultHeaders,
          'Authorization': 'Bearer $accessToken',
        },
        body: json.encode({'plan': plan}),
      );

      // Handle token refresh on 401
      if (response.statusCode == 401 && refreshToken != null && onTokenRefreshed != null) {
        try {
          final refreshed = await refreshAccessToken(refreshToken);
          onTokenRefreshed(refreshed);
          
          // Retry request with new token
          response = await http.post(
            Uri.parse('$baseUrl/institution/subscribe/'),
            headers: {
              ..._defaultHeaders,
              'Authorization': 'Bearer ${refreshed['access']}',
            },
            body: json.encode({'plan': plan}),
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

  /// Create institution course
  static Future<Map<String, dynamic>> createInstitutionCourse({
    required String accessToken,
    required Map<String, dynamic> payload,
    String? refreshToken,
    Function(Map<String, dynamic>)? onTokenRefreshed,
    Function()? onSessionExpired,
  }) async {
    try {
      final request = http.MultipartRequest(
        'POST',
        Uri.parse('$baseUrl/institution/create-course/'),
      );

      request.headers['Authorization'] = 'Bearer $accessToken';

      // Required fields
      if (payload['title'] != null) request.fields['title'] = payload['title'].toString();
      if (payload['about'] != null) request.fields['about'] = payload['about'].toString();
      if (payload['starting_date'] != null) request.fields['starting_date'] = payload['starting_date'].toString();
      if (payload['ending_date'] != null) request.fields['ending_date'] = payload['ending_date'].toString();
      if (payload['level'] != null) request.fields['level'] = payload['level'].toString();
      if (payload['price'] != null) request.fields['price'] = payload['price'].toString();
      if (payload['start_time'] != null) request.fields['start_time'] = payload['start_time'].toString();
      if (payload['end_time'] != null) request.fields['end_time'] = payload['end_time'].toString();
      if (payload['lecturer'] != null) request.fields['lecturer'] = payload['lecturer'].toString();

      // Days array - send as indexed keys
      if (payload['days'] != null && payload['days'] is List) {
        int index = 0;
        for (final day in payload['days'] as List) {
          request.fields['days[$index]'] = day.toString();
          index++;
        }
      }

      // Optional fields
      if (payload['capacity'] != null) request.fields['capacity'] = payload['capacity'].toString();
      if (payload['course_image'] != null && payload['course_image'] is File) {
        request.files.add(await http.MultipartFile.fromPath('course_image', (payload['course_image'] as File).path));
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
            Uri.parse('$baseUrl/institution/create-course/'),
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

  /// Edit institution course
  static Future<Map<String, dynamic>> editInstitutionCourse({
    required String accessToken,
    required int courseId,
    required Map<String, dynamic> payload,
    String? refreshToken,
    Function(Map<String, dynamic>)? onTokenRefreshed,
    Function()? onSessionExpired,
  }) async {
    try {
      final request = http.MultipartRequest(
        'PUT',
        Uri.parse('$baseUrl/institution/edit-course/$courseId/'),
      );

      request.headers['Authorization'] = 'Bearer $accessToken';

      // Add text fields (only if provided)
      if (payload['title'] != null) request.fields['title'] = payload['title'].toString();
      if (payload['about'] != null) request.fields['about'] = payload['about'].toString();
      if (payload['starting_date'] != null) request.fields['starting_date'] = payload['starting_date'].toString();
      if (payload['ending_date'] != null) request.fields['ending_date'] = payload['ending_date'].toString();
      if (payload['level'] != null) request.fields['level'] = payload['level'].toString();
      if (payload['price'] != null) request.fields['price'] = payload['price'].toString();
      if (payload['start_time'] != null) request.fields['start_time'] = payload['start_time'].toString();
      if (payload['end_time'] != null) request.fields['end_time'] = payload['end_time'].toString();
      if (payload['lecturer'] != null) request.fields['lecturer'] = payload['lecturer'].toString();

      // Days array (only if provided) - send as indexed keys
      if (payload['days'] != null && payload['days'] is List) {
        int index = 0;
        for (final day in payload['days'] as List) {
          request.fields['days[$index]'] = day.toString();
          index++;
        }
      }

      // Optional file
      if (payload['course_image'] != null && payload['course_image'] is File) {
        request.files.add(await http.MultipartFile.fromPath('course_image', (payload['course_image'] as File).path));
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
            Uri.parse('$baseUrl/institution/edit-course/$courseId/'),
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

  /// Get institution courses (public endpoint by username)
  static Future<Map<String, dynamic>> getInstitutionCourses(String username) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/institution/$username/courses/'),
        headers: _defaultHeaders,
      );

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

  /// Create institution post
  static Future<Map<String, dynamic>> createInstitutionPost({
    required String accessToken,
    required Map<String, dynamic> payload,
    String? refreshToken,
    Function(Map<String, dynamic>)? onTokenRefreshed,
    Function()? onSessionExpired,
  }) async {
    try {
      final request = http.MultipartRequest(
        'POST',
        Uri.parse('$baseUrl/institution/create-post/'),
      );

      request.headers['Authorization'] = 'Bearer $accessToken';

      // Required field
      if (payload['title'] != null) request.fields['title'] = payload['title'].toString();
      
      // Optional field
      if (payload['description'] != null) {
        request.fields['description'] = payload['description'].toString();
      } else {
        request.fields['description'] = '';
      }

      // Optional images array
      if (payload['images'] != null && payload['images'] is List) {
        for (final image in payload['images'] as List) {
          if (image is File) {
            request.files.add(await http.MultipartFile.fromPath('images', image.path));
          }
        }
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
            Uri.parse('$baseUrl/institution/create-post/'),
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

  /// Get institution jobs (public endpoint by username)
  static Future<Map<String, dynamic>> getInstitutionJobs(String username) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/institution/$username/jobs/'),
        headers: _defaultHeaders,
      );

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

  /// Create job post
  static Future<Map<String, dynamic>> createJobPost({
    required String accessToken,
    required Map<String, dynamic> payload,
    String? refreshToken,
    Function(Map<String, dynamic>)? onTokenRefreshed,
    Function()? onSessionExpired,
  }) async {
    try {
      var response = await http.post(
        Uri.parse('$baseUrl/institution/job/create/'),
        headers: {
          ..._defaultHeaders,
          'Authorization': 'Bearer $accessToken',
        },
        body: json.encode(payload),
      );

      final data = _parseResponse(response.body);

      // Handle token refresh on 401
      if (response.statusCode == 401 && refreshToken != null && onTokenRefreshed != null) {
        try {
          final refreshed = await refreshAccessToken(refreshToken);
          onTokenRefreshed(refreshed);

          // Retry request with new token
          response = await http.post(
            Uri.parse('$baseUrl/institution/job/create/'),
            headers: {
              ..._defaultHeaders,
              'Authorization': 'Bearer ${refreshed['access']}',
            },
            body: json.encode(payload),
          );

          final retryData = _parseResponse(response.body);

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

  /// Get job applications
  static Future<Map<String, dynamic>> getJobApplications({
    required String accessToken,
    required int jobId,
    String? refreshToken,
    Function(Map<String, dynamic>)? onTokenRefreshed,
    Function()? onSessionExpired,
  }) async {
    return getProtected(
      endpoint: '/institution/job/$jobId/applications/',
      accessToken: accessToken,
      refreshToken: refreshToken,
      onTokenRefreshed: onTokenRefreshed,
      onSessionExpired: onSessionExpired,
    );
  }

  /// Get marked lecturers
  static Future<Map<String, dynamic>> getMarkedLecturers({
    required String accessToken,
    String? refreshToken,
    Function(Map<String, dynamic>)? onTokenRefreshed,
    Function()? onSessionExpired,
  }) async {
    return getProtected(
      endpoint: '/institution/marked-lecturers/',
      accessToken: accessToken,
      refreshToken: refreshToken,
      onTokenRefreshed: onTokenRefreshed,
      onSessionExpired: onSessionExpired,
    );
  }

  /// Check if lecturer is free
  static Future<Map<String, dynamic>> checkLecturerAvailability({
    required String accessToken,
    required int lecturerId,
    required List<String> days,
    required String startTime,
    required String endTime,
    String? refreshToken,
    Function(Map<String, dynamic>)? onTokenRefreshed,
    Function()? onSessionExpired,
  }) async {
    try {
      final request = http.Request(
        'POST',
        Uri.parse('$baseUrl/institution/is-lecturer-free/$lecturerId/'),
      );

      request.headers['Authorization'] = 'Bearer $accessToken';
      request.headers['Content-Type'] = 'application/json';

      // Convert days to capitalized format (Monday, Wednesday, etc.)
      final capitalizedDays = days.map((day) {
        return day.substring(0, 1).toUpperCase() + day.substring(1).toLowerCase();
      }).toList();

      // Convert 12-hour time to 24-hour format if needed
      String startTime24 = startTime;
      String endTime24 = endTime;
      
      if (startTime.contains('AM') || startTime.contains('PM')) {
        startTime24 = _convert12To24Hour(startTime);
      }
      if (endTime.contains('AM') || endTime.contains('PM')) {
        endTime24 = _convert12To24Hour(endTime);
      }

      request.body = jsonEncode({
        'days': capitalizedDays,
        'start_time': startTime24,
        'end_time': endTime24,
      });

      var response = await request.send();
      final responseBody = await response.stream.bytesToString();
      final data = _parseResponse(responseBody);

      // Handle token refresh on 401
      if (response.statusCode == 401 && refreshToken != null && onTokenRefreshed != null) {
        try {
          final refreshed = await refreshAccessToken(refreshToken);
          onTokenRefreshed(refreshed);

          // Retry request with new token
          final retryRequest = http.Request(
            'POST',
            Uri.parse('$baseUrl/institution/is-lecturer-free/$lecturerId/'),
          );
          retryRequest.headers['Authorization'] = 'Bearer ${refreshed['access']}';
          retryRequest.headers['Content-Type'] = 'application/json';
          retryRequest.body = request.body;

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

  /// Helper to convert 12-hour time to 24-hour format
  static String _convert12To24Hour(String time12) {
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
}

