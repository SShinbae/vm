const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

config.transformer = {
  ...config.transformer,
  babelTransformerPath: require.resolve("react-native-svg-transformer"),
  getTransformOptions: async () => ({
    transform: {
      experimentalImportSupport: false,
      inlineRequires: true,
    },
  }),
};

config.resolver = {
  ...config.resolver,
  assetExts: [
    ...config.resolver.assetExts.filter((ext) => ext !== "svg"),
    "webp",
  ],
  sourceExts: [...config.resolver.sourceExts, "svg", "mjs", "cjs"],
  unstable_enablePackageExports: true,
};

module.exports = config;
