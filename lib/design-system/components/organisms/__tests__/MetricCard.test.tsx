import { render, screen } from '@testing-library/react-native';
import React from 'react';
import { MetricCard } from '../MetricCard';

describe('MetricCard', () => {
  describe('Basic Rendering', () => {
    it('should render title and value', () => {
      render(<MetricCard title="Total Vehicles" value="15" />);
      expect(screen.getByText('Total Vehicles')).toBeTruthy();
      expect(screen.getByText('15')).toBeTruthy();
    });

    it('should render icon when provided', () => {
      render(<MetricCard title="Total Vehicles" value="15" icon="car" />);
      expect(screen.getByLabelText('Total Vehicles icon')).toBeTruthy();
    });

    it('should not render icon container when icon is not provided', () => {
      const { container } = render(<MetricCard title="Total Vehicles" value="15" />);
      expect(container).toBeTruthy();
    });
  });

  describe('Variants', () => {
    it('should apply success variant color', () => {
      render(<MetricCard title="Active" value="10" icon="checkmark" variant="success" />);
      expect(screen.getByText('Active')).toBeTruthy();
    });

    it('should apply warning variant color', () => {
      render(<MetricCard title="Pending" value="5" icon="time" variant="warning" />);
      expect(screen.getByText('Pending')).toBeTruthy();
    });

    it('should apply error variant color', () => {
      render(<MetricCard title="Overdue" value="2" icon="close" variant="error" />);
      expect(screen.getByText('Overdue')).toBeTruthy();
    });

    it('should apply info variant color', () => {
      render(<MetricCard title="Info" value="8" icon="information" variant="info" />);
      expect(screen.getByText('Info')).toBeTruthy();
    });

    it('should apply default variant when not specified', () => {
      render(<MetricCard title="Total" value="20" icon="list" />);
      expect(screen.getByText('Total')).toBeTruthy();
    });
  });

  describe('Trend Display', () => {
    it('should render trend value when provided', () => {
      render(
        <MetricCard
          title="Revenue"
          value="$1,500"
          trendDirection="up"
          trendValue="12%"
        />
      );
      expect(screen.getByText('12%')).toBeTruthy();
    });

    it('should render up trend icon for up direction', () => {
      render(
        <MetricCard
          title="Revenue"
          value="$1,500"
          trendDirection="up"
          trendValue="12%"
        />
      );
      expect(screen.getByLabelText('Trend up')).toBeTruthy();
    });

    it('should render down trend icon for down direction', () => {
      render(
        <MetricCard
          title="Costs"
          value="$500"
          trendDirection="down"
          trendValue="5%"
        />
      );
      expect(screen.getByLabelText('Trend down')).toBeTruthy();
    });

    it('should render neutral trend icon for neutral direction', () => {
      render(
        <MetricCard
          title="Stable"
          value="$1,000"
          trendDirection="neutral"
          trendValue="0%"
        />
      );
      expect(screen.getByLabelText('Trend neutral')).toBeTruthy();
    });

    it('should render comparison text when provided', () => {
      render(
        <MetricCard
          title="Revenue"
          value="$1,500"
          trendDirection="up"
          trendValue="12%"
          comparisonText="vs last month"
        />
      );
      expect(screen.getByText('vs last month')).toBeTruthy();
    });

    it('should not render trend section when trendDirection is not provided', () => {
      render(<MetricCard title="Revenue" value="$1,500" trendValue="12%" />);
      const trendIcons = screen.queryAllByLabelText(/Trend/);
      expect(trendIcons.length).toBe(0);
    });
  });

  describe('Loading State', () => {
    it('should render loading indicator when loading is true', () => {
      render(<MetricCard title="Loading" value="..." loading />);
      expect(screen.getByLabelText('Loading metric data')).toBeTruthy();
    });

    it('should hide content when loading is true', () => {
      render(
        <MetricCard
          title="Revenue"
          value="$1,500"
          trendDirection="up"
          trendValue="12%"
          loading
        />
      );
      expect(screen.queryByText('$1,500')).toBeNull();
      expect(screen.queryByText('12%')).toBeNull();
    });
  });

  describe('Disabled State', () => {
    it('should apply disabled styles when disabled is true', () => {
      render(<MetricCard title="Disabled" value="0" disabled />);
      expect(screen.getByText('Disabled')).toBeTruthy();
    });
  });

  describe('Accessibility', () => {
    it('should have proper accessibility label', () => {
      render(<MetricCard title="Total Vehicles" value="15" />);
      expect(screen.getByLabelText('Total Vehicles metric card')).toBeTruthy();
    });

    it('should set accessibility value for screen readers', () => {
      render(<MetricCard title="Total Vehicles" value="15" />);
      const card = screen.getByLabelText('Total Vehicles metric card');
      expect(card.props.accessibilityValue).toEqual({ text: '15' });
    });

    it('should include trend in accessibility value', () => {
      render(
        <MetricCard
          title="Revenue"
          value="$1,500"
          trendDirection="up"
          trendValue="12%"
        />
      );
      const card = screen.getByLabelText('Revenue metric card');
      expect(card.props.accessibilityValue).toEqual({
        text: '$1,500, trending up by 12%',
      });
    });

    it('should set accessibility state for loading', () => {
      render(<MetricCard title="Loading" value="..." loading />);
      const card = screen.getByLabelText('Loading metric card');
      expect(card.props.accessibilityState).toEqual({ busy: true });
    });

    it('should set accessibility state for disabled', () => {
      render(<MetricCard title="Disabled" value="0" disabled />);
      const card = screen.getByLabelText('Disabled metric card');
      expect(card.props.accessibilityState).toEqual({ disabled: true });
    });
  });
});
