import mongoose, { Document, Schema } from 'mongoose';

export type AccountCode =
  | 'ACCOUNTS_RECEIVABLE'
  | 'SALES_REVENUE'
  | 'INVENTORY'
  | 'COST_OF_GOODS_SOLD'
  | 'CASH_BANK'
  | 'ACCOUNTS_PAYABLE'
  | 'CUSTOMER_CREDIT'
  | 'EXPENSE';

export interface IJournalLine {
  account: AccountCode;
  debitPaisa: number;
  creditPaisa: number;
  entityType?: 'CUSTOMER' | 'SUPPLIER';
  entityId?: mongoose.Types.ObjectId;
  description?: string;
}

export interface IJournalEntry extends Document {
  tenantId: mongoose.Types.ObjectId;
  entryNumber: string;
  entryDate: Date;
  lines: IJournalLine[];
  referenceType: 'INVOICE' | 'PAYMENT' | 'RETURN' | 'GRN' | 'EXPENSE' | 'OPENING';
  referenceId: string;
  actorId: mongoose.Types.ObjectId;
  notes?: string;
  createdAt: Date;
}

const JournalEntrySchema = new Schema<IJournalEntry>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    entryNumber: { type: String, required: true },
    entryDate: { type: Date, default: Date.now },
    lines: [
      {
        account: { type: String, required: true },
        debitPaisa: { type: Number, required: true, default: 0, min: 0 },
        creditPaisa: { type: Number, required: true, default: 0, min: 0 },
        entityType: { type: String, enum: ['CUSTOMER', 'SUPPLIER'] },
        entityId: { type: Schema.Types.ObjectId },
        description: { type: String },
      },
    ],
    referenceType: { type: String, required: true },
    referenceId: { type: String, required: true },
    actorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    notes: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

JournalEntrySchema.index({ tenantId: 1, entryNumber: 1 }, { unique: true });
JournalEntrySchema.index({ tenantId: 1, referenceType: 1, referenceId: 1 });
JournalEntrySchema.index({ tenantId: 1, entryDate: -1 });

export const JournalEntry = mongoose.model<IJournalEntry>('JournalEntry', JournalEntrySchema);
