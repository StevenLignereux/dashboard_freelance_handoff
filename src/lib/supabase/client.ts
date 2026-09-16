/**
 * Client Supabase — point d'entrée unique pour l'accès à la base de données.
 *
 * Règles :
 * - Ce fichier est le SEUL endroit où @supabase/supabase-js est importé.
 * - Les composants UI et l'AppStore n'importent JAMAIS ce module directement.
 * - La clé utilisée est exclusivement la clé anon/publishable (jamais service_role).
 * - Si les variables d'environnement sont absentes (ex. : dev seed-only),
 *   le client est null et l'export `isSupabaseConfigured` vaut false.
 *   Cela permet à l'app de continuer à fonctionner avec les seed data.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const PLACEHOLDER_URL = 'https://your-project-ref.supabase.co';
const PLACEHOLDER_KEY = 'your-anon-publishable-key';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

function isValidValue(v: string | undefined, placeholder: string): v is string {
  return typeof v === 'string' && v.length > 0 && v !== placeholder;
}

/**
 * Indique si Supabase est explicitement configuré (variables d'env renseignées).
 * Lorsque false, l'application utilise la source seed en mémoire.
 */
export const isSupabaseConfigured: boolean =
  isValidValue(supabaseUrl, PLACEHOLDER_URL) &&
  isValidValue(supabaseKey, PLACEHOLDER_KEY);

function buildClient(): SupabaseClient<Database> | null {
  if (!isValidValue(supabaseUrl, PLACEHOLDER_URL) || !isValidValue(supabaseKey, PLACEHOLDER_KEY)) {
    return null;
  }
  return createClient<Database>(supabaseUrl, supabaseKey);
}

/**
 * Instance du client Supabase.
 * Vaut null si les variables d'environnement ne sont pas configurées.
 * Utiliser `isSupabaseConfigured` avant tout accès.
 */
export const supabase: SupabaseClient<Database> | null = buildClient();

/**
 * Retourne le client Supabase ou LÈVE une Error explicite si la configuration
 * (VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY) est absente ou invalide.
 *
 * Utilisé par les modules (Auth, SupabaseRepository) qui EXIGENT Supabase.
 * Pas de fallback silencieux : l'erreur est signalée clairement à l'appelant.
 */
export function getSupabaseOrThrow(): SupabaseClient<Database> {
  if (!supabase) {
    throw new Error(
      [
        'Supabase n’est pas configuré.',
        'Vérifiez les variables d’environnement VITE_SUPABASE_URL et',
        'VITE_SUPABASE_PUBLISHABLE_KEY dans votre fichier .env.local.',
      ].join(' ')
    );
  }
  return supabase;
}
