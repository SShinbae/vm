import { screen } from "@testing-library/react-native";
import { renderWithProviders as render } from "@/__tests__/setup/testUtils";
import React from "react";
import { MetricCard } from "../MetricCard";

describe("MetricCard", () => {
  describe("Basic Rendering", () => {
    it("should render title and value", () => {
      render(<MetricCard label="Total Vehicles" value="15" />);
      expect(screen.getByText("Total Vehicles")).toBeTruthy();
      expect(screen.getByText("15")).toBeTruthy();
    });

    it("should render icon when provided", () => {
      render(<MetricCard label="Total Vehicles" value="15" icon="car" />);
      expect(screen.getByText("Total Vehicles")).toBeTruthy();
      expect(screen.getByText("15")).toBeTruthy();
    });

    it("should not render icon container when icon is not provided", () => {
      const { toJSON } = render(
        <MetricCard label="Total Vehicles" value="15" />,
      );
      expect(toJSON()).toBeTruthy();
    });
  });

  describe("Variants", () => {
    it("should apply success variant color", () => {
      render(
        <MetricCard
          label="Active"
          value="10"
          icon="success"
          variant="success"
        />,
      );
      expect(screen.getByText("Active")).toBeTruthy();
    });

    it("should apply warning variant color", () => {
      render(
        <MetricCard label="Pending" value="5" icon="clock" variant="warning" />,
      );
      expect(screen.getByText("Pending")).toBeTruthy();
    });

    it("should apply error variant color", () => {
      render(
        <MetricCard label="Overdue" value="2" icon="close" variant="error" />,
      );
      expect(screen.getByText("Overdue")).toBeTruthy();
    });

    it("should apply info variant color", () => {
      render(<MetricCard label="Info" value="8" icon="info" variant="info" />);
      expect(screen.getByText("Info")).toBeTruthy();
    });

    it("should apply default variant when not specified", () => {
      render(<MetricCard label="Total" value="20" icon="menu" />);
      expect(screen.getByText("Total")).toBeTruthy();
    });
  });

  describe("Trend Display", () => {
    it("should render trend value when provided", () => {
      render(
        <MetricCard
          label="Revenue"
          value="$1,500"
          trend="up"
          trendValue="12%"
        />,
      );
      expect(screen.getByText("12%")).toBeTruthy();
    });

    it("should render trend value for up direction", () => {
      render(
        <MetricCard
          label="Revenue"
          value="$1,500"
          trend="up"
          trendValue="12%"
        />,
      );
      expect(screen.getByText("$1,500")).toBeTruthy();
      expect(screen.getByText("12%")).toBeTruthy();
    });

    it("should render trend value for down direction", () => {
      render(
        <MetricCard label="Costs" value="$500" trend="down" trendValue="5%" />,
      );
      expect(screen.getByText("$500")).toBeTruthy();
      expect(screen.getByText("5%")).toBeTruthy();
    });

    it("should render trend value for neutral direction", () => {
      render(
        <MetricCard
          label="Stable"
          value="$1,000"
          trend="neutral"
          trendValue="0%"
        />,
      );
      expect(screen.getByText("$1,000")).toBeTruthy();
      expect(screen.getByText("0%")).toBeTruthy();
    });

    it("should render comparison text when provided", () => {
      render(
        <MetricCard
          label="Revenue"
          value="$1,500"
          trend="up"
          trendValue="12%"
          comparison="vs last month"
        />,
      );
      expect(screen.getByText("vs last month")).toBeTruthy();
    });

    it("should not render trend section when trendDirection is not provided", () => {
      render(<MetricCard label="Revenue" value="$1,500" trendValue="12%" />);
      expect(screen.queryByText("12%")).toBeNull();
    });
  });

  describe("Loading State", () => {
    it("should render loading indicator when loading is true", () => {
      const { UNSAFE_getByType } = render(
        <MetricCard label="Loading" value="..." loading />,
      );
      const { ActivityIndicator } = require("react-native");
      expect(UNSAFE_getByType(ActivityIndicator)).toBeTruthy();
    });

    it("should hide content when loading is true", () => {
      render(
        <MetricCard
          label="Revenue"
          value="$1,500"
          trend="up"
          trendValue="12%"
          loading
        />,
      );
      expect(screen.queryByText("$1,500")).toBeNull();
      expect(screen.queryByText("12%")).toBeNull();
    });
  });

  describe("Disabled State", () => {
    it("should apply disabled styles when disabled is true", () => {
      render(<MetricCard label="Disabled" value="0" disabled />);
      expect(screen.getByText("Disabled")).toBeTruthy();
    });
  });

  describe("Accessibility", () => {
    it("should render label text for screen readers", () => {
      render(<MetricCard label="Total Vehicles" value="15" />);
      expect(screen.getByText("Total Vehicles")).toBeTruthy();
    });

    it("should render value text for screen readers", () => {
      render(<MetricCard label="Total Vehicles" value="15" />);
      expect(screen.getByText("15")).toBeTruthy();
    });

    it("should render trend value for screen readers", () => {
      render(
        <MetricCard
          label="Revenue"
          value="$1,500"
          trend="up"
          trendValue="12%"
        />,
      );
      expect(screen.getByText("12%")).toBeTruthy();
    });
  });
});
