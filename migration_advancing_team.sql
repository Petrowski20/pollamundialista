-- Ejecutar en Supabase SQL Editor
-- Añade el clasificado por penaltis a predicciones y partidos

ALTER TABLE predictions
  ADD COLUMN IF NOT EXISTS pred_advancing_team_id integer
    REFERENCES teams(id) ON DELETE SET NULL;

ALTER TABLE matches
  ADD COLUMN IF NOT EXISTS advancing_team_id integer
    REFERENCES teams(id) ON DELETE SET NULL;
