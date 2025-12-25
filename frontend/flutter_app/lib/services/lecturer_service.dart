import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'api_service.dart';

class LecturerService {
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

  // Get lecturer courses (public endpoint)
  static Future<Map<String, dynamic>> getLecturerCourses(String username) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/lecturer/$username/courses/'),
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

  // Get lecturer schedule (requires auth)
  static Future<Map<String, dynamic>> getLecturerSchedule({
    required String accessToken,
    String? refreshToken,
    Function(Map<String, dynamic>)? onTokenRefreshed,
    VoidCallback? onSessionExpired,
  }) async {
    try {
      var response = await http.get(
        Uri.parse('$baseUrl/lecturer/schedule/'),
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
            Uri.parse('$baseUrl/lecturer/schedule/'),
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

  // Get course students for a specific lecture
  static Future<Map<String, dynamic>> getCourseStudents({
    required int courseId,
    required int lectureNumber,
    required String accessToken,
    String? refreshToken,
    Function(Map<String, dynamic>)? onTokenRefreshed,
    VoidCallback? onSessionExpired,
  }) async {
    try {
      var response = await http.get(
        Uri.parse('$baseUrl/course/$courseId/students/').replace(queryParameters: {
          'lecture_number': lectureNumber.toString(),
        }),
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
            Uri.parse('$baseUrl/course/$courseId/students/').replace(queryParameters: {
              'lecture_number': lectureNumber.toString(),
            }),
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

  // Create exam
  static Future<Map<String, dynamic>> createExam({
    required String accessToken,
    required int courseId,
    required Map<String, dynamic> examData,
    String? refreshToken,
    Function(Map<String, dynamic>)? onTokenRefreshed,
    VoidCallback? onSessionExpired,
  }) async {
    try {
      var response = await http.post(
        Uri.parse('$baseUrl/lecturer/course/$courseId/exam/create/'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $accessToken',
        },
        body: json.encode(examData),
      );

      if (response.statusCode == 401 && refreshToken != null && onTokenRefreshed != null) {
        try {
          final refreshed = await ApiService.refreshAccessToken(refreshToken);
          onTokenRefreshed(refreshed);
          response = await http.post(
            Uri.parse('$baseUrl/lecturer/course/$courseId/exam/create/'),
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer ${refreshed['access']}',
            },
            body: json.encode(examData),
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

  // Submit exam grades
  static Future<Map<String, dynamic>> submitExamGrades({
    required String accessToken,
    required int examId,
    required List<Map<String, dynamic>> grades,
    String? refreshToken,
    Function(Map<String, dynamic>)? onTokenRefreshed,
    VoidCallback? onSessionExpired,
  }) async {
    try {
      var response = await http.post(
        Uri.parse('$baseUrl/lecturer/exam/$examId/grades/'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $accessToken',
        },
        body: json.encode({'grades': grades}),
      );

      if (response.statusCode == 401 && refreshToken != null && onTokenRefreshed != null) {
        try {
          final refreshed = await ApiService.refreshAccessToken(refreshToken);
          onTokenRefreshed(refreshed);
          response = await http.post(
            Uri.parse('$baseUrl/lecturer/exam/$examId/grades/'),
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer ${refreshed['access']}',
            },
            body: json.encode({'grades': grades}),
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

  // Edit exam grades
  static Future<Map<String, dynamic>> editExamGrades({
    required String accessToken,
    required int examId,
    required List<Map<String, dynamic>> grades,
    String? refreshToken,
    Function(Map<String, dynamic>)? onTokenRefreshed,
    VoidCallback? onSessionExpired,
  }) async {
    try {
      var response = await http.put(
        Uri.parse('$baseUrl/lecturer/exam/$examId/grades/edit/'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $accessToken',
        },
        body: json.encode({'grades': grades}),
      );

      if (response.statusCode == 401 && refreshToken != null && onTokenRefreshed != null) {
        try {
          final refreshed = await ApiService.refreshAccessToken(refreshToken);
          onTokenRefreshed(refreshed);
          response = await http.put(
            Uri.parse('$baseUrl/lecturer/exam/$examId/grades/edit/'),
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer ${refreshed['access']}',
            },
            body: json.encode({'grades': grades}),
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

  // View exam grades
  static Future<Map<String, dynamic>> viewExamGrades({
    required String accessToken,
    required int examId,
    String? refreshToken,
    Function(Map<String, dynamic>)? onTokenRefreshed,
    VoidCallback? onSessionExpired,
  }) async {
    try {
      var response = await http.get(
        Uri.parse('$baseUrl/lecturer/exam/$examId/grades/view/'),
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
            Uri.parse('$baseUrl/lecturer/exam/$examId/grades/view/'),
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

  // Mark attendance
  static Future<Map<String, dynamic>> markAttendance({
    required String accessToken,
    required int courseId,
    required int lectureNumber,
    required List<Map<String, dynamic>> records,
    String? refreshToken,
    Function(Map<String, dynamic>)? onTokenRefreshed,
    VoidCallback? onSessionExpired,
  }) async {
    try {
      var response = await http.post(
        Uri.parse('$baseUrl/lecturer/course/$courseId/attendance/'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $accessToken',
        },
        body: json.encode({
          'lecture_number': lectureNumber,
          'records': records,
        }),
      );

      if (response.statusCode == 401 && refreshToken != null && onTokenRefreshed != null) {
        try {
          final refreshed = await ApiService.refreshAccessToken(refreshToken);
          onTokenRefreshed(refreshed);
          response = await http.post(
            Uri.parse('$baseUrl/lecturer/course/$courseId/attendance/'),
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer ${refreshed['access']}',
            },
            body: json.encode({
              'lecture_number': lectureNumber,
              'records': records,
            }),
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

  // Get lecturer exams list for a specific course
  static Future<Map<String, dynamic>> getLecturerExams({
    required String accessToken,
    required int courseId,
    String? refreshToken,
    Function(Map<String, dynamic>)? onTokenRefreshed,
    VoidCallback? onSessionExpired,
  }) async {
    try {
      var response = await http.get(
        Uri.parse('$baseUrl/institution-lecturer/courses/$courseId/exams/'),
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
            Uri.parse('$baseUrl/institution-lecturer/courses/$courseId/exams/'),
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

  // View lecture attendance
  static Future<Map<String, dynamic>> viewLectureAttendance({
    required String accessToken,
    required int courseId,
    required int lectureNumber,
    String? refreshToken,
    Function(Map<String, dynamic>)? onTokenRefreshed,
    VoidCallback? onSessionExpired,
  }) async {
    try {
      var response = await http.get(
        Uri.parse('$baseUrl/institution-lecturer/course/$courseId/attendance/$lectureNumber/'),
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
            Uri.parse('$baseUrl/institution-lecturer/course/$courseId/attendance/$lectureNumber/'),
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

