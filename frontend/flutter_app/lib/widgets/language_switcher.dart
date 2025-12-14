import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/language_provider.dart';
import '../config/theme.dart';

class LanguageSwitcher extends StatefulWidget {
  final bool isInDrawer;

  const LanguageSwitcher({
    super.key,
    this.isInDrawer = false,
  });

  @override
  State<LanguageSwitcher> createState() => _LanguageSwitcherState();
}

class _LanguageSwitcherState extends State<LanguageSwitcher> {
  bool _isOpen = false;

  final List<Map<String, dynamic>> _languages = [
    {'code': 'en', 'name': 'English', 'flag': '🇬🇧'},
    {'code': 'ar', 'name': 'العربية', 'flag': '🇮🇶'},
  ];

  void _changeLanguage(String languageCode) {
    final languageProvider = Provider.of<LanguageProvider>(context, listen: false);
    languageProvider.setLanguage(languageCode);
    setState(() {
      _isOpen = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final languageProvider = Provider.of<LanguageProvider>(context);
    final currentLang = languageProvider.languageCode;
    final currentLanguage = _languages.firstWhere(
      (lang) => lang['code'] == currentLang,
      orElse: () => _languages[0],
    );

    if (widget.isInDrawer) {
      // Drawer variant - full width ListTile
      return Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          ListTile(
            leading: const Icon(Icons.language),
            title: Text('${currentLanguage['flag']} ${currentLanguage['name']}'),
            trailing: Icon(
              _isOpen ? Icons.keyboard_arrow_up : Icons.keyboard_arrow_down,
            ),
            onTap: () {
              setState(() {
                _isOpen = !_isOpen;
              });
            },
          ),
          if (_isOpen)
            Container(
              margin: const EdgeInsets.symmetric(horizontal: 16),
              decoration: BoxDecoration(
                color: isDark ? AppTheme.navy700 : Colors.grey.shade100,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Column(
                children: _languages.map((lang) {
                  final isSelected = lang['code'] == currentLang;
                  return InkWell(
                    onTap: () => _changeLanguage(lang['code'] as String),
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 16,
                        vertical: 12,
                      ),
                      decoration: BoxDecoration(
                        color: isSelected
                            ? (isDark
                                ? AppTheme.primary600.withOpacity(0.2)
                                : AppTheme.primary50)
                            : Colors.transparent,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Row(
                        children: [
                          Text(
                            lang['flag'] as String,
                            style: const TextStyle(fontSize: 20),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Text(
                              lang['name'] as String,
                              style: TextStyle(
                                fontWeight: isSelected
                                    ? FontWeight.bold
                                    : FontWeight.normal,
                                color: isSelected
                                    ? AppTheme.primary600
                                    : null,
                              ),
                            ),
                          ),
                          if (isSelected)
                            Icon(
                              Icons.check,
                              size: 20,
                              color: AppTheme.primary600,
                            ),
                        ],
                      ),
                    ),
                  );
                }).toList(),
              ),
            ),
        ],
      );
    }

    // Default variant - compact button with dropdown
    return PopupMenuButton<String>(
      icon: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(Icons.language, size: 20),
          const SizedBox(width: 4),
          Text(
            currentLang == 'ar' ? 'عربي' : 'EN',
            style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600),
          ),
        ],
      ),
      tooltip: currentLang == 'ar' ? 'Switch to English' : 'التبديل إلى العربية',
      onSelected: _changeLanguage,
      itemBuilder: (context) => _languages.map((lang) {
        final isSelected = lang['code'] == currentLang;
        return PopupMenuItem<String>(
          value: lang['code'] as String,
          child: Row(
            children: [
              Text(
                lang['flag'] as String,
                style: const TextStyle(fontSize: 18),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  lang['name'] as String,
                  style: TextStyle(
                    fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                    color: isSelected ? AppTheme.primary600 : null,
                  ),
                ),
              ),
              if (isSelected)
                Icon(
                  Icons.check,
                  size: 18,
                  color: AppTheme.primary600,
                ),
            ],
          ),
        );
      }).toList(),
    );
  }
}

