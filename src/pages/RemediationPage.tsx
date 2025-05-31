import { useState, useEffect, useRef } from 'react';
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
  const [code, setCode] = useState(exampleCode);
  const [activeTab, setActiveTab] = useState('editor');
  const [selectedSnippet, setSelectedSnippet] = useState<typeof codeSnippets[0] | null>(null);
  const [showCollaborators, setShowCollaborators] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
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
    // Apply dark mode class to body
    if (isDarkMode) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
  }, [isDarkMode]);

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

  // Initialize attack path visualization
  useEffect(() => {
    if (showAttackPath) {
      const svg = d3.select('#attack-path-svg');
      // Clear previous visualization
      svg.selectAll('*').remove();

      // Create attack path visualization
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

  // AI Explainer integration
  const generateAIExplanation = async (code: string) => {
    try {
      // TODO: Replace with actual Hugging Face API call
      const response = await fetch('https://api-inference.huggingface.co/models/gpt2', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.REACT_APP_HUGGINGFACE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ inputs: code }),
      });
      const data = await response.json();
      setAIExplanation(data[0].generated_text);
    } catch (error) {
      console.error('Error generating AI explanation:', error);
      setAIExplanation('Failed to generate explanation. Please try again.');
    }
  };

  // Custom payload testing
  const testCustomPayload = async (payload: string) => {
    try {
      // TODO: Implement actual payload testing
      const result = await fetch('/api/test-payload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ payload }),
      });
      return await result.json();
    } catch (error) {
      console.error('Error testing payload:', error);
      return { error: 'Failed to test payload' };
    }
  };

  const testPayload = async () => {
    if (!customPayload) return;
    
    setIsTesting(true);
    try {
      // Simulate payload testing
      const results = {
        status: 'success',
        vulnerabilities: [
          {
            type: 'xss',
            severity: 'high',
            description: 'XSS payload detected',
            location: 'Line 3'
          },
          {
            type: 'sql_injection',
            severity: 'medium',
            description: 'SQL injection attempt detected',
            location: 'Line 7'
          }
        ],
        recommendations: [
          'Use parameterized queries',
          'Implement input validation',
          'Add output encoding'
        ]
      };
      
      setTestResults(results);
    } catch (error) {
      console.error('Error testing payload:', error);
      setTestResults({ status: 'error', message: 'Failed to test payload' });
    } finally {
      setIsTesting(false);
    }
  };

  const generateAISuggestions = async () => {
    try {
      // Simulate AI suggestions
      const suggestions = [
        'Consider using DOMPurify for XSS prevention',
        'Implement input validation for SQL queries',
        'Use parameterized queries instead of string concatenation',
        'Add proper error handling for command execution'
      ];
      setAISuggestions(suggestions);
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
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className={`flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  isDarkMode
                    ? 'text-gray-900 bg-yellow-400 hover:bg-yellow-500'
                    : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {isDarkMode ? (
                  <Sun className="w-4 h-4 mr-2" />
                ) : (
                  <Moon className="w-4 h-4 mr-2" />
                )}
                {isDarkMode ? 'Light Mode' : 'Dark Mode'}
              </button>
              <button
                onClick={() => setShowSettings(!showSettings)}
                className={`flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  isDarkMode
                    ? 'text-white bg-gray-800 hover:bg-gray-700'
                    : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                }`}
              >
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </button>
              <button
                onClick={handleShare}
                className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </button>
              <button
                onClick={() => setShowHistoryModal(true)}
                className="flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
              >
                <History className="w-4 h-4 mr-2" />
                History
              </button>
              <button
                onClick={() => setShowAttackPath(!showAttackPath)}
                className={`flex items-center px-4 py-2 text-sm font-medium rounded-lg ${
                  isDarkMode
                    ? 'text-white bg-purple-600 hover:bg-purple-700'
                    : 'text-white bg-purple-600 hover:bg-purple-700'
                }`}
              >
                <Network className="w-4 h-4 mr-2" />
                Attack Path
              </button>
              <button
                onClick={() => scrollToSection(aiExplainerRef, 'ai-explainer')}
                className={`flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  activeSection === 'ai-explainer'
                    ? 'bg-indigo-700 text-white'
                    : isDarkMode
                    ? 'text-white bg-indigo-600 hover:bg-indigo-700'
                    : 'text-white bg-indigo-600 hover:bg-indigo-700'
                }`}
              >
                <Brain className="w-4 h-4 mr-2" />
                AI Explainer
              </button>
              <button
                onClick={() => scrollToSection(testPayloadRef, 'test-payload')}
                className={`flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  activeSection === 'test-payload'
                    ? 'bg-red-700 text-white'
                    : isDarkMode
                    ? 'text-white bg-red-600 hover:bg-red-700'
                    : 'text-white bg-red-600 hover:bg-red-700'
                }`}
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
                    />
                  ) : (
                    <div className={`h-[500px] flex items-center justify-center ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      Changes will appear here when you modify the code
                    </div>
                  )}
                </div>
              </div>

              {/* Attack Path Visualization */}
              <div className="mt-6">
                <AttackPathVisualization isDarkMode={isDarkMode} />
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