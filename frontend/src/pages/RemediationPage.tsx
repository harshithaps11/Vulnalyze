import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { PageContainer } from '../components/layout/PageContainer';
import { RemediationSandbox } from '../components/RemediationSandbox';
import { AttackPathVisualization } from '../components/AttackPathVisualization';
import { AIAssistant } from '../components/AIAssistant';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { 
  Code, 
  Brain, 
  TestTube, 
  History, 
  Share2, 
  Download, 
  Bot, 
  CheckCircle2, 
  AlertTriangle, 
  Copy, 
  Clock, 
  Loader2, 
  BookOpen, 
  ShieldAlert, 
  Sparkles,
  RefreshCw,
  FileCode2
} from 'lucide-react';
import { getCodeExplanation, getBestPractices, getPerformanceAnalysis } from '../services/aiService';
import { Vulnerability } from '../services/wasmService';

const EXAMPLE_VULNERABLE_CODE = `// Intentionally Vulnerable Security Remediation Sandbox
// Edit the code below or paste your source snippet to analyze & fix in real-time.

function displayUserData(userInput) {
  const element = document.getElementById('output');
  element.innerHTML = userInput; // [VULN: XSS] innerHTML assignment
}

function searchDatabase(query) {
  const sql = "SELECT * FROM users WHERE name = '" + query + "'"; // [VULN: SQLi] Unparameterized query
  return db.execute(sql);
}

function processCommand(input) {
  return eval(input); // [VULN: RCE] Dynamic code execution
}
`;

const SECURITY_PATTERNS = [
  {
    id: 1,
    name: 'XSS Sanitization (DOMPurify)',
    code: `function displayUserData(userInput) {\n  const element = document.getElementById('output');\n  element.textContent = userInput; // Safe DOM text node assignment\n}`,
    description: 'Replaces dangerous innerHTML with textContent to prevent Cross-Site Scripting.',
  },
  {
    id: 2,
    name: 'SQL Parameterization',
    code: `function searchDatabase(query) {\n  const sql = "SELECT * FROM users WHERE name = ?";\n  return db.execute(sql, [query]); // Parameterized query\n}`,
    description: 'Eliminates SQL injection by binding parameters separately from statement logic.',
  },
  {
    id: 3,
    name: 'Command Execution Defense',
    code: `function processCommand(input) {\n  const sanitized = String(input).replace(/[^a-zA-Z0-9_-]/g, "");\n  return safeExecuteHandler(sanitized);\n}`,
    description: 'Removes eval()/exec() and uses strict whitelist input validation.',
  },
  {
    id: 4,
    name: 'Secure Password Hashing',
    code: `async function hashPassword(password) {\n  const encoder = new TextEncoder();\n  const hash = await crypto.subtle.digest("SHA-256", encoder.encode(password));\n  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, "0")).join("");\n}`,
    description: 'Uses Web Crypto API SHA-256 hashing for password safety.',
  },
];

interface CodeHistoryItem {
  id: string;
  code: string;
  timestamp: string;
}

export function RemediationPage() {
  const location = useLocation();
  const [code, setCode] = useState(EXAMPLE_VULNERABLE_CODE);
  const [targetLine, setTargetLine] = useState<number | undefined>(undefined);
  const [activeTab, setActiveTab] = useState<'editor' | 'analysis'>('editor');
  const [remediationVulnerabilities, setRemediationVulnerabilities] = useState<Vulnerability[]>([]);

  // AI & Analysis State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<{
    explanation?: string;
    bestPractices?: any[];
    performance?: any[];
  }>({});
  const [aiSuggestions, setAISuggestions] = useState<string[]>([]);
  const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState(false);

  // Payload Simulator State
  const [customPayload, setCustomPayload] = useState('');
  const [isTestingPayload, setIsTestingPayload] = useState(false);
  const [payloadResults, setPayloadResults] = useState<any>(null);

  // History & Share State
  const [codeHistory, setCodeHistory] = useState<CodeHistoryItem[]>([]);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareLink, setShareLink] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  const payloadRef = useRef<HTMLDivElement>(null);

  // Load passed state from routing (e.g. from ScanResults)
  useEffect(() => {
    if (location.state) {
      if (location.state.code) setCode(location.state.code);
      if (location.state.line) setTargetLine(location.state.line);
    }
  }, [location.state]);

  // Load local code history
  useEffect(() => {
    const saved = localStorage.getItem('vulnalyze_code_history');
    if (saved) {
      try {
        setCodeHistory(JSON.parse(saved));
      } catch (e) {
        /* ignore */
      }
    }
  }, []);

  const handleCodeChange = (newCode: string) => {
    setCode(newCode);
    const item: CodeHistoryItem = {
      id: String(Date.now()),
      code: newCode,
      timestamp: new Date().toISOString(),
    };
    setCodeHistory(prev => {
      const updated = [item, ...prev].slice(0, 10);
      localStorage.setItem('vulnalyze_code_history', JSON.stringify(updated));
      return updated;
    });
  };

  const handleRunAIAnalysis = async () => {
    if (!code.trim()) return;
    setIsAnalyzing(true);
    try {
      const [explanation, bestPractices, performance] = await Promise.all([
        getCodeExplanation(code),
        getBestPractices(code),
        getPerformanceAnalysis(code),
      ]);
      setAnalysisResults({ explanation, bestPractices, performance });
      setActiveTab('analysis');
    } catch (err) {
      console.error('Error running AI code analysis:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleGenerateSuggestions = async () => {
    setIsGeneratingSuggestions(true);
    try {
      const practices = await getBestPractices(code);
      if (Array.isArray(practices) && practices.length > 0) {
        setAISuggestions(practices.map((b: any) => `${b.type}: ${b.description}`));
      } else {
        setAISuggestions([
          'DOM Sanitization: Use textContent or DOMPurify.sanitize() instead of innerHTML',
          'Database Protection: Bind SQL parameters separately (e.g. db.execute(sql, [params]))',
          'Code Execution Guard: Avoid eval()/exec() and enforce input whitelisting',
        ]);
      }
    } catch (e) {
      setAISuggestions(['Input Validation: Validate input length and character whitelists.']);
    } finally {
      setIsGeneratingSuggestions(false);
    }
  };

  const handleTestPayload = () => {
    if (!customPayload.trim()) return;
    setIsTestingPayload(true);

    setTimeout(() => {
      const p = customPayload.trim();
      const codeUpper = code.toUpperCase();

      const isXSS = /<script|javascript:|onerror=|onload=|innerHTML/i.test(p);
      const isSQLi = /'|\bOR\b|\bAND\b|--|UNION|SELECT/i.test(p);
      const isCmd = /;|\||`|\$|eval|exec|system/i.test(p);

      const findings: any[] = [];
      if (isXSS && code.includes('innerHTML')) {
        findings.push({
          type: 'Cross-Site Scripting (XSS)',
          severity: 'high',
          description: `Payload "${p}" executed via un-sanitized DOM write (innerHTML).`,
        });
      }

      if (isSQLi && (codeUpper.includes('SELECT') || codeUpper.includes('WHERE')) && code.includes('+')) {
        findings.push({
          type: 'SQL Injection',
          severity: 'high',
          description: `Payload "${p}" broke out of query structure via string concatenation.`,
        });
      }

      if (isCmd && (code.includes('eval') || code.includes('exec'))) {
        findings.push({
          type: 'Command Injection / RCE',
          severity: 'critical',
          description: `Payload "${p}" executed via dynamic code evaluation sink (eval/exec).`,
        });
      }

      setPayloadResults({
        payload: p,
        isVulnerable: findings.length > 0,
        findings: findings.length > 0 ? findings : [{
          type: 'Payload Neutralized',
          severity: 'info',
          description: `Payload "${p}" was tested against active code. No vulnerable execution sinks were triggered.`,
        }],
      });
      setIsTestingPayload(false);
    }, 600);
  };

  const handleShare = () => {
    const data = btoa(JSON.stringify({ code, timestamp: new Date().toISOString() }));
    const link = `${window.location.origin}/remediation?data=${data}`;
    setShareLink(link);
    setShowShareModal(true);
  };

  const handleQuickFix = (fixedCode: string) => {
    handleCodeChange(fixedCode);
  };

  return (
    <PageContainer
      title="AI Code Remediation & Security Sandbox"
      description="Refactor vulnerable code snippets in real-time with automated SAST checks and LangChain AI guidance"
      actions={
        <div className="flex flex-wrap gap-2">
          <Button
            variant="primary"
            size="sm"
            icon={isAnalyzing ? <Loader2 size={16} className="animate-spin" /> : <Brain size={16} />}
            onClick={handleRunAIAnalysis}
            disabled={isAnalyzing}
          >
            {isAnalyzing ? 'Analyzing...' : 'Run AI Analysis'}
          </Button>

          <Button
            variant="secondary"
            size="sm"
            icon={<History size={16} />}
            onClick={() => setShowHistoryModal(true)}
          >
            History
          </Button>

          <Button
            variant="secondary"
            size="sm"
            icon={<Share2 size={16} />}
            onClick={handleShare}
          >
            Share
          </Button>

          <Button
            variant="secondary"
            size="sm"
            icon={<TestTube size={16} />}
            onClick={() => payloadRef.current?.scrollIntoView({ behavior: 'smooth' })}
          >
            Payload Simulator
          </Button>
        </div>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Editor & Analysis Workspace */}
        <div className="lg:col-span-8 space-y-6">
          <Card className="!p-0 overflow-hidden">
            {/* Header Tabs */}
            <div className="flex border-b border-dark-700/80 bg-dark-800/90 px-4 pt-2">
              <button
                onClick={() => setActiveTab('editor')}
                className={`px-4 py-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all ${
                  activeTab === 'editor'
                    ? 'border-primary-500 text-primary-400 font-bold'
                    : 'border-transparent text-dark-400 hover:text-dark-200'
                }`}
              >
                <Code size={16} />
                Code Editor & Real-time SAST
              </button>

              <button
                onClick={() => setActiveTab('analysis')}
                className={`px-4 py-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all ${
                  activeTab === 'analysis'
                    ? 'border-primary-500 text-primary-400 font-bold'
                    : 'border-transparent text-dark-400 hover:text-dark-200'
                }`}
              >
                <BookOpen size={16} />
                AI Security Review & Best Practices
              </button>
            </div>

            <div className="p-5">
              {activeTab === 'editor' ? (
                <RemediationSandbox
                  initialCode={code}
                  onCodeChange={handleCodeChange}
                  isDarkMode={true}
                  targetLine={targetLine}
                  onVulnerabilitiesChange={setRemediationVulnerabilities}
                />
              ) : (
                <div className="space-y-6 max-h-[550px] overflow-y-auto pr-1 custom-scrollbar">
                  {!analysisResults.explanation && !isAnalyzing && (
                    <div className="text-center py-12">
                      <Brain size={36} className="mx-auto text-primary-400 mb-3 animate-pulse" />
                      <p className="text-sm text-dark-300">
                        Click <span className="font-semibold text-dark-100">"Run AI Analysis"</span> above to generate deep AI code explanations, best practice recommendations, and performance metrics.
                      </p>
                      <Button variant="primary" size="sm" className="mt-4" onClick={handleRunAIAnalysis}>
                        Run AI Analysis
                      </Button>
                    </div>
                  )}

                  {isAnalyzing && (
                    <div className="flex flex-col items-center justify-center py-12 text-dark-300">
                      <Loader2 size={32} className="animate-spin text-primary-400 mb-3" />
                      <p className="text-sm font-medium">LangChain Security Agent is analyzing your code...</p>
                    </div>
                  )}

                  {analysisResults.explanation && !isAnalyzing && (
                    <div className="space-y-4">
                      {/* Code Explanation */}
                      <div className="p-4 bg-dark-700/40 rounded-xl border border-dark-600/60">
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-primary-400 mb-2 flex items-center gap-1.5">
                          <Sparkles size={14} />
                          AI Security Explanation
                        </h4>
                        <p className="text-xs text-dark-200 leading-relaxed font-sans">{analysisResults.explanation}</p>
                      </div>

                      {/* Best Practices */}
                      <div className="p-4 bg-dark-700/40 rounded-xl border border-dark-600/60">
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-severity-low mb-2 flex items-center gap-1.5">
                          <CheckCircle2 size={14} />
                          Best Practice Recommendations
                        </h4>
                        {Array.isArray(analysisResults.bestPractices) && analysisResults.bestPractices.length > 0 ? (
                          <div className="space-y-2">
                            {analysisResults.bestPractices.map((bp: any, idx: number) => (
                              <div key={idx} className="flex justify-between items-center text-xs border-b border-dark-700/60 pb-2 last:border-b-0">
                                <div>
                                  <span className="font-semibold text-dark-100">{bp.type}</span>: <span className="text-dark-300">{bp.description}</span>
                                </div>
                                <Badge variant="info" className="text-[10px]">
                                  Priority {bp.priority}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-dark-300">Current code aligns with standard security best practices.</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </Card>

          {/* Attack Path Visualization */}
          <AttackPathVisualization isDarkMode={true} vulnerabilities={remediationVulnerabilities} />

          {/* Interactive Payload Testing Simulator */}
          <div ref={payloadRef}>
            <Card>
              <h3 className="text-base font-semibold text-dark-100 mb-3 flex items-center gap-2">
                <TestTube size={18} className="text-severity-critical" />
                Custom Payload Testing Simulator
              </h3>

              <div className="space-y-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    className="input text-xs font-mono"
                    placeholder="Enter payload string (e.g. <script>alert(1)</script> or ' OR '1'='1)..."
                    value={customPayload}
                    onChange={e => setCustomPayload(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleTestPayload();
                    }}
                  />
                  <Button variant="danger" size="sm" onClick={handleTestPayload} disabled={isTestingPayload || !customPayload.trim()}>
                    {isTestingPayload ? 'Testing...' : 'Simulate Payload'}
                  </Button>
                </div>

                {payloadResults && (
                  <div className="p-4 bg-dark-700/40 rounded-xl border border-dark-600/60 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-dark-300">
                        Tested Payload: <code className="font-mono text-primary-400 bg-dark-900 px-1.5 py-0.5 rounded">{payloadResults.payload}</code>
                      </span>
                      <Badge variant={payloadResults.isVulnerable ? 'critical' : 'low'}>
                        {payloadResults.isVulnerable ? 'Vulnerable Sink Triggered' : 'Neutralized'}
                      </Badge>
                    </div>

                    <div className="space-y-2">
                      {payloadResults.findings?.map((f: any, idx: number) => (
                        <div key={idx} className="p-3 bg-dark-900/80 rounded-lg border border-dark-700 text-xs">
                          <div className="font-semibold text-severity-high">{f.type}</div>
                          <p className="text-dark-300 mt-1">{f.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>

        {/* Sidebar Workspace */}
        <div className="lg:col-span-4 space-y-6">
          {/* AI Security Assistant */}
          <Card className="!p-0 overflow-hidden">
            <AIAssistant isDarkMode={true} currentCode={code} onQuickFix={handleQuickFix} />
          </Card>

          {/* Security Patterns & Snippets Library */}
          <Card>
            <h3 className="text-sm font-semibold text-dark-100 mb-3 flex items-center gap-2">
              <FileCode2 size={16} className="text-primary-400" />
              Security Patterns Library
            </h3>

            <div className="space-y-3">
              {SECURITY_PATTERNS.map(pattern => (
                <div
                  key={pattern.id}
                  onClick={() => setCode(pattern.code)}
                  className="p-3 bg-dark-700/40 hover:bg-dark-700/80 rounded-xl border border-dark-600/60 cursor-pointer transition-all hover:border-primary-500/50 shadow-sm"
                >
                  <h4 className="text-xs font-semibold text-dark-100 flex items-center justify-between">
                    <span>{pattern.name}</span>
                    <span className="text-[10px] text-primary-400">Load Snippet →</span>
                  </h4>
                  <p className="text-[11px] text-dark-400 mt-1 leading-relaxed">{pattern.description}</p>
                </div>
              ))}
            </div>
          </Card>

          {/* AI Suggestions Box */}
          <Card>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-dark-100 flex items-center gap-2">
                <Bot size={16} className="text-violet-400" />
                AI Security Suggestions
              </h3>
              <button
                onClick={handleGenerateSuggestions}
                className="text-xs text-primary-400 hover:underline flex items-center gap-1"
                disabled={isGeneratingSuggestions}
              >
                {isGeneratingSuggestions ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
                Generate
              </button>
            </div>

            <div className="space-y-2">
              {aiSuggestions.length > 0 ? (
                aiSuggestions.map((sug, i) => (
                  <div key={i} className="p-2.5 bg-dark-700/40 rounded-lg border border-dark-600/60 text-xs text-dark-200">
                    {sug}
                  </div>
                ))
              ) : (
                <p className="text-xs text-dark-400 text-center py-4">
                  Click "Generate" to fetch AI recommendations for active code.
                </p>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-dark-950/80 backdrop-blur-sm p-4">
          <div className="bg-dark-800 border border-dark-700 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-dark-100 flex items-center gap-2">
              <Share2 size={18} className="text-primary-400" />
              Share Code Workspace
            </h3>
            <div className="flex gap-2">
              <input type="text" className="input text-xs font-mono" value={shareLink} readOnly />
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(shareLink);
                  setCopiedLink(true);
                  setTimeout(() => setCopiedLink(false), 2000);
                }}
              >
                {copiedLink ? 'Copied!' : 'Copy'}
              </Button>
            </div>
            <div className="flex justify-end pt-2">
              <Button variant="secondary" size="sm" onClick={() => setShowShareModal(false)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* History Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-dark-950/80 backdrop-blur-sm p-4">
          <div className="bg-dark-800 border border-dark-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-dark-100 flex items-center gap-2">
              <History size={18} className="text-primary-400" />
              Code Revision History
            </h3>

            <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar pr-1">
              {codeHistory.length > 0 ? (
                codeHistory.map((item, idx) => (
                  <div
                    key={item.id}
                    onClick={() => {
                      setCode(item.code);
                      setShowHistoryModal(false);
                    }}
                    className="p-3 bg-dark-700/40 hover:bg-dark-700 rounded-xl border border-dark-600/60 cursor-pointer text-xs transition-all flex justify-between items-center"
                  >
                    <div>
                      <div className="font-mono text-dark-200 text-[11px] truncate max-w-[280px]">
                        {item.code.split('\n')[0]}
                      </div>
                      <div className="text-[10px] text-dark-400 mt-1 flex items-center gap-1">
                        <Clock size={10} />
                        {new Date(item.timestamp).toLocaleString()}
                      </div>
                    </div>
                    <span className="text-[10px] text-primary-400 font-semibold">Restore →</span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-dark-400 text-center py-4">No past revisions saved yet.</p>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <Button variant="secondary" size="sm" onClick={() => setShowHistoryModal(false)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
}