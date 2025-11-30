# Developer Guide - Cost Graph Feature

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Setting Up Development](#setting-up-development)
3. [Adding New Features](#adding-new-features)
4. [Customizing Charts](#customizing-charts)
5. [Extending Data Types](#extending-data-types)
6. [Testing](#testing)
7. [Performance Optimization](#performance-optimization)
8. [Troubleshooting](#troubleshooting)

---

## Architecture Overview

### File Structure

```
vehicles-management-wawezz/
├── app/(tabs)/analytics/
│   └── costs.tsx                      # Main screen
├── components/analytics/
│   ├── charts/
│   │   ├── ChartLegend.tsx           # Reusable legend
│   │   ├── CostLineChart.tsx         # Line chart
│   │   ├── CostBarChart.tsx          # Bar chart
│   │   ├── CostStackedBarChart.tsx   # Stacked bars
│   │   ├── CostAreaChart.tsx         # Area chart
│   │   ├── CostPieChart.tsx          # Pie chart
│   │   └── index.ts                  # Barrel export
│   ├── PeriodSelector.tsx            # Enhanced with custom range
│   └── DateRangePicker.tsx           # Custom date selection
├── hooks/
│   └── useAnalytics.ts               # useCostChartData hook
├── lib/analytics/
│   └── chart-helpers.ts              # Data transformation
├── types/
│   ├── analytics.ts                  # Chart types
│   └── charts.ts                     # Victory types
└── docs/graph/                        # Documentation
```

---

## Setting Up Development

### Prerequisites

```bash
# Ensure dependencies are installed
npm install

# Key dependencies:
# - victory-native: Chart library
# - react-native-svg: Required for victory
# - react-native-ui-datepicker: Date picker
# - dayjs: Date manipulation
```

### Running the App

```bash
# Start the development server
npm start

# Run on iOS
npm run ios

# Run on Android
npm run android

# Run on web
npm run web
```

### Development Tools

```bash
# Type checking
npm run typecheck

# Linting
npm run lint

# Format code
npm run prettier
```

---

## Adding New Features

### 1. Adding a New Chart Type

**Step 1: Create the Component**

```typescript
// components/analytics/charts/CostScatterChart.tsx
import React from "react";
import { VictoryChart, VictoryScatter } from "victory-native";
import { CostChartDataPoint } from "../../../types/analytics";

interface CostScatterChartProps {
  data: CostChartDataPoint[];
  title: string;
}

export function CostScatterChart({ data, title }: CostScatterChartProps) {
  // Transform data
  const scatterData = data.map(d => ({
    x: d.timestamp,
    y: d.totalCost,
  }));

  return (
    <View>
      <Text>{title}</Text>
      <VictoryChart>
        <VictoryScatter data={scatterData} />
      </VictoryChart>
    </View>
  );
}
```

**Step 2: Export from Index**

```typescript
// components/analytics/charts/index.ts
export { CostScatterChart } from "./CostScatterChart";
```

**Step 3: Use in Screen**

```typescript
// app/(tabs)/analytics/costs.tsx
import { CostScatterChart } from "@/components/analytics/charts";

// In the render:
<CostScatterChart
  data={chartDataset.data}
  title="Cost Distribution"
/>
```

### 2. Adding a New Grouping Type

**Step 1: Update Type**

```typescript
// types/analytics.ts
export type ChartGrouping = "day" | "week" | "month" | "quarter";
```

**Step 2: Update Grouping Logic**

```typescript
// lib/analytics/chart-helpers.ts
export function determineOptimalGrouping(
  startDate: Date,
  endDate: Date,
): ChartGrouping {
  const diffInDays = Math.ceil(
    (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (diffInDays < 14) return "day";
  else if (diffInDays <= 90) return "week";
  else if (diffInDays <= 365) return "month";
  else return "quarter"; // New!
}
```

**Step 3: Update Label Formatting**

```typescript
// lib/analytics/chart-helpers.ts
export function formatChartLabel(date: Date, grouping: ChartGrouping): string {
  const months = ["Jan", "Feb", "Mar", ...];

  switch (grouping) {
    case "day":
      return `${months[date.getMonth()]} ${date.getDate()}`;
    case "week":
      return `W${getWeekNumber(date)}`;
    case "month":
      return `${months[date.getMonth()]} ${date.getFullYear().toString().slice(-2)}`;
    case "quarter":
      const quarter = Math.floor(date.getMonth() / 3) + 1;
      return `Q${quarter} ${date.getFullYear().toString().slice(-2)}`;
  }
}
```

**Step 4: Update Period Start Logic**

```typescript
// lib/analytics/chart-helpers.ts
function getGroupStartDate(date: Date, grouping: ChartGrouping): Date {
  const d = new Date(date);

  switch (grouping) {
    // ... existing cases
    case "quarter":
      const quarter = Math.floor(d.getMonth() / 3);
      d.setMonth(quarter * 3);
      d.setDate(1);
      d.setHours(0, 0, 0, 0);
      return d;
  }
}

function getNextPeriod(date: Date, grouping: ChartGrouping): Date {
  const next = new Date(date);

  switch (grouping) {
    // ... existing cases
    case "quarter":
      next.setMonth(next.getMonth() + 3);
      break;
  }

  return next;
}
```

### 3. Adding a New Metric

**Step 1: Update ChartDataset Type**

```typescript
// types/analytics.ts
export interface ChartDataset {
  data: CostChartDataPoint[];
  grouping: ChartGrouping;
  dateRange: { start: Date; end: Date };
  summary: {
    totalFuelCost: number;
    totalServiceCost: number;
    totalCost: number;
    averageDailyCost: number;
    medianCost: number; // New!
  };
}
```

**Step 2: Calculate the Metric**

```typescript
// lib/analytics/chart-helpers.ts
export function generateCostChartData(
  fuelLogs: FuelLog[],
  serviceLogs: ServiceLog[],
  period: AnalyticsPeriod,
): ChartDataset {
  // ... existing code

  // Calculate median
  const sortedCosts = data
    .map((d) => d.totalCost)
    .filter((c) => c > 0)
    .sort((a, b) => a - b);

  const medianCost =
    sortedCosts.length > 0
      ? sortedCosts[Math.floor(sortedCosts.length / 2)]
      : 0;

  return {
    data,
    grouping,
    dateRange: { start: startDate, end: endDate },
    summary: {
      totalFuelCost,
      totalServiceCost,
      totalCost,
      averageDailyCost,
      medianCost, // Include new metric
    },
  };
}
```

**Step 3: Display in UI**

```typescript
// app/(tabs)/analytics/costs.tsx
<MetricCard
  title="Median Cost"
  value={`RM${chartDataset?.summary.medianCost.toFixed(2) || "0.00"}`}
  subtitle="typical cost"
  icon="stats-chart-outline"
  color={theme.colors.analytics.neutral}
/>
```

---

## Customizing Charts

### Changing Colors

**Method 1: Theme-based (Recommended)**

```typescript
// unistyles.ts
analytics: {
  fuel: "#10B981",
  service: "#517c89",
  cost: "#F59E0B",
  custom: "#FF6B6B", // Add new color
}
```

**Method 2: Component-level**

```typescript
// In chart component
<VictoryLine
  data={data}
  style={{
    data: {
      stroke: customColor || theme.colors.analytics.fuel,
      strokeWidth: 3,
    },
  }}
/>
```

### Adjusting Chart Dimensions

```typescript
// Make chart responsive
const screenWidth = Dimensions.get("window").width;
const chartWidth = screenWidth - 32; // Account for padding
const chartHeight = height || 250;

<VictoryChart
  width={chartWidth}
  height={chartHeight}
  padding={{ top: 20, bottom: 50, left: 50, right: 20 }}
>
```

### Custom Tooltips

```typescript
<VictoryVoronoiContainer
  labels={({ datum }) => `RM${datum.y.toFixed(2)}\n${datum.x}`}
  labelComponent={
    <VictoryTooltip
      cornerRadius={8}
      flyoutPadding={12}
      style={{
        fill: theme.colors.text,
        fontSize: 14,
        fontWeight: "bold",
      }}
      flyoutStyle={{
        fill: theme.colors.surface,
        stroke: theme.colors.primary,
        strokeWidth: 2,
      }}
    />
  }
/>
```

### Custom Legends

```typescript
const customLegendItems: LegendItem[] = [
  { name: "Total", color: "#F59E0B", value: `RM${total}` },
  { name: "Fuel", color: "#10B981", value: `RM${fuel}` },
  { name: "Service", color: "#517c89", value: `RM${service}` },
  { name: "Other", color: "#8B5CF6", value: `RM${other}` },
];

<ChartLegend items={customLegendItems} orientation="vertical" />
```

---

## Extending Data Types

### Adding Fields to CostChartDataPoint

```typescript
// types/analytics.ts
export interface CostChartDataPoint {
  date: string;
  timestamp: number;
  fuelCost: number;
  serviceCost: number;
  totalCost: number;
  label: string;
  grouping: ChartGrouping;
  // New fields:
  vehicleCount?: number;
  distance?: number;
  efficiency?: number;
}
```

### Updating Transformation Functions

```typescript
// lib/analytics/chart-helpers.ts
export function groupByPeriod(
  fuelLogs: FuelLog[],
  serviceLogs: ServiceLog[],
  startDate: Date,
  endDate: Date,
  grouping: ChartGrouping,
): CostChartDataPoint[] {
  // ... existing grouping logic

  // Add new calculations
  const vehicleSet = new Set();
  fuelLogs.forEach((log) => vehicleSet.add(log.vehicle_id));
  serviceLogs.forEach((log) => vehicleSet.add(log.vehicle_id));

  const point: CostChartDataPoint = {
    // ... existing fields
    vehicleCount: vehicleSet.size,
    distance: calculateDistance(logs),
    efficiency: fuelCost / distance,
  };

  return point;
}
```

---

## Testing

### Unit Tests

```typescript
// __tests__/lib/analytics/chart-helpers.test.ts
import {
  determineOptimalGrouping,
  formatChartLabel,
  groupByPeriod,
} from "@/lib/analytics/chart-helpers";

describe("chart-helpers", () => {
  describe("determineOptimalGrouping", () => {
    it("returns 'day' for ranges < 14 days", () => {
      const start = new Date("2025-01-01");
      const end = new Date("2025-01-10");
      expect(determineOptimalGrouping(start, end)).toBe("day");
    });

    it("returns 'week' for ranges 14-90 days", () => {
      const start = new Date("2025-01-01");
      const end = new Date("2025-02-15");
      expect(determineOptimalGrouping(start, end)).toBe("week");
    });

    it("returns 'month' for ranges > 90 days", () => {
      const start = new Date("2025-01-01");
      const end = new Date("2025-06-01");
      expect(determineOptimalGrouping(start, end)).toBe("month");
    });
  });

  describe("formatChartLabel", () => {
    it("formats day labels correctly", () => {
      const date = new Date("2025-01-15");
      expect(formatChartLabel(date, "day")).toBe("Jan 15");
    });

    it("formats week labels correctly", () => {
      const date = new Date("2025-01-15");
      expect(formatChartLabel(date, "week")).toMatch(/^W\d+$/);
    });
  });

  describe("groupByPeriod", () => {
    it("groups logs by day correctly", () => {
      const fuelLogs = [
        { date: "2025-01-01", cost: 100, ... },
        { date: "2025-01-01", cost: 50, ... },
        { date: "2025-01-02", cost: 75, ... },
      ];

      const result = groupByPeriod(
        fuelLogs,
        [],
        new Date("2025-01-01"),
        new Date("2025-01-02"),
        "day"
      );

      expect(result).toHaveLength(2);
      expect(result[0].fuelCost).toBe(150);
      expect(result[1].fuelCost).toBe(75);
    });
  });
});
```

### Component Tests

```typescript
// __tests__/components/analytics/charts/CostLineChart.test.tsx
import React from "react";
import { render } from "@testing-library/react-native";
import { CostLineChart } from "@/components/analytics/charts";

describe("CostLineChart", () => {
  it("renders correctly with data", () => {
    const mockData = [
      { date: "2025-01-01", fuelCost: 100, serviceCost: 50, totalCost: 150, label: "Jan 1", ... },
    ];

    const { getByText } = render(
      <CostLineChart data={mockData} title="Test Chart" />
    );

    expect(getByText("Test Chart")).toBeTruthy();
  });

  it("shows empty state when no data", () => {
    const { getByText } = render(
      <CostLineChart data={[]} title="Test Chart" />
    );

    expect(getByText("No data available")).toBeTruthy();
  });
});
```

### Integration Tests

```typescript
// __tests__/hooks/useAnalytics.test.ts
import { renderHook, waitFor } from "@testing-library/react-hooks";
import { useCostChartData } from "@/hooks/useAnalytics";

jest.mock("@/lib/supabase/analytics-queries");

describe("useCostChartData", () => {
  it("fetches and transforms data correctly", async () => {
    const { result } = renderHook(() =>
      useCostChartData({
        period: {
          label: "30 Days",
          days: 30,
          startDate: new Date(),
          endDate: new Date(),
        },
        vehicleIds: [],
      }),
    );

    await waitFor(() => !result.current.loading);

    expect(result.current.chartDataset).toBeDefined();
    expect(result.current.error).toBeNull();
  });
});
```

---

## Performance Optimization

### 1. Memoization

```typescript
// Memoize expensive calculations
const chartData = useMemo(() => {
  if (!chartDataset) return [];
  return transformToVictoryData(chartDataset.data, "total");
}, [chartDataset]);

// Memoize filters
const filters = useMemo(
  () => ({
    period: activePeriod,
    vehicleIds: selectedVehicleIds,
  }),
  [activePeriod, selectedVehicleIds],
);
```

### 2. Lazy Loading

```typescript
// Only render charts when data is available
{chartDataset && chartDataset.data.length > 0 && (
  <>
    <CostLineChart data={chartDataset.data} ... />
    <CostBarChart data={chartDataset.data} ... />
  </>
)}
```

### 3. Debouncing

```typescript
// Debounce filter changes
import { debounce } from "lodash";

const debouncedRefetch = useMemo(() => debounce(refetch, 300), [refetch]);

useEffect(() => {
  debouncedRefetch();
  return () => debouncedRefetch.cancel();
}, [filters]);
```

### 4. Pagination for Large Datasets

```typescript
// Limit initial data points
const INITIAL_LIMIT = 50;

const [displayLimit, setDisplayLimit] = useState(INITIAL_LIMIT);

const displayData = useMemo(() => {
  return chartDataset?.data.slice(0, displayLimit) || [];
}, [chartDataset, displayLimit]);

// Load more button
<Button onPress={() => setDisplayLimit(prev => prev + 50)}>
  Load More
</Button>
```

---

## Troubleshooting

### Common Issues

#### Chart Not Rendering

```typescript
// Check data format
console.log("Chart data:", chartDataset?.data);

// Ensure Victory Native is properly installed
import { VictoryChart } from "victory-native";
```

#### Type Errors

```typescript
// Ensure types are imported correctly
import type { CostChartDataPoint } from "@/types/analytics";

// Run type checking
npm run typecheck
```

#### Performance Issues

```typescript
// Check data size
console.log("Data points:", chartDataset?.data.length);

// Reduce date range if too many points
// Or increase grouping threshold
```

#### Date Picker Not Working

```typescript
// Ensure dayjs is installed
import dayjs from "dayjs";

// Check date initialization
const [startDate, setStartDate] = useState(dayjs());
```

---

## Best Practices

1. **Follow Existing Patterns**: Maintain consistency with existing chart components
2. **Type Safety**: Always use TypeScript types, avoid `any`
3. **Error Handling**: Wrap API calls in try-catch, show error states
4. **Loading States**: Always show loading indicators
5. **Empty States**: Provide helpful empty state messages
6. **Accessibility**: Use semantic components, support screen readers
7. **Theme Integration**: Use theme colors, support dark mode
8. **Documentation**: Update docs when adding features
9. **Testing**: Write tests for new functions and components
10. **Performance**: Profile and optimize rendering

---

**Last Updated**: 2025-01-30
