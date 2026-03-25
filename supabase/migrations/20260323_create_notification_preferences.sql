-- ============================================================================
-- Notification Preferences & Dedup Tables
-- Phase 3 & 4: Server-side preferences, scheduled reminders, snooze
-- ============================================================================

-- Expand notification_type enum with new types
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'service_reminder';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'mileage_reminder';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'cost_alert';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'analytics_insight';

-- ============================================================================
-- notification_preferences: 1 row per user
-- ============================================================================
CREATE TABLE IF NOT EXISTS notification_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Per-type toggles
  service_reminders_enabled boolean NOT NULL DEFAULT true,
  mileage_reminders_enabled boolean NOT NULL DEFAULT true,
  cost_alerts_enabled boolean NOT NULL DEFAULT true,
  analytics_insights_enabled boolean NOT NULL DEFAULT true,
  log_updates_enabled boolean NOT NULL DEFAULT true,
  group_members_enabled boolean NOT NULL DEFAULT true,
  invitations_enabled boolean NOT NULL DEFAULT true,

  -- Delivery toggles
  push_notifications_enabled boolean NOT NULL DEFAULT true,
  in_app_toasts_enabled boolean NOT NULL DEFAULT true,

  -- Service reminder timing (days before due date)
  service_reminder_days jsonb NOT NULL DEFAULT '[30, 7, 3]'::jsonb,

  -- Mileage thresholds (km before typical interval)
  mileage_reminder_thresholds jsonb NOT NULL DEFAULT '[5000, 1000]'::jsonb,

  -- Cost alerts
  monthly_spending_threshold numeric DEFAULT NULL,
  fuel_price_alert_percentage int NOT NULL DEFAULT 20,

  -- Analytics frequency
  analytics_frequency text NOT NULL DEFAULT 'weekly'
    CHECK (analytics_frequency IN ('weekly', 'monthly', 'never')),

  -- Quiet hours
  quiet_hours_enabled boolean NOT NULL DEFAULT false,
  quiet_hours_start time DEFAULT '22:00',
  quiet_hours_end time DEFAULT '07:00',
  quiet_days jsonb DEFAULT '[]'::jsonb,
  timezone text NOT NULL DEFAULT 'UTC',

  -- Frequency limiting
  max_per_type_per_day int NOT NULL DEFAULT 3,

  -- Snooze: map of notification_type -> snoozed_until ISO timestamp
  snoozed_types jsonb NOT NULL DEFAULT '{}'::jsonb,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT notification_preferences_user_id_unique UNIQUE (user_id)
);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_notification_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_notification_preferences_updated_at
  BEFORE UPDATE ON notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_notification_preferences_updated_at();

-- ============================================================================
-- notification_dedup: prevents duplicate reminders
-- ============================================================================
CREATE TABLE IF NOT EXISTS notification_dedup (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_key text NOT NULL,
  sent_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT notification_dedup_user_key_unique UNIQUE (user_id, notification_key)
);

-- Index for cleanup queries
CREATE INDEX IF NOT EXISTS idx_notification_dedup_sent_at ON notification_dedup(sent_at);

-- ============================================================================
-- Add snoozed_until to notifications table
-- ============================================================================
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS snoozed_until timestamptz DEFAULT NULL;

-- ============================================================================
-- RLS Policies for notification_preferences
-- ============================================================================
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- Users can read their own preferences
CREATE POLICY "Users can view own notification preferences"
  ON notification_preferences FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own preferences
CREATE POLICY "Users can insert own notification preferences"
  ON notification_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own preferences
CREATE POLICY "Users can update own notification preferences"
  ON notification_preferences FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own preferences
CREATE POLICY "Users can delete own notification preferences"
  ON notification_preferences FOR DELETE
  USING (auth.uid() = user_id);

-- Service role full access (for webhooks/scheduled functions)
CREATE POLICY "Service role full access to notification preferences"
  ON notification_preferences FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================================================
-- RLS Policies for notification_dedup
-- ============================================================================
ALTER TABLE notification_dedup ENABLE ROW LEVEL SECURITY;

-- Service role full access (only server-side functions use this)
CREATE POLICY "Service role full access to notification dedup"
  ON notification_dedup FOR ALL
  USING (auth.role() = 'service_role');

-- Users can read their own dedup records
CREATE POLICY "Users can view own dedup records"
  ON notification_dedup FOR SELECT
  USING (auth.uid() = user_id);
