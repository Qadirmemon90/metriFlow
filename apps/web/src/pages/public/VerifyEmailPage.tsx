import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { api } from '../../services/api';
import { Button } from '../../components/common/Button';
import { Logo } from '../../components/common/Logo';
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export const VerifyEmailPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setStatus('error');
        setMessage('Missing verification token in URL.');
        return;
      }

      try {
        await api.post('/auth/verify-email', { token });
        setStatus('success');
        setMessage('Your email address has been successfully verified.');
      } catch (err: any) {
        setStatus('error');
        setMessage(err.message || 'Invalid or expired email verification token.');
      }
    };

    verifyToken();
  }, [token]);

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8 text-center">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link to="/" className="inline-block">
          <Logo size="lg" />
        </Link>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-xl rounded-2xl border border-slate-200 sm:px-10">
          {status === 'loading' && (
            <div className="py-8 space-y-4">
              <Loader2 className="w-10 h-10 text-emerald-600 animate-spin mx-auto" />
              <p className="text-sm font-semibold text-slate-700">Verifying your email token...</p>
            </div>
          )}

          {status === 'success' && (
            <div className="py-6 space-y-4">
              <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
              <h3 className="text-lg font-bold text-slate-900">Email Verified!</h3>
              <p className="text-xs text-slate-600">{message}</p>
              <Link to="/login">
                <Button variant="primary" size="md" className="w-full">
                  Sign In to Your Workspace
                </Button>
              </Link>
            </div>
          )}

          {status === 'error' && (
            <div className="py-6 space-y-4">
              <AlertCircle className="w-12 h-12 text-rose-600 mx-auto" />
              <h3 className="text-lg font-bold text-slate-900">Verification Failed</h3>
              <p className="text-xs text-rose-600">{message}</p>
              <Link to="/login">
                <Button variant="outline" size="md" className="w-full">
                  Return to Sign In
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
