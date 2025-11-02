import { render } from '@testing-library/react-native';
import React from 'react';
import { Text } from '../Text';

describe('Text Component', () => {
  it('renders correctly with default props', () => {
    const { getByText } = render(<Text>Hello World</Text>);
    expect(getByText('Hello World')).toBeTruthy();
  });

  it('renders with display variant', () => {
    const { getByText } = render(<Text variant="display">Display Text</Text>);
    const element = getByText('Display Text');
    expect(element).toBeTruthy();
  });

  it('renders with heading variant', () => {
    const { getByText } = render(<Text variant="heading">Heading</Text>);
    expect(getByText('Heading')).toBeTruthy();
  });

  it('renders with different sizes', () => {
    const { getByText } = render(<Text size="lg">Large Text</Text>);
    expect(getByText('Large Text')).toBeTruthy();
  });

  it('renders with different weights', () => {
    const { getByText } = render(<Text weight="bold">Bold Text</Text>);
    expect(getByText('Bold Text')).toBeTruthy();
  });

  it('renders with different colors', () => {
    const { getByText } = render(<Text color="success">Success</Text>);
    expect(getByText('Success')).toBeTruthy();
  });

  it('renders with different alignments', () => {
    const { getByText } = render(<Text align="center">Centered</Text>);
    expect(getByText('Centered')).toBeTruthy();
  });

  it('truncates text with numberOfLines', () => {
    const { getByText } = render(
      <Text numberOfLines={1}>This is a very long text that should be truncated</Text>
    );
    expect(getByText('This is a very long text that should be truncated')).toBeTruthy();
  });

  it('has correct accessibility role', () => {
    const { getByText } = render(<Text>Accessible</Text>);
    const element = getByText('Accessible');
    expect(element.props.accessibilityRole).toBe('text');
  });
});
