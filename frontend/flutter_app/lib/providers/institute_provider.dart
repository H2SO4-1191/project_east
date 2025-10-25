import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:convert';

class InstituteProvider with ChangeNotifier {
  Map<String, dynamic> _instituteData = {
    'name': 'Al-Noor Educational Institute',
    'email': 'info@alnoor.edu',
    'subscription': '1year',
    'subscriptionLabel': '1 Year',
    'paymentMethod': 'credit',
    'paymentMethodLabel': 'Credit Card',
    'registrationDate': DateTime.now().toIso8601String(),
  };

  SharedPreferences? _prefs;

  Map<String, dynamic> get instituteData => _instituteData;

  InstituteProvider() {
    _loadData();
  }

  Future<void> _loadData() async {
    _prefs = await SharedPreferences.getInstance();
    final String? dataString = _prefs?.getString('instituteData');
    if (dataString != null) {
      _instituteData = json.decode(dataString);
      notifyListeners();
    }
  }

  Future<void> updateInstituteData(Map<String, dynamic> newData) async {
    _instituteData = {..._instituteData, ...newData};
    await _prefs?.setString('instituteData', json.encode(_instituteData));
    notifyListeners();
  }

  Future<void> setInstituteData(Map<String, dynamic> data) async {
    _instituteData = data;
    await _prefs?.setString('instituteData', json.encode(_instituteData));
    notifyListeners();
  }

  Future<void> clearData() async {
    await _prefs?.remove('instituteData');
    _instituteData = {
      'name': 'Al-Noor Educational Institute',
      'email': 'info@alnoor.edu',
      'subscription': '1year',
      'subscriptionLabel': '1 Year',
      'paymentMethod': 'credit',
      'paymentMethodLabel': 'Credit Card',
      'registrationDate': DateTime.now().toIso8601String(),
    };
    notifyListeners();
  }
}

