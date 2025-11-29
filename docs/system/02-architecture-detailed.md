# Detailed System Architecture

**Document Version:** 1.0
**Last Updated:** November 29, 2024

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Frontend Architecture](#frontend-architecture)
3. [Backend Architecture](#backend-architecture)
4. [Data Flow](#data-flow)
5. [Security Architecture](#security-architecture)
6. [Multi-Platform Architecture](#multi-platform-architecture)

---

## Architecture Overview

### Architectural Style

The Vehicles Management Application follows a **Client-Server Architecture** with a **Backend-as-a-Service (BaaS)** model, specifically:

- **Pattern:** Layered Architecture with Service-Oriented Design
- **Communication:** RESTful API over HTTPS + WebSocket for real-time
- **State Management:** Unidirectional data flow with React Context API
- **Rendering:** Client-side rendering with React Native

### Key Architectural Principles

1. **Separation of Concerns**
   - Clear boundaries between presentation, business logic, and data layers
   - Service classes encapsulate business logic
   - UI components focus on presentation only

2. **Single Responsibility**
   - Each component/service has one primary responsibility
   - Services are focused on specific domains (vehicles, groups, analytics)

3. **DRY (Don't Repeat Yourself)**
   - Reusable UI components library
   - Shared utilities and helper functions
   - Common TypeScript types and interfaces

4. **Type Safety**
   - Full TypeScript implementation
   - Auto-generated database types from Supabase
   - Strict type checking enabled

5. **Scalability**
   - Component-based architecture allows horizontal scaling
   - Supabase provides built-in scalability
   - Optimized queries with database functions

---

## Frontend Architecture

### Layer Organization

```
┌─────────────────────────────────────────────────────────────┐
│                   PRESENTATION LAYER                         │
│  ┌──────────────────────────────────────────────────────┐   │
│  │             Screens (app/)                           │   │
│  │  - File-based routing with Expo Router              │   │
│  │  - Tab navigation, Stack navigation                 │   │
│  │  - Screen-specific logic                            │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │          Components (components/)                    │   │
│  │  - Reusable UI components                           │   │
│  │  - Layout components                                │   │
│  │  - Charts and visualizations                        │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                  BUSINESS LOGIC LAYER                        │
│  ┌──────────────────────────────────────────────────────┐   │
│  │            Custom Hooks (hooks/)                     │   │
│  │  - useVehicles, useAnalytics                        │   │
│  │  - useDashboardData, useAuth                        │   │
│  │  - State management and side effects               │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │          Service Layer (lib/services/)               │   │
│  │  - VehicleService, GroupService                     │   │
│  │  - AnalyticsService, LoggingService                 │   │
│  │  - API communication logic                          │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    DATA LAYER                                │
│  ┌──────────────────────────────────────────────────────┐   │
│  │         Supabase Client (lib/supabase/)             │   │
│  │  - Database queries                                 │   │
│  │  - Authentication                                   │   │
│  │  - Storage operations                               │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │         Type Definitions (types/)                   │   │
│  │  - Database types (auto-generated)                  │   │
│  │  - Application types                                │   │
│  │  - Form types                                       │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                   CONTEXT LAYER                              │
│  - AuthContext (Authentication state)                        │
│  - ThemeContext (Theme and styling)                          │
│  - NotificationContext (Notifications)                       │
│  - DialogContext (Modals and alerts)                         │
└─────────────────────────────────────────────────────────────┘
```

### Component Architecture

#### 1. Screen Components (`app/`)

**File-based Routing Structure:**
```
app/
├── (tabs)/              # Main tab navigation
│   ├── index.tsx        # Dashboard/Home
│   ├── vehicles.tsx     # Vehicles list
│   ├── analytics/       # Analytics with sub-tabs
│   ├── logs.tsx         # Logs management
│   ├── groups.tsx       # Groups (placeholder)
│   └── profile.tsx      # User profile
├── (auth)/              # Authentication flow
│   ├── login.tsx
│   ├── register.tsx
│   └── forgot-password.tsx
├── groups/              # Group detail screens
│   ├── [id].tsx         # Group detail
│   ├── create.tsx       # Create group
│   └── [id]/invite.tsx  # Invite members
├── logs/                # Log entry screens
│   ├── fuel/
│   ├── mileage/
│   └── service/
├── vehicles/            # Vehicle screens
├── notifications.tsx    # Notifications screen
└── _layout.tsx          # Root layout
```

**Screen Responsibilities:**
- Coordinate data fetching via hooks
- Handle user interactions
- Manage local state
- Render UI components
- Navigation logic

#### 2. Reusable Components (`components/`)

**Component Categories:**

a) **UI Components** (`components/ui/`)
   - Button, Input, Card, Modal
   - LoadingSpinner, Skeleton
   - NotificationBell, ImagePicker
   - Platform-agnostic design

b) **Analytics Components** (`components/analytics/`)
   - MetricCard, StatCard, TrendCard
   - PeriodSelector, VehicleFilter
   - AnalyticsHeader, AnalyticsTabBar
   - Domain-specific, reusable

c) **Chart Components** (`components/charts/`)
   - LineChart, BarChart, PieChart
   - Platform-specific implementations (.web.tsx)
   - Victory Native for mobile, Recharts for web

d) **Layout Components** (`components/layout/`)
   - ResponsiveGrid, WebLayout
   - WebNavbar, WebSidebar
   - Responsive design utilities

e) **Form Components** (`components/forms/`)
   - VehicleSelector, VehicleOption
   - FuelPriceChip, ServiceItemsInput
   - Form-specific inputs

**Component Design Principles:**
- **Composability:** Components can be nested
- **Props-driven:** Configuration via props
- **Type-safe:** Full TypeScript props interfaces
- **Accessibility:** ARIA labels, screen reader support
- **Responsive:** Adapt to different screen sizes

#### 3. Custom Hooks (`hooks/`)

**Hook Categories:**

a) **Data Hooks**
   - `useVehicles()` - Fetch and manage vehicle data
   - `useAnalytics()` - Analytics data with filtering
   - `useDashboardData()` - Dashboard aggregated data
   - `useProfileStats()` - User profile statistics

b) **UI Hooks**
   - `useColorScheme()` - Theme detection
   - `useResponsiveLayout()` - Responsive breakpoints
   - `useWebAlert()` - Platform-specific alerts
   - `useWebTitle()` - Document title management

c) **Business Logic Hooks**
   - `useAddFuelLog()` - Fuel log creation logic
   - `useVehicleFilters()` - Vehicle filtering state
   - `useVehicleStats()` - Vehicle-specific stats

**Hook Benefits:**
- Encapsulate reusable logic
- Separate concerns from UI
- Enable composition
- Testable in isolation

### Service Layer (`lib/services/`)

**Service Architecture:**

Each service is a **static class** with methods for specific operations:

```typescript
export class VehicleService {
  static async getVehicles(): Promise<ApiResponse<Vehicle[]>>
  static async getVehicleById(id: string): Promise<ApiResponse<Vehicle>>
  static async createVehicle(data: VehicleInsert): Promise<ApiResponse<Vehicle>>
  static async updateVehicle(id: string, data: VehicleUpdate): Promise<ApiResponse<Vehicle>>
  static async deleteVehicle(id: string): Promise<ApiResponse<void>>
  // ... specialized methods
}
```

**Core Services:**

1. **VehicleService** (`vehicleService.ts`)
   - CRUD operations for vehicles
   - Vehicle sharing management
   - Image upload and management
   - Permission validation

2. **LoggingService** (`loggingService.ts`)
   - Three sub-services: FuelLogService, ServiceLogService, MileageLogService
   - CRUD for each log type
   - Odometer validation
   - Auto-mileage updates

3. **GroupService** (`groupService.ts`)
   - Group CRUD operations
   - Member management
   - Invitation system
   - Group analytics

4. **AnalyticsService** (`analyticsService.ts`)
   - Data aggregation and calculations
   - Trend analysis
   - Expense breakdowns
   - Chart data preparation

5. **NotificationService** (`notificationService.ts`)
   - Notification CRUD
   - Mark as read/unread
   - Badge count management

6. **ImageUploadService** (`imageUploadService.ts`)
   - Image compression and optimization
   - Supabase Storage upload
   - Receipt and vehicle image handling

7. **PushNotificationService** (`pushNotificationService.ts`)
   - Expo push token registration
   - Push notification sending infrastructure

**Service Design Patterns:**

- **Singleton-like:** Static methods, no instances needed
- **Async/Await:** All methods return Promises
- **Error Handling:** Try-catch with standardized error responses
- **Type-safe:** Full TypeScript with generic types
- **Response Format:** Consistent `ApiResponse<T>` structure

```typescript
interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
  confidence?: number; // For OCR operations
}
```

---

## Backend Architecture

### Supabase Architecture

Supabase provides a complete backend infrastructure:

```
┌─────────────────────────────────────────────────────────────┐
│                    SUPABASE BACKEND                          │
│                                                              │
│  ┌────────────────────────────────────────────────────┐     │
│  │         PostgreSQL Database (v15)                  │     │
│  │  ┌──────────────────────────────────────────┐     │     │
│  │  │  Tables (12 core tables)                 │     │     │
│  │  │  - Profiles, Vehicles, Groups           │     │     │
│  │  │  - Logs (fuel, service, mileage)        │     │     │
│  │  │  - Sharing, Invitations, Images         │     │     │
│  │  └──────────────────────────────────────────┘     │     │
│  │  ┌──────────────────────────────────────────┐     │     │
│  │  │  Row Level Security (RLS) Policies       │     │     │
│  │  │  - User-based access control            │     │     │
│  │  │  - Group-based permissions              │     │     │
│  │  └──────────────────────────────────────────┘     │     │
│  │  ┌──────────────────────────────────────────┐     │     │
│  │  │  Database Functions                      │     │     │
│  │  │  - get_user_vehicles_with_sharing()     │     │     │
│  │  │  - can_user_access_vehicle()            │     │     │
│  │  │  - get_user_group_ids()                 │     │     │
│  │  └──────────────────────────────────────────┘     │     │
│  │  ┌──────────────────────────────────────────┐     │     │
│  │  │  Triggers                                │     │     │
│  │  │  - Auto-update mileage on log insert    │     │     │
│  │  │  - Profile creation on signup           │     │     │
│  │  └──────────────────────────────────────────┘     │     │
│  └────────────────────────────────────────────────────┘     │
│                                                              │
│  ┌────────────────────────────────────────────────────┐     │
│  │         Authentication Service (GoTrue)            │     │
│  │  - Email/Password authentication                  │     │
│  │  - Session management (JWT)                       │     │
│  │  - Password reset flow                            │     │
│  │  - Email confirmation                             │     │
│  └────────────────────────────────────────────────────┘     │
│                                                              │
│  ┌────────────────────────────────────────────────────┐     │
│  │         Storage Service                            │     │
│  │  Buckets:                                          │     │
│  │  - profile-avatars (public)                       │     │
│  │  - vehicle-images (public)                        │     │
│  │  - service-receipts (private)                     │     │
│  │  Features:                                         │     │
│  │  - CDN-backed delivery                            │     │
│  │  - Automatic image transformation                 │     │
│  │  - RLS-protected access                           │     │
│  └────────────────────────────────────────────────────┘     │
│                                                              │
│  ┌────────────────────────────────────────────────────┐     │
│  │         Real-time Service (WebSocket)              │     │
│  │  - Database change subscriptions                  │     │
│  │  - Live updates (ready for implementation)        │     │
│  │  - Presence tracking (future)                     │     │
│  └────────────────────────────────────────────────────┘     │
│                                                              │
│  ┌────────────────────────────────────────────────────┐     │
│  │         Edge Functions (Deno)                      │     │
│  │  - Serverless compute                             │     │
│  │  - Custom API endpoints (future)                  │     │
│  │  - Background jobs (future)                       │     │
│  └────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

### Database Design Philosophy

**Principles:**

1. **Normalization:** 3NF (Third Normal Form) to reduce redundancy
2. **Referential Integrity:** Foreign keys with cascade rules
3. **Data Integrity:** Check constraints and triggers
4. **Performance:** Strategic indexes on frequently queried columns
5. **Security:** RLS policies on every table

**Key Database Functions:**

1. **`get_user_vehicles_with_sharing(user_uuid uuid)`**
   - Returns all vehicles accessible to user (owned + shared)
   - Includes sharing information
   - Optimized with single query
   - Prevents RLS recursion issues

2. **`can_user_access_vehicle(user_uuid uuid, vehicle_uuid uuid)`**
   - Permission validation function
   - Used in RLS policies
   - Checks ownership and group membership

3. **`get_user_group_ids(user_uuid uuid)`**
   - Returns array of group IDs user belongs to
   - Security definer function (breaks RLS recursion)
   - Used in vehicle access policies

**Triggers:**

1. **Update Vehicle Mileage Trigger**
   - Automatically updates `vehicles.current_mileage`
   - Triggered on mileage_logs INSERT
   - Ensures data consistency

2. **Profile Creation Trigger**
   - Creates profile record on auth.users INSERT
   - Ensures every user has a profile

---

## Data Flow

### Request-Response Flow

**Example: Fetching Vehicles with Sharing Info**

```
1. User Action
   └─> Screen component calls useVehicles() hook

2. Hook Execution
   └─> useVehicles() calls VehicleService.getVehicles()

3. Service Layer
   └─> VehicleService.getVehiclesWithSharing() executes

4. Database Query
   ├─> Get authenticated user (supabase.auth.getUser())
   ├─> Call RPC function: get_user_vehicles_with_sharing()
   ├─> Fetch vehicle images from vehicle_images table
   └─> Fetch sharing groups from vehicle_group_shares table

5. Data Enhancement
   └─> Combine vehicle data with images and sharing info

6. Response Processing
   └─> Return ApiResponse<VehicleWithDetails[]>

7. State Update
   └─> Hook updates local state with received data

8. UI Re-render
   └─> React re-renders components with new data
```

### Authentication Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    AUTHENTICATION FLOW                        │
└─────────────────────────────────────────────────────────────┘

1. Login Request
   User enters email/password
   ↓
2. AuthContext.signIn()
   ↓
3. supabase.auth.signInWithPassword()
   ↓
4. Supabase Auth validates credentials
   ↓
5. If valid:
   ├─> Create session (JWT token)
   ├─> Set auth cookie
   └─> Return user object
   ↓
6. AuthContext fetches user profile
   ├─> Query profiles table
   └─> Combine auth.user + profile data
   ↓
7. Update AuthContext state
   ├─> user: AuthUser
   ├─> loading: false
   └─> initialized: true
   ↓
8. AuthGuard allows access to protected routes
   ↓
9. Subsequent requests include JWT in headers
   Authorization: Bearer <token>
```

### Data Synchronization

**Current Implementation:**
- **Pull-based:** Manual refresh and automatic on screen focus
- **Optimistic Updates:** Immediate UI updates before server confirmation
- **Cache Invalidation:** Refresh data after mutations

**Future Enhancement:**
- **Real-time Subscriptions:** Live updates via Supabase Real-time
- **Offline Support:** Local cache with sync when online
- **Conflict Resolution:** Handle concurrent edits

---

## Security Architecture

### Multi-Layer Security

```
┌─────────────────────────────────────────────────────────────┐
│                    SECURITY LAYERS                            │
└─────────────────────────────────────────────────────────────┘

Layer 1: Transport Security
├─> HTTPS for all API communication
├─> WSS (WebSocket Secure) for real-time
└─> Certificate pinning (future)

Layer 2: Authentication
├─> JWT-based session management
├─> Secure password hashing (bcrypt via Supabase)
├─> Session expiration and refresh tokens
└─> Email verification for new accounts

Layer 3: Authorization (Application Level)
├─> AuthContext checks for protected routes
├─> Service layer permission validation
├─> can_user_access_vehicle() helper function
└─> Group membership validation

Layer 4: Authorization (Database Level - RLS)
├─> Row Level Security policies on all tables
├─> User can only see their own data
├─> Group members can access shared vehicles
└─> Security definer functions for safe queries

Layer 5: Data Validation
├─> TypeScript type checking
├─> Database constraints (NOT NULL, UNIQUE, CHECK)
├─> Input sanitization
└─> Form validation

Layer 6: Storage Security
├─> RLS policies on storage buckets
├─> Signed URLs for private content
├─> Image upload validation (file type, size)
└─> Secure deletion
```

### Row Level Security (RLS) Policies

**Example: Vehicles Table RLS**

```sql
-- Users can view their own vehicles
CREATE POLICY "Users can view own vehicles"
ON vehicles FOR SELECT
USING (auth.uid() = owner_id);

-- Group members can view shared vehicles
CREATE POLICY "Group members can view shared vehicles"
ON vehicles FOR SELECT
USING (
  id IN (
    SELECT vgs.vehicle_id
    FROM vehicle_group_shares vgs
    INNER JOIN group_members gm ON vgs.group_id = gm.group_id
    WHERE gm.user_id = auth.uid()
  )
);

-- Users can insert their own vehicles
CREATE POLICY "Users can insert own vehicles"
ON vehicles FOR INSERT
WITH CHECK (auth.uid() = owner_id);

-- Users can update vehicles they can access
CREATE POLICY "Users can update accessible vehicles"
ON vehicles FOR UPDATE
USING (can_user_access_vehicle(auth.uid(), id));

-- Only owners can delete vehicles
CREATE POLICY "Only owners can delete vehicles"
ON vehicles FOR DELETE
USING (auth.uid() = owner_id);
```

**RLS Benefits:**
- Database-level enforcement (cannot be bypassed)
- Automatic filtering of queries
- Performance optimized
- Declarative security

---

## Multi-Platform Architecture

### Platform-Specific Code

**Strategy:** **Platform-specific file extensions**

```
Component.tsx        # Shared implementation
Component.web.tsx    # Web-specific override
Component.ios.tsx    # iOS-specific override
Component.android.tsx # Android-specific override
```

**Examples:**

1. **Charts:**
   - `LineChart.tsx` - Uses Victory Native (mobile)
   - `LineChart.web.tsx` - Uses Recharts (web)

2. **Layout:**
   - `WebLayout.tsx` - Web-specific navigation
   - Mobile uses tab navigation

3. **Alerts:**
   - `useWebAlert()` - Browser `window.confirm()`
   - Mobile uses React Native `Alert.alert()`

### Responsive Design

**Breakpoints (Unistyles):**

```typescript
breakpoints: {
  xs: 0,       // Extra small (phone portrait)
  sm: 576,     // Small (phone landscape)
  md: 768,     // Medium (tablet portrait)
  lg: 992,     // Large (tablet landscape)
  xl: 1200,    // Extra large (desktop)
  xxl: 1400    // Extra extra large (large desktop)
}
```

**Responsive Component Pattern:**

```typescript
const stylesheet = createStyleSheet((theme) => ({
  container: {
    padding: {
      xs: theme.spacing.md,
      md: theme.spacing.lg,
      xl: theme.spacing.xl
    },
    flexDirection: {
      xs: 'column',
      lg: 'row'
    }
  }
}));
```

### Platform-Specific Features

| Feature | iOS | Android | Web |
|---------|-----|---------|-----|
| Haptic Feedback | ✅ | ✅ | ❌ |
| Push Notifications | ✅ | ✅ | 🔄 (Future) |
| File System Access | ✅ | ✅ | Limited |
| Image Picker | ✅ | ✅ | ✅ |
| Sharing | ✅ | ✅ | ✅ (Web Share API) |
| PWA Support | ❌ | ❌ | ✅ |

---

## Performance Optimization

### Frontend Optimizations

1. **Component Memoization**
   ```typescript
   const MemoizedComponent = React.memo(Component);
   ```

2. **Lazy Loading**
   - Code splitting with dynamic imports
   - Lazy load heavy components (charts)

3. **Image Optimization**
   - Expo Image with caching
   - Image compression before upload
   - CDN delivery via Supabase Storage

4. **List Virtualization**
   - FlatList for long lists
   - Optimized renderItem callbacks

### Backend Optimizations

1. **Database Indexes**
   - Indexed foreign keys
   - Composite indexes for common queries
   - Full-text search indexes (future)

2. **Query Optimization**
   - Database functions to reduce round trips
   - Batch queries where possible
   - Selective field fetching

3. **Caching Strategy**
   - Browser cache for static assets
   - CDN caching for images
   - Application-level caching (future)

---

## Scalability Considerations

### Current Capacity

- **Users:** Unlimited (Supabase handles scaling)
- **Vehicles per User:** Unlimited
- **Logs per Vehicle:** Unlimited
- **Concurrent Users:** High (Supabase connection pooling)

### Future Scalability Enhancements

1. **Database:**
   - Read replicas for analytics
   - Partitioning for large log tables
   - Archiving old data

2. **Frontend:**
   - Service workers for offline support
   - Progressive Web App (PWA) caching
   - Lazy loading and code splitting

3. **Infrastructure:**
   - CDN for global distribution
   - Edge functions for compute near users
   - Real-time subscriptions for live updates

---

## Technology Decision Rationale

### Why React Native + Expo?
- ✅ Single codebase for iOS, Android, Web
- ✅ Rich ecosystem and community
- ✅ Fast development iteration
- ✅ OTA updates via Expo
- ✅ Built-in tooling and services

### Why Supabase?
- ✅ Full backend in minutes
- ✅ PostgreSQL (powerful, standards-compliant)
- ✅ Built-in authentication
- ✅ RLS for security
- ✅ Real-time capabilities
- ✅ Free tier for development
- ✅ Scales to production

### Why TypeScript?
- ✅ Catch errors at compile time
- ✅ Better IDE support
- ✅ Self-documenting code
- ✅ Easier refactoring
- ✅ Industry standard

### Why Unistyles over NativeWind?
- ✅ Better performance (zero-runtime CSS)
- ✅ Type-safe theming
- ✅ Responsive breakpoints
- ✅ Platform-specific variants
- ✅ Smaller bundle size

---

**Next:** See [03-database-schema.md](./03-database-schema.md) for detailed database design.
