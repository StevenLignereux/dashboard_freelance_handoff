import { useAppStore, useReducedMotion } from '../store/AppStore';
import { useCurrentUser } from '../auth/AuthProvider';
import { appConfig } from '../config/appConfig';

export function SettingsPage() {
  const store = useAppStore();
  const currentUser = useCurrentUser();
  const reduced = useReducedMotion();

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10 max-w-4xl mx-auto space-y-8">
      <header>
        <h1 className="font-display font-bold text-slate-900 text-2xl sm:text-3xl tracking-tight">
          Paramètres
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Préférences applicatives et informations du compte connecté.
        </p>
      </header>

      <section className="surface p-6 space-y-5">
        <h2 className="font-display font-semibold text-slate-900 text-lg">Profil</h2>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-violet to-brand-cyan ring-2 ring-bg-surface flex items-center justify-center font-display font-bold text-white text-2xl shadow-glow">
            {currentUser.avatarLabel}
          </div>
          <div>
            <div className="font-display font-semibold text-slate-900">
              {currentUser.firstName} {currentUser.lastName}
            </div>
            <div className="text-sm text-slate-500">{currentUser.role}</div>
            <div className="text-xs text-slate-400 mt-1">Identifiant : {currentUser.id}</div>
          </div>
        </div>
      </section>

      <section className="surface p-6 space-y-5">
        <h2 className="font-display font-semibold text-slate-900 text-lg">Application</h2>
        <div className="space-y-4">
          <div>
            <div className="text-sm font-medium text-slate-900">Nom du produit</div>
            <div className="text-xs text-slate-400 mt-0.5">
              Placeholder en attente de validation finale.
            </div>
            <div className="mt-2 font-display font-semibold text-brand-violet text-lg">
              {appConfig.productName}.
            </div>
          </div>
          <div>
            <div className="text-sm font-medium text-slate-900">Version actuelle</div>
            <div className="text-xs text-slate-400 mt-0.5">
              V1 — Contacts, demandes, échanges et missions enregistrés dans Supabase.
            </div>
          </div>
        </div>
      </section>

      <section className="surface p-6 space-y-5">
        <h2 className="font-display font-semibold text-slate-900 text-lg">Préférences</h2>
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-sm font-medium text-slate-900">Animations réduites</div>
            <div className="text-xs text-slate-400 mt-0.5">
              Détecté depuis votre préférence système (prefers-reduced-motion).
            </div>
          </div>
          <span
            className={`chip ring-1 shrink-0 ${
              reduced
                ? 'bg-brand-cyan/15 text-brand-cyan ring-brand-cyan/30'
                : 'bg-brand-violet/10 text-slate-700 ring-brand-violet/20'
            }`}
          >
            {reduced ? 'Activées' : 'Désactivées'}
          </span>
        </div>
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-sm font-medium text-slate-900">Recherche globale</div>
            <div className="text-xs text-slate-400 mt-0.5">
              ⌘K ou Ctrl+K pour activer la recherche depuis n&rsquo;importe quelle vue.
            </div>
          </div>
          <span
            className={`chip ring-1 shrink-0 ${
              store.search.query
                ? 'bg-brand-violet/15 text-brand-violet ring-brand-violet/30'
                : 'bg-brand-violet/10 text-slate-700 ring-brand-violet/20'
            }`}
          >
            {store.search.query ? `Active : « ${store.search.query} »` : 'Inactive'}
          </span>
        </div>
      </section>
    </div>
  );
}
