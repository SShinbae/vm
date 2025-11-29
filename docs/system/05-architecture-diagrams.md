# System Architecture Diagrams

**Document Version:** 1.0
**Last Updated:** November 29, 2024

---

## Table of Contents

1. [System Context Diagram](#system-context-diagram)
2. [Component Architecture](#component-architecture)
3. [Data Flow Diagrams](#data-flow-diagrams)
4. [Security Architecture](#security-architecture)
5. [Deployment Architecture](#deployment-architecture)

---

## System Context Diagram

### High-Level System Context

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         EXTERNAL ACTORS                                  │
└─────────────────────────────────────────────────────────────────────────┘

    ┌──────────────┐        ┌──────────────┐        ┌──────────────┐
    │  Individual  │        │    Family    │        │   Business   │
    │    Users     │        │    Members   │        │    Fleet     │
    └──────┬───────┘        └──────┬───────┘        └──────┬───────┘
           │                       │                       │
           │                       │                       │
           └───────────────────────┼───────────────────────┘
                                   │
                                   ↓
┌──────────────────────────────────────────────────────────────────────────┐
│                    VEHICLES MANAGEMENT SYSTEM                             │
│                                                                           │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │                     CLIENT APPLICATIONS                            │  │
│  │                                                                    │  │
│  │    ┌──────────┐      ┌──────────┐      ┌──────────┐              │  │
│  │    │   iOS    │      │ Android  │      │   Web    │              │  │
│  │    │   App    │      │   App    │      │   App    │              │  │
│  │    └──────────┘      └──────────┘      └──────────┘              │  │
│  │                                                                    │  │
│  │         React Native + Expo + TypeScript Framework                │  │
│  └────────────────────────────────────────────────────────────────────┘  │
│                                   │                                       │
│                                   │ HTTPS/WebSocket                       │
│                                   ↓                                       │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │                     SUPABASE BACKEND                               │  │
│  │                                                                    │  │
│  │  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐      │  │
│  │  │   PostgreSQL   │  │ Authentication │  │    Storage     │      │  │
│  │  │   + RLS        │  │   (GoTrue)     │  │  (S3-like)     │      │  │
│  │  └────────────────┘  └────────────────┘  └────────────────┘      │  │
│  │                                                                    │  │
│  │  ┌────────────────────────────────────────────────────────┐       │  │
│  │  │           Real-time Subscriptions (WebSocket)          │       │  │
│  │  └────────────────────────────────────────────────────────┘       │  │
│  └────────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────┘
                                   │
                                   │ Email (SMTP)
                                   ↓
                          ┌─────────────────┐
                          │  Email Service  │
                          │   (Supabase)    │
                          └─────────────────┘
```

---

## Component Architecture

### Frontend Component Hierarchy

```
┌──────────────────────────────────────────────────────────────────────┐
│                        ROOT LAYOUT (_layout.tsx)                      │
│                                                                       │
│  Providers:                                                           │
│  ├─ ThemeProvider                                                     │
│  ├─ AuthProvider                                                      │
│  ├─ NotificationProvider                                              │
│  └─ DialogProvider                                                    │
└───────────────────────────────┬───────────────────────────────────────┘
                                │
                                ↓
                    ┌───────────────────────┐
                    │    AuthGuard          │
                    │  (Protected Routes)   │
                    └───────────┬───────────┘
                                │
                ┌───────────────┼───────────────┐
                │               │               │
                ↓               ↓               ↓
        ┌──────────────┐  ┌──────────┐  ┌──────────────┐
        │    (auth)    │  │  (tabs)  │  │   groups/    │
        │   Routes     │  │  Routes  │  │   logs/      │
        └──────────────┘  └─────┬────┘  └──────────────┘
                                │
                    ┌───────────┼───────────┐
                    ↓           ↓           ↓
            ┌──────────┐ ┌──────────┐ ┌──────────┐
            │  index   │ │ vehicles │ │ analytics│
            │Dashboard │ │  Screen  │ │  Screen  │
            └──────────┘ └──────────┘ └──────────┘
                    │           │           │
                    └───────────┼───────────┘
                                ↓
                    ┌────────────────────────┐
                    │  Shared Components     │
                    ├────────────────────────┤
                    │ UI Components          │
                    │ - Button, Input, Card  │
                    │ - Modal, LoadingSpinner│
                    │ - ImagePicker, etc.    │
                    ├────────────────────────┤
                    │ Analytics Components   │
                    │ - MetricCard, StatCard │
                    │ - PeriodSelector       │
                    ├────────────────────────┤
                    │ Chart Components       │
                    │ - LineChart, BarChart  │
                    │ - PieChart             │
                    ├────────────────────────┤
                    │ Layout Components      │
                    │ - ResponsiveGrid       │
                    │ - WebLayout            │
                    └────────────────────────┘
```

### Service Layer Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                         SERVICE LAYER                                 │
└──────────────────────────────────────────────────────────────────────┘

    ┌──────────────────────────────────────────────────────────────┐
    │                    SERVICE CLASSES                           │
    └──────────────────────────────────────────────────────────────┘
           │                    │                    │
           ↓                    ↓                    ↓
    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
    │Vehicle Service│    │Group Service │    │Analytics     │
    ├──────────────┤    ├──────────────┤    │Service       │
    │- getVehicles │    │- getGroups   │    ├──────────────┤
    │- createVeh.  │    │- createGroup │    │- getAnalytics│
    │- updateVeh.  │    │- inviteMember│    │- calculate   │
    │- deleteVeh.  │    │- acceptInvite│    │  Trends      │
    │- shareVeh.   │    └──────────────┘    │- generate    │
    └──────────────┘                        │  Charts      │
                                            └──────────────┘
           │                    │                    │
           ↓                    ↓                    ↓
    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
    │Logging Service│   │Notification  │    │Image Upload  │
    ├──────────────┤    │Service       │    │Service       │
    │MileageLog    │    ├──────────────┤    ├──────────────┤
    │  Service     │    │- create      │    │- upload      │
    │FuelLog       │    │- markRead    │    │- compress    │
    │  Service     │    │- getBadge    │    │- delete      │
    │ServiceLog    │    │  Count       │    │- processOCR  │
    │  Service     │    └──────────────┘    └──────────────┘
    └──────────────┘
           │
           └───────────────────────────────────────────────┐
                                                           │
                                                           ↓
                                        ┌───────────────────────────────┐
                                        │   SUPABASE CLIENT             │
                                        ├───────────────────────────────┤
                                        │ - Database Queries            │
                                        │ - Authentication              │
                                        │ - Storage Operations          │
                                        │ - Real-time Subscriptions     │
                                        └───────────────────────────────┘
```

---

## Data Flow Diagrams

### Vehicle Creation Data Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    VEHICLE CREATION DATA FLOW                            │
└─────────────────────────────────────────────────────────────────────────┘

User Action                Screen Component           Service Layer
    │                            │                          │
    │  Fill form &               │                          │
    │  Upload images             │                          │
    │──────────────────────────→ │                          │
    │                            │                          │
    │                            │  Validate data           │
    │                            │  & prepare payload       │
    │                            │                          │
    │                            │  createVehicle()         │
    │                            │─────────────────────────→│
    │                            │                          │
    │                            │                          │  Upload images
    │                            │                          │  to Storage
    │                            │                          │──────────┐
    │                            │                          │          │
    │                            │                          │←─────────┘
    │                            │                          │  Image URLs
    │                            │                          │
    │                            │                          │  INSERT vehicle
    │                            │                          │──────────┐
    │                            │                          │  Supabase│
    │                            │                          │  Database│
    │                            │                          │←─────────┘
    │                            │                          │  New vehicle
    │                            │                          │
    │                            │                          │  INSERT images
    │                            │                          │──────────┐
    │                            │                          │          │
    │                            │                          │←─────────┘
    │                            │                          │
    │                            │  Return new vehicle      │
    │                            │←─────────────────────────│
    │                            │                          │
    │  Success message &         │                          │
    │  Navigate to list          │                          │
    │←───────────────────────────│                          │
    │                            │                          │
    ↓                            ↓                          ↓
```

### Group Invitation Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                  GROUP INVITATION DATA FLOW                              │
└─────────────────────────────────────────────────────────────────────────┘

Inviter                Database               Invitee
   │                       │                      │
   │ Send invitation       │                      │
   │──────────────────────→│                      │
   │                       │                      │
   │                       │ INSERT invitation    │
   │                       │ (with token)         │
   │                       │                      │
   │                       │ IF user exists:      │
   │                       │   INSERT notification│
   │                       │                      │
   │                       │ Send email           │
   │                       │──────────────────────→│
   │                       │                      │
   │                       │                      │ Receive email
   │                       │                      │ + notification
   │                       │                      │
   │                       │ Click link           │
   │                       │←─────────────────────│
   │                       │                      │
   │                       │ Fetch invitation     │
   │                       │  by token            │
   │                       │                      │
   │                       │ Accept invitation    │
   │                       │←─────────────────────│
   │                       │                      │
   │                       │ INSERT group_member  │
   │                       │ UPDATE invitation    │
   │                       │  status = accepted   │
   │                       │ DELETE notification  │
   │                       │                      │
   │                       │ Return success       │
   │                       │──────────────────────→│
   │                       │                      │
   │ Notification:         │                      │ Navigate to
   │ "User joined group"   │                      │ group page
   │←──────────────────────│                      │
   │                       │                      │
   ↓                       ↓                      ↓
```

### Analytics Calculation Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                 ANALYTICS CALCULATION DATA FLOW                          │
└─────────────────────────────────────────────────────────────────────────┘

User                  Frontend              Service Layer        Database
 │                        │                        │                 │
 │ Open Analytics         │                        │                 │
 │ Select filters         │                        │                 │
 │───────────────────────→│                        │                 │
 │                        │                        │                 │
 │                        │ useAnalytics()         │                 │
 │                        │ hook executes          │                 │
 │                        │                        │                 │
 │                        │ getVehicles()          │                 │
 │                        │───────────────────────→│                 │
 │                        │                        │ SELECT vehicles │
 │                        │                        │ + sharing info  │
 │                        │                        │────────────────→│
 │                        │                        │←────────────────│
 │                        │←───────────────────────│                 │
 │                        │                        │                 │
 │                        │ getFuelLogs()          │                 │
 │                        │───────────────────────→│                 │
 │                        │                        │ SELECT fuel_logs│
 │                        │                        │────────────────→│
 │                        │                        │←────────────────│
 │                        │←───────────────────────│                 │
 │                        │                        │                 │
 │                        │ getServiceLogs()       │                 │
 │                        │───────────────────────→│                 │
 │                        │                        │ SELECT service  │
 │                        │                        │────────────────→│
 │                        │                        │←────────────────│
 │                        │←───────────────────────│                 │
 │                        │                        │                 │
 │                        │ Calculate Analytics    │                 │
 │                        │ (client-side):         │                 │
 │                        │ - Filter by period     │                 │
 │                        │ - Filter by vehicle    │                 │
 │                        │ - Group by month       │                 │
 │                        │ - Calculate totals     │                 │
 │                        │ - Calculate trends     │                 │
 │                        │ - Prepare chart data   │                 │
 │                        │                        │                 │
 │ Display charts         │                        │                 │
 │ and metrics            │                        │                 │
 │←───────────────────────│                        │                 │
 │                        │                        │                 │
 ↓                        ↓                        ↓                 ↓
```

---

## Security Architecture

### Multi-Layer Security Model

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      SECURITY LAYERS                                     │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│ Layer 1: TRANSPORT SECURITY                                              │
│ ├─ HTTPS (TLS 1.3)                                                       │
│ ├─ WSS (WebSocket Secure)                                                │
│ └─ Certificate Pinning (Future)                                          │
└─────────────────────────────────────────────────────────────────────────┘
                                   │
                                   ↓
┌─────────────────────────────────────────────────────────────────────────┐
│ Layer 2: AUTHENTICATION                                                  │
│ ├─ JWT Tokens (Access + Refresh)                                         │
│ ├─ Secure Password Hashing (bcrypt)                                      │
│ ├─ Session Management (1h access, 7d refresh)                            │
│ └─ Email Verification                                                    │
└─────────────────────────────────────────────────────────────────────────┘
                                   │
                                   ↓
┌─────────────────────────────────────────────────────────────────────────┐
│ Layer 3: APPLICATION AUTHORIZATION                                       │
│ ├─ AuthGuard (Route Protection)                                          │
│ ├─ Service Layer Validation                                              │
│ ├─ Permission Helper Functions                                           │
│ └─ Role-based Access Control                                             │
└─────────────────────────────────────────────────────────────────────────┘
                                   │
                                   ↓
┌─────────────────────────────────────────────────────────────────────────┐
│ Layer 4: DATABASE AUTHORIZATION (RLS)                                    │
│ ├─ Row Level Security Policies (all tables)                              │
│ ├─ Ownership-based Policies (owner_id = auth.uid())                      │
│ ├─ Group-based Policies (via group_members join)                         │
│ └─ Security Definer Functions                                            │
└─────────────────────────────────────────────────────────────────────────┘
                                   │
                                   ↓
┌─────────────────────────────────────────────────────────────────────────┐
│ Layer 5: DATA VALIDATION                                                 │
│ ├─ TypeScript Type Checking                                              │
│ ├─ Database Constraints (NOT NULL, CHECK, UNIQUE)                        │
│ ├─ Input Sanitization                                                    │
│ └─ Form Validation (Client + Server)                                     │
└─────────────────────────────────────────────────────────────────────────┘
                                   │
                                   ↓
┌─────────────────────────────────────────────────────────────────────────┐
│ Layer 6: STORAGE SECURITY                                                │
│ ├─ RLS Policies on Storage Buckets                                       │
│ ├─ Signed URLs for Private Content                                       │
│ ├─ File Type & Size Validation                                           │
│ └─ Secure Deletion                                                       │
└─────────────────────────────────────────────────────────────────────────┘
```

### Permission Flow for Vehicle Access

```
┌─────────────────────────────────────────────────────────────────────────┐
│              PERMISSION VALIDATION FOR VEHICLE ACCESS                    │
└─────────────────────────────────────────────────────────────────────────┘

User Requests Vehicle Access
        │
        ↓
┌───────────────────────┐
│ 1. Frontend Check     │
│    (UI Layer)         │
└───────┬───────────────┘
        │
        ├─→ User = Owner? ──→ YES ──→ Show all actions
        │                              (view, edit, delete, share)
        │
        ├─→ Vehicle shared  ──→ YES ──→ Show limited actions
        │   with user's           (view, edit, add logs)
        │   groups?
        │
        └─→ ELSE ───────────────────→ Hide vehicle / No access
        │
        ↓
┌───────────────────────┐
│ 2. Service Layer Check│
│    (App Logic)        │
└───────┬───────────────┘
        │
        │  can_user_access_vehicle(user_id, vehicle_id)
        │
        ├─→ SELECT * FROM vehicles
        │   WHERE id = vehicle_id
        │   AND (owner_id = user_id
        │        OR id IN (shared vehicles))
        │
        ├─→ Found? ──→ YES ──→ Return true, continue
        │
        └─→ Not found ──→ NO ──→ Return error 403
        │
        ↓
┌───────────────────────┐
│ 3. Database RLS       │
│    (Data Layer)       │
└───────┬───────────────┘
        │
        │  Query executed with RLS policies
        │
        ├─→ Policy: "Users can view own vehicles"
        │   USING (auth.uid() = owner_id)
        │
        ├─→ Policy: "Group members can view shared"
        │   USING (id IN (SELECT vehicle_id
        │                 FROM vehicle_group_shares
        │                 WHERE group_id IN user_groups))
        │
        ├─→ Rows matching policies ──→ Return data
        │
        └─→ No matching rows ────────→ Return empty set
        │
        ↓
    SUCCESS: User has access
    FAILURE: Access denied
```

---

## Deployment Architecture

### Build and Deployment Pipeline

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    BUILD & DEPLOYMENT PIPELINE                           │
└─────────────────────────────────────────────────────────────────────────┘

┌──────────────────┐
│  Developer       │
│  Commits Code    │
└────────┬─────────┘
         │
         ↓
┌─────────────────────────────┐
│  Git Repository (GitHub)    │
│  ├─ Husky pre-commit hooks  │
│  │  ├─ Prettier check       │
│  │  ├─ ESLint               │
│  │  └─ TypeScript compile   │
│  └─ Push to remote          │
└────────┬────────────────────┘
         │
         ↓
┌─────────────────────────────────────────────────────────────┐
│              EAS BUILD SERVICE (Expo)                       │
│                                                              │
│  ┌────────────────┐  ┌────────────────┐  ┌──────────────┐  │
│  │  iOS Build     │  │ Android Build  │  │  Web Build   │  │
│  │                │  │                │  │              │  │
│  │  eas build     │  │  eas build     │  │  expo export │  │
│  │  --platform    │  │  --platform    │  │  --platform  │  │
│  │  ios           │  │  android       │  │  web         │  │
│  │                │  │                │  │              │  │
│  │  Generates:    │  │  Generates:    │  │  Generates:  │  │
│  │  - .ipa file   │  │  - .apk/.aab   │  │  - Static    │  │
│  │                │  │                │  │    files     │  │
│  └────────┬───────┘  └────────┬───────┘  └──────┬───────┘  │
│           │                   │                  │          │
└───────────┼───────────────────┼──────────────────┼──────────┘
            │                   │                  │
            ↓                   ↓                  ↓
┌────────────────┐  ┌─────────────────┐  ┌──────────────────┐
│  App Store     │  │  Google Play    │  │  Web Hosting     │
│  (iOS)         │  │  Store          │  │  (Vercel/        │
│                │  │  (Android)      │  │   Netlify)       │
│  TestFlight    │  │                 │  │                  │
│  (Beta)        │  │  Internal       │  │  Preview:        │
│                │  │  Testing        │  │  preview.app.com │
│  Production:   │  │                 │  │                  │
│  App Store     │  │  Production:    │  │  Production:     │
│                │  │  Play Store     │  │  app.com         │
└────────────────┘  └─────────────────┘  └──────────────────┘
```

### Production Environment

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      PRODUCTION ENVIRONMENT                              │
└─────────────────────────────────────────────────────────────────────────┘

                          ┌────────────────┐
                          │   CDN (Cloudflare│
                          │    or similar)   │
                          └────────┬─────────┘
                                   │
                ┌──────────────────┼──────────────────┐
                │                  │                  │
                ↓                  ↓                  ↓
        ┌──────────────┐   ┌──────────────┐  ┌──────────────┐
        │   iOS App    │   │ Android App  │  │   Web App    │
        │   (Native)   │   │  (Native)    │  │   (Browser)  │
        └──────┬───────┘   └──────┬───────┘  └──────┬───────┘
               │                  │                  │
               └──────────────────┼──────────────────┘
                                  │
                                  │ HTTPS/WSS
                                  ↓
                    ┌──────────────────────────────┐
                    │   SUPABASE (Production)      │
                    │                              │
                    │  ┌────────────────────────┐  │
                    │  │  PostgreSQL Cluster    │  │
                    │  │  - Primary (Write)     │  │
                    │  │  - Replicas (Read)     │  │
                    │  └────────────────────────┘  │
                    │                              │
                    │  ┌────────────────────────┐  │
                    │  │  Auth Service          │  │
                    │  │  (High Availability)   │  │
                    │  └────────────────────────┘  │
                    │                              │
                    │  ┌────────────────────────┐  │
                    │  │  Storage (S3)          │  │
                    │  │  - Multi-region        │  │
                    │  │  - CDN backed          │  │
                    │  └────────────────────────┘  │
                    │                              │
                    │  ┌────────────────────────┐  │
                    │  │  Real-time Service     │  │
                    │  │  (WebSocket cluster)   │  │
                    │  └────────────────────────┘  │
                    └──────────────────────────────┘
                                  │
                                  │
                          ┌───────┴───────┐
                          │               │
                          ↓               ↓
                ┌──────────────┐  ┌──────────────┐
                │  Monitoring  │  │   Backup     │
                │  & Logging   │  │  & Recovery  │
                │              │  │              │
                │  - Metrics   │  │  - Automated │
                │  - Alerts    │  │  - Point-in- │
                │  - Traces    │  │    time      │
                └──────────────┘  └──────────────┘
```

---

## State Management Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    STATE MANAGEMENT ARCHITECTURE                         │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                         GLOBAL STATE (Context)                           │
│                                                                           │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐             │
│  │  AuthContext   │  │ ThemeContext   │  │ Notification   │             │
│  │                │  │                │  │ Context        │             │
│  │ - user         │  │ - colorScheme  │  │                │             │
│  │ - loading      │  │ - theme        │  │ - notifications│             │
│  │ - initialized  │  │ - toggle()     │  │ - unreadCount  │             │
│  │                │  │                │  │ - markRead()   │             │
│  │ - signIn()     │  └────────────────┘  └────────────────┘             │
│  │ - signOut()    │                                                      │
│  │ - signUp()     │  ┌────────────────┐                                 │
│  └────────────────┘  │ DialogContext  │                                 │
│                      │                │                                 │
│                      │ - showAlert()  │                                 │
│                      │ - showConfirm()│                                 │
│                      └────────────────┘                                 │
└─────────────────────────────────────────────────────────────────────────┘
                                   │
                                   ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                      COMPONENT LOCAL STATE (Hooks)                       │
│                                                                           │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐             │
│  │  useVehicles   │  │ useAnalytics   │  │ useDashboard   │             │
│  │                │  │                │  │ Data           │             │
│  │ - vehicles     │  │ - analytics    │  │                │             │
│  │ - loading      │  │ - period       │  │ - stats        │             │
│  │ - error        │  │ - vehicleFilter│  │ - recent       │             │
│  │ - refresh()    │  │ - loading      │  │   Activity     │             │
│  └────────────────┘  └────────────────┘  │ - loading      │             │
│                                          └────────────────┘             │
│  ┌────────────────┐  ┌────────────────┐                                 │
│  │ useAddFuelLog  │  │ useVehicle     │                                 │
│  │                │  │ Stats          │                                 │
│  │ - formData     │  │                │                                 │
│  │ - isSubmitting │  │ - totalExpenses│                                 │
│  │ - submit()     │  │ - fuelCost     │                                 │
│  └────────────────┘  └────────────────┘                                 │
└─────────────────────────────────────────────────────────────────────────┘
                                   │
                                   ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                        UI LOCAL STATE (useState)                         │
│                                                                           │
│  - Modal visibility                                                      │
│  - Form inputs                                                           │
│  - Dropdown selections                                                   │
│  - Temporary UI state                                                    │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Platform-Specific Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    PLATFORM-SPECIFIC ARCHITECTURE                        │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                         SHARED CODE (90%)                                │
│                                                                           │
│  - Business Logic (Services)                                             │
│  - Data Models (Types)                                                   │
│  - UI Components (Base)                                                  │
│  - Hooks                                                                 │
│  - Utilities                                                             │
└─────────────────────────────────────────────────────────────────────────┘
                                   │
                ┌──────────────────┼──────────────────┐
                │                  │                  │
                ↓                  ↓                  ↓
┌───────────────────────┐  ┌──────────────┐  ┌──────────────────┐
│   iOS SPECIFIC        │  │   ANDROID    │  │   WEB SPECIFIC   │
│   (10%)               │  │   SPECIFIC   │  │   (10%)          │
│                       │  │   (10%)      │  │                  │
│ Charts:               │  │              │  │ Charts:          │
│ - Victory Native      │  │ Charts:      │  │ - Recharts       │
│                       │  │ - Victory    │  │                  │
│ Navigation:           │  │   Native     │  │ Navigation:      │
│ - Tab Bar (native)    │  │              │  │ - Web navbar     │
│ - Haptics enabled     │  │ Navigation:  │  │ - Sidebar        │
│                       │  │ - Tab Bar    │  │                  │
│ Alerts:               │  │   (native)   │  │ Alerts:          │
│ - Alert.alert()       │  │ - Haptics    │  │ - window.confirm │
│                       │  │   enabled    │  │                  │
│ Image Picker:         │  │              │  │ Image Upload:    │
│ - expo-image-picker   │  │ Alerts:      │  │ - <input type=   │
│ - Camera support      │  │ - Alert.alert│  │   "file">        │
│                       │  │              │  │                  │
│ Notifications:        │  │ Image Picker:│  │ Notifications:   │
│ - APNS                │  │ - expo-image │  │ - Web Push API   │
│                       │  │   -picker    │  │   (Future)       │
│                       │  │ - Camera     │  │                  │
│                       │  │              │  │ PWA:             │
│                       │  │ Notifications│  │ - Service Worker │
│                       │  │ - FCM        │  │ - Offline cache  │
└───────────────────────┘  └──────────────┘  └──────────────────┘
```

---

**Related Documentation:**
- [System Overview](./01-system-overview.md)
- [Detailed Architecture](./02-architecture-detailed.md)
- [Database Schema](./03-database-schema.md)
- [Workflows](./04-workflows.md)

