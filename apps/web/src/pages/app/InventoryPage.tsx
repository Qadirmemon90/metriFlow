import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { formatPaisa, rupeesToPaisa, formatDate, formatDateTime, formatQuantity } from '../../utils/formatters';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import {
  Layers,
  ArrowDownToLine,
  Sliders,
  History,
  AlertTriangle,
  CheckCircle2,
  Package,
} from 'lucide-react';

export const InventoryPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'balances' | 'movements'>('balances');
  const [balances, setBalances] = useState<any[]>([]);
  const [movements, setMovements] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isGrnModalOpen, setIsGrnModalOpen] = useState(false);
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);

  // GRN Form
  const [grnForm, setGrnForm] = useState({
    productId: '',
    warehouseId: '',
    quantity: '',
    unitCostRupees: '',
    reference: '',
  });

  // Adjust Form
  const [adjustForm, setAdjustForm] = useState({
    productId: '',
    warehouseId: '',
    quantityDelta: '',
    reason: 'INVENTORY_AUDIT',
    notes: '',
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [balancesRes, movementsRes, productsRes, branchesRes]: any = await Promise.all([
        api.get('/inventory/balances'),
        api.get('/inventory/movements', { limit: 50 }),
        api.get('/master-data/products'),
        api.get('/master-data/branches'),
      ]);

      setBalances(Array.isArray(balancesRes) ? balancesRes : balancesRes.items || []);
      setMovements(Array.isArray(movementsRes) ? movementsRes : movementsRes.items || []);
      
      const prods = Array.isArray(productsRes) ? productsRes : productsRes.items || [];
      setProducts(prods);

      const branches = Array.isArray(branchesRes) ? branchesRes : branchesRes.items || [];
      const allWhs: any[] = [];
      branches.forEach((b: any) => {
        if (b.warehouses) allWhs.push(...b.warehouses);
      });
      setWarehouses(allWhs);

      if (prods.length > 0 && !grnForm.productId) {
        setGrnForm((prev) => ({ ...prev, productId: prods[0].id }));
        setAdjustForm((prev) => ({ ...prev, productId: prods[0].id }));
      }
      if (allWhs.length > 0 && !grnForm.warehouseId) {
        setGrnForm((prev) => ({ ...prev, warehouseId: allWhs[0].id }));
        setAdjustForm((prev) => ({ ...prev, warehouseId: allWhs[0].id }));
      }
    } catch (err) {
      console.error('Failed to load inventory data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleGrnSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/inventory/receipts', {
        productId: grnForm.productId,
        warehouseId: grnForm.warehouseId || undefined,
        quantity: Number(grnForm.quantity),
        unitCostPaisa: rupeesToPaisa(grnForm.unitCostRupees),
        referenceNumber: grnForm.reference || undefined,
      });

      setIsGrnModalOpen(false);
      setGrnForm({
        productId: products[0]?.id || '',
        warehouseId: warehouses[0]?.id || '',
        quantity: '',
        unitCostRupees: '',
        reference: '',
      });
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to receive stock');
    }
  };

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/inventory/adjustments', {
        productId: adjustForm.productId,
        warehouseId: adjustForm.warehouseId || undefined,
        quantityDelta: Number(adjustForm.quantityDelta),
        reason: adjustForm.reason,
        notes: adjustForm.notes,
      });

      setIsAdjustModalOpen(false);
      setAdjustForm({
        productId: products[0]?.id || '',
        warehouseId: warehouses[0]?.id || '',
        quantityDelta: '',
        reason: 'INVENTORY_AUDIT',
        notes: '',
      });
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to adjust stock');
    }
  };

  const getMovementBadge = (type: string) => {
    switch (type) {
      case 'RECEIPT': return <Badge variant="success">Receipt (GRN)</Badge>;
      case 'DISPATCH': return <Badge variant="info">Dispatch</Badge>;
      case 'RETURN': return <Badge variant="purple">Customer Return</Badge>;
      case 'ADJUSTMENT': return <Badge variant="warning">Adjustment</Badge>;
      default: return <Badge variant="neutral">{type}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Stock Balances & Movements</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Physical stock formula: Available = OnHand - Reserved - Quarantined. Moving weighted-average costing.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            icon={<Sliders className="w-4 h-4 text-slate-600" />}
            onClick={() => setIsAdjustModalOpen(true)}
          >
            Stock Adjustment
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={<ArrowDownToLine className="w-4 h-4" />}
            onClick={() => setIsGrnModalOpen(true)}
          >
            Goods Receipt (GRN)
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 flex gap-6 text-xs font-bold">
        <button
          onClick={() => setActiveTab('balances')}
          className={`pb-3 border-b-2 transition ${
            activeTab === 'balances'
              ? 'border-emerald-700 text-emerald-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Stock Balances by Warehouse
        </button>
        <button
          onClick={() => setActiveTab('movements')}
          className={`pb-3 border-b-2 transition ${
            activeTab === 'movements'
              ? 'border-emerald-700 text-emerald-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Immutable Movement Log
        </button>
      </div>

      {/* Tab 1: Balances Table */}
      {activeTab === 'balances' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-100">
                  <th className="py-3 px-4">SKU / Item</th>
                  <th className="py-3 px-4">Warehouse</th>
                  <th className="py-3 px-4 text-right">On-Hand</th>
                  <th className="py-3 px-4 text-right">Reserved</th>
                  <th className="py-3 px-4 text-right">Quarantined</th>
                  <th className="py-3 px-4 text-right">Available</th>
                  <th className="py-3 px-4 text-right">WAC Valuation (PKR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-10 text-slate-400 font-sans">
                      Loading inventory balances...
                    </td>
                  </tr>
                ) : balances.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-slate-400 font-sans">
                      No stock balances found. Record a Goods Receipt Note (GRN) to receive stock.
                    </td>
                  </tr>
                ) : (
                  balances.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-900 block font-sans">
                          {b.productSku || b.productId?.sku}
                        </span>
                        <span className="text-[11px] text-slate-500 font-sans">
                          {b.productName || b.productId?.name}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600 font-sans">
                        {b.warehouseName || b.warehouseId?.name || 'Main Warehouse'}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900">
                        {formatQuantity(b.onHandQuantity)}
                      </td>
                      <td className="py-3 px-4 text-right text-amber-700">
                        {formatQuantity(b.reservedQuantity)}
                      </td>
                      <td className="py-3 px-4 text-right text-rose-600">
                        {formatQuantity(b.quarantinedQuantity || 0)}
                      </td>
                      <td className="py-3 px-4 text-right font-black text-emerald-800 text-sm">
                        {formatQuantity(b.availableQuantity)}
                      </td>
                      <td className="py-3 px-4 text-right font-black text-slate-900">
                        {formatPaisa(b.weightedAverageCostPaisa)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Movements Log */}
      {activeTab === 'movements' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-100">
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4">Movement Type</th>
                  <th className="py-3 px-4">SKU / Item</th>
                  <th className="py-3 px-4 text-right">Quantity</th>
                  <th className="py-3 px-4 text-right">Unit Cost (PKR)</th>
                  <th className="py-3 px-4">Reference / Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-10 text-slate-400">Loading movements...</td>
                  </tr>
                ) : movements.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-slate-400">
                      No stock movements recorded yet.
                    </td>
                  </tr>
                ) : (
                  movements.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4 text-slate-600">{formatDateTime(m.createdAt)}</td>
                      <td className="py-3 px-4">{getMovementBadge(m.movementType)}</td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {m.productSku || m.productId?.sku || 'SKU'}
                      </td>
                      <td className="py-3 px-4 text-right font-black font-mono text-slate-900">
                        {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-700">
                        {formatPaisa(m.unitCostPaisa)}
                      </td>
                      <td className="py-3 px-4 text-slate-600 font-mono text-[11px]">
                        {m.referenceNumber || m.reason || '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* GRN Modal */}
      <Modal
        isOpen={isGrnModalOpen}
        onClose={() => setIsGrnModalOpen(false)}
        title="Goods Receipt Note (GRN)"
        description="Receive incoming stock from supplier. Automatically recomputes moving weighted-average cost."
        maxWidth="md"
      >
        <form onSubmit={handleGrnSubmit} className="space-y-4">
          <Select
            label="Product"
            required
            value={grnForm.productId}
            onChange={(e) => setGrnForm({ ...grnForm, productId: e.target.value })}
            options={products.map((p) => ({
              value: p.id,
              label: `${p.sku} — ${p.name} (${p.uom})`,
            }))}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Quantity to Receive"
              type="number"
              step="1"
              required
              value={grnForm.quantity}
              onChange={(e) => setGrnForm({ ...grnForm, quantity: e.target.value })}
              placeholder="e.g. 100"
            />
            <Input
              label="Actual Unit Cost (PKR)"
              type="number"
              step="0.01"
              required
              value={grnForm.unitCostRupees}
              onChange={(e) => setGrnForm({ ...grnForm, unitCostRupees: e.target.value })}
              placeholder="100.00"
              prefixText="PKR"
            />
          </div>

          <Input
            label="Supplier Bilty / PO Reference"
            value={grnForm.reference}
            onChange={(e) => setGrnForm({ ...grnForm, reference: e.target.value })}
            placeholder="e.g. GRN-2026-001 / Bilty #9812"
          />

          <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
            <Button variant="outline" size="sm" type="button" onClick={() => setIsGrnModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Post Goods Receipt Note
            </Button>
          </div>
        </form>
      </Modal>

      {/* Adjustment Modal */}
      <Modal
        isOpen={isAdjustModalOpen}
        onClose={() => setIsAdjustModalOpen(false)}
        title="Controlled Stock Adjustment"
        description="Adjust on-hand inventory due to damages, stocktake counts, or discrepancies."
        maxWidth="md"
      >
        <form onSubmit={handleAdjustSubmit} className="space-y-4">
          <Select
            label="Product"
            required
            value={adjustForm.productId}
            onChange={(e) => setAdjustForm({ ...adjustForm, productId: e.target.value })}
            options={products.map((p) => ({
              value: p.id,
              label: `${p.sku} — ${p.name}`,
            }))}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Quantity Change (+ or -)"
              type="number"
              required
              value={adjustForm.quantityDelta}
              onChange={(e) => setAdjustForm({ ...adjustForm, quantityDelta: e.target.value })}
              placeholder="e.g. -5 or +10"
            />
            <Select
              label="Reason Code"
              required
              value={adjustForm.reason}
              onChange={(e) => setAdjustForm({ ...adjustForm, reason: e.target.value })}
              options={[
                { value: 'INVENTORY_AUDIT', label: 'Periodic Physical Audit' },
                { value: 'DAMAGE_IN_WAREHOUSE', label: 'Warehouse Damage' },
                { value: 'EXPIRY', label: 'Batch Expiry' },
                { value: 'OTHER', label: 'Other Correction' },
              ]}
            />
          </div>

          <Input
            label="Auditor Notes / Justification"
            required
            value={adjustForm.notes}
            onChange={(e) => setAdjustForm({ ...adjustForm, notes: e.target.value })}
            placeholder="Mandatory explanation for audit trail..."
          />

          <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
            <Button variant="outline" size="sm" type="button" onClick={() => setIsAdjustModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" size="sm" type="submit">
              Execute Adjustment
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
