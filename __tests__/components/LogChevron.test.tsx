import React from "react";
import { render, screen } from "@testing-library/react-native";
const { IconSymbol } = require("@/components/ui/icon-symbol.tsx");
jest.mock("@expo/vector-icons/MaterialIcons", () => ({
  __esModule: true,
  default: ({ name }: any) => {
    const { Text } = require("react-native");
    return <Text>{name || "missing"}</Text>;
  },
}));
it.each([
  ["chevron.down", "expand-more"],
  ["chevron.up", "expand-less"],
  ["car", "directions-car"],
])("renders %s on Android/web", (name, icon) => {
  render(<IconSymbol name={name as any} color="black" />);
  expect(screen.getByText(icon)).toBeTruthy();
});
