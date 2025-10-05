# Date Format Update - DD-MM-YYYY

## Summary

All date formats in the application have been updated to use **DD-MM-YYYY** format (e.g., 25-10-2024) for consistent user experience across web and mobile platforms.

## Changes Made

### 1. **Centralized DatePicker Component** (`components/ui/DatePicker.tsx`)
   - ✅ Updated to display dates in **DD-MM-YYYY** format
   - ✅ Works seamlessly on both **web** and **mobile** platforms
   - ✅ Stores dates in **YYYY-MM-DD** format for database compatibility
   - ✅ Supports multiple input formats:
     - DD-MM-YYYY (primary display format)
     - DD/MM/YYYY (alternative format)
     - YYYY-MM-DD (database format)

### 2. **Date Utility Functions** (`lib/utils/dateUtils.ts`)
   - ✅ `formatDate()` - Returns DD-MM-YYYY (was DD/MM/YY)
   - ✅ `formatDateTime()` - Returns DD-MM-YYYY HH:MM (was DD/MM/YY HH:MM)
   - ✅ `formatDateWithPrefix()` - Uses DD-MM-YYYY format
   - ✅ `parseDate()` - Accepts both DD-MM-YYYY and DD/MM/YYYY formats
   - ✅ `getTodayFormatted()` - Returns today in DD-MM-YYYY format

### 3. **Log Add/Edit Screens Updated**

#### Fuel Logs
- ✅ `app/logs/fuel/add.tsx` - Now uses centralized DatePicker
- ✅ `app/logs/fuel/[id]/edit.tsx` - Already uses DatePicker

#### Mileage Logs
- ✅ `app/logs/mileage/add.tsx` - Now uses centralized DatePicker
- ✅ `app/logs/mileage/[id]/edit.tsx` - Already uses DatePicker

#### Service Logs
- ✅ `app/logs/service/add.tsx` - Already uses DatePicker
- ✅ `app/logs/service/[id]/edit.tsx` - Already uses DatePicker
- ✅ `app/logs/service/[id]/index.tsx` - Local formatDate updated to DD-MM-YYYY

### 4. **Other Components Updated**
- ✅ `components/ui/ReceiptViewer.tsx` - Uses formatDate() utility
- ✅ `components/ui/ReceiptCapture.tsx` - Uses formatDate() utility

### 5. **Components Already Using formatDate() (Auto-Updated)**
- ✅ `components/VehicleDetail.tsx`
- ✅ `app/vehicles/[id].tsx`
- ✅ `app/groups/[id].tsx`

## Format Examples

### Display Format
```
Input Date: 2024-10-25 (database)
Display:    25-10-2024 (user sees this)
```

### Date Picker Behavior

**Mobile:**
- Shows native date picker
- Displays selected date as: 25-10-2024

**Web:**
- HTML5 date input with fallback
- Accepts DD-MM-YYYY format
- Converts internally to YYYY-MM-DD for storage

## Technical Details

### Date Storage (Database)
- Format: **YYYY-MM-DD** (ISO 8601 standard)
- Example: `2024-10-25`
- Ensures database compatibility and sorting

### Date Display (UI)
- Format: **DD-MM-YYYY**
- Example: `25-10-2024`
- User-friendly international format

### Conversion Flow
```
User Input → DatePicker → YYYY-MM-DD (stored) → DD-MM-YYYY (displayed)
```

## Usage Examples

### Using DatePicker Component

```tsx
import { DatePicker } from '@/components/ui/DatePicker';

// In your component
<DatePicker
  label="Date"
  value={formData.date}  // YYYY-MM-DD format from state
  onDateChange={(date) => setFormData(prev => ({ ...prev, date }))}
  required
/>
```

### Using Date Utils

```tsx
import { formatDate, formatDateTime, parseDate } from '@/lib/utils/dateUtils';

// Format for display
formatDate('2024-10-25')              // Returns: "25-10-2024"
formatDateTime('2024-10-25T14:30:00') // Returns: "25-10-2024 14:30"

// Parse user input to database format
parseDate('25-10-2024')  // Returns: "2024-10-2024"
parseDate('25/10/2024')  // Returns: "2024-10-25"
```

## Benefits

1. **Consistency**: All dates displayed in the same format across the app
2. **User-Friendly**: DD-MM-YYYY is internationally recognized and clear
3. **Platform Agnostic**: Works seamlessly on web and mobile
4. **Database Compatible**: Internally stores in ISO format for proper sorting
5. **Flexible Input**: Accepts multiple input formats from users

## Migration Notes

- No database changes required (dates still stored as YYYY-MM-DD)
- All existing dates will be displayed correctly
- Old format (DD/MM/YY) automatically converted to new format (DD-MM-YYYY)
- Two-digit years automatically converted to four-digit (21st century assumed)

## Future Considerations

- Date formatting is now centralized in `dateUtils.ts`
- To change format app-wide, update only the utility functions
- Consider adding locale support if needed in the future
