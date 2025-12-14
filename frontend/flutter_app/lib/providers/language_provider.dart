import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

class LanguageProvider extends ChangeNotifier {
  static const String _languageKey = 'selected_language';
  Locale _locale = const Locale('en');
  bool _isInitialized = false;

  Locale get locale => _locale;
  String get languageCode => _locale.languageCode;
  bool get isArabic => _locale.languageCode == 'ar';
  bool get isInitialized => _isInitialized;

  LanguageProvider() {
    _initialize();
  }

  Future<void> _initialize() async {
    await _loadLanguage();
    _isInitialized = true;
    notifyListeners();
  }

  Future<void> _loadLanguage() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final languageCode = prefs.getString(_languageKey) ?? 'en';
      _locale = Locale(languageCode);
    } catch (e) {
      // Default to English if loading fails
      _locale = const Locale('en');
    }
  }

  Future<void> setLanguage(String languageCode) async {
    if (_locale.languageCode == languageCode) return;

    _locale = Locale(languageCode);
    notifyListeners();

    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(_languageKey, languageCode);
    } catch (e) {
      // Handle error silently
    }
  }

  Future<void> toggleLanguage() async {
    final newLanguageCode = _locale.languageCode == 'ar' ? 'en' : 'ar';
    await setLanguage(newLanguageCode);
  }
}

