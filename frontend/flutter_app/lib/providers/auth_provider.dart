import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:convert';
import '../services/api_service.dart';

class AuthProvider with ChangeNotifier {
  Map<String, dynamic> _instituteData = {
    'name': '',
    'email': '',
    'username': '',
    'firstName': '',
    'lastName': '',
    'userId': null,
    'userType': '',
    'accessToken': '',
    'refreshToken': '',
    'subscription': '',
    'subscriptionLabel': '',
    'paymentMethod': '',
    'paymentMethodLabel': '',
    'registrationDate': '',
    'isAuthenticated': false,
    'isVerified': false,
  };

  SharedPreferences? _prefs;
  bool _isInitialized = false;

  Map<String, dynamic> get instituteData => _instituteData;
  bool get isAuthenticated => _instituteData['isAuthenticated'] == true;
  bool get isVerified => _instituteData['isVerified'] == true;
  String? get accessToken => _instituteData['accessToken'];
  String? get refreshToken => _instituteData['refreshToken'];

  AuthProvider() {
    _loadData();
  }

  Future<void> _loadData() async {
    if (_isInitialized) return;
    
    _prefs = await SharedPreferences.getInstance();
    final String? dataString = _prefs?.getString('instituteData');
    if (dataString != null) {
      try {
        final stored = json.decode(dataString) as Map<String, dynamic>;
        _instituteData = {..._instituteData, ...stored};
        
        // Validate token if authenticated
        if (_instituteData['isAuthenticated'] == true && 
            _instituteData['accessToken'] != null &&
            _instituteData['accessToken'].toString().isNotEmpty) {
          // Token is present, keep authenticated state
        } else {
          // No valid token, clear authentication
          _instituteData['isAuthenticated'] = false;
        }
      } catch (e) {
        print('Error loading institute data: $e');
      }
    }
    _isInitialized = true;
    notifyListeners();
  }

  Future<void> updateInstituteData(Map<String, dynamic> newData) async {
    await _ensureInitialized();
    _instituteData = {..._instituteData, ...newData};
    await _saveData();
    notifyListeners();
  }

  Future<void> setInstituteData(Map<String, dynamic> data) async {
    await _ensureInitialized();
    _instituteData = data;
    await _saveData();
    notifyListeners();
  }

  Future<void> _saveData() async {
    await _prefs?.setString('instituteData', json.encode(_instituteData));
  }

  Future<void> _ensureInitialized() async {
    if (!_isInitialized) {
      await _loadData();
    }
  }

  /// Handle token refresh
  void onTokenRefreshed(Map<String, dynamic> tokens) {
    _instituteData['accessToken'] = tokens['access'];
    if (tokens['refresh'] != null) {
      _instituteData['refreshToken'] = tokens['refresh'];
    }
    _saveData();
    notifyListeners();
  }

  /// Handle session expiration
  Future<void> onSessionExpired() async {
    await logout();
  }

  /// Logout user
  Future<void> logout() async {
    await _ensureInitialized();
    _instituteData = {
      'name': '',
      'email': '',
      'username': '',
      'firstName': '',
      'lastName': '',
      'userId': null,
      'userType': '',
      'accessToken': '',
      'refreshToken': '',
      'subscription': '',
      'subscriptionLabel': '',
      'paymentMethod': '',
      'paymentMethodLabel': '',
      'registrationDate': '',
      'isAuthenticated': false,
      'isVerified': false,
    };
    await _prefs?.remove('instituteData');
    notifyListeners();
  }

  /// Clear all data
  Future<void> clearData() async {
    await logout();
  }

  /// Get dashboard stats with automatic token refresh
  Future<Map<String, dynamic>> getDashboardStats() async {
    await _ensureInitialized();
    
    if (!isAuthenticated || accessToken == null) {
      throw ApiException(
        status: 401,
        message: 'Not authenticated',
      );
    }

    return await ApiService.getDashboardStats(
      accessToken: accessToken!,
      refreshToken: refreshToken,
      onTokenRefreshed: onTokenRefreshed,
      onSessionExpired: onSessionExpired,
    );
  }

  /// Get schedule with automatic token refresh
  Future<List<dynamic>> getSchedule() async {
    await _ensureInitialized();
    
    if (!isAuthenticated || accessToken == null) {
      throw ApiException(
        status: 401,
        message: 'Not authenticated',
      );
    }

    return await ApiService.getSchedule(
      accessToken: accessToken!,
      refreshToken: refreshToken,
      onTokenRefreshed: onTokenRefreshed,
      onSessionExpired: onSessionExpired,
    );
  }

  /// Make authenticated GET request
  Future<Map<String, dynamic>> getProtected(String endpoint) async {
    await _ensureInitialized();
    
    if (!isAuthenticated || accessToken == null) {
      throw ApiException(
        status: 401,
        message: 'Not authenticated',
      );
    }

    return await ApiService.getProtected(
      endpoint: endpoint,
      accessToken: accessToken!,
      refreshToken: refreshToken,
      onTokenRefreshed: onTokenRefreshed,
      onSessionExpired: onSessionExpired,
    );
  }
}


