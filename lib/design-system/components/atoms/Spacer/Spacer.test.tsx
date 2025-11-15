import { render } from "@testing-library/react-native";
import React from "react";
import { View } from "react-native";
import { Spacer } from "../Spacer";

describe("Spacer Component", () => {
  it("renders with default props", () => {
    const { toJSON } = render(<Spacer />);
    expect(toJSON()).toBeTruthy();
  });

  it("renders with different sizes", () => {
    const { toJSON } = render(<Spacer size="lg" />);
    expect(toJSON()).toBeTruthy();
  });

  it("renders as horizontal spacer", () => {
    const { toJSON } = render(<Spacer horizontal />);
    expect(toJSON()).toBeTruthy();
  });

  it("renders as vertical spacer by default", () => {
    const { toJSON } = render(<Spacer />);
    expect(toJSON()).toBeTruthy();
  });

  it("is hidden from accessibility tree", () => {
    const { UNSAFE_getByType } = render(<Spacer />);
    const spacer = UNSAFE_getByType(View);
    expect(spacer.props.accessibilityElementsHidden).toBe(true);
    expect(spacer.props.importantForAccessibility).toBe("no");
  });
});
