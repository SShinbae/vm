-- Who made each log change, for push notifications (notify_webhook's payload
-- only carries the row, whose user_id is the creator, not the editor).
-- Read by send-push-notification with the service role; pruned daily.

CREATE TABLE IF NOT EXISTS public.log_change_actors (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  table_name text NOT NULL CHECK (table_name IN ('fuel_logs', 'mileage_logs', 'service_logs')),
  row_id uuid NOT NULL,
  op text NOT NULL CHECK (op IN ('INSERT', 'UPDATE', 'DELETE')),
  actor uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS log_change_actors_lookup
  ON public.log_change_actors (table_name, row_id, op, created_at DESC);

ALTER TABLE public.log_change_actors ENABLE ROW LEVEL SECURITY;  -- no policies: service_role only

CREATE OR REPLACE FUNCTION public.record_log_change_actor()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.log_change_actors (table_name, row_id, op, actor)
  VALUES (
    TG_TABLE_NAME,
    CASE WHEN TG_OP = 'DELETE' THEN OLD.id ELSE NEW.id END,
    TG_OP,
    auth.uid()
  );
  RETURN NULL;
END;
$$;

REVOKE ALL ON FUNCTION public.record_log_change_actor() FROM PUBLIC, anon, authenticated;

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['fuel_logs', 'mileage_logs', 'service_logs'] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS zz_record_log_change_actor ON public.%I', t);
    EXECUTE format(
      'CREATE TRIGGER zz_record_log_change_actor AFTER INSERT OR UPDATE OR DELETE ON public.%I
         FOR EACH ROW WHEN (current_setting(''app.bulk_purge'', true) IS DISTINCT FROM ''on'')
         EXECUTE FUNCTION public.record_log_change_actor()', t);
  END LOOP;
END $$;
