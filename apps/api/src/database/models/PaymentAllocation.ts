import mongoose, { Document, Schema } from 'mongoose';

export interface IPaymentAllocation extends Document {
  tenantId: mongoose.Types.ObjectId;
  paymentCollectionId: mongoose.Types.ObjectId;
  invoiceId: mongoose.Types.ObjectId;
  customerId: mongoose.Types.ObjectId;
  allocatedAmountPaisa: number;
  allocatedBy: mongoose.Types.ObjectId;
  createdAt: Date;
}

const PaymentAllocationSchema = new Schema<IPaymentAllocation>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    paymentCollectionId: { type: Schema.Types.ObjectId, ref: 'PaymentCollection', required: true },
    invoiceId: { type: Schema.Types.ObjectId, ref: 'Invoice', required: true },
    customerId: { type: Schema.Types.ObjectId, ref: 'Customer', required: true },
    allocatedAmountPaisa: { type: Number, required: true, min: 1 },
    allocatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

PaymentAllocationSchema.index({ tenantId: 1, invoiceId: 1 });
PaymentAllocationSchema.index({ tenantId: 1, paymentCollectionId: 1 });

export const PaymentAllocation = mongoose.model<IPaymentAllocation>('PaymentAllocation', PaymentAllocationSchema);
