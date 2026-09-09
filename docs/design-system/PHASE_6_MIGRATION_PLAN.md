# Phase 6: Screen Migration Plan

> [!WARNING]
> **Stalled and superseded.** Marked "In Progress" since November 2025; the
> migration did not complete. See the Notion design-system page for current state:
> https://app.notion.com/p/3d571adddf1081deb516f32e693152df
> The screen inventory below is still accurate and worth keeping.

**Status**: In Progress  
**Started**: November 2, 2025  
**Estimated Duration**: 2-3 weeks

---

## 📊 Screen Inventory & Analysis

### Current Screen Count: 15+ screens

#### **High Priority (Week 1)**

1. **Dashboard/Home** - `app/(tabs)/index.tsx` (945 lines)
   - Template: `DashboardLayout`
   - Components: Metrics, charts, recent activity, quick actions
   - Complexity: High (multiple data sources, stats calculations)
   - Estimated reduction: 70% (945 → ~280 lines)

2. **Vehicles List** - `app/(tabs)/vehicles.tsx` (1,487 lines)
   - Template: `ListLayout`
   - Components: Search bar, filter chips, vehicle cards, stats
   - Complexity: High (search, filter, bottom sheet, stats)
   - Estimated reduction: 65% (1,487 → ~520 lines)

3. **Vehicle Detail** - `app/vehicles/[id].tsx`
   - Template: `DetailLayout`
   - Components: Hero section, tabbed content, actions
   - Complexity: Medium (tabs, data fetching)
   - Estimated reduction: 60%

4. **Add/Edit Vehicle** - `app/vehicles/add.tsx`
   - Template: `FormLayout`
   - Components: Multi-step form, image upload, validation
   - Complexity: High (form validation, image handling)
   - Estimated reduction: 70%

#### **Medium Priority (Week 2)**

5. **Logs List** - `app/(tabs)/logs.tsx` (1,178 lines)
   - Template: `ListLayout` with tabs
   - Components: Tab bar, log cards, swipe actions
   - Complexity: High (3 log types, swipe delete, permissions)
   - Estimated reduction: 65% (1,178 → ~410 lines)

6. **Add Mileage Log** - `app/logs/mileage/add.tsx`
   - Template: `FormLayout`
   - Components: Form fields, vehicle selector
   - Complexity: Medium
   - Estimated reduction: 65%

7. **Add Fuel Log** - `app/logs/fuel/add.tsx`
   - Template: `FormLayout`
   - Components: Form fields, receipt upload
   - Complexity: Medium
   - Estimated reduction: 65%

8. **Add Service Log** - `app/logs/service/add.tsx`
   - Template: `FormLayout`
   - Components: Service items, receipt upload
   - Complexity: High (service items array)
   - Estimated reduction: 60%

9. **Groups** - `app/(tabs)/groups.tsx`
   - Template: `ListLayout`
   - Components: Group cards, member lists
   - Complexity: Medium
   - Estimated reduction: 60%

#### **Low Priority (Week 3)**

10. **Profile/Settings** - `app/(tabs)/profile.tsx`
    - Template: `PageLayout`
    - Components: Settings sections, theme toggle
    - Complexity: Low
    - Estimated reduction: 55%

11. **Notifications** - `app/notifications.tsx`
    - Template: `ListLayout`
    - Components: Notification cards
    - Complexity: Low
    - Estimated reduction: 60%

12. **Authentication screens** - `app/(auth)/`
    - Template: `PageLayout` or `FormLayout`
    - Components: Login/signup forms
    - Complexity: Low
    - Estimated reduction: 50%

---

## 🎯 Migration Strategy

### Phase-by-Phase Approach

#### **Week 1: High Priority Screens**

**Days 1-2**: Dashboard Migration

- Extract stats calculation logic to hooks
- Create metric card components using design system
- Implement DashboardLayout with sections
- Test all data fetching and display

**Days 3-4**: Vehicles List Migration

- Implement ListLayout with search and filters
- Create VehicleCard using design system components
- Migrate bottom sheet to design system Modal
- Test search, filter, and navigation

**Days 5-7**: Vehicle Detail & Add/Edit

- Implement DetailLayout with hero and tabs
- Create form using FormLayout template
- Migrate image upload component
- Test CRUD operations

#### **Week 2: Medium Priority Screens**

**Days 1-3**: Logs Screens Migration

- Implement ListLayout with custom tabs
- Create log card components
- Migrate swipe actions
- Test all log types and permissions

**Days 4-5**: Log Forms Migration

- Implement FormLayout for each log type
- Create reusable form field components
- Test form validation and submission

#### **Week 3: Low Priority & Polish**

**Days 1-2**: Remaining Screens

- Migrate profile, notifications, auth screens
- Test all navigation flows

**Days 3-5**: Testing & Documentation

- Visual regression testing
- Performance testing
- Accessibility testing
- Update documentation

---

## 🔄 Migration Process (Per Screen)

### 1. **Pre-Migration Checklist**

- [ ] Read entire screen file
- [ ] Document current features and functionality
- [ ] Identify all components used
- [ ] Map to design system equivalents
- [ ] List any custom components needed
- [ ] Identify template type (Dashboard, List, Detail, Form, Page)

### 2. **Migration Steps**

#### Step 1: Create New File Structure

```typescript
// Before: Inline styles, mixed components
import { View, Text, StyleSheet } from "react-native";

// After: Design system imports
import { DashboardLayout, Card, Text, Spacer } from "@/lib/design-system";
import { PageHeader } from "@/lib/design-system/components/organisms";
```

#### Step 2: Replace Layout Wrapper

```typescript
// Before: Manual SafeAreaView + ScrollView
<SafeAreaView>
  <ScrollView>
    <View style={styles.header}>...</View>
    <View style={styles.content}>...</View>
  </ScrollView>
</SafeAreaView>

// After: Template layout
<DashboardLayout
  header={{
    title: "Dashboard",
    showBack: false,
    actions: [...]
  }}
  metrics={<MetricsSection />}
  charts={<ChartsSection />}
  quickActions={<QuickActionsSection />}
/>
```

#### Step 3: Replace Components

```typescript
// Before: Custom card with styles
<View style={styles.card}>
  <Text style={styles.cardTitle}>Total Vehicles</Text>
  <Text style={styles.cardValue}>{stats.totalVehicles}</Text>
</View>

// After: Design system Card
<Card variant="elevated" padding="md">
  <Text variant="label" size="sm" color="secondary">
    Total Vehicles
  </Text>
  <Spacer size="xs" />
  <Text variant="heading" size="xl">
    {stats.totalVehicles}
  </Text>
</Card>
```

#### Step 4: Remove Old Styles

```typescript
// Before: Large StyleSheet
const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  header: { flexDirection: "row", justifyContent: "space-between" },
  card: { backgroundColor: "#fff", borderRadius: 8, padding: 16 },
  // ... 50+ more styles
});

// After: Minimal or no custom styles (tokens handle everything)
// Only custom styles for truly unique layouts
const styles = StyleSheet.create({
  customGrid: {
    /* only if needed */
  },
});
```

#### Step 5: Test Functionality

- [ ] Visual appearance matches original
- [ ] All interactions work (taps, swipes, navigation)
- [ ] Data fetching works correctly
- [ ] Loading/error states display properly
- [ ] Pull-to-refresh works
- [ ] Forms submit correctly
- [ ] Navigation flows work

### 3. **Post-Migration Checklist**

- [ ] All features working
- [ ] No TypeScript errors
- [ ] No console warnings
- [ ] Accessibility maintained/improved
- [ ] Performance is same or better
- [ ] Code reduced by 50%+ (target)
- [ ] Documentation updated

---

## 📐 Template Mapping Guide

### When to Use Each Template

#### **DashboardLayout** - Use for:

- Home/overview screens
- Screens with multiple metric sections
- Screens with charts and stats
- Screens with quick actions

**Examples**: Dashboard, Analytics, Reports Overview

#### **ListLayout** - Use for:

- Index/list screens
- Searchable content
- Filterable content
- Paginated data

**Examples**: Vehicles List, Logs List, Groups List, Notifications

#### **DetailLayout** - Use for:

- Detail/show pages
- Profile pages
- Screens with tabbed content
- Screens with hero sections

**Examples**: Vehicle Detail, User Profile, Group Detail

#### **FormLayout** - Use for:

- Create/edit forms
- Single or multi-step forms
- Settings screens with inputs
- Wizards

**Examples**: Add Vehicle, Edit Vehicle, Add Log, Settings

#### **PageLayout** - Use for:

- Simple content pages
- Settings pages without complex forms
- Static content
- Fallback for screens that don't fit other templates

**Examples**: About, Help, Terms of Service, Simple Settings

---

## 🔧 Common Migration Patterns

### Pattern 1: Stats/Metrics Cards

```typescript
// Before: Custom metric display
<View style={styles.statsGrid}>
  {Object.entries(stats).map(([key, value]) => (
    <View key={key} style={styles.statCard}>
      <Text style={styles.statLabel}>{key}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  ))}
</View>

// After: MetricCard organism
<View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: tokens.spacing.md }}>
  <MetricCard
    icon="car"
    label="Total Vehicles"
    value={stats.totalVehicles}
    trend={stats.totalVehiclesTrend}
  />
  <MetricCard
    icon="gauge"
    label="Total Mileage"
    value={`${stats.totalMileage} km`}
    trend={stats.totalMileageTrend}
  />
</View>
```

### Pattern 2: Search & Filter

```typescript
// Before: Custom search input and filter buttons
<View style={styles.searchContainer}>
  <TextInput
    style={styles.searchInput}
    placeholder="Search..."
    value={searchQuery}
    onChangeText={setSearchQuery}
  />
  <TouchableOpacity onPress={handleFilter}>
    <Icon name="filter" />
  </TouchableOpacity>
</View>

// After: SearchBar organism
<SearchBar
  value={searchQuery}
  onChangeText={setSearchQuery}
  placeholder="Search vehicles..."
  onFilterPress={() => setShowFilters(true)}
  onSortPress={() => setShowSort(true)}
  showFilterBadge={activeFilters > 0}
/>
```

### Pattern 3: Tab Navigation

```typescript
// Before: Custom tab bar
<View style={styles.tabBar}>
  {tabs.map(tab => (
    <TouchableOpacity
      key={tab}
      style={[styles.tab, activeTab === tab && styles.activeTab]}
      onPress={() => setActiveTab(tab)}
    >
      <Text style={activeTab === tab ? styles.activeTabText : styles.tabText}>
        {tab}
      </Text>
    </TouchableOpacity>
  ))}
</View>

// After: DetailLayout with tabs
<DetailLayout
  header={{ title: "Vehicle Details" }}
  tabs={[
    { id: 'details', label: 'Details', content: <DetailsTab /> },
    { id: 'logs', label: 'Logs', content: <LogsTab />, badge: logCount },
    { id: 'maintenance', label: 'Maintenance', content: <MaintenanceTab /> }
  ]}
  activeTab={activeTab}
  onTabChange={setActiveTab}
/>
```

### Pattern 4: Form Fields

```typescript
// Before: Manual form layout
<View style={styles.form}>
  <Text style={styles.label}>Vehicle Name</Text>
  <TextInput
    style={styles.input}
    value={name}
    onChangeText={setName}
  />
  {errors.name && <Text style={styles.error}>{errors.name}</Text>}
</View>

// After: FormLayout with Input molecule
<FormLayout
  header={{ title: "Add Vehicle" }}
  onSubmit={handleSubmit}
  submitLabel="Save Vehicle"
  errors={errors}
>
  <Input
    label="Vehicle Name"
    value={name}
    onChangeText={setName}
    error={errors.name}
    required
  />
  <Input
    label="Make"
    value={make}
    onChangeText={setMake}
  />
</FormLayout>
```

### Pattern 5: Empty States

```typescript
// Before: Conditional render
{data.length === 0 ? (
  <View style={styles.emptyState}>
    <Icon name="car" size={64} color="#ccc" />
    <Text style={styles.emptyText}>No vehicles found</Text>
    <Button onPress={() => router.push('/vehicles/add')}>
      Add Vehicle
    </Button>
  </View>
) : (
  // List items
)}

// After: ListLayout handles it
<ListLayout
  data={vehicles}
  renderItem={({ item }) => <VehicleCard vehicle={item} />}
  emptyMessage="No vehicles found"
  emptyComponent={
    <EmptyState
      icon="car"
      title="No vehicles yet"
      description="Add your first vehicle to get started"
      action={{
        label: "Add Vehicle",
        onPress: () => router.push('/vehicles/add')
      }}
    />
  }
/>
```

---

## 📊 Expected Outcomes

### Code Reduction Targets

| Screen         | Before (LOC) | After (LOC) | Reduction |
| -------------- | ------------ | ----------- | --------- |
| Dashboard      | 945          | ~280        | 70%       |
| Vehicles List  | 1,487        | ~520        | 65%       |
| Logs List      | 1,178        | ~410        | 65%       |
| Vehicle Detail | ~600         | ~240        | 60%       |
| Add Vehicle    | ~500         | ~150        | 70%       |
| **Total**      | **~4,710**   | **~1,600**  | **~66%**  |

### Quality Improvements

**Consistency**:

- ✅ All screens use same layout patterns
- ✅ Consistent spacing, colors, typography
- ✅ Unified component behavior

**Maintainability**:

- ✅ Centralized component logic
- ✅ Easier to update/fix bugs
- ✅ Less duplication

**Accessibility**:

- ✅ Built-in screen reader support
- ✅ Proper touch targets
- ✅ Keyboard navigation (web)

**Performance**:

- ✅ Optimized component rendering
- ✅ Smaller bundle size
- ✅ Faster initial render

---

## 🚨 Common Challenges & Solutions

### Challenge 1: Complex Custom Components

**Problem**: Screen has highly custom UI that doesn't fit templates

**Solution**:

1. Use `PageLayout` as base (most flexible)
2. Create custom organism if reusable
3. Use `children` prop for one-off layouts
4. Compose multiple templates if needed

### Challenge 2: State Management

**Problem**: Template doesn't handle specific state logic

**Solution**:

1. Templates are presentational - keep state in screen
2. Pass state and handlers as props
3. Extract complex logic to custom hooks
4. Use controlled components pattern

### Challenge 3: Breaking Changes

**Problem**: Migration breaks existing functionality

**Solution**:

1. Migrate incrementally (one screen at a time)
2. Test thoroughly after each migration
3. Keep feature flags for rollback
4. Document any behavior changes

### Challenge 4: Performance Regression

**Problem**: New components slower than old ones

**Solution**:

1. Use React.memo for expensive components
2. Optimize list rendering (FlatList optimizations)
3. Lazy load heavy components
4. Profile before and after migration

---

## ✅ Migration Checklist Template

Use this for each screen migration:

```markdown
## Screen: [Screen Name]

### Pre-Migration

- [ ] Current LOC count: \_\_\_
- [ ] Features documented
- [ ] Components identified
- [ ] Template selected: \_\_\_
- [ ] Custom components needed: \_\_\_

### Migration

- [ ] Template layout implemented
- [ ] Header/navigation migrated
- [ ] Content sections migrated
- [ ] Styles replaced with tokens
- [ ] Loading states work
- [ ] Error states work
- [ ] Pull-to-refresh works

### Testing

- [ ] Visual appearance correct
- [ ] All interactions work
- [ ] Data fetching works
- [ ] Navigation works
- [ ] Forms submit correctly
- [ ] No TypeScript errors
- [ ] No console warnings
- [ ] Accessibility tested

### Post-Migration

- [ ] New LOC count: \_\_\_
- [ ] Code reduction: \_\_\_\_%
- [ ] Documentation updated
- [ ] Team reviewed
- [ ] Merged to main
```

---

## 📅 Weekly Goals

### Week 1

- [ ] Dashboard screen migrated (Day 1-2)
- [ ] Vehicles list screen migrated (Day 3-4)
- [ ] Vehicle detail screen migrated (Day 5-6)
- [ ] Add/Edit vehicle migrated (Day 7)
- **Target**: 4 screens, ~66% code reduction

### Week 2

- [ ] Logs list screen migrated (Day 1-2)
- [ ] All log forms migrated (Day 3-4)
- [ ] Groups screen migrated (Day 5)
- **Target**: 5 screens, ~65% code reduction

### Week 3

- [ ] Profile/Settings migrated (Day 1)
- [ ] Notifications migrated (Day 2)
- [ ] Auth screens migrated (Day 3)
- [ ] Testing & polish (Day 4-5)
- **Target**: All screens complete, full QA pass

---

## 🎯 Success Criteria

Phase 6 is complete when:

1. **All screens migrated** (12+ screens)
2. **Code reduction achieved** (60%+ average)
3. **Zero functionality loss** (all features work)
4. **Zero TypeScript errors** (strict mode passing)
5. **Accessibility improved** (all templates have a11y)
6. **Performance maintained** (no regressions)
7. **Documentation updated** (migration patterns documented)
8. **Team trained** (everyone can use design system)

---

**Let's transform this app! 🚀**
