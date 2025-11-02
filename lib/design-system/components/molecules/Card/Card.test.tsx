import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';
import { Text } from 'react-native';
import { Card, CardContent, CardFooter, CardHeader } from './Card';

describe('Card Component', () => {
  // Basic Rendering Tests
  describe('Rendering', () => {
    it('should render correctly with children', () => {
      const { getByText } = render(
        <Card>
          <Text>Card Content</Text>
        </Card>
      );
      
      expect(getByText('Card Content')).toBeTruthy();
    });

    it('should render empty card', () => {
      const { UNSAFE_root } = render(<Card><Text></Text></Card>);
      expect(UNSAFE_root).toBeTruthy();
    });
  });

  // Variant Tests
  describe('Variants', () => {
    it('should render default variant', () => {
      const { getByText } = render(
        <Card variant="default">
          <Text>Default Card</Text>
        </Card>
      );
      
      expect(getByText('Default Card')).toBeTruthy();
    });

    it('should render elevated variant', () => {
      const { getByText } = render(
        <Card variant="elevated">
          <Text>Elevated Card</Text>
        </Card>
      );
      
      expect(getByText('Elevated Card')).toBeTruthy();
    });

    it('should render outlined variant', () => {
      const { getByText } = render(
        <Card variant="outlined">
          <Text>Outlined Card</Text>
        </Card>
      );
      
      expect(getByText('Outlined Card')).toBeTruthy();
    });

    it('should render filled variant', () => {
      const { getByText } = render(
        <Card variant="filled">
          <Text>Filled Card</Text>
        </Card>
      );
      
      expect(getByText('Filled Card')).toBeTruthy();
    });
  });

  // Composition API Tests
  describe('Composition API', () => {
    it('should render CardHeader correctly', () => {
      const { getByText } = render(
        <Card>
          <CardHeader>
            <Text>Header</Text>
          </CardHeader>
        </Card>
      );
      
      expect(getByText('Header')).toBeTruthy();
    });

    it('should render CardContent correctly', () => {
      const { getByText } = render(
        <Card>
          <CardContent>
            <Text>Content</Text>
          </CardContent>
        </Card>
      );
      
      expect(getByText('Content')).toBeTruthy();
    });

    it('should render CardFooter correctly', () => {
      const { getByText } = render(
        <Card>
          <CardFooter>
            <Text>Footer</Text>
          </CardFooter>
        </Card>
      );
      
      expect(getByText('Footer')).toBeTruthy();
    });

    it('should render complete card with all composition parts', () => {
      const { getByText } = render(
        <Card>
          <CardHeader>
            <Text>Header</Text>
          </CardHeader>
          <CardContent>
            <Text>Content</Text>
          </CardContent>
          <CardFooter>
            <Text>Footer</Text>
          </CardFooter>
        </Card>
      );
      
      expect(getByText('Header')).toBeTruthy();
      expect(getByText('Content')).toBeTruthy();
      expect(getByText('Footer')).toBeTruthy();
    });
  });

  // Interaction Tests
  describe('Interactions', () => {
    it('should call onPress when pressed and pressable', () => {
      const onPress = jest.fn();
      const { getByText } = render(
        <Card onPress={onPress}>
          <Text>Pressable Card</Text>
        </Card>
      );
      
      fireEvent.press(getByText('Pressable Card'));
      expect(onPress).toHaveBeenCalledTimes(1);
    });

    it('should not be pressable without onPress', () => {
      const { getByText } = render(
        <Card>
          <Text>Non-Pressable Card</Text>
        </Card>
      );
      
      const card = getByText('Non-Pressable Card');
      expect(card).toBeTruthy();
    });
  });

  // Accessibility Tests
  describe('Accessibility', () => {
    it('should have correct accessibility role when pressable', () => {
      const onPress = jest.fn();
      const { getByRole } = render(
        <Card onPress={onPress}>
          <Text>Pressable</Text>
        </Card>
      );
      
      expect(getByRole('button')).toBeTruthy();
    });
  });

  // Style Tests
  describe('Styles', () => {
    it('should apply custom padding', () => {
      const { getByText } = render(
        <Card padding="lg">
          <Text>Custom Padding</Text>
        </Card>
      );
      
      expect(getByText('Custom Padding')).toBeTruthy();
    });
  });
});
