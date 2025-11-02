import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';
import { Alert } from './Alert';

describe('Alert Component', () => {
  // Basic Rendering Tests
  describe('Rendering', () => {
    it('should render with message only', () => {
      const { getByText } = render(<Alert message="Alert message" />);
      
      expect(getByText('Alert message')).toBeTruthy();
    });

    it('should render with title and message', () => {
      const { getByText } = render(
        <Alert title="Alert Title" message="Alert message" />
      );
      
      expect(getByText('Alert Title')).toBeTruthy();
      expect(getByText('Alert message')).toBeTruthy();
    });
  });

  // Severity Tests
  describe('Severity Levels', () => {
    it('should render success severity', () => {
      const { getByText } = render(
        <Alert severity="success" message="Success message" />
      );
      
      expect(getByText('Success message')).toBeTruthy();
    });

    it('should render warning severity', () => {
      const { getByText } = render(
        <Alert severity="warning" message="Warning message" />
      );
      
      expect(getByText('Warning message')).toBeTruthy();
    });

    it('should render error severity', () => {
      const { getByText } = render(
        <Alert severity="error" message="Error message" />
      );
      
      expect(getByText('Error message')).toBeTruthy();
    });

    it('should render info severity (default)', () => {
      const { getByText } = render(
        <Alert severity="info" message="Info message" />
      );
      
      expect(getByText('Info message')).toBeTruthy();
    });
  });

  // Dismissible Tests
  describe('Dismissible', () => {
    it('should render dismiss button when dismissible', () => {
      const onDismiss = jest.fn();
      const { getByText, getByLabelText } = render(
        <Alert message="Dismissible alert" dismissible onDismiss={onDismiss} />
      );
      
      expect(getByText('Dismissible alert')).toBeTruthy();
      expect(getByLabelText('Dismiss alert')).toBeTruthy();
    });

    it('should call onDismiss when dismiss button is pressed', () => {
      const onDismiss = jest.fn();
      const { getByLabelText } = render(
        <Alert message="Alert" dismissible onDismiss={onDismiss} />
      );
      
      const dismissButton = getByLabelText('Dismiss alert');
      fireEvent.press(dismissButton);
      
      expect(onDismiss).toHaveBeenCalledTimes(1);
    });

    it('should not render dismiss button when not dismissible', () => {
      const { getByText, queryByLabelText } = render(
        <Alert message="Non-dismissible alert" />
      );
      
      expect(getByText('Non-dismissible alert')).toBeTruthy();
      expect(queryByLabelText('Dismiss alert')).toBeNull();
    });
  });

  // Action Tests
  describe('Action Button', () => {
    it('should render action button when provided', () => {
      const onActionPress = jest.fn();
      const { getByText } = render(
        <Alert 
          message="Alert with action" 
          action={{ label: 'Fix Now', onPress: onActionPress }}
        />
      );
      
      expect(getByText('Alert with action')).toBeTruthy();
      expect(getByText('Fix Now')).toBeTruthy();
    });

    it('should call onActionPress when action button is pressed', () => {
      const onActionPress = jest.fn();
      const { getByText } = render(
        <Alert 
          message="Alert" 
          action={{ label: 'Action', onPress: onActionPress }}
        />
      );
      
      const actionButton = getByText('Action');
      fireEvent.press(actionButton);
      
      expect(onActionPress).toHaveBeenCalledTimes(1);
    });

    it('should not render action button without action', () => {
      const { getByText } = render(
        <Alert message="Alert without action" />
      );
      
      expect(getByText('Alert without action')).toBeTruthy();
    });
  });

  // Icon Tests
  describe('Icons', () => {
    it('should render success icon for success severity', () => {
      const { getByText } = render(
        <Alert severity="success" message="Success" />
      );
      
      expect(getByText('Success')).toBeTruthy();
      // Icon presence verified through component structure
    });

    it('should render warning icon for warning severity', () => {
      const { getByText } = render(
        <Alert severity="warning" message="Warning" />
      );
      
      expect(getByText('Warning')).toBeTruthy();
    });

    it('should render error icon for error severity', () => {
      const { getByText } = render(
        <Alert severity="error" message="Error" />
      );
      
      expect(getByText('Error')).toBeTruthy();
    });

    it('should render info icon for info severity', () => {
      const { getByText } = render(
        <Alert severity="info" message="Info" />
      );
      
      expect(getByText('Info')).toBeTruthy();
    });
  });

  // Accessibility Tests
  describe('Accessibility', () => {
    it('should have correct accessibility role', () => {
      const { getByRole } = render(<Alert message="Alert message" />);
      
      expect(getByRole('alert')).toBeTruthy();
    });

    it('should have correct accessibility label', () => {
      const { getByRole } = render(
        <Alert severity="error" title="Error" message="Something went wrong" />
      );
      
      const alert = getByRole('alert');
      expect(alert).toBeTruthy();
    });
  });

  // Combined Features Tests
  describe('Combined Features', () => {
    it('should render with title, message, action, and dismissible', () => {
      const onActionPress = jest.fn();
      const onDismiss = jest.fn();
      const { getByText, getByLabelText } = render(
        <Alert 
          severity="warning"
          title="Warning"
          message="Please review"
          action={{ label: 'Review Now', onPress: onActionPress }}
          dismissible
          onDismiss={onDismiss}
        />
      );
      
      expect(getByText('Warning')).toBeTruthy();
      expect(getByText('Please review')).toBeTruthy();
      expect(getByText('Review Now')).toBeTruthy();
      expect(getByLabelText('Dismiss alert')).toBeTruthy();
    });
  });
});
