import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'api_service.dart';

class ExploreService {
  static const String baseUrl = ApiService.baseUrl;

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

  /// Search explore endpoint with query and filter
  static Future<Map<String, dynamic>> exploreSearch({
    required String query,
    String? filter,
    String? city,
    String? accessToken,
    String? refreshToken,
    Function(Map<String, dynamic>)? onTokenRefreshed,
    VoidCallback? onSessionExpired,
  }) async {
    try {
      // Build query string
      final params = <String, String>{};
      if (query.isNotEmpty) params['q'] = query;
      if (filter != null && filter.isNotEmpty) params['filter'] = filter;
      if (city != null && city.isNotEmpty) params['city'] = city;

      final uri = Uri.parse('$baseUrl/explore/').replace(queryParameters: params);

      final headers = <String, String>{
        'Content-Type': 'application/json',
      };
      if (accessToken != null && accessToken.isNotEmpty) {
        headers['Authorization'] = 'Bearer $accessToken';
      }

      var response = await http.get(uri, headers: headers);

      // Handle token refresh if needed
      if (response.statusCode == 401 && accessToken != null && refreshToken != null && onTokenRefreshed != null) {
        try {
          final refreshed = await ApiService.refreshAccessToken(refreshToken);
          onTokenRefreshed(refreshed);
          headers['Authorization'] = 'Bearer ${refreshed['access']}';
          response = await http.get(uri, headers: headers);
        } catch (refreshError) {
          if (onSessionExpired != null) onSessionExpired();
          if (refreshError is ApiException) rethrow;
          throw ApiException(message: 'Session expired. Please log in again.');
        }
      }

      final data = _parseResponse(response.body);

      if (response.statusCode != 200) {
        throw _buildError(response.statusCode, data);
      }

      return data;
    } catch (e) {
      if (e is ApiException) rethrow;
      throw ApiException(message: 'Network error. Please check your connection and try again.');
    }
  }

  /// Get course progress
  static Future<Map<String, dynamic>> getCourseProgress({
    required int courseId,
    String? accessToken,
    String? refreshToken,
    Function(Map<String, dynamic>)? onTokenRefreshed,
    VoidCallback? onSessionExpired,
  }) async {
    try {
      final uri = Uri.parse('$baseUrl/course/$courseId/progress/');

      final headers = <String, String>{
        'Content-Type': 'application/json',
      };
      if (accessToken != null && accessToken.isNotEmpty) {
        headers['Authorization'] = 'Bearer $accessToken';
      }

      var response = await http.get(uri, headers: headers);

      // Handle token refresh if needed
      if (response.statusCode == 401 && accessToken != null && refreshToken != null && onTokenRefreshed != null) {
        try {
          final refreshed = await ApiService.refreshAccessToken(refreshToken);
          onTokenRefreshed(refreshed);
          headers['Authorization'] = 'Bearer ${refreshed['access']}';
          response = await http.get(uri, headers: headers);
        } catch (refreshError) {
          if (onSessionExpired != null) onSessionExpired();
          if (refreshError is ApiException) rethrow;
          throw ApiException(message: 'Session expired. Please log in again.');
        }
      }

      final data = _parseResponse(response.body);

      if (response.statusCode != 200) {
        throw _buildError(response.statusCode, data);
      }

      return data;
    } catch (e) {
      if (e is ApiException) rethrow;
      throw ApiException(message: 'Network error. Please check your connection and try again.');
    }
  }

  /// Enroll in course
  static Future<Map<String, dynamic>> enrollInCourse({
    required int courseId,
    required String accessToken,
    String? refreshToken,
    Function(Map<String, dynamic>)? onTokenRefreshed,
    VoidCallback? onSessionExpired,
  }) async {
    try {
      final uri = Uri.parse('$baseUrl/student/enroll/$courseId/');

      final headers = <String, String>{
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $accessToken',
      };

      var response = await http.post(uri, headers: headers);

      // Handle token refresh if needed
      if (response.statusCode == 401 && refreshToken != null && onTokenRefreshed != null) {
        try {
          final refreshed = await ApiService.refreshAccessToken(refreshToken);
          onTokenRefreshed(refreshed);
          headers['Authorization'] = 'Bearer ${refreshed['access']}';
          response = await http.post(uri, headers: headers);
        } catch (refreshError) {
          if (onSessionExpired != null) onSessionExpired();
          if (refreshError is ApiException) rethrow;
          throw ApiException(message: 'Session expired. Please log in again.');
        }
      }

      final data = _parseResponse(response.body);

      if (response.statusCode != 200 && response.statusCode != 201) {
        throw _buildError(response.statusCode, data);
      }

      return data;
    } catch (e) {
      if (e is ApiException) rethrow;
      throw ApiException(message: 'Network error. Please check your connection and try again.');
    }
  }

  /// Mark lecturer (bookmark)
  static Future<Map<String, dynamic>> markLecturer({
    required int lecturerId,
    required String accessToken,
    String? refreshToken,
    Function(Map<String, dynamic>)? onTokenRefreshed,
    VoidCallback? onSessionExpired,
  }) async {
    try {
      final uri = Uri.parse('$baseUrl/institution/mark-lecturer/');

      final headers = <String, String>{
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $accessToken',
      };

      final body = json.encode({'lecturer_id': lecturerId});

      var response = await http.post(uri, headers: headers, body: body);

      // Handle token refresh if needed
      if (response.statusCode == 401 && refreshToken != null && onTokenRefreshed != null) {
        try {
          final refreshed = await ApiService.refreshAccessToken(refreshToken);
          onTokenRefreshed(refreshed);
          headers['Authorization'] = 'Bearer ${refreshed['access']}';
          response = await http.post(uri, headers: headers, body: body);
        } catch (refreshError) {
          if (onSessionExpired != null) onSessionExpired();
          if (refreshError is ApiException) rethrow;
          throw ApiException(message: 'Session expired. Please log in again.');
        }
      }

      final data = _parseResponse(response.body);

      if (response.statusCode != 200 && response.statusCode != 201) {
        throw _buildError(response.statusCode, data);
      }

      return data;
    } catch (e) {
      if (e is ApiException) rethrow;
      throw ApiException(message: 'Network error. Please check your connection and try again.');
    }
  }

  /// Remove marked lecturer
  static Future<Map<String, dynamic>> removeMarkedLecturer({
    required int lecturerId,
    required String accessToken,
    String? refreshToken,
    Function(Map<String, dynamic>)? onTokenRefreshed,
    VoidCallback? onSessionExpired,
  }) async {
    try {
      final uri = Uri.parse('$baseUrl/institution/remove-marked/$lecturerId/');

      final headers = <String, String>{
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $accessToken',
      };

      var response = await http.delete(uri, headers: headers);

      // Handle token refresh if needed
      if (response.statusCode == 401 && refreshToken != null && onTokenRefreshed != null) {
        try {
          final refreshed = await ApiService.refreshAccessToken(refreshToken);
          onTokenRefreshed(refreshed);
          headers['Authorization'] = 'Bearer ${refreshed['access']}';
          response = await http.delete(uri, headers: headers);
        } catch (refreshError) {
          if (onSessionExpired != null) onSessionExpired();
          if (refreshError is ApiException) rethrow;
          throw ApiException(message: 'Session expired. Please log in again.');
        }
      }

      final data = _parseResponse(response.body);

      if (response.statusCode != 200 && response.statusCode != 204) {
        throw _buildError(response.statusCode, data);
      }

      return data;
    } catch (e) {
      if (e is ApiException) rethrow;
      throw ApiException(message: 'Network error. Please check your connection and try again.');
    }
  }

  /// Check if lecturer is marked
  static Future<bool> isLecturerMarked({
    required int lecturerId,
    required String accessToken,
    String? refreshToken,
    Function(Map<String, dynamic>)? onTokenRefreshed,
    VoidCallback? onSessionExpired,
  }) async {
    try {
      final uri = Uri.parse('$baseUrl/institution/is-marked/$lecturerId/');

      final headers = <String, String>{
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $accessToken',
      };

      var response = await http.get(uri, headers: headers);

      // Handle token refresh if needed
      if (response.statusCode == 401 && refreshToken != null && onTokenRefreshed != null) {
        try {
          final refreshed = await ApiService.refreshAccessToken(refreshToken);
          onTokenRefreshed(refreshed);
          headers['Authorization'] = 'Bearer ${refreshed['access']}';
          response = await http.get(uri, headers: headers);
        } catch (refreshError) {
          if (onSessionExpired != null) onSessionExpired();
          if (refreshError is ApiException) rethrow;
          throw ApiException(message: 'Session expired. Please log in again.');
        }
      }

      final data = _parseResponse(response.body);

      if (response.statusCode != 200) {
        throw _buildError(response.statusCode, data);
      }

      return data['marked'] == true || data['success'] == true;
    } catch (e) {
      if (e is ApiException) rethrow;
      throw ApiException(message: 'Network error. Please check your connection and try again.');
    }
  }

  /// Apply to job
  static Future<Map<String, dynamic>> applyToJob({
    required int jobId,
    required String accessToken,
    String message = '',
    String? refreshToken,
    Function(Map<String, dynamic>)? onTokenRefreshed,
    VoidCallback? onSessionExpired,
  }) async {
    try {
      final uri = Uri.parse('$baseUrl/lecturer/job/$jobId/apply/');

      final headers = <String, String>{
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $accessToken',
      };

      final body = json.encode({'message': message});

      var response = await http.post(uri, headers: headers, body: body);

      // Handle token refresh if needed
      if (response.statusCode == 401 && refreshToken != null && onTokenRefreshed != null) {
        try {
          final refreshed = await ApiService.refreshAccessToken(refreshToken);
          onTokenRefreshed(refreshed);
          headers['Authorization'] = 'Bearer ${refreshed['access']}';
          response = await http.post(uri, headers: headers, body: body);
        } catch (refreshError) {
          if (onSessionExpired != null) onSessionExpired();
          if (refreshError is ApiException) rethrow;
          throw ApiException(message: 'Session expired. Please log in again.');
        }
      }

      final data = _parseResponse(response.body);

      if (response.statusCode != 200 && response.statusCode != 201) {
        throw _buildError(response.statusCode, data);
      }

      return data;
    } catch (e) {
      if (e is ApiException) rethrow;
      throw ApiException(message: 'Network error. Please check your connection and try again.');
    }
  }

  /// Get job details
  static Future<Map<String, dynamic>> getJobDetails(int jobId) async {
    try {
      final uri = Uri.parse('$baseUrl/institution/job/$jobId/');

      final headers = <String, String>{
        'Content-Type': 'application/json',
      };

      final response = await http.get(uri, headers: headers);

      final data = _parseResponse(response.body);

      if (response.statusCode != 200) {
        throw _buildError(response.statusCode, data);
      }

      return data;
    } catch (e) {
      if (e is ApiException) rethrow;
      throw ApiException(message: 'Network error. Please check your connection and try again.');
    }
  }

  /// Get course details
  static Future<Map<String, dynamic>> getCourseDetails(int courseId) async {
    try {
      final uri = Uri.parse('$baseUrl/course/$courseId/');

      final headers = <String, String>{
        'Content-Type': 'application/json',
      };

      final response = await http.get(uri, headers: headers);

      final data = _parseResponse(response.body);

      if (response.statusCode != 200) {
        throw _buildError(response.statusCode, data);
      }

      return data;
    } catch (e) {
      if (e is ApiException) rethrow;
      throw ApiException(message: 'Network error. Please check your connection and try again.');
    }
  }

  /// Check if student is free (no schedule conflict)
  static Future<Map<String, dynamic>> checkStudentFree({
    required int courseId,
    required String accessToken,
    String? refreshToken,
    Function(Map<String, dynamic>)? onTokenRefreshed,
    VoidCallback? onSessionExpired,
  }) async {
    try {
      final uri = Uri.parse('$baseUrl/student/is-student-free/$courseId/');

      final headers = <String, String>{
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $accessToken',
      };

      var response = await http.post(uri, headers: headers);

      // Handle token refresh if needed
      if (response.statusCode == 401 && refreshToken != null && onTokenRefreshed != null) {
        try {
          final refreshed = await ApiService.refreshAccessToken(refreshToken);
          onTokenRefreshed(refreshed);
          headers['Authorization'] = 'Bearer ${refreshed['access']}';
          response = await http.post(uri, headers: headers);
        } catch (refreshError) {
          if (onSessionExpired != null) onSessionExpired();
          if (refreshError is ApiException) rethrow;
          throw ApiException(message: 'Session expired. Please log in again.');
        }
      }

      final data = _parseResponse(response.body);

      if (response.statusCode != 200 && response.statusCode != 201) {
        throw _buildError(response.statusCode, data);
      }

      return data;
    } catch (e) {
      if (e is ApiException) rethrow;
      throw ApiException(message: 'Network error. Please check your connection and try again.');
    }
  }
}


