import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../../services/api';
import { formatPaisa, formatDate } from '../../utils/formatters';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import {
  BookOpen,
  Printer,
  Share2,
  Phone,
  AlertCircle,
  TrendingDown,
  Calendar,
} from 'lucide-react';

export const KhataPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCustomerId = searchParams.get('customerId') || '';

  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState(initialCustomerId);
  const [ledgerEntries, setLedgerEntries] = useState<any[]>([]);
  const [customerData, setCustomerData] = useState<any | null>(null);
  const [agingData, setAgingData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch customers
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const res: any = await api.get('/master-data/customers');
        const list = Array.isArray(res) ? res : res.items || [];
        setCustomers(list);

        if (!selectedCustomerId && list.length > 0) {
          setSelectedCustomerId(list[0].id);
        }
      } catch (err) {
        console.error('Failed to load customers:', err);
      }
    };
    fetchCustomers();
  }, []);

  // Fetch customer khata ledger
  useEffect(() => {
    if (!selectedCustomerId) return;

    const fetchLedger = async () => {
      try {
        setLoading(true);
        const [custRes, ledgerRes, agingRes]: any = await Promise.all([
          api.get(`/master-data/customers/${selectedCustomerId}`),
          api.get(`/finance/customer-khata/${selectedCustomerId}`),
          api.get('/finance/aging-report'),
        ]);

        setCustomerData(custRes);
        setLedgerEntries(Array.isArray(ledgerRes) ? ledgerRes : ledgerRes.entries || []);

        const custAging = agingRes?.buckets?.find((b: any) => b.customerId === selectedCustomerId);
        setAgingData(custAging || null);
      } catch (err) {
        console.error('Failed to load customer khata:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchLedger();
  }, [selectedCustomerId]);

  const handleCustomerChange = (id: string) => {
    setSelectedCustomerId(id);
    setSearchParams({ customerId: id });
  };

  const handleWhatsAppShare = () => {
    if (!customerData) return;
    const balance = formatPaisa(customerData.balancePaisa || 0);
    const text = `Assalam-o-Alaikum ${customerData.name},\nThis is an automated balance statement from MetriFlow Wholesale.\nYour current khata balance payable is ${balance}.\nPlease clear outstanding invoices at your earliest convenience.\nThank you.`;
    const encoded = encodeURIComponent(text);
    const phone = customerData.phone?.replace(/[^0-9]/g, '') || '';
    window.open(`https://wa.me/${phone}?text=${encoded}`, '_blank');
  };

  const getEntryBadge = (type: string) => {
    switch (type) {
      case 'INVOICE': return <Badge variant="danger">Invoice (Debit)</Badge>;
      case 'PAYMENT': return <Badge variant="success">Payment (Credit)</Badge>;
      case 'RETURN_CREDIT': return <Badge variant="info">Return Credit</Badge>;
      case 'OPENING_BALANCE': return <Badge variant="neutral">Opening Balance</Badge>;
      default: return <Badge variant="neutral">{type}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 no-print">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Customer Khata Ledger</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Running accounts receivable balance, debit invoices, payment allocations, and WhatsApp statements.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            icon={<Share2 className="w-4 h-4 text-emerald-600" />}
            onClick={handleWhatsAppShare}
          >
            Share Statement on WhatsApp
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={<Printer className="w-4 h-4" />}
            onClick={() => window.print()}
          >
            Print Statement
          </Button>
        </div>
      </div>

      {/* Customer Selector Card */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div className="w-full sm:w-96">
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Select Customer
          </label>
          <select
            value={selectedCustomerId}
            onChange={(e) => handleCustomerChange(e.target.value)}
            className="w-full text-xs p-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
          >
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} — Bal: {formatPaisa(c.balancePaisa || 0)}
              </option>
            ))}
          </select>
        </div>

        {customerData && (
          <div className="flex items-center gap-6 text-xs text-slate-600">
            <div>
              <span className="text-slate-400 block">Phone:</span>
              <span className="font-mono font-bold text-slate-800">{customerData.phone}</span>
            </div>
            <div>
              <span className="text-slate-400 block">City:</span>
              <span className="font-bold text-slate-800">{customerData.city}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Credit Terms:</span>
              <span className="font-mono font-bold text-slate-800">{customerData.creditTermsDays} Days</span>
            </div>
          </div>
        )}
      </div>

      {/* Balance & Aging Breakdown Banner */}
      {customerData && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-slate-100">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Khata Balance Due</span>
              <p className="text-3xl font-black text-rose-600 font-mono mt-1">
                {formatPaisa(customerData.balancePaisa || 0)}
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Authorized Credit Limit</span>
              <p className="text-xl font-bold text-slate-800 font-mono mt-1">
                {formatPaisa(customerData.creditLimitPaisa || 0)}
              </p>
            </div>
          </div>

          {/* Aging Buckets */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 pt-6 text-xs text-center">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-500 block text-[11px] font-semibold">Not Due Yet</span>
              <span className="font-mono font-bold text-slate-800 mt-1 block">
                {formatPaisa(agingData?.currentPaisa || 0)}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-amber-50/50 border border-amber-200">
              <span className="text-amber-800 block text-[11px] font-semibold">1–30 Days Overdue</span>
              <span className="font-mono font-bold text-amber-900 mt-1 block">
                {formatPaisa(agingData?.days1_30Paisa || 0)}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
              <span className="text-amber-900 block text-[11px] font-semibold">31–60 Days Overdue</span>
              <span className="font-mono font-bold text-amber-900 mt-1 block">
                {formatPaisa(agingData?.days31_60Paisa || 0)}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200">
              <span className="text-rose-800 block text-[11px] font-semibold">61–90 Days Overdue</span>
              <span className="font-mono font-bold text-rose-900 mt-1 block">
                {formatPaisa(agingData?.days61_90Paisa || 0)}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-rose-100 border border-rose-300">
              <span className="text-rose-900 block text-[11px] font-black uppercase">Over 90 Days</span>
              <span className="font-mono font-black text-rose-950 mt-1 block">
                {formatPaisa(agingData?.daysOver90Paisa || 0)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Ledger Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 font-bold text-slate-900 text-sm">
          Statement Transaction History
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-100">
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Reference / Details</th>
                <th className="py-3 px-4 text-right">Debit (PKR)</th>
                <th className="py-3 px-4 text-right">Credit (PKR)</th>
                <th className="py-3 px-4 text-right">Running Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-slate-400 font-sans">
                    Loading customer khata ledger...
                  </td>
                </tr>
              ) : ledgerEntries.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400 font-sans">
                    No transactions recorded for this customer khata yet.
                  </td>
                </tr>
              ) : (
                ledgerEntries.map((e, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 text-slate-600 font-sans">{formatDate(e.date || e.createdAt)}</td>
                    <td className="py-3 px-4 font-sans">{getEntryBadge(e.type)}</td>
                    <td className="py-3 px-4 text-slate-800">
                      <span className="font-bold">{e.referenceNumber || e.description || '—'}</span>
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-rose-600">
                      {e.debitPaisa > 0 ? formatPaisa(e.debitPaisa) : '—'}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-emerald-700">
                      {e.creditPaisa > 0 ? formatPaisa(e.creditPaisa) : '—'}
                    </td>
                    <td className="py-3 px-4 text-right font-black text-slate-900">
                      {formatPaisa(e.balancePaisa)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
