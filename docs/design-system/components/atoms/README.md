# Atomic Components Documentation

Atomic components are the smallest, most fundamental building blocks of our design system. They cannot be broken down any further without losing their meaning.

## Components

- [Text](#text) - Typography component
- [Icon](#icon) - Icon display component
- [Badge](#badge) - Status and notification badges
- [Avatar](#avatar) - User avatars with initials fallback
- [Divider](#divider) - Visual separators
- [Spacer](#spacer) - Layout spacing component

---

## Text

The Text component is the foundation for all typography in the application.

### Usage

```typescript
import { DSText as Text } from '@/lib/design-system';

<Text variant="heading" size="lg" weight="bold" color="primary">
  Welcome to Vehicle Management
</Text>
```

### Props

| Prop            | Type                                                                                    | Default     | Description              |
| --------------- | --------------------------------------------------------------------------------------- | ----------- | ------------------------ |
| `variant`       | `'display' \| 'heading' \| 'title' \| 'body' \| 'caption' \| 'label'`                   | `'body'`    | Text style preset        |
| `size`          | `'xs' \| 'sm' \| 'md' \| 'lg' \| 'xl'`                                                  | `'md'`      | Font size                |
| `weight`        | `'light' \| 'regular' \| 'medium' \| 'semibold' \| 'bold'`                              | `'regular'` | Font weight              |
| `color`         | `'primary' \| 'secondary' \| 'tertiary' \| 'success' \| 'error' \| 'warning' \| 'info'` | `'primary'` | Text color               |
| `align`         | `'left' \| 'center' \| 'right' \| 'justify'`                                            | `'left'`    | Text alignment           |
| `numberOfLines` | `number`                                                                                | -           | Maximum lines to display |

### Examples

```typescript
// Display text (largest)
<Text variant="display">48,000 km</Text>

// Headings
<Text variant="heading">Vehicle Details</Text>

// Body text
<Text variant="body">Last serviced on Jan 15, 2025</Text>

// Caption
<Text variant="caption" color="secondary">Updated 2 hours ago</Text>

// Labels
<Text variant="label" weight="semibold">STATUS</Text>

// Success message
<Text color="success">Service completed successfully!</Text>

// Truncated text
<Text numberOfLines={2}>
  This is a very long description that will be truncated after two lines...
</Text>
```

### Accessibility

- Uses semantic `text` role
- Respects system font scaling
- Supports screen readers

---

## Icon

Displays SF Symbols on iOS with consistent sizing and theming.

### Usage

```typescript
import { Icon } from '@/lib/design-system';

<Icon name="car" size="md" color="tint" />
```

### Props

| Prop      | Type                                                          | Default        | Description                      |
| --------- | ------------------------------------------------------------- | -------------- | -------------------------------- |
| `name`    | `IconName`                                                    | **required**   | Icon identifier from icon map    |
| `size`    | `IconSize \| number`                                          | `'md'`         | Icon size (predefined or custom) |
| `color`   | `IconColor`                                                   | `'primary'`    | Icon color                       |
| `variant` | `'monochrome' \| 'hierarchical' \| 'palette' \| 'multicolor'` | `'monochrome'` | SF Symbol rendering style        |
| `weight`  | `IconWeight`                                                  | `'regular'`    | Icon stroke weight               |

### Examples

```typescript
// Basic icon
<Icon name="home" />

// Large success icon
<Icon name="checkmark_circle" size="lg" color="success" />

// Custom size
<Icon name="bell" size={28} color="warning" />

// Navigation icons
<Icon name="back" />
<Icon name="forward" />
<Icon name="close" />

// Vehicle icons
<Icon name="car" size="xl" />
<Icon name="fuel" color="warning" />
```

### Accessibility

- Includes descriptive `accessibilityLabel`
- Uses `image` accessibility role

---

## Badge

Status indicators and notification counters.

### Usage

```typescript
import { Badge } from '@/lib/design-system';

<Badge variant="success">Active</Badge>
<Badge count={5} variant="error" />
<Badge type="dot" variant="success" />
```

### Props

| Prop       | Type                                                       | Default     | Description                      |
| ---------- | ---------------------------------------------------------- | ----------- | -------------------------------- |
| `variant`  | `'success' \| 'warning' \| 'error' \| 'info' \| 'default'` | `'default'` | Badge color scheme               |
| `size`     | `'sm' \| 'md' \| 'lg'`                                     | `'md'`      | Badge size                       |
| `type`     | `'filled' \| 'outlined' \| 'dot'`                          | `'filled'`  | Badge style                      |
| `count`    | `number`                                                   | -           | Numeric count to display         |
| `maxCount` | `number`                                                   | `99`        | Maximum count before showing "+" |

### Examples

```typescript
// Status badges
<Badge variant="success">Active</Badge>
<Badge variant="error">Overdue</Badge>
<Badge variant="warning">Due Soon</Badge>

// Count badges
<Badge count={3} variant="info" />
<Badge count={150} maxCount={99} /> // Shows "99+"

// Dot indicators
<Badge type="dot" variant="success" />
<Badge type="dot" variant="error" />

// Outlined badges
<Badge type="outlined" variant="info">New</Badge>

// Different sizes
<Badge size="sm">Small</Badge>
<Badge size="lg">Large</Badge>
```

### Accessibility

- Provides count announcements for screen readers
- Clear visual distinctions between variants

---

## Avatar

User avatars with automatic initials fallback.

### Usage

```typescript
import { Avatar } from '@/lib/design-system';

<Avatar name="John Doe" size="md" />
<Avatar source={{ uri: imageUrl }} size="lg" showStatus status="online" />
```

### Props

| Prop              | Type                                            | Default | Description              |
| ----------------- | ----------------------------------------------- | ------- | ------------------------ |
| `size`            | `'xs' \| 'sm' \| 'md' \| 'lg' \| 'xl' \| 'xxl'` | `'md'`  | Avatar size              |
| `source`          | `ImageSourcePropType`                           | -       | Image source             |
| `name`            | `string`                                        | -       | User name (for initials) |
| `alt`             | `string`                                        | -       | Accessibility label      |
| `status`          | `'online' \| 'offline' \| 'busy' \| 'away'`     | -       | Status indicator         |
| `showStatus`      | `boolean`                                       | `false` | Show status indicator    |
| `backgroundColor` | `string`                                        | -       | Custom background color  |
| `textColor`       | `string`                                        | -       | Custom text color        |

### Examples

```typescript
// With initials
<Avatar name="John Doe" />
<Avatar name="Alice Smith" size="lg" />

// With image
<Avatar source={{ uri: 'https://example.com/avatar.jpg' }} />

// With status
<Avatar
  name="John Doe"
  showStatus
  status="online"
  size="lg"
/>

// Different sizes
<Avatar name="JS" size="xs" />
<Avatar name="JS" size="sm" />
<Avatar name="JS" size="md" />
<Avatar name="JS" size="lg" />
<Avatar name="JS" size="xl" />
<Avatar name="JS" size="xxl" />
```

### Accessibility

- Uses `image` role
- Provides descriptive labels
- High contrast initials

---

## Divider

Visual separators for content sections.

### Usage

```typescript
import { Divider } from '@/lib/design-system';

<Divider />
<Divider orientation="vertical" />
<Divider label="OR" />
```

### Props

| Prop            | Type                             | Default        | Description                |
| --------------- | -------------------------------- | -------------- | -------------------------- |
| `orientation`   | `'horizontal' \| 'vertical'`     | `'horizontal'` | Divider direction          |
| `thickness`     | `'thin' \| 'medium' \| 'thick'`  | `'thin'`       | Line thickness             |
| `color`         | `'default' \| 'light' \| 'dark'` | `'default'`    | Line color                 |
| `label`         | `string`                         | -              | Optional label text        |
| `labelPosition` | `'left' \| 'center' \| 'right'`  | `'center'`     | Label alignment            |
| `spacing`       | `SpacingToken`                   | `'md'`         | Vertical/horizontal margin |

### Examples

```typescript
// Simple horizontal divider
<Divider />

// Vertical divider (for flex layouts)
<View style={{ flexDirection: 'row' }}>
  <Text>Left</Text>
  <Divider orientation="vertical" />
  <Text>Right</Text>
</View>

// With label
<Divider label="OR" />
<Divider label="Section Break" labelPosition="left" />

// Thick divider
<Divider thickness="thick" />

// Custom spacing
<Divider spacing="xl" />
```

### Accessibility

- Announces labels to screen readers
- Semantic separator role

---

## Spacer

Creates consistent spacing between components.

### Usage

```typescript
import { Spacer } from '@/lib/design-system';

<Spacer size="md" />
<Spacer size="lg" horizontal />
```

### Props

| Prop         | Type           | Default | Description                             |
| ------------ | -------------- | ------- | --------------------------------------- |
| `size`       | `SpacingToken` | `'md'`  | Spacing size from design tokens         |
| `horizontal` | `boolean`      | `false` | Horizontal spacing (otherwise vertical) |

### Examples

```typescript
// Vertical spacing (default)
<View>
  <Text>First item</Text>
  <Spacer size="sm" />
  <Text>Second item</Text>
  <Spacer size="lg" />
  <Text>Third item</Text>
</View>

// Horizontal spacing
<View style={{ flexDirection: 'row' }}>
  <Button>Cancel</Button>
  <Spacer size="md" horizontal />
  <Button>Save</Button>
</View>

// Different sizes
<Spacer size="xs" />   // 8px
<Spacer size="sm" />   // 12px
<Spacer size="md" />   // 16px
<Spacer size="lg" />   // 20px
<Spacer size="xl" />   // 24px
<Spacer size="xxl" />  // 32px
```

### Accessibility

- Hidden from accessibility tree
- Purely decorative spacing element

---

## Best Practices

### Text

- Use semantic variants (`heading`, `body`, `caption`) instead of arbitrary sizes
- Maintain consistent hierarchy (display → heading → title → body → caption)
- Use `numberOfLines` for text truncation
- Prefer semantic colors over custom colors

### Icon

- Always provide meaningful icon names
- Use consistent sizes throughout similar UI sections
- Match icon color to surrounding text when appropriate
- Consider accessibility - icons should supplement text, not replace it

### Badge

- Use semantic variants for status (`success`, `error`, `warning`)
- Keep badge text concise (1-2 words max)
- Use dot badges for simple status indicators
- Respect maxCount for large numbers

### Avatar

- Always provide a `name` or `alt` text for accessibility
- Use appropriate sizes for context (larger for profiles, smaller for lists)
- Status indicators should be meaningful and consistent

### Divider

- Use sparingly - too many dividers create visual clutter
- Prefer `light` color for subtle separation
- Labels should be short and descriptive

### Spacer

- Use design tokens consistently (`sm`, `md`, `lg`, etc.)
- Avoid arbitrary spacing - stick to the token scale
- Consider responsive spacing for different screen sizes

---

## Migration Guide

### Replacing Old Text Components

**Before:**

```typescript
<RNText style={{ fontSize: 16, fontWeight: 'bold', color: '#000' }}>
  Hello
</RNText>
```

**After:**

```typescript
<Text variant="body" weight="bold">
  Hello
</Text>
```

### Replacing StyleSheet Spacing

**Before:**

```typescript
<View style={{ marginVertical: 16 }} />
```

**After:**

```typescript
<Spacer size="md" />
```

---

## Testing

All atomic components include comprehensive unit tests. Run tests with:

```bash
npm test -- --testPathPattern=atoms
```

---

## Next Steps

Phase 3 will build **Molecule Components** using these atomic components:

- Enhanced Button
- Enhanced Input
- Enhanced Card
- ListItem
- Chip
- Alert
- TabBar
