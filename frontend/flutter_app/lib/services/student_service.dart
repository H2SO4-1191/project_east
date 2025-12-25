import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'api_service.dart';

class StudentService {
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
        data['errors']?['non_field_errors']?[0] ??
        data['detail'] ??
        data['error'];

    final message = apiMessage?.toString() ?? fallbackMessage;
    
    return ApiException(
      status: status,
      message: message,
      data: data,
    );
  }

  // Get student courses (public endpoint)
  static Future<Map<String, dynamic>> getStudentCourses(String username) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/student/$username/courses/'),
        headers: {
          'Content-Type': 'application/json',
        },
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

  // Get student schedule (requires auth)
  static Future<Map<String, dynamic>> getStudentSchedule({
    required String accessToken,
    String? refreshToken,
    Function(Map<String, dynamic>)? onTokenRefreshed,
    VoidCallback? onSessionExpired,
  }) async {
    try {
      var response = await http.get(
        Uri.parse('$baseUrl/student/schedule/'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $accessToken',
        },
      );

      if (response.statusCode == 401 && refreshToken != null && onTokenRefreshed != null) {
        try {
          final refreshed = await ApiService.refreshAccessToken(refreshToken);
          onTokenRefreshed(refreshed);
          response = await http.get(
            Uri.parse('$baseUrl/student/schedule/'),
            headers: {
              'Content-Type': 'application/json',
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

  // Get student course attendance
  static Future<Map<String, dynamic>> getStudentCourseAttendance({
    required String accessToken,
    required int courseId,
    String? refreshToken,
    Function(Map<String, dynamic>)? onTokenRefreshed,
    VoidCallback? onSessionExpired,
  }) async {
    try {
      var response = await http.get(
        Uri.parse('$baseUrl/student/course/$courseId/attendance/'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $accessToken',
        },
      );

      if (response.statusCode == 401 && refreshToken != null && onTokenRefreshed != null) {
        try {
          final refreshed = await ApiService.refreshAccessToken(refreshToken);
          onTokenRefreshed(refreshed);
          response = await http.get(
            Uri.parse('$baseUrl/student/course/$courseId/attendance/'),
            headers: {
              'Content-Type': 'application/json',
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

  // Get student course grades
  static Future<Map<String, dynamic>> getStudentCourseGrades({
    required String accessToken,
    required int courseId,
    String? refreshToken,
    Function(Map<String, dynamic>)? onTokenRefreshed,
    VoidCallback? onSessionExpired,
  }) async {
    try {
      var response = await http.get(
        Uri.parse('$baseUrl/student/course/$courseId/grades/'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $accessToken',
        },
      );

      if (response.statusCode == 401 && refreshToken != null && onTokenRefreshed != null) {
        try {
          final refreshed = await ApiService.refreshAccessToken(refreshToken);
          onTokenRefreshed(refreshed);
          response = await http.get(
            Uri.parse('$baseUrl/student/course/$courseId/grades/'),
            headers: {
              'Content-Type': 'application/json',
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

  // Check if student is enrolled in a course
  static Future<Map<String, dynamic>> checkStudentEnrollment({
    required String accessToken,
    required int courseId,
    String? refreshToken,
    Function(Map<String, dynamic>)? onTokenRefreshed,
    VoidCallback? onSessionExpired,
  }) async {
    try {
      var response = await http.get(
        Uri.parse('$baseUrl/student/is-enrolled/$courseId/'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $accessToken',
        },
      );

      if (response.statusCode == 401 && refreshToken != null && onTokenRefreshed != null) {
        try {
          final refreshed = await ApiService.refreshAccessToken(refreshToken);
          onTokenRefreshed(refreshed);
          response = await http.get(
            Uri.parse('$baseUrl/student/is-enrolled/$courseId/'),
            headers: {
              'Content-Type': 'application/json',
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
}

