import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { formatDate } from '../../utils/formatters';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Building, Search, ShieldCheck } from 'lucide-react';

export const AdminTenantsPage: React.FC = () => {
  const [tenants, setTenants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchTenants = async () => {
    try {
      setLoading(true);
      const res: any = await api.get('/platform/organizations');
      setTenants(Array.isArray(res) ? res : res.items || []);
    } catch (err) {
      console.error('Failed to load tenants:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTenants();
  }, []);

  const filtered = tenants.filter((t) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return t.name.toLowerCase().includes(s) || t.slug.toLowerCase().includes(s);
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-2">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Wholesale Tenant Organizations</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Registered customer tenants, database partitioning, and status management.
          </p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by organization name or slug..."
          className="w-full text-xs p-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
        />
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-100">
                <th className="py-3 px-4">Organization Name</th>
                <th className="py-3 px-4">Slug / Domain</th>
                <th className="py-3 px-4">Registered Date</th>
                <th className="py-3 px-4">Timezone / Currency</th>
                <th className="py-3 px-4 text-center">Tenant Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-slate-400">Loading organizations...</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-slate-400">No organizations found.</td>
                </tr>
              ) : (
                filtered.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4 font-bold text-slate-900">{t.name}</td>
                    <td className="py-3 px-4 font-mono text-slate-500">{t.slug}</td>
                    <td className="py-3 px-4 text-slate-600">{formatDate(t.createdAt)}</td>
                    <td className="py-3 px-4 font-mono text-slate-600">
                      {t.timezone || 'Asia/Karachi'} ({t.currency || 'PKR'})
                    </td>
                    <td className="py-3 px-4 text-center">
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
