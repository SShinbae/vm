# Vehicle Profile Pictures - Feature Documentation

## Overview

This document describes the vehicle profile picture feature implementation, including image upload, cropping, and display functionality for both web and mobile platforms.

## Features Implemented

### 1. Image Upload with Cropping

- **Web Platform**: Advanced image cropping using `react-image-crop` library
- **Mobile Platform**: Built-in image editing using `expo-image-picker`
- **Aspect Ratio**: 1:1 square crop for consistent display
- **Image Storage**: Supabase storage bucket

### 2. Vehicle Edit Screen Enhancement

- Added image picker component to vehicle edit screen (`app/vehicles/[id]/edit.tsx`)
- Only vehicle owners can edit vehicle images (shared vehicle protection)
- Image preview with remove functionality
- Image upload on save with fallback handling

### 3. Vehicle List Display

- Vehicle cards show actual images when `main_image_url` exists
- Falls back to icon display when no image is available
- Maintains shared/owned vehicle badge indicators
- Responsive image display with circular frame

## Files Modified

### Components

1. **`components/ui/ImageCropModal.tsx`**
   - Made reusable with configurable props
   - Added `title`, `description`, and `aspectRatio` props
   - Supports different crop ratios (default 1:1 for square)

2. **`components/ui/ImagePicker.tsx`**
   - Added web cropping integration
   - New props: `enableWebCropping`, `cropAspectRatio`, `cropTitle`, `cropDescription`
   - Automatic image upload after cropping on web
   - Mobile continues using built-in editing

### Screens

3. **`app/vehicles/[id]/edit.tsx`**
   - Added ImagePicker component
   - Integrated image upload logic
   - Updates `main_image_url` field on save
   - Handles old image deletion when replacing

4. **`app/(tabs)/vehicles.tsx`**
   - Updated VehicleCard to display images
   - Added fallback to icon when no image
   - Maintains visual consistency with icons

## Usage Guide

### For Users - Adding/Editing Vehicle Photos

#### On Web:

1. Navigate to vehicle edit screen
2. Click on "Add a vehicle photo" placeholder
3. Select image from computer
4. Crop modal appears automatically
5. Drag to adjust crop area (1:1 square)
6. Click "Save" to apply crop
7. Image uploads automatically
8. Click "Save" button on edit screen to persist changes

#### On Mobile (iOS/Android):

1. Navigate to vehicle edit screen
2. Tap on "Add a vehicle photo" placeholder
3. Choose "Take Photo" or "Choose from Gallery"
4. Use device's built-in editing tools
5. Confirm selection
6. Image displays in preview
7. Tap "Save" button to persist changes

### For Developers - Using the Components

#### ImagePicker with Web Cropping:

```tsx
<ImagePicker
  onImageSelected={setImageUri}
  currentImage={imageUri}
  label="Vehicle Photo (Optional)"
  placeholder="Add a vehicle photo"
  enableWebCropping={true}
  cropAspectRatio={1}
  cropTitle="Crop Vehicle Photo"
  cropDescription="Drag to adjust the crop area. The image will be cropped to a square for best display."
/>
```

#### ImageCropModal (Standalone):

```tsx
<ImageCropModal
  visible={showModal}
  imageUri={tempImageUri}
  onClose={handleClose}
  onCropComplete={handleCropComplete}
  onError={handleError}
  title="Crop Image"
  description="Adjust the crop area"
  aspectRatio={1}
/>
```

## Technical Details

### Image Upload Flow (Web)

1. User selects image via ImagePicker
2. If `enableWebCropping=true`, ImageCropModal opens
3. User adjusts crop area
4. On save, canvas generates cropped blob
5. Blob converted to File object
6. `uploadImage()` uploads to Supabase storage
7. Public URL returned and stored

### Image Upload Flow (Mobile)

1. User selects image via ImagePicker
2. Native picker with `allowsEditing=true` opens
3. User crops using native UI
4. URI returned directly
5. On save, `updateVehicleImage()` uploads to Supabase
6. Public URL returned and stored

### Database Schema

```typescript
vehicles: {
  main_image_url: string | null; // Supabase storage URL
}
```

## Testing Checklist

### Web Platform

- [ ] Upload new vehicle image via edit screen
- [ ] Crop image using crop modal
- [ ] Image displays correctly in vehicle list
- [ ] Remove existing vehicle image
- [ ] Replace existing vehicle image
- [ ] Cancel during crop operation
- [ ] Error handling for upload failures
- [ ] Shared vehicle cannot edit image

### Mobile Platform (iOS)

- [ ] Take photo using camera
- [ ] Select photo from gallery
- [ ] Use built-in crop/edit tools
- [ ] Image displays correctly in vehicle list
- [ ] Remove existing vehicle image
- [ ] Replace existing vehicle image
- [ ] Permission handling (camera/library)
- [ ] Shared vehicle cannot edit image

### Mobile Platform (Android)

- [ ] Take photo using camera
- [ ] Select photo from gallery
- [ ] Use built-in crop/edit tools
- [ ] Image displays correctly in vehicle list
- [ ] Remove existing vehicle image
- [ ] Replace existing vehicle image
- [ ] Permission handling (camera/library)
- [ ] Shared vehicle cannot edit image

### Cross-Platform

- [ ] Vehicle without image shows icon
- [ ] Vehicle with image shows image
- [ ] Circular image frame displays correctly
- [ ] Shared vehicle badge still visible
- [ ] Image loads on slow connections
- [ ] Image caching works properly

## Test Results

### Test Execution Date: 2025-09-30

#### Web Tests

| Test Case          | Status     | Notes             |
| ------------------ | ---------- | ----------------- |
| Upload new image   | ⏳ Pending | Ready for testing |
| Crop functionality | ⏳ Pending | Ready for testing |
| Image display      | ⏳ Pending | Ready for testing |
| Remove image       | ⏳ Pending | Ready for testing |
| Replace image      | ⏳ Pending | Ready for testing |
| Error handling     | ⏳ Pending | Ready for testing |

#### Mobile Tests (iOS)

| Test Case         | Status     | Notes                   |
| ----------------- | ---------- | ----------------------- |
| Take photo        | ⏳ Pending | Requires device testing |
| Gallery selection | ⏳ Pending | Requires device testing |
| Built-in editing  | ⏳ Pending | Requires device testing |
| Image display     | ⏳ Pending | Requires device testing |
| Permissions       | ⏳ Pending | Requires device testing |

#### Mobile Tests (Android)

| Test Case         | Status     | Notes                   |
| ----------------- | ---------- | ----------------------- |
| Take photo        | ⏳ Pending | Requires device testing |
| Gallery selection | ⏳ Pending | Requires device testing |
| Built-in editing  | ⏳ Pending | Requires device testing |
| Image display     | ⏳ Pending | Requires device testing |
| Permissions       | ⏳ Pending | Requires device testing |

## Known Issues

None at this time.

## Future Enhancements

1. Multiple vehicle images (gallery)
2. Image optimization before upload
3. Different aspect ratios for different vehicle types
4. Image filters and adjustments
5. Bulk image upload
6. AI-powered image tagging

## Dependencies

- `expo-image-picker`: ^17.0.8 - Mobile image selection and camera
- `react-image-crop`: ^11.0.10 - Web image cropping
- `@supabase/supabase-js`: ^2.57.4 - Storage and database
- `base64-arraybuffer`: ^1.0.2 - Image encoding

## API Reference

### VehicleService.updateVehicle()

```typescript
static async updateVehicle(
  id: string,
  updates: VehicleUpdate
): Promise<ApiResponse<Vehicle>>
```

- Accepts `main_image_url` in updates object
- Uploads image if changed
- Deletes old image automatically

### uploadImage()

```typescript
export async function uploadImage(
  uri: string,
  bucket: string = "vehicles",
  folder?: string,
): Promise<ImageUploadResult>;
```

- Uploads image to Supabase storage
- Returns public URL
- Handles both web and mobile URIs

### updateVehicleImage()

```typescript
export async function updateVehicleImage(
  newImageUri: string,
  oldImageUrl?: string | null,
  vehicleId?: string,
): Promise<ImageUploadResult>;
```

- Uploads new image
- Deletes old image if exists
- Returns upload result

## Support

For issues or questions, please create an issue in the project repository.

---

**Last Updated**: 2025-09-30
**Version**: 1.0.0
**Status**: Ready for Testing
