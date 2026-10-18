import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { formatPaisa, formatDate } from '../../utils/formatters';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import {
  Smartphone,
  Truck,
  CheckCircle2,
  XCircle,
  MapPin,
  Phone,
  User,
  ShoppingBag,
  Camera,
} from 'lucide-react';

export const FieldSalesPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'delivery' | 'salesman'>('delivery');
  const [tasks, setTasks] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // POD Modal
  const [selectedTask, setSelectedTask] = useState<any | null>(null);
  const [podRecipient, setPodRecipient] = useState('');
  const [podNotes, setPodNotes] = useState('');
  const [podLoading, setPodLoading] = useState(false);

  // Failure Modal
  const [failedTask, setFailedTask] = useState<any | null>(null);
  const [failureReason, setFailureReason] = useState('SHOP_CLOSED');
  const [failureNotes, setFailureNotes] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [tasksRes, custsRes, prodsRes]: any = await Promise.all([
        api.get('/field/delivery-tasks'),
        api.get('/master-data/customers'),
        api.get('/master-data/products'),
      ]);

      setTasks(Array.isArray(tasksRes) ? tasksRes : tasksRes.items || []);
      setCustomers(Array.isArray(custsRes) ? custsRes : custsRes.items || []);
      setProducts(Array.isArray(prodsRes) ? prodsRes : prodsRes.items || []);
    } catch (err) {
      console.error('Failed to load field data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCompletePod = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask) return;

    setPodLoading(true);
    try {
      await api.post(`/field/delivery-tasks/${selectedTask.id}/complete`, {
        recipientName: podRecipient,
        notes: podNotes || undefined,
      });

      setSelectedTask(null);
      alert('Proof of Delivery (POD) confirmed successfully!');
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to complete delivery');
    } finally {
      setPodLoading(false);
    }
  };

  const handleFailDelivery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!failedTask) return;

    try {
      await api.post(`/field/delivery-tasks/${failedTask.id}/fail`, {
        reasonCode: failureReason,
        notes: failureNotes,
      });

      setFailedTask(null);
      alert('Delivery recorded as unfulfilled; inventory returns to warehouse.');
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to record delivery failure');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Field Sales & Delivery Operations</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Touch-optimized workflows for field sales representatives and delivery drivers with Proof of Delivery (POD).
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 flex gap-6 text-xs font-bold">
        <button
          onClick={() => setActiveTab('delivery')}
          className={`pb-3 border-b-2 flex items-center gap-1.5 transition ${
            activeTab === 'delivery'
              ? 'border-emerald-700 text-emerald-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Truck className="w-4 h-4" />
          <span>Driver Delivery Runs & POD</span>
        </button>
        <button
          onClick={() => setActiveTab('salesman')}
          className={`pb-3 border-b-2 flex items-center gap-1.5 transition ${
            activeTab === 'salesman'
              ? 'border-emerald-700 text-emerald-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Smartphone className="w-4 h-4" />
          <span>Field Sales Booking Portal</span>
        </button>
      </div>

      {/* Tab 1: Driver Tasks */}
      {activeTab === 'delivery' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {loading ? (
              <div className="col-span-full text-center py-12 text-xs text-slate-400">Loading delivery tasks...</div>
            ) : tasks.length === 0 ? (
              <div className="col-span-full bg-white rounded-2xl border border-dashed border-slate-200 p-12 text-center text-xs text-slate-400">
                No active delivery tasks assigned. Tasks are generated when orders are dispatched.
              </div>
            ) : (
              tasks.map((task) => (
                <div
                  key={task.id}
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-xs text-slate-900">
                        Challan #{task.dispatchNumber || task.id.substring(0, 8)}
                      </span>
                      <Badge variant={task.status === 'COMPLETED' ? 'success' : task.status === 'FAILED' ? 'danger' : 'warning'}>
                        {task.status}
                      </Badge>
                    </div>

                    <div>
                      <h4 className="font-bold text-sm text-slate-900">{task.customerName || 'Customer'}</h4>
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        <span>{task.deliveryAddress || 'Market Delivery Point'}</span>
                      </p>
                      {task.customerPhone && (
                        <p className="text-xs text-slate-500 font-mono flex items-center gap-1 mt-0.5">
                          <Phone className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                          <span>{task.customerPhone}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  {task.status === 'PENDING' && (
                    <div className="pt-3 border-t border-slate-100 flex gap-2">
                      <Button
                        variant="danger"
                        size="sm"
                        className="w-1/2 text-xs"
                        onClick={() => {
                          setFailedTask(task);
                          setFailureNotes('');
                        }}
                      >
                        Fail
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        className="w-1/2 text-xs"
                        icon={<CheckCircle2 className="w-3.5 h-3.5" />}
                        onClick={() => {
                          setSelectedTask(task);
                          setPodRecipient('');
                          setPodNotes('');
                        }}
                      >
                        Capture POD
                      </Button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Salesman Quick Booking */}
      {activeTab === 'salesman' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
          <div className="max-w-xl space-y-4">
            <h3 className="text-base font-bold text-slate-900">Field Salesman Mobile Booker</h3>
            <p className="text-xs text-slate-500">
              Select your assigned customer and book an on-the-road wholesale order directly into the centralized system.
            </p>

            <div className="space-y-4 pt-2">
              <Select
                label="Assigned Customer"
                options={customers.map((c) => ({
                  value: c.id,
                  label: `${c.name} (${c.city}) — Khata: ${formatPaisa(c.balancePaisa || 0)}`,
                }))}
              />

              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-800 space-y-1">
                <span className="font-bold block">Mobile Booking Instructions:</span>
                <p>Orders booked from the road appear in real-time at the warehouse for dispatch picking and packing.</p>
              </div>

              <a href="/app/orders/new">
                <Button variant="primary" size="md" className="w-full">
                  Open Touch Order Creation Form
                </Button>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Capture POD Modal */}
      {selectedTask && (
        <Modal
          isOpen={!!selectedTask}
          onClose={() => setSelectedTask(null)}
          title="Capture Proof of Delivery (POD)"
          description="Acknowledge physical handover of wholesale shipment to the store manager or authorized recipient."
          maxWidth="md"
        >
          <form onSubmit={handleCompletePod} className="space-y-4 text-xs">
            <Input
              label="Recipient Name / Stamp Signature"
              required
              value={podRecipient}
              onChange={(e) => setPodRecipient(e.target.value)}
              placeholder="e.g. Haji Rashid (Owner) / Stamp Received"
            />

            <Input
              label="Delivery Observations / Notes"
              value={podNotes}
              onChange={(e) => setPodNotes(e.target.value)}
              placeholder="e.g. Handed over 10 cartons in good condition"
            />

            <div className="p-4 rounded-xl border border-dashed border-slate-300 text-center space-y-2 bg-slate-50">
              <Camera className="w-8 h-8 text-slate-400 mx-auto" />
              <span className="text-xs font-semibold text-slate-700 block">Photo of Signed Bilty / Goods Handover</span>
              <p className="text-[11px] text-slate-500">Verified by field driver device</p>
            </div>

            <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
              <Button variant="outline" size="sm" type="button" onClick={() => setSelectedTask(null)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" type="submit" isLoading={podLoading}>
                Confirm Delivery & Archive Challan
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Failure Modal */}
      {failedTask && (
        <Modal
          isOpen={!!failedTask}
          onClose={() => setFailedTask(null)}
          title="Record Delivery Failure"
          description="Document why goods could not be handed over. Undelivered stock will be directed back to warehouse custody."
          maxWidth="md"
        >
          <form onSubmit={handleFailDelivery} className="space-y-4 text-xs">
            <Select
              label="Reason for Non-Delivery"
              required
              value={failureReason}
              onChange={(e) => setFailureReason(e.target.value)}
              options={[
                { value: 'SHOP_CLOSED', label: 'Customer Shop / Warehouse Was Closed' },
                { value: 'RECIPIENT_NOT_FOUND', label: 'Authorized Recipient Not Available' },
                { value: 'REFUSED_DELIVERY', label: 'Buyer Refused Delivery / Cancelled Order' },
                { value: 'ROAD_BLOCKED', label: 'Road / Market Blocked / Inaccessible' },
              ]}
            />

            <Input
              label="Driver Explanation"
              required
              value={failureNotes}
              onChange={(e) => setFailureNotes(e.target.value)}
              placeholder="Mandatory explanation for warehouse returns..."
            />

            <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
              <Button variant="outline" size="sm" type="button" onClick={() => setFailedTask(null)}>
                Cancel
              </Button>
              <Button variant="danger" size="sm" type="submit">
                Confirm Failure & Return to Stock
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
