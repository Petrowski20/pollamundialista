-- ============================================================
--  RPC: calculate_match_points
--  Finaliza un partido, calcula puntos y actualiza rankings.
--  Transaccional: cualquier error hace rollback completo.
-- ============================================================

CREATE OR REPLACE FUNCTION public.calculate_match_points(
  p_match_id  SMALLINT,
  p_home_goals INTEGER,
  p_away_goals INTEGER
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_real_winner TEXT;   -- 'HOME' | 'AWAY' | 'DRAW'
  v_real_diff   INTEGER;
BEGIN
  -- Determinar ganador real
  IF p_home_goals > p_away_goals THEN
    v_real_winner := 'HOME';
  ELSIF p_away_goals > p_home_goals THEN
    v_real_winner := 'AWAY';
  ELSE
    v_real_winner := 'DRAW';
  END IF;

  v_real_diff := p_home_goals - p_away_goals;

  -- 1. Fijar resultado y marcar partido como FINISHED
  UPDATE public.matches
  SET
    home_goals = p_home_goals,
    away_goals = p_away_goals,
    status     = 'FINISHED',
    updated_at = now()
  WHERE id = p_match_id;

  -- 2. Calcular points_earned para cada predicción de este partido
  --    +1 acierta ganador/empate
  --    +1 acierta diferencia de goles
  --    +1 acierta resultado exacto
  UPDATE public.predictions
  SET points_earned = (
    CASE
      WHEN (pred_home_goals > pred_away_goals AND v_real_winner = 'HOME')
        OR (pred_away_goals > pred_home_goals AND v_real_winner = 'AWAY')
        OR (pred_home_goals = pred_away_goals  AND v_real_winner = 'DRAW')
      THEN 1 ELSE 0
    END
    +
    CASE
      WHEN (pred_home_goals - pred_away_goals) = v_real_diff
      THEN 1 ELSE 0
    END
    +
    CASE
      WHEN pred_home_goals = p_home_goals AND pred_away_goals = p_away_goals
      THEN 1 ELSE 0
    END
  )
  WHERE match_id = p_match_id;

  -- 3. Recalcular total_points en profiles para usuarios afectados
  UPDATE public.profiles p
  SET total_points = (
    SELECT COALESCE(SUM(pr.points_earned), 0)
    FROM public.predictions pr
    WHERE pr.profile_id = p.id
  )
  WHERE id IN (
    SELECT DISTINCT profile_id
    FROM public.predictions
    WHERE match_id = p_match_id
  );

  -- 4. Recalcular league_points en profile_leagues para usuarios afectados
  UPDATE public.profile_leagues pl
  SET league_points = (
    SELECT COALESCE(SUM(pr.points_earned), 0)
    FROM public.predictions pr
    WHERE pr.profile_id = pl.profile_id
  )
  WHERE pl.profile_id IN (
    SELECT DISTINCT profile_id
    FROM public.predictions
    WHERE match_id = p_match_id
  );

END;
$$;

-- Permitir que usuarios autenticados llamen la función
-- La verificación de rol ADMIN se hace en la Server Action
GRANT EXECUTE ON FUNCTION public.calculate_match_points(SMALLINT, INTEGER, INTEGER) TO authenticated;
