import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/common/Button';
import {
  MessageSquare,
  Package,
  Truck,
  BookOpen,
  DollarSign,
  Clock,
  Smartphone,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';

export const FeaturesPage: React.FC = () => {
  const features = [
    {
      icon: <MessageSquare className="w-6 h-6 text-emerald-600" />,
      title: 'WhatsApp Cloud API v4 & Gemini AI Drafts',
      description: 'Accept voice notes and Urdu text orders from wholesale clients. Our AI maps spoken or typed items to your exact SKU catalog with confidence ratings. Human staff review and edit drafts with one click before any order or inventory commitment is made.',
    },
    {
      icon: <Package className="w-6 h-6 text-blue-600" />,
      title: 'Real-Time Stock & Moving Weighted-Average Cost',
      description: 'Physical inventory constraint: Available = OnHand - Reserved - Quarantined. Stock is reserved instantly upon order confirmation, preventing concurrent double-booking. Moving weighted-average cost (WAC) calculates exact margin and gross profit on every dispatch.',
    },
    {
      icon: <Truck className="w-6 h-6 text-purple-600" />,
      title: 'Partial Dispatches & Delivery Challans (Bilty)',
      description: 'In Pakistani wholesale, orders are frequently delivered across multiple dispatches. MetriFlow generates sequential Delivery Challans for warehouse dispatchers, leaves unfulfilled quantities safely reserved, and bills only the quantities physically shipped.',
    },
    {
      icon: <BookOpen className="w-6 h-6 text-teal-600" />,
      title: 'Customer Khata & Subledger Ledger',
      description: 'Complete double-entry synchronization between invoices, receipts, return credit notes, and running customer balances. Instantly generate downloadable, printable customer khata statements for WhatsApp sharing with your clients.',
    },
    {
      icon: <DollarSign className="w-6 h-6 text-emerald-700" />,
      title: 'Maker-Checker Payment Verification',
      description: 'Protect your cash flow with institutional separation of duties. Field salesmen submit collections with cash or cheque proof, but only accountants can verify receipts and apply them against open invoices.',
    },
    {
      icon: <Clock className="w-6 h-6 text-amber-600" />,
      title: 'Recovery Aging & Promises to Pay',
      description: 'Track receivables across automatic aging buckets (Current, 1–30, 31–60, 61–90, and >90 days). Log recovery phone calls, record committed customer payment dates, and flag disputes to prioritize collection routes.',
    },
    {
      icon: <Smartphone className="w-6 h-6 text-indigo-600" />,
      title: 'Mobile Field Sales & Driver POD App',
      description: 'Equip road salesmen with mobile-optimized catalog order booking. Delivery drivers access route dispatches and capture Proof of Delivery (POD) with digital recipient signatures, delivery photos, or structured failure reasons.',
    },
    {
      icon: <ShieldCheck className="w-6 h-6 text-slate-800" />,
      title: 'Multi-Tenant Isolation & Immutable Audit Trails',
      description: 'Every transaction, price modification, stock adjustment, and payment verification is permanently logged with actor ID, timestamp, and unique trace ID. Strict query-level tenant isolation ensures zero cross-company leakage.',
    },
  ];

  return (
    <div className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-16">
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
          Complete Wholesale Capability
        </span>
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">
          Everything Your Wholesale Business Needs To Scale
        </h1>
        <p className="text-slate-600 text-sm sm:text-base">
          From first WhatsApp contact to final recovery khata settlement, MetriFlow eliminates 
          paper bottlenecks and reconciles your entire business in real-time.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {features.map((feat, index) => (
          <div
            key={index}
            className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm hover:shadow-md transition space-y-4"
          >
            <div className="p-3 bg-slate-50 rounded-xl w-fit border border-slate-100">
              {feat.icon}
            </div>
            <h3 className="text-lg font-bold text-slate-900">{feat.title}</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              {feat.description}
            </p>
          </div>
        ))}
      </div>

      <div className="bg-[#102A43] text-white rounded-3xl p-8 sm:p-12 text-center max-w-4xl mx-auto space-y-6">
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
          Ready to experience modern wholesale operations?
        </h2>
        <p className="text-slate-300 text-sm max-w-xl mx-auto">
          Start your 14-day free trial today or speak with our Pakistan onboarding team.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link to="/signup">
            <Button size="lg" variant="primary" icon={<ArrowRight className="w-5 h-5" />}>
              Start Free Trial
            </Button>
          </Link>
          <Link to="/contact">
            <Button size="lg" variant="outline" className="bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700">
              Book Guided Demo
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};
