import type { NavItemKey } from '../../types';
import { appConfig } from '../../config/appConfig';
import type { RefObject } from 'react';

const navItems: {
  key: NavItemKey;
  label: string;
  icon: React.ReactNode;
}[] = [
  {
    key: 'dashboard',
    label: 'Tableau de bord',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M3 12l9-9 9 9" />
        <path d="M5 10v10h14V10" />
      </svg>
    ),
  },
  {
    key: 'contacts',
    label: 'Contacts',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    key: 'requests',
    label: 'Demandes',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  {
    key: 'missions',
    label: 'Missions',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <rect x="2" y="7" width="20" height="14" rx="2" />
        <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
      </svg>
    ),
  },
];

interface SidebarProps {
  activeNav: NavItemKey;
  onNavigate: (key: NavItemKey) => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  lastMenuFocusRef?: RefObject<HTMLElement | null>;
}

export function Sidebar({
  activeNav,
  onNavigate,
  mobileOpen,
  onCloseMobile,
}: SidebarProps) {
  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-slate-900/40 backdrop-blur-sm md:hidden animate-fadeIn"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}
      <aside
        className={`
          fixed md:sticky md:top-0 md:h-screen md:self-start md:max-h-screen inset-y-0 left-0 z-40 w-72 shrink-0
          bg-bg-panel/95 md:bg-bg-surface/80 md:backdrop-blur-xl
          border-r border-brand-violet/10
          transform transition-transform duration-300 ease-snap
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          flex flex-col
        `}
      >
        <div className="px-5 py-5 flex items-center gap-3 border-b border-brand-violet/10 shrink-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-violet to-brand-cyan flex items-center justify-center shadow-glow">
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
          </div>
          <div>
            <div className="font-display font-bold text-slate-900 tracking-tight text-lg leading-none">
              {appConfig.productName}
              <span className="text-brand-violet">.</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              {appConfig.productTagline}
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto min-h-0">
          <div className="px-2 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Navigation
          </div>
          {navItems.map((item) => {
            const active = activeNav === item.key;
            return (
              <button
                key={item.key}
                onClick={() => {
                  onNavigate(item.key);
                  onCloseMobile();
                }}
                className={[
                  'group w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium',
                  'transition-all duration-150 ease-snap',
                  active
                    ? 'text-slate-900 bg-gradient-to-r from-brand-violet/15 via-brand-violet/10 to-transparent ring-1 ring-brand-violet/25 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-brand-violet/5',
                ].join(' ')}
              >
                <span
                  className={[
                    'transition-colors',
                    active ? 'text-brand-violet' : 'text-slate-400 group-hover:text-slate-600',
                  ].join(' ')}
                >
                  {item.icon}
                </span>
                <span>{item.label}</span>
                {active && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-brand-violet shadow-[0_0_12px_rgba(124,92,255,0.6)]" />
                )}
              </button>
            );
          })}
        </nav>

        <div className="p-3 border-t border-brand-violet/10 shrink-0">
          <div className="relative overflow-hidden rounded-2xl p-4 bg-gradient-to-br from-brand-violet/15 via-bg-surface2 to-brand-cyan/10 ring-1 ring-brand-violet/15">
            <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-brand-violet/15 blur-3xl" />
            <div className="relative">
              <p className="text-xs text-slate-600 leading-relaxed">
                <span className="font-serif text-lg leading-none text-brand-violet">
                  “
                </span>
                {appConfig.signatureQuote}
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
