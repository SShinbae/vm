# 🚗 Vehicles Management App

A comprehensive vehicle management application built with **React Native** and **Expo**, featuring multi-platform support (iOS, Android, and Web) with advanced analytics, group sharing, and logging capabilities.

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Getting Started](#-getting-started)
- [Project Structure](#-project-structure)
- [Core Features](#-core-features)
- [Recent Updates](#-recent-updates)
- [Documentation](#-documentation)
- [Development](#-development)
- [Testing](#-testing)
- [Contributing](#-contributing)

## ✨ Features

### 🚙 Vehicle Management

- **Complete CRUD Operations**: Add, view, edit, and delete vehicles
- **Rich Media Support**: Upload and manage vehicle images with gallery support
- **Detailed Vehicle Information**: Track make, model, year, license plate, VIN, and more
- **Current Mileage Tracking**: Automatic updates based on latest mileage logs
- **Vehicle Sharing**: Share vehicles with groups for collaborative management

### 👥 Group Management

- **Create & Manage Groups**: Organize users into groups (e.g., family, company fleet)
- **Group Invitations**: Invite users via email with secure invitation system
- **Member Management**: Add/remove members, view group statistics
- **Shared Vehicle Access**: Group members can view and edit shared vehicles

### 📊 Advanced Analytics

- **Comprehensive Dashboard**: Overview of fuel costs, service expenses, and mileage
- **Interactive Charts**: Visual representation of expenses over time using Victory Native
- **Vehicle Comparison**: Compare metrics across multiple vehicles
- **Filtered Views**: Filter analytics by vehicle, date range, and group
- **Shared Vehicle Analytics**: Includes data from both owned and group-shared vehicles

### 📝 Log Management

- **Mileage Logs**: Track odometer readings with automatic validation
- **Fuel Logs**: Record fuel purchases with cost and quantity tracking
- **Service Logs**: Document maintenance with costs, descriptions, and service types
- **Comprehensive Permissions**:
  - View, add, and edit logs for owned and shared vehicles
  - Only vehicle owners can delete logs and vehicles

### 🔔 Notifications

- **Group Invitations**: Real-time notifications for group invites
- **In-App Notifications**: Centralized notification center
- **Push Notification Support**: Expo Notifications integration (ready for expansion)

### 🔐 Authentication & Security

- **Supabase Auth**: Secure authentication with email/password
- **Row Level Security (RLS)**: Database-level access control
- **Permission System**: Granular permissions for vehicle and log operations
- **Secure Image Storage**: Protected media storage with Supabase Storage

## 🛠 Tech Stack

### Frontend

- **React Native** (0.81.4) - Cross-platform mobile framework
- **Expo** (SDK 54) - Development platform and tooling
- **TypeScript** - Type-safe development
- **React Native Unistyles** (v2.43.0) - Modern styling solution with theming
- **Expo Router** - File-based navigation

### UI & Visualization

- **Victory Native** - Advanced charting library
- **React Native Skia** - High-performance graphics
- **Expo Image** - Optimized image component
- **Bottom Sheet** - Smooth modal interactions

### Backend & Database

- **Supabase** - Backend-as-a-Service
  - PostgreSQL database
  - Authentication
  - Row Level Security (RLS)
  - Real-time subscriptions
  - Storage for images
- **Database Functions**: Custom SQL functions for complex operations

### State & Data Management

- **React Hooks** - Modern state management
- **Async Storage** - Persistent local storage
- **Date-fns** - Date manipulation and formatting

### Development Tools

- **Jest** - Testing framework
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Husky** - Git hooks
- **Lint-staged** - Pre-commit linting
- **TypeScript** - Static type checking

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **Expo CLI** (installed globally or via npx)
- **Supabase Account** (for backend services)

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/SShinbae/vehicles-management-wawezz.git
   cd vehicles-management-wawezz
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   Create a `.env` file in the root directory:

   ```env
   EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Set up Supabase**
   - Create a new Supabase project
   - Run the SQL migrations from the `database/` folder
   - Configure Storage buckets for images
   - Set up RLS policies (included in migration files)

5. **Start the development server**

   ```bash
   npm start
   # or
   npx expo start
   ```

6. **Run on your preferred platform**
   - Press `i` for iOS simulator
   - Press `a` for Android emulator
   - Press `w` for web browser
   - Scan QR code with Expo Go app for physical device

## 📁 Project Structure

```
vehicles-management-wawezz/
├── app/                          # Main application screens (Expo Router)
│   ├── (auth)/                   # Authentication flow
│   ├── (tabs)/                   # Tab-based navigation
│   │   ├── index.tsx            # Dashboard/Home
│   │   ├── vehicles.tsx         # Vehicles list
│   │   ├── analytics.tsx        # Analytics dashboard
│   │   ├── logs.tsx             # Log management
│   │   ├── groups.tsx           # Group management
│   │   └── profile.tsx          # User profile
│   ├── auth/                     # Auth screens
│   ├── groups/                   # Group detail screens
│   ├── logs/                     # Log entry screens
│   ├── vehicles/                 # Vehicle detail screens
│   ├── _layout.tsx              # Root layout
│   ├── index.tsx                # Entry point
│   └── notifications.tsx        # Notifications screen
├── components/                   # Reusable components
│   ├── ui/                      # UI components (Button, Input, etc.)
│   ├── layout/                  # Layout components
│   ├── forms/                   # Form components
│   ├── charts/                  # Chart components
│   ├── vehicles/                # Vehicle-specific components
│   ├── analytics/               # Analytics components
│   └── dashboard/               # Dashboard components
├── lib/                         # Business logic and utilities
│   ├── services/                # API services
│   │   ├── vehicleService.ts   # Vehicle operations
│   │   ├── loggingService.ts   # Log operations
│   │   ├── groupService.ts     # Group operations
│   │   └── analyticsService.ts # Analytics calculations
│   ├── supabase/                # Supabase client and queries
│   ├── analytics/               # Analytics utilities
│   └── utils/                   # Helper functions
├── hooks/                       # Custom React hooks
│   ├── useAnalytics.ts         # Analytics data hook
│   ├── useVehicles.ts          # Vehicle data hook
│   └── useColorScheme.ts       # Theme hook
├── types/                       # TypeScript type definitions
│   ├── index.ts                # Core types
│   └── database-v2.ts          # Database types
├── constants/                   # App constants and themes
├── database/                    # SQL migration files
├── docs/                        # Documentation
├── assets/                      # Images, fonts, etc.
├── unistyles.ts                # Theme configuration
└── package.json                # Dependencies and scripts
```

## 🎯 Core Features

### Vehicle Management

- **Add Vehicle**: Comprehensive form with image upload, make/model, year, license plate, VIN
- **Edit Vehicle**: Update vehicle details (owner and group members)
- **Delete Vehicle**: Remove vehicle (owner only)
- **View Details**: See vehicle information, sharing status, and log statistics
- **Image Gallery**: Multiple images per vehicle with primary image selection
- **Sharing Management**: Share with multiple groups, view sharing status

### Group Features

- **Create Groups**: Set up groups for family, company, or friends
- **Invite Members**: Send email invitations with secure tokens
- **Accept/Reject Invitations**: Members can manage their invites
- **View Members**: See all group members with profile information
- **Share Vehicles**: Select which vehicles to share with each group
- **Group Analytics**: View combined analytics for group-shared vehicles

### Analytics & Reporting

- **Expense Overview**: Total costs across all vehicles
- **Fuel Analytics**: Average costs, consumption patterns, price trends
- **Service Analytics**: Maintenance costs, service frequency
- **Mileage Tracking**: Distance traveled, mileage trends
- **Chart Visualizations**: Line charts, bar charts, pie charts
- **Export Data**: Share reports and charts
- **Date Filtering**: Custom date ranges for analysis

### Log Types

1. **Mileage Logs**
   - Record odometer readings
   - Automatic validation (increasing mileage)
   - Auto-update vehicle's current mileage
2. **Fuel Logs**
   - Track fuel purchases
   - Record quantity, cost, fuel type
   - Calculate fuel efficiency
3. **Service Logs**
   - Document maintenance activities
   - Categorize service types (oil change, tire rotation, etc.)
   - Track service costs and providers
   - Add detailed notes

## 🔄 Recent Updates

### ✅ Latest Features (November 2024)

#### Shared Vehicle Analytics Integration

- Analytics dashboard now includes data from group-shared vehicles
- Vehicle filter shows all accessible vehicles (owned + shared)
- Proper permission handling for shared vehicle operations

#### Enhanced Permission System

- **View/Add/Edit**: All members (owner + group members)
- **Delete**: Vehicle owners only
- Consistent error messages across all operations
- Database-level RLS policies + application-level checks

#### Vehicle Edit Permissions

- Group members can now edit shared vehicle details
- Permission validation using `canUserAccessVehicle()` helper
- Clear error messages for unauthorized actions

#### Date Format Standardization

- Consistent `MM/DD/YYYY` format across all date displays
- Unified date handling with `date-fns`
- Proper locale support

### 🎨 Style Migration (Completed)

- Migrated from NativeWind to React Native Unistyles v2.43.0
- Improved performance and type safety
- Comprehensive theme system with light/dark mode support
- Responsive breakpoints for all screen sizes

### 📦 Component Library (Phase 5 Complete)

- 5 template components: PageLayout, DashboardLayout, DetailLayout, FormLayout, ListLayout
- 64 comprehensive test cases
- Full TypeScript support with generics
- Accessibility features built-in

## 📚 Documentation

Comprehensive documentation available in the `docs/` and root directory:

- **[MIGRATION_SUMMARY.md](./MIGRATION_SUMMARY.md)** - NativeWind to Unistyles migration guide
- **[UNISTYLES_MIGRATION.md](./UNISTYLES_MIGRATION.md)** - Detailed styling migration instructions
- **[ANALYTICS_SHARED_VEHICLES_UPDATE.md](./ANALYTICS_SHARED_VEHICLES_UPDATE.md)** - Shared vehicle analytics implementation
- **[VEHICLE_EDIT_PERMISSIONS_UPDATE.md](./VEHICLE_EDIT_PERMISSIONS_UPDATE.md)** - Permission system updates
- **[DATE_FORMAT_UPDATE.md](./DATE_FORMAT_UPDATE.md)** - Date formatting standardization
- **[PHASE_3_COMPLETE.md](./PHASE_3_COMPLETE.md)** - Component system Phase 3
- **[PHASE_4_COMPLETE.md](./PHASE_4_COMPLETE.md)** - Component system Phase 4
- **[PHASE_5_COMPLETE.md](./PHASE_5_COMPLETE.md)** - Component system Phase 5 (Templates)
- **[docs/calculation-errors-and-fixes.md](./docs/calculation-errors-and-fixes.md)** - Analytics system fixes

## 🧪 Testing

### Run Tests

```bash
npm test
```

### Run Tests in Watch Mode

```bash
npm test -- --watch
```

### Test Coverage

- Unit tests for services and utilities
- Component testing with React Native Testing Library
- 64+ test cases for template components
- Integration tests for critical flows

## 🛠 Development

### Available Scripts

```bash
# Start development server
npm start

# Start for specific platform
npm run ios          # iOS simulator
npm run android      # Android emulator
npm run web          # Web browser

# Build for production
npm run build        # Web build
npm run export       # Export static files

# Code quality
npm run lint         # Check code style
npm run lint:fix     # Fix linting issues
npm run format       # Format with Prettier
npm test             # Run tests
```

### Code Quality Tools

- **ESLint**: Enforces code style and catches errors
- **Prettier**: Automatic code formatting
- **TypeScript**: Static type checking
- **Husky**: Pre-commit hooks
- **Lint-staged**: Runs checks on staged files

### Development Best Practices

1. **Type Safety**: Use TypeScript for all new code
2. **Component Structure**: Follow atomic design principles
3. **State Management**: Use hooks and context appropriately
4. **Error Handling**: Implement proper error boundaries
5. **Accessibility**: Follow WCAG guidelines
6. **Testing**: Write tests for critical functionality
7. **Documentation**: Keep code documented and README updated

## 🌐 Multi-Platform Support

### iOS

- Optimized for iPhone and iPad
- Native iOS design patterns
- Haptic feedback support

### Android

- Material Design compliance
- Android-specific optimizations
- Back button handling

### Web

- Responsive design for all screen sizes
- Progressive Web App (PWA) ready
- Web-specific optimizations

## 🔐 Security Features

- **Row Level Security (RLS)**: Database-level access control
- **Authentication**: Secure Supabase auth with email/password
- **Token Management**: Secure invitation tokens
- **Image Security**: Protected storage buckets
- **Permission Validation**: Multi-layer permission checks
- **SQL Injection Protection**: Parameterized queries
- **XSS Protection**: Input sanitization

## 📈 Performance Optimizations

- **Image Optimization**: Expo Image with caching
- **Lazy Loading**: Components and screens
- **Memoization**: React.memo for expensive components
- **Virtual Lists**: Efficient scrolling for large datasets
- **Optimistic Updates**: Immediate UI feedback
- **Background Data Fetching**: Improved user experience

## 🤝 Contributing

We welcome contributions! Please follow these guidelines:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit changes**: `git commit -m 'Add amazing feature'`
4. **Push to branch**: `git push origin feature/amazing-feature`
5. **Open a Pull Request**

### Commit Message Convention

Follow conventional commits:

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes (formatting, etc.)
- `refactor:` Code refactoring
- `test:` Adding or updating tests
- `chore:` Maintenance tasks

## 📄 License

This project is private and proprietary.

## 👤 Author

**Wawezz Team**

- GitHub: [@SShinbae](https://github.com/SShinbae)

## 🙏 Acknowledgments

- **Expo Team** - Amazing development platform
- **Supabase** - Powerful backend infrastructure
- **React Native Community** - Excellent libraries and tools
- **Victory Native** - Beautiful charting library

---

**Built with ❤️ using React Native and Expo**

_Last Updated: November 22, 2024_
