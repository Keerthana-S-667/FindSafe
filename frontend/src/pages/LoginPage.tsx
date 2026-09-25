import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Lock, Mail, AlertCircle, Database, Sparkles, ArrowRight, UserCheck } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, loginAsDemoOperator, isConfigured, error: authError } = useAuth();

  const [email, setEmail] = useState('operator@agency.gov');
  const [password, setPassword] = useState('Operator123!');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    setIsLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Unable to sign in. Check credentials and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoSignIn = async () => {
    setErrorMessage(null);
    setIsLoading(true);
    try {
      await loginAsDemoOperator();
      navigate('/dashboard');
    } catch (err) {
      setErrorMessage('Failed to sign in as demo operator.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8 items-center bg-surface-50 border border-surface-400 rounded-2xl p-6 sm:p-10 shadow-xl">
        
        {/* Left: Branding & Overview */}
        <div className="space-y-6 pr-0 md:pr-6 border-b md:border-b-0 md:border-r border-surface-300 pb-6 md:pb-0">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-brand-500/15 border border-brand-500/30 rounded-lg text-brand-800 text-xs font-bold shadow-xs">
            <Shield className="w-4 h-4 text-brand-600" />
            <span>OPERATIONAL ACCESS ONLY</span>
          </div>

          <div>
            <h1 className="text-3xl font-black text-surface-950 tracking-tight">FINDSAFE AI</h1>
            <p className="text-xs text-surface-700 font-medium mt-2 leading-relaxed">
              Privacy-Conscious Missing Person Detection, Matching & Multi-Camera CCTV Intelligence.
            </p>
          </div>

          <div className="space-y-3 pt-4 border-t border-surface-300 text-xs text-surface-800 font-medium">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-brand-600" />
              <span>Authorized personnel authentication & demo access</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-brand-600" />
              <span>Full audit logging enabled</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-brand-600" />
              <span>PostgreSQL & Multi-Camera Computer Vision Engine</span>
            </div>
          </div>

          {/* Quick Demo Credentials Info Box */}
          <div className="p-3.5 bg-surface-200 border border-surface-300 rounded-xl space-y-1.5 text-xs text-surface-800">
            <span className="font-extrabold text-surface-950 flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-brand-600" /> Default Operator Credentials:
            </span>
            <div className="font-mono text-[11px] text-surface-700 space-y-0.5">
              <p>Email: <strong className="text-surface-950">operator@agency.gov</strong></p>
              <p>Password: <strong className="text-surface-950">Operator123!</strong></p>
            </div>
          </div>
        </div>

        {/* Right: Operational Login Form */}
        <div className="space-y-5">
          <div>
            <h2 className="text-xl font-black text-surface-950 tracking-tight">Sign In to Command Center</h2>
            <p className="text-xs text-surface-700 font-medium mt-0.5">Enter your operator credentials or use 1-click demo access.</p>
          </div>

          {(errorMessage || authError) && (
            <div className="p-3.5 bg-red-50 border border-red-300 rounded-xl flex items-center gap-2.5 text-red-900 text-xs font-bold shadow-xs">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{errorMessage || authError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Operator Email"
              type="email"
              required
              placeholder="operator@agency.gov"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              icon={<Mail className="w-4 h-4" />}
            />

            <Input
              label="Password"
              type="password"
              required
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              icon={<Lock className="w-4 h-4" />}
            />

            <Button
              type="submit"
              variant="primary"
              className="w-full py-2.5 mt-2 font-bold shadow-xs"
              isLoading={isLoading}
            >
              Sign In <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </form>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-surface-300" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-surface-50 px-3 text-surface-600 font-medium">or</span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={handleDemoSignIn}
            className="w-full py-2.5 font-bold border-brand-500 text-brand-800 hover:bg-brand-500/10 shadow-xs"
            disabled={isLoading}
            icon={<Sparkles className="w-4 h-4 text-brand-600" />}
          >
            ⚡ Quick Sign In as Authorized Operator
          </Button>

          <p className="text-[11px] text-center text-surface-600 font-medium pt-2">
            FindSafe AI Public Safety Intelligence Platform
          </p>
        </div>
      </div>
    </div>
  );
};
