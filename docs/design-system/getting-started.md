# Getting Started with the Design System

This guide will help you start using the Vehicle Management App Design System in your components.

## Installation

The design system is already included in your project at `lib/design-system`. No additional setup required!

## First Steps

### 1. Import What You Need

```typescript
// Import the main exports
import { tokens, theme, getSpacing, getTypography } from '@/lib/design-system';

// Import specific utilities
import { responsive, platform } from '@/lib/design-system';

// Import icons
import { iconMap, iconSizes } from '@/lib/design-system';
```

### 2. Get Theme Colors

```typescript
import { useColorScheme } from '@/hooks/use-color-scheme';
import { theme } from '@/lib/design-system';

export function MyComponent() {
  const colorScheme = useColorScheme(); // 'light' or 'dark'
  const colors = theme.getThemeColors(colorScheme);
  
  // Now use colors.text, colors.background, etc.
}
```

### 3. Use Design Tokens

```typescript
import { View, Text } from 'react-native';
import { tokens, getSpacing, getTypography } from '@/lib/design-system';

export function Example() {
  return (
    <View style={{
      padding: getSpacing('md'),          // 16px
      backgroundColor: colors.card,
      borderRadius: tokens.radius.lg,     // 12px
      ...tokens.shadows.sm,               // Consistent shadow
    }}>
      <Text style={{
        ...getTypography('h2'),           // Heading 2 preset
        color: colors.text,
      }}>
        Hello World
      </Text>
    </View>
  );
}
```

## Common Patterns

### Pattern 1: Creating a Card Component

```typescript
import { View, Text, StyleSheet } from 'react-native';
import { tokens, theme, getSpacing, getTypography } from '@/lib/design-system';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface CardProps {
  title: string;
  children: React.ReactNode;
}

export function Card({ title, children }: CardProps) {
  const colorScheme = useColorScheme();
  const colors = theme.getThemeColors(colorScheme);
  
  return (
    <View style={[
      styles.card,
      {
        backgroundColor: colors.card,
        borderColor: colors.cardBorder,
      }
    ]}>
      <Text style={[
        styles.title,
        { color: colors.text }
      ]}>
        {title}
      </Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: tokens.spacing.lg,
    borderRadius: tokens.radius.lg,
    borderWidth: tokens.borderWidth.base,
    ...tokens.shadows.sm,
  },
  title: {
    fontSize: tokens.fontSize.xl,
    fontWeight: tokens.fontWeight.semibold,
    marginBottom: tokens.spacing.md,
  },
});
```

### Pattern 2: Responsive Spacing

```typescript
import { responsive, getSpacing } from '@/lib/design-system';

const containerStyle = {
  padding: responsive({
    mobile: getSpacing('sm'),   // 12px on mobile
    tablet: getSpacing('md'),   // 16px on tablet
    desktop: getSpacing('lg'),  // 20px on desktop
    default: getSpacing('md'),
  }),
};
```

### Pattern 3: Platform-Specific Styles

```typescript
import { platform, tokens } from '@/lib/design-system';

const styles = StyleSheet.create({
  header: {
    paddingTop: tokens.spacing.lg,
    ...platform({
      ios: { paddingTop: 44 },      // iOS safe area
      android: { paddingTop: 0 },   // Android no safe area
      web: { paddingTop: 20 },      // Web custom
    }),
  },
});
```

## Code Organization

### Recommended Structure

```typescript
// 1. Imports
import { View, Text, StyleSheet } from 'react-native';
import { tokens, theme, getSpacing, getTypography } from '@/lib/design-system';
import { useColorScheme } from '@/hooks/use-color-scheme';

// 2. Types/Interfaces
interface MyComponentProps {
  title: string;
}

// 3. Component
export function MyComponent({ title }: MyComponentProps) {
  // 3a. Hooks
  const colorScheme = useColorScheme();
  const colors = theme.getThemeColors(colorScheme);
  
  // 3b. Render
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>
        {title}
      </Text>
    </View>
  );
}

// 4. Styles (using tokens, NOT hardcoded values)
const styles = StyleSheet.create({
  container: {
    padding: tokens.spacing.lg,
    borderRadius: tokens.radius.md,
  },
  title: {
    fontSize: tokens.fontSize.xl,
    fontWeight: tokens.fontWeight.bold,
  },
});
```

## Migration Guide

### Migrating Existing Components

**Before:**
```typescript
const styles = StyleSheet.create({
  container: {
    padding: 16,              // ❌ Magic number
    backgroundColor: '#FFF',  // ❌ Hardcoded color
    fontSize: 18,             // ❌ Magic number
  },
});
```

**After:**
```typescript
import { tokens } from '@/lib/design-system';

const styles = StyleSheet.create({
  container: {
    padding: tokens.spacing.md,        // ✅ Token
    backgroundColor: colors.card,      // ✅ Theme color
    fontSize: tokens.fontSize.lg,      // ✅ Token
  },
});
```

## Next Steps

1. ✅ Read the [Design Tokens Reference](./tokens.md)
2. ✅ Explore the [Theme System Guide](./theme.md)
3. ✅ Learn about [Utility Functions](./utilities.md)
4. ✅ Check out [Icon System](./icons.md)
5. ⏳ Wait for Component Library (Phase 2-5)

## Tips & Tricks

### Tip 1: Use TypeScript Autocomplete

The design system is fully typed. Use your IDE's autocomplete to discover available tokens:

```typescript
tokens.spacing.   // Autocomplete shows all spacing options
tokens.fontSize.  // Autocomplete shows all font sizes
```

### Tip 2: Combine Utilities

```typescript
const styles = {
  ...getTypography('body'),
  ...textShadow({ color: 'rgba(0,0,0,0.1)' }),
  color: colors.text,
};
```

### Tip 3: Create Custom Hooks

```typescript
// hooks/useThemedStyles.ts
import { useColorScheme } from '@/hooks/use-color-scheme';
import { theme } from '@/lib/design-system';

export function useThemedStyles() {
  const colorScheme = useColorScheme();
  return theme.getThemeColors(colorScheme);
}

// Usage
const colors = useThemedStyles();
```

## Troubleshooting

### Import Errors

```typescript
// ✅ Correct
import { tokens } from '@/lib/design-system';

// ❌ Wrong
import { tokens } from 'lib/design-system';
```

### Color Not Updating

Make sure you're using `useColorScheme()` hook to get the current theme:

```typescript
// ✅ Correct - updates when theme changes
const colorScheme = useColorScheme();
const colors = theme.getThemeColors(colorScheme);

// ❌ Wrong - static, won't update
const colors = Colors.light;
```

### TypeScript Errors

Ensure your token keys are correct:

```typescript
// ✅ Correct
tokens.spacing.md

// ❌ Wrong - typo
tokens.spacing.medium  // TypeScript error
```

---

Happy coding with the design system! 🎨
