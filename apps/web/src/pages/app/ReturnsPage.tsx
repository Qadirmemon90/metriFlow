import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { formatPaisa, formatDate } from '../../utils/formatters';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { RotateCcw, Plus, CheckCircle2, AlertTriangle } from 'lucide-react';

export const ReturnsPage: React.FC = () => {
  const [returns, setReturns] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);

  const [returnForm, setReturnForm] = useState({
    invoiceId: '',
    productId: '',
    quantity: 1,
    isSellable: true,
    reason: 'CUSTOMER_EXCESS',
    notes: '',
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [returnsRes, invoicesRes]: any = await Promise.all([
        api.get('/finance/returns'),
        api.get('/sales/invoices', { limit: 50 }),
      ]);

      setReturns(Array.isArray(returnsRes) ? returnsRes : returnsRes.items || []);
      const invs = Array.isArray(invoicesRes) ? invoicesRes : invoicesRes.items || [];
      setInvoices(invs);

      if (invs.length > 0 && !returnForm.invoiceId) {
        setReturnForm((prev) => ({
          ...prev,
          invoiceId: invs[0].id,
          productId: invs[0].items?.[0]?.productId?._id || invs[0].items?.[0]?.productId || '',
        }));
        setSelectedInvoice(invs[0]);
      }
    } catch (err) {
      console.error('Failed to load returns data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleInvoiceChange = (invId: string) => {
    const inv = invoices.find((i) => i.id === invId);
    setSelectedInvoice(inv || null);
    const firstPId = inv?.items?.[0]?.productId?._id || inv?.items?.[0]?.productId || '';
    setReturnForm((prev) => ({
      ...prev,
      invoiceId: invId,
      productId: firstPId,
    }));
  };

  const handleReturnSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/finance/returns', {
        invoiceId: returnForm.invoiceId,
        productId: returnForm.productId,
        quantity: Number(returnForm.quantity),
        isSellable: returnForm.isSellable,
        reason: returnForm.reason,
        notes: returnForm.notes || undefined,
      });

      setIsReturnModalOpen(false);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to process customer return');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Customer Returns & Credit Notes</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Process return inspections: Sellable goods restore to on-hand inventory at original issue cost; damaged items route to quarantine.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          icon={<Plus className="w-4 h-4" />}
          onClick={() => setIsReturnModalOpen(true)}
        >
          Process Return
        </Button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-100">
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Item Returned</th>
                <th className="py-3 px-4 text-right">Quantity</th>
                <th className="py-3 px-4 text-center">Condition</th>
                <th className="py-3 px-4 text-right">Credit Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-400">Loading returns...</td>
                </tr>
              ) : returns.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    No customer returns processed yet.
                  </td>
                </tr>
              ) : (
                returns.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 text-slate-600">{formatDate(r.createdAt)}</td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      {r.invoiceNumber || r.invoiceId?.invoiceNumber || 'INV'}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-800">
                      {r.customerName || r.customerId?.name || 'Customer'}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-800">
                      {r.productSku || r.productId?.sku}
                    </td>
                    <td className="py-3 px-4 text-right font-black font-mono text-slate-900">
                      {r.quantity}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Badge variant={r.isSellable ? 'success' : 'danger'}>
                        {r.isSellable ? 'Sellable (Restocked)' : 'Damaged (Quarantine)'}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right font-black font-mono text-emerald-800 text-sm">
                      {formatPaisa(r.creditAmountPaisa)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Return Modal */}
      <Modal
        isOpen={isReturnModalOpen}
        onClose={() => setIsReturnModalOpen(false)}
        title="Process Customer Return"
        description="Inspect returned wholesale items and generate a Credit Note against the customer khata."
        maxWidth="md"
      >
        <form onSubmit={handleReturnSubmit} className="space-y-4">
          <Select
            label="Original Sales Invoice"
            required
            value={returnForm.invoiceId}
            onChange={(e) => handleInvoiceChange(e.target.value)}
            options={invoices.map((inv) => ({
              value: inv.id,
              label: `Invoice #${inv.invoiceNumber || inv.id.substring(0, 8)} — ${inv.customerName || inv.customerId?.name} (${formatPaisa(inv.totalPaisa)})`,
            }))}
          />

          {selectedInvoice && selectedInvoice.items && (
            <Select
              label="Select Line Item to Return"
              required
              value={returnForm.productId}
              onChange={(e) => setReturnForm({ ...returnForm, productId: e.target.value })}
              options={selectedInvoice.items.map((item: any) => ({
                value: item.productId?._id || item.productId?.id || item.productId,
                label: `${item.productSku || item.productId?.sku} — Qty Invoiced: ${item.quantity} (${formatPaisa(item.unitPricePaisa)}/ea)`,
              }))}
            />
          )}

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Quantity Returned"
              type="number"
              min="1"
              required
              value={returnForm.quantity}
              onChange={(e) => setReturnForm({ ...returnForm, quantity: Number(e.target.value) })}
            />
            <Select
              label="Physical Inspection"
              required
              value={returnForm.isSellable ? 'true' : 'false'}
              onChange={(e) => setReturnForm({ ...returnForm, isSellable: e.target.value === 'true' })}
              options={[
                { value: 'true', label: 'Sellable (Restock to On-Hand)' },
                { value: 'false', label: 'Damaged (Move to Quarantine)' },
              ]}
            />
          </div>

          <Select
            label="Return Reason"
            required
            value={returnForm.reason}
            onChange={(e) => setReturnForm({ ...returnForm, reason: e.target.value })}
            options={[
              { value: 'CUSTOMER_EXCESS', label: 'Customer Ordered Excess' },
              { value: 'TRANSIT_DAMAGE', label: 'Damaged in Transit' },
              { value: 'QUALITY_DEFECT', label: 'Manufacturing Defect' },
              { value: 'WRONG_ITEM', label: 'Incorrect Item Shipped' },
            ]}
          />

          <Input
            label="Inspection Notes"
            value={returnForm.notes}
            onChange={(e) => setReturnForm({ ...returnForm, notes: e.target.value })}
            placeholder="e.g. Returned unopened in original master carton"
          />

          <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
            <Button variant="outline" size="sm" type="button" onClick={() => setIsReturnModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Issue Credit Note & Restock
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
