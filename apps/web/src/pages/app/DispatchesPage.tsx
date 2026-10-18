import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { formatDate } from '../../utils/formatters';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { PrintableDocument } from '../../components/common/PrintableDocument';
import { Truck, Eye, Search, ArrowLeft } from 'lucide-react';

export const DispatchesPage: React.FC = () => {
  const { organization } = useAuth();
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId');

  const [dispatches, setDispatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDispatch, setSelectedDispatch] = useState<any | null>(null);
  const [search, setSearch] = useState('');

  const fetchDispatches = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (orderId) params.orderId = orderId;
      const res: any = await api.get('/sales/dispatches', params);
      setDispatches(Array.isArray(res) ? res : res.items || []);
    } catch (err) {
      console.error('Failed to load dispatches:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDispatches();
  }, [orderId]);

  if (selectedDispatch) {
    const cust = selectedDispatch.customerId || {};
    return (
      <PrintableDocument
        title="Delivery Challan (Bilty)"
        documentNumber={selectedDispatch.dispatchNumber || selectedDispatch.id.substring(0, 8)}
        type="CHALLAN"
        organization={{
          name: organization?.name || 'MetriFlow Wholesale',
          address: 'Karachi, Pakistan',
          phone: '+92 (21) 3456-7890',
        }}
        recipient={{
          name: cust.name || selectedDispatch.customerName || 'Customer',
          phone: cust.phone,
          city: cust.city,
          address: cust.address,
        }}
        metadata={{
          date: formatDate(selectedDispatch.createdAt),
          referenceOrder: selectedDispatch.orderId?.orderNumber || selectedDispatch.orderNumber,
          vehicleNumber: selectedDispatch.vehicleNumber,
          driverName: selectedDispatch.driverName,
          driverPhone: selectedDispatch.driverPhone,
        }}
        onBack={() => setSelectedDispatch(null)}
        footerNotes="Received the above listed goods in full and sound condition without any breakage or missing items."
      >
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b-2 border-slate-800 text-slate-800 uppercase font-black text-[11px]">
              <th className="py-2.5 px-3">Item / SKU Description</th>
              <th className="py-2.5 px-3">Unit</th>
              <th className="py-2.5 px-3 text-right">Dispatched Quantity</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {selectedDispatch.items?.map((item: any, idx: number) => (
              <tr key={idx}>
                <td className="py-2.5 px-3">
                  <span className="font-bold text-slate-900 block font-mono">
                    {item.productSku || item.productId?.sku}
                  </span>
                  <span className="text-slate-600">{item.productName || item.productId?.name}</span>
                </td>
                <td className="py-2.5 px-3 font-mono text-slate-600">{item.uom || 'PCS'}</td>
                <td className="py-2.5 px-3 text-right font-mono font-black text-slate-900 text-sm">
                  {item.quantity}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </PrintableDocument>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Dispatches & Delivery Challans</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Physical stock dispatches, vehicle carrier numbers, and delivery receipt acknowledgements.
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
            placeholder="Search by challan number, customer, or vehicle..."
            className="w-full text-xs pl-9 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-100">
                <th className="py-3 px-4">Challan #</th>
                <th className="py-3 px-4">Dispatch Date</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Vehicle / Driver</th>
                <th className="py-3 px-4 text-right">Items Shipped</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-400">Loading dispatches...</td>
                </tr>
              ) : dispatches.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    No dispatches recorded yet. Dispatches are created from confirmed orders.
                  </td>
                </tr>
              ) : (
                dispatches.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      {d.dispatchNumber || d.id.substring(0, 8)}
                    </td>
                    <td className="py-3 px-4 text-slate-600">{formatDate(d.createdAt)}</td>
                    <td className="py-3 px-4 font-medium text-slate-800">
                      {d.customerName || d.customerId?.name || 'Customer'}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {d.vehicleNumber ? (
                        <span className="font-mono font-bold text-slate-800">{d.vehicleNumber}</span>
                      ) : (
                        'Standard Delivery'
                      )}
                      {d.driverName && <span className="block text-[11px] text-slate-400">{d.driverName}</span>}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                      {d.items?.reduce((s: number, i: any) => s + (i.quantity || 0), 0) || 0}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Badge variant="success">Dispatched</Badge>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        icon={<Eye className="w-3.5 h-3.5" />}
                        onClick={() => setSelectedDispatch(d)}
                      >
                        Print Challan
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
