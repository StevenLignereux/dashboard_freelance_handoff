/**
 * Repository Factory - Orchestrateur pour la sélection de la source de données.
 * Permet de choisir explicitement entre seed et Supabase.
 *
 * Comportement :
 * - mode seed → fonctionne entièrement sans Supabase
 * - mode Supabase explicitement sélectionné → une erreur Supabase reste une erreur
 * - ne jamais basculer silencieusement vers seed après une erreur réseau/auth
 *
 * ⚠️ Configuration EXPLICITE et volontairement statique.
 * On NE déduit PAS automatiquement la source depuis isSupabaseConfigured
 * (cela rendrait le comportement ambigu / imprévisible selon l'environnement).
 */

import type { IRepository } from './interface';
import { SeedRepository } from './seedRepository';
import { SupabaseRepository } from './supabaseRepository';

export type DataSource = 'seed' | 'supabase';

/**
 * Source de données PAR DÉFAUT pour Backend 2B.
 * Valeur fixée explicitement : `supabase`.
 *
 * Ceci garantit :
 *  - Pas d'ambiguïté (aucune déduction implicite depuis env ni isSupabaseConfigured)
 *  - Pas de fallback silencieux : erreur Supabase = vraie erreur, pas de seed en RAM
 *  - Une modification VOLONTAIRE est requise pour repasser à seed
 * Pour seed : surcharger via createRepositoryWithSource('seed')
 * ou changer ici à la main quand on a besoin de seed seulement.
 */
export const DEFAULT_DATA_SOURCE: DataSource = 'supabase';

/**
 * Export rétro-compatible pour tout consommateur existant de `DATA_SOURCE`.
 */
export const DATA_SOURCE: DataSource = DEFAULT_DATA_SOURCE;

/**
 * Crée une instance de repository selon la source explicitement configurée.
 * Ne fait PAS de fallback silencieux : si la source est supabase et échoue,
 * l'erreur est propagée telle quelle.
 */
export function createRepository(source: DataSource = DEFAULT_DATA_SOURCE): IRepository {
  if (source === 'supabase') {
    return new SupabaseRepository();
  }
  return new SeedRepository();
}

/**
 * Alias sémantique pour forcer une source spécifique (utile pour les tests
 * ou pour des cas où on veut être absolument explicite à l'appel).
 */
export function createRepositoryWithSource(source: DataSource): IRepository {
  return createRepository(source);
}