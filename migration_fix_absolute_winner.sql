-- ============================================================
--  RPC: calculate_match_points (v3 - Ganador Absoluto)
--
--  Fix crítico para eliminatorias: antes de puntuar, se
--  determina un "Ganador Absoluto" por team_id para cada
--  predicción y se compara con el real. Si falla el
--  clasificado → 0 pts sin importar el marcador.
--
--  Ejecutar en: Supabase SQL Editor (o supabase db push)
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
  v_stage          text;
  v_home_team_id   integer;
  v_away_team_id   integer;
  v_advancing_id   integer;   -- advancing_team_id ya persistido en matches antes de llamar al RPC
  v_real_winner_id integer;   -- ID del equipo ganador absoluto real
  v_real_diff      integer;   -- diferencia de goles en 90 min (positivo = local gana)
BEGIN

  -- ── 1. Registrar resultado oficial y marcar como FINISHED ─────────────────
  UPDATE public.matches
  SET
    home_goals = p_home_goals,
    away_goals = p_away_goals,
    status     = 'FINISHED',
    updated_at = now()
  WHERE id = p_match_id;

  -- ── 2. Leer metadatos del partido (advancing_team_id ya está guardado) ────
  SELECT stage, home_team_id, away_team_id, advancing_team_id
    INTO v_stage, v_home_team_id, v_away_team_id, v_advancing_id
    FROM public.matches
   WHERE id = p_match_id;

  -- ── 3. Calcular Ganador Absoluto Real ─────────────────────────────────────
  --  · Victoria en 90 min → el equipo con más goles.
  --  · Empate en 90 min   → advancing_team_id (penaltis / prórroga).
  --    Si advancing_team_id es NULL (dato no registrado), v_real_winner_id
  --    quedará NULL y todas las predicciones recibirán 0 en eliminatorias.
  IF p_home_goals > p_away_goals THEN
    v_real_winner_id := v_home_team_id;
  ELSIF p_away_goals > p_home_goals THEN
    v_real_winner_id := v_away_team_id;
  ELSE
    v_real_winner_id := v_advancing_id;
  END IF;

  v_real_diff := p_home_goals - p_away_goals;

  -- ── 4. Calcular puntos para cada predicción ───────────────────────────────
  UPDATE public.predictions pred
  SET points_earned = CASE

    -- ══ ELIMINATORIAS (cualquier stage distinto de 'GROUP') ═════════════════
    WHEN v_stage <> 'GROUP' THEN
      CASE
        -- Clasificado real no registrado → no se puede puntuar
        WHEN v_real_winner_id IS NULL
          THEN 0

        -- Calcular ganador predicho e inmediatamente comparar con el real.
        -- · Predicción con local ganador  → home_team_id
        -- · Predicción con visitante gana → away_team_id
        -- · Predicción de empate 90 min   → pred_advancing_team_id (puede ser NULL)
        -- IS DISTINCT FROM trata NULL correctamente: NULL != cualquier id → 0 pts.
        WHEN (
          CASE
            WHEN pred.pred_home_goals > pred.pred_away_goals THEN v_home_team_id
            WHEN pred.pred_away_goals > pred.pred_home_goals THEN v_away_team_id
            ELSE pred.pred_advancing_team_id
          END
        ) IS DISTINCT FROM v_real_winner_id
          THEN 0   -- falló el clasificado

        -- Acertó quién clasifica → evaluar calidad del marcador en 90 min
        WHEN pred.pred_home_goals = p_home_goals
         AND pred.pred_away_goals = p_away_goals
          THEN 3   -- marcador exacto en 90 min + clasificado correcto

        WHEN (pred.pred_home_goals - pred.pred_away_goals) = v_real_diff
          THEN 2   -- diferencia exacta en 90 min + clasificado correcto

        ELSE 1     -- solo acertó quién clasifica
      END

    -- ══ FASE DE GRUPOS (stage = 'GROUP') ════════════════════════════════════
    --  Lógica estándar: advancing_team_id no aplica.
    --  Escalado: 1X2 correcto → 1 pt, diferencia exacta → 2 pts, exacto → 3 pts.
    ELSE
      CASE
        -- 1X2 incorrecto → 0 pts
        WHEN SIGN(pred.pred_home_goals - pred.pred_away_goals)
          <> SIGN(p_home_goals         - p_away_goals)
          THEN 0

        -- Marcador exacto → 3 pts
        WHEN pred.pred_home_goals = p_home_goals
         AND pred.pred_away_goals = p_away_goals
          THEN 3

        -- Diferencia de goles exacta (implica 1X2 correcto) → 2 pts
        WHEN (pred.pred_home_goals - pred.pred_away_goals) = v_real_diff
          THEN 2

        -- Solo 1X2 correcto → 1 pt
        ELSE 1
      END

  END
  WHERE pred.match_id = p_match_id;

  -- ── 5. Recalcular total_points en profiles ────────────────────────────────
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

  -- ── 6. Recalcular league_points en profile_leagues ────────────────────────
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

GRANT EXECUTE ON FUNCTION public.calculate_match_points(SMALLINT, INTEGER, INTEGER) TO authenticated;
