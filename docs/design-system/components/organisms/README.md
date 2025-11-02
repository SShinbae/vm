# Organism Components

Organism components are complex, composite components that combine multiple molecules and atoms to create full-featured UI sections. They represent specific interface patterns and are often domain-specific or highly functional.

## Table of Contents

1. [PageHeader](#pageheader)
2. [SearchBar](#searchbar)
3. [VehicleCard](#vehiclecard)
4. [MetricCard](#metriccard)
5. [Form](#form)
6. [DataTable](#datatable)
7. [NavigationBar](#navigationbar)
8. [Usage Guidelines](#usage-guidelines)
9. [Accessibility](#accessibility)

---

## PageHeader

A reusable page header component for navigation and page-level actions.

### Features

- Back navigation with router integration
- Page title and optional subtitle
- Action buttons with icons
- Bottom slot for tabs, filters, or custom content
- Consistent styling across the app

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `title` | `string` | **Required** | Page title |
| `subtitle` | `string` | `undefined` | Optional subtitle text |
| `showBack` | `boolean` | `false` | Whether to show back button |
| `onBack` | `() => void` | `router.back` | Custom back navigation handler |
| `actions` | `PageHeaderAction[]` | `[]` | Array of action buttons |
| `bottom` | `ReactNode` | `undefined` | Content to render below header |

### PageHeaderAction

| Prop | Type | Description |
|------|------|-------------|
| `icon` | `keyof typeof allIcons` | Icon name |
| `onPress` | `() => void` | Press handler |
| `label` | `string` | Accessibility label |
| `disabled` | `boolean` | Whether button is disabled |

### Usage Example

```tsx
import { PageHeader } from '@/lib/design-system/components/organisms';

// Basic page header
<PageHeader title="Vehicles" />

// With back navigation and subtitle
<PageHeader 
  title="Vehicle Details"
  subtitle="Toyota Camry 2020"
  showBack
/>

// With actions
<PageHeader 
  title="Vehicles"
  actions={[
    {
      icon: 'filter',
      onPress: () => setShowFilters(true),
      label: 'Filter vehicles'
    },
    {
      icon: 'settings',
      onPress: () => router.push('/settings'),
      label: 'Settings'
    }
  ]}
/>

// With bottom tabs
<PageHeader 
  title="Dashboard"
  bottom={
    <ScrollView horizontal>
      <Button variant="ghost" size="sm">Overview</Button>
      <Button variant="ghost" size="sm">Analytics</Button>
      <Button variant="ghost" size="sm">Reports</Button>
    </ScrollView>
  }
/>
```

---

## SearchBar

A search input component with filter and sort capabilities.

### Features

- Text input with clear button
- Optional filter button with badge count
- Optional sort button
- Focus states
- Keyboard type: search

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `string` | **Required** | Current search value |
| `onChangeText` | `(text: string) => void` | **Required** | Text change handler |
| `placeholder` | `string` | `'Search...'` | Input placeholder |
| `onFilterPress` | `() => void` | `undefined` | Filter button handler |
| `onSortPress` | `() => void` | `undefined` | Sort button handler |
| `activeFilters` | `number` | `0` | Number of active filters (for badge) |
| `disabled` | `boolean` | `false` | Whether input is disabled |

### Usage Example

```tsx
import { SearchBar } from '@/lib/design-system/components/organisms';

const [searchQuery, setSearchQuery] = useState('');
const [showFilters, setShowFilters] = useState(false);
const [activeFilters, setActiveFilters] = useState(0);

<SearchBar 
  value={searchQuery}
  onChangeText={setSearchQuery}
  placeholder="Search vehicles..."
  onFilterPress={() => setShowFilters(true)}
  onSortPress={() => setShowSort(true)}
  activeFilters={activeFilters}
/>
```

---

## VehicleCard

A domain-specific card for displaying vehicle information.

### Features

- Vehicle image display
- Status chip with variants
- Metrics display with icons
- Action buttons
- Loading state
- Pressable card

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `name` | `string` | **Required** | Vehicle name |
| `subtitle` | `string` | **Required** | Vehicle subtitle (make/model/year) |
| `imageUri` | `string` | `undefined` | Vehicle image URL |
| `status` | `string` | `undefined` | Status text |
| `statusVariant` | `ChipVariant` | `'default'` | Status chip variant |
| `metrics` | `VehicleMetric[]` | `[]` | Array of metrics to display |
| `actions` | `VehicleAction[]` | `[]` | Array of action buttons |
| `onPress` | `() => void` | `undefined` | Card press handler |
| `loading` | `boolean` | `false` | Loading state |

### VehicleMetric

| Prop | Type | Description |
|------|------|-------------|
| `label` | `string` | Metric label |
| `value` | `string \| number` | Metric value |
| `icon` | `keyof typeof allIcons` | Metric icon |

### VehicleAction

| Prop | Type | Description |
|------|------|-------------|
| `icon` | `keyof typeof allIcons` | Action icon |
| `label` | `string` | Accessibility label |
| `onPress` | `() => void` | Action handler |

### Usage Example

```tsx
import { VehicleCard } from '@/lib/design-system/components/organisms';

<VehicleCard 
  name="Family Car"
  subtitle="2020 Toyota Camry"
  imageUri="https://example.com/camry.jpg"
  status="Active"
  statusVariant="success"
  metrics={[
    { label: 'Mileage', value: '50,000 km', icon: 'speedometer' },
    { label: 'Last Service', value: '2 months ago', icon: 'calendar' }
  ]}
  actions={[
    { icon: 'log', label: 'View logs', onPress: () => router.push(`/logs/${id}`) },
    { icon: 'settings', label: 'Edit', onPress: () => router.push(`/vehicles/${id}/edit`) }
  ]}
  onPress={() => router.push(`/vehicles/${id}`)}
/>
```

---

## MetricCard

A dashboard metric display component with trend indicators.

### Features

- Icon with variant-colored background
- Metric label and value
- Trend direction indicators (up/down/neutral)
- Trend value and comparison text
- Loading state
- Multiple variants

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `label` | `string` | **Required** | Metric label |
| `value` | `string \| number` | **Required** | Metric value |
| `icon` | `keyof typeof allIcons` | `undefined` | Metric icon |
| `variant` | `'success' \| 'warning' \| 'error' \| 'info' \| 'default'` | `'default'` | Visual variant |
| `trendDirection` | `'up' \| 'down' \| 'neutral'` | `undefined` | Trend direction |
| `trendValue` | `string` | `undefined` | Trend value (e.g., "12%") |
| `comparisonText` | `string` | `undefined` | Comparison text (e.g., "vs last month") |
| `loading` | `boolean` | `false` | Loading state |
| `disabled` | `boolean` | `false` | Disabled state |

### Usage Example

```tsx
import { MetricCard } from '@/lib/design-system/components/organisms';

<View style={{ flexDirection: 'row', gap: 16 }}>
  <MetricCard 
    label="Total Vehicles"
    value="24"
    icon="car"
    variant="info"
    trendDirection="up"
    trendValue="12%"
    comparisonText="vs last month"
  />
  
  <MetricCard 
    label="Maintenance Due"
    value="3"
    icon="warning"
    variant="warning"
    trendDirection="down"
    trendValue="2"
    comparisonText="from last week"
  />
  
  <MetricCard 
    label="Total Costs"
    value="$12,450"
    icon="document"
    variant="error"
    trendDirection="up"
    trendValue="$450"
  />
</View>
```

---

## Form

A dynamic form builder component with validation.

### Features

- Dynamic field generation from config
- Built-in validation (required, min, max, pattern)
- Multiple field types (text, email, password, number, textarea)
- Submit and cancel buttons
- Loading state
- Scrollable for long forms

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `fields` | `FormField[]` | **Required** | Array of field configurations |
| `onSubmit` | `(values: Record<string, any>) => void` | **Required** | Submit handler |
| `onCancel` | `() => void` | `undefined` | Cancel handler |
| `initialValues` | `Record<string, any>` | `{}` | Initial form values |
| `submitLabel` | `string` | `'Submit'` | Submit button label |
| `loading` | `boolean` | `false` | Loading state |
| `disabled` | `boolean` | `false` | Disabled state |

### FormField

| Prop | Type | Description |
|------|------|-------------|
| `name` | `string` | Field name (key in values object) |
| `label` | `string` | Field label |
| `type` | `'text' \| 'email' \| 'password' \| 'number' \| 'textarea'` | Input type |
| `placeholder` | `string` | Input placeholder |
| `required` | `boolean` | Whether field is required |
| `validation` | `FieldValidation` | Validation rules |

### FieldValidation

| Prop | Type | Description |
|------|------|-------------|
| `min` | `number` | Minimum length |
| `max` | `number` | Maximum length |
| `pattern` | `RegExp` | Pattern to match |
| `message` | `string` | Custom error message |

### Usage Example

```tsx
import { Form } from '@/lib/design-system/components/organisms';

const vehicleFormFields: FormField[] = [
  {
    name: 'name',
    label: 'Vehicle Name',
    type: 'text',
    required: true,
    validation: { min: 2, max: 50, message: 'Name must be 2-50 characters' }
  },
  {
    name: 'make',
    label: 'Make',
    type: 'text',
    required: true
  },
  {
    name: 'model',
    label: 'Model',
    type: 'text',
    required: true
  },
  {
    name: 'year',
    label: 'Year',
    type: 'number',
    required: true,
    validation: { 
      pattern: /^\d{4}$/, 
      message: 'Year must be 4 digits'
    }
  },
  {
    name: 'notes',
    label: 'Notes',
    type: 'textarea',
    placeholder: 'Additional notes...'
  }
];

<Form 
  fields={vehicleFormFields}
  onSubmit={(values) => console.log('Form submitted:', values)}
  onCancel={() => router.back()}
  submitLabel="Save Vehicle"
/>
```

---

## DataTable

A generic data table component with custom rendering.

### Features

- Generic type support for any data
- Column configuration with custom widths
- Custom render functions per column
- Row press callbacks
- Empty and loading states
- Striped rows option
- Horizontal scrolling

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `columns` | `DataTableColumn<T>[]` | **Required** | Column configurations |
| `data` | `T[]` | **Required** | Array of data items |
| `onRowPress` | `(item: T, index: number) => void` | `undefined` | Row press handler |
| `emptyMessage` | `string` | `'No data available'` | Empty state message |
| `loading` | `boolean` | `false` | Loading state |
| `striped` | `boolean` | `false` | Alternating row colors |
| `keyExtractor` | `(item: T) => string` | `undefined` | Custom key extraction |

### DataTableColumn

| Prop | Type | Description |
|------|------|-------------|
| `key` | `keyof T \| string` | Data key or custom key |
| `title` | `string` | Column header title |
| `width` | `DimensionValue` | Column width |
| `render` | `(value: any, item: T, index: number) => ReactNode` | Custom render function |

### Usage Example

```tsx
import { DataTable } from '@/lib/design-system/components/organisms';

interface Vehicle {
  id: string;
  name: string;
  status: 'active' | 'inactive';
  mileage: number;
}

const columns: DataTableColumn<Vehicle>[] = [
  { key: 'name', title: 'Name', width: 200 },
  { 
    key: 'status', 
    title: 'Status', 
    width: 120,
    render: (value) => (
      <Chip variant={value === 'active' ? 'success' : 'default'}>
        {value}
      </Chip>
    )
  },
  { 
    key: 'mileage', 
    title: 'Mileage', 
    width: 150,
    render: (value) => `${value.toLocaleString()} km`
  }
];

<DataTable 
  columns={columns}
  data={vehicles}
  onRowPress={(vehicle) => router.push(`/vehicles/${vehicle.id}`)}
  striped
  loading={isLoading}
/>
```

---

## NavigationBar

A bottom or top navigation bar with tabs.

### Features

- Tab navigation with icons and labels
- Badge support for notifications
- Active state styling
- Disabled tabs
- Two variants: default (bordered) and filled
- Top or bottom positioning
- Option to hide labels (icon-only mode)

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `tabs` | `NavigationTab[]` | **Required** | Array of tabs |
| `activeTab` | `string` | **Required** | Active tab ID |
| `onTabChange` | `(tabId: string) => void` | **Required** | Tab change handler |
| `variant` | `'default' \| 'filled'` | `'default'` | Visual variant |
| `position` | `'top' \| 'bottom'` | `'bottom'` | Navigation position |
| `showLabels` | `boolean` | `true` | Whether to show tab labels |

### NavigationTab

| Prop | Type | Description |
|------|------|-------------|
| `id` | `string` | Unique tab identifier |
| `label` | `string` | Tab label |
| `icon` | `keyof typeof allIcons` | Tab icon |
| `badge` | `number` | Badge count |
| `disabled` | `boolean` | Whether tab is disabled |

### Usage Example

```tsx
import { NavigationBar } from '@/lib/design-system/components/organisms';

const [activeTab, setActiveTab] = useState('home');

<NavigationBar 
  tabs={[
    { id: 'home', label: 'Home', icon: 'home' },
    { id: 'vehicles', label: 'Vehicles', icon: 'car' },
    { id: 'notifications', label: 'Notifications', icon: 'message', badge: 3 },
    { id: 'profile', label: 'Profile', icon: 'settings' }
  ]}
  activeTab={activeTab}
  onTabChange={setActiveTab}
/>

// Filled variant at top (icon-only)
<NavigationBar 
  tabs={tabs}
  activeTab={activeTab}
  onTabChange={setActiveTab}
  variant="filled"
  position="top"
  showLabels={false}
/>
```

---

## Usage Guidelines

### When to Use Organisms

- **PageHeader**: Every screen should have a consistent header
- **SearchBar**: Lists/tables with search/filter functionality
- **VehicleCard**: Vehicle lists, galleries, or previews
- **MetricCard**: Dashboard screens, analytics views
- **Form**: Any data entry screen
- **DataTable**: Admin screens, data management views
- **NavigationBar**: Main app navigation or section navigation

### Composition Patterns

```tsx
// Dashboard screen
<View>
  <PageHeader title="Dashboard" />
  <ScrollView>
    <View style={{ flexDirection: 'row', gap: 16 }}>
      <MetricCard {...metrics.vehicles} />
      <MetricCard {...metrics.maintenance} />
      <MetricCard {...metrics.costs} />
    </View>
    <DataTable {...recentActivity} />
  </ScrollView>
  <NavigationBar {...navigation} />
</View>

// List screen with search
<View>
  <PageHeader title="Vehicles" actions={headerActions} />
  <SearchBar {...searchProps} />
  <FlatList
    data={filteredVehicles}
    renderItem={({ item }) => <VehicleCard {...item} />}
  />
  <NavigationBar {...navigation} />
</View>
```

### Performance Optimization

```tsx
// Memoize complex organisms
const MemoizedVehicleCard = React.memo(VehicleCard);
const MemoizedDataTable = React.memo(DataTable);

// Use keyExtractor for lists
<DataTable
  data={vehicles}
  columns={columns}
  keyExtractor={(item) => item.id}
/>
```

---

## Accessibility

### Keyboard Navigation

All interactive organism components support keyboard navigation:
- **PageHeader**: Back button and actions are focusable
- **SearchBar**: Input is focusable, Esc clears input
- **Form**: Tab navigation through fields
- **DataTable**: Arrow keys for row navigation
- **NavigationBar**: Tab/Arrow keys for tab navigation

### Screen Reader Support

```tsx
// PageHeader announces title and actions
<PageHeader title="Settings" /> 
// Announces: "Settings page"

// MetricCard announces value and trend
<MetricCard label="Revenue" value="$1,500" trendDirection="up" trendValue="12%" />
// Announces: "Revenue metric card, $1,500, trending up by 12%"

// Form announces validation errors
<Form fields={fields} onSubmit={handleSubmit} />
// Announces: "Field name is required" when invalid

// NavigationBar announces active tab
<NavigationBar tabs={tabs} activeTab="home" onTabChange={setTab} />
// Announces: "Home tab, selected, 1 of 4"
```

### Focus Management

```tsx
// Auto-focus search input
<SearchBar value={query} onChangeText={setQuery} autoFocus />

// Focus first input in form
<Form fields={fields} onSubmit={handleSubmit} autoFocus />

// Announce dynamic updates
<MetricCard 
  label="Messages"
  value={messageCount}
  aria-live="polite" // Announces count changes
/>
```

### Color Contrast

All organisms maintain **WCAG AA** contrast ratios:
- Text on backgrounds: ≥ 4.5:1
- Interactive elements: ≥ 3:1
- Focus indicators: ≥ 3:1

### Touch Targets

All interactive elements meet **minimum 44x44pt** touch target size:
- PageHeader actions: 44x44pt
- SearchBar buttons: 44x44pt
- VehicleCard actions: 44x44pt
- Form inputs: Full width, 52pt height
- DataTable rows: Full width, 56pt height
- NavigationBar tabs: Minimum 48pt height

---

## Testing

See `__tests__` directory for comprehensive test coverage including:
- Rendering tests
- Interaction tests
- Accessibility tests
- Loading state tests
- Validation tests
- Edge case tests

---

## Migration from Legacy Components

```tsx
// Before (legacy)
<Header title="Vehicles" onBack={goBack} />

// After (organism)
<PageHeader title="Vehicles" showBack />

// Before (legacy)
<VehicleList items={vehicles} onItemPress={handlePress} />

// After (organism)
<FlatList
  data={vehicles}
  renderItem={({ item }) => <VehicleCard {...item} onPress={handlePress} />}
/>
```

---

**Design System Version**: Phase 4 - Organisms  
**Last Updated**: Phase 4 Completion  
**Total Components**: 7 organisms
