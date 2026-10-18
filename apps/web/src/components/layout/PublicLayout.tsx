import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { Logo } from '../common/Logo';
import { Button } from '../common/Button';
import { ArrowRight, PhoneCall, ShieldCheck, CheckCircle2 } from 'lucide-react';

export const PublicLayout: React.FC = () => {
  const location = useLocation();

  const navLinks = [
    { label: 'Features', path: '/features' },
    { label: 'Pricing (PKR)', path: '/pricing' },
    { label: 'Contact & Demo', path: '/contact' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-emerald-600 selection:text-white">
      {/* Top Announcement Bar */}
      <div className="bg-[#102A43] text-slate-200 text-xs py-2 px-4 text-center font-medium flex items-center justify-center gap-2">
        <span className="bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border border-emerald-500/30">
          Pakistan Wholesale B2B
        </span>
        <span>Built for Karachi, Lahore, Rawalpindi & Faisalabad wholesale markets. WhatsApp AI & Khata included.</span>
      </div>

      {/* Main Navbar */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Logo size="md" />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`text-sm font-semibold transition-colors ${
                    isActive ? 'text-emerald-700' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Action CTAs */}
          <div className="flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost" size="sm" className="font-semibold text-slate-700">
                Sign In
              </Button>
            </Link>
            <Link to="/signup">
              <Button variant="primary" size="sm" icon={<ArrowRight className="w-4 h-4" />}>
                Start Free Trial
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Outlet Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-300 border-t border-slate-800 pt-16 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-slate-800">
            <div className="md:col-span-1">
              <Logo size="md" light />
              <p className="mt-4 text-xs text-slate-400 leading-relaxed">
                The modern wholesale operating system engineered for Pakistani distributors, FMCG wholesalers, and hardware traders.
              </p>
              <div className="mt-4 text-xs text-slate-500 flex flex-col gap-1">
                <span>Currency: PKR (Pakistani Rupee)</span>
                <span>Timezone: Asia/Karachi (UTC+5)</span>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4">Core Modules</h4>
              <ul className="space-y-2 text-xs text-slate-400">
                <li><Link to="/features" className="hover:text-emerald-400">WhatsApp AI Order Extraction</Link></li>
                <li><Link to="/features" className="hover:text-emerald-400">Customer Khata & Recovery Aging</Link></li>
                <li><Link to="/features" className="hover:text-emerald-400">Inventory & Weighted-Average Cost</Link></li>
                <li><Link to="/features" className="hover:text-emerald-400">Delivery Challans & Invoices</Link></li>
                <li><Link to="/features" className="hover:text-emerald-400">Maker-Checker Payment Verification</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4">Company & Plans</h4>
              <ul className="space-y-2 text-xs text-slate-400">
                <li><Link to="/pricing" className="hover:text-emerald-400">Plans & Bank Transfer Billing</Link></li>
                <li><Link to="/contact" className="hover:text-emerald-400">Book Guided Onboarding Demo</Link></li>
                <li><Link to="/contact" className="hover:text-emerald-400">Urdu & English Phone Support</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4">Security & Trust</h4>
              <div className="space-y-2.5 text-xs text-slate-400">
                <div className="flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                  <span>Strict tenant data isolation and immutable audit logs.</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                  <span>ACID transaction safety on real database replica sets.</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                  <span>AI human-in-the-loop review guarantee before order confirmation.</span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
            <p>© {new Date().getFullYear()} MetriFlow SaaS. All rights reserved. Made for Pakistani Wholesalers.</p>
            <div className="flex gap-6">
              <Link to="/contact" className="hover:text-slate-300">Privacy Policy</Link>
              <Link to="/contact" className="hover:text-slate-300">Terms of Service</Link>
              <Link to="/admin/login" className="hover:text-slate-300 text-slate-600">Platform Admin</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
