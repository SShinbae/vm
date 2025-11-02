# Design System Documentation

Welcome to the Vehicle Management App Design System! This documentation will help you understand and use the design system effectively.

## 📚 Table of Contents

1. [Getting Started](#getting-started)
2. [Design Principles](#design-principles)
3. [Design Tokens](./tokens.md)
4. [Theme System](./theme.md)
5. [Icon System](./icons.md)
6. [Utilities](./utilities.md)
7. [Components](./components/) (Coming in Phase 2-5)
8. [Examples](#examples)

---

## 🚀 Getting Started

### Installation

The design system is already part of your project. No additional installation required!

### Basic Usage

```typescript
import { tokens, theme, getSpacing, getTypography } from '@/lib/design-system';
import { useColorScheme } from '@/hooks/use-color-scheme';

export function MyComponent() {
  const colorScheme = useColorScheme();
  const colors = theme.getThemeColors(colorScheme);
  
  return (
    <View style={{
      padding: getSpacing('md'),
      backgroundColor: colors.card,
      borderRadius: tokens.radius.lg,
    }}>
      <Text style={getTypography('h2')}>
        Hello Design System!
      </Text>
    </View>
  );
}
```

---

## 🎨 Design Principles

Our design system is built on these core principles:

### 1. **Consistency**
- Use design tokens for all spacing, typography, and colors
- Follow established patterns across the app
- Maintain visual hierarchy

### 2. **Scalability**
- Components are composable and reusable
- Token-based system allows for easy updates
- Mobile-first responsive design

### 3. **Accessibility**
- WCAG 2.1 Level AA compliance
- Minimum touch target size of 44x44
- Proper color contrast ratios
- Screen reader support

### 4. **Performance**
- Optimized component rendering
- Lazy loading where appropriate
- Minimal re-renders

### 5. **Type Safety**
- Full TypeScript support
- Type-safe props and themes
- Autocomplete for all tokens

---

## 📖 Quick Reference

### Spacing Tokens

```typescript
import { tokens } from '@/lib/design-system';

tokens.spacing.xxxs  // 2
tokens.spacing.xxs   // 4
tokens.spacing.xs    // 8
tokens.spacing.sm    // 12
tokens.spacing.md    // 16 (base)
tokens.spacing.lg    // 20
tokens.spacing.xl    // 24
tokens.spacing.xxl   // 32
tokens.spacing.xxxl  // 40
```

### Typography Presets

```typescript
import { getTypography } from '@/lib/design-system';

getTypography('display')   // Largest
getTypography('h1')
getTypography('h2')
getTypography('h3')
getTypography('body')
getTypography('caption')   // Smallest
```

### Colors

```typescript
import { theme } from '@/lib/design-system';
import { useColorScheme } from '@/hooks/use-color-scheme';

const colorScheme = useColorScheme();
const colors = theme.getThemeColors(colorScheme);

colors.text            // Primary text color
colors.textSecondary   // Secondary text color
colors.background      // Background color
colors.card            // Card background
colors.tint            // Brand color
colors.success         // Success state
colors.error           // Error state
```

### Shadows

```typescript
import { tokens } from '@/lib/design-system';

const cardStyle = {
  ...tokens.shadows.md,  // Medium shadow
};
```

---

## 🎯 Examples

### Example 1: Simple Card

```typescript
import { View, Text } from 'react-native';
import { tokens, theme, getSpacing, getTypography } from '@/lib/design-system';
import { useColorScheme } from '@/hooks/use-color-scheme';

export function SimpleCard() {
  const colorScheme = useColorScheme();
  const colors = theme.getThemeColors(colorScheme);
  
  return (
    <View style={{
      padding: getSpacing('lg'),
      backgroundColor: colors.card,
      borderRadius: tokens.radius.lg,
      borderWidth: tokens.borderWidth.base,
      borderColor: colors.cardBorder,
      ...tokens.shadows.sm,
    }}>
      <Text style={{
        ...getTypography('h3'),
        color: colors.text,
        marginBottom: getSpacing('sm'),
      }}>
        Card Title
      </Text>
      <Text style={{
        ...getTypography('body'),
        color: colors.textSecondary,
      }}>
        Card content goes here
      </Text>
    </View>
  );
}
```

### Example 2: Responsive Layout

```typescript
import { View } from 'react-native';
import { responsive, getSpacing } from '@/lib/design-system';

export function ResponsiveLayout() {
  return (
    <View style={{
      padding: responsive({
        mobile: getSpacing('md'),
        tablet: getSpacing('lg'),
        desktop: getSpacing('xl'),
        default: getSpacing('md'),
      }),
    }}>
      {/* Content */}
    </View>
  );
}
```

### Example 3: Using Icons

```typescript
import { IconSymbol } from '@/components/ui/icon-symbol';
import { iconMap, iconSizes } from '@/lib/design-system';

export function IconExample() {
  return (
    <>
      <IconSymbol 
        name={iconMap.navigation.home} 
        size={iconSizes.md} 
      />
      <IconSymbol 
        name={iconMap.actions.add} 
        size={iconSizes.lg} 
      />
    </>
  );
}
```

---

## 📝 Best Practices

### ✅ Do's

```typescript
// ✅ Use design tokens
const styles = {
  padding: tokens.spacing.md,
  fontSize: tokens.fontSize.base,
};

// ✅ Use theme colors
const colors = theme.getThemeColors(colorScheme);
backgroundColor: colors.card;

// ✅ Use typography presets
const textStyle = getTypography('h2');

// ✅ Use spacing helpers
padding: getSpacing('md');
```

### ❌ Don'ts

```typescript
// ❌ Don't use magic numbers
padding: 16;  // Use tokens.spacing.md instead

// ❌ Don't hardcode colors
backgroundColor: '#FFFFFF';  // Use colors.card instead

// ❌ Don't hardcode font sizes
fontSize: 24;  // Use tokens.fontSize.xxl instead

// ❌ Don't create inconsistent spacing
marginTop: 13;  // Use design tokens only
```

---

## 🔗 Related Documentation

- [Design Tokens Reference](./tokens.md)
- [Theme System Guide](./theme.md)
- [Icon System Guide](./icons.md)
- [Utility Functions](./utilities.md)
- [Component Library](./components/) (Coming Soon)

---

## 🤝 Contributing

When adding new components or patterns:

1. **Follow the existing patterns** - Use design tokens, not magic numbers
2. **Document your work** - Add examples and usage guidelines
3. **Test thoroughly** - Ensure accessibility and cross-platform compatibility
4. **Get feedback** - Review with the team before finalizing

---

## 📞 Support

For questions or issues with the design system:

1. Check this documentation
2. Review existing components for patterns
3. Ask the team in development chat
4. Create a GitHub issue with the `design-system` label

---

**Version**: 1.0.0 (Phase 1 - Foundation)
**Last Updated**: November 1, 2025
