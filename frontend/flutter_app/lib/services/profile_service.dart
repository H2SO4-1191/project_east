import 'dart:convert';
import 'package:http/http.dart' as http;
import 'api_service.dart';

class ProfileService {
  static const String baseUrl = ApiService.baseUrl;

  static Map<String, dynamic> _parseResponse(String body) {
    if (body.isEmpty) return {};
    try {
      return json.decode(body) as Map<String, dynamic>;
    } catch (_) {
      return {'raw': body};
    }
  }

  static ApiException _buildError(int status, Map<String, dynamic> data) {
    final message = data['message'] ??
        data['detail'] ??
        data['error'] ??
        data['errors']?['detail'] ??
        'Unable to load profile';
    return ApiException(status: status, message: message.toString(), data: data);
  }

  static Future<Map<String, dynamic>> _get(String path) async {
    final response = await http.get(
      Uri.parse('$baseUrl$path'),
      headers: const {'Content-Type': 'application/json'},
    );
    final data = _parseResponse(response.body);
    if (response.statusCode != 200) {
      throw _buildError(response.statusCode, data);
    }
    return data;
  }

  static Future<Map<String, dynamic>> getStudentPublicProfile(String username) {
    return _get('/student/profile/$username/');
  }

  static Future<Map<String, dynamic>> getLecturerPublicProfile(String username) {
    return _get('/lecturer/profile/$username/');
  }

  static Future<Map<String, dynamic>> getInstitutionPublicProfile(String username) {
    return _get('/institution/profile/$username/');
  }

  static Future<Map<String, dynamic>> getInstitutionPosts(String username) {
    return _get('/institution/$username/posts/');
  }

  static Future<Map<String, dynamic>> getInstitutionCourses(String username) {
    return _get('/institution/$username/courses/');
  }

  static Future<Map<String, dynamic>> getInstitutionJobs(String username) {
    return _get('/institution/$username/jobs/');
  }
}

