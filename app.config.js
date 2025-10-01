import 'dotenv/config';

export default {
  expo: {
    name: 'vehicles-management',
    slug: 'vehicles-management',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/images/icon.png',
    scheme: 'vehiclesmanagement',
    userInterfaceStyle: 'automatic',
    newArchEnabled: true,
    ios: {
      supportsTablet: true,
    },
    android: {
      package: 'com.vehiclesmanagement.app',
      adaptiveIcon: {
        backgroundColor: '#E6F4FE',
        foregroundImage: './assets/images/android-icon-foreground.png',
        backgroundImage: './assets/images/android-icon-background.png',
        monochromeImage: './assets/images/android-icon-monochrome.png',
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
    },
    web: {
      output: 'static',
      favicon: './assets/images/favicon.png',
      bundler: 'metro',
      name: 'Vehicle Management System',
      shortName: 'Vehicle Manager',
      description: 'Comprehensive vehicle management and maintenance tracking system',
      lang: 'en',
      themeColor: '#E6F4FE',
      backgroundColor: '#ffffff',
    },
    plugins: [
      'expo-router',
      [
        'expo-splash-screen',
        {
          image: './assets/images/splash-icon.png',
          imageWidth: 200,
          resizeMode: 'contain',
          backgroundColor: '#E6F4FE',
          dark: {
            image: './assets/images/splash-icon.png',
            backgroundColor: '#1a1a1a',
          },
        },
      ],
    ],
    experiments: {
      typedRoutes: true,
      reactCompiler: true,
    },
    extra: {
      eas: {
        projectId: "13f81b43-039c-43b1-b916-641fbf8161a5"
      },
      supabaseUrl: process.env.SUPABASE_URL,
      supabaseKey: process.env.SUPABASE_KEY,
      googleVisionApiKey: process.env.GOOGLE_VISION_API_KEY,
      siteUrl: process.env.SITE_URL,
    },
  },
};