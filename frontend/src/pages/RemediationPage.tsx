import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { RemediationSandbox } from '../components/RemediationSandbox';
import { Users, History, Code, Share2, BookOpen, AlertTriangle, CheckCircle, Settings, Download, Upload, Moon, Sun, Shield, Lock, Key, Copy, Link, Clock, Brain, Network, TestTube, Users2, Bot, ArrowUp, Zap, TrendingUp } from 'lucide-react';
import * as d3 from 'd3';
import { AttackPathVisualization } from '../components/AttackPathVisualization';
import { TeamCollaboration } from '../components/TeamCollaboration';
import { Footer } from '../components/Footer';
import { AIAssistant } from '../components/AIAssistant';
import { CodeEditor } from '../components/CodeEditor';
import { getCodeExplanation, getBestPractices, getPerformanceAnalysis } from '../services/aiService';

// Import Vulnerability type from wasmService
import { Vulnerability } from '../services/wasmService';

const exampleCode = `
// Example code with vulnerabilities
function displayUserData(userInput) {
  const element = document.getElementById('output');
  element.innerHTML = userInput; // XSS vulnerability
}

function searchDatabase(query) {
  const sql = "SELECT * FROM users WHERE name = '" + query + "'"; // SQL injection
  return db.execute(sql);
}

function processCommand(input) {
  return eval(input); // Command injection
}
`;

const codeSnippets = [
  {
    id: 1,
    name: 'XSS Prevention',
    code: `// Safe way to display user input
function displayUserData(userInput) {
  const element = document.getElementById('output');
  element.textContent = userInput; // Using textContent instead of innerHTML
}`,
    description: 'Prevents XSS by using textContent instead of innerHTML'
  },
  {
    id: 2,
    name: 'SQL Injection Prevention',
    code: `// Safe way to query database
function searchDatabase(query) {
  const sql = "SELECT * FROM users WHERE name = ?";
  return db.execute(sql, [query]); // Using parameterized queries
}`,
    description: 'Prevents SQL injection using parameterized queries'
  },
  {
    id: 3,
    name: 'Command Injection Prevention',
    code: '// Safe way to process commands\n' +
          'function processCommand(input) {\n' +
          '  const sanitizedInput = input.replace(/[;&|`$]/g, "");\n' +
          '  return safeExec(sanitizedInput); // Using a safe execution function\n' +
          '}',
    description: 'Prevents command injection by sanitizing input'
  }
];

const securityPatterns = [
  {
    id: 4,
    name: 'Input Validation',
    code: '// Safe input validation\n' +
          'function validateInput(input) {\n' +
          '  // Remove any potentially dangerous characters\n' +
          '  const sanitized = input.replace(/[<>]/g, "");\n' +
          '  // Check length\n' +
          '  if (sanitized.length > 100) {\n' +
          '    throw new Error("Input too long");\n' +
          '  }\n' +
          '  return sanitized;\n' +
          '}',
    description: 'Proper input validation and sanitization'
  },
  {
    id: 5,
    name: 'Secure Password Handling',
    code: '// Secure password handling\n' +
          'async function hashPassword(password) {\n' +
          '  const encoder = new TextEncoder();\n' +
          '  const data = encoder.encode(password);\n' +
          '  const hash = await crypto.subtle.digest("SHA-256", data);\n' +
          '  return Array.from(new Uint8Array(hash))\n' +
          '    .map(b => b.toString(16).padStart(2, "0"))\n' +
          '    .join("");\n' +
          '}',
    description: 'Secure password hashing using Web Crypto API'
  },
  {
    id: 6,
    name: 'CSRF Protection',
    code: '// CSRF protection middleware\n' +
          'function csrfProtection(req, res, next) {\n' +
          '  const token = req.headers["x-csrf-token"];\n' +
          '  if (!token || token !== req.session.csrfToken) {\n' +
          '    return res.status(403).json({ error: "Invalid CSRF token" });\n' +
          '  }\n' +
          '  next();\n' +
          '}',
    description: 'CSRF protection using tokens'
  }
];

interface CodeHistory {
  id: string;
  code: string;
  timestamp: string;
  vulnerabilities: Vulnerability[];
}

// Add type definitions for D3 drag behavior
type DragSubject = d3.SimulationNodeDatum & {
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
};

interface Message {
  id: string;
  content: string;
  type: 'user' | 'assistant';
  timestamp: Date;
}

export const RemediationPage = () => {
  const location = useLocation();
  const [code, setCode] = useState(exampleCode);
  const [targetLine, setTargetLine] = useState<number | undefined>(undefined);

  useEffect(() => {
    if (location.state) {
      if (location.state.code) {
        setCode(location.state.code);
      }
      if (location.state.line) {
        setTargetLine(location.state.line);
      }
    }
  }, [location.state]);
  const [activeTab, setActiveTab] = useState('editor');
  const [selectedSnippet, setSelectedSnippet] = useState<typeof codeSnippets[0] | null>(null);
  const [showCollaborators, setShowCollaborators] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => !document.body.classList.contains('light'));
  const [showSettings, setShowSettings] = useState(false);
  const [autoSave, setAutoSave] = useState(true);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportFormat, setExportFormat] = useState('json');
  const [showShareModal, setShowShareModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [shareLink, setShareLink] = useState('');
  const [codeHistory, setCodeHistory] = useState<CodeHistory[]>([]);
  const [selectedHistory, setSelectedHistory] = useState<CodeHistory | null>(null);
  const [showAttackPath, setShowAttackPath] = useState(false);
  const [showAIExplainer, setShowAIExplainer] = useState(false);
  const [showPayloadTesting, setShowPayloadTesting] = useState(false);
  const [attackPathData, setAttackPathData] = useState<any[]>([]);
  const [aiExplanation, setAIExplanation] = useState('');
  const [customPayloads, setCustomPayloads] = useState<string[]>([]);
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [aiSuggestions, setAISuggestions] = useState<string[]>([]);
  const [customPayload, setCustomPayload] = useState('');
  const [testResults, setTestResults] = useState<any>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [remediationVulnerabilities, setRemediationVulnerabilities] = useState<Vulnerability[]>([]);
  const aiExplainerRef = useRef<HTMLDivElement>(null);
  const testPayloadRef = useRef<HTMLDivElement>(null);
  const [activeSection, setActiveSection] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<{
    explanation?: string;
    bestPractices?: any[];
    performance?: any[];
  }>({});

  useEffect(() => {
    // Load code history from localStorage
    const savedHistory = localStorage.getItem('codeHistory');
    if (savedHistory) {
      setCodeHistory(JSON.parse(savedHistory));
    }
  }, []);

  useEffect(() => {
    // Observer to watch document.body class changes for light/dark mode
    const observer = new MutationObserver(() => {
      setIsDarkMode(!document.body.classList.contains('light'));
    });
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const handleCodeChange = (newCode: string) => {
    setCode(newCode);
    if (autoSave) {
      localStorage.setItem('savedCode', newCode);
      // Add to history
      const newHistory: CodeHistory = {
        id: Date.now().toString(),
        code: newCode,
        timestamp: new Date().toISOString(),
        vulnerabilities: [] // Add actual vulnerabilities here
      };
      setCodeHistory(prev => {
        const updated = [newHistory, ...prev].slice(0, 10); // Keep last 10 changes
        localStorage.setItem('codeHistory', JSON.stringify(updated));
        return updated;
      });
    }
  };

  const handleSnippetSelect = (snippet: typeof codeSnippets[0]) => {
    setSelectedSnippet(snippet);
    setActiveTab('editor');
  };

  const handleExport = () => {
    const data = {
      code,
      timestamp: new Date().toISOString(),
      vulnerabilities: [] // Add actual vulnerabilities here
    };

    let content;
    let filename;
    let mimeType;

    switch (exportFormat) {
      case 'json':
        content = JSON.stringify(data, null, 2);
        filename = 'code-analysis.json';
        mimeType = 'application/json';
        break;
      case 'txt':
        content = `Code Analysis Report\nGenerated: ${data.timestamp}\n\nCode:\n${data.code}`;
        filename = 'code-analysis.txt';
        mimeType = 'text/plain';
        break;
      default:
        return;
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setShowExportModal(false);
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        if (file.name.endsWith('.json')) {
          const data = JSON.parse(content);
          setCode(data.code);
        } else {
          setCode(content);
        }
      } catch (error) {
        console.error('Error importing file:', error);
      }
    };
    reader.readAsText(file);
  };

  const handleShare = () => {
    // Generate a shareable link
    const shareableData = {
      code,
      timestamp: new Date().toISOString()
    };
    const encodedData = btoa(JSON.stringify(shareableData));
    const link = `${window.location.origin}/remediation?share=${encodedData}`;
    setShareLink(link);
    setShowShareModal(true);
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // Show success message
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const handleHistorySelect = (history: CodeHistory) => {
    setSelectedHistory(history);
    setCode(history.code);
    setShowHistoryModal(false);
  };

  // Dynamically compute attack path nodes and edges whenever vulnerabilities change
  useEffect(() => {
    const nodes: any[] = [{ id: 'Entry: User Input', type: 'entry', label: 'User Input' }];
    const links: any[] = [];

    if (remediationVulnerabilities.length === 0) {
      nodes.push({ id: 'Secured Code Sink', type: 'safe', label: 'Safe Execution' });
      links.push({ source: 'Entry: User Input', target: 'Secured Code Sink' });
    } else {
      remediationVulnerabilities.forEach((v, idx) => {
        const vulnNodeId = `Vuln: ${v.type.toUpperCase()} (Line ${v.line})`;
        const targetNodeId = `Impact: ${v.type === 'xss' ? 'DOM Hijack' : v.type === 'sql_injection' ? 'DB Data Leakage' : v.type === 'hardcoded_key' ? 'API Key Exfiltration' : 'Remote Execution'}`;

        nodes.push({ id: vulnNodeId, type: 'vuln', label: v.description });
        nodes.push({ id: targetNodeId, type: 'impact', label: targetNodeId });

        links.push({ source: 'Entry: User Input', target: vulnNodeId });
        links.push({ source: vulnNodeId, target: targetNodeId });
      });
      setAttackPathData(nodes);
    }
  }, [remediationVulnerabilities]);

  // D3 Attack Path Visualization
  useEffect(() => {
    if (showAttackPath) {
      const svg = d3.select('#attack-path-svg');
      svg.selectAll('*').remove();

      const width = 800;
      const height = 400;
      const simulation = d3.forceSimulation<DragSubject>(attackPathData)
        .force('link', d3.forceLink().id((d: any) => d.id))
        .force('charge', d3.forceManyBody().strength(-100))
        .force('center', d3.forceCenter(width / 2, height / 2));

      const link = svg.append('g')
        .selectAll<SVGLineElement, any>('line')
        .data(attackPathData)
        .enter()
        .append('line')
        .attr('stroke', '#999')
        .attr('stroke-opacity', 0.6)
        .attr('stroke-width', 2);

      const node = svg.append('g')
        .selectAll<SVGCircleElement, DragSubject>('circle')
        .data(attackPathData)
        .enter()
        .append('circle')
        .attr('r', 5)
        .attr('fill', '#69b3a2')
        .call(d3.drag<SVGCircleElement, DragSubject>()
          .on('start', dragstarted)
          .on('drag', dragged)
          .on('end', dragended));

      simulation.on('tick', () => {
        link
          .attr('x1', (d: any) => d.source.x)
          .attr('y1', (d: any) => d.source.y)
          .attr('x2', (d: any) => d.target.x)
          .attr('y2', (d: any) => d.target.y);

        node
          .attr('cx', (d: DragSubject) => d.x || 0)
          .attr('cy', (d: DragSubject) => d.y || 0);
      });

      function dragstarted(event: d3.D3DragEvent<SVGCircleElement, DragSubject, DragSubject>) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        event.subject.fx = event.subject.x;
        event.subject.fy = event.subject.y;
      }

      function dragged(event: d3.D3DragEvent<SVGCircleElement, DragSubject, DragSubject>) {
        event.subject.fx = event.x;
        event.subject.fy = event.y;
      }

      function dragended(event: d3.D3DragEvent<SVGCircleElement, DragSubject, DragSubject>) {
        if (!event.active) simulation.alphaTarget(0);
        event.subject.fx = null;
        event.subject.fy = null;
      }
    }
  }, [showAttackPath, attackPathData]);

  // Real AI Explainer integration using our FastAPI backend via aiService
  const generateAIExplanation = async (codeToExplain: string) => {
    setIsAnalyzing(true);
    try {
      const explanation = await getCodeExplanation(codeToExplain);
      setAIExplanation(explanation);
    } catch (error) {
      console.error('Error generating AI explanation:', error);
      setAIExplanation('Failed to connect to AI explanation endpoint. Ensure backend is running.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Interactive Payload Testing Sandbox Simulator against active code
  const testPayload = async () => {
    if (!customPayload || !customPayload.trim()) return;
    
    setIsTesting(true);
    try {
      const p = customPayload.trim();
      const codeUpper = code.toUpperCase();
      const isXSSPayload = /<script|javascript:|onerror=|onload=|innerHTML/i.test(p);
      const isSQLiPayload = /'|\bOR\b|\bAND\b|--|UNION|SELECT|DROP/i.test(p);
      const isCmdPayload = /;|\||`|\$|eval|exec|system|import os/i.test(p);
      const isPromptPayload = /ignore|previous|instructions|system prompt|api_key|sk-/i.test(p);

      const findings: any[] = [];
      const recommendations: string[] = [];

      // Check against actual editor code
      if (isXSSPayload && code.includes('innerHTML') && !code.includes('DOMPurify')) {
        findings.push({
          type: 'XSS (Cross-Site Scripting)',
          severity: 'high',
          description: `Payload "${p}" executed via un-sanitized DOM write (innerHTML).`,
          status: 'VULNERABLE SINK EXPOSED'
        });
        recommendations.push('Replace innerHTML with textContent or use DOMPurify.sanitize()');
      }

      if (isSQLiPayload && (codeUpper.includes('SELECT') || codeUpper.includes('INSERT') || codeUpper.includes('WHERE')) && code.includes('+')) {
        findings.push({
          type: 'SQL Injection',
          severity: 'high',
          description: `Payload "${p}" broke out of query structure via string concatenation.`,
          status: 'UNPARAMETERIZED QUERY EXPOSED'
        });
        recommendations.push('Use parameterized prepared statements (e.g., db.execute(sql, [params]))');
      }

      if (isCmdPayload && (code.includes('eval') || code.includes('exec') || code.includes('system'))) {
        findings.push({
          type: 'Command / Code Injection',
          severity: 'critical',
          description: `Payload "${p}" passed to dynamic execution function (eval/exec/system).`,
          status: 'DYNAMIC CODE EXECUTION EXPOSED'
        });
        recommendations.push('Avoid eval()/exec() and use whitelist-validated input handlers');
      }

      if (isPromptPayload && (code.includes('openai.api_key') || code.includes('prompt = f') || code.includes('sk-proj-'))) {
        findings.push({
          type: 'Prompt Injection / Credential Leakage',
          severity: 'high',
          description: `Payload "${p}" can override system prompt context or exfiltrate exposed API keys.`,
          status: 'UNVALIDATED PROMPT CONTEXT EXPOSED'
        });
        recommendations.push('Store API keys in environment variables and sanitize prompt inputs');
      }

      const isVulnerable = findings.length > 0;

      const results = {
        status: isVulnerable ? 'vulnerable' : 'mitigated',
        payloadTested: p,
        timestamp: new Date().toLocaleTimeString(),
        vulnerabilities: isVulnerable ? findings : [{
          type: 'Safe Input Handling',
          severity: 'info',
          description: `Payload "${p}" was tested against active code. No vulnerable execution sinks were triggered.`,
          status: 'PAYLOAD NEUTRALIZED'
        }],
        recommendations: isVulnerable ? recommendations : ['Current code structure neutralizes this payload class. Maintain strict input validation.']
      };

      setTestResults(results);
    } catch (error) {
      console.error('Error testing payload:', error);
      setTestResults({ status: 'error', message: 'Failed to complete payload simulation.' });
    } finally {
      setIsTesting(false);
    }
  };

  const generateAISuggestions = async () => {
    try {
      const bestPractices = await getBestPractices(code);
      if (Array.isArray(bestPractices) && bestPractices.length > 0) {
        setAISuggestions(bestPractices.map((b: any) => `${b.type}: ${b.description} (${b.impact} impact)`));
      } else {
        setAISuggestions([
          'Input Sanitization: Use DOMPurify for XSS mitigation',
          'SQL Protection: Enforce parameterized queries for all DB calls',
          'Credential Security: Move API keys out of source code into environment variables',
          'Prompt Guard: Validate user inputs before formatting into LLM prompts'
        ]);
      }
    } catch (error) {
      console.error('Error generating AI suggestions:', error);
    }
  };

  const scrollToSection = (ref: React.RefObject<HTMLDivElement>, sectionName: string) => {
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setActiveSection(sectionName);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setActiveSection('');
  };

  // Add intersection observer for section highlighting
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { threshold: 0.5 }
    );

    const sections = document.querySelectorAll('section[id]');
    sections.forEach((section) => observer.observe(section));

    return () => observer.disconnect();
  }, []);

  const handleQuickFix = (fixedCode: string) => {
    // Update the code in the editor
    setCode(fixedCode);
    
    // Add to history
    const newHistory: CodeHistory = {
      id: Date.now().toString(),
      code: fixedCode,
      timestamp: new Date().toISOString(),
      vulnerabilities: [] // Add actual vulnerabilities here
    };
    setCodeHistory(prev => {
      const updated = [newHistory, ...prev].slice(0, 10); // Keep last 10 changes
      localStorage.setItem('codeHistory', JSON.stringify(updated));
      return updated;
    });

    // Show success message
    const successMessage: Message = {
      id: Date.now().toString(),
      content: 'Code has been updated with the security fix.',
      type: 'assistant',
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, successMessage]);
  };

  const handleAnalyze = async () => {
    if (!code.trim()) return;

    setIsAnalyzing(true);
    try {
      const [explanation, bestPractices, performance] = await Promise.all([
        getCodeExplanation(code),
        getBestPractices(code),
        getPerformanceAnalysis(code)
      ]);

      setAnalysisResults({
        explanation,
        bestPractices,
        performance
      });
      setActiveTab('analysis');
    } catch (error) {
      console.error('Error analyzing code:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className={`min-h-screen flex flex-col ${isDarkMode ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
      <div className="flex-grow">
        <div className="container mx-auto px-4 py-8">
          {/* Header Section */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Code Remediation Sandbox
              </h1>
              <p className={`mt-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Fix security vulnerabilities in real-time with AI-powered suggestions
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={handleAnalyze}
                disabled={isAnalyzing}
                className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-gray-500 transition-colors"
                title="Run full AI security review"
              >
                {isAnalyzing ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Brain className="w-4 h-4 mr-2" />
                )}
                Run AI Analysis
              </button>
              <button
                onClick={() => setShowHistoryModal(true)}
                className="flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
              >
                <History className="w-4 h-4 mr-2" />
                History
              </button>
              <button
                onClick={handleShare}
                className="flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </button>
              <button
                onClick={() => scrollToSection(testPayloadRef, 'test-payload')}
                className="flex items-center px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 transition-colors"
              >
                <TestTube className="w-4 h-4 mr-2" />
                Test Payloads
              </button>
            </div>
          </div>

          <div className="grid grid-cols-12 gap-6">
            {/* Main Content */}
            <div className="col-span-8">
              <div className={`rounded-xl shadow-lg overflow-hidden ${
                isDarkMode ? 'bg-gray-800' : 'bg-white'
              }`}>
                <div className={`border-b ${
                  isDarkMode ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-gray-50'
                }`}>
                  <nav className="flex -mb-px">
                    <button
                      onClick={() => setActiveTab('editor')}
                      className={`px-6 py-3 text-sm font-medium flex items-center ${
                        activeTab === 'editor'
                          ? 'border-b-2 border-blue-500 text-blue-600'
                          : isDarkMode ? 'text-gray-300 hover:text-white' : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      <Code className="w-4 h-4 mr-2" />
                      Editor
                    </button>
                    <button
                      onClick={() => setActiveTab('analysis')}
                      className={`px-6 py-3 text-sm font-medium flex items-center ${
                        activeTab === 'analysis'
                          ? 'border-b-2 border-blue-500 text-blue-600'
                          : isDarkMode ? 'text-gray-300 hover:text-white' : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      <BookOpen className="w-4 h-4 mr-2" />
                      Analysis
                    </button>
                  </nav>
                </div>

                <div className="p-4">
                  {activeTab === 'editor' ? (
                    <RemediationSandbox
                      initialCode={code}
                      onCodeChange={handleCodeChange}
                      isDarkMode={isDarkMode}
                      targetLine={targetLine}
                      onVulnerabilitiesChange={setRemediationVulnerabilities}
                    />
                  ) : (
                    <div className="space-y-6 max-h-[500px] overflow-y-auto pr-2">
                      {!analysisResults.explanation && !isAnalyzing && (
                        <div className="text-center py-12">
                          <Brain className="w-12 h-12 mx-auto text-dark-400 mb-3 animate-pulse" />
                          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            Click "Run AI Security Analysis" in the top bar to generate code explanations, best practices, and performance metrics.
                          </p>
                          <button
                            onClick={handleAnalyze}
                            className="mt-4 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                          >
                            Run AI Security Analysis
                          </button>
                        </div>
                      )}

                      {isAnalyzing && (
                        <div className="flex flex-col items-center justify-center py-12">
                          <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-3" />
                          <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                            AI engine is analyzing your code structure...
                          </p>
                        </div>
                      )}

                      {analysisResults.explanation && !isAnalyzing && (
                        <div className="space-y-6 text-left">
                          {/* Code Explanation */}
                          <div className={`p-4 rounded-lg border ${isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                            <h3 className="text-sm font-semibold uppercase tracking-wider text-blue-500 mb-2">AI Code Explanation</h3>
                            <p className={`text-sm leading-relaxed ${isDarkMode ? 'text-gray-300' : 'text-gray-800'}`}>
                              {analysisResults.explanation}
                            </p>
                          </div>

                          {/* Best Practices */}
                          <div className={`p-4 rounded-lg border ${isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                            <h3 className="text-sm font-semibold uppercase tracking-wider text-green-500 mb-2">Best Practice Recommendations</h3>
                            {Array.isArray(analysisResults.bestPractices) && analysisResults.bestPractices.length > 0 ? (
                              <div className="space-y-2 mt-2">
                                {analysisResults.bestPractices.map((bp: any, idx: number) => (
                                  <div key={idx} className="flex justify-between items-center text-sm border-b border-dark-700 pb-2 last:border-b-0 last:pb-0">
                                    <div className={isDarkMode ? 'text-gray-300' : 'text-gray-800'}>
                                      <span className="font-medium">{bp.type}</span>: <span className="opacity-80">{bp.description}</span>
                                    </div>
                                    <span className={`px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-900/40 text-blue-400`}>
                                      Priority {bp.priority}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm opacity-80">All standard security configurations align with best practices.</p>
                            )}
                          </div>

                          {/* Performance Metrics */}
                          <div className={`p-4 rounded-lg border ${isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                            <h3 className="text-sm font-semibold uppercase tracking-wider text-purple-500 mb-2">Performance Optimization</h3>
                            {Array.isArray(analysisResults.performance) && analysisResults.performance.length > 0 ? (
                              <div className="space-y-2 mt-2">
                                {analysisResults.performance.map((pm: any, idx: number) => (
                                  <div key={idx} className="text-sm border-b border-dark-700 pb-2 last:border-b-0 last:pb-0">
                                    <div className="flex justify-between font-medium">
                                      <span className={isDarkMode ? 'text-gray-300' : 'text-gray-800'}>{pm.metric}</span>
                                      <span className="text-purple-400">{pm.value}</span>
                                    </div>
                                    <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                      {pm.recommendation}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm opacity-80">Optimal performance metrics detected.</p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Attack Path Visualization */}
              <div className="mt-6">
                <AttackPathVisualization isDarkMode={isDarkMode} vulnerabilities={remediationVulnerabilities} />
              </div>

              {/* AI Explainer Section */}
              <section
                id="ai-explainer"
                ref={aiExplainerRef}
                className={`mt-6 p-6 rounded-xl shadow-lg transition-all duration-300 ${
                  isDarkMode ? 'bg-gray-800' : 'bg-white'
                } ${activeSection === 'ai-explainer' ? 'ring-2 ring-indigo-500' : ''}`}
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className={`text-xl font-medium ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>AI Security Assistant</h2>
                  <button
                    onClick={generateAISuggestions}
                    className={`flex items-center px-4 py-2 text-sm font-medium rounded-lg ${
                      isDarkMode
                        ? 'text-white bg-indigo-600 hover:bg-indigo-700'
                        : 'text-white bg-indigo-600 hover:bg-indigo-700'
                    }`}
                  >
                    <Bot className="w-4 h-4 mr-2" />
                    Generate Suggestions
                  </button>
                </div>

                <div className={`p-4 rounded-lg ${
                  isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
                }`}>
                  {aiSuggestions.length > 0 ? (
                    <div className="space-y-4">
                      {aiSuggestions.map((suggestion, index) => (
                        <div
                          key={index}
                          className={`p-3 rounded-lg ${
                            isDarkMode ? 'bg-gray-600' : 'bg-white'
                          }`}
                        >
                          <div className="flex items-start">
                            <Bot className={`w-5 h-5 mr-3 ${
                              isDarkMode ? 'text-indigo-400' : 'text-indigo-600'
                            }`} />
                            <p className={`text-sm ${
                              isDarkMode ? 'text-gray-300' : 'text-gray-700'
                            }`}>
                              {suggestion}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className={`text-sm ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      Click "Generate Suggestions" to get AI-powered security recommendations.
                    </p>
                  )}
                </div>
              </section>

              {/* Test Payloads Section */}
              <section
                id="test-payload"
                ref={testPayloadRef}
                className={`mt-6 p-6 rounded-xl shadow-lg transition-all duration-300 ${
                  isDarkMode ? 'bg-gray-800' : 'bg-white'
                } ${activeSection === 'test-payload' ? 'ring-2 ring-red-500' : ''}`}
              >
                <h2 className={`text-xl font-medium mb-4 ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>Custom Payload Testing</h2>
                <div className="space-y-4">
                  <div className="flex space-x-4">
                    <input
                      type="text"
                      value={customPayload}
                      onChange={(e) => setCustomPayload(e.target.value)}
                      placeholder="Enter custom payload"
                      className={`flex-1 px-4 py-2 rounded-lg border ${
                        isDarkMode
                          ? 'bg-gray-700 border-gray-600 text-white'
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    />
                    <button
                      onClick={testPayload}
                      disabled={isTesting}
                      className={`px-4 py-2 text-sm font-medium rounded-lg ${
                        isTesting
                          ? 'bg-gray-500 cursor-not-allowed'
                          : 'bg-red-600 hover:bg-red-700'
                      } text-white`}
                    >
                      {isTesting ? 'Testing...' : 'Test Payload'}
                    </button>
                  </div>

                  {testResults && (
                    <div className={`p-4 rounded-lg ${
                      isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
                    }`}>
                      <h3 className={`text-sm font-medium mb-2 ${
                        isDarkMode ? 'text-white' : 'text-gray-900'
                      }`}>Test Results</h3>
                      <div className="space-y-4">
                        {testResults.vulnerabilities?.map((vuln: any, index: number) => (
                          <div
                            key={index}
                            className={`p-3 rounded-lg ${
                              isDarkMode ? 'bg-gray-600' : 'bg-white'
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div>
                                <p className={`text-sm font-medium ${
                                  isDarkMode ? 'text-white' : 'text-gray-900'
                                }`}>
                                  {vuln.type.toUpperCase()}
                                </p>
                                <p className={`text-sm mt-1 ${
                                  isDarkMode ? 'text-gray-300' : 'text-gray-600'
                                }`}>
                                  {vuln.description}
                                </p>
                                <p className={`text-xs mt-1 ${
                                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                                }`}>
                                  {vuln.location}
                                </p>
                              </div>
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                vuln.severity === 'high'
                                  ? 'bg-red-100 text-red-700'
                                  : 'bg-yellow-100 text-yellow-700'
                              }`}>
                                {vuln.severity}
                              </span>
                            </div>
                          </div>
                        ))}

                        {testResults.recommendations && (
                          <div className="mt-4">
                            <h4 className={`text-sm font-medium mb-2 ${
                              isDarkMode ? 'text-white' : 'text-gray-900'
                            }`}>Recommendations</h4>
                            <ul className="list-disc list-inside space-y-1">
                              {testResults.recommendations.map((rec: string, index: number) => (
                                <li
                                  key={index}
                                  className={`text-sm ${
                                    isDarkMode ? 'text-gray-300' : 'text-gray-600'
                                  }`}
                                >
                                  {rec}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </section>
            </div>

            {/* Sidebar */}
            <div className="col-span-4 space-y-6">
              {/* AI Assistant */}
              <div className={`rounded-xl shadow-lg overflow-hidden ${
                isDarkMode ? 'bg-gray-800' : 'bg-white'
              }`}>
                <AIAssistant 
                  isDarkMode={isDarkMode} 
                  currentCode={code} 
                  onQuickFix={handleQuickFix}
                />
              </div>

              {/* Team Collaboration */}
              <TeamCollaboration isDarkMode={isDarkMode} />

              {/* Code Snippets */}
              <div className={`rounded-xl shadow-lg overflow-hidden ${
                isDarkMode ? 'bg-gray-800' : 'bg-white'
              }`}>
                <div className={`px-4 py-3 border-b ${
                  isDarkMode ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-gray-50'
                }`}>
                  <h2 className={`text-lg font-medium ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>Security Patterns</h2>
                </div>
                <div className="p-4 space-y-4">
                  {[...codeSnippets, ...securityPatterns].map((snippet) => (
                    <div
                      key={snippet.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        isDarkMode
                          ? 'border-gray-700 hover:border-blue-500'
                          : 'border-gray-200 hover:border-blue-500'
                      }`}
                      onClick={() => handleSnippetSelect(snippet)}
                    >
                      <h3 className={`font-medium ${
                        isDarkMode ? 'text-white' : 'text-gray-900'
                      }`}>{snippet.name}</h3>
                      <p className={`text-sm mt-1 ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-500'
                      }`}>{snippet.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Collaborators */}
              {showCollaborators && (
                <div className={`rounded-xl shadow-lg overflow-hidden ${
                  isDarkMode ? 'bg-gray-800' : 'bg-white'
                }`}>
                  <div className={`px-4 py-3 border-b ${
                    isDarkMode ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-gray-50'
                  }`}>
                    <h2 className={`text-lg font-medium ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>Collaborators</h2>
                  </div>
                  <div className="p-4 space-y-4">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium">
                        JD
                      </div>
                      <div className="ml-3">
                        <p className={`text-sm font-medium ${
                          isDarkMode ? 'text-white' : 'text-gray-900'
                        }`}>John Doe</p>
                        <p className={`text-xs ${
                          isDarkMode ? 'text-gray-400' : 'text-gray-500'
                        }`}>Viewing</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center text-white font-medium">
                        JS
                      </div>
                      <div className="ml-3">
                        <p className={`text-sm font-medium ${
                          isDarkMode ? 'text-white' : 'text-gray-900'
                        }`}>Jane Smith</p>
                        <p className={`text-xs ${
                          isDarkMode ? 'text-gray-400' : 'text-gray-500'
                        }`}>Editing</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Settings Panel */}
              {showSettings && (
                <div className={`rounded-xl shadow-lg overflow-hidden ${
                  isDarkMode ? 'bg-gray-800' : 'bg-white'
                }`}>
                  <div className={`px-4 py-3 border-b ${
                    isDarkMode ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-gray-50'
                  }`}>
                    <h2 className={`text-lg font-medium ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>Settings</h2>
                  </div>
                  <div className="p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className={`text-sm ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>Auto-save</span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={autoSave}
                          onChange={(e) => setAutoSave(e.target.checked)}
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className={`text-sm ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>Dark Mode</span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={isDarkMode}
                          onChange={(e) => setIsDarkMode(e.target.checked)}
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <Footer isDarkMode={isDarkMode} />

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className={`p-6 rounded-xl shadow-lg ${
            isDarkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <h3 className={`text-lg font-medium mb-4 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>Export Code</h3>
            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>Format</label>
                <select
                  value={exportFormat}
                  onChange={(e) => setExportFormat(e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border ${
                    isDarkMode
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                >
                  <option value="json">JSON</option>
                  <option value="txt">Text</option>
                </select>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowExportModal(false)}
                  className={`px-4 py-2 text-sm font-medium rounded-lg ${
                    isDarkMode
                      ? 'text-gray-300 hover:text-white'
                      : 'text-gray-700 hover:text-gray-900'
                  }`}
                >
                  Cancel
                </button>
                <button
                  onClick={handleExport}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                >
                  Export
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className={`p-6 rounded-xl shadow-lg ${
            isDarkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <h3 className={`text-lg font-medium mb-4 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>Share Code</h3>
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={shareLink}
                  readOnly
                  className={`flex-1 px-3 py-2 rounded-lg border ${
                    isDarkMode
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                />
                <button
                  onClick={() => copyToClipboard(shareLink)}
                  className={`p-2 rounded-lg ${
                    isDarkMode
                      ? 'bg-gray-700 hover:bg-gray-600 text-white'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  <Copy className="w-5 h-5" />
                </button>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowShareModal(false)}
                  className={`px-4 py-2 text-sm font-medium rounded-lg ${
                    isDarkMode
                      ? 'text-gray-300 hover:text-white'
                      : 'text-gray-700 hover:text-gray-900'
                  }`}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* History Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className={`p-6 rounded-xl shadow-lg max-w-2xl w-full ${
            isDarkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <h3 className={`text-lg font-medium mb-4 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>Code History</h3>
            <div className="space-y-4 max-h-[60vh] overflow-y-auto">
              {codeHistory.map((history) => (
                <div
                  key={history.id}
                  onClick={() => handleHistorySelect(history)}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    isDarkMode
                      ? 'border-gray-700 hover:border-blue-500'
                      : 'border-gray-200 hover:border-blue-500'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Clock className={`w-4 h-4 mr-2 ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-500'
                      }`} />
                      <span className={`text-sm ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        {new Date(history.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {history.vulnerabilities.length > 0 && (
                        <span className="flex items-center text-sm text-red-500">
                          <AlertTriangle className="w-4 h-4 mr-1" />
                          {history.vulnerabilities.length} issues
                        </span>
                      )}
                    </div>
                  </div>
                  <pre className={`mt-2 text-sm overflow-x-auto ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    {history.code.split('\n')[0]}...
                  </pre>
                </div>
              ))}
            </div>
            <div className="flex justify-end mt-4">
              <button
                onClick={() => setShowHistoryModal(false)}
                className={`px-4 py-2 text-sm font-medium rounded-lg ${
                  isDarkMode
                    ? 'text-gray-300 hover:text-white'
                    : 'text-gray-700 hover:text-gray-900'
                }`}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Back to Top Button */}
      <button
        onClick={scrollToTop}
        className={`fixed bottom-8 right-8 p-3 rounded-full shadow-lg transition-all duration-300 ${
          isDarkMode
            ? 'bg-gray-800 text-white hover:bg-gray-700'
            : 'bg-white text-gray-900 hover:bg-gray-100'
        }`}
        style={{ display: window.scrollY > 300 ? 'block' : 'none' }}
      >
        <ArrowUp className="w-6 h-6" />
      </button>
    </div>
  );
}; 