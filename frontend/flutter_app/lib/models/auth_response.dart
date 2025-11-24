import 'dart:convert';

/// JWT Token Payload
class JwtPayload {
  final String? email;
  final String? username;
  final String? firstName;
  final String? lastName;
  final String? fullName;
  final String? name;
  final int? userId;
  final String? userType;

  JwtPayload({
    this.email,
    this.username,
    this.firstName,
    this.lastName,
    this.fullName,
    this.name,
    this.userId,
    this.userType,
  });

  factory JwtPayload.fromJson(Map<String, dynamic> json) {
    return JwtPayload(
      email: json['email'],
      username: json['username'],
      firstName: json['first_name'] ?? json['firstName'],
      lastName: json['last_name'] ?? json['lastName'],
      fullName: json['full_name'],
      name: json['name'],
      userId: json['user_id'],
      userType: json['user_type'],
    );
  }

  static JwtPayload? decode(String? token) {
    if (token == null || token.isEmpty) return null;
    
    try {
      final parts = token.split('.');
      if (parts.length != 3) return null;

      final payload = parts[1];
      
      // Normalize base64 string
      var normalized = payload.replaceAll('-', '+').replaceAll('_', '/');
      
      // Add padding if needed
      switch (normalized.length % 4) {
        case 2:
          normalized += '==';
          break;
        case 3:
          normalized += '=';
          break;
      }

      final decoded = utf8.decode(base64.decode(normalized));
      final json = jsonDecode(decoded) as Map<String, dynamic>;
      
      return JwtPayload.fromJson(json);
    } catch (e) {
      print('Failed to decode JWT payload: $e');
      return null;
    }
  }
}

/// OTP Verification Response
class OtpVerificationResponse {
  final String? access;
  final String? refresh;
  final int? userId;
  final String? userType;
  final String? message;

  OtpVerificationResponse({
    this.access,
    this.refresh,
    this.userId,
    this.userType,
    this.message,
  });

  factory OtpVerificationResponse.fromJson(Map<String, dynamic> json) {
    return OtpVerificationResponse(
      access: json['access'],
      refresh: json['refresh'],
      userId: json['user_id'],
      userType: json['user_type'],
      message: json['message'],
    );
  }
}

/// Signup Response
class SignupResponse {
  final String? message;
  final bool? success;

  SignupResponse({
    this.message,
    this.success,
  });

  factory SignupResponse.fromJson(Map<String, dynamic> json) {
    return SignupResponse(
      message: json['message'],
      success: json['success'],
    );
  }
}

/// Verification Status Response
class VerificationStatusResponse {
  final bool isVerified;

  VerificationStatusResponse({
    required this.isVerified,
  });

  factory VerificationStatusResponse.fromJson(Map<String, dynamic> json) {
    return VerificationStatusResponse(
      isVerified: json['is_verified'] ?? false,
    );
  }
}


