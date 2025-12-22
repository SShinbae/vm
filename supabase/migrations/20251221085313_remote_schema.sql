


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."image_type" AS ENUM (
    'profile_avatar',
    'vehicle_main',
    'vehicle_gallery'
);


ALTER TYPE "public"."image_type" OWNER TO "postgres";


CREATE TYPE "public"."invitation_status" AS ENUM (
    'pending',
    'accepted',
    'declined',
    'expired'
);


ALTER TYPE "public"."invitation_status" OWNER TO "postgres";


CREATE TYPE "public"."service_type" AS ENUM (
    'oil_change',
    'tire_rotation',
    'brake_service',
    'general_maintenance',
    'repair',
    'inspection',
    'other'
);


ALTER TYPE "public"."service_type" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_accessible_share_ids"("user_uuid" "uuid") RETURNS TABLE("share_id" "uuid")
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    RETURN QUERY
    SELECT vgs.id as share_id
    FROM vehicle_group_shares vgs
    JOIN vehicles v ON vgs.vehicle_id = v.id
    WHERE v.user_id = user_uuid
    
    UNION
    
    SELECT vgs.id as share_id
    FROM vehicle_group_shares vgs
    JOIN group_members gm ON vgs.group_id = gm.group_id
    WHERE gm.user_id = user_uuid;
END;
$$;


ALTER FUNCTION "public"."get_accessible_share_ids"("user_uuid" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_accessible_vehicle_ids"("user_uuid" "uuid") RETURNS TABLE("vehicle_id" "uuid")
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    RETURN QUERY
    SELECT v.id as vehicle_id
    FROM vehicles v
    WHERE v.user_id = user_uuid
    
    UNION
    
    SELECT vgs.vehicle_id
    FROM vehicle_group_shares vgs
    JOIN group_members gm ON vgs.group_id = gm.group_id
    WHERE gm.user_id = user_uuid;
END;
$$;


ALTER FUNCTION "public"."get_accessible_vehicle_ids"("user_uuid" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_group_invitations_with_details"("group_uuid" "uuid") RETURNS TABLE("invitation_id" "uuid", "group_id" "uuid", "group_name" "text", "group_description" "text", "invited_email" "text", "invited_by_id" "uuid", "invited_by_name" "text", "invited_by_email" "text", "status" "public"."invitation_status", "created_at" timestamp with time zone, "expires_at" timestamp with time zone)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    RETURN QUERY
    SELECT
        gi.id as invitation_id,
        gi.group_id,
        g.name as group_name,
        g.description as group_description,
        gi.email as invited_email,
        gi.invited_by as invited_by_id,
        p.full_name as invited_by_name,
        p.email as invited_by_email,
        gi.status,
        gi.created_at,
        gi.expires_at
    FROM group_invitations gi
    JOIN groups g ON gi.group_id = g.id
    JOIN profiles p ON gi.invited_by = p.id
    WHERE gi.group_id = group_uuid
    ORDER BY gi.created_at DESC;
END;
$$;


ALTER FUNCTION "public"."get_group_invitations_with_details"("group_uuid" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_group_members_with_profiles"("group_uuid" "uuid") RETURNS TABLE("member_id" "uuid", "user_id" "uuid", "email" "text", "full_name" "text", "avatar_url" "text", "phone" "text", "bio" "text", "joined_at" timestamp with time zone, "is_owner" boolean)
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
    -- Group owner
    SELECT
        null::uuid as member_id,
        g.owner_id as user_id,
        p.email,
        p.full_name,
        p.avatar_url,
        p.phone,
        p.bio,
        g.created_at as joined_at,
        true as is_owner
    FROM groups g
    JOIN profiles p ON g.owner_id = p.id
    WHERE g.id = group_uuid

    UNION ALL

    -- Group members
    SELECT
        gm.id as member_id,
        gm.user_id,
        p.email,
        p.full_name,
        p.avatar_url,
        p.phone,
        p.bio,
        gm.joined_at,
        false as is_owner
    FROM group_members gm
    JOIN profiles p ON gm.user_id = p.id
    WHERE gm.group_id = group_uuid
    AND gm.user_id != (SELECT owner_id FROM groups WHERE id = group_uuid)

    ORDER BY is_owner DESC, joined_at ASC;
$$;


ALTER FUNCTION "public"."get_group_members_with_profiles"("group_uuid" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_group_ids"("user_uuid" "uuid") RETURNS "uuid"[]
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
    SELECT ARRAY(
        SELECT group_id
        FROM group_members
        WHERE user_id = user_uuid
    );
$$;


ALTER FUNCTION "public"."get_user_group_ids"("user_uuid" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_groups_safe"("user_uuid" "uuid") RETURNS "uuid"[]
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    group_ids uuid[];
BEGIN
    -- This function bypasses RLS to prevent recursion
    SELECT ARRAY(
        SELECT group_id
        FROM group_members
        WHERE user_id = user_uuid
    ) INTO group_ids;

    RETURN COALESCE(group_ids, ARRAY[]::uuid[]);
END;
$$;


ALTER FUNCTION "public"."get_user_groups_safe"("user_uuid" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_invitations_with_details"("user_email" "text") RETURNS TABLE("invitation_id" "uuid", "group_id" "uuid", "group_name" "text", "group_description" "text", "invited_by_id" "uuid", "invited_by_name" "text", "invited_by_email" "text", "status" "public"."invitation_status", "created_at" timestamp with time zone, "expires_at" timestamp with time zone)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    RETURN QUERY
    SELECT
        gi.id as invitation_id,
        gi.group_id,
        g.name as group_name,
        g.description as group_description,
        gi.invited_by as invited_by_id,
        p.full_name as invited_by_name,
        p.email as invited_by_email,
        gi.status,
        gi.created_at,
        gi.expires_at
    FROM group_invitations gi
    JOIN groups g ON gi.group_id = g.id
    JOIN profiles p ON gi.invited_by = p.id
    WHERE gi.email = user_email
    ORDER BY gi.created_at DESC;
END;
$$;


ALTER FUNCTION "public"."get_user_invitations_with_details"("user_email" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_vehicles_with_sharing"("user_uuid" "uuid") RETURNS TABLE("vehicle_id" "uuid", "make" "text", "model" "text", "year" integer, "license_plate" "text", "vin" "text", "main_image_url" "text", "color" "text", "current_mileage" integer, "created_at" timestamp with time zone, "updated_at" timestamp with time zone, "is_own_vehicle" boolean, "owner_name" "text", "owner_email" "text", "shared_groups" "text"[])
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
    -- Own vehicles
    SELECT
        v.id,
        v.make,
        v.model,
        v.year,
        v.license_plate,
        v.vin,
        v.main_image_url,
        v.color,
        v.current_mileage,
        v.created_at,
        v.updated_at,
        true as is_own_vehicle,
        p.full_name as owner_name,
        p.email as owner_email,
        ARRAY(
            SELECT g.name
            FROM vehicle_group_shares vgs
            JOIN groups g ON vgs.group_id = g.id
            WHERE vgs.vehicle_id = v.id
        ) as shared_groups
    FROM vehicles v
    JOIN profiles p ON v.user_id = p.id
    WHERE v.user_id = user_uuid

    UNION ALL

    -- Shared vehicles
    SELECT
        v.id,
        v.make,
        v.model,
        v.year,
        v.license_plate,
        v.vin,
        v.main_image_url,
        v.color,
        v.current_mileage,
        v.created_at,
        v.updated_at,
        false as is_own_vehicle,
        p.full_name as owner_name,
        p.email as owner_email,
        ARRAY(
            SELECT g.name
            FROM vehicle_group_shares vgs2
            JOIN groups g ON vgs2.group_id = g.id
            WHERE vgs2.vehicle_id = v.id
        ) as shared_groups
    FROM vehicles v
    JOIN profiles p ON v.user_id = p.id
    JOIN vehicle_group_shares vgs ON v.id = vgs.vehicle_id
    JOIN group_members gm ON vgs.group_id = gm.group_id
    WHERE gm.user_id = user_uuid
    AND v.user_id != user_uuid
$$;


ALTER FUNCTION "public"."get_user_vehicles_with_sharing"("user_uuid" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."share_vehicle_with_groups"("vehicle_uuid" "uuid", "group_uuids" "uuid"[]) RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    group_uuid uuid;
BEGIN
    -- Verify user owns the vehicle
    IF NOT EXISTS (
        SELECT 1 FROM vehicles
        WHERE id = vehicle_uuid AND user_id = auth.uid()
    ) THEN
        RAISE EXCEPTION 'You can only share your own vehicles';
    END IF;

    -- Remove existing shares for this vehicle
    DELETE FROM vehicle_group_shares WHERE vehicle_id = vehicle_uuid;

    -- Add new shares
    FOREACH group_uuid IN ARRAY group_uuids
    LOOP
        -- Verify user is member of the group or owns it
        IF EXISTS (
            SELECT 1 FROM group_members
            WHERE group_id = group_uuid AND user_id = auth.uid()
        ) OR EXISTS (
            SELECT 1 FROM groups
            WHERE id = group_uuid AND owner_id = auth.uid()
        ) THEN
            INSERT INTO vehicle_group_shares (vehicle_id, group_id, shared_by)
            VALUES (vehicle_uuid, group_uuid, auth.uid())
            ON CONFLICT (vehicle_id, group_id) DO NOTHING;
        END IF;
    END LOOP;

    RETURN true;
END;
$$;


ALTER FUNCTION "public"."share_vehicle_with_groups"("vehicle_uuid" "uuid", "group_uuids" "uuid"[]) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_service_template_total_cost"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- Update the total cost of the template
    UPDATE service_templates
    SET total_cost = (
        SELECT COALESCE(SUM(price), 0)
        FROM service_template_items
        WHERE template_id = COALESCE(NEW.template_id, OLD.template_id)
    )
    WHERE id = COALESCE(NEW.template_id, OLD.template_id);

    RETURN COALESCE(NEW, OLD);
END;
$$;


ALTER FUNCTION "public"."update_service_template_total_cost"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."user_is_group_member"("user_uuid" "uuid", "group_uuid" "uuid") RETURNS boolean
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
    SELECT EXISTS(
        SELECT 1 FROM group_members
        WHERE group_id = group_uuid AND user_id = user_uuid
    );
$$;


ALTER FUNCTION "public"."user_is_group_member"("user_uuid" "uuid", "group_uuid" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."user_owns_group"("user_uuid" "uuid", "group_uuid" "uuid") RETURNS boolean
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
    SELECT EXISTS(
        SELECT 1 FROM groups
        WHERE id = group_uuid AND owner_id = user_uuid
    );
$$;


ALTER FUNCTION "public"."user_owns_group"("user_uuid" "uuid", "group_uuid" "uuid") OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."fuel_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "vehicle_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "liters_filled" numeric(8,2) NOT NULL,
    "cost" numeric(10,2),
    "date" "date" NOT NULL,
    "odometer_reading" integer NOT NULL,
    "location" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "fuel_price" numeric(5,3),
    CONSTRAINT "fuel_logs_cost_check" CHECK (("cost" >= (0)::numeric)),
    CONSTRAINT "fuel_logs_liters_filled_check" CHECK (("liters_filled" > (0)::numeric)),
    CONSTRAINT "fuel_logs_odometer_reading_check" CHECK (("odometer_reading" >= 0))
);


ALTER TABLE "public"."fuel_logs" OWNER TO "postgres";


COMMENT ON COLUMN "public"."fuel_logs"."fuel_price" IS 'Price per liter of fuel (e.g., 1.99 for RM1.99 per liter)';



CREATE TABLE IF NOT EXISTS "public"."group_invitations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "group_id" "uuid" NOT NULL,
    "email" "text" NOT NULL,
    "invited_by" "uuid" NOT NULL,
    "status" "public"."invitation_status" DEFAULT 'pending'::"public"."invitation_status" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "expires_at" timestamp with time zone NOT NULL
);


ALTER TABLE "public"."group_invitations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."group_members" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "group_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "joined_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."group_members" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."groups" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "owner_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."groups" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."mileage_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "vehicle_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "odometer_reading" integer NOT NULL,
    "date" "date" NOT NULL,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    CONSTRAINT "mileage_logs_odometer_reading_check" CHECK (("odometer_reading" >= 0))
);


ALTER TABLE "public"."mileage_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "email" "text" NOT NULL,
    "full_name" "text",
    "avatar_url" "text",
    "phone" "text",
    "bio" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "username" "text"
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."push_tokens" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "token" "text" NOT NULL,
    "device_type" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."push_tokens" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."service_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "vehicle_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "service_type" "public"."service_type" NOT NULL,
    "description" "text" NOT NULL,
    "cost" numeric(10,2),
    "date" "date" NOT NULL,
    "odometer_reading" integer NOT NULL,
    "next_service_due" "date",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "receipt_image_url" "text",
    "ocr_extracted_data" "jsonb",
    "auto_filled" boolean DEFAULT false,
    CONSTRAINT "service_logs_cost_check" CHECK (("cost" >= (0)::numeric)),
    CONSTRAINT "service_logs_odometer_reading_check" CHECK (("odometer_reading" >= 0))
);


ALTER TABLE "public"."service_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."service_template_items" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "template_id" "uuid" NOT NULL,
    "description" "text" NOT NULL,
    "price" numeric(10,2) DEFAULT 0 NOT NULL,
    "display_order" integer DEFAULT 1 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."service_template_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."service_templates" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "total_cost" numeric(10,2) DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."service_templates" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."vehicle_group_shares" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "vehicle_id" "uuid" NOT NULL,
    "group_id" "uuid" NOT NULL,
    "shared_by" "uuid" NOT NULL,
    "shared_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."vehicle_group_shares" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."vehicle_images" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "vehicle_id" "uuid" NOT NULL,
    "image_url" "text" NOT NULL,
    "image_type" "public"."image_type" DEFAULT 'vehicle_gallery'::"public"."image_type",
    "caption" "text",
    "display_order" integer DEFAULT 0,
    "uploaded_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."vehicle_images" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."vehicles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "make" "text" NOT NULL,
    "model" "text" NOT NULL,
    "year" integer NOT NULL,
    "license_plate" "text" NOT NULL,
    "vin" "text",
    "main_image_url" "text",
    "color" "text",
    "current_mileage" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    CONSTRAINT "vehicles_current_mileage_check" CHECK (("current_mileage" >= 0)),
    CONSTRAINT "vehicles_year_check" CHECK ((("year" >= 1900) AND (("year")::numeric <= (EXTRACT(year FROM "now"()) + (2)::numeric))))
);


ALTER TABLE "public"."vehicles" OWNER TO "postgres";


ALTER TABLE ONLY "public"."fuel_logs"
    ADD CONSTRAINT "fuel_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."group_invitations"
    ADD CONSTRAINT "group_invitations_group_id_email_status_key" UNIQUE ("group_id", "email", "status");



ALTER TABLE ONLY "public"."group_invitations"
    ADD CONSTRAINT "group_invitations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."group_members"
    ADD CONSTRAINT "group_members_group_id_user_id_key" UNIQUE ("group_id", "user_id");



ALTER TABLE ONLY "public"."group_members"
    ADD CONSTRAINT "group_members_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."groups"
    ADD CONSTRAINT "groups_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."mileage_logs"
    ADD CONSTRAINT "mileage_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_username_key" UNIQUE ("username");



ALTER TABLE ONLY "public"."push_tokens"
    ADD CONSTRAINT "push_tokens_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."push_tokens"
    ADD CONSTRAINT "push_tokens_token_key" UNIQUE ("token");



ALTER TABLE ONLY "public"."service_logs"
    ADD CONSTRAINT "service_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."service_template_items"
    ADD CONSTRAINT "service_template_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."service_templates"
    ADD CONSTRAINT "service_templates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."vehicle_group_shares"
    ADD CONSTRAINT "vehicle_group_shares_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."vehicle_group_shares"
    ADD CONSTRAINT "vehicle_group_shares_vehicle_id_group_id_key" UNIQUE ("vehicle_id", "group_id");



ALTER TABLE ONLY "public"."vehicle_images"
    ADD CONSTRAINT "vehicle_images_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."vehicles"
    ADD CONSTRAINT "vehicles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."vehicles"
    ADD CONSTRAINT "vehicles_user_id_license_plate_key" UNIQUE ("user_id", "license_plate");



CREATE INDEX "idx_fuel_logs_date" ON "public"."fuel_logs" USING "btree" ("date");



CREATE INDEX "idx_fuel_logs_vehicle_id" ON "public"."fuel_logs" USING "btree" ("vehicle_id");



CREATE INDEX "idx_group_invitations_email" ON "public"."group_invitations" USING "btree" ("email");



CREATE INDEX "idx_group_invitations_group_id" ON "public"."group_invitations" USING "btree" ("group_id");



CREATE INDEX "idx_group_members_group_id" ON "public"."group_members" USING "btree" ("group_id");



CREATE INDEX "idx_group_members_user_id" ON "public"."group_members" USING "btree" ("user_id");



CREATE INDEX "idx_groups_owner_id" ON "public"."groups" USING "btree" ("owner_id");



CREATE INDEX "idx_mileage_logs_date" ON "public"."mileage_logs" USING "btree" ("date");



CREATE INDEX "idx_mileage_logs_vehicle_id" ON "public"."mileage_logs" USING "btree" ("vehicle_id");



CREATE INDEX "idx_push_tokens_token" ON "public"."push_tokens" USING "btree" ("token");



CREATE INDEX "idx_push_tokens_user_id" ON "public"."push_tokens" USING "btree" ("user_id");



CREATE INDEX "idx_service_logs_date" ON "public"."service_logs" USING "btree" ("date");



CREATE INDEX "idx_service_logs_vehicle_id" ON "public"."service_logs" USING "btree" ("vehicle_id");



CREATE INDEX "idx_service_template_items_order" ON "public"."service_template_items" USING "btree" ("template_id", "display_order");



CREATE INDEX "idx_service_template_items_template_id" ON "public"."service_template_items" USING "btree" ("template_id");



CREATE INDEX "idx_service_templates_created_at" ON "public"."service_templates" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_service_templates_user_id" ON "public"."service_templates" USING "btree" ("user_id");



CREATE INDEX "idx_vehicle_images_order" ON "public"."vehicle_images" USING "btree" ("vehicle_id", "display_order");



CREATE INDEX "idx_vehicle_images_type" ON "public"."vehicle_images" USING "btree" ("image_type");



CREATE INDEX "idx_vehicle_images_vehicle_id" ON "public"."vehicle_images" USING "btree" ("vehicle_id");



CREATE INDEX "idx_vehicle_shares_composite" ON "public"."vehicle_group_shares" USING "btree" ("vehicle_id", "group_id");



CREATE INDEX "idx_vehicle_shares_group" ON "public"."vehicle_group_shares" USING "btree" ("group_id");



CREATE INDEX "idx_vehicle_shares_shared_by" ON "public"."vehicle_group_shares" USING "btree" ("shared_by");



CREATE INDEX "idx_vehicle_shares_vehicle" ON "public"."vehicle_group_shares" USING "btree" ("vehicle_id");



CREATE INDEX "idx_vehicles_user_id" ON "public"."vehicles" USING "btree" ("user_id");



CREATE OR REPLACE TRIGGER "update_groups_updated_at" BEFORE UPDATE ON "public"."groups" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_profiles_updated_at" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_service_template_items_updated_at" BEFORE UPDATE ON "public"."service_template_items" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_service_templates_updated_at" BEFORE UPDATE ON "public"."service_templates" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_template_total_on_item_delete" AFTER DELETE ON "public"."service_template_items" FOR EACH ROW EXECUTE FUNCTION "public"."update_service_template_total_cost"();



CREATE OR REPLACE TRIGGER "update_template_total_on_item_insert" AFTER INSERT ON "public"."service_template_items" FOR EACH ROW EXECUTE FUNCTION "public"."update_service_template_total_cost"();



CREATE OR REPLACE TRIGGER "update_template_total_on_item_update" AFTER UPDATE ON "public"."service_template_items" FOR EACH ROW EXECUTE FUNCTION "public"."update_service_template_total_cost"();



CREATE OR REPLACE TRIGGER "update_vehicle_images_updated_at" BEFORE UPDATE ON "public"."vehicle_images" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_vehicles_updated_at" BEFORE UPDATE ON "public"."vehicles" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "public"."fuel_logs"
    ADD CONSTRAINT "fuel_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."fuel_logs"
    ADD CONSTRAINT "fuel_logs_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."group_invitations"
    ADD CONSTRAINT "group_invitations_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."group_invitations"
    ADD CONSTRAINT "group_invitations_invited_by_fkey" FOREIGN KEY ("invited_by") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."group_members"
    ADD CONSTRAINT "group_members_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."group_members"
    ADD CONSTRAINT "group_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."groups"
    ADD CONSTRAINT "groups_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."mileage_logs"
    ADD CONSTRAINT "mileage_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."mileage_logs"
    ADD CONSTRAINT "mileage_logs_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."push_tokens"
    ADD CONSTRAINT "push_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."service_logs"
    ADD CONSTRAINT "service_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."service_logs"
    ADD CONSTRAINT "service_logs_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."service_template_items"
    ADD CONSTRAINT "service_template_items_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "public"."service_templates"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."service_templates"
    ADD CONSTRAINT "service_templates_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."vehicle_group_shares"
    ADD CONSTRAINT "vehicle_group_shares_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."vehicle_group_shares"
    ADD CONSTRAINT "vehicle_group_shares_shared_by_fkey" FOREIGN KEY ("shared_by") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."vehicle_group_shares"
    ADD CONSTRAINT "vehicle_group_shares_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."vehicle_images"
    ADD CONSTRAINT "vehicle_images_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."vehicle_images"
    ADD CONSTRAINT "vehicle_images_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."vehicles"
    ADD CONSTRAINT "vehicles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



CREATE POLICY "Group owners can manage invitations" ON "public"."group_invitations" USING (("group_id" IN ( SELECT "groups"."id"
   FROM "public"."groups"
  WHERE ("groups"."owner_id" = "auth"."uid"()))));



CREATE POLICY "Group owners can manage memberships" ON "public"."group_members" USING (("group_id" IN ( SELECT "groups"."id"
   FROM "public"."groups"
  WHERE ("groups"."owner_id" = "auth"."uid"()))));



CREATE POLICY "Invited users can update invitations" ON "public"."group_invitations" FOR UPDATE USING (("email" = ( SELECT "profiles"."email"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"()))));



CREATE POLICY "Invited users can view invitations" ON "public"."group_invitations" FOR SELECT USING ((("email" = ( SELECT "profiles"."email"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"()))) OR ("group_id" IN ( SELECT "groups"."id"
   FROM "public"."groups"
  WHERE ("groups"."owner_id" = "auth"."uid"())))));



CREATE POLICY "Users can delete own service template items" ON "public"."service_template_items" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."service_templates"
  WHERE (("service_templates"."id" = "service_template_items"."template_id") AND ("service_templates"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can delete own service templates" ON "public"."service_templates" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete own vehicles" ON "public"."vehicles" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete their own push tokens" ON "public"."push_tokens" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own service template items" ON "public"."service_template_items" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."service_templates"
  WHERE (("service_templates"."id" = "service_template_items"."template_id") AND ("service_templates"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can insert own service templates" ON "public"."service_templates" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own vehicles" ON "public"."vehicles" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own push tokens" ON "public"."push_tokens" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can join groups" ON "public"."group_members" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can leave groups" ON "public"."group_members" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can manage own groups" ON "public"."groups" USING (("auth"."uid"() = "owner_id"));



CREATE POLICY "Users can manage own profile" ON "public"."profiles" USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can manage own vehicle images" ON "public"."vehicle_images" USING (("vehicle_id" IN ( SELECT "vehicles"."id"
   FROM "public"."vehicles"
  WHERE ("vehicles"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can manage own vehicle shares" ON "public"."vehicle_group_shares" USING (("vehicle_id" IN ( SELECT "vehicles"."id"
   FROM "public"."vehicles"
  WHERE ("vehicles"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can manage own vehicles" ON "public"."vehicles" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own service template items" ON "public"."service_template_items" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."service_templates"
  WHERE (("service_templates"."id" = "service_template_items"."template_id") AND ("service_templates"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can update own service templates" ON "public"."service_templates" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own vehicles" ON "public"."vehicles" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own push tokens" ON "public"."push_tokens" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view group member profiles" ON "public"."profiles" FOR SELECT USING ((("auth"."uid"() = "id") OR ("id" IN ( SELECT "gm1"."user_id"
   FROM "public"."group_members" "gm1"
  WHERE ("gm1"."group_id" = ANY ("public"."get_user_groups_safe"("auth"."uid"()))))) OR ("id" IN ( SELECT "g"."owner_id"
   FROM "public"."groups" "g"
  WHERE ("g"."id" = ANY ("public"."get_user_groups_safe"("auth"."uid"())))))));



CREATE POLICY "Users can view group memberships" ON "public"."group_members" FOR SELECT USING ((("auth"."uid"() = "user_id") OR ("group_id" IN ( SELECT "groups"."id"
   FROM "public"."groups"
  WHERE ("groups"."owner_id" = "auth"."uid"()))) OR ("group_id" = ANY ("public"."get_user_groups_safe"("auth"."uid"())))));



CREATE POLICY "Users can view member groups" ON "public"."groups" FOR SELECT USING ((("auth"."uid"() = "owner_id") OR ("id" = ANY ("public"."get_user_groups_safe"("auth"."uid"())))));



CREATE POLICY "Users can view own service template items" ON "public"."service_template_items" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."service_templates"
  WHERE (("service_templates"."id" = "service_template_items"."template_id") AND ("service_templates"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can view own service templates" ON "public"."service_templates" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own vehicles and shared vehicles" ON "public"."vehicles" FOR SELECT USING (("id" IN ( SELECT "get_accessible_vehicle_ids"."vehicle_id"
   FROM "public"."get_accessible_vehicle_ids"("auth"."uid"()) "get_accessible_vehicle_ids"("vehicle_id"))));



CREATE POLICY "Users can view shared vehicle images" ON "public"."vehicle_images" FOR SELECT USING (("vehicle_id" IN ( SELECT "get_accessible_vehicle_ids"."vehicle_id"
   FROM "public"."get_accessible_vehicle_ids"("auth"."uid"()) "get_accessible_vehicle_ids"("vehicle_id"))));



CREATE POLICY "Users can view shares for their vehicles and groups" ON "public"."vehicle_group_shares" FOR SELECT USING (("id" IN ( SELECT "get_accessible_share_ids"."share_id"
   FROM "public"."get_accessible_share_ids"("auth"."uid"()) "get_accessible_share_ids"("share_id"))));



CREATE POLICY "Users can view their own push tokens" ON "public"."push_tokens" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "fuel_delete_shared" ON "public"."fuel_logs" FOR DELETE USING ((("vehicle_id" IN ( SELECT "vehicles"."id"
   FROM "public"."vehicles"
  WHERE ("vehicles"."user_id" = "auth"."uid"()))) OR ("vehicle_id" IN ( SELECT DISTINCT "vgs"."vehicle_id"
   FROM ("public"."vehicle_group_shares" "vgs"
     JOIN "public"."group_members" "gm" ON (("vgs"."group_id" = "gm"."group_id")))
  WHERE ("gm"."user_id" = "auth"."uid"())))));



CREATE POLICY "fuel_insert_shared" ON "public"."fuel_logs" FOR INSERT WITH CHECK ((("user_id" = "auth"."uid"()) AND (("vehicle_id" IN ( SELECT "vehicles"."id"
   FROM "public"."vehicles"
  WHERE ("vehicles"."user_id" = "auth"."uid"()))) OR ("vehicle_id" IN ( SELECT DISTINCT "vgs"."vehicle_id"
   FROM ("public"."vehicle_group_shares" "vgs"
     JOIN "public"."group_members" "gm" ON (("vgs"."group_id" = "gm"."group_id")))
  WHERE ("gm"."user_id" = "auth"."uid"()))))));



ALTER TABLE "public"."fuel_logs" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "fuel_select_shared" ON "public"."fuel_logs" FOR SELECT USING ((("vehicle_id" IN ( SELECT "vehicles"."id"
   FROM "public"."vehicles"
  WHERE ("vehicles"."user_id" = "auth"."uid"()))) OR ("vehicle_id" IN ( SELECT DISTINCT "vgs"."vehicle_id"
   FROM ("public"."vehicle_group_shares" "vgs"
     JOIN "public"."group_members" "gm" ON (("vgs"."group_id" = "gm"."group_id")))
  WHERE ("gm"."user_id" = "auth"."uid"())))));



CREATE POLICY "fuel_update_shared" ON "public"."fuel_logs" FOR UPDATE USING ((("vehicle_id" IN ( SELECT "vehicles"."id"
   FROM "public"."vehicles"
  WHERE ("vehicles"."user_id" = "auth"."uid"()))) OR ("vehicle_id" IN ( SELECT DISTINCT "vgs"."vehicle_id"
   FROM ("public"."vehicle_group_shares" "vgs"
     JOIN "public"."group_members" "gm" ON (("vgs"."group_id" = "gm"."group_id")))
  WHERE ("gm"."user_id" = "auth"."uid"())))));



ALTER TABLE "public"."group_invitations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."group_members" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."groups" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "mileage_delete_shared" ON "public"."mileage_logs" FOR DELETE USING ((("vehicle_id" IN ( SELECT "vehicles"."id"
   FROM "public"."vehicles"
  WHERE ("vehicles"."user_id" = "auth"."uid"()))) OR ("vehicle_id" IN ( SELECT DISTINCT "vgs"."vehicle_id"
   FROM ("public"."vehicle_group_shares" "vgs"
     JOIN "public"."group_members" "gm" ON (("vgs"."group_id" = "gm"."group_id")))
  WHERE ("gm"."user_id" = "auth"."uid"())))));



CREATE POLICY "mileage_insert_shared" ON "public"."mileage_logs" FOR INSERT WITH CHECK ((("user_id" = "auth"."uid"()) AND (("vehicle_id" IN ( SELECT "vehicles"."id"
   FROM "public"."vehicles"
  WHERE ("vehicles"."user_id" = "auth"."uid"()))) OR ("vehicle_id" IN ( SELECT DISTINCT "vgs"."vehicle_id"
   FROM ("public"."vehicle_group_shares" "vgs"
     JOIN "public"."group_members" "gm" ON (("vgs"."group_id" = "gm"."group_id")))
  WHERE ("gm"."user_id" = "auth"."uid"()))))));



ALTER TABLE "public"."mileage_logs" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "mileage_select_shared" ON "public"."mileage_logs" FOR SELECT USING ((("vehicle_id" IN ( SELECT "vehicles"."id"
   FROM "public"."vehicles"
  WHERE ("vehicles"."user_id" = "auth"."uid"()))) OR ("vehicle_id" IN ( SELECT DISTINCT "vgs"."vehicle_id"
   FROM ("public"."vehicle_group_shares" "vgs"
     JOIN "public"."group_members" "gm" ON (("vgs"."group_id" = "gm"."group_id")))
  WHERE ("gm"."user_id" = "auth"."uid"())))));



CREATE POLICY "mileage_update_shared" ON "public"."mileage_logs" FOR UPDATE USING ((("vehicle_id" IN ( SELECT "vehicles"."id"
   FROM "public"."vehicles"
  WHERE ("vehicles"."user_id" = "auth"."uid"()))) OR ("vehicle_id" IN ( SELECT DISTINCT "vgs"."vehicle_id"
   FROM ("public"."vehicle_group_shares" "vgs"
     JOIN "public"."group_members" "gm" ON (("vgs"."group_id" = "gm"."group_id")))
  WHERE ("gm"."user_id" = "auth"."uid"())))));



ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."push_tokens" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "service_delete_shared" ON "public"."service_logs" FOR DELETE USING ((("vehicle_id" IN ( SELECT "vehicles"."id"
   FROM "public"."vehicles"
  WHERE ("vehicles"."user_id" = "auth"."uid"()))) OR ("vehicle_id" IN ( SELECT DISTINCT "vgs"."vehicle_id"
   FROM ("public"."vehicle_group_shares" "vgs"
     JOIN "public"."group_members" "gm" ON (("vgs"."group_id" = "gm"."group_id")))
  WHERE ("gm"."user_id" = "auth"."uid"())))));



CREATE POLICY "service_insert_shared" ON "public"."service_logs" FOR INSERT WITH CHECK ((("user_id" = "auth"."uid"()) AND (("vehicle_id" IN ( SELECT "vehicles"."id"
   FROM "public"."vehicles"
  WHERE ("vehicles"."user_id" = "auth"."uid"()))) OR ("vehicle_id" IN ( SELECT DISTINCT "vgs"."vehicle_id"
   FROM ("public"."vehicle_group_shares" "vgs"
     JOIN "public"."group_members" "gm" ON (("vgs"."group_id" = "gm"."group_id")))
  WHERE ("gm"."user_id" = "auth"."uid"()))))));



ALTER TABLE "public"."service_logs" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "service_select_shared" ON "public"."service_logs" FOR SELECT USING ((("vehicle_id" IN ( SELECT "vehicles"."id"
   FROM "public"."vehicles"
  WHERE ("vehicles"."user_id" = "auth"."uid"()))) OR ("vehicle_id" IN ( SELECT DISTINCT "vgs"."vehicle_id"
   FROM ("public"."vehicle_group_shares" "vgs"
     JOIN "public"."group_members" "gm" ON (("vgs"."group_id" = "gm"."group_id")))
  WHERE ("gm"."user_id" = "auth"."uid"())))));



ALTER TABLE "public"."service_template_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."service_templates" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "service_update_shared" ON "public"."service_logs" FOR UPDATE USING ((("vehicle_id" IN ( SELECT "vehicles"."id"
   FROM "public"."vehicles"
  WHERE ("vehicles"."user_id" = "auth"."uid"()))) OR ("vehicle_id" IN ( SELECT DISTINCT "vgs"."vehicle_id"
   FROM ("public"."vehicle_group_shares" "vgs"
     JOIN "public"."group_members" "gm" ON (("vgs"."group_id" = "gm"."group_id")))
  WHERE ("gm"."user_id" = "auth"."uid"())))));



ALTER TABLE "public"."vehicle_group_shares" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."vehicle_images" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."vehicles" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";






GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

























































































































































REVOKE ALL ON FUNCTION "public"."get_accessible_share_ids"("user_uuid" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_accessible_share_ids"("user_uuid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_accessible_share_ids"("user_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_accessible_share_ids"("user_uuid" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."get_accessible_vehicle_ids"("user_uuid" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_accessible_vehicle_ids"("user_uuid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_accessible_vehicle_ids"("user_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_accessible_vehicle_ids"("user_uuid" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."get_group_invitations_with_details"("group_uuid" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_group_invitations_with_details"("group_uuid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_group_invitations_with_details"("group_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_group_invitations_with_details"("group_uuid" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."get_group_members_with_profiles"("group_uuid" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_group_members_with_profiles"("group_uuid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_group_members_with_profiles"("group_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_group_members_with_profiles"("group_uuid" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."get_user_group_ids"("user_uuid" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_user_group_ids"("user_uuid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_group_ids"("user_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_group_ids"("user_uuid" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."get_user_groups_safe"("user_uuid" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_user_groups_safe"("user_uuid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_groups_safe"("user_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_groups_safe"("user_uuid" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."get_user_invitations_with_details"("user_email" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_user_invitations_with_details"("user_email" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_invitations_with_details"("user_email" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_invitations_with_details"("user_email" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."get_user_vehicles_with_sharing"("user_uuid" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_user_vehicles_with_sharing"("user_uuid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_vehicles_with_sharing"("user_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_vehicles_with_sharing"("user_uuid" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."handle_new_user"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."share_vehicle_with_groups"("vehicle_uuid" "uuid", "group_uuids" "uuid"[]) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."share_vehicle_with_groups"("vehicle_uuid" "uuid", "group_uuids" "uuid"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."share_vehicle_with_groups"("vehicle_uuid" "uuid", "group_uuids" "uuid"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."share_vehicle_with_groups"("vehicle_uuid" "uuid", "group_uuids" "uuid"[]) TO "service_role";



REVOKE ALL ON FUNCTION "public"."update_service_template_total_cost"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."update_service_template_total_cost"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_service_template_total_cost"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_service_template_total_cost"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."update_updated_at_column"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."user_is_group_member"("user_uuid" "uuid", "group_uuid" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."user_is_group_member"("user_uuid" "uuid", "group_uuid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."user_is_group_member"("user_uuid" "uuid", "group_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."user_is_group_member"("user_uuid" "uuid", "group_uuid" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."user_owns_group"("user_uuid" "uuid", "group_uuid" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."user_owns_group"("user_uuid" "uuid", "group_uuid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."user_owns_group"("user_uuid" "uuid", "group_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."user_owns_group"("user_uuid" "uuid", "group_uuid" "uuid") TO "service_role";


















GRANT ALL ON TABLE "public"."fuel_logs" TO "anon";
GRANT ALL ON TABLE "public"."fuel_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."fuel_logs" TO "service_role";



GRANT ALL ON TABLE "public"."group_invitations" TO "anon";
GRANT ALL ON TABLE "public"."group_invitations" TO "authenticated";
GRANT ALL ON TABLE "public"."group_invitations" TO "service_role";



GRANT ALL ON TABLE "public"."group_members" TO "anon";
GRANT ALL ON TABLE "public"."group_members" TO "authenticated";
GRANT ALL ON TABLE "public"."group_members" TO "service_role";



GRANT ALL ON TABLE "public"."groups" TO "anon";
GRANT ALL ON TABLE "public"."groups" TO "authenticated";
GRANT ALL ON TABLE "public"."groups" TO "service_role";



GRANT ALL ON TABLE "public"."mileage_logs" TO "anon";
GRANT ALL ON TABLE "public"."mileage_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."mileage_logs" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."push_tokens" TO "anon";
GRANT ALL ON TABLE "public"."push_tokens" TO "authenticated";
GRANT ALL ON TABLE "public"."push_tokens" TO "service_role";



GRANT ALL ON TABLE "public"."service_logs" TO "anon";
GRANT ALL ON TABLE "public"."service_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."service_logs" TO "service_role";



GRANT ALL ON TABLE "public"."service_template_items" TO "anon";
GRANT ALL ON TABLE "public"."service_template_items" TO "authenticated";
GRANT ALL ON TABLE "public"."service_template_items" TO "service_role";



GRANT ALL ON TABLE "public"."service_templates" TO "anon";
GRANT ALL ON TABLE "public"."service_templates" TO "authenticated";
GRANT ALL ON TABLE "public"."service_templates" TO "service_role";



GRANT ALL ON TABLE "public"."vehicle_group_shares" TO "anon";
GRANT ALL ON TABLE "public"."vehicle_group_shares" TO "authenticated";
GRANT ALL ON TABLE "public"."vehicle_group_shares" TO "service_role";



GRANT ALL ON TABLE "public"."vehicle_images" TO "anon";
GRANT ALL ON TABLE "public"."vehicle_images" TO "authenticated";
GRANT ALL ON TABLE "public"."vehicle_images" TO "service_role";



GRANT ALL ON TABLE "public"."vehicles" TO "anon";
GRANT ALL ON TABLE "public"."vehicles" TO "authenticated";
GRANT ALL ON TABLE "public"."vehicles" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" REVOKE ALL ON FUNCTIONS FROM PUBLIC;




























drop extension if exists "pg_net";

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


  create policy "Allow authenticated uploads to vehicle-images"
  on "storage"."objects"
  as permissive
  for insert
  to authenticated
with check ((bucket_id = 'vehicle-images'::text));



  create policy "Allow public read access to vehicle-images"
  on "storage"."objects"
  as permissive
  for select
  to public
using ((bucket_id = 'vehicle-images'::text));



  create policy "Allow users to delete own vehicle-images"
  on "storage"."objects"
  as permissive
  for delete
  to authenticated
using (((bucket_id = 'vehicle-images'::text) AND ((auth.uid())::text = (storage.foldername(name))[1])));



  create policy "Allow users to update own vehicle-images"
  on "storage"."objects"
  as permissive
  for update
  to authenticated
using (((bucket_id = 'vehicle-images'::text) AND ((auth.uid())::text = (storage.foldername(name))[1])));



  create policy "Avatar images are publicly accessible"
  on "storage"."objects"
  as permissive
  for select
  to public
using ((bucket_id = 'profile-avatars'::text));



  create policy "Users can delete their own avatar"
  on "storage"."objects"
  as permissive
  for delete
  to public
using (((bucket_id = 'profile-avatars'::text) AND ((auth.uid())::text = (storage.foldername(name))[1])));



  create policy "Users can delete their own receipt images"
  on "storage"."objects"
  as permissive
  for delete
  to authenticated
using (((bucket_id = 'receipt-images'::text) AND ((auth.uid())::text = (storage.foldername(name))[1])));



  create policy "Users can delete vehicle images"
  on "storage"."objects"
  as permissive
  for delete
  to public
using (((bucket_id = 'vehicle-images'::text) AND ((auth.uid())::text = (storage.foldername(name))[1])));



  create policy "Users can update their own avatar"
  on "storage"."objects"
  as permissive
  for update
  to public
using (((bucket_id = 'profile-avatars'::text) AND ((auth.uid())::text = (storage.foldername(name))[1])));



  create policy "Users can update their own receipt images"
  on "storage"."objects"
  as permissive
  for update
  to authenticated
using (((bucket_id = 'receipt-images'::text) AND ((auth.uid())::text = (storage.foldername(name))[1])));



  create policy "Users can update vehicle images"
  on "storage"."objects"
  as permissive
  for update
  to public
using (((bucket_id = 'vehicle-images'::text) AND ((auth.uid())::text = (storage.foldername(name))[1])));



  create policy "Users can upload their own avatar"
  on "storage"."objects"
  as permissive
  for insert
  to public
with check (((bucket_id = 'profile-avatars'::text) AND ((auth.uid())::text = (storage.foldername(name))[1])));



  create policy "Users can upload their own receipt images"
  on "storage"."objects"
  as permissive
  for insert
  to authenticated
with check (((bucket_id = 'receipt-images'::text) AND ((auth.uid())::text = (storage.foldername(name))[1])));



  create policy "Users can upload vehicle images"
  on "storage"."objects"
  as permissive
  for insert
  to public
with check (((bucket_id = 'vehicle-images'::text) AND ((auth.uid())::text = (storage.foldername(name))[1])));



  create policy "Users can view their own receipt images"
  on "storage"."objects"
  as permissive
  for select
  to authenticated
using (((bucket_id = 'receipt-images'::text) AND ((auth.uid())::text = (storage.foldername(name))[1])));



  create policy "Vehicle images are publicly accessible"
  on "storage"."objects"
  as permissive
  for select
  to public
using ((bucket_id = 'vehicle-images'::text));



