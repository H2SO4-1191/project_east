# Project East - Educational Institute Management System

A modern, responsive frontend demo for an Educational Institute Management System built with React, Vite, and Tailwind CSS.

## Features

### 🏠 Home Page
- Clean landing page with Login and Sign In options
- Multi-step registration flow for Institutions
- Student and Teacher options (coming soon)
- Smooth transitions and animations

### 🔐 Login Page
- Simple and secure login interface
- Demo credentials provided for testing
- Form validation and error handling

### 📊 Dashboard
- Comprehensive institution dashboard
- Sidebar navigation with 4 main sections:
  - **Students**: View all enrolled students with their details
  - **Teachers**: Manage teaching staff and their subjects
  - **Employees**: Track non-teaching staff members
  - **Schedule**: View class timetables and schedules
- Statistics cards showing totals
- Responsive tables for data display
- Mobile-friendly with hamburger menu

## Demo Credentials

**Login:**
- Email: `demo@east.edu`
- Password: `12345`

## Technology Stack

- **React 18** - Modern UI library
- **Vite** - Fast build tool and dev server
- **React Router DOM** - Client-side routing
- **Tailwind CSS** - Utility-first CSS framework
- **Context API** - State management

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Clone the repository or navigate to the project directory:
```bash
cd project_east
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to:
```
http://localhost:5173
```

### Build for Production

```bash
npm run build
```

The production-ready files will be in the `dist` directory.

### Preview Production Build

```bash
npm run preview
```

## Project Structure

```
project_east/
├── public/                 # Static assets
├── src/
│   ├── context/           # React Context for state management
│   │   └── InstituteContext.jsx
│   ├── data/              # Demo/mock data
│   │   └── demoData.js
│   ├── pages/             # Page components
│   │   ├── Home.jsx
│   │   ├── Login.jsx
│   │   └── Dashboard.jsx
│   ├── App.jsx            # Main app component with routing
│   ├── main.jsx           # App entry point
│   └── index.css          # Global styles and Tailwind imports
├── index.html             # HTML template
├── package.json           # Dependencies and scripts
├── tailwind.config.js     # Tailwind configuration
├── vite.config.js         # Vite configuration
└── README.md              # This file
```

## Design Features

- **Color Palette**: Professional blue and white theme
- **Responsive Design**: Mobile-first approach, works on all devices
- **Smooth Transitions**: All interactions have smooth animations
- **Modern UI**: Clean, minimalist interface following best UX practices
- **Accessibility**: Semantic HTML and proper contrast ratios

## Future Enhancements

- Backend integration with REST API
- Database connectivity
- User authentication with JWT
- CRUD operations for all entities
- File upload functionality
- Advanced search and filtering
- Report generation
- Email notifications
- Student and Teacher portals
- Attendance tracking
- Grade management
- Fee management

## Contributing

This is a demo project. Feel free to fork and customize for your needs.

## License

MIT License - feel free to use this project for personal or commercial purposes.

## Support

For questions or issues, please create an issue in the repository.

---

**Built with ❤️ using React and Tailwind CSS**

