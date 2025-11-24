# Flutter API Integration Documentation

## Overview

The Flutter app has been updated to match the React frontend's API structure with full JWT authentication support. All API calls, endpoints, and request formats now reflect the React project implementation.

## API Base URL

```dart
https://projecteastapi.ddns.net
```

This can be configured in `lib/services/api_service.dart`.

## Architecture

### Services Layer

**`lib/services/api_service.dart`**
- Centralized API service handling all HTTP requests
- JWT token management with automatic refresh
- Error handling with custom `ApiException` class
- Matches React's `authService.js` implementation

### Models

**`lib/models/auth_response.dart`**
- `JwtPayload` - Decodes and parses JWT tokens
- `OtpVerificationResponse` - OTP verification response structure
- `SignupResponse` - Signup response structure
- `VerificationStatusResponse` - Institution verification status

### State Management

**`lib/providers/auth_provider.dart`**
- Replaces the old `InstituteProvider`
- Manages authentication state and JWT tokens
- Handles token refresh automatically
- Persists authentication data using SharedPreferences
- Provides methods for protected API calls

## API Endpoints

### Authentication Endpoints

#### 1. Request OTP (Login)
```dart
POST /registration/login/
Body: { "email": "user@example.com" }
```

**Usage:**
```dart
final response = await ApiService.requestOtp(email);
```

#### 2. Sign Up
```dart
POST /registration/signup/
Body: {
  "username": "institution_name",
  "email": "contact@institution.edu",
  "first_name": "John",
  "last_name": "Doe",
  "user_type": "institution"
}
```

**Usage:**
```dart
final response = await ApiService.signup(payload);
```

#### 3. Verify OTP
```dart
POST /registration/otp/
Body: {
  "email": "user@example.com",
  "otp_code": "123456"
}
Response: {
  "access": "jwt_access_token",
  "refresh": "jwt_refresh_token",
  "user_id": 123,
  "user_type": "institution"
}
```

**Usage:**
```dart
final result = await ApiService.verifyOtp(
  email: email,
  otpCode: otpCode,
);
```

#### 4. Refresh Access Token
```dart
POST /registration/refresh/ (or /refresh/ or /token/refresh/)
Body: { "refresh": "refresh_token" }
Response: {
  "access": "new_access_token",
  "refresh": "new_refresh_token" (optional)
}
```

**Usage:**
```dart
final tokens = await ApiService.refreshAccessToken(refreshToken);
```

### Protected Endpoints

All protected endpoints require JWT authentication via Bearer token in the Authorization header.

#### 5. Check Verification Status
```dart
GET /registration/is-verified/
Headers: { "Authorization": "Bearer {access_token}" }
Response: { "is_verified": true/false }
```

**Usage:**
```dart
final status = await ApiService.checkVerificationStatus(email);
```

#### 6. Get Dashboard Statistics
```dart
GET /institution/total-students/
GET /institution/total-lecturers/
GET /institution/total-staff/
GET /institution/active-students/
GET /institution/active-lecturers/
GET /institution/active-staff/
```

**Usage:**
```dart
final authProvider = Provider.of<AuthProvider>(context, listen: false);
final stats = await authProvider.getDashboardStats();
```

#### 7. Get Schedule
```dart
GET /institution/schedule/
Response: { "schedule": [...] }
```

**Usage:**
```dart
final authProvider = Provider.of<AuthProvider>(context, listen: false);
final schedule = await authProvider.getSchedule();
```

#### 8. Verify Institution (with documents)
```dart
PUT /institution/institution-verify/
Content-Type: multipart/form-data
Fields: title, location, phone_number, about
Files: profile_image, idcard_back, idcard_front, residence_front, residence_back
```

**Usage:**
```dart
final response = await ApiService.verifyInstitution(
  accessToken: accessToken,
  refreshToken: refreshToken,
  payload: {
    'title': 'Institution Title',
    'location': 'City, Country',
    'phone_number': '+1234567890',
    'about': 'About the institution',
  },
  onTokenRefreshed: (tokens) {
    // Handle token refresh
  },
);
```

#### 9. Edit Institution Profile
```dart
PUT /institution/edit-profile/
Content-Type: multipart/form-data
Fields: username, title, location, phone_number, about
```

**Usage:**
```dart
final response = await ApiService.editInstitutionProfile(
  accessToken: accessToken,
  refreshToken: refreshToken,
  payload: {
    'username': 'new_username',
    'title': 'Updated Title',
    // ... other fields
  },
  onTokenRefreshed: (tokens) {
    // Handle token refresh
  },
);
```

## JWT Token Management

### Token Storage

Tokens are stored securely using `SharedPreferences`:

```dart
{
  "accessToken": "jwt_access_token",
  "refreshToken": "jwt_refresh_token",
  "isAuthenticated": true,
  "email": "user@example.com",
  "name": "User Name",
  "userId": 123,
  "userType": "institution",
  "isVerified": false
}
```

### Automatic Token Refresh

The `AuthProvider` automatically handles token refresh when API calls return 401 Unauthorized:

1. Detects 401 response
2. Attempts to refresh using refresh token
3. Retries original request with new access token
4. Updates stored tokens
5. If refresh fails, triggers session expiration

### Token Decoding

JWT tokens are decoded to extract user information:

```dart
final payload = JwtPayload.decode(accessToken);
final email = payload?.email;
final username = payload?.username;
final firstName = payload?.firstName;
```

## Authentication Flow

### Login Flow

1. User enters email on login screen
2. App calls `ApiService.requestOtp(email)`
3. Backend sends OTP to email
4. User enters 6-digit OTP
5. App calls `ApiService.verifyOtp(email, otpCode)`
6. Backend returns JWT tokens
7. App decodes JWT and extracts user info
8. App checks verification status
9. App stores authentication data via `AuthProvider`
10. User is redirected to dashboard

### Signup Flow

1. User fills signup form (username, email, first_name, last_name)
2. App calls `ApiService.signup(payload)`
3. Backend creates account and sends OTP
4. User is redirected to login screen with pre-filled email
5. User follows login flow to verify email and access dashboard

### Protected Routes

Protected routes use the `ProtectedRoute` widget:

```dart
routes: {
  '/dashboard': (context) => const ProtectedRoute(
    child: DashboardScreen(),
  ),
}
```

The widget checks authentication status and redirects to login if not authenticated.

## Error Handling

### ApiException

Custom exception class that provides structured error information:

```dart
class ApiException {
  final int? status;          // HTTP status code
  final String message;       // User-friendly error message
  final bool suggestSignup;   // Whether to suggest signup
  final Map<String, dynamic>? data;  // Raw error data
}
```

### Error Handling Example

```dart
try {
  final response = await ApiService.requestOtp(email);
  // Success handling
} catch (e) {
  if (e is ApiException) {
    print('Error: ${e.message}');
    if (e.suggestSignup) {
      // Show signup prompt
    }
  } else {
    print('Network error');
  }
}
```

## Session Management

### Logout

```dart
final authProvider = Provider.of<AuthProvider>(context, listen: false);
await authProvider.logout();
Navigator.pushReplacementNamed(context, '/');
```

### Session Expiration

When a refresh token expires or is invalid:

1. `AuthProvider.onSessionExpired()` is called
2. All authentication data is cleared
3. User is redirected to login screen

## Security Features

1. **JWT Authentication** - Secure token-based authentication
2. **Automatic Token Refresh** - Seamless token renewal
3. **Secure Storage** - Tokens stored in SharedPreferences
4. **HTTPS Only** - All API calls use HTTPS
5. **Token Expiration Handling** - Automatic session cleanup
6. **Protected Routes** - Authentication required for sensitive screens

## Migration from Old Implementation

### Changes Made

1. **Replaced `InstituteProvider`** with `AuthProvider`
   - Added JWT token management
   - Added automatic token refresh
   - Added authentication state management

2. **Created `ApiService`**
   - Centralized all API calls
   - Implemented error handling
   - Added token refresh logic

3. **Updated Screens**
   - `LoginScreen` - Now uses real API
   - `OTPScreen` - Implements JWT authentication
   - `SignupScreen` - New screen matching React version
   - `DashboardScreen` - Uses `AuthProvider`

4. **Added Protected Routes**
   - `ProtectedRoute` widget for authentication checks

5. **Updated Dependencies**
   - Added `http: ^1.1.0` for API calls

## Testing

### Test Credentials

The API may provide test credentials for development. Check with the backend team for current test accounts.

### Testing Checklist

- [ ] Login with valid email
- [ ] Login with invalid email (should show error)
- [ ] OTP verification with correct code
- [ ] OTP verification with incorrect code
- [ ] Signup new institution
- [ ] Token refresh on 401 response
- [ ] Session expiration handling
- [ ] Protected route access without authentication
- [ ] Dashboard data loading
- [ ] Logout functionality

## Troubleshooting

### Common Issues

1. **Network Error**
   - Check internet connection
   - Verify API base URL is correct
   - Check if backend is running

2. **401 Unauthorized**
   - Token may be expired
   - Try logging out and logging in again
   - Check if refresh token is valid

3. **OTP Not Received**
   - Check email spam folder
   - Verify email address is correct
   - Check backend email configuration

4. **Token Refresh Fails**
   - Refresh token may be expired
   - User will be logged out automatically
   - Need to login again

## Future Enhancements

1. Biometric authentication
2. Remember me functionality
3. Offline mode with cached data
4. Push notifications for OTP
5. Social login integration

## Support

For API issues or questions, contact the backend development team or refer to the API documentation at:
- `api_doc.html`
- `project_east_api_endpoints_documentation.html`


