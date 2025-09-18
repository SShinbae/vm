# Database Migration Guide V1 → V2

This guide will help you migrate from the current schema to the enhanced V2 schema with selective group sharing and image support.

## 🎯 What's New in V2

### Major Features Added:
1. **Selective Group Sharing** - Choose specific groups to share vehicles with
2. **Image Support** - Upload vehicle photos and profile avatars
3. **Enhanced Vehicle Data** - Color, mileage tracking, main image
4. **Better Performance** - Optimized queries and indexes
5. **Enhanced Security** - Improved RLS policies

### What Changes:
- ❌ **Removed**: `shared_with_groups` boolean column
- ✅ **Added**: `vehicle_group_shares` table for selective sharing
- ✅ **Added**: `vehicle_images` table for photo storage
- ✅ **Added**: Profile avatars, phone, bio fields
- ✅ **Added**: Vehicle color and mileage tracking
- ✅ **Added**: Supabase Storage buckets and policies

## ⚠️ Pre-Migration Checklist

Before starting the migration:

### 1. Backup Your Database
```sql
-- Create a backup of your current data
CREATE TABLE vehicles_backup AS SELECT * FROM vehicles;
CREATE TABLE groups_backup AS SELECT * FROM groups;
CREATE TABLE group_members_backup AS SELECT * FROM group_members;
-- Add other tables as needed
```

### 2. Note Current Sharing Status
```sql
-- Check current vehicle sharing status
SELECT
    id,
    make,
    model,
    user_id,
    shared_with_groups
FROM vehicles
WHERE shared_with_groups = true;
```

### 3. Check Dependencies
- Ensure you have admin access to your Supabase project
- Verify all your app instances are stopped during migration
- Have your Supabase project URL and service key ready

## 🚀 Migration Steps

### Step 1: Run the Enhanced Schema Script

1. **Open Supabase Dashboard**
   - Go to your project dashboard
   - Navigate to SQL Editor

2. **Execute the New Schema**
   ```sql
   -- Run the entire new-schema-v2.sql file
   -- This will add new tables and columns without breaking existing data
   ```

3. **Verify Schema Changes**
   ```sql
   -- Check new tables exist
   SELECT table_name FROM information_schema.tables
   WHERE table_schema = 'public'
   AND table_name IN ('vehicle_group_shares', 'vehicle_images');

   -- Check new columns exist
   SELECT column_name FROM information_schema.columns
   WHERE table_name = 'vehicles'
   AND column_name IN ('main_image_url', 'color', 'current_mileage');
   ```

### Step 2: Migrate Existing Sharing Data

If you have vehicles with `shared_with_groups = true`, migrate them:

```sql
-- Migrate boolean sharing to selective sharing
-- This shares vehicles with ALL groups the user is a member of
INSERT INTO vehicle_group_shares (vehicle_id, group_id, shared_by)
SELECT DISTINCT
    v.id as vehicle_id,
    gm.group_id,
    v.user_id as shared_by
FROM vehicles v
JOIN group_members gm ON v.user_id = gm.user_id
WHERE v.shared_with_groups = true
ON CONFLICT (vehicle_id, group_id) DO NOTHING;

-- Verify migration
SELECT
    v.make,
    v.model,
    g.name as group_name,
    vgs.shared_at
FROM vehicles v
JOIN vehicle_group_shares vgs ON v.id = vgs.vehicle_id
JOIN groups g ON vgs.group_id = g.id
ORDER BY vgs.shared_at DESC;
```

### Step 3: Update Application Code

#### 3.1 Update Type Imports
```typescript
// Replace old imports
// import { Database } from '@/types/database';

// With new imports
import { DatabaseV2, VehicleWithDetails, VehicleSharingConfig } from '@/types/database-v2';
```

#### 3.2 Update Service Layer
```typescript
// Example: Update vehicle service to use selective sharing
class VehicleServiceV2 {
  // Use the new sharing functions
  static async shareVehicleWithGroups(vehicleId: string, groupIds: string[]) {
    const { data, error } = await supabase.rpc('share_vehicle_with_groups', {
      vehicle_uuid: vehicleId,
      group_uuids: groupIds
    });
    return { data, error };
  }

  // Use the enhanced vehicle query
  static async getVehiclesWithSharing() {
    const { data, error } = await supabase.rpc('get_user_vehicles_with_sharing', {
      user_uuid: (await supabase.auth.getUser()).data.user?.id
    });
    return { data, error };
  }
}
```

### Step 4: Set Up Image Storage

#### 4.1 Verify Storage Buckets
```sql
-- Check storage buckets were created
SELECT * FROM storage.buckets WHERE id IN ('profile-avatars', 'vehicle-images');
```

#### 4.2 Test Image Upload
```typescript
// Test avatar upload
const testAvatarUpload = async (file: File) => {
  const fileName = `${user.id}/avatar.jpg`;
  const { data, error } = await supabase.storage
    .from('profile-avatars')
    .upload(fileName, file);

  if (!error) {
    // Update profile with avatar URL
    const avatarUrl = supabase.storage
      .from('profile-avatars')
      .getPublicUrl(fileName).data.publicUrl;

    await supabase
      .from('profiles')
      .update({ avatar_url: avatarUrl })
      .eq('id', user.id);
  }
};
```

### Step 5: Clean Up Old Schema (Optional)

⚠️ **Only do this after confirming everything works correctly!**

```sql
-- Remove old boolean sharing column
-- ALTER TABLE vehicles DROP COLUMN IF EXISTS shared_with_groups;

-- Remove old backup tables (after verification)
-- DROP TABLE IF EXISTS vehicles_backup;
-- DROP TABLE IF EXISTS groups_backup;
```

## 🧪 Testing Your Migration

### Test 1: Selective Sharing
```sql
-- Test selective sharing works
SELECT
    v.make || ' ' || v.model as vehicle,
    array_agg(g.name) as shared_with_groups
FROM vehicles v
JOIN vehicle_group_shares vgs ON v.id = vgs.vehicle_id
JOIN groups g ON vgs.group_id = g.id
GROUP BY v.id, v.make, v.model;
```

### Test 2: Image Storage
```typescript
// Test image upload and retrieval
const testImageFlow = async () => {
  // Upload test image
  const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('vehicle-images')
    .upload(`${userId}/test.jpg`, file);

  // Retrieve image URL
  const { data: urlData } = supabase.storage
    .from('vehicle-images')
    .getPublicUrl(`${userId}/test.jpg`);

  console.log('Upload successful:', !uploadError);
  console.log('URL generated:', urlData.publicUrl);
};
```

### Test 3: Enhanced Queries
```typescript
// Test enhanced vehicle queries
const testEnhancedQueries = async () => {
  const { data, error } = await supabase.rpc('get_user_vehicles_with_sharing', {
    user_uuid: user.id
  });

  console.log('Enhanced query works:', !error);
  console.log('Vehicles with sharing info:', data);
};
```

## 🚨 Troubleshooting

### Issue: Storage Buckets Not Created
```sql
-- Manually create buckets
INSERT INTO storage.buckets (id, name, public)
VALUES
  ('profile-avatars', 'profile-avatars', true),
  ('vehicle-images', 'vehicle-images', true)
ON CONFLICT (id) DO NOTHING;
```

### Issue: RLS Policies Blocking Access
```sql
-- Check policy status
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename IN ('vehicles', 'vehicle_group_shares', 'vehicle_images');

-- Reset and recreate policies if needed
-- (Re-run the policies section from new-schema-v2.sql)
```

### Issue: Function Not Found
```sql
-- Verify functions exist
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN ('get_user_vehicles_with_sharing', 'share_vehicle_with_groups');
```

### Issue: Migration Data Loss
```sql
-- Restore from backup if needed
INSERT INTO vehicles SELECT * FROM vehicles_backup;
-- Then re-run migration steps
```

## 📊 Verification Queries

### Final System Check
```sql
-- Complete system verification
SELECT
  'Migration Status' as check_type,

  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'vehicle_group_shares'
  ) THEN '✅ Selective sharing ready'
  ELSE '❌ Selective sharing missing'
  END as selective_sharing,

  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'vehicle_images'
  ) THEN '✅ Image support ready'
  ELSE '❌ Image support missing'
  END as image_support,

  CASE WHEN EXISTS (
    SELECT 1 FROM storage.buckets
    WHERE id = 'vehicle-images'
  ) THEN '✅ Storage configured'
  ELSE '❌ Storage missing'
  END as storage_status,

  (SELECT COUNT(*) FROM vehicle_group_shares) as total_shares,
  (SELECT COUNT(*) FROM vehicles) as total_vehicles;
```

### Data Integrity Check
```sql
-- Check data integrity
SELECT
  'Data Integrity' as check_type,
  COUNT(DISTINCT v.id) as total_vehicles,
  COUNT(DISTINCT vgs.vehicle_id) as vehicles_with_shares,
  COUNT(DISTINCT g.id) as total_groups,
  COUNT(DISTINCT gm.user_id) as total_users,
  COUNT(DISTINCT vi.vehicle_id) as vehicles_with_images
FROM vehicles v
LEFT JOIN vehicle_group_shares vgs ON v.id = vgs.vehicle_id
LEFT JOIN groups g ON vgs.group_id = g.id
LEFT JOIN group_members gm ON g.id = gm.group_id
LEFT JOIN vehicle_images vi ON v.id = vi.vehicle_id;
```

## 🎉 Post-Migration Steps

### 1. Update App Configuration
- Update your TypeScript types imports
- Deploy updated services to handle new schema
- Test all sharing functionality in your app

### 2. User Communication
- Inform users about new features
- Provide guidance on how to use selective sharing
- Explain image upload capabilities

### 3. Monitor Performance
- Check query performance with new indexes
- Monitor storage usage
- Verify RLS policies are working correctly

## 🔄 Rollback Plan (Emergency)

If something goes wrong, you can rollback:

```sql
-- Emergency rollback steps
-- 1. Restore from backup
DROP TABLE IF EXISTS vehicle_group_shares CASCADE;
DROP TABLE IF EXISTS vehicle_images CASCADE;

-- 2. Add back old column
ALTER TABLE vehicles ADD COLUMN shared_with_groups boolean DEFAULT false;

-- 3. Restore data
INSERT INTO vehicles SELECT * FROM vehicles_backup
ON CONFLICT (id) DO UPDATE SET
  make = EXCLUDED.make,
  model = EXCLUDED.model,
  shared_with_groups = EXCLUDED.shared_with_groups;

-- 4. Remove V2 functions
DROP FUNCTION IF EXISTS get_user_vehicles_with_sharing;
DROP FUNCTION IF EXISTS share_vehicle_with_groups;
```

---

## 📞 Support

If you encounter issues during migration:

1. **Check the logs** in your Supabase dashboard
2. **Verify each step** was completed successfully
3. **Test in development** before applying to production
4. **Keep backups** until migration is fully verified

**Remember**: This migration adds new features without breaking existing functionality. Take your time and verify each step!

🎯 **Goal**: Enhanced vehicle management with selective sharing and image support
🛡️ **Safety**: Non-destructive migration with rollback capability
🚀 **Result**: Modern, scalable vehicle management system