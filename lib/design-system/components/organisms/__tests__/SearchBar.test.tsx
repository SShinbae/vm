import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';
import { SearchBar } from '../SearchBar';

describe('SearchBar', () => {
  describe('Basic Rendering', () => {
    it('should render with placeholder', () => {
      render(<SearchBar value="" onChangeText={jest.fn()} />);
      expect(screen.getByPlaceholderText('Search...')).toBeTruthy();
    });

    it('should render with custom placeholder', () => {
      render(
        <SearchBar value="" onChangeText={jest.fn()} placeholder="Search vehicles..." />
      );
      expect(screen.getByPlaceholderText('Search vehicles...')).toBeTruthy();
    });

    it('should display current value', () => {
      render(<SearchBar value="Test Query" onChangeText={jest.fn()} />);
      const input = screen.getByPlaceholderText('Search...');
      expect(input.props.value).toBe('Test Query');
    });
  });

  describe('Text Input', () => {
    it('should call onChangeText when text changes', () => {
      const onChangeText = jest.fn();
      render(<SearchBar value="" onChangeText={onChangeText} />);
      const input = screen.getByPlaceholderText('Search...');
      fireEvent.changeText(input, 'new query');
      expect(onChangeText).toHaveBeenCalledWith('new query');
    });

    it('should call onSubmit when submit is pressed', () => {
      const onSubmit = jest.fn();
      render(<SearchBar value="test" onChangeText={jest.fn()} onSubmit={onSubmit} />);
      const input = screen.getByPlaceholderText('Search...');
      fireEvent(input, 'submitEditing');
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });

    it('should not render clear button when value is empty', () => {
      render(<SearchBar value="" onChangeText={jest.fn()} />);
      const clearButtons = screen.queryAllByLabelText('Clear search');
      expect(clearButtons.length).toBe(0);
    });

    it('should render clear button when value is not empty', () => {
      render(<SearchBar value="test" onChangeText={jest.fn()} />);
      expect(screen.getByLabelText('Clear search')).toBeTruthy();
    });

    it('should clear text when clear button is pressed', () => {
      const onChangeText = jest.fn();
      render(<SearchBar value="test" onChangeText={onChangeText} />);
      const clearButton = screen.getByLabelText('Clear search');
      fireEvent.press(clearButton);
      expect(onChangeText).toHaveBeenCalledWith('');
    });
  });

  describe('Filter Button', () => {
    it('should not render filter button by default', () => {
      render(<SearchBar value="" onChangeText={jest.fn()} />);
      const filterButtons = screen.queryAllByLabelText('Filter');
      expect(filterButtons.length).toBe(0);
    });

    it('should render filter button when onFilterPress is provided', () => {
      render(<SearchBar value="" onChangeText={jest.fn()} onFilterPress={jest.fn()} />);
      expect(screen.getByLabelText('Filter')).toBeTruthy();
    });

    it('should call onFilterPress when filter button is pressed', () => {
      const onFilterPress = jest.fn();
      render(<SearchBar value="" onChangeText={jest.fn()} onFilterPress={onFilterPress} />);
      const filterButton = screen.getByLabelText('Filter');
      fireEvent.press(filterButton);
      expect(onFilterPress).toHaveBeenCalledTimes(1);
    });

    it('should not render badge when activeFilters is 0', () => {
      render(
        <SearchBar
          value=""
          onChangeText={jest.fn()}
          onFilterPress={jest.fn()}
          activeFilters={0}
        />
      );
      const badges = screen.queryAllByText('0');
      expect(badges.length).toBe(0);
    });

    it('should render badge when activeFilters is greater than 0', () => {
      render(
        <SearchBar
          value=""
          onChangeText={jest.fn()}
          onFilterPress={jest.fn()}
          activeFilters={3}
        />
      );
      expect(screen.getByText('3')).toBeTruthy();
    });
  });

  describe('Sort Button', () => {
    it('should not render sort button by default', () => {
      render(<SearchBar value="" onChangeText={jest.fn()} />);
      const sortButtons = screen.queryAllByLabelText('Sort');
      expect(sortButtons.length).toBe(0);
    });

    it('should render sort button when onSortPress is provided', () => {
      render(<SearchBar value="" onChangeText={jest.fn()} onSortPress={jest.fn()} />);
      expect(screen.getByLabelText('Sort')).toBeTruthy();
    });

    it('should call onSortPress when sort button is pressed', () => {
      const onSortPress = jest.fn();
      render(<SearchBar value="" onChangeText={jest.fn()} onSortPress={onSortPress} />);
      const sortButton = screen.getByLabelText('Sort');
      fireEvent.press(sortButton);
      expect(onSortPress).toHaveBeenCalledTimes(1);
    });
  });

  describe('Disabled State', () => {
    it('should disable input when disabled is true', () => {
      render(<SearchBar value="" onChangeText={jest.fn()} disabled />);
      const input = screen.getByPlaceholderText('Search...');
      expect(input.props.editable).toBe(false);
    });

    it('should not call onChangeText when disabled', () => {
      const onChangeText = jest.fn();
      render(<SearchBar value="" onChangeText={onChangeText} disabled />);
      const input = screen.getByPlaceholderText('Search...');
      fireEvent.changeText(input, 'new query');
      expect(onChangeText).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper accessibility label', () => {
      render(<SearchBar value="" onChangeText={jest.fn()} />);
      const input = screen.getByPlaceholderText('Search...');
      expect(input.props.accessibilityLabel).toBe('Search');
    });

    it('should have proper accessibility role for buttons', () => {
      render(
        <SearchBar
          value="test"
          onChangeText={jest.fn()}
          onFilterPress={jest.fn()}
          onSortPress={jest.fn()}
        />
      );
      const clearButton = screen.getByLabelText('Clear search');
      const filterButton = screen.getByLabelText('Filter');
      const sortButton = screen.getByLabelText('Sort');
      expect(clearButton.props.accessibilityRole).toBe('button');
      expect(filterButton.props.accessibilityRole).toBe('button');
      expect(sortButton.props.accessibilityRole).toBe('button');
    });
  });
});
