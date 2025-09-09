import { Scan, Vulnerability, User, Comment, TeamActivity } from '../types';
import { getRandomInt } from '../lib/utils';

// Mock Users
export const mockUsers: User[] = [
  {
    id: '1',
    name: 'Alex Morgan',
    email: 'alex@example.com',
    avatar: 'https://i.pravatar.cc/150?img=1',
    role: 'admin',
    isOnline: true,
  },
  {
    id: '2',
    name: 'Jordan Lee',
    email: 'jordan@example.com',
    avatar: 'https://i.pravatar.cc/150?img=2',
    role: 'member',
    isOnline: true,
  },
  {
    id: '3',
    name: 'Taylor Kim',
    email: 'taylor@example.com',
    avatar: 'https://i.pravatar.cc/150?img=3',
    role: 'member',
    isOnline: false,
  },
  {
    id: '4',
    name: 'Jamie Smith',
    email: 'jamie@example.com',
    avatar: 'https://i.pravatar.cc/150?img=4',
    role: 'member',
    isOnline: true,
  },
];

// Mock Scans
export const mockScans: Scan[] = [
  {
    id: '1',
    name: 'E-commerce Platform Scan',
    target: 'https://example-ecommerce.com',
    type: 'dynamic',
    status: 'completed',
    progress: 100,
    startedAt: '2025-04-15T10:30:00Z',
    completedAt: '2025-04-15T11:15:00Z',
    vulnerabilityCount: {
      critical: 2,
      high: 4,
      medium: 7,
      low: 12,
      info: 5,
    },
    creator: mockUsers[0],
  },
  {
    id: '2',
    name: 'Internal API Security Check',
    target: 'https://api.internal-example.com',
    type: 'static',
    status: 'running',
    progress: 68,
    startedAt: '2025-04-18T09:45:00Z',
    vulnerabilityCount: {
      critical: 1,
      high: 3,
      medium: 5,
      low: 8,
      info: 2,
    },
    creator: mockUsers[1],
  },
  {
    id: '3',
    name: 'Customer Portal Scan',
    target: 'https://portal.example.com',
    type: 'hybrid',
    status: 'scheduled',
    progress: 0,
    startedAt: '2025-04-20T14:00:00Z',
    vulnerabilityCount: {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      info: 0,
    },
    creator: mockUsers[2],
  },
  {
    id: '4',
    name: 'Marketing Website Security',
    target: 'https://www.example-marketing.com',
    type: 'dynamic',
    status: 'failed',
    progress: 37,
    startedAt: '2025-04-14T16:20:00Z',
    completedAt: '2025-04-14T16:35:00Z',
    vulnerabilityCount: {
      critical: 0,
      high: 1,
      medium: 3,
      low: 5,
      info: 2,
    },
    creator: mockUsers[0],
  },
];

// Mock Vulnerabilities
export const mockVulnerabilities: Vulnerability[] = [
  {
    id: '1',
    scanId: '1',
    title: 'SQL Injection in Login Form',
    description: 'The login form is vulnerable to SQL injection attacks, allowing attackers to bypass authentication.',
    severity: 'critical',
    location: '/login.php',
    lineNumber: 42,
    status: 'open',
    owasp: 'A1:2021-Injection',
    cwe: 'CWE-89',
    cvss: '9.8',
    remediation: 'Use prepared statements or parameterized queries instead of string concatenation.',
    assignedTo: mockUsers[1],
    createdAt: '2025-04-15T10:45:00Z',
    updatedAt: '2025-04-15T10:45:00Z',
  },
  {
    id: '2',
    scanId: '1',
    title: 'Cross-Site Scripting (XSS) in Comment Section',
    description: 'The comment section does not properly sanitize user input, allowing attackers to inject malicious scripts.',
    severity: 'high',
    location: '/products/view.php',
    lineNumber: 157,
    status: 'in-progress',
    owasp: 'A3:2021-Injection',
    cwe: 'CWE-79',
    cvss: '6.5',
    remediation: 'Implement proper input validation and output encoding.',
    assignedTo: mockUsers[2],
    createdAt: '2025-04-15T10:50:00Z',
    updatedAt: '2025-04-16T14:22:00Z',
  },
  {
    id: '3',
    scanId: '1',
    title: 'Insecure Direct Object Reference (IDOR)',
    description: 'The application allows users to access other users\' data by manipulating URL parameters.',
    severity: 'high',
    location: '/account/details.php',
    lineNumber: 88,
    status: 'open',
    owasp: 'A01:2021-Broken Access Control',
    cwe: 'CWE-639',
    cvss: '7.1',
    remediation: 'Implement proper access controls and validate user permissions before displaying data.',
    assignedTo: mockUsers[0],
    createdAt: '2025-04-15T11:05:00Z',
    updatedAt: '2025-04-15T11:05:00Z',
  },
  {
    id: '4',
    scanId: '1',
    title: 'Missing Content Security Policy',
    description: 'The application does not implement a Content Security Policy, making it vulnerable to various attacks.',
    severity: 'medium',
    location: 'HTTP Headers',
    status: 'open',
    owasp: 'A05:2021-Security Misconfiguration',
    cwe: 'CWE-1173',
    cvss: '5.4',
    remediation: 'Implement a proper Content Security Policy that restricts resource loading to trusted sources.',
    createdAt: '2025-04-15T11:10:00Z',
    updatedAt: '2025-04-15T11:10:00Z',
  },
  {
    id: '5',
    scanId: '2',
    title: 'Broken Authentication in Password Reset',
    description: 'The password reset functionality does not properly validate tokens, allowing attackers to reset any user\'s password.',
    severity: 'critical',
    location: '/auth/reset-password.js',
    lineNumber: 112,
    status: 'open',
    owasp: 'A07:2021-Identification and Authentication Failures',
    cwe: 'CWE-640',
    cvss: '9.1',
    remediation: 'Implement secure token generation and validation for password reset functionality.',
    assignedTo: mockUsers[3],
    createdAt: '2025-04-18T10:15:00Z',
    updatedAt: '2025-04-18T10:15:00Z',
  },
];

// Mock Comments
export const mockComments: Comment[] = [
  {
    id: '1',
    vulnerabilityId: '1',
    user: mockUsers[1],
    content: 'I\'ve started working on this. Will implement prepared statements.',
    createdAt: '2025-04-16T09:30:00Z',
  },
  {
    id: '2',
    vulnerabilityId: '1',
    user: mockUsers[0],
    content: 'Great! Make sure to also add input validation as an extra layer of security.',
    createdAt: '2025-04-16T09:45:00Z',
  },
  {
    id: '3',
    vulnerabilityId: '2',
    user: mockUsers[2],
    content: 'This might be more complex than initially thought. The XSS vulnerability exists in multiple places.',
    createdAt: '2025-04-16T14:20:00Z',
  },
  {
    id: '4',
    vulnerabilityId: '5',
    user: mockUsers[3],
    content: 'I\'ll implement a secure token generation system with proper expiration and one-time use.',
    createdAt: '2025-04-18T11:05:00Z',
  },
];

// Mock Team Activities
export const mockTeamActivities: TeamActivity[] = [
  {
    id: '1',
    type: 'scan',
    user: mockUsers[0],
    target: 'E-commerce Platform',
    details: 'Started a new security scan',
    timestamp: '2025-04-15T10:30:00Z',
  },
  {
    id: '2',
    type: 'assignment',
    user: mockUsers[0],
    target: 'SQL Injection in Login Form',
    details: 'Assigned to Jordan Lee',
    timestamp: '2025-04-15T11:20:00Z',
  },
  {
    id: '3',
    type: 'comment',
    user: mockUsers[1],
    target: 'SQL Injection in Login Form',
    details: 'Added a comment',
    timestamp: '2025-04-16T09:30:00Z',
  },
  {
    id: '4',
    type: 'status_change',
    user: mockUsers[2],
    target: 'Cross-Site Scripting (XSS)',
    details: 'Changed status to In Progress',
    timestamp: '2025-04-16T14:15:00Z',
  },
  {
    id: '5',
    type: 'scan',
    user: mockUsers[1],
    target: 'Internal API',
    details: 'Started a new security scan',
    timestamp: '2025-04-18T09:45:00Z',
  },
];

// Generate random scan logs
export const generateScanLogs = (count: number): string[] => {
  const actions = [
    'Checking for SQL injection vulnerabilities...',
    'Testing XSS protection...',
    'Scanning for CSRF vulnerabilities...',
    'Checking for insecure direct object references...',
    'Testing access control mechanisms...',
    'Scanning for security misconfigurations...',
    'Checking for insecure cryptographic storage...',
    'Testing for insecure communications...',
    'Checking for unvalidated redirects and forwards...',
    'Scanning for components with known vulnerabilities...',
    'Testing API endpoints for security issues...',
    'Checking authentication mechanisms...',
    'Scanning for insecure deserialization...',
    'Testing for XML External Entities (XXE)...',
    'Checking for sensitive data exposure...',
  ];
  
  const results = [
    'No vulnerabilities found',
    'Found potential vulnerability: investigating further',
    'Vulnerability detected: SQL injection possible',
    'Warning: weak password policy',
    'Critical: Authentication bypass detected',
    'High: Sensitive data exposure in response headers',
    'Medium: Missing security headers',
    'Low: Cookie without secure flag',
    'Info: Server version disclosure',
  ];
  
  const logs: string[] = [];
  for (let i = 0; i < count; i++) {
    const timestamp = new Date().toISOString();
    const isAction = getRandomInt(0, 10) > 3;
    const log = isAction 
      ? `[${timestamp}] ${actions[getRandomInt(0, actions.length - 1)]}` 
      : `[${timestamp}] ${results[getRandomInt(0, results.length - 1)]}`;
    logs.push(log);
  }
  
  return logs;
};

// Generate OWASP coverage data
export const owaspCoverageData = {
  labels: [
    'Broken Access Control', 
    'Cryptographic Failures', 
    'Injection', 
    'Insecure Design',
    'Security Misconfiguration',
    'Vulnerable Components',
    'Auth Failures',
    'Software Integrity',
    'Logging Failures',
    'SSRF'
  ],
  datasets: [
    {
      label: 'Coverage %',
      data: [85, 70, 90, 65, 80, 75, 85, 60, 50, 75],
      backgroundColor: '#3b82f6',
      borderColor: '#2563eb',
      borderWidth: 1,
    }
  ]
};

// Generate severity distribution data
export const severityDistributionData = {
  labels: ['Critical', 'High', 'Medium', 'Low', 'Info'],
  datasets: [
    {
      label: 'Vulnerabilities',
      data: [3, 8, 15, 25, 10],
      backgroundColor: [
        '#DC2626', // Critical - Red
        '#EA580C', // High - Orange
        '#F59E0B', // Medium - Amber
        '#10B981', // Low - Green
        '#3B82F6', // Info - Blue
      ],
      borderWidth: 0,
    }
  ]
};

// Current user
export const currentUser = mockUsers[0];