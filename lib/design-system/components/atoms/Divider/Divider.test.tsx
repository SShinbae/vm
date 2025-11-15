import { render } from "@testing-library/react-native";
import React from "react";
import { Divider } from "../Divider";

describe("Divider Component", () => {
  it("renders horizontal divider", () => {
    const { toJSON } = render(<Divider />);
    expect(toJSON()).toBeTruthy();
  });

  it("renders vertical divider", () => {
    const { toJSON } = render(<Divider orientation="vertical" />);
    expect(toJSON()).toBeTruthy();
  });

  it("renders with label", () => {
    const { getByText } = render(<Divider label="OR" />);
    expect(getByText("OR")).toBeTruthy();
  });

  it("renders label in center position by default", () => {
    const { getByText } = render(<Divider label="Center" />);
    expect(getByText("Center")).toBeTruthy();
  });

  it("renders label in left position", () => {
    const { getByText } = render(<Divider label="Left" labelPosition="left" />);
    expect(getByText("Left")).toBeTruthy();
  });

  it("renders label in right position", () => {
    const { getByText } = render(
      <Divider label="Right" labelPosition="right" />,
    );
    expect(getByText("Right")).toBeTruthy();
  });

  it("renders with different thickness", () => {
    const { toJSON } = render(<Divider thickness="thick" />);
    expect(toJSON()).toBeTruthy();
  });

  it("renders with different colors", () => {
    const { toJSON } = render(<Divider color="dark" />);
    expect(toJSON()).toBeTruthy();
  });

  it("has correct accessibility label when label is provided", () => {
    const { getByLabelText } = render(<Divider label="Section divider" />);
    expect(getByLabelText("Section divider")).toBeTruthy();
  });
});
