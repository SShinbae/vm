## Key Issues Identified

Your current implementation has **coordinate calculation problems** on both web and mobile, particularly with how the crop area is translated from display coordinates to actual image coordinates.[^1][^2][^3]

### Problems in Your Code

1. **Web Cropping**: The `ImageCropModal` calculates crop coordinates based on a fixed 300x300 container, but doesn't properly account for the actual image dimensions[^1]
2. **Mobile Cropping**: Using `expo-crop-image` directly without proper file handling[^1]
3. **Profile.tsx Integration**: The `ImageUpload` component shows the crop modal but the coordinate system is inconsistent[^4][^5]

### Critical Fixes Needed

## 1. Fix ImageCropModal Coordinate Calculations

The main issue is in your `handleSave` function where you calculate crop coordinates. Here's the corrected version:[^2][^6][^1]

```typescript
// In ImageCropModal.tsx - Replace the handleSave function

const handleSave = async () => {
  if (processing) return;
  if (!cropArea.width || !cropArea.height) {
    onError("Invalid crop area. Please try again.");
    return;
  }

  setProcessing(true);
  try {
    console.log("Cropping image with displayed area:", cropArea);

    // CRITICAL FIX: Get the actual natural image dimensions
    let originalWidth, originalHeight;

    if (Platform.OS === "web") {
      // For web, we need to create a new Image object to get natural dimensions
      const img = new window.Image();
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = imageUri;
      });
      originalWidth = img.naturalWidth;
      originalHeight = img.naturalHeight;
    } else {
      // For mobile, use Image.getSize
      await new Promise((resolve, reject) => {
        Image.getSize(
          imageUri,
          (width, height) => {
            originalWidth = width;
            originalHeight = height;
            resolve(null);
          },
          reject,
        );
      });
    }

    console.log("✅ Original image dimensions:", {
      originalWidth,
      originalHeight,
    });

    // Get container bounds (300x300 from styles)
    const containerWidth = 300;
    const containerHeight = 300;

    // Calculate how the image is actually displayed (considering contain mode)
    const imageAspectRatio = originalWidth / originalHeight;
    const containerAspectRatio = containerWidth / containerHeight;

    let displayWidth, displayHeight, offsetX, offsetY;

    if (imageAspectRatio > containerAspectRatio) {
      // Image is wider - fits by width
      displayWidth = containerWidth;
      displayHeight = containerWidth / imageAspectRatio;
      offsetX = 0;
      offsetY = (containerHeight - displayHeight) / 2;
    } else {
      // Image is taller - fits by height
      displayHeight = containerHeight;
      displayWidth = containerHeight * imageAspectRatio;
      offsetX = (containerWidth - displayWidth) / 2;
      offsetY = 0;
    }

    console.log("Display dimensions:", {
      displayWidth,
      displayHeight,
      offsetX,
      offsetY,
    });

    // CRITICAL FIX: Calculate scale from DISPLAY to ORIGINAL
    const scaleX = originalWidth / displayWidth;
    const scaleY = originalHeight / displayHeight;

    console.log("Scale factors:", { scaleX, scaleY });

    // Convert crop area from display coordinates to original image coordinates
    const originalCropArea = {
      originX: Math.max(0, Math.round((cropArea.x - offsetX) * scaleX)),
      originY: Math.max(0, Math.round((cropArea.y - offsetY) * scaleY)),
      width: Math.min(Math.round(cropArea.width * scaleX), originalWidth),
      height: Math.min(Math.round(cropArea.height * scaleY), originalHeight),
    };

    // CRITICAL FIX: Ensure crop area is within bounds
    if (originalCropArea.originX + originalCropArea.width > originalWidth) {
      originalCropArea.width = originalWidth - originalCropArea.originX;
    }
    if (originalCropArea.originY + originalCropArea.height > originalHeight) {
      originalCropArea.height = originalHeight - originalCropArea.originY;
    }

    console.log("✅ Final crop area (original coordinates):", originalCropArea);

    // Validate crop area
    if (
      originalCropArea.width <= 0 ||
      originalCropArea.height <= 0 ||
      originalCropArea.originX < 0 ||
      originalCropArea.originY < 0
    ) {
      throw new Error("Invalid crop coordinates calculated");
    }

    // Use Expo ImageManipulator to crop
    const result = await ImageManipulator.manipulateAsync(
      imageUri,
      [{ crop: originalCropArea }],
      {
        compress: 0.9,
        format: ImageManipulator.SaveFormat.JPEG,
      },
    );

    console.log("✅ Image cropped successfully:", result.uri);

    // Convert to File object for upload
    if (Platform.OS === "web") {
      // For web, fetch the result and create a proper File
      const response = await fetch(result.uri);
      const blob = await response.blob();
      const fileName = `cropped_avatar_${Date.now()}.jpg`;
      const file = new File([blob], fileName, { type: "image/jpeg" });

      console.log("✅ Created File object for web:", file);
      onCropComplete(file);
    } else {
      // For mobile, convert URI to File
      const response = await fetch(result.uri);
      const blob = await response.blob();
      const fileName = `cropped_avatar_${Date.now()}.jpg`;
      const file = new File([blob], fileName, { type: "image/jpeg" });

      console.log("✅ Created File object for mobile:", file);
      onCropComplete(file);
    }

    onClose();
  } catch (error: any) {
    console.error("❌ Error cropping image:", error);
    onError(error.message || "Failed to crop image");
  } finally {
    setProcessing(false);
  }
};
```

## 2. Fix Image Loading in ImageCropModal

Replace the `onImageLoad` callback to properly handle image dimensions:[^3][^1]

```typescript
// In ImageCropModal.tsx - Replace onImageLoad function

const onImageLoad = useCallback(
  (event: any) => {
    let naturalWidth, naturalHeight;

    if (Platform.OS === "web") {
      // CRITICAL FIX: For web, use imageRef to get natural dimensions
      if (imageRef.current) {
        // Wait a bit for the image to fully load
        setTimeout(() => {
          if (imageRef.current) {
            naturalWidth = (imageRef.current as any).naturalWidth;
            naturalHeight = (imageRef.current as any).naturalHeight;

            console.log("✅ Web image loaded:", {
              naturalWidth,
              naturalHeight,
            });

            if (
              !naturalWidth ||
              !naturalHeight ||
              naturalWidth === 0 ||
              naturalHeight === 0
            ) {
              console.error("❌ Invalid image dimensions from ref");
              return;
            }

            initializeCropArea(naturalWidth, naturalHeight);
          }
        }, 100);
      }
    } else {
      // For mobile
      if (event.nativeEvent?.source) {
        const source = event.nativeEvent.source;
        naturalWidth = source.width;
        naturalHeight = source.height;

        console.log("✅ Mobile image loaded:", {
          naturalWidth,
          naturalHeight,
        });

        if (!naturalWidth || !naturalHeight) {
          console.error("❌ Invalid mobile image dimensions");
          return;
        }

        initializeCropArea(naturalWidth, naturalHeight);
      }
    }
  },
  [aspectRatio],
);

// NEW HELPER FUNCTION: Extract crop area initialization
const initializeCropArea = (naturalWidth: number, naturalHeight: number) => {
  // Calculate displayed image dimensions considering resizeMode="contain"
  const containerWidth = 300;
  const containerHeight = 300;
  const imageAspectRatio = naturalWidth / naturalHeight;
  const containerAspectRatio = containerWidth / containerHeight;

  let displayWidth, displayHeight, offsetX, offsetY;

  if (imageAspectRatio > containerAspectRatio) {
    // Image is wider - fit by width
    displayWidth = containerWidth;
    displayHeight = containerWidth / imageAspectRatio;
    offsetX = 0;
    offsetY = (containerHeight - displayHeight) / 2;
  } else {
    // Image is taller - fit by height
    displayHeight = containerHeight;
    displayWidth = containerHeight * imageAspectRatio;
    offsetX = (containerWidth - displayWidth) / 2;
    offsetY = 0;
  }

  console.log("✅ Display dimensions calculated:", {
    displayWidth,
    displayHeight,
    offsetX,
    offsetY,
  });

  setImageSize({ width: displayWidth, height: displayHeight });

  // Calculate initial crop area (70% of displayed image, centered)
  const cropSize = Math.min(displayWidth, displayHeight) * 0.7;
  const cropWidth = aspectRatio >= 1 ? cropSize : cropSize * aspectRatio;
  const cropHeight = aspectRatio >= 1 ? cropSize / aspectRatio : cropSize;

  const initialCropArea = {
    x: offsetX + (displayWidth - cropWidth) / 2,
    y: offsetY + (displayHeight - cropHeight) / 2,
    width: cropWidth,
    height: cropHeight,
  };

  console.log("✅ Initial crop area set:", initialCropArea);
  setCropArea(initialCropArea);
};
```

## 3. Fix Profile.tsx ImageUpload Usage

Update how you use the ImageUpload component in profile.tsx:[^5][^4]

```typescript
// In profile.tsx - Update the ImageUpload component usage

<ImageUpload
  type="avatar"
  currentImageUrl={avatarUrl}
  onUploadComplete={(imageUrl) => {
    console.log("🎉 Avatar upload complete:", imageUrl);
    handleAvatarUpload(imageUrl);
  }}
  onUploadError={(error) => {
    console.error("❌ Avatar upload error:", error);
    handleAvatarError(error);
  }}
  style={styles.profileAvatarUpload}
  placeholder="Tap to change profile picture"
  maxSize={5}
  disabled={loading}
/>
```

## 4. Fix Mobile Native Cropping

For mobile devices using `expo-crop-image`, ensure proper aspect ratio:[^1]

```typescript
// In ImageCropModal.tsx - Update the mobile ImageEditor section

if (Platform.OS !== "web" && ImageEditor) {
  return (
    <ImageEditor
      imageUri={imageUri}
      fixedAspectRatio={aspectRatio} // CRITICAL FIX: Use fixedAspectRatio prop
      minimumCropDimensions={{
        width: 100,
        height: 100,
      }}
      onEditingComplete={async (result) => {
        try {
          console.log("📱 Mobile crop result:", result);

          // Convert URI to File object
          const response = await fetch(result.uri);
          const blob = await response.blob();
          const fileName = `cropped_avatar_${Date.now()}.jpg`;
          const file = new File([blob], fileName, { type: "image/jpeg" });

          console.log("✅ Mobile crop - Created File object:", {
            name: file.name,
            size: file.size,
            type: file.type,
          });

          onCropComplete(file);
          onClose();
        } catch (error: any) {
          console.error("❌ Error completing mobile crop:", error);
          onError(error.message || "Failed to crop image");
        }
      }}
      onCloseEditor={onClose}
      mode="crop-only"
      throttleBlur={false}
      allowedTransformOperations={["crop"]}
    />
  );
}
```

## 5. Additional Improvements

### A. Add Proper Error Boundaries

```typescript
// Wrap your crop modal usage with error handling
try {
  // Your crop logic
} catch (error) {
  if (error instanceof Error) {
    console.error("Crop error:", error.message);
    Alert.alert("Crop Error", "Failed to crop image. Please try again.");
  }
}
```

### B. Add Image Size Validation

```typescript
// Before cropping, validate image size
const validateImageSize = (width: number, height: number) => {
  const maxDimension = 4096; // Typical max for mobile devices

  if (width > maxDimension || height > maxDimension) {
    Alert.alert(
      "Image Too Large",
      "Please select a smaller image (max 4096px)",
    );
    return false;
  }

  return true;
};
```

## Summary

The main issues were:

1. **Coordinate system mismatch** between display and original image coordinates[^6][^2][^3]
2. **Improper image dimension detection** on web platform[^1]
3. **Missing aspect ratio enforcement** for mobile cropping[^1]
4. **Incomplete File object creation** after cropping[^5]

These fixes ensure that:

- Crop coordinates are accurately calculated for both web and mobile[^6]
- The cropped area matches what users see in the preview[^1]
- Files are properly formatted for upload to Supabase[^5]
- Aspect ratios are maintained across platforms[^7]
  <span style="display:none">[^10][^11][^12][^13][^14][^15][^16][^17][^18][^19][^20][^21][^22][^23][^24][^25][^8][^9]</span>

<div align="center">⁂</div>

[^1]: ImageCropModal.tsx

[^2]: https://github.com/expo/expo/issues/3862

[^3]: https://stackoverflow.com/questions/65298092/expo-image-manipulator-crop-according-to-facedetector-values

[^4]: profile.tsx

[^5]: ImageUpload.tsx

[^6]: https://docs.expo.dev/versions/latest/sdk/imagemanipulator/

[^7]: https://docs.expo.dev/versions/latest/sdk/imagepicker/

[^8]: ImagePicker.tsx

[^9]: https://github.com/expo/expo/issues/6415

[^10]: https://www.reddit.com/r/expo/comments/1l5n4p4/introducing_expodynamicimagecrop_a_flexible_image/

[^11]: https://stackoverflow.com/questions/70944884/react-native-image-crop-picker-not-displaying-image

[^12]: https://stackoverflow.com/questions/51897620/react-native-image-cropping-tool-that-works-with-expo

[^13]: https://docs.expo.dev/versions/latest/sdk/image/

[^14]: https://devforum.zoom.us/t/video-crop-issue-on-landscape-view-on-web/103619

[^15]: https://www.renpy.org/doc/html/im.html

[^16]: https://www.npmjs.com/package/expo-image-manipulator

[^17]: https://github.com/ivpusic/react-native-image-crop-picker/issues

[^18]: https://github.com/pontusab/react-native-image-manipulator

[^19]: https://www.clouddefense.ai/code/javascript/example/expo-image-manipulator

[^20]: https://github.com/ivpusic/react-native-image-crop-picker/issues/920

[^21]: https://www.reddit.com/r/FlutterDev/comments/1hkno1h/crop_images_from_image_picker/

[^22]: https://www.npmjs.com/package/@neilromblon%2Fexpo-image-manipulator-view

[^23]: https://www.reddit.com/r/reactnative/comments/p132ja/react_native_image_crop_picker_is_not_working/

[^24]: https://classic.yarnpkg.com/en/package/@expo/image-utils

[^25]: https://stackoverflow.com/questions/tagged/expo-camera?tab=newest\&page=3
