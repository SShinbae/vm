# Migration Guide: NativeWind to React Native Unistyles

## What Changed

You've successfully migrated from **NativeWind** (Tailwind CSS for React Native) to **React Native Unistyles** (a modern, performant styling solution).

## Why Unistyles?

- ✅ **Better Performance** - Compile-time optimization
- ✅ **Type-Safe** - Full TypeScript support
- ✅ **Dynamic Theming** - Built-in light/dark mode
- ✅ **Responsive** - Breakpoints for different screen sizes
- ✅ **No Build Issues** - No lightningcss binary problems

## How to Use Unistyles

### Basic Usage

Instead of using `className` prop with Tailwind classes:

```tsx
// ❌ OLD (NativeWind)
<View className="flex-1 bg-white p-4">
  <Text className="text-lg font-bold text-blue-500">Hello</Text>
</View>
```

You now use the `StyleSheet.create()` API with theme support:

```tsx
// ✅ NEW (Unistyles)
import { View, Text } from "react-native";
import { StyleSheet } from "react-native-unistyles";

function MyComponent() {
  const { styles, theme } = StyleSheet.create(stylesheet);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Hello</Text>
    </View>
  );
}

const stylesheet = (theme) => ({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: theme.spacing.lg,
  },
  title: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.primary,
  },
});
```

### Using the Theme

Access theme values directly:

```tsx
import { StyleSheet } from "react-native-unistyles";

const { theme } = StyleSheet.create({});

// Use theme colors, spacing, fontSize, etc.
const myColor = theme.colors.primary;
const mySpacing = theme.spacing.md;
```

### Responsive Styles (Breakpoints)

```tsx
const stylesheet = (theme) => ({
  container: {
    padding: {
      xs: theme.spacing.sm, // Mobile
      md: theme.spacing.lg, // Tablet
      xl: theme.spacing.xxl, // Desktop
    },
  },
});
```

### Dynamic Variants

```tsx
const stylesheet = (theme, runtime) => ({
  button: {
    padding: theme.spacing.md,
    backgroundColor: runtime.primary
      ? theme.colors.primary
      : theme.colors.secondary,
  },
});

// Usage
function MyButton({ primary }) {
  const { styles } = StyleSheet.create(stylesheet, { primary });
  return <TouchableOpacity style={styles.button} />;
}
```

## Theme Configuration

Your theme is defined in `/unistyles.ts`:

- **Colors**: `theme.colors.primary`, `theme.colors.text`, etc.
- **Spacing**: `theme.spacing.xs`, `theme.spacing.sm`, `theme.spacing.md`, etc.
- **Font Sizes**: `theme.fontSize.xs`, `theme.fontSize.base`, `theme.fontSize.xl`, etc.
- **Border Radius**: `theme.borderRadius.sm`, `theme.borderRadius.lg`, etc.
- **Font Weights**: `theme.fontWeight.normal`, `theme.fontWeight.bold`, etc.

## Common Patterns

### Flex Layout

```tsx
// NativeWind: className="flex-1 flex-row items-center justify-between"
// Unistyles:
{
  flex: 1,
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
}
```

### Padding/Margin

```tsx
// NativeWind: className="p-4 mx-2"
// Unistyles:
{
  padding: theme.spacing.lg,  // 16px
  marginHorizontal: theme.spacing.sm,  // 8px
}
```

### Text Styles

```tsx
// NativeWind: className="text-xl font-bold text-gray-800"
// Unistyles:
{
  fontSize: theme.fontSize.xl,
  fontWeight: theme.fontWeight.bold,
  color: theme.colors.gray[800],
}
```

### Background & Border

```tsx
// NativeWind: className="bg-white border border-gray-300 rounded-lg"
// Unistyles:
{
  backgroundColor: theme.colors.background,
  borderWidth: 1,
  borderColor: theme.colors.border,
  borderRadius: theme.borderRadius.lg,
}
```

## Example Component

See `/components/examples/UnistylesExample.tsx` for a complete example.

## Next Steps

1. Start migrating your components one by one
2. Remove any `className` props
3. Replace with `style` prop using Unistyles
4. Test on both light and dark modes
5. Test on different screen sizes

## Need Help?

- [Unistyles Documentation](https://reactnativeunistyles.vercel.app/)
- [Unistyles GitHub](https://github.com/jpudysz/react-native-unistyles)
