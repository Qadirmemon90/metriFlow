import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { formatPaisa, formatDate } from '../../utils/formatters';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { ShoppingCart, Plus, Search, Eye } from 'lucide-react';

export const OrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<string>('ALL');
  const [search, setSearch] = useState('');

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (activeFilter !== 'ALL') params.status = activeFilter;
      const res: any = await api.get('/sales/orders', params);
      setOrders(Array.isArray(res) ? res : res.items || []);
    } catch (err) {
      console.error('Failed to load orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [activeFilter]);

  const getOrderStatusBadge = (status: string) => {
    switch (status) {
      case 'DRAFT': return <Badge variant="neutral">Draft</Badge>;
      case 'CONFIRMED': return <Badge variant="info">Confirmed (Stock Reserved)</Badge>;
      case 'PARTIALLY_DISPATCHED': return <Badge variant="warning">Partially Dispatched</Badge>;
      case 'DISPATCHED': return <Badge variant="success">Fully Dispatched</Badge>;
      case 'CANCELLED': return <Badge variant="danger">Cancelled</Badge>;
      default: return <Badge variant="neutral">{status}</Badge>;
    }
  };

  const filteredOrders = orders.filter((o) => {
    if (!search) return true;
    const s = search.toLowerCase();
    const num = (o.orderNumber || o.id).toLowerCase();
    const cust = (o.customerName || o.customerId?.name || '').toLowerCase();
    return num.includes(s) || cust.includes(s);
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Wholesale Orders</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Atomic stock reservations, customer credit checks, and partial dispatch workflows.
          </p>
        </div>

        <Link to="/app/orders/new">
          <Button variant="primary" size="sm" icon={<Plus className="w-4 h-4" />}>
            Create Order
          </Button>
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3 text-xs font-semibold">
        {['ALL', 'DRAFT', 'CONFIRMED', 'PARTIALLY_DISPATCHED', 'DISPATCHED', 'CANCELLED'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveFilter(tab)}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeFilter === tab
                ? 'bg-[#102A43] text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {tab.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by order number or customer name..."
            className="w-full text-xs pl-9 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-100">
                <th className="py-3 px-4">Order #</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4 text-right">Items</th>
                <th className="py-3 px-4 text-right">Total (PKR)</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-400">Loading orders...</td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    No orders found. Click "Create Order" to create one.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      {order.orderNumber || order.id.substring(0, 8)}
                    </td>
                    <td className="py-3 px-4 text-slate-600">{formatDate(order.createdAt)}</td>
                    <td className="py-3 px-4 font-medium text-slate-800">
                      {order.customerName || order.customerId?.name || 'Customer'}
                    </td>
                    <td className="py-3 px-4 text-right text-slate-600 font-mono">
                      {order.items?.length || 0}
                    </td>
                    <td className="py-3 px-4 text-right font-black font-mono text-slate-900">
                      {formatPaisa(order.totalPaisa)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {getOrderStatusBadge(order.status)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        to={`/app/orders/${order.id}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-100 text-slate-800 hover:bg-slate-200 font-bold transition"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Manage</span>
                      </Link>
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
