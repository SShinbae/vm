const path = require("path");
const { getSentryExpoConfig } = require("@sentry/react-native/metro");

const config = getSentryExpoConfig(__dirname);

// Enhanced resolver configuration for better module resolution
config.resolver = {
  ...config.resolver,
  // Exclude server-only directories from client bundling
  blockList: [/netlify\/functions\/.*/],
  assetExts: [...config.resolver.assetExts, "webp"],
  // Enable case-sensitive file resolution
  platforms: ["ios", "android", "web"],
  // Ensure node modules are resolved correctly
  nodeModulesPaths: [path.resolve(__dirname, "node_modules")],
  // Keep default sourceExts order - Metro automatically handles platform-specific extensions
  // (.android.ts, .ios.ts, .native.ts, .web.ts based on target platform)
  sourceExts: config.resolver.sourceExts,
  // Add resolver alias for web-specific polyfills and exclude native-only modules
  resolveRequest: (context, moduleName, platform) => {
    if (platform === "web") {
      // Redirect native animation libraries to lightweight polyfills
      if (moduleName === "react-native-worklets") {
        return {
          filePath: path.resolve(
            __dirname,
            "polyfills/react-native-worklets.web.ts",
          ),
          type: "sourceFile",
        };
      }
      if (moduleName === "react-native-reanimated") {
        return {
          filePath: path.resolve(
            __dirname,
            "polyfills/react-native-reanimated.web.js",
          ),
          type: "sourceFile",
        };
      }
      // Stub out native-only packages that have .web.tsx alternatives or aren't needed on web
      const nativeOnlyPackages = [
        "react-native-chart-kit",
        "react-image-crop",
        "sharp",
      ];
      if (
        nativeOnlyPackages.some(
          (pkg) => moduleName === pkg || moduleName.startsWith(pkg + "/"),
        )
      ) {
        return {
          filePath: path.resolve(__dirname, "polyfills/empty-module.web.js"),
          type: "sourceFile",
        };
      }
    }
    // Fall back to default resolution
    return context.resolveRequest(context, moduleName, platform);
  },
};

// Optimize transformer for better performance
config.transformer = {
  ...config.transformer,
  minifierConfig: {
    mangle: {
      keep_classnames: false,
      keep_fnames: false,
    },
    compress: {
      drop_console: true,
      dead_code: true,
      unused: true,
    },
  },
  getTransformOptions: async () => ({
    transform: {
      experimentalImportSupport: false,
      inlineRequires: true,
    },
  }),
};

// Increase max workers for better build performance
config.maxWorkers = 2;

module.exports = config;
