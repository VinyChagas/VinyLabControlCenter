import { Card } from '@/components/ui/Card';

interface PlaceholderPageProps {
  heading: string;
  description: string;
}

export function PlaceholderPage({ heading, description }: PlaceholderPageProps) {
  return (
    <Card className="px-5 py-6 animate-slide-up">
      <h2 className="text-[15px] font-semibold text-text">{heading}</h2>
      <p className="mt-2 max-w-xl text-[13px] leading-relaxed text-muted">{description}</p>
    </Card>
  );
}
