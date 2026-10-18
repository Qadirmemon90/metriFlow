import mongoose from 'mongoose';
import {
  Organization,
  User,
  PlanSubscription,
  SupportAccessGrant,
  ContactInquiry,
  AuditLog,
} from '../database/models/index.js';
import {
  SubmitManualBillingPaymentInput,
  VerifySubscriptionPaymentInput,
  GrantSupportAccessInput,
  PublicContactSubmissionInput,
  PlanTier,
  SubscriptionStatus,
} from '@metriflow/contracts';
import { AppError } from '../utils/errors.js';

export class PlatformService {
  async submitSubscriptionPayment(
    tenantId: mongoose.Types.ObjectId,
    input: SubmitManualBillingPaymentInput
  ) {
    const org = await Organization.findById(tenantId);
    if (!org) throw AppError.notFound('Organization not found.');

    const subscription = await PlanSubscription.create({
      tenantId,
      planTier: input.planTier,
      amountPaisa: parseInt(input.amountPaisa, 10),
      bankReferenceId: input.bankReferenceId,
      proofDocumentId: input.proofDocumentId,
      notes: input.notes,
      status: 'PENDING_APPROVAL',
    });

    return {
      message: 'Subscription payment submitted. Platform administrator will verify and activate your plan.',
      subscription,
    };
  }

  async verifySubscriptionPayment(
    input: VerifySubscriptionPaymentInput,
    superAdminId: string,
    traceId: string
  ) {
    const payment = await PlanSubscription.findById(input.paymentId);
    if (!payment) throw AppError.notFound('Payment record not found.');

    if (input.status === 'REJECTED') {
      payment.status = 'REJECTED';
      payment.rejectionReason = input.rejectionReason;
      payment.verifiedBy = new mongoose.Types.ObjectId(superAdminId);
      payment.verifiedAt = new Date();
      await payment.save();

      return { message: 'Subscription payment rejected.', payment };
    }

    // APPROVED
    payment.status = 'APPROVED';
    payment.verifiedBy = new mongoose.Types.ObjectId(superAdminId);
    payment.verifiedAt = new Date();
    payment.startDate = new Date();
    payment.endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
    await payment.save();

    // Update organization plan and entitlements
    const org = await Organization.findById(payment.tenantId);
    if (org) {
      org.planTier = payment.planTier;
      org.subscriptionStatus = SubscriptionStatus.ACTIVE;
      org.subscriptionEndsAt = payment.endDate;

      if (payment.planTier === PlanTier.STARTER) {
        org.maxUsers = 2;
        org.maxWarehouses = 1;
      } else if (payment.planTier === PlanTier.BUSINESS) {
        org.maxUsers = 5;
        org.maxWarehouses = 2;
      } else if (payment.planTier === PlanTier.PRO) {
        org.maxUsers = 10;
        org.maxWarehouses = 10;
      }

      await org.save();
    }

    await AuditLog.create({
      tenantId: payment.tenantId,
      actorId: new mongoose.Types.ObjectId(superAdminId),
      action: 'SUBSCRIPTION_ACTIVATED',
      entityType: 'PlanSubscription',
      entityId: payment._id.toString(),
      traceId,
      metadata: { planTier: payment.planTier, amountPaisa: payment.amountPaisa },
    });

    return {
      message: 'Subscription payment verified and plan activated successfully.',
      payment,
    };
  }

  async grantSupportAccess(
    input: GrantSupportAccessInput,
    superAdminId: string,
    traceId: string
  ) {
    const org = await Organization.findById(input.tenantId);
    if (!org) throw AppError.notFound('Target tenant organization not found.');

    const grant = await SupportAccessGrant.create({
      tenantId: org._id,
      superAdminId: new mongoose.Types.ObjectId(superAdminId),
      reason: input.reason,
      expiresAt: new Date(Date.now() + input.durationHours * 60 * 60 * 1000),
    });

    await AuditLog.create({
      tenantId: org._id,
      actorId: new mongoose.Types.ObjectId(superAdminId),
      action: 'SUPPORT_ACCESS_GRANTED',
      entityType: 'SupportAccessGrant',
      entityId: grant._id.toString(),
      traceId,
      metadata: { reason: input.reason, durationHours: input.durationHours },
    });

    return {
      message: `Audited support access granted for ${input.durationHours} hours.`,
      grant,
    };
  }

  async getPlatformMetrics() {
    const [totalOrganizations, totalUsers, pendingPayments] = await Promise.all([
      Organization.countDocuments(),
      User.countDocuments(),
      PlanSubscription.countDocuments({ status: 'PENDING_APPROVAL' }),
    ]);

    return {
      totalOrganizations,
      totalUsers,
      pendingPayments,
      systemStatus: 'HEALTHY',
      timestamp: new Date().toISOString(),
    };
  }

  async submitContactInquiry(input: PublicContactSubmissionInput) {
    const inquiry = await ContactInquiry.create(input);
    return {
      message: 'Thank you for contacting MetriFlow. Our enterprise sales team will connect with you shortly.',
      inquiryId: inquiry._id.toString(),
    };
  }
}

export const platformService = new PlatformService();
