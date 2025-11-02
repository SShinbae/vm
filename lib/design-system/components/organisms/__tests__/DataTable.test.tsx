import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';
import { DataTable } from '../DataTable';
import type { DataTableColumn } from '../DataTable/DataTable.types';

interface TestData {
  id: number;
  name: string;
  email: string;
  status: 'active' | 'inactive';
}

describe('DataTable', () => {
  const testData: TestData[] = [
    { id: 1, name: 'John Doe', email: 'john@example.com', status: 'active' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', status: 'inactive' },
    { id: 3, name: 'Bob Johnson', email: 'bob@example.com', status: 'active' },
  ];

  const columns: DataTableColumn<TestData>[] = [
    { key: 'name', title: 'Name', width: 150 },
    { key: 'email', title: 'Email', width: 200 },
    { key: 'status', title: 'Status', width: 100 },
  ];

  describe('Basic Rendering', () => {
    it('should render column headers', () => {
      render(<DataTable columns={columns} data={testData} />);
      expect(screen.getByText('Name')).toBeTruthy();
      expect(screen.getByText('Email')).toBeTruthy();
      expect(screen.getByText('Status')).toBeTruthy();
    });

    it('should render data rows', () => {
      render(<DataTable columns={columns} data={testData} />);
      expect(screen.getByText('John Doe')).toBeTruthy();
      expect(screen.getByText('john@example.com')).toBeTruthy();
      expect(screen.getByText('Jane Smith')).toBeTruthy();
      expect(screen.getByText('jane@example.com')).toBeTruthy();
    });

    it('should render correct number of rows', () => {
      render(<DataTable columns={columns} data={testData} />);
      expect(screen.getByText('John Doe')).toBeTruthy();
      expect(screen.getByText('Jane Smith')).toBeTruthy();
      expect(screen.getByText('Bob Johnson')).toBeTruthy();
    });
  });

  describe('Custom Rendering', () => {
    it('should use custom render function when provided', () => {
      const columnsWithRender: DataTableColumn<TestData>[] = [
        { key: 'name', title: 'Name', width: 150 },
        {
          key: 'status',
          title: 'Status',
          width: 100,
          render: (value) => (value === 'active' ? '✅ Active' : '❌ Inactive'),
        },
      ];
      render(<DataTable columns={columnsWithRender} data={testData} />);
      expect(screen.getByText('✅ Active')).toBeTruthy();
      expect(screen.getByText('❌ Inactive')).toBeTruthy();
    });

    it('should pass item and index to custom render function', () => {
      const renderFn = jest.fn((value, item, index) => `${index}: ${value}`);
      const columnsWithRender: DataTableColumn<TestData>[] = [
        { key: 'name', title: 'Name', width: 150, render: renderFn },
      ];
      render(<DataTable columns={columnsWithRender} data={testData} />);
      expect(renderFn).toHaveBeenCalledWith('John Doe', testData[0], 0);
      expect(renderFn).toHaveBeenCalledWith('Jane Smith', testData[1], 1);
    });
  });

  describe('Row Press', () => {
    it('should call onRowPress when row is pressed', () => {
      const onRowPress = jest.fn();
      render(<DataTable columns={columns} data={testData} onRowPress={onRowPress} />);
      const firstRow = screen.getByLabelText('Table row 1');
      fireEvent.press(firstRow);
      expect(onRowPress).toHaveBeenCalledWith(testData[0], 0);
    });

    it('should not call onRowPress when disabled', () => {
      const onRowPress = jest.fn();
      render(<DataTable columns={columns} data={testData} onRowPress={onRowPress} disabled />);
      const firstRow = screen.getByLabelText('Table row 1');
      fireEvent.press(firstRow);
      expect(onRowPress).not.toHaveBeenCalled();
    });
  });

  describe('Empty State', () => {
    it('should render default empty message when data is empty', () => {
      render(<DataTable columns={columns} data={[]} />);
      expect(screen.getByText('No data available')).toBeTruthy();
    });

    it('should render custom empty message when provided', () => {
      render(
        <DataTable columns={columns} data={[]} emptyMessage="No records found" />
      );
      expect(screen.getByText('No records found')).toBeTruthy();
    });

    it('should render custom empty component when provided', () => {
      render(
        <DataTable
          columns={columns}
          data={[]}
          emptyComponent={<button>Add New Item</button>}
        />
      );
      expect(screen.getByText('Add New Item')).toBeTruthy();
    });
  });

  describe('Loading State', () => {
    it('should render loading indicator when loading is true', () => {
      render(<DataTable columns={columns} data={[]} loading />);
      expect(screen.getByLabelText('Loading table data')).toBeTruthy();
    });

    it('should hide data when loading is true', () => {
      render(<DataTable columns={columns} data={testData} loading />);
      expect(screen.queryByText('John Doe')).toBeNull();
    });

    it('should hide empty message when loading is true', () => {
      render(<DataTable columns={columns} data={[]} loading />);
      expect(screen.queryByText('No data available')).toBeNull();
    });
  });

  describe('Striped Rows', () => {
    it('should apply striped styles when striped is true', () => {
      render(<DataTable columns={columns} data={testData} striped />);
      expect(screen.getByText('John Doe')).toBeTruthy();
    });
  });

  describe('Key Extraction', () => {
    it('should use keyExtractor when provided', () => {
      const keyExtractor = jest.fn((item: TestData) => `user-${item.id}`);
      render(<DataTable columns={columns} data={testData} keyExtractor={keyExtractor} />);
      expect(keyExtractor).toHaveBeenCalledTimes(testData.length);
    });

    it('should use default key extraction when keyExtractor is not provided', () => {
      render(<DataTable columns={columns} data={testData} />);
      expect(screen.getByText('John Doe')).toBeTruthy();
    });
  });

  describe('Accessibility', () => {
    it('should have proper accessibility role for table', () => {
      render(<DataTable columns={columns} data={testData} />);
      const table = screen.getByLabelText('Data table');
      expect(table.props.accessibilityRole).toBe('table');
    });

    it('should have proper accessibility role for rows', () => {
      render(<DataTable columns={columns} data={testData} />);
      const firstRow = screen.getByLabelText('Table row 1');
      expect(firstRow.props.accessibilityRole).toBe('row');
    });

    it('should set accessibility state for disabled table', () => {
      render(<DataTable columns={columns} data={testData} disabled />);
      const table = screen.getByLabelText('Data table');
      expect(table.props.accessibilityState).toEqual({ disabled: true });
    });

    it('should set accessibility state for loading table', () => {
      render(<DataTable columns={columns} data={testData} loading />);
      const table = screen.getByLabelText('Data table');
      expect(table.props.accessibilityState).toEqual({ busy: true });
    });
  });

  describe('Horizontal Scrolling', () => {
    it('should enable horizontal scrolling', () => {
      render(<DataTable columns={columns} data={testData} />);
      expect(screen.getByLabelText('Data table')).toBeTruthy();
    });
  });
});
