/**
 * Jest Configuration
 *
 * Optimized for Expo + React Native + TypeScript testing
 */

module.exports = {
  preset: "jest-expo",
  testEnvironment: "node",

  // Transform patterns
  transformIgnorePatterns: [
    "node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|@tanstack/react-query)",
  ],

  // Setup files
  setupFiles: ["<rootDir>/jest.setup.js"],
  setupFilesAfterEnv: ["<rootDir>/__tests__/setup/jest.setup.ts"],

  // Test patterns
  testMatch: [
    "**/__tests__/**/*.test.{ts,tsx}",
    "**/*.spec.{ts,tsx}",
    "**/lib/**/__tests__/**/*.test.{ts,tsx}",
  ],
  testPathIgnorePatterns: [
    "/node_modules/",
    "/__tests__/setup/",
    "/\\.maestro/",
  ],

  // Module resolution - Updated with new path aliases
  moduleNameMapper: {
    // New /src aliases
    "^@/src/(.*)$": "<rootDir>/src/$1",
    "^@features/(.*)$": "<rootDir>/src/features/$1",
    "^@shared/(.*)$": "<rootDir>/src/shared/$1",
    "^@services/(.*)$": "<rootDir>/src/services/$1",
    "^@contexts/(.*)$": "<rootDir>/src/contexts/$1",
    "^@providers/(.*)$": "<rootDir>/src/providers/$1",
    "^@types/(.*)$": "<rootDir>/src/types/$1",
    "^@config/(.*)$": "<rootDir>/src/config/$1",
    "^@design-system/(.*)$": "<rootDir>/src/design-system/$1",

    // Root alias
    "^@/(.*)$": "<rootDir>/$1",

    // Legacy aliases (for backward compatibility)
    "^@components(.*)$": "<rootDir>/components$1",
    "^@screens(.*)$": "<rootDir>/app$1",
    "^@utils(.*)$": "<rootDir>/utils$1",
    "^@hooks(.*)$": "<rootDir>/hooks$1",
    "^@assets(.*)$": "<rootDir>/assets$1",

    // Mock files
    "\\.(jpg|jpeg|png|gif|webp|svg)$": "<rootDir>/__mocks__/fileMock.js",
    "react-native-unistyles": "<rootDir>/__mocks__/react-native-unistyles.ts",
  },

  // Coverage configuration
  collectCoverageFrom: [
    "src/**/*.{ts,tsx}",
    "components/**/*.{ts,tsx}",
    "hooks/**/*.{ts,tsx}",
    "lib/**/*.{ts,tsx}",
    "!**/*.d.ts",
    "!**/index.ts",
    "!**/node_modules/**",
    "!**/vendor/**",
    "!**/__tests__/**",
    "!**/*.test.{ts,tsx}",
    "!**/*.spec.{ts,tsx}",
  ],

  // Coverage thresholds (adjust as test coverage grows)
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 50,
      lines: 50,
      statements: 50,
    },
  },

  // Performance
  maxWorkers: "50%",
  cache: true,
  cacheDirectory: "<rootDir>/node_modules/.cache/jest",

  // Globals
  globals: {
    __DEV__: true,
  },

  // Timeouts
  testTimeout: 10000,

  // Verbose output
  verbose: true,
};
