import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { formatPaisa, formatDate } from '../../utils/formatters';
import { StatsCard } from '../../components/common/StatsCard';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import {
  DollarSign,
  ShoppingCart,
  Clock,
  Layers,
  ArrowUpRight,
  PlusCircle,
  Truck,
  BookOpen,
  MessageSquare,
  AlertTriangle,
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { organization } = useAuth();
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    todaySalesPaisa: 0,
    totalOutstandingArPaisa: 0,
    cashCollectedTodayPaisa: 0,
    openOrdersCount: 0,
    lowStockCount: 0,
    recentOrders: [] as any[],
  });

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        const [ordersRes, arRes, inventoryRes, collectionsRes] = await Promise.allSettled([
          api.get<any[]>('/sales/orders', { limit: 5 }),
          api.get<any>('/finance/aging-report'),
          api.get<any[]>('/inventory/balances'),
          api.get<any[]>('/finance/collections', { limit: 10 }),
        ]);

        const orders = ordersRes.status === 'fulfilled' && Array.isArray(ordersRes.value) ? ordersRes.value : [];
        const ar = arRes.status === 'fulfilled' ? arRes.value : { totalArPaisa: 0 };
        const balances = inventoryRes.status === 'fulfilled' && Array.isArray(inventoryRes.value) ? inventoryRes.value : [];
        const collections = collectionsRes.status === 'fulfilled' && Array.isArray(collectionsRes.value) ? collectionsRes.value : [];

        // Compute metrics
        const lowStock = balances.filter((b) => b.availableQuantity <= 10).length;
        const openOrders = orders.filter((o) => ['DRAFT', 'CONFIRMED', 'PARTIALLY_DISPATCHED'].includes(o.status)).length;
        
        const todayCollected = collections
          .filter((c) => c.status === 'VERIFIED')
          .reduce((sum, c) => sum + (c.amountPaisa || 0), 0);

        const todaySales = orders
          .filter((o) => o.status !== 'CANCELLED')
          .reduce((sum, o) => sum + (o.totalPaisa || 0), 0);

        setMetrics({
          todaySalesPaisa: todaySales,
          totalOutstandingArPaisa: ar.totalArPaisa || 0,
          cashCollectedTodayPaisa: todayCollected,
          openOrdersCount: openOrders,
          lowStockCount: lowStock,
          recentOrders: orders.slice(0, 5),
        });
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

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

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Wholesale Command Center</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time stock reservation, collections verification, and recovery khata for {organization?.name}.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/app/orders/new">
            <Button variant="primary" size="sm" icon={<PlusCircle className="w-4 h-4" />}>
              Create Order
            </Button>
          </Link>
          <Link to="/app/whatsapp">
            <Button variant="outline" size="sm" icon={<MessageSquare className="w-4 h-4 text-emerald-600" />}>
              WhatsApp Inbox
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Outstanding AR"
          value={formatPaisa(metrics.totalOutstandingArPaisa)}
          subtitle="Customer khata receivable"
          icon={<DollarSign className="w-5 h-5 text-emerald-700" />}
          color="emerald"
        />
        <StatsCard
          title="Cash / Cheques Collected"
          value={formatPaisa(metrics.cashCollectedTodayPaisa)}
          subtitle="Verified payment receipts"
          icon={<DollarSign className="w-5 h-5 text-blue-700" />}
          color="navy"
        />
        <StatsCard
          title="Pending Wholesale Orders"
          value={String(metrics.openOrdersCount)}
          subtitle="Orders awaiting dispatch"
          icon={<ShoppingCart className="w-5 h-5 text-amber-700" />}
          color="amber"
        />
        <StatsCard
          title="Low Stock Items"
          value={String(metrics.lowStockCount)}
          subtitle="Available quantity <= 10"
          icon={<AlertTriangle className="w-5 h-5 text-rose-700" />}
          color="rose"
        />
      </div>

      {/* Quick Access Tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Link
          to="/app/orders/new"
          className="bg-white p-4 rounded-xl border border-slate-200 hover:border-emerald-500 shadow-sm transition flex items-center gap-3"
        >
          <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-700">
            <ShoppingCart className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-800 block">Book Order</span>
            <span className="text-[11px] text-slate-500">Atomic stock reservation</span>
          </div>
        </Link>

        <Link
          to="/app/collections"
          className="bg-white p-4 rounded-xl border border-slate-200 hover:border-emerald-500 shadow-sm transition flex items-center gap-3"
        >
          <div className="p-2.5 rounded-lg bg-blue-50 text-blue-700">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-800 block">Verify Collections</span>
            <span className="text-[11px] text-slate-500">Maker-checker approval</span>
          </div>
        </Link>

        <Link
          to="/app/khata"
          className="bg-white p-4 rounded-xl border border-slate-200 hover:border-emerald-500 shadow-sm transition flex items-center gap-3"
        >
          <div className="p-2.5 rounded-lg bg-teal-50 text-teal-700">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-800 block">Customer Khata</span>
            <span className="text-[11px] text-slate-500">Statements & balances</span>
          </div>
        </Link>

        <Link
          to="/app/inventory"
          className="bg-white p-4 rounded-xl border border-slate-200 hover:border-emerald-500 shadow-sm transition flex items-center gap-3"
        >
          <div className="p-2.5 rounded-lg bg-purple-50 text-purple-700">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-800 block">Receive Stock (GRN)</span>
            <span className="text-[11px] text-slate-500">Update WAC valuation</span>
          </div>
        </Link>
      </div>

      {/* Recent Orders & Quick Activity */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Recent Wholesale Orders</h2>
            <p className="text-xs text-slate-500 mt-0.5">Latest sales orders and fulfillment states.</p>
          </div>
          <Link to="/app/orders" className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1">
            <span>View All Orders</span>
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>

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
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {metrics.recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-400">
                    No orders booked yet. Click "Create Order" to create your first wholesale order.
                  </td>
                </tr>
              ) : (
                metrics.recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      {order.orderNumber || order.id.substring(0, 8)}
                    </td>
                    <td className="py-3 px-4 text-slate-600">{formatDate(order.createdAt)}</td>
                    <td className="py-3 px-4 font-medium text-slate-800">
                      {order.customerName || order.customerId?.name || 'Walk-in Customer'}
                    </td>
                    <td className="py-3 px-4 text-right text-slate-600">
                      {order.items?.length || 0}
                    </td>
                    <td className="py-3 px-4 text-right font-black text-slate-900">
                      {formatPaisa(order.totalPaisa)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {getOrderStatusBadge(order.status)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        to={`/app/orders/${order.id}`}
                        className="text-emerald-700 hover:text-emerald-900 font-bold"
                      >
                        Details
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
