import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { formatPaisa, rupeesToPaisa, formatDate } from '../../utils/formatters';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import {
  DollarSign,
  Plus,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
  Search,
} from 'lucide-react';

export const CollectionsPage: React.FC = () => {
  const { user, hasPermission } = useAuth();
  const [collections, setCollections] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState<any | null>(null);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [error, setError] = useState('');

  // Submit Collection Form
  const [formData, setFormData] = useState({
    customerId: '',
    amountRupees: '',
    paymentMethod: 'BANK_TRANSFER',
    referenceNumber: '',
    notes: '',
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [collsRes, custsRes]: any = await Promise.all([
        api.get('/finance/collections'),
        api.get('/master-data/customers'),
      ]);

      const colls = Array.isArray(collsRes) ? collsRes : collsRes.items || [];
      const custs = Array.isArray(custsRes) ? custsRes : custsRes.items || [];

      setCollections(colls);
      setCustomers(custs);

      if (custs.length > 0 && !formData.customerId) {
        setFormData((prev) => ({ ...prev, customerId: custs[0].id }));
      }
    } catch (err) {
      console.error('Failed to load collections data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRecordCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/finance/collections', {
        customerId: formData.customerId,
        amountPaisa: rupeesToPaisa(formData.amountRupees),
        paymentMethod: formData.paymentMethod,
        referenceNumber: formData.referenceNumber || undefined,
        notes: formData.notes || undefined,
      });

      setIsSubmitModalOpen(false);
      setFormData({
        customerId: customers[0]?.id || '',
        amountRupees: '',
        paymentMethod: 'BANK_TRANSFER',
        referenceNumber: '',
        notes: '',
      });
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to submit payment collection');
    }
  };

  const handleVerifyCollection = async (collectionId: string) => {
    setVerifyLoading(true);
    setError('');
    try {
      await api.post(`/finance/collections/${collectionId}/verify`);
      setSelectedCollection(null);
      fetchData();
    } catch (err: any) {
      setError(err.message || 'Failed to verify payment collection');
    } finally {
      setVerifyLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING_VERIFICATION':
        return <Badge variant="warning">Pending Verification</Badge>;
      case 'VERIFIED':
        return <Badge variant="success">Verified (Posted to Khata)</Badge>;
      case 'REJECTED':
        return <Badge variant="danger">Rejected</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Payment Collections & Verification
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Maker-Checker institutional control: Field staff submit payments; independent accountants verify receipts before khata credit.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          icon={<Plus className="w-4 h-4" />}
          onClick={() => setIsSubmitModalOpen(true)}
        >
          Submit Payment Receipt
        </Button>
      </div>

      {/* Collections Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-100">
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Collected By</th>
                <th className="py-3 px-4">Method & Ref</th>
                <th className="py-3 px-4 text-right">Amount (PKR)</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-400">Loading collections...</td>
                </tr>
              ) : collections.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    No payment collections recorded yet.
                  </td>
                </tr>
              ) : (
                collections.map((c) => {
                  const isCollector = (c.collectedBy?._id || c.collectedBy?.id || c.collectedBy) === user?.id;
                  const canVerify = c.status === 'PENDING_VERIFICATION';

                  return (
                    <tr key={c.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4 text-slate-600">{formatDate(c.createdAt)}</td>
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {c.customerName || c.customerId?.name || 'Customer'}
                      </td>
                      <td className="py-3 px-4 text-slate-700">
                        {c.collectorName || c.collectedBy?.fullName || 'Staff Rep'}
                        {isCollector && (
                          <span className="ml-1 text-[10px] text-emerald-700 font-bold">(You)</span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600">
                        <span className="font-bold text-slate-800">{c.paymentMethod}</span>
                        {c.referenceNumber && (
                          <span className="block text-[11px] text-slate-400">Ref: {c.referenceNumber}</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right font-black font-mono text-emerald-800 text-sm">
                        {formatPaisa(c.amountPaisa)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {getStatusBadge(c.status)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {canVerify ? (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs"
                            onClick={() => setSelectedCollection(c)}
                          >
                            Review & Verify
                          </Button>
                        ) : (
                          <span className="text-[11px] text-slate-400 font-medium">Completed</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Submit Payment Modal */}
      <Modal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        title="Record Payment Collection"
        description="Submit cash, cheque, or bank transfer received from wholesale customer."
        maxWidth="md"
      >
        <form onSubmit={handleRecordCollection} className="space-y-4">
          <Select
            label="Wholesale Customer"
            required
            value={formData.customerId}
            onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
            options={customers.map((c) => ({
              value: c.id,
              label: `${c.name} — Balance: ${formatPaisa(c.balancePaisa || 0)}`,
            }))}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Amount Collected (PKR)"
              type="number"
              step="1"
              required
              value={formData.amountRupees}
              onChange={(e) => setFormData({ ...formData, amountRupees: e.target.value })}
              placeholder="e.g. 50000"
              prefixText="PKR"
            />
            <Select
              label="Payment Method"
              required
              value={formData.paymentMethod}
              onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
              options={[
                { value: 'BANK_TRANSFER', label: 'Online IBFT / Bank Transfer' },
                { value: 'CASH', label: 'Cash in Hand' },
                { value: 'CHEQUE', label: 'Bank Cheque' },
                { value: 'PAY_ORDER', label: 'Pay Order' },
              ]}
            />
          </div>

          <Input
            label="Reference / Cheque # / Deposit Slip"
            value={formData.referenceNumber}
            onChange={(e) => setFormData({ ...formData, referenceNumber: e.target.value })}
            placeholder="e.g. Meezan IBFT-984210"
          />

          <Input
            label="Collector Notes"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="e.g. Collected at Badami Bagh shop"
          />

          <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
            <Button variant="outline" size="sm" type="button" onClick={() => setIsSubmitModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Submit for Verification
            </Button>
          </div>
        </form>
      </Modal>

      {/* Verify Collection Modal */}
      {selectedCollection && (
        <Modal
          isOpen={!!selectedCollection}
          onClose={() => {
            setSelectedCollection(null);
            setError('');
          }}
          title="Maker-Checker: Verify Payment Receipt"
          description="Independent accountant approval. Verifying this collection will immediately credit the customer khata balance."
          maxWidth="md"
        >
          <div className="space-y-4 text-xs">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Customer:</span>
                <span className="font-bold text-slate-900">
                  {selectedCollection.customerName || selectedCollection.customerId?.name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Amount Received:</span>
                <span className="font-black text-slate-900 font-mono text-sm">
                  {formatPaisa(selectedCollection.amountPaisa)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Submitted By (Collector):</span>
                <span className="text-slate-800 font-semibold">
                  {selectedCollection.collectorName || selectedCollection.collectedBy?.fullName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Payment Instrument:</span>
                <span className="font-mono text-slate-700">
                  {selectedCollection.paymentMethod} {selectedCollection.referenceNumber ? `(${selectedCollection.referenceNumber})` : ''}
                </span>
              </div>
            </div>

            {/* Check Separation of Duties */}
            {(selectedCollection.collectedBy?._id || selectedCollection.collectedBy?.id || selectedCollection.collectedBy) === user?.id ? (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-2.5">
                <ShieldAlert className="w-5 h-5 flex-shrink-0 mt-0.5 text-rose-600" />
                <div>
                  <strong className="block font-bold">Separation of Duties Invariant Enforced:</strong>
                  <span>You submitted this payment collection. Under financial control policy, you cannot verify your own submission. An independent accountant or manager must verify it.</span>
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>Independent review verified. Ready to credit customer khata ledger.</span>
              </div>
            )}

            <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
              <Button variant="outline" size="sm" onClick={() => setSelectedCollection(null)}>
                Close
              </Button>
              <Button
                variant="primary"
                size="sm"
                isLoading={verifyLoading}
                disabled={
                  (selectedCollection.collectedBy?._id || selectedCollection.collectedBy?.id || selectedCollection.collectedBy) === user?.id
                }
                onClick={() => handleVerifyCollection(selectedCollection.id)}
                icon={<CheckCircle2 className="w-4 h-4" />}
              >
                Approve & Credit Khata
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
