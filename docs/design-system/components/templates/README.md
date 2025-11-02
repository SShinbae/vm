# Template Components

Template components provide complete page layouts that combine organisms, molecules, and atoms into reusable screen patterns. They handle common layout concerns like headers, navigation, loading states, and content organization.

## Overview

Templates are the highest level in our atomic design system hierarchy. They define the structure of entire screens and handle layout-level concerns like:

- Page structure and composition
- Loading and error states
- Pull-to-refresh functionality
- Keyboard handling
- Safe area management
- Navigation patterns

## Available Templates

### PageLayout
Standard page wrapper for all screens with header, content, and footer sections.

### DashboardLayout
Multi-section dashboard layout for overview/home screens.

### DetailLayout
Detail/profile page layout with hero section and tabbed content.

### FormLayout
Form page layout with single or multi-step support.

### ListLayout
List/index page layout with search, filtering, and pagination.

---

## PageLayout

Universal page wrapper that provides consistent structure for all screen types.

### Features
- Integrated page header
- Scrollable or fixed content
- Footer section support
- Loading state with spinner
- Error state with retry
- Keyboard aware mode
- Safe area handling
- Custom padding options

### Props

```typescript
interface PageLayoutProps {
  // Header configuration (optional)
  header?: PageHeaderProps;
  
  // Main content
  children: ReactNode;
  
  // Footer content (optional)
  footer?: ReactNode;
  
  // Layout behavior
  scrollable?: boolean; // default: true
  padding?: keyof typeof tokens.spacing; // default: 'md'
  safeArea?: boolean; // default: true
  keyboardAware?: boolean; // default: false
  
  // States
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}
```

### Usage Examples

#### Basic Page

```tsx
import { PageLayout } from '@/lib/design-system/components/templates';

function MyScreen() {
  return (
    <PageLayout header={{ title: 'My Screen' }}>
      <Text>Screen content goes here</Text>
    </PageLayout>
  );
}
```

#### Page with Loading State

```tsx
function MyScreen() {
  const { data, isLoading, error, refetch } = useQuery();
  
  return (
    <PageLayout
      header={{ title: 'My Data' }}
      loading={isLoading}
      error={error?.message}
      onRetry={refetch}
    >
      {data && <DataDisplay data={data} />}
    </PageLayout>
  );
}
```

#### Page with Footer Actions

```tsx
function FormScreen() {
  return (
    <PageLayout
      header={{ title: 'Edit Profile', showBackButton: true }}
      footer={
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <Button variant="outline" onPress={handleCancel}>Cancel</Button>
          <Button onPress={handleSave}>Save</Button>
        </View>
      }
      keyboardAware
    >
      <FormFields />
    </PageLayout>
  );
}
```

#### Non-Scrollable Page

```tsx
function FixedLayoutScreen() {
  return (
    <PageLayout
      header={{ title: 'Camera' }}
      scrollable={false}
      padding="none"
    >
      <CameraView style={{ flex: 1 }} />
    </PageLayout>
  );
}
```

---

## DashboardLayout

Multi-section dashboard layout for overview screens with metrics, charts, and activity feeds.

### Features
- Flexible section composition
- Metrics grid section
- Charts/visualizations section
- Quick actions section
- Recent activity feed
- Custom sections support
- Pull-to-refresh enabled
- Automatic spacing between sections

### Props

```typescript
interface DashboardLayoutProps {
  // Required header
  header: PageHeaderProps;
  
  // Standard sections (all optional)
  metrics?: ReactNode;
  charts?: ReactNode;
  quickActions?: ReactNode;
  recentActivity?: ReactNode;
  
  // Additional custom sections
  customSections?: ReactNode[];
  
  // Pull to refresh
  refreshable?: boolean; // default: true
  onRefresh?: () => void;
  refreshing?: boolean;
}
```

### Usage Examples

#### Full Dashboard

```tsx
import { DashboardLayout } from '@/lib/design-system/components/templates';
import { MetricCard } from '@/lib/design-system/components/organisms';

function Dashboard() {
  const { data, refetch, isRefreshing } = useDashboardData();
  
  return (
    <DashboardLayout
      header={{ title: 'Dashboard', actions: [{ icon: 'settings', onPress: openSettings }] }}
      metrics={
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <MetricCard label="Total Vehicles" value={data.totalVehicles} />
          <MetricCard label="Active Logs" value={data.activeLogs} />
        </View>
      }
      charts={
        <ChartSection data={data.fuelTrends} />
      }
      quickActions={
        <QuickActionGrid
          actions={[
            { icon: 'add', label: 'Add Log', onPress: addLog },
            { icon: 'car', label: 'Add Vehicle', onPress: addVehicle },
          ]}
        />
      }
      recentActivity={
        <ActivityFeed items={data.recentLogs} />
      }
      onRefresh={refetch}
      refreshing={isRefreshing}
    />
  );
}
```

#### Minimal Dashboard

```tsx
function SimpleDashboard() {
  return (
    <DashboardLayout
      header={{ title: 'Overview' }}
      metrics={<MetricsGrid />}
      quickActions={<ActionButtons />}
    />
  );
}
```

#### Dashboard with Custom Sections

```tsx
function ExtendedDashboard() {
  return (
    <DashboardLayout
      header={{ title: 'Home' }}
      metrics={<MetricsSection />}
      customSections={[
        <UpcomingMaintenance key="maintenance" />,
        <RecentAlerts key="alerts" />,
        <TipsAndTricks key="tips" />,
      ]}
    />
  );
}
```

---

## DetailLayout

Detail/profile page layout with hero section, tabbed content, and related items.

### Features
- Hero section for primary content
- Horizontal scrollable tabs
- Tab badges for counts/notifications
- Controlled/uncontrolled tab state
- Related items section
- Bottom action buttons
- Pull-to-refresh support
- Accessibility optimized tabs

### Props

```typescript
interface DetailTab {
  id: string;
  label: string;
  content: ReactNode;
  badge?: number; // optional badge count
}

interface DetailLayoutProps {
  // Required header
  header: PageHeaderProps;
  
  // Hero section (optional)
  hero?: ReactNode;
  
  // Tabs configuration
  tabs?: DetailTab[];
  activeTab?: string; // for controlled tabs
  onTabChange?: (tabId: string) => void;
  
  // Additional sections
  relatedItems?: ReactNode;
  actions?: ReactNode; // bottom action buttons
  
  // Pull to refresh
  onRefresh?: () => void;
  refreshing?: boolean;
}
```

### Usage Examples

#### Vehicle Detail Page

```tsx
import { DetailLayout } from '@/lib/design-system/components/templates';

function VehicleDetail({ vehicleId }: Props) {
  const { vehicle, logs, maintenance } = useVehicleData(vehicleId);
  
  const tabs = [
    {
      id: 'overview',
      label: 'Overview',
      content: <VehicleOverview vehicle={vehicle} />,
    },
    {
      id: 'logs',
      label: 'Logs',
      badge: logs.length,
      content: <LogsList logs={logs} />,
    },
    {
      id: 'maintenance',
      label: 'Maintenance',
      badge: maintenance.upcoming,
      content: <MaintenanceSchedule items={maintenance.items} />,
    },
  ];
  
  return (
    <DetailLayout
      header={{
        title: vehicle.name,
        subtitle: vehicle.plate,
        showBackButton: true,
        actions: [
          { icon: 'edit', onPress: editVehicle },
          { icon: 'share', onPress: shareVehicle },
        ],
      }}
      hero={<VehicleHeroImage image={vehicle.image} />}
      tabs={tabs}
      relatedItems={<RelatedVehicles groupId={vehicle.groupId} />}
      actions={
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <Button variant="outline" onPress={addLog}>Add Log</Button>
          <Button onPress={scheduleMaintenance}>Schedule Service</Button>
        </View>
      }
    />
  );
}
```

#### Controlled Tabs

```tsx
function ProfilePage() {
  const [activeTab, setActiveTab] = useState('info');
  
  return (
    <DetailLayout
      header={{ title: 'Profile' }}
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={setActiveTab}
    />
  );
}
```

#### Without Hero Section

```tsx
function LogDetail({ logId }: Props) {
  const tabs = [
    { id: 'details', label: 'Details', content: <LogDetails /> },
    { id: 'expenses', label: 'Expenses', content: <ExpenseBreakdown /> },
  ];
  
  return (
    <DetailLayout
      header={{ title: 'Log Entry', showBackButton: true }}
      tabs={tabs}
    />
  );
}
```

---

## FormLayout

Form page layout with single or multi-step support, progress tracking, and validation.

### Features
- Single-step form support
- Multi-step form wizard
- Dot-based progress indicator
- Step navigation (Previous/Next)
- Validation error summary
- Optional step support
- Keyboard aware scrolling
- Submit/Cancel actions
- Loading state support

### Props

```typescript
interface FormStep {
  id: string;
  title: string;
  description?: string;
  content: ReactNode;
  optional?: boolean;
}

interface FormLayoutProps {
  // Optional header
  header?: PageHeaderProps;
  
  // Form metadata
  title?: string;
  description?: string;
  
  // Multi-step configuration
  steps?: FormStep[];
  currentStep?: number; // controlled step index
  onStepChange?: (stepIndex: number) => void;
  
  // Single-step content
  children?: ReactNode;
  
  // Button labels
  submitLabel?: string; // default: 'Submit'
  previousLabel?: string; // default: 'Previous'
  nextLabel?: string; // default: 'Next'
  
  // Actions
  onSubmit: () => void;
  onCancel?: () => void;
  
  // Validation
  errors?: Record<string, string>;
  
  // State
  loading?: boolean;
}
```

### Usage Examples

#### Single-Step Form

```tsx
import { FormLayout } from '@/lib/design-system/components/templates';

function CreateVehicleForm() {
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  return (
    <FormLayout
      header={{ title: 'Add Vehicle', showBackButton: true }}
      title="Vehicle Information"
      description="Enter the details of your vehicle"
      onSubmit={handleSubmit}
      onCancel={handleCancel}
      submitLabel="Create Vehicle"
      errors={errors}
      loading={isSubmitting}
    >
      <Input label="Name" value={name} onChangeText={setName} />
      <Input label="License Plate" value={plate} onChangeText={setPlate} />
      <Input label="Make" value={make} onChangeText={setMake} />
      <Input label="Model" value={model} onChangeText={setModel} />
      <Input label="Year" value={year} onChangeText={setYear} keyboardType="numeric" />
    </FormLayout>
  );
}
```

#### Multi-Step Form

```tsx
function VehicleOnboarding() {
  const [currentStep, setCurrentStep] = useState(0);
  
  const steps = [
    {
      id: 'basic',
      title: 'Basic Information',
      description: 'Start with the basics',
      content: <BasicInfoFields />,
    },
    {
      id: 'details',
      title: 'Vehicle Details',
      description: 'Tell us more about your vehicle',
      content: <DetailFields />,
      optional: true,
    },
    {
      id: 'preferences',
      title: 'Preferences',
      description: 'Set up tracking preferences',
      content: <PreferenceFields />,
    },
  ];
  
  return (
    <FormLayout
      header={{ title: 'Add Vehicle', showBackButton: true }}
      steps={steps}
      currentStep={currentStep}
      onStepChange={setCurrentStep}
      onSubmit={handleComplete}
      onCancel={handleCancel}
      submitLabel="Complete Setup"
    />
  );
}
```

#### Form with Validation Errors

```tsx
function EditProfileForm() {
  const [errors, setErrors] = useState({
    email: 'Email is required',
    phone: 'Invalid phone number format',
  });
  
  return (
    <FormLayout
      title="Edit Profile"
      onSubmit={handleSubmit}
      errors={errors}
    >
      <Input label="Email" error={errors.email} />
      <Input label="Phone" error={errors.phone} />
    </FormLayout>
  );
}
```

---

## ListLayout

List/index page layout with search, filtering, pagination, and empty states.

### Features
- SearchBar integration
- Generic type support
- Empty state handling
- Loading state
- Pull-to-refresh
- Infinite scroll support
- Item separators
- List header/footer sections
- Filter/sort integration

### Props

```typescript
interface ListLayoutProps<T> {
  // Optional header
  header?: PageHeaderProps;
  
  // Search and filtering
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  onFilterPress?: () => void;
  onSortPress?: () => void;
  activeFilters?: number; // badge count
  
  // List data (required)
  data: T[];
  renderItem: ListRenderItem<T>;
  keyExtractor?: (item: T, index: number) => string;
  
  // Empty state
  emptyMessage?: string; // default: 'No items found'
  emptyComponent?: ReactNode;
  
  // List sections
  listHeader?: ReactNode;
  listFooter?: ReactNode;
  
  // Pull to refresh
  refreshable?: boolean; // default: true
  onRefresh?: () => void;
  refreshing?: boolean;
  
  // Infinite scroll
  onLoadMore?: () => void;
  loadingMore?: boolean;
  hasMore?: boolean;
  
  // State
  loading?: boolean;
}
```

### Usage Examples

#### Basic List

```tsx
import { ListLayout } from '@/lib/design-system/components/templates';

interface Vehicle {
  id: string;
  name: string;
  plate: string;
}

function VehiclesList() {
  const { vehicles, isLoading } = useVehicles();
  
  return (
    <ListLayout<Vehicle>
      header={{ title: 'My Vehicles' }}
      data={vehicles}
      renderItem={({ item }) => (
        <VehicleCard vehicle={item} onPress={() => navigate(item.id)} />
      )}
      keyExtractor={(item) => item.id}
      loading={isLoading}
      emptyMessage="No vehicles yet. Add your first vehicle!"
    />
  );
}
```

#### List with Search and Filters

```tsx
function SearchableVehiclesList() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState(0);
  const { vehicles, isLoading, refetch } = useVehicles({ search: searchQuery });
  
  return (
    <ListLayout<Vehicle>
      header={{
        title: 'Vehicles',
        actions: [{ icon: 'add', onPress: addVehicle }],
      }}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      onFilterPress={openFilterSheet}
      onSortPress={openSortSheet}
      activeFilters={activeFilters}
      data={vehicles}
      renderItem={({ item }) => <VehicleCard vehicle={item} />}
      onRefresh={refetch}
    />
  );
}
```

#### List with Infinite Scroll

```tsx
function InfiniteLogsList() {
  const {
    logs,
    isLoading,
    hasMore,
    loadMore,
    isLoadingMore,
  } = useInfiniteLogs();
  
  return (
    <ListLayout<Log>
      header={{ title: 'All Logs' }}
      data={logs}
      renderItem={({ item }) => <LogListItem log={item} />}
      loading={isLoading}
      onLoadMore={loadMore}
      loadingMore={isLoadingMore}
      hasMore={hasMore}
    />
  );
}
```

#### List with Custom Empty State

```tsx
function CustomEmptyList() {
  return (
    <ListLayout<Vehicle>
      data={[]}
      renderItem={({ item }) => <VehicleCard vehicle={item} />}
      emptyComponent={
        <EmptyState
          icon="car"
          title="No Vehicles"
          description="Start tracking by adding your first vehicle"
          action={<Button onPress={addVehicle}>Add Vehicle</Button>}
        />
      }
    />
  );
}
```

#### List with Header and Footer

```tsx
function VehiclesWithStats() {
  const { vehicles, stats } = useVehiclesData();
  
  return (
    <ListLayout<Vehicle>
      data={vehicles}
      renderItem={({ item }) => <VehicleCard vehicle={item} />}
      listHeader={
        <StatsCard
          totalVehicles={stats.total}
          totalMileage={stats.mileage}
        />
      }
      listFooter={
        <Text style={{ textAlign: 'center', padding: 16 }}>
          Showing {vehicles.length} of {stats.total} vehicles
        </Text>
      }
    />
  );
}
```

---

## Composition Patterns

### Combining Templates with Organisms

Templates are designed to work seamlessly with organism components:

```tsx
// Dashboard using MetricCard, ChartCard organisms
<DashboardLayout
  metrics={
    <>
      <MetricCard label="Total Distance" value="12,450 km" />
      <MetricCard label="Fuel Cost" value="$1,234" trend={5.2} />
    </>
  }
  charts={
    <ChartCard title="Fuel Consumption">
      <LineChart data={fuelData} />
    </ChartCard>
  }
/>

// List using VehicleCard organism
<ListLayout
  data={vehicles}
  renderItem={({ item }) => (
    <VehicleCard
      vehicle={item}
      metrics={[
        { label: 'Mileage', value: item.mileage },
        { label: 'MPG', value: item.mpg },
      ]}
      onPress={() => navigate(item.id)}
    />
  )}
/>
```

### Nested Templates

While not common, templates can be nested for complex flows:

```tsx
function MultiStepFormWithPreview() {
  return (
    <FormLayout steps={steps}>
      {/* Step 3 shows a preview using DetailLayout */}
      <DetailLayout
        hero={<VehiclePreview data={formData} />}
        tabs={[
          { id: 'info', label: 'Information', content: <InfoPreview /> },
          { id: 'settings', label: 'Settings', content: <SettingsPreview /> },
        ]}
      />
    </FormLayout>
  );
}
```

### Template Variations

Create specialized variations by wrapping templates:

```tsx
// Modal form variant
function ModalForm({ onClose, ...props }: ModalFormProps) {
  return (
    <FormLayout
      header={{
        title: props.title,
        leftAction: { icon: 'close', onPress: onClose },
      }}
      {...props}
    />
  );
}

// Compact list variant
function CompactList<T>(props: CompactListProps<T>) {
  return (
    <ListLayout
      {...props}
      header={undefined} // no header
      refreshable={false} // no pull-to-refresh
      searchQuery={undefined} // no search
    />
  );
}
```

---

## Screen Migration Guide

### Converting Existing Screens to Templates

#### Before (Manual Layout)

```tsx
function VehicleListScreen() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={styles.header}>
        <Text style={styles.title}>Vehicles</Text>
        <Pressable onPress={addVehicle}>
          <Icon name="add" />
        </Pressable>
      </View>
      <SearchBar value={search} onChangeText={setSearch} />
      <FlatList
        data={vehicles}
        renderItem={renderVehicle}
        ListEmptyComponent={<Text>No vehicles</Text>}
      />
    </SafeAreaView>
  );
}
```

#### After (Template)

```tsx
function VehicleListScreen() {
  return (
    <ListLayout
      header={{
        title: 'Vehicles',
        actions: [{ icon: 'add', onPress: addVehicle }],
      }}
      searchQuery={search}
      onSearchChange={setSearch}
      data={vehicles}
      renderItem={renderVehicle}
      emptyMessage="No vehicles"
    />
  );
}
```

### Benefits of Migration

1. **Consistency**: All screens follow the same layout patterns
2. **Less Code**: Templates handle common concerns automatically
3. **Accessibility**: Built-in accessibility features
4. **Responsive**: Proper safe area and keyboard handling
5. **Maintainable**: Changes to layout logic happen in one place
6. **Testable**: Template behavior is already tested

### Migration Checklist

- [ ] Identify screen type (list, detail, form, dashboard, or custom)
- [ ] Choose appropriate template
- [ ] Extract header configuration from existing layout
- [ ] Move content into template children/sections
- [ ] Remove manual SafeAreaView, ScrollView wrappers
- [ ] Remove manual loading/error state UI
- [ ] Remove manual keyboard handling
- [ ] Update navigation if header actions changed
- [ ] Test pull-to-refresh if applicable
- [ ] Verify accessibility with screen reader

---

## Best Practices

### 1. Choose the Right Template

- **PageLayout**: Generic screens, settings, about pages
- **DashboardLayout**: Home screens, overviews, analytics
- **DetailLayout**: Item details, profiles, reports
- **FormLayout**: Create/edit screens, onboarding, surveys
- **ListLayout**: Index pages, search results, catalogs

### 2. Keep Content Components Separate

```tsx
// Good: Content components are separate
function VehicleDetail() {
  return (
    <DetailLayout hero={<VehicleHero />} tabs={tabs}>
      {/* Template handles layout, components handle content */}
    </DetailLayout>
  );
}

// Avoid: Mixing template logic with content logic
function VehicleDetail() {
  return (
    <ScrollView>
      {/* Manual layout mixed with content */}
    </ScrollView>
  );
}
```

### 3. Use Template Features

Don't reimplement what templates provide:

```tsx
// Good: Use template's loading state
<PageLayout loading={isLoading}>
  <Content />
</PageLayout>

// Avoid: Manual loading UI
<PageLayout>
  {isLoading ? <Spinner /> : <Content />}
</PageLayout>
```

### 4. Leverage Composition

Build complex UIs by composing templates with organisms:

```tsx
<ListLayout
  header={<PageHeader />}  // Organism
  data={items}
  renderItem={({ item }) => <ItemCard item={item} />}  // Organism
  emptyComponent={<EmptyState />}  // Organism
/>
```

### 5. Handle States Properly

```tsx
// Good: Let template handle states
<ListLayout
  data={vehicles}
  loading={isLoading}
  error={error}
  onRetry={refetch}
/>

// Avoid: Conditional rendering outside template
{isLoading ? (
  <Spinner />
) : error ? (
  <Error />
) : (
  <ListLayout data={vehicles} />
)}
```

### 6. Maintain Type Safety

Use generic types for type-safe list rendering:

```tsx
// Good: Type-safe
<ListLayout<Vehicle>
  data={vehicles}
  renderItem={({ item }) => {
    // item is typed as Vehicle
    return <VehicleCard vehicle={item} />;
  }}
/>

// Avoid: Untyped
<ListLayout
  data={vehicles}
  renderItem={({ item }) => {
    // item is any
  }}
/>
```

---

## Accessibility

All templates include built-in accessibility features:

### Screen Readers
- Proper heading hierarchy
- Semantic roles for UI elements
- Descriptive labels for actions
- State announcements (loading, errors)

### Keyboard Navigation
- Tab order follows visual hierarchy
- Focus management for modals/sheets
- Keyboard shortcuts where applicable

### Motion
- Respects reduced motion preferences
- Smooth scrolling with proper feedback
- Loading indicators for async operations

### Testing
```tsx
// Test accessibility in your screens
import { render } from '@testing-library/react-native';

test('should be accessible', () => {
  const { getByRole, getByLabelText } = render(
    <ListLayout
      header={{ title: 'Vehicles' }}
      data={vehicles}
      renderItem={renderItem}
    />
  );
  
  expect(getByRole('header')).toBeTruthy();
  expect(getByLabelText('Search vehicles')).toBeTruthy();
});
```

---

## Performance Considerations

### List Optimization

```tsx
// Use keyExtractor for stable keys
<ListLayout
  data={items}
  keyExtractor={(item) => item.id}  // Not index!
  renderItem={renderItem}
/>

// Memoize render functions
const renderItem = useCallback(({ item }) => (
  <ItemCard item={item} />
), []);
```

### Avoid Inline Functions

```tsx
// Good: Stable references
const handleSearch = useCallback((query: string) => {
  setSearch(query);
}, []);

<ListLayout onSearchChange={handleSearch} />

// Avoid: New function every render
<ListLayout onSearchChange={(q) => setSearch(q)} />
```

### Lazy Loading

```tsx
// Implement infinite scroll for large lists
<ListLayout
  data={items}
  onLoadMore={loadNextPage}
  hasMore={hasNextPage}
  loadingMore={isLoadingMore}
/>
```

---

## Common Patterns

### Search with Debounce

```tsx
function SearchableList() {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 300);
  const { data } = useSearch(debouncedQuery);
  
  return (
    <ListLayout
      searchQuery={query}
      onSearchChange={setQuery}
      data={data}
      renderItem={renderItem}
    />
  );
}
```

### Optimistic Updates

```tsx
function VehiclesList() {
  const { vehicles, deleteVehicle } = useVehicles();
  const [optimisticData, setOptimisticData] = useState(vehicles);
  
  const handleDelete = async (id: string) => {
    // Optimistically remove
    setOptimisticData(prev => prev.filter(v => v.id !== id));
    
    try {
      await deleteVehicle(id);
    } catch (error) {
      // Revert on error
      setOptimisticData(vehicles);
    }
  };
  
  return (
    <ListLayout
      data={optimisticData}
      renderItem={({ item }) => (
        <VehicleCard vehicle={item} onDelete={() => handleDelete(item.id)} />
      )}
    />
  );
}
```

### Persistent State

```tsx
function StatefulList() {
  const [activeTab, setActiveTab] = usePersistedState('detailTab', 'overview');
  
  return (
    <DetailLayout
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={setActiveTab}  // Persists across navigation
    />
  );
}
```

---

## Troubleshooting

### Template Not Scrolling

**Problem**: Content doesn't scroll
**Solution**: Ensure `scrollable={true}` (default) and avoid nested ScrollViews

```tsx
// Good
<PageLayout>
  <View>Content</View>
</PageLayout>

// Avoid
<PageLayout>
  <ScrollView>Content</ScrollView>  {/* Nested scrolling */}
</PageLayout>
```

### Keyboard Covering Input

**Problem**: Keyboard overlaps form fields
**Solution**: Enable `keyboardAware` prop

```tsx
<PageLayout keyboardAware>
  <FormFields />
</PageLayout>
```

### Pull-to-Refresh Not Working

**Problem**: Pull gesture doesn't trigger refresh
**Solution**: Provide `onRefresh` handler

```tsx
<ListLayout
  data={items}
  onRefresh={refetch}  // Must provide handler
  refreshing={isRefreshing}
/>
```

### Types Not Working

**Problem**: TypeScript errors with ListLayout
**Solution**: Specify generic type parameter

```tsx
// Good
<ListLayout<MyType> data={items} ... />

// Avoid
<ListLayout data={items} ... />  // Type inference may fail
```

---

## Testing Templates

### Unit Tests

```tsx
import { render, screen } from '@testing-library/react-native';
import { ListLayout } from '@/lib/design-system/components/templates';

test('renders list items', () => {
  const items = [
    { id: '1', name: 'Item 1' },
    { id: '2', name: 'Item 2' },
  ];
  
  render(
    <ListLayout
      data={items}
      renderItem={({ item }) => <Text>{item.name}</Text>}
    />
  );
  
  expect(screen.getByText('Item 1')).toBeTruthy();
  expect(screen.getByText('Item 2')).toBeTruthy();
});
```

### Integration Tests

```tsx
test('handles search', async () => {
  const { getByPlaceholderText, queryByText } = render(
    <VehiclesList />
  );
  
  const searchInput = getByPlaceholderText('Search...');
  fireEvent.changeText(searchInput, 'Toyota');
  
  await waitFor(() => {
    expect(queryByText('Honda Civic')).toBeNull();
    expect(getByText('Toyota Camry')).toBeTruthy();
  });
});
```

---

## API Reference Summary

| Template | Primary Use Case | Key Features |
|----------|-----------------|--------------|
| PageLayout | Generic screens | Header, footer, loading, error states |
| DashboardLayout | Overview screens | Multiple sections, metrics, charts |
| DetailLayout | Detail pages | Hero, tabs, related items |
| FormLayout | Forms & wizards | Multi-step, validation, progress |
| ListLayout | Index pages | Search, filter, pagination |

---

## Related Documentation

- [Organism Components](../organisms/README.md) - Higher-level components used within templates
- [Molecule Components](../molecules/README.md) - Mid-level components for UI patterns
- [Atom Components](../atoms/README.md) - Basic building blocks
- [Design Tokens](../../tokens/README.md) - Spacing, colors, typography
- [Navigation Guide](../../../navigation/README.md) - Screen navigation patterns

---

## Support

For questions or issues with template components:
1. Check this documentation
2. Review usage examples in the codebase
3. Check component test files for edge cases
4. Consult the design system team

Last updated: November 2, 2025
