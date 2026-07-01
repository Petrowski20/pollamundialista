-- Recreate v_ranking_global and v_ranking_by_league with tiebreaker columns
-- required by both the clasificacion page and record_ranking_snapshot():
--   exact_scores  – exact goal predictions (both goals right)
--   correct_signs – correct winner/draw predictions
--   goal_diff_sum – total goal-error (lower = closer predictions = wins tiebreak)
--   created_at    – profile registration date (earlier = wins tiebreak)

DROP VIEW IF EXISTS v_ranking_global;
CREATE VIEW v_ranking_global AS
SELECT
  p.id             AS profile_id,
  p.nickname,
  p.avatar_url,
  p.total_points,
  p.created_at,
  COUNT(pred.id) FILTER (
    WHERE m.status = 'FINISHED'
      AND m.home_goals IS NOT NULL
      AND pred.pred_home_goals = m.home_goals
      AND pred.pred_away_goals = m.away_goals
  ) AS exact_scores,
  COUNT(pred.id) FILTER (
    WHERE m.status = 'FINISHED'
      AND m.home_goals IS NOT NULL
      AND SIGN(pred.pred_home_goals - pred.pred_away_goals)
        = SIGN(m.home_goals - m.away_goals)
  ) AS correct_signs,
  COALESCE(SUM(
    CASE WHEN m.status = 'FINISHED' AND m.home_goals IS NOT NULL
      THEN ABS(pred.pred_home_goals - m.home_goals)
         + ABS(pred.pred_away_goals - m.away_goals)
    END
  ), 0) AS goal_diff_sum
FROM public.profiles p
LEFT JOIN public.predictions pred ON pred.profile_id = p.id
LEFT JOIN public.matches     m    ON m.id = pred.match_id
GROUP BY p.id, p.nickname, p.avatar_url, p.total_points, p.created_at;

GRANT SELECT ON v_ranking_global TO authenticated;


DROP VIEW IF EXISTS v_ranking_by_league;
CREATE VIEW v_ranking_by_league AS
SELECT
  pl.league_id,
  lg.name          AS league_name,
  p.id             AS profile_id,
  p.nickname,
  p.avatar_url,
  pl.league_points AS total_points,
  p.created_at,
  COUNT(pred.id) FILTER (
    WHERE m.status = 'FINISHED'
      AND m.home_goals IS NOT NULL
      AND pred.pred_home_goals = m.home_goals
      AND pred.pred_away_goals = m.away_goals
  ) AS exact_scores,
  COUNT(pred.id) FILTER (
    WHERE m.status = 'FINISHED'
      AND m.home_goals IS NOT NULL
      AND SIGN(pred.pred_home_goals - pred.pred_away_goals)
        = SIGN(m.home_goals - m.away_goals)
  ) AS correct_signs,
  COALESCE(SUM(
    CASE WHEN m.status = 'FINISHED' AND m.home_goals IS NOT NULL
      THEN ABS(pred.pred_home_goals - m.home_goals)
         + ABS(pred.pred_away_goals - m.away_goals)
    END
  ), 0) AS goal_diff_sum
FROM public.profile_leagues pl
JOIN public.profiles        p  ON p.id  = pl.profile_id
JOIN public.private_leagues lg ON lg.id = pl.league_id
LEFT JOIN public.predictions pred ON pred.profile_id = p.id
LEFT JOIN public.matches     m    ON m.id = pred.match_id
GROUP BY pl.league_id, lg.name, p.id, p.nickname, p.avatar_url, pl.league_points, p.created_at;

GRANT SELECT ON v_ranking_by_league TO authenticated;
