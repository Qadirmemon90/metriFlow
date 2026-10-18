import React from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Logo } from '../common/Logo';
import { Badge } from '../common/Badge';
import {
  ShieldCheck,
  Building,
  CreditCard,
  Activity,
  LogOut,
  ArrowLeft,
} from 'lucide-react';

export const AdminLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const navItems = [
    { label: 'Overview', path: '/admin/dashboard', icon: <ShieldCheck className="w-4 h-4" /> },
    { label: 'Organizations', path: '/admin/tenants', icon: <Building className="w-4 h-4" /> },
    { label: 'Subscriptions & Bank Approvals', path: '/admin/subscriptions', icon: <CreditCard className="w-4 h-4" /> },
    { label: 'System Health & Worker', path: '/admin/system', icon: <Activity className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen flex bg-slate-100">
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col fixed inset-y-0 z-30 shadow-xl">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <Logo size="sm" light />
        </div>
        <div className="px-4 py-2.5 bg-red-950/40 border-b border-red-900/40 flex items-center justify-between">
          <span className="text-[11px] font-bold text-red-400 uppercase tracking-wider">
            SuperAdmin Mode
          </span>
          <Badge variant="danger" size="sm">Root</Badge>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                  isActive
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-slate-800 space-y-2">
          <Link
            to="/app/dashboard"
            className="flex items-center gap-2 text-xs text-slate-400 hover:text-white px-2 py-1.5 rounded hover:bg-slate-800"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Switch to Tenant App</span>
          </Link>
          <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
            <span className="text-slate-400 truncate max-w-[140px]">{user?.email}</span>
            <button
              onClick={handleLogout}
              className="text-slate-400 hover:text-rose-400 p-1"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      <div className="pl-64 flex flex-col flex-1 min-w-0">
        <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
