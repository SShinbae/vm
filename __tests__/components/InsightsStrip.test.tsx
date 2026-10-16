import React from "react";
import { render, screen } from "@testing-library/react-native";
import { InsightsStrip } from "@/components/analytics";

jest.mock("react-native-unistyles", () => ({
  createStyleSheet: (factory: any) => factory,
  useStyles: (factory?: any) => {
    const { lightTheme } = require("@/src/design-system");
    return { theme: lightTheme, styles: factory ? factory(lightTheme) : {} };
  },
}));

it("renders nothing for an empty list", () => {
  const { toJSON } = render(<InsightsStrip insights={[]} />);
  expect(toJSON()).toBeNull();
});

it("renders each insight string", () => {
  render(
    <InsightsStrip
      insights={[
        "Next service: Myvi in 12 days",
        "Lowest-cost period: Feb (RM50.00)",
      ]}
    />,
  );
  expect(screen.getByText("Next service: Myvi in 12 days")).toBeTruthy();
  expect(screen.getByText("Lowest-cost period: Feb (RM50.00)")).toBeTruthy();
});
