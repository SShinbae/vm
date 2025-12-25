/* eslint-disable no-undef */
const createExpoWebpackConfigAsync = require("@expo/webpack-config");
const path = require("path");

module.exports = async function (env, argv) {
  const config = await createExpoWebpackConfigAsync(
    {
      ...env,
      babel: {
        dangerouslyAddModulePathsToTranspile: [
          "@gorhom/bottom-sheet",
          "react-native-reanimated",
        ],
      },
    },
    argv,
  );

  // Add resolve configuration
  config.resolve = {
    ...config.resolve,
    alias: {
      ...config.resolve.alias,
      "react-native$": "react-native-web",
      "react-native-svg": "react-native-svg-web",
    },
    modules: [
      path.resolve(__dirname, "node_modules"),
      path.resolve(__dirname, "app"),
      "node_modules",
    ],
    extensions: [
      ".web.ts",
      ".web.tsx",
      ".web.js",
      ".web.jsx",
      ".ts",
      ".tsx",
      ".js",
      ".jsx",
      ".json",
    ],
  };

  return config;
};
