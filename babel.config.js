module.exports = function (api) {
  api.cache(true);

  const isProduction =
    process.env.EAS_BUILD_PROFILE === "production" ||
    process.env.EAS_BUILD_PROFILE === "production-apk" ||
    process.env.NODE_ENV === "production";

  // Base alias configuration (no web polyfills - those are handled by metro.config.js)
  const alias = {
    "@": "./",
    "@components": "./src/components",
    "@screens": "./src/screens",
    "@utils": "./src/utils",
    "@hooks": "./src/hooks",
    "@assets": "./assets",
  };

  const plugins = [
    // Optional - Plugin transform for optimization
    [
      "module-resolver",
      {
        root: ["./"],
        extensions: [
          ".web.ts",
          ".web.tsx",
          ".web.js",
          ".web.jsx",
          ".ios.js",
          ".android.js",
          ".js",
          ".ts",
          ".tsx",
          ".json",
        ],
        alias,
      },
    ],

    // Optional - For using decorators
    ["@babel/plugin-proposal-decorators", { legacy: true }],

    // React Native reanimated plugin (must be last)
    "react-native-reanimated/plugin",
  ];

  // Remove console.log and console.debug in production builds
  // Keep console.error and console.warn for production debugging
  if (isProduction) {
    plugins.unshift([
      "transform-remove-console",
      {
        exclude: ["error", "warn"],
      },
    ]);
  }

  return {
    presets: ["babel-preset-expo"],
    plugins,
  };
};
