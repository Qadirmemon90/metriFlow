import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { formatPaisa, formatDate } from '../../utils/formatters';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import {
  Settings,
  Building,
  Users,
  MessageSquare,
  CreditCard,
  Plus,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Copy,
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { organization, user } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'team' | 'whatsapp' | 'billing'>('profile');
  const [members, setMembers] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [waConfig, setWaConfig] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  // Invite Staff Modal
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    email: '',
    fullName: '',
    role: 'SALES_REP',
  });

  // Bank Transfer Payment Modal
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    amountRupees: '18500',
    bankReference: '',
    notes: '',
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [membersRes, branchesRes, waRes]: any = await Promise.all([
        api.get('/auth/members'),
        api.get('/master-data/branches'),
        api.get('/whatsapp/connection').catch(() => null),
      ]);

      setMembers(Array.isArray(membersRes) ? membersRes : membersRes.items || []);
      setBranches(Array.isArray(branchesRes) ? branchesRes : branchesRes.items || []);
      setWaConfig(waRes);
    } catch (err) {
      console.error('Failed to load settings data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleInviteStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/auth/invitations', inviteForm);
      setIsInviteModalOpen(false);
      setInviteForm({ email: '', fullName: '', role: 'SALES_REP' });
      alert('Staff invitation email dispatched!');
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to send invitation');
    }
  };

  const handleBankPaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/platform/subscriptions/payment-receipt', {
        amountPaisa: Number(paymentForm.amountRupees) * 100,
        bankReference: paymentForm.bankReference,
        notes: paymentForm.notes || undefined,
      });

      setIsPaymentModalOpen(false);
      alert('Payment receipt submitted! Platform admin will verify and activate your subscription invoice.');
    } catch (err: any) {
      alert(err.message || 'Failed to submit payment receipt');
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Organization & System Settings</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage company profile, role-based team permissions, WhatsApp Cloud API credentials, and billing.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 flex flex-wrap gap-6 text-xs font-bold">
        <button
          onClick={() => setActiveTab('profile')}
          className={`pb-3 border-b-2 flex items-center gap-1.5 transition ${
            activeTab === 'profile'
              ? 'border-emerald-700 text-emerald-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Building className="w-4 h-4" />
          <span>Profile & Warehouses</span>
        </button>
        <button
          onClick={() => setActiveTab('team')}
          className={`pb-3 border-b-2 flex items-center gap-1.5 transition ${
            activeTab === 'team'
              ? 'border-emerald-700 text-emerald-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Team & Roles</span>
        </button>
        <button
          onClick={() => setActiveTab('whatsapp')}
          className={`pb-3 border-b-2 flex items-center gap-1.5 transition ${
            activeTab === 'whatsapp'
              ? 'border-emerald-700 text-emerald-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <MessageSquare className="w-4 h-4 text-emerald-600" />
          <span>WhatsApp Cloud API</span>
        </button>
        <button
          onClick={() => setActiveTab('billing')}
          className={`pb-3 border-b-2 flex items-center gap-1.5 transition ${
            activeTab === 'billing'
              ? 'border-emerald-700 text-emerald-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>SaaS Plan & Billing</span>
        </button>
      </div>

      {/* Tab 1: Profile & Warehouses */}
      {activeTab === 'profile' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <Input label="Company Name" disabled value={organization?.name || 'MetriFlow Wholesale'} />
            <Input label="Company Slug / Identifier" disabled value={organization?.slug || 'demowholesaler'} />
            <Input label="Default Currency" disabled value="PKR (Pakistani Rupee)" />
            <Input label="System Timezone" disabled value="Asia/Karachi (UTC+5)" />
          </div>

          <div className="pt-4 border-t border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 mb-3">Operating Branches & Warehouses</h3>
            <div className="space-y-3">
              {branches.map((b) => (
                <div key={b.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                  <div className="flex items-center justify-between font-bold text-slate-900">
                    <span>{b.name} ({b.code})</span>
                    {b.isDefault && <Badge variant="success" size="sm">Main Hub</Badge>}
                  </div>
                  <p className="text-slate-500 mt-1">{b.address || 'Karachi Wholesale Market'}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Team Members & Roles */}
      {activeTab === 'team' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Team Staff Members</h3>
              <p className="text-xs text-slate-500">Manage institutional roles and access privileges.</p>
            </div>
            <Button
              variant="primary"
              size="sm"
              icon={<Plus className="w-4 h-4" />}
              onClick={() => setIsInviteModalOpen(true)}
            >
              Invite Staff
            </Button>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase">
                <tr>
                  <th className="py-2.5 px-3">Full Name</th>
                  <th className="py-2.5 px-3">Email Address</th>
                  <th className="py-2.5 px-3">Assigned Role</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {members.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-bold text-slate-900">{m.user?.fullName || m.fullName}</td>
                    <td className="py-2.5 px-3 text-slate-600 font-mono">{m.user?.email || m.email}</td>
                    <td className="py-2.5 px-3">
                      <Badge variant="neutral">{m.role}</Badge>
                    </td>
                    <td className="py-2.5 px-3">
                      <Badge variant={m.status === 'ACTIVE' ? 'success' : 'warning'}>
                        {m.status || 'ACTIVE'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: WhatsApp Cloud API Integration */}
      {activeTab === 'whatsapp' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6 text-xs">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Meta WhatsApp Cloud API v4 Setup</h3>
            <p className="text-slate-500 mt-0.5">
              Connect your verified Meta Business Account phone number to receive wholesale orders and send updates.
            </p>
          </div>

          <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 space-y-2 text-emerald-900">
            <span className="font-bold flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              <span>Official Webhook Configuration Endpoint</span>
            </span>
            <p className="text-[11px] font-mono bg-white p-2 rounded border border-emerald-300 select-all">
              https://api.metriflow.pk/api/v1/whatsapp/webhook
            </p>
            <p className="text-[11px] text-emerald-700">
              Configure this exact callback URL in your Meta App Dashboard under WhatsApp Webhooks.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Phone Number ID"
              placeholder="e.g. 10928374659102"
              value={waConfig?.phoneNumberId || '10928374659102'}
            />
            <Input
              label="WhatsApp Business Account ID (WABA)"
              placeholder="e.g. 98127364510293"
              value={waConfig?.wabaId || '98127364510293'}
            />
          </div>

          <Input
            label="System User Permanent Access Token"
            type="password"
            placeholder="EAAG...."
            value={waConfig?.hasToken ? '••••••••••••••••••••••••' : ''}
          />

          <div className="pt-2 flex justify-end">
            <Button variant="primary" size="sm">
              Save & Test Connection
            </Button>
          </div>
        </div>
      )}

      {/* Tab 4: Billing & SaaS Plan */}
      {activeTab === 'billing' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Current Plan</span>
              <h3 className="text-2xl font-black text-slate-900 font-mono mt-0.5">Growth Distributor Plan</h3>
              <p className="text-xs text-slate-500 mt-1">PKR 18,500 / month • Active</p>
            </div>
            <Button
              variant="primary"
              size="sm"
              icon={<CreditCard className="w-4 h-4" />}
              onClick={() => setIsPaymentModalOpen(true)}
            >
              Submit Bank Transfer Slip
            </Button>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
            <span className="font-bold text-slate-800 block">MetriFlow Official Pakistani Bank Details</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-600 font-mono text-[11px]">
              <div>
                <strong>Bank:</strong> Meezan Bank Limited<br />
                <strong>Title:</strong> MetriFlow Technologies (Pvt) Ltd<br />
                <strong>Account:</strong> 0201-0105829104
              </div>
              <div>
                <strong>IBAN:</strong> PK45MEZN0002010105829104<br />
                <strong>Branch:</strong> I.I. Chundrigar Road, Karachi
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Invite Modal */}
      <Modal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        title="Invite Wholesale Team Member"
        description="Dispatches a secured invitation link with pre-assigned permissions."
        maxWidth="md"
      >
        <form onSubmit={handleInviteStaff} className="space-y-4">
          <Input
            label="Full Name"
            required
            value={inviteForm.fullName}
            onChange={(e) => setInviteForm({ ...inviteForm, fullName: e.target.value })}
            placeholder="e.g. Farhan Ali"
          />
          <Input
            label="Work Email Address"
            type="email"
            required
            value={inviteForm.email}
            onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
            placeholder="farhan@company.pk"
          />
          <Select
            label="Role & Privileges"
            required
            value={inviteForm.role}
            onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value })}
            options={[
              { value: 'ADMIN', label: 'Admin (Full Operations & Settings)' },
              { value: 'SALES_MANAGER', label: 'Sales Manager (Approve Orders & Recovery)' },
              { value: 'SALES_REP', label: 'Sales Representative (Field Bookings & Collections)' },
              { value: 'ACCOUNTANT', label: 'Accountant (Maker-Checker Payment Verification)' },
              { value: 'WAREHOUSE', label: 'Warehouse Staff (Pick, Pack & Dispatches)' },
              { value: 'DELIVERY', label: 'Delivery Staff (POD Signatures)' },
            ]}
          />

          <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
            <Button variant="outline" size="sm" type="button" onClick={() => setIsInviteModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Send Invitation
            </Button>
          </div>
        </form>
      </Modal>

      {/* Bank Payment Modal */}
      <Modal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        title="Submit Bank Payment Receipt"
        description="Upload your IBFT / 1Link transaction reference for monthly SaaS subscription activation."
        maxWidth="md"
      >
        <form onSubmit={handleBankPaymentSubmit} className="space-y-4">
          <Input
            label="Amount Transferred (PKR)"
            type="number"
            required
            value={paymentForm.amountRupees}
            onChange={(e) => setPaymentForm({ ...paymentForm, amountRupees: e.target.value })}
            prefixText="PKR"
          />
          <Input
            label="Bank Transaction ID / Ref #"
            required
            value={paymentForm.bankReference}
            onChange={(e) => setPaymentForm({ ...paymentForm, bankReference: e.target.value })}
            placeholder="e.g. FT26101748921"
          />
          <Input
            label="Additional Notes / Payer Account"
            value={paymentForm.notes}
            onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
            placeholder="e.g. Transferred from HBL Corporate Account"
          />

          <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
            <Button variant="outline" size="sm" type="button" onClick={() => setIsPaymentModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Submit Receipt for Verification
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
