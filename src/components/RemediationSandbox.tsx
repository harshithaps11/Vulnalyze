import { useState, useEffect, useRef } from 'react';
import Editor, { Monaco } from '@monaco-editor/react';
import { AlertTriangle, CheckCircle, Users, MessageSquare } from 'lucide-react';
import { Vulnerability } from '../services/wasmService';

interface Collaborator {
  id: string;
  name: string;
  avatar: string;
  cursor: { line: number; column: number };
  color: string;
}

export interface RemediationSandboxProps {
  initialCode: string;
  onCodeChange: (newCode: string) => void;
  isDarkMode?: boolean;
}

export const RemediationSandbox = ({ initialCode, onCodeChange, isDarkMode = true }: RemediationSandboxProps) => {
  const [code, setCode] = useState(initialCode);
  const [vulnerabilities, setVulnerabilities] = useState<Vulnerability[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [showCollaborators, setShowCollaborators] = useState(false);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([
    {
      id: '1',
      name: 'John Doe',
      avatar: 'JD',
      cursor: { line: 1, column: 1 },
      color: '#FF5733'
    },
    {
      id: '2',
      name: 'Jane Smith',
      avatar: 'JS',
      cursor: { line: 5, column: 10 },
      color: '#33FF57'
    }
  ]);
  const [showChat, setShowChat] = useState(false);
  const [messages, setMessages] = useState<Array<{ user: string; text: string; timestamp: string }>>([]);
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<Monaco | null>(null);

  useEffect(() => {
    setCode(initialCode);
  }, [initialCode]);

  const handleEditorDidMount = (editor: any, monaco: Monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // Add custom theme
    monaco.editor.defineTheme('vulnalyze-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [],
      colors: {
        'editor.background': '#1a1a1a',
        'editor.foreground': '#d4d4d4',
        'editor.lineHighlightBackground': '#2a2a2a',
        'editor.selectionBackground': '#264f78',
        'editor.inactiveSelectionBackground': '#3a3d41'
      }
    });

    // Set the theme
    monaco.editor.setTheme(isDarkMode ? 'vulnalyze-dark' : 'vs-light');

    // Add decorations for collaborators
    collaborators.forEach(collaborator => {
      editor.createDecorationsCollection([{
        range: new monaco.Range(
          collaborator.cursor.line,
          collaborator.cursor.column,
          collaborator.cursor.line,
          collaborator.cursor.column
        ),
        options: {
          isWholeLine: false,
          className: 'collaborator-cursor',
          hoverMessage: { value: collaborator.name },
          glyphMarginClassName: 'collaborator-avatar',
          glyphMarginHoverMessage: { value: collaborator.name }
        }
      }]);
    });
  };

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      setCode(value);
      onCodeChange(value);
      scanCode(value);
    }
  };

  const handleCursorPositionChange = (event: any) => {
    const position = event.position;
    // Update cursor position for current user
    // In a real app, this would be sent to other collaborators
    console.log('Cursor position:', position);
  };

  const sendMessage = (text: string) => {
    const newMessage = {
      user: 'You',
      text,
      timestamp: new Date().toLocaleTimeString()
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const scanCode = async (codeToScan: string) => {
    setIsScanning(true);
    try {
      // TODO: Implement actual code scanning
      const mockVulnerabilities: Vulnerability[] = [
        {
          id: '1',
          type: 'xss',
          line: 3,
          description: 'Potential XSS vulnerability: Using innerHTML with user input',
          severity: 'high'
        },
        {
          id: '2',
          type: 'sql_injection',
          line: 7,
          description: 'Potential SQL injection: Unescaped user input in SQL query',
          severity: 'medium'
        }
      ];
      setVulnerabilities(mockVulnerabilities);
    } catch (error) {
      console.error('Error scanning code:', error);
    } finally {
      setIsScanning(false);
    }
  };

  const applyQuickFix = (vulnerability: Vulnerability) => {
    let fixedCode = code;
    const lines = code.split('\n');

    switch (vulnerability.type) {
      case 'xss':
        // Replace innerHTML with textContent
        const xssLine = lines[vulnerability.line - 1];
        if (xssLine.includes('innerHTML')) {
          lines[vulnerability.line - 1] = xssLine.replace('innerHTML', 'textContent');
        }
        break;
      case 'sql_injection':
        // Replace string concatenation with parameterized query
        const sqlLine = lines[vulnerability.line - 1];
        if (sqlLine.includes("'")) {
          lines[vulnerability.line - 1] = sqlLine.replace(/'/g, '?');
        }
        break;
      case 'command_injection':
        // Sanitize command input
        const cmdLine = lines[vulnerability.line - 1];
        if (cmdLine.includes('eval')) {
          lines[vulnerability.line - 1] = cmdLine.replace('eval', 'safeEval');
        }
        break;
    }

    fixedCode = lines.join('\n');
    setCode(fixedCode);
    onCodeChange(fixedCode);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setShowCollaborators(!showCollaborators)}
            className={`flex items-center px-3 py-1.5 text-sm font-medium rounded-lg ${
              isDarkMode
                ? 'text-white bg-gray-700 hover:bg-gray-600'
                : 'text-gray-700 bg-gray-100 hover:bg-gray-200'
            }`}
          >
            <Users className="w-4 h-4 mr-2" />
            Collaborators ({collaborators.length})
          </button>
          <button
            onClick={() => setShowChat(!showChat)}
            className={`flex items-center px-3 py-1.5 text-sm font-medium rounded-lg ${
              isDarkMode
                ? 'text-white bg-gray-700 hover:bg-gray-600'
                : 'text-gray-700 bg-gray-100 hover:bg-gray-200'
            }`}
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            Chat
          </button>
        </div>
      </div>

      <div className="flex-1 flex">
        <div className="flex-1 min-h-[500px] relative">
          <Editor
            height="100%"
            defaultLanguage="javascript"
            value={code}
            onChange={handleEditorChange}
            onMount={handleEditorDidMount}
            onCursorPositionChanged={handleCursorPositionChange}
            theme={isDarkMode ? 'vulnalyze-dark' : 'vs-light'}
            options={{
              minimap: { enabled: true },
              fontSize: 14,
              lineNumbers: 'on',
              roundedSelection: false,
              scrollBeyondLastLine: false,
              automaticLayout: true,
              wordWrap: 'on',
              suggestOnTriggerCharacters: true,
              quickSuggestions: true,
              parameterHints: { enabled: true },
              formatOnPaste: true,
              formatOnType: true,
              snippetSuggestions: 'inline',
              suggest: {
                showMethods: true,
                showFunctions: true,
                showConstructors: true,
                showFields: true,
                showVariables: true,
                showClasses: true,
                showStructs: true,
                showInterfaces: true,
                showModules: true,
                showProperties: true,
                showEvents: true,
                showOperators: true,
                showUnits: true,
                showValues: true,
                showConstants: true,
                showEnums: true,
                showEnumMembers: true,
                showKeywords: true,
                showWords: true,
                showColors: true,
                showFiles: true,
                showReferences: true,
                showFolders: true,
                showTypeParameters: true,
                showSnippets: true
              }
            }}
          />
        </div>

        {showCollaborators && (
          <div className={`w-64 ml-4 p-4 rounded-lg ${
            isDarkMode ? 'bg-gray-800' : 'bg-gray-50'
          }`}>
            <h3 className={`text-lg font-medium mb-4 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>Collaborators</h3>
            <div className="space-y-3">
              {collaborators.map(collaborator => (
                <div
                  key={collaborator.id}
                  className="flex items-center space-x-3"
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white font-medium"
                    style={{ backgroundColor: collaborator.color }}
                  >
                    {collaborator.avatar}
                  </div>
                  <div>
                    <p className={`text-sm font-medium ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>{collaborator.name}</p>
                    <p className={`text-xs ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>Line {collaborator.cursor.line}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {showChat && (
          <div className={`w-80 ml-4 p-4 rounded-lg ${
            isDarkMode ? 'bg-gray-800' : 'bg-gray-50'
          }`}>
            <h3 className={`text-lg font-medium mb-4 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>Chat</h3>
            <div className={`h-[400px] overflow-y-auto mb-4 space-y-4 ${
              isDarkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
              {messages.map((message, index) => (
                <div key={index} className="flex flex-col">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">{message.user}</span>
                    <span className="text-xs opacity-50">{message.timestamp}</span>
                  </div>
                  <p className="mt-1">{message.text}</p>
                </div>
              ))}
            </div>
            <div className="flex space-x-2">
              <input
                type="text"
                placeholder="Type a message..."
                className={`flex-1 px-3 py-2 rounded-lg border ${
                  isDarkMode
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    const input = e.target as HTMLInputElement;
                    sendMessage(input.value);
                    input.value = '';
                  }
                }}
              />
              <button
                className={`px-4 py-2 rounded-lg ${
                  isDarkMode
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                Send
              </button>
            </div>
          </div>
        )}
      </div>

      <div className={`mt-4 p-4 rounded-lg ${
        isDarkMode ? 'bg-gray-800' : 'bg-gray-50'
      }`}>
        <h3 className={`text-lg font-medium mb-2 ${
          isDarkMode ? 'text-white' : 'text-gray-900'
        }`}>Vulnerabilities</h3>
        {isScanning ? (
          <p className={`text-sm ${
            isDarkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>Scanning code...</p>
        ) : vulnerabilities.length > 0 ? (
          <div className="space-y-2">
            {vulnerabilities.map((vulnerability) => (
              <div
                key={vulnerability.id}
                className={`p-3 rounded-lg ${
                  isDarkMode ? 'bg-gray-700' : 'bg-white'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start">
                    <AlertTriangle className={`w-5 h-5 mr-2 ${
                      vulnerability.severity === 'high' ? 'text-red-500' :
                      vulnerability.severity === 'medium' ? 'text-yellow-500' :
                      'text-blue-500'
                    }`} />
                    <div>
                      <p className={`text-sm font-medium ${
                        isDarkMode ? 'text-white' : 'text-gray-900'
                      }`}>
                        {vulnerability.type.toUpperCase()} Vulnerability
                      </p>
                      <p className={`text-sm mt-1 ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        {vulnerability.description}
                      </p>
                      <p className={`text-xs mt-1 ${
                        isDarkMode ? 'text-gray-500' : 'text-gray-500'
                      }`}>
                        Line {vulnerability.line}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => applyQuickFix(vulnerability)}
                    className={`px-3 py-1 text-sm font-medium rounded-lg ${
                      isDarkMode
                        ? 'text-white bg-blue-600 hover:bg-blue-700'
                        : 'text-white bg-blue-600 hover:bg-blue-700'
                    }`}
                  >
                    Quick Fix
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className={`flex items-center text-sm ${
            isDarkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>
            <CheckCircle className="w-5 h-5 mr-2 text-green-500" />
            No vulnerabilities found
          </div>
        )}
      </div>
    </div>
  );
}; 