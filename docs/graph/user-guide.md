# User Guide - Cost Graph Feature

## Getting Started

### Accessing Cost Graphs

1. Open the vehicles management app
2. Navigate to the **Analytics** tab (bottom navigation)
3. Select **Costs** from the analytics screens
4. You'll see the cost visualization dashboard

## Understanding the Interface

### Summary Cards

At the top of the screen, you'll find six summary cards:

1. **Total Cost** - Combined fuel and service costs for the selected period
2. **Fuel Cost** - Total spent on fuel
3. **Service Cost** - Total spent on maintenance and services
4. **Cost per km** - Average cost per kilometer driven
5. **Daily Average** - Average cost per day in the selected period

### Charts Section

Below the summary cards, you'll find multiple chart visualizations:

1. **Cost Trends Over Time** (Line Chart)
2. **Cost Breakdown** (Stacked Bar Chart)
3. **Cumulative Costs** (Area Chart)
4. **Fuel vs Service Costs** (Pie Chart)
5. **Individual Cost Charts** (Bar Charts for Fuel and Service)

## Selecting Time Periods

### Using Preset Periods

1. Tap the **period selector** button (shows current period, e.g., "30 Days")
2. A modal will appear with preset options:
   - 7 Days
   - 30 Days
   - 3 Months
   - 6 Months
   - 1 Year
3. Tap your desired period
4. Charts will update automatically

### Using Custom Date Range

1. Tap the **period selector** button
2. Scroll to the bottom and select **"Custom Range"**
3. A date picker will appear
4. **Select Start Date:**
   - Swipe through the calendar
   - Tap the start date
5. **Select End Date:**
   - Swipe through the calendar
   - Tap the end date
6. Review the date range information at the bottom
7. Tap **"Confirm"** to apply

**Tips:**

- The selected date range is shown in days (e.g., "Range: 45 days")
- Maximum range is 2 years
- End date must be after start date
- Invalid selections will show an error message

## Filtering by Vehicle

### Viewing All Vehicles (Default)

By default, costs are aggregated across all your vehicles.

### Filtering Specific Vehicles

1. Tap the **vehicle filter** button
2. A list of your vehicles appears
3. Tap vehicles to select/deselect them
4. Selected vehicles show a checkmark
5. Close the modal - charts update automatically

### Bulk Actions

- **Select All**: Tap "Select All" to include all vehicles
- **Clear All**: Tap "Clear All" to deselect all vehicles

## Understanding the Charts

### 1. Cost Trends Over Time (Line Chart)

**What it shows:**

- Three lines representing Total, Fuel, and Service costs
- Trends over the selected time period

**How to read it:**

- **X-axis**: Time periods (days, weeks, or months)
- **Y-axis**: Cost amount in RM
- **Lines**:
  - **Orange (solid)**: Total costs
  - **Green (dashed)**: Fuel costs
  - **Blue (dashed)**: Service costs

**Interactive features:**

- Tap any point to see exact values
- Tooltips show cost amounts

**What to look for:**

- Rising trends indicate increasing costs
- Spikes show unusually high spending periods
- Flat lines indicate consistent spending

### 2. Cost Breakdown (Stacked Bar Chart)

**What it shows:**

- Fuel and service costs stacked together
- Each bar is a time period

**How to read it:**

- **Green section**: Fuel costs
- **Blue section**: Service costs
- **Total height**: Combined costs

**What to look for:**

- Compare relative proportions of fuel vs service
- Identify periods with high service costs
- Spot patterns in spending distribution

### 3. Cumulative Costs (Area Chart)

**What it shows:**

- Running total of costs over time
- How your total spending accumulates

**How to read it:**

- **Orange area**: Total cumulative cost
- **Green area**: Cumulative fuel cost
- **Blue area**: Cumulative service cost
- Line slopes upward as costs accumulate

**What to look for:**

- Steeper slopes = faster spending rate
- Flatter sections = lower spending periods
- Use to track total expenditure growth

### 4. Fuel vs Service Costs (Pie Chart)

**What it shows:**

- Percentage breakdown of fuel vs service costs
- Total amounts for each category

**How to read it:**

- **Green slice**: Fuel costs with percentage
- **Blue slice**: Service costs with percentage
- Center shows total combined cost

**What to look for:**

- Which category dominates your spending
- Typical ratio: ~60-70% fuel, ~30-40% service
- Unusually high service % may indicate maintenance issues

### 5. Individual Cost Charts (Bar Charts)

**What it shows:**

- Separate detailed views for fuel and service
- Easier to analyze each category independently

**How to read it:**

- Each bar represents one time period
- Height indicates cost amount
- Green bars for fuel, blue bars for service

**What to look for:**

- Specific periods with unusual costs
- Patterns in fuel consumption
- Service cost variations

## Auto-Grouping Explained

Charts automatically adjust grouping based on your date range:

### Daily Grouping (< 14 days)

- Each data point = 1 day
- Labels show date (e.g., "Jan 15")
- Best for: Short-term detailed analysis

### Weekly Grouping (14-90 days)

- Each data point = 1 week
- Labels show week number (e.g., "W3")
- Best for: Medium-term trends

### Monthly Grouping (> 90 days)

- Each data point = 1 month
- Labels show month and year (e.g., "Jan 25")
- Best for: Long-term patterns

**Why auto-grouping?**

- Prevents chart clutter with too many data points
- Optimizes readability for different time ranges
- Automatically provides the most useful view

## Tips for Effective Analysis

### Compare Time Periods

1. Note your current period's total cost
2. Select a different period
3. Compare the summary cards
4. Look for cost trends

### Identify Spending Patterns

1. Use the line chart to spot regular patterns
2. Check if certain days/weeks have higher costs
3. Correlate with your driving habits

### Track Budget Goals

1. Calculate your monthly budget
2. Use the daily average metric
3. Multiply by days in month
4. Compare to your budget

### Find Cost Savings

1. Look at the pie chart ratio
2. If fuel costs are very high, consider:
   - More fuel-efficient driving
   - Cheaper fuel stations
   - Vehicle maintenance (affects efficiency)
3. If service costs are high, review:
   - Preventive maintenance schedule
   - Recent major services
   - Warranty coverage

### Monitor Multiple Vehicles

1. Use vehicle filter to compare individual vehicles
2. Check which vehicle has higher costs
3. Analyze if cost differences are justified
4. Make informed decisions about vehicle usage

## Common Scenarios

### Scenario 1: Monthly Budget Tracking

**Goal**: Stay within RM1,500/month budget

**Steps**:

1. Select "30 Days" period
2. Check "Total Cost" card
3. View "Daily Average" card
4. Multiply daily average × 30 for monthly projection
5. Adjust spending if over budget

### Scenario 2: Comparing Vehicles

**Goal**: Determine which vehicle is more economical

**Steps**:

1. Select "3 Months" period
2. Filter for Vehicle A only
3. Note the "Cost per km" metric
4. Clear filter, select Vehicle B
5. Compare cost per km
6. Lower = more economical

### Scenario 3: Planning for Services

**Goal**: Budget for upcoming maintenance

**Steps**:

1. Select "6 Months" or "1 Year"
2. View service cost bar chart
3. Identify service cost patterns
4. Calculate average monthly service cost
5. Budget accordingly

### Scenario 4: Analyzing Fuel Price Changes

**Goal**: See impact of fuel price fluctuations

**Steps**:

1. Select custom range covering price change period
2. Use daily grouping for detail
3. View fuel cost line chart
4. Compare before/after periods
5. Adjust fuel budget if needed

## Troubleshooting

### No Data Showing

**Problem**: Charts show "No data available"

**Solutions**:

- Add fuel or service logs for the selected period
- Extend the date range
- Check vehicle filter - ensure vehicles are selected
- Verify logs have cost information entered

### Charts Look Cluttered

**Problem**: Too many bars/points on chart

**Solutions**:

- Reduce the date range
- Let auto-grouping handle it (select longer periods)
- Use monthly view for annual analysis

### Missing Recent Data

**Problem**: Latest logs don't appear

**Solutions**:

- Pull down to refresh the screen
- Check log entry dates are correct
- Ensure costs are entered (not left blank)

### Custom Date Range Error

**Problem**: "End date must be after start date" error

**Solutions**:

- Check you selected dates in correct order
- Start date must be earlier than end date
- Maximum 2-year range allowed

### Costs Seem Wrong

**Problem**: Numbers don't match expectations

**Solutions**:

- Verify vehicle filter settings (all vs specific)
- Check period selected is correct
- Review individual logs for accuracy
- Ensure currency conversions are correct

## Best Practices

1. **Regular Updates**: Enter fuel and service logs promptly for accurate graphs
2. **Cost Entry**: Always include cost information in your logs
3. **Consistent Periods**: Use same period for month-to-month comparisons
4. **Multiple Views**: Check different chart types for complete picture
5. **Historical Analysis**: Review longer periods quarterly
6. **Budget Reviews**: Weekly checks of daily average costs
7. **Vehicle Comparison**: Monthly comparison if you have multiple vehicles

## Accessibility

- All charts support touch interactions
- Tooltips provide exact values
- Summary cards give quick text-based metrics
- Color-coded for easy distinction (suitable for most color blindness types)
- Responsive design adapts to screen size

---

**Need Help?**
Refer to [README.md](./README.md) for feature overview or [chart-examples.md](./chart-examples.md) for more visual guides.

**Last Updated**: 2025-01-30
