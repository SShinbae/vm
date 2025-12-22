-- Note: This migration creates webhook configuration
-- You still need to enable webhooks in Supabase Dashboard and add your Netlify URL

-- Create webhook for group invitations
-- This is a reference - actual webhook setup must be done in Supabase Dashboard
--
-- Webhook Config:
-- Table: group_invitations
-- Events: INSERT
-- URL: https://YOUR-NETLIFY-SITE.netlify.app/.netlify/functions/send-push-notification
-- Method: POST
-- Headers: Content-Type: application/json

-- Create webhook for fuel logs
-- Table: fuel_logs
-- Events: INSERT, UPDATE, DELETE
-- URL: https://YOUR-NETLIFY-SITE.netlify.app/.netlify/functions/send-push-notification

-- Create webhook for mileage logs
-- Table: mileage_logs
-- Events: INSERT, UPDATE, DELETE
-- URL: https://YOUR-NETLIFY-SITE.netlify.app/.netlify/functions/send-push-notification

-- Create webhook for service logs
-- Table: service_logs
-- Events: INSERT, UPDATE, DELETE
-- URL: https://YOUR-NETLIFY-SITE.netlify.app/.netlify/functions/send-push-notification

-- Create webhook for group members
-- Table: group_members
-- Events: INSERT, DELETE
-- URL: https://YOUR-NETLIFY-SITE.netlify.app/.netlify/functions/send-push-notification

-- Note: Actual webhooks must be configured in the Supabase Dashboard
-- This file serves as documentation for the required webhooks
