import { useState, useRef, useEffect } from 'react';
import { Bot, Send, Code, AlertTriangle, CheckCircle, Loader2, Shield, Lock } from 'lucide-react';
import { analyzeCodeWithAI, getCodeFix } from '../services/aiService';

interface Message {
  id: string;
  content: string;
  type: 'user' | 'assistant';
  timestamp: Date;
}

interface Vulnerability {
  type: string;
  severity: 'low' | 'medium' | 'high';
  description: string;
  location: string;
  fix?: string;
}

interface AIAssistantProps {
  isDarkMode: boolean;
  currentCode?: string;
  onQuickFix?: (fix: string) => void;
}

export const AIAssistant = ({ isDarkMode, currentCode, onQuickFix }: AIAssistantProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [vulnerabilities, setVulnerabilities] = useState<Vulnerability[]>([]);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Add initial welcome message
  useEffect(() => {
    const welcomeMessage: Message = {
      id: 'welcome',
      content: `Welcome to the AI Security Assistant! I can help you with:

1. Security analysis of your code
2. Code enhancement suggestions
3. Best practices implementation
4. Vulnerability fixes

What would you like me to help you with?`,
      type: 'assistant',
      timestamp: new Date(),
    };
    setMessages([welcomeMessage]);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const analyzeCode = (code: string): Vulnerability[] => {
    const vulns: Vulnerability[] = [];
    
    // Check for XSS vulnerabilities
    if (code.includes('innerHTML') || code.includes('document.write')) {
      vulns.push({
        type: 'XSS',
        severity: 'high',
        description: 'Potential Cross-Site Scripting vulnerability detected. Avoid using innerHTML or document.write with user input.',
        location: 'Found in code using innerHTML or document.write',
        fix: 'Use textContent or createTextNode instead of innerHTML. For HTML content, use DOMPurify to sanitize input.'
      });
    }

    // Check for SQL Injection
    if (code.includes('SELECT') && code.includes('+') && code.includes('query')) {
      vulns.push({
        type: 'SQL Injection',
        severity: 'high',
        description: 'Potential SQL Injection vulnerability detected. String concatenation in SQL queries is dangerous.',
        location: 'Found in SQL query construction',
        fix: 'Use parameterized queries or prepared statements instead of string concatenation.'
      });
    }

    // Check for Command Injection
    if (code.includes('eval(') || code.includes('exec(')) {
      vulns.push({
        type: 'Command Injection',
        severity: 'high',
        description: 'Potential Command Injection vulnerability detected. Avoid using eval() or exec() with user input.',
        location: 'Found in code using eval() or exec()',
        fix: 'Use safer alternatives to eval() and exec(). If necessary, implement strict input validation.'
      });
    }

    // Check for Missing Input Validation
    if (code.includes('function') && !code.includes('validate') && !code.includes('sanitize')) {
      vulns.push({
        type: 'Input Validation',
        severity: 'medium',
        description: 'Missing input validation detected. User input should be validated before processing.',
        location: 'Found in function parameters',
        fix: 'Implement input validation using a validation library or custom validation functions.'
      });
    }

    return vulns;
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      type: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setError(null);

    try {
      let response = '';
      const detectedVulns = currentCode ? analyzeCode(currentCode) : [];

      if (currentCode) {
        // Get AI analysis
        response = await analyzeCodeWithAI(currentCode, input);
        setVulnerabilities(detectedVulns);
      } else {
        response = "Please provide some code for me to analyze. You can paste your code in the editor above.";
      }
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response,
        type: 'assistant',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error getting AI response:', error);
      setError('Failed to get response. Please try again.');
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: 'Sorry, I encountered an error. Please try again.',
        type: 'assistant',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickFix = async (vuln: Vulnerability) => {
    if (!currentCode || !onQuickFix) return;

    try {
      setIsLoading(true);
      const fixedCode = await getCodeFix(currentCode, `${vuln.type}: ${vuln.description}`);
      
      // Clean up the response to get just the code
      const cleanCode = fixedCode.replace(/```javascript\n?|\n?```/g, '').trim();
      
      if (cleanCode) {
        onQuickFix(cleanCode);
        
        // Add a message about the fix
        const fixMessage: Message = {
          id: Date.now().toString(),
          content: `Applied fix for ${vuln.type} vulnerability.`,
          type: 'assistant',
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, fixMessage]);
      }
    } catch (error) {
      console.error('Error applying quick fix:', error);
      const errorMessage: Message = {
        id: Date.now().toString(),
        content: 'Failed to apply the fix. Please try again.',
        type: 'assistant',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`flex flex-col h-full ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
      {/* Chat Header */}
      <div className={`p-4 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="flex items-center space-x-2">
          <Shield className={`w-6 h-6 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
          <h2 className={`text-lg font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            AI Security Assistant
          </h2>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className={`p-4 border-b ${isDarkMode ? 'border-red-700 bg-red-900/20' : 'border-red-200 bg-red-50'}`}>
          <p className={`text-sm ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>
            {error}
          </p>
        </div>
      )}

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                message.type === 'user'
                  ? isDarkMode
                    ? 'bg-blue-600 text-white'
                    : 'bg-blue-600 text-white'
                  : isDarkMode
                  ? 'bg-gray-700 text-gray-200'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              <div className="flex items-start space-x-2">
                {message.type === 'assistant' && (
                  <Shield className={`w-5 h-5 mt-1 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                )}
                <div className="flex-1">
                  <p className="whitespace-pre-wrap">{message.content}</p>
                  <span className={`text-xs mt-1 block ${
                    message.type === 'user'
                      ? 'text-blue-200'
                      : isDarkMode
                      ? 'text-gray-400'
                      : 'text-gray-500'
                  }`}>
                    {message.timestamp.toLocaleTimeString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className={`max-w-[80%] rounded-lg p-3 ${
              isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
            }`}>
              <div className="flex items-center space-x-2">
                <Loader2 className={`w-5 h-5 animate-spin ${
                  isDarkMode ? 'text-blue-400' : 'text-blue-600'
                }`} />
                <span className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>
                  Analyzing code...
                </span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Vulnerabilities Section */}
      {vulnerabilities.length > 0 && (
        <div className={`p-4 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <h3 className={`text-sm font-medium mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Detected Vulnerabilities
          </h3>
          <div className="space-y-2">
            {vulnerabilities.map((vuln, index) => (
              <div
                key={index}
                className={`p-2 rounded-lg ${
                  isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className={`w-4 h-4 ${
                      vuln.severity === 'high' ? 'text-red-500' : 'text-yellow-500'
                    }`} />
                    <span className={`text-sm font-medium ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      {vuln.type}
                    </span>
                  </div>
                  {vuln.fix && (
                    <button
                      onClick={() => handleQuickFix(vuln)}
                      className={`text-xs px-2 py-1 rounded ${
                        isDarkMode
                          ? 'bg-blue-600 text-white hover:bg-blue-700'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      Quick Fix
                    </button>
                  )}
                </div>
                <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  {vuln.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className={`p-4 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="flex space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask about security, optimization, or code analysis..."
            className={`flex-1 px-4 py-2 rounded-lg border ${
              isDarkMode
                ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
            }`}
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className={`p-2 rounded-lg ${
              isLoading || !input.trim()
                ? isDarkMode
                  ? 'bg-gray-700 text-gray-500'
                  : 'bg-gray-100 text-gray-400'
                : isDarkMode
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}; 