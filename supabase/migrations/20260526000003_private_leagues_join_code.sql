-- ============================================================
--  Añade join_code a private_leagues y actualiza políticas RLS
-- ============================================================

-- 1. Columna de código de unión
ALTER TABLE public.private_leagues
  ADD COLUMN join_code VARCHAR(8) UNIQUE;


-- ============================================================
--  RLS: private_leagues
-- ============================================================

-- Cualquier usuario autenticado puede leer ligas (necesario para
-- verificar que un join_code existe antes de unirse).
-- Reemplaza la política anterior que solo mostraba ligas propias.
DROP POLICY IF EXISTS "private_leagues_select_member" ON public.private_leagues;

CREATE POLICY "private_leagues_select_authenticated"
  ON public.private_leagues FOR SELECT
  TO authenticated
  USING (true);

-- Cualquier usuario autenticado puede crear ligas; created_by
-- debe coincidir con su uid para garantizar autoría.
CREATE POLICY "private_leagues_insert_own"
  ON public.private_leagues FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);


-- ============================================================
--  RLS: profile_leagues
-- ============================================================

-- El usuario puede inscribirse él mismo en cualquier liga.
CREATE POLICY "profile_leagues_insert_own"
  ON public.profile_leagues FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = profile_id);
