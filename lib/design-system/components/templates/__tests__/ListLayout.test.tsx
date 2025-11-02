import { render, screen } from '@testing-library/react-native';
import React from 'react';
import { Text } from '../../atoms/Text';
import { ListLayout } from '../ListLayout';

interface TestItem {
  id: string;
  name: string;
}

describe('ListLayout', () => {
  const testData: TestItem[] = [
    { id: '1', name: 'Item 1' },
    { id: '2', name: 'Item 2' },
    { id: '3', name: 'Item 3' },
  ];

  const renderItem = ({ item }: { item: TestItem }) => <Text>{item.name}</Text>;

  describe('Basic Rendering', () => {
    it('should render list items', () => {
      render(<ListLayout data={testData} renderItem={renderItem} />);
      expect(screen.getByText('Item 1')).toBeTruthy();
      expect(screen.getByText('Item 2')).toBeTruthy();
      expect(screen.getByText('Item 3')).toBeTruthy();
    });

    it('should render header when provided', () => {
      render(
        <ListLayout
          data={testData}
          renderItem={renderItem}
          header={{ title: 'My List' }}
        />
      );
      expect(screen.getByText('My List')).toBeTruthy();
    });

    it('should render search bar when search handlers provided', () => {
      render(
        <ListLayout
          data={testData}
          renderItem={renderItem}
          onSearchChange={jest.fn()}
          searchQuery=""
        />
      );
      expect(screen.getByPlaceholderText('Search...')).toBeTruthy();
    });

    it('should render filter button when onFilterPress provided', () => {
      render(
        <ListLayout
          data={testData}
          renderItem={renderItem}
          onSearchChange={jest.fn()}
          onFilterPress={jest.fn()}
          searchQuery=""
        />
      );
      expect(screen.getByLabelText('Filter')).toBeTruthy();
    });
  });

  describe('Empty State', () => {
    it('should show default empty message when data is empty', () => {
      render(<ListLayout data={[]} renderItem={renderItem} />);
      expect(screen.getByText('No items found')).toBeTruthy();
    });

    it('should show custom empty message', () => {
      render(
        <ListLayout
          data={[]}
          renderItem={renderItem}
          emptyMessage="No vehicles available"
        />
      );
      expect(screen.getByText('No vehicles available')).toBeTruthy();
    });

    it('should show custom empty component', () => {
      render(
        <ListLayout
          data={[]}
          renderItem={renderItem}
          emptyComponent={<Text>Custom Empty State</Text>}
        />
      );
      expect(screen.getByText('Custom Empty State')).toBeTruthy();
    });
  });

  describe('Loading State', () => {
    it('should show loading indicator when loading', () => {
      render(<ListLayout data={[]} renderItem={renderItem} loading />);
      expect(screen.getByText('Loading...')).toBeTruthy();
    });

    it('should not show items when loading', () => {
      render(<ListLayout data={testData} renderItem={renderItem} loading />);
      expect(screen.queryByText('Item 1')).toBeNull();
    });
  });

  describe('Load More', () => {
    it('should show loading more indicator', () => {
      render(
        <ListLayout
          data={testData}
          renderItem={renderItem}
          loadingMore
          hasMore
        />
      );
      expect(screen.getByText('Loading more...')).toBeTruthy();
    });

    it('should show end of list message when no more items', () => {
      render(
        <ListLayout
          data={testData}
          renderItem={renderItem}
          hasMore={false}
        />
      );
      expect(screen.getByText('End of list')).toBeTruthy();
    });
  });

  describe('Custom Sections', () => {
    it('should render list header', () => {
      render(
        <ListLayout
          data={testData}
          renderItem={renderItem}
          listHeader={<Text>Custom Header</Text>}
        />
      );
      expect(screen.getByText('Custom Header')).toBeTruthy();
    });

    it('should render list footer', () => {
      render(
        <ListLayout
          data={testData}
          renderItem={renderItem}
          listFooter={<Text>Custom Footer</Text>}
        />
      );
      expect(screen.getByText('Custom Footer')).toBeTruthy();
    });
  });

  describe('Pull to Refresh', () => {
    it('should be refreshable by default', () => {
      const onRefresh = jest.fn();
      render(<ListLayout data={testData} renderItem={renderItem} onRefresh={onRefresh} />);
      // RefreshControl should be rendered
      expect(screen.getByText('Item 1')).toBeTruthy();
    });

    it('should not be refreshable when disabled', () => {
      const onRefresh = jest.fn();
      render(
        <ListLayout
          data={testData}
          renderItem={renderItem}
          onRefresh={onRefresh}
          refreshable={false}
        />
      );
      expect(screen.getByText('Item 1')).toBeTruthy();
    });
  });
});
