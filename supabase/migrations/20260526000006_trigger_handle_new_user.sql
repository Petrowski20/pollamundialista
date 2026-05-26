-- ============================================================
--  Trigger: crea automáticamente la fila en public.profiles
--  cuando Supabase Auth registra un usuario nuevo.
--  Los datos vienen de options.data del cliente → raw_user_meta_data.
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, nickname, birth_date)
  VALUES (
    NEW.id,
    -- Usa el nickname del registro; si no viene, toma la parte local del email
    COALESCE(
      NULLIF(TRIM(NEW.raw_user_meta_data->>'nickname'), ''),
      split_part(NEW.email, '@', 1)
    ),
    -- birth_date puede ser NULL si no se envió
    (NEW.raw_user_meta_data->>'birth_date')::date
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- Crea (o reemplaza) el trigger en auth.users
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
