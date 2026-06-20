# API Documentation — Smart Invoice & Payroll Management Platform

**Base URL:** `http://localhost:8000/api/v1`
**Content-Type:** `application/json` (except multipart uploads and binary PDF responses)

Legend: 🔓 Public · 🔒 Authenticated · 🏢 Company-scoped (auth + approved & active tenant) · 👑 Super admin

---

## 1. Conventions

### 1.1 Response envelope

Every JSON response uses one of these shapes:

```ts
// Success
interface SuccessResponse<T> {
  success: true;
  message: string;
  data?: T;
  meta?: { page: number; limit: number; total: number; totalPages: number }; // list endpoints only
}

// Error
interface ErrorResponse {
  success: false;
  message: string;
  errors?: { field: string; message: string }[]; // present for validation/conflict errors
}
```

### 1.2 Authentication

- **Login** returns an `accessToken` (JWT, 15 min) in the JSON body. Send it on protected routes:
  `Authorization: Bearer <accessToken>`
- A **refresh token** is set as an `httpOnly` cookie (`refreshToken`, 30 days). Call `POST /auth/refresh` to get a new access token. Always send requests with credentials (`fetch(..., { credentials: "include" })` / `axios` `withCredentials: true`) so the cookie flows.
- Super admins use the same mechanism but their token carries `scope: "super_admin"` and no `companyId`.

### 1.3 Status codes

`200` OK · `201` Created · `400` Validation/bad request · `401` Unauthenticated · `403` Forbidden (wrong role / pending / suspended company) · `404` Not found · `409` Conflict (duplicates, blocked deletes) · `429` Rate limited · `500` Server error.

### 1.4 Pagination, sorting, filtering (all list endpoints)

Query params: `page` (default `1`), `limit` (default `20`, max `100`), `sort` (e.g. `-createdAt`, `name`, comma-separated), `search` (where supported), plus resource-specific filters. Paginated responses include `meta`.

---

## 2. Enums

```ts
type CompanyRole   = "company_admin" | "hr_manager" | "accountant" | "staff";
type CompanyStatus = "pending" | "approved" | "rejected";
type InvoiceStatus = "draft" | "sent" | "paid" | "partially_paid" | "overdue" | "cancelled";
type PaymentMethod = "cash" | "bank_transfer" | "card" | "cheque" | "other";
type PayrollStatus = "draft" | "processing" | "completed" | "cancelled";
type PaymentStatus = "pending" | "paid";          // salary slip payment
type EmployeeStatus = "active" | "inactive" | "terminated";
type EmploymentType = "full_time" | "part_time" | "contract";
type BaseTheme     = "classic" | "modern" | "minimal" | "bold" | "custom";
type DiscountType  = "percentage" | "flat";
type ComponentType = "fixed" | "percentage_of_base";
```

---

## 3. Entities (response object shapes)

> All entities include `_id: string`, `createdAt: string (ISO)`, `updatedAt: string (ISO)`. Dates are ISO 8601 strings. ObjectId references are strings (or populated objects where noted).

```ts
interface Address {
  line1?: string; line2?: string; city?: string;
  state?: string; country?: string; postalCode?: string;
}

interface CompanySummary {            // returned by auth endpoints
  id: string;
  companyName: string;
  status: CompanyStatus;
  isActive: boolean;
  onboardingCompleted: boolean;
  currency: string;
  logoUrl?: string;
}

interface Company {                   // full document (GET /company/me, super-admin)
  _id: string;
  companyName: string;
  registrationEmail: string;
  status: CompanyStatus;
  rejectionReason?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  isActive: boolean;
  onboardingCompleted: boolean;
  legalName?: string;
  industry?: string;
  logoUrl?: string;
  brandColor?: string;                // hex
  address?: Address;
  phone?: string;
  website?: string;
  taxId?: string;
  currency: string;                   // default "USD"
  fiscalYearStartMonth: number;       // 1-12
  invoiceSettings: {
    prefix: string;                   // "INV"
    nextNumber: number;
    numberPadding: number;            // 4 -> INV-0001
    defaultPaymentTermsDays: number;
    defaultTemplateId?: string;
  };
  payrollSettings: { payDay: number; defaultWorkingDaysPerMonth: number };
  createdAt: string; updatedAt: string;
}

interface User {                      // passwordHash is never returned
  _id: string;
  companyId: string;
  name: string;
  email: string;
  role: CompanyRole;
  isActive: boolean;
  avatarUrl?: string;
  employeeId?: string;
  invitedBy?: string;
  lastLoginAt?: string;
  createdAt: string; updatedAt: string;
}

interface AuthUser {                  // sanitized user from /auth/login & /auth/me
  id: string; companyId: string; name: string; email: string;
  role: CompanyRole; isActive: boolean; avatarUrl?: string; lastLoginAt?: string;
}

interface Client {
  _id: string; companyId: string;
  name: string; email?: string; phone?: string; companyNameOfClient?: string;
  billingAddress?: Address; taxId?: string; notes?: string;
  isActive: boolean;
  totalInvoiced: number;              // denormalized
  totalOutstanding: number;
  createdAt: string; updatedAt: string;
}

interface InvoiceItem {
  description: string; quantity: number; unitPrice: number;
  taxRate: number; discount: number; discountType: DiscountType;
  amount: number;                     // computed server-side
}

interface PaymentEntry {
  amount: number; paidOn: string; method: PaymentMethod;
  reference?: string; recordedBy?: string;
}

interface Invoice {
  _id: string; companyId: string;
  invoiceNumber: string;             // "INV-0001"
  clientId: string | Client;         // populated on detail/list
  templateId: string;
  status: InvoiceStatus;
  issueDate: string; dueDate: string;
  items: InvoiceItem[];
  subTotal: number; totalTax: number; totalDiscount: number;
  shippingFee: number; grandTotal: number;
  amountPaid: number; amountDue: number;
  currency: string;
  notes?: string; termsAndConditions?: string; poNumber?: string;
  paymentHistory: PaymentEntry[];
  shareToken?: string;               // set on first send
  pdfUrl?: string;                   // set by pdf worker
  sentAt?: string;
  createdBy: string; lastUpdatedBy?: string;
  createdAt: string; updatedAt: string;
}

interface InvoiceDesign {            // see §9 for the full nested shape
  layout: object; branding: object; typography: object; sections: object; watermark: object;
}

interface InvoiceTemplate {
  _id: string; companyId: string;
  name: string; isDefault: boolean; baseTheme: BaseTheme;
  createdBy?: string; design: InvoiceDesign;
  thumbnailUrl?: string; isArchived: boolean;
  createdAt: string; updatedAt: string;
}

interface Department {
  _id: string; companyId: string;
  name: string; description?: string;
  headOfDepartment?: string | { _id: string; firstName: string; lastName: string };
  isActive: boolean;
  employeeCount?: number;            // added on list & detail
  createdAt: string; updatedAt: string;
}

interface SalaryComponent {
  name: string; type: ComponentType; value: number; taxable?: boolean;
}

interface SalaryStructure {
  _id: string; companyId: string;
  name: string; isTemplate: boolean; baseSalary: number;
  allowances: SalaryComponent[];
  deductions: SalaryComponent[];
  effectiveFrom: string;
  createdAt: string; updatedAt: string;
}

interface Employee {
  _id: string; companyId: string;
  employeeCode: string;             // "EMP-001"
  firstName: string; lastName: string; email: string; phone?: string;
  avatarUrl?: string;
  departmentId: string | { _id: string; name: string };
  designation: string;
  employmentType: EmploymentType;
  dateOfJoining: string; dateOfLeaving?: string;
  status: EmployeeStatus;
  bankDetails?: { accountTitle?: string; accountNumber?: string; bankName?: string; branchCode?: string };
  address?: Address;
  emergencyContact?: { name?: string; phone?: string; relation?: string };
  salaryStructureId: string | SalaryStructure;
  userId?: string; createdBy?: string;
  createdAt: string; updatedAt: string;
}

interface Payroll {
  _id: string; companyId: string;
  period: { month: number; year: number };
  status: PayrollStatus;
  processedBy?: string; processedAt?: string;
  totalGross: number; totalDeductions: number; totalNet: number;
  employeeCount: number; notes?: string;
  createdAt: string; updatedAt: string;
}

interface SalarySlip {
  _id: string; companyId: string; payrollId: string;
  employeeId: string | { _id: string; firstName: string; lastName: string; employeeCode: string; designation: string };
  period: { month: number; year: number };
  baseSalary: number;
  allowances: { name: string; amount: number }[];
  deductions: { name: string; amount: number }[];
  grossSalary: number; totalDeductions: number; netSalary: number;
  workingDays: number; presentDays: number;
  paymentStatus: PaymentStatus; paidOn?: string; pdfUrl?: string;
  createdAt: string; updatedAt: string;
}
```

---

## 4. Auth — `/auth`

### POST `/auth/register-company` 🔓
Rate limited.
```ts
// Request body
{ companyName: string; registrationEmail: string; password: string /* min 8 */; adminName: string }
// 201 Response
{ success: true; message: string; data: CompanySummary }
// 409 if registrationEmail already used
```

### POST `/auth/login` 🔓
Rate limited. Sets `refreshToken` cookie.
```ts
// Request body
{ email: string; password: string }
// 200 Response
{ success: true; message: "Login successful";
  data: { accessToken: string; user: AuthUser; company: CompanySummary } }
// 401 invalid credentials · 403 company pending/rejected/suspended or user deactivated
```

### POST `/auth/super-admin/login` 🔓
```ts
// Request body
{ email: string; password: string }
// 200 Response
{ success: true; data: { accessToken: string; superAdmin: { id: string; name: string; email: string } } }
```

### POST `/auth/refresh` 🔓 (cookie)
No body. Reads `refreshToken` cookie, rotates it, returns a new access token.
```ts
// 200 Response
{ success: true; message: "Token refreshed"; data: { accessToken: string } }
// 401 if cookie missing/expired/revoked
```

### POST `/auth/logout` 🔓
No body. Revokes the refresh token and clears the cookie.
```ts
{ success: true; message: "Logged out successfully" }
```

### GET `/auth/me` 🔒
```ts
// 200 Response — company user
{ success: true; data: { type: "user"; user: AuthUser; company: CompanySummary } }
// 200 Response — super admin
{ success: true; data: { type: "super_admin"; superAdmin: { id: string; name: string; email: string } } }
```

### POST `/auth/forgot-password` 🔓
Always returns success (does not reveal whether the email exists). Emails a reset link.
```ts
{ email: string }
// 200
{ success: true; message: string }
```

### POST `/auth/reset-password` 🔓
```ts
{ token: string; email: string; newPassword: string /* min 8 */ }
// 200 { success: true; message: "Password reset successful. Please log in." }
// 400 invalid/expired token
```

### POST `/auth/change-password` 🔒 (company users)
```ts
{ currentPassword: string; newPassword: string /* min 8 */ }
// 200 { success: true; message: "Password changed successfully" }
// 400 wrong current password
```

---

## 5. Super Admin — `/super-admin` 👑
All routes require a super-admin access token.

### GET `/super-admin/dashboard`
```ts
{ success: true; data: {
  totalCompanies: number; pendingCompanies: number; approvedCompanies: number;
  activeUsers: number; totalInvoices: number; totalRevenueProcessed: number;
} }
```

### GET `/super-admin/companies`
Query: `page`, `limit`, `sort`, `search`, `status?: CompanyStatus`, `isActive?: "true"|"false"`.
```ts
{ success: true; data: Company[]; meta: {...} }
```

### GET `/super-admin/companies/:id`
```ts
{ success: true; data: { company: Company; userCount: number } }
```

### GET `/super-admin/companies/:id/users`
```ts
{ success: true; data: User[] }
```

### PATCH `/super-admin/companies/:id/approve`
No body. Queues approval email.
```ts
{ success: true; message: "Company approved"; data: Company }
```

### PATCH `/super-admin/companies/:id/reject`
```ts
{ reason: string /* min 3 */ }
// 200 { success: true; message: "Company rejected"; data: Company }
```

### PATCH `/super-admin/companies/:id/suspend`  ·  PATCH `/super-admin/companies/:id/reactivate`
No body.
```ts
{ success: true; message: string; data: Company }
```

---

## 6. Company — `/company` 🏢

### GET `/company/me`  (any role)
```ts
{ success: true; data: Company }
```

### PATCH `/company/setup`  (company_admin)
Setting `completeOnboarding: true` requires `legalName`, `address.city`, `address.country`, `currency`; it flips `onboardingCompleted` and seeds default invoice templates.
```ts
// Request body (all optional)
{
  legalName?: string; industry?: string; brandColor?: string /* hex */;
  address?: Address; phone?: string; website?: string /* URL or "" */;
  taxId?: string; currency?: string /* 3 letters */;
  fiscalYearStartMonth?: number /* 1-12 */;
  completeOnboarding?: boolean;
}
// 200 { success: true; message: "Company updated"; data: Company }
```

### POST `/company/logo`  (company_admin) — multipart
Field name: `logo`. Allowed: png/jpg/jpeg/svg/webp, ≤ 5 MB.
```ts
{ success: true; message: "Logo uploaded"; data: { logoUrl: string } }
```

### PATCH `/company/invoice-settings`  (company_admin)
```ts
{ prefix?: string; nextNumber?: number; numberPadding?: number;
  defaultPaymentTermsDays?: number; defaultTemplateId?: string }
// 200 { success: true; message: "Invoice settings updated"; data: Company["invoiceSettings"] }
```

### PATCH `/company/payroll-settings`  (company_admin)
```ts
{ payDay?: number /* 1-31 */; defaultWorkingDaysPerMonth?: number /* 1-31 */ }
// 200 { success: true; message: "Payroll settings updated"; data: Company["payrollSettings"] }
```

---

## 7. Users — `/users` 🏢
Writes require `company_admin`.

### GET `/users`
Query: `page`, `limit`, `sort`, `search`, `role?: CompanyRole`, `isActive?: "true"|"false"`.
```ts
{ success: true; data: User[]; meta: {...} }
```

### POST `/users`  (company_admin)
If `password` is omitted, a temporary one is generated and emailed to the user.
```ts
{ name: string; email: string; role: CompanyRole; password?: string /* min 8 */ }
// 201 { success: true; message: "User invited"; data: User }
// 409 email already exists in company
```

### GET `/users/:id`
```ts
{ success: true; data: User }
```

### PATCH `/users/:id`  (company_admin)
Cannot change your own role or deactivate yourself.
```ts
{ name?: string; role?: CompanyRole; isActive?: boolean }
// 200 { success: true; message: "User updated"; data: User }
```

### DELETE `/users/:id`  (company_admin)
Soft delete (`isActive: false`). Cannot deactivate yourself.
```ts
{ success: true; message: "User deactivated" }
```

---

## 8. Clients — `/clients` 🏢
Writes require `company_admin` or `accountant`.

### GET `/clients`
Query: `page`, `limit`, `sort`, `search`, `isActive?: "true"|"false"`.
```ts
{ success: true; data: Client[]; meta: {...} }
```

### POST `/clients`  (admin/accountant)
```ts
{ name: string; email?: string; phone?: string; companyNameOfClient?: string;
  billingAddress?: Address; taxId?: string; notes?: string }
// 201 { success: true; message: "Client created"; data: Client }
```

### GET `/clients/:id`
```ts
{ success: true; data: {
  client: Client;
  invoiceSummary: { _id: InvoiceStatus; count: number; amount: number }[];
} }
```

### GET `/clients/:id/invoices`
Query: pagination.
```ts
{ success: true; data: Invoice[]; meta: {...} }
```

### PATCH `/clients/:id`  (admin/accountant)
```ts
{ name?: string; email?: string; phone?: string; companyNameOfClient?: string;
  billingAddress?: Address; taxId?: string; notes?: string; isActive?: boolean }
// 200 { success: true; message: "Client updated"; data: Client }
```

### DELETE `/clients/:id`  (admin/accountant)
Archives (`isActive: false`). `409` if the client has outstanding invoices.
```ts
{ success: true; message: "Client archived" }
```

---

## 9. Invoice Templates / Designer — `/invoice-templates` 🏢
Writes require `company_admin` or `accountant`.

### The `design` object (`InvoiceDesign`)
```ts
interface InvoiceDesign {
  layout: {
    pageSize: "A4" | "Letter";
    orientation: "portrait" | "landscape";
    margins: { top: number; right: number; bottom: number; left: number };
    headerStyle: "logo-left" | "logo-right" | "logo-center" | "logo-top-banner";
  };
  branding: {
    logoUrl?: string; showLogo: boolean;
    primaryColor: string; secondaryColor: string; accentColor: string;  // hex
    backgroundColor: string; textColor: string;                          // hex
  };
  typography: {
    fontFamily: "Inter" | "Roboto" | "Lato" | "Merriweather" | "Poppins" | "Custom";
    customFontUrl?: string; baseFontSize: number; headingFontSize: number;
  };
  sections: {
    companyInfo: { visible: boolean; order: number; fields: string[] };
    clientInfo:  { visible: boolean; order: number; label: string };
    invoiceMeta: { visible: boolean; order: number; fields: string[] };
    itemsTable:  {
      visible: boolean; order: number;
      columns: { key: "description"|"quantity"|"unitPrice"|"taxRate"|"discount"|"amount";
                 label: string; visible: boolean; width: string }[];
      zebraStripes: boolean; headerBackgroundColor: string;
    };
    summary:  { visible: boolean; order: number; fields: string[] };
    notes:    { visible: boolean; order: number; label: string };
    terms:    { visible: boolean; order: number; label: string };
    paymentInstructions: { visible: boolean; order: number; content: string };
    signature: { visible: boolean; order: number; signatureImageUrl?: string; signatoryName?: string; signatoryTitle?: string };
    footer:   { visible: boolean; order: number; content: string };
  };
  watermark: { enabled: boolean; text: string; opacity: number /* 0-1 */ };
}
```
> All fields have sensible defaults — you may send a partial `design` and the server fills the rest.

### GET `/invoice-templates`
```ts
{ success: true; data: InvoiceTemplate[] }   // active (non-archived), default first
```

### POST `/invoice-templates`  (admin/accountant)
```ts
{ name: string; baseTheme?: BaseTheme; isDefault?: boolean; design: InvoiceDesign }
// 201 { success: true; message: "Template created"; data: InvoiceTemplate }
```

### POST `/invoice-templates/preview`  — render live preview (unsaved)
Query: `format=html` (default) or `format=pdf`. **Returns raw `text/html` or `application/pdf`, NOT the JSON envelope.**
```ts
// Request body
{ design: InvoiceDesign }
// 200 -> HTML document (for an <iframe srcdoc>) or PDF binary
```

### GET `/invoice-templates/:id`
```ts
{ success: true; data: InvoiceTemplate }
```

### PATCH `/invoice-templates/:id`  (admin/accountant)
```ts
{ name?: string; baseTheme?: BaseTheme; design?: InvoiceDesign }
// 200 { success: true; message: "Template updated"; data: InvoiceTemplate }
```

### DELETE `/invoice-templates/:id`  (admin/accountant)
Archives. `409` if it is the default or used by invoices.
```ts
{ success: true; message: "Template archived" }
```

### POST `/invoice-templates/:id/clone`  (admin/accountant)
```ts
{ name?: string }   // defaults to "<name> (Copy)"
// 201 { success: true; message: "Template cloned"; data: InvoiceTemplate }
```

### PATCH `/invoice-templates/:id/set-default`  (admin/accountant)
No body.
```ts
{ success: true; message: "Default template updated"; data: InvoiceTemplate }
```

### POST `/invoice-templates/:id/preview`  — render saved template
Query: `format=html` (default) or `format=pdf`. No body. Returns HTML/PDF (not JSON).

---

## 10. Invoices — `/invoices` 🏢
Writes require `company_admin` or `accountant`.

### GET `/invoices/public/:shareToken` 🔓
Public read-only invoice (share link). No auth.
```ts
{ success: true; data: { invoice: Invoice; company: Partial<Company> } }
```

### GET `/invoices/public/:shareToken/pdf` 🔓
Returns `application/pdf` (binary). No auth.

### GET `/invoices`
Query: `page`, `limit`, `sort`, `search` (matches invoiceNumber), `status?: InvoiceStatus`, `clientId?: string`, `dateFrom?: ISODate`, `dateTo?: ISODate`.
```ts
{ success: true; data: Invoice[] /* clientId populated {name,email} */; meta: {...} }
```

### POST `/invoices`  (admin/accountant)
Creates a `draft`. Totals are computed server-side; do not send them. `templateId` defaults to the company default. `issueDate` defaults to now; `dueDate` defaults to issueDate + payment terms. `currency` defaults to company currency.
```ts
// Request body
{
  clientId: string;
  templateId?: string;
  issueDate?: ISODate;
  dueDate?: ISODate;
  items: {
    description: string;
    quantity?: number;        // default 1
    unitPrice: number;
    taxRate?: number;         // % 0-100
    discount?: number;
    discountType?: DiscountType;
  }[];                        // at least 1
  shippingFee?: number;
  currency?: string;          // 3 letters
  notes?: string;
  termsAndConditions?: string;
  poNumber?: string;
}
// 201 { success: true; message: "Invoice created"; data: Invoice }
```

### GET `/invoices/:id`
```ts
{ success: true; data: Invoice /* clientId & templateId populated */ }
```

### GET `/invoices/:id/pdf`
Returns `application/pdf` (generated on demand).

### PATCH `/invoices/:id`  (admin/accountant)
While `draft`: any field below. Once `sent`: only `notes`, `termsAndConditions`, `dueDate`, `poNumber` are applied.
```ts
{
  clientId?: string; templateId?: string;
  issueDate?: ISODate; dueDate?: ISODate;
  items?: {...}[];           // same item shape as create
  shippingFee?: number; currency?: string;
  notes?: string; termsAndConditions?: string; poNumber?: string;
}
// 200 { success: true; message: "Invoice updated"; data: Invoice }
```

### DELETE `/invoices/:id`  (admin/accountant)
Only `draft` invoices. Otherwise cancel.
```ts
{ success: true; message: "Invoice deleted" }
```

### PATCH `/invoices/:id/cancel`  (admin/accountant)
```ts
{ reason?: string }
// 200 { success: true; message: "Invoice cancelled"; data: Invoice }
// 400 if already paid/cancelled
```

### PATCH `/invoices/:id/send`  (admin/accountant)
No body. Generates `shareToken`, flips `draft -> sent`, queues client email + PDF generation.
```ts
{ success: true; message: string; data: Invoice }
```

### POST `/invoices/:id/record-payment`  (admin/accountant)
Recomputes `amountPaid`/`amountDue` and flips status to `partially_paid`/`paid`.
```ts
{ amount: number /* > 0, ≤ amountDue */; paidOn?: ISODate; method?: PaymentMethod; reference?: string }
// 200 { success: true; message: "Payment recorded"; data: Invoice }
```

---

## 11. Departments — `/departments` 🏢
Writes require `company_admin` or `hr_manager`.

### GET `/departments`
Query: `page`, `limit`, `sort`, `search`.
```ts
{ success: true; data: Department[] /* with employeeCount */; meta: {...} }
```

### POST `/departments`  (admin/hr)
```ts
{ name: string; description?: string; headOfDepartment?: string /* employeeId */ }
// 201 { success: true; message: "Department created"; data: Department }
```

### GET `/departments/:id`
```ts
{ success: true; data: Department & { employeeCount: number } }
```

### PATCH `/departments/:id`  (admin/hr)
```ts
{ name?: string; description?: string; headOfDepartment?: string; isActive?: boolean }
// 200 { success: true; message: "Department updated"; data: Department }
```

### DELETE `/departments/:id`  (admin/hr)
`409` if active employees are assigned.
```ts
{ success: true; message: "Department deleted" }
```

---

## 12. Employees — `/employees` 🏢
Writes require `company_admin` or `hr_manager`.

### GET `/employees`
Query: `page`, `limit`, `sort`, `search`, `departmentId?: string`, `status?: EmployeeStatus`.
```ts
{ success: true; data: Employee[] /* departmentId populated {name} */; meta: {...} }
```

### POST `/employees`  (admin/hr)
Provide **either** `salaryStructureId` (reference an existing structure) **or** an inline `salaryStructure` (a one-off is created). `employeeCode` auto-generates (`EMP-001`...) if omitted.
```ts
{
  employeeCode?: string;
  firstName: string; lastName: string; email: string; phone?: string;
  departmentId: string;
  designation: string;
  employmentType?: EmploymentType;     // default full_time
  dateOfJoining: ISODate;
  bankDetails?: { accountTitle?: string; accountNumber?: string; bankName?: string; branchCode?: string };
  address?: Address;
  emergencyContact?: { name?: string; phone?: string; relation?: string };
  salaryStructureId?: string;
  salaryStructure?: {                  // see §13 create body
    name?: string; isTemplate?: boolean; baseSalary: number;
    allowances?: SalaryComponent[]; deductions?: SalaryComponent[]; effectiveFrom?: ISODate;
  };
}
// 201 { success: true; message: "Employee created"; data: Employee }
```

### GET `/employees/:id`
```ts
{ success: true; data: Employee /* departmentId & salaryStructureId populated */ }
```

### GET `/employees/:id/salary-slips`
Query: pagination.
```ts
{ success: true; data: SalarySlip[]; meta: {...} }
```

### PATCH `/employees/:id`  (admin/hr)
```ts
{
  firstName?: string; lastName?: string; email?: string; phone?: string;
  departmentId?: string; designation?: string; employmentType?: EmploymentType;
  dateOfJoining?: ISODate; dateOfLeaving?: ISODate; status?: EmployeeStatus;
  bankDetails?: {...}; address?: Address; emergencyContact?: {...};
  salaryStructureId?: string;
}
// 200 { success: true; message: "Employee updated"; data: Employee }
```

### DELETE `/employees/:id`  (admin/hr)
Soft delete → `status: "terminated"` (sets `dateOfLeaving`).
```ts
{ success: true; message: "Employee marked as terminated" }
```

### POST `/employees/:id/avatar`  (admin/hr) — multipart
Field name: `avatar`. png/jpg/jpeg/svg/webp, ≤ 5 MB.
```ts
{ success: true; message: "Avatar uploaded"; data: { avatarUrl: string } }
```

---

## 13. Salary Structures — `/salary-structures` 🏢
Writes require `company_admin` or `hr_manager`.

### GET `/salary-structures`
Query: `page`, `limit`, `sort`, `search`, `isTemplate?: "true"|"false"`.
```ts
{ success: true; data: SalaryStructure[]; meta: {...} }
```

### POST `/salary-structures`  (admin/hr)
```ts
{
  name: string;
  isTemplate?: boolean;
  baseSalary: number;
  allowances?: { name: string; type?: ComponentType; value: number; taxable?: boolean }[];
  deductions?: { name: string; type?: ComponentType; value: number }[];
  effectiveFrom?: ISODate;
}
// 201 { success: true; message: "Salary structure created"; data: SalaryStructure }
```

### GET `/salary-structures/:id`
```ts
{ success: true; data: SalaryStructure }
```

### PATCH `/salary-structures/:id`  (admin/hr)
Same fields as create, all optional.
```ts
{ success: true; message: "Salary structure updated"; data: SalaryStructure }
```

### DELETE `/salary-structures/:id`  (admin/hr)
`409` if assigned to active employees.
```ts
{ success: true; message: "Salary structure deleted" }
```

---

## 14. Payroll — `/payroll` 🏢
Process/finalize/delete require `company_admin` or `hr_manager`.

### GET `/payroll`
Query: `page`, `limit`, `sort`, `year?: number`, `status?: PayrollStatus`.
```ts
{ success: true; data: Payroll[]; meta: {...} }
```

### GET `/payroll/reports/summary`
Query: `months?: number` (1-36).
```ts
{ success: true; data: {
  _id: { year: number; month: number };
  totalGross: number; totalNet: number; totalDeductions: number; employeeCount: number;
}[] }
```

### POST `/payroll/process`  (admin/hr)
Creates/updates a run and generates a salary slip per active employee. Runs synchronously for small companies; queued (`queued: true`) when active employees exceed the threshold (default 50).
```ts
// Request body
{ month: number /* 1-12 */; year: number; employeeIds?: string[]; notes?: string }
// 201 (sync)   { success: true; message: "Payroll processed"; data: Payroll }
// 201 (queued) { success: true; message: "Payroll run queued for processing";
//                data: { payrollId: string; status: "processing"; queued: true } }
// 409 if period already finalized · 400 if no active employees
```

### GET `/payroll/:id`
```ts
{ success: true; data: Payroll }
```

### GET `/payroll/:id/slips`
```ts
{ success: true; data: SalarySlip[] /* employeeId populated */ }
```

### PATCH `/payroll/:id/finalize`  (admin/hr)
Locks the run (`status: "completed"`). No body.
```ts
{ success: true; message: "Payroll finalized"; data: Payroll }
// 400 if already completed / still processing / has no slips
```

### DELETE `/payroll/:id`  (admin/hr)
Deletes a non-finalized run and its slips.
```ts
{ success: true; message: "Payroll run deleted" }
// 400 if finalized
```

---

## 15. Salary Slips — `/salary-slips` 🏢
`staff` users only see their own slips. `mark-paid` requires `company_admin`/`hr_manager`.

### GET `/salary-slips`
Query: `page`, `limit`, `sort`, `employeeId?`, `payrollId?`, `month?`, `year?`, `paymentStatus?: PaymentStatus`.
```ts
{ success: true; data: SalarySlip[] /* employeeId populated */; meta: {...} }
```

### GET `/salary-slips/:id`
```ts
{ success: true; data: SalarySlip /* employeeId populated */ }
```

### GET `/salary-slips/:id/pdf`
Returns `application/pdf` (binary).

### PATCH `/salary-slips/:id/mark-paid`  (admin/hr)
```ts
{ paidOn?: ISODate }   // defaults to now
// 200 { success: true; message: "Salary slip marked as paid"; data: SalarySlip }
```

---

## 16. Dashboard / Reports — `/dashboard` 🏢

### GET `/dashboard/overview`
```ts
{ success: true; data: {
  totalRevenue: number;                 // sum of paid invoices
  totalOutstanding: number;             // sum of amountDue on sent/partial/overdue
  totalInvoices: number;
  invoiceStatusCounts: { _id: InvoiceStatus; count: number; amount: number }[];
  activeEmployees: number;
  payrollExpenseThisMonth: number;
  monthStart: string;
} }
```

### GET `/dashboard/revenue-trend`
Query: `months?: number` (default 6).
```ts
{ success: true; data: { _id: { year: number; month: number }; revenue: number; count: number }[] }
```

### GET `/dashboard/invoice-status-breakdown`
```ts
{ success: true; data: { _id: InvoiceStatus; count: number; totalAmount: number; amountDue: number }[] }
```

### GET `/dashboard/payroll-trend`
Query: `months?: number` (default 6).
```ts
{ success: true; data: { _id: { year: number; month: number }; totalNet: number; totalGross: number; employeeCount: number }[] }
```

### GET `/dashboard/outstanding-clients`
Query: `limit?: number` (default 5).
```ts
{ success: true; data: Pick<Client, "_id"|"name"|"companyNameOfClient"|"totalOutstanding"|"totalInvoiced">[] }
```

---

## 17. System

| Method | Path | Description |
|---|---|---|
| GET | `/api/v1/health` | `{ success, message, timestamp }` |
| GET | `/api/docs` | Swagger UI |
| GET | `/uploads/*` | Static uploaded assets (logos, avatars, PDFs) |

---

## 18. Frontend integration notes

- **Send credentials** on every request (`withCredentials`/`credentials: "include"`) so the refresh cookie is sent/received.
- **401 handling:** on a `401`, call `POST /auth/refresh`; if that also fails, redirect to login.
- **Onboarding gate:** after login, if `company.onboardingCompleted === false`, route to the setup wizard (`PATCH /company/setup`). Otherwise go to the dashboard.
- **Role gating in the UI:** mirror the server roles — `company_admin` (everything), `accountant` (invoices/clients/templates/dashboard), `hr_manager` (employees/departments/structures/payroll), `staff` (own salary slips).
- **PDF & preview endpoints** return binary/HTML, not the JSON envelope — fetch as a blob (PDF) or load HTML into an `<iframe>`.
- **Never send computed totals** for invoices; the server recalculates `subTotal`/`grandTotal`/`amountDue` from `items`.
- **Money** values are plain numbers in the company currency; format on the client.
