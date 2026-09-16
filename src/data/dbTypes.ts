/**
 * Types de base de données (snake_case) correspondant au schéma Supabase.
 * Ces types sont utilisés uniquement dans la couche data pour le mapping.
 * Les types domaine (camelCase) dans src/types/index.ts restent la référence pour l'UI.
 */

import type { Database } from '../lib/supabase/database.types';

export type DbContact = Database['public']['Tables']['contacts']['Row'];
export type DbRequest = Database['public']['Tables']['requests']['Row'];
export type DbMission = Database['public']['Tables']['missions']['Row'];
export type DbExchange = Database['public']['Tables']['exchanges']['Row'];
export type DbRequestAction = Database['public']['Tables']['request_actions']['Row'];

export type DbRelationshipType = Database['public']['Enums']['relationship_type'];
export type DbRequestStatus = Database['public']['Enums']['request_status'];
export type DbMissionStatus = Database['public']['Enums']['mission_status'];
export type DbExchangeType = Database['public']['Enums']['exchange_type'];
export type DbRequestActionType = Database['public']['Enums']['request_action_type'];