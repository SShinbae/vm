

```
I need to refactor my React Native ProfileScreen component to implement a modern 
tabbed interface that improves organization and user experience.

CURRENT SITUATION:
- Single scrolling page with all content (profile info, settings, notifications)
- Basic card layout with inline editing on web, modal editing on mobile
- Uses React Native, Expo Router, Supabase, and custom theme context
- Supports both light and dark modes with responsive layout hooks

REQUIREMENTS:

1. TAB STRUCTURE:
   - Implement 3 main tabs: "Profile", "Settings", "Notifications"
   - Use a horizontal segmented control for web (desktop/tablet)
   - Use top tabs with underline indicator for mobile
   - Smooth transitions between tabs (200-300ms)
   - Active tab should use brand color (colors.tint) with bold text (600 weight)
   - Inactive tabs use colors.icon with regular weight (400)

2. PROFILE TAB CONTENT:
   - Keep existing header with gradient background and decorative circles
   - Avatar upload with ImageUpload component (keep current functionality)
   - Display: full name, username, join date
   - Add stats row showing: "Total Logs", "Active Groups", "Days Active" 
     (use placeholder values like 0 for now)
   - Quick Actions section with cards for:
     * Edit Profile (opens edit mode/modal)
     * Groups (navigates to /groups)
     * Privacy Settings (placeholder for future)
   - Each quick action should have icon, label, subtitle, and chevron

3. SETTINGS TAB CONTENT:
   - Theme selection (System, Light, Dark) - keep current functionality
   - Account information display (read-only):
     * Email
     * Username
     * Full Name
     * Join Date
   - Edit Profile button that opens edit interface
   - Sign Out button at bottom (same functionality as current)

4. NOTIFICATIONS TAB CONTENT:
   - Move all notification preferences here (5 switches from current code)
   - Organized sections:
     * Activity Notifications (Log Updates, Group Members)
     * System Notifications (Invitations, In-App Toasts, Push Notifications)
   - Each section should have a header and grouped switches
   - Keep current AsyncStorage functionality

5. EDIT PROFILE FUNCTIONALITY:
   - Web: Transform Profile tab into edit mode with inline inputs
   - Mobile: Keep modal approach with current ImageUpload, form fields
   - Show Save/Cancel buttons during edit mode
   - Maintain all current validation and update logic
   - Keep loading states and error handling

6. DESIGN SPECIFICATIONS:
   - Follow Material Design 3 tab patterns
   - Tab bar should be sticky below header
   - Minimum touch targets: 44x44 points on mobile
   - Card-based layout with 16px margins
   - Use existing color scheme (colors.background, colors.surface, colors.tint)
   - Maintain responsive behavior with useResponsiveLayout hook
   - Support Platform.OS checks for web vs native
   - Smooth animations using Animated API if needed

7. STATS IMPLEMENTATION:
   - Create reusable StatItem component
   - Display 3 stats in a row with equal spacing
   - Each stat: numeric value (bold, large) and label (small, colors.icon)
   - Add subtle dividers between stats
   - Make stats touchable for future drill-down (no action yet)

8. CODE STRUCTURE:
   - Keep existing imports and contexts (useAuth, useTheme, useDialog)
   - Maintain SafeAreaView and ScrollView structure
   - Preserve all existing functions (handleUpdateProfile, handleAvatarUpload, etc.)
   - Use StyleSheet.create for all styles (maintain existing style patterns)
   - Add new components: TabBar, StatItem, SettingRow
   - Keep accessibility in mind (add accessibilityLabel and accessibilityRole)

9. EDGE CASES & ERROR HANDLING:
   - Handle null/undefined user profile data gracefully
   - Maintain loading states during profile updates
   - Preserve current Alert dialogs for errors and confirmations
   - Keep sign-out confirmation dialog
   - Tab persistence: default to Profile tab on mount

10. PERFORMANCE:
   - Only render active tab content (conditional rendering)
   - Memoize tab content components if needed
   - Maintain current AsyncStorage patterns for preferences
   - No unnecessary re-renders when switching tabs

CONSTRAINTS:
- Do not remove any existing functionality
- Keep all current imports and component dependencies
- Maintain compatibility with existing theme system
- Support both web and mobile platforms
- Preserve dark mode support
- Follow existing code style and naming conventions

OUTPUT FORMAT:
- Provide complete refactored ProfileScreen.tsx code
- Include inline comments explaining tab logic
- Add JSDoc comments for new components
- Maintain existing StyleSheet organization
- Show clear separation between tab content sections

EXAMPLE TAB BAR STRUCTURE:
```

const TabBar = ({ activeTab, onTabChange }) => (
<View style={styles.tabBar}>
{['Profile', 'Settings', 'Notifications'].map((tab) => (
<TouchableOpacity
key={tab}
style={[styles.tab, activeTab === tab \&\& styles.activeTab]}
onPress={() => onTabChange(tab)}
>
<Text style={[styles.tabText, activeTab === tab \&\& styles.activeTabText]}>
{tab}
</Text>
</TouchableOpacity>
))}
</View>
);

```

Please generate the complete refactored code with clear organization, proper TypeScript 
types, and all functionality preserved from the original implementation.
```


***


[^1]: https://help.openai.com/en/articles/6654000-best-practices-for-prompt-engineering-with-the-openai-api

[^2]: https://graphite.dev/guides/better-prompts-ai-code

[^3]: https://uxplanet.org/how-to-write-better-prompts-for-ai-design-code-generators-0e0b915e25ce

[^4]: https://www.reddit.com/r/ChatGPTCoding/comments/1f51y8s/a_collection_of_prompts_for_generating_high/

[^5]: https://community.openai.com/t/a-guide-to-crafting-effective-prompts-for-diverse-applications/493914

[^6]: https://www.pluralsight.com/resources/blog/software-development/prompt-engineering-for-developers

[^7]: https://www.promptingguide.ai/applications/coding

[^8]: https://cloud.google.com/discover/what-is-prompt-engineering

[^9]: https://www.reddit.com/r/ChatGPTCoding/comments/1jrc9bg/what_prompt_do_you_use_to_generate_stunning/

[^10]: https://mitsloanedtech.mit.edu/ai/basics/effective-prompts/

[^11]: https://code.visualstudio.com/docs/copilot/guides/prompt-engineering-guide

[^12]: https://designcode.io/prompt-ui-intro/

[^13]: https://learn.microsoft.com/en-us/azure/ai-foundry/openai/concepts/prompt-engineering

[^14]: https://www.builder.io/blog/prompting-tips

[^15]: https://www.youtube.com/watch?v=M-uUFLU9IFU

[^16]: https://www.reddit.com/r/PromptEngineering/comments/1kz5gem/share_your_prompt_to_generate_ui_designs/

