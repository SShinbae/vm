create extension if not exists "pg_net" with schema "extensions";

CREATE TRIGGER group_invitations AFTER INSERT ON public.group_invitations FOR EACH ROW EXECUTE FUNCTION supabase_functions.http_request('https://vm.wanahnaf.dev/.netlify/functions/send-push-notification', 'POST', '{"Content-type":"application/json"}', '{}', '5000');


