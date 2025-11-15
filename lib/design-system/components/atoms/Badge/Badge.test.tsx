import { render } from "@testing-library/react-native";
import React from "react";
import { Badge } from "../Badge";

describe("Badge Component", () => {
  it("renders correctly with text content", () => {
    const { getByText } = render(<Badge>New</Badge>);
    expect(getByText("New")).toBeTruthy();
  });

  it("renders with success variant", () => {
    const { getByText } = render(<Badge variant="success">Success</Badge>);
    expect(getByText("Success")).toBeTruthy();
  });

  it("renders with error variant", () => {
    const { getByText } = render(<Badge variant="error">Error</Badge>);
    expect(getByText("Error")).toBeTruthy();
  });

  it("renders with warning variant", () => {
    const { getByText } = render(<Badge variant="warning">Warning</Badge>);
    expect(getByText("Warning")).toBeTruthy();
  });

  it("renders with count", () => {
    const { getByText } = render(<Badge count={5} />);
    expect(getByText("5")).toBeTruthy();
  });

  it("shows maxCount+ when count exceeds maxCount", () => {
    const { getByText } = render(<Badge count={150} maxCount={99} />);
    expect(getByText("99+")).toBeTruthy();
  });

  it("renders dot variant", () => {
    const { toJSON } = render(<Badge type="dot" variant="success" />);
    expect(toJSON()).toBeTruthy();
  });

  it("renders outlined variant", () => {
    const { getByText } = render(<Badge type="outlined">Outlined</Badge>);
    expect(getByText("Outlined")).toBeTruthy();
  });

  it("renders with different sizes", () => {
    const { getByText } = render(<Badge size="lg">Large</Badge>);
    expect(getByText("Large")).toBeTruthy();
  });

  it("has correct accessibility label for count", () => {
    const { getByLabelText } = render(<Badge count={3} />);
    expect(getByLabelText("3 notifications")).toBeTruthy();
  });
});
