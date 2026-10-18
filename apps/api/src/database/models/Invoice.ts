import mongoose, { Document, Schema } from 'mongoose';

export interface IInvoiceItem {
  productId: mongoose.Types.ObjectId;
  sku: string;
  name: string;
  quantity: number;
  unit: string;
  unitPricePaisa: number;
  discountPaisa: number;
  subtotalPaisa: number;
}

export interface IInvoice extends Document {
  tenantId: mongoose.Types.ObjectId;
  invoiceNumber: string;
  orderId: mongoose.Types.ObjectId;
  dispatchId: mongoose.Types.ObjectId;
  customerId: mongoose.Types.ObjectId;
  customerName: string;
  items: IInvoiceItem[];
  subtotalPaisa: number;
  taxPaisa: number;
  totalAmountPaisa: number;
  paidAmountPaisa: number;
  balanceDuePaisa: number;
  status: 'UNPAID' | 'PARTIALLY_PAID' | 'PAID';
  issueDate: Date;
  dueDate: Date;
  pdfStoragePath?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const InvoiceSchema = new Schema<IInvoice>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    invoiceNumber: { type: String, required: true },
    orderId: { type: Schema.Types.ObjectId, ref: 'Order', required: true },
    dispatchId: { type: Schema.Types.ObjectId, ref: 'Dispatch', required: true },
    customerId: { type: Schema.Types.ObjectId, ref: 'Customer', required: true },
    customerName: { type: String, required: true },
    items: [
      {
        productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
        sku: { type: String, required: true },
        name: { type: String, required: true },
        quantity: { type: Number, required: true },
        unit: { type: String, default: 'Piece' },
        unitPricePaisa: { type: Number, required: true },
        discountPaisa: { type: Number, default: 0 },
        subtotalPaisa: { type: Number, required: true },
      },
    ],
    subtotalPaisa: { type: Number, required: true },
    taxPaisa: { type: Number, default: 0 },
    totalAmountPaisa: { type: Number, required: true },
    paidAmountPaisa: { type: Number, default: 0 },
    balanceDuePaisa: { type: Number, required: true },
    status: { type: String, enum: ['UNPAID', 'PARTIALLY_PAID', 'PAID'], default: 'UNPAID' },
    issueDate: { type: Date, default: Date.now },
    dueDate: { type: Date, required: true },
    pdfStoragePath: { type: String },
    notes: { type: String },
  },
  { timestamps: true }
);

InvoiceSchema.index({ tenantId: 1, invoiceNumber: 1 }, { unique: true });
InvoiceSchema.index({ tenantId: 1, customerId: 1, status: 1 });
InvoiceSchema.index({ tenantId: 1, issueDate: -1 });

export const Invoice = mongoose.model<IInvoice>('Invoice', InvoiceSchema);
