# Chart Examples - Cost Graph Feature

This document provides visual and code examples for each chart type in the Cost Graph feature.

## Table of Contents

1. [Line Chart Examples](#line-chart-examples)
2. [Bar Chart Examples](#bar-chart-examples)
3. [Stacked Bar Chart Examples](#stacked-bar-chart-examples)
4. [Area Chart Examples](#area-chart-examples)
5. [Pie Chart Examples](#pie-chart-examples)
6. [Custom Configurations](#custom-configurations)

---

## Line Chart Examples

### Basic Line Chart

**Use Case**: Showing cost trends over time

```tsx
import { CostLineChart } from "@/components/analytics/charts";

const data = [
  {
    date: "2025-01-01T00:00:00Z",
    timestamp: 1704067200000,
    fuelCost: 150,
    serviceCost: 75,
    totalCost: 225,
    label: "Jan 1",
    grouping: "day",
  },
  {
    date: "2025-01-02T00:00:00Z",
    timestamp: 1704153600000,
    fuelCost: 120,
    serviceCost: 0,
    totalCost: 120,
    label: "Jan 2",
    grouping: "day",
  },
  {
    date: "2025-01-03T00:00:00Z",
    timestamp: 1704240000000,
    fuelCost: 180,
    serviceCost: 200,
    totalCost: 380,
    label: "Jan 3",
    grouping: "day",
  },
];

<CostLineChart
  data={data}
  title="Cost Trends Over Time"
  height={250}
  showLegend={true}
/>;
```

**Visual Description**:

- Three lines: Total (orange solid), Fuel (green dashed), Service (blue dashed)
- Interactive tooltips show exact values on tap
- X-axis shows date labels, Y-axis shows cost amounts

### Custom Height

```tsx
<CostLineChart
  data={data}
  title="Compact View"
  height={180}
  showLegend={false}
/>
```

---

## Bar Chart Examples

### Total Cost Bar Chart

**Use Case**: Comparing total costs across periods

```tsx
import { CostBarChart } from "@/components/analytics/charts";

<CostBarChart
  data={chartData}
  title="Daily Total Costs"
  type="total"
  height={250}
/>;
```

**Visual Description**:

- Orange bars representing total costs
- Each bar = one time period
- Tooltip shows exact amount

### Fuel-Only Bar Chart

**Use Case**: Analyzing fuel costs separately

```tsx
<CostBarChart
  data={chartData}
  title="Fuel Costs by Week"
  type="fuel"
  height={200}
/>
```

**Visual Description**:

- Green bars for fuel costs
- Easier to spot fuel cost patterns
- Useful for tracking fuel efficiency impact

### Service-Only Bar Chart

**Use Case**: Tracking maintenance expenses

```tsx
<CostBarChart
  data={chartData}
  title="Service Costs by Month"
  type="service"
  height={200}
/>
```

**Visual Description**:

- Blue bars for service costs
- Identifies months with major services
- Helps plan future maintenance budgets

---

## Stacked Bar Chart Examples

### Basic Stacked Bar Chart

**Use Case**: Comparing fuel vs service proportions

```tsx
import { CostStackedBarChart } from "@/components/analytics/charts";

<CostStackedBarChart
  data={chartData}
  title="Cost Breakdown by Week"
  height={250}
  showLegend={true}
/>;
```

**Visual Description**:

- Green section = fuel costs (bottom)
- Blue section = service costs (top)
- Total bar height = combined costs
- Legend shows color coding

### Without Legend

```tsx
<CostStackedBarChart
  data={chartData}
  title="Cost Breakdown"
  height={200}
  showLegend={false}
/>
```

---

## Area Chart Examples

### Cumulative Costs Area Chart

**Use Case**: Tracking total spending accumulation

```tsx
import { CostAreaChart } from "@/components/analytics/charts";

<CostAreaChart
  data={chartData}
  title="Cumulative Costs"
  height={250}
  showLegend={true}
/>;
```

**Visual Description**:

- Orange area = cumulative total (highest)
- Green area = cumulative fuel (middle)
- Blue area = cumulative service (lowest)
- Areas overlap to show relationships
- Steeper slopes = faster spending

### Compact View

```tsx
<CostAreaChart
  data={chartData}
  title="Spending Growth"
  height={180}
  showLegend={false}
/>
```

---

## Pie Chart Examples

### Fuel vs Service Breakdown

**Use Case**: Understanding cost distribution

```tsx
import { CostPieChart } from "@/components/analytics/charts";

<CostPieChart
  totalFuelCost={1500}
  totalServiceCost={750}
  title="Fuel vs Service Costs"
  height={300}
  showLegend={true}
/>;
```

**Visual Description**:

- Green slice = Fuel (typically larger)
- Blue slice = Service
- Center displays total cost
- Labels show percentages
- Legend shows amounts and percentages

### Custom Height

```tsx
<CostPieChart
  totalFuelCost={2000}
  totalServiceCost={1000}
  title="Cost Distribution"
  height={250}
  showLegend={false}
/>
```

---

## Custom Configurations

### Multi-Chart Dashboard

```tsx
function CostDashboard() {
  const { chartDataset } = useCostChartData(filters);

  if (!chartDataset) return <LoadingState />;

  return (
    <ScrollView>
      {/* Overview Line Chart */}
      <CostLineChart
        data={chartDataset.data}
        title="Overview"
        height={200}
        showLegend={true}
      />

      {/* Detailed Stacked Bar Chart */}
      <CostStackedBarChart
        data={chartDataset.data}
        title="Breakdown"
        height={250}
        showLegend={true}
      />

      {/* Side-by-side Bar Charts */}
      <View style={{ flexDirection: "row", gap: 16 }}>
        <View style={{ flex: 1 }}>
          <CostBarChart
            data={chartDataset.data}
            title="Fuel"
            type="fuel"
            height={180}
          />
        </View>
        <View style={{ flex: 1 }}>
          <CostBarChart
            data={chartDataset.data}
            title="Service"
            type="service"
            height={180}
          />
        </View>
      </View>

      {/* Cumulative View */}
      <CostAreaChart
        data={chartDataset.data}
        title="Cumulative"
        height={220}
        showLegend={false}
      />

      {/* Distribution Pie */}
      <CostPieChart
        totalFuelCost={chartDataset.summary.totalFuelCost}
        totalServiceCost={chartDataset.summary.totalServiceCost}
        title="Distribution"
        height={300}
        showLegend={true}
      />
    </ScrollView>
  );
}
```

### Responsive Charts

```tsx
import { Dimensions, Platform } from "react-native";

function ResponsiveCharts() {
  const screenWidth = Dimensions.get("window").width;
  const isWeb = Platform.OS === "web";
  const isTablet = screenWidth > 768;

  const chartHeight = isTablet ? 300 : 220;
  const showLegend = !isTablet; // Hide legend on tablets for more space

  return (
    <CostLineChart
      data={chartData}
      title="Cost Trends"
      height={chartHeight}
      showLegend={showLegend}
    />
  );
}
```

### Themed Charts

```tsx
import { useStyles } from "react-native-unistyles";

function ThemedCharts() {
  const { theme } = useStyles();

  // Custom legend with theme colors
  const legendItems = [
    { name: "Total", color: theme.colors.analytics.cost },
    { name: "Fuel", color: theme.colors.analytics.fuel },
    { name: "Service", color: theme.colors.analytics.service },
  ];

  return (
    <>
      <CostLineChart data={chartData} title="Trends" />
      <ChartLegend items={legendItems} orientation="horizontal" />
    </>
  );
}
```

### Conditional Rendering

```tsx
function ConditionalCharts() {
  const { chartDataset, loading } = useCostChartData(filters);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!chartDataset || chartDataset.data.length === 0) {
    return <EmptyState message="No cost data available" />;
  }

  const hasServiceCosts = chartDataset.summary.totalServiceCost > 0;
  const hasFuelCosts = chartDataset.summary.totalFuelCost > 0;

  return (
    <>
      {/* Always show overview */}
      <CostLineChart data={chartDataset.data} title="Overview" />

      {/* Show pie chart only if both types exist */}
      {hasServiceCosts && hasFuelCosts && (
        <CostPieChart
          totalFuelCost={chartDataset.summary.totalFuelCost}
          totalServiceCost={chartDataset.summary.totalServiceCost}
          title="Distribution"
        />
      )}

      {/* Show fuel chart only if fuel data exists */}
      {hasFuelCosts && (
        <CostBarChart data={chartDataset.data} title="Fuel" type="fuel" />
      )}

      {/* Show service chart only if service data exists */}
      {hasServiceCosts && (
        <CostBarChart data={chartDataset.data} title="Service" type="service" />
      )}
    </>
  );
}
```

---

## Data Preparation Examples

### Sample Data Generation

```typescript
// Generate sample data for testing
function generateSampleData(days: number): CostChartDataPoint[] {
  const data: CostChartDataPoint[] = [];
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  for (let i = 0; i < days; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);

    data.push({
      date: date.toISOString(),
      timestamp: date.getTime(),
      fuelCost: Math.random() * 200 + 50,
      serviceCost: Math.random() * 100,
      totalCost: 0, // Will be calculated
      label: formatChartLabel(date, "day"),
      grouping: "day",
    });

    // Calculate total
    data[i].totalCost = data[i].fuelCost + data[i].serviceCost;
  }

  return data;
}

// Usage
const testData = generateSampleData(30);
<CostLineChart data={testData} title="Test Data" />
```

### Real Data Transformation

```typescript
// Transform real database data
async function loadRealData() {
  const fuelLogs = await fetchFuelLogs(userId, period);
  const serviceLogs = await fetchServiceLogs(userId, period);

  const chartData = generateCostChartData(fuelLogs, serviceLogs, period);

  return chartData;
}
```

---

## Common Patterns

### Loading State

```tsx
{
  loading ? (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={theme.colors.primary} />
      <Text>Loading charts...</Text>
    </View>
  ) : (
    <CostLineChart data={chartData} title="Costs" />
  );
}
```

### Error State

```tsx
{
  error ? (
    <View style={styles.errorContainer}>
      <Icon name="alert-circle-outline" size={48} color="red" />
      <Text>Failed to load chart data</Text>
      <Button onPress={refetch}>Retry</Button>
    </View>
  ) : (
    <CostLineChart data={chartData} title="Costs" />
  );
}
```

### Empty State

```tsx
{
  chartData.length === 0 ? (
    <EmptyAnalytics
      title="No Data"
      message="Add fuel and service logs to see charts"
    />
  ) : (
    <CostLineChart data={chartData} title="Costs" />
  );
}
```

---

## Performance Examples

### Optimized Rendering

```tsx
// Memoize chart data
const lineData = useMemo(
  () => transformToVictoryData(chartDataset?.data || [], "total"),
  [chartDataset],
);

// Memoize chart component
const LineChart = memo(() => <CostLineChart data={lineData} title="Trends" />);
```

### Lazy Loading Charts

```tsx
function LazyCharts() {
  const [showAllCharts, setShowAllCharts] = useState(false);

  return (
    <>
      {/* Always show primary chart */}
      <CostLineChart data={chartData} title="Overview" />

      {/* Load secondary charts on demand */}
      {!showAllCharts && (
        <Button onPress={() => setShowAllCharts(true)}>Show More Charts</Button>
      )}

      {showAllCharts && (
        <>
          <CostBarChart data={chartData} title="Details" />
          <CostPieChart
            totalFuelCost={1500}
            totalServiceCost={750}
            title="Distribution"
          />
        </>
      )}
    </>
  );
}
```

---

## Best Practices

1. **Consistent Heights**: Use standard heights (200, 250, 300) for visual harmony
2. **Legend Placement**: Show legends on primary charts, hide on secondary/compact views
3. **Color Consistency**: Use theme colors for consistency across charts
4. **Empty States**: Always handle empty data gracefully
5. **Loading States**: Show loading indicators during data fetch
6. **Error Handling**: Provide retry mechanisms for failures
7. **Responsive Design**: Adapt chart sizes to screen dimensions
8. **Accessibility**: Ensure tooltips and labels are readable
9. **Performance**: Memoize expensive calculations and transformations
10. **Testing**: Test with various data sizes and edge cases

---

**Last Updated**: 2025-01-30
