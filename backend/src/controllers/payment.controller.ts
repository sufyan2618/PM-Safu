import type { Request, Response } from "express";
import type Stripe from "stripe";
import { PaymentMethod } from "../config/constants";
import { env } from "../config/env";
import { stripe } from "../config/stripe";
import { CompanyModel } from "../models/company.model";
import { InvoiceModel } from "../models/invoice.model";
import { asyncHandler } from "../utils/async-handler";
import { ApiError } from "../utils/apiError";
import { sendSuccess } from "../utils/apiResponse";
import { applyPaymentStatus, syncClientTotals } from "../utils/invoicePayments";
import { fromStripeAmount } from "../utils/stripeAmount";
import { createNotification } from "../lib/notifications/createNotification";
import { logger } from "../lib/logger";

const SETTINGS_RETURN_URL = `${env.CLIENT_BASE_URL}/settings/company?tab=payments`;

function syncStripeFlags(
  company: { stripe: { chargesEnabled: boolean; payoutsEnabled: boolean; detailsSubmitted: boolean } },
  account: Stripe.Account,
) {
  company.stripe.chargesEnabled = Boolean(account.charges_enabled);
  company.stripe.payoutsEnabled = Boolean(account.payouts_enabled);
  company.stripe.detailsSubmitted = Boolean(account.details_submitted);
}

/**
 * Company-facing: ensures a connected Stripe account exists for the company, then returns a
 * Stripe-hosted onboarding link the admin can use to complete (or resume) onboarding.
 */
export const startConnectOnboarding = asyncHandler(async (req: Request, res: Response) => {
  const company = await CompanyModel.findById(req.companyId);
  if (!company) throw ApiError.notFound("Company not found");

  if (!company.stripe?.accountId) {
    const account = await stripe.accounts.create({
      // Controller properties (modern Connect): platform takes liability and pays Stripe
      // fees, connected account gets the Express dashboard.
      controller: {
        losses: { payments: "application" },
        fees: { payer: "application" },
        stripe_dashboard: { type: "express" },
        requirement_collection: "stripe",
      },
      email: company.registrationEmail,
      business_profile: { name: company.companyName },
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      metadata: { companyId: company._id.toString() },
    });
    company.stripe.accountId = account.id;
    await company.save();
  }

  const accountLink = await stripe.accountLinks.create({
    account: company.stripe.accountId,
    refresh_url: `${SETTINGS_RETURN_URL}&refresh=1`,
    return_url: `${SETTINGS_RETURN_URL}&connected=1`,
    type: "account_onboarding",
  });

  return sendSuccess(res, { data: { url: accountLink.url } });
});

/** Company-facing: retrieves the connected account from Stripe and syncs its capability flags. */
export const getConnectStatus = asyncHandler(async (req: Request, res: Response) => {
  const company = await CompanyModel.findById(req.companyId);
  if (!company) throw ApiError.notFound("Company not found");

  if (!company.stripe?.accountId) {
    return sendSuccess(res, {
      data: { connected: false, chargesEnabled: false, payoutsEnabled: false, detailsSubmitted: false },
    });
  }

  const account = await stripe.accounts.retrieve(company.stripe.accountId);
  syncStripeFlags(company, account);
  await company.save();

  return sendSuccess(res, {
    data: {
      connected: true,
      accountId: company.stripe.accountId,
      chargesEnabled: company.stripe.chargesEnabled,
      payoutsEnabled: company.stripe.payoutsEnabled,
      detailsSubmitted: company.stripe.detailsSubmitted,
    },
  });
});

/** Applies a completed Stripe payment to its invoice, idempotently (safe on webhook retries). */
async function applyStripePaymentToInvoice(params: {
  invoiceId: string;
  paymentIntentId: string;
  amount: number;
}) {
  const { invoiceId, paymentIntentId, amount } = params;
  const invoice = await InvoiceModel.findById(invoiceId);
  if (!invoice) {
    logger.warn("Stripe webhook: invoice not found for payment", { invoiceId, paymentIntentId });
    return;
  }

  // Dedupe: if we already recorded this PaymentIntent, do nothing.
  if (invoice.paymentHistory.some((p) => p.stripePaymentIntentId === paymentIntentId)) {
    return;
  }

  invoice.paymentHistory.push({
    amount,
    paidOn: new Date(),
    method: PaymentMethod.CARD,
    reference: paymentIntentId,
    stripePaymentIntentId: paymentIntentId,
  });
  invoice.amountPaid = Math.round((invoice.amountPaid + amount) * 100) / 100;
  applyPaymentStatus(invoice);
  await invoice.save();
  await syncClientTotals(invoice.companyId, invoice.clientId);

  void createNotification({
    companyId: invoice.companyId,
    type: "invoice_paid",
    title: invoice.status === "paid" ? "Invoice paid" : "Payment received",
    body: `Invoice ${invoice.invoiceNumber} received an online payment.`,
    link: `/invoices/${invoice._id}`,
  });
}

/**
 * Stripe webhook. Mounted with a raw body parser BEFORE express.json so the signature can be
 * verified. Handles online invoice payments and connected-account capability updates.
 */
export const handleStripeWebhook = asyncHandler(async (req: Request, res: Response) => {
  const signature = req.headers["stripe-signature"];
  if (!signature) throw ApiError.badRequest("Missing Stripe signature");

  let event: Stripe.Event;
  try {
    // Async variant: works under Bun, where Stripe selects the async-only Web Crypto provider.
    event = await stripe.webhooks.constructEventAsync(
      req.body,
      signature,
      env.STRIPE_WEBHOOK_SECRET,
    );
  } catch (err) {
    logger.warn("Stripe webhook signature verification failed", { error: (err as Error).message });
    return res.status(400).send(`Webhook Error: ${(err as Error).message}`);
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.payment_status === "paid" && session.client_reference_id) {
        const currency = session.currency ?? "usd";
        const amount = fromStripeAmount(session.amount_total ?? 0, currency);
        const paymentIntentId =
          typeof session.payment_intent === "string"
            ? session.payment_intent
            : (session.payment_intent?.id ?? session.id);
        await applyStripePaymentToInvoice({
          invoiceId: session.client_reference_id,
          paymentIntentId,
          amount,
        });
      }
      break;
    }
    case "account.updated": {
      const account = event.data.object as Stripe.Account;
      const company = await CompanyModel.findOne({ "stripe.accountId": account.id });
      if (company) {
        syncStripeFlags(company, account);
        await company.save();
      }
      break;
    }
    default:
      break;
  }

  return res.json({ received: true });
});
