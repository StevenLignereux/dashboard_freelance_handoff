-- =============================================================================
-- Migration: initial_schema
-- Tables: contacts, requests, request_actions, exchanges, missions
-- RLS: activé sur chaque table, politiques basées sur auth.uid() = user_id
-- Multi-user safety: FK composites (parent_id, user_id) pour éviter les
--   références croisées entre utilisateurs
-- =============================================================================

-- ---------------------------------------------------------------------------
-- TYPES ÉNUMÉRÉS
-- ---------------------------------------------------------------------------

CREATE TYPE relationship_type AS ENUM (
  'prospect',
  'client',
  'client_recurrent',
  'ancien_client'
);

CREATE TYPE request_status AS ENUM (
  'nouveau',
  'a_comprendre',
  'echange_prevu',
  'solution_proposee',
  'en_attente',
  'mission_confirmee',
  'sans_suite'
);

CREATE TYPE request_action_type AS ENUM (
  'relance',
  'proposition',
  'appel',
  'devis',
  'documents',
  'precision',
  'echange',
  'autre'
);

CREATE TYPE exchange_type AS ENUM (
  'appel',
  'email',
  'message',
  'rencontre',
  'note'
);

CREATE TYPE mission_status AS ENUM (
  'a_demarrer',
  'en_cours',
  'en_attente',
  'terminee'
);

-- ---------------------------------------------------------------------------
-- TABLE: contacts
-- Champs dérivés NON stockés : totalRequests, totalMissions, activeRequestId,
-- avatarSeed — calculés côté application.
-- ---------------------------------------------------------------------------

CREATE TABLE contacts (
  id                uuid        NOT NULL DEFAULT gen_random_uuid(),
  user_id           uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name        text        NOT NULL CHECK (char_length(first_name) > 0),
  last_name         text        NOT NULL CHECK (char_length(last_name) > 0),
  company           text,
  email             text,
  phone             text,
  notes             text,
  relationship      relationship_type NOT NULL,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  last_activity_at  timestamptz NOT NULL DEFAULT now(),
  archived          boolean     NOT NULL DEFAULT false,

  -- Clé primaire simple
  PRIMARY KEY (id),

  -- Clé candidate composite pour permettre les FK composites depuis les
  -- tables enfants (sécurité multi-utilisateur)
  UNIQUE (id, user_id)
);

-- Index
CREATE INDEX contacts_user_id_idx       ON contacts (user_id);
CREATE INDEX contacts_last_activity_idx ON contacts (user_id, last_activity_at DESC);
CREATE INDEX contacts_archived_idx      ON contacts (user_id, archived);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER contacts_updated_at
  BEFORE UPDATE ON contacts
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- RLS
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

-- Révoquer tous les accès par défaut (anon ne doit rien voir)
REVOKE ALL ON contacts FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON contacts TO authenticated;

CREATE POLICY contacts_select ON contacts
  FOR SELECT TO authenticated
  USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY contacts_insert ON contacts
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY contacts_update ON contacts
  FOR UPDATE TO authenticated
  USING (auth.uid() IS NOT NULL AND auth.uid() = user_id)
  WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY contacts_delete ON contacts
  FOR DELETE TO authenticated
  USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- TABLE: requests
-- is_active : au plus une demande active par contact — garanti via index
-- unique partiel sur (user_id, contact_id) WHERE is_active = true
-- ---------------------------------------------------------------------------

CREATE TABLE requests (
  id                uuid           NOT NULL DEFAULT gen_random_uuid(),
  user_id           uuid           NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- FK composite vers contacts(id, user_id) : empêche référence croisée
  contact_id        uuid           NOT NULL,
  title             text           NOT NULL CHECK (char_length(title) > 0),
  description       text,
  status            request_status NOT NULL DEFAULT 'nouveau',
  is_active         boolean        NOT NULL DEFAULT false,
  created_at        timestamptz    NOT NULL DEFAULT now(),
  updated_at        timestamptz    NOT NULL DEFAULT now(),
  last_activity_at  timestamptz    NOT NULL DEFAULT now(),
  archived          boolean        NOT NULL DEFAULT false,

  PRIMARY KEY (id),
  UNIQUE (id, user_id),

  -- FK composite : contact_id + user_id doivent correspondre à la même ligne
  -- dans contacts, empêchant toute référence croisée d'utilisateur
  FOREIGN KEY (contact_id, user_id)
    REFERENCES contacts (id, user_id)
    ON DELETE CASCADE
);

-- Index unique partiel : au plus une demande active par (user, contact)
CREATE UNIQUE INDEX requests_one_active_per_contact
  ON requests (user_id, contact_id)
  WHERE is_active = true;

CREATE INDEX requests_user_id_idx      ON requests (user_id);
CREATE INDEX requests_contact_id_idx   ON requests (contact_id);
CREATE INDEX requests_status_idx       ON requests (user_id, status);
CREATE INDEX requests_last_activity_idx ON requests (user_id, last_activity_at DESC);

CREATE TRIGGER requests_updated_at
  BEFORE UPDATE ON requests
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- RLS
ALTER TABLE requests ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON requests FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON requests TO authenticated;

CREATE POLICY requests_select ON requests
  FOR SELECT TO authenticated
  USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY requests_insert ON requests
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY requests_update ON requests
  FOR UPDATE TO authenticated
  USING (auth.uid() IS NOT NULL AND auth.uid() = user_id)
  WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY requests_delete ON requests
  FOR DELETE TO authenticated
  USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- TABLE: request_actions
-- Champs dérivés NON stockés : isOverdue, overdueDays, isToday, isUpcoming
-- Au plus une action ouverte par demande : index unique partiel WHERE
-- completed_at IS NULL
-- ---------------------------------------------------------------------------

CREATE TABLE request_actions (
  id            uuid                NOT NULL DEFAULT gen_random_uuid(),
  user_id       uuid                NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  request_id    uuid                NOT NULL,
  type          request_action_type NOT NULL,
  label         text                NOT NULL CHECK (char_length(label) > 0),
  due_at        timestamptz         NOT NULL,
  completed_at  timestamptz,
  created_at    timestamptz         NOT NULL DEFAULT now(),
  updated_at    timestamptz         NOT NULL DEFAULT now(),

  PRIMARY KEY (id),
  UNIQUE (id, user_id),

  -- FK composite : request_id + user_id → sécurité multi-utilisateur
  FOREIGN KEY (request_id, user_id)
    REFERENCES requests (id, user_id)
    ON DELETE CASCADE
);

-- Index unique partiel : au plus une action ouverte par (user, request)
CREATE UNIQUE INDEX request_actions_one_open_per_request
  ON request_actions (user_id, request_id)
  WHERE completed_at IS NULL;

CREATE INDEX request_actions_user_id_idx    ON request_actions (user_id);
CREATE INDEX request_actions_request_id_idx ON request_actions (request_id);
CREATE INDEX request_actions_due_at_idx     ON request_actions (user_id, due_at);

CREATE TRIGGER request_actions_updated_at
  BEFORE UPDATE ON request_actions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- RLS
ALTER TABLE request_actions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON request_actions FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON request_actions TO authenticated;

CREATE POLICY request_actions_select ON request_actions
  FOR SELECT TO authenticated
  USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY request_actions_insert ON request_actions
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY request_actions_update ON request_actions
  FOR UPDATE TO authenticated
  USING (auth.uid() IS NOT NULL AND auth.uid() = user_id)
  WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY request_actions_delete ON request_actions
  FOR DELETE TO authenticated
  USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- TABLE: exchanges
-- ---------------------------------------------------------------------------

CREATE TABLE exchanges (
  id          uuid          NOT NULL DEFAULT gen_random_uuid(),
  user_id     uuid          NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  request_id  uuid          NOT NULL,
  type        exchange_type NOT NULL,
  occurred_at timestamptz   NOT NULL,
  summary     text          NOT NULL CHECK (char_length(summary) > 0),
  created_at  timestamptz   NOT NULL DEFAULT now(),

  PRIMARY KEY (id),
  UNIQUE (id, user_id),

  -- FK composite : request_id + user_id → sécurité multi-utilisateur
  FOREIGN KEY (request_id, user_id)
    REFERENCES requests (id, user_id)
    ON DELETE CASCADE
);

CREATE INDEX exchanges_user_id_idx    ON exchanges (user_id);
CREATE INDEX exchanges_request_id_idx ON exchanges (request_id);
CREATE INDEX exchanges_occurred_at_idx ON exchanges (user_id, occurred_at DESC);

-- RLS
ALTER TABLE exchanges ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON exchanges FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON exchanges TO authenticated;

CREATE POLICY exchanges_select ON exchanges
  FOR SELECT TO authenticated
  USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY exchanges_insert ON exchanges
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY exchanges_update ON exchanges
  FOR UPDATE TO authenticated
  USING (auth.uid() IS NOT NULL AND auth.uid() = user_id)
  WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY exchanges_delete ON exchanges
  FOR DELETE TO authenticated
  USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- TABLE: missions
-- Pas de contact_id physique : dérivé via request → contact
-- progress : 0-100
-- ---------------------------------------------------------------------------

CREATE TABLE missions (
  id          uuid           NOT NULL DEFAULT gen_random_uuid(),
  user_id     uuid           NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  request_id  uuid           NOT NULL,
  title       text           NOT NULL CHECK (char_length(title) > 0),
  status      mission_status NOT NULL DEFAULT 'a_demarrer',
  start_date  date,
  end_date    date,
  progress    smallint       CHECK (progress BETWEEN 0 AND 100),
  notes       text,
  created_at  timestamptz    NOT NULL DEFAULT now(),
  updated_at  timestamptz    NOT NULL DEFAULT now(),

  PRIMARY KEY (id),
  UNIQUE (id, user_id),

  -- FK composite : request_id + user_id → sécurité multi-utilisateur
  FOREIGN KEY (request_id, user_id)
    REFERENCES requests (id, user_id)
    ON DELETE CASCADE
);

CREATE INDEX missions_user_id_idx    ON missions (user_id);
CREATE INDEX missions_request_id_idx ON missions (request_id);
CREATE INDEX missions_status_idx     ON missions (user_id, status);

CREATE TRIGGER missions_updated_at
  BEFORE UPDATE ON missions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- RLS
ALTER TABLE missions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON missions FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON missions TO authenticated;

CREATE POLICY missions_select ON missions
  FOR SELECT TO authenticated
  USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY missions_insert ON missions
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY missions_update ON missions
  FOR UPDATE TO authenticated
  USING (auth.uid() IS NOT NULL AND auth.uid() = user_id)
  WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY missions_delete ON missions
  FOR DELETE TO authenticated
  USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);
