import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { Button } from '../../components/common/Button';
import { Logo } from '../../components/common/Logo';
import { Input } from '../../components/common/Input';
import { LogIn, AlertCircle, Shield, KeyRound, Building } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const res: any = await api.post('/auth/login', { email, password });
      if (res && res.token && res.user) {
        login(res.token, res.user, res.organization, res.membership);
        if (res.user.isPlatformSuperAdmin) {
          navigate('/admin/dashboard');
        } else {
          navigate('/app/dashboard');
        }
      } else {
        throw new Error('Unexpected login response format');
      }
    } catch (err: any) {
      setError(err.message || 'Invalid email or password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemoLogin = (type: 'demo' | 'superadmin') => {
    if (type === 'demo') {
      setEmail('owner@demowholesaler.pk');
      setPassword('MetriFlowDemo2026!');
    } else {
      setEmail('admin@metriflow.pk');
      setPassword('SuperAdminSecret2026!');
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-block">
          <Logo size="lg" />
        </Link>
        <h2 className="mt-6 text-2xl font-extrabold text-slate-900 tracking-tight">
          Sign In to MetriFlow
        </h2>
        <p className="mt-2 text-xs text-slate-500">
          Enter your wholesale organization credentials to access your dashboard.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-xl rounded-2xl border border-slate-200 sm:px-10">
          {error && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Email Address"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. owner@demowholesaler.pk"
            />

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Password
                </label>
                <Link to="/forgot-password" className="text-xs font-semibold text-emerald-700 hover:text-emerald-800">
                  Forgot Password?
                </Link>
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="block w-full rounded-lg border border-slate-300 text-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 hover:border-slate-400"
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isLoading}
              icon={<LogIn className="w-4 h-4" />}
              className="w-full font-bold shadow-md"
            >
              Sign In to Organization
            </Button>
          </form>

          {/* Quick Development Demo Logins */}
          <div className="mt-6 pt-6 border-t border-slate-100">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2 text-center">
              Quick Seeded Credentials
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('demo')}
                className="py-1.5 px-2 bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 rounded-lg text-[11px] font-medium text-slate-700 hover:text-emerald-800 flex items-center justify-center gap-1 transition"
              >
                <Building className="w-3.5 h-3.5 text-emerald-600" />
                <span>Demo Wholesaler</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('superadmin')}
                className="py-1.5 px-2 bg-slate-50 hover:bg-red-50 border border-slate-200 hover:border-red-300 rounded-lg text-[11px] font-medium text-slate-700 hover:text-red-800 flex items-center justify-center gap-1 transition"
              >
                <Shield className="w-3.5 h-3.5 text-red-600" />
                <span>Platform Admin</span>
              </button>
            </div>
          </div>

          <div className="mt-6 text-center text-xs text-slate-500">
            Don't have an organization account yet?{' '}
            <Link to="/signup" className="font-bold text-emerald-700 hover:text-emerald-800">
              Start 14-day free trial
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
