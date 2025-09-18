# Vehicle Sharing & Group Management Guide

This guide explains how the vehicle sharing and group management features work in the Vehicles Management app, current issues, and solutions.

## Current Group Features (✅ Working)

### Group Member Visibility
Team members can see all members in groups including the group owner:

- **Group List View** (`/groups`): Shows all groups you own or are a member of
- **Group Detail View** (`/groups/[id]`): Displays all group members with:
  - Member names and email addresses
  - Join dates
  - Owner clearly marked with "Owner" badge
  - Member management options for group owners

### Group Management
- **Create Groups**: Anyone can create a group and become the owner
- **Invite Members**: Group owners and members can send email invitations
- **Accept/Decline Invitations**: Users receive invitations and can accept or decline
- **Leave Groups**: Members can leave groups (owners cannot leave, must transfer ownership or delete)
- **Remove Members**: Group owners can remove members from groups

## Vehicle Sharing Issues (❌ Currently Broken)

### The Problem
Currently, shared vehicles **cannot be seen by group members** due to database schema and service implementation issues.

### Expected Behavior
When a vehicle owner enables "Share with groups":
1. Vehicle should appear in the vehicle list of all group members
2. Group members should see shared vehicles marked with owner information
3. Shared vehicles should be read-only for group members (view logs, but cannot edit)

### Current Issues Identified

#### 1. Database Schema Issues
- Missing or inconsistent `shared_with_groups` column in vehicles table
- RLS (Row Level Security) policies may not be properly configured
- Potential data type or constraint issues

#### 2. Service Implementation Problems
In `lib/services/vehicleService.ts`:
```typescript
// This query fails if shared_with_groups column is missing
.eq('shared_with_groups', true)
```

#### 3. Error Handling
- Poor error handling when database schema is incomplete
- No fallback mechanism for missing features
- Confusing user feedback when sharing doesn't work

## Solutions Implementation

### 1. Database Schema Fixes
Run the following SQL to ensure proper schema:

```sql
-- Add shared_with_groups column if missing
ALTER TABLE vehicles
ADD COLUMN IF NOT EXISTS shared_with_groups BOOLEAN DEFAULT false;

-- Update existing vehicles to have sharing disabled by default
UPDATE vehicles
SET shared_with_groups = false
WHERE shared_with_groups IS NULL;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_vehicles_shared_groups
ON vehicles(shared_with_groups) WHERE shared_with_groups = true;
```

### 2. RLS Policy Updates
```sql
-- Allow group members to see shared vehicles
CREATE POLICY "Group members can view shared vehicles" ON vehicles
FOR SELECT USING (
  shared_with_groups = true AND
  user_id IN (
    SELECT DISTINCT gm1.user_id
    FROM group_members gm1
    JOIN group_members gm2 ON gm1.group_id = gm2.group_id
    WHERE gm2.user_id = auth.uid()
  )
);
```

### 3. Service Layer Improvements
Enhanced error handling and fallback mechanisms in vehicle service with:
- Better debugging information
- Graceful degradation when features are unavailable
- Clear user feedback about sharing status

## User Guide

### For Vehicle Owners

#### How to Share Your Vehicle with Groups
1. Go to your vehicle details
2. Tap "Edit Vehicle"
3. Toggle "Share with groups" to ON
4. Save changes

Your vehicle will now be visible to all members of groups you belong to.

#### Managing Shared Vehicles
- You can toggle sharing on/off at any time
- Shared vehicles remain under your full control
- Group members can only view your vehicle information and logs

### For Group Members

#### Viewing Shared Vehicles
1. Navigate to the "Vehicles" tab
2. Shared vehicles appear in a separate "Shared Vehicles" section
3. Each shared vehicle shows the owner's name
4. Tap to view details and maintenance logs

#### What You Can Do with Shared Vehicles
- ✅ View vehicle information (make, model, year, etc.)
- ✅ View maintenance logs (fuel, service, mileage)
- ✅ See vehicle statistics and history
- ❌ Edit vehicle information
- ❌ Add or modify logs
- ❌ Delete the vehicle

### For Group Owners

#### Managing Group Vehicle Sharing
1. Create and manage your group
2. Invite members via email
3. Encourage members to share their vehicles
4. View all shared vehicles from group members

## Troubleshooting

### "No Shared Vehicles" Showing
**Possible Causes:**
1. No group members have enabled vehicle sharing
2. Database schema issues
3. RLS policy problems

**Solutions:**
1. Ask group members to enable sharing on their vehicles
2. Check database schema and run fix scripts
3. Verify RLS policies are properly configured

### Sharing Toggle Not Working
**Possible Causes:**
1. Missing database column
2. Permission issues
3. Network connectivity

**Solutions:**
1. Run database schema fix scripts
2. Check user permissions
3. Try again with stable internet connection

### Cannot See Group Members
**This should be working.** If you cannot see group members:
1. Refresh the app
2. Check your internet connection
3. Verify you're still a member of the group
4. Contact support if issue persists

## Technical Details

### Database Tables
- `groups`: Stores group information and ownership
- `group_members`: Tracks group membership
- `group_invitations`: Manages invitation workflow
- `vehicles`: Stores vehicle info with sharing flag
- `profiles`: User profile information

### Key Files
- `lib/services/groupService.ts`: Group and invitation management
- `lib/services/vehicleService.ts`: Vehicle operations and sharing logic
- `app/groups/[id].tsx`: Group detail view with member list
- `app/(tabs)/vehicles.tsx`: Vehicle list with sharing indicators
- `types/database.ts`: TypeScript definitions for database schema

### Privacy & Security
- Vehicles are private by default (`shared_with_groups = false`)
- Only explicitly shared vehicles are visible to group members
- Group members cannot modify shared vehicles
- Vehicle owners can revoke sharing at any time
- RLS policies enforce data access controls

## Known Limitations

1. **Email Notifications**: Invitation emails are not yet implemented
2. **Real-time Updates**: Vehicle sharing changes require app refresh
3. **Bulk Operations**: No way to share multiple vehicles at once
4. **Advanced Permissions**: All group members have same access level

## Roadmap

### Short Term
- [ ] Fix vehicle sharing service implementation
- [ ] Add sharing indicators to vehicle UI
- [ ] Improve error handling and user feedback
- [ ] Create database schema verification tools

### Medium Term
- [ ] Implement email notifications for invitations
- [ ] Add real-time updates for sharing changes
- [ ] Create advanced permission system
- [ ] Add bulk vehicle sharing operations

### Long Term
- [ ] Vehicle sharing analytics and insights
- [ ] Integration with maintenance reminders
- [ ] Multi-level group hierarchies
- [ ] Advanced collaboration features

## Support

If you encounter issues with vehicle sharing or group management:

1. Check this guide for troubleshooting steps
2. Verify your database schema is up to date
3. Review the service implementation logs
4. Create an issue in the project repository with detailed information

---

*Last updated: [Current Date]*
*Version: 1.0*