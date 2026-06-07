-- ============================================================
--  EQUIPOS — columnas de información general
-- ============================================================

ALTER TABLE public.teams
  ADD COLUMN IF NOT EXISTS fifa_ranking   SMALLINT,
  ADD COLUMN IF NOT EXISTS manager        TEXT,
  ADD COLUMN IF NOT EXISTS confederation  TEXT,       -- UEFA, CONMEBOL, CAF, AFC, CONCACAF, OFC
  ADD COLUMN IF NOT EXISTS world_cups_won SMALLINT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS best_wc_result TEXT;       -- 'Campeón', 'Subcampeón', 'Semifinal'…


-- ============================================================
--  ENUM — posición del jugador
-- ============================================================

CREATE TYPE player_position AS ENUM ('GK', 'DF', 'MF', 'FW');


-- ============================================================
--  JUGADORES — convocatoria pre-torneo
-- ============================================================
--  caps e intl_goals reflejan la situación ANTES de que
--  arranque el Mundial 2026.
-- ============================================================

CREATE TABLE public.players (
  id            SERIAL PRIMARY KEY,
  team_id       INTEGER NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,

  squad_number  SMALLINT,
  name          TEXT NOT NULL,
  position      player_position NOT NULL,
  date_of_birth DATE,
  height_cm     SMALLINT,
  weight_kg     SMALLINT,
  club          TEXT,

  -- Estadísticas internacionales pre-torneo
  caps          SMALLINT NOT NULL DEFAULT 0,
  intl_goals    SMALLINT NOT NULL DEFAULT 0,

  -- Enlace externo (solo el ID; la URL se construye en el frontend)
  -- https://www.transfermarkt.com/x/profil/spieler/{transfermarkt_id}
  transfermarkt_id INTEGER
);

CREATE INDEX players_team_id_idx ON public.players (team_id);


-- ============================================================
--  RLS
-- ============================================================

ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;

-- Lectura pública (igual que teams)
CREATE POLICY "players_select_public"
  ON public.players FOR SELECT
  USING (true);
