-- ============================================================
--  MUNDIAL 2026 - SCHEMA COMPLETO
--  Base de datos: Supabase (PostgreSQL)
-- ============================================================


-- ============================================================
--  ENUMS
-- ============================================================

CREATE TYPE user_role AS ENUM ('USER', 'ADMIN');

CREATE TYPE request_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- El Mundial 2026 tiene 48 equipos → 12 grupos (A-L)
CREATE TYPE group_letter AS ENUM (
  'A', 'B', 'C', 'D', 'E', 'F',
  'G', 'H', 'I', 'J', 'K', 'L'
);

-- Fases del torneo
-- El formato 2026: Grupos → R32 → R16 → Cuartos → Semis → 3er puesto → Final
CREATE TYPE match_stage AS ENUM (
  'GROUP',
  'ROUND_OF_32',
  'ROUND_OF_16',
  'QUARTER_FINAL',
  'SEMI_FINAL',
  'THIRD_PLACE',
  'FINAL'
);

CREATE TYPE match_status AS ENUM (
  'PENDING',     -- Sin jugar
  'IN_PROGRESS', -- En curso (opcional, para realtime)
  'FINISHED',    -- Finalizado, puntos ya calculados
  'CANCELLED'    -- Cancelado (por si acaso)
);


-- ============================================================
--  EQUIPOS
-- ============================================================

CREATE TABLE public.teams (
  id            SERIAL PRIMARY KEY,
  name          TEXT NOT NULL,
  iso_code      VARCHAR(3) NOT NULL UNIQUE,  -- ESP, BRA, FRA...
  group_letter  group_letter,                -- NULL en eliminatorias
  flag_emoji    TEXT,

  -- Estadísticas de fase de grupos (se actualizan con cada partido)
  matches_played  SMALLINT  DEFAULT 0,
  wins            SMALLINT  DEFAULT 0,
  draws           SMALLINT  DEFAULT 0,
  losses          SMALLINT  DEFAULT 0,
  goals_for       SMALLINT  DEFAULT 0,
  goals_against   SMALLINT  DEFAULT 0,
  points          SMALLINT  DEFAULT 0,

  -- Columna generada: nunca se desincroniza
  goal_difference INTEGER GENERATED ALWAYS AS (goals_for - goals_against) STORED,

  is_eliminated   BOOLEAN   DEFAULT false
);


-- ============================================================
--  PARTIDOS
-- ============================================================

CREATE TABLE public.matches (
  id          SMALLSERIAL PRIMARY KEY,
  home_team_id  INTEGER NOT NULL REFERENCES public.teams(id),
  away_team_id  INTEGER NOT NULL REFERENCES public.teams(id),
  match_date    TIMESTAMP WITH TIME ZONE NOT NULL,
  stage         match_stage NOT NULL,
  group_letter  group_letter,   -- Solo relleno en stage = 'GROUP'
  matchday      SMALLINT,       -- Jornada dentro del grupo (1, 2 o 3)
  status        match_status DEFAULT 'PENDING',

  -- Resultado real (NULL hasta que el admin lo introduce)
  home_goals    INTEGER,
  away_goals    INTEGER,

  -- Solo en eliminatorias: quién clasifica realmente
  -- En grupos es NULL (el ganador se deriva del marcador)
  -- En empate a 90' → el que pase por penaltis
  winner_id     INTEGER REFERENCES public.teams(id),

  updated_at    TIMESTAMP WITH TIME ZONE DEFAULT now(),

  -- Validaciones
  CONSTRAINT chk_different_teams CHECK (home_team_id <> away_team_id),
  CONSTRAINT chk_group_letter_only_in_groups
    CHECK (group_letter IS NULL OR stage = 'GROUP'),
  CONSTRAINT chk_goals_non_negative
    CHECK (home_goals IS NULL OR (home_goals >= 0 AND away_goals >= 0))
);


-- ============================================================
--  CLUBES FAVORITOS (datos de perfil, no del torneo)
-- ============================================================

CREATE TABLE public.favorite_clubs (
  id        SERIAL PRIMARY KEY,
  name      TEXT NOT NULL UNIQUE,
  league    TEXT,
  logo_url  TEXT
);


-- ============================================================
--  LIGAS PRIVADAS
-- ============================================================

CREATE TABLE public.private_leagues (
  id                  SERIAL PRIMARY KEY,
  name                TEXT NOT NULL UNIQUE,
  description         TEXT,
  created_by          UUID REFERENCES auth.users(id),
  -- Si false, triple_bonus nunca se aplica en esta liga
  triple_rule_enabled BOOLEAN DEFAULT true,
  created_at          TIMESTAMP WITH TIME ZONE DEFAULT now()
);


-- ============================================================
--  INVITACIONES
-- ============================================================

CREATE TABLE public.invitations (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email               TEXT NOT NULL,
  suggested_username  TEXT,
  private_league_id   INTEGER REFERENCES public.private_leagues(id),
  created_by          UUID REFERENCES auth.users(id),
  is_used             BOOLEAN DEFAULT false,
  created_at          TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at          TIMESTAMP WITH TIME ZONE DEFAULT (now() + INTERVAL '7 days')
);


-- ============================================================
--  PERFILES (1:1 con auth.users)
-- ============================================================

CREATE TABLE public.profiles (
  id                UUID PRIMARY KEY REFERENCES auth.users(id),
  nickname          TEXT NOT NULL UNIQUE,
  role              user_role DEFAULT 'USER',
  birth_date        DATE,
  city              TEXT,
  favorite_club_id  INTEGER REFERENCES public.favorite_clubs(id),
  invitation_id     UUID REFERENCES public.invitations(id),

  -- Puntos globales: suma de todos los partidos independientemente de liga
  -- Sirve para el ranking general entre todos los usuarios
  total_points      INTEGER DEFAULT 0,

  created_at        TIMESTAMP WITH TIME ZONE DEFAULT now()
);


-- ============================================================
--  RELACIÓN PERFIL ↔ LIGA
-- ============================================================

CREATE TABLE public.profile_leagues (
  profile_id    UUID    NOT NULL REFERENCES public.profiles(id),
  league_id     INTEGER NOT NULL REFERENCES public.private_leagues(id),
  joined_at     TIMESTAMP WITH TIME ZONE DEFAULT now(),

  -- Puntos de este usuario DENTRO de esta liga específica
  -- Se actualiza a la vez que predictions.points_earned
  league_points INTEGER DEFAULT 0,

  PRIMARY KEY (profile_id, league_id)
);


-- ============================================================
--  SOLICITUDES DE ACCESO (formulario público)
-- ============================================================

CREATE TABLE public.join_requests (
  id                 SERIAL PRIMARY KEY,
  email              TEXT NOT NULL,
  suggested_nickname TEXT,
  message            TEXT,
  preferred_league   TEXT,
  status             request_status DEFAULT 'PENDING',
  created_at         TIMESTAMP WITH TIME ZONE DEFAULT now()
);


-- ============================================================
--  PREDICCIONES
--  Sistema de puntuación unificado (grupos y eliminatorias):
--
--  +1  Aciertas ganador / empate / quien clasifica
--  +1  Aciertas diferencia de goles
--  +1  Aciertas resultado exacto
--  +1  Norma del triple (bonus contrarian)
--  = 4 puntos máximo por partido
--
--  pred_winner_id:
--    - Grupos:         NULL (el ganador se deriva del marcador)
--    - Eliminatorias:  OBLIGATORIO (quien crees que clasifica)
--
--  Penaltis implícitos:
--    - Si pred_home_goals = pred_away_goals en eliminatoria
--      → penaltis implícito, pred_winner_id es obligatorio
--    - No hace falta campo extra
-- ============================================================

CREATE TABLE public.predictions (
  id              SERIAL PRIMARY KEY,
  profile_id      UUID    NOT NULL REFERENCES public.profiles(id),
  match_id        SMALLINT NOT NULL REFERENCES public.matches(id),

  -- Lo que el usuario predice
  pred_home_goals INTEGER NOT NULL,
  pred_away_goals INTEGER NOT NULL,

  -- NULL en grupos, obligatorio en eliminatorias (validar en API/frontend)
  pred_winner_id  INTEGER REFERENCES public.teams(id),

  -- Calculado por la API al finalizar el partido
  points_earned   SMALLINT DEFAULT 0,
  -- +1 si el usuario estaba en el ≤15% que votó ese ganador/clasificado Y acertó
  -- Solo aplica si la liga tiene triple_rule_enabled = true
  -- El triple NO aplica al resultado exacto (demasiado disperso para tener sentido)
  triple_bonus    BOOLEAN  DEFAULT false,

  updated_at      TIMESTAMP WITH TIME ZONE DEFAULT now(),

  -- Un usuario solo puede tener una predicción por partido
  CONSTRAINT uq_predictions_profile_match UNIQUE (profile_id, match_id),

  -- Validaciones básicas
  CONSTRAINT chk_pred_goals_non_negative
    CHECK (pred_home_goals >= 0 AND pred_away_goals >= 0)
);


-- ============================================================
--  ÍNDICES
-- ============================================================

-- Consultas frecuentes: predicciones de un partido (para calcular triple)
CREATE INDEX idx_predictions_match_id ON public.predictions(match_id);

-- Predicciones de un usuario
CREATE INDEX idx_predictions_profile_id ON public.predictions(profile_id);

-- Partidos por fecha (para mostrar próximos partidos)
CREATE INDEX idx_matches_date ON public.matches(match_date);

-- Partidos por fase
CREATE INDEX idx_matches_stage ON public.matches(stage);

-- Ranking global
CREATE INDEX idx_profiles_total_points ON public.profiles(total_points DESC);


-- ============================================================
--  VIEWS ÚTILES
-- ============================================================

-- Ranking global entre todos los usuarios
CREATE VIEW v_ranking_global AS
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


-- Ranking por liga privada
CREATE VIEW v_ranking_by_league AS
SELECT
  pl.league_id,
  lg.name AS league_name,
  p.id AS profile_id,
  p.nickname,
  pl.league_points,
  RANK() OVER (
    PARTITION BY pl.league_id
    ORDER BY pl.league_points DESC
  ) AS position
FROM public.profile_leagues pl
JOIN public.profiles p ON p.id = pl.profile_id
JOIN public.private_leagues lg ON lg.id = pl.league_id
ORDER BY pl.league_id, pl.league_points DESC;


-- Predicciones de un partido con datos del usuario (para calcular triple)
CREATE VIEW v_match_predictions AS
SELECT
  pr.match_id,
  pr.profile_id,
  p.nickname,
  pr.pred_home_goals,
  pr.pred_away_goals,
  pr.pred_winner_id,
  pr.points_earned,
  pr.triple_bonus
FROM public.predictions pr
JOIN public.profiles p ON p.id = pr.profile_id;


-- ============================================================
--  RLS (Row Level Security)
-- ============================================================

ALTER TABLE public.profiles       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.predictions     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_leagues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.private_leagues ENABLE ROW LEVEL SECURITY;

-- TEAMS: todos pueden leer, solo admin puede escribir
CREATE POLICY "teams_select_all"
  ON public.teams FOR SELECT USING (true);

-- MATCHES: todos pueden leer, solo admin puede escribir
CREATE POLICY "matches_select_all"
  ON public.matches FOR SELECT USING (true);

-- PROFILES: todos pueden leer, solo el propio usuario puede editar el suyo
CREATE POLICY "profiles_select_all"
  ON public.profiles FOR SELECT USING (true);

CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- PREDICTIONS: cada usuario ve todas (para el ranking), pero solo edita las suyas
-- Y solo puede crear/editar ANTES de que empiece el partido
CREATE POLICY "predictions_select_all"
  ON public.predictions FOR SELECT USING (true);

CREATE POLICY "predictions_insert_own"
  ON public.predictions FOR INSERT
  WITH CHECK (
    auth.uid() = profile_id
    AND EXISTS (
      SELECT 1 FROM public.matches m
      WHERE m.id = match_id
      AND m.match_date > now()  -- Solo si el partido no ha empezado
    )
  );

CREATE POLICY "predictions_update_own"
  ON public.predictions FOR UPDATE
  USING (
    auth.uid() = profile_id
    AND EXISTS (
      SELECT 1 FROM public.matches m
      WHERE m.id = match_id
      AND m.match_date > now()
    )
  );

-- PRIVATE LEAGUES: todos los miembros pueden ver las ligas a las que pertenecen
CREATE POLICY "private_leagues_select_member"
  ON public.private_leagues FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profile_leagues pl
      WHERE pl.league_id = id
      AND pl.profile_id = auth.uid()
    )
  );

-- PROFILE_LEAGUES: el usuario ve solo sus propias membresías
CREATE POLICY "profile_leagues_select_own"
  ON public.profile_leagues FOR SELECT
  USING (profile_id = auth.uid());