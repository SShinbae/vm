<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" style="height:64px;margin-right:32px"/>

# remove the voice interface, and write me a prompt based on your suggestion

Based on the design trends and your project structure, here's a comprehensive prompt for modernizing your vehicles tab/page:

***

## **Design Implementation Prompt: Modern Vehicles Tab Redesign**

Create a modern, intuitive vehicles tab/page for a React Native vehicle management app using React Native Unistyles. The design should follow 2025 automotive dashboard UI trends with a focus on minimalism, card-based layouts, and intelligent data visualization.[^1][^2][^3]

### **Layout Structure**

**Main View**: Implement a responsive bento grid layout that displays vehicle cards with the following characteristics:[^3][^6]

- Rounded corners using `theme.borderRadius.lg` (12px)
- Subtle elevation shadows for depth
- Generous white space with `theme.spacing.lg` padding
- Support for both light and dark themes from the Unistyles configuration[^10]

**Vehicle Cards**: Each card should display:[^2][^5]

- Large hero image from the `mainimageurl` field (database-v2.ts schema)
- Vehicle make, model, and year prominently displayed
- License plate number with subtle styling
- Current mileage with visual progress indicator
- Color accent badge matching the vehicle's `color` field
- Sharing status icon if `isownvehicle` is false or `sharedgroups` exist[^11]


### **Interactive Features**

**Micro-interactions and Animations**:[^6][^3]

- ✅ IMPLEMENTED: Subtle scale transform (0.98) on card press with spring animation
- ✅ IMPLEMENTED: Smooth transitions (200ms) for all state changes
- ✅ IMPLEMENTED: Pull-to-refresh with animated loading spinner
- ✅ IMPLEMENTED: Skeleton screens while loading using theme colors

**Bottom Sheet Modal**: When tapping a vehicle card, slide up a bottom sheet displaying:[^4][^3]

- ✅ IMPLEMENTED: Full vehicle details including VIN, color, current mileage
- ✅ IMPLEMENTED: Hero image display at the top
- ✅ IMPLEMENTED: Recent activity timeline showing latest entries from `mileagelogs`, `fuellogs`, and `servicelogs`[^11]
- ✅ IMPLEMENTED: Quick action buttons (Edit, Share) with haptic feedback
- ✅ IMPLEMENTED: Owner information card for shared vehicles using `ownerprofile` data[^11]
- ✅ IMPLEMENTED: Backdrop with tap-to-close functionality
- ✅ IMPLEMENTED: Pan down to close gesture
- ✅ IMPLEMENTED: Two snap points (50% and 90% of screen height)

**Swipeable Actions**: Implement swipe gestures on cards:[^12]

- Swipe right: Quick edit
- Swipe left: Delete with confirmation
- Color-coded backgrounds (edit: blue, delete: red) using theme colors


### **Data Visualization Widgets**

**Mileage Status Indicator**:[^13][^2]

- Circular progress indicator showing percentage to next service
- Display current mileage from `currentmileage` field
- Color-coded: green (normal), yellow (service approaching), red (overdue)

**Statistics Summary Cards** (above vehicle grid):[^3][^13]

- ✅ IMPLEMENTED: Total vehicles count
- ✅ IMPLEMENTED: Average mileage across all vehicles
- ✅ IMPLEMENTED: Monthly fuel costs (calculated from `fuellogs` for current month)
- ✅ IMPLEMENTED: Upcoming services count (from `servicelogs` where `nextservicedue` is within 30 days)
- ✅ IMPLEMENTED: Responsive text with adjustsFontSizeToFit to prevent wrapping

**Service Status Badges**:[^14][^13]

- ✅ IMPLEMENTED: Small pill-shaped badges on each card
- ✅ IMPLEMENTED: Display "Due Soon", "Up to Date", or "Overdue"
- ✅ IMPLEMENTED: Use theme colors: `success`, `warning`, `error`
- ✅ IMPLEMENTED: Positioned at top-left of hero image


### **Search and Filter System**

**Smart Search Bar** (top of screen):[^13][^3]

- ✅ IMPLEMENTED: Fixed header that stays visible while scrolling
- ✅ IMPLEMENTED: Real-time filtering by make, model, year, or license plate
- ✅ IMPLEMENTED: Search icon using theme's `textSecondary` color
- ✅ IMPLEMENTED: Clear button (X icon) appears when text is entered

**Filter Chips** (horizontal scrollable row below search):[^3][^13]

- ✅ IMPLEMENTED: "All Vehicles" (default active)
- ✅ IMPLEMENTED: "My Vehicles" (filters where `isownvehicle` = true)
- ✅ IMPLEMENTED: "Shared Vehicles" (filters where `sharedgroups` length > 0)
- ✅ IMPLEMENTED: Year ranges: "2020-2025", "2015-2019", "Before 2015"
- ✅ IMPLEMENTED: Active chip uses `theme.colors.primary` background with white text
- ✅ IMPLEMENTED: Inactive chips use `theme.colors.surface` background with border

**Sort Options**:[^15]

- Dropdown menu in header (right side)
- Options: "Newest First", "Oldest First", "Highest Mileage", "Last Updated"
- Implements `PaginationParams` sorting


### **Enhanced Information Display**

**Sharing Indicators**:[^14][^11]

- Group icon badge in top-right corner of cards for shared vehicles
- Shows number of groups vehicle is shared with
- On tap, displays quick modal with group names from `sharedgroups` array
- For non-owned vehicles, display small avatar of owner using `ownerprofile.avatarurl`

**Recent Activity Preview**:[^13][^3]

- ✅ IMPLEMENTED: Small timeline below vehicle details on card
- ✅ IMPLEMENTED: Last fuel entry: gas pump icon + date
- ✅ IMPLEMENTED: Last service: wrench icon + service type
- ✅ IMPLEMENTED: Displays in bottom sheet modal with full details
- ✅ IMPLEMENTED: Uses `latestfuel`, `latestservice`, `latestmileage` from VehicleWithDetails interface[^11]


### **Empty States and Onboarding**

**Empty State** (when no vehicles exist):[^16][^17]

- ✅ IMPLEMENTED: Centered car icon in circular background
- ✅ IMPLEMENTED: Heading: "No Vehicles Yet"
- ✅ IMPLEMENTED: Subtext: "Add your first vehicle to start tracking maintenance and fuel logs"
- ✅ IMPLEMENTED: Large CTA button with plus icon: "Add Vehicle" using `theme.colors.primary`
- ✅ IMPLEMENTED: Shows when filtered results return no vehicles

**Onboarding Tooltips** (first-time users):[^18]

- Highlight FAB button: "Tap here to add your first vehicle"
- Point to image area: "Upload photos to identify vehicles quickly"
- Sharing feature: "Share vehicles with family or groups"
- Use semi-transparent overlay with theme-colored pointers


### **Floating Action Button (FAB)**

**Position and Style**:[^12]

- ✅ IMPLEMENTED: Bottom-right corner, 24px from edges (theme.spacing.xl)
- ✅ IMPLEMENTED: Circular button using `theme.colors.primary`
- ✅ IMPLEMENTED: White plus icon centered
- ✅ IMPLEMENTED: Elevation shadow for depth (shadowOffset, shadowOpacity, elevation)
- ✅ IMPLEMENTED: Size: 56x56 (standard FAB dimensions)
- ✅ IMPLEMENTED: On press, navigate to Add Vehicle screen


### **Performance Optimizations**

**Image Handling**:[^17]

- Lazy load images using React Native's built-in Image component
- Show placeholder using `theme.colors.surface` while loading
- Generate thumbnails for list view (300x200)
- Cache images locally after first load

**Pagination**:[^15][^17]

- Load 10 vehicles initially
- Implement infinite scroll using `PaginationParams` interface
- Show loading spinner at bottom when fetching more
- Track with `currentpage`, `hasNext` from PaginatedResponse

**Skeleton Loading**:[^17][^3]

- ✅ IMPLEMENTED: Display 3 skeleton cards while initial data loads
- ✅ IMPLEMENTED: Display 4 skeleton stat cards in overview section
- ✅ IMPLEMENTED: Uses theme colors (disabled color for placeholders)
- ✅ IMPLEMENTED: Matches actual card dimensions and layout


### **Styling Guidelines**

**Color Palette** (from unistyles.ts):[^10]

- Primary actions: `theme.colors.primary` (\#007AFF light, \#0A84FF dark)
- Backgrounds: `theme.colors.background` (white/black)
- Cards: `theme.colors.surface` (\#F2F2F7 light, \#1C1C1E dark)
- Text: `theme.colors.text` (black/white)
- Borders: `theme.colors.border` (\#C6C6C8 light, \#38383A dark)
- Success: `theme.colors.success` (\#34C759 light, \#30D158 dark)
- Warning: `theme.colors.warning` (\#FF9500 light, \#FF9F0A dark)
- Error: `theme.colors.error` (\#FF3B30 light, \#FF453A dark)

**Typography**:[^10]

- Headings: `theme.fontSize.xl` (20px), `theme.fontWeight.bold` (700)
- Subheadings: `theme.fontSize.lg` (18px), `theme.fontWeight.semibold` (600)
- Body: `theme.fontSize.base` (16px), `theme.fontWeight.normal` (400)
- Captions: `theme.fontSize.sm` (14px), `theme.fontWeight.normal` (400)

**Spacing System**:[^10]

- Card padding: `theme.spacing.lg` (16px)
- Between cards: `theme.spacing.md` (12px)
- Section margins: `theme.spacing.xl` (24px)
- Tight spacing: `theme.spacing.sm` (8px)


### **Accessibility and UX**

**Minimalist Design Principles**:[^5][^3]

- Maximum 3 actions per card
- Clear information hierarchy: image > make/model > details
- No more than 2 colors per card (background + accent)
- Sufficient contrast ratios (4.5:1 for text)

**Gesture Support**:[^3]

- Swipe between vehicle detail images
- Pinch to zoom on vehicle photos
- Pull to refresh main list
- Long press on card for quick menu


### **Database Integration**

Use the following fields from your database schema:[^15][^11]

**From `VehicleWithDetails` interface**:

- `id`, `make`, `model`, `year`, `licenseplate`, `vin`
- `mainimageurl`, `color`, `currentmileage`
- `isownvehicle`, `ownerprofile`, `images`, `sharedgroups`
- `mileagelogs`, `fuellogs`, `servicelogs`
- `counts.fuelcount`, `counts.servicecount`, `counts.mileagecount`

**Fetch with**:

- Function: `getuservehicleswithsharing(user_uuid)`
- Returns vehicle data with sharing info and owner details


### **Component Structure**

```
VehiclesScreen
├── SearchBar
├── FilterChips
├── StatsSummary
│   ├── TotalVehiclesCard
│   ├── AvgMileageCard
│   └── UpcomingServicesCard
├── VehicleGrid
│   └── VehicleCard[]
│       ├── VehicleImage
│       ├── VehicleInfo
│       ├── MileageIndicator
│       ├── ServiceBadge
│       └── RecentActivityPreview
├── VehicleDetailSheet
│   ├── ImageCarousel
│   ├── DetailSection
│   ├── ActivityTimeline
│   └── ActionButtons
└── FloatingActionButton
```


### **Success Criteria**

The redesigned vehicles tab should achieve:[^6][^3]

- ✅ IMPLEMENTED: Clean, distraction-free interface with focused content
- ✅ IMPLEMENTED: Seamless light/dark mode transitions (via Unistyles)
- ✅ IMPLEMENTED: Instant visual feedback on all interactions (scale animations)
- ✅ IMPLEMENTED: Skeleton loading for better perceived performance
- ✅ IMPLEMENTED: Optimized with useMemo for filtered vehicles
- ✅ IMPLEMENTED: Intuitive navigation with bottom sheet modal for quick preview

### **Implementation Summary**

This implementation includes all major features from the design specification:

1. **Modern Card-Based Layout**: Hero images, service badges, sharing indicators
2. **Statistics Overview**: Total vehicles, avg mileage, monthly fuel, upcoming services
3. **Search & Filter**: Real-time search with filter chips for different categories
4. **Bottom Sheet Modal**: Quick vehicle details preview with activity timeline
5. **Micro-interactions**: Spring animations on card press (scale to 0.98)
6. **Skeleton Loading**: Professional loading states for stats and cards
7. **FAB Button**: Easy access to add new vehicles
8. **Fixed Header**: Stays visible while scrolling
9. **Responsive Design**: Works on mobile and desktop with ResponsiveGrid
10. **Empty States**: Beautiful empty state with call-to-action

### **Technical Implementation Details**

- **Library Used**: @gorhom/bottom-sheet for native bottom sheet experience
- **Gesture Handling**: GestureHandlerRootView wrapper for pan gestures
- **State Management**: React hooks (useState, useCallback, useMemo, useRef)
- **Styling**: React Native Unistyles with full theme support
- **Animations**: React Native Animated API with spring animations
- **Performance**: useMemo for filtering, adjustsFontSizeToFit for text wrapping prevention

***

This prompt provides a complete specification for modernizing your vehicles tab following 2025 automotive dashboard design trends while leveraging your existing database schema and Unistyles theme configuration.[^1][^2][^3][^10][^11]
<span style="display:none">[^7][^8][^9]</span>

<div align="center">⁂</div>

[^1]: https://autoreviewhub.com/trends-in-car-design-for-2025-from-retro-to-futuristic/

[^2]: https://www.accio.com/business/trend-of-car-dashboard

[^3]: https://govtcollegeofartanddesign.com/automotive-dashboard-ui-design-2025/

[^4]: https://myquu.net/the-digital-dash-in-2025-now-you-see-it/

[^5]: https://www.anoda.mobi/ux-blog/future-car-dashboard-ui-trends-design-user-experience

[^6]: https://www.linkedin.com/pulse/top-ux-design-trends-automotive-websites-2025-colorwhistle-eg7vc

[^7]: https://www.reddit.com/r/CarDesign/comments/1luwun5/what_is_the_problem_with_2025_car_design_give_off/

[^8]: https://nwcraftedinteriors.com/car-interior-upgrades-top-trends-for-2025/

[^9]: https://uk.finance.yahoo.com/news/intelligent-cockpit-design-trends-2025-112300417.html

[^10]: unistyles.ts

[^11]: database-v2.ts

[^12]: https://reactnativeexpert.com/blog/seamless-navigation-in-react-native-build-a-bottom-navigation-bar-for-all-screens/

[^13]: https://hicronsoftware.com/blog/fleet-management-dashboard-design/

[^14]: https://binmile.com/blog/top-fleet-management-technologies/

[^15]: index.ts

[^16]: https://bankeydigitalsolutions.com/blog/2025/02/10/innovative-ux-ui-design-trends-for-car-dealerships-in-2025/

[^17]: https://www.esparkinfo.com/blog/react-native-best-practices

[^18]: https://www.tekrevol.com/blogs/how-to-develop-a-car-maintenance-app/

