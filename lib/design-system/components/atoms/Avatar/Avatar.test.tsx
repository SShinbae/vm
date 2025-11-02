import { render } from '@testing-library/react-native';
import React from 'react';
import { Avatar } from '../Avatar';

describe('Avatar Component', () => {
  it('renders with initials from name', () => {
    const { getByText } = render(<Avatar name="John Doe" />);
    expect(getByText('JD')).toBeTruthy();
  });

  it('renders single initial for single word name', () => {
    const { getByText } = render(<Avatar name="John" />);
    expect(getByText('J')).toBeTruthy();
  });

  it('renders question mark when no name provided', () => {
    const { getByText } = render(<Avatar />);
    expect(getByText('?')).toBeTruthy();
  });

  it('renders with image source', () => {
    const source = { uri: 'https://example.com/avatar.jpg' };
    const { container } = render(<Avatar source={source} />);
    expect(container).toBeTruthy();
  });

  it('renders with different sizes', () => {
    const { getByText } = render(<Avatar name="John" size="lg" />);
    expect(getByText('J')).toBeTruthy();
  });

  it('shows status indicator when enabled', () => {
    const { container } = render(
      <Avatar name="John" showStatus status="online" />
    );
    expect(container).toBeTruthy();
  });

  it('has correct accessibility label', () => {
    const { getByLabelText } = render(<Avatar name="John Doe" />);
    expect(getByLabelText('John Doe')).toBeTruthy();
  });

  it('uses alt text for accessibility when provided', () => {
    const { getByLabelText } = render(<Avatar name="John" alt="User avatar" />);
    expect(getByLabelText('User avatar')).toBeTruthy();
  });
});
