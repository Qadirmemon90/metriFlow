import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/common/Button';
import { api } from '../../services/api';
import {
  ArrowRight,
  CheckCircle2,
  MessageSquare,
  ShieldCheck,
  TrendingUp,
  Package,
  Truck,
  BookOpen,
  DollarSign,
  Sparkles,
  Users,
  Send,
  AlertCircle,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const [inquirySent, setInquirySent] = useState(false);
  const [inquiryLoading, setInquiryLoading] = useState(false);
  const [inquiryError, setInquiryError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    companyName: '',
    email: '',
    phone: '',
    city: 'Karachi',
    interest: 'full_demo',
    message: '',
  });

  const handleInquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setInquiryLoading(true);
    setInquiryError('');
    try {
      await api.post('/platform/contact-inquiries', formData);
      setInquirySent(true);
    } catch (err: any) {
      setInquiryError(err.message || 'Failed to submit inquiry. Please try again.');
    } finally {
      setInquiryLoading(false);
    }
  };

  return (
    <div className="space-y-24 pb-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#102A43] via-[#0B1D3A] to-slate-900 text-white pt-20 pb-28 px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(#10B981_1px,transparent_1px)] [background-size:24px_24px] opacity-15" />
        <div className="max-w-5xl mx-auto text-center relative z-10 space-y-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold tracking-wide uppercase">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            Pakistan Wholesale B2B ERP & Khata SaaS
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-tight">
            Stop Stock Mismatches & <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-mint">
              Khata Disputes Forever.
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-300 leading-relaxed font-normal">
            MetriFlow connects customer WhatsApp voice/text orders, warehouse dispatches, 
            weighted-average inventory costing, and customer recovery khata into one 
            audited, bank-grade system.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link to="/signup" className="w-full sm:w-auto">
              <Button size="lg" variant="primary" icon={<ArrowRight className="w-5 h-5" />} className="w-full sm:w-auto shadow-lg shadow-emerald-900/40">
                Start 14-Day Free Trial
              </Button>
            </Link>
            <a href="#demo-form" className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="w-full sm:w-auto bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700">
                Book Guided Onboarding
              </Button>
            </a>
          </div>

          {/* Quick Metrics Bar */}
          <div className="pt-12 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto border-t border-slate-800/80 text-left">
            <div>
              <p className="text-2xl font-black text-emerald-400">100%</p>
              <p className="text-xs text-slate-400 mt-0.5">ACID stock reservation safety</p>
            </div>
            <div>
              <p className="text-2xl font-black text-emerald-400">PKR 0</p>
              <p className="text-xs text-slate-400 mt-0.5">Integer-paisa rounding errors</p>
            </div>
            <div>
              <p className="text-2xl font-black text-emerald-400">2-Way</p>
              <p className="text-xs text-slate-400 mt-0.5">Maker-checker payment integrity</p>
            </div>
            <div>
              <p className="text-2xl font-black text-emerald-400">WhatsApp</p>
              <p className="text-xs text-slate-400 mt-0.5">Cloud API v4 order draft conversion</p>
            </div>
          </div>
        </div>
      </section>

      {/* Core Operational Workflow Pillars */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-700 mb-2">Designed for Local Wholesale Realities</h2>
          <p className="text-3xl font-extrabold text-slate-900 tracking-tight">
            How MetriFlow Solves Wholesale Bottlenecks
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card 1 */}
          <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm hover:shadow-md transition">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-6">
              <MessageSquare className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">WhatsApp Order Drafts with AI</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Wholesale buyers send messy Roman Urdu or voice messages on WhatsApp. 
              Our AI extracts items, matches SKUs with confidence scores, and prepares a draft order. 
              Your staff reviews and confirms before any stock is reserved or financial liability posted.
            </p>
          </div>

          {/* Card 2 */}
          <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm hover:shadow-md transition">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center mb-6">
              <BookOpen className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Customer Khata & Aging Recovery</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Real-time running balances, debit invoices, payment allocations, and credit notes. 
              Automated aging buckets (1–30, 31–60, 61–90, &gt;90 days) with promises to pay 
              and follow-up logging keep your recovery team disciplined.
            </p>
          </div>

          {/* Card 3 */}
          <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm hover:shadow-md transition">
            <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center mb-6">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Zero-Overselling Stock Engine</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Guaranteed formula: Available = OnHand - Reserved - Quarantined. 
              Moving Weighted-Average Cost (WAC) calculated dynamically on receipts and returns. 
              Delivery Challans (Bilty) generated instantly upon partial or full dispatches.
            </p>
          </div>
        </div>
      </section>

      {/* Maker-Checker & Audit Integrity Section */}
      <section className="bg-slate-100 py-16 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 block mb-2">
                Financial Control & Segregation
              </span>
              <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-4">
                No Single Staff Member Can Misappropriate Funds
              </h2>
              <p className="text-sm text-slate-600 mb-6 leading-relaxed">
                Traditional wholesale setups suffer when salesmen collect cash in the market and adjust balances without oversight. 
                MetriFlow strictly enforces separation of duties: field salesmen submit receipts with bank/cash proof, but 
                only independent accountants or managers can verify and post to the customer khata.
              </p>

              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                  <span className="text-sm font-medium text-slate-800">Collector cannot verify their own payment submissions</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                  <span className="text-sm font-medium text-slate-800">Proof of Delivery (POD) signature and photo evidence</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                  <span className="text-sm font-medium text-slate-800">Permanent immutable audit logs with actor and trace ID</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-md">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Live Collection Verification</span>
                <span className="text-xs px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold">Pending Review</span>
              </div>
              <div className="py-4 space-y-3 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Customer:</span>
                  <span className="font-bold text-slate-800">Al-Madina Traders (Lahore)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Amount Received:</span>
                  <span className="font-black text-slate-900 text-sm">PKR 150,000.00</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Collector:</span>
                  <span className="text-slate-700">Tariq Mehmood (Field Rep)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Method & Ref:</span>
                  <span className="font-mono text-slate-700">Cheque #982134 (Meezan)</span>
                </div>
              </div>
              <div className="pt-4 border-t border-slate-100 flex gap-2">
                <button disabled className="w-full py-2 bg-slate-100 text-slate-400 font-bold text-xs rounded-lg cursor-not-allowed">
                  Collector Action (Disabled)
                </button>
                <button className="w-full py-2 bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-sm">
                  Accountant: Verify & Allocate
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Book Demo / Inquiry Form */}
      <section id="demo-form" className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 shadow-xl">
          <div className="text-center max-w-xl mx-auto mb-8">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Book a Guided Onboarding Demo
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Speak directly with an enterprise wholesale specialist in Pakistan. 
              We'll walk you through WhatsApp setup, catalog imports, and recovery workflows.
            </p>
          </div>

          {inquirySent ? (
            <div className="p-8 text-center bg-emerald-50 rounded-2xl border border-emerald-200 space-y-3">
              <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
              <h3 className="text-lg font-bold text-emerald-900">Thank you! Your inquiry has been received.</h3>
              <p className="text-xs text-emerald-700 max-w-md mx-auto">
                A MetriFlow wholesale specialist will contact you via WhatsApp or phone within 2 business hours.
              </p>
            </div>
          ) : (
            <form onSubmit={handleInquirySubmit} className="space-y-4">
              {inquiryError && (
                <div className="p-3 bg-red-50 text-red-700 rounded-lg text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{inquiryError}</span>
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Your Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full text-sm border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    placeholder="e.g. Asad Ullah"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Company / Wholesale Business *</label>
                  <input
                    type="text"
                    required
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    className="w-full text-sm border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    placeholder="e.g. Asad & Sons Traders"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Email *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full text-sm border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    placeholder="asad@example.com"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Phone / WhatsApp *</label>
                  <input
                    type="text"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full text-sm border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    placeholder="+92 300 1234567"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">City</label>
                  <select
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full text-sm border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
                  >
                    <option value="Karachi">Karachi</option>
                    <option value="Lahore">Lahore</option>
                    <option value="Rawalpindi">Rawalpindi / Islamabad</option>
                    <option value="Faisalabad">Faisalabad</option>
                    <option value="Multan">Multan</option>
                    <option value="Peshawar">Peshawar</option>
                    <option value="Gujranwala">Gujranwala</option>
                    <option value="Other">Other City</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">How can we help your wholesale business?</label>
                <textarea
                  rows={3}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full text-sm border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  placeholder="Tell us about your current software or inventory challenges..."
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={inquiryLoading}
                className="w-full mt-2"
                icon={<Send className="w-4 h-4" />}
              >
                Submit Demo Request
              </Button>
            </form>
          )}
        </div>
      </section>
    </div>
  );
};
