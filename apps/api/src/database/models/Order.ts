import mongoose, { Document, Schema } from 'mongoose';
import { OrderStatus } from '@metriflow/contracts';

export interface IOrderItem {
  _id?: mongoose.Types.ObjectId;
  productId: mongoose.Types.ObjectId;
  sku: string;
  name: string;
  unit: string;
  orderedQuantity: number;
  reservedQuantity: number;
  dispatchedQuantity: number;
  cancelledQuantity: number;
  unitPricePaisa: number;
  discountPaisa: number;
  subtotalPaisa: number;
}

export interface IOrder extends Document {
  tenantId: mongoose.Types.ObjectId;
  orderNumber: string;
  customerId: mongoose.Types.ObjectId;
  warehouseId: mongoose.Types.ObjectId;
  status: OrderStatus;
  items: IOrderItem[];
  subtotalPaisa: number;
  discountPaisa: number;
  taxPaisa: number;
  totalAmountPaisa: number;
  deliveryAddress?: string;
  notes?: string;
  source: 'MANUAL' | 'WHATSAPP_AI' | 'FIELD_SALES';
  sourceDraftId?: mongoose.Types.ObjectId;
  assignedSalesmanId?: mongoose.Types.ObjectId;
  confirmedBy?: mongoose.Types.ObjectId;
  confirmedAt?: Date;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

const OrderItemSchema = new Schema<IOrderItem>(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    sku: { type: String, required: true },
    name: { type: String, required: true },
    unit: { type: String, default: 'Piece' },
    orderedQuantity: { type: Number, required: true, min: 0 },
    reservedQuantity: { type: Number, default: 0, min: 0 },
    dispatchedQuantity: { type: Number, default: 0, min: 0 },
    cancelledQuantity: { type: Number, default: 0, min: 0 },
    unitPricePaisa: { type: Number, required: true, min: 0 },
    discountPaisa: { type: Number, default: 0, min: 0 },
    subtotalPaisa: { type: Number, required: true, min: 0 },
  },
  { _id: true }
);

const OrderSchema = new Schema<IOrder>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    orderNumber: { type: String, required: true },
    customerId: { type: Schema.Types.ObjectId, ref: 'Customer', required: true },
    warehouseId: { type: Schema.Types.ObjectId, ref: 'Warehouse', required: true },
    status: { type: String, enum: Object.values(OrderStatus), default: OrderStatus.DRAFT },
    items: [OrderItemSchema],
    subtotalPaisa: { type: Number, required: true, default: 0 },
    discountPaisa: { type: Number, default: 0 },
    taxPaisa: { type: Number, default: 0 },
    totalAmountPaisa: { type: Number, required: true, default: 0 },
    deliveryAddress: { type: String },
    notes: { type: String },
    source: { type: String, enum: ['MANUAL', 'WHATSAPP_AI', 'FIELD_SALES'], default: 'MANUAL' },
    sourceDraftId: { type: Schema.Types.ObjectId, ref: 'OrderDraft' },
    assignedSalesmanId: { type: Schema.Types.ObjectId, ref: 'User' },
    confirmedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    confirmedAt: { type: Date },
    version: { type: Number, default: 1 },
  },
  { timestamps: true }
);

OrderSchema.index({ tenantId: 1, orderNumber: 1 }, { unique: true });
OrderSchema.index({ tenantId: 1, customerId: 1, status: 1 });
OrderSchema.index({ tenantId: 1, createdAt: -1 });

export const Order = mongoose.model<IOrder>('Order', OrderSchema);
