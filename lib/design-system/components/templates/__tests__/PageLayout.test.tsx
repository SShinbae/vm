import { render, screen } from '@testing-library/react-native';
import React from 'react';
import { Text } from '../../atoms/Text';
import { PageLayout } from '../PageLayout';

// Mock dependencies
jest.mock('expo-router', () => ({
  router: {
    back: jest.fn(),
  },
}));

describe('PageLayout', () => {
  describe('Basic Rendering', () => {
    it('should render children', () => {
      render(
        <PageLayout>
          <Text>Page Content</Text>
        </PageLayout>
      );
      expect(screen.getByText('Page Content')).toBeTruthy();
    });

    it('should render with header', () => {
      render(
        <PageLayout header={{ title: 'Test Page' }}>
          <Text>Content</Text>
        </PageLayout>
      );
      expect(screen.getByText('Test Page')).toBeTruthy();
      expect(screen.getByText('Content')).toBeTruthy();
    });

    it('should render with footer', () => {
      render(
        <PageLayout footer={<Text>Footer Content</Text>}>
          <Text>Main Content</Text>
        </PageLayout>
      );
      expect(screen.getByText('Footer Content')).toBeTruthy();
    });
  });

  describe('Loading State', () => {
    it('should show loading indicator when loading', () => {
      render(
        <PageLayout loading>
          <Text>Content</Text>
        </PageLayout>
      );
      expect(screen.getByLabelText('Loading page')).toBeTruthy();
      expect(screen.getByText('Loading...')).toBeTruthy();
      expect(screen.queryByText('Content')).toBeNull();
    });

    it('should show header even when loading', () => {
      render(
        <PageLayout loading header={{ title: 'Page' }}>
          <Text>Content</Text>
        </PageLayout>
      );
      expect(screen.getByText('Page')).toBeTruthy();
    });
  });

  describe('Error State', () => {
    it('should show error message', () => {
      render(
        <PageLayout error="Something went wrong">
          <Text>Content</Text>
        </PageLayout>
      );
      expect(screen.getByText('Something went wrong')).toBeTruthy();
      expect(screen.queryByText('Content')).toBeNull();
    });

    it('should show retry button when onRetry provided', () => {
      const onRetry = jest.fn();
      render(
        <PageLayout error="Network error" onRetry={onRetry}>
          <Text>Content</Text>
        </PageLayout>
      );
      expect(screen.getByText('Try Again')).toBeTruthy();
    });
  });

  describe('Scroll Behavior', () => {
    it('should be scrollable by default', () => {
      render(
        <PageLayout>
          <Text>Content</Text>
        </PageLayout>
      );
      expect(screen.getByText('Content')).toBeTruthy();
    });

    it('should not be scrollable when scrollable is false', () => {
      render(
        <PageLayout scrollable={false}>
          <Text>Content</Text>
        </PageLayout>
      );
      expect(screen.getByText('Content')).toBeTruthy();
    });
  });

  describe('Accessibility', () => {
    it('should have proper loading accessibility', () => {
      render(
        <PageLayout loading>
          <Text>Content</Text>
        </PageLayout>
      );
      const loader = screen.getByLabelText('Loading page');
      expect(loader.props.accessibilityRole).toBe('progressbar');
    });

    it('should have proper error accessibility', () => {
      render(
        <PageLayout error="Error message">
          <Text>Content</Text>
        </PageLayout>
      );
      const errorContainer = screen.getByLabelText('Error loading page');
      expect(errorContainer.props.accessibilityRole).toBe('alert');
    });
  });
});
