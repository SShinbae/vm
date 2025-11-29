# System Workflows and User Flows

**Document Version:** 1.0
**Last Updated:** November 29, 2024

---

## Table of Contents

1. [Overview](#overview)
2. [Authentication Workflows](#authentication-workflows)
3. [Vehicle Management Workflows](#vehicle-management-workflows)
4. [Group Management Workflows](#group-management-workflows)
5. [Logging Workflows](#logging-workflows)
6. [Analytics Workflows](#analytics-workflows)
7. [Notification Workflows](#notification-workflows)
8. [Permission Workflows](#permission-workflows)

---

## Overview

This document describes the primary user workflows and system processes in the Vehicles Management Application. Each workflow includes:

- **User Actions:** What the user does
- **System Response:** How the application responds
- **Data Flow:** Backend operations and database changes
- **Edge Cases:** Error handling and alternative paths

---

## Authentication Workflows

### 1. User Registration Flow

```
┌─────────────────────────────────────────────────────────────┐
│                  USER REGISTRATION WORKFLOW                  │
└─────────────────────────────────────────────────────────────┘

Step 1: User Access
├─ User navigates to /register screen
└─ System displays registration form

Step 2: Form Input
├─ User enters:
│  ├─ Email
│  ├─ Full Name
│  └─ Password (min 8 chars)
└─ System validates input client-side

Step 3: Submit Registration
├─ User clicks "Sign Up"
└─ System calls AuthContext.signUp()

Step 4: Backend Processing
├─ Supabase Auth creates user account
├─ Password is hashed (bcrypt)
├─ Email confirmation sent
└─ Trigger creates profile record

Step 5: Email Confirmation
├─ User receives email with confirmation link
├─ User clicks link
├─ Redirected to /auth/confirm
└─ Account activated

Step 6: First Login
├─ User navigates to /login
├─ Enters credentials
└─ Redirected to dashboard

┌────────────────────────────────────────────┐
│ Database Changes:                          │
│ 1. INSERT into auth.users                 │
│ 2. INSERT into profiles (via trigger)     │
│ 3. UPDATE auth.users (confirmed)          │
└────────────────────────────────────────────┘

Edge Cases:
✗ Email already exists → Show error "User already exists"
✗ Weak password → Show validation error
✗ Network error → Show "Connection failed, try again"
```

### 2. User Login Flow

```
┌─────────────────────────────────────────────────────────────┐
│                     USER LOGIN WORKFLOW                       │
└─────────────────────────────────────────────────────────────┘

Step 1: Access Login Screen
├─ User navigates to /login
└─ System shows login form

Step 2: Enter Credentials
├─ User enters email and password
└─ Client-side validation

Step 3: Attempt Login
├─ User clicks "Sign In"
└─ AuthContext.signIn() called

Step 4: Authentication
├─ Supabase verifies credentials
├─ Password hash compared
└─ Session created (JWT token)

Step 5: Profile Loading
├─ Fetch profile from profiles table
├─ Combine auth.user + profile data
└─ Update AuthContext state

Step 6: Navigation
├─ AuthGuard checks authentication
└─ Redirect to /(tabs)/index (Dashboard)

┌────────────────────────────────────────────┐
│ Session Management:                        │
│ - JWT stored in secure storage            │
│ - Session expiration: 1 hour              │
│ - Refresh token: 7 days                   │
│ - Auto-refresh before expiration          │
└────────────────────────────────────────────┘

Edge Cases:
✗ Invalid credentials → "Invalid email or password"
✗ Unconfirmed email → "Please confirm your email"
✗ Account locked → "Account temporarily locked"
```

### 3. Password Reset Flow

```
┌─────────────────────────────────────────────────────────────┐
│                 PASSWORD RESET WORKFLOW                       │
└─────────────────────────────────────────────────────────────┘

Step 1: Request Reset
├─ User clicks "Forgot Password" on login screen
├─ Navigate to /forgot-password
└─ Enter email address

Step 2: Send Reset Email
├─ User clicks "Send Reset Link"
├─ AuthContext.resetPassword(email)
└─ Supabase sends password reset email

Step 3: Email Received
├─ User clicks link in email
└─ Redirected to /reset-password?token=...

Step 4: New Password
├─ User enters new password (2x for confirmation)
├─ Client validates password strength
└─ Submits new password

Step 5: Password Updated
├─ Supabase updates password hash
├─ Invalidates old sessions
└─ User redirected to login

Step 6: Login with New Password
└─ User logs in with new credentials

Edge Cases:
✗ Email not found → "If email exists, reset link sent"
✗ Expired token → "Reset link expired, request new one"
✗ Weak password → Validation error
```

---

## Vehicle Management Workflows

### 1. Add New Vehicle Flow

```
┌─────────────────────────────────────────────────────────────┐
│                  ADD NEW VEHICLE WORKFLOW                     │
└─────────────────────────────────────────────────────────────┘

Step 1: Navigate to Add Vehicle
├─ User on Vehicles tab (/vehicles)
├─ Clicks "Add Vehicle" button
└─ Navigate to /vehicles/add

Step 2: Fill Vehicle Information
├─ User enters:
│  ├─ Make (text input)
│  ├─ Model (text input)
│  ├─ Year (number, 1900-2100)
│  ├─ License Plate (text)
│  ├─ VIN (optional)
│  └─ Color (optional)
└─ Client-side validation

Step 3: Upload Images (Optional)
├─ User clicks "Add Image"
├─ Opens ImagePicker
├─ User selects image from:
│  ├─ Camera
│  ├─ Photo Library
│  └─ (Web: File upload)
├─ Image displayed in preview
└─ Can add multiple images

Step 4: Submit Vehicle
├─ User clicks "Create Vehicle"
└─ VehicleService.createVehicle() called

Step 5: Backend Processing
├─ Validate data
├─ Upload images to Supabase Storage
│  ├─ Compress image
│  ├─ Generate unique filename
│  └─ Upload to 'vehicle-images' bucket
├─ INSERT into vehicles table
├─ INSERT into vehicle_images table (for each image)
└─ Return new vehicle data

Step 6: UI Update
├─ Navigate back to /vehicles
├─ Show success message
├─ New vehicle appears in list
└─ Refresh vehicle list

┌────────────────────────────────────────────┐
│ Database Changes:                          │
│ 1. INSERT into vehicles                   │
│ 2. INSERT into vehicle_images (x N)       │
│ Storage:                                   │
│ - Upload images to Supabase Storage       │
└────────────────────────────────────────────┘

Edge Cases:
✗ Missing required fields → Validation error
✗ Invalid year → "Year must be between 1900-2100"
✗ Image upload fails → Vehicle created without image, retry upload
✗ Network error → Show error, allow retry
```

### 2. Edit Vehicle Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    EDIT VEHICLE WORKFLOW                      │
└─────────────────────────────────────────────────────────────┘

Step 1: Access Vehicle Details
├─ User on Vehicles tab
├─ Clicks on vehicle card
└─ Navigate to /vehicles/[id]

Step 2: Initiate Edit
├─ User clicks "Edit" button
├─ System checks permissions:
│  ├─ If owner → Allow edit
│  ├─ If group member → Allow edit
│  └─ Else → Show "No permission"
└─ Navigate to /vehicles/[id]/edit

Step 3: Modify Information
├─ Form pre-filled with current data
├─ User modifies fields
├─ Can add/remove images
└─ Can change main image

Step 4: Submit Changes
├─ User clicks "Save Changes"
└─ VehicleService.updateVehicle() called

Step 5: Permission Validation
├─ Backend validates user access
│  └─ can_user_access_vehicle(user_id, vehicle_id)
├─ If not allowed → Return error
└─ If allowed → Continue

Step 6: Update Database
├─ UPDATE vehicles table
├─ Handle image changes:
│  ├─ Upload new images
│  ├─ Delete removed images from Storage
│  └─ Update vehicle_images table
└─ Return updated vehicle

Step 7: UI Update
├─ Navigate back to vehicle details
├─ Show success message
└─ Display updated information

┌────────────────────────────────────────────┐
│ Database Changes:                          │
│ 1. UPDATE vehicles                        │
│ 2. INSERT/DELETE vehicle_images           │
│ Storage:                                   │
│ - Upload new images                       │
│ - Delete removed images                   │
└────────────────────────────────────────────┘

Permission Logic:
✓ Owner → Can edit
✓ Group member (vehicle shared with their group) → Can edit
✗ Other users → Cannot edit
```

### 3. Delete Vehicle Flow

```
┌─────────────────────────────────────────────────────────────┐
│                   DELETE VEHICLE WORKFLOW                     │
└─────────────────────────────────────────────────────────────┘

Step 1: Access Vehicle
├─ User on vehicle details screen
└─ Clicks "Delete" button

Step 2: Permission Check
├─ System checks if user is owner
│  ├─ If owner → Show confirmation dialog
│  └─ If not owner → Show "Only owners can delete"
└─ Prevent deletion if not owner

Step 3: Confirm Deletion
├─ Dialog: "Are you sure? This will delete all logs."
├─ User clicks "Delete" or "Cancel"
└─ If canceled → Return to details

Step 4: Execute Deletion
├─ User confirms deletion
└─ VehicleService.deleteVehicle() called

Step 5: Cascade Delete
├─ Database ON DELETE CASCADE:
│  ├─ DELETE all vehicle_images
│  ├─ DELETE all vehicle_group_shares
│  ├─ DELETE all mileage_logs
│  ├─ DELETE all fuel_logs
│  └─ DELETE all service_logs
├─ Storage: Delete all vehicle images
└─ DELETE vehicle record

Step 6: UI Update
├─ Navigate back to /vehicles
├─ Show "Vehicle deleted successfully"
└─ Vehicle removed from list

┌────────────────────────────────────────────┐
│ Database Changes (Cascade):                │
│ 1. DELETE from vehicles                   │
│ 2. DELETE from vehicle_images             │
│ 3. DELETE from vehicle_group_shares       │
│ 4. DELETE from mileage_logs               │
│ 5. DELETE from fuel_logs                  │
│ 6. DELETE from service_logs               │
│ Storage:                                   │
│ - Delete all vehicle images               │
└────────────────────────────────────────────┘

Permission Logic:
✓ Owner ONLY → Can delete
✗ Group members → Cannot delete
✗ Others → Cannot delete
```

### 4. Share Vehicle with Group Flow

```
┌─────────────────────────────────────────────────────────────┐
│              SHARE VEHICLE WITH GROUP WORKFLOW                │
└─────────────────────────────────────────────────────────────┘

Step 1: Access Sharing Settings
├─ User on vehicle details screen
├─ Clicks "Share with Group"
└─ Opens group selector modal

Step 2: Select Groups
├─ System fetches user's groups
│  └─ GroupService.getGroups() (owned + member groups)
├─ Display groups as checkboxes
├─ Pre-select currently shared groups
└─ User toggles group selections

Step 3: Submit Sharing
├─ User clicks "Save Sharing"
└─ VehicleService.updateVehicleSharing() called

Step 4: Update Sharing Records
├─ For each newly selected group:
│  └─ INSERT into vehicle_group_shares
├─ For each unselected group:
│  └─ DELETE from vehicle_group_shares
└─ Atomic transaction

Step 5: Notify Group Members (Future)
├─ Create notification for each group member
└─ Push notification (optional)

Step 6: UI Update
├─ Close modal
├─ Update vehicle details with sharing info
└─ Show "Sharing updated successfully"

┌────────────────────────────────────────────┐
│ Database Changes:                          │
│ 1. INSERT into vehicle_group_shares       │
│ 2. DELETE from vehicle_group_shares       │
└────────────────────────────────────────────┘

Effects:
✓ Group members can now view vehicle
✓ Group members can add/edit logs
✓ Group members can edit vehicle details
✗ Group members cannot delete vehicle
✗ Group members cannot delete logs
```

---

## Group Management Workflows

### 1. Create Group Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    CREATE GROUP WORKFLOW                      │
└─────────────────────────────────────────────────────────────┘

Step 1: Navigate to Create Group
├─ User on Groups tab (placeholder currently)
├─ Clicks "Create Group"
└─ Navigate to /groups/create

Step 2: Enter Group Information
├─ User enters:
│  ├─ Group Name (required)
│  └─ Description (optional)
└─ Client validation

Step 3: Submit Group
├─ User clicks "Create Group"
└─ GroupService.createGroup() called

Step 4: Create Group Record
├─ INSERT into groups table
│  ├─ owner_id = current user
│  ├─ name
│  └─ description
└─ Return new group

Step 5: Auto-add Owner as Member
├─ INSERT into group_members
│  ├─ group_id = new group
│  └─ user_id = owner
└─ Owner is first member

Step 6: Navigate to Group
├─ Navigate to /groups/[id]
├─ Show success message
└─ Display empty group (only owner)

┌────────────────────────────────────────────┐
│ Database Changes:                          │
│ 1. INSERT into groups                     │
│ 2. INSERT into group_members (owner)      │
└────────────────────────────────────────────┘

Next Steps:
→ Invite members
→ Share vehicles with group
```

### 2. Invite Member to Group Flow

```
┌─────────────────────────────────────────────────────────────┐
│              INVITE MEMBER TO GROUP WORKFLOW                  │
└─────────────────────────────────────────────────────────────┘

Step 1: Access Group
├─ User navigates to /groups/[id]
└─ Clicks "Invite Member"

Step 2: Enter Invitee Email
├─ Navigate to /groups/[id]/invite
├─ User enters email address
└─ System validates email format

Step 3: Submit Invitation
├─ User clicks "Send Invitation"
└─ GroupService.inviteToGroup() called

Step 4: Create Invitation Record
├─ Generate secure random token
├─ Set expiration (7 days from now)
├─ INSERT into group_invitations
│  ├─ group_id
│  ├─ invited_email
│  ├─ invited_by = current user
│  ├─ status = 'pending'
│  ├─ token
│  └─ expires_at
└─ Return invitation

Step 5: Send Email Notification
├─ Supabase sends invitation email
├─ Email contains:
│  ├─ Group name
│  ├─ Inviter name
│  └─ Accept link with token
└─ Email sent to invited_email

Step 6: Create In-App Notification
├─ If email matches existing user:
│  ├─ INSERT into notifications
│  ├─ type = 'invitation'
│  └─ Push notification (if enabled)
└─ Else: No in-app notification

Step 7: UI Update
├─ Navigate back to group details
├─ Show "Invitation sent successfully"
└─ Invitation appears in pending list

┌────────────────────────────────────────────┐
│ Database Changes:                          │
│ 1. INSERT into group_invitations          │
│ 2. INSERT into notifications (if user)    │
└────────────────────────────────────────────┘

Edge Cases:
✗ Email already a member → "User already in group"
✗ Pending invitation exists → "Invitation already sent"
✗ Invalid email → Validation error
```

### 3. Accept Group Invitation Flow

```
┌─────────────────────────────────────────────────────────────┐
│            ACCEPT GROUP INVITATION WORKFLOW                   │
└─────────────────────────────────────────────────────────────┘

Step 1: Receive Notification
├─ User receives:
│  ├─ Email with invitation link
│  └─ In-app notification (if registered)
└─ Clicks on invitation

Step 2: View Invitation Details
├─ Navigate to /groups/invitation/[token]
├─ System fetches invitation by token
├─ Display:
│  ├─ Group name
│  ├─ Inviter name
│  └─ "Accept" / "Decline" buttons
└─ Check expiration

Step 3: Accept Invitation
├─ User clicks "Accept"
└─ GroupService.acceptInvitation() called

Step 4: Validate and Process
├─ Check invitation status = 'pending'
├─ Check not expired
├─ Check user email matches invited_email
└─ If valid, continue

Step 5: Create Membership
├─ INSERT into group_members
│  ├─ group_id
│  └─ user_id = current user
├─ UPDATE group_invitations
│  └─ status = 'accepted'
└─ Delete notification

Step 6: Grant Vehicle Access
├─ User now has access to:
│  └─ All vehicles shared with this group
└─ Automatic via RLS policies

Step 7: Navigate to Group
├─ Navigate to /groups/[id]
├─ Show "You joined [Group Name]"
└─ Display group vehicles and members

┌────────────────────────────────────────────┐
│ Database Changes:                          │
│ 1. INSERT into group_members              │
│ 2. UPDATE group_invitations (accepted)    │
│ 3. DELETE from notifications              │
└────────────────────────────────────────────┘

Edge Cases:
✗ Expired invitation → "Invitation expired"
✗ Already accepted → "Already a member"
✗ Email mismatch → "Invitation not for this account"
```

---

## Logging Workflows

### 1. Add Fuel Log Flow

```
┌─────────────────────────────────────────────────────────────┐
│                  ADD FUEL LOG WORKFLOW                        │
└─────────────────────────────────────────────────────────────┘

Step 1: Navigate to Add Fuel Log
├─ User on Logs tab (/logs)
├─ Selects "Fuel" tab
├─ Clicks "Add Fuel Log"
└─ Navigate to /logs/fuel/add

Step 2: Select Vehicle
├─ VehicleSelector displays:
│  ├─ Owned vehicles
│  └─ Group-shared vehicles
├─ User selects vehicle
└─ Form activates

Step 3: Enter Fuel Data
├─ User selects:
│  ├─ Fuel Price (dropdown: RM 2.05, 2.50, etc.)
│  └─ Date (date picker)
├─ User enters:
│  ├─ Total Cost (RM)
│  ├─ Odometer Reading (km)
│  └─ Location (optional)
├─ System calculates:
│  └─ Liters Filled = Cost / Fuel Price
└─ Display calculated liters

Step 4: Submit Log
├─ User clicks "Add Log"
├─ Validate odometer (must be ≥ current)
└─ FuelLogService.createFuelLog() called

Step 5: Backend Processing
├─ Validate user has access to vehicle
├─ Validate odometer reading
├─ INSERT into fuel_logs
└─ Return new log

Step 6: Update Analytics
├─ Analytics recalculated on next fetch
└─ Fuel efficiency updated

Step 7: UI Update
├─ Navigate back to /logs (Fuel tab)
├─ Show "Fuel log added successfully"
├─ New log appears in list
└─ Refresh log list

┌────────────────────────────────────────────┐
│ Database Changes:                          │
│ 1. INSERT into fuel_logs                  │
└────────────────────────────────────────────┘

Validation Rules:
✓ Odometer ≥ vehicle's current_mileage
✓ All amounts > 0
✓ Date ≤ today
✗ Future date → Error
✗ Decreasing mileage → Error
```

### 2. Add Service Log with Receipt OCR Flow

```
┌─────────────────────────────────────────────────────────────┐
│          ADD SERVICE LOG WITH OCR WORKFLOW                    │
└─────────────────────────────────────────────────────────────┘

Step 1: Navigate and Select Vehicle
├─ Navigate to /logs/service/add
├─ Select vehicle from dropdown
└─ Form activates

Step 2: Capture/Upload Receipt
├─ User clicks "Add Receipt"
├─ Options:
│  ├─ Take Photo (camera)
│  └─ Upload from Gallery
├─ User selects image
└─ Image displayed in preview

Step 3: OCR Processing (Optional)
├─ User clicks "Extract Data from Receipt"
├─ ImageUploadService.processReceipt() called
├─ Upload to Supabase Storage (temporary)
├─ OCR Service processes image:
│  ├─ Extract text
│  ├─ Parse service type
│  ├─ Parse cost
│  ├─ Parse date
│  └─ Return extracted data with confidence
└─ Auto-fill form fields

Step 4: Review and Adjust
├─ OCR results pre-fill form:
│  ├─ Service Type (from extracted)
│  ├─ Cost (from extracted)
│  ├─ Date (from extracted)
│  └─ Description (from extracted)
├─ User reviews and corrects if needed
└─ Confidence scores shown for each field

Step 5: Add Service Items
├─ User adds itemized breakdown:
│  ├─ Description
│  └─ Price
├─ Can add multiple items
├─ Total calculated automatically
└─ Can also use single description + total

Step 6: Complete Log Entry
├─ User enters:
│  ├─ Odometer Reading
│  └─ Next Service Due Date (optional)
└─ Click "Add Service Log"

Step 7: Submit to Backend
├─ ServiceLogService.createServiceLog() called
├─ Validate data
├─ Upload receipt image permanently
├─ INSERT into service_logs
│  ├─ Basic fields
│  ├─ items (JSONB array)
│  ├─ receipt_image_url
│  ├─ ocr_extracted_data (JSONB)
│  └─ auto_filled = true
└─ Return new log

Step 8: UI Update
├─ Navigate back to /logs (Service tab)
├─ Show success message
└─ New log appears with receipt thumbnail

┌────────────────────────────────────────────┐
│ Database Changes:                          │
│ 1. INSERT into service_logs               │
│ Storage:                                   │
│ - Upload receipt image                    │
│ - Store in 'service-receipts' bucket     │
└────────────────────────────────────────────┘

OCR Confidence Handling:
✓ High confidence (>80%) → Auto-fill
⚠️ Medium confidence (50-80%) → Fill with warning
✗ Low confidence (<50%) → Suggest manual entry
```

### 3. Add Mileage Log Flow

```
┌─────────────────────────────────────────────────────────────┐
│                 ADD MILEAGE LOG WORKFLOW                      │
└─────────────────────────────────────────────────────────────┘

Step 1: Access Form
├─ Navigate to /logs/mileage/add
├─ Select vehicle
└─ Form displays current mileage

Step 2: Enter Mileage
├─ User enters:
│  ├─ New Odometer Reading
│  ├─ Date
│  └─ Notes (optional)
├─ System shows current mileage for reference
└─ Validates new reading ≥ current

Step 3: Submit Log
├─ User clicks "Add Log"
└─ MileageLogService.createMileageLog()

Step 4: Database Transaction
├─ INSERT into mileage_logs
├─ Trigger fires: update_vehicle_mileage()
├─ UPDATE vehicles.current_mileage
│  └─ Only if new reading > current
└─ Return new log

Step 5: UI Update
├─ Navigate back to /logs (Mileage tab)
├─ Show success
└─ Vehicle's current mileage updated everywhere

┌────────────────────────────────────────────┐
│ Database Changes:                          │
│ 1. INSERT into mileage_logs               │
│ 2. UPDATE vehicles (via trigger)          │
└────────────────────────────────────────────┘

Auto-Update Logic:
✓ New reading > current → Update vehicle
✓ New reading = current → Log created, no update
✗ New reading < current → Validation error
```

---

## Analytics Workflows

### 1. View Analytics Dashboard Flow

```
┌─────────────────────────────────────────────────────────────┐
│              ANALYTICS DASHBOARD WORKFLOW                     │
└─────────────────────────────────────────────────────────────┘

Step 1: Navigate to Analytics
├─ User clicks "Analytics" tab
└─ Navigate to /(tabs)/analytics

Step 2: Load Analytics Data
├─ useAnalytics() hook executes
├─ Fetch data in parallel:
│  ├─ VehicleService.getVehicles() (owned + shared)
│  ├─ FuelLogService.getFuelLogs()
│  ├─ ServiceLogService.getServiceLogs()
│  └─ MileageLogService.getMileageLogs()
└─ Show loading skeleton

Step 3: Process Analytics
├─ AnalyticsService.getAnalytics() processes data:
│  ├─ Filter by selected period
│  ├─ Calculate monthly trends
│  ├─ Compute expense breakdowns
│  ├─ Aggregate by vehicle
│  ├─ Calculate fuel efficiency
│  └─ Generate chart data
└─ Update state with results

Step 4: Render Dashboard
├─ Display analytics tabs:
│  ├─ Overview (default)
│  ├─ Fuel
│  ├─ Service
│  └─ Performance
├─ Show period selector
├─ Show vehicle filter
└─ Render charts and metrics

Step 5: User Interactions
├─ Change period (Last 3/6 months, 1 year, All time)
│  └─ Re-calculate analytics for period
├─ Filter by vehicle
│  └─ Re-calculate for selected vehicle(s)
├─ Switch tabs
│  └─ Display different chart sets
└─ Pull to refresh
   └─ Refetch all data

┌────────────────────────────────────────────┐
│ Data Sources:                              │
│ - fuel_logs (all accessible vehicles)     │
│ - service_logs (all accessible vehicles)  │
│ - mileage_logs (all accessible vehicles)  │
│                                            │
│ Calculations:                              │
│ - Fuel efficiency (km/L)                  │
│ - Average cost per km                     │
│ - Monthly expense trends                  │
│ - Service frequency                       │
│ - Expense breakdowns                      │
└────────────────────────────────────────────┘

Performance Optimization:
✓ Parallel data fetching
✓ Client-side calculations (no DB load)
✓ Memoized chart data
✓ Lazy load charts
```

### 2. Export Analytics Report Flow (Future)

```
┌─────────────────────────────────────────────────────────────┐
│              EXPORT ANALYTICS REPORT WORKFLOW                 │
└─────────────────────────────────────────────────────────────┘

Step 1: Access Export
├─ User on Analytics screen
└─ Clicks "Export Report"

Step 2: Select Options
├─ Choose format:
│  ├─ PDF
│  ├─ CSV
│  └─ Excel
├─ Select date range
└─ Select vehicles to include

Step 3: Generate Report
├─ Collect analytics data
├─ Format for export
├─ Generate file
└─ Show progress indicator

Step 4: Share/Download
├─ Mobile: Share sheet (email, message, etc.)
├─ Web: Download file
└─ Show success message

Future Implementation:
- PDF with charts and tables
- CSV for raw data export
- Scheduled reports via email
```

---

## Notification Workflows

### 1. Group Invitation Notification Flow

```
┌─────────────────────────────────────────────────────────────┐
│          GROUP INVITATION NOTIFICATION WORKFLOW               │
└─────────────────────────────────────────────────────────────┘

Step 1: Invitation Created
├─ Group owner sends invitation
└─ Invitation record created

Step 2: Check if User Exists
├─ Query profiles table by email
├─ If found → Continue to Step 3
└─ If not found → Email only, no notification

Step 3: Create Notification
├─ INSERT into notifications:
│  ├─ user_id (recipient)
│  ├─ title: "Group Invitation"
│  ├─ message: "You've been invited to join [Group Name]"
│  ├─ type: "invitation"
│  ├─ read: false
│  └─ data: { group_id, invitation_id, token }
└─ Notification created

Step 4: Send Push Notification
├─ Check if user has push token
├─ If yes:
│  ├─ Fetch token from push_tokens
│  ├─ Send via Expo Push Notification service
│  └─ Badge count updated
└─ If no: Skip

Step 5: User Receives Notification
├─ In-app badge count updates
├─ Push notification appears (if enabled)
└─ Email also sent

Step 6: User Views Notification
├─ User opens app
├─ Clicks notification bell
├─ Navigate to /notifications
├─ Shows list of notifications
└─ Unread count displayed

Step 7: User Acts on Notification
├─ User clicks notification
├─ Navigate to invitation details
├─ User accepts/declines
└─ Notification marked as read

Step 8: Cleanup
├─ UPDATE notifications SET read = true
├─ If accepted/declined:
│  └─ DELETE notification
└─ Badge count decremented

┌────────────────────────────────────────────┐
│ Database Changes:                          │
│ 1. INSERT into notifications              │
│ 2. UPDATE notifications (read)            │
│ 3. DELETE notification (after action)     │
└────────────────────────────────────────────┘
```

---

## Permission Workflows

### Permission Validation Flow

```
┌─────────────────────────────────────────────────────────────┐
│               PERMISSION VALIDATION WORKFLOW                  │
└─────────────────────────────────────────────────────────────┘

Operation: User attempts action on vehicle

Step 1: User Action
├─ User tries to:
│  ├─ View vehicle
│  ├─ Edit vehicle
│  ├─ Delete vehicle
│  ├─ Add log
│  ├─ Edit log
│  └─ Delete log
└─ System initiates permission check

Step 2: Application-Level Check
├─ Call can_user_access_vehicle(user_id, vehicle_id)
├─ Function checks:
│  ├─ Is user the owner?
│  │  └─ SELECT * FROM vehicles WHERE id = ? AND owner_id = ?
│  ├─ Is vehicle shared with user's groups?
│  │  └─ JOIN vehicle_group_shares → group_members
│  └─ Return boolean
└─ If false → Deny action immediately

Step 3: Database-Level Check (RLS)
├─ Query executed with RLS policies
├─ Policies filter results based on:
│  ├─ auth.uid() = owner_id
│  ├─ Vehicle in user's accessible vehicles
│  └─ Group membership
└─ Only accessible rows returned

Step 4: Action-Specific Logic
├─ View: Allow if owner OR group member
├─ Edit: Allow if owner OR group member
├─ Delete: Allow ONLY if owner
├─ Add Log: Allow if owner OR group member
├─ Edit Log: Allow if owner OR group member
└─ Delete Log: Allow ONLY if vehicle owner

Step 5: Response
├─ If allowed:
│  ├─ Execute operation
│  └─ Return success
└─ If denied:
   ├─ Return error
   └─ Show "Permission denied" message

┌────────────────────────────────────────────┐
│ Permission Matrix:                         │
│                                            │
│ Action        | Owner | Group Member       │
│ -------------|-------|-------------------  │
│ View Vehicle | ✓     | ✓                   │
│ Edit Vehicle | ✓     | ✓                   │
│ Delete Veh.  | ✓     | ✗                   │
│ Add Log      | ✓     | ✓                   │
│ Edit Log     | ✓     | ✓                   │
│ Delete Log   | ✓     | ✗                   │
│ Share Veh.   | ✓     | ✗                   │
└────────────────────────────────────────────┘

Multi-Layer Security:
1. UI: Hide/disable unauthorized actions
2. Application: Validate before API call
3. Database: RLS policies enforce access
```

---

## Error Handling Workflows

### General Error Handling Pattern

```
┌─────────────────────────────────────────────────────────────┐
│                  ERROR HANDLING WORKFLOW                      │
└─────────────────────────────────────────────────────────────┘

Error Occurs:
├─ Network error
├─ Validation error
├─ Permission denied
├─ Database error
└─ Unexpected error

Application Layer:
├─ Service catches error
├─ Log error to console
├─ Return ApiResponse with error message
└─ Component receives error

UI Layer:
├─ Display user-friendly error message
├─ Provide retry option (if applicable)
├─ Log to error tracking service (future)
└─ Allow graceful degradation

User Actions:
├─ Retry operation
├─ Dismiss error
├─ Contact support (future)
└─ Return to previous screen

Error Types and Responses:
├─ Network: "Connection failed. Check internet."
├─ Validation: Specific field error
├─ Permission: "You don't have permission."
├─ Not Found: "Resource not found."
└─ Server: "Something went wrong. Try again."
```

---

**Next:** See [05-api-documentation.md](./05-api-documentation.md) for detailed API documentation.
