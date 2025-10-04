const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Check if we're building for web platform
const isWebBuild = process.env.EXPO_PLATFORM === 'web' || 
                   process.argv.includes('--platform') && process.argv.includes('web') ||
                   process.argv.includes('--platform=web');

if (isWebBuild) {
  // For web builds, skip NativeWind to avoid lightningcss binary issues
  console.log('Building for web - skipping NativeWind metro plugin');
  
  // Configure resolver to alias global.css to a safe CSS file for web builds
  config.resolver = {
    ...config.resolver,
    alias: {
      ...config.resolver.alias,
      '../global.css': './global.empty.css',
      './global.css': './global.empty.css'
    }
  };
  
  module.exports = config;
} else {
  // For native builds, use NativeWind
  try {
    const { withNativeWind } = require('nativewind/metro');
    module.exports = withNativeWind(config, {
      input: './global.css',
      inlineRem: false,
      browserslist: {
        production: ['chrome 109'],
      },
      transformCssOptions: {
        exclude: [
          /aspect-ratio/,
        ],
      },
    });
  } catch (error) {
    console.warn('NativeWind not available, using default config:', error.message);
    module.exports = config;
  }
}