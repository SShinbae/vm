<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" style="height:64px;margin-right:32px"/>

# write me a prompt based on your suggestion

Based on the improvements suggested, here's a comprehensive prompt you can use to implement or enhance your bottom navbar:

***

## Prompt: Create a Responsive Mobile Bottom Navigation Bar

**Context:**
I'm building a React Native app using Expo Router with React Native Unistyles for styling. My theme configuration is already set up in `unistyles.ts` with colors, spacing, fontSize, and breakpoints (xs, sm, md, lg, xl).

**Requirements:**

### Design Specifications

- Create a bottom tab navigation bar with 3-5 primary destinations (Home, Vehicles, Analytics, Logs,  Profile)
- Each tab icon must have minimum touch targets of 48×48dp with adequate spacing between items
- Implement clear visual distinction between active (primary color) and inactive states (textSecondary with 60% opacity)
- Ensure the tab bar respects device safe areas and sits above the home indicator on gesture-based devices
- Groups will be in profile tabs


### Responsive Behavior

- Use Unistyles breakpoints to adapt the navbar:
    - Mobile (xs-sm): Bottom position with 60px height
    - Tablet/larger (md+): Consider left-side positioning with 70px height
- Apply responsive sizing for icons (24px on mobile, 28px on tablets) and labels (fontSize.xs on mobile, fontSize.sm on tablets)


### Technical Implementation

- Use React Navigation's Bottom Tabs Navigator for native performance
- Wrap the app in `SafeAreaProvider` and use `useSafeAreaInsets` hook for proper padding
- Implement lazy loading (default) for tab screens to optimize performance
- Add subtle micro-interactions: scale animation (0.95-1.0) on press with 200ms duration


### Styling with Unistyles

Create a responsive stylesheet that uses:

- `theme.colors.surface` for background
- `theme.colors.border` for top border (1px)
- `theme.spacing` values for padding (sm on mobile, md on tablets)
- `theme.colors.primary` for active state
- `theme.colors.textSecondary` for inactive state


### Accessibility

- Include `accessibilityLabel` and `accessibilityState` for each tab
- Maintain WCAG contrast ratio of 4.5:1 for text/icons and 3:1 for UI components
- Add `accessibilityRole="button"` and proper focus indicators


### Additional Features

- Add badge support for notifications on specific tabs (max 99+)
- Implement haptic feedback on tab press using `react-native-haptic-feedback`
- Ensure icons are universally recognizable with optional short one-word labels below
- Prevent accidental system gesture triggers by maintaining proper bottom padding

**Output:** Provide the complete implementation including the tab bar component, stylesheet using Unistyles, and integration code with proper TypeScript typing based on my existing navigation types (TabStackParamList from `index.ts`).

***

This prompt includes all the key improvements from my suggestions and is tailored to your specific tech stack, making it ready to use with an AI coding assistant or as developer documentation.[^1][^2][^3][^6][^10][^11][^12][^13]
<span style="display:none">[^4][^5][^7][^8][^9]</span>

<div align="center">⁂</div>

[^1]: https://reactnavigation.org/docs/bottom-tab-navigator/

[^2]: https://reactnativeexpert.com/blog/seamless-navigation-in-react-native-build-a-bottom-navigation-bar-for-all-screens/

[^3]: https://stackoverflow.com/questions/77101877/android-bottom-home-bar-covers-bottom-navigation

[^4]: https://www.dhiwise.com/post/the-complete-guide-to-implementing-react-navigation-bottom-tabs

[^5]: http://www.dactylgroup.com/en/stylish-bottom-tabs-in-react-native

[^6]: https://reactnavigation.org/docs/handling-safe-area/

[^7]: https://www.reddit.com/r/reactnative/comments/1adh2he/best_practices_for_nested_navigation/

[^8]: https://www.techaheadcorp.com/blog/architecting-seamless-navigation-for-react-native-apps-patterns-libraries-best-practices/

[^9]: https://m2.material.io/components/bottom-navigation

[^10]: https://www.appmysite.com/blog/bottom-navigation-bar-in-mobile-apps-heres-all-you-need-to-know/

[^11]: UNISTYLES_MIGRATION.md

[^12]: unistyles.ts

[^13]: index.ts

