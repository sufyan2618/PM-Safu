import { Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/utils/cn';

/** Small consistent "AI" marker so users always know a surface is AI-generated. */
export function AiBadge({ label = 'AI', className }: { label?: string; className?: string }) {
  return (
    <Badge tone="accent" className={cn('gap-1', className)}>
      <Sparkles size={12} strokeWidth={2} />
      {label}
    </Badge>
  );
}

export function AiDisclaimer({
  text = 'AI can make mistakes. Review the details before saving.',
  className,
}: {
  text?: string;
  className?: string;
}) {
  return (
    <p className={cn('flex items-center gap-1.5 text-caption text-ink-400', className)}>
      <Sparkles size={12} strokeWidth={1.5} className="shrink-0" />
      {text}
    </p>
  );
}
