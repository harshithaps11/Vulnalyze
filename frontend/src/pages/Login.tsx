import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, User as UserIcon, Shield, UserPlus, LogIn } from 'lucide-react';
import { PageContainer } from '../components/layout/PageContainer';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { authApi } from '../services/apiClient';

export function Login() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('admin@vulnalyze.com');
  const [password, setPassword] = useState('admin123');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (mode === 'login') {
        await authApi.login(email, password);
        navigate('/');
      } else {
        if (!fullName.trim()) {
          setError('Full name is required for registration.');
          setLoading(false);
          return;
        }
        await authApi.register(email, password, fullName.trim());
        setSuccess('Registration successful! Redirecting to dashboard...');
        setTimeout(() => navigate('/'), 1000);
      }
    } catch (err: any) {
      console.error(`${mode} failed`, err);
      const detail = err?.response?.data?.detail;
      if (typeof detail === 'string' && detail.trim()) {
        setError(detail);
      } else {
        setError(`Unable to ${mode === 'login' ? 'sign in' : 'register'}. Please check your inputs and try again.`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageContainer
      title={mode === 'login' ? 'Sign in to Vulnalyze' : 'Create an Account'}
      description="Access the Vulnalyze application security platform"
    >
      <div className="mx-auto max-w-xl">
        <Card>
          {/* Mode Switcher Tabs */}
          <div className="flex border-b border-dark-700 mb-6">
            <button
              type="button"
              className={`flex-1 py-3 text-center font-medium text-sm border-b-2 transition-colors flex items-center justify-center gap-2 ${
                mode === 'login'
                  ? 'border-primary-500 text-primary-400 font-semibold'
                  : 'border-transparent text-dark-400 hover:text-dark-200'
              }`}
              onClick={() => {
                setMode('login');
                setError(null);
                setSuccess(null);
              }}
            >
              <LogIn size={16} />
              Sign In
            </button>
            <button
              type="button"
              className={`flex-1 py-3 text-center font-medium text-sm border-b-2 transition-colors flex items-center justify-center gap-2 ${
                mode === 'register'
                  ? 'border-primary-500 text-primary-400 font-semibold'
                  : 'border-transparent text-dark-400 hover:text-dark-200'
              }`}
              onClick={() => {
                setMode('register');
                setError(null);
                setSuccess(null);
              }}
            >
              <UserPlus size={16} />
              Sign Up
            </button>
          </div>

          {error && (
            <div className="mb-4 rounded-md border border-severity-critical/20 bg-severity-critical/10 px-4 py-3 text-sm text-severity-critical">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 rounded-md border border-severity-low/20 bg-severity-low/10 px-4 py-3 text-sm text-severity-low">
              {success}
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            {mode === 'register' && (
              <div>
                <label htmlFor="fullName" className="mb-1 block text-sm font-medium text-dark-300">
                  Full Name
                </label>
                <div className="relative">
                  <UserIcon size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" />
                  <input
                    id="fullName"
                    type="text"
                    className="input pl-10"
                    placeholder="Alex Morgan"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required={mode === 'register'}
                  />
                </div>
              </div>
            )}

            <div>
              <label htmlFor="email" className="mb-1 block text-sm font-medium text-dark-300">
                Email Address
              </label>
              <div className="relative">
                <Mail size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" />
                <input
                  id="email"
                  type="email"
                  className="input pl-10"
                  placeholder="user@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="mb-1 block text-sm font-medium text-dark-300">
                Password
              </label>
              <div className="relative">
                <Lock size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" />
                <input
                  id="password"
                  type="password"
                  className="input pl-10"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <Button type="submit" className="w-full mt-2" disabled={loading}>
              {loading ? (mode === 'login' ? 'Signing in...' : 'Registering...') : (mode === 'login' ? 'Sign In' : 'Create Account')}
            </Button>
          </form>

          {mode === 'login' && (
            <div className="mt-4 rounded-md border border-dark-700 bg-dark-800/70 p-3 text-xs text-dark-400 flex items-center justify-between">
              <span>Default admin credentials:</span>
              <span className="font-mono text-dark-200 font-medium">admin@vulnalyze.com / admin123</span>
            </div>
          )}
        </Card>
      </div>
    </PageContainer>
  );
}
