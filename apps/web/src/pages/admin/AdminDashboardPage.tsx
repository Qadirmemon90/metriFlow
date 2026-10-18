import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { formatPaisa, formatDate } from '../../utils/formatters';
import { StatsCard } from '../../components/common/StatsCard';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import {
  ShieldCheck,
  Building,
  CreditCard,
  Activity,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';

export const AdminDashboardPage: React.FC = () => {
  const [metrics, setMetrics] = useState({
    totalTenants: 0,
    activeSubscriptions: 0,
    pendingPaymentsCount: 0,
    systemStatus: 'HEALTHY',
    recentTenants: [] as any[],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        setLoading(true);
        const [tenantsRes, subsRes, healthRes]: any = await Promise.all([
          api.get('/platform/organizations'),
          api.get('/platform/subscriptions/pending'),
          api.get('/ready').catch(() => ({ status: 'DOWN' })),
        ]);

        const tenants = Array.isArray(tenantsRes) ? tenantsRes : tenantsRes.items || [];
        const pendingSubs = Array.isArray(subsRes) ? subsRes : subsRes.items || [];

        setMetrics({
          totalTenants: tenants.length,
          activeSubscriptions: tenants.filter((t: any) => t.subscriptionStatus === 'ACTIVE').length,
          pendingPaymentsCount: pendingSubs.length,
          systemStatus: healthRes.status === 'READY' ? 'OPERATIONAL' : 'DEGRADED',
          recentTenants: tenants.slice(0, 5),
        });
      } catch (err) {
        console.error('Failed to load admin metrics:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAdminData();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-2">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Platform Administration</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            MetriFlow multi-tenant SaaS oversight, manual bank transfer billing verification, and infrastructure health.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatsCard
          title="Total Organizations"
          value={String(metrics.totalTenants)}
          subtitle="Registered wholesale tenants"
          icon={<Building className="w-5 h-5 text-slate-700" />}
          color="navy"
        />
        <StatsCard
          title="Active Subscriptions"
          value={String(metrics.activeSubscriptions)}
          subtitle="Paid wholesale accounts"
          icon={<ShieldCheck className="w-5 h-5 text-emerald-700" />}
          color="emerald"
        />
        <StatsCard
          title="Pending Bank Payments"
          value={String(metrics.pendingPaymentsCount)}
          subtitle="Bank transfer receipts to audit"
          icon={<CreditCard className="w-5 h-5 text-amber-700" />}
          color="amber"
        />
        <StatsCard
          title="Core Cluster Health"
          value={metrics.systemStatus}
          subtitle="DB ReplicaSet + BullMQ Worker"
          icon={<Activity className="w-5 h-5 text-teal-700" />}
          color="sky"
        />
      </div>

      {metrics.pendingPaymentsCount > 0 && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <div>
              <span className="text-xs font-bold text-amber-900 block">
                {metrics.pendingPaymentsCount} Bank Transfer Receipts Awaiting Audited Verification
              </span>
              <span className="text-[11px] text-amber-700">
                Pakistani B2B tenants have uploaded payment slips for monthly subscription renewals.
              </span>
            </div>
          </div>
          <Link to="/admin/subscriptions">
            <Button variant="primary" size="sm" icon={<ArrowRight className="w-4 h-4" />}>
              Review Receipts
            </Button>
          </Link>
        </div>
      )}

      {/* Recent Tenants */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900">Recently Registered Organizations</h2>
          <Link to="/admin/tenants" className="text-xs text-rose-600 hover:text-rose-700 font-bold">
            View All Organizations
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-100">
                <th className="py-2.5 px-3">Organization Name</th>
                <th className="py-2.5 px-3">Slug / Domain</th>
                <th className="py-2.5 px-3">Created Date</th>
                <th className="py-2.5 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {metrics.recentTenants.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-8 text-slate-400">No organizations found.</td>
                </tr>
              ) : (
                metrics.recentTenants.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-bold text-slate-900">{t.name}</td>
                    <td className="py-2.5 px-3 font-mono text-slate-500">{t.slug}</td>
                    <td className="py-2.5 px-3 text-slate-600">{formatDate(t.createdAt)}</td>
                    <td className="py-2.5 px-3 text-center">
                      <Badge variant="success">Active</Badge>
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
