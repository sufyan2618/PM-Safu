import { Router } from "express";
import authRouter from "./auth.router";
import superAdminRouter from "./superAdmin.router";
import companyRouter from "./company.router";
import userRouter from "./user.router";
import clientRouter from "./client.router";
import invoiceTemplateRouter from "./invoiceTemplate.router";
import invoiceRouter from "./invoice.router";
import departmentRouter from "./department.router";
import employeeRouter from "./employee.router";
import salaryStructureRouter from "./salaryStructure.router";
import payrollRouter from "./payroll.router";
import salarySlipRouter from "./salarySlip.router";
import dashboardRouter from "./dashboard.router";
import auditRouter from "./audit.router";
import taxRateRouter from "./taxRate.router";
import exportRouter from "./export.router";
import aiRouter from "./ai.router";
import { auditLogger } from "../middlewares/audit.middleware";

const apiRouter = Router();

apiRouter.get("/health", (_req, res) => {
  res.status(200).json({ success: true, message: "Server is healthy", timestamp: new Date().toISOString() });
});

// Automatically audit every state-changing request by a company user.
apiRouter.use(auditLogger);

apiRouter.use("/auth", authRouter);
apiRouter.use("/super-admin", superAdminRouter);
apiRouter.use("/company", companyRouter);
apiRouter.use("/users", userRouter);
apiRouter.use("/clients", clientRouter);
apiRouter.use("/invoice-templates", invoiceTemplateRouter);
apiRouter.use("/invoices", invoiceRouter);
apiRouter.use("/departments", departmentRouter);
apiRouter.use("/employees", employeeRouter);
apiRouter.use("/salary-structures", salaryStructureRouter);
apiRouter.use("/payroll", payrollRouter);
apiRouter.use("/salary-slips", salarySlipRouter);
apiRouter.use("/dashboard", dashboardRouter);
apiRouter.use("/audit-logs", auditRouter);
apiRouter.use("/tax-rates", taxRateRouter);
apiRouter.use("/export", exportRouter);
apiRouter.use("/ai", aiRouter);

export default apiRouter;
