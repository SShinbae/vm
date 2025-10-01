# Vehicle Image Crop Feature Implementation

## Overview
Added comprehensive image cropping functionality for vehicle photos, especially optimized for web platforms. The feature includes resizable grid lines and aspect ratio controls.

## Features Implemented

### 1. Enhanced ImagePicker Component
- **File**: `components/ui/ImagePicker.tsx`
- **New Props**:
  - `enableWebCropping?: boolean` - Enable crop modal on web (default: true)
  - `cropAspectRatio?: number` - Aspect ratio for cropping (default: 1 for square)
  - `cropTitle?: string` - Title for crop modal
  - `cropDescription?: string` - Description for crop modal

### 2. Advanced Crop Modal with Grid Lines
- **File**: `components/ui/ImageCropModal.tsx` (existing, already feature-complete)
- **Features**:
  - ✅ Rule of thirds grid lines for better photo composition
  - ✅ Resizable crop area with corner and edge handles
  - ✅ Drag to move crop area
  - ✅ Maintain aspect ratio option
  - ✅ Web-optimized with pointer events
  - ✅ Mobile fallback with expo-crop-image
  - ✅ Portal rendering for better web UX

### 3. Platform-Specific Behavior

#### Web Platform
- Uses HTML file input for image selection
- Shows custom crop modal with grid lines after image selection
- Supports drag, resize, and aspect ratio locking
- Creates blob URLs for browser compatibility
- Uses `expo-image-manipulator` for final cropping

#### Mobile Platform
- Uses `expo-image-picker` for native image selection
- Leverages built-in editing capabilities when available
- Fallback to custom crop modal if needed

### 4. Updated Vehicle Screens

#### Add Vehicle Screen
- **File**: `app/vehicles/add.tsx`
- Now uses cropping functionality by default
- Square aspect ratio (1:1) for consistent vehicle photos

#### Edit Vehicle Screen  
- **File**: `app/vehicles/[id]/edit.tsx`
- Updated to use V2 database types with `main_image_url`
- Integrated crop functionality for photo updates
- Proper image replacement handling

## Technical Details

### Crop Modal Features
```typescript
// Example usage in vehicle screens
<ImagePicker
  onImageSelected={setImageUri}
  currentImage={imageUri}
  label="Vehicle Photo (Optional)"
  placeholder="Add a vehicle photo"
  enableWebCropping={true}
  cropAspectRatio={1}
  cropTitle="Crop Vehicle Photo"
  cropDescription="Drag to adjust the crop area. Use the corner handles to resize. The grid lines help you align your photo for best results."
/>
```

### Grid Lines Implementation
- Rule of thirds grid with 2 vertical and 2 horizontal lines
- Semi-transparent white lines (50% opacity)
- Automatically positioned at 1/3 and 2/3 of crop area
- Helps users compose better vehicle photos

### Resize Handles
- **Corner handles**: 4 corner resize points with appropriate cursors
- **Edge handles**: 4 edge resize points for fine-tuning
- **Aspect ratio preservation**: Maintains proportions when enabled
- **Boundary constraints**: Prevents cropping outside image bounds

### Image Processing Flow
1. User selects image (file input on web, expo-image-picker on mobile)
2. For web with cropping enabled:
   - Image displayed in crop modal
   - User adjusts crop area with grid guide
   - Corner/edge handles for resizing
   - Drag to reposition
3. On save: `expo-image-manipulator` processes the crop
4. Result converted to blob URL for web compatibility
5. Integrated with existing upload service

## Browser Compatibility
- Modern browsers with Pointer Events API
- Fallback to mouse events
- HTML5 File API support
- Canvas API for image processing

## Performance Considerations
- Lazy loading of crop modal components
- Efficient re-renders with React.useCallback
- Blob URL cleanup to prevent memory leaks
- Portal rendering to avoid z-index issues

## File Structure
```
components/ui/
├── ImagePicker.tsx        # Main picker with crop integration
├── ImageCropModal.tsx     # Advanced crop modal with grid
└── ImageUpload.tsx        # Existing upload component

app/vehicles/
├── add.tsx               # Updated with crop functionality
└── [id]/edit.tsx         # Updated with V2 types and crop

types/
├── database-v2.ts        # V2 types with main_image_url
└── index.ts              # Legacy types
```

## Usage Examples

### Basic Vehicle Photo with Cropping
```typescript
<ImagePicker
  onImageSelected={handleImageSelection}
  enableWebCropping={true}
  cropAspectRatio={1}
/>
```

### Custom Crop Modal Settings
```typescript
<ImagePicker
  onImageSelected={handleImageSelection}
  enableWebCropping={true}
  cropAspectRatio={16/9}
  cropTitle="Crop Vehicle Photo" 
  cropDescription="Use the grid lines to align your vehicle for the best photo composition."
/>
```

### Disable Cropping (Legacy Behavior)
```typescript
<ImagePicker
  onImageSelected={handleImageSelection}
  enableWebCropping={false}
/>
```

## Benefits
1. **Better Photo Composition**: Grid lines help users take better vehicle photos
2. **Consistent Aspect Ratios**: Ensures uniform photo display across the app
3. **Platform Optimized**: Native experience on mobile, advanced web functionality
4. **User Friendly**: Intuitive drag-and-resize interface
5. **Professional Results**: Higher quality vehicle photos in the database

## Testing Checklist
- [ ] Web image selection triggers file input
- [ ] Crop modal appears with grid lines visible
- [ ] Corner handles resize crop area correctly
- [ ] Edge handles provide fine-tuning capability
- [ ] Drag functionality moves crop area
- [ ] Aspect ratio is maintained when enabled
- [ ] Save produces correctly cropped image
- [ ] Mobile uses native image picker editing
- [ ] Vehicle add/edit screens work with new functionality
- [ ] Image upload and storage works properly