module.exports = {
  extends: ["expo", "prettier"],
  plugins: ["prettier"],
  rules: {
    "prettier/prettier": "error",
    // Disable import resolver errors caused by unrs-resolver native binding issue
    "import/no-duplicates": "off",
  },
  settings: {
    // Use node resolver instead of TypeScript resolver to avoid native binding issues
    "import/resolver": {
      node: {
        extensions: [".js", ".jsx", ".ts", ".tsx"],
      },
    },
  },
};
