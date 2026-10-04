/* global __dirname */
const path = require("path");
const fs = require("fs");

// Determine which .env file to load
let envFile = ".env.local"; // Default for local dev

if (
  process.env.EAS_BUILD_PROFILE === "production" ||
  process.env.EAS_BUILD_PROFILE === "production-apk"
) {
  if (fs.existsSync(path.resolve(__dirname, ".env.production.build"))) {
    envFile = ".env.production.build";
  } else if (fs.existsSync(path.resolve(__dirname, ".env.production"))) {
    envFile = ".env.production";
  }
} else if (process.env.EAS_BUILD_PROFILE === "preview") {
  if (fs.existsSync(path.resolve(__dirname, ".env.staging.build"))) {
    envFile = ".env.staging.build";
  }
}

require("dotenv").config({ path: path.resolve(__dirname, envFile) });

if (process.env.NODE_ENV !== "production" || process.env.DEBUG) {
  console.log(`[app.config.js] Loaded: ${envFile}`);
  console.log(`[app.config.js] SITE_URL: ${process.env.SITE_URL}`);
}

module.exports = {
  expo: {
    name: "VM",
    slug: "vehicles-management",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "vehiclesmanagement",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.vehiclesmanagement.app",
      infoPlist: {
        CFBundleDisplayName: "VM",
        CFBundleName: "VM",
        NSPhotoLibraryUsageDescription:
          "This app needs access to your photo library to let you select and crop images for your profile and vehicles.",
        NSCameraUsageDescription:
          "This app needs access to your camera to let you take and crop photos for your profile and vehicles.",
      },
    },
    android: {
      package: "com.vehiclesmanagement.app",
      adaptiveIcon: {
        backgroundColor: "#FFFFFF",
        foregroundImage: "./assets/images/android-icon-foreground.png",
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      permissions: [
        "CAMERA",
        "READ_EXTERNAL_STORAGE",
        "WRITE_EXTERNAL_STORAGE",
        "READ_MEDIA_IMAGES",
      ],
    },
    web: {
      output: "static",
      favicon: "./assets/images/favicon.png",
      bundler: "metro",
      name: "Vehicle Management System",
      shortName: "VM",
      description:
        "Comprehensive vehicle management and maintenance tracking system",
      lang: "en",
      themeColor: "#517c89", // blueBayoux[500]
      backgroundColor: "#ffffff",
    },
    plugins: [
      [
        "expo-router",
        {
          asyncRoutes: {
            web: true,
            default: false,
          },
        },
      ],
      "expo-web-browser",
      [
        "expo-splash-screen",
        {
          image: "./assets/images/splash-icon-light.png",
          imageWidth: 200,
          resizeMode: "contain",
          backgroundColor: "#FFFFFF",
          dark: {
            image: "./assets/images/splash-icon-dark.png",
            backgroundColor: "#121212",
          },
        },
      ],
      [
        "expo-notifications",
        {
          icon: "./assets/images/android-icon-foreground.png",
          color: "#517c89",
        },
      ],
      [
        "@sentry/react-native/expo",
        {
          organization: process.env.SENTRY_ORG,
          project: process.env.SENTRY_PROJECT,
        },
      ],
      ["expo-build-properties"],
      "./plugins/withXcode27Compat",
    ],
    experiments: {
      typedRoutes: true,
      // reactCompiler: true, // Disabled for React 18 compatibility
    },
    extra: {
      eas: {
        projectId: "13f81b43-039c-43b1-b916-641fbf8161a5",
      },
      supabaseUrl: process.env.SUPABASE_URL,
      supabaseKey: process.env.SUPABASE_KEY,
      siteUrl: process.env.SITE_URL,
      sentryDsn: process.env.SENTRY_DSN,
      posthogApiKey: process.env.POSTHOG_API_KEY,
      posthogHost: process.env.POSTHOG_HOST,
    },
  },
};
