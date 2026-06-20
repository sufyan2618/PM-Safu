# API Documentation — Smart Invoice & Payroll Management Platform

**Base URL:** `/api/v1`
**Auth:** `Authorization: Bearer <accessToken>` (access token in JSON body on login; refresh token in `httpOnly` cookie).

Legend: 🔓 Public · 🔒 Authenticated · 🏢 Company-scoped (auth + approved+active tenant) · 👑 Super admin

Standard response shapes:

```jsonc
// success
{ "success": true, "message": "string", "data": { }, "meta": { "page": 1, "limit": 20, "total": 0, "totalPages": 0 } }
// error
{ "success": false, "message": "string", "errors": [{ "field": "name", "message": "Required" }] }
```

List endpoints accept: `page` (default 1), `limit` (default 20, max 100), `sort` (e.g. `-createdAt`), `search`, plus resource filters.

---

## Auth — `/auth`

| Method | Path | Access | Description |
|---|---|---|---|
| POST | `/auth/register-company` | 🔓 | Register a company + first admin user (status `pending`). Body: `{ companyName, registrationEmail, password, adminName }` |
| POST | `/auth/login` | 🔓 | Company user login. Body: `{ email, password }` |
| POST | `/auth/super-admin/login` | 🔓 | Super admin login. Body: `{ email, password }` |
| POST | `/auth/refresh` | 🔓 (cookie) | Rotate refresh token, issue new access token |
| POST | `/auth/logout` | 🔓 | Revoke current refresh token |
| GET | `/auth/me` | 🔒 | Current user/super-admin + company summary |
| POST | `/auth/forgot-password` | 🔓 | Send reset link email. Body: `{ email }` |
| POST | `/auth/reset-password` | 🔓 | Body: `{ token, email, newPassword }` |
| POST | `/auth/change-password` | 🔒 | Body: `{ currentPassword, newPassword }` |

## Super Admin — `/super-admin` 👑

| Method | Path | Description |
|---|---|---|
| GET | `/super-admin/dashboard` | Platform-wide stats |
| GET | `/super-admin/companies` | List companies. Filters: `status`, `isActive`, `search` |
| GET | `/super-admin/companies/:id` | Company detail + user count |
| GET | `/super-admin/companies/:id/users` | Users of a company |
| PATCH | `/super-admin/companies/:id/approve` | Approve pending company (emails admin) |
| PATCH | `/super-admin/companies/:id/reject` | Reject. Body: `{ reason }` |
| PATCH | `/super-admin/companies/:id/suspend` | Suspend approved company |
| PATCH | `/super-admin/companies/:id/reactivate` | Reactivate suspended company |

## Company — `/company` 🏢

| Method | Path | Role | Description |
|---|---|---|---|
| GET | `/company/me` | any | Own company profile |
| PATCH | `/company/setup` | admin | Onboarding/profile fields. `{ ..., completeOnboarding: true }` seeds default templates |
| POST | `/company/logo` | admin | Upload logo (multipart field `logo`) |
| PATCH | `/company/invoice-settings` | admin | Prefix/numbering/payment terms |
| PATCH | `/company/payroll-settings` | admin | Pay day, working days |

## Users — `/users` 🏢

| Method | Path | Role | Description |
|---|---|---|---|
| GET | `/users` | any | List internal users. Filters: `role`, `isActive` |
| POST | `/users` | admin | Invite/create user (emails a temp password). Body: `{ name, email, role, password? }` |
| GET | `/users/:id` | any | User detail |
| PATCH | `/users/:id` | admin | Update name/role/isActive |
| DELETE | `/users/:id` | admin | Deactivate (soft delete) |

## Clients — `/clients` 🏢 (admin/accountant write)

| Method | Path | Description |
|---|---|---|
| GET | `/clients` | List. Filters: `isActive`, `search` |
| POST | `/clients` | Create client |
| GET | `/clients/:id` | Detail + invoice status summary |
| GET | `/clients/:id/invoices` | Client's invoices (paginated) |
| PATCH | `/clients/:id` | Update |
| DELETE | `/clients/:id` | Archive (blocked if unpaid invoices exist) |

## Invoice Templates / Designer — `/invoice-templates` 🏢 (admin/accountant write)

| Method | Path | Description |
|---|---|---|
| GET | `/invoice-templates` | List active templates |
| POST | `/invoice-templates` | Create. Body: `{ name, baseTheme?, isDefault?, design }` |
| POST | `/invoice-templates/preview` | Render preview from unsaved `{ design }`. `?format=html|pdf` (default html) |
| GET | `/invoice-templates/:id` | Get one |
| PATCH | `/invoice-templates/:id` | Update name/design/baseTheme |
| DELETE | `/invoice-templates/:id` | Archive (blocked if default or in use) |
| POST | `/invoice-templates/:id/clone` | Duplicate. Body: `{ name? }` |
| PATCH | `/invoice-templates/:id/set-default` | Set company default |
| POST | `/invoice-templates/:id/preview` | Render preview from saved design. `?format=html|pdf` |

The `design` JSON follows `InvoiceDesignSchema` (layout, branding, typography, sections, watermark) — see `BACKEND_DESIGN.md` §6.

## Invoices — `/invoices` 🏢

| Method | Path | Access | Description |
|---|---|---|---|
| GET | `/invoices/public/:shareToken` | 🔓 | Read-only public invoice (share link) |
| GET | `/invoices/public/:shareToken/pdf` | 🔓 | Public PDF download |
| GET | `/invoices` | 🏢 | List. Filters: `status`, `clientId`, `dateFrom`, `dateTo`, `search` |
| POST | `/invoices` | 🏢 write | Create draft. Body: `{ clientId, templateId?, items[], issueDate?, dueDate?, shippingFee?, currency?, notes?, termsAndConditions?, poNumber? }` |
| GET | `/invoices/:id` | 🏢 | Detail |
| GET | `/invoices/:id/pdf` | 🏢 | Download generated PDF (on-demand) |
| PATCH | `/invoices/:id` | 🏢 write | Update (full while `draft`, limited once sent) |
| DELETE | `/invoices/:id` | 🏢 write | Delete (draft only) |
| PATCH | `/invoices/:id/cancel` | 🏢 write | Cancel a sent/unpaid invoice |
| PATCH | `/invoices/:id/send` | 🏢 write | Mark sent, generate shareToken, queue email + PDF |
| POST | `/invoices/:id/record-payment` | 🏢 write | Body: `{ amount, paidOn?, method?, reference? }` |

Totals (`subTotal`, `totalTax`, `totalDiscount`, `grandTotal`, `amountDue`) are always recomputed server-side from `items`.

## Departments — `/departments` 🏢 (admin/hr write)

| Method | Path | Description |
|---|---|---|
| GET | `/departments` | List (+ employee counts) |
| POST | `/departments` | Create. Body: `{ name, description?, headOfDepartment? }` |
| GET | `/departments/:id` | Detail (+ employee count) |
| PATCH | `/departments/:id` | Update |
| DELETE | `/departments/:id` | Delete (blocked if active employees) |

## Employees — `/employees` 🏢 (admin/hr write)

| Method | Path | Description |
|---|---|---|
| GET | `/employees` | List. Filters: `departmentId`, `status`, `search` |
| POST | `/employees` | Create. Provide `salaryStructureId` OR inline `salaryStructure`. `employeeCode` auto-generated if omitted |
| GET | `/employees/:id` | Detail (department + salary structure populated) |
| GET | `/employees/:id/salary-slips` | Slip history |
| PATCH | `/employees/:id` | Update |
| DELETE | `/employees/:id` | Mark terminated (soft) |
| POST | `/employees/:id/avatar` | Upload avatar (multipart field `avatar`) |

## Salary Structures — `/salary-structures` 🏢 (admin/hr write)

| Method | Path | Description |
|---|---|---|
| GET | `/salary-structures` | List. Filter: `isTemplate` |
| POST | `/salary-structures` | Create. Body: `{ name, isTemplate?, baseSalary, allowances[], deductions[], effectiveFrom? }` |
| GET | `/salary-structures/:id` | Detail |
| PATCH | `/salary-structures/:id` | Update |
| DELETE | `/salary-structures/:id` | Delete (blocked if assigned to active employee) |

## Payroll — `/payroll` 🏢 (admin/hr)

| Method | Path | Description |
|---|---|---|
| GET | `/payroll` | List runs. Filters: `year`, `status` |
| GET | `/payroll/reports/summary` | Aggregated payroll expense over time |
| POST | `/payroll/process` | Body: `{ month, year, employeeIds?, notes? }`. Generates a run + a slip per active employee (queued if employees > threshold) |
| GET | `/payroll/:id` | Run detail + totals |
| GET | `/payroll/:id/slips` | Slips in this run |
| PATCH | `/payroll/:id/finalize` | Lock run (`status: completed`) |
| DELETE | `/payroll/:id` | Delete a non-finalized run + its slips |

## Salary Slips — `/salary-slips` 🏢

| Method | Path | Description |
|---|---|---|
| GET | `/salary-slips` | List. Filters: `employeeId`, `payrollId`, `month`, `year`, `paymentStatus`. `staff` see only their own |
| GET | `/salary-slips/:id` | Detail |
| GET | `/salary-slips/:id/pdf` | Download PDF |
| PATCH | `/salary-slips/:id/mark-paid` | admin/hr. Body: `{ paidOn? }` |

## Dashboard / Reports — `/dashboard` 🏢

| Method | Path | Description |
|---|---|---|
| GET | `/dashboard/overview` | Revenue, outstanding, invoice counts, payroll expense, active employees |
| GET | `/dashboard/revenue-trend` | `?months=N` — monthly paid-invoice revenue |
| GET | `/dashboard/invoice-status-breakdown` | Counts/amounts by status |
| GET | `/dashboard/payroll-trend` | `?months=N` — monthly payroll expense |
| GET | `/dashboard/outstanding-clients` | `?limit=N` — top clients by outstanding |

## System

| Method | Path | Description |
|---|---|---|
| GET | `/api/v1/health` | Health check |
| GET | `/api/docs` | Swagger UI |
| GET | `/uploads/*` | Static uploaded assets (logos, avatars, PDFs) |

---

## Roles (RBAC)

- `company_admin` — full access within the company
- `hr_manager` — employees, departments, salary structures, payroll, salary slips
- `accountant` — invoices, clients, invoice templates, financial dashboard
- `staff` — view own salary slips

## Background Jobs (BullMQ + Redis)

- **email** — company received/approved/rejected, user invite, password reset, invoice to client, payment reminder
- **pdf** — invoice + salary slip generation (writes `pdfUrl`)
- **payroll** — async processing of large payroll runs
- **reminder** — daily cron: mark overdue invoices (06:00), send due-soon reminders (07:00)

Run the worker process with `bun run dev:worker` (dev) or `bun run start:worker` (prod).
