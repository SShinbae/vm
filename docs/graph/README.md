# Cost Graph Feature - Documentation

## Overview

The Cost Graph feature provides comprehensive cost visualization for vehicle management, allowing users to analyze fuel and service costs across different time periods with interactive charts.

## Features

### 📊 Multiple Chart Types

- **Line Charts** - Trend analysis over time
- **Bar Charts** - Period-by-period comparisons
- **Stacked Bar Charts** - Combined fuel + service visualization
- **Area Charts** - Cumulative cost tracking
- **Pie Charts** - Fuel vs service breakdown

### 📅 Flexible Time Periods

- **Presets**: 7 days, 30 days, 3 months, 6 months, 1 year
- **Custom Date Range**: Select any start and end date
- **Auto-grouping**: Automatically groups data by day/week/month based on range

### 🎯 Smart Data Grouping

- **Daily** view for ranges < 14 days
- **Weekly** view for ranges 14-90 days
- **Monthly** view for ranges > 90 days

### 🚗 Vehicle Filtering

- View costs for all vehicles (aggregated)
- Filter by specific vehicles
- Multi-vehicle support

## Quick Start

### Accessing the Feature

1. Navigate to the **Analytics** tab in the app
2. Select **Costs** from the analytics options
3. The cost graphs screen will display with default 30-day period

### Selecting Time Periods

**Using Presets:**

1. Tap the period selector button
2. Choose from predefined periods (7 days, 30 days, etc.)

**Using Custom Range:**

1. Tap the period selector button
2. Select "Custom Range" at the bottom
3. Choose start date using the date picker
4. Choose end date using the date picker
5. Tap "Confirm" to apply

### Filtering Vehicles

1. Tap the vehicle filter button
2. Select/deselect specific vehicles
3. Use "Select All" or "Clear All" for bulk actions
4. Costs will aggregate across selected vehicles

## Chart Types Explained

### 1. Cost Trends Over Time (Line Chart)

- Shows three lines: Total, Fuel, and Service costs
- Helps identify cost trends and patterns
- Interactive tooltips show exact values

### 2. Cost Breakdown (Stacked Bar Chart)

- Displays fuel and service costs stacked together
- Each bar represents a time period (day/week/month)
- Easily compare total costs across periods

### 3. Cumulative Costs (Area Chart)

- Shows running total of costs over time
- Helps track total spending accumulation
- Three overlapping areas for total, fuel, and service

### 4. Fuel vs Service Costs (Pie Chart)

- Percentage breakdown of cost types
- Shows relative spending on fuel vs maintenance
- Displays actual amounts and percentages

### 5. Individual Cost Charts (Bar Charts)

- Separate charts for fuel and service costs
- Detailed view of each cost category
- Easier to spot outliers in specific categories

## Key Metrics

### Summary Cards

- **Total Cost**: Combined fuel + service costs
- **Fuel Cost**: Total fuel expenses
- **Service Cost**: Total maintenance expenses
- **Cost per km**: Average cost per kilometer driven
- **Daily Average**: Average daily spending

## Technical Details

### Libraries Used

- **victory-native**: Chart rendering
- **react-native-ui-datepicker**: Custom date range selection
- **dayjs**: Date manipulation

### Data Sources

- Fuel logs from Supabase database
- Service logs from Supabase database
- Real-time data updates

### Performance

- Data is cached and reused when possible
- Charts auto-scale based on screen size
- Optimized for both mobile and web platforms

## Navigation

The Cost Graphs feature is accessible via:

- **Path**: `/app/(tabs)/analytics/costs.tsx`
- **Route**: `/(tabs)/analytics/costs`

## Related Documentation

- [Architecture](./architecture.md) - System design and data flow
- [API Reference](./api-reference.md) - Functions and hooks
- [Data Structures](./data-structures.md) - Type definitions
- [Developer Guide](./developer-guide.md) - Extending the feature
- [User Guide](./user-guide.md) - Detailed usage instructions

## Troubleshooting

### No data showing

- Ensure you have fuel or service logs in the selected period
- Check vehicle filter - make sure vehicles are selected
- Try a different time period

### Charts look cramped

- Reduce the date range for clearer daily/weekly views
- Use landscape mode for better visibility
- Zoom in on specific periods

### Custom date range not working

- Ensure end date is after start date
- Maximum range is 2 years
- Check that dates are within your data range

## Support

For issues or questions:

- Check the [Developer Guide](./developer-guide.md)
- Review [Chart Examples](./chart-examples.md)
- Open an issue on the project repository

---

**Version**: 1.0.0
**Last Updated**: 2025-01-30
