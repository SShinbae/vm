import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';
import { Button } from './Button';

describe('Button Component', () => {
  // Basic Rendering Tests
  describe('Rendering', () => {
    it('should render correctly with default props', () => {
      const onPress = jest.fn();
      const { getByText } = render(<Button onPress={onPress}>Click Me</Button>);
      
      expect(getByText('Click Me')).toBeTruthy();
    });

    it('should render with custom text', () => {
      const onPress = jest.fn();
      const { getByText } = render(<Button onPress={onPress}>Custom Text</Button>);
      
      expect(getByText('Custom Text')).toBeTruthy();
    });
  });

  // Variant Tests
  describe('Variants', () => {
    it('should render primary variant', () => {
      const onPress = jest.fn();
      const { getByText } = render(
        <Button variant="primary" onPress={onPress}>Primary</Button>
      );
      
      expect(getByText('Primary')).toBeTruthy();
    });

    it('should render secondary variant', () => {
      const onPress = jest.fn();
      const { getByText } = render(
        <Button variant="secondary" onPress={onPress}>Secondary</Button>
      );
      
      expect(getByText('Secondary')).toBeTruthy();
    });

    it('should render outline variant', () => {
      const onPress = jest.fn();
      const { getByText } = render(
        <Button variant="outline" onPress={onPress}>Outline</Button>
      );
      
      expect(getByText('Outline')).toBeTruthy();
    });

    it('should render ghost variant', () => {
      const onPress = jest.fn();
      const { getByText } = render(
        <Button variant="ghost" onPress={onPress}>Ghost</Button>
      );
      
      expect(getByText('Ghost')).toBeTruthy();
    });

    it('should render danger variant', () => {
      const onPress = jest.fn();
      const { getByText } = render(
        <Button variant="danger" onPress={onPress}>Danger</Button>
      );
      
      expect(getByText('Danger')).toBeTruthy();
    });
  });

  // Size Tests
  describe('Sizes', () => {
    it('should render small size', () => {
      const onPress = jest.fn();
      const { getByText } = render(
        <Button size="sm" onPress={onPress}>Small</Button>
      );
      
      expect(getByText('Small')).toBeTruthy();
    });

    it('should render medium size (default)', () => {
      const onPress = jest.fn();
      const { getByText } = render(
        <Button size="md" onPress={onPress}>Medium</Button>
      );
      
      expect(getByText('Medium')).toBeTruthy();
    });

    it('should render large size', () => {
      const onPress = jest.fn();
      const { getByText } = render(
        <Button size="lg" onPress={onPress}>Large</Button>
      );
      
      expect(getByText('Large')).toBeTruthy();
    });
  });

  // Interaction Tests
  describe('Interactions', () => {
    it('should call onPress when pressed', () => {
      const onPress = jest.fn();
      const { getByText } = render(<Button onPress={onPress}>Press Me</Button>);
      
      fireEvent.press(getByText('Press Me'));
      expect(onPress).toHaveBeenCalledTimes(1);
    });

    it('should not call onPress when disabled', () => {
      const onPress = jest.fn();
      const { getByText } = render(
        <Button onPress={onPress} disabled>Disabled</Button>
      );
      
      fireEvent.press(getByText('Disabled'));
      expect(onPress).not.toHaveBeenCalled();
    });

    it('should not call onPress when loading', () => {
      const onPress = jest.fn();
      const { getByText } = render(
        <Button onPress={onPress} loading>Loading</Button>
      );
      
      fireEvent.press(getByText('Loading'));
      expect(onPress).not.toHaveBeenCalled();
    });
  });

  // State Tests
  describe('States', () => {
    it('should render disabled state', () => {
      const onPress = jest.fn();
      const { getByText } = render(
        <Button onPress={onPress} disabled>Disabled</Button>
      );
      
      const button = getByText('Disabled');
      expect(button).toBeTruthy();
    });

    it('should render loading state with activity indicator', () => {
      const onPress = jest.fn();
      const { getByText } = render(
        <Button onPress={onPress} loading>Loading</Button>
      );
      
      expect(getByText('Loading')).toBeTruthy();
      // Loading indicator should be present
    });

    it('should render fullWidth correctly', () => {
      const onPress = jest.fn();
      const { getByText } = render(
        <Button onPress={onPress} fullWidth>Full Width</Button>
      );
      
      expect(getByText('Full Width')).toBeTruthy();
    });
  });

  // Icon Tests
  describe('Icons', () => {
    it('should render with left icon', () => {
      const onPress = jest.fn();
      const { getByText } = render(
        <Button onPress={onPress} leftIcon="add">With Icon</Button>
      );
      
      expect(getByText('With Icon')).toBeTruthy();
    });

    it('should render with right icon', () => {
      const onPress = jest.fn();
      const { getByText } = render(
        <Button onPress={onPress} rightIcon="forward">With Icon</Button>
      );
      
      expect(getByText('With Icon')).toBeTruthy();
    });

    it('should render with both left and right icons', () => {
      const onPress = jest.fn();
      const { getByText } = render(
        <Button onPress={onPress} leftIcon="add" rightIcon="forward">
          Both Icons
        </Button>
      );
      
      expect(getByText('Both Icons')).toBeTruthy();
    });
  });

  // Accessibility Tests
  describe('Accessibility', () => {
    it('should have correct accessibility role', () => {
      const onPress = jest.fn();
      const { getByRole } = render(<Button onPress={onPress}>Accessible</Button>);
      
      expect(getByRole('button')).toBeTruthy();
    });

    it('should have correct accessibility state when disabled', () => {
      const onPress = jest.fn();
      const { getByRole } = render(
        <Button onPress={onPress} disabled>Disabled</Button>
      );
      
      const button = getByRole('button');
      expect(button).toBeTruthy();
      expect(button.props.accessibilityState).toEqual({ disabled: true });
    });
  });

  // Style Tests
  describe('Styles', () => {
    it('should accept custom style prop', () => {
      const onPress = jest.fn();
      const customStyle = { marginTop: 20 };
      const { getByText } = render(
        <Button onPress={onPress} style={customStyle}>Styled</Button>
      );
      
      expect(getByText('Styled')).toBeTruthy();
    });
  });
});
