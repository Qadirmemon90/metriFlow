import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { formatPaisa, formatDate } from '../../utils/formatters';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import {
  Clock,
  PhoneCall,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  BookOpen,
  MessageSquare,
} from 'lucide-react';

export const RecoveryPage: React.FC = () => {
  const [agingData, setAgingData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
  const [isFollowUpModalOpen, setIsFollowUpModalOpen] = useState(false);

  const [followUpForm, setFollowUpForm] = useState({
    customerId: '',
    actionType: 'PHONE_CALL',
    notes: '',
    promiseDate: '',
    promisedAmountRupees: '',
  });

  const fetchAging = async () => {
    try {
      setLoading(true);
      const res: any = await api.get('/finance/aging-report');
      setAgingData(res);
    } catch (err) {
      console.error('Failed to load aging report:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAging();
  }, []);

  const handleOpenFollowUp = (customer: any) => {
    setSelectedCustomer(customer);
    setFollowUpForm({
      customerId: customer.customerId || customer.id,
      actionType: 'PHONE_CALL',
      notes: '',
      promiseDate: '',
      promisedAmountRupees: '',
    });
    setIsFollowUpModalOpen(true);
  };

  const handleFollowUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/finance/follow-ups', {
        customerId: followUpForm.customerId,
        actionType: followUpForm.actionType,
        notes: followUpForm.notes,
        promiseDate: followUpForm.promiseDate || undefined,
        promisedAmountPaisa: followUpForm.promisedAmountRupees
          ? Number(followUpForm.promisedAmountRupees) * 100
          : undefined,
      });

      setIsFollowUpModalOpen(false);
      alert('Follow-up record saved successfully!');
      fetchAging();
    } catch (err: any) {
      alert(err.message || 'Failed to record recovery follow-up');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Recovery & Khata Overdue Aging</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitor overdue debt aging, schedule recovery phone calls, and enforce customer promise-to-pay commitments.
          </p>
        </div>
      </div>

      {/* Aging KPI Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm text-center">
          <span className="text-xs font-semibold text-slate-500 block">Not Overdue</span>
          <p className="text-xl font-black text-slate-900 font-mono mt-1">
            {formatPaisa(agingData?.currentPaisa || 0)}
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-amber-200 shadow-sm text-center">
          <span className="text-xs font-semibold text-amber-700 block">1–30 Days</span>
          <p className="text-xl font-black text-amber-900 font-mono mt-1">
            {formatPaisa(agingData?.days1_30Paisa || 0)}
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-amber-300 shadow-sm text-center">
          <span className="text-xs font-semibold text-amber-800 block">31–60 Days</span>
          <p className="text-xl font-black text-amber-900 font-mono mt-1">
            {formatPaisa(agingData?.days31_60Paisa || 0)}
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-rose-200 shadow-sm text-center">
          <span className="text-xs font-semibold text-rose-700 block">61–90 Days</span>
          <p className="text-xl font-black text-rose-900 font-mono mt-1">
            {formatPaisa(agingData?.days61_90Paisa || 0)}
          </p>
        </div>

        <div className="bg-rose-50 p-4 rounded-2xl border border-rose-300 shadow-sm text-center">
          <span className="text-xs font-black uppercase text-rose-900 block">Over 90 Days (Critical)</span>
          <p className="text-xl font-black text-rose-950 font-mono mt-1">
            {formatPaisa(agingData?.daysOver90Paisa || 0)}
          </p>
        </div>
      </div>

      {/* Customer Recovery Queue */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 font-bold text-slate-900 text-sm">
          Priority Customer Recovery Queue
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-100">
                <th className="py-3 px-4">Customer Name</th>
                <th className="py-3 px-4">Contact Phone</th>
                <th className="py-3 px-4 text-right">Current</th>
                <th className="py-3 px-4 text-right">1–30 Days</th>
                <th className="py-3 px-4 text-right">31–60 Days</th>
                <th className="py-3 px-4 text-right">61–90 Days</th>
                <th className="py-3 px-4 text-right">&gt; 90 Days</th>
                <th className="py-3 px-4 text-right">Total Balance</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {loading ? (
                <tr>
                  <td colSpan={9} className="text-center py-10 text-slate-400 font-sans">Loading aging accounts...</td>
                </tr>
              ) : !agingData?.buckets || agingData.buckets.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-slate-400 font-sans">
                    No overdue accounts found. All khata accounts are in good standing!
                  </td>
                </tr>
              ) : (
                agingData.buckets.map((b: any, idx: number) => {
                  const hasSevere = (b.daysOver90Paisa || 0) > 0 || (b.days61_90Paisa || 0) > 0;
                  return (
                    <tr key={idx} className={hasSevere ? 'bg-rose-50/40 hover:bg-rose-50/70' : 'hover:bg-slate-50/80'}>
                      <td className="py-3 px-4 font-sans font-bold text-slate-900">
                        {b.customerName || 'Customer'}
                      </td>
                      <td className="py-3 px-4 text-slate-600">{b.customerPhone || '—'}</td>
                      <td className="py-3 px-4 text-right text-slate-600">{formatPaisa(b.currentPaisa)}</td>
                      <td className="py-3 px-4 text-right text-amber-700">{formatPaisa(b.days1_30Paisa)}</td>
                      <td className="py-3 px-4 text-right text-amber-900 font-bold">{formatPaisa(b.days31_60Paisa)}</td>
                      <td className="py-3 px-4 text-right text-rose-700 font-bold">{formatPaisa(b.days61_90Paisa)}</td>
                      <td className="py-3 px-4 text-right text-rose-950 font-black">{formatPaisa(b.daysOver90Paisa)}</td>
                      <td className="py-3 px-4 text-right font-black text-slate-900 text-sm">
                        {formatPaisa(b.totalArPaisa)}
                      </td>
                      <td className="py-3 px-4 text-right font-sans">
                        <Button
                          variant="outline"
                          size="sm"
                          icon={<PhoneCall className="w-3.5 h-3.5 text-emerald-600" />}
                          onClick={() => handleOpenFollowUp(b)}
                        >
                          Log Call
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Follow-up Modal */}
      {selectedCustomer && (
        <Modal
          isOpen={isFollowUpModalOpen}
          onClose={() => setIsFollowUpModalOpen(false)}
          title={`Log Recovery Follow-Up: ${selectedCustomer.customerName}`}
          description="Record customer promise-to-pay date or dispute reasons."
          maxWidth="md"
        >
          <form onSubmit={handleFollowUpSubmit} className="space-y-4">
            <Select
              label="Contact Channel"
              required
              value={followUpForm.actionType}
              onChange={(e) => setFollowUpForm({ ...followUpForm, actionType: e.target.value })}
              options={[
                { value: 'PHONE_CALL', label: 'Phone Call with Shop Owner' },
                { value: 'MARKET_VISIT', label: 'In-Person Market / Shop Visit' },
                { value: 'WHATSAPP_NOTICE', label: 'WhatsApp Reminder Notice' },
                { value: 'FORMAL_LETTER', label: 'Formal Demand Notice' },
              ]}
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Promised Payment Date"
                type="date"
                value={followUpForm.promiseDate}
                onChange={(e) => setFollowUpForm({ ...followUpForm, promiseDate: e.target.value })}
              />
              <Input
                label="Promised Amount (PKR)"
                type="number"
                value={followUpForm.promisedAmountRupees}
                onChange={(e) => setFollowUpForm({ ...followUpForm, promisedAmountRupees: e.target.value })}
                placeholder="e.g. 50000"
                prefixText="PKR"
              />
            </div>

            <Input
              label="Call / Meeting Discussion Notes"
              required
              value={followUpForm.notes}
              onChange={(e) => setFollowUpForm({ ...followUpForm, notes: e.target.value })}
              placeholder="e.g. Owner agreed to clear Rs 50k via cheque on Tuesday..."
            />

            <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
              <Button variant="outline" size="sm" type="button" onClick={() => setIsFollowUpModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" type="submit">
                Save Follow-Up
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
