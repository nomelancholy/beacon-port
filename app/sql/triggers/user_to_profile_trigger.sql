-- Install after public.profiles exists. Supports email, Google and GitHub users.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, nickname, provider)
  VALUES (
    new.id,
    coalesce(new.email, ''),
    coalesce(nullif(new.raw_user_meta_data->>'nickname', ''),
             nullif(new.raw_user_meta_data->>'full_name', ''),
             nullif(new.raw_user_meta_data->>'name', ''),
             nullif(new.raw_user_meta_data->>'user_name', ''), 'Anonymous'),
    coalesce(new.raw_app_meta_data->>'provider', 'email')
  ) ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$;

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Recover profiles for users who signed up before the trigger was installed.
INSERT INTO public.profiles (id, email, nickname, provider)
SELECT id, coalesce(email, ''),
       coalesce(nullif(raw_user_meta_data->>'nickname', ''),
                nullif(raw_user_meta_data->>'full_name', ''),
                nullif(raw_user_meta_data->>'name', ''),
                nullif(raw_user_meta_data->>'user_name', ''), 'Anonymous'),
       coalesce(raw_app_meta_data->>'provider', 'email')
FROM auth.users
ON CONFLICT (id) DO NOTHING;
