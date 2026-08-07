import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail } from 'lucide-react';
import { PageContainer } from '../components/layout/PageContainer';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { authApi } from '../services/apiClient';

export function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('admin@vulnalyze.com');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await authApi.login(email, password);
      navigate('/');
    } catch (err: any) {
      console.error('Login failed', err);
      const detail = err?.response?.data?.detail;
      if (typeof detail === 'string' && detail.trim()) {
        setError(detail);
      } else {
        setError('Unable to sign in. Please verify your credentials and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageContainer
      title="Sign in"
      description="Access the Vulnalyze demo workspace with your local credentials"
    >
      <div className="mx-auto max-w-xl">
        <Card title="Demo Authentication" subtitle="Use the seeded admin account to explore the workspace">
          {error && (
            <div className="mb-4 rounded-md border border-severity-critical/20 bg-severity-critical/10 px-4 py-3 text-sm text-severity-critical">
              {error}
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="mb-1 block text-sm font-medium text-dark-300">
                Email
              </label>
              <div className="relative">
                <Mail size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" />
                <input
                  id="email"
                  type="email"
                  className="input pl-10"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
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
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign in'}
            </Button>
          </form>

          <div className="mt-4 rounded-md border border-dark-700 bg-dark-800/70 p-3 text-sm text-dark-400">
            Demo credentials: <span className="font-medium text-dark-200">admin@vulnalyze.com</span> / <span className="font-medium text-dark-200">admin123</span>
          </div>
        </Card>
      </div>
    </PageContainer>
  );
}
