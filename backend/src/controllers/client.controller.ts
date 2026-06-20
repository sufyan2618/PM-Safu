import type { Request, Response } from "express";
import { InvoiceStatus } from "../config/constants";
import { ClientModel } from "../models/client.model";
import { InvoiceModel } from "../models/invoice.model";
import { asyncHandler } from "../utils/async-handler";
import { ApiError } from "../utils/apiError";
import { sendCreated, sendSuccess } from "../utils/apiResponse";
import { buildMeta, getPagination } from "../utils/pagination";

export const listClients = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, skip, sort } = getPagination(req.query);
  const { isActive, search } = req.query as { isActive?: boolean; search?: string };

  const filter: Record<string, unknown> = { companyId: req.companyId };
  if (typeof isActive === "boolean") filter.isActive = isActive;
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
      { companyNameOfClient: { $regex: search, $options: "i" } },
    ];
  }

  const [clients, total] = await Promise.all([
    ClientModel.find(filter).sort(sort).skip(skip).limit(limit),
    ClientModel.countDocuments(filter),
  ]);

  return sendSuccess(res, { data: clients, meta: buildMeta(total, page, limit) });
});

export const createClient = asyncHandler(async (req: Request, res: Response) => {
  const body = { ...req.body };
  if (body.email === "") delete body.email;
  const client = await ClientModel.create({ ...body, companyId: req.companyId });
  return sendCreated(res, { message: "Client created", data: client });
});

export const getClient = asyncHandler(async (req: Request, res: Response) => {
  const client = await ClientModel.findOne({ _id: req.params.id, companyId: req.companyId });
  if (!client) throw ApiError.notFound("Client not found");

  const invoiceSummary = await InvoiceModel.aggregate<{ _id: string; count: number; amount: number }>([
    { $match: { companyId: client.companyId, clientId: client._id } },
    { $group: { _id: "$status", count: { $sum: 1 }, amount: { $sum: "$grandTotal" } } },
  ]);

  return sendSuccess(res, { data: { client, invoiceSummary } });
});

export const updateClient = asyncHandler(async (req: Request, res: Response) => {
  const client = await ClientModel.findOneAndUpdate(
    { _id: req.params.id, companyId: req.companyId },
    req.body,
    { new: true, runValidators: true },
  );
  if (!client) throw ApiError.notFound("Client not found");
  return sendSuccess(res, { message: "Client updated", data: client });
});

export const deleteClient = asyncHandler(async (req: Request, res: Response) => {
  const client = await ClientModel.findOne({ _id: req.params.id, companyId: req.companyId });
  if (!client) throw ApiError.notFound("Client not found");

  const unpaidCount = await InvoiceModel.countDocuments({
    companyId: req.companyId,
    clientId: client._id,
    status: { $in: [InvoiceStatus.SENT, InvoiceStatus.PARTIALLY_PAID, InvoiceStatus.OVERDUE] },
  });
  if (unpaidCount > 0) {
    throw ApiError.conflict("Cannot archive a client with outstanding invoices");
  }

  client.isActive = false;
  await client.save();
  return sendSuccess(res, { message: "Client archived" });
});

export const getClientInvoices = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, skip, sort } = getPagination(req.query);
  const client = await ClientModel.findOne({ _id: req.params.id, companyId: req.companyId });
  if (!client) throw ApiError.notFound("Client not found");

  const filter = { companyId: req.companyId, clientId: client._id };
  const [invoices, total] = await Promise.all([
    InvoiceModel.find(filter).sort(sort).skip(skip).limit(limit),
    InvoiceModel.countDocuments(filter),
  ]);

  return sendSuccess(res, { data: invoices, meta: buildMeta(total, page, limit) });
});
