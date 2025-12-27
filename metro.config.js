const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Keep only webp asset extension if needed
config.resolver = {
  ...config.resolver,
  assetExts: [...config.resolver.assetExts, "webp"],
};

module.exports = config;
