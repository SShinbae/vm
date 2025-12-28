# Build Fixes Documentation

This document outlines the fixes applied to resolve build issues in both GitHub Actions (Android APK) and Netlify (Web) deployments.

## Issues Fixed

### 1. Module Resolution Issues (Android/GitHub Actions)

**Problem**: EAS build couldn't resolve `LogDetailsBottomSheet` component

```
Error: Unable to resolve module ../../components/logs/LogDetailsBottomSheet from app/(tabs)/logs.tsx
```

**Root Cause**: Path alias resolution issues in production builds where the `@/` alias wasn't properly resolved in the EAS build environment.

**Solution**:

- Created an index file at `components/logs/index.ts` to export the component
- Updated the import to use `@/components/logs` instead of the full file path
- Enhanced metro.config.js with better module resolution settings

### 2. React Native Animation Libraries Web Compatibility (Netlify/Web)

**Problem**: Web builds failed due to native animation libraries trying to execute runtime-specific code

```
WorkletsError: [Worklets] createSerializableObject should never be called in JSWorklets.
TypeError: (0, require(...).createSerializable) is not a function
```

**Root Cause**: `react-native-worklets` and `react-native-reanimated` are native modules that don't have web support and try to execute native-specific code during web bundling.

**Solution**:

- Created web polyfills:
  - `polyfills/react-native-worklets.web.ts` - Worklets stubs
  - `polyfills/react-native-reanimated.web.js` - Reanimated stubs with createSerializable
- Configured babel to alias both libraries to polyfills for web builds
- Added custom resolver in metro.config.js to redirect both libraries on web platform

## Files Modified

### 1. metro.config.js

Enhanced Metro bundler configuration:

- Added web platform support
- Configured source extension priority (web extensions first)
- Added custom resolver to redirect worklets to polyfill on web
- Improved module resolution paths

### 2. babel.config.js

Updated Babel configuration:

- Added web-specific extensions (`.web.ts`, `.web.tsx`, etc.)
- Added aliases for react-native-worklets and react-native-reanimated to web polyfills
- Extension priority ensures web-specific files load first

### 3. polyfills/react-native-worklets.web.ts (New File)

Created web-compatible stubs for worklets:

- Provides no-op implementations of worklet functions
- Includes createSerializable and makeShareable functions

### 4. polyfills/react-native-reanimated.web.js (New File)

Created web-compatible stubs for Reanimated:

- Provides no-op implementations of animation functions (withSpring, withTiming, etc.)
- Includes createSerializable function that was causing the error
- Provides mock Animated components that use regular React Native components
- Prevents runtime errors during web builds
- Maintains type compatibility with native reanimated API

### 5. components/logs/index.ts (New File)

Created barrel export file:

- Centralizes component exports
- Improves import path resolution
- Better tree-shaking support

### 5. app/(tabs)/logs.tsx

Updated import statement:

- Changed from direct file import to index import
- More reliable path resolution in production builds

## How It Works

### Module Resolution Flow

#### Android/iOS Builds:

1. Import: `@/components/logs` → `components/logs/index.ts`
2. Index exports: `LogDetailsBottomSheet` from `./LogDetailsBottomSheet`
3. Metro resolves: `components/logs/LogDetailsBottomSheet.tsx`

#### Web Builds:

1. Import: `react-native-worklets`
2. Metro resolveRequest intercepts (web platform)
3. Returns: `polyfills/react-native-worklets.web.ts`
4. Babel also has alias fallback for additional safety

### Extension Resolution Priority

```
.web.ts → .web.tsx → .web.js → .web.jsx → .ts → .tsx → .js → .jsx
```

This ensures platform-specific files are loaded first when available.

## Testing

### Local Testing

```bash
# Test Android build
npm run android

# Test iOS build
npm run ios

# Test Web build
npm run web

# Test production web export
npm run build
```

### CI/CD Testing

#### GitHub Actions (Android)

The workflow in `.github/workflows/build-production-apk.yml` will:

1. Install dependencies
2. Run EAS build for Android
3. Verify APK artifact is created

#### Netlify (Web)

The deployment will:

1. Install dependencies with `npm install --force lightningcss`
2. Run `npm run build` (expo export --platform web)
3. Deploy the `dist` directory

## Preventing Future Issues

### Best Practices

1. **Always use index files for component directories**

   ```typescript
   // components/mydir/index.ts
   export { MyComponent } from "./MyComponent";
   ```

2. **Prefer index imports over direct file imports**

   ```typescript
   // Good
   import { MyComponent } from "@/components/mydir";

   // Avoid (can cause resolution issues)
   import { MyComponent } from "@/components/mydir/MyComponent";
   ```

3. **Create web polyfills for native-only modules**

   ```typescript
   // polyfills/my-native-module.web.ts
   export const nativeFunction = () => {
     // Web-compatible implementation or no-op
   };
   ```

4. **Use platform-specific files when needed**

   ```
   MyComponent.tsx      // Shared
   MyComponent.web.tsx  // Web-specific
   MyComponent.ios.tsx  // iOS-specific
   ```

5. **Test builds on all platforms**
   - Always test production builds, not just dev mode
   - Use `expo export` to simulate production bundling
   - Test in CI/CD environment before deploying

## Troubleshooting

### Module Not Found Errors

1. Check if the file exists and has correct casing
2. Verify babel.config.js has the extension in the list
3. Ensure metro.config.js includes the correct sourceExts
4. Clear Metro cache: `npx expo start -c`

### Worklets Errors on Web

1. Verify polyfill exists at `polyfills/react-native-worklets.web.ts`
2. Check babel alias configuration
3. Confirm metro.config.js resolveRequest is working
4. Test with: `npm run build`

### Build Differences Local vs CI

1. Clear all caches: `rm -rf node_modules .expo dist && npm install`
2. Check environment variables match
3. Verify Node.js version matches CI (check `.nvmrc` or workflow file)
4. Test with production flags: `NODE_ENV=production npm run build`

## Additional Resources

- [Expo Metro Config](https://docs.expo.dev/guides/customizing-metro/)
- [Babel Module Resolver](https://github.com/tleunen/babel-plugin-module-resolver)
- [React Native Worklets](https://github.com/margelo/react-native-worklets-core)
- [Platform-specific code](https://reactnative.dev/docs/platform-specific-code)

## Changelog

### 2025-12-28

- Fixed LogDetailsBottomSheet import resolution
- Added react-native-worklets web polyfill
- Enhanced metro.config.js resolver
- Updated babel.config.js with web extensions
- Created component index files
- Documented all fixes and best practices
