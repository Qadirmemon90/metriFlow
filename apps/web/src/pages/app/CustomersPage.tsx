import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { formatPaisa, rupeesToPaisa } from '../../utils/formatters';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import {
  Users,
  Plus,
  Search,
  BookOpen,
  Phone,
  MapPin,
  ShieldAlert,
  Building,
} from 'lucide-react';

export const CustomersPage: React.FC = () => {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    contactPerson: '',
    phone: '',
    city: 'Karachi',
    address: '',
    ntn: '',
    creditLimitRupees: '100000',
    creditTermsDays: '30',
  });

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res: any = await api.get('/master-data/customers', { search });
      setCustomers(Array.isArray(res) ? res : res.items || []);
    } catch (err) {
      console.error('Failed to load customers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [search]);

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/master-data/customers', {
        name: formData.name,
        contactPerson: formData.contactPerson || undefined,
        phone: formData.phone,
        city: formData.city,
        address: formData.address || undefined,
        ntn: formData.ntn || undefined,
        creditLimitPaisa: rupeesToPaisa(formData.creditLimitRupees),
        creditTermsDays: Number(formData.creditTermsDays) || 30,
      });

      setIsAddModalOpen(false);
      setFormData({
        name: '',
        contactPerson: '',
        phone: '',
        city: 'Karachi',
        address: '',
        ntn: '',
        creditLimitRupees: '100000',
        creditTermsDays: '30',
      });
      fetchCustomers();
    } catch (err: any) {
      alert(err.message || 'Failed to create customer');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Wholesale Customers & Khata Accounts</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage buyer credit limits, payment terms, running receivables, and assigned sales representatives.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          icon={<Plus className="w-4 h-4" />}
          onClick={() => setIsAddModalOpen(true)}
        >
          Add Customer
        </Button>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by customer name, phone, or city..."
            className="w-full text-xs pl-9 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-100">
                <th className="py-3 px-4">Customer Name</th>
                <th className="py-3 px-4">Phone / City</th>
                <th className="py-3 px-4 text-right">Credit Limit</th>
                <th className="py-3 px-4 text-center">Credit Terms</th>
                <th className="py-3 px-4 text-right">Khata Balance</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-400">Loading customers...</td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    No customers found. Click "Add Customer" to add your first buyer.
                  </td>
                </tr>
              ) : (
                customers.map((c) => {
                  const isOverLimit = (c.balancePaisa || 0) > (c.creditLimitPaisa || 0) && (c.creditLimitPaisa || 0) > 0;
                  return (
                    <tr key={c.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-900 block">{c.name}</span>
                        {c.contactPerson && <span className="text-[11px] text-slate-500">Attn: {c.contactPerson}</span>}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        <div className="flex items-center gap-1 font-mono">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{c.phone}</span>
                        </div>
                        <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-0.5">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          <span>{c.city}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-700">
                        {formatPaisa(c.creditLimitPaisa)}
                      </td>
                      <td className="py-3 px-4 text-center font-mono text-slate-600">
                        {c.creditTermsDays} Days
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className={`font-black font-mono ${isOverLimit ? 'text-rose-600' : 'text-slate-900'}`}>
                          {formatPaisa(c.balancePaisa || 0)}
                        </span>
                        {isOverLimit && (
                          <div className="flex items-center justify-end gap-1 text-[10px] text-rose-600 font-bold mt-0.5">
                            <ShieldAlert className="w-3 h-3" />
                            <span>Over Limit</span>
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Badge variant={c.isActive ? 'success' : 'neutral'} size="sm">
                          {c.isActive ? 'Active' : 'Archived'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link
                          to={`/app/khata?customerId=${c.id}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-50 text-emerald-800 hover:bg-emerald-100 font-bold transition"
                        >
                          <BookOpen className="w-3 h-3" />
                          <span>Khata</span>
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Customer Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Register Wholesale Customer"
        description="Add a wholesale buyer with credit exposure limits and payment terms."
        maxWidth="lg"
      >
        <form onSubmit={handleCreateCustomer} className="space-y-4">
          <Input
            label="Wholesale Business / Customer Name"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g. Al-Madina Hardware Store"
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Contact Person Name"
              value={formData.contactPerson}
              onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
              placeholder="e.g. Haji Rashid"
            />
            <Input
              label="Phone / WhatsApp Number"
              required
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+92 300 1234567"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="City"
              required
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              placeholder="e.g. Lahore"
            />
            <Input
              label="NTN / STRN (Optional)"
              value={formData.ntn}
              onChange={(e) => setFormData({ ...formData, ntn: e.target.value })}
              placeholder="e.g. 1234567-8"
            />
          </div>

          <Input
            label="Shop / Warehouse Address"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            placeholder="e.g. Shop 14, Circular Road, Badami Bagh"
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Credit Limit (PKR)"
              type="number"
              step="1000"
              required
              value={formData.creditLimitRupees}
              onChange={(e) => setFormData({ ...formData, creditLimitRupees: e.target.value })}
              prefixText="PKR"
            />
            <Input
              label="Credit Terms (Days)"
              type="number"
              required
              value={formData.creditTermsDays}
              onChange={(e) => setFormData({ ...formData, creditTermsDays: e.target.value })}
              suffixText="Days"
            />
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
            <Button variant="outline" size="sm" type="button" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Register Customer
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
