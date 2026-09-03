import {
  BarChart3,
  Bot,
  Container,
  Database,
  Send,
  Workflow,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { ROUTES } from '@/constants/navigation';
import { cn } from '@/utils/format';
import type { LucideIcon } from 'lucide-react';
import type { QuickLink, QuickLinkIcon } from '@/types';

const LINK_ICONS: Record<QuickLinkIcon, LucideIcon> = {
  n8n: Workflow,
  hermes: Bot,
  grafana: BarChart3,
  portainer: Container,
  postgres: Database,
  telegram: Send,
};

const LINK_ACCENT: Record<QuickLinkIcon, string> = {
  n8n: 'text-orange-accent',
  hermes: 'text-blue-accent',
  grafana: 'text-orange-accent',
  portainer: 'text-blue-accent',
  postgres: 'text-blue-accent',
  telegram: 'text-orange-accent',
};

interface QuickLinksProps {
  links: QuickLink[];
}

export function QuickLinks({ links }: QuickLinksProps) {
  return (
    <Card className="flex min-h-[340px] flex-col p-5 animate-slide-up stagger-8">
      <h2 className="text-[15px] font-semibold text-text">Atalhos Rápidos</h2>
      <div className="mt-5 grid grid-cols-3 gap-3">
        {links.map((link) => {
          const Icon = LINK_ICONS[link.icon];

          return (
            <a
              key={link.id}
              href={link.url}
              target="_blank"
              rel="noreferrer"
              className="group flex aspect-square flex-col items-center justify-center gap-2 rounded-xl border border-line bg-card-elevated px-2 text-center transition-all duration-200 hover:border-blue-accent/30 hover:bg-white/5 hover:scale-[1.03]"
            >
              <Icon
                className={cn(
                  'size-5 transition-transform duration-200 group-hover:scale-110',
                  LINK_ACCENT[link.icon],
                )}
                strokeWidth={1.7}
              />
              <span className="text-[11px] leading-tight text-muted transition-colors duration-200 group-hover:text-text">
                {link.name}
              </span>
            </a>
          );
        })}
      </div>
      <Link
        to={ROUTES.services}
        className="mt-auto flex items-center justify-center rounded-lg border border-line py-2.5 text-[13px] text-muted transition-all duration-200 hover:border-blue-accent/30 hover:text-text hover:bg-white/3"
      >
        Ver todos os serviços
      </Link>
    </Card>
  );
}
