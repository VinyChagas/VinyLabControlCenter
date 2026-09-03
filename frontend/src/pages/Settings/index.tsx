import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { DatabaseSecretForm } from '@/components/settings/DatabaseSecretForm';
import { SETTINGS_SECTIONS } from '@/constants/settings';
import { cn } from '@/utils/format';

export function SettingsPage() {
  const [activeId, setActiveId] = useState(SETTINGS_SECTIONS[0]?.id ?? 'geral');
  const active = SETTINGS_SECTIONS.find((section) => section.id === activeId);

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 animate-fade-in">
      <Card className="p-3 lg:col-span-4 xl:col-span-3">
        <nav aria-label="Seções de configuração" className="flex flex-col gap-1">
          {SETTINGS_SECTIONS.map((section, index) => (
            <button
              key={section.id}
              type="button"
              onClick={() => setActiveId(section.id)}
              className={cn(
                'rounded-lg px-3 py-2.5 text-left text-[13px] transition-all duration-200 animate-slide-up-sm',
                section.id === activeId
                  ? 'bg-blue-accent/10 font-medium text-blue-accent'
                  : 'text-muted hover:bg-white/5 hover:text-text hover:translate-x-0.5',
              )}
              style={{ animationDelay: `${index * 0.04}s` }}
            >
              {section.label}
            </button>
          ))}
        </nav>
      </Card>

      <Card className="p-5 lg:col-span-8 xl:col-span-9">
        {activeId === 'api-keys' ? (
          <DatabaseSecretForm />
        ) : (
          <>
            <h2 className="text-[15px] font-semibold text-text animate-fade-in" key={activeId}>
              {active?.label ?? 'Geral'}
            </h2>
            <p
              className="mt-2 text-[13px] leading-relaxed text-muted animate-slide-up-sm"
              key={`${activeId}-desc`}
            >
              As opções de {active?.label.toLowerCase() ?? 'configuração'} serão disponibilizadas
              nesta seção. Nenhuma persistência está ativa nesta etapa.
            </p>
          </>
        )}
      </Card>
    </div>
  );
}
