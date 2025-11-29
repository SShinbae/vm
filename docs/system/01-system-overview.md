# System Overview - Vehicles Management Application

**Document Version:** 1.0
**Last Updated:** November 29, 2024
**Author:** System Architecture Team

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [System Purpose](#system-purpose)
3. [Target Users](#target-users)
4. [Key Features](#key-features)
5. [Technology Stack](#technology-stack)
6. [System Architecture](#system-architecture)
7. [Development Model](#development-model)

---

## Executive Summary

The **Vehicles Management Application** is a comprehensive, cross-platform mobile and web application designed to help users track, manage, and analyze their vehicle-related data. Built with modern technologies including React Native, Expo, and Supabase, the system provides a robust solution for individual users, families, and organizations to manage vehicle fleets collaboratively.

### Quick Facts

- **Platform:** iOS, Android, and Web (Progressive Web App)
- **Architecture:** Client-Server with BaaS (Backend-as-a-Service)
- **Primary Language:** TypeScript
- **Development Framework:** React Native with Expo SDK 54
- **Backend:** Supabase (PostgreSQL + Real-time + Storage + Auth)
- **Deployment Status:** Production-ready with CI/CD via EAS Build

---

## System Purpose

### Primary Objectives

1. **Centralized Vehicle Management**
   - Maintain detailed records of all user vehicles
   - Track vehicle specifications, images, and current mileage
   - Support multiple vehicles per user

2. **Comprehensive Data Logging**
   - Record mileage readings with automatic validation
   - Track fuel purchases and consumption patterns
   - Document service and maintenance history

3. **Collaborative Management**
   - Enable group-based vehicle sharing
   - Support family, company, and organizational fleet management
   - Provide granular permission controls

4. **Analytics and Insights**
   - Generate expense analytics across fuel and service costs
   - Visualize trends and patterns over customizable time periods
   - Compare performance across multiple vehicles

5. **Notification System**
   - Real-time group invitation notifications
   - Push notification infrastructure (ready for maintenance reminders)
   - In-app notification center

---

## Target Users

### Primary User Personas

1. **Individual Vehicle Owners**
   - Track personal vehicle maintenance
   - Monitor fuel consumption and expenses
   - Plan service schedules

2. **Family Units**
   - Manage multiple family vehicles collaboratively
   - Share vehicle data among family members
   - Track shared expenses

3. **Small Business Owners**
   - Manage company vehicle fleets
   - Monitor fleet expenses
   - Track vehicle usage across team members

4. **Fleet Managers**
   - Oversee organizational vehicle assets
   - Generate fleet-wide analytics
   - Manage group permissions and access

---

## Key Features

### 1. Vehicle Management

**Core Capabilities:**
- ✅ Complete CRUD operations (Create, Read, Update, Delete)
- ✅ Rich media support with image gallery (multiple images per vehicle)
- ✅ Detailed specifications: Make, Model, Year, License Plate, VIN, Color
- ✅ Current mileage tracking with automatic updates
- ✅ Selective group sharing (share with specific groups)

**Technical Implementation:**
- Database table: `vehicles`
- Supporting tables: `vehicle_images`, `vehicle_group_shares`
- RLS policies for owner-based and group-based access

### 2. Group Management

**Core Capabilities:**
- ✅ Create and manage collaborative groups
- ✅ Email-based invitation system with secure tokens
- ✅ Member management (add, remove, view)
- ✅ Vehicle sharing configuration per group
- ✅ Group analytics aggregation

**Technical Implementation:**
- Database tables: `groups`, `group_members`, `group_invitations`
- Invitation workflow with email notifications
- RLS policies for group owner and member access

### 3. Logging System

**Three Log Types:**

a) **Mileage Logs**
   - Record odometer readings
   - Automatic validation (increasing mileage)
   - Auto-update vehicle's current mileage
   - Database table: `mileage_logs`

b) **Fuel Logs**
   - Track fuel purchases with quantity, cost, and price per liter
   - Calculate fuel efficiency
   - Location tracking (optional)
   - Database table: `fuel_logs`

c) **Service Logs**
   - Categorized service types (oil change, tire rotation, brake service, etc.)
   - Itemized cost breakdown
   - Receipt image upload with OCR capabilities
   - Next service date tracking
   - Database table: `service_logs`

**Permission Model:**
- **View/Add/Edit:** All vehicle members (owner + group members)
- **Delete:** Vehicle owners only

### 4. Analytics Dashboard

**Features:**
- 📊 Multi-tab analytics interface (Overview, Fuel, Service, Performance)
- 📈 Interactive charts using Victory Native (Line, Bar, Pie charts)
- 🔍 Vehicle filtering (owned + group-shared vehicles)
- 📅 Time period selection (Last 3 months, 6 months, 1 year, All time)
- 💰 Cost breakdowns and expense trends
- 📉 Fuel efficiency and consumption patterns

**Data Sources:**
- Aggregates data from fuel_logs, service_logs, and mileage_logs
- Includes both owned and group-shared vehicle data
- Real-time calculations with caching optimization

### 5. Notification System

**Current Implementation:**
- ✅ Group invitation notifications
- ✅ In-app notification center with badge count
- ✅ Real-time notification updates
- ✅ Push notification infrastructure (Expo Notifications)

**Future Extensions:**
- Service reminders based on mileage/time
- Group activity notifications
- Expense alerts and budgets

---

## Technology Stack

### Frontend Layer

**Core Framework:**
- **React Native** (v0.81.5) - Cross-platform mobile framework
- **Expo** (SDK 54) - Development platform and build system
- **TypeScript** (v5.9.2) - Type-safe development

**UI & Styling:**
- **React Native Unistyles** (v2.43.0) - Modern styling with theming
- **NativeWind** (v4.2.1) - Tailwind CSS for React Native
- **Expo Image** - Optimized image handling
- **React Native Gesture Handler** - Advanced touch interactions
- **React Native Reanimated** - Smooth animations

**Navigation:**
- **Expo Router** (v6.0.10) - File-based routing system
- **React Navigation** - Bottom tabs and material top tabs

**Data Visualization:**
- **Victory Native** (v41.20.1) - Native chart library
- **React Native Skia** - High-performance graphics
- **React Native Chart Kit** - Additional charting options

**State Management:**
- React Hooks (useState, useEffect, useContext)
- Custom hooks for business logic
- Context API for global state (Auth, Theme, Notifications, Dialog)

### Backend Layer

**Backend-as-a-Service (Supabase):**
- **PostgreSQL** - Relational database
- **Row Level Security (RLS)** - Database-level access control
- **Real-time Subscriptions** - Live data updates
- **Authentication** - Email/password with session management
- **Storage** - Image and file storage with CDN
- **Edge Functions** - Serverless compute (ready for use)

**Database Functions:**
- `get_user_vehicles_with_sharing()` - Optimized vehicle queries
- `can_user_access_vehicle()` - Permission validation
- `get_user_group_ids()` - RLS recursion prevention
- Custom triggers for automatic mileage updates

### Development Tools

**Code Quality:**
- **ESLint** (v9.38.0) - Code linting with TypeScript support
- **Prettier** (v3.6.2) - Code formatting
- **Husky** (v9.1.7) - Git hooks
- **Lint-staged** (v16.2.4) - Pre-commit checks

**Testing:**
- **Jest** (v29.7.0) - Unit testing framework
- **React Native Testing Library** - Component testing
- **ts-jest** - TypeScript support for Jest

**Build & Deployment:**
- **EAS Build** - Expo Application Services for builds
- **EAS Submit** - App store submissions
- **Metro Bundler** - JavaScript bundling
- **Babel** - JavaScript transpilation

---

## System Architecture

### Architecture Pattern

**Type:** Client-Server with Backend-as-a-Service (BaaS)

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Client Layer                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   iOS App   │  │ Android App │  │   Web App   │         │
│  │  (Native)   │  │  (Native)   │  │   (PWA)     │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
│           │               │                │                 │
│           └───────────────┴────────────────┘                │
│                          │                                   │
│              React Native + Expo Framework                   │
│                          │                                   │
└──────────────────────────┼───────────────────────────────────┘
                           │
                  HTTPS/WebSocket
                           │
┌──────────────────────────┼───────────────────────────────────┐
│                  Supabase Backend                            │
│  ┌────────────────────────────────────────────────┐          │
│  │         PostgreSQL Database (RLS Enabled)      │          │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐       │          │
│  │  │Vehicles │  │  Logs   │  │ Groups  │       │          │
│  │  └─────────┘  └─────────┘  └─────────┘       │          │
│  └────────────────────────────────────────────────┘          │
│  ┌────────────────────────────────────────────────┐          │
│  │         Authentication Service (Auth)          │          │
│  └────────────────────────────────────────────────┘          │
│  ┌────────────────────────────────────────────────┐          │
│  │       Storage Service (Images/Files)           │          │
│  └────────────────────────────────────────────────┘          │
│  ┌────────────────────────────────────────────────┐          │
│  │      Real-time Service (Subscriptions)         │          │
│  └────────────────────────────────────────────────┘          │
└─────────────────────────────────────────────────────────────┘
```

### Component Architecture

**Layer-Based Design:**

1. **Presentation Layer** (`app/`, `components/`)
   - Screen components (Expo Router file-based routing)
   - Reusable UI components
   - Layout components (responsive design)

2. **Business Logic Layer** (`lib/services/`, `hooks/`)
   - Service classes for API communication
   - Custom React hooks for state management
   - Analytics calculation logic

3. **Data Layer** (`types/`, `lib/supabase/`)
   - TypeScript type definitions
   - Database type generation
   - Supabase client configuration

4. **Context Layer** (`lib/contexts/`)
   - AuthContext - Authentication state
   - ThemeContext - Theme management
   - NotificationContext - Notification state
   - DialogContext - Modal/dialog management

---

## Development Model

### Software Development Methodology

**Model:** **Iterative and Incremental Development** with **Agile-inspired practices**

### Characteristics of the Current Model

#### 1. Iterative Development
The project demonstrates clear iteration cycles:
- **Phase 1:** Basic component system
- **Phase 2:** Enhanced components with accessibility
- **Phase 3-5:** Progressive feature additions
- **Phase 6:** Major migration (NativeWind to Unistyles)

#### 2. Incremental Delivery
Features are added incrementally:
- Core vehicle management → Group sharing → Analytics → Notifications
- Each feature builds upon the previous foundation
- Continuous integration of new capabilities

#### 3. Feature-Driven Development
- Each phase focuses on specific feature sets
- Documentation after each phase completion
- Clear feature specifications and requirements

#### 4. Continuous Improvement
Evidence in documentation:
- Migration summaries and lessons learned
- Error tracking and fixes documented
- Performance optimization iterations
- Code quality improvements (linting, testing)

### Development Practices

#### Version Control
- **Git** with structured branching
- Conventional commit messages (feat:, fix:, docs:, etc.)
- Pre-commit hooks for quality assurance

#### Code Quality Assurance
- **Type Safety:** Full TypeScript implementation
- **Linting:** ESLint with strict rules
- **Formatting:** Prettier with pre-commit enforcement
- **Testing:** Jest with component and unit tests

#### Documentation Strategy
- Inline code documentation
- Phase completion summaries
- Migration guides
- Technical decision records

#### Build & Deployment
- **Development:** Expo Go for rapid testing
- **Staging:** EAS Build preview builds
- **Production:** EAS Build production builds
- **CI/CD:** Automated builds with pre-commit validation

### Not Strictly Waterfall Because:
- ❌ No rigid sequential phases
- ❌ Requirements evolve continuously
- ❌ Testing happens throughout development
- ❌ Design changes are accommodated

### Not Purely Agile Because:
- ⚠️ No formal sprint structure
- ⚠️ Limited evidence of daily standups
- ⚠️ Documentation is comprehensive (not minimal)
- ⚠️ Focus on individual/small team development

### Best Described As:

**"Pragmatic Iterative Development"**

A practical, flexible approach combining:
- Iterative cycles with clear milestones
- Incremental feature delivery
- Continuous integration and testing
- Comprehensive documentation
- Responsive to changing requirements
- Quality-focused with automation

---

## System Metrics

### Current System Scale

**Database Tables:** 12 core tables
- profiles, vehicles, vehicle_images, vehicle_group_shares
- groups, group_members, group_invitations
- mileage_logs, fuel_logs, service_logs
- notifications, push_tokens

**TypeScript Files:** 100+ files
- ~50 screen components
- ~60 reusable components
- ~15 service classes
- ~15 custom hooks
- ~10 context providers

**Code Quality:**
- TypeScript strict mode: ✅ Enabled
- Test coverage: 64+ test cases
- Linting: 0 warnings policy
- Type safety: 100%

---

## Next Steps

See the following documentation for detailed information:
- [02-architecture-detailed.md](./02-architecture-detailed.md) - Detailed architecture breakdown
- [03-database-schema.md](./03-database-schema.md) - Database design and relationships
- [04-workflows.md](./04-workflows.md) - System workflows and user flows
- [05-api-documentation.md](./05-api-documentation.md) - API and service documentation
- [06-deployment.md](./06-deployment.md) - Deployment and operations guide
