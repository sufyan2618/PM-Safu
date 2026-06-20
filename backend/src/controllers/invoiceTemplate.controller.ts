import type { Request, Response } from "express";
import { BaseTheme } from "../config/constants";
import { InvoiceTemplateModel } from "../models/invoiceTemplate.model";
import { InvoiceModel } from "../models/invoice.model";
import { CompanyModel } from "../models/company.model";
import { asyncHandler } from "../utils/async-handler";
import { ApiError } from "../utils/apiError";
import { sendCreated, sendSuccess } from "../utils/apiResponse";
import { renderInvoiceHtml } from "../lib/pdf/renderInvoiceHtml";
import { generateInvoicePdf } from "../lib/pdf/generateInvoicePdf";
import { sampleInvoiceData } from "../lib/pdf/renderData";
import type { InvoiceDesign } from "../types/invoiceTemplate.types";

export const listTemplates = asyncHandler(async (req: Request, res: Response) => {
  const templates = await InvoiceTemplateModel.find({
    companyId: req.companyId,
    isArchived: false,
  }).sort("-isDefault -createdAt");
  return sendSuccess(res, { data: templates });
});

export const createTemplate = asyncHandler(async (req: Request, res: Response) => {
  const { name, baseTheme, design, isDefault } = req.body;

  if (isDefault) {
    await InvoiceTemplateModel.updateMany({ companyId: req.companyId }, { $set: { isDefault: false } });
  }

  const template = await InvoiceTemplateModel.create({
    companyId: req.companyId,
    name,
    baseTheme: baseTheme ?? BaseTheme.CUSTOM,
    design,
    isDefault: Boolean(isDefault),
    createdBy: req.user?.sub,
  });

  if (template.isDefault) {
    await CompanyModel.updateOne(
      { _id: req.companyId },
      { $set: { "invoiceSettings.defaultTemplateId": template._id } },
    );
  }

  return sendCreated(res, { message: "Template created", data: template });
});

export const getTemplate = asyncHandler(async (req: Request, res: Response) => {
  const template = await InvoiceTemplateModel.findOne({
    _id: req.params.id,
    companyId: req.companyId,
  });
  if (!template) throw ApiError.notFound("Template not found");
  return sendSuccess(res, { data: template });
});

export const updateTemplate = asyncHandler(async (req: Request, res: Response) => {
  const template = await InvoiceTemplateModel.findOneAndUpdate(
    { _id: req.params.id, companyId: req.companyId },
    req.body,
    { new: true, runValidators: true },
  );
  if (!template) throw ApiError.notFound("Template not found");
  return sendSuccess(res, { message: "Template updated", data: template });
});

export const deleteTemplate = asyncHandler(async (req: Request, res: Response) => {
  const template = await InvoiceTemplateModel.findOne({
    _id: req.params.id,
    companyId: req.companyId,
  });
  if (!template) throw ApiError.notFound("Template not found");
  if (template.isDefault) {
    throw ApiError.conflict("Cannot archive the default template. Set another as default first.");
  }

  const inUse = await InvoiceModel.countDocuments({
    companyId: req.companyId,
    templateId: template._id,
  });
  if (inUse > 0) {
    throw ApiError.conflict("Cannot archive a template that is used by existing invoices");
  }

  template.isArchived = true;
  await template.save();
  return sendSuccess(res, { message: "Template archived" });
});

export const cloneTemplate = asyncHandler(async (req: Request, res: Response) => {
  const source = await InvoiceTemplateModel.findOne({
    _id: req.params.id,
    companyId: req.companyId,
  });
  if (!source) throw ApiError.notFound("Template not found");

  const clone = await InvoiceTemplateModel.create({
    companyId: req.companyId,
    name: req.body.name || `${source.name} (Copy)`,
    baseTheme: source.baseTheme,
    design: source.design,
    isDefault: false,
    createdBy: req.user?.sub,
  });

  return sendCreated(res, { message: "Template cloned", data: clone });
});

export const setDefaultTemplate = asyncHandler(async (req: Request, res: Response) => {
  const template = await InvoiceTemplateModel.findOne({
    _id: req.params.id,
    companyId: req.companyId,
    isArchived: false,
  });
  if (!template) throw ApiError.notFound("Template not found");

  await InvoiceTemplateModel.updateMany({ companyId: req.companyId }, { $set: { isDefault: false } });
  template.isDefault = true;
  await template.save();

  await CompanyModel.updateOne(
    { _id: req.companyId },
    { $set: { "invoiceSettings.defaultTemplateId": template._id } },
  );

  return sendSuccess(res, { message: "Default template updated", data: template });
});

async function respondWithPreview(req: Request, res: Response, design: InvoiceDesign) {
  const company = await CompanyModel.findById(req.companyId).select("currency");
  const data = sampleInvoiceData(design, company?.currency ?? "USD");
  const format = (req.query.format as string) === "pdf" ? "pdf" : "html";

  if (format === "pdf") {
    const buffer = await generateInvoicePdf(data);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", 'inline; filename="preview.pdf"');
    res.send(buffer);
    return;
  }

  res.setHeader("Content-Type", "text/html");
  res.send(renderInvoiceHtml(data));
}

export const previewUnsavedTemplate = asyncHandler(async (req: Request, res: Response) => {
  await respondWithPreview(req, res, req.body.design as InvoiceDesign);
});

export const previewSavedTemplate = asyncHandler(async (req: Request, res: Response) => {
  const template = await InvoiceTemplateModel.findOne({
    _id: req.params.id,
    companyId: req.companyId,
  });
  if (!template) throw ApiError.notFound("Template not found");
  await respondWithPreview(req, res, template.design);
});
