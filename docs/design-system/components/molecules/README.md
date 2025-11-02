# Molecule Components

Molecule components are composite UI elements built from atomic components. They form functional units that can be reused across the application.

## Table of Contents

- [Button](#button)
- [Input](#input)
- [Card](#card)
- [ListItem](#listitem)
- [Chip](#chip)
- [Alert](#alert)
- [TabBar](#tabbar)
- [Accessibility](#accessibility)
- [Best Practices](#best-practices)

---

## Button

Enhanced button component with multiple variants, sizes, and states.

### Usage

```tsx
import { Button } from '@/lib/design-system';

// Basic button
<Button onPress={() => console.log('Pressed')}>
  Click Me
</Button>

// Primary button with icon
<Button 
  variant="primary" 
  size="lg" 
  leftIcon="add"
  onPress={handlePress}
>
  Add Item
</Button>

// Loading state
<Button loading onPress={handlePress}>
  Submitting...
</Button>

// Danger button with full width
<Button 
  variant="danger" 
  fullWidth
  rightIcon="delete"
  onPress={handleDelete}
>
  Delete Account
</Button>
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'primary' \| 'secondary' \| 'outline' \| 'ghost' \| 'danger'` | `'primary'` | Visual style variant |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Button size |
| `fullWidth` | `boolean` | `false` | Whether button takes full width |
| `leftIcon` | `IconName` | - | Icon to display on the left |
| `rightIcon` | `IconName` | - | Icon to display on the right |
| `loading` | `boolean` | `false` | Shows loading indicator |
| `disabled` | `boolean` | `false` | Disables button interaction |
| `onPress` | `() => void` | - | Press handler (required) |
| `style` | `ViewStyle` | - | Custom style override |

### Variants

- **primary**: Filled with tint color, high emphasis
- **secondary**: Subtle background with border
- **outline**: Transparent with border only
- **ghost**: Minimal style, text only
- **danger**: Red/destructive actions

### Accessibility

- Automatically includes `accessibilityRole="button"`
- Disabled state communicated via `accessibilityState`
- Supports screen reader announcements

---

## Input

Form input component with validation states and helper text.

### Usage

```tsx
import { Input } from '@/lib/design-system';

// Basic input
<Input 
  placeholder="Enter your name"
  onChangeText={setName}
/>

// Input with label and helper text
<Input 
  label="Email Address"
  placeholder="you@example.com"
  helperText="We'll never share your email"
  keyboardType="email-address"
  onChangeText={setEmail}
/>

// Input with validation
<Input 
  label="Password"
  placeholder="Enter password"
  secureTextEntry
  errorText={errors.password}
  onChangeText={setPassword}
/>

// Input with icons
<Input 
  placeholder="Search..."
  leftIcon="search"
  rightIcon="close"
  onRightIconPress={clearSearch}
  onChangeText={setQuery}
/>
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `label` | `string` | - | Label text above input |
| `helperText` | `string` | - | Helper text below input |
| `errorText` | `string` | - | Error message (shows error state) |
| `successText` | `string` | - | Success message (shows success state) |
| `leftIcon` | `IconName` | - | Icon on the left side |
| `rightIcon` | `IconName` | - | Icon on the right side |
| `onRightIconPress` | `() => void` | - | Handler for right icon press |
| `disabled` | `boolean` | `false` | Disables input |
| `fullWidth` | `boolean` | `false` | Takes full width |

Plus all standard `TextInput` props (placeholder, secureTextEntry, keyboardType, etc.)

### Validation States

- **Default**: Normal state with helper text
- **Error**: Red border and error text (errorText prop)
- **Success**: Green border and success text (successText prop)

Priority: errorText > successText > helperText

### Accessibility

- Label used as `accessibilityLabel`
- Error states announced to screen readers
- Keyboard type configured appropriately

---

## Card

Container component with composition API for structured content.

### Usage

```tsx
import { Card, CardHeader, CardContent, CardFooter, Button } from '@/lib/design-system';

// Basic card
<Card>
  <Text>Card content here</Text>
</Card>

// Structured card with composition
<Card variant="elevated">
  <CardHeader>
    <Text variant="heading" size="lg">Title</Text>
    <Text variant="body" color="secondary">Subtitle</Text>
  </CardHeader>
  
  <CardContent>
    <Text>Main content goes here with proper spacing.</Text>
  </CardContent>
  
  <CardFooter>
    <Button variant="outline" size="sm">Cancel</Button>
    <Button size="sm">Confirm</Button>
  </CardFooter>
</Card>

// Pressable card
<Card variant="outlined" onPress={handleCardPress}>
  <CardContent>
    <Text>Tap me!</Text>
  </CardContent>
</Card>
```

### Props

**Card Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'default' \| 'elevated' \| 'outlined' \| 'filled'` | `'default'` | Visual style |
| `padding` | `SpacingKey` | `'md'` | Internal padding |
| `onPress` | `() => void` | - | Makes card pressable |
| `children` | `ReactNode` | - | Card content (required) |

**CardHeader/CardContent/CardFooter Props:**

| Prop | Type | Description |
|------|------|-------------|
| `children` | `ReactNode` | Section content (required) |

### Variants

- **default**: Standard card with subtle background
- **elevated**: Card with shadow elevation
- **outlined**: Card with visible border
- **filled**: Card with filled background

### Composition Pattern

Use `CardHeader`, `CardContent`, and `CardFooter` for consistent spacing and layout:

- **CardHeader**: Title, subtitle, metadata
- **CardContent**: Main content area
- **CardFooter**: Actions, buttons, links

---

## ListItem

Flexible list row component with multi-line support.

### Usage

```tsx
import { ListItem, Avatar, Icon } from '@/lib/design-system';

// Simple list item
<ListItem 
  title="Item Title"
  onPress={handlePress}
/>

// List item with subtitle
<ListItem 
  title="John Doe"
  subtitle="Software Engineer"
  onPress={handlePress}
/>

// Rich list item with avatar
<ListItem 
  title="Jane Smith"
  subtitle="Product Manager"
  description="Available for meetings today"
  leftElement={<Avatar source={avatar} size="md" />}
  rightElement={<Icon name="forward" size="sm" />}
  onPress={handlePress}
  showDivider
/>

// Non-interactive list item
<ListItem 
  title="Settings"
  subtitle="Manage your preferences"
  leftElement={<Icon name="settings" />}
/>
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `title` | `string` | - | Primary text (required) |
| `subtitle` | `string` | - | Secondary text |
| `description` | `string` | - | Tertiary text (smaller) |
| `leftElement` | `ReactNode` | - | Element on the left (avatar, icon) |
| `rightElement` | `ReactNode` | - | Element on the right (icon, badge) |
| `showDivider` | `boolean` | `false` | Show bottom divider |
| `onPress` | `() => void` | - | Makes item pressable |
| `disabled` | `boolean` | `false` | Disables interaction |

### Layout

```
┌─────────────────────────────────────┐
│ [Left]  Title           [Right]     │
│         Subtitle                     │
│         Description                  │
├─────────────────────────────────────┤ (divider if showDivider)
```

### Best Practices

- Use leftElement for avatars or category icons
- Use rightElement for navigation arrows or status indicators
- Keep title concise (1-2 lines max)
- Use description sparingly for additional context

---

## Chip

Tag/filter component with selection and dismissal capabilities.

### Usage

```tsx
import { Chip } from '@/lib/design-system';

// Basic chip
<Chip label="Tag" />

// Selectable chip
<Chip 
  label="Filter"
  selected={isSelected}
  onPress={() => setIsSelected(!isSelected)}
/>

// Dismissible chip
<Chip 
  label="Applied Filter"
  onDismiss={() => removeFilter('category')}
/>

// Chip with icon
<Chip 
  label="Priority"
  leftIcon="star"
  variant="filled"
/>

// Chip with avatar
<Chip 
  label="John Doe"
  avatar={avatarSource}
  onPress={handlePress}
/>

// Small chip
<Chip 
  label="New"
  size="sm"
  variant="outlined"
/>
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `label` | `string` | - | Chip text (required) |
| `variant` | `'default' \| 'outlined' \| 'filled'` | `'default'` | Visual style |
| `size` | `'sm' \| 'md'` | `'md'` | Chip size |
| `selected` | `boolean` | `false` | Selected state |
| `disabled` | `boolean` | `false` | Disabled state |
| `leftIcon` | `IconName` | - | Icon on the left |
| `avatar` | `string \| ImageSource` | - | Avatar image |
| `onPress` | `() => void` | - | Press handler |
| `onDismiss` | `() => void` | - | Dismiss handler (shows X button) |

### Use Cases

- **Tags**: Category labels, keywords
- **Filters**: Selectable filter chips
- **User Pills**: User mentions with avatars
- **Status**: Badges, statuses with colors
- **Input Tags**: Email recipients, tags input

### Accessibility

- Automatically includes `accessibilityRole="button"` when pressable
- Selection state communicated via `accessibilityState`
- Dismiss button labeled for screen readers

---

## Alert

Feedback component for important messages with severity levels.

### Usage

```tsx
import { Alert } from '@/lib/design-system';

// Basic alert
<Alert 
  severity="info"
  message="Your changes have been saved."
/>

// Alert with title
<Alert 
  severity="success"
  title="Success!"
  message="Your profile has been updated successfully."
/>

// Alert with action
<Alert 
  severity="warning"
  title="Low Storage"
  message="You're running out of storage space."
  action={{
    label: 'Manage Storage',
    onPress: () => navigation.navigate('Storage')
  }}
/>

// Dismissible alert
<Alert 
  severity="error"
  title="Error"
  message="Failed to load data. Please try again."
  dismissible
  onDismiss={() => setShowAlert(false)}
/>

// Complete alert
<Alert 
  severity="warning"
  title="Action Required"
  message="Please verify your email address to continue."
  action={{
    label: 'Verify Now',
    onPress: handleVerify
  }}
  dismissible
  onDismiss={() => setShowAlert(false)}
/>
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `severity` | `'success' \| 'warning' \| 'error' \| 'info'` | `'info'` | Alert severity level |
| `title` | `string` | - | Alert title (optional) |
| `message` | `string` | - | Alert message (required) |
| `dismissible` | `boolean` | `false` | Show dismiss button |
| `onDismiss` | `() => void` | - | Dismiss handler |
| `action` | `{ label: string, onPress: () => void }` | - | Action button config |

### Severity Levels

- **success** (green): Confirmations, successful operations
- **warning** (orange): Warnings, important notices
- **error** (red): Errors, failed operations
- **info** (blue): General information, tips

Each severity has its own icon and color scheme.

### Best Practices

- Use sparingly - too many alerts reduce their impact
- Keep messages concise and actionable
- Choose appropriate severity level
- Provide actions when user can resolve the issue
- Allow dismissal for non-critical alerts

---

## TabBar

Navigation tabs component with multiple visual styles.

### Usage

```tsx
import { TabBar } from '@/lib/design-system';

// Basic tabs
const tabs = [
  { key: 'home', label: 'Home' },
  { key: 'search', label: 'Search' },
  { key: 'profile', label: 'Profile' },
];

<TabBar 
  tabs={tabs}
  activeTab={activeTab}
  onTabChange={setActiveTab}
/>

// Tabs with icons
const tabsWithIcons = [
  { key: 'home', label: 'Home', icon: 'home' },
  { key: 'search', label: 'Search', icon: 'search' },
  { key: 'notifications', label: 'Alerts', icon: 'notification', badge: 5 },
];

<TabBar 
  tabs={tabsWithIcons}
  activeTab={activeTab}
  onTabChange={setActiveTab}
  variant="underline"
/>

// Pills variant
<TabBar 
  tabs={tabs}
  activeTab={activeTab}
  onTabChange={setActiveTab}
  variant="pills"
/>

// Scrollable tabs
const manyTabs = Array.from({ length: 10 }, (_, i) => ({
  key: `tab${i}`,
  label: `Tab ${i + 1}`,
}));

<TabBar 
  tabs={manyTabs}
  activeTab={activeTab}
  onTabChange={setActiveTab}
  scrollable
/>

// Tabs with disabled state
const tabsWithDisabled = [
  { key: 'tab1', label: 'Available' },
  { key: 'tab2', label: 'Disabled', disabled: true },
  { key: 'tab3', label: 'Available' },
];
```

### Props

**TabBar Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `tabs` | `Tab[]` | - | Array of tab objects (required) |
| `activeTab` | `string` | - | Key of active tab (required) |
| `onTabChange` | `(key: string) => void` | - | Tab change handler (required) |
| `variant` | `'default' \| 'underline' \| 'pills'` | `'default'` | Visual style |
| `scrollable` | `boolean` | `false` | Enable horizontal scrolling |

**Tab Object:**

| Prop | Type | Description |
|------|------|-------------|
| `key` | `string` | Unique tab identifier (required) |
| `label` | `string` | Tab label text (required) |
| `icon` | `IconName` | Optional icon |
| `badge` | `number` | Optional badge count |
| `disabled` | `boolean` | Disable tab interaction |

### Variants

- **default**: Standard tabs with background
- **underline**: Tabs with bottom underline indicator
- **pills**: Rounded pill-style tabs

### Best Practices

- Limit to 3-5 tabs for better UX
- Use scrollable for 6+ tabs
- Keep labels short (1-2 words)
- Use icons to reinforce meaning
- Use badges for notifications/counts

---

## Accessibility

All molecule components follow WCAG 2.1 Level AA guidelines:

### Touch Targets
- Minimum 44x44pt touch targets for interactive elements
- Adequate spacing between tappable areas

### Screen Readers
- Semantic HTML/accessibility roles
- Descriptive labels for all interactive elements
- State changes announced properly

### Keyboard Navigation
- All interactive elements keyboard accessible
- Logical tab order maintained
- Focus indicators visible

### Color Contrast
- Text contrast ratio ≥ 4.5:1 for normal text
- ≥ 3:1 for large text and UI components
- Not relying on color alone for information

### Component-Specific

**Button:**
- `accessibilityRole="button"`
- Disabled state in `accessibilityState`
- Loading state announced

**Input:**
- Label as `accessibilityLabel`
- Error states announced
- Helper text as `accessibilityHint`

**Card:**
- `accessibilityRole="button"` when pressable
- Proper content hierarchy

**ListItem:**
- `accessibilityRole="button"` when pressable
- Combined title/subtitle as label
- Disabled state communicated

**Chip:**
- `accessibilityRole="button"` when interactive
- Selection state in `accessibilityState`
- Dismiss button labeled

**Alert:**
- `accessibilityRole="alert"`
- Severity communicated
- Action buttons accessible

**TabBar:**
- Tab selection state
- Disabled tabs communicated
- Badge counts announced

---

## Best Practices

### General Guidelines

1. **Composition Over Configuration**
   - Use composition API (Card sections) for complex layouts
   - Combine simple components for custom designs

2. **Performance**
   - Use `useMemo` for computed styles in lists
   - Avoid inline functions in render props
   - Use `useCallback` for event handlers in lists

3. **Consistency**
   - Use design tokens for spacing, colors, and typography
   - Follow established patterns across the app
   - Maintain consistent interaction patterns

4. **Responsive Design**
   - Test on different screen sizes
   - Use `fullWidth` props appropriately
   - Consider tablet/landscape layouts

### Component-Specific Tips

**Button:**
- Use `primary` for main actions
- Use `danger` for destructive actions
- Provide loading states for async operations
- Don't nest buttons

**Input:**
- Always provide labels for accessibility
- Show error states immediately after validation
- Use appropriate keyboard types
- Clear helper text from errors

**Card:**
- Use elevation sparingly
- Maintain consistent padding
- Don't nest pressable cards

**ListItem:**
- Keep titles concise
- Use dividers between semantically different items
- Provide visual feedback on press

**Chip:**
- Use for filtering and categorization
- Don't use too many in one view
- Make dismissal obvious when available

**Alert:**
- Place near affected content
- Auto-dismiss non-critical alerts
- Provide clear actions
- Stack multiple alerts vertically

**TabBar:**
- Keep to 3-5 tabs
- Use icons for recognition
- Provide visual active state
- Consider bottom navigation for mobile

### Code Examples

**Form with Validation:**

```tsx
<Input 
  label="Email"
  value={email}
  onChangeText={setEmail}
  errorText={errors.email}
  keyboardType="email-address"
  autoCapitalize="none"
/>

<Input 
  label="Password"
  value={password}
  onChangeText={setPassword}
  errorText={errors.password}
  secureTextEntry
  rightIcon={showPassword ? 'eye_slash' : 'eye'}
  onRightIconPress={() => setShowPassword(!showPassword)}
/>

<Button 
  variant="primary"
  fullWidth
  loading={isSubmitting}
  disabled={!isValid}
  onPress={handleSubmit}
>
  Sign In
</Button>
```

**Filterable List:**

```tsx
<Input 
  placeholder="Search items..."
  leftIcon="search"
  rightIcon={query ? 'close' : undefined}
  onRightIconPress={() => setQuery('')}
  value={query}
  onChangeText={setQuery}
/>

<View style={styles.filters}>
  {filters.map(filter => (
    <Chip 
      key={filter.id}
      label={filter.label}
      selected={selectedFilters.includes(filter.id)}
      onPress={() => toggleFilter(filter.id)}
    />
  ))}
</View>

{items.map(item => (
  <ListItem 
    key={item.id}
    title={item.title}
    subtitle={item.subtitle}
    leftElement={<Avatar source={item.avatar} />}
    rightElement={<Icon name="forward" />}
    onPress={() => navigate('Detail', { id: item.id })}
    showDivider
  />
))}
```

**Settings Screen:**

```tsx
<Card variant="elevated">
  <CardHeader>
    <Text variant="heading" size="lg">Account Settings</Text>
  </CardHeader>
  
  <CardContent>
    <ListItem 
      title="Profile"
      subtitle="Update your personal information"
      leftElement={<Icon name="user" />}
      rightElement={<Icon name="forward" />}
      onPress={() => navigate('Profile')}
      showDivider
    />
    
    <ListItem 
      title="Notifications"
      subtitle="Manage notification preferences"
      leftElement={<Icon name="notification" />}
      rightElement={<Icon name="forward" />}
      onPress={() => navigate('Notifications')}
      showDivider
    />
    
    <ListItem 
      title="Privacy"
      subtitle="Control your privacy settings"
      leftElement={<Icon name="settings" />}
      rightElement={<Icon name="forward" />}
      onPress={() => navigate('Privacy')}
    />
  </CardContent>
  
  <CardFooter>
    <Button 
      variant="danger"
      fullWidth
      onPress={handleSignOut}
    >
      Sign Out
    </Button>
  </CardFooter>
</Card>
```

---

## Migration Guide

Migrating from old components to molecule components:

### Button Migration

```tsx
// Old
<TouchableOpacity onPress={handlePress}>
  <Text>Click Me</Text>
</TouchableOpacity>

// New
<Button onPress={handlePress}>
  Click Me
</Button>
```

### Input Migration

```tsx
// Old
<View>
  <Text>Email</Text>
  <TextInput 
    placeholder="Enter email"
    value={email}
    onChangeText={setEmail}
  />
  {error && <Text style={styles.error}>{error}</Text>}
</View>

// New
<Input 
  label="Email"
  placeholder="Enter email"
  value={email}
  onChangeText={setEmail}
  errorText={error}
/>
```

### Card Migration

```tsx
// Old
<View style={styles.card}>
  <Text>Content</Text>
</View>

// New
<Card>
  <CardContent>
    <Text>Content</Text>
  </CardContent>
</Card>
```

---

## Support

For questions or issues:
- Review examples in this documentation
- Check atomic components documentation
- Refer to design tokens documentation
- Review accessibility guidelines

**Next Steps:**
- Explore [Organism Components](../organisms/README.md) (Phase 4)
- Review [Design Tokens](../../tokens/README.md)
- Check [Theme System](../../theme/README.md)
