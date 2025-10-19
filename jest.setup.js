// Setup file for Jest
// Mock global objects that Expo winter runtime needs
global.__ExpoImportMetaRegistry = new Map();

// Mock structuredClone if not available (Node.js < 17)
if (typeof global.structuredClone === "undefined") {
  global.structuredClone = (obj) => JSON.parse(JSON.stringify(obj));
}

// Suppress console warnings in tests
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn(),
};
