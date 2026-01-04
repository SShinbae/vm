# Demo Mode Documentation

This directory contains all the implementation for the demo mode feature, which allows users to explore the app with sample data on the web platform.

## Overview

Demo mode provides a fully functional preview of the app using hardcoded mock data. Users can:

- Browse demo vehicles, fuel logs, and service records
- View analytics and cost summaries
- Navigate through all major features
- Experience the UI/UX without creating an account

**Important**: Changes made in demo mode are not persisted. This is intentional to provide a safe sandbox environment.

## Architecture

### Files Structure

```
lib/demo/
├── README.md              # This file
├── mockData.ts            # All hardcoded demo data
├── demoServices.ts        # Mock service implementations
├── useDemoService.ts      # Hook to switch between demo/real services
└── DemoContext.tsx        # Demo mode state management

app/demo/
├── _layout.tsx            # Demo routes layout with banner
├── login.tsx              # Demo login page
├── dashboard.tsx          # Demo dashboard
├── vehicles.tsx           # Demo vehicles list
├── analytics.tsx          # Demo analytics
└── profile.tsx            # Demo profile
```

### Components

#### 1. Mock Data (`mockData.ts`)

Contains all the hardcoded data used in demo mode:

- **DEMO_USER**: Sample user profile
- **DEMO_VEHICLES**: 3 sample vehicles (Toyota Camry, Honda Civic, Tesla Model 3)
- **DEMO_FUEL_LOGS**: 6 fuel entries across vehicles
- **DEMO_SERVICE_LOGS**: 6 service records
- **DEMO_MILEAGE_LOGS**: 4 mileage entries
- **DEMO_GROUPS**: 2 sample groups
- **DEMO_DASHBOARD_STATS**: Calculated statistics
- **DEMO_NOTIFICATIONS**: Sample notifications

#### 2. Demo Services (`demoServices.ts`)

Mock implementations of all service methods that return demo data instead of making API calls:

- `demoVehicleService` - Vehicle CRUD operations
- `demoLoggingService` - Fuel, service, and mileage logs
- `demoAnalyticsService` - Statistics and analytics
- `demoGroupService` - Group management
- `demoAuthService` - Authentication
- `demoNotificationService` - Notifications

All methods simulate API delays (500ms) for realistic UX.

#### 3. Demo Context (`DemoContext.tsx`)

Manages demo mode state across the app:

- `isDemoMode` - Boolean flag for demo state
- `enableDemoMode()` - Enable demo mode
- `disableDemoMode()` - Disable demo mode
- `toggleDemoMode()` - Toggle demo state

State is persisted in AsyncStorage/localStorage.

#### 4. Demo Service Hook (`useDemoService.ts`)

Provides hooks to conditionally use demo or real services:

```typescript
const { isDemoMode, vehicleService } = useDemoService();
```

## Usage

### Accessing Demo Mode

1. **From Login Page**: Click "🎭 Try Demo Mode" link
2. **Direct URL**: Navigate to `/demo/login` (web only)

### Routes

All demo routes are under the `/demo` path:

- `/demo/login` - Demo login page (accepts any credentials)
- `/demo/dashboard` - Main demo dashboard
- `/demo/vehicles` - Vehicles list
- `/demo/analytics` - Analytics and statistics
- `/demo/profile` - User profile

### Using Demo Services in Components

```typescript
import { useDemoMode } from "@/lib/contexts/DemoContext";
import { demoVehicleService } from "@/lib/demo/demoServices";
import { vehicleService } from "@/lib/services/vehicleService";

function MyComponent() {
  const { isDemoMode } = useDemoMode();

  const loadVehicles = async () => {
    if (isDemoMode) {
      const { data } = await demoVehicleService.getVehicles();
      return data;
    } else {
      return await vehicleService.getVehicles();
    }
  };
}
```

Or use the helper hook:

```typescript
import { useDemoService } from "@/lib/demo/useDemoService";

function MyComponent() {
  const { isDemoMode, vehicleService } = useDemoService();

  const loadVehicles = async () => {
    if (vehicleService) {
      const { data } = await vehicleService.getVehicles();
      return data;
    }
    // Fall back to real service
  };
}
```

## Features

### Demo Banner

A persistent banner appears at the top of all demo pages indicating demo mode is active.

### No Persistence

- All "create", "update", and "delete" operations return success but don't persist
- Data resets to initial state on page refresh
- Users see a notice that changes won't be saved

### Realistic Delays

All demo service methods include a 500ms delay to simulate network requests for realistic UX.

### Exit Demo Mode

Users can exit demo mode from:

- Profile page "Exit Demo Mode" button
- Any page with "Exit Demo" link
- All exits redirect to the login page and disable demo mode

## Adding New Demo Data

To add new demo data:

1. **Add to `mockData.ts`**:

```typescript
export const DEMO_NEW_FEATURE = [
  {
    id: "demo-feature-001",
    name: "Sample Feature",
    // ... other fields
  },
];
```

2. **Create demo service method in `demoServices.ts`**:

```typescript
export const demoNewFeatureService = {
  async getFeatures(): Promise<ApiResponse<any[]>> {
    await simulateDelay();
    return {
      data: [...DEMO_NEW_FEATURE],
      error: null,
    };
  },
};
```

3. **Add to `useDemoService.ts`** if needed:

```typescript
export function useDemoService() {
  const { isDemoMode } = useDemoMode();

  return {
    isDemoMode,
    // ... existing services
    newFeatureService: isDemoMode ? demoNewFeatureService : null,
  };
}
```

## Platform Availability

Demo mode is **web-only** by design:

- Mobile apps redirect to regular authentication
- Demo routes are accessible but demo banner only shows on web
- Use `Platform.OS === 'web'` checks where needed

## Best Practices

1. **Always show demo indicator**: Ensure users know they're in demo mode
2. **Disable destructive actions**: Prevent confusion by clearly marking demo-only features
3. **Provide exit path**: Always give users a way to exit demo mode
4. **Keep data realistic**: Use realistic sample data that represents actual usage
5. **Maintain consistency**: Ensure demo data relationships are consistent (e.g., fuel logs reference valid vehicles)

## Limitations

- Demo mode is intended for web preview only
- No real authentication or authorization
- No data persistence
- No server-side operations
- Limited to predefined demo data
- Cannot test features requiring real-time external integrations (push notifications, etc.)

## Future Enhancements

Potential improvements:

- [ ] Add more demo vehicles and data variety
- [ ] Implement temporary localStorage persistence within demo session
- [ ] Add guided tour/onboarding for demo mode
- [ ] Create demo scenarios (e.g., "Fleet Manager", "Individual User")
- [ ] Add ability to reset demo data to initial state
- [ ] Implement demo-specific analytics tracking

## Troubleshooting

### Demo mode not activating

- Check that `DemoProvider` is in the provider tree in `app/_layout.tsx`
- Verify AsyncStorage permissions
- Check browser console for errors

### Demo data not showing

- Ensure demo services are being called (check Network tab)
- Verify `isDemoMode` is true in components
- Check that demo routes are properly registered

### Exit demo not working

- Verify `disableDemoMode()` is being called
- Check that navigation to login page succeeds
- Clear browser localStorage/AsyncStorage if stuck

## Support

For issues or questions about demo mode:

1. Check this README
2. Review the code in `lib/demo/` and `app/demo/`
3. Check browser console for errors
4. Verify demo mode state in React DevTools
