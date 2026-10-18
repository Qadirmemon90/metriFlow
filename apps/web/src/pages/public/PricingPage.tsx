import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/common/Button';
import { Check, ShieldCheck, Building2, HelpCircle } from 'lucide-react';

export const PricingPage: React.FC = () => {
  const plans = [
    {
      name: 'Starter Wholesaler',
      price: 'PKR 8,500',
      period: 'per month',
      description: 'Ideal for single-warehouse wholesalers modernizing from manual paper khata.',
      features: [
        '1 Warehouse & Branch',
        'Up to 3 Staff Users',
        'Full Customer Khata & Balances',
        'WhatsApp Order AI Draft Conversion',
        'Stock Balances & Weighted-Average Cost',
        'Invoices & Delivery Challans (Bilty)',
        'Email & WhatsApp Support',
      ],
      ctaText: 'Start Free 14-Day Trial',
      ctaVariant: 'outline' as const,
      popular: false,
    },
    {
      name: 'Growth Distributor',
      price: 'PKR 18,500',
      period: 'per month',
      description: 'The standard choice for fast-moving distributors with field salesmen and drivers.',
      features: [
        'Up to 3 Warehouses & Branches',
        'Up to 10 Staff Users',
        'Everything in Starter Wholesaler',
        'Field Salesman Mobile Order Capture',
        'Driver Delivery Tasks with POD Signatures',
        'Maker-Checker Payment Verification',
        'Recovery Aging Buckets (1-30, 31-60, 61-90, >90)',
        'CSV Catalog & Customer Batch Import',
        'Priority Phone & WhatsApp Support',
      ],
      ctaText: 'Start Free 14-Day Trial',
      ctaVariant: 'primary' as const,
      popular: true,
    },
    {
      name: 'Enterprise Network',
      price: 'PKR 38,000',
      period: 'per month',
      description: 'For large distribution networks requiring multi-city branches and custom roles.',
      features: [
        'Unlimited Warehouses & Branches',
        'Unlimited Staff Members',
        'Everything in Growth Distributor',
        'Custom Role & Permission Matrix',
        'Multi-Company Tenant Partitioning',
        'Dedicated Onboarding Specialist in Pakistan',
        'Quarterly Financial Ledger Reconciliation',
        '99.9% Uptime SLA Guarantee',
      ],
      ctaText: 'Contact Enterprise Sales',
      ctaVariant: 'outline' as const,
      popular: false,
    },
  ];

  return (
    <div className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-16">
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
          Transparent PKR Subscription Pricing
        </span>
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">
          No Hidden Fees. No Per-Transaction Commission.
        </h1>
        <p className="text-slate-600 text-sm sm:text-base">
          All plans include full data backups, real-time stock reservation safety, 
          and WhatsApp Cloud API integration. Currency billed strictly in Pakistani Rupees.
        </p>
      </div>

      {/* Pricing Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
        {plans.map((plan, index) => (
          <div
            key={index}
            className={`relative rounded-3xl p-8 flex flex-col justify-between transition-all ${
              plan.popular
                ? 'bg-white border-2 border-emerald-600 shadow-xl ring-4 ring-emerald-600/10'
                : 'bg-white border border-slate-200 shadow-sm hover:shadow-md'
            }`}
          >
            {plan.popular && (
              <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-emerald-600 text-white text-[11px] font-bold px-3 py-0.5 rounded-full uppercase tracking-wider shadow">
                Most Popular for Wholesalers
              </span>
            )}

            <div>
              <h3 className="text-xl font-bold text-slate-900">{plan.name}</h3>
              <p className="text-xs text-slate-500 mt-1 min-h-[32px]">{plan.description}</p>

              <div className="mt-6 mb-6 pb-6 border-b border-slate-100">
                <span className="text-3xl font-black text-slate-900">{plan.price}</span>
                <span className="text-xs text-slate-500 ml-1.5 font-medium">{plan.period}</span>
              </div>

              <div className="space-y-3 mb-8">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                  What's Included:
                </span>
                {plan.features.map((feat, fIdx) => (
                  <div key={fIdx} className="flex items-start gap-2.5 text-xs text-slate-700">
                    <Check className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            <Link to="/signup" className="w-full">
              <Button variant={plan.ctaVariant} size="md" className="w-full">
                {plan.ctaText}
              </Button>
            </Link>
          </div>
        ))}
      </div>

      {/* Pakistani B2B Billing Details */}
      <div className="bg-slate-100 rounded-3xl p-8 sm:p-10 border border-slate-200">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="flex items-center gap-3">
            <Building2 className="w-6 h-6 text-emerald-700" />
            <h2 className="text-xl font-bold text-slate-900">
              How Pakistani Wholesale Subscription Billing Works
            </h2>
          </div>

          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Pakistani wholesale businesses operate with corporate bank transfers rather than international recurring credit cards. 
            MetriFlow uses a structured, audited manual billing process:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 text-xs">
            <div className="bg-white p-4 rounded-xl border border-slate-200">
              <span className="font-bold text-emerald-800 block mb-1">1. Transfer via 1Link / IBFT</span>
              <p className="text-slate-600">
                Transfer your monthly or annual fee to our official Meezan Bank or HBL corporate accounts.
              </p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200">
              <span className="font-bold text-emerald-800 block mb-1">2. Upload Receipt / Ref</span>
              <p className="text-slate-600">
                Submit the bank transaction ID or deposit screenshot inside your MetriFlow settings portal.
              </p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200">
              <span className="font-bold text-emerald-800 block mb-1">3. Instant Formal Tax Receipt</span>
              <p className="text-slate-600">
                Our platform admin verifies payment and issues your compliant monthly tax invoice instantly.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
