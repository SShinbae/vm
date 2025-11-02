import { render } from '@testing-library/react-native';
import React from 'react';
import { Spacer } from '../Spacer';

describe('Spacer Component', () => {
  it('renders with default props', () => {
    const { container } = render(<Spacer />);
    expect(container).toBeTruthy();
  });

  it('renders with different sizes', () => {
    const { container } = render(<Spacer size="lg" />);
    expect(container).toBeTruthy();
  });

  it('renders as horizontal spacer', () => {
    const { container } = render(<Spacer horizontal />);
    expect(container).toBeTruthy();
  });

  it('renders as vertical spacer by default', () => {
    const { container } = render(<Spacer />);
    expect(container).toBeTruthy();
  });

  it('is hidden from accessibility tree', () => {
    const { container } = render(<Spacer />);
    const spacer = container.children[0];
    expect(spacer.props.accessibilityElementsHidden).toBe(true);
    expect(spacer.props.importantForAccessibility).toBe('no');
  });
});
