# Database Schema Documentation

**Document Version:** 1.0
**Last Updated:** November 29, 2024
**Database:** PostgreSQL 15 via Supabase

---

## Table of Contents

1. [Schema Overview](#schema-overview)
2. [Entity Relationship Diagram](#entity-relationship-diagram)
3. [Table Definitions](#table-definitions)
4. [Relationships](#relationships)
5. [Indexes and Performance](#indexes-and-performance)
6. [Security Policies](#security-policies)
7. [Database Functions](#database-functions)
8. [Triggers](#triggers)

---

## Schema Overview

### Database Statistics

- **Total Tables:** 12 core tables
- **Total Enums:** 3 custom types
- **Total Functions:** 3 custom functions
- **Total Triggers:** 2 automated triggers
- **RLS Enabled:** Yes, on all tables

### Schema Organization

```
public schema
├── User & Profile Management
│   ├── profiles (extends auth.users)
│   └── push_tokens
├── Vehicle Management
│   ├── vehicles
│   ├── vehicle_images
│   └── vehicle_group_shares
├── Group Management
│   ├── groups
│   ├── group_members
│   └── group_invitations
├── Logging System
│   ├── mileage_logs
│   ├── fuel_logs
│   └── service_logs
└── Notifications
    └── notifications
```

---

## Entity Relationship Diagram

```
┌─────────────────┐
│  auth.users     │ (Supabase managed)
│  (built-in)     │
└────────┬────────┘
         │ 1:1
         ↓
┌─────────────────────────────────────────────────────────────┐
│                       profiles                               │
│  - id (PK, FK → auth.users)                                 │
│  - email                                                     │
│  - full_name                                                 │
│  - username                                                  │
│  - avatar_url                                                │
│  - phone, bio                                                │
│  - created_at, updated_at                                    │
└───────┬──────────────────────────────────────┬──────────────┘
        │ 1:N                                   │ 1:N
        ↓                                       ↓
┌──────────────────────┐              ┌─────────────────────┐
│      vehicles        │              │       groups        │
│  - id (PK)           │              │  - id (PK)          │
│  - owner_id (FK)     │←─────────────│  - owner_id (FK)    │
│  - make, model, year │       N:N    │  - name             │
│  - license_plate     │              │  - description      │
│  - vin, color        │              │  - created_at       │
│  - current_mileage   │              └──────┬──────────────┘
│  - main_image_url    │                     │ 1:N
│  - created_at        │                     ↓
└─────┬────────────────┘         ┌──────────────────────────┐
      │ 1:N                      │    group_members         │
      ↓                          │  - id (PK)               │
┌──────────────────────┐         │  - group_id (FK)         │
│  vehicle_images      │         │  - user_id (FK)          │
│  - id (PK)           │         │  - joined_at             │
│  - vehicle_id (FK)   │         └──────┬───────────────────┘
│  - image_url         │                │
│  - image_type        │                │
│  - caption           │         ┌──────┴───────────────────┐
│  - display_order     │         │  group_invitations       │
└──────────────────────┘         │  - id (PK)               │
      │                          │  - group_id (FK)         │
      │ N:N (via shares)         │  - invited_email         │
      ↓                          │  - invited_by (FK)       │
┌──────────────────────────┐     │  - status                │
│ vehicle_group_shares     │     │  - token                 │
│  - id (PK)               │     │  - expires_at            │
│  - vehicle_id (FK)       │     └──────────────────────────┘
│  - group_id (FK)         │
│  - shared_by (FK)        │
│  - shared_at             │
└──────────────────────────┘
      │
      │ 1:N (each log type)
      ↓
┌──────────────────────┐  ┌──────────────────────┐  ┌──────────────────────┐
│   mileage_logs       │  │     fuel_logs        │  │   service_logs       │
│  - id (PK)           │  │  - id (PK)           │  │  - id (PK)           │
│  - vehicle_id (FK)   │  │  - vehicle_id (FK)   │  │  - vehicle_id (FK)   │
│  - user_id (FK)      │  │  - user_id (FK)      │  │  - user_id (FK)      │
│  - odometer_reading  │  │  - liters_filled     │  │  - service_type      │
│  - date              │  │  - cost              │  │  - description       │
│  - notes             │  │  - fuel_price        │  │  - cost              │
│  - created_at        │  │  - odometer_reading  │  │  - items (JSON)      │
└──────────────────────┘  │  - location          │  │  - odometer_reading  │
                          │  - date              │  │  - next_service_due  │
                          │  - created_at        │  │  - receipt_image_url │
                          └──────────────────────┘  │  - ocr_data (JSON)   │
                                                    │  - date, created_at  │
                                                    └──────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│                     notifications                             │
│  - id (PK)                                                    │
│  - user_id (FK → profiles)                                   │
│  - title, message                                             │
│  - type (invitation, reminder, etc.)                          │
│  - read                                                       │
│  - data (JSON)                                                │
│  - created_at                                                 │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│                     push_tokens                               │
│  - id (PK)                                                    │
│  - user_id (FK → profiles)                                   │
│  - token (Expo push token)                                    │
│  - device_id                                                  │
│  - platform (ios, android, web)                               │
│  - created_at, updated_at                                     │
└──────────────────────────────────────────────────────────────┘
```

---

## Table Definitions

### 1. profiles

**Purpose:** Extended user information beyond Supabase auth.users

```sql
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL UNIQUE,
  full_name text,
  username text UNIQUE,
  avatar_url text,
  phone text,
  bio text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

**Columns:**
- `id` - UUID, matches auth.users.id (1:1 relationship)
- `email` - User's email (duplicated for convenience)
- `full_name` - Display name
- `username` - Optional unique username
- `avatar_url` - Profile picture URL (Supabase Storage)
- `phone` - Contact phone number
- `bio` - User biography/description

**Indexes:**
- Primary key on `id`
- Unique index on `email`
- Unique index on `username`

**RLS Policies:**
- Users can view all profiles (public data)
- Users can update only their own profile

---

### 2. vehicles

**Purpose:** Store vehicle information

```sql
CREATE TABLE vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  make text NOT NULL,
  model text NOT NULL,
  year integer NOT NULL CHECK (year >= 1900 AND year <= 2100),
  license_plate text NOT NULL,
  vin text,
  color text,
  current_mileage integer DEFAULT 0,
  main_image_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

**Columns:**
- `id` - UUID primary key
- `owner_id` - Owner's profile ID
- `make` - Vehicle manufacturer (e.g., "Toyota")
- `model` - Vehicle model (e.g., "Camry")
- `year` - Manufacturing year (1900-2100)
- `license_plate` - Registration plate number
- `vin` - Vehicle Identification Number (optional)
- `color` - Vehicle color
- `current_mileage` - Current odometer reading (auto-updated)
- `main_image_url` - Primary vehicle image

**Constraints:**
- Year must be between 1900 and 2100
- Owner must exist in profiles table

**Indexes:**
- Primary key on `id`
- Index on `owner_id` (frequently queried)
- Index on `created_at` (sorting)

---

### 3. vehicle_images

**Purpose:** Gallery of images for each vehicle

```sql
CREATE TABLE vehicle_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id uuid REFERENCES vehicles(id) ON DELETE CASCADE NOT NULL,
  image_url text NOT NULL,
  image_type image_type DEFAULT 'vehicle_gallery',
  caption text,
  display_order integer DEFAULT 0,
  uploaded_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TYPE image_type AS ENUM ('profile_avatar', 'vehicle_main', 'vehicle_gallery');
```

**Columns:**
- `id` - UUID primary key
- `vehicle_id` - Associated vehicle
- `image_url` - Supabase Storage URL
- `image_type` - Image category (enum)
- `caption` - Optional description
- `display_order` - Order in gallery (0 = first)
- `uploaded_by` - User who uploaded

**Indexes:**
- Composite index on `(vehicle_id, display_order)` for gallery sorting
- Index on `image_type`

---

### 4. vehicle_group_shares

**Purpose:** Selective vehicle sharing with specific groups

```sql
CREATE TABLE vehicle_group_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id uuid REFERENCES vehicles(id) ON DELETE CASCADE NOT NULL,
  group_id uuid REFERENCES groups(id) ON DELETE CASCADE NOT NULL,
  shared_by uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  shared_at timestamptz DEFAULT now(),
  UNIQUE(vehicle_id, group_id)
);
```

**Columns:**
- `id` - UUID primary key
- `vehicle_id` - Shared vehicle
- `group_id` - Group with access
- `shared_by` - User who shared (must be owner)
- `shared_at` - Timestamp of sharing

**Constraints:**
- Unique constraint on `(vehicle_id, group_id)` - prevent duplicate shares

**Indexes:**
- Composite index on `(vehicle_id, group_id)` for fast lookups
- Index on `vehicle_id`
- Index on `group_id`

---

### 5. groups

**Purpose:** Collaborative groups for vehicle sharing

```sql
CREATE TABLE groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

**Columns:**
- `id` - UUID primary key
- `owner_id` - Group creator/owner
- `name` - Group name (e.g., "Family Cars")
- `description` - Optional description

**Indexes:**
- Primary key on `id`
- Index on `owner_id`

---

### 6. group_members

**Purpose:** Group membership records

```sql
CREATE TABLE group_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid REFERENCES groups(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  joined_at timestamptz DEFAULT now(),
  UNIQUE(group_id, user_id)
);
```

**Columns:**
- `id` - UUID primary key
- `group_id` - Associated group
- `user_id` - Member's profile ID
- `joined_at` - Membership timestamp

**Constraints:**
- Unique constraint on `(group_id, user_id)` - one membership per user per group

**Indexes:**
- Composite index on `(group_id, user_id)`
- Index on `user_id` (find user's groups)

---

### 7. group_invitations

**Purpose:** Manage group invitation workflow

```sql
CREATE TABLE group_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid REFERENCES groups(id) ON DELETE CASCADE NOT NULL,
  invited_email text NOT NULL,
  invited_by uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  status invitation_status DEFAULT 'pending',
  token text UNIQUE NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TYPE invitation_status AS ENUM ('pending', 'accepted', 'declined', 'expired');
```

**Columns:**
- `id` - UUID primary key
- `group_id` - Target group
- `invited_email` - Email of invitee
- `invited_by` - User who sent invitation
- `status` - Invitation state (enum)
- `token` - Secure random token for verification
- `expires_at` - Expiration timestamp (typically 7 days)

**Constraints:**
- Unique token for security

**Indexes:**
- Index on `token` (for quick lookup)
- Index on `invited_email`
- Index on `status`

---

### 8. mileage_logs

**Purpose:** Track odometer readings

```sql
CREATE TABLE mileage_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id uuid REFERENCES vehicles(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  odometer_reading integer NOT NULL CHECK (odometer_reading >= 0),
  date date NOT NULL,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

**Columns:**
- `id` - UUID primary key
- `vehicle_id` - Associated vehicle
- `user_id` - User who recorded the log
- `odometer_reading` - Mileage reading (non-negative)
- `date` - Date of reading
- `notes` - Optional notes

**Constraints:**
- Odometer reading must be >= 0

**Indexes:**
- Index on `vehicle_id, date DESC` (recent logs first)
- Index on `user_id`

**Triggers:**
- Auto-update `vehicles.current_mileage` on INSERT

---

### 9. fuel_logs

**Purpose:** Track fuel purchases and consumption

```sql
CREATE TABLE fuel_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id uuid REFERENCES vehicles(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  liters_filled decimal(10,2) NOT NULL CHECK (liters_filled > 0),
  cost decimal(10,2) NOT NULL CHECK (cost > 0),
  fuel_price decimal(10,2) NOT NULL CHECK (fuel_price > 0),
  odometer_reading integer NOT NULL,
  location text,
  date date NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

**Columns:**
- `id` - UUID primary key
- `vehicle_id` - Associated vehicle
- `user_id` - User who recorded the log
- `liters_filled` - Fuel quantity (calculated from cost/price)
- `cost` - Total cost
- `fuel_price` - Price per liter (from dropdown)
- `odometer_reading` - Mileage at fill-up
- `location` - Gas station location (optional)
- `date` - Purchase date

**Constraints:**
- All amounts must be positive

**Indexes:**
- Index on `vehicle_id, date DESC`
- Index on `user_id`

---

### 10. service_logs

**Purpose:** Track maintenance and repair records

```sql
CREATE TABLE service_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id uuid REFERENCES vehicles(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  service_type service_type NOT NULL,
  description text NOT NULL,
  cost decimal(10,2),
  items jsonb, -- Array of {description, price}
  odometer_reading integer NOT NULL,
  next_service_due date,
  receipt_image_url text,
  ocr_extracted_data jsonb,
  auto_filled boolean DEFAULT false,
  date date NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TYPE service_type AS ENUM (
  'oil_change',
  'tire_rotation',
  'brake_service',
  'general_maintenance',
  'repair',
  'inspection',
  'other'
);
```

**Columns:**
- `id` - UUID primary key
- `vehicle_id` - Associated vehicle
- `user_id` - User who recorded the log
- `service_type` - Type of service (enum)
- `description` - Service description
- `cost` - Total cost (calculated from items)
- `items` - Itemized breakdown (JSONB array)
- `odometer_reading` - Mileage at service
- `next_service_due` - Recommended next service date
- `receipt_image_url` - Receipt image (Supabase Storage)
- `ocr_extracted_data` - OCR results (JSONB)
- `auto_filled` - Whether data came from OCR
- `date` - Service date

**Indexes:**
- Index on `vehicle_id, date DESC`
- Index on `service_type`
- Index on `user_id`

---

### 11. notifications

**Purpose:** In-app notification system

```sql
CREATE TABLE notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL, -- 'invitation', 'reminder', etc.
  read boolean DEFAULT false,
  data jsonb, -- Additional structured data
  created_at timestamptz DEFAULT now()
);
```

**Columns:**
- `id` - UUID primary key
- `user_id` - Recipient
- `title` - Notification title
- `message` - Notification body
- `type` - Notification category
- `read` - Read status
- `data` - Additional data (JSONB)

**Indexes:**
- Index on `user_id, read, created_at DESC` (unread notifications)

---

### 12. push_tokens

**Purpose:** Store Expo push notification tokens

```sql
CREATE TABLE push_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  token text NOT NULL UNIQUE,
  device_id text,
  platform text, -- 'ios', 'android', 'web'
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

**Columns:**
- `id` - UUID primary key
- `user_id` - Token owner
- `token` - Expo push token (unique)
- `device_id` - Device identifier
- `platform` - Device platform

**Indexes:**
- Unique index on `token`
- Index on `user_id`

---

## Relationships

### One-to-One (1:1)
- `auth.users` ↔ `profiles`

### One-to-Many (1:N)
- `profiles` → `vehicles` (one user owns many vehicles)
- `vehicles` → `vehicle_images` (one vehicle has many images)
- `profiles` → `groups` (one user owns many groups)
- `groups` → `group_members` (one group has many members)
- `groups` → `group_invitations` (one group has many invitations)
- `vehicles` → `mileage_logs` (one vehicle has many mileage logs)
- `vehicles` → `fuel_logs`
- `vehicles` → `service_logs`
- `profiles` → `notifications` (one user has many notifications)

### Many-to-Many (N:N)
- `vehicles` ↔ `groups` (via `vehicle_group_shares`)
  - One vehicle can be shared with multiple groups
  - One group can have access to multiple vehicles
- `profiles` ↔ `groups` (via `group_members`)
  - One user can be in multiple groups
  - One group has multiple members

---

## Indexes and Performance

### Primary Indexes (Automatically Created)
- Primary keys on all tables
- Unique constraints (email, username, tokens)

### Custom Indexes

```sql
-- Vehicle queries
CREATE INDEX idx_vehicles_owner ON vehicles(owner_id);
CREATE INDEX idx_vehicles_created ON vehicles(created_at DESC);

-- Vehicle images
CREATE INDEX idx_vehicle_images_vehicle ON vehicle_images(vehicle_id);
CREATE INDEX idx_vehicle_images_order ON vehicle_images(vehicle_id, display_order);
CREATE INDEX idx_vehicle_images_type ON vehicle_images(image_type);

-- Vehicle sharing
CREATE INDEX idx_vehicle_shares_vehicle ON vehicle_group_shares(vehicle_id);
CREATE INDEX idx_vehicle_shares_group ON vehicle_group_shares(group_id);
CREATE INDEX idx_vehicle_shares_composite ON vehicle_group_shares(vehicle_id, group_id);

-- Group members
CREATE INDEX idx_group_members_group ON group_members(group_id);
CREATE INDEX idx_group_members_user ON group_members(user_id);
CREATE INDEX idx_group_members_composite ON group_members(group_id, user_id);

-- Logs (recent first)
CREATE INDEX idx_mileage_logs_vehicle_date ON mileage_logs(vehicle_id, date DESC);
CREATE INDEX idx_fuel_logs_vehicle_date ON fuel_logs(vehicle_id, date DESC);
CREATE INDEX idx_service_logs_vehicle_date ON service_logs(vehicle_id, date DESC);

-- Notifications
CREATE INDEX idx_notifications_user_read ON notifications(user_id, read, created_at DESC);
```

### Query Optimization Strategies

1. **Composite Indexes:** Frequently queried together columns
2. **DESC Indexes:** For recent-first queries (logs, notifications)
3. **Covering Indexes:** Include commonly selected columns
4. **Partial Indexes:** Future optimization for frequently filtered data

---

## Security Policies

### Row Level Security (RLS)

**All tables have RLS enabled:**

```sql
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
-- ... (all tables)
```

### Example Policies

**Profiles:**
```sql
-- All users can view profiles (public data)
CREATE POLICY "Profiles are viewable by everyone"
ON profiles FOR SELECT
USING (true);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id);
```

**Vehicles:**
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

-- Users can update accessible vehicles (owned or shared)
CREATE POLICY "Users can update accessible vehicles"
ON vehicles FOR UPDATE
USING (can_user_access_vehicle(auth.uid(), id));

-- Only owners can delete vehicles
CREATE POLICY "Only owners can delete vehicles"
ON vehicles FOR DELETE
USING (auth.uid() = owner_id);
```

**Logs (similar for all log types):**
```sql
-- Users can view logs for accessible vehicles
CREATE POLICY "Users can view logs for accessible vehicles"
ON fuel_logs FOR SELECT
USING (
  can_user_access_vehicle(auth.uid(), vehicle_id)
);

-- Users can insert logs for accessible vehicles
CREATE POLICY "Users can insert logs for accessible vehicles"
ON fuel_logs FOR INSERT
WITH CHECK (
  can_user_access_vehicle(auth.uid(), vehicle_id)
);

-- Users can update logs for accessible vehicles
CREATE POLICY "Users can update logs for accessible vehicles"
ON fuel_logs FOR UPDATE
USING (
  can_user_access_vehicle(auth.uid(), vehicle_id)
);

-- Only vehicle owners can delete logs
CREATE POLICY "Only vehicle owners can delete logs"
ON fuel_logs FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM vehicles
    WHERE id = fuel_logs.vehicle_id
    AND owner_id = auth.uid()
  )
);
```

---

## Database Functions

### 1. get_user_vehicles_with_sharing()

**Purpose:** Optimized query to fetch all accessible vehicles with sharing info

```sql
CREATE OR REPLACE FUNCTION get_user_vehicles_with_sharing(user_uuid uuid)
RETURNS TABLE (
  vehicle_id uuid,
  make text,
  model text,
  year integer,
  license_plate text,
  vin text,
  main_image_url text,
  color text,
  current_mileage integer,
  created_at timestamptz,
  updated_at timestamptz,
  is_own_vehicle boolean,
  owner_name text,
  owner_email text,
  shared_groups text[]
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    v.id AS vehicle_id,
    v.make,
    v.model,
    v.year,
    v.license_plate,
    v.vin,
    v.main_image_url,
    v.color,
    v.current_mileage,
    v.created_at,
    v.updated_at,
    (v.owner_id = user_uuid) AS is_own_vehicle,
    p.full_name AS owner_name,
    p.email AS owner_email,
    COALESCE(
      ARRAY(
        SELECT g.name
        FROM vehicle_group_shares vgs
        INNER JOIN groups g ON vgs.group_id = g.id
        WHERE vgs.vehicle_id = v.id
      ),
      ARRAY[]::text[]
    ) AS shared_groups
  FROM vehicles v
  INNER JOIN profiles p ON v.owner_id = p.id
  WHERE
    v.owner_id = user_uuid
    OR v.id IN (
      SELECT vgs.vehicle_id
      FROM vehicle_group_shares vgs
      INNER JOIN group_members gm ON vgs.group_id = gm.group_id
      WHERE gm.user_id = user_uuid
    );
$$;
```

**Benefits:**
- Single query instead of multiple round trips
- Includes all necessary data
- Security definer prevents RLS recursion
- Returns both owned and shared vehicles

### 2. can_user_access_vehicle()

**Purpose:** Check if user has access to a vehicle (ownership or group membership)

```sql
CREATE OR REPLACE FUNCTION can_user_access_vehicle(
  user_uuid uuid,
  vehicle_uuid uuid
)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM vehicles
    WHERE id = vehicle_uuid
    AND (
      owner_id = user_uuid
      OR id IN (
        SELECT vgs.vehicle_id
        FROM vehicle_group_shares vgs
        INNER JOIN group_members gm ON vgs.group_id = gm.group_id
        WHERE gm.user_id = user_uuid
      )
    )
  );
$$;
```

**Usage:**
- RLS policies
- Application-level permission checks
- Returns true if user is owner or group member

### 3. get_user_group_ids()

**Purpose:** Get array of group IDs user belongs to (prevents RLS recursion)

```sql
CREATE OR REPLACE FUNCTION get_user_group_ids(user_uuid uuid)
RETURNS uuid[]
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT ARRAY(
    SELECT group_id
    FROM group_members
    WHERE user_id = user_uuid
  );
$$;
```

**Usage:**
- RLS policies to avoid recursive queries
- Efficient group membership checks

---

## Triggers

### 1. Update Vehicle Mileage on Log Insert

**Purpose:** Automatically update vehicle's current_mileage when mileage log is created

```sql
CREATE OR REPLACE FUNCTION update_vehicle_mileage()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE vehicles
  SET current_mileage = NEW.odometer_reading,
      updated_at = now()
  WHERE id = NEW.vehicle_id
  AND NEW.odometer_reading > current_mileage;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_update_vehicle_mileage
AFTER INSERT ON mileage_logs
FOR EACH ROW
EXECUTE FUNCTION update_vehicle_mileage();
```

**Logic:**
- Triggers after INSERT on mileage_logs
- Updates vehicles.current_mileage if new reading is higher
- Ensures current_mileage is always the latest/highest

### 2. Create Profile on User Signup

**Purpose:** Automatically create profile record when user signs up

```sql
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name'
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION handle_new_user();
```

**Logic:**
- Triggers after INSERT on auth.users (Supabase Auth table)
- Creates corresponding profile record
- Extracts full_name from user metadata

---

## Data Integrity

### Constraints Summary

1. **NOT NULL Constraints:**
   - All foreign keys
   - Critical fields (make, model, year, etc.)

2. **CHECK Constraints:**
   - Year: 1900 ≤ year ≤ 2100
   - Odometer readings: ≥ 0
   - Costs and prices: > 0

3. **UNIQUE Constraints:**
   - Email, username
   - Invitation tokens
   - Composite: (vehicle_id, group_id), (group_id, user_id)

4. **FOREIGN KEY Constraints:**
   - All relationships enforced
   - CASCADE on delete where appropriate
   - SET NULL for optional relationships

5. **DEFAULT Values:**
   - Timestamps: now()
   - UUIDs: gen_random_uuid()
   - Booleans: false
   - Arrays: empty array

---

## Storage Buckets

### Configured Buckets

```sql
INSERT INTO storage.buckets (id, name, public)
VALUES
  ('profile-avatars', 'profile-avatars', true),
  ('vehicle-images', 'vehicle-images', true),
  ('service-receipts', 'service-receipts', false);
```

1. **profile-avatars**
   - Public access
   - User profile pictures
   - RLS: Users can upload/update their own avatar

2. **vehicle-images**
   - Public access (for easy sharing)
   - Vehicle photos and galleries
   - RLS: Vehicle owners can upload

3. **service-receipts**
   - Private access (contains potentially sensitive info)
   - Service receipt images
   - RLS: Only vehicle owners/members can access

---

## Database Migrations

### Migration Strategy

1. **Version-controlled SQL files** in `/database/` directory
2. **Incremental migrations** (never modify existing migrations)
3. **Idempotent operations** (safe to run multiple times)
4. **Testing** on staging before production

### Current Schema Version

**Schema V2** (Enhanced with selective sharing)
- File: `database/new-schema-v2.sql`
- Major changes:
  - Replaced boolean `shared_with_groups` with `vehicle_group_shares` table
  - Added vehicle_images table
  - Enhanced profiles with avatar, phone, bio
  - Optimized database functions

---

**Next:** See [04-workflows.md](./04-workflows.md) for system workflows and user flows.
