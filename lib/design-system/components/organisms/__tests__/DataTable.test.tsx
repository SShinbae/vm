import { fireEvent, screen } from "@testing-library/react-native";
import { renderWithProviders as render } from "@/__tests__/setup/testUtils";
import React from "react";
import { Text } from "react-native";
import { DataTable } from "../DataTable";
import type { DataTableColumn } from "../DataTable/DataTable.types";

interface TestData {
  id: number;
  name: string;
  email: string;
  status: "active" | "inactive";
}

describe("DataTable", () => {
  const testData: TestData[] = [
    { id: 1, name: "John Doe", email: "john@example.com", status: "active" },
    {
      id: 2,
      name: "Jane Smith",
      email: "jane@example.com",
      status: "inactive",
    },
    { id: 3, name: "Bob Johnson", email: "bob@example.com", status: "active" },
  ];

  const columns: DataTableColumn<TestData>[] = [
    { key: "name", title: "Name", width: 150 },
    { key: "email", title: "Email", width: 200 },
    { key: "status", title: "Status", width: 100 },
  ];

  describe("Basic Rendering", () => {
    it("should render column headers", () => {
      render(<DataTable columns={columns} data={testData} />);
      expect(screen.getByText("Name")).toBeTruthy();
      expect(screen.getByText("Email")).toBeTruthy();
      expect(screen.getByText("Status")).toBeTruthy();
    });

    it("should render data rows", () => {
      render(<DataTable columns={columns} data={testData} />);
      expect(screen.getByText("John Doe")).toBeTruthy();
      expect(screen.getByText("john@example.com")).toBeTruthy();
      expect(screen.getByText("Jane Smith")).toBeTruthy();
      expect(screen.getByText("jane@example.com")).toBeTruthy();
    });

    it("should render correct number of rows", () => {
      render(<DataTable columns={columns} data={testData} />);
      expect(screen.getByText("John Doe")).toBeTruthy();
      expect(screen.getByText("Jane Smith")).toBeTruthy();
      expect(screen.getByText("Bob Johnson")).toBeTruthy();
    });
  });

  describe("Custom Rendering", () => {
    it("should use custom render function when provided", () => {
      const columnsWithRender: DataTableColumn<TestData>[] = [
        { key: "name", title: "Name", width: 150 },
        {
          key: "status",
          title: "Status",
          width: 100,
          render: (value) => (
            <Text>{value === "active" ? "✅ Active" : "❌ Inactive"}</Text>
          ),
        },
      ];
      render(<DataTable columns={columnsWithRender} data={testData} />);
      // There are 2 rows with "active" status, so use getAllByText
      expect(screen.getAllByText("✅ Active").length).toBe(2);
      expect(screen.getAllByText("❌ Inactive").length).toBe(1);
    });

    it("should pass item and index to custom render function", () => {
      const renderFn = jest.fn((value, item, index) => (
        <Text>{`${index}: ${value}`}</Text>
      ));
      const columnsWithRender: DataTableColumn<TestData>[] = [
        { key: "name", title: "Name", width: 150, render: renderFn },
      ];
      render(<DataTable columns={columnsWithRender} data={testData} />);
      expect(renderFn).toHaveBeenCalledWith("John Doe", testData[0], 0);
      expect(renderFn).toHaveBeenCalledWith("Jane Smith", testData[1], 1);
    });
  });

  describe("Row Press", () => {
    it("should call onRowPress when row is pressed", () => {
      const onRowPress = jest.fn();
      render(
        <DataTable columns={columns} data={testData} onRowPress={onRowPress} />,
      );
      // Press on the first data row by finding the name text and pressing its parent
      const firstRowText = screen.getByText("John Doe");
      fireEvent.press(firstRowText);
      expect(onRowPress).toHaveBeenCalledWith(testData[0], 0);
    });

    it("should not call onRowPress when onRowPress is not provided", () => {
      render(<DataTable columns={columns} data={testData} />);
      const firstRowText = screen.getByText("John Doe");
      // This should not throw an error
      fireEvent.press(firstRowText);
    });
  });

  describe("Empty State", () => {
    it("should render default empty message when data is empty", () => {
      render(<DataTable columns={columns} data={[]} />);
      expect(screen.getByText("No data available")).toBeTruthy();
    });

    it("should render custom empty message when provided", () => {
      render(
        <DataTable
          columns={columns}
          data={[]}
          emptyMessage="No records found"
        />,
      );
      expect(screen.getByText("No records found")).toBeTruthy();
    });

    it("should render custom empty component when provided", () => {
      render(
        <DataTable
          columns={columns}
          data={[]}
          emptyState={<Text>Add New Item</Text>}
        />,
      );
      expect(screen.getByText("Add New Item")).toBeTruthy();
    });
  });

  describe("Loading State", () => {
    it("should render loading indicator when loading is true", () => {
      const { UNSAFE_getByType } = render(
        <DataTable columns={columns} data={[]} loading />,
      );
      // ActivityIndicator is rendered when loading
      const { ActivityIndicator } = require("react-native");
      expect(UNSAFE_getByType(ActivityIndicator)).toBeTruthy();
    });

    it("should hide data when loading is true", () => {
      render(<DataTable columns={columns} data={testData} loading />);
      expect(screen.queryByText("John Doe")).toBeNull();
    });

    it("should hide empty message when loading is true", () => {
      render(<DataTable columns={columns} data={[]} loading />);
      expect(screen.queryByText("No data available")).toBeNull();
    });
  });

  describe("Striped Rows", () => {
    it("should apply striped styles when striped is true", () => {
      render(<DataTable columns={columns} data={testData} striped />);
      expect(screen.getByText("John Doe")).toBeTruthy();
    });
  });

  describe("Key Extraction", () => {
    it("should use keyExtractor when provided", () => {
      const keyExtractor = jest.fn((item: TestData) => `user-${item.id}`);
      render(
        <DataTable
          columns={columns}
          data={testData}
          keyExtractor={keyExtractor}
        />,
      );
      // keyExtractor is called for each row, may be called multiple times due to React's rendering
      expect(keyExtractor).toHaveBeenCalled();
      expect(keyExtractor).toHaveBeenCalledWith(testData[0], 0);
    });

    it("should use default key extraction when keyExtractor is not provided", () => {
      render(<DataTable columns={columns} data={testData} />);
      expect(screen.getByText("John Doe")).toBeTruthy();
    });
  });

  describe("Accessibility", () => {
    it("should render data correctly for accessibility", () => {
      render(<DataTable columns={columns} data={testData} />);
      // Verify all data is accessible
      expect(screen.getByText("John Doe")).toBeTruthy();
      expect(screen.getByText("Jane Smith")).toBeTruthy();
      expect(screen.getByText("Bob Johnson")).toBeTruthy();
    });

    it("should render headers correctly for accessibility", () => {
      render(<DataTable columns={columns} data={testData} />);
      expect(screen.getByText("Name")).toBeTruthy();
      expect(screen.getByText("Email")).toBeTruthy();
      expect(screen.getByText("Status")).toBeTruthy();
    });

    it("should hide headers when showHeader is false", () => {
      render(
        <DataTable columns={columns} data={testData} showHeader={false} />,
      );
      expect(screen.queryByText("Name")).toBeNull();
      expect(screen.queryByText("Email")).toBeNull();
      expect(screen.queryByText("Status")).toBeNull();
      // But data should still show
      expect(screen.getByText("John Doe")).toBeTruthy();
    });
  });

  describe("Horizontal Scrolling", () => {
    it("should enable horizontal scrolling", () => {
      const { UNSAFE_getByType } = render(
        <DataTable columns={columns} data={testData} />,
      );
      const { ScrollView } = require("react-native");
      const scrollView = UNSAFE_getByType(ScrollView);
      expect(scrollView.props.horizontal).toBe(true);
    });
  });
});
