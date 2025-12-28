const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Keep only webp asset extension if needed
config.resolver = {
  ...config.resolver,
  assetExts: [...config.resolver.assetExts, "webp"],
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
};

// Increase max workers for better build performance
config.maxWorkers = 2;

module.exports = config;
