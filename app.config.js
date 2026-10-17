/* global __dirname */
const path = require("path");
const fs = require("fs");
const { isIP } = require("net");
const { Buffer } = require("buffer");

const isProduction = ["production", "production-apk"].includes(
  process.env.EAS_BUILD_PROFILE,
);
let envFile = isProduction ? ".env.production" : ".env.local";

if (isProduction) {
  if (fs.existsSync(path.resolve(__dirname, ".env.production.build"))) {
    envFile = ".env.production.build";
  }
} else if (process.env.EAS_BUILD_PROFILE === "preview") {
  if (fs.existsSync(path.resolve(__dirname, ".env.staging.build"))) {
    envFile = ".env.staging.build";
  }
}

require("dotenv").config({ path: path.resolve(__dirname, envFile) });

if (isProduction) {
  for (const name of ["SUPABASE_URL", "SUPABASE_KEY", "SITE_URL"]) {
    if (!process.env[name]?.trim()) {
      throw new Error(`[app.config.js] Production requires ${name}.`);
    }
  }

  for (const name of ["SUPABASE_URL", "SITE_URL", "FUNCTIONS_URL"]) {
    if (name === "FUNCTIONS_URL" && !process.env[name]) continue;
    let valid = false;
    try {
      const url = new URL(process.env[name]);
      const host = url.hostname.replace(/\.$/, "").replace(/^\[|\]$/g, "");
      // Production services use public DNS names, never emulator or LAN addresses.
      valid =
        url.protocol === "https:" &&
        !url.username &&
        !url.password &&
        host.includes(".") &&
        !isIP(host) &&
        !/(^|\.)(localhost|local|internal)$/.test(host);
    } catch {
      // Report the setting name without exposing a URL or embedded credentials.
    }
    if (!valid) {
      throw new Error(
        `[app.config.js] ${name} must use a public HTTPS hostname in production.`,
      );
    }
  }

  const key = process.env.SUPABASE_KEY;
  let isPublicKey = /^sb_publishable_[A-Za-z0-9_-]+$/.test(key);
  if (!isPublicKey) {
    try {
      const parts = key.split(".");
      isPublicKey =
        parts.length === 3 &&
        JSON.parse(Buffer.from(parts[1], "base64url").toString()).role ===
          "anon";
    } catch {
      // Invalid or private keys must never reach the client config.
    }
  }
  if (!isPublicKey) {
    throw new Error(
      "[app.config.js] SUPABASE_KEY must be a public anon or publishable key.",
    );
  }
}

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
      googleServicesFile: "./google-services.json",
      adaptiveIcon: {
        backgroundColor: "#FFFFFF",
        foregroundImage: "./assets/images/android-icon-foreground.png",
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      permissions: ["CAMERA"],
      // Play photo/video policy: the system photo picker needs no media
      // permission on Android 13+. expo-image-picker still adds
      // READ/WRITE_EXTERNAL_STORAGE itself for Android 12 and below.
      blockedPermissions: [
        "android.permission.READ_MEDIA_IMAGES",
        "android.permission.READ_MEDIA_VIDEO",
        "android.permission.READ_MEDIA_AUDIO",
        "android.permission.READ_MEDIA_VISUAL_USER_SELECTED",
        "android.permission.RECORD_AUDIO",
        "android.permission.SYSTEM_ALERT_WINDOW",
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
          // Required by <Head> on iOS (Handoff); without it screens using Head throw.
          origin: "https://vm.wanahnaf.dev",
          asyncRoutes: {
            web: true,
            default: false,
          },
        },
      ],
      "expo-web-browser",
      ["expo-image-picker", { microphonePermission: false }],
      [
        "expo-splash-screen",
        {
          image: "./assets/images/splash-icon-light.png",
          imageWidth: 200,
          resizeMode: "contain",
          backgroundColor: "#FFFFFF",
          dark: {
            image: "./assets/images/splash-icon-dark.png",
            backgroundColor: "#1e292e",
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
      functionsUrl: process.env.FUNCTIONS_URL,
      sentryDsn: process.env.SENTRY_DSN,
      posthogApiKey: process.env.POSTHOG_API_KEY,
      posthogHost: process.env.POSTHOG_HOST,
    },
  },
};
