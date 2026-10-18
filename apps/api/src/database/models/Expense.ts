import mongoose, { Document, Schema } from 'mongoose';

export interface IExpense extends Document {
  tenantId: mongoose.Types.ObjectId;
  expenseNumber: string;
  category: 'RENT' | 'FUEL_TRANSPORT' | 'UTILITIES' | 'SALARIES' | 'PACKAGING' | 'MAINTENANCE' | 'OTHER';
  amountPaisa: number;
  expenseDate: Date;
  paidTo?: string;
  paymentMethod: string;
  referenceNumber?: string;
  notes?: string;
  actorId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ExpenseSchema = new Schema<IExpense>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    expenseNumber: { type: String, required: true },
    category: { type: String, required: true },
    amountPaisa: { type: Number, required: true, min: 1 },
    expenseDate: { type: Date, default: Date.now },
    paidTo: { type: String },
    paymentMethod: { type: String, default: 'CASH' },
    referenceNumber: { type: String },
    notes: { type: String },
    actorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

ExpenseSchema.index({ tenantId: 1, expenseNumber: 1 }, { unique: true });
ExpenseSchema.index({ tenantId: 1, expenseDate: -1 });

export const Expense = mongoose.model<IExpense>('Expense', ExpenseSchema);
