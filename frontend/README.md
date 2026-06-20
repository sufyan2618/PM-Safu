# Ledger — Invoice & Payroll Frontend

Production-grade React + TypeScript frontend for the Smart Invoice & Payroll Management Platform.
Built around **"The Ledger"** design language: tabular monospace numerals, hairline accent rules,
outlined status pills, and one deliberate emerald accent across light and dark themes.

## Tech stack

| Layer | Choice |
|---|---|
| Framework | React 19 + Vite |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS v4 (CSS-first `@theme` tokens) |
| Routing | React Router |
| Client state | Zustand (`persist` + `immer`) |
| Server state | TanStack Query over an Axios client |
| Forms | React Hook Form + Zod |
| Charts | Recharts |
| Icons | Lucide React |
| Animation | Framer Motion |
| Dates | date-fns |

## Getting started

```bash
pnpm install
cp .env.example .env
pnpm dev
```

The app runs at `http://localhost:5173`.

### Mock mode

The backend is still in development, so the app ships with a rich mock data layer.
Toggle it with `VITE_USE_MOCKS` in `.env`:

- `VITE_USE_MOCKS=true` (default) — every screen renders from bundled mock data.
- `VITE_USE_MOCKS=false` — services call the real API at `VITE_API_URL`.

Demo login is pre-filled on the sign-in screen (any password works in mock mode).

## Scripts

```bash
pnpm dev        # start dev server
pnpm build      # type-check + production build
pnpm preview    # preview the production build
pnpm lint       # run eslint
```

## Architecture

```
src/
├── api/            # axios client, endpoints, services + mock layer, query client
├── components/
│   ├── ui/         # theme-aware design-system primitives (Button, Table, Modal…)
│   ├── layout/     # AppShell, Sidebar, Topbar, PageHeader
│   └── domain/     # feature components (invoices, employees, payroll, dashboard…)
├── constants/      # routes, navigation, roles, status maps, zod schemas
├── hooks/          # generic hooks + React Query data hooks (hooks/queries)
├── pages/          # one folder per feature area
├── routes/         # AppRouter, ProtectedRoute, RoleGuard
├── store/          # Zustand stores (auth, theme, ui, drafts, wizard)
├── styles/         # globals.css — design tokens + Tailwind theme
├── types/          # shared domain types
└── utils/          # cn, formatCurrency, formatDate, exportCsv
```

### Design tokens

All colors are CSS variables defined on `:root` / `.dark` in `styles/globals.css` and mapped into
Tailwind utilities via `@theme`. Components never hardcode hex values — they use token classes
(`bg-surface`, `text-ink-900`, `border-subtle`, `bg-accent-600`, …) so dark mode is automatic.

Currency, IDs and dates render in `font-data` (IBM Plex Mono, tabular figures) for the ledger feel.
