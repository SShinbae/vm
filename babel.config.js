module.exports = function (api) {
  api.cache(true);

  const plugins = [
    // React Native reanimated plugin (if you use reanimated)
    "react-native-reanimated/plugin",

    // Optional - Plugin transform for optimization
    [
      "module-resolver",
      {
        root: ["./"],
        extensions: [".ios.js", ".android.js", ".js", ".ts", ".tsx", ".json"],
        alias: {
          "@": "./",
          "@components": "./src/components",
          "@screens": "./src/screens",
          "@utils": "./src/utils",
          "@hooks": "./src/hooks",
          "@assets": "./assets",
        },
      },
    ],

    // Optional - For using decorators
    ["@babel/plugin-proposal-decorators", { legacy: true }],
  ];

  // Remove console.* statements in production builds
  if (process.env.NODE_ENV === "production") {
    plugins.push("babel-plugin-transform-remove-console");
  }

  return {
    presets: ["babel-preset-expo"],
    plugins,
  };
};
