## Project Development Prompt

**Role**: You are an expert React Native developer specializing in mobile dashboard UIs, TypeScript, Supabase integration, and React Native Unistyles.[^1][^2]

**Project Context**: I'm building a vehicle tracking mobile application with the following technology stack:[^3][^4][^5]

- **Frontend**: React Native with Expo Router
- **Styling**: React Native Unistyles (migrated from NativeWind)
- **Backend**: Supabase for authentication and PostgreSQL database
- **Language**: TypeScript with strict mode enabled
- **Features**: Vehicle management, mileage tracking, fuel logging, service records, and group sharing

**Database Schema Overview**:[^4][^3]

- **profiles**: User profiles with avatar_url, full_name, phone, bio
- **vehicles**: Vehicle data including make, model, year, license_plate, vin, main_image_url, color, current_mileage, shared_with_groups
- **vehicle_images**: Gallery images for vehicles
- **vehicle_group_shares**: Selective vehicle sharing with specific groups
- **groups**: User groups for collaborative vehicle tracking
- **group_members**: Group membership relationships
- **group_invitations**: Pending/accepted/declined group invitations
- **mileage_logs**: Odometer readings with dates and notes
- **fuel_logs**: Fuel fill-ups with liters_filled, cost, fuel_price, odometer_reading, location
- **service_logs**: Service records with service_type, description, cost, odometer_reading, next_service_due
- **service_templates**: Reusable service templates with items

**Current Theme Configuration**:[^5]

- Light and dark themes with full color palettes
- Spacing scale: xs(4), sm(8), md(12), lg(16), xl(24), xxl(32), xxxl(48)
- Font sizes: xs(12), sm(14), base(16), lg(18), xl(20), 2xl(24), 3xl(30), 4xl(36)
- Border radius: sm(4), md(8), lg(12), xl(16), full(9999)
- Font weights: light(300), normal(400), medium(500), semibold(600), bold(700)

**Task**: Create a modern mobile dashboard for the main home screen that displays:[^2][^1]

1. **Stats Card Grid Section**:
   - Display 4 key metrics in a 2x2 grid: Total Vehicles, Total Mileage (sum across all vehicles), Monthly Fuel Cost, Upcoming Services
   - Each card should show the metric value, a relevant emoji icon, and percentage change indicator
   - Use theme.colors.surface for card background with shadow elevation
   - Cards should be responsive with 47% width and theme.spacing.md gap
2. **Vehicle List Section**:
   - Fetch and display user's vehicles from Supabase using the vehicles table
   - Each vehicle card shows: year/make/model, license plate, main_image_url (with placeholder if null), current_mileage, color
   - Include a badge indicating if vehicle is shared with groups (vehicle_group_shares table)
   - Use FlatList for performance with proper keyExtractor
   - Cards should have theme.borderRadius.xl and elevation shadows
3. **Recent Activity Timeline**:
   - Fetch and combine recent entries from mileage_logs, fuel_logs, and service_logs (limit 5 most recent)
   - Display in chronological order with color-coded icons based on activity type
   - Each timeline item shows: activity type, date (formatted as relative time), primary value, and vehicle name
   - Use theme.colors.warning for fuel, theme.colors.error for service, theme.colors.primary for mileage
4. **Quick Action Buttons**:
   - 4 circular action buttons in a row: "Add Fuel", "Log Service", "Update Mileage", "Add Vehicle"
   - Each button uses theme-based colored backgrounds with opacity (e.g., theme.colors.primary + '15')
   - Large touch targets (56px) optimized for mobile with theme.spacing.lg padding
   - Navigate to respective screens using Expo Router navigation

**Technical Requirements**:[^6][^2]

- Use `createStyleSheet` from react-native-unistyles for all styling
- Implement proper TypeScript types from the Database interface
- Use Supabase client from `@/lib/supabaseClient`
- Handle loading states and errors gracefully with proper UI feedback
- Implement pull-to-refresh functionality on ScrollView
- Follow modern mobile UI best practices: card-based layouts, proper spacing, elevation shadows, touch-friendly buttons
- Ensure accessibility with proper semantic labels
- Use theme values exclusively - no hardcoded colors, spacing, or font sizes
- Implement proper type safety for all Supabase queries using Database types from `@/types/database.ts`

**Output Format**:[^1][^2]

1. Complete React Native component code with TypeScript
2. Supabase query functions for fetching data
3. Type definitions for component props and data structures
4. Inline comments explaining complex logic
5. Error handling for network failures and empty states

**Code Style Preferences**:[^7][^6]

- Use functional components with hooks
- Destructure theme from useStyles hook
- Keep components modular and reusable
- Use async/await for Supabase queries
- Include proper error boundaries
- Follow React Native best practices for performance

**Constraints**:[^6][^2]

- Do not use inline styles or StyleSheet.create - only use createStyleSheet from Unistyles
- Avoid any dependencies not already in the project
- Keep the component under 500 lines - extract sub-components if needed
- Ensure all database queries are properly typed with the Database interface
- Handle both light and dark themes automatically through Unistyles

**Additional Context**: The dashboard should feel modern, clean, and highly usable on mobile devices with intuitive gestures and smooth animations. Prioritize displaying the most relevant information at a glance while providing easy access to detailed views through navigation.[^8][^2][^6][^1]

[^1]: https://www.atlassian.com/blog/artificial-intelligence/ultimate-guide-writing-ai-prompts

[^2]: https://www.prompthub.us/blog/10-best-practices-for-prompt-engineering-with-any-model

[^3]: database.ts

[^4]: database-v2.ts

[^5]: unistyles.ts

[^6]: https://palantir.com/docs/foundry/aip/best-practices-prompt-engineering/

[^7]: https://www.digitalocean.com/resources/articles/prompt-engineering-best-practices

[^8]: https://help.openai.com/en/articles/6654000-best-practices-for-prompt-engineering-with-the-openai-api

[^9]: https://mitsloanedtech.mit.edu/ai/basics/effective-prompts/

[^10]: https://cloud.google.com/discover/what-is-prompt-engineering

[^11]: https://www.promptingguide.ai/introduction/tips

[^12]: https://community.openai.com/t/a-guide-to-crafting-effective-prompts-for-diverse-applications/493914

[^13]: https://www.reddit.com/r/ChatGPTPromptGenius/comments/13vyz0u/compilation_of_prompt_engineering_basic_rules/

[^14]: https://www.reddit.com/r/ChatGPTCoding/comments/1f51y8s/a_collection_of_prompts_for_generating_high/

[^15]: https://www.youtube.com/watch?v=uwA3MMYBfAQ

[^16]: https://www.lakera.ai/blog/prompt-engineering-guide

[^17]: https://help.formaloo.com/en/articles/9797669-how-to-write-effective-ai-prompts

[^18]: https://www.huit.harvard.edu/news/ai-prompts

[^19]: https://dev.to/itshayder/how-to-write-ai-prompts-that-actually-work-4-game-changing-tips-388h
