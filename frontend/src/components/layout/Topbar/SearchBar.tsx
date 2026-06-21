import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { useUiStore } from '@/store/uiStore';

export function SearchBar() {
  const setOpen = useUiStore((s) => s.setGlobalSearchOpen);
  const [isMac, setIsMac] = useState(true);

  useEffect(() => {
    setIsMac(/Mac|iPhone|iPad/i.test(navigator.platform || navigator.userAgent));
  }, []);

  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      aria-label="Search"
      className="group relative hidden h-9 w-full max-w-md items-center rounded-lg border border-subtle bg-sunken pl-9 pr-16 text-left text-body-sm text-ink-400 transition-colors hover:border-strong hover:bg-surface focus:border-accent-600 focus:bg-surface focus:outline-none md:flex"
    >
      <Search
        size={16}
        strokeWidth={1.5}
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-400"
      />
      <span className="truncate">Search invoices, clients, employees…</span>
      <kbd className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded border border-subtle bg-surface px-1.5 py-0.5 font-data text-[10px] text-ink-400">
        {isMac ? '⌘K' : 'Ctrl K'}
      </kbd>
    </button>
  );
}
