-- Guarda la preferencia de vista en la pantalla de Clasificación.
-- NULL → Global, cualquier integer → liga privada concreta.
ALTER TABLE public.profiles
  ADD COLUMN last_viewed_league_id INTEGER REFERENCES public.private_leagues(id);

-- Las vistas necesitan ser accesibles por el rol authenticated.
-- Las recreamos con SECURITY DEFINER para que puedan leer todas las
-- filas de profile_leagues aunque RLS solo permita ver las propias.
CREATE OR REPLACE VIEW v_ranking_global
WITH (security_invoker = off) AS
SELECT
  p.id,
  p.nickname,
  p.total_points,
  p.city,
  fc.name AS favorite_club,
  RANK() OVER (ORDER BY p.total_points DESC) AS position
FROM public.profiles p
LEFT JOIN public.favorite_clubs fc ON fc.id = p.favorite_club_id
ORDER BY p.total_points DESC;

CREATE OR REPLACE VIEW v_ranking_by_league
WITH (security_invoker = off) AS
SELECT
  pl.league_id,
  lg.name AS league_name,
  p.id    AS profile_id,
  p.nickname,
  pl.league_points,
  RANK() OVER (
    PARTITION BY pl.league_id
    ORDER BY pl.league_points DESC
  ) AS position
FROM public.profile_leagues pl
JOIN public.profiles p      ON p.id  = pl.profile_id
JOIN public.private_leagues lg ON lg.id = pl.league_id
ORDER BY pl.league_id, pl.league_points DESC;

GRANT SELECT ON v_ranking_global    TO authenticated;
GRANT SELECT ON v_ranking_by_league TO authenticated;
