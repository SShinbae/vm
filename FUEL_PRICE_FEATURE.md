# Fuel Price Feature Implementation

## Overview
Added a new fuel price dropdown selection to the fuel logging system that enables automatic calculation of fuel liters based on cost and selected fuel price per liter.

## Features Added

### 1. Fuel Price Dropdown Selection
- **Required field**: "Fuel Price (RM per liter)" 
- **Predefined options**: RM1.99, RM2.60, RM3.21
- Visual selection buttons with highlighting
- Added to both Add and Edit fuel log screens

### 2. Auto-Calculation Functionality

#### Cost to Liters Calculation (ONLY)
- **Formula**: `liters = cost / fuel_price`
- **Example**: RM10.00 ÷ RM1.99 = 5.025 liters
- **Precision**: 3 decimal places
- **Direction**: One-way only (cost → liters)

### 3. Form Changes
- **Cost**: Now required input field
- **Liters**: Auto-calculated and read-only
- **Fuel Price**: Required dropdown selection
- **Field Order**: Cost (Required) + Liters (Auto-calculated)

### 4. Smart Form Behavior
- When user selects fuel price and enters cost → auto-calculates liters
- Liters field is read-only (cannot be manually edited)
- Real-time calculation as user types cost amount

## Technical Implementation

### Database Changes
- Added `fuel_price` column to `fuel_logs` table
- Type: `DECIMAL(5,3)` (allows values like 999.999)
- Nullable to maintain backward compatibility
- Migration script: `database/add-fuel-price-column.sql`

### Type Definitions Updated
- `FuelLogFormData` interface: Made `cost` and `fuel_price` required
- `Database` types: Added fuel_price to Row, Insert, and Update types
- Comments added for clarity on auto-calculated fields

### Files Modified
1. `types/index.ts` - Updated FuelLogFormData interface
2. `types/database-v2.ts` - Updated database type definitions
3. `app/logs/fuel/add.tsx` - Added dropdown and auto-calculation logic
4. `app/logs/fuel/[id]/edit.tsx` - Added dropdown and auto-calculation logic
5. `database/add-fuel-price-column.sql` - Database migration script

### Form Validation
- **Cost**: Required, must be greater than 0
- **Fuel Price**: Required, selected from dropdown
- **Liters**: Auto-calculated (no validation needed)
- **Odometer**: Still required

## UI Components Added

### Fuel Price Selector
```tsx
<View style={styles.fuelPriceSelector}>
  {[1.99, 2.60, 3.21].map((price) => (
    <TouchableOpacity
      style={[
        styles.fuelPriceOption,
        selected && styles.fuelPriceOptionSelected,
      ]}
    >
      <Text>RM{price.toFixed(2)}</Text>
    </TouchableOpacity>
  ))}
</View>
```

### Read-Only Liters Field
```tsx
<TextInput
  style={[styles.input, styles.inputReadOnly]}
  value={formData.liters_filled.toString()}
  editable={false}
  placeholder="Auto-calculated"
/>
```

## Usage Instructions

### For Users
1. **Select Fuel Price**: Choose from RM1.99, RM2.60, or RM3.21
2. **Enter Cost**: Input the total amount paid (e.g., RM50.00)
3. **Liters Auto-Calculated**: System shows calculated liters (e.g., 25.126 liters)
4. **Complete Form**: Fill in odometer reading, date, and optional location

### For Developers
1. **Run Migration**: Execute `add-fuel-price-column.sql` in Supabase
2. **Deploy Changes**: All code changes are backward compatible
3. **Test Calculations**: Verify auto-calculation works with all price options

## Calculation Examples

| Fuel Price | Cost Entered | Calculated Liters |
|------------|--------------|-------------------|
| RM1.99     | RM10.00      | 5.025 liters      |
| RM1.99     | RM50.00      | 25.126 liters     |
| RM2.60     | RM20.00      | 7.692 liters      |
| RM2.60     | RM50.00      | 19.231 liters     |
| RM3.21     | RM30.00      | 9.346 liters      |
| RM3.21     | RM50.00      | 15.576 liters     |

## Key Changes From Previous Version

1. **Removed Liters → Cost Calculation**: Only cost → liters calculation
2. **Dropdown Instead of Text Input**: Predefined fuel price options
3. **Swapped Field Positions**: Cost (required) comes before Liters (calculated)
4. **Read-Only Liters**: Users cannot manually edit liters amount
5. **Default Fuel Price**: RM1.99 selected by default

## Backward Compatibility
- Existing fuel logs without fuel_price will show RM1.99 as default in edit mode
- Migration script calculates approximate fuel_price for existing records
- Form gracefully handles missing fuel_price data