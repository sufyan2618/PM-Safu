import { ApiError } from "../../utils/apiError";
import { CompanyModel } from "../../models/company.model";
import { ClientModel } from "../../models/client.model";
import { InvoiceTemplateModel } from "../../models/invoiceTemplate.model";
import type { IInvoice } from "../../models/invoice.model";
import type { IAddress } from "../../models/shared";
import type { InvoicePartyInfo, InvoiceRenderData } from "./renderData";
import { buildInvoiceDesign } from "../../utils/invoiceTemplateDefaults";
import { computeTaxBreakdown } from "../../utils/invoiceCalculator";
import { BaseTheme } from "../../config/constants";

function addressLines(address?: IAddress): string[] {
  if (!address) return [];
  return [
    address.line1,
    address.line2,
    [address.city, address.state, address.postalCode].filter(Boolean).join(", "),
    address.country,
  ].filter((line): line is string => Boolean(line && line.trim()));
}

/** Loads all related documents and assembles a render-ready invoice payload. */
export async function buildInvoiceRenderData(invoice: IInvoice): Promise<InvoiceRenderData> {
  const [company, client, template] = await Promise.all([
    CompanyModel.findById(invoice.companyId),
    ClientModel.findById(invoice.clientId),
    InvoiceTemplateModel.findById(invoice.templateId),
  ]);

  if (!company) throw ApiError.notFound("Company not found");
  if (!client) throw ApiError.notFound("Client not found");

  const design = template?.design ?? buildInvoiceDesign(BaseTheme.CLASSIC, { brandColor: company.brandColor });

  const companyParty: InvoicePartyInfo = {
    name: company.legalName || company.companyName,
    email: company.registrationEmail,
    phone: company.phone,
    website: company.website,
    taxId: company.taxId,
    addressLines: addressLines(company.address),
  };

  const clientParty: InvoicePartyInfo = {
    name: client.companyNameOfClient || client.name,
    email: client.email,
    phone: client.phone,
    taxId: client.taxId,
    addressLines: addressLines(client.billingAddress),
  };

  return {
    design,
    company: companyParty,
    client: clientParty,
    meta: {
      invoiceNumber: invoice.invoiceNumber,
      issueDate: invoice.issueDate.toLocaleDateString(),
      dueDate: invoice.dueDate.toLocaleDateString(),
      poNumber: invoice.poNumber,
      status: invoice.status,
    },
    items: invoice.items.map((item) => ({
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      taxRate: item.taxRate,
      discount: item.discount,
      amount: item.amount,
    })),
    totals: {
      subTotal: invoice.subTotal,
      totalDiscount: invoice.totalDiscount,
      totalTax: invoice.totalTax,
      shippingFee: invoice.shippingFee,
      grandTotal: invoice.grandTotal,
      amountPaid: invoice.amountPaid,
      amountDue: invoice.amountDue,
      taxBreakdown: computeTaxBreakdown(invoice.items),
    },
    currency: invoice.currency,
    notes: invoice.notes,
    termsAndConditions: invoice.termsAndConditions,
  };
}
