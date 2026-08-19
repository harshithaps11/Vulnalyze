import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Lock, Mail, ChevronRight, Code, ShieldAlert, LogIn } from 'lucide-react';
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
      // For demonstration, map specific emails to roles
      if (email.toLowerCase().includes('dev')) {
        authApi.loginAsDemo('DEVELOPER');
        // Force full page reload to sync global auth state
        window.location.href = '/';
      } else if (email.toLowerCase().includes('admin')) {
        authApi.loginAsDemo('ADMIN');
        window.location.href = '/';
      } else {
        // Fallback to real API if not a demo account
        await authApi.login(email, password);
        window.location.href = '/';
      }
    } catch (err: any) {
      console.error('Login failed', err);
      setError('Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fillCredentials = (role: 'ADMIN' | 'DEVELOPER') => {
    if (role === 'ADMIN') {
      setEmail('admin@vulnalyze.com');
      setPassword('admin123');
    } else {
      setEmail('dev@vulnalyze.com');
      setPassword('dev123');
    }
  };

  return (
    <div className="min-h-screen bg-dark-950 flex flex-col md:flex-row font-sans overflow-hidden">
      
      {/* Left Pane - Premium Graphic */}
      <div className="hidden md:flex flex-1 relative bg-gradient-to-br from-primary-900/40 via-dark-900 to-dark-950 flex-col justify-between p-12 overflow-hidden border-r border-dark-800">
        
        {/* Background Patterns */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay pointer-events-none"></div>
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none"></div>
        
        {/* Glowing Orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-600/20 rounded-full blur-[120px] mix-blend-screen pointer-events-none"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-[120px] mix-blend-screen pointer-events-none"></div>

        <div className="relative z-10 flex items-center gap-3">
          <Shield className="h-10 w-10 text-primary-500" />
          <span className="text-2xl font-bold text-white tracking-tight">Vulnalyze</span>
        </div>

        <div className="relative z-10 max-w-xl">
          <h1 className="text-4xl lg:text-5xl font-extrabold text-white leading-tight mb-6 tracking-tight">
            The Autonomous <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-indigo-400">
              DevSecOps Engine
            </span>
          </h1>
          <p className="text-lg text-dark-300 mb-8 leading-relaxed">
            Stop pasting code into chatbots. Vulnalyze identifies vulnerabilities across your entire fleet and automatically dispatches CrewAI agents to generate Pull Requests for you.
          </p>
          
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-dark-200">
              <ShieldAlert className="text-primary-500 h-5 w-5" />
              <span>Fleet-wide AI Pull Request Campaigns</span>
            </div>
            <div className="flex items-center gap-3 text-dark-200">
              <Code className="text-primary-500 h-5 w-5" />
              <span>Intelligent Remediation Sandboxing</span>
            </div>
            <div className="flex items-center gap-3 text-dark-200">
              <Lock className="text-primary-500 h-5 w-5" />
              <span>Role-Based Access Control & Governance</span>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-sm text-dark-500">
          © {new Date().getFullYear()} Vulnalyze Enterprise. All rights reserved.
        </div>
      </div>

      {/* Right Pane - Form */}
      <div className="flex-1 flex flex-col justify-center items-center p-8 bg-dark-900 relative">
        <div className="w-full max-w-md space-y-8 relative z-10">
          
          <div className="text-center">
            <h2 className="text-3xl font-bold text-white mb-2">Sign In</h2>
            <p className="text-dark-400">Enter your credentials to access the platform</p>
          </div>

          <div className="bg-dark-800/50 border border-dark-700 p-8 rounded-2xl shadow-xl backdrop-blur-sm">
            {error && (
              <div className="mb-6 rounded-lg border border-severity-critical/30 bg-severity-critical/10 px-4 py-3 text-sm text-severity-critical">
                {error}
              </div>
            )}

            <form className="space-y-5" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-dark-300">
                  Email Address
                </label>
                <div className="relative">
                  <Mail size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-dark-400" />
                  <input
                    id="email"
                    type="email"
                    className="input pl-11 py-2.5 w-full bg-dark-900/50 border-dark-600 focus:border-primary-500 focus:ring-primary-500/20"
                    placeholder="user@vulnalyze.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-dark-300">
                  Password
                </label>
                <div className="relative">
                  <Lock size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-dark-400" />
                  <input
                    id="password"
                    type="password"
                    className="input pl-11 py-2.5 w-full bg-dark-900/50 border-dark-600 focus:border-primary-500 focus:ring-primary-500/20"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                variant="primary" 
                className="w-full py-3 mt-4 text-sm font-bold shadow-[0_0_15px_rgba(79,70,229,0.3)] hover:shadow-[0_0_20px_rgba(79,70,229,0.5)] transition-all duration-300"
                disabled={loading}
                icon={<LogIn size={18} />}
              >
                {loading ? 'Authenticating...' : 'Sign In to Vulnalyze'}
              </Button>
            </form>

            <div className="mt-8 border-t border-dark-700 pt-6">
              <p className="text-center text-[11px] font-semibold uppercase tracking-wider text-dark-500 mb-4">
                Test Accounts
              </p>
              <div className="grid grid-cols-2 gap-3">
                <button 
                  type="button" 
                  onClick={() => fillCredentials('ADMIN')}
                  className="text-xs py-2 px-3 rounded-lg bg-dark-900 border border-dark-600 text-dark-300 hover:text-primary-400 hover:border-primary-500/50 transition-colors"
                >
                  Admin Role
                </button>
                <button 
                  type="button" 
                  onClick={() => fillCredentials('DEVELOPER')}
                  className="text-xs py-2 px-3 rounded-lg bg-dark-900 border border-dark-600 text-dark-300 hover:text-indigo-400 hover:border-indigo-500/50 transition-colors"
                >
                  Developer Role
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
