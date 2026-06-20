import { Monitor, Moon, Sun } from 'lucide-react';
import { useThemeStore } from '@/store/themeStore';
import { cn } from '@/lib/cn';

const OPTIONS = [
  { value: 'light', icon: Sun, label: 'Light' },
  { value: 'dark', icon: Moon, label: 'Dark' },
  { value: 'system', icon: Monitor, label: 'System' },
] as const;

export function ThemeToggle() {
  const theme = useThemeStore((s) => s.theme);
  const setTheme = useThemeStore((s) => s.setTheme);

  return (
    <div className="inline-flex items-center gap-0.5 rounded-lg border border-subtle bg-sunken p-0.5">
      {OPTIONS.map((option) => {
        const Icon = option.icon;
        const active = theme === option.value;
        return (
          <button
            key={option.value}
            type="button"
            aria-label={`${option.label} theme`}
            aria-pressed={active}
            onClick={() => setTheme(option.value)}
            className={cn(
              'flex h-7 w-7 items-center justify-center rounded-md transition-colors',
              active ? 'bg-surface text-accent-600 shadow-card' : 'text-ink-400 hover:text-ink-600',
            )}
          >
            <Icon size={15} strokeWidth={1.5} />
          </button>
        );
      })}
    </div>
  );
}
