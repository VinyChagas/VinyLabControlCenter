import type { ReactNode } from 'react';

interface PageContainerProps {
  children: ReactNode;
}

export function PageContainer({ children }: PageContainerProps) {
  return (
    <main className="flex-1 px-5 pb-6 lg:px-8">
      <div className="mx-auto w-full max-w-[1440px]">{children}</div>
    </main>
  );
}
