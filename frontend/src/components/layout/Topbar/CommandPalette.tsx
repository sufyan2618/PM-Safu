import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Search,
  FileText,
  Users,
  IdCard,
  CornerDownLeft,
  ArrowUp,
  ArrowDown,
  Plus,
  Loader2,
} from 'lucide-react';
import { NAV_SECTIONS } from '@/constants/navigation.constants';
import { ROUTES } from '@/constants/routes.constants';
import { useUiStore } from '@/store/uiStore';
import { useAuthStore } from '@/store/authStore';
import { useDebounce } from '@/hooks/useDebounce';
import { useClients } from '@/hooks/queries/useClients';
import { useEmployees } from '@/hooks/queries/useEmployees';
import { useInvoices } from '@/hooks/queries/useInvoices';
import { cn } from '@/utils/cn';
import type { Role } from '@/types';

interface CommandItem {
  id: string;
  label: string;
  sublabel?: string;
  icon: ReactNode;
  group: string;
  to: string;
}

const BILLING_ROLES: Role[] = ['company_admin', 'accountant'];
const PEOPLE_ROLES: Role[] = ['company_admin', 'hr_manager'];

export function CommandPalette() {
  const open = useUiStore((s) => s.globalSearchOpen);
  const setOpen = useUiStore((s) => s.setGlobalSearchOpen);
  const role = useAuthStore((s) => s.user?.role) as Role | undefined;
  const navigate = useNavigate();

  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const debounced = useDebounce(query.trim(), 250);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const canBilling = !!role && BILLING_ROLES.includes(role);
  const canPeople = !!role && PEOPLE_ROLES.includes(role);
  const hasQuery = debounced.length >= 2;

  // Live entity searches — only run while the palette is open and a real query exists.
  const clientsQuery = useClients(
    { search: debounced, pageSize: 5 },
    open && hasQuery && canBilling,
  );
  const employeesQuery = useEmployees(
    { search: debounced, pageSize: 5 },
    open && hasQuery && canPeople,
  );
  const invoicesQuery = useInvoices(
    { search: debounced, pageSize: 5 },
    open && hasQuery && canBilling,
  );

  const isFetching =
    hasQuery &&
    ((canBilling && (clientsQuery.isFetching || invoicesQuery.isFetching)) ||
      (canPeople && employeesQuery.isFetching));

  // Static navigation + quick actions, filtered by role and matched against the query.
  const navItems = useMemo<CommandItem[]>(() => {
    const items: CommandItem[] = [];
    if (canBilling) {
      items.push({
        id: 'action-new-invoice',
        label: 'Create invoice',
        sublabel: 'New draft invoice',
        icon: <Plus size={16} strokeWidth={1.75} />,
        group: 'Actions',
        to: ROUTES.INVOICE_CREATE,
      });
    }
    NAV_SECTIONS.forEach((section) => {
      section.items.forEach((item) => {
        if (item.roles && !(role && item.roles.includes(role))) return;
        const Icon = item.icon;
        items.push({
          id: `nav-${item.path}`,
          label: item.label,
          sublabel: section.label,
          icon: <Icon size={16} strokeWidth={1.75} />,
          group: 'Go to',
          to: item.path,
        });
      });
    });
    return items;
  }, [role, canBilling]);

  const filteredNav = useMemo(() => {
    const q = debounced.toLowerCase();
    if (!q) return navItems;
    return navItems.filter(
      (i) => i.label.toLowerCase().includes(q) || i.sublabel?.toLowerCase().includes(q),
    );
  }, [navItems, debounced]);

  const entityItems = useMemo<CommandItem[]>(() => {
    if (!hasQuery) return [];
    const items: CommandItem[] = [];
    if (canBilling) {
      (clientsQuery.data?.items ?? []).forEach((c) =>
        items.push({
          id: `client-${c.id}`,
          label: c.name,
          sublabel: c.companyName || c.email,
          icon: <Users size={16} strokeWidth={1.75} />,
          group: 'Clients',
          to: ROUTES.CLIENT_DETAIL(c.id),
        }),
      );
      (invoicesQuery.data?.items ?? []).forEach((inv) =>
        items.push({
          id: `invoice-${inv.id}`,
          label: inv.invoiceNumber,
          sublabel: inv.client?.name,
          icon: <FileText size={16} strokeWidth={1.75} />,
          group: 'Invoices',
          to: ROUTES.INVOICE_DETAIL(inv.id),
        }),
      );
    }
    if (canPeople) {
      (employeesQuery.data?.items ?? []).forEach((e) =>
        items.push({
          id: `employee-${e.id}`,
          label: e.name,
          sublabel: [e.employeeCode, e.designation].filter(Boolean).join(' · '),
          icon: <IdCard size={16} strokeWidth={1.75} />,
          group: 'Employees',
          to: ROUTES.EMPLOYEE_DETAIL(e.id),
        }),
      );
    }
    return items;
  }, [hasQuery, canBilling, canPeople, clientsQuery.data, invoicesQuery.data, employeesQuery.data]);

  const allItems = useMemo(() => [...entityItems, ...filteredNav], [entityItems, filteredNav]);

  // Group items for rendering while preserving their flat index for keyboard nav.
  const groups = useMemo(() => {
    const map = new Map<string, { item: CommandItem; index: number }[]>();
    allItems.forEach((item, index) => {
      const arr = map.get(item.group) ?? [];
      arr.push({ item, index });
      map.set(item.group, arr);
    });
    return Array.from(map.entries());
  }, [allItems]);

  useEffect(() => {
    setActive(0);
  }, [debounced, allItems.length]);

  useEffect(() => {
    if (open) {
      setQuery('');
      setActive(0);
      // Focus after the portal mounts.
      const t = setTimeout(() => inputRef.current?.focus(), 30);
      return () => clearTimeout(t);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  function close() {
    setOpen(false);
  }

  function select(item: CommandItem | undefined) {
    if (!item) return;
    close();
    navigate(item.to);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') {
      e.preventDefault();
      close();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((a) => (allItems.length ? (a + 1) % allItems.length : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => (allItems.length ? (a - 1 + allItems.length) % allItems.length : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      select(allItems[active]);
    }
  }

  // Keep the active row scrolled into view.
  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(`[data-index="${active}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-95 flex items-start justify-center p-4 pt-[12vh]">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={close}
            className="absolute inset-0 bg-ink-900/40 backdrop-blur-sm"
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Search"
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            onKeyDown={onKeyDown}
            className="relative flex max-h-[70vh] w-full max-w-xl flex-col overflow-hidden rounded-xl border border-subtle bg-surface shadow-popover"
          >
            <div className="flex items-center gap-3 border-b border-subtle px-4">
              {isFetching ? (
                <Loader2 size={18} strokeWidth={1.75} className="shrink-0 animate-spin text-ink-400" />
              ) : (
                <Search size={18} strokeWidth={1.75} className="shrink-0 text-ink-400" />
              )}
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search invoices, clients, employees, pages…"
                className="h-12 w-full bg-transparent text-body text-ink-900 placeholder:text-ink-400 focus:outline-none"
              />
            </div>

            <div ref={listRef} className="flex-1 overflow-y-auto py-2">
              {allItems.length === 0 ? (
                <div className="px-4 py-10 text-center text-body-sm text-ink-400">
                  {hasQuery
                    ? isFetching
                      ? 'Searching…'
                      : `No results for “${debounced}”`
                    : 'Type to search, or jump to a page.'}
                </div>
              ) : (
                groups.map(([group, rows]) => (
                  <div key={group} className="mb-1">
                    <p className="px-4 pb-1 pt-2 text-caption font-semibold uppercase tracking-[0.07em] text-ink-200">
                      {group}
                    </p>
                    {rows.map(({ item, index }) => (
                      <button
                        key={item.id}
                        type="button"
                        data-index={index}
                        onMouseEnter={() => setActive(index)}
                        onClick={() => select(item)}
                        className={cn(
                          'flex w-full items-center gap-3 px-4 py-2 text-left transition-colors',
                          index === active ? 'bg-accent-50' : 'hover:bg-sunken',
                        )}
                      >
                        <span
                          className={cn(
                            'flex h-8 w-8 shrink-0 items-center justify-center rounded-md',
                            index === active
                              ? 'bg-accent-100 text-accent-700'
                              : 'bg-sunken text-ink-400',
                          )}
                        >
                          {item.icon}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-body-sm font-medium text-ink-900">
                            {item.label}
                          </span>
                          {item.sublabel && (
                            <span className="block truncate text-caption text-ink-400">
                              {item.sublabel}
                            </span>
                          )}
                        </span>
                      </button>
                    ))}
                  </div>
                ))
              )}
            </div>

            <div className="flex items-center gap-4 border-t border-subtle bg-canvas/40 px-4 py-2 text-caption text-ink-400">
              <span className="flex items-center gap-1">
                <ArrowUp size={12} strokeWidth={2} />
                <ArrowDown size={12} strokeWidth={2} />
                Navigate
              </span>
              <span className="flex items-center gap-1">
                <CornerDownLeft size={12} strokeWidth={2} />
                Open
              </span>
              <span className="ml-auto flex items-center gap-1">
                <kbd className="rounded border border-subtle bg-surface px-1.5 py-0.5 font-data text-[10px]">
                  Esc
                </kbd>
                Close
              </span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
