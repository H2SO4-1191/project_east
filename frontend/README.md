# Project East - Frontend by Fuden

**Educational Institute Management System**

A complete, modern educational institute management platform built with both **React** (Web) and **Flutter** (Mobile) to provide seamless cross-platform experience.

---

## 📋 Overview

Project East is a comprehensive educational institute management system designed to streamline administrative tasks, student management, teacher coordination, and financial tracking. The platform features a beautiful, modern UI with dark/light theme support and is fully responsive across all devices.

---

## 🏗️ Project Structure

```
frontend/
├── react/                          # Web Application (React + Vite)
│   ├── src/
│   │   ├── pages/                 # All page components
│   │   ├── components/            # Reusable UI components
│   │   ├── context/               # State management
│   │   ├── data/                  # Demo data
│   │   └── ...
│   ├── dist/                      # Production build
│   └── package.json
│
├── flutter_app/                    # Mobile Application (Flutter)
│   ├── lib/
│   │   ├── screens/               # All screen widgets
│   │   ├── widgets/               # Reusable widgets
│   │   ├── providers/             # State management
│   │   ├── models/                # Data models
│   │   ├── config/                # Theme & configuration
│   │   └── data/                  # Demo data
│   ├── android/                   # Android platform files
│   ├── assets/                    # Images & animations
│   └── pubspec.yaml
│
└── README.md                       # This file
```

---

## ✨ Features

### 🎯 Core Functionality

- **👤 User Authentication**
  - Email-based login
  - OTP verification
  - Institution registration
  - Secure session management

- **📊 Dashboard**
  - Real-time statistics
  - Interactive charts and graphs
  - Recent activity feed
  - Financial overview

- **👨‍🎓 Student Management**
  - Student profiles
  - Enrollment tracking
  - Grade management
  - Search and filter capabilities

- **👨‍🏫 Teacher Management**
  - Teacher profiles
  - Subject assignments
  - Department organization
  - Status tracking

- **💼 Employee Management**
  - Employee records
  - Role assignments
  - Department tracking
  - Status monitoring

- **📅 Schedule Management**
  - Class timetables
  - Day-wise organization
  - Teacher and room assignments
  - Time slot management

- **💰 Finance Tracking**
  - Invoice management
  - Payment tracking
  - Financial statistics
  - Payment status monitoring

- **⚙️ Settings**
  - Theme preferences (Light/Dark)
  - Institute information
  - App configuration
  - Data management

### 🎨 Design Features

- **🌓 Theme Support**
  - Light and Dark modes
  - Persistent theme preferences
  - Smooth transitions
  - Eye-friendly colors

- **📱 Responsive Design**
  - Mobile-first approach
  - Tablet optimization
  - Desktop layouts
  - Adaptive navigation

- **✨ Modern UI/UX**
  - Material Design principles
  - Smooth animations
  - Intuitive navigation
  - Consistent styling

---

## 🎨 Color Scheme

The application uses a carefully selected color palette:

| Color | Light Mode | Dark Mode | Usage |
|-------|------------|-----------|-------|
| **Primary** | Blue (#2563EB) | Teal (#14B8A6) | Primary actions, links |
| **Navy** | - | #102A43 | Dark backgrounds |
| **Teal** | #14B8A6 | #2DD4BF | Secondary actions, accents |
| **Gold** | #F59E0B | #FCD34D | Financial data, highlights |
| **Background** | #F9FAFB | #102A43 | Main background |
| **Surface** | #FFFFFF | #243B53 | Cards, panels |

---

## 🚀 Getting Started

### Prerequisites

#### For React (Web App):
- Node.js 18+ 
- npm or yarn

#### For Flutter (Mobile App):
- Flutter SDK 3.0+
- Android Studio (for Android)
- Java 17
- Android SDK

---

## 💻 Web Application (React)

### Installation

```bash
cd react
npm install
```

### Development

```bash
npm run dev
```

Access at: `http://localhost:5173`

### Production Build

```bash
npm run build
npm run preview
```

### Technologies Used

- **React 18.3** - UI framework
- **Vite** - Build tool
- **React Router** - Navigation
- **Framer Motion** - Animations
- **Recharts** - Data visualization
- **Tailwind CSS** - Styling
- **React Hot Toast** - Notifications

### Demo Credentials (Web)

- **Email:** `demo@east.edu`
- **OTP Code:** `200471`

---

## 📱 Mobile Application (Flutter)

### Installation

```bash
cd flutter_app
flutter pub get
```

### Development

```bash
# Run on connected device
flutter run

# Run on specific device
flutter run -d <device_id>

# List available devices
flutter devices
```

### Build APK

```bash
# Debug APK
flutter build apk --debug

# Release APK
flutter build apk --release

# App Bundle (for Play Store)
flutter build appbundle --release
```

### Technologies Used

- **Flutter 3.24+** - Framework
- **Provider** - State management
- **FL Chart** - Data visualization
- **Shared Preferences** - Local storage
- **Flutter Animate** - Animations
- **Material Design 3** - UI components

### Demo Credentials (Mobile)

- **Email:** `demo@east.edu`
- **OTP Code:** `200471`

---

## 📸 Screenshots

### Web Application

- **Home Page** - Landing with sign-in options
- **Login** - Email input with validation
- **OTP** - 6-digit verification
- **Dashboard** - Statistics, charts, recent activity
- **Students** - Searchable table view
- **Finance** - Invoice management

### Mobile Application

- **Home Screen** - Animated background, account selection
- **Login Screen** - Clean input design
- **OTP Screen** - Auto-focus 6-digit input
- **Dashboard** - Drawer navigation, bottom bar
- **All Pages** - Identical to web version

---

## 🔐 Security

- Email validation
- OTP verification
- Secure session management
- Input sanitization
- XSS protection

---

## 🎯 Demo Data

Both applications include comprehensive demo data:

- **20 Students** - Various grades and statuses
- **8 Teachers** - Multiple subjects and departments
- **6 Employees** - Different roles and departments
- **12 Schedule Entries** - Weekly class timetables
- **10 Invoices** - Various payment statuses
- **Activity Data** - Weekly statistics
- **Revenue Data** - 6 months of financial data

---

## 📦 Project Features

### Web (React)
✅ Server-side rendering ready  
✅ SEO optimized  
✅ Progressive Web App capable  
✅ Fast page loads with Vite  
✅ Code splitting  
✅ Hot Module Replacement  

### Mobile (Flutter)
✅ Native performance  
✅ Offline capability  
✅ Small app size  
✅ Cross-platform (Android/iOS)  
✅ Material Design 3  
✅ Smooth 60fps animations  

---

## 🛠️ Development

### Code Quality

- ESLint configured (React)
- Flutter analysis enabled
- Consistent code formatting
- Clean architecture
- Type safety
- Well-documented code

### Testing

```bash
# React
cd react
npm run test

# Flutter
cd flutter_app
flutter test
```

---

## 📝 Documentation

- **React:** See `react/README.md`
- **Flutter:** See `flutter_app/README.md` and `flutter_app/SETUP.md`
- **API Documentation:** `project_east_api_endpoints_documentation.html`

---

## 🐛 Troubleshooting

### React Issues

**Port already in use:**
```bash
# Kill process on port 5173
kill -9 $(lsof -ti:5173)
```

**Dependencies error:**
```bash
rm -rf node_modules package-lock.json
npm install
```

### Flutter Issues

**Build fails:**
```bash
flutter clean
flutter pub get
cd android && ./gradlew clean && cd ..
flutter run
```

**Java version error:**
```bash
flutter config --jdk-dir=/usr/lib/jvm/java-17-openjdk-amd64
```

**Device not detected:**
```bash
adb kill-server
adb start-server
flutter devices
```

---

## 🔄 Deployment

### Web (React)

**Netlify:**
```bash
npm run build
# Deploy dist/ folder
```

**Vercel:**
```bash
vercel --prod
```

**GitHub Pages:**
```bash
npm run build
# Push dist/ to gh-pages branch
```

### Mobile (Flutter)

**Google Play Store:**
1. Build app bundle: `flutter build appbundle --release`
2. Sign the bundle
3. Upload to Play Console

**Direct APK:**
1. Build APK: `flutter build apk --release`
2. Share `build/app/outputs/flutter-apk/app-release.apk`

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

---

## 📄 License

This project is part of the Project East educational management system.

---

## 👥 Team

- **Project:** Project East
- **Version:** 1.0.0
- **Year:** 2025

---



---

## 🎉 Acknowledgments

- React team for the excellent framework
- Flutter team for the amazing mobile framework
- All open-source contributors
- The education community for inspiration

---

## 📊 Stats

- **Total Files:** 100+
- **Lines of Code:** 10,000+
- **Screens/Pages:** 11 each (22 total)
- **Reusable Components:** 20+
- **Features:** 50+
- **Supported Languages:** JavaScript, Dart
- **Platforms:** Web, Android, iOS (iOS ready)

---

## 🚀 Quick Start Commands

**Web Development:**
```bash
cd react && npm install && npm run dev
```

**Mobile Development:**
```bash
cd flutter_app && flutter pub get && flutter run
```

**Production Web Build:**
```bash
cd react && npm run build
```

**Production Mobile Build:**
```bash
cd flutter_app && flutter build apk --release
```

---

**Made with ❤️ for the education community**

**Project East - Empowering Education Through Technology**

