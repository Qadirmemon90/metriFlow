import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { formatPaisa, formatDate } from '../../utils/formatters';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { CreditCard, CheckCircle2, XCircle, AlertCircle, ShieldCheck } from 'lucide-react';

export const AdminSubscriptionsPage: React.FC = () => {
  const [pendingSubs, setPendingSubs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSub, setSelectedSub] = useState<any | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      const res: any = await api.get('/platform/subscriptions/pending');
      setPendingSubs(Array.isArray(res) ? res : res.items || []);
    } catch (err) {
      console.error('Failed to load pending subscriptions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const handleVerify = async (subId: string) => {
    setActionLoading(true);
    try {
      await api.post(`/platform/subscriptions/${subId}/verify-payment`, {
        notes: 'Verified against Meezan Bank statement by Platform SuperAdmin',
      });
      setSelectedSub(null);
      alert('Subscription verified & activated! Formal monthly invoice issued to tenant.');
      fetchSubscriptions();
    } catch (err: any) {
      alert(err.message || 'Failed to verify subscription payment');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-2">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Manual Bank Transfer Billing Approvals
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit Pakistani B2B bank transfer slips and activate wholesale tenant subscriptions.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-100">
                <th className="py-3 px-4">Date Submitted</th>
                <th className="py-3 px-4">Tenant Organization</th>
                <th className="py-3 px-4">Plan</th>
                <th className="py-3 px-4">Bank Ref / Transaction ID</th>
                <th className="py-3 px-4 text-right">Amount (PKR)</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-400">Loading pending subscriptions...</td>
                </tr>
              ) : pendingSubs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    No pending bank transfer approvals. All subscriptions are verified!
                  </td>
                </tr>
              ) : (
                pendingSubs.map((sub) => (
                  <tr key={sub.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4 text-slate-600">{formatDate(sub.createdAt)}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{sub.organizationName || 'Tenant'}</td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-700">{sub.planTier}</td>
                    <td className="py-3 px-4 font-mono text-slate-800">
                      {sub.bankReference || 'IBFT-VERIFY'}
                    </td>
                    <td className="py-3 px-4 text-right font-black font-mono text-emerald-800 text-sm">
                      {formatPaisa(sub.amountPaisa || 1850000)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Badge variant="warning">Awaiting Audit</Badge>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Button
                        variant="primary"
                        size="sm"
                        className="text-xs"
                        icon={<CheckCircle2 className="w-3.5 h-3.5" />}
                        onClick={() => setSelectedSub(sub)}
                      >
                        Audit & Approve
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Audit Modal */}
      {selectedSub && (
        <Modal
          isOpen={!!selectedSub}
          onClose={() => setSelectedSub(null)}
          title="Audit Bank Transfer Slip"
          description="Confirm that the funds have cleared in MetriFlow's Meezan Bank or HBL account before activating."
          maxWidth="md"
        >
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Tenant:</span>
                <span className="font-bold text-slate-900">{selectedSub.organizationName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Plan Selected:</span>
                <span className="font-bold text-slate-900">{selectedSub.planTier}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Amount:</span>
                <span className="font-mono font-black text-slate-900 text-sm">
                  {formatPaisa(selectedSub.amountPaisa || 1850000)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Bank Ref:</span>
                <span className="font-mono text-slate-800 font-bold">{selectedSub.bankReference}</span>
              </div>
            </div>

            <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
              <Button variant="outline" size="sm" onClick={() => setSelectedSub(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                isLoading={actionLoading}
                onClick={() => handleVerify(selectedSub.id)}
                icon={<ShieldCheck className="w-4 h-4" />}
              >
                Confirm Bank Credit & Activate
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
