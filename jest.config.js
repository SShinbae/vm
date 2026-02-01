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

  // Coverage thresholds - Set for unit-tested files
  // Global threshold is low since most components are React Native and not easily unit-testable
  coverageThreshold: {
    global: {
      branches: 5,
      functions: 5,
      lines: 5,
      statements: 5,
    },
    // Tested utility functions - these have comprehensive unit tests
    "lib/utils/dateUtils.ts": {
      branches: 70,
      functions: 75,
      lines: 80,
      statements: 80,
    },
    "lib/utils/formatUtils.ts": {
      branches: 70,
      functions: 75,
      lines: 80,
      statements: 80,
    },
    "lib/utils/serviceUtils.ts": {
      branches: 60,
      functions: 65,
      lines: 65,
      statements: 65,
    },
    // Analytics calculations - has comprehensive tests
    "lib/analytics/calculations.ts": {
      branches: 70,
      functions: 75,
      lines: 75,
      statements: 75,
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
