-- Fix CRITICAL: Privilege escalation vulnerability
-- Auto-assign 'viewer' role to new users via database trigger

-- Function to automatically assign viewer role to new users
CREATE OR REPLACE FUNCTION public.assign_default_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only insert if user doesn't already have a role
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = NEW.id
  ) THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'viewer'::app_role);
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger on auth.users insert
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.assign_default_role();

COMMENT ON FUNCTION public.assign_default_role() IS 
'Automatically assigns viewer role to new users. Prevents privilege escalation by ensuring all users start with minimal permissions. Role upgrades must be done by admins via manage-user function.';