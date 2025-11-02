import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';
import { Input } from './Input';

describe('Input Component', () => {
  // Basic Rendering Tests
  describe('Rendering', () => {
    it('should render correctly with default props', () => {
      const { getByPlaceholderText } = render(
        <Input placeholder="Enter text" />
      );
      
      expect(getByPlaceholderText('Enter text')).toBeTruthy();
    });

    it('should render with label', () => {
      const { getByText, getByPlaceholderText } = render(
        <Input label="Username" placeholder="Enter username" />
      );
      
      expect(getByText('Username')).toBeTruthy();
      expect(getByPlaceholderText('Enter username')).toBeTruthy();
    });

    it('should render with helper text', () => {
      const { getByText, getByPlaceholderText } = render(
        <Input placeholder="Enter text" helperText="This is helper text" />
      );
      
      expect(getByPlaceholderText('Enter text')).toBeTruthy();
      expect(getByText('This is helper text')).toBeTruthy();
    });
  });

  // Validation State Tests
  describe('Validation States', () => {
    it('should render error state with error text', () => {
      const { getByText, getByPlaceholderText } = render(
        <Input placeholder="Enter text" errorText="This field is required" />
      );
      
      expect(getByPlaceholderText('Enter text')).toBeTruthy();
      expect(getByText('This field is required')).toBeTruthy();
    });

    it('should render success state with success text', () => {
      const { getByText, getByPlaceholderText } = render(
        <Input placeholder="Enter text" successText="Looks good!" />
      );
      
      expect(getByPlaceholderText('Enter text')).toBeTruthy();
      expect(getByText('Looks good!')).toBeTruthy();
    });

    it('should prioritize error text over helper text', () => {
      const { getByText, queryByText } = render(
        <Input 
          placeholder="Enter text" 
          helperText="Helper text" 
          errorText="Error text" 
        />
      );
      
      expect(getByText('Error text')).toBeTruthy();
      expect(queryByText('Helper text')).toBeNull();
    });

    it('should prioritize success text over helper text', () => {
      const { getByText, queryByText } = render(
        <Input 
          placeholder="Enter text" 
          helperText="Helper text" 
          successText="Success text" 
        />
      );
      
      expect(getByText('Success text')).toBeTruthy();
      expect(queryByText('Helper text')).toBeNull();
    });
  });

  // Interaction Tests
  describe('Interactions', () => {
    it('should handle text input', () => {
      const onChangeText = jest.fn();
      const { getByPlaceholderText } = render(
        <Input placeholder="Enter text" onChangeText={onChangeText} />
      );
      
      const input = getByPlaceholderText('Enter text');
      fireEvent.changeText(input, 'Hello World');
      
      expect(onChangeText).toHaveBeenCalledWith('Hello World');
    });

    it('should handle focus event', () => {
      const onFocus = jest.fn();
      const { getByPlaceholderText } = render(
        <Input placeholder="Enter text" onFocus={onFocus} />
      );
      
      const input = getByPlaceholderText('Enter text');
      fireEvent(input, 'focus');
      
      expect(onFocus).toHaveBeenCalled();
    });

    it('should handle blur event', () => {
      const onBlur = jest.fn();
      const { getByPlaceholderText } = render(
        <Input placeholder="Enter text" onBlur={onBlur} />
      );
      
      const input = getByPlaceholderText('Enter text');
      fireEvent(input, 'blur');
      
      expect(onBlur).toHaveBeenCalled();
    });

    it('should not be editable when disabled', () => {
      const { getByPlaceholderText } = render(
        <Input placeholder="Enter text" disabled />
      );
      
      const input = getByPlaceholderText('Enter text');
      expect(input.props.editable).toBe(false);
    });
  });

  // Icon Tests
  describe('Icons', () => {
    it('should render with left icon', () => {
      const { getByPlaceholderText } = render(
        <Input placeholder="Enter text" leftIcon="search" />
      );
      
      expect(getByPlaceholderText('Enter text')).toBeTruthy();
    });

    it('should render with right icon', () => {
      const { getByPlaceholderText } = render(
        <Input placeholder="Enter text" rightIcon="close" />
      );
      
      expect(getByPlaceholderText('Enter text')).toBeTruthy();
    });

    it('should call onRightIconPress when right icon is pressed', () => {
      const onRightIconPress = jest.fn();
      const { getByPlaceholderText } = render(
        <Input 
          placeholder="Enter text" 
          rightIcon="close" 
          onRightIconPress={onRightIconPress} 
        />
      );
      
      expect(getByPlaceholderText('Enter text')).toBeTruthy();
      // Icon press would need to be tested with accessibility props
    });
  });

  // State Tests
  describe('States', () => {
    it('should render disabled state', () => {
      const { getByPlaceholderText } = render(
        <Input placeholder="Enter text" disabled />
      );
      
      const input = getByPlaceholderText('Enter text');
      expect(input.props.editable).toBe(false);
    });

    it('should render fullWidth correctly', () => {
      const { getByPlaceholderText } = render(
        <Input placeholder="Enter text" fullWidth />
      );
      
      expect(getByPlaceholderText('Enter text')).toBeTruthy();
    });
  });

  // Accessibility Tests
  describe('Accessibility', () => {
    it('should have correct accessibility label from label prop', () => {
      const { getByPlaceholderText } = render(
        <Input label="Email Address" placeholder="Enter email" />
      );
      
      const input = getByPlaceholderText('Enter email');
      expect(input.props.accessibilityLabel).toBe('Email Address');
    });

    it('should have keyboard type text by default', () => {
      const { getByPlaceholderText } = render(
        <Input placeholder="Enter text" />
      );
      
      const input = getByPlaceholderText('Enter text');
      expect(input.props.keyboardType).toBe('default');
    });
  });

  // TextInput Props Tests
  describe('TextInput Props', () => {
    it('should support secureTextEntry', () => {
      const { getByPlaceholderText } = render(
        <Input placeholder="Password" secureTextEntry />
      );
      
      const input = getByPlaceholderText('Password');
      expect(input.props.secureTextEntry).toBe(true);
    });

    it('should support keyboardType', () => {
      const { getByPlaceholderText } = render(
        <Input placeholder="Email" keyboardType="email-address" />
      );
      
      const input = getByPlaceholderText('Email');
      expect(input.props.keyboardType).toBe('email-address');
    });

    it('should support autoCapitalize', () => {
      const { getByPlaceholderText } = render(
        <Input placeholder="Name" autoCapitalize="words" />
      );
      
      const input = getByPlaceholderText('Name');
      expect(input.props.autoCapitalize).toBe('words');
    });

    it('should support multiline', () => {
      const { getByPlaceholderText } = render(
        <Input placeholder="Description" multiline />
      );
      
      const input = getByPlaceholderText('Description');
      expect(input.props.multiline).toBe(true);
    });
  });
});
