-- ============================================================
-- Ejecutar en Supabase SQL Editor
-- Reemplaza calculate_match_points con lógica de penaltis
-- ============================================================

CREATE OR REPLACE FUNCTION calculate_match_points(
  p_match_id   integer,
  p_home_goals integer,
  p_away_goals integer
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_stage        text;
  v_home_team_id integer;
  v_away_team_id integer;
  v_advancing_id integer;  -- equipo que realmente clasificó (advancing_team_id del partido)
  v_is_real_tie  boolean;  -- resultado oficial terminó en empate
BEGIN
  -- ── 1. Registrar el resultado oficial ──────────────────────────────────────
  UPDATE matches
  SET
    home_goals = p_home_goals,
    away_goals = p_away_goals,
    status     = 'FINISHED'
  WHERE id = p_match_id;

  -- ── 2. Leer metadatos del partido ─────────────────────────────────────────
  SELECT stage, home_team_id, away_team_id, advancing_team_id
    INTO v_stage, v_home_team_id, v_away_team_id, v_advancing_id
    FROM matches
   WHERE id = p_match_id;

  v_is_real_tie := (p_home_goals = p_away_goals);

  -- ── 3. Calcular puntos para cada predicción ───────────────────────────────
  --
  --  Sistema de puntuación:
  --    +3  Marcador exacto
  --    +2  Ganador correcto (o empate) + diferencia de goles exacta
  --    +1  Ganador correcto (o empate) sin las anteriores
  --     0  Ganador incorrecto
  --
  --  Regla especial para eliminatorias con empate real:
  --    Si el partido NO es de fase de grupos Y terminó en empate Y
  --    advancing_team_id está registrado, la predicción de "quién clasifica"
  --    (pred_advancing_team_id) determina si el usuario acertó al ganador.
  --    Si falla el clasificado → 0 pts, sin importar el marcador.
  --
  UPDATE predictions p
  SET points_earned = CASE

    -- ══ Eliminatoria que terminó en empate con clasificado por penaltis ═══
    WHEN v_stage <> 'GROUP'
     AND v_is_real_tie
     AND v_advancing_id IS NOT NULL
    THEN
      CASE
        -- Falló el clasificado → 0 pts (perdió el "ganador" del partido)
        WHEN p.pred_advancing_team_id IS DISTINCT FROM v_advancing_id
          THEN 0

        -- Acertó el clasificado: evaluar calidad del marcador predicho
        WHEN p.pred_home_goals = p_home_goals
         AND p.pred_away_goals = p_away_goals
          THEN 3   -- marcador exacto + clasificado correcto

        -- Predicción de empate (diferencia 0 = 0) + clasificado correcto
        WHEN p.pred_home_goals = p.pred_away_goals
          THEN 2   -- empate predicho con clasificado correcto, pero marcador distinto

        -- Predicción no-empate pero clasificó el equipo correcto → ganador bien
        ELSE 1
      END

    -- ══ Fase de grupos o eliminatoria no-empate (lógica estándar) ══════════
    ELSE
      CASE
        -- Ganador incorrecto → 0 pts
        WHEN p_home_goals > p_away_goals
         AND p.pred_home_goals <= p.pred_away_goals
          THEN 0
        WHEN p_away_goals > p_home_goals
         AND p.pred_away_goals <= p.pred_home_goals
          THEN 0
        WHEN v_is_real_tie
         AND p.pred_home_goals <> p.pred_away_goals
          THEN 0

        -- Ganador correcto: evaluar calidad
        WHEN p.pred_home_goals = p_home_goals
         AND p.pred_away_goals = p_away_goals
          THEN 3   -- marcador exacto

        WHEN (p.pred_home_goals - p.pred_away_goals)
           = (p_home_goals     - p_away_goals)
          THEN 2   -- diferencia de goles exacta + ganador correcto

        ELSE 1     -- solo ganador correcto
      END

  END
  WHERE p.match_id = p_match_id;

END;
$$;

-- Verificar que la función quedó registrada
SELECT
  routine_name,
  routine_type,
  security_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name   = 'calculate_match_points';
