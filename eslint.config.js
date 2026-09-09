// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require("eslint/config");
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ["dist/*", ".expo/*"],
  },
  {
    files: [
      "app/**/*.{ts,tsx}",
      "components/**/*.{ts,tsx}",
      "hooks/**/*.{ts,tsx}",
    ],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "@/constants/theme",
                "@/lib/design-system",
                "@/lib/design-system/*",
              ],
              message: "Use @/src/design-system as the single source of truth.",
            },
          ],
        },
      ],
    },
  },
  {
    // Disable import plugin rules that require native bindings incompatible with Node 18
    rules: {
      "import/namespace": "off",
      "import/no-unresolved": "off",
    },
  },
  {
    files: [
      "jest.setup.js",
      "jest.config.js",
      "**/*.test.{js,jsx,ts,tsx}",
      "**/__tests__/**",
    ],
    languageOptions: {
      globals: {
        jest: "readonly",
        describe: "readonly",
        it: "readonly",
        expect: "readonly",
        beforeEach: "readonly",
        afterEach: "readonly",
        beforeAll: "readonly",
        afterAll: "readonly",
        test: "readonly",
      },
    },
    rules: {
      "@typescript-eslint/no-require-imports": "off",
    },
  },
]);
