import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { Button } from '../../components/common/Button';
import { Logo } from '../../components/common/Logo';
import { Input } from '../../components/common/Input';
import { Mail, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await api.post('/auth/forgot-password', { email });
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Unable to process reset request. Please check your email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-block">
          <Logo size="lg" />
        </Link>
        <h2 className="mt-6 text-2xl font-extrabold text-slate-900 tracking-tight">
          Reset Your Password
        </h2>
        <p className="mt-2 text-xs text-slate-500">
          Enter your registered email address and we'll send you recovery instructions.
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

          {success ? (
            <div className="text-center py-4 space-y-4">
              <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
              <h3 className="text-base font-bold text-slate-900">Check Your Inbox</h3>
              <p className="text-xs text-slate-600">
                If an account exists for {email}, you will receive a secure password reset link.
              </p>
              <Link to="/login">
                <Button variant="outline" size="sm" icon={<ArrowLeft className="w-4 h-4" />}>
                  Back to Sign In
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <Input
                label="Registered Email Address"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. owner@demowholesaler.pk"
              />

              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={loading}
                icon={<Mail className="w-4 h-4" />}
                className="w-full font-bold shadow-md"
              >
                Send Password Reset Link
              </Button>

              <div className="text-center pt-2">
                <Link to="/login" className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center justify-center gap-1">
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Return to Sign In</span>
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
