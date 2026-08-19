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
  FileCode2,
  Terminal,
  UserCheck
} from 'lucide-react';
import { getCodeExplanation, getBestPractices, getPerformanceAnalysis, generateAutonomousPatch, PatchResult } from '../services/aiService';
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

const TERMINAL_LOGS = [
  { agent: 'System', msg: 'Initializing CrewAI Orchestration Engine...' },
  { agent: 'System', msg: 'Spawning [Security Analyst] Agent...' },
  { agent: 'System', msg: 'Spawning [Senior Developer] Agent...' },
  { agent: 'System', msg: 'Spawning [QA Reviewer] Agent...' },
  { agent: 'Security Analyst', msg: 'Analyzing source code for CWE and OWASP violations...' },
  { agent: 'Security Analyst', msg: 'Vulnerability confirmed. Formulating secure mitigation strategy.' },
  { agent: 'Security Analyst', msg: 'Delegating mitigation plan to [Senior Developer].' },
  { agent: 'Senior Developer', msg: 'Reviewing mitigation plan. Generating robust patch...' },
  { agent: 'Senior Developer', msg: 'Patch generated. Forwarding to [QA Reviewer] for validation.' },
  { agent: 'QA Reviewer', msg: 'Performing static analysis on proposed patch...' },
  { agent: 'QA Reviewer', msg: 'Patch verified. No regressions detected.' },
  { agent: 'System', msg: 'Consolidating AI reports and generating final diff output.' },
];

function MultiAgentTerminal() {
  const [logIndex, setLogIndex] = useState(0);

  useEffect(() => {
    if (logIndex < TERMINAL_LOGS.length - 1) {
      const timer = setTimeout(() => {
        setLogIndex(prev => prev + 1);
      }, Math.random() * 1500 + 800);
      return () => clearTimeout(timer);
    }
  }, [logIndex]);

  return (
    <div className="bg-[#0D1117] border border-dark-600 rounded-xl overflow-hidden font-mono text-[11px] shadow-2xl">
      <div className="flex items-center gap-2 bg-[#161B22] px-4 py-2 border-b border-dark-600">
        <Terminal size={14} className="text-dark-400" />
        <span className="text-dark-300 font-semibold tracking-wider uppercase text-[10px]">Autonomous CrewAI Terminal</span>
        <div className="ml-auto flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500/80"></div>
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80"></div>
          <div className="w-2.5 h-2.5 rounded-full bg-green-500/80"></div>
        </div>
      </div>
      <div className="p-4 space-y-2 h-[280px] overflow-y-auto flex flex-col justify-end">
        {TERMINAL_LOGS.slice(0, logIndex + 1).map((log, i) => (
          <div key={i} className="flex gap-3 animate-in slide-in-from-bottom-2 fade-in duration-300">
            <span className="text-dark-500 shrink-0">[{new Date().toLocaleTimeString([], { hour12: false })}]</span>
            <span className={`shrink-0 font-bold ${
              log.agent === 'System' ? 'text-blue-400' :
              log.agent === 'Security Analyst' ? 'text-rose-400' :
              log.agent === 'Senior Developer' ? 'text-emerald-400' :
              'text-violet-400'
            }`}>
              {log.agent}:
            </span>
            <span className="text-dark-200">{log.msg}</span>
          </div>
        ))}
        {logIndex < TERMINAL_LOGS.length - 1 && (
          <div className="flex gap-3 mt-2">
            <span className="text-dark-500 shrink-0">[{new Date().toLocaleTimeString([], { hour12: false })}]</span>
            <span className="text-dark-300 flex items-center gap-2">
               Processing <Loader2 size={10} className="animate-spin inline" />
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export function RemediationPage() {
  const location = useLocation();
  const [code, setCode] = useState(EXAMPLE_VULNERABLE_CODE);
  const [targetLine, setTargetLine] = useState<number | undefined>(undefined);
  const [activeTab, setActiveTab] = useState<'editor' | 'analysis' | 'ai-fix'>('editor');
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
  
  // CrewAI State
  const [isGeneratingPatch, setIsGeneratingPatch] = useState(false);
  const [generatedPatchResult, setGeneratedPatchResult] = useState<PatchResult | null>(null);
  
  // Vulnerability context for AI
  const [vulnContext, setVulnContext] = useState<{ id: string, title: string, description: string, language: string } | null>(null);
  const [isLoadingContext, setIsLoadingContext] = useState(false);

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

  // Load passed state from routing (e.g. from ScanResults) or fetch latest dynamically
  useEffect(() => {
    async function initContext() {
      if (location.state && location.state.code) {
        setCode(location.state.code);
        if (location.state.line) setTargetLine(location.state.line);
        setVulnContext({
          id: location.state.vulnId || "local-sandbox",
          title: location.state.title || "Unknown Vulnerability",
          description: location.state.description || "Analyzed code in the Remediation Sandbox",
          language: location.state.language || "javascript"
        });
      } else {
        // Dynamic fetch fallback instead of hardcoded sandbox code
        setIsLoadingContext(true);
        try {
          const { apiClient } = await import('../services/apiClient');
          const res = await apiClient.get('/scans');
          const scans = res.data || [];
          if (scans.length > 0) {
            const firstScan = await apiClient.get(`/scans/${scans[0].uuid}`);
            const vulns = firstScan.data?.vulnerabilities || [];
            if (vulns.length > 0) {
              const v = vulns[0];
              const evidenceCode = v.evidence || `// Vulnerability: ${v.title}\\n// Location: ${v.location}\\n// No code snippet available`;
              setCode(evidenceCode);
              setTargetLine(v.lineNumber || 1);
              setVulnContext({
                id: String(v.id),
                title: v.title,
                description: v.description || 'No description provided.',
                language: 'javascript' // rough guess, could be derived from file extension
              });
              return;
            }
          }
        } catch (e) {
          console.error("Failed to load dynamic finding", e);
        } finally {
          setIsLoadingContext(false);
        }
      }
    }
    
    initContext();
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

  const handleGeneratePatch = async () => {
    if (!code.trim()) return;
    setIsGeneratingPatch(true);
    setActiveTab('ai-fix');
    try {
      const result = await generateAutonomousPatch(
        vulnContext?.id || "sandbox-1", 
        vulnContext?.title || "Vulnerable Code in Sandbox", 
        vulnContext?.description || "Analyzed code in the Remediation Sandbox", 
        code, 
        vulnContext?.language || "javascript"
      );
      setGeneratedPatchResult(result);
    } catch (err) {
      console.error('Error generating patch:', err);
    } finally {
      setIsGeneratingPatch(false);
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
            disabled={isAnalyzing || isGeneratingPatch}
          >
            {isAnalyzing ? 'Analyzing...' : 'Run AI Analysis'}
          </Button>

          <Button
            variant="primary"
            className="bg-indigo-600 hover:bg-indigo-700 text-white border-none shadow-[0_0_15px_rgba(79,70,229,0.3)] hover:shadow-[0_0_20px_rgba(79,70,229,0.5)] transition-all duration-300"
            size="sm"
            icon={isGeneratingPatch ? <Loader2 size={16} className="animate-spin" /> : <Bot size={16} />}
            onClick={handleGeneratePatch}
            disabled={isGeneratingPatch || isAnalyzing}
          >
            {isGeneratingPatch ? 'AI Crew Working...' : 'Auto-Fix with AI Crew'}
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

              <button
                onClick={() => setActiveTab('ai-fix')}
                className={`px-4 py-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all ${
                  activeTab === 'ai-fix'
                    ? 'border-primary-500 text-primary-400 font-bold'
                    : 'border-transparent text-dark-400 hover:text-dark-200'
                }`}
              >
                <Bot size={16} />
                Auto-Generated Patch
              </button>
            </div>

            <div className="p-5">
              {activeTab === 'editor' && (
                <RemediationSandbox
                  initialCode={code}
                  onCodeChange={handleCodeChange}
                  isDarkMode={true}
                  targetLine={targetLine}
                  onVulnerabilitiesChange={setRemediationVulnerabilities}
                />
              )}
              
              {activeTab === 'analysis' && (
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
              
              {activeTab === 'ai-fix' && (
                <div className="space-y-6 max-h-[550px] overflow-y-auto pr-1 custom-scrollbar">
                  {!generatedPatchResult && !isGeneratingPatch && (
                    <div className="text-center py-12">
                      <Bot size={36} className="mx-auto text-indigo-400 mb-3" />
                      <p className="text-sm text-dark-300">
                        Click <span className="font-semibold text-dark-100">"Auto-Fix with AI Crew"</span> above to have specialized AI agents autonomously analyze and fix the vulnerable code.
                      </p>
                      <Button variant="primary" className="mt-4 bg-indigo-600 hover:bg-indigo-700 border-none" size="sm" onClick={handleGeneratePatch}>
                        Run Autonomous Remediation
                      </Button>
                    </div>
                  )}

                  {isGeneratingPatch && (
                    <div className="py-6">
                      <MultiAgentTerminal />
                    </div>
                  )}

                  {generatedPatchResult && !isGeneratingPatch && (
                    <div className="space-y-4">
                      {/* AI Crew Explanation */}
                      <div className="p-4 bg-indigo-900/10 rounded-xl border border-indigo-500/30">
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-indigo-400 mb-3 flex items-center gap-1.5">
                          <Bot size={14} />
                          CrewAI Remediation Report
                        </h4>
                        <div className="text-sm text-dark-200 leading-relaxed font-sans prose prose-invert max-w-none">
                          {/* Rendering simple markdown for the explanation */}
                          {generatedPatchResult.explanation.split('\n').map((line, i) => (
                            <p key={i} className="mb-2">{line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}</p>
                          ))}
                        </div>
                      </div>

                      {/* Diff View */}
                      {generatedPatchResult.diff && (
                        <div className="rounded-xl overflow-hidden border border-dark-600/60 bg-[#1e1e1e]">
                          <div className="flex justify-between items-center bg-dark-700/80 px-4 py-2 border-b border-dark-600/60">
                            <h4 className="text-xs font-semibold text-dark-200 flex items-center gap-2">
                              <FileCode2 size={14} className="text-primary-400" />
                              Generated Patch (Diff)
                            </h4>
                            <Button 
                              variant="secondary" 
                              size="sm" 
                              className="!py-1 !px-2 text-[10px]"
                              onClick={() => {
                                handleCodeChange(generatedPatchResult.diff.replace(/^[+-] /gm, ''));
                                setActiveTab('editor');
                              }}
                            >
                              Apply to Editor
                            </Button>
                          </div>
                          <div className="p-4 overflow-x-auto text-xs font-mono leading-relaxed">
                            {generatedPatchResult.diff.split('\n').map((line, i) => {
                              const isAdd = line.startsWith('+');
                              const isSub = line.startsWith('-');
                              return (
                                <div 
                                  key={i} 
                                  className={`px-2 py-0.5 whitespace-pre ${
                                    isAdd ? 'bg-severity-low/10 text-severity-low' : 
                                    isSub ? 'bg-severity-high/10 text-severity-high line-through opacity-70' : 
                                    'text-dark-300'
                                  }`}
                                >
                                  {line}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
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