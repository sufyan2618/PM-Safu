import type { Types } from "mongoose";
import { InvoiceTemplateModel } from "../models/invoiceTemplate.model";
import { CompanyModel } from "../models/company.model";
import { defaultPresets } from "./invoiceTemplateDefaults";

/**
 * Seeds the 3 starter invoice templates (Classic, Modern, Minimal) for a company
 * and wires the default one into the company's invoice settings.
 * No-op if the company already has templates.
 */
export async function seedDefaultTemplates(
  companyId: Types.ObjectId,
  options: { brandColor?: string; logoUrl?: string; createdBy?: Types.ObjectId } = {},
): Promise<void> {
  const existing = await InvoiceTemplateModel.countDocuments({ companyId });
  if (existing > 0) return;

  const presets = defaultPresets({ brandColor: options.brandColor, logoUrl: options.logoUrl });
  const created = await InvoiceTemplateModel.insertMany(
    presets.map((preset) => ({
      companyId,
      name: preset.name,
      baseTheme: preset.baseTheme,
      isDefault: preset.isDefault,
      design: preset.design,
      createdBy: options.createdBy,
    })),
  );

  const defaultTemplate = created.find((template) => template.isDefault) ?? created[0];
  if (defaultTemplate) {
    await CompanyModel.updateOne(
      { _id: companyId },
      { $set: { "invoiceSettings.defaultTemplateId": defaultTemplate._id } },
    );
  }
}
