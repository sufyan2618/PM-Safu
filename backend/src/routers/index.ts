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

const apiRouter = Router();

apiRouter.get("/health", (_req, res) => {
  res.status(200).json({ success: true, message: "Server is healthy", timestamp: new Date().toISOString() });
});

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

export default apiRouter;
