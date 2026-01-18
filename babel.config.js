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

  // DISABLED: Console removal was causing production crashes
  // The babel-plugin-transform-remove-console can cause issues with some libraries
  // that expect console to be defined. Keep console statements for now to aid debugging.
  // if (isProduction) {
  //   try {
  //     require.resolve("babel-plugin-transform-remove-console");
  //     plugins.unshift("babel-plugin-transform-remove-console");
  //   } catch (e) {
  //     console.warn("babel-plugin-transform-remove-console not found, skipping");
  //   }
  // }

  return {
    presets: ["babel-preset-expo"],
    plugins,
  };
};
