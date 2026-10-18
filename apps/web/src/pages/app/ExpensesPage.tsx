import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { formatPaisa, rupeesToPaisa, formatDate } from '../../utils/formatters';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Modal } from '../../components/common/Modal';
import { DollarSign, Plus, Calendar, Tag } from 'lucide-react';

export const ExpensesPage: React.FC = () => {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    category: 'WAREHOUSE_RENT',
    amountRupees: '',
    paymentMethod: 'CASH',
    description: '',
    referenceNumber: '',
  });

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const res: any = await api.get('/finance/expenses');
      setExpenses(Array.isArray(res) ? res : res.items || []);
    } catch (err) {
      console.error('Failed to load expenses:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/finance/expenses', {
        category: formData.category,
        amountPaisa: rupeesToPaisa(formData.amountRupees),
        paymentMethod: formData.paymentMethod,
        description: formData.description,
        referenceNumber: formData.referenceNumber || undefined,
      });

      setIsAddModalOpen(false);
      setFormData({
        category: 'WAREHOUSE_RENT',
        amountRupees: '',
        paymentMethod: 'CASH',
        description: '',
        referenceNumber: '',
      });
      fetchExpenses();
    } catch (err: any) {
      alert(err.message || 'Failed to record expense');
    }
  };

  const totalExpensePaisa = expenses.reduce((sum, exp) => sum + (exp.amountPaisa || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Wholesale Operating Expenses</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Track daily warehouse overhead, freight, fuel, vehicle maintenance, and payroll expenses.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          icon={<Plus className="w-4 h-4" />}
          onClick={() => setIsAddModalOpen(true)}
        >
          Record Expense
        </Button>
      </div>

      {/* Summary Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Recorded Overhead</span>
          <p className="text-2xl font-black text-slate-900 font-mono mt-1">{formatPaisa(totalExpensePaisa)}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-100">
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Description / Reference</th>
                <th className="py-3 px-4">Payment Method</th>
                <th className="py-3 px-4 text-right">Amount (PKR)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-slate-400">Loading expenses...</td>
                </tr>
              ) : expenses.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-slate-400">
                    No operating expenses recorded yet.
                  </td>
                </tr>
              ) : (
                expenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 text-slate-600">{formatDate(exp.createdAt)}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {exp.category?.replace(/_/g, ' ')}
                    </td>
                    <td className="py-3 px-4 text-slate-700">
                      {exp.description}
                      {exp.referenceNumber && (
                        <span className="block text-[11px] text-slate-400 font-mono">Ref: {exp.referenceNumber}</span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600">{exp.paymentMethod}</td>
                    <td className="py-3 px-4 text-right font-black font-mono text-rose-600 text-sm">
                      {formatPaisa(exp.amountPaisa)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Expense Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Record Wholesale Expense"
        description="Log an operational expenditure against warehouse or general administration."
        maxWidth="md"
      >
        <form onSubmit={handleCreateExpense} className="space-y-4">
          <Select
            label="Expense Category"
            required
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            options={[
              { value: 'WAREHOUSE_RENT', label: 'Warehouse / Shop Rent' },
              { value: 'LOGISTICS_FUEL', label: 'Delivery Vehicle Fuel' },
              { value: 'STAFF_SALARIES', label: 'Staff Salaries & Daily Wages' },
              { value: 'ELECTRICITY_UTILITY', label: 'Electricity & Utilities' },
              { value: 'PACKAGING_MATERIALS', label: 'Cartons & Packing Materials' },
              { value: 'MAINTENANCE_REPAIRS', label: 'Vehicle / Warehouse Repairs' },
              { value: 'TEA_MEALS', label: 'Office Tea & Meals' },
              { value: 'OTHER_EXPENSES', label: 'Other General Expenses' },
            ]}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Amount (PKR)"
              type="number"
              step="1"
              required
              value={formData.amountRupees}
              onChange={(e) => setFormData({ ...formData, amountRupees: e.target.value })}
              placeholder="e.g. 15000"
              prefixText="PKR"
            />
            <Select
              label="Payment Source"
              required
              value={formData.paymentMethod}
              onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
              options={[
                { value: 'CASH', label: 'Cash in Hand (Petty Cash)' },
                { value: 'BANK_TRANSFER', label: 'Bank Account' },
                { value: 'CHEQUE', label: 'Cheque' },
              ]}
            />
          </div>

          <Input
            label="Description / Purpose"
            required
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="e.g. October warehouse rent payment"
          />

          <Input
            label="Voucher / Cheque Reference (Optional)"
            value={formData.referenceNumber}
            onChange={(e) => setFormData({ ...formData, referenceNumber: e.target.value })}
            placeholder="e.g. Receipt #4810"
          />

          <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
            <Button variant="outline" size="sm" type="button" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Save Expense
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
