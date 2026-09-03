import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { PageContainer } from '@/components/layout/PageContainer';
import { Sidebar } from '@/components/layout/Sidebar';
import { FOOTER_COPY } from '@/constants/app';
import { LayoutContext } from '@/hooks/useLayoutContext';
import { useLayoutBootstrap } from '@/hooks/useLayoutBootstrap';

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { health, notificationCount, loading, error } = useLayoutBootstrap();

  return (
    <LayoutContext.Provider
      value={{
        sidebarOpen,
        setSidebarOpen,
        health,
        notificationCount,
      }}
    >
      <div className="flex min-h-screen bg-canvas text-text">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <Header />
          {error ? (
            <div className="mx-auto mb-2 w-full max-w-[1440px] px-5 lg:px-8">
              <p className="rounded-lg border border-orange-accent/30 bg-orange-accent/5 px-4 py-2 text-[13px] text-orange-accent">
                Backend indisponível: {error}. Inicie com <code>cd backend && npm run dev</code>.
              </p>
            </div>
          ) : null}
          <PageContainer>
            <Outlet />
          </PageContainer>
          <footer className="px-5 pb-5 text-center text-[11px] text-muted/80 lg:px-8">
            {FOOTER_COPY}
            {loading ? ' · sincronizando...' : null}
          </footer>
        </div>
      </div>
    </LayoutContext.Provider>
  );
}
