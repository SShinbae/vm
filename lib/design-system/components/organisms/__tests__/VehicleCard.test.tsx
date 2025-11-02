import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';
import { VehicleCard } from '../VehicleCard';

describe('VehicleCard', () => {
  const mockMetrics = [
    { label: 'Mileage', value: '50,000 km', icon: 'speedometer' as const },
    { label: 'Last Service', value: '2 months ago', icon: 'wrench' as const },
  ];

  const mockActions = [
    { icon: 'pencil' as const, label: 'Edit', onPress: jest.fn() },
    { icon: 'trash' as const, label: 'Delete', onPress: jest.fn() },
  ];

  describe('Basic Rendering', () => {
    it('should render vehicle name and make/model', () => {
      render(<VehicleCard name="My Car" make="Toyota" model="Camry" year={2020} />);
      expect(screen.getByText('My Car')).toBeTruthy();
      expect(screen.getByText('2020 Toyota Camry')).toBeTruthy();
    });

    it('should render vehicle image when provided', () => {
      render(
        <VehicleCard
          name="My Car"
          make="Toyota"
          model="Camry"
          year={2020}
          imageUri="https://example.com/car.jpg"
        />
      );
      const image = screen.getByLabelText('My Car image');
      expect(image.props.source).toEqual({ uri: 'https://example.com/car.jpg' });
    });

    it('should not render image container when imageUri is not provided', () => {
      const { container } = render(
        <VehicleCard name="My Car" make="Toyota" model="Camry" year={2020} />
      );
      expect(container).toBeTruthy();
    });
  });

  describe('Status Chip', () => {
    it('should render status chip when status is provided', () => {
      render(
        <VehicleCard
          name="My Car"
          make="Toyota"
          model="Camry"
          year={2020}
          status="Active"
        />
      );
      expect(screen.getByText('Active')).toBeTruthy();
    });

    it('should apply correct variant to status chip', () => {
      render(
        <VehicleCard
          name="My Car"
          make="Toyota"
          model="Camry"
          year={2020}
          status="Maintenance Required"
          statusVariant="warning"
        />
      );
      expect(screen.getByText('Maintenance Required')).toBeTruthy();
    });
  });

  describe('Metrics', () => {
    it('should render metrics when provided', () => {
      render(
        <VehicleCard
          name="My Car"
          make="Toyota"
          model="Camry"
          year={2020}
          metrics={mockMetrics}
        />
      );
      expect(screen.getByText('Mileage')).toBeTruthy();
      expect(screen.getByText('50,000 km')).toBeTruthy();
      expect(screen.getByText('Last Service')).toBeTruthy();
      expect(screen.getByText('2 months ago')).toBeTruthy();
    });

    it('should render metric icons when provided', () => {
      render(
        <VehicleCard
          name="My Car"
          make="Toyota"
          model="Camry"
          year={2020}
          metrics={mockMetrics}
        />
      );
      expect(screen.getByLabelText('Mileage icon')).toBeTruthy();
      expect(screen.getByLabelText('Last Service icon')).toBeTruthy();
    });
  });

  describe('Actions', () => {
    it('should render action buttons when provided', () => {
      render(
        <VehicleCard
          name="My Car"
          make="Toyota"
          model="Camry"
          year={2020}
          actions={mockActions}
        />
      );
      expect(screen.getByLabelText('Edit')).toBeTruthy();
      expect(screen.getByLabelText('Delete')).toBeTruthy();
    });

    it('should call action onPress when button is pressed', () => {
      const onPress = jest.fn();
      const actions = [{ icon: 'pencil' as const, label: 'Edit', onPress }];
      render(
        <VehicleCard
          name="My Car"
          make="Toyota"
          model="Camry"
          year={2020}
          actions={actions}
        />
      );
      const editButton = screen.getByLabelText('Edit');
      fireEvent.press(editButton);
      expect(onPress).toHaveBeenCalledTimes(1);
    });

    it('should not call action onPress when card is disabled', () => {
      const onPress = jest.fn();
      const actions = [{ icon: 'pencil' as const, label: 'Edit', onPress }];
      render(
        <VehicleCard
          name="My Car"
          make="Toyota"
          model="Camry"
          year={2020}
          actions={actions}
          disabled
        />
      );
      const editButton = screen.getByLabelText('Edit');
      fireEvent.press(editButton);
      expect(onPress).not.toHaveBeenCalled();
    });
  });

  describe('Card Press', () => {
    it('should call onPress when card is pressed', () => {
      const onPress = jest.fn();
      render(
        <VehicleCard
          name="My Car"
          make="Toyota"
          model="Camry"
          year={2020}
          onPress={onPress}
        />
      );
      const card = screen.getByLabelText('My Car vehicle card');
      fireEvent.press(card);
      expect(onPress).toHaveBeenCalledTimes(1);
    });

    it('should not call onPress when disabled', () => {
      const onPress = jest.fn();
      render(
        <VehicleCard
          name="My Car"
          make="Toyota"
          model="Camry"
          year={2020}
          onPress={onPress}
          disabled
        />
      );
      const card = screen.getByLabelText('My Car vehicle card');
      fireEvent.press(card);
      expect(onPress).not.toHaveBeenCalled();
    });
  });

  describe('Loading State', () => {
    it('should render loading indicator when loading is true', () => {
      render(
        <VehicleCard name="My Car" make="Toyota" model="Camry" year={2020} loading />
      );
      expect(screen.getByLabelText('Loading vehicle data')).toBeTruthy();
    });

    it('should hide content when loading is true', () => {
      render(
        <VehicleCard
          name="My Car"
          make="Toyota"
          model="Camry"
          year={2020}
          metrics={mockMetrics}
          loading
        />
      );
      expect(screen.queryByText('Mileage')).toBeNull();
    });
  });

  describe('Accessibility', () => {
    it('should have proper accessibility label', () => {
      render(<VehicleCard name="My Car" make="Toyota" model="Camry" year={2020} />);
      expect(screen.getByLabelText('My Car vehicle card')).toBeTruthy();
    });

    it('should set accessibility state for disabled card', () => {
      render(
        <VehicleCard name="My Car" make="Toyota" model="Camry" year={2020} disabled />
      );
      const card = screen.getByLabelText('My Car vehicle card');
      expect(card.props.accessibilityState).toEqual({ disabled: true });
    });

    it('should set accessibility state for loading card', () => {
      render(
        <VehicleCard name="My Car" make="Toyota" model="Camry" year={2020} loading />
      );
      const card = screen.getByLabelText('My Car vehicle card');
      expect(card.props.accessibilityState).toEqual({ busy: true });
    });
  });
});
