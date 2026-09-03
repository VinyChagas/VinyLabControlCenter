import {
  Archive,
  FolderKanban,
  LayoutDashboard,
  Layers,
  LogOut,
  ScrollText,
  Server,
  Settings,
} from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '@/auth/useAuth';
import { SystemHealth } from '@/components/dashboard/SystemHealth';
import { LogoMark } from '@/components/layout/LogoMark';
import { NAV_ITEMS, PLATFORM_ROLE_LABEL, type NavItem } from '@/constants/navigation';
import { useLayoutContext } from '@/hooks/useLayoutContext';
import { cn } from '@/utils/format';
import type { LucideIcon } from 'lucide-react';

const NAV_ICONS: Record<NavItem['icon'], LucideIcon> = {
  dashboard: LayoutDashboard,
  services: Server,
  projects: FolderKanban,
  environments: Layers,
  logs: ScrollText,
  backups: Archive,
  settings: Settings,
};

export function Sidebar() {
  const { sidebarOpen, setSidebarOpen, health } = useLayoutContext();
  const { user, logout } = useAuth();

  return (
    <>
      {sidebarOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm transition-opacity duration-300 lg:hidden"
          aria-label="Fechar menu"
          onClick={() => setSidebarOpen(false)}
        />
      ) : null}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-[240px] flex-col border-r border-line bg-sidebar px-4 py-5',
          'transition-transform duration-300 ease-out lg:static lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex items-center gap-3 px-1 animate-fade-in">
          <LogoMark />
          <div className="leading-tight">
            <p className="text-[13px] font-semibold tracking-[0.14em] text-text">VINICHAGAS</p>
            <p className="text-[12px] font-medium tracking-wide text-muted">.cloud</p>
          </div>
        </div>

        <nav className="mt-8 flex flex-1 flex-col gap-1" aria-label="Principal">
          {NAV_ITEMS.map((item, index) => {
            const Icon = NAV_ICONS[item.icon];

            return (
              <NavLink
                key={item.to}
                to={item.to}
                end
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  cn(
                    'relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] transition-all duration-200 animate-slide-up-sm',
                    isActive
                      ? 'bg-blue-accent/10 font-medium text-blue-accent'
                      : 'text-muted hover:bg-white/5 hover:text-text hover:translate-x-0.5',
                  )
                }
                style={{ animationDelay: `${index * 0.04}s` }}
              >
                {({ isActive }) => (
                  <>
                    {isActive ? (
                      <span className="absolute inset-y-1.5 left-0 w-0.5 rounded-full bg-blue-accent animate-scale-in" />
                    ) : null}
                    <Icon className="size-4 shrink-0 transition-transform duration-200" strokeWidth={1.75} />
                    {item.label}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        <div className="mt-auto flex flex-col gap-3">
          <div className="rounded-xl border border-line bg-card px-3 py-3 transition-colors duration-200 hover:border-line/80 animate-fade-in">
            <div className="flex items-center gap-3">
              <div
                className="relative flex size-9 shrink-0 items-center justify-center rounded-full bg-blue-accent/15 text-[11px] font-semibold text-blue-accent"
                aria-hidden
              >
                {user?.initials ?? '—'}
                <span className="absolute right-0 bottom-0 size-2 rounded-full border border-sidebar bg-blue-accent animate-glow-pulse" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-[13px] font-medium text-text">{user?.name ?? '—'}</p>
                <p className="text-[11px] text-blue-accent">
                  {user ? (PLATFORM_ROLE_LABEL[user.platformRole] ?? user.platformRole) : '—'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                void logout();
              }}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-line px-3 py-2 text-[12px] text-muted transition hover:border-orange-accent/40 hover:bg-orange-accent/10 hover:text-orange-accent"
            >
              <LogOut className="size-3.5" strokeWidth={1.75} />
              Sair
            </button>
          </div>

          <SystemHealth health={health} />
        </div>
      </aside>
    </>
  );
}
