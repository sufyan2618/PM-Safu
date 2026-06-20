import type {
  Client,
  DashboardStats,
  Department,
  Employee,
  Invoice,
  InvoiceStatus,
  InvoiceTemplate,
  OutstandingClient,
  PayrollRun,
  PayrollTrendPoint,
  RevenuePoint,
  SalarySlip,
  User,
} from '@/types';

const COMPANY_ID = 'comp_001';

function iso(daysFromNow: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d.toISOString();
}

export const mockCurrentUser: User = {
  id: 'usr_001',
  name: 'Amelia Hartwell',
  email: 'amelia@northwind.co',
  role: 'admin',
  companyId: COMPANY_ID,
  isActive: true,
  createdAt: iso(-420),
};

export const mockUsers: User[] = [
  mockCurrentUser,
  {
    id: 'usr_002',
    name: 'Marcus Reed',
    email: 'marcus@northwind.co',
    role: 'accountant',
    companyId: COMPANY_ID,
    isActive: true,
    createdAt: iso(-300),
  },
  {
    id: 'usr_003',
    name: 'Priya Nair',
    email: 'priya@northwind.co',
    role: 'manager',
    companyId: COMPANY_ID,
    isActive: true,
    createdAt: iso(-210),
  },
  {
    id: 'usr_004',
    name: 'Diego Alvarez',
    email: 'diego@northwind.co',
    role: 'employee',
    companyId: COMPANY_ID,
    isActive: false,
    createdAt: iso(-120),
  },
];

const CLIENT_SEED: Array<[string, string, string, number, number]> = [
  ['Aperture Labs', 'billing@aperture.io', 'Aperture Labs Inc.', 48200, 12400],
  ['Brightwave Media', 'ap@brightwave.com', 'Brightwave Media LLC', 31750, 0],
  ['Cobalt Systems', 'finance@cobalt.dev', 'Cobalt Systems', 64900, 28900],
  ['Driftwood Studios', 'hello@driftwood.design', 'Driftwood Studios', 18200, 4200],
  ['Evergreen Retail', 'accounts@evergreen.shop', 'Evergreen Retail Co.', 92300, 0],
  ['Fathom Analytics', 'pay@fathom.io', 'Fathom Analytics', 27600, 9600],
  ['Granite Holdings', 'invoices@granite.com', 'Granite Holdings', 154000, 41000],
  ['Harbor Logistics', 'ar@harbor.co', 'Harbor Logistics', 38900, 0],
  ['Ionic Robotics', 'finance@ionic.ai', 'Ionic Robotics', 71200, 15800],
  ['Juniper Foods', 'billing@juniper.com', 'Juniper Foods', 22400, 3300],
];

export const mockClients: Client[] = CLIENT_SEED.map(
  ([name, email, companyName, totalInvoiced, outstandingBalance], i) => ({
    id: `cli_${String(i + 1).padStart(3, '0')}`,
    name,
    email,
    companyName,
    phone: `+1 (555) ${String(100 + i).padStart(3, '0')}-${String(2000 + i).slice(0, 4)}`,
    address: `${100 + i * 7} Market Street, Suite ${i + 1}, San Francisco, CA`,
    taxId: `US-TAX-${49000 + i}`,
    totalInvoiced,
    outstandingBalance,
    isActive: true,
    createdAt: iso(-200 + i * 5),
  }),
);

export const mockTemplates: InvoiceTemplate[] = [
  {
    id: 'tpl_001',
    name: 'Classic Emerald',
    primaryColor: '#0E1320',
    accentColor: '#0E7C5A',
    fontFamily: 'Inter',
    layout: 'classic',
    isDefault: true,
  },
  {
    id: 'tpl_002',
    name: 'Modern Slate',
    primaryColor: '#1F232C',
    accentColor: '#3060C2',
    fontFamily: 'Inter',
    layout: 'modern',
    isDefault: false,
  },
  {
    id: 'tpl_003',
    name: 'Minimal Mono',
    primaryColor: '#0E1320',
    accentColor: '#4B5468',
    fontFamily: 'IBM Plex Mono',
    layout: 'minimal',
    isDefault: false,
  },
];

const STATUS_CYCLE: InvoiceStatus[] = [
  'paid',
  'sent',
  'overdue',
  'draft',
  'partially_paid',
  'paid',
  'sent',
  'paid',
  'overdue',
  'cancelled',
  'paid',
  'sent',
];

export const mockInvoices: Invoice[] = Array.from({ length: 12 }).map((_, i) => {
  const client = mockClients[i % mockClients.length];
  const status = STATUS_CYCLE[i];
  const qtyA = 1 + (i % 4);
  const priceA = 1500 + i * 220;
  const qtyB = 2 + (i % 3);
  const priceB = 480 + i * 60;
  const lineA = qtyA * priceA;
  const lineB = qtyB * priceB;
  const subtotal = lineA + lineB;
  const taxTotal = Math.round(subtotal * 0.08 * 100) / 100;
  const total = subtotal + taxTotal;
  const amountPaid =
    status === 'paid' ? total : status === 'partially_paid' ? Math.round(total * 0.4) : 0;

  return {
    id: `inv_${String(i + 1).padStart(3, '0')}`,
    invoiceNumber: `INV-${String(1041 + i).padStart(4, '0')}`,
    clientId: client.id,
    client,
    status,
    issueDate: iso(-40 + i * 3),
    dueDate: iso(-40 + i * 3 + 14),
    lineItems: [
      {
        id: `li_${i}_1`,
        description: 'Professional services — implementation',
        quantity: qtyA,
        unitPrice: priceA,
        taxRate: 8,
        total: lineA,
      },
      {
        id: `li_${i}_2`,
        description: 'Monthly platform subscription',
        quantity: qtyB,
        unitPrice: priceB,
        taxRate: 8,
        total: lineB,
      },
    ],
    subtotal,
    taxTotal,
    total,
    amountPaid,
    amountDue: total - amountPaid,
    currency: 'USD',
    templateId: 'tpl_001',
    notes: 'Thank you for your business. Payment is due within 14 days of issue.',
    terms: 'Late payments are subject to a 1.5% monthly service charge.',
    shareToken: `shr_${i}${client.id}`,
    paymentHistory:
      amountPaid > 0
        ? [
            {
              id: `pay_${i}`,
              amount: amountPaid,
              paidOn: iso(-40 + i * 3 + 10),
              method: 'bank_transfer',
              reference: `TXN-${90210 + i}`,
            },
          ]
        : [],
    sentAt: status !== 'draft' ? iso(-40 + i * 3) : undefined,
    createdAt: iso(-41 + i * 3),
  };
});

const DEPT_SEED: Array<[string, string]> = [
  ['Engineering', 'Builds and maintains the core platform'],
  ['Design', 'Product and brand design'],
  ['Sales', 'Revenue and client acquisition'],
  ['Finance', 'Accounting, payroll and reporting'],
  ['Operations', 'People, facilities and support'],
];

export const mockDepartments: Department[] = DEPT_SEED.map(([name, description], i) => ({
  id: `dep_${String(i + 1).padStart(3, '0')}`,
  name,
  description,
  employeeCount: [5, 3, 4, 2, 2][i],
  headEmployeeName: ['Sara Kim', 'Leo Martins', 'Nadia Hassan', 'Marcus Reed', 'Priya Nair'][i],
}));

const EMP_SEED: Array<[string, string, number, string, number]> = [
  ['Sara Kim', 'Staff Engineer', 0, 'Engineering', 11500],
  ['Tom Becker', 'Backend Engineer', 0, 'Engineering', 9200],
  ['Lena Vogt', 'Frontend Engineer', 0, 'Engineering', 8800],
  ['Omar Farouk', 'QA Engineer', 0, 'Engineering', 7400],
  ['Yuki Tanaka', 'DevOps Engineer', 0, 'Engineering', 9600],
  ['Leo Martins', 'Design Lead', 1, 'Design', 9800],
  ['Mia Rossi', 'Product Designer', 1, 'Design', 7600],
  ['Aron Petersen', 'Brand Designer', 1, 'Design', 6900],
  ['Nadia Hassan', 'Sales Director', 2, 'Sales', 12400],
  ['Carlos Mendez', 'Account Executive', 2, 'Sales', 7200],
  ['Grace Liu', 'Finance Analyst', 3, 'Finance', 8100],
  ['Ravi Sharma', 'Operations Manager', 4, 'Operations', 8700],
];

export const mockEmployees: Employee[] = EMP_SEED.map(
  ([name, designation, deptIdx, deptName, basic], i) => ({
    id: `emp_${String(i + 1).padStart(3, '0')}`,
    employeeCode: `EMP-${String(i + 1).padStart(3, '0')}`,
    name,
    email: `${name.toLowerCase().replace(/\s+/g, '.')}@northwind.co`,
    phone: `+1 (555) ${String(300 + i).padStart(3, '0')}-${String(4000 + i).slice(0, 4)}`,
    departmentId: `dep_${String(deptIdx + 1).padStart(3, '0')}`,
    departmentName: deptName,
    designation,
    employmentType: i % 5 === 0 ? 'contract' : 'full_time',
    joinDate: iso(-700 + i * 30),
    status: i === 11 ? 'inactive' : 'active',
    isActive: i !== 11,
    salaryStructure: {
      id: `sal_${i}`,
      employeeId: `emp_${String(i + 1).padStart(3, '0')}`,
      basic,
      allowances: [
        { label: 'House Rent', amount: Math.round(basic * 0.2) },
        { label: 'Transport', amount: 400 },
      ],
      deductions: [
        { label: 'Income Tax', amount: Math.round(basic * 0.12) },
        { label: 'Provident Fund', amount: Math.round(basic * 0.05) },
      ],
      effectiveFrom: iso(-365),
    },
  }),
);

function periodStr(monthsAgo: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() - monthsAgo);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export const mockPayrollRuns: PayrollRun[] = Array.from({ length: 6 }).map((_, i) => {
  const gross = 116000 + i * 2400;
  const deductions = Math.round(gross * 0.18);
  return {
    id: `pr_${String(i + 1).padStart(3, '0')}`,
    period: periodStr(i),
    status: i === 0 ? 'draft' : 'completed',
    totalEmployees: 11,
    totalGross: gross,
    totalDeductions: deductions,
    totalNet: gross - deductions,
    processedAt: i === 0 ? undefined : iso(-i * 30 + 2),
    createdAt: iso(-i * 30),
  };
});

export const mockSalarySlips: SalarySlip[] = mockEmployees
  .filter((e) => e.isActive)
  .map((emp, i) => {
    const basic = emp.salaryStructure?.basic ?? 8000;
    const allowances = emp.salaryStructure?.allowances ?? [];
    const deductions = emp.salaryStructure?.deductions ?? [];
    const gross = basic + allowances.reduce((s, a) => s + a.amount, 0);
    const totalDeductions = deductions.reduce((s, d) => s + d.amount, 0);
    return {
      id: `slip_${String(i + 1).padStart(3, '0')}`,
      payrollRunId: 'pr_002',
      employeeId: emp.id,
      employee: emp,
      period: periodStr(1),
      grossSalary: gross,
      totalDeductions,
      netSalary: gross - totalDeductions,
      allowances,
      deductions,
      paymentStatus: i % 4 === 0 ? 'pending' : 'paid',
      paidOn: i % 4 === 0 ? undefined : iso(-25),
    };
  });

export const mockDashboardStats: DashboardStats = {
  totalRevenue: 486200,
  outstandingAmount: 119800,
  invoiceCount: { draft: 1, sent: 4, paid: 5, overdue: 2 },
  payrollExpenseThisMonth: 116000,
  activeEmployees: 11,
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
function lastMonths(n: number): string[] {
  const now = new Date().getMonth();
  return Array.from({ length: n }, (_, i) => MONTHS[(now - (n - 1) + i + 12) % 12]);
}

export const mockRevenueTrend: RevenuePoint[] = lastMonths(8).map((month, i) => ({
  month,
  revenue: 42000 + i * 5200 + (i % 2 === 0 ? 6000 : 0),
  expense: 28000 + i * 2100,
}));

export const mockPayrollTrend: PayrollTrendPoint[] = lastMonths(6).map((month, i) => ({
  month,
  amount: 108000 + i * 1600,
}));

export const mockOutstandingClients: OutstandingClient[] = [...mockClients]
  .filter((c) => c.outstandingBalance > 0)
  .sort((a, b) => b.outstandingBalance - a.outstandingBalance)
  .slice(0, 5)
  .map((c) => ({
    clientId: c.id,
    name: c.name,
    outstanding: c.outstandingBalance,
    invoiceCount: 1 + (Number(c.id.slice(-1)) % 3),
  }));
