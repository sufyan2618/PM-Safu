import { Loader2 } from 'lucide-react';

export function RouteFallback() {
  return (
    <div className="flex h-dvh items-center justify-center bg-canvas">
      <Loader2 size={28} className="animate-spin text-accent-600" />
    </div>
  );
}
