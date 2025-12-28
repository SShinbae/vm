const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const config = getDefaultConfig(__dirname);

// Enhanced resolver configuration for better module resolution
config.resolver = {
  ...config.resolver,
  assetExts: [...config.resolver.assetExts, "webp"],
  // Enable case-sensitive file resolution
  platforms: ["ios", "android", "web"],
  // Ensure node modules are resolved correctly
  nodeModulesPaths: [path.resolve(__dirname, "node_modules")],
  // Add extensions for better resolution (web extensions take priority)
  sourceExts: [
    "web.ts",
    "web.tsx",
    "web.js",
    "web.jsx",
    ...config.resolver.sourceExts,
  ],
  // Add resolver alias for web-specific polyfills
  resolveRequest: (context, moduleName, platform) => {
    // For web platform, redirect native animation libraries to polyfills
    if (platform === "web") {
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
    }
    // Fall back to default resolution
    return context.resolveRequest(context, moduleName, platform);
  },
};

// Optimize transformer for better performance
config.transformer = {
  ...config.transformer,
  minifierConfig: {
    keep_classnames: true,
    keep_fnames: true,
    mangle: {
      keep_classnames: true,
      keep_fnames: true,
    },
  },
  // Disable eager bundling for production builds
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
