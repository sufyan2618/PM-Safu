import { Search } from 'lucide-react';

export function SearchBar() {
  return (
    <div className="relative hidden w-full max-w-md md:block">
      <Search
        size={16}
        strokeWidth={1.5}
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-400"
      />
      <input
        type="search"
        placeholder="Search invoices, clients, employees…"
        className="h-9 w-full rounded-lg border border-subtle bg-sunken pl-9 pr-16 text-body-sm text-ink-900 placeholder:text-ink-400 transition-colors focus:border-accent-600 focus:bg-surface focus:outline-none"
      />
      <kbd className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded border border-subtle bg-surface px-1.5 py-0.5 font-data text-[10px] text-ink-400">
        ⌘K
      </kbd>
    </div>
  );
}
