import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { formatPaisa } from '../../utils/formatters';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { Truck, Plus, Search, Phone, MapPin } from 'lucide-react';

export const SuppliersPage: React.FC = () => {
  const [suppliers, setSuppliers] = useState<any[]>([]);
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
  });

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const res: any = await api.get('/master-data/suppliers', { search });
      setSuppliers(Array.isArray(res) ? res : res.items || []);
    } catch (err) {
      console.error('Failed to load suppliers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, [search]);

  const handleCreateSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/master-data/suppliers', {
        name: formData.name,
        contactPerson: formData.contactPerson || undefined,
        phone: formData.phone,
        city: formData.city,
        address: formData.address || undefined,
        ntn: formData.ntn || undefined,
      });

      setIsAddModalOpen(false);
      setFormData({
        name: '',
        contactPerson: '',
        phone: '',
        city: 'Karachi',
        address: '',
        ntn: '',
      });
      fetchSuppliers();
    } catch (err: any) {
      alert(err.message || 'Failed to create supplier');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Wholesale Suppliers & Vendors</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage product manufacturers, importers, payables (AP), and procurement contacts.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          icon={<Plus className="w-4 h-4" />}
          onClick={() => setIsAddModalOpen(true)}
        >
          Add Supplier
        </Button>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by supplier name, contact, or city..."
            className="w-full text-xs pl-9 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-100">
                <th className="py-3 px-4">Supplier / Vendor</th>
                <th className="py-3 px-4">Phone / City</th>
                <th className="py-3 px-4">Address</th>
                <th className="py-3 px-4 text-right">Payables Balance</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-slate-400">Loading suppliers...</td>
                </tr>
              ) : suppliers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-slate-400">
                    No suppliers found. Click "Add Supplier" to add your first procurement vendor.
                  </td>
                </tr>
              ) : (
                suppliers.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-900 block">{s.name}</span>
                      {s.contactPerson && <span className="text-[11px] text-slate-500">Attn: {s.contactPerson}</span>}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      <div className="flex items-center gap-1 font-mono">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{s.phone}</span>
                      </div>
                      <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-0.5">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span>{s.city}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-500 max-w-xs truncate">{s.address || '—'}</td>
                    <td className="py-3 px-4 text-right font-black font-mono text-slate-900">
                      {formatPaisa(s.balancePaisa || 0)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Badge variant={s.isActive ? 'success' : 'neutral'} size="sm">
                        {s.isActive ? 'Active' : 'Archived'}
                      </Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Wholesale Supplier"
        description="Register a vendor or manufacturer for goods receipt notes and procurement."
        maxWidth="lg"
      >
        <form onSubmit={handleCreateSupplier} className="space-y-4">
          <Input
            label="Supplier / Vendor Name"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g. Pakistan Steel Mills"
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Contact Person Name"
              value={formData.contactPerson}
              onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
              placeholder="e.g. Salman Qureshi"
            />
            <Input
              label="Phone Number"
              required
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+92 21 34567890"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="City"
              required
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              placeholder="e.g. Karachi"
            />
            <Input
              label="NTN / STRN"
              value={formData.ntn}
              onChange={(e) => setFormData({ ...formData, ntn: e.target.value })}
              placeholder="e.g. 1234567-8"
            />
          </div>

          <Input
            label="Office / Factory Address"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            placeholder="e.g. Plot 45, Sector 15, Korangi Industrial Area"
          />

          <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
            <Button variant="outline" size="sm" type="button" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Save Supplier
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
