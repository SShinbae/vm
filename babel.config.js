module.exports = function (api) {
  api.cache(true);

  const isProduction = process.env.NODE_ENV === "production";

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
        alias: {
          "@": "./",
          "@components": "./src/components",
          "@screens": "./src/screens",
          "@utils": "./src/utils",
          "@hooks": "./src/hooks",
          "@assets": "./assets",
          // Web polyfills for native animation libraries
          "react-native-worklets": "./polyfills/react-native-worklets.web",
          "react-native-reanimated": "./polyfills/react-native-reanimated.web",
        },
      },
    ],

    // Optional - For using decorators
    ["@babel/plugin-proposal-decorators", { legacy: true }],

    // React Native reanimated plugin (must be last)
    "react-native-reanimated/plugin",
  ];

  // Remove console.* statements in production builds
  if (isProduction) {
    // Only add if the package is installed
    try {
      require.resolve("babel-plugin-transform-remove-console");
      plugins.unshift("babel-plugin-transform-remove-console");
      // eslint-disable-next-line no-unused-vars
    } catch (e) {
      console.warn("babel-plugin-transform-remove-console not found, skipping");
    }
  }

  return {
    presets: ["babel-preset-expo"],
    plugins,
  };
};
