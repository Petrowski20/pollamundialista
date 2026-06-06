-- Add avatar_url to ranking views and fix profile_id alias in v_ranking_global

DROP VIEW IF EXISTS v_ranking_global;
CREATE VIEW v_ranking_global AS
SELECT
  p.id             AS profile_id,
  p.nickname,
  p.total_points,
  p.avatar_url
FROM public.profiles p
ORDER BY p.total_points DESC;

DROP VIEW IF EXISTS v_ranking_by_league;
CREATE VIEW v_ranking_by_league AS
SELECT
  pl.league_id,
  lg.name          AS league_name,
  p.id             AS profile_id,
  p.nickname,
  p.avatar_url,
  pl.league_points AS total_points
FROM public.profile_leagues pl
JOIN public.profiles        p  ON p.id  = pl.profile_id
JOIN public.private_leagues lg ON lg.id = pl.league_id
ORDER BY pl.league_id, pl.league_points DESC;
