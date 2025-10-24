-- Brute-Force Protection
CREATE TABLE IF NOT EXISTS auth_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email text NOT NULL,
  attempt_time timestamptz DEFAULT NOW(),
  ip_address text,
  success boolean DEFAULT false
);

CREATE INDEX idx_auth_attempts_email_time ON auth_attempts(user_email, attempt_time DESC);

ALTER TABLE auth_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can view auth attempts"
  ON auth_attempts FOR SELECT
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "System can insert auth attempts"
  ON auth_attempts FOR INSERT WITH CHECK (true);

CREATE OR REPLACE FUNCTION check_brute_force(p_email text, p_ip text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_failed_attempts int;
BEGIN
  SELECT COUNT(*) INTO v_failed_attempts FROM auth_attempts
  WHERE user_email = p_email AND success = false AND attempt_time > NOW() - INTERVAL '15 minutes';
  IF v_failed_attempts >= 5 THEN
    RAISE EXCEPTION 'Too many failed login attempts. Try again in 15 minutes.';
  END IF;
  RETURN true;
END; $$;