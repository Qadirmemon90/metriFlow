import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { formatPaisa, formatDate } from '../../utils/formatters';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { PrintableDocument } from '../../components/common/PrintableDocument';
import { FileText, Printer, ArrowLeft, Search, Eye } from 'lucide-react';

export const InvoicesPage: React.FC = () => {
  const { organization } = useAuth();
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId');

  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);
  const [search, setSearch] = useState('');

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (orderId) params.orderId = orderId;
      const res: any = await api.get('/sales/invoices', params);
      setInvoices(Array.isArray(res) ? res : res.items || []);
    } catch (err) {
      console.error('Failed to load invoices:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [orderId]);

  const getInvoiceStatusBadge = (status: string) => {
    switch (status) {
      case 'PAID': return <Badge variant="success">Paid in Full</Badge>;
      case 'PARTIAL': return <Badge variant="warning">Partially Paid</Badge>;
      case 'UNPAID': return <Badge variant="danger">Unpaid</Badge>;
      case 'VOID': return <Badge variant="neutral">Void</Badge>;
      default: return <Badge variant="neutral">{status}</Badge>;
    }
  };

  // If viewing a printable invoice
  if (selectedInvoice) {
    const cust = selectedInvoice.customerId || {};
    return (
      <PrintableDocument
        title="Commercial Sales Invoice"
        documentNumber={selectedInvoice.invoiceNumber || selectedInvoice.id.substring(0, 8)}
        type="INVOICE"
        organization={{
          name: organization?.name || 'MetriFlow Wholesale',
          address: 'Karachi, Pakistan',
          phone: '+92 (21) 3456-7890',
        }}
        recipient={{
          name: cust.name || selectedInvoice.customerName || 'Customer',
          phone: cust.phone,
          city: cust.city,
          address: cust.address,
          ntn: cust.ntn,
        }}
        metadata={{
          date: formatDate(selectedInvoice.createdAt),
          dueDate: formatDate(selectedInvoice.dueDate || selectedInvoice.createdAt),
          referenceOrder: selectedInvoice.orderId?.orderNumber || selectedInvoice.orderNumber,
        }}
        onBack={() => setSelectedInvoice(null)}
        footerNotes="Terms: Payments due strictly per agreed credit days. Cheques in favor of Wholesale Company."
      >
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b-2 border-slate-800 text-slate-800 uppercase font-black text-[11px]">
              <th className="py-2.5 px-3">Item Description</th>
              <th className="py-2.5 px-3 text-right">Quantity</th>
              <th className="py-2.5 px-3 text-right">Unit Rate (PKR)</th>
              <th className="py-2.5 px-3 text-right">Amount (PKR)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {selectedInvoice.items?.map((item: any, idx: number) => (
              <tr key={idx}>
                <td className="py-2.5 px-3">
                  <span className="font-bold text-slate-900 block font-mono">
                    {item.productSku || item.productId?.sku}
                  </span>
                  <span className="text-slate-600">{item.productName || item.productId?.name}</span>
                </td>
                <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                  {item.quantity}
                </td>
                <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                  {formatPaisa(item.unitPricePaisa)}
                </td>
                <td className="py-2.5 px-3 text-right font-mono font-black text-slate-900">
                  {formatPaisa(item.totalPaisa || item.quantity * item.unitPricePaisa)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-slate-800 font-bold text-sm">
              <td colSpan={3} className="py-3 px-3 text-right uppercase tracking-wider text-slate-800">
                Total Invoice Payable:
              </td>
              <td className="py-3 px-3 text-right font-mono font-black text-slate-900">
                {formatPaisa(selectedInvoice.totalPaisa)}
              </td>
            </tr>
          </tfoot>
        </table>
      </PrintableDocument>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Sales Invoices</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Issued commercial invoices, customer accounts receivable postings, and payment statuses.
          </p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by invoice number or customer..."
            className="w-full text-xs pl-9 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-100">
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4 text-right">Invoice Total</th>
                <th className="py-3 px-4 text-right">Paid Amount</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-400">Loading invoices...</td>
                </tr>
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    No invoices generated yet. Invoices are generated automatically upon order dispatch.
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      {inv.invoiceNumber || inv.id.substring(0, 8)}
                    </td>
                    <td className="py-3 px-4 text-slate-600">{formatDate(inv.createdAt)}</td>
                    <td className="py-3 px-4 font-medium text-slate-800">
                      {inv.customerName || inv.customerId?.name || 'Customer'}
                    </td>
                    <td className="py-3 px-4 text-right font-black font-mono text-slate-900">
                      {formatPaisa(inv.totalPaisa)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-emerald-700">
                      {formatPaisa(inv.paidPaisa || 0)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {getInvoiceStatusBadge(inv.status)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        icon={<Eye className="w-3.5 h-3.5" />}
                        onClick={() => setSelectedInvoice(inv)}
                      >
                        Print Invoice
                      </Button>
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
