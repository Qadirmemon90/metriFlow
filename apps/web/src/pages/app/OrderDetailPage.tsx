import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { formatPaisa, formatDate, formatQuantity } from '../../utils/formatters';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';
import {
  ArrowLeft,
  CheckCircle2,
  Truck,
  XCircle,
  FileText,
  Printer,
  Calendar,
  User,
  AlertTriangle,
} from 'lucide-react';

export const OrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');

  // Dispatch Modal State
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false);
  const [dispatchQuantities, setDispatchQuantities] = useState<Record<string, number>>({});
  const [dispatchDetails, setDispatchDetails] = useState({
    vehicleNumber: '',
    driverName: '',
    driverPhone: '',
    notes: '',
  });

  // Cancel Modal State
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const res: any = await api.get(`/sales/orders/${id}`);
      setOrder(res);

      // Initialize dispatch quantities to remaining unfulfilled
      if (res && res.items) {
        const initialQty: Record<string, number> = {};
        res.items.forEach((item: any) => {
          const remaining = (item.quantity || 0) - (item.dispatchedQuantity || 0);
          initialQty[item.productId?._id || item.productId] = Math.max(0, remaining);
        });
        setDispatchQuantities(initialQty);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load order');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const handleConfirmOrder = async () => {
    setActionLoading(true);
    setError('');
    try {
      await api.post(`/sales/orders/${id}/confirm`);
      fetchOrder();
    } catch (err: any) {
      setError(err.message || 'Failed to confirm order and reserve stock');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDispatchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setError('');

    try {
      const itemsToDispatch = Object.entries(dispatchQuantities)
        .map(([productId, quantity]) => ({
          productId,
          quantity: Number(quantity),
        }))
        .filter((item) => item.quantity > 0);

      if (itemsToDispatch.length === 0) {
        setError('Please select at least one item quantity to dispatch');
        setActionLoading(false);
        return;
      }

      await api.post(`/sales/orders/${id}/dispatch`, {
        items: itemsToDispatch,
        vehicleNumber: dispatchDetails.vehicleNumber || undefined,
        driverName: dispatchDetails.driverName || undefined,
        driverPhone: dispatchDetails.driverPhone || undefined,
        notes: dispatchDetails.notes || undefined,
      });

      setIsDispatchModalOpen(false);
      fetchOrder();
    } catch (err: any) {
      setError(err.message || 'Failed to dispatch order items');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelOrder = async () => {
    setActionLoading(true);
    setError('');
    try {
      await api.post(`/sales/orders/${id}/cancel`, {
        reason: 'Customer requested cancellation of remaining items',
      });
      setIsCancelModalOpen(false);
      fetchOrder();
    } catch (err: any) {
      setError(err.message || 'Failed to cancel order remainder');
    } finally {
      setActionLoading(false);
    }
  };

  const getOrderStatusBadge = (status: string) => {
    switch (status) {
      case 'DRAFT': return <Badge variant="neutral">Draft (No Stock Reserved)</Badge>;
      case 'CONFIRMED': return <Badge variant="info">Confirmed (Stock Reserved)</Badge>;
      case 'PARTIALLY_DISPATCHED': return <Badge variant="warning">Partially Dispatched</Badge>;
      case 'DISPATCHED': return <Badge variant="success">Fully Dispatched</Badge>;
      case 'CANCELLED': return <Badge variant="danger">Cancelled</Badge>;
      default: return <Badge variant="neutral">{status}</Badge>;
    }
  };

  if (loading) {
    return <div className="text-center py-20 text-slate-400">Loading order details...</div>;
  }

  if (!order) {
    return (
      <div className="text-center py-20 space-y-3">
        <p className="text-sm font-semibold text-slate-700">Order not found.</p>
        <Link to="/app/orders">
          <Button variant="outline" size="sm">Back to Orders</Button>
        </Link>
      </div>
    );
  }

  const canConfirm = order.status === 'DRAFT';
  const canDispatch = ['CONFIRMED', 'PARTIALLY_DISPATCHED'].includes(order.status);
  const canCancel = ['DRAFT', 'CONFIRMED', 'PARTIALLY_DISPATCHED'].includes(order.status);

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
        <div className="flex items-center gap-3">
          <Link to="/app/orders">
            <Button variant="outline" size="sm" icon={<ArrowLeft className="w-4 h-4" />}>
              Orders
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight font-mono">
                Order #{order.orderNumber || order.id.substring(0, 8)}
              </h1>
              {getOrderStatusBadge(order.status)}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">Created on {formatDate(order.createdAt)}</p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {canConfirm && (
            <Button
              variant="primary"
              size="sm"
              icon={<CheckCircle2 className="w-4 h-4" />}
              isLoading={actionLoading}
              onClick={handleConfirmOrder}
            >
              Confirm & Reserve Stock
            </Button>
          )}

          {canDispatch && (
            <Button
              variant="success"
              size="sm"
              icon={<Truck className="w-4 h-4" />}
              onClick={() => setIsDispatchModalOpen(true)}
            >
              Dispatch Items
            </Button>
          )}

          {canCancel && (
            <Button
              variant="outline"
              size="sm"
              className="text-rose-600 border-rose-200 hover:bg-rose-50"
              icon={<XCircle className="w-4 h-4" />}
              onClick={() => setIsCancelModalOpen(true)}
            >
              Cancel Remainder
            </Button>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Order Info & Customer Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">Order Items & Fulfillment</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-100">
                  <th className="py-2.5 px-3">Item / SKU</th>
                  <th className="py-2.5 px-3 text-right">Ordered</th>
                  <th className="py-2.5 px-3 text-right">Dispatched</th>
                  <th className="py-2.5 px-3 text-right">Remaining</th>
                  <th className="py-2.5 px-3 text-right">Rate</th>
                  <th className="py-2.5 px-3 text-right">Line Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {order.items?.map((item: any, idx: number) => {
                  const ordered = item.quantity || 0;
                  const dispatched = item.dispatchedQuantity || 0;
                  const remaining = ordered - dispatched;
                  return (
                    <tr key={idx} className="hover:bg-slate-50/80">
                      <td className="py-2.5 px-3 font-medium text-slate-900">
                        {item.productSku || item.productId?.sku || 'SKU'}
                        <span className="block text-[11px] text-slate-500">
                          {item.productName || item.productId?.name}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">{ordered}</td>
                      <td className="py-2.5 px-3 text-right font-mono text-emerald-700">{dispatched}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-amber-700">{remaining}</td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                        {formatPaisa(item.unitPricePaisa)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-black text-slate-900">
                        {formatPaisa(item.totalPaisa || item.quantity * item.unitPricePaisa)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <div className="w-64 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Subtotal:</span>
                <span className="font-mono font-bold text-slate-800">{formatPaisa(order.subtotalPaisa)}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-200 font-bold text-sm">
                <span className="text-slate-900">Grand Total:</span>
                <span className="font-mono text-emerald-800 font-black">{formatPaisa(order.totalPaisa)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Customer & Delivery Info */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-3 text-xs">
            <span className="font-bold uppercase tracking-wider text-slate-500 block">Buyer Information</span>
            <p className="font-bold text-sm text-slate-900">
              {order.customerName || order.customerId?.name || 'Customer'}
            </p>
            {order.customerId?.phone && (
              <p className="text-slate-600">Phone: {order.customerId.phone}</p>
            )}
            {order.customerId?.city && (
              <p className="text-slate-600">City: {order.customerId.city}</p>
            )}
            {order.customerId?.address && (
              <p className="text-slate-600">Address: {order.customerId.address}</p>
            )}
            <div className="pt-2 border-t border-slate-100">
              <Link
                to={`/app/khata?customerId=${order.customerId?._id || order.customerId?.id || order.customerId}`}
                className="text-emerald-700 hover:text-emerald-900 font-bold flex items-center gap-1"
              >
                <span>View Customer Khata</span>
              </Link>
            </div>
          </div>

          {/* Linked Invoices & Dispatches */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-3 text-xs">
            <span className="font-bold uppercase tracking-wider text-slate-500 block">Linked Documents</span>
            <div className="space-y-2">
              <Link
                to={`/app/dispatches?orderId=${order.id}`}
                className="p-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 flex items-center justify-between transition"
              >
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-emerald-600" />
                  <span className="font-semibold text-slate-800">Delivery Challans</span>
                </div>
                <span className="text-[11px] text-slate-500">View</span>
              </Link>

              <Link
                to={`/app/invoices?orderId=${order.id}`}
                className="p-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 flex items-center justify-between transition"
              >
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-600" />
                  <span className="font-semibold text-slate-800">Sales Invoices</span>
                </div>
                <span className="text-[11px] text-slate-500">View</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Dispatch Modal */}
      <Modal
        isOpen={isDispatchModalOpen}
        onClose={() => setIsDispatchModalOpen(false)}
        title="Dispatch Items & Issue Challan"
        description="Select quantities to dispatch. Generates Delivery Challan and Sales Invoice."
        maxWidth="lg"
      >
        <form onSubmit={handleDispatchSubmit} className="space-y-4">
          <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="py-2 px-3">Item</th>
                  <th className="py-2 px-3 text-right">Remaining</th>
                  <th className="py-2 px-3 text-right">Qty to Ship</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {order.items?.map((item: any, idx: number) => {
                  const pId = item.productId?._id || item.productId?.id || item.productId;
                  const remaining = (item.quantity || 0) - (item.dispatchedQuantity || 0);
                  if (remaining <= 0) return null;
                  return (
                    <tr key={idx}>
                      <td className="py-2 px-3 font-medium">
                        {item.productSku || item.productId?.sku}
                      </td>
                      <td className="py-2 px-3 text-right font-mono text-slate-600">{remaining}</td>
                      <td className="py-2 px-3 text-right">
                        <input
                          type="number"
                          min="0"
                          max={remaining}
                          value={dispatchQuantities[pId] ?? remaining}
                          onChange={(e) =>
                            setDispatchQuantities({
                              ...dispatchQuantities,
                              [pId]: Math.min(remaining, Math.max(0, Number(e.target.value))),
                            })
                          }
                          className="w-20 text-right text-xs p-1 border border-slate-300 rounded font-mono"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Vehicle / Bilty Number"
              value={dispatchDetails.vehicleNumber}
              onChange={(e) => setDispatchDetails({ ...dispatchDetails, vehicleNumber: e.target.value })}
              placeholder="e.g. LES-19-4812"
            />
            <Input
              label="Driver / Carrier Name"
              value={dispatchDetails.driverName}
              onChange={(e) => setDispatchDetails({ ...dispatchDetails, driverName: e.target.value })}
              placeholder="e.g. Muhammad Aslam"
            />
          </div>

          <Input
            label="Driver Contact Number"
            value={dispatchDetails.driverPhone}
            onChange={(e) => setDispatchDetails({ ...dispatchDetails, driverPhone: e.target.value })}
            placeholder="+92 312 9876543"
          />

          <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
            <Button variant="outline" size="sm" type="button" onClick={() => setIsDispatchModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" isLoading={actionLoading} icon={<Truck className="w-4 h-4" />}>
              Issue Dispatch & Invoice
            </Button>
          </div>
        </form>
      </Modal>

      {/* Cancel Remainder Modal */}
      <Modal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        title="Cancel Order Remainder"
        description="Safely releases unfulfilled inventory reservations and commitments. Dispatched items and issued invoices will remain intact."
        maxWidth="md"
      >
        <div className="space-y-4 text-xs text-slate-600">
          <p>
            Are you sure you want to cancel the remainder of this wholesale order? 
            This action cannot be undone.
          </p>

          <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
            <Button variant="outline" size="sm" onClick={() => setIsCancelModalOpen(false)}>
              Back
            </Button>
            <Button variant="danger" size="sm" isLoading={actionLoading} onClick={handleCancelOrder}>
              Confirm Cancellation
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
