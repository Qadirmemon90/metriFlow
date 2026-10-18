import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../../services/api';
import { formatPaisa, rupeesToPaisa, paisaToRupees } from '../../utils/formatters';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import {
  ArrowLeft,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  ShoppingCart,
} from 'lucide-react';

interface OrderLineItem {
  productId: string;
  sku: string;
  name: string;
  uom: string;
  availableStock: number;
  quantity: number;
  unitPriceRupees: number;
}

export const CreateOrderPage: React.FC = () => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [balances, setBalances] = useState<Record<string, number>>({});
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
  const [lineItems, setLineItems] = useState<OrderLineItem[]>([]);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchMasterData = async () => {
      try {
        setLoading(true);
        const [custRes, prodRes, balRes]: any = await Promise.all([
          api.get('/master-data/customers'),
          api.get('/master-data/products'),
          api.get('/inventory/balances'),
        ]);

        const custs = Array.isArray(custRes) ? custRes : custRes.items || [];
        const prods = Array.isArray(prodRes) ? prodRes : prodRes.items || [];
        const bals = Array.isArray(balRes) ? balRes : balRes.items || [];

        setCustomers(custs);
        setProducts(prods);

        // Map product ID to available stock
        const balMap: Record<string, number> = {};
        bals.forEach((b: any) => {
          const pId = b.productId?._id || b.productId?.id || b.productId;
          balMap[pId] = (balMap[pId] || 0) + (b.availableQuantity || 0);
        });
        setBalances(balMap);

        if (custs.length > 0) {
          setSelectedCustomerId(custs[0].id);
          setSelectedCustomer(custs[0]);
        }
      } catch (err) {
        console.error('Failed to load order master data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMasterData();
  }, []);

  const handleCustomerChange = (customerId: string) => {
    setSelectedCustomerId(customerId);
    const found = customers.find((c) => c.id === customerId);
    setSelectedCustomer(found || null);
  };

  const handleAddLineItem = () => {
    if (products.length === 0) return;
    const defaultProd = products[0];
    const wholesaleTier = defaultProd.priceTiers?.find((t: any) => t.tierName === 'WHOLESALE') || defaultProd.priceTiers?.[0];
    const priceRupees = wholesaleTier ? paisaToRupees(wholesaleTier.unitPricePaisa) : 100;

    const newItem: OrderLineItem = {
      productId: defaultProd.id,
      sku: defaultProd.sku,
      name: defaultProd.name,
      uom: defaultProd.uom || 'PCS',
      availableStock: balances[defaultProd.id] || 0,
      quantity: 1,
      unitPriceRupees: priceRupees,
    };

    setLineItems([...lineItems, newItem]);
  };

  const handleItemProductChange = (index: number, productId: string) => {
    const prod = products.find((p) => p.id === productId);
    if (!prod) return;

    const wholesaleTier = prod.priceTiers?.find((t: any) => t.tierName === 'WHOLESALE') || prod.priceTiers?.[0];
    const priceRupees = wholesaleTier ? paisaToRupees(wholesaleTier.unitPricePaisa) : 100;

    const updated = [...lineItems];
    updated[index] = {
      ...updated[index],
      productId: prod.id,
      sku: prod.sku,
      name: prod.name,
      uom: prod.uom || 'PCS',
      availableStock: balances[prod.id] || 0,
      unitPriceRupees: priceRupees,
    };
    setLineItems(updated);
  };

  const handleQuantityChange = (index: number, qty: number) => {
    const updated = [...lineItems];
    updated[index].quantity = Math.max(1, qty);
    setLineItems(updated);
  };

  const handlePriceChange = (index: number, price: number) => {
    const updated = [...lineItems];
    updated[index].unitPriceRupees = Math.max(0, price);
    setLineItems(updated);
  };

  const handleRemoveLineItem = (index: number) => {
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  // Financial calculations in Paisa
  const subtotalPaisa = lineItems.reduce(
    (sum, item) => sum + rupeesToPaisa(item.unitPriceRupees * item.quantity),
    0
  );
  const totalPaisa = subtotalPaisa;

  // Credit exposure calculation
  const customerCurrentBalance = selectedCustomer?.balancePaisa || 0;
  const customerCreditLimit = selectedCustomer?.creditLimitPaisa || 0;
  const newProjectedBalance = customerCurrentBalance + totalPaisa;
  const isCreditExceeded = customerCreditLimit > 0 && newProjectedBalance > customerCreditLimit;

  // Stock check
  const hasInsufficientStock = lineItems.some((item) => item.quantity > item.availableStock);

  const handleSubmit = async (confirmImmediately: boolean) => {
    if (lineItems.length === 0) {
      setError('Please add at least one line item to the order');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      // 1. Create order as Draft
      const orderPayload = {
        customerId: selectedCustomerId,
        notes: notes || undefined,
        items: lineItems.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPricePaisa: rupeesToPaisa(item.unitPriceRupees),
        })),
      };

      const createdOrder: any = await api.post('/sales/orders', orderPayload);

      // 2. If immediate confirmation requested, confirm it
      if (confirmImmediately && createdOrder?.id) {
        await api.post(`/sales/orders/${createdOrder.id}/confirm`);
      }

      navigate(`/app/orders/${createdOrder.id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to create wholesale order');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Top Bar */}
      <div className="flex items-center justify-between pb-2">
        <div className="flex items-center gap-3">
          <Link to="/app/orders">
            <Button variant="outline" size="sm" icon={<ArrowLeft className="w-4 h-4" />}>
              Orders
            </Button>
          </Link>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Create Wholesale Order</h1>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Customer Selection & Credit Headroom Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700">1. Select Buyer (Customer)</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-start">
          <Select
            label="Wholesale Customer"
            required
            value={selectedCustomerId}
            onChange={(e) => handleCustomerChange(e.target.value)}
            options={customers.map((c) => ({
              value: c.id,
              label: `${c.name} (${c.city || 'Pakistan'})`,
            }))}
          />

          {selectedCustomer && (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Current Khata Balance:</span>
                <span className="font-mono font-bold text-slate-900">
                  {formatPaisa(customerCurrentBalance)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Authorized Credit Limit:</span>
                <span className="font-mono text-slate-700">
                  {formatPaisa(customerCreditLimit)}
                </span>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-200">
                <span className="text-slate-500">Projected Balance After Order:</span>
                <span className={`font-mono font-black ${isCreditExceeded ? 'text-rose-600' : 'text-emerald-800'}`}>
                  {formatPaisa(newProjectedBalance)}
                </span>
              </div>
              {isCreditExceeded && (
                <div className="flex items-center gap-1.5 text-rose-600 font-bold text-[11px] pt-1">
                  <ShieldAlert className="w-4 h-4 flex-shrink-0" />
                  <span>Warning: This order will exceed the customer's credit limit!</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Line Items Table */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700">2. Order Items</h2>
          <Button
            type="button"
            variant="outline"
            size="sm"
            icon={<Plus className="w-4 h-4 text-emerald-600" />}
            onClick={handleAddLineItem}
          >
            Add Line Item
          </Button>
        </div>

        {lineItems.length === 0 ? (
          <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 text-xs">
            No items in order. Click "Add Line Item" to select products.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-100">
                  <th className="py-2.5 px-3">Product / SKU</th>
                  <th className="py-2.5 px-3 text-center">Available Stock</th>
                  <th className="py-2.5 px-3 text-right">Quantity</th>
                  <th className="py-2.5 px-3 text-right">Unit Rate (PKR)</th>
                  <th className="py-2.5 px-3 text-right">Line Total (PKR)</th>
                  <th className="py-2.5 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {lineItems.map((item, idx) => {
                  const lineTotal = item.quantity * item.unitPriceRupees;
                  const isStockShortage = item.quantity > item.availableStock;
                  return (
                    <tr key={idx} className={isStockShortage ? 'bg-amber-50/40' : ''}>
                      <td className="py-2 px-3 min-w-[200px]">
                        <select
                          value={item.productId}
                          onChange={(e) => handleItemProductChange(idx, e.target.value)}
                          className="w-full text-xs p-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                        >
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.sku} — {p.name} ({p.uom})
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-2 px-3 text-center font-mono font-bold">
                        <span className={item.availableStock <= 0 ? 'text-rose-600' : 'text-slate-700'}>
                          {item.availableStock} {item.uom}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-right">
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => handleQuantityChange(idx, Number(e.target.value))}
                          className="w-20 text-right text-xs p-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-emerald-500 font-mono"
                        />
                        {isStockShortage && (
                          <span className="block text-[10px] text-amber-700 font-semibold mt-0.5">
                            Exceeds stock
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-3 text-right">
                        <input
                          type="number"
                          step="0.01"
                          value={item.unitPriceRupees}
                          onChange={(e) => handlePriceChange(idx, Number(e.target.value))}
                          className="w-24 text-right text-xs p-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-emerald-500 font-mono"
                        />
                      </td>
                      <td className="py-2 px-3 text-right font-black font-mono text-slate-900">
                        {formatPaisa(rupeesToPaisa(lineTotal))}
                      </td>
                      <td className="py-2 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveLineItem(idx)}
                          className="text-slate-400 hover:text-rose-600 p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Financial Summary & Submission Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          <div className="flex-1 w-full sm:w-auto">
            <label className="block text-xs font-semibold text-slate-700 mb-1">Order Notes / Instructions</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Delivery via Faisal Movers Bilty, payment on 15 days"
              className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="w-full sm:w-72 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-500">Order Subtotal:</span>
              <span className="font-mono font-bold text-slate-800">{formatPaisa(subtotalPaisa)}</span>
            </div>
            <div className="flex justify-between font-bold text-sm pt-2 border-t border-slate-200">
              <span className="text-slate-900">Grand Total (PKR):</span>
              <span className="font-mono text-emerald-800 font-black">{formatPaisa(totalPaisa)}</span>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            size="md"
            isLoading={submitting}
            onClick={() => handleSubmit(false)}
          >
            Save as Draft Order
          </Button>

          <Button
            type="button"
            variant="primary"
            size="md"
            isLoading={submitting}
            onClick={() => handleSubmit(true)}
            icon={<CheckCircle2 className="w-4 h-4" />}
          >
            Confirm & Reserve Stock
          </Button>
        </div>
      </div>
    </div>
  );
};
