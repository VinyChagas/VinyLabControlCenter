import { Bell, Menu } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { PAGE_META } from '@/constants/navigation';
import { useClock } from '@/hooks/useClock';
import { useLayoutContext } from '@/hooks/useLayoutContext';
import { formatHeaderDate, formatHeaderTime } from '@/utils/format';

export function Header() {
  const { pathname } = useLocation();
  const { setSidebarOpen, notificationCount } = useLayoutContext();
  const now = useClock();
  const meta = PAGE_META[pathname] ?? PAGE_META['/'];

  if (!meta) {
    return null;
  }

  return (
    <header className="flex items-start justify-between gap-4 px-5 pt-6 pb-4 lg:px-8">
      <div className="mx-auto flex w-full max-w-[1440px] items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <button
            type="button"
            className="mt-1 rounded-md p-1.5 text-muted transition-colors duration-200 hover:bg-white/5 hover:text-text lg:hidden"
            aria-label="Abrir menu"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="size-5" />
          </button>
          <div className="animate-fade-in">
            {meta.greeting ? (
              <p className="text-[13px] text-muted">{meta.greeting}</p>
            ) : null}
            <h1 className="text-[28px] leading-tight font-semibold tracking-tight text-text">
              {meta.title}
            </h1>
            <p className="mt-1 text-[13px] text-muted">{meta.subtitle}</p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-4 pt-1 animate-fade-in">
          <div className="hidden text-right sm:block">
            <p className="text-[13px] text-muted">{formatHeaderDate(now)}</p>
            <p className="text-[13px] tabular-nums text-muted">{formatHeaderTime(now)}</p>
          </div>
          <button
            type="button"
            className="relative rounded-md p-1.5 text-muted transition-all duration-200 hover:bg-white/5 hover:text-text hover:scale-110"
            aria-label={`Notificações, ${notificationCount} não lidas`}
          >
            <Bell className="size-[18px]" strokeWidth={1.75} />
            {notificationCount > 0 ? (
              <span className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-blue-accent text-[10px] font-semibold text-white animate-scale-in">
                {notificationCount}
              </span>
            ) : null}
          </button>
        </div>
      </div>
    </header>
  );
}
