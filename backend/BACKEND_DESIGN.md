# Smart Invoice & Payroll Management Platform — Backend Design Document

**Stack:** Bun + TypeScript + MongoDB (Mongoose) + Brevo (email) + BullMQ (Redis) + JWT Auth
**Audience:** This doc is written to be handed directly to an AI coding agent (Cursor / Antigravity) to scaffold and implement the complete backend.

---

## 1. Project Overview

A multi-tenant SaaS platform where multiple **Companies (tenants)** each manage their own clients, invoices, employees, and payroll, completely isolated from each other. A single **Super Admin** (platform owner) approves/rejects new company registrations before they can use the system.

### Core Flow
1. A Company registers (`POST /api/v1/auth/register-company`) → status = `pending`.
2. Super Admin reviews pending companies in the Super Admin dashboard → approves or rejects.
3. On approval, an email is sent (via Brevo, queued via BullMQ) to the company's admin user with login instructions.
4. Approved company admin logs in → if company `onboardingCompleted = false`, frontend is redirected to a company setup wizard (`PATCH /api/v1/company/setup`) to fill business details, branding, currency, invoice numbering prefix, etc.
5. Once onboarding is complete → full dashboard access (Invoices, Clients, Employees, Payroll, Reports).
6. Within a company, the **Company Admin** can invite/create more internal users (Accountant, HR, Manager, Employee-viewer) with **role-based access control (RBAC)**.

### Tenancy Model
- **Single database, shared collections, `companyId` discriminator field** on every tenant-scoped document (simplest to build fast in a hackathon, scales fine for SMB volumes).
- Every query in every tenant-scoped controller MUST be scoped by `req.companyId` (injected by `tenantMiddleware` from the authenticated JWT). This is the single most important rule in this entire system — **never trust a body/query `companyId`, always use the one derived from the authenticated session.**
- Super Admin endpoints live under a separate namespace (`/api/v1/super-admin/*`) and a separate `SuperAdmin` collection — they are NOT part of any tenant.

---

## 2. Tech Stack & Key Libraries

| Concern | Choice |
|---|---|
| Runtime | Bun |
| Language | TypeScript (strict mode) |
| Web framework | Hono (recommended for Bun) or Express — pick Hono for speed; doc below is framework-agnostic but route signatures assume Express-style `(req, res, next)`. If using Hono, adapt to `(c)` context — controller logic is identical. |
| Database | MongoDB via Mongoose |
| Validation | Zod (schemas folder) |
| Auth | JWT (access + refresh tokens), bcrypt/argon2 for password hashing |
| Email | Brevo (Sendinblue) transactional email API |
| Queue / Jobs | BullMQ + Redis (email sending, PDF generation, payroll processing, reminders) |
| PDF generation | `@react-pdf/renderer` or `puppeteer` (HTML→PDF) rendering the saved invoice-template JSON / HTML templates from `src/templates` |
| File storage | Local `uploads/` (dev) — abstract behind a storage util so it can be swapped for S3 later |
| Logging | pino |
| Env management | dotenv, validated via Zod at boot (`src/config/env.ts`) |

---

## 3. Folder Structure

```
backend/
├── logs/
├── node_modules/
├── src/
│   ├── config/                # env validation, db connection, redis connection, brevo client init, constants
│   │   ├── env.ts
│   │   ├── db.ts
│   │   ├── redis.ts
│   │   ├── brevo.ts
│   │   └── constants.ts       # enums: roles, invoice status, payroll status, etc.
│   │
│   ├── controllers/           # business logic, one file per resource
│   │   ├── auth.controller.ts
│   │   ├── superAdmin.controller.ts
│   │   ├── company.controller.ts
│   │   ├── user.controller.ts
│   │   ├── client.controller.ts
│   │   ├── invoice.controller.ts
│   │   ├── invoiceTemplate.controller.ts
│   │   ├── department.controller.ts
│   │   ├── employee.controller.ts
│   │   ├── salaryStructure.controller.ts
│   │   ├── payroll.controller.ts
│   │   ├── salarySlip.controller.ts
│   │   └── dashboard.controller.ts
│   │
│   ├── lib/                   # third-party wrappers / SDK helper functions
│   │   ├── pdf/
│   │   │   ├── generateInvoicePdf.ts
│   │   │   └── generateSalarySlipPdf.ts
│   │   ├── email/
│   │   │   └── sendEmail.ts   # wraps Brevo client, used by workers
│   │   └── token.ts           # sign/verify JWT helpers
│   │
│   ├── middlewares/
│   │   ├── auth.middleware.ts        # verifies JWT, attaches req.user
│   │   ├── tenant.middleware.ts      # attaches req.companyId from req.user, blocks if company not approved/active
│   │   ├── rbac.middleware.ts        # requireRole(['admin','hr'])
│   │   ├── validate.middleware.ts    # generic zod-body/query/params validator
│   │   ├── error.middleware.ts       # centralized error handler
│   │   ├── notFound.middleware.ts
│   │   ├── rateLimit.middleware.ts
│   │   └── upload.middleware.ts      # multer/busboy config for logo & asset uploads
│   │
│   ├── models/                # Mongoose schemas (see Section 5)
│   │   ├── superAdmin.model.ts
│   │   ├── company.model.ts
│   │   ├── user.model.ts
│   │   ├── refreshToken.model.ts
│   │   ├── client.model.ts
│   │   ├── invoiceTemplate.model.ts
│   │   ├── invoice.model.ts
│   │   ├── counter.model.ts
│   │   ├── department.model.ts
│   │   ├── employee.model.ts
│   │   ├── salaryStructure.model.ts
│   │   ├── payroll.model.ts
│   │   ├── salarySlip.model.ts
│   │   └── auditLog.model.ts
│   │
│   ├── queues/                # BullMQ queue *definitions* (producers)
│   │   ├── email.queue.ts
│   │   ├── pdf.queue.ts
│   │   ├── payroll.queue.ts
│   │   └── reminder.queue.ts
│   │
│   ├── routers/               # express routers, mounted in index.ts
│   │   ├── auth.router.ts
│   │   ├── superAdmin.router.ts
│   │   ├── company.router.ts
│   │   ├── user.router.ts
│   │   ├── client.router.ts
│   │   ├── invoice.router.ts
│   │   ├── invoiceTemplate.router.ts
│   │   ├── department.router.ts
│   │   ├── employee.router.ts
│   │   ├── salaryStructure.router.ts
│   │   ├── payroll.router.ts
│   │   ├── salarySlip.router.ts
│   │   ├── dashboard.router.ts
│   │   └── index.ts           # combines all routers under /api/v1
│   │
│   ├── schemas/                # Zod request validation schemas, mirrors controllers
│   │   ├── auth.schema.ts
│   │   ├── company.schema.ts
│   │   ├── user.schema.ts
│   │   ├── client.schema.ts
│   │   ├── invoice.schema.ts
│   │   ├── invoiceTemplate.schema.ts
│   │   ├── employee.schema.ts
│   │   ├── payroll.schema.ts
│   │   └── salarySlip.schema.ts
│   │
│   ├── templates/              # HTML/EJS/React-PDF templates for rendering
│   │   ├── invoice/
│   │   │   ├── classic.tsx (or .ejs)
│   │   │   ├── modern.tsx
│   │   │   └── minimal.tsx
│   │   ├── salarySlip/
│   │   │   └── default.tsx
│   │   └── email/
│   │       ├── companyApproved.html
│   │       ├── companyRejected.html
│   │       ├── invoiceSent.html
│   │       ├── paymentReminder.html
│   │       └── welcomeUser.html
│   │
│   ├── types/                  # shared TS types/interfaces, express request augmentation
│   │   ├── express.d.ts        # declares req.user, req.companyId
│   │   ├── jwt.types.ts
│   │   └── invoiceTemplate.types.ts
│   │
│   ├── utils/
│   │   ├── apiResponse.ts      # standard success response shape
│   │   ├── apiError.ts         # custom error class
│   │   ├── asyncHandler.ts
│   │   ├── pagination.ts
│   │   ├── generateInvoiceNumber.ts
│   │   ├── generateSlug.ts
│   │   └── payrollCalculator.ts
│   │
│   ├── workers/                # BullMQ workers (consumers) — run as separate process or alongside server
│   │   ├── email.worker.ts
│   │   ├── pdf.worker.ts
│   │   ├── payroll.worker.ts
│   │   └── reminder.worker.ts
│   │
│   └── index.ts                # app bootstrap: connect db/redis, mount routers, start server + workers
│
├── uploads/                     # local file storage (logos, generated PDFs in dev)
├── .dockerignore
├── .env
├── .env.example
├── .gitignore
├── API_DOCUMENTATION.md         # auto-maintained list of all endpoints (generate alongside build)
├── bun.lock
├── Dockerfile
├── package.json
└── tsconfig.json
```

---

## 4. Global Conventions

### 4.1 Standard API Response Shape
```ts
// success
{ success: true, message: string, data: T, meta?: { page, limit, total, totalPages } }

// error
{ success: false, message: string, errors?: Array<{ field: string; message: string }> }
```
All controllers respond through `utils/apiResponse.ts` helpers (`sendSuccess(res, ...)`) and all thrown errors extend `utils/apiError.ts` `ApiError(statusCode, message, errors?)`, caught centrally by `error.middleware.ts`.

### 4.2 Auth Tokens
- **Access token**: JWT, 15 min expiry, payload `{ sub: userId, companyId, role, type: 'access' }`.
- **Refresh token**: opaque random string, stored hashed in `RefreshToken` collection, 30 day expiry, rotated on every use. Sent as httpOnly secure cookie (`refreshToken`) — access token returned in JSON body and also usable via `Authorization: Bearer`.
- Super Admin uses the **same** JWT mechanism but `payload.scope = 'super_admin'` and has no `companyId`.

### 4.3 RBAC Roles (enum, `config/constants.ts`)
```ts
enum CompanyRole {
  COMPANY_ADMIN = 'company_admin',  // full access within their company
  HR_MANAGER    = 'hr_manager',     // employees, departments, payroll, salary slips
  ACCOUNTANT    = 'accountant',     // invoices, clients, payroll reports (read), financial dashboard
  STAFF         = 'staff',          // limited: view own salary slips, view assigned invoices only
}

enum PlatformScope {
  SUPER_ADMIN = 'super_admin',
}
```
`rbac.middleware.ts` exposes `requireRole(...roles: CompanyRole[])`. The first user created for a company at registration is always `company_admin`.

### 4.4 Tenant Isolation Rule
`tenant.middleware.ts` runs after `auth.middleware.ts` on every non-super-admin route:
1. Reads `companyId` from the verified JWT (never from request body/params/query).
2. Loads the `Company`, verifies `status === 'approved'` and `isActive === true`; else 403 with a clear message (`Company not approved` / `Company suspended`).
3. Sets `req.companyId`.
Every Mongoose query in every controller MUST include `{ companyId: req.companyId }` in its filter. Every document creation MUST set `companyId: req.companyId`.

### 4.5 Pagination / Filtering / Sorting (applies to all list endpoints)
Query params: `page` (default 1), `limit` (default 20, max 100), `sort` (e.g. `-createdAt`), plus resource-specific filters (e.g. `status`, `clientId`, `dateFrom`, `dateTo`, `search`).
`utils/pagination.ts` exposes a helper that builds `{ skip, limit }` and a `buildMeta(total, page, limit)` function.

---

## 5. Database Models

> All tenant-scoped models include `companyId: ObjectId (ref: Company, required, indexed)` and standard `timestamps: true`. Compound indexes should pair `companyId` with the most-queried field (e.g. `{ companyId: 1, invoiceNumber: 1 }` unique).

### 5.1 `SuperAdmin`
```ts
{
  name: string,
  email: string (unique, lowercase),
  passwordHash: string,
  isActive: boolean (default true),
  lastLoginAt: Date,
}
```
Seeded once via a CLI script (`bun run seed:superadmin`), not publicly registrable.

### 5.2 `Company`
```ts
{
  companyName: string (required),
  registrationEmail: string (required, unique, lowercase),  // email used at sign-up, becomes admin user's email
  status: 'pending' | 'approved' | 'rejected' (default 'pending', indexed),
  rejectionReason: string (optional),
  reviewedBy: ObjectId (ref: SuperAdmin, optional),
  reviewedAt: Date (optional),
  isActive: boolean (default true),         // super admin can suspend an already-approved company
  onboardingCompleted: boolean (default false),

  // Filled during onboarding/setup step (all optional at registration, required to mark onboardingCompleted=true)
  legalName: string,
  industry: string,
  logoUrl: string,
  brandColor: string,          // hex, used as default for invoice designer
  address: { line1, line2, city, state, country, postalCode },
  phone: string,
  website: string,
  taxId: string,               // VAT/GST/NTN etc.
  currency: string (default 'USD'),
  fiscalYearStartMonth: number (1-12, default 1),
  invoiceSettings: {
    prefix: string (default 'INV'),
    nextNumber: number (default 1),       // mirrored/synced with Counter model
    numberPadding: number (default 4),     // INV-0001
    defaultPaymentTermsDays: number (default 14),
    defaultTemplateId: ObjectId (ref: InvoiceTemplate),
  },
  payrollSettings: {
    payDay: number (1-31, default 1),
    defaultWorkingDaysPerMonth: number (default 26),
  },
}
```

### 5.3 `User` (internal company users — admin, HR, accountant, staff)
```ts
{
  companyId: ObjectId (ref: Company, required, indexed),
  name: string (required),
  email: string (required, lowercase, unique compound with companyId),
  passwordHash: string (required),
  role: CompanyRole (required),
  isActive: boolean (default true),
  avatarUrl: string,
  employeeId: ObjectId (ref: Employee, optional),  // link if this user account corresponds to an employee
  invitedBy: ObjectId (ref: User, optional),
  lastLoginAt: Date,
}
```
Index: `{ companyId: 1, email: 1 } unique`.

### 5.4 `RefreshToken`
```ts
{
  userId: ObjectId (refPath dynamic: User or SuperAdmin),
  userType: 'user' | 'super_admin',
  tokenHash: string (required, indexed),
  expiresAt: Date (required, TTL index),
  createdByIp: string,
  revoked: boolean (default false),
  replacedByToken: string (optional),
}
```

### 5.5 `Client` (a company's customers, who they invoice)
```ts
{
  companyId: ObjectId (ref: Company, required, indexed),
  name: string (required),
  email: string,
  phone: string,
  companyNameOfClient: string,
  billingAddress: { line1, line2, city, state, country, postalCode },
  taxId: string,
  notes: string,
  isActive: boolean (default true),
  totalInvoiced: number (default 0),   // denormalized, updated on invoice create/paid for dashboard speed
  totalOutstanding: number (default 0),
}
```

### 5.6 `InvoiceTemplate` (Custom Invoice Designer — the core differentiator)
This stores a **fully serializable design**, not just a "theme name" — see Section 6 for full JSON shape.
```ts
{
  companyId: ObjectId (ref: Company, required, indexed),
  name: string (required),               // e.g. "Modern Blue", "My Branded Template"
  isDefault: boolean (default false),
  baseTheme: 'classic' | 'modern' | 'minimal' | 'bold' | 'custom' (default 'classic'),
  createdBy: ObjectId (ref: User),
  design: InvoiceDesignSchema (required, see Section 6),   // the customizable JSON blob
  thumbnailUrl: string (optional, generated preview image),
  isArchived: boolean (default false),
}
```

### 5.7 `Counter` (atomic sequence generator, per-company per-type)
```ts
{
  companyId: ObjectId (ref: Company, required),
  type: 'invoice' | 'payroll' (required),
  seq: number (default 0),
}
```
Index: `{ companyId: 1, type: 1 } unique`. Used via `findOneAndUpdate({ $inc: { seq: 1 } }, { upsert: true, new: true })` for collision-free invoice numbering even under concurrency — safer than `Company.invoiceSettings.nextNumber` alone, which is kept only as a display default/seed.

### 5.8 `Invoice`
```ts
{
  companyId: ObjectId (ref: Company, required, indexed),
  invoiceNumber: string (required),         // e.g. "INV-0001", generated from Counter + Company.invoiceSettings
  clientId: ObjectId (ref: Client, required, indexed),
  templateId: ObjectId (ref: InvoiceTemplate, required),

  status: 'draft' | 'sent' | 'paid' | 'partially_paid' | 'overdue' | 'cancelled' (default 'draft', indexed),

  issueDate: Date (required),
  dueDate: Date (required),

  items: [{
    description: string (required),
    quantity: number (required, default 1),
    unitPrice: number (required),
    taxRate: number (default 0),       // percentage
    discount: number (default 0),      // percentage or flat, see `discountType`
    discountType: 'percentage' | 'flat' (default 'percentage'),
    amount: number (required),          // computed = qty*unitPrice - discount + tax
  }],

  subTotal: number (required),
  totalTax: number (default 0),
  totalDiscount: number (default 0),
  shippingFee: number (default 0),
  grandTotal: number (required),
  amountPaid: number (default 0),
  amountDue: number (required),        // grandTotal - amountPaid, kept denormalized for fast queries/dashboard

  currency: string (default company currency),
  notes: string,
  termsAndConditions: string,

  paymentHistory: [{
    amount: number,
    paidOn: Date,
    method: 'cash' | 'bank_transfer' | 'card' | 'cheque' | 'other',
    reference: string,
    recordedBy: ObjectId (ref: User),
  }],

  shareToken: string (unique, indexed, generated when first shared — used for public read-only link /invoices/public/:shareToken),
  pdfUrl: string (set once generated/cached by pdf.worker),

  sentAt: Date,
  createdBy: ObjectId (ref: User, required),
  lastUpdatedBy: ObjectId (ref: User),
}
```
Index: `{ companyId: 1, invoiceNumber: 1 } unique`, `{ companyId: 1, status: 1 }`, `{ companyId: 1, clientId: 1 }`.

A pre-save hook or service-layer function recalculates `subTotal`, `totalTax`, `totalDiscount`, `grandTotal`, `amountDue` from `items` + `amountPaid` every time — never trust client-submitted totals.

A scheduled BullMQ repeatable job (`reminder.queue.ts`) runs daily, finds invoices with `status: 'sent'` and `dueDate < now`, flips them to `overdue`, and optionally enqueues reminder emails.

### 5.9 `Department`
```ts
{
  companyId: ObjectId (ref: Company, required, indexed),
  name: string (required),
  description: string,
  headOfDepartment: ObjectId (ref: Employee, optional),
  isActive: boolean (default true),
}
```
Index: `{ companyId: 1, name: 1 } unique`.

### 5.10 `Employee`
```ts
{
  companyId: ObjectId (ref: Company, required, indexed),
  employeeCode: string (required, unique per company, e.g. "EMP-001"),
  firstName: string (required),
  lastName: string (required),
  email: string (required),
  phone: string,
  avatarUrl: string,
  departmentId: ObjectId (ref: Department, required),
  designation: string (required),       // job title
  employmentType: 'full_time' | 'part_time' | 'contract' (default 'full_time'),
  dateOfJoining: Date (required),
  dateOfLeaving: Date (optional),
  status: 'active' | 'inactive' | 'terminated' (default 'active', indexed),
  bankDetails: {
    accountTitle: string,
    accountNumber: string,
    bankName: string,
    branchCode: string,
  },
  address: { line1, line2, city, state, country, postalCode },
  emergencyContact: { name: string, phone: string, relation: string },
  salaryStructureId: ObjectId (ref: SalaryStructure, required),
  userId: ObjectId (ref: User, optional),  // if this employee also has a login account
  createdBy: ObjectId (ref: User),
}
```
Index: `{ companyId: 1, employeeCode: 1 } unique`.

### 5.11 `SalaryStructure` (assigned per-employee; reusable templates also allowed)
```ts
{
  companyId: ObjectId (ref: Company, required, indexed),
  name: string (required),               // e.g. "Senior Engineer Band", or "Custom - John Doe"
  isTemplate: boolean (default false),   // true = reusable structure shown in a picker, false = one-off for a specific employee
  baseSalary: number (required),
  allowances: [{
    name: string (required),             // e.g. House Rent, Transport, Medical
    type: 'fixed' | 'percentage_of_base' (default 'fixed'),
    value: number (required),
    taxable: boolean (default true),
  }],
  deductions: [{
    name: string (required),             // e.g. Provident Fund, Tax, Loan Installment
    type: 'fixed' | 'percentage_of_base' (default 'fixed'),
    value: number (required),
  }],
  effectiveFrom: Date (default now),
}
```

### 5.12 `Payroll` (one document per company per pay period — a "run")
```ts
{
  companyId: ObjectId (ref: Company, required, indexed),
  period: { month: number (1-12), year: number },   // e.g. {month: 6, year: 2026}
  status: 'draft' | 'processing' | 'completed' | 'cancelled' (default 'draft', indexed),
  processedBy: ObjectId (ref: User),
  processedAt: Date,
  totalGross: number (default 0),
  totalDeductions: number (default 0),
  totalNet: number (default 0),
  employeeCount: number (default 0),
  notes: string,
}
```
Index: `{ companyId: 1, 'period.year': 1, 'period.month': 1 } unique`.

### 5.13 `SalarySlip` (one per employee per payroll run — generated from Payroll + Employee's SalaryStructure)
```ts
{
  companyId: ObjectId (ref: Company, required, indexed),
  payrollId: ObjectId (ref: Payroll, required, indexed),
  employeeId: ObjectId (ref: Employee, required, indexed),
  period: { month: number, year: number },

  baseSalary: number (required),
  allowances: [{ name: string, amount: number }],   // resolved/computed amounts, snapshot at generation time
  deductions: [{ name: string, amount: number }],
  grossSalary: number (required),     // baseSalary + sum(allowances)
  totalDeductions: number (required),
  netSalary: number (required),       // grossSalary - totalDeductions

  workingDays: number,
  presentDays: number,                // if attendance integration added later; default = workingDays for v1
  paymentStatus: 'pending' | 'paid' (default 'pending'),
  paidOn: Date,
  pdfUrl: string,
}
```
Index: `{ companyId: 1, payrollId: 1, employeeId: 1 } unique`.

### 5.14 `AuditLog` (lightweight, optional but cheap to add — tracks sensitive actions)
```ts
{
  companyId: ObjectId (ref: Company, indexed, sparse — null for super-admin actions),
  actorId: ObjectId (required),
  actorType: 'user' | 'super_admin',
  action: string (required),     // e.g. "company.approved", "invoice.deleted", "payroll.processed"
  targetType: string,
  targetId: ObjectId,
  metadata: Mixed,
  ipAddress: string,
}
```

---

## 6. Custom Invoice Designer — `InvoiceDesignSchema`

This is the JSON structure stored in `InvoiceTemplate.design`. It must be expressive enough to drive a fully dynamic renderer on both the PDF generator and the frontend live-preview.

```ts
InvoiceDesignSchema = {
  layout: {
    pageSize: 'A4' | 'Letter' (default 'A4'),
    orientation: 'portrait' | 'landscape' (default 'portrait'),
    margins: { top: number, right: number, bottom: number, left: number },   // in px/pt
    headerStyle: 'logo-left' | 'logo-right' | 'logo-center' | 'logo-top-banner',
  },

  branding: {
    logoUrl: string,
    showLogo: boolean (default true),
    primaryColor: string (hex),
    secondaryColor: string (hex),
    accentColor: string (hex),
    backgroundColor: string (hex, default '#FFFFFF'),
    textColor: string (hex, default '#111111'),
  },

  typography: {
    fontFamily: 'Inter' | 'Roboto' | 'Lato' | 'Merriweather' | 'Poppins' | 'Custom',
    customFontUrl: string (optional),
    baseFontSize: number (default 12),
    headingFontSize: number (default 22),
  },

  sections: {
    // each section can be toggled on/off, reordered (order: number), and re-labelled
    companyInfo: { visible: boolean, order: number, fields: ['name','address','email','phone','taxId','website'] },
    clientInfo:  { visible: boolean, order: number, label: string (default 'Bill To') },
    invoiceMeta: { visible: boolean, order: number, fields: ['invoiceNumber','issueDate','dueDate','poNumber'] },
    itemsTable:  {
      visible: boolean, order: number,
      columns: [{ key: 'description'|'quantity'|'unitPrice'|'taxRate'|'discount'|'amount', label: string, visible: boolean, width: string }],
      zebraStripes: boolean (default false),
      headerBackgroundColor: string,
    },
    summary:     { visible: boolean, order: number, fields: ['subTotal','discount','tax','shipping','grandTotal'] },
    notes:       { visible: boolean, order: number, label: string (default 'Notes') },
    terms:       { visible: boolean, order: number, label: string (default 'Terms & Conditions') },
    paymentInstructions: { visible: boolean, order: number, content: string },   // bank details, free text
    signature:   { visible: boolean, order: number, signatureImageUrl: string, signatoryName: string, signatoryTitle: string },
    footer:      { visible: boolean, order: number, content: string },          // e.g. "Thank you for your business"
  },

  watermark: { enabled: boolean, text: string, opacity: number },
}
```

**Designer endpoints support:**
- Live preview (server renders the design + dummy sample data to a temp PDF or returns rendered HTML for iframe preview — `POST /invoice-templates/:id/preview` or `POST /invoice-templates/preview` with an unsaved design body).
- Save-as-new vs update-existing.
- Clone existing template (`POST /invoice-templates/:id/clone`).
- Set as default (`PATCH /invoice-templates/:id/set-default`).
- Predefined `baseTheme` starter presets seeded per company on first onboarding (Classic, Modern, Minimal) which the user then customizes.

---

## 7. Company Registration → Approval → Onboarding Flow (Detailed)

**Step 1 — Public Registration**
`POST /api/v1/auth/register-company`
Body: `{ companyName, registrationEmail, password, adminName }`
- Creates `Company` (`status: 'pending'`) and `User` (`role: company_admin`, `passwordHash`) atomically (use a Mongo transaction or at least create Company first, then User with companyId).
- User cannot log in yet — login checks `Company.status === 'approved'`.
- Enqueues a confirmation email ("Your application has been received") AND notifies Super Admin (email or just relies on dashboard).

**Step 2 — Super Admin Review**
- `GET /api/v1/super-admin/companies?status=pending` — list pending applications.
- `GET /api/v1/super-admin/companies/:id` — full detail.
- `PATCH /api/v1/super-admin/companies/:id/approve` → sets `status: 'approved'`, `reviewedBy`, `reviewedAt`; enqueues "Approved — you can now log in" email.
- `PATCH /api/v1/super-admin/companies/:id/reject` body `{ reason }` → sets `status: 'rejected'`, `rejectionReason`; enqueues rejection email.
- `PATCH /api/v1/super-admin/companies/:id/suspend` / `/reactivate` — toggles `isActive` for already-approved companies (kill switch).

**Step 3 — Login**
`POST /api/v1/auth/login` body `{ email, password }`
- Look up `User` by email; verify password.
- Load `Company`; if `status !== 'approved'` → 403 `"Your company registration is still pending approval"` (or rejected/suspended specific messages).
- Issue access + refresh tokens.
- Response includes `company.onboardingCompleted` so frontend knows whether to route to setup wizard or dashboard.

**Step 4 — Company Setup / Onboarding**
`PATCH /api/v1/company/setup` (auth required, `company_admin` only) — accepts all the optional `Company` fields from Section 5.2 (legalName, address, logo upload via `POST /company/logo` multipart, currency, invoiceSettings, payrollSettings). On final submit with a `completeOnboarding: true` flag (or once all required fields are present), sets `onboardingCompleted = true`. Also seeds 2–3 default `InvoiceTemplate` presets for the company at this step.

**Step 5 — Normal Operation**
Dashboard, invoices, clients, employees, payroll all become available, all scoped to `companyId`.

---

## 8. Complete API Route List

Base path: `/api/v1`. 🔒 = requires `auth.middleware`. 🏢 = requires `tenant.middleware` (implies 🔒). Role tags shown where restricted beyond "any authenticated company user".

### 8.1 Auth (`/auth`)
| Method | Path | Access | Description |
|---|---|---|---|
| POST | `/auth/register-company` | Public | Register new company + its first admin user |
| POST | `/auth/login` | Public | Company user login |
| POST | `/auth/super-admin/login` | Public | Super admin login (separate endpoint, separate collection) |
| POST | `/auth/refresh` | Public (cookie) | Rotate refresh token, issue new access token |
| POST | `/auth/logout` | 🔒 | Revoke refresh token |
| GET | `/auth/me` | 🔒 | Current user + company summary |
| POST | `/auth/forgot-password` | Public | Send reset link email |
| POST | `/auth/reset-password` | Public | Reset password via token |
| POST | `/auth/change-password` | 🔒 | Change password while logged in |

### 8.2 Super Admin (`/super-admin`) — all require super_admin scope
| Method | Path | Description |
|---|---|---|
| GET | `/super-admin/companies` | List all companies (filters: status, isActive, search) |
| GET | `/super-admin/companies/:id` | Company detail |
| PATCH | `/super-admin/companies/:id/approve` | Approve pending company |
| PATCH | `/super-admin/companies/:id/reject` | Reject pending company |
| PATCH | `/super-admin/companies/:id/suspend` | Suspend approved company |
| PATCH | `/super-admin/companies/:id/reactivate` | Reactivate suspended company |
| GET | `/super-admin/dashboard` | Platform-wide stats: total companies, pending count, active users, total invoices issued across tenants |
| GET | `/super-admin/companies/:id/users` | List users belonging to a company |

### 8.3 Company (`/company`) — 🏢, `company_admin` for writes
| Method | Path | Description |
|---|---|---|
| GET | `/company/me` | Get own company profile |
| PATCH | `/company/setup` | Update onboarding/profile fields |
| POST | `/company/logo` | Upload logo (multipart) |
| PATCH | `/company/invoice-settings` | Update prefix/numbering/payment terms |
| PATCH | `/company/payroll-settings` | Update pay day, working days |

### 8.4 Users (`/users`) — 🏢, `company_admin` for create/update/delete/role-change
| Method | Path | Description |
|---|---|---|
| GET | `/users` | List internal users (paginated, filter by role/status) |
| POST | `/users` | Invite/create a new internal user |
| GET | `/users/:id` | Get user detail |
| PATCH | `/users/:id` | Update name/role/isActive |
| DELETE | `/users/:id` | Deactivate (soft delete) user |

### 8.5 Clients (`/clients`) — 🏢, accountant+admin write, all roles read
| Method | Path | Description |
|---|---|---|
| GET | `/clients` | List clients (search, isActive filter, pagination) |
| POST | `/clients` | Create client |
| GET | `/clients/:id` | Client detail (+ invoice summary) |
| PATCH | `/clients/:id` | Update client |
| DELETE | `/clients/:id` | Soft delete (isActive=false) — block if has unpaid invoices, or just archive |
| GET | `/clients/:id/invoices` | All invoices for this client |

### 8.6 Invoice Templates / Designer (`/invoice-templates`) — 🏢, admin/accountant write
| Method | Path | Description |
|---|---|---|
| GET | `/invoice-templates` | List all templates for company |
| POST | `/invoice-templates` | Create new template (design JSON) |
| GET | `/invoice-templates/:id` | Get one template |
| PATCH | `/invoice-templates/:id` | Update design |
| DELETE | `/invoice-templates/:id` | Archive template (block if `isDefault` or in use, require reassignment) |
| POST | `/invoice-templates/:id/clone` | Duplicate template |
| PATCH | `/invoice-templates/:id/set-default` | Mark as company default |
| POST | `/invoice-templates/preview` | Render preview (HTML or PDF) from an unsaved design + sample data |
| POST | `/invoice-templates/:id/preview` | Render preview using saved design + sample data |

### 8.7 Invoices (`/invoices`) — 🏢
| Method | Path | Description |
|---|---|---|
| GET | `/invoices` | List (filters: status, clientId, dateFrom, dateTo, search by invoiceNumber) |
| POST | `/invoices` | Create invoice (status defaults `draft`) |
| GET | `/invoices/:id` | Detail |
| PATCH | `/invoices/:id` | Update (only allowed while `draft`, or limited fields once sent) |
| DELETE | `/invoices/:id` | Delete (only if `draft`); otherwise must `cancel` |
| PATCH | `/invoices/:id/cancel` | Cancel a sent/unpaid invoice |
| PATCH | `/invoices/:id/send` | Mark as `sent`, enqueue email-to-client job, generate shareToken |
| POST | `/invoices/:id/record-payment` | Add entry to `paymentHistory`, recompute `amountPaid`/`amountDue`/status (`paid`/`partially_paid`) |
| GET | `/invoices/:id/pdf` | Stream/download generated PDF (generate on-demand if not cached, or enqueue + poll) |
| GET | `/invoices/public/:shareToken` | 🌐 Public, read-only, no auth — for client-facing share link |
| GET | `/invoices/public/:shareToken/pdf` | 🌐 Public PDF download via share link |

### 8.8 Departments (`/departments`) — 🏢, hr_manager/admin write
| Method | Path | Description |
|---|---|---|
| GET | `/departments` | List |
| POST | `/departments` | Create |
| GET | `/departments/:id` | Detail (+ employee count) |
| PATCH | `/departments/:id` | Update |
| DELETE | `/departments/:id` | Delete (block if employees assigned) |

### 8.9 Employees (`/employees`) — 🏢, hr_manager/admin write
| Method | Path | Description |
|---|---|---|
| GET | `/employees` | List (filters: departmentId, status, search) |
| POST | `/employees` | Create employee (+ assign/create SalaryStructure) |
| GET | `/employees/:id` | Detail |
| PATCH | `/employees/:id` | Update |
| DELETE | `/employees/:id` | Soft delete / mark `terminated` |
| GET | `/employees/:id/salary-slips` | Employee's salary slip history |
| POST | `/employees/:id/avatar` | Upload avatar (multipart) |

### 8.10 Salary Structures (`/salary-structures`) — 🏢, hr_manager/admin write
| Method | Path | Description |
|---|---|---|
| GET | `/salary-structures` | List (filter `isTemplate=true` for reusable bands) |
| POST | `/salary-structures` | Create |
| GET | `/salary-structures/:id` | Detail |
| PATCH | `/salary-structures/:id` | Update |
| DELETE | `/salary-structures/:id` | Delete (block if assigned to active employee) |

### 8.11 Payroll (`/payroll`) — 🏢, hr_manager/admin
| Method | Path | Description |
|---|---|---|
| GET | `/payroll` | List payroll runs (filter by year/status) |
| POST | `/payroll/process` | Body `{ month, year, employeeIds? }` — creates `Payroll` doc + a `SalarySlip` per active employee (computed via `payrollCalculator.ts`), enqueued as a BullMQ job for large companies |
| GET | `/payroll/:id` | Run detail + summary totals |
| GET | `/payroll/:id/slips` | All salary slips in this run |
| PATCH | `/payroll/:id/finalize` | Lock the run (`status: completed`), prevents further edits to its slips |
| DELETE | `/payroll/:id` | Delete a `draft` run only |
| GET | `/payroll/reports/summary` | Aggregated payroll expense over time (for dashboard/reports) |

### 8.12 Salary Slips (`/salary-slips`) — 🏢
| Method | Path | Description |
|---|---|---|
| GET | `/salary-slips` | List (filter employeeId, period, paymentStatus) — `staff` role only sees own |
| GET | `/salary-slips/:id` | Detail |
| PATCH | `/salary-slips/:id/mark-paid` | Set `paymentStatus: paid`, `paidOn` |
| GET | `/salary-slips/:id/pdf` | Download PDF |

### 8.13 Dashboard / Reports (`/dashboard`) — 🏢
| Method | Path | Description |
|---|---|---|
| GET | `/dashboard/overview` | Revenue, outstanding, invoice counts by status, payroll expense this month, employee count — one aggregated call for the landing dashboard |
| GET | `/dashboard/revenue-trend` | Monthly revenue over last N months (paid invoices) |
| GET | `/dashboard/invoice-status-breakdown` | Count/amount grouped by status |
| GET | `/dashboard/payroll-trend` | Monthly payroll expense over last N months |
| GET | `/dashboard/outstanding-clients` | Top clients by outstanding amount |

---

## 9. BullMQ Queues & Workers

| Queue | Jobs | Triggered by |
|---|---|---|
| `email` | `sendCompanyApprovedEmail`, `sendCompanyRejectedEmail`, `sendInvoiceToClient`, `sendPaymentReminder`, `sendUserInvite`, `sendPasswordReset` | Controllers enqueue; `email.worker.ts` consumes and calls `lib/email/sendEmail.ts` (Brevo) |
| `pdf` | `generateInvoicePdf`, `generateSalarySlipPdf` | Controllers enqueue on `send`/`finalize`; worker renders via `lib/pdf/*`, uploads to `uploads/`, writes `pdfUrl` back to the document |
| `payroll` | `processPayrollRun` | `/payroll/process` enqueues if `employeeCount > N` (e.g. >50) to avoid blocking the request; otherwise processed synchronously for small companies |
| `reminder` | repeatable daily cron `checkOverdueInvoices`, `sendDueSoonReminders` | Registered at boot in `index.ts` via `queue.add(..., { repeat: { pattern: '0 6 * * *' } })` |

All queues configured with `attempts: 3`, exponential backoff, and a dead-letter log via `failed` event listener writing to `logs/`.

---

## 10. Environment Variables (`.env.example`)

```
NODE_ENV=development
PORT=8000
APP_BASE_URL=http://localhost:8000
CLIENT_BASE_URL=http://localhost:5173

MONGODB_URI=mongodb://localhost:27017/invoice-payroll-platform

REDIS_URL=redis://localhost:6379

JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=30d

BREVO_API_KEY=
BREVO_SENDER_EMAIL=noreply@yourapp.com
BREVO_SENDER_NAME=Invoice & Payroll Platform

SUPERADMIN_SEED_EMAIL=
SUPERADMIN_SEED_PASSWORD=

UPLOADS_DIR=./uploads
MAX_UPLOAD_SIZE_MB=5

COOKIE_SECRET=
```
`config/env.ts` validates all of these with a Zod schema at boot and throws (process.exit) on failure.

---

## 11. Error Handling Conventions

- All async controllers wrapped in `utils/asyncHandler.ts` so thrown errors reach `error.middleware.ts` (no repeated try/catch).
- `ApiError` subtypes for common cases: `400 BadRequest`, `401 Unauthorized`, `403 Forbidden`, `404 NotFound`, `409 Conflict`.
- Mongoose validation errors and Zod validation errors both normalized into the `errors: [{field, message}]` array shape in the standard error response.
- 404 fallback middleware for unmatched routes.

---

## 12. Security Checklist
- Passwords hashed with bcrypt (cost 12) or argon2.
- Helmet for HTTP headers, CORS locked to `CLIENT_BASE_URL`.
- Rate limiting on `/auth/login`, `/auth/register-company`, `/auth/forgot-password`.
- All tenant queries filtered by `req.companyId` — add an automated test/lint rule reminding of this.
- File upload validation: mime-type whitelist (png/jpg/svg for logos), size limit, stored with randomized filenames.
- Public share-link routes (`/invoices/public/:shareToken`) must be read-only and never leak other tenants' data — `shareToken` lookups must not require/accept a `companyId` param from the client.
- Helmet + sanitize Mongo query inputs to prevent NoSQL injection (`express-mongo-sanitize` or equivalent).

---

## 13. Suggested Build Order (for the AI coding agent)
1. `config/`, `types/express.d.ts`, `utils/apiResponse.ts`, `utils/apiError.ts`, `utils/asyncHandler.ts`
2. `models/` — all schemas from Section 5
3. Auth: `superAdmin`, `company`, `user` registration/login + `auth.middleware`, `tenant.middleware`, `rbac.middleware`
4. Super Admin approval flow end-to-end (with email queue stubbed first, real Brevo wired after)
5. Company setup/onboarding endpoints
6. Clients CRUD
7. Invoice Templates (designer) CRUD + preview rendering
8. Invoices CRUD + send + record-payment + PDF generation + public share link
9. Departments, Employees, Salary Structures
10. Payroll processing + Salary Slips + PDF generation
11. Dashboard aggregation endpoints
12. BullMQ workers wired for real (email via Brevo, PDF rendering, daily overdue-check cron)
13. Polish: rate limiting, audit log writes on sensitive actions, `API_DOCUMENTATION.md` generation

---

*End of backend design document.*
