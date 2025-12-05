# React to Flutter Porting Plan

## Screens to Port

### 1. Feed Page (/)
**React:** `react/src/pages/Feed.jsx`
**Flutter:** `flutter_app/lib/screens/feed_screen.dart`

**Features:**
- Navigation bar with logo, search, theme toggle, user menu
- Hero section with gradient background
- Grid of institution advertisements (6 cards)
- Each card shows: image, title, location, description, student/lecturer count
- Subscribe/Learn More buttons
- Footer
- Responsive design

### 2. Students Page
**React:** `react/src/pages/dashboard/Students.jsx`
**Flutter:** `flutter_app/lib/screens/dashboard/students_page.dart`

**Features:**
- API endpoint: `/institution/students-list/`
- Search by name, ID, email
- Filter by status (Active/Inactive)
- Filter by grade/level
- Refresh button
- Pagination (Previous/Next)
- Loading skeleton
- Empty state
- Error handling with fallback to demo data
- Table with columns: Name (with avatar), Email, Level, Phone, Status, ID
- Shows count: "X of Y students (live/demo)"

### 3. Teachers/Lecturers Page
**React:** `react/src/pages/dashboard/Teachers.jsx`
**Flutter:** `flutter_app/lib/screens/dashboard/teachers_page.dart`

**Features:**
- API endpoint: `/institution/lecturers-list/`
- Search by name, email, specialty
- Refresh button
- Pagination
- Loading skeleton
- Empty state
- Table with columns: Name (with avatar), ID, Specialty, Experience, Phone, Status, Actions (Email/Call buttons)
- Teal color scheme

### 4. Staff/Employees Page
**React:** `react/src/pages/dashboard/Employees.jsx`
**Flutter:** `flutter_app/lib/screens/dashboard/employees_page.dart`

**Features:**
- API endpoint: `/institution/staff-list/`
- Search by name, duty, phone
- Refresh button
- Pagination
- Loading skeleton
- Empty state
- Table with columns: Name (with avatar), ID, Duty, Phone, Salary, Status
- Purple color scheme

## Components to Create

### Skeleton Loaders
**React:** `react/src/components/Skeleton.jsx`
**Flutter:** `flutter_app/lib/widgets/skeleton_widgets.dart`

- `TableSkeleton` - Animated loading skeleton for tables
- `ListEmptyState` - Empty state with icon, message, and action button

### Enhanced Demo Data
**React:** `react/src/data/enhancedDemoData.js`
**Flutter:** `flutter_app/lib/data/enhanced_demo_data.dart`

- Students data
- Teachers data
- Employees data

## API Endpoints to Integrate

All endpoints already exist in `ApiService`, need to add specific ones:

1. `/institution/students-list/` - GET with pagination, filters
2. `/institution/lecturers-list/` - GET with pagination
3. `/institution/staff-list/` - GET with pagination

## Implementation Order

1. ✅ Create skeleton loading widgets
2. ✅ Create enhanced demo data file
3. ✅ Create Feed screen
4. ✅ Port Students page with full API integration
5. ✅ Port Teachers page with full API integration
6. ✅ Port Staff page with full API integration
7. ✅ Update app routing
8. ✅ Test all screens

## Design Consistency

### Colors
- **Students:** Blue gradient (`from-primary-600 to-primary-700`)
- **Teachers:** Teal gradient (`from-teal-600 to-teal-700`)
- **Staff:** Purple gradient (`from-purple-600 to-purple-700`)

### Common Patterns
- Search bar with icon on left
- Refresh button with spinning icon when loading
- Pagination controls at bottom
- "X of Y items (live/demo)" indicator
- Error messages in amber color
- Empty states with icon, title, message, and action button
- Hover effects on table rows
- Status badges (green for active, red for inactive)

### Responsive Breakpoints
- Mobile: Single column, bottom navigation
- Tablet: 2 columns
- Desktop: 3 columns, full sidebar

## Testing Checklist

- [ ] Feed page loads and displays cards
- [ ] Navigation works (login, signup, dashboard)
- [ ] Theme toggle works
- [ ] User menu shows when authenticated
- [ ] Students page loads with API data
- [ ] Students search works
- [ ] Students filters work (status, grade)
- [ ] Students pagination works
- [ ] Students shows loading skeleton
- [ ] Students shows empty state when no results
- [ ] Students falls back to demo data on error
- [ ] Teachers page loads with API data
- [ ] Teachers search works
- [ ] Teachers pagination works
- [ ] Staff page loads with API data
- [ ] Staff search works
- [ ] Staff pagination works
- [ ] All pages handle token refresh
- [ ] All pages handle session expiration













