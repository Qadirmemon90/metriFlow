import React, { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Logo } from '../common/Logo';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import {
  LayoutDashboard,
  ShoppingCart,
  Truck,
  FileText,
  MessageSquare,
  Package,
  Layers,
  Users,
  BookOpen,
  DollarSign,
  RotateCcw,
  Clock,
  PieChart,
  Settings,
  LogOut,
  Menu,
  X,
  PlusCircle,
  Building2,
  ChevronDown,
  Smartphone,
  CreditCard,
} from 'lucide-react';

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  badge?: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

export const AppLayout: React.FC = () => {
  const { user, organization, membership, logout, activeBranchId, setActiveBranchId } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navSections: NavSection[] = [
    {
      title: 'Operations',
      items: [
        { label: 'Dashboard', path: '/app/dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
        { label: 'Orders', path: '/app/orders', icon: <ShoppingCart className="w-4 h-4" /> },
        { label: 'Dispatches & Challans', path: '/app/dispatches', icon: <Truck className="w-4 h-4" /> },
        { label: 'Invoices', path: '/app/invoices', icon: <FileText className="w-4 h-4" /> },
      ],
    },
    {
      title: 'WhatsApp & AI',
      items: [
        {
          label: 'WhatsApp Inbox',
          path: '/app/whatsapp',
          icon: <MessageSquare className="w-4 h-4 text-emerald-500" />,
          badge: 'AI Drafts',
        },
      ],
    },
    {
      title: 'Inventory & Stock',
      items: [
        { label: 'Product Catalog', path: '/app/products', icon: <Package className="w-4 h-4" /> },
        { label: 'Stock & Movements', path: '/app/inventory', icon: <Layers className="w-4 h-4" /> },
      ],
    },
    {
      title: 'Customers & Khata',
      items: [
        { label: 'Customers', path: '/app/customers', icon: <Users className="w-4 h-4" /> },
        { label: 'Khata Ledger', path: '/app/khata', icon: <BookOpen className="w-4 h-4 text-emerald-600" /> },
        { label: 'Payment Collections', path: '/app/collections', icon: <DollarSign className="w-4 h-4" /> },
        { label: 'Customer Returns', path: '/app/returns', icon: <RotateCcw className="w-4 h-4" /> },
      ],
    },
    {
      title: 'Finance & Recovery',
      items: [
        { label: 'Recovery Aging', path: '/app/recovery', icon: <Clock className="w-4 h-4 text-amber-600" /> },
        { label: 'Suppliers', path: '/app/suppliers', icon: <CreditCard className="w-4 h-4" /> },
        { label: 'Expenses', path: '/app/expenses', icon: <DollarSign className="w-4 h-4" /> },
        { label: 'Reports', path: '/app/reports', icon: <PieChart className="w-4 h-4" /> },
      ],
    },
    {
      title: 'Field & Settings',
      items: [
        { label: 'Field Sales & POD', path: '/app/field', icon: <Smartphone className="w-4 h-4 text-sky-600" /> },
        { label: 'Settings & Team', path: '/app/settings', icon: <Settings className="w-4 h-4" /> },
      ],
    },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#102A43] text-slate-300">
      {/* Brand Header */}
      <div className="p-4 border-b border-slate-700/60 flex items-center justify-between">
        <Link to="/app/dashboard" className="flex items-center">
          <Logo size="sm" light />
        </Link>
        <button
          onClick={() => setMobileMenuOpen(false)}
          className="md:hidden text-slate-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Organization Badge & Branch Selector */}
      <div className="px-4 py-3 bg-[#0B1D3A]/60 border-b border-slate-700/60">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="font-bold text-white truncate max-w-[150px]">
            {organization?.name || 'My Wholesale Company'}
          </span>
          <Badge variant="success" size="sm">
            {membership?.role || 'OWNER'}
          </Badge>
        </div>
        {organization?.branches && organization.branches.length > 0 && (
          <div className="mt-2">
            <select
              value={activeBranchId || ''}
              onChange={(e) => setActiveBranchId(e.target.value)}
              className="w-full text-xs bg-slate-800 border border-slate-700 text-slate-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              {organization.branches.map((b) => (
                <option key={b.id} value={b.id}>
                  Branch: {b.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Nav items list */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {navSections.map((section, idx) => (
          <div key={idx}>
            <p className="px-3 text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">
              {section.title}
            </p>
            <nav className="space-y-1">
              {section.items.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                      isActive
                        ? 'bg-emerald-700 text-white shadow-sm'
                        : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                    }`
                  }
                >
                  <div className="flex items-center gap-2.5">
                    {item.icon}
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="bg-emerald-500/20 text-emerald-300 text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              ))}
            </nav>
          </div>
        ))}
      </div>

      {/* Bottom User & Logout Footer */}
      <div className="p-3 border-t border-slate-700/60 bg-[#0B1D3A]/40 flex items-center justify-between">
        <div className="flex flex-col text-xs">
          <span className="font-semibold text-white truncate max-w-[130px]">
            {user?.fullName || 'User'}
          </span>
          <span className="text-[10px] text-slate-400 truncate max-w-[130px]">
            {user?.email}
          </span>
        </div>
        <button
          onClick={handleLogout}
          title="Sign Out"
          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Desktop Fixed Sidebar */}
      <aside className="hidden md:flex md:w-64 flex-col fixed inset-y-0 z-30 shadow-lg">
        {sidebarContent}
      </aside>

      {/* Mobile Sidebar Modal */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-[#102A43]">
            {sidebarContent}
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="md:pl-64 flex flex-col flex-1 min-w-0">
        {/* Top Navbar */}
        <header className="sticky top-0 z-20 bg-white border-b border-slate-200 px-4 sm:px-6 h-14 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              <Menu className="w-5 h-5" />
            </button>
            <span className="hidden sm:inline-block text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {organization?.name || 'MetriFlow Wholesale'}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link to="/app/orders/new">
              <Button variant="primary" size="sm" icon={<PlusCircle className="w-4 h-4" />}>
                Create Order
              </Button>
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
