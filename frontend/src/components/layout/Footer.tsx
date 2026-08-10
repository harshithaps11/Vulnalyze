import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Github, FileText, CheckCircle2, Lock, ExternalLink } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-dark-800/80 border-t border-dark-700/80 mt-auto transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Column 1: Brand & Tagline */}
          <div className="space-y-3">
            <Link to="/" className="flex items-center gap-2">
              <Shield className="h-7 w-7 text-primary-500" />
              <span className="text-xl font-bold text-dark-100">Vulnalyze</span>
            </Link>
            <p className="text-xs text-dark-400 leading-relaxed">
              Next-generation Application Security Platform combining SAST, DAST, IaC, dependency auditing, and AI-assisted remediation.
            </p>
            <div className="flex items-center gap-2 pt-1 text-xs text-severity-low font-medium">
              <CheckCircle2 size={14} />
              <span>All Security Scanning Engines Operational</span>
            </div>
          </div>

          {/* Column 2: Navigation */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-dark-400 mb-3">Navigation</h4>
            <ul className="space-y-2 text-xs text-dark-300">
              <li>
                <Link to="/" className="hover:text-primary-400 transition-colors">Dashboard</Link>
              </li>
              <li>
                <Link to="/scan" className="hover:text-primary-400 transition-colors">New Scan</Link>
              </li>
              <li>
                <Link to="/results" className="hover:text-primary-400 transition-colors">Scan Reports & Results</Link>
              </li>
              <li>
                <Link to="/team" className="hover:text-primary-400 transition-colors">Team Collaboration</Link>
              </li>
              <li>
                <Link to="/remediation" className="hover:text-primary-400 transition-colors">AI Remediation Sandbox</Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Security & Policies */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-dark-400 mb-3">Security & Compliance</h4>
            <ul className="space-y-2 text-xs text-dark-300">
              <li className="flex items-center gap-1.5">
                <Lock size={12} className="text-primary-400" />
                <span>SSRF Defense Protections</span>
              </li>
              <li className="flex items-center gap-1.5">
                <FileText size={12} className="text-primary-400" />
                <span>OASIS SARIF v2.1.0 Compatible</span>
              </li>
              <li className="flex items-center gap-1.5">
                <Shield size={12} className="text-primary-400" />
                <span>OWASP Top 10 Rule Coverage</span>
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 size={12} className="text-primary-400" />
                <span>JWT Authentication & RBAC</span>
              </li>
            </ul>
          </div>

          {/* Column 4: Resources & Links */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-dark-400 mb-3">Developer Resources</h4>
            <ul className="space-y-2 text-xs text-dark-300">
              <li>
                <a
                  href="http://localhost:8000/docs"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-primary-400 transition-colors inline-flex items-center gap-1"
                >
                  <span>FastAPI OpenAPI Specs</span>
                  <ExternalLink size={11} />
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/harshithaps11/Vulnalyze"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-primary-400 transition-colors inline-flex items-center gap-1"
                >
                  <Github size={12} />
                  <span>GitHub Repository</span>
                </a>
              </li>
              <li>
                <a
                  href="https://owasp.org/www-project-top-ten/"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-primary-400 transition-colors inline-flex items-center gap-1"
                >
                  <span>OWASP Top 10 Standard</span>
                  <ExternalLink size={11} />
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-6 border-t border-dark-700/60 flex flex-col sm:flex-row justify-between items-center text-xs text-dark-400 gap-4">
          <p>© {new Date().getFullYear()} Vulnalyze Security. All rights reserved.</p>
          <div className="flex items-center space-x-4">
            <span className="font-mono text-[11px] bg-dark-700/60 px-2 py-1 rounded">v1.0.0 (Production)</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
