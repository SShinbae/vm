Notification System Implementation Plan
Overview
Implement a comprehensive notification system with 4 key features:
Service Reminders - 30/7/3 day and 5000/1000km before upcoming services
Mileage-Based Reminders - Oil change, tire rotation, general maintenance intervals
Cost Alerts - Unusual fuel costs, monthly spending thresholds, cost comparisons
Analytics Insights - Fuel efficiency trends, service cost trends, monthly summaries
Architecture (Robust Approach)
Backend (Supabase Edge Functions):
Daily scheduled function to check for due services/maintenances
Cost analysis function (runs weekly)
Analytics calculation function (runs monthly)
Automatic notification record creation in database
Push notification sending to all affected user devices
Frontend Enhancements:
Notification preferences screen (enable/disable notification types, frequency, quiet hours)
Enhanced NotificationContext with caching and deduplication
Background fetch setup (expo-background-fetch + expo-task-manager) as backup
Local notification scheduling for critical alerts
Implementation Phases
Phase 1: Database & Backend Setup
Create Supabase Edge Functions for:
Service reminder checker (runs daily)
Cost alert analyzer (runs weekly)
Analytics insights generator (runs monthly)
Update database schema with notification types and user preferences
Set up notification deduplication (prevent duplicate reminders)
Configure RLS policies for notification preferences
Phase 2: Push Notification Enhancement
Implement server-side push notification sending via Expo API
Add notification templates for each alert type
Set up notification batching (group related alerts)
Add delivery tracking and retry logic
Phase 3: Frontend - Settings & Preferences
Create notification preferences screen with toggles for:
Service reminders (on/off, reminder timing)
Mileage reminders (on/off, intervals)
Cost alerts (on/off, threshold amounts)
Analytics insights (on/off, frequency)
Quiet hours settings (time range + days)
Notification history/archive feature
Phase 4: Local Notification & Background Tasks
Install expo-background-fetch and expo-task-manager
Register background fetch task (runs daily as backup)
Schedule local notifications for critical alerts
Implement snooze functionality (1 day, 3 days, 1 week)
Phase 5: Documentation & Testing
Complete docs/notifications.md with architecture, API specs, examples
Test all notification flows end-to-end
Validate backend functions and schedules
Key Files to Create/Modify
Create New Files:
/supabase/functions/check-service-reminders/index.ts - Daily service checks
/supabase/functions/analyze-cost-alerts/index.ts - Weekly cost analysis
/supabase/functions/generate-analytics-insights/index.ts - Monthly analytics
/lib/tasks/backgroundTasks.ts - Background fetch registration
/app/(tabs)/settings/notifications.tsx - Notification preferences UI
/components/notifications/NotificationPreferences.tsx - Preferences component
/types/notifications.ts - Enhanced notification types
/lib/services/notificationScheduler.ts - Local notification scheduling
/docs/notifications.md - Complete documentation
Modify Existing Files:
lib/contexts/NotificationContext.tsx - Add preference management, deduplication
lib/services/pushNotificationService.ts - Add server-side push capability
types/analytics.ts - Add notification-related types
app/\_layout.tsx - Register background tasks
supabase/migrations/ - Add notification preferences table
Notification Timing Details
Service Reminders:
30 days before due date
7 days before due date
3 days before due date (multiple notifications)
Overdue status
Mileage-Based:
5000km before next service
1000km before next service
Overdue mileage
Cost Alerts:
Monthly spending threshold exceeded (configurable)
Unusual fuel price (20% above average)
Location-based cheaper fuel availability
Analytics Insights:
Weekly fuel efficiency trend (declining performance alert)
Monthly service cost summary
Monthly fuel cost summary
Annual cost breakdown
User Preferences
Per-notification-type enable/disable toggles
Reminder timing customization (days/km before)
Quiet hours (e.g., 10 PM - 8 AM)
Quiet days (e.g., weekends only)
Frequency limiting (max 1 reminder per notification type per day)
Snooze options (1 day, 3 days, 1 week, until date)
Success Criteria
All 4 notification types trigger correctly based on data
Push notifications deliver to all user devices
User preferences respected and persisted
No duplicate notifications sent
Background tasks run reliably
Complete documentation with examples and API specs
