import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { Button } from '../../components/common/Button';
import { Logo } from '../../components/common/Logo';
import { Input } from '../../components/common/Input';
import { UserPlus, AlertCircle, CheckCircle2 } from 'lucide-react';

export const SignupPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    organizationName: '',
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    setIsLoading(true);

    try {
      const res: any = await api.post('/auth/signup', {
        organizationName: formData.organizationName,
        fullName: formData.fullName,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
      });

      if (res && res.token && res.user) {
        login(res.token, res.user, res.organization, res.membership);
        navigate('/app/dashboard');
      } else {
        setSuccess(true);
      }
    } catch (err: any) {
      setError(err.message || 'Signup failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-block">
          <Logo size="lg" />
        </Link>
        <h2 className="mt-6 text-2xl font-extrabold text-slate-900 tracking-tight">
          Create Wholesale Organization
        </h2>
        <p className="mt-2 text-xs text-slate-500">
          Start your 14-day free trial. Full access to inventory, WhatsApp AI, and Khata.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg">
        <div className="bg-white py-8 px-6 shadow-xl rounded-2xl border border-slate-200 sm:px-10">
          {error && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success ? (
            <div className="text-center py-6 space-y-4">
              <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
              <h3 className="text-lg font-bold text-slate-900">Organization Created!</h3>
              <p className="text-xs text-slate-600">
                A verification link has been sent to your email. Please verify to access your workspace.
              </p>
              <Link to="/login">
                <Button variant="primary" size="md">Proceed to Sign In</Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Wholesale Company / Business Name"
                required
                value={formData.organizationName}
                onChange={(e) => setFormData({ ...formData, organizationName: e.target.value })}
                placeholder="e.g. Al-Rehman Hardware & Tools"
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Owner Full Name"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="e.g. Asad Ullah"
                />
                <Input
                  label="Phone / WhatsApp"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+92 300 1234567"
                />
              </div>

              <Input
                label="Work Email Address"
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="asad@alrehman.pk"
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Min. 8 characters"
                />
                <Input
                  label="Confirm Password"
                  type="password"
                  required
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  placeholder="Re-enter password"
                />
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  isLoading={isLoading}
                  icon={<UserPlus className="w-4 h-4" />}
                  className="w-full font-bold shadow-md"
                >
                  Create Organization & Start Trial
                </Button>
              </div>
            </form>
          )}

          <div className="mt-6 text-center text-xs text-slate-500">
            Already have an account?{' '}
            <Link to="/login" className="font-bold text-emerald-700 hover:text-emerald-800">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
